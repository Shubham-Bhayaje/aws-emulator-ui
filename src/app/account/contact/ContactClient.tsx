"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ContactInfo } from "../types";
import { updateContactInfoAction } from "../actions";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IN", name: "India" },
  { code: "JP", name: "Japan" },
  { code: "AU", name: "Australia" },
  { code: "BR", name: "Brazil" },
  { code: "SG", name: "Singapore" },
];

interface ContactClientProps {
  initialContact: ContactInfo;
}

export function ContactClient({ initialContact }: ContactClientProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<ContactInfo>(initialContact);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setBanner(null);
    try {
      const res = await updateContactInfoAction(formData);
      if (res.success) {
        setBanner({ type: "success", message: "Primary contact information updated successfully." });
        router.refresh();
      } else {
        setBanner({ type: "error", message: res.error || "Failed to update contact information." });
      }
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "An unexpected error occurred." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-[1000px] mx-auto text-[#16191f]">
      {/* Breadcrumb */}
      <div className="text-xs text-[#545b64] mb-3">
        <Link href="/account" className="text-[#0073bb] hover:underline">
          Account settings
        </Link>{" "}
        / Primary contact information
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`mb-5 p-4 rounded text-sm flex items-start justify-between border ${
            banner.type === "success"
              ? "bg-[#f2fcf3] border-[#037f0c] text-[#037f0c]"
              : "bg-[#fdf3f2] border-[#d13212] text-[#d13212]"
          }`}
        >
          <div>{banner.message}</div>
          <button
            onClick={() => setBanner(null)}
            className="text-xs font-bold hover:opacity-80 ml-4"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-[#eaeded] mb-6">
        <h1 className="text-xl font-bold text-[#16191f]">Primary contact information</h1>
        <p className="text-xs text-[#545b64] mt-1">
          Update the primary physical address, phone number, and contact details for your AWS account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#16191f] mb-1">
            Full name / Company <span className="text-[#d13212]">*</span>
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full border border-[#aab7b8] rounded px-3 text-xs focus:outline-none focus:border-[#ec7211]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#16191f] mb-1">
            Address line 1 <span className="text-[#d13212]">*</span>
          </label>
          <input
            type="text"
            value={formData.addressLine1}
            onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
            className="w-full border border-[#aab7b8] rounded px-3 text-xs focus:outline-none focus:border-[#ec7211]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#16191f] mb-1">Address line 2</label>
          <input
            type="text"
            value={formData.addressLine2 || ""}
            onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
            className="w-full border border-[#aab7b8] rounded px-3 text-xs focus:outline-none focus:border-[#ec7211]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#16191f] mb-1">
              City <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full border border-[#aab7b8] rounded px-3 text-xs focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#16191f] mb-1">
              State, Province, or Region <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="text"
              value={formData.stateOrRegion}
              onChange={(e) => setFormData({ ...formData, stateOrRegion: e.target.value })}
              className="w-full border border-[#aab7b8] rounded px-3 text-xs focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#16191f] mb-1">
              Postal code <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              className="w-full border border-[#aab7b8] rounded px-3 text-xs focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#16191f] mb-1">
              Country or Region code <span className="text-[#d13212]">*</span>
            </label>
            <select
              value={formData.countryCode}
              onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
              className="w-full border border-[#aab7b8] rounded px-3 text-xs bg-white focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              required
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#16191f] mb-1">
              Phone number <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="tel"
              placeholder="+1 206-555-0100"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full border border-[#aab7b8] rounded px-3 text-xs focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#16191f] mb-1">Website URL</label>
          <input
            type="url"
            placeholder="https://example.com"
            value={formData.websiteUrl || ""}
            onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
            className="w-full border border-[#aab7b8] rounded px-3 text-xs focus:outline-none focus:border-[#ec7211]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#eaeded]">
          <Link
            href="/account"
            className="px-4 text-xs font-semibold text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#f2f3f3] flex items-center justify-center"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-5 text-xs font-semibold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07]"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
