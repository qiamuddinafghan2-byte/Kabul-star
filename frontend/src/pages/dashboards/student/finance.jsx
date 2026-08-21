import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, DollarSign, Printer } from "lucide-react";

const AFN = (n) => `${Number(n || 0).toLocaleString()} AFN`;

const S_STYLES = {
  paid: "bg-emerald-100 text-emerald-800",
  partial: "bg-amber-100 text-amber-800",
  unpaid: "bg-slate-200 text-slate-700",
  overdue: "bg-red-100 text-red-800",
};

export function StudentFeesTab() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get("/fees").then((r) => setList(r.data)); }, []);

  const outstanding = list.reduce((a, f) => a + (f.balance || 0), 0);
  const paid = list.reduce((a, f) => a + (f.paid_amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5 rounded-2xl border-slate-200 bg-emerald-50">
          <div className="text-xs uppercase tracking-widest text-emerald-800">Paid</div>
          <div className="mt-1 font-serif text-2xl font-black text-emerald-900">{AFN(paid)}</div>
        </Card>
        <Card className="p-5 rounded-2xl border-slate-200 bg-amber-50">
          <div className="text-xs uppercase tracking-widest text-amber-800">Outstanding</div>
          <div className="mt-1 font-serif text-2xl font-black text-amber-900">{AFN(outstanding)}</div>
        </Card>
        <Card className="p-5 rounded-2xl border-slate-200">
          <div className="text-xs uppercase tracking-widest text-slate-500">Records</div>
          <div className="mt-1 font-serif text-2xl font-black text-[#0F1E4F]">{list.length}</div>
        </Card>
      </div>

      {list.length === 0 ? (
        <Card className="p-10 rounded-2xl text-center text-slate-500 text-sm border-dashed border-slate-300">
          <DollarSign className="h-6 w-6 mx-auto text-slate-400" />
          <div className="mt-2">No fee records yet.</div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((f) => (
            <Card key={f.id} className="p-5 rounded-2xl border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#B8860B]">{f.category.replace("_", " ")}</div>
                  <div className="mt-1 font-serif font-black text-[#0F1E4F]">{f.period || "One-time"}</div>
                  {f.due_date && <div className="mt-1 text-xs text-slate-500">Due {f.due_date}</div>}
                </div>
                <Badge className={`rounded-full border-0 capitalize ${S_STYLES[f.status]}`}>{f.status}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div><div className="text-xs text-slate-500">Amount</div>{AFN(f.net_amount)}</div>
                <div><div className="text-xs text-slate-500">Paid</div>{AFN(f.paid_amount || 0)}</div>
                <div><div className="text-xs text-slate-500">Balance</div><strong>{AFN(f.balance)}</strong></div>
              </div>
              {f.payments && f.payments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                  {f.payments.slice(-3).map((p) => (
                    <div key={p.id} className="flex justify-between">
                      <span>#{p.receipt_number}</span>
                      <span>{AFN(p.amount)} · {p.paid_date?.slice(0, 10)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function StudentCertificatesTab() {
  const [list, setList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [previewOf, setPreviewOf] = useState(null);

  useEffect(() => {
    api.get("/certificates").then((r) => setList(r.data));
    api.get("/courses/public").then((r) => setCourses(r.data));
  }, []);
  const cName = (id) => courses.find((c) => c.id === id)?.name || "—";

  if (list.length === 0) {
    return (
      <Card className="p-10 rounded-2xl text-center text-slate-500 text-sm border-dashed border-slate-300">
        <Award className="h-8 w-8 mx-auto text-slate-400" />
        <div className="mt-2">No certificates issued yet. Complete a course to earn one!</div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {list.map((c) => (
        <Card key={c.id} className="p-6 rounded-2xl border-slate-200 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="h-11 w-11 rounded-xl bg-[#F5D06B]/20 flex items-center justify-center">
              <Award className="h-5 w-5 text-[#B8860B]" />
            </div>
            <Button size="sm" variant="outline" className="rounded-full h-8" onClick={() => setPreviewOf(c)}>
              <Printer className="h-3.5 w-3.5 mr-1" /> View
            </Button>
          </div>
          <div className="mt-4 text-xs uppercase tracking-widest text-[#B8860B]">Certificate</div>
          <div className="mt-1 font-serif text-lg font-black text-[#0F1E4F]">{cName(c.course_id)}</div>
          <div className="mt-3 text-xs text-slate-500 space-y-1">
            <div>Completed {c.completion_date}</div>
            <div>#{c.certificate_number}</div>
          </div>
        </Card>
      ))}

      {previewOf && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreviewOf(null)}>
          <div className="bg-white p-10 border-8 border-[#0F1E4F]/10 max-w-2xl w-full rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-4 border-double border-[#B8860B] rounded-lg p-8 text-center bg-gradient-to-br from-white to-[#FEF7E0]">
              <div className="text-xs tracking-[0.4em] uppercase text-[#B8860B] font-bold">Kabul Star English Language Academy</div>
              <div className="mt-1 text-slate-500 italic text-xs">Together for a Brighter Future</div>
              <div className="mt-6 text-2xl font-serif font-black text-[#0F1E4F]">Certificate of Completion</div>
              <div className="mt-4 text-slate-500 text-sm">has successfully completed</div>
              <div className="mt-1 text-xl font-serif font-black text-[#B8860B]">{cName(previewOf.course_id)}</div>
              <div className="mt-4 text-xs text-slate-500">on {previewOf.completion_date} · #{previewOf.certificate_number}</div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" className="rounded-full" onClick={() => setPreviewOf(null)}>Close</Button>
              <Button className="rounded-full bg-[#0F1E4F] text-white" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
