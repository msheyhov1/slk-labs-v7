"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { prefersReduced } from "@/lib/gsap";
import { getActiveScene } from "@/lib/scene-store";
import { DEFAULT_SCENE } from "@/lib/scenes";
import { NETWORK } from "./network/config";
import { NODE_VERT, NODE_FRAG, LINE_VERT, LINE_FRAG } from "./network/shaders";
import { NetworkSimulation, type Wave } from "./network/simulation";

// r3f императивно мутирует геометрию/буферы симуляции в useFrame — это WebGL-цикл,
// а не React-стейт. Правило React Compiler здесь неприменимо.
/* eslint-disable react-hooks/immutability */

/** Сцена WebGL: геометрии поверх буферов симуляции, физика + рекоммутация в useFrame. */
function NetField({ reduced }: { reduced: boolean }) {
  const { viewport, gl, invalidate } = useThree();
  const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2);

  const { sim, nodeGeo, nodeMat, lineGeo, lineMat } = useMemo(() => {
    const sim = new NetworkSimulation(viewport.width, viewport.height);
    sim.setScene(reduced ? DEFAULT_SCENE : getActiveScene());

    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(sim.positions, 3));
    nodeGeo.setAttribute("aHeat", new THREE.BufferAttribute(sim.heat, 1));
    nodeGeo.setAttribute("aSize", new THREE.BufferAttribute(sim.sizes, 1));
    nodeGeo.setAttribute("aAlpha", new THREE.BufferAttribute(sim.nodeAlpha, 1));
    const nodeMat = new THREE.ShaderMaterial({
      uniforms: {
        uNode: { value: new THREE.Color(...sim.nodeColor([0, 0, 0])) },
        uSignal: { value: new THREE.Color(NETWORK.colors.signal[0], NETWORK.colors.signal[1], NETWORK.colors.signal[2]) },
        uGreenGate: { value: sim.greenGate },
        uDpr: { value: dpr },
      },
      vertexShader: NODE_VERT,
      fragmentShader: NODE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(sim.segPositions, 3));
    lineGeo.setAttribute("aColor", new THREE.BufferAttribute(sim.segColors, 3));
    lineGeo.setAttribute("aLineAlpha", new THREE.BufferAttribute(sim.segAlpha, 1));
    lineGeo.setDrawRange(0, 0);
    const lineMat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: LINE_VERT,
      fragmentShader: LINE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    return { sim, nodeGeo, nodeMat, lineGeo, lineMat };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pointer = useRef({ x: 0, y: 0, active: false });
  const waves = useRef<Wave[]>([]);
  const lastScene = useRef<string | null>(null);

  // курсор слушаем на window → канвас остаётся pointer-events:none (скролл/клики свободны)
  useEffect(() => {
    if (reduced) return;
    const el = gl.domElement;
    const hasHover = window.matchMedia("(hover: hover)").matches;
    const toWorld = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return { inside: false, x: 0, y: 0 };
      return {
        inside: cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom,
        x: ((cx - r.left) / r.width * 2 - 1) * (viewport.width / 2),
        y: -((cy - r.top) / r.height * 2 - 1) * (viewport.height / 2),
      };
    };
    const onMove = (e: PointerEvent) => {
      const p = toWorld(e.clientX, e.clientY);
      // тяга/лучи — только при наличии настоящего ховера (на тач — нет)
      pointer.current = { x: p.x, y: p.y, active: hasHover && p.inside };
    };
    const onDown = (e: PointerEvent) => {
      const p = toWorld(e.clientX, e.clientY);
      if (!p.inside) return;
      waves.current.push({ x: p.x, y: p.y, t: 0 }); // тап/клик пускает волну света
      if (waves.current.length > NETWORK.wave.maxLive) waves.current.shift();
    };
    const onBlur = () => { pointer.current.active = false; };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("blur", onBlur);
    };
  }, [reduced, gl, viewport.width, viewport.height]);

  const flush = () => {
    nodeGeo.attributes.position.needsUpdate = true;
    nodeGeo.attributes.aHeat.needsUpdate = true;
    nodeGeo.attributes.aAlpha.needsUpdate = true;
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.aColor.needsUpdate = true;
    lineGeo.attributes.aLineAlpha.needsUpdate = true;
    lineGeo.setDrawRange(0, sim.segCount * 2);
  };

  // reduced-motion: посчитать статичную структуру один раз
  useEffect(() => {
    if (!reduced) return;
    sim.setBounds(viewport.width, viewport.height);
    sim.setScene(DEFAULT_SCENE);
    sim.step(0, 0, pointer.current, waves.current, true);
    flush();
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  // освобождаем WebGL-ресурсы при размонтировании
  useEffect(() => {
    return () => {
      nodeGeo.dispose();
      nodeMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state, delta) => {
    if (reduced) return;
    sim.setBounds(viewport.width, viewport.height);

    // рекоммутация: сменилась активная сцена → перестроить формацию + импульс света
    const scene = getActiveScene();
    if (scene.id !== lastScene.current) {
      sim.setScene(scene);
      if (lastScene.current !== null) {
        waves.current.push({ x: 0, y: 0, t: 0 }); // волна «система пересобралась»
        if (waves.current.length > NETWORK.wave.maxLive) waves.current.shift();
      }
      lastScene.current = scene.id;
    }

    sim.step(state.clock.elapsedTime, Math.min(delta, 1 / 30), pointer.current, waves.current, false);
    flush();
  });

  return (
    <group>
      <points geometry={nodeGeo} material={nodeMat} />
      <lineSegments geometry={lineGeo} material={lineMat} />
    </group>
  );
}

export default function SystemField() {
  const reduced = typeof window !== "undefined" ? prefersReduced() : false;
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 12], fov: 45 }}
      frameloop={reduced ? "demand" : "always"}
    >
      <NetField reduced={reduced} />
    </Canvas>
  );
}
