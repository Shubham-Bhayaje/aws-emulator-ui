"use server";

/**
 * src/app/cloudmap/actions.ts
 * Server actions for AWS Cloud Map (Service Discovery) interacting directly with the
 * AWS Emulator (https://127.0.0.1:9297) via @aws-sdk/client-servicediscovery in lib/aws.ts.
 */

import { serviceDiscovery, ec2 } from "@/lib/aws";
import {
  ListNamespacesCommand,
  GetNamespaceCommand,
  CreateHttpNamespaceCommand,
  CreatePrivateDnsNamespaceCommand,
  CreatePublicDnsNamespaceCommand,
  DeleteNamespaceCommand,
  ListServicesCommand,
  GetServiceCommand,
  CreateServiceCommand,
  DeleteServiceCommand,
  ListInstancesCommand,
  GetInstanceCommand,
  RegisterInstanceCommand,
  DeregisterInstanceCommand,
  DiscoverInstancesCommand,
  UpdateInstanceCustomHealthStatusCommand,
  GetInstancesHealthStatusCommand,
  GetOperationCommand,
  RoutingPolicy,
  RecordType,
  HealthStatusFilter,
  CustomHealthStatus,
} from "@aws-sdk/client-servicediscovery";
import { DescribeVpcsCommand } from "@aws-sdk/client-ec2";

// -------------------------------------------------------------
// 1. NAMESPACES
// -------------------------------------------------------------

export interface NamespaceItem {
  Id: string;
  Arn?: string;
  Name?: string;
  Type?: "HTTP" | "DNS_PUBLIC" | "DNS_PRIVATE";
  Description?: string;
  ServiceCount?: number;
  HostedZoneId?: string;
  VpcId?: string;
  CreateDate?: string;
}

