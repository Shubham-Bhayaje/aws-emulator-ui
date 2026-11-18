/**
 * ec2-data.ts – Types, default data, and state helpers for Amazon EC2.
 * Zero emojis, Cloudscape enterprise styling.
 */

export interface SecurityGroupRule {
  type: string;
  protocol: string;
  portRange: string;
  source: string;
  description: string;
}

export interface SecurityGroup {
  id: string;
  name: string;
  description: string;
  vpcId: string;
  ownerId?: string;
  arn?: string;
  tags?: Record<string, string>;
  inboundRules: SecurityGroupRule[];
  outboundRules: SecurityGroupRule[];
}

export const AWS_SECURITY_GROUP_RULE_PRESETS = [
  { name: "Custom TCP", protocol: "TCP", defaultPort: "80", canEditPort: true },
  { name: "All traffic", protocol: "All", defaultPort: "All", canEditPort: false },
  { name: "SSH", protocol: "TCP", defaultPort: "22", canEditPort: false },
  { name: "HTTP", protocol: "TCP", defaultPort: "80", canEditPort: false },
  { name: "HTTPS", protocol: "TCP", defaultPort: "443", canEditPort: false },
  { name: "RDP", protocol: "TCP", defaultPort: "3389", canEditPort: false },
  { name: "DNS (UDP)", protocol: "UDP", defaultPort: "53", canEditPort: false },
  { name: "DNS (TCP)", protocol: "TCP", defaultPort: "53", canEditPort: false },
  { name: "MySQL/Aurora", protocol: "TCP", defaultPort: "3306", canEditPort: false },
  { name: "PostgreSQL", protocol: "TCP", defaultPort: "5432", canEditPort: false },
  { name: "MS SQL", protocol: "TCP", defaultPort: "1433", canEditPort: false },
  { name: "Oracle-RDS", protocol: "TCP", defaultPort: "1521", canEditPort: false },
  { name: "NFS", protocol: "TCP", defaultPort: "2049", canEditPort: false },
  { name: "SMB", protocol: "TCP", defaultPort: "445", canEditPort: false },
  { name: "SMTP", protocol: "TCP", defaultPort: "25", canEditPort: false },
  { name: "SMTPS", protocol: "TCP", defaultPort: "465", canEditPort: false },
  { name: "IMAP", protocol: "TCP", defaultPort: "143", canEditPort: false },
  { name: "IMAPS", protocol: "TCP", defaultPort: "993", canEditPort: false },
  { name: "POP3", protocol: "TCP", defaultPort: "110", canEditPort: false },
  { name: "POP3S", protocol: "TCP", defaultPort: "995", canEditPort: false },
  { name: "Redshift", protocol: "TCP", defaultPort: "5439", canEditPort: false },
  { name: "Custom UDP", protocol: "UDP", defaultPort: "5000", canEditPort: true },
  { name: "All TCP", protocol: "TCP", defaultPort: "0 - 65535", canEditPort: false },
  { name: "All UDP", protocol: "UDP", defaultPort: "0 - 65535", canEditPort: false },
  { name: "All ICMP - IPv4", protocol: "ICMP", defaultPort: "All", canEditPort: false },
];

export interface KeyPair {
  id: string;
  name: string;
  type: "RSA" | "ED25519";
  format: "pem" | "ppk";
  fingerprint: string;
  createTime: string;
  arn?: string;
  tags?: Record<string, string>;
  publicKey?: string;
}

export interface ElasticIp {
  allocationId: string;
  publicIp: string;
  associatedInstanceId?: string;
  associatedInstanceName?: string;
  associationId?: string;
  privateIpAddress?: string;
  networkInterfaceId?: string;
  networkBorderGroup?: string;
  domain: "vpc";
  arn?: string;
  tags?: Record<string, string>;
}

