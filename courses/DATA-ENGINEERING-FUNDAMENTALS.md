# Data Engineering Fundamentals Course

<div style="background-color: #f0f8ff; padding: 20px; border-left: 5px solid #0066cc; margin: 20px 0;">
<h3>📚 Course Overview</h3>
<p><strong>Duration:</strong> 2 weeks (20 hours total)</p>
<p><strong>Format:</strong> 4 sessions per week, 2.5 hours each</p>
<p><strong>Prerequisites:</strong> Basic programming knowledge, familiarity with databases</p>
<p><strong>Learning Outcomes:</strong> Understand data engineering fundamentals, master essential tools, and build foundational skills</p>
</div>

---

# Introduction to Data Engineering

## What is Data Engineering?

<div style="background-color: #fffbf0; padding: 15px; border-radius: 8px; margin: 15px 0;">
<h3>🎯 Learning Objectives</h3>
<ul>
<li>Define data engineering and its core responsibilities</li>
<li>Distinguish between data engineering, data science, and analytics roles</li>
<li>Understand the data engineering lifecycle</li>
<li>Explore industry trends and career opportunities</li>
</ul>
</div>

### Role of Data Engineers in Modern Organizations

<div style="border: 2px solid #28a745; padding: 20px; border-radius: 10px; background-color: #f8fff9;">
<h4>💡 What is Data Engineering?</h4>
<p>Data engineering is the practice of designing, building, and maintaining the infrastructure and systems that enable data collection, storage, processing, and analysis at scale.</p>

<p><strong>Key Responsibilities:</strong></p>
<ul>
<li>Design and implement data pipelines</li>
<li>Ensure data quality and reliability</li>
<li>Optimize data storage and processing systems</li>
<li>Enable data accessibility for downstream users</li>
<li>Maintain data security and compliance</li>
</ul>
</div>

#### Core Functions of Data Engineers

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<thead style="background-color: #007bff; color: white;">
<tr>
<th style="padding: 12px; border: 1px solid #ddd;">Function</th>
<th style="padding: 12px; border: 1px solid #ddd;">Description</th>
<th style="padding: 12px; border: 1px solid #ddd;">Tools/Technologies</th>
</tr>
</thead>
<tbody>
<tr>
<td style="padding: 12px; border: 1px solid #ddd;">Data Ingestion</td>
<td style="padding: 12px; border: 1px solid #ddd;">Collecting data from various sources</td>
<td style="padding: 12px; border: 1px solid #ddd;">Apache Kafka, Kinesis, Airbyte</td>
</tr>
<tr style="background-color: #f8f9fa;">
<td style="padding: 12px; border: 1px solid #ddd;">Data Transformation</td>
<td style="padding: 12px; border: 1px solid #ddd;">Cleaning, processing, and enriching data</td>
<td style="padding: 12px; border: 1px solid #ddd;">Apache Spark, dbt, Airflow</td>
</tr>
<tr>
<td style="padding: 12px; border: 1px solid #ddd;">Data Storage</td>
<td style="padding: 12px; border: 1px solid #ddd;">Storing data efficiently and reliably</td>
<td style="padding: 12px; border: 1px solid #ddd;">S3, Snowflake, BigQuery</td>
</tr>
<tr style="background-color: #f8f9fa;">
<td style="padding: 12px; border: 1px solid #ddd;">Data Orchestration</td>
<td style="padding: 12px; border: 1px solid #ddd;">Managing workflow dependencies</td>
<td style="padding: 12px; border: 1px solid #ddd;">Airflow, Prefect, Dagster</td>
</tr>
</tbody>
</table>

### Data Engineering vs Data Science vs Data Analytics

<div style="display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap;">

<div style="flex: 1; min-width: 300px; background-color: #e3f2fd; padding: 20px; border-radius: 8px;">
<h4 style="color: #1976d2;">🔧 Data Engineering</h4>
<p><strong>Focus:</strong> Infrastructure & Pipelines</p>
<ul>
<li>Build and maintain data systems</li>
<li>Ensure data reliability and scalability</li>
<li>Optimize data processing workflows</li>
<li>Enable data accessibility</li>
</ul>
<p><strong>Skills:</strong> Programming, System Architecture, DevOps</p>
</div>

