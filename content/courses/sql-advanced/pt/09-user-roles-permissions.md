---
title: "Funções de Usuário, Permissões e Segurança"
description: "Domine GRANT/REVOKE, gerenciamento de funções, segurança em nível de linha, criptografia, prevenção de injeção SQL e auditoria"
order: 9
duration: "90 minutos"
difficulty: advanced
---

# Funções de Usuário, Permissões e Segurança

## Controle de Acesso Baseado em Funções (RBAC)

A segurança do banco de dados segue o princípio do **menor privilégio**: conceda apenas as permissões necessárias.

### Criando Funções

```sql
-- Criar funções (PostgreSQL)
CREATE ROLE readonly;
CREATE ROLE readwrite;
CREATE ROLE admin WITH CREATEDB CREATEROLE;

-- Com capacidade de login
CREATE ROLE alice WITH LOGIN PASSWORD 'secure_password' INHERIT;
CREATE ROLE bob WITH LOGIN PASSWORD 'secure_password' VALID UNTIL '2025-01-01';

-- Conceder funções a usuários
GRANT readonly TO alice;
GRANT readwrite TO bob;
```

## GRANT e REVOKE

### Níveis de Privilégio

| Nível | Privilégios | Exemplo |
|---|---|---|
| Banco de dados | `CONNECT`, `CREATE`, `TEMPORARY` | `GRANT CONNECT ON DATABASE db TO readonly` |
| Esquema | `USAGE`, `CREATE` | `GRANT USAGE ON SCHEMA public TO readonly` |
| Tabela | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER` | `GRANT SELECT ON orders TO readonly` |
| Coluna | `SELECT(coluna)`, `UPDATE(coluna)` | `GRANT SELECT(name, email) ON users TO support_role` |
| Função | `EXECUTE` | `GRANT EXECUTE ON FUNCTION calculate_tax TO readonly` |

```sql
-- Concessões em nível de esquema
GRANT USAGE ON SCHEMA analytics TO readonly;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO readonly;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO readwrite;

-- Privilégios padrão (para objetos futuros)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO readonly;

-- Permissões em nível de coluna
GRANT SELECT (id, name, email) ON users TO support_role;
REVOKE SELECT (password_hash, ssn) ON users FROM support_role;
```

[!NOTE]
`ALTER DEFAULT PRIVILEGES` afeta apenas objetos criados pelo usuário que os define. Aplique-o como proprietário do objeto para comportamento consistente.

### REVOKE

```sql
-- Remover privilégios
REVOKE INSERT ON orders FROM readwrite;
REVOKE ALL PRIVILEGES ON SCHEMA public FROM readonly;

-- Cascata: revogar da função e de todos os membros
REVOKE ADMIN OPTION FOR readonly FROM alice CASCADE;
```

## Segurança em Nível de Linha (RLS)

RLS restringe quais linhas um usuário pode ver ou modificar com base em uma expressão de política.

```sql
-- Habilitar RLS em uma tabela
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Criar política: usuários só podem ver seus próprios pedidos
CREATE POLICY user_orders ON orders
    FOR ALL
    USING (customer_id = current_setting('app.current_user_id')::INT)
    WITH CHECK (customer_id = current_setting('app.current_user_id')::INT);

-- Criar política: equipe de suporte pode ver todos os pedidos
CREATE POLICY support_orders ON orders
    FOR SELECT
    USING (current_user IN (SELECT username FROM support_team));

-- Bypass de administrador (proprietário da tabela ou superusuário)
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
ALTER TABLE orders NO FORCE ROW LEVEL SECURITY;
```

### Exemplos de RLS

```sql
-- Isolamento multi-inquilino
CREATE TABLE tenant_data (
    tenant_id INT NOT NULL,
    data JSONB
);

ALTER TABLE tenant_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenant_data
    USING (tenant_id = current_setting('app.tenant_id')::INT);

-- Acesso baseado em horário
CREATE POLICY business_hours ON payroll
    FOR ALL
    USING (EXTRACT(HOUR FROM NOW()) BETWEEN 9 AND 17);

-- Dados históricos somente leitura
CREATE POLICY read_only_history ON orders_archive
    FOR SELECT USING (true)
    WITH CHECK (false);  -- sem INSERT/UPDATE/DELETE
```

[!WARNING]
Políticas RLS **não** são aplicadas ao proprietário da tabela ou superusuários. Use `FORCE ROW LEVEL SECURITY` para aplicar políticas a todos os usuários.

## Criptografia

### Criptografia em Nível de Coluna (pgcrypto)

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criptografar no momento da inserção
INSERT into users (email, ssn)
VALUES (
    'alice@example.com',
    pgp_sym_encrypt('123-45-6789', 'encryption_key')
);

-- Descriptografar na leitura
SELECT
    email,
    pgp_sym_decrypt(ssn, 'encryption_key') AS ssn
FROM users;
```

