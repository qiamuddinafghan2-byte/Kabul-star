import DashboardLayout from "./DashboardShell";
import { DASH } from "@/constants/testIds";
import {
  LayoutDashboard, BookOpen, ClipboardCheck, GraduationCap,
  Award, MessageSquare, User, DollarSign,
} from "lucide-react";
import {
  StudentOverviewTab, StudentCourseTab, StudentAttendanceTab,
  StudentHomeworkTab, StudentExamsTab, StudentMessagesTab, StudentProfileTab,
} from "./student/tabs";
import { StudentFeesTab, StudentCertificatesTab } from "./student/finance";

export default function StudentDashboard() {
  const tabs = [
    { key: "overview", label: "Overview", icon: LayoutDashboard, render: () => <StudentOverviewTab /> },
    { key: "course", label: "My Course", icon: BookOpen, render: () => <StudentCourseTab /> },
    { key: "attendance", label: "Attendance", icon: ClipboardCheck, render: () => <StudentAttendanceTab /> },
    { key: "homework", label: "Homework", icon: GraduationCap, render: () => <StudentHomeworkTab /> },
    { key: "exams", label: "Exams", icon: Award, render: () => <StudentExamsTab /> },
    { key: "fees", label: "Fees", icon: DollarSign, render: () => <StudentFeesTab /> },
    { key: "certificates", label: "Certificates", icon: Award, render: () => <StudentCertificatesTab /> },
    { key: "messages", label: "Messages", icon: MessageSquare, render: () => <StudentMessagesTab /> },
    { key: "profile", label: "Profile", icon: User, render: () => <StudentProfileTab /> },
  ];
  return <DashboardLayout role="Student" testid={DASH.studentRoot} tabs={tabs} />;
}
