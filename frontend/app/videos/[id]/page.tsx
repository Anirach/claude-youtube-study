'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiExternalLink, FiRefreshCw, FiEdit2 } from 'react-icons/fi';
import { videoAPI, categoryAPI } from '@/lib/api';
import CategoryBadge from '@/components/CategoryBadge';

export default function VideoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [video, setVideo] = useState<any>(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    categoryId: '',
    watchStatus: '',
  });

  useEffect(() => {
    if (params.id) {
      fetchVideo();
      fetchCategories();
    }
  }, [params.id]);

  const fetchVideo = async () => {
    try {
      const response = await videoAPI.getOne(params.id as string);
      setVideo(response.data);
      setEditData({
        categoryId: response.data.categoryId || '',
        watchStatus: response.data.watchStatus,
      });
    } catch (error) {
      console.error('Error fetching video:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const response = await videoAPI.process(params.id as string);
      setVideo(response.data);
      alert('Video processed successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to process video');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await videoAPI.update(params.id as string, editData);
      setVideo(response.data);
      setEditing(false);
      alert('Video updated successfully!');
    } catch (error) {
      alert('Failed to update video');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Video not found
        </h3>
        <button onClick={() => router.back()} className="btn btn-primary mt-4">
          Go Back
        </button>
      </div>
    );
  }

  const summary = video.summaryJson;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="btn btn-secondary"
      >
        <FiArrowLeft className="inline mr-1" />
        Back
      </button>

      {/* Video Player */}
      <div className="card">
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}`}
            title={video.title}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      </div>

      {/* Video Info */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {video.title}
            </h1>
            {video.author && (
              <p className="text-gray-600 mb-2">By {video.author}</p>
            )}
          </div>
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            <FiExternalLink className="inline mr-1" />
            YouTube
          </a>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 mb-4">
          {editing ? (
            <>
              <select
                value={editData.watchStatus}
                onChange={(e) =>
                  setEditData({ ...editData, watchStatus: e.target.value })
                }
                className="input"
              >
                <option value="unwatched">Unwatched</option>
                <option value="watching">Watching</option>
                <option value="watched">Watched</option>
              </select>
              <select
                value={editData.categoryId}
                onChange={(e) =>
                  setEditData({ ...editData, categoryId: e.target.value })
                }
                className="input"
              >
                <option value="">No Category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button onClick={handleUpdate} className="btn btn-primary">
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <span className={`badge ${
                video.watchStatus === 'watched' ? 'bg-green-100 text-green-800' :
                video.watchStatus === 'watching' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {video.watchStatus}
              </span>
              {video.category && <CategoryBadge category={video.category} />}
              <button
                onClick={() => setEditing(true)}
                className="btn btn-secondary"
              >
                <FiEdit2 className="inline mr-1" />
                Edit
              </button>
            </>
          )}
        </div>

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {video.tags.map((tag: string, idx: number) => (
              <span
                key={idx}
                className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Summary Section */}
      {summary ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="font-bold text-lg mb-3">Quick Summary</h3>
            <p className="text-gray-700">{summary.quickSummary}</p>
          </div>

          <div className="card lg:col-span-2">
            <h3 className="font-bold text-lg mb-3">Detailed Summary</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {summary.detailedSummary}
            </p>
          </div>

          <div className="card lg:col-span-3">
            <h3 className="font-bold text-lg mb-3">Key Points</h3>
            <ul className="list-disc list-inside space-y-2">
              {summary.keyPoints.map((point: string, idx: number) => (
                <li key={idx} className="text-gray-700">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="card text-center py-8">
          <p className="text-gray-600 mb-4">
            No summary available for this video yet
          </p>
          <button
            onClick={handleProcess}
            className="btn btn-primary"
            disabled={processing}
          >
            <FiRefreshCw className={`inline mr-1 ${processing ? 'animate-spin' : ''}`} />
            {processing ? 'Processing...' : 'Generate Summary'}
          </button>
        </div>
      )}

      {/* Transcription */}
      {video.transcription && (
        <div className="card">
          <h3 className="font-bold text-lg mb-3">Transcription</h3>
          <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {video.transcription}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
