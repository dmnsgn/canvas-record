const setAlpha = (color, a)=>{
    if (a !== undefined) color[3] = a;
    return color;
};
const floorArray = (color, precision = 5)=>{
    const p = 10 ** precision;
    color.forEach((n, i)=>color[i] = Math.floor((n + Number.EPSILON) * p) / p);
    return color;
};
const transformMat3 = (a, m)=>{
    const x = a[0];
    const y = a[1];
    const z = a[2];
    a[0] = x * m[0] + y * m[3] + z * m[6];
    a[1] = x * m[1] + y * m[4] + z * m[7];
    a[2] = x * m[2] + y * m[5] + z * m[8];
    return a;
};
const cubed3 = (lms)=>{
    lms[0] = lms[0] ** 3;
    lms[1] = lms[1] ** 3;
    lms[2] = lms[2] ** 3;
};
const cbrt3 = (lms)=>{
    lms[0] = Math.cbrt(lms[0]);
    lms[1] = Math.cbrt(lms[1]);
    lms[2] = Math.cbrt(lms[2]);
};
const TMP = [
    0,
    0,
    0
];
const TAU = 2 * Math.PI;
/**
 * Illuminant D65: x,y,z tristimulus values
 * @see {@link https://en.wikipedia.org/wiki/Standard_illuminant#White_points_of_standard_illuminants}
 */ const D65 = [
    0.3127 / 0.329,
    1,
    (1 - 0.3127 - 0.329) / 0.329
];
/**
 * Illuminant D50: x,y,z tristimulus values
 */ const D50 = [
    0.3457 / 0.3585,
    1,
    (1 - 0.3457 - 0.3585) / 0.3585
];
// Linear/sRGB
/**
 * Convert component from linear value
 * @param {number} c
 * @returns {number}
 */ const linearToSrgb = (c)=>c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
/**
 * Convert component to linear value
 * @param {number} c
 * @returns {number}
 */ const srgbToLinear = (c)=>c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
