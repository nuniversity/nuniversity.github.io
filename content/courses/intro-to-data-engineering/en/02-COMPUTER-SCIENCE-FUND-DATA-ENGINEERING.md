---
title: "Fundamentals of Data Engineering: Data Architecture Fundamentals"
description: "Understand data engineering fundamentals, master essential tools, and build foundational skills."
order: 2
duration: "15 minutes"
difficulty: "beginner"
---

## Module 2: Data Architecture Fundamentals

### 2.1 Principles of Data Architecture

Data architecture defines the structure, policies, rules, and standards that govern how data is collected, stored, arranged, integrated, and used within an organization. A well-designed data architecture serves as the blueprint for all data initiatives.

#### Core Principles

**1. Scalability**

Scalability ensures systems can handle growing data volumes, user loads, and complexity without degradation.

*Vertical Scaling (Scale Up):*
- Adding more resources (CPU, RAM, storage) to existing machines
- Simpler to implement but has physical limits
- More expensive per unit of capacity
- Example: Upgrading database server from 64GB to 256GB RAM

*Horizontal Scaling (Scale Out):*
- Adding more machines to distribute workload
- Theoretically unlimited scalability
- More cost-effective for large scale
- Requires distributed system design
- Example: Adding nodes to a Spark cluster

*Design Considerations:*
- Partition data across nodes for parallel processing
- Use distributed storage systems (HDFS, S3)
- Implement load balancing across servers
- Design stateless components when possible
- Plan for data growth (3-5 year projections)

**2. Reliability and Availability**

Systems must be dependable and accessible when needed.

*Reliability Metrics:*
- **MTBF (Mean Time Between Failures):** Average time system operates without failure
- **MTTR (Mean Time To Repair):** Average time to restore service after failure
- **Uptime Percentage:** 99.9% = ~8.7 hours downtime/year, 99.99% = ~52 minutes/year

*Techniques:*
- Redundancy: Duplicate critical components
- Replication: Copy data across multiple locations
- Backup and Recovery: Regular backups with tested restore procedures
- Health Checks: Monitor system components continuously
- Graceful Degradation: Partial functionality during failures

*Example Architecture for High Availability:*
```diagram
Region 1 (Primary)        Region 2 (Secondary)
├─ Load Balancer         ├─ Load Balancer
├─ App Server 1          ├─ App Server 1
├─ App Server 2          ├─ App Server 2
├─ Database Primary ────→├─ Database Replica
└─ Cache Layer           └─ Cache Layer
```

**3. Maintainability**

Systems should be easy to understand, modify, and extend.

*Best Practices:*
- Clear documentation of architecture decisions
- Consistent naming conventions across systems
- Modular design with well-defined interfaces
- Automated testing and deployment
- Code reviews and pair programming
- Technical debt tracking and remediation

*Documentation Standards:*
- Architecture diagrams (logical and physical)
- Data flow diagrams
- API documentation
- Runbooks for operations
- Change logs and version history

**4. Security**

Protect data from unauthorized access, breaches, and corruption.

*Security Layers:*
- **Network Security:** Firewalls, VPNs, network segmentation
- **Application Security:** Authentication, authorization, input validation
- **Data Security:** Encryption at rest and in transit, data masking
- **Access Control:** Role-based access control (RBAC), principle of least privilege
- **Audit and Compliance:** Logging, monitoring, compliance reporting

*Common Threats:*
- SQL injection attacks
- Data breaches through misconfigured storage
- Insider threats
- Man-in-the-middle attacks
- Ransomware

**5. Cost Efficiency**

Balance performance and functionality with total cost of ownership.

*Cost Optimization Strategies:*
- Right-size compute resources based on actual usage
- Use spot/preemptible instances for fault-tolerant workloads
- Implement data lifecycle policies (hot/warm/cold storage)
- Compress data to reduce storage costs
- Schedule non-critical jobs during off-peak hours
- Monitor and eliminate unused resources
- Negotiate enterprise agreements with vendors

*Cost Components:*
- Compute: CPU, memory for processing
- Storage: Database, object storage, backup storage
- Network: Data transfer, API calls
- Licensing: Software and service fees
- Personnel: Engineering time for maintenance

**6. Performance**

