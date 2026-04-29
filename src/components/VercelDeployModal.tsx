import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useVercelExport } from "@/hooks/useVercelExport";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ExternalLink, Copy } from "lucide-react";

export function VercelDeployModal({ open, onOpenChange, html, title }: { open: boolean; onOpenChange: (o: boolean) => void; html: string; title: string }) {
  const [token, setToken] = useState(() => localStorage.getItem("vora.vercelToken") || "");
  const [deployUrl, setDeployUrl] = useState("");
  const { exportToVercel, isExporting } = useVercelExport();
  const { toast } = useToast();

  const handleDeploy = async () => {
    if (!token) return;
    localStorage.setItem("vora.vercelToken", token);
    
    try {
      const url = await exportToVercel(html, title, token);
      setDeployUrl(url);
      toast({ title: "Deployed successfully!", description: "Your site is live." });
    } catch (err: any) {
      toast({ title: "Deployment failed", description: err.message, variant: "destructive" });
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(deployUrl);
    toast({ title: "Copied!", description: "URL copied to clipboard." });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Deploy to Vercel</DialogTitle>
        </DialogHeader>
        
        {!deployUrl ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vercel Access Token</label>
              <Input 
                type="password" 
                value={token} 
                onChange={e => setToken(e.target.value)} 
                placeholder="Find this in your Vercel account settings"
              />
              <p className="text-xs text-muted-foreground">
                Get your token from <a href="https://vercel.com/account/tokens" target="_blank" rel="noreferrer" className="text-primary hover:underline">Vercel Account Settings</a>
              </p>
            </div>
            <Button onClick={handleDeploy} disabled={!token || isExporting} className="w-full">
              {isExporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Deploy Project
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex flex-col items-center justify-center text-center space-y-2">
              <div className="text-green-500 font-medium">Deployment Successful</div>
              <a href={deployUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-lg font-bold">{deployUrl.replace("https://", "")}</a>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => window.open(deployUrl, "_blank")}>
                <ExternalLink className="w-4 h-4 mr-2" /> Visit
              </Button>
              <Button variant="outline" className="flex-1" onClick={copyUrl}>
                <Copy className="w-4 h-4 mr-2" /> Copy Link
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
