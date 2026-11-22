# AWS AppConfig

AWS AppConfig is a capability of AWS Systems Manager that enables teams to quickly and safely deploy dynamic application configurations and feature flags to targets such as Amazon EC2, Amazon ECS, AWS Lambda, containers, or on-premises servers. Instead of updating code or redeploying full microservices to change a flag, timeout, or configuration setting, AppConfig updates configurations at runtime without service outages. It incorporates automated deployment strategies with controlled percentage rollouts, bake times, and automatic rollbacks if CloudWatch alarms trigger.

---

## Key Concepts

### 1. Applications
An application is an AppConfig logical container representing your software system or microservice (for example, `billing-service` or `identity-portal`). All environments, configuration profiles, and deployment strategies associate with or operate on applications.

*Example:* `billing-portal` (Application ID: `cshxgym`).

### 2. Environments
An environment is a logical deployment target representing stages in your software development lifecycle, such as Development, Beta, Staging, or Production. Each environment can link to CloudWatch alarms that monitor health during and after configuration rollouts.

*Example:* `production` (Environment ID: `b2dumyr`).

### 3. Configuration Profiles
A configuration profile defines the location, type, and validation rules for your configuration data. AppConfig supports two primary profile types:
- **Feature Flags (`AWS.AppConfig.FeatureFlags`)**: Dynamic boolean toggles, attributes, and rollout values governed by AppConfig's validation schema.
- **Freeform Configurations (`AWS.Freeform`)**: Arbitrary JSON, YAML, or plain text configuration files stored hosted in AppConfig, or sourced from Systems Manager Parameter Store, AWS Secrets Manager, or Amazon S3.

### 4. Hosted Configuration Versions
When configurations are stored directly in AWS AppConfig (`locationUri: hosted`), each revision is numbered sequentially as a hosted configuration version (v1, v2, v3). Revisions are immutable, ensuring consistent deployments and reproducible rollback baselines.

### 5. Deployment Strategies
A deployment strategy defines the velocity and safety controls of a rollout. It specifies:
- **Deployment duration**: The total time in minutes over which the configuration percentage grows to 100%.
- **Growth type**: `LINEAR` (steady increment) or `EXPONENTIAL` (accelerating increment).
- **Growth factor**: The percentage of targets that receive the configuration at each interval.
- **Final bake time**: The monitoring window in minutes after reaching 100% before the deployment marks `COMPLETE`. If alarms trigger during bake time, AppConfig rolls back.

Predefined strategies include `AppConfig.AllAtOnce`, `AppConfig.Linear50PercentEvery30Seconds`, `AppConfig.Canary10Percent20Minutes`, and `AppConfig.Linear20PercentEvery6Minutes`.

### 6. Deployments
A deployment is the execution of rolling out a specific configuration version to an environment using a chosen deployment strategy. Deployments transition through states: `DEPLOYING` -> `BAKING` -> `COMPLETE` (or `ROLLED_BACK` if cancelled or an alarm triggers).

### 7. AppConfigData Client
Applications consume configuration data by calling the AppConfigData service (`@aws-sdk/client-appconfigdata`). The client initializes a session (`StartConfigurationSession`) to receive an initial token, and subsequently polls for the latest configuration payload (`GetLatestConfiguration`), receiving only updated payloads when changes occur.

---

## Console Walkthrough and Working AWS CLI Commands

Every action below is supported in this console and tested against the local emulator at `https://127.0.0.1:9297`.

### 1. Applications (`/appconfig/applications`)
- **View applications**: Table listing all applications with ID, Name, Description, and radio selection.
- **Create application**: Click **Create application** (`/appconfig/applications/create`), enter Name and optional Description.
- **CLI Command**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 appconfig create-application \
    --name billing-service \
    --description "Billing and checkout microservice"
  ```
- **List applications**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 appconfig list-applications
  ```

### 2. Environments (`/appconfig/applications/<appId>/environments/<envId>`)
- **Create environment**: Within an application detail view, click **Create environment** (`/appconfig/applications/<appId>/environments/create`). Specify environment name (e.g. `production`), optional description, and optional CloudWatch alarm monitors.
- **CLI Command**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 appconfig create-environment \
    --application-id <app-id> \
    --name production \
    --description "Production customer environment"
  ```
- **List environments**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 appconfig list-environments \
    --application-id <app-id>
  ```

