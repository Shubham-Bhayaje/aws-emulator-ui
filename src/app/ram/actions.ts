"use server";

import { ram, ec2, kms, sts } from "@/lib/aws";
import {
  GetResourceSharesCommand,
  CreateResourceShareCommand,
  UpdateResourceShareCommand,
  DeleteResourceShareCommand,
  AssociateResourceShareCommand,
  DisassociateResourceShareCommand,
  GetResourceShareAssociationsCommand,
  GetResourceShareInvitationsCommand,
  ListPermissionsCommand,
  GetPermissionCommand,
  ListResourceTypesCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-ram";
import { DescribeSubnetsCommand, DescribeVpcsCommand } from "@aws-sdk/client-ec2";
import { ListKeysCommand, DescribeKeyCommand } from "@aws-sdk/client-kms";
import { GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import {
  RAMResourceShare,
  RAMResource,
  RAMPrincipal,
  RAMPermission,
  RAMInvitation,
  RAMTag,
  AvailableShareableResource,
} from "./types";

/**
 * Helper to fetch caller account ID
 */
async function getAccountId(): Promise<string> {
  try {
    const res = await sts.send(new GetCallerIdentityCommand({}));
    return res.Account || "123456789012";
  } catch {
    return "123456789012";
  }
}

/**
 * Fetch resource shares owned by SELF or OTHER-ACCOUNTS
 */
export async function fetchResourceShares(
  owner: "SELF" | "OTHER-ACCOUNTS" = "SELF"
): Promise<{ success: boolean; data: RAMResourceShare[]; error?: string }> {
  try {
    const command = new GetResourceSharesCommand({
      resourceOwner: owner,
    });
    const res = await ram.send(command);
    const shares: RAMResourceShare[] = (res.resourceShares || []).map((s) => ({
      arn: s.resourceShareArn || "",
      name: s.name || "",
      status: (s.status as any) || "ACTIVE",
      statusMessage: s.statusMessage,
      owner: s.owningAccountId || "",
      allowExternalPrincipals: s.allowExternalPrincipals ?? true,
      creationTime: s.creationTime ? new Date(s.creationTime).toISOString() : undefined,
      lastUpdatedTime: s.lastUpdatedTime ? new Date(s.lastUpdatedTime).toISOString() : undefined,
      tags: (s.tags || []).map((t) => ({ key: t.key || "", value: t.value || "" })),
    }));

    return { success: true, data: shares };
  } catch (err: any) {
    console.error("fetchResourceShares error:", err);
    return { success: false, data: [], error: err.message || "Failed to fetch resource shares" };
  }
}

/**
 * Fetch detailed resource share info including associations, permissions and tags
 */
export async function fetchResourceShareDetail(shareArn: string): Promise<{
  success: boolean;
  share?: RAMResourceShare;
  resources: RAMResource[];
  principals: RAMPrincipal[];
  permissions: RAMPermission[];
  tags: RAMTag[];
  error?: string;
}> {
  try {
    // 1. Get the share itself
    const shareRes = await ram.send(
      new GetResourceSharesCommand({
        resourceShareArns: [shareArn],
        resourceOwner: "SELF",
      })
    );

    const rawShare = shareRes.resourceShares?.[0];
    if (!rawShare) {
      // Check OTHER-ACCOUNTS
      const otherRes = await ram.send(
        new GetResourceSharesCommand({
          resourceShareArns: [shareArn],
          resourceOwner: "OTHER-ACCOUNTS",
        })
      );
      if (!otherRes.resourceShares?.[0]) {
        return {
          success: false,
          resources: [],
          principals: [],
          permissions: [],
          tags: [],
          error: "Resource share not found",
        };
      }
    }

    const s = rawShare || (await ram.send(new GetResourceSharesCommand({ resourceShareArns: [shareArn], resourceOwner: "OTHER-ACCOUNTS" }))).resourceShares?.[0]!;

    const share: RAMResourceShare = {
      arn: s.resourceShareArn || "",
      name: s.name || "",
      status: (s.status as any) || "ACTIVE",
      statusMessage: s.statusMessage,
      owner: s.owningAccountId || "",
      allowExternalPrincipals: s.allowExternalPrincipals ?? true,
      creationTime: s.creationTime ? new Date(s.creationTime).toISOString() : undefined,
      lastUpdatedTime: s.lastUpdatedTime ? new Date(s.lastUpdatedTime).toISOString() : undefined,
      tags: (s.tags || []).map((t) => ({ key: t.key || "", value: t.value || "" })),
    };

    // 2. Fetch associated resources
    let resources: RAMResource[] = [];
    try {
      const resAssoc = await ram.send(
        new GetResourceShareAssociationsCommand({
          resourceShareArns: [shareArn],
          associationType: "RESOURCE",
        })
      );
      resources = (resAssoc.resourceShareAssociations || []).map((a) => ({
        arn: a.associatedEntity || "",
        type: (a as any).resourceType || (a.associatedEntity?.includes(":subnet/") ? "ec2:Subnet" : a.associatedEntity?.includes(":key/") ? "kms:Key" : "AWS Resource"),
        resourceShareArn: a.resourceShareArn || shareArn,
        resourceShareName: a.resourceShareName || share.name,
        status: (a.status as any) || "ASSOCIATED",
        statusMessage: a.statusMessage,
        lastUpdatedTime: a.lastUpdatedTime ? new Date(a.lastUpdatedTime).toISOString() : undefined,
        creationTime: a.creationTime ? new Date(a.creationTime).toISOString() : undefined,
      }));
    } catch (e) {
      console.warn("Could not fetch resource associations:", e);
    }

    // 3. Fetch associated principals
    let principals: RAMPrincipal[] = [];
    try {
      const prinAssoc = await ram.send(
        new GetResourceShareAssociationsCommand({
          resourceShareArns: [shareArn],
          associationType: "PRINCIPAL",
        })
      );
      principals = (prinAssoc.resourceShareAssociations || []).map((a) => ({
        id: a.associatedEntity || "",
        resourceShareArn: a.resourceShareArn || shareArn,
        resourceShareName: a.resourceShareName || share.name,
        status: (a.status as any) || "ASSOCIATED",
        statusMessage: a.statusMessage,
        lastUpdatedTime: a.lastUpdatedTime ? new Date(a.lastUpdatedTime).toISOString() : undefined,
        creationTime: a.creationTime ? new Date(a.creationTime).toISOString() : undefined,
      }));
    } catch (e) {
      console.warn("Could not fetch principal associations:", e);
    }

    // 4. Permissions (RAM default managed permissions for associated resource types)
    let permissions: RAMPermission[] = [];
    try {
      // Look up permissions matching the resource types in this share
      const types = Array.from(new Set(resources.map((r) => r.type)));
      const pList = await ram.send(new ListPermissionsCommand({}));
      permissions = (pList.permissions || [])
        .filter((p) => types.length === 0 || types.includes(p.resourceType || ""))
        .map((p) => ({
          arn: p.arn || "",
          name: p.name || "",
          version: p.version || "1",
          resourceType: p.resourceType || "",
          status: p.status || "ATTACHABLE",
          creationTime: p.creationTime ? new Date(p.creationTime).toISOString() : undefined,
          lastUpdatedTime: p.lastUpdatedTime ? new Date(p.lastUpdatedTime).toISOString() : undefined,
          isResourceTypeDefault: p.defaultVersion ?? true,
        }));
    } catch (e) {
      console.warn("Could not fetch permissions for share:", e);
    }

    return {
      success: true,
      share,
      resources,
      principals,
      permissions,
      tags: share.tags || [],
    };
  } catch (err: any) {
    console.error("fetchResourceShareDetail error:", err);
    return {
      success: false,
      resources: [],
      principals: [],
      permissions: [],
      tags: [],
      error: err.message || "Failed to fetch resource share detail",
    };
  }
}

/**
 * Create a new resource share
 */
export async function createResourceShareAction(payload: {
  name: string;
  allowExternalPrincipals: boolean;
  resourceArns?: string[];
  principals?: string[];
  permissionArns?: string[];
  tags?: RAMTag[];
}): Promise<{ success: boolean; data?: RAMResourceShare; error?: string }> {
  try {
    const res = await ram.send(
      new CreateResourceShareCommand({
        name: payload.name,
        allowExternalPrincipals: payload.allowExternalPrincipals,
        resourceArns: payload.resourceArns && payload.resourceArns.length > 0 ? payload.resourceArns : undefined,
        principals: payload.principals && payload.principals.length > 0 ? payload.principals : undefined,
        permissionArns: payload.permissionArns && payload.permissionArns.length > 0 ? payload.permissionArns : undefined,
        tags: payload.tags && payload.tags.length > 0 ? payload.tags.map((t) => ({ key: t.key, value: t.value })) : undefined,
      })
    );

    const s = res.resourceShare;
    if (!s) {
      return { success: false, error: "No resource share returned from AWS RAM" };
    }

    return {
      success: true,
      data: {
        arn: s.resourceShareArn || "",
        name: s.name || "",
        status: (s.status as any) || "ACTIVE",
        owner: s.owningAccountId || "",
        allowExternalPrincipals: s.allowExternalPrincipals ?? true,
        creationTime: s.creationTime ? new Date(s.creationTime).toISOString() : undefined,
        lastUpdatedTime: s.lastUpdatedTime ? new Date(s.lastUpdatedTime).toISOString() : undefined,
        tags: (s.tags || []).map((t) => ({ key: t.key || "", value: t.value || "" })),
      },
    };
  } catch (err: any) {
    console.error("createResourceShareAction error:", err);
    return { success: false, error: err.message || "Failed to create resource share" };
  }
}

/**
 * Update resource share metadata (name, allowExternalPrincipals)
 */
export async function updateResourceShareAction(
  shareArn: string,
  name: string,
  allowExternalPrincipals: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await ram.send(
      new UpdateResourceShareCommand({
        resourceShareArn: shareArn,
        name,
        allowExternalPrincipals,
      })
    );
    return { success: true };
  } catch (err: any) {
    console.error("updateResourceShareAction error:", err);
    return { success: false, error: err.message || "Failed to update resource share" };
  }
}

/**
 * Delete a resource share
 */
export async function deleteResourceShareAction(shareArn: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ram.send(
      new DeleteResourceShareCommand({
        resourceShareArn: shareArn,
      })
    );
    return { success: true };
  } catch (err: any) {
    console.error("deleteResourceShareAction error:", err);
    return { success: false, error: err.message || "Failed to delete resource share" };
  }
}

