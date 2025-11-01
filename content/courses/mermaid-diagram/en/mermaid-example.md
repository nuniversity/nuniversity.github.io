---
title: "Testing Mermaid Diagrams"
description: "A lesson to test diagram rendering"
order: 1
duration: "10 minutes"
difficulty: "beginner"
author: "Test Author"
---

# Mermaid Diagram Test

## Simple Flowchart
```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Success]
    B -->|No| D[Try Again]
    D --> B
    C --> E[End]
```

## Sequence Diagram
```mermaid
sequenceDiagram
    participant User
    participant System
    User->>System: Request
    System-->>User: Response
```

This lesson tests both author display and Mermaid rendering.

# Mermaid Diagram Examples

Complete reference guide for using Mermaid diagrams in your lessons.

## 1. Flowcharts

### Basic Flowchart
```mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
```

### Horizontal Flowchart
```mermaid
graph LR
    A[Input] --> B[Process]
    B --> C[Output]
    C --> D{More data?}
    D -->|Yes| A
    D -->|No| E[End]
```

### Software Architecture
```mermaid
graph TB
    subgraph Frontend
        A[React App]
        B[Redux Store]
    end
    subgraph Backend
        C[API Gateway]
        D[Auth Service]
        E[Data Service]
    end
    subgraph Database
        F[(PostgreSQL)]
        G[(Redis Cache)]
    end
    A --> B
    A --> C
    C --> D
    C --> E
    D --> F
    E --> F
    E --> G
```

## 2. Sequence Diagrams

### User Authentication Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth API
    participant DB as Database
    
    U->>F: Enter credentials
    F->>A: POST /login
    A->>DB: Verify user
    DB-->>A: User data
    A->>A: Generate JWT
    A-->>F: Return token
    F->>F: Store token
    F-->>U: Redirect to dashboard
```

### Payment Process
```mermaid
sequenceDiagram
    participant C as Customer
    participant S as Store
    participant P as Payment Gateway
    participant B as Bank
    
    C->>S: Select items
    C->>S: Checkout
    S->>P: Process payment
    P->>B: Authorize transaction
    B-->>P: Approved
    P-->>S: Payment confirmed
    S->>S: Create order
    S-->>C: Order confirmation
```

## 3. Class Diagrams

### Object-Oriented Design
```mermaid
classDiagram
    class User {
        +String id
        +String name
        +String email
        +login()
        +logout()
    }
    class Admin {
        +manageUsers()
        +viewAnalytics()
    }
    class Student {
        +enrollCourse()
        +submitAssignment()
    }
    User <|-- Admin
    User <|-- Student
    
    class Course {
        +String title
        +String description
        +addLesson()
    }
    Student "0..*" -- "0..*" Course : enrolls
```

### E-commerce System
```mermaid
classDiagram
    class Product {
        +int id
        +string name
        +decimal price
        +int stock
        +updateStock()
    }
    class Order {
        +int orderId
        +date orderDate
        +decimal total
        +calculateTotal()
    }
    class Customer {
        +int customerId
        +string name
        +string email
        +placeOrder()
    }
    class OrderItem {
        +int quantity
        +decimal subtotal
    }
    
    Customer "1" --> "0..*" Order
    Order "1" --> "1..*" OrderItem
    OrderItem "1" --> "1" Product
```

## 4. Entity Relationship Diagrams

### Database Schema
```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    CUSTOMER {
        int customer_id PK
        string name
        string email
        date created_at
    }
    ORDER {
        int order_id PK
        int customer_id FK
        date order_date
        decimal total
    }
    PRODUCT {
        int product_id PK
        string name
        decimal price
        int stock
    }
    ORDER_ITEM {
        int order_item_id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal price
    }
