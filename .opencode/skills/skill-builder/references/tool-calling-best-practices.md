# Tool Calling Best Practices

## Overview

Tools give agents superpowers, but they require careful design to work reliably with LLMs.

## Tool Design Principles

### 1. Simplicity Over Complexity

```python
# BAD - Too many parameters
tools = [{
    "name": "complex-tool",
    "parameters": {
        "type": "object",
        "properties": {
            "param1": {"type": "string"},
            "param2": {"type": "integer"},
            "param3": {"type": "boolean"},
            "param4": {"type": "array"},
            "param5": {"type": "object"},
            "param6": {"type": "string"},
            "param7": {"type": "integer"},
            "param8": {"type": "boolean"},
        }
    }
}]

# GOOD - Focused tools
tools = [
    {
        "name": "create-user",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "email": {"type": "string"}
            }
        }
    },
    {
        "name": "update-user",
        "parameters": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"}
            }
        }
    }
]
```

### 2. Clear Descriptions

```python
# BAD - Vague description
tools = [{
    "name": "process-data",
    "description": "Processes data"
}]

# GOOD - Specific description
tools = [{
    "name": "validate-email",
    "description": "Validates an email address format and checks if the domain has valid MX records"
}]
```

### 3. Type-Safe Parameters

```python
# BAD - Untyped parameters
tools = [{
    "name": "get-user",
    "parameters": {
        "type": "object",
        "properties": {
            "id": {"type": "string"}
        }
    }
}]

# GOOD - Typed and constrained
tools = [{
    "name": "get-user",
    "parameters": {
        "type": "object",
        "properties": {
            "id": {
                "type": "string",
                "pattern": "^usr_[a-z0-9]{12}$",
                "description": "User ID (format: usr_XXXXXXXXXXXX)"
            }
        }
    }
}]
```

## Error Handling

### Graceful Failures

```python
# BAD - Throws exception
async def execute(params):
    result = api_call(params)
    return result

# GOOD - Handles errors
async def execute(params):
    try:
        result = api_call(params)
        return {"success": true, "data": result}
    except ValidationError as e:
        return {"success": false, "error": f"Validation failed: {e}"}
    except APIError as e:
        return {"success": false, "error": f"API error: {e}"}
```

### Informative Error Messages

```python
# BAD
return {"error": "Failed"}

# GOOD
return {
    "error": "User not found",
    "details": f"No user with ID '{user_id}' exists",
    "suggestion": "Check the user ID format (should be usr_XXXXXXXXXXXX)"
}
```

## Schema Validation

### Validate Before Execution

```python
async def execute(params):
    # Validate input
    errors = validate_params(params)
    if errors:
        return {"error": "Invalid parameters", "details": errors}
    
    # Execute with validated params
    result = await process(params)
    return result
```

### Schema as Contract

```json
{
  "name": "search-users",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "minLength": 2,
        "maxLength": 100,
        "description": "Search query (2-100 characters)"
      },
      "limit": {
        "type": "integer",
        "minimum": 1,
        "maximum": 100,
        "default": 10,
        "description": "Number of results to return"
      }
    },
    "required": ["query"]
  }
}
```

## Tool Composition

### Chain Tools

```python
# Tool 1: Search
tools = [{
    "name": "search-users",
    "description": "Search for users by name or email"
}]

# Tool 2: Get Details
tools = [{
    "name": "get-user-details",
    "description": "Get detailed information about a specific user"
}]

# Agent workflow:
# 1. search-users("John") → [{id: "usr_123", name: "John"}]
# 2. get-user-details("usr_123") → {email: "john@example.com", ...}
```

### Parallel Execution

```python
# Tools that can run in parallel
tools = [
    {"name": "get-user", "description": "Get user by ID"},
    {"name": "get-orders", "description": "Get orders by user ID"},
    {"name": "get-reviews", "description": "Get reviews by user ID"}
]

# Agent can call all three in parallel
```

## Idempotency

### Design Idempotent Tools

```python
# BAD - Creates duplicate records
async def create_order(params):
    return await db.orders.create(params)

# GOOD - Uses idempotency key
async def create_order(params):
    idempotency_key = params.get("idempotency_key")
    existing = await db.orders.find_by_idempotency_key(idempotency_key)
    if existing:
        return existing
    return await db.orders.create(params)
```

### Document Idempotency

```python
tools = [{
    "name": "create-order",
    "description": "Create a new order. This operation is idempotent - if an order with the same idempotency_key exists, it will be returned instead of creating a duplicate.",
    "parameters": {
        "type": "object",
        "properties": {
            "idempotency_key": {
                "type": "string",
                "description": "Unique key for idempotent operation"
            }
        }
    }
}]
```

## Performance

### Cache Results

```python
from functools import lru_cache

@lru_cache(maxsize=100)
async def get_user(user_id):
    return await db.users.find_by_id(user_id)
```

### Batch Operations

```python
# BAD - One at a time
async def get_users(user_ids):
    results = []
    for user_id in user_ids:
        results.append(await get_user(user_id))
    return results

# GOOD - Batch query
async def get_users(user_ids):
    return await db.users.find_many({"id": {"$in": user_ids}})
```

### Rate Limiting

```python
import asyncio
from functools import wraps

def rate_limit(calls_per_second=10):
    def decorator(func):
        semaphore = asyncio.Semaphore(calls_per_second)
        @wraps(func)
        async def wrapper(*args, **kwargs):
            async with semaphore:
                return await func(*args, **kwargs)
        return wrapper
    return decorator

@rate_limit(calls_per_second=10)
async def api_call(params):
    return await external_api.call(params)
```

## Testing

### Unit Tests

```python
def test_tool_execution():
    result = tool.execute({"input": "test"})
    assert result["success"] == True

def test_tool_validation():
    result = tool.execute({})
    assert result["error"] == "Missing required parameter"
```

### Integration Tests

```python
async def test_tool_workflow():
    # Search
    search_result = await search_tool.execute({"query": "test"})
    assert len(search_result["results"]) > 0
    
    # Get details
    user_id = search_result["results"][0]["id"]
    details = await get_user_tool.execute({"id": user_id})
    assert details["name"] == "Test User"
```

### Load Tests

```python
async def test_tool_performance():
    start = time.time()
    for _ in range(100):
        await tool.execute({"input": "test"})
    elapsed = time.time() - start
    assert elapsed < 10  # 100 calls in under 10 seconds
```

## Documentation

### Tool Documentation

```markdown
# search-users

Search for users by name or email.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query (2-100 characters) |
| limit | integer | No | Results to return (1-100, default: 10) |

## Returns

```json
{
  "success": true,
  "results": [
    {"id": "usr_123", "name": "John", "email": "john@example.com"}
  ]
}
```

## Errors

- `Invalid query`: Query too short or too long
- `Rate limited`: Too many requests
- `Service unavailable`: External API down
```

## References

- [OpenCode Tools](https://opencode.ai/docs/tools/)
- [MCP Specification](https://modelcontextprotocol.io/)
- [Tool Calling Best Practices](https://platform.openai.com/docs/guides/function-calling)
