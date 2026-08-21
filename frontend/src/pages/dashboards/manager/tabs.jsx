import { useEffect, useState, useCallback } from "react";
import { api, formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Check, X, Archive, Pencil, Edit3 } from "lucide-react";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  active: "bg-emerald-100 text-emerald-800",
  suspended: "bg-slate-200 text-slate-700",
};

export function StatusBadge({ value }) {
  return (
    <Badge className={`rounded-full border-0 capitalize ${STATUS_STYLES[value] || "bg-slate-100 text-slate-700"}`}>
      {value}
    </Badge>
  );
}

/* ------------------------- OVERVIEW ------------------------- */
export function OverviewTab() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    Promise.all([
      api.get("/users?role=student"),
      api.get("/users?role=teacher"),
      api.get("/courses"),
      api.get("/classes"),
      api.get("/registrations?status=pending"),
      api.get("/messages?box=pending"),
    ]).then(([s, t, c, cl, r, m]) => setStats({
      students: s.data.length, teachers: t.data.length,
      courses: c.data.length, classes: cl.data.length,
      pending: r.data.length, msgApprovals: m.data.length,
    })).catch(() => setStats({ students: 0, teachers: 0, courses: 0, classes: 0, pending: 0, msgApprovals: 0 }));
  }, []);

  const items = stats ? [
    { k: "Students", v: stats.students, accent: "#0F1E4F" },
    { k: "Teachers", v: stats.teachers, accent: "#B8860B" },
    { k: "Courses", v: stats.courses, accent: "#0F1E4F" },
    { k: "Classes", v: stats.classes, accent: "#B8860B" },
    { k: "Pending applications", v: stats.pending, accent: "#F5D06B" },
    { k: "Message approvals", v: stats.msgApprovals, accent: "#F5D06B" },
  ] : [];

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {items.map((it) => (
        <Card key={it.k} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="h-2 w-10 rounded-full" style={{ background: it.accent }} />
          <div className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-500">{it.k}</div>
          <div className="mt-2 font-serif text-4xl font-black text-[#0F1E4F]">{it.v}</div>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------- REGISTRATIONS ------------------------- */
export function RegistrationsTab() {
  const [list, setList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [approving, setApproving] = useState(null);
  const [courseId, setCourseId] = useState("");
  const [tempPw, setTempPw] = useState("Student@123");

  const load = useCallback(() => {
    api.get(`/registrations${filter ? `?status=${filter}` : ""}`).then((r) => setList(r.data));
  }, [filter]);
  useEffect(() => { load(); api.get("/courses").then((r) => setCourses(r.data.filter(c => !c.archived))); }, [load]);

  async function approve() {
    if (!approving) return;
    try {
      const { data } = await api.post(`/registrations/${approving.id}/approve`,
        { course_id: courseId || approving.desired_course_id, password: tempPw });
      toast.success(`Approved. Login: ${data.email} / ${data.temp_password}`);
      setApproving(null); setCourseId(""); setTempPw("Student@123");
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail, "Approval failed"));
    }
  }
  async function reject(reg) {
    if (!window.confirm(`Reject ${reg.full_name}'s application?`)) return;
    try { await api.post(`/registrations/${reg.id}/reject`); toast.success("Rejected"); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }

  const courseName = (id) => courses.find((c) => c.id === id)?.name || "—";

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {[["pending","Pending"],["approved","Approved"],["rejected","Rejected"],["","All"]].map(([k, l]) => (
            <button
              key={k || "all"}
              data-testid={`reg-filter-${k || "all"}`}
              onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                filter === k ? "bg-[#0F1E4F] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >{l}</button>
          ))}
        </div>
      </div>

      <Card className="rounded-2xl border-slate-200 overflow-hidden">
        {list.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">No applications.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Desired course</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-semibold text-[#0F1E4F]">{r.full_name}</div>
                    <div className="text-xs text-slate-500">{r.email || "—"}</div>
                  </TableCell>
                  <TableCell>{r.phone}</TableCell>
                  <TableCell>{courseName(r.desired_course_id)}</TableCell>
                  <TableCell>{r.current_level || "—"}</TableCell>
                  <TableCell><StatusBadge value={r.status} /></TableCell>
                  <TableCell className="text-right">
                    {r.status === "pending" && (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" data-testid={`reg-approve-${r.id}`}
                          onClick={() => { setApproving(r); setCourseId(r.desired_course_id || ""); }}
                          className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white h-8">
                          <Check className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`reg-reject-${r.id}`}
                          onClick={() => reject(r)}
                          className="rounded-full h-8 border-red-200 text-red-700 hover:bg-red-50">
                          <X className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={!!approving} onOpenChange={(o) => !o && setApproving(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Approve {approving?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assign course</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger data-testid="reg-approve-course" className="h-11 rounded-xl mt-1">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Temp password</Label>
              <Input data-testid="reg-approve-pw" value={tempPw} onChange={(e) => setTempPw(e.target.value)} className="h-11 rounded-xl mt-1" />
              <p className="text-[11px] text-slate-500 mt-1">Share this with the student. They can change it later.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setApproving(null)}>Cancel</Button>
            <Button data-testid="reg-approve-confirm" className="rounded-full bg-[#0F1E4F] text-white" onClick={approve}>Approve & create account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------- USERS (students/teachers) ------------------------- */
export function UsersTab({ role, testidPrefix = "user" }) {
  const [list, setList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", course_id: "" });
  const [q, setQ] = useState("");

  const load = useCallback(() => api.get(`/users?role=${role}`).then((r) => setList(r.data)), [role]);
  useEffect(() => { load(); api.get("/courses").then((r) => setCourses(r.data.filter(c => !c.archived))); }, [load]);

  async function save() {
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        delete payload.email;
        await api.patch(`/users/${editing.id}`, payload);
        toast.success("Updated");
      } else {
        if (!form.email || !form.password || !form.name) { toast.error("Fill name, email, password"); return; }
        await api.post("/users", { ...form, role });
        toast.success(`${role} created`);
      }
      setOpen(false); setEditing(null);
      setForm({ name: "", email: "", password: "", phone: "", course_id: "" });
      load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }

  async function toggleActive(u) {
    try { await api.patch(`/users/${u.id}`, { active: !u.active }); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }

  const filtered = list.filter((u) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (u.name || "").toLowerCase().includes(s) || (u.email || "").toLowerCase().includes(s) || (u.phone || "").toLowerCase().includes(s);
  });

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-4 justify-between">
        <Input placeholder={`Search ${role}s`} value={q} onChange={(e) => setQ(e.target.value)}
               data-testid={`${testidPrefix}-search`} className="h-10 rounded-xl max-w-xs" />
        <Button data-testid={`${testidPrefix}-add`} className="rounded-full bg-[#0F1E4F] text-white"
                onClick={() => { setEditing(null); setForm({ name: "", email: "", password: "", phone: "", course_id: "" }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add {role}
        </Button>
      </div>

      <Card className="rounded-2xl border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">No {role}s yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                {role === "student" && <TableHead>Course</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-semibold text-[#0F1E4F]">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone || "—"}</TableCell>
                  {role === "student" && <TableCell>{courses.find(c => c.id === u.course_id)?.name || "—"}</TableCell>}
                  <TableCell><StatusBadge value={u.active ? "active" : "suspended"} /></TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" className="rounded-full h-8"
                      onClick={() => { setEditing(u); setForm({ name: u.name, email: u.email, password: "", phone: u.phone || "", course_id: u.course_id || "" }); setOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full h-8"
                      onClick={() => toggleActive(u)}>
                      {u.active ? "Suspend" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} {role}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Full name</Label>
              <Input data-testid={`${testidPrefix}-form-name`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Email</Label>
              <Input data-testid={`${testidPrefix}-form-email`} disabled={!!editing} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">
                {editing ? "New password (leave blank to keep)" : "Password"}
              </Label>
              <Input data-testid={`${testidPrefix}-form-pw`} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-11 rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 rounded-xl mt-1" />
            </div>
            {role === "student" && (
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Course</Label>
                <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                  <SelectTrigger className="h-11 rounded-xl mt-1"><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-testid={`${testidPrefix}-form-save`} className="rounded-full bg-[#0F1E4F] text-white" onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------- COURSES ------------------------- */
export function CoursesTab() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", duration_months: 1, category: "Main", order: 0, description: "" });

  const load = () => api.get("/courses").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  async function save() {
    try {
      if (editing) await api.patch(`/courses/${editing.id}`, { ...form, duration_months: Number(form.duration_months), order: Number(form.order) });
      else await api.post("/courses", { ...form, duration_months: Number(form.duration_months), order: Number(form.order) });
      setOpen(false); setEditing(null);
      setForm({ name: "", duration_months: 1, category: "Main", order: 0, description: "" });
      load();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }

  async function archive(c) {
    if (!window.confirm(`Archive "${c.name}"?`)) return;
    try { await api.delete(`/courses/${c.id}`); load(); toast.success("Archived"); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button data-testid="course-add" className="rounded-full bg-[#0F1E4F] text-white"
          onClick={() => { setEditing(null); setForm({ name: "", duration_months: 1, category: "Main", order: list.length, description: "" }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add course
        </Button>
      </div>

      <Card className="rounded-2xl border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Archived</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.order}</TableCell>
                <TableCell className="font-semibold text-[#0F1E4F]">{c.name}</TableCell>
                <TableCell>{c.category || "—"}</TableCell>
                <TableCell>{c.duration_months} mo</TableCell>
                <TableCell>{c.archived ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" className="rounded-full h-8"
                    onClick={() => { setEditing(c); setForm({ name: c.name, duration_months: c.duration_months, category: c.category || "Main", order: c.order, description: c.description || "" }); setOpen(true); }}>
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  {!c.archived && (
                    <Button size="sm" variant="outline" className="rounded-full h-8" onClick={() => archive(c)}>
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} course</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Name</Label>
              <Input data-testid="course-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl mt-1" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Duration (mo)</Label>
                <Input type="number" step="0.5" min="0.5" value={form.duration_months} onChange={(e) => setForm({ ...form, duration_months: e.target.value })} className="h-11 rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-11 rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Foundation", "Main", "Professional"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Order</Label>
                <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="h-11 rounded-xl mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="rounded-xl mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-testid="course-save" className="rounded-full bg-[#0F1E4F] text-white" onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* CLASSES tab moved to ./classesTab.jsx */
export { ClassesTab } from "./classesTab";
export { BranchesTab, RoomsTab } from "./branches";
export { ManagerAttendanceTab, FeesTab, CertificatesTab } from "./finance";

function _LegacyClassesTab_UNUSED() {
  const [list, setList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", course_id: "", teacher_id: "", student_ids: [], room: "", schedule: "", branch: "", online: false });

  const load = () => api.get("/classes").then((r) => setList(r.data));
  useEffect(() => {
    load();
    api.get("/courses").then((r) => setCourses(r.data.filter(c => !c.archived)));
    api.get("/users?role=teacher").then((r) => setTeachers(r.data));
    api.get("/users?role=student").then((r) => setStudents(r.data));
  }, []);

  async function save() {
    try {
      const payload = { ...form };
      if (editing) await api.patch(`/classes/${editing.id}`, payload);
      else await api.post("/classes", payload);
      setOpen(false); setEditing(null);
      setForm({ name: "", course_id: "", teacher_id: "", student_ids: [], room: "", schedule: "", branch: "", online: false });
      load(); toast.success("Saved");
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }

  const cName = (id) => courses.find(c => c.id === id)?.name || "—";
  const tName = (id) => teachers.find(t => t.id === id)?.name || "—";

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button data-testid="class-add" className="rounded-full bg-[#0F1E4F] text-white"
          onClick={() => { setEditing(null); setForm({ name: "", course_id: "", teacher_id: "", student_ids: [], room: "", schedule: "", branch: "", online: false }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add class
        </Button>
      </div>
      <Card className="rounded-2xl border-slate-200 overflow-hidden">
        {list.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">No classes yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Students</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold text-[#0F1E4F]">{c.name}</TableCell>
                  <TableCell>{cName(c.course_id)}</TableCell>
                  <TableCell>{tName(c.teacher_id)}</TableCell>
                  <TableCell>{c.schedule || "—"}</TableCell>
                  <TableCell>{c.student_ids?.length || 0}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="rounded-full h-8"
                      onClick={() => { setEditing(c); setForm({ name: c.name, course_id: c.course_id, teacher_id: c.teacher_id || "", student_ids: c.student_ids || [], room: c.room || "", schedule: c.schedule || "", branch: c.branch || "", online: !!c.online }); setOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} class</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Class name</Label>
              <Input data-testid="class-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl mt-1" placeholder="e.g. Book 1 - Morning" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Course</Label>
                <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                  <SelectTrigger data-testid="class-course" className="h-11 rounded-xl mt-1"><SelectValue placeholder="Course" /></SelectTrigger>
                  <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Teacher</Label>
                <Select value={form.teacher_id} onValueChange={(v) => setForm({ ...form, teacher_id: v })}>
                  <SelectTrigger data-testid="class-teacher" className="h-11 rounded-xl mt-1"><SelectValue placeholder="Teacher" /></SelectTrigger>
                  <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Room</Label>
                <Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} className="h-11 rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Schedule</Label>
                <Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} className="h-11 rounded-xl mt-1" placeholder="Sat/Mon/Wed 5-6 PM" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Students</Label>
              <div className="mt-1 max-h-40 overflow-auto border border-slate-200 rounded-xl p-2 space-y-1">
                {students.length === 0 && <div className="text-xs text-slate-500 p-2">No students yet. Approve applications first.</div>}
                {students.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm hover:bg-slate-50 rounded-lg px-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.student_ids.includes(s.id)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.student_ids, s.id]
                          : form.student_ids.filter((x) => x !== s.id);
                        setForm({ ...form, student_ids: next });
                      }}
                    />
                    <span>{s.name}</span>
                    <span className="text-xs text-slate-400">{s.email}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-testid="class-save" className="rounded-full bg-[#0F1E4F] text-white" onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------- MESSAGE APPROVALS ------------------------- */
export function MessageApprovalsTab() {
  const [list, setList] = useState([]);
  const load = () => api.get("/messages?box=pending").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  async function act(id, action) {
    try { await api.post(`/messages/${id}/${action}`); toast.success(action + "d"); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }

  return (
    <div className="space-y-3">
      {list.length === 0 && (
        <Card className="p-10 text-center text-slate-500 text-sm rounded-2xl border-slate-200">
          No messages awaiting approval.
        </Card>
      )}
      {list.map((m) => (
        <Card key={m.id} className="p-6 rounded-2xl border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-widest text-[#B8860B]">From {m.author_name}</div>
              <div className="mt-1 font-serif text-lg font-black text-[#0F1E4F]">{m.subject}</div>
              <p className="mt-3 text-slate-600 whitespace-pre-line text-sm">{m.body}</p>
              <div className="mt-3 text-xs text-slate-400">To {m.recipient_ids.length} recipient(s)</div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Button size="sm" data-testid={`msg-approve-${m.id}`} className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white h-8" onClick={() => act(m.id, "approve")}>Approve</Button>
              <Button size="sm" variant="outline" data-testid={`msg-reject-${m.id}`} className="rounded-full h-8 border-red-200 text-red-700" onClick={() => act(m.id, "reject")}>Reject</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------- ANNOUNCEMENTS (manager) ------------------------- */
export function AnnouncementsAdminTab() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", image_url: "", published: true, expires_at: "" });

  const load = () => api.get("/announcements").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  async function save() {
    try {
      const payload = { ...form, expires_at: form.expires_at || null };
      if (editing) await api.patch(`/announcements/${editing.id}`, payload);
      else await api.post("/announcements", payload);
      setOpen(false); setEditing(null);
      setForm({ title: "", description: "", image_url: "", published: true, expires_at: "" });
      load(); toast.success("Saved");
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }
  async function remove(a) {
    if (!window.confirm("Delete announcement?")) return;
    await api.delete(`/announcements/${a.id}`); load();
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button data-testid="ann-add" className="rounded-full bg-[#0F1E4F] text-white"
          onClick={() => { setEditing(null); setForm({ title: "", description: "", image_url: "", published: true, expires_at: "" }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New announcement
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((a) => (
          <Card key={a.id} className="p-6 rounded-2xl border-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-[#B8860B]">{a.published ? "Published" : "Draft"}</div>
                <div className="mt-1 font-serif text-lg font-black text-[#0F1E4F]">{a.title}</div>
                <p className="mt-2 text-sm text-slate-600 line-clamp-3">{a.description}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button size="sm" variant="outline" className="rounded-full h-8"
                  onClick={() => { setEditing(a); setForm({ title: a.title, description: a.description, image_url: a.image_url || "", published: a.published, expires_at: a.expires_at || "" }); setOpen(true); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" className="rounded-full h-8 border-red-200 text-red-700" onClick={() => remove(a)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} announcement</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Title</Label>
              <Input data-testid="ann-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-11 rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Description</Label>
              <Textarea data-testid="ann-desc" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Image URL (coming soon: upload)</Label>
              <Input disabled placeholder="Upload feature coming soon" className="h-11 rounded-xl mt-1 bg-slate-50" />
            </div>
            <div className="flex items-center gap-2">
              <input id="ann-pub" type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              <label htmlFor="ann-pub" className="text-sm">Published (visible on public homepage)</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-testid="ann-save" className="rounded-full bg-[#0F1E4F] text-white" onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------- SETTINGS ------------------------- */
export function SettingsTab() {
  const [c, setC] = useState(null);
  useEffect(() => { api.get("/settings/contact").then((r) => setC(r.data)); }, []);

  if (!c) return <div className="text-slate-500">Loading…</div>;

  const upd = (k) => (e) => setC({ ...c, [k]: e.target.value });

  async function save() {
    try { await api.put("/settings/contact", c); toast.success("Saved"); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }

  const fields = [
    ["academy_name", "Academy name"],
    ["slogan", "Slogan"],
    ["motto", "Motto"],
    ["phone", "Phone"],
    ["email", "Email"],
    ["address", "Address"],
    ["working_hours", "Working hours"],
    ["facebook", "Facebook URL"],
    ["instagram", "Instagram URL"],
  ];

  return (
    <Card className="p-6 md:p-8 rounded-2xl border-slate-200 max-w-2xl">
      <div className="grid gap-4">
        {fields.map(([k, l]) => (
          <div key={k}>
            <Label className="text-xs uppercase tracking-wider text-slate-500">{l}</Label>
            <Input data-testid={`set-${k}`} value={c[k] || ""} onChange={upd(k)} className="h-11 rounded-xl mt-1" />
          </div>
        ))}
      </div>
      <Button data-testid="set-save" onClick={save} className="mt-6 rounded-full bg-[#0F1E4F] text-white h-11 px-6">Save changes</Button>
    </Card>
  );
}
