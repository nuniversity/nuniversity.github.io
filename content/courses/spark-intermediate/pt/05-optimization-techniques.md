---
title: "Técnicas de Otimização"
description: "Aprofunde-se no otimizador Catalyst, execução Tungsten, variáveis de broadcast e acumuladores para otimização de desempenho"
order: 5
duration: "35-45 minutos"
difficulty: "intermediário"
---

# Técnicas de Otimização

O desempenho do Spark vem de seu motor de otimização avançado. Entender o otimizador Catalyst, a execução Tungsten, variáveis de broadcast e acumuladores ajuda você a escrever aplicações Spark eficientes.

## Otimizador Catalyst

Catalyst é o otimizador de consultas do Spark SQL. Ele transforma consultas DataFrame/SQL em planos de execução física eficientes.

### Fases de Otimização

```
Código do Usuário -> Plano Lógico não Resolvido -> Plano Lógico Analisado
  -> Plano Lógico Otimizado -> Planos Físicos -> Plano Físico Selecionado
  -> RDDs (execução)
```

### Fase 1: Análise

Resolve nomes de colunas, tipos e referências a tabelas.

```python
df = spark.range(1000).select("id", col("id") * 2 as "doubled")
df.explain(True)
# == Parsed Logical Plan ==
# == Analyzed Logical Plan ==  <- tipos de coluna resolvidos
# == Optimized Logical Plan ==
# == Physical Plan ==
```

### Fase 2: Otimização Lógica

Aplica otimizações baseadas em regras:
- **Pushdown de predicados**: Move filtros para perto das fontes de dados
- **Poda de projeções**: Seleciona apenas as colunas necessárias cedo
- **Dobramento de constantes**: Avalia expressões constantes em tempo de compilação
- **Propagação de nulos**: Simplifica expressões que envolvem nulos

```python
# Exemplo: Catalyst empurra o filtro para a fonte de dados
df = spark.read.parquet("data/sales.parquet")
optimized = df.filter(col("amount") > 100).select("id", "amount")
optimized.explain()
# Filter empurrado para o scan Parquet (pushdown de predicados)
```

> [!SUCCESS]
> O pushdown de predicados é uma das otimizações mais impactantes. Ao ler Parquet, filtrar por uma coluna lê apenas os grupos de linhas relevantes, reduzindo drasticamente E/S.

### Fase 3: Planejamento Físico

Converte o plano lógico em um ou mais planos físicos e seleciona o mais barato usando otimização baseada em custo.

```python
# Mostra a seleção do plano físico
df.join(small_df, "key").explain(True)
# == Physical Plan ==
# BroadcastHashJoin ou SortMergeJoin escolhido baseado em estatísticas
```

### Fase 4: Geração de Código

Gera bytecode Java otimizado usando Tungsten.

## Motor de Execução Tungsten

Tungsten melhora o desempenho através de três mecanismos:

### 1. Gerenciamento de Memória Fora do Heap

```python
# Habilitar memória fora do heap
spark.conf.set("spark.memory.offHeap.enabled", "true")
spark.conf.set("spark.memory.offHeap.size", "2g")
```

Tungsten gerencia a memória diretamente usando `sun.misc.Unsafe`, evitando a sobrecarga do coletor de lixo JVM.

### 2. Computação Consciente de Cache

Os dados são organizados em formato binário compacto (unsafe rows) para eficiência de cache de CPU.

### 3. Geração de Código de Estágio Completo (WSCG)

```python
# Verificar se WSCG está habilitado
print(spark.conf.get("spark.sql.codegen.wholeStage"))
# true (padrão)

# Ver código gerado
df.explain("codegen")
```

> [!NOTE]
> A geração de código de estágio completo colapsa múltiplos operadores em uma única função, eliminando chamadas de função virtuais e aumentando a eficiência da CPU. É por isso que Spark SQL/DataFrames são mais rápidos que RDDs.

## Variáveis de Broadcast

Variáveis de broadcast permitem que você armazene em cache um valor grande somente leitura em cada executor, evitando shuffles custosos.

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("Broadcast").master("local[*]").getOrCreate()
sc = spark.sparkContext

# Criar uma variável de broadcast
lookup_table = {
    "NY": "New York",
    "SF": "San Francisco",
    "LA": "Los Angeles",
    "CHI": "Chicago"
}
broadcast_lookup = sc.broadcast(lookup_table)

# Usar em operações RDD
cities_rdd = sc.parallelize(["NY", "SF", "LA", "CHI", "NY", "SF"])
full_names = cities_rdd.map(lambda code: broadcast_lookup.value.get(code, "Unknown"))
print(full_names.collect())
# ['New York', 'San Francisco', 'Los Angeles', 'Chicago', 'New York', 'San Francisco']
```

### Broadcast vs Collect

| Aspecto | Broadcast | Collect |
|---|---|---|
| **Localização dos dados** | Copiado para cada executor | Enviado apenas ao driver |
| **Caso de uso** | Tabelas de consulta, modelos ML | Resultados pequenos para o driver |
| **Memória** | Uma cópia por executor | Uma cópia no driver |
| **Desempenho** | Rápido para executores | Gargalo no driver |

> [!WARNING]
> Variáveis de broadcast são somente leitura. Se precisar atualizá-las, destrua a variável antiga e crie uma nova. Transmitir uma variável maior que a memória do executor causa erros OOM.

### Broadcast em DataFrames

```python
# Hint de broadcast em DataFrame
from pyspark.sql.functions import broadcast

