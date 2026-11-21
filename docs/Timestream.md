# Amazon Timestream

Amazon Timestream is a fast, scalable, and serverless time series database service designed for high-throughput IoT, DevOps, and operational telemetry applications. It automatically scales to ingest trillions of time-stamped events daily without requiring database servers to be provisioned, configured, or managed. Timestream organizes data into dual storage tiers: an ultra-fast in-memory store for low-latency queries and a cost-optimized magnetic store for long-term historical analysis. You should use Amazon Timestream when capturing time-stamped telemetry data from IoT sensors, application metrics, server fleet health logs, and industrial equipment monitors.

---

## 1. Key Concepts

### Databases
A database is the top-level container in Amazon Timestream that groups related tables together. It defines the default AWS Key Management Service (KMS) encryption key used to encrypt all tables and data points stored within it.
*Example*: A database named `fleet_telemetry` hosting tables for trucks, delivery vans, and drone logistics.

### Tables
A table is a container for a set of time series data points. Unlike traditional relational database tables, Amazon Timestream tables have an adaptive schema that automatically infers new dimensions and measures as records are ingested without manual DDL migrations.
*Example*: A table named `vehicle_sensors` recording speed, oil temperature, and GPS coordinates.

### Storage Tiers: Memory Store vs. Magnetic Store
Timestream utilizes an automated two-tier storage architecture:
- **Memory Store**: High-throughput in-memory storage optimized for rapid writes and low-latency point-in-time dashboard queries.
- **Magnetic Store**: Highly durable, cost-optimized disk storage designed for analytical queries across long historical time horizons.
*Example*: Data remains in the memory store for 24 hours for live monitoring, then moves automatically to the magnetic store for 365 days of trend analysis.

### Measures and Dimensions
Time series data points in Timestream comprise:
- **Time**: The timestamp when the event occurred (in seconds, milliseconds, microseconds, or nanoseconds).
- **Dimensions**: Metadata attributes that identify the source of the metric (e.g., `host`, `datacenter`, `device_id`). Stored as string varchar values.
- **Measure Name & Value**: The actual metric recorded (e.g., `cpu_utilization` = `78.5`). Supported measure value types include `DOUBLE`, `BIGINT`, `VARCHAR`, and `BOOLEAN`.
*Example*: Time `1700000000000`, Dimensions `host=web-01, region=us-east-1`, MeasureName `cpu_usage`, MeasureValue `64.2` (`DOUBLE`).

### Data Retention Policies
Each table defines explicit retention rules for both tiers:
- **Memory store retention period**: Between 1 hour and 8,760 hours (1 year).
- **Magnetic store retention period**: Between 1 day and 73,000 days (200 years).
*Example*: A table configured with 48 hours of memory store retention and 730 days (2 years) of magnetic store retention.

### Encryption at Rest with KMS
All data stored in Amazon Timestream is encrypted at rest:
- **AWS owned key**: `(default) aws/timestream` is managed automatically by AWS at no additional fee.
- **Customer managed KMS key**: You can choose a customer managed key from [AWS KMS](KMS.md) for custom key rotation policies and IAM separation of duties.
*Example*: An enterprise database encrypted with customer managed key `arn:aws:kms:us-east-1:000000000000:key/b1e60d0e-cb76-4bb2-9123-42a0119710ad`.

### Amazon Timestream for InfluxDB
A managed service option that lets you deploy open-source InfluxDB v2 instances with automated backups and multi-AZ failover for applications utilizing the Flux query language or InfluxQL.

---

## 2. Dependencies

| Dependency | Required / Optional | Where Used in Console | Documentation Link |
| :--- | :--- | :--- | :--- |
| **AWS KMS** | Optional | Database creation & configuration: Customer managed KMS key dropdown | [AWS KMS Guide](KMS.md) |
| **Amazon S3** | Optional | Unloaded query results destination and rejected magnetic store data location | [Amazon S3 Guide](S3.md) |
| **Amazon SNS** | Optional | Scheduled query execution notifications and failure alerts | [Amazon SNS Guide](SNS.md) |
| **AWS IAM** | Optional | Resource-based policies & scheduled query execution roles | [Console Overview](README.md) |
| **Amazon CloudWatch** | Optional | Operational metrics and alarms for ingested bytes and query latency | [Console Overview](README.md) |

