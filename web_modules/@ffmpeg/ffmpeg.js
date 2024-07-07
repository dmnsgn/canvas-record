var FFMessageType;
(function(FFMessageType) {
    FFMessageType["LOAD"] = "LOAD";
    FFMessageType["EXEC"] = "EXEC";
    FFMessageType["WRITE_FILE"] = "WRITE_FILE";
    FFMessageType["READ_FILE"] = "READ_FILE";
    FFMessageType["DELETE_FILE"] = "DELETE_FILE";
    FFMessageType["RENAME"] = "RENAME";
    FFMessageType["CREATE_DIR"] = "CREATE_DIR";
    FFMessageType["LIST_DIR"] = "LIST_DIR";
    FFMessageType["DELETE_DIR"] = "DELETE_DIR";
    FFMessageType["ERROR"] = "ERROR";
    FFMessageType["DOWNLOAD"] = "DOWNLOAD";
    FFMessageType["PROGRESS"] = "PROGRESS";
    FFMessageType["LOG"] = "LOG";
    FFMessageType["MOUNT"] = "MOUNT";
    FFMessageType["UNMOUNT"] = "UNMOUNT";
})(FFMessageType || (FFMessageType = {}));

/**
 * Generate an unique message ID.
 */ const getMessageID = (()=>{
    let messageID = 0;
    return ()=>messageID++;
})();

const ERROR_NOT_LOADED = new Error("ffmpeg is not loaded, call `await ffmpeg.load()` first");
const ERROR_TERMINATED = new Error("called FFmpeg.terminate()");