export async function listNamespacesAction(): Promise<{
  success: boolean;
  namespaces: NamespaceItem[];
  error?: string;
}> {
  try {
    const res = await serviceDiscovery.send(new ListNamespacesCommand({}));
    const namespaces: NamespaceItem[] = (res.Namespaces || []).map((ns) => ({
      Id: ns.Id || "",
      Arn: ns.Arn,
      Name: ns.Name,
      Type: ns.Type as "HTTP" | "DNS_PUBLIC" | "DNS_PRIVATE" | undefined,
      Description: ns.Description,
      ServiceCount: ns.ServiceCount || 0,
      HostedZoneId: ns.Properties?.DnsProperties?.HostedZoneId,
      CreateDate: ns.CreateDate ? new Date(ns.CreateDate).toISOString() : undefined,
    }));
    return { success: true, namespaces };
  } catch (err: unknown) {
    return {
      success: false,
      namespaces: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getNamespaceAction(id: string): Promise<{
  success: boolean;
  namespace?: NamespaceItem;
  error?: string;
}> {
  try {
    const res = await serviceDiscovery.send(new GetNamespaceCommand({ Id: id }));
    if (!res.Namespace) {
      return { success: false, error: "Namespace not found" };
    }
    const ns = res.Namespace;
    return {
      success: true,
      namespace: {
        Id: ns.Id || id,
        Arn: ns.Arn,
        Name: ns.Name,
        Type: ns.Type as "HTTP" | "DNS_PUBLIC" | "DNS_PRIVATE" | undefined,
        Description: ns.Description,
        ServiceCount: ns.ServiceCount || 0,
        HostedZoneId: ns.Properties?.DnsProperties?.HostedZoneId,
        CreateDate: ns.CreateDate ? new Date(ns.CreateDate).toISOString() : undefined,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createHttpNamespaceAction(data: {
  name: string;
  description?: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; operationId?: string; error?: string }> {
  try {
    const res = await serviceDiscovery.send(
      new CreateHttpNamespaceCommand({
        Name: data.name.trim(),
        Description: data.description?.trim() || undefined,
        Tags: data.tags
          ? Object.entries(data.tags).map(([Key, Value]) => ({ Key, Value }))
          : undefined,
      })
    );
    return {
      success: true,
      operationId: res.OperationId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createPrivateDnsNamespaceAction(data: {
  name: string;
  vpcId: string;
  description?: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; operationId?: string; error?: string }> {
  try {
    const res = await serviceDiscovery.send(
      new CreatePrivateDnsNamespaceCommand({
        Name: data.name.trim(),
        Vpc: data.vpcId.trim(),
        Description: data.description?.trim() || undefined,
        Tags: data.tags
          ? Object.entries(data.tags).map(([Key, Value]) => ({ Key, Value }))
          : undefined,
      })
    );
    return {
      success: true,
      operationId: res.OperationId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createPublicDnsNamespaceAction(data: {
  name: string;
  description?: string;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; operationId?: string; error?: string }> {
  try {
    const res = await serviceDiscovery.send(
      new CreatePublicDnsNamespaceCommand({
        Name: data.name.trim(),
        Description: data.description?.trim() || undefined,
        Tags: data.tags
          ? Object.entries(data.tags).map(([Key, Value]) => ({ Key, Value }))
          : undefined,
      })
    );
    return {
      success: true,
      operationId: res.OperationId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteNamespaceAction(id: string): Promise<{
  success: boolean;
  operationId?: string;
  error?: string;
}> {
  try {
    const res = await serviceDiscovery.send(new DeleteNamespaceCommand({ Id: id }));
    return {
      success: true,
      operationId: res.OperationId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// -------------------------------------------------------------
// 2. SERVICES
// -------------------------------------------------------------

export interface ServiceItem {
  Id: string;
  Arn?: string;
  Name?: string;
  NamespaceId?: string;
  NamespaceName?: string;
  Description?: string;
  InstanceCount?: number;
  Type?: "HTTP" | "DNS_HTTP" | "DNS";
  RoutingPolicy?: string;
  DnsRecords?: { Type?: string; TTL?: number }[];
  HealthCheckCustomConfig?: { FailureThreshold?: number };
  CreateDate?: string;
}

export async function listServicesAction(): Promise<{
  success: boolean;
  services: ServiceItem[];
  error?: string;
}> {
  try {
    const [srvRes, nsRes] = await Promise.all([
      serviceDiscovery.send(new ListServicesCommand({})),
      serviceDiscovery.send(new ListNamespacesCommand({})),
    ]);

    const nsMap = new Map<string, string>();
    for (const ns of nsRes.Namespaces || []) {
      if (ns.Id && ns.Name) {
        nsMap.set(ns.Id, ns.Name);
      }
    }

    const services: ServiceItem[] = (srvRes.Services || []).map((s) => ({
      Id: s.Id || "",
      Arn: s.Arn,
      Name: s.Name,
      Description: s.Description,
      InstanceCount: s.InstanceCount || 0,
      DnsRecords: s.DnsConfig?.DnsRecords?.map((r) => ({
        Type: r.Type,
        TTL: r.TTL,
      })),
      RoutingPolicy: s.DnsConfig?.RoutingPolicy,
      HealthCheckCustomConfig: s.HealthCheckCustomConfig,
      CreateDate: s.CreateDate ? new Date(s.CreateDate).toISOString() : undefined,
    }));

    // If list does not populate NamespaceId on summary, describe each service
    for (const s of services) {
      if (!s.NamespaceId) {
        try {
          const detail = await serviceDiscovery.send(new GetServiceCommand({ Id: s.Id }));
          if (detail.Service) {
            s.NamespaceId = detail.Service.NamespaceId;
            s.NamespaceName = detail.Service.NamespaceId
              ? nsMap.get(detail.Service.NamespaceId)
              : undefined;
            s.Type = detail.Service.Type as "HTTP" | "DNS_HTTP" | "DNS" | undefined;
            s.RoutingPolicy = detail.Service.DnsConfig?.RoutingPolicy || s.RoutingPolicy;
          }
        } catch {
          // ignore detail error
        }
      } else {
        s.NamespaceName = nsMap.get(s.NamespaceId);
      }
    }

    return { success: true, services };
  } catch (err: unknown) {
    return {
      success: false,
      services: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getServiceAction(id: string): Promise<{
  success: boolean;
  service?: ServiceItem;
  error?: string;
}> {
  try {
    const res = await serviceDiscovery.send(new GetServiceCommand({ Id: id }));
    if (!res.Service) {
      return { success: false, error: "Service not found" };
    }
    const s = res.Service;

    let nsName: string | undefined = undefined;
    if (s.NamespaceId) {
      try {
        const nsRes = await serviceDiscovery.send(new GetNamespaceCommand({ Id: s.NamespaceId }));
        nsName = nsRes.Namespace?.Name;
      } catch {
        // ignore
      }
    }

    return {
      success: true,
      service: {
        Id: s.Id || id,
        Arn: s.Arn,
        Name: s.Name,
        NamespaceId: s.NamespaceId,
        NamespaceName: nsName,
        Description: s.Description,
        InstanceCount: s.InstanceCount || 0,
        Type: s.Type as "HTTP" | "DNS_HTTP" | "DNS" | undefined,
        RoutingPolicy: s.DnsConfig?.RoutingPolicy,
        DnsRecords: s.DnsConfig?.DnsRecords?.map((r) => ({
          Type: r.Type,
          TTL: r.TTL,
        })),
        HealthCheckCustomConfig: s.HealthCheckCustomConfig,
        CreateDate: s.CreateDate ? new Date(s.CreateDate).toISOString() : undefined,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createServiceAction(data: {
  name: string;
  namespaceId: string;
  description?: string;
  routingPolicy?: "MULTIVALUE" | "WEIGHTED";
  dnsRecordType?: "A" | "AAAA" | "SRV" | "CNAME";
  ttl?: number;
  healthCheckType?: "NONE" | "CUSTOM";
  failureThreshold?: number;
  tags?: Record<string, string>;
}): Promise<{ success: boolean; serviceId?: string; error?: string }> {
  try {
    // Check namespace type
    const nsRes = await serviceDiscovery.send(new GetNamespaceCommand({ Id: data.namespaceId }));
    const isHttp = nsRes.Namespace?.Type === "HTTP";

    const dnsConfig = !isHttp && data.dnsRecordType
      ? {
          RoutingPolicy: (data.routingPolicy || "MULTIVALUE") as RoutingPolicy,
          DnsRecords: [
            {
              Type: data.dnsRecordType as RecordType,
              TTL: data.ttl || 60,
            },
          ],
        }
      : undefined;

    const healthCheckCustomConfig =
      data.healthCheckType === "CUSTOM"
        ? {
            FailureThreshold: data.failureThreshold || 1,
          }
        : undefined;

    const res = await serviceDiscovery.send(
      new CreateServiceCommand({
        Name: data.name.trim(),
        NamespaceId: data.namespaceId,
        Description: data.description?.trim() || undefined,
        DnsConfig: dnsConfig,
        HealthCheckCustomConfig: healthCheckCustomConfig,
        Tags: data.tags
          ? Object.entries(data.tags).map(([Key, Value]) => ({ Key, Value }))
          : undefined,
      })
    );

    return {
      success: true,
      serviceId: res.Service?.Id,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteServiceAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await serviceDiscovery.send(new DeleteServiceCommand({ Id: id }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// -------------------------------------------------------------
// 3. INSTANCES
// -------------------------------------------------------------

export interface InstanceItem {
  Id: string;
  Attributes?: Record<string, string>;
  HealthStatus?: string;
  Ipv4?: string;
  Port?: string;
}

export async function listInstancesAction(serviceId: string): Promise<{
  success: boolean;
  instances: InstanceItem[];
  error?: string;
}> {
  try {
    const res = await serviceDiscovery.send(new ListInstancesCommand({ ServiceId: serviceId }));
    const instances: InstanceItem[] = (res.Instances || []).map((inst) => {
      const attrs = inst.Attributes || {};
      return {
        Id: inst.Id || "",
        Attributes: attrs,
        Ipv4: attrs["AWS_INSTANCE_IPV4"],
        Port: attrs["AWS_INSTANCE_PORT"],
      };
    });

    // Check health statuses if instances exist
    if (instances.length > 0) {
      try {
        const hsRes = await serviceDiscovery.send(
          new GetInstancesHealthStatusCommand({
            ServiceId: serviceId,
            Instances: instances.map((i) => i.Id),
          })
        );
        if (hsRes.Status) {
          for (const inst of instances) {
            inst.HealthStatus = hsRes.Status[inst.Id] || "UNKNOWN";
          }
        }
      } catch {
        // ignore health check lookup error
      }
    }

    return { success: true, instances };
  } catch (err: unknown) {
    return {
      success: false,
      instances: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function registerInstanceAction(data: {
  serviceId: string;
  instanceId: string;
  ipv4?: string;
  port?: string;
  customAttributes?: Record<string, string>;
}): Promise<{ success: boolean; operationId?: string; error?: string }> {
  try {
    const attributes: Record<string, string> = {};
    if (data.ipv4?.trim()) attributes["AWS_INSTANCE_IPV4"] = data.ipv4.trim();
    if (data.port?.trim()) attributes["AWS_INSTANCE_PORT"] = data.port.trim();

    if (data.customAttributes) {
      for (const [k, v] of Object.entries(data.customAttributes)) {
        if (k.trim() && v.trim()) {
          attributes[k.trim()] = v.trim();
        }
      }
    }

    const res = await serviceDiscovery.send(
      new RegisterInstanceCommand({
        ServiceId: data.serviceId,
        InstanceId: data.instanceId.trim(),
        Attributes: attributes,
      })
    );

    return {
      success: true,
      operationId: res.OperationId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deregisterInstanceAction(data: {
  serviceId: string;
  instanceId: string;
}): Promise<{ success: boolean; operationId?: string; error?: string }> {
  try {
    const res = await serviceDiscovery.send(
      new DeregisterInstanceCommand({
        ServiceId: data.serviceId,
        InstanceId: data.instanceId,
      })
    );
    return {
      success: true,
      operationId: res.OperationId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function updateInstanceHealthStatusAction(data: {
  serviceId: string;
  instanceId: string;
  status: "HEALTHY" | "UNHEALTHY";
}): Promise<{ success: boolean; error?: string }> {
  try {
    await serviceDiscovery.send(
      new UpdateInstanceCustomHealthStatusCommand({
        ServiceId: data.serviceId,
        InstanceId: data.instanceId,
        Status: data.status as CustomHealthStatus,
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

export async function discoverInstancesAction(data: {
  namespaceName: string;
  serviceName: string;
  queryParameters?: Record<string, string>;
}): Promise<{
  success: boolean;
  instances: {
    InstanceId?: string;
    NamespaceName?: string;
    ServiceName?: string;
    HealthStatus?: string;
    Attributes?: Record<string, string>;
  }[];
  instancesRevision?: number;
  error?: string;
}> {
  try {
    const res = await serviceDiscovery.send(
      new DiscoverInstancesCommand({
        NamespaceName: data.namespaceName.trim(),
        ServiceName: data.serviceName.trim(),
        QueryParameters: data.queryParameters,
        HealthStatus: "ALL" as HealthStatusFilter,
      })
    );
    return {
      success: true,
      instances: (res.Instances || []).map((i) => ({
        InstanceId: i.InstanceId,
        NamespaceName: i.NamespaceName,
        ServiceName: i.ServiceName,
        HealthStatus: i.HealthStatus,
        Attributes: i.Attributes,
      })),
      instancesRevision: res.InstancesRevision,
    };
  } catch (err: unknown) {
    return {
      success: false,
      instances: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// -------------------------------------------------------------
// 4. VPCS (FOR PRIVATE DNS NAMESPACE CREATION)
// -------------------------------------------------------------

export interface VpcItem {
  VpcId: string;
  CidrBlock?: string;
  IsDefault?: boolean;
}

export async function listVpcsAction(): Promise<VpcItem[]> {
  try {
    const res = await ec2.send(new DescribeVpcsCommand({}));
    return (res.Vpcs || []).map((v) => ({
      VpcId: v.VpcId || "",
      CidrBlock: v.CidrBlock,
      IsDefault: v.IsDefault,
    }));
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// 5. DASHBOARD STATS
// -------------------------------------------------------------

export interface CloudMapStats {
  namespacesCount: number;
  httpNamespacesCount: number;
  privateDnsNamespacesCount: number;
  publicDnsNamespacesCount: number;
  servicesCount: number;
  instancesCount: number;
}

export async function getCloudMapDashboardStatsAction(): Promise<CloudMapStats> {
  const [nsRes, srvRes] = await Promise.all([
    listNamespacesAction(),
    listServicesAction(),
  ]);

  const nsList = nsRes.namespaces || [];
  const srvList = srvRes.services || [];

  let httpCount = 0;
  let privateDnsCount = 0;
  let publicDnsCount = 0;

  for (const ns of nsList) {
    if (ns.Type === "HTTP") httpCount++;
    else if (ns.Type === "DNS_PRIVATE") privateDnsCount++;
    else if (ns.Type === "DNS_PUBLIC") publicDnsCount++;
  }

  let totalInstances = 0;
  for (const s of srvList) {
    totalInstances += s.InstanceCount || 0;
  }

  return {
    namespacesCount: nsList.length,
    httpNamespacesCount: httpCount,
    privateDnsNamespacesCount: privateDnsCount,
    publicDnsNamespacesCount: publicDnsCount,
    servicesCount: srvList.length,
    instancesCount: totalInstances,
  };
}
