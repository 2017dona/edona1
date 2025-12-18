'use client';

import { useState } from 'react';

import Sidebar from '@/components/Sidebar';

export default function AppShell({
  children
}: {
  children: React.ReactNode;
}) {
  const [activeKey, setActiveKey] = useState('dashboard');

  return (
    <div className="min-h-dvh bg-slate-50 md:flex">
      <Sidebar activeKey={activeKey} onSelect={setActiveKey} />
      <div className="flex-1">
        <div className="mx-auto max-w-6xl p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
