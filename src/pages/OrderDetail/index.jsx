import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./module.scss";

import { formatStatus, getOrder, normalizeStatus } from "../../services/api";

function formatMoney(value) {
  if (value === null || value === undefined) {
    return "0 VND";
  }

  return `${Number(value).toLocaleString("vi-VN")} VND`;
}

function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleString("vi-VN");
}

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    setError("");

    getOrder(id)
      .then((data) => {
        if (mounted) {
          setOrder(data);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || "Unable to load order details.");
        }
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  if (error) {
    return <div style={{ padding: 12, color: "#e53935" }}>{error}</div>;
  }

  if (!order) {
    return <div style={{ padding: 12 }}>Loading...</div>;
  }

  const statusKey = normalizeStatus(order.status);

  return (
    <div className="page-order-detail">
      <h2>Order #{order.orderId}</h2>

      <div className="detail-row">
        <strong>Receiver:</strong> {order.receiverName || "N/A"} —{" "}
        {order.receiverPhone || "N/A"}
      </div>

      <div className="detail-row">
        <strong>Address:</strong> {order.shippingAddress || "N/A"}
      </div>

      <div className="detail-row">
        <strong>Status:</strong> {formatStatus(order.status)}
      </div>

      <div className="detail-row">
        <strong>Created at:</strong> {formatDate(order.createdAt)}
      </div>

      <div className="detail-row">
        <strong>Delivered at:</strong> {formatDate(order.deliveredAt)}
      </div>

      <div className="detail-row">
        <strong>Completed at:</strong> {formatDate(order.completedAt)}
      </div>

      <div className="order-summary">
        <div>
          <div className="detail-row">
            <strong>Subtotal:</strong> {formatMoney(order.subTotal)}
          </div>
          <div className="detail-row">
            <strong>Service fee:</strong> {formatMoney(order.serviceFee)}
          </div>
        </div>

        <div className="total">Total: {formatMoney(order.totalAmount)}</div>
      </div>

      <h3 style={{ color: "#ff4d8a" }}>Items</h3>

      <ul className="items-list">
        {order.orderDetails?.map((item) => (
          <li key={item.orderDetailId} style={{ marginBottom: 8 }}>
            {item.imageUrl ? (
              <img
                className="item-thumb"
                src={item.imageUrl}
                alt={item.itemName || "Item"}
              />
            ) : (
              <div className="item-thumb placeholder" />
            )}

            <div>
              <div style={{ fontWeight: 700 }}>
                {item.itemName || "Unknown item"}
              </div>

              <div style={{ color: "#666" }}>
                {item.quantity} x {formatMoney(item.unitPrice)}
              </div>

              <div style={{ color: "#666" }}>
                Line total: {formatMoney(item.totalPrice)}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {statusKey === "shipping" && order.shippingAddress ? (
        <div className="map-wrap">
          <iframe
            className="map-iframe"
            src={`https://www.google.com/maps?q=${encodeURIComponent(
              order.shippingAddress,
            )}&output=embed`}
            title="map"
          />
        </div>
      ) : null}
    </div>
  );
}