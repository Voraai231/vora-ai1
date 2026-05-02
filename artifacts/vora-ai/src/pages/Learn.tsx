import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Search, ChevronDown, ChevronUp, Code, Zap, Globe, Youtube, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoraIcon } from "@/components/VoraIcon";

interface Lesson {
  id: string;
  title: string;
  category: "seo" | "youtube" | "vora" | "html";
  level: "beginner" | "intermediate" | "advanced";
  duration: string;
  content: string;
  code?: string;
  codeLanguage?: string;
}

const lessons: Lesson[] = [
  {
    id: "seo-basics",
    title: "SEO Ke 5 Bunyadi Usool (On-Page)",
    category: "seo",
    level: "beginner",
    duration: "8 min",
    content: `Search Engine Optimization (SEO) ka matlab hai apni website ko Google mein upar lana. Ye 5 usool zaroori hain:

1. **Title Tag**: Har page ka alag, 60 characters se kam title hona chahiye. Main keyword title ki shuruat mein hona chahiye.

2. **Meta Description**: 155-160 characters mein page ka khulasa. Click-through rate badhata hai.

3. **Heading Structure (H1-H6)**: Ek page mein sirf ek H1 hona chahiye. H2, H3 sub-topics ke liye use karo.

4. **Image Alt Text**: Har image mein descriptive alt attribute hona chahiye. Google images ko read nahi kar sakta.

5. **Internal Linking**: Apne hi doosre pages se links dalo. Page authority distribute hoti hai.

Ye sab Vora AI ke generated HTML mein automatic include ho jaate hain jab aap "SEO-optimized" prompt dete ho.`,
    code: `<!-- Sahi SEO Structure -->
<!DOCTYPE html>
<html lang="ur">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- 1. Title Tag - 60 chars max -->
  <title>Online Earning Pakistan 2025 | SaeedAutomations</title>
  
  <!-- 2. Meta Description - 155 chars max -->
  <meta name="description" content="Pakistan mein online paise kamane ke proven tareeqe. YouTube automation, affiliate marketing, aur freelancing ke step-by-step guides.">
  
  <!-- 3. Open Graph (Social Media) -->
  <meta property="og:title" content="Online Earning Pakistan 2025">
  <meta property="og:description" content="Proven online earning methods for Pakistan">
  <meta property="og:image" content="https://yoursite.com/og-image.jpg">
  <meta property="og:type" content="website">
  
  <!-- 4. Canonical URL -->
  <link rel="canonical" href="https://yoursite.com/online-earning-pakistan">
</head>
<body>
  <!-- 5. Single H1 with main keyword -->
  <h1>Pakistan Mein Online Earning Ke Tareeqe 2025</h1>
  
  <!-- 6. H2 for sections -->
  <h2>YouTube Se Paise Kaise Kamayein</h2>
  <p>Content yahan...</p>
  
  <!-- 7. Image with alt text -->
  <img src="youtube-setup.jpg" alt="YouTube channel setup ke liye equipment list Pakistan">
  
  <!-- 8. Internal link -->
  <a href="/affiliate-marketing-guide">Affiliate Marketing Guide bhi parhen</a>
</body>
</html>`,
    codeLanguage: "html"
  },
  {
    id: "schema-markup",
    title: "Schema Markup se Rich Results Pao",
    category: "seo",
    level: "intermediate",
    duration: "10 min",
    content: `Schema Markup Google ko batata hai ke aapka content exactly kya hai. Rich snippets milte hain — stars, prices, FAQs — jo click rate 30-40% badhate hain.

**Sabse zyada useful Schema types:**
- **Article/BlogPosting** — blog posts ke liye
- **FAQPage** — FAQ section ke liye (Google directly answer dikhata hai)
- **Product** — ecommerce ke liye (price, availability)
- **LocalBusiness** — local business ke liye (map, phone, hours)
- **VideoObject** — YouTube video embedding ke liye

**Testing tool:** Google ke Search Console mein "Rich Results Test" use karo — paste karo aur dekho ke sahi hai ya nahi.

Vora AI se generate karte waqt prompt mein "add FAQ schema markup" ya "add Article schema" likhein — AI automatically sahi JSON-LD add kar dega.`,
    code: `<!-- FAQ Page Schema - Google ko direct answer dene deta hai -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Pakistan mein online earning ke liye kya zaroori hai?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Internet connection, laptop ya smartphone, aur ek skill (YouTube, freelancing, affiliate marketing). JazzCash ya Easypaisa se payment receive kar sakte ho."
      }
    },
    {
      "@type": "Question", 
      "name": "YouTube se kitna kamaya ja sakta hai Pakistan mein?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Pakistani channel pe $1-$3 per 1000 views milte hain. Automation channels 50k-200k views per month easily kar sakte hain agar niches sahi ho."
      }
    }
  ]
}
</script>

<!-- Article Schema - Blog post ke liye -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "YouTube Automation Pakistan Guide 2025",
  "author": {
    "@type": "Person",
    "name": "Saeed Automations"
  },
  "datePublished": "2025-01-01",
  "dateModified": "2025-05-01",
  "publisher": {
    "@type": "Organization",
    "name": "SaeedAutomations",
    "logo": {
      "@type": "ImageObject",
      "url": "https://yoursite.com/logo.png"
    }
  }
}
</script>`,
    codeLanguage: "html"
  },
  {
    id: "core-web-vitals",
    title: "Core Web Vitals — Google Ranking Factor",
    category: "seo",
    level: "advanced",
    duration: "12 min",
    content: `Google 2021 se Core Web Vitals ko ranking factor maanta hai. Teen main metrics hain:

**1. LCP (Largest Contentful Paint) — under 2.5 seconds**
Sabse bada element (hero image ya heading) kitni jaldi load hota hai.
Fix: Image compression, lazy loading, CDN use karo.

**2. FID / INP (Interaction to Next Paint) — under 200ms**
User click kare toh page kitni jaldi respond kare.
Fix: JavaScript minimize karo, unnecessary libraries hataao.

**3. CLS (Cumulative Layout Shift) — under 0.1**
Page load hote waqt content shift nahi hona chahiye.
Fix: Images ka width/height define karo, fonts preload karo.

**Free Testing Tools:**
- PageSpeed Insights (pagespeed.web.dev)
- Search Console > Core Web Vitals report
- Chrome DevTools > Lighthouse

Vora AI ke generated pages already Tailwind CDN use karte hain jo fast hai. Production mein local Tailwind build use karo CDN ki jagah.`,
    code: `<!-- Core Web Vitals ke liye optimize kiya hua HTML -->
<head>
  <!-- Font preload - CLS fix karta hai -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" as="style">
  
  <!-- Critical CSS inline - LCP improve karta hai -->
  <style>
    body { font-family: 'Inter', sans-serif; margin: 0; }
    .hero { background: #0f172a; color: white; min-height: 100vh; }
  </style>
</head>

<body>
  <!-- Hero image mein width/height dono hona chahiye - CLS fix -->
  <img 
    src="hero.jpg" 
    alt="Hero image"
    width="1200" 
    height="600"
    loading="eager"
    fetchpriority="high"
  >
  
  <!-- Below-fold images ke liye lazy loading -->
  <img 
    src="feature.jpg" 
    alt="Feature description"
    width="800" 
    height="400"
    loading="lazy"
  >
  
  <!-- JavaScript defer karo - FID improve hota hai -->
  <script src="app.js" defer></script>
</body>`,
    codeLanguage: "html"
  },
  {
    id: "youtube-automation-basics",
    title: "YouTube Automation: Faceless Channel Shuru Karo",
    category: "youtube",
    level: "beginner",
    duration: "15 min",
    content: `YouTube Automation matlab hai ek channel banana jisme aapki face nahi hoti — AI voice, AI images, aur AI script se videos banao aur passive income lo.

**Kaun se niches Pakistan ke liye best hain (2025):**
- Motivational Urdu/Hindi quotes
- Islamic reminders (high CPM — $3-6)
- Finance/crypto news (English — high CPM)
- Horror stories narration
- Listicles (Top 10 facts)
- AI News (growing niche)

**Basic Setup (Free se shuru):**
1. **Script** → ChatGPT ya Gemini se likhwao
2. **Voiceover** → ElevenLabs (freemium) ya Murf.ai
3. **Visuals** → Canva Pro ya Pexels (free stock)
4. **Editing** → CapCut (free) ya DaVinci Resolve
5. **Upload** → Proper title + description + tags

**Upload Schedule:**
- Pehle 90 din: Daily ek video (consistency zaroori hai)
- Monetization ke baad: 3-4 videos per week

**Vora AI Use:** Channel website ya landing page banao jo viewers ko newsletter ya affiliate products tak le jaye.`,
    code: `// YouTube Automation Workflow - Node.js script
// (Yeh script locally run hoti hai)

const topics = [
  "Pakistan mein online paise kamane ke 10 tareeqe",
  "Islamic motivational quotes for success",
  "Top 5 AI tools that replace jobs in 2025"
];

// Step 1: Script generate karo (Gemini API use karo)
async function generateScript(topic) {
  const prompt = \`
    Write a 5-minute YouTube video script about: "\${topic}"
    
    Format:
    - Hook (first 30 seconds - must grab attention)
    - Introduction
    - 5 main points with details
    - Call to action (subscribe + comment)
    
    Tone: Engaging, informative, conversational
    Language: Hinglish (mix of Hindi/Urdu and English)
  \`;
  
  // Gemini API call
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GEMINI_API_KEY
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Step 2: Title + Description + Tags
function generateMetadata(topic, script) {
  return {
    title: \`\${topic} | 2025 Guide\`, // 60 chars max
    description: script.substring(0, 500) + "\\n\\n#YouTubeAutomation #OnlineEarning #Pakistan",
    tags: ["online earning", "pakistan", "youtube automation", "passive income", "2025"]
  };
}

// Main function
async function createVideoContent(topic) {
  console.log(\`Creating content for: \${topic}\`);
  const script = await generateScript(topic);
  const metadata = generateMetadata(topic, script);
  
  console.log("Script:", script.substring(0, 200) + "...");
  console.log("Metadata:", metadata);
  
  return { script, metadata };
}

createVideoContent(topics[0]);`,
    codeLanguage: "javascript"
  },
  {
    id: "youtube-seo",
    title: "YouTube SEO — Videos ko Rank Karwao",
    category: "youtube",
    level: "intermediate",
    duration: "10 min",
    content: `YouTube ek search engine hai — doosra sabse bada search engine. Yahan SEO alag hai:

**Title Optimization:**
- Main keyword title ki shuruat mein rakho
- Power words: "2025", "Complete Guide", "Step by Step", "Secret"
- 60 characters ke andar rakho
- ❌ Bad: "How to make money"
- ✅ Good: "Pakistan Mein Online Earning 2025 — 5 Proven Methods [Step by Step]"

**Description SEO:**
- Pehle 2-3 lines mein keywords natural tarike se use karo
- Timestamps dalo (chapter markers — user experience + SEO)
- Relevant links dalo (website, playlist)
- 500+ words description likhne ki koshish karo

**Tags Strategy:**
- Exact match tags: your exact title keywords
- Broad tags: related topics
- Competitor tags: search competitor videos, copy their tags (TubeBuddy)
- Max 500 characters

**Thumbnail Formula:**
- High contrast colors (red/yellow/orange grab attention)
- Close-up face ya bold text
- 3 elements: Image + Text + Number/Emoji
- A/B test: Upload ek video pe 2 alag thumbnails (YouTube Studio > Tests)

**First 48 Hours:**
YouTube algorithm dekhta hai ke pehle 48 ghante mein kitne log video dhundte hain. Share karo WhatsApp groups, Facebook, aur apni community mein.`,
    code: `# YouTube SEO Checklist (Copy-Paste karo aur follow karo)

VIDEO_UPLOAD_CHECKLIST = {
    
    "before_upload": [
        "✅ Thumbnail 1280x720 px, JPEG format",
        "✅ Title mein main keyword shuruat mein hai",
        "✅ Title 60 characters se kam hai",
        "✅ Description 500+ words likha hai",
        "✅ Pehle 2 lines mein keyword naturally hai",
        "✅ Timestamps/chapters add kiye hain",
        "✅ End screen 20 seconds add kiya hai",
        "✅ Cards 3 relevant videos add kiye hain",
    ],
    
    "title_templates": [
        "[KEYWORD] — Complete Guide 2025 (Step by Step)",
        "How to [KEYWORD] in Pakistan | [Number] Methods",
        "[Number] [KEYWORD] Secrets YouTube Nahi Batata",
        "[KEYWORD] Tutorial for Beginners | [Year]",
    ],
    
    "description_template": """
[Main keyword naturally used in first line - 2 sentences]

Is video mein hum seekhenge:
⏱️ 0:00 — Intro
⏱️ 1:30 — [Topic 1]
⏱️ 3:45 — [Topic 2]
⏱️ 7:00 — [Topic 3]
⏱️ 10:30 — Summary

[3-5 paragraphs of detailed content related to video]

🔔 SUBSCRIBE karo aur Bell icon dabao:
https://youtube.com/@yourchannel

📱 Social Media:
Instagram: @yourhandle
Website: https://yourwebsite.com

#Keyword1 #Keyword2 #Keyword3
    """,
    
    "best_posting_times": {
        "pakistan_audience": "6 PM - 10 PM PKT",
        "global_audience": "2 PM - 5 PM EST",
        "best_days": ["Thursday", "Friday", "Saturday"]
    }
}`,
    codeLanguage: "python"
  },
  {
    id: "vora-prompts",
    title: "Vora AI se Pro-Level Websites Banao",
    category: "vora",
    level: "beginner",
    duration: "7 min",
    content: `Vora AI mein acha prompt = acha result. Ye templates use karo:

**Formula:** [Type] + [Style] + [Content] + [Features] + [Colors]

**Examples:**

1. **Landing Page:**
"A dark, premium SaaS landing page for a YouTube automation tool. Hero section with big headline 'Automate Your YouTube Channel', sub-headline, and a green CTA button. Features section with 3 cards. Pricing section with 3 tiers. Dark navy background, green accent color."

2. **Portfolio:**
"A modern minimal portfolio for a Pakistani freelance web developer. Clean white background, black text, Inter font. About section, skills grid, project cards with hover effects, contact form. Mobile responsive."

3. **Blog/Article:**
"A clean blog article page about online earning in Pakistan. Large readable typography, proper heading hierarchy H1-H4, code blocks, blockquotes, table of contents sidebar. Light theme."

**Pro Tips:**
- Specific raho — "dark navy" vs just "dark"
- Features list karo — "carousel, hover effects, accordion FAQ"
- Target audience batao — "for Pakistani students"
- Device specify karo — "mobile-first design"
- After generation: Magic Wand use karo bugs fix karne ke liye
- SEO Master use karo meta tags add karne ke liye`,
    code: `// Best Vora AI Prompts — Copy karo aur modify karo

const PROMPT_TEMPLATES = {
  
  saas_landing: \`
    Create a dark premium SaaS landing page.
    - Hero: "Automate Everything" headline, gradient text, CTA button "Get Started Free"
    - Features: 6 feature cards with icons in a 3-column grid
    - Testimonials: 3 customer cards with avatar, name, company, quote
    - Pricing: 3 tiers (Free/Pro/Enterprise) with feature list
    - CTA section: Full-width gradient banner with email input
    Colors: Dark slate (#0f172a), cyan accent (#06b6d4), white text
  \`,
  
  portfolio: \`
    Create a modern developer portfolio website.
    - Nav: Logo left, links right (About, Work, Contact)
    - Hero: Name, title, short bio, social icons, "View Work" button
    - Skills: Animated progress bars or icon grid
    - Projects: 3-column card grid with image, title, tech stack, GitHub/Live links
    - Contact: Simple form with name, email, message
    - SEO: Proper H1, meta description, Open Graph tags
    Mobile responsive with smooth scroll animations.
  \`,
  
  blog_article: \`
    Create a blog article page about YouTube automation.
    - Professional typography, max-width 720px content
    - Table of contents with anchor links
    - Proper H1, H2, H3 hierarchy
    - Pull quotes in blockquotes
    - Code examples in styled code blocks
    - Author box at bottom
    - Related articles section
    Light theme, Inter font, excellent readability.
  \`,
  
  ecommerce_product: \`
    Create a product page for a digital product (PDF guide).
    - Product image gallery (3 images)
    - Title, price ($29), star rating (4.8/5, 234 reviews)
    - Add to cart button (large, orange)
    - What's included checklist
    - Customer testimonials
    - Money-back guarantee badge
    - FAQ accordion
    Clean white design, trust elements throughout.
  \`
};`,
    codeLanguage: "javascript"
  },
  {
    id: "html-tailwind-speed",
    title: "Tailwind CSS se Jaldi Beautiful UI Banao",
    category: "html",
    level: "intermediate",
    duration: "9 min",
    content: `Tailwind CSS utility-first framework hai — har style ek class se apply hoti hai. Vora AI ke generated code mein Tailwind automatically aata hai.

**Sabse Kaam Aane Wali Classes:**

**Layout:**
- \`flex\`, \`flex-col\`, \`items-center\`, \`justify-between\` — flexbox
- \`grid\`, \`grid-cols-3\`, \`gap-4\` — grid
- \`p-4\`, \`px-6\`, \`py-8\`, \`m-auto\` — spacing

**Typography:**
- \`text-xl\`, \`text-4xl\`, \`font-bold\`, \`font-semibold\`
- \`text-gray-500\`, \`text-white\`, \`text-blue-600\`

**Cards/Boxes:**
- \`bg-white\`, \`rounded-xl\`, \`shadow-lg\`, \`border border-gray-200\`
- \`hover:shadow-xl\`, \`transition-all\`, \`duration-300\`

**Responsive:**
- \`sm:\`, \`md:\`, \`lg:\` prefix laga ke responsive banao
- Example: \`grid-cols-1 md:grid-cols-2 lg:grid-cols-3\`

**Dark Mode:**
- \`dark:bg-gray-900\`, \`dark:text-white\` — dark mode variants

Vora AI mein prompt dene ke baad Code tab mein HTML dekh sakte ho aur copy kar sakte ho.`,
    code: `<!-- Beautiful Card Component - Tailwind CSS -->
<div class="min-h-screen bg-gray-50 p-8">
  
  <!-- Stats Grid -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
      <div class="flex items-center justify-between mb-4">
        <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
          </svg>
        </div>
        <span class="text-green-500 text-sm font-semibold bg-green-50 px-2 py-1 rounded-full">+24%</span>
      </div>
      <div class="text-3xl font-bold text-gray-900">12,849</div>
      <div class="text-gray-500 text-sm mt-1">Total Visitors</div>
    </div>
  </div>
  
  <!-- Feature Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div class="group bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl p-6 text-white cursor-pointer hover:scale-105 transition-transform duration-300">
      <div class="text-4xl mb-4">🚀</div>
      <h3 class="text-xl font-bold mb-2">YouTube Automation</h3>
      <p class="text-white/80 text-sm leading-relaxed">AI se scripts likhwao, videos banao, aur passive income lo bina face dikhai.</p>
      <div class="mt-4 text-xs font-semibold tracking-wider uppercase text-white/60 group-hover:text-white transition-colors">
        Learn More →
      </div>
    </div>
  </div>
  
</div>`,
    codeLanguage: "html"
  }
];

