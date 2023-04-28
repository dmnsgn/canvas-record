import { c as createCommonjsModule } from './common/_commonjsHelpers-0597c316.js';

var fileExtension = createCommonjsModule(function (module, exports) {

  (function (m) {
    {
      module.exports = m();
    }
  })(function () {
    return function fileExtension(filename, opts) {
      if (!opts) opts = {};
      if (!filename) return "";
      var ext = (/[^./\\]*$/.exec(filename) || [""])[0];
      return opts.preserveCase ? ext : ext.toLowerCase();
    };
  });
});

/**
 * @module canvasScreenshot
 */
let link = null;

/**
 * Get the mimetype
 *
 * @private
 * @param {string} filename
 * @returns {string}
 */
function getType(filename) {
  const ext = fileExtension(filename);
  return ["jpg", "jpeg"].includes(ext) ? "image/jpeg" : "image/png";
}

/**
 * Take a screenshot.
 * Setting `options.useBlob` to `true` will consequently make the module async and return the latter.
 * @alias module:canvasScreenshot
 * @param {HTMLCanvasElement} canvas The canvas element
 * @param {import("./types.js").CanvasScreenshotOptions} [options={}]
 * @returns {string | Promise<Blob>} A `DOMString` or a `Promise` resolving with a `Blob`.
 *
 * Type is inferred from the filename extension (jpg/jpeg) for `"image/jpeg"` and default to `"image/png"`.
 */
function canvasScreenshot(canvas, options = {}) {
  const date = new Date();
  const {
    filename = `Screen Shot ${date.toISOString().slice(0, 10)} at ${date.toTimeString().slice(0, 8).replace(/:/g, ".")}.png`,
    quality = 1,
    useBlob,
    download = true
  } = {
    ...options
  };
  if (download) {
    link = link || document.createElement("a");
    link.download = filename;
  }
  if (useBlob) {
    return new Promise(resolve => {
      canvas.toBlob(blob => {
        if (download) {
          const url = URL.createObjectURL(blob);
          link.href = url;
          const event = new MouseEvent("click");
          link.dispatchEvent(event);
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 1);
        }
        resolve(blob);
      }, getType(filename), quality);
    });
  }
  const dataURL = canvas.toDataURL(`${getType(filename)};base64`, quality);
  if (download) {
    link.href = dataURL;
    const event = new MouseEvent("click");
    link.dispatchEvent(event);
  }
  return dataURL;
}

export default canvasScreenshot;
