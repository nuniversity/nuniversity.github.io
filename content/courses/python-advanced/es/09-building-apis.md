---
title: "Construyendo APIs con FastAPI"
description: "Crea APIs REST listas para producción con FastAPI, modelos Pydantic, inyección de dependencias, endpoints asíncronos y documentación automática"
order: 9
duration: "90 minutos"
difficulty: avanzado
---

# Construyendo APIs con FastAPI

## ¿Por qué FastAPI?

FastAPI proporciona documentación OpenAPI automática, validación de solicitudes mediante Pydantic, soporte asíncrono e inyección de dependencias—todo con alto rendimiento.

```python
from fastapi import FastAPI

app = FastAPI(title="API Avanzada", version="1.0.0")

@app.get("/health")
async def health():
    return {"status": "ok"}
```

Ejecuta con: `uvicorn main:app --reload`

Visita `/docs` para Swagger UI y `/redoc` para ReDoc.

## Enrutamiento

```python
from fastapi import FastAPI, Path, Query, HTTPException, status

app = FastAPI()

# Parámetros de ruta
@app.get("/items/{item_id}")
async def read_item(item_id: int = Path(..., ge=1, le=1000)):
    return {"item_id": item_id}

# Parámetros de consulta
@app.get("/search")
async def search(
    q: str = Query(None, min_length=3, max_length=50),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
):
    return {"query": q, "page": page, "size": size}

# Múltiples métodos HTTP
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
            raise ValueError("El nombre no puede estar en blanco")
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
    """Crea un nuevo usuario."""
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
Pydantic v2 usa validación basada en Rust (via `pydantic-core`), haciéndolo significativamente más rápido que v1. Usa `Field()` para restricciones y `@validator` para lógica personalizada.

## Inyección de Dependencias

```python
from fastapi import Depends, FastAPI, Header, HTTPException
from typing import Optional

app = FastAPI()

# Dependencia simple
async def common_params(page: int = 1, size: int = 10):
    return {"page": page, "size": size}

@app.get("/items")
async def list_items(params: dict = Depends(common_params)):
    return params

# Dependencia basada en clase
class Pagination:
    def __init__(self, page: int = 1, size: int = 10):
        self.page = page
        self.size = size

@app.get("/products")
async def list_products(pagination: Pagination = Depends()):
    return {"page": pagination.page, "size": pagination.size}

# Dependencia de autenticación
async def verify_token(authorization: Optional[str] = Header(None)):
    if authorization is None:
        raise HTTPException(status_code=401, detail="Token ausente")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido")
    return authorization.removeprefix("Bearer ")

@app.get("/protected")
async def protected_route(token: str = Depends(verify_token)):
    return {"message": "Acceso concedido", "token": token}
```

### Dependencia con yield (Sesiones de BD)

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
    # realizar trabajo
    db.commit()
    return {"status": "confirmado"}
```

[!SUCCESS]
La inyección de dependencias con `yield` es la forma idiomática de gestionar sesiones de base de datos, recursos por solicitud y limpieza.

## Endpoints Asíncronos

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

## Manejo de Errores

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
            detail="No se puede dividir por cero",
        )
    return {"result": a / b}
```

## Ejemplo Real: API de Tareas

```python
from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID, uuid4

app = FastAPI(title="API de Tareas")

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
    raise HTTPException(404, "Tarea no encontrada")

@app.put("/todos/{todo_id}", response_model=Todo)
async def update_todo(todo_id: UUID, update: TodoUpdate):
    for t in db:
        if t.id == todo_id:
            if update.title is not None:
                t.title = update.title
            if update.completed is not None:
                t.completed = update.completed
            return t
    raise HTTPException(404, "Tarea no encontrada")

@app.delete("/todos/{todo_id}", status_code=204)
async def delete_todo(todo_id: UUID):
    for i, t in enumerate(db):
        if t.id == todo_id:
            db.pop(i)
            return
    raise HTTPException(404, "Tarea no encontrada")
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

## Preguntas de Práctica

1. Crea una aplicación FastAPI con endpoints CRUD para un recurso `Product` (nombre, precio, categoría, in_stock).
2. ¿Qué es la inyección de dependencias y cómo la implementa FastAPI? Muestra una dependencia personalizada para paginación.
3. ¿Por qué usar `BaseModel` de Pydantic en lugar de diccionarios simples para esquemas de solicitud/respuesta?
4. Implementa un endpoint asíncrono que obtenga datos de 5 APIs externas concurrentemente y retorne resultados combinados.
5. Añade autenticación a una aplicación FastAPI usando una dependencia que verifique un encabezado de clave de API.
6. ¿Cómo personalizas el esquema OpenAPI? Añade descripciones, tags y una sección `servers` personalizada.
7. Construye un endpoint de carga de archivos que acepte imágenes, valide tamaño y tipo, y retorne una URL.
8. Compara endpoints asíncronos vs síncronos de FastAPI. ¿Cuándo usar cada uno?
9. Implementa un middleware que mida la duración de la solicitud y la añada como un encabezado de respuesta.
10. Añade integración con base de datos usando `Depends` con `yield` para gestión de sesiones en una aplicación FastAPI.
