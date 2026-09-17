const COLS = 12;
const ROWS = 12;
const MARGIN = 0.075;
const MAX_ANGLE = 0.7;
const MAX_OFFSET = 0.32;
const SQUARE_HALF = 0.5;

const rnd = (x) => {
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  x = x ^ (x >>> 16);
  return (x >>> 0) / 4294967295;
};

const drawSchotter2d = (context, size, progress) => {
  const cell = ((1 - 2 * MARGIN) * size) / COLS;
  const originX = MARGIN * size;
  const originY = (size - cell * ROWS) / 2;

  context.lineWidth = size * 0.004;

  for (let j = 0; j < ROWS; j++) {
    const disorder = (j / (ROWS - 1)) ** 1.3 * progress;
    for (let i = 0; i < COLS; i++) {
      const index = i + j * COLS;
      const ra = rnd(index) * 2 - 1;
      const rox = rnd(index + 9999) * 2 - 1;
      const roy = rnd(index + 5555) * 2 - 1;
      const angle = MAX_ANGLE * disorder * ra;
      const offsetX = MAX_OFFSET * disorder * rox * cell;
      const offsetY = MAX_OFFSET * disorder * roy * cell;
      const side = SQUARE_HALF * 2 * cell;

      context.save();
      context.translate(
        originX + (i + 0.5) * cell + offsetX,
        originY + (j + 0.5) * cell + offsetY,
      );
      context.rotate(angle);
      context.strokeRect(-side / 2, -side / 2, side, side);
      context.restore();
    }
  }
};

// eslint-disable-next-line unicorn/no-useless-template-literals
const drawNumber = /* glsl */ `uniform uint uTextValue;
uniform vec2 uTextPosition;

const float FONT_SIZE = 12.0 * 2.0;

const uint CHAR_SPACING = 1u;

// (3columns x 5rows) * 10 characters
const uint CHAR_COLUMNS = 3u;
const int CHAR_COLUMNS_INT = int(CHAR_COLUMNS);
const uint CHAR_ROWS = 5u;
const int CHAR_ROWS_INT = int(CHAR_ROWS);
const uint font[CHAR_ROWS_INT] = uint[](
  ${0b11101011111110111110011111111100}u,
  ${0b10101000100110110010000110110100}u,
  ${0b10101001001111111011100111111100}u,
  ${0b10101010000100100110100110100100}u,
  ${0b11101011111100111111100111100100}u
);

const uint ROW_SHIFT_DIGIT = CHAR_COLUMNS * 10u - 1u;
const uint ROW_SHIFT_CHAR_COLUMN = CHAR_COLUMNS - 1u;

float log10(float x) {
  return log(x) / log(10.0);
}

int scalePosition(float diff, float scale) {
  return int(floor((diff) / scale));
}

const float CHAR_AND_SPACING = float(CHAR_COLUMNS + CHAR_SPACING);

bool drawNumber(float value, vec2 fragCoord, vec2 textPosition, float scale) {
  uint digitCount = value == 0.0 ? 1u : uint(floor(log10(value) + 1e-5)) + 1u;

  int y = scalePosition(fragCoord.y - textPosition.y, scale);
  if (y >= CHAR_ROWS_INT || y < 0) return false;

  float digitOffsetX = CHAR_AND_SPACING * scale;

  for (uint i = 0u; i < digitCount; i++) {
    int x = scalePosition(fragCoord.x - (textPosition.x + float(i) * digitOffsetX), scale);
    if (x >= CHAR_COLUMNS_INT || x < 0) continue;

    float divisor = pow(10.0, float(digitCount - i - 1u));
    uint digit = uint(floor(value / divisor)) % 10u;

    uint bitShiftChar = (ROW_SHIFT_DIGIT - digit * CHAR_COLUMNS);
    uint charBits = (font[CHAR_COLUMNS_INT + 1 - y] >> bitShiftChar) & ${0b111}u;

    uint bitShiftCharColumn = ROW_SHIFT_CHAR_COLUMN - uint(x);
    uint charColumnBit = ((charBits >> bitShiftCharColumn) & ${0b1}u);

    if (charColumnBit == 1u) return true;

    value = value - (float(digit) * divisor);
  }
  return false;
}
`;

