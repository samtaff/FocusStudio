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
        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
        style={{ MozAppearance: 'textfield' }}
      />
      {unit && (
        <span className="absolute right-2.5 text-[11px] text-slate-400 pointer-events-none select-none">
          {unit}
        </span>
      )}
    </div>
  );
};
