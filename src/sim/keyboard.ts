import { useEffect, useRef } from 'react'

export type Direction = 'up' | 'down' | 'left' | 'right'
const directions: Record<string, Direction | undefined> = {
  arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
}

export function useRobotKeys(onDrive: (direction: Direction, pressed: boolean) => void, stop: () => void) {
  const handlers = useRef({ onDrive, stop })
  handlers.current = { onDrive, stop }
  useEffect(() => {
    const pressed = new Map<string, Direction>()
    const down = (event: KeyboardEvent) => {
      if (event.altKey || event.metaKey || event.ctrlKey ||
          (event.target instanceof HTMLElement && event.target.closest('input, select, textarea, [contenteditable]'))) return
      const key = event.key.toLowerCase()
      if (key === ' ' && !(event.target instanceof HTMLElement && event.target.closest('button, a'))) {
        event.preventDefault()
        pressed.clear()
        handlers.current.stop()
      }
      const direction = directions[key]
      if (!direction) return
      event.preventDefault()
      pressed.set(key, direction)
      handlers.current.onDrive(direction, true)
    }
    const up = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const direction = pressed.get(key)
      if (!direction) return
      pressed.delete(key)
      if (![...pressed.values()].includes(direction)) handlers.current.onDrive(direction, false)
    }
    const clear = () => {
      for (const direction of new Set(pressed.values())) handlers.current.onDrive(direction, false)
      pressed.clear()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])
}