const drawNumberWGSL = /* wgsl */ `
const FONT_SIZE: f32 = 12.0 * 2.0;

const CHAR_SPACING: u32 = 1u;

// (3columns x 5rows) * 10 characters
const CHAR_COLUMNS: u32 = 3u;
const CHAR_COLUMNS_INT: i32 = i32(CHAR_COLUMNS);
const CHAR_ROWS: u32 = 5u;
const CHAR_ROWS_INT: i32 = i32(CHAR_ROWS);
const font = array<u32, 5>(
  0xebfbe7fcu,
  0xa89b21b4u,
  0xa93fb9fcu,
  0xaa1269a4u,
  0xebf3f9e4u,
);

const ROW_SHIFT_DIGIT: u32 = CHAR_COLUMNS * 10u - 1u;
const ROW_SHIFT_CHAR_COLUMN: u32 = CHAR_COLUMNS - 1u;

fn log10_(x: f32) -> f32 {
  return log(x) / log(10.0);
}

fn scalePosition(diff: f32, scale: f32) -> i32 {
  return i32(floor(diff / scale));
}

const CHAR_AND_SPACING: f32 = f32(CHAR_COLUMNS + CHAR_SPACING);

fn drawNumber(valueIn: f32, fragCoord: vec2<f32>, textPosition: vec2<f32>, scale: f32) -> bool {
  var value = valueIn;
  let digitCount = select(u32(floor(log10_(value) + 1e-5)) + 1u, 1u, value == 0.0);

  let y = scalePosition(fragCoord.y - textPosition.y, scale);
  if (y >= CHAR_ROWS_INT || y < 0) {
    return false;
  }

  let digitOffsetX = CHAR_AND_SPACING * scale;

  for (var i: u32 = 0u; i < digitCount; i++) {
    let x = scalePosition(fragCoord.x - (textPosition.x + f32(i) * digitOffsetX), scale);
    if (x >= CHAR_COLUMNS_INT || x < 0) {
      continue;
    }

    let divisor = pow(10.0, f32(digitCount - i - 1u));
    let digit = u32(floor(value / divisor)) % 10u;

    let bitShiftChar = ROW_SHIFT_DIGIT - digit * CHAR_COLUMNS;
    let charBits = (font[u32(y)] >> bitShiftChar) & 7u;

    let bitShiftCharColumn = ROW_SHIFT_CHAR_COLUMN - u32(x);
    let charColumnBit = (charBits >> bitShiftCharColumn) & 1u;

    if (charColumnBit == 1u) {
      return true;
    }

    value = value - f32(digit) * divisor;
  }
  return false;
}
`;

const inBackgroundChunk = /* glsl */ `
bool isInBackground(vec2 uv) {
  return (uv.x < 0.5 && uv.y < 0.5) || (uv.x >= 0.5 && uv.y >= 0.5);
}
`;

const inBackgroundChunkWGSL = /* wgsl */ `
fn isInBackground(uv: vec2<f32>) -> bool {
  return (uv.x < 0.5 && uv.y < 0.5) || (uv.x >= 0.5 && uv.y >= 0.5);
}
`;

const vert = /* glsl */ `#version 300 es
in vec2 aPosition;
out vec2 vTexCoord;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vTexCoord = aPosition * 0.5 + 0.5;
}`;

const vertWGSL = /* wgsl */ `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) vTexCoord: vec2<f32>,
}

@vertex
fn vertexMain(@location(0) aPosition: vec2<f32>) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(aPosition, 0.0, 1.0);
  output.vTexCoord = aPosition * 0.5 + 0.5;
  return output;
}
`;

const debugGLSL = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

in vec2 vTexCoord;
out vec4 outColor;

uniform vec4 uColor;
uniform vec4 uBackgroundColor;
uniform float uProgress;
uniform bool uTransparent;

${drawNumber}
${inBackgroundChunk}

