"use server";

/**
 * src/app/vpc/actions.ts
 * Server actions for Amazon Virtual Private Cloud (Amazon VPC) interacting
 * server-side with the AWS Emulator via @aws-sdk/client-ec2 in lib/aws.ts.
 */

import { ec2 } from "@/lib/aws";
import {
  DescribeVpcsCommand,
  CreateVpcCommand,
  DeleteVpcCommand,
  DescribeVpcAttributeCommand,
  ModifyVpcAttributeCommand,
  DescribeSubnetsCommand,
  CreateSubnetCommand,
  DeleteSubnetCommand,
  ModifySubnetAttributeCommand,
  DescribeRouteTablesCommand,
  CreateRouteTableCommand,
  DeleteRouteTableCommand,
  AssociateRouteTableCommand,
  DisassociateRouteTableCommand,
  CreateRouteCommand,
  DeleteRouteCommand,
  DescribeInternetGatewaysCommand,
  CreateInternetGatewayCommand,
  AttachInternetGatewayCommand,
  DetachInternetGatewayCommand,
  DeleteInternetGatewayCommand,
  DescribeNatGatewaysCommand,
  CreateNatGatewayCommand,
  DeleteNatGatewayCommand,
  DescribeSecurityGroupsCommand,
  CreateSecurityGroupCommand,
  DeleteSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  RevokeSecurityGroupIngressCommand,
  AuthorizeSecurityGroupEgressCommand,
  RevokeSecurityGroupEgressCommand,
  DescribeNetworkAclsCommand,
  CreateNetworkAclCommand,
  DeleteNetworkAclCommand,
  CreateNetworkAclEntryCommand,
  DeleteNetworkAclEntryCommand,
  DescribeAddressesCommand,
  AllocateAddressCommand,
  ReleaseAddressCommand,
  AssociateAddressCommand,
  DisassociateAddressCommand,
  DescribeVpcEndpointsCommand,
  CreateVpcEndpointCommand,
  DeleteVpcEndpointsCommand,
  DescribeVpcPeeringConnectionsCommand,
  CreateVpcPeeringConnectionCommand,
  AcceptVpcPeeringConnectionCommand,
  RejectVpcPeeringConnectionCommand,
  DeleteVpcPeeringConnectionCommand,
  DescribeDhcpOptionsCommand,
  CreateDhcpOptionsCommand,
  AssociateDhcpOptionsCommand,
  DeleteDhcpOptionsCommand,
} from "@aws-sdk/client-ec2";

// Helper to extract tag value
function getTag(tags: { Key?: string; Value?: string }[] | undefined, key: string): string | undefined {
  if (!tags) return undefined;
  const match = tags.find((t) => t.Key?.toLowerCase() === key.toLowerCase());
  return match?.Value;
}

// -------------------------------------------------------------
// 1. DATA TYPES
// -------------------------------------------------------------

export interface VpcItem {
  VpcId: string;
  Name?: string;
  State: string;
  CidrBlock: string;
  DhcpOptionsId?: string;
  IsDefault: boolean;
  InstanceTenancy?: string;
  OwnerId?: string;
  CidrBlockAssociationSet?: {
    AssociationId?: string;
    CidrBlock?: string;
    State?: string;
  }[];
  EnableDnsHostnames?: boolean;
  EnableDnsSupport?: boolean;
  Tags?: Record<string, string>;
}

export interface SubnetItem {
  SubnetId: string;
  Name?: string;
  State: string;
  VpcId: string;
  CidrBlock: string;
  AvailabilityZone?: string;
  AvailabilityZoneId?: string;
  AvailableIpAddressCount?: number;
  DefaultForAz?: boolean;
  MapPublicIpOnLaunch?: boolean;
  SubnetArn?: string;
  OwnerId?: string;
  Tags?: Record<string, string>;
}

export interface RouteItem {
  DestinationCidrBlock?: string;
  GatewayId?: string;
  NatGatewayId?: string;
  TransitGatewayId?: string;
  State?: string;
  Origin?: string;
}

export interface RouteTableAssociationItem {
  RouteTableAssociationId: string;
  RouteTableId: string;
  SubnetId?: string;
  Main: boolean;
}

export interface RouteTableItem {
  RouteTableId: string;
  Name?: string;
  VpcId: string;
  IsMain: boolean;
  OwnerId?: string;
  RouteTableArn?: string;
  Routes: RouteItem[];
  Associations: RouteTableAssociationItem[];
  Tags?: Record<string, string>;
}

export interface InternetGatewayItem {
  InternetGatewayId: string;
  Name?: string;
  State: "attached" | "detached";
  VpcId?: string;
  Tags?: Record<string, string>;
}

export interface NatGatewayItem {
  NatGatewayId: string;
  Name?: string;
  State: string;
  SubnetId: string;
  VpcId?: string;
  PublicIp?: string;
  PrivateIp?: string;
  AllocationId?: string;
  CreateTime?: string;
  Tags?: Record<string, string>;
}

export interface SecurityGroupRuleItem {
  IpProtocol?: string;
  FromPort?: number;
  ToPort?: number;
  CidrIpv4?: string;
  Description?: string;
}

export interface SecurityGroupItem {
  GroupId: string;
  GroupName: string;
  Description: string;
  VpcId?: string;
  InboundRulesCount: number;
  OutboundRulesCount: number;
  IpPermissions?: any[];
  IpPermissionsEgress?: any[];
  OwnerId?: string;
  Tags?: Record<string, string>;
}

export interface NetworkAclEntryItem {
  RuleNumber: number;
  Protocol: string;
  RuleAction: "allow" | "deny";
  Egress: boolean;
  CidrBlock?: string;
  PortRange?: {
    From?: number;
    To?: number;
  };
}

export interface NetworkAclItem {
  NetworkAclId: string;
  Name?: string;
  VpcId: string;
  IsDefault: boolean;
  Entries: NetworkAclEntryItem[];
  AssociationsCount: number;
  Associations?: { NetworkAclAssociationId?: string; SubnetId?: string }[];
  Tags?: Record<string, string>;
}

export interface ElasticIpItem {
  AllocationId: string;
  PublicIp: string;
  Domain: string;
  InstanceId?: string;
  AssociationId?: string;
  NetworkInterfaceId?: string;
  PrivateIpAddress?: string;
  NetworkBorderGroup?: string;
  Tags?: Record<string, string>;
}

export interface VpcEndpointItem {
  VpcEndpointId: string;
  ServiceName: string;
  VpcEndpointType: "Gateway" | "Interface";
  VpcId: string;
  State: string;
  RouteTableIds?: string[];
  SubnetIds?: string[];
  Groups?: { GroupId: string; GroupName: string }[];
  CreationTimestamp?: string;
  Tags?: Record<string, string>;
}

