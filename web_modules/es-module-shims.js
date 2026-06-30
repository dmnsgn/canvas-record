/** ES Module Shims @version 2.8.1 */
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

  const r$1 = esmsInitOptions.version;
  if (self_.importShim || (r$1 && r$1 !== version)) {
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
  let e,a,r,i=2<<19;const s=1===new Uint8Array(new Uint16Array([1]).buffer)[0]?function(e,a){const r=e.length;let i=0;for(;i<r;)a[i]=e.charCodeAt(i++);}:function(e,a){const r=e.length;let i=0;for(;i<r;){const r=e.charCodeAt(i);a[i++]=(255&r)<<8|r>>>8;}},f="xportmportlassforetaourceeferromsyncunctionvoyiedelecontininstantybreareturdebuggeawaithrwhileifcatcfinallels";let t,c$1,n;function parse(k,u="@"){t=k,c$1=u;const l=2*t.length+(2<<18);if(l>i||!e){for(;l>i;)i*=2;a=new ArrayBuffer(i),s(f,new Uint16Array(a,16,109)),e=function(e,a,r){"use asm";var i=new e.Int8Array(r),s=new e.Int16Array(r),f=new e.Int32Array(r),t=new e.Uint8Array(r),c=new e.Uint16Array(r),n=1040;function b(){var e=0,a=0,r=0,t=0,c=0,b=0,l=0,d=0,C=0,g=0;g=n;n=n+10240|0;i[808]=1;i[807]=0;s[401]=0;s[402]=0;f[70]=f[2];i[809]=0;f[68]=0;i[806]=0;f[71]=g+2048;f[72]=g;i[810]=0;e=(f[3]|0)+-2|0;f[73]=e;a=e+(f[66]<<1)|0;f[74]=a;e:while(1){r=e+2|0;f[73]=r;if(e>>>0>=a>>>0){t=18;break}a:do{switch(s[r>>1]|0){case 9:case 10:case 11:case 12:case 13:case 32:break;case 101:{if((((s[402]|0)==0?J(r)|0:0)?(I(e+4|0,16,10)|0)==0:0)?(k(),(i[808]|0)==0):0){t=9;break e}else t=17;break}case 105:{if(J(r)|0?(I(e+4|0,26,10)|0)==0:0){u();t=17;}else t=17;break}case 59:{t=17;break}case 47:switch(s[e+4>>1]|0){case 47:{P();break a}case 42:{m(1);break a}default:{t=16;break e}}default:{t=16;break e}}}while(0);if((t|0)==17){t=0;f[70]=f[73];}e=f[73]|0;a=f[74]|0;}if((t|0)==9){e=f[73]|0;f[70]=e;t=19;}else if((t|0)==16){i[808]=0;f[73]=e;t=19;}else if((t|0)==18)if(!(i[806]|0)){e=r;t=19;}else e=0;do{if((t|0)==19){e:while(1){a=e+2|0;f[73]=a;if(e>>>0>=(f[74]|0)>>>0){t=102;break}a:do{switch(s[a>>1]|0){case 9:case 10:case 11:case 12:case 13:case 32:break;case 101:{if(((s[402]|0)==0?J(a)|0:0)?(I(e+4|0,16,10)|0)==0:0){k();t=101;}else t=101;break}case 105:{if(J(a)|0?(I(e+4|0,26,10)|0)==0:0){u();t=101;}else t=101;break}case 99:{if((J(a)|0?(I(e+4|0,36,8)|0)==0:0)?X(s[e+12>>1]|0)|0:0){i[810]=1;t=101;}else t=101;break}case 40:{r=f[71]|0;e=s[402]|0;t=e&65535;f[r+(t<<3)>>2]=1;a=f[70]|0;s[402]=e+1<<16>>16;f[r+(t<<3)+4>>2]=a;t=101;break}case 91:{r=f[71]|0;e=s[402]|0;t=e&65535;f[r+(t<<3)>>2]=8;a=f[70]|0;s[402]=e+1<<16>>16;f[r+(t<<3)+4>>2]=a;t=101;break}case 93:{e=s[402]|0;if(!(e<<16>>16)){t=37;break e}s[402]=e+-1<<16>>16;t=101;break}case 44:{t=s[401]|0;a=t&65535;if(((t<<16>>16!=0?(c=s[402]|0,c<<16>>16!=0):0)?(f[(f[71]|0)+((c&65535)+-1<<3)>>2]|0)==5:0)?(b=f[(f[72]|0)+(a+-1<<2)>>2]|0,d=b+4|0,(f[d>>2]|0)==0):0){f[d>>2]=(f[70]|0)+2;f[73]=e+4;w(1)|0;t=f[73]|0;f[b+16>>2]=t;f[73]=t+-2;t=101;}else t=101;break}case 41:{a=s[402]|0;if(!(a<<16>>16)){t=45;break e}r=a+-1<<16>>16;s[402]=r;t=s[401]|0;a=t&65535;if(t<<16>>16!=0?(f[(f[71]|0)+((r&65535)<<3)>>2]|0)==5:0){a=f[(f[72]|0)+(a+-1<<2)>>2]|0;r=a+4|0;if(!(f[r>>2]|0))f[r>>2]=(f[70]|0)+2;f[a+12>>2]=e+4;s[401]=t+-1<<16>>16;t=101;}else t=101;break}case 123:{t=f[70]|0;r=f[63]|0;e=t;do{if((s[t>>1]|0)==41&(r|0)!=0?(f[r+4>>2]|0)==(t|0):0){a=f[64]|0;f[63]=a;if(!a){f[59]=0;break}else {f[a+36>>2]=0;break}}}while(0);r=f[71]|0;a=s[402]|0;t=a&65535;f[r+(t<<3)>>2]=(i[810]|0)==0?2:6;s[402]=a+1<<16>>16;f[r+(t<<3)+4>>2]=e;i[810]=0;t=101;break}case 125:{e=s[402]|0;if(!(e<<16>>16)){t=58;break e}r=f[71]|0;t=e+-1<<16>>16;s[402]=t;if((f[r+((t&65535)<<3)>>2]|0)==4){h();t=101;}else t=101;break}case 39:{v(39);t=101;break}case 34:{v(34);t=101;break}case 47:switch(s[e+4>>1]|0){case 47:{P();break a}case 42:{m(1);break a}default:{e=f[70]|0;a=s[e>>1]|0;r:do{if(!(x(a)|0))if(a<<16>>16==41){r=s[402]|0;if(!(D(f[(f[71]|0)+((r&65535)<<3)+4>>2]|0)|0))t=74;}else t=73;else switch(a<<16>>16){case 46:if(((s[e+-2>>1]|0)+-48&65535)<10){t=73;break r}else break r;case 43:if((s[e+-2>>1]|0)==43){t=73;break r}else break r;case 45:if((s[e+-2>>1]|0)==45){t=73;break r}else break r;default:break r}}while(0);if((t|0)==73){r=s[402]|0;t=74;}r:do{if((t|0)==74){t=0;if(r<<16>>16!=0?(l=f[71]|0,C=(r&65535)+-1|0,a<<16>>16==102?(f[l+(C<<3)>>2]|0)==1:0):0){if(((s[e+-2>>1]|0)==111?A(e+-4|0)|0:0)?T(f[l+(C<<3)+4>>2]|0,44,3)|0:0)break}else t=79;if((t|0)==79?(0,a<<16>>16==125):0){t=f[71]|0;r=r&65535;if(y(f[t+(r<<3)+4>>2]|0)|0)break;if((f[t+(r<<3)>>2]|0)==6)break}if(!(o(e)|0)){switch(a<<16>>16){case 0:break r;case 47:{if(i[809]|0)break r;break}default:{}}t=f[65]|0;if((t|0?e>>>0>=(f[t>>2]|0)>>>0:0)?e>>>0<=(f[t+4>>2]|0)>>>0:0){p();i[809]=0;t=101;break a}r=f[3]|0;do{if(e>>>0<=r>>>0)break;e=e+-2|0;f[70]=e;a=s[e>>1]|0;}while(!(E(a)|0));if(F(a)|0){do{if(e>>>0<=r>>>0)break;e=e+-2|0;f[70]=e;}while(F(s[e>>1]|0)|0);if(j(e)|0){p();i[809]=0;t=101;break a}}i[809]=1;t=101;break a}}}while(0);p();i[809]=0;t=101;break a}}case 96:{r=f[71]|0;a=s[402]|0;t=a&65535;f[r+(t<<3)+4>>2]=f[70];s[402]=a+1<<16>>16;f[r+(t<<3)>>2]=3;h();t=101;break}default:t=101;}}while(0);if((t|0)==101){t=0;f[70]=f[73];}e=f[73]|0;}if((t|0)==37){W();e=0;break}else if((t|0)==45){W();e=0;break}else if((t|0)==58){W();e=0;break}else if((t|0)==102){e=(i[806]|0)==0?(s[401]|s[402])<<16>>16==0:0;break}}}while(0);n=g;return e|0}function k(){var e=0,a=0,r=0,t=0,c=0,n=0,b=0,k=0,u=0,o=0,h=0,d=0,A=0,g=0;k=f[73]|0;u=f[65]|0;g=k+12|0;f[73]=g;r=w(1)|0;e=f[73]|0;if(!((e|0)==(g|0)?!(U(r)|0):0))A=3;e:do{if((A|0)==3){a:do{switch(r<<16>>16){case 123:{f[73]=e+2;e=w(1)|0;a=f[73]|0;while(1){if(Y(e)|0){v(e);e=(f[73]|0)+2|0;f[73]=e;}else {q(e)|0;e=f[73]|0;}w(1)|0;e=C(a,e)|0;if(e<<16>>16==44){f[73]=(f[73]|0)+2;e=w(1)|0;}if(e<<16>>16==125){A=15;break}g=a;a=f[73]|0;if((a|0)==(g|0)){A=12;break}if(a>>>0>(f[74]|0)>>>0){A=14;break}}if((A|0)==12){W();break e}else if((A|0)==14){W();break e}else if((A|0)==15){i[807]=1;f[73]=(f[73]|0)+2;break a}break}case 42:{f[73]=e+2;w(1)|0;g=f[73]|0;C(g,g)|0;break}default:{i[808]=0;switch(r<<16>>16){case 100:{k=e+14|0;f[73]=k;switch((w(1)|0)<<16>>16){case 97:{a=f[73]|0;if((I(a+2|0,80,8)|0)==0?(c=a+10|0,F(s[c>>1]|0)|0):0){f[73]=c;w(0)|0;A=22;}break}case 102:{A=22;break}case 99:{a=f[73]|0;if(((I(a+2|0,36,8)|0)==0?(t=a+10|0,g=s[t>>1]|0,X(g)|0|g<<16>>16==123):0)?(f[73]=t,n=w(1)|0,n<<16>>16!=123):0){d=n;A=31;}break}default:{}}r:do{if((A|0)==22?(b=f[73]|0,(I(b+2|0,88,14)|0)==0):0){r=b+16|0;a=s[r>>1]|0;if(!(X(a)|0))switch(a<<16>>16){case 40:case 42:break;default:break r}f[73]=r;a=w(1)|0;if(a<<16>>16==42){f[73]=(f[73]|0)+2;a=w(1)|0;}if(a<<16>>16!=40){d=a;A=31;}}}while(0);if((A|0)==31?(o=f[73]|0,q(d)|0,h=f[73]|0,h>>>0>o>>>0):0){$(e,k,o,h);f[73]=(f[73]|0)+-2;break e}$(e,k,0,0);f[73]=e+12;break e}case 97:{f[73]=e+10;w(0)|0;e=f[73]|0;A=35;break}case 102:{A=35;break}case 99:{if((I(e+2|0,36,8)|0)==0?(a=e+10|0,E(s[a>>1]|0)|0):0){f[73]=a;g=w(1)|0;A=f[73]|0;q(g)|0;g=f[73]|0;$(A,g,A,g);f[73]=(f[73]|0)+-2;break e}e=e+4|0;f[73]=e;break}case 108:case 118:break;default:break e}if((A|0)==35){f[73]=e+16;e=w(1)|0;if(e<<16>>16==42){f[73]=(f[73]|0)+2;e=w(1)|0;}A=f[73]|0;q(e)|0;g=f[73]|0;$(A,g,A,g);f[73]=(f[73]|0)+-2;break e}f[73]=e+6;i[808]=0;r=w(1)|0;e=f[73]|0;r=(q(r)|0|32)<<16>>16==123;t=f[73]|0;if(r){f[73]=t+2;g=w(1)|0;e=f[73]|0;q(g)|0;}r:while(1){a=f[73]|0;if((a|0)==(e|0))break;$(e,a,e,a);a=w(1)|0;if(r)switch(a<<16>>16){case 93:case 125:break e;default:{}}e=f[73]|0;if(a<<16>>16!=44){A=51;break}f[73]=e+2;a=w(1)|0;e=f[73]|0;switch(a<<16>>16){case 91:case 123:{A=51;break r}default:{}}q(a)|0;}if((A|0)==51)f[73]=e+-2;if(!r)break e;f[73]=t+-2;break e}}}while(0);g=(w(1)|0)<<16>>16==102;e=f[73]|0;if(g?(I(e+2|0,74,6)|0)==0:0){f[73]=e+8;l(k,w(1)|0,0);e=(u|0)==0?240:u+16|0;while(1){e=f[e>>2]|0;if(!e)break e;f[e+12>>2]=0;f[e+8>>2]=0;e=e+16|0;}}f[73]=e+-2;}}while(0);return}function u(){var e=0,a=0,r=0,t=0,c=0,n=0,b=0;b=f[73]|0;c=b+12|0;f[73]=c;e=w(1)|0;t=f[73]|0;e:do{if(e<<16>>16!=46){if(!(e<<16>>16==115&t>>>0>c>>>0)){if(!(e<<16>>16==100&t>>>0>(b+10|0)>>>0)){t=0;n=28;break}if(I(t+2|0,66,8)|0){a=t;e=100;t=0;n=59;break}e=t+10|0;if(!(X(s[e>>1]|0)|0)){a=t;e=100;t=0;n=59;break}f[73]=e;e=w(1)|0;if(e<<16>>16==42){e=42;t=2;n=61;break}f[73]=t;t=0;n=28;break}if((I(t+2|0,56,10)|0)==0?(r=t+12|0,X(s[r>>1]|0)|0):0){f[73]=r;e=w(1)|0;a=f[73]|0;if((a|0)!=(r|0)){if(e<<16>>16!=102){t=1;n=28;break}if(I(a+2|0,74,6)|0){e=102;t=1;n=59;break}if(!(E(s[a+8>>1]|0)|0)){e=102;t=1;n=59;break}}f[73]=t;t=0;n=28;}else {a=t;e=115;t=0;n=59;}}else {f[73]=t+2;switch((w(1)|0)<<16>>16){case 109:{e=f[73]|0;if(I(e+2|0,50,6)|0)break e;a=f[70]|0;if(!(G(a)|0)?(s[a>>1]|0)==46:0)break e;d(b,b,e+8|0,2);break e}case 115:{e=f[73]|0;if(I(e+2|0,56,10)|0)break e;a=f[70]|0;if(!(G(a)|0)?(s[a>>1]|0)==46:0)break e;f[73]=e+12;e=w(1)|0;t=1;n=28;break e}case 100:{e=f[73]|0;if(I(e+2|0,66,8)|0)break e;a=f[70]|0;if(!(G(a)|0)?(s[a>>1]|0)==46:0)break e;f[73]=e+10;e=w(1)|0;t=2;n=28;break e}default:break e}}}while(0);e:do{if((n|0)==28){if(e<<16>>16==40){r=f[71]|0;a=s[402]|0;c=a&65535;f[r+(c<<3)>>2]=5;e=f[73]|0;s[402]=a+1<<16>>16;f[r+(c<<3)+4>>2]=e;if((s[f[70]>>1]|0)==46)break;f[73]=e+2;a=w(1)|0;d(b,f[73]|0,0,e);if(!t)e=f[63]|0;else {e=f[63]|0;f[e+28>>2]=(t|0)==1?5:7;}c=f[72]|0;b=s[401]|0;s[401]=b+1<<16>>16;f[c+((b&65535)<<2)>>2]=e;switch(a<<16>>16){case 39:{v(39);break}case 34:{v(34);break}default:{f[73]=(f[73]|0)+-2;break e}}e=(f[73]|0)+2|0;f[73]=e;switch((w(1)|0)<<16>>16){case 44:{f[73]=(f[73]|0)+2;w(1)|0;c=f[63]|0;f[c+4>>2]=e;b=f[73]|0;f[c+16>>2]=b;i[c+24>>0]=1;f[73]=b+-2;break e}case 41:{s[402]=(s[402]|0)+-1<<16>>16;b=f[63]|0;f[b+4>>2]=e;f[b+12>>2]=(f[73]|0)+2;i[b+24>>0]=1;s[401]=(s[401]|0)+-1<<16>>16;break e}default:{f[73]=(f[73]|0)+-2;break e}}}if(!((t|0)==0&e<<16>>16==123)){switch(e<<16>>16){case 42:case 39:case 34:{n=61;break e}default:{}}a=f[73]|0;n=59;break}e=f[73]|0;if(s[402]|0){f[73]=e+-2;break}while(1){if(e>>>0>=(f[74]|0)>>>0)break;e=w(1)|0;if(!(Y(e)|0)){if(e<<16>>16==125){n=49;break}}else v(e);e=(f[73]|0)+2|0;f[73]=e;}if((n|0)==49)f[73]=(f[73]|0)+2;c=(w(1)|0)<<16>>16==102;e=f[73]|0;if(c?I(e+2|0,74,6)|0:0){W();break}f[73]=e+8;e=w(1)|0;if(Y(e)|0){l(b,e,0);break}else {W();break}}}while(0);if((n|0)==59)if((a|0)==(c|0))f[73]=b+10;else n=61;do{if((n|0)==61){if(!((e<<16>>16==42|(t|0)!=2)&(s[402]|0)==0)){f[73]=(f[73]|0)+-2;break}e=f[74]|0;a=f[73]|0;while(1){if(a>>>0>=e>>>0){n=68;break}r=s[a>>1]|0;if(Y(r)|0){n=66;break}n=a+2|0;f[73]=n;a=n;}if((n|0)==66){l(b,r,t);break}else if((n|0)==68){W();break}}}while(0);return}function l(e,a,r){e=e|0;a=a|0;r=r|0;var i=0,t=0,c=0,n=0,b=0;i=(f[73]|0)+2|0;switch(a<<16>>16){case 39:{v(39);t=5;break}case 34:{v(34);t=5;break}default:W();}do{if((t|0)==5){d(e,i,f[73]|0,1);if((r|0)>0)f[(f[63]|0)+28>>2]=(r|0)==1?4:6;f[73]=(f[73]|0)+2;n=(w(0)|0)<<16>>16==119;c=f[73]|0;if(((n?(s[c+2>>1]|0)==105:0)?(s[c+4>>1]|0)==116:0)?(s[c+6>>1]|0)==104:0){f[73]=c+8;if((w(1)|0)<<16>>16!=123){f[73]=c;break}n=f[73]|0;i=n;t=0;e:while(1){f[73]=i+2;i=w(1)|0;do{if(i<<16>>16!=39){a=f[73]|0;if(i<<16>>16==34){v(34);e=(f[73]|0)+2|0;f[73]=e;i=w(1)|0;break}else {i=q(i)|0;e=f[73]|0;break}}else {a=f[73]|0;v(39);e=(f[73]|0)+2|0;f[73]=e;i=w(1)|0;}}while(0);if(i<<16>>16!=58){t=21;break}f[73]=(f[73]|0)+2;switch((w(1)|0)<<16>>16){case 39:{i=f[73]|0;v(39);break}case 34:{i=f[73]|0;v(34);break}default:{t=25;break e}}b=(f[73]|0)+2|0;r=f[67]|0;f[67]=r+20;f[r>>2]=a;f[r+4>>2]=e;f[r+8>>2]=i;f[r+12>>2]=b;f[r+16>>2]=0;f[((t|0)==0?(f[63]|0)+32|0:t+16|0)>>2]=r;f[73]=(f[73]|0)+2;switch((w(1)|0)<<16>>16){case 125:{t=29;break e}case 44:break;default:{t=27;break e}}i=(f[73]|0)+2|0;f[73]=i;t=r;}if((t|0)==21){f[73]=c;break}else if((t|0)==25){f[73]=c;break}else if((t|0)==27){f[73]=c;break}else if((t|0)==29){b=f[63]|0;f[b+16>>2]=n;f[b+12>>2]=(f[73]|0)+2;break}}f[73]=c+-2;}}while(0);return}function o(e){e=e|0;e:do{switch(s[e>>1]|0){case 100:switch(s[e+-2>>1]|0){case 105:{e=T(e+-4|0,102,2)|0;break e}case 108:{e=T(e+-4|0,106,3)|0;break e}default:{e=0;break e}}case 101:switch(s[e+-2>>1]|0){case 115:switch(s[e+-4>>1]|0){case 108:{e=B(e+-6|0,101)|0;break e}case 97:{e=B(e+-6|0,99)|0;break e}default:{e=0;break e}}case 116:{e=T(e+-4|0,112,4)|0;break e}case 117:{e=T(e+-4|0,120,6)|0;break e}default:{e=0;break e}}case 102:{if((s[e+-2>>1]|0)==111?(s[e+-4>>1]|0)==101:0)switch(s[e+-6>>1]|0){case 99:{e=T(e+-8|0,132,6)|0;break e}case 112:{e=T(e+-8|0,144,2)|0;break e}default:{e=0;break e}}else e=0;break}case 107:{e=T(e+-2|0,148,4)|0;break}case 110:{e=e+-2|0;if(B(e,105)|0)e=1;else e=T(e,156,5)|0;break}case 111:{e=B(e+-2|0,100)|0;break}case 114:{e=T(e+-2|0,166,7)|0;break}case 116:{e=T(e+-2|0,180,4)|0;break}case 119:switch(s[e+-2>>1]|0){case 101:{e=B(e+-4|0,110)|0;break e}case 111:{e=T(e+-4|0,188,3)|0;break e}default:{e=0;break e}}default:e=0;}}while(0);return e|0}function h(){var e=0,a=0,r=0,i=0;a=f[74]|0;r=f[73]|0;e:while(1){e=r+2|0;if(r>>>0>=a>>>0){a=10;break}switch(s[e>>1]|0){case 96:{a=7;break e}case 36:{if((s[r+4>>1]|0)==123){a=6;break e}break}case 92:{e=r+4|0;break}default:{}}r=e;}if((a|0)==6){e=r+4|0;f[73]=e;a=f[71]|0;i=s[402]|0;r=i&65535;f[a+(r<<3)>>2]=4;s[402]=i+1<<16>>16;f[a+(r<<3)+4>>2]=e;}else if((a|0)==7){f[73]=e;r=f[71]|0;i=(s[402]|0)+-1<<16>>16;s[402]=i;if((f[r+((i&65535)<<3)>>2]|0)!=3)W();}else if((a|0)==10){f[73]=e;W();}return}function w(e){e=e|0;var a=0,r=0,i=0;r=f[73]|0;e:do{a=s[r>>1]|0;a:do{if(a<<16>>16!=47)if(e)if(X(a)|0)break;else break e;else if(F(a)|0)break;else break e;else switch(s[r+2>>1]|0){case 47:{P();break a}case 42:{m(e);break a}default:{a=47;break e}}}while(0);i=f[73]|0;r=i+2|0;f[73]=r;}while(i>>>0<(f[74]|0)>>>0);return a|0}function d(e,a,r,s){e=e|0;a=a|0;r=r|0;s=s|0;var t=0,c=0;c=f[67]|0;f[67]=c+40;t=f[63]|0;f[((t|0)==0?236:t+36|0)>>2]=c;f[64]=t;f[63]=c;f[c+8>>2]=e;if(2==(s|0)){e=3;t=r;}else {t=1==(s|0);e=t?1:2;t=t?r+2|0:0;}f[c+12>>2]=t;f[c+28>>2]=e;f[c>>2]=a;f[c+4>>2]=r;f[c+16>>2]=0;f[c+20>>2]=s;a=1==(s|0);i[c+24>>0]=a&1;f[c+32>>2]=0;f[c+36>>2]=0;if(a|2==(s|0))i[807]=1;return}function v(e){e=e|0;var a=0,r=0,i=0,t=0;t=f[74]|0;a=f[73]|0;while(1){i=a+2|0;if(a>>>0>=t>>>0){a=9;break}r=s[i>>1]|0;if(r<<16>>16==e<<16>>16){a=10;break}if(r<<16>>16==92){r=a+4|0;if((s[r>>1]|0)==13){a=a+6|0;a=(s[a>>1]|0)==10?a:r;}else a=r;}else if(ie(r)|0){a=9;break}else a=i;}if((a|0)==9){f[73]=i;W();}else if((a|0)==10)f[73]=i;return}function A(e){e=e|0;var a=0,r=0;a=s[e>>1]|0;if(X(a)|0)r=3;else switch(a<<16>>16){case 41:case 125:case 93:{r=3;break}default:e=0;}e:do{if((r|0)==3){r=f[3]|0;while(1){if(e>>>0<=r>>>0)break;e=e+-2|0;if(!(X(a)|0))break;a=s[e>>1]|0;}switch(a<<16>>16){case 41:case 125:case 93:{e=1;break e}default:{}}e=(U(a)|0)^1;}}while(0);return e|0}function C(e,a){e=e|0;a=a|0;var r=0,i=0,t=0,c=0;r=f[73]|0;i=s[r>>1]|0;c=(e|0)==(a|0);t=c?0:e;c=c?0:a;if(i<<16>>16==97){f[73]=r+4;r=w(1)|0;e=f[73]|0;if(Y(r)|0){v(r);a=(f[73]|0)+2|0;f[73]=a;}else {q(r)|0;a=f[73]|0;}i=w(1)|0;r=f[73]|0;}if((r|0)!=(e|0))$(e,a,t,c);return i|0}function g(){var e=0,a=0,r=0;r=f[74]|0;a=f[73]|0;e:while(1){e=a+2|0;if(a>>>0>=r>>>0){a=6;break}switch(s[e>>1]|0){case 13:case 10:{a=6;break e}case 93:{a=7;break e}case 92:{e=a+4|0;break}default:{}}a=e;}if((a|0)==6){f[73]=e;W();e=0;}else if((a|0)==7){f[73]=e;e=93;}return e|0}function p(){var e=0,a=0,r=0;e:while(1){e=f[73]|0;a=e+2|0;f[73]=a;if(e>>>0>=(f[74]|0)>>>0){r=7;break}switch(s[a>>1]|0){case 13:case 10:{r=7;break e}case 47:break e;case 91:{g()|0;break}case 92:{f[73]=e+4;break}default:{}}}if((r|0)==7)W();return}function y(e){e=e|0;switch(s[e>>1]|0){case 62:{e=(s[e+-2>>1]|0)==61;break}case 41:case 59:{e=1;break}case 104:{e=T(e+-2|0,208,4)|0;break}case 121:{e=T(e+-2|0,216,6)|0;break}case 101:{e=T(e+-2|0,228,3)|0;break}default:e=0;}return e|0}function m(e){e=e|0;var a=0,r=0,i=0,t=0,c=0;t=(f[73]|0)+2|0;f[73]=t;r=f[74]|0;while(1){a=t+2|0;if(t>>>0>=r>>>0)break;i=s[a>>1]|0;if(!e?ie(i)|0:0)break;if(i<<16>>16==42?(s[t+4>>1]|0)==47:0){c=8;break}t=a;}if((c|0)==8){f[73]=a;a=t+4|0;}f[73]=a;return}function I(e,a,r){e=e|0;a=a|0;r=r|0;var s=0,f=0;e:do{if(!r)e=0;else {while(1){s=i[e>>0]|0;f=i[a>>0]|0;if(s<<24>>24!=f<<24>>24)break;r=r+-1|0;if(!r){e=0;break e}else {e=e+1|0;a=a+1|0;}}e=(s&255)-(f&255)|0;}}while(0);return e|0}function U(e){e=e|0;e:do{switch(e<<16>>16){case 38:case 37:case 33:{e=1;break}default:if((e&-8)<<16>>16==40|(e+-58&65535)<6)e=1;else {switch(e<<16>>16){case 91:case 93:case 94:{e=1;break e}default:{}}e=(e+-123&65535)<4;}}}while(0);return e|0}function x(e){e=e|0;e:do{switch(e<<16>>16){case 38:case 37:case 33:break;default:if(!((e+-58&65535)<6|(e+-40&65535)<7&e<<16>>16!=41)){switch(e<<16>>16){case 91:case 94:break e;default:{}}return e<<16>>16!=125&(e+-123&65535)<4|0}}}while(0);return 1}function S(e){e=e|0;var a=0;a=s[e>>1]|0;e:do{if((a+-9&65535)>=5){switch(a<<16>>16){case 160:case 32:{a=1;break e}default:{}}if(U(a)|0)return a<<16>>16!=46|(G(e)|0)|0;else a=0;}else a=1;}while(0);return a|0}function O(e){e=e|0;var a=0,r=0,i=0,t=0;r=n;n=n+16|0;i=r;f[i>>2]=0;f[66]=e;a=f[3]|0;t=a+(e<<1)|0;e=t+2|0;s[t>>1]=0;f[i>>2]=e;f[67]=e;f[59]=0;f[63]=0;f[61]=0;f[60]=0;f[65]=0;f[62]=0;n=r;return a|0}function $(e,a,r,s){e=e|0;a=a|0;r=r|0;s=s|0;var t=0,c=0;t=f[67]|0;f[67]=t+20;c=f[65]|0;f[((c|0)==0?240:c+16|0)>>2]=t;f[65]=t;f[t>>2]=e;f[t+4>>2]=a;f[t+8>>2]=r;f[t+12>>2]=s;f[t+16>>2]=0;i[807]=1;return}function T(e,a,r){e=e|0;a=a|0;r=r|0;var i=0,s=0;i=e+(0-r<<1)|0;s=i+2|0;e=f[3]|0;if(s>>>0>=e>>>0?(I(s,a,r<<1)|0)==0:0)if((s|0)==(e|0))e=1;else e=S(i)|0;else e=0;return e|0}function j(e){e=e|0;switch(s[e>>1]|0){case 107:{e=T(e+-2|0,148,4)|0;break}case 101:{if((s[e+-2>>1]|0)==117)e=T(e+-4|0,120,6)|0;else e=0;break}default:e=0;}return e|0}function B(e,a){e=e|0;a=a|0;var r=0;r=f[3]|0;if(r>>>0<=e>>>0?(s[e>>1]|0)==a<<16>>16:0)if((r|0)==(e|0))r=1;else r=E(s[e+-2>>1]|0)|0;else r=0;return r|0}function E(e){e=e|0;e:do{if((e+-9&65535)<5)e=1;else {switch(e<<16>>16){case 32:case 160:{e=1;break e}default:{}}e=e<<16>>16!=46&(U(e)|0);}}while(0);return e|0}function P(){var e=0,a=0,r=0;e=f[74]|0;r=f[73]|0;e:while(1){a=r+2|0;if(r>>>0>=e>>>0)break;switch(s[a>>1]|0){case 13:case 10:break e;default:r=a;}}f[73]=a;return}function q(e){e=e|0;while(1){if(X(e)|0)break;if(U(e)|0)break;e=(f[73]|0)+2|0;f[73]=e;e=s[e>>1]|0;if(!(e<<16>>16)){e=0;break}}return e|0}function z(){var e=0;e=f[(f[61]|0)+20>>2]|0;switch(e|0){case 1:{e=-1;break}case 2:{e=-2;break}default:e=e-(f[3]|0)>>1;}return e|0}function D(e){e=e|0;if(!(T(e,194,5)|0)?!(T(e,44,3)|0):0)e=T(e,204,2)|0;else e=1;return e|0}function F(e){e=e|0;switch(e<<16>>16){case 160:case 32:case 12:case 11:case 9:{e=1;break}default:e=0;}return e|0}function G(e){e=e|0;if((s[e>>1]|0)==46?(s[e+-2>>1]|0)==46:0)e=(s[e+-4>>1]|0)==46;else e=0;return e|0}function H(){var e=0;e=f[69]|0;e=f[((e|0)==0?(f[61]|0)+32|0:e+16|0)>>2]|0;f[69]=e;return (e|0)!=0|0}function J(e){e=e|0;if((f[3]|0)==(e|0))e=1;else e=S(e+-2|0)|0;return e|0}function K(){var e=0;e=f[(f[62]|0)+12>>2]|0;if(!e)e=-1;else e=e-(f[3]|0)>>1;return e|0}function L(){var e=0;e=f[(f[61]|0)+12>>2]|0;if(!e)e=-1;else e=e-(f[3]|0)>>1;return e|0}function M(){var e=0;e=f[(f[62]|0)+8>>2]|0;if(!e)e=-1;else e=e-(f[3]|0)>>1;return e|0}function N(){var e=0;e=f[(f[61]|0)+16>>2]|0;if(!e)e=-1;else e=e-(f[3]|0)>>1;return e|0}function Q(){var e=0;e=f[(f[61]|0)+4>>2]|0;if(!e)e=-1;else e=e-(f[3]|0)>>1;return e|0}function R(){var e=0;e=f[61]|0;e=f[((e|0)==0?236:e+36|0)>>2]|0;f[61]=e;return (e|0)!=0|0}function V(){var e=0;e=f[62]|0;e=f[((e|0)==0?240:e+16|0)>>2]|0;f[62]=e;return (e|0)!=0|0}function W(){i[806]=1;f[68]=(f[73]|0)-(f[3]|0)>>1;f[73]=(f[74]|0)+2;return}function X(e){e=e|0;return (e|128)<<16>>16==160|(e+-9&65535)<5|0}function Y(e){e=e|0;return e<<16>>16==39|e<<16>>16==34|0}function Z(){return (f[(f[69]|0)+12>>2]|0)-(f[3]|0)>>1|0}function _(){return (f[(f[69]|0)+8>>2]|0)-(f[3]|0)>>1|0}function ee(){return (f[(f[69]|0)+4>>2]|0)-(f[3]|0)>>1|0}function ae(){return (f[(f[61]|0)+8>>2]|0)-(f[3]|0)>>1|0}function re(){return (f[(f[62]|0)+4>>2]|0)-(f[3]|0)>>1|0}function ie(e){e=e|0;return e<<16>>16==13|e<<16>>16==10|0}function se(){return (f[f[69]>>2]|0)-(f[3]|0)>>1|0}function fe(){return (f[f[61]>>2]|0)-(f[3]|0)>>1|0}function te(){return (f[f[62]>>2]|0)-(f[3]|0)>>1|0}function ce(){return t[(f[61]|0)+24>>0]|0|0}function ne(e){e=e|0;f[3]=e;return}function be(){return f[(f[61]|0)+28>>2]|0}function ke(){return (i[807]|0)!=0|0}function ue(){return (i[808]|0)!=0|0}function le(){f[69]=0;return}function oe(){return f[68]|0}function he(e){e=e|0;n=e+992+15&-16;return 992}return {su:he,ai:N,ake:ee,aks:se,ave:Z,avs:_,e:oe,ee:re,ele:K,els:M,es:te,f:ue,id:z,ie:Q,ip:ce,is:fe,it:be,ms:ke,p:b,ra:H,re:V,ri:R,rsa:le,sa:O,se:L,ses:ne,ss:ae}}("undefined"!=typeof globalThis?globalThis:self,{},a),r=e.su(i-(2<<17));}const h=t.length+1;e.ses(r),e.sa(h-1),s(t,new Uint16Array(a,r,h)),e.p()||(n=e.e(),o());const w=[],d=[];for(;e.ri();){const a=e.is(),r=e.ie(),i=e.ai(),s=e.id(),f=e.ss(),c=e.se(),n=e.it();let k;e.ip()&&(k=b(-1===s?a:a+1,t.charCodeAt(-1===s?a-1:a)));const u=[];for(e.rsa();e.ra();){const a=e.aks(),r=e.ake(),i=e.avs(),s=e.ave(),f=v(a,r),t=v(i,s);u.push([f,t]);}w.push({t:n,n:k,s:a,e:r,ss:f,se:c,d:s,a:i,at:u.length>0?u:null});}for(;e.re();){const a=e.es(),r=e.ee(),i=e.els(),s=e.ele(),f=v(a,r),t=i<0?void 0:v(i,s);d.push({s:a,e:r,ls:i,le:s,n:f,ln:t});}return [w,d,!!e.f(),!!e.ms()];function v(e,a){const r=t.charCodeAt(e);return 34===r||39===r?b(e+1,r):t.slice(e,a)}}function b(e,a){n=e;let r="",i=n;for(;;){n>=t.length&&o();const e=t.charCodeAt(n);if(e===a)break;92===e?(r+=t.slice(i,n),r+=k(),i=n):(8232===e||8233===e||l(e)&&o(),++n);}return r+=t.slice(i,n++),r}function k(){let e=t.charCodeAt(++n);switch(++n,e){case 110:return "\n";case 114:return "\r";case 120:return String.fromCharCode(u(2));case 117:return function(){const e=t.charCodeAt(n);let a;123===e?(++n,a=u(t.indexOf("}",n)-n),++n,a>1114111&&o()):a=u(4);return a<=65535?String.fromCharCode(a):(a-=65536,String.fromCharCode(55296+(a>>10),56320+(1023&a)))}();case 116:return "\t";case 98:return "\b";case 118:return "\v";case 102:return "\f";case 13:10===t.charCodeAt(n)&&++n;case 10:return "";case 56:case 57:o();default:if(e>=48&&e<=55){let a=t.substr(n-1,3).match(/^[0-7]+/)[0],r=parseInt(a,8);return r>255&&(a=a.slice(0,-1),r=parseInt(a,8)),n+=a.length-1,e=t.charCodeAt(n),"0"===a&&56!==e&&57!==e||o(),String.fromCharCode(r)}return l(e)?"":String.fromCharCode(e)}}function u(e){const a=n;let r=0,i=0;for(let a=0;a<e;++a,++n){let e,s=t.charCodeAt(n);if(95!==s){if(s>=97)e=s-97+10;else if(s>=65)e=s-65+10;else {if(!(s>=48&&s<=57))break;e=s-48;}if(e>=16)break;i=s,r=16*r+e;}else 95!==i&&0!==a||o(),i=s;}return 95!==i&&n-a===e||o(),r}function l(e){return 13===e||10===e}function o(){throw Object.assign(Error(`Parse error ${c$1}:${t.slice(0,n).split("\n").length}:${n-t.lastIndexOf("\n",n-1)}`),{idx:n})}

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
    return undefined;
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