/**
 * Return a RGB representation from Linear values.
 * @param {number} lr
 * @param {number} lg
 * @param {number} lb
 * @param {Array} out
 * @returns {import("./color.js").color}
 */ const linearToRgb = (lr, lg, lb, out)=>{
    out[0] = linearToSrgb(lr);
    out[1] = linearToSrgb(lg);
    out[2] = linearToSrgb(lb);
    return out;
};
/**
 * Return a Linear representation from RGB values.
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {Array} out
 * @returns {import("./linear.js").linear}
 */ const rgbToLinear = (r, g, b, out)=>{
    out[0] = srgbToLinear(r);
    out[1] = srgbToLinear(g);
    out[2] = srgbToLinear(b);
    return out;
};
// XYZ/Linear/P3
// https://github.com/hsluv/hsluv-javascript/blob/14b49e6cf9a9137916096b8487a5372626b57ba4/src/hsluv.ts#L8-L16
// prettier-ignore
const mXYZD65ToLinearsRGB = [
    3.240969941904521,
    -0.96924363628087,
    0.055630079696993,
    -1.537383177570093,
    1.87596750150772,
    -0.20397695888897,
    -0.498610760293,
    0.041555057407175,
    1.056971514242878
];
// https://github.com/hsluv/hsluv-javascript/blob/14b49e6cf9a9137916096b8487a5372626b57ba4/src/hsluv.ts#L152-L154
// prettier-ignore
const mLinearsRGBToXYZD65 = [
    0.41239079926595,
    0.21263900587151,
    0.019330818715591,
    0.35758433938387,
    0.71516867876775,
    0.11919477979462,
    0.18048078840183,
    0.072192315360733,
    0.95053215224966
];
// https://github.com/Evercoder/culori/tree/main/src/xyz50
// prettier-ignore
const mXYZD50ToLinearsRGB = [
    3.1341359569958707,
    -0.978795502912089,
    0.07195537988411677,
    -1.6173863321612538,
    1.916254567259524,
    -0.2289768264158322,
    -0.4906619460083532,
    0.03344273116131949,
    1.405386058324125
];
const mLinearsRGBToXYZD50 = [
    0.436065742824811,
    0.22249319175623702,
    0.013923904500943465,
    0.3851514688337912,
    0.7168870538238823,
    0.09708128566574634,
    0.14307845442264197,
    0.06061979053616537,
    0.7140993584005155
];
// http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
// https://drafts.csswg.org/css-color/#color-conversion-code
// prettier-ignore
const mLinearP3ToXYZD65 = [
    0.4865709486482162,
    0.2289745640697488,
    0,
    0.26566769316909306,
    0.6917385218365064,
    0.04511338185890264,
    0.1982172852343625,
    0.079286914093745,
    1.043944368900976
];
// prettier-ignore
const mXYZD65ToLinearP3 = [
    2.493496911941425,
    -0.8294889695615747,
    0.03584583024378447,
    -0.9313836179191239,
    1.7626640603183463,
    -0.07617238926804182,
    -0.40271078445071684,
    0.023624685841943577,
    0.9568845240076872
];
/**
 * Return a Linear representation from XYZ values with D65 illuminant.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {Array} out
 * @returns {import("./linear.js").linear}
 */ const xyzD65ToLinear = (x, y, z, out)=>{
    fromValues(out, x, y, z);
    return transformMat3(out, mXYZD65ToLinearsRGB);
};
/**
 * Return a XYZ representation with D65 illuminant from Linear values.
 * @param {number} lr
 * @param {number} lg
 * @param {number} lb
 * @param {Array} out
 * @returns {import("./xyz.js").xyz}
 */ const linearToXyzD65 = (lr, lg, lb, out)=>{
    fromValues(out, lr, lg, lb);
    return transformMat3(out, mLinearsRGBToXYZD65);
};
/**
 * Return a Linear representation from XYZ values with D50 illuminant.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {Array} out
 * @returns {import("./linear.js").linear}
 */ const xyzD50ToLinear = (x, y, z, out)=>{
    fromValues(out, x, y, z);
    return transformMat3(out, mXYZD50ToLinearsRGB);
};
/**
 * Return a XYZ representation with D50 illuminant from Linear values.
 * @param {number} lr
 * @param {number} lg
 * @param {number} lb
 * @param {Array} out
 * @returns {import("./xyz.js").xyz}
 */ const linearToXyzD50 = (lr, lg, lb, out)=>{
    fromValues(out, lr, lg, lb);
    return transformMat3(out, mLinearsRGBToXYZD50);
};
/**
 * Return a XYZ representation with D65 illuminant from Linear P3 values.
 * @param {number} lr
 * @param {number} lg
 * @param {number} lb
 * @param {Array} out
 * @returns {import("./xyz.js").xyz}
 */ const linearP3ToXyzD65 = (lr, lg, lb, out)=>{
    fromValues(out, lr, lg, lb);
    return transformMat3(out, mLinearP3ToXYZD65);
};
/**
 * Return a Linear P3 representation from XYZ values with D65 illuminant.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {Array} out
 * @returns {Array} P3 Linear
 */ const xyzD65ToLinearP3 = (x, y, z, out)=>{
    fromValues(out, x, y, z);
    return transformMat3(out, mXYZD65ToLinearP3);
};
// Luv
// https://github.com/hsluv/hsluv-javascript/blob/main/src/hsluv.ts
const L_EPSILON = 1e-10;
const REF_U = 0.19783000664283;
const REF_V = 0.46831999493879;
const KAPPA = 9.032962962;
const EPSILON = 0.000088564516;
const yToL = (Y)=>Y <= EPSILON ? Y * KAPPA : 1.16 * Y ** (1 / 3) - 0.16;
const lToY = (L)=>L <= 0.08 ? L / KAPPA : ((L + 0.16) / 1.16) ** 3;
const xyzToLuv = (X, Y, Z, out)=>{
    const divider = X + 15 * Y + 3 * Z;
    let varU = 4 * X;
    let varV = 9 * Y;
    if (divider !== 0) {
        varU /= divider;
        varV /= divider;
    } else {
        varU = NaN;
        varV = NaN;
    }
    const L = yToL(Y);
    if (L === 0) {
        out[0] = out[1] = out[2] = 0;
        return out;
    }
    out[0] = L;
    out[1] = 13 * L * (varU - REF_U);
    out[2] = 13 * L * (varV - REF_V);
    return out;
};
const luvToXyz = (L, U, V, out)=>{
    if (L === 0) {
        out[0] = out[1] = out[2] = 0;
        return out;
    }
    const varU = U / (13 * L) + REF_U;
    const varV = V / (13 * L) + REF_V;
    const Y = lToY(L);
    const X = 0 - 9 * Y * varU / ((varU - 4) * varV - varU * varV);
    out[0] = X;
    out[1] = Y;
    out[2] = (9 * Y - 15 * varV * Y - varV * X) / (3 * varV);
    return out;
};
const luvToLch = (L, U, V, out)=>{
    const C = Math.sqrt(U * U + V * V);
    let H;
    if (C < L_EPSILON) {
        H = 0;
    } else {
        H = Math.atan2(V, U) / TAU;
        if (H < 0) H = 1 + H;
    }
    out[0] = L;
    out[1] = C;
    out[2] = H;
    return out;
};
const lchToLuv = (L, C, H, out)=>{
    const Hrad = H * TAU;
    out[0] = L;
    out[1] = Math.cos(Hrad) * C;
    out[2] = Math.sin(Hrad) * C;
    return out;
};
// HPLuv/HSLuv
const hpLuvOrHsluvToLch = (H, S, L, out, getChroma)=>{
    if (L > 1 - L_EPSILON) {
        out[0] = 1;
        out[1] = 0;
    } else if (L < L_EPSILON) {
        out[0] = out[1] = 0;
    } else {
        out[0] = L;
        out[1] = getChroma(L, H) * S;
    }
    out[2] = H;
    return out;
};
const lchToHpluvOrHsluv = (L, C, H, out, getChroma)=>{
    out[0] = H;
    if (L > 1 - L_EPSILON) {
        out[1] = 0;
        out[2] = 1;
    } else if (L < L_EPSILON) {
        out[1] = out[2] = 0;
    } else {
        out[1] = C / getChroma(L, H);
        out[2] = L;
    }
    return out;
};
// TODO: normalize
const getBounds = (L)=>{
    const result = [];
    const sub1 = (L + 16) ** 3 / 1560896;
    const sub2 = sub1 > EPSILON ? sub1 : L / KAPPA;
    let _g = 0;
    while(_g < 3){
        const c = _g++;
        const m1 = mXYZD65ToLinearsRGB[c];
        const m2 = mXYZD65ToLinearsRGB[c + 3];
        const m3 = mXYZD65ToLinearsRGB[c + 6];
        let _g1 = 0;
        while(_g1 < 2){
            const t = _g1++;
            const top1 = (284517 * m1 - 94839 * m3) * sub2;
            const top2 = (838422 * m3 + 769860 * m2 + 731718 * m1) * L * sub2 - 769860 * t * L;
            const bottom = (632260 * m3 - 126452 * m2) * sub2 + 126452 * t;
            result.push({
                slope: top1 / bottom,
                intercept: top2 / bottom
            });
        }
    }
    return result;
};
const distanceLineFromOrigin = ({ intercept, slope })=>Math.abs(intercept) / Math.sqrt(slope ** 2 + 1);
const maxSafeChromaForL = (L)=>{
    const bounds = getBounds(L * 100);
    let min = Infinity;
    let _g = 0;
    while(_g < bounds.length){
        const bound = bounds[_g];
        ++_g;
        const length = distanceLineFromOrigin(bound);
        min = Math.min(min, length);
    }
    return min / 100;
};
const lengthOfRayUntilIntersect = (theta, { intercept, slope })=>intercept / (Math.sin(theta) - slope * Math.cos(theta));
const maxChromaForLH = (L, H)=>{
    const hrad = H * TAU;
    const bounds = getBounds(L * 100);
    let min = Infinity;
    let _g = 0;
    while(_g < bounds.length){
        const bound = bounds[_g];
        ++_g;
        const length = lengthOfRayUntilIntersect(hrad, bound);
        if (length >= 0) min = Math.min(min, length);
    }
    return min / 100;
};
const hpluvToLch = (H, S, L, out)=>hpLuvOrHsluvToLch(H, S, L, out, maxSafeChromaForL);
const lchToHpluv = (L, C, H, out)=>lchToHpluvOrHsluv(L, C, H, out, maxSafeChromaForL);
const hsluvToLch = (H, S, L, out)=>hpLuvOrHsluvToLch(H, S, L, out, maxChromaForLH);
const lchToHsluv = (L, C, H, out)=>lchToHpluvOrHsluv(L, C, H, out, maxChromaForLH);
// Lch/Lab
// https://drafts.csswg.org/css-color/#lch-to-lab}
// https://drafts.csswg.org/css-color/#lab-to-lch}
/**
 * Return a Lab representation from LCH values.
 * @param {number} l
 * @param {number} c
 * @param {number} h
 * @param {Array} out
 * @returns {import("./lab.js").lab}
 */ const lchToLab = (l, c, h, out)=>{
    out[0] = l;
    out[1] = c * Math.cos(h * TAU);
    out[2] = c * Math.sin(h * TAU);
    // Range is [0, 150]
    out[1] *= 1.5;
    out[2] *= 1.5;
    return out;
};
/**
 * Return a Lch representation from Lab values.
 * @param {number} l
 * @param {number} a
 * @param {number} b
 * @param {Array} out
 * @returns {import("./lch.js").lch}
 */ const labToLch = (l, a, b, out)=>{
    out[0] = l;
    const ε = 250 / 100000 / 100; // Lab is -125, 125. TODO: range is different for Oklab
    // If is achromatic
    if (Math.abs(a) < ε && Math.abs(b) < ε) {
        out[1] = out[2] = 0;
    } else {
        const h = Math.atan2(b, a); // [-PI to PI]
        out[1] = Math.sqrt(a ** 2 + b ** 2);
        out[2] = (h >= 0 ? h : h + TAU) / TAU; // [0 to 1)
        // Range is [0, 150]
        out[1] /= 1.5;
    }
    return out;
};
// Lab/XYZ
// ε = 6^3 / 29^3 = 0.008856
// κ = 29^3 / 3^3 = 903.2962963
// 903.2962963 / 116 = 7.787037
const fromLabValueToXYZValue = (val, white)=>{
    const pow = val ** 3;
    return (pow > 0.008856 ? pow : (val - 16 / 116) / 7.787037) * white;
};
const fromXYZValueToLabValue = (val, white)=>{
    val /= white;
    return val > 0.008856 ? Math.cbrt(val) : 7.787037 * val + 16 / 116;
};
/**
 * Return a XYZ representation from Lab values with provided illuminant.
 * @param {number} l
 * @param {number} a
 * @param {number} b
 * @param {Array} out
 * @param {Array} illuminant
 * @returns {import("./xyz.js").xyz}
 */ const labToXyz = (l, a, b, out, illuminant)=>{
    const Y = (l + 0.16) / 1.16;
    out[0] = fromLabValueToXYZValue(a / 5 + Y, illuminant[0]);
    out[1] = fromLabValueToXYZValue(Y, illuminant[1]);
    out[2] = fromLabValueToXYZValue(Y - b / 2, illuminant[2]);
    return out;
};
/**
 * Return a lab representation from XYZ values with provided illuminant.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {Array} out
 * @param {Array} illuminant
 * @returns {import("./lab.js").lab}
 */ const xyzToLab = (x, y, z, out, illuminant)=>{
    const X = fromXYZValueToLabValue(x, illuminant[0]);
    const Y = fromXYZValueToLabValue(y, illuminant[1]);
    const Z = fromXYZValueToLabValue(z, illuminant[2]);
    out[0] = 1.16 * Y - 0.16;
    out[1] = 5 * (X - Y);
    out[2] = 2 * (Y - Z);
    return out;
};
// Ok
// https://github.com/bottosson/bottosson.github.io/blob/master/misc/colorpicker/colorconversion.js
// prettier-ignore
const mOklabToLMS = [
    1,
    1,
    1,
    0.3963377774,
    -0.1055613458,
    -0.0894841775,
    0.2158037573,
    -0.0638541728,
    -1.291485548
];
// prettier-ignore
const mLMSToLinear = [
    4.0767416621,
    -1.2684380046,
    -0.0041960863,
    -3.3077115913,
    2.6097574011,
    -0.7034186147,
    0.2309699292,
    -0.3413193965,
    1.707614701
];
// TODO: https://github.com/w3c/csswg-drafts/issues/6642#issuecomment-943521484
// prettier-ignore
const mLinearToLMS = [
    0.4122214708,
    0.2119034982,
    0.0883024619,
    0.5363325363,
    0.6806995451,
    0.2817188376,
    0.0514459929,
    0.1073969566,
    0.6299787005
];
// prettier-ignore
const mLMSToOklab = [
    0.2104542553,
    1.9779984951,
    0.0259040371,
    0.793617785,
    -2.428592205,
    0.7827717662,
    -0.0040720468,
    0.4505937099,
    -0.808675766
];
/**
 * Return a Linear representation from Oklab values.
 * @param {number} L
 * @param {number} a
 * @param {number} b
 * @param {Array} out
 * @returns {import("./linear.js").linear}
 */ const oklabToLinear = (L, a, b, out)=>{
    fromValues(out, L, a, b);
    transformMat3(out, mOklabToLMS);
    cubed3(out);
    return transformMat3(out, mLMSToLinear);
};
/**
 * Return a Oklab representation from Linear values.
 * @param {number} lr
 * @param {number} lg
 * @param {number} lb
 * @param {Array} out
 * @returns {import("./oklab.js").oklab}
 */ const linearToOklab = (lr, lg, lb, out)=>{
    fromValues(out, lr, lg, lb);
    transformMat3(out, mLinearToLMS);
    cbrt3(out);
    return transformMat3(out, mLMSToOklab);
};
const K1 = 0.206;
const K2 = 0.03;
const K3 = (1 + K1) / (1 + K2);
const toe = (x)=>0.5 * (K3 * x - K1 + Math.sqrt((K3 * x - K1) * (K3 * x - K1) + 4 * K2 * K3 * x));
const toeInv = (x)=>(x ** 2 + K1 * x) / (K3 * (x + K2));
const computeMaxSaturation = (a, b)=>{
    let k0, k1, k2, k3, k4, wl, wm, ws;
    if (-1.88170328 * a - 0.80936493 * b > 1) {
        k0 = 1.19086277;
        k1 = 1.76576728;
        k2 = 0.59662641;
        k3 = 0.75515197;
        k4 = 0.56771245;
        wl = mLMSToLinear[0];
        wm = mLMSToLinear[3];
        ws = mLMSToLinear[6];
    } else if (1.81444104 * a - 1.19445276 * b > 1) {
        k0 = 0.73956515;
        k1 = -0.45954404;
        k2 = 0.08285427;
        k3 = 0.1254107;
        k4 = 0.14503204;
        wl = mLMSToLinear[1];
        wm = mLMSToLinear[4];
        ws = mLMSToLinear[7];
    } else {
        k0 = 1.35733652;
        k1 = -915799e-8;
        k2 = -1.1513021;
        k3 = -0.50559606;
        k4 = 0.00692167;
        wl = mLMSToLinear[2];
        wm = mLMSToLinear[5];
        ws = mLMSToLinear[8];
    }
    const S = k0 + k1 * a + k2 * b + k3 * a ** 2 + k4 * a * b;
    const kl = mOklabToLMS[3] * a + mOklabToLMS[6] * b;
    const km = mOklabToLMS[4] * a + mOklabToLMS[7] * b;
    const ks = mOklabToLMS[5] * a + mOklabToLMS[8] * b;
    const l_ = 1 + S * kl;
    const m_ = 1 + S * km;
    const s_ = 1 + S * ks;
    const l = l_ ** 3;
    const m = m_ ** 3;
    const s = s_ ** 3;
    const ldS = 3 * kl * l_ ** 2;
    const mdS = 3 * km * m_ ** 2;
    const sdS = 3 * ks * s_ ** 2;
    const ldS2 = 6 * kl ** 2 * l_;
    const mdS2 = 6 * km ** 2 * m_;
    const sdS2 = 6 * ks ** 2 * s_;
    const f = wl * l + wm * m + ws * s;
    const f1 = wl * ldS + wm * mdS + ws * sdS;
    const f2 = wl * ldS2 + wm * mdS2 + ws * sdS2;
    return S - f * f1 / (f1 ** 2 - 0.5 * f * f2);
};
const findCusp = (a, b)=>{
    const sCusp = computeMaxSaturation(a, b);
    oklabToLinear(1, sCusp * a, sCusp * b, TMP);
    const lCusp = Math.cbrt(1 / Math.max(TMP[0], TMP[1], TMP[2]));
    return [
        lCusp,
        lCusp * sCusp
    ];
};
const getStMax = (a_, b_, cusp = null)=>{
    if (!cusp) cusp = findCusp(a_, b_);
    return [
        cusp[1] / cusp[0],
        cusp[1] / (1 - cusp[0])
    ];
};
const findGamutIntersection = (a, b, L1, C1, L0, cusp = null)=>{
    if (!cusp) cusp = findCusp(a, b);
    let t;
    if ((L1 - L0) * cusp[1] - (cusp[0] - L0) * C1 <= 0) {
        t = cusp[1] * L0 / (C1 * cusp[0] + cusp[1] * (L0 - L1));
    } else {
        t = cusp[1] * (L0 - 1) / (C1 * (cusp[0] - 1) + cusp[1] * (L0 - L1));
        const dL = L1 - L0;
        const dC = C1;
        const kl = mOklabToLMS[3] * a + mOklabToLMS[6] * b;
        const km = mOklabToLMS[4] * a + mOklabToLMS[7] * b;
        const ks = mOklabToLMS[5] * a + mOklabToLMS[8] * b;
        const l_dt = dL + dC * kl;
        const m_dt = dL + dC * km;
        const s_dt = dL + dC * ks;
        const L = L0 * (1 - t) + t * L1;
        const C = t * C1;
        const l_ = L + C * kl;
        const m_ = L + C * km;
        const s_ = L + C * ks;
        const l = l_ ** 3;
        const m = m_ ** 3;
        const s = s_ ** 3;
        const ldt = 3 * l_dt * l_ ** 2;
        const mdt = 3 * m_dt * m_ ** 2;
        const sdt = 3 * s_dt * s_ ** 2;
        const ldt2 = 6 * l_dt ** 2 * l_;
        const mdt2 = 6 * m_dt ** 2 * m_;
        const sdt2 = 6 * s_dt ** 2 * s_;
        const r = mLMSToLinear[0] * l + mLMSToLinear[3] * m + mLMSToLinear[6] * s - 1;
        const r1 = mLMSToLinear[0] * ldt + mLMSToLinear[3] * mdt + mLMSToLinear[6] * sdt;
        const r2 = mLMSToLinear[0] * ldt2 + mLMSToLinear[3] * mdt2 + mLMSToLinear[6] * sdt2;
        const ur = r1 / (r1 ** 2 - 0.5 * r * r2);
        let tr = -r * ur;
        const g = mLMSToLinear[1] * l + mLMSToLinear[4] * m + mLMSToLinear[7] * s - 1;
        const g1 = mLMSToLinear[1] * ldt + mLMSToLinear[4] * mdt + mLMSToLinear[7] * sdt;
        const g2 = mLMSToLinear[1] * ldt2 + mLMSToLinear[4] * mdt2 + mLMSToLinear[7] * sdt2;
        const ug = g1 / (g1 ** 2 - 0.5 * g * g2);
        let tg = -g * ug;
        const b0 = mLMSToLinear[2] * l + mLMSToLinear[5] * m + mLMSToLinear[8] * s - 1;
        const b1 = mLMSToLinear[2] * ldt + mLMSToLinear[5] * mdt + mLMSToLinear[8] * sdt;
        const b2 = mLMSToLinear[2] * ldt2 + mLMSToLinear[5] * mdt2 + mLMSToLinear[8] * sdt2;
        const ub = b1 / (b1 ** 2 - 0.5 * b0 * b2);
        let tb = -b0 * ub;
        tr = ur >= 0 ? tr : Number.MAX_VALUE; // 10e5
        tg = ug >= 0 ? tg : Number.MAX_VALUE; // 10e5
        tb = ub >= 0 ? tb : Number.MAX_VALUE; // 10e5
        t += Math.min(tr, tg, tb);
    }
    return t;
};
const getStMid = (a, b)=>{
    // prettier-ignore
    const Smid = 0.11516993 + 1 / (7.44778970 + 4.15901240 * b + a * (-2.19557347 + 1.75198401 * b + a * (-2.13704948 - 10.02301043 * b + a * (-4.24894561 + 5.38770819 * b + 4.69891013 * a))));
    // prettier-ignore
    const Tmid = 0.11239642 + 1 / (1.61320320 - 0.68124379 * b + a * (0.40370612 + 0.90148123 * b + a * (-0.27087943 + 0.61223990 * b + a * (299215e-8 - 0.45399568 * b - 0.14661872 * a))));
    return [
        Smid,
        Tmid
    ];
};
const getCs = (L, a_, b_)=>{
    const cusp = findCusp(a_, b_);
    const Cmax = findGamutIntersection(a_, b_, L, 1, L, cusp);
    const STmax = getStMax(a_, b_, cusp);
    const STmid = getStMid(a_, b_);
    const k = Cmax / Math.min(L * STmax[0], (1 - L) * STmax[1]);
    let Ca = L * STmid[0];
    let Cb = (1 - L) * STmid[1];
    const Cmid = 0.9 * k * Math.sqrt(Math.sqrt(1 / (1 / Ca ** 4 + 1 / Cb ** 4)));
    Ca = L * 0.4;
    Cb = (1 - L) * 0.8;
    return [
        Math.sqrt(1 / (1 / Ca ** 2 + 1 / Cb ** 2)),
        Cmid,
        Cmax
    ];
};