```

### Blog System

```mermaid
erDiagram
    USER ||--o{ POST : writes
    POST ||--o{ COMMENT : has
    USER ||--o{ COMMENT : makes
    POST }o--o{ TAG : tagged_with
    
    USER {
        int id PK
        string username
        string email
        string password_hash
    }
    POST {
        int id PK
        int author_id FK
        string title
        text content
        timestamp created_at
    }
    COMMENT {
        int id PK
        int post_id FK
        int user_id FK
        text content
        timestamp created_at
    }
    TAG {
        int id PK
        string name
    }
```

## 5. State Diagrams

### Order Status Flow
```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> Processing : Payment Confirmed
    Pending --> Cancelled : Payment Failed
    Processing --> Shipped : Items Packed
    Shipped --> Delivered : Received
    Delivered --> [*]
    Cancelled --> [*]
    
    Processing --> Cancelled : Out of Stock
    Shipped --> Returned : Customer Request
    Returned --> Refunded
    Refunded --> [*]
```

### User Session States
```mermaid
stateDiagram-v2
    [*] --> LoggedOut
    LoggedOut --> LoggingIn : Enter Credentials
    LoggingIn --> LoggedIn : Success
    LoggingIn --> LoggedOut : Failed
    LoggedIn --> Active : User Active
    Active --> Idle : No Activity
    Idle --> Active : User Returns
    Idle --> LoggedOut : Timeout
    LoggedIn --> LoggedOut : Logout
    Active --> LoggedOut : Logout
```

## 6. Gantt Charts

### Project Timeline
```mermaid
gantt
    title Web Application Development
    dateFormat YYYY-MM-DD
    section Planning
    Requirements       :a1, 2024-01-01, 7d
    Design            :a2, after a1, 10d
    section Development
    Backend API       :a3, after a2, 21d
    Frontend          :a4, after a2, 25d
    Database          :a5, after a2, 14d
```

### Course Development
```mermaid
gantt
    title Course Creation Timeline
    dateFormat YYYY-MM-DD
    section Content
    Lesson 1-5        :a1, 2024-02-01, 14d
    Lesson 6-10       :a2, after a1, 14d
```

## 7. Pie Charts

### Market Share
```mermaid
pie title Technology Stack Usage
    "React" : 35
    "Vue" : 25
    "Angular" : 20
    "Svelte" : 12
    "Others" : 8
```

### Course Completion Rates
```mermaid
pie title Student Progress
    "Completed" : 45
    "In Progress" : 30
    "Not Started" : 15
    "Dropped" : 10
```

## 8. Git Graphs

### Feature Development
```mermaid
gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    branch feature-login
    checkout feature-login
    commit
    commit
    checkout develop
    merge feature-login
    checkout main
    merge develop
    commit
```

## 9. Advanced Examples

### Microservices Architecture
```mermaid
graph TB
    subgraph Client Layer
        Web[Web App]
        Mobile[Mobile App]
    end
    
    subgraph API Gateway
        Gateway[API Gateway]
        Auth[Auth Service]
    end
    
    subgraph Services
        User[User Service]
        Product[Product Service]
        Order[Order Service]
        Payment[Payment Service]
    end
    
    subgraph Data Layer
        UserDB[(User DB)]
        ProductDB[(Product DB)]
        OrderDB[(Order DB)]
        Cache[(Redis)]
    end
    
    Web --> Gateway
    Mobile --> Gateway
    Gateway --> Auth
    Gateway --> User
    Gateway --> Product
    Gateway --> Order
    Gateway --> Payment
    
    User --> UserDB
    Product --> ProductDB
    Order --> OrderDB
    Payment --> Cache
```

### CI/CD Pipeline
```mermaid
graph LR
    A[Code Push] --> B[GitHub]
    B --> C{Tests Pass?}
    C -->|Yes| D[Build Docker Image]
    C -->|No| E[Notify Developer]
    D --> F[Push to Registry]
    F --> G{Deploy to Staging}
    G --> H[Integration Tests]
    H -->|Pass| I[Deploy to Production]
    H -->|Fail| E
    I --> J[Monitor]
```

## Tips for Effective Diagrams

1. **Keep it Simple**: Don't overcrowd diagrams with too many nodes
2. **Use Subgraphs**: Group related components for clarity
3. **Consistent Naming**: Use clear, descriptive labels
4. **Color Coding**: Use styling to highlight important paths (when supported)
5. **Test First**: Always verify syntax in a Mermaid editor before publishing

## Styling Notes

Some Mermaid features support styling:

```mermaid
graph TD
    A[Normal Node]
    B[Important Node]
    style B fill:#f96,stroke:#333,stroke-width:4px
```

## Common Issues

1. **Syntax Errors**: Use Mermaid Live Editor to validate
2. **Complex Diagrams**: Break into multiple simpler diagrams
3. **Long Labels**: Use abbreviations or break into multiple lines
4. **Direction**: Choose appropriate direction (TD, LR, RL, BT)

# TEST

```mermaid
architecture-beta
    group api(cloud)[API]
    service db(database)[Database] in api
    service disk1(disk)[Storage] in api
    service disk2(disk)[Storage] in api
    service server(server)[Server] in api
    db:L -- R:server
    disk1:T -- B:server
    disk2:T -- B:db
```

## Resources

- [Mermaid Official Documentation](https://mermaid.js.org/)
- [Mermaid Live Editor](https://mermaid.live/)
- [GitHub Mermaid Support](https://github.blog/2022-02-14-include-diagrams-markdown-files-mermaid/)