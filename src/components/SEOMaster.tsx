import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle2, AlertCircle, XCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SEOCheck {
  id: string;
  passed: boolean;
  score: number;
  message: string;
}

export function SEOMaster({ html, onFix }: { html: string; onFix: (issues: string[]) => void }) {
  const [score, setScore] = useState(0);
  const [checks, setChecks] = useState<SEOCheck[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!html) return;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      
      const newChecks: SEOCheck[] = [];
      let totalScore = 0;

      // Title
      const title = doc.querySelector("title")?.textContent || "";
      const titlePassed = title.length >= 30 && title.length <= 60;
      newChecks.push({ id: "title", passed: titlePassed, score: 15, message: titlePassed ? "Perfect title length" : "Title should be 30-60 characters" });
      if (titlePassed) totalScore += 15;

      // Meta Description
      const desc = doc.querySelector('meta[name="description"]')?.getAttribute("content") || "";
      const descPassed = desc.length >= 70 && desc.length <= 160;
      newChecks.push({ id: "desc", passed: descPassed, score: 15, message: descPassed ? "Good meta description" : "Meta description should be 70-160 characters" });
      if (descPassed) totalScore += 15;

      // Open Graph
      const hasOgTitle = !!doc.querySelector('meta[property="og:title"]');
      const hasOgDesc = !!doc.querySelector('meta[property="og:description"]');
      const hasOgImage = !!doc.querySelector('meta[property="og:image"]');
      const ogPassed = hasOgTitle && hasOgDesc && hasOgImage;
      newChecks.push({ id: "og", passed: ogPassed, score: 15, message: ogPassed ? "Open Graph tags present" : "Missing some Open Graph tags" });
      if (ogPassed) totalScore += 15;

      // H1
      const h1s = doc.querySelectorAll("h1");
      const h1Passed = h1s.length === 1;
      newChecks.push({ id: "h1", passed: h1Passed, score: 10, message: h1Passed ? "Exactly one H1 tag" : `Found ${h1s.length} H1 tags (should be exactly 1)` });
      if (h1Passed) totalScore += 10;

      // Headings hierarchy
      const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6")).map(h => parseInt(h.tagName[1]));
      let hierarchyPassed = true;
      for (let i = 1; i < headings.length; i++) {
        if (headings[i] > headings[i-1] + 1) hierarchyPassed = false;
      }
      newChecks.push({ id: "hierarchy", passed: hierarchyPassed, score: 10, message: hierarchyPassed ? "Structured heading hierarchy" : "Skipped heading levels detected" });
      if (hierarchyPassed) totalScore += 10;

      // Images Alt
      const imgs = Array.from(doc.querySelectorAll("img"));
      const imgPassed = imgs.length === 0 || imgs.every(img => !!img.getAttribute("alt"));
      newChecks.push({ id: "img", passed: imgPassed, score: 10, message: imgPassed ? "All images have alt attributes" : "Some images missing alt attributes" });
      if (imgPassed) totalScore += 10;

      // HTML Lang
      const lang = doc.documentElement.getAttribute("lang");
      const langPassed = !!lang;
      newChecks.push({ id: "lang", passed: langPassed, score: 5, message: langPassed ? "Language attribute set" : "Missing html lang attribute" });
      if (langPassed) totalScore += 5;

      // Viewport
      const viewport = !!doc.querySelector('meta[name="viewport"]');
      newChecks.push({ id: "viewport", passed: viewport, score: 5, message: viewport ? "Viewport meta tag present" : "Missing viewport meta tag" });
      if (viewport) totalScore += 5;

      // Favicon
      const favicon = !!doc.querySelector('link[rel="icon"]') || !!doc.querySelector('link[rel="shortcut icon"]');
      newChecks.push({ id: "favicon", passed: favicon, score: 5, message: favicon ? "Favicon linked" : "Missing favicon" });
      if (favicon) totalScore += 5;

      // Text/HTML Ratio
      const textLen = doc.body?.textContent?.trim().length || 0;
      const htmlLen = html.length || 1;
      const ratioPassed = (textLen / htmlLen) > 0.1;
      newChecks.push({ id: "ratio", passed: ratioPassed, score: 10, message: ratioPassed ? "Good text-to-HTML ratio" : "Low text content relative to HTML" });
      if (ratioPassed) totalScore += 10;

      setChecks(newChecks);
      setScore(totalScore);
    }, 600);

    return () => clearTimeout(timer);
  }, [html]);

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const failedIssues = checks.filter(c => !c.passed).map(c => c.message);

  return (
    <div className="w-80 bg-card border-l border-border/50 h-full flex flex-col shrink-0">
      <div className="h-14 border-b border-border/30 flex items-center px-4 font-semibold gap-2">
        <Search className="w-4 h-4 text-primary" />
        SEO Master
      </div>
      
      <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
        <div className="flex flex-col items-center justify-center relative py-4">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-secondary"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeLinecap="round"
              className={score > 80 ? "text-green-500" : score > 50 ? "text-yellow-500" : "text-destructive"}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ strokeDasharray: circumference }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{score}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Checks</h4>
          {checks.map(check => (
            <div key={check.id} className="flex items-start gap-2 text-sm">
              {check.passed ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              )}
              <span className={check.passed ? "text-foreground" : "text-muted-foreground"}>
                {check.message}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-6">
          <Button 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={failedIssues.length === 0}
            onClick={() => onFix(failedIssues)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Fix SEO with AI
          </Button>
        </div>
      </div>
    </div>
  );
}
