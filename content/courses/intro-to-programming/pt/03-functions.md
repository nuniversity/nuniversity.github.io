---
title: "Funções: Blocos de Código Reutilizáveis"
description: "Aprenda a definir, chamar e organizar código com funções"
order: 3
duration: "30 minutes"
difficulty: "beginner"
---

# Funções: Blocos de Código Reutilizáveis

Funções permitem empacotar um bloco de código para executá-lo sempre que necessário — com diferentes entradas, se desejar.

## Por que Usar Funções

- **Reutilização**: Escreva uma vez, use muitas vezes
- **Organização**: Divida lógica complexa em partes pequenas e compreensíveis
- **Abstração**: Esconda detalhes de implementação atrás de uma chamada simples

## Definindo e Chamando uma Função

```javascript
function saudacao() {
  console.log("Olá, bem-vindo à programação!");
}

saudacao();  // Chama a função
```

A palavra-chave `function` a declara, o nome descreve o que ela faz, e os parênteses `()` a invocam.

## Parâmetros e Argumentos

Parâmetros são placeholders que recebem valores quando a função é chamada:

```javascript
function saudarUsuario(nome) {
  console.log("Olá, " + nome + "!");
}

saudarUsuario("Alice");  // Saída: Olá, Alice!
saudarUsuario("Bob");    // Saída: Olá, Bob!
```

Múltiplos parâmetros são separados por vírgulas:

```javascript
function somar(a, b) {
  console.log(a + b);
}

somar(3, 5);  // Saída: 8
```

## Valores de Retorno

Funções podem enviar um valor de volta usando `return`:

```javascript
function multiplicar(x, y) {
  return x * y;
}

let resultado = multiplicar(4, 5);
console.log(resultado);  // Saída: 20
```

Quando `return` executa, a função para imediatamente.

> [!NOTE]
> Uma função sem `return` retorna `undefined` por padrão.

## Escopo de Função

Variáveis declaradas dentro de uma função são locais — não podem ser acessadas fora:

```javascript
function mostrarMensagem() {
  let mensagem = "Dentro da função";
  console.log(mensagem);
}

mostrarMensagem();
// console.log(mensagem);  // ReferenceError: mensagem is not defined
```

Variáveis declaradas fora (escopo global) são acessíveis dentro:

```javascript
let nomeGlobal = "Alice";

function dizerOla() {
  console.log("Olá, " + nomeGlobal);
}

dizerOla();  // Saída: Olá, Alice
```

## Arrow Functions

Uma sintaxe mais curta para escrever funções:

```javascript
// Tradicional
function somar(a, b) {
  return a + b;
}

// Arrow
const somar = (a, b) => a + b;
```

Quando o corpo é uma única expressão, o `return` é implícito.

## Exercício Prático

Escreva uma função que converte Celsius para Fahrenheit:

```javascript
function celsiusParaFahrenheit(celsius) {
  return (celsius * 9 / 5) + 32;
}

console.log(celsiusParaFahrenheit(0));   // Saída: 32
console.log(celsiusParaFahrenheit(100)); // Saída: 212
```

## Resumo

| Conceito | Exemplo |
|----------|---------|
| Declaração de função | `function nome() { ... }` |
| Parâmetros | `function somar(a, b)` |
| Valor de retorno | `return valor;` |
| Arrow function | `const fn = (x) => x * 2;` |
| Escopo local | `let x = 1;` dentro de uma função é privado |

## Próximos Passos

A seguir você vai aprender a tomar decisões no seu código usando condicionais.
