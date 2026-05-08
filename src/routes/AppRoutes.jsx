import React from "react";
import { Routes, Route } from "react-router-dom";

import { PATHS } from "./paths";
import Home from "../pages/Home";
import OrderDetail from "../pages/OrderDetail";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={PATHS.HOME} element={<Home />} />
      <Route path={PATHS.ORDER_DETAIL} element={<OrderDetail />} />
    </Routes>
  );
}