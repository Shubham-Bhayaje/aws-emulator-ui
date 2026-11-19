/**
 * src/lib/organizationsStore.ts – State management & persistence for AWS Organizations.
 * Integrates directly with the live AWS Emulator (DescribeOrganization, ListRoots,
 * CreateOrganizationalUnit, DeleteOrganizationalUnit, ListOrganizationalUnitsForParent)
 * and persists member accounts, custom SCPs, and trusted services.
 * Zero emojis, Cloudscape enterprise standard.
 */

import fs from "fs";
import path from "path";
import { organizations } from "./aws";
import {
  DescribeOrganizationCommand,
  ListRootsCommand,
  ListOrganizationalUnitsForParentCommand,
  CreateOrganizationalUnitCommand,
  DeleteOrganizationalUnitCommand,
  DescribeOrganizationalUnitCommand,
} from "@aws-sdk/client-organizations";

export interface AccountRecord {
  id: string;
  name: string;
  email: string;
  arn: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING_CLOSURE";
  joinedMethod: "INVITED" | "CREATED";
  joinedTimestamp: string;
  parentId: string; // root ID or OU ID
  roleName: string;
  attachedPolicies: string[];
  tags: Record<string, string>;
  isManagementAccount?: boolean;
}

export interface SCPRecord {
  id: string;
  name: string;
  description: string;
  arn: string;
  type: "SERVICE_CONTROL_POLICY" | "RESOURCE_CONTROL_POLICY" | "TAG_POLICY" | "BACKUP_POLICY";
  awsManaged: boolean;
  content: string; // JSON string
  createdDate: string;
  attachedTargets: Array<{ id: string; name: string; type: "ROOT" | "ORGANIZATIONAL_UNIT" | "ACCOUNT" }>;
}

export interface TrustedServiceRecord {
  servicePrincipal: string;
  serviceName: string;
  enabledDate: string;
  status: "ENABLED" | "DISABLED";
}

export interface OrganizationsState {
  accounts: AccountRecord[];
  policies: SCPRecord[];
  trustedServices: TrustedServiceRecord[];
  ouParentMap: Record<string, string>; // ouId -> parentId
}

const DATA_FILE = path.join(process.cwd(), "data", "organizations_state.json");

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

function getDefaultState(rootId: string = "r-7qygd7aa"): OrganizationsState {
  return {
    accounts: [
      {
        id: "000000000000",
        name: "Management Account",
        email: "000000000000@example.com",
        arn: `arn:aws:organizations::000000000000:account/o-8sh3tqaaaa/000000000000`,
        status: "ACTIVE",
        joinedMethod: "INVITED",
        joinedTimestamp: new Date().toISOString(),
        parentId: rootId,
        roleName: "OrganizationAccountAccessRole",
        attachedPolicies: ["p-FullAWSAccess"],
        tags: { Environment: "Management", ManagedBy: "AWS-Organizations" },
        isManagementAccount: true,
      },
    ],
    policies: [
      {
        id: "p-FullAWSAccess",
        name: "FullAWSAccess",
        description: "Allows full access to AWS services and actions",
        arn: "arn:aws:organizations::aws:policy/service_control_policy/p-FullAWSAccess",
        type: "SERVICE_CONTROL_POLICY",
        awsManaged: true,
        content: JSON.stringify(
          {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Action: "*",
                Resource: "*",
              },
            ],
          },
          null,
          2
        ),
        createdDate: new Date().toISOString(),
        attachedTargets: [{ id: rootId, name: "Root", type: "ROOT" }],
      },
      {
        id: "p-DenyRootUserActions",
        name: "DenyRootUserActions",
        description: "Restricts root user from performing administrative actions across member accounts",
        arn: "arn:aws:organizations::000000000000:policy/service_control_policy/p-DenyRootUserActions",
        type: "SERVICE_CONTROL_POLICY",
        awsManaged: false,
        content: JSON.stringify(
          {
            Version: "2012-10-17",
            Statement: [
              {
                Sid: "DenyRootUser",
                Effect: "Deny",
                Action: "*",
                Resource: "*",
                Condition: {
                  StringLike: {
                    "aws:PrincipalArn": ["arn:aws:iam::*:root"],
                  },
                },
              },
            ],
          },
          null,
          2
        ),
        createdDate: new Date().toISOString(),
        attachedTargets: [],
      },
      {
        id: "p-RestrictRegions",
        name: "RestrictAllowedRegions",
        description: "Enforces that resources can only be provisioned in approved AWS regions",
        arn: "arn:aws:organizations::000000000000:policy/service_control_policy/p-RestrictRegions",
        type: "SERVICE_CONTROL_POLICY",
        awsManaged: false,
        content: JSON.stringify(
          {
            Version: "2012-10-17",
            Statement: [
              {
                Sid: "DenyUnapprovedRegions",
                Effect: "Deny",
                NotAction: [
                  "iam:*",
                  "organizations:*",
                  "route53:*",
                  "cloudfront:*",
                  "sts:*",
                ],
                Resource: "*",
                Condition: {
                  StringNotEquals: {
                    "aws:RequestedRegion": ["us-east-1", "us-east-2", "us-west-2"],
                  },
                },
              },
            ],
          },
          null,
          2
        ),
        createdDate: new Date().toISOString(),
        attachedTargets: [],
      },
    ],
    trustedServices: [
      {
        servicePrincipal: "cloudtrail.amazonaws.com",
        serviceName: "AWS CloudTrail",
        enabledDate: new Date().toISOString(),
        status: "ENABLED",
      },
      {
        servicePrincipal: "config.amazonaws.com",
        serviceName: "AWS Config",
        enabledDate: new Date().toISOString(),
        status: "ENABLED",
      },
      {
        servicePrincipal: "sso.amazonaws.com",
        serviceName: "AWS IAM Identity Center",
        enabledDate: new Date().toISOString(),
        status: "ENABLED",
      },
      {
        servicePrincipal: "backup.amazonaws.com",
        serviceName: "AWS Backup",
        enabledDate: new Date().toISOString(),
        status: "ENABLED",
      },
      {
        servicePrincipal: "ram.amazonaws.com",
        serviceName: "AWS Resource Access Manager (RAM)",
        enabledDate: new Date().toISOString(),
        status: "ENABLED",
      },
      {
        servicePrincipal: "guardduty.amazonaws.com",
        serviceName: "Amazon GuardDuty",
        enabledDate: new Date().toISOString(),
        status: "ENABLED",
      },
    ],
    ouParentMap: {},
  };
}

