'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  FileText,
  Network,
  FolderTree,
  ExternalLink,
  Tag,
} from 'lucide-react'
import type { StoredMindNode, StoredMindEdge } from '@/lib/repository'

interface MindCanvasStageProps {
  nodes: StoredMindNode[]
  edges: StoredMindEdge[]
  onOpenEditor: (id: number) => void
  onToast: (msg: string) => void
}

interface CanvasNode {
  id: string
  x: number
  y: number
  radius: number
  color: string
  type: string
  title: string
  documentId: number | null
  label: string
}

interface CanvasEdge {
  sourceId: string
  targetId: string
}

type LayoutMode = 'radial' | 'force' | 'orbit'

const NODE_COLORS: Record<string, string> = {
  source: '#10B981',
  document: '#6366F1',
  project: '#F59E0B',
  tag: '#8B5CF6',
}

const NODE_RADII: Record<string, number> = {
  project: 10,
  document: 7,
  source: 5,
  tag: 4,
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function buildCanvasGraph(
  storedNodes: StoredMindNode[],
  storedEdges: StoredMindEdge[],
  w: number,
  h: number
): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const cx = w / 2
  const cy = h / 2
  const canvasNodes: CanvasNode[] = storedNodes.map((n, i) => {
    const angle = (i / storedNodes.length) * Math.PI * 2
    const spread = Math.min(w, h) * 0.3
    return {
      id: n.id,
      x: cx + Math.cos(angle) * (spread * 0.3 + (hashStr(n.id) % spread * 0.7)),
      y: cy + Math.sin(angle) * (spread * 0.3 + (hashStr(n.id + 'y') % spread * 0.7)),
      radius: NODE_RADII[n.nodeType] || 5,
      color: NODE_COLORS[n.nodeType] || '#10B981',
      type: n.nodeType,
      title: n.label || n.id,
      documentId: n.documentId ?? null,
      label: n.label || n.id,
    }
  })
  const nodeIds = new Set(canvasNodes.map(n => n.id))
  const canvasEdges: CanvasEdge[] = storedEdges
    .filter(e => nodeIds.has(e.sourceNodeId) && nodeIds.has(e.targetNodeId))
    .map(e => ({ sourceId: e.sourceNodeId, targetId: e.targetNodeId }))
  return { nodes: canvasNodes, edges: canvasEdges }
}

