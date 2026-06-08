import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./module.scss";

import {
  formatStatus,
  getOrder,
  normalizeStatus,
  statusColor,
  shipperUpdateOrderStatus,
} from "../../services/api";

function formatMoney(value) {
  if (value === null || value === undefined) return "0 ₫";
  return `${Number(value).toLocaleString("en-US")} ₫`;
}

function formatDate(value) {
  if (!value) return "—";
  const raw = value.toString().trim();
  const hasTimezone = raw.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(raw);
  const d = new Date(hasTimezone ? raw : `${raw}Z`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
}

/**
 * Flow steps to display timeline according to each order type
 */
function getFlowSteps(statusKey) {
  if (statusKey.startsWith("return")) {
    return [
      { key: "refunding",      label: "Return Requested" },
      { key: "refundapproved",  label: "Return Approved" },
      { key: "returnapproved",  label: "To Pick Up Return" },
      { key: "returnpickedup",  label: "Return Picked Up" },
      { key: "returnshipping",  label: "Returning" },
      { key: "returndelivered", label: "Returned to Seller" },
      { key: "refunded",        label: "Refunded" },
    ];
  }
  return [
    { key: "pendingpayment", label: "Pending Payment" },
    { key: "processing",     label: "To Pick Up" },
    { key: "shipping",       label: "Shipping" },
    { key: "delivered",      label: "Delivered" },
    { key: "completed",      label: "Completed" },
  ];
}

function getShipperAction(statusKey) {
  switch (statusKey) {
    case "processing":      return { label: "Confirm pickup", targetStatus: "SHIPPING" };
    case "shipping":        return { label: "Confirm delivered",  targetStatus: "DELIVERED" };
    case "returnapproved":  return { label: "Picked up return", targetStatus: "RETURN_PICKED_UP" };
    case "returnpickedup":  return { label: "Returning package", targetStatus: "RETURN_SHIPPING" };
    case "returnshipping":  return { label: "Returned to seller", targetStatus: "RETURN_DELIVERED" };
    default: return null;
  }
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setError("");

    getOrder(id)
      .then((data) => { if (mounted) setOrder(data); })
      .catch((err) => { if (mounted) setError(err.message || "Failed to load order."); });

    return () => { mounted = false; };
  }, [id]);

  async function handleAction(targetStatus) {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const updated = await shipperUpdateOrderStatus(id, targetStatus);
      setOrder((prev) => ({ ...prev, status: updated?.status || targetStatus }));
    } catch (err) {
      alert(err.message || "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  }

  if (error) {
    return (
      <div className="detail-error">
        <div className="error-icon" />
        <div>{error}</div>
        <button className="back-btn" onClick={() => navigate(-1)} type="button">Back</button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="detail-loading">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  const statusKey = normalizeStatus(order.status);
  const colors = statusColor(order.status);
  const flowSteps = getFlowSteps(statusKey);
  const currentStepIdx = flowSteps.findIndex((s) => s.key === statusKey);
  const action = getShipperAction(statusKey);
  const isReturnFlow = statusKey.startsWith("return") || statusKey === "refunding" || statusKey === "refunded";

  return (
    <div className="page-detail">
      {/* ── Back ── */}
      <button className="back-btn" onClick={() => navigate(-1)} type="button">
        Back
      </button>

      {/* ── Order header ── */}
      <div className={`detail-header ${isReturnFlow ? "return-header" : ""}`}>
        <div>
          <div className="detail-order-id">Order #{order.orderId}</div>
          <div className="detail-order-code">{order.orderCode}</div>
        </div>
        <div
          className="detail-status-badge"
          style={{ background: colors.bg, color: colors.text }}
        >
          {formatStatus(order.status)}
        </div>
      </div>

      {/* ── Flow timeline ── */}
      <div className="timeline">
        {flowSteps.map((step, idx) => {
          const done = idx < currentStepIdx;
          const current = idx === currentStepIdx;
          return (
            <div key={step.key} className={`timeline-step ${done ? "done" : ""} ${current ? "current" : ""}`}>
              <div className="step-dot" />
              {idx < flowSteps.length - 1 && <div className="step-line" />}
              <div className="step-label">{step.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── Receiver info ── */}
      <div className="info-card">
        <div className="info-card-title">Receiver Info</div>
        <div className="info-row">
          <span className="info-label">Name</span>
          <span>{order.receiverName || "—"}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Phone</span>
          <a href={`tel:${order.receiverPhone}`} className="phone-link">
            {order.receiverPhone || "—"}
          </a>
        </div>
        <div className="info-row">
          <span className="info-label">Address</span>
          <span>{order.shippingAddress || "—"}</span>
        </div>
      </div>

      {/* ── Order summary ── */}
      <div className="info-card">
        <div className="info-card-title">Payment Detail</div>
        <div className="info-row">
          <span className="info-label">Subtotal</span>
          <span>{formatMoney(order.subTotal)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Service Fee</span>
          <span>{formatMoney(order.serviceFee)}</span>
        </div>
        <div className="info-row total-row">
          <span className="info-label">Total Amount</span>
          <span className="total-amount">{formatMoney(order.totalAmount)}</span>
        </div>
      </div>

      {/* ── Timeline dates ── */}
      <div className="info-card">
        <div className="info-card-title">Timestamp</div>
        <div className="info-row">
          <span className="info-label">Created At</span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Updated At</span>
          <span>{formatDate(order.updatedAt)}</span>
        </div>
      </div>

      {/* ── Items ── */}
      <div className="info-card">
        <div className="info-card-title">Items ({order.orderDetails?.length || 0})</div>
        <ul className="items-list">
          {order.orderDetails?.map((item) => (
            <li key={item.orderDetailId} className="item-row">
              {item.imageUrl ? (
                <img className="item-thumb" src={item.imageUrl} alt={item.itemName || "Item"} />
              ) : (
                <div className="item-thumb placeholder" />
              )}
              <div className="item-info">
                <div className="item-name">{item.itemName || "Product"}</div>
                {item.variantSnapshot && (
                  <div className="item-variant">{item.variantSnapshot}</div>
                )}
                <div className="item-qty">
                  {item.quantity} × {formatMoney(item.unitPrice)}
                  <span className="item-total">{formatMoney(item.totalPrice)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Map (only for shipping to buyer) ── */}
      {statusKey === "shipping" && order.shippingAddress && (
        <div className="map-card">
          <div className="info-card-title">Delivery Address Map</div>
          <div className="map-wrap">
            <iframe
              className="map-iframe"
              src={`https://www.google.com/maps?q=${encodeURIComponent(order.shippingAddress)}&output=embed`}
              title="map"
            />
          </div>
        </div>
      )}

      {/* ── Shipper action ── */}
      {action && (
        <div className="action-footer">
          <button
            className={`main-action ${isReturnFlow ? "return-action" : ""}`}
            onClick={() => handleAction(action.targetStatus)}
            disabled={actionLoading}
            type="button"
          >
            {actionLoading ? "Processing..." : action.label}
          </button>
        </div>
      )}
    </div>
  );
}