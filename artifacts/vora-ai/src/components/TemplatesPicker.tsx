import { LayoutTemplate, MonitorSmartphone, ShoppingCart } from "lucide-react";

export const templates = [
  {
    id: "saas",
    title: "SaaS Landing",
    icon: LayoutTemplate,
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
    prompt: "A modern SaaS landing page. Hero section with a glowing gradient background and a main CTA. A feature grid with 3 columns and minimalist icons. A pricing section with 3 tiers (highlighting the middle one). A testimonials section and a clean footer. Use dark mode with electric cyan (#00ffff) neon accents and an elegant sans-serif font."
  },
  {
    id: "portfolio",
    title: "Modern Portfolio",
    icon: MonitorSmartphone,
    color: "text-purple-400",
    bg: "bg-purple-400/10 border-purple-400/20",
    prompt: "A minimal and elegant designer/developer portfolio. Large typography hero section with name and role. A grid of project case studies with subtle hover effects. An about section with text and a simple contact form. Monochromatic dark theme with stark white text and very fine borders. Use Space Mono or another clean monospace font for accents."
  },
  {
    id: "ecommerce",
    title: "E-commerce",
    icon: ShoppingCart,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
    prompt: "A product detail page for a premium tech gadget. Large product image gallery on the left, sticky product info on the right. Includes title, price, star rating, color selector (circles), and a large prominent 'Add to Cart' button. Below, a grid of related products. Clean, modern, light theme with high contrast black text and subtle gray borders."
  }
];

export function TemplatesPicker({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {templates.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.prompt)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${t.bg} hover:brightness-110 transition-all group`}
        >
          <t.icon className={`w-3.5 h-3.5 ${t.color}`} />
          <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground">{t.title}</span>
        </button>
      ))}
    </div>
  );
}
