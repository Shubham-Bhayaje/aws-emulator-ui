/**
 * src/app/organizations/policies/create/CreatePolicyClient.tsx – Policy creation wizard.
 * Zero emojis, Cloudscape enterprise standard.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSCPAction } from "../../actions";

const PRESET_TEMPLATES: Record<string, { name: string; desc: string; json: any }> = {
  denyRoot: {
    name: "DenyRootUserActions",
    desc: "Denies root user execution in member accounts",
    json: {
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
  },
  restrictRegions: {
    name: "RestrictAllowedRegions",
    desc: "Prevents resources from being provisioned outside specified regions",
    json: {
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
  },
  denyCloudTrailDisable: {
    name: "ProtectCloudTrail",
    desc: "Prevents users in member accounts from deleting or stopping CloudTrail logging",
    json: {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "DenyCloudTrailModifications",
          Effect: "Deny",
          Action: [
            "cloudtrail:DeleteTrail",
            "cloudtrail:StopLogging",
            "cloudtrail:UpdateTrail",
          ],
          Resource: "*",
        },
      ],
    },
  },
  requireMFA: {
    name: "RequireMFAForSensitiveActions",
    desc: "Enforces MFA for terminating EC2 instances and deleting databases",
    json: {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "RequireMFA",
          Effect: "Deny",
          Action: [
            "ec2:TerminateInstances",
            "rds:DeleteDBInstance",
          ],
          Resource: "*",
          Condition: {
            BoolIfExists: {
              "aws:MultiFactorAuthPresent": "false",
            },
          },
        },
      ],
    },
  },
};

interface CreatePolicyClientProps {
  targets: Array<{ id: string; name: string; type: "ROOT" | "OU" | "ACCOUNT" }>;
}

export function CreatePolicyClient({ targets }: CreatePolicyClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [policyName, setPolicyName] = useState("");
  const [policyDesc, setPolicyDesc] = useState("");
  const [policyDocument, setPolicyDocument] = useState(
    JSON.stringify(PRESET_TEMPLATES.denyRoot.json, null, 2)
  );
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const applyTemplate = (key: string) => {
    const tmpl = PRESET_TEMPLATES[key];
    if (tmpl) {
      if (!policyName) setPolicyName(tmpl.name);
      if (!policyDesc) setPolicyDesc(tmpl.desc);
      setPolicyDocument(JSON.stringify(tmpl.json, null, 2));
    }
  };

  const toggleTarget = (id: string) => {
    setSelectedTargets((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      const res = await createSCPAction({
        name: policyName,
        description: policyDesc,
        content: policyDocument,
        targetIds: selectedTargets,
      });

      if (res.success) {
        router.push("/organizations/policies");
      } else {
        setError(res.error || "Failed to create policy.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Alert */}
      {error && (
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212]">
          Error: {error}
        </div>
      )}

      {/* Card 1: Details */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm">
        <h2 className="text-[16px] font-bold text-[#16191f] mb-4">Policy details</h2>
        <div className="space-y-4 text-[13px]">
          <div>
            <label className="block font-semibold text-[#16191f] mb-1">Policy name</label>
            <input
              type="text"
              placeholder="e.g. DenyRootUserActions"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#16191f] mb-1">Policy description</label>
            <input
              type="text"
              placeholder="Description of the policy guardrail"
              value={policyDesc}
              onChange={(e) => setPolicyDesc(e.target.value)}
              className="w-full border border-[#aab7b8] rounded px-3 py-1.5 focus:outline-none focus:border-[#ec7211]"
            />
          </div>
        </div>
      </div>

      {/* Card 2: Document */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">Policy statement (JSON)</h2>
            <p className="text-[12px] text-[#545b64]">
              Define permission guardrails using AWS IAM policy statement syntax.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-[#545b64]">Load preset template:</span>
            <select
              onChange={(e) => applyTemplate(e.target.value)}
              defaultValue=""
              className="border border-[#aab7b8] rounded px-2.5 py-1 text-[12px] text-[#16191f] focus:outline-none focus:border-[#ec7211]"
            >
              <option value="" disabled>
                Select template...
              </option>
              <option value="denyRoot">Deny Root User Actions</option>
              <option value="restrictRegions">Restrict Allowed Regions</option>
              <option value="denyCloudTrailDisable">Protect AWS CloudTrail</option>
              <option value="requireMFA">Require MFA for Deletion</option>
            </select>
          </div>
        </div>

        <textarea
          rows={14}
          value={policyDocument}
          onChange={(e) => setPolicyDocument(e.target.value)}
          className="w-full font-mono text-[12px] bg-[#fdfdfd] border border-[#aab7b8] rounded p-3 text-[#16191f] focus:outline-none focus:border-[#ec7211]"
        />
      </div>

      {/* Card 3: Targets */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-sm">
        <h2 className="text-[16px] font-bold text-[#16191f] mb-2">Attach to targets (optional)</h2>
        <p className="text-[12px] text-[#545b64] mb-4">
          Select organizational roots, OUs, or accounts to immediately enforce this policy on.
        </p>

        <div className="space-y-2 max-h-56 overflow-y-auto border border-[#eaeded] rounded p-3">
          {targets.map((t) => (
            <label
              key={t.id}
              className="flex items-center gap-2.5 p-1.5 hover:bg-[#f8f9fa] rounded cursor-pointer text-[13px]"
            >
              <input
                type="checkbox"
                checked={selectedTargets.includes(t.id)}
                onChange={() => toggleTarget(t.id)}
                className="rounded border-[#aab7b8] text-[#ec7211] focus:ring-0"
              />
              <span className="font-semibold text-[#16191f]">{t.name}</span>
              <span className="font-mono text-[11px] text-[#545b64]">({t.id})</span>
              <span className="text-[10px] uppercase font-bold text-[#545b64] bg-[#f2f3f3] px-1 rounded">
                {t.type}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/organizations/policies"
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-white border border-[#545b64] text-[#16191f] hover:bg-[#f2f3f3] px-4 rounded transition-colors"
        >
          Cancel
        </Link>
        <button
          type="button"
          disabled={isPending || !policyName.trim() || !policyDocument.trim()}
          onClick={handleCreate}
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          className="whitespace-nowrap inline-flex items-center justify-center font-bold text-[13px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-5 rounded shadow-sm transition-colors disabled:opacity-50"
        >
          {isPending ? "Creating policy..." : "Create policy"}
        </button>
      </div>
    </div>
  );
}
