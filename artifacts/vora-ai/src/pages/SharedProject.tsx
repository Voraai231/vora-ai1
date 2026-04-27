import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { getSharedProject, SharedProject as SharedProjectData } from "@/lib/share";
import { hasFirebaseConfig } from "@/lib/firebase";
import { VoraIcon } from "@/components/VoraIcon";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowUpRight, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function SharedProject() {
  const [, params] = useRoute("/p/:slug");
  const slug = params?.slug;
  const [data, setData] = useState<SharedProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    if (!hasFirebaseConfig) {
      setError("Sharing is not configured on this deployment.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getSharedProject(slug)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setError("This project link is no longer available.");
        } else {
          setData(result);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("Could not load this project.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Loading project</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6 border border-destructive/30">
          <AlertTriangle className="w-7 h-7 text-destructive" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-3">Project not found</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          {error || "This share link may have been removed or never existed."}
        </p>
        <Link href="/">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-full px-6 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
            Build your own with Vora AI
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="h-14 border-b border-border/30 px-4 md:px-6 flex items-center justify-between bg-background/80 backdrop-blur-xl shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center neon-border">
            <VoraIcon className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold tracking-tight text-sm md:text-base group-hover:text-primary transition-colors">Vora AI</span>
        </Link>

        <div className="flex-1 min-w-0 px-4 hidden sm:flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium truncate text-center"
          >
            {data.title}
          </motion.div>
        </div>

        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full neon-border h-8 text-xs md:text-sm"
          >
            Build yours
            <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </header>

      <div className="sm:hidden px-4 py-2 border-b border-border/20 text-sm font-medium truncate text-center">
        {data.title}
      </div>

      <main className="flex-1 bg-white relative">
        <iframe
          title={data.title}
          srcDoc={data.html}
          sandbox="allow-scripts"
          className="w-full h-full border-0 absolute inset-0"
        />
      </main>

      <footer className="px-4 md:px-6 py-2 border-t border-border/30 bg-background/80 backdrop-blur-xl text-[11px] text-muted-foreground flex items-center justify-between shrink-0">
        <span className="truncate">Shared by {data.ownerName}</span>
        <Link href="/" className="hover:text-primary transition-colors">
          Built with Vora AI
        </Link>
      </footer>
    </div>
  );
}
