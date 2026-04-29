import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { shareProject, unshareProject } from "@/lib/share";
import { useToast } from "@/hooks/use-toast";
import { Link2, Copy, ExternalLink, Loader2, Check, EyeOff, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  title: string;
  prompt: string;
  html: string;
  initialSlug?: string | null;
  onShared?: (slug: string | null) => void;
}

export function ShareModal({ open, onOpenChange, projectId, title, prompt, html, initialSlug, onShared }: ShareModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [slug, setSlug] = useState<string | null>(initialSlug || null);
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setSlug(initialSlug || null);
      setCopied(false);
    }
  }, [open, initialSlug]);

  const shareUrl = slug ? `${window.location.origin}/p/${slug}` : "";

  const handleShare = async () => {
    if (!user || !projectId) return;
    setWorking(true);
    try {
      const newSlug = await shareProject({
        user,
        projectId,
        title,
        prompt,
        html,
        existingSlug: slug || undefined,
      });
      setSlug(newSlug);
      onShared?.(newSlug);
      toast({ title: slug ? "Share updated" : "Project is now public", description: "Anyone with the link can view it." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Could not share project", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setWorking(false);
    }
  };

  const handleUnshare = async () => {
    if (!user || !projectId || !slug) return;
    setWorking(true);
    try {
      await unshareProject(user, projectId, slug);
      setSlug(null);
      onShared?.(null);
      toast({ title: "Link removed", description: "The project is private again." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Could not unshare", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setWorking(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: "Link copied" });
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 neon-border">
            <Link2 className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Share this project</DialogTitle>
          <DialogDescription>
            Publish a public link anyone can open in the browser. No sign-in required for viewers.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {slug ? (
            <motion.div
              key="shared"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary font-semibold">
                <Globe className="w-3.5 h-3.5" />
                Public
              </div>

              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="font-mono text-sm bg-secondary/50 border-border/50"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleCopy}
                  className="shrink-0"
                  aria-label="Copy link"
                >
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(shareUrl, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> Open
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleShare}
                  disabled={working}
                >
                  {working ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Update
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleUnshare}
                disabled={working}
              >
                <EyeOff className="w-4 h-4 mr-2" /> Make private
              </Button>

              <p className="text-xs text-muted-foreground text-center pt-1">
                Updates push the latest saved version of this project.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="not-shared"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="rounded-lg border border-border/50 bg-secondary/30 p-4 text-sm text-muted-foreground">
                Generate a public URL like
                <span className="font-mono text-foreground/80"> {window.location.origin}/p/your-project</span>.
                Viewers see the full interface in a clean, branded frame.
              </div>

              <Button
                onClick={handleShare}
                disabled={working || !user || !projectId}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-full shadow-[0_0_15px_rgba(0,255,255,0.3)]"
              >
                {working ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
                Create public link
              </Button>

              {!projectId && (
                <p className="text-xs text-muted-foreground text-center">
                  Save this project first to enable sharing.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
