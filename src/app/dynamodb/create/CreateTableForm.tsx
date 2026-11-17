/**
 * CreateTableForm – Form for creating a new DynamoDB table.
 * Matches the real AWS Console Create Table interface.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createTable } from "../actions";

export function CreateTableForm() {
  const [hasSortKey, setHasSortKey] = useState(false);
  const [billingMode, setBillingMode] = useState<"PAY_PER_REQUEST" | "PROVISIONED">(
    "PAY_PER_REQUEST"
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("hasSortKey", hasSortKey ? "true" : "false");
    formData.set("billingMode", billingMode);

    startTransition(async () => {
      const res = await createTable(formData);
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

      {/* Table details section */}
      <div className="bg-white border border-[#d5dbdb] rounded p-5 awsui-shadow space-y-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#16191f]">Table details</h2>
          <p className="text-[12px] text-[#545b64]">
            Name and identify your DynamoDB table.
          </p>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#16191f] mb-1">
            Table name <span className="text-[#d13212]">*</span>
          </label>
          <input
            type="text"
            name="tableName"
            required
            placeholder="e.g. Users"
            className="w-full max-w-[460px] border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
          />
          <p className="text-[11px] text-[#545b64] mt-1">
            Must be 3 to 255 characters and contain only letters, numbers, underscores (_),
            hyphens (-), and dots (.).
          </p>
        </div>
      </div>

      {/* Primary key section */}
      <div className="bg-white border border-[#d5dbdb] rounded p-5 awsui-shadow space-y-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#16191f]">Partition key</h2>
          <p className="text-[12px] text-[#545b64]">
            The partition key is part of the table’s primary key used to distribute data
            across physical partitions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3 max-w-[500px]">
          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Partition key name <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="text"
              name="partitionKeyName"
              required
              placeholder="e.g. userId"
              className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              Type
            </label>
            <select
              name="partitionKeyType"
              defaultValue="S"
              className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] bg-white focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
            >
              <option value="S">String</option>
              <option value="N">Number</option>
              <option value="B">Binary</option>
            </select>
          </div>
        </div>

        {/* Sort key optional toggle */}
        <div className="pt-3 border-t border-[#eaeded] space-y-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasSortKey}
              onChange={(e) => setHasSortKey(e.target.checked)}
              className="text-[#0073bb] focus:ring-[#0073bb] rounded"
            />
            <span className="text-[13px] font-bold text-[#16191f]">
              Add sort key (optional)
            </span>
          </label>
          <p className="text-[11px] text-[#545b64]">
            You can use a sort key to organize items under the same partition key and query
            efficient ranges.
          </p>

          {hasSortKey && (
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3 max-w-[500px] pt-1">
              <div>
                <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                  Sort key name <span className="text-[#d13212]">*</span>
                </label>
                <input
                  type="text"
                  name="sortKeyName"
                  required={hasSortKey}
                  placeholder="e.g. timestamp"
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#16191f] mb-1">
                  Type
                </label>
                <select
                  name="sortKeyType"
                  defaultValue="S"
                  className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] text-[#16191f] bg-white focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
                >
                  <option value="S">String</option>
                  <option value="N">Number</option>
                  <option value="B">Binary</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table settings (capacity mode) */}
      <div className="bg-white border border-[#d5dbdb] rounded p-5 awsui-shadow space-y-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#16191f]">Table settings</h2>
          <p className="text-[12px] text-[#545b64]">
            Choose how you are billed for read and write throughput.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="capacityOption"
              checked={billingMode === "PAY_PER_REQUEST"}
              onChange={() => setBillingMode("PAY_PER_REQUEST")}
              className="mt-1 text-[#0073bb] focus:ring-[#0073bb]"
            />
            <div>
              <div className="text-[13px] font-bold text-[#16191f]">
                On-demand (Recommended)
              </div>
              <div className="text-[12px] text-[#545b64]">
                Pay per request with automatic scaling for unpredictable workloads.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="capacityOption"
              checked={billingMode === "PROVISIONED"}
              onChange={() => setBillingMode("PROVISIONED")}
              className="mt-1 text-[#0073bb] focus:ring-[#0073bb]"
            />
            <div>
              <div className="text-[13px] font-bold text-[#16191f]">Provisioned</div>
              <div className="text-[12px] text-[#545b64]">
                Specify read and write capacity units (default: 5 RCU, 5 WCU).
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/dynamodb"
          className="px-4 py-1.5 text-[13px] border border-[#545b64] rounded-sm text-[#16191f] hover:bg-[#f2f3f3] font-normal"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-1.5 text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? "Creating table..." : "Create table"}
        </button>
      </div>
    </form>
  );
}
