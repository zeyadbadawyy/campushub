import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import { useEffect, useRef } from "react";
import { getCurrentUser } from "../services/auth";

function MainLayout({
  children
}) {
  const wsRef = useRef(null);

  useEffect(() => {

    async function connectWebSocket() {

      try {

        const user =
          await getCurrentUser();

        const ws =
          new WebSocket(
            `ws://localhost:8080/ws?userId=${user.id}`
          );

        wsRef.current = ws;

        ws.onopen = () => {

          console.log(
            "WebSocket Connected"
          );

        };
        
      } catch (error) {

        console.error(error);

      }

    }

    connectWebSocket();

  }, []);

  useEffect(() => {

    console.log("MAINLAYOUT MOUNTED");

  }, []);

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