var utils = /*#__PURE__*/Object.freeze({
  __proto__: null,
  D50: D50,
  D65: D65,
  TAU: TAU,
  TMP: TMP,
  findCusp: findCusp,
  findGamutIntersection: findGamutIntersection,
  floorArray: floorArray,
  getCs: getCs,
  getStMax: getStMax,
  hpluvToLch: hpluvToLch,
  hsluvToLch: hsluvToLch,
  labToLch: labToLch,
  labToXyz: labToXyz,
  lchToHpluv: lchToHpluv,
  lchToHsluv: lchToHsluv,
  lchToLab: lchToLab,
  lchToLuv: lchToLuv,
  linearP3ToXyzD65: linearP3ToXyzD65,
  linearToOklab: linearToOklab,
  linearToRgb: linearToRgb,
  linearToSrgb: linearToSrgb,
  linearToXyzD50: linearToXyzD50,
  linearToXyzD65: linearToXyzD65,
  luvToLch: luvToLch,
  luvToXyz: luvToXyz,
  oklabToLinear: oklabToLinear,
  rgbToLinear: rgbToLinear,
  setAlpha: setAlpha,
  srgbToLinear: srgbToLinear,
  toe: toe,
  toeInv: toeInv,
  xyzD50ToLinear: xyzD50ToLinear,
  xyzD65ToLinear: xyzD65ToLinear,
  xyzD65ToLinearP3: xyzD65ToLinearP3,
  xyzToLab: xyzToLab,
  xyzToLuv: xyzToLuv
});