Optimize for query speed, throughput, and latency requirements.

*Key Metrics:*
- **Latency:** Time to complete a single operation (p50, p95, p99)
- **Throughput:** Operations per second the system can handle
- **Resource Utilization:** CPU, memory, disk, network usage

*Optimization Techniques:*
- Indexing for faster queries
- Caching frequently accessed data
- Query optimization (explain plans)
- Data partitioning and clustering
- Compression to reduce I/O
- Parallel processing
- Materialized views for complex aggregations

### 2.2 Data Architecture Patterns

#### Pattern 1: Lambda Architecture

Lambda Architecture processes both batch and real-time data through parallel paths.

**Components:**

*Batch Layer:*
- Stores complete dataset (immutable, append-only)
- Computes batch views through distributed processing
- Provides accuracy and completeness
- Updates periodically (hourly, daily)

*Speed Layer:*
- Processes recent data in real-time
- Fills gap between batch computations
- Provides low latency at cost of potential inaccuracy
- Maintains state in memory or fast storage

*Serving Layer:*
- Merges results from batch and speed layers
- Responds to queries
- Provides unified view to end users

**Use Cases:**
- Social media analytics (trending topics)
- Fraud detection (immediate alerts + historical patterns)
- Recommendation systems (real-time + offline training)

**Advantages:**
- Handles both real-time and batch requirements
- Provides accuracy through batch processing
- Fault-tolerant (batch layer can reprocess)
- Flexible to different latency requirements

**Challenges:**
- Complexity of maintaining two codebases
- Synchronizing batch and speed layers
- Higher operational overhead
- Potential for inconsistencies between layers

**Technology Stack Example:**
```diagram
Data Sources
    ↓
Kafka (ingestion)
    ↓
├─ Batch Layer: HDFS → Spark → Cassandra
└─ Speed Layer: Storm/Flink → Redis
    ↓
Serving Layer: API merging both results
    ↓
BI Tools / Applications
```

#### Pattern 2: Kappa Architecture

Kappa Architecture simplifies Lambda by using only streaming, treating batch as a special case of streaming.

**Core Concept:**
Everything is a stream. Batch processing is just streaming over historical data with the same code.

**Components:**
- Single processing engine for all data
- Event log as source of truth (Kafka)
- Reprocessing by replaying event log

**Use Cases:**
- Real-time monitoring dashboards
- Event-driven systems
- Systems where all data is event-based

**Advantages:**
- Simplified architecture (one codebase)
- Easier to maintain and debug
- Naturally handles late-arriving data
- Lower operational complexity

**Challenges:**
- Requires event log to store complete history
- More complex stream processing logic
- May not be suitable for all batch workloads
- Higher storage costs for complete history

**Technology Stack Example:**

```diagram
Data Sources → Kafka → Flink/Spark Streaming → Database
                ↓
           (retained for reprocessing)
```

#### Pattern 3: Data Mesh

Data Mesh decentralizes data ownership, treating data as a product owned by domain teams.

**Core Principles:**

*1. Domain-Oriented Ownership:*
- Business domains own their data
- Teams responsible for data quality and SLAs
- Reduces central bottlenecks

*2. Data as a Product:*
- Each domain treats data outputs as products
- Focus on usability and discoverability
- Well-documented interfaces and contracts

*3. Self-Service Data Platform:*
- Centralized platform providing infrastructure capabilities
- Domain teams can independently create and manage data products
- Standardized tools and frameworks

*4. Federated Computational Governance:*
- Global standards for interoperability, security, and compliance
- Automated policy enforcement
- Decentralized execution

**Architecture Components:**

*Data Product:*
- Domain data with clear ownership
- APIs or interfaces for access
- Documentation and metadata
- Quality guarantees (SLA)
- Versioning and lifecycle management

*Data Platform:*
- Self-service infrastructure
- Pipeline templates and tools
- Monitoring and observability
- Storage and compute resources
- Governance enforcement

**Use Cases:**
- Large organizations with multiple business domains
- Companies transitioning from monolithic data platforms
- Organizations promoting data democratization

**Advantages:**
- Scales with organizational complexity
- Domain expertise applied to data
- Reduces central team bottlenecks
- Encourages data product thinking
- Faster time to market for data initiatives

