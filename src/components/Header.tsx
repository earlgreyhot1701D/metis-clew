import { LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check auth state
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged out",
        description: "Your progress won't be saved until you sign back in",
      });
    }
  };

  const handleLogin = () => {
    navigate("/auth");
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <pre className="text-glow text-xs md:text-sm hidden md:block">
{`███╗   ███╗███████╗████████╗██╗███████╗     ██████╗██╗     ███████╗██╗    ██╗
████╗ ████║██╔════╝╚══██╔══╝██║██╔════╝    ██╔════╝██║     ██╔════╝██║    ██║
██╔████╔██║█████╗     ██║   ██║███████╗    ██║     ██║     █████╗  ██║ █╗ ██║
██║╚██╔╝██║██╔══╝     ██║   ██║╚════██║    ██║     ██║     ██╔══╝  ██║███╗██║
██║ ╚═╝ ██║███████╗   ██║   ██║███████║    ╚██████╗███████╗███████╗╚███╔███╔╝
╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝╚══════╝     ╚═════╝╚══════╝╚══════╝ ╚══╝╚══╝`}
          </pre>
          <h1 className="text-glow text-xl md:hidden font-bold">METIS CLEW</h1>
        </div>
        {user ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-foreground hover:text-accent"
          >
            <LogOut className="h-4 w-4" />
            [ LOGOUT ]
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={handleLogin}
            className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <LogIn className="h-4 w-4" />
            [ SIGN IN ]
          </Button>
        )}
      </div>
    </header>
  );
};
