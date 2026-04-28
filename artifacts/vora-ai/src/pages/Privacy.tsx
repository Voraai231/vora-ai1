import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { VoraIcon } from "@/components/VoraIcon";

export default function Privacy() {
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
          <ShieldCheck className="w-4 h-4 text-primary" /> Privacy
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12 prose prose-invert prose-headings:tracking-tight prose-h2:mt-10 prose-h2:text-primary">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: {updated}</p>

        <p>
          Vora AI ("Vora", "we", "us") respects your privacy. This page explains what we collect,
          why we collect it, and how you can control it.
        </p>

        <h2>1. What we collect</h2>
        <ul>
          <li><strong>Account info</strong> — name, email and avatar from Google sign-in (via Firebase Authentication).</li>
          <li><strong>Project content</strong> — the prompts you write and the HTML Vora generates for you. Stored in Firestore under your user account.</li>
          <li><strong>Billing identifiers</strong> — when you purchase Pro or Lifetime, we store your LemonSqueezy license key, variant ID, and order email so we can grant access. We do not see or store your card details — those are handled by LemonSqueezy.</li>
          <li><strong>Usage signal</strong> — your last-active timestamp, used solely for the owner's daily-active-users dashboard.</li>
        </ul>

        <h2>2. What we do NOT collect</h2>
        <ul>
          <li>We don't sell your data.</li>
          <li>We don't run third-party advertising trackers.</li>
          <li>We don't store your card details — payments are processed by LemonSqueezy under their own privacy policy.</li>
        </ul>

        <h2>3. Where it lives</h2>
        <p>
          Account auth is handled by <strong>Google Firebase</strong> (Authentication + Firestore).
          Payments and license keys are handled by <strong>LemonSqueezy</strong>. Generation is handled
          by <strong>Google Gemini</strong> (the prompt you submit is sent to Google's API to produce the HTML output).
        </p>

        <h2>4. Your controls</h2>
        <ul>
          <li>You can delete a project at any time from the My Projects page.</li>
          <li>You can sign out from the avatar menu, which clears local session data.</li>
          <li>To request full deletion of your account and projects, email the address below.</li>
        </ul>

        <h2>5. Cookies & local storage</h2>
        <p>
          We use a small amount of <code>localStorage</code> to remember your last project, your preferred
          theme, and your sign-in session. We do not use third-party cookies for analytics or advertising.
        </p>

        <h2>6. Changes</h2>
        <p>
          If we materially change this policy, we will update the date at the top and (where relevant)
          notify signed-in users.
        </p>

        <h2>7. Contact</h2>
        <p>
          For privacy questions or deletion requests, contact <a href="mailto:saeedautomations295@gmail.com" className="text-primary">saeedautomations295@gmail.com</a>.
        </p>

        <div className="mt-12 flex gap-4 not-prose">
          <Link href="/terms"><Button variant="outline">Terms of Service</Button></Link>
          <Link href="/"><Button>Back to Vora</Button></Link>
        </div>
      </article>
    </div>
  );
}
