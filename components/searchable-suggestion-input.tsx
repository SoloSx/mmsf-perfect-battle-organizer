"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { normalizeToken } from "@/lib/utils";

const MAX_VISIBLE_OPTIONS = 12;

type SearchableSuggestionInputProps = {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
};

export function SearchableSuggestionInput({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
}: SearchableSuggestionInputProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const normalizedValue = useMemo(() => normalizeToken(value), [value]);
  const normalizedSuggestions = useMemo(
    () => suggestions.map((suggestion) => ({ value: suggestion, normalized: normalizeToken(suggestion) })),
    [suggestions],
  );
  const exactSuggestionIndex = useMemo(
    () => normalizedSuggestions.findIndex((suggestion) => suggestion.normalized === normalizedValue),
    [normalizedSuggestions, normalizedValue],
  );

  const filteredSuggestions = useMemo(() => {
    if (!isFiltering || !normalizedValue) {
      return suggestions;
    }

    const exact: string[] = [];
    const startsWith: string[] = [];
    const includes: string[] = [];

    for (const suggestion of normalizedSuggestions) {
      if (suggestion.normalized === normalizedValue) {
        exact.push(suggestion.value);
        continue;
      }

      if (suggestion.normalized.startsWith(normalizedValue)) {
        startsWith.push(suggestion.value);
        continue;
      }

      if (suggestion.normalized.includes(normalizedValue)) {
        includes.push(suggestion.value);
      }
    }

    return [...exact, ...startsWith, ...includes];
  }, [isFiltering, normalizedSuggestions, normalizedValue, suggestions]);

  const visibleSuggestions = useMemo(
    () => (isFiltering ? filteredSuggestions.slice(0, MAX_VISIBLE_OPTIONS) : filteredSuggestions),
    [filteredSuggestions, isFiltering],
  );
  const activeSuggestionIndex = useMemo(() => {
    if (!isOpen || visibleSuggestions.length === 0) {
      return -1;
    }

    if (highlightedIndex >= 0 && highlightedIndex < visibleSuggestions.length) {
      return highlightedIndex;
    }

    const fallbackIndex = exactSuggestionIndex >= 0 ? exactSuggestionIndex : 0;
    return Math.min(fallbackIndex, visibleSuggestions.length - 1);
  }, [exactSuggestionIndex, highlightedIndex, isOpen, visibleSuggestions.length]);

  useEffect(() => {
    if (!isOpen || activeSuggestionIndex < 0) {
      return;
    }

    optionRefs.current[activeSuggestionIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeSuggestionIndex, isOpen]);

  const commitSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    setIsFiltering(false);
    setHighlightedIndex(-1);
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) {
        return;
      }

      input.focus();
      input.setSelectionRange(suggestion.length, suggestion.length);
    });
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={isOpen}
        aria-activedescendant={activeSuggestionIndex >= 0 ? `${listId}-option-${activeSuggestionIndex}` : undefined}
        value={value}
        onFocus={(event) => {
          setIsOpen(true);
          setIsFiltering(false);
          setHighlightedIndex(exactSuggestionIndex >= 0 ? exactSuggestionIndex : suggestions.length > 0 ? 0 : -1);

          if (event.currentTarget.value) {
            requestAnimationFrame(() => event.currentTarget.select());
          }
        }}
        onBlur={() => {
          setIsOpen(false);
          setIsFiltering(false);
          setHighlightedIndex(-1);
        }}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
          setIsFiltering(true);
          setHighlightedIndex(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
            setHighlightedIndex((current) => {
              if (visibleSuggestions.length === 0) {
                return -1;
              }

              const currentIndex = current < 0
                ? (exactSuggestionIndex >= 0 ? exactSuggestionIndex : activeSuggestionIndex)
                : current;
              return currentIndex < 0 ? 0 : Math.min(currentIndex + 1, visibleSuggestions.length - 1);
            });
            return;
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            setIsOpen(true);
            setHighlightedIndex((current) => {
              if (visibleSuggestions.length === 0) {
                return -1;
              }

              const currentIndex = current < 0
                ? (exactSuggestionIndex >= 0 ? exactSuggestionIndex : activeSuggestionIndex)
                : current;
              return currentIndex <= 0 ? 0 : currentIndex - 1;
            });
            return;
          }

          if (event.key === "Enter" && isOpen && activeSuggestionIndex >= 0 && visibleSuggestions[activeSuggestionIndex]) {
            event.preventDefault();
            commitSuggestion(visibleSuggestions[activeSuggestionIndex]);
            return;
          }

          if (event.key === "Escape") {
            setIsOpen(false);
            setIsFiltering(false);
            setHighlightedIndex(-1);
          }
        }}
        placeholder={placeholder}
        className={className}
      />
      {isOpen && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-72 overflow-y-auto rounded-2xl border border-white/12 bg-slate-950/96 p-2 shadow-[0_18px_48px_rgba(15,23,42,0.55)] backdrop-blur-xl"
        >
          {visibleSuggestions.length > 0 ? (
            visibleSuggestions.map((suggestion, index) => {
              const isHighlighted = index === activeSuggestionIndex;

              return (
                <button
                  key={suggestion}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  id={`${listId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isHighlighted}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commitSuggestion(suggestion)}
                  className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-white transition ${
                    isHighlighted ? "bg-cyan-400/18 text-cyan-100" : "hover:bg-white/8"
                  }`}
                >
                  {suggestion}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-sm text-white/55">候補がありません。</div>
          )}
          {isFiltering && filteredSuggestions.length > MAX_VISIBLE_OPTIONS && (
            <div className="px-3 pt-2 text-xs text-white/45">{filteredSuggestions.length}件中{MAX_VISIBLE_OPTIONS}件を表示しています。</div>
          )}
        </div>
      )}
    </div>
  );
}