<div style="flex: 1; min-width: 300px; background-color: #f3e5f5; padding: 20px; border-radius: 8px;">
<h4 style="color: #7b1fa2;">📊 Data Science</h4>
<p><strong>Focus:</strong> Insights & Modeling</p>
<ul>
<li>Extract insights from data</li>
<li>Build predictive models</li>
<li>Conduct statistical analysis</li>
<li>Create machine learning solutions</li>
</ul>
<p><strong>Skills:</strong> Statistics, ML, Domain Expertise</p>
</div>

<div style="flex: 1; min-width: 300px; background-color: #e8f5e8; padding: 20px; border-radius: 8px;">
<h4 style="color: #388e3c;">📈 Data Analytics</h4>
<p><strong>Focus:</strong> Reporting & Business Intelligence</p>
<ul>
<li>Create reports and dashboards</li>
<li>Analyze business metrics</li>
<li>Support decision-making</li>
<li>Identify trends and patterns</li>
</ul>
<p><strong>Skills:</strong> SQL, BI Tools, Business Acumen</p>
</div>

</div>

### Data Engineering Lifecycle Overview

<div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
<h4>🔄 The Data Engineering Lifecycle</h4>
<p>The data engineering lifecycle consists of five core stages:</p>

<ol style="font-size: 16px; line-height: 1.6;">
<li><strong>Generation:</strong> Data is created by applications, IoT devices, users, etc.</li>
<li><strong>Ingestion:</strong> Data is collected from various sources</li>
<li><strong>Transformation:</strong> Raw data is cleaned, processed, and enriched</li>
<li><strong>Storage:</strong> Processed data is stored in appropriate systems</li>
<li><strong>Serving:</strong> Data is made available for analysis, ML, and applications</li>
</ol>
</div>

### Industry Trends and Career Paths

<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
<h4>🚀 Current Industry Trends</h4>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">

<div style="background-color: white; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545;">
<h5>Cloud-First Approach</h5>
<p>Organizations moving to cloud-native data architectures</p>
</div>

<div style="background-color: white; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
<h5>Real-Time Processing</h5>
<p>Increasing demand for streaming and real-time analytics</p>
</div>

<div style="background-color: white; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
<h5>Data Mesh</h5>
<p>Decentralized data architecture approach</p>
</div>

<div style="background-color: white; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
<h5>MLOps Integration</h5>
<p>Data engineering supporting ML lifecycle management</p>
</div>

</div>
</div>

<div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
<h4>💼 Career Progression Paths</h4>

<div style="margin-top: 15px;">
<h5>Junior Data Engineer → Senior Data Engineer → Lead Data Engineer</h5>
<h5>Staff Data Engineer → Principal Data Engineer → Data Engineering Manager</h5>
<h5>Solutions Architect → Technical Director → VP of Engineering</h5>
</div>

<p><strong>Salary Ranges (USD):</strong></p>
<ul>
<li>Junior Data Engineer: $70,000 - $95,000</li>
<li>Senior Data Engineer: $120,000 - $180,000</li>
<li>Staff Data Engineer: $180,000 - $250,000</li>
<li>Principal Data Engineer: $220,000 - $350,000</li>
</ul>
</div>

---

## Data Types and Formats

### Structured, Semi-Structured, and Unstructured Data

<div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">

<div style="display: flex; gap: 20px; flex-wrap: wrap;">

<div style="flex: 1; min-width: 280px; background-color: white; padding: 15px; border-radius: 5px; border: 2px solid #007bff;">
<h4 style="color: #007bff;">📋 Structured Data</h4>
<p><strong>Characteristics:</strong></p>
<ul>
<li>Fixed schema</li>
<li>Organized in rows and columns</li>
<li>Easily searchable</li>
<li>High data quality</li>
</ul>
<p><strong>Examples:</strong> SQL databases, CSV files, Excel spreadsheets</p>
</div>

