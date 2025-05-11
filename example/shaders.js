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
  uint digitCount = value == 0.0 ? 1u : uint(floor(log10(value))) + 1u;

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

const vert = /* glsl */ `#version 300 es
in vec2 aPosition;
out vec2 vTexCoord;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vTexCoord = aPosition * 0.5 + 0.5;
}`;

const frag = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

in vec2 vTexCoord;
out vec4 outColor;

uniform vec4 uColor;
uniform float uProgress;

${drawNumber}

void main() {
  vec2 dist = abs(vTexCoord - vec2(0.5));

  if (drawNumber(float(uTextValue), gl_FragCoord.xy, uTextPosition, FONT_SIZE / float(CHAR_ROWS))) {
    outColor = vec4(1.0);
  } else if (dist.x < uProgress * 0.5 && dist.y < uProgress * 0.5) {
    outColor = vec4(uColor);
  } else {
    discard;
  }
}
`;

export { vert, frag };
