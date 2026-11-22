"use server";

import {
  DescribeConnectionsCommand,
  CreateConnectionCommand,
  DeleteConnectionCommand,
  DescribeDirectConnectGatewaysCommand,
  CreateDirectConnectGatewayCommand,
  DeleteDirectConnectGatewayCommand,
  DescribeVirtualInterfacesCommand,
  CreatePrivateVirtualInterfaceCommand,
  CreatePublicVirtualInterfaceCommand,
  CreateTransitVirtualInterfaceCommand,
  DeleteVirtualInterfaceCommand,
  DescribeLocationsCommand,
  DescribeLagsCommand,
} from "@aws-sdk/client-direct-connect";
import { DescribeVpnGatewaysCommand } from "@aws-sdk/client-ec2";
import { directConnect, ec2 } from "@/lib/aws";
import { listTransitGatewaysAction } from "../vpc/transit-gateway-actions";

export interface DxConnectionItem {
  connectionId: string;
  connectionName?: string;
  connectionState?: string;
  region?: string;
  location?: string;
  bandwidth?: string;
  vlan?: number;
  partnerName?: string;
  loaIssueTime?: string;
  lagId?: string;
  awsDevice?: string;
  jumboFrameCapable?: boolean;
  awsDeviceV2?: string;
  awsLogicalDeviceId?: string;
  hasLogicalRedundancy?: string;
  tags?: Array<{ key?: string; value?: string }>;
  providerName?: string;
  macSecCapable?: boolean;
  portEncryptionStatus?: string;
  encryptionMode?: string;
}

export interface DxGatewayItem {
  directConnectGatewayId: string;
  directConnectGatewayName?: string;
  amazonSideAsn?: number;
  ownerAccount?: string;
  directConnectGatewayState?: string;
  stateChangeError?: string;
}

export interface DxVirtualInterfaceItem {
  virtualInterfaceId: string;
  connectionId?: string;
  location?: string;
  virtualInterfaceType?: string;
  virtualInterfaceName?: string;
  vlan?: number;
  asn?: number;
  amazonSideAsn?: number;
  authKey?: string;
  amazonAddress?: string;
  customerAddress?: string;
  addressFamily?: string;
  virtualInterfaceState?: string;
  customerRouterConfig?: string;
  mtu?: number;
  jumboFrameCapable?: boolean;
  directConnectGatewayId?: string;
  routeFilterPrefixes?: Array<{ cidr?: string }>;
  bgpPeers?: Array<{
    bgpPeerId?: string;
    asn?: number;
    authKey?: string;
    addressFamily?: string;
    amazonAddress?: string;
    customerAddress?: string;
    bgpPeerState?: string;
    bgpStatus?: string;
  }>;
  region?: string;
  awsDeviceV2?: string;
  awsLogicalDeviceId?: string;
  tags?: Array<{ key?: string; value?: string }>;
}

export interface DxLocationItem {
  locationCode: string;
  locationName: string;
  region: string;
  availablePortSpeeds: string[];
  availableProviders: string[];
  availableMacSecPortSpeeds: string[];
}

export interface DxLagItem {
  lagId: string;
  lagName?: string;
  lagState?: string;
  location?: string;
  connectionsBandwidth?: string;
  numberOfConnections?: number;
  ownerAccount?: string;
}

