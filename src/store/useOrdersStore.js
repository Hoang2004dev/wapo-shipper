import { create } from "zustand";

const useOrdersStore = create((set) => ({
  orders: [],

  setOrders: (orders) => set({ orders }),

  updateOrder: (id, patch) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        String(order.id || order.orderId) === String(id)
          ? { ...order, ...patch }
          : order,
      ),
    })),

  removeOrder: (id) =>
    set((state) => ({
      orders: state.orders.filter(
        (order) => String(order.id || order.orderId) !== String(id),
      ),
    })),
}));

export default useOrdersStore;