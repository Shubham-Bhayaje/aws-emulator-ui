"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlternateContact, AlternateContactType } from "../types";
import { putAlternateContactAction, deleteAlternateContactAction } from "../actions";

interface AlternateContactsClientProps {
  initialContacts: { [key in AlternateContactType]?: AlternateContact };
}

export function AlternateContactsClient({ initialContacts }: AlternateContactsClientProps) {
  const [contacts, setContacts] = useState<{ [key in AlternateContactType]?: AlternateContact }>(
    initialContacts
  );
  const [editingType, setEditingType] = useState<AlternateContactType | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const openEdit = (type: AlternateContactType) => {
    const existing = contacts[type];
    setEditingType(type);
    setName(existing?.name || "");
    setTitle(existing?.title || "");
    setEmail(existing?.emailAddress || "");
    setPhone(existing?.phoneNumber || "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;
    setSaving(true);
    setBanner(null);
    try {
      const updated: AlternateContact = {
        alternateContactType: editingType,
        name: name.trim(),
        title: title.trim(),
        emailAddress: email.trim(),
        phoneNumber: phone.trim(),
      };
      const res = await putAlternateContactAction(updated);
      if (res.success) {
        setContacts((prev) => ({ ...prev, [editingType]: updated }));
        setBanner({
          type: "success",
          message: `${editingType} alternate contact updated successfully.`,
        });
        setEditingType(null);
      } else {
        setBanner({ type: "error", message: res.error || "Failed to update alternate contact." });
      }
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "An error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type: AlternateContactType) => {
    setBanner(null);
    try {
      const res = await deleteAlternateContactAction(type);
      if (res.success) {
        setContacts((prev) => {
          const next = { ...prev };
          delete next[type];
          return next;
        });
        setBanner({
          type: "success",
          message: `${type} alternate contact removed successfully.`,
        });
      } else {
        setBanner({ type: "error", message: res.error || "Failed to remove alternate contact." });
      }
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "An error occurred." });
    }
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto text-[#16191f]">
      {/* Breadcrumb */}
      <div className="text-xs text-[#545b64] mb-3">
        <Link href="/account" className="text-[#0073bb] hover:underline">
          Account settings
        </Link>{" "}
        / Alternate contacts
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
        <h1 className="text-xl font-bold text-[#16191f]">Alternate contacts</h1>
        <p className="text-xs text-[#545b64] mt-1">
          Configure alternate contacts for billing, operations, and security to receive notifications about your AWS account.
        </p>
      </div>

      <div className="space-y-6">
        {(["BILLING", "OPERATIONS", "SECURITY"] as AlternateContactType[]).map((type) => {
          const c = contacts[type];
          return (
            <div key={type} className="bg-white border border-[#eaeded] rounded shadow-sm p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#eaeded] mb-4">
                <div>
                  <h2 className="text-sm font-bold text-[#16191f]">
                    {type.charAt(0) + type.slice(1).toLowerCase()} contact
                  </h2>
                  <p className="text-[11px] text-[#545b64]">
                    Receives {type.toLowerCase()} notifications and alerts from AWS.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(type)}
                    className="px-3 text-xs font-semibold bg-white border border-[#aab7b8] text-[#16191f] rounded hover:bg-[#f2f3f3]"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  >
                    {c ? "Edit" : "Configure"}
                  </button>
                  {c && (
                    <button
                      type="button"
                      onClick={() => handleDelete(type)}
                      className="px-3 text-xs font-semibold bg-white border border-[#d13212] text-[#d13212] rounded hover:bg-[#fdf3f2]"
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {c ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[#545b64] block mb-1">Name</span>
                    <span className="font-semibold text-[#16191f]">{c.name}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block mb-1">Title</span>
                    <span className="text-[#16191f]">{c.title}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block mb-1">Email address</span>
                    <span className="font-mono text-[11px] text-[#16191f]">{c.emailAddress}</span>
                  </div>
                  <div>
                    <span className="text-[#545b64] block mb-1">Phone number</span>
                    <span className="font-mono text-[11px] text-[#16191f]">{c.phoneNumber}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-[#545b64] bg-[#fafafa] border border-[#eaeded] rounded">
                  No {type.toLowerCase()} contact configured. Click <strong>Configure</strong> to add one.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 text-[#16191f]">
            <h2 className="text-base font-bold mb-1">
              Edit alternate contact: {editingType.charAt(0) + editingType.slice(1).toLowerCase()}
            </h2>
            <p className="text-xs text-[#545b64] mb-4">
              Specify the contact details for notifications related to {editingType.toLowerCase()}.
            </p>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#16191f] mb-1">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 text-xs focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16191f] mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 text-xs focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16191f] mb-1">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 text-xs focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16191f] mb-1">Phone number</label>
                <input
                  type="tel"
                  placeholder="+1 206-555-0100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 text-xs focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setEditingType(null)}
                  disabled={saving}
                  className="px-3 text-xs font-semibold border border-[#aab7b8] rounded bg-white hover:bg-[#f2f3f3]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 text-xs font-semibold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
