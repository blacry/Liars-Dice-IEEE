'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Text } from '@react-three/drei';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

const pipSlots: Record<number, [number, number][]> = {
  1: [[0, 0]], 2: [[-.22, .22], [.22, -.22]], 3: [[-.22, .22], [0, 0], [.22, -.22]],
  4: [[-.22, -.22], [-.22, .22], [.22, -.22], [.22, .22]],
  5: [[-.22, -.22], [-.22, .22], [0, 0], [.22, -.22], [.22, .22]],
  6: [[-.22, -.25], [-.22, 0], [-.22, .25], [.22, -.25], [.22, 0], [.22, .25]],
};
function FacePips({ value, size, axis }: { value:number; size:number; axis:'top'|'bottom'|'front'|'back'|'right'|'left' }) {
  const spots = pipSlots[value] || pipSlots[1];
  const surface = size + .008;
  return <group>
    {spots.map(([a,b],i)=>{
      const offsetA=a*size*2.1, offsetB=b*size*2.1;
      const position: [number,number,number] = axis==='top' ? [offsetA,surface,offsetB]
        : axis==='bottom' ? [offsetA,-surface,-offsetB]
        : axis==='front' ? [offsetA,-offsetB,surface]
        : axis==='back' ? [-offsetA,-offsetB,-surface]
        : axis==='right' ? [surface,-offsetB,-offsetA]
        : [-surface,-offsetB,offsetA];
      return <group key={`${axis}-${i}`} position={position}>
        <mesh scale={[1,.42,1]} castShadow>
          <sphereGeometry args={[size*.095,16,12]} />
          <meshStandardMaterial color="#17243a" roughness={.22} metalness={.12} />
        </mesh>
        <mesh position={[-size*.018,size*.018,size*.022]} scale={[.28,.22,.28]}>
          <sphereGeometry args={[size*.095,10,8]} />
          <meshBasicMaterial color="#71829a" transparent opacity={.28} />
        </mesh>
      </group>;
    })}
  </group>;
}

function Die3D({ value, position, index, rollId = 0, small = false, concealed = false }: { value: number; position: [number, number, number]; index: number; rollId?: number; small?: boolean; concealed?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const lastValue = useRef(value);
  const lastRollId = useRef(rollId);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const mesh = ref.current;
    mesh.position.set(...position);
    if (lastRollId.current !== rollId || lastValue.current !== value) {
      gsap.killTweensOf(mesh.rotation);
      gsap.killTweensOf(mesh.position);
      mesh.rotation.set(0, 0, 0);
      mesh.position.set(...position);
      const turns = index % 2 ? 4 : 3;
      const duration = .95 + (index % 4) * .13;
      const toss = gsap.timeline({ delay: (index % 5) * .09 });
      toss.to(mesh.position, { x: position[0] + (index % 3 - 1) * .16, y: position[1] + .7 + (index % 3) * .14, z: position[2] + ((index + 1) % 3 - 1) * .2, duration: .22, ease: 'power2.out' }, 0)
        .to(mesh.rotation, { x: Math.PI * 2 * turns, y: Math.PI * 2 * (turns + 1), z: Math.PI * 2 * (turns - 1), duration, ease: 'power2.inOut' }, 0)
        .to(mesh.position, { x: position[0], y: position[1], z: position[2], duration: .48, ease: 'bounce.out' }, duration * .56);
      lastValue.current = value;
      lastRollId.current = rollId;
    }
  }, [value, rollId, index, position[0], position[1], position[2]]);
  const spots = pipSlots[value] || pipSlots[1];
  const size = small ? .3 : .47;
  return <group ref={ref}>
    <RoundedBox args={[size * 2, size * 2, size * 2]} radius={size * .2} smoothness={4} castShadow receiveShadow>
      <meshStandardMaterial color={concealed ? '#182b36' : '#f7f3e8'} roughness={.19} metalness={.04} />
      {!concealed && <>
        <FacePips value={value} size={size} axis="top" />
        <FacePips value={7-value} size={size} axis="bottom" />
        <FacePips value={2} size={size} axis="front" />
        <FacePips value={5} size={size} axis="back" />
        <FacePips value={3} size={size} axis="right" />
        <FacePips value={4} size={size} axis="left" />
      </>}
      {concealed && <Text position={[0,size+.01,0]} rotation={[-Math.PI/2,0,0]} fontSize={size*.72} color="#d6e9dc" anchorX="center" anchorY="middle">✦</Text>}
    </RoundedBox>
  </group>;
}

