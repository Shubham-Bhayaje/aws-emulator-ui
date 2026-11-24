/**
 * CreateRoleForm – Form for creating an IAM role.
 * Trusted entity selection, name, description, and policy attachment.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createRole } from "../../actions";
import EmulatorOfflineBanner from "@/components/EmulatorOfflineBanner";

interface PolicyOption {
  name: string;
  arn: string;
}

interface CreateRoleFormProps {
  policies: PolicyOption[];
}

export function CreateRoleForm({ policies }: CreateRoleFormProps) {
  const [serviceType, setServiceType] = useState("lambda");
  const [customTrustJson, setCustomTrustJson] = useState(
    JSON.stringify(
      {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "lambda.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      },
      null,
      2
    )
  );

  const [selectedPolicy, setSelectedPolicy] = useState("");
  const [policySearch, setPolicySearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filteredPolicies = policies.filter((p) =>
    p.name.toLowerCase().includes(policySearch.toLowerCase())
  );

  async function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("serviceType", serviceType);
    if (serviceType === "custom") {
      formData.set("customTrustJson", customTrustJson);
    }
    if (selectedPolicy) {
      formData.set("policyArn", selectedPolicy);
    }

    startTransition(async () => {
      const res = await createRole(formData);
      if (res && res.error) {
        setError(res.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-[800px]">
      {error && (
        <EmulatorOfflineBanner error={error} className="mb-4" />
      )}

      {/* Trusted entity type */}
      <div className="bg-white border border-[#d5dbdb] rounded p-5 awsui-shadow space-y-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#16191f]">
            Select trusted entity
          </h2>
          <p className="text-[12px] text-[#545b64]">
            Specify the type of trusted entity that can assume this role.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="entityOption"
              checked={serviceType === "lambda"}
              onChange={() => setServiceType("lambda")}
              className="mt-1 text-[#0073bb] focus:ring-[#0073bb]"
            />
            <div>
              <div className="text-[13px] font-bold text-[#16191f]">AWS Lambda</div>
              <div className="text-[12px] text-[#545b64]">
                Allows Lambda functions to call AWS services on your behalf.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="entityOption"
              checked={serviceType === "ec2"}
              onChange={() => setServiceType("ec2")}
              className="mt-1 text-[#0073bb] focus:ring-[#0073bb]"
            />
            <div>
              <div className="text-[13px] font-bold text-[#16191f]">Amazon EC2</div>
              <div className="text-[12px] text-[#545b64]">
                Allows EC2 instances to call AWS services on your behalf.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="entityOption"
              checked={serviceType === "ecs"}
              onChange={() => setServiceType("ecs")}
              className="mt-1 text-[#0073bb] focus:ring-[#0073bb]"
            />
            <div>
              <div className="text-[13px] font-bold text-[#16191f]">
                Elastic Container Service (ECS)
              </div>
              <div className="text-[12px] text-[#545b64]">
                Allows ECS container tasks to call AWS services on your behalf.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="entityOption"
              checked={serviceType === "custom"}
              onChange={() => setServiceType("custom")}
              className="mt-1 text-[#0073bb] focus:ring-[#0073bb]"
            />
            <div>
              <div className="text-[13px] font-bold text-[#16191f]">
                Custom trust policy (JSON)
              </div>
              <div className="text-[12px] text-[#545b64]">
                Write a custom trust policy statement in JSON.
              </div>
            </div>
          </label>

          {serviceType === "custom" && (
            <div className="pt-2">
              <textarea
                rows={6}
                value={customTrustJson}
                onChange={(e) => setCustomTrustJson(e.target.value)}
                className="w-full font-mono text-[12px] p-3 border border-[#aab7b8] rounded focus:outline-none focus:border-[#0073bb] bg-[#fafafa]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Role details */}
      <div className="bg-white border border-[#d5dbdb] rounded p-5 awsui-shadow space-y-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#16191f]">Role details</h2>
          <p className="text-[12px] text-[#545b64]">
            Specify the name and description for the role.
          </p>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#16191f] mb-1">
            Role name <span className="text-[#d13212]">*</span>
          </label>
          <input
            type="text"
            name="roleName"
            required
            placeholder="e.g. LambdaExecutionRole"
            className="w-full max-w-[420px] border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
          />
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#16191f] mb-1">
            Description
          </label>
          <input
            type="text"
            name="description"
            placeholder="Allows Lambda functions to access S3 and SQS"
            className="w-full max-w-[500px] border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
          />
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white border border-[#d5dbdb] rounded p-5 awsui-shadow space-y-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#16191f]">Add permissions (optional)</h2>
          <p className="text-[12px] text-[#545b64]">
            Attach an existing policy to give this role permissions.
          </p>
        </div>

        <div>
          <div className="mb-2">
            <input
              type="text"
              placeholder="Filter policies..."
              value={policySearch}
              onChange={(e) => setPolicySearch(e.target.value)}
              className="w-full max-w-[360px] border border-[#aab7b8] rounded px-3 py-1 text-[13px] text-[#16191f] focus:outline-none focus:border-[#0073bb]"
            />
          </div>

          <div className="max-h-[240px] overflow-y-auto border border-[#eaeded] rounded divide-y divide-[#eaeded]">
            <label className="flex items-center gap-3 px-3 py-2 hover:bg-[#f2f8fd] cursor-pointer">
              <input
                type="radio"
                name="rolePolicySelection"
                checked={selectedPolicy === ""}
                onChange={() => setSelectedPolicy("")}
                className="text-[#0073bb] focus:ring-[#0073bb]"
              />
              <div>
                <div className="text-[13px] font-medium text-[#16191f]">
                  No permissions (Attach later)
                </div>
              </div>
            </label>

            {filteredPolicies.map((policy) => (
              <label
                key={policy.arn}
                className="flex items-center gap-3 px-3 py-2 hover:bg-[#f2f8fd] cursor-pointer"
              >
                <input
                  type="radio"
                  name="rolePolicySelection"
                  checked={selectedPolicy === policy.arn}
                  onChange={() => setSelectedPolicy(policy.arn)}
                  className="text-[#0073bb] focus:ring-[#0073bb]"
                />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-[#0073bb]">
                    {policy.name}
                  </div>
                  <div className="text-[11px] text-[#545b64] font-mono truncate">
                    {policy.arn}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/iam/roles"
          className="px-4 py-1.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-1.5 text-[13px] bg-[#ec7211] text-white rounded-sm font-medium hover:bg-[#eb5f07] transition-colors disabled:opacity-50"
        >
          {isPending ? "Creating role..." : "Create role"}
        </button>
      </div>
    </form>
  );
}
