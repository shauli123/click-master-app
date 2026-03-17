import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Click-Master | Projector Screen",
};

export default function ScreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-white relative font-sans">
      {children}
    </div>
  );
}
