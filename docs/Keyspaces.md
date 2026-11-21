# Amazon Keyspaces (for Apache Cassandra)

Amazon Keyspaces (for Apache Cassandra) is a scalable, highly available, and managed Apache Cassandra-compatible database service. It enables developers to run Cassandra workloads in the cloud using the same Cassandra Query Language (CQL) code, Apache 2.0-licensed drivers, and developer tools that they already use. With Amazon Keyspaces, you do not have to provision, patch, or manage servers, nor do you need to install, maintain, or operate Cassandra software. You should use Amazon Keyspaces when building high-throughput, low-latency applications requiring wide-column storage, time-series telemetry, user activity feeds, or eCommerce catalog indexing.

---

## 1. Key Concepts

### Keyspaces
A keyspace is the top-level container in Cassandra that groups related tables together, analogous to a database schema or catalog in a relational database management system (RDBMS). It defines the replication strategy (Single-Region or Multi-Region replication across AWS Regions) for all tables created inside it.
*Example*: A keyspace named `ecommerce` hosts the `users`, `products`, `orders`, and `inventory` tables.

### Tables & CQL Data Types
A table contains rows and columns of structured data conforming to Cassandra Query Language (CQL) specifications. Amazon Keyspaces supports standard CQL scalar, collection, and frozen data types, including:
- Scalars: `ascii`, `bigint`, `blob`, `boolean`, `counter`, `date`, `decimal`, `double`, `float`, `inet`, `int`, `smallint`, `text`, `time`, `timestamp`, `timeuuid`, `tinyint`, `uuid`, `varchar`, `varint`.
- Collections: `list<type>`, `map<key, value>`, `set<type>`.
*Example*: A `sensor_readings` table storing `device_id` (uuid), `recorded_at` (timestamp), `temperature` (double), and `error_codes` (set<int>).

### Primary Keys: Partition Keys and Clustering Columns
In Cassandra, the primary key dictates data distribution and on-disk sorting:
- **Partition Key (HASH)**: One or more columns that determine which physical storage partition holds the row. A table must have at least one partition key column. Multiple partition columns form a composite partition key.
- **Clustering Column (ASC / DESC)**: Optional columns that determine the physical sort order of rows within a single partition.
*Example*: In a `user_activity` table, `user_id` is the partition key (grouping all actions for a user), and `activity_time` is a clustering column sorted descending (`DESC`), ensuring the user's newest actions are read first.

### Capacity Modes: On-demand vs. Provisioned
- **On-demand (PAY_PER_REQUEST)**: Automatically scales read and write capacity up or down according to incoming application traffic. Recommended for unpredictable traffic spikes or new applications.
- **Provisioned**: You define explicit read capacity units (RCU) and write capacity units (WCU) to guarantee provisioned throughput and maintain fixed, predictable costs.
*Example*: An analytics aggregation job uses provisioned capacity with 200 RCU / 50 WCU, while a webhook receiver operates in on-demand mode.

### Encryption at Rest
All user data stored in Amazon Keyspaces is encrypted at rest by default:
- **AWS owned key**: Amazon Keyspaces manages the cryptographic key automatically at no extra cost.
- **Customer managed KMS key**: Use your own symmetric AWS KMS key from [AWS KMS](KMS.md) to maintain independent key rotation, access policies, and audit logging.
*Example*: A healthcare records keyspace encrypted with customer managed KMS key `arn:aws:kms:us-east-1:000000000000:key/b1e60d0e-cb76-4bb2-9123-42a0119710ad`.

### Point-in-Time Recovery (PITR) & Default Time to Live (TTL)
- **Point-in-Time Recovery (PITR)**: Continuous automated backups that let you restore table data to any single second within the retention window.
- **Default TTL**: Automatically expires and removes table rows after a specified duration (in seconds) without burning write capacity.
*Example*: A cache table configured with a default TTL of 86400 seconds (24 hours) to purge ephemeral user sessions automatically.

