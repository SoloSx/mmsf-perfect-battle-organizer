"use client";

import type { ReactNode } from "react";
import { AppDataProvider } from "@/hooks/use-app-data";

export function Providers({ children }: { children: ReactNode }) {
  return <AppDataProvider>{children}</AppDataProvider>;
}
