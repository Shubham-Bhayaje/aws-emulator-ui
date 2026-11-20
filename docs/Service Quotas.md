# AWS Service Quotas User Guide & Reference

## 1. What is AWS Service Quotas?

AWS Service Quotas is a central management service that lets you view and manage your resource limits (quotas) across all AWS services as your cloud workloads grow. Every AWS account begins with standard default quotas designed to prevent unintended overspending and protect shared cloud infrastructure from runaway resource creation. You use Service Quotas to look up your current applied limits, compare them against AWS default baselines, and request quota increases when your architecture requires additional headroom (such as extra EC2 instances, VPC subnets, or DynamoDB tables). It also enables AWS Organizations administrators to configure a shared quota template that automatically requests necessary limits whenever a new AWS account is created.

---

## 2. Key Concepts

### Service Quota (Limit)
A service quota is the maximum number of resources or operations that your AWS account can provision or execute for a given service.
- *Example*: Under Amazon EC2, the quota `Running On-Demand Standard (A, C, D, H, I, M, R, T, Z) instances` controls the maximum vCPUs you can launch simultaneously in a region.

### Applied Value vs. Default Value
The **applied value** is the actual quota limit currently active and enforced on your AWS account in a specific region. The **AWS default value** is the initial baseline value AWS assigns to any newly created account before any customized increases are approved.
- *Example*: The default limit for VPCs per region might be `5`. If you requested and received an increase to `10`, your applied value is `10` while the AWS default remains `5`.

### Adjustable Quotas
A quota marked as **Adjustable: Yes** can be increased by submitting a service quota increase request through the console, API, or CLI. Non-adjustable quotas (such as hard architectural limits or API rate caps) cannot be changed.
- *Example*: The number of S3 buckets per account can be increased from `100` up to `1,000`, whereas fixed URL path constraints cannot be altered.

### Quota Increase Request
A formal change request submitted to AWS asking for a higher quota value. Requests are evaluated either automatically by automated approval rules or routed to AWS Support for validation.
- *Example*: Requesting an increase for EC2 On-Demand instances from `5` vCPUs to `20` vCPUs creates a request with ID `079612311f3fb95045ebf5bbebb052e3` that tracks through `PENDING` to `APPROVED`.

### Quota Request Template
An AWS Organizations feature that allows organization management accounts to define a reusable list of desired quota increases. Whenever a new member account is created in the organization, Service Quotas automatically submits those increase requests on the new account's behalf.
- *Example*: A template configured with `15` EC2 On-Demand instances in `us-east-1` ensures that every newly provisioned development account immediately receives 15 vCPUs without manual intervention.

---

## 3. Console Walkthrough & Matching AWS CLI Commands

All commands below run against the local emulator endpoint (`https://127.0.0.1:9297`) using the emulator credentials file and CA certificate bundle.

### A. AWS Services List (`/service-quotas`)
- **Console Action**: Navigate to `/service-quotas` to view the searchable table of all supported AWS services.
- **Matching CLI Command**:
```bash
aws service-quotas list-services \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

### B. Service Quotas List (`/service-quotas/services/{serviceCode}`)
- **Console Action**: Select any service (e.g., `ec2`) to browse its applied quotas, default values, adjustability flags, and units. Filter by `All quotas`, `Adjustable only`, or `Non-adjustable only`.
- **Matching CLI Commands**:
```bash
# List applied quotas for EC2
aws service-quotas list-service-quotas \
  --service-code ec2 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# List default quotas for EC2
aws service-quotas list-aws-default-service-quotas \
  --service-code ec2 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

### C. Quota Details (`/service-quotas/services/{serviceCode}/{quotaCode}`)
- **Console Action**: Click on a quota name to view its detailed configuration, CloudWatch metric dimensions, and attached tags.
- **Matching CLI Commands**:
```bash
# Get quota detail
aws service-quotas get-service-quota \
  --service-code ec2 \
  --quota-code L-1216C47A \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# Get default baseline
aws service-quotas get-aws-default-service-quota \
  --service-code ec2 \
  --quota-code L-1216C47A \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

### D. Requesting a Quota Increase
- **Console Action**: On a service or quota detail page, click **Request increase at account level**, enter the desired total limit (must be greater than current value), and click **Request**.
- **Matching CLI Command**:
```bash
aws service-quotas request-service-quota-increase \
  --service-code ec2 \
  --quota-code L-1216C47A \
  --desired-value 10 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

### E. Quota Request History (`/service-quotas/history`)
- **Console Action**: Open `/service-quotas/history` to view all submitted change requests, statuses (Approved, Pending, Denied), and timestamps.
- **Matching CLI Commands**:
```bash
# List all request history
aws service-quotas list-requested-service-quota-change-history \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# List request history for a specific quota
aws service-quotas list-requested-service-quota-change-history-by-quota \
  --service-code ec2 \
  --quota-code L-1216C47A \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

### F. Quota Request Template (`/service-quotas/template`)
- **Console Action**: View template status, click **Associate quota request template**, add quotas to the template, or delete entries.
- **Matching CLI Commands**:
```bash
# Check template association status
aws service-quotas get-association-for-service-quota-template \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# Associate template with organization
aws service-quotas associate-service-quota-template \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# Add quota increase to template
aws service-quotas put-service-quota-increase-request-into-template \
  --service-code ec2 \
  --quota-code L-1216C47A \
  --aws-region us-east-1 \
  --desired-value 15 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# List all quotas in template
