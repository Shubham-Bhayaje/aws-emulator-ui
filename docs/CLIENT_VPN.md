# AWS Client VPN

AWS Client VPN is a managed client-based VPN service that enables individual remote employees and mobile workers to securely connect to resources within Amazon VPC and on-premises networks. Unlike Site-to-Site VPN which interconnects static physical network sites, Client VPN establishes secure OpenVPN-based tunnels from individual laptops, desktops, and mobile devices. It provides granular network access controls, supports certificate-based and Active Directory user authentication, and integrates directly with VPC subnets and security groups. By leveraging OpenVPN standards and optional split-tunnel routing, remote teams can securely access private cloud workloads from anywhere in the world.

---

## Key Concepts

### 1. Client VPN Endpoint
The central AWS resource that terminates client OpenVPN connections. It defines the client IPv4 CIDR range, server TLS certificate, authentication methods, transport protocol, and connection logging.
- **Example**: Endpoint `cvpn-endpoint-0123456789abcdef0` with client CIDR `10.200.0.0/22` and transport protocol UDP on port 443.

### 2. Client IPv4 CIDR Block
The private IP address pool from which IP addresses are assigned to connected remote client devices. It must have a CIDR mask between `/12` and `/22` and cannot overlap with the VPC CIDRs or other network routes.
- **Example**: `10.200.0.0/22` providing 1,024 client IP addresses.

### 3. Server and Client Certificates (ACM)
Client VPN uses TLS certificates stored in AWS Certificate Manager (ACM) to establish secure cryptographic sessions. The server certificate authenticates the Client VPN endpoint to the user, while the client root certificate chain enables mutual TLS authentication.
- **Example**: Server certificate `arn:aws:acm:us-east-1:000000000000:certificate/3e196967-2934-4d78-857e-fbecdd00d383`.

### 4. Target Network Association
The association between a Client VPN endpoint and a specific subnet inside an Amazon VPC. Associating a subnet provisions elastic network interfaces (ENIs) that bridge VPN clients into that VPC's private networking fabric.
- **Example**: Associating `subnet-00000000000000007` in `vpc-00000000000000001` with association ID `cvpn-assoc-0123456789abcdef0`.

### 5. Client VPN Route Table
Routes that tell connecting client devices where to direct their outbound traffic through the VPN tunnel. When a target network is associated, an automatic local route to the VPC CIDR is created.
- **Example**: Route `10.0.0.0/16` targeting associated subnet `subnet-00000000000000007`.

### 6. Split-Tunnel Routing
A configuration option that dictates whether all client internet traffic is forced through the VPN tunnel or only traffic destined for specific private VPC routes.
- **Example**: With split-tunnel enabled, traffic to `172.31.0.0/16` goes through the VPN tunnel, while public web browsing goes directly over the user's local ISP connection.

---

## Console Walkthrough and CLI Commands

All AWS CLI commands below are verified to run against the local AWS Emulator running at `https://127.0.0.1:9297`.

```powershell
$env:AWS_ACCESS_KEY_ID="EMULATOR46BF1B4915F9"
$env:AWS_SECRET_ACCESS_KEY="74CCE172721E16381ABA11BA4F9DFD6A122EEBC4"
$env:AWS_DEFAULT_REGION="us-east-1"
```

### 1. Client VPN Endpoints List (`/vpc/client-vpn-endpoints`)
- View all Client VPN endpoints, state (`pending-associate`, `available`), client CIDR, DNS names, and protocol settings.
- Search and filter endpoints by ID, Name tag, or CIDR.
- Action dropdown: Download client configuration, Associate target network, Manage routes, Delete endpoint.

**AWS CLI command**:
```bash
aws ec2 describe-client-vpn-endpoints \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 2. Create Client VPN Endpoint (`/vpc/client-vpn-endpoints/create`)
- Configure Name tag, Description, and Client IPv4 CIDR (`10.200.0.0/22`).
- Select Server certificate from AWS Certificate Manager (ACM).
- Configure Authentication: Mutual authentication (Client certificate ARN) and Active Directory authentication.
- Configure Connection logging: Toggle CloudWatch Logs group.
- Optional parameters: DNS servers, Transport protocol (UDP/TCP), VPN port (443/1194), Split-tunnel toggle, VPC ID, Security Groups, and Session timeout.

**AWS CLI command**:
```bash
aws ec2 create-client-vpn-endpoint \
  --client-cidr-block "10.200.0.0/22" \
  --server-certificate-arn "arn:aws:acm:us-east-1:000000000000:certificate/3e196967-2934-4d78-857e-fbecdd00d383" \
  --authentication-options "Type=certificate-authentication,MutualAuthentication={ClientRootCertificateChainArn=arn:aws:acm:us-east-1:000000000000:certificate/3e196967-2934-4d78-857e-fbecdd00d383}" \
  --connection-log-options "Enabled=false" \
  --split-tunnel \
  --transport-protocol "udp" \
  --vpn-port 443 \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 3. Associate Target Network Subnet
- Associate a VPC Subnet to bridge client traffic into the VPC.

**AWS CLI command**:
```bash
aws ec2 associate-client-vpn-target-network \
  --client-vpn-endpoint-id "cvpn-endpoint-000000000000000e3" \
  --subnet-id "subnet-00000000000000007" \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 4. Describe Target Networks
- Inspect associated VPC subnets, association IDs, and status.

**AWS CLI command**:
```bash
aws ec2 describe-client-vpn-target-networks \
  --client-vpn-endpoint-id "cvpn-endpoint-000000000000000e3" \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 5. Create Client VPN Route
