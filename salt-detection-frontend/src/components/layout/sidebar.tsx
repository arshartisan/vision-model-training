"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Eye, History, BarChart3, FlaskConical } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Batches", href: "/history", icon: History },
  { name: "Detections", href: "/detections", icon: Eye },
  { name: "Statistics", href: "/statistics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-100">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/20">
          <FlaskConical className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">Salt Detector</span>
          <p className="text-xs text-slate-400 font-medium">Purity Analysis</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500 ml-0 pl-3"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                isActive ? "text-blue-500" : "text-slate-400"
              )} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="px-3 py-3 rounded-xl bg-slate-50">
          <p className="text-xs text-slate-500 font-medium text-center">
            YOLOv8 Detection System
          </p>
          <p className="text-xs text-slate-400 text-center mt-0.5">
            v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
