---
title: "SOLID na Prática"
description: "Aplique todos os cinco princípios SOLID em um estudo de caso abrangente de refatoração de um sistema real de gerenciamento de pedidos"
order: 7
duration: "65 minutos"
difficulty: "intermediário"
---

# SOLID na Prática

Esta lição reúne todos os cinco princípios SOLID em um estudo de caso realista. Você verá um sistema legado de gerenciamento de pedidos bagunçado e fortemente acoplado e o refatorará passo a passo usando princípios SOLID.

## O Estudo de Caso: Sistema de Gerenciamento de Pedidos

Temos um sistema legado que processa pedidos de e-commerce. Ele é funcional mas sofre de todas as violações SOLID imagináveis. Vamos analisá-lo, identificar problemas e refatorar sistematicamente.

### ANTES: O Monólito Legado

```python
import json
import smtplib
import sqlite3
from email.message import EmailMessage
from pathlib import Path
from typing import Any

class GerenciadorPedidos:
    def __init__(self):
        self.caminho_db = "pedidos.db"
        self._init_db()

    def _init_db(self) -> None:
        with sqlite3.connect(self.caminho_db) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS pedidos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email_cliente TEXT NOT NULL,
                    itens TEXT NOT NULL,
                    total REAL NOT NULL,
                    status TEXT DEFAULT 'pendente',
                    codigo_desconto TEXT
                )
            """)

    def criar_pedido(self, email_cliente: str,
                     itens: list[dict[str, Any]],
                     codigo_desconto: str | None = None) -> int:
        total = 0.0
        for item in itens:
            total += item["preco"] * item["quantidade"]

        if codigo_desconto:
            if codigo_desconto == "SAVE10":
                total *= 0.9
            elif codigo_desconto == "SAVE20":
                total *= 0.8

        if total > 1000:
            total *= 0.95

        itens_json = json.dumps(itens)
        with sqlite3.connect(self.caminho_db) as conn:
            cur = conn.execute(
                "INSERT INTO pedidos (email_cliente, itens, total, codigo_desconto) VALUES (?, ?, ?, ?)",
                (email_cliente, itens_json, total, codigo_desconto)
            )
            id_pedido = cur.lastrowid

        html = f"""<html><body>
<h1>Pedido #{id_pedido} Confirmado</h1>
<p>Total: ${total:.2f}</p>
</body></html>"""
        msg = EmailMessage()
        msg["Subject"] = f"Pedido #{id_pedido} Confirmado"
        msg["From"] = "pedidos@loja.com"
        msg["To"] = email_cliente
        msg.set_content(html, subtype="html")
        with smtplib.SMTP("smtp.loja.com") as server:
            server.send_message(msg)

        with open(f"pedido_{id_pedido}.json", "w") as f:
            json.dump({"pedido_id": id_pedido, "total": total}, f, indent=2)

        print(f"Pedido {id_pedido} criado. Total: ${total:.2f}")
        return id_pedido
```

> [!WARNING]
> Esta classe `GerenciadorPedidos` viola TODOS os cinco princípios SOLID. Vamos identificar cada violação.

### Identificando Violações SOLID

| Princípio | Violação | Evidência |
|-----------|----------|-----------|
| **SRP** | 5+ responsabilidades | Banco, descontos, email, arquivo, pagamento, envio — tudo em uma classe |
| **OCP** | Cadeias if/elif para pagamentos e descontos | Adicionar novo método de pagamento exige modificar código existente |
| **ISP** | Clientes dependem de toda a interface | Um "relator somente leitura" precisaria de todos os métodos |
| **DIP** | Lógica de alto nível depende de SQLite, SMTP diretamente | Não pode testar sem banco real ou servidor de email |

## Passo 1: Aplicar SRP — Separar Responsabilidades

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Optional

@dataclass
class ItemPedido:
    nome: str
    preco: float
    quantidade: int
    def total(self) -> float:
        return self.preco * self.quantidade

@dataclass
class Pedido:
    id: Optional[int] = None
    email_cliente: str = ""
    itens: list[ItemPedido] = field(default_factory=list)
    total: float = 0.0
    status: str = "pendente"

class RepositorioPedido(ABC):
    @abstractmethod
    def salvar(self, pedido: Pedido) -> int: pass
    @abstractmethod
    def buscar_por_id(self, id: int) -> Optional[Pedido]: pass
    @abstractmethod
    def atualizar_status(self, id: int, status: str) -> None: pass

