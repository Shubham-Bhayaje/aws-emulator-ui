# AWS Cloud Map (Service Discovery)

## Overview

AWS Cloud Map is a fully managed cloud service discovery and resource registry service. It allows applications and microservices to keep track of dynamic endpoints (such as IP addresses, ports, and metadata attributes) for APIs, backend microservices, databases, and containers as they scale up, scale down, or migrate across cloud environments.

With AWS Cloud Map, service consumers can discover active, healthy service instances using either standard DNS queries (via Amazon Route 53 hosted zones) or the AWS Cloud Map `DiscoverInstances` API operation.

---

## Key Architecture & Concepts

### 1. Namespaces
A namespace establishes a boundary for your services and instances, determining the discovery mechanism:
- **HTTP Namespaces (`HTTP`)**: Discover instances exclusively via the AWS Cloud Map `DiscoverInstances` API call. No Amazon Route 53 hosted zones or DNS records are created. Ideal for internal microservice architectures relying on API-based discovery, mesh gateways, or custom sidecars.
- **Private DNS Namespaces (`DNS_PRIVATE`)**: Creates an Amazon Route 53 private hosted zone and associates it with one or more Amazon VPCs. Instances can be discovered via internal DNS queries inside the VPCs or via API calls.
- **Public DNS Namespaces (`DNS_PUBLIC`)**: Creates an Amazon Route 53 public hosted zone. Instances can be resolved by public DNS queries across the internet or via API calls.

### 2. Services
A service defines how instances are registered, routed, and health checked within a namespace:
- **Routing Policies**:
  - **Multivalue Answer Routing**: Route 53 returns up to eight healthy records selected randomly in response to DNS queries.
  - **Weighted Routing**: Route 53 routes traffic according to specified proportions.
- **DNS Record Types**: Supports `A` (IPv4), `AAAA` (IPv6), `SRV` (host and port), and `CNAME` (canonical domain name) records with configurable TTLs.
- **Health Checking Options**:
  - **None**: All registered instances are assumed healthy.
  - **Custom Health Check**: Third-party health checkers or container monitors report instance health directly via the `UpdateInstanceCustomHealthStatus` API with a configurable failure threshold.
  - **Route 53 Health Check**: Route 53 evaluates instance health via HTTP, HTTPS, or TCP probes (requires Route 53 Health Checks).

### 3. Instances
An instance represents a specific running endpoint of a service. Each instance has:
- A unique **Instance ID** (e.g. `i-0123456789abcdef0` or container task ID).
- System attributes:
  - `AWS_INSTANCE_IPV4`: The IPv4 address of the endpoint.
  - `AWS_INSTANCE_PORT`: The network port on which the instance listens.
  - `AWS_INIT_HEALTH_STATUS`: Initial health state upon registration.
- Custom attributes: User-defined key-value metadata tags (e.g., `environment=prod`, `version=1.2.0`, `az=us-east-1a`) that clients can filter on during discovery queries.

### 4. Instance Discovery (`DiscoverInstances`)
Clients discover endpoints programmatically by invoking the `DiscoverInstances` API operation, providing:
- `NamespaceName` (e.g. `learners-app`)
- `ServiceName` (e.g. `auth-service`)
- Optional query parameter filters (e.g. `environment=prod`, `version=v1.0`)
- `HealthStatus` filter (`HEALTHY`, `UNHEALTHY`, or `ALL`)

The API returns only healthy instances matching the specified filter criteria along with their network endpoints and attributes.

---

## Console Features

The AWS Cloud Map console replica in this application provides full fidelity to the real AWS Management Console:

### Overview Dashboard (`/cloudmap`)
- **Service Summary**: Visual cards summarizing total Namespaces (broken down by HTTP, Private DNS, Public DNS), Services, and Registered Instances.
- **Quick Links & Actions**: Direct buttons to create namespaces and navigate to namespaces or services inventories.

### Namespaces Management (`/cloudmap/namespaces`)
- **Inventory Table**: View all namespaces with type badges (HTTP, Private DNS, Public DNS), Route 53 hosted zone IDs, service counts, and descriptions.
- **Search & Filters**: Filter namespaces by name, ID, or instance discovery type.
- **Create Namespace Wizard (`/cloudmap/namespaces/create`)**:
  - Configure namespace name and description.
  - Select discovery type (HTTP, Private DNS, Public DNS).
  - Dynamic Amazon VPC dropdown when creating Private DNS namespaces, listing active VPCs from Amazon EC2.
  - Resource tagging.
