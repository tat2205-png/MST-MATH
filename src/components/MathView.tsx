import React, { useEffect, useRef } from "react";
import { renderMstMathToHtml } from "../modules/math-notation/html.js";

interface MathViewProps {
  math?: string;
  children?: string;
  block?: boolean;
  className?: string;
  notationProfileId?: string;
}

function renderFormula(
  formula: string,
  element: HTMLElement,
  options: { displayMode: boolean; notationProfileId?: string },
) {
  const rendered = renderMstMathToHtml(formula, options);
  if (rendered.status === "PASS" && rendered.html) {
    element.innerHTML = rendered.html;
    element.dataset.mathNotationStatus = "pass";
    element.dataset.mathSemanticSignature = rendered.semanticSignature.join("|");
    return;
  }

  element.textContent = `[MATH_NOTATION_RENDER_FAILURE] ${formula}`;
  element.dataset.mathNotationStatus = "fail";
  element.dataset.mathNotationIssues = rendered.issues.map((issue) => issue.code).join("|");
}

export const MathView: React.FC<MathViewProps> = ({
  math,
  children,
  block = false,
  className = "",
  notationProfileId,
}) => {
  const containerRef = useRef<HTMLDivElement | HTMLSpanElement>(null);
  const rawContent = math || children || "";

  useEffect(() => {
    if (!containerRef.current) return;

    if (math || (rawContent.startsWith("\\") && !rawContent.includes(" "))) {
      renderFormula(rawContent, containerRef.current, { displayMode: block, notationProfileId });
      return;
    }

    renderMixedMathText(rawContent, containerRef.current, notationProfileId);
  }, [rawContent, math, block, notationProfileId]);

  if (block) {
    return <div ref={containerRef as React.RefObject<HTMLDivElement>} className={`math-display-block overflow-x-auto py-1 ${className}`} />;
  }

  return <span ref={containerRef as React.RefObject<HTMLSpanElement>} className={`math-inline ${className}`} />;
};

function renderMixedMathText(text: string, element: HTMLElement, notationProfileId?: string) {
  element.innerHTML = "";
  if (!text) return;

  const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g;
  const parts = text.split(regex);

  parts.forEach((part) => {
    if (!part) return;

    if (part.startsWith("$$") && part.endsWith("$$")) {
      const formula = part.slice(2, -2).trim();
      const span = document.createElement("div");
      span.className = "my-2 overflow-x-auto text-center";
      renderFormula(formula, span, { displayMode: true, notationProfileId });
      element.appendChild(span);
      return;
    }

    if (part.startsWith("$") && part.endsWith("$")) {
      const formula = part.slice(1, -1).trim();
      const span = document.createElement("span");
      span.className = "inline-block px-0.5";
      renderFormula(formula, span, { displayMode: false, notationProfileId });
      element.appendChild(span);
      return;
    }

    element.appendChild(document.createTextNode(part));
  });
}
