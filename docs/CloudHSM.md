# AWS CloudHSM

## a) What This Service Is and When to Use It
AWS CloudHSM is a cloud-based hardware security module (HSM) that enables you to easily generate, store, and use your own encryption keys within dedicated, FIPS 140-2 Level 3 validated physical security modules in the AWS Cloud. It provides complete administrative control over the HSM instances and cryptographic operations, running directly inside your Amazon Virtual Private Cloud (VPC). You should use AWS CloudHSM when your workload requires strict regulatory and compliance mandates (such as HIPAA, PCI DSS, or GDPR) where encryption keys must be managed exclusively by your organization without cloud provider access. It is commonly utilized for PKI root certificate signing, database transparent data encryption (TDE), document signing, and custom cryptographic operations using standard APIs like PKCS#11, JCE, and Microsoft CNG.

---

## b) Key Concepts

### 1. CloudHSM Cluster
A cluster is a collection of individual HSM instances running in a dedicated VPC that AWS CloudHSM synchronizes and keeps in consistent state. Clusters automatically distribute cryptographic operations across available HSMs and span multiple Availability Zones for high availability and fault tolerance.
- *Example*: A multi-AZ cluster `cluster-aSr42GPAkft` deployed into `us-east-1a` and `us-east-1b` subnets to provide resilient cryptographic key availability for payment processing.

### 2. HSM Instance
A dedicated physical hardware security module device provisioned inside an individual subnet and Availability Zone within your cluster. Each HSM instance receives an Elastic Network Interface (ENI) and a private IP address within your chosen subnet.
- *Example*: An HSM instance `hsm-ydfagkct6uS` provisioned in subnet `subnet-00000000000000007` with IP `10.0.0.4` running inside `us-east-1a`.

### 3. Cluster Modes (FIPS vs. NON_FIPS)
AWS CloudHSM clusters can operate in either of two security modes:
- **FIPS Mode**: Cryptographic algorithms and key generation strictly comply with FIPS 140-2 Level 3 validation requirements.
- **Non-FIPS Mode**: Standard operational mode supporting broader custom or legacy cryptographic algorithms without strict FIPS enforcement.
- *Example*: Deploying financial key management systems in `FIPS` mode to meet regulatory PCI-DSS audits.

### 4. Cluster Initialization & CSR
Before a cluster can be placed into active cryptographic service, it begins in the `UNINITIALIZED` state. When the first HSM is provisioned, CloudHSM automatically issues a Certificate Signing Request (CSR). An administrator signs this CSR using their internal or external Certificate Authority (such as AWS Private CA) and uploads the signed cluster certificate along with the CA trust anchor to initialize the cluster.
- *Example*: Signing the cluster CSR using an internal enterprise Root CA to establish an unbroken cryptographic trust chain.

### 5. Automated Backups & Retention Policies
CloudHSM automatically takes daily, consistent backups of cluster state, keys, and configurations. Backups are retained according to the cluster's backup retention policy (between 7 and 379 days).
- *Example*: Setting a 90-day retention period on production clusters to ensure keys can be restored in disaster recovery scenarios.

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

### 1. Clusters Inventory Page (`/cloudhsm` or `/cloudhsm/clusters`)
- Displays metric summary cards: Total Clusters, Active / Initialized, Uninitialized, and Total HSMs.
- Search input and dropdown filters for State (`All states`, `UNINITIALIZED`, `INITIALIZED`, `ACTIVE`, `CREATE_IN_PROGRESS`, `DELETE_IN_PROGRESS`, `DELETED`) and Mode (`All modes`, `FIPS`, `NON_FIPS`).
- Interactive selection table with radio buttons displaying Cluster ID, State badge, HSM count, Mode, HSM type, VPC, Security Group, Backup Retention, and Created date.
- Action toolbar with buttons: `Create cluster`, `Actions` dropdown (`View details`, `Initialize cluster`, `Delete cluster`), and `Refresh`.

*Matching AWS CLI Command*:
```bash
aws cloudhsmv2 describe-clusters \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem
```

