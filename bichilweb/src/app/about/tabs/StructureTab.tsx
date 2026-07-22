import { logApiWarning } from '@/lib/apiError';
import { getApiBase } from '@/lib/apiBase';
import type { Node, Edge } from 'reactflow';
import StructureTabClient from './StructureTabClient';

interface StructureData {
  nodes: Node[];
  edges: Edge[];
  title: string;
  description: string;
}

interface AboutPageSummary {
  id: number;
  key?: string;
}

async function getStructureData(): Promise<StructureData> {
  const empty: StructureData = { nodes: [], edges: [], title: '', description: '' };
  try {
    const API_URL = getApiBase();
    // Discover about page ID dynamically
    const pagesRes = await fetch(`${API_URL}/about-page/`, { next: { revalidate: 60 } });
    if (!pagesRes.ok) throw new Error('Failed to fetch pages');
    const pagesRaw = await pagesRes.json();
    const pages: AboutPageSummary[] = Array.isArray(pagesRaw) ? pagesRaw : Array.isArray(pagesRaw?.results) ? pagesRaw.results : [];
    const aboutPage = pages.find((p) => p.key === 'intro');
    if (!aboutPage) throw new Error('About page not found');
    const pid = aboutPage.id;

    const res = await fetch(`${API_URL}/org-structure/?page=${pid}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed');
    const structRaw = await res.json();
    const data = Array.isArray(structRaw) ? structRaw : Array.isArray(structRaw?.results) ? structRaw.results : [];
    if (data.length === 0) return empty;

    const record = data[0];
    const chartData = record.chart_data;
    const nodes: Node[] = chartData?.nodes
      ? chartData.nodes.map((n: Partial<Node>) => ({
          ...n,
          type: n.type || 'org',
          style: n.style || undefined,
          draggable: false,
          selectable: false,
          connectable: false,
        }))
      : [];
    const edges: Edge[] = chartData?.edges
      ? chartData.edges.map((e: Partial<Edge>) => ({
          ...e,
          type: e.type || 'smoothstep',
          style: e.style || { stroke: '#00B2E7', strokeWidth: 2 },
          markerEnd: e.markerEnd || { type: 'arrowclosed' },
        }))
      : [];

    return { nodes, edges, title: record.title || '', description: record.description || '' };
  } catch (err) {
    logApiWarning('Organization structure', err);
    return empty;
  }
}

export default async function StructureTab() {
  const { nodes, edges, title, description } = await getStructureData();

  if (nodes.length === 0) {
    return (
      <div className="py-24 text-center text-gray-500">
        <p className="text-sm">Бүтцийн мэдээлэл байхгүй</p>
      </div>
    );
  }

  return <StructureTabClient nodes={nodes} edges={edges} title={title} description={description} />;
}
