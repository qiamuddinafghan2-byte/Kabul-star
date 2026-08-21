import { useEffect, useState, useCallback } from "react";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const STATUS_STYLES = {
  present: "bg-emerald-100 text-emerald-800",
  absent: "bg-red-100 text-red-800",
  late: "bg-amber-100 text-amber-800",
  excused: "bg-slate-200 text-slate-700",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  sent: "bg-blue-100 text-blue-800",
  open: "bg-blue-100 text-blue-800",
};

function StatusPill({ v }) {
  return <Badge className={`rounded-full border-0 capitalize ${STATUS_STYLES[v] || "bg-slate-100 text-slate-700"}`}>{v}</Badge>;
}

/* ------------------ My Classes ------------------ */
export function MyClassesTab() {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  useEffect(() => {
    api.get("/classes").then((r) => setClasses(r.data));
    api.get("/courses").then((r) => setCourses(r.data));
  }, []);
  const cName = (id) => courses.find((c) => c.id === id)?.name || "—";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {classes.length === 0 && (
        <Card className="p-8 rounded-2xl text-center col-span-full border-dashed border-slate-300 text-slate-500">
          No classes assigned yet. The manager will assign your classes.
        </Card>
      )}
      {classes.map((c) => (
        <Card key={c.id} className="p-6 rounded-2xl border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="text-xs uppercase tracking-widest text-[#B8860B]">{cName(c.course_id)}</div>
          <div className="mt-1 font-serif text-lg font-black text-[#0F1E4F]">{c.name}</div>
          <div className="mt-3 text-sm text-slate-600 space-y-1">
            <div>Schedule: <span className="font-medium">{c.schedule || "—"}</span></div>
            <div>Room: <span className="font-medium">{c.room || (c.online ? "Online" : "—")}</span></div>
            <div>Students: <span className="font-medium">{c.student_ids?.length || 0}</span></div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ------------------ Attendance (teacher) ------------------ */
export function TeacherAttendanceTab() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState({}); // student_id -> status

  useEffect(() => {
    api.get("/classes").then(async (r) => {
      setClasses(r.data);
      if (r.data.length > 0 && !classId) setClassId(r.data[0].id);
    }).catch(() => {});
    api.get("/users?role=student").then((r) => setStudents(r.data)).catch(() => setStudents([]));
  }, []); // eslint-disable-line

  const cls = classes.find((c) => c.id === classId);
  const roster = students.filter((s) => cls?.student_ids?.includes(s.id));

  async function save() {
    if (!classId) return;
    const list = roster.map((s) => ({ student_id: s.id, status: entries[s.id] || "present" }));
    try {
      await api.post("/attendance", { class_id: classId, date, entries: list });
      toast.success("Attendance saved");
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger data-testid="att-class" className="h-10 rounded-xl w-64"><SelectValue placeholder="Class" /></SelectTrigger>
          <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Input data-testid="att-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-xl w-44" />
      </div>

      <Card className="rounded-2xl border-slate-200 overflow-hidden">
        {!cls || roster.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">Select a class with students to mark attendance.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-semibold text-[#0F1E4F]">{s.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-1.5 flex-wrap">
                      {["present", "absent", "late", "excused"].map((v) => (
                        <button
                          key={v}
                          data-testid={`att-${s.id}-${v}`}
                          onClick={() => setEntries({ ...entries, [s.id]: v })}
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            (entries[s.id] || "present") === v ? "bg-[#0F1E4F] text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >{v}</button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <div className="flex justify-end">
        <Button data-testid="att-save" onClick={save} className="rounded-full bg-[#0F1E4F] text-white">Save attendance</Button>
      </div>
    </div>
  );
}

/* ------------------ Lesson (teacher) ------------------ */
export function TeacherLessonTab() {
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ class_id: "", title: "", description: "", topics: "", notes: "" });
  const [lessons, setLessons] = useState([]);

  const load = () => api.get("/lessons").then((r) => setLessons(r.data));
  useEffect(() => { api.get("/classes").then((r) => setClasses(r.data)); load(); }, []);

  async function save() {
    if (!form.class_id || !form.title) { toast.error("Class & title required"); return; }
    try {
      await api.post("/lessons", form);
      setForm({ class_id: form.class_id, title: "", description: "", topics: "", notes: "" });
      toast.success("Lesson recorded"); load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6 rounded-2xl border-slate-200">
        <div className="font-serif font-black text-[#0F1E4F] text-lg">Add today's lesson</div>
        <div className="mt-4 space-y-3">
          <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
            <SelectTrigger data-testid="lesson-class" className="h-11 rounded-xl"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Lesson title" data-testid="lesson-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-11 rounded-xl" />
          <Textarea placeholder="Topics covered" rows={2} value={form.topics} onChange={(e) => setForm({ ...form, topics: e.target.value })} className="rounded-xl" />
          <Textarea placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" />
          <Textarea placeholder="Notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl" />
          <Button data-testid="lesson-save" onClick={save} className="rounded-full bg-[#0F1E4F] text-white">Save lesson</Button>
        </div>
      </Card>

      <div className="space-y-3">
        {lessons.length === 0 && <Card className="p-6 rounded-2xl text-slate-500 text-sm border-dashed border-slate-300">No lessons yet.</Card>}
        {lessons.slice(0, 5).map((l) => (
          <Card key={l.id} className="p-5 rounded-2xl border-slate-200">
            <div className="text-xs text-[#B8860B] font-semibold uppercase tracking-wider">{l.date}</div>
            <div className="mt-1 font-serif font-black text-[#0F1E4F]">{l.title}</div>
            <div className="mt-1 text-sm text-slate-600">{l.description}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ------------------ Homework (teacher) ------------------ */
export function TeacherHomeworkTab() {
  const [list, setList] = useState([]);
  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ class_id: "", title: "", description: "", due_date: "" });

  const load = () => api.get("/homework").then((r) => setList(r.data));
  useEffect(() => { load(); api.get("/classes").then((r) => setClasses(r.data)); }, []);

  async function save() {
    try { await api.post("/homework", { ...form, due_date: form.due_date || null }); setOpen(false); load(); toast.success("Homework added"); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button data-testid="hw-add" className="rounded-full bg-[#0F1E4F] text-white" onClick={() => { setForm({ class_id: classes[0]?.id || "", title: "", description: "", due_date: "" }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Assign homework
        </Button>
      </div>

      <Card className="rounded-2xl border-slate-200 overflow-hidden">
        {list.length === 0 ? <div className="p-10 text-center text-slate-500 text-sm">No homework yet.</div> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-semibold text-[#0F1E4F]">{h.title}</TableCell>
                  <TableCell>{classes.find(c => c.id === h.class_id)?.name || "—"}</TableCell>
                  <TableCell>{(h.assigned_date || "").slice(0, 10)}</TableCell>
                  <TableCell>{h.due_date || "—"}</TableCell>
                  <TableCell><StatusPill v={h.status || "open"} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>New homework</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Title" data-testid="hw-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-11 rounded-xl" />
            <Textarea rows={4} placeholder="Description / instructions" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" />
            <Input type="date" data-testid="hw-due" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="h-11 rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-testid="hw-save" onClick={save} className="rounded-full bg-[#0F1E4F] text-white">Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------ Exams (teacher) ------------------ */
export function TeacherExamsTab() {
  const [list, setList] = useState([]);
  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ class_id: "", title: "", date: "", time: "", location: "", instructions: "" });

  const load = () => api.get("/exams").then((r) => setList(r.data));
  useEffect(() => { load(); api.get("/classes").then((r) => setClasses(r.data)); }, []);

  async function save() {
    if (!form.class_id || !form.title || !form.date) { toast.error("Class, title, date required"); return; }
    try { await api.post("/exams", form); setOpen(false); load(); toast.success("Exam scheduled"); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button data-testid="exam-add" className="rounded-full bg-[#0F1E4F] text-white" onClick={() => { setForm({ class_id: classes[0]?.id || "", title: "", date: "", time: "", location: "", instructions: "" }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Schedule exam
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {list.length === 0 && <Card className="p-8 rounded-2xl border-dashed border-slate-300 text-slate-500 text-sm text-center col-span-full">No exams scheduled.</Card>}
        {list.map((e) => (
          <Card key={e.id} className="p-6 rounded-2xl border-slate-200">
            <div className="text-xs uppercase tracking-widest text-[#B8860B]">{classes.find(c => c.id === e.class_id)?.name || "—"}</div>
            <div className="mt-1 font-serif font-black text-lg text-[#0F1E4F]">{e.title}</div>
            <div className="mt-3 text-sm text-slate-600 space-y-1">
              <div>Date: {e.date} {e.time && `at ${e.time}`}</div>
              <div>Location: {e.location || "—"}</div>
              {e.instructions && <div className="mt-2 text-slate-500">{e.instructions}</div>}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Schedule exam</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Title" data-testid="exam-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-11 rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" data-testid="exam-date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-11 rounded-xl" />
              <Input placeholder="Time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="h-11 rounded-xl" />
            </div>
            <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="h-11 rounded-xl" />
            <Textarea rows={3} placeholder="Instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-testid="exam-save" onClick={save} className="rounded-full bg-[#0F1E4F] text-white">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------ Messages (teacher composes, manager approves) ------------------ */
export function TeacherMessagesTab() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ class_id: "", recipient_ids: [], subject: "", body: "" });

  const load = () => api.get("/messages?box=sent").then((r) => setList(r.data));
  useEffect(() => {
    api.get("/classes").then((r) => setClasses(r.data));
    load();
  }, []);

  useEffect(() => {
    if (!form.class_id) { setStudents([]); return; }
    const cls = classes.find((c) => c.id === form.class_id);
    if (!cls) return;
    api.get("/users?role=student")
      .then((r) => setStudents(r.data.filter((s) => cls.student_ids?.includes(s.id))))
      .catch(() => setStudents([]));
  }, [form.class_id, classes]);

  async function send() {
    if (!form.subject || !form.body) { toast.error("Subject & body required"); return; }
    try {
      await api.post("/messages", form);
      toast.success("Message sent for manager approval");
      setOpen(false);
      setForm({ class_id: "", recipient_ids: [], subject: "", body: "" });
      load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button data-testid="msg-compose" className="rounded-full bg-[#0F1E4F] text-white" onClick={() => setOpen(true)}>
          <Send className="h-4 w-4 mr-1" /> Compose message
        </Button>
      </div>

      <div className="space-y-3">
        {list.length === 0 && <Card className="p-8 rounded-2xl border-dashed border-slate-300 text-slate-500 text-sm text-center">You haven't sent any messages yet.</Card>}
        {list.map((m) => (
          <Card key={m.id} className="p-5 rounded-2xl border-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-[#B8860B]">{new Date(m.created_at).toLocaleString()}</div>
                <div className="mt-1 font-serif font-black text-[#0F1E4F]">{m.subject}</div>
                <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{m.body}</p>
              </div>
              <StatusPill v={m.status} />
            </div>
            <div className="mt-2 text-xs text-slate-400">To {m.recipient_ids?.length || 0} student(s)</div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle>Compose message</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v, recipient_ids: [] })}>
              <SelectTrigger data-testid="msg-class" className="h-11 rounded-xl"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Recipients</Label>
              <div className="mt-1 max-h-36 overflow-auto border border-slate-200 rounded-xl p-2 space-y-1">
                {students.length === 0 && <div className="text-xs text-slate-500 p-2">Select a class to see students.</div>}
                {students.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm rounded-lg px-2 py-1 hover:bg-slate-50">
                    <input type="checkbox" data-testid={`msg-recipient-${s.id}`} checked={form.recipient_ids.includes(s.id)}
                      onChange={(e) => {
                        const next = e.target.checked ? [...form.recipient_ids, s.id] : form.recipient_ids.filter((x) => x !== s.id);
                        setForm({ ...form, recipient_ids: next });
                      }} />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <Input placeholder="Subject" data-testid="msg-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="h-11 rounded-xl" />
            <Textarea rows={5} placeholder="Message" data-testid="msg-body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="rounded-xl" />
            <p className="text-xs text-slate-500">Your message will be sent to the manager for approval before it reaches students.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-testid="msg-send" onClick={send} className="rounded-full bg-[#0F1E4F] text-white">Submit for approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------ My Students (teacher) ------------------ */
export function TeacherStudentsTab() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  useEffect(() => {
    Promise.all([
      api.get("/classes"),
      api.get("/users?role=student").catch(() => ({ data: [] })),
    ]).then(([cs, ss]) => {
      setClasses(cs.data);
      const ids = new Set(cs.data.flatMap((c) => c.student_ids || []));
      setStudents(ss.data.filter((s) => ids.has(s.id)));
    });
  }, []);

  return (
    <Card className="rounded-2xl border-slate-200 overflow-hidden">
      {students.length === 0 ? <div className="p-10 text-center text-slate-500 text-sm">No students in your classes yet.</div> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Class</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.id} data-testid={`teacher-student-${s.id}`}>
                <TableCell className="font-semibold text-[#0F1E4F]">{s.name}</TableCell>
                <TableCell>{s.phone || "—"}</TableCell>
                <TableCell>{classes.find(c => c.student_ids?.includes(s.id))?.name || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

export function TeacherOverviewTab() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ classes: 0, students: 0, hw: 0, exams: 0 });
  useEffect(() => {
    Promise.all([api.get("/classes"), api.get("/homework"), api.get("/exams")])
      .then(([c, h, e]) => {
        const students = new Set(c.data.flatMap((x) => x.student_ids || []));
        setStats({ classes: c.data.length, students: students.size, hw: h.data.length, exams: e.data.length });
      });
  }, []);
  const items = [
    { k: "Classes", v: stats.classes },
    { k: "Students", v: stats.students },
    { k: "Homework", v: stats.hw },
    { k: "Exams", v: stats.exams },
  ];
  return (
    <div className="space-y-6">
      <Card className="p-6 rounded-2xl border-slate-200 bg-gradient-to-br from-[#0F1E4F] to-[#1E3A8A] text-white">
        <div className="text-xs uppercase tracking-widest text-[#F5D06B]">Welcome back</div>
        <div className="mt-2 font-serif text-2xl font-black">{user?.name}</div>
        <div className="mt-1 text-white/70 text-sm">Together for a Brighter Future.</div>
      </Card>
      <div className="grid gap-4 md:grid-cols-4">
        {items.map((it) => (
          <Card key={it.k} className="p-5 rounded-2xl border-slate-200">
            <div className="text-xs uppercase tracking-widest text-slate-500">{it.k}</div>
            <div className="mt-2 font-serif text-3xl font-black text-[#0F1E4F]">{it.v}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
