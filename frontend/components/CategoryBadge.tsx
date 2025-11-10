'use client';

import React from 'react';

interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  videoCount?: number;
}

interface CategoryBadgeProps {
  category: Category;
  onClick?: () => void;
  showCount?: boolean;
}

export default function CategoryBadge({
  category,
  onClick,
  showCount = false
}: CategoryBadgeProps) {
  const backgroundColor = category.color || '#e5e7eb';

  return (
    <span
      className={`badge ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      style={{
        backgroundColor,
        color: '#1f2937',
      }}
      onClick={onClick}
    >
      {category.icon && <span className="mr-1">{category.icon}</span>}
      {category.name}
      {showCount && category.videoCount !== undefined && (
        <span className="ml-1 opacity-75">({category.videoCount})</span>
      )}
    </span>
  );
}
