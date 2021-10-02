/**
 * @module canvasRecord
 */

import fileExtension from "file-extension";

/**
 * Get the mimetype
 *
 * @private
 * @param {string} filename
 * @returns {string}
 */
function getType(filename) {
  const ext = fileExtension(filename);
  return ["mkv"].includes(ext) ? "video/x-matroska;codecs=avc1" : "video/webm";
}

/**
 *
 * @alias module:canvasRecord
 * @param {HTMLCanvasElement} canvas The canvas element
 * @param {import("./types.js").CanvasRecordOptions} [options={}]
 * @returns {Object}
 *
 * The video `MimeType` is defined by `recorderOptions.mimeType` if present or is inferred from the filename extension (mkv) for `"video/x-matroska;codecs=avc1"` and default to `"video/webm"`.
 *
 * @see [MediaRecorder#Properties]{@link https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder#Properties}
 *
 * ```js
 * // Currently supported by Chrome
 * MediaRecorder.isTypeSupported("video/x-matroska;codecs=avc1");
 * MediaRecorder.isTypeSupported("video/webm");
 * MediaRecorder.isTypeSupported("video/webm;codecs=vp8");
 * MediaRecorder.isTypeSupported("video/webm;codecs=vp9");
 * MediaRecorder.isTypeSupported("video/webm;codecs=vp8.0");
 * MediaRecorder.isTypeSupported("video/webm;codecs=vp9.0");
 * MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus");
 * MediaRecorder.isTypeSupported("video/webm;codecs=vp8,pcm");
 * MediaRecorder.isTypeSupported("video/WEBM;codecs=VP8,OPUS");
 * MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus");
 * MediaRecorder.isTypeSupported("video/webm;codecs=vp8,vp9,opus");
 * ```
 */
function canvasRecord(canvas, options = {}) {
  const date = new Date();
  let link = null;

  const {
    filename = `Recording ${date.toISOString().slice(0, 10)} at ${date
      .toTimeString()
      .slice(0, 8)
      .replace(/:/g, ".")}.webm`,
    frameRate = 25,
    download = true,
    recorderOptions = {
      // mimeType: "video/x-matroska;codecs=avc1",
      audioBitsPerSecond: 128000, // 128 Kbit/sec
      videoBitsPerSecond: 2500000, // 2.5 Mbit/sec
    },
  } = {
    ...options,
  };

  const mimeType = recorderOptions.mimeType || getType(filename);

  if (download) {
    link = link || document.createElement("a");
    link.download = filename;
  }

  let chunks = [];
  let stream = canvas.captureStream(frameRate);

  let recorder = new MediaRecorder(stream, { mimeType, ...recorderOptions });
  recorder.ondataavailable = (event) => {
    event.data.size && chunks.push(event.data);
  };
  recorder.onstop = () => {
    if (download && chunks.length) {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      link.href = url;

      const event = new MouseEvent("click");
      link.dispatchEvent(event);
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1);
    }
  };

  return {
    /**
     * Start recording.
     *
     * @param {number} [timeslice] The number of milliseconds to record into each Blob. If this parameter isn't included, the entire media duration is recorded into a single Blob unless the requestData() method is called to obtain the Blob and trigger the creation of a new Blob into which the media continues to be recorded.
     */
    start(timeslice) {
      chunks = [];
      recorder.start(timeslice);
    },
    /**
     * Update the filename. Useful when recording several videovideos.
     */
    set filename(name) {
      link.download = name;
    },
    /**
     *  Only needed when there is a need to exactly to capture a canvas state at an instant `t`.
     *
     * @see [MDN CanvasCaptureMediaStreamTrack/requestFrame]{@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasCaptureMediaStreamTrack/requestFrame}
     * The CanvasCaptureMediaStreamTrack method requestFrame() requests that a frame be captured from the canvas and sent to the stream. Applications that need to carefully control the timing of rendering and frame capture can use requestFrame() to directly specify when it's time to capture a frame.
     * To prevent automatic capture of frames, so that frames are only captured when requestFrame() is called, specify a value of 0 for the captureStream() method when creating the stream.
     *
     * Notes: the technology is still a Working Draft not sure the output is guaranteed to have perfect frames.
     */
    step() {
      stream.getVideoTracks()[0].requestFrame();
    },
    /**
     * Stop the recorder which will consecutively call the `recorder.onstop` callback and download the video if not disable in the options.
     * @returns {Blob[]|Array} Returns the Blob chunk array (or chunks if `timeslice` is specified when starting the recorder).
     */
    stop() {
      recorder.stop();
      return chunks;
    },
    /**
     * Set `recorder` and `stream` to `null` for GC.
     */
    dispose() {
      recorder = null;
      stream = null;
    },
    /**
     * A reference to the `CanvasCaptureMediaStream`
     * @see [MDN CanvasCaptureMediaStream]{@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasCaptureMediaStream}
     */
    stream,
    /**
     * A reference to the `MediaRecorder`.
     * @see [MDN MediaRecorder]{@link https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder}
     */
    recorder,
  };
}

export default canvasRecord;
