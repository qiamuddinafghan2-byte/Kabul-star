import DashboardShell from "./DashboardShell";
import { DASH } from "@/constants/testIds";

export default function TeacherDashboard() {
  return (
    <DashboardShell
      role="Teacher"
      testid={DASH.teacherRoot}
      title="Your classes at a glance"
      subtitle="Take attendance, share homework, monitor progress, and communicate with your students and the academy manager."
      modules={[
        "My Classes",
        "Attendance",
        "Homework",
        "Students",
        "Schedule",
        "Announcements",
      ]}
      accent="#0F1E4F"
    />
  );
}
