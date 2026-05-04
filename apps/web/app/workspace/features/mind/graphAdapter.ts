import type { StoredMindNode, StoredMindEdge } from '@/lib/repository'
import type { MindEdgeType } from '@atlax/domain'

export type CanvasEdgeType = 'tree' | 'net'
export type RepositoryEdgeType = MindEdgeType

export interface MindGraphNode {
  id: string
  nodeType: string
  label: string
  documentId: number | null
  positionX: number | null
  positionY: number | null
  metadata?: Record<string, unknown> | null
}

export interface MindGraphEdge {
  id: string
  sourceNodeId: string
  targetNodeId: string
  edgeType: CanvasEdgeType
}

export interface MindGraphViewModel {
  nodes: MindGraphNode[]
  edges: MindGraphEdge[]
  rootNodeId: string | null
  domainNodes: MindGraphNode[]
}

export function toMindGraphViewModel(
  storedNodes: StoredMindNode[],
  storedEdges: StoredMindEdge[],
): MindGraphViewModel {
  const nodes: MindGraphNode[] = storedNodes.map(n => ({
    id: n.id,
    nodeType: n.nodeType as MindGraphNode['nodeType'],
    label: n.label,
    documentId: n.documentId,
    positionX: n.positionX,
    positionY: n.positionY,
    metadata: n.metadata,
  }))

  const edges: MindGraphEdge[] = storedEdges.map(e => ({
    id: e.id,
    sourceNodeId: e.sourceNodeId,
    targetNodeId: e.targetNodeId,
    edgeType: fromRepositoryEdgeType(e.edgeType),
  }))

  const rootNode = nodes.find(n => n.nodeType === 'root')
  const domainNodes = nodes.filter(n => n.nodeType === 'domain' || n.nodeType === 'project' || n.nodeType === 'topic')

  return { nodes, edges, rootNodeId: rootNode?.id ?? null, domainNodes }
}

export function isStructuralEdge(edgeType: string): boolean {
  return edgeType === 'parent_child' || edgeType === 'tree' || edgeType === 'structural'
}

export function toRepositoryEdgeType(canvasEdgeType: CanvasEdgeType): RepositoryEdgeType {
  return canvasEdgeType === 'tree' ? 'parent_child' : 'semantic'
}

export function fromRepositoryEdgeType(repoEdgeType: string): CanvasEdgeType {
  return isStructuralEdge(repoEdgeType) ? 'tree' : 'net'
}

export interface FilterState {
  showDocuments: boolean
  showTags: boolean
  showOrphans: boolean
  showStructuralLinks: boolean
  showNetworkLinks: boolean
  filterSearch: string
  filterTags: string
  selectedDomainId: string
}

// TODO: Future BFF API shape (for backend reference):
// GET /api/mind/graph?userId={uid}
// Response: { nodes: MindGraphNode[], edges: MindGraphEdge[], rootNodeId: string }
//
// POST /api/mind/edge
// Body: { sourceNodeId, targetNodeId, edgeType: 'semantic' | 'confirmed' }
//
// DELETE /api/mind/edge/{edgeId}
