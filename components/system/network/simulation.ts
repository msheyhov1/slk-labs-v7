// Чистая физика живой системы — БЕЗ three и react (тестируемо, изолированно).
// Владеет типизированными массивами; компонент оборачивает их в BufferAttribute.
//
// v7: сеть растянута за всю страницу и РЕКОММУТИРУЕТСЯ по сценам (lib/scenes.ts).
// Каждый узел держится пружиной у «дома» (rest). Дом МИГРИРУЕТ между формациями
// (cloud → clusters → columns → lattice → funnel) — физика сама ведёт узлы туда.
// Плотность сцены гасит/проявляет узлы (vis → alpha). Палитра поверхности
// (surfMix: 1 тёмная → светлые узлы, 0 светлая → графит) лерпится; зелёный на
// светлом гасится gate (контраст-закон). Клик и смена сцены пускают ВОЛНУ СВЕТА.
import { NETWORK as C } from "./config";
import type { Scene } from "@/lib/scenes";

export type Pointer = { x: number; y: number; active: boolean };
export type Wave = { x: number; y: number; t: number };

const SIGNAL = C.colors.signal;
const WAVE = C.colors.wave;
const ND = C.colors.nodeOnDark; // подложка тёмная всегда → узлы/линии светлые
const LD = C.colors.lineOnDark;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export class NetworkSimulation {
  readonly N: number;
  readonly maxSeg: number;
  segCount = 0;

  // публичные буферы (геометрия ссылается прямо на них)
  readonly positions: Float32Array; // N*3
  readonly heat: Float32Array; // N
  readonly sizes: Float32Array; // N
  readonly nodeAlpha: Float32Array; // N — видимость (плотность сцены)
  readonly segPositions: Float32Array; // maxSeg*6
  readonly segColors: Float32Array; // maxSeg*6
  readonly segAlpha: Float32Array; // maxSeg*2

  // текущая интенсивность сети (0..1) — лерпится к scene.dim (спокойствие сцены)
  dim = 1;

  private readonly homeN: Float32Array; // N*2 — нормализованный «дом» [-1..1]
  private readonly rest: Float32Array; // N*2 — текущий дом (мигрирует), мир
  private readonly restTarget: Float32Array; // N*2 — цель формации, мир
  private readonly vel: Float32Array; // N*2
  private readonly visTarget: Float32Array; // N — целевая видимость
  private readonly baseHeat: Uint8Array; // N
  private readonly phase: Float32Array; // N
  private readonly rank: Float32Array; // N — стабильный 0..1 для гейта плотности
  private readonly group: Float32Array; // N — стабильный 0..1 для разбивки на фокусы

  private vw = 0;
  private vh = 0;
  private scene: Scene | null = null;
  private dimTarget = 1;
  private breathMul = 1;
  private breathTarget = 1;
  private linkMul = 1;
  private linkTarget = 1;

  constructor(width: number, height: number) {
    const mobile = width < C.mobileBreakpoint;
    const divisor = mobile ? C.density.divisorMobile : C.density.divisorDesktop;
    const cap = mobile ? C.density.maxMobile : C.density.max;
    this.N = Math.max(C.density.min, Math.min(cap, Math.round((width * height) / divisor)));
    this.maxSeg = this.N * 14;

    this.positions = new Float32Array(this.N * 3);
    this.heat = new Float32Array(this.N);
    this.sizes = new Float32Array(this.N);
    this.nodeAlpha = new Float32Array(this.N);
    this.homeN = new Float32Array(this.N * 2);
    this.rest = new Float32Array(this.N * 2);
    this.restTarget = new Float32Array(this.N * 2);
    this.vel = new Float32Array(this.N * 2);
    this.visTarget = new Float32Array(this.N);
    this.baseHeat = new Uint8Array(this.N);
    this.phase = new Float32Array(this.N);
    this.rank = new Float32Array(this.N);
    this.group = new Float32Array(this.N);
    this.segPositions = new Float32Array(this.maxSeg * 6);
    this.segColors = new Float32Array(this.maxSeg * 6);
    this.segAlpha = new Float32Array(this.maxSeg * 2);

    this.setBounds(width, height);
    const hw = width / 2;
    const hh = height / 2;
    for (let i = 0; i < this.N; i++) {
      const nx = Math.random() * 2 - 1;
      const ny = Math.random() * 2 - 1;
      this.homeN[i * 2] = nx;
      this.homeN[i * 2 + 1] = ny;
      const x = nx * hw;
      const y = ny * hh;
      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = (Math.random() * 2 - 1) * 0.8;
      this.rest[i * 2] = x;
      this.rest[i * 2 + 1] = y;
      this.restTarget[i * 2] = x;
      this.restTarget[i * 2 + 1] = y;
      this.baseHeat[i] = Math.random() < C.baseHeatChance ? 1 : 0;
      this.sizes[i] = this.baseHeat[i] ? 3.6 : 2.3;
      this.phase[i] = Math.random() * Math.PI * 2;
      this.rank[i] = Math.random();
      this.group[i] = Math.random();
      this.nodeAlpha[i] = 1;
      this.visTarget[i] = 1;
    }
  }

  setBounds(width: number, height: number) {
    this.vw = width;
    this.vh = height;
    if (this.scene) this.computeFormation();
  }

  /** Сменить сцену: пересчитать целевую формацию/плотность/палитру/движение. */
  setScene(scene: Scene) {
    this.scene = scene;
    this.dimTarget = scene.dim;
    this.breathTarget = scene.breath;
    this.linkTarget = scene.linkDist;
    this.computeFormation();
  }

  /** Цели формации (restTarget) и видимости (visTarget) под текущую сцену+вьюпорт. */
  private computeFormation() {
    const s = this.scene;
    if (!s) return;
    const hw = this.vw / 2;
    const hh = this.vh / 2;
    const rt = this.restTarget;
    const vt = this.visTarget;
    for (let i = 0; i < this.N; i++) {
      const nx = this.homeN[i * 2];
      const ny = this.homeN[i * 2 + 1];
      let tx = nx * hw;
      let ty = ny * hh;

      switch (s.formation) {
        case "clusters": {
          const c = Math.min(s.foci - 1, Math.floor(this.group[i] * s.foci)); // 0..foci-1
          const cx = (c - (s.foci - 1) / 2) * 0.52 * hw;
          tx = cx + nx * 0.16 * hw;
          ty = ny * 0.34 * hh;
          break;
        }
        case "columns": {
          const c = Math.min(s.foci - 1, Math.floor(this.group[i] * s.foci));
          const colX = (c - (s.foci - 1) / 2) * 0.5 * hw;
          tx = colX + nx * 0.06 * hw;
          ty = ny * hh;
          break;
        }
        case "lattice": {
          tx = nx * hw * 1.05;
          ty = ny * hh * 1.05;
          break;
        }
        case "funnel": {
          const fx = 0.3 * hw;
          tx = fx + (nx * hw - fx) * 0.46;
          ty = (ny * hh) * 0.46;
          break;
        }
        case "cloud":
        default:
          break;
      }

      rt[i * 2] = tx;
      rt[i * 2 + 1] = ty;
      vt[i] = this.rank[i] < s.density ? 1 : 0;
    }
  }

  /** Один шаг. Мутирует positions/heat/nodeAlpha/seg*; обновляет segCount. */
  step(time: number, dt: number, pointer: Pointer, waves: Wave[], reduced: boolean) {
    const {
      positions: pos, heat, rest, restTarget: rt, vel, nodeAlpha: vis, visTarget: vt,
      segPositions: segPos, segColors: segCol, segAlpha: segA, N,
    } = this;

    // — лерп сценовых скаляров —
    if (reduced) {
      this.dim = this.dimTarget;
      this.breathMul = 0;
      this.linkMul = this.linkTarget;
    } else {
      this.dim += (this.dimTarget - this.dim) * clamp01(dt * C.scene.dimRate);
      this.breathMul += (this.breathTarget - this.breathMul) * clamp01(dt * C.scene.paramRate);
      this.linkMul += (this.linkTarget - this.linkMul) * clamp01(dt * C.scene.paramRate);
    }
    const dim = this.dim;
    // подложка тёмная всегда → сеть всегда светлая/зелёная; спокойствие = dim
    const greenGate = 1;
    const idleHeatMul = dim; // тихий зелёный пульс приглушается на контентных сценах

    const minDim = Math.min(this.vw, this.vh);
    const maxDist = minDim * C.linkDist * this.linkMul;
    const R = minDim * C.influence;
    const waveBand = R * C.wave.band;
    const restRate = reduced ? 1 : clamp01(dt * C.scene.restRate);
    const visRate = reduced ? 1 : clamp01(dt * C.scene.visRate);
    const breath = C.breath * this.breathMul;

    for (let i = 0; i < N; i++) {
      const ix = i * 3;
      const iv = i * 2;

      // миграция дома к формации + проявление/гашение узла
      rest[iv] += (rt[iv] - rest[iv]) * restRate;
      rest[iv + 1] += (rt[iv + 1] - rest[iv + 1]) * restRate;
      vis[i] += (vt[i] - vis[i]) * visRate;

      let x = pos[ix];
      let y = pos[ix + 1];

      const bx = rest[iv] + (reduced ? 0 : Math.sin(time * 0.5 + this.phase[i]) * breath);
      const by = rest[iv + 1] + (reduced ? 0 : Math.cos(time * 0.42 + this.phase[i] * 1.3) * breath);

      let h = this.baseHeat[i]
        ? reduced
          ? 0.4
          : (0.3 + 0.3 * (0.5 + 0.5 * Math.sin(time * 1.4 + this.phase[i]))) * idleHeatMul
        : 0;

      if (!reduced) {
        let ax = (bx - x) * C.spring;
        let ay = (by - y) * C.spring;

        if (pointer.active) {
          const dx = pointer.x - x;
          const dy = pointer.y - y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          if (d < R) {
            const ux = dx / d;
            const uy = dy / d;
            const reach = Math.sin((d / R) * Math.PI) * C.pull; // гаснет у курсора
            ax += ux * reach;
            ay += uy * reach;
            const clearR = R * C.clearZone;
            if (d < clearR) {
              const rep = (1 - d / clearR) * C.pull * 2.2; // чистая зона
              ax -= ux * rep;
              ay -= uy * rep;
            }
            h = Math.max(h, (1 - d / R) * C.heatFromPointer);
          }
        }

        // ВОЛНА СВЕТА: фронт поднимает жар узла (силы нет → узел не сдвигается)
        for (let s = 0; s < waves.length; s++) {
          const w = waves[s];
          const radius = w.t * minDim * C.wave.speed;
          const wdx = x - w.x;
          const wdy = y - w.y;
          const off = Math.abs(Math.sqrt(wdx * wdx + wdy * wdy) - radius);
          if (off < waveBand) {
            const k = (1 - off / waveBand) * (1 - w.t / C.wave.life);
            h = Math.max(h, k * C.wave.nodeHeat);
          }
        }

        let vx = vel[iv] + ax * dt;
        let vy = vel[iv + 1] + ay * dt;
        vx *= C.friction;
        vy *= C.friction;
        x += vx * dt;
        y += vy * dt;
        vel[iv] = vx;
        vel[iv + 1] = vy;
        pos[ix] = x;
        pos[ix + 1] = y;

        h = Math.max(h, Math.min(1, Math.sqrt(vx * vx + vy * vy) * 0.12));
      } else {
        pos[ix] = bx;
        pos[ix + 1] = by;
      }

      heat[i] = reduced ? h : Math.max(heat[i] * 0.9, h);
    }

    if (!reduced) {
      for (let s = waves.length - 1; s >= 0; s--) {
        waves[s].t += dt;
        if (waves[s].t > C.wave.life) waves.splice(s, 1);
      }
    }

    // — палитра линий: всегда костяная на тёмном; яркость связей гасится dim —
    const lr = LD[0], lg = LD[1], lb = LD[2];
    const baseLA = C.line.baseAlphaDark * dim;

    // связи узел-узел
    let seg = 0;
    for (let i = 0; i < N && seg < this.maxSeg; i++) {
      const vi = vis[i];
      if (vi < 0.04) continue;
      for (let j = i + 1; j < N && seg < this.maxSeg; j++) {
        const vj = vis[j];
        if (vj < 0.04) continue;
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d >= maxDist) continue;

        const al = 1 - d / maxDist;
        const visPair = vi * vj;
        const hot = Math.max(heat[i], heat[j]);
        const green = clamp01(hot * C.line.hotMix * greenGate);

        // энергия волны через середину связи
        let lw = 0;
        if (!reduced && waves.length) {
          const mx = (pos[i * 3] + pos[j * 3]) * 0.5;
          const my = (pos[i * 3 + 1] + pos[j * 3 + 1]) * 0.5;
          for (let s = 0; s < waves.length; s++) {
            const w = waves[s];
            const radius = w.t * minDim * C.wave.speed;
            const wdx = mx - w.x;
            const wdy = my - w.y;
            const off = Math.abs(Math.sqrt(wdx * wdx + wdy * wdy) - radius);
            if (off < waveBand) {
              lw = Math.max(lw, (1 - off / waveBand) * (1 - w.t / C.wave.life) * C.wave.linkBoost);
            }
          }
        }

        // цвет: база → зелёный (по жару) → фронт волны
        let cr = lr + (SIGNAL[0] - lr) * green;
        let cg = lg + (SIGNAL[1] - lg) * green;
        let cb = lb + (SIGNAL[2] - lb) * green;
        if (lw > 0) {
          const m = clamp01(lw);
          cr = cr + (WAVE[0] - cr) * m;
          cg = cg + (WAVE[1] - cg) * m;
          cb = cb + (WAVE[2] - cb) * m;
        }
        const alpha = clamp01(visPair * al * (baseLA + green * 0.6 + lw * 0.8));

        const o = seg * 6;
        const oa = seg * 2;
        segPos[o] = pos[i * 3]; segPos[o + 1] = pos[i * 3 + 1]; segPos[o + 2] = pos[i * 3 + 2];
        segPos[o + 3] = pos[j * 3]; segPos[o + 4] = pos[j * 3 + 1]; segPos[o + 5] = pos[j * 3 + 2];
        segCol[o] = cr; segCol[o + 1] = cg; segCol[o + 2] = cb;
        segCol[o + 3] = cr; segCol[o + 4] = cg; segCol[o + 5] = cb;
        segA[oa] = alpha; segA[oa + 1] = alpha;
        seg++;
      }
    }

    // зелёные лучи к курсору (на тёмной подложке — закон соблюдён; чуть тише на контентных)
    if (!reduced && pointer.active) {
      const px = pointer.x;
      const py = pointer.y;
      const rayGate = 0.55 + 0.45 * dim;
      for (let i = 0; i < N && seg < this.maxSeg; i++) {
        if (vis[i] < 0.2) continue;
        const rdx = pos[i * 3] - px;
        const rdy = pos[i * 3 + 1] - py;
        const d = Math.sqrt(rdx * rdx + rdy * rdy);
        if (d >= R) continue;
        const alpha = (1 - d / R) * C.pointerRayOpacity * vis[i] * rayGate;
        const o = seg * 6;
        const oa = seg * 2;
        segPos[o] = pos[i * 3]; segPos[o + 1] = pos[i * 3 + 1]; segPos[o + 2] = pos[i * 3 + 2];
        segPos[o + 3] = px; segPos[o + 4] = py; segPos[o + 5] = 0;
        segCol[o] = SIGNAL[0]; segCol[o + 1] = SIGNAL[1]; segCol[o + 2] = SIGNAL[2];
        segCol[o + 3] = SIGNAL[0]; segCol[o + 4] = SIGNAL[1]; segCol[o + 5] = SIGNAL[2];
        segA[oa] = alpha; segA[oa + 1] = alpha;
        seg++;
      }
    }

    this.segCount = seg;
  }

  /** Цвет узла — костяной (свет на тёмной подложке). Константа для юниформа. */
  nodeColor(out: [number, number, number]) {
    out[0] = ND[0];
    out[1] = ND[1];
    out[2] = ND[2];
    return out;
  }

  /** Гейт зелёного для узлового юниформа (на тёмной подложке — без гашения). */
  get greenGate() {
    return 1;
  }
}
