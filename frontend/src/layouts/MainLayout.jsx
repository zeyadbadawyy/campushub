import { useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function MainLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="
      min-h-screen
      bg-slate-50
      text-slate-950
      dark:bg-slate-950
      dark:text-slate-50
    ">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="min-h-screen lg:ml-64">
        <Navbar
          onMenuClick={() =>
            setMobileOpen(true)
          }
        />

        <main className="
          w-full
          px-4
          pb-10
          pt-6
          sm:px-6
          lg:px-8
        ">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;