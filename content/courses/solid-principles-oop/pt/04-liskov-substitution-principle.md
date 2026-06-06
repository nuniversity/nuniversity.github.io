---
title: "Princípio da Substituição de Liskov"
description: "Aprenda o Princípio da Substituição de Liskov (LSP): subtipos devem ser substituíveis por seus tipos base sem alterar a correção"
order: 4
duration: "60 minutos"
difficulty: "intermediário"
---

# Princípio da Substituição de Liskov (LSP)

> **Objetos de uma superclasse devem ser substituíveis por objetos de suas subclasses sem afetar a correção do programa.**

Introduzido por Barbara Liskov em 1987, o Princípio da Substituição de Liskov é o terceiro princípio SOLID. Ele define um contrato comportamental forte para herança: subclasses devem honrar as expectativas estabelecidas por suas classes pai.

## A Essência do LSP

Se você tem uma função que funciona com uma classe base, ela deve funcionar corretamente com qualquer uma de suas subclasses — sem saber qual subclasse é.

```python
def processar_forma(forma: Forma) -> None:
    print(f"Área: {forma.area()}")
    print(f"Perímetro: {forma.perimetro()}")
```

Esta função deve funcionar corretamente para `Retangulo`, `Circulo`, `Triangulo` — qualquer subclasse de `Forma`. Se uma subclasse quebra esta expectativa, ela viola o LSP.

## ANTES: O Problema Clássico Retângulo-Quadrado

Esta é a violação de LSP mais famosa:

```python
class Retangulo:
    def __init__(self, largura: float, altura: float):
        self.largura = largura
        self.altura = altura

    def definir_largura(self, largura: float) -> None:
        self.largura = largura

    def definir_altura(self, altura: float) -> None:
        self.altura = altura

    def area(self) -> float:
        return self.largura * self.altura

class Quadrado(Retangulo):
    def __init__(self, lado: float):
        super().__init__(lado, lado)

    def definir_largura(self, largura: float) -> None:
        self.largura = largura
        self.altura = largura

    def definir_altura(self, altura: float) -> None:
        self.largura = altura
        self.altura = altura
```

```python
def redimensionar_retangulo(rect: Retangulo, fator: float) -> None:
    altura_original = rect.altura
    rect.definir_largura(rect.largura * fator)
    assert rect.altura == altura_original, "Altura não deveria mudar!"

r = Retangulo(10, 5)
redimensionar_retangulo(r, 2)  # Funciona — largura=20, altura=5

s = Quadrado(5)
redimensionar_retangulo(s, 2)  # QUEBRA! altura também vira 10
```

> [!WARNING]
> `Quadrado` viola LSP porque muda o invariante de que `definir_largura` só afeta a largura. Código escrito para `Retangulo` assume que `definir_largura` deixa `altura` inalterada.

### DEPOIS: Design Compatível com LSP

```python
from abc import ABC, abstractmethod

class Forma(ABC):
    @abstractmethod
    def area(self) -> float:
        pass

    @abstractmethod
    def perimetro(self) -> float:
        pass

class Retangulo(Forma):
    def __init__(self, largura: float, altura: float):
        self.largura = largura
        self.altura = altura

    def area(self) -> float:
        return self.largura * self.altura

    def perimetro(self) -> float:
        return 2 * (self.largura + self.altura)

class Quadrado(Forma):
    def __init__(self, lado: float):
        self.lado = lado

    def area(self) -> float:
        return self.lado ** 2

    def perimetro(self) -> float:
        return 4 * self.lado

def imprimir_info(forma: Forma) -> None:
    print(f"Área: {forma.area():.2f}, Perímetro: {forma.perimetro():.2f}")

imprimir_info(Retangulo(10, 5))
imprimir_info(Quadrado(5))
```

> [!SUCCESS]
> Tanto `Retangulo` quanto `Quadrado` são agora subclasses de `Forma`. Nenhuma viola LSP porque `Forma` não tem métodos `definir_largura`/`definir_altura` que exigiriam comportamento diferente.

## Exemplo 2: Hierarquia de Aves

**ANTES: Violação LSP**

```python
class Ave:
    def voar(self) -> str:
        return "Voando"
    def comer(self) -> str:
        return "Comendo"

class Pinguim(Ave):
    def voar(self) -> str:
        raise NotImplementedError("Pinguins não voam!")
```

**DEPOIS: Compatível com LSP**

```python
from abc import ABC, abstractmethod

class Ave(ABC):
    @abstractmethod
    def comer(self) -> str:
        pass

class AveVoadora(Ave):
    @abstractmethod
    def voar(self) -> str:
        pass

class AveNadadora(Ave):
    @abstractmethod
    def nadar(self) -> str:
        pass

class Pardal(AveVoadora):
    def comer(self) -> str:
        return "Pardal comendo sementes"
    def voar(self) -> str:
        return "Pardal voando"

class Pinguim(AveNadadora):
    def comer(self) -> str:
        return "Pinguim comendo peixe"
    def nadar(self) -> str:
        return "Pinguim nadando"
```