type TableScene = 'felt' | 'bar' | 'classroom' | 'midnight';
const sceneColors: Record<TableScene, { felt:string; trim:string; wall:string; light:string }> = {
  felt: { felt:'#214733', trim:'#4a3020', wall:'#101e15', light:'#d0b575' },
  bar: { felt:'#553723', trim:'#2b1b13', wall:'#1c130f', light:'#e3a45c' },
  classroom: { felt:'#a7875c', trim:'#5a422b', wall:'#24354a', light:'#d9d2ac' },
  midnight: { felt:'#172b4b', trim:'#111c31', wall:'#080e1c', light:'#91b5ff' },
};
function Bottle({position,color='#5c8b62'}:{position:[number,number,number];color?:string}){return <group position={position}>
  <mesh position={[0,.3,0]} castShadow><cylinderGeometry args={[.18,.23,.58,20]} /><meshStandardMaterial color={color} roughness={.24} metalness={.1} /></mesh>
  <mesh position={[0,.68,0]} castShadow><cylinderGeometry args={[.075,.11,.2,16]} /><meshStandardMaterial color={color} roughness={.22} /></mesh>
  <mesh position={[0,.8,0]}><cylinderGeometry args={[.07,.07,.06,16]} /><meshStandardMaterial color="#d4b46f" metalness={.65} roughness={.25} /></mesh>
</group>}
function TableRoom({scene,colors}:{scene:TableScene;colors:{felt:string;trim:string;wall:string;light:string}}){return <>
  <mesh position={[0,3,-8]} receiveShadow><boxGeometry args={[24,9,.35]} /><meshStandardMaterial color={colors.wall} roughness={.92} /></mesh>
  {scene==='bar' && <>
    {[2.2,3.5,4.8].map(y=><group key={y}>
      <mesh position={[0,y,-7.72]} castShadow><boxGeometry args={[14,.16,.55]} /><meshStandardMaterial color="#71472c" roughness={.42} /></mesh>
      {[-5.5,-3.3,-1.1,1.1,3.3,5.5].map((x,i)=><Bottle key={`${y}-${x}`} position={[x,y+.08,-7.65]} color={['#356f54','#9c432e','#7b793b','#45758a'][i%4]} />)}
    </group>)}
    {[-5,0,5].map(x=><group key={x} position={[x,5,-4.5]}>
      <mesh position={[0,-.23,0]}><cylinderGeometry args={[.09,.09,.48,16]} /><meshStandardMaterial color="#b48a50" metalness={.55} /></mesh>
      <mesh position={[0,-.53,0]}><coneGeometry args={[.55,.36,28,1,true]} /><meshStandardMaterial color="#9b6031" side={THREE.DoubleSide} metalness={.25} roughness={.34} /></mesh>
      <pointLight position={[0,-.75,0]} color="#ffb35d" intensity={28} distance={7} />
    </group>)}
  </>}
  {scene==='classroom' && <>
    <mesh position={[0,3.6,-7.73]} castShadow><boxGeometry args={[13,3.6,.12]} /><meshStandardMaterial color="#1c392f" roughness={.9} /></mesh>
    <mesh position={[0,5.47,-7.68]}><boxGeometry args={[13.3,.12,.2]} /><meshStandardMaterial color="#c29c5c" roughness={.5} /></mesh>
    <Text position={[0,4.05,-7.64]} fontSize={.43} color="#d2d9bd" anchorX="center">BLUFF.EXE · ROLL CALL</Text>
    <Text position={[0,3.3,-7.63]} fontSize={.25} color="#aebd9e" anchorX="center">FIVE DICE  /  ONE CLAIM  /  FIRST TO FIVE</Text>
    <group position={[-6.2,.03,-3.5]} rotation={[0,.08,-.03]}>
      {[0,1,2].map(i=><mesh key={i} position={[0,i*.12,0]} castShadow><boxGeometry args={[1.45,.12,.9]} /><meshStandardMaterial color={['#314f78','#b64a3d','#47734b'][i]} roughness={.78} /></mesh>)}
    </group>
    <group position={[6.1,.02,-3.5]}>
      <mesh position={[0,.55,0]} rotation={[0,0,-.15]}><coneGeometry args={[.55,.32,24,1,true]} /><meshStandardMaterial color="#d2b56e" metalness={.45} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0,.25,0]}><cylinderGeometry args={[.06,.07,.52,12]} /><meshStandardMaterial color="#263a38" metalness={.35} /></mesh>
      <mesh position={[0,.04,0]}><cylinderGeometry args={[.36,.42,.08,20]} /><meshStandardMaterial color="#263a38" metalness={.35} /></mesh>
      <pointLight position={[0,.3,.1]} color="#ffe2a3" intensity={12} distance={5} />
    </group>
  </>}
  {scene==='felt' && <>
    <Text position={[0,4.7,-7.72]} fontSize={.54} color="#d5b86c" anchorX="center">BLUFF.EXE</Text>
    <Text position={[0,4.1,-7.71]} fontSize={.19} color="#a9c9ad" anchorX="center">THE PRIVATE TABLE</Text>
    {[-6.5,6.5].map(x=><group key={x} position={[x,.05,-3.7]}>
      {[0,1,2].map(i=><mesh key={i} position={[0,i*.09,0]} castShadow><cylinderGeometry args={[.38,.38,.09,32]} /><meshStandardMaterial color={i===1?'#b7483e':'#d2b56e'} metalness={.14} roughness={.42} /></mesh>)}
    </group>)}
    {[-5,5].map(x=><group key={x} position={[x,4.25,-7.55]}>
      <mesh><sphereGeometry args={[.2,16,12]} /><meshStandardMaterial color="#ffcf77" emissive="#f7a847" emissiveIntensity={1.6} /></mesh>
      <pointLight color="#eeb768" intensity={18} distance={5} />
    </group>)}
  </>}
  {scene==='midnight' && <>
    <Text position={[0,4.65,-7.72]} fontSize={.48} color="#8db5ff" anchorX="center">NIGHT SHIFT</Text>
    {Array.from({length:18},(_,i)=><mesh key={i} position={[-8+(i%6)*3.2,2.2+Math.floor(i/6)*1.25,-7.72]}>
      <sphereGeometry args={[.035+(i%3)*.018,10,8]} /><meshBasicMaterial color={i%2?'#5fa8ff':'#d4bdff'} /></mesh>)}
    {[-6.4,6.4].map(x=><pointLight key={x} position={[x,2.8,-6]} color={x<0?'#4185ff':'#bd63ff'} intensity={24} distance={10} />)}
  </>}
