"use client";

import { Eye, FileImage, FilePlus2, Save, Sparkles } from "lucide-react";
import { SearchableSelectInput } from "@/components/searchable-select-input";

export const PNG_BACKGROUND_OPTIONS = [
  { value: "solid", label: "背景あり" },
  { value: "transparent", label: "背景なし" },
] as const;

export function BuildEditorToolbar({
  canDuplicate,
  isExporting,
  isPreviewing,
  pngBackgroundMode,
  onDuplicate,
  onExport,
  onPreview,
  onReset,
  onSave,
  onPngBackgroundModeChange,
}: {
  canDuplicate: boolean;
  isExporting: boolean;
  isPreviewing: boolean;
  pngBackgroundMode: (typeof PNG_BACKGROUND_OPTIONS)[number]["value"];
  onDuplicate: () => void;
  onExport: () => void;
  onPreview: () => void;
  onReset: () => void;
  onSave: () => void;
  onPngBackgroundModeChange: (
    value: (typeof PNG_BACKGROUND_OPTIONS)[number]["value"],
  ) => void;
}) {
  return (
    <div className="relative z-0 flex flex-wrap gap-3 self-start overflow-visible focus-within:z-30 2xl:justify-end">
      <button type="button" className="secondary-button whitespace-nowrap" onClick={onReset}>
        <FilePlus2 className="mr-2 size-4" />
        新規に戻す
      </button>
      {canDuplicate ? (
        <button
          type="button"
          className="secondary-button whitespace-nowrap"
          onClick={onDuplicate}
        >
          <Sparkles className="mr-2 size-4" />
          複製して編集
        </button>
      ) : null}
      <button type="button" className="clear-action-button whitespace-nowrap" onClick={onSave}>
        <Save className="mr-2 size-4" />
        保存
      </button>
      <div className="relative z-0 min-w-[160px] overflow-visible focus-within:z-30">
        <SearchableSelectInput
          value={pngBackgroundMode}
          onChange={(value) =>
            onPngBackgroundModeChange(
              value as (typeof PNG_BACKGROUND_OPTIONS)[number]["value"],
            )
          }
          options={[...PNG_BACKGROUND_OPTIONS]}
          className="field-shell min-h-[46px] w-full"
        />
      </div>
      <button
        type="button"
        className="clear-action-button whitespace-nowrap"
        disabled={isPreviewing}
        onClick={onPreview}
      >
        <Eye className="mr-2 size-4" />
        PNG プレビュー
      </button>
      <button
        type="button"
        className="clear-action-button whitespace-nowrap"
        disabled={isExporting}
        onClick={onExport}
      >
        <FileImage className="mr-2 size-4" />
        PNG 出力
      </button>
    </div>
  );
}
