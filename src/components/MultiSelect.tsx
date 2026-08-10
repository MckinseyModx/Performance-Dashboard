import { useEffect, useRef, useState } from "react";

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export default function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  const buttonLabel =
    selected.length === 0
      ? `All ${label}`
      : selected.length === 1
        ? selected[0]
        : `${selected.length} ${label} selected`;

  return (
    <div className="relative" ref={containerRef}>
      <label className="mb-1 block text-xs font-medium text-mck-gray-600">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full min-w-[9rem] items-center justify-between gap-2 rounded-md border border-mck-gray-200 bg-white px-3 py-1.5 text-sm text-mck-navy shadow-sm hover:border-mck-blue"
      >
        <span className="truncate">{buttonLabel}</span>
        <span className="text-slate-400">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-64 w-56 overflow-auto rounded-md border border-slate-200 bg-white p-2 shadow-lg">
          <div className="mb-1 flex justify-between border-b border-slate-100 pb-1 text-xs">
            <button className="text-mck-blue hover:underline" onClick={() => onChange(options)}>
              Select all
            </button>
            <button className="text-slate-500 hover:underline" onClick={() => onChange([])}>
              Clear
            </button>
          </div>
          {options.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm text-slate-700 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggle(option)}
                className="h-3.5 w-3.5 accent-mck-blue"
              />
              <span className="truncate">{option}</span>
            </label>
          ))}
          {options.length === 0 && <div className="px-1.5 py-1 text-sm text-slate-400">No options</div>}
        </div>
      )}
    </div>
  );
}
