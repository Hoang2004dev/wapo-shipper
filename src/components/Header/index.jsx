import React from "react";
import "./module.scss";

export default function Header() {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark">WFS</span>

        <div>
          <div className="brand-name">Wapo Fashion Shipper</div>
          <div className="brand-subtitle">Delivery dashboard</div>
        </div>
      </div>
    </header>
  );
}