export interface EC2Instance {
  id: string;
  name: string;
  state: "running" | "stopped" | "pending" | "stopping" | "terminated" | "rebooting";
  instanceType: string;
  statusCheck: "2/2 checks passed" | "1/2 checks passed" | "0/2 checks passed" | "Initializing";
  availabilityZone: string;
  publicIp: string;
  privateIp: string;
  publicDns: string;
  privateDns: string;
  amiId: string;
  amiName: string;
  platform: string;
  architecture: "x86_64" | "arm64";
  securityGroupId: string;
  securityGroupName: string;
  keyName: string;
  vpcId: string;
  subnetId: string;
  iamRole?: string;
  launchTime: string;
  rootDeviceType: "ebs";
  rootDeviceName: "/dev/xvda";
  volumeSizeGb: number;
  tags: { [key: string]: string };
}

export const DEFAULT_KEY_PAIRS: KeyPair[] = [
  {
    id: "key-01a2b3c4d5e6f7a8b",
    name: "prod-keypair",
    type: "RSA",
    format: "pem",
    fingerprint: "1a:2b:3c:4d:5e:6f:7a:8b:9c:0d:1e:2f:3a:4b:5c:6d:7e:8f:9a:0b",
    createTime: "Aug 15, 2024, 10:24 AM",
  },
  {
    id: "key-02b3c4d5e6f7a8b9c",
    name: "dev-keypair",
    type: "ED25519",
    format: "pem",
    fingerprint: "9f:8e:7d:6c:5b:4a:39:28:17:06:f5:e4:d3:c2:b1:a0:99:88:77:66",
    createTime: "Sep 02, 2024, 03:15 PM",
  },
];

export const DEFAULT_SECURITY_GROUPS: SecurityGroup[] = [
  {
    id: "sg-01a2b3c4d5e6f7a8b",
    name: "web-dmz-sg",
    description: "Inbound HTTP/HTTPS and SSH access for public web workloads",
    vpcId: "vpc-0a1b2c3d4e5f67890",
    inboundRules: [
      { type: "SSH", protocol: "TCP", portRange: "22", source: "0.0.0.0/0", description: "Admin SSH access" },
      { type: "HTTP", protocol: "TCP", portRange: "80", source: "0.0.0.0/0", description: "Public web traffic" },
      { type: "HTTPS", protocol: "TCP", portRange: "443", source: "0.0.0.0/0", description: "Secure public web traffic" },
    ],
    outboundRules: [
      { type: "All traffic", protocol: "All", portRange: "All", source: "0.0.0.0/0", description: "Allow all outbound traffic" },
    ],
  },
  {
    id: "sg-02b3c4d5e6f7a8b9c",
    name: "api-backend-sg",
    description: "Microservice API backend access rules",
    vpcId: "vpc-0a1b2c3d4e5f67890",
    inboundRules: [
      { type: "Custom TCP", protocol: "TCP", portRange: "8080", source: "172.31.0.0/16", description: "VPC internal API traffic" },
      { type: "SSH", protocol: "TCP", portRange: "22", source: "172.31.0.0/16", description: "Internal bastion SSH" },
    ],
    outboundRules: [
      { type: "All traffic", protocol: "All", portRange: "All", source: "0.0.0.0/0", description: "Allow all outbound traffic" },
    ],
  },
  {
    id: "sg-03c4d5e6f7a8b9c0d",
    name: "worker-sg",
    description: "Asynchronous task worker security boundaries",
    vpcId: "vpc-0a1b2c3d4e5f67890",
    inboundRules: [
      { type: "SSH", protocol: "TCP", portRange: "22", source: "172.31.0.0/16", description: "Bastion access" },
    ],
    outboundRules: [
      { type: "All traffic", protocol: "All", portRange: "All", source: "0.0.0.0/0", description: "Allow all outbound traffic" },
    ],
  },
];

export const DEFAULT_ELASTIC_IPS: ElasticIp[] = [
  {
    allocationId: "eipalloc-01a2b3c4d5e6f7a8b",
    publicIp: "54.210.88.192",
    associatedInstanceId: "i-0a1b2c3d4e5f67890",
    associatedInstanceName: "web-prod-01",
    networkInterfaceId: "eni-0a1b2c3d4e5f67890",
    domain: "vpc",
  },
  {
    allocationId: "eipalloc-02b3c4d5e6f7a8b9c",
    publicIp: "34.195.42.80",
    domain: "vpc",
  },
];

