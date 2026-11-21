# Amazon S3 Glacier Guide

Amazon S3 Glacier is an extremely low-cost cloud storage service providing secure and durable data archiving for cold data, compliance backups, and long-term retention. It is designed for data that is infrequently accessed and where retrieval times of minutes to several hours are acceptable. Organizations use S3 Glacier to replace on-premises magnetic tape archives, satisfy multi-year regulatory retention mandates, and preserve historical records without incurring the higher storage rates of standard Amazon S3 tiers.

---

## Key Concepts

### 1. Vault
A container for storing archives. Vault names must be unique within an AWS account and Region, and can contain up to 255 alphanumeric characters, periods, underscores, and hyphens.
- *Example*: A vault named `corporate-tax-records-2026` created in `us-east-1` to house quarterly audit archives.

### 2. Archive
Any payload (such as a tarball, zip archive, video file, or database dump) stored inside a vault. Each archive is assigned an opaque, system-generated 64-character Archive ID and an immutable SHA256 tree hash checksum.
- *Example*: A 250 MB database dump uploaded with description `"PostgreSQL Q4 Backup"` and assigned archive ID `K4o9p...8x`.

### 3. Job
An asynchronous request executed against a vault. Because Glacier operates on cold storage media, reading vault inventories or extracting archived payloads cannot be performed in real time; clients initiate a job and retrieve the output after processing finishes.
- *Example*: An `inventory-retrieval` job initiated to list all archive IDs currently indexed within a vault.

### 4. Retrieval Tiers
Speed configurations available when initiating retrieval jobs:
- **Expedited**: High-priority retrieval completing in 1-5 minutes when urgent data access is required.
- **Standard**: Default tier completing in 3-5 hours.
- **Bulk**: Lowest-cost retrieval completing in 5-12 hours for massive dataset processing.

### 5. Vault Lock
A compliance feature enforcing Write Once, Read Many (WORM) storage. A Vault Lock policy is initiated, tested within a 24-hour verification window, and permanently locked to prevent any user (including the AWS root account) from deleting or altering archives before a designated retention period expires.

### 6. Data Retrieval Policies
Account-level governance rules configuring retrieval rate limits in a Region (Free Tier allowance, Max retrieval rate in MB/hour, or No retrieval limit).

---

## Console Walkthrough & Verified AWS CLI Commands

All commands below are verified and supported by the local AWS Emulator at `https://127.0.0.1:9297`. Remember to include your emulator credentials and CA bundle:

```bash
export AWS_ENDPOINT="https://127.0.0.1:9297"
export AWS_CA_BUNDLE="$HOME/.aws/emulator/9297/ca.pem"
export AWS_SHARED_CREDENTIALS_FILE="$HOME/.aws/emulator/9297/emulator_credentials"
export AWS_CONFIG_FILE="$HOME/.aws/emulator/9297/config"
```

### 1. Vaults Inventory (`/glacier`)
- **Metric Cards**: View aggregated total vault count, archive count, and storage size across the account.
- **Vaults Table**: Displays vault names, ARNs, creation dates, last inventory dates, archive counts, and storage volumes.
- **Toolbar Actions**: Filter by name, `View details`, `Delete vault`, and `Create vault`.

Matching CLI command to list vaults:
```bash
aws --endpoint-url $AWS_ENDPOINT --ca-bundle $AWS_CA_BUNDLE glacier list-vaults --account-id -
```

### 2. Create Vault Wizard (`/glacier/create`)
- **Step 1 - Vault Settings**: Provide a unique vault name (1 to 255 alphanumeric characters, hyphens, underscores, or periods).
- **Step 2 - Event Notifications**: Configure optional SNS notifications when long-running jobs complete.
- **Step 3 - Permissions**: Draft optional resource-based access policies for cross-account vault access.
- **Step 4 - Review and Create**: Summary cards verifying all configuration options prior to provisioning.

Matching CLI command to create a vault:
```bash
aws --endpoint-url $AWS_ENDPOINT --ca-bundle $AWS_CA_BUNDLE glacier create-vault \
  --account-id - \
  --vault-name compliance-archive-2026
```

### 3. Vault Details & Interactive Tabs (`/glacier/vaults/[vaultName]`)
- **Header Bar**: Displays vault ARN, creation date, last inventory timestamp, archive count, and total storage size.
- **Action Buttons**: `Upload archive`, `Initiate inventory retrieval`, `Initiate archive retrieval`, and `Delete vault`.
- **Tab 1: Vault details**: Detailed property breakdown including AWS Region and resource ARN.
- **Tab 2: Archives**: View uploaded archives, copy Archive IDs, launch archive retrievals, or delete archives.
- **Tab 3: Jobs**: View active and completed retrieval jobs, track job status (`InProgress`, `Succeeded`, `Failed`), and inspect job output.
- **Tab 4: Permissions**: View resource access policies with emulator notice.
- **Tab 5: Notifications**: Inspect SNS notification configuration with emulator notice.
- **Tab 6: Vault Lock**: Inspect WORM lock compliance controls with emulator notice.
- **Tab 7: Tags**: View resource key-value tags with emulator notice.