## Definição Formal de LSP

O princípio define subtipagem comportamental com estas restrições:

| Restrição | Significado | Exemplo de Violação |
|-----------|-------------|---------------------|
| **Pré-condições não podem ser fortalecidas** | Métodos filhos não devem adicionar restrições | Pai aceita todos ints, filho rejeita negativos |
| **Pós-condições não podem ser enfraquecidas** | Filho deve garantir pelo menos o que o pai garante | Pai retorna não-nulo, filho retorna nulo |
| **Invariantes devem ser preservados** | Invariantes da classe devem valer no filho | Campo imutável do pai é mutável no filho |

## Sinais de Violação do LSP

| Sinal | Problema |
|-------|----------|
| Filho sobrescreve método para não fazer nada ou levantar exceção | Enfraquece pós-condição |
| Filho sobrescreve método para rejeitar entradas válidas | Fortalece pré-condição |
| Verificações `isinstance` no código cliente | Cliente sabe que subclasse quebra contrato |
| Relacionamento "é-um" parece errado | Retângulo-Quadrado, Ave-Pinguim |
| Filho lança novos tipos de exceção | Cliente não pode tratá-las |

> [!TIP]
> Se você se pega escrevendo `if isinstance(obj, TipoEspecifico):` para tratar exceções, é quase sempre uma violação de LSP. Polimorfismo deve lidar com a variação; verificações de tipo são um mau cheiro de código.

## Exercícios Práticos

1. O código a seguir viola LSP? Por quê? Refatore-o.
   ```python
   class Pilha:
       def empilhar(self, item): ...
       def desempilhar(self): ...
   class PilhaSemPop(Pilha):
       def desempilhar(self):
           raise RuntimeError("Não pode desempilhar desta pilha")
   ```

2. O problema `Retangulo`-`Quadrado` é a violação clássica de LSP. Crie um design adequado usando uma classe base `Forma` com `area()` e `perimetro()`.

3. Identifique a violação de LSP neste código e corrija-a:
   ```python
   class EscritorArquivo:
       def escrever(self, dados: str) -> None:
           with open("output.txt", "w") as f:
               f.write(dados)
   class EscritorSomenteLeitura(EscritorArquivo):
       def escrever(self, dados: str) -> None:
           pass  # Não faz nada
   ```

4. Uma classe `Veiculo` tem `ligar_motor()` e `dirigir()`. Uma subclasse `Bicicleta` levanta `NotImplementedError` para `ligar_motor()`. Como você refatoraria?

5. Explique a relação entre LSP e a regra "é-um" da herança. Quando você NÃO deve usar herança?

6. Crie uma hierarquia adequada: `ConexaoBanco` com métodos `conectar()`, `consultar()`, `desconectar()`. Crie subclasses `ConexaoMySQL`, `ConexaoPostgreSQL` e `ConexaoRedis`. Garanta que LSP seja satisfeito.

7. Qual(is) padrão(ões) de projeto ajudam a evitar violações de LSP? Dê um exemplo concreto.

8. Refatore para ser compatível com LSP:
   ```python
   class Desconto:
       def aplicar(self, preco: float) -> float:
           return preco
   class SemDesconto(Desconto):
       def aplicar(self, preco: float) -> float:
           return preco
   class DescontoPorcentagem(Desconto):
       def __init__(self, percentual: float):
           self.percentual = percentual
       def aplicar(self, preco: float) -> float:
           return preco * (1 - self.percentual / 100)
   class DescontoFixo(Desconto):
       def __init__(self, quantia: float):
           self.quantia = quantia
       def aplicar(self, preco: float) -> float:
           resultado = preco - self.quantia
           return resultado if resultado > 0 else 0
   ```

## Resumo

- **LSP**: Subtipos devem ser substituíveis por seus tipos base
- **Contrato comportamental**: Pré-condições não podem ser fortalecidas, pós-condições não podem ser enfraquecidas, invariantes devem ser preservados
- **Violação clássica**: Retângulo-Quadrado, Ave-Pinguim
- **Correção**: Prefira composição, use interfaces separadas para comportamentos separados
- **Detecção**: Verificações `isinstance`, sobrescritas que levantam exceção ou não fazem nada, invariantes quebrados

> [!SUCCESS]
> LSP nos ensina que herança é sobre comportamento, não apenas estrutura. Uma hierarquia bem projetada garante que qualquer subclasse possa substituir sua classe pai com segurança, sem surpresas.


## Exemplo 2: Conta Bancária com Restrições de Saque

**ANTES: Violação LSP**



**DEPOIS: Design com LSP**



## LSP vs Design by Contract

| Termo | Significado |
|-------|-------------|
| **Pré-condição** | O que deve ser verdade antes de chamar um método |
| **Pós-condição** | O que deve ser verdade depois de chamar um método |
| **Invariante** | O que deve ser sempre verdade sobre um objeto |

