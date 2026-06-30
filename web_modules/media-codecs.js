/** @module vp */ /**
 * List of codecs
 * @constant
 * @type {import("../types.js").CodecItem[]}
 */ const VP_CODECS = [
    {
        name: "VP8",
        cccc: "vp08"
    },
    {
        name: "VP9",
        cccc: "vp09"
    }
];
/**
 * List of VP profiles numbers
 * @constant {number[]}
 */ const VP_PROFILES = [
    0,
    1,
    2,
    3
];
/**
 * VP Levels
 * @constant
 * @type {string[]}
 * @see [webmproject.org]{@link https://www.webmproject.org/vp9/mp4/}
 */ // prettier-ignore
const VP_LEVELS = [
    "1",
    "1.1",
    "2",
    "2.1",
    "3",
    "3.1",
    "4",
    "4.1",
    "5",
    "5.1",
    "5.2",
    "6",
    "6.1",
    "6.2"
];
/**
 * List of supported bit depth
 * @constant
 * @type {number[]}
 */ const VP_BIT_DEPTH = [
    8,
    10,
    12
];
/** @private  */ const formatProfile$1 = (profile)=>String(profile).padStart(2, "0");
/** @private  */ const formatLevel$3 = (level)=>String(parseFloat(level) * 10).padStart(2, "0");
/** @private  */ const formatBitDepth$1 = (bitDepth)=>String(bitDepth).padStart(2, "0");
/** @private  */ const formatCodec$3 = (cccc, PP, LL, DD)=>`${cccc}.${PP}.${LL}.${DD}`;
/**
 * Return a list of all possible codec parameter string and their human readable names
 * @returns {import("../types.js").MediaCodecItem[]}
 */ const getAllItems$3 = ()=>VP_CODECS.map((codec)=>VP_PROFILES.map((profile)=>VP_LEVELS.map((level)=>VP_BIT_DEPTH.map((bitDepth)=>({
                        name: `${codec.name} Profile ${profile} Level ${level} BitDepth ${bitDepth}`,
                        codec: formatCodec$3(codec.cccc, formatProfile$1(profile), formatLevel$3(level), formatBitDepth$1(bitDepth))
                    }))))).flat(4);
/**
 * Get a codec parameter string
 * @param {import("../types.js").VPCodecOptions} options
 * @returns {string}
 */ const getCodec$3 = ({ name, profile, level, bitDepth })=>{
    const codec = VP_CODECS.find((codec)=>codec.name === name);
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
    return formatCodec$3(codec.cccc, formatProfile$1(profile), formatLevel$3(level), formatBitDepth$1(bitDepth));
};
/**
 * Get a codec human readbable name
 * @param {string} codec a codec string (avc1[.PPCCLL] eg. "avc1.640028")
 * @returns {string}
 */ const getCodecName$3 = (codec)=>getAllItems$3().find((item)=>item.codec === codec)?.name;

var vp = /*#__PURE__*/Object.freeze({
  __proto__: null,
  VP_BIT_DEPTH: VP_BIT_DEPTH,
  VP_CODECS: VP_CODECS,
  VP_LEVELS: VP_LEVELS,
  VP_PROFILES: VP_PROFILES,
  formatCodec: formatCodec$3,
  formatLevel: formatLevel$3,
  getAllItems: getAllItems$3,
  getCodec: getCodec$3,
  getCodecName: getCodecName$3
});

/** @module av */ /**
 * List of codecs
 * @constant
 * @type {import("../types.js").CodecItem[]}
 */ const AV_CODECS = [
    {
        name: "AV1",
        cccc: "av01"
    }
];
/**
 * List of AV profiles numbers
 * @constant
 * @type {import("../types.js").AVProfileItem[]}
 * @see [av1-spec]{@link https://aomediacodec.github.io/av1-spec/#profiles}
 */ const AV_PROFILES = [
    {
        name: "Main",
        P: "0"
    },
    {
        name: "High",
        P: "1"
    },
    {
        name: "Professional",
        P: "2"
    }
];
/**
 * AV Levels
 * @constant
 * @type {string[]}
 * @see [av1-spec]{@link https://aomediacodec.github.io/av1-spec/#levels}
 */ // prettier-ignore
