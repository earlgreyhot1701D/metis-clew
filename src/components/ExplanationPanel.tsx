import { MessageSquare, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Explanation {
  whatItDoes: string;
  whyItMatters: string;
  keyConcepts: string[];
  relatedPatterns: string[];
}

interface ExplanationPanelProps {
  explanation: Explanation | null;
  isLoading: boolean;
  onSavePattern?: () => void;
}

export const ExplanationPanel = ({
  explanation,
  isLoading,
  onSavePattern,
}: ExplanationPanelProps) => {
  if (isLoading) {
    return (
      <div className="ascii-box p-4 h-full flex flex-col">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-glow flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            ╔═══ EXPLANATION ═══╗
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-glow animate-pulse">[ ANALYZING... ]</div>
        </div>
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="ascii-box p-4 h-full flex flex-col items-center justify-center text-muted-foreground">
        <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-center">// Select code in the interactive view to get explanation</p>
      </div>
    );
  }

  return (
    <div className="ascii-box p-4 h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-glow flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          ╔═══ EXPLANATION ═══╗
        </h2>
        {onSavePattern && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSavePattern}
            className="gap-2"
          >
            <Bookmark className="h-4 w-4" />
            [ SAVE ]
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-4">
          <section>
            <h3 className="text-sm font-bold text-secondary mb-2">
              // What it does
            </h3>
            <p className="text-sm text-foreground">{explanation.whatItDoes}</p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-secondary mb-2">
              // Why it matters
            </h3>
            <p className="text-sm text-foreground">{explanation.whyItMatters}</p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-secondary mb-2">
              // Key concepts
            </h3>
            <ul className="space-y-1">
              {explanation.keyConcepts.map((concept, idx) => (
                <li key={idx} className="text-sm text-foreground">
                  → {concept}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-bold text-secondary mb-2">
              // Related patterns
            </h3>
            <ul className="space-y-1">
              {explanation.relatedPatterns.map((pattern, idx) => (
                <li key={idx} className="text-sm text-accent">
                  ⊳ {pattern}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
};
