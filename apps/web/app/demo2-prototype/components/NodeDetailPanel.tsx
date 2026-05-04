'use client'

import type { FC } from 'react'
import { FileText, PenTool, X } from 'lucide-react'

import { GOLDEN_NODE_DETAIL_MOCK, type GoldenNodeDetail } from './goldenPrototypeTypes'

interface NodeDetailPanelProps {
  node?: GoldenNodeDetail
  isOpen?: boolean
  onClose?: () => void
  onOpenEditor?: () => void
}

const NodeDetailPanel: FC<NodeDetailPanelProps> = ({
  node = GOLDEN_NODE_DETAIL_MOCK,
  isOpen = false,
  onClose,
  onOpenEditor,
}) => {
  return (
    <div
      id="node-detail-panel"
      className={`pointer-events-auto absolute right-6 top-20 z-20 flex max-h-[70vh] w-80 flex-col rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(26,26,26,0.7)] p-0 shadow-2xl backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-5 opacity-0'
      }`}
    >
      <div className="border-b border-[rgba(255,255,255,0.08)] p-5">
        <div className="mb-3 flex items-start justify-between">
          <div
            id="node-panel-icon"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] bg-white/5"
          >
            <FileText className="h-4 w-4 text-white" />
          </div>
          <button
            id="btn-close-node"
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#8B8B8B] transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4 pointer-events-none" />
          </button>
        </div>
        <h2 id="node-panel-title" className="mb-2 text-lg font-bold text-white">
          {node.title}
        </h2>
        <div className="flex gap-2 font-mono text-xs">
          <span
            id="node-panel-type"
            className="rounded border border-[#bbf7d0]/20 bg-[#bbf7d0]/10 px-2 py-0.5 text-[#bbf7d0]"
          >
            {node.type}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <h4 className="mb-3 text-xs font-semibold text-[#8B8B8B]">CONNECTED NODES</h4>
        <div id="node-connections-list" className="space-y-2">
          {node.connections.map((connection) => (
            <button
              key={connection.id}
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-[rgba(255,255,255,0.08)] bg-white/5 px-3 py-2 text-left transition-colors hover:border-[#a78bfa]"
            >
              <span className="truncate text-sm text-white">{connection.label}</span>
              <span className="ml-2 shrink-0 font-mono text-[10px] text-[#8B8B8B]">{connection.type}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[rgba(255,255,255,0.08)] bg-white/[0.02] p-5">
        <button
          type="button"
          onClick={onOpenEditor}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[rgba(255,255,255,0.08)] bg-white/10 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
        >
          <PenTool className="h-4 w-4 pointer-events-none" />
          Open in Editor
        </button>
      </div>
    </div>
  )
}

export default NodeDetailPanel