- Add a custom destination route pointing traffic through an associated subnet.

**AWS CLI command**:
```bash
aws ec2 create-client-vpn-route \
  --client-vpn-endpoint-id "cvpn-endpoint-000000000000000e3" \
  --destination-cidr-block "10.0.0.0/16" \
  --target-vpc-subnet-id "subnet-00000000000000007" \
  --description "Corporate subnet route" \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 6. Describe Client VPN Routes
- List all routes configured for the endpoint.

**AWS CLI command**:
```bash
aws ec2 describe-client-vpn-routes \
  --client-vpn-endpoint-id "cvpn-endpoint-000000000000000e3" \
  --endpoint-url https://127.0.0.1:9297 \
  --no-verify-ssl
```

### 7. Download Client Configuration Profile (`.ovpn`)
- Download the OpenVPN configuration profile with connection directives, server hostname, port, and embedded CA certificates.

---

## Hands-On Exercises for Beginners

### Exercise 1: Provision a Split-Tunnel Client VPN Endpoint
1. Navigate to **VPC Console** -> **Client VPN endpoints** (`/vpc/client-vpn-endpoints`).
2. Click **Create client VPN endpoint**.
3. Name tag: `remote-dev-vpn`.
4. Client IPv4 CIDR: `10.200.0.0/22`.
5. Server certificate ARN: Select your issued ACM certificate.
6. Check **Use mutual authentication** and select your client certificate.
7. Check **Enable split-tunnel**.
8. Click **Create client VPN endpoint**.
9. Verify that the endpoint is created with state `pending-associate`.

### Exercise 2: Associate Target Subnet with Endpoint
1. Open the created Client VPN endpoint detail page (`/vpc/client-vpn-endpoints/[clientVpnEndpointId]`).
2. Switch to the **Target network associations** tab.
3. Click **Associate target network**.
4. VPC: Select your default VPC (`vpc-00000000000000001`).
5. Subnet: Select `subnet-00000000000000007` (us-east-1a).
6. Click **Associate**.
7. Observe that the association is created and state updates to `associating` / `associated`.

### Exercise 3: Add a Custom Route to Private Subnet
1. Switch to the **Route table** tab on the endpoint detail page.
2. Click **Create client VPN route**.
3. Destination CIDR: Enter `10.0.0.0/16`.
4. Target VPC Subnet: Select your associated subnet.
5. Description: `Private application workload route`.
6. Click **Create route**.
7. Verify that the new route appears in the route table with state `active`.

### Exercise 4: Download OpenVPN Client Configuration (.ovpn)
1. On the endpoint detail page, click **Download client configuration** in the top action bar.
2. Review the preview modal showing the OpenVPN directives (`client`, `dev tun`, `proto udp`, `remote`, `<ca>`).
3. Click **Download .ovpn file**.
4. Confirm that `downloaded-client-config-[endpointId].ovpn` is saved locally.

---

## Limitations and Emulator Behaviors

1. **Scaffolded Ingress Authorization**: The API `AuthorizeClientVpnIngress` and `DescribeClientVpnAuthorizationRules` return `NotImplemented` in the local emulator. In production AWS, ingress rules restrict client access per Active Directory group. The console displays an informative notice explaining this emulator limitation.
2. **Client Configuration Export**: `ExportClientVpnClientConfiguration` returns `NotImplemented` in the emulator; the console dynamically generates a valid, standard OpenVPN `.ovpn` configuration file client-side.
3. **Disassociation and Deletion**: Operations `DisassociateClientVpnTargetNetwork`, `DeleteClientVpnRoute`, and `DeleteClientVpnEndpoint` return `NotImplemented` in the current emulator build. The console shows a graceful notice when these actions are triggered.
4. **Active Sessions Telemetry**: `DescribeClientVpnConnections` is scaffolded; connected sessions appear when live clients connect to an active OpenVPN daemon.

---

## Common Errors and Fixes

### Error: `ClientCidrOverlapsWithVpcCidr`
- **Cause**: The Client IPv4 CIDR range overlaps with the CIDR block of the target VPC.
- **Fix**: Choose an IP range from a different private RFC 1918 block (such as `10.200.0.0/22` when the VPC uses `172.31.0.0/16`).

### Error: `InvalidServerCertificateArn.NotFound`
- **Cause**: The selected certificate ARN does not exist or has not been issued in AWS Certificate Manager.
- **Fix**: Open `/acm`, verify that the certificate status is `ISSUED`, or request/import a new certificate.

### Error: `TargetNetworkAlreadyAssociated`
- **Cause**: Attempting to associate multiple subnets from the same Availability Zone.
- **Fix**: AWS Client VPN allows associating at most one subnet per Availability Zone. Select a subnet in a different Availability Zone (e.g. `us-east-1b`).

---

## Dependencies

| Dependency | Type | Where Used | Docs Link |
|---|---|---|---|
| AWS Certificate Manager (ACM) | Required | Server and client root TLS certificates | [ACM Documentation](ACM.md) |
| Amazon VPC | Required | Subnets, routing tables, security groups | [VPC Documentation](VPC.md) |
| AWS Directory Service | Optional | Active Directory user authentication | [Directory Service Documentation](Directory%20Service.md) |
| Amazon CloudWatch Logs | Optional | Client connection logging | [CloudWatch Logs Documentation](CloudWatch%20Logs.md) |
