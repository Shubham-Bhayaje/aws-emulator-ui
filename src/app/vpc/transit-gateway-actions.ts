"use server";

import { ec2 } from "@/lib/aws";
import {
  DescribeTransitGatewaysCommand,
  CreateTransitGatewayCommand,
  DeleteTransitGatewayCommand,
  DescribeTransitGatewayAttachmentsCommand,
  DescribeTransitGatewayVpcAttachmentsCommand,
  CreateTransitGatewayVpcAttachmentCommand,
  DeleteTransitGatewayVpcAttachmentCommand,
  DescribeTransitGatewayRouteTablesCommand,
  CreateTransitGatewayRouteTableCommand,
  DeleteTransitGatewayRouteTableCommand,
  AssociateTransitGatewayRouteTableCommand,
  DisassociateTransitGatewayRouteTableCommand,
  EnableTransitGatewayRouteTablePropagationCommand,
  DisableTransitGatewayRouteTablePropagationCommand,
  CreateTransitGatewayRouteCommand,
  DeleteTransitGatewayRouteCommand,
  SearchTransitGatewayRoutesCommand,
  GetTransitGatewayRouteTableAssociationsCommand,
  GetTransitGatewayRouteTablePropagationsCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  Tag,
} from "@aws-sdk/client-ec2";

function getTag(tags: Tag[] | undefined, key: string): string | undefined {
  return tags?.find((t) => t.Key === key)?.Value;
}

export interface TransitGatewayItem {
  TransitGatewayId: string;
  TransitGatewayArn?: string;
  State: string;
  OwnerId: string;
  Description?: string;
  CreationTime?: string;
  AmazonSideAsn: number;
  AutoAcceptSharedAttachments: "enable" | "disable";
  DefaultRouteTableAssociation: "enable" | "disable";
  DefaultRouteTablePropagation: "enable" | "disable";
  VpnEcmpSupport: "enable" | "disable";
  DnsSupport: "enable" | "disable";
  MulticastSupport: "enable" | "disable";
  TransitGatewayCidrBlocks: string[];
  AssociationDefaultRouteTableId?: string;
  PropagationDefaultRouteTableId?: string;
  Name?: string;
  Tags?: Record<string, string>;
}

export interface TransitGatewayAttachmentItem {
  TransitGatewayAttachmentId: string;
  TransitGatewayId: string;
  TransitGatewayOwnerId?: string;
  ResourceOwnerId?: string;
  ResourceType: string;
  ResourceId?: string;
  State: string;
  AssociationRouteTableId?: string;
  CreationTime?: string;
  SubnetIds?: string[];
  VpcId?: string;
  Name?: string;
  Tags?: Record<string, string>;
}

export interface TransitGatewayRouteTableItem {
  TransitGatewayRouteTableId: string;
  TransitGatewayId: string;
  State: string;
  DefaultAssociationRouteTable: boolean;
  DefaultPropagationRouteTable: boolean;
  CreationTime?: string;
  Name?: string;
  Tags?: Record<string, string>;
}

export interface TransitGatewayRouteItem {
  DestinationCidrBlock: string;
  TransitGatewayAttachmentId?: string;
  ResourceType?: string;
  ResourceId?: string;
  Type: "static" | "propagated";
  State: "active" | "blackhole";
}

export interface TransitGatewayAssociationItem {
  TransitGatewayAttachmentId: string;
  ResourceId?: string;
  ResourceType?: string;
  State: string;
}

export interface TransitGatewayPropagationItem {
  TransitGatewayAttachmentId: string;
  ResourceId?: string;
  ResourceType?: string;
  State: string;
}

// ----------------------------------------------------------------------
// Transit Gateways
// ----------------------------------------------------------------------

