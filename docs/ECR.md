# Amazon Elastic Container Registry (Amazon ECR)

## What is Amazon ECR?

Amazon Elastic Container Registry (Amazon ECR) is a fully managed container image registry that makes it simple to store, manage, share, and deploy your container images. It provides reliable and high-performance hosting for Docker images and Open Container Initiative (OCI) artifacts. ECR eliminates the need to operate your own container repositories or manage scalable storage infrastructure. Use Amazon ECR when building containerized architectures with Docker, microservices running on Amazon ECS or Amazon EKS, or container-packaged serverless functions on AWS Lambda.

---

## Key Concepts

- **Registry**: A private or public namespace hosted in an AWS account (identified by a 12-digit Registry ID such as `000000000000`) that securely houses all your container repositories.
  *Example*: `127.0.0.1:9297` in local development or `123456789012.dkr.ecr.us-east-1.amazonaws.com` on AWS.
- **Repository**: A named collection of container images and OCI artifacts sharing common access permissions, tags, and lifecycle policies.
  *Example*: `project-alpha/web-frontend` or `backend/order-api`.
- **Image & Image Tag**: A container image build containing software layers, identified by unique manifest digests (`sha256:...`) and user-assigned version tags.
  *Example*: `v1.2.0` or `latest`.
- **Tag Immutability**: A security setting that prevents an existing image tag from being overwritten by a subsequent image push.
  *Example*: Ensuring that pushing an image with tag `release-1.0` fails if `release-1.0` already exists.
- **Image Scanning**: An automated scanning feature that analyzes container image layers for software vulnerabilities and Common Vulnerabilities and Exposures (CVEs) upon push.
  *Example*: Scanning an Alpine Linux image on push and reporting 0 critical CVEs.
- **Lifecycle Policy**: A set of automated rules that cleans up obsolete or untagged container images based on age or maximum count.
  *Example*: Expiring untagged images older than 14 days to minimize storage footprint.
- **Pull Through Cache**: A caching mechanism that transparently retrieves and mirrors public container images from upstream registries (like Amazon ECR Public, Docker Hub, Quay) directly into your private ECR registry.
  *Example*: Pulling `127.0.0.1:9297/ecr-public/amazonlinux/amazonlinux:latest`.

---

## Console Walkthrough & Matching AWS CLI Commands

Every action below has been verified against the local AWS Emulator at `https://127.0.0.1:9297`.

### 1. View Private Repositories

- **Console Navigation**: Go to **Amazon ECR** &rarr; **Private repositories** (`/ecr/repositories`).
- **Features**: Search repositories by name, view image counts, tag immutability modes, scan on push status, and encryption configurations.
- **Matching AWS CLI Command**:
  ```bash
  aws ecr describe-repositories --endpoint-url https://127.0.0.1:9297 --no-verify-ssl
  ```

### 2. Create a Private Repository

- **Console Navigation**: Click the orange **Create repository** button on the repositories page (`/ecr/repositories/create`).
- **Options**:
  - **Visibility**: Private
  - **Repository name**: e.g., `sample-app/web-api`
  - **Tag immutability**: `Mutable` (default) or `Immutable`
  - **Scan on push**: `Disabled` (default) or `Enabled`
  - **KMS encryption**: Standard `AES-256` or `KMS` with customer-managed keys
  - **Tags**: Add key-value resource tags
- **Matching AWS CLI Command**:
  ```bash
  aws ecr create-repository \
    --repository-name sample-app/web-api \
    --image-tag-mutability MUTABLE \
    --image-scanning-configuration scanOnPush=true \
    --tags Key=Environment,Value=Development \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl
  ```

### 3. Retrieve Authorization Token and Authenticate Docker

- **Console Navigation**: Click **View push commands** on any repository row or detail header.
- **Features**: Copy individual Docker login and build steps for macOS/Linux or Windows.
- **Matching AWS CLI Command**:
  ```bash
  aws ecr get-authorization-token \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl
  ```
- **Docker Authentication Pipe**:
  ```bash
  aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 127.0.0.1:9297
  ```

### 4. Update Repository Settings (Tag Immutability & Scan On Push)

- **Console Navigation**: Select a repository, click **Actions** &rarr; **Edit** (or click **Edit** on the repository detail page).
- **Matching AWS CLI Commands**:
  ```bash
  # Change tag immutability
  aws ecr put-image-tag-mutability \
    --repository-name sample-app/web-api \
    --image-tag-mutability IMMUTABLE \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl

  # Change scan on push
  aws ecr put-image-scanning-configuration \
    --repository-name sample-app/web-api \
    --image-scanning-configuration scanOnPush=false \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl
  ```

### 5. Inspect Repository Images and Image Details

