import { w as wellKnownSymbol, u as objectDefineProperty, _ as _export, A as toObject, n as lengthOfArrayLike, K as toIntegerOrInfinity, D as functionUncurryThis, e as fails, U as toString_1, V as requireObjectCoercible } from './common/es.error.cause-21133fd0.js';
import './common/esnext.iterator.find-0936adec.js';
import './common/iterate-ea425a93.js';
import { c as objectCreate } from './common/iterator-close-902907c1.js';
import './common/esnext.iterator.filter-faed8b2f.js';
import './common/esnext.iterator.map-e03af736.js';
import './common/_commonjsHelpers-0597c316.js';
import './common/call-with-safe-iteration-closing-68ae000a.js';

/** @module vp */

/**
 * List of codecs
 * @constant {import("../types.js").CodecItem[]}
 */
const VP_CODECS = [{
  name: "VP8",
  cccc: "vp08"
}, {
  name: "VP9",
  cccc: "vp09"
}
// { name: "VP10", cccc: "vp10" },
];

/**
 * List of VP profiles numbers
 * @constant {number[]}
 */
const VP_PROFILES = [0, 1, 2, 3];

/**
 * VP Levels
 * @constant {number[]}
 * @see [webmproject.org]{@link https://www.webmproject.org/vp9/mp4/}
 */
// prettier-ignore
const VP_LEVELS = ["1", "1.1", "2", "2.1", "3", "3.1", "4", "4.1", "5", "5.1", "5.2", "6", "6.1", "6.2"];

/**
 * List of supported bit depth
 * @constant {number[]}
 */
const VP_BIT_DEPTH = [8, 10, 12];

/** @private  */
const formatProfile = profile => String(profile).padStart(2, "0");

/** @private  */
const formatLevel = level => String(parseFloat(level) * 10).padStart(2, "0");

/** @private  */
const formatBitDepth = bitDepth => String(bitDepth).padStart(2, "0");

/** @private  */
const formatCodec = (cccc, PP, LL, DD) => `${cccc}.${PP}.${LL}.${DD}`;

/**
 * Return a list of all possible codec parameter string and their human readable names
 * @returns {import("../types.js").MediaCodecItem[]}
 */
const getAllItems = () => VP_CODECS.map(codec => VP_PROFILES.map(profile => VP_LEVELS.map(level => VP_BIT_DEPTH.map(bitDepth => ({
  name: `${codec.name} Profile ${profile} Level ${level} BitDepth ${bitDepth}`,
  codec: formatCodec(codec.cccc, formatProfile(profile), formatLevel(level), formatBitDepth(bitDepth))
}))))).flat(4);

/**
 * Get a codec parameter string
 * @param {import("../types.js").VPCodecOptions} options
 * @returns {string}
 */
const getCodec = ({
  name,
  profile,
  level,
  bitDepth
}) => {
  const codec = VP_CODECS.find(codec => codec.name === name);
  if (!codec) throw new Error(`Unknown VP Codec "${name}"`);
  if (!VP_PROFILES.includes(profile)) {
    throw new Error(`Unknown VP Profile "${profile}"`);
  }
  if (!VP_LEVELS.includes(level)) {
    throw new Error(`Unknown VP Level "${level}"`);
  }
  if (!VP_BIT_DEPTH.includes(bitDepth)) {
    throw new Error(`Unknown VP BitDepth "${bitDepth}"`);
  }
  return formatCodec(codec.cccc, formatProfile(profile), formatLevel(level), formatBitDepth(bitDepth));
};

/**
 * Get a codec human readbable name
 * @param {string} codec a codec string (avc1[.PPCCLL] eg. "avc1.640028")
 * @returns {string}
 */
const getCodecName = codec => getAllItems().find(item => item.codec === codec)?.name;

var vp = /*#__PURE__*/Object.freeze({
  __proto__: null,
  VP_CODECS: VP_CODECS,
  VP_PROFILES: VP_PROFILES,
  VP_LEVELS: VP_LEVELS,
  VP_BIT_DEPTH: VP_BIT_DEPTH,
  formatCodec: formatCodec,
  formatLevel: formatLevel,
  getAllItems: getAllItems,
  getCodec: getCodec,
  getCodecName: getCodecName
});

var defineProperty = objectDefineProperty.f;

var UNSCOPABLES = wellKnownSymbol('unscopables');
var ArrayPrototype = Array.prototype;

