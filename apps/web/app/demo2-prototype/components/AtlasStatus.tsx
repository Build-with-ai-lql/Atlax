'use client'

import type { FC } from 'react'
import { useState } from 'react'
import { Network } from 'lucide-react'

import { GOLDEN_ATLAS_STATS, type GoldenLayoutMode } from './goldenPrototypeTypes'

const layoutModes: GoldenLayoutMode[] = ['radial', 'force', 'orbit']

const AtlasStatus: FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [layoutMode, setLayoutMode] = useState<GoldenLayoutMode>('radial')

  return (
    <div
      id="mind-hud"
      className={`pointer-events-auto absolute bottom-10 left-10 z-20 flex flex-col overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[rgba(26,26,26,0.7)] p-5 shadow-2xl backdrop-blur-2xl transition-[width,max-height,padding,border-radius] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
        isCollapsed ? 'max-h-11 w-11 cursor-pointer rounded-full !p-3' : 'max-h-[400px] w-72 rounded-2xl'
      }`}
    >
      <button
        id="mind-hud-header"
        type="button"
        onClick={() => setIsCollapsed((value) => !value)}
        className={`flex items-center gap-2 font-medium text-white ${isCollapsed ? 'mb-0' : 'mb-4'}`}
        title="Click to expand/collapse"
      >
        <div className="flex h-5 w-5 shrink-0 items-center justify-center">
          <Network className="h-4 w-4 text-[#a78bfa]" />
        </div>
        <h3
          id="mind-hud-title"
          className={`whitespace-nowrap text-white transition-opacity ${
            isCollapsed ? 'hidden w-0 opacity-0' : 'opacity-100'
          }`}
        >
          Graph View
        </h3>
      </button>

      <div
        id="mind-hud-content"
        className={`transition-opacity duration-300 ${
          isCollapsed ? 'pointer-events-none m-0 h-0 p-0 opacity-0' : 'opacity-100'
        }`}
      >
        <div className="mb-5 space-y-3 border-b border-[rgba(255,255,255,0.08)] pb-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#8B8B8B]">World Tree</span>
            <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-white">{GOLDEN_ATLAS_STATS.worldTree}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#8B8B8B]">Active Domains</span>
            <span className="font-mono text-[#a78bfa]">{GOLDEN_ATLAS_STATS.activeDomains}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#8B8B8B]">Documents</span>
            <span className="font-mono text-[#bbf7d0]">{GOLDEN_ATLAS_STATS.documents}</span>
          </div>
        </div>

        <div className="mb-2 text-xs font-medium text-[#8B8B8B]">LAYOUT ALGORITHM</div>
        <div className="flex gap-2">
          {layoutModes.map((mode) => {
            const active = layoutMode === mode
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setLayoutMode(mode)}
                className={`flex-1 rounded-lg border py-1.5 text-xs font-medium capitalize transition-colors ${
                  active
                    ? 'border-white/20 bg-white/10 text-white'
                    : 'border-transparent bg-white/5 text-[#8B8B8B] hover:bg-white/10 hover:text-white'
                }`}
              >
                {mode}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AtlasStatus
