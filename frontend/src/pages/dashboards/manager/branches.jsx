import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Archive } from "lucide-react";

export function BranchesTab() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "" });

  const load = () => api.get("/branches").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.name) { toast.error("Name required"); return; }
    try {
      if (editing) await api.patch(`/branches/${editing.id}`, form);
      else await api.post("/branches", form);
      setOpen(false); setEditing(null); setForm({ name: "", address: "", phone: "", email: "" });
      load(); toast.success("Saved");
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }
  async function archive(b) {
    if (!window.confirm(`Archive ${b.name}?`)) return;
    await api.delete(`/branches/${b.id}`); load();
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button data-testid="branch-add" className="rounded-full bg-[#0F1E4F] text-white"
          onClick={() => { setEditing(null); setForm({ name: "", address: "", phone: "", email: "" }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add branch
        </Button>
      </div>
      <Card className="rounded-2xl border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead><TableHead>Address</TableHead>
              <TableHead>Phone</TableHead><TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-semibold text-[#0F1E4F]">{b.name}</TableCell>
                <TableCell>{b.address || "—"}</TableCell>
                <TableCell>{b.phone || "—"}</TableCell>
                <TableCell>{b.email || "—"}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" className="rounded-full h-8"
                    onClick={() => { setEditing(b); setForm({ name: b.name, address: b.address || "", phone: b.phone || "", email: b.email || "" }); setOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full h-8" onClick={() => archive(b)}>
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} branch</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            {["name", "address", "phone", "email"].map((k) => (
              <div key={k}>
                <Label className="text-xs uppercase tracking-wider text-slate-500 capitalize">{k}</Label>
                <Input data-testid={`branch-${k}`} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="h-11 rounded-xl mt-1" />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-testid="branch-save" className="rounded-full bg-[#0F1E4F] text-white" onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function RoomsTab() {
  const [list, setList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", branch_id: "", capacity: 25 });

  const load = () => api.get("/rooms").then((r) => setList(r.data));
  useEffect(() => { load(); api.get("/branches").then((r) => setBranches(r.data)); }, []);

  async function save() {
    if (!form.name || !form.branch_id) { toast.error("Name & branch required"); return; }
    try {
      const payload = { ...form, capacity: form.capacity ? Number(form.capacity) : null };
      if (editing) await api.patch(`/rooms/${editing.id}`, payload);
      else await api.post("/rooms", payload);
      setOpen(false); setEditing(null); setForm({ name: "", branch_id: "", capacity: 25 });
      load(); toast.success("Saved");
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  }
  async function archive(rm) {
    if (!window.confirm(`Archive ${rm.name}?`)) return;
    await api.delete(`/rooms/${rm.id}`); load();
  }

  const bName = (id) => branches.find(b => b.id === id)?.name || "—";

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button data-testid="room-add" className="rounded-full bg-[#0F1E4F] text-white"
          onClick={() => { setEditing(null); setForm({ name: "", branch_id: branches[0]?.id || "", capacity: 25 }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add room
        </Button>
      </div>
      <Card className="rounded-2xl border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room</TableHead><TableHead>Branch</TableHead>
              <TableHead>Capacity</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((rm) => (
              <TableRow key={rm.id}>
                <TableCell className="font-semibold text-[#0F1E4F]">{rm.name}</TableCell>
                <TableCell>{bName(rm.branch_id)}</TableCell>
                <TableCell>{rm.capacity ?? "—"}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" className="rounded-full h-8"
                    onClick={() => { setEditing(rm); setForm({ name: rm.name, branch_id: rm.branch_id, capacity: rm.capacity ?? 25 }); setOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full h-8" onClick={() => archive(rm)}>
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} room</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Name</Label>
              <Input data-testid="room-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Branch</Label>
              <Select value={form.branch_id} onValueChange={(v) => setForm({ ...form, branch_id: v })}>
                <SelectTrigger data-testid="room-branch" className="h-11 rounded-xl mt-1"><SelectValue placeholder="Branch" /></SelectTrigger>
                <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-500">Capacity</Label>
              <Input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="h-11 rounded-xl mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-testid="room-save" className="rounded-full bg-[#0F1E4F] text-white" onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
