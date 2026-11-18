/**
 * IAM server actions – manage Users, Roles, Policies, and attachments.
 * Strictly enforced against the active identity session via local IAM Policy Engine.
 */

"use server";

import { iam } from "@/lib/aws";
import {
  CreateUserCommand,
  DeleteUserCommand,
  AttachUserPolicyCommand,
  DetachUserPolicyCommand,
  ListAttachedUserPoliciesCommand,
  CreateRoleCommand,
  DeleteRoleCommand,
  AttachRolePolicyCommand,
  DetachRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
  CreatePolicyCommand,
  DeletePolicyCommand,
  GetPolicyCommand,
  GetPolicyVersionCommand,
} from "@aws-sdk/client-iam";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveIdentity } from "@/lib/identity";
import { assertPermission } from "@/lib/permissions";

// Create a new IAM User
export async function createUser(formData: FormData) {
  const userName = (formData.get("userName") as string)?.trim();
  const policyArn = (formData.get("policyArn") as string)?.trim();

  if (!userName) {
    return { error: "User name is required." };
  }

  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:CreateUser",
      `arn:aws:iam::${identity.accountId}:user/${userName}`
    );

    if (policyArn) {
      assertPermission(
        identity,
        "iam:AttachUserPolicy",
        `arn:aws:iam::${identity.accountId}:user/${userName}`
      );
    }

    await iam.send(new CreateUserCommand({ UserName: userName }));

    if (policyArn) {
      await iam.send(
        new AttachUserPolicyCommand({
          UserName: userName,
          PolicyArn: policyArn,
        })
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath("/iam/users");
  revalidatePath("/iam");
  redirect("/iam/users");
}

// Delete an IAM User (detaches attached policies first)
export async function deleteUser(userName: string) {
  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:DeleteUser",
      `arn:aws:iam::${identity.accountId}:user/${userName}`
    );

    // Detach all attached policies first
    const attached = await iam.send(
      new ListAttachedUserPoliciesCommand({ UserName: userName })
    );
    for (const p of attached.AttachedPolicies ?? []) {
      if (p.PolicyArn) {
        assertPermission(
          identity,
          "iam:DetachUserPolicy",
          `arn:aws:iam::${identity.accountId}:user/${userName}`
        );
        await iam.send(
          new DetachUserPolicyCommand({
            UserName: userName,
            PolicyArn: p.PolicyArn,
          })
        );
      }
    }

    await iam.send(new DeleteUserCommand({ UserName: userName }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath("/iam/users");
  revalidatePath("/iam");
  return { success: true };
}

// Attach a policy to a user
export async function attachUserPolicy(userName: string, policyArn: string) {
  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:AttachUserPolicy",
      `arn:aws:iam::${identity.accountId}:user/${userName}`
    );

    await iam.send(
      new AttachUserPolicyCommand({
        UserName: userName,
        PolicyArn: policyArn,
      })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath(`/iam/users/${encodeURIComponent(userName)}`);
  return { success: true };
}

// Detach a policy from a user
export async function detachUserPolicy(userName: string, policyArn: string) {
  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:DetachUserPolicy",
      `arn:aws:iam::${identity.accountId}:user/${userName}`
    );

    await iam.send(
      new DetachUserPolicyCommand({
        UserName: userName,
        PolicyArn: policyArn,
      })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath(`/iam/users/${encodeURIComponent(userName)}`);
  return { success: true };
}

// Create a new IAM Role
export async function createRole(formData: FormData) {
  const roleName = (formData.get("roleName") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const serviceType = (formData.get("serviceType") as string) || "lambda";
  const customTrustJson = (formData.get("customTrustJson") as string)?.trim();
  const policyArn = (formData.get("policyArn") as string)?.trim();

  if (!roleName) {
    return { error: "Role name is required." };
  }

  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:CreateRole",
      `arn:aws:iam::${identity.accountId}:role/${roleName}`
    );

    if (policyArn) {
      assertPermission(
        identity,
        "iam:AttachRolePolicy",
        `arn:aws:iam::${identity.accountId}:role/${roleName}`
      );
    }

    let assumeRoleDoc: string;

    if (serviceType === "custom" && customTrustJson) {
      try {
        JSON.parse(customTrustJson);
        assumeRoleDoc = customTrustJson;
      } catch {
        return { error: "Custom trust policy must be valid JSON." };
      }
    } else {
      const serviceDomain =
        serviceType === "ec2"
          ? "ec2.amazonaws.com"
          : serviceType === "ecs"
          ? "ecs-tasks.amazonaws.com"
          : serviceType === "apigateway"
          ? "apigateway.amazonaws.com"
          : "lambda.amazonaws.com";

      assumeRoleDoc = JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: serviceDomain },
            Action: "sts:AssumeRole",
          },
        ],
      });
    }

    await iam.send(
      new CreateRoleCommand({
        RoleName: roleName,
        Description: description || undefined,
        AssumeRolePolicyDocument: assumeRoleDoc,
      })
    );

    if (policyArn) {
      await iam.send(
        new AttachRolePolicyCommand({
          RoleName: roleName,
          PolicyArn: policyArn,
        })
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath("/iam/roles");
  revalidatePath("/iam");
  redirect("/iam/roles");
}

// Delete an IAM Role (detaches policies first)
export async function deleteRole(roleName: string) {
  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:DeleteRole",
      `arn:aws:iam::${identity.accountId}:role/${roleName}`
    );

    const attached = await iam.send(
      new ListAttachedRolePoliciesCommand({ RoleName: roleName })
    );
    for (const p of attached.AttachedPolicies ?? []) {
      if (p.PolicyArn) {
        assertPermission(
          identity,
          "iam:DetachRolePolicy",
          `arn:aws:iam::${identity.accountId}:role/${roleName}`
        );
        await iam.send(
          new DetachRolePolicyCommand({
            RoleName: roleName,
            PolicyArn: p.PolicyArn,
          })
        );
      }
    }

    await iam.send(new DeleteRoleCommand({ RoleName: roleName }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath("/iam/roles");
  revalidatePath("/iam");
  return { success: true };
}

// Attach a policy to a role
export async function attachRolePolicy(roleName: string, policyArn: string) {
  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:AttachRolePolicy",
      `arn:aws:iam::${identity.accountId}:role/${roleName}`
    );

    await iam.send(
      new AttachRolePolicyCommand({
        RoleName: roleName,
        PolicyArn: policyArn,
      })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath(`/iam/roles/${encodeURIComponent(roleName)}`);
  return { success: true };
}

// Detach a policy from a role
export async function detachRolePolicy(roleName: string, policyArn: string) {
  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:DetachRolePolicy",
      `arn:aws:iam::${identity.accountId}:role/${roleName}`
    );

    await iam.send(
      new DetachRolePolicyCommand({
        RoleName: roleName,
        PolicyArn: policyArn,
      })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath(`/iam/roles/${encodeURIComponent(roleName)}`);
  return { success: true };
}

// Create a new Customer Managed IAM Policy
export async function createPolicy(formData: FormData) {
  const policyName = (formData.get("policyName") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const document = (formData.get("policyDocument") as string)?.trim();

  if (!policyName) {
    return { error: "Policy name is required." };
  }
  if (!document) {
    return { error: "Policy document is required." };
  }

  try {
    JSON.parse(document);
  } catch {
    return { error: "Policy document must be valid JSON." };
  }

  try {
    const identity = await getActiveIdentity();
    assertPermission(
      identity,
      "iam:CreatePolicy",
      `arn:aws:iam::${identity.accountId}:policy/${policyName}`
    );

    await iam.send(
      new CreatePolicyCommand({
        PolicyName: policyName,
        Description: description || undefined,
        PolicyDocument: document,
      })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath("/iam/policies");
  revalidatePath("/iam");
  redirect("/iam/policies");
}

// Delete a Customer Managed IAM Policy
export async function deletePolicy(policyArn: string) {
  try {
    const identity = await getActiveIdentity();
    assertPermission(identity, "iam:DeletePolicy", policyArn);

    await iam.send(new DeletePolicyCommand({ PolicyArn: policyArn }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }

  revalidatePath("/iam/policies");
  revalidatePath("/iam");
  return { success: true };
}

// Inspect a Policy: fetch metadata and current policy version document
export async function inspectPolicy(policyArn: string) {
  try {
    const identity = await getActiveIdentity();
    assertPermission(identity, "iam:GetPolicy", policyArn);
    assertPermission(identity, "iam:GetPolicyVersion", policyArn);

    const policyRes = await iam.send(new GetPolicyCommand({ PolicyArn: policyArn }));
    const policy = policyRes.Policy;
    const versionId = policy?.DefaultVersionId || "v1";

    const versionRes = await iam.send(
      new GetPolicyVersionCommand({
        PolicyArn: policyArn,
        VersionId: versionId,
      })
    );

    let docObj: any = {};
    const docRaw = versionRes.PolicyVersion?.Document;
    if (docRaw) {
      if (typeof docRaw === "string") {
        try {
          docObj = JSON.parse(decodeURIComponent(docRaw));
        } catch {
          docObj = { raw: docRaw };
        }
      } else {
        docObj = docRaw;
      }
    }

    return {
      policy: {
        name: policy?.PolicyName ?? "",
        arn: policy?.Arn ?? policyArn,
        description: policy?.Description ?? "AWS managed or custom policy",
        defaultVersionId: versionId,
        createDate: policy?.CreateDate ? new Date(policy.CreateDate).toLocaleString() : "—",
        updateDate: policy?.UpdateDate ? new Date(policy.UpdateDate).toLocaleString() : "—",
        attachmentCount: policy?.AttachmentCount ?? 0,
        isAttachable: policy?.IsAttachable ?? true,
      },
      document: docObj,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg, policy: null, document: null };
  }
}
