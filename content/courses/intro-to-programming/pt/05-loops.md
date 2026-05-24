---
title: "Fluxo de Controle: Repetindo com Laços"
description: "Aprenda a repetir ações usando laços for, while e do...while"
order: 5
duration: "30 minutes"
difficulty: "beginner"
---

# Fluxo de Controle: Repetindo com Laços

Laços permitem executar um bloco de código múltiplas vezes sem escrevê-lo repetidamente.

## O Laço for

Use um laço `for` quando você sabe quantas vezes repetir:

```javascript
for (let i = 0; i < 5; i++) {
  console.log("Iteração:", i);
}
```

Um laço `for` tem três partes:
1. **Inicialização**: `let i = 0` — executa uma vez antes do laço
2. **Condição**: `i < 5` — verificada antes de cada iteração
3. **Atualização**: `i++` — executa após cada iteração

## O Laço while

Use `while` quando quiser repetir até que uma condição mude:

```javascript
let contador = 0;

while (contador < 5) {
  console.log("Contagem:", contador);
  contador++;
}
```

> [!WARNING]
> Se a condição nunca se tornar falsa, o laço executa para sempre e trava seu programa!

## O Laço do...while

Similar ao `while`, mas o corpo sempre executa pelo menos uma vez:

```javascript
let i = 0;

do {
  console.log("Executa pelo menos uma vez, i =", i);
  i++;
} while (i < 3);
```

## break e continue

- `break` sai do laço imediatamente
- `continue` pula para a próxima iteração

```javascript
for (let i = 0; i < 10; i++) {
  if (i === 3) {
    continue;  // Pula o 3
  }
  if (i === 7) {
    break;     // Para no 7
  }
  console.log(i);  // Saída: 0, 1, 2, 4, 5, 6
}
```

## Percorrendo Arrays

Um padrão comum é iterar sobre elementos de um array:

```javascript
let frutas = ["Maçã", "Banana", "Cereja"];

for (let i = 0; i < frutas.length; i++) {
  console.log(frutas[i]);
}
```

JavaScript também oferece uma sintaxe mais limpa:

```javascript
for (let fruta of frutas) {
  console.log(fruta);
}
```

## Laços Aninhados

Laços podem ser colocados dentro de outros laços:

```javascript
for (let linha = 0; linha < 3; linha++) {
  let texto = "";
  for (let col = 0; col < 3; col++) {
    texto += "* ";
  }
  console.log(texto);
}
// Saída:
// * * *
// * * *
// * * *
```

## Exercício Prático

Escreva uma função que calcula a soma dos números de 1 a n:

```javascript
function somarAte(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += i;
  }
  return total;
}

console.log(somarAte(5));   // Saída: 15  (1+2+3+4+5)
console.log(somarAte(100)); // Saída: 5050
```

## Resumo

| Laço | Quando usar |
|------|-------------|
| `for (init; cond; update)` | Número conhecido de iterações |
| `while (cond)` | Executar enquanto condição for verdadeira |
| `do { ... } while (cond)` | Executar pelo menos uma vez |
| `for...of` | Iterar sobre elementos de um array |
| `break` | Sair do laço antecipadamente |
| `continue` | Pular iteração atual |

## Próximos Passos

Agora que você pode repetir ações, a próxima lição cobre estruturas de dados — arrays e objetos para organizar dados.