Para LSP:
- Filho **não pode fortalecer** pré-condições
- Filho **não pode enfraquecer** pós-condições
- Filho **deve preservar** invariantes

## Exercícios Práticos

1. O código a seguir viola LSP? Por quê? Refatore-o.
   

2. Crie um design adequado para o problema Retângulo-Quadrado usando uma classe base .

3. Identifique a violação de LSP e corrija:
   

4. Uma classe  tem  e . Subclasse  levanta erro. Refatore.

5. Explique a relação entre LSP e a regra "é-um" da herança.

6. Crie uma hierarquia  com , , . Garanta LSP.

7. Qual padrão de projeto ajuda a evitar violações de LSP?

8. Refatore para ser compatível com LSP:
   

## Resumo

- **LSP**: Subtipos devem ser substituíveis por seus tipos base
- **Pré-condições** não podem ser fortalecidas
- **Pós-condições** não podem ser enfraquecidas
- **Invariantes** devem ser preservados
- **Correção**: Prefira composição, interfaces separadas

> [!SUCCESS]
> LSP nos ensina que herança é sobre comportamento, não estrutura.

## Additional Content

More content here...


## Exemplo 2: Conta Bancária com Restrições de Saque

**ANTES: Violação LSP**

```python
class ContaBancaria:
    def __init__(self, saldo: float = 0):
        self.saldo = saldo
    def sacar(self, quantia: float) -> None:
        if quantia <= 0:
            raise ValueError("Quantia deve ser positiva")
        if quantia > self.saldo:
            raise ValueError("Saldo insuficiente")
        self.saldo -= quantia

class ContaPoupanca(ContaBancaria):
    limite_saque = 0.8
    def sacar(self, quantia: float) -> None:
        if quantia > self.saldo * self.limite_saque:
            raise ValueError("Limite de saque excedido")
        super().sacar(quantia)

def processar_saque(conta: ContaBancaria, quantia: float) -> None:
    inicial = conta.saldo
    conta.sacar(quantia)
    assert conta.saldo == inicial - quantia

processar_saque(ContaBancaria(1000), 200)
processar_saque(ContaPoupanca(1000), 900)
```

**DEPOIS: Design com LSP**

```python
from abc import ABC, abstractmethod

class Conta(ABC):
    def __init__(self, saldo: float = 0):
        self._saldo = saldo
    @property
    def saldo(self) -> float:
        return self._saldo
    @abstractmethod
    def pode_sacar(self) -> bool:
        pass
    def depositar(self, quantia: float) -> None:
        if quantia <= 0:
            raise ValueError("Quantia deve ser positiva")
        self._saldo += quantia

class ContaSacavel(Conta):
    def sacar(self, quantia: float) -> None:
        if quantia <= 0:
            raise ValueError("Quantia deve ser positiva")
        if quantia > self._saldo:
            raise ValueError("Saldo insuficiente")
        self._saldo -= quantia
    def pode_sacar(self) -> bool:
        return self._saldo > 0

class ContaCorrente(ContaSacavel):
    pass

class ContaPoupanca(ContaSacavel):
    def sacar(self, quantia: float) -> None:
        if quantia > self._saldo * 0.8:
            raise ValueError("Limite de 80% excedido")
        super().sacar(quantia)

def processar_conta(conta: Conta) -> None:
    print(f"Saldo: ${conta.saldo:.2f}, Pode sacar: {conta.pode_sacar()}")
```

## Exercícios Práticos

1. O código a seguir viola LSP? Por quê? Refatore-o.
   ```python
   class Pilha:
       def empilhar(self, item): ...
       def desempilhar(self): ...
   class PilhaSemPop(Pilha):
       def desempilhar(self):
           raise RuntimeError("Nao pode desempilhar")
   ```

2. Crie design adequado para Retangulo-Quadrado usando `Forma`.

3. Identifique a violacao de LSP: classe `EscritorSomenteLeitura` que herda de `EscritorArquivo` e nao faz nada em `escrever()`.

4. Refatore: `Veiculo` com `ligar_motor()` e `Bicicleta` que levanta erro.

5. Explique relacao entre LSP e regra "e-um" da heranca.

6. Crie hierarquia `ConexaoBanco` garantindo LSP.

7. Qual padrao de projeto ajuda a evitar violacoes de LSP?

8. Refatore para LSP: classes `Desconto`, `DescPorcentagem`, `DescFixo`.

## Resumo

- **LSP**: Subtipos devem ser substituiveis por tipos base
- **Pre-condicoes** nao podem ser fortalecidas
- **Pos-condicoes** nao podem ser enfraquecidas
- **Invariantes** devem ser preservados
- **Solucao**: Prefira composicao, interfaces separadas

> [!SUCCESS]
> LSP ensina que heranca e sobre comportamento, nao estrutura.
