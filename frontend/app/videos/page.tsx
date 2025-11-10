'use client';

import React, { useEffect, useState } from 'react';
import { FiPlus, FiGrid, FiList } from 'react-icons/fi';
import VideoCard from '@/components/VideoCard';
import AddVideoModal from '@/components/AddVideoModal';
import SearchBar from '@/components/SearchBar';
import { videoAPI, categoryAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function VideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    watchStatus: '',
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [videosResponse, categoriesResponse] = await Promise.all([
        videoAPI.getAll({
          search: filters.search || undefined,
          categoryId: filters.categoryId || undefined,
          watchStatus: filters.watchStatus || undefined,
        }),
        categoryAPI.getAll(),
      ]);

      setVideos(videosResponse.data.videos);
      setCategories(categoriesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, search: query }));
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleVideoClick = (video: any) => {
    router.push(`/videos/${video.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Videos</h1>
          <p className="text-gray-600">
            {videos.length} video{videos.length !== 1 ? 's' : ''} in your collection
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <FiPlus className="inline mr-1" />
          Add Video
        </button>
      </div>

      {/* Search and Filters */}
      <SearchBar
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        categories={categories}
      />

      {/* View Mode Toggle */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setViewMode('grid')}
          className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <FiGrid className="inline" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <FiList className="inline" />
        </button>
      </div>

      {/* Videos Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : videos.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No videos found
          </h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your filters or add a new video
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <FiPlus className="inline mr-1" />
            Add Video
          </button>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }
        >
          {videos.map((video: any) => (
            <VideoCard
              key={video.id}
              video={video}
              onSelect={handleVideoClick}
            />
          ))}
        </div>
      )}

      {/* Add Video Modal */}
      <AddVideoModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchData}
        categories={categories}
      />
    </div>
  );
}