/**
 * Provides APIs to interact with ffmpeg web worker.
 *
 * @example
 * ```ts
 * const ffmpeg = new FFmpeg();
 * ```
 */ class FFmpeg {
    #worker;
    /**
     * #resolves and #rejects tracks Promise resolves and rejects to
     * be called when we receive message from web worker.
     */ #resolves;
    #rejects;
    #logEventCallbacks;
    #progressEventCallbacks;
    /**
     * register worker message event handlers.
     */ #registerHandlers;
    /**
     * Generic function to send messages to web worker.
     */ #send;
    on(event, callback) {
        if (event === "log") {
            this.#logEventCallbacks.push(callback);
        } else if (event === "progress") {
            this.#progressEventCallbacks.push(callback);
        }
    }
    off(event, callback) {
        if (event === "log") {
            this.#logEventCallbacks = this.#logEventCallbacks.filter((f)=>f !== callback);
        } else if (event === "progress") {
            this.#progressEventCallbacks = this.#progressEventCallbacks.filter((f)=>f !== callback);
        }
    }
    constructor(){
        this.#worker = null;
        this.#resolves = {};
        this.#rejects = {};
        this.#logEventCallbacks = [];
        this.#progressEventCallbacks = [];
        this.loaded = false;
        this.#registerHandlers = ()=>{
            if (this.#worker) {
                this.#worker.onmessage = (param)=>{
                    let { data: { id, type, data } } = param;
                    switch(type){
                        case FFMessageType.LOAD:
                            this.loaded = true;
                            this.#resolves[id](data);
                            break;
                        case FFMessageType.MOUNT:
                        case FFMessageType.UNMOUNT:
                        case FFMessageType.EXEC:
                        case FFMessageType.WRITE_FILE:
                        case FFMessageType.READ_FILE:
                        case FFMessageType.DELETE_FILE:
                        case FFMessageType.RENAME:
                        case FFMessageType.CREATE_DIR:
                        case FFMessageType.LIST_DIR:
                        case FFMessageType.DELETE_DIR:
                            this.#resolves[id](data);
                            break;
                        case FFMessageType.LOG:
                            this.#logEventCallbacks.forEach((f)=>f(data));
                            break;
                        case FFMessageType.PROGRESS:
                            this.#progressEventCallbacks.forEach((f)=>f(data));
                            break;
                        case FFMessageType.ERROR:
                            this.#rejects[id](data);
                            break;
                    }
                    delete this.#resolves[id];
                    delete this.#rejects[id];
                };
            }
        };
        this.#send = (param, trans, signal)=>{
            let { type, data } = param;
            if (trans === void 0) trans = [];
            if (!this.#worker) {
                return Promise.reject(ERROR_NOT_LOADED);
            }
            return new Promise((resolve, reject)=>{
                const id = getMessageID();
                this.#worker && this.#worker.postMessage({
                    id,
                    type,
                    data
                }, trans);
                this.#resolves[id] = resolve;
                this.#rejects[id] = reject;
                signal == null ? void 0 : signal.addEventListener("abort", ()=>{
                    reject(new DOMException(`Message # ${id} was aborted`, "AbortError"));
                }, {
                    once: true
                });
            });
        };
        /**
     * Loads ffmpeg-core inside web worker. It is required to call this method first
     * as it initializes WebAssembly and other essential variables.
     *
     * @category FFmpeg
     * @returns `true` if ffmpeg core is loaded for the first time.
     */ this.load = (config, param)=>{
            if (config === void 0) config = {};
            let { signal } = param === void 0 ? {} : param;
            if (!this.#worker) {
                this.#worker = new Worker(new URL(new URL('../assets/worker-BIbGGrl-.js', import.meta.url).href, import.meta.url), {
                    type: "module"
                });
                this.#registerHandlers();
            }
            return this.#send({
                type: FFMessageType.LOAD,
                data: config
            }, undefined, signal);
        };
        /**
     * Execute ffmpeg command.
     *
     * @remarks
     * To avoid common I/O issues, ["-nostdin", "-y"] are prepended to the args
     * by default.
     *
     * @example
     * ```ts
     * const ffmpeg = new FFmpeg();
     * await ffmpeg.load();
     * await ffmpeg.writeFile("video.avi", ...);
     * // ffmpeg -i video.avi video.mp4
     * await ffmpeg.exec(["-i", "video.avi", "video.mp4"]);
     * const data = ffmpeg.readFile("video.mp4");
     * ```
     *
     * @returns `0` if no error, `!= 0` if timeout (1) or error.
     * @category FFmpeg
     */ this.exec = (/** ffmpeg command line args */ args, /**
     * milliseconds to wait before stopping the command execution.
     *
     * @defaultValue -1
     */ timeout, param)=>{
            if (timeout === void 0) timeout = -1;
            let { signal } = param === void 0 ? {} : param;
            return this.#send({
                type: FFMessageType.EXEC,
                data: {
                    args,
                    timeout
                }
            }, undefined, signal);
        };
        /**
     * Terminate all ongoing API calls and terminate web worker.
     * `FFmpeg.load()` must be called again before calling any other APIs.
     *
     * @category FFmpeg
     */ this.terminate = ()=>{
            const ids = Object.keys(this.#rejects);
            // rejects all incomplete Promises.
            for (const id of ids){
                this.#rejects[id](ERROR_TERMINATED);
                delete this.#rejects[id];
                delete this.#resolves[id];
            }
            if (this.#worker) {
                this.#worker.terminate();
                this.#worker = null;
                this.loaded = false;
            }
        };
        /**
     * Write data to ffmpeg.wasm.
     *
     * @example
     * ```ts
     * const ffmpeg = new FFmpeg();
     * await ffmpeg.load();
     * await ffmpeg.writeFile("video.avi", await fetchFile("../video.avi"));
     * await ffmpeg.writeFile("text.txt", "hello world");
     * ```
     *
     * @category File System
     */ this.writeFile = (path, data, param)=>{
            let { signal } = param === void 0 ? {} : param;
            const trans = [];
            if (data instanceof Uint8Array) {
                trans.push(data.buffer);
            }
            return this.#send({
                type: FFMessageType.WRITE_FILE,
                data: {
                    path,
                    data
                }
            }, trans, signal);
        };
        this.mount = (fsType, options, mountPoint)=>{
            const trans = [];
            return this.#send({
                type: FFMessageType.MOUNT,
                data: {
                    fsType,
                    options,
                    mountPoint
                }
            }, trans);
        };
        this.unmount = (mountPoint)=>{
            const trans = [];
            return this.#send({
                type: FFMessageType.UNMOUNT,
                data: {
                    mountPoint
                }
            }, trans);
        };
        /**
     * Read data from ffmpeg.wasm.
     *
     * @example
     * ```ts
     * const ffmpeg = new FFmpeg();
     * await ffmpeg.load();
     * const data = await ffmpeg.readFile("video.mp4");
     * ```
     *
     * @category File System
     */ this.readFile = (path, /**
     * File content encoding, supports two encodings:
     * - utf8: read file as text file, return data in string type.
     * - binary: read file as binary file, return data in Uint8Array type.
     *
     * @defaultValue binary
     */ encoding, param)=>{
            if (encoding === void 0) encoding = "binary";
            let { signal } = param === void 0 ? {} : param;
            return this.#send({
                type: FFMessageType.READ_FILE,
                data: {
                    path,
                    encoding
                }
            }, undefined, signal);
        };
        /**
     * Delete a file.
     *
     * @category File System
     */ this.deleteFile = (path, param)=>{
            let { signal } = param === void 0 ? {} : param;
            return this.#send({
                type: FFMessageType.DELETE_FILE,
                data: {
                    path
                }
            }, undefined, signal);
        };
        /**
     * Rename a file or directory.
     *
     * @category File System
     */ this.rename = (oldPath, newPath, param)=>{
            let { signal } = param === void 0 ? {} : param;
            return this.#send({
                type: FFMessageType.RENAME,
                data: {
                    oldPath,
                    newPath
                }
            }, undefined, signal);
        };
        /**
     * Create a directory.
     *
     * @category File System
     */ this.createDir = (path, param)=>{
            let { signal } = param === void 0 ? {} : param;
            return this.#send({
                type: FFMessageType.CREATE_DIR,
                data: {
                    path
                }
            }, undefined, signal);
        };
        /**
     * List directory contents.
     *
     * @category File System
     */ this.listDir = (path, param)=>{
            let { signal } = param === void 0 ? {} : param;
            return this.#send({
                type: FFMessageType.LIST_DIR,
                data: {
                    path
                }
            }, undefined, signal);
        };
        /**
     * Delete an empty directory.
     *
     * @category File System
     */ this.deleteDir = (path, param)=>{
            let { signal } = param === void 0 ? {} : param;
            return this.#send({
                type: FFMessageType.DELETE_DIR,
                data: {
                    path
                }
            }, undefined, signal);
        };
    }
}

export { FFmpeg };
