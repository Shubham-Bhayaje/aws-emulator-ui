# AWS Resource Groups & Tagging API User Guide and Reference

## 1. What is AWS Resource Groups & Tagging API?

AWS Resource Groups & Tag Editor (powered by the Resource Groups Tagging API) is a centralized management and governance tool that allows cloud engineers and administrators to discover, organize, and manage metadata across AWS resources. As cloud deployments expand across dozens of services and Regions, managing individual resources one by one becomes cumbersome and prone to configuration drift. You use the Tag Editor to query resources globally using flexible multi-service filters and apply, edit, or remove tags in bulk across hundreds of resources at once. Furthermore, AWS Resource Groups allows you to save dynamic queries so that all resources sharing specific tags or belonging to common projects can be viewed and managed as a single logical entity.

---

## 2. Key Concepts

### Resource Tag
A metadata label composed of a user-defined key and an optional value assigned to an AWS resource.
- *Example*: A tag with key `Environment` and value `Production` applied to an EC2 instance, KMS key, and S3 bucket identifies them as production workloads.

### Tag Editor
The console web interface that interfaces directly with the Resource Groups Tagging API to search resources across multiple Regions and services, inspect their active tags, and execute batch tagging or untagging.
- *Example*: Searching for all `AWS::EC2::Instance` and `AWS::S3::Bucket` resources in `us-east-1` with tag `Project=Billing` and adding a new tag `Owner=DevOps`.

### Resource Groups Tagging API (`resourcegroupstaggingapi`)
The underlying AWS API that provides cross-service tagging capabilities, including global resource discovery, tag key autocompletion, and bulk tag mutation.
- *Example*: Calling `GetResources` retrieves resources from KMS, DynamoDB, Lambda, and S3 in a single API call instead of querying each service SDK individually.

### Tag-based Resource Group
A logical collection of AWS resources defined by a criteria query containing resource types and tag filters. The group membership updates dynamically as resources are created, tagged, or terminated.
- *Example*: A group named `Production-Web-App` configured with criteria `TagFilters: [{ Key: "Application", Values: ["WebApp"] }, { Key: "Environment", Values: ["Production"] }]`.

### Resource Query
A JSON structure that specifies the search criteria used to populate a resource group, consisting of a query type (such as `TAG_FILTERS_1_0`) and filter rules.
- *Example*: `{"ResourceTypeFilters":["AWS::AllSupported"],"TagFilters":[{"Key":"CostCenter","Values":["1040"]}]}`.

---

## 3. Console Walkthrough & Matching AWS CLI Commands

All commands below run against the local emulator endpoint (`https://127.0.0.1:9297`) using the emulator credentials file (`~/.aws/emulator/9297/emulator_credentials`) and CA certificate bundle (`~/.aws/emulator/9297/ca.pem`).

### A. Tag Editor (`/resource-groups/tag-editor`)
- **Console Action**: Select target Regions (e.g. `us-east-1`), target Resource Types (e.g. `AWS::AllSupported` or specific types), and optional tag filters. Click **Search resources** to list all matching tagged resources.
- **Matching CLI Commands**:
```bash
# Discover all tagged resources across services
aws resourcegroupstaggingapi get-resources \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# List all distinct tag keys currently in use
aws resourcegroupstaggingapi get-tag-keys \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# List distinct values for a specific tag key
aws resourcegroupstaggingapi get-tag-values \
  --key Environment \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

### B. Bulk Tag Management (`/resource-groups/tag-editor`)
- **Console Action**: Select one or more resources in the table, click **Manage tags of selected resources**, enter tags to add/update, select tags to remove, and click **Apply changes**.
- **Matching CLI Commands**:
```bash
# Bulk apply tags to multiple resources simultaneously
aws resourcegroupstaggingapi tag-resources \
  --resource-arn-list "arn:aws:kms:us-east-1:000000000000:key/39f67266-1ac3-4f07-ac88-e60b8f16b229" \
  --tags Environment=Production Project=Billing \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# Bulk remove tags from resources
aws resourcegroupstaggingapi untag-resources \
  --resource-arn-list "arn:aws:kms:us-east-1:000000000000:key/39f67266-1ac3-4f07-ac88-e60b8f16b229" \
  --tag-keys Project \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

### C. Saved Resource Groups (`/resource-groups`)
- **Console Action**: Navigate to `/resource-groups` to view all saved groups, inspect their group ARNs, descriptions, and types.
- **Matching CLI Command**:
```bash
# List all resource groups
aws resource-groups list-groups \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

### D. Create Resource Group (`/resource-groups/create`)
- **Console Action**: Choose **Tag-based**, select resource types, specify tag filters, preview matching resources, provide a group name and description, and click **Create group**.
- **Matching CLI Command**:
```bash
# Create a tag-based resource group
aws resource-groups create-group \
  --name "production-workloads" \
  --description "Resources tagged for production" \
  --resource-query '{"Type":"TAG_FILTERS_1_0","Query":"{\"ResourceTypeFilters\":[\"AWS::AllSupported\"],\"TagFilters\":[{\"Key\":\"Environment\",\"Values\":[\"Production\"]}]}"}' \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

