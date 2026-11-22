"use server";

import {
  ListResolverEndpointsCommand,
  GetResolverEndpointCommand,
  CreateResolverEndpointCommand,
  DeleteResolverEndpointCommand,
  ListResolverEndpointIpAddressesCommand,
  ListResolverRulesCommand,
  GetResolverRuleCommand,
  CreateResolverRuleCommand,
  DeleteResolverRuleCommand,
  ListResolverRuleAssociationsCommand,
  AssociateResolverRuleCommand,
  DisassociateResolverRuleCommand,
  ListResolverQueryLogConfigsCommand,
  GetResolverQueryLogConfigCommand,
  CreateResolverQueryLogConfigCommand,
  DeleteResolverQueryLogConfigCommand,
  ListResolverQueryLogConfigAssociationsCommand,
  AssociateResolverQueryLogConfigCommand,
  DisassociateResolverQueryLogConfigCommand,
  ListFirewallConfigsCommand,
  ListFirewallDomainListsCommand,
  ListFirewallRuleGroupsCommand,
} from "@aws-sdk/client-route53resolver";
import {
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import { DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { ListBucketsCommand } from "@aws-sdk/client-s3";
import { route53Resolver, ec2, cloudwatchLogs, s3 } from "@/lib/aws";

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export interface ResolverEndpointItem {
  id: string;
  name?: string;
  arn?: string;
  creatorRequestId?: string;
  securityGroupIds?: string[];
  direction?: "INBOUND" | "OUTBOUND" | string;
  ipAddressCount?: number;
  hostVpcId?: string;
  status?: string;
  statusMessage?: string;
  creationTime?: string;
  modificationTime?: string;
  protocols?: string[];
}

export interface ResolverEndpointIpAddressItem {
  ipId?: string;
  subnetId?: string;
  ip?: string;
  status?: string;
  statusMessage?: string;
  creationTime?: string;
  modificationTime?: string;
}

export interface ResolverRuleItem {
  id: string;
  creatorRequestId?: string;
  arn?: string;
  domainName?: string;
  status?: string;
  statusMessage?: string;
  ruleType?: "FORWARD" | "SYSTEM" | "RECURSIVE" | string;
  name?: string;
  targetIps?: Array<{ ip?: string; port?: number; protocol?: string }>;
  resolverEndpointId?: string;
  ownerId?: string;
  shareStatus?: string;
  creationTime?: string;
  modificationTime?: string;
  associationCount?: number;
}

export interface ResolverRuleAssociationItem {
  id: string;
  resolverRuleId: string;
  name?: string;
  vpcId: string;
  status?: string;
  statusMessage?: string;
}

export interface ResolverQueryLogConfigItem {
  id: string;
  ownerId?: string;
  status?: string;
  shareStatus?: string;
  associationCount?: number;
  arn?: string;
  name?: string;
  destinationArn?: string;
  creatorRequestId?: string;
  creationTime?: string;
}

export interface ResolverQueryLogConfigAssociationItem {
  id: string;
  resolverQueryLogConfigId: string;
  resourceId: string; // VPC ID
  status?: string;
  error?: string;
  errorMessage?: string;
  creationTime?: string;
}

export interface FirewallConfigItem {
  id: string;
  resourceId: string;
  ownerId?: string;
  firewallFailOpen?: string;
}

export interface FirewallDomainListItem {
  id: string;
  arn?: string;
  name?: string;
  domainCount?: number;
  status?: string;
  statusMessage?: string;
  creatorRequestId?: string;
  managedOwnerName?: string;
  creationTime?: string;
  modificationTime?: string;
}

export interface FirewallRuleGroupItem {
  id: string;
  arn?: string;
  name?: string;
  ruleCount?: number;
  status?: string;
  statusMessage?: string;
  ownerId?: string;
  creatorRequestId?: string;
  shareStatus?: string;
  creationTime?: string;
  modificationTime?: string;
}

export interface ResolverDependenciesData {
  vpcs: Array<{ vpcId: string; name?: string; cidrBlock?: string }>;
  subnets: Array<{ subnetId: string; vpcId: string; availabilityZone?: string; cidrBlock?: string; name?: string }>;
  securityGroups: Array<{ groupId: string; groupName: string; vpcId?: string; description?: string }>;
  logGroups: Array<{ logGroupName: string; arn?: string }>;
  s3Buckets: Array<{ name: string; creationDate?: string }>;
}

// ---------------------------------------------------------------------------
// Resolver Endpoints Actions
// ---------------------------------------------------------------------------

export async function listResolverEndpointsAction(): Promise<{
  success: boolean;
  endpoints: ResolverEndpointItem[];
  error?: string;
}> {
  try {
    const res = await route53Resolver.send(new ListResolverEndpointsCommand({ MaxResults: 100 }));
    const endpoints: ResolverEndpointItem[] = (res.ResolverEndpoints || []).map((ep) => ({
      id: ep.Id || "",
      name: ep.Name || ep.Id || "",
      arn: ep.Arn,
      creatorRequestId: ep.CreatorRequestId,
      securityGroupIds: ep.SecurityGroupIds || [],
      direction: ep.Direction,
      ipAddressCount: ep.IpAddressCount || 0,
      hostVpcId: ep.HostVPCId,
      status: ep.Status,
      statusMessage: ep.StatusMessage,
      creationTime: ep.CreationTime,
      modificationTime: ep.ModificationTime,
      protocols: ep.Protocols || ["Do53"],
    }));

    return { success: true, endpoints };
  } catch (err: unknown) {
    return {
      success: false,
      endpoints: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getResolverEndpointDetailAction(endpointId: string): Promise<{
  success: boolean;
  endpoint?: ResolverEndpointItem;
  ipAddresses: ResolverEndpointIpAddressItem[];
  error?: string;
}> {
  try {
    const [epRes, ipsRes] = await Promise.all([
      route53Resolver.send(new GetResolverEndpointCommand({ ResolverEndpointId: endpointId })),
      route53Resolver.send(new ListResolverEndpointIpAddressesCommand({ ResolverEndpointId: endpointId, MaxResults: 100 })).catch(() => ({ IpAddresses: [] })),
    ]);

    const ep = epRes.ResolverEndpoint;
    if (!ep) {
      return {
        success: false,
        ipAddresses: [],
        error: `Resolver endpoint ${endpointId} not found`,
      };
    }

    const endpoint: ResolverEndpointItem = {
      id: ep.Id || "",
      name: ep.Name || ep.Id || "",
      arn: ep.Arn,
      creatorRequestId: ep.CreatorRequestId,
      securityGroupIds: ep.SecurityGroupIds || [],
      direction: ep.Direction,
      ipAddressCount: ep.IpAddressCount || 0,
      hostVpcId: ep.HostVPCId,
      status: ep.Status,
      statusMessage: ep.StatusMessage,
      creationTime: ep.CreationTime,
      modificationTime: ep.ModificationTime,
      protocols: ep.Protocols || ["Do53"],
    };

    const ipAddresses: ResolverEndpointIpAddressItem[] = (ipsRes.IpAddresses || []).map((ip) => ({
      ipId: ip.IpId,
      subnetId: ip.SubnetId,
      ip: ip.Ip,
      status: ip.Status,
      statusMessage: ip.StatusMessage,
      creationTime: ip.CreationTime,
      modificationTime: ip.ModificationTime,
    }));

    return {
      success: true,
      endpoint,
      ipAddresses,
    };
  } catch (err: unknown) {
    return {
      success: false,
      ipAddresses: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createResolverEndpointAction(data: {
  name?: string;
  direction: "INBOUND" | "OUTBOUND";
  securityGroupIds: string[];
  ipAddresses: Array<{ subnetId: string; ip?: string }>;
  protocols?: string[];
  tags?: Array<{ key: string; value: string }>;
}): Promise<{
  success: boolean;
  endpointId?: string;
  error?: string;
}> {
  try {
    const creatorRequestId = `rslvr-req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const res = await route53Resolver.send(
      new CreateResolverEndpointCommand({
        CreatorRequestId: creatorRequestId,
        Name: data.name?.trim() || undefined,
        Direction: data.direction,
        SecurityGroupIds: data.securityGroupIds,
        IpAddresses: data.ipAddresses.map((ip) => ({
          SubnetId: ip.subnetId,
          Ip: ip.ip?.trim() || undefined,
        })),
        Protocols: data.protocols || ["Do53"],
        Tags: (data.tags || []).filter((t) => t.key.trim()).map((t) => ({ Key: t.key.trim(), Value: t.value.trim() })),
      })
    );

    return {
      success: true,
      endpointId: res.ResolverEndpoint?.Id,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function deleteResolverEndpointAction(endpointId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await route53Resolver.send(new DeleteResolverEndpointCommand({ ResolverEndpointId: endpointId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Resolver Rules Actions
// ---------------------------------------------------------------------------

export async function listResolverRulesAction(): Promise<{
  success: boolean;
  rules: ResolverRuleItem[];
  error?: string;
}> {
  try {
    const [rulesRes, assocsRes] = await Promise.all([
      route53Resolver.send(new ListResolverRulesCommand({ MaxResults: 100 })),
      route53Resolver.send(new ListResolverRuleAssociationsCommand({ MaxResults: 100 })).catch(() => ({ ResolverRuleAssociations: [] })),
    ]);

    const assocCounts: Record<string, number> = {};
    for (const a of assocsRes.ResolverRuleAssociations || []) {
      if (a.ResolverRuleId) {
        assocCounts[a.ResolverRuleId] = (assocCounts[a.ResolverRuleId] || 0) + 1;
      }
    }

    const rules: ResolverRuleItem[] = (rulesRes.ResolverRules || []).map((r) => ({
      id: r.Id || "",
      name: r.Name || r.Id || "",
      creatorRequestId: r.CreatorRequestId,
      arn: r.Arn,
      domainName: r.DomainName,
      status: r.Status,
      statusMessage: r.StatusMessage,
      ruleType: r.RuleType,
      targetIps: r.TargetIps?.map((t) => ({ ip: t.Ip, port: t.Port, protocol: t.Protocol })),
      resolverEndpointId: r.ResolverEndpointId,
      ownerId: r.OwnerId,
      shareStatus: r.ShareStatus,
      creationTime: r.CreationTime,
      modificationTime: r.ModificationTime,
      associationCount: assocCounts[r.Id || ""] || 0,
    }));

    return { success: true, rules };
  } catch (err: unknown) {
    return {
      success: false,
      rules: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getResolverRuleDetailAction(ruleId: string): Promise<{
  success: boolean;
  rule?: ResolverRuleItem;
  associations: ResolverRuleAssociationItem[];
  error?: string;
}> {
  try {
    const [ruleRes, assocsRes] = await Promise.all([
      route53Resolver.send(new GetResolverRuleCommand({ ResolverRuleId: ruleId })),
      route53Resolver.send(new ListResolverRuleAssociationsCommand({ MaxResults: 100 })).catch(() => ({ ResolverRuleAssociations: [] })),
    ]);

    const r = ruleRes.ResolverRule;
    if (!r) {
      return {
        success: false,
        associations: [],
        error: `Resolver rule ${ruleId} not found`,
      };
    }

    const matchingAssocs = (assocsRes.ResolverRuleAssociations || [])
      .filter((a) => a.ResolverRuleId === ruleId)
      .map((a) => ({
        id: a.Id || "",
        resolverRuleId: a.ResolverRuleId || "",
        name: a.Name,
        vpcId: a.VPCId || "",
        status: a.Status,
        statusMessage: a.StatusMessage,
      }));

    const rule: ResolverRuleItem = {
      id: r.Id || "",
      name: r.Name || r.Id || "",
      creatorRequestId: r.CreatorRequestId,
      arn: r.Arn,
      domainName: r.DomainName,
      status: r.Status,
      statusMessage: r.StatusMessage,
      ruleType: r.RuleType,
      targetIps: r.TargetIps?.map((t) => ({ ip: t.Ip, port: t.Port, protocol: t.Protocol })),
      resolverEndpointId: r.ResolverEndpointId,
      ownerId: r.OwnerId,
      shareStatus: r.ShareStatus,
      creationTime: r.CreationTime,
      modificationTime: r.ModificationTime,
      associationCount: matchingAssocs.length,
    };

    return {
      success: true,
      rule,
      associations: matchingAssocs,
    };
  } catch (err: unknown) {
    return {
      success: false,
      associations: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createResolverRuleAction(data: {
  name?: string;
  ruleType: "FORWARD" | "SYSTEM";
  domainName: string;
  resolverEndpointId?: string;
  targetIps?: Array<{ ip: string; port?: number }>;
  vpcIdToAssociate?: string;
  tags?: Array<{ key: string; value: string }>;
}): Promise<{
  success: boolean;
  ruleId?: string;
  error?: string;
}> {
  try {
    const creatorRequestId = `rslvr-rule-req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const domain = data.domainName.trim().endsWith(".") ? data.domainName.trim() : `${data.domainName.trim()}.`;

    const res = await route53Resolver.send(
      new CreateResolverRuleCommand({
        CreatorRequestId: creatorRequestId,
        Name: data.name?.trim() || undefined,
        RuleType: data.ruleType,
        DomainName: domain,
        ResolverEndpointId: data.ruleType === "FORWARD" ? data.resolverEndpointId : undefined,
        TargetIps:
          data.ruleType === "FORWARD"
            ? (data.targetIps || []).map((t) => ({
                Ip: t.ip.trim(),
                Port: t.port || 53,
              }))
            : undefined,
        Tags: (data.tags || []).filter((t) => t.key.trim()).map((t) => ({ Key: t.key.trim(), Value: t.value.trim() })),
      })
    );

    const ruleId = res.ResolverRule?.Id;

    if (ruleId && data.vpcIdToAssociate) {
      await route53Resolver
        .send(
          new AssociateResolverRuleCommand({
            ResolverRuleId: ruleId,
            VPCId: data.vpcIdToAssociate,
            Name: data.name ? `${data.name}-assoc` : undefined,
          })
        )
        .catch(() => {});
    }

    return {
      success: true,
      ruleId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function associateResolverRuleAction(data: {
  resolverRuleId: string;
  vpcId: string;
  name?: string;
}): Promise<{
  success: boolean;
  associationId?: string;
  error?: string;
}> {
  try {
    const res = await route53Resolver.send(
      new AssociateResolverRuleCommand({
        ResolverRuleId: data.resolverRuleId,
        VPCId: data.vpcId,
        Name: data.name?.trim() || undefined,
      })
    );

    return {
      success: true,
      associationId: res.ResolverRuleAssociation?.Id,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function disassociateResolverRuleAction(data: {
  resolverRuleId: string;
  vpcId: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await route53Resolver.send(
      new DisassociateResolverRuleCommand({
        ResolverRuleId: data.resolverRuleId,
        VPCId: data.vpcId,
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

export async function deleteResolverRuleAction(ruleId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await route53Resolver.send(new DeleteResolverRuleCommand({ ResolverRuleId: ruleId }));
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Query Logging Actions
// ---------------------------------------------------------------------------

export async function listResolverQueryLogConfigsAction(): Promise<{
  success: boolean;
  configs: ResolverQueryLogConfigItem[];
  error?: string;
}> {
  try {
    const res = await route53Resolver.send(new ListResolverQueryLogConfigsCommand({ MaxResults: 100 }));
    const configs: ResolverQueryLogConfigItem[] = (res.ResolverQueryLogConfigs || []).map((q) => ({
      id: q.Id || "",
      ownerId: q.OwnerId,
      status: q.Status,
      shareStatus: q.ShareStatus,
      associationCount: q.AssociationCount || 0,
      arn: q.Arn,
      name: q.Name || q.Id || "",
      destinationArn: q.DestinationArn,
      creatorRequestId: q.CreatorRequestId,
      creationTime: q.CreationTime,
    }));

    return { success: true, configs };
  } catch (err: unknown) {
    return {
      success: false,
      configs: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getResolverQueryLogConfigDetailAction(configId: string): Promise<{
  success: boolean;
  config?: ResolverQueryLogConfigItem;
  associations: ResolverQueryLogConfigAssociationItem[];
  error?: string;
}> {
  try {
    const [cfgRes, assocsRes] = await Promise.all([
      route53Resolver.send(new GetResolverQueryLogConfigCommand({ ResolverQueryLogConfigId: configId })),
      route53Resolver.send(new ListResolverQueryLogConfigAssociationsCommand({ MaxResults: 100 })).catch(() => ({ ResolverQueryLogConfigAssociations: [] })),
    ]);

    const q = cfgRes.ResolverQueryLogConfig;
    if (!q) {
      return {
        success: false,
        associations: [],
        error: `Query log config ${configId} not found`,
      };
    }

    const matchingAssocs = (assocsRes.ResolverQueryLogConfigAssociations || [])
      .filter((a) => a.ResolverQueryLogConfigId === configId)
      .map((a) => ({
        id: a.Id || "",
        resolverQueryLogConfigId: a.ResolverQueryLogConfigId || "",
        resourceId: a.ResourceId || "",
        status: a.Status,
        error: a.Error,
        errorMessage: a.ErrorMessage,
        creationTime: a.CreationTime,
      }));

    const config: ResolverQueryLogConfigItem = {
      id: q.Id || "",
      ownerId: q.OwnerId,
      status: q.Status,
      shareStatus: q.ShareStatus,
      associationCount: matchingAssocs.length,
      arn: q.Arn,
      name: q.Name || q.Id || "",
      destinationArn: q.DestinationArn,
      creatorRequestId: q.CreatorRequestId,
      creationTime: q.CreationTime,
    };

    return {
      success: true,
      config,
      associations: matchingAssocs,
    };
  } catch (err: unknown) {
    return {
      success: false,
      associations: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function createResolverQueryLogConfigAction(data: {
  name: string;
  destinationArn: string;
  vpcIdsToAssociate?: string[];
  tags?: Array<{ key: string; value: string }>;
}): Promise<{
  success: boolean;
  configId?: string;
  error?: string;
}> {
  try {
    const creatorRequestId = `rslvr-qlog-req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const res = await route53Resolver.send(
      new CreateResolverQueryLogConfigCommand({
        CreatorRequestId: creatorRequestId,
        Name: data.name.trim(),
        DestinationArn: data.destinationArn.trim(),
        Tags: (data.tags || []).filter((t) => t.key.trim()).map((t) => ({ Key: t.key.trim(), Value: t.value.trim() })),
      })
    );

    const configId = res.ResolverQueryLogConfig?.Id;

    if (configId && data.vpcIdsToAssociate && data.vpcIdsToAssociate.length > 0) {
      for (const vpcId of data.vpcIdsToAssociate) {
        await route53Resolver
          .send(
            new AssociateResolverQueryLogConfigCommand({
              ResolverQueryLogConfigId: configId,
              ResourceId: vpcId,
            })
          )
          .catch(() => {});
      }
    }

    return {
      success: true,
      configId,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function associateResolverQueryLogConfigAction(data: {
  resolverQueryLogConfigId: string;
  vpcId: string;
}): Promise<{
  success: boolean;
  associationId?: string;
  error?: string;
}> {
  try {
    const res = await route53Resolver.send(
      new AssociateResolverQueryLogConfigCommand({
        ResolverQueryLogConfigId: data.resolverQueryLogConfigId,
        ResourceId: data.vpcId,
      })
    );

    return {
      success: true,
      associationId: res.ResolverQueryLogConfigAssociation?.Id,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function disassociateResolverQueryLogConfigAction(data: {
  resolverQueryLogConfigId: string;
  vpcId: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await route53Resolver.send(
      new DisassociateResolverQueryLogConfigCommand({
        ResolverQueryLogConfigId: data.resolverQueryLogConfigId,
        ResourceId: data.vpcId,
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

export async function deleteResolverQueryLogConfigAction(configId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await route53Resolver.send(
      new DeleteResolverQueryLogConfigCommand({
        ResolverQueryLogConfigId: configId,
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

// ---------------------------------------------------------------------------
// DNS Firewall Actions
// ---------------------------------------------------------------------------

export async function listFirewallConfigsAction(): Promise<{
  success: boolean;
  configs: FirewallConfigItem[];
  error?: string;
}> {
  try {
    const res = await route53Resolver.send(new ListFirewallConfigsCommand({ MaxResults: 100 }));
    const configs: FirewallConfigItem[] = (res.FirewallConfigs || []).map((fc) => ({
      id: fc.Id || "",
      resourceId: fc.ResourceId || "",
      ownerId: fc.OwnerId,
      firewallFailOpen: fc.FirewallFailOpen || "DISABLED",
    }));

    return { success: true, configs };
  } catch (err: unknown) {
    return {
      success: false,
      configs: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function listFirewallDomainListsAction(): Promise<{
  success: boolean;
  domainLists: FirewallDomainListItem[];
  error?: string;
}> {
  try {
    const res = await route53Resolver.send(new ListFirewallDomainListsCommand({ MaxResults: 100 }));
    const domainLists: FirewallDomainListItem[] = (res.FirewallDomainLists || []).map((fdl) => ({
      id: fdl.Id || "",
      arn: fdl.Arn,
      name: fdl.Name || fdl.Id || "",
      domainCount: fdl.DomainCount || 0,
      status: fdl.Status,
      statusMessage: fdl.StatusMessage,
      creatorRequestId: fdl.CreatorRequestId,
      managedOwnerName: fdl.ManagedOwnerName,
      creationTime: fdl.CreationTime,
      modificationTime: fdl.ModificationTime,
    }));

    return { success: true, domainLists };
  } catch (err: unknown) {
    return {
      success: false,
      domainLists: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function listFirewallRuleGroupsAction(): Promise<{
  success: boolean;
  ruleGroups: FirewallRuleGroupItem[];
  error?: string;
}> {
  try {
    const res = await route53Resolver.send(new ListFirewallRuleGroupsCommand({ MaxResults: 100 }));
    const ruleGroups: FirewallRuleGroupItem[] = (res.FirewallRuleGroups || []).map((rg) => ({
      id: rg.Id || "",
      arn: rg.Arn,
      name: rg.Name || rg.Id || "",
      ruleCount: rg.RuleCount || 0,
      status: rg.Status,
      statusMessage: rg.StatusMessage,
      ownerId: rg.OwnerId,
      creatorRequestId: rg.CreatorRequestId,
      shareStatus: rg.ShareStatus,
      creationTime: rg.CreationTime,
      modificationTime: rg.ModificationTime,
    }));

    return { success: true, ruleGroups };
  } catch (err: unknown) {
    return {
      success: false,
      ruleGroups: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Dependencies & Overview Actions
// ---------------------------------------------------------------------------

export async function getResolverDependenciesAction(): Promise<{
  success: boolean;
  dependencies: ResolverDependenciesData;
  error?: string;
}> {
  try {
    const [vpcsRes, subnetsRes, sgsRes, logsRes, s3Res] = await Promise.all([
      ec2.send(new DescribeVpcsCommand({})).catch(() => ({ Vpcs: [] })),
      ec2.send(new DescribeSubnetsCommand({})).catch(() => ({ Subnets: [] })),
      ec2.send(new DescribeSecurityGroupsCommand({})).catch(() => ({ SecurityGroups: [] })),
      cloudwatchLogs.send(new DescribeLogGroupsCommand({})).catch(() => ({ logGroups: [] })),
      s3.send(new ListBucketsCommand({})).catch(() => ({ Buckets: [] })),
    ]);

    const vpcs = (vpcsRes.Vpcs || []).map((v) => ({
      vpcId: v.VpcId || "",
      name: v.Tags?.find((t) => t.Key === "Name")?.Value,
      cidrBlock: v.CidrBlock,
    }));

    const subnets = (subnetsRes.Subnets || []).map((s) => ({
      subnetId: s.SubnetId || "",
      vpcId: s.VpcId || "",
      availabilityZone: s.AvailabilityZone,
      cidrBlock: s.CidrBlock,
      name: s.Tags?.find((t) => t.Key === "Name")?.Value,
    }));

    const securityGroups = (sgsRes.SecurityGroups || []).map((sg) => ({
      groupId: sg.GroupId || "",
      groupName: sg.GroupName || sg.GroupId || "",
      vpcId: sg.VpcId,
      description: sg.Description,
    }));

    const logGroups = (logsRes.logGroups || []).map((lg) => ({
      logGroupName: lg.logGroupName || "",
      arn: lg.arn,
    }));

    const s3Buckets = (s3Res.Buckets || []).map((b) => ({
      name: b.Name || "",
      creationDate: b.CreationDate ? new Date(b.CreationDate).toISOString() : undefined,
    }));

    return {
      success: true,
      dependencies: {
        vpcs,
        subnets,
        securityGroups,
        logGroups,
        s3Buckets,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      dependencies: {
        vpcs: [],
        subnets: [],
        securityGroups: [],
        logGroups: [],
        s3Buckets: [],
      },
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getResolverOverviewMetricsAction(): Promise<{
  success: boolean;
  inboundEndpointsCount: number;
  outboundEndpointsCount: number;
  rulesCount: number;
  queryLogConfigsCount: number;
  firewallConfigsCount: number;
  firewallDomainListsCount: number;
  firewallRuleGroupsCount: number;
}> {
  try {
    const [epsRes, rulesRes, qlogsRes, fwConfigsRes, fwListsRes, fwGroupsRes] = await Promise.all([
      route53Resolver.send(new ListResolverEndpointsCommand({})).catch(() => ({ ResolverEndpoints: [] })),
      route53Resolver.send(new ListResolverRulesCommand({})).catch(() => ({ ResolverRules: [] })),
      route53Resolver.send(new ListResolverQueryLogConfigsCommand({})).catch(() => ({ ResolverQueryLogConfigs: [] })),
      route53Resolver.send(new ListFirewallConfigsCommand({})).catch(() => ({ FirewallConfigs: [] })),
      route53Resolver.send(new ListFirewallDomainListsCommand({})).catch(() => ({ FirewallDomainLists: [] })),
      route53Resolver.send(new ListFirewallRuleGroupsCommand({})).catch(() => ({ FirewallRuleGroups: [] })),
    ]);

    const eps = epsRes.ResolverEndpoints || [];
    const inboundEndpointsCount = eps.filter((e) => e.Direction === "INBOUND").length;
    const outboundEndpointsCount = eps.filter((e) => e.Direction === "OUTBOUND").length;

    return {
      success: true,
      inboundEndpointsCount,
      outboundEndpointsCount,
      rulesCount: (rulesRes.ResolverRules || []).length,
      queryLogConfigsCount: (qlogsRes.ResolverQueryLogConfigs || []).length,
      firewallConfigsCount: (fwConfigsRes.FirewallConfigs || []).length,
      firewallDomainListsCount: (fwListsRes.FirewallDomainLists || []).length,
      firewallRuleGroupsCount: (fwGroupsRes.FirewallRuleGroups || []).length,
    };
  } catch {
    return {
      success: false,
      inboundEndpointsCount: 0,
      outboundEndpointsCount: 0,
      rulesCount: 0,
      queryLogConfigsCount: 0,
      firewallConfigsCount: 0,
      firewallDomainListsCount: 0,
      firewallRuleGroupsCount: 0,
    };
  }
}
