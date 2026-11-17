/**
 * CreateQueueForm – Client component for the create queue form.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { createQueue } from "../actions";

export function CreateQueueForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true); setError(null);
    const result = await createQueue(formData);
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  return (
    <form action={handleSubmit}>
      {error && (
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-3 mb-4 text-[13px] text-[#d13212]">
          <span className="font-bold">Error: </span>{error}
        </div>
      )}

      <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow mb-4">
        <div className="px-5 py-3 border-b border-[#eaeded]">
          <h2 className="text-[16px] font-bold text-[#16191f]">Details</h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-2">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 border border-[#aab7b8] rounded px-4 py-3 cursor-pointer has-[:checked]:border-[#0073bb] has-[:checked]:bg-[#f2f8fd]">
                <input type="radio" name="fifo" value="false" defaultChecked className="accent-[#0073bb]" />
                <div>
                  <div className="text-[13px] font-bold text-[#16191f]">Standard</div>
                  <div className="text-[12px] text-[#545b64]">Best-effort ordering, at-least-once delivery</div>
                </div>
              </label>
              <label className="flex items-center gap-2 border border-[#aab7b8] rounded px-4 py-3 cursor-pointer has-[:checked]:border-[#0073bb] has-[:checked]:bg-[#f2f8fd]">
                <input type="radio" name="fifo" value="true" className="accent-[#0073bb]" />
                <div>
                  <div className="text-[13px] font-bold text-[#16191f]">FIFO</div>
                  <div className="text-[12px] text-[#545b64]">First-in-first-out, exactly-once processing</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="queueName" className="block text-[13px] font-bold text-[#16191f] mb-1">Name</label>
            <input id="queueName" name="queueName" type="text" required placeholder="Enter queue name"
              className="w-full max-w-[400px] border border-[#aab7b8] rounded-sm px-3 py-[6px] text-[13px] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]" />
            <p className="text-[12px] text-[#545b64] mt-1">Maximum 80 characters; can include alphanumeric characters, hyphens, and underscores.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaeded]">
        <Link href="/sqs" className="px-4 py-[6px] text-[13px] border border-[#545b64] rounded-sm text-[#545b64] hover:bg-[#fafafa]">Cancel</Link>
        <button type="submit" disabled={loading} className="px-4 py-[6px] text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] disabled:opacity-50">
          {loading ? "Creating..." : "Create queue"}
        </button>
      </div>
    </form>
  );
}