// Array.prototype[@@unscopables]
// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables
if (ArrayPrototype[UNSCOPABLES] == undefined) {
  defineProperty(ArrayPrototype, UNSCOPABLES, {
    configurable: true,
    value: objectCreate(null)
  });
}

// add a key to Array.prototype[@@unscopables]
var addToUnscopables = function (key) {
  ArrayPrototype[UNSCOPABLES][key] = true;
};

// `Array.prototype.at` method
// https://github.com/tc39/proposal-relative-indexing-method
_export({ target: 'Array', proto: true }, {
  at: function at(index) {
    var O = toObject(this);
    var len = lengthOfArrayLike(O);
    var relativeIndex = toIntegerOrInfinity(index);
    var k = relativeIndex >= 0 ? relativeIndex : len + relativeIndex;
    return (k < 0 || k >= len) ? undefined : O[k];
  }
});

addToUnscopables('at');

var charAt = functionUncurryThis(''.charAt);

var FORCED = fails(function () {
  // eslint-disable-next-line es/no-array-string-prototype-at -- safe
  return '𠮷'.at(-2) !== '\uD842';
});

// `String.prototype.at` method
// https://github.com/tc39/proposal-relative-indexing-method
_export({ target: 'String', proto: true, forced: FORCED }, {
  at: function at(index) {
    var S = toString_1(requireObjectCoercible(this));
    var len = S.length;
    var relativeIndex = toIntegerOrInfinity(index);
    var k = relativeIndex >= 0 ? relativeIndex : len + relativeIndex;
    return (k < 0 || k >= len) ? undefined : charAt(S, k);
  }
});

var charAt$1 = functionUncurryThis(''.charAt);
var charCodeAt = functionUncurryThis(''.charCodeAt);
var stringSlice = functionUncurryThis(''.slice);

var createMethod = function (CONVERT_TO_STRING) {
  return function ($this, pos) {
    var S = toString_1(requireObjectCoercible($this));
    var position = toIntegerOrInfinity(pos);
    var size = S.length;
    var first, second;
    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
    first = charCodeAt(S, position);
    return first < 0xD800 || first > 0xDBFF || position + 1 === size
      || (second = charCodeAt(S, position + 1)) < 0xDC00 || second > 0xDFFF
        ? CONVERT_TO_STRING
          ? charAt$1(S, position)
          : first
        : CONVERT_TO_STRING
          ? stringSlice(S, position, position + 2)
          : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
  };
};

var stringMultibyte = {
  // `String.prototype.codePointAt` method
  // https://tc39.es/ecma262/#sec-string.prototype.codepointat
  codeAt: createMethod(false),
  // `String.prototype.at` method
  // https://github.com/mathiasbynens/String.prototype.at
  charAt: createMethod(true)
};

// TODO: Remove from `core-js@4`

var charAt$2 = stringMultibyte.charAt;




// `String.prototype.at` method
// https://github.com/mathiasbynens/String.prototype.at
_export({ target: 'String', proto: true, forced: true }, {
  at: function at(index) {
    var S = toString_1(requireObjectCoercible(this));
    var len = S.length;
    var relativeIndex = toIntegerOrInfinity(index);
    var k = relativeIndex >= 0 ? relativeIndex : len + relativeIndex;
    return (k < 0 || k >= len) ? undefined : charAt$2(S, k);
  }
});

/** @module av */

/**
 * List of codecs
 * @constant {import("../types.js").CodecItem[]}
 */
const AV_CODECS = [{
  name: "AV1",
  cccc: "av01"
}
// { name: "AV2", cccc: "av02" },
];

/**
 * List of AV profiles numbers
 * @constant {number[]}
 * @see [av1-spec]{@link https://aomediacodec.github.io/av1-spec/#profiles}
 */
const AV_PROFILES = [{
  name: "Main",
  P: "0"
}, {
  name: "High",
  P: "1"
}, {
  name: "Professional",
  P: "2"
}];

/**
 * AV Levels
 * @constant {number[]}
 * @see [av1-spec]{@link https://aomediacodec.github.io/av1-spec/#levels}
 */
// prettier-ignore
const AV_LEVELS = ["2.0", "2.1", "2.2", "2.3", "3.0", "3.1", "3.2", "3.3", "4.0", "4.1", "4.2", "4.3", "5.0", "5.1", "5.2", "5.3", "6.0", "6.1", "6.2", "6.3", "7.0", "7.1", "7.2", "7.3"];

