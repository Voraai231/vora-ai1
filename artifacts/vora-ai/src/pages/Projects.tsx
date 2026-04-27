import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { listProjects, deleteProject, Project } from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { VoraIcon } from "@/components/VoraIcon";
import { ArrowLeft, Trash2, ExternalLink, Loader2, LogIn } from "lucide-react";
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
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProjects = async () => {
      try {
        const data = await listProjects(user);
        setProjects(data);
      } catch (err) {
        console.error("Failed to load projects", err);
        toast({ title: "Error", description: "Could not load projects", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user, authLoading]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProject(user, id);
      setProjects(projects.filter(p => p.id !== id));
      toast({ title: "Project deleted" });
    } catch (err) {
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
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 neon-border">
          <VoraIcon className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Sign in to save projects</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Create an account to save your generated interfaces, access premium features, and build your portfolio.
        </p>
        <Button onClick={signIn} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-full px-8 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
          <LogIn className="w-5 h-5 mr-2" />
          Sign in with Google
        </Button>
        <Button variant="ghost" className="mt-4" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Builder
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="h-16 border-b border-border/30 px-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="font-semibold text-lg flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center neon-border">
              <VoraIcon className="w-3.5 h-3.5 text-primary" />
            </div>
            My Projects
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{projects.length} saved</span>
        </div>
      </header>

      <main className="p-6 md:p-10 max-w-7xl mx-auto">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
              <VoraIcon className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No projects yet</h2>
            <p className="text-muted-foreground max-w-sm mb-8">
              Save your first masterpiece. Go back to the builder and hit the save button on the toolbar.
            </p>
            <Button onClick={() => setLocation("/")} variant="outline" className="rounded-full">
              Back to Builder
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={project.id}
                className="group relative rounded-xl border border-border/50 bg-card overflow-hidden hover:border-primary/50 hover:neon-border transition-all cursor-pointer flex flex-col"
                onClick={() => setLocation(`/?id=${project.id}`)}
              >
                {/* Thumbnail Preview */}
                <div className="h-40 bg-white relative overflow-hidden pointer-events-none select-none border-b border-border/30">
                  <iframe
                    srcDoc={project.html}
                    sandbox="allow-scripts"
                    className="w-[200%] h-[200%] origin-top-left scale-50"
                    tabIndex={-1}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg mb-1 truncate">{project.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
                    {project.prompt}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      {formatDistanceToNow(project.updatedAt?.toDate ? project.updatedAt.toDate() : new Date(project.updatedAt as any), { addSuffix: true })}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={(e) => handleDelete(project.id, e)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="secondary" size="icon" className="h-8 w-8 text-primary">
                        <ExternalLink className="w-4 h-4" />
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
