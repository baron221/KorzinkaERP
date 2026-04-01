"use client";

import React, { useState, useEffect } from "react";

interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string | number;
  onChange: (value: string) => void;
  allowDecimals?: boolean;
}

export default function NumericInput({
  value,
  onChange,
  allowDecimals = true,
  className = "input",
  ...props
}: NumericInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    if (value === "" || value === null || value === undefined) {
      if (displayValue !== "") setDisplayValue("");
      return;
    }

    const strVal = String(value);
    // Remove formatting from internal state to compare
    const internalRaw = displayValue.replace(/,/g, "");

    // Only update internal display state if external value has genuinely changed.
    // This prevents the cursor from jumping to the end on every keystroke.
    if (strVal !== internalRaw && strVal !== internalRaw + ".") {
      setDisplayValue(formatNumber(strVal, allowDecimals));
    }
  }, [value, allowDecimals, displayValue]);

  const formatNumber = (val: string, decimals: boolean) => {
    // Strip non-numeric chars except a dot
    let clean = val.replace(decimals ? /[^0-9.]/g : /[^0-9]/g, "");

    // Prevent multiple dots
    if (decimals) {
      const parts = clean.split(".");
      if (parts.length > 2) {
        clean = parts[0] + "." + parts.slice(1).join("");
      }
    }

    const parts = clean.split(".");
    // Add commas to the whole number part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatNumber(raw, allowDecimals);
    setDisplayValue(formatted);
    // Return stripped string (e.g. "500000" instead of "500,000") to parent state
    onChange(formatted.replace(/,/g, ""));
  };

  return (
    <input
      {...props}
      type="text"
      inputMode={allowDecimals ? "decimal" : "numeric"}
      className={className}
      value={displayValue}
      onChange={handleChange}
    />
  );
}
