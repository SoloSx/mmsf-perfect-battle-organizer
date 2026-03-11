"use client";

import { SearchableSelectInput } from "@/components/searchable-select-input";
import { TagEditor } from "@/components/tag-editor";
import { GAME_LABELS, VERSION_LABELS, VERSIONS_BY_GAME } from "@/lib/rules";
import type { BuildRecord, GameId } from "@/lib/types";

export function BasicInfoSection({
  buildRecord,
  onGameChange,
  onOverviewChange,
  onTagsChange,
  onTitleChange,
  onVersionChange,
}: {
  buildRecord: BuildRecord;
  onGameChange: (game: GameId) => void;
  onOverviewChange: (value: string) => void;
  onTagsChange: (values: string[]) => void;
  onTitleChange: (value: string) => void;
  onVersionChange: (version: BuildRecord["version"]) => void;
}) {
  return (
    <div className="glass-panel relative z-0 overflow-visible focus-within:z-30">
      <div>
        <p className="text-sm font-semibold text-white">基本情報</p>
        <p className="mt-1 text-sm text-white/60">
          構築名、作品、概要、タグをまとめて編集します。
        </p>
      </div>

      <div className="mt-4 grid items-start gap-4 md:grid-cols-[minmax(0,1.1fr)_0.45fr_0.45fr]">
        <input
          value={buildRecord.title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="構築名"
          className="field-shell"
        />
        <SearchableSelectInput
          value={buildRecord.game}
          onChange={(value) => onGameChange(value as GameId)}
          options={Object.entries(GAME_LABELS).map(([value, label]) => ({ value, label }))}
          placeholder="ゲームタイトル"
          className="field-shell min-h-[52px] w-full"
        />
        <SearchableSelectInput
          value={buildRecord.version}
          onChange={(value) => onVersionChange(value as BuildRecord["version"])}
          options={VERSIONS_BY_GAME[buildRecord.game].map((version) => ({
            value: version,
            label: VERSION_LABELS[version],
          }))}
          placeholder="バージョン"
          className="field-shell min-h-[52px] w-full"
        />
        <textarea
          value={buildRecord.commonSections.overview}
          onChange={(event) => onOverviewChange(event.target.value)}
          placeholder="構築全体の概要、環境、狙い"
          className="field-shell min-h-48 w-full"
        />
        <div className="md:col-span-2">
          <TagEditor
            label="構築タグ"
            values={buildRecord.commonSections.tags}
            onChange={onTagsChange}
            suggestions={["対戦用", "大会想定", "速攻", "コントロール", "安定重視"]}
            placeholder="タグ追加"
          />
        </div>
      </div>
    </div>
  );
}
