import React, { useEffect, useRef } from "react";
import katex from "katex";

interface MathViewProps {
  math?: string;
  children?: string;
  block?: boolean;
  className?: string;
}

export const MathView: React.FC<MathViewProps> = ({
  math,
  children,
  block = false,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement | HTMLSpanElement>(null);
  const rawContent = math || children || "";

  useEffect(() => {
    if (!containerRef.current) return;

    // Check if the content is pure LaTeX math or mixed text with $...$ delimiters
    if (math || (rawContent.startsWith("\\") && !rawContent.includes(" "))) {
      try {
        katex.render(rawContent, containerRef.current, {
          displayMode: block,
          throwOnError: false,
          strict: false,
        });
      } catch (err) {
        containerRef.current.textContent = rawContent;
      }
    } else {
      // Parse mixed text with $...$ and $$...$$
      try {
        renderMixedMathText(rawContent, containerRef.current);
      } catch (err) {
        containerRef.current.textContent = rawContent;
      }
    }
  }, [rawContent, math, block]);

  if (block) {
    return <div ref={containerRef as React.RefObject<HTMLDivElement>} className={`math-display-block overflow-x-auto py-1 ${className}`} />;
  }

  return <span ref={containerRef as React.RefObject<HTMLSpanElement>} className={`math-inline ${className}`} />;
};

function renderMixedMathText(text: string, element: HTMLElement) {
  element.innerHTML = "";
  if (!text) return;

  // Split by $$...$$ and $...$
  const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g;
  const parts = text.split(regex);

  parts.forEach((part) => {
    if (!part) return;

    if (part.startsWith("$$") && part.endsWith("$$")) {
      const formula = part.slice(2, -2).trim();
      const span = document.createElement("div");
      span.className = "my-2 overflow-x-auto text-center";
      try {
        katex.render(formula, span, { displayMode: true, throwOnError: false });
      } catch {
        span.textContent = formula;
      }
      element.appendChild(span);
    } else if (part.startsWith("$") && part.endsWith("$")) {
      const formula = part.slice(1, -1).trim();
      const span = document.createElement("span");
      span.className = "inline-block px-0.5";
      try {
        katex.render(formula, span, { displayMode: false, throwOnError: false });
      } catch {
        span.textContent = formula;
      }
      element.appendChild(span);
    } else {
      // Normal text, preserve line breaks
      const textNode = document.createTextNode(part);
      element.appendChild(textNode);
    }
  });
}
