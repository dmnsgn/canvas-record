import { n as __esmMin, r as __exportAll } from "./rolldown-runtime-CRAsKsZc.js";

var _polyfill_node_global_default;
var init__polyfill_node_global = __esmMin((() => {
	_polyfill_node_global_default = typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};
}));

function defaultSetTimout() {
	throw new Error("setTimeout has not been defined");
}
function defaultClearTimeout() {
	throw new Error("clearTimeout has not been defined");
}
function runTimeout(fun) {
	if (cachedSetTimeout === setTimeout) return setTimeout(fun, 0);
	if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
		cachedSetTimeout = setTimeout;
		return setTimeout(fun, 0);
	}
	try {
		return cachedSetTimeout(fun, 0);
	} catch (e) {
		try {
			return cachedSetTimeout.call(null, fun, 0);
		} catch (e) {
			return cachedSetTimeout.call(this, fun, 0);
		}
	}
}
function runClearTimeout(marker) {
	if (cachedClearTimeout === clearTimeout) return clearTimeout(marker);
	if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
		cachedClearTimeout = clearTimeout;
		return clearTimeout(marker);
	}
	try {
		return cachedClearTimeout(marker);
	} catch (e) {
		try {
			return cachedClearTimeout.call(null, marker);
		} catch (e) {
			return cachedClearTimeout.call(this, marker);
		}
	}
}
function cleanUpNextTick() {
	if (!draining || !currentQueue) return;
	draining = false;
	if (currentQueue.length) queue = currentQueue.concat(queue);
	else queueIndex = -1;
	if (queue.length) drainQueue();
}
function drainQueue() {
	if (draining) return;
	var timeout = runTimeout(cleanUpNextTick);
	draining = true;
	var len = queue.length;
	while (len) {
		currentQueue = queue;
		queue = [];
		while (++queueIndex < len) if (currentQueue) currentQueue[queueIndex].run();
		queueIndex = -1;
		len = queue.length;
	}
	currentQueue = null;
	draining = false;
	runClearTimeout(timeout);
}
function nextTick(fun) {
	var args = new Array(arguments.length - 1);
	if (arguments.length > 1) for (var i = 1; i < arguments.length; i++) args[i - 1] = arguments[i];
	queue.push(new Item(fun, args));
	if (queue.length === 1 && !draining) runTimeout(drainQueue);
}
function Item(fun, array) {
	this.fun = fun;
	this.array = array;
}
function noop() {}
function binding(name) {
	throw new Error("process.binding is not supported");
}
function cwd() {
	return "/";
}
function chdir(dir) {
	throw new Error("process.chdir is not supported");
}
function umask() {
	return 0;
}
function hrtime(previousTimestamp) {
	var clocktime = performanceNow.call(performance) * .001;
	var seconds = Math.floor(clocktime);
	var nanoseconds = Math.floor(clocktime % 1 * 1e9);
	if (previousTimestamp) {
		seconds = seconds - previousTimestamp[0];
		nanoseconds = nanoseconds - previousTimestamp[1];
		if (nanoseconds < 0) {
			seconds--;
			nanoseconds += 1e9;
		}
	}
	return [seconds, nanoseconds];
}
function uptime() {
	return (/* @__PURE__ */ new Date() - startTime) / 1e3;
}
var cachedSetTimeout, cachedClearTimeout, queue, draining, currentQueue, queueIndex, title, platform, browser, env, argv, version, versions, release, config, on, addListener, once, off, removeListener, removeAllListeners, emit, performance, performanceNow, startTime, browser$1;
var init__polyfill_node_process = __esmMin((() => {
	init__polyfill_node_global();
	cachedSetTimeout = defaultSetTimout;
	cachedClearTimeout = defaultClearTimeout;
	if (typeof _polyfill_node_global_default.setTimeout === "function") cachedSetTimeout = setTimeout;
	if (typeof _polyfill_node_global_default.clearTimeout === "function") cachedClearTimeout = clearTimeout;
	queue = [];
	draining = false;
	;
	queueIndex = -1;
	Item.prototype.run = function() {
		this.fun.apply(null, this.array);
	};
	title = "browser";
	platform = "browser";
	browser = true;
	env = {};
	argv = [];
	version = "";
	versions = {};
	release = {};
	config = {};
	on = noop;
	addListener = noop;
	once = noop;
	off = noop;
	removeListener = noop;
	removeAllListeners = noop;
	emit = noop;
	performance = _polyfill_node_global_default.performance || {};
	performanceNow = performance.now || performance.mozNow || performance.msNow || performance.oNow || performance.webkitNow || function() {
		return (/* @__PURE__ */ new Date()).getTime();
	};
	startTime = /* @__PURE__ */ new Date();
	browser$1 = {
		nextTick,
		title,
		browser: true,
		env,
		argv,
		version: "",
		versions,
		on,
		addListener,
		once,
		off,
		removeListener,
		removeAllListeners,
		emit,
		binding,
		cwd,
		chdir,
		umask,
		hrtime,
		platform,
		release,
		config,
		uptime
	};
}));

