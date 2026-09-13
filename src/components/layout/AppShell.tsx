import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="relative flex-1 overflow-y-auto bg-grid">
          <div className="mx-auto w-full max-w-[1600px] p-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
