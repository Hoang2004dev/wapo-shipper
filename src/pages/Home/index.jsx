import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./module.scss";

import {
  fetchProcessingOrders,
  fetchShippingOrders,
  fetchDeliveredOrders,
  normalizeStatus,
} from "../../services/api";

import OrderCard from "../../components/OrderCard";
import { useSearchParams } from "react-router-dom";

import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5196";

const TABS = [
  {
    key: "processing",
    label: "Ready to ship",
    fetcher: fetchProcessingOrders,
  },
  {
    key: "shipping",
    label: "In transit",
    fetcher: fetchShippingOrders,
  },
  {
    key: "delivered",
    label: "Delivered",
    fetcher: fetchDeliveredOrders,
  },
];

const TAB_STATUS_MAP = {
  processing: ["processing"],
  shipping: ["shipping"],
  delivered: ["delivered"],
};

const DEFAULT_TAB = "processing";
const TAB_STORAGE_KEY = "orderDashboardActiveTab";

function getValidTab(tabKey) {
  const found = TABS.some((tab) => tab.key === tabKey);
  return found ? tabKey : DEFAULT_TAB;
}

function getInitialTabFromStorage() {
  const savedTab = localStorage.getItem(TAB_STORAGE_KEY);
  return getValidTab(savedTab);
}

function getTabTitle(tabKey) {
  const tab = TABS.find((item) => item.key === tabKey);
  return tab?.label || "Orders";
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = useMemo(() => {
    const tabFromUrl = searchParams.get("tab");

    if (tabFromUrl) {
      return getValidTab(tabFromUrl);
    }

    return getInitialTabFromStorage();
  }, [searchParams]);

  const [active, setActive] = useState(initialTab);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const activeRef = useRef(active);
  const connectionRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    activeRef.current = active;
    localStorage.setItem(TAB_STORAGE_KEY, active);

    setSearchParams(
      {
        tab: active,
      },
      {
        replace: true,
      },
    );
  }, [active, setSearchParams]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadOrders = useCallback(
    async (tabKey = active) => {
      const tab = TABS.find((item) => item.key === tabKey);

      if (!tab) {
        return;
      }

      setLoading(true);
      setActionError("");

      try {
        const data = await tab.fetcher();

        if (!mountedRef.current) {
          return;
        }

        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!mountedRef.current) {
          return;
        }

        setActionError(error.message || "Unable to load orders.");
        setOrders([]);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [active],
  );

  useEffect(() => {
    loadOrders(active);
  }, [active, loadOrders]);

  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("accessToken");

    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE}/orderHub`, {
        accessTokenFactory: () =>
          localStorage.getItem("token") ||
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("token") ||
          sessionStorage.getItem("accessToken") ||
          token ||
          "",
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.start().catch(() => {});

    connection.on("ReceiveNewOrder", (updatedOrder) => {
      setOrders((prev) => {
        const currentTab = activeRef.current;
        const statusKey = normalizeStatus(updatedOrder.status);
        const expectedStatuses = TAB_STATUS_MAP[currentTab] || [];
        const isMatching = expectedStatuses.includes(statusKey);

        const updatedOrderId = updatedOrder.orderId || updatedOrder.id;

        const exists = prev.some(
          (order) =>
            String(order.orderId || order.id) === String(updatedOrderId),
        );

        if (isMatching) {
          if (exists) {
            return prev.map((order) =>
              String(order.orderId || order.id) === String(updatedOrderId)
                ? updatedOrder
                : order,
            );
          }

          return [updatedOrder, ...prev];
        }

        return prev.filter(
          (order) =>
            String(order.orderId || order.id) !== String(updatedOrderId),
        );
      });
    });

    return () => {
      connection.off("ReceiveNewOrder");
      connection.stop().catch(() => {});
      connectionRef.current = null;
    };
  }, []);

  function handleTabChange(tabKey) {
    if (tabKey === active) {
      return;
    }

    setActive(tabKey);
  }

  async function handleRefresh() {
    await loadOrders(activeRef.current);
  }

  const handleOrderChanged = useCallback(async () => {
    await loadOrders(activeRef.current);
  }, [loadOrders]);

  const activeTitle = getTabTitle(active);

  return (
    <div className="page-home">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Order management</p>
          <h1>{activeTitle}</h1>
          <p className="page-description">
            Track orders in real time and update delivery progress from one
            simple dashboard.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={handleRefresh}
          type="button"
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      <div className="tabs" role="tablist" aria-label="Order status tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${tab.key === active ? "active" : ""}`}
            onClick={() => handleTabChange(tab.key)}
            type="button"
            role="tab"
            aria-selected={tab.key === active}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content" data-active={active}>
        {actionError && <p className="error">{actionError}</p>}

        {loading && (
          <div className="loading-state">
            <div className="loading-dot" />
            <span>Loading orders...</span>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <p className="empty">No orders found in this status.</p>
        )}

        {!loading && orders.length > 0 && (
          <div className="order-grid">
            {orders.map((order) => {
              const orderId = order.orderId || order.id;

              return (
                <div key={orderId} className="order-item">
                  <OrderCard order={order} onChanged={handleOrderChanged} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}