/**
 * Check for WebCodecs support on the current platform.
 * @type {boolean}
 */
const isWebCodecsSupported =
  typeof window !== "undefined" && typeof window.VideoEncoder === "function";

let link;

const downloadBlob = (filename, blobPart, mimeType) => {
  link ||= document.createElement("a");
  link.download = filename;

  const blob = new Blob(blobPart, { type: mimeType });
  const url = URL.createObjectURL(blob);
  link.href = url;

  const event = new MouseEvent("click");
  link.dispatchEvent(event);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1);
};

const formatDate = (date) =>
  date.toISOString().replace(/:/g, "-").replace("T", "@").replace("Z", "");

const formatSeconds = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds - minutes * 60);
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
};

const nextMultiple = (x, n = 2) => Math.ceil(x / n) * n;

class Deferred {
  constructor() {
    this.resolve = null;
    this.reject = null;
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    Object.freeze(this);
  }
}

/**
 * Estimate the bit rate of a video rounded to nearest megabit.
 * Based on "H.264 for the rest of us" by Kush Amerasinghe.
 *
 * @example
 * ```js
 * // Full HD (1080p)
 * const bitRate = estimateBitRate(1920, 1080, 30, "variable");
 * const bitRateMbps = bitRate * 1_000_000; // => 13 Mbps
 * ```
 *
 * @param {number} width
 * @param {number} height
 * @param {number} frameRate
 * @param {number} motionRank A factor of 1, 2 or 4
 * @param {"variable" | "constant"} bitrateMode
 * @returns {number} A bitrate value in bits per second
 */
const estimateBitRate = (
  width,
  height,
  frameRate = 30,
  motionRank = 4,
  bitrateMode = "variable",
) =>
  Math.round(
    (width *
      height *
      frameRate *
      motionRank *
      0.07 *
      (bitrateMode === "variable" ? 0.75 : 1)) /
      1_000_000,
  ) * 1_000_000;

export {
  isWebCodecsSupported,
  downloadBlob,
  formatDate,
  formatSeconds,
  nextMultiple,
  Deferred,
  estimateBitRate,
};
