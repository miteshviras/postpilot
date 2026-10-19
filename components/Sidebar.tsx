"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, 
  Send, 
  Activity, 
  BarChart3, 
  Layers, 
  ExternalLink
} from "lucide-react";

const NAV_ITEMS = [
  {
    name: "Accounts",
    href: "/accounts",
    icon: Users,
    description: "Manage connected TikTok profiles",
  },
  {
    name: "Bulk Composer",
    href: "/composer",
    icon: Send,
    description: "Upload video & bulk publish",
    badge: "New",
  },
  {
    name: "Job Monitor",
    href: "/jobs",
    icon: Activity,
    description: "Real-time dispatch tracking",
  },
  {
    name: "History & Logs",
    href: "/history",
    icon: BarChart3,
    description: "Publish records & audit trail",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950/80 backdrop-blur-xl flex flex-col justify-between p-4 shrink-0 h-screen sticky top-0 select-none">
      <div>
        {/* Logo and Brand Header */}
        <Link href="/accounts" className="flex items-center gap-3 px-2 py-3 mb-6 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#fe2c55] to-[#25f4ee] flex items-center justify-center shadow-lg shadow-[#fe2c55]/20 group-hover:scale-105 transition-transform duration-200">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight">PostPilot</span>
              <span className="text-[10px] font-semibold bg-[#fe2c55]/20 text-[#fe2c55] border border-[#fe2c55]/30 px-1.5 py-0.2 rounded-full">
                TikTok
              </span>
            </div>
            <p className="text-xs text-zinc-400">Bulk Multi-Account Posting</p>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          <div className="px-2 pb-2 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
            Workspace
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-zinc-800/90 text-white shadow-sm border border-zinc-700/50"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-[#fe2c55]" : "text-zinc-400 group-hover:text-zinc-300"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-[#fe2c55]/15 text-[#fe2c55] border border-[#fe2c55]/30 font-medium px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info / Stack Status */}
      <div className="space-y-3 pt-4 border-t border-zinc-800/80">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs text-zinc-300 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Stack Ready
            </span>
            <span className="text-zinc-500 text-[11px]">Docker/Redis</span>
          </div>
          <p className="text-[11px] text-zinc-400">PostgreSQL + BullMQ worker queue configured.</p>
        </div>

        <div className="flex items-center justify-between px-2 text-xs text-zinc-500">
          <span>v1.0.0-mvp</span>
          <a
            href="https://github.com/miteshviras/postpilot"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-300 flex items-center gap-1 transition-colors"
          >
            <span>Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </aside>
  );
}