<div style="flex: 1; min-width: 280px; background-color: white; padding: 15px; border-radius: 5px; border: 2px solid #28a745;">
<h4 style="color: #28a745;">📦 Semi-Structured Data</h4>
<p><strong>Characteristics:</strong></p>
<ul>
<li>Flexible schema</li>
<li>Self-describing structure</li>
<li>Tags or markers</li>
<li>Moderate complexity</li>
</ul>
<p><strong>Examples:</strong> JSON, XML, YAML, NoSQL documents</p>
</div>

<div style="flex: 1; min-width: 280px; background-color: white; padding: 15px; border-radius: 5px; border: 2px solid #dc3545;">
<h4 style="color: #dc3545;">🌐 Unstructured Data</h4>
<p><strong>Characteristics:</strong></p>
<ul>
<li>No predefined structure</li>
<li>Complex to process</li>
<li>Rich content</li>
<li>Requires special tools</li>
</ul>
<p><strong>Examples:</strong> Text files, images, videos, audio, PDFs</p>
</div>

</div>
</div>

### Common Data Formats

<div style="overflow-x: auto; margin: 20px 0;">
<table style="width: 100%; border-collapse: collapse; min-width: 800px;">
<thead style="background-color: #343a40; color: white;">
<tr>
<th style="padding: 15px; border: 1px solid #ddd;">Format</th>
<th style="padding: 15px; border: 1px solid #ddd;">Type</th>
<th style="padding: 15px; border: 1px solid #ddd;">Use Case</th>
<th style="padding: 15px; border: 1px solid #ddd;">Pros</th>
<th style="padding: 15px; border: 1px solid #ddd;">Cons</th>
</tr>
</thead>
<tbody>
<tr>
<td style="padding: 12px; border: 1px solid #ddd;"><strong>CSV</strong></td>
<td style="padding: 12px; border: 1px solid #ddd;">Structured</td>
<td style="padding: 12px; border: 1px solid #ddd;">Simple tabular data</td>
<td style="padding: 12px; border: 1px solid #ddd;">Universal, lightweight</td>
<td style="padding: 12px; border: 1px solid #ddd;">No schema, limited data types</td>
</tr>
<tr style="background-color: #f8f9fa;">
<td style="padding: 12px; border: 1px solid #ddd;"><strong>JSON</strong></td>
<td style="padding: 12px; border: 1px solid #ddd;">Semi-structured</td>
<td style="padding: 12px; border: 1px solid #ddd;">APIs, web applications</td>
<td style="padding: 12px; border: 1px solid #ddd;">Human-readable, flexible</td>
<td style="padding: 12px; border: 1px solid #ddd;">Verbose, no compression</td>
</tr>
<tr>
<td style="padding: 12px; border: 1px solid #ddd;"><strong>Parquet</strong></td>
<td style="padding: 12px; border: 1px solid #ddd;">Structured</td>
<td style="padding: 12px; border: 1px solid #ddd;">Analytics, big data</td>
<td style="padding: 12px; border: 1px solid #ddd;">Columnar, compressed</td>
<td style="padding: 12px; border: 1px solid #ddd;">Not human-readable</td>
</tr>
<tr style="background-color: #f8f9fa;">
<td style="padding: 12px; border: 1px solid #ddd;"><strong>Avro</strong></td>
<td style="padding: 12px; border: 1px solid #ddd;">Structured</td>
<td style="padding: 12px; border: 1px solid #ddd;">Streaming, schema evolution</td>
<td style="padding: 12px; border: 1px solid #ddd;">Schema evolution, compact</td>
<td style="padding: 12px; border: 1px solid #ddd;">Complex setup</td>
</tr>
<tr>
<td style="padding: 12px; border: 1px solid #ddd;"><strong>ORC</strong></td>
<td style="padding: 12px; border: 1px solid #ddd;">Structured</td>
<td style="padding: 12px; border: 1px solid #ddd;">Hive, Spark analytics</td>
<td style="padding: 12px; border: 1px solid #ddd;">Optimized for Hive</td>
<td style="padding: 12px; border: 1px solid #ddd;">Hadoop ecosystem specific</td>
</tr>
</tbody>
</table>
</div>

### Data Serialization and Compression Techniques

