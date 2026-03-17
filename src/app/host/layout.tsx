import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Click-Master | Host Remote",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-zinc-950 text-white flex justify-center items-center overflow-x-hidden pt-4 pb-8 md:p-8">
      {/* Container simulating a tablet/large phone controller aspect ratio if on desktop */}
      <div className="w-full max-w-2xl min-h-[90vh] bg-zinc-900 md:rounded-3xl border border-zinc-800 shadow-2xl shadow-black relative flex flex-col p-6">
        {children}
      </div>
    </div>
  );
}