---

### 2. Create Cluster Wizard (`/cloudhsm/create`)
A 4-step configuration wizard matching the AWS Management Console:
- **Step 1: Cluster details**: Select Cluster mode (`FIPS` or `NON_FIPS`) and HSM type (`hsm2m.medium` recommended and supported by emulator, or `hsm1.medium`).
- **Step 2: Network & VPC**: Select a live VPC loaded from the local EC2 emulator. In the subnets table, select one subnet per Availability Zone across your target AZs.
- **Step 3: Backup retention**: Configure the automated backup retention period (default 90 days, between 7 and 379 days). Add optional metadata tags.
- **Step 4: Review & create**: Review the summary cards and submit cluster creation.

*Matching AWS CLI Command*:
```bash
aws cloudhsmv2 create-cluster \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --hsm-type hsm2m.medium \
  --mode FIPS \
  --subnet-ids subnet-00000000000000007 \
  --backup-retention-policy Type=DAYS,Value=90
```

---

### 3. Cluster Details Page (`/cloudhsm/clusters/[clusterId]`)
Provides in-depth operational inspection organized into 4 tabs:

#### Tab 1: Overview
- **Cluster configuration**: Cluster ID, State, Mode, HSM type, Security group ID, Backup retention, Created timestamp, and Total HSMs.
- **Network configuration**: VPC ID and Subnet mapping table (AZ to Subnet ID).
- **Cluster certificates**: Displays the PEM-encoded Cluster CSR with a one-click `Copy CSR` button.

*Matching AWS CLI Command*:
```bash
aws cloudhsmv2 describe-clusters \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --filters clusterIds="<CLUSTER_ID>"
```

#### Tab 2: HSMs
- View all provisioned HSM instances in the cluster.
- Displays: HSM ID, State, Availability Zone, Subnet ID, ENI ID, and IP address.
- `Add HSM` button opens a modal to select an AZ from the cluster's subnet mapping and optionally specify an IP address.
- `Delete HSM` button deletes the individual HSM instance from the cluster.

*Matching AWS CLI Commands*:
```bash
# Add an HSM instance
aws cloudhsmv2 create-hsm \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --cluster-id "<CLUSTER_ID>" \
  --availability-zone us-east-1a

# Delete an HSM instance
aws cloudhsmv2 delete-hsm \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --cluster-id "<CLUSTER_ID>" \
  --hsm-id "<HSM_ID>"
```

#### Tab 3: Backups
- Overview of automated cluster backups and retention policies.

#### Tab 4: Tags
- View tags attached to the cluster.

---

### 4. Delete Cluster
Clusters can be deleted when decommissioned. In accordance with AWS CloudHSM safety constraints, all HSM instances inside the cluster must be deleted before the cluster itself can be deleted.

*Matching AWS CLI Command*:
```bash
aws cloudhsmv2 delete-cluster \
  --endpoint-url https://127.0.0.1:9297 \
  --ca-bundle ~/.aws/emulator/9297/ca.pem \
  --cluster-id "<CLUSTER_ID>"
```

---

### 5. Backups Inventory Page (`/cloudhsm/backups`)
- Dedicated sub-page in CloudHSM console.
- Lists cluster backups, states, and retention windows.
- Displays emulator notice regarding scaffolded backup querying.

---

## d) Hands-on Exercises for Beginners

### Exercise 1: Create a FIPS 140-2 Level 3 CloudHSM Cluster
**Objective**: Provision a dedicated hardware security module cluster inside an Amazon VPC.
1. In the console, navigate to **CloudHSM** (`/cloudhsm`).
2. Click **Create cluster**.
3. Keep default Cluster mode as **FIPS mode** and HSM type as **hsm2m.medium**. Click **Next**.
4. In the **Network & VPC** step, verify the default VPC is selected. Check the subnet in `us-east-1a`. Click **Next**.
5. Set the backup retention policy to `90 days`. Click **Next**.
6. Review your settings and click **Create cluster**.
- **Expected Result**: The new cluster is created with an ID like `cluster-xxxx`. Its status begins in `CREATE_IN_PROGRESS` and transitions to `UNINITIALIZED`.

