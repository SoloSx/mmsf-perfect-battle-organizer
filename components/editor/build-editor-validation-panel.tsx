"use client";

import { AlertTriangle } from "lucide-react";
import type { BuildValidationResult } from "@/components/editor/build-editor-state";

export function BuildEditorValidationPanel({
  validation,
}: {
  validation: BuildValidationResult;
}) {
  const hasValidationErrors = validation.errors.length > 0;

  return (
    <div className={`glass-panel ${hasValidationErrors ? "ring-1 ring-red-400/20" : ""}`}>
      <div
        className={`flex items-center gap-3 text-sm font-semibold ${
          hasValidationErrors ? "text-red-100" : "text-white"
        }`}
      >
        <AlertTriangle
          className={`size-4 ${hasValidationErrors ? "text-red-300" : "text-cyan-200"}`}
        />
        バリデーション
      </div>
      <div className="mt-4 grid gap-4">
        <div
          className={`glass-panel-soft ${
            hasValidationErrors ? "bg-red-500/8 ring-1 ring-red-400/25" : ""
          }`}
        >
          <p className="text-sm font-semibold text-white">状態</p>
          {hasValidationErrors ? (
            <ul className="mt-3 space-y-2 text-sm leading-7 text-red-200/90">
              <li>• カード総数: {validation.cardTotalLabel}</li>
              {validation.errors.map((error) => (
                <li key={error}>• {error}</li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-emerald-200/90">
              <p>カード総数: {validation.cardTotalLabel}</p>
              <p>保存可能です。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
