import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function MainLayout({
  children
}) {

  return (

    <div className="layout">

      <Sidebar />

      <div className="main-content">

        <Navbar />

        {children}

      </div>

    </div>

  );

}

export default MainLayout;