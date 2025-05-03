'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from './Sidebar';
import SQLChat from '../chat/SQLChat';
import DocumentChat from '../chat/DocumentChat';
import History from '../history/History';
import DocumentUpload from '../documents/DocumentUpload';
import DocumentList from '../documents/DocumentList';
import DatabaseConnections from '../database/DatabaseConnections';

type ActiveTab = 'sql-chat' | 'document-chat' | 'history' | 'documents' | 'database-connections';

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ActiveTab>('sql-chat');
  const [documentRefreshTrigger, setDocumentRefreshTrigger] = useState(0);

  useEffect(() => {
    // Check for 'tab' parameter in URL
    const tabParam = searchParams.get('tab');
    if (tabParam && ['sql-chat', 'document-chat', 'history', 'documents', 'database-connections'].includes(tabParam)) {
      setActiveTab(tabParam as ActiveTab);
    }
  }, [searchParams]);

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

  const renderContent = () => {
    switch (activeTab) {
      case 'sql-chat':
        return <SQLChat />;
      case 'document-chat':
        return <DocumentChat />;
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
      default:
        return <SQLChat />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} onSignOut={handleSignOut} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-800">
              {activeTab === 'sql-chat' && 'SQL Database Chat'}
              {activeTab === 'document-chat' && 'Document Chat'}
              {activeTab === 'history' && 'Chat History'}
              {activeTab === 'documents' && 'Manage Documents'}
              {activeTab === 'database-connections' && 'Database Connections'}
            </h1>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-4">
                {session?.user?.email || session?.user?.name || 'User'}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
} 