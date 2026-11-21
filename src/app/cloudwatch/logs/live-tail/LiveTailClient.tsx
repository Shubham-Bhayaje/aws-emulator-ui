"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LogGroupSummary, FilteredLogEventItem } from "../types";
import { filterLogEventsAction } from "../actions";
import { formatLogDate } from "../dateUtils";

interface LiveTailClientProps {
  logGroups: LogGroupSummary[];
}

export default function LiveTailClient({ logGroups }: LiveTailClientProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>(
    logGroups[0]?.logGroupName || ""
  );
  const [filterPattern, setFilterPattern] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [events, setEvents] = useState<FilteredLogEventItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Polling loop when streaming is active
  useEffect(() => {
    if (!isStreaming || !selectedGroup) return;

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const res = await filterLogEventsAction(selectedGroup, {
          filterPattern: filterPattern.trim() || undefined,
          startTime: Date.now() - 15000, // last 15 seconds
          limit: 25,
        });

        if (isSubscribed && res.events) {
          setEvents((prev) => {
            const existingIds = new Set(prev.map((e) => e.eventId || `${e.timestamp}-${e.message}`));
            const newOnes = res.events.filter(
              (e) => !existingIds.has(e.eventId || `${e.timestamp}-${e.message}`)
            );
            if (newOnes.length === 0) return prev;
            return [...prev, ...newOnes].slice(-500); // keep last 500
          });
        }
      } catch {
        // Ignore polling glitches
      }
    }, 2500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [isStreaming, selectedGroup, filterPattern]);

  // Auto-scroll terminal
  useEffect(() => {
    if (isStreaming) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [events, isStreaming]);

  function handleToggleStream() {
    if (!selectedGroup) {
      setError("Please select a log group to start streaming.");
      return;
    }
    setError(null);
    if (!isStreaming) {
      setEvents([]);
    }
    setIsStreaming(!isStreaming);
  }

  function handleClear() {
    setEvents([]);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <nav className="text-[12px] text-[#545b64] mb-2 flex items-center gap-1.5">
          <Link href="/cloudwatch" className="hover:underline text-[#0972d3]">
            CloudWatch
          </Link>
          <span>/</span>
          <Link href="/cloudwatch/logs" className="hover:underline text-[#0972d3]">
            Logs
          </Link>
          <span>/</span>
          <span className="text-[#16191f] font-medium">Live Tail</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-[#16191f]">Live Tail</h1>
            <p className="text-[13px] text-[#545b64] mt-1">
              Stream and view ingested log events in real time across log streams in a log group.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-[#fdf2f2] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212]">
          {error}
        </div>
      )}

      {/* Control Bar */}
      <div className="bg-white border border-[#eaeded] rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px]">
            <label className="block text-[12px] font-bold text-[#545b64] mb-1">
              Log group
            </label>
            {logGroups.length === 0 ? (
              <p className="text-[12px] text-[#545b64]">
                No log groups found.{" "}
                <Link href="/cloudwatch/logs" className="text-[#0972d3] hover:underline">
                  Create a log group
                </Link>
              </p>
            ) : (
              <select
                value={selectedGroup}
                onChange={(e) => {
                  setSelectedGroup(e.target.value);
                  setIsStreaming(false);
                  setEvents([]);
                }}
                disabled={isStreaming}
                className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] bg-white font-mono"
              >
                {logGroups.map((lg) => (
                  <option key={lg.logGroupName} value={lg.logGroupName}>
                    {lg.logGroupName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex-1 min-w-[240px]">
            <label className="block text-[12px] font-bold text-[#545b64] mb-1">
              Filter pattern (optional)
            </label>
            <input
              type="text"
              placeholder='e.g. "[ERROR]" or "status = 500"'
              value={filterPattern}
              onChange={(e) => setFilterPattern(e.target.value)}
              disabled={isStreaming}
              className="w-full border border-[#aab7b8] rounded px-3 py-1.5 text-[13px] font-mono focus:outline-none focus:border-[#ec7211]"
            />
          </div>

          <div className="self-end flex items-center gap-2">
            <button
              onClick={handleToggleStream}
              disabled={logGroups.length === 0}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className={`px-4 font-bold text-[13px] rounded shadow-sm transition-colors ${
                isStreaming
                  ? "bg-[#d13212] hover:bg-[#a82a0f] text-white"
                  : "bg-[#ec7211] hover:bg-[#eb5f07] text-white"
              }`}
            >
              {isStreaming ? "Stop Live Tail" : "Start Live Tail"}
            </button>

            <button
              onClick={handleClear}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="px-3 border border-[#545b64] rounded text-[13px] text-[#16191f] hover:bg-[#fafafa]"
            >
              Clear view
            </button>
          </div>
        </div>

        {isStreaming && (
          <div className="flex items-center gap-2 text-[12px] text-[#037f0c] font-medium pt-1">
            <span className="w-2 h-2 rounded-full bg-[#037f0c] animate-pulse" />
            Streaming active. Ingested events will automatically appear below...
          </div>
        )}
      </div>

      {/* Terminal View */}
      <div className="bg-[#0f141c] text-[#f2f3f3] rounded-lg p-4 font-mono text-[12px] h-[500px] overflow-y-auto border border-[#232f3e] shadow-inner space-y-1">
        {events.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#879596] select-none text-[13px]">
            {isStreaming
              ? "Listening for incoming log events in " + selectedGroup + "..."
              : "Click 'Start Live Tail' to begin monitoring real-time events."}
          </div>
        ) : (
          events.map((ev, i) => (
            <div key={i} className="flex gap-4 hover:bg-white/5 py-0.5 px-1 rounded">
              <span className="text-[#879596] whitespace-nowrap select-none">
                {formatLogDate(ev.timestamp)}
              </span>
              <span className="text-[#0972d3] whitespace-nowrap select-none truncate max-w-[160px]">
                [{ev.logStreamName || "stream"}]
              </span>
              <span className="text-[#f2f3f3] break-all">{ev.message}</span>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