### 3. Configuration Profiles (`/appconfig/applications/<appId>/configuration-profiles/<profId>`)
- **Create Feature Flag profile**: Click **Create feature flag**, enter name (e.g. `checkout-flags`). AppConfig automatically configures `locationUri: hosted` and `type: AWS.AppConfig.FeatureFlags`.
- **Create Freeform profile**: Click **Create freeform profile**, select configuration source (`hosted`, `ssm-parameter://...`, `secretsmanager://...`, or `s3://...`), and provide initial payload.
- **CLI Command (Feature Flags)**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 appconfig create-configuration-profile \
    --application-id <app-id> \
    --name checkout-flags \
    --location-uri hosted \
    --type AWS.AppConfig.FeatureFlags
  ```
- **CLI Command (Freeform)**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 appconfig create-configuration-profile \
    --application-id <app-id> \
    --name app-config \
    --location-uri hosted \
    --type AWS.Freeform
  ```

### 4. Hosted Configuration Versions
- **Create version**: In the profile detail view, use the visual Feature Flags toggle table or the JSON editor to update settings, then click **Save as new version**.
- **CLI Command**:
  ```bash
  cat << 'EOF' > /tmp/flags.json
  {
    "version": "1",
    "flags": {
      "oneClickCheckout": {
        "name": "1-Click Checkout",
        "description": "Fast checkout button",
        "attributes": {}
      }
    },
    "values": {
      "oneClickCheckout": {
        "enabled": true
      }
    }
  }
  EOF

  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 appconfig create-hosted-configuration-version \
    --application-id <app-id> \
    --configuration-profile-id <profile-id> \
    --content-type application/json \
    --content fileb:///tmp/flags.json \
    /tmp/out.json
  ```
- **Get hosted version**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 appconfig get-hosted-configuration-version \
    --application-id <app-id> \
    --configuration-profile-id <profile-id> \
    --version-number 1 \
    /tmp/version1.json
  ```

### 5. Deployment Strategies (`/appconfig/deployment-strategies`)
- **View strategies**: Inspect predefined AWS strategies (`AppConfig.AllAtOnce`, `AppConfig.Linear50PercentEvery30Seconds`, `AppConfig.Canary10Percent20Minutes`, `AppConfig.Linear20PercentEvery6Minutes`).
- **Create custom strategy**: Click **Create deployment strategy** (`/appconfig/deployment-strategies/create`), choose Duration, Growth type, Growth factor, and Bake time.
- **CLI Command**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 appconfig create-deployment-strategy \
    --name InstantDeploy \
    --deployment-duration-in-minutes 0 \
    --growth-factor 100 \
    --growth-type LINEAR \
    --final-bake-time-in-minutes 0
  ```

### 6. Deployments (`/appconfig/applications/<appId>/deploy`)
- **Start deployment**: Select Environment, Configuration Profile, Version, and Deployment Strategy. Click **Start deployment**.
- **CLI Command**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 appconfig start-deployment \
    --application-id <app-id> \
    --environment-id <env-id> \
    --deployment-strategy-id AppConfig.AllAtOnce \
    --configuration-profile-id <profile-id> \
    --configuration-version 1
  ```
- **Get deployment status**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 appconfig get-deployment \
    --application-id <app-id> \
    --environment-id <env-id> \
    --deployment-number 1
  ```
- **Stop deployment**:
  ```bash
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 appconfig stop-deployment \
    --application-id <app-id> \
    --environment-id <env-id> \
    --deployment-number 1
  ```

### 7. Client Configuration Retrieval (AppConfigData)
- **Start session and get latest configuration**:
  ```bash
  # Start session
  TOKEN=$(aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 appconfigdata start-configuration-session \
    --application-identifier <app-id> \
    --environment-identifier <env-id> \
    --configuration-profile-identifier <profile-id> \
    --query "InitialConfigurationToken" --output text)

  # Retrieve evaluated configuration payload
  aws --endpoint-url=https://127.0.0.1:9297 --region us-east-1 appconfigdata get-latest-configuration \
    --configuration-token "$TOKEN" \
    /tmp/client-config.json

  cat /tmp/client-config.json
  ```

---

## Hands-On Exercises

### Exercise 1: Create an Application and Environment
1. In the console, navigate to **AWS AppConfig** > **Applications**.
2. Click **Create application**. Enter Name: `ecommerce-web`, Description: `Customer storefront microservice`.
3. Click **Create application**.
4. In the application details view, switch to the **Environments** tab and click **Create environment**.
5. Enter Name: `production`, Description: `Live storefront production environment`.
6. Click **Create environment**.
- **Expected Result**: Application `ecommerce-web` and Environment `production` are created with state `Ready for deployment`.

### Exercise 2: Create a Feature Flags Profile and Initial Version
1. Within `ecommerce-web`, open the **Configuration profiles and feature flags** tab.
2. Click **Create feature flag**. Enter Name: `storefront-flags`.
3. Note that the profile type is locked to `AWS.AppConfig.FeatureFlags` and location is `hosted`.
4. Leave the initial JSON schema with `version: "1"`.
5. Click **Create configuration profile**.
- **Expected Result**: Profile is created and automatically provisions hosted configuration version 1.

