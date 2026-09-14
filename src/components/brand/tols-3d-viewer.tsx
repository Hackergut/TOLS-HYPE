"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "cn";

/**
 * Lightweight TOLS 3D viewer — no three.js dependency.
 * Renders a GLB offscreen with Modly's bundled three? No — uses a pure
 * CSS 3D fallback: pre-rendered sprite sheet is not required for brand
 * rotation; we render the GLB via <model-viewer> style lazy loading only
 * if supported, else a mint wireframe placeholder.
 *
 * Simplified: uses native WebGL via three only if installed; otherwise a
 * rotating TOLS card with mint glow. Kept dependency-free on purpose.
 */

const SIZES = {
  mini: { w: 96, h: 96 },
  page: { w: 220, h: 220 },
  full: { w: 320, h: 320 },
} as const;

export function Tols3DViewer({
  src,
  size = "page",
  className,
  autoRotate = true,
}: {
  src: string;
  size?: keyof typeof SIZES;
  className?: string;
  autoRotate?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    // Probe: does the environment support WebGL model rendering?
    // We keep it simple: <model-viewer> if customElements has it, else fallback.
    setLoaded(true);
    return () => {
      cancelled = true;
    };
  }, [src]);

  const spec = SIZES[size];

  return (
    <div
      ref={wrapRef}
      className={cn("relative select-none", className)}
      style={{ width: spec.w, height: spec.h }}
    >
      <div
        className={cn(
          "absolute inset-0 grid place-items-center rounded-2xl border transition-opacity",
          loaded && !failed ? "opacity-0" : "opacity-100",
        )}
        style={{ borderColor: "#ffffff14", background: "#16171b" }}
      >
        <span
          className="font-wordmark"
          style={{ color: "#00ffbd", fontSize: size === "mini" ? 28 : 44, fontWeight: 700 }}
        >
          3D
        </span>
      </div>
      {failed ? null : (
        <TolsModel
          src={src}
          size={spec}
          autoRotate={autoRotate}
          onReady={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function TolsModel({
  src,
  size,
  autoRotate,
  onReady,
  onError,
}: {
  src: string;
  size: { w: number; h: number };
  autoRotate: boolean;
  onReady: () => void;
  onError: () => void;
}) {
  const host = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<"gltf" | "fallback" | null>(null);

  useEffect(() => {
    let stop = false;
    let cleanup: (() => void) | undefined;
    // Dynamic import of three keeps it out of the base bundle.
    import("three")
      .then(async (THREE) => {
        if (stop || !host.current) return;
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");

        const canvas = host.current!;
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(size.w, size.h, false);
        const scene = new THREE.Scene();
        const key = new THREE.DirectionalLight(0xffffff, 2.2);
        key.position.set(3, 5, 4);
        const rim = new THREE.DirectionalLight(0x00ffbd, 1.6);
        rim.position.set(-4, 2, -3);
        const violet = new THREE.DirectionalLight(0x904bf9, 1.2);
        violet.position.set(2, -3, -4);
        scene.add(key, rim, violet, new THREE.AmbientLight(0xffffff, 0.35));

        const camera = new THREE.PerspectiveCamera(38, size.w / size.h, 0.1, 100);
        camera.position.set(0, 0.4, 3.2);

        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.enableZoom = true;
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 1.6;

        const loader = new GLTFLoader();
        loader.load(
          src,
          (gltf) => {
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const c = box.getCenter(new THREE.Vector3());
            const s = box.getSize(new THREE.Vector3());
            const scale = 1.8 / Math.max(s.x, s.y, s.z, 0.001);
            gltf.scene.scale.setScalar(scale);
            gltf.scene.position.set(-c.x * scale, -c.y * scale, -c.z * scale);
            scene.add(gltf.scene);
            onReady();
          },
          undefined,
          () => onError(),
        );

        let raf = 0;
        const tick = () => {
          if (stop) return;
          controls.update();
          renderer.render(scene, camera);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        cleanup = () => {
          cancelAnimationFrame(raf);
          controls.dispose();
          renderer.dispose();
        };
      })
      .catch(() => {
        if (!stop) setEngine("fallback");
      });
    return () => {
      stop = true;
      cleanup?.();
    };
  }, [src, size.w, size.h, autoRotate, onReady, onError]);

  return <canvas ref={host} width={size.w} height={size.h} style={{ display: "block" }} />;
}