/**
 * @typedef {number[]} color An array of 3 (RGB) or 4 (A) values.
 *
 * All components in the range 0 <= x <= 1
 */ /**
 * Creates a new color from linear values.
 * @alias module:pex-color.create
 * @param {number} [r=0]
 * @param {number} [g=0]
 * @param {number} [b=0]
 * @param {number} [a]
 * @returns {color}
 */ function create(r = 0, g = 0, b = 0, a = 1) {
    return [
        r,
        g,
        b,
        a
    ];
}
/**
 * Returns a copy of a color.
 * @alias module:pex-color.copy
 * @param {color} color
 * @returns {color}
 */ function copy(color) {
    return color.slice();
}
/**
 * Sets a color to another color.
 * @alias module:pex-color.set
 * @param {color} color
 * @param {color} color2
 * @returns {color}
 */ function set(color, color2) {
    color[0] = color2[0];
    color[1] = color2[1];
    color[2] = color2[2];
    return setAlpha(color, color2[3]);
}
/**
 * Updates a color based on r, g, b, [a] values.
 * @alias module:pex-color.fromValues
 * @param {import("./color.js").color} color
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} [a]
 * @returns {import("./color.js").color}
 */ function fromValues(color, r, g, b, a) {
    color[0] = r;
    color[1] = g;
    color[2] = b;
    return setAlpha(color, a);
}
/**
 * @deprecated Use "fromValues()".
 * @ignore
 */ function fromRGB(color, r, g, b, a) {
    console.error(`"fromRGB()" deprecated. Use "fromValues()".`);
    return fromValues(color, r, g, b, a);
}
/**
 * @deprecated Use "set()".
 * @ignore
 */ function toRGB(color, out = []) {
    console.error(`"toRGB()" deprecated. Use "set()".`);
    return set(out, color);
}

/**
 * @typedef {number[]} bytes An array of 3 (RGB) or 4 (A) values in bytes.
 *
 * All components in the range 0 <= x <= 255
 */ /**
 * Updates a color based on byte values.
 * @alias module:pex-color.fromBytes
 * @param {import("./color.js").color} color
 * @param {bytes} bytes
 * @returns {import("./color.js").color}
 */ function fromBytes(color, [r, g, b, a]) {
    color[0] = r / 255;
    color[1] = g / 255;
    color[2] = b / 255;
    if (a !== undefined) color[3] = a / 255;
    return color;
}
/**
 * Get RGB[A] color components as bytes array.
 * @alias module:pex-color.toBytes
 * @param {import("./color.js").color} color
 * @param {Array} out
 * @returns {bytes}
 */ function toBytes(color, out = []) {
    out[0] = Math.round(color[0] * 255);
    out[1] = Math.round(color[1] * 255);
    out[2] = Math.round(color[2] * 255);
    if (color[3] !== undefined) out[3] = Math.round(color[3] * 255);
    return out;
}
/**
 * @deprecated Use "fromBytes()".
 * @ignore
 */ function fromRGBBytes(color, bytes) {
    console.error(`"fromRGBBytes()" deprecated. Use "fromBytes()".`);
    return fromBytes(color, bytes);
}
/**
 * @deprecated Use "toBytes()".
 * @ignore
 */ function toRGBBytes(color, out) {
    console.error(`"toRGBBytes()" deprecated. Use "toBytes()".`);
    return toBytes(color, out);
}

/**
 * @typedef {number[]} linear r g b linear values.
 *
 * All components in the range 0 <= x <= 1
 * @see {@link https://en.wikipedia.org/wiki/SRGB}
 */ /**
 * Updates a color based on linear values.
 * @alias module:pex-color.fromLinear
 * @param {import("./color.js").color} color
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} [a]
 * @returns {import("./color.js").color}
 */ function fromLinear(color, r, g, b, a) {
    linearToRgb(r, g, b, color);
    return setAlpha(color, a);
}
/**
 * Returns a linear color representation of a given color.
 * @alias module:pex-color.toLinear
 * @param {import("./color.js").color} color
 * @param {Array} out
 * @returns {linear}
 */ function toLinear([r, g, b, a], out = []) {
    rgbToLinear(r, g, b, out);
    return setAlpha(out, a);
}

