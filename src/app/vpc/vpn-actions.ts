"use server";

import { ec2 } from "@/lib/aws";
import {
  DescribeCustomerGatewaysCommand,
  CreateCustomerGatewayCommand,
  DeleteCustomerGatewayCommand,
  DescribeVpnGatewaysCommand,
  CreateVpnGatewayCommand,
  AttachVpnGatewayCommand,
  DetachVpnGatewayCommand,
  DeleteVpnGatewayCommand,
  DescribeVpnConnectionsCommand,
  CreateVpnConnectionCommand,
  DeleteVpnConnectionCommand,
  CreateVpnConnectionRouteCommand,
  DeleteVpnConnectionRouteCommand,
  DescribeVpcsCommand,
  DescribeTransitGatewaysCommand,
  Tag,
} from "@aws-sdk/client-ec2";

function getTag(tags: Tag[] | undefined, key: string): string | undefined {
  return tags?.find((t) => t.Key?.toLowerCase() === key.toLowerCase())?.Value;
}

// ----------------------------------------------------------------------
// Interfaces
// ----------------------------------------------------------------------

export interface CustomerGatewayItem {
  CustomerGatewayId: string;
  State: string;
  Type: string;
  IpAddress: string;
  BgpAsn: number;
  CertificateArn?: string;
  DeviceName?: string;
  Name?: string;
  Tags?: Record<string, string>;
}

export interface VirtualPrivateGatewayItem {
  VpnGatewayId: string;
  State: string;
  Type: string;
  AmazonSideAsn: number;
  VpcAttachments: { VpcId: string; State: string }[];
  AttachedVpcId?: string;
  Name?: string;
  Tags?: Record<string, string>;
}

export interface VpnTunnelTelemetryItem {
  OutsideIpAddress?: string;
  Status?: "UP" | "DOWN" | string;
  StatusMessage?: string;
  AcceptedRouteCount?: number;
  LastStatusChange?: string;
}

export interface VpnConnectionItem {
  VpnConnectionId: string;
  State: string;
  CustomerGatewayId: string;
  VpnGatewayId?: string;
  TransitGatewayId?: string;
  Type: string;
  Category?: string;
  TransitGatewayAttachmentId?: string;
  StaticRoutesOnly: boolean;
  Routes: { DestinationCidrBlock: string; State: string }[];
  VgwTelemetry: VpnTunnelTelemetryItem[];
  Name?: string;
  Tags?: Record<string, string>;
}

// ----------------------------------------------------------------------
// Customer Gateways
// ----------------------------------------------------------------------

