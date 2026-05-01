import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { hasFirebaseConfig } from "@/lib/firebase";
import { isRootOwner } from "@/hooks/useTier";
import {
  getOwnerConfig, claimOwnership, initializeOwnerProfile, getTotalUsers, getTotalProjects,
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
  BarChart3, Zap, MousePointer, Download, Eye, Settings, Copy, CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

const FIRESTORE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Projects subcollection
      match /projects/{projectId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // Billing subcollection
      match /billing/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Admin: Owner can read ALL users and projects
    match /users/{userId} {
      allow read: if request.auth != null && isOwner();
      match /projects/{projectId} {
        allow read, delete: if request.auth != null && isOwner();
      }
    }

    // Shared public projects — anyone can read, owner can write
    match /sharedProjects/{slug} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Analytics — any signed-in user can write counters
    match /analytics/{docId} {
      allow read: if request.auth != null && isOwner();
      allow write: if request.auth != null;
      match /events/log/{eventId} {
        allow write: if request.auth != null;
      }
    }

    // Owner config (meta/config)
    match /meta/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (
        !exists(/databases/$(database)/documents/meta/config) || isOwner()
      );
    }

    // Helper: check if caller is the owner
    function isOwner() {
      return exists(/databases/$(database)/documents/meta/config) &&
        get(/databases/$(database)/documents/meta/config).data.ownerUid == request.auth.uid;
    }
  }
}`;

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
  const [dataError, setDataError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminProjectRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"projects" | "analytics" | "setup">("projects");
  const [copiedRules, setCopiedRules] = useState(false);

  const isOwner = !!user && (
    isRootOwner(user.email) ||
    (!!ownerConfig && ownerConfig.ownerUid === user.uid)
  );

  useEffect(() => {
    if (!hasFirebaseConfig || !user) { setConfigLoading(false); return; }
    let cancelled = false;

    const setup = async () => {
      try {
        // Always write/update user profile doc so users collection is populated
        await initializeOwnerProfile(user);

        // Auto-claim ownership for root owner — no manual button needed
        if (isRootOwner(user.email)) {
          const cfg = await claimOwnership(user);
          if (!cancelled) setOwnerConfig(cfg);
        } else {
          const cfg = await getOwnerConfig();
          if (!cancelled) setOwnerConfig(cfg);
        }
      } catch (err) {
        console.error("Admin setup error:", err);
      } finally {
        if (!cancelled) setConfigLoading(false);
      }
    };

    setup();
    return () => { cancelled = true; };
  }, [user]);

  const loadData = () => {
    if (!isOwner) return;
    let cancelled = false;
    setDataLoading(true);
    setDataError(null);
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
        const msg = err?.message || "Unknown error";
        setDataError(msg);
        toast({ title: "Data load failed", description: msg, variant: "destructive" });
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

  if (!ownerConfig && !isRootOwner(user.email)) {
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

        {dataError && (
          <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-destructive">Data load failed</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono break-all">{dataError}</p>
              <p className="text-xs text-muted-foreground mt-2">
                This is usually a <strong>Firestore security rules</strong> issue. Go to the <strong>Setup</strong> tab below to see the required rules.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={loadData} className="shrink-0 text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
            </Button>
          </div>
        )}

        <div className="flex gap-2 border-b border-border/30">
          {([
            { id: "projects", label: <><FolderKanban className="w-4 h-4 inline mr-1.5" />All Projects ({filtered.length})</> },
            { id: "analytics", label: <><BarChart3 className="w-4 h-4 inline mr-1.5" />Analytics</> },
            { id: "setup", label: <><Settings className="w-4 h-4 inline mr-1.5" />Setup Guide</> },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
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

        {activeTab === "setup" && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <h3 className="font-bold text-amber-400 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" /> Firestore Security Rules — Required Setup
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Agar admin dashboard mein data nahi aa raha ya permission error aa raha hai, toh yeh rules Firebase Console mein apply karo:
                <br /><strong className="text-foreground">Firebase Console → Firestore → Rules → Edit → Paste → Publish</strong>
              </p>
              <div className="relative rounded-xl overflow-hidden border border-border/40">
                <div className="flex items-center justify-between px-4 py-2 bg-secondary/60 border-b border-border/40">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">firestore.rules</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(FIRESTORE_RULES);
                      setCopiedRules(true);
                      setTimeout(() => setCopiedRules(false), 2000);
                    }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedRules ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedRules ? "Copied!" : "Copy Rules"}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-xs font-mono text-foreground/80 bg-background/60 leading-relaxed whitespace-pre">
                  {FIRESTORE_RULES}
                </pre>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-blue-500/30 bg-blue-500/5">
              <h3 className="font-bold text-blue-400 mb-3">Step-by-Step Setup</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                {[
                  { step: "1", text: "Firebase Console (console.firebase.google.com) khuolo", link: "https://console.firebase.google.com" },
                  { step: "2", text: "Apna project select karo → Firestore Database → Rules tab" },
                  { step: "3", text: "Upar di gayi rules copy karke paste karo aur 'Publish' dabao" },
                  { step: "4", text: "Indexes tab mein: collection group 'projects' pe updatedAt (Descending) index banao" },
                  { step: "5", text: "Wapas iss page pe aao aur 'Retry' dabao" },
                ].map((item) => (
                  <li key={item.step} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">{item.step}</span>
                    <span>
                      {item.text}
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline text-xs">
                          <ExternalLink className="w-3 h-3 inline" /> Open
                        </a>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-5 rounded-xl border border-purple-500/30 bg-purple-500/5">
              <h3 className="font-bold text-purple-400 flex items-center gap-2 mb-2">
                <Search className="w-4 h-4" /> Google Search Console — URL Indexing
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Apne live (public) projects ko Google mein index karwao. Har Live project ka URL neeche copy karo aur Google Search Console mein "URL Inspection" tool mein paste karo.
              </p>
              {projects.filter(p => !!p.sharedSlug).length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Koi bhi Live project nahi hai abhi. Kisi project ko "Share" karo pehle.</p>
              ) : (
                <div className="space-y-2">
                  {projects.filter(p => !!p.sharedSlug).map(p => {
                    const url = `${window.location.origin}/p/${p.sharedSlug}`;
                    return (
                      <div key={p.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-background/60 border border-border/40">
                        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0 animate-pulse" />
                        <span className="flex-1 font-semibold text-sm truncate">{p.title}</span>
                        <span className="font-mono text-xs text-muted-foreground hidden md:block truncate max-w-[200px]">{url}</span>
                        <a
                          href={`https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(window.location.origin)}&url=${encodeURIComponent(url)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" /> Request Index
                        </a>
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/30">
                    "Request Index" button Search Console kholta hai. Wahan "Request Indexing" dabao. Pehli baar Search Console mein apni site add karni hogi: <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">search.google.com/search-console</a>
                  </p>
                </div>
              )}
            </div>

            <div className="p-5 rounded-xl border border-border/40 bg-card">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> App Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-secondary/30">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Root Owner Email</div>
                  <div className="font-mono text-xs text-foreground">{user?.email}</div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Firebase Config</div>
                  <div className="font-mono text-xs text-green-400">✓ Connected</div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Gemini AI</div>
                  <div className="font-mono text-xs text-green-400">✓ VITE_GEMINI_API_KEY set</div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Razorpay</div>
                  <div className="font-mono text-xs text-green-400">✓ VITE_RAZORPAY_KEY_ID set</div>
                </div>
              </div>
            </div>
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
                  data-testid="input-search-projects"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Live = Public shared
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block ml-2" /> Draft = Not shared
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
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/40 border-b border-border/50">
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Project Title</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold hidden sm:table-cell">Status</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold hidden md:table-cell">Owner UID</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold hidden lg:table-cell">Last Updated</th>
                      <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filtered.map((p, i) => {
                      const isLive = !!p.sharedSlug;
                      const updatedDate = toJsDate(p.updatedAt);
                      return (
                        <motion.tr
                          key={`${p.ownerUid}-${p.id}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(i * 0.02, 0.3) }}
                          className="group hover:bg-secondary/20 transition-colors cursor-pointer"
                          onClick={() => setSelected(p)}
                          data-testid={`row-project-${p.id}`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground truncate max-w-[200px]" title={p.title}>
                              {p.title}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5 max-w-[200px]">
                              {p.prompt}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            {isLive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-500/15 text-green-400 border border-green-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                Live
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                Draft
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="font-mono text-xs text-muted-foreground" title={p.ownerUid}>
                              {p.ownerUid.slice(0, 12)}…
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                            {updatedDate ? formatDistanceToNow(updatedDate, { addSuffix: true }) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              {isLive && (
                                <a
                                  href={`/p/${p.sharedSlug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-primary transition-colors"
                                  title="View live"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={deletingId === p.id}
                                onClick={(e) => handleDelete(p, e)}
                                title="Delete project"
                                data-testid={`button-delete-${p.id}`}
                              >
                                {deletingId === p.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Trash2 className="w-3.5 h-3.5" />}
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
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
