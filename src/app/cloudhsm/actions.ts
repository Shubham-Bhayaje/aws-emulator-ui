/**
 * src/app/cloudhsm/actions.ts – Server Actions for AWS CloudHSM.
 * Calls @aws-sdk/client-cloudhsm-v2 against the local emulator.
 * Zero emojis, Cloudscape enterprise standard.
 */

"use server";

import { revalidatePath } from "next/cache";
import { cloudhsmv2, ec2 } from "@/lib/aws";
import {
  CloudHSMV2Client,
  DescribeClustersCommand,
  CreateClusterCommand,
  DeleteClusterCommand,
  CreateHsmCommand,
  DeleteHsmCommand,
  InitializeClusterCommand,
  DescribeBackupsCommand,
} from "@aws-sdk/client-cloudhsm-v2";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from "@aws-sdk/client-ec2";
import {
  ClusterSummary,
  ClusterState,
  ClusterMode,
  CreateClusterInput,
  VpcOption,
  SubnetOption,
  BackupSummary,
  HsmSummary,
} from "./types";

const ENDPOINT = "https://127.0.0.1:9297";
const DEFAULT_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

function getCloudHsmClient(): CloudHSMV2Client {
  if (cloudhsmv2 && typeof (cloudhsmv2 as any).send === "function") return cloudhsmv2;
  return new CloudHSMV2Client({ endpoint: ENDPOINT, region: DEFAULT_REGION });
}

function getEc2Client(): EC2Client {
  if (ec2 && typeof (ec2 as any).send === "function") return ec2;
  return new EC2Client({ endpoint: ENDPOINT, region: DEFAULT_REGION });
}

function formatDate(d?: Date | string): string | undefined {
  if (!d) return undefined;
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return undefined;
  return dt.toISOString().replace("T", " ").substring(0, 19) + " UTC";
}

/**
 * Fetch all CloudHSM clusters.
 */
export async function describeClustersAction(): Promise<{
  success: boolean;
  clusters: ClusterSummary[];
  error?: string;
}> {
  try {
    const client = getCloudHsmClient();
    const res = await client.send(new DescribeClustersCommand({}));
    const rawClusters = res.Clusters || [];

    const clusters: ClusterSummary[] = rawClusters.map((c) => {
      const hsms: HsmSummary[] = (c.Hsms || []).map((h) => ({
        hsmId: h.HsmId || "",
        clusterId: h.ClusterId || c.ClusterId || "",
        state: h.State || "ACTIVE",
        availabilityZone: h.AvailabilityZone || "",
        subnetId: h.SubnetId,
        eniId: h.EniId,
        eniIp: h.EniIp,
        hsmType: h.HsmType || c.HsmType,
      }));

      return {
        clusterId: c.ClusterId || "",
        state: (c.State as ClusterState) || "UNINITIALIZED",
        hsmType: c.HsmType || "hsm2m.medium",
        mode: (c.Mode as ClusterMode) || "FIPS",
        vpcId: c.VpcId,
        securityGroup: c.SecurityGroup,
        backupPolicy: c.BackupPolicy,
        backupRetentionPolicy: {
          type: c.BackupRetentionPolicy?.Type,
          value: c.BackupRetentionPolicy?.Value,
        },
        createTimestamp: formatDate(c.CreateTimestamp),
        subnetMapping: (c.SubnetMapping as Record<string, string>) || {},
        hsms,
        certificates: {
          clusterCsr: c.Certificates?.ClusterCsr,
          hsmCertificate: c.Certificates?.HsmCertificate,
          awsHardwareCertificate: c.Certificates?.AwsHardwareCertificate,
          manufacturerHardwareCertificate: c.Certificates?.ManufacturerHardwareCertificate,
          clusterCertificate: c.Certificates?.ClusterCertificate,
        },
        tagList: (c.TagList || []).map((t) => ({ Key: t.Key || "", Value: t.Value || "" })),
      };
    });

    return { success: true, clusters };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, clusters: [], error: msg };
  }
}

/**
 * Fetch details for a single CloudHSM cluster.
 */
