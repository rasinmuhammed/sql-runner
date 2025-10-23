'use client';

import { useState, useEffect } from 'react';
import { getQueryHistory, clearQueryHistory } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { X, Clock, CheckCircle, XCircle, Trash2, Copy } from 'lucide-react';

export default function QueryHistory({ onClose, onQuerySelect, refresh }) {
  const { theme } = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [refresh]);

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

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all query history?')) {
      try {
        await clearQueryHistory();
        setHistory([]);
      } catch (error) {
        console.error('Error clearing history:', error);
      }
    }
  };

  const handleCopyQuery = (query) => {
    navigator.clipboard.writeText(query);
    // You could add a toast notification here
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
    return date.toLocaleDateString();
  };

  return (
    <div className={`h-full ${
      theme === 'dark'
        ? 'bg-gray-800/50 border-gray-700/50'
        : 'bg-white/70 border-gray-200'
    } backdrop-blur-xl border-l transition-colors duration-300`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${
        theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200'
      }`}>
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
              {history.length} quer{history.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className={`p-2 rounded-lg transition ${
                theme === 'dark'
                  ? 'hover:bg-red-500/20 text-red-400'
                  : 'hover:bg-red-50 text-red-600'
              }`}
              title="Clear history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition ${
              theme === 'dark'
                ? 'hover:bg-white/10 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="overflow-y-auto h-[calc(100%-81px)]">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="p-6 text-center">
            <Clock className={`w-12 h-12 mx-auto mb-3 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              No queries yet
            </p>
            <p className={`text-sm mt-1 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Execute a query to see it here
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {history.map((item, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-all ${
                  theme === 'dark'
                    ? 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-700/50'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                } cursor-pointer group`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyQuery(item.query);
                    }}
                    className={`opacity-0 group-hover:opacity-100 p-1 rounded transition ${
                      theme === 'dark'
                        ? 'hover:bg-white/10 text-gray-400'
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                    title="Copy query"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>

                <pre className={`text-xs font-mono whitespace-pre-wrap break-words ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {item.query}
                </pre>

                {item.error && (
                  <p className={`text-xs mt-2 ${
                    theme === 'dark' ? 'text-red-400' : 'text-red-600'
                  }`}>
                    Error: {item.error}
                  </p>
                )}

                {item.rows_affected !== undefined && (
                  <p className={`text-xs mt-2 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    {item.rows_affected} row{item.rows_affected !== 1 ? 's' : ''} affected
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}