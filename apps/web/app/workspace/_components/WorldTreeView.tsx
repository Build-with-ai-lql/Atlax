import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  FileText, FolderTree, Hexagon, Maximize2,
  ZoomIn, ZoomOut, Info, Moon, Sun, Combine,
  Layers, Disc, ChevronRight, X, Network
} from 'lucide-react';
import { StructureProjection, StoredEntry } from '@/lib/repository';

// --- Types ---
interface NodeData {
  id: string;
  type: 'root' | 'trunk' | 'branch' | 'leaf' | 'star' | 'cluster';
  label: string;
  title?: string;
  desc?: string;
  x: number;
  y: number;
  parent: string | null;
  leafCount?: number;
  entryId?: number;
  collectionId?: string;
  tagId?: string;
  targetBranchId?: string;
}

interface EdgeData {
  source: string;
  target: string;
  type: 'root_edge' | 'trunk_edge' | 'branch_edge' | 'spiral_edge' | 'relation_edge';
}

interface WorldTreeViewProps {
  structureData: StructureProjection | null;
  entries: StoredEntry[];
  onOpenGlobalDetail?: (id: number) => void;
}

// --- Constants ---
const REALM_ORBIT_RADIUS = 1200;
const BRANCH_ORBIT_RADIUS = 400;

// --- Helper: World Tree Data Generator ---
const generateWorldTreeFromRealData = (structureData: StructureProjection | null, entries: StoredEntry[]) => {
  const nodes: NodeData[] = [];
  const edges: EdgeData[] = [];

  if (!structureData) return { nodes, edges };

  const { collections, entries: structEntries, tags } = structureData;
  const entriesMap = new Map(entries.map(e => [e.id, e]));

  // 1. Root
  nodes.push({
    id: 'root',
    type: 'root',
    label: 'Workspace Core',
    title: 'Your Knowledge Universe',
    x: 0,
    y: 0,
    parent: null
  });

  // 2. Realms (Projects and Top-level Collections)
  const topCollections = collections.filter(c => !c.parentId);

  // Also identify top tags (frequency based)
  const topTags = [...tags].sort((a, b) => b.entryCount - a.entryCount).slice(0, 3);

  const realms: NodeData[] = [];
  topCollections.forEach(c => {
    realms.push({
      id: `realm_col_${c.collectionId}`,
      label: c.name,
      type: 'trunk',
      collectionId: c.collectionId,
      x: 0,
      y: 0,
      parent: 'root'
    });
  });

  // If we have tags that are not represented well in collections, add them as realms
  topTags.forEach(t => {
    if (!realms.find(r => r.label === t.name)) {
      realms.push({
        id: `realm_tag_${t.tagId}`,
        label: t.name,
        type: 'trunk',
        tagId: t.tagId,
        x: 0,
        y: 0,
        parent: 'root'
      });
    }
  });

  // Add "General" realm for orphans
  if (structureData.orphans.length > 0) {
    realms.push({
      id: 'realm_general',
      label: 'Floating Ideas',
      type: 'trunk',
      x: 0,
      y: 0,
      parent: 'root'
    });
  }

  const numRealms = realms.length;
  realms.forEach((realm, rIndex) => {
    const angle = (rIndex / numRealms) * Math.PI * 2;
    const rx = Math.cos(angle) * REALM_ORBIT_RADIUS;
    const ry = Math.sin(angle) * REALM_ORBIT_RADIUS;

    const realmNode: NodeData = {
      ...realm,
      x: rx,
      y: ry,
      parent: 'root',
      desc: realm.label + ' Knowledge Domain'
    };
    nodes.push(realmNode);
    edges.push({ source: 'root', target: realmNode.id, type: 'root_edge' });

    // 3. Branches (Sub-collections or groupings)
    let groupEntries: typeof structEntries = [];
    if (realm.collectionId) {
      groupEntries = structEntries.filter(e => e.primaryCollectionId === realm.collectionId);
      // Add sub-collections as branches
      const childCols = collections.filter(c => c.parentId === realm.collectionId);
      childCols.forEach((cc, bIndex) => {
        const bAngle = angle - Math.PI/4 + (bIndex / Math.max(1, childCols.length - 1)) * (Math.PI/2);
        const bx = rx + Math.cos(bAngle) * BRANCH_ORBIT_RADIUS;
        const by = ry + Math.sin(bAngle) * BRANCH_ORBIT_RADIUS;

        const bId = `branch_col_${cc.collectionId}`;
        const ccEntries = structEntries.filter(e => e.primaryCollectionId === cc.collectionId);

        nodes.push({
          id: bId,
          type: 'branch',
          label: cc.name,
          x: bx,
          y: by,
          parent: realmNode.id,
          leafCount: ccEntries.length,
          collectionId: cc.collectionId
        });
        edges.push({ source: realmNode.id, target: bId, type: 'trunk_edge' });

        // Add leaves for this branch
        addLeaves(bId, ccEntries, bx, by, bAngle, nodes, edges, entriesMap);
      });
    } else if (realm.tagId) {
      // Tags realm
      groupEntries = structEntries.filter(e => e.tags.includes(realm.label));
    } else if (realm.id === 'realm_general') {
      groupEntries = structEntries.filter(e => structureData.orphans.includes(e.entryId));
    }

    // Add leaves directly under realm if any
    if (groupEntries.length > 0) {
      // Create a "Main Cluster" branch if there are many entries
      const bId = `branch_main_${realmNode.id}`;
      nodes.push({
        id: bId,
        type: 'branch',
        label: 'Main Cluster',
        x: rx * 1.1,
        y: ry * 1.1,
        parent: realmNode.id,
        leafCount: groupEntries.length
      });
      edges.push({ source: realmNode.id, target: bId, type: 'trunk_edge' });
      addLeaves(bId, groupEntries, rx * 1.1, ry * 1.1, angle, nodes, edges, entriesMap);
    }
  });

  return { nodes, edges };
};

