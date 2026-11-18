/**
 * src/lib/ec2-docker.ts – Dedicated Docker container lifecycle for simulated EC2 instances.
 * Spawns real Amazon Linux 2023 containers for running EC2 instances.
 * Executes commands directly inside the container via docker exec.
 * Zero emojis, Cloudscape enterprise styling.
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Determine proper docker command prefix depending on host OS
function getDockerPrefix(): string {
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
 * Ensures the dedicated Docker container for an EC2 instance is created and running.
 */
export async function ensureInstanceContainer(instance: {
  id: string;
  privateIp?: string;
  publicIp?: string;
}): Promise<{ success: boolean; containerName: string; isRunning: boolean; error?: string }> {
  const containerName = getContainerName(instance.id);
  const prefix = getDockerPrefix();
  const privateIp = instance.privateIp || "172.31.0.4";
  const hostname = `ip-${privateIp.replace(/\./g, "-")}`;

  try {
    // Check if container exists and its running state
    const inspectCmd = `${prefix} inspect -f "{{.State.Running}}" ${containerName}`;
    try {
      const { stdout } = await execAsync(inspectCmd);
      if (stdout.trim() === "true") {
        return { success: true, containerName, isRunning: true };
      }
      // If it exists but stopped, start it
      await execAsync(`${prefix} start ${containerName}`);
      return { success: true, containerName, isRunning: true };
    } catch {
      // Container does not exist yet; spawn it
      const image = "ec2-amazonlinux-2023:latest";
      const runCmd = `${prefix} run -d --name ${containerName} --hostname ${hostname} ${image} tail -f /dev/null`;
      await execAsync(runCmd);

      // Populate instance metadata in /home/ec2-user/.ec2-metadata
      const metaSetup = `mkdir -p /home/ec2-user && echo "instance-id=${instance.id}" > /home/ec2-user/.ec2-metadata && echo "public-ipv4=${instance.publicIp || "54.0.0.2"}" >> /home/ec2-user/.ec2-metadata && echo "local-ipv4=${privateIp}" >> /home/ec2-user/.ec2-metadata`;
      try {
        await execAsync(
          `${prefix} exec -u ec2-user ${containerName} bash -c "${metaSetup}"`
        );
      } catch {
        /* ignore */
      }

      return { success: true, containerName, isRunning: true };
    }
  } catch (err: any) {
    console.error(`[EC2 Docker] Failed to ensure container for ${instance.id}:`, err.message);
    return { success: false, containerName, isRunning: false, error: err.message };
  }
}

/**
 * Executes a shell command inside the dedicated EC2 instance container.
 */
export async function executeContainerCommand(
  instanceId: string,
  command: string,
  cwd: string = "/home/ec2-user"
): Promise<ContainerExecResult> {
  const containerName = getContainerName(instanceId);
  const prefix = getDockerPrefix();

  // Escape single quotes for bash -c '...'
  const escapedCmd = command.replace(/'/g, "'\\''");
  const fullCmd = `${prefix} exec -i -w ${cwd} -u ec2-user ${containerName} bash -c '${escapedCmd}'`;

  try {
    const { stdout, stderr } = await execAsync(fullCmd, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout || "",
      stderr: err.stderr || err.message || "",
      exitCode: err.code || 1,
    };
  }
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
  const safePath = filePath.replace(/'/g, "'\\''");

  try {
    const { stdout } = await execAsync(
      `${prefix} exec -i -w /home/ec2-user -u ec2-user ${containerName} cat '${safePath}'`
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
  const safePath = filePath.replace(/'/g, "'\\''");

  try {
    // Pipe content directly via stdin to docker exec cat > file
    const child = exec(
      `${prefix} exec -i -w /home/ec2-user -u ec2-user ${containerName} bash -c "cat > '${safePath}'"`,
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
