/**
 * CreatePolicyForm – Form for creating a custom IAM Policy.
 * Policy name, description, and JSON policy document editor.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createPolicy } from "../../actions";

const defaultPolicyTemplate = JSON.stringify(
  {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "Statement1",
        Effect: "Allow",
        Action: ["s3:GetObject", "s3:ListBucket"],
        Resource: "*",
      },
    ],
  },
  null,
  2
);

export function CreatePolicyForm() {
  const [document, setDocument] = useState(defaultPolicyTemplate);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleJsonChange(val: string) {
    setDocument(val);
    try {
      JSON.parse(val);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message);
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      JSON.parse(document);
    } catch {
      setError("Please fix invalid JSON syntax in the policy document.");
      return;
    }

    formData.set("policyDocument", document);

    startTransition(async () => {
      const res = await createPolicy(formData);
      if (res && res.error) {
        setError(res.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-[800px]">
      {error && (
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-4 text-[13px] text-[#d13212]">
          {error}
        </div>
      )}

      {/* Policy details */}
      <div className="bg-white border border-[#d5dbdb] rounded p-5 awsui-shadow space-y-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#16191f]">Policy details</h2>
          <p className="text-[12px] text-[#545b64]">
            Specify a name and description for your customer managed policy.
          </p>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#16191f] mb-1">
            Policy name <span className="text-[#d13212]">*</span>
          </label>
          <input
            type="text"
            name="policyName"
            required
            placeholder="e.g. CustomS3ReadOnly"
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
            placeholder="Allows read access to S3 objects and buckets"
            className="w-full max-w-[500px] border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
          />
        </div>
      </div>

      {/* Policy JSON Editor */}
      <div className="bg-white border border-[#d5dbdb] rounded p-5 awsui-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-[#16191f]">
              Policy document (JSON) <span className="text-[#d13212]">*</span>
            </h2>
            <p className="text-[12px] text-[#545b64]">
              Define allowed or denied actions, effects, and resources.
            </p>
          </div>
          {jsonError ? (
            <span className="text-[11px] text-[#d13212] bg-[#fdf3f1] px-2 py-0.5 rounded border border-[#d13212]">
              Invalid JSON
            </span>
          ) : (
            <span className="text-[11px] text-[#1d8102] bg-[#f2f8f0] px-2 py-0.5 rounded border border-[#d4e8cc]">
              Valid JSON
            </span>
          )}
        </div>

        <div>
          <textarea
            rows={12}
            value={document}
            onChange={(e) => handleJsonChange(e.target.value)}
            className="w-full font-mono text-[13px] p-4 bg-[#000716] text-[#69f0ae] rounded border border-[#aab7b8] focus:outline-none focus:border-[#0073bb] leading-relaxed"
          />
          {jsonError && (
            <p className="text-[11px] text-[#d13212] mt-1">{jsonError}</p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/iam/policies"
          className="px-4 py-1.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending || Boolean(jsonError)}
          className="px-5 py-1.5 text-[13px] bg-[#ec7211] text-white rounded-sm font-medium hover:bg-[#eb5f07] transition-colors disabled:opacity-50"
        >
          {isPending ? "Creating policy..." : "Create policy"}
        </button>
      </div>
    </form>
  );
}
