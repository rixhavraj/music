import { Response } from "express";

const YTDLP_PATH = "C:\\Users\\rixha\\AppData\\Local\\Microsoft\\WinGet\\Links\\yt-dlp.exe";

interface StreamCache {
  url: string;
  expiresAt: number;
}
const streamUrlCache = new Map<string, StreamCache>();

export async function getCachedStreamUrl(id: string): Promise<string> {
  const cached = streamUrlCache.get(id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }
  
  return new Promise((resolve, reject) => {
    const { exec } = require("child_process");
    exec(`"${YTDLP_PATH}" -g --format "bestaudio[ext=m4a]/bestaudio/best" "https://www.youtube.com/watch?v=${id}"`, (err: any, stdout: string) => {
      if (err || !stdout.trim()) {
        reject(err || new Error("No URL returned from yt-dlp"));
        return;
      }
      const directUrl = stdout.trim();
      streamUrlCache.set(id, {
        url: directUrl,
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes cache
      });
      resolve(directUrl);
    });
  });
}

export function makeToneWav(frequency: number, durationSeconds = 10): Buffer {
  const sampleRate = 44_100;
  const sampleCount = sampleRate * durationSeconds;
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, value: string) {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, sampleCount * 2, true);

  for (let index = 0; index < sampleCount; index += 1) {
    const fade = Math.min(index / 2000, (sampleCount - index) / 2000, 1);
    const sample = Math.sin((2 * Math.PI * frequency * index) / sampleRate) * 0.16 * fade;
    view.setInt16(44 + index * 2, sample * 32767, true);
  }

  return Buffer.from(buffer);
}

export function pipeYoutubeStream(directUrl: string, rangeHeader: string | undefined, res: Response): Promise<void> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    };
    if (rangeHeader) {
      headers["Range"] = rangeHeader;
    }

    let activeReq: any = null;
    let isFinished = false;

    const cleanup = () => {
      isFinished = true;
      if (activeReq) {
        activeReq.destroy();
        activeReq = null;
      }
    };

    const handleError = (err: any) => {
      if (isFinished) return;
      cleanup();
      reject(err);
    };

    const followRedirectsGet = (urlStr: string, opts: any, cb: (res: any) => void) => {
      if (isFinished) return;
      const protocol = urlStr.startsWith("https") ? require("https") : require("http");
      
      try {
        const req = protocol.get(urlStr, opts, (youtubeRes: any) => {
          if (youtubeRes.statusCode >= 300 && youtubeRes.statusCode < 400 && youtubeRes.headers.location) {
            req.destroy();
            followRedirectsGet(youtubeRes.headers.location, opts, cb);
            return;
          }
          cb(youtubeRes);
        });

        activeReq = req;
        req.on("error", handleError);
      } catch (err) {
        handleError(err);
      }
    };

    followRedirectsGet(directUrl, { headers }, (youtubeRes: any) => {
      if (isFinished) {
        youtubeRes.resume();
        return;
      }

      if (youtubeRes.headers["content-type"]) {
        res.setHeader("Content-Type", youtubeRes.headers["content-type"]);
      }
      if (youtubeRes.headers["content-length"]) {
        res.setHeader("Content-Length", youtubeRes.headers["content-length"]);
      }
      if (youtubeRes.headers["content-range"]) {
        res.setHeader("Content-Range", youtubeRes.headers["content-range"]);
      }
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Access-Control-Allow-Origin", "*");
      
      res.status(youtubeRes.statusCode || 200);
      youtubeRes.pipe(res);

      youtubeRes.on("end", () => {
        isFinished = true;
        resolve();
      });

      youtubeRes.on("error", (err: any) => {
        handleError(err);
      });
    });

    res.on("close", () => {
      cleanup();
      resolve();
    });
  });
}