const AV_LEVELS = [
    "2.0",
    "2.1",
    "2.2",
    "2.3",
    "3.0",
    "3.1",
    "3.2",
    "3.3",
    "4.0",
    "4.1",
    "4.2",
    "4.3",
    "5.0",
    "5.1",
    "5.2",
    "5.3",
    "6.0",
    "6.1",
    "6.2",
    "6.3",
    "7.0",
    "7.1",
    "7.2",
    "7.3"
];
/**
 * List of supported tier
 * @constant
 * @type {string[]}
 */ const AV_TIER = [
    "Main",
    "High"
];
/**
 * List of supported bit depth
 * @constant
 * @type {number[]}
 */ const AV_BIT_DEPTH = [
    8,
    10,
    12
];
/** @private  */ const formatProfile = ({ P })=>P;
/** @private  */ const convertLevel$1 = (level)=>{
    const [X, Y] = level.split(".");
    return (parseInt(X, 10) - 2) * 4 + parseInt(Y, 10);
};
/** @private  */ const formatLevel$2 = (level)=>String(convertLevel$1(level)).padStart(2, "0");
/** @private  */ const formatTier$1 = (tier)=>tier.at(0);
/** @private  */ const formatBitDepth = (bitDepth)=>String(bitDepth).padStart(2, "0");
/** @private  */ const formatCodec$2 = (cccc, P, LL, T, DD)=>`${cccc}.${P}.${LL}${T}.${DD}`;
/**
 * Return a list of all possible codec parameter string and their human readable names
 * @returns {import("../types.js").MediaCodecItem[]}
 */ const getAllItems$2 = ()=>AV_CODECS.map((codec)=>AV_PROFILES.map((profile)=>AV_LEVELS.map((level)=>AV_TIER.map((tier)=>{
                    // The High tier is only available for level 4.0 and up.
                    if (tier === "High" && convertLevel$1(level) < 8) return;
                    return AV_BIT_DEPTH.map((bitDepth)=>{
                        // 12 bitDepth is only available for the	"Professional" profile
                        if (profile.P !== "2" && bitDepth === 12) return;
                        return {
                            name: `${codec.name} ${profile.name} Profile Level ${level} Tier ${tier} BitDepth ${bitDepth}`,
                            codec: formatCodec$2(codec.cccc, formatProfile(profile), formatLevel$2(level), formatTier$1(tier), formatBitDepth(bitDepth))
                        };
                    });
                })))).flat(4).filter(Boolean);