void main() {
  vec2 dist = abs(vTexCoord - vec2(0.5));

  vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
  bool inBackground = isInBackground(uv);

  if (drawNumber(float(uTextValue), gl_FragCoord.xy, uTextPosition, FONT_SIZE / float(CHAR_ROWS))) {
    outColor = vec4(1.0);
  } else if (dist.x < uProgress * 0.5 && dist.y < uProgress * 0.5) {
    outColor = vec4(uColor);
  } else if (inBackground) {
    outColor = vec4(uBackgroundColor);
  } else if (uTransparent) {
    discard;
  } else {
    outColor = vec4(uBackgroundColor);
  }
}
`;

const debugWGSL = /* wgsl */ `
struct Uniforms {
  uColor: vec4<f32>,
  uBackgroundColor: vec4<f32>,
  uProgress: f32,
  uTransparent: u32,
  uTextValue: u32,
  uTextPosition: vec2<f32>,
}
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

${drawNumberWGSL}
${inBackgroundChunkWGSL}
${vertWGSL}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let dist = abs(input.vTexCoord - vec2<f32>(0.5));

  let uv = vec2<f32>(input.vTexCoord.x, 1.0 - input.vTexCoord.y);
  let inBackground = isInBackground(uv);

  if (drawNumber(f32(uniforms.uTextValue), input.position.xy, uniforms.uTextPosition, FONT_SIZE / f32(CHAR_ROWS))) {
    return vec4<f32>(1.0);
  } else if (dist.x < uniforms.uProgress * 0.5 && dist.y < uniforms.uProgress * 0.5) {
    return uniforms.uColor;
  } else if (inBackground) {
    return uniforms.uBackgroundColor;
  } else if (uniforms.uTransparent != 0u) {
    discard;
  } else {
    return uniforms.uBackgroundColor;
  }
}
`;

const schotterFragGLSL = /* glsl */ `#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 outColor;

uniform vec4 uColor;
uniform vec4 uBackgroundColor;
uniform float uProgress;
uniform bool uTransparent;
uniform float uResolution;

const float COLS = ${COLS}.0;
const float ROWS = ${ROWS}.0;
const float MARGIN = ${MARGIN};
const float MAX_ANGLE = ${MAX_ANGLE};
const float MAX_OFFSET = ${MAX_OFFSET};
const float SQUARE_HALF = ${SQUARE_HALF};
const float LINE_HALF = 0.028;

uint hashU(uint x) {
  x = (x ^ (x >> 16u)) * 0x7feb352du;
  x = (x ^ (x >> 15u)) * 0x846ca68bu;
  x = x ^ (x >> 16u);
  return x;
}
float rnd(uint index) {
  return float(hashU(index)) / 4294967295.0;
}
mat2 rotate(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}
float boxSDF(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

${drawNumber}
${inBackgroundChunk}

void main() {
  if (drawNumber(float(uTextValue), gl_FragCoord.xy, uTextPosition, FONT_SIZE / float(CHAR_ROWS))) {
    outColor = vec4(1.0);
  } else {
    vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);

    float cell = (1.0 - 2.0 * MARGIN) / COLS;
    float gridHeight = cell * ROWS;
    vec2 origin = vec2(MARGIN, (1.0 - gridHeight) * 0.5);
    vec2 gp = (uv - origin) / cell;

    vec2 base = floor(gp);
    float coverage = 0.0;

    float aa = 1.2 / (cell * uResolution);

    for (float dy = -1.0; dy <= 1.0; dy++) {
      for (float dx = -1.0; dx <= 1.0; dx++) {
        vec2 id = base + vec2(dx, dy);
        if (id.x < 0.0 || id.x >= COLS || id.y < 0.0 || id.y >= ROWS) continue;

        uint index = uint(id.x) + uint(id.y) * uint(COLS);
        float ra = rnd(index) * 2.0 - 1.0;
        float rox = rnd(index + 9999u) * 2.0 - 1.0;
        float roy = rnd(index + 5555u) * 2.0 - 1.0;

        float disorder = pow(id.y / (ROWS - 1.0), 1.3) * uProgress;
        float angle = MAX_ANGLE * disorder * ra;
        vec2 offset = MAX_OFFSET * disorder * vec2(rox, roy);
        vec2 center = id + 0.5 + offset;

        float sd = boxSDF(rotate(-angle) * (gp - center), vec2(SQUARE_HALF));
        coverage =
          max(coverage, 1.0 - smoothstep(LINE_HALF - aa, LINE_HALF + aa, abs(sd)));
      }
    }

    if (coverage > 0.0) {
      outColor = vec4(mix(uBackgroundColor.rgb, uColor.rgb, coverage), 1.0);
    } else {
      bool inBackground = isInBackground(uv);

      if (inBackground) {
        outColor = vec4(uBackgroundColor);
      } else if (uTransparent) {
        discard;
      } else {
        outColor = vec4(uBackgroundColor);
      }
    }
  }
}`;

const schotterWGSL = /* wgsl */ `
struct Uniforms {
  uColor: vec4<f32>,
  uBackgroundColor: vec4<f32>,
  uProgress: f32,
  uTransparent: u32,
  uResolution: f32,
  uTextValue: u32,
  uTextPosition: vec2<f32>,
}
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

