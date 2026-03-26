---
title: "Domínio 2.2 — Recursos de Governança de Dados"
description: "Aprenda como o Snowflake protege e governa dados: Dynamic Data Masking, Row Access Policies, marcação de objetos (object tagging), classificação de dados, políticas de privacidade, Trust Center, gerenciamento de chaves de criptografia e linhagem de dados."
order: 8
difficulty: intermediate
duration: "70 min"
---

# Domínio 2.2 — Recursos de Governança de Dados

## Peso no Exame

O **Domínio 2.0** representa **~20%** do exame. A governança de dados é cada vez mais crítica para organizações orientadas à conformidade.

> [!NOTE]
> Esta lição corresponde ao **Objetivo de Exame 2.2**: *Definir recursos de governança de dados e como são usados*, incluindo mascaramento de dados, segurança em nível de linha e coluna, marcação de objetos, políticas de privacidade, Trust Center, gerenciamento de chaves de criptografia, alertas, notificações, replicação de dados e linhagem de dados.

---

## Segurança em Nível de Coluna — Dynamic Data Masking (Mascaramento Dinâmico de Dados)

O **Dynamic Data Masking** oculta ou ofusca valores de colunas sensíveis no momento da query com base na role do usuário — sem alterar os dados subjacentes:

```sql
-- Criar uma masking policy (política de mascaramento)
CREATE MASKING POLICY mascara_email AS (val STRING) RETURNS STRING ->
    CASE
        WHEN CURRENT_ROLE() IN ('ANALISTA_PII', 'DONO_DADOS') THEN val
        ELSE REGEXP_REPLACE(val, '.+\@', '*****@')  -- ocultar tudo antes do @
    END;

-- Aplicar a uma coluna
ALTER TABLE clientes
    MODIFY COLUMN email SET MASKING POLICY mascara_email;

-- Analista com role completa vê: joana.silva@exemplo.com
-- Analista sem role vê:          *****@exemplo.com
```

**Fatos-chave para o exame:**
- Masking policies são aplicadas no **nível de coluna**
- São avaliadas no **momento da query** — os dados originais não são alterados
- Requer **edição Enterprise ou superior**
- Uma coluna pode ter apenas **uma masking policy** aplicada por vez
- A política pode ser **condicional** (máscaras diferentes para roles diferentes)

### Mascaramento Condicional

```sql
-- Mascarar salário com base no acesso ao departamento
CREATE MASKING POLICY mascara_salario AS (sal NUMBER, depto STRING) RETURNS NUMBER ->
    CASE
        WHEN CURRENT_ROLE() = 'RH_ADMIN' THEN sal
        WHEN CURRENT_ROLE() = 'GERENTE' AND CURRENT_USER() = depto THEN sal
        ELSE -1  -- retornar -1 para usuários não autorizados
    END;

ALTER TABLE funcionarios
    MODIFY COLUMN salario SET MASKING POLICY mascara_salario USING (salario, departamento);
```

---

## Segurança em Nível de Linha — Row Access Policies (Políticas de Acesso por Linha)

As **Row Access Policies** controlam quais **linhas** um usuário pode ver em uma tabela ou view — sem criar views separadas por role:

```sql
-- Criar uma row access policy
CREATE ROW ACCESS POLICY acesso_regional AS (regiao STRING) RETURNS BOOLEAN ->
    CASE
        WHEN CURRENT_ROLE() = 'ADMIN_GLOBAL' THEN TRUE
        WHEN CURRENT_ROLE() = 'ANALISTA_BR' AND regiao = 'BRASIL' THEN TRUE
        WHEN CURRENT_ROLE() = 'ANALISTA_EUA' AND regiao = 'EUA' THEN TRUE
        ELSE FALSE
    END;

-- Aplicar a uma tabela
ALTER TABLE pedidos
    ADD ROW ACCESS POLICY acesso_regional ON (regiao_pedido);

-- ANALISTA_BR vê apenas pedidos do Brasil
-- ANALISTA_EUA vê apenas pedidos dos EUA
-- ADMIN_GLOBAL vê todas as linhas
```