const categoryConfig = {
  seo: { label: "SEO", icon: <Globe className="w-4 h-4" />, color: "text-green-400 bg-green-400/10 border-green-400/30" },
  youtube: { label: "YouTube", icon: <Youtube className="w-4 h-4" />, color: "text-red-400 bg-red-400/10 border-red-400/30" },
  vora: { label: "Vora AI", icon: <Zap className="w-4 h-4" />, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30" },
  html: { label: "HTML/CSS", icon: <Code className="w-4 h-4" />, color: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
};

const levelConfig = {
  beginner: { label: "Beginner", color: "text-green-400 bg-green-400/10" },
  intermediate: { label: "Intermediate", color: "text-yellow-400 bg-yellow-400/10" },
  advanced: { label: "Advanced", color: "text-red-400 bg-red-400/10" },
};

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative mt-4 rounded-xl overflow-hidden border border-border/40">
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/60 border-b border-border/40">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{language}</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-foreground/90 bg-background/60 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function LessonCard({ lesson, expanded, onToggle }: { lesson: Lesson; expanded: boolean; onToggle: () => void }) {
  const cat = categoryConfig[lesson.category];
  const lvl = levelConfig[lesson.level];
  return (
    <motion.div
      layout
      className="rounded-xl border border-border/50 bg-card overflow-hidden hover:border-primary/40 transition-colors"
    >
      <button
        className="w-full text-left p-5 flex items-start gap-4"
        onClick={onToggle}
      >
        <div className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center ${cat.color}`}>
          {cat.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-1.5">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cat.color}`}>{cat.label}</span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${lvl.color}`}>{lvl.label}</span>
            <span className="text-[10px] text-muted-foreground px-2 py-0.5">{lesson.duration}</span>
          </div>
          <h3 className="font-bold text-base leading-snug pr-6">{lesson.title}</h3>
        </div>
        <div className="shrink-0 mt-1 text-muted-foreground">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      <AnimatePresenceWrapper show={expanded}>
        <div className="px-5 pb-5 border-t border-border/30 pt-4">
          <div className="prose prose-sm prose-invert max-w-none text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {lesson.content.split(/\*\*(.*?)\*\*/g).map((part, i) =>
              i % 2 === 1
                ? <strong key={i} className="text-foreground font-semibold">{part}</strong>
                : <span key={i}>{part}</span>
            )}
          </div>
          {lesson.code && (
            <CodeBlock code={lesson.code} language={lesson.codeLanguage || "code"} />
          )}
        </div>
      </AnimatePresenceWrapper>
    </motion.div>
  );
}

function AnimatePresenceWrapper({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

export default function Learn() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = lessons.filter(l => {
    const matchCat = activeCategory === "all" || l.category === activeCategory;
    const q = search.trim().toLowerCase();
    const matchSearch = !q || l.title.toLowerCase().includes(q) || l.content.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="h-16 border-b border-border/30 px-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="font-semibold text-lg flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center neon-border">
              <VoraIcon className="w-3.5 h-3.5 text-primary" />
            </div>
            Learning Hub
          </div>
        </div>
        <div className="text-xs text-muted-foreground hidden sm:block">
          SEO · YouTube Automation · Vora AI Tips
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4 neon-border">
            <BookOpen className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Learning Hub</h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            SEO, YouTube Automation, aur Vora AI ke asali tutorials — Mr. Nightghost aur Human Optimized ke experience se.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Topic search karo…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-secondary/30 border-border/50"
              data-testid="learn-search"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[["all", "Sab"], ...Object.entries(categoryConfig).map(([k, v]) => [k, v.label])].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  activeCategory === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border/50 rounded-xl">
              Is topic par koi lesson nahi mila. Search change karein.
            </div>
          ) : (
            filtered.map((lesson, i) => (
              <motion.div key={lesson.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <LessonCard
                  lesson={lesson}
                  expanded={expandedId === lesson.id}
                  onToggle={() => toggle(lesson.id)}
                />
              </motion.div>
            ))
          )}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-12 p-6 rounded-2xl border border-primary/30 bg-primary/5 text-center">
          <div className="text-2xl mb-2">🚀</div>
          <h3 className="font-bold text-lg mb-2">Seekha? Ab Practice Karo!</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Jo sikhaya — usay Vora AI mein apply karo. Real websites banao, real results dekho.
          </p>
          <Link href="/">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">
              <Zap className="w-4 h-4 mr-2" /> Builder Mein Jao
            </Button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
