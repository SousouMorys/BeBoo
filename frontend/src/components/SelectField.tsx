import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

export interface SelectFieldOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  id: string;
  onValueChange: (value: string) => void;
  options: SelectFieldOption[];
  value: string;
}

export function SelectField({ id, onValueChange, options, value }: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fieldRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];
  const listboxId = `${id}-options`;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function closeWhenOutside(event: MouseEvent) {
      if (!fieldRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', closeWhenOutside);
    return () => document.removeEventListener('mousedown', closeWhenOutside);
  }, [isOpen]);

  function focusOption(index: number) {
    optionRefs.current[index]?.focus();
  }

  function openFromKeyboard(index: number) {
    setIsOpen(true);
    requestAnimationFrame(() => focusOption(index));
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openFromKeyboard(Math.min(selectedIndex + 1, options.length - 1));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      openFromKeyboard(Math.max(selectedIndex - 1, 0));
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }

  function chooseOption(nextValue: string) {
    onValueChange(nextValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <span className="relative block w-full" ref={fieldRef}>
      <button
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="h-12 w-full rounded-bb border-2 border-bb-sand bg-bb-surface px-4 pr-11 text-left font-normal text-bb-ink hover:bg-bb-sand"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        {selectedOption.label}
      </button>
      <svg
        aria-hidden="true"
        className={`pointer-events-none absolute right-4 top-6 h-5 w-5 -translate-y-1/2 text-bb-ink-soft ${isOpen ? 'rotate-180' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <path d="M6.5 9.5L12 15L17.5 9.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
      </svg>
      {isOpen ? (
        <span
          aria-labelledby={id}
          className="absolute z-30 mt-2 grid w-full gap-1 rounded-bb border-2 border-bb-sand bg-bb-surface p-1 shadow-lg"
          id={listboxId}
          role="listbox"
        >
          {options.map((option, index) => (
            <button
              aria-selected={option.value === value}
              className={`bb-parent-target w-full px-4 text-left text-[16px] font-normal ${option.value === value ? 'bg-bb-teal-deep text-bb-surface' : 'bg-bb-surface text-bb-ink hover:bg-bb-sand'}`}
              key={option.value}
              onClick={() => chooseOption(option.value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  focusOption(Math.min(index + 1, options.length - 1));
                }
                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  focusOption(Math.max(index - 1, 0));
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }
              }}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              role="option"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}
