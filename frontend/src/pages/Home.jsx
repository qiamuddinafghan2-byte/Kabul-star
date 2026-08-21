import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, BookOpen, GraduationCap, Users, ShieldCheck, Award, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarLogo } from "@/components/brand/Logo";
import { HOME } from "@/constants/testIds";
import { api } from "@/lib/api";

const HERO_IMG = "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1600&q=80";

const PROGRAM_STEPS = [
  "Pre-Beginner", "Beginner", "Book 1", "Book 2", "Book 3",
  "Book 4", "Book 5", "Book 6", "Book 7", "Book 8",
  "Book 9", "Book 10", "Book 11", "Book 12", "PELP",
];

function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function Home() {
  const [announcements, setAnnouncements] = useState([]);
  useEffect(() => {
    api.get("/announcements/public").then((r) => setAnnouncements(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0B1638]">
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url('${HERO_IMG}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1638] via-[#0F1E4F]/90 to-[#0F1E4F]/60" />
          <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-[#F5D06B]/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#1E3A8A]/40 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 md:px-6 py-20 md:py-28 lg:py-32 grid gap-12 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-8 text-white"
          >
            <Badge className="bg-white/10 border border-white/20 text-[#F5D06B] rounded-full px-4 py-1.5 mb-6 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Since day one — a home for learners
            </Badge>
            <h1 className="font-serif font-black tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
              KABUL STAR
              <br />
              <span className="text-[#F5D06B]">ENGLISH LANGUAGE ACADEMY</span>
            </h1>
            <p className="mt-6 text-2xl md:text-3xl font-serif italic text-white/95">
              Together for a Brighter Future
            </p>
            <p className="mt-2 text-base md:text-lg text-white/80 max-w-2xl">
              Come to Learn, Leave to Serve — structured English language education from foundational levels through professional English (PELP).
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button
                asChild
                data-testid={HOME.heroCta}
                className="rounded-full h-12 px-6 bg-[#F5D06B] text-[#0B1638] hover:bg-[#FBBF24] font-semibold shadow-lg"
              >
                <Link to="/programs">
                  Explore programs
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
              <Button
                asChild
                data-testid={HOME.studentLoginBtn}
                variant="outline"
                className="rounded-full h-12 px-6 bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <Link to="/login/student">
                  <GraduationCap className="h-4 w-4 mr-1.5" />
                  Student Login
                </Link>
              </Button>
              <Button
                asChild
                data-testid={HOME.teacherLoginBtn}
                variant="outline"
                className="rounded-full h-12 px-6 bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <Link to="/login/teacher">
                  <Users className="h-4 w-4 mr-1.5" />
                  Teacher Login
                </Link>
              </Button>
              <Button
                asChild
                data-testid={HOME.managerLoginBtn}
                variant="outline"
                className="rounded-full h-12 px-6 bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <Link to="/login/manager">
                  <ShieldCheck className="h-4 w-4 mr-1.5" />
                  Manager Login
                </Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-4 hidden lg:flex items-center justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-8 rounded-full bg-[#F5D06B]/20 blur-2xl" />
              <div className="relative bg-white/95 rounded-3xl p-8 shadow-2xl">
                <StarLogo size={180} />
                <div className="mt-6 text-center">
                  <div className="text-2xl font-serif font-black text-[#0F1E4F]">KABUL STAR</div>
                  <div className="text-xs tracking-[0.2em] font-semibold text-[#B8860B] mt-1">
                    ENGLISH LANGUAGE ACADEMY
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ABOUT INTRO */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          <div className="lg:col-span-6">
            <div className="text-xs font-semibold tracking-widest uppercase text-[#B8860B] mb-3">
              About the Academy
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-black text-slate-900 leading-tight">
              A place where language becomes opportunity.
            </h2>
            <p className="mt-5 text-slate-600 text-base md:text-lg leading-relaxed">
              Kabul Star English Language Academy provides structured English education
              from foundational levels through professional English. Our teachers guide
              every student along a clear pathway — from the first alphabet to public
              speaking, academic writing, and career-ready communication.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { icon: BookOpen, k: "15", v: "Structured levels" },
                { icon: Users, k: "3", v: "Roles & portals" },
                { icon: Award, k: "1", v: "Clear pathway" },
              ].map((s) => (
                <Card key={s.v} className="p-5 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <s.icon className="h-5 w-5 text-[#B8860B]" />
                  <div className="mt-3 font-serif text-3xl font-black text-[#0F1E4F]">{s.k}</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">{s.v}</div>
                </Card>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1570616969692-54d6ba3d0397?auto=format&fit=crop&w=1200&q=80"
                alt="Students learning"
                className="w-full h-[420px] object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 md:left-6 md:right-6 bg-white/95 backdrop-blur rounded-2xl p-4 md:p-5 border border-white/60 shadow-lg">
                <div className="text-[10px] font-semibold tracking-widest uppercase text-[#B8860B]">Our motto</div>
                <div className="font-serif text-lg md:text-xl font-black text-[#0F1E4F] mt-0.5">
                  Come to Learn, Leave to Serve
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMS PATHWAY */}
      <section className="bg-white border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-24">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase text-[#B8860B]">Programs</div>
              <h2 className="mt-2 font-serif text-3xl md:text-4xl font-black text-slate-900">
                The Kabul Star pathway
              </h2>
              <p className="mt-3 text-slate-600 max-w-2xl">
                A guided journey from foundations to professional English. Every book builds on the last.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full border-[#0F1E4F]/20 text-[#0F1E4F]">
              <Link to="/programs">See full pathway <ArrowRight className="h-4 w-4 ml-1.5" /></Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-3">
            {PROGRAM_STEPS.map((step, i) => (
              <div
                key={step}
                className="group flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-[#0F1E4F] hover:text-white hover:border-[#0F1E4F] transition-colors px-4 py-2"
              >
                <span className="text-[10px] font-bold text-[#B8860B] group-hover:text-[#F5D06B]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-semibold">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ANNOUNCEMENTS */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-24">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase text-[#B8860B]">Latest</div>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl font-black text-slate-900">
              Announcements
            </h2>
          </div>
          <Button asChild variant="ghost" className="rounded-full text-[#0F1E4F]">
            <Link to="/announcements">View all <ArrowRight className="h-4 w-4 ml-1.5" /></Link>
          </Button>
        </div>

        {announcements.length === 0 ? (
          <Card className="p-10 rounded-2xl text-center border border-dashed border-slate-300 bg-white">
            <Calendar className="h-8 w-8 text-slate-400 mx-auto" />
            <div className="mt-3 text-slate-600">No announcements yet. Check back soon.</div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {announcements.slice(0, 3).map((a) => (
              <Card
                key={a.id}
                data-testid={`announcement-card-${a.id}`}
                className="p-6 rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-2 text-xs text-[#B8860B] font-semibold tracking-wider uppercase">
                  <Calendar className="h-3.5 w-3.5" />
                  {fmtDate(a.published_at)}
                </div>
                <h3 className="mt-3 font-serif text-xl font-black text-[#0F1E4F] leading-tight">
                  {a.title}
                </h3>
                <p className="mt-3 text-slate-600 text-sm leading-relaxed line-clamp-4">
                  {a.description}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 pb-16 md:pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-[#0F1E4F] p-10 md:p-14">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-[#F5D06B]/20 blur-3xl" />
          <div className="relative grid gap-6 md:grid-cols-2 items-center">
            <div>
              <h3 className="font-serif text-3xl md:text-4xl font-black text-white leading-tight">
                Ready to begin your journey?
              </h3>
              <p className="mt-3 text-white/80 max-w-lg">
                Log in to your portal — or reach out to the academy to register for the next intake.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Button asChild className="rounded-full h-11 px-6 bg-[#F5D06B] text-[#0B1638] hover:bg-[#FBBF24] font-semibold">
                <Link to="/contact">Contact the academy</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full h-11 px-6 bg-transparent border-white/40 text-white hover:bg-white/10">
                <Link to="/login/student">Student login</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
