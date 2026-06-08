import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

import {
  fetchProcessingOrders,
  fetchShippingOrders,
  fetchDeliveredOrders,
  fetchReturnApprovedOrders,
  fetchReturnPickedUpOrders,
  fetchReturnShippingOrders,
  normalizeStatus,
} from "../../services/api";

import OrderCard from "../../components/OrderCard";
import "./module.scss";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5196";

// ─── Tab config ───────────────────────────────────────────────
const TABS = [
  {
    key: "processing",
    label: "To Pick Up",
    icon: "",
    fetcher: fetchProcessingOrders,
    matchStatuses: ["processing"],
    description: "Paid orders, waiting for shipper pickup",
    accentColor: "#1d4ed8",
    accentBg: "#dbeafe",
  },
  {
    key: "shipping",
    label: "Shipping",
    icon: "",
    fetcher: fetchShippingOrders,
    matchStatuses: ["shipping"],
    description: "Orders on the way to the customer",
    accentColor: "#92400e",
    accentBg: "#fff3cd",
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: "",
    fetcher: fetchDeliveredOrders,
    matchStatuses: ["delivered"],
    description: "Successfully delivered orders, awaiting confirmation",
    accentColor: "#6d28d9",
    accentBg: "#ede9fe",
  },
  // ─── Return flow ───────────────────────────────────────────
  {
    key: "return_approved",
    label: "To Pick Up Return",
    icon: "",
    fetcher: fetchReturnApprovedOrders,
    matchStatuses: ["returnapproved"],
    description: "Return approved, waiting to pick up from customer",
    accentColor: "#9d174d",
    accentBg: "#fce7f3",
    isReturn: true,
  },
  {
    key: "return_picked_up",
    label: "Picking Up Return",
    icon: "",
    fetcher: fetchReturnPickedUpOrders,
    matchStatuses: ["returnpickedup"],
    description: "Return package picked up, in transit back",
    accentColor: "#7e22ce",
    accentBg: "#fdf4ff",
    isReturn: true,
  },
  {
    key: "return_shipping",
    label: "Returning",
    icon: "",
    fetcher: fetchReturnShippingOrders,
    matchStatuses: ["returnshipping"],
    description: "Return package on the way back to the seller",
    accentColor: "#581c87",
    accentBg: "#f5f3ff",
    isReturn: true,
  },
];

const TAB_STORAGE_KEY = "wfs_active_tab";
const DEFAULT_TAB = "processing";

function getValidTab(key) {
  return TABS.some((t) => t.key === key) ? key : DEFAULT_TAB;
}

