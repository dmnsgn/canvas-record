var X = {
    trailer: 59};
function F(t) {
    if (t === void 0) t = 256;
    let e = 0, s = new Uint8Array(t);
    return {
        get buffer () {
            return s.buffer;
        },
        reset () {
            e = 0;
        },
        bytesView () {
            return s.subarray(0, e);
        },
        bytes () {
            return s.slice(0, e);
        },
        writeByte (r) {
            n(e + 1), s[e] = r, e++;
        },
        writeBytes (r, o, i) {
            if (o === void 0) o = 0;
            if (i === void 0) i = r.length;
            n(e + i);
            for(let c = 0; c < i; c++)s[e++] = r[c + o];
        },
        writeBytesView (r, o, i) {
            if (o === void 0) o = 0;
            if (i === void 0) i = r.byteLength;
            n(e + i), s.set(r.subarray(o, o + i), e), e += i;
        }
    };
    function n(r) {
        var o = s.length;
        if (o >= r) return;
        var i = 1024 * 1024;
        r = Math.max(r, o * (o < i ? 2 : 1.125) >>> 0), o != 0 && (r = Math.max(r, 256));
        let c = s;
        s = new Uint8Array(r), e > 0 && s.set(c.subarray(0, e), 0);
    }
}
var O = 12, J = 5003, lt = [
    0,
    1,
    3,
    7,
    15,
    31,
    63,
    127,
    255,
    511,
    1023,
    2047,
    4095,
    8191,
    16383,
    32767,
    65535
];
function at(t, e, s, n, r, o, i, c) {
    if (r === void 0) r = F(512);
    if (o === void 0) o = new Uint8Array(256);
    if (i === void 0) i = new Int32Array(J);
    if (c === void 0) c = new Int32Array(J);
    let x = i.length, a = Math.max(2, n);
    o.fill(0), c.fill(0), i.fill(-1);
    let l = 0, f = 0, g = a + 1, h = g, b = false, w = h, _ = (1 << w) - 1, u = 1 << g - 1, k = u + 1, B = u + 2, p = 0, A = s[0], z = 0;
    for(let y = x; y < 65536; y *= 2)++z;
    z = 8 - z, r.writeByte(a), I(u);
    let d = s.length;
    for(let y = 1; y < d; y++){
        t: {
            let m = s[y], v = (m << O) + A, M = m << z ^ A;
            if (i[M] === v) {
                A = c[M];
                break t;
            }
            let V = M === 0 ? 1 : x - M;
            for(; i[M] >= 0;)if (M -= V, M < 0 && (M += x), i[M] === v) {
                A = c[M];
                break t;
            }
            I(A), A = m, B < 1 << O ? (c[M] = B++, i[M] = v) : (i.fill(-1), B = u + 2, b = true, I(u));
        }
    }
    return I(A), I(k), r.writeByte(0), r.bytesView();
    function I(y) {
        for(l &= lt[f], f > 0 ? l |= y << f : l = y, f += w; f >= 8;)o[p++] = l & 255, p >= 254 && (r.writeByte(p), r.writeBytesView(o, 0, p), p = 0), l >>= 8, f -= 8;
        if ((B > _ || b) && (b ? (w = h, _ = (1 << w) - 1, b = false) : (++w, _ = w === O ? 1 << w : (1 << w) - 1)), y == k) {
            for(; f > 0;)o[p++] = l & 255, p >= 254 && (r.writeByte(p), r.writeBytesView(o, 0, p), p = 0), l >>= 8, f -= 8;
            p > 0 && (r.writeByte(p), r.writeBytesView(o, 0, p), p = 0);
        }
    }
}
var $ = at;
function D(t, e, s) {
    return t << 8 & 63488 | e << 2 & 992 | s >> 3;
}
function G(t, e, s, n) {
    return t >> 4 | e & 240 | (s & 240) << 4 | (n & 240) << 8;
}
function j(t, e, s) {
    return t >> 4 << 8 | e & 240 | s >> 4;
}
function R(t, e, s) {
    return t < e ? e : t > s ? s : t;
}
function T(t) {
    return t * t;
}
function tt(t, e, s) {
    var n = 0, r = 1e100;
    let o = t[e], i = o.cnt; o.ac; let x = o.rc, a = o.gc, l = o.bc;
    for(var f = o.fw; f != 0; f = t[f].fw){
        let h = t[f], b = h.cnt, w = i * b / (i + b);
        if (!(w >= r)) {
            var g = 0;
            (g += w * T(h.rc - x), !(g >= r) && (g += w * T(h.gc - a), !(g >= r) && (g += w * T(h.bc - l), !(g >= r) && (r = g, n = f))));
        }
    }
    o.err = r, o.nn = n;
}
function Q() {
    return {
        ac: 0,
        rc: 0,
        gc: 0,
        bc: 0,
        cnt: 0,
        nn: 0,
        fw: 0,
        bk: 0,
        tm: 0,
        mtm: 0,
        err: 0
    };
}
function ut(t, e) {
    let s = e === "rgb444" ? 4096 : 65536, n = new Array(s), r = t.length;
    if (e === "rgba4444") for(let o = 0; o < r; ++o){
        let i = t[o], c = i >> 24 & 255, x = i >> 16 & 255, a = i >> 8 & 255, l = i & 255, f = G(l, a, x, c), g = f in n ? n[f] : n[f] = Q();
        g.rc += l, g.gc += a, g.bc += x, g.ac += c, g.cnt++;
    }
    else if (e === "rgb444") for(let o = 0; o < r; ++o){
        let i = t[o], c = i >> 16 & 255, x = i >> 8 & 255, a = i & 255, l = j(a, x, c), f = l in n ? n[l] : n[l] = Q();
        f.rc += a, f.gc += x, f.bc += c, f.cnt++;
    }
    else for(let o = 0; o < r; ++o){
        let i = t[o], c = i >> 16 & 255, x = i >> 8 & 255, a = i & 255, l = D(a, x, c), f = l in n ? n[l] : n[l] = Q();
        f.rc += a, f.gc += x, f.bc += c, f.cnt++;
    }
    return n;
}
function H(t, e, s) {
    if (s === void 0) s = {};
    let { format: n = "rgb565", clearAlpha: r = true, clearAlphaColor: o = 0, clearAlphaThreshold: i = 0, oneBitAlpha: c = false } = s;
    if (!t || !t.buffer) throw new Error("quantize() expected RGBA Uint8Array data");
    if (!(t instanceof Uint8Array) && !(t instanceof Uint8ClampedArray)) throw new Error("quantize() expected RGBA Uint8Array data");
    let x = new Uint32Array(t.buffer), a = s.useSqrt !== false, l = n === "rgba4444", f = ut(x, n), g = f.length, h = g - 1, b = new Uint32Array(g + 1);
    for(var w = 0, u = 0; u < g; ++u){
        let C = f[u];
        if (C != null) {
            var _ = 1 / C.cnt;
            l && (C.ac *= _), C.rc *= _, C.gc *= _, C.bc *= _, f[w++] = C;
        }
    }
    T(e) / w < .022 && (a = false);
    for(var u = 0; u < w - 1; ++u)f[u].fw = u + 1, f[u + 1].bk = u, a && (f[u].cnt = Math.sqrt(f[u].cnt));
    a && (f[u].cnt = Math.sqrt(f[u].cnt));
    var k, B, p;
    for(u = 0; u < w; ++u){
        tt(f, u);
        var A = f[u].err;
        for(B = ++b[0]; B > 1 && (p = B >> 1, !(f[k = b[p]].err <= A)); B = p)b[B] = k;
        b[B] = u;
    }
    var z = w - e;
    for(u = 0; u < z;){
        for(var d;;){
            var I = b[1];
            if (d = f[I], d.tm >= d.mtm && f[d.nn].mtm <= d.tm) break;
            d.mtm == h ? I = b[1] = b[b[0]--] : (tt(f, I), d.tm = u);
            var A = f[I].err;
            for(B = 1; (p = B + B) <= b[0] && (p < b[0] && f[b[p]].err > f[b[p + 1]].err && p++, !(A <= f[k = b[p]].err)); B = p)b[B] = k;
            b[B] = I;
        }
        var y = f[d.nn], m = d.cnt, v = y.cnt, _ = 1 / (m + v);
        l && (d.ac = _ * (m * d.ac + v * y.ac)), d.rc = _ * (m * d.rc + v * y.rc), d.gc = _ * (m * d.gc + v * y.gc), d.bc = _ * (m * d.bc + v * y.bc), d.cnt += y.cnt, d.mtm = ++u, f[y.bk].fw = y.fw, f[y.fw].bk = y.bk, y.mtm = h;
    }
    let M = [];
    var V = 0;
    for(u = 0;; ++V){
        let L = R(Math.round(f[u].rc), 0, 255), C = R(Math.round(f[u].gc), 0, 255), Y = R(Math.round(f[u].bc), 0, 255), E = 255;
        if (l) {
            if (E = R(Math.round(f[u].ac), 0, 255), c) {
                let st = typeof c == "number" ? c : 127;
                E = E <= st ? 0 : 255;
            }
            r && E <= i && (L = C = Y = o, E = 0);
        }
        let K = l ? [
            L,
            C,
            Y,
            E
        ] : [
            L,
            C,
            Y
        ];
        if (xt(M, K) || M.push(K), (u = f[u].fw) == 0) break;
    }
    return M;
}
function xt(t, e) {
    for(let s = 0; s < t.length; s++){
        let n = t[s], r = n[0] === e[0] && n[1] === e[1] && n[2] === e[2], o = n.length >= 4 && e.length >= 4 ? n[3] === e[3] : true;
        if (r && o) return true;
    }
    return false;
}
function U(t, e) {
    var s = 0, n;
    for(n = 0; n < t.length; n++){
        let r = t[n] - e[n];
        s += r * r;
    }
    return s;
}
function P(t, e) {
    return e > 1 ? Math.round(t / e) * e : t;
}
function et(t, param) {
    let { roundRGB: e = 5, roundAlpha: s = 10, oneBitAlpha: n = null } = param === void 0 ? {} : param;
    let r = new Uint32Array(t.buffer);
    for(let o = 0; o < r.length; o++){
        let i = r[o], c = i >> 24 & 255, x = i >> 16 & 255, a = i >> 8 & 255, l = i & 255;
        if (c = P(c, s), n) {
            let f = typeof n == "number" ? n : 127;
            c = c <= f ? 0 : 255;
        }
        l = P(l, e), a = P(a, e), x = P(x, e), r[o] = c << 24 | x << 16 | a << 8 | l << 0;
    }
}
function nt(t, e, s) {
    if (s === void 0) s = "rgb565";
    if (!t || !t.buffer) throw new Error("quantize() expected RGBA Uint8Array data");
    if (!(t instanceof Uint8Array) && !(t instanceof Uint8ClampedArray)) throw new Error("quantize() expected RGBA Uint8Array data");
    if (e.length > 256) throw new Error("applyPalette() only works with 256 colors or less");
    let n = new Uint32Array(t.buffer), r = n.length, o = s === "rgb444" ? 4096 : 65536, i = new Uint8Array(r), c = new Array(o);
    if (s === "rgba4444") for(let a = 0; a < r; a++){
        let l = n[a], f = l >> 24 & 255, g = l >> 16 & 255, h = l >> 8 & 255, b = l & 255, w = G(b, h, g, f), _ = w in c ? c[w] : c[w] = gt(b, h, g, f, e);
        i[a] = _;
    }
    else {
        let a = s === "rgb444" ? j : D;
        for(let l = 0; l < r; l++){
            let f = n[l], g = f >> 16 & 255, h = f >> 8 & 255, b = f & 255, w = a(b, h, g), _ = w in c ? c[w] : c[w] = bt(b, h, g, e);
            i[l] = _;
        }
    }
    return i;
}
function gt(t, e, s, n, r) {
    let o = 0, i = 1e100;
    for(let c = 0; c < r.length; c++){
        let x = r[c], a = x[3], l = q(a - n);
        if (l > i) continue;
        let f = x[0];
        if (l += q(f - t), l > i) continue;
        let g = x[1];
        if (l += q(g - e), l > i) continue;
        let h = x[2];
        l += q(h - s), !(l > i) && (i = l, o = c);
    }
    return o;
}
function bt(t, e, s, n) {
    let r = 0, o = 1e100;
    for(let i = 0; i < n.length; i++){
        let c = n[i], x = c[0], a = q(x - t);
        if (a > o) continue;
        let l = c[1];
        if (a += q(l - e), a > o) continue;
        let f = c[2];
        a += q(f - s), !(a > o) && (o = a, r = i);
    }
    return r;
}
function rt(t, e, s) {
    if (s === void 0) s = 5;
    if (!t.length || !e.length) return;
    let n = t.map((i)=>i.slice(0, 3)), r = s * s, o = t[0].length;
    for(let i = 0; i < e.length; i++){
        let c = e[i];
        c.length < o ? c = [
            c[0],
            c[1],
            c[2],
            255
        ] : c.length > o ? c = c.slice(0, 3) : c = c.slice();
        let x = N(n, c.slice(0, 3), U), a = x[0], l = x[1];
        l > 0 && l <= r && (t[a] = c);
    }
}
function q(t) {
    return t * t;
}
function W(t, e, s) {
    if (s === void 0) s = U;
    let n = Infinity, r = -1;
    for(let o = 0; o < t.length; o++){
        let i = t[o], c = s(e, i);
        c < n && (n = c, r = o);
    }
    return r;
}
function N(t, e, s) {
    if (s === void 0) s = U;
    let n = Infinity, r = -1;
    for(let o = 0; o < t.length; o++){
        let i = t[o], c = s(e, i);
        c < n && (n = c, r = o);
    }
    return [
        r,
        n
    ];
}
function ot(t, e, s) {
    if (s === void 0) s = U;
    return t[W(t, e, s)];
}
function ct(t) {
    if (t === void 0) t = {};
    let { initialCapacity: e = 4096, auto: s = true } = t, n = F(e), r = 5003, o = new Uint8Array(256), i = new Int32Array(r), c = new Int32Array(r), x = false;
    return {
        reset () {
            n.reset(), x = false;
        },
        finish () {
            n.writeByte(X.trailer);
        },
        bytes () {
            return n.bytes();
        },
        bytesView () {
            return n.bytesView();
        },
        get buffer () {
            return n.buffer;
        },
        get stream () {
            return n;
        },
        writeHeader: a,
        writeFrame (l, f, g, h) {
            if (h === void 0) h = {};
            let { transparent: b = false, transparentIndex: w = 0, delay: _ = 0, palette: u = null, repeat: k = 0, colorDepth: B = 8, dispose: p = -1 } = h, A = false;
            if (s ? x || (A = true, a(), x = true) : A = Boolean(h.first), f = Math.max(0, Math.floor(f)), g = Math.max(0, Math.floor(g)), A) {
                if (!u) throw new Error("First frame must include a { palette } option");
                pt(n, f, g, u, B), it(n, u), k >= 0 && dt(n, k);
            }
            let z = Math.round(_ / 10);
            wt(n, p, z, b, w);
            let d = Boolean(u) && !A;
            ht(n, f, g, d ? u : null), d && it(n, u), yt(n, l, f, g, B, o, i, c);
        }
    };
    function a() {
        ft(n, "GIF89a");
    }
}
function wt(t, e, s, n, r) {
    t.writeByte(33), t.writeByte(249), t.writeByte(4), r < 0 && (r = 0, n = false);
    var o, i;
    n ? (o = 1, i = 2) : (o = 0, i = 0), e >= 0 && (i = e & 7), i <<= 2;
    let c = 0;
    t.writeByte(0 | i | c | o), S(t, s), t.writeByte(r || 0), t.writeByte(0);
}
function pt(t, e, s, n, r) {
    if (r === void 0) r = 8;
    let o = 1, i = 0, c = Z(n.length) - 1, x = o << 7 | r - 1 << 4 | i << 3 | c, a = 0, l = 0;
    S(t, e), S(t, s), t.writeBytes([
        x,
        a,
        l
    ]);
}
function dt(t, e) {
    t.writeByte(33), t.writeByte(255), t.writeByte(11), ft(t, "NETSCAPE2.0"), t.writeByte(3), t.writeByte(1), S(t, e), t.writeByte(0);
}
function it(t, e) {
    let s = 1 << Z(e.length);
    for(let n = 0; n < s; n++){
        let r = [
            0,
            0,
            0
        ];
        n < e.length && (r = e[n]), t.writeByte(r[0]), t.writeByte(r[1]), t.writeByte(r[2]);
    }
}
function ht(t, e, s, n) {
    if (t.writeByte(44), S(t, 0), S(t, 0), S(t, e), S(t, s), n) {
        let r = 0, o = 0, i = Z(n.length) - 1;
        t.writeByte(128 | r | o | 0 | i);
    } else t.writeByte(0);
}
function yt(t, e, s, n, r, o, i, c) {
    if (r === void 0) r = 8;
    $(s, n, e, r, t, o, i, c);
}
function S(t, e) {
    t.writeByte(e & 255), t.writeByte(e >> 8 & 255);
}
function ft(t, e) {
    for(var s = 0; s < e.length; s++)t.writeByte(e.charCodeAt(s));
}
function Z(t) {
    return Math.max(Math.ceil(Math.log2(t)), 1);
}
var Bt = ct;

export { ct as GIFEncoder, nt as applyPalette, Bt as default, ot as nearestColor, W as nearestColorIndex, N as nearestColorIndexWithDistance, et as prequantize, H as quantize, rt as snapColorsToPalette };
