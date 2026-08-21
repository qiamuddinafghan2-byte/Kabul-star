import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { CalendarDays, ClipboardCheck, MessageSquare, Award, BookOpen, GraduationCap } from "lucide-react";

const ATT_STYLES = {
  present: "bg-emerald-100 text-emerald-800",
  absent: "bg-red-100 text-red-800",
  late: "bg-amber-100 text-amber-800",
  excused: "bg-slate-200 text-slate-700",
};

export function StudentOverviewTab() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [att, setAtt] = useState([]);
  const [hw, setHw] = useState([]);
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    api.get("/classes").then((r) => setClasses(r.data));
    api.get("/attendance").then((r) => setAtt(r.data));
    api.get("/homework").then((r) => setHw(r.data));
    api.get("/exams").then((r) => setExams(r.data));
    api.get("/courses/public").then((r) => setCourses(r.data));
    api.get("/lessons").then((r) => setLessons(r.data));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todaysLesson = lessons.find((l) => (l.date || "").slice(0, 10) === today);
  const cls = classes[0];
  const upcomingHw = hw.filter((h) => !h.due_date || h.due_date >= today).slice(0, 3);
  const upcomingExam = exams.find((e) => e.date >= today);

  const total = att.length;
  const present = att.filter((a) => a.status === "present").length;
  const attPct = total ? Math.round((present / total) * 100) : 0;

  const myCourse = courses.find((c) => c.id === user?.course_id);
  const myOrder = myCourse?.order ?? -1;
  const progressPct = courses.length ? Math.round(((myOrder + 1) / courses.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card className="p-6 rounded-2xl border-0 text-white bg-gradient-to-br from-[#0F1E4F] to-[#1E3A8A]">
        <div className="text-xs uppercase tracking-widest text-[#F5D06B]">Welcome</div>
        <div className="mt-1 font-serif text-2xl md:text-3xl font-black">{user?.name}</div>
        <div className="mt-1 text-white/70 text-sm">Come to Learn, Leave to Serve.</div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 rounded-2xl border-slate-200">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#B8860B]">
            <CalendarDays className="h-3.5 w-3.5" /> Today's lesson
          </div>
          {todaysLesson ? (
            <>
              <div className="mt-2 font-serif font-black text-[#0F1E4F]">{todaysLesson.title}</div>
              <p className="mt-2 text-sm text-slate-600 line-clamp-3">{todaysLesson.description}</p>
            </>
          ) : (
            <div className="mt-3 text-sm text-slate-500">No lesson posted for today yet.</div>
          )}
          {cls && <div className="mt-3 text-xs text-slate-500">Class: {cls.name} · {cls.schedule || "TBD"}</div>}
        </Card>

        <Card className="p-6 rounded-2xl border-slate-200">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#B8860B]">
            <BookOpen className="h-3.5 w-3.5" /> My course
          </div>
          <div data-testid="student-my-course" className="mt-2 font-serif font-black text-[#0F1E4F]">{myCourse?.name || "Not assigned"}</div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Overall progress</span><span data-testid="student-progress-pct">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border-slate-200">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#B8860B]">
            <ClipboardCheck className="h-3.5 w-3.5" /> Attendance
          </div>
          <div className="mt-2 font-serif font-black text-3xl text-[#0F1E4F]">{attPct}%</div>
          <div className="text-xs text-slate-500 mt-1">{present}/{total} classes present</div>
        </Card>

        <Card className="p-6 rounded-2xl border-slate-200 md:col-span-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#B8860B]">
            <GraduationCap className="h-3.5 w-3.5" /> Upcoming homework
          </div>
          <div className="mt-3 space-y-2">
            {upcomingHw.length === 0 && <div className="text-sm text-slate-500">No homework due.</div>}
            {upcomingHw.map((h) => (
              <div key={h.id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <div className="text-sm font-semibold text-[#0F1E4F]">{h.title}</div>
                  <div className="text-xs text-slate-500">Due {h.due_date || "—"}</div>
                </div>
                <Badge className="rounded-full border-0 bg-slate-100 text-slate-700">{h.status || "open"}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border-slate-200">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#B8860B]">
            <Award className="h-3.5 w-3.5" /> Next exam
          </div>
          {upcomingExam ? (
            <>
              <div className="mt-2 font-serif font-black text-[#0F1E4F]">{upcomingExam.title}</div>
              <div className="text-sm text-slate-600 mt-1">{upcomingExam.date} {upcomingExam.time && `· ${upcomingExam.time}`}</div>
              <div className="text-xs text-slate-500 mt-1">{upcomingExam.location || ""}</div>
            </>
          ) : (
            <div className="mt-3 text-sm text-slate-500">No exam scheduled.</div>
          )}
        </Card>
      </div>
    </div>
  );
}

export function StudentCourseTab() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  useEffect(() => { api.get("/courses/public").then((r) => setCourses(r.data)); }, []);
  const myOrder = courses.find((c) => c.id === user?.course_id)?.order ?? -1;

  return (
    <div className="grid gap-3">
      {courses.map((c) => {
        const state = c.order < myOrder ? "completed" : c.order === myOrder ? "current" : "upcoming";
        return (
          <Card key={c.id} data-testid={`course-row-${c.id}`} className={`p-5 rounded-2xl border ${state === "current" ? "border-[#0F1E4F]" : "border-slate-200"}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-[#B8860B]">{c.category || "Level"}</div>
                <div className="mt-1 font-serif font-black text-[#0F1E4F]">{c.name}</div>
                <div data-testid={`course-duration-${c.id}`} className="text-xs text-slate-500 mt-1">{c.duration_months} {c.duration_months === 1 ? "month" : "months"}</div>
              </div>
              <Badge data-testid={`course-state-${c.id}`} className={`rounded-full border-0 capitalize ${state === "completed" ? "bg-emerald-100 text-emerald-800" : state === "current" ? "bg-[#0F1E4F] text-white" : "bg-slate-100 text-slate-600"}`}>
                {state}
              </Badge>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function StudentAttendanceTab() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get("/attendance").then((r) => setList(r.data)); }, []);
  const total = list.length;
  const bystat = list.reduce((a, x) => ({ ...a, [x.status]: (a[x.status] || 0) + 1 }), {});
  const pct = total ? Math.round(((bystat.present || 0) / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-5">
        {[
          ["Attendance", `${pct}%`],
          ["Present", bystat.present || 0],
          ["Absent", bystat.absent || 0],
          ["Late", bystat.late || 0],
          ["Excused", bystat.excused || 0],
        ].map(([k, v]) => (
          <Card key={k} className="p-5 rounded-2xl border-slate-200">
            <div className="text-xs uppercase tracking-widest text-slate-500">{k}</div>
            <div className="mt-2 font-serif text-2xl font-black text-[#0F1E4F]">{v}</div>
          </Card>
        ))}
      </div>
      <Card className="rounded-2xl border-slate-200 overflow-hidden">
        {list.length === 0 ? <div className="p-10 text-center text-slate-500 text-sm">No attendance records yet.</div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Note</TableHead></TableRow></TableHeader>
            <TableBody>
              {list.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.date}</TableCell>
                  <TableCell><Badge className={`rounded-full border-0 capitalize ${ATT_STYLES[a.status] || "bg-slate-100"}`}>{a.status}</Badge></TableCell>
                  <TableCell>{a.note || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

export function StudentHomeworkTab() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get("/homework").then((r) => setList(r.data)); }, []);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {list.length === 0 && <Card className="p-8 rounded-2xl border-dashed border-slate-300 text-slate-500 text-sm text-center col-span-full">No homework assigned yet.</Card>}
      {list.map((h) => (
        <Card key={h.id} className="p-6 rounded-2xl border-slate-200">
          <div className="text-xs uppercase tracking-widest text-[#B8860B]">Assigned {(h.assigned_date || "").slice(0, 10)}</div>
          <div className="mt-1 font-serif font-black text-lg text-[#0F1E4F]">{h.title}</div>
          <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{h.description}</p>
          <div className="mt-3 text-xs text-slate-500">Due: {h.due_date || "No due date"}</div>
        </Card>
      ))}
    </div>
  );
}

export function StudentExamsTab() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get("/exams").then((r) => setList(r.data)); }, []);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {list.length === 0 && <Card className="p-8 rounded-2xl border-dashed border-slate-300 text-slate-500 text-sm text-center col-span-full">No exams scheduled.</Card>}
      {list.map((e) => (
        <Card key={e.id} className="p-6 rounded-2xl border-slate-200">
          <div className="text-xs uppercase tracking-widest text-[#B8860B]">{e.date} {e.time && `· ${e.time}`}</div>
          <div className="mt-1 font-serif font-black text-lg text-[#0F1E4F]">{e.title}</div>
          <div className="mt-2 text-sm text-slate-600">{e.location || "Location TBD"}</div>
          {e.instructions && <p className="mt-3 text-sm text-slate-500 whitespace-pre-line">{e.instructions}</p>}
        </Card>
      ))}
    </div>
  );
}

export function StudentMessagesTab() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get("/messages").then((r) => setList(r.data)); }, []);
  return (
    <div className="space-y-3">
      {list.length === 0 && <Card className="p-8 rounded-2xl border-dashed border-slate-300 text-slate-500 text-sm text-center">No messages yet. Approved teacher messages will appear here.</Card>}
      {list.map((m) => (
        <Card key={m.id} className="p-5 rounded-2xl border-slate-200">
          <div className="text-xs uppercase tracking-widest text-[#B8860B]">From {m.author_name} · {new Date(m.created_at).toLocaleString()}</div>
          <div className="mt-1 font-serif font-black text-[#0F1E4F]">{m.subject}</div>
          <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{m.body}</p>
        </Card>
      ))}
    </div>
  );
}

export function StudentProfileTab() {
  const { user } = useAuth();
  const [me, setMe] = useState(user);
  useEffect(() => { api.get("/auth/me").then((r) => setMe(r.data)); }, []);
  const rows = [
    ["Full name", me?.name],
    ["Email", me?.email],
    ["Role", me?.role],
  ];
  return (
    <Card className="p-6 md:p-8 rounded-2xl border-slate-200 max-w-2xl">
      <div className="grid gap-3">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between border-b border-slate-100 py-2">
            <span className="text-xs uppercase tracking-wider text-slate-500">{k}</span>
            <span className="text-sm font-semibold text-[#0F1E4F]">{v || "—"}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">Contact the academy manager to update personal information.</p>
    </Card>
  );
}
