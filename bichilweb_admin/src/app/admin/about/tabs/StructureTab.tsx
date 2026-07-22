'use client'

import { useCallback, useState, useEffect, useRef, type ChangeEvent } from 'react'
import ReactFlow, {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  Node,
  Edge,
  NodeProps,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  NodeResizer,
  SelectionMode,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { axiosInstance } from '@/lib/axios'

interface OrgNode {
  id: string
  position: { x: number; y: number }
  data: { label: string; isRoot?: boolean; color?: string; text_align?: 'left' | 'center' | 'right'; font_size?: string }
  type?: string
  style?: { width?: number; height?: number }
}

interface OrgEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  type?: string
  markerEnd?: { type: string }
  style?: { stroke: string; strokeWidth: number }
}

interface OrgChartData {
  nodes: OrgNode[]
  edges: OrgEdge[]
}

/* ----------------------------------
   UTILITY FUNCTIONS
-----------------------------------*/
const download = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const serializeNodes = (source: Node[]): OrgNode[] =>
  source.map((node) => ({
    id: String(node.id),
    position: {
      x: Number(node.position?.x || 0),
      y: Number(node.position?.y || 0),
    },
    data: {
      ...(node.data as OrgNode['data']),
      preview: undefined,
    } as OrgNode['data'],
    type: node.type || 'org',
    style: node.style as OrgNode['style'],
  }))

const serializeEdges = (source: Edge[]): OrgEdge[] =>
  source.map((edge) => ({
    id: String(edge.id),
    source: String(edge.source),
    target: String(edge.target),
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: edge.type,
    markerEnd: edge.markerEnd as OrgEdge['markerEnd'],
    style: edge.style as OrgEdge['style'],
  }))

const normalizeImportedNodes = (rawNodes: any[]): Node[] =>
  rawNodes.map((node, index) => ({
    id: String(node?.id || crypto.randomUUID()),
    type: node?.type || 'org',
    position: {
      x: Number(node?.position?.x ?? node?.x ?? index * 180),
      y: Number(node?.position?.y ?? node?.y ?? 0),
    },
    data: {
      ...(node?.data || {}),
      label: String(node?.data?.label ?? node?.label ?? 'Шинэ нэгж'),
      preview: undefined,
    },
    style: node?.style && typeof node.style === 'object' ? { ...node.style } : undefined,
  }))

const normalizeImportedEdges = (rawEdges: any[]): Edge[] =>
  rawEdges.map((edge, index) => ({
    id: String(edge?.id || `e-${edge?.source || index}-${edge?.target || index}`),
    source: String(edge?.source || ''),
    target: String(edge?.target || ''),
    sourceHandle: edge?.sourceHandle ?? null,
    targetHandle: edge?.targetHandle ?? null,
    type: edge?.type || DEFAULT_EDGE_OPTIONS.type,
    markerEnd:
      edge?.markerEnd === false
        ? undefined
        : edge?.markerEnd && typeof edge.markerEnd === 'object'
          ? edge.markerEnd
          : DEFAULT_EDGE_OPTIONS.markerEnd,
    style:
      edge?.style && typeof edge.style === 'object'
        ? { ...DEFAULT_EDGE_OPTIONS.style, ...edge.style }
        : DEFAULT_EDGE_OPTIONS.style,
  }))

const parseStructureJSON = (jsonText: string) => {
  const parsed = JSON.parse(jsonText)
  const chart = parsed?.chart_data || parsed?.chartData || parsed?.data || parsed
  const rawNodes = chart?.nodes || parsed?.nodes
  const rawEdges = chart?.edges || parsed?.edges

  if (!Array.isArray(rawNodes) || !Array.isArray(rawEdges)) {
    throw new Error('JSON файл дотор nodes болон edges массив байх ёстой.')
  }

  return {
    title: parsed?.title ?? parsed?.chartTitle,
    description: parsed?.description ?? parsed?.chartDescription,
    nodes: normalizeImportedNodes(rawNodes),
    edges: normalizeImportedEdges(rawEdges).filter((edge) => edge.source && edge.target),
  }
}

const EDGE_TYPES = [
  { value: 'smoothstep', label: 'Муруй (smoothstep)' },
  { value: 'default', label: 'Безье (bezier)' },
  { value: 'straight', label: 'Шулуун (straight)' },
  { value: 'step', label: 'Шат (step)' },
] as const

const EDGE_COLORS = [
  { label: 'Тэнгэрийн цэнхэр', value: '#00B2E7' },
  { label: 'Цэнхэр', value: '#0048BA' },
  { label: 'Хар', value: '#27272a' },
  { label: 'Саарал', value: '#9ca3af' },
  { label: 'Ногоон', value: '#059669' },
  { label: 'Улаан', value: '#dc2626' },
  { label: 'Улбар шар', value: '#d97706' },
  { label: 'Нил ягаан', value: '#7c3aed' },
]