### Client Connection & TLS Endpoints
Clients connect to Amazon Keyspaces using standard CQL drivers (DataStax Java, Python, C#, Node.js) over port 9142 with mandatory TLS 1.2+ encryption.
*Default Endpoint*: `cassandra.us-east-1.amazonaws.com:9142`.

---

## 2. Dependencies

| Dependency | Required / Optional | Where Used in Console | Documentation Link |
| :--- | :--- | :--- | :--- |
| **AWS KMS** | Optional | Table creation & settings: Customer managed encryption at rest dropdown | [AWS KMS Guide](KMS.md) |
| **AWS IAM** | Optional | Fine-grained CQL operation permissions and user service credentials | [Console Overview](README.md) |
| **Amazon CloudWatch** | Optional | Operational metrics and alarms for read/write throughput and latency | [Console Overview](README.md) |
| **AWS Backup** | Optional | Enterprise-wide backup retention and compliance policies | [Console Overview](README.md) |

---

## 3. Console Walkthrough and Tested AWS CLI Commands

All commands below are tested and verified against the local AWS Emulator endpoint (`https://127.0.0.1:9297`).

### 1. Keyspaces Inventory (`/keyspaces`)
- Summary metric cards: Total Keyspaces, User Keyspaces, and System Keyspaces.
- Filter inventory by keyspace name.
- View keyspace details, check replication strategy, or delete user keyspaces.
- Filter toggle tabs between **User keyspaces** and **System keyspaces** (`system`, `system_schema`, `system_multiregion_info`, `system_schema_mcs`).

**Matching CLI Command (List Keyspaces)**:
```bash
aws keyspaces list-keyspaces \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

### 2. Create Keyspace (`/keyspaces/create`)
- **Keyspace name**: Unique identifier (1 to 48 characters, lowercase alphanumeric and underscores).
- **Replication strategy**:
  - `Single-Region`: Replicates data within the current AWS Region.
  - `Multi-Region`: Replicates data across multiple AWS Regions for cross-region disaster recovery and low-latency global reads.
- **Tags**: Assign key-value tags to the keyspace.

**Matching CLI Command (Create Keyspace)**:
```bash
aws keyspaces create-keyspace \
  --keyspace-name my_app_db \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

### 3. Keyspace Details & Tables Tab (`/keyspaces/[keyspace]`)
- Overview cards: Tables count, Replication strategy, Status (`ACTIVE`).
- **Tables tab**: Complete list of Cassandra tables within this keyspace with status, capacity mode, and quick actions.
- **Tags tab**: Inspect and edit resource tags.
- **Delete keyspace**: Confirm and delete user keyspace (with safety check preventing deletion of system keyspaces).

**Matching CLI Command (Get Keyspace)**:
```bash
aws keyspaces get-keyspace \
  --keyspace-name my_app_db \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

### 4. Create Table Wizard (`/keyspaces/[keyspace]/create-table`)
- **Table name**: Unique table name within the keyspace.
- **Columns & Schema Builder**:
  - Dynamic interactive row builder to add arbitrary columns.
  - Choose column name and Cassandra data type (`ascii`, `bigint`, `blob`, `boolean`, `counter`, `date`, `decimal`, `double`, `float`, `inet`, `int`, `smallint`, `text`, `time`, `timestamp`, `timeuuid`, `tinyint`, `uuid`, `varchar`, `varint`).
  - Column role selector:
    - `Partition key (HASH)`: Distributes rows across partitions.
    - `Clustering column (ASC)`: Sorts rows ascending inside each partition.
    - `Clustering column (DESC)`: Sorts rows descending inside each partition.
    - `Regular column`: Standard non-key attribute.
- **Capacity specifications**: Toggle between **On-demand** (`PAY_PER_REQUEST`) or **Provisioned** (with explicit RCU and WCU inputs).
- **Encryption specifications**: Select **AWS owned key** or choose a Customer managed KMS key from the live dropdown populated from [AWS KMS](KMS.md).
- **Point-in-time recovery**: Enable continuous automated backups.
- **Time to Live (TTL)**: Enable default TTL with custom duration in seconds.
- **Tags**: Assign table resource tags.

**Matching CLI Command (Create Table)**:
```bash
aws keyspaces create-table \
  --keyspace-name my_app_db \
  --table-name users \
  --schema-definition '{
    "allColumns": [
      {"name": "user_id", "type": "uuid"},
      {"name": "signup_date", "type": "timestamp"},
      {"name": "email", "type": "text"},
      {"name": "is_active", "type": "boolean"}
    ],
    "partitionKeys": [{"name": "user_id"}],
    "clusteringKeys": [{"name": "signup_date", "orderBy": "DESC"}]
  }' \
  --capacity-specification '{"throughputMode": "PAY_PER_REQUEST"}' \
  --encryption-specification '{"type": "AWS_OWNED_KMS_KEY"}' \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

### 5. Table Details (`/keyspaces/[keyspace]/tables/[table]`)
- Overview cards: Table status (`ACTIVE`), Capacity mode, Column count, Partition keys.
- **Overview tab**:
  - Full schema table showing Column name, Data type, Key type (`Partition (HASH)`, `Clustering (ASC/DESC)`), and Order.
  - Capacity specification card (throughput mode, RCU, WCU).
  - Encryption at rest card (encryption type, KMS key ARN).
  - Recovery & TTL card (Point-in-time recovery status, default TTL).
- **Edit settings tab**:
  - Add new columns to the table schema dynamically.
  - Switch capacity mode (On-demand vs. Provisioned) and adjust RCU/WCU.
  - Toggle Point-in-time recovery (PITR).
  - Toggle and configure default TTL.
- **Tags tab**: Inspect table resource tags.
- **Delete table**: Confirmation modal with required name verification.

**Matching CLI Command (Get Table)**:
```bash
aws keyspaces get-table \
  --keyspace-name my_app_db \
  --table-name users \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

**Matching CLI Command (Update Table)**:
```bash
aws keyspaces update-table \
  --keyspace-name my_app_db \
  --table-name users \
  --add-columns '[{"name": "phone_number", "type": "text"}]' \
  --capacity-specification '{"throughputMode": "PROVISIONED", "readCapacityUnits": 10, "writeCapacityUnits": 10}' \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