export interface PeeringConnectionItem {
  VpcPeeringConnectionId: string;
  Status: string;
  RequesterVpcId: string;
  RequesterCidr?: string;
  AccepterVpcId: string;
  AccepterCidr?: string;
  Tags?: Record<string, string>;
}

export interface DhcpOptionsItem {
  DhcpOptionsId: string;
  DomainName?: string;
  DomainNameServers?: string[];
  NtpServers?: string[];
  Tags?: Record<string, string>;
}

export interface VpcDashboardStats {
  vpcsCount: number;
  subnetsCount: number;
  routeTablesCount: number;
  internetGatewaysCount: number;
  natGatewaysCount: number;
  elasticIpsCount: number;
  endpointsCount: number;
  securityGroupsCount: number;
  networkAclsCount: number;
  peeringConnectionsCount: number;
  dhcpOptionsCount: number;
}

// -------------------------------------------------------------
// 2. DASHBOARD ACTIONS
// -------------------------------------------------------------

export async function getVpcDashboardStatsAction(): Promise<{
  success: boolean;
  stats: VpcDashboardStats;
  error?: string;
}> {
  try {
    const [
      vpcsRes,
      subnetsRes,
      rtbsRes,
      igwsRes,
      natsRes,
      eipsRes,
      vpcesRes,
      sgsRes,
      naclsRes,
      peersRes,
      dhcpsRes,
    ] = await Promise.allSettled([
      ec2.send(new DescribeVpcsCommand({})),
      ec2.send(new DescribeSubnetsCommand({})),
      ec2.send(new DescribeRouteTablesCommand({})),
      ec2.send(new DescribeInternetGatewaysCommand({})),
      ec2.send(new DescribeNatGatewaysCommand({})),
      ec2.send(new DescribeAddressesCommand({})),
      ec2.send(new DescribeVpcEndpointsCommand({})),
      ec2.send(new DescribeSecurityGroupsCommand({})),
      ec2.send(new DescribeNetworkAclsCommand({})),
      ec2.send(new DescribeVpcPeeringConnectionsCommand({})),
      ec2.send(new DescribeDhcpOptionsCommand({})),
    ]);

    const stats: VpcDashboardStats = {
      vpcsCount: vpcsRes.status === "fulfilled" ? vpcsRes.value.Vpcs?.length || 0 : 0,
      subnetsCount: subnetsRes.status === "fulfilled" ? subnetsRes.value.Subnets?.length || 0 : 0,
      routeTablesCount: rtbsRes.status === "fulfilled" ? rtbsRes.value.RouteTables?.length || 0 : 0,
      internetGatewaysCount: igwsRes.status === "fulfilled" ? igwsRes.value.InternetGateways?.length || 0 : 0,
      natGatewaysCount: natsRes.status === "fulfilled" ? natsRes.value.NatGateways?.filter((n) => n.State !== "deleted").length || 0 : 0,
      elasticIpsCount: eipsRes.status === "fulfilled" ? eipsRes.value.Addresses?.length || 0 : 0,
      endpointsCount: vpcesRes.status === "fulfilled" ? vpcesRes.value.VpcEndpoints?.length || 0 : 0,
      securityGroupsCount: sgsRes.status === "fulfilled" ? sgsRes.value.SecurityGroups?.length || 0 : 0,
      networkAclsCount: naclsRes.status === "fulfilled" ? naclsRes.value.NetworkAcls?.length || 0 : 0,
      peeringConnectionsCount: peersRes.status === "fulfilled" ? peersRes.value.VpcPeeringConnections?.length || 0 : 0,
      dhcpOptionsCount: dhcpsRes.status === "fulfilled" ? dhcpsRes.value.DhcpOptions?.length || 0 : 0,
    };

    return { success: true, stats };
  } catch (err: unknown) {
    return {
      success: false,
      stats: {
        vpcsCount: 0,
        subnetsCount: 0,
        routeTablesCount: 0,
        internetGatewaysCount: 0,
        natGatewaysCount: 0,
        elasticIpsCount: 0,
        endpointsCount: 0,
        securityGroupsCount: 0,
        networkAclsCount: 0,
        peeringConnectionsCount: 0,
        dhcpOptionsCount: 0,
      },
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// -------------------------------------------------------------
// 3. VPCs ACTIONS
// -------------------------------------------------------------

export async function listVpcsAction(): Promise<{
  success: boolean;
  vpcs: VpcItem[];
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeVpcsCommand({}));
    const vpcs: VpcItem[] = await Promise.all(
      (res.Vpcs || []).map(async (v) => {
        const vpcId = v.VpcId || "";
        const tagsMap: Record<string, string> = {};
        v.Tags?.forEach((t) => {
          if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
        });

        let enableDnsHostnames = true;
        let enableDnsSupport = true;
        try {
          const [hostRes, supRes] = await Promise.all([
            ec2.send(new DescribeVpcAttributeCommand({ VpcId: vpcId, Attribute: "enableDnsHostnames" })),
            ec2.send(new DescribeVpcAttributeCommand({ VpcId: vpcId, Attribute: "enableDnsSupport" })),
          ]);
          enableDnsHostnames = hostRes.EnableDnsHostnames?.Value ?? true;
          enableDnsSupport = supRes.EnableDnsSupport?.Value ?? true;
        } catch {
          // If attributes query not supported, retain defaults
        }

        return {
          VpcId: vpcId,
          Name: getTag(v.Tags, "Name"),
          State: v.State || "available",
          CidrBlock: v.CidrBlock || "",
          DhcpOptionsId: v.DhcpOptionsId,
          IsDefault: v.IsDefault || false,
          InstanceTenancy: v.InstanceTenancy,
          OwnerId: v.OwnerId,
          CidrBlockAssociationSet: v.CidrBlockAssociationSet?.map((c) => ({
            AssociationId: c.AssociationId,
            CidrBlock: c.CidrBlock,
            State: c.CidrBlockState?.State,
          })),
          EnableDnsHostnames: enableDnsHostnames,
          EnableDnsSupport: enableDnsSupport,
          Tags: tagsMap,
        };
      })
    );

    return { success: true, vpcs };
  } catch (err: unknown) {
    return {
      success: false,
      vpcs: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createVpcAction(data: {
  cidrBlock: string;
  name?: string;
  tenancy?: "default" | "dedicated";
  tags?: Record<string, string>;
}): Promise<{ success: boolean; vpcId?: string; error?: string }> {
  try {
    const tagList: { Key: string; Value: string }[] = [];
    if (data.name?.trim()) {
      tagList.push({ Key: "Name", Value: data.name.trim() });
    }
    if (data.tags) {
      Object.entries(data.tags).forEach(([k, v]) => {
        if (k && v && k.toLowerCase() !== "name") tagList.push({ Key: k, Value: v });
      });
    }

    const res = await ec2.send(
      new CreateVpcCommand({
        CidrBlock: data.cidrBlock.trim(),
        InstanceTenancy: data.tenancy || "default",
        TagSpecifications: tagList.length > 0 ? [{ ResourceType: "vpc", Tags: tagList }] : undefined,
      })
    );

    const vpcId = res.Vpc?.VpcId;
    return { success: true, vpcId };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createVpcAndMoreAction(data: {
  name: string;
  cidrBlock: string;
  publicSubnetsCount: number;
  privateSubnetsCount: number;
  availabilityZones: string[];
}): Promise<{ success: boolean; vpcId?: string; error?: string }> {
  try {
    // 1. Create VPC
    const vpcRes = await ec2.send(
      new CreateVpcCommand({
        CidrBlock: data.cidrBlock.trim(),
        TagSpecifications: [{ ResourceType: "vpc", Tags: [{ Key: "Name", Value: data.name }] }],
      })
    );
    const vpcId = vpcRes.Vpc?.VpcId;
    if (!vpcId) throw new Error("Failed to create VPC");

    // 2. Create Internet Gateway and attach
    const igwRes = await ec2.send(
      new CreateInternetGatewayCommand({
        TagSpecifications: [{ ResourceType: "internet-gateway", Tags: [{ Key: "Name", Value: `${data.name}-igw` }] }],
      })
    );
    const igwId = igwRes.InternetGateway?.InternetGatewayId;
    if (igwId) {
      await ec2.send(new AttachInternetGatewayCommand({ InternetGatewayId: igwId, VpcId: vpcId }));
    }

    // 3. Create public route table with default route to IGW
    const rtbRes = await ec2.send(
      new CreateRouteTableCommand({
        VpcId: vpcId,
        TagSpecifications: [{ ResourceType: "route-table", Tags: [{ Key: "Name", Value: `${data.name}-rtb-public` }] }],
      })
    );
    const rtbId = rtbRes.RouteTable?.RouteTableId;
    if (rtbId && igwId) {
      await ec2.send(
        new CreateRouteCommand({
          RouteTableId: rtbId,
          DestinationCidrBlock: "0.0.0.0/0",
          GatewayId: igwId,
        })
      ).catch(() => {});
    }

    // 4. Create subnets
    const baseCidrParts = data.cidrBlock.split(".");
    const p1 = baseCidrParts[0];
    const p2 = baseCidrParts[1];

    let subnetCounter = 1;

    // Public subnets
    for (let i = 0; i < data.publicSubnetsCount; i++) {
      const az = data.availabilityZones[i % data.availabilityZones.length] || "us-east-1a";
      const subCidr = `${p1}.${p2}.${subnetCounter}.0/24`;
      subnetCounter++;
      const subRes = await ec2.send(
        new CreateSubnetCommand({
          VpcId: vpcId,
          CidrBlock: subCidr,
          AvailabilityZone: az,
          TagSpecifications: [{ ResourceType: "subnet", Tags: [{ Key: "Name", Value: `${data.name}-subnet-public${i + 1}-${az}` }] }],
        })
      );
      const subId = subRes.Subnet?.SubnetId;
      if (subId && rtbId) {
        await ec2.send(new AssociateRouteTableCommand({ RouteTableId: rtbId, SubnetId: subId })).catch(() => {});
      }
    }

    // Private subnets & private route tables
    const privateRtbIds: string[] = [];
    for (let i = 0; i < data.privateSubnetsCount; i++) {
      const az = data.availabilityZones[i % data.availabilityZones.length] || "us-east-1a";
      const subCidr = `${p1}.${p2}.${subnetCounter}.0/24`;
      subnetCounter++;
      
      // Dedicated route table for private subnet
      const privRtbRes = await ec2.send(
        new CreateRouteTableCommand({
          VpcId: vpcId,
          TagSpecifications: [{ ResourceType: "route-table", Tags: [{ Key: "Name", Value: `${data.name}-rtb-private${i + 1}-${az}` }] }],
        })
      );
      const privRtbId = privRtbRes.RouteTable?.RouteTableId;
      if (privRtbId) {
        privateRtbIds.push(privRtbId);
      }

      const subRes = await ec2.send(
        new CreateSubnetCommand({
          VpcId: vpcId,
          CidrBlock: subCidr,
          AvailabilityZone: az,
          TagSpecifications: [{ ResourceType: "subnet", Tags: [{ Key: "Name", Value: `${data.name}-subnet-private${i + 1}-${az}` }] }],
        })
      );
      const subId = subRes.Subnet?.SubnetId;
      if (subId && privRtbId) {
        await ec2.send(new AssociateRouteTableCommand({ RouteTableId: privRtbId, SubnetId: subId })).catch(() => {});
      }
    }

    // Optional Gateway Endpoint for S3 on private route tables
    if (privateRtbIds.length > 0) {
      await ec2.send(
        new CreateVpcEndpointCommand({
          VpcId: vpcId,
          ServiceName: "com.amazonaws.us-east-1.s3",
          VpcEndpointType: "Gateway",
          RouteTableIds: privateRtbIds,
          TagSpecifications: [{ ResourceType: "vpc-endpoint", Tags: [{ Key: "Name", Value: `${data.name}-vpce-s3` }] }],
        })
      ).catch(() => {});
    }

    return { success: true, vpcId };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteVpcAction(vpcId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeleteVpcCommand({ VpcId: vpcId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function modifyVpcAttributeAction(
  vpcId: string,
  attribute: "enableDnsHostnames" | "enableDnsSupport",
  value: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    if (attribute === "enableDnsHostnames") {
      await ec2.send(new ModifyVpcAttributeCommand({ VpcId: vpcId, EnableDnsHostnames: { Value: value } }));
    } else {
      await ec2.send(new ModifyVpcAttributeCommand({ VpcId: vpcId, EnableDnsSupport: { Value: value } }));
    }
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// -------------------------------------------------------------
// 4. SUBNETS ACTIONS
// -------------------------------------------------------------

export async function listSubnetsAction(vpcId?: string): Promise<{
  success: boolean;
  subnets: SubnetItem[];
  error?: string;
}> {
  try {
    const filters = vpcId ? [{ Name: "vpc-id", Values: [vpcId] }] : undefined;
    const res = await ec2.send(new DescribeSubnetsCommand({ Filters: filters }));

    const subnets: SubnetItem[] = (res.Subnets || []).map((s) => {
      const tagsMap: Record<string, string> = {};
      s.Tags?.forEach((t) => {
        if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
      });

      return {
        SubnetId: s.SubnetId || "",
        Name: getTag(s.Tags, "Name"),
        State: s.State || "available",
        VpcId: s.VpcId || "",
        CidrBlock: s.CidrBlock || "",
        AvailabilityZone: s.AvailabilityZone,
        AvailabilityZoneId: s.AvailabilityZoneId,
        AvailableIpAddressCount: s.AvailableIpAddressCount,
        DefaultForAz: s.DefaultForAz || false,
        MapPublicIpOnLaunch: s.MapPublicIpOnLaunch || false,
        SubnetArn: s.SubnetArn,
        OwnerId: s.OwnerId,
        Tags: tagsMap,
      };
    });

    return { success: true, subnets };
  } catch (err: unknown) {
    return {
      success: false,
      subnets: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createSubnetAction(data: {
  vpcId: string;
  cidrBlock: string;
  availabilityZone?: string;
  name?: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; subnetId?: string; error?: string }> {
  try {
    const tagList: { Key: string; Value: string }[] = [];
    if (data.name?.trim()) tagList.push({ Key: "Name", Value: data.name.trim() });
    if (data.tags) {
      Object.entries(data.tags).forEach(([k, v]) => {
        if (k && v && k.toLowerCase() !== "name") tagList.push({ Key: k, Value: v });
      });
    }

    const res = await ec2.send(
      new CreateSubnetCommand({
        VpcId: data.vpcId,
        CidrBlock: data.cidrBlock.trim(),
        AvailabilityZone: data.availabilityZone,
        TagSpecifications: tagList.length > 0 ? [{ ResourceType: "subnet", Tags: tagList }] : undefined,
      })
    );

    return { success: true, subnetId: res.Subnet?.SubnetId };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteSubnetAction(subnetId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeleteSubnetCommand({ SubnetId: subnetId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function modifySubnetAttributeAction(
  subnetId: string,
  mapPublicIp: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new ModifySubnetAttributeCommand({
        SubnetId: subnetId,
        MapPublicIpOnLaunch: { Value: mapPublicIp },
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

export async function getSubnetDetailAction(subnetId: string): Promise<{
  success: boolean;
  subnet?: SubnetItem;
  routeTable?: RouteTableItem;
  networkAcl?: NetworkAclItem;
  allRouteTables?: RouteTableItem[];
  vpc?: VpcItem;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: [subnetId] }));
    const s = res.Subnets?.[0];
    if (!s) {
      return { success: false, error: `Subnet ${subnetId} not found` };
    }

    const tagsMap: Record<string, string> = {};
    s.Tags?.forEach((t) => {
      if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
    });

    const subnet: SubnetItem = {
      SubnetId: s.SubnetId || "",
      Name: getTag(s.Tags, "Name"),
      State: s.State || "available",
      VpcId: s.VpcId || "",
      CidrBlock: s.CidrBlock || "",
      AvailabilityZone: s.AvailabilityZone,
      AvailabilityZoneId: s.AvailabilityZoneId,
      AvailableIpAddressCount: s.AvailableIpAddressCount,
      DefaultForAz: s.DefaultForAz || false,
      MapPublicIpOnLaunch: s.MapPublicIpOnLaunch || false,
      SubnetArn: s.SubnetArn,
      OwnerId: s.OwnerId,
      Tags: tagsMap,
    };

    const [rtbsRes, naclsRes, vpcsRes] = await Promise.all([
      listRouteTablesAction(subnet.VpcId),
      listNetworkAclsAction(subnet.VpcId),
      listVpcsAction(),
    ]);

    const allRouteTables = rtbsRes.success ? rtbsRes.routeTables : [];
    const explicitRtb = allRouteTables.find((r) =>
      r.Associations?.some((a) => a.SubnetId === subnetId)
    );
    const mainRtb = allRouteTables.find((r) => r.IsMain) || allRouteTables[0];
    const routeTable = explicitRtb || mainRtb;

    const allNacls = naclsRes.success ? naclsRes.networkAcls : [];
    const explicitNacl = allNacls.find((n) =>
      n.Associations?.some((a) => a.SubnetId === subnetId)
    );
    const defaultNacl = allNacls.find((n) => n.IsDefault) || allNacls[0];
    const networkAcl = explicitNacl || defaultNacl;

    const vpc = vpcsRes.success ? vpcsRes.vpcs.find((v) => v.VpcId === subnet.VpcId) : undefined;

    return {
      success: true,
      subnet,
      routeTable,
      networkAcl,
      allRouteTables,
      vpc,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// -------------------------------------------------------------
// 5. ROUTE TABLES ACTIONS
// -------------------------------------------------------------

export async function listRouteTablesAction(vpcId?: string): Promise<{
  success: boolean;
  routeTables: RouteTableItem[];
  error?: string;
}> {
  try {
    const filters = vpcId ? [{ Name: "vpc-id", Values: [vpcId] }] : undefined;
    const res = await ec2.send(new DescribeRouteTablesCommand({ Filters: filters }));

    const routeTables: RouteTableItem[] = (res.RouteTables || []).map((rt) => {
      const tagsMap: Record<string, string> = {};
      rt.Tags?.forEach((t) => {
        if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
      });

      const isMain = rt.Associations?.some((a) => a.Main) || false;

      return {
        RouteTableId: rt.RouteTableId || "",
        Name: getTag(rt.Tags, "Name"),
        VpcId: rt.VpcId || "",
        IsMain: isMain,
        OwnerId: rt.OwnerId,
        RouteTableArn: `arn:aws:ec2:us-east-1:${rt.OwnerId || "000000000000"}:route-table/${rt.RouteTableId}`,
        Routes: (rt.Routes || []).map((r) => ({
          DestinationCidrBlock: r.DestinationCidrBlock,
          GatewayId: r.GatewayId,
          NatGatewayId: r.NatGatewayId,
          TransitGatewayId: r.TransitGatewayId,
          State: r.State,
          Origin: r.Origin,
        })),
        Associations: (rt.Associations || []).map((a) => ({
          RouteTableAssociationId: a.RouteTableAssociationId || "",
          RouteTableId: a.RouteTableId || "",
          SubnetId: a.SubnetId,
          Main: a.Main || false,
        })),
        Tags: tagsMap,
      };
    });

    return { success: true, routeTables };
  } catch (err: unknown) {
    return {
      success: false,
      routeTables: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createRouteTableAction(data: {
  vpcId: string;
  name?: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; routeTableId?: string; error?: string }> {
  try {
    const tagList: { Key: string; Value: string }[] = [];
    if (data.name?.trim()) tagList.push({ Key: "Name", Value: data.name.trim() });
    if (data.tags) {
      Object.entries(data.tags).forEach(([k, v]) => {
        if (k && v && k.toLowerCase() !== "name") tagList.push({ Key: k, Value: v });
      });
    }

    const res = await ec2.send(
      new CreateRouteTableCommand({
        VpcId: data.vpcId,
        TagSpecifications: tagList.length > 0 ? [{ ResourceType: "route-table", Tags: tagList }] : undefined,
      })
    );

    return { success: true, routeTableId: res.RouteTable?.RouteTableId };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteRouteTableAction(routeTableId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeleteRouteTableCommand({ RouteTableId: routeTableId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function associateRouteTableAction(
  routeTableId: string,
  subnetId: string
): Promise<{ success: boolean; associationId?: string; error?: string }> {
  try {
    const res = await ec2.send(new AssociateRouteTableCommand({ RouteTableId: routeTableId, SubnetId: subnetId }));
    return { success: true, associationId: res.AssociationId };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function disassociateRouteTableAction(
  associationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DisassociateRouteTableCommand({ AssociationId: associationId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createRouteAction(data: {
  routeTableId: string;
  destinationCidrBlock: string;
  gatewayId?: string;
  natGatewayId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new CreateRouteCommand({
        RouteTableId: data.routeTableId,
        DestinationCidrBlock: data.destinationCidrBlock,
        GatewayId: data.gatewayId,
        NatGatewayId: data.natGatewayId,
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

export async function deleteRouteAction(
  routeTableId: string,
  destinationCidrBlock: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeleteRouteCommand({ RouteTableId: routeTableId, DestinationCidrBlock: destinationCidrBlock }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getRouteTableDetailAction(routeTableId: string): Promise<{
  success: boolean;
  routeTable?: RouteTableItem;
  associatedSubnets?: SubnetItem[];
  unassociatedSubnets?: SubnetItem[];
  allSubnets?: SubnetItem[];
  internetGateways?: InternetGatewayItem[];
  natGateways?: NatGatewayItem[];
  endpoints?: VpcEndpointItem[];
  vpc?: VpcItem;
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeRouteTablesCommand({ RouteTableIds: [routeTableId] }));
    const rt = res.RouteTables?.[0];
    if (!rt) {
      return { success: false, error: `Route Table ${routeTableId} not found` };
    }

    const tagsMap: Record<string, string> = {};
    rt.Tags?.forEach((t) => {
      if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
    });

    const isMain = rt.Associations?.some((a) => a.Main) || false;

    const routeTable: RouteTableItem = {
      RouteTableId: rt.RouteTableId || "",
      Name: getTag(rt.Tags, "Name"),
      VpcId: rt.VpcId || "",
      IsMain: isMain,
      OwnerId: rt.OwnerId,
      RouteTableArn: `arn:aws:ec2:us-east-1:${rt.OwnerId || "000000000000"}:route-table/${rt.RouteTableId}`,
      Routes: (rt.Routes || []).map((r) => ({
        DestinationCidrBlock: r.DestinationCidrBlock,
        GatewayId: r.GatewayId,
        NatGatewayId: r.NatGatewayId,
        TransitGatewayId: r.TransitGatewayId,
        State: r.State,
        Origin: r.Origin,
      })),
      Associations: (rt.Associations || []).map((a) => ({
        RouteTableAssociationId: a.RouteTableAssociationId || "",
        RouteTableId: a.RouteTableId || "",
        SubnetId: a.SubnetId,
        Main: a.Main || false,
      })),
      Tags: tagsMap,
    };

    const [subsRes, igwsRes, natsRes, epsRes, vpcsRes] = await Promise.all([
      listSubnetsAction(routeTable.VpcId),
      listInternetGatewaysAction(),
      listNatGatewaysAction(routeTable.VpcId),
      listVpcEndpointsAction(routeTable.VpcId),
      listVpcsAction(),
    ]);

    const allSubnets = subsRes.success ? subsRes.subnets : [];
    const explicitSubIds = new Set(
      routeTable.Associations.filter((a) => a.SubnetId).map((a) => a.SubnetId!)
    );
    const associatedSubnets = allSubnets.filter((s) => explicitSubIds.has(s.SubnetId));
    const unassociatedSubnets = allSubnets.filter((s) => !explicitSubIds.has(s.SubnetId));
    const vpc = vpcsRes.success ? vpcsRes.vpcs.find((v) => v.VpcId === routeTable.VpcId) : undefined;

    return {
      success: true,
      routeTable,
      associatedSubnets,
      unassociatedSubnets,
      allSubnets,
      internetGateways: igwsRes.success ? igwsRes.internetGateways : [],
      natGateways: natsRes.success ? natsRes.natGateways : [],
      endpoints: epsRes.success ? epsRes.endpoints : [],
      vpc,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// -------------------------------------------------------------
// 6. INTERNET GATEWAYS ACTIONS
// -------------------------------------------------------------

export async function listInternetGatewaysAction(): Promise<{
  success: boolean;
  internetGateways: InternetGatewayItem[];
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeInternetGatewaysCommand({}));
    const internetGateways: InternetGatewayItem[] = (res.InternetGateways || []).map((igw) => {
      const tagsMap: Record<string, string> = {};
      igw.Tags?.forEach((t) => {
        if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
      });

      const attachment = igw.Attachments?.[0];
      const isAttached = attachment && (attachment.State === "attached" || (attachment.State as string) === "available");

      return {
        InternetGatewayId: igw.InternetGatewayId || "",
        Name: getTag(igw.Tags, "Name"),
        State: isAttached ? "attached" : "detached",
        VpcId: attachment?.VpcId,
        Tags: tagsMap,
      };
    });

    return { success: true, internetGateways };
  } catch (err: unknown) {
    return {
      success: false,
      internetGateways: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createInternetGatewayAction(data: {
  name?: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; internetGatewayId?: string; error?: string }> {
  try {
    const tagList: { Key: string; Value: string }[] = [];
    if (data.name?.trim()) tagList.push({ Key: "Name", Value: data.name.trim() });
    if (data.tags) {
      Object.entries(data.tags).forEach(([k, v]) => {
        if (k && v && k.toLowerCase() !== "name") tagList.push({ Key: k, Value: v });
      });
    }

    const res = await ec2.send(
      new CreateInternetGatewayCommand({
        TagSpecifications: tagList.length > 0 ? [{ ResourceType: "internet-gateway", Tags: tagList }] : undefined,
      })
    );

    return { success: true, internetGatewayId: res.InternetGateway?.InternetGatewayId };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function attachInternetGatewayAction(
  internetGatewayId: string,
  vpcId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new AttachInternetGatewayCommand({ InternetGatewayId: internetGatewayId, VpcId: vpcId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function detachInternetGatewayAction(
  internetGatewayId: string,
  vpcId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DetachInternetGatewayCommand({ InternetGatewayId: internetGatewayId, VpcId: vpcId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteInternetGatewayAction(
  internetGatewayId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeleteInternetGatewayCommand({ InternetGatewayId: internetGatewayId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// -------------------------------------------------------------
// 7. NAT GATEWAYS ACTIONS
// -------------------------------------------------------------

export async function listNatGatewaysAction(vpcId?: string): Promise<{
  success: boolean;
  natGateways: NatGatewayItem[];
  error?: string;
}> {
  try {
    const filters = vpcId ? [{ Name: "vpc-id", Values: [vpcId] }] : undefined;
    const res = await ec2.send(new DescribeNatGatewaysCommand({ Filter: filters }));

    const natGateways: NatGatewayItem[] = (res.NatGateways || [])
      .filter((n) => n.State !== "deleted")
      .map((n) => {
        const tagsMap: Record<string, string> = {};
        n.Tags?.forEach((t) => {
          if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
        });

        const address = n.NatGatewayAddresses?.[0];

        return {
          NatGatewayId: n.NatGatewayId || "",
          Name: getTag(n.Tags, "Name"),
          State: n.State || "available",
          SubnetId: n.SubnetId || "",
          VpcId: n.VpcId,
          PublicIp: address?.PublicIp,
          PrivateIp: address?.PrivateIp,
          AllocationId: address?.AllocationId,
          CreateTime: n.CreateTime ? new Date(n.CreateTime).toISOString() : undefined,
          Tags: tagsMap,
        };
      });

    return { success: true, natGateways };
  } catch (err: unknown) {
    return {
      success: false,
      natGateways: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createNatGatewayAction(data: {
  subnetId: string;
  allocationId?: string;
  connectivityType?: "public" | "private";
  name?: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; natGatewayId?: string; error?: string }> {
  try {
    const tagList: { Key: string; Value: string }[] = [];
    if (data.name?.trim()) tagList.push({ Key: "Name", Value: data.name.trim() });
    if (data.tags) {
      Object.entries(data.tags).forEach(([k, v]) => {
        if (k && v && k.toLowerCase() !== "name") tagList.push({ Key: k, Value: v });
      });
    }

    const res = await ec2.send(
      new CreateNatGatewayCommand({
        SubnetId: data.subnetId,
        AllocationId: data.allocationId || undefined,
        ConnectivityType: data.connectivityType,
        TagSpecifications: tagList.length > 0 ? [{ ResourceType: "natgateway", Tags: tagList }] : undefined,
      })
    );

    return { success: true, natGatewayId: res.NatGateway?.NatGatewayId };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteNatGatewayAction(natGatewayId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeleteNatGatewayCommand({ NatGatewayId: natGatewayId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// -------------------------------------------------------------
// 8. SECURITY GROUPS ACTIONS
// -------------------------------------------------------------

export async function listSecurityGroupsAction(vpcId?: string): Promise<{
  success: boolean;
  securityGroups: SecurityGroupItem[];
  error?: string;
}> {
  try {
    const filters = vpcId ? [{ Name: "vpc-id", Values: [vpcId] }] : undefined;
    const res = await ec2.send(new DescribeSecurityGroupsCommand({ Filters: filters }));

    const securityGroups: SecurityGroupItem[] = (res.SecurityGroups || []).map((sg) => {
      const tagsMap: Record<string, string> = {};
      sg.Tags?.forEach((t) => {
        if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
      });

      return {
        GroupId: sg.GroupId || "",
        GroupName: sg.GroupName || "",
        Description: sg.Description || "",
        VpcId: sg.VpcId,
        InboundRulesCount: sg.IpPermissions?.length || 0,
        OutboundRulesCount: sg.IpPermissionsEgress?.length || 0,
        IpPermissions: sg.IpPermissions,
        IpPermissionsEgress: sg.IpPermissionsEgress,
        OwnerId: sg.OwnerId,
        Tags: tagsMap,
      };
    });

    return { success: true, securityGroups };
  } catch (err: unknown) {
    return {
      success: false,
      securityGroups: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createSecurityGroupAction(data: {
  groupName: string;
  description: string;
  vpcId: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; groupId?: string; error?: string }> {
  try {
    const tagList: { Key: string; Value: string }[] = [{ Key: "Name", Value: data.groupName.trim() }];
    if (data.tags) {
      Object.entries(data.tags).forEach(([k, v]) => {
        if (k && v && k.toLowerCase() !== "name") tagList.push({ Key: k, Value: v });
      });
    }

    const res = await ec2.send(
      new CreateSecurityGroupCommand({
        GroupName: data.groupName.trim(),
        Description: data.description.trim(),
        VpcId: data.vpcId,
        TagSpecifications: [{ ResourceType: "security-group", Tags: tagList }],
      })
    );

    return { success: true, groupId: res.GroupId };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteSecurityGroupAction(groupId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeleteSecurityGroupCommand({ GroupId: groupId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function authorizeSecurityGroupIngressAction(
  groupId: string,
  ipPermissions: any[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new AuthorizeSecurityGroupIngressCommand({ GroupId: groupId, IpPermissions: ipPermissions }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function revokeSecurityGroupIngressAction(
  groupId: string,
  ipPermissions: any[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new RevokeSecurityGroupIngressCommand({ GroupId: groupId, IpPermissions: ipPermissions }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// -------------------------------------------------------------
// 9. NETWORK ACLs ACTIONS
// -------------------------------------------------------------

export async function listNetworkAclsAction(vpcId?: string): Promise<{
  success: boolean;
  networkAcls: NetworkAclItem[];
  error?: string;
}> {
  try {
    const filters = vpcId ? [{ Name: "vpc-id", Values: [vpcId] }] : undefined;
    const res = await ec2.send(new DescribeNetworkAclsCommand({ Filters: filters }));

    const networkAcls: NetworkAclItem[] = (res.NetworkAcls || []).map((acl) => {
      const tagsMap: Record<string, string> = {};
      acl.Tags?.forEach((t) => {
        if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
      });

      return {
        NetworkAclId: acl.NetworkAclId || "",
        Name: getTag(acl.Tags, "Name"),
        VpcId: acl.VpcId || "",
        IsDefault: acl.IsDefault || false,
        Entries: (acl.Entries || []).map((e) => ({
          RuleNumber: e.RuleNumber || 0,
          Protocol: e.Protocol || "-1",
          RuleAction: (e.RuleAction as "allow" | "deny") || "allow",
          Egress: e.Egress || false,
          CidrBlock: e.CidrBlock,
          PortRange: e.PortRange ? { From: e.PortRange.From, To: e.PortRange.To } : undefined,
        })),
        AssociationsCount: acl.Associations?.length || 0,
        Associations: (acl.Associations || []).map((a) => ({
          NetworkAclAssociationId: a.NetworkAclAssociationId,
          SubnetId: a.SubnetId,
        })),
        Tags: tagsMap,
      };
    });

    return { success: true, networkAcls };
  } catch (err: unknown) {
    return {
      success: false,
      networkAcls: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createNetworkAclAction(data: {
  vpcId: string;
  name?: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; networkAclId?: string; error?: string }> {
  try {
    const tagList: { Key: string; Value: string }[] = [];
    if (data.name?.trim()) tagList.push({ Key: "Name", Value: data.name.trim() });
    if (data.tags) {
      Object.entries(data.tags).forEach(([k, v]) => {
        if (k && v && k.toLowerCase() !== "name") tagList.push({ Key: k, Value: v });
      });
    }

    const res = await ec2.send(
      new CreateNetworkAclCommand({
        VpcId: data.vpcId,
        TagSpecifications: tagList.length > 0 ? [{ ResourceType: "network-acl", Tags: tagList }] : undefined,
      })
    );

    return { success: true, networkAclId: res.NetworkAcl?.NetworkAclId };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteNetworkAclAction(networkAclId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeleteNetworkAclCommand({ NetworkAclId: networkAclId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createNetworkAclEntryAction(data: {
  networkAclId: string;
  ruleNumber: number;
  protocol: string;
  ruleAction: "allow" | "deny";
  egress: boolean;
  cidrBlock: string;
  portRange?: { from?: number; to?: number };
}): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new CreateNetworkAclEntryCommand({
        NetworkAclId: data.networkAclId,
        RuleNumber: data.ruleNumber,
        Protocol: data.protocol,
        RuleAction: data.ruleAction,
        Egress: data.egress,
        CidrBlock: data.cidrBlock,
        PortRange: data.portRange ? { From: data.portRange.from, To: data.portRange.to } : undefined,
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

export async function deleteNetworkAclEntryAction(
  networkAclId: string,
  ruleNumber: number,
  egress: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new DeleteNetworkAclEntryCommand({
        NetworkAclId: networkAclId,
        RuleNumber: ruleNumber,
        Egress: egress,
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

// -------------------------------------------------------------
// 10. ELASTIC IPs ACTIONS
// -------------------------------------------------------------

export async function listElasticIpsAction(): Promise<{
  success: boolean;
  elasticIps: ElasticIpItem[];
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeAddressesCommand({}));
    const elasticIps: ElasticIpItem[] = (res.Addresses || []).map((a) => {
      const tagsMap: Record<string, string> = {};
      a.Tags?.forEach((t) => {
        if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
      });

      return {
        AllocationId: a.AllocationId || "",
        PublicIp: a.PublicIp || "",
        Domain: a.Domain || "vpc",
        InstanceId: a.InstanceId,
        AssociationId: a.AssociationId,
        NetworkInterfaceId: a.NetworkInterfaceId,
        PrivateIpAddress: a.PrivateIpAddress,
        NetworkBorderGroup: a.NetworkBorderGroup,
        Tags: tagsMap,
      };
    });

    return { success: true, elasticIps };
  } catch (err: unknown) {
    return {
      success: false,
      elasticIps: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function allocateElasticIpAction(data?: {
  tags?: Record<string, string>;
}): Promise<{ success: boolean; allocationId?: string; publicIp?: string; error?: string }> {
  try {
    const tagList: { Key: string; Value: string }[] = [];
    if (data?.tags) {
      Object.entries(data.tags).forEach(([k, v]) => {
        if (k && v) tagList.push({ Key: k, Value: v });
      });
    }

    const res = await ec2.send(
      new AllocateAddressCommand({
        Domain: "vpc",
        TagSpecifications: tagList.length > 0 ? [{ ResourceType: "elastic-ip", Tags: tagList }] : undefined,
      })
    );

    return { success: true, allocationId: res.AllocationId, publicIp: res.PublicIp };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function releaseElasticIpAction(allocationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new ReleaseAddressCommand({ AllocationId: allocationId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// -------------------------------------------------------------
// 11. VPC ENDPOINTS ACTIONS
// -------------------------------------------------------------

export async function listVpcEndpointsAction(vpcId?: string): Promise<{
  success: boolean;
  endpoints: VpcEndpointItem[];
  error?: string;
}> {
  try {
    const filters = vpcId ? [{ Name: "vpc-id", Values: [vpcId] }] : undefined;
    const res = await ec2.send(new DescribeVpcEndpointsCommand({ Filters: filters }));

    const endpoints: VpcEndpointItem[] = (res.VpcEndpoints || []).map((e) => {
      const tagsMap: Record<string, string> = {};
      e.Tags?.forEach((t) => {
        if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
      });

      return {
        VpcEndpointId: e.VpcEndpointId || "",
        ServiceName: e.ServiceName || "",
        VpcEndpointType: (e.VpcEndpointType as "Gateway" | "Interface") || "Gateway",
        VpcId: e.VpcId || "",
        State: e.State || "available",
        RouteTableIds: e.RouteTableIds,
        SubnetIds: e.SubnetIds,
        Groups: e.Groups?.map((g) => ({ GroupId: g.GroupId || "", GroupName: g.GroupName || "" })),
        CreationTimestamp: e.CreationTimestamp ? new Date(e.CreationTimestamp).toISOString() : undefined,
        Tags: tagsMap,
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

export async function createVpcEndpointAction(data: {
  vpcId: string;
  serviceName: string;
  vpcEndpointType?: "Gateway" | "Interface";
  routeTableIds?: string[];
  subnetIds?: string[];
  securityGroupIds?: string[];
  name?: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; endpointId?: string; error?: string }> {
  try {
    const tagList: { Key: string; Value: string }[] = [];
    if (data.name?.trim()) tagList.push({ Key: "Name", Value: data.name.trim() });
    if (data.tags) {
      Object.entries(data.tags).forEach(([k, v]) => {
        if (k && v && k.toLowerCase() !== "name") tagList.push({ Key: k, Value: v });
      });
    }

    const res = await ec2.send(
      new CreateVpcEndpointCommand({
        VpcId: data.vpcId,
        ServiceName: data.serviceName,
        VpcEndpointType: data.vpcEndpointType as any,
        RouteTableIds: data.routeTableIds,
        SubnetIds: data.subnetIds,
        SecurityGroupIds: data.securityGroupIds,
        TagSpecifications: tagList.length > 0 ? [{ ResourceType: "vpc-endpoint", Tags: tagList }] : undefined,
      })
    );

    return { success: true, endpointId: res.VpcEndpoint?.VpcEndpointId };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteVpcEndpointsAction(endpointIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeleteVpcEndpointsCommand({ VpcEndpointIds: endpointIds }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// -------------------------------------------------------------
// 12. VPC PEERING CONNECTIONS ACTIONS
// -------------------------------------------------------------

export async function listPeeringConnectionsAction(): Promise<{
  success: boolean;
  peeringConnections: PeeringConnectionItem[];
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeVpcPeeringConnectionsCommand({}));
    const peeringConnections: PeeringConnectionItem[] = (res.VpcPeeringConnections || []).map((p) => {
      const tagsMap: Record<string, string> = {};
      p.Tags?.forEach((t) => {
        if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
      });

      return {
        VpcPeeringConnectionId: p.VpcPeeringConnectionId || "",
        Status: p.Status?.Code || "active",
        RequesterVpcId: p.RequesterVpcInfo?.VpcId || "",
        RequesterCidr: p.RequesterVpcInfo?.CidrBlock,
        AccepterVpcId: p.AccepterVpcInfo?.VpcId || "",
        AccepterCidr: p.AccepterVpcInfo?.CidrBlock,
        Tags: tagsMap,
      };
    });

    return { success: true, peeringConnections };
  } catch (err: unknown) {
    return {
      success: false,
      peeringConnections: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createPeeringConnectionAction(data: {
  vpcId: string;
  peerVpcId: string;
  name?: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; connectionId?: string; error?: string }> {
  try {
    const tagList: { Key: string; Value: string }[] = [];
    if (data.name?.trim()) tagList.push({ Key: "Name", Value: data.name.trim() });
    if (data.tags) {
      Object.entries(data.tags).forEach(([k, v]) => {
        if (k && v && k.toLowerCase() !== "name") tagList.push({ Key: k, Value: v });
      });
    }

    const res = await ec2.send(
      new CreateVpcPeeringConnectionCommand({
        VpcId: data.vpcId,
        PeerVpcId: data.peerVpcId,
        TagSpecifications: tagList.length > 0 ? [{ ResourceType: "vpc-peering-connection", Tags: tagList }] : undefined,
      })
    );

    const connectionId = res.VpcPeeringConnection?.VpcPeeringConnectionId;
    if (connectionId) {
      // In emulator, automatically accept peering connection to facilitate learning
      await ec2.send(new AcceptVpcPeeringConnectionCommand({ VpcPeeringConnectionId: connectionId })).catch(() => {});
    }

    return { success: true, connectionId };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function acceptPeeringConnectionAction(connectionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new AcceptVpcPeeringConnectionCommand({ VpcPeeringConnectionId: connectionId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function rejectPeeringConnectionAction(connectionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new RejectVpcPeeringConnectionCommand({ VpcPeeringConnectionId: connectionId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deletePeeringConnectionAction(connectionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeleteVpcPeeringConnectionCommand({ VpcPeeringConnectionId: connectionId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// -------------------------------------------------------------
// 13. DHCP OPTIONS ACTIONS
// -------------------------------------------------------------

export async function listDhcpOptionsAction(): Promise<{
  success: boolean;
  dhcpOptions: DhcpOptionsItem[];
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeDhcpOptionsCommand({}));
    const dhcpOptions: DhcpOptionsItem[] = (res.DhcpOptions || []).map((d) => {
      const tagsMap: Record<string, string> = {};
      d.Tags?.forEach((t) => {
        if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
      });

      let domainName: string | undefined;
      const dnsServers: string[] = [];
      const ntpServers: string[] = [];

      d.DhcpConfigurations?.forEach((c) => {
        if (c.Key === "domain-name") {
          domainName = c.Values?.[0]?.Value;
        } else if (c.Key === "domain-name-servers") {
          c.Values?.forEach((v) => {
            if (v.Value) dnsServers.push(v.Value);
          });
        } else if (c.Key === "ntp-servers") {
          c.Values?.forEach((v) => {
            if (v.Value) ntpServers.push(v.Value);
          });
        }
      });

      return {
        DhcpOptionsId: d.DhcpOptionsId || "",
        DomainName: domainName,
        DomainNameServers: dnsServers,
        NtpServers: ntpServers,
        Tags: tagsMap,
      };
    });

    return { success: true, dhcpOptions };
  } catch (err: unknown) {
    return {
      success: false,
      dhcpOptions: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createDhcpOptionsAction(data: {
  name?: string;
  domainName?: string;
  domainNameServers?: string[];
  ntpServers?: string[];
  tags?: Record<string, string>;
}): Promise<{ success: boolean; dhcpOptionsId?: string; error?: string }> {
  try {
    const configs: { Key: string; Values: string[] }[] = [];
    if (data.domainName?.trim()) {
      configs.push({ Key: "domain-name", Values: [data.domainName.trim()] });
    }
    if (data.domainNameServers && data.domainNameServers.length > 0) {
      configs.push({ Key: "domain-name-servers", Values: data.domainNameServers.filter(Boolean) });
    }
    if (data.ntpServers && data.ntpServers.length > 0) {
      configs.push({ Key: "ntp-servers", Values: data.ntpServers.filter(Boolean) });
    }

    const tagList: { Key: string; Value: string }[] = [];
    if (data.name?.trim()) tagList.push({ Key: "Name", Value: data.name.trim() });
    if (data.tags) {
      Object.entries(data.tags).forEach(([k, v]) => {
        if (k && v && k.toLowerCase() !== "name") tagList.push({ Key: k, Value: v });
      });
    }

    const res = await ec2.send(
      new CreateDhcpOptionsCommand({
        DhcpConfigurations: configs as any,
        TagSpecifications: tagList.length > 0 ? [{ ResourceType: "dhcp-options", Tags: tagList }] : undefined,
      })
    );

    return { success: true, dhcpOptionsId: res.DhcpOptions?.DhcpOptionsId };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function associateDhcpOptionsAction(
  dhcpOptionsId: string,
  vpcId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new AssociateDhcpOptionsCommand({ DhcpOptionsId: dhcpOptionsId, VpcId: vpcId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteDhcpOptionsAction(dhcpOptionsId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(new DeleteDhcpOptionsCommand({ DhcpOptionsId: dhcpOptionsId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
