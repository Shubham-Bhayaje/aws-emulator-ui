"use client";

import { useState } from "react";
import Link from "next/link";
import { DatabaseSummary } from "../types";

interface QueryClientProps {
  databases: DatabaseSummary[];
}

export default function QueryClient({ databases }: QueryClientProps) {
  const [selectedDatabase, setSelectedDatabase] = useState(
    databases[0]?.DatabaseName || ""
  );
  const [queryString, setQueryString] = useState(
    selectedDatabase
      ? `SELECT * FROM "${selectedDatabase}"."metrics" ORDER BY time DESC LIMIT 10`
      : `SELECT * FROM "telemetry_db"."host_metrics" ORDER BY time DESC LIMIT 10`
  );
  const [queryExecuted, setQueryExecuted] = useState(false);

  function handleRunQuery() {
    setQueryExecuted(true);
  }

  function handleSelectSample(sampleSql: string) {
    setQueryString(sampleSql);
    setQueryExecuted(false);
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-[24px] font-bold text-[#16191f]">Query editor</h1>
        <p className="text-[14px] text-[#545b64] mt-0.5">
          Query your Amazon Timestream time-series telemetry data using standard SQL with built-in time-series functions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Schema Browser */}
        <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm space-y-4">
          <h2 className="text-[14px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
            Database Browser
          </h2>
          {databases.length === 0 ? (
            <div className="text-[12px] text-[#545b64]">
              No databases found.{" "}
              <Link
                href="/timestream/databases/create"
                className="text-[#0073bb] hover:underline font-bold"
              >
                Create a database
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-[#545b64]">
                Target Database:
              </label>
              <select
                value={selectedDatabase}
                onChange={(e) => {
                  setSelectedDatabase(e.target.value);
                  setQueryString(
                    `SELECT * FROM "${e.target.value}"."metrics" ORDER BY time DESC LIMIT 10`
                  );
                  setQueryExecuted(false);
                }}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px" }}
                className="w-full px-2 text-[13px] border border-[#eaeded] rounded focus:outline-none focus:border-[#ec7211] bg-white font-mono"
              >
                {databases.map((db) => (
                  <option key={db.DatabaseName} value={db.DatabaseName}>
                    {db.DatabaseName} ({db.TableCount} tables)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2 border-t border-[#eaeded] space-y-2">
            <div className="text-[12px] font-bold text-[#16191f]">Sample queries:</div>
            <button
              onClick={() =>
                handleSelectSample(
                  `SELECT * FROM "${selectedDatabase || "my_db"}"."metrics" ORDER BY time DESC LIMIT 10`
                )
              }
              className="text-left text-[12px] text-[#0073bb] hover:underline block truncate w-full font-mono"
            >
              1. Recent raw events
            </button>
            <button
              onClick={() =>
                handleSelectSample(
                  `SELECT BIN(time, 5m) AS binned_timestamp, AVG(measure_value::double) AS avg_cpu FROM "${
                    selectedDatabase || "my_db"
                  }"."metrics" WHERE measure_name = 'cpu_utilization' GROUP BY BIN(time, 5m) ORDER BY binned_timestamp DESC`
                )
              }
              className="text-left text-[12px] text-[#0073bb] hover:underline block truncate w-full font-mono"
            >
              2. 5-minute aggregations
            </button>
            <button
              onClick={() =>
                handleSelectSample(
                  `SELECT host, MAX(measure_value::double) AS peak_usage FROM "${
                    selectedDatabase || "my_db"
                  }"."metrics" GROUP BY host ORDER BY peak_usage DESC`
                )
              }
              className="text-left text-[12px] text-[#0073bb] hover:underline block truncate w-full font-mono"
            >
              3. Top dimensions
            </button>
          </div>
        </div>

        {/* Right: Query Editor & Results */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-[#eaeded] rounded p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#16191f]">SQL Query</span>
              <button
                onClick={() => setQueryString("")}
                style={{ height: "28px", minHeight: "28px", maxHeight: "28px" }}
                className="px-2 text-[12px] font-bold text-[#545b64] bg-white border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
              >
                Clear
              </button>
            </div>
            <textarea
              rows={6}
              value={queryString}
              onChange={(e) => setQueryString(e.target.value)}
              className="w-full p-3 font-mono text-[13px] border border-[#eaeded] rounded bg-[#fafafa] focus:outline-none focus:border-[#ec7211] focus:bg-white"
              placeholder="SELECT * FROM database.table WHERE time > ago(1h)"
            />
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#545b64]">
                Supports SQL:2003 with window functions, mathematical interpolation, and time binning.
              </span>
              <button
                onClick={handleRunQuery}
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-5 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow-sm"
              >
                Run query
              </button>
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden p-6 space-y-4">
            <h2 className="text-[16px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
              Query results
            </h2>

            {queryExecuted ? (
              <div className="space-y-4">
                <div className="bg-[#f2f8fd] border-l-4 border-[#0073bb] p-3 text-[13px] text-[#16191f]">
                  <code>Query</code> operation is scaffolded in the AWS Emulator, but not implemented in this local emulator version.
                </div>
                <p className="text-[12px] text-[#545b64]">
                  Below is a representative time-series schema layout of how query results are rendered by Amazon Timestream:
                </p>
                <div className="overflow-x-auto border border-[#eaeded] rounded">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-[#fafafa] text-[#545b64] border-b border-[#eaeded] font-bold uppercase text-[11px]">
                      <tr>
                        <th className="px-4 py-2">time</th>
                        <th className="px-4 py-2">host</th>
                        <th className="px-4 py-2">region</th>
                        <th className="px-4 py-2">measure_name</th>
                        <th className="px-4 py-2">measure_value::double</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaeded] font-mono">
                      <tr className="hover:bg-[#fafafa]">
                        <td className="px-4 py-2 text-[#545b64]">{new Date().toISOString()}</td>
                        <td className="px-4 py-2">server-01</td>
                        <td className="px-4 py-2">us-east-1</td>
                        <td className="px-4 py-2 text-[#0073bb]">cpu_utilization</td>
                        <td className="px-4 py-2 font-bold text-[#16191f]">78.50</td>
                      </tr>
                      <tr className="hover:bg-[#fafafa]">
                        <td className="px-4 py-2 text-[#545b64]">
                          {new Date(Date.now() - 60000).toISOString()}
                        </td>
                        <td className="px-4 py-2">server-01</td>
                        <td className="px-4 py-2">us-east-1</td>
                        <td className="px-4 py-2 text-[#0073bb]">cpu_utilization</td>
                        <td className="px-4 py-2 font-bold text-[#16191f]">74.20</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-[#545b64] text-[13px]">
                Click <strong>Run query</strong> to execute your SQL time series statement.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
