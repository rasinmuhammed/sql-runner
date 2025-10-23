'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QueryEditor from '@/components/QueryEditor';
import ResultsTable from '@/components/ResultsTable';
import TablesSidebar from '@/components/TablesSidebar';
import QueryHistory from '@/components/QueryHistory';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { LogOut, Database, Clock, Menu, X } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [queryResults, setQueryResults] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [refreshHistory, setRefreshHistory] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    
    if (!token) {
      router.push('/login');
    } else {
      setUsername(storedUsername || 'User');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.push('/login');
  };

  const handleQueryExecuted = (results) => {
    setQueryResults(results);
    setRefreshHistory(prev => prev + 1);
  };

  const handleTableSelect = (table) => {
    setSelectedTable(table);
  };

  const handleHistoryQuerySelect = (query) => {
    // This will be handled by QueryEditor component
    setShowHistory(false);
  };

  return (
    <div className={`min-h-screen ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900' 
        : 'bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50'
    } transition-colors duration-300`}>
      {/* Header */}
      <header className={`${
        theme === 'dark' 
          ? 'bg-gray-900/50 border-gray-700/50' 
          : 'bg-white/50 border-gray-200'
      } backdrop-blur-xl border-b sticky top-0 z-50 transition-colors duration-300`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`lg:hidden p-2 rounded-lg ${
                  theme === 'dark'
                    ? 'hover:bg-white/10 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                } transition`}
              >
                {showSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    SQL Runner
                  </h1>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Welcome, {username}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } transition`}
              >
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </button>

              <ThemeToggle />

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className={`${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative z-40 w-80 h-full transition-transform duration-300`}>
          <TablesSidebar onTableSelect={handleTableSelect} />
        </aside>

        {/* Main Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Query Editor */}
            <QueryEditor 
              onQueryExecuted={handleQueryExecuted}
              selectedTable={selectedTable}
            />

            {/* Results Display */}
            {queryResults && <ResultsTable results={queryResults} />}
          </div>
        </main>

        {/* Query History Sidebar */}
        {showHistory && (
          <aside className="fixed right-0 top-[73px] h-[calc(100vh-73px)] w-80 z-40">
            <QueryHistory 
              onClose={() => setShowHistory(false)}
              onQuerySelect={handleHistoryQuerySelect}
              refresh={refreshHistory}
            />
          </aside>
        )}
      </div>

      {/* Overlay for mobile */}
      {showSidebar && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
}