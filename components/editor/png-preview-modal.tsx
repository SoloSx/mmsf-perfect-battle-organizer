"use client";

import Image from "next/image";
import { X } from "lucide-react";

export function PngPreviewModal({
  previewImageUrl,
  onClose,
}: {
  previewImageUrl: string | null;
  onClose: () => void;
}) {
  if (!previewImageUrl) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[1280px] rounded-[32px] border border-white/12 bg-[linear-gradient(160deg,rgba(8,12,36,0.96),rgba(29,25,68,0.94))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">PNG プレビュー</p>
            <p className="mt-1 text-sm text-white/60">
              カード画像が未取得の項目はタイトル付きプレースホルダで出力します。
            </p>
          </div>
          <button type="button" className="secondary-button whitespace-nowrap" onClick={onClose}>
            <X className="mr-2 size-4" />
            閉じる
          </button>
        </div>
        <div className="mt-4 overflow-auto">
          <Image
            src={previewImageUrl}
            alt="PNG preview"
            width={1200}
            height={675}
            unoptimized
            className="mx-auto h-auto w-full"
          />
        </div>
      </div>
    </div>
  );
}
