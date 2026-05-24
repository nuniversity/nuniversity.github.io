---
title: "Fluxo de Controle: Tomando Decisões com Condicionais"
description: "Aprenda a tomar decisões no seu código usando if, else e switch"
order: 4
duration: "30 minutes"
difficulty: "beginner"
---

# Fluxo de Controle: Tomando Decisões com Condicionais

Programas raramente executam o mesmo código toda vez. Condicionais permitem que seu código tome decisões baseadas em dados.

## O Comando if

Um bloco `if` executa apenas quando sua condição é verdadeira:

```javascript
let temperatura = 30;

if (temperatura > 25) {
  console.log("Está um dia quente!");
}
```

A condição dentro dos parênteses é avaliada como booleano. Se for `true`, o bloco executa.

## if...else

Use `else` para executar código quando a condição é falsa:

```javascript
let idade = 17;

if (idade >= 18) {
  console.log("Você é adulto.");
} else {
  console.log("Você é menor de idade.");
}
```

## if...else if...else

Encadeie múltiplas condições com `else if`:

```javascript
let pontuacao = 85;

if (pontuacao >= 90) {
  console.log("Nota: A");
} else if (pontuacao >= 80) {
  console.log("Nota: B");
} else if (pontuacao >= 70) {
  console.log("Nota: C");
} else {
  console.log("Nota: F");
}
```

> [!WARNING]
> As condições são verificadas de cima para baixo. Quando uma corresponde, as restantes são ignoradas.

## Operadores de Comparação

| Operador | Significado | Exemplo |
|----------|-------------|---------|
| `==` / `===` | Igual (solto / estrito) | `5 === 5` |
| `!=` / `!==` | Diferente | `5 !== "5"` |
| `>` | Maior que | `10 > 5` |
| `<` | Menor que | `5 < 10` |
| `>=` | Maior ou igual | `10 >= 10` |
| `<=` | Menor ou igual | `5 <= 10` |

Prefira sempre `===` em vez de `==` — igualdade estrita verifica valor e tipo.

## Operadores Lógicos

Combine condições com operadores lógicos:

```javascript
let idade = 25;
let temCarteira = true;

if (idade >= 18 && temCarteira) {
  console.log("Você pode dirigir.");
}

if (idade < 18 || !temCarteira) {
  console.log("Você não pode dirigir.");
}
```

- `&&` — ambos devem ser verdadeiros
- `||` — pelo menos um deve ser verdadeiro
- `!` — inverte um booleano

## O Comando switch

Use `switch` quando comparar um único valor com muitas opções:

```javascript
let dia = 3;

switch (dia) {
  case 1:
    console.log("Segunda-feira");
    break;
  case 2:
    console.log("Terça-feira");
    break;
  case 3:
    console.log("Quarta-feira");
    break;
  default:
    console.log("Dia desconhecido");
}
```

O `break` evita que a execução continue para o próximo caso.

## Operador Ternário

Uma forma concisa para if...else simples:

```javascript
let idade = 20;
let status = idade >= 18 ? "Adulto" : "Menor";
console.log(status);  // Saída: Adulto
```

Sintaxe: `condição ? valorSeVerdadeiro : valorSeFalso`

## Exercício Prático

Escreva uma função que verifica se um número é positivo, negativo ou zero:

```javascript
function verificarNumero(n) {
  if (n > 0) {
    return "Positivo";
  } else if (n < 0) {
    return "Negativo";
  } else {
    return "Zero";
  }
}

console.log(verificarNumero(10));   // Saída: Positivo
console.log(verificarNumero(-5));   // Saída: Negativo
console.log(verificarNumero(0));    // Saída: Zero
```

## Resumo

| Construção | Uso |
|------------|-----|
| `if (cond) { ... }` | Executar código quando condição é verdadeira |
| `if ... else` | Escolher entre dois caminhos |
| `if ... else if ... else` | Escolher entre múltiplos caminhos |
| `switch (val) { case: ... }` | Comparar valor com muitas opções |
| `cond ? a : b` | Expressão condicional inline |

## Próximos Passos

Agora que seu código pode tomar decisões, a próxima lição mostra como repetir ações com loops.