aws service-quotas list-service-quota-increase-requests-in-template \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# Delete quota from template
aws service-quotas delete-service-quota-increase-request-from-template \
  --service-code ec2 \
  --quota-code L-1216C47A \
  --aws-region us-east-1 \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# Disassociate template
aws service-quotas disassociate-service-quota-template \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

### G. Resource Tagging
- **Console Action**: Under Quota detail > **Tags** tab, click **Manage tags** to add or remove key-value labels.
- **Matching CLI Commands**:
```bash
# Tag a quota resource
aws service-quotas tag-resource \
  --resource-arn arn:aws:servicequotas:us-east-1:000000000000:ec2/L-1216C47A \
  --tags Key=Environment,Value=Production \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# List tags for quota
aws service-quotas list-tags-for-resource \
  --resource-arn arn:aws:servicequotas:us-east-1:000000000000:ec2/L-1216C47A \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem

# Untag quota
aws service-quotas untag-resource \
  --resource-arn arn:aws:servicequotas:us-east-1:000000000000:ec2/L-1216C47A \
  --tag-keys Environment \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

---

## 4. Hands-On Exercises for Beginners

### Exercise 1: Finding an EC2 Quota & Comparing Values
1. In the console, go to **AWS services** (`/service-quotas`).
2. Type `ec2` in the search box and click on **Amazon Elastic Compute Cloud (Amazon EC2)**.
3. In the quotas table, filter by **Adjustable only**.
4. Locate `Running On-Demand Standard (A, C, D, H, I, M, R, T, Z) instances`.
5. Note the **Applied value** (`5.0`) and **AWS default value** (`5.0`).
- **Expected Result**: The quota is listed as adjustable, with a default value matching the baseline.

### Exercise 2: Requesting an Account-Level Quota Increase
1. On the EC2 quotas page, select the radio button next to `Running On-Demand Standard (A, C, D, H, I, M, R, T, Z) instances`.
2. Click **Request increase at account level**.
3. In the modal, change the desired value to `10`.
4. Click **Request**.
- **Expected Result**: A success notification banner appears indicating the request has been submitted with a unique Request ID.

### Exercise 3: Checking Request History
1. Navigate to **Quota request history** (`/service-quotas/history`) in the sidebar.
2. Verify that your increase request appears in the table with status `APPROVED` or `PENDING` and a generated Case ID.
- **Expected Result**: The table shows the request ID, service name, quota name, desired value (`10`), and timestamp.

### Exercise 4: Managing the Organization Quota Template
1. Navigate to **Quota request template** (`/service-quotas/template`).
2. If not associated, click **Associate quota request template**.
3. Click **Add quota to template**, pick `ec2`, select the On-Demand instances quota, select `us-east-1`, and specify `15`. Click **Add to template**.
4. Select the newly added row and click **Delete from template** to test safe removal.
- **Expected Result**: Template requests are added and removed cleanly with immediate table state updates.

---

## 5. Emulator Limitations

1. **Auto-Approval**: In the local emulator, quota increase requests are evaluated immediately by the emulator engine and transition directly to `APPROVED` with a mock Support Case ID. In real AWS, requests exceeding automated thresholds may take hours or days to be reviewed by AWS Support engineers.
2. **Organization Sync**: In real AWS, associating a quota template requires your account to be the root management account of an AWS Organization. The emulator emulates template association directly without requiring live multi-account organization provisioning.
3. **Usage Metrics Integration**: The emulator provides metadata for CloudWatch usage metric namespaces and dimensions (`AWS/Usage`, `ResourceCount`), but does not stream live Prometheus or CloudWatch metric datapoints unless CloudWatch alarms are actively configured.

---

## 6. Common Errors and Troubleshooting

### Error: `The desired quota value must be greater than the current value`
- **Cause**: Attempting to request a quota value that is less than or equal to your currently applied limit.
- **Fix**: Enter a numeric value strictly greater than the applied value displayed in the quota overview card.

### Error: `ServiceQuotaTemplateNotInUseException`
- **Cause**: Trying to retrieve or modify template requests when the quota request template is not associated with your account.
- **Fix**: Click **Associate quota request template** on `/service-quotas/template` or run `aws service-quotas associate-service-quota-template`.

### Error: `InvalidResourceStateException` when calling CreateSupportCase
- **Cause**: Attempting to open a manual support case for a request that has already been approved or resolved.
- **Fix**: Support cases can only be opened for requests that are in pending or manual review status.
