/**
 * src/app/directoryservice/actions.ts – Server Actions for AWS Directory Service.
 * Calls @aws-sdk/client-directory-service against the local emulator.
 * Zero emojis, Cloudscape enterprise standard.
 */

"use server";

import { revalidatePath } from "next/cache";
import { ds, ec2 } from "@/lib/aws";
import {
  DirectoryServiceClient,
  DescribeDirectoriesCommand,
  CreateDirectoryCommand,
  CreateMicrosoftADCommand,
  ConnectDirectoryCommand,
  DeleteDirectoryCommand,
  CreateSnapshotCommand,
  DescribeSnapshotsCommand,
  DeleteSnapshotCommand,
  CreateAliasCommand,
  EnableSsoCommand,
  DisableSsoCommand,
  ResetUserPasswordCommand,
  ListTagsForResourceCommand,
  AddTagsToResourceCommand,
  RemoveTagsFromResourceCommand,
  DescribeTrustsCommand,
  DescribeConditionalForwardersCommand,
} from "@aws-sdk/client-directory-service";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from "@aws-sdk/client-ec2";
import {
  DirectorySummary,
  DirectoryStage,
  DirectoryType,
  DirectorySnapshot,
  DirectoryTrust,
  ConditionalForwarder,
  DirectoryTag,
  CreateDirectoryInput,
  VpcOption,
  SubnetOption,
} from "./types";

const ENDPOINT = "https://127.0.0.1:9297";
const DEFAULT_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

function getDsClient(): DirectoryServiceClient {
  if (ds && typeof (ds as any).send === "function") return ds;
  return new DirectoryServiceClient({ endpoint: ENDPOINT, region: DEFAULT_REGION });
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
 * Fetch all directories.
 */
export async function describeDirectoriesAction(): Promise<{
  success: boolean;
  directories: DirectorySummary[];
  error?: string;
}> {
  try {
    const client = getDsClient();
    const res = await client.send(new DescribeDirectoriesCommand({}));
    const rawDirs = res.DirectoryDescriptions || [];

    const directories: DirectorySummary[] = rawDirs.map((d) => ({
      directoryId: d.DirectoryId || "",
      name: d.Name || "",
      shortName: d.ShortName,
      size: d.Size,
      edition: d.Edition,
      alias: d.Alias,
      accessUrl: d.AccessUrl,
      description: d.Description,
      dnsIpAddrs: d.DnsIpAddrs || [],
      stage: (d.Stage as DirectoryStage) || "Active",
      type: (d.Type as DirectoryType) || "SimpleAD",
      vpcSettings: {
        vpcId: d.VpcSettings?.VpcId,
        subnetIds: d.VpcSettings?.SubnetIds || [],
        securityGroupId: d.VpcSettings?.SecurityGroupId,
        availabilityZones: d.VpcSettings?.AvailabilityZones || [],
      },
      ssoEnabled: !!d.SsoEnabled,
      launchTime: formatDate(d.LaunchTime),
      stageLastUpdatedDateTime: formatDate(d.StageLastUpdatedDateTime),
      desiredNumberOfDomainControllers: d.DesiredNumberOfDomainControllers,
    }));

    return { success: true, directories };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, directories: [], error: msg };
  }
}

/**
 * Fetch details for a single directory.
 */
export async function describeDirectoryAction(directoryId: string): Promise<{
  success: boolean;
  directory: DirectorySummary | null;
  error?: string;
}> {
  try {
    const client = getDsClient();
    const res = await client.send(
      new DescribeDirectoriesCommand({
        DirectoryIds: [directoryId],
      })
    );

    const d = res.DirectoryDescriptions?.[0];
    if (!d) {
      return { success: false, directory: null, error: `Directory "${directoryId}" not found` };
    }

    const directory: DirectorySummary = {
      directoryId: d.DirectoryId || directoryId,
      name: d.Name || "",
      shortName: d.ShortName,
      size: d.Size,
      edition: d.Edition,
      alias: d.Alias,
      accessUrl: d.AccessUrl,
      description: d.Description,
      dnsIpAddrs: d.DnsIpAddrs || [],
      stage: (d.Stage as DirectoryStage) || "Active",
      type: (d.Type as DirectoryType) || "SimpleAD",
      vpcSettings: {
        vpcId: d.VpcSettings?.VpcId,
        subnetIds: d.VpcSettings?.SubnetIds || [],
        securityGroupId: d.VpcSettings?.SecurityGroupId,
        availabilityZones: d.VpcSettings?.AvailabilityZones || [],
      },
      ssoEnabled: !!d.SsoEnabled,
      launchTime: formatDate(d.LaunchTime),
      stageLastUpdatedDateTime: formatDate(d.StageLastUpdatedDateTime),
      desiredNumberOfDomainControllers: d.DesiredNumberOfDomainControllers,
    };

    return { success: true, directory };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, directory: null, error: msg };
  }
}