# Broadcast explícito de tabela pequena
large_df.join(broadcast(small_df), "key").explain()
# BroadcastHashJoin

# Verificar limiar de broadcast
print(spark.conf.get("spark.sql.autoBroadcastJoinThreshold"))
# 10485760 (10 MB)
```

### Broadcast de Modelos ML

```python
import pickle
from pyspark.ml.classification import LogisticRegressionModel

# Carregar modelo e transmitir para todos os executores
model = LogisticRegressionModel.load("models/lr_model")
broadcast_model = sc.broadcast(model)

# Aplicar modelo em paralelo
predictions = features_rdd.map(lambda features: broadcast_model.value.predict(features))
```

## Acumuladores

Acumuladores fornecem contadores distribuídos para agregar valores entre tarefas.

```python
# Criar acumuladores
total_rows = sc.accumulator(0)
total_errors = sc.accumulator(0)
empty_lines = sc.accumulator(0)

def process_line(line):
    total_rows.add(1)
    if not line.strip():
        empty_lines.add(1)
        return None
    if "ERROR" in line:
        total_errors.add(1)
    return line

rdd = sc.parallelize(["INFO: OK", "ERROR: Failed", "", "ERROR: Timeout", "INFO: Done"])
processed = rdd.map(process_line).filter(lambda x: x is not None)

# Ações disparam atualizações de acumuladores
result = processed.collect()

print(f"Total linhas: {total_rows.value}")     # 5
print(f"Linhas vazias: {empty_lines.value}")   # 1
print(f"Erros: {total_errors.value}")        # 2
```

> [!NOTE]
> Acumuladores só são atualizados quando uma ação é executada. Transformações podem computá-los múltiplas vezes (retentativas de tarefas). Acumuladores nomeados são visíveis na UI do Spark.

### Acumuladores Nomeados

```python
# Acumuladores nomeados aparecem na UI do Spark
from pyspark.util import InheritableThreadLocal

# Melhor abordagem: usar sc.accumulator com nome
from pyspark.accumulators import AccumulatorParam

class StringAccumulatorParam(AccumulatorParam):
    def zero(self, value):
        return ""
    def addInPlace(self, val1, val2):
        return val1 + val2

error_log = sc.accumulator("", StringAccumulatorParam())

def log_error(line):
    if "ERROR" in line:
        error_log.add(line + "\n")
    return line
```

### Casos de Uso de Acumuladores

```python
# Validação e métricas de qualidade
valid_rows = sc.accumulator(0)
invalid_rows = sc.accumulator(0)
null_fields = sc.accumulator(0)

def validate(row):
    try:
        if row["age"] < 0:
            invalid_rows.add(1)
            return None
        if row["name"] is None:
            null_fields.add(1)
        valid_rows.add(1)
        return row
    except Exception:
        invalid_rows.add(1)
        return None

# Monitoramento personalizado
bytes_processed = sc.accumulator(0)

def track_bytes(line):
    bytes_processed.add(len(line.encode("utf-8")))
    return line
```

## AQE (Execução Adaptativa de Consultas)

O AQE do Spark 3.x otimiza dinamicamente as consultas em tempo de execução.

```python
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
```

| Característica AQE | Benefício |
|---|---|
| **Coalescência dinâmica** | Reduz partições quando os dados são pequenos |
| **Troca dinâmica de join** | Muda para broadcast se estatísticas revelarem tabela pequena |
| **Manuseio dinâmico de skew** | Divide partições de join skew |
| **Leitor de shuffle local otimizado** | Evita shuffle quando possível |

## Lista de Verificação de Desempenho

1. **Use DataFrames/SQL** em vez de RDDs (Catalyst + Tungsten)
2. **Habilite AQE** para otimização dinâmica
3. **Transmita tabelas pequenas** com hints explícitos
4. **Armazene em cache resultados intermediários** usados por múltiplas ações
5. **Filtre cedo** (pushdown de predicados)
6. **Selecione apenas colunas necessárias** (poda de projeções)
7. **Evite UDFs** quando funções embutidas forem suficientes
8. **Use acumuladores** para monitoramento, não para lógica de negócio

## Perguntas de Prática

1. Quais são as quatro fases do otimizador Catalyst?
2. Como o pushdown de predicados melhora o desempenho das consultas?
3. O que é geração de código de estágio completo e por que é mais rápida?
4. Quando você usaria uma variável de broadcast em vez de um hint de broadcast join?
5. Como os acumuladores diferem das variáveis regulares?
6. O que acontece com o valor de um acumulador se uma tarefa falha e é repetida?
7. Por que o gerenciamento de memória fora do heap do Tungsten é mais rápido?
8. Quais três otimizações dinâmicas o AQE fornece?
9. Como você verifica se a geração de código de estágio completo está habilitada?
10. Que informação aparece em `df.explain("codegen")`?