- **Namespace Details (`/cloudmap/namespaces/[namespaceId]`)**:
  - Detailed metadata panel with ARN and Route 53 managed zone notices.
  - Services table with inline actions to create and delete services within the namespace.
  - Safe deletion modal verifying that all child services have been deleted.

### Services Management (`/cloudmap/services`)
- **Inventory Table**: Comprehensive table of all services with namespace links, instance counts, routing policies, DNS record configs, and health check statuses.
- **Namespace Filtering**: Filter services by parent namespace or search terms.
- **Create Service Wizard (`/cloudmap/services/create`)**:
  - Select parent namespace with automatic adaptation (DNS settings hidden when HTTP namespace is chosen).
  - Configure routing policy (Multivalue vs Weighted), record type (`A`, `AAAA`, `SRV`, `CNAME`), and TTL.
  - Configure custom health check failure threshold or view placeholder for Route 53 health checks.
- **Service Details (`/cloudmap/services/[serviceId]`)**:
  - Overview panel with full DNS and health check settings.
  - **Instances Tab**:
    - List registered instances with IPv4, Port, health status, and attributes.
    - Register Instance modal supporting IPv4, Port, and arbitrary custom key-value attributes.
    - Deregister Instance modal.
    - Instant health status toggle (`Set Healthy` / `Set Unhealthy`) for custom health checks.
  - **Discover Instances (API Playground) Tab**:
    - Interactive live API testbed executing `DiscoverInstances` against the AWS emulator.
    - Custom attribute filter testing (e.g. `version=1.0.0`).
    - Formatted table results and raw JSON response viewer.
  - Safe deletion modal verifying that all registered instances have been deregistered before service deletion.

---

## AWS SDK v3 Implementation Details

All operations are executed server-side only in `src/app/cloudmap/actions.ts` via `@aws-sdk/client-servicediscovery` against the local AWS Emulator:

- `ListNamespacesCommand` / `GetNamespaceCommand`
- `CreateHttpNamespaceCommand` / `CreatePrivateDnsNamespaceCommand` / `CreatePublicDnsNamespaceCommand`
- `DeleteNamespaceCommand`
- `ListServicesCommand` / `GetServiceCommand`
- `CreateServiceCommand` / `DeleteServiceCommand`
- `ListInstancesCommand` / `GetInstanceCommand`
- `RegisterInstanceCommand` / `DeregisterInstanceCommand`
- `DiscoverInstancesCommand`
- `UpdateInstanceCustomHealthStatusCommand`
- `GetInstancesHealthStatusCommand`
- `GetOperationCommand` / `ListOperationsCommand`

### Endpoint Subdomain Middleware
The AWS SDK v3 client automatically prepends `data-` to the endpoint hostname for `DiscoverInstancesCommand` (e.g. `data-127.0.0.1`), which causes DNS lookup failures on localhost environments. In `src/lib/aws.ts`, this is handled transparently via a custom client middleware at the `finalizeRequest` step:

```typescript
serviceDiscovery.middlewareStack.add(
  (next) => async (args: any) => {
    const { request } = args;
    if (request && request.hostname && request.hostname.startsWith("data-")) {
      request.hostname = request.hostname.replace(/^data-/, "");
    }
    return next(args);
  },
  { step: "finalizeRequest", name: "fixDataEndpointPrefix", priority: "low" }
);
```

---

## Integration with Other AWS Services

| Related Service | Integration Point | Status |
|---|---|---|
| **Amazon VPC** | Private DNS namespaces require an active Amazon VPC to associate with Route 53 private hosted zones. | Connected live via `ec2.describeVpcs`. |
| **Amazon Route 53** | Private and Public DNS namespaces manage Route 53 hosted zones and DNS record sets (`A`, `AAAA`, `SRV`, `CNAME`). | Hosted zone IDs and DNS configs displayed. |
| **Route 53 Health Checks** | Automated probing of registered endpoints. | Tracked in integration backlog; placeholder notice shown in service creation wizard. |
| **Amazon ECS** | ECS service discovery automatically registers and deregisters task containers into Cloud Map services. | Tracked in integration backlog. |
| **AWS App Mesh** | Cloud Map provides service-name-to-endpoint resolution for virtual nodes and mesh proxies. | Tracked in integration backlog. |
