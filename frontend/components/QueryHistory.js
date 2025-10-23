'use client';

import { useState, useEffect } from 'react';
import { getQueryHistory, clearQueryHistory } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { X, Clock, CheckCircle, XCircle, Trash2, Copy, Search, Filter } from 'lucide-react';

export default function QueryHistory({ onClose, onQuerySelect, refresh }) {
  const { theme } = useTheme();
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, success, error
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [refresh]);

  useEffect(() => {
    filterHistoryItems();
  }, [searchQuery, filterType, history]);

  const fetchHistory = async () => {
    try {
      const data = await getQueryHistory();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterHistoryItems = () => {
    let filtered = [...history];

    // Apply status filter
    if (filterType === 'success') {
      filtered = filtered.filter(item => item.success);
    } else if (filterType === 'error') {
      filtered = filtered.filter(item => !item.success);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.query.toLowerCase().includes(query) ||
        (item.error && item.error.toLowerCase().includes(query))
      );
    }

    setFilteredHistory(filtered);
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all query history? This action cannot be undone.')) {
      try {
        await clearQueryHistory();
        setHistory([]);
        setFilteredHistory([]);
      } catch (error) {
        console.error('Error clearing history:', error);
      }
    }
  };

  const handleCopyQuery = async (query, index) => {
    try {
      await navigator.clipboard.writeText(query);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`h-full flex flex-col ${
      theme === 'dark'
        ? 'bg-gray-800/50 border-gray-700/50'
        : 'bg-white/70 border-gray-200'
    } backdrop-blur-xl border-l transition-colors duration-300`}>
      {/* Header */}
      <div className={`flex-shrink-0 px-6 py-4 border-b ${
        theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-violet-500/20' : 'bg-violet-100'
            }`}>
              <Clock className={`w-5 h-5 ${
                theme === 'dark' ? 'text-violet-400' : 'text-violet-600'
              }`} />
            </div>
            <div>
              <h2 className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Query History
              </h2>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {filteredHistory.length} of {history.length} quer{history.length !== 1 ? 'ies' : 'y'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                  theme === 'dark'
                    ? 'hover:bg-red-500/20 text-red-400'
                    : 'hover:bg-red-50 text-red-600'
                }`}
                title="Clear all history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                theme === 'dark'
                  ? 'hover:bg-white/10 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search queries..."
            className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm ${
              theme === 'dark'
                ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } border focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all`}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['all', 'success', 'error'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                filterType === type
                  ? theme === 'dark'
                    ? 'bg-violet-500/20 text-violet-400 border-violet-500/50'
                    : 'bg-violet-100 text-violet-700 border-violet-200'
                  : theme === 'dark'
                  ? 'bg-gray-700/30 text-gray-400 border-transparent hover:bg-gray-700/50'
                  : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
              } border`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-6 text-center">
            <Clock className={`w-12 h-12 mx-auto mb-3 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {searchQuery || filterType !== 'all' ? 'No matching queries' : 'No queries yet'}
            </p>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Execute a query to see it here'}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredHistory.map((item, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${
                  theme === 'dark'
                    ? 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50 hover:border-gray-600'
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-md'
                } cursor-pointer group animate-fade-in`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <div>
                      <span className={`text-xs font-medium ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {formatTimestamp(item.timestamp)}
                      </span>
                      <span className={`text-xs ml-2 ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyQuery(item.query, index);
                    }}
                    className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all duration-200 ${
                      copiedIndex === index
                        ? 'bg-green-500/20 text-green-500'
                        : theme === 'dark'
                        ? 'hover:bg-white/10 text-gray-400'
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                    title={copiedIndex === index ? 'Copied!' : 'Copy query'}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <pre className={`text-xs font-mono whitespace-pre-wrap break-words mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {item.query}
                </pre>

                {item.error && (
                  <div className={`text-xs p-2 rounded-lg mt-2 ${
                    theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
                  }`}>
                    <span className="font-semibold">Error:</span> {item.error}
                  </div>
                )}

                {item.rows_affected !== undefined && (
                  <div className={`text-xs mt-2 flex items-center gap-2 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    <span className="w-1 h-1 rounded-full bg-green-500"></span>
                    {item.rows_affected} row{item.rows_affected !== 1 ? 's' : ''} affected
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${theme === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'dark' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(139, 92, 246, 0.4)'};
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}