"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SESIdentityDetails,
  deleteIdentityAction,
  setIdentityNotificationTopicAction,
  setIdentityFeedbackForwardingAction,
  setIdentityHeadersInNotificationsAction,
  setIdentityMailFromDomainAction,
  putIdentityPolicyAction,
  deleteIdentityPolicyAction,
} from "../../actions";
import SendTestEmailModal from "../../components/SendTestEmailModal";

interface IdentityDetailClientProps {
  initialDetails: SESIdentityDetails;
  availableSnsTopics: { name: string; arn: string }[];
}

export default function IdentityDetailClient({
  initialDetails,
  availableSnsTopics,
}: IdentityDetailClientProps) {
  const router = useRouter();
  const [details, setDetails] = useState<SESIdentityDetails>(initialDetails);
  const [activeTab, setActiveTab] = useState<
    "overview" | "auth" | "notifications" | "configSets" | "policies"
  >("overview");

  // Modals & form state
  const [isTestEmailOpen, setIsTestEmailOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit Notifications Modal
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [bounceTopic, setBounceTopic] = useState(details.bounceTopic || "");
  const [complaintTopic, setComplaintTopic] = useState(details.complaintTopic || "");
  const [deliveryTopic, setDeliveryTopic] = useState(details.deliveryTopic || "");
  const [feedbackForwarding, setFeedbackForwarding] = useState(details.feedbackForwardingEnabled);
  const [headersInBounce, setHeadersInBounce] = useState(details.headersInBounceEnabled);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  // Edit MAIL FROM Modal
  const [isMailFromModalOpen, setIsMailFromModalOpen] = useState(false);
  const [mailFromDomain, setMailFromDomain] = useState(details.mailFromDomain || "");
  const [mxBehavior, setMxBehavior] = useState<"UseDefaultValue" | "RejectMessage">(
    (details.behaviorOnMXFailure as any) || "UseDefaultValue"
  );
  const [mailFromLoading, setMailFromLoading] = useState(false);

  // Policy Modal
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyName, setPolicyName] = useState("");
  const [policyDoc, setPolicyDoc] = useState(
    JSON.stringify(
      {
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "AllowSendEmail",
            Effect: "Allow",
            Principal: { AWS: "*" },
            Action: ["ses:SendEmail", "ses:SendRawEmail"],
            Resource: `arn:aws:ses:us-east-1:000000000000:identity/${details.identity}`,
          },
        ],
      },
      null,
      2
    )
  );
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);

  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const isVerified = details.verificationStatus === "Success";

  const handleDeleteIdentity = async () => {
    if (deleteConfirmText.toLowerCase() !== "delete") return;
    setDeleteLoading(true);
    const res = await deleteIdentityAction(details.identity);
    setDeleteLoading(false);
    if (res.success) {
      router.push("/ses/identities");
    }
  };

  const handleSaveNotifications = async () => {
    setNotifLoading(true);
    setNotifError(null);

    await Promise.all([
      setIdentityNotificationTopicAction({
        identity: details.identity,
        notificationType: "Bounce",
        snsTopicArn: bounceTopic,
      }),
      setIdentityNotificationTopicAction({
        identity: details.identity,
        notificationType: "Complaint",
        snsTopicArn: complaintTopic,
      }),
      setIdentityNotificationTopicAction({
        identity: details.identity,
        notificationType: "Delivery",
        snsTopicArn: deliveryTopic,
      }),
      setIdentityFeedbackForwardingAction(details.identity, feedbackForwarding),
      setIdentityHeadersInNotificationsAction({
        identity: details.identity,
        notificationType: "Bounce",
        enabled: headersInBounce,
      }),
    ]);

    setDetails((prev) => ({
      ...prev,
      bounceTopic,
      complaintTopic,
      deliveryTopic,
      feedbackForwardingEnabled: feedbackForwarding,
      headersInBounceEnabled: headersInBounce,
    }));

    setNotifLoading(false);
    setIsNotifModalOpen(false);
  };

  const handleSaveMailFrom = async () => {
    setMailFromLoading(true);
    await setIdentityMailFromDomainAction({
      identity: details.identity,
      mailFromDomain: mailFromDomain.trim() || undefined,
      behaviorOnMXFailure: mxBehavior,
    });
    setDetails((prev) => ({
      ...prev,
      mailFromDomain: mailFromDomain.trim() || undefined,
      behaviorOnMXFailure: mxBehavior,
    }));
    setMailFromLoading(false);
    setIsMailFromModalOpen(false);
  };

  const handleSavePolicy = async () => {
    if (!policyName.trim()) {
      setPolicyError("Policy name is required.");
      return;
    }
    setPolicyLoading(true);
    setPolicyError(null);

    const res = await putIdentityPolicyAction({
      identity: details.identity,
      policyName: policyName.trim(),
      policyDocument: policyDoc,
    });

    setPolicyLoading(false);
    if (res.success) {
      setDetails((prev) => ({
        ...prev,
        policies: [
          ...prev.policies.filter((p) => p.name !== policyName.trim()),
          { name: policyName.trim(), document: policyDoc },
        ],
      }));
      setIsPolicyModalOpen(false);
      setPolicyName("");
    } else {
      setPolicyError(res.error || "Failed to save policy.");
    }
  };

  const handleDeletePolicy = async (name: string) => {
    await deleteIdentityPolicyAction(details.identity, name);
    setDetails((prev) => ({
      ...prev,
      policies: prev.policies.filter((p) => p.name !== name),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <div className="text-[12px] text-[#545b64] mb-1">
          <Link href="/ses/identities" className="hover:underline">
            Verified identities
          </Link>{" "}
          &gt; <span className="text-[#16191f] font-medium">{details.identity}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f] break-all">
              {details.identity}
            </h1>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                isVerified
                  ? "bg-[#e7f4e4] text-[#1d8102] border-[#a2dca0]"
                  : "bg-[#fff7e6] text-[#b35900] border-[#ffcc80]"
              }`}
            >
              {isVerified ? "Verified" : "Pending"}
            </span>
            <span className="text-[12px] text-[#545b64] px-2 py-0.5 rounded bg-[#f2f3f3] border border-[#d5dbdb]">
              {details.type === "EmailAddress" ? "Email address" : "Domain"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTestEmailOpen(true)}
              className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Send test email
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3 text-[13px] font-medium text-[#d13212] bg-white border border-[#d13212] rounded hover:bg-[#fdf2f2]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#eaeded] flex gap-6 text-[13px]">
        {[
          { key: "overview", label: "Overview & verification" },
          { key: "auth", label: "Authentication (DKIM & MAIL FROM)" },
          { key: "notifications", label: "Notification topics (SNS)" },
          { key: "configSets", label: "Configuration sets" },
          { key: "policies", label: `Identity policies (${details.policies.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-2.5 font-medium transition-colors relative ${
              activeTab === tab.key
                ? "text-[#ec7211] border-b-2 border-b-[#ec7211]"
                : "text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="p-5 bg-white border border-[#eaeded] rounded-md shadow-sm space-y-4">
            <h2 className="text-[15px] font-bold text-[#16191f]">Identity status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-[13px]">
              <div>
                <span className="text-[11px] text-[#545b64] uppercase font-semibold block">
                  Identity ARN
                </span>
                <span className="font-mono text-[12px] break-all">
                  arn:aws:ses:us-east-1:000000000000:identity/{details.identity}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#545b64] uppercase font-semibold block">
                  Identity type
                </span>
                <span>{details.type === "EmailAddress" ? "Email address" : "Domain"}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#545b64] uppercase font-semibold block">
                  Verification status
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold mt-0.5 border ${
                    isVerified
                      ? "bg-[#e7f4e4] text-[#1d8102] border-[#a2dca0]"
                      : "bg-[#fff7e6] text-[#b35900] border-[#ffcc80]"
                  }`}
                >
                  {isVerified ? "Verified" : "Pending verification"}
                </span>
              </div>
            </div>

            {details.type === "Domain" && details.verificationToken && (
              <div className="mt-4 p-4 bg-[#fafafa] border border-[#eaeded] rounded space-y-2">
                <span className="text-[12px] font-semibold text-[#16191f]">
                  Domain verification TXT record:
                </span>
                <p className="text-[12px] text-[#545b64]">
                  Add a TXT record with the following name and value to verify domain ownership:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[12px] font-mono">
                  <div className="p-2 bg-white rounded border border-[#d5dbdb]">
                    <span className="text-[10px] text-[#545b64] block font-sans">Record Name:</span>
                    _amazonses.{details.identity}
                  </div>
                  <div className="p-2 bg-white rounded border border-[#d5dbdb] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#545b64] block font-sans">Record Value:</span>
                      {details.verificationToken}
                    </div>
                    <button
                      onClick={() => handleCopy(details.verificationToken!, "token")}
                      className="px-2 py-1 text-[11px] bg-[#f2f3f3] hover:bg-[#eaeded] rounded border border-[#d5dbdb]"
                    >
                      {copiedItem === "token" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Authentication Tab */}
      {activeTab === "auth" && (
        <div className="space-y-6">
          {/* Easy DKIM Card */}
          <div className="p-5 bg-white border border-[#eaeded] rounded-md shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-bold text-[#16191f]">Easy DKIM</h2>
                <p className="text-[12px] text-[#545b64]">
                  DKIM signs outbound messages with a private key. Publish the following CNAME records in your DNS provider.
                </p>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                  details.dkimEnabled
                    ? "bg-[#e7f4e4] text-[#1d8102] border-[#a2dca0]"
                    : "bg-[#f2f3f3] text-[#545b64] border-[#d5dbdb]"
                }`}
              >
                {details.dkimEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            {details.type === "Domain" && details.dkimTokens.length > 0 && (
              <div className="border border-[#eaeded] rounded overflow-hidden">
                <table className="w-full text-left text-[12px] border-collapse">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64]">
                      <th className="p-2.5 font-semibold">Name (Host)</th>
                      <th className="p-2.5 font-semibold w-24">Type</th>
                      <th className="p-2.5 font-semibold">Value (Target)</th>
                      <th className="p-2.5 font-semibold w-20 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.dkimTokens.map((token, idx) => {
                      const cnameName = `${token}._domainkey.${details.identity}`;
                      const cnameValue = `${token}.dkim.amazonses.com`;
                      return (
                        <tr key={token} className="border-b border-[#eaeded]">
                          <td className="p-2.5 font-mono text-[11px] text-[#16191f]">
                            {cnameName}
                          </td>
                          <td className="p-2.5 font-semibold text-[#545b64]">CNAME</td>
                          <td className="p-2.5 font-mono text-[11px] text-[#16191f]">
                            {cnameValue}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => handleCopy(`${cnameName} CNAME ${cnameValue}`, `dkim-${idx}`)}
                              className="px-2 py-1 text-[11px] text-[#0972d3] hover:underline"
                            >
                              {copiedItem === `dkim-${idx}` ? "Copied" : "Copy"}
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

          {/* Custom MAIL FROM Domain Card */}
          <div className="p-5 bg-white border border-[#eaeded] rounded-md shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-bold text-[#16191f]">Custom MAIL FROM domain</h2>
                <p className="text-[12px] text-[#545b64]">
                  Use a subdomain of your sending domain as the MAIL FROM address for SPF alignment.
                </p>
              </div>
              <button
                onClick={() => setIsMailFromModalOpen(true)}
                className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Edit MAIL FROM domain
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px]">
              <div>
                <span className="text-[11px] text-[#545b64] uppercase font-semibold block">
                  Domain
                </span>
                <span className="font-mono text-[12px]">
                  {details.mailFromDomain || "Default (amazonses.com)"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#545b64] uppercase font-semibold block">
                  Status
                </span>
                <span>{details.mailFromDomain ? "Configured" : "Not configured"}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#545b64] uppercase font-semibold block">
                  Behavior on MX failure
                </span>
                <span>
                  {details.behaviorOnMXFailure === "RejectMessage"
                    ? "Reject message"
                    : "Use default MAIL FROM domain"}
                </span>
              </div>
            </div>

            {details.mailFromDomain && (
              <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded text-[12px] space-y-2">
                <span className="font-semibold text-[#16191f]">Required DNS records:</span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="p-2 bg-white rounded border border-[#d5dbdb]">
                    <strong>MX Record:</strong> {details.mailFromDomain} &rarr; 10 feedback-smtp.us-east-1.amazonses.com
                  </div>
                  <div className="p-2 bg-white rounded border border-[#d5dbdb]">
                    <strong>SPF (TXT) Record:</strong> {details.mailFromDomain} &rarr; &quot;v=spf1 include:amazonses.com ~all&quot;
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Notification Topics (SNS) Tab */}
      {activeTab === "notifications" && (
        <div className="p-5 bg-white border border-[#eaeded] rounded-md shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[#16191f]">Notification topics (Amazon SNS)</h2>
              <p className="text-[12px] text-[#545b64]">
                Publish bounce, complaint, and delivery events to Amazon SNS topics for automated subscriber management.
              </p>
            </div>
            <button
              onClick={() => setIsNotifModalOpen(true)}
              className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa]"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Edit notification topics
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
            <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded">
              <span className="text-[11px] text-[#545b64] uppercase font-semibold block">
                Bounce notification topic
              </span>
              <span className="font-mono text-[12px] break-all mt-1 block">
                {details.bounceTopic || "None configured"}
              </span>
            </div>
            <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded">
              <span className="text-[11px] text-[#545b64] uppercase font-semibold block">
                Complaint notification topic
              </span>
              <span className="font-mono text-[12px] break-all mt-1 block">
                {details.complaintTopic || "None configured"}
              </span>
            </div>
            <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded">
              <span className="text-[11px] text-[#545b64] uppercase font-semibold block">
                Delivery notification topic
              </span>
              <span className="font-mono text-[12px] break-all mt-1 block">
                {details.deliveryTopic || "None configured"}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#eaeded] grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
            <div>
              <span className="font-semibold text-[#16191f]">Email feedback forwarding:</span>{" "}
              <span className={details.feedbackForwardingEnabled ? "text-[#1d8102]" : "text-[#545b64]"}>
                {details.feedbackForwardingEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div>
              <span className="font-semibold text-[#16191f]">Headers in bounce notifications:</span>{" "}
              <span className={details.headersInBounceEnabled ? "text-[#1d8102]" : "text-[#545b64]"}>
                {details.headersInBounceEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Configuration Sets Tab */}
      {activeTab === "configSets" && (
        <div className="p-5 bg-white border border-[#eaeded] rounded-md shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[#16191f]">Default configuration set</h2>
              <p className="text-[12px] text-[#545b64]">
                Automatically apply a configuration set to all emails sent from this identity.
              </p>
            </div>
          </div>
          <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded text-[13px] text-[#545b64]">
            No default configuration set is currently associated with this identity.
          </div>
        </div>
      )}

      {/* 5. Identity Policies Tab */}
      {activeTab === "policies" && (
        <div className="p-5 bg-white border border-[#eaeded] rounded-md shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[#16191f]">Identity policies</h2>
              <p className="text-[12px] text-[#545b64]">
                Grant or restrict other AWS accounts and IAM principals permission to send emails using this identity.
              </p>
            </div>
            <button
              onClick={() => {
                setPolicyError(null);
                setPolicyName("");
                setIsPolicyModalOpen(true);
              }}
              className="px-3 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Create policy
            </button>
          </div>

          {details.policies.length === 0 ? (
            <div className="p-4 bg-[#fafafa] border border-[#eaeded] rounded text-[13px] text-[#545b64]">
              No identity policies defined. By default, only your AWS account can send emails using this identity.
            </div>
          ) : (
            <div className="space-y-3">
              {details.policies.map((p) => (
                <div key={p.name} className="border border-[#eaeded] rounded overflow-hidden">
                  <div className="px-4 py-2 bg-[#fafafa] border-b border-[#eaeded] flex items-center justify-between">
                    <span className="font-semibold text-[13px] text-[#16191f]">{p.name}</span>
                    <button
                      onClick={() => handleDeletePolicy(p.name)}
                      className="text-[12px] text-[#d13212] hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                  <pre className="p-3 bg-[#fdfdfd] text-[11px] font-mono text-[#16191f] overflow-x-auto">
                    {p.document}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Send Test Email Modal */}
      <SendTestEmailModal
        isOpen={isTestEmailOpen}
        onClose={() => setIsTestEmailOpen(false)}
        defaultFrom={details.identity}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-md shadow-2xl border border-[#d5dbdb] w-full max-w-md p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f]">
              Delete identity: {details.identity}?
            </h3>
            <p className="text-[13px] text-[#545b64]">
              This will remove the identity from your Amazon SES account. Any pending emails or automated sending from this identity will fail.
            </p>
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#16191f]">
                To confirm, type <span className="font-bold text-[#d13212]">delete</span>:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 text-[13px] font-medium text-[#16191f] border border-[#aab7b8] rounded hover:bg-[#eaeded]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteIdentity}
                disabled={deleteLoading || deleteConfirmText.toLowerCase() !== "delete"}
                className="px-4 text-[13px] font-semibold text-white bg-[#d13212] hover:bg-[#ba2d0f] disabled:opacity-50 rounded"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Notification Topics Modal */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-md shadow-2xl border border-[#d5dbdb] w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
              <h3 className="text-[16px] font-bold text-[#16191f]">Edit notification topics</h3>
              <button
                onClick={() => setIsNotifModalOpen(false)}
                className="text-[#545b64] text-[18px] font-bold p-1"
              >
                ×
              </button>
            </div>

            {notifError && (
              <div className="p-2 bg-[#fdf2f2] border-l-4 border-l-[#d13212] text-[#d13212] text-[12px] rounded">
                {notifError}
              </div>
            )}

            <div className="space-y-3 text-[13px]">
              <div>
                <label className="block font-semibold mb-1">Bounce notification SNS topic</label>
                <select
                  value={bounceTopic}
                  onChange={(e) => setBounceTopic(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded bg-white text-[13px]"
                >
                  <option value="">No topic</option>
                  {availableSnsTopics.map((t) => (
                    <option key={t.arn} value={t.arn}>
                      {t.name} ({t.arn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Complaint notification SNS topic</label>
                <select
                  value={complaintTopic}
                  onChange={(e) => setComplaintTopic(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded bg-white text-[13px]"
                >
                  <option value="">No topic</option>
                  {availableSnsTopics.map((t) => (
                    <option key={t.arn} value={t.arn}>
                      {t.name} ({t.arn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Delivery notification SNS topic</label>
                <select
                  value={deliveryTopic}
                  onChange={(e) => setDeliveryTopic(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded bg-white text-[13px]"
                >
                  <option value="">No topic</option>
                  {availableSnsTopics.map((t) => (
                    <option key={t.arn} value={t.arn}>
                      {t.name} ({t.arn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-[#eaeded] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feedbackForwarding}
                    onChange={(e) => setFeedbackForwarding(e.target.checked)}
                    className="accent-[#ec7211]"
                  />
                  <span>Email feedback forwarding enabled</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={headersInBounce}
                    onChange={(e) => setHeadersInBounce(e.target.checked)}
                    className="accent-[#ec7211]"
                  />
                  <span>Include original email headers in bounce notifications</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setIsNotifModalOpen(false)}
                className="px-4 text-[13px] font-medium text-[#16191f] border border-[#aab7b8] rounded hover:bg-[#eaeded]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotifications}
                disabled={notifLoading}
                className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {notifLoading ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit MAIL FROM Modal */}
      {isMailFromModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-md shadow-2xl border border-[#d5dbdb] w-full max-w-md p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f]">Edit custom MAIL FROM domain</h3>
            <div className="space-y-3 text-[13px]">
              <div>
                <label className="block font-semibold mb-1">MAIL FROM domain</label>
                <input
                  type="text"
                  value={mailFromDomain}
                  onChange={(e) => setMailFromDomain(e.target.value)}
                  placeholder={`e.g. mail.${details.identity}`}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Behavior on MX failure</label>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="modalMx"
                      checked={mxBehavior === "UseDefaultValue"}
                      onChange={() => setMxBehavior("UseDefaultValue")}
                      className="accent-[#ec7211]"
                    />
                    <span>Use default MAIL FROM domain</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="modalMx"
                      checked={mxBehavior === "RejectMessage"}
                      onChange={() => setMxBehavior("RejectMessage")}
                      className="accent-[#ec7211]"
                    />
                    <span>Reject message</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setIsMailFromModalOpen(false)}
                className="px-4 text-[13px] font-medium text-[#16191f] border border-[#aab7b8] rounded hover:bg-[#eaeded]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMailFrom}
                disabled={mailFromLoading}
                className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {mailFromLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Identity Policy Modal */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-md shadow-2xl border border-[#d5dbdb] w-full max-w-xl p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f]">Create identity policy</h3>
            {policyError && (
              <div className="p-2 bg-[#fdf2f2] border-l-4 border-l-[#d13212] text-[#d13212] text-[12px] rounded">
                {policyError}
              </div>
            )}
            <div className="space-y-3 text-[13px]">
              <div>
                <label className="block font-semibold mb-1">Policy name</label>
                <input
                  type="text"
                  value={policyName}
                  onChange={(e) => setPolicyName(e.target.value)}
                  placeholder="e.g. DelegateSendingPolicy"
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Policy document (JSON)</label>
                <textarea
                  rows={8}
                  value={policyDoc}
                  onChange={(e) => setPolicyDoc(e.target.value)}
                  className="w-full px-3 py-2 border border-[#aab7b8] rounded text-[12px] font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setIsPolicyModalOpen(false)}
                className="px-4 text-[13px] font-medium text-[#16191f] border border-[#aab7b8] rounded hover:bg-[#eaeded]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePolicy}
                disabled={policyLoading}
                className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {policyLoading ? "Saving..." : "Create policy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