/* ----------------------------------
   DEFAULT STYLES
-----------------------------------*/
const DEFAULT_EDGE_OPTIONS: any = {
  type: 'smoothstep',
  markerEnd: { type: 'arrowclosed' },
  style: { stroke: '#00B2E7', strokeWidth: 2 },
}

const NODE_COLORS = [
  { label: 'Хар (анхдагч)', value: '#27272a' },
  { label: 'Цэнхэр', value: '#0048BA' },
  { label: 'Тэнгэрийн цэнхэр', value: '#00B2E7' },
  { label: 'Ногоон', value: '#059669' },
  { label: 'Нил ягаан', value: '#7c3aed' },
  { label: 'Улаан', value: '#dc2626' },
  { label: 'Улбар шар', value: '#d97706' },
  { label: 'Ягаан', value: '#db2777' },
  { label: 'Slate', value: '#475569' },
]

const NODE_SHAPES = [
  { value: 'rectangle', label: '▬ Дөрвөлжин' },
  { value: 'rounded', label: '▢ Дугуйрсан' },
  { value: 'pill', label: '⬭ Хэлбэрт' },
  { value: 'circle', label: '● Бөөрөнхий' },
  { value: 'diamond', label: '◆ Алмааз' },
  { value: 'hexagon', label: '⬡ Зургаалжин' },
] as const

type NodeShape = typeof NODE_SHAPES[number]['value']

