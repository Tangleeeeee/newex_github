"use client";

import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: 16, md: 22, lg: 30 };

export default function StarRating({ value, onChange, readonly = false, size = "md" }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const px = sizes[size];

  function getStarFill(starIndex: number, display: number): "full" | "half" | "empty" {
    const v = display;
    if (v >= starIndex + 1) return "full";
    if (v >= starIndex + 0.5) return "half";
    return "empty";
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>, starIndex: number) {
    if (readonly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHovered(x < rect.width / 2 ? starIndex + 0.5 : starIndex + 1);
  }

  function handleClick(e: React.MouseEvent<SVGSVGElement>, starIndex: number) {
    if (readonly || !onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    onChange(x < rect.width / 2 ? starIndex + 0.5 : starIndex + 1);
  }

  const display = hovered ?? value;

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => !readonly && setHovered(null)}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const fill = getStarFill(i, display);
        return (
          <svg
            key={i}
            width={px}
            height={px}
            viewBox="0 0 24 24"
            className={readonly ? "cursor-default" : "cursor-pointer"}
            onMouseMove={(e) => handleMouseMove(e, i)}
            onClick={(e) => handleClick(e, i)}
          >
            <defs>
              <linearGradient id={`half-${i}`}>
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#e5e7eb" />
              </linearGradient>
            </defs>
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill={
                fill === "full"
                  ? "#f59e0b"
                  : fill === "half"
                  ? `url(#half-${i})`
                  : "#e5e7eb"
              }
              stroke={fill === "empty" ? "#d1d5db" : "#f59e0b"}
              strokeWidth="1"
            />
          </svg>
        );
      })}
      {!readonly && (
        <span className="ml-1.5 text-sm font-semibold text-amber-500 tabular-nums w-6">
          {display > 0 ? display.toFixed(1) : ""}
        </span>
      )}
    </div>
  );
}
