// GLSL живой системы. Рендер на NormalBlending → шейдер сам собирает свечение
// и несёт реальную альфу (узлы — aAlpha-видимость, линии — пер-сегментная альфа),
// чтобы сеть была корректна и на тёмной подложке, и на светлом стекле.

// — УЗЛЫ —
// aHeat — «жар» (0..1, зелёный отклик); aAlpha — видимость (плотность сцены);
// uNode — цвет узла (лерпится dark↔light на CPU); uSignal — зелёный; uGreenGate —
// гашение зелёного на светлой поверхности (контраст-закон).
export const NODE_VERT = /* glsl */ `
  attribute float aHeat;
  attribute float aSize;
  attribute float aAlpha;
  varying float vHeat;
  varying float vAlpha;
  uniform float uDpr;
  void main() {
    vHeat = aHeat;
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (1.0 + vHeat * 2.4) * uDpr * (10.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

export const NODE_FRAG = /* glsl */ `
  precision mediump float;
  varying float vHeat;
  varying float vAlpha;
  uniform vec3 uNode;
  uniform vec3 uSignal;
  uniform float uGreenGate;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    float glow = smoothstep(0.5, 0.12, d);
    float green = vHeat * uGreenGate;
    vec3 col = mix(uNode, uSignal, green);
    col += uSignal * glow * green * 0.7;          // зелёное гало у «горячих»
    float a = vAlpha * mix(0.42, 1.0, vHeat) * core;
    gl_FragColor = vec4(col, a);
  }
`;

// — ЛИНИИ —
// aColor — уже посчитанный цвет сегмента (rgb), aLineAlpha — его прозрачность.
// Свой aColor (не встроенный color), чтобы не зависеть от vertexColors-инъекции.
export const LINE_VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute float aLineAlpha;
  varying vec3 vCol;
  varying float vA;
  void main() {
    vCol = aColor;
    vA = aLineAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const LINE_FRAG = /* glsl */ `
  precision mediump float;
  varying vec3 vCol;
  varying float vA;
  void main() {
    gl_FragColor = vec4(vCol, vA);
  }
`;
