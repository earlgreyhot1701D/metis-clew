import { useState } from "react";
import { MessageSquare, Bookmark, ThumbsUp, ThumbsDown, Meh, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Explanation {
  whatItDoes: string;
  whyItMatters: string;
  keyConcepts: string[];
  relatedPatterns: string[];
}

interface ExplanationPanelProps {
  explanation: Explanation | null;
  explanationId?: string;
  isLoading: boolean;
  onSavePattern?: () => void;
}

type Rating = -1 | 0 | 1;

interface SaveRatingParams {
  explanationId: string;
  userId: string;
  rating: Rating;
}

export const ExplanationPanel = ({
  explanation,
  explanationId,
  isLoading,
  onSavePattern,
}: ExplanationPanelProps) => {
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);

  // Mutation to save rating to database
  const saveRatingMutation = useMutation({
    mutationFn: async ({ explanationId, userId, rating }: SaveRatingParams) => {
      const { data, error } = await supabase
        .from("explanation_ratings")
        .upsert(
          {
            explanation_id: explanationId,
            user_id: userId,
            rating,
            created_at: new Date().toISOString(),
          },
          {
            onConflict: "explanation_id,user_id",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Rating saved!",
        description: "Your feedback helps Metis Clew learn your preferences",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving rating",
        description: error.message,
        variant: "destructive",
      });
      // Reset selected rating on error
      setSelectedRating(null);
    },
  });

  const handleRating = async (rating: Rating) => {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to rate explanations",
        variant: "destructive",
      });
      return;
    }

    // Check if we have an explanation ID
    if (!explanationId) {
      toast({
        title: "Cannot save rating",
        description: "No explanation ID available",
        variant: "destructive",
      });
      return;
    }

    // Update local state immediately for UI feedback
    setSelectedRating(rating);

    // Save to database
    saveRatingMutation.mutate({
      explanationId,
      userId: user.id,
      rating,
    });
  };

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
        <div>
          <h2 className="text-lg font-bold text-glow flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            ╔═══ EXPLANATION ═══╗
          </h2>
          <p className="text-xs text-accent mt-1">↳ explanations adapted to YOUR learning style</p>
        </div>
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

      {/* Feedback & Personalization Footer */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <Sparkles className="h-3 w-3 text-accent" />
          <span className="text-muted-foreground">Was this helpful?</span>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 ${
              selectedRating === 1
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                : ""
            }`}
            onClick={() => handleRating(1)}
            disabled={saveRatingMutation.isPending}
            title="Helpful"
          >
            <ThumbsUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 ${
              selectedRating === 0
                ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                : ""
            }`}
            onClick={() => handleRating(0)}
            disabled={saveRatingMutation.isPending}
            title="Neutral"
          >
            <Meh className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 ${
              selectedRating === -1
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : ""
            }`}
            onClick={() => handleRating(-1)}
            disabled={saveRatingMutation.isPending}
            title="Not helpful"
          >
            <ThumbsDown className="h-3 w-3" />
          </Button>
        </div>
        <div className="text-xs text-accent">
          ⚡ Personalized for you
        </div>
      </div>
    </div>
  );
};
