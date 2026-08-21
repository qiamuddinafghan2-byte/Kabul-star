import DashboardLayout from "./DashboardShell";
import { DASH } from "@/constants/testIds";
import {
  LayoutDashboard, BookOpenCheck, ClipboardCheck, NotebookPen,
  GraduationCap, Award, MessageSquare, Users,
} from "lucide-react";
import {
  TeacherOverviewTab, MyClassesTab, TeacherAttendanceTab, TeacherLessonTab,
  TeacherHomeworkTab, TeacherExamsTab, TeacherMessagesTab, TeacherStudentsTab,
} from "./teacher/tabs";

export default function TeacherDashboard() {
  const tabs = [
    { key: "overview", label: "Overview", icon: LayoutDashboard, render: () => <TeacherOverviewTab /> },
    { key: "classes", label: "My Classes", icon: BookOpenCheck, render: () => <MyClassesTab /> },
    { key: "students", label: "My Students", icon: Users, render: () => <TeacherStudentsTab /> },
    { key: "attendance", label: "Attendance", icon: ClipboardCheck, render: () => <TeacherAttendanceTab /> },
    { key: "lesson", label: "Today's Lesson", icon: NotebookPen, render: () => <TeacherLessonTab /> },
    { key: "homework", label: "Homework", icon: GraduationCap, render: () => <TeacherHomeworkTab /> },
    { key: "exams", label: "Exams", icon: Award, render: () => <TeacherExamsTab /> },
    { key: "messages", label: "Messages", icon: MessageSquare, render: () => <TeacherMessagesTab /> },
  ];
  return <DashboardLayout role="Teacher" testid={DASH.teacherRoot} tabs={tabs} />;
}
