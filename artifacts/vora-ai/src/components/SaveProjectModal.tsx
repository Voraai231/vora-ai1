import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { saveProject, updateProject } from "@/lib/projects";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function SaveProjectModal({ 
  open, 
  onOpenChange, 
  html, 
  prompt, 
  currentProjectId,
  currentTitle,
  onSaved
}: { 
  open: boolean; 
  onOpenChange: (o: boolean) => void; 
  html: string; 
  prompt: string; 
  currentProjectId?: string;
  currentTitle?: string;
  onSaved: (id: string, title: string) => void;
}) {
  const [title, setTitle] = useState(currentTitle || "");
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!user || !title.trim() || !html) return;
    
    setIsSaving(true);
    try {
      if (currentProjectId) {
        await updateProject(user, currentProjectId, { title, prompt, html });
        onSaved(currentProjectId, title);
        toast({ title: "Project updated" });
      } else {
        const id = await saveProject(user, { title, prompt, html });
        onSaved(id, title);
        toast({ title: "Project saved" });
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{currentProjectId ? "Update Project" : "Save Project"}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input 
            placeholder="e.g. Acme Landing Page" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title.trim() || isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
