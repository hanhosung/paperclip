import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MarkdownBody } from "@/components/MarkdownBody";

interface PrintRequest {
  title: string;
  subtitle: string;
  markdown: string;
}

/** Download a string as a UTF-8 file via a transient anchor. */
function downloadTextFile(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Report export helpers — Markdown download and print-to-PDF.
 *
 * PDF uses the browser's own print dialog ("Save as PDF"): the markdown is
 * re-rendered into an off-screen portal that `@media print` rules promote to
 * the only visible content. No PDF library, faithful rendering, selectable
 * text. Render off-screen (not display:none) so diagrams measure correctly.
 */
export function useReportExport() {
  const [printRequest, setPrintRequest] = useState<PrintRequest | null>(null);

  useEffect(() => {
    if (!printRequest) return;
    const clear = () => setPrintRequest(null);
    window.addEventListener("afterprint", clear, { once: true });
    // Give MarkdownBody (mermaid/katex render asynchronously) time to settle.
    const timer = window.setTimeout(() => window.print(), 700);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", clear);
    };
  }, [printRequest]);

  const exportMarkdown = useCallback((filename: string, markdown: string) => {
    downloadTextFile(filename, markdown, "text/markdown;charset=utf-8");
  }, []);

  const exportPdf = useCallback((request: PrintRequest) => {
    setPrintRequest(request);
  }, []);

  const printPortal = printRequest
    ? createPortal(
        <div className="report-print-portal">
          <header className="report-print-head">
            <h1 className="report-print-title">{printRequest.title}</h1>
            {printRequest.subtitle ? (
              <p className="report-print-subtitle">{printRequest.subtitle}</p>
            ) : null}
          </header>
          <MarkdownBody>{printRequest.markdown}</MarkdownBody>
        </div>,
        document.body,
      )
    : null;

  return { exportMarkdown, exportPdf, printPortal };
}
