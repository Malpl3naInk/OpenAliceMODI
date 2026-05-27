import type { ReactElement } from 'react'

interface DemoTerminalStubProps {
  readonly label: string
}

export function DemoTerminalStub({ label }: DemoTerminalStubProps): ReactElement {
  return (
    <div className="flex h-full w-full items-center justify-center bg-zinc-950 p-8 text-zinc-400">
      <div className="max-w-md text-center">
        <div className="mb-2 font-mono text-xs uppercase tracking-wider text-zinc-500">
          {label}
        </div>
        <div className="text-sm">
          <span className="font-semibold text-zinc-300">Demo mode — terminal disabled.</span>
        </div>
        <div className="mt-2 text-xs text-zinc-500">
          The PTY backend isn&apos;t wired up in demo mode. Run a real Alice instance to use this terminal.
        </div>
      </div>
    </div>
  )
}
