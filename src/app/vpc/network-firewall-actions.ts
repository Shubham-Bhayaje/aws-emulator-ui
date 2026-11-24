/**
 * src/app/vpc/network-firewall-actions.ts – Server Actions for AWS Network Firewall.
 * Real SDK v3 communication with AWS Emulator at https://127.0.0.1:9297.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use server";

import {
  networkFirewall,
  ec2,
  kms,
  cloudwatchLogs,
  s3,
} from "@/lib/aws";
import {
  ListFirewallsCommand,
  DescribeFirewallCommand,
  CreateFirewallCommand,
  DeleteFirewallCommand,
  UpdateFirewallDeleteProtectionCommand,
  ListFirewallPoliciesCommand,
  DescribeFirewallPolicyCommand,
  CreateFirewallPolicyCommand,
  DeleteFirewallPolicyCommand,
  ListRuleGroupsCommand,
  DescribeRuleGroupCommand,
  CreateRuleGroupCommand,
  DeleteRuleGroupCommand,
  DescribeLoggingConfigurationCommand,
  UpdateLoggingConfigurationCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
  FirewallMetadata,
  Firewall,
  FirewallStatus,
  FirewallPolicyResponse,
  FirewallPolicy,
  RuleGroupResponse,
  RuleGroup,
  LoggingConfiguration,
  Tag,
} from "@aws-sdk/client-network-firewall";
import { DescribeVpcsCommand, DescribeSubnetsCommand } from "@aws-sdk/client-ec2";
import { ListAliasesCommand } from "@aws-sdk/client-kms";
import { DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { ListBucketsCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. Firewalls Actions
// ============================================================================

export async function fetchLiveFirewalls(): Promise<{
  success: boolean;
  firewalls: FirewallMetadata[];
  error?: string;
}> {
  try {
    const res = await networkFirewall.send(new ListFirewallsCommand({ MaxResults: 100 }));
    return { success: true, firewalls: res.Firewalls || [] };
  } catch (err: any) {
    return { success: false, firewalls: [], error: err?.message || String(err) };
  }
}

export async function fetchLiveFirewall(name: string): Promise<{
  success: boolean;
  firewall?: Firewall;
  firewallStatus?: FirewallStatus;
  updateToken?: string;
  error?: string;
}> {
  try {
    const res = await networkFirewall.send(new DescribeFirewallCommand({ FirewallName: name }));
    return {
      success: true,
      firewall: res.Firewall,
      firewallStatus: res.FirewallStatus,
      updateToken: res.UpdateToken,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export interface CreateFirewallInput {
  name: string;
  description?: string;
  vpcId: string;
  policyArn: string;
  subnetMappings: Array<{ subnetId: string }>;
  deleteProtection?: boolean;
  subnetChangeProtection?: boolean;
  policyChangeProtection?: boolean;
  kmsKeyId?: string;
  tags?: Array<{ key: string; value: string }>;
}

export async function createLiveFirewall(input: CreateFirewallInput): Promise<{
  success: boolean;
  firewall?: Firewall;
  error?: string;
}> {
  try {
    const res = await networkFirewall.send(
      new CreateFirewallCommand({
        FirewallName: input.name,
        Description: input.description || undefined,
        VpcId: input.vpcId,
        FirewallPolicyArn: input.policyArn,
        SubnetMappings: input.subnetMappings.map((s) => ({ SubnetId: s.subnetId })),
        DeleteProtection: Boolean(input.deleteProtection),
        SubnetChangeProtection: Boolean(input.subnetChangeProtection),
        FirewallPolicyChangeProtection: Boolean(input.policyChangeProtection),
        EncryptionConfiguration: input.kmsKeyId
          ? {
              Type: "CUSTOMER_KMS",
              KeyId: input.kmsKeyId,
            }
          : {
              Type: "AWS_OWNED_KMS_KEY",
            },
        Tags: input.tags?.map((t) => ({ Key: t.key, Value: t.value })),
      })
    );
    revalidatePath("/vpc/firewalls");
    return { success: true, firewall: res.Firewall };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteLiveFirewall(name: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await networkFirewall.send(new DeleteFirewallCommand({ FirewallName: name }));
    revalidatePath("/vpc/firewalls");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function updateFirewallDeleteProtection(
  name: string,
  updateToken: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await networkFirewall.send(
      new UpdateFirewallDeleteProtectionCommand({
        FirewallName: name,
        UpdateToken: updateToken,
        DeleteProtection: enabled,
      })
    );
    revalidatePath(`/vpc/firewalls/${name}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// ============================================================================
// 2. Firewall Policies Actions
// ============================================================================

export async function fetchLiveFirewallPolicies(): Promise<{
  success: boolean;
  policies: Array<{ name: string; arn: string }>;
  error?: string;
}> {
  try {
    const res = await networkFirewall.send(new ListFirewallPoliciesCommand({ MaxResults: 100 }));
    const policies = (res.FirewallPolicies || []).map((p) => ({
      name: p.Name || "",
      arn: p.Arn || "",
    }));
    return { success: true, policies };
  } catch (err: any) {
    return { success: false, policies: [], error: err?.message || String(err) };
  }
}

export async function fetchLiveFirewallPolicy(name: string): Promise<{
  success: boolean;
  response?: FirewallPolicyResponse;
  policy?: FirewallPolicy;
  updateToken?: string;
  error?: string;
}> {
  try {
    const res = await networkFirewall.send(
      new DescribeFirewallPolicyCommand({ FirewallPolicyName: name })
    );
    return {
      success: true,
      response: res.FirewallPolicyResponse,
      policy: res.FirewallPolicy,
      updateToken: res.UpdateToken,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export interface CreateFirewallPolicyInput {
  name: string;
  description?: string;
  statelessDefaultActions: string[];
  statelessFragmentDefaultActions: string[];
  statelessRuleGroupReferences?: Array<{ priority: number; arn: string }>;
  statefulRuleGroupReferences?: Array<{ arn: string; priority?: number }>;
  statefulDefaultActions?: string[];
  statefulEngineOptions?: {
    ruleOrder?: "DEFAULT_ACTION_ORDER" | "STRICT_ORDER";
  };
  kmsKeyId?: string;
  tags?: Array<{ key: string; value: string }>;
}

export async function createLiveFirewallPolicy(input: CreateFirewallPolicyInput): Promise<{
  success: boolean;
  policyResponse?: FirewallPolicyResponse;
  error?: string;
}> {
  try {
    const res = await networkFirewall.send(
      new CreateFirewallPolicyCommand({
        FirewallPolicyName: input.name,
        Description: input.description || undefined,
        FirewallPolicy: {
          StatelessDefaultActions: input.statelessDefaultActions.length > 0 ? input.statelessDefaultActions : ["aws:pass"],
          StatelessFragmentDefaultActions:
            input.statelessFragmentDefaultActions.length > 0 ? input.statelessFragmentDefaultActions : ["aws:pass"],
          StatelessRuleGroupReferences: input.statelessRuleGroupReferences?.map((r) => ({
            Priority: r.priority,
            ResourceArn: r.arn,
          })),
          StatefulRuleGroupReferences: input.statefulRuleGroupReferences?.map((r) => ({
            ResourceArn: r.arn,
            Priority: r.priority,
          })),
          StatefulDefaultActions: input.statefulDefaultActions,
          StatefulEngineOptions: input.statefulEngineOptions
            ? { RuleOrder: input.statefulEngineOptions.ruleOrder }
            : undefined,
        },
        EncryptionConfiguration: input.kmsKeyId
          ? { Type: "CUSTOMER_KMS", KeyId: input.kmsKeyId }
          : { Type: "AWS_OWNED_KMS_KEY" },
        Tags: input.tags?.map((t) => ({ Key: t.key, Value: t.value })),
      })
    );
    revalidatePath("/vpc/firewall-policies");
    return { success: true, policyResponse: res.FirewallPolicyResponse };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteLiveFirewallPolicy(name: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await networkFirewall.send(new DeleteFirewallPolicyCommand({ FirewallPolicyName: name }));
    revalidatePath("/vpc/firewall-policies");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// ============================================================================
// 3. Rule Groups Actions
// ============================================================================

export async function fetchLiveRuleGroups(type?: "STATELESS" | "STATEFUL"): Promise<{
  success: boolean;
  ruleGroups: Array<{ name: string; arn: string }>;
  error?: string;
}> {
  try {
    const res = await networkFirewall.send(new ListRuleGroupsCommand({ Type: type, MaxResults: 100 }));
    const ruleGroups = (res.RuleGroups || []).map((rg) => ({
      name: rg.Name || "",
      arn: rg.Arn || "",
    }));
    return { success: true, ruleGroups };
  } catch (err: any) {
    return { success: false, ruleGroups: [], error: err?.message || String(err) };
  }
}

export async function fetchLiveRuleGroup(
  name: string,
  type: "STATELESS" | "STATEFUL"
): Promise<{
  success: boolean;
  response?: RuleGroupResponse;
  ruleGroup?: RuleGroup;
  updateToken?: string;
  error?: string;
}> {
  try {
    const res = await networkFirewall.send(
      new DescribeRuleGroupCommand({
        RuleGroupName: name,
        Type: type,
      })
    );
    return {
      success: true,
      response: res.RuleGroupResponse,
      ruleGroup: res.RuleGroup,
      updateToken: res.UpdateToken,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export interface CreateRuleGroupInput {
  name: string;
  type: "STATELESS" | "STATEFUL";
  capacity: number;
  description?: string;
  kmsKeyId?: string;
  tags?: Array<{ key: string; value: string }>;
  // Stateless config
  statelessRules?: Array<{
    priority: number;
    actions: string[];
    protocols?: number[];
    sources?: string[];
    destinations?: string[];
    sourcePorts?: Array<{ from: number; to: number }>;
    destinationPorts?: Array<{ from: number; to: number }>;
  }>;
  // Stateful options
  statefulRuleType?: "5_TUPLE" | "DOMAIN_LIST" | "SURICATA";
  statefulDomainList?: {
    targets: string[];
    targetTypes: Array<"TLS_SNI" | "HTTP_HOST">;
    actionType: "ALLOWLIST" | "DENYLIST";
  };
  statefulSuricataRules?: string;
  stateful5TupleRules?: Array<{
    action: "PASS" | "DROP" | "ALERT";
    protocol: string;
    source: string;
    sourcePort: string;
    direction: "FORWARD" | "ANY";
    destination: string;
    destinationPort: string;
  }>;
}

export async function createLiveRuleGroup(input: CreateRuleGroupInput): Promise<{
  success: boolean;
  ruleGroupResponse?: RuleGroupResponse;
  error?: string;
}> {
  try {
    let rulesSource: any = {};

    if (input.type === "STATELESS") {
      rulesSource = {
        StatelessRulesAndCustomActions: {
          StatelessRules: (input.statelessRules || []).map((r) => ({
            Priority: r.priority,
            RuleDefinition: {
              Actions: r.actions,
              MatchAttributes: {
                Protocols: r.protocols && r.protocols.length > 0 ? r.protocols : undefined,
                Sources: r.sources?.map((s) => ({ AddressDefinition: s })),
                Destinations: r.destinations?.map((d) => ({ AddressDefinition: d })),
                SourcePorts: r.sourcePorts?.map((p) => ({ FromPort: p.from, ToPort: p.to })),
                DestinationPorts: r.destinationPorts?.map((p) => ({ FromPort: p.from, ToPort: p.to })),
              },
            },
          })),
        },
      };
    } else {
      // STATEFUL
      if (input.statefulRuleType === "DOMAIN_LIST" && input.statefulDomainList) {
        rulesSource = {
          RulesSourceList: {
            Targets: input.statefulDomainList.targets,
            TargetTypes: input.statefulDomainList.targetTypes,
            GeneratedRulesType: input.statefulDomainList.actionType,
          },
        };
      } else if (input.statefulRuleType === "SURICATA" && input.statefulSuricataRules) {
        rulesSource = {
          RulesString: input.statefulSuricataRules,
        };
      } else if (input.stateful5TupleRules && input.stateful5TupleRules.length > 0) {
        rulesSource = {
          StatefulRules: input.stateful5TupleRules.map((r, idx) => ({
            Action: r.action,
            Header: {
              Protocol: r.protocol,
              Source: r.source,
              SourcePort: r.sourcePort,
              Direction: r.direction,
              Destination: r.destination,
              DestinationPort: r.destinationPort,
            },
            RuleOptions: [{ Keyword: "sid", Settings: [String(100000 + idx)] }],
          })),
        };
      } else {
        // Fallback default domain pass
        rulesSource = {
          RulesSourceList: {
            Targets: [".example.com"],
            TargetTypes: ["TLS_SNI"],
            GeneratedRulesType: "DENYLIST",
          },
        };
      }
    }

    const res = await networkFirewall.send(
      new CreateRuleGroupCommand({
        RuleGroupName: input.name,
        Type: input.type,
        Capacity: input.capacity,
        Description: input.description || undefined,
        RuleGroup: {
          RulesSource: rulesSource,
        },
        EncryptionConfiguration: input.kmsKeyId
          ? { Type: "CUSTOMER_KMS", KeyId: input.kmsKeyId }
          : { Type: "AWS_OWNED_KMS_KEY" },
        Tags: input.tags?.map((t) => ({ Key: t.key, Value: t.value })),
      })
    );

    revalidatePath("/vpc/rule-groups");
    return { success: true, ruleGroupResponse: res.RuleGroupResponse };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteLiveRuleGroup(
  name: string,
  type: "STATELESS" | "STATEFUL"
): Promise<{ success: boolean; error?: string }> {
  try {
    await networkFirewall.send(
      new DeleteRuleGroupCommand({
        RuleGroupName: name,
        Type: type,
      })
    );
    revalidatePath("/vpc/rule-groups");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// ============================================================================
// 4. Logging Configuration
// ============================================================================

export async function fetchLiveLoggingConfiguration(firewallName: string): Promise<{
  success: boolean;
  loggingConfiguration?: LoggingConfiguration;
  error?: string;
}> {
  try {
    const res = await networkFirewall.send(
      new DescribeLoggingConfigurationCommand({ FirewallName: firewallName })
    );
    return {
      success: true,
      loggingConfiguration: res.LoggingConfiguration,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function updateLiveLoggingConfiguration(
  firewallName: string,
  logDestinationConfigs: Array<{
    logType: "ALERT" | "FLOW";
    logDestinationType: "CloudWatchLogs" | "S3" | "KinesisDataFirehose";
    logDestination: Record<string, string>;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    await networkFirewall.send(
      new UpdateLoggingConfigurationCommand({
        FirewallName: firewallName,
        LoggingConfiguration: {
          LogDestinationConfigs: logDestinationConfigs.map((c) => ({
            LogType: c.logType,
            LogDestinationType: c.logDestinationType,
            LogDestination: c.logDestination,
          })),
        },
      })
    );
    revalidatePath(`/vpc/firewalls/${firewallName}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// ============================================================================
// 5. Tags Management
// ============================================================================

export async function fetchLiveTagsForResource(resourceArn: string): Promise<{
  success: boolean;
  tags: Tag[];
  error?: string;
}> {
  try {
    const res = await networkFirewall.send(
      new ListTagsForResourceCommand({ ResourceArn: resourceArn })
    );
    return { success: true, tags: res.Tags || [] };
  } catch (err: any) {
    return { success: false, tags: [], error: err?.message || String(err) };
  }
}

export async function tagLiveResource(
  resourceArn: string,
  tags: Array<{ key: string; value: string }>
): Promise<{ success: boolean; error?: string }> {
  try {
    await networkFirewall.send(
      new TagResourceCommand({
        ResourceArn: resourceArn,
        Tags: tags.map((t) => ({ Key: t.key, Value: t.value })),
      })
    );
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function untagLiveResource(
  resourceArn: string,
  tagKeys: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await networkFirewall.send(
      new UntagResourceCommand({
        ResourceArn: resourceArn,
        TagKeys: tagKeys,
      })
    );
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// ============================================================================
// 6. Real Dropdown Helpers (VPC, Subnets, KMS, CloudWatch Logs, S3)
// ============================================================================

export async function fetchVpcsAndSubnets(): Promise<{
  vpcs: Array<{ id: string; name: string; cidr: string; isDefault: boolean }>;
  subnets: Array<{ id: string; vpcId: string; az: string; cidr: string; name: string }>;
}> {
  try {
    const [vpcRes, subRes] = await Promise.all([
      ec2.send(new DescribeVpcsCommand({})),
      ec2.send(new DescribeSubnetsCommand({})),
    ]);

    const vpcs = (vpcRes.Vpcs || []).map((v) => ({
      id: v.VpcId || "",
      name: v.Tags?.find((t) => t.Key === "Name")?.Value || v.VpcId || "",
      cidr: v.CidrBlock || "",
      isDefault: Boolean(v.IsDefault),
    }));

    const subnets = (subRes.Subnets || []).map((s) => ({
      id: s.SubnetId || "",
      vpcId: s.VpcId || "",
      az: s.AvailabilityZone || "",
      cidr: s.CidrBlock || "",
      name: s.Tags?.find((t) => t.Key === "Name")?.Value || s.SubnetId || "",
    }));

    return { vpcs, subnets };
  } catch {
    return { vpcs: [], subnets: [] };
  }
}

export async function fetchKmsKeys(): Promise<Array<{ keyId: string; alias: string }>> {
  try {
    const res = await kms.send(new ListAliasesCommand({}));
    return (res.Aliases || [])
      .filter((a) => a.TargetKeyId && !a.AliasName?.startsWith("alias/aws/"))
      .map((a) => ({
        keyId: a.TargetKeyId || "",
        alias: a.AliasName || a.TargetKeyId || "",
      }));
  } catch {
    return [];
  }
}

export async function fetchLoggingDestinations(): Promise<{
  cloudwatchLogGroups: string[];
  s3Buckets: string[];
}> {
  try {
    const [cwRes, s3Res] = await Promise.all([
      cloudwatchLogs.send(new DescribeLogGroupsCommand({})).catch(() => ({ logGroups: [] })),
      s3.send(new ListBucketsCommand({})).catch(() => ({ Buckets: [] })),
    ]);

    const cloudwatchLogGroups = (cwRes.logGroups || [])
      .map((lg) => lg.logGroupName || "")
      .filter(Boolean);

    const s3Buckets = (s3Res.Buckets || [])
      .map((b) => b.Name || "")
      .filter(Boolean);

    return { cloudwatchLogGroups, s3Buckets };
  } catch {
    return { cloudwatchLogGroups: [], s3Buckets: [] };
  }
}
