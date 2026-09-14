"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Kind = "ico" | "octa" | "torus" | "box" | "tetra";

function Floater({
  position,
  color,
  speed,
  kind,
  scale = 1,
  phase = 0,
}: {
  position: [number, number, number];
  color: string;
  speed: number;
  kind: Kind;
  scale?: number;
  phase?: number;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime + phase;
    g.rotation.x = t * speed * 0.55;
    g.rotation.y = t * speed * 0.8;
    g.rotation.z = Math.sin(t * speed * 0.4) * 0.25;
    g.position.x = position[0] + Math.sin(t * 0.35) * 0.35;
    g.position.y = position[1] + Math.sin(t * 0.7) * 0.45;
    g.position.z = position[2] + Math.cos(t * 0.4) * 0.25;
  });

  const mat = (
    <meshPhysicalMaterial
      color={color}
      metalness={0.88}
      roughness={0.18}
      envMapIntensity={1.6}
      emissive={color}
      emissiveIntensity={0.18}
    />
  );

  return (
    <group ref={ref} position={position} scale={scale}>
      {kind === "ico" ? (
        <mesh>
          <icosahedronGeometry args={[0.55, 0]} />
          {mat}
        </mesh>
      ) : null}
      {kind === "octa" ? (
        <mesh>
          <octahedronGeometry args={[0.58, 0]} />
          {mat}
        </mesh>
      ) : null}
      {kind === "torus" ? (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.14, 12, 28]} />
          {mat}
        </mesh>
      ) : null}
      {kind === "box" ? (
        <mesh>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          {mat}
        </mesh>
      ) : null}
      {kind === "tetra" ? (
        <mesh>
          <tetrahedronGeometry args={[0.62, 0]} />
          {mat}
        </mesh>
      ) : null}
    </group>
  );
}

export function LoginSatellites() {
  return (
    <group>
      <Floater position={[-3.35, 2.05, -0.8]} color="#8b5cf6" kind="ico" speed={0.42} scale={0.95} />
      <Floater position={[3.4, -1.55, -0.4]} color="#06b6d4" kind="octa" speed={0.33} scale={0.88} phase={1.2} />
      <Floater position={[2.85, 2.35, -1.4]} color="#00ffbd" kind="torus" speed={0.28} scale={0.8} phase={2.1} />
      <Floater position={[-2.9, -2.15, 0.3]} color="#ea2fd4" kind="tetra" speed={0.5} scale={0.72} phase={0.6} />
      <Floater position={[0.35, 3.15, -1.8]} color="#06b6d4" kind="box" speed={0.24} scale={0.55} phase={1.7} />
    </group>
  );
}
