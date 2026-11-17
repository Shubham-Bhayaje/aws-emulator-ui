/**
 * CreateBucketForm – Client component for the create bucket form.
 * Matches the real AWS Console's create bucket page sections.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  action: (formData: FormData) => Promise<{ error: string } | undefined>;
};

export function CreateBucketForm({ action }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await action(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success, the action redirects to /s3
  }

  return (
    <form action={handleSubmit}>
      {error && (
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-3 mb-4 text-[13px] text-[#d13212] flex items-start gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#d13212] mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <div className="font-bold">Error creating bucket</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* General configuration */}
      <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow mb-4">
        <div className="px-5 py-3 border-b border-[#eaeded]">
          <h2 className="text-[16px] font-bold text-[#16191f]">General configuration</h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* AWS Region */}
          <div>
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">
              AWS Region
            </label>
            <div className="text-[13px] text-[#545b64] bg-[#f2f3f3] border border-[#d5dbdb] rounded-sm px-3 py-[6px] w-[300px]">
              US East (N. Virginia) us-east-1
            </div>
          </div>

          {/* Bucket name */}
          <div>
            <label htmlFor="bucketName" className="block text-[13px] font-bold text-[#16191f] mb-1">
              Bucket name
            </label>
            <input
              id="bucketName"
              name="bucketName"
              type="text"
              required
              placeholder="Enter a unique bucket name"
              className="w-full max-w-[400px] border border-[#aab7b8] rounded-sm px-3 py-[6px] text-[13px] text-[#16191f] focus:outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb]"
            />
            <p className="text-[12px] text-[#545b64] mt-1">
              Bucket name must be globally unique and must not contain spaces or uppercase letters.
            </p>
          </div>
        </div>
      </div>

      {/* Block Public Access */}
      <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow mb-4">
        <div className="px-5 py-3 border-b border-[#eaeded]">
          <h2 className="text-[16px] font-bold text-[#16191f]">Block Public Access settings for this bucket</h2>
        </div>
        <div className="px-5 py-4">
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="mt-1 accent-[#0073bb]" />
            <div>
              <div className="text-[13px] font-bold text-[#16191f]">Block <em>all</em> public access</div>
              <div className="text-[12px] text-[#545b64]">
                Turning this setting on is the same as turning on all four settings below. We recommend that you turn this setting on.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Bucket Versioning */}
      <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow mb-6">
        <div className="px-5 py-3 border-b border-[#eaeded]">
          <h2 className="text-[16px] font-bold text-[#16191f]">Bucket Versioning</h2>
        </div>
        <div className="px-5 py-4 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="versioning" value="disabled" defaultChecked className="accent-[#0073bb]" />
            <span className="text-[13px] text-[#16191f]">Disable</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="versioning" value="enabled" className="accent-[#0073bb]" />
            <span className="text-[13px] text-[#16191f]">Enable</span>
          </label>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaeded]">
        <Link
          href="/s3"
          className="px-4 py-[6px] text-[13px] border border-[#545b64] rounded-sm text-[#545b64] hover:bg-[#fafafa]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-[6px] text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create bucket"}
        </button>
      </div>
    </form>
  );
}
