---
title: "Fundamentals of Data Engineering: Data Storage Systems"
description: "Understand data engineering fundamentals, master essential tools, and build foundational skills."
order: 3
duration: "15 minutes"
difficulty: "beginner"
---

## Module 3: Data Storage Systems

### 3.1 Relational Databases (RDBMS)

Relational databases organize data into tables with predefined schemas, using SQL for querying and maintaining ACID properties.

#### Core Concepts

**ACID Properties:**

*Atomicity:*
- Transactions are all-or-nothing
- Either all operations complete or none do
- Rollback on failure
- Example: Money transfer between accounts (debit and credit must both succeed)

*Consistency:*
- Database remains in valid state
- All constraints satisfied
- Referential integrity maintained
- Example: Foreign key constraints prevent orphaned records

*Isolation:*
- Concurrent transactions don't interfere
- Isolation levels control visibility
- Prevents dirty reads, phantom reads
- Example: Two users updating inventory simultaneously

*Durability:*
- Committed data persists
- Survives system failures
- Write-ahead logging (WAL)
- Example: Completed transaction survives power outage

**Isolation Levels:**

```sql
-- Read Uncommitted: Can see uncommitted changes (dirty reads)
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

-- Read Committed: Only see committed data (default in most databases)
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Repeatable Read: Same query returns same results within transaction
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Serializable: Strictest isolation, transactions execute as if serial
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

#### Popular RDBMS Systems

**PostgreSQL:**

*Strengths:*
- Advanced features (JSON, arrays, full-text search)
- Excellent performance for complex queries
- Strong consistency and reliability
- Rich extension ecosystem
- Open-source with active community

*Use Cases:*
- Transactional applications
- Geospatial data (PostGIS extension)
- Complex analytical queries
- JSON/document hybrid workloads

*Example Configuration:*

```sql
-- Optimize for analytics workload
ALTER SYSTEM SET shared_buffers = '8GB';
ALTER SYSTEM SET effective_cache_size = '24GB';
ALTER SYSTEM SET maintenance_work_mem = '2GB';
ALTER SYSTEM SET work_mem = '100MB';
ALTER SYSTEM SET random_page_cost = 1.1;  -- For SSD storage

-- Create indexes for performance
CREATE INDEX idx_orders_customer_date 
ON orders(customer_id, order_date DESC);

-- Partitioning for large tables
CREATE TABLE orders_2024 PARTITION OF orders
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

**MySQL:**

*Strengths:*
- Simple setup and administration
- Fast for read-heavy workloads
- Wide adoption and tooling
- Good for web applications
- Multiple storage engines (InnoDB, MyISAM)

*Use Cases:*
- Web applications (WordPress, Drupal)
- Read-heavy applications
- Simple transactional systems
- E-commerce platforms

**SQL Server:**

*Strengths:*
- Deep Microsoft ecosystem integration
- Enterprise features (Always On, columnstore indexes)
- Strong BI tools (SSRS, SSIS, SSAS)
- Excellent Windows integration
- Good management tools (SSMS)

*Use Cases:*
- Enterprise .NET applications
- Microsoft-centric environments
- Data warehousing (with columnstore)
- Complex business logic in database

**Oracle:**

*Strengths:*
- Enterprise-grade features
- Superior performance at scale
- Advanced security features
- Mature ecosystem
- Strong support options

*Use Cases:*
- Mission-critical applications
- Large enterprises
- Complex financial systems
- High-volume OLTP

#### Optimization Techniques

**Indexing Strategies:**

```sql
-- B-tree index (default, good for equality and range)
CREATE INDEX idx_email ON customers(email);

-- Composite index (order matters)
CREATE INDEX idx_customer_order ON orders(customer_id, order_date DESC);

-- Partial index (index subset of rows)
CREATE INDEX idx_active_customers ON customers(status)
WHERE status = 'active';

-- Covering index (includes extra columns)
CREATE INDEX idx_customer_details ON customers(customer_id)
INCLUDE (name, email, phone);

-- Full-text search index
CREATE INDEX idx_product_search ON products
USING GIN (to_tsvector('english', name || ' ' || description));
```

**Query Optimization:**

```sql
-- Use EXPLAIN to analyze query plans
EXPLAIN ANALYZE
SELECT c.name, COUNT(o.order_id) as order_count
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE c.created_at >= '2024-01-01'
GROUP BY c.customer_id, c.name
HAVING COUNT(o.order_id) > 5;

-- Optimize with proper indexes and rewriting
CREATE INDEX idx_customers_created ON customers(created_at);
CREATE INDEX idx_orders_customer ON orders(customer_id);

-- Use CTEs for complex queries
WITH active_customers AS (
    SELECT customer_id, name
    FROM customers
    WHERE created_at >= '2024-01-01'
),
customer_orders AS (
    SELECT customer_id, COUNT(*) as order_count
    FROM orders
    GROUP BY customer_id
    HAVING COUNT(*) > 5
)
SELECT ac.name, co.order_count
FROM active_customers ac
JOIN customer_orders co ON ac.customer_id = co.customer_id;
```

**Partitioning:**

```sql
-- Range partitioning by date
CREATE TABLE sales (
    sale_id BIGINT,
    sale_date DATE,
    amount DECIMAL(10,2)
) PARTITION BY RANGE (sale_date);

CREATE TABLE sales_2024_q1 PARTITION OF sales
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE sales_2024_q2 PARTITION OF sales
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- List partitioning by category
CREATE TABLE products (
    product_id INTEGER,
    category VARCHAR(50),
    name VARCHAR(200)
) PARTITION BY LIST (category);

CREATE TABLE products_electronics PARTITION OF products
    FOR VALUES IN ('electronics', 'computers');

CREATE TABLE products_clothing PARTITION OF products
    FOR VALUES IN ('clothing', 'accessories');
```