---

### Exercise 2: Provision an HSM Instance in the Cluster
**Objective**: Provision a physical HSM instance into an Availability Zone.
1. From the Clusters table, click on your newly created cluster ID to open its details page.
2. Select the **HSMs** tab. Notice the empty state: `No HSMs in this cluster`.
3. Click **Add HSM**.
4. In the modal, select Availability Zone `us-east-1a`. Leave IP address empty for automatic assignment.
5. Click **Add HSM**.
- **Expected Result**: A new HSM instance (e.g. `hsm-xxxx`) appears in the HSMs table with state `ACTIVE`, assigned to an Elastic Network Interface and an IP address (e.g. `10.0.0.4`).

---

### Exercise 3: Inspect the Cluster CSR
**Objective**: Locate the cryptographic Certificate Signing Request to prepare for cluster signing.
1. On the cluster details page, navigate to the **Overview** tab.
2. Scroll to the **Cluster certificates** card.
3. Observe the generated Cluster CSR beginning with `-----BEGIN CERTIFICATE REQUEST-----`.
4. Click **Copy CSR**.
- **Expected Result**: The CSR text is copied to your clipboard, ready for signing with an issuing CA such as AWS Private CA or OpenSSL.

---

### Exercise 4: Remove an HSM and Delete the Cluster
**Objective**: Perform clean teardown and decommission of a CloudHSM cluster.
1. On the **HSMs** tab, locate the provisioned HSM instance.
2. Click **Delete HSM**. In the modal, confirm deletion.
3. Once the HSM is removed and the table is empty, return to the **Overview** tab or click **Delete cluster** in the header.
4. Type `delete` in the confirmation dialog and click **Delete cluster**.
- **Expected Result**: The cluster is deleted from the emulator (`DELETE_IN_PROGRESS` -> purged). Returning to the Clusters table confirms the cluster is removed.

---

## e) Limitations in the Local Emulator

While the local emulator provides high-fidelity API modeling for cluster and HSM lifecycle operations, learners should note the following differences from AWS production:

1. **Physical HSM Appliances**: Production AWS CloudHSM runs on dedicated Cavium/Marvell liquid security physical hardware appliances located in AWS data centers. The local emulator simulates cluster state, ENIs, and HSM instances entirely on localhost.
2. **Cluster Initialization (`InitializeCluster`)**: In the local emulator engine, `InitializeCluster` is scaffolded. Submitting custom signed certificates returns an informative emulator notice.
3. **Backup Querying (`DescribeBackups`)**: The `DescribeBackups` API operation is scaffolded in the local emulator; automated backup retention is maintained according to cluster policy.
4. **Tagging Operations (`TagResource`, `ListTags`)**: Tagging endpoints in CloudHSM V2 are scaffolded in the current emulator build.
5. **Client Daemon Connectivity**: Client applications using the CloudHSM software library (`pkcs11`, `jce`, `cloudhsm_mgmt_util`) require real hardware socket connections which are simulated logically through the emulator API.

---

## f) Common Errors and Troubleshooting

### Error: `CloudHsmInvalidRequestException: Provided HsmType is not supported`
- **Cause**: Attempting to provision a cluster using `hsm1.medium` or an invalid type not enabled in the emulator engine.
- **Solution**: Always select `hsm2m.medium`, which is the supported HSM hardware type in the local emulator.

### Error: `CloudHsmInvalidRequestException: Cannot delete cluster with active HSMs`
- **Cause**: Attempting to delete a cluster that still has one or more active HSM instances.
- **Solution**: Navigate to the **HSMs** tab and delete all individual HSMs first. Once all HSMs are removed, the cluster can be deleted cleanly.

### Error: `Subnet already selected for Availability Zone`
- **Cause**: Selecting more than one subnet in the same Availability Zone during cluster creation.
- **Solution**: CloudHSM requires a maximum of one subnet per Availability Zone. Select only one subnet for each AZ in the network step.
