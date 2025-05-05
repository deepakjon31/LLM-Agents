'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from './Sidebar';
import UnifiedChat from '../chat/UnifiedChat';
import History from '../history/History';
import DocumentUpload from '../documents/DocumentUpload';
import DocumentList from '../documents/DocumentList';
import DatabaseConnections from '../database/DatabaseConnections';
import AdminPanel from '../admin/AdminPanel';
import { FaBars, FaTimes, FaDatabase, FaFileAlt, FaHistory, FaFolderOpen, FaServer, FaSignOutAlt, FaChevronRight } from 'react-icons/fa';

type ActiveTab = 'chat' | 'history' | 'documents' | 'database-connections' | 'admin';

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [documentRefreshTrigger, setDocumentRefreshTrigger] = useState(0);
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    // Initialize from localStorage if available, otherwise default to true
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarVisible');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  useEffect(() => {
    // Check for 'tab' parameter in URL
    const tabParam = searchParams.get('tab');
    if (tabParam && ['chat', 'history', 'documents', 'database-connections', 'admin'].includes(tabParam)) {
      setActiveTab(tabParam as ActiveTab);
    } else if (tabParam && ['sql-chat', 'document-chat'].includes(tabParam)) {
      // Handle legacy URLs
      setActiveTab('chat');
    }
  }, [searchParams]);

  useEffect(() => {
    // Save sidebar state to localStorage whenever it changes
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarVisible', sidebarVisible.toString());
    }
  }, [sidebarVisible]);

  // Add responsive sidebar handling
  useEffect(() => {
    const handleResize = () => {
      // No actions needed here, just keeping the event listener
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const handleDocumentUploadSuccess = () => {
    // Increment the trigger to cause DocumentList to refresh
    setDocumentRefreshTrigger(prev => prev + 1);
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    // Update URL to reflect the current tab
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };

  const toggleSidebar = () => {
    const newState = !sidebarVisible;
    setSidebarVisible(newState);
    console.log('Toggling sidebar:', sidebarVisible, '->', newState);
    // No need to dispatch resize event as it could cause an infinite loop
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <UnifiedChat />;
      case 'history':
        return <History />;
      case 'documents':
        return (
          <div className="space-y-6">
            <DocumentUpload onUploadSuccess={handleDocumentUploadSuccess} />
            <DocumentList refreshTrigger={documentRefreshTrigger} />
          </div>
        );
      case 'database-connections':
        return <DatabaseConnections />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <UnifiedChat />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${sidebarVisible ? 'w-48' : 'w-16'} flex-shrink-0`}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
          onSignOut={handleSignOut}
          isExpanded={sidebarVisible}
          onToggleExpand={toggleSidebar}
        />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* User header with profile and role info */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="p-2 mr-4 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 focus:outline-none transition-colors duration-200"
                aria-label={sidebarVisible ? "Collapse sidebar" : "Expand sidebar"}
                title={sidebarVisible ? "Collapse sidebar" : "Expand sidebar"}
              >
                {sidebarVisible ? <FaTimes size={18} /> : <FaBars size={18} />}
              </button>
              <h1 className="text-xl font-semibold text-gray-800">
                {activeTab === 'chat' && 'AI Chatbot'}
                {activeTab === 'history' && 'Chat History'}
                {activeTab === 'documents' && 'Manage Documents'}
                {activeTab === 'database-connections' && 'Database Connections'}
                {activeTab === 'admin' && 'Admin Panel'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm text-gray-600">
                  {session?.user?.email || session?.user?.name || 'User'}
                </span>
                {session?.user?.role && (
                  <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 font-medium">
                    {session.user.role}
                  </span>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="ml-4 p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
                title="Sign out"
              >
                <FaSignOutAlt size={16} />
              </button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto bg-gray-50 p-4 md:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
} 