/**
 * Associate resources to an existing resource share
 */
export async function associateResourcesAction(
  shareArn: string,
  resourceArns: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await ram.send(
      new AssociateResourceShareCommand({
        resourceShareArn: shareArn,
        resourceArns,
      })
    );
    return { success: true };
  } catch (err: any) {
    console.error("associateResourcesAction error:", err);
    return { success: false, error: err.message || "Failed to associate resources" };
  }
}

/**
 * Disassociate resources from a resource share
 */
export async function disassociateResourcesAction(
  shareArn: string,
  resourceArns: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await ram.send(
      new DisassociateResourceShareCommand({
        resourceShareArn: shareArn,
        resourceArns,
      })
    );
    return { success: true };
  } catch (err: any) {
    console.error("disassociateResourcesAction error:", err);
    return { success: false, error: err.message || "Failed to disassociate resources" };
  }
}

/**
 * Associate principals to an existing resource share
 */
export async function associatePrincipalsAction(
  shareArn: string,
  principals: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await ram.send(
      new AssociateResourceShareCommand({
        resourceShareArn: shareArn,
        principals,
      })
    );
    return { success: true };
  } catch (err: any) {
    console.error("associatePrincipalsAction error:", err);
    return { success: false, error: err.message || "Failed to associate principals" };
  }
}