<div style="background-color: #fff9e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
<h4>⚡ Serialization Formats</h4>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 15px;">

<div style="background-color: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">
<h5>Protocol Buffers (Protobuf)</h5>
<p><strong>Use Case:</strong> High-performance APIs</p>
<p><strong>Benefits:</strong> Fast, compact, language-agnostic</p>
<p><strong>Example:</strong> Google services, gRPC</p>
</div>

<div style="background-color: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">
<h5>Apache Thrift</h5>
<p><strong>Use Case:</strong> Cross-language services</p>
<p><strong>Benefits:</strong> Multiple protocols, code generation</p>
<p><strong>Example:</strong> Facebook, Cassandra</p>
</div>

<div style="background-color: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">
<h5>MessagePack</h5>
<p><strong>Use Case:</strong> JSON alternative</p>
<p><strong>Benefits:</strong> Binary JSON, smaller size</p>
<p><strong>Example:</strong> Real-time applications</p>
</div>

</div>
</div>

<div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
<h4>🗜️ Compression Algorithms</h4>

<table style="width: 100%; border-collapse: collapse;">
<thead style="background-color: #6c757d; color: white;">
<tr>
<th style="padding: 12px; border: 1px solid #ddd;">Algorithm</th>
<th style="padding: 12px; border: 1px solid #ddd;">Compression Ratio</th>
<th style="padding: 12px; border: 1px solid #ddd;">Speed</th>
<th style="padding: 12px; border: 1px solid #ddd;">Best For</th>
</tr>
</thead>
<tbody>
<tr>
<td style="padding: 12px; border: 1px solid #ddd;"><strong>gzip</strong></td>
<td style="padding: 12px; border: 1px solid #ddd;">Good</td>
<td style="padding: 12px; border: 1px solid #ddd;">Medium</td>
<td style="padding: 12px; border: 1px solid #ddd;">General purpose, text files</td>
</tr>
<tr style="background-color: #f8f9fa;">
<td style="padding: 12px; border: 1px solid #ddd;"><strong>LZ4</strong></td>
<td style="padding: 12px; border: 1px solid #ddd;">Fair</td>
<td style="padding: 12px; border: 1px solid #ddd;">Very Fast</td>
<td style="padding: 12px; border: 1px solid #ddd;">Real-time applications</td>
</tr>
<tr>
<td style="padding: 12px; border: 1px solid #ddd;"><strong>Snappy</strong></td>
<td style="padding: 12px; border: 1px solid #ddd;">Fair</td>
<td style="padding: 12px; border: 1px solid #ddd;">Fast</td>
<td style="padding: 12px; border: 1px solid #ddd;">Big data processing</td>
</tr>
<tr style="background-color: #f8f9fa;">
<td style="padding: 12px; border: 1px solid #ddd;"><strong>Brotli</strong></td>
<td style="padding: 12px; border: 1px solid #ddd;">Excellent</td>
<td style="padding: 12px; border: 1px solid #ddd;">Slow</td>
<td style="padding: 12px; border: 1px solid #ddd;">Web content, archival</td>
</tr>
</tbody>
</table>
</div>

### Schema Design Principles

<div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
<h4>🏗️ Schema Design Best Practices</h4>

<div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 15px;">

<div style="flex: 1; min-width: 300px;">
<h5>1. Consistency</h5>
<ul>
<li>Use consistent naming conventions</li>
<li>Standardize data types</li>
<li>Apply uniform formatting</li>
</ul>

<h5>2. Scalability</h5>
<ul>
<li>Design for growth</li>
<li>Consider partitioning strategies</li>
<li>Plan for schema evolution</li>
</ul>
</div>

<div style="flex: 1; min-width: 300px;">
<h5>3. Performance</h5>
<ul>
<li>Optimize for query patterns</li>
<li>Choose appropriate data types</li>
<li>Consider indexing strategies</li>
</ul>

<h5>4. Maintainability</h5>
<ul>
<li>Document schema decisions</li>
<li>Version schema changes</li>
<li>Plan migration strategies</li>
</ul>
</div>

</div>
</div>

---

## Data Storage Fundamentals

### File Systems vs Databases

