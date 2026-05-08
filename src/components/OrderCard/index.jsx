import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import useOrdersStore from "../../store/useOrdersStore";
import api, { formatStatus, normalizeStatus } from "../../services/api";
import "./module.scss";

function statusColor(status) {
  const key = normalizeStatus(status);

  switch (key) {
    case "pendingpayment":
      return "#9AA0A6";
    case "processing":
      return "#4285F4";
    case "shipping":
      return "#FF8A00";
    case "delivered":
      return "#8E24AA";
    case "completed":
    case "done":
      return "#00C853";
    case "cancelled":
    case "refunded":
      return "#E53935";
    case "refunding":
      return "#F9AB00";
    default:
      return "#9AA0A6";
  }
}

function formatVietnamTime(value) {
  if (!value) {
    return "";
  }

  const raw = value.toString().trim();
  const hasTimezone = raw.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(raw);
  const utcValue = hasTimezone ? raw : `${raw}Z`;
  const date = new Date(utcValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderCard({ order, onChanged }) {
  const navigate = useNavigate();

  const updateOrder = useOrdersStore((state) => state.updateOrder);
  const [loading, setLoading] = useState(false);

  const id = order.orderId || order.id;
  const name =
    order.receiverName || order.buyerName || order.customer?.name || "Customer";
  const address = order.shippingAddress || order.customer?.address || "";
  const status = (order.status || "").toString();
  const statusKey = normalizeStatus(status);
  const time = order.updatedAt || order.createdAt || new Date().toISOString();

  const doChangeStatus = useCallback(
    async (targetStatus) => {
      if (loading) {
        return;
      }

      setLoading(true);

      const oldStatus = order.status;

      updateOrder(id, {
        status: targetStatus,
      });

      try {
        if (targetStatus === "SHIPPING" || targetStatus === "DELIVERED") {
          await api.shipperUpdateOrderStatus(id, targetStatus);
        } else {
          await api.updateOrderStatus(id, targetStatus);
        }

        if (onChanged) {
          await onChanged();
        }
      } catch (_) {
        updateOrder(id, {
          status: oldStatus,
        });
      } finally {
        setLoading(false);
      }
    },
    [id, loading, order.status, updateOrder, onChanged],
  );

  const handleDetails = useCallback(() => {
    navigate(`/orders/${id}`);
  }, [navigate, id]);

  return (
    <div className="order-card">
      <div>
        <div className="name">{name}</div>
        <div className="address">{address}</div>
      </div>

      <div className="meta">
        <div
          className="status-badge"
          style={{
            background: statusColor(status),
            color: "#fff",
          }}
        >
          {formatStatus(status)}
        </div>

        <div className="time">{formatVietnamTime(time)}</div>

        <div
          style={{
            marginTop: 8,
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          {statusKey === "processing" ? (
            <button
              className="action"
              onClick={() => doChangeStatus("SHIPPING")}
              disabled={loading}
              type="button"
            >
              {loading ? "Updating..." : "Pick up"}
            </button>
          ) : null}

          {statusKey === "shipping" ? (
            <button
              className="action"
              onClick={() => doChangeStatus("DELIVERED")}
              disabled={loading}
              type="button"
            >
              {loading ? "Updating..." : "Complete"}
            </button>
          ) : null}

          <button className="action primary" onClick={handleDetails} type="button">
            Details
          </button>
        </div>
      </div>
    </div>
  );
}