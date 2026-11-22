"use client";

import { useState } from "react";
import { createSmtpCredentialsAction } from "../actions";

interface SmtpSettings {
  serverName: string;
  publicServerName: string;
  ports: number[];
  tls: string;
  authentication: string;
}

export default function SmtpClient({ settings }: { settings: SmtpSettings }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userName, setUserName] = useState(`ses-smtp-user.${Date.now()}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generated credentials
  const [credentials, setCredentials] = useState<{
    iamUserName: string;
    smtpUsername: string;
    smtpPassword: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateCredentials = async () => {
    setLoading(true);
    setError(null);

    const res = await createSmtpCredentialsAction(userName);
    setLoading(false);

    if (res.success && res.smtpUsername && res.smtpPassword && res.iamUserName) {
      setCredentials({
        iamUserName: res.iamUserName,
        smtpUsername: res.smtpUsername,
        smtpPassword: res.smtpPassword,
      });
    } else {
      setError(res.error || "Failed to create SMTP credentials.");
    }
  };

  const handleDownloadCsv = () => {
    if (!credentials) return;
    const content = `IAM User Name,SMTP Username,SMTP Password\n"${credentials.iamUserName}","${credentials.smtpUsername}","${credentials.smtpPassword}"`;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ses-smtp-credentials-${credentials.iamUserName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-[22px] font-bold text-[#16191f]">SMTP settings</h1>
        <p className="text-[13px] text-[#545b64]">
          Connect your applications to Amazon SES using standard SMTP interface credentials.
        </p>
      </div>

      {/* SMTP Endpoint Configuration Card */}
      <div className="p-5 bg-white border border-[#eaeded] rounded-md shadow-sm space-y-4">
        <h2 className="text-[15px] font-bold text-[#16191f]">SMTP endpoint configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
          <div>
            <span className="text-[11px] text-[#545b64] uppercase font-semibold block">
              Server name (Local Emulator)
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[12px] bg-[#fafafa] px-2 py-1 rounded border border-[#eaeded]">
                {settings.serverName}
              </span>
              <button
                onClick={() => handleCopy(settings.serverName, "srv-local")}
                className="text-[11px] text-[#0972d3] hover:underline"
              >
                {copiedKey === "srv-local" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-[#545b64] uppercase font-semibold block">
              Server name (Real AWS Reference)
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[12px] bg-[#fafafa] px-2 py-1 rounded border border-[#eaeded]">
                {settings.publicServerName}
              </span>
              <button
                onClick={() => handleCopy(settings.publicServerName, "srv-aws")}
                className="text-[11px] text-[#0972d3] hover:underline"
              >
                {copiedKey === "srv-aws" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-[#545b64] uppercase font-semibold block">
              Supported ports
            </span>
            <span className="font-mono text-[12px]">
              {settings.ports.join(", ")}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#545b64] uppercase font-semibold block">
              Transport Layer Security (TLS)
            </span>
            <span>{settings.tls}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-[#eaeded] text-[12px] text-[#545b64]">
          <span className="font-semibold text-[#16191f]">Authentication:</span>{" "}
          SMTP requires authentication using standard Amazon SES SMTP credentials. An IAM user will be provisioned with permission to send emails through SES.
        </div>
      </div>

      {/* SMTP Credentials Card */}
      <div className="p-5 bg-white border border-[#eaeded] rounded-md shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold text-[#16191f]">SMTP credentials</h2>
            <p className="text-[12px] text-[#545b64]">
              Generate dedicated IAM SMTP credentials. Amazon SES derives the SMTP password using HMAC-SHA256 signature calculations.
            </p>
          </div>
          <button
            onClick={() => {
              setError(null);
              setCredentials(null);
              setUserName(`ses-smtp-user.${Date.now()}`);
              setIsModalOpen(true);
            }}
            className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create SMTP credentials
          </button>
        </div>
      </div>

      {/* Credentials Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-md shadow-2xl border border-[#d5dbdb] w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
              <h3 className="text-[16px] font-bold text-[#16191f]">
                {credentials ? "SMTP credentials created" : "Create SMTP credentials"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#545b64] text-[18px] font-bold p-1"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="p-2 bg-[#fdf2f2] border-l-4 border-l-[#d13212] text-[#d13212] text-[12px] rounded">
                {error}
              </div>
            )}

            {!credentials ? (
              <div className="space-y-4 text-[13px]">
                <p className="text-[#545b64]">
                  An IAM user will be created with programmatic access and granted permissions to send emails via Amazon SES.
                </p>
                <div>
                  <label className="block font-semibold mb-1">
                    IAM User Name <span className="text-[#d13212]">*</span>
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#aab7b8] rounded font-mono text-[12px]"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 text-[13px] font-medium text-[#16191f] border border-[#aab7b8] rounded hover:bg-[#eaeded]"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCredentials}
                    disabled={loading || !userName.trim()}
                    className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] disabled:opacity-50 rounded"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  >
                    {loading ? "Creating..." : "Create"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-[13px]">
                <div className="p-3 bg-[#e7f4e4] border border-[#a2dca0] rounded text-[#1d8102] text-[12px]">
                  <strong>Success:</strong> SMTP credentials have been generated. Copy or download them now. The SMTP password cannot be retrieved again.
                </div>

                <div className="space-y-3 font-mono text-[12px]">
                  <div className="p-2.5 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                    <span className="text-[10px] text-[#545b64] font-sans font-semibold uppercase block">
                      IAM User Name
                    </span>
                    <div className="flex items-center justify-between">
                      <span>{credentials.iamUserName}</span>
                      <button
                        onClick={() => handleCopy(credentials.iamUserName, "res-iam")}
                        className="text-[11px] text-[#0972d3] font-sans hover:underline"
                      >
                        {copiedKey === "res-iam" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                    <span className="text-[10px] text-[#545b64] font-sans font-semibold uppercase block">
                      SMTP Username
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="break-all">{credentials.smtpUsername}</span>
                      <button
                        onClick={() => handleCopy(credentials.smtpUsername, "res-user")}
                        className="text-[11px] text-[#0972d3] font-sans hover:underline ml-2"
                      >
                        {copiedKey === "res-user" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#fafafa] border border-[#eaeded] rounded space-y-1">
                    <span className="text-[10px] text-[#545b64] font-sans font-semibold uppercase block">
                      SMTP Password (SigV4 RFC 2104)
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="break-all">{credentials.smtpPassword}</span>
                      <button
                        onClick={() => handleCopy(credentials.smtpPassword, "res-pass")}
                        className="text-[11px] text-[#0972d3] font-sans hover:underline ml-2"
                      >
                        {copiedKey === "res-pass" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#eaeded]">
                  <button
                    onClick={handleDownloadCsv}
                    className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa]"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  >
                    Download .csv credentials
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded"
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