<div style="background-color: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
<h4>💾 Storage System Comparison</h4>

<div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 15px;">

<div style="flex: 1; min-width: 350px; background-color: white; padding: 20px; border-radius: 8px; border: 2px solid #007bff;">
<h5 style="color: #007bff;">📁 File Systems</h5>
<p><strong>Advantages:</strong></p>
<ul>
<li>Simple and fast for large files</li>
<li>Direct access to data</li>
<li>Cost-effective storage</li>
<li>Good for unstructured data</li>
</ul>
<p><strong>Disadvantages:</strong></p>
<ul>
<li>Limited query capabilities</li>
<li>No ACID properties</li>
<li>Manual data management</li>
</ul>
</div>

<div style="flex: 1; min-width: 350px; background-color: white; padding: 20px; border-radius: 8px; border: 2px solid #28a745;">
<h5 style="color: #28a745;">🗄️ Databases</h5>
<p><strong>Advantages:</strong></p>
<ul>
<li>Rich query capabilities</li>
<li>ACID compliance</li>
<li>Concurrent access control</li>
<li>Built-in optimization</li>
</ul>
<p><strong>Disadvantages:</strong></p>
<ul>
<li>Higher complexity and cost</li>
<li>Performance overhead</li>
<li>Scaling challenges</li>
</ul>
</div>

</div>
</div>

### OLTP vs OLAP Systems

<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">

<table style="width: 100%; border-collapse: collapse;">
<thead style="background-color: #495057; color: white;">
<tr>
<th style="padding: 15px; border: 1px solid #ddd;">Aspect</th>
<th style="padding: 15px; border: 1px solid #ddd;">OLTP (Online Transaction Processing)</th>
<th style="padding: 15px; border: 1px solid #ddd;">OLAP (Online Analytical Processing)</th>
</tr>
</thead>
<tbody>
<tr>
<td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Purpose</td>
<td style="padding: 12px; border: 1px solid #ddd;">Day-to-day operations</td>
<td style="padding: 12px; border: 1px solid #ddd;">Data analysis and reporting</td>
</tr>
<tr style="background-color: #f8f9fa;">
<td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Data Model</td>
<td style="padding: 12px; border: 1px solid #ddd;">Normalized (3NF)</td>
<td style="padding: 12px; border: 1px solid #ddd;">Denormalized (Star/Snowflake)</td>
</tr>
<tr>
<td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Query Pattern</td>
<td style="padding: 12px; border: 1px solid #ddd;">Simple, frequent, short</td>
<td style="padding: 12px; border: 1px solid #ddd;">Complex, ad-hoc, long-running</td>
</tr>
<tr style="background-color: #f8f9fa;">
<td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Data Volume</td>
<td style="padding: 12px; border: 1px solid #ddd;">Current, detailed data</td>
<td style="padding: 12px; border: 1px solid #ddd;">Historical, aggregated data</td>
</tr>
<tr>
<td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Users</td>
<td style="padding: 12px; border: 1px solid #ddd;">Operational staff</td>
<td style="padding: 12px; border: 1px solid #ddd;">Analysts, executives</td>
</tr>
<tr style="background-color: #f8f9fa;">
<td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Examples</td>
<td style="padding: 12px; border: 1px solid #ddd;">PostgreSQL, MySQL</td>
<td style="padding: 12px; border: 1px solid #ddd;">Snowflake, BigQuery</td>
</tr>
</tbody>
</table>

</div>

### Data Lakes vs Data Warehouses vs Data Lakehouses

<div style="background-color: #e6f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
<h4>🏗️ Modern Data Architecture Options</h4>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">

<div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 5px solid #007bff;">
<h5 style="color: #007bff;">🌊 Data Lake</h5>
<p><strong>Characteristics:</strong></p>
<ul>
<li>Store raw data in native format</li>
<li>Schema-on-read approach</li>
<li>Cost-effective storage</li>
<li>Supports all data types</li>
</ul>
<p><strong>Best For:</strong> Exploration, ML, unstructured data</p>
<p><strong>Examples:</strong> Amazon S3, Azure Data Lake</p>
</div>

