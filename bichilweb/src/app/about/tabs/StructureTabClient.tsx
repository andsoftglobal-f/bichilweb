'use client';

import { useState } from 'react';
import ReactFlow, {
  Controls,
  Node,
  Edge,
  NodeProps,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

const FONT_SIZE_MAP: Record<string, string> = {
  xs: '10px', sm: '12px', base: '14px', lg: '16px', xl: '18px', '2xl': '20px', '3xl': '24px',
};

const shapeStyles = (shape: string, bgColor: string): React.CSSProperties => {
  const base: React.CSSProperties = {
    backgroundColor: bgColor,
    borderColor: `${bgColor}88`,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '80px',
    minHeight: '32px',
  };
  switch (shape) {
    case 'circle': return { ...base, borderRadius: '50%' };
    case 'rounded': return { ...base, borderRadius: '8px' };
    case 'pill': return { ...base, borderRadius: '9999px' };
    case 'diamond': return { ...base, borderRadius: '4px', transform: 'rotate(45deg)' };
    case 'hexagon': return { ...base, clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', borderColor: 'transparent' };
    default: return { ...base, borderRadius: '4px' };
  }
};

/* ── Custom Node (admin-тэй яг адилхан) ── */
function OrgNode({ data }: NodeProps) {
  const bgColor = data.color || (data.isRoot ? '#0048BA' : '#27272a');
  const fontSize = FONT_SIZE_MAP[data.font_size] || '14px';
  const nodeShape = data.shape || 'rounded';

  return (
    <div
      className="px-4 py-2 text-white border shadow"
      style={shapeStyles(nodeShape, bgColor)}
    >
      <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 'none', width: 6, height: 6, opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 'none', width: 6, height: 6, opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="left-target" style={{ background: 'transparent', border: 'none', width: 6, height: 6, opacity: 0 }} />
      <Handle type="source" position={Position.Left} id="left-source" style={{ background: 'transparent', border: 'none', width: 6, height: 6, opacity: 0 }} />
      <Handle type="target" position={Position.Right} id="right-target" style={{ background: 'transparent', border: 'none', width: 6, height: 6, opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="right-source" style={{ background: 'transparent', border: 'none', width: 6, height: 6, opacity: 0 }} />
      <span style={{ textAlign: data.text_align || 'center', fontSize, display: 'block', width: '100%', ...(nodeShape === 'diamond' ? { transform: 'rotate(-45deg)' } : {}) }}>{data.label}</span>
    </div>
  );
}

const nodeTypes = { org: OrgNode };

/* ── Main Component ── */
export default function StructureTabClient({ nodes, edges, title, description }: {
  nodes: Node[];
  edges: Edge[];
  title: string;
  description: string;
}) {
  const [isLocked, setIsLocked] = useState(true);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
      {/* Title & Description from DB */}
      {(title || description) && (
        <div className="text-center max-w-3xl mx-auto mb-4">
          {title && (
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{title}</h2>
          )}
          {description && (
            <p className="text-gray-600 text-lg leading-relaxed">{description}</p>
          )}
        </div>
      )}

      {/* ReactFlow Chart - same as admin */}
      <div className="w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white flex flex-col" style={{ height: '600px' }}>
        <div className="flex items-center justify-end px-3 py-2 border-b border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={() => setIsLocked(v => !v)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            aria-pressed={isLocked}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {isLocked ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.875a4.5 4.5 0 10-9 0V10.5m-.75 0h10.5a2.25 2.25 0 012.25 2.25v6a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25v-6a2.25 2.25 0 012.25-2.25z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.875a4.5 4.5 0 10-9 0V10.5m9 0h.75a2.25 2.25 0 012.25 2.25v6a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25v-6a2.25 2.25 0 012.25-2.25h6.75" />
              )}
            </svg>
            {isLocked ? 'Түгжсэн' : 'Тайлагдсан'}
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={!isLocked}
            panOnScroll={!isLocked}
            zoomOnScroll={!isLocked}
            zoomOnPinch={!isLocked}
            zoomOnDoubleClick={!isLocked}
            preventScrolling={!isLocked}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
            proOptions={{ hideAttribution: true }}
            style={{ background: '#ffffff', height: '100%' }}
          >
            <Controls showZoom={!isLocked} showInteractive={false} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
