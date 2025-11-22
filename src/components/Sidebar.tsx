import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Sparkles, BookOpen, Settings, BarChart3 } from "lucide-react";
import { NavLink } from "./NavLink";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { useLocalSession } from "@/hooks/useLocalSession";
import { SkillBadge } from "./SkillBadge";

export const Sidebar = () => {
  const { sessionData, getProgress, getNextLevelInfo } = useLocalSession();
  
  const { data: recentSnippets } = useQuery({
    queryKey: ['recent-snippets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('recent_snippets')
        .select('*')
        .order('last_accessed', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: userPreferences } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {
        dominant_pattern: sessionData.dominantPattern,
        total_explanations: sessionData.totalExplanations,
      };
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <aside className="w-64 bg-background border-r border-border flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary">METIS CLEW</h1>
        <p className="text-xs text-muted-foreground mt-1">adaptive learning terminal</p>
      </div>

      <ScrollArea className="flex-1">
        {/* Recent Section */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">RECENT</h2>
          </div>
          <div className="space-y-2">
            {recentSnippets && recentSnippets.length > 0 ? (
              recentSnippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className="text-xs p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer border border-border/50"
                >
                  <div className="font-mono text-foreground truncate">{snippet.title}</div>
                  <div className="text-muted-foreground mt-1">{snippet.language}</div>
                </div>
              ))
            ) : sessionData.recentSnippets.length > 0 ? (
              sessionData.recentSnippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className="text-xs p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer border border-border/50"
                >
                  <div className="font-mono text-foreground truncate">{snippet.title}</div>
                  <div className="text-muted-foreground mt-1">{snippet.language}</div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground italic">No recent snippets</div>
            )}
          </div>
        </div>

        {/* Your Learning Section */}
        <div className="p-4">
          <div className="bg-accent/10 border border-accent/30 rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                <h2 className="text-sm font-semibold text-accent">YOUR LEARNING</h2>
              </div>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground block mb-2">Skill Level:</span>
                <SkillBadge 
                  level={sessionData.skillLevel} 
                  showProgress={sessionData.skillLevel !== 'advanced'}
                  progress={getProgress() || 0}
                />
                {getNextLevelInfo() && (
                  <div className="text-muted-foreground mt-2">
                    {getNextLevelInfo()?.remaining} more to {getNextLevelInfo()?.nextLevel}
                  </div>
                )}
                {sessionData.skillLevel === 'advanced' && (
                  <div className="text-accent mt-2 font-semibold">🏆 Max Level!</div>
                )}
              </div>
              
              <div className="pt-2 border-t border-accent/20">
                <span className="text-muted-foreground">Dominant Pattern:</span>
                <div className="text-accent font-semibold mt-1">
                  {userPreferences?.dominant_pattern || 'Building profile...'}
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground">Explanations:</span>
                <div className="text-foreground font-semibold mt-1">
                  {userPreferences?.total_explanations || sessionData.totalExplanations}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-accent/20">
                <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-accent text-xs">Learning actively</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">ACTIONS</h2>
          </div>
          <div className="space-y-1">
            <NavLink
              to="/"
              className="flex items-center gap-2 p-2 rounded text-sm hover:bg-muted/50 transition-colors"
              activeClassName="bg-muted text-primary"
            >
              <BookOpen className="h-4 w-4" />
              <span>Code Analyzer</span>
            </NavLink>
            <div className="flex items-center gap-2 p-2 rounded text-sm text-muted-foreground cursor-not-allowed">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
              <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
            </div>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
};