/**
 * Disassociate principals from a resource share
 */
export async function disassociatePrincipalsAction(
  shareArn: string,
  principals: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await ram.send(
      new DisassociateResourceShareCommand({
        resourceShareArn: shareArn,
        principals,
      })
    );
    return { success: true };
  } catch (err: any) {
    console.error("disassociatePrincipalsAction error:", err);
    return { success: false, error: err.message || "Failed to disassociate principals" };
  }
}

/**
 * Fetch permissions list from RAM
 */
export async function fetchPermissions(
  resourceType?: string
): Promise<{ success: boolean; data: RAMPermission[]; error?: string }> {
  try {
    const res = await ram.send(
      new ListPermissionsCommand({
        resourceType: resourceType || undefined,
      })
    );
    const perms: RAMPermission[] = (res.permissions || []).map((p) => ({
      arn: p.arn || "",
      name: p.name || "",
      version: p.version || "1",
      resourceType: p.resourceType || "",
      status: p.status || "ATTACHABLE",
      creationTime: p.creationTime ? new Date(p.creationTime).toISOString() : undefined,
      lastUpdatedTime: p.lastUpdatedTime ? new Date(p.lastUpdatedTime).toISOString() : undefined,
      isResourceTypeDefault: p.defaultVersion ?? true,
    }));
    return { success: true, data: perms };
  } catch (err: any) {
    console.error("fetchPermissions error:", err);
    return { success: false, data: [], error: err.message || "Failed to fetch permissions" };
  }
}

/**
 * Get detailed policy JSON for a permission
 */