/**
 * Create a new directory (Simple AD, AWS Managed Microsoft AD, or AD Connector).
 */
export async function createDirectoryAction(input: CreateDirectoryInput): Promise<{
  success: boolean;
  directoryId?: string;
  error?: string;
}> {
  try {
    const client = getDsClient();
    let directoryId: string | undefined;

    if (input.type === "MicrosoftAD") {
      const res = await client.send(
        new CreateMicrosoftADCommand({
          Name: input.name,
          ShortName: input.shortName,
          Password: input.password || "Password123!",
          Description: input.description,
          Edition: input.edition || "Standard",
          VpcSettings: {
            VpcId: input.vpcId,
            SubnetIds: input.subnetIds,
          },
          ...(input.tags && input.tags.length > 0 ? { Tags: input.tags } : {}),
        })
      );
      directoryId = res.DirectoryId;
    } else if (input.type === "SimpleAD") {
      const res = await client.send(
        new CreateDirectoryCommand({
          Name: input.name,
          ShortName: input.shortName,
          Password: input.password || "Password123!",
          Description: input.description,
          Size: input.size || "Small",
          VpcSettings: {
            VpcId: input.vpcId,
            SubnetIds: input.subnetIds,
          },
          ...(input.tags && input.tags.length > 0 ? { Tags: input.tags } : {}),
        })
      );
      directoryId = res.DirectoryId;
    } else {
      const res = await client.send(
        new ConnectDirectoryCommand({
          Name: input.name,
          ShortName: input.shortName,
          Password: input.password || "Password123!",
          Description: input.description,
          Size: input.size || "Small",
          ConnectSettings: {
            VpcId: input.vpcId,
            SubnetIds: input.subnetIds,
            CustomerDnsIps: ["10.0.0.1", "10.0.0.2"],
            CustomerUserName: "Administrator",
          },
          ...(input.tags && input.tags.length > 0 ? { Tags: input.tags } : {}),
        })
      );
      directoryId = res.DirectoryId;
    }

    revalidatePath("/directoryservice");
    return { success: true, directoryId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Delete a directory.
 */
export async function deleteDirectoryAction(directoryId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getDsClient();
    await client.send(
      new DeleteDirectoryCommand({
        DirectoryId: directoryId,
      })
    );

    revalidatePath("/directoryservice");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Create a manual directory snapshot.
 */
export async function createSnapshotAction(
  directoryId: string,
  name?: string
): Promise<{
  success: boolean;
  snapshotId?: string;
  error?: string;
}> {
  try {
    const client = getDsClient();
    const res = await client.send(
      new CreateSnapshotCommand({
        DirectoryId: directoryId,
        Name: name,
      })
    );

    revalidatePath(`/directoryservice/directories/${directoryId}`);
    return { success: true, snapshotId: res.SnapshotId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Fetch snapshots for a directory.
 */
export async function describeSnapshotsAction(directoryId: string): Promise<{
  success: boolean;
  snapshots: DirectorySnapshot[];
  error?: string;
}> {
  try {
    const client = getDsClient();
    const res = await client.send(
      new DescribeSnapshotsCommand({
        DirectoryId: directoryId,
      })
    );

    const snapshots: DirectorySnapshot[] = (res.Snapshots || []).map((s) => ({
      snapshotId: s.SnapshotId || "",
      directoryId: s.DirectoryId || directoryId,
      type: s.Type,
      name: s.Name,
      status: s.Status,
      startTime: formatDate(s.StartTime),
    }));

    return { success: true, snapshots };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, snapshots: [], error: msg };
  }
}

/**
 * Delete a snapshot.
 */
export async function deleteSnapshotAction(
  snapshotId: string,
  directoryId?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getDsClient();
    await client.send(
      new DeleteSnapshotCommand({
        SnapshotId: snapshotId,
      })
    );

    if (directoryId) {
      revalidatePath(`/directoryservice/directories/${directoryId}`);
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Create an access URL alias for a directory.
 */
export async function createAliasAction(
  directoryId: string,
  alias: string
): Promise<{
  success: boolean;
  alias?: string;
  error?: string;
}> {
  try {
    const client = getDsClient();
    const res = await client.send(
      new CreateAliasCommand({
        DirectoryId: directoryId,
        Alias: alias,
      })
    );

    revalidatePath(`/directoryservice/directories/${directoryId}`);
    revalidatePath("/directoryservice");
    return { success: true, alias: res.Alias };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Enable Single Sign-On (SSO) for a directory.
 */
export async function enableSsoAction(directoryId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getDsClient();
    await client.send(
      new EnableSsoCommand({
        DirectoryId: directoryId,
      })
    );

    revalidatePath(`/directoryservice/directories/${directoryId}`);
    revalidatePath("/directoryservice");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Disable Single Sign-On (SSO) for a directory.
 */
export async function disableSsoAction(directoryId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getDsClient();
    await client.send(
      new DisableSsoCommand({
        DirectoryId: directoryId,
      })
    );

    revalidatePath(`/directoryservice/directories/${directoryId}`);
    revalidatePath("/directoryservice");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Reset user password (default user: Administrator).
 */
export async function resetUserPasswordAction(
  directoryId: string,
  userName: string,
  newPassword: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getDsClient();
    await client.send(
      new ResetUserPasswordCommand({
        DirectoryId: directoryId,
        UserName: userName,
        NewPassword: newPassword,
      })
    );

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * List tags for a directory.
 */
export async function listTagsForResourceAction(resourceId: string): Promise<{
  success: boolean;
  tags: DirectoryTag[];
  error?: string;
}> {
  try {
    const client = getDsClient();
    const res = await client.send(
      new ListTagsForResourceCommand({
        ResourceId: resourceId,
      })
    );

    const tags: DirectoryTag[] = (res.Tags || []).map((t) => ({
      Key: t.Key || "",
      Value: t.Value || "",
    }));

    return { success: true, tags };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, tags: [], error: msg };
  }
}

/**
 * Add tags to a directory.
 */
export async function addTagsToResourceAction(
  resourceId: string,
  tags: DirectoryTag[]
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getDsClient();
    await client.send(
      new AddTagsToResourceCommand({
        ResourceId: resourceId,
        Tags: tags,
      })
    );

    revalidatePath(`/directoryservice/directories/${resourceId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Remove tags from a directory.
 */
export async function removeTagsFromResourceAction(
  resourceId: string,
  tagKeys: string[]
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getDsClient();
    await client.send(
      new RemoveTagsFromResourceCommand({
        ResourceId: resourceId,
        TagKeys: tagKeys,
      })
    );

    revalidatePath(`/directoryservice/directories/${resourceId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Describe trust relationships for a directory.
 */
export async function describeTrustsAction(directoryId: string): Promise<{
  success: boolean;
  trusts: DirectoryTrust[];
  error?: string;
}> {
  try {
    const client = getDsClient();
    const res = await client.send(
      new DescribeTrustsCommand({
        DirectoryId: directoryId,
      })
    );

    const trusts: DirectoryTrust[] = (res.Trusts || []).map((t) => ({
      directoryId: t.DirectoryId || directoryId,
      trustId: t.TrustId || "",
      remoteDomainName: t.RemoteDomainName || "",
      trustType: t.TrustType,
      trustDirection: t.TrustDirection,
      trustState: t.TrustState,
      createdDateTime: formatDate(t.CreatedDateTime),
    }));

    return { success: true, trusts };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, trusts: [], error: msg };
  }
}

/**
 * Describe conditional forwarders for a directory.
 */
export async function describeConditionalForwardersAction(directoryId: string): Promise<{
  success: boolean;
  forwarders: ConditionalForwarder[];
  error?: string;
}> {
  try {
    const client = getDsClient();
    const res = await client.send(
      new DescribeConditionalForwardersCommand({
        DirectoryId: directoryId,
      })
    );

    const forwarders: ConditionalForwarder[] = (res.ConditionalForwarders || []).map((f) => ({
      remoteDomainName: f.RemoteDomainName || "",
      dnsIpAddrs: f.DnsIpAddrs || [],
      replicationScope: f.ReplicationScope,
    }));

    return { success: true, forwarders };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, forwarders: [], error: msg };
  }
}

/**
 * Fetch VPCs and subnets from the local EC2 emulator.
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
