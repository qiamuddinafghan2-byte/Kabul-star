import DashboardShell from "./DashboardShell";
import { DASH } from "@/constants/testIds";

export default function StudentDashboard() {
  return (
    <DashboardShell
      role="Student"
      testid={DASH.studentRoot}
      title="Your learning journey"
      subtitle="Track your classes, schedule, homework, attendance, and academy announcements — all in one place."
      modules={[
        "My Classes",
        "Schedule",
        "Homework",
        "Attendance",
        "Progress",
        "Announcements",
      ]}
      accent="#F5D06B"
    />
  );
}
