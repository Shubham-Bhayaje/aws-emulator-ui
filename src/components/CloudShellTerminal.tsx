/**
 * CloudShellTerminal.tsx – Functional AWS CloudShell Terminal Drawer
 *
 * Provides a real interactive terminal shell connected to the local AWS Emulator.
 * Supports executing any `aws ...` command, command history with ↑/↓,
 * quick-run command pills, and maximize/minimize controls.
 */

"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { executeTerminalCommand, CliResult } from "@/lib/cli-runner";

type HistoryItem = {
  command: string;
  output: string;
  exitCode: number;
  durationMs: number;
};

type CloudShellTerminalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CloudShellTerminal({ isOpen, onClose }: CloudShellTerminalProps) {
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      command: "welcome",
      output: `Welcome to AWS CloudShell (Local Emulator Edition)
• Local Emulator Endpoint: https://127.0.0.1:9297
• Credentials & CA Cert: Loaded from ~/.aws/emulator/9297/
• Type any AWS CLI command (e.g. 'aws s3 ls') or 'help'.`,
      exitCode: 0,
      durationMs: 0,
    },
  ]);

  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [isMaximized, setIsMaximized] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on output change
  useEffect(() => {
    if (isOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [history, isOpen, loading]);

  if (!isOpen) return null;

  async function handleRunCommand(cmdToRun?: string) {
    const raw = cmdToRun !== undefined ? cmdToRun : inputVal;
    const trimmed = raw.trim();
    if (!trimmed || loading) return;

    setInputVal("");
    setCmdHistory((prev) => [trimmed, ...prev.filter((c) => c !== trimmed)]);
    setHistoryIdx(-1);

    if (trimmed.toLowerCase() === "clear" || trimmed.toLowerCase() === "cls") {
      setHistory([]);
      return;
    }

    setLoading(true);

    try {
      const res: CliResult = await executeTerminalCommand(trimmed);
      if (res.clear) {
        setHistory([]);
      } else {
        setHistory((prev) => [
          ...prev,
          {
            command: trimmed,
            output: res.output,
            exitCode: res.exitCode,
            durationMs: res.durationMs,
          },
        ]);
      }
    } catch (err) {
      setHistory((prev) => [
        ...prev,
        {
          command: trimmed,
          output: (err as Error).message,
          exitCode: 1,
          durationMs: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRunCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
      setHistoryIdx(nextIdx);
      setInputVal(cmdHistory[nextIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInputVal("");
      }
    }
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-[#0d1b2a] text-white border-t-2 border-[#ff9900] shadow-2xl flex flex-col font-mono transition-all duration-200 ${
        isMaximized ? "h-[85vh]" : "h-[340px]"
      }`}
    >
      {/* Top Header Bar */}
      <div className="h-[38px] bg-[#000716] px-4 flex items-center justify-between border-b border-[#5f6b7a]/40 shrink-0 select-none">
        
        {/* Left Title */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-white">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#ff9900]">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            AWS CloudShell
          </span>
          <span className="text-[11px] text-[#8d9ba8] font-sans flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            Connected to 127.0.0.1:9297
          </span>
        </div>

        {/* Quick Shortcut Pills */}
        <div className="hidden md:flex items-center gap-1 text-[11px]">
          {[
            { label: "s3 ls", cmd: "aws s3 ls" },
            { label: "whoami", cmd: "aws sts get-caller-identity" },
            { label: "sqs list", cmd: "aws sqs list-queues" },
            { label: "dynamodb list", cmd: "aws dynamodb list-tables" },
            { label: "iam users", cmd: "aws iam list-users" },
          ].map((pill) => (
            <button
              key={pill.label}
              onClick={() => handleRunCommand(pill.cmd)}
              disabled={loading}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-[#ff9900] hover:text-black text-[#8d9ba8] transition-colors"
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setHistory([])}
            className="text-[11px] px-2 py-0.5 rounded text-[#8d9ba8] hover:text-white hover:bg-white/10"
            title="Clear Terminal (clear)"
          >
            Clear
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 rounded text-[#8d9ba8] hover:text-white hover:bg-white/10"
            title={isMaximized ? "Restore Height" : "Maximize"}
          >
            {isMaximized ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="9" width="14" height="11" rx="1" />
                <path d="M9 5h10a1 1 0 0 1 1 1v10" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10"
            title="Close CloudShell"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex-1 p-4 overflow-y-auto text-[12px] leading-relaxed cursor-text selection:bg-[#ff9900] selection:text-black"
      >
        {history.map((item, index) => (
          <div key={index} className="mb-3">
            {item.command !== "welcome" && (
              <div className="flex items-center gap-2 text-[#00e676]">
                <span className="text-[#8d9ba8]">[emulator@cloudshell ~]$</span>
                <span className="font-semibold text-white">{item.command}</span>
                {item.durationMs > 0 && (
                  <span className="text-[10px] text-[#545b64] ml-auto font-sans">
                    {item.durationMs}ms
                  </span>
                )}
              </div>
            )}
            <pre className="mt-1 text-[#e0e6ed] whitespace-pre-wrap font-mono overflow-x-auto text-[11.5px] bg-black/20 p-2 rounded border border-white/5">
              {item.output}
            </pre>
          </div>
        ))}

        {/* Loading Spinner during execution */}
        {loading && (
          <div className="flex items-center gap-2 text-[#ff9900] text-[12px] my-2">
            <span className="animate-spin inline-block">⠋</span>
            <span>Executing command against AWS Emulator...</span>
          </div>
        )}

        {/* Active Command Line Input */}
        <div className="flex items-center gap-2 mt-2 pt-1">
          <span className="text-[#8d9ba8] shrink-0">[emulator@cloudshell ~]$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Type an AWS CLI command (e.g. 'aws s3 ls') and press Enter..."
            className="flex-1 bg-transparent border-none text-white focus:outline-none placeholder-[#545b64] font-mono text-[12px]"
            autoFocus
          />
        </div>

        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
