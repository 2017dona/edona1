'use client';

import { useMemo, useState } from 'react';

import { Icon } from '@/components/ui/Icon';

type NavItem = {
  key: string;
  label: string;
  icon:
    | 'dashboard'
    | 'tasks'
    | 'phone'
    | 'mail'
    | 'bot'
    | 'settings';
  soon?: boolean;
};

const NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'tasks', label: 'Tasks', icon: 'tasks' },
  { key: 'call-agents', label: 'Call Agents', icon: 'phone', soon: true },
  { key: 'emails', label: 'Emails', icon: 'mail', soon: true },
  { key: 'ai-agents', label: 'AI Agents', icon: 'bot', soon: true }
];

export default function Sidebar({
  activeKey,
  onSelect
}: {
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const widthClass = useMemo(
    () => (collapsed ? 'w-[76px]' : 'w-[260px]'),
    [collapsed]
  );

  return (
    <aside
      className={`sticky top-0 hidden h-dvh border-r border-slate-200 bg-white md:block ${widthClass}`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 p-4">
          <button
            type="button"
            className="flex items-center gap-3"
            onClick={() => onSelect('dashboard')}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <Icon name="spark" className="h-6 w-6" />
            </div>
            {!collapsed ? (
              <div className="leading-tight">
                <div className="text-sm font-semibold">TaskFlow</div>
                <div className="text-xs text-slate-500">AI-Powered Tasks</div>
              </div>
            ) : null}
          </button>

          <button
            type="button"
            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>

        <nav className="flex-1 px-3">
          <div className="mt-2 flex flex-col gap-1">
            {NAV.map((item) => {
              const active = item.key === activeKey;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSelect(item.key)}
                  className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ${
                    active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      name={item.icon}
                      className={`h-5 w-5 ${
                        active ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    />
                    {!collapsed ? item.label : null}
                  </span>

                  {!collapsed && item.soon ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                      Soon
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={() => onSelect('settings')}
            className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ${
              activeKey === 'settings'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon
                name="settings"
                className={`h-5 w-5 ${
                  activeKey === 'settings' ? 'text-emerald-700' : 'text-slate-500'
                }`}
              />
              {!collapsed ? 'Settings' : null}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