function getInitialTab() {
  return getValidTab(localStorage.getItem(TAB_STORAGE_KEY));
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = useMemo(() => {
    const fromUrl = searchParams.get("tab");
    return fromUrl ? getValidTab(fromUrl) : getInitialTab();
  }, []); // eslint-disable-line

  const [active, setActive] = useState(initialTab);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeRef = useRef(active);
  const mountedRef = useRef(true);

  useEffect(() => {
    activeRef.current = active;
    localStorage.setItem(TAB_STORAGE_KEY, active);
    setSearchParams({ tab: active }, { replace: true });
  }, [active, setSearchParams]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadOrders = useCallback(async (tabKey = active) => {
    const tab = TABS.find((t) => t.key === tabKey);
    if (!tab) return;

    setLoading(true);
    setError("");

    try {
      const data = await tab.fetcher();
      if (!mountedRef.current) return;
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || "Failed to load orders.");
      setOrders([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [active]);

  useEffect(() => {
    loadOrders(active);
  }, [active]); // eslint-disable-line

  // SignalR realtime
  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      "";

    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE}/orderHub`, {
        accessTokenFactory: () =>
          localStorage.getItem("token") ||
          localStorage.getItem("accessToken") ||
          token || "",
      })
      .configureLogging(LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

    connection.start().catch(() => {});

    connection.on("ReceiveNewOrder", (updated) => {
      const currentTab = TABS.find((t) => t.key === activeRef.current);
      if (!currentTab) return;

      const statusKey = normalizeStatus(updated.status);
      const isMatch = currentTab.matchStatuses.includes(statusKey);
      const updatedId = String(updated.orderId || updated.id);

      setOrders((prev) => {
        const exists = prev.some((o) => String(o.orderId || o.id) === updatedId);

        if (isMatch) {
          if (exists) {
            return prev.map((o) =>
              String(o.orderId || o.id) === updatedId ? updated : o
            );
          }
          return [updated, ...prev];
        }

        return prev.filter((o) => String(o.orderId || o.id) !== updatedId);
      });
    });

    return () => {
      connection.off("ReceiveNewOrder");
      connection.stop().catch(() => {});
    };
  }, []);

  const handleOrderChanged = useCallback(async () => {
    await loadOrders(activeRef.current);
  }, [loadOrders]);

  const activeTab = TABS.find((t) => t.key === active);
  const normalTabs = TABS.filter((t) => !t.isReturn);
  const returnTabs = TABS.filter((t) => t.isReturn);

  return (
    <div className="page-home">
      {/* ── Hero ── */}
      <section className="page-hero" style={{ "--accent": activeTab?.accentColor, "--accent-bg": activeTab?.accentBg }}>
        <div className="hero-text">
          <span className="eyebrow">Wapo Fashion Shipper</span>
          <h1 className="hero-title">
            {activeTab?.icon && <span className="hero-icon">{activeTab?.icon}</span>}
            {activeTab?.label}
          </h1>
          <p className="hero-desc">{activeTab?.description}</p>
        </div>

        <div className="hero-actions">
          <div className="order-count-chip">
            <span className="count-num">{orders.length}</span>
            <span className="count-label">{orders.length === 1 ? "order" : "orders"}</span>
          </div>
          <button
            className="refresh-btn"
            onClick={() => loadOrders(activeRef.current)}
            disabled={loading}
            type="button"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M1 4v6h6M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </section>

      {/* ── Tabs ── */}
      <div className="tabs-wrapper">
        {/* Normal delivery tabs */}
        <div className="tabs-group">
          <span className="tabs-group-label">Delivery</span>
          <div className="tabs" role="tablist">
            {normalTabs.map((tab) => (
              <button
                key={tab.key}
                className={`tab ${tab.key === active ? "active" : ""}`}
                onClick={() => setActive(tab.key)}
                type="button"
                role="tab"
                aria-selected={tab.key === active}
                style={tab.key === active ? { "--tab-accent": tab.accentColor, "--tab-accent-bg": tab.accentBg } : {}}
              >
                {tab.icon && <span className="tab-icon">{tab.icon}</span>}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Return tabs */}
        <div className="tabs-group">
          <span className="tabs-group-label return-label">Returns</span>
          <div className="tabs" role="tablist">
            {returnTabs.map((tab) => (
              <button
                key={tab.key}
                className={`tab return-tab ${tab.key === active ? "active" : ""}`}
                onClick={() => setActive(tab.key)}
                type="button"
                role="tab"
                aria-selected={tab.key === active}
                style={tab.key === active ? { "--tab-accent": tab.accentColor, "--tab-accent-bg": tab.accentBg } : {}}
              >
                {tab.icon && <span className="tab-icon">{tab.icon}</span>}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="tab-content">
        {error && (
          <div className="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <span>Loading orders...</span>
          </div>
        )}

        {!loading && orders.length === 0 && !error && (
          <div className="empty-state">
            {activeTab?.icon && <div className="empty-icon">{activeTab?.icon}</div>}
            <div className="empty-title">No orders found</div>
            <div className="empty-desc">There are currently no orders in this status</div>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="order-grid">
            {orders.map((order) => (
              <OrderCard
                key={order.orderId || order.id}
                order={order}
                onChanged={handleOrderChanged}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}