'use client';

import { useState, useEffect } from 'react';
import { getTables, getTableInfo } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import { Database, ChevronRight, ChevronDown, Table, Loader2 } from 'lucide-react';

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
            {tables.map((table