</>}
let sharedAudio: AudioContext | null = null;
function getAudio() {
  if (typeof window === 'undefined') return null;
  const Audio = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Audio) return null;
  sharedAudio ||= new Audio();
  return sharedAudio;
}
export function primeDiceAudio() {
  const audio = getAudio();
  if (audio) void audio.resume();
}
export function playDiceTumble() {
  const audio = getAudio();
  if (!audio) return;
  void audio.resume();
  const start = audio.currentTime;
  for (let i=0;i<18;i++) {
    const when = start + i*.045 + (i%3)*.012;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const filter = audio.createBiquadFilter();
    osc.type = i%4===0 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(170+(i%5)*31,when);
    osc.frequency.exponentialRampToValueAtTime(68,when+.075);
    filter.type='lowpass'; filter.frequency.value=850;
    gain.gain.setValueAtTime(.0001,when); gain.gain.exponentialRampToValueAtTime(.48/(1+i*.09),when+.006); gain.gain.exponentialRampToValueAtTime(.0001,when+.13);
    osc.connect(filter); filter.connect(gain); gain.connect(audio.destination);
    osc.start(when); osc.stop(when+.1);
    const noise = audio.createBufferSource();
    const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate*.035), audio.sampleRate);
    const channel = buffer.getChannelData(0);
    for(let sample=0;sample<channel.length;sample++) channel[sample]=(Math.random()*2-1)*(1-sample/channel.length);
    noise.buffer=buffer;
    const clickFilter=audio.createBiquadFilter(); clickFilter.type='highpass'; clickFilter.frequency.value=1100+(i%4)*250;
    const clickGain=audio.createGain(); clickGain.gain.setValueAtTime(.0001,when); clickGain.gain.exponentialRampToValueAtTime(.24/(1+i*.1),when+.003); clickGain.gain.exponentialRampToValueAtTime(.0001,when+.045);
    noise.connect(clickFilter); clickFilter.connect(clickGain); clickGain.connect(audio.destination); noise.start(when); noise.stop(when+.04);
  }
}
export function playUiSfx(kind:'tap'|'bid'|'challenge'|'round') {
  const audio=getAudio(); if(!audio) return; void audio.resume();
  const start=audio.currentTime;
  const notes=kind==='round'?[660,880,1100]:kind==='challenge'?[390,275,185]:kind==='bid'?[520,390]:[740];
  notes.forEach((frequency,index)=>{
    const when=start+index*(kind==='round'?.08:.055); const osc=audio.createOscillator(); const gain=audio.createGain();
    osc.type=kind==='challenge'?'triangle':'sine'; osc.frequency.setValueAtTime(frequency,when); osc.frequency.exponentialRampToValueAtTime(frequency*.78,when+.11);
    gain.gain.setValueAtTime(.0001,when); gain.gain.exponentialRampToValueAtTime(kind==='tap'?.11:.2,when+.008); gain.gain.exponentialRampToValueAtTime(.0001,when+.14);
    osc.connect(gain);gain.connect(audio.destination);osc.start(when);osc.stop(when+.15);
  });
}
function DiceScene({ hand, aiHand, reveal, bid, rollId, reduceMotion, scene, sound }: { hand: number[]; aiHand?: number[] | null; reveal: boolean; bid?: {q:number;f:number}|null; rollId:number; reduceMotion: boolean; scene:TableScene; sound:boolean }) {
  const controls = useRef<any>(null);
  const [cameraReady, setCameraReady] = useState(false);
  useFrame(({ camera }) => {
    if (reduceMotion) return;
    const t = performance.now() * .00012;
    camera.position.x += Math.sin(t) * .00012;
  });
  const reset = useCallback(() => {
    if (!controls.current) return;
    gsap.to(controls.current.object.position, { x: 0, y: 7.6, z: 10.5, duration: .7, ease: 'power2.inOut', onUpdate: () => controls.current?.update() });
    gsap.to(controls.current.target, { x: 0, y: 0, z: 0, duration: .7, ease: 'power2.inOut', onUpdate: () => controls.current?.update() });
  }, []);
  useEffect(() => { if (cameraReady) reset(); }, [cameraReady, reset]);
  useEffect(() => {
    window.addEventListener('bluff-camera-reset', reset);
    return () => window.removeEventListener('bluff-camera-reset', reset);
  }, [reset]);
  const visibleAI = reveal && aiHand ? aiHand : Array.from({length:5}, (_,i)=> (i * 2) % 6 + 1);
  const colors = sceneColors[scene];
  const lastSoundRoll = useRef(rollId);
  useEffect(()=>{ if(rollId!==lastSoundRoll.current){lastSoundRoll.current=rollId;if(sound)playDiceTumble();} },[rollId,sound]);
  return <>
    <ambientLight intensity={1.05} color="#e2e4db" />
    <directionalLight position={[-4, 9, 5]} intensity={2.8} castShadow shadow-mapSize={[2048,2048]} />
    <pointLight position={[4, 5, -3]} intensity={scene === 'midnight' ? 35 : 18} color={colors.light} />
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.7,0]} receiveShadow>
      <planeGeometry args={[200,200]} />
      <meshStandardMaterial color={colors.wall} roughness={1} />
    </mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.35,0]} receiveShadow>
      <planeGeometry args={[20,14]} />
      <meshStandardMaterial color={colors.trim} roughness={.76} />
    </mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.28,0]} receiveShadow>
      <planeGeometry args={[16,10]} />
      <meshStandardMaterial color={colors.felt} roughness={scene==='classroom' ? .55 : .9} />
    </mesh>
    {[-8.05,8.05].map(x=><mesh key={x} position={[x,-.23,0]} castShadow><boxGeometry args={[.2,.18,10.35]} /><meshStandardMaterial color={colors.light} metalness={.35} roughness={.42} /></mesh>)}
    {[-5.08,5.08].map(z=><mesh key={z} position={[0,-.23,z]} castShadow><boxGeometry args={[16.1,.18,.2]} /><meshStandardMaterial color={colors.light} metalness={.35} roughness={.42} /></mesh>)}
    <TableRoom scene={scene} colors={colors} />
    {Array.from({length:5},(_,i)=>{
      const x=(i-2)*1.2;
      return <Die3D key={`ai-${i}`} value={visibleAI[i]} index={i} rollId={rollId} concealed={!reveal} position={[x,.25,-2.3]} />;
    })}
    {Array.from({length:5},(_,i)=>{
      const x=(i-2)*1.2;
      return <Die3D key={`human-${i}`} value={hand[i]||1} index={i+5} rollId={rollId} position={[x,.25,2.3]} />;
    })}
    <Text position={[-5,.12,-2.3]} fontSize={.24} color="#d6e9dc" anchorX="center">{reveal ? 'AI' : 'AI · HIDDEN'}</Text>
    <Text position={[0,.12,3.55]} fontSize={.22} color="#d6e9dc" anchorX="center">YOUR FIVE DICE</Text>
    {bid && <group position={[0,.05,0]}>
      <mesh><cylinderGeometry args={[.95,.95,.08,64]} /><meshStandardMaterial color="#d0b575" metalness={.45} roughness={.35} /></mesh>
      <Text position={[0,.4,0]} fontSize={.48} color="#122031" anchorX="center" anchorY="middle">{`${bid.q} × ${bid.f}`}</Text>
    </group>}
    <OrbitControls ref={controls} makeDefault enablePan={false} minDistance={7} maxDistance={17} minPolarAngle={.35} maxPolarAngle={1.42} enableDamping dampingFactor={.08} />
    <PerspectiveCameraSetup onReady={()=>setCameraReady(true)} />
  </>;
}

