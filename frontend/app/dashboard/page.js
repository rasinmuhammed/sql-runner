'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QueryEditor from '@/components/QueryEditor';
import ResultsTable from '@/components/ResultsTable';
import TablesSidebar from '@/components/TablesSidebar';
import QueryHistory from '@/components/QueryHistory';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { LogOut, Database, Clock, Menu, X, Sparkles, History, ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [queryResults, setQueryResults] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showTablesSidebar, setShowTablesSidebar] = useState(false);
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

    // Set default sidebar visibility based on screen size
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowTablesSidebar(true);
        setShowHistory(true); // Show history by default on desktop
      } else {
        setShowTablesSidebar(false);
        setShowHistory(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    // On mobile, close tables sidebar after selection
    if (window.innerWidth < 1024) {
      setShowTablesSidebar(false);
    }
  };

  const handleHistoryQuerySelect = (query) => {
    // Query will be handled in QueryHistory component
    // On mobile, close history sidebar after selection
    if (window.innerWidth < 768) {
      setShowHistory(false);
    }
  };

  const toggleTablesSidebar = () => {
    setShowTablesSidebar(!showTablesSidebar);
    // On mobile, close history when opening tables
    if (window.innerWidth < 1024 && !showTablesSidebar) {
      setShowHistory(false);
    }
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
    // On mobile, close tables when opening history
    if (window.innerWidth < 1024 && !showHistory) {
      setShowTablesSidebar(false);
    }
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

    {  /* Header */}
      <header className={`${
        theme === 'dark' 
          ? 'bg-gray-900/50 border-gray-700/50' 
          : 'bg-white/50 border-gray-200'
      } backdrop-blur-xl border-b sticky top-0 z-50 transition-colors duration-300`}>
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Logo & Title */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <button
                onClick={toggleTablesSidebar}
                className={`p-2 rounded-lg flex-shrink-0 ${
                  theme === 'dark'
                    ? 'hover:bg-white/10 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                } transition-all duration-200 hover:scale-105 active:scale-95`}
                title={showTablesSidebar ? 'Hide tables' : 'Show tables'}
              >
                {showTablesSidebar ? <ChevronLeft className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg flex-shrink-0">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className={`text-xl sm:text-2xl font-bold truncate ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      SQL Runner
                    </h1>
                    <Sparkles className={`w-4 h-4 flex-shrink-0 ${
                      theme === 'dark' ? 'text-violet-400' : 'text-violet-600'
                    } animate-pulse`} />
                  </div>
                  <p className={`text-xs sm:text-sm mt-0.5 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Execute queries, explore data, build amazing things
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={toggleHistory}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 border text-sm font-medium ${
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
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-black hover:bg-red-600 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Welcome Message - Below main header */}
          <div className={`mt-3 pt-3 border-t ${
            theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200'
          }`}>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <span className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Welcome back, {username}!</span>
              {' '}
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                Ready to run some powerful queries?
              </span>
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)] sm:h-[calc(100vh-73px)] relative">
        {/* Tables Sidebar - Mobile: Overlay, Desktop: Side panel */}
        <aside className={`${
          showTablesSidebar ? 'translate-x-0' : '-translate-x-full'
        } fixed lg:relative z-40 h-full w-64 sm:w-80 lg:w-80 transition-all duration-300 ease-in-out ${
          showTablesSidebar ? 'shadow-2xl lg:shadow-none' : ''
        }`}>
          <TablesSidebar 
            onTableSelect={handleTableSelect} 
            refreshTrigger={refreshTables}
          />
        </aside>

        {/* Main Area - Expands when history is closed */}
        <main className={`flex-1 overflow-auto relative transition-all duration-300 ${
          !showHistory ? 'lg:mr-0' : ''
        }`}>
          <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
            {/* Query Editor */}
            <QueryEditor 
              onQueryExecuted={handleQueryExecuted}
              selectedTable={selectedTable}
            />

            {/* Results Display */}
            {queryResults && <ResultsTable results={queryResults} />}
          </div>
        </main>

        {/* Query History Sidebar - Mobile: Overlay, Desktop: Side panel */}
        <aside className={`${
          showHistory ? 'translate-x-0' : 'translate-x-full'
        } fixed lg:relative z-40 right-0 h-full w-80 sm:w-96 transition-all duration-300 ease-in-out ${
          showHistory ? 'shadow-2xl lg:shadow-none' : ''
        }`}>
          <QueryHistory 
            onClose={() => setShowHistory(false)}
            onQuerySelect={handleHistoryQuerySelect}
            refresh={refreshHistory}
          />
        </aside>
      </div>

      {/* Mobile Overlay for Sidebars */}
      {(showTablesSidebar || showHistory) && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm animate-fade-in"
          onClick={() => {
            setShowTablesSidebar(false);
            setShowHistory(false);
          }}
        />
      )}

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
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}