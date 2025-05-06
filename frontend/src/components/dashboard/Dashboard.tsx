'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from './Sidebar';
import UnifiedChat from '../chat/UnifiedChat';
import History from '../history/History';
import AdminPanel from '../admin/AdminPanel';
import { FaBars, FaTimes, FaHistory, FaUpload, FaSignOutAlt } from 'react-icons/fa';
import dynamic from 'next/dynamic';

type ActiveTab = 'chat' | 'history' | 'data-ingestion' | 'extract' | 'admin';

// Import the DataIngestion component dynamically to fix module not found error
const DataIngestion = dynamic(() => import('../data/DataIngestion'), {
  loading: () => <p>Loading data ingestion...</p>,
});

// Import the Extract component dynamically
const Extract = dynamic(() => import('../extract/Extract'), {
  loading: () => <p>Loading document extraction tools...</p>,
});

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [documentRefreshTrigger, setDocumentRefreshTrigger] = useState(0);
  
  // Handle document upload success - trigger refresh
  const handleDocumentUploadSuccess = () => {
    setDocumentRefreshTrigger(prev => prev + 1);
  };
  
  useEffect(() => {
    // Get the tab from URL query
    const tabParam = searchParams?.get('tab') as ActiveTab | null;
    if (tabParam) {
      setActiveTab(tabParam);
    }
    
    // Handle window resize for mobile
    const handleResize = () => {
      if (window.innerWidth < 640) { // sm breakpoint
        setSidebarVisible(false);
      } else {
        setSidebarVisible(true);
      }
    };
    
    // Set initial state
    handleResize();
    
    // Listen for resize events
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [searchParams]);
  
  useEffect(() => {
    // Redirect to login if no session
    if (!session) {
      router.push('/login');
    }
  }, [session, router]);
  
  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
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
      case 'data-ingestion':
        return <DataIngestion onDocumentUploadSuccess={handleDocumentUploadSuccess} documentRefreshTrigger={documentRefreshTrigger} />;
      case 'extract':
        return <Extract />;
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
                {activeTab === 'data-ingestion' && 'Data Ingestion'}
                {activeTab === 'extract' && 'Document Extraction'}
                {activeTab === 'admin' && 'Admin Panel'}
              </h1>
            </div>
            
            <div className="flex items-center">
              {session?.user && (
                <div className="text-sm text-right">
                  <div className="font-medium text-gray-900">
                    {session.user.name || (session.user as any)?.mobile_number || 'User'}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {session.user.role === 'admin' ? 'Administrator' : 'User'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto p-4">
          {renderContent()}
        </main>
      </div>
    </div>
  );
} 