/**
 * QueueDetail – Client component for send/receive/delete messages.
 * Tabs: Details, Send message, Receive messages (like real AWS Console).
 */

"use client";

import { useState } from "react";
import { sendMessage, receiveMessages, deleteMessage } from "../actions";

type Props = { queueUrl: string; queueName: string; attrs: Record<string, string> };

type Msg = { messageId: string; body: string; receiptHandle: string; sentTimestamp: string };

export function QueueDetail({ queueUrl, queueName, attrs }: Props) {
  const [tab, setTab] = useState<"details" | "send" | "receive">("details");
  const [msgBody, setMsgBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true); setSendResult(null); setError(null);
    const fd = new FormData();
    fd.set("queueUrl", queueUrl);
    fd.set("messageBody", msgBody);
    const r = await sendMessage(fd);
    if (r?.error) setError(r.error);
    else { setSendResult("Message sent! ID: " + (r?.messageId ?? "")); setMsgBody(""); }
    setSending(false);
  }

  async function handlePoll() {
    setPolling(true); setError(null);
    const r = await receiveMessages(queueUrl);
    if (r?.error) setError(r.error);
    if (r.messages.length > 0) setMessages((prev) => [...r.messages, ...prev]);
    setPolling(false);
  }

  async function handleDeleteMsg(receiptHandle: string, messageId: string) {
    const r = await deleteMessage(queueUrl, receiptHandle);
    if (r?.error) setError(r.error);
    else setMessages((prev) => prev.filter((m) => m.messageId !== messageId));
  }

  const tabs = [
    { id: "details" as const, label: "Details" },
    { id: "send" as const, label: "Send and receive messages" },
    { id: "receive" as const, label: "Poll for messages" },
  ];

  return (
    <>
      {error && (
        <div className="bg-[#fdf3f1] border border-[#d13212] rounded p-3 mb-3 text-[13px] text-[#d13212] flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      {sendResult && (
        <div className="bg-[#f2f8f0] border border-[#1d8102] rounded p-3 mb-3 text-[13px] text-[#1d8102] flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{sendResult}</span>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-[#d5dbdb] mb-4">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={"px-4 py-2 text-[13px] border-b-2 -mb-px " + (tab === t.id
              ? "border-[#0073bb] text-[#0073bb] font-medium"
              : "border-transparent text-[#545b64] hover:text-[#16191f]")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Details tab */}
      {tab === "details" && (
        <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow">
          <div className="px-5 py-3 border-b border-[#eaeded]">
            <h2 className="text-[14px] font-bold text-[#16191f]">Queue details</h2>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 gap-4 text-[13px]">
            <div><span className="text-[#545b64]">URL:</span> <span className="font-mono text-[12px] break-all">{queueUrl}</span></div>
            <div><span className="text-[#545b64]">ARN:</span> <span className="font-mono text-[12px]">{attrs.QueueArn ?? "—"}</span></div>
            <div><span className="text-[#545b64]">Messages available:</span> <span className="font-medium">{attrs.ApproximateNumberOfMessages ?? "—"}</span></div>
            <div><span className="text-[#545b64]">Messages in flight:</span> <span className="font-medium">{attrs.ApproximateNumberOfMessagesNotVisible ?? "—"}</span></div>
            <div><span className="text-[#545b64]">Created:</span> <span>{attrs.CreatedTimestamp ? new Date(parseInt(attrs.CreatedTimestamp) * 1000).toLocaleString() : "—"}</span></div>
            <div><span className="text-[#545b64]">Visibility timeout:</span> <span>{attrs.VisibilityTimeout ?? "—"}s</span></div>
          </div>
        </div>
      )}

      {/* Send tab */}
      {tab === "send" && (
        <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow">
          <div className="px-5 py-3 border-b border-[#eaeded]">
            <h2 className="text-[14px] font-bold text-[#16191f]">Send message</h2>
          </div>
          <form onSubmit={handleSend} className="px-5 py-4">
            <label className="block text-[13px] font-bold text-[#16191f] mb-1">Message body</label>
            <textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} required rows={5} placeholder="Enter message body..."
              className="w-full border border-[#aab7b8] rounded-sm px-3 py-2 text-[13px] font-mono focus:outline-none focus:border-[#0073bb] mb-4" />
            <button type="submit" disabled={sending}
              className="px-4 py-[6px] text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] disabled:opacity-50">
              {sending ? "Sending..." : "Send message"}
            </button>
          </form>
        </div>
      )}

      {/* Receive tab */}
      {tab === "receive" && (
        <div className="bg-white border border-[#d5dbdb] rounded awsui-shadow">
          <div className="px-5 py-3 border-b border-[#eaeded] flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-[#16191f]">Messages ({messages.length})</h2>
            <button onClick={handlePoll} disabled={polling}
              className="px-3 py-[4px] text-[13px] bg-[#ec7211] text-white rounded-sm hover:bg-[#eb5f07] disabled:opacity-50">
              {polling ? "Polling..." : "Poll for messages"}
            </button>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaeded] text-left text-[#545b64]">
                <th className="py-2 px-4 font-medium">Message ID</th>
                <th className="py-2 px-4 font-medium">Body</th>
                <th className="py-2 px-4 font-medium">Sent</th>
                <th className="py-2 px-4 font-medium w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-[#545b64]">No messages. Click <strong>Poll for messages</strong>.</td></tr>
              ) : messages.map((m) => (
                <tr key={m.messageId} className="border-b border-[#eaeded] hover:bg-[#f2f8fd]">
                  <td className="py-2 px-4 font-mono text-[11px] text-[#0073bb] max-w-[150px] truncate">{m.messageId}</td>
                  <td className="py-2 px-4 max-w-[300px]"><pre className="whitespace-pre-wrap text-[12px] font-mono">{m.body}</pre></td>
                  <td className="py-2 px-4 text-[#545b64]">{m.sentTimestamp}</td>
                  <td className="py-2 px-4">
                    <button onClick={() => handleDeleteMsg(m.receiptHandle, m.messageId)}
                      className="text-[12px] text-[#d13212] hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