<div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 5px solid #28a745;">
<h5 style="color: #28a745;">🏢 Data Warehouse</h5>
<p><strong>Characteristics:</strong></p>
<ul>
<li>Structured, processed data</li>
<li>Schema-on-write approach</li>
<li>Optimized for queries</li>
<li>High data quality</li>
</ul>
<p><strong>Best For:</strong> BI, reporting, structured analytics</p>
<p><strong>Examples:</strong> Snowflake, BigQuery, Redshift</p>
</div>

<div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 5px solid #dc3545;">
<h5 style="color: #dc3545;">🏠 Data Lakehouse</h5>
<p><strong>Characteristics:</strong></p>
<ul>
<li>Combines lake and warehouse benefits</li>
<li>ACID transactions on data lakes</li>
<li>Flexible schema management</li>
<li>Single platform approach</li>
</ul>
<p><strong>Best For:</strong> Unified analytics platform</p>
<p><strong>Examples:</strong> Delta Lake, Apache Iceberg</p>
</div>

</div>
</div>

### Cloud Storage Solutions

<div style="background-color: #fff9e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
<h4>☁️ Major Cloud Storage Platforms</h4>

<div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 20px;">

<div style="flex: 1; min-width: 280px; background-color: white; padding: 15px; border-radius: 8px; border: 2px solid #ff9900;">
<h5 style="color: #ff9900;">AWS S3</h5>
<p><strong>Features:</strong></p>
<ul>
<li>Multiple storage classes</li>
<li>Lifecycle management</li>
<li>Strong consistency</li>
<li>Event notifications</li>
</ul>
<p><strong>Use Cases:</strong> Data lakes, backup, static websites</p>
</div>

<div style="flex: 1; min-width: 280px; background-color: white; padding: 15px; border-radius: 8px; border: 2px solid #0078d4;">
<h5 style="color: #0078d4;">Azure Blob Storage</h5>
<p><strong>Features:</strong></p>
<ul>
<li>Hot, cool, archive tiers</li>
<li>Integration with Azure services</li>
<li>Data Lake Gen2 capabilities</li>
<li>Hierarchical namespace</li>
</ul>
<p><strong>Use Cases:</strong> Analytics, backup, content distribution</p>
</div>

<div style="flex: 1; min-width: 280px; background-color: white; padding: 15px; border-radius: 8px; border: 2px solid #4285f4;">
<h5 style="color: #4285f4;">Google Cloud Storage</h5>
<p><strong>Features:</strong></p>
<ul>
<li>Global edge caching</li>
<li>Automatic encryption</li>
<li>BigQuery integration</li>
<li>Multi-regional storage</li>
</ul>
<p><strong>Use Cases:</strong> Analytics, ML, content delivery</p>
</div>

</div>
</div>

<div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
<h4>💡 Hands-On Exercise 1.1</h4>
<p><strong>Task:</strong> Compare different data formats for a sample dataset</p>
<ol>
<li>Download a sample CSV dataset (e.g., from Kaggle)</li>
<li>Convert it to JSON, Parquet, and Avro formats</li>
<li>Compare file sizes and loading times</li>
<li>Document your findings</li>
</ol>
<p><strong>Tools needed:</strong> Python, pandas, pyarrow, fastavro</p>
</div>

---

# Programming for Data Engineering

## Python for Data Engineering

<div style="background-color: #fffbf0; padding: 15px; border-radius: 8px; margin: 15px 0;">
<h3>🎯 Learning Objectives</h3>
<ul>
<li>Master advanced Python concepts for data processing</li>
<li>Work efficiently with pandas, numpy, and requests libraries</li>
<li>Implement proper error handling and logging</li>
<li>Manage dependencies and virtual environments</li>
</ul>
</div>

### Advanced Python Concepts for Data Processing

<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
<h4>🐍 Essential Python Patterns for Data Engineering</h4>

<div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #28a745;">
<h5>1. List Comprehensions and Generator Expressions</h5>
<pre style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto;"><code># List comprehension for data transformation
processed_data = [transform_record(record) for record in raw_data if is_valid(record)]

