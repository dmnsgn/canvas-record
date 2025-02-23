import { B as Buffer } from '../_chunks/polyfills-QWxePbon.js';

/* ES Module Shims Wasm 2.0.10 */ (function() {
    const hasDocument = typeof document !== 'undefined';
    const noop = ()=>{};
    const dynamicImport = (u, errUrl)=>import(u);
    const optionsScript = hasDocument ? document.querySelector('script[type=esms-options]') : undefined;
    const esmsInitOptions = optionsScript ? JSON.parse(optionsScript.innerHTML) : {};
    Object.assign(esmsInitOptions, self.esmsInitOptions || {});
    // shim mode is determined on initialization, no late shim mode
    const shimMode = hasDocument ? esmsInitOptions.shimMode || document.querySelectorAll('script[type=module-shim],script[type=importmap-shim],link[rel=modulepreload-shim]').length > 0 : true;
    const importHook = globalHook(shimMode && esmsInitOptions.onimport);
    const resolveHook = globalHook(shimMode && esmsInitOptions.resolve);
    let fetchHook = esmsInitOptions.fetch ? globalHook(esmsInitOptions.fetch) : fetch;
    const metaHook = esmsInitOptions.meta ? globalHook(shimMode && esmsInitOptions.meta) : noop;
    const tsTransform = esmsInitOptions.tsTransform || hasDocument && document.currentScript && document.currentScript.src.replace(/\.js$/, '-typescript.js') || './es-module-shims-typescript.js';
    const mapOverrides = esmsInitOptions.mapOverrides;
    let nonce = esmsInitOptions.nonce;
    if (!nonce && hasDocument) {
        const nonceElement = document.querySelector('script[nonce]');
        if (nonceElement) nonce = nonceElement.nonce || nonceElement.getAttribute('nonce');
    }
    const onerror = globalHook(esmsInitOptions.onerror || noop);
    const { revokeBlobURLs, noLoadEventRetriggers, enforceIntegrity } = esmsInitOptions;
    function globalHook(name) {
        return typeof name === 'string' ? self[name] : name;
    }
    const enable = Array.isArray(esmsInitOptions.polyfillEnable) ? esmsInitOptions.polyfillEnable : [];
    const enableAll = esmsInitOptions.polyfillEnable === 'all' || enable.includes('all');
    const enableLatest = esmsInitOptions.polyfillEnable === 'latest' || enable.includes('latest');
    const cssModulesEnabled = enable.includes('css-modules') || enableAll || enableLatest;
    const jsonModulesEnabled = enable.includes('json-modules') || enableAll || enableLatest;
    const wasmModulesEnabled = enable.includes('wasm-modules') || enableAll;
    const sourcePhaseEnabled = enable.includes('source-phase') || enableAll;
    const typescriptEnabled = enable.includes('typescript') || enableAll;
    const onpolyfill = esmsInitOptions.onpolyfill ? globalHook(esmsInitOptions.onpolyfill) : ()=>{
        console.log(`%c^^ Module error above is polyfilled and can be ignored ^^`, 'font-weight:900;color:#391');
    };
    const baseUrl = hasDocument ? document.baseURI : `${location.protocol}//${location.host}${location.pathname.includes('/') ? location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1) : location.pathname}`;
    const createBlob = (source, type)=>{
        if (type === undefined) type = 'text/javascript';
        return URL.createObjectURL(new Blob([
            source
        ], {
            type
        }));
    };
    let { skip } = esmsInitOptions;
    if (Array.isArray(skip)) {
        const l = skip.map((s)=>new URL(s, baseUrl).href);
        skip = (s)=>l.some((i)=>i[i.length - 1] === '/' && s.startsWith(i) || s === i);
    } else if (typeof skip === 'string') {
        const r = new RegExp(skip);
        skip = (s)=>r.test(s);
    } else if (skip instanceof RegExp) {
        skip = (s)=>skip.test(s);
    }
    const dispatchError = (error)=>self.dispatchEvent(Object.assign(new Event('error'), {
            error
        }));
    const throwError = (err)=>{
        (self.reportError || dispatchError)(err), void onerror(err);
    };
    function fromParent(parent) {
        return parent ? ` imported from ${parent}` : '';
    }
    const backslashRegEx = /\\/g;
    function asURL(url) {
        try {
            if (url.indexOf(':') !== -1) return new URL(url).href;
        } catch (_) {}
    }
    function resolveUrl(relUrl, parentUrl) {
        return resolveIfNotPlainOrUrl(relUrl, parentUrl) || asURL(relUrl) || resolveIfNotPlainOrUrl('./' + relUrl, parentUrl);
    }
    function resolveIfNotPlainOrUrl(relUrl, parentUrl) {
        const hIdx = parentUrl.indexOf('#'), qIdx = parentUrl.indexOf('?');
        if (hIdx + qIdx > -2) parentUrl = parentUrl.slice(0, hIdx === -1 ? qIdx : qIdx === -1 || qIdx > hIdx ? hIdx : qIdx);
        if (relUrl.indexOf('\\') !== -1) relUrl = relUrl.replace(backslashRegEx, '/');
        // protocol-relative
        if (relUrl[0] === '/' && relUrl[1] === '/') {
            return parentUrl.slice(0, parentUrl.indexOf(':') + 1) + relUrl;
        } else if (relUrl[0] === '.' && (relUrl[1] === '/' || relUrl[1] === '.' && (relUrl[2] === '/' || relUrl.length === 2 && (relUrl += '/')) || relUrl.length === 1 && (relUrl += '/')) || relUrl[0] === '/') {
            const parentProtocol = parentUrl.slice(0, parentUrl.indexOf(':') + 1);
            if (parentProtocol === 'blob:') {
                throw new TypeError(`Failed to resolve module specifier "${relUrl}". Invalid relative url or base scheme isn't hierarchical.`);
            }
            // Disabled, but these cases will give inconsistent results for deep backtracking
            //if (parentUrl[parentProtocol.length] !== '/')
            //  throw new Error('Cannot resolve');
            // read pathname from parent URL
            // pathname taken to be part after leading "/"
            let pathname;
            if (parentUrl[parentProtocol.length + 1] === '/') {
                // resolving to a :// so we need to read out the auth and host
                if (parentProtocol !== 'file:') {
                    pathname = parentUrl.slice(parentProtocol.length + 2);
                    pathname = pathname.slice(pathname.indexOf('/') + 1);
                } else {
                    pathname = parentUrl.slice(8);
                }
            } else {
                // resolving to :/ so pathname is the /... part
                pathname = parentUrl.slice(parentProtocol.length + (parentUrl[parentProtocol.length] === '/'));
            }
            if (relUrl[0] === '/') return parentUrl.slice(0, parentUrl.length - pathname.length - 1) + relUrl;
            // join together and split for removal of .. and . segments
            // looping the string instead of anything fancy for perf reasons
            // '../../../../../z' resolved to 'x/y' is just 'z'
            const segmented = pathname.slice(0, pathname.lastIndexOf('/') + 1) + relUrl;
            const output = [];
            let segmentIndex = -1;
            for(let i = 0; i < segmented.length; i++){
                // busy reading a segment - only terminate on '/'
                if (segmentIndex !== -1) {
                    if (segmented[i] === '/') {
                        output.push(segmented.slice(segmentIndex, i + 1));
                        segmentIndex = -1;
                    }
                    continue;
                } else if (segmented[i] === '.') {
                    // ../ segment
                    if (segmented[i + 1] === '.' && (segmented[i + 2] === '/' || i + 2 === segmented.length)) {
                        output.pop();
                        i += 2;
                        continue;
                    } else if (segmented[i + 1] === '/' || i + 1 === segmented.length) {
                        i += 1;
                        continue;
                    }
                }
                // it is the start of a new segment
                while(segmented[i] === '/')i++;
                segmentIndex = i;
            }
            // finish reading out the last segment
            if (segmentIndex !== -1) output.push(segmented.slice(segmentIndex));
            return parentUrl.slice(0, parentUrl.length - pathname.length) + output.join('');
        }
    }
    function resolveAndComposeImportMap(json, baseUrl, parentMap) {
        const outMap = {
            imports: Object.assign({}, parentMap.imports),
            scopes: Object.assign({}, parentMap.scopes),
            integrity: Object.assign({}, parentMap.integrity)
        };
        if (json.imports) resolveAndComposePackages(json.imports, outMap.imports, baseUrl, parentMap);
        if (json.scopes) for(let s in json.scopes){
            const resolvedScope = resolveUrl(s, baseUrl);
            resolveAndComposePackages(json.scopes[s], outMap.scopes[resolvedScope] || (outMap.scopes[resolvedScope] = {}), baseUrl, parentMap);
        }
        if (json.integrity) resolveAndComposeIntegrity(json.integrity, outMap.integrity, baseUrl);
        return outMap;
    }
    function getMatch(path, matchObj) {
        if (matchObj[path]) return path;
        let sepIndex = path.length;
        do {
            const segment = path.slice(0, sepIndex + 1);
            if (segment in matchObj) return segment;
        }while ((sepIndex = path.lastIndexOf('/', sepIndex - 1)) !== -1);
    }
    function applyPackages(id, packages) {
        const pkgName = getMatch(id, packages);
        if (pkgName) {
            const pkg = packages[pkgName];
            if (pkg === null) return;
            return pkg + id.slice(pkgName.length);
        }
    }
    function resolveImportMap(importMap, resolvedOrPlain, parentUrl) {
        let scopeUrl = parentUrl && getMatch(parentUrl, importMap.scopes);
        while(scopeUrl){
            const packageResolution = applyPackages(resolvedOrPlain, importMap.scopes[scopeUrl]);
            if (packageResolution) return packageResolution;
            scopeUrl = getMatch(scopeUrl.slice(0, scopeUrl.lastIndexOf('/')), importMap.scopes);
        }
        return applyPackages(resolvedOrPlain, importMap.imports) || resolvedOrPlain.indexOf(':') !== -1 && resolvedOrPlain;
    }
    function resolveAndComposePackages(packages, outPackages, baseUrl, parentMap) {
        for(let p in packages){
            const resolvedLhs = resolveIfNotPlainOrUrl(p, baseUrl) || p;
            if ((!shimMode || !mapOverrides) && outPackages[resolvedLhs] && outPackages[resolvedLhs] !== packages[resolvedLhs]) {
                console.warn(`es-module-shims: Rejected map override "${resolvedLhs}" from ${outPackages[resolvedLhs]} to ${packages[resolvedLhs]}.`);
                continue;
            }
            let target = packages[p];
            if (typeof target !== 'string') continue;
            const mapped = resolveImportMap(parentMap, resolveIfNotPlainOrUrl(target, baseUrl) || target, baseUrl);
            if (mapped) {
                outPackages[resolvedLhs] = mapped;
                continue;
            }
            console.warn(`es-module-shims: Mapping "${p}" -> "${packages[p]}" does not resolve`);
        }
    }
    function resolveAndComposeIntegrity(integrity, outIntegrity, baseUrl) {
        for(let p in integrity){
            const resolvedLhs = resolveIfNotPlainOrUrl(p, baseUrl) || p;
            if ((!shimMode || !mapOverrides) && outIntegrity[resolvedLhs] && outIntegrity[resolvedLhs] !== integrity[resolvedLhs]) {
                console.warn(`es-module-shims: Rejected map integrity override "${resolvedLhs}" from ${outIntegrity[resolvedLhs]} to ${integrity[resolvedLhs]}.`);
            }
            outIntegrity[resolvedLhs] = integrity[p];
        }
    }
    // support browsers without dynamic import support (eg Firefox 6x)
    let supportsJsonType = false;
    let supportsCssType = false;
    const supports = hasDocument && HTMLScriptElement.supports;
    let supportsImportMaps = supports && supports.name === 'supports' && supports('importmap');
    let supportsWasmModules = false;
    let supportsSourcePhase = false;
    let supportsMultipleImportMaps = false;
    const wasmBytes = [
        0,
        97,
        115,
        109,
        1,
        0,
        0,
        0
    ];
    let featureDetectionPromise = async function() {
        if (!hasDocument) return Promise.all([
            cssModulesEnabled && import(createBlob(`import"${createBlob('', 'text/css')}"with{type:"css"}`)).then(()=>supportsCssType = true, noop),
            jsonModulesEnabled && import(createBlob(`import"${createBlob('{}', 'text/json')}"with{type:"json"}`)).then(()=>supportsJsonType = true, noop),
            wasmModulesEnabled && import(createBlob(`import"${createBlob(new Uint8Array(wasmBytes), 'application/wasm')}"`)).then(()=>supportsWasmModules = true, noop),
            wasmModulesEnabled && sourcePhaseEnabled && import(createBlob(`import source x from"${createBlob(new Uint8Array(wasmBytes), 'application/wasm')}"`)).then(()=>supportsSourcePhase = true, noop)
        ]);
        return new Promise((resolve)=>{
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.setAttribute('nonce', nonce);
            function cb(param) {
                let { data } = param;
                const isFeatureDetectionMessage = Array.isArray(data) && data[0] === 'esms';
                if (!isFeatureDetectionMessage) return;
                [, supportsImportMaps, supportsMultipleImportMaps, supportsCssType, supportsJsonType, supportsWasmModules, supportsSourcePhase] = data;
                resolve();
                document.head.removeChild(iframe);
                window.removeEventListener('message', cb, false);
            }
            window.addEventListener('message', cb, false);
            const importMapTest = `<script nonce=${nonce || ''}>b=(s,type='text/javascript')=>URL.createObjectURL(new Blob([s],{type}));i=innerText=>document.head.appendChild(Object.assign(document.createElement('script'),{type:'importmap',nonce:"${nonce}",innerText}));i(\`{"imports":{"x":"\${b('')}"}}\`);i(\`{"imports":{"y":"\${b('')}"}}\`);Promise.all([${supportsImportMaps ? 'true' : "'x'"},${supportsImportMaps ? "'y'" : false},${supportsImportMaps && cssModulesEnabled ? `b(\`import"\${b('','text/css')}"with{type:"css"}\`)` : 'false'}, ${supportsImportMaps && jsonModulesEnabled ? `b(\`import"\${b('{}','text/json')\}"with{type:"json"}\`)` : 'false'},${supportsImportMaps && wasmModulesEnabled ? `b(\`import"\${b(new Uint8Array(${JSON.stringify(wasmBytes)}),'application/wasm')\}"\`)` : 'false'},${supportsImportMaps && wasmModulesEnabled && sourcePhaseEnabled ? `b(\`import source x from "\${b(new Uint8Array(${JSON.stringify(wasmBytes)}),'application/wasm')\}"\`)` : 'false'}].map(x =>typeof x==='string'?import(x).then(()=>true,()=>false):x)).then(a=>parent.postMessage(['esms'].concat(a),'*'))<${''}/script>`;
            // Safari will call onload eagerly on head injection, but we don't want the Wechat
            // path to trigger before setting srcdoc, therefore we track the timing
            let readyForOnload = false, onloadCalledWhileNotReady = false;
            function doOnload() {
                if (!readyForOnload) {
                    onloadCalledWhileNotReady = true;
                    return;
                }
                // WeChat browser doesn't support setting srcdoc scripts
                // But iframe sandboxes don't support contentDocument so we do this as a fallback
                const doc = iframe.contentDocument;
                if (doc && doc.head.childNodes.length === 0) {
                    const s = doc.createElement('script');
                    if (nonce) s.setAttribute('nonce', nonce);
                    s.innerHTML = importMapTest.slice(15 + (nonce ? nonce.length : 0), -9);
                    doc.head.appendChild(s);
                }
            }
            iframe.onload = doOnload;
            // WeChat browser requires append before setting srcdoc
            document.head.appendChild(iframe);
            // setting srcdoc is not supported in React native webviews on iOS
            // setting src to a blob URL results in a navigation event in webviews
            // document.write gives usability warnings
            readyForOnload = true;
            if ('srcdoc' in iframe) iframe.srcdoc = importMapTest;
            else iframe.contentDocument.write(importMapTest);
            // retrigger onload for Safari only if necessary
            if (onloadCalledWhileNotReady) doOnload();
        });
    }();
    /* es-module-lexer 1.6.0 */ var ImportType;
    !function(A) {
        A[A.Static = 1] = "Static", A[A.Dynamic = 2] = "Dynamic", A[A.ImportMeta = 3] = "ImportMeta", A[A.StaticSourcePhase = 4] = "StaticSourcePhase", A[A.DynamicSourcePhase = 5] = "DynamicSourcePhase";
    }(ImportType || (ImportType = {}));
    const A = 1 === new Uint8Array(new Uint16Array([
        1
    ]).buffer)[0];
    function parse(E, g) {
        if (g === undefined) g = "@";
        if (!C) return init.then(()=>parse(E));
        const I = E.length + 1, w = (C.__heap_base.value || C.__heap_base) + 4 * I - C.memory.buffer.byteLength;
        w > 0 && C.memory.grow(Math.ceil(w / 65536));
        const K = C.sa(I - 1);
        if ((A ? B : Q)(E, new Uint16Array(C.memory.buffer, K, I)), !C.parse()) throw Object.assign(new Error(`Parse error ${g}:${E.slice(0, C.e()).split("\n").length}:${C.e() - E.lastIndexOf("\n", C.e() - 1)}`), {
            idx: C.e()
        });
        const o = [], D = [];
        for(; C.ri();){
            const A = C.is(), Q = C.ie(), B = C.it(), g = C.ai(), I = C.id(), w = C.ss(), K = C.se();
            let D;
            C.ip() && (D = k(E.slice(-1 === I ? A - 1 : A, -1 === I ? Q + 1 : Q))), o.push({
                n: D,
                t: B,
                s: A,
                e: Q,
                ss: w,
                se: K,
                d: I,
                a: g
            });
        }
        for(; C.re();){
            const A = C.es(), Q = C.ee(), B = C.els(), g = C.ele(), I = E.slice(A, Q), w = I[0], K = B < 0 ? undefined : E.slice(B, g), o = K ? K[0] : "";
            D.push({
                s: A,
                e: Q,
                ls: B,
                le: g,
                n: '"' === w || "'" === w ? k(I) : I,
                ln: '"' === o || "'" === o ? k(K) : K
            });
        }
        function k(A) {
            try {
                return (0, eval)(A);
            } catch (A) {}
        }
        return [
            o,
            D,
            !!C.f(),
            !!C.ms()
        ];
    }
    function Q(A, Q) {
        const B = A.length;
        let C = 0;
        for(; C < B;){
            const B = A.charCodeAt(C);
            Q[C++] = (255 & B) << 8 | B >>> 8;
        }
    }
    function B(A, Q) {
        const B = A.length;
        let C = 0;
        for(; C < B;)Q[C] = A.charCodeAt(C++);
    }
    let C;
    const E = ()=>{
        return A = "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", "undefined" != typeof Buffer ? Buffer.from(A, "base64") : Uint8Array.from(atob(A), (A)=>A.charCodeAt(0));
        var A;
    };
    const init = WebAssembly.compile(E()).then(WebAssembly.instantiate).then((param)=>{
        let { exports: A } = param;
        C = A;
    });
    function _resolve(id, parentUrl) {
        if (parentUrl === undefined) parentUrl = baseUrl;
        const urlResolved = resolveIfNotPlainOrUrl(id, parentUrl) || asURL(id);
        const firstResolved = firstImportMap && resolveImportMap(firstImportMap, urlResolved || id, parentUrl);
        const composedResolved = composedImportMap === firstImportMap ? firstResolved : resolveImportMap(composedImportMap, urlResolved || id, parentUrl);
        const resolved = composedResolved || firstResolved || throwUnresolved(id, parentUrl);
        // needsShim, shouldShim per load record to set on parent
        let n = false, N = false;
        if (!supportsImportMaps) {
            // bare specifier -> needs shim
            if (!urlResolved) n = true;
            else if (urlResolved !== resolved) N = true;
        } else if (!supportsMultipleImportMaps) {
            // bare specifier and not resolved by first import map -> needs shim
            if (!urlResolved && !firstResolved) n = true;
            // resolution doesn't match first import map -> should shim
            if (firstResolved && resolved !== firstResolved) N = true;
        }
        return {
            r: resolved,
            n,
            N
        };
    }
    const resolve = resolveHook ? (id, parentUrl)=>{
        if (parentUrl === undefined) parentUrl = baseUrl;
        const result = resolveHook(id, parentUrl, defaultResolve);
        return result ? {
            r: result,
            n: true,
            N: true
        } : _resolve(id, parentUrl);
    } : _resolve;
    async function importHandler(id, opts, parentUrl, sourcePhase) {
        if (parentUrl === undefined) parentUrl = baseUrl;
        await initPromise; // needed for shim check
        if (importHook) await importHook(id, opts, parentUrl);
        if (shimMode || !baselinePassthrough) {
            if (hasDocument) processScriptsAndPreloads();
            legacyAcceptingImportMaps = false;
        }
        await importMapPromise;
        return resolve(id, parentUrl).r;
    }
    // import()
    async function importShim(id, opts, parentUrl) {
        if (typeof opts === 'string') {
            parentUrl = opts;
            opts = undefined;
        }
        // we mock import('./x.css', { with: { type: 'css' }}) support via an inline static reexport
        // because we can't syntactically pass through to dynamic import with a second argument in this libarary
        let url = await importHandler(id, opts, parentUrl);
        let source = null;
        if (typeof opts === 'object' && typeof opts.with === 'object' && typeof opts.with.type === 'string') {
            source = `export{default}from'${url}'with{type:"${opts.with.type}"}`;
            url += '?entry';
        }
        return topLevelLoad(url, {
            credentials: 'same-origin'
        }, source, undefined, undefined);
    }
    // import.source()
    // (opts not currently supported as no use cases yet)
    if (shimMode || sourcePhaseEnabled) importShim.source = async function importShimSource(specifier, opts, parentUrl) {
        if (typeof opts === 'string') {
            parentUrl = opts;
            opts = undefined;
        }
        const url = await importHandler(specifier, opts, parentUrl);
        const load = getOrCreateLoad(url, {
            credentials: 'same-origin'
        }, null, null);
        if (firstPolyfillLoad && !shimMode && load.n && nativelyLoaded) {
            onpolyfill();
            firstPolyfillLoad = false;
        }
        await load.f;
        return importShim._s[load.r];
    };
    self.importShim = importShim;
    function defaultResolve(id, parentUrl) {
        return resolveImportMap(composedImportMap, resolveIfNotPlainOrUrl(id, parentUrl) || id, parentUrl) || throwUnresolved(id, parentUrl);
    }
    function throwUnresolved(id, parentUrl) {
        throw Error(`Unable to resolve specifier '${id}'${fromParent(parentUrl)}`);
    }
    function metaResolve(id, parentUrl) {
        if (parentUrl === undefined) parentUrl = this.url;
        return resolve(id, `${parentUrl}`).r;
    }
    importShim.resolve = (id, parentUrl)=>resolve(id, parentUrl).r;
    importShim.getImportMap = ()=>JSON.parse(JSON.stringify(composedImportMap));
    importShim.addImportMap = (importMapIn)=>{
        if (!shimMode) throw new Error('Unsupported in polyfill mode.');
        composedImportMap = resolveAndComposeImportMap(importMapIn, baseUrl, composedImportMap);
    };
    const registry = importShim._r = {};
    const sourceCache = importShim._s = {};
    async function loadAll(load, seen) {
        seen[load.u] = 1;
        await load.L;
        await Promise.all(load.d.map((param)=>{
            let { l: dep, s: sourcePhase } = param;
            if (dep.b || seen[dep.u]) return;
            if (sourcePhase) return dep.f;
            return loadAll(dep, seen);
        }));
    }
    let importMapSrc = false;
    let multipleImportMaps = false;
    let firstImportMap = null;
    // To support polyfilling multiple import maps, we separately track the composed import map from the first import map
    let composedImportMap = {
        imports: {},
        scopes: {},
        integrity: {}
    };
    let baselinePassthrough;
    const initPromise = featureDetectionPromise.then(()=>{
        baselinePassthrough = esmsInitOptions.polyfillEnable !== true && supportsImportMaps && (!jsonModulesEnabled || supportsJsonType) && (!cssModulesEnabled || supportsCssType) && (!wasmModulesEnabled || supportsWasmModules) && (!sourcePhaseEnabled || supportsSourcePhase) && (!multipleImportMaps || supportsMultipleImportMaps) && !importMapSrc && !typescriptEnabled;
        if (!shimMode && sourcePhaseEnabled && typeof WebAssembly !== 'undefined' && !Object.getPrototypeOf(WebAssembly.Module).name) {
            const s = Symbol();
            const brand = (m)=>Object.defineProperty(m, s, {
                    writable: false,
                    configurable: false,
                    value: 'WebAssembly.Module'
                });
            class AbstractModuleSource {
                get [Symbol.toStringTag]() {
                    if (this[s]) return this[s];
                    throw new TypeError('Not an AbstractModuleSource');
                }
            }
            const { Module: wasmModule, compile: wasmCompile, compileStreaming: wasmCompileStreaming } = WebAssembly;
            WebAssembly.Module = Object.setPrototypeOf(Object.assign(function Module() {
                for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                    args[_key] = arguments[_key];
                }
                return brand(new wasmModule(...args));
            }, wasmModule), AbstractModuleSource);
            WebAssembly.Module.prototype = Object.setPrototypeOf(wasmModule.prototype, AbstractModuleSource.prototype);
            WebAssembly.compile = function compile() {
                for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                    args[_key] = arguments[_key];
                }
                return wasmCompile(...args).then(brand);
            };
            WebAssembly.compileStreaming = function compileStreaming() {
                for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
                    args[_key] = arguments[_key];
                }
                return wasmCompileStreaming(...args).then(brand);
            };
        }
        if (hasDocument) {
            if (!supportsImportMaps) {
                const supports = HTMLScriptElement.supports || ((type)=>type === 'classic' || type === 'module');
                HTMLScriptElement.supports = (type)=>type === 'importmap' || supports(type);
            }
            if (shimMode || !baselinePassthrough) {
                attachMutationObserver();
                if (document.readyState === 'complete') {
                    readyStateCompleteCheck();
                } else {
                    async function readyListener() {
                        await initPromise;
                        processScriptsAndPreloads();
                        if (document.readyState === 'complete') {
                            readyStateCompleteCheck();
                            document.removeEventListener('readystatechange', readyListener);
                        }
                    }
                    document.addEventListener('readystatechange', readyListener);
                }
            }
            processScriptsAndPreloads();
        }
        return init;
    });
    function attachMutationObserver() {
        const observer = new MutationObserver((mutations)=>{
            for (const mutation of mutations){
                if (mutation.type !== 'childList') continue;
                for (const node of mutation.addedNodes){
                    if (node.tagName === 'SCRIPT') {
                        if (node.type === (shimMode ? 'module-shim' : 'module') && !node.ep) processScript(node, true);
                        if (node.type === (shimMode ? 'importmap-shim' : 'importmap') && !node.ep) processImportMap(node, true);
                    } else if (node.tagName === 'LINK' && node.rel === (shimMode ? 'modulepreload-shim' : 'modulepreload') && !node.ep) {
                        processPreload(node);
                    }
                }
            }
        });
        observer.observe(document, {
            childList: true
        });
        observer.observe(document.head, {
            childList: true
        });
        processScriptsAndPreloads();
    }
    let importMapPromise = initPromise;
    let firstPolyfillLoad = true;
    let legacyAcceptingImportMaps = true;
    async function topLevelLoad(url, fetchOpts, source, nativelyLoaded1, lastStaticLoadPromise) {
        legacyAcceptingImportMaps = false;
        await initPromise;
        await importMapPromise;
        if (importHook) await importHook(url, typeof fetchOpts !== 'string' ? fetchOpts : {}, '');
        // early analysis opt-out - no need to even fetch if we have feature support
        if (!shimMode && baselinePassthrough) {
            // for polyfill case, only dynamic import needs a return value here, and dynamic import will never pass nativelyLoaded
            if (nativelyLoaded1) return null;
            await lastStaticLoadPromise;
            return dynamicImport(source ? createBlob(source) : url);
        }
        const load = getOrCreateLoad(url, fetchOpts, null, source);
        linkLoad(load, fetchOpts);
        const seen = {};
        await loadAll(load, seen);
        resolveDeps(load, seen);
        await lastStaticLoadPromise;
        if (!shimMode && !load.n) {
            if (nativelyLoaded1) {
                return;
            }
            if (source) {
                return await dynamicImport(createBlob(source));
            }
        }
        if (firstPolyfillLoad && !shimMode && load.n && nativelyLoaded1) {
            onpolyfill();
            firstPolyfillLoad = false;
        }
        const module = await (!shimMode && !load.n && !load.N ? import(load.u) : dynamicImport(load.b, load.u));
        // if the top-level load is a shell, run its update function
        if (load.s) (await dynamicImport(load.s, load.u)).u$_(module);
        if (revokeBlobURLs) revokeObjectURLs(Object.keys(seen));
        // when tla is supported, this should return the tla promise as an actual handle
        // so readystate can still correspond to the sync subgraph exec completions
        return module;
    }
    function revokeObjectURLs(registryKeys) {
        let batch = 0;
        const keysLength = registryKeys.length;
        const schedule = self.requestIdleCallback ? self.requestIdleCallback : self.requestAnimationFrame;
        schedule(cleanup);
        function cleanup() {
            const batchStartIndex = batch * 100;
            if (batchStartIndex > keysLength) return;
            for (const key of registryKeys.slice(batchStartIndex, batchStartIndex + 100)){
                const load = registry[key];
                if (load && load.b) URL.revokeObjectURL(load.b);
            }
            batch++;
            schedule(cleanup);
        }
    }
    function urlJsString(url) {
        return `'${url.replace(/'/g, "\\'")}'`;
    }
    function resolveDeps(load, seen) {
        if (load.b || !seen[load.u]) return;
        seen[load.u] = 0;
        for (const { l: dep, s: sourcePhase } of load.d){
            if (!sourcePhase) resolveDeps(dep, seen);
        }
        if (!load.n) load.n = load.d.some((dep)=>dep.l.n);
        if (!load.N) load.N = load.d.some((dep)=>dep.l.N);
        // use native loader whenever possible (n = needs shim) via executable subgraph passthrough
        // so long as the module doesn't use dynamic import or unsupported URL mappings (N = should shim)
        if (!shimMode && !load.n && !load.N) {
            load.b = load.u;
            load.S = undefined;
            return;
        }
        const [imports, exports] = load.a;
        // "execution"
        const source = load.S;
        let resolvedSource = '';
        // once all deps have loaded we can inline the dependency resolution blobs
        // and define this blob
        let lastIndex = 0, depIndex = 0, dynamicImportEndStack = [];
        function pushStringTo(originalIndex) {
            while(dynamicImportEndStack[dynamicImportEndStack.length - 1] < originalIndex){
                const dynamicImportEnd = dynamicImportEndStack.pop();
                resolvedSource += `${source.slice(lastIndex, dynamicImportEnd)}, ${urlJsString(load.r)}`;
                lastIndex = dynamicImportEnd;
            }
            resolvedSource += source.slice(lastIndex, originalIndex);
            lastIndex = originalIndex;
        }
        for (const { s: start, e: end, ss: statementStart, se: statementEnd, d: dynamicImportIndex, t, a } of imports){
            // source phase
            if (t === 4) {
                let { l: depLoad } = load.d[depIndex++];
                pushStringTo(statementStart);
                resolvedSource += 'import ';
                lastIndex = statementStart + 14;
                pushStringTo(start - 1);
                resolvedSource += `/*${source.slice(start - 1, end + 1)}*/'${createBlob(`export default importShim._s[${urlJsString(depLoad.r)}]`)}'`;
                lastIndex = end + 1;
            } else if (dynamicImportIndex === -1) {
                let { l: depLoad } = load.d[depIndex++], blobUrl = depLoad.b, cycleShell = !blobUrl;
                if (cycleShell) {
                    // circular shell creation
                    if (!(blobUrl = depLoad.s)) {
                        blobUrl = depLoad.s = createBlob(`export function u$_(m){${depLoad.a[1].map((param, i)=>{
                            let { s, e } = param;
                            const q = depLoad.S[s] === '"' || depLoad.S[s] === "'";
                            return `e$_${i}=m${q ? `[` : '.'}${depLoad.S.slice(s, e)}${q ? `]` : ''}`;
                        }).join(',')}}${depLoad.a[1].length ? `let ${depLoad.a[1].map((_, i)=>`e$_${i}`).join(',')};` : ''}export {${depLoad.a[1].map((param, i)=>{
                            let { s, e } = param;
                            return `e$_${i} as ${depLoad.S.slice(s, e)}`;
                        }).join(',')}}\n//# sourceURL=${depLoad.r}?cycle`);
                    }
                }
                // strip import assertions unless we support them
                const stripAssertion = !supportsCssType && !supportsJsonType || !(a > 0);
                pushStringTo(start - 1);
                resolvedSource += `/*${source.slice(start - 1, end + 1)}*/'${blobUrl}'`;
                // circular shell execution
                if (!cycleShell && depLoad.s) {
                    resolvedSource += `;import*as m$_${depIndex} from'${depLoad.b}';import{u$_ as u$_${depIndex}}from'${depLoad.s}';u$_${depIndex}(m$_${depIndex})`;
                    depLoad.s = undefined;
                }
                lastIndex = stripAssertion ? statementEnd : end + 1;
            } else if (dynamicImportIndex === -2) {
                load.m = {
                    url: load.r,
                    resolve: metaResolve
                };
                metaHook(load.m, load.u);
                pushStringTo(start);
                resolvedSource += `importShim._r[${urlJsString(load.u)}].m`;
                lastIndex = statementEnd;
            } else {
                pushStringTo(statementStart + 6);
                resolvedSource += `Shim${t === 5 ? '.source' : ''}(`;
                dynamicImportEndStack.push(statementEnd - 1);
                lastIndex = start;
            }
        }
        // support progressive cycle binding updates (try statement avoids tdz errors)
        if (load.s && (imports.length === 0 || imports[imports.length - 1].d === -1)) resolvedSource += `\n;import{u$_}from'${load.s}';try{u$_({${exports.filter((e)=>e.ln).map((param)=>{
            let { s, e, ln } = param;
            return `${source.slice(s, e)}:${ln}`;
        }).join(',')}})}catch(_){};\n`;
        function pushSourceURL(commentPrefix, commentStart) {
            const urlStart = commentStart + commentPrefix.length;
            const commentEnd = source.indexOf('\n', urlStart);
            const urlEnd = commentEnd !== -1 ? commentEnd : source.length;
            let sourceUrl = source.slice(urlStart, urlEnd);
            try {
                sourceUrl = new URL(sourceUrl, load.r).href;
            } catch  {}
            pushStringTo(urlStart);
            resolvedSource += sourceUrl;
            lastIndex = urlEnd;
        }
        let sourceURLCommentStart = source.lastIndexOf(sourceURLCommentPrefix);
        let sourceMapURLCommentStart = source.lastIndexOf(sourceMapURLCommentPrefix);
        // ignore sourceMap comments before already spliced code
        if (sourceURLCommentStart < lastIndex) sourceURLCommentStart = -1;
        if (sourceMapURLCommentStart < lastIndex) sourceMapURLCommentStart = -1;
        // sourceURL first / only
        if (sourceURLCommentStart !== -1 && (sourceMapURLCommentStart === -1 || sourceMapURLCommentStart > sourceURLCommentStart)) {
            pushSourceURL(sourceURLCommentPrefix, sourceURLCommentStart);
        }
        // sourceMappingURL
        if (sourceMapURLCommentStart !== -1) {
            pushSourceURL(sourceMapURLCommentPrefix, sourceMapURLCommentStart);
            // sourceURL last
            if (sourceURLCommentStart !== -1 && sourceURLCommentStart > sourceMapURLCommentStart) pushSourceURL(sourceURLCommentPrefix, sourceURLCommentStart);
        }
        pushStringTo(source.length);
        if (sourceURLCommentStart === -1) resolvedSource += sourceURLCommentPrefix + load.r;
        load.b = createBlob(resolvedSource);
        load.S = undefined;
    }
    const sourceURLCommentPrefix = '\n//# sourceURL=';
    const sourceMapURLCommentPrefix = '\n//# sourceMappingURL=';
    const jsContentType = /^(text|application)\/(x-)?javascript(;|$)/;
    const wasmContentType = /^application\/wasm(;|$)/;
    const jsonContentType = /^(text|application)\/json(;|$)/;
    const cssContentType = /^(text|application)\/css(;|$)/;
    const tsContentType = /^application\/typescript(;|$)|/;
    const cssUrlRegEx = /url\(\s*(?:(["'])((?:\\.|[^\n\\"'])+)\1|((?:\\.|[^\s,"'()\\])+))\s*\)/g;
    // restrict in-flight fetches to a pool of 100
    let p = [];
    let c = 0;
    function pushFetchPool() {
        if (++c > 100) return new Promise((r)=>p.push(r));
    }
    function popFetchPool() {
        c--;
        if (p.length) p.shift()();
    }
    async function doFetch(url, fetchOpts, parent) {
        if (enforceIntegrity && !fetchOpts.integrity) throw Error(`No integrity for ${url}${fromParent(parent)}.`);
        const poolQueue = pushFetchPool();
        if (poolQueue) await poolQueue;
        try {
            var res = await fetchHook(url, fetchOpts);
        } catch (e) {
            e.message = `Unable to fetch ${url}${fromParent(parent)} - see network log for details.\n` + e.message;
            throw e;
        } finally{
            popFetchPool();
        }
        if (!res.ok) {
            const error = new TypeError(`${res.status} ${res.statusText} ${res.url}${fromParent(parent)}`);
            error.response = res;
            throw error;
        }
        return res;
    }
    let esmsTsTransform;
    async function initTs() {
        const m = await import(tsTransform);
        if (!esmsTsTransform) esmsTsTransform = m.transform;
    }
    async function fetchModule(url, fetchOpts, parent) {
        const mapIntegrity = composedImportMap.integrity[url];
        const res = await doFetch(url, mapIntegrity && !fetchOpts.integrity ? Object.assign({}, fetchOpts, {
            integrity: mapIntegrity
        }) : fetchOpts, parent);
        const r = res.url;
        const contentType = res.headers.get('content-type');
        if (jsContentType.test(contentType)) return {
            r,
            s: await res.text(),
            t: 'js'
        };
        else if (wasmContentType.test(contentType)) {
            const module = await (sourceCache[r] || (sourceCache[r] = WebAssembly.compileStreaming(res)));
            sourceCache[r] = module;
            let s = '', i = 0, importObj = '';
            for (const impt of WebAssembly.Module.imports(module)){
                const specifier = urlJsString(impt.module);
                s += `import * as impt${i} from ${specifier};\n`;
                importObj += `${specifier}:impt${i++},`;
            }
            i = 0;
            s += `const instance = await WebAssembly.instantiate(importShim._s[${urlJsString(r)}], {${importObj}});\n`;
            for (const expt of WebAssembly.Module.exports(module)){
                s += `export const ${expt.name} = instance.exports['${expt.name}'];\n`;
            }
            return {
                r,
                s,
                t: 'wasm'
            };
        } else if (jsonContentType.test(contentType)) return {
            r,
            s: `export default ${await res.text()}`,
            t: 'json'
        };
        else if (cssContentType.test(contentType)) {
            return {
                r,
                s: `var s=new CSSStyleSheet();s.replaceSync(${JSON.stringify((await res.text()).replace(cssUrlRegEx, (_match, quotes, relUrl1, relUrl2)=>{
                    if (quotes === undefined) quotes = '';
                    return `url(${quotes}${resolveUrl(relUrl1 || relUrl2, url)}${quotes})`;
                }))});export default s;`,
                t: 'css'
            };
        } else if ((shimMode || typescriptEnabled) && (tsContentType.test(contentType) || url.endsWith('.ts') || url.endsWith('.mts'))) {
            const source = await res.text();
            if (!esmsTsTransform) await initTs();
            const transformed = esmsTsTransform(source, url);
            return {
                r,
                s: transformed === undefined ? source : transformed,
                t: transformed !== undefined ? 'ts' : 'js'
            };
        } else throw Error(`Unsupported Content-Type "${contentType}" loading ${url}${fromParent(parent)}. Modules must be served with a valid MIME type like application/javascript.`);
    }
    function isUnsupportedType(type) {
        if (type === 'css' && !cssModulesEnabled || type === 'json' && !jsonModulesEnabled || type === 'wasm' && !wasmModulesEnabled || type === 'ts' && !typescriptEnabled) throw featErr(`${type}-modules`);
        return type === 'css' && !supportsCssType || type === 'json' && !supportsJsonType || type === 'wasm' && !supportsWasmModules || type === 'ts';
    }
    function getOrCreateLoad(url, fetchOpts, parent, source) {
        if (source && registry[url]) {
            let i = 0;
            while(registry[url + ++i]);
            url += i;
        }
        let load = registry[url];
        if (load) return load;
        registry[url] = load = {
            // url
            u: url,
            // response url
            r: source ? url : undefined,
            // fetchPromise
            f: undefined,
            // source
            S: source,
            // linkPromise
            L: undefined,
            // analysis
            a: undefined,
            // deps
            d: undefined,
            // blobUrl
            b: undefined,
            // shellUrl
            s: undefined,
            // needsShim
            n: false,
            // shouldShim
            N: false,
            // type
            t: null,
            // meta
            m: null
        };
        load.f = (async ()=>{
            if (!load.S) {
                // preload fetch options override fetch options (race)
                ({ r: load.r, s: load.S, t: load.t } = await (fetchCache[url] || fetchModule(url, fetchOpts, parent)));
                if (!load.n && load.t !== 'js' && !shimMode && isUnsupportedType(load.t)) {
                    load.n = true;
                }
            }
            try {
                load.a = parse(load.S, load.u);
            } catch (e) {
                throwError(e);
                load.a = [
                    [],
                    [],
                    false
                ];
            }
            return load;
        })();
        return load;
    }
    const featErr = (feat)=>Error(`${feat} feature must be enabled via <script type="esms-options">{ "polyfillEnable": ["${feat}"] }<${''}/script>`);
    function linkLoad(load, fetchOpts) {
        if (load.L) return;
        load.L = load.f.then(async ()=>{
            let childFetchOpts = fetchOpts;
            load.d = load.a[0].map((param)=>{
                let { n, d, t, a } = param;
                const sourcePhase = t >= 4;
                if (sourcePhase) {
                    if (!shimMode && !sourcePhaseEnabled) throw featErr('source-phase');
                    if (!supportsSourcePhase) load.n = true;
                }
                if (a > 0) {
                    if (!shimMode && !cssModulesEnabled && !jsonModulesEnabled) throw featErr('css-modules / json-modules');
                    if (!supportsCssType && !supportsJsonType) load.n = true;
                }
                if (d !== -1 || !n) return;
                const resolved = resolve(n, load.r || load.u);
                if (resolved.n) load.n = true;
                if (d >= 0 || resolved.N) load.N = true;
                if (d !== -1) return;
                if (skip && skip(resolved.r) && !sourcePhase) return {
                    l: {
                        b: resolved.r
                    },
                    s: false
                };
                if (childFetchOpts.integrity) childFetchOpts = Object.assign({}, childFetchOpts, {
                    integrity: undefined
                });
                const child = {
                    l: getOrCreateLoad(resolved.r, childFetchOpts, load.r, null),
                    s: sourcePhase
                };
                if (!child.s) linkLoad(child.l, fetchOpts);
                // load, sourcePhase
                return child;
            }).filter((l)=>l);
        });
    }
    function processScriptsAndPreloads() {
        for (const link of document.querySelectorAll(shimMode ? 'link[rel=modulepreload-shim]' : 'link[rel=modulepreload]')){
            if (!link.ep) processPreload(link);
        }
        for (const script of document.querySelectorAll('script[type]')){
            if (script.type === 'importmap' + (shimMode ? '-shim' : '')) {
                if (!script.ep) processImportMap(script);
            } else if (script.type === 'module' + (shimMode ? '-shim' : '')) {
                legacyAcceptingImportMaps = false;
                if (!script.ep) processScript(script);
            }
        }
    }
    function getFetchOpts(script) {
        const fetchOpts = {};
        if (script.integrity) fetchOpts.integrity = script.integrity;
        if (script.referrerPolicy) fetchOpts.referrerPolicy = script.referrerPolicy;
        if (script.fetchPriority) fetchOpts.priority = script.fetchPriority;
        if (script.crossOrigin === 'use-credentials') fetchOpts.credentials = 'include';
        else if (script.crossOrigin === 'anonymous') fetchOpts.credentials = 'omit';
        else fetchOpts.credentials = 'same-origin';
        return fetchOpts;
    }
    let lastStaticLoadPromise = Promise.resolve();
    let domContentLoadedCnt = 1;
    function domContentLoadedCheck() {
        if (--domContentLoadedCnt === 0 && !noLoadEventRetriggers && (shimMode || !baselinePassthrough)) {
            document.dispatchEvent(new Event('DOMContentLoaded'));
        }
    }
    let loadCnt = 1;
    function loadCheck() {
        if (--loadCnt === 0 && !noLoadEventRetriggers && (shimMode || !baselinePassthrough)) {
            window.dispatchEvent(new Event('load'));
        }
    }
    // this should always trigger because we assume es-module-shims is itself a domcontentloaded requirement
    if (hasDocument) {
        document.addEventListener('DOMContentLoaded', async ()=>{
            await initPromise;
            domContentLoadedCheck();
        });
        window.addEventListener('load', async ()=>{
            await initPromise;
            loadCheck();
        });
    }
    let readyStateCompleteCnt = 1;
    function readyStateCompleteCheck() {
        if (--readyStateCompleteCnt === 0 && !noLoadEventRetriggers && (shimMode || !baselinePassthrough)) {
            document.dispatchEvent(new Event('readystatechange'));
        }
    }
    const hasNext = (script)=>script.nextSibling || script.parentNode && hasNext(script.parentNode);
    const epCheck = (script, ready)=>script.ep || !ready && (!script.src && !script.innerHTML || !hasNext(script)) || script.getAttribute('noshim') !== null || !(script.ep = true);
    function processImportMap(script, ready) {
        if (ready === undefined) ready = readyStateCompleteCnt > 0;
        if (epCheck(script, ready)) return;
        // we dont currently support external import maps in polyfill mode to match native
        if (script.src) {
            if (!shimMode) return;
            importMapSrc = true;
        }
        importMapPromise = importMapPromise.then(async ()=>{
            composedImportMap = resolveAndComposeImportMap(script.src ? await (await doFetch(script.src, getFetchOpts(script))).json() : JSON.parse(script.innerHTML), script.src || baseUrl, composedImportMap);
        }).catch((e)=>{
            if (e instanceof SyntaxError) e = new Error(`Unable to parse import map ${e.message} in: ${script.src || script.innerHTML}`);
            throwError(e);
        });
        if (!firstImportMap && legacyAcceptingImportMaps) importMapPromise.then(()=>firstImportMap = composedImportMap);
        if (!legacyAcceptingImportMaps && !multipleImportMaps) {
            multipleImportMaps = true;
            if (!shimMode && baselinePassthrough && !supportsMultipleImportMaps) {
                baselinePassthrough = false;
                if (hasDocument) attachMutationObserver();
            }
        }
        legacyAcceptingImportMaps = false;
    }
    function processScript(script, ready) {
        if (ready === undefined) ready = readyStateCompleteCnt > 0;
        if (epCheck(script, ready)) return;
        if (script.lang === 'ts' && !script.src) {
            const source = script.innerHTML;
            return initTs().then(()=>{
                const transformed = esmsTsTransform(source, baseUrl);
                if (transformed !== undefined) {
                    onpolyfill();
                    firstPolyfillLoad = false;
                }
                return topLevelLoad(baseUrl, getFetchOpts(script), transformed === undefined ? source : transformed, transformed === undefined, undefined);
            }).catch(throwError);
        }
        // does this load block readystate complete
        const isBlockingReadyScript = script.getAttribute('async') === null && readyStateCompleteCnt > 0;
        // does this load block DOMContentLoaded
        const isDomContentLoadedScript = domContentLoadedCnt > 0;
        const isLoadScript = loadCnt > 0;
        if (isLoadScript) loadCnt++;
        if (isBlockingReadyScript) readyStateCompleteCnt++;
        if (isDomContentLoadedScript) domContentLoadedCnt++;
        const loadPromise = topLevelLoad(script.src || baseUrl, getFetchOpts(script), !script.src && script.innerHTML, !shimMode, isBlockingReadyScript && lastStaticLoadPromise).catch(throwError);
        if (!noLoadEventRetriggers) loadPromise.then(()=>script.dispatchEvent(new Event('load')));
        if (isBlockingReadyScript) lastStaticLoadPromise = loadPromise.then(readyStateCompleteCheck);
        if (isDomContentLoadedScript) loadPromise.then(domContentLoadedCheck);
        if (isLoadScript) loadPromise.then(loadCheck);
    }
    const fetchCache = {};
    function processPreload(link) {
        link.ep = true;
        if (fetchCache[link.href]) return;
        fetchCache[link.href] = fetchModule(link.href, getFetchOpts(link));
    }
})();
