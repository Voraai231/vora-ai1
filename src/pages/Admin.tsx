import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { hasFirebaseConfig } from "@/lib/firebase";
import {
  getOwnerConfig, claimOwnership, getTotalUsers, getTotalProjects,
  getTotalSharedProjects, getAllProjects, adminDeleteProject,
  getAnalyticsCounters, AdminProjectRow, OwnerConfig, AnalyticsCounters,
} from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoraIcon } from "@/components/VoraIcon";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Loader2, Users, FolderKanban, Globe, ShieldCheck,
  ExternalLink, AlertTriangle, KeyRound, Search, Trash2, RefreshCw,
  BarChart3, Zap, MousePointer, Download, Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Stats {
  users: number;
  projects: number;
  shares: number;
}

function toJsDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  return null;
}

export default function Admin() {
  const { user, loading: authLoading, signIn } = useAuth();
  const { toast } = useToast();

  const [ownerConfig, setOwnerConfig] = useState<OwnerConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsCounters>({});
  const [projects, setProjects] = useState<AdminProjectRow[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminProjectRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"projects" | "analytics">("projects");

  const isOwner = !!user && !!ownerConfig && ownerConfig.ownerUid === user.uid;

  useEffect(() => {
    if (!hasFirebaseConfig) { setConfigLoading(false); return; }
    let cancelled = false;
    getOwnerConfig()
      .then((cfg) => { if (!cancelled) setOwnerConfig(cfg); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setConfigLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const loadData = () => {
    if (!isOwner) return;
    let cancelled = false;
    setDataLoading(true);
    Promise.all([
      getTotalUsers(), getTotalProjects(), getTotalSharedProjects(),
      getAllProjects(200), getAnalyticsCounters(),
    ])
      .then(([u, p, s, list, ac]) => {
        if (cancelled) return;
        setStats({ users: u, projects: p, shares: s });
        setProjects(list);
        setAnalytics(ac);
      })
      .catch((err) => {
        console.error(err);
        toast({ title: "Failed to load admin data", description: err?.message, variant: "destructive" });
      })
      .finally(() => { if (!cancelled) setDataLoading(false); });
    return () => { cancelled = true; };
  };

  useEffect(() => { loadData(); }, [isOwner]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) => p.title.toLowerCase().includes(q) || p.prompt.toLowerCase().includes(q) || p.ownerUid.toLowerCase().includes(q),
    );
  }, [projects, search]);

  const handleClaim = async () => {
    if (!user) return;
    try {
      const cfg = await claimOwnership(user);
      setOwnerConfig(cfg);
      toast({ title: "Ownership claimed", description: "You are now the owner of this Vora deployment." });
    } catch (err: any) {
      toast({ title: "Could not claim", description: err?.message, variant: "destructive" });
    }
  };

  const handleDelete = async (project: AdminProjectRow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    setDeletingId(project.id);
    try {
      await adminDeleteProject(project.ownerUid, project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      if (selected?.id === project.id) setSelected(null);
      toast({ title: "Project deleted" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  if (configLoading || authLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <CenteredFrame>
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 neon-border">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Owner access required</h1>
        <p className="text-muted-foreground mb-8 max-w-md">Sign in with your owner account to view the admin dashboard.</p>
        <Button onClick={signIn} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-full px-8 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
          Sign in with Google
        </Button>
        <BackToBuilder />
      </CenteredFrame>
    );
  }

  if (!ownerConfig) {
    return (
      <CenteredFrame>
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 neon-border">
          <KeyRound className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Claim ownership</h1>
        <p className="text-muted-foreground mb-2 max-w-md">No owner is set on this Vora deployment yet.</p>
        <p className="text-muted-foreground mb-8 max-w-md text-sm">
          Clicking below locks the admin panel permanently to your account ({user.email}).
        </p>
        <Button onClick={handleClaim} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-full px-8 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
          <ShieldCheck className="w-5 h-5 mr-2" />
          Claim this deployment
        </Button>
        <BackToBuilder />
      </CenteredFrame>
    );
  }

  if (!isOwner) {
    return (
      <CenteredFrame>
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6 border border-destructive/30">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Access denied</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          This deployment is owned by {ownerConfig.ownerEmail || "another account"}.
        </p>
        <BackToBuilder />
      </CenteredFrame>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="h-16 border-b border-border/30 px-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="font-semibold text-lg flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center neon-border">
              <VoraIcon className="w-3.5 h-3.5 text-primary" />
            </div>
            Owner Console
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={loadData} disabled={dataLoading} className="text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-4 h-4 ${dataLoading ? "animate-spin" : ""}`} />
          </Button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">
            <ShieldCheck className="w-3.5 h-3.5" /> OWNER
          </div>
        </div>
      </header>

      <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={<Users className="w-5 h-5" />} label="Total users" value={stats?.users} loading={dataLoading} />
          <StatCard icon={<FolderKanban className="w-5 h-5" />} label="Total projects" value={stats?.projects} loading={dataLoading} />
          <StatCard icon={<Globe className="w-5 h-5" />} label="Public shares" value={stats?.shares} loading={dataLoading} />
        </div>

        <div className="flex gap-2 border-b border-border/30">
          {(["projects", "analytics"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "projects" ? <><FolderKanban className="w-4 h-4 inline mr-1.5" />All Projects ({filtered.length})</> : <><BarChart3 className="w-4 h-4 inline mr-1.5" />Analytics</>}
            </button>
          ))}
        </div>

        {activeTab === "analytics" && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AnalyticsCard icon={<Eye className="w-4 h-4" />} label="Page Views" value={analytics.page_view} />
              <AnalyticsCard icon={<Zap className="w-4 h-4" />} label="Generations" value={analytics.generation_complete} />
              <AnalyticsCard icon={<MousePointer className="w-4 h-4" />} label="Magic Wand" value={analytics.magic_wand_used} />
              <AnalyticsCard icon={<Search className="w-4 h-4" />} label="SEO Master" value={analytics.seo_master_used} />
              <AnalyticsCard icon={<Download className="w-4 h-4" />} label="ZIP Exports" value={analytics.export_zip} />
              <AnalyticsCard icon={<Globe className="w-4 h-4" />} label="Vercel Deploys" value={analytics.export_vercel} />
              <AnalyticsCard icon={<FolderKanban className="w-4 h-4" />} label="Saves" value={analytics.project_saved} />
              <AnalyticsCard icon={<Users className="w-4 h-4" />} label="Sign-ins" value={analytics.user_signed_in} />
            </div>
            <p className="text-xs text-muted-foreground mt-4">Analytics events are tracked in real-time via Firestore. Refresh to see latest data.</p>
          </motion.section>
        )}

        {activeTab === "projects" && (
          <section>
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search title, prompt, or uid…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-secondary/30 border-border/50"
                />
              </div>
            </div>

            {dataLoading && projects.length === 0 ? (
              <div className="py-20 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground border border-dashed border-border/50 rounded-xl">
                No projects found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((p, i) => (
                  <motion.div
                    key={`${p.ownerUid}-${p.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="group text-left rounded-xl border border-border/50 bg-card overflow-hidden hover:border-primary/50 hover:neon-border transition-all flex flex-col"
                  >
                    <button type="button" onClick={() => setSelected(p)} className="text-left">
                      <div className="h-32 bg-white relative overflow-hidden pointer-events-none select-none border-b border-border/30">
                        <iframe
                          srcDoc={p.html}
                          sandbox="allow-scripts"
                          className="w-[200%] h-[200%] origin-top-left scale-50 border-0"
                          tabIndex={-1}
                          title={p.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        {p.sharedSlug && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm border border-primary/40 text-[10px] font-semibold uppercase tracking-wider text-primary">
                            <Globe className="w-3 h-3" /> Public
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex-1 flex flex-col">
                        <h3 className="font-bold text-sm truncate">{p.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 flex-1">{p.prompt}</p>
                        <div className="flex items-center justify-between mt-3 text-[10px] uppercase tracking-wider">
                          <span className="font-mono text-muted-foreground/80 truncate max-w-[60%]" title={p.ownerUid}>
                            {p.ownerUid.slice(0, 10)}…
                          </span>
                          <span className="text-muted-foreground">
                            {(() => { const d = toJsDate(p.updatedAt); return d ? formatDistanceToNow(d, { addSuffix: true }) : "—"; })()}
                          </span>
                        </div>
                      </div>
                    </button>
                    <div className="px-3 pb-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs flex-1"
                        disabled={deletingId === p.id}
                        onClick={(e) => handleDelete(p, e)}
                      >
                        {deletingId === p.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Trash2 className="w-3 h-3 mr-1" />}
                        Delete
                      </Button>
                      {p.sharedSlug && (
                        <a href={`/p/${p.sharedSlug}`} target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 px-2 flex items-center gap-1 text-xs rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors">
                          <ExternalLink className="w-3 h-3" /> View
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
          onClick={() => setSelected(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-5xl h-full max-h-[90vh] bg-background border border-border/50 rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-14 border-b border-border/30 px-4 flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-xl">
              <div className="min-w-0">
                <div className="font-semibold truncate">{selected.title}</div>
                <div className="text-xs text-muted-foreground truncate">{selected.ownerUid}</div>
              </div>
              <div className="flex items-center gap-2">
                {selected.sharedSlug && (
                  <a href={`/p/${selected.sharedSlug}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1">
                    Public link <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10"
                  disabled={deletingId === selected.id}
                  onClick={(e) => handleDelete(selected, e)}>
                  {deletingId === selected.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
                  Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
              </div>
            </div>
            <iframe srcDoc={selected.html} sandbox="allow-scripts" className="flex-1 w-full bg-white border-0" title={selected.title} />
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: number | undefined; loading: boolean }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 flex items-center gap-4 hover:border-primary/40 transition-colors">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary neon-border">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
        <div className="text-3xl font-bold tracking-tight tabular-nums">
          {loading && value === undefined ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : (value ?? 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function AnalyticsCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | undefined }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">{icon}</div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
        <div className="text-2xl font-bold tabular-nums">{(value ?? 0).toLocaleString()}</div>
      </div>
    </div>
  );
}

function CenteredFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 text-center">
      {children}
    </div>
  );
}

function BackToBuilder() {
  return (
    <Link href="/">
      <Button variant="ghost" className="mt-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Builder
      </Button>
    </Link>
  );
}
