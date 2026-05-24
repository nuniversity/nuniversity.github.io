---
title: "Arquitetura Spark"
description: "Explore a arquitetura Spark: driver, executores, gerenciadores de cluster incluindo Standalone, YARN e Kubernetes"
order: 2
duration: "30-40 minutos"
difficulty: "iniciante"
---

# Arquitetura Spark

Entender a arquitetura distribuída do Spark é essencial para escrever aplicações eficientes e diagnosticar problemas de desempenho. O Spark segue um padrão mestre-escravo com um driver central coordenando processos executores distribuídos.

## Arquitetura de Alto Nível

Aplicações Spark executam como conjuntos independentes de processos coordenados por um **SparkContext** no programa driver.

```
+---------------------+
|   Driver Program    |
|  (SparkContext)      |
+----------+----------+
           |
    Cluster Manager
  (Standalone/YARN/K8s)
           |
     +-----+------+
     |            |
+----+----+  +----+----+
| Executor |  | Executor |
| Core 1   |  | Core 1   |
| Core 2   |  | Core 2   |
| ...      |  | ...      |
+----------+  +----------+
```

## Driver

O driver é o coordenador central de uma aplicação Spark. Ele executa a função `main()` do usuário e cria o `SparkContext` (ou `SparkSession` no Spark moderno).

### Responsabilidades do Driver

1. **Converter código do usuário em tarefas**: O driver transforma transformações em um DAG (Directed Acyclic Graph) de estágios e tarefas
2. **Agendar tarefas**: Atribui tarefas a executores com base na localidade dos dados
3. **Coordenar execução**: Acompanha o progresso das tarefas, lida com falhas
4. **Gerenciar o SparkContext**: Mantém o estado e configuração da aplicação

> [!NOTE]
> O driver deve ser acessível por todos os executores via rede. Se a máquina do driver falhar, toda a aplicação falha. Para produção, execute drivers em infraestrutura resiliente.

## Executores

Executores são processos de trabalho que executam tarefas e armazenam dados.

### Responsabilidades dos Executores

1. **Executar tarefas**: Executam código atribuído pelo driver
2. **Armazenar dados**: Cacheiam RDDs, DataFrames ou variáveis de broadcast em memória ou disco
3. **Reportar resultados**: Enviam resultados de volta ao driver

### Configuração de Executores

Parâmetros chave de executor no `spark-submit`:

```bash
# 4 executores, cada um com 4 núcleos e 8GB de memória
spark-submit \
  --num-executors 4 \
  --executor-cores 4 \
  --executor-memory 8g \
  app.py
```

> [!WARNING]
> Solicitar muitos núcleos por executor (>5) pode causar contenção de E/S no HDFS. Uma regra prática é 3-5 núcleos por executor.

## Gerenciadores de Cluster

O Spark suporta vários gerenciadores de cluster que lidam com a alocação de recursos entre máquinas.

### Modo Standalone

Gerenciador de cluster simples integrado do Spark.

| Característica | Detalhes |
|---|---|
| **Configuração** | Iniciar scripts master e worker |
| **Escalabilidade** | Bom para clusters pequenos a médios |
| **Alta Disponibilidade** | Failover baseado em ZooKeeper |
| **Melhor para** | Aprendizado, desenvolvimento, pequenas implantações de produção |

```bash
# Iniciar cluster Standalone
./sbin/start-master.sh
./sbin/start-worker.sh spark://host:7077

# Submeter aplicação
spark-submit --master spark://host:7077 app.py
```

### Modo YARN

Gerenciador de recursos do Hadoop, ideal para clusters que já executam Hadoop.

| Característica | Detalhes |
|---|---|
| **Modos** | `yarn-client` (driver no cliente) e `yarn-cluster` (driver no YARN) |
| **Integração** | Perfeita com HDFS e outras ferramentas Hadoop |
| **Segurança** | Autenticação Kerberos, ACLs |
| **Alocação Dinâmica** | Suportada nativamente |
| **Melhor para** | Organizações que já usam o ecossistema Hadoop |

```bash
# Modo YARN cluster (driver executa dentro do YARN)
spark-submit --master yarn --deploy-mode cluster app.py

# Modo YARN client (driver executa na máquina submissora)
spark-submit --master yarn --deploy-mode client app.py
```