/**
 * @typedef {number[]} xyz CIE XYZ.
 *
 * Components range: 0 <= x <= 0.95; 0 <= y <= 1; 0 <= z <= 1.08;
 * @see {@link https://en.wikipedia.org/wiki/CIE_1931_color_space}
 */ /**
 * Updates a color based on XYZ values and alpha using D50 standard illuminant.
 * @alias module:pex-color.fromXYZD50
 * @param {import("./color.js").color} color
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} a
 * @returns {import("./color.js").color}
 */ function fromXYZD50(color, x, y, z, a) {
    xyzD50ToLinear(x, y, z, color);
    linearToRgb(color[0], color[1], color[2], color);
    return setAlpha(color, a);
}
/**
 * Returns a XYZ representation of a given color using D50 standard illuminant.
 * @alias module:pex-color.toXYZD50
 * @param {import("./color.js").color} color
 * @param {Array} out
 * @returns {xyz}
 */ function toXYZD50([r, g, b, a], out = []) {
    rgbToLinear(r, g, b, out);
    linearToXyzD50(out[0], out[1], out[2], out);
    return setAlpha(out, a);
}
/**
 * Updates a color based on XYZ values and alpha using D65 standard illuminant.
 * @alias module:pex-color.fromXYZD65
 * @param {import("./color.js").color} color
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} a
 * @returns {import("./color.js").color}
 */ function fromXYZD65(color, x, y, z, a) {
    xyzD65ToLinear(x, y, z, color);
    linearToRgb(color[0], color[1], color[2], color);
    return setAlpha(color, a);
}
/**
 * Returns a XYZ representation of a given color using D65 standard illuminant.
 * @alias module:pex-color.toXYZD65
 * @param {import("./color.js").color} color
 * @param {Array} out
 * @returns {xyz}
 */ function toXYZD65([r, g, b, a], out = []) {
    rgbToLinear(r, g, b, out);
    linearToXyzD65(out[0], out[1], out[2], out);
    return setAlpha(out, a);
}

/**
 * @typedef {number[]} p3 r, g, b values (DCI-P3 color gamut, D65 whitepoint, sRGB gamma curve).
 *
 * All components in the range 0 <= x <= 1
 * @see {@link https://drafts.csswg.org/css-color/#color-conversion-code}
 */ /**
 * Updates a color based on P3 values and alpha using D65 standard illuminant.
 * @alias module:pex-color.fromP3
 * @param {import("./color.js").color} color
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} a
 * @returns {import("./color.js").color}
 */ function fromP3(color, r, g, b, a) {
    rgbToLinear(r, g, b, color);
    linearP3ToXyzD65(color[0], color[1], color[2], color);
    return fromXYZD65(color, color[0], color[1], color[2], a);
}
/**
 * Returns a P3 representation of a given color using D65 standard illuminant.
 * @alias module:pex-color.toP3
 * @param {import("./color.js").color} color
 * @param {Array} out
 * @returns {p3}
 */ function toP3(color, out = []) {
    toXYZD65(color, out);
    xyzD65ToLinearP3(out[0], out[1], out[2], out);
    return linearToRgb(out[0], out[1], out[2], out);
}

/**
 * @typedef {string} hex hexadecimal string (RGB[A] or RRGGBB[AA]).
 */ /**
 * Updates a color based on a hexadecimal string.
 * @alias module:pex-color.fromHex
 * @param {import("./color.js").color} color
 * @param {hex} hex Leading '#' is optional.
 * @returns {import("./color.js").color}
 */ function fromHex(color, hex) {
    hex = hex.replace(/^#/, "");
    let a = 1;
    if (hex.length === 8) {
        a = parseInt(hex.slice(6, 8), 16) / 255;
        hex = hex.slice(0, 6);
    } else if (hex.length === 4) {
        a = parseInt(hex.slice(3, 4).repeat(2), 16) / 255;
        hex = hex.slice(0, 3);
    }
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const num = parseInt(hex, 16);
    color[0] = (num >> 16 & 255) / 255;
    color[1] = (num >> 8 & 255) / 255;
    color[2] = (num & 255) / 255;
    if (color[3] !== undefined) color[3] = a;
    return color;
}
/**
 * Returns a hexadecimal string representation of a given color.
 * @alias module:pex-color.toHex
 * @param {import("./color.js").color} color
 * @param {boolean} alpha Handle alpha
 * @returns {hex}
 */ function toHex(color, alpha = true) {
    const c = color.map((val)=>Math.max(0, Math.min(255, Math.round(val * 255))));
    return `#${(c[2] | c[1] << 8 | c[0] << 16 | 1 << 24).toString(16).slice(1).toUpperCase()}${alpha && color[3] !== undefined && color[3] !== 1 ? (c[3] | 1 << 8).toString(16).slice(1) : ""}`;
}

/**
 * @typedef {number[]} hsl hue, saturation, lightness.
 *
 * All components in the range 0 <= x <= 1
 * @see {@link https://en.wikipedia.org/wiki/HSL_and_HSV}
 */ function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
}
/**
 * Updates a color based on HSL values and alpha.
 * @alias module:pex-color.fromHSL
 * @param {import("./color.js").color} color
 * @param {number} h
 * @param {number} s
 * @param {number} l
 * @param {number} [a]
 * @returns {import("./color.js").color}
 */ function fromHSL(color, h, s, l, a) {
    if (s === 0) {
        color[0] = color[1] = color[2] = l; // achromatic
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        color[0] = hue2rgb(p, q, h + 1 / 3);
        color[1] = hue2rgb(p, q, h);
        color[2] = hue2rgb(p, q, h - 1 / 3);
    }
    return setAlpha(color, a);
}
/**
 * Returns a HSL representation of a given color.
 * @alias module:pex-color.toHSL
 * @param {import("./color.js").color} color
 * @param {Array} out
 * @returns {hsl}
 */ function toHSL([r, g, b, a], out = []) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    out[2] = (max + min) / 2;
    if (max === min) {
        out[0] = out[1] = 0; // achromatic
    } else {
        const d = max - min;
        out[1] = out[2] > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r:
                out[0] = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                out[0] = (b - r) / d + 2;
                break;
            case b:
                out[0] = (r - g) / d + 4;
                break;
        }
        out[0] /= 6;
    }
    return setAlpha(out, a);
}

/**
 * @typedef {number[]} hwb hue, whiteness, blackness.
 *
 * All components in the range 0 <= x <= 1
 * @see {@link https://en.wikipedia.org/wiki/HWB_color_model}
 */ /**
 * Updates a color based on HWB values and alpha.
 * @alias module:pex-color.fromHWB
 * @param {import("./color.js").color} color
 * @param {number} h
 * @param {number} w
 * @param {number} b
 * @param {number} [a]
 * @returns {import("./color.js").color}
 */ function fromHWB(color, h, w, b, a) {
    if (w + b >= 1) {
        color[0] = color[1] = color[2] = w / (w + b);
    } else {
        fromHSL(color, h, 1, 0.5);
        for(let i = 0; i < 3; i++){
            color[i] *= 1 - w - b;
            color[i] += w;
        }
    }
    return setAlpha(color, a);
}
/**
 * Returns a HWB representation of a given color.
 * @alias module:pex-color.toHWB
 * @param {import("./color.js").color} color
 * @param {Array} out
 * @returns {hwb}
 */ function toHWB(color, out = []) {
    toHSL(color, out);
    out[1] = Math.min(color[0], color[1], color[2]);
    out[2] = 1 - Math.max(color[0], color[1], color[2]);
    return setAlpha(out, color[3]);
}

/**
 * @typedef {number[]} hsv hue, saturation, value.
 *
 * All components in the range 0 <= x <= 1
 * @see {@link https://en.wikipedia.org/wiki/HSL_and_HSV}
 */ /**
 * Updates a color based on HSV values and alpha.
 * @alias module:pex-color.fromHSV
 * @param {import("./color.js").color} color
 * @param {number} h
 * @param {number} s
 * @param {number} v
 * @param {number} [a]
 * @returns {import("./color.js").color}
 */ function fromHSV(color, h, s, v, a) {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch(i % 6){
        case 0:
            color[0] = v;
            color[1] = t;
            color[2] = p;
            break;
        case 1:
            color[0] = q;
            color[1] = v;
            color[2] = p;
            break;
        case 2:
            color[0] = p;
            color[1] = v;
            color[2] = t;
            break;
        case 3:
            color[0] = p;
            color[1] = q;
            color[2] = v;
            break;
        case 4:
            color[0] = t;
            color[1] = p;
            color[2] = v;
            break;
        case 5:
            color[0] = v;
            color[1] = p;
            color[2] = q;
            break;
    }
    return setAlpha(color, a);
}
/**
 * Returns a HSV representation of a given color.
 * @alias module:pex-color.toHSV
 * @param {import("./color.js").color} color
 * @param {Array} out
 * @returns {hsv}
 */ function toHSV([r, g, b, a], out = []) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    out[2] = max;
    const d = max - min;
    out[1] = max === 0 ? 0 : d / max;
    if (max === min) {
        out[0] = 0; // achromatic
    } else {
        switch(max){
            case r:
                out[0] = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                out[0] = (b - r) / d + 2;
                break;
            case b:
                out[0] = (r - g) / d + 4;
                break;
        }
        out[0] /= 6;
    }
    return setAlpha(out, a);
}