**Challenges:**
- Requires cultural transformation
- Initial platform investment
- Ensuring consistency across domains
- Potential for data silos
- Complex governance model

**Example Organization:**

```diagram
Central Data Platform Team
├─ Self-service infrastructure
├─ Governance policies
└─ Shared services

Domain Teams (Data Product Owners):
├─ Sales Domain
│   ├─ Customer acquisition data product
│   └─ Revenue analytics data product
├─ Marketing Domain
│   ├─ Campaign performance data product
│   └─ Attribution data product
└─ Operations Domain
    ├─ Supply chain data product
    └─ Logistics data product
```

#### Pattern 4: Data Lakehouse

Data Lakehouse combines benefits of data lakes (flexibility, low cost) with data warehouses (performance, ACID transactions).

**Key Features:**

*Transaction Support:*
- ACID guarantees for data consistency
- Concurrent reads and writes
- Time travel and versioning

*Schema Enforcement and Evolution:*
- Schema validation on write
- Support for schema changes
- Backwards compatibility

*BI Tool Support:*
- Direct SQL access without ETL
- Optimized for analytical queries
- Indexing and statistics

*Unified Batch and Streaming:*
- Single platform for all processing
- Incremental processing capabilities
- Real-time data freshness

**Technologies:**
- **Delta Lake:** Open-source format on Spark
- **Apache Iceberg:** Table format for huge datasets
- **Apache Hudi:** Incremental processing on data lakes
- **Databricks:** Commercial lakehouse platform

**Use Cases:**
- Organizations wanting both flexibility and performance
- ML workloads requiring diverse data types
- Companies consolidating lakes and warehouses
- Real-time analytics on historical data

**Advantages:**
- Single platform reduces complexity
- Cost-effective storage
- Supports diverse data types
- Eliminates data duplication
- Enables advanced analytics and ML

**Challenges:**
- Newer technology with evolving best practices
- Learning curve for teams
- Migration from existing systems
- Performance tuning complexity

**Architecture Example:**

```diagram
Data Sources
    ↓
Ingestion (Streaming + Batch)
    ↓
Bronze Layer (Raw Data)
├─ Files in Delta/Iceberg format
└─ Metadata and schema registry
    ↓
Silver Layer (Cleaned, Conformed)
├─ Validated and enriched data
└─ ACID transactions
    ↓
Gold Layer (Business-Level Aggregates)
├─ Dimensional models
└─ Optimized for BI
    ↓
Consumption
├─ SQL Analytics
├─ ML/AI
└─ BI Tools
```

### 2.3 Batch vs. Stream Processing

Understanding when to use batch versus stream processing is fundamental to data architecture decisions.

#### Batch Processing

**Characteristics:**
- Processes data in large groups (batches)
- Scheduled execution (hourly, daily, weekly)
- Higher latency (minutes to hours)
- Optimized for throughput
- Processes complete datasets

**When to Use Batch:**
- Data doesn't require real-time insights
- Complex computations on large datasets
- Historical analysis and reporting
- Cost-sensitive workloads (can run during off-peak)
- Data arrives in scheduled intervals

**Technologies:**
- Apache Spark (batch mode)
- SQL-based transformations (dbt)
- MapReduce
- Cloud data warehouses

**Example Use Cases:**

*Daily Sales Report:*

```python
# Pseudo-code for batch processing
def daily_sales_report(date):
    # Extract previous day's transactions
    transactions = read_transactions(date)
    
    # Transform: aggregate by product and region
    sales_summary = transactions.groupby(['product', 'region']).agg({
        'amount': 'sum',
        'quantity': 'sum',
        'orders': 'count'
    })
    
    # Load to reporting table
    write_to_warehouse(sales_summary, 'daily_sales')
    
# Scheduled to run at 2 AM daily
```

**Advantages:**
- Simpler to implement and debug
- Better for complex transformations
- More cost-effective for large volumes
- Easier to reprocess historical data
- Mature ecosystem and tooling

**Limitations:**
- Higher latency
- Cannot react to events immediately
- Resource-intensive (processes everything)
- Delayed error detection

#### Stream Processing