const shapeStyles = (shape: string, bgColor: string, selected: boolean): React.CSSProperties => {
  const base: React.CSSProperties = {
    backgroundColor: bgColor,
    borderColor: selected ? '#00B2E7' : `${bgColor}88`,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
  switch (shape) {
    case 'circle': return { ...base, borderRadius: '50%' }
    case 'rounded': return { ...base, borderRadius: '8px' }
    case 'pill': return { ...base, borderRadius: '9999px' }
    case 'diamond': return { ...base, borderRadius: '4px', transform: 'rotate(45deg)' }
    case 'hexagon': return { ...base, clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', borderColor: 'transparent' }
    default: return { ...base, borderRadius: '4px' }
  }
}

/* ----------------------------------
   Mock data (backend оронд)
-----------------------------------*/
const initialNodes: Node[] = []
const initialEdges: Edge[] = []

/* ----------------------------------
   Custom node (dark, minimalist)
-----------------------------------*/
const FONT_SIZE_MAP: Record<string, string> = {
  xs: '10px', sm: '12px', base: '14px', lg: '16px', xl: '18px', '2xl': '20px', '3xl': '24px',
}

function OrgNode({ data, selected }: NodeProps) {
  const { preview, color, text_align, font_size, shape } = data as any
  const bgColor = color || '#27272a'
  const fontSize = FONT_SIZE_MAP[font_size] || '14px'
  const nodeShape = shape || 'rounded'

  return (
    <div
      className={`px-4 py-2 text-white border shadow min-w-[80px] min-h-[32px] ${
        preview ? 'cursor-default' : 'cursor-pointer'
      }`}
      style={shapeStyles(nodeShape, bgColor, !!selected)}
    >
      {!preview && (
        <>
          <NodeResizer
            color="#00B2E7"
            isVisible={selected}
            minWidth={80}
            minHeight={32}
          />
          <Handle type="target" position={Position.Top} style={{ background: '#00B2E7' }} />
          <Handle type="source" position={Position.Bottom} style={{ background: '#00B2E7' }} />
          <Handle type="target" position={Position.Left} id="left-target" style={{ background: '#00B2E7' }} />
          <Handle type="source" position={Position.Left} id="left-source" style={{ background: '#00B2E7' }} />
          <Handle type="target" position={Position.Right} id="right-target" style={{ background: '#00B2E7' }} />
          <Handle type="source" position={Position.Right} id="right-source" style={{ background: '#00B2E7' }} />
        </>
      )}
      <span style={{ textAlign: text_align || 'center', fontSize, display: 'block', width: '100%', ...(nodeShape === 'diamond' ? { transform: 'rotate(-45deg)' } : {}) }}>{data.label}</span>
    </div>
  )
}

const nodeTypes = {
  org: OrgNode,
}

/* ----------------------------------
   AUTO LAYOUT ALGORITHM
-----------------------------------*/
const LEVEL_HEIGHT = 140
const SIBLING_GAP = 220

interface TreeNode extends Node {
  children?: TreeNode[]
  level?: number
}

function buildTree(nodes: Node[], parentId: string | null = null): TreeNode[] {
  return nodes
    .filter((n) => {
      // Олох parent id - edges-аас харна
      return !initialEdges.find(
        (e) => e.target === n.id && e.source !== parentId
      ) || parentId === null
    })
    .map((n) => ({
      ...n,
      children: buildTree(
        nodes,
        n.id
      ),
    }))
}

function assignLevels(node: TreeNode, level: number = 0): void {
  node.level = level
  node.children?.forEach((child) => assignLevels(child, level + 1))
}

function layoutChildren(children: TreeNode[], centerX: number): void {
  if (children.length === 0) return

  const totalWidth = (children.length - 1) * SIBLING_GAP
  children.forEach((child, i) => {
    child.position!.x = centerX - totalWidth / 2 + i * SIBLING_GAP
    if (child.children) {
      layoutChildren(child.children, child.position!.x)
    }
  })
}

function autoLayoutTree(nodes: Node[]): Node[] {
  // edges-ээс tree үүсгэ
  const findRoot = (nds: Node[]) =>
    nds.find(
      (n) => !initialEdges.some((e) => e.target === n.id)
    ) || nds[0]

  const root = findRoot(nodes)
  if (!root) return nodes

  // Clone nodes
  const layoutedNodes = nodes.map((n) => ({ ...n, position: { ...n.position } }))
  const rootNode = layoutedNodes.find((n) => n.id === root.id)!

  // Recursive tree build
  const getChildren = (parentId: string): Node[] =>
    layoutedNodes.filter(
      (n) =>
        initialEdges.some(
          (e) => e.source === parentId && e.target === n.id
        )
    )

  // Assign levels
  const assignLevelsRecursive = (node: Node, level: number = 0) => {
    node.position!.y = level * LEVEL_HEIGHT
    getChildren(node.id).forEach((child) =>
      assignLevelsRecursive(child, level + 1)
    )
  }

  // Assign X coordinates
  const assignXRecursive = (node: Node, centerX: number = 0) => {
    node.position!.x = centerX
    const children = getChildren(node.id)
    if (children.length > 0) {
      const totalWidth = (children.length - 1) * SIBLING_GAP
      children.forEach((child, i) => {
        const childX = centerX - totalWidth / 2 + i * SIBLING_GAP
        assignXRecursive(child, childX)
      })
    }
  }

  assignLevelsRecursive(rootNode)
  assignXRecursive(rootNode, 0)

  return layoutedNodes
}

/* ----------------------------------
   MAIN COMPONENT
-----------------------------------*/
export default function StructureTab({ 
  onSave, 
  loading 
}: { 
  onSave?: (data: any) => void
  loading?: boolean 
}) {
  const [editingNode, setEditingNode] = useState<Node | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editColor, setEditColor] = useState('#27272a')
  const [editAlign, setEditAlign] = useState<'left' | 'center' | 'right'>('center')
  const [editFontSize, setEditFontSize] = useState('base')
  const [editShape, setEditShape] = useState<NodeShape>('rounded')
  const [isLoaded, setIsLoaded] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [preview, setPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedState, setLastSavedState] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null)
  const [selectingRoot, setSelectingRoot] = useState<Node | null>(null)
  const [structureId, setStructureId] = useState<number | null>(null)
  const [aboutPageId, setAboutPageId] = useState<number | null>(null)
  const [chartTitle, setChartTitle] = useState('')
  const [chartDescription, setChartDescription] = useState('')
  const [showTitleEditor, setShowTitleEditor] = useState(false)
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null)
  const [edgeType, setEdgeType] = useState('smoothstep')
  const [edgeColor, setEdgeColor] = useState('#00B2E7')
  const [edgeWidth, setEdgeWidth] = useState(2)
  const [edgeArrow, setEdgeArrow] = useState(true)
  const [selectionMode, setSelectionMode] = useState(false)
  const [jsonMenuOpen, setJsonMenuOpen] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importJsonText, setImportJsonText] = useState('')
  const [importError, setImportError] = useState('')
  const importFileInputRef = useRef<HTMLInputElement | null>(null)

  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges)

  const buildExportPayload = useCallback(() => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    title: chartTitle,
    description: chartDescription,
    nodes: serializeNodes(nodes),
    edges: serializeEdges(edges),
  }), [chartDescription, chartTitle, edges, nodes])

  // Load from API
  useEffect(() => {
    const loadFromAPI = async () => {
      try {
        // Эхлээд about page-ийн ID-г олно
        const extractArr = (raw: any) => Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
        const pagesRes = await axiosInstance.get('/about-page/')
        const pages = extractArr(pagesRes.data)
        const introPage = pages.find((p: any) => p.key === 'intro')
        let pid: number
        if (introPage) {
          pid = introPage.id
        } else {
          const createRes = await axiosInstance.post('/about-page/', { key: 'intro', active: true, sections: [], media: [] })
          pid = createRes.data.id
        }
        setAboutPageId(pid)

        const res = await axiosInstance.get(`/org-structure/?page=${pid}`)
        const list = extractArr(res.data)
        if (list.length > 0) {
          const record = list[0]
          setStructureId(record.id)
          const chartData = record.chart_data
          const loadedNodes = chartData?.nodes
            ? normalizeImportedNodes(chartData.nodes)
            : []
          const loadedEdges = chartData?.edges
            ? normalizeImportedEdges(chartData.edges).filter((edge) => edge.source && edge.target)
            : []
          if (chartData && chartData.nodes) {
            setNodes(loadedNodes)
          }
          if (chartData && chartData.edges) {
            setEdges(loadedEdges)
          }
          setLastSavedState({ nodes: loadedNodes, edges: loadedEdges })
          setChartTitle(record.title || '')
          setChartDescription(record.description || '')
        }
      } catch (e) {
        console.error('Failed to load org structure from API:', e)
        // Fallback to localStorage
        const saved = localStorage.getItem('org-chart')
        if (saved) {
          try {
            const parsedState = parseStructureJSON(saved)
            setNodes(parsedState.nodes)
            setEdges(parsedState.edges)
            setLastSavedState({ nodes: parsedState.nodes, edges: parsedState.edges })
            if (typeof parsedState.title === 'string') setChartTitle(parsedState.title)
            if (typeof parsedState.description === 'string') setChartDescription(parsedState.description)
          } catch (e) {
            console.error('Failed to load org chart from localStorage:', e)
          }
        }
      }
      setIsLoaded(true)
    }
    loadFromAPI()
  }, [])

  // Mark as dirty when current state differs from last saved state
  useEffect(() => {
    if (!isLoaded) return
    if (!lastSavedState) return

    setDirty(
      JSON.stringify({ nodes, edges }) !==
      JSON.stringify(lastSavedState)
    )
  }, [nodes, edges, isLoaded, lastSavedState])

  // Close modal when entering preview mode
  useEffect(() => {
    if (preview) {
      setEditingNode(null)
    }
  }, [preview])

  // Server submission function
  const handleSubmit = async () => {
    const orgNodes = serializeNodes(nodes)
    const orgEdges = serializeEdges(edges)

    const chartData: OrgChartData = { nodes: orgNodes, edges: orgEdges }

    setIsSaving(true)
    try {
      if (structureId) {
        await axiosInstance.put(`/org-structure/${structureId}/`, {
          page: aboutPageId,
          chart_data: chartData,
          title: chartTitle,
          description: chartDescription,
        })
      } else {
        const res = await axiosInstance.post('/org-structure/', {
          page: aboutPageId,
          chart_data: chartData,
          title: chartTitle,
          description: chartDescription,
        })
        setStructureId(res.data.id)
      }
      // Also save to localStorage as backup
      localStorage.setItem('org-chart', JSON.stringify(buildExportPayload()))
      setLastSavedState({ nodes, edges })
      setDirty(false)
      alert('Серверт амжилттай хадгаллаа')
    } catch (error) {
      console.error('Failed to submit chart:', error)
      alert(
        `Илгээхэд алдаа гарлаа: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    } finally {
      setIsSaving(false)
    }
  }

  // Manual save function (also saves to server)
  const saveChart = async () => {
    await handleSubmit()
  }

  // Reset to last saved state
  const resetChart = () => {
    if (lastSavedState) {
      setNodes(lastSavedState.nodes)
      setEdges(lastSavedState.edges)
      setDirty(false)
      alert('↩️ Буцаалтыг амжилттай гүйцэтгэлээ')
    }
  }

  // Close modal when entering preview mode
  useEffect(() => {
    if (preview) {
      setEditingNode(null)
    }
  }, [preview])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Esc → Close modal
      if (e.key === 'Escape' && editingNode) {
        setEditingNode(null)
        return
      }

      // Enter → Save node
      if (e.key === 'Enter' && editingNode) {
        e.preventDefault()
        saveNodeLabel()
        return
      }

      // Delete → Delete node (not root)
      if (e.key === 'Delete' && editingNode && !editingNode.data?.isRoot) {
        e.preventDefault()
        deleteNode(editingNode.id)
        return
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editingNode])

  const onConnect = useCallback(
    (params: any) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            ...DEFAULT_EDGE_OPTIONS,
          },
          eds
        )
      ),
    []
  )

  const addNode = () => {
    setNodes((nds) => [
      ...nds,
      {
        id: crypto.randomUUID(),
        type: 'org',
        position: { x: 500, y: 500 },
        data: { label: 'Шинэ нэгж' },
      },
    ])
  }

  const deleteNode = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return

    // Root дээр дарсан → modal нээ
    if (node.data?.isRoot) {
      setSelectingRoot(node)
      return
    }

    // Normal delete
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      )
    )
    setEditingNode(null)
  }

  const onNodeClick = (_: any, node: Node) => {
    setEditingNode(node)
    setEditLabel(node.data.label)
    setEditColor(node.data.color || '#27272a')
    setEditAlign(node.data.text_align || 'center')
    setEditFontSize(node.data.font_size || 'base')
    setEditShape(node.data.shape || 'rounded')
  }

  const saveNodeLabel = () => {
    if (!editingNode) return

    setNodes((nds) =>
      nds.map((n) =>
        n.id === editingNode.id
          ? { ...n, data: { ...n.data, label: editLabel, color: editColor, text_align: editAlign, font_size: editFontSize, shape: editShape } }
          : n
      )
    )

    setEditingNode(null)
  }


  const addChildNode = (parentId: string) => {
    const newId = crypto.randomUUID()
    const parentNode = nodes.find((n) => n.id === parentId)
    if (!parentNode) return

    // Шинэ child node үүсгэх (parent-ын доор)
    setNodes((nds) => [
      ...nds,
      {
        id: newId,
        type: 'org',
        position: {
          x: parentNode.position.x,
          y: parentNode.position.y + 200,
        },
        data: {
          label: 'Шинэ нэгж',
        },
      },
    ])

    // Edge автоматаар үүсгэх
    setEdges((eds) => [
      ...eds,
      {
        id: `e-${parentId}-${newId}`,
        source: parentId,
        target: newId,
        ...DEFAULT_EDGE_OPTIONS,
      },
    ])
  }

  // Export JSON
  const exportJSON = () => {
    setJsonMenuOpen(false)
    const blob = new Blob(
      [JSON.stringify(buildExportPayload(), null, 2)],
      { type: 'application/json' }
    )
    download(blob, `org-chart-${new Date().toISOString().slice(0, 10)}.json`)
  }

  const openImportModal = () => {
    setJsonMenuOpen(false)
    setImportJsonText('')
    setImportError('')
    setShowImportModal(true)
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      setImportJsonText(text)
      setImportError('')
    } catch (error) {
      console.error('Failed to read JSON file:', error)
      setImportError('JSON файл уншихад алдаа гарлаа.')
    } finally {
      event.target.value = ''
    }
  }

  const applyImportedJSON = () => {
    if (!importJsonText.trim()) {
      setImportError('Оруулах JSON хоосон байна.')
      return
    }

    if (dirty && !window.confirm('Одоогийн хадгалаагүй өөрчлөлтийг JSON файлаар солих уу?')) {
      return
    }

    try {
      const imported = parseStructureJSON(importJsonText)
      setNodes(imported.nodes)
      setEdges(imported.edges)
      if (typeof imported.title === 'string') setChartTitle(imported.title)
      if (typeof imported.description === 'string') setChartDescription(imported.description)
      setDirty(true)
      setShowImportModal(false)
      setImportJsonText('')
      setImportError('')
      alert('JSON амжилттай орлоо. Серверт хадгалахын тулд "Хадгалах" товч дарна уу.')
    } catch (error) {
      console.error('Failed to import org chart JSON:', error)
      setImportError(error instanceof Error ? error.message : 'JSON бүтэц буруу байна.')
    }
  }

  // Export PNG
  const exportPNG = async () => {
    try {
      let element = document.querySelector('.react-flow__pane') as HTMLElement
      if (!element) {
        element = document.querySelector('.react-flow') as HTMLElement
      }
      if (!element) {
        alert('Диаграммыг олох боломжгүй')
        return
      }

      // Dynamic import html-to-image
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: true,
        style: {
          padding: '40px',
        } as any,
      })

      const link = document.createElement('a')
      link.href = dataUrl
      link.download = 'org-chart.png'
      link.click()
      alert(' PNG амжилттай экспортлогдлоо')
    } catch (err) {
      console.error('PNG экспорт амжилтгүй:', err)
      alert(`PNG экспорт амжилтгүй болсон: ${err instanceof Error ? err.message : 'Үл мэдэгдэх алдаа'}`)
    }
  }

  return (
    <div className="h-screen w-full bg-black">
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="text-white font-medium">
            Байгууллагын бүтэц
          </div>
          {dirty && (
            <span className="text-xs text-yellow-400 flex items-center gap-1">
              ● Өөрчлөлт хадгалагдаагүй
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowTitleEditor(!showTitleEditor)}
            className={`px-3 py-1.5 text-sm rounded ${
              showTitleEditor ? 'bg-amber-600' : 'bg-amber-700 hover:bg-amber-600'
            } text-white font-semibold`}
          >
            ✏️ Гарчиг/Тайлбар
          </button>
          <button
            onClick={saveChart}
            disabled={isSaving}
            className={`px-3 py-1.5 text-sm rounded font-semibold text-white ${
              isSaving
                ? 'bg-green-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSaving ? 'Хадгалж байна...' : 'Хадгалах'}
          </button>
          <button
            onClick={resetChart}
            disabled={!dirty}
            className={`px-3 py-1.5 text-sm rounded ${dirty ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-600 cursor-not-allowed'} text-white font-semibold`}
          >
            ↩ Буцаах
          </button>
          <button
            onClick={() => setSelectionMode(s => !s)}
            className={`px-3 py-1.5 text-sm rounded font-semibold transition-colors ${
              selectionMode
                ? 'bg-sky-500 text-white ring-2 ring-sky-300'
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
            title="Shift+Drag ч ажиллана"
          >
            {selectionMode ? '☑' : '☐'} Бүлгээр сонгох
          </button>
          <button
            onClick={addNode}
            className="px-3 py-1.5 text-sm rounded bg-teal-600 text-white hover:bg-teal-700"
          >
            + Нэгж нэмэх
          </button>
          <div className="relative">
            <button
              onClick={() => setJsonMenuOpen((open) => !open)}
              className="px-3 py-1.5 text-sm rounded bg-blue-700 text-white hover:bg-blue-800"
            >
              JSON ▾
            </button>
            {jsonMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl">
                <button
                  onClick={exportJSON}
                  className="block w-full px-4 py-2 text-left text-sm text-zinc-100 hover:bg-zinc-800"
                >
                  Татах
                </button>
                <button
                  onClick={openImportModal}
                  className="block w-full px-4 py-2 text-left text-sm text-zinc-100 hover:bg-zinc-800"
                >
                  Оруулах
                </button>
              </div>
            )}
          </div>
          <button
            onClick={exportPNG}
            className="px-3 py-1.5 text-sm rounded bg-purple-700 text-white hover:bg-purple-800"
          >
             PNG
          </button>
          <button
            onClick={() => setPreview((p) => !p)}
            className={`px-3 py-1.5 text-sm rounded ${
              preview
                ? 'bg-zinc-700 text-zinc-300'
                : 'bg-teal-600 text-white'
            }`}
          >
            👁 Preview
          </button>
        </div>
      </div>

      {/* Title/Description Editor Panel */}
      {showTitleEditor && (
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900 space-y-3">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Гарчиг (Frontend дээр харуулна)</label>
            <input
              value={chartTitle}
              onChange={(e) => { setChartTitle(e.target.value); setDirty(true); }}
              placeholder="Зохион байгуулалтын бүтэц"
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Тайлбар (Frontend дээр харуулна)</label>
            <textarea
              value={chartDescription}
              onChange={(e) => { setChartDescription(e.target.value); setDirty(true); }}
              placeholder="Компанийн зохион байгуулалтын бүтцийн тайлбар..."
              rows={2}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white outline-none focus:border-teal-500 resize-none"
            />
          </div>
        </div>
      )}

      {/* FLOW */}
      <ReactFlow
        style={{ background: preview ? '#ffffff' : '#000000' }}
        className={preview ? 'rf-preview' : ''}
        nodes={nodes.map((n) => ({
          ...n,
          data: {
            ...n.data,
            preview,
          },
        }))}
        edges={edges.map((e) =>
          preview
            ? {
                ...e,
                markerEnd: undefined,
              }
            : e
        )}
        nodeTypes={nodeTypes}
        onNodesChange={preview ? undefined : onNodesChange}
        onEdgesChange={preview ? undefined : onEdgesChange}
        onConnect={preview ? undefined : onConnect}
        onNodeClick={preview ? undefined : onNodeClick}
        nodesDraggable={!preview}
        nodesConnectable={!preview}
        elementsSelectable={!preview}
        selectNodesOnDrag={!preview}
        selectionOnDrag={selectionMode && !preview}
        panOnDrag={selectionMode && !preview ? [1, 2] : true}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode="Shift"
        onEdgeClick={preview ? undefined : (_: any, edge: Edge) => {
          setEditingEdge(edge)
          setEdgeType(edge.type || 'smoothstep')
          setEdgeColor((edge.style as any)?.stroke || '#00B2E7')
          setEdgeWidth((edge.style as any)?.strokeWidth || 2)
          setEdgeArrow(!!edge.markerEnd)
        }}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
      >
        {!preview && (
          <>
            <Background variant={BackgroundVariant.Dots} gap={32} color="#1f2933" />
            <Controls />
          </>
        )}
      </ReactFlow>

      {/* JSON IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-white">JSON оруулах</div>
                <p className="mt-1 text-sm text-zinc-400">
                  Экспорт хийсэн JSON-оо оруулахад байрлал, холбоос, өнгө, хэмжээ яг тэр хэлбэрээрээ орж ирнэ.
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Хаах
              </button>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              <button
                onClick={() => importFileInputRef.current?.click()}
                className="rounded bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
              >
                JSON файл сонгох
              </button>
              <input
                ref={importFileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportFile}
              />
              <button
                onClick={() => {
                  setImportJsonText('')
                  setImportError('')
                }}
                className="rounded bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-700"
              >
                Цэвэрлэх
              </button>
            </div>

            <textarea
              value={importJsonText}
              onChange={(event) => {
                setImportJsonText(event.target.value)
                setImportError('')
              }}
              placeholder='{"nodes":[...],"edges":[...]}'
              rows={14}
              className="w-full resize-none rounded-lg border border-zinc-700 bg-black px-3 py-3 font-mono text-xs text-zinc-100 outline-none focus:border-blue-500"
            />

            {importError && (
              <div className="mt-3 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {importError}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="rounded bg-zinc-700 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-600"
              >
                Болих
              </button>
              <button
                onClick={applyImportedJSON}
                disabled={!importJsonText.trim()}
                className={`rounded px-4 py-2 text-sm font-semibold text-white ${
                  importJsonText.trim()
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-green-900/60 cursor-not-allowed'
                }`}
              >
                Оруулах
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-[400px] rounded-lg bg-zinc-900 p-5 border border-zinc-700">
            <div className="text-white font-medium mb-4">
              Нэгжийн тохиргоо
            </div>

            {/* Label */}
            <label className="text-xs text-zinc-400 mb-1 block">Нэр</label>
            <input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white outline-none focus:border-teal-500 mb-4"
              autoFocus
            />

            {/* Color picker */}
            <label className="text-xs text-zinc-400 mb-2 block">Өнгө</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {NODE_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setEditColor(c.value)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    editColor === c.value ? 'border-white scale-110 shadow-lg' : 'border-zinc-600 hover:border-zinc-400'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-xs text-zinc-500">Бусад:</label>
              <input
                type="color"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-zinc-600 bg-transparent"
              />
              <span className="text-xs text-zinc-500 font-mono">{editColor}</span>
            </div>

            {/* Text alignment */}
            <label className="text-xs text-zinc-400 mb-1 block">Текст байрлал</label>
            <div className="inline-flex rounded-lg border border-zinc-700 overflow-hidden mb-4">
              {([
                { val: 'left' as const, label: '◧ Зүүн' },
                { val: 'center' as const, label: '◫ Голд' },
                { val: 'right' as const, label: '◨ Баруун' },
              ]).map(a => (
                <button
                  key={a.val}
                  type="button"
                  onClick={() => setEditAlign(a.val)}
                  className={`px-3 py-1.5 text-xs transition-colors ${
                    editAlign === a.val
                      ? 'bg-teal-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {/* Font size */}
            <label className="text-xs text-zinc-400 mb-1 block">Үсгийн хэмжээ</label>
            <select
              value={editFontSize}
              onChange={(e) => setEditFontSize(e.target.value)}
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white outline-none focus:border-teal-500 mb-4"
            >
              <option value="xs">10px (маш жижиг)</option>
              <option value="sm">12px (жижиг)</option>
              <option value="base">14px (анхдагч)</option>
              <option value="lg">16px (том)</option>
              <option value="xl">18px (их том)</option>
              <option value="2xl">20px</option>
              <option value="3xl">24px</option>
            </select>

            {/* Shape */}
            <label className="text-xs text-zinc-400 mb-1 block">Дүрс</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {NODE_SHAPES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setEditShape(s.value)}
                  className={`px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                    editShape === s.value
                      ? 'bg-teal-600 border-teal-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Preview */}
            <div className="mb-4 p-3 bg-zinc-800 rounded-lg flex items-center justify-center">
              <div
                className="px-4 py-2 text-white border shadow min-w-[120px]"
                style={{ ...shapeStyles(editShape, editColor, false), width: editShape === 'circle' ? '100px' : undefined, height: editShape === 'circle' ? '100px' : undefined, minWidth: editShape === 'diamond' ? '80px' : '120px', minHeight: editShape === 'diamond' ? '80px' : undefined }}
              >
                <span style={{ textAlign: editAlign, fontSize: FONT_SIZE_MAP[editFontSize] || '14px', display: 'block', width: '100%', ...(editShape === 'diamond' ? { transform: 'rotate(-45deg)' } : {}) }}>
                  {editLabel || 'Нэгж'}
                </span>
              </div>
            </div>

            <div className="flex justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => deleteNode(editingNode.id)}
                  disabled={editingNode.data?.isRoot}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    editingNode.data?.isRoot
                      ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  Устгах
                </button>
                <button
                  onClick={() => { addChildNode(editingNode.id); setEditingNode(null) }}
                  className="px-3 py-1.5 text-sm rounded bg-teal-700 text-white hover:bg-teal-600 transition-colors"
                >
                  + Дэд нэгж
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingNode(null)}
                  className="px-3 py-1.5 text-sm rounded bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
                >
                  Болих
                </button>
                <button
                  onClick={saveNodeLabel}
                  className="px-3 py-1.5 text-sm rounded bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                >
                  Хадгалах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDGE EDIT MODAL */}
      {editingEdge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-[400px] rounded-lg bg-zinc-900 p-5 border border-zinc-700">
            <div className="text-white font-medium mb-4">Шугамын тохиргоо</div>

            {/* Edge type */}
            <label className="text-xs text-zinc-400 mb-1 block">Шугамын төрөл</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {EDGE_TYPES.map(et => (
                <button
                  key={et.value}
                  onClick={() => setEdgeType(et.value)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    edgeType === et.value
                      ? 'bg-teal-600 border-teal-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {et.label}
                </button>
              ))}
            </div>

            {/* Edge color */}
            <label className="text-xs text-zinc-400 mb-2 block">Өнгө</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {EDGE_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setEdgeColor(c.value)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    edgeColor === c.value ? 'border-white scale-110 shadow-lg' : 'border-zinc-600 hover:border-zinc-400'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-xs text-zinc-500">Бусад:</label>
              <input
                type="color"
                value={edgeColor}
                onChange={(e) => setEdgeColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-zinc-600 bg-transparent"
              />
              <span className="text-xs text-zinc-500 font-mono">{edgeColor}</span>
            </div>

            {/* Stroke width */}
            <label className="text-xs text-zinc-400 mb-1 block">Зузаан: {edgeWidth}px</label>
            <input
              type="range"
              min={1}
              max={8}
              value={edgeWidth}
              onChange={(e) => setEdgeWidth(Number(e.target.value))}
              className="w-full mb-4 accent-teal-500"
            />

            {/* Arrow toggle */}
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="edge-arrow"
                checked={edgeArrow}
                onChange={(e) => setEdgeArrow(e.target.checked)}
                className="rounded border-zinc-600 accent-teal-500"
              />
              <label htmlFor="edge-arrow" className="text-sm text-zinc-300">Сум харуулах</label>
            </div>

            {/* Preview */}
            <div className="mb-4 p-3 bg-zinc-800 rounded-lg flex items-center justify-center">
              <svg width="200" height="60" viewBox="0 0 200 60">
                <defs>
                  {edgeArrow && (
                    <marker id="edge-preview-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill={edgeColor} />
                    </marker>
                  )}
                </defs>
                {edgeType === 'straight' ? (
                  <line x1="10" y1="30" x2="190" y2="30" stroke={edgeColor} strokeWidth={edgeWidth} markerEnd={edgeArrow ? 'url(#edge-preview-arrow)' : undefined} />
                ) : edgeType === 'default' ? (
                  <path d="M 10 30 C 60 5, 140 55, 190 30" fill="none" stroke={edgeColor} strokeWidth={edgeWidth} markerEnd={edgeArrow ? 'url(#edge-preview-arrow)' : undefined} />
                ) : edgeType === 'step' ? (
                  <path d="M 10 30 L 10 10 L 190 10 L 190 30" fill="none" stroke={edgeColor} strokeWidth={edgeWidth} markerEnd={edgeArrow ? 'url(#edge-preview-arrow)' : undefined} />
                ) : (
                  <path d="M 10 30 C 10 10, 10 10, 100 10 C 190 10, 190 10, 190 30" fill="none" stroke={edgeColor} strokeWidth={edgeWidth} markerEnd={edgeArrow ? 'url(#edge-preview-arrow)' : undefined} />
                )}
              </svg>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => {
                  setEdges((eds) => eds.filter((e) => e.id !== editingEdge.id))
                  setEditingEdge(null)
                }}
                className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Устгах
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingEdge(null)}
                  className="px-3 py-1.5 text-sm rounded bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
                >
                  Болих
                </button>
                <button
                  onClick={() => {
                    setEdges((eds) =>
                      eds.map((e) =>
                        e.id === editingEdge.id
                          ? {
                              ...e,
                              type: edgeType,
                              style: { stroke: edgeColor, strokeWidth: edgeWidth },
                              markerEnd: edgeArrow ? { type: MarkerType.ArrowClosed } : undefined,
                            }
                          : e
                      )
                    )
                    setEditingEdge(null)
                  }}
                  className="px-3 py-1.5 text-sm rounded bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                >
                  Хадгалах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROOT SELECTION MODAL */}
      {selectingRoot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-[420px] rounded-lg bg-zinc-900 p-4 border border-zinc-700">
            <div className="text-white font-medium mb-2">
              Root нэгж солих
            </div>

            <p className="text-sm text-zinc-400 mb-4">
              &quot;{selectingRoot.data.label}&quot; нь одоогийн root байна.
              <br />
              Шинэ root нэгжийг сонгоно уу.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
              {nodes
                .filter((n) => n.id !== selectingRoot.id)
                .map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      // Promote new node to root
                      setNodes((nds) =>
                        nds.map((nd) => ({
                          ...nd,
                          data: {
                            ...nd.data,
                            isRoot: nd.id === n.id,
                          },
                        }))
                      )
                      // Remove parent edge from new root
                      setEdges((eds) => eds.filter((e) => e.target !== n.id))
                      // Delete old root
                      setNodes((nds) => nds.filter((nd) => nd.id !== selectingRoot.id))
                      setEdges((eds) =>
                        eds.filter(
                          (e) => e.source !== selectingRoot.id && e.target !== selectingRoot.id
                        )
                      )
                      setSelectingRoot(null)
                      setEditingNode(null)
                    }}
                    className="w-full text-left px-3 py-2 rounded bg-zinc-800 text-white hover:bg-zinc-700 transition-colors text-sm"
                  >
                    {n.data.label}
                  </button>
                ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectingRoot(null)}
                className="px-3 py-1.5 text-sm rounded bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
              >
                Болих
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        :root {
          --color-teal-700: #0048BA;
        }
        .rf-preview .react-flow__pane,
        .rf-preview .react-flow__viewport {
          background: white !important;
        }
      `}</style>
    </div>
  )
}
