import { createWriteStream } from "node:fs";
import { access, chmod, mkdir, rename, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendDirectory = path.resolve(scriptDirectory, "..");
const distDirectory = path.join(backendDirectory, "dist");
const binaryName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
const binaryPath = path.join(distDirectory, binaryName);
const downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${binaryName}`;
const temporaryPath = `${binaryPath}.download`;

function download(url, destination) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        download(response.headers.location, destination).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`yt-dlp download failed with HTTP ${response.statusCode}`));
        return;
      }

      const output = createWriteStream(destination);
      response.pipe(output);
      output.on("finish", () => output.close(resolve));
      output.on("error", reject);
      response.on("error", reject);
    });
    request.on("error", reject);
  });
}

async function main() {
  await mkdir(distDirectory, { recursive: true });
  await download(downloadUrl, temporaryPath);
  await chmod(temporaryPath, 0o755);
  await rename(temporaryPath, binaryPath);

  const fileStats = await stat(binaryPath);
  if (!fileStats.isFile()) {
    throw new Error(`yt-dlp installation failed: ${binaryPath} is not a file`);
  }
  await access(binaryPath);
  if (process.platform !== "win32") {
    await access(binaryPath, 1);
  }

  const version = execFileSync(binaryPath, ["--version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
  if (!version) {
    throw new Error("yt-dlp installation failed: --version returned no output");
  }

  console.log(`[yt-dlp] Installed: ${binaryPath}`);
  console.log(`[yt-dlp] Version: ${version}`);
}

main().catch((error) => {
  console.error(`[yt-dlp] Installation failed: ${error.message}`);
  process.exitCode = 1;
});
