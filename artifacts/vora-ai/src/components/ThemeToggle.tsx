import { useAppTheme, type AppTheme } from "@/contexts/ThemeContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Palette, Moon, Sun, Layers } from "lucide-react";

const THEMES: { id: AppTheme; label: string; description: string; icon: React.ReactNode; preview: string }[] = [
  {
    id: "vora-dark",
    label: "Vora Dark",
    description: "Neon cyan on deep black",
    icon: <Moon className="w-4 h-4" />,
    preview: "bg-[#0a0a12] border-cyan-500/30",
  },
  {
    id: "clean-light",
    label: "Clean Light",
    description: "Minimal white, blue accents",
    icon: <Sun className="w-4 h-4" />,
    preview: "bg-white border-blue-200",
  },
  {
    id: "glassmorphism",
    label: "Glassmorphism",
    description: "Frosted glass, purple glow",
    icon: <Layers className="w-4 h-4" />,
    preview: "bg-[#160d2e] border-purple-500/40",
  },
];

export function ThemeToggle() {
  const { theme, setTheme } = useAppTheme();
  const current = THEMES.find(t => t.id === theme)!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Theme">
          <Palette className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground font-normal">
          <Palette className="w-3.5 h-3.5" /> Theme — {current.label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map(t => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className="flex items-center gap-3 cursor-pointer py-2.5"
          >
            <div className={`w-8 h-6 rounded-md border-2 shrink-0 ${t.preview} ${theme === t.id ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                {t.icon}
                {t.label}
                {theme === t.id && <span className="ml-auto text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">Active</span>}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t.description}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
