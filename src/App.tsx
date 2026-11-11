import { useStore } from './store'
import { MODULES } from './modules'

export default function App() {
  const active = useStore((s) => s.active)
  const set = useStore((s) => s.set)
  const current = MODULES.find((m) => m.id === active)!
  const Active = current.Component

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex items-center gap-4 border-b border-neutral-200 bg-white px-5 py-3">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
          Robotics Lab
        </h1>
        <span className="text-xs text-neutral-500">
          Interactive principles for engineering class
        </span>
        <nav className="ml-auto flex flex-wrap gap-1">
          {MODULES.map((m) => (
            <button
              key={m.id}
              onClick={() => set(m.id)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                active === m.id
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {m.title}
            </button>
          ))}
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 flex-col gap-2 border-r border-neutral-200 bg-white p-4 md:flex">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Principle
          </div>
          <p className="text-sm text-neutral-900">{current.principle}</p>
          <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            What you do
          </div>
          <p className="text-sm text-neutral-600">{current.blurb}</p>
          <div className="mt-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
            💡 Tip: each module shows the <span className="font-semibold text-neutral-900">math</span> that
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