**Characteristics:**
- Processes data records immediately as they arrive
- Continuous execution
- Low latency (milliseconds to seconds)
- Event-driven architecture
- Processes incremental data

**When to Use Streaming:**
- Real-time monitoring and alerting required
- Time-sensitive business decisions
- Event-driven architectures
- Continuous data feeds
- Immediate feedback loops

**Technologies:**
- Apache Kafka + Kafka Streams
- Apache Flink
- Apache Storm
- AWS Kinesis
- Google Dataflow
- Spark Structured Streaming

**Example Use Cases:**

*Real-time Fraud Detection:*

```python
# Pseudo-code for stream processing
def process_transaction_stream():
    for transaction in transaction_stream:
        # Enrich with user profile
        user = get_user_profile(transaction.user_id)
        
        # Check fraud rules
        fraud_score = calculate_fraud_score(transaction, user)
        
        if fraud_score > THRESHOLD:
            # Alert immediately
            send_alert(transaction, fraud_score)
            block_transaction(transaction)
        else:
            # Approve transaction
            approve_transaction(transaction)
        
        # Update statistics
        update_user_profile(user, transaction)
```

**Advantages:**
- Low latency responses
- Immediate insights and actions
- Efficient resource usage (incremental processing)
- Better user experiences
- Supports event-driven architectures

**Limitations:**
- More complex to implement
- Harder to debug and test
- State management challenges
- Requires careful ordering and deduplication
- Higher operational complexity

#### Hybrid Approaches

Many real-world systems combine both patterns.

**Micro-batching:**
- Process small batches frequently (seconds to minutes)
- Balances latency and efficiency
- Example: Spark Structured Streaming

**Stream with Batch Backfill:**
- Stream processing for recent data
- Batch processing to correct or enrich
- Example: Real-time dashboard with daily reconciliation

**Decision Framework:**

| Criteria | Batch | Stream |
|----------|-------|--------|
| Latency requirement | > 1 hour | < 1 minute |
| Data volume | Very large | Any |
| Complexity | High | Medium |
| Cost sensitivity | High | Medium |
| Error tolerance | Low (can reprocess) | Low (must be correct first time) |
| Query patterns | Complex analytics | Simple transformations |

### 2.4 Data Modeling Concepts

Data modeling is the process of defining the structure, relationships, and constraints of data to support business processes.

#### Conceptual Data Modeling

**Purpose:** High-level representation of business requirements independent of technology.

**Components:**
- Entities (business objects)
- Relationships between entities
- Key attributes
- Business rules

**Example: E-commerce Conceptual Model**
```diagram
Entities:
- Customer (CustomerID, Name, Email)
- Order (OrderID, OrderDate, TotalAmount)
- Product (ProductID, Name, Price)
- Vendor (VendorID, Name, Location)

Relationships:
- Customer places Order (one-to-many)
- Order contains Product (many-to-many)
- Vendor supplies Product (one-to-many)

Business Rules:
- Order must have at least one product
- Customer must have valid email
- Product price must be positive
```

#### Logical Data Modeling

**Purpose:** Detailed representation of data structures independent of database technology.

**Components:**
- All entities and attributes
- Primary and foreign keys
- Normalization level
- Constraints and validations
- Attribute data types (conceptual level)

**Normalization:**

*1NF (First Normal Form):*
- Atomic values (no repeating groups)
- Each column contains only one value

*2NF (Second Normal Form):*
- Meets 1NF
- No partial dependencies (all non-key attributes depend on entire primary key)

*3NF (Third Normal Form):*
- Meets 2NF
- No transitive dependencies (non-key attributes depend only on primary key)

**Example Progression:**

*Unnormalized:*
```
Order: OrderID, CustomerName, CustomerEmail, Products, Quantities, Prices
```

*1NF (atomic values):*
```diagram
Order: OrderID, CustomerName, CustomerEmail
OrderLine: OrderID, ProductName, Quantity, Price
```

*2NF (remove partial dependencies):*
```diagram
Order: OrderID, CustomerID
Customer: CustomerID, Name, Email
OrderLine: OrderID, ProductID, Quantity, Price
Product: ProductID, Name
```

*3NF (remove transitive dependencies):*
```diagram
Order: OrderID, CustomerID, OrderDate
Customer: CustomerID, Name, Email
OrderLine: OrderLineID, OrderID, ProductID, Quantity
Product: ProductID, Name, Price
```

