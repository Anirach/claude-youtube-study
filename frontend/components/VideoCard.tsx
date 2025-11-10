'use client';

import React from 'react';
import { FiClock, FiUser, FiTag } from 'react-icons/fi';

interface Video {
  id: string;
  youtubeId: string;
  title: string;
  author?: string;
  duration?: number;
  watchStatus: string;
  category?: {
    name: string;
    color?: string;
  };
  tags?: string[];
}

interface VideoCardProps {
  video: Video;
  onSelect?: (video: Video) => void;
}

export default function VideoCard({ video, onSelect }: VideoCardProps) {
  const thumbnail = `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}:${(mins % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${mins}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'watched':
        return 'bg-green-100 text-green-800';
      case 'watching':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className="card hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onSelect?.(video)}
    >
      <div className="relative pb-[56.25%] mb-4 rounded-lg overflow-hidden bg-gray-200">
        <img
          src={thumbnail}
          alt={video.title}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
          }}
        />
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs font-medium">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>

      <h3 className="text-lg font-semibold mb-2 line-clamp-2">
        {video.title}
      </h3>

      {video.author && (
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <FiUser className="mr-1" />
          <span className="truncate">{video.author}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <span className={`badge ${getStatusColor(video.watchStatus)}`}>
          {video.watchStatus}
        </span>

        {video.category && (
          <span
            className="badge"
            style={{
              backgroundColor: video.category.color || '#e5e7eb',
              color: '#1f2937',
            }}
          >
            {video.category.name}
          </span>
        )}
      </div>

      {video.tags && video.tags.length > 0 && (
        <div className="flex items-center gap-1 mt-2 flex-wrap">
          <FiTag className="text-gray-400 text-sm" />
          {video.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
          {video.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{video.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
}
