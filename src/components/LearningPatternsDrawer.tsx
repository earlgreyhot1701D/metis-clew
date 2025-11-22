import { useState } from "react";
import { ChevronDown, ChevronUp, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LearningPattern {
  id: string;
  pattern_type: string;
  frequency: number;
  last_seen: string;
  insights: {
    summary: string;
  } | null;
}

interface LearningPatternsDrawerProps {
  patterns: LearningPattern[];
}

export const LearningPatternsDrawer = ({ patterns }: LearningPatternsDrawerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t border-border bg-background">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between text-foreground hover:text-glow"
      >
        <span className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          {isOpen ? "▼" : "▲"} Learning Patterns ({patterns.length})
        </span>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </Button>

      {isOpen && (
        <div className="p-4 border-t border-border">
          {patterns.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>// No patterns yet. Start explaining code!</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                {patterns.map((pattern) => (
                  <div key={pattern.id} className="ascii-box p-4">
                    <h3 className="font-bold text-accent mb-2">
                      {pattern.pattern_type}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Frequency:</span>
                        <span className="text-foreground">{pattern.frequency}x</span>
                      </div>
                      <div className="text-muted-foreground">
                        Last: {new Date(pattern.last_seen).toLocaleDateString()}
                      </div>
                      {pattern.insights?.summary && (
                        <p className="text-xs text-foreground mt-2 pt-2 border-t border-border">
                          {pattern.insights.summary}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
};