**Fatos-chave para o exame:**
- As Row Access Policies filtram linhas **de forma invisível** — linhas não autorizadas simplesmente não aparecem
- Requer **edição Enterprise ou superior**
- Aplicadas no **nível de tabela ou view** em colunas específicas
- Uma tabela pode ter **uma row access policy** aplicada

> [!WARNING]
> As Row Access Policies são avaliadas **no momento da query** nas colunas de filtragem. Usar funções como `CURRENT_ROLE()`, `CURRENT_USER()` ou tabelas de mapeamento personalizadas é um padrão comum.

---

## Object Tagging (Marcação de Objetos)

A **marcação de objetos** permite anexar **metadados de chave-valor** a objetos do Snowflake (tabelas, colunas, schemas, warehouses, etc.) para rastreamento de governança:

```sql
-- Criar uma tag
CREATE TAG sensibilidade ALLOWED_VALUES 'publico', 'interno', 'confidencial', 'restrito';
CREATE TAG tipo_pii COMMENT = 'Tipo de dado PII';

-- Aplicar tags a objetos
ALTER TABLE clientes MODIFY COLUMN email SET TAG tipo_pii = 'endereco_email';
ALTER TABLE clientes MODIFY COLUMN cpf SET TAG sensibilidade = 'restrito';
ALTER TABLE clientes SET TAG sensibilidade = 'confidencial';

-- Consultar tags via ACCOUNT_USAGE
SELECT *
FROM SNOWFLAKE.ACCOUNT_USAGE.TAG_REFERENCES
WHERE TAG_NAME = 'SENSIBILIDADE'
AND TAG_VALUE = 'restrito';
```

**Casos de uso para tags:**
- Rastrear classificações de sensibilidade de dados
- Identificar colunas PII automaticamente
- Habilitar masking policies baseadas em tags
- Atribuição de custos por workload/projeto
- Relatórios de conformidade (ex.: encontrar todos os dados PII)

---

## Data Classification (Classificação de Dados)

A **Data Classification** escaneia automaticamente colunas de tabelas e sugere **tags definidas pelo sistema** para categorias de dados sensíveis (PII, financeiros, etc.):

```sql
-- Classificar uma tabela (retorna tags sugeridas)
SELECT SYSTEM$CLASSIFY('analytics.public.clientes', {});

-- Aplicar classificações sugeridas
SELECT SYSTEM$CLASSIFY_SCHEMA('analytics.public', {});
```

O motor de classificação do Snowflake identifica padrões como:
- Endereços de email → `SEMANTIC_CATEGORY:EMAIL`
- Números de telefone → `SEMANTIC_CATEGORY:PHONE_NUMBER`
- Números de cartão de crédito → `PRIVACY_CATEGORY:IDENTIFIER`
- Nomes → `SEMANTIC_CATEGORY:NAME`

---

## Privacy Policies (Políticas de Privacidade)

As **privacy policies** (também chamadas de **projection policies**) impedem que certas colunas sejam consultadas diretamente — a coluna ainda pode ser usada em cláusulas WHERE para filtragem, mas não pode ser retornada em resultados SELECT:

```sql
CREATE PROJECTION POLICY proteger_cpf AS () RETURNS PROJECTION_CONSTRAINT ->
    CASE
        WHEN CURRENT_ROLE() IN ('RH_ADMIN') THEN PROJECTION_CONSTRAINT(ALLOW => TRUE)
        ELSE PROJECTION_CONSTRAINT(ALLOW => FALSE)  -- coluna não pode ser SELECTada
    END;

ALTER TABLE funcionarios
    MODIFY COLUMN cpf SET PROJECTION POLICY proteger_cpf;
```

---

## Trust Center (Centro de Confiança)

O **Trust Center** é a ferramenta integrada de **gerenciamento de postura de segurança** do Snowflake — avalia sua conta em relação às melhores práticas de segurança do Snowflake e padrões da indústria:

```sql
-- Acessar o Trust Center no Snowsight: Admin → Trust Center

-- Alternativamente, consultar via SQL
SELECT *
FROM SNOWFLAKE.LOCAL.SECURITY_CENTER_FINDINGS
ORDER BY SEVERITY DESC;
```

Verificações do Trust Center incluem:
- Imposição de MFA para o ACCOUNTADMIN
- Políticas de senha
- Cobertura de network policy
- Usuários/roles não utilizados
- Roles com privilégios excessivos

> [!NOTE]
> O Trust Center é uma **ferramenta de avaliação somente leitura** — identifica problemas, mas não os corrige automaticamente. Alinha-se com benchmarks CIS do Snowflake e frameworks similares de segurança.

---

## Gerenciamento de Chaves de Criptografia

### Padrão: Chaves Gerenciadas pelo Snowflake

Por padrão, o Snowflake gerencia todas as chaves de criptografia usando um **modelo hierárquico de chaves**:
- Chave Mestra da Conta → Chave Mestra da Tabela → Chave do Arquivo
- As chaves são rotacionadas automaticamente

### Tri-Secret Secure (Chaves Gerenciadas pelo Cliente)

O **Tri-Secret Secure** permite que os clientes mantenham uma **chave mestra composta** — a chave de criptografia é derivada tanto da chave do Snowflake quanto da chave do cliente:

- Disponível apenas na **edição Business Critical**
- Usa AWS KMS, Azure Key Vault ou Google Cloud KMS
- Se o cliente revogar sua chave → o Snowflake não consegue mais descriptografar os dados
- Oferece máxima soberania de dados

```sql
-- Configurar o Tri-Secret Secure (feito no momento do provisionamento da conta)
-- Gerenciado via integração de gerenciamento de chaves do provedor de nuvem
```

---

## Alertas e Notificações

### Alertas (Alerts)

Os **Alerts** do Snowflake executam uma verificação de condição em um cronograma e disparam uma **ação** (enviar notificação, registrar log) quando a condição é atendida:

```sql
-- Criar um alerta que dispara quando a contagem de erros excede um limiar
CREATE ALERT taxa_erro_alta
    WAREHOUSE = WH_MONITOR
    SCHEDULE = '5 MINUTE'
    IF (EXISTS (
        SELECT 1 FROM log_erros
        WHERE horario_erro > DATEADD('minute', -5, CURRENT_TIMESTAMP)
        HAVING count(*) > 100
    ))
    THEN
        CALL SYSTEM$SEND_EMAIL(
            'minha_integracao_email',
            'alertas@empresa.com',
            'Alta taxa de erros detectada',
            'Mais de 100 erros nos últimos 5 minutos'
        );

-- Alertas devem ser retomados para ativar
ALTER ALERT taxa_erro_alta RESUME;
```

### Notificações

O Snowflake suporta notificações de saída via:
- **Email** (`SYSTEM$SEND_EMAIL`)
- **SNS / Pub/Sub / Event Grid** (serviços de notificação em nuvem)
- **Webhooks**

```sql
-- Criar uma integração de notificação por email
CREATE NOTIFICATION INTEGRATION meu_email
    TYPE = EMAIL
    ENABLED = TRUE
    ALLOWED_RECIPIENTS = ('alertas@empresa.com', 'ops@empresa.com');
```

---

## Replicação de Dados e Failover

A **Database Replication** (Replicação de Banco de Dados) copia bancos de dados entre regiões e provedores de nuvem para **recuperação de desastres** e **distribuição de dados**:

```sql
-- Habilitar replicação em um banco de dados (conta primária)
ALTER DATABASE analytics ENABLE REPLICATION TO ACCOUNTS aws.us_east_replica;

-- Atualizar a réplica (conta secundária)
ALTER DATABASE analytics REFRESH;

-- Failover: promover réplica como primária
ALTER DATABASE analytics PRIMARY;
```

