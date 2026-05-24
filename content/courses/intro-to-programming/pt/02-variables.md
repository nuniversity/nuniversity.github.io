---
title: "Entendendo Variáveis"
description: "Aprenda a armazenar e manipular dados usando variáveis"
order: 2
duration: "25 minutes"
difficulty: "beginner"
---

# Entendendo Variáveis

Variáveis são os blocos fundamentais de qualquer programa. Elas permitem armazenar, ler e modificar dados enquanto seu programa executa.

## O que é uma Variável?

Uma variável é um contêiner nomeado que guarda um valor. Pense nela como uma caixa etiquetada onde você pode colocar informações e recuperá-las depois.

```javascript
let idade = 25;
let nome = "Alice";
let ehEstudante = true;
```

Cada variável tem um **nome**, um **valor** e um **tipo** que determina que tipo de dado ela pode armazenar.

## Tipos de Dados Primitivos

### Números

Usados para todos os valores numéricos, tanto inteiros quanto decimais:

```javascript
let pontuacao = 100;
let preco = 19.99;
let temperatura = -5;
```

### Strings

Usadas para texto. Strings são delimitadas por aspas:

```javascript
let saudacao = "Olá!";
let mensagem = 'Bem-vindo à programação';
let template = `A pontuação é ${pontuacao}`;
```

### Booleanos

Usados para valores verdadeiro/falso, geralmente em condições:

```javascript
let estaLogado = true;
let temAcesso = false;
```

### Null e Undefined

Representam a ausência de um valor:

```javascript
let vazio = null;        // intencionalmente vazio
let naoAtribuido;        // undefined (declarado mas não inicializado)
```

> [!WARNING]
> Nomes de variáveis não podem começar com dígito, não podem conter espaços e devem descrever o dado que armazenam.

## Convenções de Nomenclatura

Nomes de variáveis bons são autodocumentáveis:

| Bom | Ruim | Porquê |
|-----|------|--------|
| `nomeUsuario` | `x` | Não descritivo |
| `pontuacaoTotal` | `123dado` | Começa com dígito |
| `estaAtivo` | `nome usuario` | Contém espaço |
| `TAMANHO_MAX` | `tamanho-max` | Hífen não é permitido |

JavaScript usa **camelCase** por convenção: comece minúsculo, capitalize cada palavra subsequente.

## Constantes

Use `const` quando o valor nunca deve mudar:

```javascript
const PI = 3.14159;
const DIAS_NA_SEMANA = 7;
```

## Exercício Prático

Crie variáveis para seu perfil pessoal:

```javascript
let numeroFavorito = 42;
let corFavorita = "azul";
let gostaDePizza = true;

console.log(numeroFavorito);
console.log(corFavorita);
console.log(gostaDePizza);
```

Tente alterar os valores e observe como a saída muda.

## Resumo

| Tipo | Exemplo | Uso |
|------|---------|-----|
| Number | `42`, `3.14` | Valores numéricos |
| String | `"Olá"` | Valores de texto |
| Boolean | `true`, `false` | Valores lógicos |
| Null | `null` | Ausência intencional |
| Undefined | `let x;` | Variável não inicializada |

## Próximos Passos

Agora que você pode armazenar dados, a próxima lição vai ensinar como empacotar lógica reutilizável em funções.