function init() {
	inited = true;
	var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	for (var i = 0, len = code.length; i < len; ++i) {
		lookup[i] = code[i];
		revLookup[code.charCodeAt(i)] = i;
	}
	revLookup["-".charCodeAt(0)] = 62;
	revLookup["_".charCodeAt(0)] = 63;
}
function toByteArray(b64) {
	if (!inited) init();
	var i, j, l, tmp, placeHolders, arr;
	var len = b64.length;
	if (len % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
	placeHolders = b64[len - 2] === "=" ? 2 : b64[len - 1] === "=" ? 1 : 0;
	arr = new Arr(len * 3 / 4 - placeHolders);
	l = placeHolders > 0 ? len - 4 : len;
	var L = 0;
	for (i = 0, j = 0; i < l; i += 4, j += 3) {
		tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
		arr[L++] = tmp >> 16 & 255;
		arr[L++] = tmp >> 8 & 255;
		arr[L++] = tmp & 255;
	}
	if (placeHolders === 2) {
		tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
		arr[L++] = tmp & 255;
	} else if (placeHolders === 1) {
		tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
		arr[L++] = tmp >> 8 & 255;
		arr[L++] = tmp & 255;
	}
	return arr;
}
function tripletToBase64(num) {
	return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
}
function encodeChunk(uint8, start, end) {
	var tmp;
	var output = [];
	for (var i = start; i < end; i += 3) {
		tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2];
		output.push(tripletToBase64(tmp));
	}
	return output.join("");
}
function fromByteArray(uint8) {
	if (!inited) init();
	var tmp;
	var len = uint8.length;
	var extraBytes = len % 3;
	var output = "";
	var parts = [];
	var maxChunkLength = 16383;
	for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
	if (extraBytes === 1) {
		tmp = uint8[len - 1];
		output += lookup[tmp >> 2];
		output += lookup[tmp << 4 & 63];
		output += "==";
	} else if (extraBytes === 2) {
		tmp = (uint8[len - 2] << 8) + uint8[len - 1];
		output += lookup[tmp >> 10];
		output += lookup[tmp >> 4 & 63];
		output += lookup[tmp << 2 & 63];
		output += "=";
	}
	parts.push(output);
	return parts.join("");
}
function read(buffer, offset, isLE, mLen, nBytes) {
	var e, m;
	var eLen = nBytes * 8 - mLen - 1;
	var eMax = (1 << eLen) - 1;
	var eBias = eMax >> 1;
	var nBits = -7;
	var i = isLE ? nBytes - 1 : 0;
	var d = isLE ? -1 : 1;
	var s = buffer[offset + i];
	i += d;
	e = s & (1 << -nBits) - 1;
	s >>= -nBits;
	nBits += eLen;
	for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);
	m = e & (1 << -nBits) - 1;
	e >>= -nBits;
	nBits += mLen;
	for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);
	if (e === 0) e = 1 - eBias;
	else if (e === eMax) return m ? NaN : (s ? -1 : 1) * Infinity;
	else {
		m = m + Math.pow(2, mLen);
		e = e - eBias;
	}
	return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
}
function write(buffer, value, offset, isLE, mLen, nBytes) {
	var e, m, c;
	var eLen = nBytes * 8 - mLen - 1;
	var eMax = (1 << eLen) - 1;
	var eBias = eMax >> 1;
	var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
	var i = isLE ? 0 : nBytes - 1;
	var d = isLE ? 1 : -1;
	var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
	value = Math.abs(value);
	if (isNaN(value) || value === Infinity) {
		m = isNaN(value) ? 1 : 0;
		e = eMax;
	} else {
		e = Math.floor(Math.log(value) / Math.LN2);
		if (value * (c = Math.pow(2, -e)) < 1) {
			e--;
			c *= 2;
		}
		if (e + eBias >= 1) value += rt / c;
		else value += rt * Math.pow(2, 1 - eBias);
		if (value * c >= 2) {
			e++;
			c /= 2;
		}
		if (e + eBias >= eMax) {
			m = 0;
			e = eMax;
		} else if (e + eBias >= 1) {
			m = (value * c - 1) * Math.pow(2, mLen);
			e = e + eBias;
		} else {
			m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
			e = 0;
		}
	}
	for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8);
	e = e << mLen | m;
	eLen += mLen;
	for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8);
	buffer[offset + i - d] |= s * 128;
}
/*!
* The buffer module from node.js, for the browser.
*
* @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
* @license  MIT
*/
function kMaxLength() {
	return Buffer.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
}
function createBuffer(that, length) {
	if (kMaxLength() < length) throw new RangeError("Invalid typed array length");
	if (Buffer.TYPED_ARRAY_SUPPORT) {
		that = new Uint8Array(length);
		that.__proto__ = Buffer.prototype;
	} else {
		if (that === null) that = new Buffer(length);
		that.length = length;
	}
	return that;
}
/**
* The Buffer constructor returns instances of `Uint8Array` that have their
* prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
* `Uint8Array`, so the returned instances will have all the node `Buffer` methods
* and the `Uint8Array` methods. Square bracket notation works as expected -- it
* returns a single octet.
*
* The `Uint8Array` prototype remains unmodified.
*/
function Buffer(arg, encodingOrOffset, length) {
	if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) return new Buffer(arg, encodingOrOffset, length);
	if (typeof arg === "number") {
		if (typeof encodingOrOffset === "string") throw new Error("If encoding is specified then the first argument must be a string");
		return allocUnsafe(this, arg);
	}
	return from(this, arg, encodingOrOffset, length);
}
function from(that, value, encodingOrOffset, length) {
	if (typeof value === "number") throw new TypeError("\"value\" argument must not be a number");
	if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) return fromArrayBuffer(that, value, encodingOrOffset, length);
	if (typeof value === "string") return fromString(that, value, encodingOrOffset);
	return fromObject(that, value);
}
function assertSize(size) {
	if (typeof size !== "number") throw new TypeError("\"size\" argument must be a number");
	else if (size < 0) throw new RangeError("\"size\" argument must not be negative");
}
function alloc(that, size, fill, encoding) {
	assertSize(size);
	if (size <= 0) return createBuffer(that, size);
	if (fill !== void 0) return typeof encoding === "string" ? createBuffer(that, size).fill(fill, encoding) : createBuffer(that, size).fill(fill);
	return createBuffer(that, size);
}
function allocUnsafe(that, size) {
	assertSize(size);
	that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
	if (!Buffer.TYPED_ARRAY_SUPPORT) for (var i = 0; i < size; ++i) that[i] = 0;
	return that;
}
function fromString(that, string, encoding) {
	if (typeof encoding !== "string" || encoding === "") encoding = "utf8";
	if (!Buffer.isEncoding(encoding)) throw new TypeError("\"encoding\" must be a valid string encoding");
	var length = byteLength(string, encoding) | 0;
	that = createBuffer(that, length);
	var actual = that.write(string, encoding);
	if (actual !== length) that = that.slice(0, actual);
	return that;
}
function fromArrayLike(that, array) {
	var length = array.length < 0 ? 0 : checked(array.length) | 0;
	that = createBuffer(that, length);
	for (var i = 0; i < length; i += 1) that[i] = array[i] & 255;
	return that;
}
function fromArrayBuffer(that, array, byteOffset, length) {
	array.byteLength;
	if (byteOffset < 0 || array.byteLength < byteOffset) throw new RangeError("'offset' is out of bounds");
	if (array.byteLength < byteOffset + (length || 0)) throw new RangeError("'length' is out of bounds");
	if (byteOffset === void 0 && length === void 0) array = new Uint8Array(array);
	else if (length === void 0) array = new Uint8Array(array, byteOffset);
	else array = new Uint8Array(array, byteOffset, length);
	if (Buffer.TYPED_ARRAY_SUPPORT) {
		that = array;
		that.__proto__ = Buffer.prototype;
	} else that = fromArrayLike(that, array);
	return that;
}
function fromObject(that, obj) {
	if (internalIsBuffer(obj)) {
		var len = checked(obj.length) | 0;
		that = createBuffer(that, len);
		if (that.length === 0) return that;
		obj.copy(that, 0, 0, len);
		return that;
	}
	if (obj) {
		if (typeof ArrayBuffer !== "undefined" && obj.buffer instanceof ArrayBuffer || "length" in obj) {
			if (typeof obj.length !== "number" || isnan(obj.length)) return createBuffer(that, 0);
			return fromArrayLike(that, obj);
		}
		if (obj.type === "Buffer" && isArray(obj.data)) return fromArrayLike(that, obj.data);
	}
	throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
}
function checked(length) {
	if (length >= kMaxLength()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + kMaxLength().toString(16) + " bytes");
	return length | 0;
}
function internalIsBuffer(b) {
	return !!(b != null && b._isBuffer);
}
function byteLength(string, encoding) {
	if (internalIsBuffer(string)) return string.length;
	if (typeof ArrayBuffer !== "undefined" && typeof ArrayBuffer.isView === "function" && (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) return string.byteLength;
	if (typeof string !== "string") string = "" + string;
	var len = string.length;
	if (len === 0) return 0;
	var loweredCase = false;
	for (;;) switch (encoding) {
		case "ascii":
		case "latin1":
		case "binary": return len;
		case "utf8":
		case "utf-8":
		case void 0: return utf8ToBytes(string).length;
		case "ucs2":
		case "ucs-2":
		case "utf16le":
		case "utf-16le": return len * 2;
		case "hex": return len >>> 1;
		case "base64": return base64ToBytes(string).length;
		default:
			if (loweredCase) return utf8ToBytes(string).length;
			encoding = ("" + encoding).toLowerCase();
			loweredCase = true;
	}
}
function slowToString(encoding, start, end) {
	var loweredCase = false;
	if (start === void 0 || start < 0) start = 0;
	if (start > this.length) return "";
	if (end === void 0 || end > this.length) end = this.length;
	if (end <= 0) return "";
	end >>>= 0;
	start >>>= 0;
	if (end <= start) return "";
	if (!encoding) encoding = "utf8";
	while (true) switch (encoding) {
		case "hex": return hexSlice(this, start, end);
		case "utf8":
		case "utf-8": return utf8Slice(this, start, end);
		case "ascii": return asciiSlice(this, start, end);
		case "latin1":
		case "binary": return latin1Slice(this, start, end);
		case "base64": return base64Slice(this, start, end);
		case "ucs2":
		case "ucs-2":
		case "utf16le":
		case "utf-16le": return utf16leSlice(this, start, end);
		default:
			if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
			encoding = (encoding + "").toLowerCase();
			loweredCase = true;
	}
}
function swap(b, n, m) {
	var i = b[n];
	b[n] = b[m];
	b[m] = i;
}
function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
	if (buffer.length === 0) return -1;
	if (typeof byteOffset === "string") {
		encoding = byteOffset;
		byteOffset = 0;
	} else if (byteOffset > 2147483647) byteOffset = 2147483647;
	else if (byteOffset < -2147483648) byteOffset = -2147483648;
	byteOffset = +byteOffset;
	if (isNaN(byteOffset)) byteOffset = dir ? 0 : buffer.length - 1;
	if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
	if (byteOffset >= buffer.length) if (dir) return -1;
	else byteOffset = buffer.length - 1;
	else if (byteOffset < 0) if (dir) byteOffset = 0;
	else return -1;
	if (typeof val === "string") val = Buffer.from(val, encoding);
	if (internalIsBuffer(val)) {
		if (val.length === 0) return -1;
		return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
	} else if (typeof val === "number") {
		val = val & 255;
		if (Buffer.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf === "function") if (dir) return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
		else return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
		return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
	}
	throw new TypeError("val must be string, number or Buffer");
}
function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
	var indexSize = 1;
	var arrLength = arr.length;
	var valLength = val.length;
	if (encoding !== void 0) {
		encoding = String(encoding).toLowerCase();
		if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
			if (arr.length < 2 || val.length < 2) return -1;
			indexSize = 2;
			arrLength /= 2;
			valLength /= 2;
			byteOffset /= 2;
		}
	}
	function read(buf, i) {
		if (indexSize === 1) return buf[i];
		else return buf.readUInt16BE(i * indexSize);
	}
	var i;
	if (dir) {
		var foundIndex = -1;
		for (i = byteOffset; i < arrLength; i++) if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
			if (foundIndex === -1) foundIndex = i;
			if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
		} else {
			if (foundIndex !== -1) i -= i - foundIndex;
			foundIndex = -1;
		}
	} else {
		if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
		for (i = byteOffset; i >= 0; i--) {
			var found = true;
			for (var j = 0; j < valLength; j++) if (read(arr, i + j) !== read(val, j)) {
				found = false;
				break;
			}
			if (found) return i;
		}
	}
	return -1;
}
function hexWrite(buf, string, offset, length) {
	offset = Number(offset) || 0;
	var remaining = buf.length - offset;
	if (!length) length = remaining;
	else {
		length = Number(length);
		if (length > remaining) length = remaining;
	}
	var strLen = string.length;
	if (strLen % 2 !== 0) throw new TypeError("Invalid hex string");
	if (length > strLen / 2) length = strLen / 2;
	for (var i = 0; i < length; ++i) {
		var parsed = parseInt(string.substr(i * 2, 2), 16);
		if (isNaN(parsed)) return i;
		buf[offset + i] = parsed;
	}
	return i;
}
function utf8Write(buf, string, offset, length) {
	return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
}
function asciiWrite(buf, string, offset, length) {
	return blitBuffer(asciiToBytes(string), buf, offset, length);
}
function latin1Write(buf, string, offset, length) {
	return asciiWrite(buf, string, offset, length);
}
function base64Write(buf, string, offset, length) {
	return blitBuffer(base64ToBytes(string), buf, offset, length);
}
function ucs2Write(buf, string, offset, length) {
	return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
}
function base64Slice(buf, start, end) {
	if (start === 0 && end === buf.length) return fromByteArray(buf);
	else return fromByteArray(buf.slice(start, end));
}
function utf8Slice(buf, start, end) {
	end = Math.min(buf.length, end);
	var res = [];
	var i = start;
	while (i < end) {
		var firstByte = buf[i];
		var codePoint = null;
		var bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
		if (i + bytesPerSequence <= end) {
			var secondByte, thirdByte, fourthByte, tempCodePoint;
			switch (bytesPerSequence) {
				case 1:
					if (firstByte < 128) codePoint = firstByte;
					break;
				case 2:
					secondByte = buf[i + 1];
					if ((secondByte & 192) === 128) {
						tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
						if (tempCodePoint > 127) codePoint = tempCodePoint;
					}
					break;
				case 3:
					secondByte = buf[i + 1];
					thirdByte = buf[i + 2];
					if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
						tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
						if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) codePoint = tempCodePoint;
					}
					break;
				case 4:
					secondByte = buf[i + 1];
					thirdByte = buf[i + 2];
					fourthByte = buf[i + 3];
					if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
						tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
						if (tempCodePoint > 65535 && tempCodePoint < 1114112) codePoint = tempCodePoint;
					}
			}
		}
		if (codePoint === null) {
			codePoint = 65533;
			bytesPerSequence = 1;
		} else if (codePoint > 65535) {
			codePoint -= 65536;
			res.push(codePoint >>> 10 & 1023 | 55296);
			codePoint = 56320 | codePoint & 1023;
		}
		res.push(codePoint);
		i += bytesPerSequence;
	}
	return decodeCodePointsArray(res);
}
function decodeCodePointsArray(codePoints) {
	var len = codePoints.length;
	if (len <= MAX_ARGUMENTS_LENGTH) return String.fromCharCode.apply(String, codePoints);
	var res = "";
	var i = 0;
	while (i < len) res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
	return res;
}
function asciiSlice(buf, start, end) {
	var ret = "";
	end = Math.min(buf.length, end);
	for (var i = start; i < end; ++i) ret += String.fromCharCode(buf[i] & 127);
	return ret;
}
function latin1Slice(buf, start, end) {
	var ret = "";
	end = Math.min(buf.length, end);
	for (var i = start; i < end; ++i) ret += String.fromCharCode(buf[i]);
	return ret;
}
function hexSlice(buf, start, end) {
	var len = buf.length;
	if (!start || start < 0) start = 0;
	if (!end || end < 0 || end > len) end = len;
	var out = "";
	for (var i = start; i < end; ++i) out += toHex(buf[i]);
	return out;
}
function utf16leSlice(buf, start, end) {
	var bytes = buf.slice(start, end);
	var res = "";
	for (var i = 0; i < bytes.length; i += 2) res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
	return res;
}
function checkOffset(offset, ext, length) {
	if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
	if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
}
function checkInt(buf, value, offset, ext, max, min) {
	if (!internalIsBuffer(buf)) throw new TypeError("\"buffer\" argument must be a Buffer instance");
	if (value > max || value < min) throw new RangeError("\"value\" argument is out of bounds");
	if (offset + ext > buf.length) throw new RangeError("Index out of range");
}
function objectWriteUInt16(buf, value, offset, littleEndian) {
	if (value < 0) value = 65535 + value + 1;
	for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) buf[offset + i] = (value & 255 << 8 * (littleEndian ? i : 1 - i)) >>> (littleEndian ? i : 1 - i) * 8;
}
function objectWriteUInt32(buf, value, offset, littleEndian) {
	if (value < 0) value = 4294967295 + value + 1;
	for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) buf[offset + i] = value >>> (littleEndian ? i : 3 - i) * 8 & 255;
}
function checkIEEE754(buf, value, offset, ext, max, min) {
	if (offset + ext > buf.length) throw new RangeError("Index out of range");
	if (offset < 0) throw new RangeError("Index out of range");
}
function writeFloat(buf, value, offset, littleEndian, noAssert) {
	if (!noAssert) checkIEEE754(buf, value, offset, 4);
	write(buf, value, offset, littleEndian, 23, 4);
	return offset + 4;
}
function writeDouble(buf, value, offset, littleEndian, noAssert) {
	if (!noAssert) checkIEEE754(buf, value, offset, 8);
	write(buf, value, offset, littleEndian, 52, 8);
	return offset + 8;
}
function base64clean(str) {
	str = stringtrim(str).replace(INVALID_BASE64_RE, "");
	if (str.length < 2) return "";
	while (str.length % 4 !== 0) str = str + "=";
	return str;
}
function stringtrim(str) {
	if (str.trim) return str.trim();
	return str.replace(/^\s+|\s+$/g, "");
}
function toHex(n) {
	if (n < 16) return "0" + n.toString(16);
	return n.toString(16);
}
function utf8ToBytes(string, units) {
	units = units || Infinity;
	var codePoint;
	var length = string.length;
	var leadSurrogate = null;
	var bytes = [];
	for (var i = 0; i < length; ++i) {
		codePoint = string.charCodeAt(i);
		if (codePoint > 55295 && codePoint < 57344) {
			if (!leadSurrogate) {
				if (codePoint > 56319) {
					if ((units -= 3) > -1) bytes.push(239, 191, 189);
					continue;
				} else if (i + 1 === length) {
					if ((units -= 3) > -1) bytes.push(239, 191, 189);
					continue;
				}
				leadSurrogate = codePoint;
				continue;
			}
			if (codePoint < 56320) {
				if ((units -= 3) > -1) bytes.push(239, 191, 189);
				leadSurrogate = codePoint;
				continue;
			}
			codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
		} else if (leadSurrogate) {
			if ((units -= 3) > -1) bytes.push(239, 191, 189);
		}
		leadSurrogate = null;
		if (codePoint < 128) {
			if ((units -= 1) < 0) break;
			bytes.push(codePoint);
		} else if (codePoint < 2048) {
			if ((units -= 2) < 0) break;
			bytes.push(codePoint >> 6 | 192, codePoint & 63 | 128);
		} else if (codePoint < 65536) {
			if ((units -= 3) < 0) break;
			bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
		} else if (codePoint < 1114112) {
			if ((units -= 4) < 0) break;
			bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
		} else throw new Error("Invalid code point");
	}
	return bytes;
}
function asciiToBytes(str) {
	var byteArray = [];
	for (var i = 0; i < str.length; ++i) byteArray.push(str.charCodeAt(i) & 255);
	return byteArray;
}
function utf16leToBytes(str, units) {
	var c, hi, lo;
	var byteArray = [];
	for (var i = 0; i < str.length; ++i) {
		if ((units -= 2) < 0) break;
		c = str.charCodeAt(i);
		hi = c >> 8;
		lo = c % 256;
		byteArray.push(lo);
		byteArray.push(hi);
	}
	return byteArray;
}
function base64ToBytes(str) {
	return toByteArray(base64clean(str));
}
function blitBuffer(src, dst, offset, length) {
	for (var i = 0; i < length; ++i) {
		if (i + offset >= dst.length || i >= src.length) break;
		dst[i + offset] = src[i];
	}
	return i;
}
function isnan(val) {
	return val !== val;
}
function isBuffer(obj) {
	return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj));
}
function isFastBuffer(obj) {
	return !!obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
}
function isSlowBuffer(obj) {
	return typeof obj.readFloatLE === "function" && typeof obj.slice === "function" && isFastBuffer(obj.slice(0, 0));
}
var lookup, revLookup, Arr, inited, toString, isArray, INSPECT_MAX_BYTES, _kMaxLength, MAX_ARGUMENTS_LENGTH, INVALID_BASE64_RE;
var init__polyfill_node_buffer = __esmMin((() => {
	init__polyfill_node_global();
	lookup = [];
	revLookup = [];
	Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
	inited = false;
	toString = {}.toString;
	isArray = Array.isArray || function(arr) {
		return toString.call(arr) == "[object Array]";
	};
	INSPECT_MAX_BYTES = 50;
	/**
	* If `Buffer.TYPED_ARRAY_SUPPORT`:
	*   === true    Use Uint8Array implementation (fastest)
	*   === false   Use Object implementation (most compatible, even IE6)
	*
	* Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	* Opera 11.6+, iOS 4.2+.
	*
	* Due to various browser bugs, sometimes the Object implementation will be used even
	* when the browser supports typed arrays.
	*
	* Note:
	*
	*   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	*     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	*
	*   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	*
	*   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	*     incorrect length in some situations.
	
	* We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	* get the Object implementation, which is slower but behaves correctly.
	*/
	Buffer.TYPED_ARRAY_SUPPORT = _polyfill_node_global_default.TYPED_ARRAY_SUPPORT !== void 0 ? _polyfill_node_global_default.TYPED_ARRAY_SUPPORT : true;
	_kMaxLength = kMaxLength();
	Buffer.poolSize = 8192;
	Buffer._augment = function(arr) {
		arr.__proto__ = Buffer.prototype;
		return arr;
	};
	/**
	* Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
	* if value is a number.
	* Buffer.from(str[, encoding])
	* Buffer.from(array)
	* Buffer.from(buffer)
	* Buffer.from(arrayBuffer[, byteOffset[, length]])
	**/
	Buffer.from = function(value, encodingOrOffset, length) {
		return from(null, value, encodingOrOffset, length);
	};
	if (Buffer.TYPED_ARRAY_SUPPORT) {
		Buffer.prototype.__proto__ = Uint8Array.prototype;
		Buffer.__proto__ = Uint8Array;
		if (typeof Symbol !== "undefined" && Symbol.species && Buffer[Symbol.species] === Buffer);
	}
	/**
	* Creates a new filled Buffer instance.
	* alloc(size[, fill[, encoding]])
	**/
	Buffer.alloc = function(size, fill, encoding) {
		return alloc(null, size, fill, encoding);
	};
	/**
	* Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
	* */
	Buffer.allocUnsafe = function(size) {
		return allocUnsafe(null, size);
	};
	/**
	* Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
	*/
	Buffer.allocUnsafeSlow = function(size) {
		return allocUnsafe(null, size);
	};
	Buffer.isBuffer = isBuffer;
	Buffer.compare = function compare(a, b) {
		if (!internalIsBuffer(a) || !internalIsBuffer(b)) throw new TypeError("Arguments must be Buffers");
		if (a === b) return 0;
		var x = a.length;
		var y = b.length;
		for (var i = 0, len = Math.min(x, y); i < len; ++i) if (a[i] !== b[i]) {
			x = a[i];
			y = b[i];
			break;
		}
		if (x < y) return -1;
		if (y < x) return 1;
		return 0;
	};
	Buffer.isEncoding = function isEncoding(encoding) {
		switch (String(encoding).toLowerCase()) {
			case "hex":
			case "utf8":
			case "utf-8":
			case "ascii":
			case "latin1":
			case "binary":
			case "base64":
			case "ucs2":
			case "ucs-2":
			case "utf16le":
			case "utf-16le": return true;
			default: return false;
		}
	};
	Buffer.concat = function concat(list, length) {
		if (!isArray(list)) throw new TypeError("\"list\" argument must be an Array of Buffers");
		if (list.length === 0) return Buffer.alloc(0);
		var i;
		if (length === void 0) {
			length = 0;
			for (i = 0; i < list.length; ++i) length += list[i].length;
		}
		var buffer = Buffer.allocUnsafe(length);
		var pos = 0;
		for (i = 0; i < list.length; ++i) {
			var buf = list[i];
			if (!internalIsBuffer(buf)) throw new TypeError("\"list\" argument must be an Array of Buffers");
			buf.copy(buffer, pos);
			pos += buf.length;
		}
		return buffer;
	};
	Buffer.byteLength = byteLength;
	Buffer.prototype._isBuffer = true;
	Buffer.prototype.swap16 = function swap16() {
		var len = this.length;
		if (len % 2 !== 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
		for (var i = 0; i < len; i += 2) swap(this, i, i + 1);
		return this;
	};
	Buffer.prototype.swap32 = function swap32() {
		var len = this.length;
		if (len % 4 !== 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
		for (var i = 0; i < len; i += 4) {
			swap(this, i, i + 3);
			swap(this, i + 1, i + 2);
		}
		return this;
	};
	Buffer.prototype.swap64 = function swap64() {
		var len = this.length;
		if (len % 8 !== 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
		for (var i = 0; i < len; i += 8) {
			swap(this, i, i + 7);
			swap(this, i + 1, i + 6);
			swap(this, i + 2, i + 5);
			swap(this, i + 3, i + 4);
		}
		return this;
	};
	Buffer.prototype.toString = function toString() {
		var length = this.length | 0;
		if (length === 0) return "";
		if (arguments.length === 0) return utf8Slice(this, 0, length);
		return slowToString.apply(this, arguments);
	};
	Buffer.prototype.equals = function equals(b) {
		if (!internalIsBuffer(b)) throw new TypeError("Argument must be a Buffer");
		if (this === b) return true;
		return Buffer.compare(this, b) === 0;
	};
	Buffer.prototype.inspect = function inspect() {
		var str = "";
		var max = 50;
		if (this.length > 0) {
			str = this.toString("hex", 0, max).match(/.{2}/g).join(" ");
			if (this.length > max) str += " ... ";
		}
		return "<Buffer " + str + ">";
	};
	Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
		if (!internalIsBuffer(target)) throw new TypeError("Argument must be a Buffer");
		if (start === void 0) start = 0;
		if (end === void 0) end = target ? target.length : 0;
		if (thisStart === void 0) thisStart = 0;
		if (thisEnd === void 0) thisEnd = this.length;
		if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) throw new RangeError("out of range index");
		if (thisStart >= thisEnd && start >= end) return 0;
		if (thisStart >= thisEnd) return -1;
		if (start >= end) return 1;
		start >>>= 0;
		end >>>= 0;
		thisStart >>>= 0;
		thisEnd >>>= 0;
		if (this === target) return 0;
		var x = thisEnd - thisStart;
		var y = end - start;
		var len = Math.min(x, y);
		var thisCopy = this.slice(thisStart, thisEnd);
		var targetCopy = target.slice(start, end);
		for (var i = 0; i < len; ++i) if (thisCopy[i] !== targetCopy[i]) {
			x = thisCopy[i];
			y = targetCopy[i];
			break;
		}
		if (x < y) return -1;
		if (y < x) return 1;
		return 0;
	};
	Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
		return this.indexOf(val, byteOffset, encoding) !== -1;
	};
	Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
		return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
	};
	Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
		return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
	};
	Buffer.prototype.write = function write(string, offset, length, encoding) {
		if (offset === void 0) {
			encoding = "utf8";
			length = this.length;
			offset = 0;
		} else if (length === void 0 && typeof offset === "string") {
			encoding = offset;
			length = this.length;
			offset = 0;
		} else if (isFinite(offset)) {
			offset = offset | 0;
			if (isFinite(length)) {
				length = length | 0;
				if (encoding === void 0) encoding = "utf8";
			} else {
				encoding = length;
				length = void 0;
			}
		} else throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
		var remaining = this.length - offset;
		if (length === void 0 || length > remaining) length = remaining;
		if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) throw new RangeError("Attempt to write outside buffer bounds");
		if (!encoding) encoding = "utf8";
		var loweredCase = false;
		for (;;) switch (encoding) {
			case "hex": return hexWrite(this, string, offset, length);
			case "utf8":
			case "utf-8": return utf8Write(this, string, offset, length);
			case "ascii": return asciiWrite(this, string, offset, length);
			case "latin1":
			case "binary": return latin1Write(this, string, offset, length);
			case "base64": return base64Write(this, string, offset, length);
			case "ucs2":
			case "ucs-2":
			case "utf16le":
			case "utf-16le": return ucs2Write(this, string, offset, length);
			default:
				if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
				encoding = ("" + encoding).toLowerCase();
				loweredCase = true;
		}
	};
	Buffer.prototype.toJSON = function toJSON() {
		return {
			type: "Buffer",
			data: Array.prototype.slice.call(this._arr || this, 0)
		};
	};
	MAX_ARGUMENTS_LENGTH = 4096;
	Buffer.prototype.slice = function slice(start, end) {
		var len = this.length;
		start = ~~start;
		end = end === void 0 ? len : ~~end;
		if (start < 0) {
			start += len;
			if (start < 0) start = 0;
		} else if (start > len) start = len;
		if (end < 0) {
			end += len;
			if (end < 0) end = 0;
		} else if (end > len) end = len;
		if (end < start) end = start;
		var newBuf;
		if (Buffer.TYPED_ARRAY_SUPPORT) {
			newBuf = this.subarray(start, end);
			newBuf.__proto__ = Buffer.prototype;
		} else {
			var sliceLen = end - start;
			newBuf = new Buffer(sliceLen, void 0);
			for (var i = 0; i < sliceLen; ++i) newBuf[i] = this[i + start];
		}
		return newBuf;
	};
	Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
		offset = offset | 0;
		byteLength = byteLength | 0;
		if (!noAssert) checkOffset(offset, byteLength, this.length);
		var val = this[offset];
		var mul = 1;
		var i = 0;
		while (++i < byteLength && (mul *= 256)) val += this[offset + i] * mul;
		return val;
	};
	Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
		offset = offset | 0;
		byteLength = byteLength | 0;
		if (!noAssert) checkOffset(offset, byteLength, this.length);
		var val = this[offset + --byteLength];
		var mul = 1;
		while (byteLength > 0 && (mul *= 256)) val += this[offset + --byteLength] * mul;
		return val;
	};
	Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
		if (!noAssert) checkOffset(offset, 1, this.length);
		return this[offset];
	};
	Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
		if (!noAssert) checkOffset(offset, 2, this.length);
		return this[offset] | this[offset + 1] << 8;
	};
	Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
		if (!noAssert) checkOffset(offset, 2, this.length);
		return this[offset] << 8 | this[offset + 1];
	};
	Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
		if (!noAssert) checkOffset(offset, 4, this.length);
		return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
	};
	Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
		if (!noAssert) checkOffset(offset, 4, this.length);
		return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
	};
	Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
		offset = offset | 0;
		byteLength = byteLength | 0;
		if (!noAssert) checkOffset(offset, byteLength, this.length);
		var val = this[offset];
		var mul = 1;
		var i = 0;
		while (++i < byteLength && (mul *= 256)) val += this[offset + i] * mul;
		mul *= 128;
		if (val >= mul) val -= Math.pow(2, 8 * byteLength);
		return val;
	};
	Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
		offset = offset | 0;
		byteLength = byteLength | 0;
		if (!noAssert) checkOffset(offset, byteLength, this.length);
		var i = byteLength;
		var mul = 1;
		var val = this[offset + --i];
		while (i > 0 && (mul *= 256)) val += this[offset + --i] * mul;
		mul *= 128;
		if (val >= mul) val -= Math.pow(2, 8 * byteLength);
		return val;
	};
	Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
		if (!noAssert) checkOffset(offset, 1, this.length);
		if (!(this[offset] & 128)) return this[offset];
		return (255 - this[offset] + 1) * -1;
	};
	Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
		if (!noAssert) checkOffset(offset, 2, this.length);
		var val = this[offset] | this[offset + 1] << 8;
		return val & 32768 ? val | 4294901760 : val;
	};
	Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
		if (!noAssert) checkOffset(offset, 2, this.length);
		var val = this[offset + 1] | this[offset] << 8;
		return val & 32768 ? val | 4294901760 : val;
	};
	Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
		if (!noAssert) checkOffset(offset, 4, this.length);
		return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
	};
	Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
		if (!noAssert) checkOffset(offset, 4, this.length);
		return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
	};
	Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
		if (!noAssert) checkOffset(offset, 4, this.length);
		return read(this, offset, true, 23, 4);
	};
	Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
		if (!noAssert) checkOffset(offset, 4, this.length);
		return read(this, offset, false, 23, 4);
	};
	Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
		if (!noAssert) checkOffset(offset, 8, this.length);
		return read(this, offset, true, 52, 8);
	};
	Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
		if (!noAssert) checkOffset(offset, 8, this.length);
		return read(this, offset, false, 52, 8);
	};
	Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
		value = +value;
		offset = offset | 0;
		byteLength = byteLength | 0;
		if (!noAssert) {
			var maxBytes = Math.pow(2, 8 * byteLength) - 1;
			checkInt(this, value, offset, byteLength, maxBytes, 0);
		}
		var mul = 1;
		var i = 0;
		this[offset] = value & 255;
		while (++i < byteLength && (mul *= 256)) this[offset + i] = value / mul & 255;
		return offset + byteLength;
	};
	Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
		value = +value;
		offset = offset | 0;
		byteLength = byteLength | 0;
		if (!noAssert) {
			var maxBytes = Math.pow(2, 8 * byteLength) - 1;
			checkInt(this, value, offset, byteLength, maxBytes, 0);
		}
		var i = byteLength - 1;
		var mul = 1;
		this[offset + i] = value & 255;
		while (--i >= 0 && (mul *= 256)) this[offset + i] = value / mul & 255;
		return offset + byteLength;
	};
	Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
		value = +value;
		offset = offset | 0;
		if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
		if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
		this[offset] = value & 255;
		return offset + 1;
	};
	Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
		value = +value;
		offset = offset | 0;
		if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
		if (Buffer.TYPED_ARRAY_SUPPORT) {
			this[offset] = value & 255;
			this[offset + 1] = value >>> 8;
		} else objectWriteUInt16(this, value, offset, true);
		return offset + 2;
	};
	Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
		value = +value;
		offset = offset | 0;
		if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
		if (Buffer.TYPED_ARRAY_SUPPORT) {
			this[offset] = value >>> 8;
			this[offset + 1] = value & 255;
		} else objectWriteUInt16(this, value, offset, false);
		return offset + 2;
	};
	Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
		value = +value;
		offset = offset | 0;
		if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
		if (Buffer.TYPED_ARRAY_SUPPORT) {
			this[offset + 3] = value >>> 24;
			this[offset + 2] = value >>> 16;
			this[offset + 1] = value >>> 8;
			this[offset] = value & 255;
		} else objectWriteUInt32(this, value, offset, true);
		return offset + 4;
	};
	Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
		value = +value;
		offset = offset | 0;
		if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
		if (Buffer.TYPED_ARRAY_SUPPORT) {
			this[offset] = value >>> 24;
			this[offset + 1] = value >>> 16;
			this[offset + 2] = value >>> 8;
			this[offset + 3] = value & 255;
		} else objectWriteUInt32(this, value, offset, false);
		return offset + 4;
	};
	Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
		value = +value;
		offset = offset | 0;
		if (!noAssert) {
			var limit = Math.pow(2, 8 * byteLength - 1);
			checkInt(this, value, offset, byteLength, limit - 1, -limit);
		}
		var i = 0;
		var mul = 1;
		var sub = 0;
		this[offset] = value & 255;
		while (++i < byteLength && (mul *= 256)) {
			if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) sub = 1;
			this[offset + i] = (value / mul >> 0) - sub & 255;
		}
		return offset + byteLength;
	};
	Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
		value = +value;
		offset = offset | 0;
		if (!noAssert) {
			var limit = Math.pow(2, 8 * byteLength - 1);
			checkInt(this, value, offset, byteLength, limit - 1, -limit);
		}
		var i = byteLength - 1;
		var mul = 1;
		var sub = 0;
		this[offset + i] = value & 255;
		while (--i >= 0 && (mul *= 256)) {
			if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) sub = 1;
			this[offset + i] = (value / mul >> 0) - sub & 255;
		}
		return offset + byteLength;
	};
	Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
		value = +value;
		offset = offset | 0;
		if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
		if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
		if (value < 0) value = 255 + value + 1;
		this[offset] = value & 255;
		return offset + 1;
	};
	Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
		value = +value;
		offset = offset | 0;
		if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
		if (Buffer.TYPED_ARRAY_SUPPORT) {
			this[offset] = value & 255;
			this[offset + 1] = value >>> 8;
		} else objectWriteUInt16(this, value, offset, true);
		return offset + 2;
	};
	Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
		value = +value;
		offset = offset | 0;
		if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
		if (Buffer.TYPED_ARRAY_SUPPORT) {
			this[offset] = value >>> 8;
			this[offset + 1] = value & 255;
		} else objectWriteUInt16(this, value, offset, false);
		return offset + 2;
	};
	Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
		value = +value;
		offset = offset | 0;
		if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
		if (Buffer.TYPED_ARRAY_SUPPORT) {
			this[offset] = value & 255;
			this[offset + 1] = value >>> 8;
			this[offset + 2] = value >>> 16;
			this[offset + 3] = value >>> 24;
		} else objectWriteUInt32(this, value, offset, true);
		return offset + 4;
	};
	Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
		value = +value;
		offset = offset | 0;
		if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
		if (value < 0) value = 4294967295 + value + 1;
		if (Buffer.TYPED_ARRAY_SUPPORT) {
			this[offset] = value >>> 24;
			this[offset + 1] = value >>> 16;
			this[offset + 2] = value >>> 8;
			this[offset + 3] = value & 255;
		} else objectWriteUInt32(this, value, offset, false);
		return offset + 4;
	};
	Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
		return writeFloat(this, value, offset, true, noAssert);
	};
	Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
		return writeFloat(this, value, offset, false, noAssert);
	};
	Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
		return writeDouble(this, value, offset, true, noAssert);
	};
	Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
		return writeDouble(this, value, offset, false, noAssert);
	};
	Buffer.prototype.copy = function copy(target, targetStart, start, end) {
		if (!start) start = 0;
		if (!end && end !== 0) end = this.length;
		if (targetStart >= target.length) targetStart = target.length;
		if (!targetStart) targetStart = 0;
		if (end > 0 && end < start) end = start;
		if (end === start) return 0;
		if (target.length === 0 || this.length === 0) return 0;
		if (targetStart < 0) throw new RangeError("targetStart out of bounds");
		if (start < 0 || start >= this.length) throw new RangeError("sourceStart out of bounds");
		if (end < 0) throw new RangeError("sourceEnd out of bounds");
		if (end > this.length) end = this.length;
		if (target.length - targetStart < end - start) end = target.length - targetStart + start;
		var len = end - start;
		var i;
		if (this === target && start < targetStart && targetStart < end) for (i = len - 1; i >= 0; --i) target[i + targetStart] = this[i + start];
		else if (len < 1e3 || !Buffer.TYPED_ARRAY_SUPPORT) for (i = 0; i < len; ++i) target[i + targetStart] = this[i + start];
		else Uint8Array.prototype.set.call(target, this.subarray(start, start + len), targetStart);
		return len;
	};
	Buffer.prototype.fill = function fill(val, start, end, encoding) {
		if (typeof val === "string") {
			if (typeof start === "string") {
				encoding = start;
				start = 0;
				end = this.length;
			} else if (typeof end === "string") {
				encoding = end;
				end = this.length;
			}
			if (val.length === 1) {
				var code = val.charCodeAt(0);
				if (code < 256) val = code;
			}
			if (encoding !== void 0 && typeof encoding !== "string") throw new TypeError("encoding must be a string");
			if (typeof encoding === "string" && !Buffer.isEncoding(encoding)) throw new TypeError("Unknown encoding: " + encoding);
		} else if (typeof val === "number") val = val & 255;
		if (start < 0 || this.length < start || this.length < end) throw new RangeError("Out of range index");
		if (end <= start) return this;
		start = start >>> 0;
		end = end === void 0 ? this.length : end >>> 0;
		if (!val) val = 0;
		var i;
		if (typeof val === "number") for (i = start; i < end; ++i) this[i] = val;
		else {
			var bytes = internalIsBuffer(val) ? val : utf8ToBytes(new Buffer(val, encoding).toString());
			var len = bytes.length;
			for (i = 0; i < end - start; ++i) this[i + start] = bytes[i % len];
		}
		return this;
	};
	INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;
}));

