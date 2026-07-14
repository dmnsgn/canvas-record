/** ES Module Shims Wasm @version 2.8.1 */
(function () {

  const self_ = typeof globalThis !== 'undefined' ? globalThis : self;

  let invalidate;
  const hotReload$1 = url => invalidate(new URL(url, baseUrl).href);
  const initHotReload = (topLevelLoad, importShim) => {
    let _importHook = importHook,
      _resolveHook = resolveHook,
      _metaHook = metaHook;

    let defaultResolve;
    let hotResolveHook = (id, parent, _defaultResolve) => {
      if (!defaultResolve) defaultResolve = _defaultResolve;
      const originalParent = stripVersion(parent);
      const url = stripVersion(defaultResolve(id, originalParent));
      const hotState = getHotState(url);
      const parents = hotState.p;
      if (!parents.includes(originalParent)) parents.push(originalParent);
      return toVersioned(url, hotState);
    };
    const hotImportHook = (url, _, __, source, sourceType) => {
      const hotState = getHotState(url);
      hotState.e = typeof source === 'string' ? source : true;
      hotState.t = sourceType;
    };
    const hotMetaHook = (metaObj, url) => (metaObj.hot = new Hot(url));

    const Hot = class Hot {
      constructor(url) {
        this.data = getHotState((this.url = stripVersion(url))).d;
      }
      accept(deps, cb) {
        if (typeof deps === 'function') {
          cb = deps;
          deps = null;
        }
        const hotState = getHotState(this.url);
        if (!hotState.A) return;
        (hotState.a = hotState.a || []).push([
          typeof deps === 'string' ? defaultResolve(deps, this.url)
          : deps ? deps.map(d => defaultResolve(d, this.url))
          : null,
          cb
        ]);
      }
      dispose(cb) {
        getHotState(this.url).u = cb;
      }
      invalidate() {
        const hotState = getHotState(this.url);
        hotState.a = hotState.A = null;
        const seen = [this.url];
        hotState.p.forEach(p => invalidate(p, this.url, seen));
      }
    };

    const versionedRegEx = /\?v=\d+$/;
    const stripVersion = url => {
      const versionMatch = url.match(versionedRegEx);
      return versionMatch ? url.slice(0, -versionMatch[0].length) : url;
    };

    const toVersioned = (url, hotState) => {
      const { v } = hotState;
      return url + (v ? '?v=' + v : '');
    };

    let hotRegistry = {},
      curInvalidationRoots = new Set(),
      curInvalidationInterval;
    const getHotState = url =>
      hotRegistry[url] ||
      (hotRegistry[url] = {
        // version
        v: 0,
        // accept list ([deps, cb] pairs)
        a: null,
        // accepting acceptors
        A: true,
        // unload callback
        u: null,
        // entry point or inline script source
        e: false,
        // hot data
        d: {},
        // parents
        p: [],
        // source type
        t: undefined
      });

    invalidate = (url, fromUrl, seen = []) => {
      const hotState = hotRegistry[url];
      if (!hotState || seen.includes(url)) return false;
      seen.push(url);
      hotState.A = false;
      if (
        fromUrl &&
        hotState.a &&
        hotState.a.some(([d]) => d && (typeof d === 'string' ? d === fromUrl : d.includes(fromUrl)))
      ) {
        curInvalidationRoots.add(fromUrl);
      } else {
        if (hotState.e || hotState.a) curInvalidationRoots.add(url);
        hotState.v++;
        if (!hotState.a) hotState.p.forEach(p => invalidate(p, url, seen));
      }
      if (!curInvalidationInterval) curInvalidationInterval = setTimeout(handleInvalidations, hotReloadInterval);
      return true;
    };

    const handleInvalidations = () => {
      curInvalidationInterval = null;
      const earlyRoots = new Set();
      for (const root of curInvalidationRoots) {
        const hotState = hotRegistry[root];
        topLevelLoad(
          toVersioned(root, hotState),
          baseUrl,
          defaultFetchOpts,
          typeof hotState.e === 'string' ? hotState.e : undefined,
          false,
          undefined,
          hotState.t
        ).then(m => {
          if (hotState.a) {
            hotState.a.forEach(([d, c]) => d === null && !earlyRoots.has(c) && c(m));
            // unload should be the latest unload handler from the just loaded module
            if (hotState.u) {
              hotState.u(hotState.d);
              hotState.u = null;
            }
          }
          hotState.p.forEach(p => {
            const hotState = hotRegistry[p];
            if (hotState && hotState.a)
              hotState.a.forEach(
                async ([d, c]) =>
                  d &&
                  !earlyRoots.has(c) &&
                  (typeof d === 'string' ?
                    d === root && c(m)
                  : c(await Promise.all(d.map(d => (earlyRoots.push(c), importShim(toVersioned(d, getHotState(d))))))))
              );
          });
        }, throwError);
      }
      curInvalidationRoots = new Set();
    };

    setHooks(
      _importHook ? chain(_importHook, hotImportHook) : hotImportHook,
      _resolveHook ?
        (id, parent, defaultResolve) =>
          hotResolveHook(id, parent, (id, parent) => _resolveHook(id, parent, defaultResolve))
      : hotResolveHook,
      _metaHook ? chain(_metaHook, hotMetaHook) : hotMetaHook
    );
  };

  const hasDocument = typeof document !== 'undefined';

  const noop = () => {};

  const chain = (a, b) =>
    function () {
      a.apply(this, arguments);
      b.apply(this, arguments);
    };

  const dynamicImport = (u, _errUrl) => import(u);

  const defineValue = (obj, prop, value) =>
    Object.defineProperty(obj, prop, { writable: false, configurable: false, value });

  const optionsScript = hasDocument ? document.querySelector('script[type=esms-options]') : undefined;

  const esmsInitOptions = optionsScript ? JSON.parse(optionsScript.innerHTML) : {};
  Object.assign(esmsInitOptions, self_.esmsInitOptions || {});

  const version = "2.8.1";

  const r = esmsInitOptions.version;
  if (self_.importShim || (r && r !== version)) {
    return;
  }

  // shim mode is determined on initialization, no late shim mode
  const shimMode =
    esmsInitOptions.shimMode ||
    (hasDocument ?
      document.querySelectorAll('script[type=module-shim],script[type=importmap-shim],link[rel=modulepreload-shim]')
        .length > 0
      // Without a document, shim mode is always true as we cannot polyfill
    : true);

  let importHook,
    resolveHook,
    fetchHook = fetch,
    sourceHook,
    metaHook,
    tsTransform =
      esmsInitOptions.tsTransform ||
      (hasDocument && document.currentScript && document.currentScript.src.replace(/(\.\w+)?\.js$/, '-typescript.js')) ||
      './es-module-shims-typescript.js';

  const defaultFetchOpts = { credentials: 'same-origin' };

  const globalHook = name => (typeof name === 'string' ? self_[name] : name);

  if (esmsInitOptions.onimport) importHook = globalHook(esmsInitOptions.onimport);
  if (esmsInitOptions.resolve) resolveHook = globalHook(esmsInitOptions.resolve);
  if (esmsInitOptions.fetch) fetchHook = globalHook(esmsInitOptions.fetch);
  if (esmsInitOptions.source) sourceHook = globalHook(esmsInitOptions.source);
  if (esmsInitOptions.meta) metaHook = globalHook(esmsInitOptions.meta);

  const hasCustomizationHooks = importHook || resolveHook || fetchHook !== fetch || sourceHook || metaHook;

  const {
    noLoadEventRetriggers,
    enforceIntegrity,
    hotReload,
    hotReloadInterval = 100,
    nativePassthrough = !hasCustomizationHooks && !hotReload
  } = esmsInitOptions;

  const setHooks = (importHook_, resolveHook_, metaHook_) => (
    (importHook = importHook_),
    (resolveHook = resolveHook_),
    (metaHook = metaHook_)
  );

  const mapOverrides = esmsInitOptions.mapOverrides;

  let nonce = esmsInitOptions.nonce;
  if (!nonce && hasDocument) {
    const nonceElement = document.querySelector('script[nonce]');
    if (nonceElement) nonce = nonceElement.nonce || nonceElement.getAttribute('nonce');
  }

  const onerror = globalHook(esmsInitOptions.onerror || console.error.bind(console));

  const enable = Array.isArray(esmsInitOptions.polyfillEnable) ? esmsInitOptions.polyfillEnable : [];
  const disable = Array.isArray(esmsInitOptions.polyfillDisable) ? esmsInitOptions.polyfillDisable : [];

  const enableAll = esmsInitOptions.polyfillEnable === 'all' || enable.includes('all');
  const wasmInstancePhaseEnabled =
    enable.includes('wasm-modules') || enable.includes('wasm-module-instances') || enableAll;
  const wasmSourcePhaseEnabled =
    enable.includes('wasm-modules') || enable.includes('wasm-module-sources') || enableAll;
  const deferPhaseEnabled = enable.includes('import-defer') || enableAll;
  const cssModulesEnabled = !disable.includes('css-modules');
  const jsonModulesEnabled = !disable.includes('json-modules');

  const onpolyfill =
    esmsInitOptions.onpolyfill ?
      globalHook(esmsInitOptions.onpolyfill)
    : () => {
        console.log(`%c^^ Module error above is polyfilled and can be ignored ^^`, 'font-weight:900;color:#391');
      };

  const baseUrl =
    hasDocument ? document.baseURI
    : typeof location !== 'undefined' ?
      `${location.protocol}//${location.host}${
      location.pathname.includes('/') ?
        location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1)
      : location.pathname
    }`
    : 'about:blank';

  const createBlob = (source, type = 'text/javascript') => URL.createObjectURL(new Blob([source], { type }));
  let { skip } = esmsInitOptions;
  if (Array.isArray(skip)) {
    const l = skip.map(s => new URL(s, baseUrl).href);
    skip = s => l.some(i => (i[i.length - 1] === '/' && s.startsWith(i)) || s === i);
  } else if (typeof skip === 'string') {
    const r = new RegExp(skip);
    skip = s => r.test(s);
  } else if (skip instanceof RegExp) {
    skip = s => skip.test(s);
  }

  const dispatchError = error => self_.dispatchEvent(Object.assign(new Event('error'), { error }));

  const throwError = err => {
    (self_.reportError || dispatchError)(err);
    onerror(err);
  };

  const fromParent = parent => (parent ? ` imported from ${parent}` : '');

  const backslashRegEx = /\\/g;

  const asURL = url => {
    try {
      if (url.indexOf(':') !== -1) return new URL(url).href;
    } catch (_) {}
  };

  const resolveUrl = (relUrl, parentUrl) =>
    resolveIfNotPlainOrUrl(relUrl, parentUrl) || asURL(relUrl) || resolveIfNotPlainOrUrl('./' + relUrl, parentUrl);

  const resolveIfNotPlainOrUrl = (relUrl, parentUrl) => {
    const hIdx = parentUrl.indexOf('#'),
      qIdx = parentUrl.indexOf('?');
    if (hIdx + qIdx > -2)
      parentUrl = parentUrl.slice(
        0,
        hIdx === -1 ? qIdx
        : qIdx === -1 || qIdx > hIdx ? hIdx
        : qIdx
      );
    if (relUrl.indexOf('\\') !== -1) relUrl = relUrl.replace(backslashRegEx, '/');
    // protocol-relative
    if (relUrl[0] === '/' && relUrl[1] === '/') {
      return parentUrl.slice(0, parentUrl.indexOf(':') + 1) + relUrl;
    }
    // relative-url
    else if (
      (relUrl[0] === '.' &&
        (relUrl[1] === '/' ||
          (relUrl[1] === '.' && (relUrl[2] === '/' || (relUrl.length === 2 && (relUrl += '/')))) ||
          (relUrl.length === 1 && (relUrl += '/')))) ||
      relUrl[0] === '/'
    ) {
      const parentProtocol = parentUrl.slice(0, parentUrl.indexOf(':') + 1);
      if (parentProtocol === 'blob:') {
        throw new TypeError(
          `Failed to resolve module specifier "${relUrl}". Invalid relative url or base scheme isn't hierarchical.`
        );
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
      for (let i = 0; i < segmented.length; i++) {
        // busy reading a segment - only terminate on '/'
        if (segmentIndex !== -1) {
          if (segmented[i] === '/') {
            output.push(segmented.slice(segmentIndex, i + 1));
            segmentIndex = -1;
          }
          continue;
        }
        // new segment - check if it is relative
        else if (segmented[i] === '.') {
          // ../ segment
          if (segmented[i + 1] === '.' && (segmented[i + 2] === '/' || i + 2 === segmented.length)) {
            output.pop();
            i += 2;
            continue;
          }
          // ./ segment
          else if (segmented[i + 1] === '/' || i + 1 === segmented.length) {
            i += 1;
            continue;
          }
        }
        // it is the start of a new segment
        while (segmented[i] === '/') i++;
        segmentIndex = i;
      }
      // finish reading out the last segment
      if (segmentIndex !== -1) output.push(segmented.slice(segmentIndex));
      return parentUrl.slice(0, parentUrl.length - pathname.length) + output.join('');
    }
  };

  const resolveAndComposeImportMap = (json, baseUrl, parentMap) => {
    const outMap = {
      imports: { ...parentMap.imports },
      scopes: { ...parentMap.scopes },
      integrity: { ...parentMap.integrity }
    };

    if (json.imports) resolveAndComposePackages(json.imports, outMap.imports, baseUrl, parentMap);

    if (json.scopes)
      for (let s in json.scopes) {
        const resolvedScope = resolveUrl(s, baseUrl);
        resolveAndComposePackages(
          json.scopes[s],
          outMap.scopes[resolvedScope] || (outMap.scopes[resolvedScope] = {}),
          baseUrl,
          parentMap
        );
      }

    if (json.integrity) resolveAndComposeIntegrity(json.integrity, outMap.integrity, baseUrl);

    return outMap;
  };

  const getMatch = (path, matchObj) => {
    if (matchObj[path]) return path;
    let sepIndex = path.length;
    do {
      const segment = path.slice(0, sepIndex + 1);
      if (segment in matchObj) return segment;
    } while ((sepIndex = path.lastIndexOf('/', sepIndex - 1)) !== -1);
  };

  const applyPackages = (id, packages) => {
    const pkgName = getMatch(id, packages);
    if (pkgName) {
      const pkg = packages[pkgName];
      if (pkg === null) return;
      return pkg + id.slice(pkgName.length);
    }
  };

  const resolveImportMap = (importMap, resolvedOrPlain, parentUrl) => {
    let scopeUrl = parentUrl && getMatch(parentUrl, importMap.scopes);
    while (scopeUrl) {
      const packageResolution = applyPackages(resolvedOrPlain, importMap.scopes[scopeUrl]);
      if (packageResolution) return packageResolution;
      scopeUrl = getMatch(scopeUrl.slice(0, scopeUrl.lastIndexOf('/')), importMap.scopes);
    }
    return applyPackages(resolvedOrPlain, importMap.imports) || (resolvedOrPlain.indexOf(':') !== -1 && resolvedOrPlain);
  };

  const resolveAndComposePackages = (packages, outPackages, baseUrl, parentMap) => {
    for (let p in packages) {
      const resolvedLhs = resolveIfNotPlainOrUrl(p, baseUrl) || p;
      if (
        (!shimMode || !mapOverrides) &&
        outPackages[resolvedLhs] &&
        outPackages[resolvedLhs] !== packages[resolvedLhs]
      ) {
        console.warn(
          `es-module-shims: Rejected map override "${resolvedLhs}" from ${outPackages[resolvedLhs]} to ${packages[resolvedLhs]}.`
        );
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
  };

  const resolveAndComposeIntegrity = (integrity, outIntegrity, baseUrl) => {
    for (let p in integrity) {
      const resolvedLhs = resolveIfNotPlainOrUrl(p, baseUrl) || p;
      if (
        (!shimMode || !mapOverrides) &&
        outIntegrity[resolvedLhs] &&
        outIntegrity[resolvedLhs] !== integrity[resolvedLhs]
      ) {
        console.warn(
          `es-module-shims: Rejected map integrity override "${resolvedLhs}" from ${outIntegrity[resolvedLhs]} to ${integrity[resolvedLhs]}.`
        );
      }
      outIntegrity[resolvedLhs] = integrity[p];
    }
  };

  let policy;
  if (
    typeof self !== 'undefined' &&
    (typeof self.trustedTypes !== 'undefined' || typeof self.TrustedTypes !== 'undefined')
  ) {
    try {
      policy = (self.trustedTypes || self.TrustedTypes).createPolicy('es-module-shims', {
        createHTML: html => html,
        createScript: script => script
      });
    } catch {}
  }

  function maybeTrustedInnerHTML(html) {
    return policy ? policy.createHTML(html) : html;
  }

  function maybeTrustedScript(script) {
    return policy ? policy.createScript(script) : script;
  }

  // support browsers without dynamic import support (eg Firefox 6x)
  let supportsJsonType = false;
  let supportsCssType = false;

  const supports = hasDocument && HTMLScriptElement.supports;

  let supportsImportMaps = supports && supports.name === 'supports' && supports('importmap');
  let supportsWasmInstancePhase = false;
  let supportsWasmSourcePhase = false;
  let supportsMultipleImportMaps = false;

  const wasmBytes = [0, 97, 115, 109, 1, 0, 0, 0];

  let featureDetectionPromise = (async function () {
    if (!hasDocument)
      return Promise.all([
        import(createBlob(`import"${createBlob('{}', 'text/json')}"with{type:"json"}`)).then(
          () => (
            (supportsJsonType = true),
            import(createBlob(`import"${createBlob('', 'text/css')}"with{type:"css"}`)).then(
              () => (supportsCssType = true),
              noop
            )
          ),
          noop
        ),
        wasmInstancePhaseEnabled &&
          import(createBlob(`import"${createBlob(new Uint8Array(wasmBytes), 'application/wasm')}"`)).then(
            () => (supportsWasmInstancePhase = true),
            noop
          ),
        wasmSourcePhaseEnabled &&
          import(createBlob(`import source x from"${createBlob(new Uint8Array(wasmBytes), 'application/wasm')}"`)).then(
            () => (supportsWasmSourcePhase = true),
            noop
          )
      ]);

    const msgTag = `s${version}`;
    return new Promise(resolve => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.setAttribute('nonce', nonce);
      function cb({ data }) {
        const isFeatureDetectionMessage = Array.isArray(data) && data[0] === msgTag;
        if (!isFeatureDetectionMessage) return;
        [
          ,
          supportsImportMaps,
          supportsMultipleImportMaps,
          supportsJsonType,
          supportsCssType,
          supportsWasmSourcePhase,
          supportsWasmInstancePhase
        ] = data;
        resolve();
        document.head.removeChild(iframe);
        window.removeEventListener('message', cb, false);
      }
      window.addEventListener('message', cb, false);
      // Feature checking with careful avoidance of unnecessary work - all gated on initial import map supports check. CSS gates on JSON feature check, Wasm instance phase gates on wasm source phase check.
      const importMapTest = `<script nonce=${nonce || ''}>${
      policy ? 't=(window.trustedTypes||window.TrustedTypes).createPolicy("es-module-shims",{createScript:s=>s});' : ''
    }b=(s,type='text/javascript')=>URL.createObjectURL(new Blob([s],{type}));c=u=>import(u).then(()=>true,()=>false);i=innerText=>document.head.appendChild(Object.assign(document.createElement('script'),{type:'importmap',nonce:"${nonce}",text:${
      policy ? 't.createScript(innerText)' : 'innerText'
    }}));i(\`{"imports":{"x":"\${b('')}"}}\`);i(\`{"imports":{"y":"\${b('')}"}}\`);cm=${
      supportsImportMaps && jsonModulesEnabled ? `c(b(\`import"\${b('{}','text/json')}"with{type:"json"}\`))` : 'false'
    };sp=${
      supportsImportMaps && wasmSourcePhaseEnabled ?
        `c(b(\`import source x from "\${b(new Uint8Array(${JSON.stringify(wasmBytes)}),'application/wasm')\}"\`))`
      : 'false'
    };Promise.all([${supportsImportMaps ? 'true' : "c('x')"},${supportsImportMaps ? "c('y')" : false},cm,${
      supportsImportMaps && cssModulesEnabled ?
        `cm.then(s=>s?c(b(\`import"\${b('','text/css')\}"with{type:"css"}\`)):false)`
      : 'false'
    },sp,${
      supportsImportMaps && wasmInstancePhaseEnabled ?
        `${wasmSourcePhaseEnabled ? 'sp.then(s=>s?' : ''}c(b(\`import"\${b(new Uint8Array(${JSON.stringify(wasmBytes)}),'application/wasm')\}"\`))${wasmSourcePhaseEnabled ? ':false)' : ''}`
      : 'false'
    }]).then(a=>parent.postMessage(['${msgTag}'].concat(a),'*'))<${''}/script>`;

      // Safari will call onload eagerly on head injection, but we don't want the Wechat
      // path to trigger before setting srcdoc, therefore we track the timing
      let readyForOnload = false,
        onloadCalledWhileNotReady = false;
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
          s.innerText = maybeTrustedScript(importMapTest.slice(15 + (nonce ? nonce.length : 0), -9));
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
      if ('srcdoc' in iframe) iframe.srcdoc = maybeTrustedInnerHTML(importMapTest);
      else iframe.contentDocument.write(importMapTest);
      // retrigger onload for Safari only if necessary
      if (onloadCalledWhileNotReady) doOnload();
    });
  })();

  /* es-module-lexer 2.1.0 */
  var ImportType;!function(A){A[A.Static=1]="Static",A[A.Dynamic=2]="Dynamic",A[A.ImportMeta=3]="ImportMeta",A[A.StaticSourcePhase=4]="StaticSourcePhase",A[A.DynamicSourcePhase=5]="DynamicSourcePhase",A[A.StaticDeferPhase=6]="StaticDeferPhase",A[A.DynamicDeferPhase=7]="DynamicDeferPhase";}(ImportType||(ImportType={}));const A=1===new Uint8Array(new Uint16Array([1]).buffer)[0];function parse(E,g="@"){if(!C)return init.then((()=>parse(E)));const I=E.length+1,o=(C.__heap_base.value||C.__heap_base)+4*I-C.memory.buffer.byteLength;o>0&&C.memory.grow(Math.ceil(o/65536));const D=C.sa(I-1);if((A?B:Q)(E,new Uint16Array(C.memory.buffer,D,I)),!C.parse())throw Object.assign(new Error(`Parse error ${g}:${E.slice(0,C.e()).split("\n").length}:${C.e()-E.lastIndexOf("\n",C.e()-1)}`),{idx:C.e()});const K=[],k=[];for(;C.ri();){const A=C.is(),Q=C.ie(),B=C.it(),g=C.ai(),I=C.id(),o=C.ss(),D=C.se();let k;C.ip()&&(k=w(E.slice(-1===I?A-1:A,-1===I?Q+1:Q)));const i=[];for(C.rsa();C.ra();){const A=C.aks(),Q=C.ake(),B=C.avs(),g=C.ave();i.push([N(E.slice(A,Q)),N(E.slice(B,g))]);}K.push({n:k,t:B,s:A,e:Q,ss:o,se:D,d:I,a:g,at:i.length>0?i:null});}for(;C.re();){const A=C.es(),Q=C.ee(),B=C.els(),g=C.ele(),I=N(E.slice(A,Q)),o=B<0?void 0:N(E.slice(B,g));k.push({s:A,e:Q,ls:B,le:g,n:I,ln:o});}function w(A){try{return (0,eval)(A)}catch(A){}}function N(A){if(!A)return A;const Q=A[0];return ('"'===Q||"'"===Q)&&w(A)||A}return [K,k,!!C.f(),!!C.ms()]}function Q(A,Q){const B=A.length;let C=0;for(;C<B;){const B=A.charCodeAt(C);Q[C++]=(255&B)<<8|B>>>8;}}function B(A,Q){const B=A.length;let C=0;for(;C<B;)Q[C]=A.charCodeAt(C++);}let C;const E=()=>{return A="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","undefined"!=typeof Buffer?Buffer.from(A,"base64"):Uint8Array.from(atob(A),(A=>A.charCodeAt(0)));var A;};const init=WebAssembly.compile(E()).then(WebAssembly.instantiate).then((({exports:A})=>{C=A;}));

  const _resolve = (id, parentUrl = baseUrl) => {
    const urlResolved = resolveIfNotPlainOrUrl(id, parentUrl) || asURL(id);
    const firstResolved = firstImportMap && resolveImportMap(firstImportMap, urlResolved || id, parentUrl);
    const composedResolved =
      composedImportMap === firstImportMap ? firstResolved : (
        resolveImportMap(composedImportMap, urlResolved || id, parentUrl)
      );
    const resolved = composedResolved || firstResolved || throwUnresolved(id, parentUrl);
    // needsShim, shouldShim per load record to set on parent
    let n = false,
      N = false;
    if (!supportsImportMaps) {
      // bare specifier -> needs shim
      if (!urlResolved) n = true;
      // url mapping -> should shim
      else if (urlResolved !== resolved) N = true;
    } else if (!supportsMultipleImportMaps) {
      // bare specifier and not resolved by first import map -> needs shim
      if (!urlResolved && !firstResolved) n = true;
      // resolution doesn't match first import map -> should shim
      if (firstResolved && resolved !== firstResolved) N = true;
    }
    return { r: resolved, n, N };
  };

  const resolve = (id, parentUrl) => {
    if (!resolveHook) return _resolve(id, parentUrl);
    const result = resolveHook(id, parentUrl, defaultResolve);

    return result ? { r: result, n: true, N: true } : _resolve(id, parentUrl);
  };

  // import()
  async function importShim(id, opts, parentUrl) {
    if (typeof opts === 'string') {
      parentUrl = opts;
      opts = undefined;
    }
    await initPromise; // needed for shim check
    if (shimMode || !baselineSupport) {
      if (hasDocument) processScriptsAndPreloads();
      legacyAcceptingImportMaps = false;
    }
    let sourceType = undefined;
    if (typeof opts === 'object') {
      if (opts.lang === 'ts') sourceType = 'ts';
      if (typeof opts.with === 'object' && typeof opts.with.type === 'string') {
        sourceType = opts.with.type;
      }
    }
    return topLevelLoad(id, parentUrl || baseUrl, defaultFetchOpts, undefined, undefined, undefined, sourceType);
  }

  // import.source()
  // (opts not currently supported as no use cases yet)
  if (shimMode || wasmSourcePhaseEnabled)
    importShim.source = async (id, opts, parentUrl) => {
      if (typeof opts === 'string') {
        parentUrl = opts;
        opts = undefined;
      }
      await initPromise; // needed for shim check
      if (shimMode || !baselineSupport) {
        if (hasDocument) processScriptsAndPreloads();
        legacyAcceptingImportMaps = false;
      }
      await importMapPromise;
      const url = resolve(id, parentUrl || baseUrl).r;
      const load = getOrCreateLoad(url, defaultFetchOpts, undefined, undefined);
      await load.f;
      return importShim._s[load.r];
    };

  // import.defer() is just a proxy for import(), since we can't actually defer
  if (shimMode || deferPhaseEnabled) importShim.defer = importShim;

  if (hotReload) {
    initHotReload(topLevelLoad, importShim);
    importShim.hotReload = hotReload$1;
  }

  const defaultResolve = (id, parentUrl) => {
    return (
      resolveImportMap(composedImportMap, resolveIfNotPlainOrUrl(id, parentUrl) || id, parentUrl) ||
      throwUnresolved(id, parentUrl)
    );
  };

  const throwUnresolved = (id, parentUrl) => {
    throw Error(`Unable to resolve specifier '${id}'${fromParent(parentUrl)}`);
  };

  const metaResolve = function (id, parentUrl = this.url) {
    return resolve(id, `${parentUrl}`).r;
  };

  importShim.resolve = (id, parentUrl) => resolve(id, parentUrl).r;
  importShim.getImportMap = () => JSON.parse(JSON.stringify(composedImportMap));
  importShim.addImportMap = importMapIn => {
    if (!shimMode) throw new Error('Unsupported in polyfill mode.');
    composedImportMap = resolveAndComposeImportMap(importMapIn, baseUrl, composedImportMap);
  };
  importShim.version = version;

  const registry = (importShim._r = {});
  // Wasm caches
  const sourceCache = (importShim._s = {});
  /* const instanceCache = */ importShim._i = new WeakMap();

  // Ensure this version is the only version
  defineValue(self_, 'importShim', Object.freeze(importShim));
  const shimModeOptions = { ...esmsInitOptions, shimMode: true };
  if (optionsScript) optionsScript.innerText = maybeTrustedScript(JSON.stringify(shimModeOptions));
  self_.esmsInitOptions = shimModeOptions;

  const loadAll = async (load, seen) => {
    seen[load.u] = 1;
    await load.L;
    await Promise.all(
      load.d.map(({ l: dep, s: sourcePhase }) => {
        if (dep.b || seen[dep.u]) return;
        if (sourcePhase) return dep.f;
        return loadAll(dep, seen);
      })
    );
  };

  let importMapSrc = false;
  let multipleImportMaps = false;
  let firstImportMap = null;
  // To support polyfilling multiple import maps, we separately track the composed import map from the first import map
  let composedImportMap = { imports: {}, scopes: {}, integrity: {} };
  let baselineSupport;

  const initPromise = featureDetectionPromise.then(() => {
    baselineSupport =
      supportsImportMaps &&
      (!jsonModulesEnabled || supportsJsonType) &&
      (!cssModulesEnabled || supportsCssType) &&
      (!wasmInstancePhaseEnabled || supportsWasmInstancePhase) &&
      (!wasmSourcePhaseEnabled || supportsWasmSourcePhase) &&
      !deferPhaseEnabled &&
      (!multipleImportMaps || supportsMultipleImportMaps) &&
      !importMapSrc &&
      !hasCustomizationHooks;
    if (!shimMode && typeof WebAssembly !== 'undefined') {
      if (wasmSourcePhaseEnabled && !Object.getPrototypeOf(WebAssembly.Module).name) {
        const s = Symbol();
        const brand = m => defineValue(m, s, 'WebAssembly.Module');
        class AbstractModuleSource {
          get [Symbol.toStringTag]() {
            if (this[s]) return this[s];
            throw new TypeError('Not an AbstractModuleSource');
          }
        }
        const { Module: wasmModule, compile: wasmCompile, compileStreaming: wasmCompileStreaming } = WebAssembly;
        WebAssembly.Module = Object.setPrototypeOf(
          Object.assign(function Module(...args) {
            return brand(new wasmModule(...args));
          }, wasmModule),
          AbstractModuleSource
        );
        WebAssembly.Module.prototype = Object.setPrototypeOf(wasmModule.prototype, AbstractModuleSource.prototype);
        WebAssembly.compile = function compile(...args) {
          return wasmCompile(...args).then(brand);
        };
        WebAssembly.compileStreaming = function compileStreaming(...args) {
          return wasmCompileStreaming(...args).then(brand);
        };
      }
    }
    if (hasDocument) {
      if (!supportsImportMaps) {
        const supports = HTMLScriptElement.supports || (type => type === 'classic' || type === 'module');
        HTMLScriptElement.supports = type => type === 'importmap' || supports(type);
      }
      if (shimMode || !baselineSupport) {
        attachMutationObserver();
        if (document.readyState === 'complete') {
          readyStateCompleteCheck();
        } else {
          document.addEventListener('readystatechange', readyListener);
        }
      }
      processScriptsAndPreloads();
    }
    return init;
  });

  const attachMutationObserver = () => {
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type !== 'childList') continue;
        for (const node of mutation.addedNodes) {
          if (node.tagName === 'SCRIPT') {
            if (node.type === (shimMode ? 'module-shim' : 'module') && !node.ep) processScript(node, true);
            if (node.type === (shimMode ? 'importmap-shim' : 'importmap') && !node.ep) processImportMap(node, true);
          } else if (
            node.tagName === 'LINK' &&
            node.rel === (shimMode ? 'modulepreload-shim' : 'modulepreload') &&
            !node.ep
          ) {
            processPreload(node);
          }
        }
      }
    });
    observer.observe(document, { childList: true });
    observer.observe(document.head, { childList: true });
    processScriptsAndPreloads();
  };

  let importMapPromise = initPromise;
  let firstPolyfillLoad = true;
  let legacyAcceptingImportMaps = true;

  async function topLevelLoad(
    url,
    parentUrl,
    fetchOpts,
    source,
    nativelyLoaded,
    lastStaticLoadPromise,
    sourceType
  ) {
    await initPromise;
    await importMapPromise;
    url = (await resolve(url, parentUrl)).r;

    // we mock import('./x.css', { with: { type: 'css' }}) support via an inline static reexport
    // because we can't syntactically pass through to dynamic import with a second argument
    if (sourceType === 'css' || sourceType === 'json') {
      // Direct reexport for hot reloading skipped due to Firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=1965620
      source = `import m from'${url}'with{type:"${sourceType}"};export default m;`;
      url += '?entry';
    }

    if (importHook) await importHook(url, typeof fetchOpts !== 'string' ? fetchOpts : {}, parentUrl, source, sourceType);
    // early analysis opt-out - no need to even fetch if we have feature support
    if (!shimMode && baselineSupport && nativePassthrough && sourceType !== 'ts') {
      // for polyfill case, only dynamic import needs a return value here, and dynamic import will never pass nativelyLoaded
      if (nativelyLoaded) return null;
      await lastStaticLoadPromise;
      return dynamicImport(source ? createBlob(source) : url);
    }
    const load = getOrCreateLoad(url, fetchOpts, undefined, source);
    linkLoad(load, fetchOpts);
    const seen = {};
    await loadAll(load, seen);
    resolveDeps(load, seen);
    await lastStaticLoadPromise;
    if (!shimMode && !load.n) {
      if (nativelyLoaded) {
        return;
      }
      if (source) {
        return await dynamicImport(createBlob(source));
      }
    }
    if (firstPolyfillLoad && !shimMode && load.n && nativelyLoaded) {
      onpolyfill();
      firstPolyfillLoad = false;
    }
    const module = await (shimMode || load.n || load.N || !nativePassthrough || (!nativelyLoaded && source) ?
      dynamicImport(load.b, load.u)
    : import(load.u));
    // if the top-level load is a shell, run its update function
    if (load.s) (await dynamicImport(load.s, load.u)).u$_(module);
    revokeObjectURLs(Object.keys(seen));
    return module;
  }

  const revokeObjectURLs = registryKeys => {
    let curIdx = 0;
    const handler = self_.requestIdleCallback || self_.requestAnimationFrame || (fn => setTimeout(fn, 0));
    handler(cleanup);
    function cleanup() {
      for (const key of registryKeys.slice(curIdx, (curIdx += 100))) {
        const load = registry[key];
        if (load && load.b && load.b !== load.u) URL.revokeObjectURL(load.b);
      }
      if (curIdx < registryKeys.length) handler(cleanup);
    }
  };

  const urlJsString = url => `'${url.replace(/'/g, "\\'")}'`;

  let resolvedSource, lastIndex;
  const pushStringTo = (load, originalIndex, dynamicImportEndStack) => {
    while (dynamicImportEndStack[dynamicImportEndStack.length - 1] < originalIndex) {
      const dynamicImportEnd = dynamicImportEndStack.pop();
      resolvedSource += `${load.S.slice(lastIndex, dynamicImportEnd)}, ${urlJsString(load.r)}`;
      lastIndex = dynamicImportEnd;
    }
    resolvedSource += load.S.slice(lastIndex, originalIndex);
    lastIndex = originalIndex;
  };

  const pushSourceURL = (load, commentPrefix, commentStart, dynamicImportEndStack) => {
    const urlStart = commentStart + commentPrefix.length;
    const commentEnd = load.S.indexOf('\n', urlStart);
    const urlEnd = commentEnd !== -1 ? commentEnd : load.S.length;
    let sourceUrl = load.S.slice(urlStart, urlEnd);
    try {
      sourceUrl = new URL(sourceUrl, load.r).href;
    } catch (e) {}
    pushStringTo(load, urlStart, dynamicImportEndStack);
    resolvedSource += sourceUrl;
    lastIndex = urlEnd;
  };

  const resolveDeps = (load, seen) => {
    if (load.b || !seen[load.u]) return;
    seen[load.u] = 0;

    for (const { l: dep, s: sourcePhase } of load.d) {
      if (!sourcePhase) resolveDeps(dep, seen);
    }

    if (!load.n) load.n = load.d.some(dep => dep.l.n);
    if (!load.N) load.N = load.d.some(dep => dep.l.N);

    // use native loader whenever possible (n = needs shim) via executable subgraph passthrough
    // so long as the module doesn't use dynamic import or unsupported URL mappings (N = should shim)
    if (nativePassthrough && !shimMode && !load.n && !load.N) {
      load.b = load.u;
      load.S = undefined;
      return;
    }

    const [imports, exports] = load.a;

    // "execution"
    let source = load.S,
      depIndex = 0,
      dynamicImportEndStack = [];

    // once all deps have loaded we can inline the dependency resolution blobs
    // and define this blob
    resolvedSource = '';
    lastIndex = 0;

    for (const { s: start, e: end, ss: statementStart, se: statementEnd, d: dynamicImportIndex, t, a, at } of imports) {
      // source phase
      if (t === 4) {
        let { l: depLoad } = load.d[depIndex++];
        pushStringTo(load, statementStart, dynamicImportEndStack);
        resolvedSource += `${source.slice(statementStart, start - 1).replace('source', '')}/*${source.slice(start - 1, end + 1)}*/'${createBlob(`export default importShim._s[${urlJsString(depLoad.r)}]`)}'`;
        lastIndex = end + 1;
      }
      // dependency source replacements
      else if (dynamicImportIndex === -1) {
        let keepAssertion = false;
        if (a > 0 && !shimMode) {
          // strip assertions only when unsupported in polyfill mode
          keepAssertion =
            nativePassthrough &&
            ((supportsJsonType && at.some(([s, t]) => s === 'type' && t === 'json')) ||
              (supportsCssType && at.some(([s, t]) => s === 'type' && t === 'css')));
        }

        // defer phase stripping
        if (t === 6) {
          pushStringTo(load, statementStart, dynamicImportEndStack);
          resolvedSource += source.slice(statementStart, start - 1).replace('defer', '');
          lastIndex = start;
        }
        let { l: depLoad } = load.d[depIndex++],
          blobUrl = depLoad.b,
          cycleShell = !blobUrl;
        if (cycleShell) {
          // circular shell creation
          if (!(blobUrl = depLoad.s)) {
            blobUrl = depLoad.s = createBlob(
              `export function u$_(m){${depLoad.a[1]
              .map(({ s, e }, i) => {
                const q = depLoad.S[s] === '"' || depLoad.S[s] === "'";
                return `e$_${i}=m${q ? `[` : '.'}${depLoad.S.slice(s, e)}${q ? `]` : ''}`;
              })
              .join(',')}}${
              depLoad.a[1].length ? `let ${depLoad.a[1].map((_, i) => `e$_${i}`).join(',')};` : ''
            }export {${depLoad.a[1]
              .map(({ s, e }, i) => `e$_${i} as ${depLoad.S.slice(s, e)}`)
              .join(',')}}\n//# sourceURL=${depLoad.r}?cycle`
            );
          }
        }

        pushStringTo(load, start - 1, dynamicImportEndStack);
        resolvedSource += `/*${source.slice(start - 1, end + 1)}*/'${blobUrl}'`;

        // circular shell execution
        if (!cycleShell && depLoad.s) {
          resolvedSource += `;import*as m$_${depIndex} from'${depLoad.b}';import{u$_ as u$_${depIndex}}from'${depLoad.s}';u$_${depIndex}(m$_${depIndex})`;
          depLoad.s = undefined;
        }
        lastIndex = keepAssertion ? end + 1 : statementEnd;
      }
      // import.meta
      else if (dynamicImportIndex === -2) {
        load.m = { url: load.r, resolve: metaResolve };
        if (metaHook) metaHook(load.m, load.u);
        pushStringTo(load, start, dynamicImportEndStack);
        resolvedSource += `importShim._r[${urlJsString(load.u)}].m`;
        lastIndex = statementEnd;
      }
      // dynamic import
      else {
        pushStringTo(load, statementStart + 6, dynamicImportEndStack);
        resolvedSource += `Shim${t === 5 ? '.source' : ''}(`;
        dynamicImportEndStack.push(statementEnd - 1);
        lastIndex = start;
      }
    }

    // support progressive cycle binding updates (try statement avoids tdz errors)
    if (load.s && (imports.length === 0 || imports[imports.length - 1].d === -1))
      resolvedSource += `\n;import{u$_}from'${load.s}';try{u$_({${exports
      .filter(e => e.ln)
      .map(({ s, e, ln }) => `${source.slice(s, e)}:${ln}`)
      .join(',')}})}catch(_){};\n`;

    let sourceURLCommentStart = source.lastIndexOf(sourceURLCommentPrefix);
    let sourceMapURLCommentStart = source.lastIndexOf(sourceMapURLCommentPrefix);

    // ignore sourceMap comments before already spliced code
    if (sourceURLCommentStart < lastIndex) sourceURLCommentStart = -1;
    if (sourceMapURLCommentStart < lastIndex) sourceMapURLCommentStart = -1;

    // sourceURL first / only
    if (
      sourceURLCommentStart !== -1 &&
      (sourceMapURLCommentStart === -1 || sourceMapURLCommentStart > sourceURLCommentStart)
    ) {
      pushSourceURL(load, sourceURLCommentPrefix, sourceURLCommentStart, dynamicImportEndStack);
    }
    // sourceMappingURL
    if (sourceMapURLCommentStart !== -1) {
      pushSourceURL(load, sourceMapURLCommentPrefix, sourceMapURLCommentStart, dynamicImportEndStack);
      // sourceURL last
      if (sourceURLCommentStart !== -1 && sourceURLCommentStart > sourceMapURLCommentStart)
        pushSourceURL(load, sourceURLCommentPrefix, sourceURLCommentStart, dynamicImportEndStack);
    }

    pushStringTo(load, source.length, dynamicImportEndStack);

    if (sourceURLCommentStart === -1) resolvedSource += sourceURLCommentPrefix + load.r;

    load.b = createBlob(resolvedSource);
    load.S = resolvedSource = undefined;
  };

  const sourceURLCommentPrefix = '\n//# sourceURL=';
  const sourceMapURLCommentPrefix = '\n//# sourceMappingURL=';
  const cssUrlRegEx = /url\(\s*(?:(["'])((?:\\.|[^\n\\"'])+)\1|((?:\\.|[^\s,"'()\\])+))\s*\)/g;

  // restrict in-flight fetches to a pool of 100
  let p = [];
  let c = 0;
  const pushFetchPool = () => {
    if (++c > 100) return new Promise(r => p.push(r));
  };
  const popFetchPool = () => {
    c--;
    if (p.length) p.shift()();
  };

  const doFetch = async (url, fetchOpts, parent) => {
    if (enforceIntegrity && !fetchOpts.integrity) throw Error(`No integrity for ${url}${fromParent(parent)}.`);
    let res,
      poolQueue = pushFetchPool();
    if (poolQueue) await poolQueue;
    try {
      res = await fetchHook(url, fetchOpts);
    } catch (e) {
      e.message = `Unable to fetch ${url}${fromParent(parent)} - see network log for details.\n` + e.message;
      throw e;
    } finally {
      popFetchPool();
    }

    if (!res.ok) {
      const error = new TypeError(`${res.status} ${res.statusText} ${res.url}${fromParent(parent)}`);
      error.response = res;
      throw error;
    }
    return res;
  };

  let esmsTsTransform;
  const initTs = async () => {
    const m = await import(tsTransform);
    if (!esmsTsTransform) esmsTsTransform = m.transform;
  };

  async function defaultSourceHook(url, fetchOpts, parent) {
    let res = await doFetch(url, fetchOpts, parent),
      contentType,
      [, json, type, jsts] =
        (contentType = res.headers.get('content-type') || '').match(
          /^(?:[^/;]+\/(?:[^/+;]+\+)?(json)|(?:text|application)\/(?:x-)?((java|type)script|wasm|css))(?:;|$)/
        ) || [];
    if (!(type = json || (jsts ? jsts[0] + 's' : type || (/\.m?ts(\?|#|$)/.test(url) && 'ts')))) {
      throw Error(
        `Unsupported Content-Type "${contentType}" loading ${url}${fromParent(parent)}. Modules must be served with a valid MIME type like application/javascript.`
      );
    }
    return {
      url: res.url,
      source: await (type > 'v' ? WebAssembly.compileStreaming(res) : res.text()),
      type
    };
  }

  const hotPrefix = 'var h=import.meta.hot,';
  const fetchModule = async (reqUrl, fetchOpts, parent) => {
    const mapIntegrity = composedImportMap.integrity[reqUrl];
    fetchOpts = mapIntegrity && !fetchOpts.integrity ? { ...fetchOpts, integrity: mapIntegrity } : fetchOpts;
    let {
      url = reqUrl,
      source,
      type
    } = (await (sourceHook || defaultSourceHook)(reqUrl, fetchOpts, parent, defaultSourceHook)) || {};
    if (type === 'wasm') {
      const exports = WebAssembly.Module.exports((sourceCache[url] = source));
      const imports = WebAssembly.Module.imports(source);
      const rStr = urlJsString(url);
      source = `import*as $_ns from${rStr};`;
      let i = 0,
        obj = '';
      for (const { module, kind } of imports) {
        const specifier = urlJsString(module);
        source += `import*as impt${i} from${specifier};\n`;
        obj += `${specifier}:${kind === 'global' ? `importShim._i.get(impt${i})||impt${i++}` : `impt${i++}`},`;
      }
      source += `${hotPrefix}i=await WebAssembly.instantiate(importShim._s[${rStr}],{${obj}});importShim._i.set($_ns,i);`;
      obj = '';
      for (const { name, kind } of exports) {
        source += `export let ${name}=i.exports['${name}'];`;
        if (kind === 'global') source += `try{${name}=${name}.value}catch(_){${name}=undefined}`;
        obj += `${name},`;
      }
      source += `if(h)h.accept(m=>({${obj}}=m))`;
    } else if (type === 'json') {
      source = `${hotPrefix}j=JSON.parse(${JSON.stringify(source)});export{j as default};if(h)h.accept(m=>j=m.default)`;
    } else if (type === 'css') {
      source = `${hotPrefix}s=h&&h.data.s||new CSSStyleSheet();s.replaceSync(${JSON.stringify(
      source.replace(
        cssUrlRegEx,
        (_match, quotes = '', relUrl1, relUrl2) => `url(${quotes}${resolveUrl(relUrl1 || relUrl2, url)}${quotes})`
      )
    )});if(h){h.data.s=s;h.accept(()=>{})}export default s`;
    } else if (type === 'ts') {
      if (!esmsTsTransform) await initTs();
      const transformed = esmsTsTransform(source, url);
      // even if the TypeScript is valid JavaScript, unless it was a top-level inline source, it wasn't served with
      // a valid JS MIME here, so we must still polyfill it
      source = transformed === undefined ? source : transformed;
    }
    return { url, source, type };
  };

  const getOrCreateLoad = (url, fetchOpts, parent, source) => {
    if (source && registry[url]) {
      let i = 0;
      while (registry[url + '#' + ++i]);
      url += '#' + i;
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
      // needsShim: does it fail execution in the current native loader?
      n: false,
      // shouldShim: does it need to be loaded by the polyfill loader?
      N: false,
      // type
      t: null,
      // meta
      m: null
    };
    load.f = (async () => {
      if (load.S === undefined) {
        // preload fetch options override fetch options (race)
        ({ url: load.r, source: load.S, type: load.t } = await (fetchCache[url] || fetchModule(url, fetchOpts, parent)));
        if (
          !load.n &&
          load.t !== 'js' &&
          !shimMode &&
          ((load.t === 'css' && !supportsCssType) ||
            (load.t === 'json' && !supportsJsonType) ||
            (load.t === 'wasm' && !supportsWasmInstancePhase && !supportsWasmSourcePhase) ||
            load.t === 'ts')
        ) {
          load.n = true;
        }
      }
      try {
        load.a = parse(load.S, load.u);
      } catch (e) {
        throwError(e);
        load.a = [[], [], false];
      }
      return load;
    })();
    return load;
  };

  const featErr = feat =>
    Error(
      `${feat} feature must be enabled via <script type="esms-options">{ "polyfillEnable": ["${feat}"] }<${''}/script>`
    );

  const linkLoad = (load, fetchOpts) => {
    if (load.L) return;
    load.L = load.f.then(() => {
      let childFetchOpts = fetchOpts;
      load.d = load.a[0]
        .map(({ n, d, t, a, se }) => {
          const phaseImport = t >= 4;
          const sourcePhase = phaseImport && t < 6;
          if (phaseImport) {
            if (!shimMode && (sourcePhase ? !wasmSourcePhaseEnabled : !deferPhaseEnabled))
              throw featErr(sourcePhase ? 'wasm-module-sources' : 'import-defer');
            if (!sourcePhase || !supportsWasmSourcePhase) load.n = true;
          }
          let source = undefined;
          if (a > 0 && !shimMode && nativePassthrough) {
            const assertion = load.S.slice(a, se - 1);
            // no need to fetch JSON/CSS if supported, since it's a leaf node, we'll just strip the assertion syntax
            if (assertion.includes('json')) {
              if (supportsJsonType) source = '';
              else load.n = true;
            } else if (assertion.includes('css')) {
              if (supportsCssType) source = '';
              else load.n = true;
            }
          }
          if (d !== -1 || !n) return;
          const resolved = resolve(n, load.r || load.u);
          if (resolved.n || hasCustomizationHooks) load.n = true;
          if (d >= 0 || resolved.N) load.N = true;
          if (d !== -1) return;
          if (skip && skip(resolved.r) && !sourcePhase) return { l: { b: resolved.r }, s: false };
          if (childFetchOpts.integrity) childFetchOpts = { ...childFetchOpts, integrity: undefined };
          const child = { l: getOrCreateLoad(resolved.r, childFetchOpts, load.r, source), s: sourcePhase };
          // assertion case -> inline the CSS / JSON URL directly
          if (source === '') child.l.b = child.l.u;
          if (!child.s) linkLoad(child.l, fetchOpts);
          // load, sourcePhase
          return child;
        })
        .filter(l => l);
    });
  };

  const processScriptsAndPreloads = () => {
    for (const link of document.querySelectorAll(shimMode ? 'link[rel=modulepreload-shim]' : 'link[rel=modulepreload]')) {
      if (!link.ep) processPreload(link);
    }
    for (const script of document.querySelectorAll('script[type]')) {
      if (script.type === 'importmap' + (shimMode ? '-shim' : '')) {
        if (!script.ep) processImportMap(script);
      } else if (script.type === 'module' + (shimMode ? '-shim' : '')) {
        legacyAcceptingImportMaps = false;
        if (!script.ep) processScript(script);
      }
    }
  };

  const getFetchOpts = script => {
    const fetchOpts = {};
    if (script.integrity) fetchOpts.integrity = script.integrity;
    if (script.referrerPolicy) fetchOpts.referrerPolicy = script.referrerPolicy;
    if (script.fetchPriority) fetchOpts.priority = script.fetchPriority;
    if (script.crossOrigin === 'use-credentials') fetchOpts.credentials = 'include';
    else if (script.crossOrigin === 'anonymous') fetchOpts.credentials = 'omit';
    else fetchOpts.credentials = 'same-origin';
    return fetchOpts;
  };

  let lastStaticLoadPromise = Promise.resolve();

  let domContentLoaded = false;
  let domContentLoadedCnt = 1;
  const domContentLoadedCheck = m => {
    if (m === undefined) {
      if (domContentLoaded) return;
      domContentLoaded = true;
      domContentLoadedCnt--;
    }
    if (--domContentLoadedCnt === 0 && !noLoadEventRetriggers && (shimMode || !baselineSupport)) {
      document.removeEventListener('DOMContentLoaded', domContentLoadedEvent);
      document.dispatchEvent(new Event('DOMContentLoaded'));
    }
  };
  let loadCnt = 1;
  const loadCheck = () => {
    if (--loadCnt === 0 && !noLoadEventRetriggers && (shimMode || !baselineSupport)) {
      window.removeEventListener('load', loadEvent);
      window.dispatchEvent(new Event('load'));
    }
  };

  const domContentLoadedEvent = async () => {
    await initPromise;
    domContentLoadedCheck();
  };
  const loadEvent = async () => {
    await initPromise;
    domContentLoadedCheck();
    loadCheck();
  };

  // this should always trigger because we assume es-module-shims is itself a domcontentloaded requirement
  if (hasDocument) {
    document.addEventListener('DOMContentLoaded', domContentLoadedEvent);
    window.addEventListener('load', loadEvent);
  }

  const readyListener = async () => {
    await initPromise;
    processScriptsAndPreloads();
    if (document.readyState === 'complete') {
      readyStateCompleteCheck();
    }
  };

  let readyStateCompleteCnt = 1;
  const readyStateCompleteCheck = () => {
    if (--readyStateCompleteCnt === 0) {
      domContentLoadedCheck();
      if (!noLoadEventRetriggers && (shimMode || !baselineSupport)) {
        document.removeEventListener('readystatechange', readyListener);
        document.dispatchEvent(new Event('readystatechange'));
      }
    }
  };

  const hasNext = script => script.nextSibling || (script.parentNode && hasNext(script.parentNode));
  const epCheck = (script, ready) =>
    script.ep ||
    (!ready && ((!script.src && !script.innerHTML) || !hasNext(script))) ||
    script.getAttribute('noshim') !== null ||
    !(script.ep = true);

  const processImportMap = (script, ready = readyStateCompleteCnt > 0) => {
    if (epCheck(script, ready)) return;
    // we dont currently support external import maps in polyfill mode to match native
    if (script.src) {
      if (!shimMode) return;
      importMapSrc = true;
    }
    importMapPromise = importMapPromise
      .then(async () => {
        composedImportMap = resolveAndComposeImportMap(
          script.src ? await (await doFetch(script.src, getFetchOpts(script))).json() : JSON.parse(script.innerHTML),
          script.src || baseUrl,
          composedImportMap
        );
      })
      .catch(e => {
        if (e instanceof SyntaxError)
          e = new Error(`Unable to parse import map ${e.message} in: ${script.src || script.innerHTML}`);
        throwError(e);
      });
    if (!firstImportMap && legacyAcceptingImportMaps) importMapPromise.then(() => (firstImportMap = composedImportMap));
    if (!legacyAcceptingImportMaps && !multipleImportMaps) {
      multipleImportMaps = true;
      if (!shimMode && baselineSupport && !supportsMultipleImportMaps) {
        baselineSupport = false;
        if (hasDocument) attachMutationObserver();
      }
    }
    legacyAcceptingImportMaps = false;
  };

  const processScript = (script, ready = readyStateCompleteCnt > 0) => {
    if (epCheck(script, ready)) return;
    // does this load block readystate complete
    const isBlockingReadyScript = script.getAttribute('async') === null && readyStateCompleteCnt > 0;
    // does this load block DOMContentLoaded
    const isDomContentLoadedScript = domContentLoadedCnt > 0;
    const isLoadScript = loadCnt > 0;
    if (isLoadScript) loadCnt++;
    if (isBlockingReadyScript) readyStateCompleteCnt++;
    if (isDomContentLoadedScript) domContentLoadedCnt++;
    let loadPromise;
    const ts = script.lang === 'ts';
    if (ts && !script.src) {
      loadPromise = Promise.resolve(esmsTsTransform || initTs())
        .then(() => {
          const transformed = esmsTsTransform(script.innerHTML, baseUrl);
          if (transformed !== undefined) {
            onpolyfill();
            firstPolyfillLoad = false;
          }
          return topLevelLoad(
            script.src || baseUrl,
            baseUrl,
            getFetchOpts(script),
            transformed === undefined ? script.innerHTML : transformed,
            !shimMode && transformed === undefined,
            isBlockingReadyScript && lastStaticLoadPromise,
            'ts'
          );
        })
        .catch(throwError);
    } else {
      loadPromise = topLevelLoad(
        script.src || baseUrl,
        baseUrl,
        getFetchOpts(script),
        !script.src ? script.innerHTML : undefined,
        !shimMode,
        isBlockingReadyScript && lastStaticLoadPromise,
        ts ? 'ts' : undefined
      ).catch(throwError);
    }
    if (!noLoadEventRetriggers) loadPromise.then(() => script.dispatchEvent(new Event('load')));
    if (isBlockingReadyScript && !ts) {
      lastStaticLoadPromise = loadPromise.then(readyStateCompleteCheck);
    }
    if (isDomContentLoadedScript) loadPromise.then(domContentLoadedCheck);
    if (isLoadScript) loadPromise.then(loadCheck);
  };

  const fetchCache = {};
  const processPreload = link => {
    link.ep = true;
    initPromise.then(() => {
      if (baselineSupport && !shimMode) return;
      if (fetchCache[link.href]) return;
      fetchCache[link.href] = fetchModule(link.href, getFetchOpts(link));
    });
  };

})();
