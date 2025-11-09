'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import KnowledgeGraph from '@/components/KnowledgeGraph';
import { graphAPI } from '@/lib/api';

export default function GraphPage() {
  const router = useRouter();
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await graphAPI.get();
      const data = response.data;

      // Transform data for the graph component
      const transformedData = {
        nodes: data.nodes.map((node: any) => ({
          ...node,
          val: 5 + Math.random() * 5, // Size variation
        })),
        links: data.edges.map((edge: any) => ({
          source: edge.from,
          target: edge.to,
          type: edge.type || 'related'
        }))
      };

      setGraphData(transformedData);
      setStats(data.stats);
    } catch (err: any) {
      console.error('Error fetching graph data:', err);
      setError(err.response?.data?.error || 'Failed to load knowledge graph');
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (node: any) => {
    router.push(`/videos/${node.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Graph</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={fetchGraphData} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No Data Available
        </h3>
        <p className="text-gray-600 mb-4">
          Add some videos to see the knowledge graph
        </p>
        <button onClick={() => router.push('/videos')} className="btn btn-primary">
          Go to Videos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Knowledge Graph
          </h1>
          <p className="text-gray-600">
            Interactive visualization of video relationships
          </p>
        </div>
        <button onClick={fetchGraphData} className="btn btn-secondary">
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <p className="text-blue-100 text-sm font-medium">Total Videos</p>
            <p className="text-3xl font-bold mt-1">{stats.videoCount}</p>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <p className="text-purple-100 text-sm font-medium">Connections</p>
            <p className="text-3xl font-bold mt-1">{stats.edgeCount}</p>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <p className="text-green-100 text-sm font-medium">Categories</p>
            <p className="text-3xl font-bold mt-1">{stats.categories}</p>
          </div>
        </div>
      )}

      {/* Graph Container */}
      <div className="card p-0 overflow-hidden">
        <div style={{ width: '100%', height: '600px' }}>
          <KnowledgeGraph
            data={graphData}
            onNodeClick={handleNodeClick}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="card">
        <h3 className="font-bold text-lg mb-3">How to Use</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Click and drag to pan around the graph</li>
          <li>Scroll to zoom in and out</li>
          <li>Hover over nodes to see connections</li>
          <li>Click on a node to view video details</li>
          <li>Use the filter to focus on specific categories</li>
          <li>Export the graph as an image using the download button</li>
        </ul>
      </div>
    </div>
  );
}