**Replication Group** — replicar múltiplos bancos de dados + outros objetos juntos:

```sql
CREATE REPLICATION GROUP meu_grupo_replicacao
    OBJECT_TYPES = DATABASES, ROLES, USERS
    ALLOWED_DATABASES = analytics, staging
    ALLOWED_ACCOUNTS = 'minhaorg.recuperacao_desastres';
```

**Failover Group** — adiciona capacidade de failover automático:

```sql
CREATE FAILOVER GROUP meu_grupo_failover
    OBJECT_TYPES = DATABASES, ROLES
    ALLOWED_DATABASES = analytics
    ALLOWED_ACCOUNTS = 'minhaorg.conta_dr'
    REPLICATION_SCHEDULE = '10 MINUTE';
```

---

## Linhagem de Dados (Data Lineage)

O Snowflake fornece **linhagem de dados** por meio de:

### Access History

`SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY` — rastreia quais objetos foram acessados (leitura/escrita) em cada query:

```sql
SELECT
    query_start_time,
    user_name,
    query_text,
    base_objects_accessed,
    direct_objects_accessed,
    objects_modified
FROM SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY
WHERE query_start_time > DATEADD('day', -7, CURRENT_TIMESTAMP);
```

### Dependências de Objetos

```sql
-- Verificar quais views dependem de uma tabela
SELECT *
FROM SNOWFLAKE.ACCOUNT_USAGE.OBJECT_DEPENDENCIES
WHERE REFERENCED_OBJECT_NAME = 'PEDIDOS';
```

---

## Questões de Prática

**Q1.** Um analista consulta uma tabela com uma Dynamic Data Masking policy na coluna `email`. A role do analista não está listada como autorizada. O que o analista vê?

- A) Uma mensagem de erro
- B) A coluna fica oculta dos resultados
- C) O valor mascarado (ex.: *****@dominio.com) ✅
- D) Um valor NULL

**Q2.** Uma empresa precisa que analistas da região Brasil vejam apenas linhas do Brasil na tabela `pedidos`. Qual recurso implementa isso sem criar views separadas?

- A) Dynamic Data Masking
- B) Segurança em nível de coluna
- C) Row Access Policy ✅
- D) Secure View

**Q3.** Qual edição do Snowflake é necessária para usar Dynamic Data Masking e Row Access Policies?

- A) Standard
- B) Enterprise ✅
- C) Business Critical
- D) Virtual Private Snowflake

**Q4.** Uma empresa quer ter a capacidade de revogar a habilidade do Snowflake de descriptografar seus dados revogando uma chave que ela controla. Qual recurso possibilita isso?

- A) Network Policies
- B) Column-level Masking
- C) Tri-Secret Secure ✅
- D) Imposição de MFA

**Q5.** Qual ferramenta do Snowflake avalia uma conta em relação às melhores práticas de segurança e identifica problemas como roles com privilégios excessivos?

- A) Schema ACCOUNT_USAGE
- B) Resource Monitor
- C) Trust Center ✅
- D) Network Policy

**Q6.** As object tags no Snowflake podem ser aplicadas em quais nível(is)?

- A) Apenas colunas de tabelas
- B) Apenas tabelas e schemas
- C) Tabelas, colunas, schemas, bancos de dados, warehouses e mais ✅
- D) Apenas objetos de nível de conta

---

> [!SUCCESS]
> **Pontos-Chave para o Dia do Exame:**
> 1. **Dynamic Data Masking** = segurança em nível de coluna, mascara no momento da query, dados não alterados
> 2. **Row Access Policy** = segurança em nível de linha, filtra linhas no momento da query
> 3. Ambos requerem **edição Enterprise ou superior**
> 4. **Object Tagging** = metadados de chave-valor em qualquer objeto do Snowflake
> 5. **Trust Center** = ferramenta de avaliação de postura de segurança (somente leitura)
> 6. **Tri-Secret Secure** = chave composta gerenciada pelo cliente → apenas Business Critical
