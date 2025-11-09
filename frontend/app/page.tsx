'use client';

import React, { useEffect, useState } from 'react';
import { FiVideo, FiCheckCircle, FiClock, FiFolder } from 'react-icons/fi';
import VideoCard from '@/components/VideoCard';
import { videoAPI, categoryAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    total: 0,
    watched: 0,
    watching: 0,
    unwatched: 0,
  });
  const [recentVideos, setRecentVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch videos
      const videosResponse = await videoAPI.getAll({ limit: 8 });
      const videos = videosResponse.data.videos;
      setRecentVideos(videos);

      // Calculate stats
      const statsData = {
        total: videos.length,
        watched: videos.filter((v: any) => v.watchStatus === 'watched').length,
        watching: videos.filter((v: any) => v.watchStatus === 'watching').length,
        unwatched: videos.filter((v: any) => v.watchStatus === 'unwatched').length,
      };
      setStats(statsData);

      // Fetch categories
      const categoriesResponse = await categoryAPI.getAll();
      setCategories(categoriesResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video: any) => {
    router.push(`/videos/${video.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Manage and study your YouTube video collection
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Videos</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <FiVideo size={32} className="opacity-80" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Watched</p>
              <p className="text-3xl font-bold mt-1">{stats.watched}</p>
            </div>
            <FiCheckCircle size={32} className="opacity-80" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Watching</p>
              <p className="text-3xl font-bold mt-1">{stats.watching}</p>
            </div>
            <FiClock size={32} className="opacity-80" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Categories</p>
              <p className="text-3xl font-bold mt-1">{categories.length}</p>
            </div>
            <FiFolder size={32} className="opacity-80" />
          </div>
        </div>
      </div>

      {/* Recent Videos */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Videos</h2>
          <a
            href="/videos"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View All →
          </a>
        </div>

        {recentVideos.length === 0 ? (
          <div className="card text-center py-12">
            <FiVideo size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No videos yet
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by adding your first YouTube video
            </p>
            <a href="/videos" className="btn btn-primary">
              Add Video
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentVideos.map((video: any) => (
              <VideoCard
                key={video.id}
                video={video}
                onSelect={handleVideoClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Categories Overview */}
      {categories.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((cat: any) => (
              <div
                key={cat.id}
                className="card text-center hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/videos?category=${cat.id}`)}
              >
                {cat.icon && <div className="text-3xl mb-2">{cat.icon}</div>}
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {cat.videoCount} videos
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
