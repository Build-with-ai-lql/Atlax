'use client'

import type { FC } from 'react'

import type { PrototypeShellProps } from './goldenPrototypeTypes'

const PrototypeShell: FC<PrototypeShellProps> = ({ children, topNav, activeView = 'home' }) => {
  return (
    <div className="dark">
      <div className="relative h-screen w-screen overflow-hidden bg-[#111111] text-[#E2E8F0] selection:bg-[#a78bfa] selection:text-white">
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-screen w-screen -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,rgba(17,17,17,0)_60%)]" />

        <div
          id="canvas-container"
          className="pointer-events-auto absolute inset-0 z-0 opacity-100 transition-opacity duration-500"
          aria-hidden={activeView !== 'mind'}
        >
          <canvas id="mindCanvas" className="h-full w-full touch-none" />
        </div>

        {topNav}

        <main
          id="main-container"
          className="pointer-events-none relative z-10 flex h-full w-full justify-center overflow-hidden px-8 pb-8 pt-28 transition-[width,margin-left,padding] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export default PrototypeShell
