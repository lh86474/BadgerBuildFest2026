"use client";

import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";

/**
 * FingerprintCycleSculpture
 *
 * Concept: "Fingerprint + Cycle" — an organic, biometric fingerprint whorl
 * nested inside a protective circular cycle ring.
 *
 * Symbolism:
 * - The outer circular torus represents the continuous menstrual & health cycle.
 * - The internal dermal spiral & undulating ridges represent personal uniqueness,
 *   communicating that every body's PMOS presentation, symptoms, and timeline are unique.
 * - Flowing, "swimmy" 3D undulation conveys natural vitality, calm breathing, and fluidity.
 */
function FingerprintCycleSculpture() {
  const groupRef = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerHaloRef = useRef<THREE.Mesh>(null);
  const coreSpiralRef = useRef<THREE.Mesh>(null);
  const ridgesRef = useRef<(THREE.Mesh | null)[]>([]);
  const cycleBeadRef = useRef<THREE.Mesh>(null);
  const innerBeadRef = useRef<THREE.Mesh>(null);

  // 1. Build the Central Fingerprint Spiral Core (Whorl)
  const coreGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const turns = 2.4;
    const count = 90;
    for (let i = 0; i <= count; i++) {
      const p = i / count;
      const theta = p * turns * Math.PI * 2;
      const r = 0.08 + p * 0.42;
      // Slight vertical elongation like real fingerprints
      const x = r * Math.cos(theta);
      const y = r * 1.15 * Math.sin(theta);
      const z = Math.sin(theta * 1.5) * 0.06;
      points.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 80, 0.024, 12, false);
  }, []);

  // 2. Build 5 Concentric Fingerprint Ridge Loops with Organic Waves
  const ridgeGeometries = useMemo(() => {
    const ridges: THREE.TubeGeometry[] = [];
    // Radii of concentric dermal ridges, staying comfortably inside cycle circle (R < 1.75)
    const baseRadii = [0.65, 0.92, 1.18, 1.42, 1.64];

    baseRadii.forEach((R, idx) => {
      const points: THREE.Vector3[] = [];
      const count = 72;
      const phaseOffset = idx * 0.75;
      const waveFreq = 3 + (idx % 2);

      for (let i = 0; i <= count; i++) {
        const theta = (i / count) * Math.PI * 2;
        // Subtle natural dermal ridge perturbations
        const perturbation =
          Math.sin(theta * waveFreq + phaseOffset) * 0.038 +
          Math.cos(theta * 2 - phaseOffset) * 0.025;
        const currentR = R + perturbation;

        const x = currentR * Math.cos(theta);
        // Characteristic oval arch of fingerprint ridges
        const y = currentR * 1.12 * Math.sin(theta);
        // Gentle undulating depth profile for 3D ribbon effect
        const z = Math.sin(theta * 2 + idx) * 0.075;

        points.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(points, true);
      // Tube with tapered feel: outer ridges slightly more substantial
      const tubeRadius = 0.024 + idx * 0.003;
      ridges.push(new THREE.TubeGeometry(curve, 72, tubeRadius, 12, true));
    });

    return ridges;
  }, []);

  // Ridge colors alternating across curated PMOS palette
  const ridgeColors = useMemo(
    () => ["#246563", "#3368A0", "#66A3BF", "#2A7370", "#528EA6"],
    []
  );

  // Swimmy fluid animation loop
  useFrame((state) => {
    if (!groupRef.current) return;
    const { pointer } = state;
    const t = performance.now() * 0.001;

    // Smooth lerp to mouse cursor with gentle buoyancy
    const targetRotY = pointer.x * 0.65 + Math.sin(t * 0.35) * 0.16;
    const targetRotX = -pointer.y * 0.45 + Math.cos(t * 0.28) * 0.12;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotY,
      0.04
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotX,
      0.04
    );

    // Continuous aquatic / swimmy breathing motion
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.12;
    groupRef.current.position.x = Math.cos(t * 0.55) * 0.07;

    // Outer cycle halo slow rotation
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = t * 0.08;
    }
    if (innerHaloRef.current) {
      innerHaloRef.current.rotation.z = -t * 0.12;
    }

    // Individual ridges subtle harmonic undulation (swimming wave)
    ridgesRef.current.forEach((mesh, idx) => {
      if (mesh) {
        // Wave traveling outward through fingerprint ridges
        const wave = Math.sin(t * 1.4 - idx * 0.6) * 0.04;
        mesh.position.z = wave;
        mesh.rotation.z = Math.sin(t * 0.4 + idx * 0.3) * 0.015;
      }
    });

    if (coreSpiralRef.current) {
      coreSpiralRef.current.rotation.z = t * 0.15;
      coreSpiralRef.current.position.z = Math.sin(t * 1.6) * 0.05;
    }

    // Cycle bead traveling around the outer cycle perimeter
    if (cycleBeadRef.current) {
      const cycleAngle = t * 0.45;
      cycleBeadRef.current.position.x = Math.cos(cycleAngle) * 1.88;
      cycleBeadRef.current.position.y = Math.sin(cycleAngle) * 1.88;
      cycleBeadRef.current.position.z = Math.sin(cycleAngle * 2) * 0.08;
    }

    // Inner biomarker bead flowing through the middle fingerprint ridge
    if (innerBeadRef.current) {
      const innerAngle = -t * 0.7;
      const innerR = 1.18 + Math.sin(innerAngle * 3) * 0.038;
      innerBeadRef.current.position.x = innerR * Math.cos(innerAngle);
      innerBeadRef.current.position.y = innerR * 1.12 * Math.sin(innerAngle);
      innerBeadRef.current.position.z = Math.sin(innerAngle * 2) * 0.08;
    }
  });

  return (
    <group ref={groupRef} scale={1.22}>
      {/* 1. Outer Cycle Ring (Toroidal boundary representing the cycle) */}
      <mesh ref={outerRingRef}>
        <torusGeometry args={[1.88, 0.042, 24, 100]} />
        <meshStandardMaterial
          color="#246563"
          roughness={0.28}
          metalness={0.25}
        />
      </mesh>

      {/* 2. Concentric Inner Halo Ring (Soft sky accent) */}
      <mesh ref={innerHaloRef}>
        <torusGeometry args={[1.76, 0.02, 16, 90]} />
        <meshStandardMaterial
          color="#66A3BF"
          roughness={0.35}
          metalness={0.15}
          transparent={true}
          opacity={0.8}
        />
      </mesh>

      {/* 3. Central Fingerprint Spiral Core (The Unique Whorl) */}
      <mesh ref={coreSpiralRef} geometry={coreGeometry}>
        <meshStandardMaterial
          color="#3368A0"
          roughness={0.25}
          metalness={0.3}
        />
      </mesh>

      {/* 4. Concentric Biometric Dermal Ridge Loops */}
      {ridgeGeometries.map((geo, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            ridgesRef.current[idx] = el;
          }}
          geometry={geo}
        >
          <meshStandardMaterial
            color={ridgeColors[idx % ridgeColors.length]}
            roughness={0.28}
            metalness={0.22}
          />
        </mesh>
      ))}

      {/* 5. Traveling Cycle Progress Node (Pearl Sage on Outer Circle) */}
      <mesh ref={cycleBeadRef}>
        <sphereGeometry args={[0.11, 24, 24]} />
        <meshStandardMaterial
          color="#C8DFDB"
          roughness={0.15}
          metalness={0.2}
          emissive="#66A3BF"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* 6. Inner Vitality Node (Flowing through biometric fingerprint ridges) */}
      <mesh ref={innerBeadRef}>
        <sphereGeometry args={[0.075, 20, 20]} />
        <meshStandardMaterial
          color="#FFFFFF"
          roughness={0.1}
          metalness={0.1}
          emissive="#C8DFDB"
          emissiveIntensity={0.4}
        />
      </mesh>
    </group>
  );
}