> [!NOTE]
> No modo `yarn-cluster`, o driver executa dentro de um container ApplicationMaster. Se falhar, o YARN o reinicia. Isso é mais resiliente que o modo `client`.

### Modo Kubernetes

Orquestração moderna de contêineres para executar Spark.

| Característica | Detalhes |
|---|---|
| **Implantação** | Contêineres Docker gerenciados por K8s |
| **Isolamento de Recursos** | Namespaces, cotas de recursos |
| **Auto-escalonamento** | Auto-escalonamento horizontal de pods |
| **Melhor para** | Arquiteturas cloud-native, organizações já no K8s |

```bash
# Modo Kubernetes
spark-submit \
  --master k8s://https://<k8s-api-server> \
  --deploy-mode cluster \
  --conf spark.kubernetes.container.image=spark:3.5 \
  --conf spark.kubernetes.authenticate.driver.serviceAccountName=spark \
  app.py
```

### Comparação de Gerenciadores de Cluster

| Característica | Standalone | YARN | Kubernetes |
|---|---|---|---|
| **Complexidade de Configuração** | Baixa | Média | Alta |
| **Escalabilidade** | Média | Alta | Alta |
| **Multi-inquilino** | Limitada | Excelente | Excelente |
| **Alocação Dinâmica** | Sim | Sim | Sim (v3.3+) |
| **Suporte a Contêineres** | Não | Não | Nativo |
| **Melhor para** | Dev/Pequena Prod | Ambientes Hadoop | Cloud Native |

## Ciclo de Vida da Aplicação

1. **Usuário submete aplicação** via `spark-submit`
2. **Driver inicia e conecta** ao gerenciador de cluster solicitando recursos
3. **Gerenciador de cluster aloca** contêineres executores
4. **Executores registram** com o driver
5. **Driver transforma** o código do usuário em um DAG, divide em estágios e tarefas
6. **Driver agenda** tarefas para executores com base na localidade dos dados
7. **Executores executam tarefas** e retornam resultados (ou fazem spill para disco)
8. **Aplicação completa** e libera todos os recursos

## Localidade dos Dados

Spark tenta agendar tarefas próximas aos seus dados para minimizar transferência de rede.

| Nível de Localidade | Descrição |
|---|---|
| **PROCESS_LOCAL** | Dados na mesma JVM da tarefa |
| **NODE_LOCAL** | Dados no mesmo nó (JVM diferente) |
| **RACK_LOCAL** | Dados no mesmo rack |
| **ANY** | Dados em qualquer lugar do cluster |

> [!SUCCESS]
> Localidade dos dados é uma das otimizações mais importantes do Spark. Processar dados onde eles já estão evita transferências de rede custosas.

## Partições e Paralelismo

Uma partição é um bloco lógico de dados processado por uma tarefa. O número de partições determina o paralelismo.

```
Arquivo: 1 GB no HDFS (tamanho do bloco 128 MB)
Partições: ~8 partições
Tarefas: Até 8 tarefas executando em paralelo
```

## Principais Conclusões

1. O **driver** coordena a aplicação e converte código em tarefas
2. **Executores** executam tarefas e armazenam dados em cache
3. **Gerenciadores de cluster** (Standalone, YARN, K8s) alocam recursos
4. Localidade dos dados minimiza sobrecarga de rede
5. A contagem de partições determina o nível de paralelismo
6. Escolher o gerenciador de cluster certo depende da sua infraestrutura

## Perguntas de Prática

1. Quais são os três principais componentes de uma aplicação Spark?
2. O que acontece se o processo driver falhar?
3. Por que você deve limitar a contagem de núcleos do executor para 3-5?
4. Qual é a diferença entre os modos de implantação `yarn-client` e `yarn-cluster`?
5. Quando você escolheria Kubernetes sobre YARN para Spark?
6. Explique os cinco níveis de localidade que o Spark usa para agendamento de tarefas.
7. Como o Spark determina o número de partições ao ler do HDFS?
8. Qual é o papel do gerenciador de cluster durante o ciclo de vida de uma aplicação Spark?
9. Por que a alocação dinâmica é útil em um cluster multi-inquilino?
10. Quais parâmetros de configuração controlam os recursos do executor?
