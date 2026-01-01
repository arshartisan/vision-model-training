import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline" | "secondary";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          "bg-cyan-500 text-white": variant === "default",
          "bg-emerald-50 text-emerald-700 border border-emerald-200": variant === "success",
          "bg-amber-50 text-amber-700 border border-amber-200": variant === "warning",
          "bg-red-50 text-red-700 border border-red-200": variant === "destructive",
          "border border-slate-200 text-slate-700 bg-white": variant === "outline",
          "bg-slate-100 text-slate-700": variant === "secondary",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