export async function describeClusterAction(clusterId: string): Promise<{
  success: boolean;
  cluster: ClusterSummary | null;
  error?: string;
}> {
  try {
    const client = getCloudHsmClient();
    const res = await client.send(
      new DescribeClustersCommand({
        Filters: {
          clusterIds: [clusterId],
        },
      })
    );

    const raw = res.Clusters?.[0];
    if (!raw) {
      return { success: false, cluster: null, error: `Cluster "${clusterId}" not found` };
    }

    const hsms: HsmSummary[] = (raw.Hsms || []).map((h) => ({
      hsmId: h.HsmId || "",
      clusterId: h.ClusterId || raw.ClusterId || "",
      state: h.State || "ACTIVE",
      availabilityZone: h.AvailabilityZone || "",
      subnetId: h.SubnetId,
      eniId: h.EniId,
      eniIp: h.EniIp,
      hsmType: h.HsmType || raw.HsmType,
    }));

    const cluster: ClusterSummary = {
      clusterId: raw.ClusterId || clusterId,
      state: (raw.State as ClusterState) || "UNINITIALIZED",
      hsmType: raw.HsmType || "hsm2m.medium",
      mode: (raw.Mode as ClusterMode) || "FIPS",
      vpcId: raw.VpcId,
      securityGroup: raw.SecurityGroup,
      backupPolicy: raw.BackupPolicy,
      backupRetentionPolicy: {
        type: raw.BackupRetentionPolicy?.Type,
        value: raw.BackupRetentionPolicy?.Value,
      },
      createTimestamp: formatDate(raw.CreateTimestamp),
      subnetMapping: (raw.SubnetMapping as Record<string, string>) || {},
      hsms,
      certificates: {
        clusterCsr: raw.Certificates?.ClusterCsr,
        hsmCertificate: raw.Certificates?.HsmCertificate,
        awsHardwareCertificate: raw.Certificates?.AwsHardwareCertificate,
        manufacturerHardwareCertificate: raw.Certificates?.ManufacturerHardwareCertificate,
        clusterCertificate: raw.Certificates?.ClusterCertificate,
      },
      tagList: (raw.TagList || []).map((t) => ({ Key: t.Key || "", Value: t.Value || "" })),
    };

    return { success: true, cluster };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, cluster: null, error: msg };
  }
}

/**
 * Create a new CloudHSM cluster.
 */
