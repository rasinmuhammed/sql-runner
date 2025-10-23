'use client';

import { useState, useEffect } from 'react';
import { getTables, getTableInfo } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { Database, ChevronRight, ChevronDown, Table, Loader2, Key } from 'lucide-react';

export default function TablesSidebar({ onTableSelect }) {
  const { theme } = useTheme();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingInfo, setLoadingInfo] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await getTables();
      setTables(response.tables || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableClick = async (tableName) => {
    if (selectedTable === tableName) {
      setSelectedTable(null);
      setTableInfo(null);
      return;
    }

    setSelectedTable(tableName);
    setLoadingInfo(true);
    onTableSelect(tableName);

    try {
      const info = await getTableInfo(tableName);
      setTableInfo(info);
    } catch (error) {
      console.error('Error fetching table info:', error);
    } finally {
      setLoadingInfo(false);
    }
  };

  const getTypeColor = (type) => {
    const typeUpper = type.toUpperCase();
    if (typeUpper.includes('INT')) return 'text-blue-500';
    if (typeUpper.includes('VARCHAR') || typeUpper.includes('TEXT')) return 'text-green-500';
    if (typeUpper.includes('DATE') || typeUpper.includes('TIME')) return 'text-purple-500';
    return 'text-gray-500';
  };

  return (
    <div className={`h-full ${
      theme === 'dark'
        ? 'bg-gray-800/50 border-gray-700/50'
        : 'bg-white/70 border-gray-200'
    } backdrop-blur-xl border-r transition-colors duration-300`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${
        theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            theme === 'dark' ? 'bg-violet-500/20' : 'bg-violet-100'
          }`}>
            <Database className={`w-5 h-5 ${
              theme === 'dark' ? 'text-violet-400' : 'text-violet-600'
            }`} />
          </div>
          <div>
            <h2 className={`font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Database Tables
            </h2>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {tables.length} table{tables.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Tables List */}
      <div className="overflow-y-auto h-[calc(100%-81px)]">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className={`w-6 h-6 animate-spin ${
              theme === 'dark' ? 'text-violet-400' : 'text-violet-600'
            }`} />
          </div>
        ) : tables.length === 0 ? (
          <div className="p-6 text-center">
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              No tables found
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {tables.map((tableName) => (
              <div key={tableName}>
                {/* Table Name Button */}
                <button
                  onClick={() => handleTableClick(tableName)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                    selectedTable === tableName
                      ? theme === 'dark'
                        ? 'bg-violet-500/20 border-violet-500/50'
                        : 'bg-violet-50 border-violet-200'
                      : theme === 'dark'
                      ? 'bg-gray-700/30 hover:bg-gray-700/50 border-transparent'
                      : 'bg-white hover:bg-gray-50 border-transparent'
                  } border`}
                >
                  <div className="flex items-center gap-2">
                    <Table className={`w-4 h-4 ${
                      selectedTable === tableName
                        ? theme === 'dark' ? 'text-violet-400' : 'text-violet-600'
                        : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {tableName}
                    </span>
                  </div>
                  {selectedTable === tableName ? (
                    <ChevronDown className={`w-4 h-4 ${
                      theme === 'dark' ? 'text-violet-400' : 'text-violet-600'
                    }`} />
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                  )}
                </button>

                {/* Table Details */}
                {selectedTable === tableName && (
                  <div className={`mt-2 ml-2 p-3 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700/50'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    {loadingInfo ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className={`w-5 h-5 animate-spin ${
                          theme === 'dark' ? 'text-violet-400' : 'text-violet-600'
                        }`} />
                      </div>
                    ) : tableInfo ? (
                      <>
                        {/* Schema */}
                        <div className="mb-3">
                          <h4 className={`text-xs font-semibold uppercase mb-2 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Schema
                          </h4>
                          <div className="space-y-1">
                            {tableInfo.columns.map((column, index) => (
                              <div
                                key={index}
                                className={`flex items-center justify-between text-xs p-2 rounded ${
                                  theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {column.primary_key && (
                                    <Key className="w-3 h-3 text-yellow-500" />
                                  )}
                                  <span className={`font-mono ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                  }`}>
                                    {column.name}
                                  </span>
                                </div>
                                <span className={`font-mono ${getTypeColor(column.type)}`}>
                                  {column.type}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sample Data */}
                        {tableInfo.sample_data && tableInfo.sample_data.length > 0 && (
                          <div>
                            <h4 className={`text-xs font-semibold uppercase mb-2 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              Sample Data ({tableInfo.sample_data.length} rows)
                            </h4>
                            <div className="space-y-2">
                              {tableInfo.sample_data.map((row, rowIndex) => (
                                <div
                                  key={rowIndex}
                                  className={`p-2 rounded text-xs ${
                                    theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'
                                  }`}
                                >
                                  {Object.entries(row).map(([key, value], colIndex) => (
                                    <div key={colIndex} className="flex gap-2 py-0.5">
                                      <span className={`font-semibold min-w-[80px] ${
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                      }`}>
                                        {key}:
                                      </span>
                                      <span className={`font-mono ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                      }`}>
                                        {value !== null && value !== undefined ? String(value) : 'NULL'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className={`text-xs text-center py-2 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Failed to load table info
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}