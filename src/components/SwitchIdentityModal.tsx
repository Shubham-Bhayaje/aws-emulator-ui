/**
 * SwitchIdentityModal.tsx – Switch User / Assume Role dialog
 *
 * Allows developers to test different IAM users and roles created in the local
 * emulator and observe how policy boundaries restrict actions.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAvailableIdentities, switchIdentityAction, resetToAdminAction, IdentitySummary } from "@/lib/identity";
import { ActiveIdentity } from "@/lib/permissions";

type SwitchIdentityModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onIdentityChanged?: (newIdentity: ActiveIdentity) => void;
};

export default function SwitchIdentityModal({ isOpen, onClose, onIdentityChanged }: SwitchIdentityModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IdentitySummary | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getAvailableIdentities()
        .then((res) => setData(res))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSwitch(type: "admin" | "user" | "role", name: string) {
    setSwitching(name);
    try {
      const updated = await switchIdentityAction(type, name);
      if (onIdentityChanged) onIdentityChanged(updated);
      router.refresh();
      onClose();
    } catch (err) {
      alert("Failed to switch identity: " + (err as Error).message);
    } finally {
      setSwitching(null);
    }
  }

  async function handleResetToAdmin() {
    setSwitching("admin");
    try {
      const updated = await resetToAdminAction();
      if (onIdentityChanged) onIdentityChanged(updated);
      router.refresh();
      onClose();
    } catch (err) {
      alert("Failed to revert to admin: " + (err as Error).message);
    } finally {
      setSwitching(null);
    }
  }

  const current = data?.currentIdentity;
  const isDefaultAdmin = current?.type === "admin" || current?.name === "emulator";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-[#d5dbdb] w-full max-w-[620px] overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#000716] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#ff9900]">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <div>
              <h2 className="text-[16px] font-bold">Switch Active Identity / Role</h2>
              <p className="text-[11px] text-[#8d9ba8]">Test IAM permissions, least-privilege policies, and access control locally.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1 rounded hover:bg-white/10 text-[18px]"
          >
            ✕
          </button>
        </div>

        {/* Current Active Banner */}
        <div className="px-6 py-3 bg-[#f2f3f3] border-b border-[#eaeded] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#545b64]">Current Active Identity:</span>
            {isDefaultAdmin ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                👑 Administrator (emulator)
              </span>
            ) : current?.type === "role" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-purple-100 text-purple-900 border border-purple-300">
                🎭 Role: {current?.name}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-blue-100 text-blue-900 border border-blue-300">
                👤 User: {current?.name}
              </span>
            )}
          </div>

          {!isDefaultAdmin && (
            <button
              onClick={handleResetToAdmin}
              disabled={!!switching}
              className="text-[11px] text-[#0073bb] hover:underline font-semibold"
            >
              Revert to Admin ↺
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#eaeded] px-6 pt-2 bg-white">
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-2 px-3 text-[13px] font-semibold border-b-2 transition-colors ${
              activeTab === "users" ? "border-[#ec7211] text-[#ec7211]" : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            IAM Users ({data?.users.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`pb-2 px-3 text-[13px] font-semibold border-b-2 transition-colors ${
              activeTab === "roles" ? "border-[#ec7211] text-[#ec7211]" : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            IAM Roles ({data?.roles.length || 0})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-[#545b64] text-[13px]">
              Loading identities from local emulator...
            </div>
          ) : activeTab === "users" ? (
            <div>
              {/* Default Admin Option */}
              <div
                className={`p-3.5 rounded-lg border mb-3 flex items-center justify-between transition-colors ${
                  isDefaultAdmin ? "bg-amber-50/60 border-amber-300 ring-1 ring-amber-300" : "bg-white border-[#d5dbdb] hover:border-[#aab7b8]"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px] text-[#16191f]">emulator (Root Administrator)</span>
                    <span className="text-[10px] bg-green-100 text-green-800 font-medium px-2 py-0.5 rounded">
                      Full Access (*)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#545b64] mt-0.5">
                    Default admin keys generated on emulator boot. Unrestricted permissions to all services.
                  </p>
                </div>
                {isDefaultAdmin ? (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded">
                    Active
                  </span>
                ) : (
                  <button
                    onClick={handleResetToAdmin}
                    disabled={!!switching}
                    className="text-[12px] bg-white border border-[#aab7b8] hover:bg-[#eaeded] px-3 py-1 rounded font-medium text-[#16191f]"
                  >
                    Switch to Admin
                  </button>
                )}
              </div>

              {/* Created IAM Users */}
              {data?.users && data.users.length > 0 ? (
                <div className="space-y-2.5">
                  {data.users.map((u) => {
                    const isCurrent = current?.type === "user" && current?.name === u.userName;
                    return (
                      <div
                        key={u.userName}
                        className={`p-3.5 rounded-lg border flex items-center justify-between transition-colors ${
                          isCurrent ? "bg-blue-50/60 border-[#0073bb] ring-1 ring-[#0073bb]" : "bg-white border-[#d5dbdb] hover:border-[#aab7b8]"
                        }`}
                      >
                        <div className="min-w-0 flex-1 mr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[13px] text-[#16191f]">{u.userName}</span>
                            <span className="text-[10px] text-[#545b64]">Created: {u.createDate || "Recent"}</span>
                          </div>
                          
                          <div className="mt-1 flex flex-wrap gap-1">
                            {u.attachedPolicies.length > 0 ? (
                              u.attachedPolicies.map((p) => (
                                <span
                                  key={p}
                                  className="text-[10px] bg-[#f2f3f3] text-[#16191f] px-2 py-0.5 rounded font-mono border border-[#e0e0e0]"
                                >
                                  {p}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-amber-700 italic">No policies attached (Deny all)</span>
                            )}
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded shrink-0">
                            Active
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSwitch("user", u.userName)}
                            disabled={!!switching}
                            className="text-[12px] bg-[#ec7211] hover:bg-[#eb5f07] text-white px-3 py-1 rounded font-medium shrink-0 shadow-xs"
                          >
                            {switching === u.userName ? "Switching..." : "Switch to User"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#fafafa] rounded border border-dashed border-[#d5dbdb]">
                  <p className="text-[13px] text-[#545b64] font-medium">No custom IAM users created yet.</p>
                  <p className="text-[11px] text-[#8d9ba8] mt-1">
                    Go to IAM → Users → Create User to create a user and attach custom policies.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              {data?.roles && data.roles.length > 0 ? (
                <div className="space-y-2.5">
                  {data.roles.map((r) => {
                    const isCurrent = current?.type === "role" && current?.name === r.roleName;
                    return (
                      <div
                        key={r.roleName}
                        className={`p-3.5 rounded-lg border flex items-center justify-between transition-colors ${
                          isCurrent ? "bg-purple-50/60 border-purple-400 ring-1 ring-purple-400" : "bg-white border-[#d5dbdb] hover:border-[#aab7b8]"
                        }`}
                      >
                        <div className="min-w-0 flex-1 mr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[13px] text-[#16191f]">{r.roleName}</span>
                          </div>
                          <div className="text-[10px] text-[#545b64] font-mono truncate mt-0.5">{r.arn}</div>
                        </div>

                        {isCurrent ? (
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded shrink-0">
                            Active
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSwitch("role", r.roleName)}
                            disabled={!!switching}
                            className="text-[12px] bg-[#0073bb] hover:bg-[#005a92] text-white px-3 py-1 rounded font-medium shrink-0 shadow-xs"
                          >
                            {switching === r.roleName ? "Assuming..." : "Assume Role"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#fafafa] rounded border border-dashed border-[#d5dbdb]">
                  <p className="text-[13px] text-[#545b64] font-medium">No IAM roles available.</p>
                  <p className="text-[11px] text-[#8d9ba8] mt-1">
                    Create roles under IAM → Roles with trust relationships.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#fafafa] border-t border-[#eaeded] flex items-center justify-between text-[11px] text-[#545b64]">
          <span>Tip: Switch to a user with limited policies to test `AccessDeniedException` responses.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-[#aab7b8] rounded hover:bg-[#eaeded] text-[12px] text-[#16191f] font-medium"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
