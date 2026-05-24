---
title: "Estruturas de Dados: Arrays e Objetos"
description: "Aprenda a organizar dados usando arrays e objetos"
order: 6
duration: "35 minutes"
difficulty: "beginner"
---

# Estruturas de Dados: Arrays e Objetos

Variáveis individuais não são suficientes quando você precisa trabalhar com coleções de dados. Arrays e objetos permitem organizar valores relacionados juntos.

## Arrays

Um array é uma lista ordenada de valores:

```javascript
let cores = ["vermelho", "verde", "azul"];
let numeros = [10, 20, 30, 40];
let misturado = ["texto", 42, true, null];
```

### Acessando Elementos

Elementos são acessados pelo seu índice, começando em 0:

```javascript
let frutas = ["Maçã", "Banana", "Cereja"];

console.log(frutas[0]);  // Saída: Maçã
console.log(frutas[1]);  // Saída: Banana
console.log(frutas[2]);  // Saída: Cereja
```

### Modificando Arrays

```javascript
frutas[1] = "Mirtilo";    // Substitui "Banana"
console.log(frutas);       // ["Maçã", "Mirtilo", "Cereja"]

frutas.push("Tâmara");    // Adiciona ao final
frutas.pop();              // Remove do final
frutas.unshift("Damasco"); // Adiciona ao início
frutas.shift();            // Remove do início
```

### Propriedades e Métodos de Array

```javascript
let itens = [3, 1, 4, 1, 5];

console.log(itens.length);     // Saída: 5
console.log(itens.indexOf(4)); // Saída: 2
itens.sort();
console.log(itens);            // [1, 1, 3, 4, 5]
```

## Objetos

Objetos armazenam pares chave-valor:

```javascript
let pessoa = {
  nome: "Alice",
  idade: 30,
  ehEstudante: false
};
```

### Acessando e Modificando Propriedades

```javascript
// Notação de ponto
console.log(pessoa.nome);   // Saída: Alice
pessoa.idade = 31;

// Notação de colchetes (útil para chaves dinâmicas)
console.log(pessoa["nome"]); // Saída: Alice
pessoa["ehEstudante"] = true;

// Adicionando novas propriedades
pessoa.cidade = "São Paulo";
```

> [!NOTE]
> Use notação de ponto quando souber o nome da chave. Use colchetes quando a chave vier de uma variável.

### Estruturas Aninhadas

Objetos e arrays podem conter uns aos outros:

```javascript
let salaDeAula = {
  professor: "Sr. Silva",
  alunos: [
    { nome: "Alice", nota: 85 },
    { nome: "Bob", nota: 92 },
    { nome: "Carlos", nota: 78 }
  ],
  materia: "Programação"
};

console.log(salaDeAula.alunos[0].nome);  // Saída: Alice
console.log(salaDeAula.alunos[1].nota);  // Saída: 92
```

### Iterando Sobre Objetos

```javascript
let carro = { marca: "Toyota", modelo: "Corolla", ano: 2023 };

for (let chave in carro) {
  console.log(chave + ":", carro[chave]);
}
// Saída:
// marca: Toyota
// modelo: Corolla
// ano: 2023
```

## Exercício Prático

Crie um programa que gerencia uma biblioteca simples de livros:

```javascript
let biblioteca = [
  { titulo: "1984", autor: "George Orwell", ano: 1949 },
  { titulo: "O Sol é para Todos", autor: "Harper Lee", ano: 1960 }
];

function adicionarLivro(titulo, autor, ano) {
  biblioteca.push({ titulo, autor, ano });
}

function encontrarLivrosPorAutor(autor) {
  return biblioteca.filter(livro => livro.autor === autor);
}

adicionarLivro("O Grande Gatsby", "F. Scott Fitzgerald", 1925);
console.log(biblioteca.length);  // Saída: 3
```

## Resumo

| Estrutura | Uso | Exemplo |
|-----------|-----|---------|
| Array `[]` | Lista ordenada | `["a", "b", "c"]` |
| Objeto `{}` | Pares chave-valor | `{ nome: "Alice", idade: 30 }` |
| Array de objetos | Lista de dados estruturados | `[{ id: 1 }, { id: 2 }]` |

## Próximos Passos

Com variáveis, funções, fluxo de controle e estruturas de dados dominados, a próxima lição explora um paradigma diferente: programação funcional com Python.