const addLeaves = (parentId: string, groupEntries: StructureProjection['entries'], px: number, py: number, pAngle: number, nodes: NodeData[], edges: EdgeData[], entriesMap: Map<number, StoredEntry>) => {
  const leafCount = groupEntries.length;
  groupEntries.forEach((e, j) => {
    const entry = entriesMap.get(e.entryId);
    const lId = `leaf_${e.entryId}`;
    let lx, ly;

    if (leafCount > 15) {
      const c = 32;
      const goldenAngle = 137.5 * (Math.PI / 180);
      const r = c * Math.sqrt(j + 1);
      const theta = j * goldenAngle;
      lx = px + Math.cos(theta) * r;
      ly = py + Math.sin(theta) * r;
    } else {
      const lAngle = pAngle - Math.PI/3 + (j / Math.max(1, leafCount - 1)) * (Math.PI*2/3);
      const lDist = 120 + Math.random() * 40;
      lx = px + Math.cos(lAngle) * lDist;
      ly = py + Math.sin(lAngle) * lDist;
    }

    nodes.push({
      id: lId,
      type: 'leaf',
      label: entry?.title || e.title,
      desc: entry?.content?.substring(0, 200),
      x: lx,
      y: ly,
      parent: parentId,
      entryId: e.entryId
    });
    edges.push({ source: parentId, target: lId, type: leafCount > 15 ? 'spiral_edge' : 'branch_edge' });
  });
};

