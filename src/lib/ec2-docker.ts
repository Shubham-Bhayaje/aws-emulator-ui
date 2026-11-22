/**
 * src/lib/ec2-docker.ts - Dedicated Docker container lifecycle for simulated EC2 instances.
 * Spawns full-fledged Ubuntu 24.04 LTS or Amazon Linux 2023 containers for running EC2 instances.
 * Executes commands directly inside the container via docker exec.
 * Zero emojis, Cloudscape enterprise styling.
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Determine proper docker command prefix depending on host OS
function getDockerPrefix(): string {
  if (process.env.DOCKER_CMD) {
    return process.env.DOCKER_CMD;
  }
  if (process.platform === "win32") {
    return "wsl -e docker";
  }
  return "docker";
}

export interface ContainerExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export function getContainerName(instanceId: string): string {
  return `ec2-instance-${instanceId.toLowerCase().replace(/[^a-z0-9_-]/g, "-")}`;
}

/**
 * Detects the user and home directory for an active container.
 */
async function getContainerUserAndHome(
  containerName: string,
  prefix: string
): Promise<{ user: string; homeDir: string }> {
  try {
    const { stdout } = await execAsync(
      `${prefix} inspect -f "{{.Config.User}} {{.Config.Image}}" ${containerName}`
    );
    const parts = stdout.trim().split(" ");
    const user = parts[0];
    const image = parts[1] || "";
    if (user === "ubuntu" || image.includes("ubuntu")) {
      return { user: "ubuntu", homeDir: "/home/ubuntu" };
    }
    if (user === "ec2-user" || image.includes("amazonlinux")) {
      return { user: "ec2-user", homeDir: "/home/ec2-user" };
    }
    return { user: "ubuntu", homeDir: "/home/ubuntu" };
  } catch {
    return { user: "ubuntu", homeDir: "/home/ubuntu" };
  }
}

/**
 * Ensures the dedicated Docker container for an EC2 instance is created and running.
 */
export async function ensureInstanceContainer(instance: {
  id: string;
  privateIp?: string;
  publicIp?: string;
  platform?: string;
  amiId?: string;
  amiName?: string;
}): Promise<{
  success: boolean;
  containerName: string;
  isRunning: boolean;
  osType: "ubuntu" | "amazon-linux";
  user: string;
  homeDir: string;
  error?: string;
}> {
  const containerName = getContainerName(instance.id);
  const prefix = getDockerPrefix();
  const privateIp = instance.privateIp || "172.31.0.4";
  const hostname = `ip-${privateIp.replace(/\./g, "-")}`;

  // If explicitly Amazon Linux, use Amazon Linux 2023. Otherwise, use full-fledged Ubuntu 24.04 LTS.
  const isAmazonLinux =
    instance.platform?.toLowerCase() === "amazon linux" ||
    instance.amiId === "ami-0c7217cdde317cfec" ||
    (instance.amiName?.toLowerCase().includes("amazon linux") &&
      !instance.platform?.toLowerCase().includes("ubuntu"));

  const isUbuntu = !isAmazonLinux;
  const image = isUbuntu ? "ec2-ubuntu-24.04:latest" : "ec2-amazonlinux-2023:latest";
  const user = isUbuntu ? "ubuntu" : "ec2-user";
  const homeDir = isUbuntu ? "/home/ubuntu" : "/home/ec2-user";
  const osType: "ubuntu" | "amazon-linux" = isUbuntu ? "ubuntu" : "amazon-linux";

  try {
    // Check if container exists and its running state
    const inspectCmd = `${prefix} inspect -f "{{.State.Running}}" ${containerName}`;
    try {
      const { stdout } = await execAsync(inspectCmd);
      if (stdout.trim() === "true") {
        const detected = await getContainerUserAndHome(containerName, prefix);
        if (detected.user === "ubuntu") {
          execAsync(
            `${prefix} exec -u root ${containerName} bash -c "if ! ls /var/lib/apt/lists/*_Packages >/dev/null 2>&1; then apt-get update -qq; fi" 2>/dev/null || true`
          ).catch(() => {});
        }
        return {
          success: true,
          containerName,
          isRunning: true,
          osType: detected.user === "ubuntu" ? "ubuntu" : "amazon-linux",
          user: detected.user,
          homeDir: detected.homeDir,
        };
      }
      // If it exists but stopped, start it
      await execAsync(`${prefix} start ${containerName}`);
      const detected = await getContainerUserAndHome(containerName, prefix);
      if (detected.user === "ubuntu") {
        execAsync(
          `${prefix} exec -u root ${containerName} bash -c "if ! ls /var/lib/apt/lists/*_Packages >/dev/null 2>&1; then apt-get update -qq; fi" 2>/dev/null || true`
        ).catch(() => {});
      }
      return {
        success: true,
        containerName,
        isRunning: true,
        osType: detected.user === "ubuntu" ? "ubuntu" : "amazon-linux",
        user: detected.user,
        homeDir: detected.homeDir,
      };
    } catch {
      // Container does not exist yet; spawn it
      const runCmd = `${prefix} run -d --name ${containerName} --hostname ${hostname} ${image} tail -f /dev/null`;
      await execAsync(runCmd);

      // Populate instance metadata in ${homeDir}/.ec2-metadata
      const metaSetup = `mkdir -p ${homeDir} && echo "instance-id=${instance.id}" > ${homeDir}/.ec2-metadata && echo "public-ipv4=${instance.publicIp || "54.0.0.2"}" >> ${homeDir}/.ec2-metadata && echo "local-ipv4=${privateIp}" >> ${homeDir}/.ec2-metadata && chown -R ${user}:${user} ${homeDir}/.ec2-metadata 2>/dev/null || true`;
      try {
        await execAsync(
          `${prefix} exec -u ${user} ${containerName} bash -c "${metaSetup}"`
        );
      } catch {
        /* ignore */
      }

      if (user === "ubuntu") {
        execAsync(
          `${prefix} exec -u root ${containerName} bash -c "if ! ls /var/lib/apt/lists/*_Packages >/dev/null 2>&1; then apt-get update -qq; fi" 2>/dev/null || true`
        ).catch(() => {});
      }

      return {
        success: true,
        containerName,
        isRunning: true,
        osType,
        user,
        homeDir,
      };
    }
  } catch (err: any) {
    console.error(`[EC2 Docker] Failed to ensure container for ${instance.id}:`, err.message);
    return {
      success: false,
      containerName,
      isRunning: false,
      osType,
      user,
      homeDir,
      error: err.message,
    };
  }
}

