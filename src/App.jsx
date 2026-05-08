import React from "react";
import AppRoutes from "./routes";
import Header from "./components/Header";
import Footer from "./components/Footer";
import "./App.css";

export default function App() {
  return (
    <div className="app-shell">
      <div className="app-container">
        <Header />

        <main className="app-body">
          <AppRoutes />
        </main>

        <Footer />
      </div>
    </div>
  );
}