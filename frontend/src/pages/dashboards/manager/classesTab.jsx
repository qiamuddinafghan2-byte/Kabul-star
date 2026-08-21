import { useEffect, useMemo, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Video, MapPin, AlertTriangle } from "lucide-react";

const DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu"];
const STATUS = ["active", "paused", "completed"];

const EMPTY_FORM = {
  name: "", course_id: "", teacher_id: "", student_ids: [],
  class_type: "physical", branch_id: "", room_id: "", room: "",
  days: [], start_time: "17:00", end_time: "18:00",
  start_date: "", end_date: "",
  status: "active",
  meeting_platform: "Zoom", meeting_url: "", meeting_instructions: "",
};

export function ClassesTab() {
  const [list, setList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [conflicts, setConflicts] = useState([]);
  const [pendingForce, setPendingForce] = useState(false);

  const load = () => api.get("/classes").then((r) => setList(r.data));
  useEffect(() => {
    load();
    api.get("/courses").then((r) => setCourses(r.data.filter(c => !c.archived)));
    api.get("/users?role=teacher").then((r) => setTeachers(r.data));
    api.get("/users?role=student").then((r) => setStudents(r.data));
    api.get("/branches").then((r) => setBranches(r.data));
    api.get("/rooms").then((r) => setRooms(r.data));
  }, []);

  const filteredRooms = useMemo(
    () => rooms.filter((rm) => !form.branch_id || rm.branch_id === form.branch_id),
    [rooms, form.branch_id]
  );

  async function save({ force = false } = {}) {
    if (!form.name || !form.course_id) { toast.error("Name and course required"); return; }
    setConflicts([]);
    try {
      const payload = { ...form, student_ids: form.student_ids || [], days: form.days };
      const url = (editing ? `/classes/${editing.id}` : "/classes") + (force ? "?force=true" : "");
      if (editing) await api.patch(url, payload);
      else await api.post(url, payload);
      setOpen(false); setEditing(null); setForm(EMPTY_FORM); setConflicts([]); setPendingForce(false);
      load(); toast.success("Class saved");
    } catch (e) {
      if (e.response?.status === 409 && e.response.data?.detail?.conflicts) {
        setConflicts(e.response.data.detail.conflicts);
        setPendingForce(true);
        toast.error("Schedule conflict detected — review below");
        return;
      }
      toast.error(formatApiError(e.response?.data?.detail));
    }
  }

  const cName = (id) => courses.find(c => c.id === id)?.name || "—";
  const tName = (id) => teachers.find(t => t.id === id)?.name || "—";
  const bName = (id) => branches.find(b => b.id === id)?.name || "—";
  const rName = (id) => rooms.find(r => r.id === id)?.name || "—";

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button data-testid="class-add" className="rounded-full bg-[#0F1E4F] text-white"
          onClick={() => { setEditing(null); setForm(EMPTY_FORM); setConflicts([]); setOpen(true); }}>
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
                <TableHead>Type</TableHead>
                <TableHead>Where</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold text-[#0F1E4F]">{c.name}</TableCell>
                  <TableCell>{cName(c.course_id)}</TableCell>
                  <TableCell>{tName(c.teacher_id)}</TableCell>
                  <TableCell>
                    <Badge className={`rounded-full border-0 ${c.class_type === "online" ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"}`}>
                      {c.class_type === "online" ? <Video className="h-3 w-3 mr-1 inline" /> : <MapPin className="h-3 w-3 mr-1 inline" />}
                      {c.class_type || "physical"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {c.class_type === "online"
                      ? c.meeting_platform || "Online"
                      : `${bName(c.branch_id)} · ${rName(c.room_id) !== "—" ? rName(c.room_id) : c.room || "—"}`}
                  </TableCell>
                  <TableCell className="text-xs">
                    {(c.days || []).join("/") || "—"} {c.start_time && `${c.start_time}-${c.end_time}`}
                  </TableCell>
                  <TableCell><Badge className="rounded-full border-0 bg-slate-100 text-slate-700 capitalize">{c.status || "active"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="rounded-full h-8"
                      onClick={() => {
                        setEditing(c);
                        setForm({
                          ...EMPTY_FORM,
                          ...c,
                          teacher_id: c.teacher_id || "",
                          branch_id: c.branch_id || "",
                          room_id: c.room_id || "",
                          student_ids: c.student_ids || [],
                          days: c.days || [],
                          start_time: c.start_time || "17:00",
                          end_time: c.end_time || "18:00",
                          class_type: c.class_type || "physical",
                          status: c.status || "active",
                          meeting_platform: c.meeting_platform || "Zoom",
                          meeting_url: c.meeting_url || "",
                          meeting_instructions: c.meeting_instructions || "",
                        });
                        setConflicts([]);
                        setOpen(true);
                      }}>
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
        <DialogContent className="rounded-2xl max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} class</DialogTitle></DialogHeader>

          <div className="grid gap-4">
            {conflicts.length > 0 && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-1">Schedule conflicts detected:</div>
                  <ul className="text-xs space-y-1">
                    {conflicts.map((c, i) => (
                      <li key={i}>
                        <strong>{c.name}</strong> ({c.conflicts.join(" + ")}) on {c.days.join(", ")} {c.start_time}-{c.end_time}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs uppercase tracking-wider text-slate-500">Class name</Label>
                <Input data-testid="class-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl mt-1" placeholder="e.g. Book 1 - Morning" />
              </div>
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

              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Class type</Label>
                <div className="mt-1 flex gap-2">
                  {["physical", "online"].map((t) => (
                    <button key={t} type="button" data-testid={`class-type-${t}`}
                      onClick={() => setForm({ ...form, class_type: t })}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize ${
                        form.class_type === t ? "bg-[#0F1E4F] text-white" : "bg-slate-100 text-slate-600"
                      }`}>
                      {t === "online" ? <Video className="h-3.5 w-3.5 mr-1 inline" /> : <MapPin className="h-3.5 w-3.5 mr-1 inline" />}
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="h-11 rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {form.class_type === "physical" ? (
                <>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-slate-500">Branch</Label>
                    <Select value={form.branch_id} onValueChange={(v) => setForm({ ...form, branch_id: v, room_id: "" })}>
                      <SelectTrigger data-testid="class-branch" className="h-11 rounded-xl mt-1"><SelectValue placeholder="Branch" /></SelectTrigger>
                      <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-slate-500">Room</Label>
                    <Select value={form.room_id} onValueChange={(v) => setForm({ ...form, room_id: v })}>
                      <SelectTrigger data-testid="class-room" className="h-11 rounded-xl mt-1"><SelectValue placeholder="Room" /></SelectTrigger>
                      <SelectContent>
                        {filteredRooms.length === 0 && <div className="p-3 text-xs text-slate-500">No rooms in this branch</div>}
                        {filteredRooms.map(rm => <SelectItem key={rm.id} value={rm.id}>{rm.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-slate-500">Meeting platform</Label>
                    <Select value={form.meeting_platform} onValueChange={(v) => setForm({ ...form, meeting_platform: v })}>
                      <SelectTrigger className="h-11 rounded-xl mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{["Zoom", "Google Meet", "Microsoft Teams", "Other"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-slate-500">Meeting URL</Label>
                    <Input data-testid="class-meeting-url" value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} className="h-11 rounded-xl mt-1" placeholder="https://…" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs uppercase tracking-wider text-slate-500">Meeting instructions</Label>
                    <Textarea rows={2} value={form.meeting_instructions} onChange={(e) => setForm({ ...form, meeting_instructions: e.target.value })} className="rounded-xl mt-1" />
                  </div>
                </>
              )}

              <div className="col-span-2">
                <Label className="text-xs uppercase tracking-wider text-slate-500">Days (Sat-Thu; Friday off)</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DAYS.map((d) => (
                    <button key={d} type="button" data-testid={`class-day-${d}`}
                      onClick={() => {
                        const has = form.days.includes(d);
                        setForm({ ...form, days: has ? form.days.filter(x => x !== d) : [...form.days, d] });
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        form.days.includes(d) ? "bg-[#0F1E4F] text-white" : "bg-slate-100 text-slate-600"
                      }`}>{d}</button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Start time</Label>
                <Input type="time" data-testid="class-start-time" min="06:00" max="20:00" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="h-11 rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">End time</Label>
                <Input type="time" data-testid="class-end-time" min="06:00" max="20:00" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="h-11 rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">Start date</Label>
                <Input type="date" value={form.start_date || ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="h-11 rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500">End date</Label>
                <Input type="date" value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="h-11 rounded-xl mt-1" />
              </div>

              <div className="col-span-2">
                <Label className="text-xs uppercase tracking-wider text-slate-500">Students</Label>
                <div className="mt-1 max-h-40 overflow-auto border border-slate-200 rounded-xl p-2 space-y-1">
                  {students.length === 0 && <div className="text-xs text-slate-500 p-2">No students yet.</div>}
                  {students.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm hover:bg-slate-50 rounded-lg px-2 py-1 cursor-pointer">
                      <input type="checkbox"
                        checked={form.student_ids.includes(s.id)}
                        onChange={(e) => {
                          const next = e.target.checked ? [...form.student_ids, s.id] : form.student_ids.filter(x => x !== s.id);
                          setForm({ ...form, student_ids: next });
                        }} />
                      <span>{s.name}</span>
                      <span className="text-xs text-slate-400">{s.email}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => { setOpen(false); setConflicts([]); setPendingForce(false); }}>Cancel</Button>
            {pendingForce ? (
              <>
                <Button variant="outline" className="rounded-full" onClick={() => { setConflicts([]); setPendingForce(false); }}>Adjust</Button>
                <Button data-testid="class-save-force" className="rounded-full bg-amber-600 hover:bg-amber-700 text-white" onClick={() => save({ force: true })}>Save anyway</Button>
              </>
            ) : (
              <Button data-testid="class-save" className="rounded-full bg-[#0F1E4F] text-white" onClick={() => save()}>Save</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