export function InteractiveHero3D({ className = "" }: { className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div
        className={`flex items-center justify-center pointer-events-none select-none ${className}`}
        aria-hidden="true"
      >
        {/* Accessible static SVG representation of the Fingerprint + Cycle motif */}
        <div className="w-52 h-52 relative flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
            <circle cx="100" cy="100" r="90" stroke="#246563" strokeWidth="4" />
            <circle cx="100" cy="100" r="82" stroke="#66A3BF" strokeWidth="2" opacity="0.7" />
            {/* Fingerprint spiral whorl */}
            <path
              d="M100 100 Q106 90 115 100 T100 120 T75 100 T100 70 T135 100 T100 145 T55 100 T100 50 T155 100"
              stroke="#246563"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="100" cy="10" r="5" fill="#C8DFDB" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full min-h-[250px] max-h-[380px] pointer-events-auto select-none ${className}`}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 5.2], fov: 44 }}
          gl={{ antialias: true, alpha: true }}
          style={{ width: "100%", height: "100%" }}
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[4, 6, 5]} intensity={1.3} color="#ffffff" />
          <pointLight position={[-4, -3, 2]} intensity={0.7} color="#66A3BF" />
          <pointLight position={[3, -4, 2]} intensity={0.5} color="#246563" />
          <pointLight position={[0, 4, 3]} intensity={0.4} color="#C8DFDB" />
          <FingerprintCycleSculpture />
        </Canvas>
      </Suspense>
    </div>
  );
}

