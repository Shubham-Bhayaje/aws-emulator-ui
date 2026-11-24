# AWS Emulator & Console UI – Troubleshooting Guide

This guide provides troubleshooting steps, diagnostic commands, and resolutions for common runtime and networking issues encountered while running the AWS Emulator and Management Console UI.

---

## 1. Quick Troubleshooting Matrix

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| **`[Preflight Error] Docker is not installed` or `daemon is not active`** | Docker is not installed in the current environment, or the Docker daemon/service is stopped. | 1. If in WSL without Docker Desktop: run `sudo service docker start`.<br>2. If on Windows/macOS with Docker Desktop: start Docker Desktop application.<br>3. To install Docker from scratch, follow the **[Docker Setup Guide](../README.md#prerequisites-docker-setup-guide)** in `README.md`. |
| **`connect ETIMEDOUT 127.0.0.1:9297`** | WSL loopback networking is hung, or `networkingMode=mirrored` is enabled in `%USERPROFILE%\.wslconfig`. | 1. Check `%USERPROFILE%\.wslconfig` in Windows. Ensure `networkingMode` is either omitted or set to `nat`.<br>2. Run `wsl --shutdown` in Windows PowerShell.<br>3. Restart via `./start.sh`. |
| **`connect ECONNREFUSED 127.0.0.1:9297`** | The `aws-emulator` Docker container is stopped or has not been launched yet. | Run `./start.sh` (or `start.bat` on Windows). The launcher automatically creates or restarts the `aws-emulator` container. |
| **Process `Killed` with no error message** | WSL 2 kernel Out-Of-Memory (OOM) killer terminated `next-server` or `next-build`. | Next.js compilation requires ~2.2 GB free memory. Increase WSL memory allocation in `%USERPROFILE%\.wslconfig` (`memory=5GB`, `swap=6GB`), stop heavy background services (e.g. MySQL, Tomcat, Jenkins), and run `wsl --shutdown`. |
| **Chrome shows `ERR_CONNECTION_REFUSED` on `http://localhost:3000`** | Next.js dev server is starting, stopped, or Windows-to-WSL localhost forwarding failed. | 1. Verify the dev server is running inside WSL: `curl -I http://127.0.0.1:3000`.<br>2. In Windows Chrome, connect using `http://127.0.0.1:3000` or direct WSL IP (displayed by `hostname -I`).<br>3. If using WSL 2, run `wsl --shutdown` in PowerShell to reset localhost forwarding. |
| **Certificate / Signature validation errors after restart** | The emulator generated a new `ca.pem` certificate on container start, but the running console process cached the previous certificate. | Restart the Next.js console server (press Ctrl+C and run `./start.sh` again) so `NODE_EXTRA_CA_CERTS` loads the current `~/.aws/emulator/9297/ca.pem`. |
| **All instances, buckets, and resources disappeared** | `wsl --shutdown` was run or the `aws-emulator` container was removed / restarted. | The AWS Emulator stores all state entirely in-memory. Stopping or restarting the container erases all emulated resources. This is expected behavior for a sandbox learning tool. |
| **`port 9297 already in use`** | An orphaned emulator process or another service is already bound to port 9297. | Run `docker rm -f aws-emulator` and `./stop.sh`. To check which process is holding port 9297 in Linux/WSL, run `ss -tulpn | grep 9297`. |

---

## 2. Recommended Windows / WSL Configuration

On Windows systems running Docker inside WSL 2, configure `%USERPROFILE%\.wslconfig` (typically located at `C:\Users\<YourUsername>\.wslconfig`) with sufficient memory and standard NAT networking:

```ini
[wsl2]
memory=5GB
swap=6GB
networkingMode=nat
```

> [!WARNING]
> Do NOT set `networkingMode=mirrored`. On many Windows installations, mirrored networking mode interferes with local loopback socket binding (`127.0.0.1`) and Docker bridge forwarding, resulting in `ETIMEDOUT` errors on port 9297.

After modifying `%USERPROFILE%\.wslconfig`, you must restart WSL from a Windows PowerShell or Command Prompt terminal:

```powershell
wsl --shutdown
```

Then re-open WSL and run `./start.sh`.

---

## 3. Essential Diagnostic Commands

When diagnosing connectivity or container issues, run the following commands in your Linux / WSL terminal:

### 1. Check Container Status
Verify that the `aws-emulator` container is running and listening on port 9297:

```bash
docker ps --filter "name=aws-emulator"
```

Expected output:
```text
CONTAINER ID   IMAGE                 STATUS         PORTS
f199780f0f21   aws-emulator:latest   Up 2 minutes   127.0.0.1:9297->9297/tcp
```

### 2. Emulator Health Check
Test whether the emulator responds on the local loopback port using the generated CA certificate:

```bash
curl -sS -m 5 --cacert ~/.aws/emulator/9297/ca.pem https://127.0.0.1:9297/__admin/health
```

Expected response:
```text
ok
```

### 3. Container Direct IP Diagnostic
If loopback fails but the container is reported as `Up`, retrieve the container's internal bridge IP and query it directly:

```bash
CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' aws-emulator)
curl -k -m 5 "https://${CONTAINER_IP}:9297/__admin/health"
```

- If this command returns `ok` while `https://127.0.0.1:9297` times out: the emulator is functional, but WSL 2 loopback port forwarding is wedged. Run `wsl --shutdown` in Windows PowerShell.
- If this command also fails: inspect the container logs via `docker logs --tail 50 aws-emulator`.

### 4. Check WSL Networking Mode
Confirm the active networking mode in WSL:

```bash
wslinfo --networking-mode
```

Expected output:
```text
nat
```
If this prints `mirrored`, remove `networkingMode=mirrored` from `%USERPROFILE%\.wslconfig` and restart WSL.

### 5. Check Available RAM and Swap
Check available system memory:

```bash
free -h
```

Next.js (`next dev`) requires at least 2.2 GB of available memory during page compilation. If available memory is under 2.0 GB, stop background processes or expand memory in `.wslconfig`.

### 6. Inspect Out-Of-Memory (OOM) Kernel Events
If a command exits with `Killed` without explanation, inspect the Linux kernel ring buffer:

```bash
dmesg -T | grep -i -E "out of memory|killed process"
```

If lines mention `Killed process ... (next-server)` or `(node)`, the system ran out of RAM and swap. Increase WSL memory limits in `.wslconfig`.

---

## 4. Resetting Environment to Pristine State

If the environment is completely unresponsive:

```bash
# 1. Stop all containers and background UI processes
./stop.sh

# 2. In Windows PowerShell, reset the WSL virtual machine
wsl --shutdown

# 3. Start freshly
./start.sh
```
