"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AccountInfo,
  ContactInfo,
  AlternateContact,
  AlternateContactType,
  RegionInfo,
} from "./types";
import { formatAccountDate } from "./dateUtils";
import {
  updateAccountNameAction,
  putAlternateContactAction,
  deleteAlternateContactAction,
  enableRegionAction,
  disableRegionAction,
  sendPhoneVerificationAction,
  verifyPhoneNumberAction,
  closeAccountAction,
} from "./actions";

interface AccountSettingsClientProps {
  initialAccount: AccountInfo;
  initialContact: ContactInfo;
  initialAlternateContacts: { [key in AlternateContactType]?: AlternateContact };
  initialRegions: RegionInfo[];
}

export function AccountSettingsClient({
  initialAccount,
  initialContact,
  initialAlternateContacts,
  initialRegions,
}: AccountSettingsClientProps) {
  const router = useRouter();

  // Account State
  const [account, setAccount] = useState<AccountInfo>(initialAccount);
  const [contact, setContact] = useState<ContactInfo>(initialContact);
  const [alternateContacts, setAlternateContacts] = useState<{
    [key in AlternateContactType]?: AlternateContact;
  }>(initialAlternateContacts);
  const [regions, setRegions] = useState<RegionInfo[]>(initialRegions);

  // Edit Account Name Modal
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [newName, setNewName] = useState(account.accountName);
  const [savingName, setSavingName] = useState(false);

  // Edit Alternate Contact Modal
  const [editingAlternateType, setEditingAlternateType] = useState<AlternateContactType | null>(null);
  const [altName, setAltName] = useState("");
  const [altTitle, setAltTitle] = useState("");
  const [altEmail, setAltEmail] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [savingAlt, setSavingAlt] = useState(false);

  // Region Enable/Disable Modals
  const [regionToEnable, setRegionToEnable] = useState<RegionInfo | null>(null);
  const [regionToDisable, setRegionToDisable] = useState<RegionInfo | null>(null);
  const [disableAcknowledged, setDisableAcknowledged] = useState(false);
  const [mutatingRegion, setMutatingRegion] = useState(false);

  // Phone Verification Modal
  const [isVerifyPhoneOpen, setIsVerifyPhoneOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  // Close Account Section
  const [closeCheck1, setCloseCheck1] = useState(false);
  const [closeCheck2, setCloseCheck2] = useState(false);
  const [closeCheck3, setCloseCheck3] = useState(false);
  const [confirmAccountId, setConfirmAccountId] = useState("");
  const [closingAccount, setClosingAccount] = useState(false);

  // Region search and filter
  const [regionFilter, setRegionFilter] = useState("");
  const [regionStatusTab, setRegionStatusTab] = useState<"ALL" | "ENABLED" | "DISABLED">("ALL");

  // Global Alert Banner
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const copyAccountId = () => {
    navigator.clipboard.writeText(account.accountId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Handlers: Account Name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSavingName(true);
    setBanner(null);
    try {
      const res = await updateAccountNameAction(newName.trim());
      if (res.success) {
        setAccount((prev) => ({ ...prev, accountName: newName.trim() }));
        setBanner({ type: "success", message: "Account name updated successfully." });
        setIsEditNameOpen(false);
      } else {
        setBanner({ type: "error", message: res.error || "Failed to update account name." });
      }
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "An error occurred." });
    } finally {
      setSavingName(false);
    }
  };

  // Handlers: Alternate Contact
  const openEditAlternate = (type: AlternateContactType) => {
    const existing = alternateContacts[type];
    setEditingAlternateType(type);
    setAltName(existing?.name || "");
    setAltTitle(existing?.title || "");
    setAltEmail(existing?.emailAddress || "");
    setAltPhone(existing?.phoneNumber || "");
  };

  const handleSaveAlternate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlternateType) return;
    setSavingAlt(true);
    setBanner(null);
    try {
      const updated: AlternateContact = {
        alternateContactType: editingAlternateType,
        name: altName.trim(),
        title: altTitle.trim(),
        emailAddress: altEmail.trim(),
        phoneNumber: altPhone.trim(),
      };
      const res = await putAlternateContactAction(updated);
      if (res.success) {
        setAlternateContacts((prev) => ({ ...prev, [editingAlternateType]: updated }));
        setBanner({
          type: "success",
          message: `${editingAlternateType} alternate contact updated successfully.`,
        });
        setEditingAlternateType(null);
      } else {
        setBanner({ type: "error", message: res.error || "Failed to update alternate contact." });
      }
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "An error occurred." });
    } finally {
      setSavingAlt(false);
    }
  };

  const handleDeleteAlternate = async (type: AlternateContactType) => {
    setBanner(null);
    try {
      const res = await deleteAlternateContactAction(type);
      if (res.success) {
        setAlternateContacts((prev) => {
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

  // Handlers: Regions
  const handleEnableRegion = async () => {
    if (!regionToEnable) return;
    setMutatingRegion(true);
    setBanner(null);
    try {
      const res = await enableRegionAction(regionToEnable.regionName);
      if (res.success) {
        setRegions((prev) =>
          prev.map((r) =>
            r.regionName === regionToEnable.regionName ? { ...r, regionOptStatus: "ENABLED" } : r
          )
        );
        setBanner({
          type: "success",
          message: `Region ${regionToEnable.regionName} enabled successfully.`,
        });
        setRegionToEnable(null);
      } else {
        setBanner({ type: "error", message: res.error || "Failed to enable region." });
      }
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "An error occurred." });
    } finally {
      setMutatingRegion(false);
    }
  };

  const handleDisableRegion = async () => {
    if (!regionToDisable) return;
    setMutatingRegion(true);
    setBanner(null);
    try {
      const res = await disableRegionAction(regionToDisable.regionName);
      if (res.success) {
        setRegions((prev) =>
          prev.map((r) =>
            r.regionName === regionToDisable.regionName ? { ...r, regionOptStatus: "DISABLED" } : r
          )
        );
        setBanner({
          type: "success",
          message: `Region ${regionToDisable.regionName} disabled successfully.`,
        });
        setRegionToDisable(null);
        setDisableAcknowledged(false);
      } else {
        setBanner({ type: "error", message: res.error || "Failed to disable region." });
      }
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "An error occurred." });
    } finally {
      setMutatingRegion(false);
    }
  };

  // Handlers: Phone verification
  const handleStartPhoneVerification = async () => {
    setBanner(null);
    try {
      const res = await sendPhoneVerificationAction();
      if (res.success) {
        setIsVerifyPhoneOpen(true);
      } else {
        setBanner({ type: "error", message: res.error || "Failed to send verification code." });
      }
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "An error occurred." });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    setVerifyingPhone(true);
    try {
      const res = await verifyPhoneNumberAction(otpCode.trim());
      if (res.success) {
        setContact((prev) => ({ ...prev, verificationStatus: "VERIFIED" }));
        setBanner({ type: "success", message: "Phone number verified successfully." });
        setIsVerifyPhoneOpen(false);
        setOtpCode("");
      } else {
        setBanner({ type: "error", message: res.error || "Verification failed." });
      }
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "An error occurred." });
    } finally {
      setVerifyingPhone(false);
    }
  };

  // Handlers: Close Account
  const handleCloseAccount = async () => {
    if (confirmAccountId !== account.accountId) return;
    setClosingAccount(true);
    try {
      const res = await closeAccountAction(confirmAccountId);
      if (res.success) {
        setBanner({
          type: "success",
          message: "Account closure initiated. The 90-day post-closure period has started.",
        });
      } else {
        setBanner({ type: "error", message: res.error || "Failed to close account." });
      }
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "An error occurred." });
    } finally {
      setClosingAccount(false);
    }
  };

  // Filtered regions
  const filteredRegions = regions.filter((r) => {
    const matchesFilter =
      r.regionName.toLowerCase().includes(regionFilter.toLowerCase());
    if (regionStatusTab === "ENABLED") {
      return (
        matchesFilter &&
        (r.regionOptStatus === "ENABLED" || r.regionOptStatus === "ENABLED_BY_DEFAULT")
      );
    }
    if (regionStatusTab === "DISABLED") {
      return matchesFilter && r.regionOptStatus === "DISABLED";
    }
    return matchesFilter;
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto text-[#16191f]">
      {/* Alert Banner */}
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
      <div className="flex items-center justify-between pb-4 border-b border-[#eaeded] mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#16191f]">Account settings</h1>
          <p className="text-xs text-[#545b64] mt-1">
            Manage your account identifier, contact information, AWS Regions, and alternate contacts.
          </p>
        </div>
        <button
          onClick={() => router.refresh()}
          className="px-3 text-xs font-semibold bg-white border border-[#aab7b8] text-[#16191f] rounded hover:bg-[#f2f3f3]"
          style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
        >
          Refresh
        </button>
      </div>

      <div className="space-y-6">
        {/* 1. Account Information Card */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#eaeded]">
            <h2 className="text-sm font-bold text-[#16191f]">Account</h2>
            <button
              type="button"
              onClick={() => {
                setNewName(account.accountName);
                setIsEditNameOpen(true);
              }}
              className="px-3 text-xs font-semibold bg-white border border-[#aab7b8] text-[#16191f] rounded hover:bg-[#f2f3f3]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Edit account name
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
            <div>
              <span className="text-[#545b64] block mb-1">Account name</span>
              <span className="font-semibold text-[#16191f]">{account.accountName}</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Account ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-[#16191f]">{account.accountId}</span>
                <button
                  onClick={copyAccountId}
                  className="text-[11px] text-[#0073bb] hover:underline"
                >
                  {copiedId ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Account status</span>
              <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-[#f2fcf3] text-[#037f0c] border border-[#a1dfa5] rounded">
                {account.accountState || "ACTIVE"}
              </span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Account created</span>
              <span className="text-[#545b64]" suppressHydrationWarning>
                {formatAccountDate(account.accountCreatedDate)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Primary Contact Information Card */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#eaeded]">
            <div>
              <h2 className="text-sm font-bold text-[#16191f]">Primary contact information</h2>
              <p className="text-[11px] text-[#545b64]">
                Used by AWS to contact you regarding account activity, billing, and security notices.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/account/contact"
                className="px-3 text-xs font-semibold bg-white border border-[#aab7b8] text-[#16191f] rounded hover:bg-[#f2f3f3] flex items-center justify-center"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Edit
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-[#545b64] block mb-1">Full name / Company</span>
              <span className="font-semibold text-[#16191f]">{contact.fullName || "-"}</span>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Address</span>
              <div className="text-[#16191f]">
                {contact.addressLine1 ? (
                  <>
                    <div>{contact.addressLine1}</div>
                    {contact.addressLine2 && <div>{contact.addressLine2}</div>}
                    <div>
                      {contact.city}, {contact.stateOrRegion} {contact.postalCode}
                    </div>
                    <div>{contact.countryCode}</div>
                  </>
                ) : (
                  "-"
                )}
              </div>
            </div>
            <div>
              <span className="text-[#545b64] block mb-1">Phone number</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#16191f]">{contact.phoneNumber || "-"}</span>
                {contact.phoneNumber && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border ${
                      contact.verificationStatus === "VERIFIED"
                        ? "bg-[#f2fcf3] text-[#037f0c] border-[#a1dfa5]"
                        : "bg-[#fffbf2] text-[#875904] border-[#f29f05]"
                    }`}
                  >
                    {contact.verificationStatus || "UNVERIFIED"}
                  </span>
                )}
                {contact.phoneNumber && contact.verificationStatus !== "VERIFIED" && (
                  <button
                    onClick={handleStartPhoneVerification}
                    className="text-[11px] text-[#0073bb] hover:underline"
                  >
                    Verify
                  </button>
                )}
              </div>
              {contact.websiteUrl && (
                <div className="mt-2">
                  <span className="text-[#545b64] block mb-0.5">Website</span>
                  <a
                    href={contact.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0073bb] hover:underline"
                  >
                    {contact.websiteUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Alternate Contacts Card */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#eaeded]">
            <div>
              <h2 className="text-sm font-bold text-[#16191f]">Alternate contacts</h2>
              <p className="text-[11px] text-[#545b64]">
                Alternate contacts receive operational, billing, and security notices when AWS cannot contact the primary account owner.
              </p>
            </div>
            <Link
              href="/account/alternate-contacts"
              className="text-xs font-semibold text-[#0073bb] hover:underline"
            >
              Manage alternate contacts
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["BILLING", "OPERATIONS", "SECURITY"] as AlternateContactType[]).map((type) => {
              const c = alternateContacts[type];
              return (
                <div key={type} className="border border-[#eaeded] rounded p-4 bg-[#fafafa]">
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#eaeded]">
                    <span className="text-xs font-bold text-[#16191f]">
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditAlternate(type)}
                        className="text-xs text-[#0073bb] font-semibold hover:underline"
                      >
                        {c ? "Edit" : "Configure"}
                      </button>
                      {c && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAlternate(type)}
                          className="text-xs text-[#d13212] font-semibold hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {c ? (
                    <div className="space-y-1.5 text-xs text-[#16191f]">
                      <div>
                        <span className="text-[#545b64]">Name:</span> {c.name}
                      </div>
                      <div>
                        <span className="text-[#545b64]">Title:</span> {c.title}
                      </div>
                      <div>
                        <span className="text-[#545b64]">Email:</span>{" "}
                        <span className="font-mono text-[11px]">{c.emailAddress}</span>
                      </div>
                      <div>
                        <span className="text-[#545b64]">Phone:</span>{" "}
                        <span className="font-mono text-[11px]">{c.phoneNumber}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#545b64] italic">Not configured.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. AWS Regions Card */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-[#eaeded]">
            <div>
              <h2 className="text-sm font-bold text-[#16191f]">AWS Regions</h2>
              <p className="text-[11px] text-[#545b64]">
                Enable or disable opt-in AWS Regions for this account.
              </p>
            </div>
            <Link
              href="/account/regions"
              className="text-xs font-semibold text-[#0073bb] hover:underline"
            >
              View all regions table
            </Link>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRegionStatusTab("ALL")}
                className={`px-3 text-xs font-semibold rounded border ${
                  regionStatusTab === "ALL"
                    ? "bg-[#16191f] text-white border-[#16191f]"
                    : "bg-white text-[#16191f] border-[#aab7b8] hover:bg-[#f2f3f3]"
                }`}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                All regions ({regions.length})
              </button>
              <button
                type="button"
                onClick={() => setRegionStatusTab("ENABLED")}
                className={`px-3 text-xs font-semibold rounded border ${
                  regionStatusTab === "ENABLED"
                    ? "bg-[#16191f] text-white border-[#16191f]"
                    : "bg-white text-[#16191f] border-[#aab7b8] hover:bg-[#f2f3f3]"
                }`}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Enabled (
                {
                  regions.filter(
                    (r) =>
                      r.regionOptStatus === "ENABLED" ||
                      r.regionOptStatus === "ENABLED_BY_DEFAULT"
                  ).length
                }
                )
              </button>
              <button
                type="button"
                onClick={() => setRegionStatusTab("DISABLED")}
                className={`px-3 text-xs font-semibold rounded border ${
                  regionStatusTab === "DISABLED"
                    ? "bg-[#16191f] text-white border-[#16191f]"
                    : "bg-white text-[#16191f] border-[#aab7b8] hover:bg-[#f2f3f3]"
                }`}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Disabled ({regions.filter((r) => r.regionOptStatus === "DISABLED").length})
              </button>
            </div>

            <input
              type="text"
              placeholder="Search regions"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="border border-[#aab7b8] rounded px-3 text-xs w-64 focus:outline-none focus:border-[#ec7211]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            />
          </div>

          {/* Regions Table */}
          <div className="overflow-x-auto border border-[#eaeded] rounded max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#f8f9fa] z-10 border-b border-[#eaeded]">
                <tr className="text-[#545b64] font-semibold">
                  <th className="py-2 px-3">Region name</th>
                  <th className="py-2 px-3">Region code</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {filteredRegions.map((reg) => {
                  const isEnabledByDefault = reg.regionOptStatus === "ENABLED_BY_DEFAULT";
                  const isEnabled = reg.regionOptStatus === "ENABLED";
                  const isDisabled = reg.regionOptStatus === "DISABLED";

                  return (
                    <tr key={reg.regionName} className="hover:bg-[#fafafa]">
                      <td className="py-2 px-3 font-semibold text-[#16191f]">{reg.regionName}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-[#545b64]">{reg.regionName}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded border ${
                            isEnabledByDefault
                              ? "bg-[#f2f3f3] text-[#545b64] border-[#eaeded]"
                              : isEnabled
                              ? "bg-[#f2fcf3] text-[#037f0c] border-[#a1dfa5]"
                              : "bg-[#fdf3f2] text-[#d13212] border-[#f3b5a8]"
                          }`}
                        >
                          {isEnabledByDefault
                            ? "Enabled by default"
                            : isEnabled
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        {isEnabledByDefault ? (
                          <span className="text-[#aab7b8] text-[11px] italic">Not configurable</span>
                        ) : isEnabled ? (
                          <button
                            type="button"
                            onClick={() => {
                              setRegionToDisable(reg);
                              setDisableAcknowledged(false);
                            }}
                            className="px-3 text-xs font-semibold rounded border border-[#d13212] text-[#d13212] bg-white hover:bg-[#fdf3f2]"
                            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRegionToEnable(reg)}
                            className="px-3 text-xs font-semibold rounded text-white bg-[#ec7211] hover:bg-[#eb5f07]"
                            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                          >
                            Enable
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Close Account Card */}
        <div className="bg-white border border-[#d13212] rounded shadow-sm p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#eaeded]">
            <div>
              <h2 className="text-sm font-bold text-[#d13212]">Close account</h2>
              <p className="text-[11px] text-[#545b64]">
                Closing your AWS account permanently deletes all content and terminates all active resources across all Regions.
              </p>
            </div>
            <Link
              href="/account/close"
              className="text-xs font-semibold text-[#0073bb] hover:underline"
            >
              Full closure instructions
            </Link>
          </div>

          <div className="space-y-3 mb-4 text-xs">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={closeCheck1}
                onChange={(e) => setCloseCheck1(e.target.checked)}
                className="mt-0.5 accent-[#d13212]"
              />
              <span>
                I understand that closing my account will permanently delete all resources, databases, and files across all AWS services.
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={closeCheck2}
                onChange={(e) => setCloseCheck2(e.target.checked)}
                className="mt-0.5 accent-[#d13212]"
              />
              <span>
                I understand that any outstanding billable charges incurred prior to closure will still be billed.
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={closeCheck3}
                onChange={(e) => setCloseCheck3(e.target.checked)}
                className="mt-0.5 accent-[#d13212]"
              />
              <span>
                I acknowledge that a 90-day post-closure period applies before permanent account deletion.
              </span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#eaeded]">
            <input
              type="text"
              placeholder={`Type "${account.accountId}" to confirm`}
              value={confirmAccountId}
              onChange={(e) => setConfirmAccountId(e.target.value)}
              className="border border-[#aab7b8] rounded px-3 text-xs w-72 focus:outline-none focus:border-[#d13212]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
            />
            <button
              type="button"
              disabled={
                !closeCheck1 ||
                !closeCheck2 ||
                !closeCheck3 ||
                confirmAccountId !== account.accountId ||
                closingAccount
              }
              onClick={handleCloseAccount}
              className={`px-4 text-xs font-semibold rounded text-white ${
                closeCheck1 &&
                closeCheck2 &&
                closeCheck3 &&
                confirmAccountId === account.accountId
                  ? "bg-[#d13212] hover:bg-[#b02a0f]"
                  : "bg-[#aab7b8] cursor-not-allowed"
              }`}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              {closingAccount ? "Closing..." : "Close account"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal 1: Edit Account Name */}
      {isEditNameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 text-[#16191f]">
            <h2 className="text-base font-bold mb-2">Edit account name</h2>
            <p className="text-xs text-[#545b64] mb-4">
              Enter a new display name for your AWS account. This name helps you identify the account in AWS Organizations and the console.
            </p>

            <form onSubmit={handleSaveName}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-[#16191f] mb-1">Account name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 text-xs focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  required
                />
                <p className="text-[11px] text-[#545b64] mt-1">1 to 64 alphanumeric characters, hyphens, and spaces.</p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditNameOpen(false)}
                  disabled={savingName}
                  className="px-3 text-xs font-semibold border border-[#aab7b8] rounded bg-white hover:bg-[#f2f3f3]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingName}
                  className="px-4 text-xs font-semibold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {savingName ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Alternate Contact */}
      {editingAlternateType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 text-[#16191f]">
            <h2 className="text-base font-bold mb-1">
              Edit alternate contact: {editingAlternateType.charAt(0) + editingAlternateType.slice(1).toLowerCase()}
            </h2>
            <p className="text-xs text-[#545b64] mb-4">
              Specify the contact details for notifications related to {editingAlternateType.toLowerCase()}.
            </p>

            <form onSubmit={handleSaveAlternate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#16191f] mb-1">Full name</label>
                <input
                  type="text"
                  value={altName}
                  onChange={(e) => setAltName(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 text-xs focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16191f] mb-1">Title</label>
                <input
                  type="text"
                  value={altTitle}
                  onChange={(e) => setAltTitle(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 text-xs focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16191f] mb-1">Email address</label>
                <input
                  type="email"
                  value={altEmail}
                  onChange={(e) => setAltEmail(e.target.value)}
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
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 text-xs focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  required
                />
                <p className="text-[11px] text-[#545b64] mt-0.5">Include country code (e.g. +1).</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setEditingAlternateType(null)}
                  disabled={savingAlt}
                  className="px-3 text-xs font-semibold border border-[#aab7b8] rounded bg-white hover:bg-[#f2f3f3]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAlt}
                  className="px-4 text-xs font-semibold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {savingAlt ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Enable Region Confirmation */}
      {regionToEnable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 text-[#16191f]">
            <h2 className="text-base font-bold mb-2">
              Enable region: {regionToEnable.regionName}
            </h2>
            <p className="text-xs text-[#545b64] mb-4">
              Enabling this Region allows resources to be created and managed in{" "}
              <strong>{regionToEnable.regionName}</strong>. Data stored in this Region remains in this Region unless
              explicitly transferred.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRegionToEnable(null)}
                disabled={mutatingRegion}
                className="px-3 text-xs font-semibold border border-[#aab7b8] rounded bg-white hover:bg-[#f2f3f3]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEnableRegion}
                disabled={mutatingRegion}
                className="px-4 text-xs font-semibold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {mutatingRegion ? "Enabling..." : "Enable region"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Disable Region Confirmation */}
      {regionToDisable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 text-[#16191f]">
            <h2 className="text-base font-bold mb-2 text-[#d13212]">
              Disable region: {regionToDisable.regionName}
            </h2>
            <p className="text-xs text-[#545b64] mb-4">
              Disabling this Region will prevent access to any existing resources in this Region. Make sure all resources have been deleted or migrated before disabling.
            </p>

            <label className="flex items-start gap-2 mb-4 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={disableAcknowledged}
                onChange={(e) => setDisableAcknowledged(e.target.checked)}
                className="mt-0.5 accent-[#d13212]"
              />
              <span>I acknowledge that resources in this Region will become inaccessible.</span>
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRegionToDisable(null)}
                disabled={mutatingRegion}
                className="px-3 text-xs font-semibold border border-[#aab7b8] rounded bg-white hover:bg-[#f2f3f3]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!disableAcknowledged || mutatingRegion}
                onClick={handleDisableRegion}
                className={`px-4 text-xs font-semibold text-white rounded ${
                  disableAcknowledged
                    ? "bg-[#d13212] hover:bg-[#b02a0f]"
                    : "bg-[#aab7b8] cursor-not-allowed"
                }`}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {mutatingRegion ? "Disabling..." : "Disable region"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Phone Number Verification */}
      {isVerifyPhoneOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-md w-full p-6 text-[#16191f]">
            <h2 className="text-base font-bold mb-2">Verify phone number</h2>
            <p className="text-xs text-[#545b64] mb-4">
              A verification code has been dispatched to <strong>{contact.phoneNumber}</strong>. Enter the OTP code below.
            </p>

            <form onSubmit={handleVerifyOtp}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-[#16191f] mb-1">Verification OTP code</label>
                <input
                  type="text"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded px-3 text-xs focus:outline-none focus:border-[#ec7211]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVerifyPhoneOpen(false)}
                  disabled={verifyingPhone}
                  className="px-3 text-xs font-semibold border border-[#aab7b8] rounded bg-white hover:bg-[#f2f3f3]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingPhone}
                  className="px-4 text-xs font-semibold text-white bg-[#ec7211] rounded hover:bg-[#eb5f07]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {verifyingPhone ? "Verifying..." : "Verify"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
