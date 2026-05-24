import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Reports from "./pages/Reports";
import ServiceCatalogue from "./pages/ServiceCatalogue";
import KPIStandards from "./pages/KPIStandards";
import SLAConfiguration from "./pages/SLAConfiguration";
import HolidayCalendar from "./pages/HolidayCalendar";
import EvaluationPeriods from "./pages/EvaluationPeriods";
import OPCRCommitments from "./pages/OPCRCommitments";
import Users from "./pages/Users";
import OfficeSettings from "./pages/OfficeSettings";
import VersionHistory from "./pages/VersionHistory";

const PAGES = {
  dashboard: <Dashboard />,
  services: <Services />,
  reports: <Reports />,
  serviceCatalogue: <ServiceCatalogue />,
  kpiStandards: <KPIStandards />,
  slaConfiguration: <SLAConfiguration />,
  holidayCalendar: <HolidayCalendar />,
  evaluationPeriods: <EvaluationPeriods />,
  opcrCommitments: <OPCRCommitments />,
  users: <Users />,
  officeSettings: <OfficeSettings />,
  versionHistory: <VersionHistory />,
};

export default function App() {
  const [active, setActive] = useState("dashboard");

  return (
    <div className="lib-page" style={{ height: "100vh", overflow: "hidden" }}>
      <Sidebar active={active} setActive={setActive} />
      <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
        {PAGES[active] || PAGES.dashboard}
      </div>
    </div>
  );
}
