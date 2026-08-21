import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, GraduationCap, Send } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BrandMark } from "@/components/brand/Logo";

const CLASS_TYPES = ["In-person", "Online", "Hybrid"];
const GENDERS = ["Male", "Female", "Prefer not to say"];
const LEVELS = ["No experience", "Pre-Beginner", "Beginner", "Intermediate", "Advanced", "Not sure"];

export default function Register() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    full_name: "", father_name: "", phone: "", email: "", age: "", gender: "",
    current_level: "", desired_course_id: "", preferred_class_type: "",
    preferred_schedule: "", preferred_branch: "", address: "",
    emergency_contact: "", notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/courses/public").then((r) => setCourses(r.data)).catch(() => {});
  }, []);

  const upd = (k) => (e) => setForm((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));

  async function submit(e) {
    e.preventDefault();
    if (!form.full_name || !form.phone) {
      toast.error("Please provide full name and phone number.");
      return;
    }
    setBusy(true);
    try {
      const payload = { ...form, age: form.age ? Number(form.age) : undefined };
      Object.keys(payload).forEach((k) => payload[k] === "" && (payload[k] = undefined));
      await api.post("/registrations/public", payload);
      setDone(true);
      toast.success("Application submitted. The academy will contact you soon.");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail, "Could not submit"));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <Card className="max-w-lg w-full p-10 rounded-3xl text-center border-slate-200">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-[#F5D06B]/20 text-[#B8860B] items-center justify-center mx-auto">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="mt-5 font-serif text-3xl font-black text-[#0F1E4F]">Application received</h1>
          <p className="mt-3 text-slate-600">
            Thank you for applying to Kabul Star English Language Academy. The manager will
            review your application and contact you at{" "}
            <span className="font-semibold text-[#0F1E4F]">{form.phone}</span> shortly.
          </p>
          <Button
            className="mt-8 rounded-full bg-[#0F1E4F] text-white h-11 px-6"
            onClick={() => navigate("/")}
            data-testid="register-done-home"
          >
            Back to home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/"><BrandMark compact /></Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 md:px-6 py-12">
        <div className="text-xs font-semibold tracking-widest uppercase text-[#B8860B]">Enrollment</div>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl font-black text-[#0F1E4F] leading-tight">
          Student registration
        </h1>
        <p className="mt-3 text-slate-600 max-w-2xl">
          Submit your application. The academy manager will review and get in touch to schedule your placement.
        </p>

        <Card className="mt-10 rounded-3xl border border-slate-200 p-6 md:p-10">
          <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
            <Field label="Full name *" required>
              <Input data-testid="reg-full-name" value={form.full_name} onChange={upd("full_name")} className="h-11 rounded-xl" />
            </Field>
            <Field label="Father's name">
              <Input data-testid="reg-father-name" value={form.father_name} onChange={upd("father_name")} className="h-11 rounded-xl" />
            </Field>
            <Field label="Phone number *">
              <Input data-testid="reg-phone" value={form.phone} onChange={upd("phone")} className="h-11 rounded-xl" placeholder="+93 ..." />
            </Field>
            <Field label="Email">
              <Input data-testid="reg-email" type="email" value={form.email} onChange={upd("email")} className="h-11 rounded-xl" />
            </Field>
            <Field label="Age">
              <Input data-testid="reg-age" type="number" min="4" max="99" value={form.age} onChange={upd("age")} className="h-11 rounded-xl" />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onValueChange={upd("gender")}>
                <SelectTrigger data-testid="reg-gender" className="h-11 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Current English level">
              <Select value={form.current_level} onValueChange={upd("current_level")}>
                <SelectTrigger data-testid="reg-level" className="h-11 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Desired course / book">
              <Select value={form.desired_course_id} onValueChange={upd("desired_course_id")}>
                <SelectTrigger data-testid="reg-course" className="h-11 rounded-xl"><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Preferred class type">
              <Select value={form.preferred_class_type} onValueChange={upd("preferred_class_type")}>
                <SelectTrigger data-testid="reg-class-type" className="h-11 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CLASS_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Preferred schedule">
              <Input data-testid="reg-schedule" value={form.preferred_schedule} onChange={upd("preferred_schedule")} className="h-11 rounded-xl" placeholder="e.g. Sat/Mon/Wed evening" />
            </Field>
            <Field label="Preferred branch">
              <Input data-testid="reg-branch" value={form.preferred_branch} onChange={upd("preferred_branch")} className="h-11 rounded-xl" placeholder="Kabul main" />
            </Field>
            <Field label="Emergency contact">
              <Input data-testid="reg-emergency" value={form.emergency_contact} onChange={upd("emergency_contact")} className="h-11 rounded-xl" placeholder="Name & phone" />
            </Field>
            <Field label="Address" className="md:col-span-2">
              <Input data-testid="reg-address" value={form.address} onChange={upd("address")} className="h-11 rounded-xl" />
            </Field>
            <Field label="Additional notes" className="md:col-span-2">
              <Textarea data-testid="reg-notes" value={form.notes} onChange={upd("notes")} rows={3} className="rounded-xl" />
            </Field>

            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-xs text-slate-500 max-w-md">
                Fields marked * are required. All applications are reviewed by the academy manager.
              </p>
              <Button
                type="submit"
                disabled={busy}
                data-testid="reg-submit"
                className="rounded-full h-11 px-6 bg-[#0F1E4F] hover:bg-[#1E3A8A] text-white"
              >
                <Send className="h-4 w-4 mr-1.5" />
                {busy ? "Submitting…" : "Submit application"}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <Label className="text-xs font-semibold tracking-wider uppercase text-slate-500">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