/**
 * Get a codec parameter string
 * @param {import("../types.js").AVCodecOptions} options
 * @returns {string}
 */ const getCodec$2 = ({ name, profile: profileName, level, tier, bitDepth })=>{
    const codec = AV_CODECS.find((codec)=>codec.name === name);
    if (!codec) throw new Error(`Unknown AV Codec "${name}"`);
    const profile = AV_PROFILES.find((profile)=>profile.name === profileName);
    if (!profile) {
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
    return formatCodec$2(codec.cccc, formatProfile(profile), formatLevel$2(level), formatTier$1(tier), formatBitDepth(bitDepth));
};
/**
 * Get a codec human readbable name
 * @param {string} codec a codec string (av01.P.LLT.DD eg. "av01.P.LLT.DD")
 * @returns {string}
 */ const getCodecName$2 = (codec)=>getAllItems$2().find((item)=>item.codec === codec)?.name;

var av = /*#__PURE__*/Object.freeze({
  __proto__: null,
  AV_BIT_DEPTH: AV_BIT_DEPTH,
  AV_CODECS: AV_CODECS,
  AV_LEVELS: AV_LEVELS,
  AV_PROFILES: AV_PROFILES,
  AV_TIER: AV_TIER,
  formatCodec: formatCodec$2,
  formatLevel: formatLevel$2,
  getAllItems: getAllItems$2,
  getCodec: getCodec$2,
  getCodecName: getCodecName$2
});

/** @module avc */ /**
 * List of profiles with their profile numbers (PP) and the constraints component (CC).
 * @constant
 * @type {import("../types.js").AVCProfileItem[]}
 */ const AVC_PROFILES = [
    {
        name: "Constrained Baseline",
        PP: "42",
        CC: "40"
    },
    {
        name: "Baseline",
        PP: "42",
        CC: "00"
    },
    {
        name: "Extended",
        PP: "58",
        CC: "00"
    },
    {
        name: "Main",
        PP: "4d",
        CC: "00"
    },
    {
        name: "High",
        PP: "64",
        CC: "00"
    },
    {
        name: "Progressive High",
        PP: "64",
        CC: "08"
    },
    {
        name: "Constrained High",
        PP: "64",
        CC: "0c"
    },
    {
        name: "High 10",
        PP: "6e",
        CC: "00"
    },
    {
        name: "High 4:2:2",
        PP: "7a",
        CC: "00"
    },
    {
        name: "High 4:4:4 Predictive",
        PP: "f4",
        CC: "00"
    },
    {
        name: "High 10 Intra",
        PP: "6e",
        CC: "10"
    },
    {
        name: "High 4:2:2 Intra",
        PP: "7a",
        CC: "10"
    },
    {
        name: "High 4:4:4 Intra",
        PP: "f4",
        CC: "10"
    },
    {
        name: "CAVLC 4:4:4 Intra",
        PP: "2c",
        CC: "00"
    },
    {
        name: "Scalable Baseline",
        PP: "53",
        CC: "00"
    },
    {
        name: "Scalable Constrained Baseline",
        PP: "53",
        CC: "04"
    },
    {
        name: "Scalable High",
        PP: "56",
        CC: "00"
    },
    {
        name: "Scalable Constrained High",
        PP: "56",
        CC: "04"
    },
    {
        name: "Scalable High Intra",
        PP: "56",
        CC: "10"
    },
    {
        name: "Stereo High",
        PP: "80",
        CC: "00"
    },
    {
        name: "Multiview High",
        PP: "76",
        CC: "00"
    },
    {
        name: "Multiview Depth High",
        PP: "8a",
        CC: "00"
    }
];
const cccc$1 = "avc1";
/**
 * AVC Levels
 * @constant
 * @type {number[]}
 * @see [wikipedia.org]{@link https://en.wikipedia.org/wiki/Advanced_Video_Coding#Levels}
 */ // prettier-ignore
const AVC_LEVELS = [
    "1",
    "1.1",
    "1.2",
    "1.3",
    "2",
    "2.1",
    "2.2",
    "3",
    "3.1",
    "3.2",
    "4",
    "4.1",
    "4.2",
    "5",
    "5.1",
    "5.2",
    "6",
    "6.1",
    "6.2"
];
/** @private */ const formatLevel$1 = (level)=>(parseFloat(level) * 10).toString(16).padStart(2, "0");
/** @private */ const formatCodec$1 = (cccc, { PP, CC }, LL)=>`${cccc}.${PP}${CC}${LL}`;
/**
 * Return a list of all possible codec parameter string and their human readable names
 * @returns {import("../types.js").MediaCodecItem[]}
 */ const getAllItems$1 = ()=>AVC_PROFILES.map((profile)=>AVC_LEVELS.map((level)=>({
                name: `AVC ${profile.name} Profile Level ${level}`,
                codec: formatCodec$1(cccc$1, profile, formatLevel$1(level))
            }))).flat();
/**
 * Get a codec parameter string
 * @param {import("../types.js").AVCCodecOptions} options
 * @returns {string}
 */ const getCodec$1 = ({ profile: profileName, level })=>{
    if (!AVC_LEVELS.includes(level)) throw new Error(`Unknown AVC Level "${level}"`);
    const profile = AVC_PROFILES.find((profile)=>profile.name === profileName);
    if (!profile) throw new Error(`Unknown AVC Profile "${profileName}"`);
    return formatCodec$1(cccc$1, profile, formatLevel$1(level));
};
/**
 * Get a codec human readbable name
 * @param {string} codec a codec string (cccc.PP.LL.DD eg. "vp09.00.10.08")
 * @returns {string}
 */ const getCodecName$1 = (codec)=>getAllItems$1().find((item)=>item.codec === codec)?.name;

var avc = /*#__PURE__*/Object.freeze({
  __proto__: null,
  AVC_LEVELS: AVC_LEVELS,
  AVC_PROFILES: AVC_PROFILES,
  formatCodec: formatCodec$1,
  formatLevel: formatLevel$1,
  getAllItems: getAllItems$1,
  getCodec: getCodec$1,
  getCodecName: getCodecName$1
});

/** @module hevc */ /**
 * List of profiles with their profile numbers (PP), profile compatibility flags (C),
 * and default constraint bytes.
 *
 * C is a hex string where bit N being set means the stream conforms to HEVC profile N.
 * constraints holds up to 6 bytes encoding general source and profile-specific constraint flags;
 * trailing zero bytes are omitted when formatted.
 * @constant
 * @type {import("../types.js").HEVCProfileItem[]}
 * @see [hevc-spec]{@link https://www.itu.int/rec/T-REC-H.265/en}
 */ const HEVC_PROFILES = [
    {
        name: "Main",
        PP: "1",
        C: "6",
        constraints: [
            "b0"
        ]
    },
    {
        name: "Main 10",
        PP: "2",
        C: "4",
        constraints: [
            "b0"
        ]
    },
    // Main Still Picture adds general_one_picture_only_constraint_flag (0x08) to the first constraint byte
    {
        name: "Main Still Picture",
        PP: "3",
        C: "c",
        constraints: [
            "b8"
        ]
    },
    // Version 2
    {
        name: "Range Extensions",
        PP: "4",
        C: "10",
        constraints: [
            "b0"
        ]
    },
    {
        name: "High Throughput",
        PP: "5",
        C: "20",
        constraints: [
            "b0"
        ]
    },
    {
        name: "Multiview Main",
        PP: "6",
        C: "40",
        constraints: [
            "b0"
        ]
    },
    {
        name: "Scalable Main",
        PP: "7",
        C: "80",
        constraints: [
            "b0"
        ]
    },
    // Version 3
    {
        name: "3D Main",
        PP: "8",
        C: "100",
        constraints: [
            "b0"
        ]
    },
    {
        name: "Screen Extended",
        PP: "9",
        C: "200",
        constraints: [
            "b0"
        ]
    },
    {
        name: "Scalable Range Extensions",
        PP: "10",
        C: "400",
        constraints: [
            "b0"
        ]
    },
    {
        name: "High Throughput Screen Extended",
        PP: "11",
        C: "800",
        constraints: [
            "b0"
        ]
    }
];
const cccc = "hev1"; // TODO: is "hvc1" necessary
/**
 * Constraint arrays for standard profiles (PP 1, 2, 3).
 *
 * Only byte 0 is used; its layout is:
 *   bit 7: general_progressive_source_flag
 *   bit 6: general_interlaced_source_flag
 *   bit 5: general_non_packed_constraint_flag
 *   bit 4: general_frame_only_constraint_flag
 *   bit 3: general_one_picture_only_constraint_flag
 *   bits 2–0: reserved zero
 * 32 entries covering all combinations of bits 7–3.
 * @constant
 * @type {string[][]}
 */ const HEVC_CONSTRAINTS = Array.from({
    length: 32
}, (_, i)=>[
        (i << 3).toString(16).padStart(2, "0")
    ]);
/**
 * Constraint arrays for RExt non-HT profiles (PP 4, 6, 7, 8).
 *
 * Byte 0:
 *   bits 7–4: source flags (progressive, interlaced, non_packed, frame_only)
 *   bit 3: general_max_12bit_constraint_flag
 *   bit 2: general_max_10bit_constraint_flag  (implies max_12bit)
 *   bit 1: general_max_8bit_constraint_flag   (implies max_10bit)
 *   bit 0: general_max_422chroma_constraint_flag
 *
 * Byte 1 (omitted when all zero):
 *   bit 7: general_max_420chroma_constraint_flag  (implies max_422chroma)
 *   bit 6: general_max_monochrome_constraint_flag (implies max_420chroma)
 *   bit 5: general_intra_constraint_flag
 *   bit 4: general_one_picture_only_constraint_flag
 *   bit 3: general_lower_bit_rate_constraint_flag
 *   bits 2–0: reserved zero
 *
 * Monotonic depth: max_8bit → max_10bit → max_12bit (4 valid combos).
 * Monotonic chroma: max_monochrome → max_420chroma → max_422chroma (4 valid combos).
 * 2048 entries total (16 source × 4 depth × 4 chroma × 2 intra × 2 opo × 2 lbr).
 * @constant
 * @type {string[][]}
 */ const HEVC_REXT_CONSTRAINTS = (()=>{
    const depthNibbles = [
        0x0,
        0x8,
        0xc,
        0xe
    ]; // none / max_12bit / max_10bit / max_8bit (bits 3–1)
    // prettier-ignore
    const chromaCombos = [
        [
            0,
            0,
            0
        ],
        [
            1,
            0,
            0
        ],
        [
            1,
            1,
            0
        ],
        [
            1,
            1,
            1
        ]
    ]; // [max_422chroma, max_420chroma, max_monochrome]
    const result = [];
    for(let src = 0; src < 16; src++){
        for (const depth of depthNibbles){
            for (const [c422, c420, mono] of chromaCombos){
                for(let intra = 0; intra <= 1; intra++){
                    for(let opo = 0; opo <= 1; opo++){
                        for(let lbr = 0; lbr <= 1; lbr++){
                            const byte0 = src << 4 | depth | c422;
                            const byte1 = c420 << 7 | mono << 6 | intra << 5 | opo << 4 | lbr << 3;
                            const b0 = byte0.toString(16).padStart(2, "0");
                            const b1 = byte1.toString(16).padStart(2, "0");
                            result.push(byte1 === 0 ? [
                                b0
                            ] : [
                                b0,
                                b1
                            ]);
                        }
                    }
                }
            }
        }
    }
    return result; // 2048 entries
})();
/**
 * Constraint arrays for HT profiles (PP 5, 9, 10, 11).
 *
 * Same byte layout as HEVC_REXT_CONSTRAINTS but byte 1 bit 2 carries
 * general_max_14bit_constraint_flag, extending the depth hierarchy:
 * max_8bit → max_10bit → max_12bit → max_14bit (5 valid depth combos).
 * 2560 entries total (16 source × 5 depth × 4 chroma × 2 intra × 2 opo × 2 lbr).
 * @constant
 * @type {string[][]}
 */ const HEVC_HT_CONSTRAINTS = (()=>{
    // [byte0_depth_nibble (bits 3–1), byte1_max14bit (bit 2)]
    // prettier-ignore
    const depthCombos = [
        [
            0x0,
            0
        ],
        [
            0x0,
            1
        ],
        [
            0x8,
            1
        ],
        [
            0xc,
            1
        ],
        [
            0xe,
            1
        ]
    ]; // none/max_14bit/max_12bit/max_10bit/max_8bit
    // prettier-ignore
    const chromaCombos = [
        [
            0,
            0,
            0
        ],
        [
            1,
            0,
            0
        ],
        [
            1,
            1,
            0
        ],
        [
            1,
            1,
            1
        ]
    ];
    const result = [];
    for(let src = 0; src < 16; src++){
        for (const [depth, max14] of depthCombos){
            for (const [c422, c420, mono] of chromaCombos){
                for(let intra = 0; intra <= 1; intra++){
                    for(let opo = 0; opo <= 1; opo++){
                        for(let lbr = 0; lbr <= 1; lbr++){
                            const byte0 = src << 4 | depth | c422;
                            const byte1 = c420 << 7 | mono << 6 | intra << 5 | opo << 4 | lbr << 3 | max14 << 2;
                            const b0 = byte0.toString(16).padStart(2, "0");
                            const b1 = byte1.toString(16).padStart(2, "0");
                            result.push(byte1 === 0 ? [
                                b0
                            ] : [
                                b0,
                                b1
                            ]);
                        }
                    }
                }
            }
        }
    }
    return result; // 2560 entries
})();
/** @private Profiles with RExt byte layout, no max_14bit (PP 4, 6, 7, 8) */ const REXT_PP = new Set([
    "4",
    "6",
    "7",
    "8"
]);
/** @private Profiles with RExt byte layout + max_14bit at byte 1 bit 2 (PP 5, 9, 10, 11) */ const HT_PP = new Set([
    "5",
    "9",
    "10",
    "11"
]);
/**
 * HEVC Levels
 * @constant
 * @type {string[]}
 * @see [hevc-levels]{@link https://en.wikipedia.org/wiki/High_Efficiency_Video_Coding#Tiers_and_levels}
 */ // prettier-ignore
const HEVC_LEVELS = [
    "1",
    "2",
    "2.1",
    "3",
    "3.1",
    "4",
    "4.1",
    "5",
    "5.1",
    "5.2",
    "6",
    "6.1",
    "6.2"
];
/**
 * List of supported tier
 * @constant
 * @type {string[]}
 */ const HEVC_TIER = [
    "Main",
    "High"
];
/** @private  */ const convertLevel = (level)=>parseFloat(level) * 10 * 3;
/** @private  */ const formatLevel = (level)=>String(convertLevel(level));
/** @private  */ const formatTier = (tier)=>tier === "Main" ? "L" : "H";
/**
 * Format up to 6 constraint bytes as a dot-separated lowercase hex string,
 * omitting trailing zero bytes.
 * @param {string[]} constraints
 * @returns {string}
 */ const formatConstraints = (constraints)=>constraints.join(".").replace(/(?:\.00)+$/, "");
/** @private  */ const formatCodec = (cccc, { PP, C }, T, LL, constraints)=>`${cccc}.${PP}.${C}.${T}${LL}.${constraints}`;
/**
 * Return a list of all possible codec parameter string and their human readable names
 * @param {boolean} [defaultConstraints=false] when true, return only items using each profile's default constraints
 * @returns {import("../types.js").MediaCodecItem[]}
 */ const getAllItems = (defaultConstraints = false)=>HEVC_PROFILES.map((profile)=>HEVC_LEVELS.map((level)=>HEVC_TIER.map((tier)=>{
                // The High tier is only available for level 4.0 and up.
                if (tier === "High" && convertLevel(level) < 120) return;
                const constraintSets = defaultConstraints ? [
                    profile.constraints
                ] : REXT_PP.has(profile.PP) ? HEVC_REXT_CONSTRAINTS : HT_PP.has(profile.PP) ? HEVC_HT_CONSTRAINTS : HEVC_CONSTRAINTS;
                return constraintSets.map((constraints)=>{
                    const formattedConstraints = formatConstraints(constraints);
                    return {
                        name: `HEVC ${profile.name} Profile Level ${level} Tier ${tier} Constraints ${formattedConstraints}`,
                        codec: formatCodec(cccc, profile, formatTier(tier), formatLevel(level), formattedConstraints)
                    };
                });
            }))).flat(3).filter(Boolean);
/**
 * Get a codec parameter string
 * @param {import("../types.js").HEVCCodecOptions} options
 * @returns {string}
 */ const getCodec = ({ profile: profileName, level, tier, constraints })=>{
    const profile = HEVC_PROFILES.find((p)=>p.name === profileName);
    if (!profile) throw new Error(`Unknown HEVC profile "${profileName}"`);
    if (!HEVC_LEVELS.includes(level)) {
        throw new Error(`Unknown HEVC Level "${level}"`);
    }
    if (!HEVC_TIER.includes(tier)) {
        throw new Error(`Unknown HEVC Tier "${tier}"`);
    }
    return formatCodec(cccc, profile, formatTier(tier), formatLevel(level), formatConstraints(constraints ?? profile.constraints));
};
/**
 * Get a codec human readable name
 * @param {string} codec a codec string (eg. "hev1.1.6.L93.b0")
 * @returns {string}
 */ const getCodecName = (codec)=>getAllItems().find((item)=>item.codec === codec)?.name;

var hevc = /*#__PURE__*/Object.freeze({
  __proto__: null,
  HEVC_CONSTRAINTS: HEVC_CONSTRAINTS,
  HEVC_HT_CONSTRAINTS: HEVC_HT_CONSTRAINTS,
  HEVC_LEVELS: HEVC_LEVELS,
  HEVC_PROFILES: HEVC_PROFILES,
  HEVC_REXT_CONSTRAINTS: HEVC_REXT_CONSTRAINTS,
  HEVC_TIER: HEVC_TIER,
  formatCodec: formatCodec,
  formatConstraints: formatConstraints,
  formatLevel: formatLevel,
  getAllItems: getAllItems,
  getCodec: getCodec,
  getCodecName: getCodecName
});

export { av as AV, avc as AVC, hevc as HEVC, vp as VP };