export default function MindCanvasStage({ nodes: storedNodes, edges: storedEdges, onOpenEditor, onToast }: MindCanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animFrameRef = useRef<number>(0)

  const graphRef = useRef<{ nodes: CanvasNode[]; edges: CanvasEdge[] }>({ nodes: [], edges: [] })
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 })
  const dragRef = useRef<{ type: 'pan' | 'node' | null; startX: number; startY: number; nodeIdx: number; pointerDownTime: number; pointerDownPos: { x: number; y: number } }>({ type: null, startX: 0, startY: 0, nodeIdx: -1, pointerDownTime: 0, pointerDownPos: { x: 0, y: 0 } })
  const hoveredIdxRef = useRef(-1)
  const selectedIdxRef = useRef(-1)

  const [zoom, setZoom] = useState(1)
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null)
  const [hudCollapsed, setHudCollapsed] = useState(false)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('radial')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterSearch, setFilterSearch] = useState('')
  const [showDocuments, setShowDocuments] = useState(true)
  const [showTags, setShowTags] = useState(true)
  const [showSources, setShowSources] = useState(true)
  const [visibleCount, setVisibleCount] = useState(storedNodes.length)

  const filterNodes = useCallback(() => {
    const g = graphRef.current
    if (!g) return
    let count = 0
    g.nodes.forEach(n => {
      let visible = true
      if (!showDocuments && n.type === 'document') visible = false
      if (!showTags && n.type === 'tag') visible = false
      if (!showSources && n.type === 'source') visible = false
      if (filterSearch && !n.title.toLowerCase().includes(filterSearch.toLowerCase())) visible = false
      if (visible) count++
    })
    setVisibleCount(count)
  }, [showDocuments, showTags, showSources, filterSearch])

  useEffect(() => { filterNodes() }, [filterNodes])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.width / dpr
    const h = canvas.height / dpr
    const cam = cameraRef.current
    const g = graphRef.current
    const hovIdx = hoveredIdxRef.current
    const selIdx = selectedIdxRef.current

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.translate(cam.x, cam.y)
    ctx.scale(cam.zoom, cam.zoom)

    for (let i = 0; i < 60; i++) {
      const px = (hashStr(`dot-${i}`) % Math.floor(w * 2)) - w * 0.5
      const py = (hashStr(`dot-${i}-y`) % Math.floor(h * 2)) - h * 0.5
      ctx.beginPath()
      ctx.arc(px, py, 0.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.015)'
      ctx.fill()
    }

    g.edges.forEach(e => {
      const src = g.nodes.find(n => n.id === e.sourceId)
      const tgt = g.nodes.find(n => n.id === e.targetId)
      if (!src || !tgt) return
      let srcVis = true, tgtVis = true
      if (!showDocuments && src.type === 'document') srcVis = false
      if (!showSources && src.type === 'source') srcVis = false
      if (!showTags && src.type === 'tag') srcVis = false
      if (!showDocuments && tgt.type === 'document') tgtVis = false
      if (!showSources && tgt.type === 'source') tgtVis = false
      if (!showTags && tgt.type === 'tag') tgtVis = false
      if (!srcVis || !tgtVis) return
      ctx.beginPath()
      ctx.moveTo(src.x, src.y)
      ctx.lineTo(tgt.x, tgt.y)
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 0.8 / cam.zoom
      ctx.stroke()
    })

    g.nodes.forEach((n, i) => {
      let visible = true
      if (!showDocuments && n.type === 'document') visible = false
      if (!showTags && n.type === 'tag') visible = false
      if (!showSources && n.type === 'source') visible = false
      if (filterSearch && !n.title.toLowerCase().includes(filterSearch.toLowerCase())) visible = false
      if (!visible) return

      const isHov = i === hovIdx
      const isSel = i === selIdx
      const r = n.radius / cam.zoom

      if (isHov || isSel) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 8 / cam.zoom, 0, Math.PI * 2)
        ctx.fillStyle = n.color + '15'
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.fillStyle = isSel ? n.color : isHov ? n.color + 'cc' : n.color + '80'
      ctx.fill()

      if (isSel) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 3 / cam.zoom, 0, Math.PI * 2)
        ctx.strokeStyle = n.color + '60'
        ctx.lineWidth = 1.5 / cam.zoom
        ctx.stroke()
      }

      if (isHov && cam.zoom > 0.5) {
        ctx.font = `${11 / cam.zoom}px -apple-system, sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.8)'
        ctx.textAlign = 'center'
        ctx.fillText(n.title, n.x, n.y - r - 8 / cam.zoom)
      }
    })

    ctx.restore()
    animFrameRef.current = requestAnimationFrame(draw)
  }, [showDocuments, showTags, showSources, filterSearch])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    cameraRef.current = {
      x: rect.width / 2,
      y: rect.height / 2,
      zoom: cameraRef.current.zoom,
    }

    graphRef.current = buildCanvasGraph(storedNodes, storedEdges, rect.width, rect.height)

    animFrameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [storedNodes, storedEdges, draw])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const canvas = canvasRef.current
        if (!canvas) return
        const dpr = window.devicePixelRatio || 1
        const { width, height } = entry.contentRect
        canvas.width = width * dpr
        canvas.height = height * dpr
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        cameraRef.current.x = width / 2
        cameraRef.current.y = height / 2
        graphRef.current = buildCanvasGraph(storedNodes, storedEdges, width, height)
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [storedNodes, storedEdges])

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const cam = cameraRef.current
    const container = containerRef.current
    if (!container) return { x: 0, y: 0 }
    const rect = container.getBoundingClientRect()
    return {
      x: (sx - rect.left - cam.x) / cam.zoom,
      y: (sy - rect.top - cam.y) / cam.zoom,
    }
  }, [])

  const findNodeAt = useCallback((wx: number, wy: number) => {
    const g = graphRef.current
    for (let i = g.nodes.length - 1; i >= 0; i--) {
      const n = g.nodes[i]
      const hitR = (n.radius + 10) / cameraRef.current.zoom
      if (Math.hypot(n.x - wx, n.y - wy) < hitR) return i
    }
    return -1
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const world = screenToWorld(e.clientX, e.clientY)
    const idx = findNodeAt(world.x, world.y)
    dragRef.current = {
      type: idx >= 0 ? 'node' : 'pan',
      startX: e.clientX,
      startY: e.clientY,
      nodeIdx: idx,
      pointerDownTime: Date.now(),
      pointerDownPos: { x: e.clientX, y: e.clientY },
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [screenToWorld, findNodeAt])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const world = screenToWorld(e.clientX, e.clientY)
    const g = graphRef.current
    const drag = dragRef.current

    if (drag.type === 'node' && drag.nodeIdx >= 0) {
      const dx = (e.clientX - drag.startX) / cameraRef.current.zoom
      const dy = (e.clientY - drag.startY) / cameraRef.current.zoom
      g.nodes[drag.nodeIdx].x += dx
      g.nodes[drag.nodeIdx].y += dy
      drag.startX = e.clientX
      drag.startY = e.clientY
    } else if (drag.type === 'pan') {
      cameraRef.current.x += e.clientX - drag.startX
      cameraRef.current.y += e.clientY - drag.startY
      drag.startX = e.clientX
      drag.startY = e.clientY
    } else {
      const idx = findNodeAt(world.x, world.y)
      hoveredIdxRef.current = idx
      const canvas = canvasRef.current
      if (canvas) canvas.style.cursor = idx >= 0 ? 'pointer' : 'default'
    }
  }, [screenToWorld, findNodeAt])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    const drag = dragRef.current
    const dist = Math.hypot(e.clientX - drag.pointerDownPos.x, e.clientY - drag.pointerDownPos.y)
    const isClick = dist < 5 && (Date.now() - drag.pointerDownTime) < 300

    if (isClick && drag.nodeIdx >= 0) {
      const node = graphRef.current.nodes[drag.nodeIdx]
      selectedIdxRef.current = drag.nodeIdx
      setSelectedNode(node)
      onToast(`Selected: ${node.title}`)
    } else if (isClick && drag.nodeIdx < 0) {
      selectedIdxRef.current = -1
      setSelectedNode(null)
    }

    dragRef.current = { type: null, startX: 0, startY: 0, nodeIdx: -1, pointerDownTime: 0, pointerDownPos: { x: 0, y: 0 } }
    const canvas = canvasRef.current
    if (canvas) canvas.style.cursor = 'default'
  }, [onToast])

  const handleZoomIn = useCallback(() => {
    cameraRef.current.zoom = Math.min(cameraRef.current.zoom * 1.3, 4)
    setZoom(cameraRef.current.zoom)
  }, [])

  const handleZoomOut = useCallback(() => {
    cameraRef.current.zoom = Math.max(cameraRef.current.zoom / 1.3, 0.2)
    setZoom(cameraRef.current.zoom)
  }, [])

  const handleZoomReset = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    cameraRef.current = { x: rect.width / 2, y: rect.height / 2, zoom: 1 }
    setZoom(1)
    selectedIdxRef.current = -1
    setSelectedNode(null)
    onToast('Zoom reset')
  }, [onToast])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.9 : 1.1
    cameraRef.current.zoom = Math.max(0.2, Math.min(4, cameraRef.current.zoom * factor))
    setZoom(cameraRef.current.zoom)
  }, [])

  const connectedNodes = selectedNode
    ? graphRef.current.edges
        .filter(e => e.sourceId === selectedNode.id || e.targetId === selectedNode.id)
        .map(e => {
          const otherId = e.sourceId === selectedNode.id ? e.targetId : e.sourceId
          return graphRef.current.nodes.find(n => n.id === otherId)
        })
        .filter(Boolean) as CanvasNode[]
    : []

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* Mind Filters */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto">
        <div className="relative">
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className="glass rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-white transition-colors"
          >
            <Filter size={14} />
            Filters
          </button>
          {filtersOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 glass rounded-xl p-3 shadow-2xl z-30">
              <div className="flex items-center gap-2 mb-3">
                <Search size={12} className="text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={filterSearch}
                  onChange={e => { setFilterSearch(e.target.value); onToast('Filter updated') }}
                  placeholder="Search nodes..."
                  className="flex-1 bg-transparent text-xs text-white outline-none placeholder-[var(--text-muted)]"
                />
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/5 text-xs text-[var(--text-muted)]">
                  <Tag size={12} />
                  <span>Tags placeholder</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={showDocuments} onChange={e => setShowDocuments(e.target.checked)} className="accent-[var(--accent)]" />
                  Show Documents
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={showTags} onChange={e => setShowTags(e.target.checked)} className="accent-[var(--accent)]" />
                  Show Tags
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={showSources} onChange={e => setShowSources(e.target.checked)} className="accent-[var(--accent)]" />
                  Show Sources
                </label>
              </div>
              <div className="mt-3 pt-2 border-t border-[var(--border-line)] text-[10px] text-[var(--text-muted)]">
                Visible: {visibleCount} / {storedNodes.length}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mind HUD */}
      <div className="absolute bottom-16 right-4 z-20 pointer-events-auto">
        <div className="glass rounded-2xl overflow-hidden w-56">
          <button
            onClick={() => setHudCollapsed(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-colors"
          >
            <span>Atlas Status</span>
            {hudCollapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {!hudCollapsed && (
            <div className="px-4 pb-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[var(--text-muted)]">Nodes</span>
                <span className="text-[15px] font-mono text-white">{storedNodes.length}</span>
              </div>
              <div className="h-px bg-[var(--border-line)]" />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[var(--text-muted)]">Edges</span>
                <span className="text-[15px] font-mono text-white">{storedEdges.length}</span>
              </div>
              <div className="h-px bg-[var(--border-line)]" />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[var(--text-muted)]">Layout</span>
                <select
                  value={layoutMode}
                  onChange={e => { setLayoutMode(e.target.value as LayoutMode); onToast(`Layout: ${e.target.value}`) }}
                  className="bg-white/5 border border-[var(--border-line)] rounded text-[11px] text-white px-1 py-0.5 outline-none"
                >
                  <option value="radial">Radial</option>
                  <option value="force">Force</option>
                  <option value="orbit">Orbit</option>
                </select>
              </div>
              <div className="h-px bg-[var(--border-line)]" />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[var(--text-muted)]">Zoom</span>
                <span className="text-[13px] font-mono text-white">{Math.round(zoom * 100)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-16 left-4 z-20 pointer-events-auto flex flex-col gap-1">
        <button onClick={handleZoomIn} className="glass rounded-xl w-9 h-9 flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors" title="Zoom In">
          <ZoomIn size={16} />
        </button>
        <button onClick={handleZoomOut} className="glass rounded-xl w-9 h-9 flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors" title="Zoom Out">
          <ZoomOut size={16} />
        </button>
        <button onClick={handleZoomReset} className="glass rounded-xl w-9 h-9 flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors" title="Reset View">
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Node Detail Panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 z-30 pointer-events-auto w-72 glass rounded-2xl shadow-2xl overflow-hidden mt-12">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-line)]">
            <div className="flex items-center gap-2">
              {selectedNode.type === 'project' ? <FolderTree size={14} style={{ color: selectedNode.color }} /> :
               selectedNode.type === 'document' ? <FileText size={14} style={{ color: selectedNode.color }} /> :
               <Network size={14} style={{ color: selectedNode.color }} />}
              <span className="text-xs font-medium" style={{ color: selectedNode.color }}>
                {selectedNode.type === 'project' ? 'Domain / Project' :
                 selectedNode.type === 'document' ? 'Document' :
                 selectedNode.type === 'tag' ? 'Tag' : 'Source'}
              </span>
            </div>
            <button onClick={() => { setSelectedNode(null); selectedIdxRef.current = -1 }} className="p-1 text-[var(--text-muted)] hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-medium text-white">{selectedNode.title}</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {selectedNode.type === 'project' ? 'A project domain in the knowledge graph.' :
               selectedNode.type === 'document' ? 'A document node with content.' :
               'A source capture node.'}
            </p>
            {connectedNodes.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-2">Connected</div>
                <div className="space-y-1">
                  {connectedNodes.slice(0, 5).map(cn => (
                    <div key={cn.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 border border-[var(--border-line)]">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cn.color }} />
                      <span className="text-xs text-slate-300 truncate">{cn.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => {
                if (selectedNode.documentId) {
                  onOpenEditor(selectedNode.documentId)
                } else {
                  onToast('Open in Editor unavailable')
                }
              }}
              disabled={!selectedNode.documentId}
              className="w-full py-2 bg-emerald-500/15 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ExternalLink size={12} />
              Open in Editor
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