/**
 * List of supported tier
 * @constant {number[]}
 */
const AV_TIER = ["Main", "High"];

/**
 * List of supported bit depth
 * @constant {number[]}
 */
const AV_BIT_DEPTH = [8, 10, 12];

/** @private  */
const formatProfile$1 = ({
  P
}) => P;

/** @private  */
const convertLevel = level => {
  const [X, Y] = level.split(".");
  return (parseInt(X, 10) - 2) * 4 + parseInt(Y, 10);
};

/** @private  */
const formatLevel$1 = level => String(convertLevel(level)).padStart(2, "0");

/** @private  */
const formatTier = tier => tier.at(0);

/** @private  */
const formatBitDepth$1 = bitDepth => String(bitDepth).padStart(2, "0");

/** @private  */
const formatCodec$1 = (cccc, P, LL, T, DD) => `${cccc}.${P}.${LL}${T}.${DD}`;

/**
 * Return a list of all possible codec parameter string and their human readable names
 * @returns {import("../types.js").MediaCodecItem[]}
 */
const getAllItems$1 = () => AV_CODECS.map(codec => AV_PROFILES.map(profile => AV_LEVELS.map(level => AV_TIER.map(tier => {
  // The High tier is only available for level 4.0 and up.
  if (tier === "High" && convertLevel(level) < 8) return;
  return AV_BIT_DEPTH.map(bitDepth => {
    // 12 bitDepth is only available for the	"Professional" profile
    if (profile.P !== "2" && bitDepth === 12) return;
    return {
      name: `${codec.name} ${profile.name} Profile Level ${level} Tier ${tier} BitDepth ${bitDepth}`,
      codec: formatCodec$1(codec.cccc, formatProfile$1(profile), formatLevel$1(level), formatTier(tier), formatBitDepth$1(bitDepth))
    };
  });
})))).flat(4).filter(Boolean);

/**
 * Get a codec parameter string
 * @param {import("../types.js").AVCodecOptions} options
 * @returns {string}
 */
const getCodec$1 = ({
  name,
  profile: profileName,
  level,
  tier,
  bitDepth
}) => {
  const codec = AV_CODECS.find(codec => codec.name === name);
  if (!codec) throw new Error(`Unknown AV Codec "${name}"`);
  const profile = AV_PROFILES.find(profile => profile.name === profileName);
  if (!AV_PROFILES) {
    throw new Error(`Unknown AV Profile "${profileName}"`);
  }
  if (!AV_LEVELS.includes(level)) {
    throw new Error(`Unknown AV Level "${level}"`);
  }
  if (!AV_TIER.includes(tier)) {
    throw new Error(`Unknown AV Tier "${tier}"`);
  }
  if (!AV_BIT_DEPTH.includes(bitDepth)) {
    throw new Error(`Unknown AV BitDepth "${bitDepth}"`);
  }
  return formatCodec$1(codec.cccc, formatProfile$1(profile), formatLevel$1(level), formatTier(tier), formatBitDepth$1(bitDepth));
};

/**
 * Get a codec human readbable name
 * @param {string} codec a codec string (av01.P.LLT.DD eg. "av01.P.LLT.DD")
 * @returns {string}
 */
const getCodecName$1 = codec => getAllItems$1().find(item => item.codec === codec)?.name;

var av = /*#__PURE__*/Object.freeze({
  __proto__: null,
  AV_CODECS: AV_CODECS,
  AV_PROFILES: AV_PROFILES,
  AV_LEVELS: AV_LEVELS,
  AV_BIT_DEPTH: AV_BIT_DEPTH,
  formatCodec: formatCodec$1,
  formatLevel: formatLevel$1,
  getAllItems: getAllItems$1,
  getCodec: getCodec$1,
  getCodecName: getCodecName$1
});

/** @module avc */

/**
 * List of profiles with their profile numbers (PP) and the constraints component (CC).
 * @constant {import("../types.js").VCProfileItem[]}
 */
