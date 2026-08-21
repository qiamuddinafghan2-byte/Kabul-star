import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { BrandMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { DASH, NAV } from "@/constants/testIds";

/**
 * Reusable dashboard chrome with tabbed sidebar.
 * @param {{role: 'Manager'|'Teacher'|'Student', testid: string, tabs: {key:string,label:string,icon:any,render:()=>JSX.Element}[]}} props
 */
export default function DashboardLayout({ role, testid, tabs }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState(tabs[0].key);
  const current = tabs.find((t) => t.key === active) || tabs[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 grid lg:grid-cols-[260px_1fr]">
      <aside
        data-testid={DASH.sidebar}
        className="hidden lg:flex flex-col border-r border-slate-200 bg-white p-6"
      >
        <Link to="/"><BrandMark compact /></Link>
        <div className="mt-8 text-xs font-semibold tracking-widest uppercase text-slate-400">
          {role} menu
        </div>
        <nav className="mt-3 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              data-testid={`tab-${t.key}`}
              onClick={() => setActive(t.key)}
              className={`w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                t.key === active
                  ? "bg-[#0F1E4F] text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-[#0F1E4F]"
              }`}
            >
              {t.icon && <t.icon className="h-4 w-4" />}
              <span>{t.label}</span>
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
            onClick={async () => { await logout(); navigate("/"); }}
            className="w-full mt-3 justify-start rounded-xl text-slate-600"
          >
            <LogOut className="h-4 w-4 mr-2" /> Log out
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
                {current.label}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="rounded-full bg-[#0F1E4F]/5 text-[#0F1E4F] border-0 hidden md:inline-flex">
                {user?.email}
              </Badge>
              <Button
                variant="outline"
                onClick={async () => { await logout(); navigate("/"); }}
                className="rounded-full lg:hidden"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* mobile tabs */}
          <div className="lg:hidden px-4 pb-3 flex gap-2 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                data-testid={`m-tab-${t.key}`}
                onClick={() => setActive(t.key)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  t.key === active ? "bg-[#0F1E4F] text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </header>

        <div className="p-4 md:p-8">{current.render()}</div>
      </div>
    </div>
  );
}
