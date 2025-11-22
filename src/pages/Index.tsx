import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { trackCodeSubmit, trackExplanation } = useLocalSession();

  // Fetch learning patterns
  const { data: patterns = [] } = useQuery({
    queryKey: ["learning-patterns"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      // Return empty array if not authenticated
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
      
      // Allow usage without auth - just don't save to DB
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

      const { data, error } = await supabase.functions.invoke("explain-code", {
        body: {
          code_snippet: currentSnippet.code,
          selected_code: selectedCode,
          language: currentSnippet.language,
          snippet_id: currentSnippet.id,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCurrentExplanation(data.explanation);
      const levelInfo = trackExplanation();
      queryClient.invalidateQueries({ queryKey: ["learning-patterns"] });
      
      // Show level-up celebration
      if (levelInfo.leveledUp) {
        sonnerToast.success(
          <div className="flex items-center gap-3">
            <span className="text-lg">🎉</span>
            <div>
              <div className="font-semibold">Level Up!</div>
              <div className="text-sm opacity-90">
                You've advanced to <span className="capitalize font-semibold">{levelInfo.newLevel}</span>
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

  return (
    <div className="flex flex-col h-screen bg-background">
      <WelcomeModal />
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col">
          <main className="flex-1 container mx-auto p-4 overflow-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-120px)]">
              {/* Code Input - Left Column */}
              <div className="lg:col-span-4 h-[500px] lg:h-full">
                <CodeInputPanel
                  onSubmit={handleCodeSubmit}
                  isLoading={submitCodeMutation.isPending}
                />
              </div>

              {/* Interactive View - Center Column */}
              <div className="lg:col-span-5 h-[500px] lg:h-full">
                <InteractiveCodeView
                  code={currentSnippet?.code || ""}
                  language={currentSnippet?.language || "python"}
                  onExplainRequest={handleExplainRequest}
                  isLoading={explainCodeMutation.isPending}
                />
              </div>

              {/* Explanation - Right Column */}
              <div className="lg:col-span-3 h-[500px] lg:h-full">
                <ExplanationPanel
                  explanation={currentExplanation}
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
