import DashboardLayout from "./DashboardShell";
import { DASH } from "@/constants/testIds";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Layers,
  Megaphone, MessageSquare, Settings, UserPlus, Building2, DoorOpen,
  ClipboardCheck, DollarSign, Award,
} from "lucide-react";
import {
  OverviewTab, RegistrationsTab, UsersTab, CoursesTab, ClassesTab,
  MessageApprovalsTab, AnnouncementsAdminTab, SettingsTab,
  BranchesTab, RoomsTab, ManagerAttendanceTab, FeesTab, CertificatesTab,
} from "./manager/tabs";

export default function ManagerDashboard() {
  const tabs = [
    { key: "overview", label: "Overview", icon: LayoutDashboard, render: () => <OverviewTab /> },
    { key: "registrations", label: "Registrations", icon: UserPlus, render: () => <RegistrationsTab /> },
    { key: "students", label: "Students", icon: GraduationCap, render: () => <UsersTab role="student" testidPrefix="student" /> },
    { key: "teachers", label: "Teachers", icon: Users, render: () => <UsersTab role="teacher" testidPrefix="teacher" /> },
    { key: "courses", label: "Courses", icon: BookOpen, render: () => <CoursesTab /> },
    { key: "branches", label: "Branches", icon: Building2, render: () => <BranchesTab /> },
    { key: "rooms", label: "Rooms", icon: DoorOpen, render: () => <RoomsTab /> },
    { key: "classes", label: "Classes", icon: Layers, render: () => <ClassesTab /> },
    { key: "attendance", label: "Attendance", icon: ClipboardCheck, render: () => <ManagerAttendanceTab /> },
    { key: "fees", label: "Fees", icon: DollarSign, render: () => <FeesTab /> },
    { key: "certificates", label: "Certificates", icon: Award, render: () => <CertificatesTab /> },
    { key: "messages", label: "Message approvals", icon: MessageSquare, render: () => <MessageApprovalsTab /> },
    { key: "announcements", label: "Announcements", icon: Megaphone, render: () => <AnnouncementsAdminTab /> },
    { key: "settings", label: "Settings", icon: Settings, render: () => <SettingsTab /> },
  ];
  return <DashboardLayout role="Manager" testid={DASH.managerRoot} tabs={tabs} />;
}
