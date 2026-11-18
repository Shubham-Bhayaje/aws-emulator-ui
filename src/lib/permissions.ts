/**
 * lib/permissions.ts – Local IAM Policy Evaluation Engine
 *
 * Evaluates whether the currently active identity (Admin vs IAM User vs Role)
 * has permissions to execute an AWS action, matching AWS evaluation logic:
 * 1. Default Implicit Deny
 * 2. Explicit Allow grants permission
 * 3. Explicit Deny overrides all Allows
 */

export type PolicyStatement = {
  Sid?: string;
  Effect: "Allow" | "Deny";
  Action: string | string[];
  Resource?: string | string[];
};

export type PolicyDocument = {
  Version?: string;
  Statement: PolicyStatement | PolicyStatement[];
};

export type ActiveIdentity = {
  type: "admin" | "user" | "role";
  name: string;
  accountId: string;
  policies?: {
    name: string;
    document?: PolicyDocument;
  }[];
};

/**
 * Wildcard matcher supporting AWS glob patterns (e.g. "s3:*", "s3:Get*", "*")
 */
export function matchesWildcard(pattern: string, value: string): boolean {
  if (pattern === "*") return true;
  const regexPattern = "^" + pattern
    .split("*")
    .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*") + "$";
  return new RegExp(regexPattern, "i").test(value);
}

/**
 * Evaluates whether an identity has permission to perform an action on a resource.
 */
export function evaluatePermissions(
  identity: ActiveIdentity,
  action: string,
  resource: string = "*"
): { allowed: boolean; reason?: string } {
  // Administrator always has unrestricted access
  if (identity.type === "admin" || identity.name === "emulator") {
    return { allowed: true };
  }

  const policies = identity.policies || [];
  const principalType = identity.type === "role" ? "role" : "user";
  if (policies.length === 0) {
    return {
      allowed: false,
      reason: `User arn:aws:iam::${identity.accountId}:${principalType}/${identity.name} has no attached policies (Implicit Deny).`,
    };
  }

  let hasExplicitAllow = false;

  for (const pol of policies) {
    if (!pol.document?.Statement) continue;
    const statements = Array.isArray(pol.document.Statement)
      ? pol.document.Statement
      : [pol.document.Statement];

    for (const stmt of statements) {
      const actions = Array.isArray(stmt.Action) ? stmt.Action : stmt.Action ? [stmt.Action] : [];
      const resources = stmt.Resource
        ? Array.isArray(stmt.Resource)
          ? stmt.Resource
          : [stmt.Resource]
        : ["*"];

      let actionMatches = actions.some((actPattern) => matchesWildcard(actPattern, action));
      if (!actionMatches && (stmt as any).NotAction) {
        const notActions = Array.isArray((stmt as any).NotAction) ? (stmt as any).NotAction : [(stmt as any).NotAction];
        const notMatches = notActions.some((pat: string) => matchesWildcard(pat, action));
        if (!notMatches) actionMatches = true;
      }

      let resourceMatches = resources.some((resPattern) => matchesWildcard(resPattern, resource));
      if (!resourceMatches && (stmt as any).NotResource) {
        const notResources = Array.isArray((stmt as any).NotResource) ? (stmt as any).NotResource : [(stmt as any).NotResource];
        const notMatches = notResources.some((pat: string) => matchesWildcard(pat, resource));
        if (!notMatches) resourceMatches = true;
      }

      if (actionMatches && resourceMatches) {
        // Explicit Deny always wins
        if (stmt.Effect === "Deny") {
          return {
            allowed: false,
            reason: `Explicit Deny in policy "${pol.name}" for action ${action}.`,
          };
        }
        if (stmt.Effect === "Allow") {
          hasExplicitAllow = true;
        }
      }
    }
  }

  if (hasExplicitAllow) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `User arn:aws:iam::${identity.accountId}:${principalType}/${identity.name} is not authorized to perform: ${action} on resource: ${resource} (no matching Allow statement).`,
  };
}

/**
 * Throws an authentic AWS AccessDeniedException if permission is denied.
 */
export function assertPermission(
  identity: ActiveIdentity,
  action: string,
  resource: string = "*"
): void {
  const result = evaluatePermissions(identity, action, resource);
  if (!result.allowed) {
    const arn = `arn:aws:iam::${identity.accountId}:${identity.type === "role" ? "role" : "user"}/${identity.name}`;
    throw new Error(
      `AccessDeniedException: User: ${arn} is not authorized to perform: ${action} on resource: ${resource} with an explicit/implicit deny.`
    );
  }
}
