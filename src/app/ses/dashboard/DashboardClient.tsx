"use client";

import { useState } from "react";
import Link from "next/link";
import { SESAccountMetrics } from "../actions";
import SendTestEmailModal from "../components/SendTestEmailModal";

interface DashboardClientProps {
  initialMetrics: SESAccountMetrics;
}

export default function DashboardClient({ initialMetrics }: DashboardClientProps) {
  const [metrics] = useState<SESAccountMetrics>(initialMetrics);
  const [isTestEmailOpen, setIsTestEmailOpen] = useState(false);
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);

  const quotaPercent = Math.min(
    100,
    Math.round(((metrics.sentLast24Hours || 0) / (metrics.max24HourSend || 200)) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Account dashboard</h1>
          <p className="text-[13px] text-[#545b64]">
            Monitor your email sending activity, reputation metrics, and sending quotas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/ses/identities/create"
            className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa] flex items-center transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create identity
          </Link>
          <Link
            href="/ses/configuration-sets/create"
            className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa] flex items-center transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create configuration set
          </Link>
          <button
            onClick={() => setIsTestEmailOpen(true)}
            className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded transition-colors"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Send test email
          </button>
        </div>
      </div>

      {/* Production Access / Sandbox Banner */}
      {!metrics.productionAccessEnabled && (
        <div className="p-4 bg-[#f2f8fd] border border-[#a4cbf5] rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-[#0972d3]">
              <span className="w-2 h-2 rounded-full bg-[#0972d3]"></span>
              <span>Your account is in the Amazon SES sandbox in US East (N. Virginia)</span>
            </div>
            <p className="text-[12px] text-[#545b64]">
              You can only send email to verified email addresses and domains, or to the Amazon SES mailbox simulator. To send to any recipient, request production access.
            </p>
          </div>
          <button
            onClick={() => setIsProdModalOpen(true)}
            className="px-3 text-[13px] font-semibold text-[#0972d3] bg-white border border-[#0972d3] rounded hover:bg-[#f2f8fd] transition-colors self-start md:self-auto shrink-0"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Request production access
          </button>
        </div>
      )}

      {/* Sending Quota & Rate Metrics Grid */}
      <div>
        <h2 className="text-[14px] font-bold text-[#16191f] mb-3">Sending statistics & quotas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Daily Quota Card */}
          <div className="p-4 bg-white border border-[#eaeded] rounded-md shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">
                24-Hour Sending Quota
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-[#e7f4e4] text-[#1d8102] border border-[#a2dca0]">
                {metrics.sendingEnabled ? "Active" : "Disabled"}
              </span>
            </div>
            <div>
              <div className="text-[24px] font-bold text-[#16191f]">
                {metrics.sentLast24Hours}{" "}
                <span className="text-[14px] font-normal text-[#545b64]">
                  / {metrics.max24HourSend} emails
                </span>
              </div>
              <div className="w-full bg-[#eaeded] h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#0972d3] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${quotaPercent}%` }}
                ></div>
              </div>
            </div>
            <p className="text-[11px] text-[#545b64]">
              Rolling 24-hour period. Quota automatically resets over time.
            </p>
          </div>

          {/* Maximum Send Rate */}
          <div className="p-4 bg-white border border-[#eaeded] rounded-md shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">
                Maximum Send Rate
              </span>
              <span className="text-[11px] text-[#545b64]">Per second</span>
            </div>
            <div className="text-[24px] font-bold text-[#16191f]">
              {metrics.maxSendRate}{" "}
              <span className="text-[14px] font-normal text-[#545b64]">emails/sec</span>
            </div>
            <p className="text-[11px] text-[#545b64]">
              Maximum rate at which messages can be pushed to the emulator endpoint.
            </p>
          </div>

          {/* Production Status */}
          <div className="p-4 bg-white border border-[#eaeded] rounded-md shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#545b64] uppercase tracking-wide">
                Environment Mode
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                  metrics.productionAccessEnabled
                    ? "bg-[#e7f4e4] text-[#1d8102] border border-[#a2dca0]"
                    : "bg-[#fff7e6] text-[#b35900] border border-[#ffcc80]"
                }`}
              >
                {metrics.productionAccessEnabled ? "Production" : "Sandbox"}
              </span>
            </div>
            <div className="text-[20px] font-bold text-[#16191f]">
              {metrics.productionAccessEnabled ? "Full Sending Access" : "Sandbox Mode"}
            </div>
            <p className="text-[11px] text-[#545b64]">
              Status: {metrics.enforcementStatus}. Managed automatically by emulator.
            </p>
          </div>
        </div>
      </div>

      {/* Reputation Metrics */}
      <div>
        <h2 className="text-[14px] font-bold text-[#16191f] mb-3">Sender reputation metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bounce Rate */}
          <div className="p-4 bg-white border border-[#eaeded] rounded-md shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[13px] font-semibold text-[#16191f]">Bounce rate</span>
                <p className="text-[11px] text-[#545b64]">
                  Keep under 5.00% to protect domain deliverability. Critical threshold is 10.00%.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[20px] font-bold text-[#16191f]">{metrics.bounceRate}%</span>
              </div>
            </div>
            <div className="w-full bg-[#eaeded] h-2 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full ${
                  metrics.bounceRate < 5
                    ? "bg-[#1d8102]"
                    : metrics.bounceRate < 10
                    ? "bg-[#eb5f07]"
                    : "bg-[#d13212]"
                }`}
                style={{ width: `${Math.min(100, metrics.bounceRate * 10)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-[#545b64]">
              <span>Healthy (&lt; 5%)</span>
              <span>Warning (5%)</span>
              <span>Critical (10%)</span>
            </div>
          </div>

          {/* Complaint Rate */}
          <div className="p-4 bg-white border border-[#eaeded] rounded-md shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[13px] font-semibold text-[#16191f]">Complaint rate</span>
                <p className="text-[11px] text-[#545b64]">
                  Keep under 0.10% to prevent sending suspensions. Critical threshold is 0.50%.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[20px] font-bold text-[#16191f]">{metrics.complaintRate}%</span>
              </div>
            </div>
            <div className="w-full bg-[#eaeded] h-2 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full ${
                  metrics.complaintRate < 0.1
                    ? "bg-[#1d8102]"
                    : metrics.complaintRate < 0.5
                    ? "bg-[#eb5f07]"
                    : "bg-[#d13212]"
                }`}
                style={{ width: `${Math.min(100, metrics.complaintRate * 200)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-[#545b64]">
              <span>Healthy (&lt; 0.10%)</span>
              <span>Warning (0.10%)</span>
              <span>Critical (0.50%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div>
        <h2 className="text-[14px] font-bold text-[#16191f] mb-3">Service features & shortcuts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/ses/identities"
            className="p-4 bg-white border border-[#eaeded] hover:border-[#aab7b8] rounded-md shadow-sm group transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="font-semibold text-[14px] text-[#16191f] group-hover:text-[#ec7211]">
                Verified identities
              </div>
              <p className="text-[12px] text-[#545b64] mt-1">
                Authorize email domains and individual email addresses with Easy DKIM and Custom MAIL FROM.
              </p>
            </div>
            <span className="text-[12px] font-medium text-[#0972d3] group-hover:underline mt-4">
              View identities →
            </span>
          </Link>

          <Link
            href="/ses/configuration-sets"
            className="p-4 bg-white border border-[#eaeded] hover:border-[#aab7b8] rounded-md shadow-sm group transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="font-semibold text-[14px] text-[#16191f] group-hover:text-[#ec7211]">
                Configuration sets
              </div>
              <p className="text-[12px] text-[#545b64] mt-1">
                Configure event destinations to stream email opens, clicks, bounces, and deliveries to CloudWatch or SNS.
              </p>
            </div>
            <span className="text-[12px] font-medium text-[#0972d3] group-hover:underline mt-4">
              View configuration sets →
            </span>
          </Link>

          <Link
            href="/ses/templates"
            className="p-4 bg-white border border-[#eaeded] hover:border-[#aab7b8] rounded-md shadow-sm group transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="font-semibold text-[14px] text-[#16191f] group-hover:text-[#ec7211]">
                Email templates
              </div>
              <p className="text-[12px] text-[#545b64] mt-1">
                Create reusable transactional HTML and plain text email templates with Mustache replacement tags.
              </p>
            </div>
            <span className="text-[12px] font-medium text-[#0972d3] group-hover:underline mt-4">
              Manage templates →
            </span>
          </Link>

          <Link
            href="/ses/smtp"
            className="p-4 bg-white border border-[#eaeded] hover:border-[#aab7b8] rounded-md shadow-sm group transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="font-semibold text-[14px] text-[#16191f] group-hover:text-[#ec7211]">
                SMTP settings
              </div>
              <p className="text-[12px] text-[#545b64] mt-1">
                Connect your existing applications, email clients, or code libraries using standard SES SMTP credentials.
              </p>
            </div>
            <span className="text-[12px] font-medium text-[#0972d3] group-hover:underline mt-4">
              View SMTP credentials →
            </span>
          </Link>
        </div>
      </div>

      {/* Production Access Modal */}
      {isProdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-md shadow-2xl border border-[#d5dbdb] w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <h3 className="text-[16px] font-bold text-[#16191f]">Request production access</h3>
              <button
                onClick={() => setIsProdModalOpen(false)}
                className="text-[#545b64] text-[18px] font-bold p-1"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 text-[13px] text-[#545b64]">
              <p>
                In the AWS Emulator, production access simulation allows you to test sending emails to arbitrary recipient addresses beyond verified sandbox identities.
              </p>
              <div className="p-3 bg-[#fafafa] border border-[#eaeded] rounded space-y-2 text-[12px]">
                <div className="font-semibold text-[#16191f]">Sandbox vs Production in AWS:</div>
                <ul className="list-disc list-inside space-y-1 text-[#545b64]">
                  <li>Sandbox: Sending allowed only to verified addresses and domain identities.</li>
                  <li>Sandbox quota: 200 emails / 24 hours at 1 email / second.</li>
                  <li>Production: Sending allowed to any unverified recipient on the internet.</li>
                  <li>Production quota: Typically begins at 50,000 emails / 24 hours at 14/sec.</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setIsProdModalOpen(false)}
                className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Test Email Modal */}
      <SendTestEmailModal
        isOpen={isTestEmailOpen}
        onClose={() => setIsTestEmailOpen(false)}
      />
    </div>
  );
}
