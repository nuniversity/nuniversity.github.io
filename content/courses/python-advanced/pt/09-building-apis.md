---
title: "Construindo APIs com FastAPI"
description: "Crie APIs REST prontas para produção com FastAPI, modelos Pydantic, injeção de dependência, endpoints assíncronos e documentação automática"
order: 9
duration: "90 minutos"
difficulty: avançado
---

# Construindo APIs com FastAPI

## Por que FastAPI?

FastAPI fornece documentação OpenAPI automática, validação de requisições via Pydantic, suporte assíncrono e injeção de dependência — tudo com alto desempenho.

```python
from fastapi import FastAPI

app = FastAPI(title="API Avançada", version="1.0.0")

@app.get("/health")
async def health():
    return {"status": "ok"}
```

Execute com: `uvicorn main:app --reload`

Acesse `/docs` para Swagger UI e `/redoc` para ReDoc.

## Roteamento

```python
from fastapi import FastAPI, Path, Query, HTTPException, status

app = FastAPI()

# Parâmetros de caminho
@app.get("/items/{item_id}")
async def read_item(item_id: int = Path(..., ge=1, le=1000)):
    return {"item_id": item_id}

# Parâmetros de consulta
@app.get("/search")
async def search(
    q: str = Query(None, min_length=3, max_length=50),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
):
    return {"query": q, "page": page, "size": size}

# Múltiplos métodos HTTP
@app.post("/items", status_code=status.HTTP_201_CREATED)
async def create_item(payload: dict):
    return {"id": 42, **payload}

@app.put("/items/{item_id}")
async def update_item(item_id: int, payload: dict):
    return {"updated": item_id}

@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: int):
    return None
```

## Modelos Pydantic

```python
from pydantic import BaseModel, Field, EmailStr, validator
from datetime import datetime
from typing import Optional, List

class Address(BaseModel):
    street: str
    city: str
    zip_code: str = Field(..., pattern=r"^\d{5}(-\d{4})?$")

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    age: int = Field(..., ge=0, le=150)
    address: Optional[Address] = None
    tags: List[str] = Field(default_factory=list, max_length=10)

    @validator("name")
    def name_must_be_meaningful(cls, v):
        if v.strip() == "":
            raise ValueError("O nome não pode estar em branco")
        return v.strip()

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    age: int
    created_at: datetime
    tags: List[str]

    class Config:
        from_attributes = True

@app.post("/users", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate):
    """Cria um novo usuário."""
    return UserResponse(
        id=1,
        name=user.name,
        email=user.email,
        age=user.age,
        created_at=datetime.now(),
        tags=user.tags,
    )
```

[!NOTE]
Pydantic v2 usa validação baseada em Rust (via `pydantic-core`), tornando-o significativamente mais rápido que a v1. Use `Field()` para restrições e `@validator` para lógica personalizada.

## Injeção de Dependência

```python
from fastapi import Depends, FastAPI, Header, HTTPException
from typing import Optional

app = FastAPI()

# Dependência simples
async def common_params(page: int = 1, size: int = 10):
    return {"page": page, "size": size}

@app.get("/items")
async def list_items(params: dict = Depends(common_params)):
    return params

# Dependência baseada em classe
class Pagination:
    def __init__(self, page: int = 1, size: int = 10):
        self.page = page
        self.size = size

@app.get("/products")
async def list_products(pagination: Pagination = Depends()):
    return {"page": pagination.page, "size": pagination.size}

# Dependência de autenticação
async def verify_token(authorization: Optional[str] = Header(None)):
    if authorization is None:
        raise HTTPException(status_code=401, detail="Token ausente")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido")
    return authorization.removeprefix("Bearer ")

@app.get("/protected")
async def protected_route(token: str = Depends(verify_token)):
    return {"message": "Acesso concedido", "token": token}
```

### Dependência com yield (Sessões de BD)

```python
from fastapi import Depends, FastAPI
from typing import Generator

class DatabaseSession:
    def __init__(self):
        self.transaction_active = False

    def commit(self):
        self.transaction_active = False

    def rollback(self):
        self.transaction_active = False

    def close(self):
        pass

async def get_db() -> Generator:
    db = DatabaseSession()
    try:
        yield db
    finally:
        db.close()

@app.post("/transaction")
async def transaction(db: DatabaseSession = Depends(get_db)):
    db.transaction_active = True
    # realizar trabalho
    db.commit()
    return {"status": "confirmado"}
```