/**
 * Executes a shell command inside the dedicated EC2 instance container.
 * Streams the command directly via stdin to prevent any shell escaping or argument breaking.
 */
export async function executeContainerCommand(
  instanceId: string,
  command: string,
  cwd?: string
): Promise<ContainerExecResult> {
  const containerName = getContainerName(instanceId);
  const prefix = getDockerPrefix();
  const { user, homeDir } = await getContainerUserAndHome(containerName, prefix);
  const workingDir = cwd || homeDir;

  return new Promise<ContainerExecResult>((resolve) => {
    const fullCmd = `${prefix} exec -i -w ${workingDir} -u ${user} ${containerName} bash`;
    const child = exec(
      fullCmd,
      {
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
      },
      (err, stdout, stderr) => {
        resolve({
          stdout: stdout || "",
          stderr: stderr || (err && !stdout ? err.message : ""),
          exitCode: err ? (err.code || 1) : 0,
        });
      }
    );

    if (child.stdin) {
      child.stdin.write(command + "\n");
      child.stdin.end();
    }
  });
}

/**
 * Reads a file from inside the instance container.
 */
export async function readContainerFile(
  instanceId: string,
  filePath: string
): Promise<{ success: boolean; content: string; error?: string }> {
  const containerName = getContainerName(instanceId);
  const prefix = getDockerPrefix();
  const { user, homeDir } = await getContainerUserAndHome(containerName, prefix);
  const safePath = filePath.replace(/'/g, "'\\''");

  try {
    const { stdout } = await execAsync(
      `${prefix} exec -i -w ${homeDir} -u ${user} ${containerName} cat '${safePath}'`
    );
    return { success: true, content: stdout };
  } catch (err: any) {
    return { success: false, content: "", error: err.stderr || err.message };
  }
}

/**
 * Writes or updates a file inside the instance container.
 */
export async function writeContainerFile(
  instanceId: string,
  filePath: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const containerName = getContainerName(instanceId);
  const prefix = getDockerPrefix();
  const { user, homeDir } = await getContainerUserAndHome(containerName, prefix);
  const safePath = filePath.replace(/'/g, "'\\''");

  try {
    const child = exec(
      `${prefix} exec -i -w ${homeDir} -u ${user} ${containerName} bash -c "cat > '${safePath}'"`,
      (err, _stdout, stderr) => {
        if (err) console.error("[EC2 Docker] Write error:", stderr);
      }
    );
    if (child.stdin) {
      child.stdin.write(content);
      child.stdin.end();
    }
    await new Promise<void>((resolve, reject) => {
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Exit code ${code}`));
      });
      child.on("error", reject);
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Stops the instance container.
 */
export async function stopInstanceContainer(instanceId: string): Promise<void> {
  const containerName = getContainerName(instanceId);
  const prefix = getDockerPrefix();
  try {
    await execAsync(`${prefix} stop ${containerName}`);
  } catch {
    /* ignore */
  }
}

/**
 * Starts the instance container if stopped.
 */
export async function startInstanceContainer(instanceId: string): Promise<void> {
  const containerName = getContainerName(instanceId);
  const prefix = getDockerPrefix();
  try {
    await execAsync(`${prefix} start ${containerName}`);
  } catch {
    /* ignore */
  }
}

/**
 * Removes the instance container when instance is terminated.
 */
export async function terminateInstanceContainer(instanceId: string): Promise<void> {
  const containerName = getContainerName(instanceId);
  const prefix = getDockerPrefix();
  try {
    await execAsync(`${prefix} rm -f ${containerName}`);
  } catch {
    /* ignore */
  }
}
