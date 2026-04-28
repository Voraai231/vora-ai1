import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { VoraIcon } from "@/components/VoraIcon";

export default function Terms() {
  const updated = "April 28, 2026";
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="h-16 border-b border-border/30 px-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-xl z-20">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center neon-border">
              <VoraIcon className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-semibold">Vora AI</span>
          </Button>
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="w-4 h-4 text-primary" /> Terms
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12 prose prose-invert prose-headings:tracking-tight prose-h2:mt-10 prose-h2:text-primary">
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: {updated}</p>

        <p>
          By using Vora AI you agree to these terms. They are short on purpose — read them.
        </p>

        <h2>1. The service</h2>
        <p>
          Vora AI is a tool that turns a text prompt into a single-page HTML document using Google
          Gemini, displayed in your browser. You can save, share, download, and deploy the result.
        </p>

        <h2>2. Plans & billing</h2>
        <ul>
          <li><strong>Free</strong> — up to 2 saved sites, all core generation features, no downloads.</li>
          <li><strong>Pro ($12/mo)</strong> — unlimited sites, downloads, Magic Wand, SEO Master, Promote Kit.</li>
          <li><strong>Lifetime ($99 once)</strong> — everything in Pro, forever, plus Vercel/Netlify deploy.</li>
        </ul>
        <p>
          Payments are processed by LemonSqueezy. Subscriptions auto-renew until cancelled. Lifetime
          is a one-time purchase. Refund requests within 14 days will be honored if you have not
          downloaded any commercial assets — email the address below to request one.
        </p>

        <h2>3. What you make is yours</h2>
        <p>
          You own the HTML and content you generate. We claim no rights over it. The "Built with Vora AI"
          badge is included by default to support the project — Pro and Lifetime users may remove it.
        </p>

        <h2>4. Acceptable use</h2>
        <ul>
          <li>No illegal content, malware, phishing, or content that infringes other people's rights.</li>
          <li>No attempts to bypass the freemium gate or share license keys with third parties.</li>
          <li>No automated mass-scraping of the service.</li>
        </ul>

        <h2>5. Third parties</h2>
        <p>
          Vora relies on Google Firebase (auth + storage), Google Gemini (AI generation), and LemonSqueezy (payments).
          Their respective terms and privacy policies apply to data they handle.
        </p>

        <h2>6. Disclaimer</h2>
        <p>
          Vora is provided "as is", without warranty. AI-generated output may be incorrect; review it
          before using it in production. We are not liable for damages arising from your use of generated content.
        </p>

        <h2>7. Termination</h2>
        <p>
          We may suspend accounts that violate these terms. You may stop using Vora at any time by
          signing out and deleting your projects.
        </p>

        <h2>8. Contact</h2>
        <p>
          Questions? Email <a href="mailto:saeedautomations295@gmail.com" className="text-primary">saeedautomations295@gmail.com</a>.
        </p>

        <div className="mt-12 flex gap-4 not-prose">
          <Link href="/privacy"><Button variant="outline">Privacy Policy</Button></Link>
          <Link href="/"><Button>Back to Vora</Button></Link>
        </div>
      </article>
    </div>
  );
}
