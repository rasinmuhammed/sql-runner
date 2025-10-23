'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QueryEditor from '@/components/QueryEditor';
import ResultsTable from '@/components/ResultsTable';
import TablesSidebar from '@/components/TablesSidebar';
import QueryHistory from '@/components/QueryHistory';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { LogOut, Database, Clock, Menu, X, Sparkles, History, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [queryResults, setQueryResults] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showHistory, setShowHistory] = useState(true);
  const [showTablesSidebar, setShowTablesSidebar] = useState(true);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [refreshTables, setRefreshTables] = useState(0);

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
    
    // Check if query was a DDL operation (CREATE, DROP, ALTER)
    if (results.success && results.data && results.data.length > 0) {
      const firstResult = results.data[0];
      if (firstResult.type && ['create_table', 'drop_table', 'alter_table'].includes(firstResult.type)) {
        // Refresh tables list after a brief delay to ensure DB is updated
        setTimeout(() => {
          setRefreshTables(prev => prev + 1);
        }, 300);
      }
    }
  };

  const handleTableSelect = (table) => {
    setSelectedTable(table);
  };

  const handleHistoryQuerySelect = (query) => {
    // Query will be handled in QueryHistory component
  };

  return (
    <div className={`min-h-screen ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900' 
        : 'bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50'
    } transition-colors duration-300`}>
      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 ${
          theme === 'dark' ? 'bg-violet-500/10' : 'bg-violet-200/30'
        } rounded-full mix-blend-multiply filter blur-3xl animate-blob`}></div>
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 ${
          theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-200/30'
        } rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000`}></div>
        <div className={`absolute top-1/2 left-1/2 w-96 h-96 ${
          theme === 'dark' ? 'bg-indigo-500/10' : 'bg-indigo-200/30'
        } rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000`}></div>
      </div>

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
                onClick={() => setShowTablesSidebar(!showTablesSidebar)}
                className={`p-2 rounded-lg ${
                  theme === 'dark'
                    ? 'hover:bg-white/10 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                } transition-all duration-200 hover:scale-105`}
                title={showTablesSidebar ? 'Hide tables' : 'Show tables'}
              >
                {showTablesSidebar ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className={`text-xl font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      SQL Runner
                    </h1>
                    <Sparkles className={`w-4 h-4 ${
                      theme === 'dark' ? 'text-violet-400' : 'text-violet-600'
                    } animate-pulse`} />
                  </div>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Welcome, <span className="font-semibold">{username}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 border ${
                  showHistory
                    ? theme === 'dark'
                      ? 'bg-violet-500/20 border-violet-500/50 text-white shadow-lg'
                      : 'bg-violet-100 border-violet-200 text-violet-700 shadow-md'
                    : theme === 'dark'
                    ? 'bg-white/10 hover:bg-white/20 text-white border-transparent'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-transparent'
                }`}
                title={showHistory ? 'Hide history' : 'Show history'}
              >
                {showHistory ? <ChevronRight className="w-4 h-4" /> : <History className="w-4 h-4" />}
                <span className="hidden sm:inline">History</span>
              </button>

              <ThemeToggle />

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)] relative">
        {/* Tables Sidebar */}
        <aside className={`${
          showTablesSidebar ? 'translate-x-0 w-80' : '-translate-x-full w-0'
        } transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0`}>
          <div className="w-80">
            <TablesSidebar 
              onTableSelect={handleTableSelect} 
              refreshTrigger={refreshTables}
            />
          </div>
        </aside>

        {/* Main Area */}
        <main className={`flex-1 overflow-auto relative transition-all duration-300 ${
          !showTablesSidebar && !showHistory ? 'max-w-full' : ''
        }`}>
          <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
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
        <aside className={`${
          showHistory ? 'translate-x-0 w-96' : 'translate-x-full w-0'
        } transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0`}>
          <div className="w-96 h-full">
            <QueryHistory 
              onClose={() => setShowHistory(false)}
              onQuerySelect={handleHistoryQuerySelect}
              refresh={refreshHistory}
            />
          </div>
        </aside>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}