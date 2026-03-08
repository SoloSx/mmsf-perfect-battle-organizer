"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { normalizeToken } from "@/lib/utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
};

type SearchableSelectInputProps = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  className?: string;
  displayValue?: string;
};

export function SearchableSelectInput({
  value,
  onChange,
  options,
  placeholder,
  className,
  displayValue,
}: SearchableSelectInputProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [query, setQuery] = useState("");

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );
  const normalizedQuery = useMemo(() => normalizeToken(query), [query]);
  const normalizedOptions = useMemo(
    () => options.map((option) => ({ ...option, normalized: normalizeToken(option.label) })),
    [options],
  );
  const selectedOptionIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    if (!isFiltering || !normalizedQuery) {
      return options;
    }

    const exact: SearchableSelectOption[] = [];
    const startsWith: SearchableSelectOption[] = [];
    const includes: SearchableSelectOption[] = [];

    for (const option of normalizedOptions) {
      if (option.normalized === normalizedQuery) {
        exact.push(option);
        continue;
      }

      if (option.normalized.startsWith(normalizedQuery)) {
        startsWith.push(option);
        continue;
      }

      if (option.normalized.includes(normalizedQuery)) {
        includes.push(option);
      }
    }

    return [...exact, ...startsWith, ...includes];
  }, [isFiltering, normalizedOptions, normalizedQuery, options]);

  const visibleOptions = filteredOptions;
  const activeOptionIndex = useMemo(() => {
    if (!isOpen || visibleOptions.length === 0) {
      return -1;
    }

    if (highlightedIndex >= 0 && highlightedIndex < visibleOptions.length) {
      return highlightedIndex;
    }

    const fallbackIndex = selectedOptionIndex >= 0 ? selectedOptionIndex : 0;
    return Math.min(fallbackIndex, visibleOptions.length - 1);
  }, [highlightedIndex, isOpen, selectedOptionIndex, visibleOptions.length]);

  useEffect(() => {
    if (!isOpen || activeOptionIndex < 0) {
      return;
    }

    optionRefs.current[activeOptionIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeOptionIndex, isOpen]);

  const commitOption = (option: SearchableSelectOption) => {
    onChange(option.value);
    setQuery(option.label);
    setIsFiltering(false);
    setHighlightedIndex(-1);
    setIsOpen(false);
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) {
        return;
      }

      input.focus();
      input.setSelectionRange(option.label.length, option.label.length);
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
        aria-activedescendant={activeOptionIndex >= 0 ? `${listId}-option-${activeOptionIndex}` : undefined}
        value={isOpen ? query : (displayValue ?? selectedOption?.label ?? "")}
        onFocus={(event) => {
          setIsOpen(true);
          setIsFiltering(false);
          setQuery(selectedOption?.label ?? "");
          setHighlightedIndex(selectedOptionIndex >= 0 ? selectedOptionIndex : options.length > 0 ? 0 : -1);

          if (event.currentTarget.value) {
            requestAnimationFrame(() => event.currentTarget.select());
          }
        }}
        onBlur={() => {
          setQuery(selectedOption?.label ?? "");
          setIsFiltering(false);
          setHighlightedIndex(-1);
          setIsOpen(false);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
          setIsFiltering(true);
          setHighlightedIndex(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
            setHighlightedIndex((current) => {
              if (visibleOptions.length === 0) {
                return -1;
              }

              const currentIndex = current < 0 ? activeOptionIndex : current;
              return currentIndex < 0 ? 0 : Math.min(currentIndex + 1, visibleOptions.length - 1);
            });
            return;
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            setIsOpen(true);
            setHighlightedIndex((current) => {
              if (visibleOptions.length === 0) {
                return -1;
              }

              const currentIndex = current < 0 ? activeOptionIndex : current;
              return currentIndex <= 0 ? 0 : currentIndex - 1;
            });
            return;
          }

          if (event.key === "Enter" && isOpen && activeOptionIndex >= 0 && visibleOptions[activeOptionIndex]) {
            event.preventDefault();
            commitOption(visibleOptions[activeOptionIndex]);
            return;
          }

          if (event.key === "Escape") {
            event.preventDefault();
            setQuery(selectedOption?.label ?? "");
            setIsFiltering(false);
            setHighlightedIndex(-1);
            setIsOpen(false);
          }
        }}
        placeholder={placeholder}
        className={className}
      />
      {isOpen && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-72 overflow-y-auto rounded-2xl border border-white/12 bg-slate-950/96 p-2 shadow-[0_18px_48px_rgba(15,23,42,0.55)] backdrop-blur-xl"
        >
          {visibleOptions.length > 0 ? (
            visibleOptions.map((option, index) => {
              const isHighlighted = index === activeOptionIndex;

              return (
                <button
                  key={option.value}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  id={`${listId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isHighlighted}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commitOption(option)}
                  className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm leading-5 text-white transition ${
                    isHighlighted ? "bg-cyan-400/18 text-cyan-100" : "hover:bg-white/8"
                  }`}
                >
                  <span className="whitespace-normal break-words">{option.label}</span>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-sm text-white/55">候補がありません。</div>
          )}
        </div>
      )}
    </div>
  );
}
