/**
 * Cross-platform Next.js dev server launcher for AWS Emulator UI.
 * Works natively on Windows (PowerShell/CMD), macOS, and Linux/WSL.
 */

const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

const homeDir = os.homedir();
const emulatorPort = process.env.EMULATOR_PORT || "9297";

// Check common emulator paths:
// 1. ~/.aws/emulator/9297 (native path on current OS)
// 2. In WSL from Windows or vice versa
let emulatorDir = path.join(homeDir, ".aws", "emulator", emulatorPort);

// On Windows, if ~/.aws/emulator doesn't exist in Windows profile, check WSL Ubuntu home
if (process.platform === "win32" && !fs.existsSync(emulatorDir)) {
  const wslCandidate = path.join(
    "\\\\wsl.localhost",
    "Ubuntu-24.04",
    "home",
    os.userInfo().username,
    ".aws",
    "emulator",
    emulatorPort
  );
  if (fs.existsSync(wslCandidate)) {
    emulatorDir = wslCandidate;
  }
}

const caCert = path.join(emulatorDir, "ca.pem");
const credentialsFile = path.join(emulatorDir, "emulator_credentials");
const configFile = path.join(emulatorDir, "config");

const env = {
  ...process.env,
  AWS_SHARED_CREDENTIALS_FILE: credentialsFile,
  AWS_CONFIG_FILE: configFile,
  AWS_EC2_METADATA_DISABLED: "true",
};

if (fs.existsSync(caCert)) {
  env.NODE_EXTRA_CA_CERTS = caCert;
  console.log(`[AWS Emulator UI] Using CA cert: ${caCert}`);
} else {
  console.warn(`[AWS Emulator UI] Warning: CA certificate not found at ${caCert}`);
  console.warn(`[AWS Emulator UI] Ensure the AWS Emulator is running in Docker on port ${emulatorPort}.`);
}

const isWindows = process.platform === "win32";
const nextCmd = isWindows ? "npx.cmd" : "npx";

console.log(`[AWS Emulator UI] Starting Next.js dev server on http://127.0.0.1:3000 ...`);

const child = spawn(nextCmd, ["next", "dev", "--hostname", "127.0.0.1"], {
  stdio: "inherit",
  env,
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
