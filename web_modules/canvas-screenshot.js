import { a as __toESM, t as __commonJSMin } from "./_chunks/rolldown-runtime-CRAsKsZc.js";

/*! file-extension v4.0.5 | (c) silverwind | BSD license */
var require_file_extension = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(m) {
		if (typeof exports === "object") module.exports = m();
		else if (typeof define === "function" && define.amd) define([], m);
		else this.fileExtension = m();
	})(function() {
		return function fileExtension(filename, opts) {
			if (!opts) opts = {};
			if (!filename) return "";
			var ext = (/[^./\\]*$/.exec(filename) || [""])[0];
			return opts.preserveCase ? ext : ext.toLowerCase();
		};
	});
}));

var import_file_extension = /* @__PURE__ */ __toESM(require_file_extension(), 1);
/**
* Get the MIME type
*
* @private
* @param {string} filename
* @returns {string}
*/
function getType(filename) {
	const ext = filename.includes(".") && (0, import_file_extension.default)(filename);
	return `image/${ext === "jpg" ? "jpeg" : ext || "png"}`;
}
/**
* Download in browser using a DOM link
*
* @private
* @param {string} filename
* @param {string} url
*/
function downloadURL(filename, url) {
	const link = document.createElement("a");
	link.download = filename;
	link.href = url;
	const event = new MouseEvent("click");
	link.dispatchEvent(event);
}
/**
* Take a screenshot.
* Setting `options.useBlob` to `true` will consequently make the module async and return the latter.
* @alias module:canvasScreenshot
* @param {HTMLCanvasElement} canvas The canvas element
* @param {import("./types.js").CanvasScreenshotOptions} [options={}]
* @returns {string | Promise<Blob>} A `DOMString` or a `Promise` resolving with a `Blob`.
*
* Type is inferred from the filename extension:
* - png for `"image/png"` (default)
* - jpg/jpeg for `"image/jpeg"`
* - webp for `"image/webp"`
*/
function canvasScreenshot(canvas, options = {}) {
	const date = /* @__PURE__ */ new Date();
	const { filename = `Screen Shot ${date.toISOString().slice(0, 10)} at ${date.toTimeString().slice(0, 8).replace(/:/g, ".")}.png`, type = getType(filename), quality = 1, useBlob, download = true } = { ...options };
	if (useBlob) return new Promise((resolve) => {
		canvas.toBlob((blob) => {
			if (download) {
				const url = URL.createObjectURL(blob);
				downloadURL(filename, url);
				setTimeout(() => {
					URL.revokeObjectURL(url);
				}, 1);
			}
			resolve(blob);
		}, type, quality);
	});
	const dataURL = canvas.toDataURL(type, quality);
	if (download) downloadURL(filename, dataURL);
	return dataURL;
}

export { canvasScreenshot as default };