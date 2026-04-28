import { LayoutTemplate, MonitorSmartphone, ShoppingCart } from "lucide-react";

export const templates = [
  {
    id: "saas",
    title: "SaaS Landing",
    icon: LayoutTemplate,
    color: "text-cyan-300",
    bg: "bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border-cyan-400/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.35)]",
    prompt: "A modern SaaS landing page. Hero section with a glowing gradient background and a main CTA. A feature grid with 3 columns and minimalist icons. A pricing section with 3 tiers (highlighting the middle one). A testimonials section and a clean footer. Use dark mode with electric cyan (#00ffff) neon accents and an elegant sans-serif font."
  },
  {
    id: "portfolio",
    title: "Modern Portfolio",
    icon: MonitorSmartphone,
    color: "text-fuchsia-300",
    bg: "bg-gradient-to-r from-fuchsia-500/15 to-purple-500/15 border-fuchsia-400/30 hover:shadow-[0_0_20px_rgba(232,121,249,0.35)]",
    prompt: "A minimal and elegant designer/developer portfolio. Large typography hero section with name and role. A grid of project case studies with subtle hover effects. An about section with text and a simple contact form. Monochromatic dark theme with stark white text and very fine borders. Use Space Mono or another clean monospace font for accents."
  },
  {
    id: "ecommerce",
    title: "E-commerce",
    icon: ShoppingCart,
    color: "text-emerald-300",
    bg: "bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border-emerald-400/30 hover:shadow-[0_0_20px_rgba(52,211,153,0.35)]",
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
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md ${t.bg} hover:brightness-110 transition-all group`}
        >
          <t.icon className={`w-3.5 h-3.5 ${t.color}`} />
          <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground">{t.title}</span>
        </button>
      ))}
    </div>
  );
}
