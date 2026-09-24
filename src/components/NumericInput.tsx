import React, { useState, useEffect } from 'react';

interface NumericInputProps {
  id?: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
  placeholder?: string;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  id,
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  unit,
  className = '',
  placeholder,
}) => {
  const [text, setText] = useState<string>(String(value ?? ''));

  useEffect(() => {
    setText(String(value ?? ''));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);

    // If it's a valid integer or float, propagate
    if (val !== '' && !isNaN(Number(val))) {
      const parsed = parseFloat(val);
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    if (text === '' || isNaN(Number(text))) {
      setText(String(value));
      return;
    }
    let parsed = parseFloat(text);
    if (min !== undefined && parsed < min) parsed = min;
    if (max !== undefined && parsed > max) parsed = max;
    setText(String(parsed));
    onChange(parsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        id={id}
        type="number"
        step={step}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-white dark:bg-[#333333] border border-[#d6d6d6] dark:border-[#4d4d4d] rounded-full px-3 py-1 text-xs text-[#111111] dark:text-[#f0f0f0] focus:outline-none focus:border-[#0088cc] focus:ring-1 focus:ring-[#0088cc] font-mono shadow-2xs transition-colors"
        style={{ MozAppearance: 'textfield' }}
      />
      {unit && (
        <span className="absolute right-3 text-[10px] text-[#888888] dark:text-[#aaaaaa] pointer-events-none select-none font-mono">
          {unit}
        </span>
      )}
    </div>
  );
};
