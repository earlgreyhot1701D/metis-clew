import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/auth");
    }
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <pre className="text-glow text-xs md:text-sm">
{`███╗   ███╗███████╗████████╗██╗███████╗     ██████╗██╗     ███████╗██╗    ██╗
████╗ ████║██╔════╝╚══██╔══╝██║██╔════╝    ██╔════╝██║     ██╔════╝██║    ██║
██╔████╔██║█████╗     ██║   ██║███████╗    ██║     ██║     █████╗  ██║ █╗ ██║
██║╚██╔╝██║██╔══╝     ██║   ██║╚════██║    ██║     ██║     ██╔══╝  ██║███╗██║
██║ ╚═╝ ██║███████╗   ██║   ██║███████║    ╚██████╗███████╗███████╗╚███╔███╔╝
╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝╚══════╝     ╚═════╝╚══════╝╚══════╝ ╚══╝╚══╝`}
          </pre>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          [ LOGOUT ]
        </Button>
      </div>
    </header>
  );
};
