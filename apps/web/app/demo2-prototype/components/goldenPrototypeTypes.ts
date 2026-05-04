import type { ReactNode } from 'react'

export type GoldenViewId = 'home' | 'mind' | 'dock' | 'editor'

export type GoldenLayoutMode = 'radial' | 'force' | 'orbit'

export interface GoldenNavItem {
  id: GoldenViewId
  label: string
  icon: 'home' | 'network' | 'library' | 'pen-tool'
}

export interface GoldenSearchSuggestion {
  id: string
  label: string
  icon: 'file-text' | 'network' | 'history'
  tone: 'document' | 'accent' | 'muted'
  section?: string
}

export interface GoldenNodeConnection {
  id: string
  label: string
  type: 'Document' | 'Tag' | 'Domain'
}

export interface GoldenNodeDetail {
  title: string
  type: 'Document' | 'Tag' | 'Domain'
  connections: GoldenNodeConnection[]
}

export interface PrototypeShellProps {
  children: ReactNode
  topNav?: ReactNode
  activeView?: GoldenViewId
}

export const GOLDEN_NAV_ITEMS: GoldenNavItem[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'mind', label: 'Mind', icon: 'network' },
  { id: 'dock', label: 'Dock', icon: 'library' },
  { id: 'editor', label: 'Editor', icon: 'pen-tool' },
]

export const GOLDEN_SEARCH_SUGGESTIONS: GoldenSearchSuggestion[] = [
  { id: 'graph-engine', label: 'Graph Engine Physics', icon: 'file-text', tone: 'document', section: 'SUGGESTED FROM GRAPH' },
  { id: 'world-tree', label: 'World Tree Architecture', icon: 'network', tone: 'accent' },
  { id: 'recent-context', label: 'Search "Context Nudge"', icon: 'history', tone: 'muted', section: 'RECENT ACTIONS' },
]

export const GOLDEN_NODE_DETAIL_MOCK: GoldenNodeDetail = {
  title: 'Graph Engine Physics',
  type: 'Document',
  connections: [
    { id: 'world-tree', label: 'World Tree Architecture', type: 'Domain' },
    { id: 'algorithm-design', label: 'Algorithm Design', type: 'Document' },
    { id: 'physics', label: '#physics', type: 'Tag' },
  ],
}

export const GOLDEN_ATLAS_STATS = {
  worldTree: 'Root',
  activeDomains: 8,
  documents: 64,
}
