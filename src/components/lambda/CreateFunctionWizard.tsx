/**
 * src/components/lambda/CreateFunctionWizard.tsx – AWS Lambda Create Function Wizard.
 * Submits directly to the live emulator via createLiveFunction action.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LAMBDA_RUNTIMES, LambdaRuntimeOption } from "@/lib/lambda-data";
import { createLiveFunction } from "@/app/lambda/actions";

export default function CreateFunctionWizard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Wizard authoring type
  const [authoringType, setAuthoringType] = useState<"scratch" | "blueprint" | "container">("scratch");

  // Basic Information
  const [functionName, setFunctionName] = useState("");
  const [runtime, setRuntime] = useState<string>("nodejs20.x");
  const [architecture, setArchitecture] = useState<"x86_64" | "arm64">("x86_64");
  const [description, setDescription] = useState("");

  // Advanced Configuration
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [memorySize, setMemorySize] = useState<number>(128);
  const [timeout, setTimeout] = useState<number>(3);
  const [ephemeralStorage, setEphemeralStorage] = useState<number>(512);

  // Environment variables
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([]);

  // Code editor preview / override
  const selectedRuntimePreset: LambdaRuntimeOption =
    LAMBDA_RUNTIMES.find((r) => r.id === runtime) || LAMBDA_RUNTIMES[0];
  const [codeContent, setCodeContent] = useState<string>(selectedRuntimePreset.starterCode);

  const [formError, setFormError] = useState<string | null>(null);

  function handleRuntimeChange(newRuntime: string) {
    setRuntime(newRuntime);
    const preset = LAMBDA_RUNTIMES.find((r) => r.id === newRuntime);
    if (preset) {
      setCodeContent(preset.starterCode);
    }
  }

  function handleAddEnvVar() {
    setEnvVars([...envVars, { key: "", value: "" }]);
  }

  function handleRemoveEnvVar(index: number) {
    setEnvVars(envVars.filter((_, i) => i !== index));
  }

  function handleEnvVarChange(index: number, field: "key" | "value", val: string) {
    const updated = [...envVars];
    updated[index][field] = val;
    setEnvVars(updated);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const trimmedName = functionName.trim();
    if (!trimmedName) {
      setFormError("Function name is required.");
      return;
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(trimmedName)) {
      setFormError("Function name must contain only alphanumeric characters, hyphens, and underscores.");
      return;
    }

    const envMap: Record<string, string> = {};
    for (const item of envVars) {
      if (item.key.trim()) {
        envMap[item.key.trim()] = item.value;
      }
    }

    startTransition(async () => {
      const res = await createLiveFunction({
        name: trimmedName,
        runtime,
        description: description.trim() || undefined,
        architecture,
        memorySize,
        timeout,
        ephemeralStorage,
        environmentVariables: Object.keys(envMap).length > 0 ? envMap : undefined,
        codeContent,
      });

      if (res.success) {
        router.push(`/lambda/functions/${trimmedName}`);
      } else {
        setFormError(res.error || "Failed to create function in AWS emulator.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl pb-16">
      {/* Wizard Header */}
      <div>
        <div className="flex items-center gap-2 text-[12px] text-[#545b64] mb-1">
          <Link href="/lambda" className="text-[#0073bb] hover:underline">
            Functions
          </Link>
          <span>/</span>
          <span className="text-[#16191f]">Create function</span>
        </div>
        <h1 className="text-[22px] font-bold text-[#16191f]">Create function</h1>
        <p className="text-[13px] text-[#545b64] mt-0.5">
          Configure and deploy a serverless function to the local AWS Emulator.
        </p>
      </div>

      {formError && (
        <div className="p-4 bg-[#fdf2e9] border-l-4 border-[#d13212] text-[13px] text-[#16191f]">
          <span className="font-bold text-[#d13212]">Error:</span> {formError}
        </div>
      )}

      {/* Creation Mode Cards */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 awsui-shadow">
        <label className="text-[13px] font-bold text-[#16191f] block mb-3">
          Choose creation method
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            onClick={() => setAuthoringType("scratch")}
            className={`cursor-pointer border-2 rounded-sm p-4 transition-all ${
              authoringType === "scratch"
                ? "border-[#ec7211] bg-[#fbf5ed]"
                : "border-[#eaeded] hover:border-[#aab7b8]"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <input
                type="radio"
                name="authoringType"
                checked={authoringType === "scratch"}
                onChange={() => setAuthoringType("scratch")}
                className="text-[#ec7211]"
              />
              <span className="font-bold text-[13px] text-[#16191f]">Author from scratch</span>
            </div>
            <p className="text-[12px] text-[#545b64] ml-5">
              Start with simple hello-world code that you can customize in the browser editor.
            </p>
          </div>

          <div
            onClick={() => setAuthoringType("blueprint")}
            className={`cursor-pointer border-2 rounded-sm p-4 transition-all opacity-60 ${
              authoringType === "blueprint"
                ? "border-[#ec7211] bg-[#fbf5ed]"
                : "border-[#eaeded] hover:border-[#aab7b8]"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <input
                type="radio"
                name="authoringType"
                checked={authoringType === "blueprint"}
                onChange={() => setAuthoringType("blueprint")}
                disabled
              />
              <span className="font-bold text-[13px] text-[#16191f]">Use a blueprint</span>
            </div>
            <p className="text-[12px] text-[#545b64] ml-5">
              Build from preconfigured templates for S3, SQS, or DynamoDB integrations.
            </p>
          </div>

          <div
            onClick={() => setAuthoringType("container")}
            className={`cursor-pointer border-2 rounded-sm p-4 transition-all opacity-60 ${
              authoringType === "container"
                ? "border-[#ec7211] bg-[#fbf5ed]"
                : "border-[#eaeded] hover:border-[#aab7b8]"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <input
                type="radio"
                name="authoringType"
                checked={authoringType === "container"}
                onChange={() => setAuthoringType("container")}
                disabled
              />
              <span className="font-bold text-[13px] text-[#16191f]">Container image</span>
            </div>
            <p className="text-[12px] text-[#545b64] ml-5">
              Deploy a Docker container image packaged from Amazon ECR.
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-5 awsui-shadow">
        <h2 className="text-[15px] font-bold text-[#16191f] border-b border-[#eaeded] pb-2">
          Basic information
        </h2>

        <div>
          <label className="block text-[13px] font-bold text-[#16191f] mb-1">
            Function name <span className="text-[#d13212]">*</span>
          </label>
          <p className="text-[12px] text-[#545b64] mb-2">
            The name can contain letters, numbers, hyphens, and underscores (up to 64 characters).
          </p>
          <input
            type="text"
            required
            placeholder="e.g. process-orders-handler"
            value={functionName}
            onChange={(e) => setFunctionName(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] focus:outline-none focus:border-[#0073bb]"
          />
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#16191f] mb-1">
            Runtime <span className="text-[#d13212]">*</span>
          </label>
          <p className="text-[12px] text-[#545b64] mb-2">
            Choose the language and execution environment to run your function.
          </p>
          <select
            value={runtime}
            onChange={(e) => handleRuntimeChange(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] bg-white focus:outline-none focus:border-[#0073bb]"
          >
            {LAMBDA_RUNTIMES.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name} ({rt.family})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#16191f] mb-1">
            Architecture
          </label>
          <p className="text-[12px] text-[#545b64] mb-2">
            Instruction set architecture for the function compute environment.
          </p>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-[13px] text-[#16191f] cursor-pointer">
              <input
                type="radio"
                name="architecture"
                value="x86_64"
                checked={architecture === "x86_64"}
                onChange={() => setArchitecture("x86_64")}
              />
              <span>x86_64</span>
            </label>
            <label className="flex items-center gap-2 text-[13px] text-[#16191f] cursor-pointer">
              <input
                type="radio"
                name="architecture"
                value="arm64"
                checked={architecture === "arm64"}
                onChange={() => setArchitecture("arm64")}
              />
              <span>arm64 (AWS Graviton)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#16191f] mb-1">
            Description
          </label>
          <input
            type="text"
            placeholder="Optional description of this serverless function..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 border border-[#aab7b8] rounded-sm text-[13px] focus:outline-none focus:border-[#0073bb]"
          />
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#16191f] mb-1">
            Execution role
          </label>
          <div className="p-3 bg-[#f2f3f3] border border-[#d5dbdb] rounded-sm text-[12px] text-[#545b64] max-w-md font-mono">
            arn:aws:iam::000000000000:role/lambda-basic-execution-role
          </div>
          <span className="text-[11px] text-[#545b64] mt-1 block">
            Grants AWS Lambda permission to write logs to CloudWatch.
          </span>
        </div>
      </div>

      {/* Advanced Settings Accordion */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm awsui-shadow overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-[#fafafa]"
        >
          <div className="flex items-center gap-2">
            <svg
              className={`w-4 h-4 text-[#545b64] transition-transform ${
                showAdvanced ? "rotate-90" : ""
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="font-bold text-[14px] text-[#16191f]">
              Advanced settings (Memory, Timeout, Environment variables)
            </span>
          </div>
          <span className="text-[12px] text-[#0073bb]">
            {showAdvanced ? "Hide settings" : "Expand settings"}
          </span>
        </button>

        {showAdvanced && (
          <div className="p-5 border-t border-[#eaeded] space-y-6 text-[13px]">
            {/* Memory & Timeout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block font-bold text-[#16191f] mb-1">
                  Memory: <span className="font-mono text-[#0073bb]">{memorySize} MB</span>
                </label>
                <p className="text-[11px] text-[#545b64] mb-2">
                  Allocated compute memory (128 MB – 10,240 MB)
                </p>
                <input
                  type="range"
                  min="128"
                  max="3008"
                  step="64"
                  value={memorySize}
                  onChange={(e) => setMemorySize(parseInt(e.target.value, 10))}
                  className="w-full accent-[#ec7211]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#16191f] mb-1">
                  Timeout: <span className="font-mono text-[#0073bb]">{timeout} seconds</span>
                </label>
                <p className="text-[11px] text-[#545b64] mb-2">
                  Execution maximum duration (1 sec – 900 sec)
                </p>
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={timeout}
                  onChange={(e) => setTimeout(parseInt(e.target.value, 10))}
                  className="w-full accent-[#ec7211]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#16191f] mb-1">
                  Ephemeral storage (/tmp)
                </label>
                <p className="text-[11px] text-[#545b64] mb-2">
                  Disk storage space in /tmp directory
                </p>
                <select
                  value={ephemeralStorage}
                  onChange={(e) => setEphemeralStorage(parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-1.5 border border-[#aab7b8] rounded-sm bg-white"
                >
                  <option value={512}>512 MB (Default)</option>
                  <option value={1024}>1024 MB (1 GB)</option>
                  <option value={2048}>2048 MB (2 GB)</option>
                  <option value={5120}>5120 MB (5 GB)</option>
                </select>
              </div>
            </div>

            {/* Environment Variables */}
            <div className="border-t border-[#eaeded] pt-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-bold text-[#16191f]">Environment variables</h4>
                  <p className="text-[11px] text-[#545b64]">
                    Key-value pairs accessible by your function code at runtime.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddEnvVar}
                  className="px-2.5 py-1 border border-[#545b64] text-[#16191f] rounded text-[12px] font-medium hover:bg-[#f2f3f3]"
                >
                  + Add environment variable
                </button>
              </div>

              {envVars.length === 0 ? (
                <div className="p-3 bg-[#fafafa] border border-dashed border-[#d5dbdb] rounded text-center text-[#545b64] text-[12px]">
                  No environment variables added.
                </div>
              ) : (
                <div className="space-y-2">
                  {envVars.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Key (e.g. DATABASE_URL)"
                        value={item.key}
                        onChange={(e) => handleEnvVarChange(idx, "key", e.target.value)}
                        className="flex-1 px-2.5 py-1 border border-[#aab7b8] rounded font-mono text-[12px]"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={item.value}
                        onChange={(e) => handleEnvVarChange(idx, "value", e.target.value)}
                        className="flex-1 px-2.5 py-1 border border-[#aab7b8] rounded font-mono text-[12px]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveEnvVar(idx)}
                        className="text-[#d13212] hover:text-[#a02008] px-2 py-1 font-bold"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Starter Code Preview */}
      <div className="bg-white border border-[#d5dbdb] rounded-sm p-5 space-y-3 awsui-shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-[#16191f]">Function starter code</h2>
            <p className="text-[12px] text-[#545b64]">
              This code will be automatically zipped and deployed as the initial version.
            </p>
          </div>
          <span className="font-mono text-[12px] bg-[#f2f3f3] px-2 py-0.5 border border-[#d5dbdb] rounded text-[#545b64]">
            Handler: {selectedRuntimePreset.defaultHandler}
          </span>
        </div>

        <div className="border border-[#1e1e1e] rounded overflow-hidden">
          <div className="bg-[#2d2d2d] px-3 py-1.5 text-[11px] font-mono text-[#d4d4d4] flex items-center justify-between">
            <span>
              {selectedRuntimePreset.defaultExtension === "py"
                ? "lambda_function.py"
                : `index.${selectedRuntimePreset.defaultExtension}`}
            </span>
            <span className="text-[#888888]">{selectedRuntimePreset.name}</span>
          </div>
          <textarea
            rows={10}
            value={codeContent}
            onChange={(e) => setCodeContent(e.target.value)}
            className="w-full bg-[#1e1e1e] text-[#d4d4d4] p-3 font-mono text-[12px] focus:outline-none resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/lambda"
          className="px-4 py-1.5 border border-[#545b64] text-[#16191f] rounded-sm text-[13px] font-medium hover:bg-[#f2f3f3]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-1.5 bg-[#ec7211] text-white rounded-sm text-[13px] font-medium hover:bg-[#eb5f07] disabled:opacity-50 transition-colors shadow-xs"
        >
          {isPending ? "Creating on AWS Emulator..." : "Create function"}
        </button>
      </div>
    </form>
  );
}