export function loadOrganizationsState(rootId: string = "r-7qygd7aa"): OrganizationsState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.accounts) && Array.isArray(parsed.policies)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to read organizations_state.json:", err);
  }

  const def = getDefaultState(rootId);
  saveOrganizationsState(def);
  return def;
}

export function saveOrganizationsState(state: OrganizationsState): void {
  try {
    ensureDirectoryExistence(DATA_FILE);
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write organizations_state.json:", err);
  }
}

/**
 * Fetch live Organization details from the emulator.
 */
export async function fetchLiveOrganization() {
  try {
    const res = await organizations.send(new DescribeOrganizationCommand({}));
    return {
      success: true,
      org: res.Organization,
      error: undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      org: undefined,
      error: msg,
    };
  }
}

/**
 * Fetch live roots from the emulator.
 */
export async function fetchLiveRoots() {
  try {
    const res = await organizations.send(new ListRootsCommand({}));
    return {
      success: true,
      roots: res.Roots || [],
      error: undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      roots: [],
      error: msg,
    };
  }
}

/**
 * Fetch OUs under a specific parent directly from the emulator.
 */
export async function fetchLiveOUsForParent(parentId: string) {
  try {
    const res = await organizations.send(
      new ListOrganizationalUnitsForParentCommand({ ParentId: parentId })
    );
    return {
      success: true,
      ous: res.OrganizationalUnits || [],
      error: undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      ous: [],
      error: msg,
    };
  }
}

/**
 * Create a real Organizational Unit in the emulator.
 */
export async function createLiveOU(parentId: string, name: string) {
  try {
    const res = await organizations.send(
      new CreateOrganizationalUnitCommand({ ParentId: parentId, Name: name })
    );
    // Record parent mapping in state
    if (res.OrganizationalUnit?.Id) {
      const state = loadOrganizationsState(parentId);
      state.ouParentMap[res.OrganizationalUnit.Id] = parentId;
      saveOrganizationsState(state);
    }
    return {
      success: true,
      ou: res.OrganizationalUnit,
      error: undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      ou: undefined,
      error: msg,
    };
  }
}

/**
 * Delete an Organizational Unit from the emulator.
 */
export async function deleteLiveOU(ouId: string) {
  try {
    await organizations.send(
      new DeleteOrganizationalUnitCommand({ OrganizationalUnitId: ouId })
    );
    const state = loadOrganizationsState();
    delete state.ouParentMap[ouId];
    saveOrganizationsState(state);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Describe an Organizational Unit from the emulator.
 */
export async function describeLiveOU(ouId: string) {
  try {
    const res = await organizations.send(
      new DescribeOrganizationalUnitCommand({ OrganizationalUnitId: ouId })
    );
    return {
      success: true,
      ou: res.OrganizationalUnit,
      error: undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      ou: undefined,
      error: msg,
    };
  }
}
