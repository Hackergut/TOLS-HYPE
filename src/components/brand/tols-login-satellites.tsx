"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function rockyGeo(radius: number, seed: number) {
  const geo = new THREE.IcosahedronGeometry(radius, 1);
  const pos = geo.attributes.position;
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < pos.count; i++) {
    const n = 0.78 + rnd() * 0.4;
    pos.setXYZ(i, pos.getX(i) * n, pos.getY(i) * n, pos.getZ(i) * n);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function Meteor({
  size,
  seed,
  speed,
  start,
  vel,
  color,
}: {
  size: number;
  seed: number;
  speed: number;
  start: [number, number, number];
  vel: [number, number, number];
  color: string;
}) {
  const fly = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const geo = useMemo(() => rockyGeo(size, seed), [size, seed]);
  const yaw = Math.atan2(vel[0], vel[2]);
  const pitch = Math.atan2(vel[1], Math.hypot(vel[0], vel[2]));

  useFrame((_, dt) => {
    const g = fly.current;
    if (!g) return;
    g.position.x += vel[0] * speed * dt;
    g.position.y += vel[1] * speed * dt;
    g.position.z += vel[2] * speed * dt;
    if (spin.current) {
      spin.current.rotation.x += dt * 1.2;
      spin.current.rotation.y += dt * 0.8;
    }
    const tooClose = g.position.z > -0.8;
    const off =
      g.position.x < -5.4 || g.position.x > 5.4 || g.position.y < -4.4 || g.position.y > 4.4 || tooClose;
    if (off) g.position.set(start[0], start[1], start[2]);
  });

  return (
    <group ref={fly} position={start} rotation={[pitch, yaw, 0]}>
      <group ref={spin}>
        <mesh geometry={geo}>
          <meshStandardMaterial
            color={color}
            roughness={0.78}
            metalness={0.08}
            emissive="#3a1206"
            emissiveIntensity={0.28}
          />
        </mesh>
      </group>
      <mesh position={[0, 0, size * 1.15]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[size * 0.28, size * 1.6, 7, 1, true]} />
        <meshBasicMaterial color="#ff7a1a" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, size * 2.05]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[size * 0.12, size * 1.05, 6, 1, true]} />
        <meshBasicMaterial color="#ffe08a" transparent opacity={0.4} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Floater({
  position,
  color,
  speed,
  phase = 0,
}: {
  position: [number, number, number];
  color: string;
  speed: number;
  phase?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime + phase;
    g.rotation.x = t * speed * 0.5;
    g.rotation.y = t * speed * 0.7;
    g.position.x = position[0] + Math.sin(t * 0.32) * 0.22;
    g.position.y = position[1] + Math.sin(t * 0.6) * 0.26;
  });
  return (
    <group ref={ref} position={position} scale={0.55}>
      <mesh>
        <octahedronGeometry args={[0.38, 0]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.88}
          roughness={0.18}
          emissive={color}
          emissiveIntensity={0.16}
        />
      </mesh>
    </group>
  );
}

export function LoginSatellites() {
  return (
    <group>
      <Floater position={[-2.2, 1.55, -1.6]} color="#8b5cf6" speed={0.4} />
      <Floater position={[2.15, -1.25, -1.4]} color="#06b6d4" speed={0.32} phase={1.4} />

      <Meteor
        size={0.16}
        seed={17}
        speed={0.85}
        start={[3.8, 2.4, -2.4]}
        vel={[-0.9, -0.55, -0.12]}
        color="#c45a18"
      />
      <Meteor
        size={0.11}
        seed={41}
        speed={1.1}
        start={[3.2, 1.6, -3.1]}
        vel={[-0.8, -0.62, -0.08]}
        color="#a84812"
      />
      <Meteor
        size={0.13}
        seed={73}
        speed={0.95}
        start={[-3.6, 2.6, -2.8]}
        vel={[0.7, -0.7, -0.1]}
        color="#e07020"
      />
      <Meteor
        size={0.09}
        seed={139}
        speed={1.25}
        start={[2.6, 2.8, -3.4]}
        vel={[-0.65, -0.85, -0.06]}
        color="#d2691e"
      />
      <Meteor
        size={0.14}
        seed={211}
        speed={0.78}
        start={[3.9, -1.2, -2.6]}
        vel={[-0.95, 0.28, -0.09]}
        color="#b45309"
      />
    </group>
  );
}