// --- Main Component ---
export default function WorldTreeView({ structureData, entries, onOpenGlobalDetail }: WorldTreeViewProps) {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [collapsedBranches, setCollapsedBranches] = useState<Set<string>>(new Set());
  const [isDark, setIsDark] = useState(true);

  const viewportRef = useRef({ x: 0, y: 0, zoom: 0.15 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const [lodLevel, setLodLevel] = useState(0); // 0: Macro, 1: Mid, 2: Micro
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [inspectorNode, setInspectorNode] = useState<NodeData | null>(null);
  const [screenSize, setScreenSize] = useState({ w: 1200, h: 800 });

  // --- High Performance Transform ---
  const applyTransforms = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.style.transform = `translate(${viewportRef.current.x}px, ${viewportRef.current.y}px) scale(${viewportRef.current.zoom})`;
    }
    if (bgRef.current) {
      bgRef.current.style.transform = `translate(${viewportRef.current.x * 0.02}px, ${viewportRef.current.y * 0.02}px)`;
    }

    const zoom = viewportRef.current.zoom;
    const newLod = zoom < 0.25 ? 0 : (zoom < 0.6 ? 1 : 2);
    setLodLevel(prev => {
      if (prev !== newLod) return newLod;
      return prev;
    });
  }, []);

  // --- Initial Setup ---
  useEffect(() => {
    const { nodes: n, edges: e } = generateWorldTreeFromRealData(structureData, entries);
    setNodes(n);
    setEdges(e);

    // Default: Collapse all branches
    const allBranchIds = n.filter(node => node.type === 'branch').map(node => node.id);
    setCollapsedBranches(new Set(allBranchIds));

    const updateSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setScreenSize({ w, h });
      // Center the view on root
      viewportRef.current = { x: w / 2, y: h / 2, zoom: 0.15 };
      applyTransforms();
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [structureData, entries, applyTransforms]);

  const activeChain = useMemo(() => {
    const chain = new Set<string>();
    if (!focusedNodeId) return chain;
    let curr: string | null = focusedNodeId;
    while (curr) {
      chain.add(curr);
      const node = nodes.find(n => n.id === curr);
      curr = node?.parent || null;
    }
    return chain;
  }, [focusedNodeId, nodes]);

  // --- LOD Visibility ---
  const { visibleNodes, visibleEdges } = useMemo(() => {
    const vNodes: NodeData[] = [];
    const vEdges: EdgeData[] = [];

    nodes.forEach(node => {
      if (node.type === 'leaf' && collapsedBranches.has(node.parent || '')) return;
      vNodes.push(node);

      if (node.type === 'branch' && collapsedBranches.has(node.id)) {
        vNodes.push({
          id: `cluster_${node.id}`,
          type: 'cluster',
          label: `${node.leafCount || 0}`,
          x: node.x,
          y: node.y - 40,
          parent: node.id,
          targetBranchId: node.id
        });
      }
    });

    edges.forEach(edge => {
      if (vNodes.find(n => n.id === edge.source) && vNodes.find(n => n.id === edge.target)) {
        vEdges.push(edge);
      }
    });

    return { visibleNodes: vNodes, visibleEdges: vEdges };
  }, [nodes, edges, collapsedBranches]);

  // --- Handlers ---
  const collapseAllBranches = () => {
    const allBranchIds = nodes.filter(n => n.type === 'branch').map(n => n.id);
    setCollapsedBranches(new Set(allBranchIds));
    setFocusedNodeId(null);
    setInspectorNode(null);
  };

  const expandExclusiveBranch = (branchId: string) => {
    const allBranchIds = nodes.filter(n => n.type === 'branch').map(n => n.id);
    const nextCollapsed = new Set(allBranchIds);
    nextCollapsed.delete(branchId);

    setCollapsedBranches(nextCollapsed);
    setFocusedNodeId(branchId);
    const node = nodes.find(n => n.id === branchId);
    if (node) setInspectorNode(node);

    // Zoom focus
    const targetNode = nodes.find(n => n.id === branchId);
    if (targetNode) {
      viewportRef.current.x = screenSize.w / 2 - targetNode.x * 0.8;
      viewportRef.current.y = screenSize.h / 2 - targetNode.y * 0.8;
      viewportRef.current.zoom = 0.8;
      applyTransforms();
    }
  };

  const handlePointerDown = (e: React.PointerEvent, node: NodeData) => {
    e.stopPropagation();
    if (node.type === 'root') {
      collapseAllBranches();
      viewportRef.current.x = screenSize.w / 2;
      viewportRef.current.y = screenSize.h / 2;
      viewportRef.current.zoom = 0.15;
      applyTransforms();
      return;
    }

    if (node.type === 'cluster' && node.targetBranchId) {
      expandExclusiveBranch(node.targetBranchId);
      return;
    }

    setInspectorNode(node);
    setFocusedNodeId(node.id);

    // Focus Realm on click
    if (node.type === 'trunk') {
       viewportRef.current.x = screenSize.w / 2 - node.x * 0.4;
       viewportRef.current.y = screenSize.h / 2 - node.y * 0.4;
       viewportRef.current.zoom = 0.4;
       applyTransforms();
    }
  };

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (inspectorNode) setInspectorNode(null);
    setFocusedNodeId(null);
    isPanningRef.current = true;
    dragStartRef.current = { x: e.clientX - viewportRef.current.x, y: e.clientY - viewportRef.current.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanningRef.current) {
      viewportRef.current.x = e.clientX - dragStartRef.current.x;
      viewportRef.current.y = e.clientY - dragStartRef.current.y;
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          applyTransforms();
          rafRef.current = null;
        });
      }
    }
  };

  const handlePointerUp = () => {
    isPanningRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomDelta = e.deltaY > 0 ? 0.85 : 1.15;
    const prevZoom = viewportRef.current.zoom;
    const newZoom = Math.min(Math.max(prevZoom * zoomDelta, 0.05), 3);

    const worldX = (e.clientX - viewportRef.current.x) / prevZoom;
    const worldY = (e.clientY - viewportRef.current.y) / prevZoom;

    viewportRef.current.x = e.clientX - worldX * newZoom;
    viewportRef.current.y = e.clientY - worldY * newZoom;
    viewportRef.current.zoom = newZoom;

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        applyTransforms();
        rafRef.current = null;
      });
    }
  };

  const handleZoomBtn = (factor: number, absolute = false) => {
    if (absolute) {
      viewportRef.current.zoom = factor;
      viewportRef.current.x = screenSize.w/2;
      viewportRef.current.y = screenSize.h/2;
    } else {
      viewportRef.current.zoom = Math.min(Math.max(viewportRef.current.zoom * factor, 0.05), 3);
    }
    applyTransforms();
  };

  const generatePath = (source: NodeData, target: NodeData, edgeType: string) => {
    if (edgeType === 'spiral_edge') return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const tension = 0.5;
    const ctrl1 = { x: source.x + dx * tension, y: source.y };
    const ctrl2 = { x: target.x, y: target.y - dy * tension };
    return `M ${source.x} ${source.y} C ${ctrl1.x} ${ctrl1.y}, ${ctrl2.x} ${ctrl2.y}, ${target.x} ${target.y}`;
  };

  const theme = {
    textPrimary: isDark ? 'text-slate-200' : 'text-slate-800',
    textSecondary: isDark ? 'text-slate-400' : 'text-slate-500',
    panelBg: isDark ? 'bg-[#12121A]/80' : 'bg-white/90',
    panelBorder: isDark ? 'border-slate-800/80' : 'border-indigo-100',
    nodeBase: isDark ? 'bg-[#1E1E2A]/90 border-slate-700/50' : 'bg-white border-indigo-200 shadow-md',
    nodeHover: isDark ? 'hover:bg-[#2A2A3A]' : 'hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-lg',
    nodeActive: isDark ? 'bg-indigo-600/40 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'bg-indigo-100 border-indigo-500 shadow-[0_4px_20px_rgba(99,102,241,0.4)]',
    edgeTrunk: isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.6)',
    edgeBranch: isDark ? 'rgba(165, 180, 252, 0.2)' : 'rgba(99, 102, 241, 0.4)',
    edgeSpiral: isDark ? 'rgba(165, 180, 252, 0.05)' : 'rgba(99, 102, 241, 0.1)',
    particleColor: isDark ? '#ffffff' : '#f59e0b'
  };

  return (
    <div
      className={`relative w-full h-[640px] overflow-hidden font-sans select-none transition-colors duration-[1000ms] rounded-2xl border border-slate-200 dark:border-white/10 ${theme.textPrimary}`}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      style={{ backgroundColor: isDark ? '#05050A' : '#f8fafc' }}
    >
      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 transition-opacity duration-[1000ms] ease-in-out"
          style={{ opacity: isDark ? 1 : 0, backgroundImage: 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #05050A 80%)' }} />
        <div className="absolute inset-0 transition-opacity duration-[1000ms] ease-in-out"
          style={{ opacity: isDark ? 0 : 1, backgroundImage: 'radial-gradient(circle at 50% 50%, #fef08a 0%, #e0f2fe 50%, #f8fafc 100%)' }} />
      </div>

      <div ref={bgRef} className="absolute inset-0 opacity-40 pointer-events-none z-0 origin-center will-change-transform">
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} className="absolute rounded-full transition-colors duration-[1000ms]"
            style={{
              backgroundColor: theme.particleColor, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 1}px`, height: `${Math.random() * 4 + 1}px`, opacity: Math.random() * 0.4 + 0.1,
            }}
          />
        ))}
      </div>

      {/* Main Canvas Area */}
      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-10"
        onPointerDown={handleCanvasPointerDown}
      >
        <div
          ref={canvasRef}
          className="absolute origin-top-left will-change-transform"
        >
          {/* Edges Layer */}
          <svg className="absolute overflow-visible pointer-events-none z-0">
            {visibleEdges.map((edge, i) => {
              if (lodLevel === 0 && edge.type !== 'root_edge' && edge.type !== 'trunk_edge') return null;

              const source = visibleNodes.find(n => n.id === edge.source);
              const target = visibleNodes.find(n => n.id === edge.target);
              if (!source || !target) return null;

              const isEdgeActive = focusedNodeId ? (activeChain.has(edge.source) && activeChain.has(edge.target)) : true;

              const strokeColor = edge.type === 'spiral_edge' ? theme.edgeSpiral : (edge.type === 'branch_edge' ? theme.edgeBranch : theme.edgeTrunk);
              const strokeWidth = edge.type === 'root_edge' ? 12 : (edge.type === 'trunk_edge' ? 6 : (edge.type === 'spiral_edge' ? 1 : 2));

              return (
                <path
                  key={i} d={generatePath(source, target, edge.type)} fill="none"
                  stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round"
                  style={{ opacity: isEdgeActive ? 1 : 0.05, transition: 'opacity 0.3s ease' }}
                />
              );
            })}
          </svg>

          {/* Nodes Layer */}
          <div className="absolute z-10">
            {visibleNodes.map(node => {
              const isSelected = inspectorNode?.id === node.id;
              const isNodeActive = focusedNodeId ? activeChain.has(node.id) : true;
              const shouldDim = !isNodeActive && node.id !== 'root';

              const opacity = shouldDim ? 0.15 : 1;
              const nodeStyle = {
                left: node.x, top: node.y,
                opacity: opacity,
                transition: 'opacity 0.3s ease',
              };

              // Micro Entry Points
              if (node.type === 'leaf' && lodLevel < 2) {
                return (
                  <div key={node.id} onPointerDown={(e) => handlePointerDown(e, node)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10" style={nodeStyle}
                  >
                    <div className={`w-3 h-3 rounded-full shadow-sm ${isSelected ? 'bg-blue-400 scale-150' : (isDark ? 'bg-indigo-700/60' : 'bg-indigo-300')}`} />
                  </div>
                );
              }

              return (
                <div
                  key={node.id} onPointerDown={(e) => handlePointerDown(e, node)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center cursor-pointer z-10"
                  style={nodeStyle}
                >
                  {node.type === 'root' && (
                    <div className={`relative group transition-transform duration-300 ${!isNodeActive ? 'scale-90' : 'hover:scale-105'}`}>
                      <div className={`absolute inset-0 rounded-full blur-[50px] transition-opacity duration-1000 ${isDark ? 'bg-indigo-600 opacity-60' : 'bg-orange-400 opacity-40'}`} />
                      <div className={`relative w-40 h-40 rounded-full backdrop-blur-xl flex items-center justify-center shadow-2xl transition-colors duration-1000
                        ${isDark ? 'bg-gradient-to-b from-indigo-500/20 to-indigo-900/80 border-2 border-indigo-400/40' : 'bg-gradient-to-b from-white to-orange-50 border-2 border-orange-300'}
                      `}>
                        <Disc className={`w-16 h-16 animate-[spin_20s_linear_infinite] ${isDark ? 'text-indigo-300' : 'text-orange-500'}`} />
                        <Combine className={`absolute w-10 h-10 ${isDark ? 'text-white' : 'text-orange-600'}`} />
                      </div>
                      {lodLevel > 0 && (
                        <div className="absolute top-full mt-6 text-center w-64 -ml-12 pointer-events-none">
                          <div className={`text-2xl font-bold tracking-[0.2em] uppercase drop-shadow-md ${isDark ? 'text-indigo-100' : 'text-orange-900'}`}>{node.label}</div>
                          <div className={`text-sm mt-1 tracking-widest ${isDark ? 'text-indigo-400/80' : 'text-orange-700/80'}`}>Cosmic Knowledge Tree</div>
                        </div>
                      )}
                    </div>
                  )}

                  {node.type === 'trunk' && (
                    <div className={`relative group transition-transform duration-300 hover:scale-110`}>
                      <div className={`backdrop-blur-md flex items-center justify-center border-2 transition-all duration-300 w-24 h-24 rounded-full ${isSelected ? theme.nodeActive : theme.nodeBase} ${theme.nodeHover}`}>
                        <Hexagon className={`w-10 h-10 ${isSelected ? (isDark?'text-indigo-200':'text-indigo-600') : theme.textSecondary}`} />
                      </div>
                      {lodLevel > 0 && (
                        <div className="absolute top-full mt-4 text-center w-48 -ml-12 pointer-events-none">
                          <div className={`text-xl font-bold tracking-widest uppercase drop-shadow-md ${theme.textPrimary}`}>{node.label}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {node.type === 'branch' && (
                    <div className={`relative group transition-transform duration-300 hover:scale-110`}>
                      <div className={`backdrop-blur-md flex items-center justify-center border-2 transition-all duration-300 w-16 h-16 rounded-2xl ${isSelected ? theme.nodeActive : theme.nodeBase} ${theme.nodeHover}`}>
                        <FolderTree className={`w-7 h-7 ${isSelected ? (isDark?'text-indigo-200':'text-indigo-600') : theme.textSecondary}`} />
                      </div>
                      {lodLevel === 2 && (
                        <div className="absolute top-full mt-3 text-center w-40 -ml-12 pointer-events-none">
                          <div className={`font-bold tracking-wide drop-shadow-md text-base ${theme.textPrimary}`}>{node.label}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {node.type === 'cluster' && (
                    <div className={`relative group transition-transform duration-300 hover:scale-110`}>
                      <div className={`absolute inset-0 rounded-full blur-xl opacity-60 ${isDark?'bg-indigo-500':'bg-orange-300'}`} />
                      <div className={`relative px-5 py-3 rounded-full flex items-center justify-center gap-2 border-2 shadow-lg transition-all
                        ${isDark ? 'bg-indigo-900 border-indigo-400 text-indigo-100 hover:bg-indigo-800' : 'bg-white border-orange-400 text-orange-700 hover:bg-orange-50'}
                      `}>
                        <Layers className="w-5 h-5" />
                        <span className="text-lg font-bold tracking-wider">{node.label}</span>
                      </div>
                    </div>
                  )}

                  {node.type === 'leaf' && lodLevel === 2 && (
                    <div className={`relative group transition-transform duration-300 hover:scale-110`}>
                      <div className={`px-4 py-2 rounded-full flex items-center gap-2 border shadow-sm transition-all
                        ${isSelected ? theme.nodeActive : theme.nodeBase} ${theme.nodeHover}
                      `}>
                        <FileText className={`w-3.5 h-3.5 ${isSelected ? (isDark?'text-indigo-200':'text-indigo-600') : theme.textSecondary}`} />
                        <span className={`text-xs font-bold whitespace-nowrap ${isSelected ? (isDark?'text-indigo-100':'text-indigo-900') : theme.textPrimary}`}>
                          {node.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* HUD: Controls */}
      <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 z-20 flex gap-4 p-2 rounded-[20px] backdrop-blur-2xl border-2 shadow-2xl transition-colors duration-[1000ms] ${theme.panelBg} ${theme.panelBorder}`}>
        <div className={`flex items-center px-5 border-r ${isDark?'border-slate-700/50':'border-slate-200'}`}>
          <Network className={`w-5 h-5 mr-3 ${isDark?'text-indigo-400':'text-orange-500'}`} />
          <span className={`text-sm font-bold tracking-[0.2em] uppercase ${theme.textPrimary}`}>WORLD TREE</span>
        </div>
        <div className={`flex items-center gap-1 pl-2 pr-3 border-r ${isDark?'border-slate-700/50':'border-slate-200'}`}>
          <button onClick={() => handleZoomBtn(1.3)} className={`p-3 rounded-xl transition-all ${theme.textSecondary} ${isDark?'hover:bg-slate-800':'hover:bg-slate-100'} hover:${theme.textPrimary}`}><ZoomIn className="w-5 h-5" /></button>
          <button onClick={() => { handleZoomBtn(0.15, true); setFocusedNodeId(null); }} className={`p-3 rounded-xl transition-all ${theme.textSecondary} ${isDark?'hover:bg-slate-800':'hover:bg-slate-100'} hover:${theme.textPrimary}`}><Maximize2 className="w-5 h-5" /></button>
          <button onClick={() => handleZoomBtn(0.7)} className={`p-3 rounded-xl transition-all ${theme.textSecondary} ${isDark?'hover:bg-slate-800':'hover:bg-slate-100'} hover:${theme.textPrimary}`}><ZoomOut className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-1 pr-2">
          <button onClick={() => setIsDark(!isDark)} className={`p-3 rounded-xl transition-all ${theme.textSecondary} ${isDark?'hover:bg-slate-800':'hover:bg-orange-50 hover:text-orange-500'} hover:${theme.textPrimary}`}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* HUD: Breadcrumb (Initial) */}
      <div className={`absolute top-6 left-6 z-20 px-4 py-2.5 rounded-2xl backdrop-blur-xl border-2 flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-all duration-500 ${theme.panelBg} ${theme.panelBorder}`}>
        <span className={theme.textSecondary}>Universe</span>
        {focusedNodeId && (
          <>
            <ChevronRight className="w-3 h-3 opacity-30" />
            <span className={theme.textPrimary}>{nodes.find(n => n.id === focusedNodeId)?.label || 'Node'}</span>
          </>
        )}
      </div>

      {/* Mini Map (Initial) */}
      <div className={`absolute bottom-6 right-6 w-32 h-32 rounded-2xl border-2 backdrop-blur-xl z-20 overflow-hidden ${theme.panelBg} ${theme.panelBorder}`}>
        <div className="relative w-full h-full p-2">
          {nodes.filter(n => n.type !== 'leaf').map(n => (
            <div
              key={n.id}
              className={`absolute w-1 h-1 rounded-full ${n.type === 'root' ? 'bg-orange-400' : 'bg-blue-400'}`}
              style={{
                left: `${(n.x / 4000 + 0.5) * 100}%`,
                top: `${(n.y / 4000 + 0.5) * 100}%`
              }}
            />
          ))}
          <div
            className="absolute border border-blue-500/50 bg-blue-500/10 pointer-events-none"
            style={{
              left: `${(-viewportRef.current.x / viewportRef.current.zoom / 4000 + 0.5) * 100}%`,
              top: `${(-viewportRef.current.y / viewportRef.current.zoom / 4000 + 0.5) * 100}%`,
              width: `${(screenSize.w / viewportRef.current.zoom / 4000) * 100}%`,
              height: `${(screenSize.h / viewportRef.current.zoom / 4000) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Inspector Panel */}
      <div className={`absolute right-6 top-24 bottom-6 w-[24rem] backdrop-blur-3xl border-2 rounded-[2rem] p-8 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-20 shadow-2xl flex flex-col
        ${theme.panelBg} ${theme.panelBorder} ${inspectorNode && inspectorNode.type !== 'cluster' ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'}
      `}>
        {inspectorNode && inspectorNode.type !== 'cluster' && (
          <>
            <div className="flex items-center justify-between mb-8">
               <div className={`p-4 rounded-2xl ${isDark?'bg-slate-800 text-slate-300':'bg-slate-100 text-slate-600'}`}>
                 {inspectorNode.type === 'trunk' ? <Hexagon className="w-6 h-6" /> : inspectorNode.type === 'branch' ? <FolderTree className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
               </div>
               <button onClick={() => setInspectorNode(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                 <X className="w-5 h-5 opacity-50" />
               </button>
            </div>

            <div className="mb-8">
              <div className={`text-xs font-bold uppercase tracking-[0.2em] mb-2 ${isDark?'text-indigo-400/80':'text-orange-500/80'}`}>
                {inspectorNode.type.toUpperCase()} CODEX
              </div>
              <div className={`text-2xl font-bold tracking-wide ${theme.textPrimary}`}>{inspectorNode.label}</div>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className={`rounded-3xl p-6 border-2 ${isDark?'bg-[#161622] border-slate-800/50':'bg-slate-50 border-slate-200'}`}>
                <div className={`text-xs mb-3 flex items-center gap-2 font-bold uppercase tracking-widest ${theme.textSecondary}`}>
                  <Info className="w-4 h-4" /> Description
                </div>
                <div className={`text-sm leading-relaxed ${theme.textPrimary}`}>
                  {inspectorNode.desc || 'No detailed records found for this node in the knowledge domain.'}
                </div>
              </div>

              {inspectorNode.type === 'leaf' && (
                <div className="pt-4">
                   <button
                    onClick={() => inspectorNode.entryId && onOpenGlobalDetail?.(inspectorNode.entryId)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-sm font-bold transition-all shadow-lg active:scale-[0.98]"
                   >
                     <Maximize2 size={16} />
                     Open Global Detail
                   </button>
                </div>
              )}
            </div>

            <div className={`mt-auto pt-6 border-t-2 flex gap-4 ${isDark?'border-slate-800':'border-slate-200'}`}>
               <span className="text-[10px] uppercase tracking-[0.3em] opacity-30">Atlax Phase 3A System</span>
            </div>
          </>
        )}
      </div>

      <div className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 text-[10px] font-bold tracking-[0.4em] uppercase transition-colors duration-1000 ${isDark ? 'text-slate-500/50' : 'text-slate-400'}`}>
        MindDock Landscape Engine
      </div>
    </div>
  );
}
