// src\components\OrderList\index.jsx
import React, { useEffect, useState } from "react";

import OrderCard from "../OrderCard";
import { fetchProcessingOrders } from "../../services/api";
import useOrdersStore from "../../store/useOrdersStore";
import "./module.scss";

export default function OrderList() {
  const setOrders = useOrdersStore((state) => state.setOrders);
  const orders = useOrdersStore((state) => state.orders);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    setError("");

    fetchProcessingOrders()
      .then((data) => {
        if (mounted) {
          setOrders(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || "Unable to load orders.");
        }
      });

    return () => {
      mounted = false;
    };
  }, [setOrders]);

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!orders || orders.length === 0) {
    return <p className="empty">No orders found</p>;
  }

  return (
    <div className="order-list">
      {orders.map((order) => (
        <OrderCard key={order.id || order.orderId} order={order} />
      ))}
    </div>
  );
}