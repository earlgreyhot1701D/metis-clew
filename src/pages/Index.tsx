import { useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { CodeInputPanel } from "@/components/CodeInputPanel";
import { InteractiveCodeView } from "@/components/InteractiveCodeView";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { LearningPatternsDrawer } from "@/components/LearningPatternsDrawer";
import { WelcomeModal } from "@/components/WelcomeModal";
import { Sidebar } from "@/components/Sidebar";
import { StatusBar } from "@/components/StatusBar";
import { useToast } from "@/hooks/use-toast";
import { useLocalSession } from "@/hooks/useLocalSession";
import { toast as sonnerToast } from "sonner";
import { SkillBadge } from "@/components/SkillBadge";

const Index = () => {
  const [currentSnippet, setCurrentSnippet] = useState<{
    id?: string;
    code: string;
    language: string;
  } | null>(null);

  const [currentExplanation, setCurrentExplanation] = useState<any>(null);
  const [currentExplanationId, setCurrentExplanationId] = useState<
    string | undefined
  >(undefined);

  // Used to force-reset CodeInputPanel
  const [inputResetKey, setInputResetKey] = useState(0);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { trackCodeSubmit, trackExplanation } = useLocalSession();

  // Load persisted session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("metis-session");
      if (saved) {
        const { snippet, explanation, explanationId } = JSON.parse(saved);
        if (snippet) setCurrentSnippet(snippet);
        if (explanation) setCurrentExplanation(explanation);
        if (explanationId) setCurrentExplanationId(explanationId);
      }
    } catch {
      // Ignore corrupted storage
    }
  }, []);

  // Debounced persistence
  useEffect(() => {
    const handle = setTimeout(() => {
      try {
        const payload = JSON.stringify({
          snippet: currentSnippet,
          explanation: currentExplanation,
          explanationId: currentExplanationId,
        });
        localStorage.setItem("metis-session", payload);
      } catch {
        // Ignore storage errors
      }
    }, 150);

    return () => clearTimeout(handle);
  }, [currentSnippet, currentExplanation, currentExplanationId]);

  // Fetch learning patterns
  const { data: patterns = [] } = useQuery({
    queryKey: ["learning-patterns"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return [];

      const { data, error } = await supabase
        .from("learning_patterns")
        .select("*")
        .order("frequency", { ascending: false });

      if (error) throw error;
      return (data || []).map((p: any) => ({
        id: p.id,
        pattern_type: p.pattern_type,
        frequency: p.frequency,
        last_seen: p.last_seen,
        insights: p.insights as { summary: string } | null,
      }));
    },
  });

  // Submit code mutation
  const submitCodeMutation = useMutation({
    mutationFn: async ({
      code,
      language,
    }: {
      code: string;
      language: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Guest mode: skip DB
      if (!user) {
        return { id: undefined, code, language };
      }

      const { data, error } = await supabase
        .from("code_snippets")
        .insert({
          user_id: user.id,
          code,
          language,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCurrentSnippet({
        id: data.id,
        code: data.code,
        language: data.language,
      });
      trackCodeSubmit(data.code, data.language);

      toast({
        title: "Success",
        description: "Code loaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Explain code mutation
  const explainCodeMutation = useMutation({
    mutationFn: async (selectedCode: string) => {
      if (!currentSnippet) throw new Error("No code snippet");

      // Check if user is authenticated and snippet needs to be saved
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let snippetId = currentSnippet.id;

      // If user is authenticated but snippet doesn't have an ID, save it first
      if (user && !snippetId) {
        const { data: savedSnippet, error: saveError } = await supabase
          .from("code_snippets")
          .insert({
            user_id: user.id,
            code: currentSnippet.code,
            language: currentSnippet.language,
          })
          .select()
          .single();

        if (saveError) throw saveError;
        snippetId = savedSnippet.id;

        // Update currentSnippet with the new ID
        setCurrentSnippet({
          id: snippetId,
          code: currentSnippet.code,
          language: currentSnippet.language,
        });
      }

      const { data, error } = await supabase.functions.invoke("explain-code", {
        body: {
          code_snippet: currentSnippet.code,
          selected_code: selectedCode,
          language: currentSnippet.language,
          snippet_id: snippetId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCurrentExplanation(data.explanation);
      setCurrentExplanationId(data.explanationId);

      const levelInfo = trackExplanation();
      queryClient.invalidateQueries({ queryKey: ["learning-patterns"] });

      if (levelInfo.leveledUp) {
        sonnerToast.success(
          <div className="flex items-center gap-3">
            <span className="text-lg">🎉</span>
            <div>
              <div className="font-semibold">Level Up!</div>
              <div className="text-sm opacity-90">
                You've advanced to{" "}
                <span className="capitalize font-semibold">
                  {levelInfo.newLevel}
                </span>
              </div>
            </div>
          </div>,
          {
            duration: 5000,
            position: "top-center",
          }
        );
      }

      toast({
        title: "Explanation generated",
        description: "Your code explanation is ready",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate explanation",
        variant: "destructive",
      });
    },
  });

  const handleCodeSubmit = (code: string, language: string) => {
    submitCodeMutation.mutate({ code, language });
  };

  const handleExplainRequest = (selectedCode: string) => {
    explainCodeMutation.mutate(selectedCode);
  };

  const handleSnippetClick = (snippet: {
    id?: string;
    code: string;
    language: string;
    title: string;
  }) => {
    setCurrentSnippet({
      id: snippet.id,
      code: snippet.code,
      language: snippet.language,
    });

    toast({
      title: "Snippet loaded",
      description: `"${snippet.title}" is ready for analysis`,
    });
  };

  // CLEAR CODE (Option 1)
  const handleClear = () => {
    setCurrentSnippet(null);
    setCurrentExplanation(null);
    setCurrentExplanationId(undefined);

    // Reset the input panel cleanly
    setInputResetKey((prev) => prev + 1);

    // Update localStorage to an empty session (NOT wiping history/prefs)
    try {
      localStorage.setItem(
        "metis-session",
        JSON.stringify({
          snippet: null,
          explanation: null,
          explanationId: null,
        })
      );
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <WelcomeModal />
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar onSnippetClick={handleSnippetClick} />

        <div className="flex-1 flex flex-col">
          <main className="flex-1 container mx-auto p-4 overflow-auto">
            {/* Top right controls */}
            <div className="flex justify-end mb-4">
              <button
                onClick={handleClear}
                className="px-3 py-2 text-sm rounded bg-muted hover:bg-muted/70"
              >
                CLEAR CODE
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[calc(100vh-120px)]">
              {/* Code Input - Left */}
              <div className="lg:col-span-4 h-full">
                <CodeInputPanel
                  key={inputResetKey}
                  onSubmit={handleCodeSubmit}
                  isLoading={submitCodeMutation.isPending}
                />
              </div>

              {/* Interactive View - Center */}
              <div className="lg:col-span-5 h-full">
                <InteractiveCodeView
                  code={currentSnippet?.code || ""}
                  language={currentSnippet?.language || "python"}
                  onExplainRequest={handleExplainRequest}
                  isLoading={explainCodeMutation.isPending}
                />
              </div>

              {/* Explanation - Right */}
              <div className="lg:col-span-3 h-full">
                <ExplanationPanel
                  explanation={currentExplanation}
                  explanationId={currentExplanationId}
                  isLoading={explainCodeMutation.isPending}
                />
              </div>
            </div>
          </main>

          <StatusBar />
        </div>
      </div>

      <LearningPatternsDrawer patterns={patterns} />
    </div>
  );
};

export default Index;
