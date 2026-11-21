"use client";

import { useState } from "react";

interface PushCommandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositoryName: string;
  repositoryUri: string;
  region?: string;
}

export default function PushCommandsModal({
  isOpen,
  onClose,
  repositoryName,
  repositoryUri,
  region = "us-east-1",
}: PushCommandsModalProps) {
  const [activeTab, setActiveTab] = useState<"nix" | "win">("nix");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (!isOpen) return null;

  const registryHost = repositoryUri.split("/")[0] || "127.0.0.1:9297";

  const nixCommands = [
    {
      step: 1,
      title: "Retrieve an authentication token and authenticate your Docker client to your registry.",
      desc: "Use the AWS CLI:",
      cmd: `aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${registryHost}`,
    },
    {
      step: 2,
      title: "Build your Docker image using the following command.",
      desc: "For information on building a Docker file from scratch, see the AWS guide. You can skip this step if your image is already built:",
      cmd: `docker build -t ${repositoryName} .`,
    },
    {
      step: 3,
      title: "After the build completes, tag your image so you can push the image to this repository:",
      desc: "",
      cmd: `docker tag ${repositoryName}:latest ${repositoryUri}:latest`,
    },
    {
      step: 4,
      title: "Run the following command to push this image to your newly created AWS repository:",
      desc: "",
      cmd: `docker push ${repositoryUri}:latest`,
    },
  ];

  const winCommands = [
    {
      step: 1,
      title: "Retrieve an authentication token and authenticate your Docker client to your registry.",
      desc: "Use the AWS Tools for PowerShell or AWS CLI:",
      cmd: `aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${registryHost}`,
    },
    {
      step: 2,
      title: "Build your Docker image using the following command.",
      desc: "You can skip this step if your image is already built:",
      cmd: `docker build -t ${repositoryName} .`,
    },
    {
      step: 3,
      title: "After the build completes, tag your image so you can push the image to this repository:",
      desc: "",
      cmd: `docker tag ${repositoryName}:latest ${repositoryUri}:latest`,
    },
    {
      step: 4,
      title: "Run the following command to push this image to your newly created AWS repository:",
      desc: "",
      cmd: `docker push ${repositoryUri}:latest`,
    },
  ];

  const activeCommands = activeTab === "nix" ? nixCommands : winCommands;

  function copyText(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function handleCopyAll() {
    const all = activeCommands.map((c) => c.cmd).join("\n\n");
    navigator.clipboard.writeText(all);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-sm shadow-xl max-w-[760px] w-full border border-[#d5dbdb] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaeded]">
          <h2 className="text-[17px] font-bold text-[#16191f]">
            Push commands for {repositoryName}
          </h2>
          <button
            onClick={onClose}
            className="text-[#545b64] hover:text-[#16191f] text-[18px] font-bold leading-none"
          >
            x
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-[13px]">
          <p className="text-[#545b64] leading-relaxed">
            Follow the steps below to authenticate with the Docker CLI and push container images to this repository.
          </p>

          {/* OS Switcher */}
          <div className="flex border-b border-[#eaeded]">
            <button
              type="button"
              onClick={() => setActiveTab("nix")}
              className={`px-4 py-2 text-[13px] font-bold border-b-2 transition-colors ${
                activeTab === "nix"
                  ? "border-[#ec7211] text-[#ec7211]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              macOS / Linux
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("win")}
              className={`px-4 py-2 text-[13px] font-bold border-b-2 transition-colors ${
                activeTab === "win"
                  ? "border-[#ec7211] text-[#ec7211]"
                  : "border-transparent text-[#545b64] hover:text-[#16191f]"
              }`}
            >
              Windows
            </button>
          </div>

          {/* Command Steps */}
          <div className="space-y-4">
            {activeCommands.map((c, idx) => (
              <div key={c.step} className="space-y-1.5">
                <div className="font-semibold text-[#16191f]">
                  {c.step}. {c.title}
                </div>
                {c.desc && <div className="text-[12px] text-[#545b64]">{c.desc}</div>}
                <div className="relative bg-[#f8f9fa] border border-[#eaeded] rounded-sm p-3 font-mono text-[12px] text-[#16191f] break-all flex items-center justify-between gap-3 group">
                  <span className="select-all">{c.cmd}</span>
                  <button
                    type="button"
                    onClick={() => copyText(c.cmd, idx)}
                    style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[12px] font-semibold text-[#16191f] hover:bg-[#f2f3f3] shrink-0 transition-colors"
                  >
                    {copiedIndex === idx ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#eaeded] bg-[#fafafa]">
          <button
            type="button"
            onClick={handleCopyAll}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="h-[32px] px-3 bg-white border border-[#aab7b8] rounded-sm text-[13px] font-semibold text-[#16191f] hover:bg-[#f2f3f3] transition-colors"
          >
            {copiedAll ? "Copied all commands" : "Copy all"}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            className="h-[32px] px-4 bg-[#ec7211] text-white rounded-sm text-[13px] font-bold hover:bg-[#eb5f07] transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