/**
 * @typedef {number[]} lab CIELAB perceptual Lightness, a* red/green, b* blue/yellow.
 *
 * Components range (D65): 0 <= l <= 1; -0.86183 <= a <= 0.98234; -1.0786 <= b <= 0.94478;
 *
 * Components range (D50): 0 <= l <= 1; -0.79287 <= a <= 0.9355; -1.12029 <= b <= 0.93388;
 * @see {@link https://en.wikipedia.org/wiki/CIELAB_color_space}
 */ function fromLab(color, l, a, b, α, { illuminant = D50, fromXYZ = fromXYZD50 } = {}) {
    labToXyz(l, a, b, color, illuminant);
    return fromXYZ(color, color[0], color[1], color[2], α);
}
function toLab(color, out = [], { illuminant = D50, toXYZ = toXYZD50 } = {}) {
    toXYZ(color, out);
    return xyzToLab(out[0], out[1], out[2], out, illuminant);
}
/**
 * Updates a color based on Lab values and alpha using D50 standard illuminant.
 * @alias module:pex-color.fromLabD50
 * @param {import("./color.js").color} color
 * @param {number} l
 * @param {number} a
 * @param {number} b
 * @param {number} α
 * @returns {import("./color.js").color}
 */ function fromLabD50(color, l, a, b, α) {
    return fromLab(color, l, a, b, α, {
        illuminant: D50,
        fromXYZ: fromXYZD50
    });
}
/**
 * Returns a Lab representation of a given color using D50 standard illuminant.
 * @alias module:pex-color.toLabD50
 * @param {import("./color.js").color} color
 * @param {Array} out
 * @returns {lab}
 */ function toLabD50(color, out = []) {
    return toLab(color, out, {
        illuminant: D50,
        toXYZ: toXYZD50
    });
}
/**
 * Updates a color based on Lab values and alpha using D65 standard illuminant.
 * @alias module:pex-color.fromLabD65
 * @param {import("./color.js").color} color
 * @param {number} l
 * @param {number} a
 * @param {number} b
 * @param {number} α
 * @returns {import("./color.js").color}
 */ function fromLabD65(color, l, a, b, α) {
    return fromLab(color, l, a, b, α, {
        illuminant: D65,
        fromXYZ: fromXYZD65
    });
}
/**
 * Returns a Lab representation of a given color using D65 standard illuminant.
 * @alias module:pex-color.toLabD65
 * @param {import("./color.js").color} color
 * @param {Array} out
 * @returns {lab}
 */ function toLabD65(color, out = []) {
    return toLab(color, out, {
        illuminant: D65,
        toXYZ: toXYZD65
    });
}

/**
 * @typedef {number[]} lch CIELCh Luminance Chroma Hue. Cylindrical form of Lab.
 *
 * All components in the range 0 <= x <= 1
 * @see {@link https://en.wikipedia.org/wiki/CIELAB_color_space#Cylindrical_model}
 */ /**
 * Updates a color based on LCH values and alpha.
 * @alias module:pex-color.fromLCH
 * @param {import("./color.js").color} color
 * @param {number} l
 * @param {number} c
 * @param {number} h
 * @param {number} [a]
 * @returns {import("./color.js").color}
 */ function fromLCH(color, l, c, h, a) {
    lchToLab(l, c, h, color);
    return fromLabD50(color, color[0], color[1], color[2], a);
}
/**
 * Returns a LCH representation of a given color.
 * @alias module:pex-color.toLCH
 * @param {import("./color.js").color} color
 * @param {Array} out
 * @returns {lch}
 */ function toLCH(color, out = []) {
    toLabD50(color, out);
    return labToLch(out[0], out[1], out[2], out);
}

/**
 * @typedef {number[]} oklab Cartesian form using D65 standard illuminant.
 *
 * Components range: 0 <= l <= 1; -0.233 <= a <= 0.276; -0.311 <= b <= 0.198;
 * @see {@link https://bottosson.github.io/posts/oklab/#converting-from-linear-srgb-to-oklab}
 */ /**
 * Updates a color based on Oklab values and alpha.
 * @alias module:pex-color.fromOklab
 * @param {import("./color.js").color} color
 * @param {number} L
 * @param {number} a
 * @param {number} b
 * @param {number} [α]
 * @returns {import("./color.js").color}
 */ function fromOklab(color, L, a, b, α) {
    oklabToLinear(L, a, b, color);
    linearToRgb(color[0], color[1], color[2], color);
    return setAlpha(color, α);
}
/**
 * Returns an Oklab representation of a given color.
 * @alias module:pex-color.toOklab
 * @param {import("./color.js").color} color
 * @param {Array} out
 * @returns {oklab}
 */ function toOklab([r, g, b, a], out = []) {
    rgbToLinear(r, g, b, out);
    linearToOklab(out[0], out[1], out[2], out);
    return setAlpha(out, a);
}

/**
 * @typedef {number[]} okhsv
 *
 * All components in the range 0 <= x <= 1
 * @see {@link https://bottosson.github.io/posts/colorpicker/#hsv-2}
 */ const S0 = 0.5;
/**
 * Updates a color based on Okhsv values and alpha.
 * @alias module:pex-color.fromOkhsv
 * @param {import("./color.js").color} color
 * @param {number} h
 * @param {number} s
 * @param {number} v
 * @param {number} [α]
 * @returns {import("./color.js").color}
 */ function fromOkhsv(color, h, s, v, α) {
    let L = toeInv(v);
    let a = 0; // null
    let b = 0; // null
    // Avoid processing gray or colors with undefined hues
    if (L !== 0 && s !== 0) {
        const a_ = Math.cos(TAU * h);
        const b_ = Math.sin(TAU * h);
        const [S, T] = getStMax(a_, b_);
        const k = 1 - S0 / S;
        const Lv = 1 - s * S0 / (S0 + T - T * k * s);
        const Cv = s * T * S0 / (S0 + T - T * k * s);
        L = v * Lv;
        let C = v * Cv;
        const Lvt = toeInv(Lv);
        const Cvt = Cv * Lvt / Lv;
        const Lnew = toeInv(L);
        C = C * Lnew / L;
        L = Lnew;
        oklabToLinear(Lvt, a_ * Cvt, b_ * Cvt, color);
        const scaleL = Math.cbrt(1 / Math.max(color[0], color[1], color[2], 0));
        L = L * scaleL;
        C = C * scaleL;
        a = C * a_;
        b = C * b_;
    }
    return fromOklab(color, L, a, b, α);
}
/**
 * Returns an Okhsv representation of a given color.
 * @alias module:pex-color.toOkhsv
 * @param {import("./color.js").color} color
 * @param {Array} out
 * @returns {okhsv}
 */ function toOkhsv(color, out = []) {
    toLinear(color, out);
    linearToOklab(out[0], out[1], out[2], out);
    const H = 0.5 + 0.5 * Math.atan2(-out[2], -out[1]) / Math.PI;
    let L = out[0];
    let C = Math.sqrt(out[1] * out[1] + out[2] * out[2]);
    if (L !== 0 && L !== 1 && C !== 0) {
        const a_ = out[1] / C;
        const b_ = out[2] / C;
        const [S, T] = getStMax(a_, b_);
        const t = T / (C + L * T);
        const Lv = t * L;
        const Cv = t * C;
        const Lvt = toeInv(Lv);
        const Cvt = Cv * Lvt / Lv;
        oklabToLinear(Lvt, a_ * Cvt, b_ * Cvt, out);
        const scaleL = Math.cbrt(1 / Math.max(out[0], out[1], out[2], 0));
        L = L / scaleL;
        C = C / scaleL;
        const toeL = toe(L);
        C = C * toeL / L;
        out[1] = (S0 + T) * Cv / (T * S0 + T * (1 - S0 / S) * Cv);
        out[2] = toeL / Lv;
    } else {
        out[1] = 0;
        out[2] = toe(L);
    }
    // Epsilon for saturation just needs to be sufficiently close when denoting achromatic
    const ε = 1e-4;
    if (Math.abs(out[1]) < ε || out[2] === 0) {
        out[0] = 0; // null
    } else {
        out[0] = H;
    }
    return out;
}

