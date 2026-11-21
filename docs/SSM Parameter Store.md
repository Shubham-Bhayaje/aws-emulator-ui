# AWS Systems Manager Parameter Store

## a) What This Service Is and When to Use It
AWS Systems Manager Parameter Store provides centralized, secure, hierarchical storage for configuration data management and secrets management. It allows you to separate your configuration code from secrets and environment-specific values such as database connection strings, license codes, API endpoints, and passwords. You should use Parameter Store when you need a single source of truth for runtime configurations across compute resources like EC2, ECS, Lambda, or CloudFormation templates. It eliminates the need to hardcode sensitive strings directly into applications or commit plaintext credentials to source control repositories.

---

## b) Key Concepts

### 1. Hierarchical Parameter Names
Parameters can be organized into tree hierarchies using forward slashes (`/`), mimicking a directory structure. This makes it simple to grant fine-grained IAM permissions or query all parameters for a specific application tier or deployment environment in one call.
- *Example*: `/corporate/production/database/master_password` and `/corporate/development/database/master_password`.

### 2. Parameter Types
Parameter Store supports three primary data types:
- **String**: Plain text string value (e.g. URLs, port numbers, log levels).
- **StringList**: Comma-separated list of values parsed into an array (e.g. `subnet-1234,subnet-5678,subnet-9012`).
- **SecureString**: Plaintext data that is automatically encrypted at rest using an AWS Key Management Service (KMS) key before being stored, and decrypted only when requested by authorized callers.
- *Example*: A database hostname stored as `String`, a list of allowed IP subnets stored as `StringList`, and the database password stored as `SecureString`.

### 3. Parameter Tiers
Parameter Store offers two parameter tiers:
- **Standard**: Store up to 10,000 parameters per AWS Region at no charge. Maximum parameter value size is 4 KB.
- **Advanced**: Store up to 100,000 parameters per Region with a larger 8 KB maximum value size. Advanced parameters support parameter policies (such as expiration dates or notifications).
- *Example*: Using Standard tier for basic application settings, and Advanced tier when storing large certificates or JSON configuration blobs exceeding 4 KB.

### 4. Versioning and Staging Labels
Every time a parameter value or configuration is edited with the overwrite flag enabled, Parameter Store increments an immutable version number (`1`, `2`, `3`...). You can attach descriptive text labels (e.g. `live`, `latest`, `staging`, `v1.2`) to specific versions so applications can reference a stable alias rather than a hardcoded version number.
- *Example*: Version 1 of `/app/api_key` has label `deprecated`, while Version 2 has label `live`.

---

## c) Walkthrough of the Console with Matching AWS CLI Commands

All commands below have been tested and verified against the local AWS Emulator running at `https://127.0.0.1:9297`.

```bash
# Set up your environment variables for emulator access
export AWS_ENDPOINT_URL="https://127.0.0.1:9297"
export AWS_CA_BUNDLE="$HOME/.aws/emulator/9297/ca.pem"
export AWS_SHARED_CREDENTIALS_FILE="$HOME/.aws/emulator/9297/emulator_credentials"
export AWS_DEFAULT_REGION="us-east-1"
```

### 1. Parameter Inventory Page (`/systems-manager/parameter-store`)
- Displays metric summary cards: Total Parameters, Standard Tier, Advanced Tier, and SecureString (KMS).
- Search input and dropdown filters for parameter Type (`String`, `StringList`, `SecureString`) and Tier (`Standard`, `Advanced`).
- Interactive selection table with multi-select checkboxes for bulk operations.
- Direct links to edit or delete selected items.

*Matching AWS CLI Command*:
```bash
aws ssm describe-parameters \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

---

### 2. Create Parameter Page (`/systems-manager/parameter-store/create`)
- Allows defining a hierarchical parameter name (e.g. `/my-app/dev/db_host`).
- Optional description field up to 1024 characters.
- Radio selection for Standard vs Advanced tier.
- Radio selection for Type (`String`, `StringList`, `SecureString`).
- For `SecureString`: select between the default AWS managed key (`alias/aws/ssm`), a customer managed KMS key, or a custom KMS Key ARN.
- Textarea value input with character count limit and masking toggle.
- Optional resource tags (Key and Value).

*Matching AWS CLI Commands*:

*Create a plain String parameter:*
```bash
aws ssm put-parameter \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --name "/my-app/config/log_level" \
  --type "String" \
  --value "DEBUG" \
  --description "Application logging level" \
  --tier "Standard"
