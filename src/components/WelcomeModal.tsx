import { useState, useEffect } from "react";
import { X, Code, MessageSquare, Brain, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const WelcomeModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("metis-clew-welcome-seen");
    if (!hasSeenWelcome) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem("metis-clew-welcome-seen", "true");
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-300 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`relative max-w-3xl mx-4 p-6 md:p-8 border-2 border-primary/30 bg-card rounded-lg shadow-2xl transition-all duration-300 ${
          isExiting ? "scale-95 opacity-0" : "scale-100 opacity-100 animate-scale-in"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-glow mb-2">
            Find Your Thread Through Code
          </h1>
          <p className="text-sm text-muted-foreground">
            Paste code → Get adaptive explanations → Tool learns what helps you
          </p>
        </div>

        {/* 3-Step Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center space-y-2 p-4 border border-border rounded-lg bg-background/50 hover:border-primary/50 transition-colors">
            <div className="w-14 h-14 rounded-lg border-2 border-primary/50 flex items-center justify-center bg-background">
              <Code className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground mb-1">1. PASTE CODE</h3>
              <p className="text-xs text-muted-foreground">
                Drop any snippet and select language
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center space-y-2 p-4 border border-border rounded-lg bg-background/50 hover:border-primary/50 transition-colors">
            <div className="w-14 h-14 rounded-lg border-2 border-primary/50 flex items-center justify-center bg-background">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground mb-1">2. GET EXPLANATION</h3>
              <p className="text-xs text-muted-foreground">
                Click lines for adaptive insights
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center space-y-2 p-4 border border-border rounded-lg bg-background/50 hover:border-primary/50 transition-colors">
            <div className="w-14 h-14 rounded-lg border-2 border-primary/50 flex items-center justify-center bg-background">
              <Brain className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground mb-1">3. TOOL LEARNS</h3>
              <p className="text-xs text-muted-foreground">
                Adapts to your learning style
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-3">
          <Button
            onClick={handleClose}
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 px-6 py-5 text-base font-bold border-2 border-accent/50 shadow-lg hover:shadow-accent/20 transition-all"
          >
            Start Now
          </Button>
          <p className="text-xs text-muted-foreground">
            No sign-up required • Sign in to save patterns
          </p>
        </div>
      </div>
    </div>
  );
};