var _polyfill_node_path_exports = /* @__PURE__ */ __exportAll({
	basename: () => basename,
	default: () => _polyfill_node_path_default,
	delimiter: () => ":",
	dirname: () => dirname,
	extname: () => extname,
	isAbsolute: () => isAbsolute,
	join: () => join,
	normalize: () => normalize,
	relative: () => relative,
	resolve: () => resolve,
	sep: () => "/"
});
function normalizeArray(parts, allowAboveRoot) {
	var up = 0;
	for (var i = parts.length - 1; i >= 0; i--) {
		var last = parts[i];
		if (last === ".") parts.splice(i, 1);
		else if (last === "..") {
			parts.splice(i, 1);
			up++;
		} else if (up) {
			parts.splice(i, 1);
			up--;
		}
	}
	if (allowAboveRoot) for (; up--;) parts.unshift("..");
	return parts;
}
function resolve() {
	var resolvedPath = "", resolvedAbsolute = false;
	for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
		var path = i >= 0 ? arguments[i] : "/";
		if (typeof path !== "string") throw new TypeError("Arguments to path.resolve must be strings");
		else if (!path) continue;
		resolvedPath = path + "/" + resolvedPath;
		resolvedAbsolute = path.charAt(0) === "/";
	}
	resolvedPath = normalizeArray(filter(resolvedPath.split("/"), function(p) {
		return !!p;
	}), !resolvedAbsolute).join("/");
	return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
}
function normalize(path) {
	var isPathAbsolute = isAbsolute(path), trailingSlash = substr(path, -1) === "/";
	path = normalizeArray(filter(path.split("/"), function(p) {
		return !!p;
	}), !isPathAbsolute).join("/");
	if (!path && !isPathAbsolute) path = ".";
	if (path && trailingSlash) path += "/";
	return (isPathAbsolute ? "/" : "") + path;
}
function isAbsolute(path) {
	return path.charAt(0) === "/";
}
function join() {
	return normalize(filter(Array.prototype.slice.call(arguments, 0), function(p, index) {
		if (typeof p !== "string") throw new TypeError("Arguments to path.join must be strings");
		return p;
	}).join("/"));
}
function relative(from, to) {
	from = resolve(from).substr(1);
	to = resolve(to).substr(1);
	function trim(arr) {
		var start = 0;
		for (; start < arr.length; start++) if (arr[start] !== "") break;
		var end = arr.length - 1;
		for (; end >= 0; end--) if (arr[end] !== "") break;
		if (start > end) return [];
		return arr.slice(start, end - start + 1);
	}
	var fromParts = trim(from.split("/"));
	var toParts = trim(to.split("/"));
	var length = Math.min(fromParts.length, toParts.length);
	var samePartsLength = length;
	for (var i = 0; i < length; i++) if (fromParts[i] !== toParts[i]) {
		samePartsLength = i;
		break;
	}
	var outputParts = [];
	for (var i = samePartsLength; i < fromParts.length; i++) outputParts.push("..");
	outputParts = outputParts.concat(toParts.slice(samePartsLength));
	return outputParts.join("/");
}
function dirname(path) {
	var result = splitPath(path), root = result[0], dir = result[1];
	if (!root && !dir) return ".";
	if (dir) dir = dir.substr(0, dir.length - 1);
	return root + dir;
}
function basename(path, ext) {
	var f = splitPath(path)[2];
	if (ext && f.substr(-1 * ext.length) === ext) f = f.substr(0, f.length - ext.length);
	return f;
}
function extname(path) {
	return splitPath(path)[3];
}
function filter(xs, f) {
	if (xs.filter) return xs.filter(f);
	var res = [];
	for (var i = 0; i < xs.length; i++) if (f(xs[i], i, xs)) res.push(xs[i]);
	return res;
}
var splitPathRe, splitPath, sep, delimiter, _polyfill_node_path_default, substr;
var init__polyfill_node_path = __esmMin((() => {
	splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
	splitPath = function(filename) {
		return splitPathRe.exec(filename).slice(1);
	};
	sep = "/";
	delimiter = ":";
	_polyfill_node_path_default = {
		extname,
		basename,
		dirname,
		sep: "/",
		delimiter: ":",
		relative,
		join,
		isAbsolute,
		normalize,
		resolve
	};
	substr = "ab".substr(-1) === "b" ? function(str, start, len) {
		return str.substr(start, len);
	} : function(str, start, len) {
		if (start < 0) start = str.length + start;
		return str.substr(start, len);
	};
}));

var _polyfill_node_fs_exports = /* @__PURE__ */ __exportAll({ default: () => _polyfill_node_fs_default });
var _polyfill_node_fs_default;
var init__polyfill_node_fs = __esmMin((() => {
	_polyfill_node_fs_default = {};
}));

var _polyfill_node_crypto_exports = /* @__PURE__ */ __exportAll({ default: () => _polyfill_node_crypto_default });
var _polyfill_node_crypto_default;
var init__polyfill_node_crypto = __esmMin((() => {
	_polyfill_node_crypto_default = {};
}));

var _polyfill_node_module_exports = /* @__PURE__ */ __exportAll({});

export { init__polyfill_node_fs as a, Buffer as c, init__polyfill_node_process as d, _polyfill_node_global_default as f, _polyfill_node_fs_exports as i, init__polyfill_node_buffer as l, _polyfill_node_crypto_exports as n, _polyfill_node_path_exports as o, init__polyfill_node_global as p, init__polyfill_node_crypto as r, init__polyfill_node_path as s, _polyfill_node_module_exports as t, browser$1 as u };