/**
 * @typedef {number[]} okhsl
 *
 * All components in the range 0 <= x <= 1
 * @see {@link https://bottosson.github.io/posts/colorpicker/#hsl-2}
 */ /**
 * Updates a color based on Okhsl values and alpha.
 * @alias module:pex-color.fromOkhsl
 * @param {import("./color.js").color} color
 * @param {number} h
 * @param {number} s
 * @param {number} l
 * @param {number} [α]
 * @returns {import("./color.js").color}
 */ function fromOkhsl(color, h, s, l, α) {
    if (l == 1) {
        color[0] = color[1] = color[2] = 1;
    } else if (l == 0) {
        color[0] = color[1] = color[2] = 0;
    } else {
        const a_ = Math.cos(TAU * h);
        const b_ = Math.sin(TAU * h);
        let L = toeInv(l);
        const [C0, Cmid, Cmax] = getCs(L, a_, b_);
        let C, t, k0, k1, k2;
        if (s < 0.8) {
            t = 1.25 * s;
            k0 = 0;
            k1 = 0.8 * C0;
            k2 = 1 - k1 / Cmid;
        } else {
            t = 5 * (s - 0.8);
            k0 = Cmid;
            k1 = 0.2 * Cmid * Cmid * 1.25 * 1.25 / C0;
            k2 = 1 - k1 / (Cmax - Cmid);
        }
        C = k0 + t * k1 / (1 - k2 * t);
        return fromOklab(color, L, C * a_, C * b_, α);
    }
    return setAlpha(color, α);
}
/**
 * Returns an Okhsl representation of a given color.
 * @alias module:pex-color.toOkhsl
 * @param {import("./color.js").color} color
 * @param {Array} out
 * @returns {okhsl}
 */ function toOkhsl(color, out = []) {
    toLinear(color, out);
    linearToOklab(out[0], out[1], out[2], out);
    const C = Math.sqrt(out[1] * out[1] + out[2] * out[2]);
    const a_ = out[1] / C;
    const b_ = out[2] / C;
    const L = out[0];
    out[0] = 0.5 + 0.5 * Math.atan2(-out[2], -out[1]) / Math.PI;
    const [C0, Cmid, Cmax] = getCs(L, a_, b_);
    out[2] = toe(L);
    if (out[2] !== 0 && out[2] !== 1 && C !== 0) {
        if (C < Cmid) {
            const k0 = 0;
            const k1 = 0.8 * C0;
            const k2 = 1 - k1 / Cmid;
            const t = (C - k0) / (k1 + k2 * (C - k0));
            out[1] = t * 0.8;
        } else {
            const k0 = Cmid;
            const k1 = 0.2 * Cmid * Cmid * 1.25 * 1.25 / C0;
            const k2 = 1 - k1 / (Cmax - Cmid);
            const t = (C - k0) / (k1 + k2 * (C - k0));
            out[1] = 0.8 + 0.2 * t;
        }
    } else {
        out[1] = 0;
    }
    // Epsilon for lightness should approach close to 32 bit lightness
    // Epsilon for saturation just needs to be sufficiently close when denoting achromatic
    let εL = 1e-7;
    let εS = 1e-4;
    const achromatic = Math.abs(out[1]) < εS;
    if (achromatic || Math.abs(1 - out[2]) < εL) {
        out[0] = 0; // null
        if (!achromatic) out[1] = 0;
    }
    return out;
}

/**
 * @typedef {number[]} oklch Cylindrical form using D65 standard illuminant.
 *
 * All components in the range 0 <= x <= 1
 * @see {@link https://drafts.csswg.org/css-color/#color-conversion-code}
 */ /**
 * Updates a color based on Oklch values and alpha.
 * @alias module:pex-color.fromOklch
 * @param {import("./color.js").color} color
 * @param {number} l
 * @param {number} c
 * @param {number} h
 * @param {number} [a]
 * @returns {import("./color.js").color}
 */ function fromOklch(color, l, c, h, a) {
    lchToLab(l, c, h, color);
    // Range is [0, 150]
    color[1] /= 1.5;
    color[2] /= 1.5;
    return fromOklab(color, color[0], color[1], color[2], a);
}
/**
 * Returns an Oklch representation of a given color.
 * @alias module:pex-color.toOklch
 * @param {import("./color.js").color} color
 * @param {Array} out
 * @returns {oklch}
 */ function toOklch(color, out = []) {
    toOklab(color, out);
    // Range is [0, 150]
    out[1] *= 1.5;
    out[2] *= 1.5;
    return labToLch(out[0], out[1], out[2], out);
}

/**
 * @typedef {number[]} lchuv CIELChuv Luminance Chroma Hue.
 *
 * All components in the range 0 <= x <= 1
 * @see {@link https://en.wikipedia.org/wiki/CIELUV}
 */ /**
 * Updates a color based on LCHuv values and alpha.
 * @alias module:pex-color.fromLCHuv
 * @param {import("./color.js").color} color
 * @param {number} l
 * @param {number} c
 * @param {number} h
 * @param {number} [a]
 * @returns {import("./color.js").color}
 */ function fromLCHuv(color, l, c, h, a) {
    lchToLuv(l, c, h, color);
    luvToXyz(color[0], color[1], color[2], color);
    return fromXYZD65(color, color[0], color[1], color[2], a);
}
/**
 * Returns a LCHuv representation of a given color.
 * @alias module:pex-color.toLCHuv
 * @param {import("./color.js").color} color
 * @param {Array} out
 * @returns {lchuv}
 */ function toLCHuv(color, out = []) {
    toXYZD65(color, out);
    xyzToLuv(out[0], out[1], out[2], out);
    return luvToLch(out[0], out[1], out[2], out);
}

/**
 * @typedef {number[]} hsluv CIELUV hue, saturation, lightness.
 *
 * All components in the range 0 <= x <= 1
 * @see {@link https://www.hsluv.org/}
 */ /**
 * Updates a color based on HSLuv values and alpha.
 * @alias module:pex-color.fromHSLuv
 * @param {import("./color.js").color} color
 * @param {number} h
 * @param {number} s
 * @param {number} l
 * @param {number} [a]
 * @returns {import("./color.js").color}
 */ function fromHSLuv(color, h, s, l, a) {
    hsluvToLch(h, s, l, color);
    return fromLCHuv(color, color[0], color[1], color[2], a);
}
/**
 * Returns a HSLuv representation of a given color.
 * @alias module:pex-color.toHSLuv
 * @param {import("./color.js").color} color
 * @param {Array} out
 * @returns {hsluv}
 */ function toHSLuv(color, out = []) {
    toLCHuv(color, out);
    return lchToHsluv(out[0], out[1], out[2], out);
}

/**
 * @typedef {number[]} hpluv CIELUV hue, saturation, lightness.
 *
 * All components in the range 0 <= x <= 1.
 */ /**
 * Updates a color based on HPLuv values and alpha.
 * @alias module:pex-color.fromHPLuv
 * @param {import("./color.js").color} color
 * @param {number} h
 * @param {number} s
 * @param {number} l
 * @param {number} [a]
 * @returns {import("./color.js").color}
 */ function fromHPLuv(color, h, s, l, a) {
    hpluvToLch(h, s, l, color);
    return fromLCHuv(color, color[0], color[1], color[2], a);
}
/**
 * Returns a HPLuv representation of a given color.
 * @alias module:pex-color.toHPLuv
 * @param {import("./color.js").color} color
 * @param {Array} out
 * @returns {hpluv}
 */ function toHPLuv(color, out = []) {
    toLCHuv(color, out);
    return lchToHpluv(out[0], out[1], out[2], out);
}

