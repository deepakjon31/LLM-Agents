'use client';

import React from 'react';
import { FaDatabase, FaFileAlt, FaHistory, FaFolderOpen, FaSignOutAlt, FaServer } from 'react-icons/fa';

type ActiveTab = 'sql-chat' | 'document-chat' | 'history' | 'documents' | 'database-connections';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onSignOut: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onSignOut }) => {
  const navItems = [
    { id: 'sql-chat', label: 'SQL Chat', icon: <FaDatabase className="mr-3" /> },
    { id: 'document-chat', label: 'Document Chat', icon: <FaFileAlt className="mr-3" /> },
    { id: 'history', label: 'Chat History', icon: <FaHistory className="mr-3" /> },
    { id: 'documents', label: 'Manage Documents', icon: <FaFolderOpen className="mr-3" /> },
    { id: 'database-connections', label: 'Database Connections', icon: <FaServer className="mr-3" /> },
  ];

  return (
    <div className="bg-indigo-800 text-white w-64 p-6 flex flex-col">
      <div className="text-xl font-bold mb-10">Agentic RAG</div>
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`flex items-center w-full py-2 px-4 rounded transition-colors ${
                  activeTab === item.id
                    ? 'bg-indigo-700 text-white'
                    : 'text-indigo-100 hover:bg-indigo-700'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="pt-6 mt-6 border-t border-indigo-700">
        <button
          onClick={onSignOut}
          className="flex items-center w-full py-2 px-4 text-indigo-100 hover:bg-indigo-700 rounded transition-colors"
        >
          <FaSignOutAlt className="mr-3" />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 