import { Card } from "@/components/ui/card";
import { Target, Eye, Heart, Compass } from "lucide-react";

const VALUES = [
  { icon: Target, title: "Mission", body: "To provide structured, high-quality English language education that opens doors to opportunity, service, and leadership." },
  { icon: Eye, title: "Vision", body: "A generation of confident, capable communicators who use their English to serve their communities and shape a brighter future." },
  { icon: Heart, title: "Values", body: "Discipline, respect, curiosity, and service. Every classroom is a place of dignity and purpose." },
  { icon: Compass, title: "Teaching philosophy", body: "Clear pathways. Patient teachers. Real practice. We meet learners where they are and walk with them level by level." },
];

export default function About() {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-24">
      <div className="max-w-3xl">
        <div className="text-xs font-semibold tracking-widest uppercase text-[#B8860B]">About the academy</div>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl font-black text-slate-900 leading-tight">
          Together for a Brighter Future.
        </h1>
        <p className="mt-5 text-slate-600 text-base md:text-lg leading-relaxed">
          Kabul Star English Language Academy is more than a language school — it is a home for
          learners who want to grow, serve, and lead. Our motto,{" "}
          <span className="italic font-semibold text-[#0F1E4F]">Come to Learn, Leave to Serve</span>,
          shapes every lesson we teach and every relationship we build.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {VALUES.map((v) => (
          <Card key={v.title} className="p-8 rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="h-11 w-11 rounded-xl bg-[#0F1E4F]/5 flex items-center justify-center">
              <v.icon className="h-5 w-5 text-[#0F1E4F]" />
            </div>
            <h3 className="mt-5 font-serif text-2xl font-black text-[#0F1E4F]">{v.title}</h3>
            <p className="mt-3 text-slate-600 leading-relaxed">{v.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