Matching CLI commands:
```bash
# Describe vault
aws --endpoint-url $AWS_ENDPOINT --ca-bundle $AWS_CA_BUNDLE glacier describe-vault \
  --account-id - \
  --vault-name compliance-archive-2026

# Upload an archive payload
echo "Annual financial report 2026" > financial-report.txt
aws --endpoint-url $AWS_ENDPOINT --ca-bundle $AWS_CA_BUNDLE glacier upload-archive \
  --account-id - \
  --vault-name compliance-archive-2026 \
  --archive-description "Financial Report 2026" \
  --body financial-report.txt

# Initiate an inventory retrieval job
aws --endpoint-url $AWS_ENDPOINT --ca-bundle $AWS_CA_BUNDLE glacier initiate-job \
  --account-id - \
  --vault-name compliance-archive-2026 \
  --job-parameters '{"Type":"inventory-retrieval","Description":"Weekly inventory check"}'

# List jobs for a vault
aws --endpoint-url $AWS_ENDPOINT --ca-bundle $AWS_CA_BUNDLE glacier list-jobs \
  --account-id - \
  --vault-name compliance-archive-2026

# Fetch output of a completed job
aws --endpoint-url $AWS_ENDPOINT --ca-bundle $AWS_CA_BUNDLE glacier get-job-output \
  --account-id - \
  --vault-name compliance-archive-2026 \
  --job-id <JOB_ID> output.json

# Delete an archive (using Archive ID)
aws --endpoint-url $AWS_ENDPOINT --ca-bundle $AWS_CA_BUNDLE glacier delete-archive \
  --account-id - \
  --vault-name compliance-archive-2026 \
  --archive-id <ARCHIVE_ID>

# Delete empty vault
aws --endpoint-url $AWS_ENDPOINT --ca-bundle $AWS_CA_BUNDLE glacier delete-vault \
  --account-id - \
  --vault-name compliance-archive-2026
```

### 4. Settings (`/glacier/settings`)
- Configure account-level data retrieval policies (`Free Tier only`, `Max retrieval rate`, or `No retrieval limit`).
- Clear emulator notice explaining that retrieval policies are display-only in the emulator.

---

## Hands-on Beginner Exercises

### Exercise 1: Provision a Cold Storage Vault
1. Open the console at `http://localhost:3000/glacier`.
2. Click **Create vault**.
3. In Step 1, enter `medical-records-archive` for the vault name.
4. Advance through the wizard steps and click **Create vault**.
5. *Expected Result*: The browser redirects to `/glacier/vaults/medical-records-archive`, showing the active vault with 0 archives and 0 B storage.

### Exercise 2: Upload an Archive File
1. On the `medical-records-archive` details page, click **Upload archive**.
2. Select any local text or zip file, and enter `Patient Records Batch 1` for the description.
3. Click **Upload archive**.
4. *Expected Result*: A success banner appears displaying the generated 64-character Archive ID. The archive count increments to 1 and the Archives tab displays the new entry.

### Exercise 3: Initiate an Inventory Retrieval Job
1. On the vault details page, click **Initiate inventory retrieval**.
2. Enter `Audit snapshot` in the job description field and select the `Standard` retrieval tier.
3. Click **Initiate job**.
4. Navigate to the **Jobs** tab.
5. *Expected Result*: The job appears in the Jobs table with action `InventoryRetrieval` and status `Succeeded` (or `InProgress`), with a button to view job output.

### Exercise 4: Clean Up Archives and Delete the Vault
1. Navigate to the **Archives** tab on `medical-records-archive`.
2. Click **Delete** next to the archive uploaded in Exercise 2 and confirm deletion.
3. Once the archive count reaches 0, click **Delete vault** in the top action bar.
4. Type `medical-records-archive` in the confirmation input and click **Delete**.
5. *Expected Result*: The vault is removed and the browser redirects to the empty vaults inventory table at `/glacier`.

---

## Emulator Limitations

When developing against the local AWS Emulator at `https://127.0.0.1:9297`, the following differences from real AWS apply:

1. **Job Completion Latency**: In real AWS, Glacier retrieval jobs take 1 to 5 minutes (Expedited), 3 to 5 hours (Standard), or 5 to 12 hours (Bulk). In the emulator, jobs transition to `Succeeded` instantaneously.
2. **Scaffolded APIs (`NotImplemented`)**:
   - Tagging operations (`AddTagsToVault`, `ListTagsForVault`, `RemoveTagsFromVault`).
   - Resource access policies (`SetVaultAccessPolicy`, `GetVaultAccessPolicy`, `DeleteVaultAccessPolicy`).
   - Event notifications (`SetVaultNotifications`, `GetVaultNotifications`, `DeleteVaultNotifications`).
   - Compliance Vault Lock (`InitiateVaultLock`, `GetVaultLock`, `CompleteVaultLock`, `AbortVaultLock`).
   - Account data retrieval policies (`GetDataRetrievalPolicy`, `SetDataRetrievalPolicy`).
   All corresponding tabs and settings remain fully visible in the console with clear emulator notices.
3. **Empty Vault Requirement**: In accordance with real AWS specifications, the emulator enforces that a vault must contain zero archives before `DeleteVault` can succeed. Attempting to delete a non-empty vault returns `InvalidParameterValueException: Vault not empty`.

---

## Common Errors & Troubleshooting

| Error | Root Cause | Solution |
| :--- | :--- | :--- |
| `InvalidParameterValueException: Vault not empty` | Attempting to delete a vault that still contains uploaded archives. | Delete each archive individually from the Archives tab before deleting the vault. |
| `ResourceNotFoundException: The specified vault does not exist` | Vault was already deleted or typed with incorrect casing. | Vault names are case-sensitive; check the vaults inventory table on `/glacier`. |
| `InvalidParameterValueException: Invalid vault name` | Vault name contains spaces or special characters outside `[a-zA-Z0-9_.-]`. | Use only letters, numbers, hyphens, underscores, or periods. |
| `NotImplemented: operation ... is scaffolded but not implemented` | Attempting to execute tagging, vault lock, or notification APIs via CLI. | Use the console interface to view simulated configurations; these APIs are scaffolded in the emulator. |
