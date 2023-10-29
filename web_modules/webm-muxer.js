var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __pow = Math.pow;
var __defNormalProp = (obj, key, value)=>key in obj ? __defProp(obj, key, {
        enumerable: true,
        configurable: true,
        writable: true,
        value
    }) : obj[key] = value;
var __spreadValues = (a, b)=>{
    for(var prop in b ||= {})if (__hasOwnProp.call(b, prop)) __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols) for (var prop of __getOwnPropSymbols(b)){
        if (__propIsEnum.call(b, prop)) __defNormalProp(a, prop, b[prop]);
    }
    return a;
};
var __accessCheck = (obj, member, msg)=>{
    if (!member.has(obj)) throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter)=>{
    __accessCheck(obj, member, "read from private field");
    return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value)=>{
    if (member.has(obj)) throw TypeError("Cannot add the same private member more than once");
    member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter)=>{
    __accessCheck(obj, member, "write to private field");
    setter ? setter.call(obj, value) : member.set(obj, value);
    return value;
};
var __privateMethod = (obj, member, method)=>{
    __accessCheck(obj, member, "access private method");
    return method;
};
// src/ebml.ts
var EBMLFloat32 = class {
    constructor(value){
        this.value = value;
    }
};
var EBMLFloat64 = class {
    constructor(value){
        this.value = value;
    }
};
var measureUnsignedInt = (value)=>{
    if (value < 1 << 8) {
        return 1;
    } else if (value < 1 << 16) {
        return 2;
    } else if (value < 1 << 24) {
        return 3;
    } else if (value < __pow(2, 32)) {
        return 4;
    } else if (value < __pow(2, 40)) {
        return 5;
    } else {
        return 6;
    }
};
var measureEBMLVarInt = (value)=>{
    if (value < (1 << 7) - 1) {
        return 1;
    } else if (value < (1 << 14) - 1) {
        return 2;
    } else if (value < (1 << 21) - 1) {
        return 3;
    } else if (value < (1 << 28) - 1) {
        return 4;
    } else if (value < __pow(2, 35) - 1) {
        return 5;
    } else if (value < __pow(2, 42) - 1) {
        return 6;
    } else {
        throw new Error("EBML VINT size not supported " + value);
    }
};
// src/misc.ts
var readBits = (bytes, start, end)=>{
    let result = 0;
    for(let i = start; i < end; i++){
        let byteIndex = Math.floor(i / 8);
        let byte = bytes[byteIndex];
        let bitIndex = 7 - (i & 7);
        let bit = (byte & 1 << bitIndex) >> bitIndex;
        result <<= 1;
        result |= bit;
    }
    return result;
};
var writeBits = (bytes, start, end, value)=>{
    for(let i = start; i < end; i++){
        let byteIndex = Math.floor(i / 8);
        let byte = bytes[byteIndex];
        let bitIndex = 7 - (i & 7);
        byte &= ~(1 << bitIndex);
        byte |= (value & 1 << end - i - 1) >> end - i - 1 << bitIndex;
        bytes[byteIndex] = byte;
    }
};
// src/target.ts
var ArrayBufferTarget = class {
    constructor(){
        this.buffer = null;
    }
};
var StreamTarget = class {
    constructor(onData, onDone, options){
        this.onData = onData;
        this.onDone = onDone;
        this.options = options;
    }
};
var FileSystemWritableFileStreamTarget = class {
    constructor(stream, options){
        this.stream = stream;
        this.options = options;
    }
};
// src/writer.ts
var _helper, _helperView, _writeByte, writeByte_fn, _writeFloat32, writeFloat32_fn, _writeFloat64, writeFloat64_fn, _writeUnsignedInt, writeUnsignedInt_fn, _writeString, writeString_fn;
var Writer = class {
    seek(newPos) {
        this.pos = newPos;
    }
    writeEBMLVarInt(value, width) {
        if (width === void 0) width = measureEBMLVarInt(value);
        let pos = 0;
        switch(width){
            case 1:
                __privateGet(this, _helperView).setUint8(pos++, 1 << 7 | value);
                break;
            case 2:
                __privateGet(this, _helperView).setUint8(pos++, 1 << 6 | value >> 8);
                __privateGet(this, _helperView).setUint8(pos++, value);
                break;
            case 3:
                __privateGet(this, _helperView).setUint8(pos++, 1 << 5 | value >> 16);
                __privateGet(this, _helperView).setUint8(pos++, value >> 8);
                __privateGet(this, _helperView).setUint8(pos++, value);
                break;
            case 4:
                __privateGet(this, _helperView).setUint8(pos++, 1 << 4 | value >> 24);
                __privateGet(this, _helperView).setUint8(pos++, value >> 16);
                __privateGet(this, _helperView).setUint8(pos++, value >> 8);
                __privateGet(this, _helperView).setUint8(pos++, value);
                break;
            case 5:
                __privateGet(this, _helperView).setUint8(pos++, 1 << 3 | value / __pow(2, 32) & 7);
                __privateGet(this, _helperView).setUint8(pos++, value >> 24);
                __privateGet(this, _helperView).setUint8(pos++, value >> 16);
                __privateGet(this, _helperView).setUint8(pos++, value >> 8);
                __privateGet(this, _helperView).setUint8(pos++, value);
                break;
            case 6:
                __privateGet(this, _helperView).setUint8(pos++, 1 << 2 | value / __pow(2, 40) & 3);
                __privateGet(this, _helperView).setUint8(pos++, value / __pow(2, 32) | 0);
                __privateGet(this, _helperView).setUint8(pos++, value >> 24);
                __privateGet(this, _helperView).setUint8(pos++, value >> 16);
                __privateGet(this, _helperView).setUint8(pos++, value >> 8);
                __privateGet(this, _helperView).setUint8(pos++, value);
                break;
            default:
                throw new Error("Bad EBML VINT size " + width);
        }
        this.write(__privateGet(this, _helper).subarray(0, pos));
    }
    writeEBML(data) {
        var _a, _b;
        if (data === null) return;
        if (data instanceof Uint8Array) {
            this.write(data);
        } else if (Array.isArray(data)) {
            for (let elem of data){
                this.writeEBML(elem);
            }
        } else {
            this.offsets.set(data, this.pos);
            __privateMethod(this, _writeUnsignedInt, writeUnsignedInt_fn).call(this, data.id);
            if (Array.isArray(data.data)) {
                let sizePos = this.pos;
                let sizeSize = data.size === -1 ? 1 : (_a = data.size) != null ? _a : 4;
                if (data.size === -1) {
                    __privateMethod(this, _writeByte, writeByte_fn).call(this, 255);
                } else {
                    this.seek(this.pos + sizeSize);
                }
                let startPos = this.pos;
                this.dataOffsets.set(data, startPos);
                this.writeEBML(data.data);
                if (data.size !== -1) {
                    let size = this.pos - startPos;
                    let endPos = this.pos;
                    this.seek(sizePos);
                    this.writeEBMLVarInt(size, sizeSize);
                    this.seek(endPos);
                }
            } else if (typeof data.data === "number") {
                let size = (_b = data.size) != null ? _b : measureUnsignedInt(data.data);
                this.writeEBMLVarInt(size);
                __privateMethod(this, _writeUnsignedInt, writeUnsignedInt_fn).call(this, data.data, size);
            } else if (typeof data.data === "string") {
                this.writeEBMLVarInt(data.data.length);
                __privateMethod(this, _writeString, writeString_fn).call(this, data.data);
            } else if (data.data instanceof Uint8Array) {
                this.writeEBMLVarInt(data.data.byteLength, data.size);
                this.write(data.data);
            } else if (data.data instanceof EBMLFloat32) {
                this.writeEBMLVarInt(4);
                __privateMethod(this, _writeFloat32, writeFloat32_fn).call(this, data.data.value);
            } else if (data.data instanceof EBMLFloat64) {
                this.writeEBMLVarInt(8);
                __privateMethod(this, _writeFloat64, writeFloat64_fn).call(this, data.data.value);
            }
        }
    }
    constructor(){
        __privateAdd(this, _writeByte);
        __privateAdd(this, _writeFloat32);
        __privateAdd(this, _writeFloat64);
        __privateAdd(this, _writeUnsignedInt);
        __privateAdd(this, _writeString);
        this.pos = 0;
        __privateAdd(this, _helper, new Uint8Array(8));
        __privateAdd(this, _helperView, new DataView(__privateGet(this, _helper).buffer));
        this.offsets = /* @__PURE__ */ new WeakMap();
        this.dataOffsets = /* @__PURE__ */ new WeakMap();
    }
};
_helper = new WeakMap();
_helperView = new WeakMap();
_writeByte = new WeakSet();
writeByte_fn = function(value) {
    __privateGet(this, _helperView).setUint8(0, value);
    this.write(__privateGet(this, _helper).subarray(0, 1));
};
_writeFloat32 = new WeakSet();
writeFloat32_fn = function(value) {
    __privateGet(this, _helperView).setFloat32(0, value, false);
    this.write(__privateGet(this, _helper).subarray(0, 4));
};
_writeFloat64 = new WeakSet();
writeFloat64_fn = function(value) {
    __privateGet(this, _helperView).setFloat64(0, value, false);
    this.write(__privateGet(this, _helper));
};
_writeUnsignedInt = new WeakSet();
writeUnsignedInt_fn = function(value, width) {
    if (width === void 0) width = measureUnsignedInt(value);
    let pos = 0;
    switch(width){
        case 6:
            __privateGet(this, _helperView).setUint8(pos++, value / __pow(2, 40) | 0);
        case 5:
            __privateGet(this, _helperView).setUint8(pos++, value / __pow(2, 32) | 0);
        case 4:
            __privateGet(this, _helperView).setUint8(pos++, value >> 24);
        case 3:
            __privateGet(this, _helperView).setUint8(pos++, value >> 16);
        case 2:
            __privateGet(this, _helperView).setUint8(pos++, value >> 8);
        case 1:
            __privateGet(this, _helperView).setUint8(pos++, value);
            break;
        default:
            throw new Error("Bad UINT size " + width);
    }
    this.write(__privateGet(this, _helper).subarray(0, pos));
};
_writeString = new WeakSet();
writeString_fn = function(str) {
    this.write(new Uint8Array(str.split("").map((x)=>x.charCodeAt(0))));
};
var _target, _buffer, _bytes, _ensureSize, ensureSize_fn;
var ArrayBufferTargetWriter = class extends Writer {
    write(data) {
        __privateMethod(this, _ensureSize, ensureSize_fn).call(this, this.pos + data.byteLength);
        __privateGet(this, _bytes).set(data, this.pos);
        this.pos += data.byteLength;
    }
    finalize() {
        __privateMethod(this, _ensureSize, ensureSize_fn).call(this, this.pos);
        __privateGet(this, _target).buffer = __privateGet(this, _buffer).slice(0, this.pos);
    }
    constructor(target){
        super();
        __privateAdd(this, _ensureSize);
        __privateAdd(this, _target, void 0);
        __privateAdd(this, _buffer, new ArrayBuffer(__pow(2, 16)));
        __privateAdd(this, _bytes, new Uint8Array(__privateGet(this, _buffer)));
        __privateSet(this, _target, target);
    }
};
_target = new WeakMap();
_buffer = new WeakMap();
_bytes = new WeakMap();
_ensureSize = new WeakSet();
ensureSize_fn = function(size) {
    let newLength = __privateGet(this, _buffer).byteLength;
    while(newLength < size)newLength *= 2;
    if (newLength === __privateGet(this, _buffer).byteLength) return;
    let newBuffer = new ArrayBuffer(newLength);
    let newBytes = new Uint8Array(newBuffer);
    newBytes.set(__privateGet(this, _bytes), 0);
    __privateSet(this, _buffer, newBuffer);
    __privateSet(this, _bytes, newBytes);
};
var _target2, _sections, _lastFlushEnd, _ensureMonotonicity;
var StreamTargetWriter = class extends Writer {
    write(data) {
        __privateGet(this, _sections).push({
            data: data.slice(),
            start: this.pos
        });
        this.pos += data.byteLength;
    }
    flush() {
        if (__privateGet(this, _sections).length === 0) return;
        let chunks = [];
        let sorted = [
            ...__privateGet(this, _sections)
        ].sort((a, b)=>a.start - b.start);
        chunks.push({
            start: sorted[0].start,
            size: sorted[0].data.byteLength
        });
        for(let i = 1; i < sorted.length; i++){
            let lastChunk = chunks[chunks.length - 1];
            let section = sorted[i];
            if (section.start <= lastChunk.start + lastChunk.size) {
                lastChunk.size = Math.max(lastChunk.size, section.start + section.data.byteLength - lastChunk.start);
            } else {
                chunks.push({
                    start: section.start,
                    size: section.data.byteLength
                });
            }
        }
        for (let chunk of chunks){
            chunk.data = new Uint8Array(chunk.size);
            for (let section of __privateGet(this, _sections)){
                if (chunk.start <= section.start && section.start < chunk.start + chunk.size) {
                    chunk.data.set(section.data, section.start - chunk.start);
                }
            }
            if (__privateGet(this, _ensureMonotonicity) && chunk.start < __privateGet(this, _lastFlushEnd)) {
                throw new Error("Internal error: Monotonicity violation.");
            }
            __privateGet(this, _target2).onData(chunk.data, chunk.start);
            __privateSet(this, _lastFlushEnd, chunk.start + chunk.data.byteLength);
        }
        __privateGet(this, _sections).length = 0;
    }
    finalize() {
        var _a, _b;
        (_b = (_a = __privateGet(this, _target2)).onDone) == null ? void 0 : _b.call(_a);
    }
    constructor(target, ensureMonotonicity){
        super();
        __privateAdd(this, _target2, void 0);
        __privateAdd(this, _sections, []);
        __privateAdd(this, _lastFlushEnd, 0);
        __privateAdd(this, _ensureMonotonicity, void 0);
        __privateSet(this, _target2, target);
        __privateSet(this, _ensureMonotonicity, ensureMonotonicity);
    }
};
_target2 = new WeakMap();
_sections = new WeakMap();
_lastFlushEnd = new WeakMap();
_ensureMonotonicity = new WeakMap();
var DEFAULT_CHUNK_SIZE = __pow(2, 24);
var MAX_CHUNKS_AT_ONCE = 2;
var _target3, _chunkSize, _chunks, _lastFlushEnd2, _ensureMonotonicity2, _writeDataIntoChunks, writeDataIntoChunks_fn, _insertSectionIntoChunk, insertSectionIntoChunk_fn, _createChunk, createChunk_fn, _flushChunks, flushChunks_fn;
var ChunkedStreamTargetWriter = class extends Writer {
    write(data) {
        __privateMethod(this, _writeDataIntoChunks, writeDataIntoChunks_fn).call(this, data, this.pos);
        __privateMethod(this, _flushChunks, flushChunks_fn).call(this);
        this.pos += data.byteLength;
    }
    finalize() {
        var _a, _b;
        __privateMethod(this, _flushChunks, flushChunks_fn).call(this, true);
        (_b = (_a = __privateGet(this, _target3)).onDone) == null ? void 0 : _b.call(_a);
    }
    constructor(target, ensureMonotonicity){
        var _a, _b;
        super();
        __privateAdd(this, _writeDataIntoChunks);
        __privateAdd(this, _insertSectionIntoChunk);
        __privateAdd(this, _createChunk);
        __privateAdd(this, _flushChunks);
        __privateAdd(this, _target3, void 0);
        __privateAdd(this, _chunkSize, void 0);
        __privateAdd(this, _chunks, []);
        __privateAdd(this, _lastFlushEnd2, 0);
        __privateAdd(this, _ensureMonotonicity2, void 0);
        __privateSet(this, _target3, target);
        __privateSet(this, _chunkSize, (_b = (_a = target.options) == null ? void 0 : _a.chunkSize) != null ? _b : DEFAULT_CHUNK_SIZE);
        __privateSet(this, _ensureMonotonicity2, ensureMonotonicity);
        if (!Number.isInteger(__privateGet(this, _chunkSize)) || __privateGet(this, _chunkSize) < __pow(2, 10)) {
            throw new Error("Invalid StreamTarget options: chunkSize must be an integer not smaller than 1024.");
        }
    }
};
_target3 = new WeakMap();
_chunkSize = new WeakMap();
_chunks = new WeakMap();
_lastFlushEnd2 = new WeakMap();
_ensureMonotonicity2 = new WeakMap();
_writeDataIntoChunks = new WeakSet();
writeDataIntoChunks_fn = function(data, position) {
    let chunkIndex = __privateGet(this, _chunks).findIndex((x)=>x.start <= position && position < x.start + __privateGet(this, _chunkSize));
    if (chunkIndex === -1) chunkIndex = __privateMethod(this, _createChunk, createChunk_fn).call(this, position);
    let chunk = __privateGet(this, _chunks)[chunkIndex];
    let relativePosition = position - chunk.start;
    let toWrite = data.subarray(0, Math.min(__privateGet(this, _chunkSize) - relativePosition, data.byteLength));
    chunk.data.set(toWrite, relativePosition);
    let section = {
        start: relativePosition,
        end: relativePosition + toWrite.byteLength
    };
    __privateMethod(this, _insertSectionIntoChunk, insertSectionIntoChunk_fn).call(this, chunk, section);
    if (chunk.written[0].start === 0 && chunk.written[0].end === __privateGet(this, _chunkSize)) {
        chunk.shouldFlush = true;
    }
    if (__privateGet(this, _chunks).length > MAX_CHUNKS_AT_ONCE) {
        for(let i = 0; i < __privateGet(this, _chunks).length - 1; i++){
            __privateGet(this, _chunks)[i].shouldFlush = true;
        }
        __privateMethod(this, _flushChunks, flushChunks_fn).call(this);
    }
    if (toWrite.byteLength < data.byteLength) {
        __privateMethod(this, _writeDataIntoChunks, writeDataIntoChunks_fn).call(this, data.subarray(toWrite.byteLength), position + toWrite.byteLength);
    }
};
_insertSectionIntoChunk = new WeakSet();
insertSectionIntoChunk_fn = function(chunk, section) {
    let low = 0;
    let high = chunk.written.length - 1;
    let index = -1;
    while(low <= high){
        let mid = Math.floor(low + (high - low + 1) / 2);
        if (chunk.written[mid].start <= section.start) {
            low = mid + 1;
            index = mid;
        } else {
            high = mid - 1;
        }
    }
    chunk.written.splice(index + 1, 0, section);
    if (index === -1 || chunk.written[index].end < section.start) index++;
    while(index < chunk.written.length - 1 && chunk.written[index].end >= chunk.written[index + 1].start){
        chunk.written[index].end = Math.max(chunk.written[index].end, chunk.written[index + 1].end);
        chunk.written.splice(index + 1, 1);
    }
};
_createChunk = new WeakSet();
createChunk_fn = function(includesPosition) {
    let start = Math.floor(includesPosition / __privateGet(this, _chunkSize)) * __privateGet(this, _chunkSize);
    let chunk = {
        start,
        data: new Uint8Array(__privateGet(this, _chunkSize)),
        written: [],
        shouldFlush: false
    };
    __privateGet(this, _chunks).push(chunk);
    __privateGet(this, _chunks).sort((a, b)=>a.start - b.start);
    return __privateGet(this, _chunks).indexOf(chunk);
};
_flushChunks = new WeakSet();
flushChunks_fn = function(force) {
    if (force === void 0) force = false;
    for(let i = 0; i < __privateGet(this, _chunks).length; i++){
        let chunk = __privateGet(this, _chunks)[i];
        if (!chunk.shouldFlush && !force) continue;
        for (let section of chunk.written){
            if (__privateGet(this, _ensureMonotonicity2) && chunk.start + section.start < __privateGet(this, _lastFlushEnd2)) {
                throw new Error("Internal error: Monotonicity violation.");
            }
            __privateGet(this, _target3).onData(chunk.data.subarray(section.start, section.end), chunk.start + section.start);
            __privateSet(this, _lastFlushEnd2, chunk.start + section.end);
        }
        __privateGet(this, _chunks).splice(i--, 1);
    }
};
var FileSystemWritableFileStreamTargetWriter = class extends ChunkedStreamTargetWriter {
    constructor(target, ensureMonotonicity){
        var _a;
        super(new StreamTarget((data, position)=>target.stream.write({
                type: "write",
                data,
                position
            }), void 0, {
            chunkSize: (_a = target.options) == null ? void 0 : _a.chunkSize
        }), ensureMonotonicity);
    }
};
// src/muxer.ts
var VIDEO_TRACK_NUMBER = 1;
var AUDIO_TRACK_NUMBER = 2;
var VIDEO_TRACK_TYPE = 1;
var AUDIO_TRACK_TYPE = 2;
var MAX_CHUNK_LENGTH_MS = __pow(2, 15);
var CODEC_PRIVATE_MAX_SIZE = __pow(2, 12);
var APP_NAME = "https://github.com/Vanilagy/webm-muxer";
var SEGMENT_SIZE_BYTES = 6;
var CLUSTER_SIZE_BYTES = 5;
var FIRST_TIMESTAMP_BEHAVIORS = [
    "strict",
    "offset",
    "permissive"
];
var _options, _writer, _segment, _segmentInfo, _seekHead, _tracksElement, _segmentDuration, _colourElement, _videoCodecPrivate, _audioCodecPrivate, _cues, _currentCluster, _currentClusterTimestamp, _duration, _videoChunkQueue, _audioChunkQueue, _firstVideoTimestamp, _firstAudioTimestamp, _lastVideoTimestamp, _lastAudioTimestamp, _colorSpace, _finalized, _validateOptions, validateOptions_fn, _createFileHeader, createFileHeader_fn, _writeEBMLHeader, writeEBMLHeader_fn, _createCodecPrivatePlaceholders, createCodecPrivatePlaceholders_fn, _createColourElement, createColourElement_fn, _createSeekHead, createSeekHead_fn, _createSegmentInfo, createSegmentInfo_fn, _createTracks, createTracks_fn, _createSegment, createSegment_fn, _createCues, createCues_fn, _maybeFlushStreamingTargetWriter, maybeFlushStreamingTargetWriter_fn, _segmentDataOffset, segmentDataOffset_get, _writeVideoDecoderConfig, writeVideoDecoderConfig_fn, _fixVP9ColorSpace, fixVP9ColorSpace_fn, _createInternalChunk, createInternalChunk_fn, _validateTimestamp, validateTimestamp_fn, _writeSimpleBlock, writeSimpleBlock_fn, _createCodecPrivateElement, createCodecPrivateElement_fn, _writeCodecPrivate, writeCodecPrivate_fn, _createNewCluster, createNewCluster_fn, _finalizeCurrentCluster, finalizeCurrentCluster_fn, _ensureNotFinalized, ensureNotFinalized_fn;
var Muxer = class {
    addVideoChunk(chunk, meta, timestamp) {
        let data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        this.addVideoChunkRaw(data, chunk.type, timestamp != null ? timestamp : chunk.timestamp, meta);
    }
    addVideoChunkRaw(data, type, timestamp, meta) {
        __privateMethod(this, _ensureNotFinalized, ensureNotFinalized_fn).call(this);
        if (!__privateGet(this, _options).video) throw new Error("No video track declared.");
        if (__privateGet(this, _firstVideoTimestamp) === void 0) __privateSet(this, _firstVideoTimestamp, timestamp);
        if (meta) __privateMethod(this, _writeVideoDecoderConfig, writeVideoDecoderConfig_fn).call(this, meta);
        let internalChunk = __privateMethod(this, _createInternalChunk, createInternalChunk_fn).call(this, data, type, timestamp, VIDEO_TRACK_NUMBER);
        if (__privateGet(this, _options).video.codec === "V_VP9") __privateMethod(this, _fixVP9ColorSpace, fixVP9ColorSpace_fn).call(this, internalChunk);
        __privateSet(this, _lastVideoTimestamp, internalChunk.timestamp);
        while(__privateGet(this, _audioChunkQueue).length > 0 && __privateGet(this, _audioChunkQueue)[0].timestamp <= internalChunk.timestamp){
            let audioChunk = __privateGet(this, _audioChunkQueue).shift();
            __privateMethod(this, _writeSimpleBlock, writeSimpleBlock_fn).call(this, audioChunk);
        }
        if (!__privateGet(this, _options).audio || internalChunk.timestamp <= __privateGet(this, _lastAudioTimestamp)) {
            __privateMethod(this, _writeSimpleBlock, writeSimpleBlock_fn).call(this, internalChunk);
        } else {
            __privateGet(this, _videoChunkQueue).push(internalChunk);
        }
        __privateMethod(this, _maybeFlushStreamingTargetWriter, maybeFlushStreamingTargetWriter_fn).call(this);
    }
    addAudioChunk(chunk, meta, timestamp) {
        let data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        this.addAudioChunkRaw(data, chunk.type, timestamp != null ? timestamp : chunk.timestamp, meta);
    }
    addAudioChunkRaw(data, type, timestamp, meta) {
        __privateMethod(this, _ensureNotFinalized, ensureNotFinalized_fn).call(this);
        if (!__privateGet(this, _options).audio) throw new Error("No audio track declared.");
        if (__privateGet(this, _firstAudioTimestamp) === void 0) __privateSet(this, _firstAudioTimestamp, timestamp);
        if (meta == null ? void 0 : meta.decoderConfig) {
            if (__privateGet(this, _options).streaming) {
                __privateSet(this, _audioCodecPrivate, __privateMethod(this, _createCodecPrivateElement, createCodecPrivateElement_fn).call(this, meta.decoderConfig.description));
            } else {
                __privateMethod(this, _writeCodecPrivate, writeCodecPrivate_fn).call(this, __privateGet(this, _audioCodecPrivate), meta.decoderConfig.description);
            }
        }
        let internalChunk = __privateMethod(this, _createInternalChunk, createInternalChunk_fn).call(this, data, type, timestamp, AUDIO_TRACK_NUMBER);
        __privateSet(this, _lastAudioTimestamp, internalChunk.timestamp);
        while(__privateGet(this, _videoChunkQueue).length > 0 && __privateGet(this, _videoChunkQueue)[0].timestamp <= internalChunk.timestamp){
            let videoChunk = __privateGet(this, _videoChunkQueue).shift();
            __privateMethod(this, _writeSimpleBlock, writeSimpleBlock_fn).call(this, videoChunk);
        }
        if (!__privateGet(this, _options).video || internalChunk.timestamp <= __privateGet(this, _lastVideoTimestamp)) {
            __privateMethod(this, _writeSimpleBlock, writeSimpleBlock_fn).call(this, internalChunk);
        } else {
            __privateGet(this, _audioChunkQueue).push(internalChunk);
        }
        __privateMethod(this, _maybeFlushStreamingTargetWriter, maybeFlushStreamingTargetWriter_fn).call(this);
    }
    finalize() {
        while(__privateGet(this, _videoChunkQueue).length > 0)__privateMethod(this, _writeSimpleBlock, writeSimpleBlock_fn).call(this, __privateGet(this, _videoChunkQueue).shift());
        while(__privateGet(this, _audioChunkQueue).length > 0)__privateMethod(this, _writeSimpleBlock, writeSimpleBlock_fn).call(this, __privateGet(this, _audioChunkQueue).shift());
        if (!__privateGet(this, _options).streaming) {
            __privateMethod(this, _finalizeCurrentCluster, finalizeCurrentCluster_fn).call(this);
        }
        __privateGet(this, _writer).writeEBML(__privateGet(this, _cues));
        if (!__privateGet(this, _options).streaming) {
            let endPos = __privateGet(this, _writer).pos;
            let segmentSize = __privateGet(this, _writer).pos - __privateGet(this, _segmentDataOffset, segmentDataOffset_get);
            __privateGet(this, _writer).seek(__privateGet(this, _writer).offsets.get(__privateGet(this, _segment)) + 4);
            __privateGet(this, _writer).writeEBMLVarInt(segmentSize, SEGMENT_SIZE_BYTES);
            __privateGet(this, _segmentDuration).data = new EBMLFloat64(__privateGet(this, _duration));
            __privateGet(this, _writer).seek(__privateGet(this, _writer).offsets.get(__privateGet(this, _segmentDuration)));
            __privateGet(this, _writer).writeEBML(__privateGet(this, _segmentDuration));
            __privateGet(this, _seekHead).data[0].data[1].data = __privateGet(this, _writer).offsets.get(__privateGet(this, _cues)) - __privateGet(this, _segmentDataOffset, segmentDataOffset_get);
            __privateGet(this, _seekHead).data[1].data[1].data = __privateGet(this, _writer).offsets.get(__privateGet(this, _segmentInfo)) - __privateGet(this, _segmentDataOffset, segmentDataOffset_get);
            __privateGet(this, _seekHead).data[2].data[1].data = __privateGet(this, _writer).offsets.get(__privateGet(this, _tracksElement)) - __privateGet(this, _segmentDataOffset, segmentDataOffset_get);
            __privateGet(this, _writer).seek(__privateGet(this, _writer).offsets.get(__privateGet(this, _seekHead)));
            __privateGet(this, _writer).writeEBML(__privateGet(this, _seekHead));
            __privateGet(this, _writer).seek(endPos);
        }
        __privateMethod(this, _maybeFlushStreamingTargetWriter, maybeFlushStreamingTargetWriter_fn).call(this);
        __privateGet(this, _writer).finalize();
        __privateSet(this, _finalized, true);
    }
    constructor(options){
        __privateAdd(this, _validateOptions);
        __privateAdd(this, _createFileHeader);
        __privateAdd(this, _writeEBMLHeader);
        __privateAdd(this, _createCodecPrivatePlaceholders);
        __privateAdd(this, _createColourElement);
        __privateAdd(this, _createSeekHead);
        __privateAdd(this, _createSegmentInfo);
        __privateAdd(this, _createTracks);
        __privateAdd(this, _createSegment);
        __privateAdd(this, _createCues);
        __privateAdd(this, _maybeFlushStreamingTargetWriter);
        __privateAdd(this, _segmentDataOffset);
        __privateAdd(this, _writeVideoDecoderConfig);
        __privateAdd(this, _fixVP9ColorSpace);
        __privateAdd(this, _createInternalChunk);
        __privateAdd(this, _validateTimestamp);
        __privateAdd(this, _writeSimpleBlock);
        __privateAdd(this, _createCodecPrivateElement);
        __privateAdd(this, _writeCodecPrivate);
        __privateAdd(this, _createNewCluster);
        __privateAdd(this, _finalizeCurrentCluster);
        __privateAdd(this, _ensureNotFinalized);
        __privateAdd(this, _options, void 0);
        __privateAdd(this, _writer, void 0);
        __privateAdd(this, _segment, void 0);
        __privateAdd(this, _segmentInfo, void 0);
        __privateAdd(this, _seekHead, void 0);
        __privateAdd(this, _tracksElement, void 0);
        __privateAdd(this, _segmentDuration, void 0);
        __privateAdd(this, _colourElement, void 0);
        __privateAdd(this, _videoCodecPrivate, void 0);
        __privateAdd(this, _audioCodecPrivate, void 0);
        __privateAdd(this, _cues, void 0);
        __privateAdd(this, _currentCluster, void 0);
        __privateAdd(this, _currentClusterTimestamp, void 0);
        __privateAdd(this, _duration, 0);
        __privateAdd(this, _videoChunkQueue, []);
        __privateAdd(this, _audioChunkQueue, []);
        __privateAdd(this, _firstVideoTimestamp, void 0);
        __privateAdd(this, _firstAudioTimestamp, void 0);
        __privateAdd(this, _lastVideoTimestamp, -1);
        __privateAdd(this, _lastAudioTimestamp, -1);
        __privateAdd(this, _colorSpace, void 0);
        __privateAdd(this, _finalized, false);
        var _a;
        __privateMethod(this, _validateOptions, validateOptions_fn).call(this, options);
        __privateSet(this, _options, __spreadValues({
            type: "webm",
            firstTimestampBehavior: "strict"
        }, options));
        this.target = options.target;
        let ensureMonotonicity = !!__privateGet(this, _options).streaming;
        if (options.target instanceof ArrayBufferTarget) {
            __privateSet(this, _writer, new ArrayBufferTargetWriter(options.target));
        } else if (options.target instanceof StreamTarget) {
            __privateSet(this, _writer, ((_a = options.target.options) == null ? void 0 : _a.chunked) ? new ChunkedStreamTargetWriter(options.target, ensureMonotonicity) : new StreamTargetWriter(options.target, ensureMonotonicity));
        } else if (options.target instanceof FileSystemWritableFileStreamTarget) {
            __privateSet(this, _writer, new FileSystemWritableFileStreamTargetWriter(options.target, ensureMonotonicity));
        } else {
            throw new Error(`Invalid target: ${options.target}`);
        }
        __privateMethod(this, _createFileHeader, createFileHeader_fn).call(this);
    }
};
_options = new WeakMap();
_writer = new WeakMap();
_segment = new WeakMap();
_segmentInfo = new WeakMap();
_seekHead = new WeakMap();
_tracksElement = new WeakMap();
_segmentDuration = new WeakMap();
_colourElement = new WeakMap();
_videoCodecPrivate = new WeakMap();
_audioCodecPrivate = new WeakMap();
_cues = new WeakMap();
_currentCluster = new WeakMap();
_currentClusterTimestamp = new WeakMap();
_duration = new WeakMap();
_videoChunkQueue = new WeakMap();
_audioChunkQueue = new WeakMap();
_firstVideoTimestamp = new WeakMap();
_firstAudioTimestamp = new WeakMap();
_lastVideoTimestamp = new WeakMap();
_lastAudioTimestamp = new WeakMap();
_colorSpace = new WeakMap();
_finalized = new WeakMap();
_validateOptions = new WeakSet();
validateOptions_fn = function(options) {
    if (options.type && options.type !== "webm" && options.type !== "matroska") {
        throw new Error(`Invalid type: ${options.type}`);
    }
    if (options.firstTimestampBehavior && !FIRST_TIMESTAMP_BEHAVIORS.includes(options.firstTimestampBehavior)) {
        throw new Error(`Invalid first timestamp behavior: ${options.firstTimestampBehavior}`);
    }
};
_createFileHeader = new WeakSet();
createFileHeader_fn = function() {
    __privateMethod(this, _writeEBMLHeader, writeEBMLHeader_fn).call(this);
    if (!__privateGet(this, _options).streaming) {
        __privateMethod(this, _createSeekHead, createSeekHead_fn).call(this);
    }
    __privateMethod(this, _createSegmentInfo, createSegmentInfo_fn).call(this);
    __privateMethod(this, _createCodecPrivatePlaceholders, createCodecPrivatePlaceholders_fn).call(this);
    __privateMethod(this, _createColourElement, createColourElement_fn).call(this);
    if (!__privateGet(this, _options).streaming) {
        __privateMethod(this, _createTracks, createTracks_fn).call(this);
        __privateMethod(this, _createSegment, createSegment_fn).call(this);
    }
    __privateMethod(this, _createCues, createCues_fn).call(this);
    __privateMethod(this, _maybeFlushStreamingTargetWriter, maybeFlushStreamingTargetWriter_fn).call(this);
};
_writeEBMLHeader = new WeakSet();
writeEBMLHeader_fn = function() {
    var _a;
    let ebmlHeader = {
        id: 440786851 /* EBML */ ,
        data: [
            {
                id: 17030 /* EBMLVersion */ ,
                data: 1
            },
            {
                id: 17143 /* EBMLReadVersion */ ,
                data: 1
            },
            {
                id: 17138 /* EBMLMaxIDLength */ ,
                data: 4
            },
            {
                id: 17139 /* EBMLMaxSizeLength */ ,
                data: 8
            },
            {
                id: 17026 /* DocType */ ,
                data: (_a = __privateGet(this, _options).type) != null ? _a : "webm"
            },
            {
                id: 17031 /* DocTypeVersion */ ,
                data: 2
            },
            {
                id: 17029 /* DocTypeReadVersion */ ,
                data: 2
            }
        ]
    };
    __privateGet(this, _writer).writeEBML(ebmlHeader);
};
_createCodecPrivatePlaceholders = new WeakSet();
createCodecPrivatePlaceholders_fn = function() {
    __privateSet(this, _videoCodecPrivate, {
        id: 236 /* Void */ ,
        size: 4,
        data: new Uint8Array(CODEC_PRIVATE_MAX_SIZE)
    });
    __privateSet(this, _audioCodecPrivate, {
        id: 236 /* Void */ ,
        size: 4,
        data: new Uint8Array(CODEC_PRIVATE_MAX_SIZE)
    });
};
_createColourElement = new WeakSet();
createColourElement_fn = function() {
    __privateSet(this, _colourElement, {
        id: 21936 /* Colour */ ,
        data: [
            {
                id: 21937 /* MatrixCoefficients */ ,
                data: 2
            },
            {
                id: 21946 /* TransferCharacteristics */ ,
                data: 2
            },
            {
                id: 21947 /* Primaries */ ,
                data: 2
            },
            {
                id: 21945 /* Range */ ,
                data: 0
            }
        ]
    });
};
_createSeekHead = new WeakSet();
createSeekHead_fn = function() {
    const kaxCues = new Uint8Array([
        28,
        83,
        187,
        107
    ]);
    const kaxInfo = new Uint8Array([
        21,
        73,
        169,
        102
    ]);
    const kaxTracks = new Uint8Array([
        22,
        84,
        174,
        107
    ]);
    let seekHead = {
        id: 290298740 /* SeekHead */ ,
        data: [
            {
                id: 19899 /* Seek */ ,
                data: [
                    {
                        id: 21419 /* SeekID */ ,
                        data: kaxCues
                    },
                    {
                        id: 21420 /* SeekPosition */ ,
                        size: 5,
                        data: 0
                    }
                ]
            },
            {
                id: 19899 /* Seek */ ,
                data: [
                    {
                        id: 21419 /* SeekID */ ,
                        data: kaxInfo
                    },
                    {
                        id: 21420 /* SeekPosition */ ,
                        size: 5,
                        data: 0
                    }
                ]
            },
            {
                id: 19899 /* Seek */ ,
                data: [
                    {
                        id: 21419 /* SeekID */ ,
                        data: kaxTracks
                    },
                    {
                        id: 21420 /* SeekPosition */ ,
                        size: 5,
                        data: 0
                    }
                ]
            }
        ]
    };
    __privateSet(this, _seekHead, seekHead);
};
_createSegmentInfo = new WeakSet();
createSegmentInfo_fn = function() {
    let segmentDuration = {
        id: 17545 /* Duration */ ,
        data: new EBMLFloat64(0)
    };
    __privateSet(this, _segmentDuration, segmentDuration);
    let segmentInfo = {
        id: 357149030 /* Info */ ,
        data: [
            {
                id: 2807729 /* TimestampScale */ ,
                data: 1e6
            },
            {
                id: 19840 /* MuxingApp */ ,
                data: APP_NAME
            },
            {
                id: 22337 /* WritingApp */ ,
                data: APP_NAME
            },
            !__privateGet(this, _options).streaming ? segmentDuration : null
        ]
    };
    __privateSet(this, _segmentInfo, segmentInfo);
};
_createTracks = new WeakSet();
createTracks_fn = function() {
    let tracksElement = {
        id: 374648427 /* Tracks */ ,
        data: []
    };
    __privateSet(this, _tracksElement, tracksElement);
    if (__privateGet(this, _options).video) {
        tracksElement.data.push({
            id: 174 /* TrackEntry */ ,
            data: [
                {
                    id: 215 /* TrackNumber */ ,
                    data: VIDEO_TRACK_NUMBER
                },
                {
                    id: 29637 /* TrackUID */ ,
                    data: VIDEO_TRACK_NUMBER
                },
                {
                    id: 131 /* TrackType */ ,
                    data: VIDEO_TRACK_TYPE
                },
                {
                    id: 134 /* CodecID */ ,
                    data: __privateGet(this, _options).video.codec
                },
                __privateGet(this, _videoCodecPrivate),
                __privateGet(this, _options).video.frameRate ? {
                    id: 2352003 /* DefaultDuration */ ,
                    data: 1e9 / __privateGet(this, _options).video.frameRate
                } : null,
                {
                    id: 224 /* Video */ ,
                    data: [
                        {
                            id: 176 /* PixelWidth */ ,
                            data: __privateGet(this, _options).video.width
                        },
                        {
                            id: 186 /* PixelHeight */ ,
                            data: __privateGet(this, _options).video.height
                        },
                        __privateGet(this, _options).video.alpha ? {
                            id: 21440 /* AlphaMode */ ,
                            data: 1
                        } : null,
                        __privateGet(this, _colourElement)
                    ]
                }
            ]
        });
    }
    if (__privateGet(this, _options).audio) {
        __privateSet(this, _audioCodecPrivate, __privateGet(this, _options).streaming ? __privateGet(this, _audioCodecPrivate) || null : {
            id: 236 /* Void */ ,
            size: 4,
            data: new Uint8Array(CODEC_PRIVATE_MAX_SIZE)
        });
        tracksElement.data.push({
            id: 174 /* TrackEntry */ ,
            data: [
                {
                    id: 215 /* TrackNumber */ ,
                    data: AUDIO_TRACK_NUMBER
                },
                {
                    id: 29637 /* TrackUID */ ,
                    data: AUDIO_TRACK_NUMBER
                },
                {
                    id: 131 /* TrackType */ ,
                    data: AUDIO_TRACK_TYPE
                },
                {
                    id: 134 /* CodecID */ ,
                    data: __privateGet(this, _options).audio.codec
                },
                __privateGet(this, _audioCodecPrivate),
                {
                    id: 225 /* Audio */ ,
                    data: [
                        {
                            id: 181 /* SamplingFrequency */ ,
                            data: new EBMLFloat32(__privateGet(this, _options).audio.sampleRate)
                        },
                        {
                            id: 159 /* Channels */ ,
                            data: __privateGet(this, _options).audio.numberOfChannels
                        },
                        __privateGet(this, _options).audio.bitDepth ? {
                            id: 25188 /* BitDepth */ ,
                            data: __privateGet(this, _options).audio.bitDepth
                        } : null
                    ]
                }
            ]
        });
    }
};
_createSegment = new WeakSet();
createSegment_fn = function() {
    let segment = {
        id: 408125543 /* Segment */ ,
        size: __privateGet(this, _options).streaming ? -1 : SEGMENT_SIZE_BYTES,
        data: [
            !__privateGet(this, _options).streaming ? __privateGet(this, _seekHead) : null,
            __privateGet(this, _segmentInfo),
            __privateGet(this, _tracksElement)
        ]
    };
    __privateSet(this, _segment, segment);
    __privateGet(this, _writer).writeEBML(segment);
};
_createCues = new WeakSet();
createCues_fn = function() {
    __privateSet(this, _cues, {
        id: 475249515 /* Cues */ ,
        data: []
    });
};
_maybeFlushStreamingTargetWriter = new WeakSet();
maybeFlushStreamingTargetWriter_fn = function() {
    if (__privateGet(this, _writer) instanceof StreamTargetWriter) {
        __privateGet(this, _writer).flush();
    }
};
_segmentDataOffset = new WeakSet();
segmentDataOffset_get = function() {
    return __privateGet(this, _writer).dataOffsets.get(__privateGet(this, _segment));
};
_writeVideoDecoderConfig = new WeakSet();
writeVideoDecoderConfig_fn = function(meta) {
    if (!meta.decoderConfig) return;
    if (meta.decoderConfig.colorSpace) {
        let colorSpace = meta.decoderConfig.colorSpace;
        __privateSet(this, _colorSpace, colorSpace);
        __privateGet(this, _colourElement).data = [
            {
                id: 21937 /* MatrixCoefficients */ ,
                data: {
                    "rgb": 1,
                    "bt709": 1,
                    "bt470bg": 5,
                    "smpte170m": 6
                }[colorSpace.matrix]
            },
            {
                id: 21946 /* TransferCharacteristics */ ,
                data: {
                    "bt709": 1,
                    "smpte170m": 6,
                    "iec61966-2-1": 13
                }[colorSpace.transfer]
            },
            {
                id: 21947 /* Primaries */ ,
                data: {
                    "bt709": 1,
                    "bt470bg": 5,
                    "smpte170m": 6
                }[colorSpace.primaries]
            },
            {
                id: 21945 /* Range */ ,
                data: [
                    1,
                    2
                ][Number(colorSpace.fullRange)]
            }
        ];
        if (!__privateGet(this, _options).streaming) {
            let endPos = __privateGet(this, _writer).pos;
            __privateGet(this, _writer).seek(__privateGet(this, _writer).offsets.get(__privateGet(this, _colourElement)));
            __privateGet(this, _writer).writeEBML(__privateGet(this, _colourElement));
            __privateGet(this, _writer).seek(endPos);
        }
    }
    if (meta.decoderConfig.description) {
        if (__privateGet(this, _options).streaming) {
            __privateSet(this, _videoCodecPrivate, __privateMethod(this, _createCodecPrivateElement, createCodecPrivateElement_fn).call(this, meta.decoderConfig.description));
        } else {
            __privateMethod(this, _writeCodecPrivate, writeCodecPrivate_fn).call(this, __privateGet(this, _videoCodecPrivate), meta.decoderConfig.description);
        }
    }
};
_fixVP9ColorSpace = new WeakSet();
fixVP9ColorSpace_fn = function(chunk) {
    if (chunk.type !== "key") return;
    if (!__privateGet(this, _colorSpace)) return;
    let i = 0;
    if (readBits(chunk.data, 0, 2) !== 2) return;
    i += 2;
    let profile = (readBits(chunk.data, i + 1, i + 2) << 1) + readBits(chunk.data, i + 0, i + 1);
    i += 2;
    if (profile === 3) i++;
    let showExistingFrame = readBits(chunk.data, i + 0, i + 1);
    i++;
    if (showExistingFrame) return;
    let frameType = readBits(chunk.data, i + 0, i + 1);
    i++;
    if (frameType !== 0) return;
    i += 2;
    let syncCode = readBits(chunk.data, i + 0, i + 24);
    i += 24;
    if (syncCode !== 4817730) return;
    if (profile >= 2) i++;
    let colorSpaceID = {
        "rgb": 7,
        "bt709": 2,
        "bt470bg": 1,
        "smpte170m": 3
    }[__privateGet(this, _colorSpace).matrix];
    writeBits(chunk.data, i + 0, i + 3, colorSpaceID);
};
_createInternalChunk = new WeakSet();
createInternalChunk_fn = function(data, type, timestamp, trackNumber) {
    let adjustedTimestamp = __privateMethod(this, _validateTimestamp, validateTimestamp_fn).call(this, timestamp, trackNumber);
    let internalChunk = {
        data,
        type,
        timestamp: adjustedTimestamp,
        trackNumber
    };
    return internalChunk;
};
_validateTimestamp = new WeakSet();
validateTimestamp_fn = function(timestamp, trackNumber) {
    let firstTimestamp = trackNumber === VIDEO_TRACK_NUMBER ? __privateGet(this, _firstVideoTimestamp) : __privateGet(this, _firstAudioTimestamp);
    let lastTimestamp = trackNumber === VIDEO_TRACK_NUMBER ? __privateGet(this, _lastVideoTimestamp) : __privateGet(this, _lastAudioTimestamp);
    if (__privateGet(this, _options).firstTimestampBehavior === "strict" && lastTimestamp === -1 && timestamp !== 0) {
        throw new Error(`The first chunk for your media track must have a timestamp of 0 (received ${timestamp}). Non-zero first timestamps are often caused by directly piping frames or audio data from a MediaStreamTrack into the encoder. Their timestamps are typically relative to the age of the document, which is probably what you want.

If you want to offset all timestamps of a track such that the first one is zero, set firstTimestampBehavior: 'offset' in the options.
If you want to allow non-zero first timestamps, set firstTimestampBehavior: 'permissive'.
`);
    } else if (__privateGet(this, _options).firstTimestampBehavior === "offset") {
        timestamp -= firstTimestamp;
    }
    if (timestamp < lastTimestamp) {
        throw new Error(`Timestamps must be monotonically increasing (went from ${lastTimestamp} to ${timestamp}).`);
    }
    return timestamp;
};
_writeSimpleBlock = new WeakSet();
writeSimpleBlock_fn = function(chunk) {
    if (__privateGet(this, _options).streaming && !__privateGet(this, _tracksElement)) {
        __privateMethod(this, _createTracks, createTracks_fn).call(this);
        __privateMethod(this, _createSegment, createSegment_fn).call(this);
    }
    let msTime = Math.floor(chunk.timestamp / 1e3);
    let clusterIsTooLong = chunk.type !== "key" && msTime - __privateGet(this, _currentClusterTimestamp) >= MAX_CHUNK_LENGTH_MS;
    if (clusterIsTooLong) {
        throw new Error(`Current Matroska cluster exceeded its maximum allowed length of ${MAX_CHUNK_LENGTH_MS} milliseconds. In order to produce a correct WebM file, you must pass in a video key frame at least every ${MAX_CHUNK_LENGTH_MS} milliseconds.`);
    }
    let shouldCreateNewClusterFromKeyFrame = (chunk.trackNumber === VIDEO_TRACK_NUMBER || !__privateGet(this, _options).video) && chunk.type === "key" && msTime - __privateGet(this, _currentClusterTimestamp) >= 1e3;
    if (!__privateGet(this, _currentCluster) || shouldCreateNewClusterFromKeyFrame) {
        __privateMethod(this, _createNewCluster, createNewCluster_fn).call(this, msTime);
    }
    let prelude = new Uint8Array(4);
    let view = new DataView(prelude.buffer);
    view.setUint8(0, 128 | chunk.trackNumber);
    view.setUint16(1, msTime - __privateGet(this, _currentClusterTimestamp), false);
    view.setUint8(3, Number(chunk.type === "key") << 7);
    let simpleBlock = {
        id: 163 /* SimpleBlock */ ,
        data: [
            prelude,
            chunk.data
        ]
    };
    __privateGet(this, _writer).writeEBML(simpleBlock);
    __privateSet(this, _duration, Math.max(__privateGet(this, _duration), msTime));
};
_createCodecPrivateElement = new WeakSet();
createCodecPrivateElement_fn = function(data) {
    return {
        id: 25506 /* CodecPrivate */ ,
        size: 4,
        data: new Uint8Array(data)
    };
};
_writeCodecPrivate = new WeakSet();
writeCodecPrivate_fn = function(element, data) {
    let endPos = __privateGet(this, _writer).pos;
    __privateGet(this, _writer).seek(__privateGet(this, _writer).offsets.get(element));
    element = [
        __privateMethod(this, _createCodecPrivateElement, createCodecPrivateElement_fn).call(this, data),
        {
            id: 236 /* Void */ ,
            size: 4,
            data: new Uint8Array(CODEC_PRIVATE_MAX_SIZE - 2 - 4 - data.byteLength)
        }
    ];
    __privateGet(this, _writer).writeEBML(element);
    __privateGet(this, _writer).seek(endPos);
};
_createNewCluster = new WeakSet();
createNewCluster_fn = function(timestamp) {
    if (__privateGet(this, _currentCluster) && !__privateGet(this, _options).streaming) {
        __privateMethod(this, _finalizeCurrentCluster, finalizeCurrentCluster_fn).call(this);
    }
    __privateSet(this, _currentCluster, {
        id: 524531317 /* Cluster */ ,
        size: __privateGet(this, _options).streaming ? -1 : CLUSTER_SIZE_BYTES,
        data: [
            {
                id: 231 /* Timestamp */ ,
                data: timestamp
            }
        ]
    });
    __privateGet(this, _writer).writeEBML(__privateGet(this, _currentCluster));
    __privateSet(this, _currentClusterTimestamp, timestamp);
    let clusterOffsetFromSegment = __privateGet(this, _writer).offsets.get(__privateGet(this, _currentCluster)) - __privateGet(this, _segmentDataOffset, segmentDataOffset_get);
    __privateGet(this, _cues).data.push({
        id: 187 /* CuePoint */ ,
        data: [
            {
                id: 179 /* CueTime */ ,
                data: timestamp
            },
            __privateGet(this, _options).video ? {
                id: 183 /* CueTrackPositions */ ,
                data: [
                    {
                        id: 247 /* CueTrack */ ,
                        data: VIDEO_TRACK_NUMBER
                    },
                    {
                        id: 241 /* CueClusterPosition */ ,
                        data: clusterOffsetFromSegment
                    }
                ]
            } : null,
            __privateGet(this, _options).audio ? {
                id: 183 /* CueTrackPositions */ ,
                data: [
                    {
                        id: 247 /* CueTrack */ ,
                        data: AUDIO_TRACK_NUMBER
                    },
                    {
                        id: 241 /* CueClusterPosition */ ,
                        data: clusterOffsetFromSegment
                    }
                ]
            } : null
        ]
    });
};
_finalizeCurrentCluster = new WeakSet();
finalizeCurrentCluster_fn = function() {
    let clusterSize = __privateGet(this, _writer).pos - __privateGet(this, _writer).dataOffsets.get(__privateGet(this, _currentCluster));
    let endPos = __privateGet(this, _writer).pos;
    __privateGet(this, _writer).seek(__privateGet(this, _writer).offsets.get(__privateGet(this, _currentCluster)) + 4);
    __privateGet(this, _writer).writeEBMLVarInt(clusterSize, CLUSTER_SIZE_BYTES);
    __privateGet(this, _writer).seek(endPos);
};
_ensureNotFinalized = new WeakSet();
ensureNotFinalized_fn = function() {
    if (__privateGet(this, _finalized)) {
        throw new Error("Cannot add new video or audio chunks after the file has been finalized.");
    }
};

export { ArrayBufferTarget, FileSystemWritableFileStreamTarget, Muxer, StreamTarget };
