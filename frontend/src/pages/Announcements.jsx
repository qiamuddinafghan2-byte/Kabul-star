import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, Megaphone } from "lucide-react";
import { api } from "@/lib/api";

function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export default function Announcements() {
  const [list, setList] = useState(null);
  useEffect(() => {
    api.get("/announcements/public").then((r) => setList(r.data)).catch(() => setList([]));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-24">
      <div className="text-xs font-semibold tracking-widest uppercase text-[#B8860B]">News</div>
      <h1 className="mt-3 font-serif text-4xl md:text-5xl font-black text-slate-900 leading-tight">
        Academy Announcements
      </h1>
      <p className="mt-4 text-slate-600 text-base md:text-lg max-w-2xl">
        Batch openings, exam schedules, holidays, and important updates from the management.
      </p>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {list === null && (
          <Card className="p-8 rounded-2xl border border-slate-200 bg-white animate-pulse h-40" />
        )}
        {list && list.length === 0 && (
          <Card className="p-10 rounded-2xl text-center border border-dashed border-slate-300 bg-white col-span-full">
            <Megaphone className="h-8 w-8 text-slate-400 mx-auto" />
            <div className="mt-3 text-slate-600">No announcements published yet.</div>
          </Card>
        )}
        {list && list.map((a) => (
          <Card
            key={a.id}
            data-testid={`announcement-item-${a.id}`}
            className="p-8 rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            {a.image_url && (
              <img src={a.image_url} alt={a.title} className="w-full h-48 object-cover rounded-xl mb-5" />
            )}
            <div className="flex items-center gap-2 text-xs text-[#B8860B] font-semibold tracking-wider uppercase">
              <Calendar className="h-3.5 w-3.5" />
              {fmtDate(a.published_at)}
            </div>
            <h3 className="mt-3 font-serif text-2xl font-black text-[#0F1E4F] leading-tight">
              {a.title}
            </h3>
            <p className="mt-4 text-slate-600 leading-relaxed whitespace-pre-line">{a.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