# Generator expression for memory efficiency
data_stream = (process_line(line) for line in open('large_file.txt'))

# Dictionary comprehension for mapping
column_mapping = {old_name: new_name for old_name, new_name in mapping_rules}
</code></pre>
</div>

<div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #007bff;">
<h5>2. Context Managers and Resource Management</h5>
<pre style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto;"><code>from contextlib import contextmanager
import sqlite3

@contextmanager
def database_connection(db_path):
    conn = sqlite3.connect(db_path)
    try:
        yield conn
    finally:
        conn.close()

# Usage
with database_connection('data.db') as conn:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    results = cursor.fetchall()
</code></pre>
</div>

<div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc3545;">
<h5>3. Decorators for Data Pipeline Functions</h5>
<pre style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto;"><code>import time
from functools import wraps

def timing_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        print(f"{func.__name__} took {end_time - start_time:.2f} seconds")
        return result
    return wrapper

@timing_decorator
def process_large_dataset(data):
    # Data processing logic here
    return processed_data
</code></pre>
</div>

<div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107;">
<h5>4. Asyncio for Concurrent Data Operations</h5>
<pre style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto;"><code>import asyncio
import aiohttp

async def fetch_data(session, url):
    async with session.get(url) as response:
        return await response.json()

async def process_multiple_apis(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_data(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
    return results

# Usage
urls = ['http://api1.com/data', 'http://api2.com/data']
results = asyncio.run(process_multiple_apis(urls))
</code></pre>
</div>

</div>

### Working with Libraries: pandas, numpy, requests

<div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
<h4>📊 Essential Data Engineering Libraries</h4>

<div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
<h5>🐼 Advanced Pandas Techniques</h5>
<pre style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto;"><code>import pandas as pd
import numpy as np

# Efficient data loading with chunking
def process_large_csv(file_path, chunk_size=10000):
    results = []
    for chunk in pd.read_csv(file_path, chunksize=chunk_size):
        # Process each chunk
        processed_chunk = transform_data(chunk)
        results.append(processed_chunk)
    return pd.concat(results, ignore_index=True)

# Optimized data types for memory efficiency
def optimize_datatypes(df):
    # Optimize integer columns
    int_cols = df.select_dtypes(include=['int']).columns
    df[int_cols] = df[int_cols].apply(pd.to_numeric, downcast='integer')
    
    # Optimize float columns
    float_cols = df.select_dtypes(include=['float']).columns
    df[float_cols] = df[float_cols].apply(pd.to_numeric, downcast='float')
    
    # Convert to categorical for string columns with low cardinality
    obj_cols = df.select_dtypes(include=['object']).columns
    for col in obj_cols:
        if df[col].nunique() / len(df) < 0.5:  # Less than 50% unique values
            df[col] = df[col].astype('category')
    
    return df

# Advanced groupby operations
def advanced_aggregations(df):
    return df.groupby('category').agg({
        'sales': ['sum', 'mean', 'std'],
        'quantity': ['sum', 'count'],
        'date': ['min', 'max']
    }).round(2)
</code></pre>
</div>

<div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
<h5>🔢 NumPy for High-Performance Computing</h5>
<pre style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto;"><code>import numpy as np

# Vectorized operations for data transformation
def normalize_data(data):
    """Normalize data using vectorized operations"""
    mean = np.mean(data, axis=0)
    std = np.std(data, axis=0)
    return (data - mean) / std

# Memory-mapped files for large datasets
def process_large_array(file_path):
    # Load data without loading into memory
    data = np.memmap(file_path, dtype='float32', mode='r')
    
    # Process in chunks
    chunk_size = 1000000
    results = []
    for i in range(0, len(data), chunk_size):
        chunk = data[i:i+chunk_size]
        processed = np.sqrt(chunk ** 2 + 1)  # Example processing
        results.append(np.mean(processed))
    
    return np.array(results)

# Advanced indexing and filtering
def filter_multidimensional_data(data, conditions):
    """Apply multiple conditions efficiently"""
    mask = np.ones(data.shape[0], dtype=bool)
    for condition in conditions:
        mask &= condition(data)
    return data[mask]
</code></pre>
</div>

<div