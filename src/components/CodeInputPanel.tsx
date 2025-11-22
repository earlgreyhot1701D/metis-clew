import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code } from "lucide-react";

interface CodeInputPanelProps {
  onSubmit: (code: string, language: string) => void;
  isLoading: boolean;
}

export const CodeInputPanel = ({ onSubmit, isLoading }: CodeInputPanelProps) => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");

  const handleSubmit = () => {
    if (code.trim()) {
      onSubmit(code, language);
    }
  };

  const charCount = code.length;
  const lineCount = code.split("\n").length;

  return (
    <div className="ascii-box p-4 h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-glow flex items-center gap-2">
            <Code className="h-5 w-5" />
            ╔═══ CODE INPUT ═══╗
          </h2>
          <p className="text-xs text-accent mt-1">→ paste or write your code</p>
        </div>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[140px] bg-background border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="python">Python</SelectItem>
            <SelectItem value="javascript">JavaScript</SelectItem>
            <SelectItem value="typescript">TypeScript</SelectItem>
            <SelectItem value="java">Java</SelectItem>
            <SelectItem value="cpp">C++</SelectItem>
            <SelectItem value="go">Go</SelectItem>
            <SelectItem value="rust">Rust</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="// Paste your code here to begin..."
        className="flex-1 font-mono text-sm bg-background border-border text-foreground resize-none"
      />

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs">
          <span className="text-muted-foreground">Lines: {lineCount} | Chars: {charCount}</span>
          <span className="text-accent ml-4">↓ click any line for explanation</span>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!code.trim() || isLoading}
          className="gap-2"
        >
          {isLoading ? "[ PROCESSING... ]" : "[ SUBMIT CODE ]"}
        </Button>
      </div>
    </div>
  );
};
