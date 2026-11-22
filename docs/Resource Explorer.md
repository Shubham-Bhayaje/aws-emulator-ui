# AWS Resource Explorer

## Overview

AWS Resource Explorer is a resource search and discovery service that enables you to explore your AWS resources across Regions using an internet-search-like query experience. Instead of navigating into individual AWS service consoles to locate resources, Resource Explorer maintains an index of resources (such as Amazon EC2 instances, Amazon S3 buckets, Amazon DynamoDB tables, Amazon SNS topics, and AWS KMS keys) and provides rapid searching based on resource names, tags, types, IDs, and Regions.

Resource Explorer is powered by custom views that control which resources are visible and whether user tags are included in search results.

---

## Key Architecture & Concepts

### 1. Indexes (Local vs. Aggregator)

Resource Explorer operates by creating indexes in the AWS Regions where you turn on the service:
- **Local Index (`LOCAL`)**: Contains resource metadata for resources located strictly within that specific AWS Region.
- **Aggregator Index (`AGGREGATOR`)**: An account can designate at most one Region to hold an Aggregator index. The Aggregator index replicates and consolidates resource metadata from all other indexed Regions across the entire AWS account. This allows searches executed against views associated with the Aggregator index to return resources located anywhere across all indexed Regions.

When Resource Explorer is turned on via **Quick Setup**, it creates an index in the selected Region, promotes it to an Aggregator index, and provisions a default view named `all-resources`.

### 2. Views

A view defines the subset of indexed resources that can be searched and displayed:
- **View Scope**: Specifies the account or organization root (`arn:aws:iam::<account-id>:root`) that the view can access.
- **Filter Expression**: A query filter string that defines which resources the view returns (for example, `service:s3 region:us-east-1` or `tag:Environment=Production`). An empty filter string includes all indexed resources.
- **Included Properties**: Controls whether additional resource properties, such as user-defined resource tags (`tags`), are returned with each matching resource.
- **Default View**: An AWS Region can designate one view as its default view. Searches conducted without explicitly specifying a view automatically query the default view.

### 3. Search Query Syntax

Resource Explorer supports a flexible, keyword- and filter-based search syntax:
- **Keywords**: Matches text within resource identifiers, ARNs, names, and property data (e.g. `prod`, `database`, `user-uploads`).
- **`service:<service-id>`**: Filters resources by AWS service (e.g., `service:s3`, `service:dynamodb`, `service:sns`, `service:sqs`, `service:ec2`).
- **`resourcetype:<type>`**: Filters by resource type (e.g., `resourcetype:s3:bucket`, `resourcetype:sns:topic`).
- **`region:<region-id>`**: Restricts results to resources residing in a specific AWS Region (e.g., `region:us-east-1`, `region:eu-west-1`).
- **`tag:<key>=<value>`**: Restricts results to resources matching specific tag keys and values.
- **`tag.key:<key>`**: Matches resources that contain a specific tag key regardless of value.
- **Prefix exclusion (`-<filter>`)**: Negates a filter condition (e.g., `-service:ec2`).

---

## Console Features

The AWS Resource Explorer console replica in this application provides 1:1 fidelity with the official AWS Management Console:

### Resource Search (`/resource-explorer`)
- **Interactive Search Bar**: Real-time search query input supporting free text and standard Resource Explorer filter expressions.
- **View Selector**: Switch between available views (e.g. `all-resources`, custom views) or quickly detect when no default view is configured.
- **Quick Setup Banner**: Automatically detects when Resource Explorer is not turned on in the current Region and provides a one-click Quick Setup action to create an Aggregator index and initialize the default view.
- **Quick Filter Chips**: One-click filter chips for popular services (`All`, `s3`, `dynamodb`, `sns`, `sqs`, `kms`, `ec2`, `lambda`, `iam`).
- **Matching Resources Table**: Displays resource identifier with direct console deep-link, service badge, resource type, AWS Region, owning account ID, and last reported timestamp.
- **Quick Copy ARN**: Inline button to copy full resource ARNs to the clipboard.
- **Pagination & Result Metrics**: Total resource count, query completion status badge, and view metadata.

### Views Management (`/resource-explorer/views`)
- **Inventory Table**: Complete list of configured views showing View Name, Default status badge, Region, Scope, Included Properties, and Last Updated date.
- **Action Toolbar**:
  - `Set as default view`: Associates the selected view as the default for the Region.
  - `Remove default`: Clears the default view association.
  - `View details`: Navigates to the comprehensive view details and filter editor page.
  - `Delete`: Opens a confirmation modal requiring the user to type "delete" to safeguard against accidental deletion.
  - `Create view`: Launches the view creation workflow.

### Create View Wizard (`/resource-explorer/views/create`)
- **View Configuration**: Enter view name and view scope.
- **Resource Filter Definition**:
  - Option to include all resources in the index.
  - Option to filter resources using custom expressions with an interactive query syntax guide.
- **Included Properties Toggle**: Enable or disable returning resource tags in search results.
- **Default View Toggle**: Designate the view as the default view upon creation.
- **Optional Tags**: Key-value tag editor for tagging the view resource itself.

### View Details (`/resource-explorer/views/[viewName]`)
- **Overview Card**: Detailed metadata display showing View ARN, View Name, Owner Account ID, Region, Scope, Default status, and Last Updated timestamp.
- **Inline Filter Editor**: In-place form allowing administrators to edit the filter expression and toggle tag inclusion without recreating the view.
- **Quick Actions**: Set as default, remove default, and delete view with modal verification.

