import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";

interface InteractiveCodeViewProps {
  code: string;
  language: string;
  onExplainRequest: (selectedCode: string) => void;
  isLoading: boolean;
}

export const InteractiveCodeView = ({
  code,
  language,
  onExplainRequest,
  isLoading,
}: InteractiveCodeViewProps) => {
  const [selectedText, setSelectedText] = useState("");

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || "";
    if (text) {
      setSelectedText(text);
    }
  };

  const handleExplain = () => {
    // Prefer the freshest selection from the DOM, fall back to state.
    const selection = window.getSelection()?.toString().trim();
    const textToExplain = selection || selectedText;

    if (textToExplain) {
      onExplainRequest(textToExplain);
      window.getSelection()?.removeAllRanges();
      setSelectedText("");
    }
  };

  const highlightedCode = code
    ? Prism.highlight(
        code,
        // Fallback to JS highlighting if language is unknown
        // @ts-expect-error Prism types are loose here
        Prism.languages[language] || Prism.languages.javascript,
        language
      )
    : "";

  if (!code) {
    return (
      <div className="ascii-box p-4 h-full flex flex-col items-center justify-center text-muted-foreground">
        <Eye className="h-12 w-12 mb-4 opacity-50" />
        <p>// Submit code to see interactive view</p>
      </div>
    );
  }

  return (
    <div className="ascii-box p-4 h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-glow flex items-center gap-2">
          <Eye className="h-5 w-5" />
          ╔═══ INTERACTIVE VIEW ═══╗
        </h2>
      </div>

      <div
        className="flex-1 overflow-auto bg-card p-4 border border-border rounded relative"
        onMouseUp={handleTextSelection}
      >
        <pre className="text-sm font-mono">
          <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>

        {selectedText && (
          <div className="absolute bottom-4 right-4">
            <Button
              onClick={handleExplain}
              disabled={isLoading}
              size="sm"
              className="gap-2"
            >
              {isLoading ? "[ EXPLAINING... ]" : "[ EXPLAIN ]"}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        // Select code to request explanation
      </div>
    </div>
  );
};
