import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const authSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type AuthForm = z.infer<typeof authSchema>;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
  });

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const onSubmit = async (data: AuthForm) => {
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Logged in successfully",
        });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Account created successfully",
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ASCII Art Logo */}
        <div className="mb-8 text-center">
          <pre className="text-glow text-sm md:text-base">
{`
███╗   ███╗███████╗████████╗██╗███████╗     ██████╗██╗     ███████╗██╗    ██╗
████╗ ████║██╔════╝╚══██╔══╝██║██╔════╝    ██╔════╝██║     ██╔════╝██║    ██║
██╔████╔██║█████╗     ██║   ██║███████╗    ██║     ██║     █████╗  ██║ █╗ ██║
██║╚██╔╝██║██╔══╝     ██║   ██║╚════██║    ██║     ██║     ██╔══╝  ██║███╗██║
██║ ╚═╝ ██║███████╗   ██║   ██║███████║    ╚██████╗███████╗███████╗╚███╔███╔╝
╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝╚══════╝     ╚═════╝╚══════╝╚══════╝ ╚══╝╚══╝ 
`}
          </pre>
          <p className="mt-2 text-muted-foreground">
            // Interactive Code Explanation Tool
          </p>
        </div>

        {/* Auth Form */}
        <div className="ascii-box p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-glow">
              ╔═══ {isLogin ? "LOGIN" : "SIGN UP"} ═══╗
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-foreground">
                // Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                className="mt-1 bg-background border-border text-foreground"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-foreground">
                // Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="mt-1 bg-background border-border text-foreground"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading
                ? "[ PROCESSING... ]"
                : isLogin
                ? "[ LOGIN ]"
                : "[ SIGN UP ]"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin
                ? "// Don't have an account? Sign up"
                : "// Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