---

## 3. Console Walkthrough and Tested AWS CLI Commands

All commands below are tested and verified against the local AWS Emulator endpoint (`https://127.0.0.1:9297`).

### 1. Databases Inventory (`/timestream` & `/timestream/databases`)
- Summary metric cards: Total Databases, Total Tables, Default KMS Keys, and Customer KMS Keys.
- Filter inventory by database name.
- View details, Edit (with emulator notice), and Delete database.

**Matching CLI Command (List Databases)**:
```bash
aws timestream-write list-databases \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

### 2. Create Database Wizard (`/timestream/databases/create`)
- **Configuration**:
  - `Standard database`: Create an empty database.
  - `Sample database`: Pre-populate with IoT or DevOps sample templates.
- **Database name**: Enter unique identifier (1-64 characters).
- **KMS key**:
  - `(default) aws/timestream`: AWS managed master key.
  - `Customer managed key (KMS)`: Live dropdown of symmetric keys from [AWS KMS](KMS.md).
- **Tags**: Key-value metadata tags.

**Matching CLI Command (Create Database)**:
```bash
aws timestream-write create-database \
  --database-name telemetry_db \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

### 3. Database Details (`/timestream/databases/[databaseName]`)
- Overview cards: Tables count, KMS key ARN, Creation time, Last updated.
- **Tables tab**: Searchable list of tables in this database with retention periods and delete actions.
- **Configuration tab**: KMS encryption details, key ARN, and database ARN.
- **Tags tab**: Resource tags.
- **Delete database**: Confirmation modal with required name verification.

**Matching CLI Command (Describe Database)**:
```bash
aws timestream-write describe-database \
  --database-name telemetry_db \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

### 4. Create Table Wizard (`/timestream/databases/[databaseName]/create-table`)
- **Table details**: Target database name and new table name.
- **Data retention**:
  - `Memory store retention`: Number input and unit dropdown (`Hours`, `Days`). Default 24 hours.
  - `Magnetic store retention`: Number input and unit dropdown (`Days`, `Months`, `Years`). Default 365 days.
- **Magnetic store writes**: Checkbox to accept late-arriving records directly into magnetic store.
- **Tags**: Resource tags.

**Matching CLI Command (Create Table)**:
```bash
aws timestream-write create-table \
  --database-name telemetry_db \
  --table-name host_metrics \
  --retention-properties MemoryStoreRetentionPeriodInHours=24,MagneticStoreRetentionPeriodInDays=365 \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

### 5. Table Details (`/timestream/databases/[databaseName]/tables/[tableName]`)
- Overview cards: Status (`ACTIVE`), Memory retention, Magnetic retention, Created date.
- **Overview tab**: Full retention properties breakdown and storage tiering summary.
- **Write records tab**: Interactive live data ingestion utility:
  - Enter Measure Name (e.g., `cpu_utilization`).
  - Enter Measure Value (e.g., `78.5`) and Type (`DOUBLE`, `BIGINT`, `VARCHAR`, `BOOLEAN`).
  - Add dynamic dimensions (e.g., `host=server-01`, `region=us-east-1`).
  - Click **Ingest record** to send live records to the table.
- **Monitoring tab**: CloudWatch operational metric indicators.
- **Tags tab**: Resource tags.
- **Delete table**: Modal requiring table name confirmation.

**Matching CLI Command (Describe Table)**:
```bash
aws timestream-write describe-table \
  --database-name telemetry_db \
  --table-name host_metrics \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

**Matching CLI Command (Write Records)**:
```bash
aws timestream-write write-records \
  --database-name telemetry_db \
  --table-name host_metrics \
  --records '[{
    "MeasureName": "cpu_utilization",
    "MeasureValue": "78.5",
    "MeasureValueType": "DOUBLE",
    "Time": "1700000000000",
    "TimeUnit": "MILLISECONDS",
    "Dimensions": [{"Name": "host", "Value": "server-01"}]
  }]' \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

