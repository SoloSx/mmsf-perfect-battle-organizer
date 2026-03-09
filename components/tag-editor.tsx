"use client";

import { useId, useState } from "react";

function clampList(values: string[], max?: number) {
  const unique = Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
  return typeof max === "number" ? unique.slice(0, max) : unique;
}

export function TagEditor({
  label,
  values,
  onChange,
  suggestions,
  maxItems,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
  maxItems?: number;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const listId = useId();

  const addValue = (value: string) => {
    const next = clampList([...values, value], maxItems);
    onChange(next);
    setInput("");
  };

  return (
    <div className="glass-panel-soft bg-white/[0.035]">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-white">{label}</label>
        {typeof maxItems === "number" && <span className="text-xs text-white/45">{values.length}/{maxItems}</span>}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          list={listId}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (input.trim()) {
                addValue(input.trim());
              }
            }
          }}
          placeholder={placeholder ?? "値を追加"}
          className="field-shell flex-1"
        />
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            if (input.trim()) {
              addValue(input.trim());
            }
          }}
        >
          追加
        </button>
        <datalist id={listId}>
          {suggestions?.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.length > 0 ? (
          values.map((value) => (
            <button
              key={value}
              type="button"
              className="chip"
              onClick={() => onChange(values.filter((item) => item !== value))}
            >
              {value} ×
            </button>
          ))
        ) : (
          <span className="text-xs text-white/45">未登録</span>
        )}
      </div>
    </div>
  );
}