export async function createClusterAction(input: CreateClusterInput): Promise<{
  success: boolean;
  cluster?: ClusterSummary;
  error?: string;
}> {
  try {
    const client = getCloudHsmClient();
    const res = await client.send(
      new CreateClusterCommand({
        HsmType: input.hsmType || "hsm2m.medium",
        SubnetIds: input.subnetIds,
        Mode: input.mode || "FIPS",
        BackupRetentionPolicy: {
          Type: "DAYS",
          Value: String(input.backupRetentionPolicyDays || 90),
        },
        ...(input.tagList && input.tagList.length > 0 ? { TagList: input.tagList } : {}),
      })
    );

    const c = res.Cluster;
    if (!c || !c.ClusterId) {
      return { success: false, error: "Failed to create cluster" };
    }

    const cluster: ClusterSummary = {
      clusterId: c.ClusterId,
      state: (c.State as ClusterState) || "CREATE_IN_PROGRESS",
      hsmType: c.HsmType || input.hsmType,
      mode: (c.Mode as ClusterMode) || input.mode || "FIPS",
      vpcId: c.VpcId,
      securityGroup: c.SecurityGroup,
      backupPolicy: c.BackupPolicy,
      backupRetentionPolicy: {
        type: c.BackupRetentionPolicy?.Type,
        value: c.BackupRetentionPolicy?.Value,
      },
      createTimestamp: formatDate(c.CreateTimestamp),
      subnetMapping: (c.SubnetMapping as Record<string, string>) || {},
      hsms: [],
      certificates: {},
      tagList: input.tagList || [],
    };

    revalidatePath("/cloudhsm");
    return { success: true, cluster };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Add an HSM instance to a cluster.
 */
export async function createHsmAction(
  clusterId: string,
  availabilityZone: string,
  ipAddress?: string
): Promise<{
  success: boolean;
  hsm?: HsmSummary;
  error?: string;
}> {
  try {
    const client = getCloudHsmClient();
    const res = await client.send(
      new CreateHsmCommand({
        ClusterId: clusterId,
        AvailabilityZone: availabilityZone,
        ...(ipAddress && ipAddress.trim() ? { IpAddress: ipAddress.trim() } : {}),
      })
    );

    const h = res.Hsm;
    if (!h || !h.HsmId) {
      return { success: false, error: "Failed to create HSM" };
    }

    const hsm: HsmSummary = {
      hsmId: h.HsmId,
      clusterId: h.ClusterId || clusterId,
      state: h.State || "CREATE_IN_PROGRESS",
      availabilityZone: h.AvailabilityZone || availabilityZone,
      subnetId: h.SubnetId,
      eniId: h.EniId,
      eniIp: h.EniIp,
      hsmType: h.HsmType,
    };

    revalidatePath(`/cloudhsm/clusters/${clusterId}`);
    revalidatePath("/cloudhsm");
    return { success: true, hsm };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Delete an HSM instance from a cluster.
 */
export async function deleteHsmAction(
  clusterId: string,
  hsmId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getCloudHsmClient();
    await client.send(
      new DeleteHsmCommand({
        ClusterId: clusterId,
        HsmId: hsmId,
      })
    );

    revalidatePath(`/cloudhsm/clusters/${clusterId}`);
    revalidatePath("/cloudhsm");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Delete a CloudHSM cluster.
 */
export async function deleteClusterAction(clusterId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getCloudHsmClient();
    await client.send(
      new DeleteClusterCommand({
        ClusterId: clusterId,
      })
    );

    revalidatePath("/cloudhsm");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Initialize a CloudHSM cluster with signed cluster certificate and trust anchor.
 */
export async function initializeClusterAction(
  clusterId: string,
  signedCert: string,
  trustAnchor: string
): Promise<{
  success: boolean;
  state?: string;
  error?: string;
}> {
  try {
    const client = getCloudHsmClient();
    const res = await client.send(
      new InitializeClusterCommand({
        ClusterId: clusterId,
        SignedCert: signedCert,
        TrustAnchor: trustAnchor,
      })
    );

    revalidatePath(`/cloudhsm/clusters/${clusterId}`);
    revalidatePath("/cloudhsm");
    return { success: true, state: res.State };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg.includes("NotImplemented")
        ? "Not supported by this emulator: InitializeCluster is scaffolded but not implemented in the local emulator."
        : msg,
    };
  }
}

/**
 * Describe CloudHSM backups.
 */
export async function describeBackupsAction(): Promise<{
  success: boolean;
  backups: BackupSummary[];
  error?: string;
}> {
  try {
    const client = getCloudHsmClient();
    const res = await client.send(new DescribeBackupsCommand({}));
    const rawBackups = res.Backups || [];

    const backups: BackupSummary[] = rawBackups.map((b) => ({
      backupId: b.BackupId || "",
      backupState: b.BackupState,
      clusterId: b.ClusterId,
      createTimestamp: formatDate(b.CreateTimestamp),
      deleteTimestamp: formatDate(b.DeleteTimestamp),
      mode: b.Mode,
      sourceBackup: b.SourceBackup,
      sourceCluster: b.SourceCluster,
      sourceRegion: b.SourceRegion,
    }));

    return { success: true, backups };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      backups: [],
      error: msg.includes("NotImplemented")
        ? "Not supported by this emulator: DescribeBackups is scaffolded but not implemented in the local emulator."
        : msg,
    };
  }
}

/**
 * Fetch VPCs and subnets from the EC2 service in the emulator.
 */
export async function fetchVpcsAndSubnetsAction(): Promise<{
  success: boolean;
  vpcs: VpcOption[];
  subnets: SubnetOption[];
  error?: string;
}> {
  try {
    const ec2Client = getEc2Client();
    const [vpcsRes, subnetsRes] = await Promise.all([
      ec2Client.send(new DescribeVpcsCommand({})),
      ec2Client.send(new DescribeSubnetsCommand({})),
    ]);

    const vpcs: VpcOption[] = (vpcsRes.Vpcs || []).map((v) => {
      const nameTag = v.Tags?.find((t) => t.Key === "Name")?.Value;
      return {
        vpcId: v.VpcId || "",
        cidrBlock: v.CidrBlock,
        isDefault: v.IsDefault,
        name: nameTag || v.VpcId || "",
      };
    });

    const subnets: SubnetOption[] = (subnetsRes.Subnets || []).map((s) => {
      const nameTag = s.Tags?.find((t) => t.Key === "Name")?.Value;
      return {
        subnetId: s.SubnetId || "",
        vpcId: s.VpcId || "",
        availabilityZone: s.AvailabilityZone || "",
        cidrBlock: s.CidrBlock,
        availableIpAddressCount: s.AvailableIpAddressCount,
        name: nameTag,
      };
    });

    return { success: true, vpcs, subnets };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, vpcs: [], subnets: [], error: msg };
  }
}
