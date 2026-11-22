"use client";

import { useState, useEffect } from "react";
import {
  sendTestEmailAction,
  listIdentitiesAction,
  listConfigurationSetsAction,
} from "../actions";

interface SendTestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFrom?: string;
  defaultSubject?: string;
  defaultBodyHtml?: string;
  defaultBodyText?: string;
}

export default function SendTestEmailModal({
  isOpen,
  onClose,
  defaultFrom = "",
  defaultSubject = "",
  defaultBodyHtml = "",
  defaultBodyText = "",
}: SendTestEmailModalProps) {
  const [emailFormat, setEmailFormat] = useState<"formatted" | "raw">("formatted");
  const [fromAddress, setFromAddress] = useState(defaultFrom);
  const [scenario, setScenario] = useState<"custom" | "success" | "bounce" | "complaint">("custom");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState(defaultSubject || "Amazon SES Test Email");
  const [bodyText, setBodyText] = useState(defaultBodyText || "This is a test email sent from Amazon Simple Email Service (SES).");
  const [bodyHtml, setBodyHtml] = useState(defaultBodyHtml);
  const [selectedConfigSet, setSelectedConfigSet] = useState("");

  const [verifiedIdentities, setVerifiedIdentities] = useState<string[]>([]);
  const [configSets, setConfigSets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessageId, setSentMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSentMessageId(null);
      if (defaultFrom) setFromAddress(defaultFrom);
      if (defaultSubject) setSubject(defaultSubject);
      if (defaultBodyHtml) setBodyHtml(defaultBodyHtml);
      if (defaultBodyText) setBodyText(defaultBodyText);

      // Load verified identities and config sets for dropdowns
      listIdentitiesAction().then((res) => {
        if (res.success) {
          const ids = res.identities.map((i) => i.identity);
          setVerifiedIdentities(ids);
          if (!defaultFrom && ids.length > 0) {
            setFromAddress(ids[0]);
          }
        }
      });
      listConfigurationSetsAction().then((res) => {
        if (res.success) {
          setConfigSets(res.configurationSets.map((c) => c.name));
        }
      });
    }
  }, [isOpen, defaultFrom, defaultSubject, defaultBodyHtml, defaultBodyText]);

  // Adjust recipient based on mailbox simulator scenario
  const handleScenarioChange = (newScenario: "custom" | "success" | "bounce" | "complaint") => {
    setScenario(newScenario);
    if (newScenario === "success") {
      setRecipient("success@simulator.amazonses.com");
    } else if (newScenario === "bounce") {
      setRecipient("bounce@simulator.amazonses.com");
    } else if (newScenario === "complaint") {
      setRecipient("complaint@simulator.amazonses.com");
    }
  };

  const handleSend = async () => {
    if (!fromAddress.trim()) {
      setError("Please specify or select a From-email address.");
      return;
    }
    if (!recipient.trim()) {
      setError("Please specify at least one recipient email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setSentMessageId(null);

    const res = await sendTestEmailAction({
      from: fromAddress.trim(),
      to: recipient.split(",").map((r) => r.trim()).filter(Boolean),
      subject: subject.trim(),
      bodyType: emailFormat,
      bodyText: bodyText.trim() || undefined,
      bodyHtml: bodyHtml.trim() || undefined,
      configurationSetName: selectedConfigSet || undefined,
    });

    setLoading(false);
    if (res.success && res.messageId) {
      setSentMessageId(res.messageId);
    } else {
      setError(res.error || "Failed to send test email.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-md shadow-2xl border border-[#d5dbdb] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between bg-[#fafafa]">
          <div>
            <h3 className="text-[16px] font-semibold text-[#16191f]">Send test email</h3>
            <p className="text-[12px] text-[#545b64]">
              Simulate or send a live test message to verify delivery, SPF/DKIM authentication, and bounce tracking.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold p-1"
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-[13px] text-[#16191f]">
          {error && (
            <div className="p-3 bg-[#fdf2f2] border-l-4 border-l-[#d13212] rounded text-[13px] text-[#d13212]">
              {error}
            </div>
          )}

          {sentMessageId && (
            <div className="p-4 bg-[#f2f8fd] border border-[#a4cbf5] rounded text-[13px] space-y-2">
              <div className="font-semibold text-[#0972d3] flex items-center gap-1.5">
                <span>Message successfully submitted to Amazon SES</span>
              </div>
              <p className="text-[#545b64] text-[12px]">
                The email was accepted for processing. SES generated the following Message ID:
              </p>
              <div className="font-mono text-[11px] bg-white p-2 rounded border border-[#d5dbdb] break-all select-all">
                {sentMessageId}
              </div>
            </div>
          )}

          {/* Email Format */}
          <div>
            <label className="block font-semibold mb-1">Email format</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                <input
                  type="radio"
                  name="format"
                  checked={emailFormat === "formatted"}
                  onChange={() => setEmailFormat("formatted")}
                  className="accent-[#ec7211]"
                />
                Formatted
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                <input
                  type="radio"
                  name="format"
                  checked={emailFormat === "raw"}
                  onChange={() => setEmailFormat("raw")}
                  className="accent-[#ec7211]"
                />
                Raw
              </label>
            </div>
          </div>

          {/* From Address */}
          <div>
            <label className="block font-semibold mb-1">
              From-email address <span className="text-[#d13212]">*</span>
            </label>
            {verifiedIdentities.length > 0 ? (
              <div className="space-y-1">
                <select
                  value={fromAddress}
                  onChange={(e) => setFromAddress(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px] bg-white"
                >
                  {verifiedIdentities.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                  <option value="custom">-- Enter custom sender address --</option>
                </select>
                {fromAddress === "custom" && (
                  <input
                    type="email"
                    placeholder="e.g. sender@example.com"
                    onChange={(e) => setFromAddress(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px] mt-2"
                  />
                )}
              </div>
            ) : (
              <input
                type="email"
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
                placeholder="e.g. sender@example.com"
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px]"
              />
            )}
            <p className="text-[11px] text-[#545b64] mt-1">
              Must be a verified email address or from a verified domain in Amazon SES.
            </p>
          </div>

          {/* Scenario */}
          <div>
            <label className="block font-semibold mb-1">Scenario</label>
            <select
              value={scenario}
              onChange={(e) => handleScenarioChange(e.target.value as any)}
              className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px] bg-white"
            >
              <option value="custom">Custom (Specify recipient email)</option>
              <option value="success">Successful delivery (Mailbox Simulator)</option>
              <option value="bounce">Hard bounce (Mailbox Simulator)</option>
              <option value="complaint">Complaint (Mailbox Simulator)</option>
            </select>
          </div>

          {/* Recipient */}
          <div>
            <label className="block font-semibold mb-1">
              Recipient email address <span className="text-[#d13212]">*</span>
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. recipient@example.com (comma-separated for multiple)"
              className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px]"
            />
          </div>

          {/* Configuration Set */}
          {configSets.length > 0 && (
            <div>
              <label className="block font-semibold mb-1">Configuration set (optional)</label>
              <select
                value={selectedConfigSet}
                onChange={(e) => setSelectedConfigSet(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px] bg-white"
              >
                <option value="">No configuration set</option>
                {configSets.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block font-semibold mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px]"
            />
          </div>

          {/* Body Content */}
          <div>
            <label className="block font-semibold mb-1">Plain text body</label>
            <textarea
              rows={3}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full px-3 py-2 border border-[#aab7b8] rounded text-[13px] font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">HTML body (optional)</label>
            <textarea
              rows={3}
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              placeholder="e.g. <h1>Hello</h1><p>Welcome to SES!</p>"
              className="w-full px-3 py-2 border border-[#aab7b8] rounded text-[13px] font-mono text-[12px]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#eaeded] bg-[#fafafa] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 text-[13px] font-medium text-[#16191f] border border-[#aab7b8] rounded hover:bg-[#eaeded] transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] disabled:opacity-50 rounded transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            {loading ? "Sending..." : "Send test email"}
          </button>
        </div>
      </div>
    </div>
  );
}