**Matching CLI Command (Delete Table)**:
```bash
aws keyspaces delete-table \
  --keyspace-name my_app_db \
  --table-name users \
  --endpoint-url https://127.0.0.1:9297 \
  --region us-east-1
```

### 6. Configuration Page (`/keyspaces/configuration`)
- **Service Endpoints**:
  - Regional Cassandra CQL interface: `cassandra.us-east-1.amazonaws.com`.
  - Port: `9142` (TLS required).
  - TLS Protocol: `TLS 1.2+`.
- **Service Quotas**: Table summarizing default account limits for keyspaces per region, tables per keyspace, columns per table, and maximum partition key size.

---

## 4. Hands-on Beginner Exercises

### Exercise 1: Create a Keyspace and View System Keyspaces
1. Navigate to `/keyspaces` in the console.
2. Note the initial count of System keyspaces (`system`, `system_schema`, `system_multiregion_info`, `system_schema_mcs`).
3. Click **Create keyspace**.
4. Set Keyspace name to `tutorial_keyspace`. Leave replication as `Single-Region`.
5. Click **Create keyspace**.
6. Verify `tutorial_keyspace` appears under the **User keyspaces** tab with status `ACTIVE`.

### Exercise 2: Design and Build a Wide-Column Table Schema
1. Click `tutorial_keyspace` to open the keyspace detail view.
2. Click **Create table**.
3. Set Table name to `device_metrics`.
4. In the Columns table, configure the following rows:
   - Row 1: Name `device_id`, Type `uuid`, Role `Partition key (HASH)`.
   - Row 2: Name `reading_time`, Type `timestamp`, Role `Clustering column (DESC)`.
   - Row 3: Name `metric_value`, Type `double`, Role `Regular column`.
   - Row 4: Name `status_code`, Type `int`, Role `Regular column`.
5. Under Capacity specifications, select **On-demand**.
6. Under Encryption specifications, choose **AWS owned key**.
7. Check **Enable Point-in-time recovery (PITR)**.
8. Click **Create table**.
9. In the table overview, verify the 4 columns, primary key definitions, and enabled PITR status.

### Exercise 3: Alter Table Schema and Modify Capacity Throughput
1. On the `device_metrics` table page, click the **Edit settings** tab.
2. Under Add new columns, enter Column name `location_tag`, select Type `text`, and click **Add column**.
3. Under Capacity mode, switch to **Provisioned** and set Read capacity to `20` and Write capacity to `10`.
4. Click **Save changes**.
5. Switch back to the **Overview** tab: verify `location_tag` appears in the Columns list and capacity displays `Provisioned (20 RCU / 10 WCU)`.

### Exercise 4: Clean Up Resources
1. In the `device_metrics` table view, click the **Delete** button at top right.
2. Type `delete` in the confirmation dialog and click **Confirm Delete**.
3. Return to `/keyspaces`.
4. Click on `tutorial_keyspace`.
5. Click **Delete keyspace**, confirm the prompt, and verify the keyspace is removed.

---

## 5. Limitations & Emulator Differences

- **CQL Driver Socket Execution**: The local emulator supports AWS SDK v3 management control plane commands (`create-keyspace`, `create-table`, `get-table`, `list-tables`, `update-table`, `delete-table`). Raw CQL queries (`SELECT * FROM table` over native Cassandra port 9142) require an active Cassandra storage daemon listener.
- **System Keyspace Immutability**: Keyspaces beginning with `system` are protected system namespaces and cannot be deleted or modified via the user interface.
- **Multi-Region Cross-Replication**: Multi-Region replication settings are tracked in metadata, but cross-region data synchronization is simulated locally within the single mock region `us-east-1`.

---

## 6. Common Errors & Troubleshooting

### 1. `ValidationException: At least one partition key column must be specified`
- **Cause**: Attempting to create a Cassandra table without designating at least one column as a `Partition key (HASH)`.
- **Fix**: Designate one of your schema columns as `Partition key (HASH)` before submitting the Create Table form.

### 2. `ResourceNotFoundException: Keyspace not found`
- **Cause**: Creating a table in a keyspace that has not yet been provisioned or was recently deleted.
- **Fix**: Create the keyspace first at `/keyspaces/create`, verify it shows `ACTIVE`, then create your table.

### 3. `ValidationException: Cannot delete system keyspace`
- **Cause**: Attempting to delete `system`, `system_schema`, or other built-in Cassandra schemas.
- **Fix**: System keyspaces are internal and reserved. Delete actions are disabled for system keyspaces in the console.

### 4. `KmsKeyNotFoundException: The specified KMS key does not exist`
- **Cause**: Selecting a custom customer managed KMS key that has been disabled or scheduled for deletion.
- **Fix**: Verify your key status in [AWS KMS](KMS.md) or use the default **AWS owned key** option.
