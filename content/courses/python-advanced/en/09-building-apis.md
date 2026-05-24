---
title: "Building APIs with FastAPI"
description: "Create production-ready REST APIs with FastAPI, Pydantic models, dependency injection, async endpoints, and automatic documentation"
order: 9
duration: "90 minutes"
difficulty: advanced
---

# Building APIs with FastAPI

## Why FastAPI?

FastAPI provides automatic OpenAPI docs, request validation via Pydantic, async support, and dependency injection—all with high performance.

```python
from fastapi import FastAPI

app = FastAPI(title="Advanced API", version="1.0.0")

@app.get("/health")
async def health():
    return {"status": "ok"}
```

Run with: `uvicorn main:app --reload`

Visit `/docs` for Swagger UI and `/redoc` for ReDoc.

## Routing

```python
from fastapi import FastAPI, Path, Query, HTTPException, status

app = FastAPI()

# Path parameters
@app.get("/items/{item_id}")
async def read_item(item_id: int = Path(..., ge=1, le=1000)):
    return {"item_id": item_id}

# Query parameters
@app.get("/search")
async def search(
    q: str = Query(None, min_length=3, max_length=50),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
):
    return {"query": q, "page": page, "size": size}

# Multiple HTTP methods
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

## Pydantic Models

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
            raise ValueError("Name cannot be blank")
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
    """Create a new user."""
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
Pydantic v2 uses Rust-based validation (via `pydantic-core`), making it significantly faster than v1. Use `Field()` for constraints and `@validator` for custom logic.

## Dependency Injection

```python
from fastapi import Depends, FastAPI, Header, HTTPException
from typing import Optional

app = FastAPI()

# Simple dependency
async def common_params(page: int = 1, size: int = 10):
    return {"page": page, "size": size}

@app.get("/items")
async def list_items(params: dict = Depends(common_params)):
    return params

# Class-based dependency
class Pagination:
    def __init__(self, page: int = 1, size: int = 10):
        self.page = page
        self.size = size

@app.get("/products")
async def list_products(pagination: Pagination = Depends()):
    return {"page": pagination.page, "size": pagination.size}

# Auth dependency
async def verify_token(authorization: Optional[str] = Header(None)):
    if authorization is None:
        raise HTTPException(status_code=401, detail="Missing token")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    return authorization.removeprefix("Bearer ")

@app.get("/protected")
async def protected_route(token: str = Depends(verify_token)):
    return {"message": "Access granted", "token": token}
```

### Dependency with yield (DB sessions)

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
    # perform work
    db.commit()
    return {"status": "committed"}
```

[!SUCCESS]
Dependency injection with `yield` is the idiomatic way to manage database sessions, request-scoped resources, and cleanup.

## Async Endpoints

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

## Error Handling

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
            detail="Cannot divide by zero",
        )
    return {"result": a / b}
```

## Real-World: Todo API

```python
from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID, uuid4

app = FastAPI(title="Todo API")

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
    raise HTTPException(404, "Todo not found")

@app.put("/todos/{todo_id}", response_model=Todo)
async def update_todo(todo_id: UUID, update: TodoUpdate):
    for t in db:
        if t.id == todo_id:
            if update.title is not None:
                t.title = update.title
            if update.completed is not None:
                t.completed = update.completed
            return t
    raise HTTPException(404, "Todo not found")

@app.delete("/todos/{todo_id}", status_code=204)
async def delete_todo(todo_id: UUID):
    for i, t in enumerate(db):
        if t.id == todo_id:
            db.pop(i)
            return
    raise HTTPException(404, "Todo not found")
```

```mermaid
flowchart TD
    Client["Client"] -->|GET /todos| FastAPI["FastAPI"]
    Client -->|POST /todos| FastAPI
    Client -->|PUT /todos/{id}| FastAPI
    Client -->|DELETE /todos/{id}| FastAPI
    FastAPI -->|Validate| Pydantic["Pydantic Model"]
    FastAPI -->|Auto Docs| Swagger["/docs"]
    FastAPI -->|Return JSON| Client
```

## Practice Questions

1. Create a FastAPI app with CRUD endpoints for a `Product` resource (name, price, category, in_stock).
2. What is dependency injection and how does FastAPI implement it? Show a custom dependency for pagination.
3. Why use Pydantic's `BaseModel` over plain dicts for request/response schemas?
4. Implement an async endpoint that fetches data from 5 external APIs concurrently and returns combined results.
5. Add authentication to a FastAPI app using a dependency that checks an API key header.
6. How do you customise the OpenAPI schema? Add descriptions, tags, and a custom `servers` section.
7. Build a file upload endpoint that accepts images, validates size and type, and returns a URL.
8. Compare FastAPI's async endpoints vs sync endpoints. When should you use each?
9. Implement a middleware that measures request duration and adds it as a response header.
10. Add database integration using `Depends` with `yield` for session management in a FastAPI app.
