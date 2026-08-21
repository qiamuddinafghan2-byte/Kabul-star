import DashboardShell from "./DashboardShell";
import { DASH } from "@/constants/testIds";

export default function ManagerDashboard() {
  return (
    <DashboardShell
      role="Manager"
      testid={DASH.managerRoot}
      title="Academy overview"
      subtitle="Manage students, teachers, classes, schedules, fees, announcements, and academy settings. Full administrative control lives here."
      modules={[
        "Students",
        "Teachers",
        "Classes",
        "Schedule",
        "Attendance",
        "Homework",
        "Fees",
        "Announcements",
        "Certificates",
        "Communication",
        "Reports",
        "Settings",
      ]}
      accent="#B8860B"
    />
  );
}
