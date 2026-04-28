import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Cloud, Download, Loader2, ExternalLink, ArrowRight, CheckCircle2 } from "lucide-react";
import { useZipExport } from "@/hooks/useZipExport";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  html: string;
  title: string;
  prompt: string;
  stripBadge?: boolean;
}

export function DeployModal({ open, onOpenChange, html, title, prompt, stripBadge }: Props) {
  const { exportZip, isExporting } = useZipExport();
  const { toast } = useToast();
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    await exportZip(html, prompt, title, { stripBadge });
    setDownloaded(true);
    toast({ title: "ZIP downloaded", description: "Now drop it on Vercel or Netlify below." });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setDownloaded(false); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Cloud className="w-6 h-6 text-primary" />
            Deploy to your account
          </DialogTitle>
          <DialogDescription>
            Two clicks to live: download the production ZIP, then drag it into Vercel or Netlify.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-4 mt-2">
          <li className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${downloaded ? "bg-primary/20 text-primary border border-primary/40" : "bg-secondary/60 text-foreground border border-border"}`}>
                {downloaded ? <CheckCircle2 className="w-4 h-4" /> : "1"}
              </div>
              <div>
                <div className="font-semibold">Download production ZIP</div>
                <div className="text-xs text-muted-foreground">index.html, styles.css, assets/, vercel.json, README</div>
              </div>
            </div>
            <Button
              onClick={handleDownload}
              disabled={isExporting || !html}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,255,255,0.3)]"
            >
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              {downloaded ? "Download again" : "Download ZIP"}
            </Button>
          </li>

          <li className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${downloaded ? "bg-primary/20 text-primary border border-primary/40" : "bg-secondary/60 text-foreground border border-border"}`}>
                2
              </div>
              <div>
                <div className="font-semibold">Drop it on your host</div>
                <div className="text-xs text-muted-foreground">Drag the unzipped folder into either page below</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="https://vercel.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/60 transition-all p-3 flex items-center gap-3"
              >
                <svg className="w-7 h-7 text-foreground" viewBox="0 0 76 65" fill="currentColor"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z"/></svg>
                <div className="flex-1">
                  <div className="font-semibold text-sm">Vercel</div>
                  <div className="text-[11px] text-muted-foreground">Import a folder</div>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
              </a>
              <a
                href="https://app.netlify.com/drop"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/60 transition-all p-3 flex items-center gap-3"
              >
                <svg className="w-7 h-7" viewBox="0 0 256 256" fill="#00C7B7" xmlns="http://www.w3.org/2000/svg"><path d="M64.5 142.5l45.6-45.6c1.7-1.7 4.6-1.7 6.4 0l45.6 45.6c1.7 1.7 1.7 4.6 0 6.4l-45.6 45.6c-1.7 1.7-4.6 1.7-6.4 0l-45.6-45.6c-1.8-1.8-1.8-4.7 0-6.4z"/></svg>
                <div className="flex-1">
                  <div className="font-semibold text-sm">Netlify Drop</div>
                  <div className="text-[11px] text-muted-foreground">Drag-and-drop deploy</div>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
              </a>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Both opens in a new tab. Sign in with your own account — your site lives on your domain.
            </p>
          </li>
        </ol>
      </DialogContent>
    </Dialog>
  );
}
