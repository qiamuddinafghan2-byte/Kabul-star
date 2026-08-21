import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, GraduationCap, Users, ShieldCheck, LogOut } from "lucide-react";
import { BrandMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV } from "@/constants/testIds";
import { useAuth } from "@/context/AuthContext";

const NAV_LINKS = [
  { to: "/", label: "Home", testid: NAV.home, end: true },
  { to: "/about", label: "About", testid: NAV.about },
  { to: "/programs", label: "Programs", testid: NAV.programs },
  { to: "/announcements", label: "Announcements", testid: NAV.announcements },
  { to: "/contact", label: "Contact", testid: NAV.contact },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const dashboardPath =
    user && typeof user === "object"
      ? user.role === "manager"
        ? "/dashboard/manager"
        : user.role === "teacher"
          ? "/dashboard/teacher"
          : "/dashboard/student"
      : null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/" data-testid={NAV.logo} className="shrink-0">
          <BrandMark compact />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              data-testid={l.testid}
              className={({ isActive }) =>
                `px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-[#0F1E4F] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user && typeof user === "object" ? (
            <>
              <Button
                variant="outline"
                className="rounded-full border-[#0F1E4F]/20 text-[#0F1E4F] hover:bg-[#0F1E4F]/5"
                onClick={() => navigate(dashboardPath)}
                data-testid="nav-dashboard"
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                data-testid={NAV.logout}
                className="rounded-full"
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                Log out
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  data-testid={NAV.loginMenu}
                  className="rounded-full bg-[#0F1E4F] hover:bg-[#1E3A8A] text-white shadow-sm"
                >
                  Login
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  data-testid={NAV.loginStudent}
                  onClick={() => navigate("/login/student")}
                >
                  <GraduationCap className="h-4 w-4 mr-2 text-[#0F1E4F]" />
                  Student Login
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-testid={NAV.loginTeacher}
                  onClick={() => navigate("/login/teacher")}
                >
                  <Users className="h-4 w-4 mr-2 text-[#0F1E4F]" />
                  Teacher Login
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-testid={NAV.loginManager}
                  onClick={() => navigate("/login/manager")}
                >
                  <ShieldCheck className="h-4 w-4 mr-2 text-[#B8860B]" />
                  Manager Login
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <button
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200"
          onClick={() => setOpen((v) => !v)}
          data-testid={NAV.mobileToggle}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                data-testid={`m-${l.testid}`}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-semibold ${
                    isActive ? "bg-[#0F1E4F] text-white" : "text-slate-700"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="pt-2 border-t border-slate-200 mt-2 grid grid-cols-1 gap-2">
              {user && typeof user === "object" ? (
                <>
                  <Button
                    className="w-full rounded-full bg-[#0F1E4F] text-white"
                    onClick={() => {
                      setOpen(false);
                      navigate(dashboardPath);
                    }}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-full"
                    onClick={async () => {
                      await logout();
                      setOpen(false);
                      navigate("/");
                    }}
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    data-testid={`m-${NAV.loginStudent}`}
                    variant="outline"
                    className="w-full rounded-full border-[#0F1E4F]/20 text-[#0F1E4F]"
                    onClick={() => {
                      setOpen(false);
                      navigate("/login/student");
                    }}
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Student Login
                  </Button>
                  <Button
                    data-testid={`m-${NAV.loginTeacher}`}
                    variant="outline"
                    className="w-full rounded-full border-[#0F1E4F]/20 text-[#0F1E4F]"
                    onClick={() => {
                      setOpen(false);
                      navigate("/login/teacher");
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Teacher Login
                  </Button>
                  <Button
                    data-testid={`m-${NAV.loginManager}`}
                    className="w-full rounded-full bg-[#0F1E4F] text-white"
                    onClick={() => {
                      setOpen(false);
                      navigate("/login/manager");
                    }}
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Manager Login
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