### Settings (`/resource-explorer/settings`)
- **Regional Indexes Management**:
  - Current Region status card showing index state (`ACTIVE`, `CREATING`), index ARN, and index type (`LOCAL` vs `AGGREGATOR`).
  - Action buttons to turn on an index in the current Region, promote a local index to an Aggregator index, switch back to a local index, or turn off (delete) the index.
- **Default View Configuration**:
  - Dropdown to select and save the default view for the Region.
  - Button to clear the default view association.

---

## AWS SDK v3 Implementation Details

All operations are executed server-side only in `src/app/resource-explorer/actions.ts` via `@aws-sdk/client-resource-explorer-2` against the local AWS Emulator at `https://127.0.0.1:9297`:

- `SearchCommand`: Executes search queries with `QueryString` and `ViewArn`.
- `ListViewsCommand` / `GetViewCommand` / `BatchGetViewCommand`: Retrieves views and view details.
- `CreateViewCommand` / `UpdateViewCommand` / `DeleteViewCommand`: Manages views lifecycle.
- `GetDefaultViewCommand` / `AssociateDefaultViewCommand` / `DisassociateDefaultViewCommand`: Configures the default view.
- `GetIndexCommand` / `ListIndexesCommand` / `CreateIndexCommand` / `DeleteIndexCommand` / `UpdateIndexTypeCommand`: Manages regional indexes and aggregator promotion.

### Timestamp Normalization Middleware

When the local emulator returns timestamps formatted as epoch numbers (e.g. `1795328667.954`) or bigDecimal objects (e.g. `{"string": "1795328675.342", "type": "bigDecimal"}`) rather than RFC-3339 strings, the Smithy deserializer in the AWS SDK v3 throws a `TypeError: RFC-3339 date-times must be expressed as strings`.

To guarantee 100% reliability, `src/lib/aws.ts` injects a client middleware at the `deserialize` step on `resourceExplorer`:

```typescript
resourceExplorer.middlewareStack.add(
  (next) => async (args: any) => {
    const result = await next(args);
    const { response } = result;
    if (response && response.body && typeof response.body.on === "function") {
      const chunks: Buffer[] = [];
      for await (const chunk of response.body) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      let rawText = Buffer.concat(chunks).toString("utf-8");

      // 1. Handle bigDecimal object format
      rawText = rawText.replace(
        /"(LastReportedAt|LastUpdatedAt|CreatedAt)":\s*\{\s*"string":\s*"([^"]+)",\s*"type":\s*"bigDecimal"\s*\}/g,
        (_match, key, strVal) => {
          const sec = parseFloat(strVal);
          const dateStr = !isNaN(sec) ? new Date(sec * 1000).toISOString() : new Date().toISOString();
          return `"${key}": "${dateStr}"`;
        }
      );

      // 2. Handle numeric timestamp format
      rawText = rawText.replace(
        /"(LastReportedAt|LastUpdatedAt|CreatedAt)":\s*(\d+(?:\.\d+)?)/g,
        (_match, key, num) => {
          const dateStr = new Date(parseFloat(num) * 1000).toISOString();
          return `"${key}": "${dateStr}"`;
        }
      );

      response.body = Readable.from([Buffer.from(rawText, "utf-8")]);
    }
    return result;
  },
  {
    step: "deserialize",
    name: "normalizeResourceExplorerTimestamps",
    priority: "low",
  }
);
```

---

## Integration with Other AWS Services

| Related Service | Integration Point | Status |
|---|---|---|
| **AWS Identity and Access Management (IAM)** | View scopes are defined using IAM root ARNs (`arn:aws:iam::<account-id>:root`). IAM roles and policies control access to Resource Explorer APIs. | Fully integrated. |
| **Amazon S3** | Resource Explorer indexes S3 buckets and enables search by bucket name or prefix. | Fully supported in search. |
| **Amazon DynamoDB** | Resource Explorer indexes DynamoDB tables and enables search by table name and ARN. | Fully supported in search. |
| **Amazon SNS & SQS** | Resource Explorer indexes topics and queues across the account. | Fully supported in search. |
| **AWS KMS** | Resource Explorer indexes customer managed keys and aliases. | Fully supported in search. |
| **AWS Organizations** | Multi-account organization views allowing search across all member accounts. | Tracked in integration backlog. |

---

## Hands-on Exercises for Learners

1. **Verify Quick Setup**: Navigate to `/resource-explorer` and confirm that an Aggregator index and the default `all-resources` view exist in `us-east-1`.
2. **Execute Multi-Service Searches**: In the search bar on `/resource-explorer`, search for `service:sns` or `service:resource-explorer-2` to inspect live indexed resources.
3. **Create a Scoped View**: Go to `/resource-explorer/views` and click **Create view**. Create a view named `storage-only` with filter string `service:s3` and check **Include the tags that are attached to resources in search results**.
4. **Test View Filtering**: Return to `/resource-explorer`, select `storage-only` from the view dropdown, and observe that search results now return exclusively S3 resources.
5. **Manage Default Views**: In `/resource-explorer/settings`, designate `storage-only` as the default view, then navigate to `/resource-explorer` without parameters to verify it loads as the active view.