export async function listTransitGatewaysAction(): Promise<{
  success: boolean;
  transitGateways: TransitGatewayItem[];
  error?: string;
}> {
  try {
    const res = await ec2.send(new DescribeTransitGatewaysCommand({}));
    const rawList = res.TransitGateways || [];

    const transitGateways: TransitGatewayItem[] = rawList.map((tgw) => {
      const tagsMap: Record<string, string> = {};
      tgw.Tags?.forEach((t) => {
        if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
      });

      return {
        TransitGatewayId: tgw.TransitGatewayId || "",
        TransitGatewayArn: tgw.TransitGatewayArn,
        State: tgw.State || "available",
        OwnerId: tgw.OwnerId || "000000000000",
        Description: tgw.Description,
        CreationTime: tgw.CreationTime?.toISOString(),
        AmazonSideAsn: tgw.Options?.AmazonSideAsn || 64512,
        AutoAcceptSharedAttachments: (tgw.Options?.AutoAcceptSharedAttachments as "enable" | "disable") || "disable",
        DefaultRouteTableAssociation: (tgw.Options?.DefaultRouteTableAssociation as "enable" | "disable") || "enable",
        DefaultRouteTablePropagation: (tgw.Options?.DefaultRouteTablePropagation as "enable" | "disable") || "enable",
        VpnEcmpSupport: (tgw.Options?.VpnEcmpSupport as "enable" | "disable") || "enable",
        DnsSupport: (tgw.Options?.DnsSupport as "enable" | "disable") || "enable",
        MulticastSupport: (tgw.Options?.MulticastSupport as "enable" | "disable") || "disable",
        TransitGatewayCidrBlocks: tgw.Options?.TransitGatewayCidrBlocks || [],
        AssociationDefaultRouteTableId: tgw.Options?.AssociationDefaultRouteTableId,
        PropagationDefaultRouteTableId: tgw.Options?.PropagationDefaultRouteTableId,
        Name: getTag(tgw.Tags, "Name"),
        Tags: tagsMap,
      };
    });

    return { success: true, transitGateways };
  } catch (err: unknown) {
    return {
      success: false,
      transitGateways: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getTransitGatewayDetailAction(transitGatewayId: string): Promise<{
  success: boolean;
  transitGateway?: TransitGatewayItem;
  attachments?: TransitGatewayAttachmentItem[];
  routeTables?: TransitGatewayRouteTableItem[];
  error?: string;
}> {
  try {
    const [tgwRes, attRes, rtbRes] = await Promise.all([
      ec2.send(new DescribeTransitGatewaysCommand({ TransitGatewayIds: [transitGatewayId] })),
      ec2.send(new DescribeTransitGatewayAttachmentsCommand({
        Filters: [{ Name: "transit-gateway-id", Values: [transitGatewayId] }],
      })),
      ec2.send(new DescribeTransitGatewayRouteTablesCommand({
        Filters: [{ Name: "transit-gateway-id", Values: [transitGatewayId] }],
      })),
    ]);

    const tgw = tgwRes.TransitGateways?.[0];
    if (!tgw) {
      return { success: false, error: `Transit Gateway ${transitGatewayId} not found` };
    }

    const tagsMap: Record<string, string> = {};
    tgw.Tags?.forEach((t) => {
      if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
    });

    const transitGateway: TransitGatewayItem = {
      TransitGatewayId: tgw.TransitGatewayId || "",
      TransitGatewayArn: tgw.TransitGatewayArn,
      State: tgw.State || "available",
      OwnerId: tgw.OwnerId || "000000000000",
      Description: tgw.Description,
      CreationTime: tgw.CreationTime?.toISOString(),
      AmazonSideAsn: tgw.Options?.AmazonSideAsn || 64512,
      AutoAcceptSharedAttachments: (tgw.Options?.AutoAcceptSharedAttachments as "enable" | "disable") || "disable",
      DefaultRouteTableAssociation: (tgw.Options?.DefaultRouteTableAssociation as "enable" | "disable") || "enable",
      DefaultRouteTablePropagation: (tgw.Options?.DefaultRouteTablePropagation as "enable" | "disable") || "enable",
      VpnEcmpSupport: (tgw.Options?.VpnEcmpSupport as "enable" | "disable") || "enable",
      DnsSupport: (tgw.Options?.DnsSupport as "enable" | "disable") || "enable",
      MulticastSupport: (tgw.Options?.MulticastSupport as "enable" | "disable") || "disable",
      TransitGatewayCidrBlocks: tgw.Options?.TransitGatewayCidrBlocks || [],
      AssociationDefaultRouteTableId: tgw.Options?.AssociationDefaultRouteTableId,
      PropagationDefaultRouteTableId: tgw.Options?.PropagationDefaultRouteTableId,
      Name: getTag(tgw.Tags, "Name"),
      Tags: tagsMap,
    };

    const attachments: TransitGatewayAttachmentItem[] = (attRes.TransitGatewayAttachments || []).map((att) => {
      const aTags: Record<string, string> = {};
      att.Tags?.forEach((t) => {
        if (t.Key && t.Value) aTags[t.Key] = t.Value;
      });

      return {
        TransitGatewayAttachmentId: att.TransitGatewayAttachmentId || "",
        TransitGatewayId: att.TransitGatewayId || "",
        TransitGatewayOwnerId: att.TransitGatewayOwnerId,
        ResourceOwnerId: att.ResourceOwnerId,
        ResourceType: att.ResourceType || "vpc",
        ResourceId: att.ResourceId,
        State: att.State || "available",
        AssociationRouteTableId: att.Association?.TransitGatewayRouteTableId,
        CreationTime: att.CreationTime?.toISOString(),
        Name: getTag(att.Tags, "Name"),
        Tags: aTags,
      };
    });

    const routeTables: TransitGatewayRouteTableItem[] = (rtbRes.TransitGatewayRouteTables || []).map((rtb) => {
      const rTags: Record<string, string> = {};
      rtb.Tags?.forEach((t) => {
        if (t.Key && t.Value) rTags[t.Key] = t.Value;
      });

      return {
        TransitGatewayRouteTableId: rtb.TransitGatewayRouteTableId || "",
        TransitGatewayId: rtb.TransitGatewayId || "",
        State: rtb.State || "available",
        DefaultAssociationRouteTable: Boolean(rtb.DefaultAssociationRouteTable),
        DefaultPropagationRouteTable: Boolean(rtb.DefaultPropagationRouteTable),
        CreationTime: rtb.CreationTime?.toISOString(),
        Name: getTag(rtb.Tags, "Name"),
        Tags: rTags,
      };
    });

    return {
      success: true,
      transitGateway,
      attachments,
      routeTables,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createTransitGatewayAction(data: {
  name?: string;
  description?: string;
  amazonSideAsn?: number;
  autoAcceptSharedAttachments?: "enable" | "disable";
  defaultRouteTableAssociation?: "enable" | "disable";
  defaultRouteTablePropagation?: "enable" | "disable";
  vpnEcmpSupport?: "enable" | "disable";
  dnsSupport?: "enable" | "disable";
  multicastSupport?: "enable" | "disable";
  transitGatewayCidrBlocks?: string[];
  tags?: { key: string; value: string }[];
}): Promise<{ success: boolean; transitGatewayId?: string; error?: string }> {
  try {
    const tagSpecs = [];
    const tagsList: Tag[] = [];
    if (data.name) {
      tagsList.push({ Key: "Name", Value: data.name });
    }
    if (data.tags) {
      data.tags.forEach((t) => {
        if (t.key.trim()) tagsList.push({ Key: t.key.trim(), Value: t.value });
      });
    }
    if (tagsList.length > 0) {
      tagSpecs.push({
        ResourceType: "transit-gateway" as const,
        Tags: tagsList,
      });
    }

    const res = await ec2.send(
      new CreateTransitGatewayCommand({
        Description: data.description?.trim() || undefined,
        Options: {
          AmazonSideAsn: data.amazonSideAsn || 64512,
          AutoAcceptSharedAttachments: data.autoAcceptSharedAttachments || "disable",
          DefaultRouteTableAssociation: data.defaultRouteTableAssociation || "enable",
          DefaultRouteTablePropagation: data.defaultRouteTablePropagation || "enable",
          VpnEcmpSupport: data.vpnEcmpSupport || "enable",
          DnsSupport: data.dnsSupport || "enable",
          MulticastSupport: data.multicastSupport || "disable",
          TransitGatewayCidrBlocks: data.transitGatewayCidrBlocks?.filter(Boolean),
        },
        TagSpecifications: tagSpecs.length > 0 ? tagSpecs : undefined,
      })
    );

    return {
      success: true,
      transitGatewayId: res.TransitGateway?.TransitGatewayId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteTransitGatewayAction(transitGatewayId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await ec2.send(new DeleteTransitGatewayCommand({ TransitGatewayId: transitGatewayId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ----------------------------------------------------------------------
// Attachments
// ----------------------------------------------------------------------

export async function listTransitGatewayAttachmentsAction(transitGatewayId?: string): Promise<{
  success: boolean;
  attachments: TransitGatewayAttachmentItem[];
  error?: string;
}> {
  try {
    const filters = transitGatewayId
      ? [{ Name: "transit-gateway-id", Values: [transitGatewayId] }]
      : undefined;

    const res = await ec2.send(new DescribeTransitGatewayAttachmentsCommand({ Filters: filters }));
    const rawList = res.TransitGatewayAttachments || [];

    const attachments: TransitGatewayAttachmentItem[] = rawList.map((att) => {
      const tagsMap: Record<string, string> = {};
      att.Tags?.forEach((t) => {
        if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
      });

      return {
        TransitGatewayAttachmentId: att.TransitGatewayAttachmentId || "",
        TransitGatewayId: att.TransitGatewayId || "",
        TransitGatewayOwnerId: att.TransitGatewayOwnerId,
        ResourceOwnerId: att.ResourceOwnerId,
        ResourceType: att.ResourceType || "vpc",
        ResourceId: att.ResourceId,
        State: att.State || "available",
        AssociationRouteTableId: att.Association?.TransitGatewayRouteTableId,
        CreationTime: att.CreationTime?.toISOString(),
        Name: getTag(att.Tags, "Name"),
        Tags: tagsMap,
      };
    });

    return { success: true, attachments };
  } catch (err: unknown) {
    return {
      success: false,
      attachments: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getTransitGatewayAttachmentDetailAction(attachmentId: string): Promise<{
  success: boolean;
  attachment?: TransitGatewayAttachmentItem;
  vpc?: { VpcId: string; Name?: string; CidrBlock?: string };
  subnets?: { SubnetId: string; Name?: string; CidrBlock?: string; AvailabilityZone?: string }[];
  error?: string;
}> {
  try {
    const [attRes, vpcAttRes] = await Promise.all([
      ec2.send(new DescribeTransitGatewayAttachmentsCommand({ TransitGatewayAttachmentIds: [attachmentId] })),
      ec2.send(new DescribeTransitGatewayVpcAttachmentsCommand({ TransitGatewayAttachmentIds: [attachmentId] })).catch(() => null),
    ]);

    const att = attRes.TransitGatewayAttachments?.[0];
    if (!att) {
      return { success: false, error: `Transit Gateway Attachment ${attachmentId} not found` };
    }

    const vpcAtt = vpcAttRes?.TransitGatewayVpcAttachments?.[0];

    const tagsMap: Record<string, string> = {};
    att.Tags?.forEach((t) => {
      if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
    });

    const attachment: TransitGatewayAttachmentItem = {
      TransitGatewayAttachmentId: att.TransitGatewayAttachmentId || "",
      TransitGatewayId: att.TransitGatewayId || "",
      TransitGatewayOwnerId: att.TransitGatewayOwnerId,
      ResourceOwnerId: att.ResourceOwnerId,
      ResourceType: att.ResourceType || "vpc",
      ResourceId: att.ResourceId,
      State: att.State || "available",
      AssociationRouteTableId: att.Association?.TransitGatewayRouteTableId,
      CreationTime: att.CreationTime?.toISOString(),
      VpcId: vpcAtt?.VpcId || (att.ResourceType === "vpc" ? att.ResourceId : undefined),
      SubnetIds: vpcAtt?.SubnetIds || [],
      Name: getTag(att.Tags, "Name"),
      Tags: tagsMap,
    };

    let vpc;
    let subnets;

    if (attachment.VpcId) {
      const vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [attachment.VpcId] })).catch(() => null);
      const v = vpcs?.Vpcs?.[0];
      if (v) {
        vpc = {
          VpcId: v.VpcId || "",
          Name: getTag(v.Tags, "Name"),
          CidrBlock: v.CidrBlock,
        };
      }
    }

    if (attachment.SubnetIds && attachment.SubnetIds.length > 0) {
      const subs = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: attachment.SubnetIds })).catch(() => null);
      subnets = subs?.Subnets?.map((s) => ({
        SubnetId: s.SubnetId || "",
        Name: getTag(s.Tags, "Name"),
        CidrBlock: s.CidrBlock,
        AvailabilityZone: s.AvailabilityZone,
      })) || [];
    }

    return {
      success: true,
      attachment,
      vpc,
      subnets,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createTransitGatewayVpcAttachmentAction(data: {
  transitGatewayId: string;
  vpcId: string;
  subnetIds: string[];
  name?: string;
  ipv6Support?: "enable" | "disable";
  applianceModeSupport?: "enable" | "disable";
  tags?: { key: string; value: string }[];
}): Promise<{ success: boolean; attachmentId?: string; error?: string }> {
  try {
    const tagSpecs = [];
    const tagsList: Tag[] = [];
    if (data.name) {
      tagsList.push({ Key: "Name", Value: data.name });
    }
    if (data.tags) {
      data.tags.forEach((t) => {
        if (t.key.trim()) tagsList.push({ Key: t.key.trim(), Value: t.value });
      });
    }
    if (tagsList.length > 0) {
      tagSpecs.push({
        ResourceType: "transit-gateway-attachment" as const,
        Tags: tagsList,
      });
    }

    const res = await ec2.send(
      new CreateTransitGatewayVpcAttachmentCommand({
        TransitGatewayId: data.transitGatewayId,
        VpcId: data.vpcId,
        SubnetIds: data.subnetIds,
        Options: {
          Ipv6Support: data.ipv6Support || "disable",
          ApplianceModeSupport: data.applianceModeSupport || "disable",
        },
        TagSpecifications: tagSpecs.length > 0 ? tagSpecs : undefined,
      })
    );

    return {
      success: true,
      attachmentId: res.TransitGatewayVpcAttachment?.TransitGatewayAttachmentId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteTransitGatewayAttachmentAction(attachmentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await ec2.send(new DeleteTransitGatewayVpcAttachmentCommand({ TransitGatewayAttachmentId: attachmentId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ----------------------------------------------------------------------
// Route Tables & Routes
// ----------------------------------------------------------------------

export async function listTransitGatewayRouteTablesAction(transitGatewayId?: string): Promise<{
  success: boolean;
  routeTables: TransitGatewayRouteTableItem[];
  error?: string;
}> {
  try {
    const filters = transitGatewayId
      ? [{ Name: "transit-gateway-id", Values: [transitGatewayId] }]
      : undefined;

    const res = await ec2.send(new DescribeTransitGatewayRouteTablesCommand({ Filters: filters }));
    const rawList = res.TransitGatewayRouteTables || [];

    const routeTables: TransitGatewayRouteTableItem[] = rawList.map((rtb) => {
      const tagsMap: Record<string, string> = {};
      rtb.Tags?.forEach((t) => {
        if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
      });

      return {
        TransitGatewayRouteTableId: rtb.TransitGatewayRouteTableId || "",
        TransitGatewayId: rtb.TransitGatewayId || "",
        State: rtb.State || "available",
        DefaultAssociationRouteTable: Boolean(rtb.DefaultAssociationRouteTable),
        DefaultPropagationRouteTable: Boolean(rtb.DefaultPropagationRouteTable),
        CreationTime: rtb.CreationTime?.toISOString(),
        Name: getTag(rtb.Tags, "Name"),
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

export async function getTransitGatewayRouteTableDetailAction(routeTableId: string): Promise<{
  success: boolean;
  routeTable?: TransitGatewayRouteTableItem;
  associations?: TransitGatewayAssociationItem[];
  propagations?: TransitGatewayPropagationItem[];
  routes?: TransitGatewayRouteItem[];
  availableAttachments?: TransitGatewayAttachmentItem[];
  error?: string;
}> {
  try {
    const rtbRes = await ec2.send(
      new DescribeTransitGatewayRouteTablesCommand({ TransitGatewayRouteTableIds: [routeTableId] })
    );
    const rtb = rtbRes.TransitGatewayRouteTables?.[0];
    if (!rtb) {
      return { success: false, error: `Transit Gateway Route Table ${routeTableId} not found` };
    }

    const tagsMap: Record<string, string> = {};
    rtb.Tags?.forEach((t) => {
      if (t.Key && t.Value) tagsMap[t.Key] = t.Value;
    });

    const routeTable: TransitGatewayRouteTableItem = {
      TransitGatewayRouteTableId: rtb.TransitGatewayRouteTableId || "",
      TransitGatewayId: rtb.TransitGatewayId || "",
      State: rtb.State || "available",
      DefaultAssociationRouteTable: Boolean(rtb.DefaultAssociationRouteTable),
      DefaultPropagationRouteTable: Boolean(rtb.DefaultPropagationRouteTable),
      CreationTime: rtb.CreationTime?.toISOString(),
      Name: getTag(rtb.Tags, "Name"),
      Tags: tagsMap,
    };

    // Parallel fetch associations, propagations, routes, attachments
    const [assocRes, propRes, routesRes, attRes] = await Promise.all([
      ec2.send(new GetTransitGatewayRouteTableAssociationsCommand({ TransitGatewayRouteTableId: routeTableId })).catch(() => null),
      ec2.send(new GetTransitGatewayRouteTablePropagationsCommand({ TransitGatewayRouteTableId: routeTableId })).catch(() => null),
      ec2.send(new SearchTransitGatewayRoutesCommand({
        TransitGatewayRouteTableId: routeTableId,
        Filters: [{ Name: "state", Values: ["active", "blackhole"] }],
      })).catch(() => null),
      ec2.send(new DescribeTransitGatewayAttachmentsCommand({
        Filters: [{ Name: "transit-gateway-id", Values: [routeTable.TransitGatewayId] }],
      })).catch(() => null),
    ]);

    const associations: TransitGatewayAssociationItem[] = (assocRes?.Associations || []).map((a) => ({
      TransitGatewayAttachmentId: a.TransitGatewayAttachmentId || "",
      ResourceId: a.ResourceId,
      ResourceType: a.ResourceType,
      State: a.State || "associated",
    }));

    const propagations: TransitGatewayPropagationItem[] = (propRes?.TransitGatewayRouteTablePropagations || []).map((p) => ({
      TransitGatewayAttachmentId: p.TransitGatewayAttachmentId || "",
      ResourceId: p.ResourceId,
      ResourceType: p.ResourceType,
      State: p.State || "enabled",
    }));

    const routes: TransitGatewayRouteItem[] = (routesRes?.Routes || []).map((r) => {
      const att = r.TransitGatewayAttachments?.[0];
      return {
        DestinationCidrBlock: r.DestinationCidrBlock || "",
        TransitGatewayAttachmentId: att?.TransitGatewayAttachmentId,
        ResourceType: att?.ResourceType,
        ResourceId: att?.ResourceId,
        Type: (r.Type as "static" | "propagated") || "static",
        State: (r.State as "active" | "blackhole") || "active",
      };
    });

    const availableAttachments: TransitGatewayAttachmentItem[] = (attRes?.TransitGatewayAttachments || []).map((att) => {
      const aTags: Record<string, string> = {};
      att.Tags?.forEach((t) => {
        if (t.Key && t.Value) aTags[t.Key] = t.Value;
      });

      return {
        TransitGatewayAttachmentId: att.TransitGatewayAttachmentId || "",
        TransitGatewayId: att.TransitGatewayId || "",
        ResourceType: att.ResourceType || "vpc",
        ResourceId: att.ResourceId,
        State: att.State || "available",
        Name: getTag(att.Tags, "Name"),
        Tags: aTags,
      };
    });

    return {
      success: true,
      routeTable,
      associations,
      propagations,
      routes,
      availableAttachments,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createTransitGatewayRouteTableAction(data: {
  transitGatewayId: string;
  name?: string;
  tags?: { key: string; value: string }[];
}): Promise<{ success: boolean; routeTableId?: string; error?: string }> {
  try {
    const tagSpecs = [];
    const tagsList: Tag[] = [];
    if (data.name) {
      tagsList.push({ Key: "Name", Value: data.name });
    }
    if (data.tags) {
      data.tags.forEach((t) => {
        if (t.key.trim()) tagsList.push({ Key: t.key.trim(), Value: t.value });
      });
    }
    if (tagsList.length > 0) {
      tagSpecs.push({
        ResourceType: "transit-gateway-route-table" as const,
        Tags: tagsList,
      });
    }

    const res = await ec2.send(
      new CreateTransitGatewayRouteTableCommand({
        TransitGatewayId: data.transitGatewayId,
        TagSpecifications: tagSpecs.length > 0 ? tagSpecs : undefined,
      })
    );

    return {
      success: true,
      routeTableId: res.TransitGatewayRouteTable?.TransitGatewayRouteTableId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteTransitGatewayRouteTableAction(routeTableId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await ec2.send(new DeleteTransitGatewayRouteTableCommand({ TransitGatewayRouteTableId: routeTableId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function associateTransitGatewayRouteTableAction(
  routeTableId: string,
  attachmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new AssociateTransitGatewayRouteTableCommand({
        TransitGatewayRouteTableId: routeTableId,
        TransitGatewayAttachmentId: attachmentId,
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

export async function disassociateTransitGatewayRouteTableAction(
  routeTableId: string,
  attachmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new DisassociateTransitGatewayRouteTableCommand({
        TransitGatewayRouteTableId: routeTableId,
        TransitGatewayAttachmentId: attachmentId,
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

export async function enableTransitGatewayRouteTablePropagationAction(
  routeTableId: string,
  attachmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new EnableTransitGatewayRouteTablePropagationCommand({
        TransitGatewayRouteTableId: routeTableId,
        TransitGatewayAttachmentId: attachmentId,
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

export async function disableTransitGatewayRouteTablePropagationAction(
  routeTableId: string,
  attachmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new DisableTransitGatewayRouteTablePropagationCommand({
        TransitGatewayRouteTableId: routeTableId,
        TransitGatewayAttachmentId: attachmentId,
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

export async function createTransitGatewayRouteAction(data: {
  routeTableId: string;
  destinationCidrBlock: string;
  transitGatewayAttachmentId?: string;
  blackhole?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new CreateTransitGatewayRouteCommand({
        TransitGatewayRouteTableId: data.routeTableId,
        DestinationCidrBlock: data.destinationCidrBlock,
        TransitGatewayAttachmentId: data.transitGatewayAttachmentId,
        Blackhole: data.blackhole,
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

export async function deleteTransitGatewayRouteAction(
  routeTableId: string,
  destinationCidrBlock: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ec2.send(
      new DeleteTransitGatewayRouteCommand({
        TransitGatewayRouteTableId: routeTableId,
        DestinationCidrBlock: destinationCidrBlock,
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