export async function listLocationsAction(): Promise<{
  success: boolean;
  locations: DxLocationItem[];
  error?: string;
}> {
  try {
    const res = await directConnect.send(new DescribeLocationsCommand({}));
    const locations: DxLocationItem[] = (res.locations || []).map((loc) => ({
      locationCode: loc.locationCode || "",
      locationName: loc.locationName || loc.locationCode || "",
      region: loc.region || "us-east-1",
      availablePortSpeeds: loc.availablePortSpeeds || ["1Gbps", "10Gbps"],
      availableProviders: loc.availableProviders || [],
      availableMacSecPortSpeeds: loc.availableMacSecPortSpeeds || [],
    }));

    return { success: true, locations };
  } catch (err: unknown) {
    return {
      success: false,
      locations: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function listConnectionsAction(): Promise<{
  success: boolean;
  connections: DxConnectionItem[];
  error?: string;
}> {
  try {
    const res = await directConnect.send(new DescribeConnectionsCommand({}));
    const connections: DxConnectionItem[] = (res.connections || []).map((c) => ({
      connectionId: c.connectionId || "",
      connectionName: c.connectionName || c.connectionId || "",
      connectionState: c.connectionState || "requested",
      region: c.region || "us-east-1",
      location: c.location || "",
      bandwidth: c.bandwidth || "1Gbps",
      vlan: c.vlan,
      partnerName: c.partnerName,
      loaIssueTime: c.loaIssueTime ? new Date(c.loaIssueTime).toISOString() : undefined,
      lagId: c.lagId,
      awsDevice: c.awsDevice,
      jumboFrameCapable: c.jumboFrameCapable,
      awsDeviceV2: c.awsDeviceV2,
      awsLogicalDeviceId: c.awsLogicalDeviceId,
      hasLogicalRedundancy: c.hasLogicalRedundancy,
      tags: c.tags?.map((t) => ({ key: t.key, value: t.value })),
      providerName: c.providerName,
      macSecCapable: c.macSecCapable,
      portEncryptionStatus: c.portEncryptionStatus,
      encryptionMode: c.encryptionMode,
    }));

    return { success: true, connections };
  } catch (err: unknown) {
    return {
      success: false,
      connections: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getConnectionDetailAction(connectionId: string): Promise<{
  success: boolean;
  connection?: DxConnectionItem;
  virtualInterfaces: DxVirtualInterfaceItem[];
  error?: string;
}> {
  try {
    const [connRes, vifsRes] = await Promise.all([
      directConnect.send(new DescribeConnectionsCommand({ connectionId })),
      directConnect.send(new DescribeVirtualInterfacesCommand({ connectionId })).catch(() => ({ virtualInterfaces: [] })),
    ]);

    const c = connRes.connections?.[0];
    if (!c) {
      return {
        success: false,
        virtualInterfaces: [],
        error: `Connection ${connectionId} not found`,
      };
    }

    const connection: DxConnectionItem = {
      connectionId: c.connectionId || "",
      connectionName: c.connectionName || c.connectionId || "",
      connectionState: c.connectionState || "requested",
      region: c.region || "us-east-1",
      location: c.location || "",
      bandwidth: c.bandwidth || "1Gbps",
      vlan: c.vlan,
      partnerName: c.partnerName,
      loaIssueTime: c.loaIssueTime ? new Date(c.loaIssueTime).toISOString() : undefined,
      lagId: c.lagId,
      awsDevice: c.awsDevice,
      jumboFrameCapable: c.jumboFrameCapable,
      awsDeviceV2: c.awsDeviceV2,
      awsLogicalDeviceId: c.awsLogicalDeviceId,
      hasLogicalRedundancy: c.hasLogicalRedundancy,
      tags: c.tags?.map((t) => ({ key: t.key, value: t.value })),
      providerName: c.providerName,
      macSecCapable: c.macSecCapable,
      portEncryptionStatus: c.portEncryptionStatus,
      encryptionMode: c.encryptionMode,
    };

    const virtualInterfaces: DxVirtualInterfaceItem[] = (vifsRes.virtualInterfaces || []).map((v) => ({
      virtualInterfaceId: v.virtualInterfaceId || "",
      connectionId: v.connectionId,
      location: v.location,
      virtualInterfaceType: v.virtualInterfaceType,
      virtualInterfaceName: v.virtualInterfaceName,
      vlan: v.vlan,
      asn: v.asn,
      amazonSideAsn: v.amazonSideAsn,
      authKey: v.authKey,
      amazonAddress: v.amazonAddress,
      customerAddress: v.customerAddress,
      addressFamily: v.addressFamily,
      virtualInterfaceState: v.virtualInterfaceState,
      customerRouterConfig: v.customerRouterConfig,
      mtu: v.mtu,
      jumboFrameCapable: v.jumboFrameCapable,
      directConnectGatewayId: v.directConnectGatewayId,
      routeFilterPrefixes: v.routeFilterPrefixes?.map((rf) => ({ cidr: rf.cidr })),
      bgpPeers: v.bgpPeers?.map((bp) => ({
        bgpPeerId: bp.bgpPeerId,
        asn: bp.asn,
        authKey: bp.authKey,
        addressFamily: bp.addressFamily,
        amazonAddress: bp.amazonAddress,
        customerAddress: bp.customerAddress,
        bgpPeerState: bp.bgpPeerState,
        bgpStatus: bp.bgpStatus,
      })),
      region: v.region,
      awsDeviceV2: v.awsDeviceV2,
      awsLogicalDeviceId: v.awsLogicalDeviceId,
      tags: v.tags?.map((t) => ({ key: t.key, value: t.value })),
    }));

    return {
      success: true,
      connection,
      virtualInterfaces,
    };
  } catch (err: unknown) {
    return {
      success: false,
      virtualInterfaces: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createConnectionAction(data: {
  connectionName: string;
  location: string;
  bandwidth: string;
  requestMacSec?: boolean;
  tags?: Array<{ key: string; value: string }>;
}): Promise<{
  success: boolean;
  connectionId?: string;
  error?: string;
}> {
  try {
    const res = await directConnect.send(
      new CreateConnectionCommand({
        connectionName: data.connectionName.trim(),
        location: data.location.trim(),
        bandwidth: data.bandwidth.trim(),
        requestMacSec: data.requestMacSec ?? false,
        tags: (data.tags || []).filter((t) => t.key.trim()).map((t) => ({ key: t.key.trim(), value: t.value.trim() })),
      })
    );

    return {
      success: true,
      connectionId: res.connectionId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteConnectionAction(connectionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await directConnect.send(
      new DeleteConnectionCommand({
        connectionId,
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

export async function listDirectConnectGatewaysAction(): Promise<{
  success: boolean;
  gateways: DxGatewayItem[];
  error?: string;
}> {
  try {
    const res = await directConnect.send(new DescribeDirectConnectGatewaysCommand({}));
    const gateways: DxGatewayItem[] = (res.directConnectGateways || []).map((gw) => ({
      directConnectGatewayId: gw.directConnectGatewayId || "",
      directConnectGatewayName: gw.directConnectGatewayName || gw.directConnectGatewayId || "",
      amazonSideAsn: gw.amazonSideAsn,
      ownerAccount: gw.ownerAccount,
      directConnectGatewayState: gw.directConnectGatewayState || "available",
      stateChangeError: gw.stateChangeError,
    }));

    return { success: true, gateways };
  } catch (err: unknown) {
    return {
      success: false,
      gateways: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getDirectConnectGatewayDetailAction(directConnectGatewayId: string): Promise<{
  success: boolean;
  gateway?: DxGatewayItem;
  virtualInterfaces: DxVirtualInterfaceItem[];
  error?: string;
}> {
  try {
    const [gwRes, vifsRes] = await Promise.all([
      directConnect.send(new DescribeDirectConnectGatewaysCommand({ directConnectGatewayId })),
      directConnect.send(new DescribeVirtualInterfacesCommand({})).catch(() => ({ virtualInterfaces: [] })),
    ]);

    const gw = gwRes.directConnectGateways?.[0];
    if (!gw) {
      return {
        success: false,
        virtualInterfaces: [],
        error: `Direct Connect Gateway ${directConnectGatewayId} not found`,
      };
    }

    const gateway: DxGatewayItem = {
      directConnectGatewayId: gw.directConnectGatewayId || "",
      directConnectGatewayName: gw.directConnectGatewayName || gw.directConnectGatewayId || "",
      amazonSideAsn: gw.amazonSideAsn,
      ownerAccount: gw.ownerAccount,
      directConnectGatewayState: gw.directConnectGatewayState || "available",
      stateChangeError: gw.stateChangeError,
    };

    const virtualInterfaces = (vifsRes.virtualInterfaces || [])
      .filter((v) => v.directConnectGatewayId === directConnectGatewayId)
      .map((v) => ({
        virtualInterfaceId: v.virtualInterfaceId || "",
        connectionId: v.connectionId,
        location: v.location,
        virtualInterfaceType: v.virtualInterfaceType,
        virtualInterfaceName: v.virtualInterfaceName,
        vlan: v.vlan,
        asn: v.asn,
        amazonSideAsn: v.amazonSideAsn,
        authKey: v.authKey,
        amazonAddress: v.amazonAddress,
        customerAddress: v.customerAddress,
        addressFamily: v.addressFamily,
        virtualInterfaceState: v.virtualInterfaceState,
        customerRouterConfig: v.customerRouterConfig,
        mtu: v.mtu,
        jumboFrameCapable: v.jumboFrameCapable,
        directConnectGatewayId: v.directConnectGatewayId,
        routeFilterPrefixes: v.routeFilterPrefixes?.map((rf) => ({ cidr: rf.cidr })),
        region: v.region,
      }));

    return {
      success: true,
      gateway,
      virtualInterfaces,
    };
  } catch (err: unknown) {
    return {
      success: false,
      virtualInterfaces: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createDirectConnectGatewayAction(data: {
  directConnectGatewayName: string;
  amazonSideAsn?: number;
}): Promise<{
  success: boolean;
  directConnectGatewayId?: string;
  error?: string;
}> {
  try {
    const res = await directConnect.send(
      new CreateDirectConnectGatewayCommand({
        directConnectGatewayName: data.directConnectGatewayName.trim(),
        amazonSideAsn: data.amazonSideAsn || 64512,
      })
    );

    return {
      success: true,
      directConnectGatewayId: res.directConnectGateway?.directConnectGatewayId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteDirectConnectGatewayAction(directConnectGatewayId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await directConnect.send(
      new DeleteDirectConnectGatewayCommand({
        directConnectGatewayId,
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

export async function listVirtualInterfacesAction(): Promise<{
  success: boolean;
  virtualInterfaces: DxVirtualInterfaceItem[];
  error?: string;
}> {
  try {
    const res = await directConnect.send(new DescribeVirtualInterfacesCommand({}));
    const virtualInterfaces: DxVirtualInterfaceItem[] = (res.virtualInterfaces || []).map((v) => ({
      virtualInterfaceId: v.virtualInterfaceId || "",
      connectionId: v.connectionId,
      location: v.location,
      virtualInterfaceType: v.virtualInterfaceType,
      virtualInterfaceName: v.virtualInterfaceName || v.virtualInterfaceId || "",
      vlan: v.vlan,
      asn: v.asn,
      amazonSideAsn: v.amazonSideAsn,
      authKey: v.authKey,
      amazonAddress: v.amazonAddress,
      customerAddress: v.customerAddress,
      addressFamily: v.addressFamily,
      virtualInterfaceState: v.virtualInterfaceState || "available",
      customerRouterConfig: v.customerRouterConfig,
      mtu: v.mtu,
      jumboFrameCapable: v.jumboFrameCapable,
      directConnectGatewayId: v.directConnectGatewayId,
      routeFilterPrefixes: v.routeFilterPrefixes?.map((rf) => ({ cidr: rf.cidr })),
      bgpPeers: v.bgpPeers?.map((bp) => ({
        bgpPeerId: bp.bgpPeerId,
        asn: bp.asn,
        authKey: bp.authKey,
        addressFamily: bp.addressFamily,
        amazonAddress: bp.amazonAddress,
        customerAddress: bp.customerAddress,
        bgpPeerState: bp.bgpPeerState,
        bgpStatus: bp.bgpStatus,
      })),
      region: v.region,
      awsDeviceV2: v.awsDeviceV2,
      awsLogicalDeviceId: v.awsLogicalDeviceId,
      tags: v.tags?.map((t) => ({ key: t.key, value: t.value })),
    }));

    return { success: true, virtualInterfaces };
  } catch (err: unknown) {
    return {
      success: false,
      virtualInterfaces: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getVirtualInterfaceDetailAction(virtualInterfaceId: string): Promise<{
  success: boolean;
  virtualInterface?: DxVirtualInterfaceItem;
  error?: string;
}> {
  try {
    const res = await directConnect.send(
      new DescribeVirtualInterfacesCommand({
        virtualInterfaceId,
      })
    );

    const v = res.virtualInterfaces?.[0];
    if (!v) {
      return {
        success: false,
        error: `Virtual Interface ${virtualInterfaceId} not found`,
      };
    }

    const virtualInterface: DxVirtualInterfaceItem = {
      virtualInterfaceId: v.virtualInterfaceId || "",
      connectionId: v.connectionId,
      location: v.location,
      virtualInterfaceType: v.virtualInterfaceType,
      virtualInterfaceName: v.virtualInterfaceName || v.virtualInterfaceId || "",
      vlan: v.vlan,
      asn: v.asn,
      amazonSideAsn: v.amazonSideAsn,
      authKey: v.authKey,
      amazonAddress: v.amazonAddress,
      customerAddress: v.customerAddress,
      addressFamily: v.addressFamily,
      virtualInterfaceState: v.virtualInterfaceState || "available",
      customerRouterConfig: v.customerRouterConfig,
      mtu: v.mtu,
      jumboFrameCapable: v.jumboFrameCapable,
      directConnectGatewayId: v.directConnectGatewayId,
      routeFilterPrefixes: v.routeFilterPrefixes?.map((rf) => ({ cidr: rf.cidr })),
      bgpPeers: v.bgpPeers?.map((bp) => ({
        bgpPeerId: bp.bgpPeerId,
        asn: bp.asn,
        authKey: bp.authKey,
        addressFamily: bp.addressFamily,
        amazonAddress: bp.amazonAddress,
        customerAddress: bp.customerAddress,
        bgpPeerState: bp.bgpPeerState,
        bgpStatus: bp.bgpStatus,
      })),
      region: v.region,
      awsDeviceV2: v.awsDeviceV2,
      awsLogicalDeviceId: v.awsLogicalDeviceId,
      tags: v.tags?.map((t) => ({ key: t.key, value: t.value })),
    };

    return { success: true, virtualInterface };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createVirtualInterfaceAction(data: {
  connectionId: string;
  type: "private" | "public" | "transit";
  name: string;
  vlan: number;
  asn: number;
  authKey?: string;
  amazonAddress?: string;
  customerAddress?: string;
  addressFamily?: "ipv4" | "ipv6";
  directConnectGatewayId?: string;
  vpnGatewayId?: string;
  tags?: Array<{ key: string; value: string }>;
}): Promise<{
  success: boolean;
  virtualInterfaceId?: string;
  error?: string;
}> {
  try {
    if (data.type === "private") {
      const res = await directConnect.send(
        new CreatePrivateVirtualInterfaceCommand({
          connectionId: data.connectionId,
          newPrivateVirtualInterface: {
            virtualInterfaceName: data.name.trim(),
            vlan: data.vlan,
            asn: data.asn,
            authKey: data.authKey?.trim() || undefined,
            amazonAddress: data.amazonAddress?.trim() || undefined,
            customerAddress: data.customerAddress?.trim() || undefined,
            addressFamily: data.addressFamily || "ipv4",
            directConnectGatewayId: data.directConnectGatewayId || undefined,
            vpnGatewayId: data.vpnGatewayId || undefined,
            tags: (data.tags || []).filter((t) => t.key.trim()).map((t) => ({ key: t.key.trim(), value: t.value.trim() })),
          },
        })
      );
      return {
        success: true,
        virtualInterfaceId: res.virtualInterfaceId,
      };
    } else if (data.type === "transit") {
      const res = await directConnect.send(
        new CreateTransitVirtualInterfaceCommand({
          connectionId: data.connectionId,
          newTransitVirtualInterface: {
            virtualInterfaceName: data.name.trim(),
            vlan: data.vlan,
            asn: data.asn,
            authKey: data.authKey?.trim() || undefined,
            amazonAddress: data.amazonAddress?.trim() || undefined,
            customerAddress: data.customerAddress?.trim() || undefined,
            addressFamily: data.addressFamily || "ipv4",
            directConnectGatewayId: data.directConnectGatewayId,
            tags: (data.tags || []).filter((t) => t.key.trim()).map((t) => ({ key: t.key.trim(), value: t.value.trim() })),
          },
        })
      );
      return {
        success: true,
        virtualInterfaceId: res.virtualInterface?.virtualInterfaceId,
      };
    } else {
      const res = await directConnect.send(
        new CreatePublicVirtualInterfaceCommand({
          connectionId: data.connectionId,
          newPublicVirtualInterface: {
            virtualInterfaceName: data.name.trim(),
            vlan: data.vlan,
            asn: data.asn,
            authKey: data.authKey?.trim() || undefined,
            amazonAddress: data.amazonAddress?.trim() || undefined,
            customerAddress: data.customerAddress?.trim() || undefined,
            addressFamily: data.addressFamily || "ipv4",
            routeFilterPrefixes: [{ cidr: "203.0.113.0/24" }],
            tags: (data.tags || []).filter((t) => t.key.trim()).map((t) => ({ key: t.key.trim(), value: t.value.trim() })),
          },
        })
      );
      return {
        success: true,
        virtualInterfaceId: res.virtualInterfaceId,
      };
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteVirtualInterfaceAction(virtualInterfaceId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await directConnect.send(
      new DeleteVirtualInterfaceCommand({
        virtualInterfaceId,
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

export async function getDirectConnectDependenciesAction(): Promise<{
  success: boolean;
  vpnGateways: Array<{ VpnGatewayId: string; Name?: string }>;
  transitGateways: Array<{ TransitGatewayId: string; Name?: string }>;
  directConnectGateways: DxGatewayItem[];
  connections: DxConnectionItem[];
  locations: DxLocationItem[];
}> {
  try {
    const [vgwRes, tgwRes, dxgwRes, connRes, locRes] = await Promise.all([
      ec2.send(new DescribeVpnGatewaysCommand({})).catch(() => ({ VpnGateways: [] })),
      listTransitGatewaysAction().catch(() => ({ success: true, transitGateways: [] })),
      listDirectConnectGatewaysAction().catch(() => ({ success: true, gateways: [] })),
      listConnectionsAction().catch(() => ({ success: true, connections: [] })),
      listLocationsAction().catch(() => ({ success: true, locations: [] })),
    ]);

    const vpnGateways = (vgwRes.VpnGateways || [])
      .filter((v) => v.State !== "deleted")
      .map((v) => ({
        VpnGatewayId: v.VpnGatewayId || "",
        Name: v.Tags?.find((t) => t.Key === "Name")?.Value,
      }));

    return {
      success: true,
      vpnGateways,
      transitGateways: tgwRes.success ? tgwRes.transitGateways.map((t) => ({ TransitGatewayId: t.TransitGatewayId, Name: t.Name })) : [],
      directConnectGateways: dxgwRes.success ? dxgwRes.gateways : [],
      connections: connRes.success ? connRes.connections : [],
      locations: locRes.success ? locRes.locations : [],
    };
  } catch {
    return {
      success: false,
      vpnGateways: [],
      transitGateways: [],
      directConnectGateways: [],
      connections: [],
      locations: [],
    };
  }
}

export async function generateLoaCfaAction(connectionId: string): Promise<{
  success: boolean;
  documentTitle: string;
  documentContent: string;
  error?: string;
}> {
  try {
    const detail = await getConnectionDetailAction(connectionId);
    if (!detail.success || !detail.connection) {
      throw new Error(detail.error || "Connection not found");
    }

    const c = detail.connection;
    const docDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const content = `================================================================================
LETTER OF AUTHORIZATION AND CONNECTING FACILITY ASSIGNMENT (LOA-CFA)
Amazon Web Services - AWS Direct Connect
================================================================================

Date: ${docDate}
Subject: Authorization for Cross-Connect to AWS Direct Connect Facility

TO WHOM IT MAY CONCERN / COLOCATION FACILITY OPERATOR:

This letter serves as formal authorization for the Colocation Facility Provider
to install and cross-connect physical cabling for the AWS customer specified below.

CUSTOMER & ACCOUNT INFORMATION:
--------------------------------------------------------------------------------
AWS Account ID:          000000000000
Connection ID:           ${c.connectionId}
Connection Name:         ${c.connectionName || c.connectionId}
Port Speed / Bandwidth:  ${c.bandwidth}
Facility Location Code:  ${c.location}
AWS Region:              ${c.region}

CONNECTING FACILITY ASSIGNMENT (CFA) DETAILS:
--------------------------------------------------------------------------------
AWS Patch Panel / Demarc:  PP-AWS-DC2-RACK-04.B
AWS Port / Jack:           Port 24 (Single-Mode Fiber 1310nm LC)
AWS Device ID:             ${c.awsDeviceV2 || c.awsDevice || "EqDC2-109a02tymf4mx"}
AWS Logical Device:        ${c.awsLogicalDeviceId || "EqDC2-2zzwswf2nob7w"}
Media Type:                1000BASE-LX (1Gbps) / 10GBASE-LR (10Gbps) Single Mode
Connector Type:            Duplex LC

INSTRUCTIONS FOR FACILITY TECHNICIAN:
--------------------------------------------------------------------------------
1. Complete optical cross-connect between customer demarcation and the AWS CFA port.
2. Verify optical light levels: Tx power -8.2 dBm to +0.5 dBm; Rx sensitivity > -14.4 dBm.
3. Once cabling is complete, the physical link state will transition to 'available'.
4. BGP peering sessions can then be established on configured Virtual Interfaces.

Authorized Signature:
AWS Direct Connect Interconnect Operations Team
Amazon Web Services, Inc.
================================================================================`;

    return {
      success: true,
      documentTitle: `LOA-CFA-${c.connectionId}.txt`,
      documentContent: content,
    };
  } catch (err: unknown) {
    return {
      success: false,
      documentTitle: "LOA-CFA.txt",
      documentContent: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getDxDependencyDataAction() {
  return getDirectConnectDependenciesAction();
}

export async function listLagsAction(): Promise<{
  success: boolean;
  lags: DxLagItem[];
  error?: string;
}> {
  try {
    const res = await directConnect.send(new DescribeLagsCommand({})).catch(() => ({ lags: [] }));
    const lags: DxLagItem[] = (res.lags || []).map((l) => ({
      lagId: l.lagId || "",
      lagName: l.lagName,
      lagState: l.lagState,
      location: l.location,
      connectionsBandwidth: l.connectionsBandwidth,
      numberOfConnections: l.numberOfConnections,
      ownerAccount: l.ownerAccount,
    }));
    return { success: true, lags };
  } catch {
    return {
      success: true,
      lags: [],
    };
  }
}
