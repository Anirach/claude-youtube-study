'use client';

import React, { useState } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';
import { videoAPI } from '@/lib/api';

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories?: Array<{ id: string; name: string }>;
}

export default function AddVideoModal({
  isOpen,
  onClose,
  onSuccess,
  categories = []
}: AddVideoModalProps) {
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processImmediately, setProcessImmediately] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const tagArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const response = await videoAPI.create({
        url,
        categoryId: categoryId || null,
        tags: tagArray
      });

      // Process video immediately if requested
      if (processImmediately && response.data.id) {
        await videoAPI.process(response.data.id);
      }

      // Reset form
      setUrl('');
      setCategoryId('');
      setTags('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Add YouTube Video</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YouTube URL or Video ID *
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="input"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter a YouTube video URL or just the video ID
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input"
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="programming, tutorial, javascript"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate tags with commas
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="processImmediately"
              checked={processImmediately}
              onChange={(e) => setProcessImmediately(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="processImmediately" className="text-sm text-gray-700">
              Get transcription and summary immediately
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>Processing...</>
              ) : (
                <>
                  <FiPlus className="inline mr-1" />
                  Add Video
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
