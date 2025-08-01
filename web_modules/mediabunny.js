/*!
 * Copyright (c) 2025-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */ function assert(x) {
    if (!x) {
        throw new Error('Assertion failed.');
    }
}
const normalizeRotation = (rotation)=>{
    const mappedRotation = (rotation % 360 + 360) % 360;
    if (mappedRotation === 0 || mappedRotation === 90 || mappedRotation === 180 || mappedRotation === 270) {
        return mappedRotation;
    } else {
        throw new Error(`Invalid rotation ${rotation}.`);
    }
};
const last = (arr)=>{
    return arr && arr[arr.length - 1];
};
const isU32 = (value)=>{
    return value >= 0 && value < 2 ** 32;
};
class Bitstream {
    constructor(bytes){
        this.bytes = bytes;
        /** Current offset in bits. */ this.pos = 0;
    }
    seekToByte(byteOffset) {
        this.pos = 8 * byteOffset;
    }
    readBit() {
        const byteIndex = Math.floor(this.pos / 8);
        const byte = this.bytes[byteIndex] ?? 0;
        const bitIndex = 7 - (this.pos & 7);
        const bit = (byte & 1 << bitIndex) >> bitIndex;
        this.pos++;
        return bit;
    }
    readBits(n) {
        if (n === 1) {
            return this.readBit();
        }
        let result = 0;
        for(let i = 0; i < n; i++){
            result <<= 1;
            result |= this.readBit();
        }
        return result;
    }
    readAlignedByte() {
        // Ensure we're byte-aligned
        if (this.pos % 8 !== 0) {
            throw new Error('Bitstream is not byte-aligned.');
        }
        const byteIndex = this.pos / 8;
        const byte = this.bytes[byteIndex] ?? 0;
        this.pos += 8;
        return byte;
    }
    skipBits(n) {
        this.pos += n;
    }
    getBitsLeft() {
        return this.bytes.length * 8 - this.pos;
    }
    clone() {
        const clone = new Bitstream(this.bytes);
        clone.pos = this.pos;
        return clone;
    }
}
/** Reads an exponential-Golomb universal code from a Bitstream.  */ const readExpGolomb = (bitstream)=>{
    let leadingZeroBits = 0;
    while(bitstream.readBits(1) === 0 && leadingZeroBits < 32){
        leadingZeroBits++;
    }
    if (leadingZeroBits >= 32) {
        throw new Error('Invalid exponential-Golomb code.');
    }
    const result = (1 << leadingZeroBits) - 1 + bitstream.readBits(leadingZeroBits);
    return result;
};
/** Reads a signed exponential-Golomb universal code from a Bitstream. */ const readSignedExpGolomb = (bitstream)=>{
    const codeNum = readExpGolomb(bitstream);
    return (codeNum & 1) === 0 ? -(codeNum >> 1) : codeNum + 1 >> 1;
};
const writeBits = (bytes, start, end, value)=>{
    for(let i = start; i < end; i++){
        const byteIndex = Math.floor(i / 8);
        let byte = bytes[byteIndex];
        const bitIndex = 7 - (i & 7);
        byte &= ~(1 << bitIndex);
        byte |= (value & 1 << end - i - 1) >> end - i - 1 << bitIndex;
        bytes[byteIndex] = byte;
    }
};
const toUint8Array = (source)=>{
    if (source instanceof Uint8Array) {
        return source;
    } else if (source instanceof ArrayBuffer) {
        return new Uint8Array(source);
    } else {
        return new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
    }
};
const toDataView = (source)=>{
    if (source instanceof DataView) {
        return source;
    } else if (source instanceof ArrayBuffer) {
        return new DataView(source);
    } else {
        return new DataView(source.buffer, source.byteOffset, source.byteLength);
    }
};
const textEncoder = new TextEncoder();
const invertObject = (object)=>{
    return Object.fromEntries(Object.entries(object).map(([key, value])=>[
            value,
            key
        ]));
};
// For the color space mappings, see Rec. ITU-T H.273.
const COLOR_PRIMARIES_MAP = {
    bt709: 1,
    bt470bg: 5,
    smpte170m: 6,
    bt2020: 9,
    smpte432: 12
};
const COLOR_PRIMARIES_MAP_INVERSE = invertObject(COLOR_PRIMARIES_MAP);
const TRANSFER_CHARACTERISTICS_MAP = {
    'bt709': 1,
    'smpte170m': 6,
    'linear': 8,
    'iec61966-2-1': 13,
    'pg': 16,
    'hlg': 18
};
const TRANSFER_CHARACTERISTICS_MAP_INVERSE = invertObject(TRANSFER_CHARACTERISTICS_MAP);
const MATRIX_COEFFICIENTS_MAP = {
    'rgb': 0,
    'bt709': 1,
    'bt470bg': 5,
    'smpte170m': 6,
    'bt2020-ncl': 9
};
const MATRIX_COEFFICIENTS_MAP_INVERSE = invertObject(MATRIX_COEFFICIENTS_MAP);
const colorSpaceIsComplete = (colorSpace)=>{
    return !!colorSpace && !!colorSpace.primaries && !!colorSpace.transfer && !!colorSpace.matrix && colorSpace.fullRange !== undefined;
};
const isAllowSharedBufferSource = (x)=>{
    return x instanceof ArrayBuffer || typeof SharedArrayBuffer !== 'undefined' && x instanceof SharedArrayBuffer || ArrayBuffer.isView(x);
};
class AsyncMutex {
    constructor(){
        this.currentPromise = Promise.resolve();
    }
    async acquire() {
        let resolver;
        const nextPromise = new Promise((resolve)=>{
            resolver = resolve;
        });
        const currentPromiseAlias = this.currentPromise;
        this.currentPromise = nextPromise;
        await currentPromiseAlias;
        return resolver;
    }
}
const bytesToHexString = (bytes)=>{
    return [
        ...bytes
    ].map((x)=>x.toString(16).padStart(2, '0')).join('');
};
const reverseBitsU32 = (x)=>{
    x = x >> 1 & 0x55555555 | (x & 0x55555555) << 1;
    x = x >> 2 & 0x33333333 | (x & 0x33333333) << 2;
    x = x >> 4 & 0x0f0f0f0f | (x & 0x0f0f0f0f) << 4;
    x = x >> 8 & 0x00ff00ff | (x & 0x00ff00ff) << 8;
    x = x >> 16 & 0x0000ffff | (x & 0x0000ffff) << 16;
    return x >>> 0; // Ensure it's treated as an unsigned 32-bit integer
};
/** Returns the smallest index i such that val[i] === key, or -1 if no such index exists. */ const binarySearchExact = (arr, key, valueGetter)=>{
    let low = 0;
    let high = arr.length - 1;
    let ans = -1;
    while(low <= high){
        const mid = low + high >> 1;
        const midVal = valueGetter(arr[mid]);
        if (midVal === key) {
            ans = mid;
            high = mid - 1; // Continue searching left to find the lowest index
        } else if (midVal < key) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return ans;
};
/** Returns the largest index i such that val[i] <= key, or -1 if no such index exists. */ const binarySearchLessOrEqual = (arr, key, valueGetter)=>{
    let low = 0;
    let high = arr.length - 1;
    let ans = -1;
    while(low <= high){
        const mid = low + (high - low + 1) / 2 | 0;
        const midVal = valueGetter(arr[mid]);
        if (midVal <= key) {
            ans = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return ans;
};
const promiseWithResolvers = ()=>{
    let resolve;
    let reject;
    const promise = new Promise((res, rej)=>{
        resolve = res;
        reject = rej;
    });
    return {
        promise,
        resolve: resolve,
        reject: reject
    };
};
const removeItem = (arr, item)=>{
    const index = arr.indexOf(item);
    if (index !== -1) {
        arr.splice(index, 1);
    }
};
const findLast = (arr, predicate)=>{
    for(let i = arr.length - 1; i >= 0; i--){
        if (predicate(arr[i])) {
            return arr[i];
        }
    }
    return undefined;
};
const findLastIndex = (arr, predicate)=>{
    for(let i = arr.length - 1; i >= 0; i--){
        if (predicate(arr[i])) {
            return i;
        }
    }
    return -1;
};
const toAsyncIterator = async function*(source) {
    if (Symbol.iterator in source) {
        // @ts-expect-error Trust me
        yield* source[Symbol.iterator]();
    } else {
        // @ts-expect-error Trust me
        yield* source[Symbol.asyncIterator]();
    }
};
const validateAnyIterable = (iterable)=>{
    if (!(Symbol.iterator in iterable) && !(Symbol.asyncIterator in iterable)) {
        throw new TypeError('Argument must be an iterable or async iterable.');
    }
};
const assertNever = (x)=>{
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Unexpected value: ${x}`);
};
const getUint24 = (view, byteOffset, littleEndian)=>{
    const byte1 = view.getUint8(byteOffset);
    const byte2 = view.getUint8(byteOffset + 1);
    const byte3 = view.getUint8(byteOffset + 2);
    if (littleEndian) {
        return byte1 | byte2 << 8 | byte3 << 16;
    } else {
        return byte1 << 16 | byte2 << 8 | byte3;
    }
};
const getInt24 = (view, byteOffset, littleEndian)=>{
    // The left shift pushes the most significant bit into the sign bit region, and the subsequent right shift
    // then correctly interprets the sign bit.
    return getUint24(view, byteOffset, littleEndian) << 8 >> 8;
};
const setUint24 = (view, byteOffset, value, littleEndian)=>{
    // Ensure the value is within 24-bit unsigned range (0 to 16777215)
    value = value >>> 0; // Convert to unsigned 32-bit
    value = value & 0xFFFFFF; // Mask to 24 bits
    if (littleEndian) {
        view.setUint8(byteOffset, value & 0xFF);
        view.setUint8(byteOffset + 1, value >>> 8 & 0xFF);
        view.setUint8(byteOffset + 2, value >>> 16 & 0xFF);
    } else {
        view.setUint8(byteOffset, value >>> 16 & 0xFF);
        view.setUint8(byteOffset + 1, value >>> 8 & 0xFF);
        view.setUint8(byteOffset + 2, value & 0xFF);
    }
};
const setInt24 = (view, byteOffset, value, littleEndian)=>{
    // Ensure the value is within 24-bit signed range (-8388608 to 8388607)
    value = clamp(value, -8388608, 8388607);
    // Convert negative values to their 24-bit representation
    if (value < 0) {
        value = value + 0x1000000 & 0xFFFFFF;
    }
    setUint24(view, byteOffset, value, littleEndian);
};
const setInt64 = (view, byteOffset, value, littleEndian)=>{
    {
        view.setUint32(byteOffset + 0, value, true);
        view.setInt32(byteOffset + 4, Math.floor(value / 2 ** 32), true);
    }
};
/**
 * Calls a function on each value spat out by an async generator. The reason for writing this manually instead of
 * using a generator function is that the generator function queues return() calls - here, we forward them immediately.
 */ const mapAsyncGenerator = (generator, map)=>{
    return {
        async next () {
            const result = await generator.next();
            if (result.done) {
                return {
                    value: undefined,
                    done: true
                };
            } else {
                return {
                    value: map(result.value),
                    done: false
                };
            }
        },
        return () {
            return generator.return();
        },
        throw (error) {
            return generator.throw(error);
        },
        [Symbol.asyncIterator] () {
            return this;
        }
    };
};
const clamp = (value, min, max)=>{
    return Math.max(min, Math.min(max, value));
};
const UNDETERMINED_LANGUAGE = 'und';
const roundToPrecision = (value, digits)=>{
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
};
const roundToMultiple = (value, multiple)=>{
    return Math.round(value / multiple) * multiple;
};
const ilog = (x)=>{
    let ret = 0;
    while(x){
        ret++;
        x >>= 1;
    }
    return ret;
};
const ISO_639_2_REGEX = /^[a-z]{3}$/;
const isIso639Dash2LanguageCode = (x)=>{
    return ISO_639_2_REGEX.test(x);
};
// Since the result will be truncated, add a bit of eps to compensate for floating point errors
const SECOND_TO_MICROSECOND_FACTOR = 1e6 * (1 + Number.EPSILON);
const mergeObjectsDeeply = (a, b)=>{
    const result = {
        ...a
    };
    for(const key in b){
        if (typeof a[key] === 'object' && a[key] !== null && typeof b[key] === 'object' && b[key] !== null) {
            result[key] = mergeObjectsDeeply(a[key], b[key]);
        } else {
            result[key] = b[key];
        }
    }
    return result;
};
const retriedFetch = async (url, requestInit, getRetryDelay)=>{
    let attempts = 0;
    while(true){
        try {
            return await fetch(url, requestInit);
        } catch (error) {
            attempts++;
            const retryDelayInSeconds = getRetryDelay(attempts);
            if (retryDelayInSeconds === null) {
                throw error;
            }
            console.error('Retrying failed fetch. Error:', error);
            if (!Number.isFinite(retryDelayInSeconds) || retryDelayInSeconds < 0) {
                throw new TypeError('Retry delay must be a non-negative finite number.');
            }
            if (retryDelayInSeconds > 0) {
                await new Promise((resolve)=>setTimeout(resolve, 1000 * retryDelayInSeconds));
            }
        }
    }
};
const computeRationalApproximation = (x, maxDenominator)=>{
    // Handle negative numbers
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    let prevNumerator = 0, prevDenominator = 1;
    let currNumerator = 1, currDenominator = 0;
    // Continued fraction algorithm
    let remainder = x;
    while(true){
        const integer = Math.floor(remainder);
        // Calculate next convergent
        const nextNumerator = integer * currNumerator + prevNumerator;
        const nextDenominator = integer * currDenominator + prevDenominator;
        if (nextDenominator > maxDenominator) {
            return {
                numerator: sign * currNumerator,
                denominator: currDenominator
            };
        }
        prevNumerator = currNumerator;
        prevDenominator = currDenominator;
        currNumerator = nextNumerator;
        currDenominator = nextDenominator;
        remainder = 1 / (remainder - integer);
        // Guard against precision issues
        if (!isFinite(remainder)) {
            break;
        }
    }
    return {
        numerator: sign * currNumerator,
        denominator: currDenominator
    };
};
class CallSerializer {
    constructor(){
        this.currentPromise = Promise.resolve();
    }
    call(fn) {
        return this.currentPromise = this.currentPromise.then(fn);
    }
}

/*!
 * Copyright (c) 2025-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */ /**
 * Base class for custom video decoders. To add your own custom video decoder, extend this class, implement the
 * abstract methods and static `supports` method, and register the decoder using `registerDecoder`.
 * @public
 */ class CustomVideoDecoder {
    /** Returns true iff the decoder can decode the given codec configuration. */ // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static supports(codec, config) {
        return false;
    }
}
/**
 * Base class for custom audio decoders. To add your own custom audio decoder, extend this class, implement the
 * abstract methods and static `supports` method, and register the decoder using `registerDecoder`.
 * @public
 */ class CustomAudioDecoder {
    /** Returns true iff the decoder can decode the given codec configuration. */ // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static supports(codec, config) {
        return false;
    }
}
/**
 * Base class for custom video encoders. To add your own custom video encoder, extend this class, implement the
 * abstract methods and static `supports` method, and register the encoder using `registerEncoder`.
 * @public
 */ class CustomVideoEncoder {
    /** Returns true iff the encoder can encode the given codec configuration. */ // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static supports(codec, config) {
        return false;
    }
}
/**
 * Base class for custom audio encoders. To add your own custom audio encoder, extend this class, implement the
 * abstract methods and static `supports` method, and register the encoder using `registerEncoder`.
 * @public
 */ class CustomAudioEncoder {
    /** Returns true iff the encoder can encode the given codec configuration. */ // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static supports(codec, config) {
        return false;
    }
}
const customVideoDecoders = [];
const customAudioDecoders = [];
const customVideoEncoders = [];
const customAudioEncoders = [];
/**
 * Registers a custom video or audio decoder. Registered decoders will automatically be used for decoding whenever
 * possible.
 * @public
 */ const registerDecoder = (decoder)=>{
    if (decoder.prototype instanceof CustomVideoDecoder) {
        customVideoDecoders.push(decoder);
    } else if (decoder.prototype instanceof CustomAudioDecoder) {
        customAudioDecoders.push(decoder);
    } else {
        throw new TypeError('Decoder must be a CustomVideoDecoder or CustomAudioDecoder.');
    }
};
/**
 * Registers a custom video or audio encoder. Registered encoders will automatically be used for encoding whenever
 * possible.
 * @public
 */ const registerEncoder = (encoder)=>{
    if (encoder.prototype instanceof CustomVideoEncoder) {
        customVideoEncoders.push(encoder);
    } else if (encoder.prototype instanceof CustomAudioEncoder) {
        customAudioEncoders.push(encoder);
    } else {
        throw new TypeError('Encoder must be a CustomVideoEncoder or CustomAudioEncoder.');
    }
};

/**
 * List of known video codecs, ordered by encoding preference.
 * @public
 */ const VIDEO_CODECS = [
    'avc',
    'hevc',
    'vp9',
    'av1',
    'vp8'
];
/**
 * List of known PCM (uncompressed) audio codecs, ordered by encoding preference.
 * @public
 */ const PCM_AUDIO_CODECS = [
    'pcm-s16',
    'pcm-s16be',
    'pcm-s24',
    'pcm-s24be',
    'pcm-s32',
    'pcm-s32be',
    'pcm-f32',
    'pcm-f32be',
    'pcm-f64',
    'pcm-f64be',
    'pcm-u8',
    'pcm-s8',
    'ulaw',
    'alaw'
];
/**
 * List of known compressed audio codecs, ordered by encoding preference.
 * @public
 */ const NON_PCM_AUDIO_CODECS = [
    'aac',
    'opus',
    'mp3',
    'vorbis',
    'flac'
];
/**
 * List of known audio codecs, ordered by encoding preference.
 * @public
 */ const AUDIO_CODECS = [
    ...NON_PCM_AUDIO_CODECS,
    ...PCM_AUDIO_CODECS
];
/**
 * List of known subtitle codecs, ordered by encoding preference.
 * @public
 */ const SUBTITLE_CODECS = [
    'webvtt'
]; // TODO add the rest
// https://en.wikipedia.org/wiki/Advanced_Video_Coding
const AVC_LEVEL_TABLE = [
    {
        maxMacroblocks: 99,
        maxBitrate: 64000,
        level: 0x0A
    },
    {
        maxMacroblocks: 396,
        maxBitrate: 192000,
        level: 0x0B
    },
    {
        maxMacroblocks: 396,
        maxBitrate: 384000,
        level: 0x0C
    },
    {
        maxMacroblocks: 396,
        maxBitrate: 768000,
        level: 0x0D
    },
    {
        maxMacroblocks: 396,
        maxBitrate: 2000000,
        level: 0x14
    },
    {
        maxMacroblocks: 792,
        maxBitrate: 4000000,
        level: 0x15
    },
    {
        maxMacroblocks: 1620,
        maxBitrate: 4000000,
        level: 0x16
    },
    {
        maxMacroblocks: 1620,
        maxBitrate: 10000000,
        level: 0x1E
    },
    {
        maxMacroblocks: 3600,
        maxBitrate: 14000000,
        level: 0x1F
    },
    {
        maxMacroblocks: 5120,
        maxBitrate: 20000000,
        level: 0x20
    },
    {
        maxMacroblocks: 8192,
        maxBitrate: 20000000,
        level: 0x28
    },
    {
        maxMacroblocks: 8192,
        maxBitrate: 50000000,
        level: 0x29
    },
    {
        maxMacroblocks: 8704,
        maxBitrate: 50000000,
        level: 0x2A
    },
    {
        maxMacroblocks: 22080,
        maxBitrate: 135000000,
        level: 0x32
    },
    {
        maxMacroblocks: 36864,
        maxBitrate: 240000000,
        level: 0x33
    },
    {
        maxMacroblocks: 36864,
        maxBitrate: 240000000,
        level: 0x34
    },
    {
        maxMacroblocks: 139264,
        maxBitrate: 240000000,
        level: 0x3C
    },
    {
        maxMacroblocks: 139264,
        maxBitrate: 480000000,
        level: 0x3D
    },
    {
        maxMacroblocks: 139264,
        maxBitrate: 800000000,
        level: 0x3E
    }
];
// https://en.wikipedia.org/wiki/High_Efficiency_Video_Coding
const HEVC_LEVEL_TABLE = [
    {
        maxPictureSize: 36864,
        maxBitrate: 128000,
        tier: 'L',
        level: 30
    },
    {
        maxPictureSize: 122880,
        maxBitrate: 1500000,
        tier: 'L',
        level: 60
    },
    {
        maxPictureSize: 245760,
        maxBitrate: 3000000,
        tier: 'L',
        level: 63
    },
    {
        maxPictureSize: 552960,
        maxBitrate: 6000000,
        tier: 'L',
        level: 90
    },
    {
        maxPictureSize: 983040,
        maxBitrate: 10000000,
        tier: 'L',
        level: 93
    },
    {
        maxPictureSize: 2228224,
        maxBitrate: 12000000,
        tier: 'L',
        level: 120
    },
    {
        maxPictureSize: 2228224,
        maxBitrate: 30000000,
        tier: 'H',
        level: 120
    },
    {
        maxPictureSize: 2228224,
        maxBitrate: 20000000,
        tier: 'L',
        level: 123
    },
    {
        maxPictureSize: 2228224,
        maxBitrate: 50000000,
        tier: 'H',
        level: 123
    },
    {
        maxPictureSize: 8912896,
        maxBitrate: 25000000,
        tier: 'L',
        level: 150
    },
    {
        maxPictureSize: 8912896,
        maxBitrate: 100000000,
        tier: 'H',
        level: 150
    },
    {
        maxPictureSize: 8912896,
        maxBitrate: 40000000,
        tier: 'L',
        level: 153
    },
    {
        maxPictureSize: 8912896,
        maxBitrate: 160000000,
        tier: 'H',
        level: 153
    },
    {
        maxPictureSize: 8912896,
        maxBitrate: 60000000,
        tier: 'L',
        level: 156
    },
    {
        maxPictureSize: 8912896,
        maxBitrate: 240000000,
        tier: 'H',
        level: 156
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 60000000,
        tier: 'L',
        level: 180
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 240000000,
        tier: 'H',
        level: 180
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 120000000,
        tier: 'L',
        level: 183
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 480000000,
        tier: 'H',
        level: 183
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 240000000,
        tier: 'L',
        level: 186
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 800000000,
        tier: 'H',
        level: 186
    }
];
// https://en.wikipedia.org/wiki/VP9
const VP9_LEVEL_TABLE = [
    {
        maxPictureSize: 36864,
        maxBitrate: 200000,
        level: 10
    },
    {
        maxPictureSize: 73728,
        maxBitrate: 800000,
        level: 11
    },
    {
        maxPictureSize: 122880,
        maxBitrate: 1800000,
        level: 20
    },
    {
        maxPictureSize: 245760,
        maxBitrate: 3600000,
        level: 21
    },
    {
        maxPictureSize: 552960,
        maxBitrate: 7200000,
        level: 30
    },
    {
        maxPictureSize: 983040,
        maxBitrate: 12000000,
        level: 31
    },
    {
        maxPictureSize: 2228224,
        maxBitrate: 18000000,
        level: 40
    },
    {
        maxPictureSize: 2228224,
        maxBitrate: 30000000,
        level: 41
    },
    {
        maxPictureSize: 8912896,
        maxBitrate: 60000000,
        level: 50
    },
    {
        maxPictureSize: 8912896,
        maxBitrate: 120000000,
        level: 51
    },
    {
        maxPictureSize: 8912896,
        maxBitrate: 180000000,
        level: 52
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 180000000,
        level: 60
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 240000000,
        level: 61
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 480000000,
        level: 62
    }
];
// https://en.wikipedia.org/wiki/AV1
const AV1_LEVEL_TABLE = [
    {
        maxPictureSize: 147456,
        maxBitrate: 1500000,
        tier: 'M',
        level: 0
    },
    {
        maxPictureSize: 278784,
        maxBitrate: 3000000,
        tier: 'M',
        level: 1
    },
    {
        maxPictureSize: 665856,
        maxBitrate: 6000000,
        tier: 'M',
        level: 4
    },
    {
        maxPictureSize: 1065024,
        maxBitrate: 10000000,
        tier: 'M',
        level: 5
    },
    {
        maxPictureSize: 2359296,
        maxBitrate: 12000000,
        tier: 'M',
        level: 8
    },
    {
        maxPictureSize: 2359296,
        maxBitrate: 30000000,
        tier: 'H',
        level: 8
    },
    {
        maxPictureSize: 2359296,
        maxBitrate: 20000000,
        tier: 'M',
        level: 9
    },
    {
        maxPictureSize: 2359296,
        maxBitrate: 50000000,
        tier: 'H',
        level: 9
    },
    {
        maxPictureSize: 8912896,
        maxBitrate: 30000000,
        tier: 'M',
        level: 12
    },
    {
        maxPictureSize: 8912896,
        maxBitrate: 100000000,
        tier: 'H',
        level: 12
    },
    {
        maxPictureSize: 8912896,
        maxBitrate: 40000000,
        tier: 'M',
        level: 13
    },
    {
        maxPictureSize: 8912896,
        maxBitrate: 160000000,
        tier: 'H',
        level: 13
    },
    {
        maxPictureSize: 8912896,
        maxBitrate: 60000000,
        tier: 'M',
        level: 14
    },
    {
        maxPictureSize: 8912896,
        maxBitrate: 240000000,
        tier: 'H',
        level: 14
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 60000000,
        tier: 'M',
        level: 15
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 240000000,
        tier: 'H',
        level: 15
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 60000000,
        tier: 'M',
        level: 16
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 240000000,
        tier: 'H',
        level: 16
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 100000000,
        tier: 'M',
        level: 17
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 480000000,
        tier: 'H',
        level: 17
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 160000000,
        tier: 'M',
        level: 18
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 800000000,
        tier: 'H',
        level: 18
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 160000000,
        tier: 'M',
        level: 19
    },
    {
        maxPictureSize: 35651584,
        maxBitrate: 800000000,
        tier: 'H',
        level: 19
    }
];
const VP9_DEFAULT_SUFFIX = '.01.01.01.01.00';
const AV1_DEFAULT_SUFFIX = '.0.110.01.01.01.0';
const buildVideoCodecString = (codec, width, height, bitrate)=>{
    if (codec === 'avc') {
        const profileIndication = 0x64; // High Profile
        const totalMacroblocks = Math.ceil(width / 16) * Math.ceil(height / 16);
        // Determine the level based on the table
        const levelInfo = AVC_LEVEL_TABLE.find((level)=>totalMacroblocks <= level.maxMacroblocks && bitrate <= level.maxBitrate) ?? last(AVC_LEVEL_TABLE);
        const levelIndication = levelInfo ? levelInfo.level : 0;
        const hexProfileIndication = profileIndication.toString(16).padStart(2, '0');
        const hexProfileCompatibility = '00';
        const hexLevelIndication = levelIndication.toString(16).padStart(2, '0');
        return `avc1.${hexProfileIndication}${hexProfileCompatibility}${hexLevelIndication}`;
    } else if (codec === 'hevc') {
        const profilePrefix = ''; // Profile space 0
        const profileIdc = 1; // Main Profile
        const compatibilityFlags = '6'; // Taken from the example in ISO 14496-15
        const pictureSize = width * height;
        const levelInfo = HEVC_LEVEL_TABLE.find((level)=>pictureSize <= level.maxPictureSize && bitrate <= level.maxBitrate) ?? last(HEVC_LEVEL_TABLE);
        const constraintFlags = 'B0'; // Progressive source flag
        return 'hev1.' + `${profilePrefix}${profileIdc}.` + `${compatibilityFlags}.` + `${levelInfo.tier}${levelInfo.level}.` + `${constraintFlags}`;
    } else if (codec === 'vp8') {
        return 'vp8'; // Easy, this one
    } else if (codec === 'vp9') {
        const profile = '00'; // Profile 0
        const pictureSize = width * height;
        const levelInfo = VP9_LEVEL_TABLE.find((level)=>pictureSize <= level.maxPictureSize && bitrate <= level.maxBitrate) ?? last(VP9_LEVEL_TABLE);
        const bitDepth = '08'; // 8-bit
        return `vp09.${profile}.${levelInfo.level.toString().padStart(2, '0')}.${bitDepth}`;
    } else if (codec === 'av1') {
        const profile = 0; // Main Profile, single digit
        const pictureSize = width * height;
        const levelInfo = AV1_LEVEL_TABLE.find((level)=>pictureSize <= level.maxPictureSize && bitrate <= level.maxBitrate) ?? last(AV1_LEVEL_TABLE);
        const level = levelInfo.level.toString().padStart(2, '0');
        const bitDepth = '08'; // 8-bit
        return `av01.${profile}.${level}${levelInfo.tier}.${bitDepth}`;
    }
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new TypeError(`Unhandled codec '${codec}'.`);
};
const generateVp9CodecConfigurationFromCodecString = (codecString)=>{
    // Reference: https://www.webmproject.org/docs/container/#vp9-codec-feature-metadata-codecprivate
    const parts = codecString.split('.'); // We can derive the required values from the codec string
    const profile = Number(parts[1]);
    const level = Number(parts[2]);
    const bitDepth = Number(parts[3]);
    const chromaSubsampling = parts[4] ? Number(parts[4]) : 1;
    return [
        1,
        1,
        profile,
        2,
        1,
        level,
        3,
        1,
        bitDepth,
        4,
        1,
        chromaSubsampling
    ];
};
const generateAv1CodecConfigurationFromCodecString = (codecString)=>{
    // Reference: https://aomediacodec.github.io/av1-isobmff/
    const parts = codecString.split('.'); // We can derive the required values from the codec string
    const marker = 1;
    const version = 1;
    const firstByte = (marker << 7) + version;
    const profile = Number(parts[1]);
    const levelAndTier = parts[2];
    const level = Number(levelAndTier.slice(0, -1));
    const secondByte = (profile << 5) + level;
    const tier = levelAndTier.slice(-1) === 'H' ? 1 : 0;
    const bitDepth = Number(parts[3]);
    const highBitDepth = bitDepth === 8 ? 0 : 1;
    const twelveBit = 0;
    const monochrome = parts[4] ? Number(parts[4]) : 0;
    const chromaSubsamplingX = parts[5] ? Number(parts[5][0]) : 1;
    const chromaSubsamplingY = parts[5] ? Number(parts[5][1]) : 1;
    const chromaSamplePosition = parts[5] ? Number(parts[5][2]) : 0; // CSP_UNKNOWN
    const thirdByte = (tier << 7) + (highBitDepth << 6) + (twelveBit << 5) + (monochrome << 4) + (chromaSubsamplingX << 3) + (chromaSubsamplingY << 2) + chromaSamplePosition;
    const initialPresentationDelayPresent = 0; // Should be fine
    const fourthByte = initialPresentationDelayPresent;
    return [
        firstByte,
        secondByte,
        thirdByte,
        fourthByte
    ];
};
const extractVideoCodecString = (trackInfo)=>{
    const { codec, codecDescription, colorSpace, avcCodecInfo, hevcCodecInfo, vp9CodecInfo, av1CodecInfo } = trackInfo;
    if (codec === 'avc') {
        if (avcCodecInfo) {
            const bytes = new Uint8Array([
                avcCodecInfo.avcProfileIndication,
                avcCodecInfo.profileCompatibility,
                avcCodecInfo.avcLevelIndication
            ]);
            return `avc1.${bytesToHexString(bytes)}`;
        }
        if (!codecDescription || codecDescription.byteLength < 4) {
            throw new TypeError('AVC decoder description is not provided or is not at least 4 bytes long.');
        }
        return `avc1.${bytesToHexString(codecDescription.subarray(1, 4))}`;
    } else if (codec === 'hevc') {
        let generalProfileSpace;
        let generalProfileIdc;
        let compatibilityFlags;
        let generalTierFlag;
        let generalLevelIdc;
        let constraintFlags;
        if (hevcCodecInfo) {
            generalProfileSpace = hevcCodecInfo.generalProfileSpace;
            generalProfileIdc = hevcCodecInfo.generalProfileIdc;
            compatibilityFlags = reverseBitsU32(hevcCodecInfo.generalProfileCompatibilityFlags);
            generalTierFlag = hevcCodecInfo.generalTierFlag;
            generalLevelIdc = hevcCodecInfo.generalLevelIdc;
            constraintFlags = [
                ...hevcCodecInfo.generalConstraintIndicatorFlags
            ];
        } else {
            if (!codecDescription || codecDescription.byteLength < 23) {
                throw new TypeError('HEVC decoder description is not provided or is not at least 23 bytes long.');
            }
            const view = toDataView(codecDescription);
            const profileByte = view.getUint8(1);
            generalProfileSpace = profileByte >> 6 & 0x03;
            generalProfileIdc = profileByte & 0x1F;
            compatibilityFlags = reverseBitsU32(view.getUint32(2));
            generalTierFlag = profileByte >> 5 & 0x01;
            generalLevelIdc = view.getUint8(12);
            constraintFlags = [];
            for(let i = 0; i < 6; i++){
                constraintFlags.push(view.getUint8(6 + i));
            }
        }
        let codecString = 'hev1.';
        codecString += [
            '',
            'A',
            'B',
            'C'
        ][generalProfileSpace] + generalProfileIdc;
        codecString += '.';
        codecString += compatibilityFlags.toString(16).toUpperCase();
        codecString += '.';
        codecString += generalTierFlag === 0 ? 'L' : 'H';
        codecString += generalLevelIdc;
        while(constraintFlags.length > 0 && constraintFlags[constraintFlags.length - 1] === 0){
            constraintFlags.pop();
        }
        if (constraintFlags.length > 0) {
            codecString += '.';
            codecString += constraintFlags.map((x)=>x.toString(16).toUpperCase()).join('.');
        }
        return codecString;
    } else if (codec === 'vp8') {
        return 'vp8'; // Easy, this one
    } else if (codec === 'vp9') {
        if (!vp9CodecInfo) {
            // Calculate level based on dimensions
            const pictureSize = trackInfo.width * trackInfo.height;
            let level = last(VP9_LEVEL_TABLE).level; // Default to highest level
            for (const entry of VP9_LEVEL_TABLE){
                if (pictureSize <= entry.maxPictureSize) {
                    level = entry.level;
                    break;
                }
            }
            // We don't really know better, so let's return a general-purpose, common codec string and hope for the best
            return `vp09.00.${level.toString().padStart(2, '0')}.08`;
        }
        const profile = vp9CodecInfo.profile.toString().padStart(2, '0');
        const level = vp9CodecInfo.level.toString().padStart(2, '0');
        const bitDepth = vp9CodecInfo.bitDepth.toString().padStart(2, '0');
        const chromaSubsampling = vp9CodecInfo.chromaSubsampling.toString().padStart(2, '0');
        const colourPrimaries = vp9CodecInfo.colourPrimaries.toString().padStart(2, '0');
        const transferCharacteristics = vp9CodecInfo.transferCharacteristics.toString().padStart(2, '0');
        const matrixCoefficients = vp9CodecInfo.matrixCoefficients.toString().padStart(2, '0');
        const videoFullRangeFlag = vp9CodecInfo.videoFullRangeFlag.toString().padStart(2, '0');
        let string = `vp09.${profile}.${level}.${bitDepth}.${chromaSubsampling}`;
        string += `.${colourPrimaries}.${transferCharacteristics}.${matrixCoefficients}.${videoFullRangeFlag}`;
        if (string.endsWith(VP9_DEFAULT_SUFFIX)) {
            string = string.slice(0, -VP9_DEFAULT_SUFFIX.length);
        }
        return string;
    } else if (codec === 'av1') {
        if (!av1CodecInfo) {
            // Calculate level based on dimensions
            const pictureSize = trackInfo.width * trackInfo.height;
            let level = last(VP9_LEVEL_TABLE).level; // Default to highest level
            for (const entry of VP9_LEVEL_TABLE){
                if (pictureSize <= entry.maxPictureSize) {
                    level = entry.level;
                    break;
                }
            }
            // We don't really know better, so let's return a general-purpose, common codec string and hope for the best
            return `av01.0.${level.toString().padStart(2, '0')}M.08`;
        }
        // https://aomediacodec.github.io/av1-isobmff/#codecsparam
        const profile = av1CodecInfo.profile; // Single digit
        const level = av1CodecInfo.level.toString().padStart(2, '0');
        const tier = av1CodecInfo.tier ? 'H' : 'M';
        const bitDepth = av1CodecInfo.bitDepth.toString().padStart(2, '0');
        const monochrome = av1CodecInfo.monochrome ? '1' : '0';
        const chromaSubsampling = 100 * av1CodecInfo.chromaSubsamplingX + 10 * av1CodecInfo.chromaSubsamplingY + 1 * (av1CodecInfo.chromaSubsamplingX && av1CodecInfo.chromaSubsamplingY ? av1CodecInfo.chromaSamplePosition : 0);
        // The defaults are 1 (ITU-R BT.709)
        const colorPrimaries = colorSpace?.primaries ? COLOR_PRIMARIES_MAP[colorSpace.primaries] : 1;
        const transferCharacteristics = colorSpace?.transfer ? TRANSFER_CHARACTERISTICS_MAP[colorSpace.transfer] : 1;
        const matrixCoefficients = colorSpace?.matrix ? MATRIX_COEFFICIENTS_MAP[colorSpace.matrix] : 1;
        const videoFullRangeFlag = colorSpace?.fullRange ? 1 : 0;
        let string = `av01.${profile}.${level}${tier}.${bitDepth}`;
        string += `.${monochrome}.${chromaSubsampling.toString().padStart(3, '0')}`;
        string += `.${colorPrimaries.toString().padStart(2, '0')}`;
        string += `.${transferCharacteristics.toString().padStart(2, '0')}`;
        string += `.${matrixCoefficients.toString().padStart(2, '0')}`;
        string += `.${videoFullRangeFlag}`;
        if (string.endsWith(AV1_DEFAULT_SUFFIX)) {
            string = string.slice(0, -AV1_DEFAULT_SUFFIX.length);
        }
        return string;
    }
    throw new TypeError(`Unhandled codec '${codec}'.`);
};
const buildAudioCodecString = (codec, numberOfChannels, sampleRate)=>{
    if (codec === 'aac') {
        // If stereo or higher channels and lower sample rate, likely using HE-AAC v2 with PS
        if (numberOfChannels >= 2 && sampleRate <= 24000) {
            return 'mp4a.40.29'; // HE-AAC v2 (AAC LC + SBR + PS)
        }
        // If sample rate is low, likely using HE-AAC v1 with SBR
        if (sampleRate <= 24000) {
            return 'mp4a.40.5'; // HE-AAC v1 (AAC LC + SBR)
        }
        // Default to standard AAC-LC for higher sample rates
        return 'mp4a.40.2'; // AAC-LC
    } else if (codec === 'mp3') {
        return 'mp3';
    } else if (codec === 'opus') {
        return 'opus';
    } else if (codec === 'vorbis') {
        return 'vorbis';
    } else if (codec === 'flac') {
        return 'flac';
    } else if (PCM_AUDIO_CODECS.includes(codec)) {
        return codec;
    }
    throw new TypeError(`Unhandled codec '${codec}'.`);
};
const extractAudioCodecString = (trackInfo)=>{
    const { codec, codecDescription, aacCodecInfo } = trackInfo;
    if (codec === 'aac') {
        if (!aacCodecInfo) {
            throw new TypeError('AAC codec info must be provided.');
        }
        if (aacCodecInfo.isMpeg2) {
            return 'mp4a.67';
        } else {
            const audioSpecificConfig = parseAacAudioSpecificConfig(codecDescription);
            return `mp4a.40.${audioSpecificConfig.objectType}`;
        }
    } else if (codec === 'mp3') {
        return 'mp3';
    } else if (codec === 'opus') {
        return 'opus';
    } else if (codec === 'vorbis') {
        return 'vorbis';
    } else if (codec === 'flac') {
        return 'flac';
    } else if (codec && PCM_AUDIO_CODECS.includes(codec)) {
        return codec;
    }
    throw new TypeError(`Unhandled codec '${codec}'.`);
};
const parseAacAudioSpecificConfig = (bytes)=>{
    if (!bytes || bytes.byteLength < 2) {
        throw new TypeError('AAC description must be at least 2 bytes long.');
    }
    const bitstream = new Bitstream(bytes);
    let objectType = bitstream.readBits(5);
    if (objectType === 31) {
        objectType = 32 + bitstream.readBits(6);
    }
    const frequencyIndex = bitstream.readBits(4);
    let sampleRate = null;
    if (frequencyIndex === 15) {
        sampleRate = bitstream.readBits(24);
    } else {
        const freqTable = [
            96000,
            88200,
            64000,
            48000,
            44100,
            32000,
            24000,
            22050,
            16000,
            12000,
            11025,
            8000,
            7350
        ];
        if (frequencyIndex < freqTable.length) {
            sampleRate = freqTable[frequencyIndex];
        }
    }
    const channelConfiguration = bitstream.readBits(4);
    let numberOfChannels = null;
    if (channelConfiguration >= 1 && channelConfiguration <= 7) {
        const channelMap = {
            1: 1,
            2: 2,
            3: 3,
            4: 4,
            5: 5,
            6: 6,
            7: 8
        };
        numberOfChannels = channelMap[channelConfiguration];
    }
    return {
        objectType,
        frequencyIndex,
        sampleRate,
        channelConfiguration,
        numberOfChannels
    };
};
const OPUS_INTERNAL_SAMPLE_RATE = 48000;
const PCM_CODEC_REGEX = /^pcm-([usf])(\d+)+(be)?$/;
const parsePcmCodec = (codec)=>{
    assert(PCM_AUDIO_CODECS.includes(codec));
    if (codec === 'ulaw') {
        return {
            dataType: 'ulaw',
            sampleSize: 1,
            littleEndian: true,
            silentValue: 255
        };
    } else if (codec === 'alaw') {
        return {
            dataType: 'alaw',
            sampleSize: 1,
            littleEndian: true,
            silentValue: 213
        };
    }
    const match = PCM_CODEC_REGEX.exec(codec);
    assert(match);
    let dataType;
    if (match[1] === 'u') {
        dataType = 'unsigned';
    } else if (match[1] === 's') {
        dataType = 'signed';
    } else {
        dataType = 'float';
    }
    const sampleSize = Number(match[2]) / 8;
    const littleEndian = match[3] !== 'be';
    const silentValue = codec === 'pcm-u8' ? 2 ** 7 : 0;
    return {
        dataType,
        sampleSize,
        littleEndian,
        silentValue
    };
};
const inferCodecFromCodecString = (codecString)=>{
    // Video codecs
    if (codecString.startsWith('avc1') || codecString.startsWith('avc3')) {
        return 'avc';
    } else if (codecString.startsWith('hev1') || codecString.startsWith('hvc1')) {
        return 'hevc';
    } else if (codecString === 'vp8') {
        return 'vp8';
    } else if (codecString.startsWith('vp09')) {
        return 'vp9';
    } else if (codecString.startsWith('av01')) {
        return 'av1';
    }
    // Audio codecs
    if (codecString.startsWith('mp4a.40') || codecString === 'mp4a.67') {
        return 'aac';
    } else if (codecString === 'mp3' || codecString === 'mp4a.69' || codecString === 'mp4a.6B' || codecString === 'mp4a.6b') {
        return 'mp3';
    } else if (codecString === 'opus') {
        return 'opus';
    } else if (codecString === 'vorbis') {
        return 'vorbis';
    } else if (codecString === 'flac') {
        return 'flac';
    } else if (codecString === 'ulaw') {
        return 'ulaw';
    } else if (codecString === 'alaw') {
        return 'alaw';
    } else if (PCM_CODEC_REGEX.test(codecString)) {
        return codecString;
    }
    // Subtitle codecs
    if (codecString === 'webvtt') {
        return 'webvtt';
    }
    return null;
};
const getVideoEncoderConfigExtension = (codec)=>{
    if (codec === 'avc') {
        return {
            avc: {
                format: 'avc'
            }
        };
    } else if (codec === 'hevc') {
        return {
            hevc: {
                format: 'hevc'
            }
        };
    }
    return {};
};
const getAudioEncoderConfigExtension = (codec)=>{
    if (codec === 'aac') {
        return {
            aac: {
                format: 'aac'
            }
        };
    } else if (codec === 'opus') {
        return {
            opus: {
                format: 'opus'
            }
        };
    }
    return {};
};
/**
 * Represents a subjective media quality level.
 * @public
 */ class Quality {
    /** @internal */ constructor(factor){
        this._factor = factor;
    }
    /** @internal */ _toVideoBitrate(codec, width, height) {
        const pixels = width * height;
        const codecEfficiencyFactors = {
            avc: 1.0,
            hevc: 0.6,
            vp9: 0.6,
            av1: 0.4,
            vp8: 1.2
        };
        const referencePixels = 1920 * 1080;
        const referenceBitrate = 3000000;
        const scaleFactor = Math.pow(pixels / referencePixels, 0.95); // Slight non-linear scaling
        const baseBitrate = referenceBitrate * scaleFactor;
        const codecAdjustedBitrate = baseBitrate * codecEfficiencyFactors[codec];
        const finalBitrate = codecAdjustedBitrate * this._factor;
        return Math.ceil(finalBitrate / 1000) * 1000;
    }
    /** @internal */ _toAudioBitrate(codec) {
        if (PCM_AUDIO_CODECS.includes(codec) || codec === 'flac') {
            return undefined;
        }
        const baseRates = {
            aac: 128000,
            opus: 64000,
            mp3: 160000,
            vorbis: 64000
        };
        const baseBitrate = baseRates[codec];
        if (!baseBitrate) {
            throw new Error(`Unhandled codec: ${codec}`);
        }
        let finalBitrate = baseBitrate * this._factor;
        if (codec === 'aac') {
            // AAC only works with specific bitrates, let's find the closest
            const validRates = [
                96000,
                128000,
                160000,
                192000
            ];
            finalBitrate = validRates.reduce((prev, curr)=>Math.abs(curr - finalBitrate) < Math.abs(prev - finalBitrate) ? curr : prev);
        } else if (codec === 'opus' || codec === 'vorbis') {
            finalBitrate = Math.max(6000, finalBitrate);
        } else if (codec === 'mp3') {
            const validRates = [
                8000,
                16000,
                24000,
                32000,
                40000,
                48000,
                64000,
                80000,
                96000,
                112000,
                128000,
                160000,
                192000,
                224000,
                256000,
                320000
            ];
            finalBitrate = validRates.reduce((prev, curr)=>Math.abs(curr - finalBitrate) < Math.abs(prev - finalBitrate) ? curr : prev);
        }
        return Math.round(finalBitrate / 1000) * 1000;
    }
}
/**
 * Represents a very low media quality.
 * @public
 */ const QUALITY_VERY_LOW = new Quality(0.3);
/**
 * Represents a low media quality.
 * @public
 */ const QUALITY_LOW = new Quality(0.6);
/**
 * Represents a medium media quality.
 * @public
 */ const QUALITY_MEDIUM = new Quality(1);
/**
 * Represents a high media quality.
 * @public
 */ const QUALITY_HIGH = new Quality(2);
/**
 * Represents a very high media quality.
 * @public
 */ const QUALITY_VERY_HIGH = new Quality(4);
const VALID_VIDEO_CODEC_STRING_PREFIXES = [
    'avc1',
    'avc3',
    'hev1',
    'hvc1',
    'vp8',
    'vp09',
    'av01'
];
const AVC_CODEC_STRING_REGEX = /^(avc1|avc3)\.[0-9a-fA-F]{6}$/;
const HEVC_CODEC_STRING_REGEX = /^(hev1|hvc1)\.(?:[ABC]?\d+)\.[0-9a-fA-F]{1,8}\.[LH]\d+(?:\.[0-9a-fA-F]{1,2}){0,6}$/;
const VP9_CODEC_STRING_REGEX = /^vp09(?:\.\d{2}){3}(?:(?:\.\d{2}){5})?$/;
const AV1_CODEC_STRING_REGEX = /^av01\.\d\.\d{2}[MH]\.\d{2}(?:\.\d\.\d{3}\.\d{2}\.\d{2}\.\d{2}\.\d)?$/;
const validateVideoChunkMetadata = (metadata)=>{
    if (!metadata) {
        throw new TypeError('Video chunk metadata must be provided.');
    }
    if (typeof metadata !== 'object') {
        throw new TypeError('Video chunk metadata must be an object.');
    }
    if (!metadata.decoderConfig) {
        throw new TypeError('Video chunk metadata must include a decoder configuration.');
    }
    if (typeof metadata.decoderConfig !== 'object') {
        throw new TypeError('Video chunk metadata decoder configuration must be an object.');
    }
    if (typeof metadata.decoderConfig.codec !== 'string') {
        throw new TypeError('Video chunk metadata decoder configuration must specify a codec string.');
    }
    if (!VALID_VIDEO_CODEC_STRING_PREFIXES.some((prefix)=>metadata.decoderConfig.codec.startsWith(prefix))) {
        throw new TypeError('Video chunk metadata decoder configuration codec string must be a valid video codec string as specified in' + ' the WebCodecs Codec Registry.');
    }
    if (!Number.isInteger(metadata.decoderConfig.codedWidth) || metadata.decoderConfig.codedWidth <= 0) {
        throw new TypeError('Video chunk metadata decoder configuration must specify a valid codedWidth (positive integer).');
    }
    if (!Number.isInteger(metadata.decoderConfig.codedHeight) || metadata.decoderConfig.codedHeight <= 0) {
        throw new TypeError('Video chunk metadata decoder configuration must specify a valid codedHeight (positive integer).');
    }
    if (metadata.decoderConfig.description !== undefined) {
        if (!isAllowSharedBufferSource(metadata.decoderConfig.description)) {
            throw new TypeError('Video chunk metadata decoder configuration description, when defined, must be an ArrayBuffer or an' + ' ArrayBuffer view.');
        }
    }
    if (metadata.decoderConfig.colorSpace !== undefined) {
        const { colorSpace } = metadata.decoderConfig;
        if (typeof colorSpace !== 'object') {
            throw new TypeError('Video chunk metadata decoder configuration colorSpace, when provided, must be an object.');
        }
        const primariesValues = Object.keys(COLOR_PRIMARIES_MAP);
        if (colorSpace.primaries != null && !primariesValues.includes(colorSpace.primaries)) {
            throw new TypeError(`Video chunk metadata decoder configuration colorSpace primaries, when defined, must be one of` + ` ${primariesValues.join(', ')}.`);
        }
        const transferValues = Object.keys(TRANSFER_CHARACTERISTICS_MAP);
        if (colorSpace.transfer != null && !transferValues.includes(colorSpace.transfer)) {
            throw new TypeError(`Video chunk metadata decoder configuration colorSpace transfer, when defined, must be one of` + ` ${transferValues.join(', ')}.`);
        }
        const matrixValues = Object.keys(MATRIX_COEFFICIENTS_MAP);
        if (colorSpace.matrix != null && !matrixValues.includes(colorSpace.matrix)) {
            throw new TypeError(`Video chunk metadata decoder configuration colorSpace matrix, when defined, must be one of` + ` ${matrixValues.join(', ')}.`);
        }
        if (colorSpace.fullRange != null && typeof colorSpace.fullRange !== 'boolean') {
            throw new TypeError('Video chunk metadata decoder configuration colorSpace fullRange, when defined, must be a boolean.');
        }
    }
    if (metadata.decoderConfig.codec.startsWith('avc1') || metadata.decoderConfig.codec.startsWith('avc3')) {
        // AVC-specific validation
        if (!AVC_CODEC_STRING_REGEX.test(metadata.decoderConfig.codec)) {
            throw new TypeError('Video chunk metadata decoder configuration codec string for AVC must be a valid AVC codec string as' + ' specified in Section 3.4 of RFC 6381.');
        }
    // `description` may or may not be set, depending on if the format is AVCC or Annex B, so don't perform any
    // validation for it.
    // https://www.w3.org/TR/webcodecs-avc-codec-registration
    } else if (metadata.decoderConfig.codec.startsWith('hev1') || metadata.decoderConfig.codec.startsWith('hvc1')) {
        // HEVC-specific validation
        if (!HEVC_CODEC_STRING_REGEX.test(metadata.decoderConfig.codec)) {
            throw new TypeError('Video chunk metadata decoder configuration codec string for HEVC must be a valid HEVC codec string as' + ' specified in Section E.3 of ISO 14496-15.');
        }
    // `description` may or may not be set, depending on if the format is HEVC or Annex B, so don't perform any
    // validation for it.
    // https://www.w3.org/TR/webcodecs-hevc-codec-registration
    } else if (metadata.decoderConfig.codec.startsWith('vp8')) {
        // VP8-specific validation
        if (metadata.decoderConfig.codec !== 'vp8') {
            throw new TypeError('Video chunk metadata decoder configuration codec string for VP8 must be "vp8".');
        }
    } else if (metadata.decoderConfig.codec.startsWith('vp09')) {
        // VP9-specific validation
        if (!VP9_CODEC_STRING_REGEX.test(metadata.decoderConfig.codec)) {
            throw new TypeError('Video chunk metadata decoder configuration codec string for VP9 must be a valid VP9 codec string as' + ' specified in Section "Codecs Parameter String" of https://www.webmproject.org/vp9/mp4/.');
        }
    } else if (metadata.decoderConfig.codec.startsWith('av01')) {
        // AV1-specific validation
        if (!AV1_CODEC_STRING_REGEX.test(metadata.decoderConfig.codec)) {
            throw new TypeError('Video chunk metadata decoder configuration codec string for AV1 must be a valid AV1 codec string as' + ' specified in Section "Codecs Parameter String" of https://aomediacodec.github.io/av1-isobmff/.');
        }
    }
};
const VALID_AUDIO_CODEC_STRING_PREFIXES = [
    'mp4a',
    'mp3',
    'opus',
    'vorbis',
    'flac',
    'ulaw',
    'alaw',
    'pcm'
];
const validateAudioChunkMetadata = (metadata)=>{
    if (!metadata) {
        throw new TypeError('Audio chunk metadata must be provided.');
    }
    if (typeof metadata !== 'object') {
        throw new TypeError('Audio chunk metadata must be an object.');
    }
    if (!metadata.decoderConfig) {
        throw new TypeError('Audio chunk metadata must include a decoder configuration.');
    }
    if (typeof metadata.decoderConfig !== 'object') {
        throw new TypeError('Audio chunk metadata decoder configuration must be an object.');
    }
    if (typeof metadata.decoderConfig.codec !== 'string') {
        throw new TypeError('Audio chunk metadata decoder configuration must specify a codec string.');
    }
    if (!VALID_AUDIO_CODEC_STRING_PREFIXES.some((prefix)=>metadata.decoderConfig.codec.startsWith(prefix))) {
        throw new TypeError('Audio chunk metadata decoder configuration codec string must be a valid audio codec string as specified in' + ' the WebCodecs Codec Registry.');
    }
    if (!Number.isInteger(metadata.decoderConfig.sampleRate) || metadata.decoderConfig.sampleRate <= 0) {
        throw new TypeError('Audio chunk metadata decoder configuration must specify a valid sampleRate (positive integer).');
    }
    if (!Number.isInteger(metadata.decoderConfig.numberOfChannels) || metadata.decoderConfig.numberOfChannels <= 0) {
        throw new TypeError('Audio chunk metadata decoder configuration must specify a valid numberOfChannels (positive integer).');
    }
    if (metadata.decoderConfig.description !== undefined) {
        if (!isAllowSharedBufferSource(metadata.decoderConfig.description)) {
            throw new TypeError('Audio chunk metadata decoder configuration description, when defined, must be an ArrayBuffer or an' + ' ArrayBuffer view.');
        }
    }
    if (metadata.decoderConfig.codec.startsWith('mp4a') && metadata.decoderConfig.codec !== 'mp4a.69' && metadata.decoderConfig.codec !== 'mp4a.6B' && metadata.decoderConfig.codec !== 'mp4a.6b') {
        // AAC-specific validation
        const validStrings = [
            'mp4a.40.2',
            'mp4a.40.02',
            'mp4a.40.5',
            'mp4a.40.05',
            'mp4a.40.29',
            'mp4a.67'
        ];
        if (!validStrings.includes(metadata.decoderConfig.codec)) {
            throw new TypeError('Audio chunk metadata decoder configuration codec string for AAC must be a valid AAC codec string as' + ' specified in https://www.w3.org/TR/webcodecs-aac-codec-registration/.');
        }
        if (!metadata.decoderConfig.description) {
            throw new TypeError('Audio chunk metadata decoder configuration for AAC must include a description, which is expected to be' + ' an AudioSpecificConfig as specified in ISO 14496-3.');
        }
    } else if (metadata.decoderConfig.codec.startsWith('mp3') || metadata.decoderConfig.codec.startsWith('mp4a')) {
        // MP3-specific validation
        if (metadata.decoderConfig.codec !== 'mp3' && metadata.decoderConfig.codec !== 'mp4a.69' && metadata.decoderConfig.codec !== 'mp4a.6B' && metadata.decoderConfig.codec !== 'mp4a.6b') {
            throw new TypeError('Audio chunk metadata decoder configuration codec string for MP3 must be "mp3", "mp4a.69" or' + ' "mp4a.6B".');
        }
    } else if (metadata.decoderConfig.codec.startsWith('opus')) {
        // Opus-specific validation
        if (metadata.decoderConfig.codec !== 'opus') {
            throw new TypeError('Audio chunk metadata decoder configuration codec string for Opus must be "opus".');
        }
        if (metadata.decoderConfig.description && metadata.decoderConfig.description.byteLength < 18) {
            // Description is optional for Opus per-spec, so we shouldn't enforce it
            throw new TypeError('Audio chunk metadata decoder configuration description, when specified, is expected to be an' + ' Identification Header as specified in Section 5.1 of RFC 7845.');
        }
    } else if (metadata.decoderConfig.codec.startsWith('vorbis')) {
        // Vorbis-specific validation
        if (metadata.decoderConfig.codec !== 'vorbis') {
            throw new TypeError('Audio chunk metadata decoder configuration codec string for Vorbis must be "vorbis".');
        }
        if (!metadata.decoderConfig.description) {
            throw new TypeError('Audio chunk metadata decoder configuration for Vorbis must include a description, which is expected to' + ' adhere to the format described in https://www.w3.org/TR/webcodecs-vorbis-codec-registration/.');
        }
    } else if (metadata.decoderConfig.codec.startsWith('flac')) {
        // FLAC-specific validation
        if (metadata.decoderConfig.codec !== 'flac') {
            throw new TypeError('Audio chunk metadata decoder configuration codec string for FLAC must be "flac".');
        }
        const minDescriptionSize = 4 + 4 + 34; // 'fLaC' + metadata block header + STREAMINFO block
        if (!metadata.decoderConfig.description || metadata.decoderConfig.description.byteLength < minDescriptionSize) {
            throw new TypeError('Audio chunk metadata decoder configuration for FLAC must include a description, which is expected to' + ' adhere to the format described in https://www.w3.org/TR/webcodecs-flac-codec-registration/.');
        }
    } else if (metadata.decoderConfig.codec.startsWith('pcm') || metadata.decoderConfig.codec.startsWith('ulaw') || metadata.decoderConfig.codec.startsWith('alaw')) {
        // PCM-specific validation
        if (!PCM_AUDIO_CODECS.includes(metadata.decoderConfig.codec)) {
            throw new TypeError('Audio chunk metadata decoder configuration codec string for PCM must be one of the supported PCM' + ` codecs (${PCM_AUDIO_CODECS.join(', ')}).`);
        }
    }
};
const validateSubtitleMetadata = (metadata)=>{
    if (!metadata) {
        throw new TypeError('Subtitle metadata must be provided.');
    }
    if (typeof metadata !== 'object') {
        throw new TypeError('Subtitle metadata must be an object.');
    }
    if (!metadata.config) {
        throw new TypeError('Subtitle metadata must include a config object.');
    }
    if (typeof metadata.config !== 'object') {
        throw new TypeError('Subtitle metadata config must be an object.');
    }
    if (typeof metadata.config.description !== 'string') {
        throw new TypeError('Subtitle metadata config description must be a string.');
    }
};
/**
 * Checks if the browser is able to encode the given codec.
 * @public
 */ const canEncode = (codec)=>{
    if (VIDEO_CODECS.includes(codec)) {
        return canEncodeVideo(codec);
    } else if (AUDIO_CODECS.includes(codec)) {
        return canEncodeAudio(codec);
    } else if (SUBTITLE_CODECS.includes(codec)) {
        return canEncodeSubtitles(codec);
    }
    throw new TypeError(`Unknown codec '${codec}'.`);
};
/**
 * Checks if the browser is able to encode the given video codec with the given parameters.
 * @public
 */ const canEncodeVideo = async (codec, { width = 1280, height = 720, bitrate = 1e6 } = {})=>{
    if (!VIDEO_CODECS.includes(codec)) {
        return false;
    }
    if (!Number.isInteger(width) || width <= 0) {
        throw new TypeError('width must be a positive integer.');
    }
    if (!Number.isInteger(height) || height <= 0) {
        throw new TypeError('height must be a positive integer.');
    }
    if (!(bitrate instanceof Quality) && (!Number.isInteger(bitrate) || bitrate <= 0)) {
        throw new TypeError('bitrate must be a positive integer or a quality.');
    }
    const resolvedBitrate = bitrate instanceof Quality ? bitrate._toVideoBitrate(codec, width, height) : bitrate;
    if (customVideoEncoders.length > 0) {
        const encoderConfig = {
            codec: buildVideoCodecString(codec, width, height, resolvedBitrate),
            width,
            height,
            bitrate: resolvedBitrate,
            ...getVideoEncoderConfigExtension(codec)
        };
        if (customVideoEncoders.some((x)=>x.supports(codec, encoderConfig))) {
            // There's a custom encoder
            return true;
        }
    }
    if (typeof VideoEncoder === 'undefined') {
        return false;
    }
    const support = await VideoEncoder.isConfigSupported({
        codec: buildVideoCodecString(codec, width, height, resolvedBitrate),
        width,
        height,
        bitrate: resolvedBitrate,
        ...getVideoEncoderConfigExtension(codec)
    });
    return support.supported === true;
};
/**
 * Checks if the browser is able to encode the given audio codec with the given parameters.
 * @public
 */ const canEncodeAudio = async (codec, { numberOfChannels = 2, sampleRate = 48000, bitrate = 128e3 } = {})=>{
    if (!AUDIO_CODECS.includes(codec)) {
        return false;
    }
    if (!Number.isInteger(numberOfChannels) || numberOfChannels <= 0) {
        throw new TypeError('numberOfChannels must be a positive integer.');
    }
    if (!Number.isInteger(sampleRate) || sampleRate <= 0) {
        throw new TypeError('sampleRate must be a positive integer.');
    }
    if (!(bitrate instanceof Quality) && (!Number.isInteger(bitrate) || bitrate <= 0)) {
        throw new TypeError('bitrate must be a positive integer.');
    }
    const resolvedBitrate = bitrate instanceof Quality ? bitrate._toAudioBitrate(codec) : bitrate;
    if (customAudioEncoders.length > 0) {
        const encoderConfig = {
            codec: buildAudioCodecString(codec, numberOfChannels, sampleRate),
            numberOfChannels,
            sampleRate,
            bitrate: resolvedBitrate,
            ...getAudioEncoderConfigExtension(codec)
        };
        if (customAudioEncoders.some((x)=>x.supports(codec, encoderConfig))) {
            // There's a custom encoder
            return true;
        }
    }
    if (PCM_AUDIO_CODECS.includes(codec)) {
        return true; // Because we encode these ourselves
    }
    if (typeof AudioEncoder === 'undefined') {
        return false;
    }
    const support = await AudioEncoder.isConfigSupported({
        codec: buildAudioCodecString(codec, numberOfChannels, sampleRate),
        numberOfChannels,
        sampleRate,
        bitrate: resolvedBitrate,
        ...getAudioEncoderConfigExtension(codec)
    });
    return support.supported === true;
};
/**
 * Checks if the browser is able to encode the given subtitle codec.
 * @public
 */ const canEncodeSubtitles = async (codec)=>{
    if (!SUBTITLE_CODECS.includes(codec)) {
        return false;
    }
    return true;
};
/**
 * Returns the list of all media codecs that can be encoded by the browser.
 * @public
 */ const getEncodableCodecs = async ()=>{
    const [videoCodecs, audioCodecs, subtitleCodecs] = await Promise.all([
        getEncodableVideoCodecs(),
        getEncodableAudioCodecs(),
        getEncodableSubtitleCodecs()
    ]);
    return [
        ...videoCodecs,
        ...audioCodecs,
        ...subtitleCodecs
    ];
};
/**
 * Returns the list of all video codecs that can be encoded by the browser.
 * @public
 */ const getEncodableVideoCodecs = async (checkedCodecs = VIDEO_CODECS, options)=>{
    const bools = await Promise.all(checkedCodecs.map((codec)=>canEncodeVideo(codec, options)));
    return checkedCodecs.filter((_, i)=>bools[i]);
};
/**
 * Returns the list of all audio codecs that can be encoded by the browser.
 * @public
 */ const getEncodableAudioCodecs = async (checkedCodecs = AUDIO_CODECS, options)=>{
    const bools = await Promise.all(checkedCodecs.map((codec)=>canEncodeAudio(codec, options)));
    return checkedCodecs.filter((_, i)=>bools[i]);
};
/**
 * Returns the list of all subtitle codecs that can be encoded by the browser.
 * @public
 */ const getEncodableSubtitleCodecs = async (checkedCodecs = SUBTITLE_CODECS)=>{
    const bools = await Promise.all(checkedCodecs.map(canEncodeSubtitles));
    return checkedCodecs.filter((_, i)=>bools[i]);
};
/**
 * Returns the first video codec from the given list that can be encoded by the browser.
 * @public
 */ const getFirstEncodableVideoCodec = async (checkedCodecs, options)=>{
    for (const codec of checkedCodecs){
        if (await canEncodeVideo(codec, options)) {
            return codec;
        }
    }
    return null;
};
/**
 * Returns the first audio codec from the given list that can be encoded by the browser.
 * @public
 */ const getFirstEncodableAudioCodec = async (checkedCodecs, options)=>{
    for (const codec of checkedCodecs){
        if (await canEncodeAudio(codec, options)) {
            return codec;
        }
    }
    return null;
};
/**
 * Returns the first subtitle codec from the given list that can be encoded by the browser.
 * @public
 */ const getFirstEncodableSubtitleCodec = async (checkedCodecs)=>{
    for (const codec of checkedCodecs){
        if (await canEncodeSubtitles(codec)) {
            return codec;
        }
    }
    return null;
};

/*!
 * Copyright (c) 2025-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */ const cueBlockHeaderRegex = /(?:(.+?)\n)?((?:\d{2}:)?\d{2}:\d{2}.\d{3})\s+-->\s+((?:\d{2}:)?\d{2}:\d{2}.\d{3})/g;
const preambleStartRegex = /^WEBVTT(.|\n)*?\n{2}/;
const inlineTimestampRegex = /<(?:(\d{2}):)?(\d{2}):(\d{2}).(\d{3})>/g;
class SubtitleParser {
    constructor(options){
        this.preambleText = null;
        this.preambleEmitted = false;
        this.options = options;
    }
    parse(text) {
        text = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
        cueBlockHeaderRegex.lastIndex = 0;
        let match;
        if (!this.preambleText) {
            if (!preambleStartRegex.test(text)) {
                throw new Error('WebVTT preamble incorrect.');
            }
            match = cueBlockHeaderRegex.exec(text);
            const preamble = text.slice(0, match?.index ?? text.length).trimEnd();
            if (!preamble) {
                throw new Error('No WebVTT preamble provided.');
            }
            this.preambleText = preamble;
            if (match) {
                text = text.slice(match.index);
                cueBlockHeaderRegex.lastIndex = 0;
            }
        }
        while(match = cueBlockHeaderRegex.exec(text)){
            const notes = text.slice(0, match.index);
            const cueIdentifier = match[1];
            const matchEnd = match.index + match[0].length;
            const bodyStart = text.indexOf('\n', matchEnd) + 1;
            const cueSettings = text.slice(matchEnd, bodyStart).trim();
            let bodyEnd = text.indexOf('\n\n', matchEnd);
            if (bodyEnd === -1) bodyEnd = text.length;
            const startTime = parseSubtitleTimestamp(match[2]);
            const endTime = parseSubtitleTimestamp(match[3]);
            const duration = endTime - startTime;
            const body = text.slice(bodyStart, bodyEnd).trim();
            text = text.slice(bodyEnd).trimStart();
            cueBlockHeaderRegex.lastIndex = 0;
            const cue = {
                timestamp: startTime / 1000,
                duration: duration / 1000,
                text: body,
                identifier: cueIdentifier,
                settings: cueSettings,
                notes
            };
            const meta = {};
            if (!this.preambleEmitted) {
                meta.config = {
                    description: this.preambleText
                };
                this.preambleEmitted = true;
            }
            this.options.output(cue, meta);
        }
    }
}
const timestampRegex = /(?:(\d{2}):)?(\d{2}):(\d{2}).(\d{3})/;
const parseSubtitleTimestamp = (string)=>{
    const match = timestampRegex.exec(string);
    if (!match) throw new Error('Expected match.');
    return 60 * 60 * 1000 * Number(match[1] || '0') + 60 * 1000 * Number(match[2]) + 1000 * Number(match[3]) + Number(match[4]);
};
const formatSubtitleTimestamp = (timestamp)=>{
    const hours = Math.floor(timestamp / (60 * 60 * 1000));
    const minutes = Math.floor(timestamp % (60 * 60 * 1000) / (60 * 1000));
    const seconds = Math.floor(timestamp % (60 * 1000) / 1000);
    const milliseconds = timestamp % 1000;
    return hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0') + '.' + milliseconds.toString().padStart(3, '0');
};

// References for AVC/HEVC code:
// ISO 14496-15
// Rec. ITU-T H.264
// Rec. ITU-T H.265
// https://stackoverflow.com/questions/24884827
/** Finds all NAL units in an AVC packet in Annex B format. */ const findNalUnitsInAnnexB = (packetData)=>{
    const nalUnits = [];
    let i = 0;
    while(i < packetData.length){
        let startCodePos = -1;
        let startCodeLength = 0;
        for(let j = i; j < packetData.length - 3; j++){
            // Check for 3-byte start code (0x000001)
            if (packetData[j] === 0 && packetData[j + 1] === 0 && packetData[j + 2] === 1) {
                startCodePos = j;
                startCodeLength = 3;
                break;
            }
            // Check for 4-byte start code (0x00000001)
            if (j < packetData.length - 4 && packetData[j] === 0 && packetData[j + 1] === 0 && packetData[j + 2] === 0 && packetData[j + 3] === 1) {
                startCodePos = j;
                startCodeLength = 4;
                break;
            }
        }
        if (startCodePos === -1) {
            break; // No more start codes found
        }
        // If this isn't the first start code, extract the previous NAL unit
        if (i > 0 && startCodePos > i) {
            const nalData = packetData.subarray(i, startCodePos);
            if (nalData.length > 0) {
                nalUnits.push(nalData);
            }
        }
        i = startCodePos + startCodeLength;
    }
    // Extract the last NAL unit if there is one
    if (i < packetData.length) {
        const nalData = packetData.subarray(i);
        if (nalData.length > 0) {
            nalUnits.push(nalData);
        }
    }
    return nalUnits;
};
/** Finds all NAL units in an AVC packet in length-prefixed format. */ const findNalUnitsInLengthPrefixed = (packetData, lengthSize)=>{
    const nalUnits = [];
    let offset = 0;
    const dataView = new DataView(packetData.buffer, packetData.byteOffset, packetData.byteLength);
    while(offset + lengthSize <= packetData.length){
        let nalUnitLength;
        if (lengthSize === 1) {
            nalUnitLength = dataView.getUint8(offset);
        } else if (lengthSize === 2) {
            nalUnitLength = dataView.getUint16(offset, false);
        } else if (lengthSize === 3) {
            nalUnitLength = (dataView.getUint16(offset, false) << 8) + dataView.getUint8(offset + 2);
        } else if (lengthSize === 4) {
            nalUnitLength = dataView.getUint32(offset, false);
        } else {
            assertNever(lengthSize);
            assert(false);
        }
        offset += lengthSize;
        const nalUnit = packetData.subarray(offset, offset + nalUnitLength);
        nalUnits.push(nalUnit);
        offset += nalUnitLength;
    }
    return nalUnits;
};
const removeEmulationPreventionBytes = (data)=>{
    const result = [];
    const len = data.length;
    for(let i = 0; i < len; i++){
        // Look for the 0x000003 pattern
        if (i + 2 < len && data[i] === 0x00 && data[i + 1] === 0x00 && data[i + 2] === 0x03) {
            result.push(0x00, 0x00); // Push the first two bytes
            i += 2; // Skip the 0x03 byte
        } else {
            result.push(data[i]);
        }
    }
    return new Uint8Array(result);
};
/** Converts an AVC packet in Annex B format to length-prefixed format. */ const transformAnnexBToLengthPrefixed = (packetData)=>{
    const NAL_UNIT_LENGTH_SIZE = 4;
    const nalUnits = findNalUnitsInAnnexB(packetData);
    if (nalUnits.length === 0) {
        // If no NAL units were found, it's not valid Annex B data
        return null;
    }
    let totalSize = 0;
    for (const nalUnit of nalUnits){
        totalSize += NAL_UNIT_LENGTH_SIZE + nalUnit.byteLength;
    }
    const avccData = new Uint8Array(totalSize);
    const dataView = new DataView(avccData.buffer);
    let offset = 0;
    // Write each NAL unit with its length prefix
    for (const nalUnit of nalUnits){
        const length = nalUnit.byteLength;
        dataView.setUint32(offset, length, false);
        offset += 4;
        avccData.set(nalUnit, offset);
        offset += nalUnit.byteLength;
    }
    return avccData;
};
const extractNalUnitTypeForAvc = (data)=>{
    return data[0] & 0x1F;
};
/** Builds an AvcDecoderConfigurationRecord from an AVC packet in Annex B format. */ const extractAvcDecoderConfigurationRecord = (packetData)=>{
    try {
        const nalUnits = findNalUnitsInAnnexB(packetData);
        const spsUnits = nalUnits.filter((unit)=>extractNalUnitTypeForAvc(unit) === 7);
        const ppsUnits = nalUnits.filter((unit)=>extractNalUnitTypeForAvc(unit) === 8);
        const spsExtUnits = nalUnits.filter((unit)=>extractNalUnitTypeForAvc(unit) === 13);
        if (spsUnits.length === 0) {
            return null;
        }
        if (ppsUnits.length === 0) {
            return null;
        }
        // Let's get the first SPS for profile and level information
        const spsData = spsUnits[0];
        const bitstream = new Bitstream(removeEmulationPreventionBytes(spsData));
        bitstream.skipBits(1); // forbidden_zero_bit
        bitstream.skipBits(2); // nal_ref_idc
        const nal_unit_type = bitstream.readBits(5);
        if (nal_unit_type !== 7) {
            console.error('Invalid SPS NAL unit type');
            return null;
        }
        const profile_idc = bitstream.readAlignedByte();
        const constraint_flags = bitstream.readAlignedByte();
        const level_idc = bitstream.readAlignedByte();
        const record = {
            configurationVersion: 1,
            avcProfileIndication: profile_idc,
            profileCompatibility: constraint_flags,
            avcLevelIndication: level_idc,
            lengthSizeMinusOne: 3,
            sequenceParameterSets: spsUnits,
            pictureParameterSets: ppsUnits,
            chromaFormat: null,
            bitDepthLumaMinus8: null,
            bitDepthChromaMinus8: null,
            sequenceParameterSetExt: null
        };
        if (profile_idc === 100 || profile_idc === 110 || profile_idc === 122 || profile_idc === 144) {
            readExpGolomb(bitstream); // seq_parameter_set_id
            const chroma_format_idc = readExpGolomb(bitstream);
            if (chroma_format_idc === 3) {
                bitstream.skipBits(1); // separate_colour_plane_flag
            }
            const bit_depth_luma_minus8 = readExpGolomb(bitstream);
            const bit_depth_chroma_minus8 = readExpGolomb(bitstream);
            record.chromaFormat = chroma_format_idc;
            record.bitDepthLumaMinus8 = bit_depth_luma_minus8;
            record.bitDepthChromaMinus8 = bit_depth_chroma_minus8;
            record.sequenceParameterSetExt = spsExtUnits;
        }
        return record;
    } catch (error) {
        console.error('Error building AVC Decoder Configuration Record:', error);
        return null;
    }
};
/** Serializes an AvcDecoderConfigurationRecord into the format specified in Section 5.3.3.1 of ISO 14496-15. */ const serializeAvcDecoderConfigurationRecord = (record)=>{
    const bytes = [];
    // Write header
    bytes.push(record.configurationVersion);
    bytes.push(record.avcProfileIndication);
    bytes.push(record.profileCompatibility);
    bytes.push(record.avcLevelIndication);
    bytes.push(0xFC | record.lengthSizeMinusOne & 0x03); // Reserved bits (6) + lengthSizeMinusOne (2)
    // Reserved bits (3) + numOfSequenceParameterSets (5)
    bytes.push(0xE0 | record.sequenceParameterSets.length & 0x1F);
    // Write SPS
    for (const sps of record.sequenceParameterSets){
        const length = sps.byteLength;
        bytes.push(length >> 8); // High byte
        bytes.push(length & 0xFF); // Low byte
        for(let i = 0; i < length; i++){
            bytes.push(sps[i]);
        }
    }
    bytes.push(record.pictureParameterSets.length);
    // Write PPS
    for (const pps of record.pictureParameterSets){
        const length = pps.byteLength;
        bytes.push(length >> 8); // High byte
        bytes.push(length & 0xFF); // Low byte
        for(let i = 0; i < length; i++){
            bytes.push(pps[i]);
        }
    }
    if (record.avcProfileIndication === 100 || record.avcProfileIndication === 110 || record.avcProfileIndication === 122 || record.avcProfileIndication === 144) {
        assert(record.chromaFormat !== null);
        assert(record.bitDepthLumaMinus8 !== null);
        assert(record.bitDepthChromaMinus8 !== null);
        assert(record.sequenceParameterSetExt !== null);
        bytes.push(0xFC | record.chromaFormat & 0x03); // Reserved bits + chroma_format
        bytes.push(0xF8 | record.bitDepthLumaMinus8 & 0x07); // Reserved bits + bit_depth_luma_minus8
        bytes.push(0xF8 | record.bitDepthChromaMinus8 & 0x07); // Reserved bits + bit_depth_chroma_minus8
        bytes.push(record.sequenceParameterSetExt.length);
        // Write SPS Ext
        for (const spsExt of record.sequenceParameterSetExt){
            const length = spsExt.byteLength;
            bytes.push(length >> 8); // High byte
            bytes.push(length & 0xFF); // Low byte
            for(let i = 0; i < length; i++){
                bytes.push(spsExt[i]);
            }
        }
    }
    return new Uint8Array(bytes);
};
const NALU_TYPE_VPS = 32;
const NALU_TYPE_SPS = 33;
const NALU_TYPE_PPS = 34;
const NALU_TYPE_SEI_PREFIX = 39;
const NALU_TYPE_SEI_SUFFIX = 40;
const extractNalUnitTypeForHevc = (data)=>{
    return data[0] >> 1 & 0x3F;
};
/** Builds a HevcDecoderConfigurationRecord from an HEVC packet in Annex B format. */ const extractHevcDecoderConfigurationRecord = (packetData)=>{
    try {
        const nalUnits = findNalUnitsInAnnexB(packetData);
        const vpsUnits = nalUnits.filter((unit)=>extractNalUnitTypeForHevc(unit) === NALU_TYPE_VPS);
        const spsUnits = nalUnits.filter((unit)=>extractNalUnitTypeForHevc(unit) === NALU_TYPE_SPS);
        const ppsUnits = nalUnits.filter((unit)=>extractNalUnitTypeForHevc(unit) === NALU_TYPE_PPS);
        const seiUnits = nalUnits.filter((unit)=>extractNalUnitTypeForHevc(unit) === NALU_TYPE_SEI_PREFIX || extractNalUnitTypeForHevc(unit) === NALU_TYPE_SEI_SUFFIX);
        if (spsUnits.length === 0 || ppsUnits.length === 0) return null;
        const sps = spsUnits[0];
        const bitstream = new Bitstream(removeEmulationPreventionBytes(sps));
        bitstream.skipBits(16); // NAL header
        bitstream.readBits(4); // sps_video_parameter_set_id
        const sps_max_sub_layers_minus1 = bitstream.readBits(3);
        const sps_temporal_id_nesting_flag = bitstream.readBits(1);
        const { general_profile_space, general_tier_flag, general_profile_idc, general_profile_compatibility_flags, general_constraint_indicator_flags, general_level_idc } = parseProfileTierLevel(bitstream, sps_max_sub_layers_minus1);
        readExpGolomb(bitstream); // sps_seq_parameter_set_id
        const chroma_format_idc = readExpGolomb(bitstream);
        if (chroma_format_idc === 3) bitstream.skipBits(1); // separate_colour_plane_flag
        readExpGolomb(bitstream); // pic_width_in_luma_samples
        readExpGolomb(bitstream); // pic_height_in_luma_samples
        if (bitstream.readBits(1)) {
            readExpGolomb(bitstream); // conf_win_left_offset
            readExpGolomb(bitstream); // conf_win_right_offset
            readExpGolomb(bitstream); // conf_win_top_offset
            readExpGolomb(bitstream); // conf_win_bottom_offset
        }
        const bit_depth_luma_minus8 = readExpGolomb(bitstream);
        const bit_depth_chroma_minus8 = readExpGolomb(bitstream);
        readExpGolomb(bitstream); // log2_max_pic_order_cnt_lsb_minus4
        const sps_sub_layer_ordering_info_present_flag = bitstream.readBits(1);
        const maxNum = sps_sub_layer_ordering_info_present_flag ? 0 : sps_max_sub_layers_minus1;
        for(let i = maxNum; i <= sps_max_sub_layers_minus1; i++){
            readExpGolomb(bitstream); // sps_max_dec_pic_buffering_minus1[i]
            readExpGolomb(bitstream); // sps_max_num_reorder_pics[i]
            readExpGolomb(bitstream); // sps_max_latency_increase_plus1[i]
        }
        readExpGolomb(bitstream); // log2_min_luma_coding_block_size_minus3
        readExpGolomb(bitstream); // log2_diff_max_min_luma_coding_block_size
        readExpGolomb(bitstream); // log2_min_luma_transform_block_size_minus2
        readExpGolomb(bitstream); // log2_diff_max_min_luma_transform_block_size
        readExpGolomb(bitstream); // max_transform_hierarchy_depth_inter
        readExpGolomb(bitstream); // max_transform_hierarchy_depth_intra
        if (bitstream.readBits(1)) {
            if (bitstream.readBits(1)) {
                skipScalingListData(bitstream);
            }
        }
        bitstream.skipBits(1); // amp_enabled_flag
        bitstream.skipBits(1); // sample_adaptive_offset_enabled_flag
        if (bitstream.readBits(1)) {
            bitstream.skipBits(4); // pcm_sample_bit_depth_luma_minus1
            bitstream.skipBits(4); // pcm_sample_bit_depth_chroma_minus1
            readExpGolomb(bitstream); // log2_min_pcm_luma_coding_block_size_minus3
            readExpGolomb(bitstream); // log2_diff_max_min_pcm_luma_coding_block_size
            bitstream.skipBits(1); // pcm_loop_filter_disabled_flag
        }
        const num_short_term_ref_pic_sets = readExpGolomb(bitstream);
        skipAllStRefPicSets(bitstream, num_short_term_ref_pic_sets);
        if (bitstream.readBits(1)) {
            const num_long_term_ref_pics_sps = readExpGolomb(bitstream);
            for(let i = 0; i < num_long_term_ref_pics_sps; i++){
                readExpGolomb(bitstream); // lt_ref_pic_poc_lsb_sps[i]
                bitstream.skipBits(1); // used_by_curr_pic_lt_sps_flag[i]
            }
        }
        bitstream.skipBits(1); // sps_temporal_mvp_enabled_flag
        bitstream.skipBits(1); // strong_intra_smoothing_enabled_flag
        let min_spatial_segmentation_idc = 0;
        if (bitstream.readBits(1)) {
            min_spatial_segmentation_idc = parseVuiForMinSpatialSegmentationIdc(bitstream, sps_max_sub_layers_minus1);
        }
        // Parse PPS for parallelismType
        let parallelismType = 0;
        if (ppsUnits.length > 0) {
            const pps = ppsUnits[0];
            const ppsBitstream = new Bitstream(removeEmulationPreventionBytes(pps));
            ppsBitstream.skipBits(16); // NAL header
            readExpGolomb(ppsBitstream); // pps_pic_parameter_set_id
            readExpGolomb(ppsBitstream); // pps_seq_parameter_set_id
            ppsBitstream.skipBits(1); // dependent_slice_segments_enabled_flag
            ppsBitstream.skipBits(1); // output_flag_present_flag
            ppsBitstream.skipBits(3); // num_extra_slice_header_bits
            ppsBitstream.skipBits(1); // sign_data_hiding_enabled_flag
            ppsBitstream.skipBits(1); // cabac_init_present_flag
            readExpGolomb(ppsBitstream); // num_ref_idx_l0_default_active_minus1
            readExpGolomb(ppsBitstream); // num_ref_idx_l1_default_active_minus1
            readSignedExpGolomb(ppsBitstream); // init_qp_minus26
            ppsBitstream.skipBits(1); // constrained_intra_pred_flag
            ppsBitstream.skipBits(1); // transform_skip_enabled_flag
            if (ppsBitstream.readBits(1)) {
                readExpGolomb(ppsBitstream); // diff_cu_qp_delta_depth
            }
            readSignedExpGolomb(ppsBitstream); // pps_cb_qp_offset
            readSignedExpGolomb(ppsBitstream); // pps_cr_qp_offset
            ppsBitstream.skipBits(1); // pps_slice_chroma_qp_offsets_present_flag
            ppsBitstream.skipBits(1); // weighted_pred_flag
            ppsBitstream.skipBits(1); // weighted_bipred_flag
            ppsBitstream.skipBits(1); // transquant_bypass_enabled_flag
            const tiles_enabled_flag = ppsBitstream.readBits(1);
            const entropy_coding_sync_enabled_flag = ppsBitstream.readBits(1);
            if (!tiles_enabled_flag && !entropy_coding_sync_enabled_flag) parallelismType = 0;
            else if (tiles_enabled_flag && !entropy_coding_sync_enabled_flag) parallelismType = 2;
            else if (!tiles_enabled_flag && entropy_coding_sync_enabled_flag) parallelismType = 3;
            else parallelismType = 0;
        }
        const arrays = [
            ...vpsUnits.length ? [
                {
                    arrayCompleteness: 1,
                    nalUnitType: NALU_TYPE_VPS,
                    nalUnits: vpsUnits
                }
            ] : [],
            ...spsUnits.length ? [
                {
                    arrayCompleteness: 1,
                    nalUnitType: NALU_TYPE_SPS,
                    nalUnits: spsUnits
                }
            ] : [],
            ...ppsUnits.length ? [
                {
                    arrayCompleteness: 1,
                    nalUnitType: NALU_TYPE_PPS,
                    nalUnits: ppsUnits
                }
            ] : [],
            ...seiUnits.length ? [
                {
                    arrayCompleteness: 1,
                    nalUnitType: extractNalUnitTypeForHevc(seiUnits[0]),
                    nalUnits: seiUnits
                }
            ] : []
        ];
        const record = {
            configurationVersion: 1,
            generalProfileSpace: general_profile_space,
            generalTierFlag: general_tier_flag,
            generalProfileIdc: general_profile_idc,
            generalProfileCompatibilityFlags: general_profile_compatibility_flags,
            generalConstraintIndicatorFlags: general_constraint_indicator_flags,
            generalLevelIdc: general_level_idc,
            minSpatialSegmentationIdc: min_spatial_segmentation_idc,
            parallelismType,
            chromaFormatIdc: chroma_format_idc,
            bitDepthLumaMinus8: bit_depth_luma_minus8,
            bitDepthChromaMinus8: bit_depth_chroma_minus8,
            avgFrameRate: 0,
            constantFrameRate: 0,
            numTemporalLayers: sps_max_sub_layers_minus1 + 1,
            temporalIdNested: sps_temporal_id_nesting_flag,
            lengthSizeMinusOne: 3,
            arrays
        };
        return record;
    } catch (error) {
        console.error('Error building HEVC Decoder Configuration Record:', error);
        return null;
    }
};
const parseProfileTierLevel = (bitstream, maxNumSubLayersMinus1)=>{
    const general_profile_space = bitstream.readBits(2);
    const general_tier_flag = bitstream.readBits(1);
    const general_profile_idc = bitstream.readBits(5);
    let general_profile_compatibility_flags = 0;
    for(let i = 0; i < 32; i++){
        general_profile_compatibility_flags = general_profile_compatibility_flags << 1 | bitstream.readBits(1);
    }
    const general_constraint_indicator_flags = new Uint8Array(6);
    for(let i = 0; i < 6; i++){
        general_constraint_indicator_flags[i] = bitstream.readBits(8);
    }
    const general_level_idc = bitstream.readBits(8);
    const sub_layer_profile_present_flag = [];
    const sub_layer_level_present_flag = [];
    for(let i = 0; i < maxNumSubLayersMinus1; i++){
        sub_layer_profile_present_flag.push(bitstream.readBits(1));
        sub_layer_level_present_flag.push(bitstream.readBits(1));
    }
    if (maxNumSubLayersMinus1 > 0) {
        for(let i = maxNumSubLayersMinus1; i < 8; i++){
            bitstream.skipBits(2); // reserved_zero_2bits
        }
    }
    for(let i = 0; i < maxNumSubLayersMinus1; i++){
        if (sub_layer_profile_present_flag[i]) bitstream.skipBits(88);
        if (sub_layer_level_present_flag[i]) bitstream.skipBits(8);
    }
    return {
        general_profile_space,
        general_tier_flag,
        general_profile_idc,
        general_profile_compatibility_flags,
        general_constraint_indicator_flags,
        general_level_idc
    };
};
const skipScalingListData = (bitstream)=>{
    for(let sizeId = 0; sizeId < 4; sizeId++){
        for(let matrixId = 0; matrixId < (sizeId === 3 ? 2 : 6); matrixId++){
            const scaling_list_pred_mode_flag = bitstream.readBits(1);
            if (!scaling_list_pred_mode_flag) {
                readExpGolomb(bitstream); // scaling_list_pred_matrix_id_delta
            } else {
                const coefNum = Math.min(64, 1 << 4 + (sizeId << 1));
                if (sizeId > 1) {
                    readSignedExpGolomb(bitstream); // scaling_list_dc_coef_minus8
                }
                for(let i = 0; i < coefNum; i++){
                    readSignedExpGolomb(bitstream); // scaling_list_delta_coef
                }
            }
        }
    }
};
const skipAllStRefPicSets = (bitstream, num_short_term_ref_pic_sets)=>{
    const NumDeltaPocs = [];
    for(let stRpsIdx = 0; stRpsIdx < num_short_term_ref_pic_sets; stRpsIdx++){
        NumDeltaPocs[stRpsIdx] = skipStRefPicSet(bitstream, stRpsIdx, num_short_term_ref_pic_sets, NumDeltaPocs);
    }
};
const skipStRefPicSet = (bitstream, stRpsIdx, num_short_term_ref_pic_sets, NumDeltaPocs)=>{
    let NumDeltaPocsThis = 0;
    let inter_ref_pic_set_prediction_flag = 0;
    let RefRpsIdx = 0;
    if (stRpsIdx !== 0) {
        inter_ref_pic_set_prediction_flag = bitstream.readBits(1);
    }
    if (inter_ref_pic_set_prediction_flag) {
        if (stRpsIdx === num_short_term_ref_pic_sets) {
            const delta_idx_minus1 = readExpGolomb(bitstream);
            RefRpsIdx = stRpsIdx - (delta_idx_minus1 + 1);
        } else {
            RefRpsIdx = stRpsIdx - 1;
        }
        bitstream.readBits(1); // delta_rps_sign
        readExpGolomb(bitstream); // abs_delta_rps_minus1
        // The number of iterations is NumDeltaPocs[RefRpsIdx] + 1
        const numDelta = NumDeltaPocs[RefRpsIdx] ?? 0;
        for(let j = 0; j <= numDelta; j++){
            const used_by_curr_pic_flag = bitstream.readBits(1);
            if (!used_by_curr_pic_flag) {
                bitstream.readBits(1); // use_delta_flag
            }
        }
        NumDeltaPocsThis = NumDeltaPocs[RefRpsIdx];
    } else {
        const num_negative_pics = readExpGolomb(bitstream);
        const num_positive_pics = readExpGolomb(bitstream);
        for(let i = 0; i < num_negative_pics; i++){
            readExpGolomb(bitstream); // delta_poc_s0_minus1[i]
            bitstream.readBits(1); // used_by_curr_pic_s0_flag[i]
        }
        for(let i = 0; i < num_positive_pics; i++){
            readExpGolomb(bitstream); // delta_poc_s1_minus1[i]
            bitstream.readBits(1); // used_by_curr_pic_s1_flag[i]
        }
        NumDeltaPocsThis = num_negative_pics + num_positive_pics;
    }
    return NumDeltaPocsThis;
};
const parseVuiForMinSpatialSegmentationIdc = (bitstream, sps_max_sub_layers_minus1)=>{
    if (bitstream.readBits(1)) {
        const aspect_ratio_idc = bitstream.readBits(8);
        if (aspect_ratio_idc === 255) {
            bitstream.readBits(16); // sar_width
            bitstream.readBits(16); // sar_height
        }
    }
    if (bitstream.readBits(1)) {
        bitstream.readBits(1); // overscan_appropriate_flag
    }
    if (bitstream.readBits(1)) {
        bitstream.readBits(3); // video_format
        bitstream.readBits(1); // video_full_range_flag
        if (bitstream.readBits(1)) {
            bitstream.readBits(8); // colour_primaries
            bitstream.readBits(8); // transfer_characteristics
            bitstream.readBits(8); // matrix_coeffs
        }
    }
    if (bitstream.readBits(1)) {
        readExpGolomb(bitstream); // chroma_sample_loc_type_top_field
        readExpGolomb(bitstream); // chroma_sample_loc_type_bottom_field
    }
    bitstream.readBits(1); // neutral_chroma_indication_flag
    bitstream.readBits(1); // field_seq_flag
    bitstream.readBits(1); // frame_field_info_present_flag
    if (bitstream.readBits(1)) {
        readExpGolomb(bitstream); // def_disp_win_left_offset
        readExpGolomb(bitstream); // def_disp_win_right_offset
        readExpGolomb(bitstream); // def_disp_win_top_offset
        readExpGolomb(bitstream); // def_disp_win_bottom_offset
    }
    if (bitstream.readBits(1)) {
        bitstream.readBits(32); // vui_num_units_in_tick
        bitstream.readBits(32); // vui_time_scale
        if (bitstream.readBits(1)) {
            readExpGolomb(bitstream); // vui_num_ticks_poc_diff_one_minus1
        }
        if (bitstream.readBits(1)) {
            skipHrdParameters(bitstream, true, sps_max_sub_layers_minus1);
        }
    }
    if (bitstream.readBits(1)) {
        bitstream.readBits(1); // tiles_fixed_structure_flag
        bitstream.readBits(1); // motion_vectors_over_pic_boundaries_flag
        bitstream.readBits(1); // restricted_ref_pic_lists_flag
        const min_spatial_segmentation_idc = readExpGolomb(bitstream);
        // skip the rest
        readExpGolomb(bitstream); // max_bytes_per_pic_denom
        readExpGolomb(bitstream); // max_bits_per_min_cu_denom
        readExpGolomb(bitstream); // log2_max_mv_length_horizontal
        readExpGolomb(bitstream); // log2_max_mv_length_vertical
        return min_spatial_segmentation_idc;
    }
    return 0;
};
const skipHrdParameters = (bitstream, commonInfPresentFlag, maxNumSubLayersMinus1)=>{
    let nal_hrd_parameters_present_flag = false;
    let vcl_hrd_parameters_present_flag = false;
    let sub_pic_hrd_params_present_flag = false;
    {
        nal_hrd_parameters_present_flag = bitstream.readBits(1) === 1;
        vcl_hrd_parameters_present_flag = bitstream.readBits(1) === 1;
        if (nal_hrd_parameters_present_flag || vcl_hrd_parameters_present_flag) {
            sub_pic_hrd_params_present_flag = bitstream.readBits(1) === 1;
            if (sub_pic_hrd_params_present_flag) {
                bitstream.readBits(8); // tick_divisor_minus2
                bitstream.readBits(5); // du_cpb_removal_delay_increment_length_minus1
                bitstream.readBits(1); // sub_pic_cpb_params_in_pic_timing_sei_flag
                bitstream.readBits(5); // dpb_output_delay_du_length_minus1
            }
            bitstream.readBits(4); // bit_rate_scale
            bitstream.readBits(4); // cpb_size_scale
            if (sub_pic_hrd_params_present_flag) {
                bitstream.readBits(4); // cpb_size_du_scale
            }
            bitstream.readBits(5); // initial_cpb_removal_delay_length_minus1
            bitstream.readBits(5); // au_cpb_removal_delay_length_minus1
            bitstream.readBits(5); // dpb_output_delay_length_minus1
        }
    }
    for(let i = 0; i <= maxNumSubLayersMinus1; i++){
        const fixed_pic_rate_general_flag = bitstream.readBits(1) === 1;
        let fixed_pic_rate_within_cvs_flag = true; // Default assumption if general is true
        if (!fixed_pic_rate_general_flag) {
            fixed_pic_rate_within_cvs_flag = bitstream.readBits(1) === 1;
        }
        let low_delay_hrd_flag = false; // Default assumption
        if (fixed_pic_rate_within_cvs_flag) {
            readExpGolomb(bitstream); // elemental_duration_in_tc_minus1[i]
        } else {
            low_delay_hrd_flag = bitstream.readBits(1) === 1;
        }
        let CpbCnt = 1; // Default if low_delay is true
        if (!low_delay_hrd_flag) {
            const cpb_cnt_minus1 = readExpGolomb(bitstream); // cpb_cnt_minus1[i]
            CpbCnt = cpb_cnt_minus1 + 1;
        }
        if (nal_hrd_parameters_present_flag) {
            skipSubLayerHrdParameters(bitstream, CpbCnt, sub_pic_hrd_params_present_flag);
        }
        if (vcl_hrd_parameters_present_flag) {
            skipSubLayerHrdParameters(bitstream, CpbCnt, sub_pic_hrd_params_present_flag);
        }
    }
};
const skipSubLayerHrdParameters = (bitstream, CpbCnt, sub_pic_hrd_params_present_flag)=>{
    for(let i = 0; i < CpbCnt; i++){
        readExpGolomb(bitstream); // bit_rate_value_minus1[i]
        readExpGolomb(bitstream); // cpb_size_value_minus1[i]
        if (sub_pic_hrd_params_present_flag) {
            readExpGolomb(bitstream); // cpb_size_du_value_minus1[i]
            readExpGolomb(bitstream); // bit_rate_du_value_minus1[i]
        }
        bitstream.readBits(1); // cbr_flag[i]
    }
};
/** Serializes an HevcDecoderConfigurationRecord into the format specified in Section 8.3.3.1 of ISO 14496-15. */ const serializeHevcDecoderConfigurationRecord = (record)=>{
    const bytes = [];
    bytes.push(record.configurationVersion);
    bytes.push((record.generalProfileSpace & 0x3) << 6 | (record.generalTierFlag & 0x1) << 5 | record.generalProfileIdc & 0x1F);
    bytes.push(record.generalProfileCompatibilityFlags >>> 24 & 0xFF);
    bytes.push(record.generalProfileCompatibilityFlags >>> 16 & 0xFF);
    bytes.push(record.generalProfileCompatibilityFlags >>> 8 & 0xFF);
    bytes.push(record.generalProfileCompatibilityFlags & 0xFF);
    bytes.push(...record.generalConstraintIndicatorFlags);
    bytes.push(record.generalLevelIdc & 0xFF);
    bytes.push(0xF0 | record.minSpatialSegmentationIdc >> 8 & 0x0F); // Reserved + high nibble
    bytes.push(record.minSpatialSegmentationIdc & 0xFF); // Low byte
    bytes.push(0xFC | record.parallelismType & 0x03);
    bytes.push(0xFC | record.chromaFormatIdc & 0x03);
    bytes.push(0xF8 | record.bitDepthLumaMinus8 & 0x07);
    bytes.push(0xF8 | record.bitDepthChromaMinus8 & 0x07);
    bytes.push(record.avgFrameRate >> 8 & 0xFF); // High byte
    bytes.push(record.avgFrameRate & 0xFF); // Low byte
    bytes.push((record.constantFrameRate & 0x03) << 6 | (record.numTemporalLayers & 0x07) << 3 | (record.temporalIdNested & 0x01) << 2 | record.lengthSizeMinusOne & 0x03);
    bytes.push(record.arrays.length & 0xFF);
    for (const arr of record.arrays){
        bytes.push((arr.arrayCompleteness & 0x01) << 7 | 0 << 6 | arr.nalUnitType & 0x3F);
        bytes.push(arr.nalUnits.length >> 8 & 0xFF); // High byte
        bytes.push(arr.nalUnits.length & 0xFF); // Low byte
        for (const nal of arr.nalUnits){
            bytes.push(nal.length >> 8 & 0xFF); // High byte
            bytes.push(nal.length & 0xFF); // Low byte
            for(let i = 0; i < nal.length; i++){
                bytes.push(nal[i]);
            }
        }
    }
    return new Uint8Array(bytes);
};
const extractVp9CodecInfoFromPacket = (packet)=>{
    // eslint-disable-next-line @stylistic/max-len
    // https://storage.googleapis.com/downloads.webmproject.org/docs/vp9/vp9-bitstream-specification-v0.7-20170222-draft.pdf
    // http://downloads.webmproject.org/docs/vp9/vp9-bitstream_superframe-and-uncompressed-header_v1.0.pdf
    const bitstream = new Bitstream(packet);
    // Frame marker (0b10)
    const frameMarker = bitstream.readBits(2);
    if (frameMarker !== 2) {
        return null;
    }
    // Profile
    const profileLowBit = bitstream.readBits(1);
    const profileHighBit = bitstream.readBits(1);
    const profile = (profileHighBit << 1) + profileLowBit;
    // Skip reserved bit for profile 3
    if (profile === 3) {
        bitstream.skipBits(1);
    }
    // show_existing_frame
    const showExistingFrame = bitstream.readBits(1);
    if (showExistingFrame === 1) {
        return null;
    }
    // frame_type (0 = key frame)
    const frameType = bitstream.readBits(1);
    if (frameType !== 0) {
        return null;
    }
    // Skip show_frame and error_resilient_mode
    bitstream.skipBits(2);
    // Sync code (0x498342)
    const syncCode = bitstream.readBits(24);
    if (syncCode !== 0x498342) {
        return null;
    }
    // Color config
    let bitDepth = 8;
    if (profile >= 2) {
        const tenOrTwelveBit = bitstream.readBits(1);
        bitDepth = tenOrTwelveBit ? 12 : 10;
    }
    // Color space
    const colorSpace = bitstream.readBits(3);
    let chromaSubsampling = 0;
    let videoFullRangeFlag = 0;
    if (colorSpace !== 7) {
        const colorRange = bitstream.readBits(1);
        videoFullRangeFlag = colorRange;
        if (profile === 1 || profile === 3) {
            const subsamplingX = bitstream.readBits(1);
            const subsamplingY = bitstream.readBits(1);
            // 0 = 4:2:0 vertical
            // 1 = 4:2:0 colocated
            // 2 = 4:2:2
            // 3 = 4:4:4
            chromaSubsampling = !subsamplingX && !subsamplingY ? 3 // 0,0 = 4:4:4
             : subsamplingX && !subsamplingY ? 2 // 1,0 = 4:2:2
             : 1; // 1,1 = 4:2:0 colocated (default)
            // Skip reserved bit
            bitstream.skipBits(1);
        } else {
            // For profile 0 and 2, always 4:2:0
            chromaSubsampling = 1; // Using colocated as default
        }
    } else {
        // RGB is always 4:4:4
        chromaSubsampling = 3;
        videoFullRangeFlag = 1;
    }
    // Parse frame size
    const widthMinusOne = bitstream.readBits(16);
    const heightMinusOne = bitstream.readBits(16);
    const width = widthMinusOne + 1;
    const height = heightMinusOne + 1;
    // Calculate level based on dimensions
    const pictureSize = width * height;
    let level = last(VP9_LEVEL_TABLE).level; // Default to highest level
    for (const entry of VP9_LEVEL_TABLE){
        if (pictureSize <= entry.maxPictureSize) {
            level = entry.level;
            break;
        }
    }
    // Map color_space to standard values
    const matrixCoefficients = colorSpace === 7 ? 0 : colorSpace === 2 ? 1 : colorSpace === 1 ? 6 : 2;
    const colourPrimaries = colorSpace === 2 ? 1 : colorSpace === 1 ? 6 : 2;
    const transferCharacteristics = colorSpace === 2 ? 1 : colorSpace === 1 ? 6 : 2;
    return {
        profile,
        level,
        bitDepth,
        chromaSubsampling,
        videoFullRangeFlag,
        colourPrimaries,
        transferCharacteristics,
        matrixCoefficients
    };
};
/** Iterates over all OBUs in an AV1 packet bistream. */ function* iterateAv1PacketObus(packet) {
    // https://aomediacodec.github.io/av1-spec/av1-spec.pdf
    const bitstream = new Bitstream(packet);
    const readLeb128 = ()=>{
        let value = 0;
        for(let i = 0; i < 8; i++){
            const byte = bitstream.readAlignedByte();
            value |= (byte & 0x7f) << i * 7;
            if (!(byte & 0x80)) {
                break;
            }
            // Spec requirement
            if (i === 7 && byte & 0x80) {
                return null;
            }
        }
        // Spec requirement
        if (value >= 2 ** 32 - 1) {
            return null;
        }
        return value;
    };
    while(bitstream.getBitsLeft() >= 8){
        // Parse OBU header
        bitstream.skipBits(1);
        const obuType = bitstream.readBits(4);
        const obuExtension = bitstream.readBits(1);
        const obuHasSizeField = bitstream.readBits(1);
        bitstream.skipBits(1);
        // Skip extension header if present
        if (obuExtension) {
            bitstream.skipBits(8);
        }
        // Read OBU size if present
        let obuSize;
        if (obuHasSizeField) {
            const obuSizeValue = readLeb128();
            if (obuSizeValue === null) return; // It was invalid
            obuSize = obuSizeValue;
        } else {
            // Calculate remaining bits and convert to bytes, rounding down
            obuSize = Math.floor(bitstream.getBitsLeft() / 8);
        }
        assert(bitstream.pos % 8 === 0);
        yield {
            type: obuType,
            data: packet.subarray(bitstream.pos / 8, bitstream.pos / 8 + obuSize)
        };
        // Move to next OBU
        bitstream.skipBits(obuSize * 8);
    }
}
/**
 * When AV1 codec information is not provided by the container, we can still try to extract the information by digging
 * into the AV1 bitstream.
 */ const extractAv1CodecInfoFromPacket = (packet)=>{
    // https://aomediacodec.github.io/av1-spec/av1-spec.pdf
    for (const { type, data } of iterateAv1PacketObus(packet)){
        if (type !== 1) {
            continue; // 1 == OBU_SEQUENCE_HEADER
        }
        const bitstream = new Bitstream(data);
        // Read sequence header fields
        const seqProfile = bitstream.readBits(3);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        bitstream.readBits(1);
        const reducedStillPictureHeader = bitstream.readBits(1);
        let seqLevel = 0;
        let seqTier = 0;
        let bufferDelayLengthMinus1 = 0;
        if (reducedStillPictureHeader) {
            seqLevel = bitstream.readBits(5);
        } else {
            // Parse timing_info_present_flag
            const timingInfoPresentFlag = bitstream.readBits(1);
            if (timingInfoPresentFlag) {
                // Skip timing info (num_units_in_display_tick, time_scale, equal_picture_interval)
                bitstream.skipBits(32); // num_units_in_display_tick
                bitstream.skipBits(32); // time_scale
                const equalPictureInterval = bitstream.readBits(1);
                if (equalPictureInterval) {
                    // Skip num_ticks_per_picture_minus_1 (uvlc)
                    // Since this is variable length, we'd need to implement uvlc reading
                    // For now, we'll return null as this is rare
                    return null;
                }
            }
            // Parse decoder_model_info_present_flag
            const decoderModelInfoPresentFlag = bitstream.readBits(1);
            if (decoderModelInfoPresentFlag) {
                // Store buffer_delay_length_minus_1 instead of just skipping
                bufferDelayLengthMinus1 = bitstream.readBits(5);
                bitstream.skipBits(32); // num_units_in_decoding_tick
                bitstream.skipBits(5); // buffer_removal_time_length_minus_1
                bitstream.skipBits(5); // frame_presentation_time_length_minus_1
            }
            // Parse operating_points_cnt_minus_1
            const operatingPointsCntMinus1 = bitstream.readBits(5);
            // For each operating point
            for(let i = 0; i <= operatingPointsCntMinus1; i++){
                // operating_point_idc[i]
                bitstream.skipBits(12);
                // seq_level_idx[i]
                const seqLevelIdx = bitstream.readBits(5);
                if (i === 0) {
                    seqLevel = seqLevelIdx;
                }
                if (seqLevelIdx > 7) {
                    // seq_tier[i]
                    const seqTierTemp = bitstream.readBits(1);
                    if (i === 0) {
                        seqTier = seqTierTemp;
                    }
                }
                if (decoderModelInfoPresentFlag) {
                    // decoder_model_present_for_this_op[i]
                    const decoderModelPresentForThisOp = bitstream.readBits(1);
                    if (decoderModelPresentForThisOp) {
                        const n = bufferDelayLengthMinus1 + 1;
                        bitstream.skipBits(n); // decoder_buffer_delay[op]
                        bitstream.skipBits(n); // encoder_buffer_delay[op]
                        bitstream.skipBits(1); // low_delay_mode_flag[op]
                    }
                }
                // initial_display_delay_present_flag
                const initialDisplayDelayPresentFlag = bitstream.readBits(1);
                if (initialDisplayDelayPresentFlag) {
                    // initial_display_delay_minus_1[i]
                    bitstream.skipBits(4);
                }
            }
        }
        const highBitdepth = bitstream.readBits(1);
        let bitDepth = 8;
        if (seqProfile === 2 && highBitdepth) {
            const twelveBit = bitstream.readBits(1);
            bitDepth = twelveBit ? 12 : 10;
        } else if (seqProfile <= 2) {
            bitDepth = highBitdepth ? 10 : 8;
        }
        let monochrome = 0;
        if (seqProfile !== 1) {
            monochrome = bitstream.readBits(1);
        }
        let chromaSubsamplingX = 1;
        let chromaSubsamplingY = 1;
        let chromaSamplePosition = 0;
        if (!monochrome) {
            if (seqProfile === 0) {
                chromaSubsamplingX = 1;
                chromaSubsamplingY = 1;
            } else if (seqProfile === 1) {
                chromaSubsamplingX = 0;
                chromaSubsamplingY = 0;
            } else {
                if (bitDepth === 12) {
                    chromaSubsamplingX = bitstream.readBits(1);
                    if (chromaSubsamplingX) {
                        chromaSubsamplingY = bitstream.readBits(1);
                    }
                }
            }
            if (chromaSubsamplingX && chromaSubsamplingY) {
                chromaSamplePosition = bitstream.readBits(2);
            }
        }
        return {
            profile: seqProfile,
            level: seqLevel,
            tier: seqTier,
            bitDepth,
            monochrome,
            chromaSubsamplingX,
            chromaSubsamplingY,
            chromaSamplePosition
        };
    }
    return null;
};
const parseOpusIdentificationHeader = (bytes)=>{
    const view = toDataView(bytes);
    const outputChannelCount = view.getUint8(9);
    const preSkip = view.getUint16(10, true);
    const inputSampleRate = view.getUint32(12, true);
    const outputGain = view.getInt16(16, true);
    const channelMappingFamily = view.getUint8(18);
    let channelMappingTable = null;
    if (channelMappingFamily) {
        channelMappingTable = bytes.subarray(19, 19 + 2 + outputChannelCount);
    }
    return {
        outputChannelCount,
        preSkip,
        inputSampleRate,
        outputGain,
        channelMappingFamily,
        channelMappingTable
    };
};
// From https://datatracker.ietf.org/doc/html/rfc6716, in 48 kHz samples
const OPUS_FRAME_DURATION_TABLE = [
    480,
    960,
    1920,
    2880,
    480,
    960,
    1920,
    2880,
    480,
    960,
    1920,
    2880,
    480,
    960,
    480,
    960,
    120,
    240,
    480,
    960,
    120,
    240,
    480,
    960,
    120,
    240,
    480,
    960,
    120,
    240,
    480,
    960
];
const parseOpusTocByte = (packet)=>{
    const config = packet[0] >> 3;
    return {
        durationInSamples: OPUS_FRAME_DURATION_TABLE[config]
    };
};
// Based on vorbis_parser.c from FFmpeg.
const parseModesFromVorbisSetupPacket = (setupHeader)=>{
    // Verify that this is a Setup header.
    if (setupHeader.length < 7) {
        throw new Error('Setup header is too short.');
    }
    if (setupHeader[0] !== 5) {
        throw new Error('Wrong packet type in Setup header.');
    }
    const signature = String.fromCharCode(...setupHeader.slice(1, 7));
    if (signature !== 'vorbis') {
        throw new Error('Invalid packet signature in Setup header.');
    }
    // Reverse the entire buffer.
    const bufSize = setupHeader.length;
    const revBuffer = new Uint8Array(bufSize);
    for(let i = 0; i < bufSize; i++){
        revBuffer[i] = setupHeader[bufSize - 1 - i];
    }
    // Initialize a Bitstream on the reversed buffer.
    const bitstream = new Bitstream(revBuffer);
    // --- Find the framing bit.
    // In FFmpeg code, we scan until get_bits1() returns 1.
    let gotFramingBit = 0;
    while(bitstream.getBitsLeft() > 97){
        if (bitstream.readBits(1) === 1) {
            gotFramingBit = bitstream.pos;
            break;
        }
    }
    if (gotFramingBit === 0) {
        throw new Error('Invalid Setup header: framing bit not found.');
    }
    // --- Search backwards for a valid mode header.
    // We try to “guess” the number of modes by reading a fixed pattern.
    let modeCount = 0;
    let gotModeHeader = false;
    let lastModeCount = 0;
    while(bitstream.getBitsLeft() >= 97){
        const tempPos = bitstream.pos;
        const a = bitstream.readBits(8);
        const b = bitstream.readBits(16);
        const c = bitstream.readBits(16);
        // If a > 63 or b or c nonzero, assume we’ve gone too far.
        if (a > 63 || b !== 0 || c !== 0) {
            bitstream.pos = tempPos;
            break;
        }
        bitstream.skipBits(1);
        modeCount++;
        if (modeCount > 64) {
            break;
        }
        const bsClone = bitstream.clone();
        const candidate = bsClone.readBits(6) + 1;
        if (candidate === modeCount) {
            gotModeHeader = true;
            lastModeCount = modeCount;
        }
    }
    if (!gotModeHeader) {
        throw new Error('Invalid Setup header: mode header not found.');
    }
    if (lastModeCount > 63) {
        throw new Error(`Unsupported mode count: ${lastModeCount}.`);
    }
    const finalModeCount = lastModeCount;
    // --- Reinitialize the bitstream.
    bitstream.pos = 0;
    // Skip the bits up to the found framing bit.
    bitstream.skipBits(gotFramingBit);
    // --- Now read, for each mode (in reverse order), 40 bits then one bit.
    // That one bit is the mode blockflag.
    const modeBlockflags = Array(finalModeCount).fill(0);
    for(let i = finalModeCount - 1; i >= 0; i--){
        bitstream.skipBits(40);
        modeBlockflags[i] = bitstream.readBits(1);
    }
    return {
        modeBlockflags
    };
};
/** Determines a packet's type (key or delta) by digging into the packet bitstream. */ const determineVideoPacketType = async (videoTrack, packet)=>{
    assert(videoTrack.codec);
    switch(videoTrack.codec){
        case 'avc':
            {
                const decoderConfig = await videoTrack.getDecoderConfig();
                assert(decoderConfig);
                let nalUnits;
                if (decoderConfig.description) {
                    // Stream is length-prefixed. Let's extract the size of the length prefix from the decoder config
                    const bytes = toUint8Array(decoderConfig.description);
                    const lengthSizeMinusOne = bytes[4] & 3;
                    const lengthSize = lengthSizeMinusOne + 1;
                    nalUnits = findNalUnitsInLengthPrefixed(packet.data, lengthSize);
                } else {
                    // Stream is in Annex B format
                    nalUnits = findNalUnitsInAnnexB(packet.data);
                }
                const isKeyframe = nalUnits.some((x)=>extractNalUnitTypeForAvc(x) === 5);
                return isKeyframe ? 'key' : 'delta';
            }
        case 'hevc':
            {
                const decoderConfig = await videoTrack.getDecoderConfig();
                assert(decoderConfig);
                let nalUnits;
                if (decoderConfig.description) {
                    // Stream is length-prefixed. Let's extract the size of the length prefix from the decoder config
                    const bytes = toUint8Array(decoderConfig.description);
                    const lengthSizeMinusOne = bytes[21] & 3;
                    const lengthSize = lengthSizeMinusOne + 1;
                    nalUnits = findNalUnitsInLengthPrefixed(packet.data, lengthSize);
                } else {
                    // Stream is in Annex B format
                    nalUnits = findNalUnitsInAnnexB(packet.data);
                }
                const isKeyframe = nalUnits.some((x)=>{
                    const type = extractNalUnitTypeForHevc(x);
                    return 16 <= type && type <= 23;
                });
                return isKeyframe ? 'key' : 'delta';
            }
        case 'vp8':
            {
                // VP8, once again, by far the easiest to deal with.
                const frameType = packet.data[0] & 1;
                return frameType === 0 ? 'key' : 'delta';
            }
        case 'vp9':
            {
                const bitstream = new Bitstream(packet.data);
                if (bitstream.readBits(2) !== 2) {
                    return null;
                }
                const profileLowBit = bitstream.readBits(1);
                const profileHighBit = bitstream.readBits(1);
                const profile = (profileHighBit << 1) + profileLowBit;
                // Skip reserved bit for profile 3
                if (profile === 3) {
                    bitstream.skipBits(1);
                }
                const showExistingFrame = bitstream.readBits(1);
                if (showExistingFrame) {
                    return null;
                }
                const frameType = bitstream.readBits(1);
                return frameType === 0 ? 'key' : 'delta';
            }
        case 'av1':
            {
                let reducedStillPictureHeader = false;
                for (const { type, data } of iterateAv1PacketObus(packet.data)){
                    if (type === 1) {
                        const bitstream = new Bitstream(data);
                        bitstream.skipBits(4);
                        reducedStillPictureHeader = !!bitstream.readBits(1);
                    } else if (type === 3 // OBU_FRAME_HEADER
                     || type === 6 // OBU_FRAME
                     || type === 7 // OBU_REDUNDANT_FRAME_HEADER
                    ) {
                        if (reducedStillPictureHeader) {
                            return 'key';
                        }
                        const bitstream = new Bitstream(data);
                        const showExistingFrame = bitstream.readBits(1);
                        if (showExistingFrame) {
                            return null;
                        }
                        const frameType = bitstream.readBits(2);
                        return frameType === 0 ? 'key' : 'delta';
                    }
                }
                return null;
            }
        default:
            {
                assertNever(videoTrack.codec);
                assert(false);
            }
    }
};

class IsobmffBoxWriter {
    constructor(writer){
        this.writer = writer;
        this.helper = new Uint8Array(8);
        this.helperView = new DataView(this.helper.buffer);
        /**
         * Stores the position from the start of the file to where boxes elements have been written. This is used to
         * rewrite/edit elements that were already added before, and to measure sizes of things.
         */ this.offsets = new WeakMap();
    }
    writeU32(value) {
        this.helperView.setUint32(0, value, false);
        this.writer.write(this.helper.subarray(0, 4));
    }
    writeU64(value) {
        this.helperView.setUint32(0, Math.floor(value / 2 ** 32), false);
        this.helperView.setUint32(4, value, false);
        this.writer.write(this.helper.subarray(0, 8));
    }
    writeAscii(text) {
        for(let i = 0; i < text.length; i++){
            this.helperView.setUint8(i % 8, text.charCodeAt(i));
            if (i % 8 === 7) this.writer.write(this.helper);
        }
        if (text.length % 8 !== 0) {
            this.writer.write(this.helper.subarray(0, text.length % 8));
        }
    }
    writeBox(box) {
        this.offsets.set(box, this.writer.getPos());
        if (box.contents && !box.children) {
            this.writeBoxHeader(box, box.size ?? box.contents.byteLength + 8);
            this.writer.write(box.contents);
        } else {
            const startPos = this.writer.getPos();
            this.writeBoxHeader(box, 0);
            if (box.contents) this.writer.write(box.contents);
            if (box.children) {
                for (const child of box.children)if (child) this.writeBox(child);
            }
            const endPos = this.writer.getPos();
            const size = box.size ?? endPos - startPos;
            this.writer.seek(startPos);
            this.writeBoxHeader(box, size);
            this.writer.seek(endPos);
        }
    }
    writeBoxHeader(box, size) {
        this.writeU32(box.largeSize ? 1 : size);
        this.writeAscii(box.type);
        if (box.largeSize) this.writeU64(size);
    }
    measureBoxHeader(box) {
        return 8 + (box.largeSize ? 8 : 0);
    }
    patchBox(box) {
        const boxOffset = this.offsets.get(box);
        assert(boxOffset !== undefined);
        const endPos = this.writer.getPos();
        this.writer.seek(boxOffset);
        this.writeBox(box);
        this.writer.seek(endPos);
    }
    measureBox(box) {
        if (box.contents && !box.children) {
            const headerSize = this.measureBoxHeader(box);
            return headerSize + box.contents.byteLength;
        } else {
            let result = this.measureBoxHeader(box);
            if (box.contents) result += box.contents.byteLength;
            if (box.children) {
                for (const child of box.children)if (child) result += this.measureBox(child);
            }
            return result;
        }
    }
}
const bytes = new Uint8Array(8);
const view = new DataView(bytes.buffer);
const u8 = (value)=>{
    return [
        (value % 0x100 + 0x100) % 0x100
    ];
};
const u16 = (value)=>{
    view.setUint16(0, value, false);
    return [
        bytes[0],
        bytes[1]
    ];
};
const i16 = (value)=>{
    view.setInt16(0, value, false);
    return [
        bytes[0],
        bytes[1]
    ];
};
const u24 = (value)=>{
    view.setUint32(0, value, false);
    return [
        bytes[1],
        bytes[2],
        bytes[3]
    ];
};
const u32 = (value)=>{
    view.setUint32(0, value, false);
    return [
        bytes[0],
        bytes[1],
        bytes[2],
        bytes[3]
    ];
};
const i32 = (value)=>{
    view.setInt32(0, value, false);
    return [
        bytes[0],
        bytes[1],
        bytes[2],
        bytes[3]
    ];
};
const u64 = (value)=>{
    view.setUint32(0, Math.floor(value / 2 ** 32), false);
    view.setUint32(4, value, false);
    return [
        bytes[0],
        bytes[1],
        bytes[2],
        bytes[3],
        bytes[4],
        bytes[5],
        bytes[6],
        bytes[7]
    ];
};
const fixed_8_8 = (value)=>{
    view.setInt16(0, 2 ** 8 * value, false);
    return [
        bytes[0],
        bytes[1]
    ];
};
const fixed_16_16 = (value)=>{
    view.setInt32(0, 2 ** 16 * value, false);
    return [
        bytes[0],
        bytes[1],
        bytes[2],
        bytes[3]
    ];
};
const fixed_2_30 = (value)=>{
    view.setInt32(0, 2 ** 30 * value, false);
    return [
        bytes[0],
        bytes[1],
        bytes[2],
        bytes[3]
    ];
};
const variableUnsignedInt = (value, byteLength)=>{
    const bytes = [];
    let remaining = value;
    do {
        let byte = remaining & 0x7f;
        remaining >>= 7;
        // If this isn't the first byte we're adding (meaning there will be more bytes after it
        // when we reverse the array), set the continuation bit
        if (bytes.length > 0) {
            byte |= 0x80;
        }
        bytes.push(byte);
    }while (remaining > 0 || byteLength);
    // Reverse the array since we built it backwards
    return bytes.reverse();
};
const ascii = (text, nullTerminated = false)=>{
    const bytes = Array(text.length).fill(null).map((_, i)=>text.charCodeAt(i));
    if (nullTerminated) bytes.push(0x00);
    return bytes;
};
const lastPresentedSample = (samples)=>{
    let result = null;
    for (const sample of samples){
        if (!result || sample.timestamp > result.timestamp) {
            result = sample;
        }
    }
    return result;
};
const rotationMatrix = (rotationInDegrees)=>{
    const theta = rotationInDegrees * (Math.PI / 180);
    const cosTheta = Math.round(Math.cos(theta));
    const sinTheta = Math.round(Math.sin(theta));
    // Matrices are post-multiplied in ISOBMFF, meaning this is the transpose of your typical rotation matrix
    return [
        cosTheta,
        sinTheta,
        0,
        -sinTheta,
        cosTheta,
        0,
        0,
        0,
        1
    ];
};
const IDENTITY_MATRIX = rotationMatrix(0);
const matrixToBytes = (matrix)=>{
    return [
        fixed_16_16(matrix[0]),
        fixed_16_16(matrix[1]),
        fixed_2_30(matrix[2]),
        fixed_16_16(matrix[3]),
        fixed_16_16(matrix[4]),
        fixed_2_30(matrix[5]),
        fixed_16_16(matrix[6]),
        fixed_16_16(matrix[7]),
        fixed_2_30(matrix[8])
    ];
};
const box = (type, contents, children)=>({
        type,
        contents: contents && new Uint8Array(contents.flat(10)),
        children
    });
/** A FullBox always starts with a version byte, followed by three flag bytes. */ const fullBox = (type, version, flags, contents, children)=>box(type, [
        u8(version),
        u24(flags),
        contents ?? []
    ], children);
/**
 * File Type Compatibility Box: Allows the reader to determine whether this is a type of file that the
 * reader understands.
 */ const ftyp = (details)=>{
    // You can find the full logic for this at
    // https://github.com/FFmpeg/FFmpeg/blob/de2fb43e785773738c660cdafb9309b1ef1bc80d/libavformat/movenc.c#L5518
    // Obviously, this lib only needs a small subset of that logic.
    const minorVersion = 0x200;
    if (details.isQuickTime) {
        return box('ftyp', [
            ascii('qt  '),
            u32(minorVersion),
            // Compatible brands
            ascii('qt  ')
        ]);
    }
    if (details.fragmented) {
        return box('ftyp', [
            ascii('iso5'),
            u32(minorVersion),
            // Compatible brands
            ascii('iso5'),
            ascii('iso6'),
            ascii('mp41')
        ]);
    }
    return box('ftyp', [
        ascii('isom'),
        u32(minorVersion),
        // Compatible brands
        ascii('isom'),
        details.holdsAvc ? ascii('avc1') : [],
        ascii('mp41')
    ]);
};
/** Movie Sample Data Box. Contains the actual frames/samples of the media. */ const mdat = (reserveLargeSize)=>({
        type: 'mdat',
        largeSize: reserveLargeSize
    });
/**
 * Movie Box: Used to specify the information that defines a movie - that is, the information that allows
 * an application to interpret the sample data that is stored elsewhere.
 */ const moov = (trackDatas, creationTime, fragmented = false)=>box('moov', undefined, [
        mvhd(creationTime, trackDatas),
        ...trackDatas.map((x)=>trak(x, creationTime)),
        fragmented ? mvex(trackDatas) : null
    ]);
/** Movie Header Box: Used to specify the characteristics of the entire movie, such as timescale and duration. */ const mvhd = (creationTime, trackDatas)=>{
    const duration = intoTimescale(Math.max(0, ...trackDatas.filter((x)=>x.samples.length > 0).map((x)=>{
        const lastSample = lastPresentedSample(x.samples);
        return lastSample.timestamp + lastSample.duration;
    })), GLOBAL_TIMESCALE);
    const nextTrackId = Math.max(0, ...trackDatas.map((x)=>x.track.id)) + 1;
    // Conditionally use u64 if u32 isn't enough
    const needsU64 = !isU32(creationTime) || !isU32(duration);
    const u32OrU64 = needsU64 ? u64 : u32;
    return fullBox('mvhd', +needsU64, 0, [
        u32OrU64(creationTime),
        u32OrU64(creationTime),
        u32(GLOBAL_TIMESCALE),
        u32OrU64(duration),
        fixed_16_16(1),
        fixed_8_8(1),
        Array(10).fill(0),
        matrixToBytes(IDENTITY_MATRIX),
        Array(24).fill(0),
        u32(nextTrackId)
    ]);
};
/**
 * Track Box: Defines a single track of a movie. A movie may consist of one or more tracks. Each track is
 * independent of the other tracks in the movie and carries its own temporal and spatial information. Each Track Box
 * contains its associated Media Box.
 */ const trak = (trackData, creationTime)=>box('trak', undefined, [
        tkhd(trackData, creationTime),
        mdia(trackData, creationTime)
    ]);
/** Track Header Box: Specifies the characteristics of a single track within a movie. */ const tkhd = (trackData, creationTime)=>{
    const lastSample = lastPresentedSample(trackData.samples);
    const durationInGlobalTimescale = intoTimescale(lastSample ? lastSample.timestamp + lastSample.duration : 0, GLOBAL_TIMESCALE);
    const needsU64 = !isU32(creationTime) || !isU32(durationInGlobalTimescale);
    const u32OrU64 = needsU64 ? u64 : u32;
    let matrix;
    if (trackData.type === 'video') {
        const rotation = trackData.track.metadata.rotation;
        matrix = rotationMatrix(rotation ?? 0);
    } else {
        matrix = IDENTITY_MATRIX;
    }
    return fullBox('tkhd', +needsU64, 3, [
        u32OrU64(creationTime),
        u32OrU64(creationTime),
        u32(trackData.track.id),
        u32(0),
        u32OrU64(durationInGlobalTimescale),
        Array(8).fill(0),
        u16(0),
        u16(trackData.track.id),
        fixed_8_8(trackData.type === 'audio' ? 1 : 0),
        u16(0),
        matrixToBytes(matrix),
        fixed_16_16(trackData.type === 'video' ? trackData.info.width : 0),
        fixed_16_16(trackData.type === 'video' ? trackData.info.height : 0)
    ]);
};
/** Media Box: Describes and define a track's media type and sample data. */ const mdia = (trackData, creationTime)=>box('mdia', undefined, [
        mdhd(trackData, creationTime),
        hdlr(trackData),
        minf(trackData)
    ]);
/** Media Header Box: Specifies the characteristics of a media, including timescale and duration. */ const mdhd = (trackData, creationTime)=>{
    const lastSample = lastPresentedSample(trackData.samples);
    const localDuration = intoTimescale(lastSample ? lastSample.timestamp + lastSample.duration : 0, trackData.timescale);
    const needsU64 = !isU32(creationTime) || !isU32(localDuration);
    const u32OrU64 = needsU64 ? u64 : u32;
    let language = 0;
    for (const character of trackData.track.metadata.languageCode ?? UNDETERMINED_LANGUAGE){
        language <<= 5;
        language += character.charCodeAt(0) - 0x60;
    }
    return fullBox('mdhd', +needsU64, 0, [
        u32OrU64(creationTime),
        u32OrU64(creationTime),
        u32(trackData.timescale),
        u32OrU64(localDuration),
        u16(language),
        u16(0)
    ]);
};
const TRACK_TYPE_TO_COMPONENT_SUBTYPE = {
    video: 'vide',
    audio: 'soun',
    subtitle: 'text'
};
const TRACK_TYPE_TO_HANDLER_NAME = {
    video: 'MediabunnyVideoHandler',
    audio: 'MediabunnySoundHandler',
    subtitle: 'MediabunnyTextHandler'
};
/** Handler Reference Box: Specifies the media handler component that is to be used to interpret the media's data. */ const hdlr = (trackData)=>fullBox('hdlr', 0, 0, [
        ascii('mhlr'),
        ascii(TRACK_TYPE_TO_COMPONENT_SUBTYPE[trackData.type]),
        u32(0),
        u32(0),
        u32(0),
        ascii(TRACK_TYPE_TO_HANDLER_NAME[trackData.type], true)
    ]);
/**
 * Media Information Box: Stores handler-specific information for a track's media data. The media handler uses this
 * information to map from media time to media data and to process the media data.
 */ const minf = (trackData)=>box('minf', undefined, [
        TRACK_TYPE_TO_HEADER_BOX[trackData.type](),
        dinf(),
        stbl(trackData)
    ]);
/** Video Media Information Header Box: Defines specific color and graphics mode information. */ const vmhd = ()=>fullBox('vmhd', 0, 1, [
        u16(0),
        u16(0),
        u16(0),
        u16(0)
    ]);
/** Sound Media Information Header Box: Stores the sound media's control information, such as balance. */ const smhd = ()=>fullBox('smhd', 0, 0, [
        u16(0),
        u16(0)
    ]);
/** Null Media Header Box. */ const nmhd = ()=>fullBox('nmhd', 0, 0);
const TRACK_TYPE_TO_HEADER_BOX = {
    video: vmhd,
    audio: smhd,
    subtitle: nmhd
};
/**
 * Data Information Box: Contains information specifying the data handler component that provides access to the
 * media data. The data handler component uses the Data Information Box to interpret the media's data.
 */ const dinf = ()=>box('dinf', undefined, [
        dref()
    ]);
/**
 * Data Reference Box: Contains tabular data that instructs the data handler component how to access the media's data.
 */ const dref = ()=>fullBox('dref', 0, 0, [
        u32(1)
    ], [
        url()
    ]);
const url = ()=>fullBox('url ', 0, 1); // Self-reference flag enabled
/**
 * Sample Table Box: Contains information for converting from media time to sample number to sample location. This box
 * also indicates how to interpret the sample (for example, whether to decompress the video data and, if so, how).
 */ const stbl = (trackData)=>{
    const needsCtts = trackData.compositionTimeOffsetTable.length > 1 || trackData.compositionTimeOffsetTable.some((x)=>x.sampleCompositionTimeOffset !== 0);
    return box('stbl', undefined, [
        stsd(trackData),
        stts(trackData),
        needsCtts ? ctts(trackData) : null,
        needsCtts ? cslg(trackData) : null,
        stsc(trackData),
        stsz(trackData),
        stco(trackData),
        stss(trackData)
    ]);
};
/**
 * Sample Description Box: Stores information that allows you to decode samples in the media. The data stored in the
 * sample description varies, depending on the media type.
 */ const stsd = (trackData)=>{
    let sampleDescription;
    if (trackData.type === 'video') {
        sampleDescription = videoSampleDescription(VIDEO_CODEC_TO_BOX_NAME[trackData.track.source._codec], trackData);
    } else if (trackData.type === 'audio') {
        const boxName = audioCodecToBoxName(trackData.track.source._codec, trackData.muxer.isQuickTime);
        assert(boxName);
        sampleDescription = soundSampleDescription(boxName, trackData);
    } else if (trackData.type === 'subtitle') {
        sampleDescription = subtitleSampleDescription(SUBTITLE_CODEC_TO_BOX_NAME[trackData.track.source._codec], trackData);
    }
    assert(sampleDescription);
    return fullBox('stsd', 0, 0, [
        u32(1)
    ], [
        sampleDescription
    ]);
};
/** Video Sample Description Box: Contains information that defines how to interpret video media data. */ const videoSampleDescription = (compressionType, trackData)=>box(compressionType, [
        Array(6).fill(0),
        u16(1),
        u16(0),
        u16(0),
        Array(12).fill(0),
        u16(trackData.info.width),
        u16(trackData.info.height),
        u32(0x00480000),
        u32(0x00480000),
        u32(0),
        u16(1),
        Array(32).fill(0),
        u16(0x0018),
        i16(0xffff)
    ], [
        VIDEO_CODEC_TO_CONFIGURATION_BOX[trackData.track.source._codec](trackData),
        colorSpaceIsComplete(trackData.info.decoderConfig.colorSpace) ? colr(trackData) : null
    ]);
/** Colour Information Box: Specifies the color space of the video. */ const colr = (trackData)=>box('colr', [
        ascii('nclx'),
        u16(COLOR_PRIMARIES_MAP[trackData.info.decoderConfig.colorSpace.primaries]),
        u16(TRANSFER_CHARACTERISTICS_MAP[trackData.info.decoderConfig.colorSpace.transfer]),
        u16(MATRIX_COEFFICIENTS_MAP[trackData.info.decoderConfig.colorSpace.matrix]),
        u8((trackData.info.decoderConfig.colorSpace.fullRange ? 1 : 0) << 7)
    ]);
/** AVC Configuration Box: Provides additional information to the decoder. */ const avcC = (trackData)=>trackData.info.decoderConfig && box('avcC', [
        // For AVC, description is an AVCDecoderConfigurationRecord, so nothing else to do here
        ...toUint8Array(trackData.info.decoderConfig.description)
    ]);
/** HEVC Configuration Box: Provides additional information to the decoder. */ const hvcC = (trackData)=>trackData.info.decoderConfig && box('hvcC', [
        // For HEVC, description is an HEVCDecoderConfigurationRecord, so nothing else to do here
        ...toUint8Array(trackData.info.decoderConfig.description)
    ]);
/** VP Configuration Box: Provides additional information to the decoder. */ const vpcC = (trackData)=>{
    // Reference: https://www.webmproject.org/vp9/mp4/
    if (!trackData.info.decoderConfig) {
        return null;
    }
    const decoderConfig = trackData.info.decoderConfig;
    const parts = decoderConfig.codec.split('.'); // We can derive the required values from the codec string
    const profile = Number(parts[1]);
    const level = Number(parts[2]);
    const bitDepth = Number(parts[3]);
    const chromaSubsampling = parts[4] ? Number(parts[4]) : 1; // 4:2:0 colocated with luma (0,0)
    const videoFullRangeFlag = parts[8] ? Number(parts[8]) : Number(decoderConfig.colorSpace?.fullRange ?? 0);
    const thirdByte = (bitDepth << 4) + (chromaSubsampling << 1) + videoFullRangeFlag;
    const colourPrimaries = parts[5] ? Number(parts[5]) : decoderConfig.colorSpace?.primaries ? COLOR_PRIMARIES_MAP[decoderConfig.colorSpace.primaries] : 2; // Default to undetermined
    const transferCharacteristics = parts[6] ? Number(parts[6]) : decoderConfig.colorSpace?.transfer ? TRANSFER_CHARACTERISTICS_MAP[decoderConfig.colorSpace.transfer] : 2;
    const matrixCoefficients = parts[7] ? Number(parts[7]) : decoderConfig.colorSpace?.matrix ? MATRIX_COEFFICIENTS_MAP[decoderConfig.colorSpace.matrix] : 2;
    return fullBox('vpcC', 1, 0, [
        u8(profile),
        u8(level),
        u8(thirdByte),
        u8(colourPrimaries),
        u8(transferCharacteristics),
        u8(matrixCoefficients),
        u16(0)
    ]);
};
/** AV1 Configuration Box: Provides additional information to the decoder. */ const av1C = (trackData)=>{
    return box('av1C', generateAv1CodecConfigurationFromCodecString(trackData.info.decoderConfig.codec));
};
/** Sound Sample Description Box: Contains information that defines how to interpret sound media data. */ const soundSampleDescription = (compressionType, trackData)=>{
    let version = 0;
    let contents;
    let sampleSizeInBits = 16;
    if (PCM_AUDIO_CODECS.includes(trackData.track.source._codec)) {
        const codec = trackData.track.source._codec;
        const { sampleSize } = parsePcmCodec(codec);
        sampleSizeInBits = 8 * sampleSize;
        if (sampleSizeInBits > 16) {
            version = 1;
        }
    }
    if (version === 0) {
        contents = [
            Array(6).fill(0),
            u16(1),
            u16(version),
            u16(0),
            u32(0),
            u16(trackData.info.numberOfChannels),
            u16(sampleSizeInBits),
            u16(0),
            u16(0),
            u16(trackData.info.sampleRate < 2 ** 16 ? trackData.info.sampleRate : 0),
            u16(0)
        ];
    } else {
        contents = [
            Array(6).fill(0),
            u16(1),
            u16(version),
            u16(0),
            u32(0),
            u16(trackData.info.numberOfChannels),
            u16(Math.min(sampleSizeInBits, 16)),
            u16(0),
            u16(0),
            u16(trackData.info.sampleRate < 2 ** 16 ? trackData.info.sampleRate : 0),
            u16(0),
            u32(1),
            u32(sampleSizeInBits / 8),
            u32(trackData.info.numberOfChannels * sampleSizeInBits / 8),
            u32(2)
        ];
    }
    return box(compressionType, contents, [
        audioCodecToConfigurationBox(trackData.track.source._codec, trackData.muxer.isQuickTime)?.(trackData) ?? null
    ]);
};
/** MPEG-4 Elementary Stream Descriptor Box. */ const esds = (trackData)=>{
    // We build up the bytes in a layered way which reflects the nested structure
    let objectTypeIndication;
    switch(trackData.track.source._codec){
        case 'aac':
            {
                objectTypeIndication = 0x40;
            }
            break;
        case 'mp3':
            {
                objectTypeIndication = 0x6b;
            }
            break;
        case 'vorbis':
            {
                objectTypeIndication = 0xdd;
            }
            break;
        default:
            throw new Error(`Unhandled audio codec: ${trackData.track.source._codec}`);
    }
    let bytes = [
        ...u8(objectTypeIndication),
        ...u8(0x15),
        ...u24(0),
        ...u32(0),
        ...u32(0)
    ];
    if (trackData.info.decoderConfig.description) {
        const description = toUint8Array(trackData.info.decoderConfig.description);
        // Add the decoder description to the end
        bytes = [
            ...bytes,
            ...u8(0x05),
            ...variableUnsignedInt(description.byteLength),
            ...description
        ];
    }
    bytes = [
        ...u16(1),
        ...u8(0x00),
        ...u8(0x04),
        ...variableUnsignedInt(bytes.length),
        ...bytes,
        ...u8(0x06),
        ...u8(0x01),
        ...u8(0x02)
    ];
    bytes = [
        ...u8(0x03),
        ...variableUnsignedInt(bytes.length),
        ...bytes
    ];
    return fullBox('esds', 0, 0, bytes);
};
const wave = (trackData)=>{
    return box('wave', undefined, [
        frma(trackData),
        enda(trackData),
        box('\x00\x00\x00\x00')
    ]);
};
const frma = (trackData)=>{
    return box('frma', [
        ascii(audioCodecToBoxName(trackData.track.source._codec, trackData.muxer.isQuickTime))
    ]);
};
// This box specifies PCM endianness
const enda = (trackData)=>{
    const { littleEndian } = parsePcmCodec(trackData.track.source._codec);
    return box('enda', [
        u16(+littleEndian)
    ]);
};
/** Opus Specific Box. */ const dOps = (trackData)=>{
    let outputChannelCount = trackData.info.numberOfChannels;
    // Default PreSkip, should be at least 80 milliseconds worth of playback, measured in 48000 Hz samples
    let preSkip = 3840;
    let inputSampleRate = trackData.info.sampleRate;
    let outputGain = 0;
    let channelMappingFamily = 0;
    let channelMappingTable = new Uint8Array(0);
    // Read preskip and from codec private data from the encoder
    // https://www.rfc-editor.org/rfc/rfc7845#section-5
    const description = trackData.info.decoderConfig?.description;
    if (description) {
        assert(description.byteLength >= 18);
        const bytes = toUint8Array(description);
        const header = parseOpusIdentificationHeader(bytes);
        outputChannelCount = header.outputChannelCount;
        preSkip = header.preSkip;
        inputSampleRate = header.inputSampleRate;
        outputGain = header.outputGain;
        channelMappingFamily = header.channelMappingFamily;
        if (header.channelMappingTable) {
            channelMappingTable = header.channelMappingTable;
        }
    }
    // https://www.opus-codec.org/docs/opus_in_isobmff.html
    return box('dOps', [
        u8(0),
        u8(outputChannelCount),
        u16(preSkip),
        u32(inputSampleRate),
        i16(outputGain),
        u8(channelMappingFamily),
        ...channelMappingTable
    ]);
};
/** FLAC specific box. */ const dfLa = (trackData)=>{
    const description = trackData.info.decoderConfig?.description;
    assert(description);
    const bytes = toUint8Array(description);
    return fullBox('dfLa', 0, 0, [
        ...bytes.subarray(4)
    ]);
};
/** PCM Configuration Box, ISO/IEC 23003-5. */ const pcmC = (trackData)=>{
    const { littleEndian, sampleSize } = parsePcmCodec(trackData.track.source._codec);
    const formatFlags = +littleEndian;
    return fullBox('pcmC', 0, 0, [
        u8(formatFlags),
        u8(8 * sampleSize)
    ]);
};
const subtitleSampleDescription = (compressionType, trackData)=>box(compressionType, [
        Array(6).fill(0),
        u16(1)
    ], [
        SUBTITLE_CODEC_TO_CONFIGURATION_BOX[trackData.track.source._codec](trackData)
    ]);
const vttC = (trackData)=>box('vttC', [
        ...textEncoder.encode(trackData.info.config.description)
    ]);
/**
 * Time-To-Sample Box: Stores duration information for a media's samples, providing a mapping from a time in a media
 * to the corresponding data sample. The table is compact, meaning that consecutive samples with the same time delta
 * will be grouped.
 */ const stts = (trackData)=>{
    return fullBox('stts', 0, 0, [
        u32(trackData.timeToSampleTable.length),
        trackData.timeToSampleTable.map((x)=>[
                u32(x.sampleCount),
                u32(x.sampleDelta)
            ])
    ]);
};
/** Sync Sample Box: Identifies the key frames in the media, marking the random access points within a stream. */ const stss = (trackData)=>{
    if (trackData.samples.every((x)=>x.type === 'key')) return null; // No stss box -> every frame is a key frame
    const keySamples = [
        ...trackData.samples.entries()
    ].filter(([, sample])=>sample.type === 'key');
    return fullBox('stss', 0, 0, [
        u32(keySamples.length),
        keySamples.map(([index])=>u32(index + 1))
    ]);
};
/**
 * Sample-To-Chunk Box: As samples are added to a media, they are collected into chunks that allow optimized data
 * access. A chunk contains one or more samples. Chunks in a media may have different sizes, and the samples within a
 * chunk may have different sizes. The Sample-To-Chunk Box stores chunk information for the samples in a media, stored
 * in a compactly-coded fashion.
 */ const stsc = (trackData)=>{
    return fullBox('stsc', 0, 0, [
        u32(trackData.compactlyCodedChunkTable.length),
        trackData.compactlyCodedChunkTable.map((x)=>[
                u32(x.firstChunk),
                u32(x.samplesPerChunk),
                u32(1)
            ])
    ]);
};
/** Sample Size Box: Specifies the byte size of each sample in the media. */ const stsz = (trackData)=>{
    if (trackData.type === 'audio' && trackData.info.requiresPcmTransformation) {
        const { sampleSize } = parsePcmCodec(trackData.track.source._codec);
        // With PCM, every sample has the same size
        return fullBox('stsz', 0, 0, [
            u32(sampleSize * trackData.info.numberOfChannels),
            u32(trackData.samples.reduce((acc, x)=>acc + intoTimescale(x.duration, trackData.timescale), 0))
        ]);
    }
    return fullBox('stsz', 0, 0, [
        u32(0),
        u32(trackData.samples.length),
        trackData.samples.map((x)=>u32(x.size))
    ]);
};
/** Chunk Offset Box: Identifies the location of each chunk of data in the media's data stream, relative to the file. */ const stco = (trackData)=>{
    if (trackData.finalizedChunks.length > 0 && last(trackData.finalizedChunks).offset >= 2 ** 32) {
        // If the file is large, use the co64 box
        return fullBox('co64', 0, 0, [
            u32(trackData.finalizedChunks.length),
            trackData.finalizedChunks.map((x)=>u64(x.offset))
        ]);
    }
    return fullBox('stco', 0, 0, [
        u32(trackData.finalizedChunks.length),
        trackData.finalizedChunks.map((x)=>u32(x.offset))
    ]);
};
/**
 * Composition Time to Sample Box: Stores composition time offset information (PTS-DTS) for a
 * media's samples. The table is compact, meaning that consecutive samples with the same time
 * composition time offset will be grouped.
 */ const ctts = (trackData)=>{
    return fullBox('ctts', 1, 0, [
        u32(trackData.compositionTimeOffsetTable.length),
        trackData.compositionTimeOffsetTable.map((x)=>[
                u32(x.sampleCount),
                i32(x.sampleCompositionTimeOffset)
            ])
    ]);
};
/**
 * Composition to Decode Box: Stores information about the composition and display times of the media samples.
 */ const cslg = (trackData)=>{
    let leastDecodeToDisplayDelta = Infinity;
    let greatestDecodeToDisplayDelta = -Infinity;
    let compositionStartTime = Infinity;
    let compositionEndTime = -Infinity;
    assert(trackData.compositionTimeOffsetTable.length > 0);
    assert(trackData.samples.length > 0);
    for(let i = 0; i < trackData.compositionTimeOffsetTable.length; i++){
        const entry = trackData.compositionTimeOffsetTable[i];
        leastDecodeToDisplayDelta = Math.min(leastDecodeToDisplayDelta, entry.sampleCompositionTimeOffset);
        greatestDecodeToDisplayDelta = Math.max(greatestDecodeToDisplayDelta, entry.sampleCompositionTimeOffset);
    }
    for(let i = 0; i < trackData.samples.length; i++){
        const sample = trackData.samples[i];
        compositionStartTime = Math.min(compositionStartTime, intoTimescale(sample.timestamp, trackData.timescale));
        compositionEndTime = Math.max(compositionEndTime, intoTimescale(sample.timestamp + sample.duration, trackData.timescale));
    }
    const compositionToDtsShift = Math.max(-leastDecodeToDisplayDelta, 0);
    if (compositionEndTime >= 2 ** 31) {
        // For very large files, the composition end time can't be represented in i32, so let's just scrap the box in
        // that case. QuickTime fails to read the file if there's a cslg box with version 1, so that's sadly not an
        // option.
        return null;
    }
    return fullBox('cslg', 0, 0, [
        i32(compositionToDtsShift),
        i32(leastDecodeToDisplayDelta),
        i32(greatestDecodeToDisplayDelta),
        i32(compositionStartTime),
        i32(compositionEndTime)
    ]);
};
/**
 * Movie Extends Box: This box signals to readers that the file is fragmented. Contains a single Track Extends Box
 * for each track in the movie.
 */ const mvex = (trackDatas)=>{
    return box('mvex', undefined, trackDatas.map(trex));
};
/** Track Extends Box: Contains the default values used by the movie fragments. */ const trex = (trackData)=>{
    return fullBox('trex', 0, 0, [
        u32(trackData.track.id),
        u32(1),
        u32(0),
        u32(0),
        u32(0)
    ]);
};
/**
 * Movie Fragment Box: The movie fragments extend the presentation in time. They provide the information that would
 * previously have been	in the Movie Box.
 */ const moof = (sequenceNumber, trackDatas)=>{
    return box('moof', undefined, [
        mfhd(sequenceNumber),
        ...trackDatas.map(traf)
    ]);
};
/** Movie Fragment Header Box: Contains a sequence number as a safety check. */ const mfhd = (sequenceNumber)=>{
    return fullBox('mfhd', 0, 0, [
        u32(sequenceNumber)
    ]);
};
const fragmentSampleFlags = (sample)=>{
    let byte1 = 0;
    let byte2 = 0;
    const byte3 = 0;
    const byte4 = 0;
    const sampleIsDifferenceSample = sample.type === 'delta';
    byte2 |= +sampleIsDifferenceSample;
    if (sampleIsDifferenceSample) {
        byte1 |= 1; // There is redundant coding in this sample
    } else {
        byte1 |= 2; // There is no redundant coding in this sample
    }
    // Note that there are a lot of other flags to potentially set here, but most are irrelevant / non-necessary
    return byte1 << 24 | byte2 << 16 | byte3 << 8 | byte4;
};
/** Track Fragment Box */ const traf = (trackData)=>{
    return box('traf', undefined, [
        tfhd(trackData),
        tfdt(trackData),
        trun(trackData)
    ]);
};
/** Track Fragment Header Box: Provides a reference to the extended track, and flags. */ const tfhd = (trackData)=>{
    assert(trackData.currentChunk);
    let tfFlags = 0;
    tfFlags |= 0x00008; // Default sample duration present
    tfFlags |= 0x00010; // Default sample size present
    tfFlags |= 0x00020; // Default sample flags present
    tfFlags |= 0x20000; // Default base is moof
    // Prefer the second sample over the first one, as the first one is a sync sample and therefore the "odd one out"
    const referenceSample = trackData.currentChunk.samples[1] ?? trackData.currentChunk.samples[0];
    const referenceSampleInfo = {
        duration: referenceSample.timescaleUnitsToNextSample,
        size: referenceSample.size,
        flags: fragmentSampleFlags(referenceSample)
    };
    return fullBox('tfhd', 0, tfFlags, [
        u32(trackData.track.id),
        u32(referenceSampleInfo.duration),
        u32(referenceSampleInfo.size),
        u32(referenceSampleInfo.flags)
    ]);
};
/**
 * Track Fragment Decode Time Box: Provides the absolute decode time of the first sample of the fragment. This is
 * useful for performing random access on the media file.
 */ const tfdt = (trackData)=>{
    assert(trackData.currentChunk);
    return fullBox('tfdt', 1, 0, [
        u64(intoTimescale(trackData.currentChunk.startTimestamp, trackData.timescale))
    ]);
};
/** Track Run Box: Specifies a run of contiguous samples for a given track. */ const trun = (trackData)=>{
    assert(trackData.currentChunk);
    const allSampleDurations = trackData.currentChunk.samples.map((x)=>x.timescaleUnitsToNextSample);
    const allSampleSizes = trackData.currentChunk.samples.map((x)=>x.size);
    const allSampleFlags = trackData.currentChunk.samples.map(fragmentSampleFlags);
    const allSampleCompositionTimeOffsets = trackData.currentChunk.samples.map((x)=>intoTimescale(x.timestamp - x.decodeTimestamp, trackData.timescale));
    const uniqueSampleDurations = new Set(allSampleDurations);
    const uniqueSampleSizes = new Set(allSampleSizes);
    const uniqueSampleFlags = new Set(allSampleFlags);
    const uniqueSampleCompositionTimeOffsets = new Set(allSampleCompositionTimeOffsets);
    const firstSampleFlagsPresent = uniqueSampleFlags.size === 2 && allSampleFlags[0] !== allSampleFlags[1];
    const sampleDurationPresent = uniqueSampleDurations.size > 1;
    const sampleSizePresent = uniqueSampleSizes.size > 1;
    const sampleFlagsPresent = !firstSampleFlagsPresent && uniqueSampleFlags.size > 1;
    const sampleCompositionTimeOffsetsPresent = uniqueSampleCompositionTimeOffsets.size > 1 || [
        ...uniqueSampleCompositionTimeOffsets
    ].some((x)=>x !== 0);
    let flags = 0;
    flags |= 0x0001; // Data offset present
    flags |= 0x0004 * +firstSampleFlagsPresent; // First sample flags present
    flags |= 0x0100 * +sampleDurationPresent; // Sample duration present
    flags |= 0x0200 * +sampleSizePresent; // Sample size present
    flags |= 0x0400 * +sampleFlagsPresent; // Sample flags present
    flags |= 0x0800 * +sampleCompositionTimeOffsetsPresent; // Sample composition time offsets present
    return fullBox('trun', 1, flags, [
        u32(trackData.currentChunk.samples.length),
        u32(trackData.currentChunk.offset - trackData.currentChunk.moofOffset || 0),
        firstSampleFlagsPresent ? u32(allSampleFlags[0]) : [],
        trackData.currentChunk.samples.map((_, i)=>[
                sampleDurationPresent ? u32(allSampleDurations[i]) : [],
                sampleSizePresent ? u32(allSampleSizes[i]) : [],
                sampleFlagsPresent ? u32(allSampleFlags[i]) : [],
                // Sample composition time offsets
                sampleCompositionTimeOffsetsPresent ? i32(allSampleCompositionTimeOffsets[i]) : []
            ])
    ]);
};
/**
 * Movie Fragment Random Access Box: For each track, provides pointers to sync samples within the file
 * for random access.
 */ const mfra = (trackDatas)=>{
    return box('mfra', undefined, [
        ...trackDatas.map(tfra),
        mfro()
    ]);
};
/** Track Fragment Random Access Box: Provides pointers to sync samples within the file for random access. */ const tfra = (trackData, trackIndex)=>{
    const version = 1; // Using this version allows us to use 64-bit time and offset values
    return fullBox('tfra', version, 0, [
        u32(trackData.track.id),
        u32(63),
        u32(trackData.finalizedChunks.length),
        trackData.finalizedChunks.map((chunk)=>[
                u64(intoTimescale(chunk.samples[0].timestamp, trackData.timescale)),
                u64(chunk.moofOffset),
                u32(trackIndex + 1),
                u32(1),
                u32(1)
            ])
    ]);
};
/**
 * Movie Fragment Random Access Offset Box: Provides the size of the enclosing mfra box. This box can be used by readers
 * to quickly locate the mfra box by searching from the end of the file.
 */ const mfro = ()=>{
    return fullBox('mfro', 0, 0, [
        // This value needs to be overwritten manually from the outside, where the actual size of the enclosing mfra box
        // is known
        u32(0)
    ]);
};
/** VTT Empty Cue Box */ const vtte = ()=>box('vtte');
/** VTT Cue Box */ const vttc = (payload, timestamp, identifier, settings, sourceId)=>box('vttc', undefined, [
        sourceId !== null ? box('vsid', [
            i32(sourceId)
        ]) : null,
        identifier !== null ? box('iden', [
            ...textEncoder.encode(identifier)
        ]) : null,
        timestamp !== null ? box('ctim', [
            ...textEncoder.encode(formatSubtitleTimestamp(timestamp))
        ]) : null,
        settings !== null ? box('sttg', [
            ...textEncoder.encode(settings)
        ]) : null,
        box('payl', [
            ...textEncoder.encode(payload)
        ])
    ]);
/** VTT Additional Text Box */ const vtta = (notes)=>box('vtta', [
        ...textEncoder.encode(notes)
    ]);
const VIDEO_CODEC_TO_BOX_NAME = {
    avc: 'avc1',
    hevc: 'hvc1',
    vp8: 'vp08',
    vp9: 'vp09',
    av1: 'av01'
};
const VIDEO_CODEC_TO_CONFIGURATION_BOX = {
    avc: avcC,
    hevc: hvcC,
    vp8: vpcC,
    vp9: vpcC,
    av1: av1C
};
const audioCodecToBoxName = (codec, isQuickTime)=>{
    switch(codec){
        case 'aac':
            return 'mp4a';
        case 'mp3':
            return 'mp4a';
        case 'opus':
            return 'Opus';
        case 'vorbis':
            return 'mp4a';
        case 'flac':
            return 'fLaC';
        case 'ulaw':
            return 'ulaw';
        case 'alaw':
            return 'alaw';
        case 'pcm-u8':
            return 'raw ';
        case 'pcm-s8':
            return 'sowt';
    }
    // Logic diverges here
    if (isQuickTime) {
        switch(codec){
            case 'pcm-s16':
                return 'sowt';
            case 'pcm-s16be':
                return 'twos';
            case 'pcm-s24':
                return 'in24';
            case 'pcm-s24be':
                return 'in24';
            case 'pcm-s32':
                return 'in32';
            case 'pcm-s32be':
                return 'in32';
            case 'pcm-f32':
                return 'fl32';
            case 'pcm-f32be':
                return 'fl32';
            case 'pcm-f64':
                return 'fl64';
            case 'pcm-f64be':
                return 'fl64';
        }
    } else {
        switch(codec){
            case 'pcm-s16':
                return 'ipcm';
            case 'pcm-s16be':
                return 'ipcm';
            case 'pcm-s24':
                return 'ipcm';
            case 'pcm-s24be':
                return 'ipcm';
            case 'pcm-s32':
                return 'ipcm';
            case 'pcm-s32be':
                return 'ipcm';
            case 'pcm-f32':
                return 'fpcm';
            case 'pcm-f32be':
                return 'fpcm';
            case 'pcm-f64':
                return 'fpcm';
            case 'pcm-f64be':
                return 'fpcm';
        }
    }
};
const audioCodecToConfigurationBox = (codec, isQuickTime)=>{
    switch(codec){
        case 'aac':
            return esds;
        case 'mp3':
            return esds;
        case 'opus':
            return dOps;
        case 'vorbis':
            return esds;
        case 'flac':
            return dfLa;
    }
    // Logic diverges here
    if (isQuickTime) {
        switch(codec){
            case 'pcm-s24':
                return wave;
            case 'pcm-s24be':
                return wave;
            case 'pcm-s32':
                return wave;
            case 'pcm-s32be':
                return wave;
            case 'pcm-f32':
                return wave;
            case 'pcm-f32be':
                return wave;
            case 'pcm-f64':
                return wave;
            case 'pcm-f64be':
                return wave;
        }
    } else {
        switch(codec){
            case 'pcm-s16':
                return pcmC;
            case 'pcm-s16be':
                return pcmC;
            case 'pcm-s24':
                return pcmC;
            case 'pcm-s24be':
                return pcmC;
            case 'pcm-s32':
                return pcmC;
            case 'pcm-s32be':
                return pcmC;
            case 'pcm-f32':
                return pcmC;
            case 'pcm-f32be':
                return pcmC;
            case 'pcm-f64':
                return pcmC;
            case 'pcm-f64be':
                return pcmC;
        }
    }
    return null;
};
const SUBTITLE_CODEC_TO_BOX_NAME = {
    webvtt: 'wvtt'
};
const SUBTITLE_CODEC_TO_CONFIGURATION_BOX = {
    webvtt: vttC
};

class Muxer {
    constructor(output){
        this.mutex = new AsyncMutex();
        /**
         * This field is used to synchronize multiple MediaStreamTracks. They use the same time coordinate system across
         * tracks, and to ensure correct audio-video sync, we must use the same offset for all of them. The reason an offset
         * is needed at all is because the timestamps typically don't start at zero.
         */ this.firstMediaStreamTimestamp = null;
        this.trackTimestampInfo = new WeakMap();
        this.output = output;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onTrackClose(track) {}
    validateAndNormalizeTimestamp(track, timestampInSeconds, isKeyFrame) {
        timestampInSeconds += track.source._timestampOffset;
        let timestampInfo = this.trackTimestampInfo.get(track);
        if (!timestampInfo) {
            if (!isKeyFrame) {
                throw new Error('First frame must be a key frame.');
            }
            timestampInfo = {
                maxTimestamp: timestampInSeconds,
                maxTimestampBeforeLastKeyFrame: timestampInSeconds
            };
            this.trackTimestampInfo.set(track, timestampInfo);
        }
        if (timestampInSeconds < 0) {
            throw new Error(`Timestamps must be non-negative (got ${timestampInSeconds}s).`);
        }
        if (isKeyFrame) {
            timestampInfo.maxTimestampBeforeLastKeyFrame = timestampInfo.maxTimestamp;
        }
        if (timestampInSeconds < timestampInfo.maxTimestampBeforeLastKeyFrame) {
            throw new Error(`Timestamps cannot be smaller than the highest timestamp of the previous run (a run begins with a` + ` key frame and ends right before the next key frame). Got ${timestampInSeconds}s, but highest` + ` timestamp is ${timestampInfo.maxTimestampBeforeLastKeyFrame}s.`);
        }
        timestampInfo.maxTimestamp = Math.max(timestampInfo.maxTimestamp, timestampInSeconds);
        return timestampInSeconds;
    }
}

class Writer {
    constructor(){
        /** Setting this to true will cause the writer to ensure data is written in a strictly monotonic, streamable way. */ this.ensureMonotonicity = false;
        this.trackedWrites = null;
        this.trackedStart = -1;
        this.trackedEnd = -1;
    }
    start() {}
    maybeTrackWrites(data) {
        if (!this.trackedWrites) {
            return;
        }
        // Handle negative relative write positions
        let pos = this.getPos();
        if (pos < this.trackedStart) {
            if (pos + data.byteLength <= this.trackedStart) {
                return;
            }
            data = data.subarray(this.trackedStart - pos);
            pos = 0;
        }
        const neededSize = pos + data.byteLength - this.trackedStart;
        let newLength = this.trackedWrites.byteLength;
        while(newLength < neededSize){
            newLength *= 2;
        }
        // Check if we need to resize the buffer
        if (newLength !== this.trackedWrites.byteLength) {
            const copy = new Uint8Array(newLength);
            copy.set(this.trackedWrites, 0);
            this.trackedWrites = copy;
        }
        this.trackedWrites.set(data, pos - this.trackedStart);
        this.trackedEnd = Math.max(this.trackedEnd, pos + data.byteLength);
    }
    startTrackingWrites() {
        this.trackedWrites = new Uint8Array(2 ** 10);
        this.trackedStart = this.getPos();
        this.trackedEnd = this.trackedStart;
    }
    stopTrackingWrites() {
        if (!this.trackedWrites) {
            throw new Error('Internal error: Can\'t get tracked writes since nothing was tracked.');
        }
        const slice = this.trackedWrites.subarray(0, this.trackedEnd - this.trackedStart);
        const result = {
            data: slice,
            start: this.trackedStart,
            end: this.trackedEnd
        };
        this.trackedWrites = null;
        return result;
    }
}
const ARRAY_BUFFER_INITIAL_SIZE = 2 ** 16;
const ARRAY_BUFFER_MAX_SIZE = 2 ** 32;
class BufferTargetWriter extends Writer {
    constructor(target){
        super();
        this.pos = 0;
        this.maxPos = 0;
        this.target = target;
        this.supportsResize = 'resize' in new ArrayBuffer(0);
        if (this.supportsResize) {
            try {
                // @ts-expect-error Don't want to bump "lib" in tsconfig
                this.buffer = new ArrayBuffer(ARRAY_BUFFER_INITIAL_SIZE, {
                    maxByteLength: ARRAY_BUFFER_MAX_SIZE
                });
            } catch  {
                this.buffer = new ArrayBuffer(ARRAY_BUFFER_INITIAL_SIZE);
                this.supportsResize = false;
            }
        } else {
            this.buffer = new ArrayBuffer(ARRAY_BUFFER_INITIAL_SIZE);
        }
        this.bytes = new Uint8Array(this.buffer);
    }
    ensureSize(size) {
        let newLength = this.buffer.byteLength;
        while(newLength < size)newLength *= 2;
        if (newLength === this.buffer.byteLength) return;
        if (newLength > ARRAY_BUFFER_MAX_SIZE) {
            throw new Error(`ArrayBuffer exceeded maximum size of ${ARRAY_BUFFER_MAX_SIZE} bytes. Please consider using another` + ` target.`);
        }
        if (this.supportsResize) {
            // Use resize if it exists
            // @ts-expect-error Don't want to bump "lib" in tsconfig
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            this.buffer.resize(newLength);
        // The Uint8Array scales automatically
        } else {
            const newBuffer = new ArrayBuffer(newLength);
            const newBytes = new Uint8Array(newBuffer);
            newBytes.set(this.bytes, 0);
            this.buffer = newBuffer;
            this.bytes = newBytes;
        }
    }
    write(data) {
        this.maybeTrackWrites(data);
        this.ensureSize(this.pos + data.byteLength);
        this.bytes.set(data, this.pos);
        this.pos += data.byteLength;
        this.maxPos = Math.max(this.maxPos, this.pos);
    }
    seek(newPos) {
        this.pos = newPos;
    }
    getPos() {
        return this.pos;
    }
    async flush() {}
    async finalize() {
        this.ensureSize(this.pos);
        this.target.buffer = this.buffer.slice(0, Math.max(this.maxPos, this.pos));
    }
    async close() {}
    getSlice(start, end) {
        return this.bytes.slice(start, end);
    }
}
const DEFAULT_CHUNK_SIZE = 2 ** 24;
const MAX_CHUNKS_AT_ONCE = 2;
/**
 * Writes to a StreamTarget every time it is flushed, sending out all of the new data written since the
 * last flush. This is useful for streaming applications, like piping the output to disk. When using the chunked mode,
 * data will first be accumulated in larger chunks, and then the entire chunk will be flushed out at once when ready.
 */ class StreamTargetWriter extends Writer {
    constructor(target){
        super();
        this.pos = 0;
        this.sections = [];
        this.lastWriteEnd = 0;
        this.lastFlushEnd = 0;
        this.writer = null;
        /**
         * The data is divided up into fixed-size chunks, whose contents are first filled in RAM and then flushed out.
         * A chunk is flushed if all of its contents have been written.
         */ this.chunks = [];
        this.target = target;
        this.chunked = target._options.chunked ?? false;
        this.chunkSize = target._options.chunkSize ?? DEFAULT_CHUNK_SIZE;
    }
    start() {
        this.writer = this.target._writable.getWriter();
    }
    write(data) {
        if (this.pos > this.lastWriteEnd) {
            const paddingBytesNeeded = this.pos - this.lastWriteEnd;
            this.pos = this.lastWriteEnd;
            this.write(new Uint8Array(paddingBytesNeeded));
        }
        this.maybeTrackWrites(data);
        this.sections.push({
            data: data.slice(),
            start: this.pos
        });
        this.pos += data.byteLength;
        this.lastWriteEnd = Math.max(this.lastWriteEnd, this.pos);
    }
    seek(newPos) {
        this.pos = newPos;
    }
    getPos() {
        return this.pos;
    }
    async flush() {
        if (this.pos > this.lastWriteEnd) {
            // There's a "void" between the last written byte and the next byte we're about to write. Let's pad that
            // void with zeroes explicitly.
            const paddingBytesNeeded = this.pos - this.lastWriteEnd;
            this.pos = this.lastWriteEnd;
            this.write(new Uint8Array(paddingBytesNeeded));
        }
        assert(this.writer);
        if (this.sections.length === 0) return;
        const chunks = [];
        const sorted = [
            ...this.sections
        ].sort((a, b)=>a.start - b.start);
        chunks.push({
            start: sorted[0].start,
            size: sorted[0].data.byteLength
        });
        // Figure out how many contiguous chunks we have
        for(let i = 1; i < sorted.length; i++){
            const lastChunk = chunks[chunks.length - 1];
            const section = sorted[i];
            if (section.start <= lastChunk.start + lastChunk.size) {
                lastChunk.size = Math.max(lastChunk.size, section.start + section.data.byteLength - lastChunk.start);
            } else {
                chunks.push({
                    start: section.start,
                    size: section.data.byteLength
                });
            }
        }
        for (const chunk of chunks){
            chunk.data = new Uint8Array(chunk.size);
            // Make sure to write the data in the correct order for correct overwriting
            for (const section of this.sections){
                // Check if the section is in the chunk
                if (chunk.start <= section.start && section.start < chunk.start + chunk.size) {
                    chunk.data.set(section.data, section.start - chunk.start);
                }
            }
            if (this.writer.desiredSize !== null && this.writer.desiredSize <= 0) {
                await this.writer.ready; // Allow the writer to apply backpressure
            }
            if (this.chunked) {
                // Let's first gather the data into bigger chunks before writing it
                this.writeDataIntoChunks(chunk.data, chunk.start);
                this.tryToFlushChunks();
            } else {
                if (this.ensureMonotonicity && chunk.start !== this.lastFlushEnd) {
                    throw new Error('Internal error: Monotonicity violation.');
                }
                // Write out the data immediately
                void this.writer.write({
                    type: 'write',
                    data: chunk.data,
                    position: chunk.start
                });
                this.lastFlushEnd = chunk.start + chunk.data.byteLength;
            }
        }
        this.sections.length = 0;
    }
    writeDataIntoChunks(data, position) {
        // First, find the chunk to write the data into, or create one if none exists
        let chunkIndex = this.chunks.findIndex((x)=>x.start <= position && position < x.start + this.chunkSize);
        if (chunkIndex === -1) chunkIndex = this.createChunk(position);
        const chunk = this.chunks[chunkIndex];
        // Figure out how much to write to the chunk, and then write to the chunk
        const relativePosition = position - chunk.start;
        const toWrite = data.subarray(0, Math.min(this.chunkSize - relativePosition, data.byteLength));
        chunk.data.set(toWrite, relativePosition);
        // Create a section describing the region of data that was just written to
        const section = {
            start: relativePosition,
            end: relativePosition + toWrite.byteLength
        };
        this.insertSectionIntoChunk(chunk, section);
        // Queue chunk for flushing to target if it has been fully written to
        if (chunk.written[0].start === 0 && chunk.written[0].end === this.chunkSize) {
            chunk.shouldFlush = true;
        }
        // Make sure we don't hold too many chunks in memory at once to keep memory usage down
        if (this.chunks.length > MAX_CHUNKS_AT_ONCE) {
            // Flush all but the last chunk
            for(let i = 0; i < this.chunks.length - 1; i++){
                this.chunks[i].shouldFlush = true;
            }
            this.tryToFlushChunks();
        }
        // If the data didn't fit in one chunk, recurse with the remaining data
        if (toWrite.byteLength < data.byteLength) {
            this.writeDataIntoChunks(data.subarray(toWrite.byteLength), position + toWrite.byteLength);
        }
    }
    insertSectionIntoChunk(chunk, section) {
        let low = 0;
        let high = chunk.written.length - 1;
        let index = -1;
        // Do a binary search to find the last section with a start not larger than `section`'s start
        while(low <= high){
            const mid = Math.floor(low + (high - low + 1) / 2);
            if (chunk.written[mid].start <= section.start) {
                low = mid + 1;
                index = mid;
            } else {
                high = mid - 1;
            }
        }
        // Insert the new section
        chunk.written.splice(index + 1, 0, section);
        if (index === -1 || chunk.written[index].end < section.start) index++;
        // Merge overlapping sections
        while(index < chunk.written.length - 1 && chunk.written[index].end >= chunk.written[index + 1].start){
            chunk.written[index].end = Math.max(chunk.written[index].end, chunk.written[index + 1].end);
            chunk.written.splice(index + 1, 1);
        }
    }
    createChunk(includesPosition) {
        const start = Math.floor(includesPosition / this.chunkSize) * this.chunkSize;
        const chunk = {
            start,
            data: new Uint8Array(this.chunkSize),
            written: [],
            shouldFlush: false
        };
        this.chunks.push(chunk);
        this.chunks.sort((a, b)=>a.start - b.start);
        return this.chunks.indexOf(chunk);
    }
    tryToFlushChunks(force = false) {
        assert(this.writer);
        for(let i = 0; i < this.chunks.length; i++){
            const chunk = this.chunks[i];
            if (!chunk.shouldFlush && !force) continue;
            for (const section of chunk.written){
                const position = chunk.start + section.start;
                if (this.ensureMonotonicity && position !== this.lastFlushEnd) {
                    throw new Error('Internal error: Monotonicity violation.');
                }
                void this.writer.write({
                    type: 'write',
                    data: chunk.data.subarray(section.start, section.end),
                    position
                });
                this.lastFlushEnd = chunk.start + section.end;
            }
            this.chunks.splice(i--, 1);
        }
    }
    finalize() {
        if (this.chunked) {
            this.tryToFlushChunks(true);
        }
        assert(this.writer);
        return this.writer.close();
    }
    async close() {
        return this.writer?.close();
    }
}

/**
 * Base class for targets, specifying where output files are written.
 * @public
 */ class Target {
    constructor(){
        /** @internal */ this._output = null;
    }
}
/**
 * A target that writes data directly into an ArrayBuffer in memory. Great for performance, but not suitable for very
 * large files. The buffer will be available once the output has been finalized.
 * @public
 */ class BufferTarget extends Target {
    constructor(){
        super(...arguments);
        /** Stores the final output buffer. Until the output is finalized, this will be null. */ this.buffer = null;
    }
    /** @internal */ _createWriter() {
        return new BufferTargetWriter(this);
    }
}
/**
 * This target writes data to a WritableStream, making it a general-purpose target for writing data anywhere. It is
 * also compatible with FileSystemWritableFileStream for use with the File System Access API. The WritableStream can
 * also apply backpressure, which will propagate to the output and throttle the encoders.
 * @public
 */ class StreamTarget extends Target {
    constructor(writable, options = {}){
        super();
        if (!(writable instanceof WritableStream)) {
            throw new TypeError('StreamTarget requires a WritableStream instance.');
        }
        if (options != null && typeof options !== 'object') {
            throw new TypeError('StreamTarget options, when provided, must be an object.');
        }
        if (options.chunked !== undefined && typeof options.chunked !== 'boolean') {
            throw new TypeError('options.chunked, when provided, must be a boolean.');
        }
        if (options.chunkSize !== undefined && (!Number.isInteger(options.chunkSize) || options.chunkSize < 1024)) {
            throw new TypeError('options.chunkSize, when provided, must be an integer and not smaller than 1024.');
        }
        this._writable = writable;
        this._options = options;
    }
    /** @internal */ _createWriter() {
        return new StreamTargetWriter(this);
    }
}

/*!
 * Copyright (c) 2025-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */ const buildIsobmffMimeType = (info)=>{
    const base = info.hasVideo ? 'video/' : info.hasAudio ? 'audio/' : 'application/';
    let string = base + (info.isQuickTime ? 'quicktime' : 'mp4');
    if (info.codecStrings.length > 0) {
        const uniqueCodecMimeTypes = [
            ...new Set(info.codecStrings)
        ];
        string += `; codecs="${uniqueCodecMimeTypes.join(', ')}"`;
    }
    return string;
};

/*!
 * Copyright (c) 2025-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */ const MIN_BOX_HEADER_SIZE = 8;
const MAX_BOX_HEADER_SIZE = 16;
class IsobmffReader {
    constructor(reader){
        this.reader = reader;
        this.pos = 0;
    }
    readBytes(length) {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + length);
        this.pos += length;
        return new Uint8Array(view.buffer, offset, length);
    }
    readU8() {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + 1);
        this.pos++;
        return view.getUint8(offset);
    }
    readU16() {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + 2);
        this.pos += 2;
        return view.getUint16(offset, false);
    }
    readI16() {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + 2);
        this.pos += 2;
        return view.getInt16(offset, false);
    }
    readU24() {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + 3);
        this.pos += 3;
        const high = view.getUint16(offset, false);
        const low = view.getUint8(offset + 2);
        return high * 0x100 + low;
    }
    readU32() {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + 4);
        this.pos += 4;
        return view.getUint32(offset, false);
    }
    readI32() {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + 4);
        this.pos += 4;
        return view.getInt32(offset, false);
    }
    readU64() {
        const high = this.readU32();
        const low = this.readU32();
        return high * 0x100000000 + low;
    }
    readI64() {
        const high = this.readI32();
        const low = this.readU32();
        return high * 0x100000000 + low;
    }
    readF64() {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + 8);
        this.pos += 8;
        return view.getFloat64(offset, false);
    }
    readFixed_16_16() {
        return this.readI32() / 0x10000;
    }
    readFixed_2_30() {
        return this.readI32() / 0x40000000;
    }
    readAscii(length) {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + length);
        this.pos += length;
        let str = '';
        for(let i = 0; i < length; i++){
            str += String.fromCharCode(view.getUint8(offset + i));
        }
        return str;
    }
    readIsomVariableInteger() {
        let result = 0;
        for(let i = 0; i < 4; i++){
            result <<= 7;
            const nextByte = this.readU8();
            result |= nextByte & 0x7f;
            if ((nextByte & 0x80) === 0) {
                break;
            }
        }
        return result;
    }
    readBoxHeader() {
        let totalSize = this.readU32();
        const name = this.readAscii(4);
        let headerSize = 8;
        const hasLargeSize = totalSize === 1;
        if (hasLargeSize) {
            totalSize = this.readU64();
            headerSize = 16;
        }
        return {
            name,
            totalSize,
            headerSize,
            contentSize: totalSize - headerSize
        };
    }
}

const GLOBAL_TIMESCALE = 1000;
const TIMESTAMP_OFFSET = 2082844800; // Seconds between Jan 1 1904 and Jan 1 1970
const intoTimescale = (timeInSeconds, timescale, round = true)=>{
    const value = timeInSeconds * timescale;
    return round ? Math.round(value) : value;
};
class IsobmffMuxer extends Muxer {
    constructor(output, format){
        super(output);
        this.auxTarget = new BufferTarget();
        this.auxWriter = this.auxTarget._createWriter();
        this.auxBoxWriter = new IsobmffBoxWriter(this.auxWriter);
        this.mdat = null;
        this.trackDatas = [];
        this.allTracksKnown = promiseWithResolvers();
        this.creationTime = Math.floor(Date.now() / 1000) + TIMESTAMP_OFFSET;
        this.finalizedChunks = [];
        this.nextFragmentNumber = 1;
        // Only relevant for fragmented files, to make sure new fragments start with the highest timestamp seen so far
        this.maxWrittenTimestamp = -Infinity;
        this.format = format;
        this.writer = output._writer;
        this.boxWriter = new IsobmffBoxWriter(this.writer);
        this.isQuickTime = format instanceof MovOutputFormat;
        // If the fastStart option isn't defined, enable in-memory fast start if the target is an ArrayBuffer, as the
        // memory usage remains identical
        const fastStartDefault = this.writer instanceof BufferTargetWriter ? 'in-memory' : false;
        this.fastStart = format._options.fastStart ?? fastStartDefault;
        this.isFragmented = this.fastStart === 'fragmented';
        if (this.fastStart === 'in-memory' || this.isFragmented) {
            this.writer.ensureMonotonicity = true;
        }
        this.minimumFragmentDuration = format._options.minimumFragmentDuration ?? 1;
    }
    async start() {
        const release = await this.mutex.acquire();
        const holdsAvc = this.output._tracks.some((x)=>x.type === 'video' && x.source._codec === 'avc');
        // Write the header
        {
            if (this.format._options.onFtyp) {
                this.writer.startTrackingWrites();
            }
            this.boxWriter.writeBox(ftyp({
                isQuickTime: this.isQuickTime,
                holdsAvc: holdsAvc,
                fragmented: this.isFragmented
            }));
            if (this.format._options.onFtyp) {
                const { data, start } = this.writer.stopTrackingWrites();
                this.format._options.onFtyp(data, start);
            }
        }
        if (this.fastStart === 'in-memory') {
            this.mdat = mdat(false);
        } else if (this.isFragmented) ; else {
            if (this.format._options.onMdat) {
                this.writer.startTrackingWrites();
            }
            this.mdat = mdat(true); // Reserve large size by default, can refine this when finalizing.
            this.boxWriter.writeBox(this.mdat);
        }
        await this.writer.flush();
        release();
    }
    allTracksAreKnown() {
        for (const track of this.output._tracks){
            if (!track.source._closed && !this.trackDatas.some((x)=>x.track === track)) {
                return false; // We haven't seen a sample from this open track yet
            }
        }
        return true;
    }
    async getMimeType() {
        await this.allTracksKnown.promise;
        const codecStrings = this.trackDatas.map((trackData)=>{
            if (trackData.type === 'video') {
                return trackData.info.decoderConfig.codec;
            } else if (trackData.type === 'audio') {
                return trackData.info.decoderConfig.codec;
            } else {
                const map = {
                    webvtt: 'wvtt'
                };
                return map[trackData.track.source._codec];
            }
        });
        return buildIsobmffMimeType({
            isQuickTime: this.isQuickTime,
            hasVideo: this.trackDatas.some((x)=>x.type === 'video'),
            hasAudio: this.trackDatas.some((x)=>x.type === 'audio'),
            codecStrings
        });
    }
    getVideoTrackData(track, packet, meta) {
        const existingTrackData = this.trackDatas.find((x)=>x.track === track);
        if (existingTrackData) {
            return existingTrackData;
        }
        validateVideoChunkMetadata(meta);
        assert(meta);
        assert(meta.decoderConfig);
        const decoderConfig = {
            ...meta.decoderConfig
        };
        assert(decoderConfig.codedWidth !== undefined);
        assert(decoderConfig.codedHeight !== undefined);
        let requiresAnnexBTransformation = false;
        if (track.source._codec === 'avc' && !decoderConfig.description) {
            // ISOBMFF can only hold AVC in the AVCC format, not in Annex B, but the missing description indicates
            // Annex B. This means we'll need to do some converterino.
            const decoderConfigurationRecord = extractAvcDecoderConfigurationRecord(packet.data);
            if (!decoderConfigurationRecord) {
                throw new Error('Couldn\'t extract an AVCDecoderConfigurationRecord from the AVC packet. Make sure the packets are' + ' in Annex B format (as specified in ITU-T-REC-H.264) when not providing a description, or' + ' provide a description (must be an AVCDecoderConfigurationRecord as specified in ISO 14496-15)' + ' and ensure the packets are in AVCC format.');
            }
            decoderConfig.description = serializeAvcDecoderConfigurationRecord(decoderConfigurationRecord);
            requiresAnnexBTransformation = true;
        } else if (track.source._codec === 'hevc' && !decoderConfig.description) {
            // ISOBMFF can only hold HEVC in the HEVC format, not in Annex B, but the missing description indicates
            // Annex B. This means we'll need to do some converterino.
            const decoderConfigurationRecord = extractHevcDecoderConfigurationRecord(packet.data);
            if (!decoderConfigurationRecord) {
                throw new Error('Couldn\'t extract an HEVCDecoderConfigurationRecord from the HEVC packet. Make sure the packets' + ' are in Annex B format (as specified in ITU-T-REC-H.265) when not providing a description, or' + ' provide a description (must be an HEVCDecoderConfigurationRecord as specified in ISO 14496-15)' + ' and ensure the packets are in HEVC format.');
            }
            decoderConfig.description = serializeHevcDecoderConfigurationRecord(decoderConfigurationRecord);
            requiresAnnexBTransformation = true;
        }
        // The frame rate set by the user may not be an integer. Since timescale is an integer, we'll approximate the
        // frame time (inverse of frame rate) with a rational number, then use that approximation's denominator
        // as the timescale.
        const timescale = computeRationalApproximation(1 / (track.metadata.frameRate ?? 57600), 1e6).denominator;
        const newTrackData = {
            muxer: this,
            track,
            type: 'video',
            info: {
                width: decoderConfig.codedWidth,
                height: decoderConfig.codedHeight,
                decoderConfig: decoderConfig,
                requiresAnnexBTransformation
            },
            timescale,
            samples: [],
            sampleQueue: [],
            timestampProcessingQueue: [],
            timeToSampleTable: [],
            compositionTimeOffsetTable: [],
            lastTimescaleUnits: null,
            lastSample: null,
            finalizedChunks: [],
            currentChunk: null,
            compactlyCodedChunkTable: []
        };
        this.trackDatas.push(newTrackData);
        this.trackDatas.sort((a, b)=>a.track.id - b.track.id);
        if (this.allTracksAreKnown()) {
            this.allTracksKnown.resolve();
        }
        return newTrackData;
    }
    getAudioTrackData(track, meta) {
        const existingTrackData = this.trackDatas.find((x)=>x.track === track);
        if (existingTrackData) {
            return existingTrackData;
        }
        validateAudioChunkMetadata(meta);
        assert(meta);
        assert(meta.decoderConfig);
        const newTrackData = {
            muxer: this,
            track,
            type: 'audio',
            info: {
                numberOfChannels: meta.decoderConfig.numberOfChannels,
                sampleRate: meta.decoderConfig.sampleRate,
                decoderConfig: meta.decoderConfig,
                requiresPcmTransformation: !this.isFragmented && PCM_AUDIO_CODECS.includes(track.source._codec)
            },
            timescale: meta.decoderConfig.sampleRate,
            samples: [],
            sampleQueue: [],
            timestampProcessingQueue: [],
            timeToSampleTable: [],
            compositionTimeOffsetTable: [],
            lastTimescaleUnits: null,
            lastSample: null,
            finalizedChunks: [],
            currentChunk: null,
            compactlyCodedChunkTable: []
        };
        this.trackDatas.push(newTrackData);
        this.trackDatas.sort((a, b)=>a.track.id - b.track.id);
        if (this.allTracksAreKnown()) {
            this.allTracksKnown.resolve();
        }
        return newTrackData;
    }
    getSubtitleTrackData(track, meta) {
        const existingTrackData = this.trackDatas.find((x)=>x.track === track);
        if (existingTrackData) {
            return existingTrackData;
        }
        validateSubtitleMetadata(meta);
        assert(meta);
        assert(meta.config);
        const newTrackData = {
            muxer: this,
            track,
            type: 'subtitle',
            info: {
                config: meta.config
            },
            timescale: 1000,
            samples: [],
            sampleQueue: [],
            timestampProcessingQueue: [],
            timeToSampleTable: [],
            compositionTimeOffsetTable: [],
            lastTimescaleUnits: null,
            lastSample: null,
            finalizedChunks: [],
            currentChunk: null,
            compactlyCodedChunkTable: [],
            lastCueEndTimestamp: 0,
            cueQueue: [],
            nextSourceId: 0,
            cueToSourceId: new WeakMap()
        };
        this.trackDatas.push(newTrackData);
        this.trackDatas.sort((a, b)=>a.track.id - b.track.id);
        if (this.allTracksAreKnown()) {
            this.allTracksKnown.resolve();
        }
        return newTrackData;
    }
    async addEncodedVideoPacket(track, packet, meta) {
        const release = await this.mutex.acquire();
        try {
            const trackData = this.getVideoTrackData(track, packet, meta);
            let packetData = packet.data;
            if (trackData.info.requiresAnnexBTransformation) {
                const transformedData = transformAnnexBToLengthPrefixed(packetData);
                if (!transformedData) {
                    throw new Error('Failed to transform packet data. Make sure all packets are provided in Annex B format, as' + ' specified in ITU-T-REC-H.264 and ITU-T-REC-H.265.');
                }
                packetData = transformedData;
            }
            const timestamp = this.validateAndNormalizeTimestamp(trackData.track, packet.timestamp, packet.type === 'key');
            const internalSample = this.createSampleForTrack(trackData, packetData, timestamp, packet.duration, packet.type);
            await this.registerSample(trackData, internalSample);
        } finally{
            release();
        }
    }
    async addEncodedAudioPacket(track, packet, meta) {
        const release = await this.mutex.acquire();
        try {
            const trackData = this.getAudioTrackData(track, meta);
            const timestamp = this.validateAndNormalizeTimestamp(trackData.track, packet.timestamp, packet.type === 'key');
            const internalSample = this.createSampleForTrack(trackData, packet.data, timestamp, packet.duration, packet.type);
            if (trackData.info.requiresPcmTransformation) {
                await this.maybePadWithSilence(trackData, timestamp);
            }
            await this.registerSample(trackData, internalSample);
        } finally{
            release();
        }
    }
    async maybePadWithSilence(trackData, untilTimestamp) {
        // The PCM transformation assumes that all samples are contiguous. This is not something that is enforced, so
        // we need to pad the "holes" in between samples (and before the first sample) with additional
        // "silence samples".
        const lastSample = last(trackData.samples);
        const lastEndTimestamp = lastSample ? lastSample.timestamp + lastSample.duration : 0;
        const delta = untilTimestamp - lastEndTimestamp;
        const deltaInTimescale = intoTimescale(delta, trackData.timescale);
        if (deltaInTimescale > 0) {
            const { sampleSize, silentValue } = parsePcmCodec(trackData.info.decoderConfig.codec);
            const samplesNeeded = deltaInTimescale * trackData.info.numberOfChannels;
            const data = new Uint8Array(sampleSize * samplesNeeded).fill(silentValue);
            const paddingSample = this.createSampleForTrack(trackData, new Uint8Array(data.buffer), lastEndTimestamp, delta, 'key');
            await this.registerSample(trackData, paddingSample);
        }
    }
    async addSubtitleCue(track, cue, meta) {
        const release = await this.mutex.acquire();
        try {
            const trackData = this.getSubtitleTrackData(track, meta);
            this.validateAndNormalizeTimestamp(trackData.track, cue.timestamp, true);
            if (track.source._codec === 'webvtt') {
                trackData.cueQueue.push(cue);
                await this.processWebVTTCues(trackData, cue.timestamp);
            } else {
            // TODO
            }
        } finally{
            release();
        }
    }
    async processWebVTTCues(trackData, until) {
        // WebVTT cues need to undergo special processing as empty sections need to be padded out with samples, and
        // overlapping samples require special logic. The algorithm produces the format specified in ISO 14496-30.
        while(trackData.cueQueue.length > 0){
            const timestamps = new Set([]);
            for (const cue of trackData.cueQueue){
                assert(cue.timestamp <= until);
                assert(trackData.lastCueEndTimestamp <= cue.timestamp + cue.duration);
                timestamps.add(Math.max(cue.timestamp, trackData.lastCueEndTimestamp)); // Start timestamp
                timestamps.add(cue.timestamp + cue.duration); // End timestamp
            }
            const sortedTimestamps = [
                ...timestamps
            ].sort((a, b)=>a - b);
            // These are the timestamps of the next sample we'll create:
            const sampleStart = sortedTimestamps[0];
            const sampleEnd = sortedTimestamps[1] ?? sampleStart;
            if (until < sampleEnd) {
                break;
            }
            // We may need to pad out empty space with an vtte box
            if (trackData.lastCueEndTimestamp < sampleStart) {
                this.auxWriter.seek(0);
                const box = vtte();
                this.auxBoxWriter.writeBox(box);
                const body = this.auxWriter.getSlice(0, this.auxWriter.getPos());
                const sample = this.createSampleForTrack(trackData, body, trackData.lastCueEndTimestamp, sampleStart - trackData.lastCueEndTimestamp, 'key');
                await this.registerSample(trackData, sample);
                trackData.lastCueEndTimestamp = sampleStart;
            }
            this.auxWriter.seek(0);
            for(let i = 0; i < trackData.cueQueue.length; i++){
                const cue = trackData.cueQueue[i];
                if (cue.timestamp >= sampleEnd) {
                    break;
                }
                inlineTimestampRegex.lastIndex = 0;
                const containsTimestamp = inlineTimestampRegex.test(cue.text);
                const endTimestamp = cue.timestamp + cue.duration;
                let sourceId = trackData.cueToSourceId.get(cue);
                if (sourceId === undefined && sampleEnd < endTimestamp) {
                    // We know this cue will appear in more than one sample, therefore we need to mark it with a
                    // unique ID
                    sourceId = trackData.nextSourceId++;
                    trackData.cueToSourceId.set(cue, sourceId);
                }
                if (cue.notes) {
                    // Any notes/comments are included in a special vtta box
                    const box = vtta(cue.notes);
                    this.auxBoxWriter.writeBox(box);
                }
                const box = vttc(cue.text, containsTimestamp ? sampleStart : null, cue.identifier ?? null, cue.settings ?? null, sourceId ?? null);
                this.auxBoxWriter.writeBox(box);
                if (endTimestamp === sampleEnd) {
                    // The cue won't appear in any future sample, so we're done with it
                    trackData.cueQueue.splice(i--, 1);
                }
            }
            const body = this.auxWriter.getSlice(0, this.auxWriter.getPos());
            const sample = this.createSampleForTrack(trackData, body, sampleStart, sampleEnd - sampleStart, 'key');
            await this.registerSample(trackData, sample);
            trackData.lastCueEndTimestamp = sampleEnd;
        }
    }
    createSampleForTrack(trackData, data, timestamp, duration, type) {
        const sample = {
            timestamp,
            decodeTimestamp: timestamp,
            duration,
            data,
            size: data.byteLength,
            type,
            timescaleUnitsToNextSample: intoTimescale(duration, trackData.timescale)
        };
        return sample;
    }
    processTimestamps(trackData, nextSample) {
        if (trackData.timestampProcessingQueue.length === 0) {
            return;
        }
        if (trackData.type === 'audio' && trackData.info.requiresPcmTransformation) {
            let totalDuration = 0;
            // Compute the total duration in the track timescale (which is equal to the amount of PCM audio samples)
            // and simply say that's how many new samples there are.
            for(let i = 0; i < trackData.timestampProcessingQueue.length; i++){
                const sample = trackData.timestampProcessingQueue[i];
                const duration = intoTimescale(sample.duration, trackData.timescale);
                totalDuration += duration;
            }
            if (trackData.timeToSampleTable.length === 0) {
                trackData.timeToSampleTable.push({
                    sampleCount: totalDuration,
                    sampleDelta: 1
                });
            } else {
                const lastEntry = last(trackData.timeToSampleTable);
                lastEntry.sampleCount += totalDuration;
            }
            trackData.timestampProcessingQueue.length = 0;
            return;
        }
        const sortedTimestamps = trackData.timestampProcessingQueue.map((x)=>x.timestamp).sort((a, b)=>a - b);
        for(let i = 0; i < trackData.timestampProcessingQueue.length; i++){
            const sample = trackData.timestampProcessingQueue[i];
            // Since the user only supplies presentation time, but these may be out of order, we reverse-engineer from
            // that a sensible decode timestamp. The notion of a decode timestamp doesn't really make sense
            // (presentation timestamp & decode order are all you need), but it is a concept in ISOBMFF so we need to
            // model it.
            sample.decodeTimestamp = sortedTimestamps[i];
            if (!this.isFragmented && trackData.lastTimescaleUnits === null) {
                // In non-fragmented files, the first decode timestamp is always zero. If the first presentation
                // timestamp isn't zero, we'll simply use the composition time offset to achieve it.
                sample.decodeTimestamp = 0;
            }
            const sampleCompositionTimeOffset = intoTimescale(sample.timestamp - sample.decodeTimestamp, trackData.timescale);
            const durationInTimescale = intoTimescale(sample.duration, trackData.timescale);
            if (trackData.lastTimescaleUnits !== null) {
                assert(trackData.lastSample);
                const timescaleUnits = intoTimescale(sample.decodeTimestamp, trackData.timescale, false);
                const delta = Math.round(timescaleUnits - trackData.lastTimescaleUnits);
                assert(delta >= 0);
                trackData.lastTimescaleUnits += delta;
                trackData.lastSample.timescaleUnitsToNextSample = delta;
                if (!this.isFragmented) {
                    let lastTableEntry = last(trackData.timeToSampleTable);
                    assert(lastTableEntry);
                    if (lastTableEntry.sampleCount === 1) {
                        lastTableEntry.sampleDelta = delta;
                        const entryBefore = trackData.timeToSampleTable[trackData.timeToSampleTable.length - 2];
                        if (entryBefore && entryBefore.sampleDelta === delta) {
                            // If the delta is the same as the previous one, merge the two entries
                            entryBefore.sampleCount++;
                            trackData.timeToSampleTable.pop();
                            lastTableEntry = entryBefore;
                        }
                    } else if (lastTableEntry.sampleDelta !== delta) {
                        // The delta has changed, so we need a new entry to reach the current sample
                        lastTableEntry.sampleCount--;
                        trackData.timeToSampleTable.push(lastTableEntry = {
                            sampleCount: 1,
                            sampleDelta: delta
                        });
                    }
                    if (lastTableEntry.sampleDelta === durationInTimescale) {
                        // The sample's duration matches the delta, so we can increment the count
                        lastTableEntry.sampleCount++;
                    } else {
                        // Add a new entry in order to maintain the last sample's true duration
                        trackData.timeToSampleTable.push({
                            sampleCount: 1,
                            sampleDelta: durationInTimescale
                        });
                    }
                    const lastCompositionTimeOffsetTableEntry = last(trackData.compositionTimeOffsetTable);
                    assert(lastCompositionTimeOffsetTableEntry);
                    if (lastCompositionTimeOffsetTableEntry.sampleCompositionTimeOffset === sampleCompositionTimeOffset) {
                        // Simply increment the count
                        lastCompositionTimeOffsetTableEntry.sampleCount++;
                    } else {
                        // The composition time offset has changed, so create a new entry with the new composition time
                        // offset
                        trackData.compositionTimeOffsetTable.push({
                            sampleCount: 1,
                            sampleCompositionTimeOffset: sampleCompositionTimeOffset
                        });
                    }
                }
            } else {
                // Decode timestamp of the first sample
                trackData.lastTimescaleUnits = intoTimescale(sample.decodeTimestamp, trackData.timescale, false);
                if (!this.isFragmented) {
                    trackData.timeToSampleTable.push({
                        sampleCount: 1,
                        sampleDelta: durationInTimescale
                    });
                    trackData.compositionTimeOffsetTable.push({
                        sampleCount: 1,
                        sampleCompositionTimeOffset: sampleCompositionTimeOffset
                    });
                }
            }
            trackData.lastSample = sample;
        }
        trackData.timestampProcessingQueue.length = 0;
        assert(trackData.lastSample);
        assert(trackData.lastTimescaleUnits !== null);
        if (nextSample !== undefined && trackData.lastSample.timescaleUnitsToNextSample === 0) {
            assert(nextSample.type === 'key');
            // Given the next sample, we can make a guess about the duration of the last sample. This avoids having
            // the last sample's duration in each fragment be "0" for fragmented files. The guess we make here is
            // actually correct most of the time, since typically, no delta frame with a lower timestamp follows the key
            // frame (although it can happen).
            const timescaleUnits = intoTimescale(nextSample.timestamp, trackData.timescale, false);
            const delta = Math.round(timescaleUnits - trackData.lastTimescaleUnits);
            trackData.lastSample.timescaleUnitsToNextSample = delta;
        }
    }
    async registerSample(trackData, sample) {
        if (sample.type === 'key') {
            this.processTimestamps(trackData, sample);
        }
        trackData.timestampProcessingQueue.push(sample);
        if (this.isFragmented) {
            trackData.sampleQueue.push(sample);
            await this.interleaveSamples();
        } else {
            await this.addSampleToTrack(trackData, sample);
        }
    }
    async addSampleToTrack(trackData, sample) {
        if (!this.isFragmented) {
            trackData.samples.push(sample);
        }
        let beginNewChunk = false;
        if (!trackData.currentChunk) {
            beginNewChunk = true;
        } else {
            // Timestamp don't need to be monotonic (think B-frames), so we may need to update the start timestamp of
            // the chunk
            trackData.currentChunk.startTimestamp = Math.min(trackData.currentChunk.startTimestamp, sample.timestamp);
            const currentChunkDuration = sample.timestamp - trackData.currentChunk.startTimestamp;
            if (this.isFragmented) {
                // We can only finalize this fragment (and begin a new one) if we know that each track will be able to
                // start the new one with a key frame.
                const keyFrameQueuedEverywhere = this.trackDatas.every((otherTrackData)=>{
                    if (trackData === otherTrackData) {
                        return sample.type === 'key';
                    }
                    const firstQueuedSample = otherTrackData.sampleQueue[0];
                    if (firstQueuedSample) {
                        return firstQueuedSample.type === 'key';
                    }
                    return otherTrackData.track.source._closed;
                });
                if (currentChunkDuration >= this.minimumFragmentDuration && keyFrameQueuedEverywhere && sample.timestamp > this.maxWrittenTimestamp) {
                    beginNewChunk = true;
                    await this.finalizeFragment();
                }
            } else {
                beginNewChunk = currentChunkDuration >= 0.5; // Chunk is long enough, we need a new one
            }
        }
        if (beginNewChunk) {
            if (trackData.currentChunk) {
                await this.finalizeCurrentChunk(trackData);
            }
            trackData.currentChunk = {
                startTimestamp: sample.timestamp,
                samples: [],
                offset: null,
                moofOffset: null
            };
        }
        assert(trackData.currentChunk);
        trackData.currentChunk.samples.push(sample);
        if (this.isFragmented) {
            this.maxWrittenTimestamp = Math.max(this.maxWrittenTimestamp, sample.timestamp);
        }
    }
    async finalizeCurrentChunk(trackData) {
        assert(!this.isFragmented);
        if (!trackData.currentChunk) return;
        trackData.finalizedChunks.push(trackData.currentChunk);
        this.finalizedChunks.push(trackData.currentChunk);
        let sampleCount = trackData.currentChunk.samples.length;
        if (trackData.type === 'audio' && trackData.info.requiresPcmTransformation) {
            sampleCount = trackData.currentChunk.samples.reduce((acc, sample)=>acc + intoTimescale(sample.duration, trackData.timescale), 0);
        }
        if (trackData.compactlyCodedChunkTable.length === 0 || last(trackData.compactlyCodedChunkTable).samplesPerChunk !== sampleCount) {
            trackData.compactlyCodedChunkTable.push({
                firstChunk: trackData.finalizedChunks.length,
                samplesPerChunk: sampleCount
            });
        }
        if (this.fastStart === 'in-memory') {
            trackData.currentChunk.offset = 0; // We'll compute the proper offset when finalizing
            return;
        }
        // Write out the data
        trackData.currentChunk.offset = this.writer.getPos();
        for (const sample of trackData.currentChunk.samples){
            assert(sample.data);
            this.writer.write(sample.data);
            sample.data = null; // Can be GC'd
        }
        await this.writer.flush();
    }
    async interleaveSamples(isFinalCall = false) {
        assert(this.isFragmented);
        if (!isFinalCall) {
            if (!this.allTracksAreKnown()) {
                return; // We can't interleave yet as we don't yet know how many tracks we'll truly have
            }
        }
        outer: while(true){
            let trackWithMinTimestamp = null;
            let minTimestamp = Infinity;
            for (const trackData of this.trackDatas){
                if (!isFinalCall && trackData.sampleQueue.length === 0 && !trackData.track.source._closed) {
                    break outer;
                }
                if (trackData.sampleQueue.length > 0 && trackData.sampleQueue[0].timestamp < minTimestamp) {
                    trackWithMinTimestamp = trackData;
                    minTimestamp = trackData.sampleQueue[0].timestamp;
                }
            }
            if (!trackWithMinTimestamp) {
                break;
            }
            const sample = trackWithMinTimestamp.sampleQueue.shift();
            await this.addSampleToTrack(trackWithMinTimestamp, sample);
        }
    }
    async finalizeFragment(flushWriter = true) {
        assert(this.isFragmented);
        const fragmentNumber = this.nextFragmentNumber++;
        if (fragmentNumber === 1) {
            if (this.format._options.onMoov) {
                this.writer.startTrackingWrites();
            }
            // Write the moov box now that we have all decoder configs
            const movieBox = moov(this.trackDatas, this.creationTime, true);
            this.boxWriter.writeBox(movieBox);
            if (this.format._options.onMoov) {
                const { data, start } = this.writer.stopTrackingWrites();
                this.format._options.onMoov(data, start);
            }
        }
        // Not all tracks need to be present in every fragment
        const tracksInFragment = this.trackDatas.filter((x)=>x.currentChunk);
        // Create an initial moof box and measure it; we need this to know where the following mdat box will begin
        const moofBox = moof(fragmentNumber, tracksInFragment);
        const moofOffset = this.writer.getPos();
        const mdatStartPos = moofOffset + this.boxWriter.measureBox(moofBox);
        let currentPos = mdatStartPos + MIN_BOX_HEADER_SIZE;
        let fragmentStartTimestamp = Infinity;
        for (const trackData of tracksInFragment){
            trackData.currentChunk.offset = currentPos;
            trackData.currentChunk.moofOffset = moofOffset;
            for (const sample of trackData.currentChunk.samples){
                currentPos += sample.size;
            }
            fragmentStartTimestamp = Math.min(fragmentStartTimestamp, trackData.currentChunk.startTimestamp);
        }
        const mdatSize = currentPos - mdatStartPos;
        const needsLargeMdatSize = mdatSize >= 2 ** 32;
        if (needsLargeMdatSize) {
            // Shift all offsets by 8. Previously, all chunks were shifted assuming the large box size, but due to what
            // I suspect is a bug in WebKit, it failed in Safari (when livestreaming with MSE, not for static playback).
            for (const trackData of tracksInFragment){
                trackData.currentChunk.offset += MAX_BOX_HEADER_SIZE - MIN_BOX_HEADER_SIZE;
            }
        }
        if (this.format._options.onMoof) {
            this.writer.startTrackingWrites();
        }
        const newMoofBox = moof(fragmentNumber, tracksInFragment);
        this.boxWriter.writeBox(newMoofBox);
        if (this.format._options.onMoof) {
            const { data, start } = this.writer.stopTrackingWrites();
            this.format._options.onMoof(data, start, fragmentStartTimestamp);
        }
        assert(this.writer.getPos() === mdatStartPos);
        if (this.format._options.onMdat) {
            this.writer.startTrackingWrites();
        }
        const mdatBox = mdat(needsLargeMdatSize);
        mdatBox.size = mdatSize;
        this.boxWriter.writeBox(mdatBox);
        this.writer.seek(mdatStartPos + (needsLargeMdatSize ? MAX_BOX_HEADER_SIZE : MIN_BOX_HEADER_SIZE));
        // Write sample data
        for (const trackData of tracksInFragment){
            for (const sample of trackData.currentChunk.samples){
                this.writer.write(sample.data);
                sample.data = null; // Can be GC'd
            }
        }
        if (this.format._options.onMdat) {
            const { data, start } = this.writer.stopTrackingWrites();
            this.format._options.onMdat(data, start);
        }
        for (const trackData of tracksInFragment){
            trackData.finalizedChunks.push(trackData.currentChunk);
            this.finalizedChunks.push(trackData.currentChunk);
            trackData.currentChunk = null;
        }
        if (flushWriter) {
            await this.writer.flush();
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async onTrackClose(track) {
        const release = await this.mutex.acquire();
        if (track.type === 'subtitle' && track.source._codec === 'webvtt') {
            const trackData = this.trackDatas.find((x)=>x.track === track);
            if (trackData) {
                await this.processWebVTTCues(trackData, Infinity);
            }
        }
        if (this.allTracksAreKnown()) {
            this.allTracksKnown.resolve();
        }
        if (this.isFragmented) {
            // Since a track is now closed, we may be able to write out chunks that were previously waiting
            await this.interleaveSamples();
        }
        release();
    }
    /** Finalizes the file, making it ready for use. Must be called after all video and audio chunks have been added. */ async finalize() {
        const release = await this.mutex.acquire();
        this.allTracksKnown.resolve();
        for (const trackData of this.trackDatas){
            if (trackData.type === 'subtitle' && trackData.track.source._codec === 'webvtt') {
                await this.processWebVTTCues(trackData, Infinity);
            }
        }
        if (this.isFragmented) {
            await this.interleaveSamples(true);
            for (const trackData of this.trackDatas){
                this.processTimestamps(trackData);
            }
            await this.finalizeFragment(false); // Don't flush the last fragment as we will flush it with the mfra box
        } else {
            for (const trackData of this.trackDatas){
                this.processTimestamps(trackData);
                await this.finalizeCurrentChunk(trackData);
            }
        }
        if (this.fastStart === 'in-memory') {
            assert(this.mdat);
            let mdatSize;
            // We know how many chunks there are, but computing the chunk positions requires an iterative approach:
            // In order to know where the first chunk should go, we first need to know the size of the moov box. But we
            // cannot write a proper moov box without first knowing all chunk positions. So, we generate a tentative
            // moov box with placeholder values (0) for the chunk offsets to be able to compute its size. If it then
            // turns out that appending all chunks exceeds 4 GiB, we need to repeat this process, now with the co64 box
            // being used in the moov box instead, which will make it larger. After that, we definitely know the final
            // size of the moov box and can compute the proper chunk positions.
            for(let i = 0; i < 2; i++){
                const movieBox = moov(this.trackDatas, this.creationTime);
                const movieBoxSize = this.boxWriter.measureBox(movieBox);
                mdatSize = this.boxWriter.measureBox(this.mdat);
                let currentChunkPos = this.writer.getPos() + movieBoxSize + mdatSize;
                for (const chunk of this.finalizedChunks){
                    chunk.offset = currentChunkPos;
                    for (const { data } of chunk.samples){
                        assert(data);
                        currentChunkPos += data.byteLength;
                        mdatSize += data.byteLength;
                    }
                }
                if (currentChunkPos < 2 ** 32) break;
                if (mdatSize >= 2 ** 32) this.mdat.largeSize = true;
            }
            if (this.format._options.onMoov) {
                this.writer.startTrackingWrites();
            }
            const movieBox = moov(this.trackDatas, this.creationTime);
            this.boxWriter.writeBox(movieBox);
            if (this.format._options.onMoov) {
                const { data, start } = this.writer.stopTrackingWrites();
                this.format._options.onMoov(data, start);
            }
            if (this.format._options.onMdat) {
                this.writer.startTrackingWrites();
            }
            this.mdat.size = mdatSize;
            this.boxWriter.writeBox(this.mdat);
            for (const chunk of this.finalizedChunks){
                for (const sample of chunk.samples){
                    assert(sample.data);
                    this.writer.write(sample.data);
                    sample.data = null;
                }
            }
            if (this.format._options.onMdat) {
                const { data, start } = this.writer.stopTrackingWrites();
                this.format._options.onMdat(data, start);
            }
        } else if (this.isFragmented) {
            // Append the mfra box to the end of the file for better random access
            const startPos = this.writer.getPos();
            const mfraBox = mfra(this.trackDatas);
            this.boxWriter.writeBox(mfraBox);
            // Patch the 'size' field of the mfro box at the end of the mfra box now that we know its actual size
            const mfraBoxSize = this.writer.getPos() - startPos;
            this.writer.seek(this.writer.getPos() - 4);
            this.boxWriter.writeU32(mfraBoxSize);
        } else {
            assert(this.mdat);
            const mdatPos = this.boxWriter.offsets.get(this.mdat);
            assert(mdatPos !== undefined);
            const mdatSize = this.writer.getPos() - mdatPos;
            this.mdat.size = mdatSize;
            this.mdat.largeSize = mdatSize >= 2 ** 32; // Only use the large size if we need it
            this.boxWriter.patchBox(this.mdat);
            if (this.format._options.onMdat) {
                const { data, start } = this.writer.stopTrackingWrites();
                this.format._options.onMdat(data, start);
            }
            if (this.format._options.onMoov) {
                this.writer.startTrackingWrites();
            }
            const movieBox = moov(this.trackDatas, this.creationTime);
            this.boxWriter.writeBox(movieBox);
            if (this.format._options.onMoov) {
                const { data, start } = this.writer.stopTrackingWrites();
                this.format._options.onMoov(data, start);
            }
        }
        release();
    }
}

/*!
 * Copyright (c) 2025-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */ /** Wrapper around a number to be able to differentiate it in the writer. */ class EBMLFloat32 {
    constructor(value){
        this.value = value;
    }
}
/** Wrapper around a number to be able to differentiate it in the writer. */ class EBMLFloat64 {
    constructor(value){
        this.value = value;
    }
}
/** Wrapper around a number to be able to differentiate it in the writer. */ class EBMLSignedInt {
    constructor(value){
        this.value = value;
    }
}
/** Defines some of the EBML IDs used by Matroska files. */ var EBMLId;
(function(EBMLId) {
    EBMLId[EBMLId["EBML"] = 440786851] = "EBML";
    EBMLId[EBMLId["EBMLVersion"] = 17030] = "EBMLVersion";
    EBMLId[EBMLId["EBMLReadVersion"] = 17143] = "EBMLReadVersion";
    EBMLId[EBMLId["EBMLMaxIDLength"] = 17138] = "EBMLMaxIDLength";
    EBMLId[EBMLId["EBMLMaxSizeLength"] = 17139] = "EBMLMaxSizeLength";
    EBMLId[EBMLId["DocType"] = 17026] = "DocType";
    EBMLId[EBMLId["DocTypeVersion"] = 17031] = "DocTypeVersion";
    EBMLId[EBMLId["DocTypeReadVersion"] = 17029] = "DocTypeReadVersion";
    EBMLId[EBMLId["SeekHead"] = 290298740] = "SeekHead";
    EBMLId[EBMLId["Seek"] = 19899] = "Seek";
    EBMLId[EBMLId["SeekID"] = 21419] = "SeekID";
    EBMLId[EBMLId["SeekPosition"] = 21420] = "SeekPosition";
    EBMLId[EBMLId["Duration"] = 17545] = "Duration";
    EBMLId[EBMLId["Info"] = 357149030] = "Info";
    EBMLId[EBMLId["TimestampScale"] = 2807729] = "TimestampScale";
    EBMLId[EBMLId["MuxingApp"] = 19840] = "MuxingApp";
    EBMLId[EBMLId["WritingApp"] = 22337] = "WritingApp";
    EBMLId[EBMLId["Tracks"] = 374648427] = "Tracks";
    EBMLId[EBMLId["TrackEntry"] = 174] = "TrackEntry";
    EBMLId[EBMLId["TrackNumber"] = 215] = "TrackNumber";
    EBMLId[EBMLId["TrackUID"] = 29637] = "TrackUID";
    EBMLId[EBMLId["TrackType"] = 131] = "TrackType";
    EBMLId[EBMLId["FlagEnabled"] = 185] = "FlagEnabled";
    EBMLId[EBMLId["FlagDefault"] = 136] = "FlagDefault";
    EBMLId[EBMLId["FlagForced"] = 21930] = "FlagForced";
    EBMLId[EBMLId["FlagLacing"] = 156] = "FlagLacing";
    EBMLId[EBMLId["Language"] = 2274716] = "Language";
    EBMLId[EBMLId["CodecID"] = 134] = "CodecID";
    EBMLId[EBMLId["CodecPrivate"] = 25506] = "CodecPrivate";
    EBMLId[EBMLId["CodecDelay"] = 22186] = "CodecDelay";
    EBMLId[EBMLId["SeekPreRoll"] = 22203] = "SeekPreRoll";
    EBMLId[EBMLId["DefaultDuration"] = 2352003] = "DefaultDuration";
    EBMLId[EBMLId["Video"] = 224] = "Video";
    EBMLId[EBMLId["PixelWidth"] = 176] = "PixelWidth";
    EBMLId[EBMLId["PixelHeight"] = 186] = "PixelHeight";
    EBMLId[EBMLId["Audio"] = 225] = "Audio";
    EBMLId[EBMLId["SamplingFrequency"] = 181] = "SamplingFrequency";
    EBMLId[EBMLId["Channels"] = 159] = "Channels";
    EBMLId[EBMLId["BitDepth"] = 25188] = "BitDepth";
    EBMLId[EBMLId["Segment"] = 408125543] = "Segment";
    EBMLId[EBMLId["SimpleBlock"] = 163] = "SimpleBlock";
    EBMLId[EBMLId["BlockGroup"] = 160] = "BlockGroup";
    EBMLId[EBMLId["Block"] = 161] = "Block";
    EBMLId[EBMLId["BlockAdditions"] = 30113] = "BlockAdditions";
    EBMLId[EBMLId["BlockMore"] = 166] = "BlockMore";
    EBMLId[EBMLId["BlockAdditional"] = 165] = "BlockAdditional";
    EBMLId[EBMLId["BlockAddID"] = 238] = "BlockAddID";
    EBMLId[EBMLId["BlockDuration"] = 155] = "BlockDuration";
    EBMLId[EBMLId["ReferenceBlock"] = 251] = "ReferenceBlock";
    EBMLId[EBMLId["Cluster"] = 524531317] = "Cluster";
    EBMLId[EBMLId["Timestamp"] = 231] = "Timestamp";
    EBMLId[EBMLId["Cues"] = 475249515] = "Cues";
    EBMLId[EBMLId["CuePoint"] = 187] = "CuePoint";
    EBMLId[EBMLId["CueTime"] = 179] = "CueTime";
    EBMLId[EBMLId["CueTrackPositions"] = 183] = "CueTrackPositions";
    EBMLId[EBMLId["CueTrack"] = 247] = "CueTrack";
    EBMLId[EBMLId["CueClusterPosition"] = 241] = "CueClusterPosition";
    EBMLId[EBMLId["Colour"] = 21936] = "Colour";
    EBMLId[EBMLId["MatrixCoefficients"] = 21937] = "MatrixCoefficients";
    EBMLId[EBMLId["TransferCharacteristics"] = 21946] = "TransferCharacteristics";
    EBMLId[EBMLId["Primaries"] = 21947] = "Primaries";
    EBMLId[EBMLId["Range"] = 21945] = "Range";
    EBMLId[EBMLId["Projection"] = 30320] = "Projection";
    EBMLId[EBMLId["ProjectionType"] = 30321] = "ProjectionType";
    EBMLId[EBMLId["ProjectionPoseRoll"] = 30325] = "ProjectionPoseRoll";
    EBMLId[EBMLId["Attachments"] = 423732329] = "Attachments";
    EBMLId[EBMLId["Chapters"] = 272869232] = "Chapters";
    EBMLId[EBMLId["Tags"] = 307544935] = "Tags";
})(EBMLId || (EBMLId = {}));
const LEVEL_0_EBML_IDS = [
    EBMLId.EBML,
    EBMLId.Segment
];
const LEVEL_1_EBML_IDS = [
    EBMLId.EBMLMaxIDLength,
    EBMLId.EBMLMaxSizeLength,
    EBMLId.SeekHead,
    EBMLId.Info,
    EBMLId.Cluster,
    EBMLId.Tracks,
    EBMLId.Cues,
    EBMLId.Attachments,
    EBMLId.Chapters,
    EBMLId.Tags
];
const LEVEL_0_AND_1_EBML_IDS = [
    ...LEVEL_0_EBML_IDS,
    ...LEVEL_1_EBML_IDS
];
const measureUnsignedInt = (value)=>{
    if (value < 1 << 8) {
        return 1;
    } else if (value < 1 << 16) {
        return 2;
    } else if (value < 1 << 24) {
        return 3;
    } else if (value < 2 ** 32) {
        return 4;
    } else if (value < 2 ** 40) {
        return 5;
    } else {
        return 6;
    }
};
const measureSignedInt = (value)=>{
    if (value >= -64 && value < 1 << 6) {
        return 1;
    } else if (value >= -8192 && value < 1 << 13) {
        return 2;
    } else if (value >= -1048576 && value < 1 << 20) {
        return 3;
    } else if (value >= -134217728 && value < 1 << 27) {
        return 4;
    } else if (value >= -17179869184 && value < 2 ** 34) {
        return 5;
    } else {
        return 6;
    }
};
const measureVarInt = (value)=>{
    if (value < (1 << 7) - 1) {
        /** Top bit is set, leaving 7 bits to hold the integer, but we can't store
         * 127 because "all bits set to one" is a reserved value. Same thing for the
         * other cases below:
         */ return 1;
    } else if (value < (1 << 14) - 1) {
        return 2;
    } else if (value < (1 << 21) - 1) {
        return 3;
    } else if (value < (1 << 28) - 1) {
        return 4;
    } else if (value < 2 ** 35 - 1) {
        return 5;
    } else if (value < 2 ** 42 - 1) {
        return 6;
    } else {
        throw new Error('EBML varint size not supported ' + value);
    }
};
class EBMLWriter {
    constructor(writer){
        this.writer = writer;
        this.helper = new Uint8Array(8);
        this.helperView = new DataView(this.helper.buffer);
        /**
         * Stores the position from the start of the file to where EBML elements have been written. This is used to
         * rewrite/edit elements that were already added before, and to measure sizes of things.
         */ this.offsets = new WeakMap();
        /** Same as offsets, but stores position where the element's data starts (after ID and size fields). */ this.dataOffsets = new WeakMap();
    }
    writeByte(value) {
        this.helperView.setUint8(0, value);
        this.writer.write(this.helper.subarray(0, 1));
    }
    writeFloat32(value) {
        this.helperView.setFloat32(0, value, false);
        this.writer.write(this.helper.subarray(0, 4));
    }
    writeFloat64(value) {
        this.helperView.setFloat64(0, value, false);
        this.writer.write(this.helper);
    }
    writeUnsignedInt(value, width = measureUnsignedInt(value)) {
        let pos = 0;
        // Each case falls through:
        switch(width){
            case 6:
                // Need to use division to access >32 bits of floating point var
                this.helperView.setUint8(pos++, value / 2 ** 40 | 0);
            // eslint-disable-next-line no-fallthrough
            case 5:
                this.helperView.setUint8(pos++, value / 2 ** 32 | 0);
            // eslint-disable-next-line no-fallthrough
            case 4:
                this.helperView.setUint8(pos++, value >> 24);
            // eslint-disable-next-line no-fallthrough
            case 3:
                this.helperView.setUint8(pos++, value >> 16);
            // eslint-disable-next-line no-fallthrough
            case 2:
                this.helperView.setUint8(pos++, value >> 8);
            // eslint-disable-next-line no-fallthrough
            case 1:
                this.helperView.setUint8(pos++, value);
                break;
            default:
                throw new Error('Bad unsigned int size ' + width);
        }
        this.writer.write(this.helper.subarray(0, pos));
    }
    writeSignedInt(value, width = measureSignedInt(value)) {
        if (value < 0) {
            // Two's complement stuff
            value += 2 ** (width * 8);
        }
        this.writeUnsignedInt(value, width);
    }
    writeVarInt(value, width = measureVarInt(value)) {
        let pos = 0;
        switch(width){
            case 1:
                this.helperView.setUint8(pos++, 1 << 7 | value);
                break;
            case 2:
                this.helperView.setUint8(pos++, 1 << 6 | value >> 8);
                this.helperView.setUint8(pos++, value);
                break;
            case 3:
                this.helperView.setUint8(pos++, 1 << 5 | value >> 16);
                this.helperView.setUint8(pos++, value >> 8);
                this.helperView.setUint8(pos++, value);
                break;
            case 4:
                this.helperView.setUint8(pos++, 1 << 4 | value >> 24);
                this.helperView.setUint8(pos++, value >> 16);
                this.helperView.setUint8(pos++, value >> 8);
                this.helperView.setUint8(pos++, value);
                break;
            case 5:
                /**
                 * JavaScript converts its doubles to 32-bit integers for bitwise
                 * operations, so we need to do a division by 2^32 instead of a
                 * right-shift of 32 to retain those top 3 bits
                 */ this.helperView.setUint8(pos++, 1 << 3 | value / 2 ** 32 & 0x7);
                this.helperView.setUint8(pos++, value >> 24);
                this.helperView.setUint8(pos++, value >> 16);
                this.helperView.setUint8(pos++, value >> 8);
                this.helperView.setUint8(pos++, value);
                break;
            case 6:
                this.helperView.setUint8(pos++, 1 << 2 | value / 2 ** 40 & 0x3);
                this.helperView.setUint8(pos++, value / 2 ** 32 | 0);
                this.helperView.setUint8(pos++, value >> 24);
                this.helperView.setUint8(pos++, value >> 16);
                this.helperView.setUint8(pos++, value >> 8);
                this.helperView.setUint8(pos++, value);
                break;
            default:
                throw new Error('Bad EBML varint size ' + width);
        }
        this.writer.write(this.helper.subarray(0, pos));
    }
    // Assumes the string is ASCII
    writeString(str) {
        this.writer.write(new Uint8Array(str.split('').map((x)=>x.charCodeAt(0))));
    }
    writeEBML(data) {
        if (data === null) return;
        if (data instanceof Uint8Array) {
            this.writer.write(data);
        } else if (Array.isArray(data)) {
            for (const elem of data){
                this.writeEBML(elem);
            }
        } else {
            this.offsets.set(data, this.writer.getPos());
            this.writeUnsignedInt(data.id); // ID field
            if (Array.isArray(data.data)) {
                const sizePos = this.writer.getPos();
                const sizeSize = data.size === -1 ? 1 : data.size ?? 4;
                if (data.size === -1) {
                    // Write the reserved all-one-bits marker for unknown/unbounded size.
                    this.writeByte(0xff);
                } else {
                    this.writer.seek(this.writer.getPos() + sizeSize);
                }
                const startPos = this.writer.getPos();
                this.dataOffsets.set(data, startPos);
                this.writeEBML(data.data);
                if (data.size !== -1) {
                    const size = this.writer.getPos() - startPos;
                    const endPos = this.writer.getPos();
                    this.writer.seek(sizePos);
                    this.writeVarInt(size, sizeSize);
                    this.writer.seek(endPos);
                }
            } else if (typeof data.data === 'number') {
                const size = data.size ?? measureUnsignedInt(data.data);
                this.writeVarInt(size);
                this.writeUnsignedInt(data.data, size);
            } else if (typeof data.data === 'string') {
                this.writeVarInt(data.data.length);
                this.writeString(data.data);
            } else if (data.data instanceof Uint8Array) {
                this.writeVarInt(data.data.byteLength, data.size);
                this.writer.write(data.data);
            } else if (data.data instanceof EBMLFloat32) {
                this.writeVarInt(4);
                this.writeFloat32(data.data.value);
            } else if (data.data instanceof EBMLFloat64) {
                this.writeVarInt(8);
                this.writeFloat64(data.data.value);
            } else if (data.data instanceof EBMLSignedInt) {
                const size = data.size ?? measureSignedInt(data.data.value);
                this.writeVarInt(size);
                this.writeSignedInt(data.data.value, size);
            }
        }
    }
}
const MAX_VAR_INT_SIZE = 8;
const MIN_HEADER_SIZE = 2; // 1-byte ID and 1-byte size
const MAX_HEADER_SIZE = 4 + MAX_VAR_INT_SIZE; // 4-byte ID and 8-byte size
class EBMLReader {
    constructor(reader){
        this.reader = reader;
        this.pos = 0;
    }
    readBytes(length) {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + length);
        this.pos += length;
        return new Uint8Array(view.buffer, offset, length);
    }
    readU8() {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + 1);
        this.pos++;
        return view.getUint8(offset);
    }
    readS16() {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + 2);
        this.pos += 2;
        return view.getInt16(offset, false);
    }
    readVarIntSize() {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + 1);
        const firstByte = view.getUint8(offset);
        let width = 1;
        let mask = 0x80;
        while((firstByte & mask) === 0 && width < 8){
            width++;
            mask >>= 1;
        }
        return width;
    }
    readVarInt() {
        // Read the first byte to determine the width of the variable-length integer
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + 1);
        const firstByte = view.getUint8(offset);
        // Find the position of VINT_MARKER, which determines the width
        let width = 1;
        let mask = 1 << 7;
        while((firstByte & mask) === 0 && width < MAX_VAR_INT_SIZE){
            width++;
            mask >>= 1;
        }
        const { view: fullView, offset: fullOffset } = this.reader.getViewAndOffset(this.pos, this.pos + width);
        // First byte's value needs the marker bit cleared
        let value = firstByte & mask - 1;
        // Read remaining bytes
        for(let i = 1; i < width; i++){
            value *= 1 << 8;
            value += fullView.getUint8(fullOffset + i);
        }
        this.pos += width;
        return value;
    }
    readUnsignedInt(width) {
        if (width < 1 || width > 8) {
            throw new Error('Bad unsigned int size ' + width);
        }
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + width);
        let value = 0;
        // Read bytes from most significant to least significant
        for(let i = 0; i < width; i++){
            value *= 1 << 8;
            value += view.getUint8(offset + i);
        }
        this.pos += width;
        return value;
    }
    readSignedInt(width) {
        let value = this.readUnsignedInt(width);
        // If the highest bit is set, convert from two's complement
        if (value & 1 << width * 8 - 1) {
            value -= 2 ** (width * 8);
        }
        return value;
    }
    readFloat(width) {
        if (width === 0) {
            return 0;
        }
        if (width !== 4 && width !== 8) {
            throw new Error('Bad float size ' + width);
        }
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + width);
        const value = width === 4 ? view.getFloat32(offset, false) : view.getFloat64(offset, false);
        this.pos += width;
        return value;
    }
    readString(length) {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + length);
        this.pos += length;
        return String.fromCharCode(...new Uint8Array(view.buffer, offset, length));
    }
    readElementId() {
        const size = this.readVarIntSize();
        const id = this.readUnsignedInt(size);
        return id;
    }
    readElementSize() {
        let size = this.readU8();
        if (size === 0xff) {
            size = null;
        } else {
            this.pos--;
            size = this.readVarInt();
            // In some (livestreamed) files, this is the value of the size field. While this technically is just a very
            // large number, it is intended to behave like the reserved size 0xFF, meaning the size is undefined. We
            // catch the number here. Note that it cannot be perfectly represented as a double, but the comparison works
            // nonetheless.
            // eslint-disable-next-line no-loss-of-precision
            if (size === 0x00ffffffffffffff) {
                size = null;
            }
        }
        return size;
    }
    readElementHeader() {
        const id = this.readElementId();
        const size = this.readElementSize();
        return {
            id,
            size
        };
    }
    /** Returns the byte offset in the file of the next element with a matching ID. */ async searchForNextElementId(ids, until) {
        const loadChunkSize = 2 ** 20; // 1 MiB
        const idsSet = new Set(ids);
        while(this.pos < until - MAX_HEADER_SIZE){
            if (!this.reader.rangeIsLoaded(this.pos, this.pos + MAX_HEADER_SIZE)) {
                await this.reader.loadRange(this.pos, Math.min(this.pos + loadChunkSize, until));
            }
            const elementStartPos = this.pos;
            const elementHeader = this.readElementHeader();
            if (idsSet.has(elementHeader.id)) {
                return elementStartPos;
            }
            assertDefinedSize(elementHeader.size);
            this.pos += elementHeader.size;
        }
        return null;
    }
}
const CODEC_STRING_MAP = {
    'avc': 'V_MPEG4/ISO/AVC',
    'hevc': 'V_MPEGH/ISO/HEVC',
    'vp8': 'V_VP8',
    'vp9': 'V_VP9',
    'av1': 'V_AV1',
    'aac': 'A_AAC',
    'mp3': 'A_MPEG/L3',
    'opus': 'A_OPUS',
    'vorbis': 'A_VORBIS',
    'flac': 'A_FLAC',
    'pcm-u8': 'A_PCM/INT/LIT',
    'pcm-s16': 'A_PCM/INT/LIT',
    'pcm-s16be': 'A_PCM/INT/BIG',
    'pcm-s24': 'A_PCM/INT/LIT',
    'pcm-s24be': 'A_PCM/INT/BIG',
    'pcm-s32': 'A_PCM/INT/LIT',
    'pcm-s32be': 'A_PCM/INT/BIG',
    'pcm-f32': 'A_PCM/FLOAT/IEEE',
    'pcm-f64': 'A_PCM/FLOAT/IEEE',
    'webvtt': 'S_TEXT/WEBVTT'
};
function assertDefinedSize(size) {
    if (size === null) {
        throw new Error('Undefined element size is used in a place where it is not supported.');
    }
}

/*!
 * Copyright (c) 2025-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */ const buildMatroskaMimeType = (info)=>{
    const base = info.hasVideo ? 'video/' : info.hasAudio ? 'audio/' : 'application/';
    let string = base + (info.isWebM ? 'webm' : 'x-matroska');
    if (info.codecStrings.length > 0) {
        const uniqueCodecMimeTypes = [
            ...new Set(info.codecStrings.filter(Boolean))
        ];
        string += `; codecs="${uniqueCodecMimeTypes.join(', ')}"`;
    }
    return string;
};

const MIN_CLUSTER_TIMESTAMP_MS = -32768;
const MAX_CLUSTER_TIMESTAMP_MS = 2 ** 15 - 1;
const APP_NAME = 'https://github.com/Vanilagy/mediabunny';
const SEGMENT_SIZE_BYTES = 6;
const CLUSTER_SIZE_BYTES = 5;
const TRACK_TYPE_MAP = {
    video: 1,
    audio: 2,
    subtitle: 17
};
class MatroskaMuxer extends Muxer {
    constructor(output, format){
        super(output);
        this.trackDatas = [];
        this.allTracksKnown = promiseWithResolvers();
        this.segment = null;
        this.segmentInfo = null;
        this.seekHead = null;
        this.tracksElement = null;
        this.segmentDuration = null;
        this.cues = null;
        this.currentCluster = null;
        this.currentClusterStartMsTimestamp = null;
        this.currentClusterMaxMsTimestamp = null;
        this.trackDatasInCurrentCluster = new Map();
        this.duration = 0;
        this.writer = output._writer;
        this.format = format;
        this.ebmlWriter = new EBMLWriter(this.writer);
        if (this.format._options.appendOnly) {
            this.writer.ensureMonotonicity = true;
        }
    }
    async start() {
        const release = await this.mutex.acquire();
        this.writeEBMLHeader();
        if (!this.format._options.appendOnly) {
            this.createSeekHead();
        }
        this.createSegmentInfo();
        this.createCues();
        await this.writer.flush();
        release();
    }
    writeEBMLHeader() {
        if (this.format._options.onEbmlHeader) {
            this.writer.startTrackingWrites();
        }
        const ebmlHeader = {
            id: EBMLId.EBML,
            data: [
                {
                    id: EBMLId.EBMLVersion,
                    data: 1
                },
                {
                    id: EBMLId.EBMLReadVersion,
                    data: 1
                },
                {
                    id: EBMLId.EBMLMaxIDLength,
                    data: 4
                },
                {
                    id: EBMLId.EBMLMaxSizeLength,
                    data: 8
                },
                {
                    id: EBMLId.DocType,
                    data: this.format instanceof WebMOutputFormat ? 'webm' : 'matroska'
                },
                {
                    id: EBMLId.DocTypeVersion,
                    data: 2
                },
                {
                    id: EBMLId.DocTypeReadVersion,
                    data: 2
                }
            ]
        };
        this.ebmlWriter.writeEBML(ebmlHeader);
        if (this.format._options.onEbmlHeader) {
            const { data, start } = this.writer.stopTrackingWrites(); // start should be 0
            this.format._options.onEbmlHeader(data, start);
        }
    }
    /**
     * Creates a SeekHead element which is positioned near the start of the file and allows the media player to seek to
     * relevant sections more easily. Since we don't know the positions of those sections yet, we'll set them later.
     */ createSeekHead() {
        const kaxCues = new Uint8Array([
            0x1c,
            0x53,
            0xbb,
            0x6b
        ]);
        const kaxInfo = new Uint8Array([
            0x15,
            0x49,
            0xa9,
            0x66
        ]);
        const kaxTracks = new Uint8Array([
            0x16,
            0x54,
            0xae,
            0x6b
        ]);
        const seekHead = {
            id: EBMLId.SeekHead,
            data: [
                {
                    id: EBMLId.Seek,
                    data: [
                        {
                            id: EBMLId.SeekID,
                            data: kaxCues
                        },
                        {
                            id: EBMLId.SeekPosition,
                            size: 5,
                            data: 0
                        }
                    ]
                },
                {
                    id: EBMLId.Seek,
                    data: [
                        {
                            id: EBMLId.SeekID,
                            data: kaxInfo
                        },
                        {
                            id: EBMLId.SeekPosition,
                            size: 5,
                            data: 0
                        }
                    ]
                },
                {
                    id: EBMLId.Seek,
                    data: [
                        {
                            id: EBMLId.SeekID,
                            data: kaxTracks
                        },
                        {
                            id: EBMLId.SeekPosition,
                            size: 5,
                            data: 0
                        }
                    ]
                }
            ]
        };
        this.seekHead = seekHead;
    }
    createSegmentInfo() {
        const segmentDuration = {
            id: EBMLId.Duration,
            data: new EBMLFloat64(0)
        };
        this.segmentDuration = segmentDuration;
        const segmentInfo = {
            id: EBMLId.Info,
            data: [
                {
                    id: EBMLId.TimestampScale,
                    data: 1e6
                },
                {
                    id: EBMLId.MuxingApp,
                    data: APP_NAME
                },
                {
                    id: EBMLId.WritingApp,
                    data: APP_NAME
                },
                !this.format._options.appendOnly ? segmentDuration : null
            ]
        };
        this.segmentInfo = segmentInfo;
    }
    createTracks() {
        const tracksElement = {
            id: EBMLId.Tracks,
            data: []
        };
        this.tracksElement = tracksElement;
        for (const trackData of this.trackDatas){
            const codecId = CODEC_STRING_MAP[trackData.track.source._codec];
            assert(codecId);
            let seekPreRollNs = 0;
            if (trackData.type === 'audio' && trackData.track.source._codec === 'opus') {
                seekPreRollNs = 1e6 * 80; // In "Matroska ticks" (nanoseconds)
                const description = trackData.info.decoderConfig.description;
                if (description) {
                    const bytes = toUint8Array(description);
                    const header = parseOpusIdentificationHeader(bytes);
                    // Use the preSkip value from the header
                    seekPreRollNs = Math.round(1e9 * (header.preSkip / OPUS_INTERNAL_SAMPLE_RATE));
                }
            }
            tracksElement.data.push({
                id: EBMLId.TrackEntry,
                data: [
                    {
                        id: EBMLId.TrackNumber,
                        data: trackData.track.id
                    },
                    {
                        id: EBMLId.TrackUID,
                        data: trackData.track.id
                    },
                    {
                        id: EBMLId.TrackType,
                        data: TRACK_TYPE_MAP[trackData.type]
                    },
                    {
                        id: EBMLId.FlagLacing,
                        data: 0
                    },
                    {
                        id: EBMLId.Language,
                        data: trackData.track.metadata.languageCode ?? UNDETERMINED_LANGUAGE
                    },
                    {
                        id: EBMLId.CodecID,
                        data: codecId
                    },
                    {
                        id: EBMLId.CodecDelay,
                        data: 0
                    },
                    {
                        id: EBMLId.SeekPreRoll,
                        data: seekPreRollNs
                    },
                    trackData.type === 'video' ? this.videoSpecificTrackInfo(trackData) : null,
                    trackData.type === 'audio' ? this.audioSpecificTrackInfo(trackData) : null,
                    trackData.type === 'subtitle' ? this.subtitleSpecificTrackInfo(trackData) : null
                ]
            });
        }
    }
    videoSpecificTrackInfo(trackData) {
        const { frameRate, rotation } = trackData.track.metadata;
        const elements = [
            trackData.info.decoderConfig.description ? {
                id: EBMLId.CodecPrivate,
                data: toUint8Array(trackData.info.decoderConfig.description)
            } : null,
            frameRate ? {
                id: EBMLId.DefaultDuration,
                data: 1e9 / frameRate
            } : null
        ];
        // Convert from clockwise to counter-clockwise
        const flippedRotation = rotation ? normalizeRotation(-rotation) : 0;
        const colorSpace = trackData.info.decoderConfig.colorSpace;
        const videoElement = {
            id: EBMLId.Video,
            data: [
                {
                    id: EBMLId.PixelWidth,
                    data: trackData.info.width
                },
                {
                    id: EBMLId.PixelHeight,
                    data: trackData.info.height
                },
                colorSpaceIsComplete(colorSpace) ? {
                    id: EBMLId.Colour,
                    data: [
                        {
                            id: EBMLId.MatrixCoefficients,
                            data: MATRIX_COEFFICIENTS_MAP[colorSpace.matrix]
                        },
                        {
                            id: EBMLId.TransferCharacteristics,
                            data: TRANSFER_CHARACTERISTICS_MAP[colorSpace.transfer]
                        },
                        {
                            id: EBMLId.Primaries,
                            data: COLOR_PRIMARIES_MAP[colorSpace.primaries]
                        },
                        {
                            id: EBMLId.Range,
                            data: colorSpace.fullRange ? 2 : 1
                        }
                    ]
                } : null,
                flippedRotation ? {
                    id: EBMLId.Projection,
                    data: [
                        {
                            id: EBMLId.ProjectionType,
                            data: 0
                        },
                        {
                            id: EBMLId.ProjectionPoseRoll,
                            data: new EBMLFloat32((flippedRotation + 180) % 360 - 180)
                        }
                    ]
                } : null
            ]
        };
        elements.push(videoElement);
        return elements;
    }
    audioSpecificTrackInfo(trackData) {
        const pcmInfo = PCM_AUDIO_CODECS.includes(trackData.track.source._codec) ? parsePcmCodec(trackData.track.source._codec) : null;
        return [
            trackData.info.decoderConfig.description ? {
                id: EBMLId.CodecPrivate,
                data: toUint8Array(trackData.info.decoderConfig.description)
            } : null,
            {
                id: EBMLId.Audio,
                data: [
                    {
                        id: EBMLId.SamplingFrequency,
                        data: new EBMLFloat32(trackData.info.sampleRate)
                    },
                    {
                        id: EBMLId.Channels,
                        data: trackData.info.numberOfChannels
                    },
                    pcmInfo ? {
                        id: EBMLId.BitDepth,
                        data: 8 * pcmInfo.sampleSize
                    } : null
                ]
            }
        ];
    }
    subtitleSpecificTrackInfo(trackData) {
        return [
            {
                id: EBMLId.CodecPrivate,
                data: textEncoder.encode(trackData.info.config.description)
            }
        ];
    }
    createSegment() {
        const segment = {
            id: EBMLId.Segment,
            size: this.format._options.appendOnly ? -1 : SEGMENT_SIZE_BYTES,
            data: [
                !this.format._options.appendOnly ? this.seekHead : null,
                this.segmentInfo,
                this.tracksElement
            ]
        };
        this.segment = segment;
        if (this.format._options.onSegmentHeader) {
            this.writer.startTrackingWrites();
        }
        this.ebmlWriter.writeEBML(segment);
        if (this.format._options.onSegmentHeader) {
            const { data, start } = this.writer.stopTrackingWrites();
            this.format._options.onSegmentHeader(data, start);
        }
    }
    createCues() {
        this.cues = {
            id: EBMLId.Cues,
            data: []
        };
    }
    get segmentDataOffset() {
        assert(this.segment);
        return this.ebmlWriter.dataOffsets.get(this.segment);
    }
    allTracksAreKnown() {
        for (const track of this.output._tracks){
            if (!track.source._closed && !this.trackDatas.some((x)=>x.track === track)) {
                return false; // We haven't seen a sample from this open track yet
            }
        }
        return true;
    }
    async getMimeType() {
        await this.allTracksKnown.promise;
        const codecStrings = this.trackDatas.map((trackData)=>{
            if (trackData.type === 'video') {
                return trackData.info.decoderConfig.codec;
            } else if (trackData.type === 'audio') {
                return trackData.info.decoderConfig.codec;
            } else {
                const map = {
                    webvtt: 'wvtt'
                };
                return map[trackData.track.source._codec];
            }
        });
        return buildMatroskaMimeType({
            isWebM: this.format instanceof WebMOutputFormat,
            hasVideo: this.trackDatas.some((x)=>x.type === 'video'),
            hasAudio: this.trackDatas.some((x)=>x.type === 'audio'),
            codecStrings
        });
    }
    getVideoTrackData(track, meta) {
        const existingTrackData = this.trackDatas.find((x)=>x.track === track);
        if (existingTrackData) {
            return existingTrackData;
        }
        validateVideoChunkMetadata(meta);
        assert(meta);
        assert(meta.decoderConfig);
        assert(meta.decoderConfig.codedWidth !== undefined);
        assert(meta.decoderConfig.codedHeight !== undefined);
        const newTrackData = {
            track,
            type: 'video',
            info: {
                width: meta.decoderConfig.codedWidth,
                height: meta.decoderConfig.codedHeight,
                decoderConfig: meta.decoderConfig
            },
            chunkQueue: [],
            lastWrittenMsTimestamp: null
        };
        if (track.source._codec === 'vp9') {
            // https://www.webmproject.org/docs/container specifies that VP9 "SHOULD" make use of the CodecPrivate
            // field. Since WebCodecs makes no use of the description field for VP9, we need to derive it ourselves:
            newTrackData.info.decoderConfig = {
                ...newTrackData.info.decoderConfig,
                description: new Uint8Array(generateVp9CodecConfigurationFromCodecString(newTrackData.info.decoderConfig.codec))
            };
        } else if (track.source._codec === 'av1') {
            // Per https://github.com/ietf-wg-cellar/matroska-specification/blob/master/codec/av1.md, AV1 requires
            // CodecPrivate to be set, but WebCodecs makes no use of the description field for AV1. Thus, let's derive
            // it ourselves:
            newTrackData.info.decoderConfig = {
                ...newTrackData.info.decoderConfig,
                description: new Uint8Array(generateAv1CodecConfigurationFromCodecString(newTrackData.info.decoderConfig.codec))
            };
        }
        this.trackDatas.push(newTrackData);
        this.trackDatas.sort((a, b)=>a.track.id - b.track.id);
        if (this.allTracksAreKnown()) {
            this.allTracksKnown.resolve();
        }
        return newTrackData;
    }
    getAudioTrackData(track, meta) {
        const existingTrackData = this.trackDatas.find((x)=>x.track === track);
        if (existingTrackData) {
            return existingTrackData;
        }
        validateAudioChunkMetadata(meta);
        assert(meta);
        assert(meta.decoderConfig);
        const newTrackData = {
            track,
            type: 'audio',
            info: {
                numberOfChannels: meta.decoderConfig.numberOfChannels,
                sampleRate: meta.decoderConfig.sampleRate,
                decoderConfig: meta.decoderConfig
            },
            chunkQueue: [],
            lastWrittenMsTimestamp: null
        };
        this.trackDatas.push(newTrackData);
        this.trackDatas.sort((a, b)=>a.track.id - b.track.id);
        if (this.allTracksAreKnown()) {
            this.allTracksKnown.resolve();
        }
        return newTrackData;
    }
    getSubtitleTrackData(track, meta) {
        const existingTrackData = this.trackDatas.find((x)=>x.track === track);
        if (existingTrackData) {
            return existingTrackData;
        }
        validateSubtitleMetadata(meta);
        assert(meta);
        assert(meta.config);
        const newTrackData = {
            track,
            type: 'subtitle',
            info: {
                config: meta.config
            },
            chunkQueue: [],
            lastWrittenMsTimestamp: null
        };
        this.trackDatas.push(newTrackData);
        this.trackDatas.sort((a, b)=>a.track.id - b.track.id);
        if (this.allTracksAreKnown()) {
            this.allTracksKnown.resolve();
        }
        return newTrackData;
    }
    async addEncodedVideoPacket(track, packet, meta) {
        const release = await this.mutex.acquire();
        try {
            const trackData = this.getVideoTrackData(track, meta);
            const isKeyFrame = packet.type === 'key';
            let timestamp = this.validateAndNormalizeTimestamp(trackData.track, packet.timestamp, isKeyFrame);
            let duration = packet.duration;
            if (track.metadata.frameRate !== undefined) {
                // Constrain the time values to the frame rate
                timestamp = roundToMultiple(timestamp, 1 / track.metadata.frameRate);
                duration = roundToMultiple(duration, 1 / track.metadata.frameRate);
            }
            const videoChunk = this.createInternalChunk(packet.data, timestamp, duration, packet.type);
            if (track.source._codec === 'vp9') this.fixVP9ColorSpace(trackData, videoChunk);
            trackData.chunkQueue.push(videoChunk);
            await this.interleaveChunks();
        } finally{
            release();
        }
    }
    async addEncodedAudioPacket(track, packet, meta) {
        const release = await this.mutex.acquire();
        try {
            const trackData = this.getAudioTrackData(track, meta);
            const isKeyFrame = packet.type === 'key';
            const timestamp = this.validateAndNormalizeTimestamp(trackData.track, packet.timestamp, isKeyFrame);
            const audioChunk = this.createInternalChunk(packet.data, timestamp, packet.duration, packet.type);
            trackData.chunkQueue.push(audioChunk);
            await this.interleaveChunks();
        } finally{
            release();
        }
    }
    async addSubtitleCue(track, cue, meta) {
        const release = await this.mutex.acquire();
        try {
            const trackData = this.getSubtitleTrackData(track, meta);
            const timestamp = this.validateAndNormalizeTimestamp(trackData.track, cue.timestamp, true);
            let bodyText = cue.text;
            const timestampMs = Math.round(timestamp * 1000);
            // Replace in-body timestamps so that they're relative to the cue start time
            inlineTimestampRegex.lastIndex = 0;
            bodyText = bodyText.replace(inlineTimestampRegex, (match)=>{
                const time = parseSubtitleTimestamp(match.slice(1, -1));
                const offsetTime = time - timestampMs;
                return `<${formatSubtitleTimestamp(offsetTime)}>`;
            });
            const body = textEncoder.encode(bodyText);
            const additions = `${cue.settings ?? ''}\n${cue.identifier ?? ''}\n${cue.notes ?? ''}`;
            const subtitleChunk = this.createInternalChunk(body, timestamp, cue.duration, 'key', additions.trim() ? textEncoder.encode(additions) : null);
            trackData.chunkQueue.push(subtitleChunk);
            await this.interleaveChunks();
        } finally{
            release();
        }
    }
    async interleaveChunks(isFinalCall = false) {
        if (!isFinalCall) {
            if (!this.allTracksAreKnown()) {
                return; // We can't interleave yet as we don't yet know how many tracks we'll truly have
            }
        }
        outer: while(true){
            let trackWithMinTimestamp = null;
            let minTimestamp = Infinity;
            for (const trackData of this.trackDatas){
                if (!isFinalCall && trackData.chunkQueue.length === 0 && !trackData.track.source._closed) {
                    break outer;
                }
                if (trackData.chunkQueue.length > 0 && trackData.chunkQueue[0].timestamp < minTimestamp) {
                    trackWithMinTimestamp = trackData;
                    minTimestamp = trackData.chunkQueue[0].timestamp;
                }
            }
            if (!trackWithMinTimestamp) {
                break;
            }
            const chunk = trackWithMinTimestamp.chunkQueue.shift();
            this.writeBlock(trackWithMinTimestamp, chunk);
        }
        if (!isFinalCall) {
            await this.writer.flush();
        }
    }
    /**
     * Due to [a bug in Chromium](https://bugs.chromium.org/p/chromium/issues/detail?id=1377842), VP9 streams often
     * lack color space information. This method patches in that information.
     */ fixVP9ColorSpace(trackData, chunk) {
        // http://downloads.webmproject.org/docs/vp9/vp9-bitstream_superframe-and-uncompressed-header_v1.0.pdf
        if (chunk.type !== 'key') return;
        if (!trackData.info.decoderConfig.colorSpace || !trackData.info.decoderConfig.colorSpace.matrix) return;
        const bitstream = new Bitstream(chunk.data);
        bitstream.skipBits(2);
        const profileLowBit = bitstream.readBits(1);
        const profileHighBit = bitstream.readBits(1);
        const profile = (profileHighBit << 1) + profileLowBit;
        if (profile === 3) bitstream.skipBits(1);
        const showExistingFrame = bitstream.readBits(1);
        if (showExistingFrame) return;
        const frameType = bitstream.readBits(1);
        if (frameType !== 0) return; // Just to be sure
        bitstream.skipBits(2);
        const syncCode = bitstream.readBits(24);
        if (syncCode !== 0x498342) return;
        if (profile >= 2) bitstream.skipBits(1);
        const colorSpaceID = {
            rgb: 7,
            bt709: 2,
            bt470bg: 1,
            smpte170m: 3
        }[trackData.info.decoderConfig.colorSpace.matrix];
        // The bitstream position is now at the start of the color space bits.
        // We can use the global writeBits function here as requested.
        writeBits(chunk.data, bitstream.pos, bitstream.pos + 3, colorSpaceID);
    }
    /** Converts a read-only external chunk into an internal one for easier use. */ createInternalChunk(data, timestamp, duration, type, additions = null) {
        const internalChunk = {
            data,
            type,
            timestamp,
            duration,
            additions
        };
        return internalChunk;
    }
    /** Writes a block containing media data to the file. */ writeBlock(trackData, chunk) {
        // Due to the interlacing algorithm, this code will be run once we've seen one chunk from every media track.
        if (!this.segment) {
            this.createTracks();
            this.createSegment();
        }
        const msTimestamp = Math.round(1000 * chunk.timestamp);
        // We wanna only finalize this cluster (and begin a new one) if we know that each track will be able to
        // start the new one with a key frame.
        const keyFrameQueuedEverywhere = this.trackDatas.every((otherTrackData)=>{
            if (trackData === otherTrackData) {
                return chunk.type === 'key';
            }
            const firstQueuedSample = otherTrackData.chunkQueue[0];
            if (firstQueuedSample) {
                return firstQueuedSample.type === 'key';
            }
            return otherTrackData.track.source._closed;
        });
        let shouldCreateNewCluster = false;
        if (!this.currentCluster) {
            shouldCreateNewCluster = true;
        } else {
            assert(this.currentClusterStartMsTimestamp !== null);
            assert(this.currentClusterMaxMsTimestamp !== null);
            const relativeTimestamp = msTimestamp - this.currentClusterStartMsTimestamp;
            shouldCreateNewCluster = keyFrameQueuedEverywhere && msTimestamp > this.currentClusterMaxMsTimestamp && relativeTimestamp >= 1000 * (this.format._options.minimumClusterDuration ?? 1) || relativeTimestamp > MAX_CLUSTER_TIMESTAMP_MS;
        }
        if (shouldCreateNewCluster) {
            this.createNewCluster(msTimestamp);
        }
        const relativeTimestamp = msTimestamp - this.currentClusterStartMsTimestamp;
        if (relativeTimestamp < MIN_CLUSTER_TIMESTAMP_MS) {
            // The block lies too far in the past, it's not representable within this cluster
            return;
        }
        const prelude = new Uint8Array(4);
        const view = new DataView(prelude.buffer);
        // 0x80 to indicate it's the last byte of a multi-byte number
        view.setUint8(0, 0x80 | trackData.track.id);
        view.setInt16(1, relativeTimestamp, false);
        const msDuration = Math.round(1000 * chunk.duration);
        if (msDuration === 0 && !chunk.additions) {
            // No duration or additions, we can write out a SimpleBlock
            view.setUint8(3, Number(chunk.type === 'key') << 7); // Flags (keyframe flag only present for SimpleBlock)
            const simpleBlock = {
                id: EBMLId.SimpleBlock,
                data: [
                    prelude,
                    chunk.data
                ]
            };
            this.ebmlWriter.writeEBML(simpleBlock);
        } else {
            const blockGroup = {
                id: EBMLId.BlockGroup,
                data: [
                    {
                        id: EBMLId.Block,
                        data: [
                            prelude,
                            chunk.data
                        ]
                    },
                    chunk.type === 'delta' ? {
                        id: EBMLId.ReferenceBlock,
                        data: new EBMLSignedInt(trackData.lastWrittenMsTimestamp - msTimestamp)
                    } : null,
                    chunk.additions ? {
                        id: EBMLId.BlockAdditions,
                        data: [
                            {
                                id: EBMLId.BlockMore,
                                data: [
                                    {
                                        id: EBMLId.BlockAdditional,
                                        data: chunk.additions
                                    },
                                    {
                                        id: EBMLId.BlockAddID,
                                        data: 1
                                    }
                                ]
                            }
                        ]
                    } : null,
                    msDuration > 0 ? {
                        id: EBMLId.BlockDuration,
                        data: msDuration
                    } : null
                ]
            };
            this.ebmlWriter.writeEBML(blockGroup);
        }
        this.duration = Math.max(this.duration, msTimestamp + msDuration);
        trackData.lastWrittenMsTimestamp = msTimestamp;
        if (!this.trackDatasInCurrentCluster.has(trackData)) {
            this.trackDatasInCurrentCluster.set(trackData, {
                firstMsTimestamp: msTimestamp
            });
        }
        this.currentClusterMaxMsTimestamp = Math.max(this.currentClusterMaxMsTimestamp, msTimestamp);
    }
    /** Creates a new Cluster element to contain media chunks. */ createNewCluster(msTimestamp) {
        if (this.currentCluster) {
            this.finalizeCurrentCluster();
        }
        if (this.format._options.onCluster) {
            this.writer.startTrackingWrites();
        }
        this.currentCluster = {
            id: EBMLId.Cluster,
            size: this.format._options.appendOnly ? -1 : CLUSTER_SIZE_BYTES,
            data: [
                {
                    id: EBMLId.Timestamp,
                    data: msTimestamp
                }
            ]
        };
        this.ebmlWriter.writeEBML(this.currentCluster);
        this.currentClusterStartMsTimestamp = msTimestamp;
        this.currentClusterMaxMsTimestamp = msTimestamp;
        this.trackDatasInCurrentCluster.clear();
    }
    finalizeCurrentCluster() {
        assert(this.currentCluster);
        if (!this.format._options.appendOnly) {
            const clusterSize = this.writer.getPos() - this.ebmlWriter.dataOffsets.get(this.currentCluster);
            const endPos = this.writer.getPos();
            // Write the size now that we know it
            this.writer.seek(this.ebmlWriter.offsets.get(this.currentCluster) + 4);
            this.ebmlWriter.writeVarInt(clusterSize, CLUSTER_SIZE_BYTES);
            this.writer.seek(endPos);
        }
        if (this.format._options.onCluster) {
            assert(this.currentClusterStartMsTimestamp !== null);
            const { data, start } = this.writer.stopTrackingWrites();
            this.format._options.onCluster(data, start, this.currentClusterStartMsTimestamp / 1000);
        }
        const clusterOffsetFromSegment = this.ebmlWriter.offsets.get(this.currentCluster) - this.segmentDataOffset;
        // Group tracks by their first timestamp and create a CuePoint for each unique timestamp
        const groupedByTimestamp = new Map();
        for (const [trackData, { firstMsTimestamp }] of this.trackDatasInCurrentCluster){
            if (!groupedByTimestamp.has(firstMsTimestamp)) {
                groupedByTimestamp.set(firstMsTimestamp, []);
            }
            groupedByTimestamp.get(firstMsTimestamp).push(trackData);
        }
        const groupedAndSortedByTimestamp = [
            ...groupedByTimestamp.entries()
        ].sort((a, b)=>a[0] - b[0]);
        // Add CuePoints to the Cues element for better seeking
        for (const [msTimestamp, trackDatas] of groupedAndSortedByTimestamp){
            assert(this.cues);
            this.cues.data.push({
                id: EBMLId.CuePoint,
                data: [
                    {
                        id: EBMLId.CueTime,
                        data: msTimestamp
                    },
                    // Create CueTrackPositions for each track that starts at this timestamp
                    ...trackDatas.map((trackData)=>{
                        return {
                            id: EBMLId.CueTrackPositions,
                            data: [
                                {
                                    id: EBMLId.CueTrack,
                                    data: trackData.track.id
                                },
                                {
                                    id: EBMLId.CueClusterPosition,
                                    data: clusterOffsetFromSegment
                                }
                            ]
                        };
                    })
                ]
            });
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async onTrackClose() {
        const release = await this.mutex.acquire();
        if (this.allTracksAreKnown()) {
            this.allTracksKnown.resolve();
        }
        // Since a track is now closed, we may be able to write out chunks that were previously waiting
        await this.interleaveChunks();
        release();
    }
    /** Finalizes the file, making it ready for use. Must be called after all media chunks have been added. */ async finalize() {
        const release = await this.mutex.acquire();
        this.allTracksKnown.resolve();
        if (!this.segment) {
            this.createTracks();
            this.createSegment();
        }
        // Flush any remaining queued chunks to the file
        await this.interleaveChunks(true);
        if (this.currentCluster) {
            this.finalizeCurrentCluster();
        }
        assert(this.cues);
        this.ebmlWriter.writeEBML(this.cues);
        if (!this.format._options.appendOnly) {
            const endPos = this.writer.getPos();
            // Write the Segment size
            const segmentSize = this.writer.getPos() - this.segmentDataOffset;
            this.writer.seek(this.ebmlWriter.offsets.get(this.segment) + 4);
            this.ebmlWriter.writeVarInt(segmentSize, SEGMENT_SIZE_BYTES);
            // Write the duration of the media to the Segment
            this.segmentDuration.data = new EBMLFloat64(this.duration);
            this.writer.seek(this.ebmlWriter.offsets.get(this.segmentDuration));
            this.ebmlWriter.writeEBML(this.segmentDuration);
            // Fill in SeekHead position data and write it again
            this.seekHead.data[0].data[1].data = this.ebmlWriter.offsets.get(this.cues) - this.segmentDataOffset;
            this.seekHead.data[1].data[1].data = this.ebmlWriter.offsets.get(this.segmentInfo) - this.segmentDataOffset;
            this.seekHead.data[2].data[1].data = this.ebmlWriter.offsets.get(this.tracksElement) - this.segmentDataOffset;
            this.writer.seek(this.ebmlWriter.offsets.get(this.seekHead));
            this.ebmlWriter.writeEBML(this.seekHead);
            this.writer.seek(endPos);
        }
        release();
    }
}

/*!
 * Copyright (c) 2025-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */ const FRAME_HEADER_SIZE = 4;
// These are in kbps:
const MPEG_V1_BITRATES = {
    // Layer 3
    1: [
        -1,
        32,
        40,
        48,
        56,
        64,
        80,
        96,
        112,
        128,
        160,
        192,
        224,
        256,
        320,
        -1
    ],
    // Layer 2
    2: [
        -1,
        32,
        48,
        56,
        64,
        80,
        96,
        112,
        128,
        160,
        192,
        224,
        256,
        320,
        384,
        -1
    ],
    // Layer 1
    3: [
        -1,
        32,
        64,
        96,
        128,
        160,
        192,
        224,
        256,
        288,
        320,
        352,
        384,
        416,
        448,
        -1
    ]
};
const MPEG_V2_BITRATES = {
    // Layer 3
    1: [
        -1,
        32,
        48,
        56,
        64,
        80,
        96,
        112,
        128,
        144,
        160,
        176,
        192,
        224,
        256,
        -1
    ],
    // Layer 2
    2: [
        -1,
        8,
        16,
        24,
        32,
        40,
        48,
        56,
        64,
        80,
        96,
        112,
        128,
        144,
        160,
        -1
    ],
    // Layer 1
    3: [
        -1,
        8,
        16,
        24,
        32,
        40,
        48,
        56,
        64,
        80,
        96,
        112,
        128,
        144,
        160,
        -1
    ]
};
const SAMPLING_RATES = {
    // MPEG Version 2.5
    0: [
        11025,
        12000,
        8000,
        -1
    ],
    // MPEG Version 2 (ISO/IEC 13818-3)
    2: [
        22050,
        24000,
        16000,
        -1
    ],
    // MPEG Version 1 (ISO/IEC 11172-3)
    3: [
        44100,
        48000,
        32000,
        -1
    ]
};
/** 'Xing' */ const XING = 0x58696e67;
/** 'Info' */ const INFO = 0x496e666f;
const computeMp3FrameSize = (layer, bitrate, sampleRate, padding)=>{
    if (layer === 3) {
        // Layer 1
        return Math.floor((12 * bitrate / sampleRate + padding) * 4);
    } else {
        return Math.floor(144 * bitrate / sampleRate + padding);
    }
};
const getXingOffset = (mpegVersionId, channel)=>{
    return mpegVersionId === 3 ? channel === 3 ? 21 : 36 : channel === 3 ? 13 : 21;
};
const readFrameHeader = (word, reader)=>{
    const startPos = reader.pos;
    const firstByte = word >>> 24;
    const secondByte = word >>> 16 & 0xff;
    const thirdByte = word >>> 8 & 0xff;
    const fourthByte = word & 0xff;
    if (firstByte !== 0xff && secondByte !== 0xff && thirdByte !== 0xff && fourthByte !== 0xff) {
        reader.pos += 4;
        return null;
    }
    reader.pos += 1;
    if (firstByte !== 0xff) {
        return null;
    }
    if ((secondByte & 0xe0) !== 0xe0) {
        return null;
    }
    const mpegVersionId = secondByte >> 3 & 0x3;
    const layer = secondByte >> 1 & 0x3;
    const bitrateIndex = thirdByte >> 4 & 0xf;
    const frequencyIndex = thirdByte >> 2 & 0x3;
    const padding = thirdByte >> 1 & 0x1;
    const channel = fourthByte >> 6 & 0x3;
    const modeExtension = fourthByte >> 4 & 0x3;
    const copyright = fourthByte >> 3 & 0x1;
    const original = fourthByte >> 2 & 0x1;
    const emphasis = fourthByte & 0x3;
    const kilobitRate = mpegVersionId === 3 ? MPEG_V1_BITRATES[layer]?.[bitrateIndex] : MPEG_V2_BITRATES[layer]?.[bitrateIndex];
    if (!kilobitRate || kilobitRate === -1) {
        return null;
    }
    const bitrate = kilobitRate * 1000;
    const sampleRate = SAMPLING_RATES[mpegVersionId]?.[frequencyIndex];
    if (!sampleRate || sampleRate === -1) {
        return null;
    }
    const frameLength = computeMp3FrameSize(layer, bitrate, sampleRate, padding);
    if (reader.fileSize !== null && reader.fileSize - startPos < frameLength) {
        // The frame doesn't fit into the rest of the file
        return null;
    }
    let audioSamplesInFrame;
    if (mpegVersionId === 3) {
        audioSamplesInFrame = layer === 3 ? 384 : 1152;
    } else {
        if (layer === 3) {
            audioSamplesInFrame = 384;
        } else if (layer === 2) {
            audioSamplesInFrame = 1152;
        } else {
            audioSamplesInFrame = 576;
        }
    }
    return {
        startPos: startPos,
        totalSize: frameLength,
        mpegVersionId,
        layer,
        bitrate,
        frequencyIndex,
        sampleRate,
        channel,
        modeExtension,
        copyright,
        original,
        emphasis,
        audioSamplesInFrame
    };
};

class Mp3Writer {
    constructor(writer){
        this.writer = writer;
        this.helper = new Uint8Array(8);
        this.helperView = new DataView(this.helper.buffer);
    }
    writeU32(value) {
        this.helperView.setUint32(0, value, false);
        this.writer.write(this.helper.subarray(0, 4));
    }
    writeXingFrame(data) {
        const startPos = this.writer.getPos();
        const firstByte = 0xff;
        const secondByte = 0xe0 | data.mpegVersionId << 3 | data.layer << 1;
        const bitrateGroup = data.mpegVersionId === 3 ? MPEG_V1_BITRATES : MPEG_V2_BITRATES;
        const bitrates = bitrateGroup?.[data.layer];
        if (!bitrates) {
            throw new Error('Invalid MPEG version and layer combination.');
        }
        const sampleRate = SAMPLING_RATES[data.mpegVersionId]?.[data.frequencyIndex];
        if (!sampleRate || sampleRate === -1) {
            throw new Error('Invalid MPEG version and frequency index combination.');
        }
        const padding = 0;
        const neededBytes = 155;
        // Let's find the lowest bitrate for which the frame size is sufficiently large to fit all the data
        const bitrateIndex = bitrates.findIndex((kbr)=>{
            return computeMp3FrameSize(data.layer, 1000 * kbr, sampleRate, padding) >= neededBytes;
        });
        if (bitrateIndex === -1) {
            throw new Error('No suitable bitrate found.');
        }
        const thirdByte = bitrateIndex << 4 | data.frequencyIndex << 2 | padding << 1;
        const fourthByte = data.channel << 6 | data.modeExtension << 4 | data.copyright << 3 | data.original << 2 | data.emphasis;
        this.helper[0] = firstByte;
        this.helper[1] = secondByte;
        this.helper[2] = thirdByte;
        this.helper[3] = fourthByte;
        this.writer.write(this.helper.subarray(0, 4));
        const xingOffset = getXingOffset(data.mpegVersionId, data.channel);
        this.writer.seek(startPos + xingOffset);
        this.writeU32(XING);
        let flags = 0;
        if (data.frameCount !== null) {
            flags |= 1;
        }
        if (data.fileSize !== null) {
            flags |= 2;
        }
        if (data.toc !== null) {
            flags |= 4;
        }
        this.writeU32(flags);
        this.writeU32(data.frameCount ?? 0);
        this.writeU32(data.fileSize ?? 0);
        this.writer.write(data.toc ?? new Uint8Array(100));
        const frameSize = computeMp3FrameSize(data.layer, 1000 * bitrates[bitrateIndex], sampleRate, padding);
        this.writer.seek(startPos + frameSize);
    }
}

class Mp3Muxer extends Muxer {
    constructor(output, format){
        super(output);
        this.xingFrameData = null;
        this.frameCount = 0;
        this.framePositions = [];
        this.format = format;
        this.writer = output._writer;
        this.mp3Writer = new Mp3Writer(output._writer);
    }
    async start() {
    // Nothing needed here
    }
    async getMimeType() {
        return 'audio/mpeg';
    }
    async addEncodedVideoPacket() {
        throw new Error('MP3 does not support video.');
    }
    async addEncodedAudioPacket(track, packet) {
        const release = await this.mutex.acquire();
        try {
            if (!this.xingFrameData) {
                const view = toDataView(packet.data);
                if (view.byteLength < 4) {
                    throw new Error('Invalid MP3 header in sample.');
                }
                const word = view.getUint32(0, false);
                const header = readFrameHeader(word, {
                    pos: 0,
                    fileSize: null
                });
                if (!header) {
                    throw new Error('Invalid MP3 header in sample.');
                }
                const xingOffset = getXingOffset(header.mpegVersionId, header.channel);
                if (view.byteLength >= xingOffset + 4) {
                    const word = view.getUint32(xingOffset, false);
                    const isXing = word === XING || word === INFO;
                    if (isXing) {
                        // This is not a data frame, so let's completely ignore this sample
                        return;
                    }
                }
                this.xingFrameData = {
                    mpegVersionId: header.mpegVersionId,
                    layer: header.layer,
                    frequencyIndex: header.frequencyIndex,
                    channel: header.channel,
                    modeExtension: header.modeExtension,
                    copyright: header.copyright,
                    original: header.original,
                    emphasis: header.emphasis,
                    frameCount: null,
                    fileSize: null,
                    toc: null
                };
                // Write a Xing frame because this muxer doesn't make any bitrate constraints, meaning we don't know if
                // this will be a constant or variable bitrate file. Therefore, always write the Xing frame.
                this.mp3Writer.writeXingFrame(this.xingFrameData);
                this.frameCount++;
            }
            this.validateAndNormalizeTimestamp(track, packet.timestamp, packet.type === 'key');
            this.framePositions.push(this.writer.getPos());
            this.writer.write(packet.data);
            this.frameCount++;
            await this.writer.flush();
        } finally{
            release();
        }
    }
    async addSubtitleCue() {
        throw new Error('MP3 does not support subtitles.');
    }
    async finalize() {
        if (!this.xingFrameData) {
            return;
        }
        const release = await this.mutex.acquire();
        const endPos = this.writer.getPos();
        this.writer.seek(0);
        const toc = new Uint8Array(100);
        for(let i = 0; i < 100; i++){
            const index = Math.floor(this.framePositions.length * (i / 100));
            assert(index !== -1 && index < this.framePositions.length);
            const byteOffset = this.framePositions[index];
            toc[i] = 256 * (byteOffset / endPos);
        }
        this.xingFrameData.frameCount = this.frameCount;
        this.xingFrameData.fileSize = endPos;
        this.xingFrameData.toc = toc;
        if (this.format._options.onXingFrame) {
            this.writer.startTrackingWrites();
        }
        this.mp3Writer.writeXingFrame(this.xingFrameData);
        if (this.format._options.onXingFrame) {
            const { data, start } = this.writer.stopTrackingWrites();
            this.format._options.onXingFrame(data, start);
        }
        this.writer.seek(endPos);
        release();
    }
}

const OGGS = 0x5367674f; // 'OggS'
const OGG_CRC_POLYNOMIAL = 0x04c11db7;
const OGG_CRC_TABLE = new Uint32Array(256);
for(let n = 0; n < 256; n++){
    let crc = n << 24;
    for(let k = 0; k < 8; k++){
        crc = crc & 0x80000000 ? crc << 1 ^ OGG_CRC_POLYNOMIAL : crc << 1;
    }
    OGG_CRC_TABLE[n] = crc >>> 0 & 0xffffffff;
}
const computeOggPageCrc = (bytes)=>{
    const view = toDataView(bytes);
    const originalChecksum = view.getUint32(22, true);
    view.setUint32(22, 0, true); // Zero out checksum field
    let crc = 0;
    for(let i = 0; i < bytes.length; i++){
        const byte = bytes[i];
        crc = (crc << 8 ^ OGG_CRC_TABLE[crc >>> 24 ^ byte]) >>> 0;
    }
    view.setUint32(22, originalChecksum, true); // Restore checksum field
    return crc;
};
const extractSampleMetadata = (data, codecInfo, vorbisLastBlocksize)=>{
    let durationInSamples = 0;
    let currentBlocksize = null;
    if (data.length > 0) {
        // To know sample duration, we'll need to peak inside the packet
        if (codecInfo.codec === 'vorbis') {
            assert(codecInfo.vorbisInfo);
            const vorbisModeCount = codecInfo.vorbisInfo.modeBlockflags.length;
            const bitCount = ilog(vorbisModeCount - 1);
            const modeMask = (1 << bitCount) - 1 << 1;
            const modeNumber = (data[0] & modeMask) >> 1;
            if (modeNumber >= codecInfo.vorbisInfo.modeBlockflags.length) {
                throw new Error('Invalid mode number.');
            }
            // In Vorbis, packet duration also depends on the blocksize of the previous packet
            let prevBlocksize = vorbisLastBlocksize;
            const blockflag = codecInfo.vorbisInfo.modeBlockflags[modeNumber];
            currentBlocksize = codecInfo.vorbisInfo.blocksizes[blockflag];
            if (blockflag === 1) {
                const prevMask = (modeMask | 0x1) + 1;
                const flag = data[0] & prevMask ? 1 : 0;
                prevBlocksize = codecInfo.vorbisInfo.blocksizes[flag];
            }
            durationInSamples = prevBlocksize !== null ? prevBlocksize + currentBlocksize >> 2 : 0; // The first sample outputs no audio data and therefore has a duration of 0
        } else if (codecInfo.codec === 'opus') {
            const toc = parseOpusTocByte(data);
            durationInSamples = toc.durationInSamples;
        }
    }
    return {
        durationInSamples,
        vorbisBlockSize: currentBlocksize
    };
};
const buildOggMimeType = (info)=>{
    let string = 'audio/ogg';
    if (info.codecStrings) {
        const uniqueCodecMimeTypes = [
            ...new Set(info.codecStrings)
        ];
        string += `; codecs="${uniqueCodecMimeTypes.join(', ')}"`;
    }
    return string;
};

const MIN_PAGE_HEADER_SIZE = 27;
const MAX_PAGE_HEADER_SIZE = 27 + 255;
const MAX_PAGE_SIZE = MAX_PAGE_HEADER_SIZE + 255 * 255;
class OggReader {
    constructor(reader){
        this.reader = reader;
        this.pos = 0;
    }
    readBytes(length) {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + length);
        this.pos += length;
        return new Uint8Array(view.buffer, offset, length);
    }
    readU8() {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + 1);
        this.pos += 1;
        return view.getUint8(offset);
    }
    readU32() {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + 4);
        this.pos += 4;
        return view.getUint32(offset, true);
    }
    readI32() {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + 4);
        this.pos += 4;
        return view.getInt32(offset, true);
    }
    readI64() {
        const low = this.readU32();
        const high = this.readI32();
        return high * 0x100000000 + low;
    }
    readAscii(length) {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + length);
        this.pos += length;
        let str = '';
        for(let i = 0; i < length; i++){
            str += String.fromCharCode(view.getUint8(offset + i));
        }
        return str;
    }
    readPageHeader() {
        const startPos = this.pos;
        const capturePattern = this.readU32();
        if (capturePattern !== OGGS) {
            return null;
        }
        this.pos += 1; // Version
        const headerType = this.readU8();
        const granulePosition = this.readI64();
        const serialNumber = this.readU32();
        const sequenceNumber = this.readU32();
        const checksum = this.readU32();
        const numberPageSegments = this.readU8();
        const lacingValues = new Uint8Array(numberPageSegments);
        for(let i = 0; i < numberPageSegments; i++){
            lacingValues[i] = this.readU8();
        }
        const headerSize = 27 + numberPageSegments;
        const dataSize = lacingValues.reduce((a, b)=>a + b, 0);
        const totalSize = headerSize + dataSize;
        return {
            headerStartPos: startPos,
            totalSize,
            dataStartPos: startPos + headerSize,
            dataSize,
            headerType,
            granulePosition,
            serialNumber,
            sequenceNumber,
            checksum,
            lacingValues
        };
    }
    findNextPageHeader(until) {
        while(this.pos < until - (4 - 1)){
            const word = this.readU32();
            const firstByte = word & 0xff;
            const secondByte = word >>> 8 & 0xff;
            const thirdByte = word >>> 16 & 0xff;
            const fourthByte = word >>> 24 & 0xff;
            const O = 0x4f; // 'O'
            if (firstByte !== O && secondByte !== O && thirdByte !== O && fourthByte !== O) {
                continue;
            }
            this.pos -= 4;
            if (word === OGGS) {
                // We have found the capture pattern
                return true;
            }
            this.pos += 1;
        }
        return false;
    }
}

const PAGE_SIZE_TARGET = 8192;
class OggMuxer extends Muxer {
    constructor(output, format){
        super(output);
        this.trackDatas = [];
        this.bosPagesWritten = false;
        this.allTracksKnown = promiseWithResolvers();
        this.pageBytes = new Uint8Array(MAX_PAGE_SIZE);
        this.pageView = new DataView(this.pageBytes.buffer);
        this.format = format;
        this.writer = output._writer;
        this.writer.ensureMonotonicity = true; // Ogg is always monotonically written!
    }
    async start() {
    // Nothin'
    }
    async getMimeType() {
        await this.allTracksKnown.promise;
        return buildOggMimeType({
            codecStrings: this.trackDatas.map((x)=>x.codecInfo.codec)
        });
    }
    addEncodedVideoPacket() {
        throw new Error('Video tracks are not supported.');
    }
    getTrackData(track, meta) {
        const existingTrackData = this.trackDatas.find((td)=>td.track === track);
        if (existingTrackData) {
            return existingTrackData;
        }
        // Give the track a unique random serial number
        let serialNumber;
        do {
            serialNumber = Math.floor(2 ** 32 * Math.random());
        }while (this.trackDatas.some((td)=>td.serialNumber === serialNumber));
        assert(track.source._codec === 'vorbis' || track.source._codec === 'opus');
        validateAudioChunkMetadata(meta);
        assert(meta);
        assert(meta.decoderConfig);
        const newTrackData = {
            track,
            serialNumber,
            internalSampleRate: track.source._codec === 'opus' ? OPUS_INTERNAL_SAMPLE_RATE : meta.decoderConfig.sampleRate,
            codecInfo: {
                codec: track.source._codec,
                vorbisInfo: null,
                opusInfo: null
            },
            vorbisLastBlocksize: null,
            packetQueue: [],
            currentTimestampInSamples: 0,
            pagesWritten: 0,
            currentGranulePosition: 0,
            currentLacingValues: [],
            currentPageData: [],
            currentPageSize: 27,
            currentPageStartsWithFreshPacket: true
        };
        this.queueHeaderPackets(newTrackData, meta);
        this.trackDatas.push(newTrackData);
        if (this.allTracksAreKnown()) {
            this.allTracksKnown.resolve();
        }
        return newTrackData;
    }
    queueHeaderPackets(trackData, meta) {
        assert(meta.decoderConfig);
        if (trackData.track.source._codec === 'vorbis') {
            assert(meta.decoderConfig.description);
            const bytes = toUint8Array(meta.decoderConfig.description);
            if (bytes[0] !== 2) {
                throw new TypeError('First byte of Vorbis decoder description must be 2.');
            }
            let pos = 1;
            const readPacketLength = ()=>{
                let length = 0;
                while(true){
                    const value = bytes[pos++];
                    if (value === undefined) {
                        throw new TypeError('Vorbis decoder description is too short.');
                    }
                    length += value;
                    if (value < 255) {
                        return length;
                    }
                }
            };
            const identificationHeaderLength = readPacketLength();
            const commentHeaderLength = readPacketLength();
            const setupHeaderLength = bytes.length - pos; // Setup header fills the remaining bytes
            if (setupHeaderLength <= 0) {
                throw new TypeError('Vorbis decoder description is too short.');
            }
            const identificationHeader = bytes.subarray(pos, pos += identificationHeaderLength);
            const commentHeader = bytes.subarray(pos, pos += commentHeaderLength);
            const setupHeader = bytes.subarray(pos);
            trackData.packetQueue.push({
                data: identificationHeader,
                endGranulePosition: 0,
                timestamp: 0,
                forcePageFlush: true
            }, {
                data: commentHeader,
                endGranulePosition: 0,
                timestamp: 0,
                forcePageFlush: false
            }, {
                data: setupHeader,
                endGranulePosition: 0,
                timestamp: 0,
                forcePageFlush: true
            });
            const view = toDataView(identificationHeader);
            const blockSizeByte = view.getUint8(28);
            trackData.codecInfo.vorbisInfo = {
                blocksizes: [
                    1 << (blockSizeByte & 0xf),
                    1 << (blockSizeByte >> 4)
                ],
                modeBlockflags: parseModesFromVorbisSetupPacket(setupHeader).modeBlockflags
            };
        } else if (trackData.track.source._codec === 'opus') {
            if (!meta.decoderConfig.description) {
                throw new TypeError('For Ogg, Opus decoder description is required.');
            }
            const identificationHeader = toUint8Array(meta.decoderConfig.description);
            const commentHeader = new Uint8Array(8 + 4 + 4);
            const view = new DataView(commentHeader.buffer);
            view.setUint32(0, 0x4f707573, false); // 'Opus'
            view.setUint32(4, 0x54616773, false); // 'Tags'
            view.setUint32(8, 0, true); // Vendor String Length
            view.setUint32(12, 0, true); // User Comment List Length
            trackData.packetQueue.push({
                data: identificationHeader,
                endGranulePosition: 0,
                timestamp: 0,
                forcePageFlush: true
            }, {
                data: commentHeader,
                endGranulePosition: 0,
                timestamp: 0,
                forcePageFlush: true
            });
            trackData.codecInfo.opusInfo = {
                preSkip: parseOpusIdentificationHeader(identificationHeader).preSkip
            };
        }
    }
    async addEncodedAudioPacket(track, packet, meta) {
        const release = await this.mutex.acquire();
        try {
            const trackData = this.getTrackData(track, meta);
            this.validateAndNormalizeTimestamp(trackData.track, packet.timestamp, packet.type === 'key');
            const currentTimestampInSamples = trackData.currentTimestampInSamples;
            const { durationInSamples, vorbisBlockSize } = extractSampleMetadata(packet.data, trackData.codecInfo, trackData.vorbisLastBlocksize);
            trackData.currentTimestampInSamples += durationInSamples;
            trackData.vorbisLastBlocksize = vorbisBlockSize;
            trackData.packetQueue.push({
                data: packet.data,
                endGranulePosition: trackData.currentTimestampInSamples,
                timestamp: currentTimestampInSamples / trackData.internalSampleRate,
                forcePageFlush: false
            });
            await this.interleavePages();
        } finally{
            release();
        }
    }
    addSubtitleCue() {
        throw new Error('Subtitle tracks are not supported.');
    }
    allTracksAreKnown() {
        for (const track of this.output._tracks){
            if (!track.source._closed && !this.trackDatas.some((x)=>x.track === track)) {
                return false; // We haven't seen a sample from this open track yet
            }
        }
        return true;
    }
    async interleavePages(isFinalCall = false) {
        if (!this.bosPagesWritten) {
            if (!this.allTracksAreKnown()) {
                return; // We can't interleave yet as we don't yet know how many tracks we'll truly have
            }
            // Write the header page for all bitstreams
            for (const trackData of this.trackDatas){
                while(trackData.packetQueue.length > 0){
                    const packet = trackData.packetQueue.shift();
                    this.writePacket(trackData, packet, false);
                    if (packet.forcePageFlush) {
                        break;
                    }
                }
            }
            this.bosPagesWritten = true;
        }
        outer: while(true){
            let trackWithMinTimestamp = null;
            let minTimestamp = Infinity;
            for (const trackData of this.trackDatas){
                if (!isFinalCall && trackData.packetQueue.length <= 1 // Limit is 1, not 0, for correct EOS flag logic
                 && !trackData.track.source._closed) {
                    break outer;
                }
                if (trackData.packetQueue.length > 0 && trackData.packetQueue[0].timestamp < minTimestamp) {
                    trackWithMinTimestamp = trackData;
                    minTimestamp = trackData.packetQueue[0].timestamp;
                }
            }
            if (!trackWithMinTimestamp) {
                break;
            }
            const packet = trackWithMinTimestamp.packetQueue.shift();
            const isFinalPacket = trackWithMinTimestamp.packetQueue.length === 0;
            this.writePacket(trackWithMinTimestamp, packet, isFinalPacket);
        }
        if (!isFinalCall) {
            await this.writer.flush();
        }
    }
    writePacket(trackData, packet, isFinalPacket) {
        let remainingLength = packet.data.length;
        let dataStartOffset = 0;
        let dataOffset = 0;
        while(true){
            if (trackData.currentLacingValues.length === 0 && dataStartOffset > 0) {
                // This is a packet spanning multiple pages
                trackData.currentPageStartsWithFreshPacket = false;
            }
            const segmentSize = Math.min(255, remainingLength);
            trackData.currentLacingValues.push(segmentSize);
            trackData.currentPageSize++;
            dataOffset += segmentSize;
            const segmentIsLastOfPacket = remainingLength < 255;
            if (trackData.currentLacingValues.length === 255) {
                // The page is full, we need to add part of the packet data and then flush the page
                const slice = packet.data.subarray(dataStartOffset, dataOffset);
                dataStartOffset = dataOffset;
                trackData.currentPageData.push(slice);
                trackData.currentPageSize += slice.length;
                this.writePage(trackData, isFinalPacket && segmentIsLastOfPacket);
                if (segmentIsLastOfPacket) {
                    return;
                }
            }
            if (segmentIsLastOfPacket) {
                break;
            }
            remainingLength -= 255;
        }
        const slice = packet.data.subarray(dataStartOffset);
        trackData.currentPageData.push(slice);
        trackData.currentPageSize += slice.length;
        trackData.currentGranulePosition = packet.endGranulePosition;
        if (trackData.currentPageSize >= PAGE_SIZE_TARGET || packet.forcePageFlush) {
            this.writePage(trackData, isFinalPacket);
        }
    }
    writePage(trackData, isEos) {
        this.pageView.setUint32(0, OGGS, true); // Capture pattern
        this.pageView.setUint8(4, 0); // Version
        let headerType = 0;
        if (!trackData.currentPageStartsWithFreshPacket) {
            headerType |= 1;
        }
        if (trackData.pagesWritten === 0) {
            headerType |= 2; // Beginning of stream
        }
        if (isEos) {
            headerType |= 4; // End of stream
        }
        this.pageView.setUint8(5, headerType); // Header type
        const granulePosition = trackData.currentLacingValues.every((x)=>x === 255) ? -1 // No packets end on this page
         : trackData.currentGranulePosition;
        setInt64(this.pageView, 6, granulePosition); // Granule position
        this.pageView.setUint32(14, trackData.serialNumber, true); // Serial number
        this.pageView.setUint32(18, trackData.pagesWritten, true); // Page sequence number
        this.pageView.setUint32(22, 0, true); // Checksum placeholder
        this.pageView.setUint8(26, trackData.currentLacingValues.length); // Number of page segments
        this.pageBytes.set(trackData.currentLacingValues, 27);
        let pos = 27 + trackData.currentLacingValues.length;
        for (const data of trackData.currentPageData){
            this.pageBytes.set(data, pos);
            pos += data.length;
        }
        const slice = this.pageBytes.subarray(0, pos);
        const crc = computeOggPageCrc(slice);
        this.pageView.setUint32(22, crc, true); // Checksum
        trackData.pagesWritten++;
        trackData.currentLacingValues.length = 0;
        trackData.currentPageData.length = 0;
        trackData.currentPageSize = 27;
        trackData.currentPageStartsWithFreshPacket = true;
        if (this.format._options.onPage) {
            this.writer.startTrackingWrites();
        }
        this.writer.write(slice);
        if (this.format._options.onPage) {
            const { data, start } = this.writer.stopTrackingWrites();
            this.format._options.onPage(data, start, trackData.track.source);
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async onTrackClose() {
        const release = await this.mutex.acquire();
        if (this.allTracksAreKnown()) {
            this.allTracksKnown.resolve();
        }
        // Since a track is now closed, we may be able to write out chunks that were previously waiting
        await this.interleavePages();
        release();
    }
    async finalize() {
        const release = await this.mutex.acquire();
        this.allTracksKnown.resolve();
        await this.interleavePages(true);
        for (const trackData of this.trackDatas){
            if (trackData.currentLacingValues.length > 0) {
                this.writePage(trackData, true);
            }
        }
        release();
    }
}

/*!
 * Copyright (c) 2025-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */ class Demuxer {
    constructor(input){
        this.input = input;
    }
}

const PLACEHOLDER_DATA = new Uint8Array(0);
/**
 * Represents an encoded chunk of media. Mainly used as an expressive wrapper around WebCodecs API's EncodedVideoChunk
 * and EncodedAudioChunk, but can also be used standalone.
 * @public
 */ class EncodedPacket {
    constructor(/** The encoded data of this packet. */ data, /** The type of this packet. */ type, /**
     * The presentation timestamp of this packet in seconds. May be negative. Samples with negative end timestamps
     * should not be presented.
     */ timestamp, /** The duration of this packet in seconds. */ duration, /**
     * The sequence number indicates the decode order of the packets. Packet A  must be decoded before packet B if A
     * has a lower sequence number than B. If two packets have the same sequence number, they are the same packet.
     * Otherwise, sequence numbers are arbitrary and are not guaranteed to have any meaning besides their relative
     * ordering. Negative sequence numbers mean the sequence number is undefined.
     */ sequenceNumber = -1, byteLength){
        this.data = data;
        this.type = type;
        this.timestamp = timestamp;
        this.duration = duration;
        this.sequenceNumber = sequenceNumber;
        if (data === PLACEHOLDER_DATA && byteLength === undefined) {
            throw new Error('Internal error: byteLength must be explicitly provided when constructing metadata-only packets.');
        }
        if (byteLength === undefined) {
            byteLength = data.byteLength;
        }
        if (!(data instanceof Uint8Array)) {
            throw new TypeError('data must be a Uint8Array.');
        }
        if (type !== 'key' && type !== 'delta') {
            throw new TypeError('type must be either "key" or "delta".');
        }
        if (!Number.isFinite(timestamp)) {
            throw new TypeError('timestamp must be a number.');
        }
        if (!Number.isFinite(duration) || duration < 0) {
            throw new TypeError('duration must be a non-negative number.');
        }
        if (!Number.isFinite(sequenceNumber)) {
            throw new TypeError('sequenceNumber must be a number.');
        }
        if (!Number.isInteger(byteLength) || byteLength < 0) {
            throw new TypeError('byteLength must be a non-negative integer.');
        }
        this.byteLength = byteLength;
    }
    /** If this packet is a metadata-only packet. Metadata-only packets don't contain their packet data. */ get isMetadataOnly() {
        return this.data === PLACEHOLDER_DATA;
    }
    /** The timestamp of this packet in microseconds. */ get microsecondTimestamp() {
        return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.timestamp);
    }
    /** The duration of this packet in microseconds. */ get microsecondDuration() {
        return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.duration);
    }
    /** Converts this packet to an EncodedVideoChunk for use with the WebCodecs API. */ toEncodedVideoChunk() {
        if (this.isMetadataOnly) {
            throw new TypeError('Metadata-only packets cannot be converted to a video chunk.');
        }
        if (typeof EncodedVideoChunk === 'undefined') {
            throw new Error('Your browser does not support EncodedVideoChunk.');
        }
        return new EncodedVideoChunk({
            data: this.data,
            type: this.type,
            timestamp: this.microsecondTimestamp,
            duration: this.microsecondDuration
        });
    }
    /** Converts this packet to an EncodedAudioChunk for use with the WebCodecs API. */ toEncodedAudioChunk() {
        if (this.isMetadataOnly) {
            throw new TypeError('Metadata-only packets cannot be converted to an audio chunk.');
        }
        if (typeof EncodedAudioChunk === 'undefined') {
            throw new Error('Your browser does not support EncodedAudioChunk.');
        }
        return new EncodedAudioChunk({
            data: this.data,
            type: this.type,
            timestamp: this.microsecondTimestamp,
            duration: this.microsecondDuration
        });
    }
    /**
     * Creates an EncodedPacket from an EncodedVideoChunk or EncodedAudioChunk. This method is useful for converting
     * chunks from the WebCodecs API to EncodedPackets.
     */ static fromEncodedChunk(chunk) {
        if (!(chunk instanceof EncodedVideoChunk || chunk instanceof EncodedAudioChunk)) {
            throw new TypeError('chunk must be an EncodedVideoChunk or EncodedAudioChunk.');
        }
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        return new EncodedPacket(data, chunk.type, chunk.timestamp / 1e6, (chunk.duration ?? 0) / 1e6);
    }
    /** Clones this packet while optionally updating timing information. */ clone(options) {
        if (options !== undefined && (typeof options !== 'object' || options === null)) {
            throw new TypeError('options, when provided, must be an object.');
        }
        if (options?.timestamp !== undefined && !Number.isFinite(options.timestamp)) {
            throw new TypeError('options.timestamp, when provided, must be a number.');
        }
        if (options?.duration !== undefined && !Number.isFinite(options.duration)) {
            throw new TypeError('options.duration, when provided, must be a number.');
        }
        return new EncodedPacket(this.data, this.type, options?.timestamp ?? this.timestamp, options?.duration ?? this.duration, this.sequenceNumber, this.byteLength);
    }
}

/*!
 * Copyright (c) 2025-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */ // https://github.com/dystopiancode/pcm-g711/blob/master/pcm-g711/g711.c
const toUlaw = (s16)=>{
    const MULAW_MAX = 0x1FFF;
    const MULAW_BIAS = 33;
    let number = s16;
    let mask = 0x1000;
    let sign = 0;
    let position = 12;
    let lsb = 0;
    if (number < 0) {
        number = -number;
        sign = 0x80;
    }
    number += MULAW_BIAS;
    if (number > MULAW_MAX) {
        number = MULAW_MAX;
    }
    while((number & mask) !== mask && position >= 5){
        mask >>= 1;
        position--;
    }
    lsb = number >> position - 4 & 0x0f;
    return ~(sign | position - 5 << 4 | lsb) & 0xFF;
};
const fromUlaw = (u8)=>{
    const MULAW_BIAS = 33;
    let sign = 0;
    let position = 0;
    let number = ~u8;
    if (number & 0x80) {
        number &= -129;
        sign = -1;
    }
    position = ((number & 0xF0) >> 4) + 5;
    const decoded = (1 << position | (number & 0x0F) << position - 4 | 1 << position - 5) - MULAW_BIAS;
    return sign === 0 ? decoded : -decoded;
};
const toAlaw = (s16)=>{
    const ALAW_MAX = 0xFFF;
    let mask = 0x800;
    let sign = 0;
    let position = 11;
    let lsb = 0;
    let number = s16;
    if (number < 0) {
        number = -number;
        sign = 0x80;
    }
    if (number > ALAW_MAX) {
        number = ALAW_MAX;
    }
    while((number & mask) !== mask && position >= 5){
        mask >>= 1;
        position--;
    }
    lsb = number >> (position === 4 ? 1 : position - 4) & 0x0f;
    return (sign | position - 4 << 4 | lsb) ^ 0x55;
};
const fromAlaw = (u8)=>{
    let sign = 0x00;
    let position = 0;
    let number = u8 ^ 0x55;
    if (number & 0x80) {
        number &= -129;
        sign = -1;
    }
    position = ((number & 0xF0) >> 4) + 4;
    let decoded = 0;
    if (position !== 4) {
        decoded = 1 << position | (number & 0x0F) << position - 4 | 1 << position - 5;
    } else {
        decoded = number << 1 | 1;
    }
    return sign === 0 ? decoded : -decoded;
};

/**
 * Represents a raw, unencoded video sample (frame). Mainly used as an expressive wrapper around WebCodecs API's
 * VideoFrame, but can also be used standalone.
 * @public
 */ class VideoSample {
    /** The width of the frame in pixels after rotation. */ get displayWidth() {
        return this.rotation % 180 === 0 ? this.codedWidth : this.codedHeight;
    }
    /** The height of the frame in pixels after rotation. */ get displayHeight() {
        return this.rotation % 180 === 0 ? this.codedHeight : this.codedWidth;
    }
    /** The presentation timestamp of the frame in microseconds. */ get microsecondTimestamp() {
        return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.timestamp);
    }
    /** The duration of the frame in microseconds. */ get microsecondDuration() {
        return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.duration);
    }
    constructor(data, init){
        /** @internal */ this._closed = false;
        if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
            if (!init || typeof init !== 'object') {
                throw new TypeError('init must be an object.');
            }
            if (!('format' in init) || typeof init.format !== 'string') {
                throw new TypeError('init.format must be a string.');
            }
            if (!Number.isInteger(init.codedWidth) || init.codedWidth <= 0) {
                throw new TypeError('init.codedWidth must be a positive integer.');
            }
            if (!Number.isInteger(init.codedHeight) || init.codedHeight <= 0) {
                throw new TypeError('init.codedHeight must be a positive integer.');
            }
            if (init.rotation !== undefined && ![
                0,
                90,
                180,
                270
            ].includes(init.rotation)) {
                throw new TypeError('init.rotation, when provided, must be 0, 90, 180, or 270.');
            }
            if (!Number.isFinite(init.timestamp)) {
                throw new TypeError('init.timestamp must be a number.');
            }
            if (init.duration !== undefined && (!Number.isFinite(init.duration) || init.duration < 0)) {
                throw new TypeError('init.duration, when provided, must be a non-negative number.');
            }
            this._data = toUint8Array(data).slice(); // Copy it
            this.format = init.format;
            this.codedWidth = init.codedWidth;
            this.codedHeight = init.codedHeight;
            this.rotation = init.rotation ?? 0;
            this.timestamp = init.timestamp;
            this.duration = init.duration ?? 0;
            this.colorSpace = new VideoColorSpace(init.colorSpace);
        } else if (typeof VideoFrame !== 'undefined' && data instanceof VideoFrame) {
            if (init?.rotation !== undefined && ![
                0,
                90,
                180,
                270
            ].includes(init.rotation)) {
                throw new TypeError('init.rotation, when provided, must be 0, 90, 180, or 270.');
            }
            if (init?.timestamp !== undefined && !Number.isFinite(init?.timestamp)) {
                throw new TypeError('init.timestamp, when provided, must be a number.');
            }
            if (init?.duration !== undefined && (!Number.isFinite(init.duration) || init.duration < 0)) {
                throw new TypeError('init.duration, when provided, must be a non-negative number.');
            }
            this._data = data;
            this.format = data.format;
            this.codedWidth = data.codedWidth;
            this.codedHeight = data.codedHeight;
            this.rotation = init?.rotation ?? 0;
            this.timestamp = init?.timestamp ?? data.timestamp / 1e6;
            this.duration = init?.duration ?? (data.duration ?? 0) / 1e6;
            this.colorSpace = data.colorSpace;
        } else if (typeof HTMLImageElement !== 'undefined' && data instanceof HTMLImageElement || typeof SVGImageElement !== 'undefined' && data instanceof SVGImageElement || typeof ImageBitmap !== 'undefined' && data instanceof ImageBitmap || typeof HTMLVideoElement !== 'undefined' && data instanceof HTMLVideoElement || typeof HTMLCanvasElement !== 'undefined' && data instanceof HTMLCanvasElement || typeof OffscreenCanvas !== 'undefined' && data instanceof OffscreenCanvas) {
            if (!init || typeof init !== 'object') {
                throw new TypeError('init must be an object.');
            }
            if (init.rotation !== undefined && ![
                0,
                90,
                180,
                270
            ].includes(init.rotation)) {
                throw new TypeError('init.rotation, when provided, must be 0, 90, 180, or 270.');
            }
            if (!Number.isFinite(init.timestamp)) {
                throw new TypeError('init.timestamp must be a number.');
            }
            if (init.duration !== undefined && (!Number.isFinite(init.duration) || init.duration < 0)) {
                throw new TypeError('init.duration, when provided, must be a non-negative number.');
            }
            if (typeof VideoFrame !== 'undefined') {
                return new VideoSample(new VideoFrame(data, {
                    timestamp: Math.trunc(init.timestamp * SECOND_TO_MICROSECOND_FACTOR),
                    duration: Math.trunc((init.duration ?? 0) * SECOND_TO_MICROSECOND_FACTOR)
                }), init);
            }
            let width = 0;
            let height = 0;
            // Determine the dimensions of the thing
            if ('naturalWidth' in data) {
                width = data.naturalWidth;
                height = data.naturalHeight;
            } else if ('videoWidth' in data) {
                width = data.videoWidth;
                height = data.videoHeight;
            } else if ('width' in data) {
                width = Number(data.width);
                height = Number(data.height);
            }
            if (!width || !height) {
                throw new TypeError('Could not determine dimensions.');
            }
            const canvas = new OffscreenCanvas(width, height);
            const context = canvas.getContext('2d', {
                alpha: false,
                willReadFrequently: true
            });
            assert(context);
            // Draw it to a canvas
            context.drawImage(data, 0, 0);
            this._data = canvas;
            this.format = 'RGBX';
            this.codedWidth = width;
            this.codedHeight = height;
            this.rotation = init.rotation ?? 0;
            this.timestamp = init.timestamp;
            this.duration = init.duration ?? 0;
            this.colorSpace = new VideoColorSpace({
                matrix: 'rgb',
                primaries: 'bt709',
                transfer: 'iec61966-2-1',
                fullRange: true
            });
        } else {
            throw new TypeError('Invalid data type: Must be a BufferSource or CanvasImageSource.');
        }
    }
    /** Clones this video sample. */ clone() {
        if (this._closed) {
            throw new Error('VideoSample is closed.');
        }
        assert(this._data !== null);
        if (isVideoFrame(this._data)) {
            return new VideoSample(this._data.clone(), {
                timestamp: this.timestamp,
                duration: this.duration,
                rotation: this.rotation
            });
        } else if (this._data instanceof Uint8Array) {
            return new VideoSample(this._data.slice(), {
                format: this.format,
                codedWidth: this.codedWidth,
                codedHeight: this.codedHeight,
                timestamp: this.timestamp,
                duration: this.duration,
                colorSpace: this.colorSpace,
                rotation: this.rotation
            });
        } else {
            return new VideoSample(this._data, {
                format: this.format,
                codedWidth: this.codedWidth,
                codedHeight: this.codedHeight,
                timestamp: this.timestamp,
                duration: this.duration,
                colorSpace: this.colorSpace,
                rotation: this.rotation
            });
        }
    }
    /**
     * Closes this video sample, releasing held resources. Video samples should be closed as soon as they are not
     * needed anymore.
     */ close() {
        if (this._closed) {
            return;
        }
        if (isVideoFrame(this._data)) {
            this._data.close();
        } else {
            this._data = null; // GC that shit
        }
        this._closed = true;
    }
    /** Returns the number of bytes required to hold this video sample's pixel data. */ allocationSize() {
        if (this._closed) {
            throw new Error('VideoSample is closed.');
        }
        assert(this._data !== null);
        if (isVideoFrame(this._data)) {
            return this._data.allocationSize();
        } else if (this._data instanceof Uint8Array) {
            return this._data.byteLength;
        } else {
            return this.codedWidth * this.codedHeight * 4; // RGBX
        }
    }
    /** Copies this video sample's pixel data to an ArrayBuffer or ArrayBufferView. */ async copyTo(destination) {
        if (!isAllowSharedBufferSource(destination)) {
            throw new TypeError('destination must be an ArrayBuffer or an ArrayBuffer view.');
        }
        if (this._closed) {
            throw new Error('VideoSample is closed.');
        }
        assert(this._data !== null);
        if (isVideoFrame(this._data)) {
            await this._data.copyTo(destination);
        } else if (this._data instanceof Uint8Array) {
            const dest = toUint8Array(destination);
            dest.set(this._data);
        } else {
            const canvas = this._data;
            const context = canvas.getContext('2d', {
                alpha: false
            });
            assert(context);
            const imageData = context.getImageData(0, 0, this.codedWidth, this.codedHeight);
            const dest = toUint8Array(destination);
            dest.set(imageData.data);
        }
    }
    /**
     * Converts this video sample to a VideoFrame for use with the WebCodecs API. The VideoFrame returned by this
     * method *must* be closed separately from this video sample.
     */ toVideoFrame() {
        if (this._closed) {
            throw new Error('VideoSample is closed.');
        }
        assert(this._data !== null);
        if (isVideoFrame(this._data)) {
            return new VideoFrame(this._data, {
                timestamp: this.microsecondTimestamp,
                duration: this.microsecondDuration || undefined
            });
        } else if (this._data instanceof Uint8Array) {
            return new VideoFrame(this._data, {
                format: this.format,
                codedWidth: this.codedWidth,
                codedHeight: this.codedHeight,
                timestamp: this.microsecondTimestamp,
                duration: this.microsecondDuration,
                colorSpace: this.colorSpace
            });
        } else {
            return new VideoFrame(this._data, {
                timestamp: this.microsecondTimestamp,
                duration: this.microsecondDuration
            });
        }
    }
    draw(context, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        let sx = 0;
        let sy = 0;
        let sWidth = this.displayWidth;
        let sHeight = this.displayHeight;
        let dx = 0;
        let dy = 0;
        let dWidth = this.displayWidth;
        let dHeight = this.displayHeight;
        if (arg5 !== undefined) {
            sx = arg1;
            sy = arg2;
            sWidth = arg3;
            sHeight = arg4;
            dx = arg5;
            dy = arg6;
            if (arg7 !== undefined) {
                dWidth = arg7;
                dHeight = arg8;
            } else {
                dWidth = sWidth;
                dHeight = sHeight;
            }
        } else {
            dx = arg1;
            dy = arg2;
            if (arg3 !== undefined) {
                dWidth = arg3;
                dHeight = arg4;
            }
        }
        if (!(typeof CanvasRenderingContext2D !== 'undefined' && context instanceof CanvasRenderingContext2D || typeof OffscreenCanvasRenderingContext2D !== 'undefined' && context instanceof OffscreenCanvasRenderingContext2D)) {
            throw new TypeError('context must be a CanvasRenderingContext2D or OffscreenCanvasRenderingContext2D.');
        }
        if (!Number.isFinite(sx)) {
            throw new TypeError('sx must be a number.');
        }
        if (!Number.isFinite(sy)) {
            throw new TypeError('sy must be a number.');
        }
        if (!Number.isFinite(sWidth) || sWidth < 0) {
            throw new TypeError('sWidth must be a non-negative number.');
        }
        if (!Number.isFinite(sHeight) || sHeight < 0) {
            throw new TypeError('sHeight must be a non-negative number.');
        }
        if (!Number.isFinite(dx)) {
            throw new TypeError('dx must be a number.');
        }
        if (!Number.isFinite(dy)) {
            throw new TypeError('dy must be a number.');
        }
        if (!Number.isFinite(dWidth) || dWidth < 0) {
            throw new TypeError('dWidth must be a non-negative number.');
        }
        if (!Number.isFinite(dHeight) || dHeight < 0) {
            throw new TypeError('dHeight must be a non-negative number.');
        }
        if (this._closed) {
            throw new Error('VideoSample is closed.');
        }
        // The provided sx,sy,sWidth,sHeight refer to the final rotated image, but that's not actually how the image is
        // stored. Therefore, we must map these back onto the original, pre-rotation image.
        if (this.rotation === 90) {
            [sx, sy, sWidth, sHeight] = [
                sy,
                this.codedHeight - sx - sWidth,
                sHeight,
                sWidth
            ];
        } else if (this.rotation === 180) {
            [sx, sy] = [
                this.codedWidth - sx - sWidth,
                this.codedHeight - sy - sHeight
            ];
        } else if (this.rotation === 270) {
            [sx, sy, sWidth, sHeight] = [
                this.codedWidth - sy - sHeight,
                sx,
                sHeight,
                sWidth
            ];
        }
        const source = this.toCanvasImageSource();
        context.save();
        const centerX = dx + dWidth / 2;
        const centerY = dy + dHeight / 2;
        context.translate(centerX, centerY);
        context.rotate(this.rotation * Math.PI / 180);
        const aspectRatioChange = this.rotation % 180 === 0 ? 1 : dWidth / dHeight;
        // Scale to compensate for aspect ratio changes when rotated
        context.scale(1 / aspectRatioChange, aspectRatioChange);
        context.drawImage(source, sx, sy, sWidth, sHeight, -dWidth / 2, -dHeight / 2, dWidth, dHeight);
        // Restore the previous transformation state
        context.restore();
    }
    /**
     * Converts this video sample to a CanvasImageSource for drawing to a canvas.
     *
     * You must use the value returned by this method immediately, as any VideoFrame created internally will
     * automatically be closed in the next microtask.
     */ toCanvasImageSource() {
        if (this._closed) {
            throw new Error('VideoSample is closed.');
        }
        assert(this._data !== null);
        if (this._data instanceof Uint8Array) {
            // Requires VideoFrame to be defined
            const videoFrame = this.toVideoFrame();
            queueMicrotask(()=>videoFrame.close()); // Let's automatically close the frame in the next microtask
            return videoFrame;
        } else {
            return this._data;
        }
    }
    /** Sets the rotation metadata of this video sample. */ setRotation(newRotation) {
        if (![
            0,
            90,
            180,
            270
        ].includes(newRotation)) {
            throw new TypeError('newRotation must be 0, 90, 180, or 270.');
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        this.rotation = newRotation;
    }
    /** Sets the presentation timestamp of this video sample, in seconds. */ setTimestamp(newTimestamp) {
        if (!Number.isFinite(newTimestamp)) {
            throw new TypeError('newTimestamp must be a number.');
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        this.timestamp = newTimestamp;
    }
    /** Sets the duration of this video sample, in seconds. */ setDuration(newDuration) {
        if (!Number.isFinite(newDuration) || newDuration < 0) {
            throw new TypeError('newDuration must be a non-negative number.');
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        this.duration = newDuration;
    }
}
const isVideoFrame = (x)=>{
    return typeof VideoFrame !== 'undefined' && x instanceof VideoFrame;
};
const AUDIO_SAMPLE_FORMATS = new Set([
    'f32',
    'f32-planar',
    's16',
    's16-planar',
    's32',
    's32-planar',
    'u8',
    'u8-planar'
]);
/**
 * Represents a raw, unencoded audio sample. Mainly used as an expressive wrapper around WebCodecs API's AudioData,
 * but can also be used standalone.
 * @public
 */ class AudioSample {
    /** The presentation timestamp of the sample in microseconds. */ get microsecondTimestamp() {
        return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.timestamp);
    }
    /** The duration of the sample in microseconds. */ get microsecondDuration() {
        return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.duration);
    }
    constructor(init){
        /** @internal */ this._closed = false;
        if (isAudioData(init)) {
            if (init.format === null) {
                throw new TypeError('AudioData with null format is not supported.');
            }
            this._data = init;
            this.format = init.format;
            this.sampleRate = init.sampleRate;
            this.numberOfFrames = init.numberOfFrames;
            this.numberOfChannels = init.numberOfChannels;
            this.timestamp = init.timestamp / 1e6;
            this.duration = init.numberOfFrames / init.sampleRate;
        } else {
            if (!init || typeof init !== 'object') {
                throw new TypeError('Invalid AudioDataInit: must be an object.');
            }
            if (!AUDIO_SAMPLE_FORMATS.has(init.format)) {
                throw new TypeError('Invalid AudioDataInit: invalid format.');
            }
            if (!Number.isFinite(init.sampleRate) || init.sampleRate <= 0) {
                throw new TypeError('Invalid AudioDataInit: sampleRate must be > 0.');
            }
            if (!Number.isInteger(init.numberOfChannels) || init.numberOfChannels === 0) {
                throw new TypeError('Invalid AudioDataInit: numberOfChannels must be an integer > 0.');
            }
            if (!Number.isFinite(init?.timestamp)) {
                throw new TypeError('init.timestamp must be a number.');
            }
            const numberOfFrames = init.data.byteLength / (getBytesPerSample(init.format) * init.numberOfChannels);
            if (!Number.isInteger(numberOfFrames)) {
                throw new TypeError('Invalid AudioDataInit: data size is not a multiple of frame size.');
            }
            this.format = init.format;
            this.sampleRate = init.sampleRate;
            this.numberOfFrames = numberOfFrames;
            this.numberOfChannels = init.numberOfChannels;
            this.timestamp = init.timestamp;
            this.duration = numberOfFrames / init.sampleRate;
            let dataBuffer;
            if (init.data instanceof ArrayBuffer) {
                dataBuffer = new Uint8Array(init.data);
            } else if (ArrayBuffer.isView(init.data)) {
                dataBuffer = new Uint8Array(init.data.buffer, init.data.byteOffset, init.data.byteLength);
            } else {
                throw new TypeError('Invalid AudioDataInit: data is not a BufferSource.');
            }
            const expectedSize = this.numberOfFrames * this.numberOfChannels * getBytesPerSample(this.format);
            if (dataBuffer.byteLength < expectedSize) {
                throw new TypeError('Invalid AudioDataInit: insufficient data size.');
            }
            this._data = dataBuffer;
        }
    }
    /** Returns the number of bytes required to hold the audio sample's data as specified by the given options. */ allocationSize(options) {
        if (!options || typeof options !== 'object') {
            throw new TypeError('options must be an object.');
        }
        if (!Number.isInteger(options.planeIndex) || options.planeIndex < 0) {
            throw new TypeError('planeIndex must be a non-negative integer.');
        }
        if (options.format !== undefined && !AUDIO_SAMPLE_FORMATS.has(options.format)) {
            throw new TypeError('Invalid format.');
        }
        if (options.frameOffset !== undefined && (!Number.isInteger(options.frameOffset) || options.frameOffset < 0)) {
            throw new TypeError('frameOffset must be a non-negative integer.');
        }
        if (options.frameCount !== undefined && (!Number.isInteger(options.frameCount) || options.frameCount < 0)) {
            throw new TypeError('frameCount must be a non-negative integer.');
        }
        if (this._closed) {
            throw new Error('AudioSample is closed.');
        }
        const destFormat = options.format ?? this.format;
        const frameOffset = options.frameOffset ?? 0;
        if (frameOffset >= this.numberOfFrames) {
            throw new RangeError('frameOffset out of range');
        }
        const copyFrameCount = options.frameCount !== undefined ? options.frameCount : this.numberOfFrames - frameOffset;
        if (copyFrameCount > this.numberOfFrames - frameOffset) {
            throw new RangeError('frameCount out of range');
        }
        const bytesPerSample = getBytesPerSample(destFormat);
        const isPlanar = formatIsPlanar(destFormat);
        if (isPlanar && options.planeIndex >= this.numberOfChannels) {
            throw new RangeError('planeIndex out of range');
        }
        if (!isPlanar && options.planeIndex !== 0) {
            throw new RangeError('planeIndex out of range');
        }
        const elementCount = isPlanar ? copyFrameCount : copyFrameCount * this.numberOfChannels;
        return elementCount * bytesPerSample;
    }
    /** Copies the audio sample's data to an ArrayBuffer or ArrayBufferView as specified by the given options. */ copyTo(destination, options) {
        if (!isAllowSharedBufferSource(destination)) {
            throw new TypeError('destination must be an ArrayBuffer or an ArrayBuffer view.');
        }
        if (!options || typeof options !== 'object') {
            throw new TypeError('options must be an object.');
        }
        if (!Number.isInteger(options.planeIndex) || options.planeIndex < 0) {
            throw new TypeError('planeIndex must be a non-negative integer.');
        }
        if (options.format !== undefined && !AUDIO_SAMPLE_FORMATS.has(options.format)) {
            throw new TypeError('Invalid format.');
        }
        if (options.frameOffset !== undefined && (!Number.isInteger(options.frameOffset) || options.frameOffset < 0)) {
            throw new TypeError('frameOffset must be a non-negative integer.');
        }
        if (options.frameCount !== undefined && (!Number.isInteger(options.frameCount) || options.frameCount < 0)) {
            throw new TypeError('frameCount must be a non-negative integer.');
        }
        if (this._closed) {
            throw new Error('AudioSample is closed.');
        }
        const { planeIndex, format, frameCount: optFrameCount, frameOffset: optFrameOffset } = options;
        const destFormat = format ?? this.format;
        if (!destFormat) throw new Error('Destination format not determined');
        const numFrames = this.numberOfFrames;
        const numChannels = this.numberOfChannels;
        const frameOffset = optFrameOffset ?? 0;
        if (frameOffset >= numFrames) {
            throw new RangeError('frameOffset out of range');
        }
        const copyFrameCount = optFrameCount !== undefined ? optFrameCount : numFrames - frameOffset;
        if (copyFrameCount > numFrames - frameOffset) {
            throw new RangeError('frameCount out of range');
        }
        const destBytesPerSample = getBytesPerSample(destFormat);
        const destIsPlanar = formatIsPlanar(destFormat);
        if (destIsPlanar && planeIndex >= numChannels) {
            throw new RangeError('planeIndex out of range');
        }
        if (!destIsPlanar && planeIndex !== 0) {
            throw new RangeError('planeIndex out of range');
        }
        const destElementCount = destIsPlanar ? copyFrameCount : copyFrameCount * numChannels;
        const requiredSize = destElementCount * destBytesPerSample;
        if (destination.byteLength < requiredSize) {
            throw new RangeError('Destination buffer is too small');
        }
        const destView = toDataView(destination);
        const writeFn = getWriteFunction(destFormat);
        if (isAudioData(this._data)) {
            if (destIsPlanar) {
                if (destFormat === 'f32-planar') {
                    // Simple, since the browser must support f32-planar, we can just delegate here
                    this._data.copyTo(destination, {
                        planeIndex,
                        frameOffset,
                        frameCount: copyFrameCount,
                        format: 'f32-planar'
                    });
                } else {
                    // Allocate temporary buffer for f32-planar data
                    const tempBuffer = new ArrayBuffer(copyFrameCount * 4);
                    const tempArray = new Float32Array(tempBuffer);
                    this._data.copyTo(tempArray, {
                        planeIndex,
                        frameOffset,
                        frameCount: copyFrameCount,
                        format: 'f32-planar'
                    });
                    // Convert each f32 sample to destination format
                    const tempView = new DataView(tempBuffer);
                    for(let i = 0; i < copyFrameCount; i++){
                        const destOffset = i * destBytesPerSample;
                        const sample = tempView.getFloat32(i * 4, true);
                        writeFn(destView, destOffset, sample);
                    }
                }
            } else {
                // Destination is interleaved.
                // Allocate a temporary Float32Array to hold one channel's worth of data.
                const numCh = numChannels;
                const temp = new Float32Array(copyFrameCount);
                for(let ch = 0; ch < numCh; ch++){
                    this._data.copyTo(temp, {
                        planeIndex: ch,
                        frameOffset,
                        frameCount: copyFrameCount,
                        format: 'f32-planar'
                    });
                    for(let i = 0; i < copyFrameCount; i++){
                        const destIndex = i * numCh + ch;
                        const destOffset = destIndex * destBytesPerSample;
                        writeFn(destView, destOffset, temp[i]);
                    }
                }
            }
        } else {
            // Branch for Uint8Array data (non-AudioData)
            const uint8Data = this._data;
            const srcView = new DataView(uint8Data.buffer, uint8Data.byteOffset, uint8Data.byteLength);
            const srcFormat = this.format;
            const readFn = getReadFunction(srcFormat);
            const srcBytesPerSample = getBytesPerSample(srcFormat);
            const srcIsPlanar = formatIsPlanar(srcFormat);
            for(let i = 0; i < copyFrameCount; i++){
                if (destIsPlanar) {
                    const destOffset = i * destBytesPerSample;
                    let srcOffset;
                    if (srcIsPlanar) {
                        srcOffset = (planeIndex * numFrames + (i + frameOffset)) * srcBytesPerSample;
                    } else {
                        srcOffset = ((i + frameOffset) * numChannels + planeIndex) * srcBytesPerSample;
                    }
                    const normalized = readFn(srcView, srcOffset);
                    writeFn(destView, destOffset, normalized);
                } else {
                    for(let ch = 0; ch < numChannels; ch++){
                        const destIndex = i * numChannels + ch;
                        const destOffset = destIndex * destBytesPerSample;
                        let srcOffset;
                        if (srcIsPlanar) {
                            srcOffset = (ch * numFrames + (i + frameOffset)) * srcBytesPerSample;
                        } else {
                            srcOffset = ((i + frameOffset) * numChannels + ch) * srcBytesPerSample;
                        }
                        const normalized = readFn(srcView, srcOffset);
                        writeFn(destView, destOffset, normalized);
                    }
                }
            }
        }
    }
    /** Clones this audio sample. */ clone() {
        if (this._closed) {
            throw new Error('AudioSample is closed.');
        }
        if (isAudioData(this._data)) {
            const sample = new AudioSample(this._data.clone());
            sample.setTimestamp(this.timestamp); // Make sure the timestamp is precise (beyond microsecond accuracy)
            return sample;
        } else {
            return new AudioSample({
                format: this.format,
                sampleRate: this.sampleRate,
                numberOfFrames: this.numberOfFrames,
                numberOfChannels: this.numberOfChannels,
                timestamp: this.timestamp,
                data: this._data
            });
        }
    }
    /**
     * Closes this audio sample, releasing held resources. Audio samples should be closed as soon as they are not
     * needed anymore.
     */ close() {
        if (this._closed) {
            return;
        }
        if (isAudioData(this._data)) {
            this._data.close();
        } else {
            this._data = new Uint8Array(0);
        }
        this._closed = true;
    }
    /**
     * Converts this audio sample to an AudioData for use with the WebCodecs API. The AudioData returned by this
     * method *must* be closed separately from this audio sample.
     */ toAudioData() {
        if (this._closed) {
            throw new Error('AudioSample is closed.');
        }
        if (isAudioData(this._data)) {
            if (this._data.timestamp === this.microsecondTimestamp) {
                // Timestamp matches, let's just return the data (but cloned)
                return this._data.clone();
            } else {
                // It's impossible to simply change an AudioData's timestamp, so we'll need to create a new one
                if (formatIsPlanar(this.format)) {
                    const size = this.allocationSize({
                        planeIndex: 0,
                        format: this.format
                    });
                    const data = new ArrayBuffer(size * this.numberOfChannels);
                    // We gotta read out each plane individually
                    for(let i = 0; i < this.numberOfChannels; i++){
                        this.copyTo(new Uint8Array(data, i * size, size), {
                            planeIndex: i,
                            format: this.format
                        });
                    }
                    return new AudioData({
                        format: this.format,
                        sampleRate: this.sampleRate,
                        numberOfFrames: this.numberOfFrames,
                        numberOfChannels: this.numberOfChannels,
                        timestamp: this.microsecondTimestamp,
                        data
                    });
                } else {
                    const data = new ArrayBuffer(this.allocationSize({
                        planeIndex: 0,
                        format: this.format
                    }));
                    this.copyTo(data, {
                        planeIndex: 0,
                        format: this.format
                    });
                    return new AudioData({
                        format: this.format,
                        sampleRate: this.sampleRate,
                        numberOfFrames: this.numberOfFrames,
                        numberOfChannels: this.numberOfChannels,
                        timestamp: this.microsecondTimestamp,
                        data
                    });
                }
            }
        } else {
            return new AudioData({
                format: this.format,
                sampleRate: this.sampleRate,
                numberOfFrames: this.numberOfFrames,
                numberOfChannels: this.numberOfChannels,
                timestamp: this.microsecondTimestamp,
                data: this._data
            });
        }
    }
    /** Convert this audio sample to an AudioBuffer for use with the Web Audio API. */ toAudioBuffer() {
        if (this._closed) {
            throw new Error('AudioSample is closed.');
        }
        const audioBuffer = new AudioBuffer({
            numberOfChannels: this.numberOfChannels,
            length: this.numberOfFrames,
            sampleRate: this.sampleRate
        });
        const dataBytes = new Float32Array(this.allocationSize({
            planeIndex: 0,
            format: 'f32-planar'
        }) / 4);
        for(let i = 0; i < this.numberOfChannels; i++){
            this.copyTo(dataBytes, {
                planeIndex: i,
                format: 'f32-planar'
            });
            audioBuffer.copyToChannel(dataBytes, i);
        }
        return audioBuffer;
    }
    /** Sets the presentation timestamp of this audio sample, in seconds. */ setTimestamp(newTimestamp) {
        if (!Number.isFinite(newTimestamp)) {
            throw new TypeError('newTimestamp must be a number.');
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        this.timestamp = newTimestamp;
    }
    /**
     * Creates AudioSamples from an AudioBuffer, starting at the given timestamp in seconds. Typically creates exactly
     * one sample, but may create multiple if the AudioBuffer is exceedingly large.
     */ static fromAudioBuffer(audioBuffer, timestamp) {
        if (!(audioBuffer instanceof AudioBuffer)) {
            throw new TypeError('audioBuffer must be an AudioBuffer.');
        }
        const MAX_FLOAT_COUNT = 64 * 1024 * 1024;
        const numberOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const totalFrames = audioBuffer.length;
        const maxFramesPerChunk = Math.floor(MAX_FLOAT_COUNT / numberOfChannels);
        let currentRelativeFrame = 0;
        let remainingFrames = totalFrames;
        const result = [];
        // Create AudioData in a chunked fashion so we don't create huge Float32Arrays
        while(remainingFrames > 0){
            const framesToCopy = Math.min(maxFramesPerChunk, remainingFrames);
            const chunkData = new Float32Array(numberOfChannels * framesToCopy);
            for(let channel = 0; channel < numberOfChannels; channel++){
                audioBuffer.copyFromChannel(chunkData.subarray(channel * framesToCopy, channel * framesToCopy + framesToCopy), channel, currentRelativeFrame);
            }
            const audioSample = new AudioSample({
                format: 'f32-planar',
                sampleRate,
                numberOfFrames: framesToCopy,
                numberOfChannels,
                timestamp: timestamp + currentRelativeFrame / sampleRate,
                data: chunkData
            });
            result.push(audioSample);
            currentRelativeFrame += framesToCopy;
            remainingFrames -= framesToCopy;
        }
        return result;
    }
}
const getBytesPerSample = (format)=>{
    switch(format){
        case 'u8':
        case 'u8-planar':
            return 1;
        case 's16':
        case 's16-planar':
            return 2;
        case 's32':
        case 's32-planar':
            return 4;
        case 'f32':
        case 'f32-planar':
            return 4;
        default:
            throw new Error('Unknown AudioSampleFormat');
    }
};
const formatIsPlanar = (format)=>{
    switch(format){
        case 'u8-planar':
        case 's16-planar':
        case 's32-planar':
        case 'f32-planar':
            return true;
        default:
            return false;
    }
};
const getReadFunction = (format)=>{
    switch(format){
        case 'u8':
        case 'u8-planar':
            return (view, offset)=>(view.getUint8(offset) - 128) / 128;
        case 's16':
        case 's16-planar':
            return (view, offset)=>view.getInt16(offset, true) / 32768;
        case 's32':
        case 's32-planar':
            return (view, offset)=>view.getInt32(offset, true) / 2147483648;
        case 'f32':
        case 'f32-planar':
            return (view, offset)=>view.getFloat32(offset, true);
    }
};
const getWriteFunction = (format)=>{
    switch(format){
        case 'u8':
        case 'u8-planar':
            return (view, offset, value)=>view.setUint8(offset, clamp((value + 1) * 127.5, 0, 255));
        case 's16':
        case 's16-planar':
            return (view, offset, value)=>view.setInt16(offset, clamp(Math.round(value * 32767), -32768, 32767), true);
        case 's32':
        case 's32-planar':
            return (view, offset, value)=>view.setInt32(offset, clamp(Math.round(value * 2147483647), -2147483648, 2147483647), true);
        case 'f32':
        case 'f32-planar':
            return (view, offset, value)=>view.setFloat32(offset, value, true);
    }
};
const isAudioData = (x)=>{
    return typeof AudioData !== 'undefined' && x instanceof AudioData;
};

const validatePacketRetrievalOptions = (options)=>{
    if (!options || typeof options !== 'object') {
        throw new TypeError('options must be an object.');
    }
    if (options.metadataOnly !== undefined && typeof options.metadataOnly !== 'boolean') {
        throw new TypeError('options.metadataOnly, when defined, must be a boolean.');
    }
    if (options.verifyKeyPackets !== undefined && typeof options.verifyKeyPackets !== 'boolean') {
        throw new TypeError('options.verifyKeyPackets, when defined, must be a boolean.');
    }
    if (options.verifyKeyPackets && options.metadataOnly) {
        throw new TypeError('options.verifyKeyPackets and options.metadataOnly cannot be enabled together.');
    }
};
const validateTimestamp = (timestamp)=>{
    if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
        throw new TypeError('timestamp must be a number.'); // It can be non-finite, that's fine
    }
};
const maybeFixPacketType = (track, promise, options)=>{
    if (options.verifyKeyPackets) {
        return promise.then(async (packet)=>{
            if (!packet || packet.type === 'delta') {
                return packet;
            }
            const determinedType = await track.determinePacketType(packet);
            if (determinedType) {
                // @ts-expect-error Technically readonly
                packet.type = determinedType;
            }
            return packet;
        });
    } else {
        return promise;
    }
};
/**
 * Sink for retrieving encoded packets from an input track.
 * @public
 */ class EncodedPacketSink {
    constructor(track){
        if (!(track instanceof InputTrack)) {
            throw new TypeError('track must be an InputTrack.');
        }
        this._track = track;
    }
    /**
     * Retrieves the track's first packet (in decode order), or null if it has no packets. The first packet is very
     * likely to be a key packet.
     */ getFirstPacket(options = {}) {
        validatePacketRetrievalOptions(options);
        return maybeFixPacketType(this._track, this._track._backing.getFirstPacket(options), options);
    }
    /**
     * Retrieves the packet corresponding to the given timestamp, in seconds. More specifically, returns the last packet
     * (in presentation order) with a start timestamp less than or equal to the given timestamp. This method can be
     * used to retrieve a track's last packet using `getPacket(Infinity)`. The method returns null if the timestamp
     * is before the first packet in the track.
     *
     * @param timestamp - The timestamp used for retrieval, in seconds.
     */ getPacket(timestamp, options = {}) {
        validateTimestamp(timestamp);
        validatePacketRetrievalOptions(options);
        return maybeFixPacketType(this._track, this._track._backing.getPacket(timestamp, options), options);
    }
    /**
     * Retrieves the packet following the given packet (in decode order), or null if the given packet is the
     * last packet.
     */ getNextPacket(packet, options = {}) {
        if (!(packet instanceof EncodedPacket)) {
            throw new TypeError('packet must be an EncodedPacket.');
        }
        validatePacketRetrievalOptions(options);
        return maybeFixPacketType(this._track, this._track._backing.getNextPacket(packet, options), options);
    }
    /**
     * Retrieves the key packet corresponding to the given timestamp, in seconds. More specifically, returns the last
     * key packet (in presentation order) with a start timestamp less than or equal to the given timestamp. A key packet
     * is a packet that doesn't require previous packets to be decoded. This method can be used to retrieve a track's
     * last key packet using `getKeyPacket(Infinity)`. The method returns null if the timestamp is before the first
     * key packet in the track.
     *
     * To ensure that the returned packet is guaranteed to be a real key frame, enable `options.verifyKeyPackets`.
     *
     * @param timestamp - The timestamp used for retrieval, in seconds.
     */ async getKeyPacket(timestamp, options = {}) {
        validateTimestamp(timestamp);
        validatePacketRetrievalOptions(options);
        if (!options.verifyKeyPackets) {
            return this._track._backing.getKeyPacket(timestamp, options);
        }
        const packet = await this._track._backing.getKeyPacket(timestamp, options);
        if (!packet || packet.type === 'delta') {
            return packet;
        }
        const determinedType = await this._track.determinePacketType(packet);
        if (determinedType === 'delta') {
            // Try returning the previous key packet (in hopes that it's actually a key packet)
            return this.getKeyPacket(packet.timestamp - 1 / this._track.timeResolution, options);
        }
        return packet;
    }
    /**
     * Retrieves the key packet following the given packet (in decode order), or null if the given packet is the last
     * key packet.
     *
     * To ensure that the returned packet is guaranteed to be a real key frame, enable `options.verifyKeyPackets`.
     */ async getNextKeyPacket(packet, options = {}) {
        if (!(packet instanceof EncodedPacket)) {
            throw new TypeError('packet must be an EncodedPacket.');
        }
        validatePacketRetrievalOptions(options);
        if (!options.verifyKeyPackets) {
            return this._track._backing.getNextKeyPacket(packet, options);
        }
        const nextPacket = await this._track._backing.getNextKeyPacket(packet, options);
        if (!nextPacket || nextPacket.type === 'delta') {
            return nextPacket;
        }
        const determinedType = await this._track.determinePacketType(nextPacket);
        if (determinedType === 'delta') {
            // Try returning the next key packet (in hopes that it's actually a key packet)
            return this.getNextKeyPacket(nextPacket, options);
        }
        return nextPacket;
    }
    /**
     * Creates an async iterator that yields the packets in this track in decode order. To enable fast iteration, this
     * method will intelligently preload packets based on the speed of the consumer.
     *
     * @param startPacket - (optional) The packet from which iteration should begin. This packet will also be yielded.
     * @param endTimestamp - (optional) The timestamp at which iteration should end. This packet will _not_ be yielded.
     */ packets(startPacket, endPacket, options = {}) {
        if (startPacket !== undefined && !(startPacket instanceof EncodedPacket)) {
            throw new TypeError('startPacket must be an EncodedPacket.');
        }
        if (startPacket !== undefined && startPacket.isMetadataOnly && !options?.metadataOnly) {
            throw new TypeError('startPacket can only be metadata-only if options.metadataOnly is enabled.');
        }
        if (endPacket !== undefined && !(endPacket instanceof EncodedPacket)) {
            throw new TypeError('endPacket must be an EncodedPacket.');
        }
        validatePacketRetrievalOptions(options);
        const packetQueue = [];
        let { promise: queueNotEmpty, resolve: onQueueNotEmpty } = promiseWithResolvers();
        let { promise: queueDequeue, resolve: onQueueDequeue } = promiseWithResolvers();
        let ended = false;
        let terminated = false;
        // This stores errors that are "out of band" in the sense that they didn't occur in the normal flow of this
        // method but instead in a different context. This error should not go unnoticed and must be bubbled up to
        // the consumer.
        let outOfBandError = null;
        const timestamps = [];
        // The queue should always be big enough to hold 1 second worth of packets
        const maxQueueSize = ()=>Math.max(2, timestamps.length);
        // The following is the "pump" process that keeps pumping packets into the queue
        (async ()=>{
            let packet = startPacket ?? await this.getFirstPacket(options);
            while(packet && !terminated){
                if (endPacket && packet.sequenceNumber >= endPacket?.sequenceNumber) {
                    break;
                }
                if (packetQueue.length > maxQueueSize()) {
                    ({ promise: queueDequeue, resolve: onQueueDequeue } = promiseWithResolvers());
                    await queueDequeue;
                    continue;
                }
                packetQueue.push(packet);
                onQueueNotEmpty();
                ({ promise: queueNotEmpty, resolve: onQueueNotEmpty } = promiseWithResolvers());
                packet = await this.getNextPacket(packet, options);
            }
            ended = true;
            onQueueNotEmpty();
        })().catch((error)=>{
            if (!outOfBandError) {
                outOfBandError = error;
                onQueueNotEmpty();
            }
        });
        return {
            async next () {
                while(true){
                    if (terminated) {
                        return {
                            value: undefined,
                            done: true
                        };
                    } else if (outOfBandError) {
                        throw outOfBandError;
                    } else if (packetQueue.length > 0) {
                        const value = packetQueue.shift();
                        const now = performance.now();
                        timestamps.push(now);
                        while(timestamps.length > 0 && now - timestamps[0] >= 1000){
                            timestamps.shift();
                        }
                        onQueueDequeue();
                        return {
                            value,
                            done: false
                        };
                    } else if (ended) {
                        return {
                            value: undefined,
                            done: true
                        };
                    } else {
                        await queueNotEmpty;
                    }
                }
            },
            async return () {
                terminated = true;
                onQueueDequeue();
                onQueueNotEmpty();
                return {
                    value: undefined,
                    done: true
                };
            },
            async throw (error) {
                throw error;
            },
            [Symbol.asyncIterator] () {
                return this;
            }
        };
    }
}
class DecoderWrapper {
    constructor(onSample, onError){
        this.onSample = onSample;
        this.onError = onError;
    }
}
/**
 * Base class for decoded media sample sinks.
 * @public
 */ class BaseMediaSampleSink {
    /** @internal */ mediaSamplesInRange(startTimestamp = 0, endTimestamp = Infinity) {
        validateTimestamp(startTimestamp);
        validateTimestamp(endTimestamp);
        const sampleQueue = [];
        let firstSampleQueued = false;
        let lastSample = null;
        let { promise: queueNotEmpty, resolve: onQueueNotEmpty } = promiseWithResolvers();
        let { promise: queueDequeue, resolve: onQueueDequeue } = promiseWithResolvers();
        let decoderIsFlushed = false;
        let ended = false;
        let terminated = false;
        // This stores errors that are "out of band" in the sense that they didn't occur in the normal flow of this
        // method but instead in a different context. This error should not go unnoticed and must be bubbled up to
        // the consumer.
        let outOfBandError = null;
        // The following is the "pump" process that keeps pumping packets into the decoder
        (async ()=>{
            const decoderError = new Error();
            const decoder = await this._createDecoder((sample)=>{
                onQueueDequeue();
                if (sample.timestamp >= endTimestamp) {
                    ended = true;
                }
                if (ended) {
                    sample.close();
                    return;
                }
                if (lastSample) {
                    if (sample.timestamp > startTimestamp) {
                        // We don't know ahead of time what the first first is. This is because the first first is the
                        // last first whose timestamp is less than or equal to the start timestamp. Therefore we need to
                        // wait for the first first after the start timestamp, and then we'll know that the previous
                        // first was the first first.
                        sampleQueue.push(lastSample);
                        firstSampleQueued = true;
                    } else {
                        lastSample.close();
                    }
                }
                if (sample.timestamp >= startTimestamp) {
                    sampleQueue.push(sample);
                    firstSampleQueued = true;
                }
                lastSample = firstSampleQueued ? null : sample;
                if (sampleQueue.length > 0) {
                    onQueueNotEmpty();
                    ({ promise: queueNotEmpty, resolve: onQueueNotEmpty } = promiseWithResolvers());
                }
            }, (error)=>{
                if (!outOfBandError) {
                    error.stack = decoderError.stack; // Provide a more useful stack trace
                    outOfBandError = error;
                    onQueueNotEmpty();
                }
            });
            const packetSink = this._createPacketSink();
            const keyPacket = await packetSink.getKeyPacket(startTimestamp, {
                verifyKeyPackets: true
            }) ?? await packetSink.getFirstPacket();
            if (!keyPacket) {
                return;
            }
            let currentPacket = keyPacket;
            let endPacket = undefined;
            if (endTimestamp < Infinity) {
                // When an end timestamp is set, we cannot simply use that for the packet iterator due to out-of-order
                // frames (B-frames). Instead, we'll need to keep decoding packets until we get a frame that exceeds
                // this end time. However, we can still put a bound on it: Since key frames are by definition never
                // out of order, we can stop at the first key frame after the end timestamp.
                const packet = await packetSink.getPacket(endTimestamp);
                const keyPacket = !packet ? null : packet.type === 'key' && packet.timestamp === endTimestamp ? packet : await packetSink.getNextKeyPacket(packet, {
                    verifyKeyPackets: true
                });
                if (keyPacket) {
                    endPacket = keyPacket;
                }
            }
            const packets = packetSink.packets(keyPacket, endPacket);
            await packets.next(); // Skip the start packet as we already have it
            while(currentPacket && !ended){
                const maxQueueSize = computeMaxQueueSize(sampleQueue.length);
                if (sampleQueue.length + decoder.getDecodeQueueSize() > maxQueueSize) {
                    ({ promise: queueDequeue, resolve: onQueueDequeue } = promiseWithResolvers());
                    await queueDequeue;
                    continue;
                }
                decoder.decode(currentPacket);
                const packetResult = await packets.next();
                if (packetResult.done) {
                    break;
                }
                currentPacket = packetResult.value;
            }
            await packets.return();
            if (!terminated) await decoder.flush();
            decoder.close();
            if (!firstSampleQueued && lastSample) {
                sampleQueue.push(lastSample);
            }
            decoderIsFlushed = true;
            onQueueNotEmpty(); // To unstuck the generator
        })().catch((error)=>{
            if (!outOfBandError) {
                outOfBandError = error;
                onQueueNotEmpty();
            }
        });
        return {
            async next () {
                while(true){
                    if (terminated) {
                        return {
                            value: undefined,
                            done: true
                        };
                    } else if (outOfBandError) {
                        throw outOfBandError;
                    } else if (sampleQueue.length > 0) {
                        const value = sampleQueue.shift();
                        onQueueDequeue();
                        return {
                            value,
                            done: false
                        };
                    } else if (!decoderIsFlushed) {
                        await queueNotEmpty;
                    } else {
                        return {
                            value: undefined,
                            done: true
                        };
                    }
                }
            },
            async return () {
                terminated = true;
                ended = true;
                onQueueDequeue();
                onQueueNotEmpty();
                lastSample?.close();
                for (const sample of sampleQueue){
                    sample.close();
                }
                return {
                    value: undefined,
                    done: true
                };
            },
            async throw (error) {
                throw error;
            },
            [Symbol.asyncIterator] () {
                return this;
            }
        };
    }
    /** @internal */ mediaSamplesAtTimestamps(timestamps) {
        validateAnyIterable(timestamps);
        const timestampIterator = toAsyncIterator(timestamps);
        const timestampsOfInterest = [];
        const sampleQueue = [];
        let { promise: queueNotEmpty, resolve: onQueueNotEmpty } = promiseWithResolvers();
        let { promise: queueDequeue, resolve: onQueueDequeue } = promiseWithResolvers();
        let decoderIsFlushed = false;
        let terminated = false;
        // This stores errors that are "out of band" in the sense that they didn't occur in the normal flow of this
        // method but instead in a different context. This error should not go unnoticed and must be bubbled up to
        // the consumer.
        let outOfBandError = null;
        const pushToQueue = (sample)=>{
            sampleQueue.push(sample);
            onQueueNotEmpty();
            ({ promise: queueNotEmpty, resolve: onQueueNotEmpty } = promiseWithResolvers());
        };
        // The following is the "pump" process that keeps pumping packets into the decoder
        (async ()=>{
            const decoderError = new Error();
            const decoder = await this._createDecoder((sample)=>{
                onQueueDequeue();
                if (terminated) {
                    sample.close();
                    return;
                }
                let sampleUses = 0;
                while(timestampsOfInterest.length > 0 && sample.timestamp - timestampsOfInterest[0] > -1e-10 // Give it a little epsilon
                ){
                    sampleUses++;
                    timestampsOfInterest.shift();
                }
                if (sampleUses > 0) {
                    for(let i = 0; i < sampleUses; i++){
                        // Clone the sample if we need to emit it multiple times
                        pushToQueue(i < sampleUses - 1 ? sample.clone() : sample);
                    }
                } else {
                    sample.close();
                }
            }, (error)=>{
                if (!outOfBandError) {
                    error.stack = decoderError.stack; // Provide a more useful stack trace
                    outOfBandError = error;
                    onQueueNotEmpty();
                }
            });
            const packetSink = this._createPacketSink();
            let lastPacket = null;
            let lastKeyPacket = null;
            // The end sequence number (inclusive) in the next batch of packets that will be decoded. The batch starts
            // at the last key frame and goes until this sequence number.
            let maxSequenceNumber = -1;
            const decodePackets = async ()=>{
                assert(lastKeyPacket);
                // Start at the current key packet
                let currentPacket = lastKeyPacket;
                decoder.decode(currentPacket);
                while(currentPacket.sequenceNumber < maxSequenceNumber){
                    const maxQueueSize = computeMaxQueueSize(sampleQueue.length);
                    while(sampleQueue.length + decoder.getDecodeQueueSize() > maxQueueSize && !terminated){
                        ({ promise: queueDequeue, resolve: onQueueDequeue } = promiseWithResolvers());
                        await queueDequeue;
                    }
                    if (terminated) {
                        break;
                    }
                    const nextPacket = await packetSink.getNextPacket(currentPacket);
                    assert(nextPacket);
                    currentPacket = nextPacket;
                    decoder.decode(nextPacket);
                }
                maxSequenceNumber = -1;
            };
            const flushDecoder = async ()=>{
                await decoder.flush();
                // We don't expect this list to have any elements in it anymore, but in case it does, let's emit
                // nulls for every remaining element, then clear it.
                for(let i = 0; i < timestampsOfInterest.length; i++){
                    pushToQueue(null);
                }
                timestampsOfInterest.length = 0;
            };
            for await (const timestamp of timestampIterator){
                validateTimestamp(timestamp);
                if (terminated) {
                    break;
                }
                const targetPacket = await packetSink.getPacket(timestamp);
                const keyPacket = targetPacket && await packetSink.getKeyPacket(timestamp, {
                    verifyKeyPackets: true
                });
                if (!keyPacket) {
                    if (maxSequenceNumber !== -1) {
                        await decodePackets();
                        await flushDecoder();
                    }
                    pushToQueue(null);
                    lastPacket = null;
                    continue;
                }
                // Check if the key packet has changed or if we're going back in time
                if (lastPacket && (keyPacket.sequenceNumber !== lastKeyPacket.sequenceNumber || targetPacket.timestamp < lastPacket.timestamp)) {
                    await decodePackets();
                    await flushDecoder(); // Always flush here, improves decoder compatibility
                }
                timestampsOfInterest.push(targetPacket.timestamp);
                maxSequenceNumber = Math.max(targetPacket.sequenceNumber, maxSequenceNumber);
                lastPacket = targetPacket;
                lastKeyPacket = keyPacket;
            }
            if (!terminated) {
                if (maxSequenceNumber !== -1) {
                    // We still need to decode packets
                    await decodePackets();
                }
                await flushDecoder();
            }
            decoder.close();
            decoderIsFlushed = true;
            onQueueNotEmpty(); // To unstuck the generator
        })().catch((error)=>{
            if (!outOfBandError) {
                outOfBandError = error;
                onQueueNotEmpty();
            }
        });
        return {
            async next () {
                while(true){
                    if (terminated) {
                        return {
                            value: undefined,
                            done: true
                        };
                    } else if (outOfBandError) {
                        throw outOfBandError;
                    } else if (sampleQueue.length > 0) {
                        const value = sampleQueue.shift();
                        assert(value !== undefined);
                        onQueueDequeue();
                        return {
                            value,
                            done: false
                        };
                    } else if (!decoderIsFlushed) {
                        await queueNotEmpty;
                    } else {
                        return {
                            value: undefined,
                            done: true
                        };
                    }
                }
            },
            async return () {
                terminated = true;
                onQueueDequeue();
                onQueueNotEmpty();
                for (const sample of sampleQueue){
                    sample?.close();
                }
                return {
                    value: undefined,
                    done: true
                };
            },
            async throw (error) {
                throw error;
            },
            [Symbol.asyncIterator] () {
                return this;
            }
        };
    }
}
const computeMaxQueueSize = (decodedSampleQueueSize)=>{
    // If we have decoded samples lying around, limit the total queue size to a small value (decoded samples can use up
    // a lot of memory). If not, we're fine with a much bigger queue of encoded packets waiting to be decoded. In fact,
    // some decoders only start flushing out decoded chunks when the packet queue is large enough.
    return decodedSampleQueueSize === 0 ? 40 : 8;
};
class VideoDecoderWrapper extends DecoderWrapper {
    constructor(onSample, onError, codec, decoderConfig, rotation, timeResolution){
        super(onSample, onError);
        this.rotation = rotation;
        this.timeResolution = timeResolution;
        this.decoder = null;
        this.customDecoder = null;
        this.customDecoderCallSerializer = new CallSerializer();
        this.customDecoderQueueSize = 0;
        this.sampleQueue = [];
        const sampleHandler = (sample)=>{
            // For correct B-frame handling, we don't just hand over the frames directly but instead add them to a
            // queue, because we want to ensure frames are emitted in presentation order. We flush the queue each time
            // we receive a frame with a timestamp larger than the highest we've seen so far, as we can sure that is
            // not a B-frame. Typically, WebCodecs automatically guarantees that frames are emitted in presentation
            // order, but some browsers (Safari) don't always follow this rule.
            if (this.sampleQueue.length > 0 && sample.timestamp >= last(this.sampleQueue).timestamp) {
                for (const sample of this.sampleQueue){
                    this.finalizeAndEmitSample(sample);
                }
                this.sampleQueue.length = 0;
            }
            const insertionIndex = binarySearchLessOrEqual(this.sampleQueue, sample.timestamp, (x)=>x.timestamp);
            this.sampleQueue.splice(insertionIndex + 1, 0, sample);
        };
        const MatchingCustomDecoder = customVideoDecoders.find((x)=>x.supports(codec, decoderConfig));
        if (MatchingCustomDecoder) {
            // @ts-expect-error "Can't create instance of abstract class 🤓"
            this.customDecoder = new MatchingCustomDecoder();
            // @ts-expect-error It's technically readonly
            this.customDecoder.codec = codec;
            // @ts-expect-error It's technically readonly
            this.customDecoder.config = decoderConfig;
            // @ts-expect-error It's technically readonly
            this.customDecoder.onSample = (sample)=>{
                if (!(sample instanceof VideoSample)) {
                    throw new TypeError('The argument passed to onSample must be a VideoSample.');
                }
                sampleHandler(sample);
            };
            void this.customDecoderCallSerializer.call(()=>this.customDecoder.init());
        } else {
            this.decoder = new VideoDecoder({
                output: (frame)=>sampleHandler(new VideoSample(frame)),
                error: onError
            });
            this.decoder.configure(decoderConfig);
        }
    }
    finalizeAndEmitSample(sample) {
        // Round the timestamps to the time resolution
        sample.setTimestamp(Math.round(sample.timestamp * this.timeResolution) / this.timeResolution);
        sample.setDuration(Math.round(sample.duration * this.timeResolution) / this.timeResolution);
        sample.setRotation(this.rotation);
        this.onSample(sample);
    }
    getDecodeQueueSize() {
        if (this.customDecoder) {
            return this.customDecoderQueueSize;
        } else {
            assert(this.decoder);
            return this.decoder.decodeQueueSize;
        }
    }
    decode(packet) {
        if (this.customDecoder) {
            this.customDecoderQueueSize++;
            void this.customDecoderCallSerializer.call(()=>this.customDecoder.decode(packet)).then(()=>this.customDecoderQueueSize--);
        } else {
            assert(this.decoder);
            this.decoder.decode(packet.toEncodedVideoChunk());
        }
    }
    async flush() {
        if (this.customDecoder) {
            await this.customDecoderCallSerializer.call(()=>this.customDecoder.flush());
        } else {
            assert(this.decoder);
            await this.decoder.flush();
        }
        for (const sample of this.sampleQueue){
            this.finalizeAndEmitSample(sample);
        }
        this.sampleQueue.length = 0;
    }
    close() {
        if (this.customDecoder) {
            void this.customDecoderCallSerializer.call(()=>this.customDecoder.close());
        } else {
            assert(this.decoder);
            this.decoder.close();
        }
        for (const sample of this.sampleQueue){
            sample.close();
        }
        this.sampleQueue.length = 0;
    }
}
/**
 * A sink that retrieves decoded video samples (video frames) from a video track.
 * @public
 */ class VideoSampleSink extends BaseMediaSampleSink {
    constructor(videoTrack){
        if (!(videoTrack instanceof InputVideoTrack)) {
            throw new TypeError('videoTrack must be an InputVideoTrack.');
        }
        super();
        this._videoTrack = videoTrack;
    }
    /** @internal */ async _createDecoder(onSample, onError) {
        if (!await this._videoTrack.canDecode()) {
            throw new Error('This video track cannot be decoded by this browser. Make sure to check decodability before using' + ' a track.');
        }
        const codec = this._videoTrack.codec;
        const rotation = this._videoTrack.rotation;
        const decoderConfig = await this._videoTrack.getDecoderConfig();
        const timeResolution = this._videoTrack.timeResolution;
        assert(codec && decoderConfig);
        return new VideoDecoderWrapper(onSample, onError, codec, decoderConfig, rotation, timeResolution);
    }
    /** @internal */ _createPacketSink() {
        return new EncodedPacketSink(this._videoTrack);
    }
    /**
     * Retrieves the video sample (frame) corresponding to the given timestamp, in seconds. More specifically, returns
     * the last video sample (in presentation order) with a start timestamp less than or equal to the given timestamp.
     * Returns null if the timestamp is before the track's first timestamp.
     *
     * @param timestamp - The timestamp used for retrieval, in seconds.
     */ async getSample(timestamp) {
        validateTimestamp(timestamp);
        for await (const sample of this.mediaSamplesAtTimestamps([
            timestamp
        ])){
            return sample;
        }
        throw new Error('Internal error: Iterator returned nothing.');
    }
    /**
     * Creates an async iterator that yields the video samples (frames) of this track in presentation order. This method
     * will intelligently pre-decode a few frames ahead to enable fast iteration.
     *
     * @param startTimestamp - The timestamp in seconds at which to start yielding samples (inclusive).
     * @param endTimestamp - The timestamp in seconds at which to stop yielding samples (exclusive).
     */ samples(startTimestamp = 0, endTimestamp = Infinity) {
        return this.mediaSamplesInRange(startTimestamp, endTimestamp);
    }
    /**
     * Creates an async iterator that yields a video sample (frame) for each timestamp in the argument. This method
     * uses an optimized decoding pipeline if these timestamps are monotonically sorted, decoding each packet at most
     * once, and is therefore more efficient than manually getting the sample for every timestamp. The iterator may
     * yield null if no frame is available for a given timestamp.
     *
     * @param timestamps - An iterable or async iterable of timestamps in seconds.
     */ samplesAtTimestamps(timestamps) {
        return this.mediaSamplesAtTimestamps(timestamps);
    }
}
/**
 * A sink that renders video samples (frames) of the given video track to canvases. This is often more useful than
 * directly retrieving frames, as it comes with common preprocessing steps such as resizing or applying rotation
 * metadata.
 *
 * This sink will yield HTMLCanvasElements when in a DOM context, and OffscreenCanvases otherwise.
 * @public
 */ class CanvasSink {
    constructor(videoTrack, options = {}){
        /** @internal */ this._nextCanvasIndex = 0;
        if (!(videoTrack instanceof InputVideoTrack)) {
            throw new TypeError('videoTrack must be an InputVideoTrack.');
        }
        if (options && typeof options !== 'object') {
            throw new TypeError('options must be an object.');
        }
        if (options.width !== undefined && (!Number.isInteger(options.width) || options.width <= 0)) {
            throw new TypeError('options.width, when defined, must be a positive integer.');
        }
        if (options.height !== undefined && (!Number.isInteger(options.height) || options.height <= 0)) {
            throw new TypeError('options.height, when defined, must be a positive integer.');
        }
        if (options.fit !== undefined && ![
            'fill',
            'contain',
            'cover'
        ].includes(options.fit)) {
            throw new TypeError('options.fit, when provided, must be one of "fill", "contain", or "cover".');
        }
        if (options.width !== undefined && options.height !== undefined && options.fit === undefined) {
            throw new TypeError('When both options.width and options.height are provided, options.fit must also be provided.');
        }
        if (options.rotation !== undefined && ![
            0,
            90,
            180,
            270
        ].includes(options.rotation)) {
            throw new TypeError('options.rotation, when provided, must be 0, 90, 180 or 270.');
        }
        if (options.poolSize !== undefined && (typeof options.poolSize !== 'number' || !Number.isInteger(options.poolSize) || options.poolSize < 0)) {
            throw new TypeError('poolSize must be a non-negative integer.');
        }
        const rotation = options.rotation ?? videoTrack.rotation;
        let [width, height] = rotation % 180 === 0 ? [
            videoTrack.codedWidth,
            videoTrack.codedHeight
        ] : [
            videoTrack.codedHeight,
            videoTrack.codedWidth
        ];
        const originalAspectRatio = width / height;
        // If width and height aren't defined together, deduce the missing value using the aspect ratio
        if (options.width !== undefined && options.height === undefined) {
            width = options.width;
            height = Math.round(width / originalAspectRatio);
        } else if (options.width === undefined && options.height !== undefined) {
            height = options.height;
            width = Math.round(height * originalAspectRatio);
        } else if (options.width !== undefined && options.height !== undefined) {
            width = options.width;
            height = options.height;
        }
        this._videoTrack = videoTrack;
        this._width = width;
        this._height = height;
        this._rotation = rotation;
        this._fit = options.fit ?? 'fill';
        this._videoSampleSink = new VideoSampleSink(videoTrack);
        this._canvasPool = Array.from({
            length: options.poolSize ?? 0
        }, ()=>null);
    }
    /** @internal */ _videoSampleToWrappedCanvas(sample) {
        let canvas = this._canvasPool[this._nextCanvasIndex];
        if (!canvas) {
            if (typeof document !== 'undefined') {
                // Prefer an HTMLCanvasElement
                canvas = document.createElement('canvas');
                canvas.width = this._width;
                canvas.height = this._height;
            } else {
                canvas = new OffscreenCanvas(this._width, this._height);
            }
            if (this._canvasPool.length > 0) {
                this._canvasPool[this._nextCanvasIndex] = canvas;
            }
        }
        if (this._canvasPool.length > 0) {
            this._nextCanvasIndex = (this._nextCanvasIndex + 1) % this._canvasPool.length;
        }
        const context = canvas.getContext('2d', {
            alpha: false
        });
        assert(context);
        context.resetTransform();
        // These variables specify where the final sample will be drawn on the canvas
        let dx;
        let dy;
        let newWidth;
        let newHeight;
        if (this._fit === 'fill') {
            dx = 0;
            dy = 0;
            newWidth = this._width;
            newHeight = this._height;
        } else {
            const [sampleWidth, sampleHeight] = this._rotation % 180 === 0 ? [
                sample.codedWidth,
                sample.codedHeight
            ] : [
                sample.codedHeight,
                sample.codedWidth
            ];
            const scale = this._fit === 'contain' ? Math.min(this._width / sampleWidth, this._height / sampleHeight) : Math.max(this._width / sampleWidth, this._height / sampleHeight);
            newWidth = sampleWidth * scale;
            newHeight = sampleHeight * scale;
            dx = (this._width - newWidth) / 2;
            dy = (this._height - newHeight) / 2;
        }
        const aspectRatioChange = this._rotation % 180 === 0 ? 1 : newWidth / newHeight;
        context.translate(this._width / 2, this._height / 2);
        context.rotate(this._rotation * Math.PI / 180);
        // This aspect ratio compensation is done so that we can draw the sample with the intended dimensions and
        // don't need to think about how those dimensions change after the rotation
        context.scale(1 / aspectRatioChange, aspectRatioChange);
        context.translate(-this._width / 2, -this._height / 2);
        context.drawImage(sample.toCanvasImageSource(), dx, dy, newWidth, newHeight);
        const result = {
            canvas,
            timestamp: sample.timestamp,
            duration: sample.duration
        };
        sample.close();
        return result;
    }
    /**
     * Retrieves a canvas with the video frame corresponding to the given timestamp, in seconds. More specifically,
     * returns the last video frame (in presentation order) with a start timestamp less than or equal to the given
     * timestamp. Returns null if the timestamp is before the track's first timestamp.
     *
     * @param timestamp - The timestamp used for retrieval, in seconds.
     */ async getCanvas(timestamp) {
        validateTimestamp(timestamp);
        const sample = await this._videoSampleSink.getSample(timestamp);
        return sample && this._videoSampleToWrappedCanvas(sample);
    }
    /**
     * Creates an async iterator that yields canvases with the video frames of this track in presentation order. This
     * method will intelligently pre-decode a few frames ahead to enable fast iteration.
     *
     * @param startTimestamp - The timestamp in seconds at which to start yielding canvases (inclusive).
     * @param endTimestamp - The timestamp in seconds at which to stop yielding canvases (exclusive).
     */ canvases(startTimestamp = 0, endTimestamp = Infinity) {
        return mapAsyncGenerator(this._videoSampleSink.samples(startTimestamp, endTimestamp), (sample)=>this._videoSampleToWrappedCanvas(sample));
    }
    /**
     * Creates an async iterator that yields a canvas for each timestamp in the argument. This method uses an optimized
     * decoding pipeline if these timestamps are monotonically sorted, decoding each packet at most once, and is
     * therefore more efficient than manually getting the canvas for every timestamp. The iterator may yield null if
     * no frame is available for a given timestamp.
     *
     * @param timestamps - An iterable or async iterable of timestamps in seconds.
     */ canvasesAtTimestamps(timestamps) {
        return mapAsyncGenerator(this._videoSampleSink.samplesAtTimestamps(timestamps), (sample)=>sample && this._videoSampleToWrappedCanvas(sample));
    }
}
class AudioDecoderWrapper extends DecoderWrapper {
    constructor(onSample, onError, codec, decoderConfig){
        super(onSample, onError);
        this.decoder = null;
        this.customDecoder = null;
        this.customDecoderCallSerializer = new CallSerializer();
        this.customDecoderQueueSize = 0;
        const sampleHandler = (sample)=>{
            const sampleRate = decoderConfig.sampleRate;
            // Round the timestamp to the sample rate
            sample.setTimestamp(Math.round(sample.timestamp * sampleRate) / sampleRate);
            onSample(sample);
        };
        const MatchingCustomDecoder = customAudioDecoders.find((x)=>x.supports(codec, decoderConfig));
        if (MatchingCustomDecoder) {
            // @ts-expect-error "Can't create instance of abstract class 🤓"
            this.customDecoder = new MatchingCustomDecoder();
            // @ts-expect-error It's technically readonly
            this.customDecoder.codec = codec;
            // @ts-expect-error It's technically readonly
            this.customDecoder.config = decoderConfig;
            // @ts-expect-error It's technically readonly
            this.customDecoder.onSample = (sample)=>{
                if (!(sample instanceof AudioSample)) {
                    throw new TypeError('The argument passed to onSample must be an AudioSample.');
                }
                sampleHandler(sample);
            };
            void this.customDecoderCallSerializer.call(()=>this.customDecoder.init());
        } else {
            this.decoder = new AudioDecoder({
                output: (data)=>sampleHandler(new AudioSample(data)),
                error: onError
            });
            this.decoder.configure(decoderConfig);
        }
    }
    getDecodeQueueSize() {
        if (this.customDecoder) {
            return this.customDecoderQueueSize;
        } else {
            assert(this.decoder);
            return this.decoder.decodeQueueSize;
        }
    }
    decode(packet) {
        if (this.customDecoder) {
            this.customDecoderQueueSize++;
            void this.customDecoderCallSerializer.call(()=>this.customDecoder.decode(packet)).then(()=>this.customDecoderQueueSize--);
        } else {
            assert(this.decoder);
            this.decoder.decode(packet.toEncodedAudioChunk());
        }
    }
    flush() {
        if (this.customDecoder) {
            return this.customDecoderCallSerializer.call(()=>this.customDecoder.flush());
        } else {
            assert(this.decoder);
            return this.decoder.flush();
        }
    }
    close() {
        if (this.customDecoder) {
            void this.customDecoderCallSerializer.call(()=>this.customDecoder.close());
        } else {
            assert(this.decoder);
            this.decoder.close();
        }
    }
}
// There are a lot of PCM variants not natively supported by the browser and by AudioData. Therefore we need a simple
// decoder that maps any input PCM format into a PCM format supported by the browser.
class PcmAudioDecoderWrapper extends DecoderWrapper {
    constructor(onSample, onError, decoderConfig){
        super(onSample, onError);
        this.decoderConfig = decoderConfig;
        // Internal state to accumulate a precise current timestamp based on audio durations, not the (potentially
        // inaccurate) sample timestamps.
        this.currentTimestamp = null;
        assert(PCM_AUDIO_CODECS.includes(decoderConfig.codec));
        this.codec = decoderConfig.codec;
        const { dataType, sampleSize, littleEndian } = parsePcmCodec(this.codec);
        this.inputSampleSize = sampleSize;
        switch(sampleSize){
            case 1:
                {
                    if (dataType === 'unsigned') {
                        this.readInputValue = (view, byteOffset)=>view.getUint8(byteOffset) - 2 ** 7;
                    } else if (dataType === 'signed') {
                        this.readInputValue = (view, byteOffset)=>view.getInt8(byteOffset);
                    } else if (dataType === 'ulaw') {
                        this.readInputValue = (view, byteOffset)=>fromUlaw(view.getUint8(byteOffset));
                    } else if (dataType === 'alaw') {
                        this.readInputValue = (view, byteOffset)=>fromAlaw(view.getUint8(byteOffset));
                    } else {
                        assert(false);
                    }
                }
                break;
            case 2:
                {
                    if (dataType === 'unsigned') {
                        this.readInputValue = (view, byteOffset)=>view.getUint16(byteOffset, littleEndian) - 2 ** 15;
                    } else if (dataType === 'signed') {
                        this.readInputValue = (view, byteOffset)=>view.getInt16(byteOffset, littleEndian);
                    } else {
                        assert(false);
                    }
                }
                break;
            case 3:
                {
                    if (dataType === 'unsigned') {
                        this.readInputValue = (view, byteOffset)=>getUint24(view, byteOffset, littleEndian) - 2 ** 23;
                    } else if (dataType === 'signed') {
                        this.readInputValue = (view, byteOffset)=>getInt24(view, byteOffset, littleEndian);
                    } else {
                        assert(false);
                    }
                }
                break;
            case 4:
                {
                    if (dataType === 'unsigned') {
                        this.readInputValue = (view, byteOffset)=>view.getUint32(byteOffset, littleEndian) - 2 ** 31;
                    } else if (dataType === 'signed') {
                        this.readInputValue = (view, byteOffset)=>view.getInt32(byteOffset, littleEndian);
                    } else if (dataType === 'float') {
                        this.readInputValue = (view, byteOffset)=>view.getFloat32(byteOffset, littleEndian);
                    } else {
                        assert(false);
                    }
                }
                break;
            case 8:
                {
                    if (dataType === 'float') {
                        this.readInputValue = (view, byteOffset)=>view.getFloat64(byteOffset, littleEndian);
                    } else {
                        assert(false);
                    }
                }
                break;
            default:
                {
                    assertNever(sampleSize);
                    assert(false);
                }
        }
        switch(sampleSize){
            case 1:
                {
                    if (dataType === 'ulaw' || dataType === 'alaw') {
                        this.outputSampleSize = 2;
                        this.outputFormat = 's16';
                        this.writeOutputValue = (view, byteOffset, value)=>view.setInt16(byteOffset, value, true);
                    } else {
                        this.outputSampleSize = 1;
                        this.outputFormat = 'u8';
                        this.writeOutputValue = (view, byteOffset, value)=>view.setUint8(byteOffset, value + 2 ** 7);
                    }
                }
                break;
            case 2:
                {
                    this.outputSampleSize = 2;
                    this.outputFormat = 's16';
                    this.writeOutputValue = (view, byteOffset, value)=>view.setInt16(byteOffset, value, true);
                }
                break;
            case 3:
                {
                    this.outputSampleSize = 4;
                    this.outputFormat = 's32';
                    // From https://www.w3.org/TR/webcodecs:
                    // AudioData containing 24-bit samples SHOULD store those samples in s32 or f32. When samples are
                    // stored in s32, each sample MUST be left-shifted by 8 bits.
                    this.writeOutputValue = (view, byteOffset, value)=>view.setInt32(byteOffset, value << 8, true);
                }
                break;
            case 4:
                {
                    this.outputSampleSize = 4;
                    if (dataType === 'float') {
                        this.outputFormat = 'f32';
                        this.writeOutputValue = (view, byteOffset, value)=>view.setFloat32(byteOffset, value, true);
                    } else {
                        this.outputFormat = 's32';
                        this.writeOutputValue = (view, byteOffset, value)=>view.setInt32(byteOffset, value, true);
                    }
                }
                break;
            case 8:
                {
                    this.outputSampleSize = 4;
                    this.outputFormat = 'f32';
                    this.writeOutputValue = (view, byteOffset, value)=>view.setFloat32(byteOffset, value, true);
                }
                break;
            default:
                {
                    assertNever(sampleSize);
                    assert(false);
                }
        }
    }
    getDecodeQueueSize() {
        return 0;
    }
    decode(packet) {
        const inputView = toDataView(packet.data);
        const numberOfFrames = packet.byteLength / this.decoderConfig.numberOfChannels / this.inputSampleSize;
        const outputBufferSize = numberOfFrames * this.decoderConfig.numberOfChannels * this.outputSampleSize;
        const outputBuffer = new ArrayBuffer(outputBufferSize);
        const outputView = new DataView(outputBuffer);
        for(let i = 0; i < numberOfFrames * this.decoderConfig.numberOfChannels; i++){
            const inputIndex = i * this.inputSampleSize;
            const outputIndex = i * this.outputSampleSize;
            const value = this.readInputValue(inputView, inputIndex);
            this.writeOutputValue(outputView, outputIndex, value);
        }
        const preciseDuration = numberOfFrames / this.decoderConfig.sampleRate;
        if (this.currentTimestamp === null || Math.abs(packet.timestamp - this.currentTimestamp) >= preciseDuration) {
            // We need to sync with the packet timestamp again
            this.currentTimestamp = packet.timestamp;
        }
        const preciseTimestamp = this.currentTimestamp;
        this.currentTimestamp += preciseDuration;
        const audioSample = new AudioSample({
            format: this.outputFormat,
            data: outputBuffer,
            numberOfChannels: this.decoderConfig.numberOfChannels,
            sampleRate: this.decoderConfig.sampleRate,
            numberOfFrames,
            timestamp: preciseTimestamp
        });
        this.onSample(audioSample);
    }
    async flush() {
    // Do nothing
    }
    close() {
    // Do nothing
    }
}
/**
 * Sink for retrieving decoded audio samples from an audio track.
 * @public
 */ class AudioSampleSink extends BaseMediaSampleSink {
    constructor(audioTrack){
        if (!(audioTrack instanceof InputAudioTrack)) {
            throw new TypeError('audioTrack must be an InputAudioTrack.');
        }
        super();
        this._audioTrack = audioTrack;
    }
    /** @internal */ async _createDecoder(onSample, onError) {
        if (!await this._audioTrack.canDecode()) {
            throw new Error('This audio track cannot be decoded by this browser. Make sure to check decodability before using' + ' a track.');
        }
        const codec = this._audioTrack.codec;
        const decoderConfig = await this._audioTrack.getDecoderConfig();
        assert(codec && decoderConfig);
        if (PCM_AUDIO_CODECS.includes(decoderConfig.codec)) {
            return new PcmAudioDecoderWrapper(onSample, onError, decoderConfig);
        } else {
            return new AudioDecoderWrapper(onSample, onError, codec, decoderConfig);
        }
    }
    /** @internal */ _createPacketSink() {
        return new EncodedPacketSink(this._audioTrack);
    }
    /**
     * Retrieves the audio sample corresponding to the given timestamp, in seconds. More specifically, returns
     * the last audio sample (in presentation order) with a start timestamp less than or equal to the given timestamp.
     * Returns null if the timestamp is before the track's first timestamp.
     *
     * @param timestamp - The timestamp used for retrieval, in seconds.
     */ async getSample(timestamp) {
        validateTimestamp(timestamp);
        for await (const sample of this.mediaSamplesAtTimestamps([
            timestamp
        ])){
            return sample;
        }
        throw new Error('Internal error: Iterator returned nothing.');
    }
    /**
     * Creates an async iterator that yields the audio samples of this track in presentation order. This method
     * will intelligently pre-decode a few samples ahead to enable fast iteration.
     *
     * @param startTimestamp - The timestamp in seconds at which to start yielding samples (inclusive).
     * @param endTimestamp - The timestamp in seconds at which to stop yielding samples (exclusive).
     */ samples(startTimestamp = 0, endTimestamp = Infinity) {
        return this.mediaSamplesInRange(startTimestamp, endTimestamp);
    }
    /**
     * Creates an async iterator that yields an audio sample for each timestamp in the argument. This method
     * uses an optimized decoding pipeline if these timestamps are monotonically sorted, decoding each packet at most
     * once, and is therefore more efficient than manually getting the sample for every timestamp. The iterator may
     * yield null if no sample is available for a given timestamp.
     *
     * @param timestamps - An iterable or async iterable of timestamps in seconds.
     */ samplesAtTimestamps(timestamps) {
        return this.mediaSamplesAtTimestamps(timestamps);
    }
}
/**
 * A sink that retrieves decoded audio samples from an audio track and converts them to AudioBuffers. This is often
 * more useful than directly retrieving audio samples, as AudioBuffers can be directly used with the Web Audio API.
 * @public
 */ class AudioBufferSink {
    constructor(audioTrack){
        if (!(audioTrack instanceof InputAudioTrack)) {
            throw new TypeError('audioTrack must be an InputAudioTrack.');
        }
        this._audioSampleSink = new AudioSampleSink(audioTrack);
    }
    /** @internal */ _audioSampleToWrappedArrayBuffer(sample) {
        return {
            buffer: sample.toAudioBuffer(),
            timestamp: sample.timestamp,
            duration: sample.duration
        };
    }
    /**
     * Retrieves the audio buffer corresponding to the given timestamp, in seconds. More specifically, returns
     * the last audio buffer (in presentation order) with a start timestamp less than or equal to the given timestamp.
     * Returns null if the timestamp is before the track's first timestamp.
     *
     * @param timestamp - The timestamp used for retrieval, in seconds.
     */ async getBuffer(timestamp) {
        validateTimestamp(timestamp);
        const data = await this._audioSampleSink.getSample(timestamp);
        return data && this._audioSampleToWrappedArrayBuffer(data);
    }
    /**
     * Creates an async iterator that yields audio buffers of this track in presentation order. This method
     * will intelligently pre-decode a few buffers ahead to enable fast iteration.
     *
     * @param startTimestamp - The timestamp in seconds at which to start yielding buffers (inclusive).
     * @param endTimestamp - The timestamp in seconds at which to stop yielding buffers (exclusive).
     */ buffers(startTimestamp = 0, endTimestamp = Infinity) {
        return mapAsyncGenerator(this._audioSampleSink.samples(startTimestamp, endTimestamp), (data)=>this._audioSampleToWrappedArrayBuffer(data));
    }
    /**
     * Creates an async iterator that yields an audio buffer for each timestamp in the argument. This method
     * uses an optimized decoding pipeline if these timestamps are monotonically sorted, decoding each packet at most
     * once, and is therefore more efficient than manually getting the buffer for every timestamp. The iterator may
     * yield null if no buffer is available for a given timestamp.
     *
     * @param timestamps - An iterable or async iterable of timestamps in seconds.
     */ buffersAtTimestamps(timestamps) {
        return mapAsyncGenerator(this._audioSampleSink.samplesAtTimestamps(timestamps), (data)=>data && this._audioSampleToWrappedArrayBuffer(data));
    }
}

/**
 * Represents a media track in an input file.
 * @public
 */ class InputTrack {
    /** @internal */ constructor(backing){
        this._backing = backing;
    }
    /** Returns true iff this track is a video track. */ isVideoTrack() {
        return this instanceof InputVideoTrack;
    }
    /** Returns true iff this track is an audio track. */ isAudioTrack() {
        return this instanceof InputAudioTrack;
    }
    /** The unique ID of this track in the input file. */ get id() {
        return this._backing.getId();
    }
    /** The ISO 639-2/T language code for this track. If the language is unknown, this field is 'und' (undetermined). */ get languageCode() {
        return this._backing.getLanguageCode();
    }
    /**
     * A positive number x such that all timestamps and durations of all packets of this track are
     * integer multiples of 1/x.
     */ get timeResolution() {
        return this._backing.getTimeResolution();
    }
    /**
     * Returns the start timestamp of the first packet of this track, in seconds. While often near zero, this value
     * may be positive or even negative. A negative starting timestamp means the track's timing has been offset. Samples
     * with a negative timestamp should not be presented.
     */ getFirstTimestamp() {
        return this._backing.getFirstTimestamp();
    }
    /** Returns the end timestamp of the last packet of this track, in seconds. */ computeDuration() {
        return this._backing.computeDuration();
    }
    /**
     * Computes aggregate packet statistics for this track, such as average packet rate or bitrate.
     *
     * @param targetPacketCount - This optional parameter sets a target for how many packets this method must have
     * looked at before it can return early; this means, you can use it to aggregate only a subset (prefix) of all
     * packets. This is very useful for getting a great estimate of video frame rate without having to scan through the
     * entire file.
     */ async computePacketStats(targetPacketCount = Infinity) {
        const sink = new EncodedPacketSink(this);
        let startTimestamp = Infinity;
        let endTimestamp = -Infinity;
        let packetCount = 0;
        let totalPacketBytes = 0;
        for await (const packet of sink.packets(undefined, undefined, {
            metadataOnly: true
        })){
            if (packetCount >= targetPacketCount && packet.timestamp >= endTimestamp) {
                break;
            }
            startTimestamp = Math.min(startTimestamp, packet.timestamp);
            endTimestamp = Math.max(endTimestamp, packet.timestamp + packet.duration);
            packetCount++;
            totalPacketBytes += packet.byteLength;
        }
        return {
            packetCount,
            averagePacketRate: packetCount ? Number((packetCount / (endTimestamp - startTimestamp)).toPrecision(16)) : 0,
            averageBitrate: packetCount ? Number((8 * totalPacketBytes / (endTimestamp - startTimestamp)).toPrecision(16)) : 0
        };
    }
}
/**
 * Represents a video track in an input file.
 * @public
 */ class InputVideoTrack extends InputTrack {
    /** @internal */ constructor(backing){
        super(backing);
        this._backing = backing;
    }
    get type() {
        return 'video';
    }
    get codec() {
        return this._backing.getCodec();
    }
    /** The width in pixels of the track's coded samples, before any transformations or rotations. */ get codedWidth() {
        return this._backing.getCodedWidth();
    }
    /** The height in pixels of the track's coded samples, before any transformations or rotations. */ get codedHeight() {
        return this._backing.getCodedHeight();
    }
    /** The angle in degrees by which the track's frames should be rotated (clockwise). */ get rotation() {
        return this._backing.getRotation();
    }
    /** The width in pixels of the track's frames after rotation. */ get displayWidth() {
        const rotation = this._backing.getRotation();
        return rotation % 180 === 0 ? this._backing.getCodedWidth() : this._backing.getCodedHeight();
    }
    /** The height in pixels of the track's frames after rotation. */ get displayHeight() {
        const rotation = this._backing.getRotation();
        return rotation % 180 === 0 ? this._backing.getCodedHeight() : this._backing.getCodedWidth();
    }
    /** Returns the color space of the track's samples. */ getColorSpace() {
        return this._backing.getColorSpace();
    }
    /** If this method returns true, the track's samples use a high dynamic range (HDR). */ async hasHighDynamicRange() {
        const colorSpace = await this._backing.getColorSpace();
        return colorSpace.primaries === 'bt2020' || colorSpace.primaries === 'smpte432' || colorSpace.transfer === 'pg' || colorSpace.transfer === 'hlg' || colorSpace.matrix === 'bt2020-ncl';
    }
    /**
     * Returns the decoder configuration for decoding the track's packets using a VideoDecoder. Returns null if the
     * track's codec is unknown.
     */ getDecoderConfig() {
        return this._backing.getDecoderConfig();
    }
    async getCodecParameterString() {
        const decoderConfig = await this._backing.getDecoderConfig();
        return decoderConfig?.codec ?? null;
    }
    async canDecode() {
        try {
            const decoderConfig = await this._backing.getDecoderConfig();
            if (!decoderConfig) {
                return false;
            }
            const codec = this._backing.getCodec();
            assert(codec !== null);
            if (customVideoDecoders.some((x)=>x.supports(codec, decoderConfig))) {
                return true;
            }
            if (typeof VideoDecoder === 'undefined') {
                return false;
            }
            const support = await VideoDecoder.isConfigSupported(decoderConfig);
            return support.supported === true;
        } catch (error) {
            console.error('Error during decodability check:', error);
            return false;
        }
    }
    async determinePacketType(packet) {
        if (!(packet instanceof EncodedPacket)) {
            throw new TypeError('packet must be an EncodedPacket.');
        }
        if (packet.isMetadataOnly) {
            throw new TypeError('packet must not be metadata-only to determine its type.');
        }
        if (this.codec === null) {
            return null;
        }
        return determineVideoPacketType(this, packet);
    }
}
/**
 * Represents an audio track in an input file.
 * @public
 */ class InputAudioTrack extends InputTrack {
    /** @internal */ constructor(backing){
        super(backing);
        this._backing = backing;
    }
    get type() {
        return 'audio';
    }
    get codec() {
        return this._backing.getCodec();
    }
    /** The number of audio channels in the track. */ get numberOfChannels() {
        return this._backing.getNumberOfChannels();
    }
    /** The track's audio sample rate in hertz. */ get sampleRate() {
        return this._backing.getSampleRate();
    }
    /**
     * Returns the decoder configuration for decoding the track's packets using an AudioDecoder. Returns null if the
     * track's codec is unknown.
     */ getDecoderConfig() {
        return this._backing.getDecoderConfig();
    }
    async getCodecParameterString() {
        const decoderConfig = await this._backing.getDecoderConfig();
        return decoderConfig?.codec ?? null;
    }
    async canDecode() {
        try {
            const decoderConfig = await this._backing.getDecoderConfig();
            if (!decoderConfig) {
                return false;
            }
            const codec = this._backing.getCodec();
            assert(codec !== null);
            if (customAudioDecoders.some((x)=>x.supports(codec, decoderConfig))) {
                return true;
            }
            if (decoderConfig.codec.startsWith('pcm-')) {
                return true; // Since we decode it ourselves
            } else {
                if (typeof AudioDecoder === 'undefined') {
                    return false;
                }
                const support = await AudioDecoder.isConfigSupported(decoderConfig);
                return support.supported === true;
            }
        } catch (error) {
            console.error('Error during decodability check:', error);
            return false;
        }
    }
    async determinePacketType(packet) {
        if (!(packet instanceof EncodedPacket)) {
            throw new TypeError('packet must be an EncodedPacket.');
        }
        if (this.codec === null) {
            return null;
        }
        return 'key'; // No audio codec with delta packets
    }
}

class Reader {
    constructor(source, maxStorableBytes = Infinity){
        this.source = source;
        this.maxStorableBytes = maxStorableBytes;
        this.loadedSegments = [];
        this.loadingSegments = [];
        this.sourceSizePromise = null;
        this.nextAge = 0;
        this.totalStoredBytes = 0;
    }
    async loadRange(start, end) {
        end = Math.min(end, await this.source.getSize());
        if (start >= end) {
            return;
        }
        const matchingLoadingSegment = this.loadingSegments.find((x)=>x.start <= start && x.end >= end);
        if (matchingLoadingSegment) {
            // Simply wait for the existing promise to finish to avoid loading the same range twice
            await matchingLoadingSegment.promise;
            return;
        }
        const index = binarySearchLessOrEqual(this.loadedSegments, start, (x)=>x.start);
        if (index !== -1) {
            for(let i = index; i < this.loadedSegments.length; i++){
                const segment = this.loadedSegments[i];
                if (segment.start > start) {
                    break;
                }
                const segmentEncasesRequestedRange = segment.end >= end;
                if (segmentEncasesRequestedRange) {
                    // Nothing to load
                    return;
                }
            }
        }
        this.source.onread?.(start, end);
        const bytesPromise = this.source._read(start, end);
        const loadingSegment = {
            start,
            end,
            promise: bytesPromise
        };
        this.loadingSegments.push(loadingSegment);
        const bytes = await bytesPromise;
        removeItem(this.loadingSegments, loadingSegment);
        this.insertIntoLoadedSegments(start, bytes);
    }
    rangeIsLoaded(start, end) {
        if (end <= start) {
            return true;
        }
        const index = binarySearchLessOrEqual(this.loadedSegments, start, (x)=>x.start);
        if (index === -1) {
            return false;
        }
        for(let i = index; i < this.loadedSegments.length; i++){
            const segment = this.loadedSegments[i];
            if (segment.start > start) {
                break;
            }
            const segmentEncasesRequestedRange = segment.end >= end;
            if (segmentEncasesRequestedRange) {
                return true;
            }
        }
        return false;
    }
    insertIntoLoadedSegments(start, bytes) {
        const segment = {
            start,
            end: start + bytes.byteLength,
            bytes,
            view: new DataView(bytes.buffer),
            age: this.nextAge++
        };
        let index = binarySearchLessOrEqual(this.loadedSegments, start, (x)=>x.start);
        if (index === -1 || this.loadedSegments[index].start < segment.start) {
            index++;
        }
        // Insert the segment at the right place so that the array remains sorted by start offset
        this.loadedSegments.splice(index, 0, segment);
        this.totalStoredBytes += bytes.byteLength;
        // Remove all other segments from the array that are completely covered by the newly-inserted segment
        for(let i = index + 1; i < this.loadedSegments.length; i++){
            const otherSegment = this.loadedSegments[i];
            if (otherSegment.start >= segment.end) {
                break;
            }
            if (segment.start <= otherSegment.start && otherSegment.end <= segment.end) {
                this.loadedSegments.splice(i, 1);
                i--;
            }
        }
        // If we overshoot the max amount of permitted bytes, let's start evicting the oldest segments
        while(this.totalStoredBytes > this.maxStorableBytes && this.loadedSegments.length > 1){
            let oldestSegment = null;
            let oldestSegmentIndex = -1;
            for(let i = 0; i < this.loadedSegments.length; i++){
                const candidate = this.loadedSegments[i];
                if (!oldestSegment || candidate.age < oldestSegment.age) {
                    oldestSegment = candidate;
                    oldestSegmentIndex = i;
                }
            }
            assert(oldestSegment);
            this.totalStoredBytes -= oldestSegment.bytes.byteLength;
            this.loadedSegments.splice(oldestSegmentIndex, 1);
        }
    }
    getViewAndOffset(start, end) {
        const startIndex = binarySearchLessOrEqual(this.loadedSegments, start, (x)=>x.start);
        let segment = null;
        if (startIndex !== -1) {
            for(let i = startIndex; i < this.loadedSegments.length; i++){
                const candidate = this.loadedSegments[i];
                if (candidate.start > start) {
                    break;
                }
                if (end <= candidate.end) {
                    segment = candidate;
                    break;
                }
            }
        }
        if (!segment) {
            throw new Error(`No segment loaded for range [${start}, ${end}).`);
        }
        segment.age = this.nextAge++;
        return {
            view: segment.view,
            offset: segment.bytes.byteOffset + start - segment.start
        };
    }
    forgetRange(start, end) {
        if (end <= start) {
            return;
        }
        const startIndex = binarySearchLessOrEqual(this.loadedSegments, start, (x)=>x.start);
        if (startIndex === -1) {
            return;
        }
        const segment = this.loadedSegments[startIndex];
        if (segment.start !== start || segment.end !== end) {
            return;
        }
        this.loadedSegments.splice(startIndex, 1);
        this.totalStoredBytes -= segment.bytes.byteLength;
    }
}

/*!
 * Copyright (c) 2025-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */ class RiffReader {
    constructor(reader){
        this.reader = reader;
        this.pos = 0;
        this.littleEndian = true;
    }
    readBytes(length) {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + length);
        this.pos += length;
        return new Uint8Array(view.buffer, offset, length);
    }
    readU16() {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + 2);
        this.pos += 2;
        return view.getUint16(offset, this.littleEndian);
    }
    readU32() {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + 4);
        this.pos += 4;
        return view.getUint32(offset, this.littleEndian);
    }
    readU64() {
        let low;
        let high;
        if (this.littleEndian) {
            low = this.readU32();
            high = this.readU32();
        } else {
            high = this.readU32();
            low = this.readU32();
        }
        return high * 0x100000000 + low;
    }
    readAscii(length) {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + length);
        this.pos += length;
        let str = '';
        for(let i = 0; i < length; i++){
            str += String.fromCharCode(view.getUint8(offset + i));
        }
        return str;
    }
}

var WaveFormat;
(function(WaveFormat) {
    WaveFormat[WaveFormat["PCM"] = 1] = "PCM";
    WaveFormat[WaveFormat["IEEE_FLOAT"] = 3] = "IEEE_FLOAT";
    WaveFormat[WaveFormat["ALAW"] = 6] = "ALAW";
    WaveFormat[WaveFormat["MULAW"] = 7] = "MULAW";
    WaveFormat[WaveFormat["EXTENSIBLE"] = 65534] = "EXTENSIBLE";
})(WaveFormat || (WaveFormat = {}));
class WaveDemuxer extends Demuxer {
    constructor(input){
        super(input);
        this.metadataPromise = null;
        this.dataStart = -1;
        this.dataSize = -1;
        this.audioInfo = null;
        this.tracks = [];
        this.metadataReader = new RiffReader(input._mainReader);
        this.chunkReader = new RiffReader(new Reader(input.source, 64 * 2 ** 20));
    }
    async readMetadata() {
        return this.metadataPromise ??= (async ()=>{
            const actualFileSize = await this.metadataReader.reader.source.getSize();
            const riffType = this.metadataReader.readAscii(4);
            this.metadataReader.littleEndian = riffType !== 'RIFX';
            const isRf64 = riffType === 'RF64';
            const outerChunkSize = this.metadataReader.readU32();
            let totalFileSize = isRf64 ? actualFileSize : Math.min(outerChunkSize + 8, actualFileSize);
            const format = this.metadataReader.readAscii(4);
            if (format !== 'WAVE') {
                throw new Error('Invalid WAVE file - wrong format');
            }
            this.metadataReader.pos = 12;
            let chunksRead = 0;
            let dataChunkSize = null;
            while(this.metadataReader.pos < totalFileSize){
                await this.metadataReader.reader.loadRange(this.metadataReader.pos, this.metadataReader.pos + 8);
                const chunkId = this.metadataReader.readAscii(4);
                const chunkSize = this.metadataReader.readU32();
                const startPos = this.metadataReader.pos;
                if (isRf64 && chunksRead === 0 && chunkId !== 'ds64') {
                    throw new Error('Invalid RF64 file: First chunk must be "ds64".');
                }
                if (chunkId === 'fmt ') {
                    await this.parseFmtChunk(chunkSize);
                } else if (chunkId === 'data') {
                    dataChunkSize ??= chunkSize;
                    this.dataStart = this.metadataReader.pos;
                    this.dataSize = Math.min(dataChunkSize, totalFileSize - this.dataStart);
                } else if (chunkId === 'ds64') {
                    // File and data chunk sizes are defined in here instead
                    const riffChunkSize = this.metadataReader.readU64();
                    dataChunkSize = this.metadataReader.readU64();
                    totalFileSize = Math.min(riffChunkSize + 8, actualFileSize);
                }
                this.metadataReader.pos = startPos + chunkSize + (chunkSize & 1); // Handle padding
                chunksRead++;
            }
            if (!this.audioInfo) {
                throw new Error('Invalid WAVE file - missing "fmt " chunk');
            }
            if (this.dataStart === -1) {
                throw new Error('Invalid WAVE file - missing "data" chunk');
            }
            const blockSize = this.audioInfo.blockSizeInBytes;
            this.dataSize = Math.floor(this.dataSize / blockSize) * blockSize;
            this.tracks.push(new InputAudioTrack(new WaveAudioTrackBacking(this)));
        })();
    }
    async parseFmtChunk(size) {
        await this.metadataReader.reader.loadRange(this.metadataReader.pos, this.metadataReader.pos + size);
        let formatTag = this.metadataReader.readU16();
        const numChannels = this.metadataReader.readU16();
        const sampleRate = this.metadataReader.readU32();
        this.metadataReader.pos += 4; // Bytes per second
        const blockAlign = this.metadataReader.readU16();
        let bitsPerSample;
        if (size === 14) {
            bitsPerSample = 8;
        } else {
            bitsPerSample = this.metadataReader.readU16();
        }
        // Handle WAVEFORMATEXTENSIBLE
        if (size >= 18 && formatTag !== 0x0165) {
            const cbSize = this.metadataReader.readU16();
            const remainingSize = size - 18;
            const extensionSize = Math.min(remainingSize, cbSize);
            if (extensionSize >= 22 && formatTag === WaveFormat.EXTENSIBLE) {
                // Parse WAVEFORMATEXTENSIBLE
                this.metadataReader.pos += 2 + 4;
                const subFormat = this.metadataReader.readBytes(16);
                // Get actual format from subFormat GUID
                formatTag = subFormat[0] | subFormat[1] << 8;
            }
        }
        if (formatTag === WaveFormat.MULAW || formatTag === WaveFormat.ALAW) {
            bitsPerSample = 8;
        }
        this.audioInfo = {
            format: formatTag,
            numberOfChannels: numChannels,
            sampleRate,
            sampleSizeInBytes: Math.ceil(bitsPerSample / 8),
            blockSizeInBytes: blockAlign
        };
    }
    getCodec() {
        assert(this.audioInfo);
        if (this.audioInfo.format === WaveFormat.MULAW) {
            return 'ulaw';
        }
        if (this.audioInfo.format === WaveFormat.ALAW) {
            return 'alaw';
        }
        if (this.audioInfo.format === WaveFormat.PCM) {
            // All formats are little-endian
            if (this.audioInfo.sampleSizeInBytes === 1) {
                return 'pcm-u8';
            } else if (this.audioInfo.sampleSizeInBytes === 2) {
                return 'pcm-s16';
            } else if (this.audioInfo.sampleSizeInBytes === 3) {
                return 'pcm-s24';
            } else if (this.audioInfo.sampleSizeInBytes === 4) {
                return 'pcm-s32';
            }
        }
        if (this.audioInfo.format === WaveFormat.IEEE_FLOAT) {
            if (this.audioInfo.sampleSizeInBytes === 4) {
                return 'pcm-f32';
            }
        }
        return null;
    }
    async getMimeType() {
        return 'audio/wav';
    }
    async computeDuration() {
        await this.readMetadata();
        assert(this.audioInfo);
        const numberOfBlocks = this.dataSize / this.audioInfo.blockSizeInBytes;
        return numberOfBlocks / this.audioInfo.sampleRate;
    }
    async getTracks() {
        await this.readMetadata();
        return this.tracks;
    }
}
const PACKET_SIZE_IN_FRAMES = 2048;
class WaveAudioTrackBacking {
    constructor(demuxer){
        this.demuxer = demuxer;
    }
    getId() {
        return 1;
    }
    getCodec() {
        return this.demuxer.getCodec();
    }
    async getDecoderConfig() {
        const codec = this.demuxer.getCodec();
        if (!codec) {
            return null;
        }
        assert(this.demuxer.audioInfo);
        return {
            codec,
            numberOfChannels: this.demuxer.audioInfo.numberOfChannels,
            sampleRate: this.demuxer.audioInfo.sampleRate
        };
    }
    computeDuration() {
        return this.demuxer.computeDuration();
    }
    getNumberOfChannels() {
        assert(this.demuxer.audioInfo);
        return this.demuxer.audioInfo.numberOfChannels;
    }
    getSampleRate() {
        assert(this.demuxer.audioInfo);
        return this.demuxer.audioInfo.sampleRate;
    }
    getTimeResolution() {
        assert(this.demuxer.audioInfo);
        return this.demuxer.audioInfo.sampleRate;
    }
    getLanguageCode() {
        return UNDETERMINED_LANGUAGE;
    }
    async getFirstTimestamp() {
        return 0;
    }
    async getPacketAtIndex(packetIndex, options) {
        assert(this.demuxer.audioInfo);
        const startOffset = packetIndex * PACKET_SIZE_IN_FRAMES * this.demuxer.audioInfo.blockSizeInBytes;
        if (startOffset >= this.demuxer.dataSize) {
            return null;
        }
        const sizeInBytes = Math.min(PACKET_SIZE_IN_FRAMES * this.demuxer.audioInfo.blockSizeInBytes, this.demuxer.dataSize - startOffset);
        let data;
        if (options.metadataOnly) {
            data = PLACEHOLDER_DATA;
        } else {
            const sizeOfOnePacket = PACKET_SIZE_IN_FRAMES * this.demuxer.audioInfo.blockSizeInBytes;
            const chunkSize = Math.ceil(2 ** 19 / sizeOfOnePacket) * sizeOfOnePacket;
            const chunkStart = Math.floor(startOffset / chunkSize) * chunkSize;
            const chunkEnd = chunkStart + chunkSize;
            // Always load large 0.5 MiB chunks instead of just the required packet
            await this.demuxer.chunkReader.reader.loadRange(this.demuxer.dataStart + chunkStart, this.demuxer.dataStart + chunkEnd);
            this.demuxer.chunkReader.pos = this.demuxer.dataStart + startOffset;
            data = this.demuxer.chunkReader.readBytes(sizeInBytes);
        }
        const timestamp = packetIndex * PACKET_SIZE_IN_FRAMES / this.demuxer.audioInfo.sampleRate;
        const duration = sizeInBytes / this.demuxer.audioInfo.blockSizeInBytes / this.demuxer.audioInfo.sampleRate;
        return new EncodedPacket(data, 'key', timestamp, duration, packetIndex, sizeInBytes);
    }
    getFirstPacket(options) {
        return this.getPacketAtIndex(0, options);
    }
    getPacket(timestamp, options) {
        assert(this.demuxer.audioInfo);
        const packetIndex = Math.floor(timestamp * this.demuxer.audioInfo.sampleRate / PACKET_SIZE_IN_FRAMES);
        return this.getPacketAtIndex(packetIndex, options);
    }
    getNextPacket(packet, options) {
        assert(this.demuxer.audioInfo);
        const packetIndex = Math.round(packet.timestamp * this.demuxer.audioInfo.sampleRate / PACKET_SIZE_IN_FRAMES);
        return this.getPacketAtIndex(packetIndex + 1, options);
    }
    getKeyPacket(timestamp, options) {
        return this.getPacket(timestamp, options);
    }
    getNextKeyPacket(packet, options) {
        return this.getNextPacket(packet, options);
    }
}

/*!
 * Copyright (c) 2025-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */ class RiffWriter {
    constructor(writer){
        this.writer = writer;
        this.helper = new Uint8Array(8);
        this.helperView = new DataView(this.helper.buffer);
    }
    writeU16(value) {
        this.helperView.setUint16(0, value, true);
        this.writer.write(this.helper.subarray(0, 2));
    }
    writeU32(value) {
        this.helperView.setUint32(0, value, true);
        this.writer.write(this.helper.subarray(0, 4));
    }
    writeU64(value) {
        this.helperView.setUint32(0, value, true);
        this.helperView.setUint32(4, Math.floor(value / 2 ** 32), true);
        this.writer.write(this.helper);
    }
    writeAscii(text) {
        this.writer.write(new TextEncoder().encode(text));
    }
}

class WaveMuxer extends Muxer {
    constructor(output, format){
        super(output);
        this.headerWritten = false;
        this.dataSize = 0;
        this.sampleRate = null;
        this.sampleCount = 0;
        this.format = format;
        this.writer = output._writer;
        this.riffWriter = new RiffWriter(output._writer);
        this.isRf64 = !!format._options.large;
    }
    async start() {
    // Nothing needed here - we'll write the header with the first sample
    }
    async getMimeType() {
        return 'audio/wav';
    }
    async addEncodedVideoPacket() {
        throw new Error('WAVE does not support video.');
    }
    async addEncodedAudioPacket(track, packet, meta) {
        const release = await this.mutex.acquire();
        try {
            if (!this.headerWritten) {
                validateAudioChunkMetadata(meta);
                assert(meta);
                assert(meta.decoderConfig);
                this.writeHeader(track, meta.decoderConfig);
                this.sampleRate = meta.decoderConfig.sampleRate;
                this.headerWritten = true;
            }
            this.validateAndNormalizeTimestamp(track, packet.timestamp, packet.type === 'key');
            if (!this.isRf64 && this.writer.getPos() + packet.data.byteLength >= 2 ** 32) {
                throw new Error('Adding more audio data would exceed the maximum RIFF size of 4 GiB. To write larger files, use' + ' RF64 by setting `large: true` in the WavOutputFormatOptions.');
            }
            this.writer.write(packet.data);
            this.dataSize += packet.data.byteLength;
            this.sampleCount += Math.round(packet.duration * this.sampleRate);
            await this.writer.flush();
        } finally{
            release();
        }
    }
    async addSubtitleCue() {
        throw new Error('WAVE does not support subtitles.');
    }
    writeHeader(track, config) {
        if (this.format._options.onHeader) {
            this.writer.startTrackingWrites();
        }
        let format;
        const codec = track.source._codec;
        const pcmInfo = parsePcmCodec(codec);
        if (pcmInfo.dataType === 'ulaw') {
            format = WaveFormat.MULAW;
        } else if (pcmInfo.dataType === 'alaw') {
            format = WaveFormat.ALAW;
        } else if (pcmInfo.dataType === 'float') {
            format = WaveFormat.IEEE_FLOAT;
        } else {
            format = WaveFormat.PCM;
        }
        const channels = config.numberOfChannels;
        const sampleRate = config.sampleRate;
        const blockSize = pcmInfo.sampleSize * channels;
        // RIFF header
        this.riffWriter.writeAscii(this.isRf64 ? 'RF64' : 'RIFF');
        if (this.isRf64) {
            this.riffWriter.writeU32(0xffffffff); // Not used in RF64
        } else {
            this.riffWriter.writeU32(0); // File size placeholder
        }
        this.riffWriter.writeAscii('WAVE');
        if (this.isRf64) {
            this.riffWriter.writeAscii('ds64');
            this.riffWriter.writeU32(28); // Chunk size
            this.riffWriter.writeU64(0); // RIFF size placeholder
            this.riffWriter.writeU64(0); // Data size placeholder
            this.riffWriter.writeU64(0); // Sample count placeholder
            this.riffWriter.writeU32(0); // Table length
        // Empty table
        }
        // fmt chunk
        this.riffWriter.writeAscii('fmt ');
        this.riffWriter.writeU32(16); // Chunk size
        this.riffWriter.writeU16(format);
        this.riffWriter.writeU16(channels);
        this.riffWriter.writeU32(sampleRate);
        this.riffWriter.writeU32(sampleRate * blockSize); // Bytes per second
        this.riffWriter.writeU16(blockSize);
        this.riffWriter.writeU16(8 * pcmInfo.sampleSize);
        // data chunk
        this.riffWriter.writeAscii('data');
        if (this.isRf64) {
            this.riffWriter.writeU32(0xffffffff); // Not used in RF64
        } else {
            this.riffWriter.writeU32(0); // Data size placeholder
        }
        if (this.format._options.onHeader) {
            const { data, start } = this.writer.stopTrackingWrites();
            this.format._options.onHeader(data, start);
        }
    }
    async finalize() {
        const release = await this.mutex.acquire();
        const endPos = this.writer.getPos();
        if (this.isRf64) {
            // Write riff size
            this.writer.seek(20);
            this.riffWriter.writeU64(endPos - 8);
            // Write data size
            this.writer.seek(28);
            this.riffWriter.writeU64(this.dataSize);
            // Write sample count
            this.writer.seek(36);
            this.riffWriter.writeU64(this.sampleCount);
        } else {
            // Write file size
            this.writer.seek(4);
            this.riffWriter.writeU32(endPos - 8);
            // Write data chunk size
            this.writer.seek(40);
            this.riffWriter.writeU32(this.dataSize);
        }
        this.writer.seek(endPos);
        release();
    }
}

/**
 * Base class representing an output media file format.
 * @public
 */ class OutputFormat {
    /** Returns a list of video codecs that this output format can contain. */ getSupportedVideoCodecs() {
        return this.getSupportedCodecs().filter((codec)=>VIDEO_CODECS.includes(codec));
    }
    /** Returns a list of audio codecs that this output format can contain. */ getSupportedAudioCodecs() {
        return this.getSupportedCodecs().filter((codec)=>AUDIO_CODECS.includes(codec));
    }
    /** Returns a list of subtitle codecs that this output format can contain. */ getSupportedSubtitleCodecs() {
        return this.getSupportedCodecs().filter((codec)=>SUBTITLE_CODECS.includes(codec));
    }
    /** @internal */ // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _codecUnsupportedHint(codec) {
        return '';
    }
}
/**
 * Format representing files compatible with the ISO base media file format (ISOBMFF), like MP4 or MOV files.
 * @public
 */ class IsobmffOutputFormat extends OutputFormat {
    constructor(options = {}){
        if (!options || typeof options !== 'object') {
            throw new TypeError('options must be an object.');
        }
        if (options.fastStart !== undefined && ![
            false,
            'in-memory',
            'fragmented'
        ].includes(options.fastStart)) {
            throw new TypeError('options.fastStart, when provided, must be false, "in-memory", or "fragmented".');
        }
        if (options.minimumFragmentDuration !== undefined && (!Number.isFinite(options.minimumFragmentDuration) || options.minimumFragmentDuration < 0)) {
            throw new TypeError('options.minimumFragmentDuration, when provided, must be a non-negative number.');
        }
        if (options.onFtyp !== undefined && typeof options.onFtyp !== 'function') {
            throw new TypeError('options.onFtyp, when provided, must be a function.');
        }
        if (options.onMoov !== undefined && typeof options.onMoov !== 'function') {
            throw new TypeError('options.onMoov, when provided, must be a function.');
        }
        if (options.onMdat !== undefined && typeof options.onMdat !== 'function') {
            throw new TypeError('options.onMdat, when provided, must be a function.');
        }
        if (options.onMoof !== undefined && typeof options.onMoof !== 'function') {
            throw new TypeError('options.onMoof, when provided, must be a function.');
        }
        super();
        this._options = options;
    }
    getSupportedTrackCounts() {
        return {
            video: {
                min: 0,
                max: Infinity
            },
            audio: {
                min: 0,
                max: Infinity
            },
            subtitle: {
                min: 0,
                max: Infinity
            },
            total: {
                min: 1,
                max: 2 ** 32 - 1
            }
        };
    }
    get supportsVideoRotationMetadata() {
        return true;
    }
    /** @internal */ _createMuxer(output) {
        return new IsobmffMuxer(output, this);
    }
}
/**
 * MPEG-4 Part 14 (MP4) file format. Supports all codecs except PCM audio codecs.
 * @public
 */ class Mp4OutputFormat extends IsobmffOutputFormat {
    /** @internal */ get _name() {
        return 'MP4';
    }
    get fileExtension() {
        return '.mp4';
    }
    get mimeType() {
        return 'video/mp4';
    }
    getSupportedCodecs() {
        return [
            ...VIDEO_CODECS,
            ...NON_PCM_AUDIO_CODECS,
            // These are supported via ISO/IEC 23003-5
            'pcm-s16',
            'pcm-s16be',
            'pcm-s24',
            'pcm-s24be',
            'pcm-s32',
            'pcm-s32be',
            'pcm-f32',
            'pcm-f32be',
            'pcm-f64',
            'pcm-f64be',
            ...SUBTITLE_CODECS
        ];
    }
    /** @internal */ _codecUnsupportedHint(codec) {
        if (new MovOutputFormat().getSupportedCodecs().includes(codec)) {
            return ' Switching to MOV will grant support for this codec.';
        }
        return '';
    }
}
/**
 * QuickTime File Format (QTFF), often called MOV. Supports all video and audio codecs, but not subtitle codecs.
 * @public
 */ class MovOutputFormat extends IsobmffOutputFormat {
    /** @internal */ get _name() {
        return 'MOV';
    }
    get fileExtension() {
        return '.mov';
    }
    get mimeType() {
        return 'video/quicktime';
    }
    getSupportedCodecs() {
        return [
            ...VIDEO_CODECS,
            ...AUDIO_CODECS
        ];
    }
    /** @internal */ _codecUnsupportedHint(codec) {
        if (new Mp4OutputFormat().getSupportedCodecs().includes(codec)) {
            return ' Switching to MP4 will grant support for this codec.';
        }
        return '';
    }
}
/**
 * Matroska file format.
 * @public
 */ class MkvOutputFormat extends OutputFormat {
    constructor(options = {}){
        if (!options || typeof options !== 'object') {
            throw new TypeError('options must be an object.');
        }
        if (options.appendOnly !== undefined && typeof options.appendOnly !== 'boolean') {
            throw new TypeError('options.appendOnly, when provided, must be a boolean.');
        }
        if (options.minimumClusterDuration !== undefined && (!Number.isFinite(options.minimumClusterDuration) || options.minimumClusterDuration < 0)) {
            throw new TypeError('options.minimumClusterDuration, when provided, must be a non-negative number.');
        }
        if (options.onEbmlHeader !== undefined && typeof options.onEbmlHeader !== 'function') {
            throw new TypeError('options.onEbmlHeader, when provided, must be a function.');
        }
        if (options.onSegmentHeader !== undefined && typeof options.onSegmentHeader !== 'function') {
            throw new TypeError('options.onHeader, when provided, must be a function.');
        }
        if (options.onCluster !== undefined && typeof options.onCluster !== 'function') {
            throw new TypeError('options.onCluster, when provided, must be a function.');
        }
        super();
        this._options = options;
    }
    /** @internal */ _createMuxer(output) {
        return new MatroskaMuxer(output, this);
    }
    /** @internal */ get _name() {
        return 'Matroska';
    }
    getSupportedTrackCounts() {
        return {
            video: {
                min: 0,
                max: Infinity
            },
            audio: {
                min: 0,
                max: Infinity
            },
            subtitle: {
                min: 0,
                max: Infinity
            },
            total: {
                min: 1,
                max: 127
            }
        };
    }
    get fileExtension() {
        return '.mkv';
    }
    get mimeType() {
        return 'video/x-matroska';
    }
    getSupportedCodecs() {
        return [
            ...VIDEO_CODECS,
            ...NON_PCM_AUDIO_CODECS,
            ...PCM_AUDIO_CODECS.filter((codec)=>![
                    'pcm-s8',
                    'pcm-f32be',
                    'pcm-f64be',
                    'ulaw',
                    'alaw'
                ].includes(codec)),
            ...SUBTITLE_CODECS
        ];
    }
    get supportsVideoRotationMetadata() {
        // While it technically does support it with ProjectionPoseRoll, many players appear to ignore this value
        return false;
    }
}
/**
 * WebM file format, based on Matroska.
 * @public
 */ class WebMOutputFormat extends MkvOutputFormat {
    getSupportedCodecs() {
        return [
            ...VIDEO_CODECS.filter((codec)=>[
                    'vp8',
                    'vp9',
                    'av1'
                ].includes(codec)),
            ...AUDIO_CODECS.filter((codec)=>[
                    'opus',
                    'vorbis'
                ].includes(codec)),
            ...SUBTITLE_CODECS
        ];
    }
    /** @internal */ get _name() {
        return 'WebM';
    }
    get fileExtension() {
        return '.webm';
    }
    get mimeType() {
        return 'video/webm';
    }
    /** @internal */ _codecUnsupportedHint(codec) {
        if (new MkvOutputFormat().getSupportedCodecs().includes(codec)) {
            return ' Switching to MKV will grant support for this codec.';
        }
        return '';
    }
}
/**
 * MP3 file format.
 * @public
 */ class Mp3OutputFormat extends OutputFormat {
    constructor(options = {}){
        if (!options || typeof options !== 'object') {
            throw new TypeError('options must be an object.');
        }
        if (options.onXingFrame !== undefined && typeof options.onXingFrame !== 'function') {
            throw new TypeError('options.onXingFrame, when provided, must be a function.');
        }
        super();
        this._options = options;
    }
    /** @internal */ _createMuxer(output) {
        return new Mp3Muxer(output, this);
    }
    /** @internal */ get _name() {
        return 'MP3';
    }
    getSupportedTrackCounts() {
        return {
            video: {
                min: 0,
                max: 0
            },
            audio: {
                min: 1,
                max: 1
            },
            subtitle: {
                min: 0,
                max: 0
            },
            total: {
                min: 1,
                max: 1
            }
        };
    }
    get fileExtension() {
        return '.mp3';
    }
    get mimeType() {
        return 'audio/mpeg';
    }
    getSupportedCodecs() {
        return [
            'mp3'
        ];
    }
    get supportsVideoRotationMetadata() {
        return false;
    }
}
/**
 * WAVE file format, based on RIFF.
 * @public
 */ class WavOutputFormat extends OutputFormat {
    constructor(options = {}){
        if (!options || typeof options !== 'object') {
            throw new TypeError('options must be an object.');
        }
        if (options.large !== undefined && typeof options.large !== 'boolean') {
            throw new TypeError('options.large, when provided, must be a boolean.');
        }
        if (options.onHeader !== undefined && typeof options.onHeader !== 'function') {
            throw new TypeError('options.onHeader, when provided, must be a function.');
        }
        super();
        this._options = options;
    }
    /** @internal */ _createMuxer(output) {
        return new WaveMuxer(output, this);
    }
    /** @internal */ get _name() {
        return 'WAVE';
    }
    getSupportedTrackCounts() {
        return {
            video: {
                min: 0,
                max: 0
            },
            audio: {
                min: 1,
                max: 1
            },
            subtitle: {
                min: 0,
                max: 0
            },
            total: {
                min: 1,
                max: 1
            }
        };
    }
    get fileExtension() {
        return '.wav';
    }
    get mimeType() {
        return 'audio/wav';
    }
    getSupportedCodecs() {
        return [
            ...PCM_AUDIO_CODECS.filter((codec)=>[
                    'pcm-s16',
                    'pcm-s24',
                    'pcm-s32',
                    'pcm-f32',
                    'pcm-u8',
                    'ulaw',
                    'alaw'
                ].includes(codec))
        ];
    }
    get supportsVideoRotationMetadata() {
        return false;
    }
}
/**
 * Ogg file format.
 * @public
 */ class OggOutputFormat extends OutputFormat {
    constructor(options = {}){
        if (!options || typeof options !== 'object') {
            throw new TypeError('options must be an object.');
        }
        if (options.onPage !== undefined && typeof options.onPage !== 'function') {
            throw new TypeError('options.onPage, when provided, must be a function.');
        }
        super();
        this._options = options;
    }
    /** @internal */ _createMuxer(output) {
        return new OggMuxer(output, this);
    }
    /** @internal */ get _name() {
        return 'Ogg';
    }
    getSupportedTrackCounts() {
        return {
            video: {
                min: 0,
                max: 0
            },
            audio: {
                min: 0,
                max: Infinity
            },
            subtitle: {
                min: 0,
                max: 0
            },
            total: {
                min: 1,
                max: 2 ** 32
            }
        };
    }
    get fileExtension() {
        return '.ogg';
    }
    get mimeType() {
        return 'application/ogg';
    }
    getSupportedCodecs() {
        return [
            ...AUDIO_CODECS.filter((codec)=>[
                    'vorbis',
                    'opus'
                ].includes(codec))
        ];
    }
    get supportsVideoRotationMetadata() {
        return false;
    }
}

/**
 * Base class for media sources. Media sources are used to add media samples to an output file.
 * @public
 */ class MediaSource {
    constructor(){
        /** @internal */ this._connectedTrack = null;
        /** @internal */ this._closingPromise = null;
        /** @internal */ this._closed = false;
        /**
         * @internal
         * A time offset in seconds that is added to all timestamps generated by this source.
         */ this._timestampOffset = 0;
    }
    /** @internal */ _ensureValidAdd() {
        if (!this._connectedTrack) {
            throw new Error('Source is not connected to an output track.');
        }
        if (this._connectedTrack.output.state === 'canceled') {
            throw new Error('Output has been canceled.');
        }
        if (this._connectedTrack.output.state === 'finalizing' || this._connectedTrack.output.state === 'finalized') {
            throw new Error('Output has been finalized.');
        }
        if (this._connectedTrack.output.state === 'pending') {
            throw new Error('Output has not started.');
        }
        if (this._closed) {
            throw new Error('Source is closed.');
        }
    }
    /** @internal */ async _start() {}
    /** @internal */ async _flushAndClose() {}
    /**
     * Closes this source. This prevents future samples from being added and signals to the output file that no further
     * samples will come in for this track. Calling `.close()` is optional but recommended after adding the
     * last sample - for improved performance and reduced memory usage.
     */ close() {
        if (this._closingPromise) {
            return;
        }
        const connectedTrack = this._connectedTrack;
        if (!connectedTrack) {
            throw new Error('Cannot call close without connecting the source to an output track.');
        }
        if (connectedTrack.output.state === 'pending') {
            throw new Error('Cannot call close before output has been started.');
        }
        this._closingPromise = (async ()=>{
            await this._flushAndClose();
            this._closed = true;
            if (connectedTrack.output.state === 'finalizing' || connectedTrack.output.state === 'finalized') {
                return;
            }
            connectedTrack.output._muxer.onTrackClose(connectedTrack);
        })();
    }
    /** @internal */ async _flushOrWaitForClose() {
        if (this._closingPromise) {
            // Since closing also flushes, we don't want to do it twice
            return this._closingPromise;
        } else {
            return this._flushAndClose();
        }
    }
}
/**
 * Base class for video sources - sources for video tracks.
 * @public
 */ class VideoSource extends MediaSource {
    constructor(codec){
        super();
        /** @internal */ this._connectedTrack = null;
        if (!VIDEO_CODECS.includes(codec)) {
            throw new TypeError(`Invalid video codec '${codec}'. Must be one of: ${VIDEO_CODECS.join(', ')}.`);
        }
        this._codec = codec;
    }
}
/**
 * The most basic video source; can be used to directly pipe encoded packets into the output file.
 * @public
 */ class EncodedVideoPacketSource extends VideoSource {
    constructor(codec){
        super(codec);
    }
    /**
     * Adds an encoded packet to the output video track.
     *
     * @param meta - Additional metadata from the encoder. You should pass this for the first call, including a valid
     * decoder config.
     *
     * @returns A Promise that resolves once the output is ready to receive more samples. You should await this Promise
     * to respect writer and encoder backpressure.
     */ add(packet, meta) {
        if (!(packet instanceof EncodedPacket)) {
            throw new TypeError('packet must be an EncodedPacket.');
        }
        if (packet.isMetadataOnly) {
            throw new TypeError('Metadata-only packets cannot be added.');
        }
        if (meta !== undefined && (!meta || typeof meta !== 'object')) {
            throw new TypeError('meta, when provided, must be an object.');
        }
        this._ensureValidAdd();
        return this._connectedTrack.output._muxer.addEncodedVideoPacket(this._connectedTrack, packet, meta);
    }
}
const validateVideoEncodingConfig = (config)=>{
    if (!config || typeof config !== 'object') {
        throw new TypeError('Encoding config must be an object.');
    }
    if (!VIDEO_CODECS.includes(config.codec)) {
        throw new TypeError(`Invalid video codec '${config.codec}'. Must be one of: ${VIDEO_CODECS.join(', ')}.`);
    }
    if (!(config.bitrate instanceof Quality) && (!Number.isInteger(config.bitrate) || config.bitrate <= 0)) {
        throw new TypeError('config.bitrate must be a positive integer or a quality.');
    }
    if (config.latencyMode !== undefined && ![
        'quality',
        'realtime'
    ].includes(config.latencyMode)) {
        throw new TypeError('config.latencyMode, when provided, must be \'quality\' or \'realtime\'.');
    }
    if (config.keyFrameInterval !== undefined && (!Number.isFinite(config.keyFrameInterval) || config.keyFrameInterval < 0)) {
        throw new TypeError('config.keyFrameInterval, when provided, must be a non-negative number.');
    }
    if (config.fullCodecString !== undefined && typeof config.fullCodecString !== 'string') {
        throw new TypeError('config.fullCodecString, when provided, must be a string.');
    }
    if (config.fullCodecString !== undefined && inferCodecFromCodecString(config.fullCodecString) !== config.codec) {
        throw new TypeError(`config.fullCodecString, when provided, must be a string that matches the specified codec` + ` (${config.codec}).`);
    }
    if (config.onEncodedPacket !== undefined && typeof config.onEncodedPacket !== 'function') {
        throw new TypeError('config.onEncodedChunk, when provided, must be a function.');
    }
    if (config.onEncoderConfig !== undefined && typeof config.onEncoderConfig !== 'function') {
        throw new TypeError('config.onEncoderConfig, when provided, must be a function.');
    }
};
class VideoEncoderWrapper {
    constructor(source, encodingConfig){
        this.source = source;
        this.encodingConfig = encodingConfig;
        this.ensureEncoderPromise = null;
        this.encoderInitialized = false;
        this.encoder = null;
        this.muxer = null;
        this.lastMultipleOfKeyFrameInterval = -1;
        this.lastWidth = null;
        this.lastHeight = null;
        this.customEncoder = null;
        this.customEncoderCallSerializer = new CallSerializer();
        this.customEncoderQueueSize = 0;
        /**
         * Encoders typically throw their errors "out of band", meaning asynchronously in some other execution context.
         * However, we want to surface these errors to the user within the normal control flow, so they don't go uncaught.
         * So, we keep track of the encoder error and throw it as soon as we get the chance.
         */ this.encoderError = null;
    }
    async add(videoSample, shouldClose, encodeOptions) {
        try {
            this.checkForEncoderError();
            this.source._ensureValidAdd();
            // Ensure video sample size remains constant
            if (this.lastWidth !== null && this.lastHeight !== null) {
                if (videoSample.codedWidth !== this.lastWidth || videoSample.codedHeight !== this.lastHeight) {
                    throw new Error(`Video sample size must remain constant. Expected ${this.lastWidth}x${this.lastHeight},` + ` got ${videoSample.codedWidth}x${videoSample.codedHeight}.`);
                }
            } else {
                this.lastWidth = videoSample.codedWidth;
                this.lastHeight = videoSample.codedHeight;
            }
            if (!this.encoderInitialized) {
                if (!this.ensureEncoderPromise) {
                    void this.ensureEncoder(videoSample);
                }
                // No, this "if" statement is not useless. Sometimes, the above call to `ensureEncoder` might have
                // synchronously completed and the encoder is already initialized. In this case, we don't need to await
                // the promise anymore. This also fixes nasty async race condition bugs when multiple code paths are
                // calling this method: It's important that the call that initialized the encoder go through this
                // code first.
                if (!this.encoderInitialized) {
                    await this.ensureEncoderPromise;
                }
            }
            assert(this.encoderInitialized);
            const keyFrameInterval = this.encodingConfig.keyFrameInterval ?? 5;
            const multipleOfKeyFrameInterval = Math.floor(videoSample.timestamp / keyFrameInterval);
            // Ensure a key frame every keyFrameInterval seconds. It is important that all video tracks follow the same
            // "key frame" rhythm, because aligned key frames are required to start new fragments in ISOBMFF or clusters
            // in Matroska (or at least desirable).
            const finalEncodeOptions = {
                ...encodeOptions,
                keyFrame: encodeOptions?.keyFrame || keyFrameInterval === 0 || multipleOfKeyFrameInterval !== this.lastMultipleOfKeyFrameInterval
            };
            this.lastMultipleOfKeyFrameInterval = multipleOfKeyFrameInterval;
            if (this.customEncoder) {
                this.customEncoderQueueSize++;
                const promise = this.customEncoderCallSerializer.call(()=>this.customEncoder.encode(videoSample, finalEncodeOptions)).then(()=>{
                    this.customEncoderQueueSize--;
                    if (shouldClose) {
                        videoSample.close();
                    }
                }).catch((error)=>{
                    this.encoderError ??= error;
                });
                if (this.customEncoderQueueSize >= 4) {
                    await promise;
                }
            } else {
                assert(this.encoder);
                const videoFrame = videoSample.toVideoFrame();
                this.encoder.encode(videoFrame, finalEncodeOptions);
                videoFrame.close();
                if (shouldClose) {
                    videoSample.close();
                }
                // We need to do this after sending the frame to the encoder as the frame otherwise might be closed
                if (this.encoder.encodeQueueSize >= 4) {
                    await new Promise((resolve)=>this.encoder.addEventListener('dequeue', resolve, {
                            once: true
                        }));
                }
            }
            await this.muxer.mutex.currentPromise; // Allow the writer to apply backpressure
        } finally{
            if (shouldClose) {
                // Make sure it's always closed, even if there was an error
                videoSample.close();
            }
        }
    }
    async ensureEncoder(videoSample) {
        if (this.encoder) {
            return;
        }
        return this.ensureEncoderPromise = (async ()=>{
            const width = videoSample.codedWidth;
            const height = videoSample.codedHeight;
            const bitrate = this.encodingConfig.bitrate instanceof Quality ? this.encodingConfig.bitrate._toVideoBitrate(this.encodingConfig.codec, width, height) : this.encodingConfig.bitrate;
            const encoderConfig = {
                codec: this.encodingConfig.fullCodecString ?? buildVideoCodecString(this.encodingConfig.codec, width, height, bitrate),
                width,
                height,
                bitrate,
                framerate: this.source._connectedTrack?.metadata.frameRate,
                latencyMode: this.encodingConfig.latencyMode,
                ...getVideoEncoderConfigExtension(this.encodingConfig.codec)
            };
            this.encodingConfig.onEncoderConfig?.(encoderConfig);
            const MatchingCustomEncoder = customVideoEncoders.find((x)=>x.supports(this.encodingConfig.codec, encoderConfig));
            if (MatchingCustomEncoder) {
                // @ts-expect-error "Can't create instance of abstract class 🤓"
                this.customEncoder = new MatchingCustomEncoder();
                // @ts-expect-error It's technically readonly
                this.customEncoder.codec = this.encodingConfig.codec;
                // @ts-expect-error It's technically readonly
                this.customEncoder.config = encoderConfig;
                // @ts-expect-error It's technically readonly
                this.customEncoder.onPacket = (packet, meta)=>{
                    if (!(packet instanceof EncodedPacket)) {
                        throw new TypeError('The first argument passed to onPacket must be an EncodedPacket.');
                    }
                    if (meta !== undefined && (!meta || typeof meta !== 'object')) {
                        throw new TypeError('The second argument passed to onPacket must be an object or undefined.');
                    }
                    this.encodingConfig.onEncodedPacket?.(packet, meta);
                    void this.muxer.addEncodedVideoPacket(this.source._connectedTrack, packet, meta);
                };
                await this.customEncoder.init();
            } else {
                if (typeof VideoEncoder === 'undefined') {
                    throw new Error('VideoEncoder is not supported by this browser.');
                }
                const support = await VideoEncoder.isConfigSupported(encoderConfig);
                if (!support.supported) {
                    throw new Error(`This specific encoder configuration (${encoderConfig.codec}, ${encoderConfig.bitrate} bps,` + ` ${encoderConfig.width}x${encoderConfig.height}) is not supported by this browser. Consider` + ` using another codec or changing your video parameters.`);
                }
                this.encoder = new VideoEncoder({
                    output: (chunk, meta)=>{
                        const packet = EncodedPacket.fromEncodedChunk(chunk);
                        this.encodingConfig.onEncodedPacket?.(packet, meta);
                        void this.muxer.addEncodedVideoPacket(this.source._connectedTrack, packet, meta);
                    },
                    error: (error)=>{
                        this.encoderError ??= error;
                    }
                });
                this.encoder.configure(encoderConfig);
            }
            assert(this.source._connectedTrack);
            this.muxer = this.source._connectedTrack.output._muxer;
            this.encoderInitialized = true;
        })();
    }
    async flushAndClose() {
        this.checkForEncoderError();
        if (this.customEncoder) {
            void this.customEncoderCallSerializer.call(()=>this.customEncoder.flush());
            await this.customEncoderCallSerializer.call(()=>this.customEncoder.close());
        } else if (this.encoder) {
            await this.encoder.flush();
            this.encoder.close();
        }
        this.checkForEncoderError();
    }
    getQueueSize() {
        if (this.customEncoder) {
            return this.customEncoderQueueSize;
        } else {
            return this.encoder?.encodeQueueSize ?? 0;
        }
    }
    checkForEncoderError() {
        if (this.encoderError) {
            this.encoderError.stack = new Error().stack; // Provide a more useful stack trace
            throw this.encoderError;
        }
    }
}
/**
 * This source can be used to add raw, unencoded video samples (frames) to an output video track. These frames will
 * automatically be encoded and then piped into the output.
 * @public
 */ class VideoSampleSource extends VideoSource {
    constructor(encodingConfig){
        validateVideoEncodingConfig(encodingConfig);
        super(encodingConfig.codec);
        this._encoder = new VideoEncoderWrapper(this, encodingConfig);
    }
    /**
     * Encodes a video sample (frame) and then adds it to the output.
     *
     * @returns A Promise that resolves once the output is ready to receive more samples. You should await this Promise
     * to respect writer and encoder backpressure.
     */ add(videoSample, encodeOptions) {
        if (!(videoSample instanceof VideoSample)) {
            throw new TypeError('videoSample must be a VideoSample.');
        }
        return this._encoder.add(videoSample, false, encodeOptions);
    }
    /** @internal */ _flushAndClose() {
        return this._encoder.flushAndClose();
    }
}
/**
 * This source can be used to add video frames to the output track from a fixed canvas element. Since canvases are often
 * used for rendering, this source provides a convenient wrapper around VideoSampleSource.
 * @public
 */ class CanvasSource extends VideoSource {
    constructor(canvas, encodingConfig){
        if (!(typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement) && !(typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas)) {
            throw new TypeError('canvas must be an HTMLCanvasElement or OffscreenCanvas.');
        }
        validateVideoEncodingConfig(encodingConfig);
        super(encodingConfig.codec);
        this._encoder = new VideoEncoderWrapper(this, encodingConfig);
        this._canvas = canvas;
    }
    /**
     * Captures the current canvas state as a video sample (frame), encodes it and adds it to the output.
     *
     * @param timestamp - The timestamp of the sample, in seconds.
     * @param duration - The duration of the sample, in seconds.
     *
     * @returns A Promise that resolves once the output is ready to receive more samples. You should await this Promise
     * to respect writer and encoder backpressure.
     */ add(timestamp, duration = 0, encodeOptions) {
        if (!Number.isFinite(timestamp) || timestamp < 0) {
            throw new TypeError('timestamp must be a non-negative number.');
        }
        if (!Number.isFinite(duration) || duration < 0) {
            throw new TypeError('duration must be a non-negative number.');
        }
        const sample = new VideoSample(this._canvas, {
            timestamp,
            duration
        });
        return this._encoder.add(sample, true, encodeOptions);
    }
    /** @internal */ _flushAndClose() {
        return this._encoder.flushAndClose();
    }
}
/**
 * Video source that encodes the frames of a MediaStreamVideoTrack and pipes them into the output. This is useful for
 * capturing live or real-time data such as webcams or screen captures. Frames will automatically start being captured
 * once the connected Output is started, and will keep being captured until the Output is finalized or this source
 * is closed.
 * @public
 */ class MediaStreamVideoTrackSource extends VideoSource {
    /** A promise that rejects upon any error within this source. This promise never resolves. */ get errorPromise() {
        this._errorPromiseAccessed = true;
        return this._promiseWithResolvers.promise;
    }
    constructor(track, encodingConfig){
        if (!(track instanceof MediaStreamTrack) || track.kind !== 'video') {
            throw new TypeError('track must be a video MediaStreamTrack.');
        }
        validateVideoEncodingConfig(encodingConfig);
        encodingConfig = {
            ...encodingConfig,
            latencyMode: 'realtime'
        };
        super(encodingConfig.codec);
        /** @internal */ this._abortController = null;
        /** @internal */ this._workerTrackId = null;
        /** @internal */ this._workerListener = null;
        /** @internal */ this._promiseWithResolvers = promiseWithResolvers();
        /** @internal */ this._errorPromiseAccessed = false;
        this._encoder = new VideoEncoderWrapper(this, encodingConfig);
        this._track = track;
    }
    /** @internal */ async _start() {
        if (!this._errorPromiseAccessed) {
            console.warn('Make sure not to ignore the `errorPromise` field on MediaStreamVideoTrackSource, so that any internal' + ' errors get bubbled up properly.');
        }
        this._abortController = new AbortController();
        let firstVideoFrameTimestamp = null;
        let errored = false;
        const onVideoFrame = (videoFrame)=>{
            if (errored) {
                videoFrame.close();
                return;
            }
            if (firstVideoFrameTimestamp === null) {
                firstVideoFrameTimestamp = videoFrame.timestamp / 1e6;
                const muxer = this._connectedTrack.output._muxer;
                if (muxer.firstMediaStreamTimestamp === null) {
                    muxer.firstMediaStreamTimestamp = performance.now() / 1000;
                    this._timestampOffset = -firstVideoFrameTimestamp;
                } else {
                    this._timestampOffset = performance.now() / 1000 - muxer.firstMediaStreamTimestamp - firstVideoFrameTimestamp;
                }
            }
            if (this._encoder.getQueueSize() >= 4) {
                // Drop frames if the encoder is overloaded
                videoFrame.close();
                return;
            }
            void this._encoder.add(new VideoSample(videoFrame), true).catch((error)=>{
                errored = true;
                this._abortController?.abort();
                this._promiseWithResolvers.reject(error);
                if (this._workerTrackId !== null) {
                    // Tell the worker to stop the track
                    sendMessageToMediaStreamTrackProcessorWorker({
                        type: 'stopTrack',
                        trackId: this._workerTrackId
                    });
                }
            });
        };
        if (typeof MediaStreamTrackProcessor !== 'undefined') {
            // We can do it here directly, perfect
            const processor = new MediaStreamTrackProcessor({
                track: this._track
            });
            const consumer = new WritableStream({
                write: onVideoFrame
            });
            processor.readable.pipeTo(consumer, {
                signal: this._abortController.signal
            }).catch((error)=>{
                // Handle AbortError silently
                if (error instanceof DOMException && error.name === 'AbortError') return;
                this._promiseWithResolvers.reject(error);
            });
        } else {
            // It might still be supported in a worker, so let's check that
            const supportedInWorker = await mediaStreamTrackProcessorIsSupportedInWorker();
            if (supportedInWorker) {
                this._workerTrackId = nextMediaStreamTrackProcessorWorkerId++;
                sendMessageToMediaStreamTrackProcessorWorker({
                    type: 'videoTrack',
                    trackId: this._workerTrackId,
                    track: this._track
                }, [
                    this._track
                ]);
                this._workerListener = (event)=>{
                    const message = event.data;
                    if (message.type === 'videoFrame' && message.trackId === this._workerTrackId) {
                        onVideoFrame(message.videoFrame);
                    } else if (message.type === 'error' && message.trackId === this._workerTrackId) {
                        this._promiseWithResolvers.reject(message.error);
                    }
                };
                mediaStreamTrackProcessorWorker.addEventListener('message', this._workerListener);
            } else {
                throw new Error('MediaStreamTrackProcessor is required but not supported by this browser.');
            }
        }
    }
    /** @internal */ async _flushAndClose() {
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }
        if (this._workerTrackId !== null) {
            assert(this._workerListener);
            sendMessageToMediaStreamTrackProcessorWorker({
                type: 'stopTrack',
                trackId: this._workerTrackId
            });
            // Wait for the worker to stop the track
            await new Promise((resolve)=>{
                const listener = (event)=>{
                    const message = event.data;
                    if (message.type === 'trackStopped' && message.trackId === this._workerTrackId) {
                        assert(this._workerListener);
                        mediaStreamTrackProcessorWorker.removeEventListener('message', this._workerListener);
                        mediaStreamTrackProcessorWorker.removeEventListener('message', listener);
                        resolve();
                    }
                };
                mediaStreamTrackProcessorWorker.addEventListener('message', listener);
            });
        }
        await this._encoder.flushAndClose();
    }
}
/**
 * Base class for audio sources - sources for audio tracks.
 * @public
 */ class AudioSource extends MediaSource {
    constructor(codec){
        super();
        /** @internal */ this._connectedTrack = null;
        if (!AUDIO_CODECS.includes(codec)) {
            throw new TypeError(`Invalid audio codec '${codec}'. Must be one of: ${AUDIO_CODECS.join(', ')}.`);
        }
        this._codec = codec;
    }
}
/**
 * The most basic audio source; can be used to directly pipe encoded packets into the output file.
 * @public
 */ class EncodedAudioPacketSource extends AudioSource {
    constructor(codec){
        super(codec);
    }
    /**
     * Adds an encoded packet to the output audio track.
     *
     * @param meta - Additional metadata from the encoder. You should pass this for the first call, including a valid
     * decoder config.
     *
     * @returns A Promise that resolves once the output is ready to receive more samples. You should await this Promise
     * to respect writer and encoder backpressure.
     */ add(packet, meta) {
        if (!(packet instanceof EncodedPacket)) {
            throw new TypeError('packet must be an EncodedPacket.');
        }
        if (packet.isMetadataOnly) {
            throw new TypeError('Metadata-only packets cannot be added.');
        }
        if (meta !== undefined && (!meta || typeof meta !== 'object')) {
            throw new TypeError('meta, when provided, must be an object.');
        }
        this._ensureValidAdd();
        return this._connectedTrack.output._muxer.addEncodedAudioPacket(this._connectedTrack, packet, meta);
    }
}
const validateAudioEncodingConfig = (config)=>{
    if (!config || typeof config !== 'object') {
        throw new TypeError('Encoding config must be an object.');
    }
    if (!AUDIO_CODECS.includes(config.codec)) {
        throw new TypeError(`Invalid audio codec '${config.codec}'. Must be one of: ${AUDIO_CODECS.join(', ')}.`);
    }
    if (config.bitrate === undefined && (!PCM_AUDIO_CODECS.includes(config.codec) || config.codec === 'flac')) {
        throw new TypeError('config.bitrate must be provided for compressed audio codecs.');
    }
    if (config.bitrate !== undefined && !(config.bitrate instanceof Quality) && (!Number.isInteger(config.bitrate) || config.bitrate <= 0)) {
        throw new TypeError('config.bitrate, when provided, must be a positive integer or a quality.');
    }
    if (config.fullCodecString !== undefined && typeof config.fullCodecString !== 'string') {
        throw new TypeError('config.fullCodecString, when provided, must be a string.');
    }
    if (config.fullCodecString !== undefined && inferCodecFromCodecString(config.fullCodecString) !== config.codec) {
        throw new TypeError(`config.fullCodecString, when provided, must be a string that matches the specified codec` + ` (${config.codec}).`);
    }
    if (config.onEncodedPacket !== undefined && typeof config.onEncodedPacket !== 'function') {
        throw new TypeError('config.onEncodedChunk, when provided, must be a function.');
    }
    if (config.onEncoderConfig !== undefined && typeof config.onEncoderConfig !== 'function') {
        throw new TypeError('config.onEncoderConfig, when provided, must be a function.');
    }
};
class AudioEncoderWrapper {
    constructor(source, encodingConfig){
        this.source = source;
        this.encodingConfig = encodingConfig;
        this.ensureEncoderPromise = null;
        this.encoderInitialized = false;
        this.encoder = null;
        this.muxer = null;
        this.lastNumberOfChannels = null;
        this.lastSampleRate = null;
        this.isPcmEncoder = false;
        this.outputSampleSize = null;
        this.writeOutputValue = null;
        this.customEncoder = null;
        this.customEncoderCallSerializer = new CallSerializer();
        this.customEncoderQueueSize = 0;
        /**
         * Encoders typically throw their errors "out of band", meaning asynchronously in some other execution context.
         * However, we want to surface these errors to the user within the normal control flow, so they don't go uncaught.
         * So, we keep track of the encoder error and throw it as soon as we get the chance.
         */ this.encoderError = null;
    }
    async add(audioSample, shouldClose) {
        try {
            this.checkForEncoderError();
            this.source._ensureValidAdd();
            // Ensure audio parameters remain constant
            if (this.lastNumberOfChannels !== null && this.lastSampleRate !== null) {
                if (audioSample.numberOfChannels !== this.lastNumberOfChannels || audioSample.sampleRate !== this.lastSampleRate) {
                    throw new Error(`Audio parameters must remain constant. Expected ${this.lastNumberOfChannels} channels at` + ` ${this.lastSampleRate} Hz, got ${audioSample.numberOfChannels} channels at` + ` ${audioSample.sampleRate} Hz.`);
                }
            } else {
                this.lastNumberOfChannels = audioSample.numberOfChannels;
                this.lastSampleRate = audioSample.sampleRate;
            }
            if (!this.encoderInitialized) {
                if (!this.ensureEncoderPromise) {
                    void this.ensureEncoder(audioSample);
                }
                // No, this "if" statement is not useless. Sometimes, the above call to `ensureEncoder` might have
                // synchronously completed and the encoder is already initialized. In this case, we don't need to await
                // the promise anymore. This also fixes nasty async race condition bugs when multiple code paths are
                // calling this method: It's important that the call that initialized the encoder go through this
                // code first.
                if (!this.encoderInitialized) {
                    await this.ensureEncoderPromise;
                }
            }
            assert(this.encoderInitialized);
            if (this.customEncoder) {
                this.customEncoderQueueSize++;
                const promise = this.customEncoderCallSerializer.call(()=>this.customEncoder.encode(audioSample)).then(()=>{
                    this.customEncoderQueueSize--;
                    if (shouldClose) {
                        audioSample.close();
                    }
                }).catch((error)=>{
                    this.encoderError ??= error;
                });
                if (this.customEncoderQueueSize >= 4) {
                    await promise;
                }
                await this.muxer.mutex.currentPromise; // Allow the writer to apply backpressure
            } else if (this.isPcmEncoder) {
                await this.doPcmEncoding(audioSample, shouldClose);
            } else {
                assert(this.encoder);
                const audioData = audioSample.toAudioData();
                this.encoder.encode(audioData);
                audioData.close();
                if (shouldClose) {
                    audioSample.close();
                }
                if (this.encoder.encodeQueueSize >= 4) {
                    await new Promise((resolve)=>this.encoder.addEventListener('dequeue', resolve, {
                            once: true
                        }));
                }
                await this.muxer.mutex.currentPromise; // Allow the writer to apply backpressure
            }
        } finally{
            if (shouldClose) {
                // Make sure it's always closed, even if there was an error
                audioSample.close();
            }
        }
    }
    async doPcmEncoding(audioSample, shouldClose) {
        assert(this.outputSampleSize);
        assert(this.writeOutputValue);
        // Need to extract data from the audio data before we close it
        const { numberOfChannels, numberOfFrames, sampleRate, timestamp } = audioSample;
        const CHUNK_SIZE = 2048;
        const outputs = [];
        // Prepare all of the output buffers, each being bounded by CHUNK_SIZE so we don't generate huge packets
        for(let frame = 0; frame < numberOfFrames; frame += CHUNK_SIZE){
            const frameCount = Math.min(CHUNK_SIZE, audioSample.numberOfFrames - frame);
            const outputSize = frameCount * numberOfChannels * this.outputSampleSize;
            const outputBuffer = new ArrayBuffer(outputSize);
            const outputView = new DataView(outputBuffer);
            outputs.push({
                frameCount,
                view: outputView
            });
        }
        const allocationSize = audioSample.allocationSize({
            planeIndex: 0,
            format: 'f32-planar'
        });
        const floats = new Float32Array(allocationSize / Float32Array.BYTES_PER_ELEMENT);
        for(let i = 0; i < numberOfChannels; i++){
            audioSample.copyTo(floats, {
                planeIndex: i,
                format: 'f32-planar'
            });
            for(let j = 0; j < outputs.length; j++){
                const { frameCount, view } = outputs[j];
                for(let k = 0; k < frameCount; k++){
                    this.writeOutputValue(view, (k * numberOfChannels + i) * this.outputSampleSize, floats[j * CHUNK_SIZE + k]);
                }
            }
        }
        if (shouldClose) {
            audioSample.close();
        }
        const meta = {
            decoderConfig: {
                codec: this.encodingConfig.codec,
                numberOfChannels,
                sampleRate
            }
        };
        for(let i = 0; i < outputs.length; i++){
            const { frameCount, view } = outputs[i];
            const outputBuffer = view.buffer;
            const startFrame = i * CHUNK_SIZE;
            const packet = new EncodedPacket(new Uint8Array(outputBuffer), 'key', timestamp + startFrame / sampleRate, frameCount / sampleRate);
            this.encodingConfig.onEncodedPacket?.(packet, meta);
            await this.muxer.addEncodedAudioPacket(this.source._connectedTrack, packet, meta); // With backpressure
        }
    }
    ensureEncoder(audioSample) {
        if (this.encoderInitialized) {
            return;
        }
        return this.ensureEncoderPromise = (async ()=>{
            const { numberOfChannels, sampleRate } = audioSample;
            const bitrate = this.encodingConfig.bitrate instanceof Quality ? this.encodingConfig.bitrate._toAudioBitrate(this.encodingConfig.codec) : this.encodingConfig.bitrate;
            const encoderConfig = {
                codec: this.encodingConfig.fullCodecString ?? buildAudioCodecString(this.encodingConfig.codec, numberOfChannels, sampleRate),
                numberOfChannels,
                sampleRate,
                bitrate,
                ...getAudioEncoderConfigExtension(this.encodingConfig.codec)
            };
            this.encodingConfig.onEncoderConfig?.(encoderConfig);
            const MatchingCustomEncoder = customAudioEncoders.find((x)=>x.supports(this.encodingConfig.codec, encoderConfig));
            if (MatchingCustomEncoder) {
                // @ts-expect-error "Can't create instance of abstract class 🤓"
                this.customEncoder = new MatchingCustomEncoder();
                // @ts-expect-error It's technically readonly
                this.customEncoder.codec = this.encodingConfig.codec;
                // @ts-expect-error It's technically readonly
                this.customEncoder.config = encoderConfig;
                // @ts-expect-error It's technically readonly
                this.customEncoder.onPacket = (packet, meta)=>{
                    if (!(packet instanceof EncodedPacket)) {
                        throw new TypeError('The first argument passed to onPacket must be an EncodedPacket.');
                    }
                    if (meta !== undefined && (!meta || typeof meta !== 'object')) {
                        throw new TypeError('The second argument passed to onPacket must be an object or undefined.');
                    }
                    this.encodingConfig.onEncodedPacket?.(packet, meta);
                    void this.muxer.addEncodedAudioPacket(this.source._connectedTrack, packet, meta);
                };
                await this.customEncoder.init();
            } else if (PCM_AUDIO_CODECS.includes(this.encodingConfig.codec)) {
                this.initPcmEncoder();
            } else {
                if (typeof AudioEncoder === 'undefined') {
                    throw new Error('AudioEncoder is not supported by this browser.');
                }
                const support = await AudioEncoder.isConfigSupported(encoderConfig);
                if (!support.supported) {
                    throw new Error(`This specific encoder configuration (${encoderConfig.codec}, ${encoderConfig.bitrate} bps,` + ` ${encoderConfig.numberOfChannels} channels, ${encoderConfig.sampleRate} Hz) is not` + ` supported by this browser. Consider using another codec or changing your audio parameters.`);
                }
                this.encoder = new AudioEncoder({
                    output: (chunk, meta)=>{
                        const packet = EncodedPacket.fromEncodedChunk(chunk);
                        this.encodingConfig.onEncodedPacket?.(packet, meta);
                        void this.muxer.addEncodedAudioPacket(this.source._connectedTrack, packet, meta);
                    },
                    error: (error)=>{
                        this.encoderError ??= error;
                    }
                });
                this.encoder.configure(encoderConfig);
            }
            assert(this.source._connectedTrack);
            this.muxer = this.source._connectedTrack.output._muxer;
            this.encoderInitialized = true;
        })();
    }
    initPcmEncoder() {
        this.isPcmEncoder = true;
        const codec = this.encodingConfig.codec;
        const { dataType, sampleSize, littleEndian } = parsePcmCodec(codec);
        this.outputSampleSize = sampleSize;
        // All these functions receive a float sample as input and map it into the desired format
        switch(sampleSize){
            case 1:
                {
                    if (dataType === 'unsigned') {
                        this.writeOutputValue = (view, byteOffset, value)=>view.setUint8(byteOffset, clamp((value + 1) * 127.5, 0, 255));
                    } else if (dataType === 'signed') {
                        this.writeOutputValue = (view, byteOffset, value)=>{
                            view.setInt8(byteOffset, clamp(Math.round(value * 128), -128, 127));
                        };
                    } else if (dataType === 'ulaw') {
                        this.writeOutputValue = (view, byteOffset, value)=>{
                            const int16 = clamp(Math.floor(value * 32767), -32768, 32767);
                            view.setUint8(byteOffset, toUlaw(int16));
                        };
                    } else if (dataType === 'alaw') {
                        this.writeOutputValue = (view, byteOffset, value)=>{
                            const int16 = clamp(Math.floor(value * 32767), -32768, 32767);
                            view.setUint8(byteOffset, toAlaw(int16));
                        };
                    } else {
                        assert(false);
                    }
                }
                break;
            case 2:
                {
                    if (dataType === 'unsigned') {
                        this.writeOutputValue = (view, byteOffset, value)=>view.setUint16(byteOffset, clamp((value + 1) * 32767.5, 0, 65535), littleEndian);
                    } else if (dataType === 'signed') {
                        this.writeOutputValue = (view, byteOffset, value)=>view.setInt16(byteOffset, clamp(Math.round(value * 32767), -32768, 32767), littleEndian);
                    } else {
                        assert(false);
                    }
                }
                break;
            case 3:
                {
                    if (dataType === 'unsigned') {
                        this.writeOutputValue = (view, byteOffset, value)=>setUint24(view, byteOffset, clamp((value + 1) * 8388607.5, 0, 16777215), littleEndian);
                    } else if (dataType === 'signed') {
                        this.writeOutputValue = (view, byteOffset, value)=>setInt24(view, byteOffset, clamp(Math.round(value * 8388607), -8388608, 8388607), littleEndian);
                    } else {
                        assert(false);
                    }
                }
                break;
            case 4:
                {
                    if (dataType === 'unsigned') {
                        this.writeOutputValue = (view, byteOffset, value)=>view.setUint32(byteOffset, clamp((value + 1) * 2147483647.5, 0, 4294967295), littleEndian);
                    } else if (dataType === 'signed') {
                        this.writeOutputValue = (view, byteOffset, value)=>view.setInt32(byteOffset, clamp(Math.round(value * 2147483647), -2147483648, 2147483647), littleEndian);
                    } else if (dataType === 'float') {
                        this.writeOutputValue = (view, byteOffset, value)=>view.setFloat32(byteOffset, value, littleEndian);
                    } else {
                        assert(false);
                    }
                }
                break;
            case 8:
                {
                    if (dataType === 'float') {
                        this.writeOutputValue = (view, byteOffset, value)=>view.setFloat64(byteOffset, value, littleEndian);
                    } else {
                        assert(false);
                    }
                }
                break;
            default:
                {
                    assertNever(sampleSize);
                    assert(false);
                }
        }
    }
    async flushAndClose() {
        this.checkForEncoderError();
        if (this.customEncoder) {
            void this.customEncoderCallSerializer.call(()=>this.customEncoder.flush());
            await this.customEncoderCallSerializer.call(()=>this.customEncoder.close());
        } else if (this.encoder) {
            await this.encoder.flush();
            this.encoder.close();
        }
        this.checkForEncoderError();
    }
    getQueueSize() {
        if (this.customEncoder) {
            return this.customEncoderQueueSize;
        } else if (this.isPcmEncoder) {
            return 0;
        } else {
            return this.encoder?.encodeQueueSize ?? 0;
        }
    }
    checkForEncoderError() {
        if (this.encoderError) {
            this.encoderError.stack = new Error().stack; // Provide a more useful stack trace
            throw this.encoderError;
        }
    }
}
/**
 * This source can be used to add raw, unencoded audio samples to an output audio track. These samples will
 * automatically be encoded and then piped into the output.
 * @public
 */ class AudioSampleSource extends AudioSource {
    constructor(encodingConfig){
        validateAudioEncodingConfig(encodingConfig);
        super(encodingConfig.codec);
        this._encoder = new AudioEncoderWrapper(this, encodingConfig);
    }
    /**
     * Encodes an audio sample and then adds it to the output.
     *
     * @returns A Promise that resolves once the output is ready to receive more samples. You should await this Promise
     * to respect writer and encoder backpressure.
     */ add(audioSample) {
        if (!(audioSample instanceof AudioSample)) {
            throw new TypeError('audioSample must be an AudioSample.');
        }
        return this._encoder.add(audioSample, false);
    }
    /** @internal */ _flushAndClose() {
        return this._encoder.flushAndClose();
    }
}
/**
 * This source can be used to add audio data from an AudioBuffer to the output track. This is useful when working with
 * the Web Audio API.
 * @public
 */ class AudioBufferSource extends AudioSource {
    constructor(encodingConfig){
        validateAudioEncodingConfig(encodingConfig);
        super(encodingConfig.codec);
        /** @internal */ this._accumulatedTime = 0;
        this._encoder = new AudioEncoderWrapper(this, encodingConfig);
    }
    /**
     * Converts an AudioBuffer to audio samples, encodes them and adds them to the output. The first AudioBuffer will
     * be played at timestamp 0, and any subsequent AudioBuffer will have a timestamp equal to the total duration of
     * all previous AudioBuffers.
     *
     * @returns A Promise that resolves once the output is ready to receive more samples. You should await this Promise
     * to respect writer and encoder backpressure.
     */ add(audioBuffer) {
        if (!(audioBuffer instanceof AudioBuffer)) {
            throw new TypeError('audioBuffer must be an AudioBuffer.');
        }
        const audioSamples = AudioSample.fromAudioBuffer(audioBuffer, this._accumulatedTime);
        const promises = audioSamples.map((sample)=>this._encoder.add(sample, true));
        this._accumulatedTime += audioBuffer.duration;
        return Promise.all(promises);
    }
    /** @internal */ _flushAndClose() {
        return this._encoder.flushAndClose();
    }
}
/**
 * Audio source that encodes the data of a MediaStreamAudioTrack and pipes it into the output. This is useful for
 * capturing live or real-time audio such as microphones or audio from other media elements. Audio will automatically
 * start being captured once the connected Output is started, and will keep being captured until the Output is
 * finalized or this source is closed.
 * @public
 */ class MediaStreamAudioTrackSource extends AudioSource {
    /** A promise that rejects upon any error within this source. This promise never resolves. */ get errorPromise() {
        this._errorPromiseAccessed = true;
        return this._promiseWithResolvers.promise;
    }
    constructor(track, encodingConfig){
        if (!(track instanceof MediaStreamTrack) || track.kind !== 'audio') {
            throw new TypeError('track must be an audio MediaStreamTrack.');
        }
        validateAudioEncodingConfig(encodingConfig);
        super(encodingConfig.codec);
        /** @internal */ this._abortController = null;
        /** @internal */ this._audioContext = null;
        /** @internal */ this._scriptProcessorNode = null; // Deprecated but goated
        /** @internal */ this._promiseWithResolvers = promiseWithResolvers();
        /** @internal */ this._errorPromiseAccessed = false;
        this._encoder = new AudioEncoderWrapper(this, encodingConfig);
        this._track = track;
    }
    /** @internal */ async _start() {
        if (!this._errorPromiseAccessed) {
            console.warn('Make sure not to ignore the `errorPromise` field on MediaStreamVideoTrackSource, so that any internal' + ' errors get bubbled up properly.');
        }
        this._abortController = new AbortController();
        if (typeof MediaStreamTrackProcessor !== 'undefined') {
            // Great, MediaStreamTrackProcessor is supported, this is the preferred way of doing things
            let firstAudioDataTimestamp = null;
            const processor = new MediaStreamTrackProcessor({
                track: this._track
            });
            const consumer = new WritableStream({
                write: (audioData)=>{
                    if (firstAudioDataTimestamp === null) {
                        firstAudioDataTimestamp = audioData.timestamp / 1e6;
                        const muxer = this._connectedTrack.output._muxer;
                        if (muxer.firstMediaStreamTimestamp === null) {
                            muxer.firstMediaStreamTimestamp = performance.now() / 1000;
                            this._timestampOffset = -firstAudioDataTimestamp;
                        } else {
                            this._timestampOffset = performance.now() / 1000 - muxer.firstMediaStreamTimestamp - firstAudioDataTimestamp;
                        }
                    }
                    if (this._encoder.getQueueSize() >= 4) {
                        // Drop data if the encoder is overloaded
                        audioData.close();
                        return;
                    }
                    void this._encoder.add(new AudioSample(audioData), true).catch((error)=>{
                        this._abortController?.abort();
                        this._promiseWithResolvers.reject(error);
                    });
                }
            });
            processor.readable.pipeTo(consumer, {
                signal: this._abortController.signal
            }).catch((error)=>{
                // Handle AbortError silently
                if (error instanceof DOMException && error.name === 'AbortError') return;
                this._promiseWithResolvers.reject(error);
            });
        } else {
            // Let's fall back to an AudioContext approach
            this._audioContext = new AudioContext({
                sampleRate: this._track.getSettings().sampleRate
            });
            const sourceNode = this._audioContext.createMediaStreamSource(new MediaStream([
                this._track
            ]));
            this._scriptProcessorNode = this._audioContext.createScriptProcessor(4096);
            if (this._audioContext.state === 'suspended') {
                await this._audioContext.resume();
            }
            sourceNode.connect(this._scriptProcessorNode);
            this._scriptProcessorNode.connect(this._audioContext.destination);
            let audioReceived = false;
            let totalDuration = 0;
            this._scriptProcessorNode.onaudioprocess = (event)=>{
                const audioSamples = AudioSample.fromAudioBuffer(event.inputBuffer, totalDuration);
                totalDuration += event.inputBuffer.duration;
                for (const audioSample of audioSamples){
                    if (!audioReceived) {
                        audioReceived = true;
                        const muxer = this._connectedTrack.output._muxer;
                        if (muxer.firstMediaStreamTimestamp === null) {
                            muxer.firstMediaStreamTimestamp = performance.now() / 1000;
                        } else {
                            this._timestampOffset = performance.now() / 1000 - muxer.firstMediaStreamTimestamp;
                        }
                    }
                    if (this._encoder.getQueueSize() >= 4) {
                        // Drop data if the encoder is overloaded
                        audioSample.close();
                        continue;
                    }
                    void this._encoder.add(audioSample, true).catch((error)=>{
                        void this._audioContext.suspend();
                        this._promiseWithResolvers.reject(error);
                    });
                }
            };
        }
    }
    /** @internal */ async _flushAndClose() {
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }
        if (this._audioContext) {
            assert(this._scriptProcessorNode);
            this._scriptProcessorNode.disconnect();
            await this._audioContext.suspend();
        }
        await this._encoder.flushAndClose();
    }
}
const mediaStreamTrackProcessorWorkerCode = ()=>{
    const sendMessage = (message, transfer)=>{
        if (transfer) {
            // The error is bullshit, it's using the wrong postMessage
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
            self.postMessage(message, transfer);
        } else {
            self.postMessage(message);
        }
    };
    // Immediately send a message to the main thread, letting them know of the support
    sendMessage({
        type: 'support',
        supported: typeof MediaStreamTrackProcessor !== 'undefined'
    });
    const abortControllers = new Map();
    const stoppedTracks = new Set();
    self.addEventListener('message', (event)=>{
        const message = event.data;
        switch(message.type){
            case 'videoTrack':
                {
                    const processor = new MediaStreamTrackProcessor({
                        track: message.track
                    });
                    const consumer = new WritableStream({
                        write: (videoFrame)=>{
                            if (stoppedTracks.has(message.trackId)) {
                                videoFrame.close();
                                return;
                            }
                            // Send it to the main thread
                            sendMessage({
                                type: 'videoFrame',
                                trackId: message.trackId,
                                videoFrame
                            }, [
                                videoFrame
                            ]);
                        }
                    });
                    const abortController = new AbortController();
                    abortControllers.set(message.trackId, abortController);
                    processor.readable.pipeTo(consumer, {
                        signal: abortController.signal
                    }).catch((error)=>{
                        // Handle AbortError silently
                        if (error instanceof DOMException && error.name === 'AbortError') return;
                        sendMessage({
                            type: 'error',
                            trackId: message.trackId,
                            error
                        });
                    });
                }
                break;
            case 'stopTrack':
                {
                    const abortController = abortControllers.get(message.trackId);
                    if (abortController) {
                        abortController.abort();
                        abortControllers.delete(message.trackId);
                    }
                    stoppedTracks.add(message.trackId);
                    sendMessage({
                        type: 'trackStopped',
                        trackId: message.trackId
                    });
                }
                break;
            default:
                assertNever(message);
        }
    });
};
let nextMediaStreamTrackProcessorWorkerId = 0;
let mediaStreamTrackProcessorWorker = null;
const initMediaStreamTrackProcessorWorker = ()=>{
    const blob = new Blob([
        `(${mediaStreamTrackProcessorWorkerCode.toString()})()`
    ], {
        type: 'application/javascript'
    });
    const url = URL.createObjectURL(blob);
    mediaStreamTrackProcessorWorker = new Worker(url);
};
let mediaStreamTrackProcessorIsSupportedInWorkerCache = null;
const mediaStreamTrackProcessorIsSupportedInWorker = async ()=>{
    if (mediaStreamTrackProcessorIsSupportedInWorkerCache !== null) {
        return mediaStreamTrackProcessorIsSupportedInWorkerCache;
    }
    if (!mediaStreamTrackProcessorWorker) {
        initMediaStreamTrackProcessorWorker();
    }
    return new Promise((resolve)=>{
        assert(mediaStreamTrackProcessorWorker);
        const listener = (event)=>{
            const message = event.data;
            if (message.type === 'support') {
                mediaStreamTrackProcessorIsSupportedInWorkerCache = message.supported;
                mediaStreamTrackProcessorWorker.removeEventListener('message', listener);
                resolve(message.supported);
            }
        };
        mediaStreamTrackProcessorWorker.addEventListener('message', listener);
    });
};
const sendMessageToMediaStreamTrackProcessorWorker = (message, transfer)=>{
    assert(mediaStreamTrackProcessorWorker);
    if (transfer) {
        mediaStreamTrackProcessorWorker.postMessage(message, transfer);
    } else {
        mediaStreamTrackProcessorWorker.postMessage(message);
    }
};
/**
 * Base class for subtitle sources - sources for subtitle tracks.
 * @public
 */ class SubtitleSource extends MediaSource {
    constructor(codec){
        super();
        /** @internal */ this._connectedTrack = null;
        if (!SUBTITLE_CODECS.includes(codec)) {
            throw new TypeError(`Invalid subtitle codec '${codec}'. Must be one of: ${SUBTITLE_CODECS.join(', ')}.`);
        }
        this._codec = codec;
    }
}
/**
 * This source can be used to add subtitles from a subtitle text file.
 * @public
 */ class TextSubtitleSource extends SubtitleSource {
    constructor(codec){
        super(codec);
        this._parser = new SubtitleParser({
            codec,
            output: (cue, metadata)=>this._connectedTrack?.output._muxer.addSubtitleCue(this._connectedTrack, cue, metadata)
        });
    }
    /**
     * Parses the subtitle text according to the specified codec and adds it to the output track. You don't have to
     * add the entire subtitle file at once here; you can provide it in chunks.
     *
     * @returns A Promise that resolves once the output is ready to receive more samples. You should await this Promise
     * to respect writer and encoder backpressure.
     */ add(text) {
        if (typeof text !== 'string') {
            throw new TypeError('text must be a string.');
        }
        this._ensureValidAdd();
        this._parser.parse(text);
        return this._connectedTrack.output._muxer.mutex.currentPromise;
    }
}

/**
 * List of all track types.
 * @public
 */ const ALL_TRACK_TYPES = [
    'video',
    'audio',
    'subtitle'
];
const validateBaseTrackMetadata = (metadata)=>{
    if (!metadata || typeof metadata !== 'object') {
        throw new TypeError('metadata must be an object.');
    }
    if (metadata.languageCode !== undefined && !isIso639Dash2LanguageCode(metadata.languageCode)) {
        throw new TypeError('metadata.languageCode must be a three-letter, ISO 639-2/T language code.');
    }
};
/**
 * Main class orchestrating the creation of a new media file.
 * @public
 */ class Output {
    constructor(options){
        /** The current state of the output. */ this.state = 'pending';
        /** @internal */ this._tracks = [];
        /** @internal */ this._startPromise = null;
        /** @internal */ this._cancelPromise = null;
        /** @internal */ this._finalizePromise = null;
        /** @internal */ this._mutex = new AsyncMutex();
        if (!options || typeof options !== 'object') {
            throw new TypeError('options must be an object.');
        }
        if (!(options.format instanceof OutputFormat)) {
            throw new TypeError('options.format must be an OutputFormat.');
        }
        if (!(options.target instanceof Target)) {
            throw new TypeError('options.target must be a Target.');
        }
        if (options.target._output) {
            throw new Error('Target is already used for another output.');
        }
        options.target._output = this;
        this.format = options.format;
        this.target = options.target;
        this._writer = options.target._createWriter();
        this._muxer = options.format._createMuxer(this);
    }
    /** Adds a video track to the output with the given source. Must be called before output is started. */ addVideoTrack(source, metadata = {}) {
        if (!(source instanceof VideoSource)) {
            throw new TypeError('source must be a VideoSource.');
        }
        validateBaseTrackMetadata(metadata);
        if (metadata.rotation !== undefined && ![
            0,
            90,
            180,
            270
        ].includes(metadata.rotation)) {
            throw new TypeError(`Invalid video rotation: ${metadata.rotation}. Has to be 0, 90, 180 or 270.`);
        }
        if (!this.format.supportsVideoRotationMetadata && metadata.rotation) {
            throw new Error(`${this.format._name} does not support video rotation metadata.`);
        }
        if (metadata.frameRate !== undefined && (!Number.isFinite(metadata.frameRate) || metadata.frameRate <= 0)) {
            throw new TypeError(`Invalid video frame rate: ${metadata.frameRate}. Must be a positive number.`);
        }
        this._addTrack('video', source, metadata);
    }
    /** Adds an audio track to the output with the given source. Must be called before output is started. */ addAudioTrack(source, metadata = {}) {
        if (!(source instanceof AudioSource)) {
            throw new TypeError('source must be an AudioSource.');
        }
        validateBaseTrackMetadata(metadata);
        this._addTrack('audio', source, metadata);
    }
    /** Adds a subtitle track to the output with the given source. Must be called before output is started. */ addSubtitleTrack(source, metadata = {}) {
        if (!(source instanceof SubtitleSource)) {
            throw new TypeError('source must be a SubtitleSource.');
        }
        validateBaseTrackMetadata(metadata);
        this._addTrack('subtitle', source, metadata);
    }
    /** @internal */ _addTrack(type, source, metadata) {
        if (this.state !== 'pending') {
            throw new Error('Cannot add track after output has been started or canceled.');
        }
        if (source._connectedTrack) {
            throw new Error('Source is already used for a track.');
        }
        // Verify maximum track count constraints
        const supportedTrackCounts = this.format.getSupportedTrackCounts();
        const presentTracksOfThisType = this._tracks.reduce((count, track)=>count + (track.type === type ? 1 : 0), 0);
        const maxCount = supportedTrackCounts[type].max;
        if (presentTracksOfThisType === maxCount) {
            throw new Error(maxCount === 0 ? `${this.format._name} does not support ${type} tracks.` : `${this.format._name} does not support more than ${maxCount} ${type} track` + `${maxCount === 1 ? '' : 's'}.`);
        }
        const maxTotalCount = supportedTrackCounts.total.max;
        if (this._tracks.length === maxTotalCount) {
            throw new Error(`${this.format._name} does not support more than ${maxTotalCount} tracks` + `${maxTotalCount === 1 ? '' : 's'} in total.`);
        }
        const track = {
            id: this._tracks.length + 1,
            output: this,
            type,
            source: source,
            metadata
        };
        if (track.type === 'video') {
            const supportedVideoCodecs = this.format.getSupportedVideoCodecs();
            if (supportedVideoCodecs.length === 0) {
                throw new Error(`${this.format._name} does not support video tracks.` + this.format._codecUnsupportedHint(track.source._codec));
            } else if (!supportedVideoCodecs.includes(track.source._codec)) {
                throw new Error(`Codec '${track.source._codec}' cannot be contained within ${this.format._name}. Supported` + ` video codecs are: ${supportedVideoCodecs.map((codec)=>`'${codec}'`).join(', ')}.` + this.format._codecUnsupportedHint(track.source._codec));
            }
        } else if (track.type === 'audio') {
            const supportedAudioCodecs = this.format.getSupportedAudioCodecs();
            if (supportedAudioCodecs.length === 0) {
                throw new Error(`${this.format._name} does not support audio tracks.` + this.format._codecUnsupportedHint(track.source._codec));
            } else if (!supportedAudioCodecs.includes(track.source._codec)) {
                throw new Error(`Codec '${track.source._codec}' cannot be contained within ${this.format._name}. Supported` + ` audio codecs are: ${supportedAudioCodecs.map((codec)=>`'${codec}'`).join(', ')}.` + this.format._codecUnsupportedHint(track.source._codec));
            }
        } else if (track.type === 'subtitle') {
            const supportedSubtitleCodecs = this.format.getSupportedSubtitleCodecs();
            if (supportedSubtitleCodecs.length === 0) {
                throw new Error(`${this.format._name} does not support subtitle tracks.` + this.format._codecUnsupportedHint(track.source._codec));
            } else if (!supportedSubtitleCodecs.includes(track.source._codec)) {
                throw new Error(`Codec '${track.source._codec}' cannot be contained within ${this.format._name}. Supported` + ` subtitle codecs are: ${supportedSubtitleCodecs.map((codec)=>`'${codec}'`).join(', ')}.` + this.format._codecUnsupportedHint(track.source._codec));
            }
        }
        this._tracks.push(track);
        source._connectedTrack = track;
    }
    /**
     * Starts the creation of the output file. This method should be called after all tracks have been added. Only after
     * the output has started can media samples be added to the tracks.
     *
     * @returns A promise that resolves when the output has successfully started and is ready to receive media samples.
     */ async start() {
        // Verify minimum track count constraints
        const supportedTrackCounts = this.format.getSupportedTrackCounts();
        for (const trackType of ALL_TRACK_TYPES){
            const presentTracksOfThisType = this._tracks.reduce((count, track)=>count + (track.type === trackType ? 1 : 0), 0);
            const minCount = supportedTrackCounts[trackType].min;
            if (presentTracksOfThisType < minCount) {
                throw new Error(minCount === supportedTrackCounts[trackType].max ? `${this.format._name} requires exactly ${minCount} ${trackType}` + ` track${minCount === 1 ? '' : 's'}.` : `${this.format._name} requires at least ${minCount} ${trackType}` + ` track${minCount === 1 ? '' : 's'}.`);
            }
        }
        const totalMinCount = supportedTrackCounts.total.min;
        if (this._tracks.length < totalMinCount) {
            throw new Error(totalMinCount === supportedTrackCounts.total.max ? `${this.format._name} requires exactly ${totalMinCount} track` + `${totalMinCount === 1 ? '' : 's'}.` : `${this.format._name} requires at least ${totalMinCount} track` + `${totalMinCount === 1 ? '' : 's'}.`);
        }
        if (this.state === 'canceled') {
            throw new Error('Output has been canceled.');
        }
        if (this._startPromise) {
            console.warn('Output has already been started.');
            return this._startPromise;
        }
        return this._startPromise = (async ()=>{
            this.state = 'started';
            this._writer.start();
            const release = await this._mutex.acquire();
            await this._muxer.start();
            const promises = this._tracks.map((track)=>track.source._start());
            await Promise.all(promises);
            release();
        })();
    }
    /**
     * Resolves with the full MIME type of the output file, including track codecs.
     *
     * The returned promise will resolve only once the precise codec strings of all tracks are known.
     */ getMimeType() {
        return this._muxer.getMimeType();
    }
    /**
     * Cancels the creation of the output file, releasing internal resources like encoders and preventing further
     * samples from being added.
     *
     * @returns A promise that resolves once all internal resources have been released.
     */ async cancel() {
        if (this._cancelPromise) {
            console.warn('Output has already been canceled.');
            return this._cancelPromise;
        } else if (this.state === 'finalizing' || this.state === 'finalized') {
            console.warn('Output has already been finalized.');
            return;
        }
        return this._cancelPromise = (async ()=>{
            this.state = 'canceled';
            const release = await this._mutex.acquire();
            const promises = this._tracks.map((x)=>x.source._flushOrWaitForClose());
            await Promise.all(promises);
            await this._writer.close();
            release();
        })();
    }
    /**
     * Finalizes the output file. This method must be called after all media samples across all tracks have been added.
     * Once the Promise returned by this method completes, the output file is ready.
     */ async finalize() {
        if (this.state === 'pending') {
            throw new Error('Cannot finalize before starting.');
        }
        if (this.state === 'canceled') {
            throw new Error('Cannot finalize after canceling.');
        }
        if (this._finalizePromise) {
            console.warn('Output has already been finalized.');
            return this._finalizePromise;
        }
        return this._finalizePromise = (async ()=>{
            this.state = 'finalizing';
            const release = await this._mutex.acquire();
            const promises = this._tracks.map((x)=>x.source._flushOrWaitForClose());
            await Promise.all(promises);
            await this._muxer.finalize();
            await this._writer.flush();
            await this._writer.finalize();
            this.state = 'finalized';
            release();
        })();
    }
}

/**
 * The source base class, representing a resource from which bytes can be read.
 * @public
 */ class Source {
    constructor(){
        /** @internal */ this._sizePromise = null;
        /** Called each time data is requested from the source. */ this.onread = null;
    }
    /**
     * Resolves with the total size of the file in bytes. This function is memoized, meaning only the first call
     * will retrieve the size.
     */ getSize() {
        return this._sizePromise ??= this._retrieveSize();
    }
}
/**
 * A source backed by an ArrayBuffer or ArrayBufferView, with the entire file held in memory.
 * @public
 */ class BufferSource extends Source {
    constructor(buffer){
        if (!(buffer instanceof ArrayBuffer) && !(buffer instanceof Uint8Array)) {
            throw new TypeError('buffer must be an ArrayBuffer or Uint8Array.');
        }
        super();
        this._bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    }
    /** @internal */ async _read(start, end) {
        return this._bytes.subarray(start, end);
    }
    /** @internal */ async _retrieveSize() {
        return this._bytes.byteLength;
    }
}
/**
 * A general-purpose, callback-driven source that can get its data from anywhere.
 * @public
 */ class StreamSource extends Source {
    constructor(options){
        if (!options || typeof options !== 'object') {
            throw new TypeError('options must be an object.');
        }
        if (typeof options.read !== 'function') {
            throw new TypeError('options.read must be a function.');
        }
        if (typeof options.getSize !== 'function') {
            throw new TypeError('options.getSize must be a function.');
        }
        super();
        this._options = options;
    }
    /** @internal */ async _read(start, end) {
        return this._options.read(start, end);
    }
    /** @internal */ async _retrieveSize() {
        return this._options.getSize();
    }
}
/**
 * A source backed by a Blob. Since Files are also Blobs, this is the source to use when reading files off the disk.
 * @public
 */ class BlobSource extends Source {
    constructor(blob){
        if (!(blob instanceof Blob)) {
            throw new TypeError('blob must be a Blob.');
        }
        super();
        this._blob = blob;
    }
    /** @internal */ async _read(start, end) {
        const slice = this._blob.slice(start, end);
        const buffer = await slice.arrayBuffer();
        return new Uint8Array(buffer);
    }
    /** @internal */ async _retrieveSize() {
        return this._blob.size;
    }
}
/**
 * A source backed by a URL. This is useful for reading data from the network. Be careful using this source however,
 * as it typically comes with increased latency.
 * @beta
 */ class UrlSource extends Source {
    constructor(url, options = {}){
        if (typeof url !== 'string' && !(url instanceof URL)) {
            throw new TypeError('url must be a string or URL.');
        }
        if (!options || typeof options !== 'object') {
            throw new TypeError('options must be an object.');
        }
        if (options.requestInit !== undefined && (!options.requestInit || typeof options.requestInit !== 'object')) {
            throw new TypeError('options.requestInit, when provided, must be an object.');
        }
        if (options.getRetryDelay !== undefined && typeof options.getRetryDelay !== 'function') {
            throw new TypeError('options.getRetryDelay, when provided, must be a function.');
        }
        super();
        /** @internal */ this._fullData = null;
        this._url = url;
        this._options = options;
    }
    /** @internal */ async _makeRequest(range) {
        const headers = {};
        if (range) {
            headers['Range'] = `bytes=${range.start}-${range.end - 1}`;
        }
        const response = await retriedFetch(this._url, mergeObjectsDeeply(this._options.requestInit ?? {}, {
            method: 'GET',
            headers
        }), this._options.getRetryDelay ?? (()=>null));
        if (!response.ok) {
            throw new Error(`Error fetching ${this._url}: ${response.status} ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        if (response.status === 200) {
            // The server didn't return 206 Partial Content, so it's not a range response
            this._fullData = buffer;
        }
        return {
            response: buffer,
            statusCode: response.status
        };
    }
    /** @internal */ async _read(start, end) {
        if (this._fullData) {
            return new Uint8Array(this._fullData, start, end - start);
        }
        const { response, statusCode } = await this._makeRequest({
            start,
            end
        });
        // If server doesn't support range requests, it will return 200 instead of 206. In that case, let's manually
        // slice the response.
        if (statusCode === 200) {
            const fullData = new Uint8Array(response);
            return fullData.subarray(start, end);
        }
        return new Uint8Array(response);
    }
    /** @internal */ async _retrieveSize() {
        if (this._fullData) {
            return this._fullData.byteLength;
        }
        // First, try a HEAD request to get the size
        try {
            const headResponse = await retriedFetch(this._url, mergeObjectsDeeply(this._options.requestInit ?? {}, {
                method: 'HEAD'
            }), this._options.getRetryDelay ?? (()=>null));
            if (headResponse.ok) {
                const contentLength = headResponse.headers.get('Content-Length');
                if (contentLength) {
                    return parseInt(contentLength);
                }
            }
        } catch  {
        // We tried
        }
        // Try a range request to get the Content-Range header
        const rangeResponse = await retriedFetch(this._url, mergeObjectsDeeply(this._options.requestInit ?? {}, {
            method: 'GET',
            headers: {
                Range: 'bytes=0-0'
            }
        }), this._options.getRetryDelay ?? (()=>null));
        if (rangeResponse.status === 206) {
            const contentRange = rangeResponse.headers.get('Content-Range');
            if (contentRange) {
                const match = contentRange.match(/bytes \d+-\d+\/(\d+)/);
                if (match && match[1]) {
                    return parseInt(match[1]);
                }
            }
        } else if (rangeResponse.status === 200) {
            // The server just returned the whole thing
            this._fullData = await rangeResponse.arrayBuffer();
            return this._fullData.byteLength;
        }
        // If the range request didn't provide the size, make a full GET request
        const { response } = await this._makeRequest();
        return response.byteLength;
    }
}

class IsobmffDemuxer extends Demuxer {
    constructor(input){
        super(input);
        this.currentTrack = null;
        this.tracks = [];
        this.metadataPromise = null;
        this.movieTimescale = -1;
        this.movieDurationInTimescale = -1;
        this.isQuickTime = false;
        this.isFragmented = false;
        this.fragmentTrackDefaults = [];
        this.fragments = [];
        this.currentFragment = null;
        this.fragmentLookupMutex = new AsyncMutex();
        this.metadataReader = new IsobmffReader(input._mainReader);
        this.chunkReader = new IsobmffReader(new Reader(input.source, 64 * 2 ** 20)); // Max 64 MiB of stored chunks
    }
    async computeDuration() {
        const tracks = await this.getTracks();
        const trackDurations = await Promise.all(tracks.map((x)=>x.computeDuration()));
        return Math.max(0, ...trackDurations);
    }
    async getTracks() {
        await this.readMetadata();
        return this.tracks.map((track)=>track.inputTrack);
    }
    async getMimeType() {
        await this.readMetadata();
        const codecStrings = await Promise.all(this.tracks.map((x)=>x.inputTrack.getCodecParameterString()));
        return buildIsobmffMimeType({
            isQuickTime: this.isQuickTime,
            hasVideo: this.tracks.some((x)=>x.info?.type === 'video'),
            hasAudio: this.tracks.some((x)=>x.info?.type === 'audio'),
            codecStrings: codecStrings.filter(Boolean)
        });
    }
    readMetadata() {
        return this.metadataPromise ??= (async ()=>{
            const sourceSize = await this.metadataReader.reader.source.getSize();
            while(this.metadataReader.pos < sourceSize){
                await this.metadataReader.reader.loadRange(this.metadataReader.pos, this.metadataReader.pos + MAX_BOX_HEADER_SIZE);
                const startPos = this.metadataReader.pos;
                const boxInfo = this.metadataReader.readBoxHeader();
                if (boxInfo.name === 'ftyp') {
                    const majorBrand = this.metadataReader.readAscii(4);
                    this.isQuickTime = majorBrand === 'qt  ';
                } else if (boxInfo.name === 'moov') {
                    // Found moov, load it
                    await this.metadataReader.reader.loadRange(this.metadataReader.pos, this.metadataReader.pos + boxInfo.contentSize);
                    this.readContiguousBoxes(boxInfo.contentSize);
                    for (const track of this.tracks){
                        // Modify the edit list offset based on the previous segment durations. They are in different
                        // timescales, so we first convert to seconds and then into the track timescale.
                        const previousSegmentDurationsInSeconds = track.editListPreviousSegmentDurations / this.movieTimescale;
                        track.editListOffset -= Math.round(previousSegmentDurationsInSeconds * track.timescale);
                    }
                    break;
                }
                this.metadataReader.pos = startPos + boxInfo.totalSize;
            }
            if (this.isFragmented) {
                // The last 4 bytes may contain the size of the mfra box at the end of the file
                await this.metadataReader.reader.loadRange(sourceSize - 4, sourceSize);
                this.metadataReader.pos = sourceSize - 4;
                const lastWord = this.metadataReader.readU32();
                const potentialMfraPos = sourceSize - lastWord;
                if (potentialMfraPos >= 0 && potentialMfraPos < sourceSize) {
                    await this.metadataReader.reader.loadRange(potentialMfraPos, sourceSize);
                    this.metadataReader.pos = potentialMfraPos;
                    const boxInfo = this.metadataReader.readBoxHeader();
                    if (boxInfo.name === 'mfra') {
                        // We found the mfra box, allowing for much better random access. Let's parse it:
                        this.readContiguousBoxes(boxInfo.contentSize);
                    }
                }
            }
        })();
    }
    getSampleTableForTrack(internalTrack) {
        if (internalTrack.sampleTable) {
            return internalTrack.sampleTable;
        }
        const sampleTable = {
            sampleTimingEntries: [],
            sampleCompositionTimeOffsets: [],
            sampleSizes: [],
            keySampleIndices: null,
            chunkOffsets: [],
            sampleToChunk: [],
            presentationTimestamps: null,
            presentationTimestampIndexMap: null
        };
        internalTrack.sampleTable = sampleTable;
        this.metadataReader.pos = internalTrack.sampleTableByteOffset;
        this.currentTrack = internalTrack;
        this.traverseBox();
        this.currentTrack = null;
        const isPcmCodec = internalTrack.info?.type === 'audio' && internalTrack.info.codec && PCM_AUDIO_CODECS.includes(internalTrack.info.codec);
        if (isPcmCodec && sampleTable.sampleCompositionTimeOffsets.length === 0) {
            // If the audio has PCM samples, the way the samples are defined in the sample table is somewhat
            // suboptimal: Each individual audio sample is its own sample, meaning we can have 48000 samples per second.
            // Because we treat each sample as its own atomic unit that can be decoded, this would lead to a huge
            // amount of very short samples for PCM audio. So instead, we make a transformation: If the audio is in PCM,
            // we say that each chunk (that normally holds many samples) now is one big sample. We can this because
            // the samples in the chunk are contiguous and the format is PCM, so the entire chunk as one thing still
            // encodes valid audio information.
            assert(internalTrack.info?.type === 'audio');
            const pcmInfo = parsePcmCodec(internalTrack.info.codec);
            const newSampleTimingEntries = [];
            const newSampleSizes = [];
            for(let i = 0; i < sampleTable.sampleToChunk.length; i++){
                const chunkEntry = sampleTable.sampleToChunk[i];
                const nextEntry = sampleTable.sampleToChunk[i + 1];
                const chunkCount = (nextEntry ? nextEntry.startChunkIndex : sampleTable.chunkOffsets.length) - chunkEntry.startChunkIndex;
                for(let j = 0; j < chunkCount; j++){
                    const startSampleIndex = chunkEntry.startSampleIndex + j * chunkEntry.samplesPerChunk;
                    const endSampleIndex = startSampleIndex + chunkEntry.samplesPerChunk; // Exclusive, outside of chunk
                    const startTimingEntryIndex = binarySearchLessOrEqual(sampleTable.sampleTimingEntries, startSampleIndex, (x)=>x.startIndex);
                    const startTimingEntry = sampleTable.sampleTimingEntries[startTimingEntryIndex];
                    const endTimingEntryIndex = binarySearchLessOrEqual(sampleTable.sampleTimingEntries, endSampleIndex, (x)=>x.startIndex);
                    const endTimingEntry = sampleTable.sampleTimingEntries[endTimingEntryIndex];
                    const firstSampleTimestamp = startTimingEntry.startDecodeTimestamp + (startSampleIndex - startTimingEntry.startIndex) * startTimingEntry.delta;
                    const lastSampleTimestamp = endTimingEntry.startDecodeTimestamp + (endSampleIndex - endTimingEntry.startIndex) * endTimingEntry.delta;
                    const delta = lastSampleTimestamp - firstSampleTimestamp;
                    const lastSampleTimingEntry = last(newSampleTimingEntries);
                    if (lastSampleTimingEntry && lastSampleTimingEntry.delta === delta) {
                        lastSampleTimingEntry.count++;
                    } else {
                        // One sample for the entire chunk
                        newSampleTimingEntries.push({
                            startIndex: chunkEntry.startChunkIndex + j,
                            startDecodeTimestamp: firstSampleTimestamp,
                            count: 1,
                            delta
                        });
                    }
                    // Instead of determining the chunk's size by looping over the samples sizes in the sample table, we
                    // can directly compute it as we know how many PCM frames are in this chunk, and the size of each
                    // PCM frame. This also improves compatibility with some files which fail to write proper sample
                    // size values into their sample tables in the PCM case.
                    const chunkSize = chunkEntry.samplesPerChunk * pcmInfo.sampleSize * internalTrack.info.numberOfChannels;
                    newSampleSizes.push(chunkSize);
                }
                chunkEntry.startSampleIndex = chunkEntry.startChunkIndex;
                chunkEntry.samplesPerChunk = 1;
            }
            sampleTable.sampleTimingEntries = newSampleTimingEntries;
            sampleTable.sampleSizes = newSampleSizes;
        }
        if (sampleTable.sampleCompositionTimeOffsets.length > 0) {
            // If composition time offsets are defined, we must build a list of all presentation timestamps and then
            // sort them
            sampleTable.presentationTimestamps = [];
            for (const entry of sampleTable.sampleTimingEntries){
                for(let i = 0; i < entry.count; i++){
                    sampleTable.presentationTimestamps.push({
                        presentationTimestamp: entry.startDecodeTimestamp + i * entry.delta,
                        sampleIndex: entry.startIndex + i
                    });
                }
            }
            for (const entry of sampleTable.sampleCompositionTimeOffsets){
                for(let i = 0; i < entry.count; i++){
                    const sampleIndex = entry.startIndex + i;
                    const sample = sampleTable.presentationTimestamps[sampleIndex];
                    if (!sample) {
                        continue;
                    }
                    sample.presentationTimestamp += entry.offset;
                }
            }
            sampleTable.presentationTimestamps.sort((a, b)=>a.presentationTimestamp - b.presentationTimestamp);
            sampleTable.presentationTimestampIndexMap = Array(sampleTable.presentationTimestamps.length).fill(-1);
            for(let i = 0; i < sampleTable.presentationTimestamps.length; i++){
                sampleTable.presentationTimestampIndexMap[sampleTable.presentationTimestamps[i].sampleIndex] = i;
            }
        }
        return sampleTable;
    }
    async readFragment() {
        const startPos = this.metadataReader.pos;
        await this.metadataReader.reader.loadRange(this.metadataReader.pos, this.metadataReader.pos + MAX_BOX_HEADER_SIZE);
        const moofBoxInfo = this.metadataReader.readBoxHeader();
        assert(moofBoxInfo.name === 'moof');
        const contentStart = this.metadataReader.pos;
        await this.metadataReader.reader.loadRange(contentStart, contentStart + moofBoxInfo.contentSize);
        this.metadataReader.pos = startPos;
        this.traverseBox();
        const index = binarySearchExact(this.fragments, startPos, (x)=>x.moofOffset);
        assert(index !== -1);
        const fragment = this.fragments[index];
        assert(fragment.moofOffset === startPos);
        // We have read everything in the moof box, there's no need to keep the data around anymore
        // (keep the header tho)
        this.metadataReader.reader.forgetRange(contentStart, contentStart + moofBoxInfo.contentSize);
        // It may be that some tracks don't define the base decode time, i.e. when the fragment begins. This means the
        // only other option is to sum up the duration of all previous fragments.
        for (const [trackId, trackData] of fragment.trackData){
            if (trackData.startTimestampIsFinal) {
                continue;
            }
            const internalTrack = this.tracks.find((x)=>x.id === trackId);
            this.metadataReader.pos = 0;
            let currentFragment = null;
            let lastFragment = null;
            const index = binarySearchLessOrEqual(internalTrack.fragments, startPos - 1, (x)=>x.moofOffset);
            if (index !== -1) {
                // Instead of starting at the start of the file, let's start at the previous fragment instead (which
                // already has final timestamps).
                currentFragment = internalTrack.fragments[index];
                lastFragment = currentFragment;
                this.metadataReader.pos = currentFragment.moofOffset + currentFragment.moofSize;
            }
            let nextFragmentIsFirstFragment = this.metadataReader.pos === 0;
            while(this.metadataReader.pos < startPos){
                if (currentFragment?.nextFragment) {
                    currentFragment = currentFragment.nextFragment;
                    this.metadataReader.pos = currentFragment.moofOffset + currentFragment.moofSize;
                } else {
                    await this.metadataReader.reader.loadRange(this.metadataReader.pos, this.metadataReader.pos + MAX_BOX_HEADER_SIZE);
                    const startPos = this.metadataReader.pos;
                    const boxInfo = this.metadataReader.readBoxHeader();
                    if (boxInfo.name === 'moof') {
                        const index = binarySearchExact(this.fragments, startPos, (x)=>x.moofOffset);
                        let fragment;
                        if (index === -1) {
                            this.metadataReader.pos = startPos;
                            fragment = await this.readFragment(); // Recursive call
                        } else {
                            // We already know this fragment
                            fragment = this.fragments[index];
                        }
                        // Even if we already know the fragment, we might not yet know its predecessor; always do this
                        if (currentFragment) currentFragment.nextFragment = fragment;
                        currentFragment = fragment;
                        if (nextFragmentIsFirstFragment) {
                            fragment.isKnownToBeFirstFragment = true;
                            nextFragmentIsFirstFragment = false;
                        }
                    }
                    this.metadataReader.pos = startPos + boxInfo.totalSize;
                }
                if (currentFragment && currentFragment.trackData.has(trackId)) {
                    lastFragment = currentFragment;
                }
            }
            if (lastFragment) {
                const otherTrackData = lastFragment.trackData.get(trackId);
                assert(otherTrackData.startTimestampIsFinal);
                offsetFragmentTrackDataByTimestamp(trackData, otherTrackData.endTimestamp);
            }
            trackData.startTimestampIsFinal = true;
        }
        return fragment;
    }
    readContiguousBoxes(totalSize) {
        const startIndex = this.metadataReader.pos;
        while(this.metadataReader.pos - startIndex <= totalSize - MIN_BOX_HEADER_SIZE){
            this.traverseBox();
        }
    }
    traverseBox() {
        const startPos = this.metadataReader.pos;
        const boxInfo = this.metadataReader.readBoxHeader();
        const boxEndPos = startPos + boxInfo.totalSize;
        switch(boxInfo.name){
            case 'mdia':
            case 'minf':
            case 'dinf':
            case 'mfra':
            case 'edts':
                {
                    this.readContiguousBoxes(boxInfo.contentSize);
                }
                break;
            case 'mvhd':
                {
                    const version = this.metadataReader.readU8();
                    this.metadataReader.pos += 3; // Flags
                    if (version === 1) {
                        this.metadataReader.pos += 8 + 8;
                        this.movieTimescale = this.metadataReader.readU32();
                        this.movieDurationInTimescale = this.metadataReader.readU64();
                    } else {
                        this.metadataReader.pos += 4 + 4;
                        this.movieTimescale = this.metadataReader.readU32();
                        this.movieDurationInTimescale = this.metadataReader.readU32();
                    }
                }
                break;
            case 'trak':
                {
                    const track = {
                        id: -1,
                        demuxer: this,
                        inputTrack: null,
                        info: null,
                        timescale: -1,
                        durationInMovieTimescale: -1,
                        durationInMediaTimescale: -1,
                        rotation: 0,
                        languageCode: UNDETERMINED_LANGUAGE,
                        sampleTableByteOffset: -1,
                        sampleTable: null,
                        fragmentLookupTable: null,
                        currentFragmentState: null,
                        fragments: [],
                        fragmentsWithKeyFrame: [],
                        editListPreviousSegmentDurations: 0,
                        editListOffset: 0
                    };
                    this.currentTrack = track;
                    this.readContiguousBoxes(boxInfo.contentSize);
                    if (track.id !== -1 && track.timescale !== -1 && track.info !== null) {
                        if (track.info.type === 'video' && track.info.width !== -1) {
                            const videoTrack = track;
                            track.inputTrack = new InputVideoTrack(new IsobmffVideoTrackBacking(videoTrack));
                            this.tracks.push(track);
                        } else if (track.info.type === 'audio' && track.info.numberOfChannels !== -1) {
                            const audioTrack = track;
                            track.inputTrack = new InputAudioTrack(new IsobmffAudioTrackBacking(audioTrack));
                            this.tracks.push(track);
                        }
                    }
                    this.currentTrack = null;
                }
                break;
            case 'tkhd':
                {
                    const track = this.currentTrack;
                    assert(track);
                    const version = this.metadataReader.readU8();
                    const flags = this.metadataReader.readU24();
                    const trackEnabled = (flags & 0x1) !== 0;
                    if (!trackEnabled) {
                        break;
                    }
                    // Skip over creation & modification time to reach the track ID
                    if (version === 0) {
                        this.metadataReader.pos += 8;
                        track.id = this.metadataReader.readU32();
                        this.metadataReader.pos += 4;
                        track.durationInMovieTimescale = this.metadataReader.readU32();
                    } else if (version === 1) {
                        this.metadataReader.pos += 16;
                        track.id = this.metadataReader.readU32();
                        this.metadataReader.pos += 4;
                        track.durationInMovieTimescale = this.metadataReader.readU64();
                    } else {
                        throw new Error(`Incorrect track header version ${version}.`);
                    }
                    this.metadataReader.pos += 2 * 4 + 2 + 2 + 2 + 2;
                    const matrix = [
                        this.metadataReader.readFixed_16_16(),
                        this.metadataReader.readFixed_16_16(),
                        this.metadataReader.readFixed_2_30(),
                        this.metadataReader.readFixed_16_16(),
                        this.metadataReader.readFixed_16_16(),
                        this.metadataReader.readFixed_2_30(),
                        this.metadataReader.readFixed_16_16(),
                        this.metadataReader.readFixed_16_16(),
                        this.metadataReader.readFixed_2_30()
                    ];
                    const rotation = normalizeRotation(roundToMultiple(extractRotationFromMatrix(matrix), 90));
                    assert(rotation === 0 || rotation === 90 || rotation === 180 || rotation === 270);
                    track.rotation = rotation;
                }
                break;
            case 'elst':
                {
                    const track = this.currentTrack;
                    assert(track);
                    const version = this.metadataReader.readU8();
                    this.metadataReader.pos += 3; // Flags
                    let relevantEntryFound = false;
                    let previousSegmentDurations = 0;
                    const entryCount = this.metadataReader.readU32();
                    for(let i = 0; i < entryCount; i++){
                        const segmentDuration = version === 1 ? this.metadataReader.readU64() : this.metadataReader.readU32();
                        const mediaTime = version === 1 ? this.metadataReader.readI64() : this.metadataReader.readI32();
                        const mediaRate = this.metadataReader.readFixed_16_16();
                        if (segmentDuration === 0) {
                            continue;
                        }
                        if (relevantEntryFound) {
                            console.warn('Unsupported edit list: multiple edits are not currently supported. Only using first edit.');
                            break;
                        }
                        if (mediaTime === -1) {
                            previousSegmentDurations += segmentDuration;
                            continue;
                        }
                        if (mediaRate !== 1) {
                            console.warn('Unsupported edit list entry: media rate must be 1.');
                            break;
                        }
                        track.editListPreviousSegmentDurations = previousSegmentDurations;
                        track.editListOffset = mediaTime;
                        relevantEntryFound = true;
                    }
                }
                break;
            case 'mdhd':
                {
                    const track = this.currentTrack;
                    assert(track);
                    const version = this.metadataReader.readU8();
                    this.metadataReader.pos += 3; // Flags
                    if (version === 0) {
                        this.metadataReader.pos += 8;
                        track.timescale = this.metadataReader.readU32();
                        track.durationInMediaTimescale = this.metadataReader.readU32();
                    } else if (version === 1) {
                        this.metadataReader.pos += 16;
                        track.timescale = this.metadataReader.readU32();
                        track.durationInMediaTimescale = this.metadataReader.readU64();
                    }
                    let language = this.metadataReader.readU16();
                    if (language > 0) {
                        track.languageCode = '';
                        for(let i = 0; i < 3; i++){
                            track.languageCode = String.fromCharCode(0x60 + (language & 31)) + track.languageCode;
                            language >>= 5;
                        }
                        if (!isIso639Dash2LanguageCode(track.languageCode)) {
                            // Sometimes the bytes are garbage
                            track.languageCode = UNDETERMINED_LANGUAGE;
                        }
                    }
                }
                break;
            case 'hdlr':
                {
                    const track = this.currentTrack;
                    assert(track);
                    this.metadataReader.pos += 8; // Version + flags + pre-defined
                    const handlerType = this.metadataReader.readAscii(4);
                    if (handlerType === 'vide') {
                        track.info = {
                            type: 'video',
                            width: -1,
                            height: -1,
                            codec: null,
                            codecDescription: null,
                            colorSpace: null,
                            avcCodecInfo: null,
                            hevcCodecInfo: null,
                            vp9CodecInfo: null,
                            av1CodecInfo: null
                        };
                    } else if (handlerType === 'soun') {
                        track.info = {
                            type: 'audio',
                            numberOfChannels: -1,
                            sampleRate: -1,
                            codec: null,
                            codecDescription: null,
                            aacCodecInfo: null
                        };
                    }
                }
                break;
            case 'stbl':
                {
                    const track = this.currentTrack;
                    assert(track);
                    track.sampleTableByteOffset = startPos;
                    this.readContiguousBoxes(boxInfo.contentSize);
                }
                break;
            case 'stsd':
                {
                    const track = this.currentTrack;
                    assert(track);
                    if (track.info === null || track.sampleTable) {
                        break;
                    }
                    const stsdVersion = this.metadataReader.readU8();
                    this.metadataReader.pos += 3; // Flags
                    const entries = this.metadataReader.readU32();
                    for(let i = 0; i < entries; i++){
                        const startPos = this.metadataReader.pos;
                        const sampleBoxInfo = this.metadataReader.readBoxHeader();
                        const lowercaseBoxName = sampleBoxInfo.name.toLowerCase();
                        if (track.info.type === 'video') {
                            if (lowercaseBoxName === 'avc1') {
                                track.info.codec = 'avc';
                            } else if (lowercaseBoxName === 'hvc1' || lowercaseBoxName === 'hev1') {
                                track.info.codec = 'hevc';
                            } else if (lowercaseBoxName === 'vp08') {
                                track.info.codec = 'vp8';
                            } else if (lowercaseBoxName === 'vp09') {
                                track.info.codec = 'vp9';
                            } else if (lowercaseBoxName === 'av01') {
                                track.info.codec = 'av1';
                            } else {
                                console.warn(`Unsupported video codec (sample entry type '${sampleBoxInfo.name}').`);
                            }
                            this.metadataReader.pos += 6 * 1 + 2 + 2 + 2 + 3 * 4;
                            track.info.width = this.metadataReader.readU16();
                            track.info.height = this.metadataReader.readU16();
                            this.metadataReader.pos += 4 + 4 + 4 + 2 + 32 + 2 + 2;
                            this.readContiguousBoxes(startPos + sampleBoxInfo.totalSize - this.metadataReader.pos);
                        } else {
                            if (lowercaseBoxName === 'mp4a') ; else if (lowercaseBoxName === 'opus') {
                                track.info.codec = 'opus';
                            } else if (lowercaseBoxName === 'flac') {
                                track.info.codec = 'flac';
                            } else if (lowercaseBoxName === 'twos' || lowercaseBoxName === 'sowt' || lowercaseBoxName === 'raw ' || lowercaseBoxName === 'in24' || lowercaseBoxName === 'in32' || lowercaseBoxName === 'fl32' || lowercaseBoxName === 'fl64' || lowercaseBoxName === 'lpcm' || lowercaseBoxName === 'ipcm' // ISO/IEC 23003-5
                             || lowercaseBoxName === 'fpcm' // "
                            ) ; else if (lowercaseBoxName === 'ulaw') {
                                track.info.codec = 'ulaw';
                            } else if (lowercaseBoxName === 'alaw') {
                                track.info.codec = 'alaw';
                            } else {
                                console.warn(`Unsupported audio codec (sample entry type '${sampleBoxInfo.name}').`);
                            }
                            this.metadataReader.pos += 6 * 1 + 2;
                            const version = this.metadataReader.readU16();
                            this.metadataReader.pos += 3 * 2;
                            let channelCount = this.metadataReader.readU16();
                            let sampleSize = this.metadataReader.readU16();
                            this.metadataReader.pos += 2 * 2;
                            // Can't use fixed16_16 as that's signed
                            let sampleRate = this.metadataReader.readU32() / 0x10000;
                            if (stsdVersion === 0 && version > 0) {
                                // Additional QuickTime fields
                                if (version === 1) {
                                    this.metadataReader.pos += 4;
                                    sampleSize = 8 * this.metadataReader.readU32();
                                    this.metadataReader.pos += 2 * 4;
                                } else if (version === 2) {
                                    this.metadataReader.pos += 4;
                                    sampleRate = this.metadataReader.readF64();
                                    channelCount = this.metadataReader.readU32();
                                    this.metadataReader.pos += 4; // Always 0x7f000000
                                    sampleSize = this.metadataReader.readU32();
                                    const flags = this.metadataReader.readU32();
                                    this.metadataReader.pos += 2 * 4;
                                    if (lowercaseBoxName === 'lpcm') {
                                        const bytesPerSample = sampleSize + 7 >> 3;
                                        const isFloat = Boolean(flags & 1);
                                        const isBigEndian = Boolean(flags & 2);
                                        const sFlags = flags & 4 ? -1 : 0; // I guess it means "signed flags" or something?
                                        if (sampleSize > 0 && sampleSize <= 64) {
                                            if (isFloat) {
                                                if (sampleSize === 32) {
                                                    track.info.codec = isBigEndian ? 'pcm-f32be' : 'pcm-f32';
                                                }
                                            } else {
                                                if (sFlags & 1 << bytesPerSample - 1) {
                                                    if (bytesPerSample === 1) {
                                                        track.info.codec = 'pcm-s8';
                                                    } else if (bytesPerSample === 2) {
                                                        track.info.codec = isBigEndian ? 'pcm-s16be' : 'pcm-s16';
                                                    } else if (bytesPerSample === 3) {
                                                        track.info.codec = isBigEndian ? 'pcm-s24be' : 'pcm-s24';
                                                    } else if (bytesPerSample === 4) {
                                                        track.info.codec = isBigEndian ? 'pcm-s32be' : 'pcm-s32';
                                                    }
                                                } else {
                                                    if (bytesPerSample === 1) {
                                                        track.info.codec = 'pcm-u8';
                                                    }
                                                }
                                            }
                                        }
                                        if (track.info.codec === null) {
                                            console.warn('Unsupported PCM format.');
                                        }
                                    }
                                }
                            }
                            track.info.numberOfChannels = channelCount;
                            track.info.sampleRate = sampleRate;
                            // PCM codec assignments
                            if (lowercaseBoxName === 'twos') {
                                if (sampleSize === 8) {
                                    track.info.codec = 'pcm-s8';
                                } else if (sampleSize === 16) {
                                    track.info.codec = 'pcm-s16be';
                                } else {
                                    console.warn(`Unsupported sample size ${sampleSize} for codec 'twos'.`);
                                    track.info.codec = null;
                                }
                            } else if (lowercaseBoxName === 'sowt') {
                                if (sampleSize === 8) {
                                    track.info.codec = 'pcm-s8';
                                } else if (sampleSize === 16) {
                                    track.info.codec = 'pcm-s16';
                                } else {
                                    console.warn(`Unsupported sample size ${sampleSize} for codec 'sowt'.`);
                                    track.info.codec = null;
                                }
                            } else if (lowercaseBoxName === 'raw ') {
                                track.info.codec = 'pcm-u8';
                            } else if (lowercaseBoxName === 'in24') {
                                track.info.codec = 'pcm-s24be';
                            } else if (lowercaseBoxName === 'in32') {
                                track.info.codec = 'pcm-s32be';
                            } else if (lowercaseBoxName === 'fl32') {
                                track.info.codec = 'pcm-f32be';
                            } else if (lowercaseBoxName === 'fl64') {
                                track.info.codec = 'pcm-f64be';
                            } else if (lowercaseBoxName === 'ipcm') {
                                track.info.codec = 'pcm-s16be'; // Placeholder, will be adjusted by the pcmC box
                            } else if (lowercaseBoxName === 'fpcm') {
                                track.info.codec = 'pcm-f32be'; // Placeholder, will be adjusted by the pcmC box
                            }
                            this.readContiguousBoxes(startPos + sampleBoxInfo.totalSize - this.metadataReader.pos);
                        }
                    }
                }
                break;
            case 'avcC':
                {
                    const track = this.currentTrack;
                    assert(track && track.info);
                    track.info.codecDescription = this.metadataReader.readBytes(boxInfo.contentSize);
                }
                break;
            case 'hvcC':
                {
                    const track = this.currentTrack;
                    assert(track && track.info);
                    track.info.codecDescription = this.metadataReader.readBytes(boxInfo.contentSize);
                }
                break;
            case 'vpcC':
                {
                    const track = this.currentTrack;
                    assert(track && track.info?.type === 'video');
                    this.metadataReader.pos += 4; // Version + flags
                    const profile = this.metadataReader.readU8();
                    const level = this.metadataReader.readU8();
                    const thirdByte = this.metadataReader.readU8();
                    const bitDepth = thirdByte >> 4;
                    const chromaSubsampling = thirdByte >> 1 & 7;
                    const videoFullRangeFlag = thirdByte & 1;
                    const colourPrimaries = this.metadataReader.readU8();
                    const transferCharacteristics = this.metadataReader.readU8();
                    const matrixCoefficients = this.metadataReader.readU8();
                    track.info.vp9CodecInfo = {
                        profile,
                        level,
                        bitDepth,
                        chromaSubsampling,
                        videoFullRangeFlag,
                        colourPrimaries,
                        transferCharacteristics,
                        matrixCoefficients
                    };
                }
                break;
            case 'av1C':
                {
                    const track = this.currentTrack;
                    assert(track && track.info?.type === 'video');
                    this.metadataReader.pos += 1; // Marker + version
                    const secondByte = this.metadataReader.readU8();
                    const profile = secondByte >> 5;
                    const level = secondByte & 31;
                    const thirdByte = this.metadataReader.readU8();
                    const tier = thirdByte >> 7;
                    const highBitDepth = thirdByte >> 6 & 1;
                    const twelveBit = thirdByte >> 5 & 1;
                    const monochrome = thirdByte >> 4 & 1;
                    const chromaSubsamplingX = thirdByte >> 3 & 1;
                    const chromaSubsamplingY = thirdByte >> 2 & 1;
                    const chromaSamplePosition = thirdByte & 3;
                    // Logic from https://aomediacodec.github.io/av1-spec/av1-spec.pdf
                    const bitDepth = profile == 2 && highBitDepth ? twelveBit ? 12 : 10 : highBitDepth ? 10 : 8;
                    track.info.av1CodecInfo = {
                        profile,
                        level,
                        tier,
                        bitDepth,
                        monochrome,
                        chromaSubsamplingX,
                        chromaSubsamplingY,
                        chromaSamplePosition
                    };
                }
                break;
            case 'colr':
                {
                    const track = this.currentTrack;
                    assert(track && track.info?.type === 'video');
                    const colourType = this.metadataReader.readAscii(4);
                    if (colourType !== 'nclx') {
                        break;
                    }
                    const colourPrimaries = this.metadataReader.readU16();
                    const transferCharacteristics = this.metadataReader.readU16();
                    const matrixCoefficients = this.metadataReader.readU16();
                    const fullRangeFlag = Boolean(this.metadataReader.readU8() & 0x80);
                    track.info.colorSpace = {
                        primaries: COLOR_PRIMARIES_MAP_INVERSE[colourPrimaries],
                        transfer: TRANSFER_CHARACTERISTICS_MAP_INVERSE[transferCharacteristics],
                        matrix: MATRIX_COEFFICIENTS_MAP_INVERSE[matrixCoefficients],
                        fullRange: fullRangeFlag
                    };
                }
                break;
            case 'wave':
                {
                    this.readContiguousBoxes(boxInfo.contentSize);
                }
                break;
            case 'esds':
                {
                    const track = this.currentTrack;
                    assert(track && track.info?.type === 'audio');
                    this.metadataReader.pos += 4; // Version + flags
                    const tag = this.metadataReader.readU8();
                    assert(tag === 0x03); // ES Descriptor
                    this.metadataReader.readIsomVariableInteger(); // Length
                    this.metadataReader.pos += 2; // ES ID
                    const mixed = this.metadataReader.readU8();
                    const streamDependenceFlag = (mixed & 0x80) !== 0;
                    const urlFlag = (mixed & 0x40) !== 0;
                    const ocrStreamFlag = (mixed & 0x20) !== 0;
                    if (streamDependenceFlag) {
                        this.metadataReader.pos += 2;
                    }
                    if (urlFlag) {
                        const urlLength = this.metadataReader.readU8();
                        this.metadataReader.pos += urlLength;
                    }
                    if (ocrStreamFlag) {
                        this.metadataReader.pos += 2;
                    }
                    const decoderConfigTag = this.metadataReader.readU8();
                    assert(decoderConfigTag === 0x04); // DecoderConfigDescriptor
                    const decoderConfigDescriptorLength = this.metadataReader.readIsomVariableInteger(); // Length
                    const payloadStart = this.metadataReader.pos;
                    const objectTypeIndication = this.metadataReader.readU8();
                    if (objectTypeIndication === 0x40 || objectTypeIndication === 0x67) {
                        track.info.codec = 'aac';
                        track.info.aacCodecInfo = {
                            isMpeg2: objectTypeIndication === 0x67
                        };
                    } else if (objectTypeIndication === 0x69 || objectTypeIndication === 0x6b) {
                        track.info.codec = 'mp3';
                    } else if (objectTypeIndication === 0xdd) {
                        track.info.codec = 'vorbis'; // "nonstandard, gpac uses it" - FFmpeg
                    } else {
                        console.warn(`Unsupported audio codec (objectTypeIndication ${objectTypeIndication}) - discarding track.`);
                    }
                    this.metadataReader.pos += 1 + 3 + 4 + 4;
                    if (decoderConfigDescriptorLength > this.metadataReader.pos - payloadStart) {
                        // There's a DecoderSpecificInfo at the end, let's read it
                        const decoderSpecificInfoTag = this.metadataReader.readU8();
                        assert(decoderSpecificInfoTag === 0x05); // DecoderSpecificInfo
                        const decoderSpecificInfoLength = this.metadataReader.readIsomVariableInteger();
                        track.info.codecDescription = this.metadataReader.readBytes(decoderSpecificInfoLength);
                        if (track.info.codec === 'aac') {
                            // Let's try to deduce more accurate values directly from the AudioSpecificConfig:
                            const audioSpecificConfig = parseAacAudioSpecificConfig(track.info.codecDescription);
                            if (audioSpecificConfig.numberOfChannels !== null) {
                                track.info.numberOfChannels = audioSpecificConfig.numberOfChannels;
                            }
                            if (audioSpecificConfig.sampleRate !== null) {
                                track.info.sampleRate = audioSpecificConfig.sampleRate;
                            }
                        }
                    }
                }
                break;
            case 'enda':
                {
                    const track = this.currentTrack;
                    assert(track && track.info?.type === 'audio');
                    const littleEndian = this.metadataReader.readU16() & 0xff; // 0xff is from FFmpeg
                    if (littleEndian) {
                        if (track.info.codec === 'pcm-s16be') {
                            track.info.codec = 'pcm-s16';
                        } else if (track.info.codec === 'pcm-s24be') {
                            track.info.codec = 'pcm-s24';
                        } else if (track.info.codec === 'pcm-s32be') {
                            track.info.codec = 'pcm-s32';
                        } else if (track.info.codec === 'pcm-f32be') {
                            track.info.codec = 'pcm-f32';
                        } else if (track.info.codec === 'pcm-f64be') {
                            track.info.codec = 'pcm-f64';
                        }
                    }
                }
                break;
            case 'pcmC':
                {
                    const track = this.currentTrack;
                    assert(track && track.info?.type === 'audio');
                    this.metadataReader.pos += 1 + 3; // Version + flags
                    // ISO/IEC 23003-5
                    const formatFlags = this.metadataReader.readU8();
                    const isLittleEndian = Boolean(formatFlags & 0x01);
                    const pcmSampleSize = this.metadataReader.readU8();
                    if (track.info.codec === 'pcm-s16be') {
                        // ipcm
                        if (isLittleEndian) {
                            if (pcmSampleSize === 16) {
                                track.info.codec = 'pcm-s16';
                            } else if (pcmSampleSize === 24) {
                                track.info.codec = 'pcm-s24';
                            } else if (pcmSampleSize === 32) {
                                track.info.codec = 'pcm-s32';
                            } else {
                                console.warn(`Invalid ipcm sample size ${pcmSampleSize}.`);
                                track.info.codec = null;
                            }
                        } else {
                            if (pcmSampleSize === 16) {
                                track.info.codec = 'pcm-s16be';
                            } else if (pcmSampleSize === 24) {
                                track.info.codec = 'pcm-s24be';
                            } else if (pcmSampleSize === 32) {
                                track.info.codec = 'pcm-s32be';
                            } else {
                                console.warn(`Invalid ipcm sample size ${pcmSampleSize}.`);
                                track.info.codec = null;
                            }
                        }
                    } else if (track.info.codec === 'pcm-f32be') {
                        // fpcm
                        if (isLittleEndian) {
                            if (pcmSampleSize === 32) {
                                track.info.codec = 'pcm-f32';
                            } else if (pcmSampleSize === 64) {
                                track.info.codec = 'pcm-f64';
                            } else {
                                console.warn(`Invalid fpcm sample size ${pcmSampleSize}.`);
                                track.info.codec = null;
                            }
                        } else {
                            if (pcmSampleSize === 32) {
                                track.info.codec = 'pcm-f32be';
                            } else if (pcmSampleSize === 64) {
                                track.info.codec = 'pcm-f64be';
                            } else {
                                console.warn(`Invalid fpcm sample size ${pcmSampleSize}.`);
                                track.info.codec = null;
                            }
                        }
                    }
                    break;
                }
            case 'dOps':
                {
                    const track = this.currentTrack;
                    assert(track && track.info?.type === 'audio');
                    this.metadataReader.pos += 1; // Version
                    // https://www.opus-codec.org/docs/opus_in_isobmff.html
                    const outputChannelCount = this.metadataReader.readU8();
                    const preSkip = this.metadataReader.readU16();
                    const inputSampleRate = this.metadataReader.readU32();
                    const outputGain = this.metadataReader.readI16();
                    const channelMappingFamily = this.metadataReader.readU8();
                    let channelMappingTable;
                    if (channelMappingFamily !== 0) {
                        channelMappingTable = this.metadataReader.readBytes(2 + outputChannelCount);
                    } else {
                        channelMappingTable = new Uint8Array(0);
                    }
                    // https://datatracker.ietf.org/doc/html/draft-ietf-codec-oggopus-06
                    const description = new Uint8Array(8 + 1 + 1 + 2 + 4 + 2 + 1 + channelMappingTable.byteLength);
                    const view = new DataView(description.buffer);
                    view.setUint32(0, 0x4f707573, false); // 'Opus'
                    view.setUint32(4, 0x48656164, false); // 'Head'
                    view.setUint8(8, 1); // Version
                    view.setUint8(9, outputChannelCount);
                    view.setUint16(10, preSkip, true);
                    view.setUint32(12, inputSampleRate, true);
                    view.setInt16(16, outputGain, true);
                    view.setUint8(18, channelMappingFamily);
                    description.set(channelMappingTable, 19);
                    track.info.codecDescription = description;
                    track.info.numberOfChannels = outputChannelCount;
                    track.info.sampleRate = inputSampleRate;
                }
                break;
            case 'dfLa':
                {
                    const track = this.currentTrack;
                    assert(track && track.info?.type === 'audio');
                    this.metadataReader.pos += 4; // Version + flags
                    // https://datatracker.ietf.org/doc/rfc9639/
                    const BLOCK_TYPE_MASK = 0x7f;
                    const LAST_METADATA_BLOCK_FLAG_MASK = 0x80;
                    const startPos = this.metadataReader.pos;
                    while(this.metadataReader.pos < boxEndPos){
                        const flagAndType = this.metadataReader.readU8();
                        const metadataBlockLength = this.metadataReader.readU24();
                        const type = flagAndType & BLOCK_TYPE_MASK;
                        // It's a STREAMINFO block; let's extract the actual sample rate and channel count
                        if (type === 0) {
                            this.metadataReader.pos += 10;
                            // Extract sample rate
                            const word = this.metadataReader.readU32();
                            const sampleRate = word >>> 12;
                            const numberOfChannels = (word >> 9 & 7) + 1;
                            track.info.sampleRate = sampleRate;
                            track.info.numberOfChannels = numberOfChannels;
                            this.metadataReader.pos += 20;
                        } else {
                            // Simply skip ahead to the next block
                            this.metadataReader.pos += metadataBlockLength;
                        }
                        if (flagAndType & LAST_METADATA_BLOCK_FLAG_MASK) {
                            break;
                        }
                    }
                    const endPos = this.metadataReader.pos;
                    this.metadataReader.pos = startPos;
                    const bytes = this.metadataReader.readBytes(endPos - startPos);
                    const description = new Uint8Array(4 + bytes.byteLength);
                    const view = new DataView(description.buffer);
                    view.setUint32(0, 0x664c6143, false); // 'fLaC'
                    description.set(bytes, 4);
                    // Set the codec description to be 'fLaC' + all metadata blocks
                    track.info.codecDescription = description;
                }
                break;
            case 'stts':
                {
                    const track = this.currentTrack;
                    assert(track);
                    if (!track.sampleTable) {
                        break;
                    }
                    this.metadataReader.pos += 4; // Version + flags
                    const entryCount = this.metadataReader.readU32();
                    let currentIndex = 0;
                    let currentTimestamp = 0;
                    for(let i = 0; i < entryCount; i++){
                        const sampleCount = this.metadataReader.readU32();
                        const sampleDelta = this.metadataReader.readU32();
                        track.sampleTable.sampleTimingEntries.push({
                            startIndex: currentIndex,
                            startDecodeTimestamp: currentTimestamp,
                            count: sampleCount,
                            delta: sampleDelta
                        });
                        currentIndex += sampleCount;
                        currentTimestamp += sampleCount * sampleDelta;
                    }
                }
                break;
            case 'ctts':
                {
                    const track = this.currentTrack;
                    assert(track);
                    if (!track.sampleTable) {
                        break;
                    }
                    this.metadataReader.pos += 1 + 3; // Version + flags
                    const entryCount = this.metadataReader.readU32();
                    let sampleIndex = 0;
                    for(let i = 0; i < entryCount; i++){
                        const sampleCount = this.metadataReader.readU32();
                        const sampleOffset = this.metadataReader.readI32();
                        track.sampleTable.sampleCompositionTimeOffsets.push({
                            startIndex: sampleIndex,
                            count: sampleCount,
                            offset: sampleOffset
                        });
                        sampleIndex += sampleCount;
                    }
                }
                break;
            case 'stsz':
                {
                    const track = this.currentTrack;
                    assert(track);
                    if (!track.sampleTable) {
                        break;
                    }
                    this.metadataReader.pos += 4; // Version + flags
                    const sampleSize = this.metadataReader.readU32();
                    const sampleCount = this.metadataReader.readU32();
                    if (sampleSize === 0) {
                        for(let i = 0; i < sampleCount; i++){
                            const sampleSize = this.metadataReader.readU32();
                            track.sampleTable.sampleSizes.push(sampleSize);
                        }
                    } else {
                        track.sampleTable.sampleSizes.push(sampleSize);
                    }
                }
                break;
            case 'stz2':
                {
                    const track = this.currentTrack;
                    assert(track);
                    if (!track.sampleTable) {
                        break;
                    }
                    this.metadataReader.pos += 4; // Version + flags
                    this.metadataReader.pos += 3; // Reserved
                    const fieldSize = this.metadataReader.readU8(); // in bits
                    const sampleCount = this.metadataReader.readU32();
                    const bytes = this.metadataReader.readBytes(Math.ceil(sampleCount * fieldSize / 8));
                    const bitstream = new Bitstream(bytes);
                    for(let i = 0; i < sampleCount; i++){
                        const sampleSize = bitstream.readBits(fieldSize);
                        track.sampleTable.sampleSizes.push(sampleSize);
                    }
                }
                break;
            case 'stss':
                {
                    const track = this.currentTrack;
                    assert(track);
                    if (!track.sampleTable) {
                        break;
                    }
                    this.metadataReader.pos += 4; // Version + flags
                    track.sampleTable.keySampleIndices = [];
                    const entryCount = this.metadataReader.readU32();
                    for(let i = 0; i < entryCount; i++){
                        const sampleIndex = this.metadataReader.readU32() - 1; // Convert to 0-indexed
                        track.sampleTable.keySampleIndices.push(sampleIndex);
                    }
                }
                break;
            case 'stsc':
                {
                    const track = this.currentTrack;
                    assert(track);
                    if (!track.sampleTable) {
                        break;
                    }
                    this.metadataReader.pos += 4;
                    const entryCount = this.metadataReader.readU32();
                    for(let i = 0; i < entryCount; i++){
                        const startChunkIndex = this.metadataReader.readU32() - 1; // Convert to 0-indexed
                        const samplesPerChunk = this.metadataReader.readU32();
                        const sampleDescriptionIndex = this.metadataReader.readU32();
                        track.sampleTable.sampleToChunk.push({
                            startSampleIndex: -1,
                            startChunkIndex,
                            samplesPerChunk,
                            sampleDescriptionIndex
                        });
                    }
                    let startSampleIndex = 0;
                    for(let i = 0; i < track.sampleTable.sampleToChunk.length; i++){
                        track.sampleTable.sampleToChunk[i].startSampleIndex = startSampleIndex;
                        if (i < track.sampleTable.sampleToChunk.length - 1) {
                            const nextChunk = track.sampleTable.sampleToChunk[i + 1];
                            const chunkCount = nextChunk.startChunkIndex - track.sampleTable.sampleToChunk[i].startChunkIndex;
                            startSampleIndex += chunkCount * track.sampleTable.sampleToChunk[i].samplesPerChunk;
                        }
                    }
                }
                break;
            case 'stco':
                {
                    const track = this.currentTrack;
                    assert(track);
                    if (!track.sampleTable) {
                        break;
                    }
                    this.metadataReader.pos += 4; // Version + flags
                    const entryCount = this.metadataReader.readU32();
                    for(let i = 0; i < entryCount; i++){
                        const chunkOffset = this.metadataReader.readU32();
                        track.sampleTable.chunkOffsets.push(chunkOffset);
                    }
                }
                break;
            case 'co64':
                {
                    const track = this.currentTrack;
                    assert(track);
                    if (!track.sampleTable) {
                        break;
                    }
                    this.metadataReader.pos += 4; // Version + flags
                    const entryCount = this.metadataReader.readU32();
                    for(let i = 0; i < entryCount; i++){
                        const chunkOffset = this.metadataReader.readU64();
                        track.sampleTable.chunkOffsets.push(chunkOffset);
                    }
                }
                break;
            case 'mvex':
                {
                    this.isFragmented = true;
                    this.readContiguousBoxes(boxInfo.contentSize);
                }
                break;
            case 'mehd':
                {
                    const version = this.metadataReader.readU8();
                    this.metadataReader.pos += 3; // Flags
                    const fragmentDuration = version === 1 ? this.metadataReader.readU64() : this.metadataReader.readU32();
                    this.movieDurationInTimescale = fragmentDuration;
                }
                break;
            case 'trex':
                {
                    this.metadataReader.pos += 4; // Version + flags
                    const trackId = this.metadataReader.readU32();
                    const defaultSampleDescriptionIndex = this.metadataReader.readU32();
                    const defaultSampleDuration = this.metadataReader.readU32();
                    const defaultSampleSize = this.metadataReader.readU32();
                    const defaultSampleFlags = this.metadataReader.readU32();
                    // We store these separately rather than in the tracks since the tracks may not exist yet
                    this.fragmentTrackDefaults.push({
                        trackId,
                        defaultSampleDescriptionIndex,
                        defaultSampleDuration,
                        defaultSampleSize,
                        defaultSampleFlags
                    });
                }
                break;
            case 'tfra':
                {
                    const version = this.metadataReader.readU8();
                    this.metadataReader.pos += 3; // Flags
                    const trackId = this.metadataReader.readU32();
                    const track = this.tracks.find((x)=>x.id === trackId);
                    if (!track) {
                        break;
                    }
                    track.fragmentLookupTable = [];
                    const word = this.metadataReader.readU32();
                    const lengthSizeOfTrafNum = (word & 48) >> 4;
                    const lengthSizeOfTrunNum = (word & 12) >> 2;
                    const lengthSizeOfSampleNum = word & 3;
                    const x = this.metadataReader;
                    const functions = [
                        x.readU8.bind(x),
                        x.readU16.bind(x),
                        x.readU24.bind(x),
                        x.readU32.bind(x)
                    ];
                    const readTrafNum = functions[lengthSizeOfTrafNum];
                    const readTrunNum = functions[lengthSizeOfTrunNum];
                    const readSampleNum = functions[lengthSizeOfSampleNum];
                    const numberOfEntries = this.metadataReader.readU32();
                    for(let i = 0; i < numberOfEntries; i++){
                        const time = version === 1 ? this.metadataReader.readU64() : this.metadataReader.readU32();
                        const moofOffset = version === 1 ? this.metadataReader.readU64() : this.metadataReader.readU32();
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        readTrafNum();
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        readTrunNum();
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        readSampleNum();
                        track.fragmentLookupTable.push({
                            timestamp: time,
                            moofOffset
                        });
                    }
                }
                break;
            case 'moof':
                {
                    this.currentFragment = {
                        moofOffset: startPos,
                        moofSize: boxInfo.totalSize,
                        implicitBaseDataOffset: startPos,
                        trackData: new Map(),
                        dataStart: Infinity,
                        dataEnd: 0,
                        nextFragment: null,
                        isKnownToBeFirstFragment: false
                    };
                    this.readContiguousBoxes(boxInfo.contentSize);
                    const insertionIndex = binarySearchLessOrEqual(this.fragments, this.currentFragment.moofOffset, (x)=>x.moofOffset);
                    this.fragments.splice(insertionIndex + 1, 0, this.currentFragment);
                    // Compute the byte range of the sample data in this fragment, so we can load the whole fragment at once
                    for (const [, trackData] of this.currentFragment.trackData){
                        const firstSample = trackData.samples[0];
                        const lastSample = last(trackData.samples);
                        this.currentFragment.dataStart = Math.min(this.currentFragment.dataStart, firstSample.byteOffset);
                        this.currentFragment.dataEnd = Math.max(this.currentFragment.dataEnd, lastSample.byteOffset + lastSample.byteSize);
                    }
                    this.currentFragment = null;
                }
                break;
            case 'traf':
                {
                    assert(this.currentFragment);
                    this.readContiguousBoxes(boxInfo.contentSize);
                    // It is possible that there is no current track, for example when we don't care about the track
                    // referenced in the track fragment header.
                    if (this.currentTrack) {
                        const trackData = this.currentFragment.trackData.get(this.currentTrack.id);
                        if (trackData) {
                            // We know there is sample data for this track in this fragment, so let's add it to the
                            // track's fragments:
                            const insertionIndex = binarySearchLessOrEqual(this.currentTrack.fragments, this.currentFragment.moofOffset, (x)=>x.moofOffset);
                            this.currentTrack.fragments.splice(insertionIndex + 1, 0, this.currentFragment);
                            const hasKeyFrame = trackData.firstKeyFrameTimestamp !== null;
                            if (hasKeyFrame) {
                                const insertionIndex = binarySearchLessOrEqual(this.currentTrack.fragmentsWithKeyFrame, this.currentFragment.moofOffset, (x)=>x.moofOffset);
                                this.currentTrack.fragmentsWithKeyFrame.splice(insertionIndex + 1, 0, this.currentFragment);
                            }
                            const { currentFragmentState } = this.currentTrack;
                            assert(currentFragmentState);
                            if (currentFragmentState.startTimestamp !== null) {
                                offsetFragmentTrackDataByTimestamp(trackData, currentFragmentState.startTimestamp);
                                trackData.startTimestampIsFinal = true;
                            }
                        }
                        this.currentTrack.currentFragmentState = null;
                        this.currentTrack = null;
                    }
                }
                break;
            case 'tfhd':
                {
                    assert(this.currentFragment);
                    this.metadataReader.pos += 1; // Version
                    const flags = this.metadataReader.readU24();
                    const baseDataOffsetPresent = Boolean(flags & 0x000001);
                    const sampleDescriptionIndexPresent = Boolean(flags & 0x000002);
                    const defaultSampleDurationPresent = Boolean(flags & 0x000008);
                    const defaultSampleSizePresent = Boolean(flags & 0x000010);
                    const defaultSampleFlagsPresent = Boolean(flags & 0x000020);
                    const durationIsEmpty = Boolean(flags & 0x010000);
                    const defaultBaseIsMoof = Boolean(flags & 0x020000);
                    const trackId = this.metadataReader.readU32();
                    const track = this.tracks.find((x)=>x.id === trackId);
                    if (!track) {
                        break;
                    }
                    const defaults = this.fragmentTrackDefaults.find((x)=>x.trackId === trackId);
                    this.currentTrack = track;
                    track.currentFragmentState = {
                        baseDataOffset: this.currentFragment.implicitBaseDataOffset,
                        sampleDescriptionIndex: defaults?.defaultSampleDescriptionIndex ?? null,
                        defaultSampleDuration: defaults?.defaultSampleDuration ?? null,
                        defaultSampleSize: defaults?.defaultSampleSize ?? null,
                        defaultSampleFlags: defaults?.defaultSampleFlags ?? null,
                        startTimestamp: null
                    };
                    if (baseDataOffsetPresent) {
                        track.currentFragmentState.baseDataOffset = this.metadataReader.readU64();
                    } else if (defaultBaseIsMoof) {
                        track.currentFragmentState.baseDataOffset = this.currentFragment.moofOffset;
                    }
                    if (sampleDescriptionIndexPresent) {
                        track.currentFragmentState.sampleDescriptionIndex = this.metadataReader.readU32();
                    }
                    if (defaultSampleDurationPresent) {
                        track.currentFragmentState.defaultSampleDuration = this.metadataReader.readU32();
                    }
                    if (defaultSampleSizePresent) {
                        track.currentFragmentState.defaultSampleSize = this.metadataReader.readU32();
                    }
                    if (defaultSampleFlagsPresent) {
                        track.currentFragmentState.defaultSampleFlags = this.metadataReader.readU32();
                    }
                    if (durationIsEmpty) {
                        track.currentFragmentState.defaultSampleDuration = 0;
                    }
                }
                break;
            case 'tfdt':
                {
                    const track = this.currentTrack;
                    if (!track) {
                        break;
                    }
                    assert(track.currentFragmentState);
                    // break;
                    const version = this.metadataReader.readU8();
                    this.metadataReader.pos += 3; // Flags
                    const baseMediaDecodeTime = version === 0 ? this.metadataReader.readU32() : this.metadataReader.readU64();
                    track.currentFragmentState.startTimestamp = baseMediaDecodeTime;
                }
                break;
            case 'trun':
                {
                    const track = this.currentTrack;
                    if (!track) {
                        break;
                    }
                    assert(this.currentFragment);
                    assert(track.currentFragmentState);
                    if (this.currentFragment.trackData.has(track.id)) {
                        console.warn('Can\'t have two trun boxes for the same track in one fragment. Ignoring...');
                        break;
                    }
                    const version = this.metadataReader.readU8();
                    const flags = this.metadataReader.readU24();
                    const dataOffsetPresent = Boolean(flags & 0x000001);
                    const firstSampleFlagsPresent = Boolean(flags & 0x000004);
                    const sampleDurationPresent = Boolean(flags & 0x000100);
                    const sampleSizePresent = Boolean(flags & 0x000200);
                    const sampleFlagsPresent = Boolean(flags & 0x000400);
                    const sampleCompositionTimeOffsetsPresent = Boolean(flags & 0x000800);
                    const sampleCount = this.metadataReader.readU32();
                    let dataOffset = track.currentFragmentState.baseDataOffset;
                    if (dataOffsetPresent) {
                        dataOffset += this.metadataReader.readI32();
                    }
                    let firstSampleFlags = null;
                    if (firstSampleFlagsPresent) {
                        firstSampleFlags = this.metadataReader.readU32();
                    }
                    let currentOffset = dataOffset;
                    if (sampleCount === 0) {
                        // Don't associate the fragment with the track if it has no samples, this simplifies other code
                        this.currentFragment.implicitBaseDataOffset = currentOffset;
                        break;
                    }
                    let currentTimestamp = 0;
                    const trackData = {
                        startTimestamp: 0,
                        endTimestamp: 0,
                        firstKeyFrameTimestamp: null,
                        samples: [],
                        presentationTimestamps: [],
                        startTimestampIsFinal: false
                    };
                    this.currentFragment.trackData.set(track.id, trackData);
                    for(let i = 0; i < sampleCount; i++){
                        let sampleDuration;
                        if (sampleDurationPresent) {
                            sampleDuration = this.metadataReader.readU32();
                        } else {
                            assert(track.currentFragmentState.defaultSampleDuration !== null);
                            sampleDuration = track.currentFragmentState.defaultSampleDuration;
                        }
                        let sampleSize;
                        if (sampleSizePresent) {
                            sampleSize = this.metadataReader.readU32();
                        } else {
                            assert(track.currentFragmentState.defaultSampleSize !== null);
                            sampleSize = track.currentFragmentState.defaultSampleSize;
                        }
                        let sampleFlags;
                        if (sampleFlagsPresent) {
                            sampleFlags = this.metadataReader.readU32();
                        } else {
                            assert(track.currentFragmentState.defaultSampleFlags !== null);
                            sampleFlags = track.currentFragmentState.defaultSampleFlags;
                        }
                        if (i === 0 && firstSampleFlags !== null) {
                            sampleFlags = firstSampleFlags;
                        }
                        let sampleCompositionTimeOffset = 0;
                        if (sampleCompositionTimeOffsetsPresent) {
                            if (version === 0) {
                                sampleCompositionTimeOffset = this.metadataReader.readU32();
                            } else {
                                sampleCompositionTimeOffset = this.metadataReader.readI32();
                            }
                        }
                        const isKeyFrame = !(sampleFlags & 0x00010000);
                        trackData.samples.push({
                            presentationTimestamp: currentTimestamp + sampleCompositionTimeOffset,
                            duration: sampleDuration,
                            byteOffset: currentOffset,
                            byteSize: sampleSize,
                            isKeyFrame
                        });
                        currentOffset += sampleSize;
                        currentTimestamp += sampleDuration;
                    }
                    trackData.presentationTimestamps = trackData.samples.map((x, i)=>({
                            presentationTimestamp: x.presentationTimestamp,
                            sampleIndex: i
                        })).sort((a, b)=>a.presentationTimestamp - b.presentationTimestamp);
                    for(let i = 0; i < trackData.presentationTimestamps.length; i++){
                        const currentEntry = trackData.presentationTimestamps[i];
                        const currentSample = trackData.samples[currentEntry.sampleIndex];
                        if (trackData.firstKeyFrameTimestamp === null && currentSample.isKeyFrame) {
                            trackData.firstKeyFrameTimestamp = currentSample.presentationTimestamp;
                        }
                        if (i < trackData.presentationTimestamps.length - 1) {
                            // Update sample durations based on presentation order
                            const nextEntry = trackData.presentationTimestamps[i + 1];
                            currentSample.duration = nextEntry.presentationTimestamp - currentEntry.presentationTimestamp;
                        }
                    }
                    const firstSample = trackData.samples[trackData.presentationTimestamps[0].sampleIndex];
                    const lastSample = trackData.samples[last(trackData.presentationTimestamps).sampleIndex];
                    trackData.startTimestamp = firstSample.presentationTimestamp;
                    trackData.endTimestamp = lastSample.presentationTimestamp + lastSample.duration;
                    this.currentFragment.implicitBaseDataOffset = currentOffset;
                }
                break;
        }
        this.metadataReader.pos = boxEndPos;
    }
}
class IsobmffTrackBacking {
    constructor(internalTrack){
        this.internalTrack = internalTrack;
        this.packetToSampleIndex = new WeakMap();
        this.packetToFragmentLocation = new WeakMap();
    }
    getId() {
        return this.internalTrack.id;
    }
    getCodec() {
        throw new Error('Not implemented on base class.');
    }
    getLanguageCode() {
        return this.internalTrack.languageCode;
    }
    getTimeResolution() {
        return this.internalTrack.timescale;
    }
    async computeDuration() {
        const lastPacket = await this.getPacket(Infinity, {
            metadataOnly: true
        });
        return (lastPacket?.timestamp ?? 0) + (lastPacket?.duration ?? 0);
    }
    async getFirstTimestamp() {
        const firstPacket = await this.getFirstPacket({
            metadataOnly: true
        });
        return firstPacket?.timestamp ?? 0;
    }
    async getFirstPacket(options) {
        if (this.internalTrack.demuxer.isFragmented) {
            return this.performFragmentedLookup(()=>{
                const startFragment = this.internalTrack.demuxer.fragments[0] ?? null;
                if (startFragment?.isKnownToBeFirstFragment) {
                    // Walk from the very first fragment in the file until we find one with our track in it
                    let currentFragment = startFragment;
                    while(currentFragment){
                        const trackData = currentFragment.trackData.get(this.internalTrack.id);
                        if (trackData) {
                            return {
                                fragmentIndex: binarySearchExact(this.internalTrack.fragments, currentFragment.moofOffset, (x)=>x.moofOffset),
                                sampleIndex: 0,
                                correctSampleFound: true
                            };
                        }
                        currentFragment = currentFragment.nextFragment;
                    }
                }
                return {
                    fragmentIndex: -1,
                    sampleIndex: -1,
                    correctSampleFound: false
                };
            }, -Infinity, Infinity, options);
        }
        return this.fetchPacketForSampleIndex(0, options);
    }
    mapTimestampIntoTimescale(timestamp) {
        // Do a little rounding to catch cases where the result is very close to an integer. If it is, it's likely
        // that the number was originally an integer divided by the timescale. For stability, it's best
        // to return the integer in this case.
        return roundToPrecision(timestamp * this.internalTrack.timescale, 14) + this.internalTrack.editListOffset;
    }
    async getPacket(timestamp, options) {
        const timestampInTimescale = this.mapTimestampIntoTimescale(timestamp);
        if (this.internalTrack.demuxer.isFragmented) {
            return this.performFragmentedLookup(()=>this.findSampleInFragmentsForTimestamp(timestampInTimescale), timestampInTimescale, timestampInTimescale, options);
        } else {
            const sampleTable = this.internalTrack.demuxer.getSampleTableForTrack(this.internalTrack);
            const sampleIndex = getSampleIndexForTimestamp(sampleTable, timestampInTimescale);
            return this.fetchPacketForSampleIndex(sampleIndex, options);
        }
    }
    async getNextPacket(packet, options) {
        if (this.internalTrack.demuxer.isFragmented) {
            const locationInFragment = this.packetToFragmentLocation.get(packet);
            if (locationInFragment === undefined) {
                throw new Error('Packet was not created from this track.');
            }
            const trackData = locationInFragment.fragment.trackData.get(this.internalTrack.id);
            const fragmentSample = trackData.samples[locationInFragment.sampleIndex];
            const fragmentIndex = binarySearchExact(this.internalTrack.fragments, locationInFragment.fragment.moofOffset, (x)=>x.moofOffset);
            assert(fragmentIndex !== -1);
            return this.performFragmentedLookup(()=>{
                if (locationInFragment.sampleIndex + 1 < trackData.samples.length) {
                    // We can simply take the next sample in the fragment
                    return {
                        fragmentIndex,
                        sampleIndex: locationInFragment.sampleIndex + 1,
                        correctSampleFound: true
                    };
                } else {
                    // Walk the list of fragments until we find the next fragment for this track
                    let currentFragment = locationInFragment.fragment;
                    while(currentFragment.nextFragment){
                        currentFragment = currentFragment.nextFragment;
                        const trackData = currentFragment.trackData.get(this.internalTrack.id);
                        if (trackData) {
                            const fragmentIndex = binarySearchExact(this.internalTrack.fragments, currentFragment.moofOffset, (x)=>x.moofOffset);
                            assert(fragmentIndex !== -1);
                            return {
                                fragmentIndex,
                                sampleIndex: 0,
                                correctSampleFound: true
                            };
                        }
                    }
                    return {
                        fragmentIndex,
                        sampleIndex: -1,
                        correctSampleFound: false
                    };
                }
            }, fragmentSample.presentationTimestamp, Infinity, options);
        }
        const sampleIndex = this.packetToSampleIndex.get(packet);
        if (sampleIndex === undefined) {
            throw new Error('Packet was not created from this track.');
        }
        return this.fetchPacketForSampleIndex(sampleIndex + 1, options);
    }
    async getKeyPacket(timestamp, options) {
        const timestampInTimescale = this.mapTimestampIntoTimescale(timestamp);
        if (this.internalTrack.demuxer.isFragmented) {
            return this.performFragmentedLookup(()=>this.findKeySampleInFragmentsForTimestamp(timestampInTimescale), timestampInTimescale, timestampInTimescale, options);
        }
        const sampleTable = this.internalTrack.demuxer.getSampleTableForTrack(this.internalTrack);
        const sampleIndex = getSampleIndexForTimestamp(sampleTable, timestampInTimescale);
        const keyFrameSampleIndex = sampleIndex === -1 ? -1 : getRelevantKeyframeIndexForSample(sampleTable, sampleIndex);
        return this.fetchPacketForSampleIndex(keyFrameSampleIndex, options);
    }
    async getNextKeyPacket(packet, options) {
        if (this.internalTrack.demuxer.isFragmented) {
            const locationInFragment = this.packetToFragmentLocation.get(packet);
            if (locationInFragment === undefined) {
                throw new Error('Packet was not created from this track.');
            }
            const trackData = locationInFragment.fragment.trackData.get(this.internalTrack.id);
            const fragmentSample = trackData.samples[locationInFragment.sampleIndex];
            const fragmentIndex = binarySearchExact(this.internalTrack.fragments, locationInFragment.fragment.moofOffset, (x)=>x.moofOffset);
            assert(fragmentIndex !== -1);
            return this.performFragmentedLookup(()=>{
                const nextKeyFrameIndex = trackData.samples.findIndex((x, i)=>x.isKeyFrame && i > locationInFragment.sampleIndex);
                if (nextKeyFrameIndex !== -1) {
                    // We can simply take the next key frame in the fragment
                    return {
                        fragmentIndex,
                        sampleIndex: nextKeyFrameIndex,
                        correctSampleFound: true
                    };
                } else {
                    // Walk the list of fragments until we find the next fragment for this track with a key frame
                    let currentFragment = locationInFragment.fragment;
                    while(currentFragment.nextFragment){
                        currentFragment = currentFragment.nextFragment;
                        const trackData = currentFragment.trackData.get(this.internalTrack.id);
                        if (trackData && trackData.firstKeyFrameTimestamp !== null) {
                            const fragmentIndex = binarySearchExact(this.internalTrack.fragments, currentFragment.moofOffset, (x)=>x.moofOffset);
                            assert(fragmentIndex !== -1);
                            const keyFrameIndex = trackData.samples.findIndex((x)=>x.isKeyFrame);
                            assert(keyFrameIndex !== -1); // There must be one
                            return {
                                fragmentIndex,
                                sampleIndex: keyFrameIndex,
                                correctSampleFound: true
                            };
                        }
                    }
                    return {
                        fragmentIndex,
                        sampleIndex: -1,
                        correctSampleFound: false
                    };
                }
            }, fragmentSample.presentationTimestamp, Infinity, options);
        }
        const sampleIndex = this.packetToSampleIndex.get(packet);
        if (sampleIndex === undefined) {
            throw new Error('Packet was not created from this track.');
        }
        const sampleTable = this.internalTrack.demuxer.getSampleTableForTrack(this.internalTrack);
        const nextKeyFrameSampleIndex = getNextKeyframeIndexForSample(sampleTable, sampleIndex);
        return this.fetchPacketForSampleIndex(nextKeyFrameSampleIndex, options);
    }
    async fetchPacketForSampleIndex(sampleIndex, options) {
        if (sampleIndex === -1) {
            return null;
        }
        const sampleTable = this.internalTrack.demuxer.getSampleTableForTrack(this.internalTrack);
        const sampleInfo = getSampleInfo(sampleTable, sampleIndex);
        if (!sampleInfo) {
            return null;
        }
        let data;
        if (options.metadataOnly) {
            data = PLACEHOLDER_DATA;
        } else {
            // Load the entire chunk
            await this.internalTrack.demuxer.chunkReader.reader.loadRange(sampleInfo.chunkOffset, sampleInfo.chunkOffset + sampleInfo.chunkSize);
            this.internalTrack.demuxer.chunkReader.pos = sampleInfo.sampleOffset;
            data = this.internalTrack.demuxer.chunkReader.readBytes(sampleInfo.sampleSize);
        }
        const timestamp = (sampleInfo.presentationTimestamp - this.internalTrack.editListOffset) / this.internalTrack.timescale;
        const duration = sampleInfo.duration / this.internalTrack.timescale;
        const packet = new EncodedPacket(data, sampleInfo.isKeyFrame ? 'key' : 'delta', timestamp, duration, sampleIndex, sampleInfo.sampleSize);
        this.packetToSampleIndex.set(packet, sampleIndex);
        return packet;
    }
    async fetchPacketInFragment(fragment, sampleIndex, options) {
        if (sampleIndex === -1) {
            return null;
        }
        const trackData = fragment.trackData.get(this.internalTrack.id);
        const fragmentSample = trackData.samples[sampleIndex];
        assert(fragmentSample);
        let data;
        if (options.metadataOnly) {
            data = PLACEHOLDER_DATA;
        } else {
            // Load the entire fragment
            await this.internalTrack.demuxer.chunkReader.reader.loadRange(fragment.dataStart, fragment.dataEnd);
            this.internalTrack.demuxer.chunkReader.pos = fragmentSample.byteOffset;
            data = this.internalTrack.demuxer.chunkReader.readBytes(fragmentSample.byteSize);
        }
        const timestamp = (fragmentSample.presentationTimestamp - this.internalTrack.editListOffset) / this.internalTrack.timescale;
        const duration = fragmentSample.duration / this.internalTrack.timescale;
        const packet = new EncodedPacket(data, fragmentSample.isKeyFrame ? 'key' : 'delta', timestamp, duration, fragment.moofOffset + sampleIndex, fragmentSample.byteSize);
        this.packetToFragmentLocation.set(packet, {
            fragment,
            sampleIndex
        });
        return packet;
    }
    findSampleInFragmentsForTimestamp(timestampInTimescale) {
        const fragmentIndex = binarySearchLessOrEqual(// This array is technically not sorted by start timestamp, but for any reasonable file, it basically is.
        this.internalTrack.fragments, timestampInTimescale, (x)=>x.trackData.get(this.internalTrack.id).startTimestamp);
        let sampleIndex = -1;
        let correctSampleFound = false;
        if (fragmentIndex !== -1) {
            const fragment = this.internalTrack.fragments[fragmentIndex];
            const trackData = fragment.trackData.get(this.internalTrack.id);
            const index = binarySearchLessOrEqual(trackData.presentationTimestamps, timestampInTimescale, (x)=>x.presentationTimestamp);
            assert(index !== -1);
            sampleIndex = trackData.presentationTimestamps[index].sampleIndex;
            correctSampleFound = timestampInTimescale < trackData.endTimestamp;
        }
        return {
            fragmentIndex,
            sampleIndex,
            correctSampleFound
        };
    }
    findKeySampleInFragmentsForTimestamp(timestampInTimescale) {
        const indexInKeyFrameFragments = binarySearchLessOrEqual(// This array is technically not sorted by start timestamp, but for any reasonable file, it basically is.
        this.internalTrack.fragmentsWithKeyFrame, timestampInTimescale, (x)=>x.trackData.get(this.internalTrack.id).startTimestamp);
        let fragmentIndex = -1;
        let sampleIndex = -1;
        let correctSampleFound = false;
        if (indexInKeyFrameFragments !== -1) {
            const fragment = this.internalTrack.fragmentsWithKeyFrame[indexInKeyFrameFragments];
            // Now, let's find the actual index of the fragment in the list of ALL fragments, not just key frame ones
            fragmentIndex = binarySearchExact(this.internalTrack.fragments, fragment.moofOffset, (x)=>x.moofOffset);
            assert(fragmentIndex !== -1);
            const trackData = fragment.trackData.get(this.internalTrack.id);
            const index = findLastIndex(trackData.presentationTimestamps, (x)=>{
                const sample = trackData.samples[x.sampleIndex];
                return sample.isKeyFrame && x.presentationTimestamp <= timestampInTimescale;
            });
            assert(index !== -1); // It's a key frame fragment, so there must be a key frame
            const entry = trackData.presentationTimestamps[index];
            sampleIndex = entry.sampleIndex;
            correctSampleFound = timestampInTimescale < trackData.endTimestamp;
        }
        return {
            fragmentIndex,
            sampleIndex,
            correctSampleFound
        };
    }
    /** Looks for a packet in the fragments while trying to load as few fragments as possible to retrieve it. */ async performFragmentedLookup(getBestMatch, searchTimestamp, latestTimestamp, options) {
        const demuxer = this.internalTrack.demuxer;
        const release = await demuxer.fragmentLookupMutex.acquire(); // The algorithm requires exclusivity
        try {
            const { fragmentIndex, sampleIndex, correctSampleFound } = getBestMatch();
            if (correctSampleFound) {
                // The correct sample already exists, easy path.
                const fragment = this.internalTrack.fragments[fragmentIndex];
                return this.fetchPacketInFragment(fragment, sampleIndex, options);
            }
            const metadataReader = demuxer.metadataReader;
            const sourceSize = await metadataReader.reader.source.getSize();
            let prevFragment = null;
            let bestFragmentIndex = fragmentIndex;
            let bestSampleIndex = sampleIndex;
            // Search for a lookup entry; this way, we won't need to start searching from the start of the file
            // but can jump right into the correct fragment (or at least nearby).
            const lookupEntryIndex = this.internalTrack.fragmentLookupTable ? binarySearchLessOrEqual(this.internalTrack.fragmentLookupTable, searchTimestamp, (x)=>x.timestamp) : -1;
            const lookupEntry = lookupEntryIndex !== -1 ? this.internalTrack.fragmentLookupTable[lookupEntryIndex] : null;
            let nextFragmentIsFirstFragment = false;
            if (fragmentIndex === -1) {
                metadataReader.pos = lookupEntry?.moofOffset ?? 0;
                nextFragmentIsFirstFragment = metadataReader.pos === 0;
            } else {
                const fragment = this.internalTrack.fragments[fragmentIndex];
                if (!lookupEntry || fragment.moofOffset >= lookupEntry.moofOffset) {
                    metadataReader.pos = fragment.moofOffset + fragment.moofSize;
                    prevFragment = fragment;
                } else {
                    // Use the lookup entry
                    metadataReader.pos = lookupEntry.moofOffset;
                }
            }
            while(metadataReader.pos < sourceSize){
                if (prevFragment) {
                    const trackData = prevFragment.trackData.get(this.internalTrack.id);
                    if (trackData && trackData.startTimestamp > latestTimestamp) {
                        break;
                    }
                    if (prevFragment.nextFragment) {
                        // Skip ahead quickly without needing to read the file again
                        metadataReader.pos = prevFragment.nextFragment.moofOffset + prevFragment.nextFragment.moofSize;
                        prevFragment = prevFragment.nextFragment;
                        continue;
                    }
                }
                // Load the header
                await metadataReader.reader.loadRange(metadataReader.pos, metadataReader.pos + MAX_BOX_HEADER_SIZE);
                const startPos = metadataReader.pos;
                const boxInfo = metadataReader.readBoxHeader();
                if (boxInfo.name === 'moof') {
                    const index = binarySearchExact(demuxer.fragments, startPos, (x)=>x.moofOffset);
                    let fragment;
                    if (index === -1) {
                        // This is the first time we've seen this fragment
                        metadataReader.pos = startPos;
                        fragment = await demuxer.readFragment();
                    } else {
                        // We already know this fragment
                        fragment = demuxer.fragments[index];
                    }
                    // Even if we already know the fragment, we might not yet know its predecessor, so always do this
                    if (prevFragment) prevFragment.nextFragment = fragment;
                    prevFragment = fragment;
                    if (nextFragmentIsFirstFragment) {
                        fragment.isKnownToBeFirstFragment = true;
                        nextFragmentIsFirstFragment = false;
                    }
                    const { fragmentIndex, sampleIndex, correctSampleFound } = getBestMatch();
                    if (correctSampleFound) {
                        const fragment = this.internalTrack.fragments[fragmentIndex];
                        return this.fetchPacketInFragment(fragment, sampleIndex, options);
                    }
                    if (fragmentIndex !== -1) {
                        bestFragmentIndex = fragmentIndex;
                        bestSampleIndex = sampleIndex;
                    }
                }
                metadataReader.pos = startPos + boxInfo.totalSize;
            }
            let result = null;
            const bestFragment = bestFragmentIndex !== -1 ? this.internalTrack.fragments[bestFragmentIndex] : null;
            if (bestFragment) {
                // If we finished looping but didn't find a perfect match, still return the best match we found
                result = await this.fetchPacketInFragment(bestFragment, bestSampleIndex, options);
            }
            // Catch faulty lookup table entries
            if (!result && lookupEntry && (!bestFragment || bestFragment.moofOffset < lookupEntry.moofOffset)) {
                // The lookup table entry lied to us! We found a lookup entry but no fragment there that satisfied
                // the match. In this case, let's search again but using the lookup entry before that.
                const previousLookupEntry = this.internalTrack.fragmentLookupTable[lookupEntryIndex - 1];
                const newSearchTimestamp = previousLookupEntry?.timestamp ?? -Infinity;
                return this.performFragmentedLookup(getBestMatch, newSearchTimestamp, latestTimestamp, options);
            }
            return result;
        } finally{
            release();
        }
    }
}
class IsobmffVideoTrackBacking extends IsobmffTrackBacking {
    constructor(internalTrack){
        super(internalTrack);
        this.decoderConfigPromise = null;
        this.internalTrack = internalTrack;
    }
    getCodec() {
        return this.internalTrack.info.codec;
    }
    getCodedWidth() {
        return this.internalTrack.info.width;
    }
    getCodedHeight() {
        return this.internalTrack.info.height;
    }
    getRotation() {
        return this.internalTrack.rotation;
    }
    async getColorSpace() {
        return {
            primaries: this.internalTrack.info.colorSpace?.primaries,
            transfer: this.internalTrack.info.colorSpace?.transfer,
            matrix: this.internalTrack.info.colorSpace?.matrix,
            fullRange: this.internalTrack.info.colorSpace?.fullRange
        };
    }
    async getDecoderConfig() {
        if (!this.internalTrack.info.codec) {
            return null;
        }
        return this.decoderConfigPromise ??= (async ()=>{
            if (this.internalTrack.info.codec === 'vp9' && !this.internalTrack.info.vp9CodecInfo) {
                const firstPacket = await this.getFirstPacket({});
                this.internalTrack.info.vp9CodecInfo = firstPacket && extractVp9CodecInfoFromPacket(firstPacket.data);
            } else if (this.internalTrack.info.codec === 'av1' && !this.internalTrack.info.av1CodecInfo) {
                const firstPacket = await this.getFirstPacket({});
                this.internalTrack.info.av1CodecInfo = firstPacket && extractAv1CodecInfoFromPacket(firstPacket.data);
            }
            return {
                codec: extractVideoCodecString(this.internalTrack.info),
                codedWidth: this.internalTrack.info.width,
                codedHeight: this.internalTrack.info.height,
                description: this.internalTrack.info.codecDescription ?? undefined,
                colorSpace: this.internalTrack.info.colorSpace ?? undefined
            };
        })();
    }
}
class IsobmffAudioTrackBacking extends IsobmffTrackBacking {
    constructor(internalTrack){
        super(internalTrack);
        this.decoderConfig = null;
        this.internalTrack = internalTrack;
    }
    getCodec() {
        return this.internalTrack.info.codec;
    }
    getNumberOfChannels() {
        return this.internalTrack.info.numberOfChannels;
    }
    getSampleRate() {
        return this.internalTrack.info.sampleRate;
    }
    async getDecoderConfig() {
        if (!this.internalTrack.info.codec) {
            return null;
        }
        return this.decoderConfig ??= {
            codec: extractAudioCodecString(this.internalTrack.info),
            numberOfChannels: this.internalTrack.info.numberOfChannels,
            sampleRate: this.internalTrack.info.sampleRate,
            description: this.internalTrack.info.codecDescription ?? undefined
        };
    }
}
const getSampleIndexForTimestamp = (sampleTable, timescaleUnits)=>{
    if (sampleTable.presentationTimestamps) {
        const index = binarySearchLessOrEqual(sampleTable.presentationTimestamps, timescaleUnits, (x)=>x.presentationTimestamp);
        if (index === -1) {
            return -1;
        }
        return sampleTable.presentationTimestamps[index].sampleIndex;
    } else {
        const index = binarySearchLessOrEqual(sampleTable.sampleTimingEntries, timescaleUnits, (x)=>x.startDecodeTimestamp);
        if (index === -1) {
            return -1;
        }
        const entry = sampleTable.sampleTimingEntries[index];
        return entry.startIndex + Math.min(Math.floor((timescaleUnits - entry.startDecodeTimestamp) / entry.delta), entry.count - 1);
    }
};
const getSampleInfo = (sampleTable, sampleIndex)=>{
    const timingEntryIndex = binarySearchLessOrEqual(sampleTable.sampleTimingEntries, sampleIndex, (x)=>x.startIndex);
    const timingEntry = sampleTable.sampleTimingEntries[timingEntryIndex];
    if (!timingEntry || timingEntry.startIndex + timingEntry.count <= sampleIndex) {
        return null;
    }
    const decodeTimestamp = timingEntry.startDecodeTimestamp + (sampleIndex - timingEntry.startIndex) * timingEntry.delta;
    let presentationTimestamp = decodeTimestamp;
    const offsetEntryIndex = binarySearchLessOrEqual(sampleTable.sampleCompositionTimeOffsets, sampleIndex, (x)=>x.startIndex);
    const offsetEntry = sampleTable.sampleCompositionTimeOffsets[offsetEntryIndex];
    if (offsetEntry && sampleIndex - offsetEntry.startIndex < offsetEntry.count) {
        presentationTimestamp += offsetEntry.offset;
    }
    const sampleSize = sampleTable.sampleSizes[Math.min(sampleIndex, sampleTable.sampleSizes.length - 1)];
    const chunkEntryIndex = binarySearchLessOrEqual(sampleTable.sampleToChunk, sampleIndex, (x)=>x.startSampleIndex);
    const chunkEntry = sampleTable.sampleToChunk[chunkEntryIndex];
    assert(chunkEntry);
    const chunkIndex = chunkEntry.startChunkIndex + Math.floor((sampleIndex - chunkEntry.startSampleIndex) / chunkEntry.samplesPerChunk);
    const chunkOffset = sampleTable.chunkOffsets[chunkIndex];
    const startSampleIndexOfChunk = chunkEntry.startSampleIndex + (chunkIndex - chunkEntry.startChunkIndex) * chunkEntry.samplesPerChunk;
    let chunkSize = 0;
    let sampleOffset = chunkOffset;
    if (sampleTable.sampleSizes.length === 1) {
        sampleOffset += sampleSize * (sampleIndex - startSampleIndexOfChunk);
        chunkSize += sampleSize * chunkEntry.samplesPerChunk;
    } else {
        for(let i = startSampleIndexOfChunk; i < startSampleIndexOfChunk + chunkEntry.samplesPerChunk; i++){
            const sampleSize = sampleTable.sampleSizes[i];
            if (i < sampleIndex) {
                sampleOffset += sampleSize;
            }
            chunkSize += sampleSize;
        }
    }
    let duration = timingEntry.delta;
    if (sampleTable.presentationTimestamps) {
        // In order to accurately compute the duration, we need to take the duration to the next sample in presentation
        // order, not in decode order
        const presentationIndex = sampleTable.presentationTimestampIndexMap[sampleIndex];
        assert(presentationIndex !== undefined);
        if (presentationIndex < sampleTable.presentationTimestamps.length - 1) {
            const nextEntry = sampleTable.presentationTimestamps[presentationIndex + 1];
            const nextPresentationTimestamp = nextEntry.presentationTimestamp;
            duration = nextPresentationTimestamp - presentationTimestamp;
        }
    }
    return {
        presentationTimestamp,
        duration,
        sampleOffset,
        sampleSize,
        chunkOffset,
        chunkSize,
        isKeyFrame: sampleTable.keySampleIndices ? binarySearchExact(sampleTable.keySampleIndices, sampleIndex, (x)=>x) !== -1 : true
    };
};
const getRelevantKeyframeIndexForSample = (sampleTable, sampleIndex)=>{
    if (!sampleTable.keySampleIndices) {
        return sampleIndex;
    }
    const index = binarySearchLessOrEqual(sampleTable.keySampleIndices, sampleIndex, (x)=>x);
    return sampleTable.keySampleIndices[index] ?? -1;
};
const getNextKeyframeIndexForSample = (sampleTable, sampleIndex)=>{
    if (!sampleTable.keySampleIndices) {
        return sampleIndex + 1;
    }
    const index = binarySearchLessOrEqual(sampleTable.keySampleIndices, sampleIndex, (x)=>x);
    return sampleTable.keySampleIndices[index + 1] ?? -1;
};
const offsetFragmentTrackDataByTimestamp = (trackData, timestamp)=>{
    trackData.startTimestamp += timestamp;
    trackData.endTimestamp += timestamp;
    for (const sample of trackData.samples){
        sample.presentationTimestamp += timestamp;
    }
    for (const entry of trackData.presentationTimestamps){
        entry.presentationTimestamp += timestamp;
    }
};
/** Extracts the rotation component from a transformation matrix, in degrees. */ const extractRotationFromMatrix = (matrix)=>{
    const [m11, , , m21] = matrix;
    const scaleX = Math.hypot(m11, m21);
    const cosTheta = m11 / scaleX;
    const sinTheta = m21 / scaleX;
    // Invert the rotation because matrices are post-multiplied in ISOBMFF
    return -Math.atan2(sinTheta, cosTheta) * (180 / Math.PI);
};

const METADATA_ELEMENTS = [
    {
        id: EBMLId.SeekHead,
        flag: 'seekHeadSeen'
    },
    {
        id: EBMLId.Info,
        flag: 'infoSeen'
    },
    {
        id: EBMLId.Tracks,
        flag: 'tracksSeen'
    },
    {
        id: EBMLId.Cues,
        flag: 'cuesSeen'
    }
];
class MatroskaDemuxer extends Demuxer {
    constructor(input){
        super(input);
        this.readMetadataPromise = null;
        this.segments = [];
        this.currentSegment = null;
        this.currentTrack = null;
        this.currentCluster = null;
        this.currentBlock = null;
        this.currentCueTime = null;
        this.isWebM = false;
        this.metadataReader = new EBMLReader(input._mainReader);
        // Max 64 MiB of stored clusters
        this.clusterReader = new EBMLReader(new Reader(input.source, 64 * 2 ** 20));
    }
    async computeDuration() {
        const tracks = await this.getTracks();
        const trackDurations = await Promise.all(tracks.map((x)=>x.computeDuration()));
        return Math.max(0, ...trackDurations);
    }
    async getTracks() {
        await this.readMetadata();
        return this.segments.flatMap((segment)=>segment.tracks.map((track)=>track.inputTrack));
    }
    async getMimeType() {
        await this.readMetadata();
        const tracks = await this.getTracks();
        const codecStrings = await Promise.all(tracks.map((x)=>x.getCodecParameterString()));
        return buildMatroskaMimeType({
            isWebM: this.isWebM,
            hasVideo: this.segments.some((segment)=>segment.tracks.some((x)=>x.info?.type === 'video')),
            hasAudio: this.segments.some((segment)=>segment.tracks.some((x)=>x.info?.type === 'audio')),
            codecStrings: codecStrings.filter(Boolean)
        });
    }
    readMetadata() {
        return this.readMetadataPromise ??= (async ()=>{
            this.metadataReader.pos = 0;
            const fileSize = await this.input.source.getSize();
            // Loop over all top-level elements in the file
            while(this.metadataReader.pos <= fileSize - MIN_HEADER_SIZE){
                await this.metadataReader.reader.loadRange(this.metadataReader.pos, this.metadataReader.pos + MAX_HEADER_SIZE);
                const header = this.metadataReader.readElementHeader();
                const id = header.id;
                let size = header.size;
                const startPos = this.metadataReader.pos;
                if (id === EBMLId.EBML) {
                    assertDefinedSize(size);
                    await this.metadataReader.reader.loadRange(this.metadataReader.pos, this.metadataReader.pos + size);
                    this.readContiguousElements(this.metadataReader, size);
                } else if (id === EBMLId.Segment) {
                    await this.readSegment(size);
                    if (size === null) {
                        break;
                    }
                } else if (id === EBMLId.Cluster) {
                    // Clusters are not a top-level element in Matroska, but some files contain a Segment whose size
                    // doesn't contain any of the clusters that follow it. In the case, we apply the following logic: if
                    // we find a top-level cluster, attribute it to the previous segment.
                    if (size === null) {
                        // Just in case this is one of those weird sizeless clusters, let's do our best and still try to
                        // determine its size.
                        const nextElementPos = await this.clusterReader.searchForNextElementId(LEVEL_0_AND_1_EBML_IDS, fileSize);
                        size = (nextElementPos ?? fileSize) - startPos;
                    }
                    const lastSegment = last(this.segments);
                    if (lastSegment) {
                        // Extend the previous segment's size
                        lastSegment.elementEndPos = startPos + size;
                    }
                }
                assertDefinedSize(size);
                this.metadataReader.pos = startPos + size;
            }
        })();
    }
    async readSegment(dataSize) {
        const segmentDataStart = this.metadataReader.pos;
        this.currentSegment = {
            seekHeadSeen: false,
            infoSeen: false,
            tracksSeen: false,
            cuesSeen: false,
            timestampScale: -1,
            timestampFactor: -1,
            duration: -1,
            seekEntries: [],
            tracks: [],
            cuePoints: [],
            dataStartPos: segmentDataStart,
            elementEndPos: dataSize === null ? await this.input.source.getSize() // Assume it goes until the end of the file
             : segmentDataStart + dataSize,
            clusterSeekStartPos: segmentDataStart,
            clusters: [],
            clusterLookupMutex: new AsyncMutex()
        };
        this.segments.push(this.currentSegment);
        // Let's load a good amount of data, enough for all segment metadata to likely fit into (minus cues)
        await this.metadataReader.reader.loadRange(this.metadataReader.pos, this.metadataReader.pos + 2 ** 14);
        let clusterEncountered = false;
        while(this.metadataReader.pos < this.currentSegment.elementEndPos){
            await this.metadataReader.reader.loadRange(this.metadataReader.pos, this.metadataReader.pos + MAX_HEADER_SIZE);
            const elementStartPos = this.metadataReader.pos;
            const { id, size } = this.metadataReader.readElementHeader();
            const dataStartPos = this.metadataReader.pos;
            const metadataElementIndex = METADATA_ELEMENTS.findIndex((x)=>x.id === id);
            if (metadataElementIndex !== -1) {
                const field = METADATA_ELEMENTS[metadataElementIndex].flag;
                this.currentSegment[field] = true;
                assertDefinedSize(size);
                await this.metadataReader.reader.loadRange(this.metadataReader.pos, this.metadataReader.pos + size);
                this.readContiguousElements(this.metadataReader, size);
            } else if (id === EBMLId.Cluster) {
                if (!clusterEncountered) {
                    clusterEncountered = true;
                    this.currentSegment.clusterSeekStartPos = elementStartPos;
                }
            }
            if (this.currentSegment.infoSeen && this.currentSegment.tracksSeen && this.currentSegment.cuesSeen) {
                break;
            }
            if (this.currentSegment.seekHeadSeen) {
                let hasInfo = this.currentSegment.infoSeen;
                let hasTracks = this.currentSegment.tracksSeen;
                let hasCues = this.currentSegment.cuesSeen;
                for (const entry of this.currentSegment.seekEntries){
                    if (entry.id === EBMLId.Info) {
                        hasInfo = true;
                    } else if (entry.id === EBMLId.Tracks) {
                        hasTracks = true;
                    } else if (entry.id === EBMLId.Cues) {
                        hasCues = true;
                    }
                }
                if (hasInfo && hasTracks && hasCues) {
                    break;
                }
            }
            if (size === null) {
                break;
            }
            this.metadataReader.pos = dataStartPos + size;
            if (!clusterEncountered) {
                this.currentSegment.clusterSeekStartPos = this.metadataReader.pos;
            }
        }
        // Use the seek head to read missing metadata elements
        for (const target of METADATA_ELEMENTS){
            if (this.currentSegment[target.flag]) continue;
            const seekEntry = this.currentSegment.seekEntries.find((entry)=>entry.id === target.id);
            if (!seekEntry) continue;
            this.metadataReader.pos = segmentDataStart + seekEntry.segmentPosition;
            await this.metadataReader.reader.loadRange(this.metadataReader.pos, this.metadataReader.pos + 2 ** 12);
            const { id, size } = this.metadataReader.readElementHeader();
            if (id !== target.id) continue;
            assertDefinedSize(size);
            this.currentSegment[target.flag] = true;
            await this.metadataReader.reader.loadRange(this.metadataReader.pos, this.metadataReader.pos + size);
            this.readContiguousElements(this.metadataReader, size);
        }
        if (this.currentSegment.timestampScale === -1) {
            // TimestampScale element is missing. Technically an invalid file, but let's default to the typical value,
            // which is 1e6.
            this.currentSegment.timestampScale = 1e6;
            this.currentSegment.timestampFactor = 1e9 / 1e6;
        }
        // Put default tracks first
        this.currentSegment.tracks.sort((a, b)=>Number(b.isDefault) - Number(a.isDefault));
        // Sort cue points by cluster position (required for the next algorithm)
        this.currentSegment.cuePoints.sort((a, b)=>a.clusterPosition - b.clusterPosition);
        // Now, let's distribute the cue points to each track. Ideally, each track has their own cue point, but some
        // Matroska files may only specify cue points for a single track. In this case, we still wanna use those cue
        // points for all tracks.
        const allTrackIds = this.currentSegment.tracks.map((x)=>x.id);
        const remainingTrackIds = new Set();
        let lastClusterPosition = null;
        let lastCuePoint = null;
        for (const cuePoint of this.currentSegment.cuePoints){
            if (cuePoint.clusterPosition !== lastClusterPosition) {
                for (const id of remainingTrackIds){
                    // These tracks didn't receive a cue point for the last cluster, so let's give them one
                    assert(lastCuePoint);
                    const track = this.currentSegment.tracks.find((x)=>x.id === id);
                    track.cuePoints.push(lastCuePoint);
                }
                for (const id of allTrackIds){
                    remainingTrackIds.add(id);
                }
            }
            lastCuePoint = cuePoint;
            if (!remainingTrackIds.has(cuePoint.trackId)) {
                continue;
            }
            const track = this.currentSegment.tracks.find((x)=>x.id === cuePoint.trackId);
            track.cuePoints.push(cuePoint);
            remainingTrackIds.delete(cuePoint.trackId);
            lastClusterPosition = cuePoint.clusterPosition;
        }
        for (const id of remainingTrackIds){
            assert(lastCuePoint);
            const track = this.currentSegment.tracks.find((x)=>x.id === id);
            track.cuePoints.push(lastCuePoint);
        }
        for (const track of this.currentSegment.tracks){
            // Sort cue points by time
            track.cuePoints.sort((a, b)=>a.time - b.time);
        }
        this.currentSegment = null;
    }
    async readCluster(segment) {
        await this.metadataReader.reader.loadRange(this.metadataReader.pos, this.metadataReader.pos + MAX_HEADER_SIZE);
        const elementStartPos = this.metadataReader.pos;
        const elementHeader = this.metadataReader.readElementHeader();
        const id = elementHeader.id;
        let size = elementHeader.size;
        const dataStartPos = this.metadataReader.pos;
        if (size === null) {
            // The cluster's size is undefined (can happen in livestreamed files). We'd still like to know the size of
            // it, so we have no other choice but to iterate over the EBML structure until we find an element at level
            // 0 or 1, indicating the end of the cluster (all elements inside the cluster are at level 2).
            this.clusterReader.pos = dataStartPos;
            const nextElementPos = await this.clusterReader.searchForNextElementId(LEVEL_0_AND_1_EBML_IDS, segment.elementEndPos);
            size = (nextElementPos ?? segment.elementEndPos) - dataStartPos;
        }
        assert(id === EBMLId.Cluster);
        // Load the entire cluster
        this.clusterReader.pos = dataStartPos;
        await this.clusterReader.reader.loadRange(this.clusterReader.pos, this.clusterReader.pos + size);
        const cluster = {
            elementStartPos,
            elementEndPos: dataStartPos + size,
            dataStartPos,
            timestamp: -1,
            trackData: new Map(),
            nextCluster: null,
            isKnownToBeFirstCluster: false
        };
        this.currentCluster = cluster;
        this.readContiguousElements(this.clusterReader, size);
        for (const [trackId, trackData] of cluster.trackData){
            let blockReferencesExist = false;
            // This must hold, as track datas only get created if a block for that track is encountered
            assert(trackData.blocks.length > 0);
            for(let i = 0; i < trackData.blocks.length; i++){
                const block = trackData.blocks[i];
                block.timestamp += cluster.timestamp;
                blockReferencesExist ||= block.referencedTimestamps.length > 0;
            }
            if (blockReferencesExist) {
                trackData.blocks = sortBlocksByReferences(trackData.blocks);
            }
            trackData.presentationTimestamps = trackData.blocks.map((block, i)=>({
                    timestamp: block.timestamp,
                    blockIndex: i
                })).sort((a, b)=>a.timestamp - b.timestamp);
            for(let i = 0; i < trackData.presentationTimestamps.length; i++){
                const currentEntry = trackData.presentationTimestamps[i];
                const currentBlock = trackData.blocks[currentEntry.blockIndex];
                if (trackData.firstKeyFrameTimestamp === null && currentBlock.isKeyFrame) {
                    trackData.firstKeyFrameTimestamp = currentBlock.timestamp;
                }
                if (i < trackData.presentationTimestamps.length - 1) {
                    // Update block durations based on presentation order
                    const nextEntry = trackData.presentationTimestamps[i + 1];
                    currentBlock.duration = nextEntry.timestamp - currentBlock.timestamp;
                }
            }
            const firstBlock = trackData.blocks[trackData.presentationTimestamps[0].blockIndex];
            const lastBlock = trackData.blocks[last(trackData.presentationTimestamps).blockIndex];
            trackData.startTimestamp = firstBlock.timestamp;
            trackData.endTimestamp = lastBlock.timestamp + lastBlock.duration;
            const track = segment.tracks.find((x)=>x.id === trackId);
            if (track) {
                const insertionIndex = binarySearchLessOrEqual(track.clusters, cluster.elementStartPos, (x)=>x.elementStartPos);
                track.clusters.splice(insertionIndex + 1, 0, cluster);
                const hasKeyFrame = trackData.firstKeyFrameTimestamp !== null;
                if (hasKeyFrame) {
                    const insertionIndex = binarySearchLessOrEqual(track.clustersWithKeyFrame, cluster.elementStartPos, (x)=>x.elementStartPos);
                    track.clustersWithKeyFrame.splice(insertionIndex + 1, 0, cluster);
                }
            }
        }
        const insertionIndex = binarySearchLessOrEqual(segment.clusters, elementStartPos, (x)=>x.elementStartPos);
        segment.clusters.splice(insertionIndex + 1, 0, cluster);
        this.currentCluster = null;
        return cluster;
    }
    getTrackDataInCluster(cluster, trackNumber) {
        let trackData = cluster.trackData.get(trackNumber);
        if (!trackData) {
            trackData = {
                startTimestamp: 0,
                endTimestamp: 0,
                firstKeyFrameTimestamp: null,
                blocks: [],
                presentationTimestamps: []
            };
            cluster.trackData.set(trackNumber, trackData);
        }
        return trackData;
    }
    readContiguousElements(reader, totalSize) {
        const startIndex = reader.pos;
        while(reader.pos - startIndex <= totalSize - MIN_HEADER_SIZE){
            this.traverseElement(reader);
        }
    }
    traverseElement(reader) {
        const { id, size } = reader.readElementHeader();
        const dataStartPos = reader.pos;
        assertDefinedSize(size);
        switch(id){
            case EBMLId.DocType:
                {
                    this.isWebM = reader.readString(size) === 'webm';
                }
                break;
            case EBMLId.Seek:
                {
                    if (!this.currentSegment) break;
                    const seekEntry = {
                        id: -1,
                        segmentPosition: -1
                    };
                    this.currentSegment.seekEntries.push(seekEntry);
                    this.readContiguousElements(reader, size);
                    if (seekEntry.id === -1 || seekEntry.segmentPosition === -1) {
                        this.currentSegment.seekEntries.pop();
                    }
                }
                break;
            case EBMLId.SeekID:
                {
                    const lastSeekEntry = this.currentSegment?.seekEntries[this.currentSegment.seekEntries.length - 1];
                    if (!lastSeekEntry) break;
                    lastSeekEntry.id = reader.readUnsignedInt(size);
                }
                break;
            case EBMLId.SeekPosition:
                {
                    const lastSeekEntry = this.currentSegment?.seekEntries[this.currentSegment.seekEntries.length - 1];
                    if (!lastSeekEntry) break;
                    lastSeekEntry.segmentPosition = reader.readUnsignedInt(size);
                }
                break;
            case EBMLId.TimestampScale:
                {
                    if (!this.currentSegment) break;
                    this.currentSegment.timestampScale = reader.readUnsignedInt(size);
                    this.currentSegment.timestampFactor = 1e9 / this.currentSegment.timestampScale;
                }
                break;
            case EBMLId.Duration:
                {
                    if (!this.currentSegment) break;
                    this.currentSegment.duration = reader.readFloat(size);
                }
                break;
            case EBMLId.TrackEntry:
                {
                    if (!this.currentSegment) break;
                    this.currentTrack = {
                        id: -1,
                        segment: this.currentSegment,
                        demuxer: this,
                        clusters: [],
                        clustersWithKeyFrame: [],
                        cuePoints: [],
                        isDefault: false,
                        inputTrack: null,
                        codecId: null,
                        codecPrivate: null,
                        languageCode: UNDETERMINED_LANGUAGE,
                        info: null
                    };
                    this.readContiguousElements(reader, size);
                    if (this.currentTrack && this.currentTrack.id !== -1 && this.currentTrack.codecId && this.currentTrack.info) {
                        const slashIndex = this.currentTrack.codecId.indexOf('/');
                        const codecIdWithoutSuffix = slashIndex === -1 ? this.currentTrack.codecId : this.currentTrack.codecId.slice(0, slashIndex);
                        if (this.currentTrack.info.type === 'video' && this.currentTrack.info.width !== -1 && this.currentTrack.info.height !== -1) {
                            if (this.currentTrack.codecId === CODEC_STRING_MAP.avc) {
                                this.currentTrack.info.codec = 'avc';
                                this.currentTrack.info.codecDescription = this.currentTrack.codecPrivate;
                            } else if (this.currentTrack.codecId === CODEC_STRING_MAP.hevc) {
                                this.currentTrack.info.codec = 'hevc';
                                this.currentTrack.info.codecDescription = this.currentTrack.codecPrivate;
                            } else if (codecIdWithoutSuffix === CODEC_STRING_MAP.vp8) {
                                this.currentTrack.info.codec = 'vp8';
                            } else if (codecIdWithoutSuffix === CODEC_STRING_MAP.vp9) {
                                this.currentTrack.info.codec = 'vp9';
                            } else if (codecIdWithoutSuffix === CODEC_STRING_MAP.av1) {
                                this.currentTrack.info.codec = 'av1';
                            }
                            const videoTrack = this.currentTrack;
                            const inputTrack = new InputVideoTrack(new MatroskaVideoTrackBacking(videoTrack));
                            this.currentTrack.inputTrack = inputTrack;
                            this.currentSegment.tracks.push(this.currentTrack);
                        } else if (this.currentTrack.info.type === 'audio' && this.currentTrack.info.numberOfChannels !== -1 && this.currentTrack.info.sampleRate !== -1) {
                            if (codecIdWithoutSuffix === CODEC_STRING_MAP.aac) {
                                this.currentTrack.info.codec = 'aac';
                                this.currentTrack.info.aacCodecInfo = {
                                    isMpeg2: this.currentTrack.codecId.includes('MPEG2')
                                };
                                this.currentTrack.info.codecDescription = this.currentTrack.codecPrivate;
                            } else if (this.currentTrack.codecId === CODEC_STRING_MAP.mp3) {
                                this.currentTrack.info.codec = 'mp3';
                            } else if (codecIdWithoutSuffix === CODEC_STRING_MAP.opus) {
                                this.currentTrack.info.codec = 'opus';
                                this.currentTrack.info.codecDescription = this.currentTrack.codecPrivate;
                            } else if (codecIdWithoutSuffix === CODEC_STRING_MAP.vorbis) {
                                this.currentTrack.info.codec = 'vorbis';
                                this.currentTrack.info.codecDescription = this.currentTrack.codecPrivate;
                            } else if (codecIdWithoutSuffix === CODEC_STRING_MAP.flac) {
                                this.currentTrack.info.codec = 'flac';
                                this.currentTrack.info.codecDescription = this.currentTrack.codecPrivate;
                            } else if (this.currentTrack.codecId === 'A_PCM/INT/LIT') {
                                if (this.currentTrack.info.bitDepth === 8) {
                                    this.currentTrack.info.codec = 'pcm-u8';
                                } else if (this.currentTrack.info.bitDepth === 16) {
                                    this.currentTrack.info.codec = 'pcm-s16';
                                } else if (this.currentTrack.info.bitDepth === 24) {
                                    this.currentTrack.info.codec = 'pcm-s24';
                                } else if (this.currentTrack.info.bitDepth === 32) {
                                    this.currentTrack.info.codec = 'pcm-s32';
                                }
                            } else if (this.currentTrack.codecId === 'A_PCM/INT/BIG') {
                                if (this.currentTrack.info.bitDepth === 8) {
                                    this.currentTrack.info.codec = 'pcm-u8';
                                } else if (this.currentTrack.info.bitDepth === 16) {
                                    this.currentTrack.info.codec = 'pcm-s16be';
                                } else if (this.currentTrack.info.bitDepth === 24) {
                                    this.currentTrack.info.codec = 'pcm-s24be';
                                } else if (this.currentTrack.info.bitDepth === 32) {
                                    this.currentTrack.info.codec = 'pcm-s32be';
                                }
                            } else if (this.currentTrack.codecId === 'A_PCM/FLOAT/IEEE') {
                                if (this.currentTrack.info.bitDepth === 32) {
                                    this.currentTrack.info.codec = 'pcm-f32';
                                } else if (this.currentTrack.info.bitDepth === 64) {
                                    this.currentTrack.info.codec = 'pcm-f64';
                                }
                            }
                            const audioTrack = this.currentTrack;
                            const inputTrack = new InputAudioTrack(new MatroskaAudioTrackBacking(audioTrack));
                            this.currentTrack.inputTrack = inputTrack;
                            this.currentSegment.tracks.push(this.currentTrack);
                        }
                    }
                    this.currentTrack = null;
                }
                break;
            case EBMLId.TrackNumber:
                {
                    if (!this.currentTrack) break;
                    this.currentTrack.id = reader.readUnsignedInt(size);
                }
                break;
            case EBMLId.TrackType:
                {
                    if (!this.currentTrack) break;
                    const type = reader.readUnsignedInt(size);
                    if (type === 1) {
                        this.currentTrack.info = {
                            type: 'video',
                            width: -1,
                            height: -1,
                            rotation: 0,
                            codec: null,
                            codecDescription: null,
                            colorSpace: null
                        };
                    } else if (type === 2) {
                        this.currentTrack.info = {
                            type: 'audio',
                            numberOfChannels: -1,
                            sampleRate: -1,
                            bitDepth: -1,
                            codec: null,
                            codecDescription: null,
                            aacCodecInfo: null
                        };
                    }
                }
                break;
            case EBMLId.FlagEnabled:
                {
                    if (!this.currentTrack) break;
                    const enabled = reader.readUnsignedInt(size);
                    if (!enabled) {
                        this.currentSegment.tracks.pop();
                        this.currentTrack = null;
                    }
                }
                break;
            case EBMLId.FlagDefault:
                {
                    if (!this.currentTrack) break;
                    this.currentTrack.isDefault = !!reader.readUnsignedInt(size);
                }
                break;
            case EBMLId.CodecID:
                {
                    if (!this.currentTrack) break;
                    this.currentTrack.codecId = reader.readString(size);
                }
                break;
            case EBMLId.CodecPrivate:
                {
                    if (!this.currentTrack) break;
                    this.currentTrack.codecPrivate = reader.readBytes(size);
                }
                break;
            case EBMLId.Language:
                {
                    if (!this.currentTrack) break;
                    this.currentTrack.languageCode = reader.readString(size);
                    if (!isIso639Dash2LanguageCode(this.currentTrack.languageCode)) {
                        this.currentTrack.languageCode = UNDETERMINED_LANGUAGE;
                    }
                }
                break;
            case EBMLId.Video:
                {
                    if (this.currentTrack?.info?.type !== 'video') break;
                    this.readContiguousElements(reader, size);
                }
                break;
            case EBMLId.PixelWidth:
                {
                    if (this.currentTrack?.info?.type !== 'video') break;
                    this.currentTrack.info.width = reader.readUnsignedInt(size);
                }
                break;
            case EBMLId.PixelHeight:
                {
                    if (this.currentTrack?.info?.type !== 'video') break;
                    this.currentTrack.info.height = reader.readUnsignedInt(size);
                }
                break;
            case EBMLId.Colour:
                {
                    if (this.currentTrack?.info?.type !== 'video') break;
                    this.currentTrack.info.colorSpace = {};
                    this.readContiguousElements(reader, size);
                }
                break;
            case EBMLId.MatrixCoefficients:
                {
                    if (this.currentTrack?.info?.type !== 'video' || !this.currentTrack.info.colorSpace) break;
                    const matrixCoefficients = reader.readUnsignedInt(size);
                    const mapped = MATRIX_COEFFICIENTS_MAP_INVERSE[matrixCoefficients] ?? null;
                    this.currentTrack.info.colorSpace.matrix = mapped;
                }
                break;
            case EBMLId.Range:
                {
                    if (this.currentTrack?.info?.type !== 'video' || !this.currentTrack.info.colorSpace) break;
                    this.currentTrack.info.colorSpace.fullRange = reader.readUnsignedInt(size) === 2;
                }
                break;
            case EBMLId.TransferCharacteristics:
                {
                    if (this.currentTrack?.info?.type !== 'video' || !this.currentTrack.info.colorSpace) break;
                    const transferCharacteristics = reader.readUnsignedInt(size);
                    const mapped = TRANSFER_CHARACTERISTICS_MAP_INVERSE[transferCharacteristics] ?? null;
                    this.currentTrack.info.colorSpace.transfer = mapped;
                }
                break;
            case EBMLId.Primaries:
                {
                    if (this.currentTrack?.info?.type !== 'video' || !this.currentTrack.info.colorSpace) break;
                    const primaries = reader.readUnsignedInt(size);
                    const mapped = COLOR_PRIMARIES_MAP_INVERSE[primaries] ?? null;
                    this.currentTrack.info.colorSpace.primaries = mapped;
                }
                break;
            case EBMLId.Projection:
                {
                    if (this.currentTrack?.info?.type !== 'video') break;
                    this.readContiguousElements(reader, size);
                }
                break;
            case EBMLId.ProjectionPoseRoll:
                {
                    if (this.currentTrack?.info?.type !== 'video') break;
                    const rotation = reader.readFloat(size);
                    const flippedRotation = -rotation; // Convert counter-clockwise to clockwise
                    try {
                        this.currentTrack.info.rotation = normalizeRotation(flippedRotation);
                    } catch  {
                    // It wasn't a valid rotation
                    }
                }
                break;
            case EBMLId.Audio:
                {
                    if (this.currentTrack?.info?.type !== 'audio') break;
                    this.readContiguousElements(reader, size);
                }
                break;
            case EBMLId.SamplingFrequency:
                {
                    if (this.currentTrack?.info?.type !== 'audio') break;
                    this.currentTrack.info.sampleRate = reader.readFloat(size);
                }
                break;
            case EBMLId.Channels:
                {
                    if (this.currentTrack?.info?.type !== 'audio') break;
                    this.currentTrack.info.numberOfChannels = reader.readUnsignedInt(size);
                }
                break;
            case EBMLId.BitDepth:
                {
                    if (this.currentTrack?.info?.type !== 'audio') break;
                    this.currentTrack.info.bitDepth = reader.readUnsignedInt(size);
                }
                break;
            case EBMLId.CuePoint:
                {
                    if (!this.currentSegment) break;
                    this.readContiguousElements(reader, size);
                    this.currentCueTime = null;
                }
                break;
            case EBMLId.CueTime:
                {
                    this.currentCueTime = reader.readUnsignedInt(size);
                }
                break;
            case EBMLId.CueTrackPositions:
                {
                    if (this.currentCueTime === null) break;
                    assert(this.currentSegment);
                    const cuePoint = {
                        time: this.currentCueTime,
                        trackId: -1,
                        clusterPosition: -1
                    };
                    this.currentSegment.cuePoints.push(cuePoint);
                    this.readContiguousElements(reader, size);
                    if (cuePoint.trackId === -1 || cuePoint.clusterPosition === -1) {
                        this.currentSegment.cuePoints.pop();
                    }
                }
                break;
            case EBMLId.CueTrack:
                {
                    const lastCuePoint = this.currentSegment?.cuePoints[this.currentSegment.cuePoints.length - 1];
                    if (!lastCuePoint) break;
                    lastCuePoint.trackId = reader.readUnsignedInt(size);
                }
                break;
            case EBMLId.CueClusterPosition:
                {
                    const lastCuePoint = this.currentSegment?.cuePoints[this.currentSegment.cuePoints.length - 1];
                    if (!lastCuePoint) break;
                    assert(this.currentSegment);
                    lastCuePoint.clusterPosition = this.currentSegment.dataStartPos + reader.readUnsignedInt(size);
                }
                break;
            case EBMLId.Timestamp:
                {
                    if (!this.currentCluster) break;
                    this.currentCluster.timestamp = reader.readUnsignedInt(size);
                }
                break;
            case EBMLId.SimpleBlock:
                {
                    if (!this.currentCluster) break;
                    const trackNumber = reader.readVarInt();
                    const relativeTimestamp = reader.readS16();
                    const flags = reader.readU8();
                    const isKeyFrame = !!(flags & 0x80);
                    const trackData = this.getTrackDataInCluster(this.currentCluster, trackNumber);
                    trackData.blocks.push({
                        timestamp: relativeTimestamp,
                        duration: 0,
                        isKeyFrame,
                        referencedTimestamps: [],
                        data: reader.readBytes(size - (reader.pos - dataStartPos))
                    });
                }
                break;
            case EBMLId.BlockGroup:
                {
                    if (!this.currentCluster) break;
                    this.readContiguousElements(reader, size);
                    if (this.currentBlock) {
                        for(let i = 0; i < this.currentBlock.referencedTimestamps.length; i++){
                            this.currentBlock.referencedTimestamps[i] += this.currentBlock.timestamp;
                        }
                        this.currentBlock = null;
                    }
                }
                break;
            case EBMLId.Block:
                {
                    if (!this.currentCluster) break;
                    const trackNumber = reader.readVarInt();
                    const relativeTimestamp = reader.readS16();
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    reader.readU8();
                    const trackData = this.getTrackDataInCluster(this.currentCluster, trackNumber);
                    this.currentBlock = {
                        timestamp: relativeTimestamp,
                        duration: 0,
                        isKeyFrame: true,
                        referencedTimestamps: [],
                        data: reader.readBytes(size - (reader.pos - dataStartPos))
                    };
                    trackData.blocks.push(this.currentBlock);
                }
                break;
            case EBMLId.BlockDuration:
                {
                    if (!this.currentBlock) break;
                    this.currentBlock.duration = reader.readUnsignedInt(size);
                }
                break;
            case EBMLId.ReferenceBlock:
                {
                    if (!this.currentBlock) break;
                    this.currentBlock.isKeyFrame = false;
                    const relativeTimestamp = reader.readSignedInt(size);
                    // We'll offset this by the block's timestamp later
                    this.currentBlock.referencedTimestamps.push(relativeTimestamp);
                }
                break;
        }
        reader.pos = dataStartPos + size;
    }
}
class MatroskaTrackBacking {
    constructor(internalTrack){
        this.internalTrack = internalTrack;
        this.packetToClusterLocation = new WeakMap();
    }
    getId() {
        return this.internalTrack.id;
    }
    getCodec() {
        throw new Error('Not implemented on base class.');
    }
    async computeDuration() {
        const lastPacket = await this.getPacket(Infinity, {
            metadataOnly: true
        });
        return (lastPacket?.timestamp ?? 0) + (lastPacket?.duration ?? 0);
    }
    getLanguageCode() {
        return this.internalTrack.languageCode;
    }
    async getFirstTimestamp() {
        const firstPacket = await this.getFirstPacket({
            metadataOnly: true
        });
        return firstPacket?.timestamp ?? 0;
    }
    getTimeResolution() {
        return this.internalTrack.segment.timestampFactor;
    }
    async getFirstPacket(options) {
        return this.performClusterLookup(()=>{
            const startCluster = this.internalTrack.segment.clusters[0] ?? null;
            if (startCluster?.isKnownToBeFirstCluster) {
                // Walk from the very first cluster in the file until we find one with our track in it
                let currentCluster = startCluster;
                while(currentCluster){
                    const trackData = currentCluster.trackData.get(this.internalTrack.id);
                    if (trackData) {
                        return {
                            clusterIndex: binarySearchExact(this.internalTrack.clusters, currentCluster.elementStartPos, (x)=>x.elementStartPos),
                            blockIndex: 0,
                            correctBlockFound: true
                        };
                    }
                    currentCluster = currentCluster.nextCluster;
                }
            }
            return {
                clusterIndex: -1,
                blockIndex: -1,
                correctBlockFound: false
            };
        }, -Infinity, Infinity, options);
    }
    intoTimescale(timestamp) {
        // Do a little rounding to catch cases where the result is very close to an integer. If it is, it's likely
        // that the number was originally an integer divided by the timescale. For stability, it's best
        // to return the integer in this case.
        return roundToPrecision(timestamp * this.internalTrack.segment.timestampFactor, 14);
    }
    async getPacket(timestamp, options) {
        const timestampInTimescale = this.intoTimescale(timestamp);
        return this.performClusterLookup(()=>this.findBlockInClustersForTimestamp(timestampInTimescale), timestampInTimescale, timestampInTimescale, options);
    }
    async getNextPacket(packet, options) {
        const locationInCluster = this.packetToClusterLocation.get(packet);
        if (locationInCluster === undefined) {
            throw new Error('Packet was not created from this track.');
        }
        const trackData = locationInCluster.cluster.trackData.get(this.internalTrack.id);
        const block = trackData.blocks[locationInCluster.blockIndex];
        const clusterIndex = binarySearchExact(this.internalTrack.clusters, locationInCluster.cluster.elementStartPos, (x)=>x.elementStartPos);
        assert(clusterIndex !== -1);
        return this.performClusterLookup(()=>{
            if (locationInCluster.blockIndex + 1 < trackData.blocks.length) {
                // We can simply take the next block in the cluster
                return {
                    clusterIndex,
                    blockIndex: locationInCluster.blockIndex + 1,
                    correctBlockFound: true
                };
            } else {
                // Walk the list of clusters until we find the next cluster for this track
                let currentCluster = locationInCluster.cluster;
                while(currentCluster.nextCluster){
                    currentCluster = currentCluster.nextCluster;
                    const trackData = currentCluster.trackData.get(this.internalTrack.id);
                    if (trackData) {
                        const clusterIndex = binarySearchExact(this.internalTrack.clusters, currentCluster.elementStartPos, (x)=>x.elementStartPos);
                        assert(clusterIndex !== -1);
                        return {
                            clusterIndex,
                            blockIndex: 0,
                            correctBlockFound: true
                        };
                    }
                }
                return {
                    clusterIndex,
                    blockIndex: -1,
                    correctBlockFound: false
                };
            }
        }, block.timestamp, Infinity, options);
    }
    async getKeyPacket(timestamp, options) {
        const timestampInTimescale = this.intoTimescale(timestamp);
        return this.performClusterLookup(()=>this.findKeyBlockInClustersForTimestamp(timestampInTimescale), timestampInTimescale, timestampInTimescale, options);
    }
    async getNextKeyPacket(packet, options) {
        const locationInCluster = this.packetToClusterLocation.get(packet);
        if (locationInCluster === undefined) {
            throw new Error('Packet was not created from this track.');
        }
        const trackData = locationInCluster.cluster.trackData.get(this.internalTrack.id);
        const block = trackData.blocks[locationInCluster.blockIndex];
        const clusterIndex = binarySearchExact(this.internalTrack.clusters, locationInCluster.cluster.elementStartPos, (x)=>x.elementStartPos);
        assert(clusterIndex !== -1);
        return this.performClusterLookup(()=>{
            const nextKeyFrameIndex = trackData.blocks.findIndex((x, i)=>x.isKeyFrame && i > locationInCluster.blockIndex);
            if (nextKeyFrameIndex !== -1) {
                // We can simply take the next key frame in the cluster
                return {
                    clusterIndex,
                    blockIndex: nextKeyFrameIndex,
                    correctBlockFound: true
                };
            } else {
                // Walk the list of clusters until we find the next cluster for this track with a key frame
                let currentCluster = locationInCluster.cluster;
                while(currentCluster.nextCluster){
                    currentCluster = currentCluster.nextCluster;
                    const trackData = currentCluster.trackData.get(this.internalTrack.id);
                    if (trackData && trackData.firstKeyFrameTimestamp !== null) {
                        const clusterIndex = binarySearchExact(this.internalTrack.clusters, currentCluster.elementStartPos, (x)=>x.elementStartPos);
                        assert(clusterIndex !== -1);
                        const keyFrameIndex = trackData.blocks.findIndex((x)=>x.isKeyFrame);
                        assert(keyFrameIndex !== -1); // There must be one
                        return {
                            clusterIndex,
                            blockIndex: keyFrameIndex,
                            correctBlockFound: true
                        };
                    }
                }
                return {
                    clusterIndex,
                    blockIndex: -1,
                    correctBlockFound: false
                };
            }
        }, block.timestamp, Infinity, options);
    }
    async fetchPacketInCluster(cluster, blockIndex, options) {
        if (blockIndex === -1) {
            return null;
        }
        const trackData = cluster.trackData.get(this.internalTrack.id);
        const block = trackData.blocks[blockIndex];
        assert(block);
        const data = options.metadataOnly ? PLACEHOLDER_DATA : block.data;
        const timestamp = block.timestamp / this.internalTrack.segment.timestampFactor;
        const duration = block.duration / this.internalTrack.segment.timestampFactor;
        const packet = new EncodedPacket(data, block.isKeyFrame ? 'key' : 'delta', timestamp, duration, cluster.dataStartPos + blockIndex, block.data.byteLength);
        this.packetToClusterLocation.set(packet, {
            cluster,
            blockIndex
        });
        return packet;
    }
    findBlockInClustersForTimestamp(timestampInTimescale) {
        const clusterIndex = binarySearchLessOrEqual(// This array is technically not sorted by start timestamp, but for any reasonable file, it basically is.
        this.internalTrack.clusters, timestampInTimescale, (x)=>x.trackData.get(this.internalTrack.id).startTimestamp);
        let blockIndex = -1;
        let correctBlockFound = false;
        if (clusterIndex !== -1) {
            const cluster = this.internalTrack.clusters[clusterIndex];
            const trackData = cluster.trackData.get(this.internalTrack.id);
            const index = binarySearchLessOrEqual(trackData.presentationTimestamps, timestampInTimescale, (x)=>x.timestamp);
            assert(index !== -1);
            blockIndex = trackData.presentationTimestamps[index].blockIndex;
            correctBlockFound = timestampInTimescale < trackData.endTimestamp;
        }
        return {
            clusterIndex,
            blockIndex,
            correctBlockFound
        };
    }
    findKeyBlockInClustersForTimestamp(timestampInTimescale) {
        const indexInKeyFrameClusters = binarySearchLessOrEqual(// This array is technically not sorted by start timestamp, but for any reasonable file, it basically is.
        this.internalTrack.clustersWithKeyFrame, timestampInTimescale, (x)=>x.trackData.get(this.internalTrack.id).firstKeyFrameTimestamp);
        let clusterIndex = -1;
        let blockIndex = -1;
        let correctBlockFound = false;
        if (indexInKeyFrameClusters !== -1) {
            const cluster = this.internalTrack.clustersWithKeyFrame[indexInKeyFrameClusters];
            // Now, let's find the actual index of the cluster in the list of ALL clusters, not just key frame ones
            clusterIndex = binarySearchExact(this.internalTrack.clusters, cluster.elementStartPos, (x)=>x.elementStartPos);
            assert(clusterIndex !== -1);
            const trackData = cluster.trackData.get(this.internalTrack.id);
            const index = findLastIndex(trackData.presentationTimestamps, (x)=>{
                const block = trackData.blocks[x.blockIndex];
                return block.isKeyFrame && x.timestamp <= timestampInTimescale;
            });
            assert(index !== -1); // It's a key frame cluster, so there must be a key frame
            const entry = trackData.presentationTimestamps[index];
            blockIndex = entry.blockIndex;
            correctBlockFound = timestampInTimescale < trackData.endTimestamp;
        }
        return {
            clusterIndex,
            blockIndex,
            correctBlockFound
        };
    }
    /** Looks for a packet in the clusters while trying to load as few clusters as possible to retrieve it. */ async performClusterLookup(// This function returns the best-matching block that is currently loaded. Based on this information, we know
    // which clusters we need to load to find the actual match.
    getBestMatch, // The timestamp with which we can search the lookup table
    searchTimestamp, // The timestamp for which we know the correct block will not come after it
    latestTimestamp, options) {
        const { demuxer, segment } = this.internalTrack;
        const release = await segment.clusterLookupMutex.acquire(); // The algorithm requires exclusivity
        try {
            const { clusterIndex, blockIndex, correctBlockFound } = getBestMatch();
            if (correctBlockFound) {
                // The correct block already exists, easy path.
                const cluster = this.internalTrack.clusters[clusterIndex];
                return this.fetchPacketInCluster(cluster, blockIndex, options);
            }
            // We use the metadata reader to find the cluster, but the cluster reader to load the cluster
            const metadataReader = demuxer.metadataReader;
            const clusterReader = demuxer.clusterReader;
            let prevCluster = null;
            let bestClusterIndex = clusterIndex;
            let bestBlockIndex = blockIndex;
            // Search for a cue point; this way, we won't need to start searching from the start of the file
            // but can jump right into the correct cluster (or at least nearby).
            const cuePointIndex = binarySearchLessOrEqual(this.internalTrack.cuePoints, searchTimestamp, (x)=>x.time);
            const cuePoint = cuePointIndex !== -1 ? this.internalTrack.cuePoints[cuePointIndex] : null;
            let nextClusterIsFirstCluster = false;
            if (clusterIndex === -1) {
                metadataReader.pos = cuePoint?.clusterPosition ?? segment.clusterSeekStartPos;
                nextClusterIsFirstCluster = metadataReader.pos === segment.clusterSeekStartPos;
            } else {
                const cluster = this.internalTrack.clusters[clusterIndex];
                if (!cuePoint || cluster.elementStartPos >= cuePoint.clusterPosition) {
                    metadataReader.pos = cluster.elementEndPos;
                    prevCluster = cluster;
                } else {
                    // Use the lookup entry
                    metadataReader.pos = cuePoint.clusterPosition;
                }
            }
            while(metadataReader.pos < segment.elementEndPos){
                if (prevCluster) {
                    const trackData = prevCluster.trackData.get(this.internalTrack.id);
                    if (trackData && trackData.startTimestamp > latestTimestamp) {
                        break;
                    }
                    if (prevCluster.nextCluster) {
                        // Skip ahead quickly without needing to read the file again
                        metadataReader.pos = prevCluster.nextCluster.elementEndPos;
                        prevCluster = prevCluster.nextCluster;
                        continue;
                    }
                }
                // Load the header
                await metadataReader.reader.loadRange(metadataReader.pos, metadataReader.pos + MAX_HEADER_SIZE);
                const elementStartPos = metadataReader.pos;
                const elementHeader = metadataReader.readElementHeader();
                const id = elementHeader.id;
                let size = elementHeader.size;
                const dataStartPos = metadataReader.pos;
                if (id === EBMLId.Cluster) {
                    const index = binarySearchExact(segment.clusters, elementStartPos, (x)=>x.elementStartPos);
                    let cluster;
                    if (index === -1) {
                        // This is the first time we've seen this cluster
                        metadataReader.pos = elementStartPos;
                        cluster = await demuxer.readCluster(segment);
                    } else {
                        // We already know this cluster
                        cluster = segment.clusters[index];
                    }
                    // Even if we already know the cluster, we might not yet know its predecessor, so always do this
                    if (prevCluster) prevCluster.nextCluster = cluster;
                    prevCluster = cluster;
                    if (nextClusterIsFirstCluster) {
                        cluster.isKnownToBeFirstCluster = true;
                        nextClusterIsFirstCluster = false;
                    }
                    const { clusterIndex, blockIndex, correctBlockFound } = getBestMatch();
                    if (correctBlockFound) {
                        const cluster = this.internalTrack.clusters[clusterIndex];
                        return this.fetchPacketInCluster(cluster, blockIndex, options);
                    }
                    if (clusterIndex !== -1) {
                        bestClusterIndex = clusterIndex;
                        bestBlockIndex = blockIndex;
                    }
                }
                if (size === null) {
                    // Undefined element size (can happen in livestreamed files). In this case, we need to do some
                    // searching to determine the actual size of the element.
                    if (id === EBMLId.Cluster) {
                        // The cluster should have already computed its length, we can just copy that result
                        assert(prevCluster);
                        size = prevCluster.elementEndPos - dataStartPos;
                    } else {
                        // Search for the next element at level 0 or 1
                        clusterReader.pos = dataStartPos;
                        const nextElementPos = await clusterReader.searchForNextElementId(LEVEL_0_AND_1_EBML_IDS, segment.elementEndPos);
                        size = (nextElementPos ?? segment.elementEndPos) - dataStartPos;
                    }
                    const endPos = dataStartPos + size;
                    if (endPos > segment.elementEndPos - MIN_HEADER_SIZE) {
                        break;
                    } else {
                        // Check the next element. If it's a new segment, we know this segment ends here. The new
                        // segment is just ignored, since we're likely in a livestreamed file and thus only care about
                        // the first segment.
                        clusterReader.pos = endPos;
                        const elementId = clusterReader.readElementId();
                        if (elementId === EBMLId.Segment) {
                            segment.elementEndPos = endPos;
                            break;
                        }
                    }
                }
                metadataReader.pos = dataStartPos + size;
            }
            let result = null;
            const bestCluster = bestClusterIndex !== -1 ? this.internalTrack.clusters[bestClusterIndex] : null;
            if (bestCluster) {
                // If we finished looping but didn't find a perfect match, still return the best match we found
                result = await this.fetchPacketInCluster(bestCluster, bestBlockIndex, options);
            }
            // Catch faulty cue points
            if (!result && cuePoint && (!bestCluster || bestCluster.elementStartPos < cuePoint.clusterPosition)) {
                // The cue point lied to us! We found a cue point but no cluster there that satisfied the match. In this
                // case, let's search again but using the cue point before that.
                const previousCuePoint = this.internalTrack.cuePoints[cuePointIndex - 1];
                const newSearchTimestamp = previousCuePoint?.time ?? -Infinity;
                return this.performClusterLookup(getBestMatch, newSearchTimestamp, latestTimestamp, options);
            }
            return result;
        } finally{
            release();
        }
    }
}
class MatroskaVideoTrackBacking extends MatroskaTrackBacking {
    constructor(internalTrack){
        super(internalTrack);
        this.decoderConfigPromise = null;
        this.internalTrack = internalTrack;
    }
    getCodec() {
        return this.internalTrack.info.codec;
    }
    getCodedWidth() {
        return this.internalTrack.info.width;
    }
    getCodedHeight() {
        return this.internalTrack.info.height;
    }
    getRotation() {
        return this.internalTrack.info.rotation;
    }
    async getColorSpace() {
        return {
            primaries: this.internalTrack.info.colorSpace?.primaries,
            transfer: this.internalTrack.info.colorSpace?.transfer,
            matrix: this.internalTrack.info.colorSpace?.matrix,
            fullRange: this.internalTrack.info.colorSpace?.fullRange
        };
    }
    async getDecoderConfig() {
        if (!this.internalTrack.info.codec) {
            return null;
        }
        return this.decoderConfigPromise ??= (async ()=>{
            let firstPacket = null;
            const needsPacketForAdditionalInfo = this.internalTrack.info.codec === 'vp9' || this.internalTrack.info.codec === 'av1' || this.internalTrack.info.codec === 'avc' && !this.internalTrack.info.codecDescription || this.internalTrack.info.codec === 'hevc' && !this.internalTrack.info.codecDescription;
            if (needsPacketForAdditionalInfo) {
                firstPacket = await this.getFirstPacket({});
            }
            return {
                codec: extractVideoCodecString({
                    width: this.internalTrack.info.width,
                    height: this.internalTrack.info.height,
                    codec: this.internalTrack.info.codec,
                    codecDescription: this.internalTrack.info.codecDescription,
                    colorSpace: this.internalTrack.info.colorSpace,
                    avcCodecInfo: this.internalTrack.info.codec === 'avc' && firstPacket ? extractAvcDecoderConfigurationRecord(firstPacket.data) : null,
                    hevcCodecInfo: this.internalTrack.info.codec === 'hevc' && firstPacket ? extractHevcDecoderConfigurationRecord(firstPacket.data) : null,
                    vp9CodecInfo: this.internalTrack.info.codec === 'vp9' && firstPacket ? extractVp9CodecInfoFromPacket(firstPacket.data) : null,
                    av1CodecInfo: this.internalTrack.info.codec === 'av1' && firstPacket ? extractAv1CodecInfoFromPacket(firstPacket.data) : null
                }),
                codedWidth: this.internalTrack.info.width,
                codedHeight: this.internalTrack.info.height,
                description: this.internalTrack.info.codecDescription ?? undefined,
                colorSpace: this.internalTrack.info.colorSpace ?? undefined
            };
        })();
    }
}
class MatroskaAudioTrackBacking extends MatroskaTrackBacking {
    constructor(internalTrack){
        super(internalTrack);
        this.decoderConfig = null;
        this.internalTrack = internalTrack;
    }
    getCodec() {
        return this.internalTrack.info.codec;
    }
    getNumberOfChannels() {
        return this.internalTrack.info.numberOfChannels;
    }
    getSampleRate() {
        return this.internalTrack.info.sampleRate;
    }
    async getDecoderConfig() {
        if (!this.internalTrack.info.codec) {
            return null;
        }
        return this.decoderConfig ??= {
            codec: extractAudioCodecString({
                codec: this.internalTrack.info.codec,
                codecDescription: this.internalTrack.info.codecDescription,
                aacCodecInfo: this.internalTrack.info.aacCodecInfo
            }),
            numberOfChannels: this.internalTrack.info.numberOfChannels,
            sampleRate: this.internalTrack.info.sampleRate,
            description: this.internalTrack.info.codecDescription ?? undefined
        };
    }
}
/** Sorts blocks such that referenced blocks come before the blocks that reference them. */ const sortBlocksByReferences = (blocks)=>{
    const timestampToBlock = new Map();
    for(let i = 0; i < blocks.length; i++){
        const block = blocks[i];
        timestampToBlock.set(block.timestamp, block);
    }
    const processedBlocks = new Set();
    const result = [];
    const processBlock = (block)=>{
        if (processedBlocks.has(block)) {
            return;
        }
        // Marking the block as processed here already; prevents this algorithm from dying on cycles
        processedBlocks.add(block);
        for(let j = 0; j < block.referencedTimestamps.length; j++){
            const timestamp = block.referencedTimestamps[j];
            const otherBlock = timestampToBlock.get(timestamp);
            if (!otherBlock) {
                continue;
            }
            processBlock(otherBlock);
        }
        result.push(block);
    };
    for(let i = 0; i < blocks.length; i++){
        processBlock(blocks[i]);
    }
    return result;
};

class Mp3Reader {
    constructor(reader){
        this.reader = reader;
        this.pos = 0;
        this.fileSize = null;
    }
    readBytes(length) {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + length);
        this.pos += length;
        return new Uint8Array(view.buffer, offset, length);
    }
    readU16() {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + 2);
        this.pos += 2;
        return view.getUint16(offset, false);
    }
    readU32() {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + 4);
        this.pos += 4;
        return view.getUint32(offset, false);
    }
    readAscii(length) {
        const { view, offset } = this.reader.getViewAndOffset(this.pos, this.pos + length);
        this.pos += length;
        let str = '';
        for(let i = 0; i < length; i++){
            str += String.fromCharCode(view.getUint8(offset + i));
        }
        return str;
    }
    readId3() {
        const tag = this.readAscii(3);
        if (tag !== 'ID3') {
            this.pos -= 3;
            return null;
        }
        this.pos += 3;
        const size = decodeSynchsafe(this.readU32());
        return {
            size
        };
    }
    readNextFrameHeader(until) {
        assert(this.fileSize);
        until ??= this.fileSize;
        while(this.pos <= until - FRAME_HEADER_SIZE){
            const word = this.readU32();
            this.pos -= 4;
            const header = readFrameHeader(word, this);
            if (header) {
                return header;
            }
        }
        return null;
    }
}
const decodeSynchsafe = (synchsafed)=>{
    let mask = 0x7f000000;
    let unsynchsafed = 0;
    while(mask !== 0){
        unsynchsafed >>= 1;
        unsynchsafed |= synchsafed & mask;
        mask >>= 8;
    }
    return unsynchsafed;
};

class Mp3Demuxer extends Demuxer {
    constructor(input){
        super(input);
        this.metadataPromise = null;
        this.firstFrameHeader = null;
        this.allSamples = [];
        this.tracks = [];
        this.reader = new Mp3Reader(input._mainReader);
    }
    async readMetadata() {
        return this.metadataPromise ??= (async ()=>{
            const fileSize = await this.input.source.getSize();
            this.reader.fileSize = fileSize;
            // Just load the entire file. Primitive, but the only way to actually ensure 100% correct timestamps.
            // Random access in MP3 can be flaky and unreliable.
            await this.reader.reader.loadRange(0, fileSize);
            const id3Tag = this.reader.readId3();
            if (id3Tag) {
                this.reader.pos += id3Tag.size;
            }
            let nextTimestampInSamples = 0;
            // Let's read all samples
            while(true){
                const header = this.reader.readNextFrameHeader();
                if (!header) {
                    break;
                }
                const xingOffset = getXingOffset(header.mpegVersionId, header.channel);
                this.reader.pos = header.startPos + xingOffset;
                const word = this.reader.readU32();
                const isXing = word === XING || word === INFO;
                this.reader.pos = header.startPos + header.totalSize - 1; // -1 in case the frame is 1 byte too short
                if (isXing) {
                    continue;
                }
                if (!this.firstFrameHeader) {
                    this.firstFrameHeader = header;
                }
                const sampleDuration = header.audioSamplesInFrame / header.sampleRate;
                const sample = {
                    timestamp: nextTimestampInSamples / header.sampleRate,
                    duration: sampleDuration,
                    dataStart: header.startPos,
                    dataSize: header.totalSize
                };
                this.allSamples.push(sample);
                nextTimestampInSamples += header.audioSamplesInFrame;
            }
            if (!this.firstFrameHeader) {
                throw new Error('No MP3 frames found.');
            }
            this.tracks = [
                new InputAudioTrack(new Mp3AudioTrackBacking(this))
            ];
        })();
    }
    async getMimeType() {
        return 'audio/mpeg';
    }
    async getTracks() {
        await this.readMetadata();
        return this.tracks;
    }
    async computeDuration() {
        await this.readMetadata();
        const lastSample = last(this.allSamples);
        assert(lastSample);
        return lastSample.timestamp + lastSample.duration;
    }
}
class Mp3AudioTrackBacking {
    constructor(demuxer){
        this.demuxer = demuxer;
    }
    getId() {
        return 1;
    }
    async getFirstTimestamp() {
        return 0;
    }
    getTimeResolution() {
        assert(this.demuxer.firstFrameHeader);
        return this.demuxer.firstFrameHeader.sampleRate / this.demuxer.firstFrameHeader.audioSamplesInFrame;
    }
    computeDuration() {
        return this.demuxer.computeDuration();
    }
    getLanguageCode() {
        return UNDETERMINED_LANGUAGE;
    }
    getCodec() {
        return 'mp3';
    }
    getNumberOfChannels() {
        assert(this.demuxer.firstFrameHeader);
        return this.demuxer.firstFrameHeader.channel === 3 ? 1 : 2;
    }
    getSampleRate() {
        assert(this.demuxer.firstFrameHeader);
        return this.demuxer.firstFrameHeader.sampleRate;
    }
    async getDecoderConfig() {
        assert(this.demuxer.firstFrameHeader);
        return {
            codec: 'mp3',
            numberOfChannels: this.demuxer.firstFrameHeader.channel === 3 ? 1 : 2,
            sampleRate: this.demuxer.firstFrameHeader.sampleRate
        };
    }
    getPacketAtIndex(sampleIndex, options) {
        if (sampleIndex === -1) {
            return null;
        }
        const rawSample = this.demuxer.allSamples[sampleIndex];
        if (!rawSample) {
            return null;
        }
        let data;
        if (options.metadataOnly) {
            data = PLACEHOLDER_DATA;
        } else {
            this.demuxer.reader.pos = rawSample.dataStart;
            data = this.demuxer.reader.readBytes(rawSample.dataSize);
        }
        return new EncodedPacket(data, 'key', rawSample.timestamp, rawSample.duration, sampleIndex, rawSample.dataSize);
    }
    async getFirstPacket(options) {
        return this.getPacketAtIndex(0, options);
    }
    async getNextPacket(packet, options) {
        const sampleIndex = binarySearchExact(this.demuxer.allSamples, packet.timestamp, (x)=>x.timestamp);
        if (sampleIndex === -1) {
            throw new Error('Packet was not created from this track.');
        }
        return this.getPacketAtIndex(sampleIndex + 1, options);
    }
    async getPacket(timestamp, options) {
        const index = binarySearchLessOrEqual(this.demuxer.allSamples, timestamp, (x)=>x.timestamp);
        return this.getPacketAtIndex(index, options);
    }
    getKeyPacket(timestamp, options) {
        return this.getPacket(timestamp, options);
    }
    getNextKeyPacket(packet, options) {
        return this.getNextPacket(packet, options);
    }
}

class OggDemuxer extends Demuxer {
    constructor(input){
        super(input);
        /**
         * Lots of reading operations require multiple async reads and thus need to be mutually exclusive to avoid
         * conflicts in reader position.
         */ this.readingMutex = new AsyncMutex();
        this.metadataPromise = null;
        this.fileSize = null;
        this.bitstreams = [];
        this.tracks = [];
        // We don't need a persistent metadata reader as we read all metadata once at the start and then never again
        this.reader = new OggReader(new Reader(input.source, 64 * 2 ** 20));
    }
    async readMetadata() {
        return this.metadataPromise ??= (async ()=>{
            this.fileSize = await this.input.source.getSize();
            while(this.reader.pos < this.fileSize - MIN_PAGE_HEADER_SIZE){
                await this.reader.reader.loadRange(this.reader.pos, this.reader.pos + MAX_PAGE_HEADER_SIZE);
                const page = this.reader.readPageHeader();
                if (!page) {
                    break;
                }
                const isBos = !!(page.headerType & 0x02);
                if (!isBos) {
                    break;
                }
                this.bitstreams.push({
                    serialNumber: page.serialNumber,
                    bosPage: page,
                    description: null,
                    numberOfChannels: -1,
                    sampleRate: -1,
                    codecInfo: {
                        codec: null,
                        vorbisInfo: null,
                        opusInfo: null
                    },
                    lastMetadataPacket: null
                });
                this.reader.pos = page.headerStartPos + page.totalSize;
            }
            for (const bitstream of this.bitstreams){
                const firstPacket = await this.readPacket(this.reader, bitstream.bosPage, 0);
                if (!firstPacket) {
                    continue;
                }
                if (// Check for Vorbis
                firstPacket.data.byteLength >= 7 && firstPacket.data[0] === 0x01 // Packet type 1 = identification header
                 && firstPacket.data[1] === 0x76 // 'v'
                 && firstPacket.data[2] === 0x6f // 'o'
                 && firstPacket.data[3] === 0x72 // 'r'
                 && firstPacket.data[4] === 0x62 // 'b'
                 && firstPacket.data[5] === 0x69 // 'i'
                 && firstPacket.data[6] === 0x73 // 's'
                ) {
                    await this.readVorbisMetadata(firstPacket, bitstream);
                } else if (// Check for Opus
                firstPacket.data.byteLength >= 8 && firstPacket.data[0] === 0x4f // 'O'
                 && firstPacket.data[1] === 0x70 // 'p'
                 && firstPacket.data[2] === 0x75 // 'u'
                 && firstPacket.data[3] === 0x73 // 's'
                 && firstPacket.data[4] === 0x48 // 'H'
                 && firstPacket.data[5] === 0x65 // 'e'
                 && firstPacket.data[6] === 0x61 // 'a'
                 && firstPacket.data[7] === 0x64 // 'd'
                ) {
                    await this.readOpusMetadata(firstPacket, bitstream);
                }
                if (bitstream.codecInfo.codec !== null) {
                    this.tracks.push(new InputAudioTrack(new OggAudioTrackBacking(bitstream, this)));
                }
            }
        })();
    }
    async readVorbisMetadata(firstPacket, bitstream) {
        let nextPacketPosition = await this.findNextPacketStart(this.reader, firstPacket);
        if (!nextPacketPosition) {
            return;
        }
        const secondPacket = await this.readPacket(this.reader, nextPacketPosition.startPage, nextPacketPosition.startSegmentIndex);
        if (!secondPacket) {
            return;
        }
        nextPacketPosition = await this.findNextPacketStart(this.reader, secondPacket);
        if (!nextPacketPosition) {
            return;
        }
        const thirdPacket = await this.readPacket(this.reader, nextPacketPosition.startPage, nextPacketPosition.startSegmentIndex);
        if (!thirdPacket) {
            return;
        }
        if (secondPacket.data[0] !== 0x03 || thirdPacket.data[0] !== 0x05) {
            return;
        }
        const lacingValues = [];
        const addBytesToSegmentTable = (bytes)=>{
            while(true){
                lacingValues.push(Math.min(255, bytes));
                if (bytes < 255) {
                    break;
                }
                bytes -= 255;
            }
        };
        addBytesToSegmentTable(firstPacket.data.length);
        addBytesToSegmentTable(secondPacket.data.length);
        // We don't add the last packet to the segment table, as it is assumed to be whatever bytes remain
        const description = new Uint8Array(1 + lacingValues.length + firstPacket.data.length + secondPacket.data.length + thirdPacket.data.length);
        description[0] = lacingValues.length;
        description.set(lacingValues, 1);
        description.set(firstPacket.data, 1 + lacingValues.length);
        description.set(secondPacket.data, 1 + lacingValues.length + firstPacket.data.length);
        description.set(thirdPacket.data, 1 + lacingValues.length + firstPacket.data.length + secondPacket.data.length);
        bitstream.codecInfo.codec = 'vorbis';
        bitstream.description = description;
        bitstream.lastMetadataPacket = thirdPacket;
        const view = toDataView(firstPacket.data);
        bitstream.numberOfChannels = view.getUint8(11);
        bitstream.sampleRate = view.getUint32(12, true);
        const blockSizeByte = view.getUint8(28);
        bitstream.codecInfo.vorbisInfo = {
            blocksizes: [
                1 << (blockSizeByte & 0xf),
                1 << (blockSizeByte >> 4)
            ],
            modeBlockflags: parseModesFromVorbisSetupPacket(thirdPacket.data).modeBlockflags
        };
    }
    async readOpusMetadata(firstPacket, bitstream) {
        // From https://datatracker.ietf.org/doc/html/rfc7845#section-5:
        // "An Ogg Opus logical stream contains exactly two mandatory header packets: an identification header and a
        // comment header."
        const nextPacketPosition = await this.findNextPacketStart(this.reader, firstPacket);
        if (!nextPacketPosition) {
            return;
        }
        const secondPacket = await this.readPacket(this.reader, nextPacketPosition.startPage, nextPacketPosition.startSegmentIndex);
        if (!secondPacket) {
            return;
        }
        // We don't make use of the comment header's data
        bitstream.codecInfo.codec = 'opus';
        bitstream.description = firstPacket.data;
        bitstream.lastMetadataPacket = secondPacket;
        const header = parseOpusIdentificationHeader(firstPacket.data);
        bitstream.numberOfChannels = header.outputChannelCount;
        bitstream.sampleRate = header.inputSampleRate;
        bitstream.codecInfo.opusInfo = {
            preSkip: header.preSkip
        };
    }
    async readPacket(reader, startPage, startSegmentIndex) {
        assert(startSegmentIndex < startPage.lacingValues.length);
        assert(this.fileSize);
        let startDataOffset = 0;
        for(let i = 0; i < startSegmentIndex; i++){
            startDataOffset += startPage.lacingValues[i];
        }
        let currentPage = startPage;
        let currentDataOffset = startDataOffset;
        let currentSegmentIndex = startSegmentIndex;
        const chunks = [];
        outer: while(true){
            // Load the entire page data
            await reader.reader.loadRange(currentPage.dataStartPos, currentPage.dataStartPos + currentPage.dataSize);
            reader.pos = currentPage.dataStartPos;
            const pageData = reader.readBytes(currentPage.dataSize);
            while(true){
                if (currentSegmentIndex === currentPage.lacingValues.length) {
                    chunks.push(pageData.subarray(startDataOffset, currentDataOffset));
                    break;
                }
                const lacingValue = currentPage.lacingValues[currentSegmentIndex];
                currentDataOffset += lacingValue;
                if (lacingValue < 255) {
                    chunks.push(pageData.subarray(startDataOffset, currentDataOffset));
                    break outer;
                }
                currentSegmentIndex++;
            }
            // The packet extends to the next page; let's find it
            while(true){
                reader.pos = currentPage.headerStartPos + currentPage.totalSize;
                if (reader.pos >= this.fileSize - MIN_PAGE_HEADER_SIZE) {
                    return null;
                }
                await reader.reader.loadRange(reader.pos, reader.pos + MAX_PAGE_HEADER_SIZE);
                const nextPage = reader.readPageHeader();
                if (!nextPage) {
                    return null;
                }
                currentPage = nextPage;
                if (currentPage.serialNumber === startPage.serialNumber) {
                    break;
                }
            }
            startDataOffset = 0;
            currentDataOffset = 0;
            currentSegmentIndex = 0;
        }
        const totalPacketSize = chunks.reduce((sum, chunk)=>sum + chunk.length, 0);
        const packetData = new Uint8Array(totalPacketSize);
        let offset = 0;
        for(let i = 0; i < chunks.length; i++){
            const chunk = chunks[i];
            packetData.set(chunk, offset);
            offset += chunk.length;
        }
        return {
            data: packetData,
            endPage: currentPage,
            endSegmentIndex: currentSegmentIndex
        };
    }
    async findNextPacketStart(reader, lastPacket) {
        assert(this.fileSize !== null);
        // If there's another segment in the same page, return it
        if (lastPacket.endSegmentIndex < lastPacket.endPage.lacingValues.length - 1) {
            return {
                startPage: lastPacket.endPage,
                startSegmentIndex: lastPacket.endSegmentIndex + 1
            };
        }
        const isEos = !!(lastPacket.endPage.headerType & 0x04);
        if (isEos) {
            // The page is marked as the last page of the logical bitstream, so we won't find anything beyond it
            return null;
        }
        // Otherwise, search for the next page belonging to the same bitstream
        reader.pos = lastPacket.endPage.headerStartPos + lastPacket.endPage.totalSize;
        while(true){
            if (reader.pos >= this.fileSize - MIN_PAGE_HEADER_SIZE) {
                return null;
            }
            await reader.reader.loadRange(reader.pos, reader.pos + MAX_PAGE_HEADER_SIZE);
            const nextPage = reader.readPageHeader();
            if (!nextPage) {
                return null;
            }
            if (nextPage.serialNumber === lastPacket.endPage.serialNumber) {
                return {
                    startPage: nextPage,
                    startSegmentIndex: 0
                };
            }
            reader.pos = nextPage.headerStartPos + nextPage.totalSize;
        }
    }
    async getMimeType() {
        await this.readMetadata();
        const codecStrings = await Promise.all(this.tracks.map((x)=>x.getCodecParameterString()));
        return buildOggMimeType({
            codecStrings: codecStrings.filter(Boolean)
        });
    }
    async getTracks() {
        await this.readMetadata();
        return this.tracks;
    }
    async computeDuration() {
        const tracks = await this.getTracks();
        const trackDurations = await Promise.all(tracks.map((x)=>x.computeDuration()));
        return Math.max(0, ...trackDurations);
    }
}
class OggAudioTrackBacking {
    constructor(bitstream, demuxer){
        this.bitstream = bitstream;
        this.demuxer = demuxer;
        this.encodedPacketToMetadata = new WeakMap();
        // Opus always uses a fixed sample rate for its internal calculations, even if the actual rate is different
        this.internalSampleRate = bitstream.codecInfo.codec === 'opus' ? OPUS_INTERNAL_SAMPLE_RATE : bitstream.sampleRate;
    }
    getId() {
        return this.bitstream.serialNumber;
    }
    getNumberOfChannels() {
        return this.bitstream.numberOfChannels;
    }
    getSampleRate() {
        return this.bitstream.sampleRate;
    }
    getTimeResolution() {
        return this.bitstream.sampleRate;
    }
    getCodec() {
        return this.bitstream.codecInfo.codec;
    }
    async getDecoderConfig() {
        assert(this.bitstream.codecInfo.codec);
        return {
            codec: this.bitstream.codecInfo.codec,
            numberOfChannels: this.bitstream.numberOfChannels,
            sampleRate: this.bitstream.sampleRate,
            description: this.bitstream.description ?? undefined
        };
    }
    getLanguageCode() {
        return UNDETERMINED_LANGUAGE;
    }
    async getFirstTimestamp() {
        return 0;
    }
    async computeDuration() {
        const lastPacket = await this.getPacket(Infinity, {
            metadataOnly: true
        });
        return (lastPacket?.timestamp ?? 0) + (lastPacket?.duration ?? 0);
    }
    granulePositionToTimestampInSamples(granulePosition) {
        if (this.bitstream.codecInfo.codec === 'opus') {
            assert(this.bitstream.codecInfo.opusInfo);
            return granulePosition - this.bitstream.codecInfo.opusInfo.preSkip;
        }
        return granulePosition;
    }
    createEncodedPacketFromOggPacket(packet, additional, options) {
        if (!packet) {
            return null;
        }
        const { durationInSamples, vorbisBlockSize } = extractSampleMetadata(packet.data, this.bitstream.codecInfo, additional.vorbisLastBlocksize);
        const encodedPacket = new EncodedPacket(options.metadataOnly ? PLACEHOLDER_DATA : packet.data, 'key', Math.max(0, additional.timestampInSamples) / this.internalSampleRate, durationInSamples / this.internalSampleRate, packet.endPage.headerStartPos + packet.endSegmentIndex, packet.data.byteLength);
        this.encodedPacketToMetadata.set(encodedPacket, {
            packet,
            timestampInSamples: additional.timestampInSamples,
            durationInSamples,
            vorbisBlockSize
        });
        return encodedPacket;
    }
    async getFirstPacket(options, exclusive = true) {
        const release = exclusive ? await this.demuxer.readingMutex.acquire() : null;
        try {
            assert(this.bitstream.lastMetadataPacket);
            const packetPosition = await this.demuxer.findNextPacketStart(this.demuxer.reader, this.bitstream.lastMetadataPacket);
            if (!packetPosition) {
                return null;
            }
            let timestampInSamples = 0;
            if (this.bitstream.codecInfo.codec === 'opus') {
                assert(this.bitstream.codecInfo.opusInfo);
                timestampInSamples -= this.bitstream.codecInfo.opusInfo.preSkip;
            }
            const packet = await this.demuxer.readPacket(this.demuxer.reader, packetPosition.startPage, packetPosition.startSegmentIndex);
            return this.createEncodedPacketFromOggPacket(packet, {
                timestampInSamples,
                vorbisLastBlocksize: null
            }, options);
        } finally{
            release?.();
        }
    }
    async getNextPacket(prevPacket, options) {
        const release = await this.demuxer.readingMutex.acquire();
        try {
            const prevMetadata = this.encodedPacketToMetadata.get(prevPacket);
            if (!prevMetadata) {
                throw new Error('Packet was not created from this track.');
            }
            const packetPosition = await this.demuxer.findNextPacketStart(this.demuxer.reader, prevMetadata.packet);
            if (!packetPosition) {
                return null;
            }
            const timestampInSamples = prevMetadata.timestampInSamples + prevMetadata.durationInSamples;
            const packet = await this.demuxer.readPacket(this.demuxer.reader, packetPosition.startPage, packetPosition.startSegmentIndex);
            return this.createEncodedPacketFromOggPacket(packet, {
                timestampInSamples,
                vorbisLastBlocksize: prevMetadata.vorbisBlockSize
            }, options);
        } finally{
            release();
        }
    }
    async getPacket(timestamp, options) {
        const release = await this.demuxer.readingMutex.acquire();
        try {
            assert(this.demuxer.fileSize !== null);
            const timestampInSamples = roundToPrecision(timestamp * this.internalSampleRate, 14);
            if (timestampInSamples === 0) {
                // Fast path for timestamp 0 - avoids binary search when playing back from the start
                return this.getFirstPacket(options, false);
            }
            if (timestampInSamples < 0) {
                // There's nothing here
                return null;
            }
            const reader = this.demuxer.reader;
            assert(this.bitstream.lastMetadataPacket);
            const startPosition = await this.demuxer.findNextPacketStart(reader, this.bitstream.lastMetadataPacket);
            if (!startPosition) {
                return null;
            }
            let lowPage = startPosition.startPage;
            let high = this.demuxer.fileSize;
            const lowPages = [
                lowPage
            ];
            // First, let's perform a binary serach (bisection search) on the file to find the approximate page where
            // we'll find the packet. We want to find a page whose end packet position is less than or equal to the
            // packet position we're searching for.
            // Outer loop: Does the binary serach
            outer: while(lowPage.headerStartPos + lowPage.totalSize < high){
                const low = lowPage.headerStartPos;
                const mid = Math.floor((low + high) / 2);
                let searchStartPos = mid;
                // Inner loop: Does a linear forward scan if the page cannot be found immediately
                while(true){
                    const until = Math.min(searchStartPos + MAX_PAGE_SIZE, high - MIN_PAGE_HEADER_SIZE);
                    await reader.reader.loadRange(searchStartPos, until);
                    reader.pos = searchStartPos;
                    const found = reader.findNextPageHeader(until);
                    if (!found) {
                        high = mid + MIN_PAGE_HEADER_SIZE;
                        continue outer;
                    }
                    await reader.reader.loadRange(reader.pos, reader.pos + MAX_PAGE_HEADER_SIZE);
                    const page = reader.readPageHeader();
                    assert(page);
                    let pageValid = false;
                    if (page.serialNumber === this.bitstream.serialNumber) {
                        // Serial numbers are basically random numbers, and the chance of finding a fake page with
                        // matching serial number is astronomically low, so we can be pretty sure this page is legit.
                        pageValid = true;
                    } else {
                        await reader.reader.loadRange(page.headerStartPos, page.headerStartPos + page.totalSize);
                        // Validate the page by checking checksum
                        reader.pos = page.headerStartPos;
                        const bytes = reader.readBytes(page.totalSize);
                        const crc = computeOggPageCrc(bytes);
                        pageValid = crc === page.checksum;
                    }
                    if (!pageValid) {
                        // Keep searching for a valid page
                        searchStartPos = page.headerStartPos + 4; // 'OggS' is 4 bytes
                        continue;
                    }
                    if (pageValid && page.serialNumber !== this.bitstream.serialNumber) {
                        // Page is valid but from a different bitstream, so keep searching forward until we find one
                        // belonging to the our bitstream
                        searchStartPos = page.headerStartPos + page.totalSize;
                        continue;
                    }
                    const isContinuationPage = page.granulePosition === -1;
                    if (isContinuationPage) {
                        // No packet ends on this page - keep looking
                        searchStartPos = page.headerStartPos + page.totalSize;
                        continue;
                    }
                    // The page is valid and belongs to our bitstream; let's check its granule position to see where we
                    // need to take the bisection search.
                    if (this.granulePositionToTimestampInSamples(page.granulePosition) > timestampInSamples) {
                        high = page.headerStartPos;
                    } else {
                        lowPage = page;
                        lowPages.push(page);
                    }
                    continue outer;
                }
            }
            // Now we have the last page with a packet position <= the packet position we're looking for, but there
            // might be multiple pages with the packet position, in which case we actually need to find the first of
            // such pages. We'll do this in two steps: First, let's find the latest page we know with an earlier packet
            // position, and then linear scan ourselves forward until we find the correct page.
            let lowerPage = startPosition.startPage;
            for (const otherLowPage of lowPages){
                if (otherLowPage.granulePosition === lowPage.granulePosition) {
                    break;
                }
                if (!lowerPage || otherLowPage.headerStartPos > lowerPage.headerStartPos) {
                    lowerPage = otherLowPage;
                }
            }
            let currentPage = lowerPage;
            // Keep track of the pages we traversed, we need these later for backwards seeking
            const previousPages = [
                currentPage
            ];
            while(true){
                // This loop must terminate as we'll eventually reach lowPage
                if (currentPage.serialNumber === this.bitstream.serialNumber && currentPage.granulePosition === lowPage.granulePosition) {
                    break;
                }
                reader.pos = currentPage.headerStartPos + currentPage.totalSize;
                await reader.reader.loadRange(reader.pos, reader.pos + MAX_PAGE_HEADER_SIZE);
                const nextPage = reader.readPageHeader();
                assert(nextPage);
                currentPage = nextPage;
                if (currentPage.serialNumber === this.bitstream.serialNumber) {
                    previousPages.push(currentPage);
                }
            }
            assert(currentPage.granulePosition !== -1);
            let currentSegmentIndex = null;
            let currentTimestampInSamples;
            let currentTimestampIsCorrect;
            // These indicate the end position of the packet that the granule position belongs to
            let endPage = currentPage;
            let endSegmentIndex = 0;
            if (currentPage.headerStartPos === startPosition.startPage.headerStartPos) {
                currentTimestampInSamples = this.granulePositionToTimestampInSamples(0);
                currentTimestampIsCorrect = true;
                currentSegmentIndex = 0;
            } else {
                currentTimestampInSamples = 0; // Placeholder value! We'll refine it once we can
                currentTimestampIsCorrect = false;
                // Find the segment index of the next packet
                for(let i = currentPage.lacingValues.length - 1; i >= 0; i--){
                    const value = currentPage.lacingValues[i];
                    if (value < 255) {
                        // We know the last packet ended at i, so the next one starts at i + 1
                        currentSegmentIndex = i + 1;
                        break;
                    }
                }
                // This must hold: Since this page has a granule position set, that means there must be a packet that
                // ends in this page.
                if (currentSegmentIndex === null) {
                    throw new Error('Invalid page with granule position: no packets end on this page.');
                }
                endSegmentIndex = currentSegmentIndex - 1;
                const pseudopacket = {
                    data: PLACEHOLDER_DATA,
                    endPage,
                    endSegmentIndex
                };
                const nextPosition = await this.demuxer.findNextPacketStart(reader, pseudopacket);
                if (nextPosition) {
                    // Let's rewind a single step (packet) - this previous packet ensures that we'll correctly compute
                    // the duration for the packet we're looking for.
                    const endPosition = findPreviousPacketEndPosition(previousPages, currentPage, currentSegmentIndex);
                    assert(endPosition);
                    const startPosition = findPacketStartPosition(previousPages, endPosition.page, endPosition.segmentIndex);
                    if (startPosition) {
                        currentPage = startPosition.page;
                        currentSegmentIndex = startPosition.segmentIndex;
                    }
                } else {
                    // There is no next position, which means we're looking for the last packet in the bitstream. The
                    // granule position on the last page tends to be fucky, so let's instead start the search on the
                    // page before that. So let's loop until we find a packet that ends in a previous page.
                    while(true){
                        const endPosition = findPreviousPacketEndPosition(previousPages, currentPage, currentSegmentIndex);
                        if (!endPosition) {
                            break;
                        }
                        const startPosition = findPacketStartPosition(previousPages, endPosition.page, endPosition.segmentIndex);
                        if (!startPosition) {
                            break;
                        }
                        currentPage = startPosition.page;
                        currentSegmentIndex = startPosition.segmentIndex;
                        if (endPosition.page.headerStartPos !== endPage.headerStartPos) {
                            endPage = endPosition.page;
                            endSegmentIndex = endPosition.segmentIndex;
                            break;
                        }
                    }
                }
            }
            let lastEncodedPacket = null;
            let lastEncodedPacketMetadata = null;
            // Alright, now it's time for the final, granular seek: We keep iterating over packets until we've found the
            // one with the correct timestamp - i.e., the last one with a timestamp <= the timestamp we're looking for.
            while(currentPage !== null){
                assert(currentSegmentIndex !== null);
                const packet = await this.demuxer.readPacket(reader, currentPage, currentSegmentIndex);
                if (!packet) {
                    break;
                }
                // We might need to skip the packet if it's a metadata one
                const skipPacket = currentPage.headerStartPos === startPosition.startPage.headerStartPos && currentSegmentIndex < startPosition.startSegmentIndex;
                if (!skipPacket) {
                    let encodedPacket = this.createEncodedPacketFromOggPacket(packet, {
                        timestampInSamples: currentTimestampInSamples,
                        vorbisLastBlocksize: lastEncodedPacketMetadata?.vorbisBlockSize ?? null
                    }, options);
                    assert(encodedPacket);
                    let encodedPacketMetadata = this.encodedPacketToMetadata.get(encodedPacket);
                    assert(encodedPacketMetadata);
                    if (!currentTimestampIsCorrect && packet.endPage.headerStartPos === endPage.headerStartPos && packet.endSegmentIndex === endSegmentIndex) {
                        // We know this packet end timestamp can be derived from the page's granule position
                        currentTimestampInSamples = this.granulePositionToTimestampInSamples(currentPage.granulePosition);
                        currentTimestampIsCorrect = true;
                        // Let's backpatch the packet we just created with the correct timestamp
                        encodedPacket = this.createEncodedPacketFromOggPacket(packet, {
                            timestampInSamples: currentTimestampInSamples - encodedPacketMetadata.durationInSamples,
                            vorbisLastBlocksize: lastEncodedPacketMetadata?.vorbisBlockSize ?? null
                        }, options);
                        assert(encodedPacket);
                        encodedPacketMetadata = this.encodedPacketToMetadata.get(encodedPacket);
                        assert(encodedPacketMetadata);
                    } else {
                        currentTimestampInSamples += encodedPacketMetadata.durationInSamples;
                    }
                    lastEncodedPacket = encodedPacket;
                    lastEncodedPacketMetadata = encodedPacketMetadata;
                    if (currentTimestampIsCorrect && // Next timestamp will be too late
                    (Math.max(currentTimestampInSamples, 0) > timestampInSamples || Math.max(encodedPacketMetadata.timestampInSamples, 0) === timestampInSamples)) {
                        break;
                    }
                }
                const nextPosition = await this.demuxer.findNextPacketStart(reader, packet);
                if (!nextPosition) {
                    break;
                }
                currentPage = nextPosition.startPage;
                currentSegmentIndex = nextPosition.startSegmentIndex;
            }
            return lastEncodedPacket;
        } finally{
            release();
        }
    }
    getKeyPacket(timestamp, options) {
        return this.getPacket(timestamp, options);
    }
    getNextKeyPacket(packet, options) {
        return this.getNextPacket(packet, options);
    }
}
/** Finds the start position of a packet given its end position. */ const findPacketStartPosition = (pageList, endPage, endSegmentIndex)=>{
    let page = endPage;
    let segmentIndex = endSegmentIndex;
    outer: while(true){
        segmentIndex--;
        for(segmentIndex; segmentIndex >= 0; segmentIndex--){
            const lacingValue = page.lacingValues[segmentIndex];
            if (lacingValue < 255) {
                segmentIndex++; // We know the last packet starts here
                break outer;
            }
        }
        assert(segmentIndex === -1);
        const pageStartsWithFreshPacket = !(page.headerType & 0x01);
        if (pageStartsWithFreshPacket) {
            // Fast exit: We know we don't need to look in the previous page
            segmentIndex = 0;
            break;
        }
        const previousPage = findLast(pageList, (x)=>x.headerStartPos < page.headerStartPos);
        if (!previousPage) {
            return null;
        }
        page = previousPage;
        segmentIndex = page.lacingValues.length;
    }
    assert(segmentIndex !== -1);
    if (segmentIndex === page.lacingValues.length) {
        // Wrap back around to the first segment of the next page
        const nextPage = pageList[pageList.indexOf(page) + 1];
        assert(nextPage);
        page = nextPage;
        segmentIndex = 0;
    }
    return {
        page,
        segmentIndex
    };
};
/** Finds the end position of a packet given the start position of the following packet. */ const findPreviousPacketEndPosition = (pageList, startPage, startSegmentIndex)=>{
    if (startSegmentIndex > 0) {
        // Easy
        return {
            page: startPage,
            segmentIndex: startSegmentIndex - 1
        };
    }
    const previousPage = findLast(pageList, (x)=>x.headerStartPos < startPage.headerStartPos);
    if (!previousPage) {
        return null;
    }
    return {
        page: previousPage,
        segmentIndex: previousPage.lacingValues.length - 1
    };
};

/**
 * Base class representing an input media file format.
 * @public
 */ class InputFormat {
}
/**
 * Format representing files compatible with the ISO base media file format (ISOBMFF), like MP4 or MOV files.
 * @public
 */ class IsobmffInputFormat extends InputFormat {
    /** @internal */ async _getMajorBrand(input) {
        const sourceSize = await input._mainReader.source.getSize();
        if (sourceSize < 12) {
            return null;
        }
        const isobmffReader = new IsobmffReader(input._mainReader);
        isobmffReader.pos = 4;
        const fourCc = isobmffReader.readAscii(4);
        if (fourCc !== 'ftyp') {
            return null;
        }
        return isobmffReader.readAscii(4);
    }
    /** @internal */ _createDemuxer(input) {
        return new IsobmffDemuxer(input);
    }
}
/**
 * MPEG-4 Part 14 (MP4) file format.
 * @public
 */ class Mp4InputFormat extends IsobmffInputFormat {
    /** @internal */ async _canReadInput(input) {
        const majorBrand = await this._getMajorBrand(input);
        return !!majorBrand && majorBrand !== 'qt  ';
    }
    get name() {
        return 'MP4';
    }
    get mimeType() {
        return 'video/mp4';
    }
}
/**
 * QuickTime File Format (QTFF), often called MOV.
 * @public
 */ class QuickTimeInputFormat extends IsobmffInputFormat {
    /** @internal */ async _canReadInput(input) {
        const majorBrand = await this._getMajorBrand(input);
        return majorBrand === 'qt  ';
    }
    get name() {
        return 'QuickTime File Format';
    }
    get mimeType() {
        return 'video/quicktime';
    }
}
/**
 * Matroska file format.
 * @public
 */ class MatroskaInputFormat extends InputFormat {
    /** @internal */ async isSupportedEBMLOfDocType(input, desiredDocType) {
        const sourceSize = await input._mainReader.source.getSize();
        if (sourceSize < 8) {
            return false;
        }
        const ebmlReader = new EBMLReader(input._mainReader);
        const varIntSize = ebmlReader.readVarIntSize();
        if (varIntSize < 1 || varIntSize > 8) {
            return false;
        }
        const id = ebmlReader.readUnsignedInt(varIntSize);
        if (id !== EBMLId.EBML) {
            return false;
        }
        const dataSize = ebmlReader.readElementSize();
        if (dataSize === null) {
            return false; // Miss me with that shit
        }
        const startPos = ebmlReader.pos;
        while(ebmlReader.pos < startPos + dataSize){
            const { id, size } = ebmlReader.readElementHeader();
            const dataStartPos = ebmlReader.pos;
            if (size === null) return false;
            switch(id){
                case EBMLId.EBMLVersion:
                    {
                        const ebmlVersion = ebmlReader.readUnsignedInt(size);
                        if (ebmlVersion !== 1) {
                            return false;
                        }
                    }
                    break;
                case EBMLId.EBMLReadVersion:
                    {
                        const ebmlReadVersion = ebmlReader.readUnsignedInt(size);
                        if (ebmlReadVersion !== 1) {
                            return false;
                        }
                    }
                    break;
                case EBMLId.DocType:
                    {
                        const docType = ebmlReader.readString(size);
                        if (docType !== desiredDocType) {
                            return false;
                        }
                    }
                    break;
                case EBMLId.DocTypeVersion:
                    {
                        const docTypeVersion = ebmlReader.readUnsignedInt(size);
                        if (docTypeVersion > 4) {
                            return false;
                        }
                    }
                    break;
            }
            ebmlReader.pos = dataStartPos + size;
        }
        return true;
    }
    /** @internal */ _canReadInput(input) {
        return this.isSupportedEBMLOfDocType(input, 'matroska');
    }
    /** @internal */ _createDemuxer(input) {
        return new MatroskaDemuxer(input);
    }
    get name() {
        return 'Matroska';
    }
    get mimeType() {
        return 'video/x-matroska';
    }
}
/**
 * WebM file format, based on Matroska.
 * @public
 */ class WebMInputFormat extends MatroskaInputFormat {
    /** @internal */ _canReadInput(input) {
        return this.isSupportedEBMLOfDocType(input, 'webm');
    }
    get name() {
        return 'WebM';
    }
    get mimeType() {
        return 'video/webm';
    }
}
/**
 * MP3 file format.
 * @public
 */ class Mp3InputFormat extends InputFormat {
    /** @internal */ async _canReadInput(input) {
        const sourceSize = await input._mainReader.source.getSize();
        if (sourceSize < 4) {
            return false;
        }
        const mp3Reader = new Mp3Reader(input._mainReader);
        mp3Reader.fileSize = sourceSize;
        const id3Tag = mp3Reader.readId3();
        if (id3Tag) {
            mp3Reader.pos += id3Tag.size;
        }
        const framesStartPos = mp3Reader.pos;
        await mp3Reader.reader.loadRange(mp3Reader.pos, mp3Reader.pos + 4096);
        const firstHeader = mp3Reader.readNextFrameHeader(Math.min(framesStartPos + 4096, sourceSize));
        if (!firstHeader) {
            return false;
        }
        if (id3Tag) {
            // If there was an ID3 tag at the start, we can be pretty sure this is MP3 by now
            return true;
        }
        // Fine, we found one frame header, but we're still not entirely sure this is MP3. Let's check if we can find
        // another header right after it:
        mp3Reader.pos = firstHeader.startPos + firstHeader.totalSize;
        await mp3Reader.reader.loadRange(mp3Reader.pos, mp3Reader.pos + FRAME_HEADER_SIZE);
        const secondHeader = mp3Reader.readNextFrameHeader(mp3Reader.pos + FRAME_HEADER_SIZE);
        if (!secondHeader) {
            return false;
        }
        // In a well-formed MP3 file, we'd expect these two frames to share some similarities:
        if (firstHeader.channel !== secondHeader.channel || firstHeader.sampleRate !== secondHeader.sampleRate) {
            return false;
        }
        // We have found two matching consecutive MP3 frames, a strong indicator that this is an MP3 file
        return true;
    }
    /** @internal */ _createDemuxer(input) {
        return new Mp3Demuxer(input);
    }
    get name() {
        return 'MP3';
    }
    get mimeType() {
        return 'audio/mpeg';
    }
}
/**
 * WAVE file format, based on RIFF.
 * @public
 */ class WaveInputFormat extends InputFormat {
    /** @internal */ async _canReadInput(input) {
        const sourceSize = await input._mainReader.source.getSize();
        if (sourceSize < 12) {
            return false;
        }
        const riffReader = new RiffReader(input._mainReader);
        const riffType = riffReader.readAscii(4);
        if (riffType !== 'RIFF' && riffType !== 'RIFX' && riffType !== 'RF64') {
            return false;
        }
        riffReader.pos = 8;
        const format = riffReader.readAscii(4);
        return format === 'WAVE';
    }
    /** @internal */ _createDemuxer(input) {
        return new WaveDemuxer(input);
    }
    get name() {
        return 'WAVE';
    }
    get mimeType() {
        return 'audio/wav';
    }
}
/**
 * Ogg file format.
 * @public
 */ class OggInputFormat extends InputFormat {
    /** @internal */ async _canReadInput(input) {
        const sourceSize = await input._mainReader.source.getSize();
        if (sourceSize < 4) {
            return false;
        }
        const oggReader = new OggReader(input._mainReader);
        return oggReader.readAscii(4) === 'OggS';
    }
    /** @internal */ _createDemuxer(input) {
        return new OggDemuxer(input);
    }
    get name() {
        return 'Ogg';
    }
    get mimeType() {
        return 'application/ogg';
    }
}
/**
 * MP4 input format singleton.
 * @public
 */ const MP4 = new Mp4InputFormat();
/**
 * QuickTime File Format input format singleton.
 * @public
 */ const QTFF = new QuickTimeInputFormat();
/**
 * Matroska input format singleton.
 * @public
 */ const MATROSKA = new MatroskaInputFormat();
/**
 * WebM input format singleton.
 * @public
 */ const WEBM = new WebMInputFormat();
/**
 * MP3 input format singleton.
 * @public
 */ const MP3 = new Mp3InputFormat();
/**
 * WAVE input format singleton.
 * @public
 */ const WAVE = new WaveInputFormat();
/**
 * Ogg input format singleton.
 * @public
 */ const OGG = new OggInputFormat();
/**
 * List of all input format singletons. If you don't need to support all input formats, you should specify the
 * formats individually for better tree shaking.
 * @public
 */ const ALL_FORMATS = [
    MP4,
    QTFF,
    MATROSKA,
    WEBM,
    WAVE,
    OGG,
    MP3
];

/**
 * Represents an input media file. This is the root object from which all media read operations start.
 * @public
 */ class Input {
    constructor(options){
        /** @internal */ this._demuxerPromise = null;
        /** @internal */ this._format = null;
        if (!options || typeof options !== 'object') {
            throw new TypeError('options must be an object.');
        }
        if (!Array.isArray(options.formats) || options.formats.some((x)=>!(x instanceof InputFormat))) {
            throw new TypeError('options.formats must be an array of InputFormat.');
        }
        if (!(options.source instanceof Source)) {
            throw new TypeError('options.source must be a Source.');
        }
        this._formats = options.formats;
        this._source = options.source;
        this._mainReader = new Reader(options.source);
    }
    /** @internal */ _getDemuxer() {
        return this._demuxerPromise ??= (async ()=>{
            await this._mainReader.loadRange(0, 4096); // Load the first 4 kiB so we can determine the format
            for (const format of this._formats){
                const canRead = await format._canReadInput(this);
                if (canRead) {
                    this._format = format;
                    return format._createDemuxer(this);
                }
            }
            throw new Error('Input has an unsupported or unrecognizable format.');
        })();
    }
    /**
     * Returns the source from which this input file reads its data. This is the same source that was passed to the
     * constructor.
     */ get source() {
        return this._source;
    }
    /**
     * Returns the format of the input file. You can compare this result directly to the InputFormat singletons or use
     * `instanceof` checks for subset-aware logic (for example, `format instanceof MatroskaInputFormat` is true for
     * both MKV and WebM).
     */ async getFormat() {
        await this._getDemuxer();
        assert(this._format);
        return this._format;
    }
    /**
     * Computes the duration of the input file, in seconds. More precisely, returns the largest end timestamp among
     * all tracks.
     */ async computeDuration() {
        const demuxer = await this._getDemuxer();
        return demuxer.computeDuration();
    }
    /** Returns the list of all tracks of this input file. */ async getTracks() {
        const demuxer = await this._getDemuxer();
        return demuxer.getTracks();
    }
    /** Returns the list of all video tracks of this input file. */ async getVideoTracks() {
        const tracks = await this.getTracks();
        return tracks.filter((x)=>x.isVideoTrack());
    }
    /** Returns the primary video track of this input file, or null if there are no video tracks. */ async getPrimaryVideoTrack() {
        const tracks = await this.getTracks();
        return tracks.find((x)=>x.isVideoTrack()) ?? null;
    }
    /** Returns the list of all audio tracks of this input file. */ async getAudioTracks() {
        const tracks = await this.getTracks();
        return tracks.filter((x)=>x.isAudioTrack());
    }
    /** Returns the primary audio track of this input file, or null if there are no audio tracks. */ async getPrimaryAudioTrack() {
        const tracks = await this.getTracks();
        return tracks.find((x)=>x.isAudioTrack()) ?? null;
    }
    /** Returns the full MIME type of this input file, including track codecs. */ async getMimeType() {
        const demuxer = await this._getDemuxer();
        return demuxer.getMimeType();
    }
}

const FALLBACK_NUMBER_OF_CHANNELS = 2;
const FALLBACK_SAMPLE_RATE = 48000;
/**
 * Represents a media file conversion process, used to convert one media file into another. In addition to conversion,
 * this class can be used to resize and rotate video, resample audio, drop tracks, or trim to a specific time range.
 * @public
 */ class Conversion {
    /** Initializes a new conversion process without starting the conversion. */ static async init(options) {
        const conversion = new Conversion(options);
        await conversion._init();
        return conversion;
    }
    constructor(options){
        /** @internal */ this._addedCounts = {
            video: 0,
            audio: 0,
            subtitle: 0
        };
        /** @internal */ this._totalTrackCount = 0;
        /** @internal */ this._trackPromises = [];
        /** @internal */ this._executed = false;
        /** @internal */ this._synchronizer = new TrackSynchronizer();
        /** @internal */ this._totalDuration = null;
        /** @internal */ this._maxTimestamps = new Map(); // Track ID -> timestamp
        /** @internal */ this._canceled = false;
        /**
         * A callback that is fired whenever the conversion progresses. Returns a number between 0 and 1, indicating the
         * completion of the conversion. Note that a progress of 1 doesn't necessarily mean the conversion is complete;
         * the conversion is complete once `execute` resolves.
         *
         * In order for progress to be computed, this property must be set before `execute` is called.
         */ this.onProgress = undefined;
        /** @internal */ this._computeProgress = false;
        /** @internal */ this._lastProgress = 0;
        /** The list of tracks that are included in the output file. */ this.utilizedTracks = [];
        /** The list of tracks from the input file that have been discarded, alongside the discard reason. */ this.discardedTracks = [];
        if (!options || typeof options !== 'object') {
            throw new TypeError('options must be an object.');
        }
        if (!(options.input instanceof Input)) {
            throw new TypeError('options.input must be an Input.');
        }
        if (!(options.output instanceof Output)) {
            throw new TypeError('options.output must be an Output.');
        }
        if (options.output._tracks.length > 0 || options.output.state !== 'pending') {
            throw new TypeError('options.output must be fresh: no tracks added and not started.');
        }
        if (options.video !== undefined && (!options.video || typeof options.video !== 'object')) {
            throw new TypeError('options.video, when provided, must be an object.');
        }
        if (options.video?.discard !== undefined && typeof options.video.discard !== 'boolean') {
            throw new TypeError('options.video.discard, when provided, must be a boolean.');
        }
        if (options.video?.forceTranscode !== undefined && typeof options.video.forceTranscode !== 'boolean') {
            throw new TypeError('options.video.forceTranscode, when provided, must be a boolean.');
        }
        if (options.video?.codec !== undefined && !VIDEO_CODECS.includes(options.video.codec)) {
            throw new TypeError(`options.video.codec, when provided, must be one of: ${VIDEO_CODECS.join(', ')}.`);
        }
        if (options.video?.bitrate !== undefined && !(options.video.bitrate instanceof Quality) && (!Number.isInteger(options.video.bitrate) || options.video.bitrate <= 0)) {
            throw new TypeError('options.video.bitrate, when provided, must be a positive integer or a quality.');
        }
        if (options.video?.width !== undefined && (!Number.isInteger(options.video.width) || options.video.width <= 0)) {
            throw new TypeError('options.video.width, when provided, must be a positive integer.');
        }
        if (options.video?.height !== undefined && (!Number.isInteger(options.video.height) || options.video.height <= 0)) {
            throw new TypeError('options.video.height, when provided, must be a positive integer.');
        }
        if (options.video?.fit !== undefined && ![
            'fill',
            'contain',
            'cover'
        ].includes(options.video.fit)) {
            throw new TypeError('options.video.fit, when provided, must be one of "fill", "contain", or "cover".');
        }
        if (options.video?.width !== undefined && options.video.height !== undefined && options.video.fit === undefined) {
            throw new TypeError('When both options.video.width and options.video.height are provided, options.video.fit must also be' + ' provided.');
        }
        if (options.video?.rotate !== undefined && ![
            0,
            90,
            180,
            270
        ].includes(options.video.rotate)) {
            throw new TypeError('options.video.rotate, when provided, must be 0, 90, 180 or 270.');
        }
        if (options.audio !== undefined && (!options.audio || typeof options.audio !== 'object')) {
            throw new TypeError('options.video, when provided, must be an object.');
        }
        if (options.audio?.discard !== undefined && typeof options.audio.discard !== 'boolean') {
            throw new TypeError('options.audio.discard, when provided, must be a boolean.');
        }
        if (options.audio?.forceTranscode !== undefined && typeof options.audio.forceTranscode !== 'boolean') {
            throw new TypeError('options.audio.forceTranscode, when provided, must be a boolean.');
        }
        if (options.audio?.codec !== undefined && !AUDIO_CODECS.includes(options.audio.codec)) {
            throw new TypeError(`options.audio.codec, when provided, must be one of: ${AUDIO_CODECS.join(', ')}.`);
        }
        if (options.audio?.bitrate !== undefined && !(options.audio.bitrate instanceof Quality) && (!Number.isInteger(options.audio.bitrate) || options.audio.bitrate <= 0)) {
            throw new TypeError('options.audio.bitrate, when provided, must be a positive integer or a quality.');
        }
        if (options.audio?.numberOfChannels !== undefined && (!Number.isInteger(options.audio.numberOfChannels) || options.audio.numberOfChannels <= 0)) {
            throw new TypeError('options.audio.numberOfChannels, when provided, must be a positive integer.');
        }
        if (options.audio?.sampleRate !== undefined && (!Number.isInteger(options.audio.sampleRate) || options.audio.sampleRate <= 0)) {
            throw new TypeError('options.audio.sampleRate, when provided, must be a positive integer.');
        }
        if (options.trim !== undefined && (!options.trim || typeof options.trim !== 'object')) {
            throw new TypeError('options.trim, when provided, must be an object.');
        }
        if (options.trim?.start !== undefined && (!Number.isFinite(options.trim.start) || options.trim.start < 0)) {
            throw new TypeError('options.trim.start, when provided, must be a non-negative number.');
        }
        if (options.trim?.end !== undefined && (!Number.isFinite(options.trim.end) || options.trim.end < 0)) {
            throw new TypeError('options.trim.end, when provided, must be a non-negative number.');
        }
        if (options.trim?.start !== undefined && options.trim.end !== undefined && options.trim.start >= options.trim.end) {
            throw new TypeError('options.trim.start must be less than options.trim.end.');
        }
        this._options = options;
        this.input = options.input;
        this.output = options.output;
        this._startTimestamp = options.trim?.start ?? 0;
        this._endTimestamp = options.trim?.end ?? Infinity;
        const { promise: started, resolve: start } = promiseWithResolvers();
        this._started = started;
        this._start = start;
    }
    /** @internal */ async _init() {
        const inputTracks = await this.input.getTracks();
        const outputTrackCounts = this.output.format.getSupportedTrackCounts();
        for (const track of inputTracks){
            if (track.isVideoTrack() && this._options.video?.discard) {
                this.discardedTracks.push({
                    track,
                    reason: 'discarded_by_user'
                });
                continue;
            }
            if (track.isAudioTrack() && this._options.audio?.discard) {
                this.discardedTracks.push({
                    track,
                    reason: 'discarded_by_user'
                });
                continue;
            }
            if (this._totalTrackCount === outputTrackCounts.total.max) {
                this.discardedTracks.push({
                    track,
                    reason: 'max_track_count_reached'
                });
                continue;
            }
            if (this._addedCounts[track.type] === outputTrackCounts[track.type].max) {
                this.discardedTracks.push({
                    track,
                    reason: 'max_track_count_of_type_reached'
                });
                continue;
            }
            if (track.isVideoTrack()) {
                await this._processVideoTrack(track);
            } else if (track.isAudioTrack()) {
                await this._processAudioTrack(track);
            }
        }
        const unintentionallyDiscardedTracks = this.discardedTracks.filter((x)=>x.reason !== 'discarded_by_user');
        if (unintentionallyDiscardedTracks.length > 0) {
            // Let's give the user a notice/warning about discarded tracks so they aren't confused
            console.warn('Some tracks had to be discarded from the conversion:', unintentionallyDiscardedTracks);
        }
    }
    /** Executes the conversion process. Resolves once conversion is complete. */ async execute() {
        if (this._executed) {
            throw new Error('Conversion cannot be executed twice.');
        }
        this._executed = true;
        if (this.onProgress) {
            this._computeProgress = true;
            this._totalDuration = Math.min(await this.input.computeDuration() - this._startTimestamp, this._endTimestamp - this._startTimestamp);
            this.onProgress?.(0);
        }
        await this.output.start();
        this._start();
        try {
            await Promise.all(this._trackPromises);
        } catch (error) {
            if (!this._canceled) {
                // Make sure to cancel to stop other encoding processes and clean up resources
                await this.cancel();
            }
            throw error;
        }
        if (this._canceled) {
            await new Promise(()=>{}); // Never resolve
        }
        await this.output.finalize();
        if (this._computeProgress) {
            this.onProgress?.(1);
        }
    }
    /** Cancels the conversion process. Does nothing if the conversion is already complete. */ async cancel() {
        if (this.output.state === 'finalizing' || this.output.state === 'finalized') {
            return;
        }
        if (this._canceled) {
            console.warn('Conversion already canceled.');
            return;
        }
        this._canceled = true;
        await this.output.cancel();
    }
    /** @internal */ async _processVideoTrack(track) {
        const sourceCodec = track.codec;
        if (!sourceCodec) {
            this.discardedTracks.push({
                track,
                reason: 'unknown_source_codec'
            });
            return;
        }
        let videoSource;
        const totalRotation = normalizeRotation(track.rotation + (this._options.video?.rotate ?? 0));
        const outputSupportsRotation = this.output.format.supportsVideoRotationMetadata;
        const [originalWidth, originalHeight] = totalRotation % 180 === 0 ? [
            track.codedWidth,
            track.codedHeight
        ] : [
            track.codedHeight,
            track.codedWidth
        ];
        let width = originalWidth;
        let height = originalHeight;
        const aspectRatio = width / height;
        // A lot of video encoders require that the dimensions be multiples of 2
        const ceilToMultipleOfTwo = (value)=>Math.ceil(value / 2) * 2;
        if (this._options.video?.width !== undefined && this._options.video.height === undefined) {
            width = ceilToMultipleOfTwo(this._options.video.width);
            height = ceilToMultipleOfTwo(Math.round(width / aspectRatio));
        } else if (this._options.video?.width === undefined && this._options.video?.height !== undefined) {
            height = ceilToMultipleOfTwo(this._options.video.height);
            width = ceilToMultipleOfTwo(Math.round(height * aspectRatio));
        } else if (this._options.video?.width !== undefined && this._options.video.height !== undefined) {
            width = ceilToMultipleOfTwo(this._options.video.width);
            height = ceilToMultipleOfTwo(this._options.video.height);
        }
        const firstTimestamp = await track.getFirstTimestamp();
        const needsTranscode = !!this._options.video?.forceTranscode || this._startTimestamp > 0 || firstTimestamp < 0;
        const needsRerender = width !== originalWidth || height !== originalHeight || totalRotation !== 0 && !outputSupportsRotation;
        let videoCodecs = this.output.format.getSupportedVideoCodecs();
        if (!needsTranscode && !this._options.video?.bitrate && !needsRerender && videoCodecs.includes(sourceCodec) && (!this._options.video?.codec || this._options.video?.codec === sourceCodec)) {
            // Fast path, we can simply copy over the encoded packets
            const source = new EncodedVideoPacketSource(sourceCodec);
            videoSource = source;
            this._trackPromises.push((async ()=>{
                await this._started;
                const sink = new EncodedPacketSink(track);
                const decoderConfig = await track.getDecoderConfig();
                const meta = {
                    decoderConfig: decoderConfig ?? undefined
                };
                const endPacket = Number.isFinite(this._endTimestamp) ? await sink.getPacket(this._endTimestamp, {
                    metadataOnly: true
                }) ?? undefined : undefined;
                for await (const packet of sink.packets(undefined, endPacket, {
                    verifyKeyPackets: true
                })){
                    if (this._synchronizer.shouldWait(track.id, packet.timestamp)) {
                        await this._synchronizer.wait(packet.timestamp);
                    }
                    if (this._canceled) {
                        return;
                    }
                    await source.add(packet, meta);
                    this._reportProgress(track.id, packet.timestamp + packet.duration);
                }
                source.close();
                this._synchronizer.closeTrack(track.id);
            })());
        } else {
            // We need to decode & reencode the video
            const canDecode = await track.canDecode();
            if (!canDecode) {
                this.discardedTracks.push({
                    track,
                    reason: 'undecodable_source_codec'
                });
                return;
            }
            if (this._options.video?.codec) {
                videoCodecs = videoCodecs.filter((codec)=>codec === this._options.video?.codec);
            }
            const bitrate = this._options.video?.bitrate ?? QUALITY_HIGH;
            const encodableCodec = await getFirstEncodableVideoCodec(videoCodecs, {
                width,
                height,
                bitrate
            });
            if (!encodableCodec) {
                this.discardedTracks.push({
                    track,
                    reason: 'no_encodable_target_codec'
                });
                return;
            }
            const encodingConfig = {
                codec: encodableCodec,
                bitrate,
                onEncodedPacket: (sample)=>this._reportProgress(track.id, sample.timestamp + sample.duration)
            };
            if (needsRerender) {
                const source = new VideoSampleSource(encodingConfig);
                videoSource = source;
                this._trackPromises.push((async ()=>{
                    await this._started;
                    const sink = new CanvasSink(track, {
                        width,
                        height,
                        fit: this._options.video?.fit ?? 'fill',
                        rotation: totalRotation,
                        poolSize: 1
                    });
                    const iterator = sink.canvases(this._startTimestamp, this._endTimestamp);
                    for await (const { canvas, timestamp, duration } of iterator){
                        if (this._synchronizer.shouldWait(track.id, timestamp)) {
                            await this._synchronizer.wait(timestamp);
                        }
                        if (this._canceled) {
                            return;
                        }
                        const sample = new VideoSample(canvas, {
                            timestamp: Math.max(timestamp - this._startTimestamp, 0),
                            duration
                        });
                        await source.add(sample);
                        sample.close();
                    }
                })());
            } else {
                const source = new VideoSampleSource(encodingConfig);
                videoSource = source;
                this._trackPromises.push((async ()=>{
                    await this._started;
                    const sink = new VideoSampleSink(track);
                    for await (const sample of sink.samples(this._startTimestamp, this._endTimestamp)){
                        if (this._synchronizer.shouldWait(track.id, sample.timestamp)) {
                            await this._synchronizer.wait(sample.timestamp);
                        }
                        sample.setTimestamp(Math.max(sample.timestamp - this._startTimestamp, 0));
                        if (this._canceled) {
                            return;
                        }
                        await source.add(sample);
                        sample.close();
                    }
                    source.close();
                    this._synchronizer.closeTrack(track.id);
                })());
            }
        }
        this.output.addVideoTrack(videoSource, {
            languageCode: track.languageCode,
            rotation: needsRerender ? 0 : totalRotation
        });
        this._addedCounts.video++;
        this._totalTrackCount++;
        this.utilizedTracks.push(track);
    }
    /** @internal */ async _processAudioTrack(track) {
        const sourceCodec = track.codec;
        if (!sourceCodec) {
            this.discardedTracks.push({
                track,
                reason: 'unknown_source_codec'
            });
            return;
        }
        let audioSource;
        const originalNumberOfChannels = track.numberOfChannels;
        const originalSampleRate = track.sampleRate;
        const firstTimestamp = await track.getFirstTimestamp();
        let numberOfChannels = this._options.audio?.numberOfChannels ?? originalNumberOfChannels;
        let sampleRate = this._options.audio?.sampleRate ?? originalSampleRate;
        let needsResample = numberOfChannels !== originalNumberOfChannels || sampleRate !== originalSampleRate || this._startTimestamp > 0 || firstTimestamp < 0;
        let audioCodecs = this.output.format.getSupportedAudioCodecs();
        if (!this._options.audio?.forceTranscode && !this._options.audio?.bitrate && !needsResample && audioCodecs.includes(sourceCodec) && (!this._options.audio?.codec || this._options.audio.codec === sourceCodec)) {
            // Fast path, we can simply copy over the encoded packets
            const source = new EncodedAudioPacketSource(sourceCodec);
            audioSource = source;
            this._trackPromises.push((async ()=>{
                await this._started;
                const sink = new EncodedPacketSink(track);
                const decoderConfig = await track.getDecoderConfig();
                const meta = {
                    decoderConfig: decoderConfig ?? undefined
                };
                const endPacket = Number.isFinite(this._endTimestamp) ? await sink.getPacket(this._endTimestamp, {
                    metadataOnly: true
                }) ?? undefined : undefined;
                for await (const packet of sink.packets(undefined, endPacket)){
                    if (this._synchronizer.shouldWait(track.id, packet.timestamp)) {
                        await this._synchronizer.wait(packet.timestamp);
                    }
                    if (this._canceled) {
                        return;
                    }
                    await source.add(packet, meta);
                    this._reportProgress(track.id, packet.timestamp + packet.duration);
                }
                source.close();
                this._synchronizer.closeTrack(track.id);
            })());
        } else {
            // We need to decode & reencode the audio
            const canDecode = await track.canDecode();
            if (!canDecode) {
                this.discardedTracks.push({
                    track,
                    reason: 'undecodable_source_codec'
                });
                return;
            }
            let codecOfChoice = null;
            if (this._options.audio?.codec) {
                audioCodecs = audioCodecs.filter((codec)=>codec === this._options.audio.codec);
            }
            const bitrate = this._options.audio?.bitrate ?? QUALITY_HIGH;
            const encodableCodecs = await getEncodableAudioCodecs(audioCodecs, {
                numberOfChannels,
                sampleRate,
                bitrate
            });
            if (!encodableCodecs.some((codec)=>NON_PCM_AUDIO_CODECS.includes(codec)) && audioCodecs.some((codec)=>NON_PCM_AUDIO_CODECS.includes(codec)) && (numberOfChannels !== FALLBACK_NUMBER_OF_CHANNELS || sampleRate !== FALLBACK_SAMPLE_RATE)) {
                // We could not find a compatible non-PCM codec despite the container supporting them. This can be
                // caused by strange channel count or sample rate configurations. Therefore, let's try again but with
                // fallback parameters.
                const encodableCodecsWithDefaultParams = await getEncodableAudioCodecs(audioCodecs, {
                    numberOfChannels: FALLBACK_NUMBER_OF_CHANNELS,
                    sampleRate: FALLBACK_SAMPLE_RATE,
                    bitrate
                });
                const nonPcmCodec = encodableCodecsWithDefaultParams.find((codec)=>NON_PCM_AUDIO_CODECS.includes(codec));
                if (nonPcmCodec) {
                    // We are able to encode using a non-PCM codec, but it'll require resampling
                    needsResample = true;
                    codecOfChoice = nonPcmCodec;
                    numberOfChannels = FALLBACK_NUMBER_OF_CHANNELS;
                    sampleRate = FALLBACK_SAMPLE_RATE;
                }
            } else {
                codecOfChoice = encodableCodecs[0] ?? null;
            }
            if (codecOfChoice === null) {
                this.discardedTracks.push({
                    track,
                    reason: 'no_encodable_target_codec'
                });
                return;
            }
            if (needsResample) {
                audioSource = this._resampleAudio(track, codecOfChoice, numberOfChannels, sampleRate, bitrate);
            } else {
                const source = new AudioSampleSource({
                    codec: codecOfChoice,
                    bitrate,
                    onEncodedPacket: (packet)=>this._reportProgress(track.id, packet.timestamp + packet.duration)
                });
                audioSource = source;
                this._trackPromises.push((async ()=>{
                    await this._started;
                    const sink = new AudioSampleSink(track);
                    for await (const sample of sink.samples(undefined, this._endTimestamp)){
                        if (this._synchronizer.shouldWait(track.id, sample.timestamp)) {
                            await this._synchronizer.wait(sample.timestamp);
                        }
                        if (this._canceled) {
                            return;
                        }
                        await source.add(sample);
                        sample.close();
                    }
                    source.close();
                    this._synchronizer.closeTrack(track.id);
                })());
            }
        }
        this.output.addAudioTrack(audioSource, {
            languageCode: track.languageCode
        });
        this._addedCounts.audio++;
        this._totalTrackCount++;
        this.utilizedTracks.push(track);
    }
    /** @internal */ _resampleAudio(track, codec, targetNumberOfChannels, targetSampleRate, bitrate) {
        const source = new AudioSampleSource({
            codec,
            bitrate,
            onEncodedPacket: (packet)=>this._reportProgress(track.id, packet.timestamp + packet.duration)
        });
        this._trackPromises.push((async ()=>{
            await this._started;
            const resampler = new AudioResampler({
                sourceNumberOfChannels: track.numberOfChannels,
                sourceSampleRate: track.sampleRate,
                targetNumberOfChannels,
                targetSampleRate,
                startTime: this._startTimestamp,
                endTime: this._endTimestamp,
                onSample: (sample)=>source.add(sample)
            });
            const sink = new AudioSampleSink(track);
            const iterator = sink.samples(this._startTimestamp, this._endTimestamp);
            for await (const sample of iterator){
                if (this._synchronizer.shouldWait(track.id, sample.timestamp)) {
                    await this._synchronizer.wait(sample.timestamp);
                }
                if (this._canceled) {
                    return;
                }
                await resampler.add(sample);
            }
            await resampler.finalize();
            source.close();
            this._synchronizer.closeTrack(track.id);
        })());
        return source;
    }
    /** @internal */ _reportProgress(trackId, endTimestamp) {
        if (!this._computeProgress) {
            return;
        }
        assert(this._totalDuration !== null);
        this._maxTimestamps.set(trackId, Math.max(endTimestamp, this._maxTimestamps.get(trackId) ?? -Infinity));
        let totalTimestamps = 0;
        for (const [, timestamp] of this._maxTimestamps){
            totalTimestamps += timestamp;
        }
        const averageTimestamp = totalTimestamps / this._totalTrackCount;
        const newProgress = clamp(averageTimestamp / this._totalDuration, 0, 1);
        if (newProgress !== this._lastProgress) {
            this._lastProgress = newProgress;
            this.onProgress?.(newProgress);
        }
    }
}
const MAX_TIMESTAMP_GAP = 5;
/**
 * Utility class for synchronizing multiple track packet consumers with one another. We don't want one consumer to get
 * too out-of-sync with the others, as that may lead to a large number of packets that need to be internally buffered
 * before they can be written. Therefore, we use this class to slow down a consumer if it is too far ahead of the
 * slowest consumer.
 */ class TrackSynchronizer {
    constructor(){
        this.maxTimestamps = new Map(); // Track ID -> timestamp
        this.resolvers = [];
    }
    computeMinAndMaybeResolve() {
        let newMin = Infinity;
        for (const [, timestamp] of this.maxTimestamps){
            newMin = Math.min(newMin, timestamp);
        }
        for(let i = 0; i < this.resolvers.length; i++){
            const entry = this.resolvers[i];
            if (entry.timestamp - newMin < MAX_TIMESTAMP_GAP) {
                // The gap has gotten small enough again, the consumer can continue again
                entry.resolve();
                this.resolvers.splice(i, 1);
                i--;
            }
        }
        return newMin;
    }
    shouldWait(trackId, timestamp) {
        this.maxTimestamps.set(trackId, Math.max(timestamp, this.maxTimestamps.get(trackId) ?? -Infinity));
        const newMin = this.computeMinAndMaybeResolve();
        return timestamp - newMin >= MAX_TIMESTAMP_GAP; // Should wait if it is too far ahead of the slowest consumer
    }
    wait(timestamp) {
        const { promise, resolve } = promiseWithResolvers();
        this.resolvers.push({
            timestamp,
            resolve
        });
        return promise;
    }
    closeTrack(trackId) {
        this.maxTimestamps.delete(trackId);
        this.computeMinAndMaybeResolve();
    }
}
/**
 * Utility class to handle audio resampling, handling both sample rate resampling as well as channel up/downmixing.
 * The advantage over doing this manually rather than using OfflineAudioContext to do it for us is the artifact-free
 * handling of putting multiple resampled audio samples back to back, which produces flaky results using
 * OfflineAudioContext.
 */ class AudioResampler {
    constructor(options){
        this.sourceSampleRate = options.sourceSampleRate;
        this.targetSampleRate = options.targetSampleRate;
        this.sourceNumberOfChannels = options.sourceNumberOfChannels;
        this.targetNumberOfChannels = options.targetNumberOfChannels;
        this.startTime = options.startTime;
        this.endTime = options.endTime;
        this.onSample = options.onSample;
        this.bufferSizeInFrames = Math.floor(this.targetSampleRate * 5.0); // 5 seconds
        this.bufferSizeInSamples = this.bufferSizeInFrames * this.targetNumberOfChannels;
        this.outputBuffer = new Float32Array(this.bufferSizeInSamples);
        this.bufferStartFrame = 0;
        this.maxWrittenFrame = -1;
        this.setupChannelMixer();
        // Pre-allocate temporary buffer for source data
        this.tempSourceBuffer = new Float32Array(this.sourceSampleRate * this.sourceNumberOfChannels);
    }
    /**
     * Sets up the channel mixer to handle up/downmixing in the case where input and output channel counts don't match.
     */ setupChannelMixer() {
        const sourceNum = this.sourceNumberOfChannels;
        const targetNum = this.targetNumberOfChannels;
        // Logic taken from
        // https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Basic_concepts_behind_Web_Audio_API
        // Most of the mapping functions are branchless.
        if (sourceNum === 1 && targetNum === 2) {
            // Mono to Stereo: M -> L, M -> R
            this.channelMixer = (sourceData, sourceFrameIndex)=>{
                return sourceData[sourceFrameIndex * sourceNum];
            };
        } else if (sourceNum === 1 && targetNum === 4) {
            // Mono to Quad: M -> L, M -> R, 0 -> SL, 0 -> SR
            this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex)=>{
                return sourceData[sourceFrameIndex * sourceNum] * +(targetChannelIndex < 2);
            };
        } else if (sourceNum === 1 && targetNum === 6) {
            // Mono to 5.1: 0 -> L, 0 -> R, M -> C, 0 -> LFE, 0 -> SL, 0 -> SR
            this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex)=>{
                return sourceData[sourceFrameIndex * sourceNum] * +(targetChannelIndex === 2);
            };
        } else if (sourceNum === 2 && targetNum === 1) {
            // Stereo to Mono: 0.5 * (L + R)
            this.channelMixer = (sourceData, sourceFrameIndex)=>{
                const baseIdx = sourceFrameIndex * sourceNum;
                return 0.5 * (sourceData[baseIdx] + sourceData[baseIdx + 1]);
            };
        } else if (sourceNum === 2 && targetNum === 4) {
            // Stereo to Quad: L -> L, R -> R, 0 -> SL, 0 -> SR
            this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex)=>{
                return sourceData[sourceFrameIndex * sourceNum + targetChannelIndex] * +(targetChannelIndex < 2);
            };
        } else if (sourceNum === 2 && targetNum === 6) {
            // Stereo to 5.1: L -> L, R -> R, 0 -> C, 0 -> LFE, 0 -> SL, 0 -> SR
            this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex)=>{
                return sourceData[sourceFrameIndex * sourceNum + targetChannelIndex] * +(targetChannelIndex < 2);
            };
        } else if (sourceNum === 4 && targetNum === 1) {
            // Quad to Mono: 0.25 * (L + R + SL + SR)
            this.channelMixer = (sourceData, sourceFrameIndex)=>{
                const baseIdx = sourceFrameIndex * sourceNum;
                return 0.25 * (sourceData[baseIdx] + sourceData[baseIdx + 1] + sourceData[baseIdx + 2] + sourceData[baseIdx + 3]);
            };
        } else if (sourceNum === 4 && targetNum === 2) {
            // Quad to Stereo: 0.5 * (L + SL), 0.5 * (R + SR)
            this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex)=>{
                const baseIdx = sourceFrameIndex * sourceNum;
                return 0.5 * (sourceData[baseIdx + targetChannelIndex] + sourceData[baseIdx + targetChannelIndex + 2]);
            };
        } else if (sourceNum === 4 && targetNum === 6) {
            // Quad to 5.1: L -> L, R -> R, 0 -> C, 0 -> LFE, SL -> SL, SR -> SR
            this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex)=>{
                const baseIdx = sourceFrameIndex * sourceNum;
                // It's a bit harder to do this one branchlessly
                if (targetChannelIndex < 2) return sourceData[baseIdx + targetChannelIndex]; // L, R
                if (targetChannelIndex === 2 || targetChannelIndex === 3) return 0; // C, LFE
                return sourceData[baseIdx + targetChannelIndex - 2]; // SL, SR
            };
        } else if (sourceNum === 6 && targetNum === 1) {
            // 5.1 to Mono: sqrt(1/2) * (L + R) + C + 0.5 * (SL + SR)
            this.channelMixer = (sourceData, sourceFrameIndex)=>{
                const baseIdx = sourceFrameIndex * sourceNum;
                return Math.SQRT1_2 * (sourceData[baseIdx] + sourceData[baseIdx + 1]) + sourceData[baseIdx + 2] + 0.5 * (sourceData[baseIdx + 4] + sourceData[baseIdx + 5]);
            };
        } else if (sourceNum === 6 && targetNum === 2) {
            // 5.1 to Stereo: L + sqrt(1/2) * (C + SL), R + sqrt(1/2) * (C + SR)
            this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex)=>{
                const baseIdx = sourceFrameIndex * sourceNum;
                return sourceData[baseIdx + targetChannelIndex] + Math.SQRT1_2 * (sourceData[baseIdx + 2] + sourceData[baseIdx + targetChannelIndex + 4]);
            };
        } else if (sourceNum === 6 && targetNum === 4) {
            // 5.1 to Quad: L + sqrt(1/2) * C, R + sqrt(1/2) * C, SL, SR
            this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex)=>{
                const baseIdx = sourceFrameIndex * sourceNum;
                // It's a bit harder to do this one branchlessly
                if (targetChannelIndex < 2) {
                    return sourceData[baseIdx + targetChannelIndex] + Math.SQRT1_2 * sourceData[baseIdx + 2];
                }
                return sourceData[baseIdx + targetChannelIndex + 2]; // SL, SR
            };
        } else {
            // Discrete fallback: direct mapping with zero-fill or drop
            this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex)=>{
                return targetChannelIndex < sourceNum ? sourceData[sourceFrameIndex * sourceNum + targetChannelIndex] : 0;
            };
        }
    }
    ensureTempBufferSize(requiredSamples) {
        let length = this.tempSourceBuffer.length;
        while(length < requiredSamples){
            length *= 2;
        }
        if (length !== this.tempSourceBuffer.length) {
            const newBuffer = new Float32Array(length);
            newBuffer.set(this.tempSourceBuffer);
            this.tempSourceBuffer = newBuffer;
        }
    }
    async add(audioSample) {
        if (!audioSample || audioSample._closed) {
            return;
        }
        const requiredSamples = audioSample.numberOfFrames * audioSample.numberOfChannels;
        this.ensureTempBufferSize(requiredSamples);
        // Copy the audio data to the temp buffer
        const sourceDataSize = audioSample.allocationSize({
            planeIndex: 0,
            format: 'f32'
        });
        const sourceView = new Float32Array(this.tempSourceBuffer.buffer, 0, sourceDataSize / 4);
        audioSample.copyTo(sourceView, {
            planeIndex: 0,
            format: 'f32'
        });
        const inputStartTime = audioSample.timestamp - this.startTime;
        const inputDuration = audioSample.numberOfFrames / this.sourceSampleRate;
        const inputEndTime = Math.min(inputStartTime + inputDuration, this.endTime - this.startTime);
        // Compute which output frames are affected by this sample
        const outputStartFrame = Math.floor(inputStartTime * this.targetSampleRate);
        const outputEndFrame = Math.ceil(inputEndTime * this.targetSampleRate);
        for(let outputFrame = outputStartFrame; outputFrame < outputEndFrame; outputFrame++){
            if (outputFrame < this.bufferStartFrame) {
                continue; // Skip writes to the past
            }
            while(outputFrame >= this.bufferStartFrame + this.bufferSizeInFrames){
                // The write is after the current buffer, so finalize it
                await this.finalizeCurrentBuffer();
                this.bufferStartFrame += this.bufferSizeInFrames;
            }
            const bufferFrameIndex = outputFrame - this.bufferStartFrame;
            assert(bufferFrameIndex < this.bufferSizeInFrames);
            const outputTime = outputFrame / this.targetSampleRate;
            const inputTime = outputTime - inputStartTime;
            const sourcePosition = inputTime * this.sourceSampleRate;
            const sourceLowerFrame = Math.floor(sourcePosition);
            const sourceUpperFrame = Math.ceil(sourcePosition);
            const fraction = sourcePosition - sourceLowerFrame;
            // Process each output channel
            for(let targetChannel = 0; targetChannel < this.targetNumberOfChannels; targetChannel++){
                let lowerSample = 0;
                let upperSample = 0;
                if (sourceLowerFrame >= 0 && sourceLowerFrame < audioSample.numberOfFrames) {
                    lowerSample = this.channelMixer(sourceView, sourceLowerFrame, targetChannel);
                }
                if (sourceUpperFrame >= 0 && sourceUpperFrame < audioSample.numberOfFrames) {
                    upperSample = this.channelMixer(sourceView, sourceUpperFrame, targetChannel);
                }
                // For resampling, we do naive linear interpolation to find the in-between sample. This produces
                // suboptimal results especially for downsampling (for which a low-pass filter would first need to be
                // applied), but AudioContext doesn't do this either, so, whatever, for now.
                const outputSample = lowerSample + fraction * (upperSample - lowerSample);
                // Write to output buffer (interleaved)
                const outputIndex = bufferFrameIndex * this.targetNumberOfChannels + targetChannel;
                this.outputBuffer[outputIndex] += outputSample; // Add in case of overlapping samples
            }
            this.maxWrittenFrame = Math.max(this.maxWrittenFrame, bufferFrameIndex);
        }
    }
    async finalizeCurrentBuffer() {
        if (this.maxWrittenFrame < 0) {
            return; // Nothing to finalize
        }
        const samplesWritten = (this.maxWrittenFrame + 1) * this.targetNumberOfChannels;
        const outputData = new Float32Array(samplesWritten);
        outputData.set(this.outputBuffer.subarray(0, samplesWritten));
        const timestampSeconds = this.bufferStartFrame / this.targetSampleRate;
        const audioSample = new AudioSample({
            format: 'f32',
            sampleRate: this.targetSampleRate,
            numberOfChannels: this.targetNumberOfChannels,
            timestamp: timestampSeconds,
            data: outputData
        });
        await this.onSample(audioSample);
        this.outputBuffer.fill(0);
        this.maxWrittenFrame = -1;
    }
    finalize() {
        return this.finalizeCurrentBuffer();
    }
}

export { ALL_FORMATS, ALL_TRACK_TYPES, AUDIO_CODECS, AudioBufferSink, AudioBufferSource, AudioSample, AudioSampleSink, AudioSampleSource, AudioSource, BaseMediaSampleSink, BlobSource, BufferSource, BufferTarget, CanvasSink, CanvasSource, Conversion, CustomAudioDecoder, CustomAudioEncoder, CustomVideoDecoder, CustomVideoEncoder, EncodedAudioPacketSource, EncodedPacket, EncodedPacketSink, EncodedVideoPacketSource, Input, InputAudioTrack, InputFormat, InputTrack, InputVideoTrack, IsobmffInputFormat, IsobmffOutputFormat, MATROSKA, MP3, MP4, MatroskaInputFormat, MediaSource, MediaStreamAudioTrackSource, MediaStreamVideoTrackSource, MkvOutputFormat, MovOutputFormat, Mp3InputFormat, Mp3OutputFormat, Mp4InputFormat, Mp4OutputFormat, NON_PCM_AUDIO_CODECS, OGG, OggInputFormat, OggOutputFormat, Output, OutputFormat, PCM_AUDIO_CODECS, QTFF, QUALITY_HIGH, QUALITY_LOW, QUALITY_MEDIUM, QUALITY_VERY_HIGH, QUALITY_VERY_LOW, Quality, QuickTimeInputFormat, SUBTITLE_CODECS, Source, StreamSource, StreamTarget, SubtitleSource, Target, TextSubtitleSource, UrlSource, VIDEO_CODECS, VideoSample, VideoSampleSink, VideoSampleSource, VideoSource, WAVE, WEBM, WavOutputFormat, WaveInputFormat, WebMInputFormat, WebMOutputFormat, canEncode, canEncodeAudio, canEncodeSubtitles, canEncodeVideo, getEncodableAudioCodecs, getEncodableCodecs, getEncodableSubtitleCodecs, getEncodableVideoCodecs, getFirstEncodableAudioCodec, getFirstEncodableSubtitleCodec, getFirstEncodableVideoCodec, registerDecoder, registerEncoder };
