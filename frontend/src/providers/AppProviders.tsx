'use client';

import React from 'react';
import { SessionProvider } from "next-auth/react";

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}; 