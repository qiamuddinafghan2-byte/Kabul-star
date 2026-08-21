import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const STEPS = [
  { name: "Pre-Beginner", desc: "Alphabet, sounds, and first words." },
  { name: "Beginner", desc: "Everyday phrases, greetings, and basic grammar." },
  { name: "Book 1", desc: "Simple sentences, present tense, common vocabulary." },
  { name: "Book 2", desc: "Past tense, questions, and short conversations." },
  { name: "Book 3", desc: "Reading short passages and building fluency." },
  { name: "Book 4", desc: "Writing paragraphs and expanding vocabulary." },
  { name: "Book 5", desc: "Intermediate grammar and structured speaking." },
  { name: "Book 6", desc: "Descriptive writing and listening practice." },
  { name: "Book 7", desc: "Discussion, debate, and complex sentence forms." },
  { name: "Book 8", desc: "Essay writing and formal reading." },
  { name: "Book 9", desc: "Advanced grammar and academic vocabulary." },
  { name: "Book 10", desc: "Public speaking and presentation skills." },
  { name: "Book 11", desc: "Academic reading and critical thinking." },
  { name: "Book 12", desc: "Advanced writing and exam preparation." },
  { name: "PELP", desc: "Professional English — communication for career, service, and leadership." },
];

export default function Programs() {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-16 md:py-24">
      <div className="text-xs font-semibold tracking-widest uppercase text-[#B8860B]">Programs</div>
      <h1 className="mt-3 font-serif text-4xl md:text-5xl font-black text-slate-900 leading-tight max-w-3xl">
        The full Kabul Star pathway
      </h1>
      <p className="mt-5 text-slate-600 text-base md:text-lg max-w-3xl">
        From your very first English word to professional-level communication — every step is designed to build on the last.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <Card
            key={s.name}
            className="p-6 rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-[#0F1E4F]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#F5D06B]/20 text-[#B8860B] flex items-center justify-center font-serif font-black">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <div className="text-xs font-semibold tracking-widest uppercase text-slate-400">Level</div>
                <div className="font-serif text-lg font-black text-[#0F1E4F]">{s.name}</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
            {i < STEPS.length - 1 && (
              <div className="mt-4 flex items-center text-[11px] font-semibold text-slate-400">
                Next: {STEPS[i + 1].name}
                <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
