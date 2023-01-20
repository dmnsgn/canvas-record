const isWebCodecsSupported = () =>
  typeof window !== "undefined" && typeof window.VideoEncoder === "function";

const formatDate = (date) =>
  date.toISOString().replace(/:/g, "-").replace("T", "@").replace("Z", "");

const formatSeconds = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds - minutes * 60);
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
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

export {
  isWebCodecsSupported,
  formatDate,
  formatSeconds,
  nextMultiple,
  Deferred,
};
