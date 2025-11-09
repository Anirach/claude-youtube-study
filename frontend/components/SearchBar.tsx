'use client';

import React, { useState } from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange?: (filters: any) => void;
  placeholder?: string;
  categories?: Array<{ id: string; name: string }>;
}

export default function SearchBar({
  onSearch,
  onFilterChange,
  placeholder = 'Search videos...',
  categories = []
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categoryId: '',
    watchStatus: '',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="input pl-10"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
        >
          <FiFilter className="inline mr-1" />
          Filters
        </button>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {showFilters && (
        <div className="card">
          <h3 className="font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.categoryId}
                onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                className="input"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Watch Status
              </label>
              <select
                value={filters.watchStatus}
                onChange={(e) => handleFilterChange('watchStatus', e.target.value)}
                className="input"
              >
                <option value="">All Statuses</option>
                <option value="unwatched">Unwatched</option>
                <option value="watching">Watching</option>
                <option value="watched">Watched</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