const COLS: f32 = ${COLS}.0;
const ROWS: f32 = ${ROWS}.0;
const MARGIN: f32 = ${MARGIN};
const MAX_ANGLE: f32 = ${MAX_ANGLE};
const MAX_OFFSET: f32 = ${MAX_OFFSET};
const SQUARE_HALF: f32 = ${SQUARE_HALF};
const LINE_HALF: f32 = 0.028;

fn hashU(xIn: u32) -> u32 {
  var x = xIn;
  x = (x ^ (x >> 16u)) * 0x7feb352du;
  x = (x ^ (x >> 15u)) * 0x846ca68bu;
  x = x ^ (x >> 16u);
  return x;
}
fn rnd(index: u32) -> f32 {
  return f32(hashU(index)) / 4294967295.0;
}
fn rotate2(a: f32) -> mat2x2<f32> {
  let c = cos(a);
  let s = sin(a);
  return mat2x2<f32>(c, -s, s, c);
}
fn boxSDF(p: vec2<f32>, b: vec2<f32>) -> f32 {
  let q = abs(p) - b;
  return length(max(q, vec2<f32>(0.0))) + min(max(q.x, q.y), 0.0);
}

${drawNumberWGSL}
${inBackgroundChunkWGSL}
${vertWGSL}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  if (drawNumber(f32(uniforms.uTextValue), input.position.xy, uniforms.uTextPosition, FONT_SIZE / f32(CHAR_ROWS))) {
    return vec4<f32>(1.0);
  }

  let uv = vec2<f32>(input.vTexCoord.x, 1.0 - input.vTexCoord.y);

  let cell = (1.0 - 2.0 * MARGIN) / COLS;
  let gridHeight = cell * ROWS;
  let origin = vec2<f32>(MARGIN, (1.0 - gridHeight) * 0.5);
  let gp = (uv - origin) / cell;

  let base = floor(gp);
  var coverage = 0.0;

  let aa = 1.2 / (cell * uniforms.uResolution);

  for (var dy: f32 = -1.0; dy <= 1.0; dy += 1.0) {
    for (var dx: f32 = -1.0; dx <= 1.0; dx += 1.0) {
      let id = base + vec2<f32>(dx, dy);
      if (id.x < 0.0 || id.x >= COLS || id.y < 0.0 || id.y >= ROWS) {
        continue;
      }

      let index = u32(id.x) + u32(id.y) * u32(COLS);
      let ra = rnd(index) * 2.0 - 1.0;
      let rox = rnd(index + 9999u) * 2.0 - 1.0;
      let roy = rnd(index + 5555u) * 2.0 - 1.0;

      let disorder = pow(id.y / (ROWS - 1.0), 1.3) * uniforms.uProgress;
      let angle = MAX_ANGLE * disorder * ra;
      let offset = MAX_OFFSET * disorder * vec2<f32>(rox, roy);
      let center = id + 0.5 + offset;

      let sd = boxSDF(rotate2(-angle) * (gp - center), vec2<f32>(SQUARE_HALF));
      coverage = max(coverage, 1.0 - smoothstep(LINE_HALF - aa, LINE_HALF + aa, abs(sd)));
    }
  }

  if (coverage > 0.0) {
    return vec4<f32>(mix(uniforms.uBackgroundColor.rgb, uniforms.uColor.rgb, coverage), 1.0);
  }

  if (isInBackground(uv)) {
    return uniforms.uBackgroundColor;
  } else if (uniforms.uTransparent != 0u) {
    return vec4f(0.0);
  } else {
    return uniforms.uBackgroundColor;
  }
}
`;

export {
  drawSchotter2d,
  vert,
  debugGLSL,
  schotterFragGLSL,
  debugWGSL,
  schotterWGSL,
};
