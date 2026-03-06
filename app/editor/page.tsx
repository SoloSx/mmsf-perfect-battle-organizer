import { Suspense } from "react";
import { BuildEditorPage } from "@/components/build-editor-page";

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090b14]" />}>
      <BuildEditorPage />
    </Suspense>
  );
}
