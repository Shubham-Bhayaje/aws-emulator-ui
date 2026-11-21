/**
 * src/app/iam/users/[user]/UserDetail.tsx – Comprehensive User Details.
 * Includes Permissions, Groups, and Security Credentials (Access Keys) tabs.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  attachUserPolicy,
  detachUserPolicy,
  inspectPolicy,
  addUserToGroupAction,
  removeUserFromGroupAction,
  createAccessKeyAction,
  updateAccessKeyStatusAction,
  deleteAccessKeyAction,
  AccessKeyInfo,
  listMFADevicesAction,
  createVirtualMFADeviceAction,
  enableMFADeviceAction,
  deactivateMFADeviceAction,
  MFADeviceInfo,
} from "../../actions";

export interface AttachedPolicyInfo {
  name: string;
  arn: string;
}

export interface UserDetailMeta {
  userName: string;
  userId: string;
  arn: string;
  createDate: string;
  attachedPolicies: AttachedPolicyInfo[];
}

interface UserDetailProps {
  user: UserDetailMeta;
  allPolicies: { name: string; arn: string }[];
  userGroups?: Array<{ groupName: string; arn: string; createDate: string }>;
  allGroups?: Array<{ groupName: string }>;
  initialAccessKeys?: AccessKeyInfo[];
  initialMFADevices?: MFADeviceInfo[];
  canAttachPolicy?: boolean;
  canDetachPolicy?: boolean;
  activeIdentityName?: string;
  activeIdentityType?: string;
}

export function UserDetail({
  user,
  allPolicies,
  userGroups = [],
  allGroups = [],
  initialAccessKeys = [],
  initialMFADevices = [],
  canAttachPolicy = true,
  canDetachPolicy = true,
  activeIdentityName = "Administrator",
  activeIdentityType = "admin",
}: UserDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "permissions" | "groups" | "securityCredentials" | "details"
  >("permissions");

  // Policy Modals
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [selectedPolicyArn, setSelectedPolicyArn] = useState("");
  const [inspectedPolicy, setInspectedPolicy] = useState<{
    name: string;
    arn: string;
    document: any;
  } | null>(null);

  // Group Modals
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [selectedGroupToAdd, setSelectedGroupToAdd] = useState("");

  // Access Key State
  const [accessKeys, setAccessKeys] = useState<AccessKeyInfo[]>(initialAccessKeys);
  const [createdKeyModalData, setCreatedKeyModalData] = useState<{
    accessKeyId: string;
    secretAccessKey: string;
  } | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // MFA State
  const [mfaDevices, setMfaDevices] = useState<MFADeviceInfo[]>(initialMFADevices);
  const [showAssignMfaModal, setShowAssignMfaModal] = useState(false);
  const [mfaDeviceName, setMfaDeviceName] = useState("");
  const [mfaStep, setMfaStep] = useState<1 | 2>(1);
  const [createdDeviceSerial, setCreatedDeviceSerial] = useState("");
  const [createdBase32Seed, setCreatedBase32Seed] = useState("");
  const [sampleCode1, setSampleCode1] = useState("");
  const [sampleCode2, setSampleCode2] = useState("");
  const [authCode1, setAuthCode1] = useState("");
  const [authCode2, setAuthCode2] = useState("");
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [mfaModalError, setMfaModalError] = useState<string | null>(null);
  const [isCreatingDevice, setIsCreatingDevice] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const availableGroupsToAdd = allGroups.filter(
    (g) => !userGroups.some((ug) => ug.groupName === g.groupName)
  );

  async function handleInspect(policyArn: string, policyName: string) {
    setError(null);
    const res = await inspectPolicy(policyArn);
    if (res.error) {
      setError(res.error);
    } else {
      setInspectedPolicy({
        name: policyName,
        arn: policyArn,
        document: res.document,
      });
    }
  }

  function handleAttach() {
    if (!selectedPolicyArn) return;
    setError(null);
    startTransition(async () => {
      const res = await attachUserPolicy(user.userName, selectedPolicyArn);
      if (res.error) {
        setError(res.error);
      } else {
        setShowAttachModal(false);
        setSelectedPolicyArn("");
        router.refresh();
        setFeedback("Policy attached successfully.");
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDetach(policyArn: string) {
    setError(null);
    startTransition(async () => {
      const res = await detachUserPolicy(user.userName, policyArn);
      if (res.error) {
        setError(res.error);
      } else {
        router.refresh();
        setFeedback("Policy detached successfully.");
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleAddUserToGroup() {
    if (!selectedGroupToAdd) return;
    setError(null);
    startTransition(async () => {
      const res = await addUserToGroupAction(user.userName, selectedGroupToAdd);
      if (res.success) {
        setShowAddGroupModal(false);
        setSelectedGroupToAdd("");
        router.refresh();
        setFeedback(`User added to group "${selectedGroupToAdd}" successfully.`);
      } else {
        setError(res.error || "Failed to add user to group.");
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleRemoveFromGroup(groupName: string) {
    setError(null);
    startTransition(async () => {
      const res = await removeUserFromGroupAction(user.userName, groupName);
      if (res.success) {
        router.refresh();
        setFeedback(`User removed from group "${groupName}".`);
      } else {
        setError(res.error || "Failed to remove user from group.");
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleCreateAccessKey() {
    setError(null);
    startTransition(async () => {
      const res = await createAccessKeyAction(user.userName);
      if (res.success && res.accessKey) {
        setCreatedKeyModalData({
          accessKeyId: res.accessKey.accessKeyId,
          secretAccessKey: res.accessKey.secretAccessKey,
        });
        setAccessKeys((prev) => [
          ...prev,
          {
            accessKeyId: res.accessKey!.accessKeyId,
            status: "Active",
            createDate: res.accessKey!.createDate,
          },
        ]);
        router.refresh();
      } else {
        setError(res.error || "Failed to create access key.");
      }
    });
  }

  function handleToggleKeyStatus(accessKeyId: string, currentStatus: "Active" | "Inactive") {
    const nextStatus = currentStatus === "Active" ? "Inactive" : "Active";
    startTransition(async () => {
      const res = await updateAccessKeyStatusAction(user.userName, accessKeyId, nextStatus);
      if (res.success) {
        setAccessKeys((prev) =>
          prev.map((k) => (k.accessKeyId === accessKeyId ? { ...k, status: nextStatus } : k))
        );
        router.refresh();
        setFeedback(`Access key set to ${nextStatus}.`);
      } else {
        setError(res.error || "Failed to update access key status.");
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleDeleteAccessKey(accessKeyId: string) {
    startTransition(async () => {
      const res = await deleteAccessKeyAction(user.userName, accessKeyId);
      if (res.success) {
        setAccessKeys((prev) => prev.filter((k) => k.accessKeyId !== accessKeyId));
        router.refresh();
        setFeedback("Access key deleted successfully.");
      } else {
        setError(res.error || "Failed to delete access key.");
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  function handleOpenAssignMfa() {
    setMfaDeviceName(`${user.userName}-mfa-${Date.now().toString().slice(-4)}`);
    setMfaStep(1);
    setCreatedDeviceSerial("");
    setCreatedBase32Seed("");
    setSampleCode1("");
    setSampleCode2("");
    setAuthCode1("");
    setAuthCode2("");
    setMfaModalError(null);
    setShowAssignMfaModal(true);
  }

  async function handleProceedToMfaSetup() {
    const clean = mfaDeviceName.trim();
    if (!clean) {
      setMfaModalError("Device name is required.");
      return;
    }
    setIsCreatingDevice(true);
    setMfaModalError(null);
    const res = await createVirtualMFADeviceAction(clean);
    setIsCreatingDevice(false);
    if (res.success && res.serialNumber && res.base32Seed) {
      setCreatedDeviceSerial(res.serialNumber);
      setCreatedBase32Seed(res.base32Seed);
      setSampleCode1(res.sampleCode1 || "");
      setSampleCode2(res.sampleCode2 || "");
      setMfaStep(2);
    } else {
      setMfaModalError(res.error || "Failed to create virtual MFA device.");
    }
  }

  function handleAutofillCodes() {
    if (sampleCode1 && sampleCode2) {
      setAuthCode1(sampleCode1);
      setAuthCode2(sampleCode2);
    }
  }

  function handleConfirmAssignMfa() {
    if (!authCode1.trim() || !authCode2.trim()) {
      setMfaModalError("Please provide both 6-digit authentication codes.");
      return;
    }
    startTransition(async () => {
      setMfaModalError(null);
      const res = await enableMFADeviceAction(
        user.userName,
        createdDeviceSerial,
        authCode1.trim(),
        authCode2.trim()
      );
      if (res.success) {
        setMfaDevices((prev) => [
          ...prev,
          {
            userName: user.userName,
            serialNumber: createdDeviceSerial,
            enableDate: new Date().toISOString(),
          },
        ]);
        setShowAssignMfaModal(false);
        router.refresh();
        setFeedback(`MFA device successfully assigned to ${user.userName}.`);
      } else {
        setMfaModalError(res.error || "Failed to enable MFA device.");
      }
    });
  }

  function handleRemoveMfa(serialNumber: string) {
    if (!confirm(`Are you sure you want to remove MFA device ${serialNumber}?`)) return;
    startTransition(async () => {
      const res = await deactivateMFADeviceAction(user.userName, serialNumber);
      if (res.success) {
        setMfaDevices((prev) => prev.filter((d) => d.serialNumber !== serialNumber));
        router.refresh();
        setFeedback("MFA device deactivated and removed successfully.");
      } else {
        setError(res.error || "Failed to deactivate MFA device.");
      }
      setTimeout(() => setFeedback(null), 5000);
    });
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-bold text-[#16191f]">{user.userName}</h1>
            <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-[#f2f3f3] text-[#545b64]">
              IAM user
            </span>
          </div>
          <p className="text-[12px] text-[#545b64] font-mono mt-0.5">{user.arn}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/iam/users"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
          >
            Users
          </Link>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-[#f2f8fd] border border-[#0073bb] text-[#0073bb] rounded-sm text-[13px] flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-[12px] font-bold hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#fdf3f1] border border-[#d13212] text-[#d13212] rounded-sm text-[13px] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-[12px] font-bold hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Box */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-6 text-[13px]">
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">User ID</div>
          <div className="font-mono text-[#16191f] mt-1">{user.userId}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">Creation time</div>
          <div className="text-[#16191f] mt-1">{user.createDate}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">Direct policies</div>
          <div className="text-[#0073bb] font-bold mt-1">{user.attachedPolicies.length}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#545b64] uppercase tracking-wider">User groups</div>
          <div className="text-[#1d8102] font-bold mt-1">{userGroups.length}</div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm shadow-xs">
        <div className="border-b border-[#eaeded] flex items-center px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("permissions")}
            className={`py-3 px-4 text-[13px] font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "permissions"
                ? "border-[#0073bb] text-[#0073bb]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Permissions ({user.attachedPolicies.length})
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`py-3 px-4 text-[13px] font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "groups"
                ? "border-[#0073bb] text-[#0073bb]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Groups ({userGroups.length})
          </button>
          <button
            onClick={() => setActiveTab("securityCredentials")}
            className={`py-3 px-4 text-[13px] font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "securityCredentials"
                ? "border-[#0073bb] text-[#0073bb]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Security credentials ({accessKeys.length + mfaDevices.length})
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`py-3 px-4 text-[13px] font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === "details"
                ? "border-[#0073bb] text-[#0073bb]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            Details
          </button>
        </div>

        <div className="p-6">
          {/* Permissions Tab */}
          {activeTab === "permissions" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eaeded]">
                <div>
                  <h3 className="text-[14px] font-bold text-[#16191f]">
                    Permissions policies ({user.attachedPolicies.length})
                  </h3>
                  <p className="text-[12px] text-[#545b64]">
                    Policies directly attached to this IAM user.
                  </p>
                </div>
                {canAttachPolicy && (
                  <button
                    onClick={() => setShowAttachModal(true)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-3 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
                  >
                    Attach policies
                  </button>
                )}
              </div>

              {user.attachedPolicies.length === 0 ? (
                <div className="p-8 text-center bg-[#fafafa] border border-[#eaeded] rounded-sm">
                  <p className="text-[13px] font-bold text-[#16191f]">No policies directly attached</p>
                  <p className="text-[12px] text-[#545b64] mt-1 mb-4">
                    Attach IAM policies or add the user to a group to grant access to AWS services.
                  </p>
                  {canAttachPolicy && (
                    <button
                      onClick={() => setShowAttachModal(true)}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
                    >
                      Attach policies
                    </button>
                  )}
                </div>
              ) : (
                <div className="border border-[#eaeded] rounded-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4">Policy name</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Policy ARN</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
                      {user.attachedPolicies.map((p) => {
                        const isAWSManaged = p.arn.includes(":aws:policy");
                        return (
                          <tr key={p.arn} className="hover:bg-[#fafafa]">
                            <td className="py-2.5 px-4 font-semibold text-[#0073bb]">
                              <button
                                onClick={() => handleInspect(p.arn, p.name)}
                                className="hover:underline text-left"
                              >
                                {p.name}
                              </button>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#f2f3f3] text-[#16191f]">
                                {isAWSManaged ? "AWS managed" : "Customer managed"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64] max-w-[280px] truncate">
                              {p.arn}
                            </td>
                            <td className="py-2.5 px-3 text-right space-x-3">
                              <button
                                onClick={() => handleInspect(p.arn, p.name)}
                                className="text-[12px] font-bold text-[#0073bb] hover:underline"
                              >
                                View policy
                              </button>
                              {canDetachPolicy && (
                                <button
                                  onClick={() => handleDetach(p.arn)}
                                  disabled={isPending}
                                  className="text-[12px] font-bold text-[#d13212] hover:underline"
                                >
                                  Detach
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Groups Tab */}
          {activeTab === "groups" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eaeded]">
                <div>
                  <h3 className="text-[14px] font-bold text-[#16191f]">
                    User groups ({userGroups.length})
                  </h3>
                  <p className="text-[12px] text-[#545b64]">
                    The user inherits permissions from all policies attached to these user groups.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddGroupModal(true)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="h-[32px] px-3 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
                >
                  Add user to groups
                </button>
              </div>

              {userGroups.length === 0 ? (
                <div className="p-8 text-center bg-[#fafafa] border border-[#eaeded] rounded-sm">
                  <p className="text-[13px] font-bold text-[#16191f]">User does not belong to any groups</p>
                  <p className="text-[12px] text-[#545b64] mt-1 mb-4">
                    Add this user to groups to manage permissions collectively.
                  </p>
                  <button
                    onClick={() => setShowAddGroupModal(true)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
                  >
                    Add user to groups
                  </button>
                </div>
              ) : (
                <div className="border border-[#eaeded] rounded-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4">Group name</th>
                        <th className="py-2.5 px-3">ARN</th>
                        <th className="py-2.5 px-3">Joined time</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
                      {userGroups.map((g) => (
                        <tr key={g.groupName} className="hover:bg-[#fafafa]">
                          <td className="py-2.5 px-4 font-semibold text-[#0073bb]">
                            <Link href={`/iam/user-groups/${encodeURIComponent(g.groupName)}`} className="hover:underline">
                              {g.groupName}
                            </Link>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64] max-w-[280px] truncate">
                            {g.arn}
                          </td>
                          <td className="py-2.5 px-3 text-[#545b64] text-[12px]">{g.createDate}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleRemoveFromGroup(g.groupName)}
                              disabled={isPending}
                              className="text-[12px] font-bold text-[#d13212] hover:underline"
                            >
                              Remove from group
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Security Credentials Tab */}
          {activeTab === "securityCredentials" && (
            <div className="space-y-6">
              {/* Console Sign-in section */}
              <div className="border border-[#eaeded] rounded-sm p-4 bg-[#fafafa]">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[13px] font-bold text-[#16191f]">Console sign-in</h4>
                    <p className="text-[12px] text-[#545b64] mt-0.5">
                      Specifies whether this user can sign in to the AWS Management Console.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                    Enabled
                  </span>
                </div>
              </div>

              {/* Multi-factor authentication (MFA) Section */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eaeded]">
                  <div>
                    <h3 className="text-[14px] font-bold text-[#16191f]">
                      Multi-factor authentication (MFA) ({mfaDevices.length})
                    </h3>
                    <p className="text-[12px] text-[#545b64]">
                      MFA adds an extra layer of protection on top of user name and password. You can assign up to 8 MFA devices per user.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenAssignMfa}
                    disabled={isPending}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-3 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
                  >
                    Assign MFA device
                  </button>
                </div>

                {mfaDevices.length === 0 ? (
                  <div className="p-8 text-center bg-[#fafafa] border border-[#eaeded] rounded-sm">
                    <p className="text-[13px] font-bold text-[#16191f]">No MFA devices assigned</p>
                    <p className="text-[12px] text-[#545b64] mt-1 mb-4">
                      You don't have any MFA devices assigned to this user. Protect this user's credentials by assigning an MFA device.
                    </p>
                    <button
                      onClick={handleOpenAssignMfa}
                      disabled={isPending}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
                    >
                      Assign MFA device
                    </button>
                  </div>
                ) : (
                  <div className="border border-[#eaeded] rounded-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13px]">
                      <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-4">Device name</th>
                          <th className="py-2.5 px-3">Device type</th>
                          <th className="py-2.5 px-3">Serial number</th>
                          <th className="py-2.5 px-3">Assigned date</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
                        {mfaDevices.map((dev) => {
                          const devName = dev.serialNumber.split("/").pop() || "MFA Device";
                          return (
                            <tr key={dev.serialNumber} className="hover:bg-[#fafafa]">
                              <td className="py-2.5 px-4 font-medium text-[#16191f]">{devName}</td>
                              <td className="py-2.5 px-3">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                                  Virtual authenticator app
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[12px] text-[#545b64]">{dev.serialNumber}</td>
                              <td className="py-2.5 px-3 text-[#545b64] text-[12px]">
                                {dev.enableDate ? new Date(dev.enableDate).toLocaleString() : "—"}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => handleRemoveMfa(dev.serialNumber)}
                                  disabled={isPending}
                                  className="text-[12px] font-bold text-[#d13212] hover:underline"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Access Keys Section */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eaeded]">
                  <div>
                    <h3 className="text-[14px] font-bold text-[#16191f]">
                      Access keys ({accessKeys.length})
                    </h3>
                    <p className="text-[12px] text-[#545b64]">
                      Use access keys to make programmatic requests to AWS using the CLI, SDKs, or APIs.
                    </p>
                  </div>
                  <button
                    onClick={handleCreateAccessKey}
                    disabled={isPending}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-3 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
                  >
                    Create access key
                  </button>
                </div>

                {accessKeys.length === 0 ? (
                  <div className="p-8 text-center bg-[#fafafa] border border-[#eaeded] rounded-sm">
                    <p className="text-[13px] font-bold text-[#16191f]">No access keys</p>
                    <p className="text-[12px] text-[#545b64] mt-1 mb-4">
                      You can create up to 2 access keys per IAM user.
                    </p>
                    <button
                      onClick={handleCreateAccessKey}
                      disabled={isPending}
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                      className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
                    >
                      Create access key
                    </button>
                  </div>
                ) : (
                  <div className="border border-[#eaeded] rounded-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13px]">
                      <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] text-[11px] font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-4">Access key ID</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Created</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
                        {accessKeys.map((ak) => (
                          <tr key={ak.accessKeyId} className="hover:bg-[#fafafa]">
                            <td className="py-2.5 px-4 font-mono font-medium text-[#16191f]">
                              {ak.accessKeyId}
                            </td>
                            <td className="py-2.5 px-3">
                              {ak.status === "Active" ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f2f3f3] text-[#545b64]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#879596]" />
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-[#545b64] text-[12px]">{ak.createDate}</td>
                            <td className="py-2.5 px-3 text-right space-x-3">
                              <button
                                onClick={() => handleToggleKeyStatus(ak.accessKeyId, ak.status)}
                                disabled={isPending}
                                className="text-[12px] font-bold text-[#0073bb] hover:underline"
                              >
                                {ak.status === "Active" ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() => handleDeleteAccessKey(ak.accessKeyId)}
                                disabled={isPending}
                                className="text-[12px] font-bold text-[#d13212] hover:underline"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
              <div>
                <div className="text-[12px] text-[#545b64] font-medium">User name</div>
                <div className="font-bold text-[#16191f] mt-1">{user.userName}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-medium">User ID</div>
                <div className="font-mono text-[#16191f] mt-1">{user.userId}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-medium">Creation time</div>
                <div className="text-[#16191f] mt-1">{user.createDate}</div>
              </div>
              <div>
                <div className="text-[12px] text-[#545b64] font-medium">Path</div>
                <div className="font-mono text-[#16191f] mt-1">/</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[12px] text-[#545b64] font-medium">ARN</div>
                <div className="font-mono text-[12px] text-[#16191f] mt-1 break-all">{user.arn}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attach Policy Modal */}
      {showAttachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">Attach policy to {user.userName}</h3>
              <button
                type="button"
                onClick={() => setShowAttachModal(false)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Select an IAM policy to attach:
              </label>
              <select
                value={selectedPolicyArn}
                onChange={(e) => setSelectedPolicyArn(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
              >
                <option value="">-- Choose a policy --</option>
                {allPolicies.map((p) => (
                  <option key={p.arn} value={p.arn}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowAttachModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAttach}
                disabled={!selectedPolicyArn || isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
              >
                {isPending ? "Attaching..." : "Attach policy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User to Groups Modal */}
      {showAddGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">Add {user.userName} to group</h3>
              <button
                type="button"
                onClick={() => setShowAddGroupModal(false)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Select an IAM user group:
              </label>
              {availableGroupsToAdd.length === 0 ? (
                <p className="text-[13px] text-[#545b64] p-3 bg-[#fafafa] border border-[#eaeded] rounded-sm">
                  User is already a member of all existing groups.
                </p>
              ) : (
                <select
                  value={selectedGroupToAdd}
                  onChange={(e) => setSelectedGroupToAdd(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white text-[#16191f]"
                >
                  <option value="">-- Choose a group --</option>
                  {availableGroupsToAdd.map((g) => (
                    <option key={g.groupName} value={g.groupName}>
                      {g.groupName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowAddGroupModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddUserToGroup}
                disabled={!selectedGroupToAdd || isPending}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
              >
                {isPending ? "Adding..." : "Add to group"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Newly Created Access Key Modal */}
      {createdKeyModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[17px] font-bold text-[#16191f]">Access key created successfully</h3>
              <button
                type="button"
                onClick={() => setCreatedKeyModalData(null)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-3 bg-[#fdf3f1] border border-[#d13212] rounded-sm text-[12px] text-[#d13212]">
              <strong>Important:</strong> This is the only time the secret access key can be viewed or copied. You cannot recover it later.
            </div>

            <div className="space-y-3 text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider mb-1">
                  Access key ID
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdKeyModalData.accessKeyId}
                    className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm font-mono text-[12px] bg-[#fafafa]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdKeyModalData.accessKeyId);
                    }}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[12px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-[#545b64] uppercase tracking-wider">
                    Secret access key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="text-[11px] font-bold text-[#0073bb] hover:underline"
                  >
                    {showSecretKey ? "Hide" : "Show"}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type={showSecretKey ? "text" : "password"}
                    readOnly
                    value={createdKeyModalData.secretAccessKey}
                    className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm font-mono text-[12px] bg-[#fafafa]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdKeyModalData.secretAccessKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[12px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
                  >
                    {copiedKey ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setCreatedKeyModalData(null)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Policy Modal */}
      {inspectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-[#eaeded] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-[17px] font-bold text-[#16191f]">{inspectedPolicy.name}</h3>
                <p className="text-[11px] font-mono text-[#545b64] mt-0.5">{inspectedPolicy.arn}</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedPolicy(null)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-[#16191f]">
              <pre className="text-[12px] font-mono text-[#59cbe8] whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(inspectedPolicy.document, null, 2)}
              </pre>
            </div>

            <div className="p-4 border-t border-[#eaeded] flex items-center justify-end flex-shrink-0 bg-[#fafafa]">
              <button
                type="button"
                onClick={() => setInspectedPolicy(null)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign MFA Device Modal */}
      {showAssignMfaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-[#d5dbdb] shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-[#eaeded] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-[17px] font-bold text-[#16191f]">
                  Assign MFA device
                </h3>
                <p className="text-[12px] text-[#545b64] mt-0.5">
                  Configure multi-factor authentication for user {user.userName}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignMfaModal(false)}
                className="text-[#545b64] hover:text-[#16191f]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-[13px]">
              {mfaModalError && (
                <div className="p-3 bg-[#fdf3f1] border border-[#d13212] text-[#d13212] rounded-sm text-[12px]">
                  {mfaModalError}
                </div>
              )}

              {mfaStep === 1 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                      Device name
                    </label>
                    <input
                      type="text"
                      value={mfaDeviceName}
                      onChange={(e) => setMfaDeviceName(e.target.value)}
                      placeholder="e.g. authenticator-app"
                      className="w-full h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[13px] text-[#16191f] focus:outline-none focus:border-[#0073bb]"
                    />
                    <p className="text-[11px] text-[#545b64] mt-1">
                      Allowed characters are letters, numbers, and hyphens.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#16191f] mb-2">
                      MFA device type
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 p-3 border border-[#0073bb] bg-[#f2f8fd] rounded-sm cursor-pointer">
                        <input
                          type="radio"
                          name="mfaType"
                          checked
                          readOnly
                          className="mt-0.5 text-[#0073bb]"
                        />
                        <div>
                          <div className="font-bold text-[#16191f]">Authenticator app</div>
                          <div className="text-[12px] text-[#545b64]">
                            Use an installed app on your mobile device (e.g. Google Authenticator, Microsoft Authenticator, 1Password, Authy).
                          </div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 p-3 border border-[#eaeded] bg-[#fafafa] rounded-sm opacity-60 cursor-not-allowed">
                        <input
                          type="radio"
                          name="mfaType"
                          disabled
                          className="mt-0.5"
                        />
                        <div>
                          <div className="font-bold text-[#16191f]">FIDO2 security key</div>
                          <div className="text-[12px] text-[#545b64]">
                            YubiKey or other WebAuthn security key (requires browser WebAuthn API).
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded-sm">
                    <div className="text-[11px] font-bold text-[#545b64] uppercase mb-1">
                      Device serial
                    </div>
                    <div className="font-mono text-[12px] text-[#16191f] break-all">
                      {createdDeviceSerial}
                    </div>
                  </div>

                  <div>
                    <div className="text-[12px] font-bold text-[#16191f] mb-1">
                      Step 1: Set up device with secret key
                    </div>
                    <p className="text-[12px] text-[#545b64] mb-2">
                      Enter the secret key into your authenticator app (TOTP RFC 6238):
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={createdBase32Seed}
                        className="flex-1 font-mono text-[13px] bg-[#f2f3f3] border border-[#d5dbdb] px-3 py-1.5 rounded-sm select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(createdBase32Seed);
                          setCopiedSeed(true);
                          setTimeout(() => setCopiedSeed(false), 2000);
                        }}
                        style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                        className="h-[32px] px-3 border border-[#aab7b8] rounded-sm text-[12px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3]"
                      >
                        {copiedSeed ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {sampleCode1 && sampleCode2 && (
                    <div className="p-3 bg-[#f2f8fd] border border-[#0073bb] rounded-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#0073bb] text-[12px]">
                          Emulator TOTP Test Helper
                        </span>
                        <button
                          type="button"
                          onClick={handleAutofillCodes}
                          className="text-[11px] font-bold text-[#ec7211] hover:underline"
                        >
                          Autofill Codes
                        </button>
                      </div>
                      <p className="text-[11px] text-[#545b64]">
                        Valid codes generated from emulator seed: <span className="font-mono font-bold text-[#16191f]">{sampleCode1}</span> and <span className="font-mono font-bold text-[#16191f]">{sampleCode2}</span>
                      </p>
                    </div>
                  )}

                  <div>
                    <div className="text-[12px] font-bold text-[#16191f] mb-1">
                      Step 2: Enter two consecutive 6-digit codes
                    </div>
                    <p className="text-[12px] text-[#545b64] mb-2">
                      Type two consecutive authentication codes from your authenticator app:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-[#545b64] mb-0.5">
                          MFA code 1
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={authCode1}
                          onChange={(e) => setAuthCode1(e.target.value)}
                          placeholder="123456"
                          className="w-full h-[32px] px-3 font-mono text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] focus:outline-none focus:border-[#0073bb]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#545b64] mb-0.5">
                          MFA code 2
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={authCode2}
                          onChange={(e) => setAuthCode2(e.target.value)}
                          placeholder="654321"
                          className="w-full h-[32px] px-3 font-mono text-[13px] border border-[#aab7b8] rounded-sm text-[#16191f] focus:outline-none focus:border-[#0073bb]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#eaeded] flex items-center justify-end gap-2 flex-shrink-0 bg-[#fafafa]">
              <button
                type="button"
                onClick={() => setShowAssignMfaModal(false)}
                disabled={isPending || isCreatingDevice}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="h-[32px] px-4 border border-[#aab7b8] rounded-sm text-[13px] font-bold text-[#16191f] bg-white hover:bg-[#f2f3f3] whitespace-nowrap inline-flex items-center justify-center transition-colors"
              >
                Cancel
              </button>

              {mfaStep === 1 ? (
                <button
                  type="button"
                  onClick={handleProceedToMfaSetup}
                  disabled={isCreatingDevice || !mfaDeviceName.trim()}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
                >
                  {isCreatingDevice ? "Setting up..." : "Next"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmAssignMfa}
                  disabled={isPending || !authCode1.trim() || !authCode2.trim()}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] whitespace-nowrap inline-flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
                >
                  {isPending ? "Assigning..." : "Assign MFA"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
