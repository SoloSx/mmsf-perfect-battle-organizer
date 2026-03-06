"use client";

import type { ReactNode } from "react";
import CosmicBackground from "@/components/cosmic-background";
import { SidebarNav } from "@/components/sidebar-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <CosmicBackground />
      <div className="relative z-10 flex min-h-screen flex-col md:flex-row">
        <SidebarNav />
        <div className="flex-1 px-4 py-4 md:px-10 md:py-10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
