import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GraduationCap, Users, ShieldCheck, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StarLogo } from "@/components/brand/Logo";
import { AUTH } from "@/constants/testIds";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const ROLES = [
  { id: "student", label: "Student", icon: GraduationCap, testid: AUTH.roleTabStudent, dash: "/dashboard/student" },
  { id: "teacher", label: "Teacher", icon: Users, testid: AUTH.roleTabTeacher, dash: "/dashboard/teacher" },
  { id: "manager", label: "Manager", icon: ShieldCheck, testid: AUTH.roleTabManager, dash: "/dashboard/manager" },
];

export default function Login() {
  const { role: paramRole } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole] = useState(
    ROLES.find((r) => r.id === paramRole)?.id || "student"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (paramRole && ROLES.find((r) => r.id === paramRole)) setRole(paramRole);
  }, [paramRole]);

  const active = ROLES.find((r) => r.id === role);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!email || !password) {
      setErr("Please enter both email and password.");
      return;
    }
    setBusy(true);
    const res = await login({ email: email.trim(), password, role });
    setBusy(false);
    if (res.ok) {
      toast.success(`Welcome back, ${res.user.name || res.user.email}`);
      navigate(active.dash);
    } else {
      setErr(res.error);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden lg:block overflow-hidden bg-[#0B1638]">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#F5D06B]/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#1E3A8A]/40 blur-3xl" />
        <div className="relative h-full flex flex-col justify-between p-12">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="bg-white/95 rounded-2xl p-2">
              <StarLogo size={40} />
            </div>
            <div className="text-white">
              <div className="font-serif font-black tracking-tight">KABUL STAR</div>
              <div className="text-[10px] tracking-[0.2em] font-semibold text-[#F5D06B]">
                ENGLISH LANGUAGE ACADEMY
              </div>
            </div>
          </Link>

          <div className="max-w-md">
            <div className="text-xs font-semibold tracking-widest uppercase text-[#F5D06B]">Our promise</div>
            <div className="mt-3 font-serif text-4xl font-black text-white leading-tight">
              Together for a Brighter Future.
            </div>
            <div className="mt-4 text-white/80 italic">Come to Learn, Leave to Serve.</div>
          </div>

          <div className="text-xs text-white/50">© {new Date().getFullYear()} Kabul Star Academy</div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center px-4 py-12 md:py-16">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#0F1E4F]">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <Card className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_rgb(0,0,0,0.06)] p-7 md:p-9">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-[#0F1E4F]/5 flex items-center justify-center">
                <active.icon className="h-5 w-5 text-[#0F1E4F]" />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-widest uppercase text-[#B8860B]">
                  {active.label} portal
                </div>
                <div className="font-serif text-2xl font-black text-[#0F1E4F]">Welcome back</div>
              </div>
            </div>

            <Tabs
              value={role}
              onValueChange={(v) => {
                setRole(v);
                navigate(`/login/${v}`, { replace: true });
              }}
              className="mt-6"
            >
              <TabsList className="grid grid-cols-3 rounded-full bg-slate-100 p-1">
                {ROLES.map((r) => (
                  <TabsTrigger
                    key={r.id}
                    value={r.id}
                    data-testid={r.testid}
                    className="rounded-full data-[state=active]:bg-[#0F1E4F] data-[state=active]:text-white text-xs md:text-sm font-semibold"
                  >
                    <r.icon className="h-3.5 w-3.5 mr-1.5" />
                    {r.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {err && (
                <Alert variant="destructive" data-testid={AUTH.errorAlert} className="rounded-xl">
                  <AlertDescription>{err}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold tracking-wider uppercase text-slate-500">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  data-testid={AUTH.emailInput}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@kabulstar.edu"
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold tracking-wider uppercase text-slate-500">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    data-testid={AUTH.passwordInput}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 rounded-xl pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label="Toggle password visibility"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={busy}
                data-testid={AUTH.submitBtn}
                className="w-full h-12 rounded-full bg-[#0F1E4F] hover:bg-[#1E3A8A] text-white font-semibold text-sm shadow-md"
              >
                {busy ? "Signing in…" : `Sign in as ${active.label}`}
              </Button>

              <p className="text-xs text-slate-500 text-center">
                Only registered {active.label.toLowerCase()}s can access this portal.
                Contact the academy manager if you need an account.
              </p>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