### E. Group Details (`/resource-groups/[groupName]`)
- **Console Action**: Click on a group name to view its metadata, inspect the resources currently matched by its criteria, and view the query definition.
- **Matching CLI Commands**:
```bash
# Get resource group metadata
aws resource-groups get-group \
  --group "production-workloads" \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# List resources dynamically belonging to the group
aws resource-groups list-group-resources \
  --group "production-workloads" \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# Delete the resource group
aws resource-groups delete-group \
  --group "production-workloads" \
  --region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

---

## 4. Hands-on Exercises for Beginners

### Exercise 1: Discover All Tagged Resources in Your Account
- **Objective**: Find what resources currently have tags applied across all services.
- **Steps**:
  1. Navigate to `/resource-groups/tag-editor`.
  2. Keep `All Regions` and `All resource types` selected.
  3. Leave the tag filters empty and click **Search resources**.
- **Expected Result**: A table listing all tagged resources (e.g., KMS keys, S3 buckets, EC2 instances) appears with their assigned tag keys and values.

### Exercise 2: Bulk Tag Resources Using Tag Editor
- **Objective**: Apply consistent environment and project tags to multiple resources in a single operation.
- **Steps**:
  1. On the search results table in `/resource-groups/tag-editor`, check the boxes for one or more resources.
  2. Click **Manage tags of selected resources**.
  3. Under **Tags to add or update**, enter `Key`: `Owner`, `Value`: `PlatformTeam`, then click **Add tag**.
  4. Click **Review and apply tag changes**.
  5. In the confirmation dialog, review the diff and click **Apply changes**.
- **Expected Result**: A green success banner appears confirming tags were updated. The table refreshes to show the new `Owner: PlatformTeam` tag on each selected resource.

### Exercise 3: Filter by Tag Key and Autocomplete Tag Values
- **Objective**: Use the Tag Editor search criteria to isolate resources by tag key and discover distinct values.
- **Steps**:
  1. In the **Tags (optional filter)** section of `/resource-groups/tag-editor`, type `Environment` into the Tag key field.
  2. Notice the autocomplete suggestions populated from `GetTagValues`.
  3. Select `Production` as the value and click **Search resources**.
- **Expected Result**: Only resources possessing `Environment=Production` appear in the results table.

### Exercise 4: Create and Inspect a Tag-Based Resource Group
- **Objective**: Create a saved resource group that groups all production resources together.
- **Steps**:
  1. Navigate to `/resource-groups/create`.
  2. Choose **Tag-based**.
  3. Under **Tags**, enter `Key`: `Environment` and `Value`: `Production`.
  4. Click **Preview group resources** to verify matches.
  5. Under **Group details**, enter `Group name`: `production-fleet` and click **Create group**.
  6. Click `production-fleet` on the Saved groups list to view the group details.
- **Expected Result**: The group overview displays `Group type: Tag-based` and the **Resources in group** tab lists all matching resources.

### Exercise 5: Clean Up and Untag Resources
- **Objective**: Remove the temporary `Owner` tag added in Exercise 2.
- **Steps**:
  1. In `/resource-groups/tag-editor`, search for resources with tag `Owner=PlatformTeam`.
  2. Select the resource, click **Manage tags of selected resources**.
  3. Under **Tags to remove**, check the box for `Owner`.
  4. Click **Review and apply tag changes**, then confirm with **Apply changes**.
- **Expected Result**: The `Owner` tag is cleanly removed from the resource.

---

## 5. Limitations & Emulator Differences

| Feature | AWS Real Console | Local AWS Emulator | Why / Handling |
|:---|:---|:---|:---|
| Multi-service Tagging | Supported | Supported | `tag-resources` and `untag-resources` operate across KMS, S3, EC2, DynamoDB, and IAM. |
| Tag Keys & Values Autocomplete | Supported | Supported | `get-tag-keys` and `get-tag-values` return real active tags from the emulator database. |
| Tag-based Resource Groups | Supported | Supported | `create-group`, `get-group`, and `delete-group` are fully functional. |
| Organization Tag Policies Reports | Supported | Not Supported | `StartReportCreation`, `DescribeReportCreation`, and `GetComplianceSummary` are scaffolded but return `NotImplemented` in the emulator. The console keeps the options visible with an informative notification. |
| Real-time EventBridge Notifications | Supported | Inactive | In real AWS, Resource Group lifecycle events publish to EventBridge rule buses. The toggle setting in `/resource-groups/settings` is simulated locally. |

---

## 6. Common Errors & Troubleshooting

### 1. `InvalidParameterException: The resource ARN is not valid`
- **Cause**: An invalid or malformed ARN was passed to `tag-resources` or `untag-resources`.
- **Fix**: Verify that each ARN conforms to standard AWS format: `arn:aws:<service>:<region>:<account-id>:<resource-type>/<resource-id>`.

### 2. `InvalidParameterException: Tag key cannot start with 'aws:'`
- **Cause**: AWS system tags beginning with the prefix `aws:` are reserved for internal AWS usage and cannot be created or modified by users.
- **Fix**: Use custom tag keys without the `aws:` prefix (e.g., `Environment`, `Department`, `CostCenter`).

### 3. `GetComplianceSummary is scaffolded but not implemented in this emulator`
- **Cause**: Attempting to run organization-wide tag policy compliance audits on the local emulator.
- **Fix**: Tag compliance reports require multi-account AWS Organizations tag policies. For local development and learning, use the Tag Editor's `GetResources` query features directly.