// Get the color without alpha
const getCoords = (color)=>color.slice(0, 3);
// Set alpha only when necessary
const setCSSAlpha = (a)=>a !== undefined && a !== 1 ? ` / ${a}` : "";
// Format color space
const toCSSColorSpace = (colorSpace, color, a)=>`color(${colorSpace} ${color.join(" ")}${setCSSAlpha(a)})`;
// sRGB color spaces:
// TODO: a98-rgb, prophoto-rgb, and rec2020
/**
 * Returns a rgb CSS string representation of a given color.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color}
 * @alias module:pex-color.toCSSRGB
 * @param {import("./color.js").color} color
 * @param {number} [precision=5]
 * @returns {css}
 */ function toCSSRGB(color, precision = 5) {
    set(TMP, getCoords(color));
    if (precision !== undefined) floorArray(TMP, precision);
    return toCSSColorSpace("srgb", TMP, color[3]);
}
/**
 * Returns a linear rgb CSS string representation of a given color.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color}
 * @alias module:pex-color.toCSSRGBLinear
 * @param {import("./color.js").color} color
 * @param {number} [precision=5]
 * @returns {css}
 */ function toCSSRGBLinear(color, precision = 5) {
    toLinear(getCoords(color), TMP);
    if (precision !== undefined) floorArray(TMP, precision);
    return toCSSColorSpace("srgb-linear", TMP, color[3]);
}
/**
 * Returns a P3 rgb CSS string representation of a given color.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color}
 * @alias module:pex-color.toCSSRGBLinear
 * @param {import("./color.js").color} color
 * @param {number} [precision=5]
 * @returns {css}
 */ function toCSSP3(color, precision = 5) {
    toP3(getCoords(color), TMP);
    if (precision !== undefined) floorArray(TMP, precision);
    return toCSSColorSpace("display-p3", TMP, color[3]);
}
/**
 * Returns a hsl CSS string representation of a given color.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hsl}
 * @alias module:pex-color.toCSSHSL
 * @param {import("./color.js").color} color
 * @param {number} [precision=5]
 * @returns {css}
 */ function toCSSHSL(color, precision = 5) {
    toHSL(getCoords(color), TMP);
    TMP[0] *= 360;
    TMP[1] *= 100;
    TMP[2] *= 100;
    if (precision !== undefined) floorArray(TMP, precision);
    return `hsl(${TMP[0]} ${TMP[1]}% ${TMP[2]}%${setCSSAlpha(color[3])})`;
}
/**
 * Returns a hwb CSS string representation of a given color.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hwb}
 * @alias module:pex-color.toCSSHWB
 * @param {import("./color.js").color} color
 * @param {number} [precision=5]
 * @returns {css}
 */ function toCSSHWB(color, precision = 5) {
    toHWB(getCoords(color), TMP);
    TMP[0] *= 360;
    if (precision !== undefined) floorArray(TMP, precision);
    return `hwb(${TMP[0]} ${TMP[1]}% ${TMP[2]}%${setCSSAlpha(color[3])})`;
}
// CIELAB color spaces:
/**
 * Returns a lab CSS string representation of a given color.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/lab}
 * @alias module:pex-color.toCSSLab
 * @param {import("./color.js").color} color
 * @param {number} [precision=5]
 * @returns {css}
 */ function toCSSLab(color, precision = 5) {
    toLab(getCoords(color), TMP);
    TMP[0] *= 100;
    TMP[1] *= 100;
    TMP[2] *= 100;
    if (precision !== undefined) floorArray(TMP, precision);
    return `lab(${TMP[0]}% ${TMP[1]} ${TMP[2]}${setCSSAlpha(color[3])})`;
}
/**
 * Returns a lab CSS string representation of a given color.
 * @alias module:pex-color.toCSSLab
 * @param {import("./color.js").color} color
 * @param {number} [precision=5]
 * @returns {css}
 */ function toCSSLabD65(color, precision = 5) {
    toLabD65(getCoords(color), TMP);
    TMP[0] *= 100;
    TMP[1] *= 100;
    TMP[2] *= 100;
    if (precision !== undefined) floorArray(TMP, precision);
    return `lab-d65(${TMP[0]}% ${TMP[1]} ${TMP[2]}${setCSSAlpha(color[3])})`;
}
/**
 * Returns a lch CSS string representation of a given color.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/lch}
 * @alias module:pex-color.toCSSLCH
 * @param {import("./color.js").color} color
 * @param {number} [precision=5]
 * @returns {css}
 */ function toCSSLCH(color, precision = 5) {
    toLCH(getCoords(color), TMP);
    TMP[0] *= 100;
    TMP[1] *= 150;
    TMP[2] *= 360;
    if (precision !== undefined) floorArray(TMP, precision);
    return `lch(${TMP[0]}% ${TMP[1]} ${TMP[2]}${setCSSAlpha(color[3])})`;
}
/**
 * Returns a lab CSS string representation of a given color.
 * @alias module:pex-color.toCSSOklab
 * @param {import("./color.js").color} color
 * @param {number} [precision=5]
 * @returns {css}
 */ function toCSSOklab(color, precision = 5) {
    toOklab(getCoords(color), TMP);
    TMP[0] *= 100;
    if (precision !== undefined) floorArray(TMP, precision);
    return `oklab(${TMP[0]}% ${TMP[1]} ${TMP[2]}${setCSSAlpha(color[3])})`;
}
/**
 * Returns a lch CSS string representation of a given color.
 * @alias module:pex-color.toCSSOklch
 * @param {import("./color.js").color} color
 * @param {number} [precision=5]
 * @returns {css}
 */ function toCSSOklch(color, precision = 5) {
    toOklch(getCoords(color), TMP);
    TMP[0] *= 100;
    TMP[2] *= 360;
    if (precision !== undefined) floorArray(TMP, precision);
    return `oklch(${TMP[0]}% ${TMP[1]} ${TMP[2]}${setCSSAlpha(color[3])})`;
}
// XYZ colors spaces:
/**
 * Returns a xyz-d50 CSS string representation of a given color.
 * @alias module:pex-color.toCSSXYZD50
 * @param {import("./color.js").color} color
 * @param {number} [precision=5]
 * @returns {css}
 */ function toCSSXYZD50(color, precision = 5) {
    toXYZD50(getCoords(color), TMP);
    if (precision !== undefined) floorArray(TMP, precision);
    return toCSSColorSpace("xyz-d50", TMP, color[3]);
}
/**
 * Returns a xyz (xyz-d65) CSS string representation of a given color.
 * @alias module:pex-color.toCSSXYZ
 * @param {import("./color.js").color} color
 * @param {number} [precision=5]
 * @returns {css}
 */ function toCSSXYZ(color, precision = 5) {
    toXYZD65(getCoords(color), TMP);
    if (precision !== undefined) floorArray(TMP, precision);
    return toCSSColorSpace("xyz", TMP, color[3]);
}

export { copy, create, fromBytes, fromHPLuv, fromHSL, fromHSLuv, fromHSV, fromHWB, fromHex, fromLCH, fromLCHuv, fromLab, fromLabD50, fromLabD65, fromLinear, fromOkhsl, fromOkhsv, fromOklab, fromOklch, fromP3, fromRGB, fromRGBBytes, fromValues, fromXYZD50, fromXYZD65, set, toBytes, toCSSHSL, toCSSHWB, toCSSLCH, toCSSLab, toCSSLabD65, toCSSOklab, toCSSOklch, toCSSP3, toCSSRGB, toCSSRGBLinear, toCSSXYZ, toCSSXYZD50, toHPLuv, toHSL, toHSLuv, toHSV, toHWB, toHex, toLCH, toLCHuv, toLab, toLabD50, toLabD65, toLinear, toOkhsl, toOkhsv, toOklab, toOklch, toP3, toRGB, toRGBBytes, toXYZD50, toXYZD65, utils };