export async function listCustomerGatewaysAction(): Promise<{
  success: boolean;
  customerGateways: CustomerGatewayItem[];
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeCustomerGatewaysCommand({}));
    const raw = res.CustomerGateways || [];

    const customerGateways: CustomerGatewayItem[] = raw.map((cgw) => {
      const tagsMap: Record<string, string> = {};
      cgw.Tags?.forEach((t) => {
        if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
      });

      return {
        CustomerGatewayId: cgw.CustomerGatewayId || "",
        State: cgw.State || "available",
        Type: cgw.Type || "ipsec.1",
        IpAddress: cgw.IpAddress || "",
        BgpAsn: Number(cgw.BgpAsn) || 65000,
        CertificateArn: cgw.CertificateArn,
        DeviceName: cgw.DeviceName,
        Name: getTag(cgw.Tags, "Name"),
        Tags: tagsMap,
      };
    });

    return { success: true, customerGateways };
  } catch (err: unknown) {
    return {
      success: false,
      customerGateways: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getCustomerGatewayDetailAction(customerGatewayId: string): Promise<{
  success: boolean;
  customerGateway?: CustomerGatewayItem;
  vpnConnections?: VpnConnectionItem[];
  error?: string;
}> {
  try {
    const [cgwRes, vpnRes] = await Promise.all([
      ec2.send(new DescribeCustomerGatewaysCommand({ CustomerGatewayIds: [customerGatewayId] })),
      ec2.send(
        new DescribeVpnConnectionsCommand({
          Filters: [{ Name: "customer-gateway-id", Values: [customerGatewayId] }],
        })
      ).catch(() => null),
    ]);

    const cgw = cgwRes.CustomerGateways?.[0];
    if (!cgw) {
      return { success: false, error: `Customer Gateway ${customerGatewayId} not found` };
    }

    const tagsMap: Record<string, string> = {};
    cgw.Tags?.forEach((t) => {
      if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
    });

    const customerGateway: CustomerGatewayItem = {
      CustomerGatewayId: cgw.CustomerGatewayId || "",
      State: cgw.State || "available",
      Type: cgw.Type || "ipsec.1",
      IpAddress: cgw.IpAddress || "",
      BgpAsn: Number(cgw.BgpAsn) || 65000,
      CertificateArn: cgw.CertificateArn,
      DeviceName: cgw.DeviceName,
      Name: getTag(cgw.Tags, "Name"),
      Tags: tagsMap,
    };

    const vpnConnections: VpnConnectionItem[] = (vpnRes?.VpnConnections || []).map((v) => {
      const vTags: Record<string, string> = {};
      v.Tags?.forEach((t) => {
        if (t.Key && t.Value) vTags[t.Key] = t.Value;
      });

      return {
        VpnConnectionId: v.VpnConnectionId || "",
        State: v.State || "available",
        CustomerGatewayId: v.CustomerGatewayId || "",
        VpnGatewayId: v.VpnGatewayId,
        TransitGatewayId: v.TransitGatewayId,
        Type: v.Type || "ipsec.1",
        Category: v.Category || "VPN",
        TransitGatewayAttachmentId: (v.Options as { TransitGatewayAttachmentId?: string })?.TransitGatewayAttachmentId,
        StaticRoutesOnly: Boolean(v.Options?.StaticRoutesOnly),
        Routes: (v.Routes || []).map((r) => ({
          DestinationCidrBlock: r.DestinationCidrBlock || "",
          State: r.State || "",
        })),
        VgwTelemetry: (v.VgwTelemetry || []).map((t) => ({
          OutsideIpAddress: t.OutsideIpAddress,
          Status: t.Status,
          StatusMessage: t.StatusMessage,
          AcceptedRouteCount: t.AcceptedRouteCount,
          LastStatusChange: t.LastStatusChange?.toISOString(),
        })),
        Name: getTag(v.Tags, "Name"),
        Tags: vTags,
      };
    });

    return { success: true, customerGateway, vpnConnections };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createCustomerGatewayAction(data: {
  ipAddress: string;
  bgpAsn: number;
  name?: string;
  certificateArn?: string;
  deviceName?: string;
  tags?: { key: string; value: string }[];
}): Promise<{ success: boolean; customerGatewayId?: string; error?: string }> {
  try {
    const tagSpecs = [];
    const tagsList: Tag[] = [];
    if (data.name?.trim()) {
      tagsList.push({ Key: "Name", Value: data.name.trim() });
    }
    if (data.tags) {
      data.tags.forEach((t) => {
        if (t.key.trim()) tagsList.push({ Key: t.key.trim(), Value: t.value });
      });
    }
    if (tagsList.length > 0) {
      tagSpecs.push({
        ResourceType: "customer-gateway" as const,
        Tags: tagsList,
      });
    }

    const res = await ec2.send(
      new CreateCustomerGatewayCommand({
        Type: "ipsec.1",
        PublicIp: data.ipAddress.trim(),
        BgpAsn: Number(data.bgpAsn) || 65000,
        CertificateArn: data.certificateArn?.trim() || undefined,
        DeviceName: data.deviceName?.trim() || undefined,
        TagSpecifications: tagSpecs.length > 0 ? tagSpecs : undefined,
      })
    );

    return {
      success: true,
      customerGatewayId: res.CustomerGateway?.CustomerGatewayId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteCustomerGatewayAction(customerGatewayId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await ec2.send(new DeleteCustomerGatewayCommand({ CustomerGatewayId: customerGatewayId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ----------------------------------------------------------------------
// Virtual Private Gateways (VGW)
// ----------------------------------------------------------------------

export async function listVirtualPrivateGatewaysAction(): Promise<{
  success: boolean;
  virtualPrivateGateways: VirtualPrivateGatewayItem[];
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeVpnGatewaysCommand({}));
    const raw = res.VpnGateways || [];

    const virtualPrivateGateways: VirtualPrivateGatewayItem[] = raw.map((vgw) => {
      const tagsMap: Record<string, string> = {};
      vgw.Tags?.forEach((t) => {
        if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
      });

      const attachments = (vgw.VpcAttachments || []).map((att) => ({
        VpcId: att.VpcId || "",
        State: att.State || "attached",
      }));

      const activeAttachment = attachments.find((a) => a.State === "attached" || a.State === "attaching");

      return {
        VpnGatewayId: vgw.VpnGatewayId || "",
        State: vgw.State || "available",
        Type: vgw.Type || "ipsec.1",
        AmazonSideAsn: Number(vgw.AmazonSideAsn) || 64512,
        VpcAttachments: attachments,
        AttachedVpcId: activeAttachment?.VpcId,
        Name: getTag(vgw.Tags, "Name"),
        Tags: tagsMap,
      };
    });

    return { success: true, virtualPrivateGateways };
  } catch (err: unknown) {
    return {
      success: false,
      virtualPrivateGateways: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getVirtualPrivateGatewayDetailAction(vpnGatewayId: string): Promise<{
  success: boolean;
  virtualPrivateGateway?: VirtualPrivateGatewayItem;
  vpcs?: { VpcId: string; Name?: string; CidrBlock?: string }[];
  error?: string;
}> {
  try {
    const [vgwRes, vpcRes] = await Promise.all([
      ec2.send(new DescribeVpnGatewaysCommand({ VpnGatewayIds: [vpnGatewayId] })),
      ec2.send(new DescribeVpcsCommand({})).catch(() => null),
    ]);

    const vgw = vgwRes.VpnGateways?.[0];
    if (!vgw) {
      return { success: false, error: `Virtual Private Gateway ${vpnGatewayId} not found` };
    }

    const tagsMap: Record<string, string> = {};
    vgw.Tags?.forEach((t) => {
      if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
    });

    const attachments = (vgw.VpcAttachments || []).map((att) => ({
      VpcId: att.VpcId || "",
      State: att.State || "attached",
    }));

    const activeAttachment = attachments.find((a) => a.State === "attached" || a.State === "attaching");

    const virtualPrivateGateway: VirtualPrivateGatewayItem = {
      VpnGatewayId: vgw.VpnGatewayId || "",
      State: vgw.State || "available",
      Type: vgw.Type || "ipsec.1",
      AmazonSideAsn: Number(vgw.AmazonSideAsn) || 64512,
      VpcAttachments: attachments,
      AttachedVpcId: activeAttachment?.VpcId,
      Name: getTag(vgw.Tags, "Name"),
      Tags: tagsMap,
    };

    const vpcs = (vpcRes?.Vpcs || []).map((v) => ({
      VpcId: v.VpcId || "",
      Name: getTag(v.Tags, "Name"),
      CidrBlock: v.CidrBlock,
    }));

    return { success: true, virtualPrivateGateway, vpcs };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createVirtualPrivateGatewayAction(data: {
  amazonSideAsn?: number;
  name?: string;
  tags?: { key: string; value: string }[];
}): Promise<{ success: boolean; vpnGatewayId?: string; error?: string }> {
  try {
    const tagSpecs = [];
    const tagsList: Tag[] = [];
    if (data.name?.trim()) {
      tagsList.push({ Key: "Name", Value: data.name.trim() });
    }
    if (data.tags) {
      data.tags.forEach((t) => {
        if (t.key.trim()) tagsList.push({ Key: t.key.trim(), Value: t.value });
      });
    }
    if (tagsList.length > 0) {
      tagSpecs.push({
        ResourceType: "vpn-gateway" as const,
        Tags: tagsList,
      });
    }

    const res = await ec2.send(
      new CreateVpnGatewayCommand({
        Type: "ipsec.1",
        AmazonSideAsn: data.amazonSideAsn || 64512,
        TagSpecifications: tagSpecs.length > 0 ? tagSpecs : undefined,
      })
    );

    return {
      success: true,
      vpnGatewayId: res.VpnGateway?.VpnGatewayId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function attachVirtualPrivateGatewayAction(
  vpnGatewayId: string,
  vpcId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new AttachVpnGatewayCommand({
        VpnGatewayId: vpnGatewayId,
        VpcId: vpcId,
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

export async function detachVirtualPrivateGatewayAction(
  vpnGatewayId: string,
  vpcId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new DetachVpnGatewayCommand({
        VpnGatewayId: vpnGatewayId,
        VpcId: vpcId,
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

export async function deleteVirtualPrivateGatewayAction(vpnGatewayId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await ec2.send(new DeleteVpnGatewayCommand({ VpnGatewayId: vpnGatewayId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ----------------------------------------------------------------------
// Site-to-Site VPN Connections
// ----------------------------------------------------------------------

export async function listVpnConnectionsAction(): Promise<{
  success: boolean;
  vpnConnections: VpnConnectionItem[];
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeVpnConnectionsCommand({}));
    const raw = res.VpnConnections || [];

    const vpnConnections: VpnConnectionItem[] = raw.map((v) => {
      const tagsMap: Record<string, string> = {};
      v.Tags?.forEach((t) => {
        if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
      });

      return {
        VpnConnectionId: v.VpnConnectionId || "",
        State: v.State || "available",
        CustomerGatewayId: v.CustomerGatewayId || "",
        VpnGatewayId: v.VpnGatewayId,
        TransitGatewayId: v.TransitGatewayId,
        Type: v.Type || "ipsec.1",
        Category: v.Category || "VPN",
        TransitGatewayAttachmentId: (v.Options as { TransitGatewayAttachmentId?: string })?.TransitGatewayAttachmentId,
        StaticRoutesOnly: Boolean(v.Options?.StaticRoutesOnly),
        Routes: (v.Routes || []).map((r) => ({
          DestinationCidrBlock: r.DestinationCidrBlock || "",
          State: r.State || "",
        })),
        VgwTelemetry: (v.VgwTelemetry || []).map((t) => ({
          OutsideIpAddress: t.OutsideIpAddress,
          Status: t.Status,
          StatusMessage: t.StatusMessage,
          AcceptedRouteCount: t.AcceptedRouteCount,
          LastStatusChange: t.LastStatusChange?.toISOString(),
        })),
        Name: getTag(v.Tags, "Name"),
        Tags: tagsMap,
      };
    });

    return { success: true, vpnConnections };
  } catch (err: unknown) {
    return {
      success: false,
      vpnConnections: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getVpnConnectionDetailAction(vpnConnectionId: string): Promise<{
  success: boolean;
  vpnConnection?: VpnConnectionItem;
  customerGateway?: CustomerGatewayItem;
  virtualPrivateGateway?: VirtualPrivateGatewayItem;
  error?: string;
}> {
  try {
    const vpnRes = await ec2.send(
      new DescribeVpnConnectionsCommand({ VpnConnectionIds: [vpnConnectionId] })
    );
    const v = vpnRes.VpnConnections?.[0];
    if (!v) {
      return { success: false, error: `VPN Connection ${vpnConnectionId} not found` };
    }

    const tagsMap: Record<string, string> = {};
    v.Tags?.forEach((t) => {
      if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
    });

    const vpnConnection: VpnConnectionItem = {
      VpnConnectionId: v.VpnConnectionId || "",
      State: v.State || "available",
      CustomerGatewayId: v.CustomerGatewayId || "",
      VpnGatewayId: v.VpnGatewayId,
      TransitGatewayId: v.TransitGatewayId,
      Type: v.Type || "ipsec.1",
      Category: v.Category || "VPN",
      TransitGatewayAttachmentId: (v.Options as { TransitGatewayAttachmentId?: string })?.TransitGatewayAttachmentId,
      StaticRoutesOnly: Boolean(v.Options?.StaticRoutesOnly),
      Routes: (v.Routes || []).map((r) => ({
        DestinationCidrBlock: r.DestinationCidrBlock || "",
        State: r.State || "",
      })),
      VgwTelemetry: (v.VgwTelemetry || []).map((t) => ({
        OutsideIpAddress: t.OutsideIpAddress,
        Status: t.Status,
        StatusMessage: t.StatusMessage,
        AcceptedRouteCount: t.AcceptedRouteCount,
        LastStatusChange: t.LastStatusChange?.toISOString(),
      })),
      Name: getTag(v.Tags, "Name"),
      Tags: tagsMap,
    };

    // Parallel fetch related CGW and VGW if present
    const [cgwRes, vgwRes] = await Promise.all([
      v.CustomerGatewayId
        ? ec2.send(new DescribeCustomerGatewaysCommand({ CustomerGatewayIds: [v.CustomerGatewayId] })).catch(() => null)
        : null,
      v.VpnGatewayId
        ? ec2.send(new DescribeVpnGatewaysCommand({ VpnGatewayIds: [v.VpnGatewayId] })).catch(() => null)
        : null,
    ]);

    let customerGateway: CustomerGatewayItem | undefined;
    const cgwRaw = cgwRes?.CustomerGateways?.[0];
    if (cgwRaw) {
      customerGateway = {
        CustomerGatewayId: cgwRaw.CustomerGatewayId || "",
        State: cgwRaw.State || "available",
        Type: cgwRaw.Type || "ipsec.1",
        IpAddress: cgwRaw.IpAddress || "",
        BgpAsn: Number(cgwRaw.BgpAsn) || 65000,
        Name: getTag(cgwRaw.Tags, "Name"),
      };
    }

    let virtualPrivateGateway: VirtualPrivateGatewayItem | undefined;
    const vgwRaw = vgwRes?.VpnGateways?.[0];
    if (vgwRaw) {
      virtualPrivateGateway = {
        VpnGatewayId: vgwRaw.VpnGatewayId || "",
        State: vgwRaw.State || "available",
        Type: vgwRaw.Type || "ipsec.1",
        AmazonSideAsn: Number(vgwRaw.AmazonSideAsn) || 64512,
        VpcAttachments: (vgwRaw.VpcAttachments || []).map((a) => ({
          VpcId: a.VpcId || "",
          State: a.State || "attached",
        })),
        Name: getTag(vgwRaw.Tags, "Name"),
      };
    }

    return {
      success: true,
      vpnConnection,
      customerGateway,
      virtualPrivateGateway,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createVpnConnectionAction(data: {
  targetGatewayType: "vgw" | "tgw";
  vpnGatewayId?: string;
  transitGatewayId?: string;
  customerGatewayId?: string;
  newCustomerGateway?: { ipAddress: string; bgpAsn: number; certificateArn?: string; deviceName?: string };
  routingOption: "dynamic" | "static";
  staticRoutes?: string[];
  tunnel1Options?: { insideCidr?: string; preSharedKey?: string };
  tunnel2Options?: { insideCidr?: string; preSharedKey?: string };
  name?: string;
  tags?: { key: string; value: string }[];
}): Promise<{ success: boolean; vpnConnectionId?: string; error?: string }> {
  try {
    let finalCgwId = data.customerGatewayId;

    // Create new customer gateway if specified
    if (!finalCgwId && data.newCustomerGateway) {
      const cgwRes = await ec2.send(
        new CreateCustomerGatewayCommand({
          Type: "ipsec.1",
          PublicIp: data.newCustomerGateway.ipAddress.trim(),
          BgpAsn: Number(data.newCustomerGateway.bgpAsn) || 65000,
          CertificateArn: data.newCustomerGateway.certificateArn?.trim() || undefined,
          DeviceName: data.newCustomerGateway.deviceName?.trim() || undefined,
        })
      );
      finalCgwId = cgwRes.CustomerGateway?.CustomerGatewayId;
    }

    if (!finalCgwId) {
      return { success: false, error: "Customer Gateway ID is required" };
    }

    const tagSpecs = [];
    const tagsList: Tag[] = [];
    if (data.name?.trim()) {
      tagsList.push({ Key: "Name", Value: data.name.trim() });
    }
    if (data.tags) {
      data.tags.forEach((t) => {
        if (t.key.trim()) tagsList.push({ Key: t.key.trim(), Value: t.value });
      });
    }
    if (tagsList.length > 0) {
      tagSpecs.push({
        ResourceType: "vpn-connection" as const,
        Tags: tagsList,
      });
    }

    const isStatic = data.routingOption === "static";

    const tunnelOptions: {
      TunnelInsideCidr?: string;
      PreSharedKey?: string;
    }[] = [];

    if (data.tunnel1Options?.insideCidr || data.tunnel1Options?.preSharedKey) {
      tunnelOptions.push({
        TunnelInsideCidr: data.tunnel1Options.insideCidr?.trim() || undefined,
        PreSharedKey: data.tunnel1Options.preSharedKey?.trim() || undefined,
      });
    }
    if (data.tunnel2Options?.insideCidr || data.tunnel2Options?.preSharedKey) {
      tunnelOptions.push({
        TunnelInsideCidr: data.tunnel2Options.insideCidr?.trim() || undefined,
        PreSharedKey: data.tunnel2Options.preSharedKey?.trim() || undefined,
      });
    }

    const res = await ec2.send(
      new CreateVpnConnectionCommand({
        Type: "ipsec.1",
        CustomerGatewayId: finalCgwId,
        VpnGatewayId: data.targetGatewayType === "vgw" ? data.vpnGatewayId : undefined,
        TransitGatewayId: data.targetGatewayType === "tgw" ? data.transitGatewayId : undefined,
        Options: {
          StaticRoutesOnly: isStatic,
          TunnelOptions: tunnelOptions.length > 0 ? tunnelOptions : undefined,
        },
        TagSpecifications: tagSpecs.length > 0 ? tagSpecs : undefined,
      })
    );

    const vpnId = res.VpnConnection?.VpnConnectionId;

    // If static routes specified, create them
    if (vpnId && isStatic && data.staticRoutes && data.staticRoutes.length > 0) {
      for (const route of data.staticRoutes) {
        if (route.trim()) {
          await ec2.send(
            new CreateVpnConnectionRouteCommand({
              VpnConnectionId: vpnId,
              DestinationCidrBlock: route.trim(),
            })
          ).catch(() => null);
        }
      }
    }

    return {
      success: true,
      vpnConnectionId: vpnId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteVpnConnectionAction(vpnConnectionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await ec2.send(new DeleteVpnConnectionCommand({ VpnConnectionId: vpnConnectionId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createVpnConnectionRouteAction(
  vpnConnectionId: string,
  destinationCidrBlock: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new CreateVpnConnectionRouteCommand({
        VpnConnectionId: vpnConnectionId,
        DestinationCidrBlock: destinationCidrBlock.trim(),
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

export async function deleteVpnConnectionRouteAction(
  vpnConnectionId: string,
  destinationCidrBlock: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new DeleteVpnConnectionRouteCommand({
        VpnConnectionId: vpnConnectionId,
        DestinationCidrBlock: destinationCidrBlock.trim(),
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

// ----------------------------------------------------------------------
// Download VPN Configuration (Sample Templates for Routers)
// ----------------------------------------------------------------------

export async function downloadVpnConfigurationAction(data: {
  vpnConnectionId: string;
  vendor: string;
  platform?: string;
  ikeVersion?: string;
}): Promise<{ success: boolean; configurationText?: string; filename?: string; error?: string }> {
  try {
    const vpnRes = await ec2.send(
      new DescribeVpnConnectionsCommand({ VpnConnectionIds: [data.vpnConnectionId] })
    );
    const v = vpnRes.VpnConnections?.[0];
    if (!v) {
      return { success: false, error: "VPN connection not found" };
    }

    const tunnel1 = v.VgwTelemetry?.[0];
    const tunnel2 = v.VgwTelemetry?.[1];

    const t1Ip = tunnel1?.OutsideIpAddress || "52.200.10.1";
    const t2Ip = tunnel2?.OutsideIpAddress || "52.200.10.2";
    const cgwIp = v.CustomerGatewayConfiguration || "203.0.113.12";

    const config = `
! Amazon Web Services
! Virtual Private Cloud
!
! AWS Site-to-Site VPN Configuration File
! VPN Connection ID: ${v.VpnConnectionId}
! Target Gateway: ${v.VpnGatewayId || v.TransitGatewayId || "vgw-default"}
! Customer Gateway: ${v.CustomerGatewayId}
! Vendor: ${data.vendor}
! Platform: ${data.platform || "Generic / Standard"}
! IKE Version: ${data.ikeVersion || "IKEv1 / IKEv2"}
!
! --------------------------------------------------------------------------------
! IPSec Tunnel #1
! --------------------------------------------------------------------------------
! Outside IP Addresses:
!   - Customer Gateway: ${cgwIp}
!   - Virtual Private Gateway: ${t1Ip}
!
! Inside IP Addresses:
!   - Customer Gateway: 169.254.10.2/30
!   - Virtual Private Gateway: 169.254.10.1/30
!
! Pre-Shared Key: preSharedKey1ExampleSecretKey!
! Phase 1 (ISAKMP) Negotiation Parameters:
!   - Authentication Method: Pre-Shared Key
!   - Encryption Algorithm: AES-128 or AES-256
!   - Authentication Algorithm: SHA-1 or SHA-256
!   - Diffie-Hellman Group: 2 or 14
!   - Lifetime: 28800 seconds (8 hours)
!
! Phase 2 (IPSec) Negotiation Parameters:
!   - Protocol: ESP
!   - Encryption Algorithm: AES-128 or AES-256
!   - Authentication Algorithm: SHA-1 or SHA-256
!   - Perfect Forward Secrecy: Enabled (Diffie-Hellman Group 2 or 14)
!   - Lifetime: 3600 seconds (1 hour)
!
! --------------------------------------------------------------------------------
! IPSec Tunnel #2
! --------------------------------------------------------------------------------
! Outside IP Addresses:
!   - Customer Gateway: ${cgwIp}
!   - Virtual Private Gateway: ${t2Ip}
!
! Inside IP Addresses:
!   - Customer Gateway: 169.254.11.2/30
!   - Virtual Private Gateway: 169.254.11.1/30
!
! Pre-Shared Key: preSharedKey2ExampleSecretKey!
! --------------------------------------------------------------------------------
`;

    return {
      success: true,
      configurationText: config.trim(),
      filename: `${v.VpnConnectionId}-${data.vendor.toLowerCase().replace(/\s+/g, "_")}.txt`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
