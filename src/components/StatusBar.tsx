import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Terminal, TrendingUp, Award } from "lucide-react";

export const StatusBar = () => {
  const { data: sessionStats } = useQuery({
    queryKey: ['session-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id);
      
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const sessionCount = sessions?.length || 0;
      const totalPatterns = sessions?.reduce((sum, s) => sum + (s.patterns_learned || 0), 0) || 0;
      const skillLevel = preferences?.skill_level || 'beginner';
      
      return {
        sessionCount,
        totalPatterns,
        skillLevel
      };
    }
  });

  return (
    <div className="h-10 bg-background border-t border-border flex items-center justify-between px-6 text-xs">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Terminal className="h-3 w-3 text-accent" />
          <span className="text-muted-foreground">v1.0.0</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-accent">terminal learning interface</span>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3 w-3 text-accent" />
          <span className="text-muted-foreground">Sessions:</span>
          <span className="text-foreground font-semibold">{sessionStats?.sessionCount || 0}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Award className="h-3 w-3 text-accent" />
          <span className="text-muted-foreground">Patterns:</span>
          <span className="text-foreground font-semibold">{sessionStats?.totalPatterns || 0}</span>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-accent/10 border border-accent/30">
          <span className="text-muted-foreground">Skill:</span>
          <span className="text-accent font-semibold uppercase">{sessionStats?.skillLevel || 'beginner'}</span>
        </div>
      </div>
    </div>
  );
};
