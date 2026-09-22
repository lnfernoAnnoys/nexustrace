import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAdmin } from "./AdminAuthContext";
import AdminShell from "./AdminShell";
import AccountDetail from "./pages/AccountDetail";
import Accounts from "./pages/Accounts";
import AdminLogin from "./pages/AdminLogin";
import AuditLog from "./pages/AuditLog";
import Overview from "./pages/Overview";
import PendingAccounts from "./pages/PendingAccounts";
import RequestDetail from "./pages/RequestDetail";
import Requests from "./pages/Requests";

export default function AdminApp() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route
        element={
          <RequireAdmin>
            <AdminShell />
          </RequireAdmin>
        }
      >
        <Route index element={<Overview />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="accounts/:id" element={<AccountDetail />} />
        <Route path="pending" element={<PendingAccounts />} />
        <Route path="requests" element={<Requests />} />
        <Route path="requests/:id" element={<RequestDetail />} />
        <Route path="audit" element={<AuditLog />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
