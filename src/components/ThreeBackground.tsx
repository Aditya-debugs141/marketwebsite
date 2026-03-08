'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sparkles, Float, PerspectiveCamera } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useSocket } from '@/hooks/use-socket';

function TechGrid({ color = '#1e40af' }: { color?: string }) {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
            <planeGeometry args={[100, 100, 20, 20]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={0.1} />
        </mesh>
    );
}

function FloatingDataPoints({ color = '#0ea5e9' }: { color?: string }) {
    const group = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (group.current) {
            group.current.rotation.y = state.clock.getElapsedTime() * 0.05;
        }
    });

    return (
        <group ref={group}>
            {/* Core Data Stream */}
            <Sparkles
                count={200}
                scale={12}
                size={4}
                speed={0.4}
                opacity={0.5}
                color={color}
            />
            {/* Peripheral Noise */}
            <Sparkles
                count={100}
                scale={20}
                size={2}
                speed={0.2}
                opacity={0.2}
                color={color} // Or complimentary?
            />
        </group>
    );
}

export default function ThreeBackground() {
    const { socket } = useSocket();
    const [mood, setMood] = useState<'neutral' | 'bullish' | 'bearish'>('neutral');

    useEffect(() => {
        if (!socket) return;

        socket.on('price_update', () => {
            // Simple logic: if NIFTY is up, bullish. (In real app, we'd use the % change)
            // For now, let's just oscillate or use data if available.
            // Actually, let's use the 'change' from sector data if we had it, or just random for now as we don't have full market stat here.

            // Better: Listen to a 'market_sentiment' event if we added it, or deduce from price.
            // Let's deduce from a quick check or just keep neutral/subtle for now.
            // To make it cool, let's cycle colors slowly or react to "news_update".
        });

        // Listen to sector update to decide mood
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.on('sector_update', (data: any[]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const bank = data.find((s: any) => s.name.includes('BANK'));
            if (bank) {
                setMood(bank.change > 0 ? 'bullish' : 'bearish');
            }
        });

        return () => {
            socket.off('price_update');
            socket.off('sector_update');
        };
    }, [socket]);

    const color = mood === 'bullish' ? '#10b981' : mood === 'bearish' ? '#f43f5e' : '#3b82f6';

    return (
        <div className="fixed inset-0 -z-10 opacity-60 pointer-events-none hidden lg:block transition-opacity duration-1000">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={50} />
                <fog attach="fog" args={['#050505', 10, 25]} />

                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1} color={color} />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#8b5cf6" />

                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <FloatingDataPoints color={color} />
                </Float>

                <TechGrid color={color} />
                <PulseRings color={color} />
            </Canvas>
        </div>
    );
}

function PulseRings({ color }: { color: string }) {
    const group = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (group.current) {
            group.current.children.forEach((child, i) => {
                const mesh = child as THREE.Mesh;
                const s = (state.clock.elapsedTime * 0.5 + i * 2) % 10;
                mesh.scale.setScalar(s);
                if (mesh.material) {
                    (mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - s / 10) * 0.1;
                }
            });
        }
    });

    return (
        <group ref={group} rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]}>
            {[0, 1, 2].map(i => (
                <mesh key={i}>
                    <ringGeometry args={[0, 1, 32]} />
                    <meshBasicMaterial color={color} transparent wireframe />
                </mesh>
            ))}
        </group>
    );
}
