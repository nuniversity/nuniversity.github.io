---
title: "Programação Declarativa: SQL e HCL"
description: "Aprenda o paradigma declarativo: descreva o que quer, não como obter — usando SQL e HCL"
order: 9
duration: "35 minutes"
difficulty: "intermediate"
---

# Programação Declarativa: SQL e HCL

Todo paradigma de programação que você viu até agora é **imperativo**: você escreve instruções passo a passo descrevendo exatamente como alcançar um resultado. A **programação declarativa** inverte isso: você descreve o resultado desejado, e o sistema descobre como chegar lá.

## Imperativo vs Declarativo

**Imperativo** (como):

```javascript
// Passo a passo: como encontrar usuários maiores de 18
let resultado = [];
for (let i = 0; i < usuarios.length; i++) {
  if (usuarios[i].idade >= 18) {
    resultado.push(usuarios[i]);
  }
}
```

**Declarativo** (o quê):

```sql
-- Descreva o que quer, não como
SELECT * FROM usuarios WHERE idade >= 18;
```

Você não diz ao banco de dados como iterar, filtrar ou coletar resultados. Você apenas declara o que precisa.

## SQL: Structured Query Language

SQL é a linguagem declarativa mais amplamente usada. Ela permite consultar, inserir, atualizar e excluir dados em bancos de dados relacionais.

### SELECT — Recuperando Dados

```sql
SELECT nome, idade FROM usuarios;
```

Isso retorna as colunas `nome` e `idade` para cada linha na tabela `usuarios`.

### WHERE — Filtrando Linhas

```sql
SELECT * FROM produtos
WHERE preco < 50 AND categoria = 'Eletrônicos';
```

### ORDER BY — Ordenando

```sql
SELECT nome, salario FROM funcionarios
ORDER BY salario DESC;
```

### JOIN — Combinando Tabelas

Dados frequentemente estão espalhados por múltiplas tabelas. `JOIN` as conecta:

```sql
SELECT pedidos.id, clientes.nome, pedidos.total
FROM pedidos
JOIN clientes ON pedidos.cliente_id = clientes.id
WHERE pedidos.total > 100;
```

Esta consulta responde: "Quais clientes fizeram pedidos acima de R$100 e quais foram os valores?" — sem escrever um único loop.

### INSERT, UPDATE, DELETE

```sql
-- Adicionar um novo registro
INSERT INTO usuarios (nome, email) VALUES ('Alice', 'alice@exemplo.com');

-- Atualizar registros existentes
UPDATE usuarios SET idade = 31 WHERE nome = 'Alice';

-- Remover registros
DELETE FROM usuarios WHERE idade < 18;
```

> [!NOTE]
> SQL é declarativa no nível da instrução, mas nos bastidores o motor do banco de dados cria um plano de execução — ele decide a melhor forma de executar sua consulta.

## HCL: HashiCorp Configuration Language

HCL é usada pelo Terraform, uma ferramenta para gerenciar infraestrutura como código. Você declara qual infraestrutura deseja, e o Terraform a cria.

### Exemplo com Terraform

```hcl
# Declarar uma instância EC2 da AWS
resource "aws_instance" "servidor_web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"

  tags = {
    Name = "ServidorWeb"
  }
}
```

Isso define uma máquina virtual: a AMI (imagem), o tamanho da instância e as tags. Você não escreve código para chamar APIs de nuvem, tratar erros ou verificar estado — o Terraform cuida de tudo isso.

### Variáveis e Saídas

```hcl
variable "regiao" {
  description = "Região AWS"
  default     = "us-east-1"
}

resource "aws_instance" "servidor" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.tipo_instancia
}

output "ip_publico" {
  value = aws_instance.servidor.public_ip
}
```

### A Vantagem Declarativa

Com o Terraform, sua configuração de infraestrutura é:
- **Versionada** — armazenada no Git junto com seu código
- **Reprodutível** — mesma configuração produz mesma infraestrutura
- **Autodocumentável** — o arquivo de configuração descreve exatamente o que existe
- **Idempotente** — executar novamente não faz alterações se nada estiver desatualizado

## Exercício Prático

Escreva consultas SQL para um banco de dados de loja online:

```sql
-- 1. Encontrar todos os produtos abaixo de R$50
SELECT nome, preco FROM produtos WHERE preco < 50;

-- 2. Listar pedidos feitos em 2024 com nomes dos clientes
SELECT clientes.nome, pedidos.data, pedidos.total
FROM pedidos
JOIN clientes ON pedidos.cliente_id = clientes.id
WHERE pedidos.data >= '2024-01-01' AND pedidos.data < '2025-01-01'
ORDER BY pedidos.total DESC;

-- 3. Mostrar quantos produtos existem em cada categoria
SELECT categoria, COUNT(*) AS quantidade_produtos
FROM produtos
GROUP BY categoria
ORDER BY quantidade_produtos DESC;
```

## Resumo

| Conceito | Imperativo | Declarativo |
|----------|------------|-------------|
| Foco | Como fazer | O que obter |
| Exemplo SQL | Loop + filtro | `SELECT ... WHERE` |
| Infraestrutura | Chamadas API + scripts | `resource "tipo" "nome" { }` |
| Benefício chave | Controle total | Simplicidade, legibilidade, idempotência |

## Próximos Passos

Você completou o curso. Aprendeu os fundamentos da programação — variáveis, funções, fluxo de controle e estruturas de dados — e explorou três paradigmas principais: funcional (Python), compilado (Rust) e declarativo (SQL/HCL). Continue praticando e construindo!
