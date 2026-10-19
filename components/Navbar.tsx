"use client";

import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

interface NavbarProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ComponentType<{ className?: string }>;
    variant?: "primary" | "secondary";
  };
}

export function Navbar({ title, subtitle, action }: NavbarProps) {
  const ActionIcon = action?.icon || Plus;

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-semibold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {action && action.href ? (
          <Link
            href={action.href}
            className="flex items-center gap-2 bg-[#fe2c55] hover:bg-[#e0264b] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-[#fe2c55]/20 hover:shadow-lg hover:shadow-[#fe2c55]/30"
          >
            <ActionIcon className="w-3.5 h-3.5" />
            <span>{action.label}</span>
          </Link>
        ) : action && action.onClick ? (
          <button
            onClick={action.onClick}
            type="button"
            className="flex items-center gap-2 bg-[#fe2c55] hover:bg-[#e0264b] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-[#fe2c55]/20 hover:shadow-lg hover:shadow-[#fe2c55]/30 cursor-pointer"
          >
            <ActionIcon className="w-3.5 h-3.5" />
            <span>{action.label}</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
