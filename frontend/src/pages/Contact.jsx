import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { api } from "@/lib/api";

export default function Contact() {
  const [c, setC] = useState(null);
  useEffect(() => {
    api.get("/settings/contact").then((r) => setC(r.data)).catch(() => setC(null));
  }, []);

  const items = [
    { icon: MapPin, label: "Address", value: c?.address },
    { icon: Phone, label: "Phone", value: c?.phone },
    { icon: Mail, label: "Email", value: c?.email },
    { icon: Clock, label: "Working hours", value: c?.working_hours },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-24">
      <div className="text-xs font-semibold tracking-widest uppercase text-[#B8860B]">Contact</div>
      <h1 className="mt-3 font-serif text-4xl md:text-5xl font-black text-slate-900 leading-tight">
        Get in touch with the academy
      </h1>
      <p className="mt-4 text-slate-600 text-base md:text-lg max-w-2xl">
        Reach out for registration, placement testing, or any question about our programs.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {items.map((it) => (
          <Card key={it.label} className="p-7 rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-[#0F1E4F]/5 flex items-center justify-center">
                <it.icon className="h-5 w-5 text-[#0F1E4F]" />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-widest uppercase text-slate-400">{it.label}</div>
                <div className="mt-1 font-serif text-lg font-bold text-[#0F1E4F]">{it.value || "—"}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