### Exercise 3: Add a Flag and Toggle State via Table View
1. Open profile `storefront-flags`.
2. Notice the interactive **Table view**. Click **Add feature flag**.
3. Enter Flag name: `New Search Bar`, Flag key: `newSearchBar`, check **Enable flag by default**. Click **Add flag**.
4. Toggle `newSearchBar` off or on using the visual toggle switch.
5. In the bottom bar, enter description: `Added newSearchBar feature toggle` and click **Save as new version**.
6. Switch to the **Version history** tab.
- **Expected Result**: Version 2 appears in the table with updated flag values. Click **View content** to inspect the payload.

### Exercise 4: Deploy and Retrieve Configuration in the Client Playground
1. Click **Deploy version** on version 2 (or click **Deploy** in the header).
2. Select Environment: `production`.
3. Select Deployment strategy: `AppConfig.AllAtOnce` (or custom 0-bake strategy).
4. Click **Start deployment**.
5. Once deployed, navigate to `production` environment > **Client test playground (AppConfigData)** tab.
6. Select Profile: `storefront-flags` and click **Retrieve latest configuration**.
- **Expected Result**: A green `200 OK` banner appears displaying `Content-Type: application/json` and evaluated configuration:
  ```json
  {"newSearchBar":{"enabled":true}}
  ```

---

## Limitations in the Emulator

1. **Lambda Extension Action Points**:
   Creating custom extensions that invoke AWS Lambda functions on deployment triggers (`PRE_START_DEPLOYMENT`, `ON_DEPLOYMENT_STEP`) is disabled with the notice "Available after Lambda is built". Predefined extensions (`AppConfig Feature Flags Helper`) run built-in within the emulator.
2. **Trailing Positional Parameter on Hosted Version CLI**:
   The AWS CLI `create-hosted-configuration-version` command requires a positional output file path parameter (`/tmp/out.json`) because the CLI streams the created configuration response to disk.
3. **Bake Time Duration**:
   Predefined `AppConfig.AllAtOnce` configures a 10-minute bake time (`FinalBakeTimeInMinutes: 10`). During bake time, the deployment state is `BAKING`. To test instant completion, create a custom strategy with bake time set to `0`.

---

## Common Errors and Solutions

### 1. `BadRequestException: Error invoking extension AppConfig Feature Flags Helper: Invalid 'Content' data`
- **Cause**: A profile of type `AWS.AppConfig.FeatureFlags` was given arbitrary unstructured JSON. The emulator's built-in validator requires a top-level `"version": "1"`, `"flags": {...}`, and `"values": {...}` object.
- **Fix**: Use the console's visual table editor, which automatically formats valid feature flag JSON schema.

### 2. `ConflictException: Environment currently has a state of DEPLOYING`
- **Cause**: Attempting to start a deployment in an environment that is currently deploying or baking.
- **Fix**: Wait for the deployment and bake time to complete, or click **Stop deployment** to roll it back before starting a new one.

### 3. `BadRequestException: Value at 'deploymentStrategyId' failed to satisfy constraint`
- **Cause**: Supplying a strategy name instead of strategy ID to `start-deployment`. Custom strategies use generated alphanumeric IDs (e.g. `pew8uob`).
- **Fix**: Pass the strategy ID (or predefined ID like `AppConfig.AllAtOnce`) rather than the display name.

---

## Dependencies

| Dependency | Type | Where Used in AppConfig | Status |
|:---|:---|:---|:---|
| **SSM Parameter Store** | Optional | Freeform profile source (`ssm-parameter://`) | Built ([Parameter Store Docs](file:///c:/PROJECTS/AWS%20GUI/docs/README.md)) |
| **AWS Secrets Manager** | Optional | Freeform profile source (`secretsmanager://`) | Built ([Secrets Manager Docs](file:///c:/PROJECTS/AWS%20GUI/docs/README.md)) |
| **Amazon S3** | Optional | Freeform profile source (`s3://`) | Built ([S3 Docs](file:///c:/PROJECTS/AWS%20GUI/docs/README.md)) |
| **AWS KMS** | Optional | Account settings encryption with customer managed keys | Built ([KMS Docs](file:///c:/PROJECTS/AWS%20GUI/docs/README.md)) |
| **AWS IAM** | Optional | Retrieval IAM role for S3/SSM/Secrets Manager profiles | Built ([IAM Docs](file:///c:/PROJECTS/AWS%20GUI/docs/README.md)) |
| **Amazon SNS / SQS** | Optional | Extension event notifications | Built ([SNS Docs](file:///c:/PROJECTS/AWS%20GUI/docs/README.md)) |
| **AWS Lambda** | Optional | Custom deployment extensions (action points) | Not Built (Disabled with "Available after Lambda is built") |
