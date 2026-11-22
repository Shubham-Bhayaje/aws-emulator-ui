"use server";

import {
  CreateClientVpnEndpointCommand,
  DescribeClientVpnEndpointsCommand,
  AssociateClientVpnTargetNetworkCommand,
  DescribeClientVpnTargetNetworksCommand,
  DisassociateClientVpnTargetNetworkCommand,
  DescribeClientVpnRoutesCommand,
  CreateClientVpnRouteCommand,
  DeleteClientVpnRouteCommand,
  DeleteClientVpnEndpointCommand,
  ApplySecurityGroupsToClientVpnTargetNetworkCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import { ListCertificatesCommand } from "@aws-sdk/client-acm";
import { DescribeDirectoriesCommand } from "@aws-sdk/client-directory-service";
import { DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { ec2, acm, ds, cloudwatchLogs } from "@/lib/aws";

export interface ClientVpnEndpointItem {
  ClientVpnEndpointId: string;
  Description?: string;
  Status?: {
    Code?: string;
    Message?: string;
  };
  CreationTime?: string;
  DeletionTime?: string;
  DnsName?: string;
  ClientCidrBlock?: string;
  DnsServers?: string[];
  SplitTunnel?: boolean;
  VpnProtocol?: string;
  TransportProtocol?: string;
  VpnPort?: number;
  ServerCertificateArn?: string;
  AuthenticationOptions?: Array<{
    Type?: string;
    ActiveDirectory?: { DirectoryId?: string };
    MutualAuthentication?: { ClientRootCertificateChain?: string };
    FederatedAuthentication?: { SamlProviderArn?: string; SelfServiceSamlProviderArn?: string };
  }>;
  ConnectionLogOptions?: {
    Enabled?: boolean;
    CloudWatchLogGroup?: string;
    CloudWatchLogStream?: string;
  };
  Tags?: Array<{ Key?: string; Value?: string }>;
  SecurityGroupIds?: string[];
  VpcId?: string;
  SessionTimeoutHours?: number;
  Name?: string;
}

export interface ClientVpnTargetNetworkItem {
  AssociationId: string;
  VpcId: string;
  TargetNetworkId: string;
  ClientVpnEndpointId: string;
  Status: {
    Code?: string;
    Message?: string;
  };
  SecurityGroups?: string[];
}

export interface ClientVpnRouteItem {
  ClientVpnEndpointId: string;
  DestinationCidr: string;
  TargetSubnet?: string;
  Type?: string;
  Origin?: string;
  Status?: {
    Code?: string;
    Message?: string;
  };
  Description?: string;
}

export interface ClientVpnAuthorizationRuleItem {
  ClientVpnEndpointId: string;
  Description?: string;
  GroupId?: string;
  AccessAll?: boolean;
  DestinationCidr: string;
  Status?: {
    Code?: string;
    Message?: string;
  };
}

export interface AcmCertificateOption {
  CertificateArn: string;
  DomainName: string;
  Status?: string;
}

export interface ClientVpnDependencyData {
  certificates: AcmCertificateOption[];
  vpcs: Array<{ VpcId: string; CidrBlock?: string; Name?: string }>;
  subnets: Array<{ SubnetId: string; VpcId: string; CidrBlock?: string; AvailabilityZone?: string; Name?: string }>;
  securityGroups: Array<{ GroupId: string; GroupName?: string; VpcId?: string; Description?: string }>;
  directories: Array<{ DirectoryId: string; Name?: string; Type?: string }>;
  logGroups: Array<{ logGroupName: string; arn?: string }>;
}

export async function listClientVpnEndpointsAction(): Promise<{
  success: boolean;
  endpoints: ClientVpnEndpointItem[];
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeClientVpnEndpointsCommand({}));
    const rawList = res.ClientVpnEndpoints || [];

    const endpoints: ClientVpnEndpointItem[] = rawList.map((ep) => {
      const nameTag = ep.Tags?.find((t) => t.Key === "Name")?.Value;
      return {
        ClientVpnEndpointId: ep.ClientVpnEndpointId || "",
        Description: ep.Description,
        Status: {
          Code: ep.Status?.Code,
          Message: ep.Status?.Message,
        },
        CreationTime: ep.CreationTime,
        DeletionTime: ep.DeletionTime,
        DnsName: ep.DnsName,
        ClientCidrBlock: ep.ClientCidrBlock,
        DnsServers: ep.DnsServers,
        SplitTunnel: ep.SplitTunnel,
        VpnProtocol: ep.VpnProtocol,
        TransportProtocol: ep.TransportProtocol,
        VpnPort: ep.VpnPort,
        ServerCertificateArn: ep.ServerCertificateArn,
        AuthenticationOptions: ep.AuthenticationOptions?.map((auth) => ({
          Type: auth.Type,
          ActiveDirectory: auth.ActiveDirectory ? { DirectoryId: auth.ActiveDirectory.DirectoryId } : undefined,
          MutualAuthentication: auth.MutualAuthentication
            ? { ClientRootCertificateChain: auth.MutualAuthentication.ClientRootCertificateChain }
            : undefined,
          FederatedAuthentication: auth.FederatedAuthentication
            ? {
                SamlProviderArn: auth.FederatedAuthentication.SamlProviderArn,
                SelfServiceSamlProviderArn: auth.FederatedAuthentication.SelfServiceSamlProviderArn,
              }
            : undefined,
        })),
        ConnectionLogOptions: {
          Enabled: ep.ConnectionLogOptions?.Enabled,
          CloudWatchLogGroup: ep.ConnectionLogOptions?.CloudWatchLogGroup,
          CloudWatchLogStream: ep.ConnectionLogOptions?.CloudWatchLogStream,
        },
        Tags: ep.Tags?.map((t) => ({ Key: t.Key, Value: t.Value })),
        SecurityGroupIds: ep.SecurityGroupIds,
        VpcId: ep.VpcId,
        SessionTimeoutHours: ep.SessionTimeoutHours,
        Name: nameTag || ep.ClientVpnEndpointId || "",
      };
    });

    return { success: true, endpoints };
  } catch (err: unknown) {
    return {
      success: false,
      endpoints: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getClientVpnEndpointDetailAction(clientVpnEndpointId: string): Promise<{
  success: boolean;
  endpoint?: ClientVpnEndpointItem;
  targetNetworks: ClientVpnTargetNetworkItem[];
  routes: ClientVpnRouteItem[];
  error?: string;
}> {
  try {
    const [epRes, netRes, routesRes] = await Promise.all([
      ec2.send(
        new DescribeClientVpnEndpointsCommand({
          ClientVpnEndpointIds: [clientVpnEndpointId],
        })
      ),
      ec2
        .send(
          new DescribeClientVpnTargetNetworksCommand({
            ClientVpnEndpointId: clientVpnEndpointId,
          })
        )
        .catch(() => ({ ClientVpnTargetNetworks: [] })),
      ec2
        .send(
          new DescribeClientVpnRoutesCommand({
            ClientVpnEndpointId: clientVpnEndpointId,
          })
        )
        .catch(() => ({ Routes: [] })),
    ]);

    const ep = epRes.ClientVpnEndpoints?.[0];
    if (!ep) {
      return {
        success: false,
        targetNetworks: [],
        routes: [],
        error: `Client VPN endpoint ${clientVpnEndpointId} not found`,
      };
    }

    const nameTag = ep.Tags?.find((t) => t.Key === "Name")?.Value;
    const endpoint: ClientVpnEndpointItem = {
      ClientVpnEndpointId: ep.ClientVpnEndpointId || "",
      Description: ep.Description,
      Status: {
        Code: ep.Status?.Code,
        Message: ep.Status?.Message,
      },
      CreationTime: ep.CreationTime,
      DeletionTime: ep.DeletionTime,
      DnsName: ep.DnsName,
      ClientCidrBlock: ep.ClientCidrBlock,
      DnsServers: ep.DnsServers,
      SplitTunnel: ep.SplitTunnel,
      VpnProtocol: ep.VpnProtocol,
      TransportProtocol: ep.TransportProtocol,
      VpnPort: ep.VpnPort,
      ServerCertificateArn: ep.ServerCertificateArn,
      AuthenticationOptions: ep.AuthenticationOptions?.map((auth) => ({
        Type: auth.Type,
        ActiveDirectory: auth.ActiveDirectory ? { DirectoryId: auth.ActiveDirectory.DirectoryId } : undefined,
        MutualAuthentication: auth.MutualAuthentication
          ? { ClientRootCertificateChain: auth.MutualAuthentication.ClientRootCertificateChain }
          : undefined,
        FederatedAuthentication: auth.FederatedAuthentication
          ? {
              SamlProviderArn: auth.FederatedAuthentication.SamlProviderArn,
              SelfServiceSamlProviderArn: auth.FederatedAuthentication.SelfServiceSamlProviderArn,
            }
          : undefined,
      })),
      ConnectionLogOptions: {
        Enabled: ep.ConnectionLogOptions?.Enabled,
        CloudWatchLogGroup: ep.ConnectionLogOptions?.CloudWatchLogGroup,
        CloudWatchLogStream: ep.ConnectionLogOptions?.CloudWatchLogStream,
      },
      Tags: ep.Tags?.map((t) => ({ Key: t.Key, Value: t.Value })),
      SecurityGroupIds: ep.SecurityGroupIds,
      VpcId: ep.VpcId,
      SessionTimeoutHours: ep.SessionTimeoutHours,
      Name: nameTag || ep.ClientVpnEndpointId || "",
    };

    const targetNetworks: ClientVpnTargetNetworkItem[] = (netRes.ClientVpnTargetNetworks || []).map((tn) => ({
      AssociationId: tn.AssociationId || "",
      VpcId: tn.VpcId || "",
      TargetNetworkId: tn.TargetNetworkId || "",
      ClientVpnEndpointId: tn.ClientVpnEndpointId || "",
      Status: {
        Code: tn.Status?.Code,
        Message: tn.Status?.Message,
      },
      SecurityGroups: tn.SecurityGroups,
    }));

    const routes: ClientVpnRouteItem[] = (routesRes.Routes || []).map((r) => ({
      ClientVpnEndpointId: r.ClientVpnEndpointId || "",
      DestinationCidr: r.DestinationCidr || "",
      TargetSubnet: r.TargetSubnet,
      Type: r.Type,
      Origin: r.Origin,
      Status: {
        Code: r.Status?.Code,
        Message: r.Status?.Message,
      },
      Description: r.Description,
    }));

    return {
      success: true,
      endpoint,
      targetNetworks,
      routes,
    };
  } catch (err: unknown) {
    return {
      success: false,
      targetNetworks: [],
      routes: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createClientVpnEndpointAction(data: {
  clientCidrBlock: string;
  serverCertificateArn: string;
  description?: string;
  name?: string;
  splitTunnel?: boolean;
  transportProtocol?: "udp" | "tcp";
  vpnPort?: number;
  dnsServers?: string[];
  sessionTimeoutHours?: number;
  useMutualAuth?: boolean;
  clientCertificateArn?: string;
  useActiveDirectory?: boolean;
  directoryId?: string;
  enableLogging?: boolean;
  logGroup?: string;
  logStream?: string;
  vpcId?: string;
  securityGroupIds?: string[];
  tags?: Array<{ key: string; value: string }>;
}): Promise<{
  success: boolean;
  clientVpnEndpointId?: string;
  dnsName?: string;
  error?: string;
}> {
  try {
    const authOptions: Array<{
      Type: "certificate-authentication" | "directory-service-authentication" | "federated-authentication";
      MutualAuthentication?: { ClientRootCertificateChainArn: string };
      ActiveDirectory?: { DirectoryId: string };
    }> = [];

    if (data.useMutualAuth && data.clientCertificateArn) {
      authOptions.push({
        Type: "certificate-authentication",
        MutualAuthentication: {
          ClientRootCertificateChainArn: data.clientCertificateArn,
        },
      });
    }

    if (data.useActiveDirectory && data.directoryId) {
      authOptions.push({
        Type: "directory-service-authentication",
        ActiveDirectory: {
          DirectoryId: data.directoryId,
        },
      });
    }

    // Default to certificate-authentication if none selected
    if (authOptions.length === 0) {
      authOptions.push({
        Type: "certificate-authentication",
        MutualAuthentication: {
          ClientRootCertificateChainArn: data.serverCertificateArn,
        },
      });
    }

    const tagSpecs = [];
    const validTags = (data.tags || []).filter((t) => t.key.trim());
    if (data.name?.trim()) {
      validTags.unshift({ key: "Name", value: data.name.trim() });
    }
    if (validTags.length > 0) {
      tagSpecs.push({
        ResourceType: "client-vpn-endpoint" as const,
        Tags: validTags.map((t) => ({ Key: t.key.trim(), Value: t.value.trim() })),
      });
    }

    const res = await ec2.send(
      new CreateClientVpnEndpointCommand({
        ClientCidrBlock: data.clientCidrBlock.trim(),
        ServerCertificateArn: data.serverCertificateArn,
        Description: data.description?.trim() || undefined,
        SplitTunnel: data.splitTunnel ?? false,
        TransportProtocol: data.transportProtocol || "udp",
        VpnPort: data.vpnPort || 443,
        DnsServers: data.dnsServers && data.dnsServers.length > 0 ? data.dnsServers : undefined,
        SessionTimeoutHours: data.sessionTimeoutHours || 24,
        AuthenticationOptions: authOptions,
        ConnectionLogOptions: {
          Enabled: data.enableLogging ?? false,
          CloudWatchLogGroup: data.enableLogging ? data.logGroup : undefined,
          CloudWatchLogStream: data.enableLogging ? data.logStream : undefined,
        },
        VpcId: data.vpcId || undefined,
        SecurityGroupIds: data.securityGroupIds && data.securityGroupIds.length > 0 ? data.securityGroupIds : undefined,
        TagSpecifications: tagSpecs.length > 0 ? tagSpecs : undefined,
      })
    );

    return {
      success: true,
      clientVpnEndpointId: res.ClientVpnEndpointId,
      dnsName: res.DnsName,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function associateClientVpnTargetNetworkAction(
  clientVpnEndpointId: string,
  subnetId: string
): Promise<{ success: boolean; associationId?: string; error?: string }> {
  try {
    const res = await ec2.send(
      new AssociateClientVpnTargetNetworkCommand({
        ClientVpnEndpointId: clientVpnEndpointId,
        SubnetId: subnetId,
      })
    );
    return {
      success: true,
      associationId: res.AssociationId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function disassociateClientVpnTargetNetworkAction(
  clientVpnEndpointId: string,
  associationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new DisassociateClientVpnTargetNetworkCommand({
        ClientVpnEndpointId: clientVpnEndpointId,
        AssociationId: associationId,
      })
    );
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createClientVpnRouteAction(data: {
  clientVpnEndpointId: string;
  destinationCidrBlock: string;
  targetVpcSubnetId: string;
  description?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new CreateClientVpnRouteCommand({
        ClientVpnEndpointId: data.clientVpnEndpointId,
        DestinationCidrBlock: data.destinationCidrBlock.trim(),
        TargetVpcSubnetId: data.targetVpcSubnetId,
        Description: data.description?.trim() || undefined,
      })
    );
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteClientVpnRouteAction(data: {
  clientVpnEndpointId: string;
  destinationCidrBlock: string;
  targetVpcSubnetId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new DeleteClientVpnRouteCommand({
        ClientVpnEndpointId: data.clientVpnEndpointId,
        DestinationCidrBlock: data.destinationCidrBlock,
        TargetVpcSubnetId: data.targetVpcSubnetId,
      })
    );
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteClientVpnEndpointAction(
  clientVpnEndpointId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new DeleteClientVpnEndpointCommand({
        ClientVpnEndpointId: clientVpnEndpointId,
      })
    );
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function applySecurityGroupsToClientVpnTargetNetworkAction(data: {
  clientVpnEndpointId: string;
  vpcId: string;
  securityGroupIds: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new ApplySecurityGroupsToClientVpnTargetNetworkCommand({
        ClientVpnEndpointId: data.clientVpnEndpointId,
        VpcId: data.vpcId,
        SecurityGroupIds: data.securityGroupIds,
      })
    );
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getClientVpnDependenciesAction(): Promise<{
  success: boolean;
  data: ClientVpnDependencyData;
  error?: string;
}> {
  try {
    const [acmRes, vpcRes, subRes, sgRes, dirRes, logsRes] = await Promise.all([
      acm
        .send(new ListCertificatesCommand({ CertificateStatuses: ["ISSUED"] }))
        .catch(() => ({ CertificateSummaryList: [] })),
      ec2.send(new DescribeVpcsCommand({})).catch(() => ({ Vpcs: [] })),
      ec2.send(new DescribeSubnetsCommand({})).catch(() => ({ Subnets: [] })),
      ec2.send(new DescribeSecurityGroupsCommand({})).catch(() => ({ SecurityGroups: [] })),
      ds.send(new DescribeDirectoriesCommand({})).catch(() => ({ DirectoryDescriptions: [] })),
      cloudwatchLogs.send(new DescribeLogGroupsCommand({})).catch(() => ({ logGroups: [] })),
    ]);

    const certificates: AcmCertificateOption[] = (acmRes.CertificateSummaryList || []).map((c) => ({
      CertificateArn: c.CertificateArn || "",
      DomainName: c.DomainName || "",
      Status: c.Status,
    }));

    const vpcs = (vpcRes.Vpcs || []).map((v) => ({
      VpcId: v.VpcId || "",
      CidrBlock: v.CidrBlock,
      Name: v.Tags?.find((t) => t.Key === "Name")?.Value,
    }));

    const subnets = (subRes.Subnets || []).map((s) => ({
      SubnetId: s.SubnetId || "",
      VpcId: s.VpcId || "",
      CidrBlock: s.CidrBlock,
      AvailabilityZone: s.AvailabilityZone,
      Name: s.Tags?.find((t) => t.Key === "Name")?.Value,
    }));

    const securityGroups = (sgRes.SecurityGroups || []).map((g) => ({
      GroupId: g.GroupId || "",
      GroupName: g.GroupName,
      VpcId: g.VpcId,
      Description: g.Description,
    }));

    const directories = (dirRes.DirectoryDescriptions || []).map((d) => ({
      DirectoryId: d.DirectoryId || "",
      Name: d.Name,
      Type: d.Type,
    }));

    const logGroups = (logsRes.logGroups || []).map((lg) => ({
      logGroupName: lg.logGroupName || "",
      arn: lg.arn,
    }));

    return {
      success: true,
      data: {
        certificates,
        vpcs,
        subnets,
        securityGroups,
        directories,
        logGroups,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      data: {
        certificates: [],
        vpcs: [],
        subnets: [],
        securityGroups: [],
        directories: [],
        logGroups: [],
      },
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function generateClientVpnConfigurationAction(endpointId: string): Promise<{
  success: boolean;
  filename: string;
  configContent: string;
  error?: string;
}> {
  try {
    const detail = await getClientVpnEndpointDetailAction(endpointId);
    if (!detail.success || !detail.endpoint) {
      throw new Error(detail.error || "Client VPN endpoint not found");
    }

    const ep = detail.endpoint;
    const proto = (ep.TransportProtocol || "udp").toLowerCase();
    const port = ep.VpnPort || 443;
    const dns = ep.DnsName || `${ep.ClientVpnEndpointId}.prod.clientvpn.us-east-1.amazonaws.com`;

    const configContent = `##############################################
# AWS Client VPN Configuration (.ovpn)
# Endpoint ID: ${ep.ClientVpnEndpointId}
# Generated for OpenVPN Client compatibility
##############################################
client
dev tun
proto ${proto}
remote ${dns} ${port}
remote-random-hostname
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-GCM
auth SHA256
reneg-sec 0

<ca>
-----BEGIN CERTIFICATE-----
MIIB/zCCAaWgAwIBAgIUEMULATOR46BF1B4915F90001MA0GCSqGSIb3DQEBCwUA
MDMxGTAXBgNVBAMTEGF3cy1lbXVsYXRvci1yb290MRYwFAYDVQQKEw1BV1MgRW11
bGF0b3IgQ0EwHhcNMjYwMTAxMDAwMDAwWhcNMzYwMTAxMDAwMDAwWjAzMRkwFwYD
VQQDExBhd3MtZW11bGF0b3Itcm9vdDEWMBQGA1UEChMNQVdTIEVtdWxhdG9yIENB
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1vC9x81a179c323f4a9b
87123abcdef890123456789abcdef0123456789abcdef0123456789abcdef0123
456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123
-----END CERTIFICATE-----
</ca>
`;

    return {
      success: true,
      filename: `downloaded-client-config-${ep.ClientVpnEndpointId}.ovpn`,
      configContent,
    };
  } catch (err: unknown) {
    return {
      success: false,
      filename: "client-config.ovpn",
      configContent: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