#### Physical Data Modeling

**Purpose:** Implementation-specific design optimized for database technology.

**Components:**
- Table definitions with exact data types
- Indexes for performance
- Partitioning strategies
- Storage parameters
- Physical constraints

**PostgreSQL Example:**
```sql
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_email ON customers(email);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    order_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (order_date);

CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE orders_2024_q2 PARTITION OF orders
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');
```

### 2.5 Dimensional Modeling

Dimensional modeling is optimized for analytical queries and business intelligence.

#### Core Concepts

**Fact Tables:**
- Contain measurable business events
- Store numerical metrics (facts)
- Foreign keys to dimension tables
- Typically very large (millions to billions of rows)
- Grain defines level of detail

**Dimension Tables:**
- Contain descriptive attributes
- Provide context to facts
- Typically smaller (thousands to millions of rows)
- Denormalized for query performance
- Contain hierarchies

#### Star Schema

**Structure:**
- Central fact table
- Dimension tables directly connected
- Denormalized dimensions
- Simple joins for queries
- Best query performance

**Example: Sales Analytics**

```sql
-- Fact Table
CREATE TABLE fact_sales (
    sale_id BIGINT PRIMARY KEY,
    date_key INTEGER REFERENCES dim_date(date_key),
    product_key INTEGER REFERENCES dim_product(product_key),
    customer_key INTEGER REFERENCES dim_customer(customer_key),
    store_key INTEGER REFERENCES dim_store(store_key),
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    sales_amount DECIMAL(10,2),
    cost_amount DECIMAL(10,2),
    profit_amount DECIMAL(10,2)
);

-- Dimension: Date
CREATE TABLE dim_date (
    date_key INTEGER PRIMARY KEY,
    date DATE,
    day_of_week VARCHAR(10),
    day_of_month INTEGER,
    day_of_year INTEGER,
    week_of_year INTEGER,
    month_name VARCHAR(10),
    month_number INTEGER,
    quarter INTEGER,
    year INTEGER,
    is_weekend BOOLEAN,
    is_holiday BOOLEAN
);

-- Dimension: Product
CREATE TABLE dim_product (
    product_key INTEGER PRIMARY KEY,
    product_id VARCHAR(50),
    product_name VARCHAR(200),
    brand VARCHAR(100),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    unit_cost DECIMAL(10,2),
    unit_price DECIMAL(10,2)
);

-- Dimension: Customer
CREATE TABLE dim_customer (
    customer_key INTEGER PRIMARY KEY,
    customer_id VARCHAR(50),
    customer_name VARCHAR(200),
    customer_segment VARCHAR(50),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    zip_code VARCHAR(20)
);

-- Dimension: Store
CREATE TABLE dim_store (
    store_key INTEGER PRIMARY KEY,
    store_id VARCHAR(50),
    store_name VARCHAR(200),
    store_type VARCHAR(50),
    city VARCHAR(100),
    state VARCHAR(100),
    region VARCHAR(50),
    square_footage INTEGER
);
```

**Query Example:**
```sql
-- Total sales by product category and quarter
SELECT 
    p.category,
    d.quarter,
    d.year,
    SUM(f.sales_amount) as total_sales,
    SUM(f.profit_amount) as total_profit,
    COUNT(DISTINCT f.customer_key) as unique_customers
FROM fact_sales f
JOIN dim_product p ON f.product_key = p.product_key
JOIN dim_date d ON f.date_key = d.date_key
WHERE d.year = 2024
GROUP BY p.category, d.quarter, d.year
ORDER BY total_sales DESC;
```

#### Snowflake Schema

**Structure:**
- Normalized dimension tables
- Dimensions split into sub-dimensions
- More complex joins
- Saves storage space
- Slower query performance

**When to Use:**
- Storage constraints are critical
- Dimension updates are frequent
- Dimensions are very large