const AVC_PROFILES = [{
  name: "Constrained Baseline",
  PP: "42",
  CC: "40"
}, {
  name: "Baseline",
  PP: "42",
  CC: "00"
}, {
  name: "Extended",
  PP: "58",
  CC: "00"
}, {
  name: "Main",
  PP: "4d",
  CC: "00"
}, {
  name: "High",
  PP: "64",
  CC: "00"
}, {
  name: "Progressive High",
  PP: "64",
  CC: "08"
}, {
  name: "Constrained High",
  PP: "64",
  CC: "0c"
}, {
  name: "High 10",
  PP: "6e",
  CC: "00"
}, {
  name: "High 4:2:2",
  PP: "7a",
  CC: "00"
}, {
  name: "High 4:4:4 Predictive",
  PP: "f4",
  CC: "00"
}, {
  name: "High 10 Intra",
  PP: "6e",
  CC: "10"
}, {
  name: "High 4:2:2 Intra",
  PP: "7a",
  CC: "10"
}, {
  name: "High 4:4:4 Intra",
  PP: "f4",
  CC: "10"
}, {
  name: "CAVLC 4:4:4 Intra",
  PP: "44",
  CC: "00"
}, {
  name: "Scalable Baseline",
  PP: "53",
  CC: "00"
}, {
  name: "Scalable Constrained Baseline",
  PP: "53",
  CC: "04"
}, {
  name: "Scalable High",
  PP: "56",
  CC: "00"
}, {
  name: "Scalable Constrained High",
  PP: "56",
  CC: "04"
}, {
  name: "Scalable High Intra",
  PP: "56",
  CC: "20"
}, {
  name: "Stereo High",
  PP: "80",
  CC: "00"
}, {
  name: "Multiview High",
  PP: "76",
  CC: "00"
}, {
  name: "Multiview Depth High",
  PP: "8a",
  CC: "00"
}];
const cccc = "avc1";

/**
 * AVC Levels
 * @constant {number[]}
 * @see [wikipedia.org]{@link https://en.wikipedia.org/wiki/Advanced_Video_Coding#Levels}
 */
// prettier-ignore
const AVC_LEVELS = ["1", "1.1", "1.2", "1.3", "2", "2.1", "2.2", "3", "3.1", "3.2", "4", "4.1", "4.2", "5", "5.1", "5.2", "6", "6.1", "6.2"];

/** @private */
const formatLevel$2 = level => (parseFloat(level) * 10).toString(16).padStart(2, "0");

/** @private */
const formatCodec$2 = (cccc, {
  PP,
  CC
}, LL) => `${cccc}.${PP}${CC}${LL}`;

/**
 * Return a list of all possible codec parameter string and their human readable names
 * @returns {import("../types.js").MediaCodecItem[]}
 */
const getAllItems$2 = () => AVC_PROFILES.map(profile => AVC_LEVELS.map(level => ({
  name: `AVC ${profile.name} Profile Level ${level}`,
  codec: formatCodec$2(cccc, profile, formatLevel$2(level))
}))).flat();

/**
 * Get a codec parameter string
 * @param {import("../types.js").AVCCodecOptions} options
 * @returns {string}
 */
const getCodec$2 = ({
  profile: profileName,
  level
}) => {
  if (!AVC_LEVELS.includes(level)) throw new Error(`Unknown AVC Level "${level}"`);
  const profile = AVC_PROFILES.find(profile => profile.name === profileName);
  if (!profile) throw new Error(`Unknown AVC Profile "${profileName}"`);
  return formatCodec$2(cccc, profile, formatLevel$2(level));
};

/**
 * Get a codec human readbable name
 * @param {string} codec a codec string (cccc.PP.LL.DD eg. "vp09.00.10.08")
 * @returns {string}
 */
const getCodecName$2 = codec => getAllItems$2().find(item => item.codec === codec)?.name;

var avc = /*#__PURE__*/Object.freeze({
  __proto__: null,
  AVC_PROFILES: AVC_PROFILES,
  AVC_LEVELS: AVC_LEVELS,
  formatCodec: formatCodec$2,
  formatLevel: formatLevel$2,
  getAllItems: getAllItems$2,
  getCodec: getCodec$2,
  getCodecName: getCodecName$2
});

/** @module hevc */

/**
 * List of profiles with their profile numbers (PP) and the compatibility (C).
 * @constant {import("../types.js").VCProfileItem[]}
 * See Annexe 3 Profiles
 */
