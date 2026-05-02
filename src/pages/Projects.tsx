import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { listProjects, deleteProject, Project } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { VoraIcon } from "@/components/VoraIcon";
import { ArrowLeft, Trash2, ExternalLink, Loader2, LogIn, Globe, Globe2, FileSearch, Search, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export default function Projects() {
  const { user, loading: authLoading, signIn } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    listProjects(user)
      .then(data => setProjects(data))
      .catch(() => toast({ title: "Error loading projects", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !confirm("Delete this project?")) return;
    try {
      await deleteProject(user, id);
      setProjects(projects.filter(p => p.id !== id));
      toast({ title: "Project deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 breathing-glow border border-primary/30">
          <VoraIcon className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-black mb-3 tracking-tight">Sign in to view projects</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Your projects are saved in the cloud under your account. Sign in to access your build history.
        </p>
        <Button onClick={() => setLocation("/auth")} size="lg" className="laser-hover bg-primary text-primary-foreground font-black rounded-full px-10 shadow-[0_0_25px_rgba(255,215,0,0.4)] hover:shadow-[0_0_40px_rgba(255,215,0,0.6)]">
          <LogIn className="w-5 h-5 mr-2" /> Sign In / Register
        </Button>
        <Button variant="ghost" className="mt-4 rounded-full" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Builder
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="h-16 border-b border-border/30 px-6 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="shrink-0 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="font-black text-lg flex items-center gap-2 tracking-tight">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/30 breathing-glow">
              <VoraIcon className="w-4 h-4 text-primary" />
            </div>
            <span className="neon-text">Project History</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{projects.length} saved</span>
          <Button onClick={() => setLocation("/")} size="sm" className="laser-hover bg-primary text-primary-foreground font-bold rounded-full px-5 shadow-[0_0_15px_rgba(255,215,0,0.3)]">
            + New Build
          </Button>
        </div>
      </header>

      <main className="p-6 md:p-10 max-w-7xl mx-auto">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 rounded-2xl bg-secondary/30 flex items-center justify-center mb-6 border border-border/30">
              <VoraIcon className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h2 className="text-2xl font-black mb-2 tracking-tight">No builds yet</h2>
            <p className="text-muted-foreground max-w-sm mb-8">
              Your generated websites will appear here after you save them. Go build something amazing.
            </p>
            <Button onClick={() => setLocation("/")} className="laser-hover bg-primary text-primary-foreground font-bold rounded-full px-8 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
              Start Building
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group relative rounded-xl border border-border/40 bg-card overflow-hidden hover:border-primary/50 transition-all cursor-pointer flex flex-col hover:shadow-[0_0_20px_rgba(255,215,0,0.08)]"
                onClick={() => setLocation(`/?id=${project.id}`)}
              >
                {/* Thumbnail Preview */}
                <div className="h-36 bg-white relative overflow-hidden pointer-events-none select-none border-b border-border/20">
                  <iframe
                    srcDoc={project.html}
                    sandbox="allow-scripts"
                    className="w-[200%] h-[200%] origin-top-left scale-50"
                    tabIndex={-1}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  {project.sharedSlug && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm border border-primary/40 text-[9px] font-black uppercase tracking-widest text-primary">
                      <Globe className="w-2.5 h-2.5" /> Public
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <h3 className="font-black text-base truncate tracking-tight">{project.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 flex-1 leading-relaxed">
                    {project.prompt}
                  </p>

                  {/* SEO & meta badges */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.sitemap && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                        <Globe2 className="w-2 h-2" /> sitemap
                      </span>
                    )}
                    {project.robotsTxt && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                        <FileSearch className="w-2 h-2" /> robots
                      </span>
                    )}
                    {project.seoDescription && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                        <Search className="w-2 h-2" /> seo
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-1">
                    <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDistanceToNow(
                        project.updatedAt?.toDate ? project.updatedAt.toDate() : new Date(project.updatedAt as any),
                        { addSuffix: true }
                      )}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={e => handleDelete(project.id, e)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="secondary" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