```

*Create an encrypted SecureString parameter:*
```bash
aws ssm put-parameter \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --name "/my-app/production/db_password" \
  --type "SecureString" \
  --key-id "alias/aws/ssm" \
  --value "SuperSecretPassword123!" \
  --description "Production database password" \
  --tier "Standard"
```

---

### 3. Parameter Details Page (`/systems-manager/parameter-store/[...parameterPath]`)
- **Overview Tab**: Displays parameter metadata (ARN, Tier, Type, Version, Data type, KMS Key ID, Last modified date/user, Description). Contains the value viewer with a "Show decrypted value" toggle button for SecureString parameters, and single-click copy buttons for values and ARNs.
- **History Tab**: Displays all immutable versions of the parameter with version number, decrypted or masked value, applied labels, and timestamp. Includes a "Manage labels" modal to attach staging labels to any version.
- **Tags Tab**: Lists attached resource tags and provides an interactive "Manage tags" modal to add or remove tags.

*Matching AWS CLI Commands*:

*Fetch parameter details and encrypted value:*
```bash
aws ssm get-parameter \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --name "/my-app/production/db_password"
```

*Fetch parameter with decrypted plaintext value:*
```bash
aws ssm get-parameter \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --name "/my-app/production/db_password" \
  --with-decryption
```

*Fetch parameter version history:*
```bash
aws ssm get-parameter-history \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --name "/my-app/production/db_password"
```

*Attach staging labels to a specific parameter version:*
```bash
aws ssm label-parameter-version \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --name "/my-app/production/db_password" \
  --parameter-version 1 \
  --labels "live" "production"
```

*Inspect and manage tags:*
```bash
# List tags
aws ssm list-tags-for-resource \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --resource-type "Parameter" \
  --resource-id "/my-app/production/db_password"

# Add tags
aws ssm add-tags-to-resource \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --resource-type "Parameter" \
  --resource-id "/my-app/production/db_password" \
  --tags "Key=Environment,Value=Production" "Key=Project,Value=Billing"
```

---

### 4. Edit Parameter Page (`/systems-manager/parameter-store/[...parameterPath]/edit`)
- Pre-populates existing description, tier, type, KMS key, and plaintext value.
- Parameter Name is read-only.
- Submitting saves changes with `--overwrite`, incrementing the version number (e.g. from version 1 to version 2) while keeping previous revisions intact in history.

*Matching AWS CLI Command*:
```bash
aws ssm put-parameter \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --name "/my-app/config/log_level" \
  --type "String" \
  --value "INFO" \
  --overwrite
```

---

### 5. Single and Bulk Deletion
- Delete single parameters directly from the detail view or table row.
- Delete multiple selected parameters simultaneously using the bulk action toolbar.

*Matching AWS CLI Commands*:

*Delete a single parameter:*
```bash
aws ssm delete-parameter \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --name "/my-app/config/log_level"
```

*Bulk delete multiple parameters:*
```bash
aws ssm delete-parameters \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --names "/my-app/dev/db_host" "/my-app/dev/db_port"
```

---

## d) Hands-On Exercises for Beginners

### Exercise 1: Create a Hierarchical Application Configuration
1. Open the console and navigate to **Parameter Store** (`/systems-manager/parameter-store`).
2. Click **Create parameter**.
3. Set **Name** to `/finance/dev/api_url`.
4. Set **Type** to `String` and **Tier** to `Standard`.
5. Enter `https://api-dev.finance.internal/v1` in the **Value** field.
6. Click **Create parameter**.
- *Expected Result*: The parameter is created with Version 1. You are redirected to the parameter overview page displaying the configured URL and metadata.

---