export async function fetchPermissionDetail(
  permissionArn: string
): Promise<{ success: boolean; data?: RAMPermission; error?: string }> {
  try {
    const res = await ram.send(
      new GetPermissionCommand({
        permissionArn,
      })
    );
    const p = res.permission;
    if (!p) {
      return { success: false, error: "Permission not found" };
    }
    return {
      success: true,
      data: {
        arn: p.arn || "",
        name: p.name || "",
        version: p.version || "1",
        resourceType: p.resourceType || "",
        status: p.status || "ATTACHABLE",
        creationTime: p.creationTime ? new Date(p.creationTime).toISOString() : undefined,
        lastUpdatedTime: p.lastUpdatedTime ? new Date(p.lastUpdatedTime).toISOString() : undefined,
        isResourceTypeDefault: p.defaultVersion ?? true,
        permission: p.permission,
      },
    };
  } catch (err: any) {
    console.error("fetchPermissionDetail error:", err);
    return { success: false, error: err.message || "Failed to fetch permission detail" };
  }
}

/**
 * Fetch resource types supported by RAM
 */
export async function fetchResourceTypes(): Promise<{ success: boolean; data: string[]; error?: string }> {
  try {
    const res = await ram.send(new ListResourceTypesCommand({}));
    const types = (res.resourceTypes || []).map((t) => t.resourceType || "").filter(Boolean);
    return { success: true, data: types };
  } catch (err: any) {
    console.error("fetchResourceTypes error:", err);
    return { success: false, data: [], error: err.message || "Failed to fetch resource types" };
  }
}

/**
 * Fetch invitations received
 */
export async function fetchInvitations(): Promise<{ success: boolean; data: RAMInvitation[]; error?: string }> {
  try {
    const res = await ram.send(new GetResourceShareInvitationsCommand({}));
    const list: RAMInvitation[] = (res.resourceShareInvitations || []).map((inv) => ({
      resourceShareInvitationArn: inv.resourceShareInvitationArn || "",
      resourceShareName: inv.resourceShareName || "",
      resourceShareArn: inv.resourceShareArn || "",
      senderAccountId: inv.senderAccountId || "",
      receiverAccountId: inv.receiverAccountId || "",
      invitationTimestamp: inv.invitationTimestamp ? new Date(inv.invitationTimestamp).toISOString() : undefined,
      status: (inv.status as any) || "PENDING",
    }));
    return { success: true, data: list };
  } catch (err: any) {
    console.error("fetchInvitations error:", err);
    return { success: false, data: [], error: err.message || "Failed to fetch invitations" };
  }
}

/**
 * Aggregate all shared resources across active shares
 */
export async function fetchAllSharedResources(
  owner: "SELF" | "OTHER-ACCOUNTS" = "SELF"
): Promise<{ success: boolean; data: RAMResource[]; error?: string }> {
  try {
    const sharesRes = await fetchResourceShares(owner);
    if (!sharesRes.success || sharesRes.data.length === 0) {
      return { success: true, data: [] };
    }

    const shareArns = sharesRes.data.map((s) => s.arn);
    const assocRes = await ram.send(
      new GetResourceShareAssociationsCommand({
        resourceShareArns: shareArns,
        associationType: "RESOURCE",
      })
    );

    const shareNameMap = new Map<string, string>();
    sharesRes.data.forEach((s) => shareNameMap.set(s.arn, s.name));

    const resources: RAMResource[] = (assocRes.resourceShareAssociations || []).map((a) => {
      const entity = a.associatedEntity || "";
      const type = (a as any).resourceType || (entity.includes(":subnet/") ? "ec2:Subnet" : entity.includes(":key/") ? "kms:Key" : "AWS Resource");
      return {
        arn: entity,
        type,
        resourceShareArn: a.resourceShareArn || "",
        resourceShareName: shareNameMap.get(a.resourceShareArn || "") || a.resourceShareName || "Resource Share",
        status: (a.status as any) || "ASSOCIATED",
        statusMessage: a.statusMessage,
        lastUpdatedTime: a.lastUpdatedTime ? new Date(a.lastUpdatedTime).toISOString() : undefined,
        creationTime: a.creationTime ? new Date(a.creationTime).toISOString() : undefined,
      };
    });

    return { success: true, data: resources };
  } catch (err: any) {
    console.error("fetchAllSharedResources error:", err);
    return { success: false, data: [], error: err.message || "Failed to fetch shared resources" };
  }
}

/**
 * Aggregate all principals across active shares
 */
