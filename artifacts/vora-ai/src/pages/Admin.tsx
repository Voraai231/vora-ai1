import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useIsOwner } from "@/hooks/useIsOwner";
import { hasFirebaseConfig } from "@/lib/firebase";
import {
  getOwnerConfig,
  claimOwnership,
  getTotalUsers,
  getTotalProjects,
  getTotalSharedProjects,
  getAllProjects,
  getDailyActiveUsers,
  getPopularPromptWords,
  getRevenueSummary,
  AdminProjectRow,
  OwnerConfig,
  PromptWord,
  RevenueSummary,
} from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoraIcon } from "@/components/VoraIcon";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Loader2, Users, FolderKanban, Globe, ShieldCheck,
  ExternalLink, AlertTriangle, KeyRound, Search, Lock, Activity,
  TrendingUp, Hash, DollarSign, Crown, Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Stats {
  users: number;
  projects: number;
  shares: number;
  dau: number;
}

function toJsDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  return null;
}

export default function Admin() {
  const { user, loading: authLoading, signIn } = useAuth();
  const { isOwner, isSuperAdmin, isEmailOwner, checked: ownerChecked, superAdminConfigured } = useIsOwner();
  const { toast } = useToast();

  const [ownerConfig, setOwnerConfig] = useState<OwnerConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [projects, setProjects] = useState<AdminProjectRow[]>([]);
  const [popular, setPopular] = useState<PromptWord[]>([]);
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminProjectRow | null>(null);

  useEffect(() => {
    if (!hasFirebaseConfig) { setConfigLoading(false); return; }
    let cancelled = false;
    getOwnerConfig()
      .then((cfg) => { if (!cancelled) setOwnerConfig(cfg); })
      .catch((err) => console.error(err))
      .finally(() => { if (!cancelled) setConfigLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isOwner) return;
    let cancelled = false;
    setDataLoading(true);
    Promise.all([
      getTotalUsers(),
      getTotalProjects(),
      getTotalSharedProjects(),
      getDailyActiveUsers(24),
      getAllProjects(200),
      getPopularPromptWords(12),
      getRevenueSummary(),
    ])
      .then(([u, p, s, dau, list, words, rev]) => {
        if (cancelled) return;
        setStats({ users: u, projects: p, shares: s, dau });
        setProjects(list);
        setPopular(words);
        setRevenue(rev);
      })
      .catch((err) => {
        console.error(err);
        toast({
          title: "Failed to load admin data",
          description: err?.message || "Check Firestore rules and indexes.",
          variant: "destructive",
        });
      })
      .finally(() => { if (!cancelled) setDataLoading(false); });
    return () => { cancelled = true; };
  }, [isOwner]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) => p.title.toLowerCase().includes(q) || p.prompt.toLowerCase().includes(q) || p.ownerUid.toLowerCase().includes(q),
    );
  }, [projects, search]);

  const handleClaim = async () => {
    if (!user) return;
    if (superAdminConfigured && !isSuperAdmin) {
      toast({ title: "Locked deployment", description: "This Vora deployment is hard-locked to a different super admin UID. Sign in with the correct account.", variant: "destructive" });
      return;
    }
    try {
      const cfg = await claimOwnership(user);
      setOwnerConfig(cfg);
      toast({ title: "Ownership claimed", description: "You are now the owner of this Vora deployment." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Could not claim", description: err?.message || "Check Firestore rules.", variant: "destructive" });
    }
  };

  if (configLoading || authLoading || !ownerChecked) {
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

  if (!isOwner && !ownerConfig) {
    return (
      <CenteredFrame>
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 neon-border">
          <KeyRound className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Claim ownership</h1>
        <p className="text-muted-foreground mb-2 max-w-md">No owner is set on this Vora deployment yet.</p>
        <p className="text-muted-foreground mb-2 max-w-md text-sm">Claim ownership to lock the admin panel to your account ({user.email}).</p>
        {superAdminConfigured && (
          <p className="text-xs text-amber-400/80 mb-6 max-w-md flex items-center gap-1.5 justify-center">
            <Lock className="w-3.5 h-3.5" /> This deployment is hard-locked via VITE_OWNER_UID — only the configured super-admin UID may claim.
          </p>
        )}
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
        <p className="text-muted-foreground mb-2 max-w-md">
          {superAdminConfigured
            ? "This deployment is locked to a hard-coded super-admin UID. You are not authorized."
            : `This deployment is owned by another account (${ownerConfig?.ownerEmail || "—"}). Sign in with the owner account to continue.`}
        </p>
        <p className="text-xs text-muted-foreground/60 max-w-md font-mono break-all">your uid: {user.uid}</p>
        <BackToBuilder />
      </CenteredFrame>
    );
  }

  const maxPopular = popular[0]?.count || 1;

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="h-16 border-b border-border/30 px-6 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="font-semibold text-lg flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center neon-border">
              <VoraIcon className="w-3.5 h-3.5 text-primary" />
            </div>
            Owner Console
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          {isSuperAdmin && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 text-xs font-semibold text-fuchsia-300">
              <Lock className="w-3.5 h-3.5" /> SUPER ADMIN
            </div>
          )}
          {isEmailOwner && !isSuperAdmin && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-amber-400/40 bg-amber-400/10 text-xs font-semibold text-amber-300">
              <Lock className="w-3.5 h-3.5" /> EMAIL-LOCKED OWNER
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">
            <ShieldCheck className="w-3.5 h-3.5" />
            OWNER
          </div>
        </div>
      </header>

      <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        {/* Top metric grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Users className="w-5 h-5" />} label="Total users" value={stats?.users} loading={dataLoading} />
          <StatCard icon={<Activity className="w-5 h-5" />} label="Active (24h)" value={stats?.dau} loading={dataLoading} highlight />
          <StatCard icon={<FolderKanban className="w-5 h-5" />} label="Projects" value={stats?.projects} loading={dataLoading} />
          <StatCard icon={<Globe className="w-5 h-5" />} label="Public shares" value={stats?.shares} loading={dataLoading} />
        </div>

        {/* Revenue + Popular prompts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue */}
          <section className="lg:col-span-2 rounded-2xl border border-border/50 bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary neon-border">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold">Revenue</h2>
              </div>
              {revenue && (
                <div className="text-right">
                  <div className="text-3xl font-bold tracking-tight tabular-nums text-primary">
                    ${revenue.total.toLocaleString()}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">MRR + Lifetime cash</div>
                </div>
              )}
            </div>

            {dataLoading && !revenue ? (
              <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : revenue ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-lg border border-border/50 bg-secondary/20 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pro · MRR</div>
                    <div className="text-2xl font-bold mt-1">${revenue.estimatedMrr.toLocaleString()}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
                    <div className="text-xs text-muted-foreground mt-1">{revenue.proCount} active subscription{revenue.proCount === 1 ? "" : "s"}</div>
                  </div>
                  <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-yellow-300 font-semibold flex items-center gap-1"><Crown className="w-3 h-3" /> Lifetime</div>
                    <div className="text-2xl font-bold mt-1">${revenue.estimatedLtv.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">{revenue.lifetimeCount} customer{revenue.lifetimeCount === 1 ? "" : "s"}</div>
                  </div>
                </div>

                {revenue.recent.length === 0 ? (
                  <div className="text-xs text-muted-foreground border border-dashed border-border/40 rounded-lg p-4 text-center">
                    No payments recorded yet. License keys you activate will appear here.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Recent activations</div>
                    {revenue.recent.map((r, i) => {
                      const d = toJsDate(r.validatedAt);
                      return (
                        <div key={i} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-secondary/20 border border-border/30">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${r.tier === "billionaire" ? "bg-yellow-500/15 text-yellow-300" : "bg-primary/15 text-primary"}`}>
                              {r.tier === "billionaire" ? "Lifetime" : "Pro"}
                            </span>
                            <span className="truncate">{r.email || r.uid.slice(0, 12)}</span>
                          </div>
                          <span className="text-muted-foreground shrink-0 ml-2">{d ? formatDistanceToNow(d, { addSuffix: true }) : "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : null}
          </section>

          {/* Popular prompts */}
          <section className="rounded-2xl border border-border/50 bg-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary neon-border">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Popular prompts</h2>
                <p className="text-[11px] text-muted-foreground">Most-used keywords across all users</p>
              </div>
            </div>
            {dataLoading && popular.length === 0 ? (
              <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : popular.length === 0 ? (
              <div className="text-xs text-muted-foreground border border-dashed border-border/40 rounded-lg p-4 text-center">
                Not enough data yet.
              </div>
            ) : (
              <ol className="space-y-2">
                {popular.map((w, i) => (
                  <li key={w.word} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-foreground/85"><Hash className="w-3 h-3 inline -mt-0.5 mr-0.5 text-muted-foreground" />{w.word}</span>
                      <span className="text-muted-foreground tabular-nums">{w.count}</span>
                    </div>
                    <div className="h-1 bg-secondary/40 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(w.count / maxPopular) * 100}%` }}
                        transition={{ delay: i * 0.04 }}
                        className="h-full bg-gradient-to-r from-primary to-primary/40 rounded-full"
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Projects gallery */}
        <section>
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold">All projects</h2>
              <p className="text-xs text-muted-foreground">Click any card to view it as the user sees it</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title, prompt or uid"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-secondary/30 border-border/50"
              />
            </div>
          </div>

          {dataLoading && projects.length === 0 ? (
            <div className="py-20 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground border border-dashed border-border/50 rounded-xl">
              No projects yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p, i) => (
                <motion.button
                  key={`${p.ownerUid}-${p.id}`}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  onClick={() => setSelected(p)}
                  className="group text-left rounded-xl border border-border/50 bg-card overflow-hidden hover:border-primary/50 hover:neon-border transition-all flex flex-col"
                >
                  <div className="h-32 bg-white relative overflow-hidden pointer-events-none select-none border-b border-border/30">
                    <iframe
                      srcDoc={p.html}
                      sandbox="allow-scripts"
                      className="w-[200%] h-[200%] origin-top-left scale-50 border-0"
                      tabIndex={-1}
                      title={p.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      {p.sharedSlug && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm border border-primary/40 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          <Globe className="w-3 h-3" /> Public
                        </div>
                      )}
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-3 h-3" /> View as user
                      </div>
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <h3 className="font-bold text-sm truncate">{p.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 flex-1">{p.prompt}</p>
                    <div className="flex items-center justify-between mt-3 text-[10px] uppercase tracking-wider">
                      <span className="font-mono text-muted-foreground/80 truncate max-w-[60%]" title={p.ownerUid}>
                        {p.ownerUid.slice(0, 10)}…
                      </span>
                      <span className="text-muted-foreground">
                        {(() => {
                          const d = toJsDate(p.updatedAt);
                          return d ? formatDistanceToNow(d, { addSuffix: true }) : "—";
                        })()}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </section>
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-10" onClick={() => setSelected(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-5xl h-full max-h-[90vh] bg-background border border-border/50 rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-14 border-b border-border/30 px-4 flex items-center justify-between shrink-0 bg-background/80 backdrop-blur-xl">
              <div className="min-w-0 flex items-center gap-2">
                <div className="px-2 py-0.5 rounded-md bg-fuchsia-500/15 text-fuchsia-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Impersonating
                </div>
                <div className="font-semibold truncate">{selected.title}</div>
                <div className="text-xs text-muted-foreground truncate font-mono">{selected.ownerUid}</div>
              </div>
              <div className="flex items-center gap-2">
                {selected.sharedSlug && (
                  <a
                    href={`/p/${selected.sharedSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Public link <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
              </div>
            </div>
            <iframe
              srcDoc={selected.html}
              sandbox="allow-scripts"
              className="flex-1 w-full bg-white border-0"
              title={selected.title}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, loading, highlight }: { icon: React.ReactNode; label: string; value: number | undefined; loading: boolean; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border bg-card p-5 flex items-center gap-4 transition-colors ${highlight ? "border-primary/40 shadow-[0_0_20px_rgba(0,255,255,0.12)]" : "border-border/50 hover:border-primary/40"}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${highlight ? "bg-primary/15 text-primary neon-border" : "bg-primary/10 text-primary neon-border"}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
        <div className="text-3xl font-bold tracking-tight tabular-nums">
          {loading && value === undefined ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : (value ?? 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function CenteredFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 text-center">{children}</div>
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
