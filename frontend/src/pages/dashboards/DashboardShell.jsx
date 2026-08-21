import { Link, useNavigate } from "react-router-dom";
import { LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrandMark } from "@/components/brand/Logo";
import { useAuth } from "@/context/AuthContext";
import { DASH, NAV } from "@/constants/testIds";

export default function DashboardShell({
  role,
  title,
  subtitle,
  modules,
  accent = "#0F1E4F",
  testid,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 grid lg:grid-cols-[260px_1fr]">
      <aside
        data-testid={DASH.sidebar}
        className="hidden lg:flex flex-col border-r border-slate-200 bg-white p-6"
      >
        <Link to="/">
          <BrandMark compact />
        </Link>
        <div className="mt-8 text-xs font-semibold tracking-widest uppercase text-slate-400">
          {role} menu
        </div>
        <nav className="mt-3 space-y-1">
          {modules.map((m) => (
            <button
              key={m}
              type="button"
              className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-[#0F1E4F]"
            >
              <span>{m}</span>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-200">
          <div className="text-xs text-slate-500">Signed in as</div>
          <div className="mt-0.5 text-sm font-semibold text-[#0F1E4F] truncate">
            {user?.name || user?.email}
          </div>
          <Button
            variant="ghost"
            data-testid={NAV.logout}
            onClick={async () => {
              await logout();
              navigate("/");
            }}
            className="w-full mt-3 justify-start rounded-xl text-slate-600"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </Button>
        </div>
      </aside>

      <div data-testid={testid} className="min-h-screen">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase text-[#B8860B]">
                {role} dashboard
              </div>
              <div className="font-serif text-xl md:text-2xl font-black text-[#0F1E4F]">
                {title}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="rounded-full bg-[#0F1E4F]/5 text-[#0F1E4F] border-0">
                {user?.email}
              </Badge>
              <Button
                variant="outline"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                className="rounded-full lg:hidden"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-8">
          <div>
            <p className="text-slate-600 max-w-2xl leading-relaxed">{subtitle}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => (
              <Card
                key={m}
                className="p-6 rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-shadow"
              >
                <div
                  className="h-2 w-10 rounded-full"
                  style={{ background: accent }}
                />
                <div className="mt-4 font-serif text-lg font-black text-[#0F1E4F]">{m}</div>
                <div className="mt-2 text-sm text-slate-500">Coming soon in the next phase.</div>
                <Button
                  disabled
                  variant="outline"
                  className="mt-5 rounded-full text-xs h-9"
                >
                  In development
                </Button>
              </Card>
            ))}
          </div>

          <Card className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <div className="font-serif text-lg font-black text-[#0F1E4F]">
              Foundation ready — modules land next
            </div>
            <div className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
              This is the {role.toLowerCase()} portal shell. Students, classes, attendance, schedules, homework, fees, and communication features will be added in the next phase.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
