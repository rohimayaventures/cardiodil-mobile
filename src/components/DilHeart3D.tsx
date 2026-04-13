import React, { useRef, useMemo, Suspense } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { useGLTF } from '@react-three/drei/native';
import * as THREE from 'three';

const EMERALD = '#22C55E';
const GOLD = '#C9A84C';
const FLAME = '#FF4500';
const SURFACE = '#0D1410';

function HeartModel({ bpm = 72 }: { bpm?: number }) {
  const heartRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const nutrientsRef = useRef<THREE.Group>(null);

  const { scene } = useGLTF(
    require('../../assets/cardiodil-heart-final.glb') as string
  );

  const particles = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      speed: 0.2 + Math.random() * 0.4,
      radius: 2.2 + Math.random() * 1.2,
      angle: Math.random() * Math.PI * 2,
      yOffset: (Math.random() - 0.5) * 2,
      color: i % 2 === 0 ? EMERALD : GOLD,
    }));
  }, []);

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
          color: EMERALD,
          metalness: 0.9,
          roughness: 0.1,
          emissive: SURFACE,
          emissiveIntensity: 0.5,
        });
      }
    });
  }, [scene]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const speedFactor = bpm / 60;

    const pulse = 1 + Math.pow(Math.sin(t * speedFactor * Math.PI), 10) * 0.12;
    if (heartRef.current) {
      heartRef.current.scale.set(pulse, pulse, pulse);
      heartRef.current.rotation.y += 0.005;
    }

    if (flameRef.current) {
      flameRef.current.rotation.z = t * 2 * speedFactor;
    }

    if (nutrientsRef.current) {
      nutrientsRef.current.children.forEach((child, i) => {
        const p = particles[i];
        const angle = p.angle + t * p.speed * speedFactor;
        child.position.x = Math.cos(angle) * p.radius;
        child.position.z = Math.sin(angle) * p.radius;
        child.position.y = p.yOffset + Math.sin(t + i) * 0.3;
      });
    }
  });

  return (
    <group>
      <primitive ref={heartRef} object={scene} />

      <mesh ref={flameRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.7, 0.015, 16, 100]} />
        <meshStandardMaterial
          color={FLAME}
          emissive={FLAME}
          emissiveIntensity={5}
          transparent
          opacity={0.7}
        />
      </mesh>

      <group ref={nutrientsRef}>
        {particles.map((p, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial
              color={p.color}
              emissive={p.color}
              emissiveIntensity={2}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

interface DilHeart3DProps {
  bpm?: number;
  size?: number;
}

export default function DilHeart3D({ bpm = 72, size = 300 }: DilHeart3DProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true }}
        style={StyleSheet.absoluteFillObject}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <pointLight position={[-10, -10, -5]} intensity={0.4} />
        <Suspense fallback={null}>
          <HeartModel bpm={bpm} />
        </Suspense>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
});