class RepositorioPedidoSQLite(RepositorioPedido):
    def __init__(self, caminho_db: str = "pedidos.db"):
        self.caminho_db = caminho_db
        self._init_db()
    def _init_db(self) -> None:
        import sqlite3
        with sqlite3.connect(self.caminho_db) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS pedidos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email_cliente TEXT NOT NULL, itens TEXT NOT NULL,
                    total REAL NOT NULL, status TEXT DEFAULT 'pendente',
                    codigo_desconto TEXT
                )
            """)
    def salvar(self, pedido: Pedido) -> int:
        import sqlite3, json
        itens_json = json.dumps([{"nome": i.nome, "preco": i.preco, "quantidade": i.quantidade} for i in pedido.itens])
        with sqlite3.connect(self.caminho_db) as conn:
            cur = conn.execute(
                "INSERT INTO pedidos (email_cliente, itens, total, status) VALUES (?, ?, ?, ?)",
                (pedido.email_cliente, itens_json, pedido.total, pedido.status)
            )
            return cur.lastrowid
```

## Passo 2: Aplicar OCP — Métodos de Pagamento

```python
class MetodoPagamento(ABC):
    @abstractmethod
    def cobrar(self, quantia: float, detalhes: dict[str, Any]) -> str: pass
    @abstractmethod
    def validar(self, detalhes: dict[str, Any]) -> None: pass

class PagamentoCartaoCredito(MetodoPagamento):
    def validar(self, detalhes: dict[str, Any]) -> None:
        cartao = detalhes.get("numero_cartao")
        if not cartao or len(str(cartao)) != 16:
            raise ValueError("Cartão inválido")
    def cobrar(self, quantia: float, detalhes: dict[str, Any]) -> str:
        self.validar(detalhes)
        return f"cc_{hash(str(detalhes['numero_cartao']))}"

class GatewayPagamento:
    def __init__(self):
        self._metodos: dict[str, MetodoPagamento] = {}
    def registrar_metodo(self, nome: str, metodo: MetodoPagamento) -> None:
        self._metodos[nome] = metodo
    def processar(self, nome: str, quantia: float, detalhes: dict) -> str:
        metodo = self._metodos.get(nome)
        if not metodo:
            raise ValueError(f"Método desconhecido: {nome}")
        return metodo.cobrar(quantia, detalhes)
```

## Passo 3: Aplicar ISP — Interfaces Segregadas

```python
class RemetenteConfirmacao(ABC):
    @abstractmethod
    def enviar_confirmacao(self, pedido: Pedido) -> None: pass

class NotificadorEnvio(ABC):
    @abstractmethod
    def notificar_envio(self, pedido: Pedido, codigo_rastreio: str) -> None: pass

class RemetenteEmailConfirmacao(RemetenteConfirmacao):
    def __init__(self, host_smtp: str = "smtp.loja.com"):
        self.host_smtp = host_smtp
    def enviar_confirmacao(self, pedido: Pedido) -> None:
        import smtplib
        from email.message import EmailMessage
        msg = EmailMessage()
        msg["Subject"] = f"Pedido #{pedido.id} Confirmado"
        msg["From"] = "pedidos@loja.com"
        msg["To"] = pedido.email_cliente
        msg.set_content(f"Seu pedido #{pedido.id} foi confirmado!")
        with smtplib.SMTP(self.host_smtp) as server:
            server.send_message(msg)

class ServicoEnvio(ABC):
    @abstractmethod
    def enviar(self, pedido: Pedido) -> str: pass

class ServicoEnvioPadrao(ServicoEnvio):
    def enviar(self, pedido: Pedido) -> str:
        rastreio = f"Rastreio{pedido.id:06d}"
        print(f"Enviando pedido {pedido.id}. Rastreio: {rastreio}")
        return rastreio
```

## Passo 4: Aplicar DIP — Compor Tudo

```python
class ServicoPedido:
    def __init__(self, repo: RepositorioPedido,
                 gateway: GatewayPagamento,
                 remetente: RemetenteConfirmacao,
                 notificador: NotificadorEnvio,
                 servico_envio: ServicoEnvio):
        self._repo = repo
        self._gateway = gateway
        self._remetente = remetente
        self._notificador = notificador
        self._servico_envio = servico_envio

    def criar_pedido(self, email: str,
                     itens_data: list[dict[str, Any]]) -> Pedido:
        pedido = Pedido(email_cliente=email)
        for item_data in itens_data:
            pedido.itens.append(ItemPedido(item_data["nome"], item_data["preco"], item_data["quantidade"]))
        pedido.total = sum(i.total() for i in pedido.itens)
        pedido.id = self._repo.salvar(pedido)
        self._remetente.enviar_confirmacao(pedido)
        return pedido

    def processar_pagamento(self, id_pedido: int, metodo: str,
                            detalhes: dict) -> str:
        pedido = self._repo.buscar_por_id(id_pedido)
        if not pedido:
            raise ValueError(f"Pedido {id_pedido} não encontrado")
        txn = self._gateway.processar(metodo, pedido.total, detalhes)
        self._repo.atualizar_status(id_pedido, "pago")
        return txn

    def enviar_pedido(self, id_pedido: int) -> str:
        pedido = self._repo.buscar_por_id(id_pedido)
        if not pedido or pedido.status != "pago":
            raise ValueError(f"Pedido {id_pedido} não pode ser enviado")
        rastreio = self._servico_envio.enviar(pedido)
        self._repo.atualizar_status(id_pedido, "enviado")
        self._notificador.notificar_envio(pedido, rastreio)
        return rastreio

def criar_sistema_pedidos() -> ServicoPedido:
    repo = RepositorioPedidoSQLite("pedidos.db")
    gateway = GatewayPagamento()
    gateway.registrar_metodo("cartao", PagamentoCartaoCredito())
    remetente = RemetenteEmailConfirmacao("smtp.loja.com")
    notificador = NotificadorEnvio()  # mock simplificado
    envio = ServicoEnvioPadrao()
    return ServicoPedido(repo, gateway, remetente, notificador, envio)

sistema = criar_sistema_pedidos()
pedido = sistema.criar_pedido("alice@exemplo.com", [
    {"nome": "Laptop", "preco": 1200, "quantidade": 1},
])
sistema.processar_pagamento(pedido.id, "cartao", {"numero_cartao": 1234567812345678})
sistema.enviar_pedido(pedido.id)
```

## Antes e Depois

| Aspecto | Antes (Monólito) | Depois (SOLID) |
|---------|------------------|----------------|
| **Linhas por classe** | ~180 linhas (uma classe) | ~20-40 linhas cada |
| **Testabilidade** | Impossível sem banco real | Testes com mocks |
| **Adicionar pagamentos** | Modificar GerenciadorPedidos | Criar subclasse, registrar |
| **Adicionar descontos** | Modificar GerenciadorPedidos | Criar nova estratégia |
| **Trocar banco** | Reescrever GerenciadorPedidos | Implementar novo repositório |
| **Dependências** | Todas fixas | Todas injetadas (DIP) |

## Exercícios Práticos

1. Refatore este código passo a passo usando princípios SOLID:
   ```python
   class ExportadorDados:
       def exportar(self, dados, formato, destino):
           if formato == "csv": pass
           elif formato == "json": pass
           if destino == "arquivo": pass
           elif destino == "email": pass
   ```

2. Identifique todas as violações SOLID na classe `GerenciadorPedidos` legada. Para cada violação, explique qual princípio é violado e como.

3. No sistema refatorado, adicione um método de pagamento `PagamentoPix` e um desconto `DESCONTO50`. Mostre que nenhum código existente precisa ser modificado.

4. Crie um `RepositorioPedidoPostgreSQL` que implemente `RepositorioPedido`. O que isso diz sobre DIP?

5. Escreva um teste unitário para `ServicoPedido.criar_pedido()` que verifique se `RemetenteConfirmacao.enviar_confirmacao()` é chamado exatamente uma vez.

6. Como você adicionaria um recurso de log de auditoria ao sistema de pedidos? Projete usando princípios SOLID.

7. Explique por que o sistema refatorado é mais sustentável que a versão monolítica. Dê pelo menos três cenários concretos.

8. Adicione um `NotificadorSMS` que implemente apenas as interfaces de notificação necessárias seguindo ISP.

## Resumo

- **SRP**: Separar banco, descontos, pagamentos, notificações e exportação em classes distintas
- **OCP**: Novos métodos de pagamento e descontos adicionados via novas subclasses
- **ISP**: Cada interface é enxuta e focada
- **DIP**: `ServicoPedido` depende apenas de abstrações
- **Testabilidade**: Cada componente testável isoladamente
- **Extensibilidade**: Novos recursos adicionados via extensão, não modificação

> [!SUCCESS]
> Os princípios SOLID não são teoria acadêmica — são ferramentas práticas que transformam monólitos emaranhados em sistemas limpos, sustentáveis e extensíveis. Este estudo de caso mostra exatamente como aplicá-los em código real.

## Additional Content

More content here...


## Passo 1.5: Motor de Descontos (OCP)

```python
class EstrategiaDesconto(ABC):
    @abstractmethod
    def aplicar(self, total: float) -> float: pass
    @abstractmethod
    def codigo(self) -> str: pass

class DescontoSave10(EstrategiaDesconto):
    def codigo(self): return "SAVE10"
    def aplicar(self, total): return total * 0.9

class DescontoSave20(EstrategiaDesconto):
    def codigo(self): return "SAVE20"
    def aplicar(self, total): return total * 0.8

class MotorDescontos:
    def __init__(self):
        self._strategias: dict[str, EstrategiaDesconto] = {}
    def registrar(self, s: EstrategiaDesconto):
        self._strategias[s.codigo()] = s
    def aplicar(self, cod: str, total: float) -> float:
        s = self._strategias.get(cod.upper())
        if not s: raise ValueError(f"Codigo invalido: {cod}")
        return s.aplicar(total)
```

## Testes com DIP (In Memory)

```python
class RepoPedidoMemoria(RepositorioPedido):
    def __init__(self):
        self._pedidos: dict[int, Pedido] = {}
        self._next = 1
    def salvar(self, p: Pedido) -> int:
        p.id = self._next
        self._pedidos[self._next] = p
        self._next += 1
        return p.id
    def buscar_por_id(self, id: int) -> Optional[Pedido]:
        return self._pedidos.get(id)
    def atualizar_status(self, id: int, s: str):
        if id in self._pedidos: self._pedidos[id].status = s

class RemetenteMock(RemetenteConfirmacao):
    def __init__(self): self.count = 0
    def enviar_confirmacao(self, p: Pedido): self.count += 1

def test_criar_pedido():
    repo = RepoPedidoMemoria()
    desc = MotorDescontos()
    desc.registrar(DescontoSave10())
    rem = RemetenteMock()
    svc = ServicoPedido(repo, desc, GatewayPagamento(), rem,
                        NotificadorEnvio(), ServicoEnvioPadrao())
    p = svc.criar_pedido("a@b.com", [
        {"nome": "X", "preco": 100, "quantidade": 2},
    ], "SAVE10")
    assert p.total == 180.0
    assert rem.count == 1
    print("Teste passou!")
```

## Antes e Depois

| Aspecto | Monolito | SOLID |
|---------|----------|-------|
| Responsabilidades | 1 classe | 8+ classes focadas |
| Testabilidade | Impossivel | Testes com mocks |
| Novo pagamento | Modificar if/elif | Nova subclasse + registro |
| Novo desconto | Modificar if/elif | Nova estrategia + registro |
| Trocar banco | Reescrever classe | Novo repositorio |
| Acoplamento | Fixo | Injecao de dependencia |

## Exercicios Praticos

1. Refatore classe `ExportadorDados` com if/elif usando SOLID.

2. Identifique todas as violacoes SOLID na classe `GerenciadorPedidos`.

3. Adicione `PagamentoPix` e `Desconto50` sem modificar codigo.

4. Crie `RepositorioPedidoPostgreSQL`. O que demonstra?

5. Teste unitario para `ServicoPedido.criar_pedido()`.

6. Adicione log de auditoria usando SOLID.

7. Explique 3 cenarios onde SOLID facilita manutencao.

8. Adicione `NotificadorSMS` seguindo ISP.

## Resumo

- **SRP**: Separar responsabilidades em classes distintas
- **OCP**: Extensao via subclasses, nao modificacao
- **ISP**: Interfaces enxutas e focadas
- **DIP**: Dependencias injetadas via abstracoes
- **Testes**: Mocks para componentes isolados
- **Extensibilidade**: Novos recursos via extensao

> [!SUCCESS]
> SOLID transforma monolitos em sistemas limpos e sustentaveis.