### 3.2 NoSQL Databases

NoSQL databases provide flexible schemas and horizontal scalability for specific use cases.

#### Document Stores

**MongoDB:**

*Data Model:*
- JSON-like documents (BSON format)
- Flexible schema within collections
- Embedded documents and arrays
- No joins (denormalize data)

*Example Document:*
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "customer_id": "CUST12345",
  "name": "John Doe",
  "email": "john@example.com",
  "addresses": [
    {
      "type": "home",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001"
    },
    {
      "type": "work",
      "street": "456 Office Blvd",
      "city": "New York",
      "state": "NY",
      "zip": "10002"
    }
  ],
  "orders": [
    {
      "order_id": "ORD001",
      "date": ISODate("2024-01-15"),
      "total": 150.00,
      "items": [
        {"product": "Widget", "quantity": 2, "price": 75.00}
      ]
    }
  ],
  "created_at": ISODate("2023-06-01"),
  "updated_at": ISODate("2024-01-15")
}
```

*Querying:*
```javascript
// Find customers in specific city
db.customers.find({
  "addresses.city": "New York"
})

// Aggregate pipeline
db.customers.aggregate([
  {
    $unwind: "$orders"
  },
  {
    $group: {
      _id: "$customer_id",
      total_spent: { $sum: "$orders.total" },
      order_count: { $sum: 1 }
    }
  },
  {
    $match: {
      total_spent: { $gte: 1000 }
    }
  }
])

// Create indexes
db.customers.createIndex({ "email": 1 }, { unique: true })
db.customers.createIndex({ "addresses.city": 1, "addresses.state": 1 })
```

*Use Cases:*
- Content management systems
- User profiles and preferences
- Product catalogs
- Real-time analytics
- Mobile applications

*Advantages:*
- Flexible schema for evolving data
- Natural data representation (objects)
- Horizontal scalability
- Rich query language

*Limitations:*
- No complex joins
- Eventual consistency in distributed setups
- Potential data duplication
- Memory-intensive for large working sets

#### Key-Value Stores

**Redis:**

*Data Structures:*
- Strings, hashes, lists, sets, sorted sets
- Pub/sub messaging
- Streams for event sourcing
- In-memory with optional persistence

*Example Usage:*
```python
import redis

r = redis.Redis(host='localhost', port=6379, db=0)

# Simple key-value
r.set('user:1000:name', 'John Doe')
r.get('user:1000:name')  # b'John Doe'

# Hash (object-like structure)
r.hset('user:1000', mapping={
    'name': 'John Doe',
    'email': 'john@example.com',
    'age': 30
})
r.hgetall('user:1000')

# List (queue, stack)
r.lpush('queue:emails', 'email1@example.com')
r.lpush('queue:emails', 'email2@example.com')
r.rpop('queue:emails')  # FIFO queue

# Set (unique values)
r.sadd('user:1000:interests', 'sports', 'music', 'travel')
r.smembers('user:1000:interests')

# Sorted set (leaderboard)
r.zadd('leaderboard', {'player1': 1500, 'player2': 1200, 'player3': 1800})
r.zrange('leaderboard', 0, -1, withscores=True, desc=True)

# Expiration
r.setex('session:abc123', 3600, 'session_data')  # Expires in 1 hour

# Atomic operations
r.incr('page:views:homepage')
r.incrby('user:1000:points', 10)
```

*Use Cases:*
- Session storage
- Caching layer
- Real-time leaderboards
- Rate limiting
- Pub/sub messaging
- Job queues

*Advantages:*
- Extremely fast (in-memory)
- Rich data structures
- Atomic operations
- Simple to use

*Limitations:*
- Limited by available RAM
- No complex queries
- Single-threaded (though supports clustering)

**DynamoDB (AWS):**

*Features:*
- Fully managed key-value and document database
- Automatic scaling
- Single-digit millisecond latency
- Strong or eventual consistency

*Data Model:*
```python
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Users')

# Put item
table.put_item(
    Item={
        'user_id': '12345',
        'email': 'john@example.com',
        'name': 'John Doe',
        'created_at': '2024-01-01T00:00:00Z',
        'attributes': {
            'premium': True,
            'country': 'US'
        }
    }
)

# Get item
response = table.get_item(
    Key={'user_id': '12345'}
)

# Query with partition and sort key
response = table.query(
    KeyConditionExpression='user_id = :uid AND created_at > :date',
    ExpressionAttributeValues={
        ':uid': '12345',
        ':date': '2023-01-01T00:00:00Z'
    }
)

# Global secondary index for querying by email
table.query(
    IndexName='email-index',
    KeyConditionExpression='email = :email',
    ExpressionAttributeValues={
        ':email': 'john@example.com'
    }
)
```

*Use Cases:*
- Serverless applications
- Gaming (user profiles, sessions)
- IoT data storage
- Mobile backends
- High-traffic applications

#### Column-Family Stores

**Apache Cassandra:**

*Architecture:*
- Distributed, masterless design
- Tunable consistency
- Linear scalability
- Wide-column store

*Data Model:*
```sql
-- Create keyspace (database)
CREATE KEYSPACE ecommerce
WITH replication = {
  'class': 'NetworkTopologyStrategy',
  'datacenter1': 3
};

-- Create table
CREATE TABLE ecommerce.orders_by_customer (
    customer_id UUID,
    order_date TIMESTAMP,
    order_id UUID,
    total_amount DECIMAL,
    status TEXT,
    PRIMARY KEY ((customer_id), order_date, order_id)
) WITH CLUSTERING ORDER BY (order_date DESC);

-- Insert data ...
```