- **Console Navigation**: Click the repository name to open the detail view (`/ecr/repositories/[name]`), then view the **Images** tab.
- **Features**: Filter images by tag or digest, inspect image size, push timestamp, scan findings, and copy full sha256 digests.
- **Matching AWS CLI Command**:
  ```bash
  aws ecr describe-images \
    --repository-name sample-app/web-api \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl
  ```

### 6. Delete a Container Image

- **Console Navigation**: In the repository **Images** tab, select an image and click **Delete**.
- **Matching AWS CLI Command**:
  ```bash
  aws ecr batch-delete-image \
    --repository-name sample-app/web-api \
    --image-ids imageTag=latest \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl
  ```

### 7. Manage Repository Permissions (Resource Policy)

- **Console Navigation**: Go to the **Permissions** tab on the repository detail page. Click **Edit policy JSON**.
- **Features**: Define cross-account access rules or public pull privileges using standard IAM policy syntax.
- **Matching AWS CLI Commands**:
  ```bash
  # Set repository policy
  aws ecr set-repository-policy \
    --repository-name sample-app/web-api \
    --policy-text '{"Version":"2012-10-17","Statement":[{"Sid":"AllowPull","Effect":"Allow","Principal":"*","Action":["ecr:GetDownloadUrlForLayer","ecr:BatchGetImage"]}]}' \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl

  # Retrieve repository policy
  aws ecr get-repository-policy \
    --repository-name sample-app/web-api \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl

  # Delete repository policy
  aws ecr delete-repository-policy \
    --repository-name sample-app/web-api \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl
  ```

### 8. Configure Automated Lifecycle Policies

- **Console Navigation**: Go to the **Lifecycle policy** tab on the repository detail page. Click **Create rule** or **Edit policy JSON**.
- **Matching AWS CLI Commands**:
  ```bash
  # Put lifecycle policy
  aws ecr put-lifecycle-policy \
    --repository-name sample-app/web-api \
    --lifecycle-policy-text '{"rules":[{"rulePriority":1,"description":"Expire untagged images older than 14 days","selection":{"tagStatus":"untagged","countType":"sinceImagePushed","countUnit":"days","countNumber":14},"action":{"type":"expire"}}]}' \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl

  # Get lifecycle policy
  aws ecr get-lifecycle-policy \
    --repository-name sample-app/web-api \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl

  # Delete lifecycle policy
  aws ecr delete-lifecycle-policy \
    --repository-name sample-app/web-api \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl
  ```

### 9. Manage Resource Tags

- **Console Navigation**: Go to the **Tags** tab on the repository detail page. Click **Manage tags**.
- **Matching AWS CLI Commands**:
  ```bash
  # List tags
  aws ecr list-tags-for-resource \
    --resource-arn arn:aws:ecr:us-east-1:000000000000:repository/sample-app/web-api \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl

  # Add or update tags
  aws ecr tag-resource \
    --resource-arn arn:aws:ecr:us-east-1:000000000000:repository/sample-app/web-api \
    --tags Key=Project,Value=CloudLearning Key=CostCenter,Value=Engineering \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl

  # Remove tags
  aws ecr untag-resource \
    --resource-arn arn:aws:ecr:us-east-1:000000000000:repository/sample-app/web-api \
    --tag-keys CostCenter \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl
  ```

### 10. Configure Registry Settings (Scanning & Pull Through Cache)

- **Console Navigation**: Go to **Amazon ECR** &rarr; **Registry settings** (`/ecr/registry-settings`).
- **Features**: Toggle Basic scanning vs Enhanced scanning (via Amazon Inspector), view replication configurations, and manage pull through cache rules.
- **Matching AWS CLI Commands**:
  ```bash
  # Set registry scanning type
  aws ecr put-registry-scanning-configuration \
    --scan-type BASIC \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl

  # Create pull through cache rule
  aws ecr create-pull-through-cache-rule \
    --ecr-repository-prefix ecr-public \
    --upstream-registry-url public.ecr.aws \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl

  # List pull through cache rules
  aws ecr describe-pull-through-cache-rules \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl

  # Delete pull through cache rule
  aws ecr delete-pull-through-cache-rule \
    --ecr-repository-prefix ecr-public \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl
  ```

### 11. Delete a Repository

- **Console Navigation**: Select the repository, click **Actions** &rarr; **Delete**, confirm by typing `delete`, and toggle force delete.
- **Matching AWS CLI Command**:
  ```bash
  aws ecr delete-repository \
    --repository-name sample-app/web-api \
    --force \
    --endpoint-url https://127.0.0.1:9297 --no-verify-ssl
  ```

---

## Hands-On Exercises for Beginners