const HEVC_PROFILES = [{
  name: "Main",
  PP: "1"
}, {
  name: "Main 10",
  PP: "2"
}, {
  name: "Main Still Picture",
  PP: "3"
},
// Version 2
{
  name: "Range Extensions",
  PP: "4"
}, {
  name: "High Throughput",
  PP: "5"
}, {
  name: "Multiview Main",
  PP: "6"
}, {
  name: "Scalable Main",
  PP: "7"
},
// Version 3
{
  name: "3D Main",
  PP: "8"
}, {
  name: "Screen Extended",
  PP: "9"
}, {
  name: "Scalable Range Extensions",
  PP: "10"
}, {
  name: "High Throughput Screen Extended",
  PP: "11"
}];
const cccc$1 = "hev1"; // TODO: is "hvc1" necessary

/**
 * HEVC Profile Compatibility as a number in the 0..32 range
 * TODO: is that correct
 * @constant {number[]}
 */
const HEVC_PROFILE_COMPATIBILITY = Array.from({
  length: 32
}, (_, i) => i);

/**
 * HEVC Levels
 * @constant {number[]}
 * @see [hevc-levels]{@link https://en.wikipedia.org/wiki/High_Efficiency_Video_Coding#Tiers_and_levels}
 */
// prettier-ignore
const HEVC_LEVELS = ["1", "2", "2.1", "3", "3.1", "4", "4.1", "5", "5.1", "5.2", "6", "6.1", "6.2"];

/**
 * List of supported tier
 * @constant {number[]}
 */
const HEVC_TIER = ["Main", "High"];

// /**
//  * List of supported bit depth
//  * @constant {number[]}
//  */
// const HEVC_BIT_DEPTH = [8, 10, 12, 14, 16];

/** @private  */
const convertLevel$1 = level => parseFloat(level) * 10 * 3;

/** @private  */
const formatLevel$3 = level => String(convertLevel$1(level));

/** @private  */
const formatCompatibility = compatibility => compatibility.toString(16);

/** @private  */
const formatTier$1 = tier => tier === "Main" ? "L" : "H";

/** @private  */
const formatCodec$3 = (cccc, {
  PP
}, C, T, LL, CC) => `${cccc}.${PP}.${C}.${T}${LL}.${CC}`;

/**
 * Return a list of all possible codec parameter string and their human readable names
 * @returns {import("../types.js").MediaCodecItem[]}
 */
const getAllItems$3 = () => HEVC_PROFILES.map(profile => HEVC_PROFILE_COMPATIBILITY.map(compatibility => HEVC_LEVELS.map(level => HEVC_TIER.map(tier => {
  // The High tier is only available for level 4.0 and up.
  if (tier === "High" && convertLevel$1(level) < 120) return;
  return {
    name: `HEVC ${profile.name} Profile Compability ${compatibility} Level ${level} Tier ${tier}`,
    codec: formatCodec$3(cccc$1, profile, formatCompatibility(compatibility), formatTier$1(tier), formatLevel$3(level), "b0" // TODO
    )
  };
})))).flat(3).filter(Boolean);

/**
 * Get a codec parameter string
 * @param {import("../types.js").HEVCCodecOptions} options
 * @returns {string}
 */
const getCodec$3 = ({
  profile: profileName,
  compatibility,
  level,
  tier,
  constraint = "b0"
}) => {
  const profile = HEVC_PROFILES.find(profile => profile.name === profileName);
  if (!profile) throw new Error(`Unknown HEVC profile "${profileName}"`);
  if (!HEVC_LEVELS.includes(level)) {
    throw new Error(`Unknown HEVC Level "${level}"`);
  }
  if (!HEVC_TIER.includes(tier)) {
    throw new Error(`Unknown HEVC Tier "${tier}"`);
  }
  return formatCodec$3(cccc$1, profile, formatCompatibility(compatibility), formatLevel$3(level), formatTier$1(tier), constraint);
};

/**
 * Get a codec human readbable name
 * @param {string} codec a codec string (cccc.PP.C.TLL.CC eg. "hev1.1.3.H34.B0")
 * @returns {string}
 */
const getCodecName$3 = codec => getAllItems$3().find(item => item.codec === codec)?.name;

var hevc = /*#__PURE__*/Object.freeze({
  __proto__: null,
  HEVC_PROFILES: HEVC_PROFILES,
  HEVC_LEVELS: HEVC_LEVELS,
  formatCodec: formatCodec$3,
  formatLevel: formatLevel$3,
  getAllItems: getAllItems$3,
  getCodec: getCodec$3,
  getCodecName: getCodecName$3
});

export { av as AV, avc as AVC, hevc as HEVC, vp as VP };