### Exercise 2: Store an Encrypted Secret with KMS
1. On the Parameter Store page, click **Create parameter**.
2. Set **Name** to `/finance/dev/jwt_signing_key`.
3. Set **Type** to `SecureString`.
4. Leave the KMS key selection as `alias/aws/ssm` (the default AWS managed key).
5. Enter `secret-jwt-token-string-value-xyz` in the **Value** field.
6. Click **Create parameter**.
7. In the Overview tab, observe that the displayed value is encrypted ciphertext. Click **Show decrypted value**.
- *Expected Result*: The console decrypts the ciphertext on demand through AWS KMS and displays the original plaintext `secret-jwt-token-string-value-xyz`.

---

### Exercise 3: Update a Parameter to Create Version 2 and Assign a Label
1. In the details page of `/finance/dev/api_url`, click **Edit**.
2. Change the **Value** to `https://api-dev.finance.internal/v2`.
3. Click **Save changes**.
4. Navigate to the **History** tab. Observe that both Version 1 and Version 2 are listed.
5. Next to Version 2, click **Label** (or click **Manage labels** at the top right).
6. Enter `v2-release, live` and click **Apply labels**.
- *Expected Result*: Version 2 now displays the `v2-release` and `live` badges in the history table.

---

### Exercise 4: Clean Up with Bulk Deletion
1. Return to the main **Parameter Store** list (`/systems-manager/parameter-store`).
2. Select the checkboxes next to `/finance/dev/api_url` and `/finance/dev/jwt_signing_key`.
3. Click the red **Delete (2)** button in the table toolbar.
4. Review the parameter names in the confirmation dialog and click **Delete**.
- *Expected Result*: Both parameters are deleted from the emulator. The table displays an empty state banner.

---

## e) Limitations

1. **Parameter Policies (Advanced Tier)**: Real AWS allows attaching JSON parameter policies (such as expiration timestamps and notification event rules) to Advanced tier parameters. The emulator accepts the `Tier="Advanced"` attribute, but expiration timers and EventBridge events are not automatically triggered by the local engine.
2. **Cross-Account Parameter Sharing**: In real AWS, parameters can be shared across AWS accounts using AWS Resource Access Manager (RAM). In this local single-tenant emulator, cross-account sharing is simulated locally within the single configured account.
3. **Automatic Key Rotation Notice**: When using customer managed KMS keys for SecureString parameters, rotation of the underlying KMS key re-encrypts the stored parameter upon subsequent updates, but historical versions maintain the key ID they were encrypted with at creation time.

---

## f) Common Errors and How to Fix Them

### 1. `ParameterAlreadyExists: The parameter already exists. To overwrite this value, set the overwrite option to true.`
- **Cause**: Attempting to create a parameter with a name that is already in use without setting the overwrite flag.
- **Fix**: In the UI, use the **Edit** button rather than "Create parameter". In the AWS CLI, append the `--overwrite` flag to your `put-parameter` command.

### 2. `InvalidKeyId: The specified KMS Key could not be found or is disabled.`
- **Cause**: Specifying a customer KMS key ID or alias that does not exist in the active Region.
- **Fix**: Use the default AWS managed key `alias/aws/ssm` or navigate to the KMS console (`/kms`) to verify your customer managed key ID and ensure it is in the `Enabled` state.

### 3. `ParameterMaxVersionLimitExceeded: You have reached the maximum number of versions allowed for this parameter.`
- **Cause**: Reaching 100 immutable versions for a standard tier parameter.
- **Fix**: Upgrade the parameter tier to `Advanced`, or delete obsolete versions if supported.

### 4. `Cannot read properties of undefined (reading 'send')`
- **Cause**: Next.js App Router (Turbopack) in development keeps server actions in memory. When a new AWS client is added to `src/lib/aws.ts` without a server restart or cache clear, the action closure may resolve the SDK client as undefined.
- **Fix**: The client actions in this codebase implement defensive fallback initializers (`getSsmClient()`, `getKmsClient()`). If encountered during development, clear the `.next` directory (`rm -rf .next`) and restart the dev server.
