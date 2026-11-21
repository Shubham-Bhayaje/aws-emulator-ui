"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LogGroupSummary, FilteredLogEventItem } from "../types";
import { filterLogEventsAction } from "../actions";
import { formatLogDate } from "../dateUtils";

interface InsightsClientProps {
  logGroups: LogGroupSummary[];
}

const SAMPLE_QUERIES = [
  {
    name: "20 most recent log events",
    query: "fields @timestamp, @message\n| sort @timestamp desc\n| limit 20",
    filterPattern: "",
  },
  {
    name: "Find ERROR and Exception logs",
    query: "fields @timestamp, @message\n| filter @message like /(?i)error|exception/\n| sort @timestamp desc\n| limit 50",
    filterPattern: "ERROR",
  },
  {
    name: "HTTP 500 server errors",
    query: "fields @timestamp, @message\n| filter @message like /500/\n| sort @timestamp desc\n| limit 25",
    filterPattern: "500",
  },
];

export default function InsightsClient({ logGroups }: InsightsClientProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>(
    logGroups[0]?.logGroupName || ""
  );
  const [queryString, setQueryString] = useState(SAMPLE_QUERIES[0].query);
  const [results, setResults] = useState<FilteredLogEventItem[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuerying, startQueryTransition] = useTransition();

  function handleRunQuery(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!selectedGroup) {
      setError("Please select at least one log group.");
      return;
    }
    setError(null);

    // Extract basic filter keyword from query if specified
    let extractedPattern = "";
    if (queryString.toLowerCase().includes("error")) extractedPattern = "ERROR";
    else if (queryString.includes("500")) extractedPattern = "500";

    startQueryTransition(async () => {
      const res = await filterLogEventsAction(selectedGroup, {
        filterPattern: extractedPattern || undefined,
        limit: 50,
      });

      setHasRun(true);
      if (res.error) {
        setError(res.error);
      } else {
        setResults(res.events);
      }
    });
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
          <span className="text-[#16191f] font-medium">Log Insights</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-[#16191f]">CloudWatch Logs Insights</h1>
            <p className="text-[13px] text-[#545b64] mt-1">
              Interactively search and analyze log data in Amazon CloudWatch Logs using purpose-built queries.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-[#fdf2f2] border border-[#d13212] rounded p-3 text-[13px] text-[#d13212]">
          {error}
        </div>
      )}

      {/* Query Editor Box */}
      <div className="bg-white border border-[#eaeded] rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-[280px]">
            <label className="block text-[12px] font-bold text-[#16191f] mb-1">
              Select log group(s)
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
                onChange={(e) => setSelectedGroup(e.target.value)}
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

          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#545b64]">Sample queries:</span>
            {SAMPLE_QUERIES.map((sq) => (
              <button
                key={sq.name}
                type="button"
                onClick={() => setQueryString(sq.query)}
                className="text-[12px] text-[#0972d3] hover:underline bg-[#f2f3f3] px-2.5 py-1 rounded"
              >
                {sq.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-bold text-[#16191f] mb-1">
            Query editor
          </label>
          <textarea
            rows={5}
            value={queryString}
            onChange={(e) => setQueryString(e.target.value)}
            className="w-full border border-[#aab7b8] rounded p-3 font-mono text-[13px] bg-[#0f141c] text-[#f2f3f3] focus:outline-none focus:border-[#ec7211]"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#eaeded]">
          <div className="text-[12px] text-[#545b64]">
            Queries run across log events ingested in the selected log group.
          </div>
          <button
            type="button"
            onClick={handleRunQuery}
            disabled={isQuerying || logGroups.length === 0}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="px-5 bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] rounded shadow-sm disabled:opacity-50"
          >
            {isQuerying ? "Running query..." : "Run query"}
          </button>
        </div>
      </div>

      {/* Query Results */}
      <div className="bg-white border border-[#eaeded] rounded-lg shadow-sm">
        <div className="p-3 border-b border-[#eaeded] bg-[#fafafa] flex items-center justify-between text-[12px] text-[#545b64]">
          <span className="font-bold text-[#16191f]">Logs results</span>
          <span>
            {hasRun ? `${results.length} record(s) matched` : "No query executed"}
          </span>
        </div>

        {!hasRun ? (
          <div className="p-12 text-center text-[#545b64] text-[13px]">
            Write or pick a query above and click &apos;Run query&apos; to view matching log records.
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center text-[#545b64] text-[13px]">
            No records matched your query in <span className="font-mono">{selectedGroup}</span>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[12px]">
              <thead className="bg-[#f2f3f3] text-[#545b64] border-b border-[#eaeded]">
                <tr>
                  <th className="px-4 py-2 w-48">@timestamp</th>
                  <th className="px-4 py-2 w-48">@logStream</th>
                  <th className="px-4 py-2">@message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {results.map((ev, i) => (
                  <tr key={ev.eventId || i} className="hover:bg-[#f2f8fd]">
                    <td className="px-4 py-2 text-[#545b64] align-top whitespace-nowrap">
                      {formatLogDate(ev.timestamp)}
                    </td>
                    <td className="px-4 py-2 text-[#0972d3] align-top whitespace-nowrap truncate max-w-[200px]">
                      {ev.logStreamName || "-"}
                    </td>
                    <td className="px-4 py-2 text-[#16191f] align-top break-all">
                      {ev.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
