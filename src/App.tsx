import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Cases from "@/pages/Cases";
import CaseWorkspace from "@/pages/CaseWorkspace";
import NetworkExplorer from "@/pages/NetworkExplorer";
import EntitiesRegistry from "@/pages/EntitiesRegistry";
import EntityProfile from "@/pages/EntityProfile";
import AIInsights from "@/pages/AIInsights";
import EvidenceIntake from "@/pages/EvidenceIntake";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/:caseId" element={<CaseWorkspace />} />
        <Route path="/network" element={<NetworkExplorer />} />
        <Route path="/entities/:type" element={<EntitiesRegistry />} />
        <Route path="/entities/:type/:id" element={<EntityProfile />} />
        <Route path="/ai-insights" element={<AIInsights />} />
        <Route path="/evidence" element={<EvidenceIntake />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