export async function fetchAllPrincipals(
  owner: "SELF" | "OTHER-ACCOUNTS" = "SELF"
): Promise<{ success: boolean; data: RAMPrincipal[]; error?: string }> {
  try {
    const sharesRes = await fetchResourceShares(owner);
    if (!sharesRes.success || sharesRes.data.length === 0) {
      return { success: true, data: [] };
    }

    const shareArns = sharesRes.data.map((s) => s.arn);
    const assocRes = await ram.send(
      new GetResourceShareAssociationsCommand({
        resourceShareArns: shareArns,
        associationType: "PRINCIPAL",
      })
    );

    const shareNameMap = new Map<string, string>();
    sharesRes.data.forEach((s) => shareNameMap.set(s.arn, s.name));

    const principals: RAMPrincipal[] = (assocRes.resourceShareAssociations || []).map((a) => ({
      id: a.associatedEntity || "",
      resourceShareArn: a.resourceShareArn || "",
      resourceShareName: shareNameMap.get(a.resourceShareArn || "") || a.resourceShareName || "Resource Share",
      status: (a.status as any) || "ASSOCIATED",
      statusMessage: a.statusMessage,
      lastUpdatedTime: a.lastUpdatedTime ? new Date(a.lastUpdatedTime).toISOString() : undefined,
      creationTime: a.creationTime ? new Date(a.creationTime).toISOString() : undefined,
    }));

    return { success: true, data: principals };
  } catch (err: any) {
    console.error("fetchAllPrincipals error:", err);
    return { success: false, data: [], error: err.message || "Failed to fetch principals" };
  }
}

/**
 * Fetch real shareable resources from EC2 (Subnets, VPCs) and KMS (Keys)
 */
export async function fetchAvailableResourcesForSharing(): Promise<{
  success: boolean;
  data: AvailableShareableResource[];
  error?: string;
}> {
  try {
    const accountId = await getAccountId();
    const region = "us-east-1";
    const resources: AvailableShareableResource[] = [];

    // 1. Fetch real Subnets from EC2
    try {
      const subnetsRes = await ec2.send(new DescribeSubnetsCommand({}));
      if (subnetsRes.Subnets) {
        for (const subnet of subnetsRes.Subnets) {
          if (!subnet.SubnetId) continue;
          const nameTag = subnet.Tags?.find((t) => t.Key === "Name")?.Value;
          const subnetArn = subnet.SubnetArn || `arn:aws:ec2:${region}:${accountId}:subnet/${subnet.SubnetId}`;
          resources.push({
            arn: subnetArn,
            id: subnet.SubnetId,
            name: nameTag || subnet.SubnetId,
            type: "ec2:Subnet",
            service: "Amazon Virtual Private Cloud",
            region: subnet.AvailabilityZone ? subnet.AvailabilityZone.slice(0, -1) : region,
          });
        }
      }
    } catch (e) {
      console.warn("Could not fetch subnets for RAM:", e);
    }

    // 2. Fetch real KMS keys
    try {
      const keysRes = await kms.send(new ListKeysCommand({}));
      if (keysRes.Keys) {
        for (const k of keysRes.Keys.slice(0, 20)) {
          if (!k.KeyId) continue;
          try {
            const desc = await kms.send(new DescribeKeyCommand({ KeyId: k.KeyId }));
            const meta = desc.KeyMetadata;
            if (meta && meta.KeyArn) {
              resources.push({
                arn: meta.KeyArn,
                id: meta.KeyId || k.KeyId,
                name: meta.Description || meta.KeyId || k.KeyId,
                type: "kms:Key",
                service: "AWS Key Management Service",
                region: region,
              });
            }
          } catch {
            resources.push({
              arn: k.KeyArn || `arn:aws:kms:${region}:${accountId}:key/${k.KeyId}`,
              id: k.KeyId,
              name: k.KeyId,
              type: "kms:Key",
              service: "AWS Key Management Service",
              region: region,
            });
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch KMS keys for RAM:", e);
    }

    return { success: true, data: resources };
  } catch (err: any) {
    console.error("fetchAvailableResourcesForSharing error:", err);
    return { success: false, data: [], error: err.message || "Failed to load shareable resources" };
  }
}

/**
 * Tag a resource share
 */
export async function tagResourceShareAction(
  shareArn: string,
  tags: RAMTag[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await ram.send(
      new TagResourceCommand({
        resourceShareArn: shareArn,
        tags: tags.map((t) => ({ key: t.key, value: t.value })),
      })
    );
    return { success: true };
  } catch (err: any) {
    console.error("tagResourceShareAction error:", err);
    return { success: false, error: err.message || "Failed to tag resource share" };
  }
}

/**
 * Untag a resource share
 */
export async function untagResourceShareAction(
  shareArn: string,
  tagKeys: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await ram.send(
      new UntagResourceCommand({
        resourceShareArn: shareArn,
        tagKeys,
      })
    );
    return { success: true };
  } catch (err: any) {
    console.error("untagResourceShareAction error:", err);
    return { success: false, error: err.message || "Failed to untag resource share" };
  }
}
