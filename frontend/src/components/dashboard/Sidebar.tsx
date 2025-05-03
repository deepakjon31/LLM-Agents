'use client';

import React from 'react';
import { FaDatabase, FaFileAlt, FaHistory, FaFolderOpen, FaSignOutAlt, FaServer, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

type ActiveTab = 'sql-chat' | 'document-chat' | 'history' | 'documents' | 'database-connections';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onSignOut: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onSignOut,
  isExpanded,
  onToggleExpand 
}) => {
  const navItems = [
    { id: 'sql-chat', label: 'SQL Chat', icon: <FaDatabase /> },
    { id: 'document-chat', label: 'Document Chat', icon: <FaFileAlt /> },
    { id: 'history', label: 'Chat History', icon: <FaHistory /> },
    { id: 'documents', label: 'Manage Documents', icon: <FaFolderOpen /> },
    { id: 'database-connections', label: 'Database Connections', icon: <FaServer /> },
  ];

  return (
    <div className="bg-indigo-800 text-white h-full p-3 flex flex-col overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
        <div className="text-lg font-bold">{isExpanded ? 'AI Chatbot' : 'AI'}</div>
        <button 
          onClick={onToggleExpand}
          className="p-1 rounded-full bg-indigo-700 hover:bg-indigo-600 transition-colors"
          title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? <FaChevronLeft size={14} /> : <FaChevronRight size={14} />}
        </button>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`flex items-center w-full py-2 px-2 text-sm rounded transition-colors ${
                  activeTab === item.id
                    ? 'bg-indigo-700 text-white'
                    : 'text-indigo-100 hover:bg-indigo-700'
                }`}
                title={!isExpanded ? item.label : undefined}
              >
                <div className={isExpanded ? "mr-2" : "mx-auto"}>
                  {item.icon}
                </div>
                {isExpanded && <span className="truncate">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="pt-3 mt-3 border-t border-indigo-700">
        <button
          onClick={onSignOut}
          className={`flex items-center w-full py-2 px-2 text-sm text-indigo-100 hover:bg-indigo-700 rounded transition-colors ${!isExpanded && 'justify-center'}`}
          title={!isExpanded ? "Sign out" : undefined}
        >
          <FaSignOutAlt className={isExpanded ? "mr-2" : ""} />
          {isExpanded && "Sign out"}
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 