'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { CheckCircle, XCircle, Table, Clock, AlertTriangle } from 'lucide-react';

export default function ResultsTable({ results }) {
  const { theme } = useTheme();

  if (!results) return null;

  // Error state
  if (!results.success) {
    return (
      <div className={`${
        theme === 'dark'
          ? 'bg-gray-800/50 border-gray-700/50'
          : 'bg-white/70 border-gray-200'
      } backdrop-blur-xl border rounded-2xl shadow-xl p-6 transition-colors duration-300`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/20 rounded-lg">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Query Error
            </h3>
            <p className={`${
              theme === 'dark' ? 'text-red-300' : 'text-red-600'
            } font-mono text-sm`}>
              {results.error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state with no data
  if (!results.data || results.data.length === 0) {
    return (
      <div className={`${
        theme === 'dark'
          ? 'bg-gray-800/50 border-gray-700/50'
          : 'bg-white/70 border-gray-200'
      } backdrop-blur-xl border rounded-2xl shadow-xl p-6 transition-colors duration-300`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-yellow-500/20 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              No Results
            </h3>
            <p className={`${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Query executed successfully but returned no data.
            </p>
            {results.execution_time && (
              <p className={`text-sm mt-2 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>
                Execution time: {(results.execution_time * 1000).toFixed(2)}ms
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const columns = results.columns || Object.keys(results.data[0]);

  return (
    <div className={`${
      theme === 'dark'
        ? 'bg-gray-800/50 border-gray-700/50'
        : 'bg-white/70 border-gray-200'
    } backdrop-blur-xl border rounded-2xl shadow-xl transition-colors duration-300 overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${
        theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            theme === 'dark' ? 'bg-green-500/20' : 'bg-green-100'
          }`}>
            <CheckCircle className={`w-5 h-5 ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`} />
          </div>
          <div>
            <h2 className={`font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Query Results
            </h2>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {results.data.length} row{results.data.length !== 1 ? 's' : ''} returned
              {results.execution_time && ` • ${(results.execution_time * 1000).toFixed(2)}ms`}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={
            theme === 'dark'
              ? 'bg-gray-900/50'
              : 'bg-gray-50'
          }>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${
            theme === 'dark' ? 'divide-gray-700/50' : 'divide-gray-200'
          }`}>
            {results.data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`${
                  theme === 'dark'
                    ? 'hover:bg-gray-700/30'
                    : 'hover:bg-gray-50'
                } transition-colors`}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-6 py-4 text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                    }`}
                  >
                    {row[column] !== null && row[column] !== undefined
                      ? String(row[column])
                      : <span className={theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}>NULL</span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}