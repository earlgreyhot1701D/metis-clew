import { Sprout, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillBadgeProps {
  level: string;
  showProgress?: boolean;
  progress?: number; // 0-100
  compact?: boolean;
  className?: string;
}

const skillConfig = {
  beginner: {
    icon: Sprout,
    label: "Beginner",
    color: "text-muted-foreground",
    bg: "bg-muted/30",
    border: "border-muted-foreground/50",
    glow: "hover:shadow-[0_0_15px_rgba(148,163,184,0.3)]",
  },
  intermediate: {
    icon: TrendingUp,
    label: "Intermediate",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/50",
    glow: "hover:shadow-[0_0_15px_rgba(96,165,250,0.4)]",
  },
  advanced: {
    icon: Trophy,
    label: "Advanced",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/50",
    glow: "hover:shadow-[0_0_20px_rgba(251,191,36,0.5)]",
  },
};

export const SkillBadge = ({ 
  level, 
  showProgress = false, 
  progress = 0,
  compact = false,
  className 
}: SkillBadgeProps) => {
  const config = skillConfig[level as keyof typeof skillConfig] || skillConfig.beginner;
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <Icon className={cn("h-3 w-3", config.color)} />
        <span className={cn("text-xs font-semibold uppercase", config.color)}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded border transition-all duration-300",
          config.bg,
          config.border,
          config.glow
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} />
        <span className={cn("text-sm font-semibold uppercase", config.color)}>
          {config.label}
        </span>
      </div>

      {showProgress && progress < 100 && (
        <div className="space-y-1">
          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all duration-500", config.bg.replace('/30', '/60'))}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
