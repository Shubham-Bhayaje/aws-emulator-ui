/**
 * src/components/ec2/EC2TerminalModal.tsx – Real EC2 Instance Connect Web Terminal.
 * Backed by dedicated Amazon Linux 2023 Docker container per EC2 instance.
 * Executes commands directly in the container via docker exec.
 * Includes interactive GNU Nano and Vim editors directly integrated with the container filesystem.
 * Zero emojis, Cloudscape enterprise styling.
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { EC2Instance } from "@/lib/ec2-data";
import {
  ensureEC2ContainerAction,
  executeEC2TerminalCommandAction,
  readEC2ContainerFileAction,
  writeEC2ContainerFileAction,
} from "@/app/ec2/actions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  instance: EC2Instance;
}

interface CommandHistoryItem {
  type: "command" | "output" | "banner" | "error";
  text: string;
}

interface EditorState {
  type: "nano" | "vi";
  filename: string;
  content: string;
  isModified: boolean;
  statusMessage?: string;
  viMode?: "NORMAL" | "INSERT";
  viCmd?: string;
}

export default function EC2TerminalModal({ isOpen, onClose, instance }: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectedTime, setConnectedTime] = useState(0);
  const [inputVal, setInputVal] = useState("");
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState(false);

  // Container state
  const [containerReady, setContainerReady] = useState(false);
  const [containerName, setContainerName] = useState<string>("");
  const [containerError, setContainerError] = useState<string | null>(null);

  // Active in-terminal editor (nano or vi)
  const [activeEditor, setActiveEditor] = useState<EditorState | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);

  const isInstanceUbuntu =
    !instance.amiName?.toLowerCase().includes("amazon") ||
    instance.platform?.toLowerCase().includes("ubuntu") ||
    instance.amiName?.toLowerCase().includes("ubuntu") ||
    instance.amiId === "ami-080e1f13689e07408";

  const [currentUser, setCurrentUser] = useState(isInstanceUbuntu ? "ubuntu" : "ec2-user");
  const privateIpFormatted = (instance.privateIp || "172.31.0.4").replace(/\./g, "-");
  const promptHost = `ip-${privateIpFormatted}`;
  const promptString = currentUser === "ubuntu" ? `${currentUser}@${promptHost}:~$ ` : `[${currentUser}@${promptHost} ~]$ `;

  // Initialize terminal session & spawn/ensure real Docker container
  useEffect(() => {
    if (!isOpen) return;

    const bannerText = isInstanceUbuntu
      ? `
Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8.0-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

  System information as of ${new Date().toUTCString()}:

  IPv4 address for eth0: ${instance.privateIp || "172.31.0.4"}
  Public IPv4 address:   ${instance.publicIp || "54.0.0.2"}
  Instance ID:           ${instance.id}
  Real Container:        ec2-instance-${instance.id.toLowerCase().replace(/[^a-z0-9_-]/g, "-")} (Full Ubuntu 24.04 LTS)

Pre-installed utilities: sudo (passwordless), apt, python3, pip, gcc, make, curl, wget, git, vim, nano, htop
Type 'help' to view available system commands.
`
      : `
   ,     #_
  ~\\_  ####_        Amazon Linux 2023 (Kernel 6.1 / Nitro Host)
 ~~  \\ ####\\       https://aws.amazon.com/linux/amazon-linux-2023/
 ~~   \\ ####\\      Connected to ${instance.id} via EC2 Instance Connect
~~     \\#_##\\     Public IPv4: ${instance.publicIp || "54.0.0.2"} | Private IPv4: ${instance.privateIp || "172.31.0.4"}
  ~~  __##_##
    ~~  ######     Real Docker Container: ec2-instance-${instance.id.toLowerCase().replace(/[^a-z0-9_-]/g, "-")}
      #####        Type 'help' to view available system commands.
       ###
`;

    setHistory([
      { type: "banner", text: bannerText },
      { type: "output", text: `Connecting to dedicated ${isInstanceUbuntu ? "Ubuntu 24.04" : "Amazon Linux 2023"} container...` },
    ]);
    setInputVal("");
    setConnectedTime(0);
    setActiveEditor(null);
    setContainerReady(false);
    setContainerError(null);

    // Call server action to ensure container is running
    ensureEC2ContainerAction({
      id: instance.id,
      privateIp: instance.privateIp,
      publicIp: instance.publicIp,
      platform: instance.platform,
      amiId: instance.amiId,
      amiName: instance.amiName,
    }).then((res) => {
      if (res.success) {
        setContainerReady(true);
        setContainerName(res.containerName);
        if (res.user) {
          setCurrentUser(res.user);
        }
        setHistory((prev) => [
          ...prev,
          {
            type: "output",
            text: `Container ${res.containerName} is ready (${res.osType === "ubuntu" ? "Ubuntu 24.04 LTS" : "Amazon Linux 2023"}, user: ${res.user}). Last login: ${new Date().toUTCString()} from 127.0.0.1`,
          },
        ]);
      } else {
        setContainerError(res.error || "Failed to initialize container");
        setContainerReady(true); // allow interaction even if error reported
        setHistory((prev) => [
          ...prev,
          {
            type: "error",
            text: `Warning: Container initialization encountered an issue: ${res.error}. Running commands will attempt reconnect.`,
          },
        ]);
      }
      setTimeout(() => inputRef.current?.focus(), 150);
    });
  }, [isOpen, instance]);

  // Session duration timer
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setConnectedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Auto-scroll on new output
  useEffect(() => {
    if (!activeEditor) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, activeEditor]);

  // Auto-focus editor textarea when opening editor
  useEffect(() => {
    if (activeEditor) {
      setTimeout(() => editorTextareaRef.current?.focus(), 100);
    }
  }, [activeEditor?.type, activeEditor?.filename]);

  if (!isOpen) return null;

  function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const cmd = inputVal.trim();
      if (cmd) {
        setCommandHistory((prev) => [...prev, cmd]);
        setHistoryIndex(-1);
      }
      setInputVal("");
      await executeCommand(cmd);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputVal(commandHistory[nextIndex] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputVal("");
      } else {
        setHistoryIndex(nextIndex);
        setInputVal(commandHistory[nextIndex] || "");
      }
    }
  }

  // Nano Editor operations
  async function saveNano() {
    if (!activeEditor) return;
    const content = activeEditor.content;
    const filename = activeEditor.filename;
    const res = await writeEC2ContainerFileAction(instance.id, filename, content);
    const lineCount = content.split("\n").length;
    if (res.success) {
      setActiveEditor((prev) =>
        prev
          ? {
              ...prev,
              isModified: false,
              statusMessage: `[ Wrote ${lineCount} lines to ${filename} in container ]`,
            }
          : null
      );
    } else {
      setActiveEditor((prev) =>
        prev
          ? {
              ...prev,
              statusMessage: `[ Error saving: ${res.error} ]`,
            }
          : null
      );
    }
  }

  async function exitNano() {
    if (!activeEditor) return;
    const content = activeEditor.content;
    const filename = activeEditor.filename;
    await writeEC2ContainerFileAction(instance.id, filename, content);
    const lineCount = content.split("\n").length;
    setHistory((prev) => [
      ...prev,
      { type: "output", text: `[ Closed nano: ${filename} saved to container (${lineCount} lines) ]` },
    ]);
    setActiveEditor(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function handleNanoKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.ctrlKey && (e.key === "x" || e.key === "X")) {
      e.preventDefault();
      exitNano();
    } else if (e.ctrlKey && (e.key === "o" || e.key === "O")) {
      e.preventDefault();
      saveNano();
    }
  }

  // Vi Editor operations
  async function saveAndExitVi() {
    if (!activeEditor) return;
    const content = activeEditor.content;
    const filename = activeEditor.filename;
    await writeEC2ContainerFileAction(instance.id, filename, content);
    const lineCount = content.split("\n").length;
    setHistory((prev) => [
      ...prev,
      { type: "output", text: `"${filename}" ${lineCount}L written to container` },
    ]);
    setActiveEditor(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function exitViWithoutSaving() {
    if (!activeEditor) return;
    setHistory((prev) => [
      ...prev,
      { type: "output", text: `[ Closed ${activeEditor.filename} ]` },
    ]);
    setActiveEditor(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function handleViKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setActiveEditor((prev) => (prev ? { ...prev, viMode: "NORMAL" } : null));
    }
  }

  async function executeCommand(rawCmd: string) {
    const cmd = rawCmd.trim();

    // Echo command line in history
    setHistory((prev) => [
      ...prev,
      { type: "command", text: `${promptString}${rawCmd}` },
    ]);

    if (!cmd) return;

    const [binary, ...args] = cmd.split(" ");
    const lowerBinary = binary.toLowerCase();

    // Client-side UI commands
    if (lowerBinary === "clear") {
      setHistory([]);
      return;
    }

    if (lowerBinary === "exit") {
      onClose();
      return;
    }

    if (lowerBinary === "help") {
      setHistory((prev) => [
        ...prev,
        {
          type: "output",
          text: currentUser === "ubuntu"
            ? `Ubuntu 24.04 LTS Full Container Environment:
  Commands run directly inside the dedicated container (ec2-instance-${instance.id}):
  - Standard Shell:   ls, cat, touch, rm, mkdir, cp, mv, grep, find, echo, tar, gzip, unzip
  - Text Editors:     nano <file>, vi/vim <file>
  - System Info:      whoami, id, pwd, uname -a, uptime, date
  - Diagnostics:      ps aux, top -b -n 1, htop, free -m, df -h, ip a, ip route
  - Network:          ping -c 3 <host>, curl <url>, wget <url>, dig <domain>, nslookup <domain>
  - Package Manager:  sudo apt update && sudo apt install -y <package> (full root sudo access)
  - Compilers & Dev:  gcc, g++, make, python3, pip, python3-venv, git, jq
  - Terminal Controls: clear, exit`
            : `Amazon Linux 2023 Real Container Environment:
  Commands run directly inside the dedicated container (ec2-instance-${instance.id}):
  - Standard Shell:  ls, cat, touch, rm, mkdir, cp, mv, grep, find, echo
  - Text Editors:    nano <file>, vi/vim <file> (also aliases 'vm')
  - System Info:     whoami, id, pwd, uname -a, uptime, date
  - Diagnostics:     ps aux, top -b -n 1, free -m, df -h, ip a, ip route
  - Network:         ping -c 3 <host>, curl <url>
  - Package Manager: sudo dnf install -y <package> (full root sudo access)
  - Runtime:         bash, python3, node
  - Terminal Controls: clear, exit`,
        },
      ]);
      return;
    }

    // Open GNU Nano Editor
    if (lowerBinary === "nano") {
      const targetFile = args[0] || "untitled.txt";
      const fileRes = await readEC2ContainerFileAction(instance.id, targetFile);
      const initialContent = fileRes.success ? fileRes.content : "";
      setActiveEditor({
        type: "nano",
        filename: targetFile,
        content: initialContent,
        isModified: false,
        statusMessage: fileRes.success
          ? `[ Read ${initialContent.split("\n").length} lines from container ]`
          : "[ New File ]",
      });
      return;
    }

    // Open Vim Editor (with auto-alias for vm)
    if (lowerBinary === "vm" || lowerBinary === "vi" || lowerBinary === "vim") {
      const targetFile = args[0] || "untitled.txt";
      const fileRes = await readEC2ContainerFileAction(instance.id, targetFile);
      const initialContent = fileRes.success ? fileRes.content : "";
      setActiveEditor({
        type: "vi",
        filename: targetFile,
        content: initialContent,
        isModified: false,
        viMode: "INSERT",
        statusMessage: fileRes.success
          ? `"${targetFile}" ${initialContent.split("\n").length}L`
          : `"${targetFile}" [New File]`,
      });
      return;
    }

    // Execute real command in Docker container
    setIsExecuting(true);
    try {
      const res = await executeEC2TerminalCommandAction(instance.id, cmd);
      if (res.stdout) {
        setHistory((prev) => [
          ...prev,
          { type: "output", text: res.stdout.replace(/\r\n/g, "\n").trimEnd() },
        ]);
      }
      if (res.stderr) {
        setHistory((prev) => [
          ...prev,
          { type: "error", text: res.stderr.replace(/\r\n/g, "\n").trimEnd() },
        ]);
      }
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        { type: "error", text: `Error: ${err.message}` },
      ]);
    } finally {
      setIsExecuting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 md:p-6">
      <div
        className={`bg-[#0d1117] border border-[#30363d] rounded-md shadow-2xl flex flex-col overflow-hidden transition-all ${
          isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-5xl h-[85vh]"
        }`}
      >
        {/* Terminal Header Toolbar */}
        <div className="bg-[#161b22] px-4 py-2.5 border-b border-[#30363d] flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ec7211]" />
              <span className="font-semibold text-[13px] text-white">
                EC2 Instance Connect
              </span>
            </div>
            <span className="text-[#484f58] text-[12px]">|</span>
            <span className="font-mono text-[12px] text-[#58a6ff]">
              {instance.id}
            </span>
            <span className="hidden sm:inline-block font-mono text-[11px] text-[#8b949e]">
              ({instance.publicIp || "54.0.0.2"})
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
              Real Container: {containerName || "ec2-instance"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#8b949e] mr-2">
              Session: {formatDuration(connectedTime)}
            </span>

            {/* Clear Button */}
            <button
              onClick={() => setHistory([])}
              disabled={!!activeEditor}
              className="px-2 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded text-[11px] font-medium transition-colors disabled:opacity-30"
              title="Clear terminal output"
            >
              Clear
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 hover:bg-[#30363d] text-[#c9d1d9] rounded"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                {isFullscreen ? (
                  <>
                    <polyline points="4 14 10 14 10 20" />
                    <polyline points="20 10 14 10 14 4" />
                    <line x1="14" y1="10" x2="21" y2="3" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </>
                ) : (
                  <>
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </>
                )}
              </svg>
            </button>

            {/* Disconnect / Close Button */}
            <button
              onClick={onClose}
              className="px-2.5 py-1 bg-[#da3633] hover:bg-[#b62324] text-white rounded text-[11px] font-medium transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Body: Either Active Editor OR Interactive Shell */}
        {activeEditor ? (
          activeEditor.type === "nano" ? (
            /* GNU Nano Editor */
            <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
              {/* Nano Header */}
              <div className="bg-[#e6edf3] text-[#0d1117] px-4 py-1 font-mono text-[12px] flex items-center justify-between select-none font-bold">
                <span>GNU nano 8.3 (Amazon Linux 2023 Container)</span>
                <span>File: {activeEditor.filename}</span>
                <span className="text-[#da3633]">
                  {activeEditor.isModified ? "[Modified]" : ""}
                </span>
              </div>

              {/* Nano Textarea */}
              <textarea
                ref={editorTextareaRef}
                value={activeEditor.content}
                onChange={(e) =>
                  setActiveEditor((prev) =>
                    prev
                      ? {
                          ...prev,
                          content: e.target.value,
                          isModified: true,
                          statusMessage: undefined,
                        }
                      : null
                  )
                }
                onKeyDown={handleNanoKeyDown}
                className="flex-1 w-full bg-[#0d1117] text-[#e6edf3] font-mono text-[13px] border-none outline-none p-4 resize-none leading-relaxed selection:bg-[#264f78]"
                spellCheck={false}
                autoFocus
              />

              {/* Nano Status Feedback Bar */}
              <div className="bg-[#161b22] px-4 py-1.5 border-t border-[#30363d] flex items-center justify-between font-mono text-[11px]">
                <span className="text-[#58a6ff] font-medium">
                  {activeEditor.statusMessage ||
                    `Lines: ${activeEditor.content.split("\n").length}`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveNano}
                    className="px-2.5 py-0.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded text-[11px] font-medium border border-[#30363d]"
                  >
                    WriteOut (Ctrl+O)
                  </button>
                  <button
                    onClick={exitNano}
                    className="px-2.5 py-0.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded text-[11px] font-medium"
                  >
                    Exit Nano (Ctrl+X)
                  </button>
                </div>
              </div>

              {/* Nano Shortcut Legend Bar */}
              <div className="bg-[#161b22] border-t border-[#30363d] px-4 py-2 font-mono text-[11px] text-[#8b949e] grid grid-cols-6 gap-x-3 gap-y-1 select-none">
                <div>
                  <span className="text-white font-bold">^G</span> Get Help
                </div>
                <div>
                  <span className="text-white font-bold">^O</span> WriteOut
                </div>
                <div>
                  <span className="text-white font-bold">^W</span> Where Is
                </div>
                <div>
                  <span className="text-white font-bold">^K</span> Cut Text
                </div>
                <div>
                  <span className="text-white font-bold">^J</span> Justify
                </div>
                <div>
                  <span className="text-white font-bold">^C</span> Cur Pos
                </div>
                <div>
                  <span className="text-white font-bold">^X</span> Exit
                </div>
                <div>
                  <span className="text-white font-bold">^R</span> Read File
                </div>
                <div>
                  <span className="text-white font-bold">^\</span> Replace
                </div>
                <div>
                  <span className="text-white font-bold">^U</span> Paste Text
                </div>
                <div>
                  <span className="text-white font-bold">^T</span> To Spell
                </div>
                <div>
                  <span className="text-white font-bold">^_</span> Go To Line
                </div>
              </div>
            </div>
          ) : (
            /* Vim Editor */
            <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
              {/* Vim Header Toolbar */}
              <div className="bg-[#161b22] text-[#c9d1d9] px-4 py-1.5 border-b border-[#30363d] font-mono text-[12px] flex items-center justify-between select-none">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white">VIM 9.2 (Amazon Linux 2023 Container)</span>
                  <span className="text-[#8b949e]">|</span>
                  <span className="text-[#58a6ff] font-bold">
                    {activeEditor.filename}
                  </span>
                  <span className="text-[#3fb950] font-semibold">
                    {activeEditor.viMode === "INSERT" ? "-- INSERT --" : "NORMAL"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {activeEditor.viMode === "INSERT" ? (
                    <button
                      onClick={() =>
                        setActiveEditor((prev) =>
                          prev ? { ...prev, viMode: "NORMAL" } : null
                        )
                      }
                      className="px-2 py-0.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded text-[11px]"
                    >
                      Normal Mode (Esc)
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        setActiveEditor((prev) =>
                          prev ? { ...prev, viMode: "INSERT" } : null
                        )
                      }
                      className="px-2 py-0.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded text-[11px]"
                    >
                      Insert Mode (i)
                    </button>
                  )}
                  <button
                    onClick={saveAndExitVi}
                    className="px-2.5 py-0.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded text-[11px] font-medium"
                  >
                    Save & Exit (:wq)
                  </button>
                  <button
                    onClick={exitViWithoutSaving}
                    className="px-2.5 py-0.5 bg-[#da3633] hover:bg-[#b62324] text-white rounded text-[11px]"
                  >
                    Quit (:q!)
                  </button>
                </div>
              </div>

              {/* Vim Textarea */}
              <textarea
                ref={editorTextareaRef}
                value={activeEditor.content}
                onChange={(e) =>
                  setActiveEditor((prev) =>
                    prev
                      ? {
                          ...prev,
                          content: e.target.value,
                          isModified: true,
                        }
                      : null
                  )
                }
                onKeyDown={handleViKeyDown}
                readOnly={activeEditor.viMode === "NORMAL"}
                className="flex-1 w-full bg-[#0d1117] text-[#e6edf3] font-mono text-[13px] border-none outline-none p-4 resize-none leading-relaxed selection:bg-[#264f78]"
                placeholder="~ (type 'i' for insert mode, Esc then ':wq' or click Save & Exit to return)"
                spellCheck={false}
                autoFocus
              />

              {/* Vim Status Bar */}
              <div className="bg-[#161b22] px-4 py-1.5 border-t border-[#30363d] flex items-center justify-between font-mono text-[11px] text-[#8b949e]">
                <div className="text-white font-bold">
                  {activeEditor.viMode === "INSERT"
                    ? "-- INSERT --"
                    : `"${activeEditor.filename}" ${activeEditor.content.split("\n").length} lines`}
                </div>
                <div>
                  Click{" "}
                  <span className="text-[#3fb950] font-semibold">
                    Save & Exit (:wq)
                  </span>{" "}
                  to write file and return to shell
                </div>
              </div>
            </div>
          )
        ) : (
          /* Standard Shell Output & Prompt */
          <>
            <div
              onClick={() => inputRef.current?.focus()}
              className="flex-1 bg-[#0d1117] p-4 font-mono text-[13px] text-[#c9d1d9] overflow-y-auto leading-relaxed select-text cursor-text"
            >
              {history.map((item, idx) => (
                <div key={idx} className="whitespace-pre-wrap">
                  {item.type === "banner" ? (
                    <pre className="text-[#ec7211] font-mono leading-tight">
                      {item.text}
                    </pre>
                  ) : item.type === "command" ? (
                    <div className="text-[#58a6ff] font-bold mt-2">
                      {item.text}
                    </div>
                  ) : item.type === "error" ? (
                    <div className="text-[#f85149]">{item.text}</div>
                  ) : (
                    <div className="text-[#e6edf3]">{item.text}</div>
                  )}
                </div>
              ))}

              {/* Execution spinner indicator */}
              {isExecuting && (
                <div className="flex items-center gap-2 mt-2 text-[#8b949e] font-mono text-[12px]">
                  <span className="w-2 h-2 rounded-full bg-[#58a6ff] animate-ping" />
                  <span>Executing in container...</span>
                </div>
              )}

              {/* Prompt line with interactive input */}
              <div className="flex items-center gap-1 mt-2">
                <span className="text-[#3fb950] font-bold select-none">
                  {promptString}
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!containerReady || isExecuting}
                  className="flex-1 bg-transparent text-[#e6edf3] font-mono text-[13px] border-none outline-none p-0 m-0 caret-[#58a6ff] disabled:opacity-50"
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>

              <div ref={terminalEndRef} />
            </div>

            {/* Terminal Footer Status Bar */}
            <div className="bg-[#161b22] px-4 py-1.5 border-t border-[#30363d] flex items-center justify-between text-[11px] text-[#8b949e] font-mono shrink-0 select-none">
              <div className="flex items-center gap-4">
                <span>Terminal: xterm-256color</span>
                <span>Host: {promptHost}</span>
                <span>Container: {containerName || "initializing"}</span>
                <span>User: ec2-user (sudo)</span>
              </div>
              <div>Press Enter to execute • Up/Down for command history</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
