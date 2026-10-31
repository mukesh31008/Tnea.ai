import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Loader2, ChevronRight, Trophy, Target, Shield, Activity, Fingerprint, MapPin, Building2, Wallet } from "lucide-react";
import { COMMUNITIES, DISTRICTS, type Community } from "@/lib/mock-data";
import { useAllColleges, useBranches, fetchRecommendations } from "@/lib/api";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { AnimatedSection } from "@/components/animated-section";
import { EngineeringBg, CoordinateMarker, EngineeringDivider } from "@/components/engineering-bg";

export const Route = createFileRoute("/counselling")({
  head: () => ({
    meta: [
      { title: "College Suggestions - TNEA.ai" },
      { name: "description", content: "AI-generated dream, target and safe college suggestions for TNEA based on your rank, community and preferences." },
    ],
  }),
  component: Counselling,
});

interface Reco {
  code: string;
  name: string;
  branch: string;
  probability: number;
  expectedCutoff: number;
  reasoning: string;
  category: "dream" | "target" | "safe";
  type?: string;
  district?: string;
}

function Counselling() {
  const { data: colleges = [] } = useAllColleges();
  const { data: branches = [] } = useBranches();

  const [community, setCommunity] = useState<Community | "any">("BC");
  const [gender, setGender] = useState("Female");
  const [genRank, setGenRank] = useState("2500");
  const [commRank, setCommRank] = useState("1400");
  const [cutoff, setCutoff] = useState("192.5");
  const [prefBranches, setPrefBranches] = useState<string[]>([]);
  const [prefDistricts, setPrefDistricts] = useState<string[]>(["Chennai", "Coimbatore"]);
  const [budget, setBudget] = useState<[number]>([150000]);
  const [hostel, setHostel] = useState(true);

  const [recos, setRecos] = useState<Reco[] | null>(null);
  const [inputMode, setInputMode] = useState<"rank" | "cutoff">("rank");

  const { mutate: generate, isPending: loading } = useMutation({
    mutationFn: async () => {
      // Validate inputs before calling API
      if (inputMode === "rank") {
        if (!genRank || isNaN(parseInt(genRank)) || parseInt(genRank) <= 0) {
          throw new Error("Please enter a valid General Rank.");
        }
        if (community !== "any" && (!commRank || isNaN(parseInt(commRank)) || parseInt(commRank) <= 0)) {
          throw new Error("Please enter a valid Community Rank.");
        }
      } else {
        if (!cutoff || isNaN(parseFloat(cutoff)) || parseFloat(cutoff) <= 0 || parseFloat(cutoff) > 200) {
          throw new Error("Please enter a valid Cutoff between 1 and 200.");
        }
      }

      // Map preferred branch names to codes for the backend
      const branchCodes = prefBranches.map(name => {
        const b = branches.find(x => x.name === name);
        return b ? b.code : name;
      });

      let finalGenRank = parseInt(genRank);
      let finalCommRank = parseInt(commRank);

      if (inputMode === "cutoff") {
        const c = parseFloat(cutoff) || 190;
        finalGenRank = Math.max(1, Math.floor((200 - c) * 300));
        finalCommRank = Math.max(1, Math.floor(finalGenRank * 0.6));
      }

      const payload = {
        user_profile: {
          community: community === "any" ? "" : community,
          general_rank: finalGenRank,
          community_rank: finalCommRank
        },
        preferences: {
          preferred_branches: branchCodes,
          preferred_districts: prefDistricts
        }
      };

      const result = await fetchRecommendations(payload);
      return result;
    },
    onSuccess: (data) => {
      const allRecos: Reco[] = [];
      const mapCategory = (list: any[], cat: "dream" | "target" | "safe") => {
        if (!list) return;
        list.forEach((item: any) => {
          const college = colleges.find(c => c.id === item.college_id);
          allRecos.push({
            code: item.college_code || (college ? college.code : String(item.college_id)),
            name: item.name,
            branch: item.branch,
            probability: item.probability,
            expectedCutoff: item.historical_cutoff_rank || 0, // Using rank here because API provides rank
            reasoning: item.explanation || "",
            category: cat,
            type: college?.type || "Unknown",
            district: college?.district || "Unknown"
          });
        });
      };
      mapCategory(data.dream, "dream");
      mapCategory(data.target, "target");
      mapCategory(data.safe, "safe");
      setRecos(allRecos);

    },
    onError: (err: Error) => {
      console.error(err);
      toast.error(err.message || "System Error: Could not generate recommendations.");
    }
  });

  const toggleFrom = (arr: string[], v: string) => arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const groups = recos ? {
    dream: recos.filter((r) => r.category === "dream").slice(0, 5),
    target: recos.filter((r) => r.category === "target").slice(0, 5),
    safe: recos.filter((r) => r.category === "safe").slice(0, 5),
  } : null;

  return (
    <AppShell>
      <section className="relative border-b border-border/60 bg-surface-muted/40 overflow-hidden">
        <EngineeringBg variant="grid" className="absolute inset-0 opacity-40 dark:opacity-20" />
        <div className="container-page py-16 relative z-10">
          <AnimatedSection className="max-w-3xl">
            <CoordinateMarker label="PREDICTOR" className="mb-4" />
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-balance">Smart Predictor</h1>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">Enter your details to get Dream, Target, and Safe college suggestions based on historical data.</p>
          </AnimatedSection>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="grid lg:grid-cols-[400px_1fr] gap-8">
          {/* Engineering Control Panel */}
          <AnimatedSection direction="left" className="h-fit lg:sticky lg:top-20">
            <Card className="p-6 rounded-2xl border-border/60 bg-card/80 backdrop-blur shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="size-2 rounded-full bg-primary animate-pulse" />
                <span className="technical-label">Your Profile</span>
              </div>
              
              <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-4 scrollbar-thin">
                {/* Profile Data */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold border-b border-border/60 pb-2 mb-4 text-foreground/80">
                    <Fingerprint className="size-4" /> Basic Details
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="technical-label block mb-2">Community</Label>
                      <Select value={community} onValueChange={(v) => setCommunity(v as Community | "any")}>
                        <SelectTrigger className="h-10 bg-background font-mono"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any" className="font-mono">Any Community</SelectItem>
                          {COMMUNITIES.map((c) => <SelectItem key={c} value={c} className="font-mono">{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="technical-label block mb-2">Gender</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="h-10 bg-background font-mono"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Female" className="font-mono">Female</SelectItem>
                          <SelectItem value="Male" className="font-mono">Male</SelectItem>
                          <SelectItem value="Other" className="font-mono">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-4 mt-4 text-foreground/80">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Fingerprint className="size-4" /> Marks & Rank
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="mode-toggle" className="text-xs font-semibold cursor-pointer">Rank</Label>
                      <Switch id="mode-toggle" checked={inputMode === "cutoff"} onCheckedChange={(c) => setInputMode(c ? "cutoff" : "rank")} />
                      <Label htmlFor="mode-toggle" className="text-xs font-semibold cursor-pointer">Cutoff</Label>
                    </div>
                  </div>
                  
                  {inputMode === "rank" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="technical-label block mb-2">General Rank</Label>
                        <Input value={genRank} onChange={(e) => setGenRank(e.target.value)} className="h-10 font-mono" />
                      </div>
                      <div>
                        <Label className="technical-label block mb-2">Community Rank</Label>
                        <Input value={commRank} onChange={(e) => setCommRank(e.target.value)} className="h-10 font-mono" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="col-span-1">
                        <div className="flex justify-between items-center mb-3">
                          <Label className="technical-label">Cutoff Mark (Max 200)</Label>
                          <Input value={cutoff} onChange={(e) => setCutoff(e.target.value)} className="h-8 w-24 text-right font-mono bg-primary/5 border-primary/20 focus-visible:ring-primary" />
                        </div>
                        <Slider min={80} max={200} step={0.5} value={[parseFloat(cutoff) || 80]} onValueChange={(v) => setCutoff(v[0].toString())} className="mt-2" />
                        <p className="text-[10px] text-muted-foreground mt-3 text-right">An estimated rank will be used for predictions.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preferences */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold border-b border-border/60 pb-2 mb-4 text-foreground/80 mt-6">
                    <Target className="size-4" /> Preferences
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <Label className="technical-label block mb-2">Preferred Branches</Label>
                      <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-2 scrollbar-thin">
                        {branches.map((b) => (
                          <Badge key={b.code} onClick={() => setPrefBranches(toggleFrom(prefBranches, b.name))}
                            variant={prefBranches.includes(b.name) ? "default" : "outline"}
                            className="cursor-pointer text-[10px] font-mono hover:bg-primary/20 hover:text-primary transition-colors">
                            {b.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="technical-label block mb-2">Preferred District</Label>
                      <Select value={prefDistricts.length === 0 ? "any" : prefDistricts[0]} onValueChange={(v) => setPrefDistricts(v === "any" ? [] : [v])}>
                        <SelectTrigger className="h-10 bg-background font-mono"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any" className="font-mono">Any District</SelectItem>
                          {DISTRICTS.map((d) => <SelectItem key={d} value={d} className="font-mono">{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <Label className="technical-label">Max Annual Fees</Label>
                        <span className="font-mono text-xs font-bold bg-muted px-2 py-1 rounded">₹{budget[0].toLocaleString("en-IN")}</span>
                      </div>
                      <Slider min={20000} max={200000} step={5000} value={budget} onValueChange={(v) => setBudget(v as [number])} />
                    </div>

                    <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/60">
                      <Label htmlFor="hostel-req" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Building2 className="size-3.5" /> Need Hostel?
                      </Label>
                      <Switch id="hostel-req" checked={hostel} onCheckedChange={setHostel} />
                    </div>
                  </div>
                </div>

                <Button onClick={() => generate()} disabled={loading} className="w-full h-12 rounded-xl gap-2 font-bold shadow-glow relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                  {loading ? <Loader2 className="size-4 animate-spin relative z-10" /> : <Activity className="size-4 relative z-10" />}
                  <span className="relative z-10 tracking-wide uppercase text-xs">{loading ? "Finding Colleges..." : "Find Colleges"}</span>
                </Button>
              </div>
            </Card>
          </AnimatedSection>

          {/* Results Area */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              {!recos && !loading && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-16 rounded-2xl text-center border-dashed border-border/80 flex flex-col items-center justify-center min-h-[500px]">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                      <div className="grid size-20 place-items-center rounded-2xl bg-card border border-primary/20 text-primary shadow-sm relative z-10">
                        <Activity className="size-8 opacity-80" />
                      </div>
                    </div>
                    <div className="font-extrabold text-2xl tracking-tight">Ready to Start</div>
                    <p className="text-muted-foreground mt-3 max-w-md text-sm leading-relaxed">
                      Enter your details and click 'Find Colleges' to see your suggestions.
                    </p>
                  </Card>
                </motion.div>
              )}
              
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-h-[500px] flex items-center justify-center"
                >
                  <Card className="p-12 rounded-2xl text-center border-border/60 bg-card/50 flex flex-col items-center w-full max-w-md mx-auto">
                    <div className="relative size-16 mb-6">
                      <svg className="animate-spin size-full text-primary/20" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <Activity className="size-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
                    </div>
                    <div className="font-bold text-lg font-mono">Finding Colleges...</div>
                    <div className="w-full bg-muted rounded-full h-1 mt-4 overflow-hidden">
                      <motion.div 
                        className="bg-primary h-full rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 font-mono uppercase tracking-widest">Searching for the best matches...</p>
                  </Card>
                </motion.div>
              )}
              
              {groups && !loading && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-10"
                >
                  {groups.dream.length === 0 && groups.target.length === 0 && groups.safe.length === 0 ? (
                    <Card className="p-16 rounded-2xl text-center border-dashed border-border/80 flex flex-col items-center justify-center min-h-[300px]">
                      <div className="font-extrabold text-2xl tracking-tight">No colleges found matching your selection.</div>
                      <p className="text-muted-foreground mt-3 max-w-md text-sm leading-relaxed">
                        No colleges matched your current parameters. Try adjusting your rank, community, or removing district/branch filters.
                      </p>
                    </Card>
                  ) : (
                    <>
                      <Group icon={Trophy} title="Dream Colleges" description="Hard to get, but worth a try" list={groups.dream} tone="warning" delay={0} />
                      <Group icon={Target} title="Target Colleges" description="Good chances of admission" list={groups.target} tone="primary" delay={0.2} />
                      <Group icon={Shield} title="Safe Colleges" description="Very high chances of admission" list={groups.safe} tone="success" delay={0.4} />
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function ProbabilityRing({ value, tone }: { value: number; tone: "warning" | "primary" | "success" }) {
  const size = 52;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - value / 100);
  const strokeColor = tone === "warning" ? "var(--warning)" : tone === "success" ? "var(--success)" : "var(--primary)";
  const glowColor = tone === "warning" ? "rgba(234, 179, 8, 0.4)" : tone === "success" ? "rgba(34, 197, 94, 0.4)" : "rgba(99, 102, 241, 0.4)";
  
  return (
    <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full blur-md opacity-50" style={{ backgroundColor: glowColor, transform: 'scale(0.8)' }} />
      <svg width={size} height={size} className="-rotate-90 relative z-10 drop-shadow-sm">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} className="opacity-40" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={strokeColor} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} 
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[11px] font-bold tabular-nums z-10 font-mono">{value}%</div>
    </div>
  );
}

function Group({ icon: Icon, title, description, list, tone, delay }: {
  icon: any; title: string; description: string; list: Reco[]; tone: "warning" | "primary" | "success"; delay: number;
}) {
  if (list.length === 0) return null;
  
  const toneMap = {
    warning: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/30", label: "text-warning" },
    success: { bg: "bg-success/10", text: "text-success", border: "border-success/30", label: "text-success" },
    primary: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/30", label: "text-primary" },
  };
  
  const t = toneMap[tone];

  return (
    <AnimatedSection delay={delay}>
      <div className="flex items-center gap-4 mb-5">
        <div className={`grid size-12 place-items-center rounded-xl ${t.bg} ${t.text} border ${t.border} shadow-sm`}>
          <Icon className="size-5" />
        </div>
        <div>
          <h3 className="font-extrabold text-xl tracking-tight uppercase">{title}</h3>
          <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-wider">{description}</p>
        </div>
      </div>
      
      <div className="grid gap-4">
        {list.map((r) => (
          <div key={`${r.code}-${r.branch}`}>
            <Card className="p-5 rounded-xl card-hover-lift border-border/60 bg-card group relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${t.bg.replace('/10', '/40')}`} />
              <div className="flex items-start gap-5 pl-2">
                <ProbabilityRing value={r.probability} tone={tone} />
                
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Badge variant="secondary" className="font-mono text-[10px] bg-muted/60 border border-border/80">CD:{r.code}</Badge>
                    {r.type && r.type !== "Unknown" && <Badge variant="outline" className="text-[10px]">{r.type}</Badge>}
                    {r.district && r.district !== "Unknown" && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3" /> {r.district}</span>}
                    <span className="font-bold text-base leading-tight group-hover:text-primary transition-colors line-clamp-1">{r.name}</span>
                  </div>
                  <div className="text-sm font-medium text-foreground/80 mt-1">{r.branch}</div>
                  
                  {r.reasoning && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/40 text-sm leading-relaxed text-muted-foreground">
                      {r.reasoning}
                    </div>
                  )}
                  
                  <div className="mt-4 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 bg-background border border-border/60 px-2.5 py-1 rounded-md">
                      <span className="technical-label">Expected Cutoff Rank:</span>
                      <strong className="text-foreground font-mono tabular-nums text-xs">{r.expectedCutoff.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </AnimatedSection>
  );
}