### Exercise 1: Create a Production Container Repository with Immutable Tags
1. Navigate to **Amazon ECR** &rarr; **Private repositories** and click **Create repository**.
2. Enter the repository name: `microservices/payment-gateway`.
3. Set **Tag immutability** to `Immutable`.
4. Enable **Scan on push**.
5. Keep default `AES-256` encryption and click **Create repository**.
6. **Expected Result**: The repository appears in your list with tag immutability set to `Immutable` and scan on push marked `Enabled`.

### Exercise 2: Inspect Push Commands for Docker CLI
1. On the repositories table, click on `microservices/payment-gateway`.
2. Click the **View push commands** button in the header.
3. Switch between the **macOS / Linux** and **Windows** tabs.
4. Click **Copy** on Step 1 to copy the `docker login` command piped with `aws ecr get-login-password`.
5. Click **Copy all** to copy the complete 4-step deployment workflow to your clipboard.
6. **Expected Result**: The push commands accurately reflect `127.0.0.1:9297/microservices/payment-gateway:latest`.

### Exercise 3: Automate Untagged Image Cleanup with a Lifecycle Policy
1. In the repository detail page for `microservices/payment-gateway`, navigate to the **Lifecycle policy** tab.
2. Click **Create rule**.
3. Paste the following JSON policy to expire untagged images older than 7 days:
   ```json
   {
     "rules": [
       {
         "rulePriority": 1,
         "description": "Purge untagged development build artifacts older than 7 days",
         "selection": {
           "tagStatus": "untagged",
           "countType": "sinceImagePushed",
           "countUnit": "days",
           "countNumber": 7
         },
         "action": {
           "type": "expire"
         }
       }
     ]
   }
   ```
4. Click **Save policy**.
5. **Expected Result**: A rule card appears under Configured Rules displaying Priority 1, matching untagged images older than 7 days with the `expire` action.

### Exercise 4: Grant Cross-Account Pull Access via Repository Policy
1. In the repository detail page, navigate to the **Permissions** tab.
2. Click **Add permission statement** or **Edit policy JSON**.
3. Enter a resource policy granting pull access to all accounts:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AllowPublicPull",
         "Effect": "Allow",
         "Principal": "*",
         "Action": [
           "ecr:GetDownloadUrlForLayer",
           "ecr:BatchGetImage",
           "ecr:BatchCheckLayerAvailability"
         ]
       }
     ]
   }
   ```
4. Click **Save policy**.
5. **Expected Result**: The Permissions tab renders the active JSON policy document.

---

## Limitations

- **Physical Docker Daemon Push**: The AWS Emulator provides full ECR control-plane API emulation (repositories, images metadata, policies, tokens, lifecycle rules, tags, replication). Pushing multi-gigabyte binary layers via real `docker push` requires a compatible registry storage backend on localhost.
- **Enhanced Scanning with Amazon Inspector**: Basic scanning (Clair engine) is fully supported. Enhanced scanning requires the Amazon Inspector service, which is not yet built into the emulator.
- **Cross-Region Physical Replication**: Replication rules can be created, updated, and described through `PutReplicationConfiguration`, but actual background image replication between geographic regions is mocked locally.

---

## Common Errors and How to Fix Them

1. **`RepositoryNotFoundException: The repository with name 'xyz' does not exist in the registry with id '000000000000'`**
   - *Cause*: Attempting to describe, delete, or inspect images in a repository that does not exist.
   - *Fix*: Create the repository first via `/ecr/repositories/create` or check for exact spelling including any namespace prefixes (e.g. `team/app`).

2. **`RepositoryAlreadyExistsException: The repository with name 'xyz' already exists in the registry with id '000000000000'`**
   - *Cause*: Creating a repository with a name that is already in use in this AWS account and Region.
   - *Fix*: Choose a different repository name or manage the existing repository from `/ecr/repositories`.

3. **`InvalidParameterException: Invalid repository name`**
   - *Cause*: Using capital letters or unsupported characters in the repository name.
   - *Fix*: Use only lowercase letters, numbers, hyphens (`-`), underscores (`_`), and forward slashes (`/`). Names must start with an alphanumeric character.

4. **`RepositoryNotEmptyException: The repository with name 'xyz' in registry with id '000000000000' cannot be deleted because it still contains images`**
   - *Cause*: Calling delete on a non-empty repository without the force flag.
   - *Fix*: Check the **Force delete this repository and all images contained within it** box in the delete dialog, or pass `--force` in the AWS CLI.

---

## Dependencies

- [AWS Key Management Service (KMS)](KMS.md): Optional dependency used for server-side encryption of repository images using customer-managed keys.
- [AWS Identity and Access Management (IAM)](README.md): Optional dependency used for repository resource policies, authorization tokens, and cross-account access.
- [AWS Secrets Manager](Secrets%20Manager.md): Optional dependency used to store upstream registry authentication credentials for pull through cache rules.
- [Amazon CloudWatch Logs](CloudWatch%20Logs.md): Optional service used for container runtime and image audit logging.
