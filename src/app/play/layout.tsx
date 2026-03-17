import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Click-Master | Play",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0", // Prevent zooming on buttons
};

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-zinc-950 text-white flex justify-center items-center overflow-hidden touch-none select-none">
      {/* Mobile-sized container if viewed on desktop */}
      <div className="w-full h-screen max-w-md w-full shadow-2xl bg-zinc-900 border-x border-zinc-800 relative flex flex-col">
        {children}
      </div>
    </div>
  );
}
