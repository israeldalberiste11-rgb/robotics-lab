import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Grid } from '@react-three/drei'
import { DESIGNS, type RobotDesign } from '../lib/designs'
import { THEMES, type Theme } from '../lib/materials'
import { PHASES, type Phase } from '../lib/pick'
import { PupperModel } from './models/PupperModel'
import { RoverModel } from './models/RoverModel'
import { ArmModel } from './models/ArmModel'

function Scene({ design, speed, playing, theme }: { design: RobotDesign; speed: number; playing: boolean; theme: Theme }) {
  return (
    <>
      {/* Warm burgundy-tinted studio lighting */}
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 5, 2]} intensity={1.05} color="#fff6ef" />
      <directionalLight position={[-3, 3, -2]} intensity={0.4} color="#f3e4e8" />
      <hemisphereLight args={['#fdf6f2', '#e6d2d6', 0.4]} />
      {/* Faint warm ground grid */}
      <Grid
        args={[10, 10]}
        cellSize={0.25}
        cellThickness={0.6}
        cellColor="#e8d9dd"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#d3b6bd"
        fadeDistance={20}
        infiniteGrid
        position={[0, -0.001, 0]}
      />
      <ContactShadows position={[0, 0, 0]} opacity={0.24} scale={8} blur={2.2} far={3} color="#5d1f33" />
      <group position={[0, 0, 0]}>
        {design.id === 'pupper' && <PupperModel speed={speed} playing={playing} />}
        {design.id === 'rover' && <RoverModel speed={speed} playing={playing} />}
        {design.id === 'inmoov' && (
          <ArmModel speed={speed} playing={playing} mats={theme.swatches} />
        )}
      </group>
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={0.6}
        maxDistance={6}
        target={[0, 0.2, 0]}
      />
    </>
  )
}

export function Builds3D() {
  const initial = DESIGNS.find((d) => d.id === new URLSearchParams(window.location.search).get('model'))
  const [design, setDesign] = useState<RobotDesign>(initial ?? DESIGNS[0])
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [theme, setTheme] = useState<Theme>(THEMES[0])
  const [phase, setPhase] = useState<Phase>(PHASES[0])

  return (
    <div className="relative h-full w-full bg-gradient-to-b from-cream to-burg-50">
      <Canvas
        shadows
        camera={{ position: [1.6, 1.2, 1.8], fov: 45 }}
        style={{ background: '#ffffff' }}
      >
        <Suspense fallback={null}>
          <Scene design={design} speed={speed} playing={playing} theme={theme} />
        </Suspense>
      </Canvas>

      {/* Design selector + colour tool */}
      <div className="absolute left-3 top-3 z-10 w-56 rounded-lg border border-neutral-200 bg-white/90 p-3 shadow-sm backdrop-blur">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Open-source builds
        </div>
        <div className="flex flex-col gap-1.5">
          {DESIGNS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDesign(d)}
              className={`rounded px-2.5 py-1.5 text-left text-xs font-medium transition ${
                design.id === d.id
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
        <div className="mt-3 border-t border-burg-100 pt-2">
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Colour theme
          </div>
          <div className="flex flex-col gap-1.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t)}
                className={`flex items-center gap-2 rounded px-2 py-1 text-xs transition ${
                  theme.id === t.id
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                }`}
              >
                <span className="flex">
                  {Object.values(t.swatches).map((s) => (
                    <span
                      key={s.id}
                      className="h-3 w-3 rounded-full border border-white"
                      style={{ background: s.color, marginLeft: -4 }}
                      title={s.name}
                    />
                  ))}
                </span>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Movement explainer (pick-and-place phases) — only for the arm demo */}
      {design.id === 'inmoov' && (
        <div className="absolute left-1/2 top-3 z-10 w-96 -translate-x-1/2 rounded-lg border border-neutral-200 bg-white/90 p-3 text-xs shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-neutral-900">
              Pick &amp; place — how the arm moves
            </div>
            <div className="flex gap-1">
              {PHASES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPhase(p)}
                  className={`rounded px-1.5 py-0.5 text-[10px] transition ${
                    phase.id === p.id
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {p.label.split('·')[0].trim()}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1.5 leading-relaxed text-neutral-700">{phase.explain}</p>
        </div>
      )}

      {/* Attribution / spec panel */}
      <div className="absolute right-3 top-3 z-10 w-72 rounded-lg border border-neutral-200 bg-white/90 p-3 text-xs shadow-sm backdrop-blur">
        <div className="text-sm font-semibold text-neutral-900">{design.name}</div>
        <div className="mt-0.5 text-neutral-500">{design.project}</div>
        <p className="mt-2 leading-relaxed text-neutral-700">{design.blurb}</p>
        <div className="mt-3 space-y-1">
          {design.specs.map((s) => (
            <div key={s.label} className="flex justify-between">
              <span className="text-neutral-500">{s.label}</span>
              <span className="text-neutral-800">{s.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 border-t border-burg-100 pt-2 text-neutral-500">
          <div>
            Source:{' '}
            <a href={design.source} target="_blank" rel="noreferrer" className="text-burg-600 underline">
              {design.source.replace('https://', '')}
            </a>
          </div>
          <div className="mt-0.5">
            License:{' '}
            <a href={design.licenseUrl} target="_blank" rel="noreferrer" className="text-burg-600 underline">
              {design.license}
            </a>
          </div>
        </div>
        <div className="mt-2 text-[10px] leading-snug text-neutral-400">
          Model is a procedural approximation for learning, not the project's exact CAD.
        </div>
      </div>

      {/* Playback controls */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-neutral-200 bg-white/90 px-4 py-2 shadow-sm backdrop-blur">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-burg-600"
        >
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <label className="flex items-center gap-2 text-xs text-neutral-700">
          Speed
          <input
            type="range"
            min={0.2}
            max={3}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-24 accent-burg-600"
          />
          <span className="font-mono text-neutral-800">{speed.toFixed(1)}×</span>
        </label>
        <span className="text-[10px] text-neutral-400">drag to orbit · scroll to zoom</span>
      </div>
    </div>
  )
}