**Matching CLI Command (Delete Table)**:
```bash
aws timestream-write delete-table \
  --database-name telemetry_db \
  --table-name host_metrics \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

**Matching CLI Command (Delete Database)**:
```bash
aws timestream-write delete-database \
  --database-name telemetry_db \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

### 6. Query Editor (`/timestream/query`)
- Left sidebar: Database and table schema selector with quick sample query buttons.
- SQL editor textarea with SQL:2003 syntax support.
- Execution results panel displaying query output schema.

### 7. InfluxDB Instances (`/timestream/influxdb`)
- Overview of managed open-source InfluxDB v2 instances with emulator architectural notes.

---

## 4. Hands-on Beginner Exercises

### Exercise 1: Create a Timestream Database with Custom KMS Encryption
1. Navigate to `/timestream/databases` in the console.
2. Click **Create database**.
3. Select **Standard database**.
4. Enter Database name `iot_production`.
5. Under Encryption, select **Customer managed key (KMS)** and choose an active KMS key from the dropdown.
6. Click **Create database**.
7. Verify `iot_production` appears in the inventory with Customer KMS status.

### Exercise 2: Create a Telemetry Table with Dual Retention Policies
1. Click on `iot_production` to open its detail page.
2. Click **Create table**.
3. Enter Table name `factory_temperatures`.
4. Set Memory store retention to `48` Hours.
5. Set Magnetic store retention to `730` Days (2 years).
6. Check **Enable magnetic store writes**.
7. Click **Create table**.
8. Verify the table status is `ACTIVE` with both retention periods displayed.

### Exercise 3: Ingest Real Time-Series Records via the Console Utility
1. In the `factory_temperatures` table view, click the **Write records** tab (or **Write sample records** button).
2. Set Measure Name to `temperature_celsius`.
3. Set Measure Value to `23.8` with Type `DOUBLE`.
4. Under Dimensions, set:
   - Row 1: Name `sensor_id`, Value `sensor-north-04`.
   - Row 2: Name `floor`, Value `manufacturing-line-2`.
5. Click **Ingest record**.
6. Verify the confirmation message: *"Successfully ingested record into factory_temperatures (Total: 1, MemoryStore: 1, MagneticStore: 0)"*.

### Exercise 4: Clean Up Resources
1. In the `factory_temperatures` table view, click the **Delete table** button.
2. Type `factory_temperatures` into the confirmation dialog and click **Delete**.
3. Return to the `iot_production` database view and click **Delete database**.
4. Type `iot_production` into the prompt and click **Delete**.
5. Verify `/timestream/databases` is empty.

---

## 5. Limitations & Emulator Differences

- **Query Execution Engine**: The `timestream-query query` operation is scaffolded in the local AWS Emulator, but not implemented for SQL parsing. The console query editor displays the interactive editor and expected result schemas.
- **Update Database & Update Table**: Modifying retention properties or KMS keys on existing databases and tables returns `NotImplemented` in the local emulator. The console displays a clear explanatory modal when clicked.
- **Timestream for InfluxDB**: Managed InfluxDB hardware instances require cloud VM provisioning and are simulated via an overview page with architecture documentation.

---

## 6. Common Errors & Troubleshooting

### 1. `ValidationException: Database name can only contain alphanumeric characters`
- **Cause**: Attempting to create a database name containing spaces or disallowed symbols.
- **Fix**: Use only letters, numbers, underscores (`_`), hyphens (`-`), and periods (`.`).

### 2. `ValidationException: Memory store retention must be less than magnetic store retention`
- **Cause**: Configuring a table whose memory store retention period exceeds the magnetic store retention period.
- **Fix**: Ensure memory store retention (e.g. 24 hours) is less than magnetic store retention (e.g. 365 days).

### 3. `ResourceNotFoundException: The database does not exist`
- **Cause**: Attempting to create or describe a table in a database that was deleted or not yet created.
- **Fix**: Create the database first at `/timestream/databases/create`, verify it shows `ACTIVE`, then create your table.
