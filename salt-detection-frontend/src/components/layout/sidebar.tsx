"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Eye, History, BarChart3, FlaskConical } from "lucide-react";
import Image from "next/image";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Batches", href: "/history", icon: History },
  // { name: "Detections", href: "/detections", icon: Eye },
  { name: "Statistics", href: "/statistics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-100">
        <Image
          src="/assets/vision.svg"
          alt="Salt Crystal Detection Logo"
          width={150}
          height={32}
        />
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
                  ? "bg-cyan-50 text-cyan-00 border border-cyan-500 ml-0 pl-3"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                isActive ? "text-cyan-500" : "text-slate-400"
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
