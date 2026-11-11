import { useStore } from './store'
import { MODULES } from './modules'

export default function App() {
  const active = useStore((s) => s.active)
  const set = useStore((s) => s.set)
  const current = MODULES.find((m) => m.id === active)!
  const Active = current.Component

  return (
    <div className="flex h-full flex-col bg-cream">
      <header className="flex items-center gap-4 border-b border-burg-800 bg-burg-900 px-5 py-3">
        <h1 className="font-display text-lg font-semibold tracking-tight text-cream">
          🤖 Robotics Lab
        </h1>
        <span className="text-xs text-burg-300">
          Interactive principles for engineering class
        </span>
        <nav className="ml-auto flex flex-wrap gap-1">
          {MODULES.map((m) => (
            <button
              key={m.id}
              onClick={() => set(m.id)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                active === m.id
                  ? 'bg-gold-400 text-burg-950'
                  : 'bg-burg-800 text-burg-200 hover:bg-burg-700'
              } ${m.id === 'builds-3d' ? '' : 'opacity-60'}`}
              title={m.id === 'builds-3d' ? undefined : 'Full interactive view coming soon'}
      >
              {m.title}
            </button>
          ))}
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 flex-col gap-2 border-r border-burg-200 bg-burg-50 p-4 md:flex">
          <div className="text-xs font-semibold uppercase tracking-wider text-burg-500">
            Principle
          </div>
          <p className="font-display text-sm text-burg-900">{current.principle}</p>
          <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-burg-500">
            What you do
          </div>
          <p className="text-sm text-burg-700">{current.blurb}</p>
          <div className="mt-auto rounded-lg border border-burg-200 bg-white p-3 text-xs text-burg-700 shadow-sm">
            💡 Tip: each module shows the <span className="font-semibold text-burg-600">math</span> that
            drives the motion. Change an input and read the equations — that's the core of
            robotics.
          </div>
        </aside>

        <main className="relative flex-1 overflow-hidden">
          <Active />
        </main>
      </div>
    </div>
  )
}
