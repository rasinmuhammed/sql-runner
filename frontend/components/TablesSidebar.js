'use client';

import { useState, useEffect } from 'react';
import { getTables, getTableInfo } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { Database, ChevronRight, ChevronDown, Table, Loader2, Key, RefreshCw } from 'lucide-react';

export default function TablesSidebar({ onTableSelect, refreshTrigger }) {
  const { theme } = useTheme();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchTables();
  }, [refreshTrigger]);

  const fetchTables = async (showRefreshAnimation = false) => {
    if (showRefreshAnimation) {
      setIsRefreshing(true);
    }
    
    try {
      const response = await getTables();
      const newTables = response.tables || [];
      setTables(newTables);
      
      // If currently selected table no longer exists, clear selection
      if (selectedTable && !newTables.includes(selectedTable)) {
        setSelectedTable(null);
        setTableInfo(null);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
      if (showRefreshAnimation) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  const handleRefresh = () => {
    fetchTables(true);
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

  return (
    <div className={`h-full ${
      theme === 'dark'
        ? 'bg-gray-800/50 border-gray-700/50'
        : 'bg-white/70 border-gray-200'
    } backdrop-blur-xl border-r transition-all duration-300`}>
      {/* Header */}
      <div className={`px-4 sm:px-6 py-4 border-b ${
        theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`p-1.5 sm:p-2 rounded-lg transition-all duration-300 ${
              theme === 'dark' ? 'bg-violet-500/20' : 'bg-violet-100'
            }`}>
              <Database className={`w-4 h-4 sm:w-5 sm:h-5 ${
                theme === 'dark' ? 'text-violet-400' : 'text-violet-600'
              }`} />
            </div>
            <div>
              <h2 className={`text-sm sm:text-base font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Tables
              </h2>
              <p className={`text-xs sm:text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {tables.length} table{tables.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
              theme === 'dark'
                ? 'hover:bg-white/10 text-violet-400'
                : 'hover:bg-gray-100 text-violet-600'
            } disabled:opacity-50`}
            title="Refresh tables"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tables List */}
      <div className="overflow-y-auto h-[calc(100%-81px)] custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className={`w-6 h-6 animate-spin ${
              theme === 'dark' ? 'text-violet-400' : 'text-violet-600'
            }`} />
          </div>
        ) : tables.length === 0 ? (
          <div className="p-4 sm:p-6 text-center">
            <Database className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              No tables found
            </p>
            <p className={`text-xs ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Create your first table to get started
            </p>
          </div>
        ) : (
          <div className="p-2 sm:p-4 space-y-2">
            {tables.map((tableName) => (
              <div key={tableName} className="animate-fade-in">
                {/* Table Name Button */}
                <button
                  onClick={() => handleTableClick(tableName)}
                  className={`w-full flex items-center justify-between p-2 sm:p-3 rounded-xl transition-all duration-200 ${
                    selectedTable === tableName
                      ? theme === 'dark'
                        ? 'bg-linear-to-r from-violet-500/20 to-purple-500/20 border-violet-500/50 shadow-lg'
                        : 'bg-linear-to-r from-violet-50 to-purple-50 border-violet-200 shadow-md'
                      : theme === 'dark'
                      ? 'bg-gray-700/30 hover:bg-gray-700/50 border-transparent hover:border-gray-600/50'
                      : 'bg-white hover:bg-gray-50 border-transparent hover:border-gray-200'
                  } border hover:scale-[1.02] hover:shadow-md active:scale-[0.98]`}
                >
                  <div className="flex items-center gap-2">
                    <Table className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                      selectedTable === tableName
                        ? theme === 'dark' ? 'text-violet-400' : 'text-violet-600'
                        : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                    <span className={`text-xs sm:text-sm font-medium truncate ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {tableName}
                    </span>
                  </div>
                  {selectedTable === tableName ? (
                    <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform shrink-0 ${
                      theme === 'dark' ? 'text-violet-400' : 'text-violet-600'
                    }`} />
                  ) : (
                    <ChevronRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                  )}
                </button>

                {/* Table Details */}
                {selectedTable === tableName && (
                  <div className={`mt-2 ml-1 sm:ml-2 p-2 sm:p-3 rounded-xl border animate-expand max-h-[400px] overflow-y-auto custom-scrollbar ${
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
                          <h4 className={`text-[10px] sm:text-xs font-semibold uppercase mb-2 flex items-center gap-1 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            <span className="w-1 h-1 rounded-full bg-violet-500"></span>
                            Schema
                          </h4>
                          <div className="space-y-1">
                            {tableInfo.columns.map((column, index) => (
                              <div
                                key={index}
                                className={`flex items-center justify-between text-[10px] sm:text-xs p-1.5 sm:p-2 rounded-lg transition-all hover:scale-[1.02] ${
                                  theme === 'dark' ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-white hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                  {column.primary_key && (
                                    <Key className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-500 shrink-0" title="Primary Key" />
                                  )}
                                  <span className={`font-mono font-medium truncate ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                  }`}>
                                    {column.name}
                                  </span>
                                  {column.notnull && (
                                    <span className="text-[8px] sm:text-[10px] px-1 rounded bg-orange-500/20 text-orange-500 whitespace-nowrap shrink-0">
                                      NOT NULL
                                    </span>
                                  )}
                                </div>
                                <span className={`font-mono text-[10px] sm:text-xs font-semibold ml-2 shrink-0 ${
                                  column.type.toUpperCase().includes('INT') ? 'text-blue-500' :
                                  column.type.toUpperCase().includes('VARCHAR') || column.type.toUpperCase().includes('TEXT') ? 'text-green-500' :
                                  column.type.toUpperCase().includes('DATE') || column.type.toUpperCase().includes('TIME') ? 'text-purple-500' :
                                  column.type.toUpperCase().includes('REAL') || column.type.toUpperCase().includes('FLOAT') ? 'text-cyan-500' :
                                  'text-gray-500'
                                }`}>
                                  {column.type}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sample Data */}
                        {tableInfo.sample_data && tableInfo.sample_data.length > 0 && (
                          <div>
                            <h4 className={`text-[10px] sm:text-xs font-semibold uppercase mb-2 flex items-center gap-1 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              <span className="w-1 h-1 rounded-full bg-green-500"></span>
                              Sample Data ({tableInfo.sample_data.length} rows)
                            </h4>
                            <div className="space-y-2">
                              {tableInfo.sample_data.map((row, rowIndex) => (
                                <div
                                  key={rowIndex}
                                  className={`p-1.5 sm:p-2 rounded-lg text-[10px] sm:text-xs transition-all hover:scale-[1.02] ${
                                    theme === 'dark' ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-white hover:bg-gray-50'
                                  }`}
                                >
                                  {Object.entries(row).map(([key, value], colIndex) => (
                                    <div key={colIndex} className="flex gap-1 sm:gap-2 py-0.5">
                                      <span className={`font-semibold min-w-[60px] sm:min-w-[80px] ${
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                      }`}>
                                        {key}:
                                      </span>
                                      <span className={`font-mono break-all ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                      }`}>
                                        {value !== null && value !== undefined ? String(value) : (
                                          <span className="text-gray-500 italic">NULL</span>
                                        )}
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
                      <div className={`text-xs text-center py-4 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <p className="mb-1">Failed to load table info</p>
                        <button
                          onClick={() => handleTableClick(tableName)}
                          className="text-violet-500 hover:text-violet-600 underline"
                        >
                          Retry
                        </button>
                      </div>
                    )}
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
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @keyframes expand {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 400px;
          }
        }
        .animate-expand {
          animation: expand 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}