"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogEventItem } from "../types";
import {
  getLogEventsAction,
  putLogEventsAction,
  deleteLogStreamAction,
} from "../actions";
import { formatLogDate } from "../dateUtils";

interface LogStreamClientProps {
  logGroupName: string;
  logStreamName: string;
  initialEvents: LogEventItem[];
  initialError?: string;
}

export default function LogStreamClient({
  logGroupName,
  logStreamName,
  initialEvents,
  initialError,
}: LogStreamClientProps) {
  const router = useRouter();
  const [events, setEvents] = useState<LogEventItem[]>(initialEvents);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(initialError || null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Put Log Event Modal
  const [showPutEventModal, setShowPutEventModal] = useState(false);
  const [newEventMessage, setNewEventMessage] = useState("");
  const [isPuttingEvent, startPutEventTransition] = useTransition();

  // Delete Stream Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingStream, startDeleteStreamTransition] = useTransition();

  // Refreshing
  const [isRefreshing, startRefreshTransition] = useTransition();

  const filteredEvents = events.filter((ev) =>
    ev.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleRefresh() {
    startRefreshTransition(async () => {
      const res = await getLogEventsAction(logGroupName, logStreamName);
      if (res.error) {
        setError(res.error);
      } else {
        setEvents(res.events);
      }
    });
  }

  function handlePutEvent(e: React.FormEvent) {
    e.preventDefault();
    const msg = newEventMessage.trim();
    if (!msg) return;
    setError(null);

    startPutEventTransition(async () => {
      const res = await putLogEventsAction(logGroupName, logStreamName, [
        { timestamp: Date.now(), message: msg },
      ]);

      if (res.success) {
        setShowPutEventModal(false);
        setNewEventMessage("");
        setSuccessBanner("Log event ingested successfully.");
        // Refresh events
        const fetchRes = await getLogEventsAction(logGroupName, logStreamName);
        if (fetchRes.events) setEvents(fetchRes.events);
      } else {
        setError(res.error || "Failed to put log event.");
      }
    });
  }

  function handleDeleteStream() {
    setError(null);
    startDeleteStreamTransition(async () => {
      const res = await deleteLogStreamAction(logGroupName, logStreamName);
      if (res.success) {
        router.push(`/cloudwatch/logs/group/${encodeURIComponent(logGroupName)}`);
      } else {
        setError(res.error || "Failed to delete log stream.");
        setShowDeleteModal(false);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <div className="bg-[#fdf2f2] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212] flex items-start justify-between shadow-sm">
          <div>
            <span className="font-bold">Error: </span>
            {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="text-[12px] font-bold text-[#545b64] hover:text-[#16191f] ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {successBanner && (
        <div className="bg-[#f2f8f4] border border-[#037f0c] rounded p-3 text-[13px] text-[#037f0c] flex items-start justify-between shadow-sm">
          <div>
            <span className="font-bold">Success: </span>
            {successBanner}
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-[12px] font-bold text-[#545b64] hover:text-[#16191f] ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <nav className="text-[12px] text-[#545b64] mb-2 flex items-center gap-1.5">
          <Link href="/cloudwatch" className="hover:underline text-[#0972d3]">
            CloudWatch
          </Link>
          <span>/</span>
          <Link href="/cloudwatch/logs" className="hover:underline text-[#0972d3]">
            Log groups
          </Link>
          <span>/</span>
          <Link
            href={`/cloudwatch/logs/group/${encodeURIComponent(logGroupName)}`}
            className="hover:underline text-[#0972d3]"
          >
            {logGroupName}
          </Link>
          <span>/</span>
          <span className="text-[#16191f] font-medium">{logStreamName}</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-[#16191f] font-mono break-all">
              {logStreamName}
            </h1>
            <p className="text-[12px] text-[#545b64] mt-0.5">
              Log stream belonging to <span className="font-mono">{logGroupName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 border border-[#d13212] text-[#d13212] hover:bg-[#fdf2f2] rounded text-[13px] font-medium transition-colors"
            >
              Delete log stream
            </button>

            <button
              onClick={() => setShowPutEventModal(true)}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] rounded shadow-sm transition-colors inline-flex items-center justify-center"
            >
              Put log event
            </button>
          </div>
        </div>
      </div>

      {/* Main Terminal View Container */}
      <div className="bg-white border border-[#eaeded] rounded-lg shadow-sm">
        {/* Controls Bar */}
        <div className="p-3 border-b border-[#eaeded] flex items-center justify-between gap-4 bg-[#fafafa]">
          <div className="max-w-md w-full relative">
            <input
              type="text"
              placeholder="Search events in this stream"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh events"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 border border-[#545b64] rounded text-[13px] text-[#16191f] hover:bg-[#f2f3f3] transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6"></path>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
            <span className="text-[12px] text-[#545b64]">
              {filteredEvents.length} event{filteredEvents.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* Log Viewer Content */}
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-[16px] font-bold text-[#16191f]">No log events</div>
            <p className="text-[13px] text-[#545b64] max-w-md mx-auto">
              {searchQuery
                ? `No events match "${searchQuery}".`
                : "This log stream is empty. Put an event to test logging against the emulator."}
            </p>
            {!searchQuery && (
              <div className="pt-2">
                <button
                  onClick={() => setShowPutEventModal(true)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] rounded shadow-sm"
                >
                  Put log event
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[12px]">
              <thead className="bg-[#f2f3f3] text-[#545b64] border-b border-[#eaeded]">
                <tr>
                  <th className="px-4 py-2 w-48 whitespace-nowrap">Timestamp (UTC)</th>
                  <th className="px-4 py-2">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {filteredEvents.map((ev, idx) => {
                  const isExpanded = expandedIndex === idx;
                  return (
                    <tr
                      key={idx}
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className={`hover:bg-[#f2f8fd] cursor-pointer transition-colors ${
                        isExpanded ? "bg-[#fffaf5]" : ""
                      }`}
                    >
                      <td className="px-4 py-2 text-[#545b64] align-top whitespace-nowrap" suppressHydrationWarning>
                        {formatLogDate(ev.timestamp)}
                      </td>
                      <td className="px-4 py-2 text-[#16191f] align-top break-all">
                        <div className="leading-relaxed">{ev.message}</div>
                        {isExpanded && (
                          <div className="mt-2 pt-2 border-t border-[#eaeded] text-[11px] text-[#545b64] space-y-1 bg-white p-2.5 rounded shadow-sm">
                            <div>
                              <span className="font-bold text-[#16191f]">Timestamp: </span>
                              {ev.timestamp} ({new Date(ev.timestamp).toISOString()})
                            </div>
                            {ev.ingestionTime && (
                              <div>
                                <span className="font-bold text-[#16191f]">Ingestion time: </span>
                                {formatLogDate(ev.ingestionTime)}
                              </div>
                            )}
                          </div>
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

      {/* Put Log Event Modal */}
      {showPutEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">Put log event</h2>
            <p className="text-[13px] text-[#545b64]">
              Simulate log event ingestion into <span className="font-mono">{logStreamName}</span>.
            </p>
            <form onSubmit={handlePutEvent} className="space-y-4 text-[13px]">
              <div>
                <label className="block font-bold text-[#16191f] mb-1">
                  Message payload <span className="text-[#d13212]">*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder='e.g. 2026-11-21 22:30:00 [INFO] Request completed with status 200 in 12ms or {"service": "auth", "status": "ok"}'
                  value={newEventMessage}
                  onChange={(e) => setNewEventMessage(e.target.value)}
                  className="w-full border border-[#aab7b8] rounded p-3 font-mono text-[12px] focus:outline-none focus:border-[#ec7211]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setShowPutEventModal(false)}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 border border-[#545b64] rounded text-[#16191f] hover:bg-[#fafafa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPuttingEvent}
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                  className="px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold rounded shadow-sm disabled:opacity-50"
                >
                  {isPuttingEvent ? "Ingesting..." : "Put event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Stream Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#eaeded] rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-[18px] font-bold text-[#16191f]">
              Delete log stream &apos;{logStreamName}&apos;?
            </h2>
            <p className="text-[13px] text-[#545b64]">
              Deleting a log stream permanently removes all events stored in that stream.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 border border-[#545b64] rounded text-[13px] text-[#16191f]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStream}
                disabled={isDeletingStream}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="px-4 bg-[#d13212] hover:bg-[#a82a0f] text-white font-bold text-[13px] rounded shadow-sm disabled:opacity-50"
              >
                {isDeletingStream ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
