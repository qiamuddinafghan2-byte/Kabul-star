import { Link } from "react-router-dom";
import { BrandMark } from "@/components/brand/Logo";
import { Phone, Mail, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function Footer() {
  const [c, setC] = useState(null);
  useEffect(() => {
    api.get("/settings/contact").then((r) => setC(r.data)).catch(() => setC(null));
  }, []);

  return (
    <footer className="mt-24 border-t border-slate-200 bg-[#0B1638] text-slate-200">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="bg-white/95 rounded-2xl p-4 inline-block">
            <BrandMark />
          </div>
          <p className="mt-5 text-slate-300 text-sm md:text-base leading-relaxed max-w-md">
            Together for a Brighter Future. Come to Learn, Leave to Serve.
            Structured English language education from Pre-Beginner through PELP.
          </p>
        </div>

        <div>
          <div className="text-xs font-semibold tracking-widest uppercase text-[#F5D06B] mb-4">
            Explore
          </div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li><Link to="/about" className="hover:text-white">About Academy</Link></li>
            <li><Link to="/programs" className="hover:text-white">Programs</Link></li>
            <li><Link to="/announcements" className="hover:text-white">Announcements</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-semibold tracking-widest uppercase text-[#F5D06B] mb-4">
            Reach us
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-[#F5D06B]" />
              <span>{c?.address || "Kabul, Afghanistan"}</span>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="h-4 w-4 mt-0.5 text-[#F5D06B]" />
              <span>{c?.phone || "+93 700 000 000"}</span>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="h-4 w-4 mt-0.5 text-[#F5D06B]" />
              <span>{c?.email || "info@kabulstar.edu"}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-5 text-xs text-slate-400 flex flex-col md:flex-row items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} Kabul Star English Language Academy. All rights reserved.</div>
          <div className="italic text-[#F5D06B]">Come to Learn, Leave to Serve</div>
        </div>
      </div>
    </footer>
  );
}
