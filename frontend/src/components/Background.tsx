import React from "react";

interface BackgroundProps {
  children: React.ReactNode;
  navbar?: React.ReactNode;
  className?: string;
}

export function Background({ children, navbar, className = "" }: BackgroundProps) {
  return (
    <div className="min-h-screen w-full bg-[linear-gradient(to_right,#40459020_1px,transparent_1px),linear-gradient(to_bottom,#40459020_1px,transparent_1px)] bg-[size:45px_45px] bg-secondary-background ">
      {navbar}
      <div className={`${className}`}>
        {children}
      </div>
    </div>
  );
} 