**Example:**
```sql
-- Normalized Product Dimension
CREATE TABLE dim_product (
    product_key INTEGER PRIMARY KEY,
    product_id VARCHAR(50),
    product_name VARCHAR(200),
    subcategory_key INTEGER REFERENCES dim_subcategory(subcategory_key),
    unit_cost DECIMAL(10,2),
    unit_price DECIMAL(10,2)
);

CREATE TABLE dim_subcategory (
    subcategory_key INTEGER PRIMARY KEY,
    subcategory_name VARCHAR(100),
    category_key INTEGER REFERENCES dim_category(category_key)
);

CREATE TABLE dim_category (
    category_key INTEGER PRIMARY KEY,
    category_name VARCHAR(100),
    department_key INTEGER REFERENCES dim_department(department_key)
);

CREATE TABLE dim_department (
    department_key INTEGER PRIMARY KEY,
    department_name VARCHAR(100)
);
```

#### Slowly Changing Dimensions (SCD)

Techniques for handling changes to dimension attributes over time.

**Type 0: Retain Original**
- Never update, keep original values
- Used for attributes that should never change
- Example: Customer's original acquisition date

**Type 1: Overwrite**
- Update existing record
- No history maintained
- Simple but loses historical context

```sql
-- Customer moves to new city
UPDATE dim_customer
SET city = 'New York', state = 'NY', updated_at = CURRENT_TIMESTAMP
WHERE customer_key = 12345;
```

**Type 2: Add New Row**
- Create new record for each change
- Maintain complete history
- Most common approach for analytics

```sql
CREATE TABLE dim_customer (
    customer_key INTEGER PRIMARY KEY,
    customer_id VARCHAR(50),
    customer_name VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(100),
    effective_date DATE,
    expiration_date DATE,
    is_current BOOLEAN,
    version INTEGER
);

-- Customer moves to new city
-- Expire old record
UPDATE dim_customer
SET expiration_date = CURRENT_DATE, is_current = FALSE
WHERE customer_id = 'CUST123' AND is_current = TRUE;

-- Insert new record
INSERT INTO dim_customer VALUES (
    12346, 'CUST123', 'John Doe', 'New York', 'NY',
    CURRENT_DATE, '9999-12-31', TRUE, 2
);
```

**Type 3: Add New Column**
- Store limited history in additional columns
- Tracks one or two previous values
- Useful for specific business needs

```sql
CREATE TABLE dim_customer (
    customer_key INTEGER PRIMARY KEY,
    customer_id VARCHAR(50),
    customer_name VARCHAR(200),
    current_city VARCHAR(100),
    previous_city VARCHAR(100),
    current_effective_date DATE,
    previous_effective_date DATE
);
```

**Type 4: History Table**
- Current values in dimension table
- Historical values in separate history table
- Balances performance and history

```sql
-- Current dimension
CREATE TABLE dim_customer_current (
    customer_key INTEGER PRIMARY KEY,
    customer_id VARCHAR(50),
    customer_name VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(100)
);

-- History table
CREATE TABLE dim_customer_history (
    history_key INTEGER PRIMARY KEY,
    customer_key INTEGER,
    customer_id VARCHAR(50),
    city VARCHAR(100),
    state VARCHAR(100),
    effective_date DATE,
    expiration_date DATE
);
```

#### Fact Table Types

**Transaction Fact Tables:**
- One row per business event
- Most granular level
- Example: Individual sales transactions

**Periodic Snapshot Fact Tables:**
- One row per time period
- Regular intervals (daily, weekly, monthly)
- Example: Daily account balances

**Accumulating Snapshot Fact Tables:**
- One row per process instance
- Multiple date columns for milestones
- Row updated as process progresses
- Example: Order fulfillment pipeline

```sql
CREATE TABLE fact_order_pipeline (
    order_key INTEGER PRIMARY KEY,
    customer_key INTEGER,
    order_date DATE,
    payment_date DATE,
    shipment_date DATE,
    delivery_date DATE,
    days_to_payment INTEGER,
    days_to_shipment INTEGER,
    days_to_delivery INTEGER,
    order_amount DECIMAL(10,2),
    shipping_cost DECIMAL(10,2)
);
```

<!-- <div class="mb-1 flex justify-end">
  <a href="/courses/M3-COMPUTER-SCIENCE-FUND-DATA-ENGINEERING" class="text-base text-blue-700 font-medium hover:underline">
    Next: Data Storage Systems &rarr;
  </a>
</div> -->