[!SUCCESS]
Injeção de dependência com `yield` é a forma idiomática de gerenciar sessões de banco de dados, recursos por requisição e limpeza.

## Endpoints Assíncronos

```python
import asyncio
import aiohttp
from fastapi import FastAPI

app = FastAPI()

async def fetch_url(session: aiohttp.ClientSession, url: str) -> dict:
    async with session.get(url) as resp:
        return {"url": url, "status": resp.status}

@app.get("/fetch-all")
async def fetch_all():
    urls = [
        "https://httpbin.org/delay/1",
        "https://httpbin.org/delay/2",
        "https://httpbin.org/delay/3",
    ]
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(session, u) for u in urls]
        results = await asyncio.gather(*tasks)
    return results
```

## Tratamento de Erros

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI()

class NotFoundError(BaseModel):
    detail: str
    error_code: str

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc), "error_code": "INVALID_INPUT"},
    )

@app.get("/divide/{a}/{b}")
async def divide(a: float, b: float):
    if b == 0:
        raise HTTPException(
            status_code=400,
            detail="Não é possível dividir por zero",
        )
    return {"result": a / b}
```

## Exemplo Real: API de Tarefas

```python
from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID, uuid4

app = FastAPI(title="API de Tarefas")

class TodoCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    completed: bool = False

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None

class Todo(BaseModel):
    id: UUID
    title: str
    completed: bool

    class Config:
        from_attributes = True

db: List[Todo] = []

@app.get("/todos", response_model=List[Todo])
async def list_todos(completed: Optional[bool] = None):
    if completed is None:
        return db
    return [t for t in db if t.completed == completed]

@app.post("/todos", response_model=Todo, status_code=201)
async def create_todo(todo: TodoCreate):
    new_todo = Todo(id=uuid4(), title=todo.title, completed=todo.completed)
    db.append(new_todo)
    return new_todo

@app.get("/todos/{todo_id}", response_model=Todo)
async def get_todo(todo_id: UUID):
    for t in db:
        if t.id == todo_id:
            return t
    raise HTTPException(404, "Tarefa não encontrada")

@app.put("/todos/{todo_id}", response_model=Todo)
async def update_todo(todo_id: UUID, update: TodoUpdate):
    for t in db:
        if t.id == todo_id:
            if update.title is not None:
                t.title = update.title
            if update.completed is not None:
                t.completed = update.completed
            return t
    raise HTTPException(404, "Tarefa não encontrada")

@app.delete("/todos/{todo_id}", status_code=204)
async def delete_todo(todo_id: UUID):
    for i, t in enumerate(db):
        if t.id == todo_id:
            db.pop(i)
            return
    raise HTTPException(404, "Tarefa não encontrada")
```

```mermaid
flowchart TD
    Client["Cliente"] -->|GET /todos| FastAPI["FastAPI"]
    Client -->|POST /todos| FastAPI
    Client -->|PUT /todos/{id}| FastAPI
    Client -->|DELETE /todos/{id}| FastAPI
    FastAPI -->|Validar| Pydantic["Modelo Pydantic"]
    FastAPI -->|Docs Automáticos| Swagger["/docs"]
    FastAPI -->|Retornar JSON| Client
```

## Questões de Prática

1. Crie uma aplicação FastAPI com endpoints CRUD para um recurso `Product` (nome, preço, categoria, in_stock).
2. O que é injeção de dependência e como o FastAPI a implementa? Mostre uma dependência personalizada para paginação.
3. Por que usar `BaseModel` do Pydantic em vez de dicionários simples para esquemas de requisição/resposta?
4. Implemente um endpoint assíncrono que busca dados de 5 APIs externas concorrentemente e retorna resultados combinados.
5. Adicione autenticação a uma aplicação FastAPI usando uma dependência que verifica um cabeçalho de chave de API.
6. Como você personaliza o esquema OpenAPI? Adicione descrições, tags e uma seção `servers` personalizada.
7. Construa um endpoint de upload de arquivos que aceita imagens, valida tamanho e tipo, e retorna uma URL.
8. Compare endpoints assíncronos vs síncronos do FastAPI. Quando usar cada um?
9. Implemente um middleware que mede a duração da requisição e a adiciona como um cabeçalho de resposta.
10. Adicione integração com banco de dados usando `Depends` com `yield` para gerenciamento de sessão em uma aplicação FastAPI.
