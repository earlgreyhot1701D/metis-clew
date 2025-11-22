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
        className={`relative max-w-4xl mx-4 p-8 md:p-12 border-2 border-primary/30 bg-card rounded-lg shadow-2xl transition-all duration-300 ${
          isExiting ? "scale-95 opacity-0" : "scale-100 opacity-100 animate-scale-in"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-glow mb-4">
            Find Your Thread Through Code
          </h1>
          <p className="text-lg text-muted-foreground">
            Paste code → Get adaptive explanations → Tool learns what helps you
          </p>
        </div>

        {/* 3-Step Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center space-y-4 p-6 border border-border rounded-lg bg-background/50 hover:border-primary/50 transition-colors">
            <div className="w-20 h-20 rounded-lg border-2 border-primary/50 flex items-center justify-center bg-background">
              <Code className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">1. PASTE CODE</h3>
              <p className="text-sm text-muted-foreground">
                Drop any code snippet into the editor. Select the language and submit.
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center">
            <ArrowRight className="h-8 w-8 text-accent animate-pulse" />
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center space-y-4 p-6 border border-border rounded-lg bg-background/50 hover:border-primary/50 transition-colors">
            <div className="w-20 h-20 rounded-lg border-2 border-primary/50 flex items-center justify-center bg-background">
              <MessageSquare className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">2. GET ADAPTIVE EXPLANATION</h3>
              <p className="text-sm text-muted-foreground">
                Click any line for explanations tailored to your learning style.
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center md:col-start-2">
            <ArrowRight className="h-8 w-8 text-accent animate-pulse" />
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center space-y-4 p-6 border border-border rounded-lg bg-background/50 hover:border-primary/50 transition-colors md:col-start-3">
            <div className="w-20 h-20 rounded-lg border-2 border-primary/50 flex items-center justify-center bg-background">
              <Brain className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">3. TOOL LEARNS YOU</h3>
              <p className="text-sm text-muted-foreground">
                Metis adapts to your patterns, showing what resonates with YOU.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Button
            onClick={handleClose}
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-6 text-lg font-bold border-2 border-accent/50 shadow-lg hover:shadow-accent/20 transition-all"
          >
            Start Now
          </Button>
          <p className="text-xs text-muted-foreground">
            No sign-up required to explore • Sign in to save your learning patterns
          </p>
        </div>
      </div>
    </div>
  );
};
