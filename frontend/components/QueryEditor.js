'use client';

import { useState, useEffect } from 'react';
import { executeQuery } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { Play, Loader2, Code } from 'lucide-react';

export default function QueryEditor({ onQueryExecuted, selectedTable }) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedTable) {
      setQuery(`SELECT * FROM ${selectedTable} LIMIT 10;`);
    }
  }, [selectedTable]);

  const handleExecute = async () => {
    if (!query.trim()) {
      onQueryExecuted({
        success: false,
        error: 'Please enter a query'
      });
      return;
    }

    setLoading(true);
    try {
      const result = await executeQuery(query);
      onQueryExecuted(result);
    } catch (error) {
      onQueryExecuted({
        success: false,
        error: error.message || 'Failed to execute query'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    // Execute on Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }

    // Tab support
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = query.substring(0, start) + '  ' + query.substring(end);
      setQuery(newValue);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className={`${
      theme === 'dark'
        ? 'bg-gray-800/50 border-gray-700/50'
        : 'bg-white/70 border-gray-200'
    } backdrop-blur-xl border rounded-2xl shadow-xl transition-colors duration-300`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${
        theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            theme === 'dark' ? 'bg-violet-500/20' : 'bg-violet-100'
          }`}>
            <Code className={`w-5 h-5 ${
              theme === 'dark' ? 'text-violet-400' : 'text-violet-600'
            }`} />
          </div>
          <div>
            <h2 className={`font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Query Editor
            </h2>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Press Ctrl+Enter to execute
            </p>
          </div>
        </div>

        <button
          onClick={handleExecute}
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Query
            </>
          )}
        </button>
      </div>

      {/* Editor */}
      <div className="p-6">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your SQL query here...&#10;&#10;Example:&#10;SELECT * FROM Customers;&#10;&#10;SELECT c.first_name, o.item FROM Customers c&#10;JOIN Orders o ON c.customer_id = o.customer_id;"
          className={`w-full h-64 px-4 py-3 font-mono text-sm ${
            theme === 'dark'
              ? 'bg-gray-900/50 text-gray-100 placeholder-gray-500'
              : 'bg-gray-50 text-gray-900 placeholder-gray-400'
          } border ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition-colors duration-300`}
          spellCheck="false"
        />

        <div className={`mt-4 flex items-center justify-between text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <p>
            Tip: Use <kbd className={`px-2 py-1 rounded ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}>Ctrl</kbd> + <kbd className={`px-2 py-1 rounded ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}>Enter</kbd> to execute
          </p>
          <p className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}>
            {query.length} characters
          </p>
        </div>
      </div>
    </div>
  );
}