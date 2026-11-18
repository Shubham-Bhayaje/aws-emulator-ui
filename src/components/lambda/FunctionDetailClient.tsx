/**
 * src/components/lambda/FunctionDetailClient.tsx – Authentic AWS Lambda Function Inspector.
 * Tabs: Code, Test, Configuration, Aliases, Monitoring.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LambdaFunction,
  TEST_EVENT_PRESETS,
  TestEventPreset,
  LAMBDA_RUNTIMES,
} from "@/lib/lambda-data";
import {
  updateLiveFunctionCode,
  updateLiveFunctionConfig,
  deleteLiveFunction,
  invokeLiveFunction,
  LambdaInvokeResult,
} from "@/app/lambda/actions";

interface Props {
  initialFunction: LambdaFunction;
  initialCode: string;
  isLive: boolean;
}

export default function FunctionDetailClient({
  initialFunction,
  initialCode,
  isLive,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [fn, setFn] = useState<LambdaFunction>(initialFunction);
  const [activeTab, setActiveTab] = useState<"code" | "test" | "configuration" | "aliases" | "monitoring">(
    tabParam === "test" ? "test" : "code"
  );

  // Code Tab state
  const [codeContent, setCodeContent] = useState<string>(initialCode);
  const [codeDirty, setCodeDirty] = useState<boolean>(false);
  const [deploySuccess, setDeploySuccess] = useState<boolean>(false);

  // Test Tab state
  const [selectedPresetId, setSelectedPresetId] = useState<string>(TEST_EVENT_PRESETS[0].id);
  const [testPayload, setTestPayload] = useState<string>(
    JSON.stringify(TEST_EVENT_PRESETS[0].payload, null, 2)
  );
  const [invokeResult, setInvokeResult] = useState<LambdaInvokeResult | null>(null);

  // Configuration Modal state
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [editDesc, setEditDesc] = useState<string>(fn.description);
  const [editMemory, setEditMemory] = useState<number>(fn.memorySize);
  const [editTimeout, setEditTimeout] = useState<number>(fn.timeout);

  // Environment variables modal state
  const [showEnvModal, setShowEnvModal] = useState<boolean>(false);
  const [envList, setEnvList] = useState<Array<{ key: string; value: string }>>(
    Object.entries(fn.environmentVariables).map(([key, value]) => ({ key, value }))
  );

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // Dropdown
  const [showActionsDropdown, setShowActionsDropdown] = useState<boolean>(false);

  const [isPending, startTransition] = useTransition();

  // Helper filename
  const runtimePreset = LAMBDA_RUNTIMES.find((r) => r.id === fn.runtime) || LAMBDA_RUNTIMES[0];
  const mainFileName = runtimePreset.defaultExtension === "py"
    ? "lambda_function.py"
    : runtimePreset.defaultExtension === "mjs"
    ? "index.mjs"
    : "index.js";

  // -------------------------------------------------------------
  // Code Tab Handlers
  // -------------------------------------------------------------
  function handleCodeChange(newCode: string) {
    setCodeContent(newCode);
    setCodeDirty(true);
    setDeploySuccess(false);
  }

  function handleDeploy() {
    startTransition(async () => {
      const res = await updateLiveFunctionCode(fn.name, codeContent, fn.runtime);
      if (res.success) {
        setCodeDirty(false);
        setDeploySuccess(true);
        setTimeout(() => setDeploySuccess(false), 4000);
      } else {
        alert("Deploy failed: " + (res.error || "Unknown emulator error"));
      }
    });
  }

  // -------------------------------------------------------------
  // Test Tab Handlers
  // -------------------------------------------------------------
  function handlePresetChange(presetId: string) {
    setSelectedPresetId(presetId);
    const preset = TEST_EVENT_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setTestPayload(JSON.stringify(preset.payload, null, 2));
    }
  }

  function handleExecuteTest() {
    startTransition(async () => {
      const result = await invokeLiveFunction(fn.name, testPayload, fn.runtime, codeContent);
      setInvokeResult(result);
    });
  }

  // -------------------------------------------------------------
  // Configuration Handlers
  // -------------------------------------------------------------
  function handleSaveGeneralConfig(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateLiveFunctionConfig(fn.name, {
        description: editDesc,
        memorySize: editMemory,
        timeout: editTimeout,
      });

      if (res.success) {
        setFn({
          ...fn,
          description: editDesc,
          memorySize: editMemory,
          timeout: editTimeout,
        });
        setShowConfigModal(false);
      } else {
        alert("Configuration update failed: " + res.error);
      }
    });
  }

  function handleSaveEnvVars(e: React.FormEvent) {
    e.preventDefault();
    const envMap: Record<string, string> = {};
    for (const item of envList) {
      if (item.key.trim()) {
        envMap[item.key.trim()] = item.value;
      }
    }

    startTransition(async () => {
      const res = await updateLiveFunctionConfig(fn.name, {
        environmentVariables: envMap,
      });

      if (res.success) {
        setFn({
          ...fn,
          environmentVariables: envMap,
        });
        setShowEnvModal(false);
      } else {
        alert("Failed to update environment variables: " + res.error);
      }
    });
  }

  // -------------------------------------------------------------
  // Delete Handler
  // -------------------------------------------------------------
  function handleConfirmDelete() {
    setShowDeleteModal(false);
    startTransition(async () => {
      await deleteLiveFunction(fn.name);
      router.push("/lambda");
    });
  }

  return (
    <div className="space-y-5 pb-16">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#eaeded] pb-4">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-[#545b64] mb-1">
            <Link href="/lambda" className="text-[#0073bb] hover:underline">
              Functions
            </Link>
            <span>/</span>
            <span className="text-[#16191f] font-mono">{fn.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold text-[#16191f]">{fn.name}</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#137333]"></span>
              Active
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
              {fn.runtime}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
              {fn.architectures?.[0] || "x86_64"}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-[12px] text-[#545b64]">
            <span className="font-mono text-[11px] truncate max-w-xl">{fn.arn}</span>
            <span>|</span>
            <span>Memory: {fn.memorySize} MB</span>
            <span>|</span>
            <span>Timeout: {fn.timeout}s</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setActiveTab("test")}
            className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07] transition-colors shadow-xs"
          >
            Test
          </button>

          <button
            onClick={() => setShowActionsDropdown(!showActionsDropdown)}
            className="px-3 py-1.5 border border-[#545b64] text-[#16191f] rounded-sm text-[13px] font-medium hover:bg-[#f2f3f3] flex items-center gap-1.5"
          >
            Actions
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>

          {showActionsDropdown && (
            <div className="absolute right-0 top-10 w-44 bg-white border border-[#d5dbdb] rounded-sm shadow-lg z-20 py-1 text-[13px]">
              <button
                onClick={() => {
                  setShowActionsDropdown(false);
                  setShowDeleteModal(true);
                }}
                className="w-full text-left px-4 py-2 text-[#d13212] hover:bg-[#fdf2e9]"
              >
                Delete function
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs (Code, Test, Configuration, Aliases, Monitoring) */}
      <div className="flex items-center gap-2 border-b border-[#eaeded] text-[13px] bg-white px-2">
        {(["code", "test", "configuration", "aliases", "monitoring"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 border-b-2 font-medium capitalize transition-colors ${
              activeTab === tab
                ? "border-[#0073bb] text-[#0073bb]"
                : "border-transparent text-[#545b64] hover:text-[#16191f]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CODE */}
      {/* ========================================================= */}
      {activeTab === "code" && (
        <div className="space-y-4">
          {/* Code Editor Header */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 awsui-shadow">
            <div>
              <h2 className="text-[15px] font-bold text-[#16191f]">Code source</h2>
              <p className="text-[12px] text-[#545b64] mt-0.5">
                Edit and test the function code in the browser editor. Click Deploy to update the emulator.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {deploySuccess && (
                <span className="text-[12px] text-[#137333] font-semibold bg-[#e6f4ea] px-3 py-1 rounded border border-[#ceead6]">
                  Changes deployed successfully
                </span>
              )}
              {codeDirty && (
                <span className="text-[12px] text-[#b05d00] font-medium bg-[#fef7e0] px-3 py-1 rounded border border-[#f5d98b]">
                  Changes not deployed
                </span>
              )}
              <button
                onClick={handleDeploy}
                disabled={isPending || !codeDirty}
                className="px-4 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07] disabled:opacity-40 transition-colors"
              >
                {isPending ? "Deploying..." : "Deploy"}
              </button>
            </div>
          </div>

          {/* Integrated Code Editor & File Tree */}
          <div className="border border-[#1e1e1e] rounded overflow-hidden grid grid-cols-1 md:grid-cols-5 bg-[#1e1e1e]">
            {/* File Tree Left Sidebar */}
            <div className="md:col-span-1 bg-[#252526] border-r border-[#333333] p-3 text-[12px] text-[#cccccc]">
              <div className="font-semibold text-[11px] uppercase tracking-wider text-[#888888] mb-2 px-1">
                Files
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#37373d] text-white font-mono cursor-pointer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span>{mainFileName}</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded text-[#999999] hover:bg-[#2a2d2e] font-mono cursor-pointer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span>package.json</span>
                </div>
              </div>

              <div className="mt-8 border-t border-[#333333] pt-4 px-1 text-[11px] text-[#888888]">
                <div>Runtime: {fn.runtime}</div>
                <div className="mt-1 font-mono">Handler: {fn.handler}</div>
                <div className="mt-1">Package: {fn.packageType}</div>
              </div>
            </div>

            {/* Code Textarea Main View */}
            <div className="md:col-span-4 flex flex-col">
              <div className="bg-[#2d2d2d] px-4 py-2 border-b border-[#333333] text-[12px] font-mono text-[#d4d4d4] flex items-center justify-between">
                <span>{mainFileName}</span>
                <span className="text-[11px] text-[#858585]">UTF-8 • JavaScript / ECMAScript</span>
              </div>
              <textarea
                value={codeContent}
                onChange={(e) => handleCodeChange(e.target.value)}
                rows={18}
                className="w-full flex-1 bg-[#1e1e1e] text-[#d4d4d4] p-4 font-mono text-[13px] leading-relaxed focus:outline-none resize-none selection:bg-[#264f78]"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Runtime Settings Info Tile */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-4 awsui-shadow">
            <h3 className="text-[14px] font-bold text-[#16191f] mb-3">Runtime settings</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
              <div>
                <span className="text-[11px] text-[#545b64] uppercase font-bold">Runtime</span>
                <div className="font-semibold text-[#16191f] mt-0.5">{fn.runtime}</div>
              </div>
              <div>
                <span className="text-[11px] text-[#545b64] uppercase font-bold">Handler</span>
                <div className="font-mono text-[#0073bb] mt-0.5">{fn.handler}</div>
              </div>
              <div>
                <span className="text-[11px] text-[#545b64] uppercase font-bold">Architecture</span>
                <div className="font-mono text-[#16191f] mt-0.5">{fn.architectures?.[0] || "x86_64"}</div>
              </div>
              <div>
                <span className="text-[11px] text-[#545b64] uppercase font-bold">Code size</span>
                <div className="font-mono text-[#16191f] mt-0.5">
                  {(fn.codeSize / 1024).toFixed(1)} KB ({fn.codeSize} bytes)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: TEST */}
      {/* ========================================================= */}
      {activeTab === "test" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 awsui-shadow">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#eaeded] pb-3">
              <div>
                <h2 className="text-[16px] font-bold text-[#16191f]">Test event</h2>
                <p className="text-[12px] text-[#545b64] mt-0.5">
                  Choose a standard AWS template or supply custom JSON input to invoke the function on the emulator.
                </p>
              </div>

              <button
                onClick={handleExecuteTest}
                disabled={isPending}
                className="px-5 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07] disabled:opacity-50 transition-colors shadow-xs"
              >
                {isPending ? "Invoking function..." : "Test"}
              </button>
            </div>

            {/* Template Selector */}
            <div className="max-w-md">
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Event template
              </label>
              <select
                value={selectedPresetId}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white focus:outline-none focus:border-[#0073bb]"
              >
                {TEST_EVENT_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Event JSON Editor */}
            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Event JSON payload
              </label>
              <div className="border border-[#1e1e1e] rounded overflow-hidden">
                <div className="bg-[#2d2d2d] px-3 py-1 text-[11px] font-mono text-[#858585]">
                  JSON Input
                </div>
                <textarea
                  rows={9}
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  className="w-full bg-[#1e1e1e] text-[#d4d4d4] p-3 font-mono text-[12px] leading-relaxed focus:outline-none resize-none"
                  spellCheck={false}
                />
              </div>
            </div>
          </div>

          {/* Execution Results Pane */}
          {invokeResult && (
            <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 awsui-shadow">
              <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${
                      invokeResult.isError ? "bg-[#d13212]" : "bg-[#1d8102]"
                    }`}
                  />
                  <h3 className="text-[16px] font-bold text-[#16191f]">
                    Execution result: {invokeResult.isError ? "Failed" : "Succeeded"}
                  </h3>
                </div>
                <span className="text-[12px] font-mono text-[#545b64]">
                  Status: {invokeResult.statusCode}
                </span>
              </div>

              {/* Execution Metrics Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-[#f2f3f3] rounded border border-[#eaeded] text-[12px]">
                <div>
                  <span className="text-[#545b64]">Duration:</span>
                  <div className="font-mono font-bold text-[#16191f]">{invokeResult.durationMs} ms</div>
                </div>
                <div>
                  <span className="text-[#545b64]">Billed duration:</span>
                  <div className="font-mono font-bold text-[#16191f]">{invokeResult.billedDurationMs} ms</div>
                </div>
                <div>
                  <span className="text-[#545b64]">Memory size:</span>
                  <div className="font-mono font-bold text-[#16191f]">{invokeResult.memorySizeMb} MB</div>
                </div>
                <div>
                  <span className="text-[#545b64]">Max memory used:</span>
                  <div className="font-mono font-bold text-[#16191f]">{invokeResult.maxMemoryUsedMb} MB</div>
                </div>
              </div>

              {/* Response Payload */}
              <div>
                <h4 className="text-[13px] font-bold text-[#16191f] mb-1">Response</h4>
                <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-3 rounded font-mono text-[12px] overflow-x-auto leading-relaxed border border-[#333333]">
                  {invokeResult.payload}
                </pre>
              </div>

              {/* CloudWatch Function Logs */}
              <div>
                <h4 className="text-[13px] font-bold text-[#16191f] mb-1">Function Logs</h4>
                <pre className="bg-[#0f1117] text-[#4af626] p-3 rounded font-mono text-[11px] overflow-x-auto leading-relaxed border border-[#222]">
                  {invokeResult.logs}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: CONFIGURATION */}
      {/* ========================================================= */}
      {activeTab === "configuration" && (
        <div className="space-y-6">
          {/* General Configuration */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 awsui-shadow">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <div>
                <h3 className="text-[15px] font-bold text-[#16191f]">General configuration</h3>
                <p className="text-[12px] text-[#545b64]">
                  Memory, compute limits, and execution timeouts.
                </p>
              </div>
              <button
                onClick={() => setShowConfigModal(true)}
                className="px-3 py-1 bg-[#0073bb] text-white rounded text-[12px] font-medium hover:bg-[#005a9e]"
              >
                Edit
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-[13px]">
              <div>
                <div className="text-[11px] text-[#545b64] uppercase font-bold">Description</div>
                <div className="text-[#16191f] mt-1">{fn.description || "None"}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#545b64] uppercase font-bold">Memory</div>
                <div className="font-mono text-[#0073bb] font-bold mt-1">{fn.memorySize} MB</div>
              </div>
              <div>
                <div className="text-[11px] text-[#545b64] uppercase font-bold">Timeout</div>
                <div className="font-mono text-[#0073bb] font-bold mt-1">{fn.timeout} sec</div>
              </div>
              <div>
                <div className="text-[11px] text-[#545b64] uppercase font-bold">Ephemeral storage (/tmp)</div>
                <div className="font-mono text-[#16191f] mt-1">{fn.ephemeralStorage} MB</div>
              </div>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 awsui-shadow">
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-3">
              <div>
                <h3 className="text-[15px] font-bold text-[#16191f]">Environment variables</h3>
                <p className="text-[12px] text-[#545b64]">
                  Key-value pairs accessible from process.env or os.environ in your code.
                </p>
              </div>
              <button
                onClick={() => setShowEnvModal(true)}
                className="px-3 py-1 bg-[#0073bb] text-white rounded text-[12px] font-medium hover:bg-[#005a9e]"
              >
                Edit
              </button>
            </div>

            {Object.keys(fn.environmentVariables).length === 0 ? (
              <div className="p-4 text-center text-[#545b64] text-[13px] bg-[#fafafa] border border-dashed border-[#d5dbdb] rounded">
                No environment variables defined for this function.
              </div>
            ) : (
              <div className="border border-[#eaeded] rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-[12px]">
                  <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                    <tr>
                      <th className="py-2 px-3">Key</th>
                      <th className="py-2 px-3">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaeded]">
                    {Object.entries(fn.environmentVariables).map(([k, v]) => (
                      <tr key={k}>
                        <td className="py-2 px-3 font-mono font-semibold text-[#16191f]">{k}</td>
                        <td className="py-2 px-3 font-mono text-[#545b64]">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ALIASES & VERSIONS */}
      {/* ========================================================= */}
      {activeTab === "aliases" && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-4 awsui-shadow">
          <h3 className="text-[15px] font-bold text-[#16191f]">Function Versions</h3>
          <p className="text-[12px] text-[#545b64]">
            AWS Lambda manages versioning for deployment safety. By default, edits update the $LATEST draft version.
          </p>

          <div className="border border-[#eaeded] rounded overflow-hidden">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-semibold">
                <tr>
                  <th className="py-2 px-3">Version</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Last modified</th>
                  <th className="py-2 px-3">Code Sha256</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#0073bb]">$LATEST</td>
                  <td className="py-2.5 px-3 text-[#545b64]">Draft version representing current code</td>
                  <td className="py-2.5 px-3 text-[#545b64]">{new Date(fn.lastModified).toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-[#545b64] max-w-xs truncate">
                    {fn.codeSha256 || "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: MONITORING */}
      {/* ========================================================= */}
      {activeTab === "monitoring" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#d5dbdb] rounded-sm p-4 flex items-center justify-between awsui-shadow">
            <div>
              <h3 className="text-[15px] font-bold text-[#16191f]">CloudWatch metrics</h3>
              <p className="text-[12px] text-[#545b64]">
                Local execution metrics logged from emulator invocations.
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#545b64]">Log Group: /aws/lambda/{fn.name}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
              <span className="text-[11px] text-[#545b64] uppercase font-bold">Invocations</span>
              <div className="text-[26px] font-bold text-[#16191f] mt-1">12</div>
              <div className="h-10 mt-3 flex items-end gap-1">
                {[2, 4, 3, 7, 5, 8, 12].map((v, i) => (
                  <div
                    key={i}
                    style={{ height: `${(v / 12) * 100}%` }}
                    className="flex-1 bg-[#ec7211] rounded-xs"
                  />
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
              <span className="text-[11px] text-[#545b64] uppercase font-bold">Duration (Avg)</span>
              <div className="text-[26px] font-bold text-[#16191f] mt-1">24.8 ms</div>
              <div className="h-10 mt-3 flex items-end gap-1">
                {[18, 22, 28, 25, 21, 24, 25].map((v, i) => (
                  <div
                    key={i}
                    style={{ height: `${(v / 30) * 100}%` }}
                    className="flex-1 bg-[#0073bb] rounded-xs"
                  />
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
              <span className="text-[11px] text-[#545b64] uppercase font-bold">Error count</span>
              <div className="text-[26px] font-bold text-[#1d8102] mt-1">0</div>
              <span className="text-[11px] text-[#545b64] mt-1 block">100% success rate</span>
            </div>

            <div className="bg-white border border-[#eaeded] p-4 rounded-sm awsui-shadow">
              <span className="text-[11px] text-[#545b64] uppercase font-bold">Throttles</span>
              <div className="text-[26px] font-bold text-[#16191f] mt-1">0</div>
              <span className="text-[11px] text-[#545b64] mt-1 block">No throttles recorded</span>
            </div>
          </div>
        </div>
      )}

      {/* Edit General Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleSaveGeneralConfig}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-lg p-6 space-y-4"
          >
            <h3 className="text-[17px] font-bold text-[#16191f]">Edit general configuration</h3>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">Description</label>
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Memory: <span className="font-mono text-[#0073bb]">{editMemory} MB</span>
              </label>
              <input
                type="range"
                min="128"
                max="3008"
                step="64"
                value={editMemory}
                onChange={(e) => setEditMemory(parseInt(e.target.value, 10))}
                className="w-full accent-[#ec7211]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#16191f] mb-1">
                Timeout: <span className="font-mono text-[#0073bb]">{editTimeout} sec</span>
              </label>
              <input
                type="range"
                min="1"
                max="120"
                value={editTimeout}
                onChange={(e) => setEditTimeout(parseInt(e.target.value, 10))}
                className="w-full accent-[#ec7211]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded text-[13px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 bg-[#ec7211] text-white rounded text-[13px] font-medium hover:bg-[#eb5f07]"
              >
                {isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Env Vars Modal */}
      {showEnvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEnvVars}
            className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-lg p-6 space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-[#eaeded] pb-2">
              <h3 className="text-[17px] font-bold text-[#16191f]">Edit environment variables</h3>
              <button
                type="button"
                onClick={() => setEnvList([...envList, { key: "", value: "" }])}
                className="px-2.5 py-1 border border-[#545b64] text-[12px] rounded hover:bg-[#f2f3f3]"
              >
                + Add variable
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {envList.length === 0 ? (
                <div className="text-[13px] text-[#545b64] text-center py-6">
                  No environment variables. Click &quot;+ Add variable&quot; to define one.
                </div>
              ) : (
                envList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Key"
                      value={item.key}
                      onChange={(e) => {
                        const updated = [...envList];
                        updated[idx].key = e.target.value;
                        setEnvList(updated);
                      }}
                      className="flex-1 px-2.5 py-1 border border-[#aab7b8] rounded font-mono text-[12px]"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={item.value}
                      onChange={(e) => {
                        const updated = [...envList];
                        updated[idx].value = e.target.value;
                        setEnvList(updated);
                      }}
                      className="flex-1 px-2.5 py-1 border border-[#aab7b8] rounded font-mono text-[12px]"
                    />
                    <button
                      type="button"
                      onClick={() => setEnvList(envList.filter((_, i) => i !== idx))}
                      className="text-[#d13212] px-2 py-1 font-bold"
                    >
                      &times;
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#eaeded] pt-3">
              <button
                type="button"
                onClick={() => setShowEnvModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded text-[13px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-1.5 bg-[#ec7211] text-white rounded text-[13px] font-medium hover:bg-[#eb5f07]"
              >
                {isPending ? "Saving..." : "Save variables"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-sm border border-[#d5dbdb] awsui-shadow w-full max-w-md p-6">
            <h3 className="text-[17px] font-bold text-[#16191f]">Delete function</h3>
            <p className="text-[13px] text-[#545b64] mt-2">
              Are you sure you want to delete function{" "}
              <strong className="text-[#16191f] font-mono">{fn.name}</strong>?
              This will permanently delete the serverless function from the local emulator.
            </p>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-1.5 border border-[#545b64] rounded text-[13px] hover:bg-[#f2f3f3]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 bg-[#d13212] text-white rounded text-[13px] font-medium hover:bg-[#b02008]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
