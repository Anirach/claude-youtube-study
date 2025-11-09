'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { FiDownload, FiZoomIn, FiZoomOut, FiFilter } from 'react-icons/fi';

// Dynamic import to avoid SSR issues with canvas
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
});

interface Node {
  id: string;
  label: string;
  category?: string;
  watchStatus?: string;
  val?: number;
  color?: string;
}

interface Link {
  source: string;
  target: string;
  type?: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface KnowledgeGraphProps {
  data: GraphData;
  onNodeClick?: (node: Node) => void;
}

export default function KnowledgeGraph({ data, onNodeClick }: KnowledgeGraphProps) {
  const fgRef = useRef<any>();
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState<Node | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [graphData, setGraphData] = useState<GraphData>(data);

  useEffect(() => {
    setGraphData(data);
  }, [data]);

  const handleNodeHover = (node: Node | null) => {
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());

    if (node) {
      setHoverNode(node);
      const neighbors = new Set();
      const links = new Set();

      graphData.links.forEach((link: any) => {
        if (link.source.id === node.id || link.source === node.id) {
          neighbors.add(link.target.id || link.target);
          links.add(link);
        }
        if (link.target.id === node.id || link.target === node.id) {
          neighbors.add(link.source.id || link.source);
          links.add(link);
        }
      });

      neighbors.add(node.id);
      setHighlightNodes(neighbors);
      setHighlightLinks(links);
    } else {
      setHoverNode(null);
    }
  };

  const getNodeColor = (node: Node) => {
    if (node.color) return node.color;

    const watchStatusColors: { [key: string]: string } = {
      watched: '#10b981',
      watching: '#f59e0b',
      unwatched: '#6b7280',
    };

    return watchStatusColors[node.watchStatus || 'unwatched'] || '#6b7280';
  };

  const paintNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;

    const isHighlighted = highlightNodes.has(node.id);
    const nodeRadius = node.val || 5;

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = getNodeColor(node);
    ctx.fill();

    // Draw border if highlighted
    if (isHighlighted) {
      ctx.lineWidth = 2 / globalScale;
      ctx.strokeStyle = '#3b82f6';
      ctx.stroke();
    }

    // Draw label
    if (globalScale > 1.5 || isHighlighted) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#1f2937';
      ctx.fillText(label.substring(0, 30), node.x, node.y + nodeRadius + fontSize + 2);
    }
  };

  const paintLink = (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isHighlighted = highlightLinks.has(link);

    ctx.strokeStyle = isHighlighted ? '#3b82f6' : 'rgba(0,0,0,0.2)';
    ctx.lineWidth = isHighlighted ? 2 / globalScale : 1 / globalScale;

    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.stroke();
  };

  const handleExport = () => {
    if (fgRef.current) {
      const canvas = fgRef.current.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = 'knowledge-graph.png';
        link.href = canvas.toDataURL();
        link.click();
      }
    }
  };

  const handleZoomIn = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom * 1.2, 400);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom / 1.2, 400);
    }
  };

  const categories = Array.from(new Set(graphData.nodes.map(n => n.category).filter(Boolean)));

  useEffect(() => {
    if (filterCategory) {
      const filtered = {
        nodes: data.nodes.filter(n => !filterCategory || n.category === filterCategory),
        links: data.links.filter((l: any) => {
          const sourceNode = data.nodes.find(n => n.id === (l.source.id || l.source));
          const targetNode = data.nodes.find(n => n.id === (l.target.id || l.target));
          return (!filterCategory ||
            (sourceNode?.category === filterCategory && targetNode?.category === filterCategory));
        })
      };
      setGraphData(filtered);
    } else {
      setGraphData(data);
    }
  }, [filterCategory, data]);

  return (
    <div className="relative w-full h-full">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 space-y-2">
        <div className="flex gap-2">
          <button onClick={handleZoomIn} className="btn btn-secondary" title="Zoom In">
            <FiZoomIn />
          </button>
          <button onClick={handleZoomOut} className="btn btn-secondary" title="Zoom Out">
            <FiZoomOut />
          </button>
          <button onClick={handleExport} className="btn btn-secondary" title="Export">
            <FiDownload />
          </button>
        </div>

        <div className="pt-2 border-t">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiFilter className="inline mr-1" />
            Filter by Category
          </label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hover Info */}
      {hoverNode && (
        <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-bold text-sm mb-2">{hoverNode.label}</h3>
          <div className="text-xs text-gray-600 space-y-1">
            {hoverNode.category && (
              <div>Category: <span className="font-medium">{hoverNode.category}</span></div>
            )}
            {hoverNode.watchStatus && (
              <div>Status: <span className="font-medium">{hoverNode.watchStatus}</span></div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4">
        <h4 className="font-bold text-sm mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Watched</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Watching</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>Unwatched</span>
          </div>
        </div>
      </div>

      {/* Graph */}
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="label"
        nodeCanvasObject={paintNode}
        linkCanvasObject={paintLink}
        onNodeClick={(node: any) => onNodeClick?.(node)}
        onNodeHover={handleNodeHover}
        nodeRelSize={6}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        d3VelocityDecay={0.3}
        cooldownTicks={100}
        onEngineStop={() => {
          if (fgRef.current) {
            fgRef.current.zoomToFit(400, 50);
          }
        }}
      />
    </div>
  );
}