### Transparent Data Encryption (TDE)

| Banco de dados | Suporte TDE |
|---|---|
| PostgreSQL | Via extensão `pg_tde` ou criptografia de sistema de arquivos |
| SQL Server | TDE — transparente em nível de armazenamento |
| Oracle | Criptografia de tablespace TDE |
| MySQL | Criptografia de tablespace InnoDB |

```sql
-- PostgreSQL: usando extensão pg_tde
CREATE EXTENSION pg_tde;

SELECT pg_tde_add_key_provider_file('my-provider', '/path/to/key/file');
SELECT pg_tde_set_principal_key('my-key', 'my-provider');

CREATE TABLE sensitive_data (
    id SERIAL,
    payload TEXT
) USING tde;
```

### TLS para Conexões

```ini
# postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
ssl_ca_file = 'root.crt'
```

## Prevenção de Injeção SQL

### Consultas Parametrizadas (Preferido)

```python
# Python (psycopg2) — NUNCA use f-strings ou concatenação de strings
cursor.execute(
    "SELECT * FROM users WHERE email = %s AND status = %s",
    (email, status)
)
```

```java
// Java (JDBC)
PreparedStatement stmt = conn.prepareStatement(
    "SELECT * FROM users WHERE email = ? AND status = ?"
);
stmt.setString(1, email);
stmt.setString(2, status);
```

### Exemplos de Ataque de Injeção SQL

```sql
-- Consulta inocente
SELECT * FROM users WHERE email = 'alice@example.com';

-- Injeção: email = "' OR '1'='1"
SELECT * FROM users WHERE email = '' OR '1'='1';

-- Injeção: email = "'; DROP TABLE users; --"
SELECT * FROM users WHERE email = ''; DROP TABLE users; --'
```

### Técnicas de Defesa

| Técnica | Descrição |
|---|---|
| **Prepared statements** | Mais eficaz — separa código de dados |
| **Validação de entrada** | Verificação de tipo, limites de tamanho, listas de permissão |
| **Funções de escape** | `quote_ident()`, `quote_literal()` no PostgreSQL |
| **Menor privilégio** | Usuário da aplicação deve ter permissões mínimas |
| **ORMs** | ORMs modernos usam consultas parametrizadas por padrão |

```sql
-- SQL dinâmico seguro em funções
EXECUTE 'SELECT * FROM ' || quote_ident(table_name) || ' WHERE id = $1'
USING id_value;
```

[!IMPORTANT]
Concatenação de strings de entrada do usuário em SQL é a causa #1 de violações de dados. Use consultas parametrizadas em todos os lugares.

## Auditoria

### Auditoria Baseada em Trigger

```sql
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id BIGINT,
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, old_data, new_data, changed_by)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb END,
        current_setting('app.current_user', TRUE)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Anexar a tabelas
CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

### Auditoria Integrada: PostgreSQL

```ini
# postgresql.conf
log_connections = on
log_disconnections = on
log_statement = 'ddl'  # 'none', 'ddl', 'mod', 'all'
log_duration = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a'
```

## Checklist de Segurança

| Área | Verificação |
|---|---|
| Autenticação | Senhas fortes, MFA, autenticação por certificado |
| Rede | Regras de firewall, SSL/TLS, rede privada |
| Funções | Permissões mínimas, sem contas compartilhadas |
| RLS | Habilitado para tabelas multi-inquilino |
| Criptografia | Em repouso (TDE/pgcrypto) e em trânsito (SSL) |
| Injeção | Consultas parametrizadas em todos os lugares |
| Auditoria | Registrar todas as alterações de esquema e DML sensível |
| Segredos | Use cofre ou variáveis de ambiente, não código |

## Perguntas de Prática

1. Crie uma função `readonly` e conceda a ela SELECT em todas as tabelas existentes e futuras no esquema `public`.
2. Qual é a diferença entre `GRANT` com e sem `WITH ADMIN OPTION`?
3. Habilite RLS em uma tabela `documents` para que usuários só possam ver seus próprios documentos, mas administradores possam ver tudo.
4. Escreva uma política que impeça a exclusão de registros de `orders_archive` mas permita SELECT.
5. Como você criptografaria a coluna `ssn` em uma tabela `employees` usando `pgcrypto`?
6. Quais são três técnicas de prevenção de injeção SQL? Dê um exemplo de código para cada.
7. Crie um trigger de auditoria que registre todas as operações UPDATE na tabela `accounts` incluindo saldos antigos e novos.
8. Explique o princípio do menor privilégio. Como você o aplicaria a uma aplicação de relatórios?
9. Escreva uma declaração `REVOKE` que remova a permissão INSERT em `orders` da função `readwrite`.
10. Como `FORCE ROW LEVEL SECURITY` difere de habilitar RLS sem FORCE? Quando você o usaria?
