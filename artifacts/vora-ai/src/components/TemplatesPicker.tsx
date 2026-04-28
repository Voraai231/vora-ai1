import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutTemplate, MonitorSmartphone, ShoppingCart, Rocket, Newspaper,
  GraduationCap, Briefcase, Utensils, X, Sparkles
} from "lucide-react";

export interface Template {
  id: string;
  title: string;
  category: "Landing" | "Portfolio" | "Dashboard" | "Ecommerce" | "Other";
  icon: any;
  color: string;
  bg: string;
  prompt: string;
  description: string;
}

export const templates: Template[] = [
  {
    id: "saas",
    title: "SaaS Landing",
    category: "Landing",
    icon: LayoutTemplate,
    color: "text-cyan-300",
    bg: "from-cyan-500/15 to-blue-500/15 border-cyan-400/30",
    description: "Hero, features, pricing, testimonials, CTA",
    prompt: "A modern SaaS landing page. Hero with a glowing gradient background and a main CTA. A feature grid with 3 columns and minimalist icons. A pricing section with 3 tiers (highlighting the middle one). A testimonials section and a clean footer. Dark mode with electric cyan (#00ffff) neon accents and an elegant sans-serif font.",
  },
  {
    id: "portfolio",
    title: "Modern Portfolio",
    category: "Portfolio",
    icon: MonitorSmartphone,
    color: "text-fuchsia-300",
    bg: "from-fuchsia-500/15 to-purple-500/15 border-fuchsia-400/30",
    description: "Designer/developer showcase",
    prompt: "A minimal and elegant designer/developer portfolio. Large typography hero with name and role. A grid of project case studies with subtle hover effects. An about section with text and a simple contact form. Monochromatic dark theme with stark white text and very fine borders. Use Space Mono for accents.",
  },
  {
    id: "dashboard",
    title: "Analytics Dashboard",
    category: "Dashboard",
    icon: Briefcase,
    color: "text-violet-300",
    bg: "from-violet-500/15 to-indigo-500/15 border-violet-400/30",
    description: "Stats cards, charts, table",
    prompt: "An analytics dashboard mockup. A left sidebar with navigation icons. Top bar with search and avatar. Main area with 4 KPI stat cards (revenue, users, conversion, churn), a large line chart placeholder, a bar chart placeholder, and a recent-activity table with 6 rows. Dark slate theme with electric blue accent for highlights and active states.",
  },
  {
    id: "ecommerce",
    title: "Product Page",
    category: "Ecommerce",
    icon: ShoppingCart,
    color: "text-emerald-300",
    bg: "from-emerald-500/15 to-teal-500/15 border-emerald-400/30",
    description: "Premium gadget detail page",
    prompt: "A product detail page for a premium tech gadget. Large product image gallery on the left, sticky product info on the right (title, price, star rating, color selector circles, large prominent Add to Cart button). Below: grid of related products. Clean modern light theme with high contrast black text and subtle gray borders.",
  },
  {
    id: "startup-launch",
    title: "Startup Launch",
    category: "Landing",
    icon: Rocket,
    color: "text-orange-300",
    bg: "from-orange-500/15 to-red-500/15 border-orange-400/30",
    description: "Coming-soon waitlist page",
    prompt: "A coming-soon launch page for an ambitious startup. Bold headline, one-sentence pitch, an email waitlist input with a Notify Me button, social proof line ('Join 4,200+ on the list'), and a small section explaining what's coming with 3 short bullet points. Dark gradient background (purple to black), neon accent on the CTA, animated subtle gradient blur behind the headline.",
  },
  {
    id: "blog",
    title: "Editorial Blog",
    category: "Other",
    icon: Newspaper,
    color: "text-rose-300",
    bg: "from-rose-500/15 to-pink-500/15 border-rose-400/30",
    description: "Magazine-style index",
    prompt: "An editorial blog index page. Large featured article at the top with cover image, headline, dek and byline. Below, a 3-column grid of recent posts each with thumbnail, category tag, headline, and excerpt. Sidebar with newsletter signup. Serif headlines, sans-serif body. Cream/off-white light theme with a single deep-red accent.",
  },
  {
    id: "course",
    title: "Course / Education",
    category: "Landing",
    icon: GraduationCap,
    color: "text-amber-300",
    bg: "from-amber-500/15 to-yellow-500/15 border-amber-400/30",
    description: "Online course landing",
    prompt: "An online course landing page. Hero with course title, instructor name, and 'Enroll for $99' CTA. Below: 'What you'll learn' grid with 6 outcomes, a curriculum accordion with 8 modules, instructor bio with photo, 3 student testimonials with avatars, FAQ section, and final CTA. Friendly modern theme with deep green accent.",
  },
  {
    id: "restaurant",
    title: "Restaurant",
    category: "Other",
    icon: Utensils,
    color: "text-lime-300",
    bg: "from-lime-500/15 to-green-500/15 border-lime-400/30",
    description: "Menu, hours, reservation",
    prompt: "A boutique restaurant landing page. Full-screen hero photo (use placehold.co), restaurant name in elegant serif. Sections: Story, Menu (3 columns: Starters, Mains, Desserts with prices), Hours & Location, and a Reserve a Table form. Warm earth tones, generous whitespace, premium feel.",
  },
];

const CATEGORIES = ["All", "Landing", "Portfolio", "Dashboard", "Ecommerce", "Other"] as const;

interface Props {
  onSelect: (prompt: string) => void;
  variant?: "pills" | "gallery";
}

export function TemplatesPicker({ onSelect, variant = "pills" }: Props) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<typeof CATEGORIES[number]>("All");

  const filtered = cat === "All" ? templates : templates.filter((t) => t.category === cat);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {templates.slice(0, 3).map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.prompt)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border bg-gradient-to-r backdrop-blur-md ${t.bg} hover:brightness-110 transition-all group`}
          >
            <t.icon className={`w-3.5 h-3.5 ${t.color}`} />
            <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground">{t.title}</span>
          </button>
        ))}
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 transition-all text-xs font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Browse all
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 md:p-10" onClick={() => setOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl max-h-[88vh] bg-background border border-border/50 rounded-2xl overflow-hidden flex flex-col shadow-[0_0_60px_rgba(0,255,255,0.18)]"
            >
              <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Starter Templates</h2>
                  <p className="text-xs text-muted-foreground">Pick a starting point. You can refine anything afterwards.</p>
                </div>
                <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-full hover:bg-secondary/50 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 pt-4 pb-3 flex flex-wrap gap-2 border-b border-border/30">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                      cat === c
                        ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(0,255,255,0.4)]"
                        : "bg-secondary/30 text-muted-foreground border-border/50 hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((t) => (
                  <motion.button
                    key={t.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => { onSelect(t.prompt); setOpen(false); }}
                    className="text-left rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,255,255,0.15)] transition-all p-5 flex flex-col"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.bg} flex items-center justify-center mb-3 border`}>
                      <t.icon className={`w-5 h-5 ${t.color}`} />
                    </div>
                    <div className="font-bold text-sm mb-1">{t.title}</div>
                    <div className="text-xs text-muted-foreground mb-3">{t.description}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mt-auto pt-3 border-t border-border/30">
                      {t.category}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