export const DEFAULT_INSTANCES: EC2Instance[] = [
  {
    id: "i-0a1b2c3d4e5f67890",
    name: "web-prod-01",
    state: "running",
    instanceType: "t3.medium",
    statusCheck: "2/2 checks passed",
    availabilityZone: "us-east-1a",
    publicIp: "54.210.88.192",
    privateIp: "172.31.14.88",
    publicDns: "ec2-54-210-88-192.compute-1.amazonaws.com",
    privateDns: "ip-172-31-14-88.ec2.internal",
    amiId: "ami-0c7217cdde317cfec",
    amiName: "al2023-ami-2023.5.20240916.0-kernel-6.1-x86_64",
    platform: "Amazon Linux",
    architecture: "x86_64",
    securityGroupId: "sg-01a2b3c4d5e6f7a8b",
    securityGroupName: "web-dmz-sg",
    keyName: "prod-keypair",
    vpcId: "vpc-0a1b2c3d4e5f67890",
    subnetId: "subnet-0a1b2c3d4e5f0001",
    iamRole: "EC2-SSM-WebRole",
    launchTime: "Sep 20, 2024, 08:32 AM",
    rootDeviceType: "ebs",
    rootDeviceName: "/dev/xvda",
    volumeSizeGb: 20,
    tags: { Environment: "Production", Project: "WebPortal", Owner: "DevOps" },
  },
  {
    id: "i-0f9e8d7c6b5a43210",
    name: "api-backend-02",
    state: "running",
    instanceType: "t3.large",
    statusCheck: "2/2 checks passed",
    availabilityZone: "us-east-1b",
    publicIp: "52.90.142.11",
    privateIp: "172.31.28.140",
    publicDns: "ec2-52-90-142-11.compute-1.amazonaws.com",
    privateDns: "ip-172-31-28-140.ec2.internal",
    amiId: "ami-080e1f13689e07408",
    amiName: "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-20240912",
    platform: "Ubuntu 24.04 LTS",
    architecture: "x86_64",
    securityGroupId: "sg-02b3c4d5e6f7a8b9c",
    securityGroupName: "api-backend-sg",
    keyName: "prod-keypair",
    vpcId: "vpc-0a1b2c3d4e5f67890",
    subnetId: "subnet-0a1b2c3d4e5f0002",
    iamRole: "EC2-DynamoDB-AccessRole",
    launchTime: "Sep 22, 2024, 11:14 AM",
    rootDeviceType: "ebs",
    rootDeviceName: "/dev/xvda",
    volumeSizeGb: 40,
    tags: { Environment: "Production", Project: "CoreAPI", Service: "Backend" },
  },
  {
    id: "i-0c1d2e3f4a5b6c7d8",
    name: "batch-worker-01",
    state: "stopped",
    instanceType: "c5.xlarge",
    statusCheck: "0/2 checks passed",
    availabilityZone: "us-east-1a",
    publicIp: "",
    privateIp: "172.31.39.201",
    publicDns: "",
    privateDns: "ip-172-31-39-201.ec2.internal",
    amiId: "ami-0c7217cdde317cfec",
    amiName: "al2023-ami-2023.5.20240916.0-kernel-6.1-x86_64",
    platform: "Amazon Linux",
    architecture: "x86_64",
    securityGroupId: "sg-03c4d5e6f7a8b9c0d",
    securityGroupName: "worker-sg",
    keyName: "dev-keypair",
    vpcId: "vpc-0a1b2c3d4e5f67890",
    subnetId: "subnet-0a1b2c3d4e5f0001",
    launchTime: "Sep 18, 2024, 04:50 PM",
    rootDeviceType: "ebs",
    rootDeviceName: "/dev/xvda",
    volumeSizeGb: 50,
    tags: { Environment: "Staging", Task: "NightlyBatch" },
  },
];
