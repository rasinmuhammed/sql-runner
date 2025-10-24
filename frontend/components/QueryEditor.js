'use client';

import { useState, useEffect, useRef } from 'react';
import { executeQuery } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { Play, Loader2, Code, Maximize2, Minimize2 } from 'lucide-react';

export default function QueryEditor({ onQueryExecuted, selectedTable }) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [height, setHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const editorRef = useRef(null);
  const resizeRef = useRef(null);

  useEffect(() => {
    if (selectedTable) {
      setQuery(`SELECT * FROM ${selectedTable} LIMIT 10;`);
    }
  }, [selectedTable]);

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const editorRect = editorRef.current.getBoundingClientRect();
      const newHeight = e.clientY - editorRect.top;
      
      if (newHeight >= 200 && newHeight <= 800) {
        setHeight(newHeight);
      }
    };

    const handleTouchMove = (e) => {
      if (!isResizing) return;
      
      const editorRect = editorRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const newHeight = touch.clientY - editorRect.top;
      
      if (newHeight >= 200 && newHeight <= 800) {
        setHeight(newHeight);
      }
    };

    const handleEnd = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isResizing]);

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

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (!isMaximized) {
      setHeight(600);
    } else {
      setHeight(300);
    }
  };

  return (
    <div 
      ref={editorRef}
      className={`${
        theme === 'dark'
          ? 'bg-gray-800/50 border-gray-700/50'
          : 'bg-white/70 border-gray-200'
      } backdrop-blur-xl border rounded-xl sm:rounded-2xl shadow-xl transition-all duration-300 ${
        isResizing ? 'select-none' : ''
      }`}
      style={{ height: isMaximized ? '600px' : `${height}px` }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-3 sm:px-6 py-2 sm:py-4 border-b ${
        theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className={`p-1.5 sm:p-2 rounded-lg ${
            theme === 'dark' ? 'bg-violet-500/20' : 'bg-violet-100'
          }`}>
            <Code className={`w-4 h-4 sm:w-5 sm:h-5 ${
              theme === 'dark' ? 'text-violet-400' : 'text-violet-600'
            }`} />
          </div>
          <div className="min-w-0">
            <h2 className={`text-sm sm:text-base font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Query Editor
            </h2>
            <p className={`text-[10px] sm:text-sm truncate ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <span className="hidden sm:inline">Press Ctrl+Enter to execute • </span>Drag to resize
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={toggleMaximize}
            className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
              theme === 'dark'
                ? 'hover:bg-white/10 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title={isMaximized ? 'Minimize' : 'Maximize'}
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>

          <button
            onClick={handleExecute}
            disabled={loading || !query.trim()}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-1.5 sm:py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                <span className="hidden xs:inline">Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Run</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="px-3 sm:px-6 py-2 sm:py-4 h-[calc(100%-100px)] sm:h-[calc(100%-120px)] overflow-hidden">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your SQL query here...&#10;&#10;Example:&#10;SELECT * FROM Customers;&#10;&#10;SELECT c.first_name, o.item FROM Customers c&#10;JOIN Orders o ON c.customer_id = o.customer_id;"
          className={`w-full h-full px-3 sm:px-4 py-2 sm:py-3 font-mono text-xs sm:text-sm ${
            theme === 'dark'
              ? 'bg-gray-900/50 text-gray-100 placeholder-gray-500'
              : 'bg-gray-50 text-gray-900 placeholder-gray-400'
          } border ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition-colors duration-300`}
          spellCheck="false"
        />
      </div>

      {/* Footer */}
      <div className={`px-3 sm:px-6 py-2 sm:py-3 border-t ${
        theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200'
      } flex items-center justify-between text-[10px] sm:text-sm ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        <p className="truncate">
          <span className="hidden sm:inline">Tip: Use </span>
          <kbd className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`}>Ctrl+Enter</kbd>
          <span className="hidden sm:inline"> to execute</span>
        </p>
        <p className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} text-[10px] sm:text-sm`}>
          {query.length} chars
        </p>
      </div>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        onMouseDown={() => setIsResizing(true)}
        onTouchStart={() => setIsResizing(true)}
        className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize touch-none group ${
          isResizing ? 'bg-violet-500/30' : ''
        } hover:bg-violet-500/20 transition-colors`}
      >
        <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 rounded-full ${
          theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'
        } group-hover:bg-violet-500 transition-colors`} />
      </div>
    </div>
  );
}