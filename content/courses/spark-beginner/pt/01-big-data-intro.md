---
title: "Introdução ao Big Data"
description: "Entenda o que é big data, os desafios que apresenta, o ecossistema Hadoop e como o MapReduce se compara ao Apache Spark"
order: 1
duration: "30-40 minutos"
difficulty: "iniciante"
---

# Introdução ao Big Data

Big data refere-se a conjuntos de dados tão grandes ou complexos que ferramentas tradicionais de processamento não conseguem lidar eficientemente. O Apache Spark surgiu como uma solução que supera as limitações de sistemas anteriores como o Hadoop MapReduce.

## O que é Big Data?

Big data é caracterizado pelos **5 V's**:

| V | Significado | Exemplo |
|---|---|---|
| **Volume** | Quantidade massiva de dados | Petabytes de logs de sensores |
| **Velocidade** | Velocidade de geração de dados | Milhões de tweets por minuto |
| **Variedade** | Diferentes formatos de dados | CSV, JSON, imagens, vídeo |
| **Veracidade** | Qualidade e confiabilidade dos dados | Leituras ruidosas de sensores |
| **Valor** | Insights de negócio a partir dos dados | Padrões de detecção de fraude |

> [!NOTE]
> O framework dos 5 V's ajuda organizações a determinar se realmente têm um problema de "big data" versus um problema regular de dados que bancos de dados tradicionais podem resolver.

### Volume

Organizações geram terabytes a petabytes de dados diariamente. Um único motor a jato produz vários terabytes de dados por voo. Plataformas de mídia social geram centenas de terabytes a cada dia. Sistemas RDBMS tradicionais atingem limites de escalabilidade em patamares muito mais baixos.

### Velocidade

Os dados fluem em velocidades sem precedentes. Os tickers do mercado de ações são atualizados em microssegundos, sensores IoT relatam leituras a cada segundo e logs de clickstream acumulam milhões de eventos por hora. O processamento deve acompanhar as taxas de ingestão.

### Variedade

Os dados chegam em formatos estruturados (tabelas de banco de dados), semiestruturados (JSON, XML, CSV) e não estruturados (texto, imagens, vídeo). Bancos de dados tradicionais são excelentes com dados estruturados, mas têm dificuldades com conteúdo não estruturado.

> [!WARNING]
> Muitos projetos falham porque tratam todos os dados da mesma forma. Cada formato tem requisitos únicos de parsing e considerações de armazenamento.

## Desafios do Big Data

1. **Armazenamento**: Sistemas de armazenamento tradicionais não escalam economicamente para petabytes
2. **Processamento**: Processamento em uma única máquina leva muito tempo ou falha completamente
3. **Transferência de Dados**: Mover grandes conjuntos de dados pela rede cria gargalos
4. **Tolerância a Falhas**: Falhas de hardware são comuns em escala — sistemas devem se recuperar automaticamente
5. **Lacuna de Habilidades**: Ferramentas de big data exigem conhecimento especializado

## O Ecossistema Hadoop

Hadoop foi a primeira plataforma de big data amplamente adotada. Seu ecossistema inclui:

### HDFS (Hadoop Distributed File System)
HDFS divide arquivos em blocos (padrão 128 MB) e os distribui entre os nós do cluster. Cada bloco é replicado (padrão 3x) para tolerância a falhas.

```
Arquivo: 1 GB de log
Blocos: 8 blocos de 128 MB
Replicação: 3 cópias de cada bloco
Armazenamento total usado: 3 GB
```

### Hadoop MapReduce
MapReduce processa dados em duas fases:
- **Map**: Transforma cada registro de entrada em pares chave-valor
- **Reduce**: Agrega valores por chave

> [!WARNING]
> MapReduce escreve resultados intermediários em disco entre as fases Map e Reduce. Essa E/S de disco o torna lento para cargas de trabalho iterativas e interativas.

### YARN (Yet Another Resource Negotiator)
YARN gerencia recursos do cluster, agendando aplicações entre os nós. Ele desacopla o gerenciamento de recursos do framework de processamento.

### Outros Componentes Hadoop
- **Hive**: Interface tipo SQL sobre o MapReduce
- **HBase**: Banco de dados NoSQL colunar no HDFS
- **Sqoop**: Transferência de dados entre Hadoop e bancos relacionais
- **Flume**: Ingestão de dados de log
- **Oozie**: Agendamento de fluxos de trabalho

