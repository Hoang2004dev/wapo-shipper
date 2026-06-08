import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import api, { formatStatus, normalizeStatus, statusColor } from "../../services/api";
import "./module.scss";

function formatVietnamTime(value) {
  if (!value) return "";
  const raw = value.toString().trim();
  const hasTimezone = raw.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(raw);
  const utcValue = hasTimezone ? raw : `${raw}Z`;
  const date = new Date(utcValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

/**
 * Returns the list of actions that the shipper is allowed to perform
 * according to the flow in UpdateOrderStatusByShipperAsync
 */
function getShipperActions(statusKey) {
  switch (statusKey) {
    // ── Delivery flow ──────────────────────────────────────────
    case "processing":
      return [
        {
          label: "Confirm pickup",
          icon: "",
          targetStatus: "SHIPPING",
          variant: "primary",
          tooltip: "Picked up from seller, delivery started",
        },
      ];

    case "shipping":
      return [
        {
          label: "Delivered",
          icon: "",
          targetStatus: "DELIVERED",
          variant: "success",
          tooltip: "Confirmed successful delivery to customer",
        },
      ];

    // ── Return flow ────────────────────────────────────────────
    case "returnapproved":
      return [
        {
          label: "Picked up return",
          icon: "",
          targetStatus: "RETURN_PICKED_UP",
          variant: "return",
          tooltip: "Confirmed return package picked up from customer",
        },
      ];

    case "returnpickedup":
      return [
        {
          label: "Returning package",
          icon: "",
          targetStatus: "RETURN_SHIPPING",
          variant: "return",
          tooltip: "Return package is on the way back to the seller",
        },
      ];

    case "returnshipping":
      return [
        {
          label: "Returned to seller",
          icon: "",
          targetStatus: "RETURN_DELIVERED",
          variant: "return-done",
          tooltip: "Confirmed return package delivered back to the seller",
        },
      ];

    default:
      return [];
  }
}

export default function OrderCard({ order, onChanged }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(order.status);

  const id = order.orderId || order.id;
  const name = order.receiverName || order.buyerName || "Customer";
  const address = order.shippingAddress || "";
  const statusKey = normalizeStatus(localStatus);
  const colors = statusColor(localStatus);
  const time = order.updatedAt || order.createdAt;

  const doChangeStatus = useCallback(async (targetStatus) => {
    if (loading) return;
    setLoading(true);

    const prevStatus = localStatus;
    setLocalStatus(targetStatus); // optimistic

    try {
      await api.shipperUpdateOrderStatus(id, targetStatus);
      if (onChanged) await onChanged();
    } catch (err) {
      setLocalStatus(prevStatus); // rollback
      alert(err.message || "Failed to update status.");
    } finally {
      setLoading(false);
    }
  }, [id, loading, localStatus, onChanged]);

  const handleDetails = useCallback(() => {
    navigate(`/orders/${id}`);
  }, [navigate, id]);

  const actions = getShipperActions(statusKey);
  const isReturnFlow = statusKey.startsWith("return");

  return (
    <div className={`order-card ${isReturnFlow ? "return-card" : ""}`}>
      {/* ── Return indicator ── */}
      {isReturnFlow && (
        <div className="return-ribbon">Return order</div>
      )}

      {/* ── Header ── */}
      <div className="card-header">
        <div className="card-id">#{id}</div>
        <div
          className="status-badge"
          style={{ background: colors.bg, color: colors.text }}
        >
          {formatStatus(localStatus)}
        </div>
      </div>

      {/* ── Receiver info ── */}
      <div className="card-body">
        <div className="receiver-name">{name}</div>
        {address && <div className="receiver-address">{address}</div>}
        {order.receiverPhone && (
          <a className="receiver-phone" href={`tel:${order.receiverPhone}`}>
            {order.receiverPhone}
          </a>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="card-footer">
        <div className="card-time">{formatVietnamTime(time)}</div>

        <div className="card-actions">
          {actions.map((action) => (
            <button
              key={action.targetStatus}
              className={`action-btn ${action.variant}`}
              onClick={() => doChangeStatus(action.targetStatus)}
              disabled={loading}
              type="button"
              title={action.tooltip}
            >
              {action.icon && <span>{action.icon}</span>}
              {loading ? "Processing..." : action.label}
            </button>
          ))}

          <button
            className="action-btn outline"
            onClick={handleDetails}
            type="button"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}