function PerspectiveCameraSetup({ onReady }: { onReady:()=>void }) {
  useEffect(()=>{ onReady(); },[onReady]);
  return null;
}

export function Die({ value, concealed = false, small = false }: { value?: number; concealed?: boolean; small?: boolean }) {
  return <span className={`die${concealed ? ' die-back' : ''}${small ? ' die-small' : ''}`} role="img" aria-label={concealed ? 'Concealed die' : `Die showing ${value}`}>
    {concealed ? '· · ·' : <span>{value}</span>}
  </span>;
}

export default function DiceTable({ hand, aiHand, bid, round, rollId = 0, reduceMotion = false, scene = 'felt', sound = true, onSceneChange, onSoundToggle }: { hand: number[]; aiHand?: number[] | null; bid?: { q: number; f: number } | null; round?: number; rollId?:number; reduceMotion?: boolean; scene?:TableScene; sound?: boolean; onSceneChange?:(scene:TableScene)=>void; onSoundToggle?:()=>void }) {
  const revealed = Boolean(aiHand);
  const lastTap = useRef(0);
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 360) window.dispatchEvent(new Event('bluff-camera-reset'));
    lastTap.current = now;
  };
  return <div className={`dice-world scene-${scene}`} onDoubleClick={()=>window.dispatchEvent(new Event('bluff-camera-reset'))} onPointerUp={handleTap}>
    <div className="world-hud"><span>ROUND {round ? String(round).padStart(2,'0') : '—'} · {revealed ? 'REVEAL' : 'YOUR TURN'}</span><div className="world-actions"><label className="scene-select">TABLE<select aria-label="Choose table background" value={scene} onChange={event=>{onSceneChange?.(event.target.value as TableScene);if(sound)playUiSfx('tap');}}><option value="felt">Green felt</option><option value="bar">The bar</option><option value="classroom">Classroom</option><option value="midnight">Midnight</option></select></label><button type="button" aria-pressed={sound} onClick={()=>{ if(!sound) void getAudio()?.resume(); onSoundToggle?.(); }}>{sound ? 'SOUND ON' : 'SOUND OFF'}</button><button type="button" onClick={()=>{window.dispatchEvent(new Event('bluff-camera-reset'));if(sound)playUiSfx('tap');}}>RESET VIEW</button></div></div>
    <Canvas shadows gl={{antialias:true}} camera={{position:[0,7.6,10.5],fov:38}} dpr={[1,2]}>
      <DiceScene hand={hand} aiHand={aiHand} reveal={revealed} bid={bid} rollId={rollId} reduceMotion={reduceMotion} scene={scene} sound={sound} />
    </Canvas>
  </div>;
}