## MapReduce vs Spark

| Aspecto | MapReduce | Apache Spark |
|---|---|---|
| **Modelo de Processamento** | Baseado em disco, dois estágios | Em memória, baseado em DAG |
| **Velocidade** | Lento (sobrecarga de E/S de disco) | Até 100x mais rápido em memória |
| **API** | Apenas Java | Python, Scala, Java, R, SQL |
| **Processamento Iterativo** | Ruim (escreve em disco a cada iteração) | Excelente (mantém dados em memória) |
| **Tempo Real** | Apenas lote | Lote, streaming, interativo |
| **Tolerância a Falhas** | Reexecução de tarefas | Linhagem RDD, reexecução de tarefas |
| **Suporte SQL** | Hive (separado) | Spark SQL (integrado) |
| **Suporte ML** | Mahout (separado) | MLlib (integrado) |
| **Processamento de Grafos** | Giraph (separado) | GraphX (integrado) |
| **Streaming** | Não nativo | Structured Streaming |

> [!SUCCESS]
> A principal vantagem do Spark é manter dados em memória entre operações, o que é transformador para algoritmos iterativos (aprendizado de máquina) e consultas interativas.

### Quando Escolher Spark sobre MapReduce

- **Algoritmos iterativos**: Treinamento de ML precisa de múltiplas passagens sobre os dados
- **Analytics interativos**: Consultas ad-hoc que exigem tempos de resposta rápidos
- **Cargas de trabalho de streaming**: Processamento de dados em tempo real
- **Pipelines multi-carga**: Combinando SQL, ML e streaming em uma aplicação

### Quando MapReduce Ainda Faz Sentido

- **Conjuntos de dados extremamente grandes que excedem a memória do cluster**
- **Clusters de baixo custo com RAM limitada**
- **Sistemas legados já investidos no ecossistema Hadoop**

## A Vantagem do Spark

Apache Spark fornece um motor de análise unificado para:
- **Processamento em lote** (DataFrames, RDDs)
- **Streaming** (Structured Streaming)
- **Aprendizado de máquina** (MLlib)
- **Processamento de grafos** (GraphX)
- **Analytics SQL** (Spark SQL)

Tudo a partir de uma única API, eliminando a necessidade de combinar ferramentas separadas.

> [!NOTE]
> Spark não inclui seu próprio sistema de armazenamento. Ele lê e escreve para HDFS, S3, GCS, Azure Blob Storage, Cassandra, HBase, fontes JDBC e mais.

## Caso de Uso: Pipeline de Análise de Logs

Um pipeline típico de big data usando Spark:

```
Logs Brutos (HDFS/S3)
    |
    v
Spark Batch/Streaming (limpeza, parsing)
    |
    v
Dados Transformados (Parquet no HDFS/S3)
    |
    v
Spark SQL (análise ad-hoc)
    |
    v
Dashboard de BI (Tableau, Superset)
```

## Principais Conclusões

1. Big data é definido por volume, velocidade, variedade, veracidade e valor
2. Hadoop forneceu a base, mas MapReduce é muito lento para cargas interativas/iterativas
3. Spark processa dados em memória usando um motor DAG, alcançando acelerações de 10-100x
4. Spark unificou lote, streaming, SQL, ML e processamento de grafos em um framework
5. Spark lê de armazenamento externo — é um motor de processamento, não um sistema de armazenamento

## Perguntas de Prática

1. Quais são os 5 V's do big data? Explique cada um.
2. Por que a E/S de disco é um gargalo no MapReduce mas não no Spark?
3. Como o HDFS alcança tolerância a falhas para dados armazenados?
4. Qual é o papel do YARN no ecossistema Hadoop?
5. Liste três cenários onde o Spark claramente supera o MapReduce.
6. O que acontece com os dados intermediários entre Map e Reduce no MapReduce?
7. Por que o Spark é particularmente adequado para algoritmos iterativos de aprendizado de máquina?
8. Como a abordagem unificada do Spark difere de combinar ferramentas Hadoop separadas?
9. Quais sistemas de armazenamento o Spark pode ler e escrever?
10. Dê um caso de uso do mundo real onde volume, velocidade e variedade de big data se aplicam.
