import { useEffect, useState, useCallback } from "react";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Receipt, Printer, Trash2, DollarSign } from "lucide-react";

const CATEGORIES = ["registration", "monthly_tuition", "book", "exam", "certificate", "other"];
const STATUS_STYLES = {
  paid: "bg-emerald-100 text-emerald-800",
  partial: "bg-amber-100 text-amber-800",
  unpaid: "bg-slate-200 text-slate-700",
  overdue: "bg-red-100 text-red-800",
};

const AFN = (n) => `${Number(n || 0).toLocaleString()} AFN`;

/* ============ MANAGER: ATTENDANCE ============ */
export function ManagerAttendanceTab() {
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filter, setFilter] = useState({
    student_id: "", teacher_id: "", course_id: "",
    class_id: "", branch_id: "", date_from: "", date_to: "",
  });

  useEffect(() => {
    api.get("/users?role=student").then((r) => setStudents(r.data));
    api.get("/users?role=teacher").then((r) => setTeachers(r.data));
    api.get("/courses").then((r) => setCourses(r.data));
    api.get("/classes").then((r) => setClasses(r.data));
    api.get("/branches").then((r) => setBranches(r.data));
  }, []);

  const load = useCallback(() => {
    const params = Object.entries(filter).filter(([, v]) => !!v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    api.get(`/attendance${params ? `?${params}` : ""}`).then((r) => setRows(r.data));
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const totals = rows.reduce((a, x) => ({ ...a, [x.status]: (a[x.status] || 0) + 1 }), {});
  const total = rows.length;
  const pct = total ? Math.round(((totals.present || 0) / total) * 100) : 0;

  const setF = (k) => (v) => {
    const val = v?.target ? v.target.value : v;
    setFilter({ ...filter, [k]: val === "__any" ? "" : val });
  };
  const nm = (list, id) => list.find((x) => x.id === id)?.name || "—";

  return (
    <div className="space-y-4">
      <Card className="p-4 rounded-2xl border-slate-200">
        <div className="grid gap-3 md:grid-cols-4">
          <Select value={filter.student_id} onValueChange={setF("student_id")}>
            <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Any student" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__any">Any student</SelectItem>
              {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filter.teacher_id} onValueChange={setF("teacher_id")}>
            <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Any teacher" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__any">Any teacher</SelectItem>
              {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filter.course_id} onValueChange={setF("course_id")}>
            <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Any course" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__any">Any course</SelectItem>
              {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filter.class_id} onValueChange={setF("class_id")}>
            <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Any class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__any">Any class</SelectItem>
              {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filter.branch_id} onValueChange={setF("branch_id")}>
            <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Any branch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__any">Any branch</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={filter.date_from} onChange={setF("date_from")} className="h-10 rounded-xl" placeholder="From" />
          <Input type="date" value={filter.date_to} onChange={setF("date_to")} className="h-10 rounded-xl" placeholder="To" />
          <Button variant="outline" className="rounded-full" data-testid="att-clear-filter"
            onClick={() => setFilter({ student_id: "", teacher_id: "", course_id: "", class_id: "", branch_id: "", date_from: "", date_to: "" })}>
            Clear
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          ["Records", total], ["Present %", `${pct}%`],
          ["Present", totals.present || 0], ["Absent", totals.absent || 0],
          ["Late/Excused", (totals.late || 0) + (totals.excused || 0)],
        ].map(([k, v]) => (
          <Card key={k} className="p-4 rounded-2xl border-slate-200">
            <div className="text-xs uppercase tracking-widest text-slate-500">{k}</div>
            <div className="mt-1 font-serif text-2xl font-black text-[#0F1E4F]">{v}</div>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-slate-200 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">No attendance records for this filter.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 200).map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{nm(students, r.student_id)}</TableCell>
                  <TableCell>{nm(classes, r.class_id)}</TableCell>
                  <TableCell>
                    <Badge className={`rounded-full border-0 capitalize ${{
                      present: "bg-emerald-100 text-emerald-800",
                      absent: "bg-red-100 text-red-800",
                      late: "bg-amber-100 text-amber-800",
                      excused: "bg-slate-200 text-slate-700",
                    }[r.status] || "bg-slate-100"}`}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">{r.note || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

/* Select can't accept empty string values; wrap "__any" to reset the filter */
function useAnyValueFix(filter, setFilter) {
  useEffect(() => {
    ["student_id", "teacher_id", "course_id", "class_id", "branch_id"].forEach((k) => {
      if (filter[k] === "__any") setFilter({ ...filter, [k]: "" });
    });
  }, [filter, setFilter]);
}

/* ============ FEES ============ */
export function FeesTab() {
  const [list, setList] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(false);
  const [payFor, setPayFor] = useState(null);
  const [receiptOf, setReceiptOf] = useState(null);
  const [form, setForm] = useState({
    student_id: "", course_id: "", class_id: "",
    category: "monthly_tuition", amount: 0, currency: "AFN",
    discount: 0, scholarship_amount: 0, due_date: "", period: "", notes: "",
  });
  const [payForm, setPayForm] = useState({ amount: 0, payment_method: "cash", receipt_number: "", notes: "" });
  const [filter, setFilter] = useState({ student_id: "", category: "", status: "" });

  const load = useCallback(() => {
    const params = Object.entries(filter).filter(([, v]) => !!v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    api.get(`/fees${params ? `?${params}` : ""}`).then((r) => setList(r.data));
  }, [filter]);

  useEffect(() => {
    load();
    api.get("/users?role=student").then((r) => setStudents(r.data));
    api.get("/courses").then((r) => setCourses(r.data));
    api.get("/classes").then((r) => setClasses(r.data));
  }, [load]);

  async function save() {
    if (!form.student_id || !form.category || !form.amount) { toast.error("Student, category & amount required"); return; }
    try {
      const payload = {
        ...form, amount: Number(form.amount), discount: Number(form.discount) || 0,
        scholarship_amount: Number(form.scholarship_amount) || 0,
      };
      await api.post("/fees", payload);
      toast.success("Fee added");
      setOpen(false);
      setForm({ student_id: "", course_id: "", class_id: "", category: "monthly_tuition", amount: 0, currency: "AFN", discount: 0, scholarship_amount: 0, due_date: "", period: "", notes: "" });
      load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }

  async function pay() {
    if (!payFor || !payForm.amount) { toast.error("Amount required"); return; }
    try {
      const { data } = await api.post(`/fees/${payFor.id}/payments`, {
        ...payForm, amount: Number(payForm.amount),
      });
      toast.success(`Recorded ${AFN(payForm.amount)}. Receipt ${data.payment.receipt_number}`);
      setPayFor(null); setPayForm({ amount: 0, payment_method: "cash", receipt_number: "", notes: "" });
      load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }

  async function remove(fee) {
    if (!window.confirm("Delete fee record?")) return;
    try { await api.delete(`/fees/${fee.id}`); load(); } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }

  const nm = (list, id) => list.find((x) => x.id === id)?.name || "—";
  const totalOutstanding = list.reduce((a, f) => a + (f.balance || 0), 0);
  const totalCollected = list.reduce((a, f) => a + (f.paid_amount || 0), 0);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Card className="p-4 rounded-2xl border-slate-200 bg-emerald-50">
          <div className="text-xs uppercase tracking-widest text-emerald-800">Collected</div>
          <div className="mt-1 font-serif text-2xl font-black text-emerald-900">{AFN(totalCollected)}</div>
        </Card>
        <Card className="p-4 rounded-2xl border-slate-200 bg-amber-50">
          <div className="text-xs uppercase tracking-widest text-amber-800">Outstanding</div>
          <div className="mt-1 font-serif text-2xl font-black text-amber-900">{AFN(totalOutstanding)}</div>
        </Card>
        <Card className="p-4 rounded-2xl border-slate-200">
          <div className="text-xs uppercase tracking-widest text-slate-500">Records</div>
          <div className="mt-1 font-serif text-2xl font-black text-[#0F1E4F]">{list.length}</div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 justify-between">
        <div className="flex flex-wrap gap-2">
          <Select value={filter.student_id} onValueChange={(v) => setFilter({ ...filter, student_id: v === "__any" ? "" : v })}>
            <SelectTrigger className="h-10 rounded-xl w-52"><SelectValue placeholder="Any student" /></SelectTrigger>
            <SelectContent><SelectItem value="__any">Any student</SelectItem>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filter.category} onValueChange={(v) => setFilter({ ...filter, category: v === "__any" ? "" : v })}>
            <SelectTrigger className="h-10 rounded-xl w-44"><SelectValue placeholder="Any category" /></SelectTrigger>
            <SelectContent><SelectItem value="__any">Any category</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filter.status} onValueChange={(v) => setFilter({ ...filter, status: v === "__any" ? "" : v })}>
            <SelectTrigger className="h-10 rounded-xl w-36"><SelectValue placeholder="Any status" /></SelectTrigger>
            <SelectContent><SelectItem value="__any">Any status</SelectItem>{["paid", "partial", "unpaid", "overdue"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button data-testid="fee-add" className="rounded-full bg-[#0F1E4F] text-white" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> New fee
        </Button>
      </div>

      <Card className="rounded-2xl border-slate-200 overflow-hidden">
        {list.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">No fee records.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-semibold text-[#0F1E4F]">{nm(students, f.student_id)}</TableCell>
                  <TableCell className="capitalize">{f.category.replace("_", " ")}</TableCell>
                  <TableCell>{f.period || "—"}</TableCell>
                  <TableCell>{AFN(f.net_amount)}</TableCell>
                  <TableCell>{AFN(f.paid_amount || 0)}</TableCell>
                  <TableCell className="font-semibold">{AFN(f.balance)}</TableCell>
                  <TableCell className="text-xs">{f.due_date || "—"}</TableCell>
                  <TableCell><Badge className={`rounded-full border-0 capitalize ${STATUS_STYLES[f.status]}`}>{f.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    {f.balance > 0 && (
                      <Button size="sm" data-testid={`fee-pay-${f.id}`} className="rounded-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => { setPayFor(f); setPayForm({ amount: f.balance, payment_method: "cash", receipt_number: "", notes: "" }); }}>
                        <DollarSign className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="rounded-full h-8" onClick={() => setReceiptOf(f)}>
                      <Receipt className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full h-8 border-red-200 text-red-700" onClick={() => remove(f)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* New fee dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>New fee</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label className="text-xs uppercase tracking-wider text-slate-500">Student</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                <SelectTrigger data-testid="fee-student" className="h-11 rounded-xl mt-1"><SelectValue placeholder="Student" /></SelectTrigger>
                <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger data-testid="fee-category" className="h-11 rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Amount (AFN)</Label>
              <Input data-testid="fee-amount" type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="h-11 rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Discount</Label>
              <Input type="number" min="0" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="h-11 rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Scholarship</Label>
              <Input type="number" min="0" value={form.scholarship_amount} onChange={(e) => setForm({ ...form, scholarship_amount: e.target.value })} className="h-11 rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Due date</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="h-11 rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Period (e.g. 2026-08)</Label>
              <Input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className="h-11 rounded-xl mt-1" placeholder="2026-08" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Course</Label>
              <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                <SelectTrigger className="h-11 rounded-xl mt-1"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs uppercase tracking-wider text-slate-500">Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-testid="fee-save" onClick={save} className="rounded-full bg-[#0F1E4F] text-white">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment dialog */}
      <Dialog open={!!payFor} onOpenChange={(o) => !o && setPayFor(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
          <div className="text-sm text-slate-500 mb-2">
            {nm(students, payFor?.student_id)} — {payFor?.category?.replace("_", " ")} — Balance: <span className="font-semibold text-[#0F1E4F]">{AFN(payFor?.balance)}</span>
          </div>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Amount</Label>
              <Input data-testid="pay-amount" type="number" min="0" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} className="h-11 rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Method</Label>
              <Select value={payForm.payment_method} onValueChange={(v) => setPayForm({ ...payForm, payment_method: v })}>
                <SelectTrigger className="h-11 rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["cash", "bank_transfer", "card", "mobile"].map((m) => <SelectItem key={m} value={m}>{m.replace("_", " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Receipt # (optional, auto if blank)</Label>
              <Input value={payForm.receipt_number} onChange={(e) => setPayForm({ ...payForm, receipt_number: e.target.value })} className="h-11 rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Notes</Label>
              <Textarea rows={2} value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} className="rounded-xl mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setPayFor(null)}>Cancel</Button>
            <Button data-testid="pay-save" onClick={pay} className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white">Record payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt / history dialog */}
      <Dialog open={!!receiptOf} onOpenChange={(o) => !o && setReceiptOf(null)}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle>Payment history</DialogTitle></DialogHeader>
          {receiptOf && (
            <div id="print-receipt" className="space-y-4">
              <div className="text-center border-b pb-3">
                <div className="font-serif text-lg font-black text-[#0F1E4F]">Kabul Star English Language Academy</div>
                <div className="text-xs text-slate-500 mt-1">Come to Learn, Leave to Serve</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">Student:</span> {nm(students, receiptOf.student_id)}</div>
                <div><span className="text-slate-500">Category:</span> {receiptOf.category.replace("_", " ")}</div>
                <div><span className="text-slate-500">Amount:</span> {AFN(receiptOf.net_amount)}</div>
                <div><span className="text-slate-500">Paid:</span> {AFN(receiptOf.paid_amount || 0)}</div>
                <div><span className="text-slate-500">Balance:</span> <strong>{AFN(receiptOf.balance)}</strong></div>
                <div><span className="text-slate-500">Status:</span> {receiptOf.status}</div>
              </div>
              <div>
                <div className="font-semibold text-[#0F1E4F] mb-1">Payments</div>
                {(receiptOf.payments || []).length === 0 && <div className="text-xs text-slate-500">No payments yet.</div>}
                <ul className="space-y-1 text-xs">
                  {(receiptOf.payments || []).map((p) => (
                    <li key={p.id} className="flex justify-between border-b border-slate-100 py-1">
                      <span>#{p.receipt_number} · {p.payment_method}</span>
                      <span>{AFN(p.amount)} · {p.paid_date?.slice(0, 10)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="rounded-full" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ============ CERTIFICATES ============ */
export function CertificatesTab() {
  const [list, setList] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [open, setOpen] = useState(false);
  const [previewOf, setPreviewOf] = useState(null);
  const [form, setForm] = useState({ student_id: "", course_id: "", completion_date: "", certificate_number: "", notes: "" });

  const load = () => api.get("/certificates").then((r) => setList(r.data));
  useEffect(() => {
    load();
    api.get("/users?role=student").then((r) => setStudents(r.data));
    api.get("/courses").then((r) => setCourses(r.data));
  }, []);

  async function save() {
    if (!form.student_id || !form.course_id || !form.completion_date || !form.certificate_number) {
      toast.error("All fields required"); return;
    }
    try {
      await api.post("/certificates", form);
      toast.success("Certificate issued");
      setOpen(false);
      setForm({ student_id: "", course_id: "", completion_date: "", certificate_number: "", notes: "" });
      load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }
  async function remove(c) {
    if (!window.confirm("Delete certificate?")) return;
    try { await api.delete(`/certificates/${c.id}`); load(); } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }

  const nm = (list, id) => list.find((x) => x.id === id)?.name || "—";

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button data-testid="cert-add" className="rounded-full bg-[#0F1E4F] text-white"
          onClick={() => { setForm({ student_id: "", course_id: "", completion_date: new Date().toISOString().slice(0, 10), certificate_number: `KS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`, notes: "" }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Issue certificate
        </Button>
      </div>

      <Card className="rounded-2xl border-slate-200 overflow-hidden">
        {list.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">No certificates issued yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certificate #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold text-[#0F1E4F]">{c.certificate_number}</TableCell>
                  <TableCell>{nm(students, c.student_id)}</TableCell>
                  <TableCell>{nm(courses, c.course_id)}</TableCell>
                  <TableCell>{c.completion_date}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="outline" className="rounded-full h-8" onClick={() => setPreviewOf(c)}>
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full h-8 border-red-200 text-red-700" onClick={() => remove(c)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Issue certificate</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Student</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                <SelectTrigger data-testid="cert-student" className="h-11 rounded-xl mt-1"><SelectValue placeholder="Student" /></SelectTrigger>
                <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Course completed</Label>
              <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                <SelectTrigger data-testid="cert-course" className="h-11 rounded-xl mt-1"><SelectValue placeholder="Course" /></SelectTrigger>
                <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Completion date</Label>
                <Input data-testid="cert-date" type="date" value={form.completion_date} onChange={(e) => setForm({ ...form, completion_date: e.target.value })} className="h-11 rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Certificate #</Label>
                <Input data-testid="cert-number" value={form.certificate_number} onChange={(e) => setForm({ ...form, certificate_number: e.target.value })} className="h-11 rounded-xl mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-testid="cert-save" onClick={save} className="rounded-full bg-[#0F1E4F] text-white">Issue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview / print dialog */}
      <Dialog open={!!previewOf} onOpenChange={(o) => !o && setPreviewOf(null)}>
        <DialogContent className="rounded-2xl max-w-2xl p-0 overflow-hidden">
          <div id="print-certificate" className="bg-white p-10 border-8 border-[#0F1E4F]/10">
            <div className="border-4 border-double border-[#B8860B] rounded-lg p-10 text-center bg-gradient-to-br from-white to-[#FEF7E0]">
              <div className="text-xs tracking-[0.4em] uppercase text-[#B8860B] font-bold">Kabul Star English Language Academy</div>
              <div className="mt-2 text-slate-500 italic text-xs">Together for a Brighter Future</div>
              <div className="mt-8 text-3xl font-serif font-black text-[#0F1E4F]">Certificate of Completion</div>
              <div className="mt-6 text-slate-500 text-sm">This certifies that</div>
              <div className="mt-2 text-3xl font-serif font-black text-[#0F1E4F]">{nm(students, previewOf?.student_id)}</div>
              <div className="mt-4 text-slate-500 text-sm">has successfully completed</div>
              <div className="mt-2 text-xl font-serif font-black text-[#B8860B]">{nm(courses, previewOf?.course_id)}</div>
              <div className="mt-6 text-sm text-slate-600">on {previewOf?.completion_date}</div>
              <div className="mt-10 flex items-end justify-between text-xs text-slate-500">
                <div className="text-left">
                  <div className="border-t border-slate-400 pt-1 w-40">Manager</div>
                </div>
                <div>Certificate # {previewOf?.certificate_number}</div>
              </div>
              {previewOf?.notes && <div className="mt-6 text-xs text-slate-500 italic">{previewOf.notes}</div>}
            </div>
          </div>
          <DialogFooter className="p-4">
            <Button variant="outline" className="rounded-full" onClick={() => setPreviewOf(null)}>Close</Button>
            <Button className="rounded-full bg-[#0F1E4F] text-white" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
