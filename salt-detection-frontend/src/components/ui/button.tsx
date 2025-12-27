import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-blue-500 text-white hover:bg-blue-600 shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30":
              variant === "default",
            "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300":
              variant === "outline",
            "text-slate-600 hover:bg-slate-100 hover:text-slate-900": variant === "ghost",
            "bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/20": variant === "destructive",
            "bg-slate-100 text-slate-700 hover:bg-slate-200": variant === "secondary",
          },
          {
            "h-10 px-4 py-2 text-sm": size === "default",
            "h-9 px-3 text-sm": size === "sm",
            "h-11 px-6 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
