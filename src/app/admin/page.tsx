"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  RefreshCw,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  LogOut,
  Save,
  Eye,
  X,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  Search,
} from "lucide-react";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  postal_code: string | null;
  notes?: string | null;
  payment_method: string;
  subtotal: string;
  shipping: string;
  total: string;
  status: string;
  created_at: string;
};

type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
};

type OrderDetails = {
  order: Order;
  items: OrderItem[];
};

const orderStatuses = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function AdminPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedStatuses, setSelectedStatuses] = useState<
    Record<string, string>
  >({});

  const [loading, setLoading] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] =
    useState<OrderDetails | null>(null);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/orders", {
        cache: "no-store",
      });

      if (response.status === 401) {
        router.replace("/admin-login");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load orders.");
      }

      setOrders(data.orders);

      const statusMap: Record<string, string> = {};

      for (const order of data.orders as Order[]) {
        statusMap[order.id] = order.status.toLowerCase();
      }

      setSelectedStatuses(statusMap);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/admin/session", {
          cache: "no-store",
        });

        if (!active) return;

        if (!response.ok) {
          router.replace("/admin-login");
          return;
        }

        setCheckingSession(false);
        await fetchOrders();
      } catch {
        if (active) {
          router.replace("/admin-login");
        }
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [fetchOrders, router]);

  async function handleUpdateStatus(order: Order) {
    const newStatus = selectedStatuses[order.id];

    if (!newStatus || newStatus === order.status.toLowerCase()) {
      setError("Please select a different order status.");
      return;
    }

    try {
      setUpdatingId(order.id);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/admin-login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Status update failed.");
      }

      setOrders((currentOrders) =>
        currentOrders.map((item) =>
          item.id === order.id
            ? { ...item, status: newStatus }
            : item
        )
      );

      setSelectedOrder((current) =>
        current?.order.id === order.id
          ? {
              ...current,
              order: { ...current.order, status: newStatus },
            }
          : current
      );

      setSuccess(
        `Order ${order.order_number} updated to ${newStatus}.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update order status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleViewDetails(orderId: string) {
    try {
      setSelectedOrder(null);
      setDetailsError("");
      setDetailsLoading(true);

      const response = await fetch(
        `/api/orders/${orderId}/details`,
        { cache: "no-store" }
      );

      if (response.status === 401) {
        router.replace("/admin-login");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to load order details.");
      }

      setSelectedOrder({
        order: data.order,
        items: data.items,
      });
    } catch (err) {
      setDetailsError(
        err instanceof Error
          ? err.message
          : "Unable to load order details."
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await fetch("/api/admin/logout", {
        method: "POST",
      });

      router.replace("/admin-login");
      router.refresh();
    } catch {
      setError("Logout failed. Please try again.");
      setLoggingOut(false);
    }
  }

  const formatPrice = (price: string | number) =>
    `Rs. ${Number(price).toLocaleString("en-PK")}`;

  // Cancelled orders revenue mein include nahi honge.
  const totalRevenue = orders.reduce(
    (sum, order) =>
      order.status.toLowerCase() === "cancelled"
        ? sum
        : sum + Number(order.total),
    0
  );

  // Search aur status filter.
  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.order_number.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        order.phone.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        order.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const pendingOrders = orders.filter(
    (order) => order.status.toLowerCase() === "pending"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status.toLowerCase() === "delivered"
  ).length;

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <p className="text-sm text-gray-500">
          Verifying admin session...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-black">
      <header className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard size={25} />

            <div>
              <h1 className="text-xl font-black tracking-widest">
                FASHIONAI
              </h1>
              <p className="text-[10px] tracking-[0.25em] text-gray-500">
                ADMINISTRATION PANEL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center gap-2 bg-black px-4 py-3 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              <RefreshCw size={15} />
              REFRESH
            </button>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 border border-gray-300 px-4 py-3 text-xs font-bold hover:bg-gray-100 disabled:opacity-50"
            >
              <LogOut size={15} />
              {loggingOut ? "LOGGING OUT..." : "LOGOUT"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-9">
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="mt-2 text-sm text-gray-500">
            Manage and monitor your customer orders.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Orders"
            value={orders.length}
            icon={<ShoppingBag size={22} />}
          />

          <StatCard
            title="Total Revenue"
            value={formatPrice(totalRevenue)}
            icon={<Package size={22} />}
          />

          <StatCard
            title="Pending Orders"
            value={pendingOrders}
            icon={<Clock size={22} />}
          />

          <StatCard
            title="Delivered Orders"
            value={deliveredOrders}
            icon={<CheckCircle size={22} />}
          />
        </div>

        <section className="mt-10 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 p-6">
            <div>
              <h3 className="text-lg font-bold">Recent Orders</h3>
              <p className="mt-1 text-xs text-gray-500">
                Live order records from your Neon database.
              </p>
            </div>

            <span className="text-xs font-semibold text-gray-500">
              SHOWING {filteredOrders.length} OF {orders.length} ORDERS
            </span>
          </div>

          {/* Search and Status Filters */}
          <div className="grid gap-3 border-b border-gray-200 p-6 md:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search order number, customer or phone..."
                className="w-full border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-black"
                aria-label="Search orders"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-black"
              aria-label="Filter orders by status"
            >
              <option value="all">All statuses</option>

              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              disabled={!searchQuery && statusFilter === "all"}
              className="border border-gray-300 px-4 py-3 text-xs font-bold uppercase hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear Filters
            </button>
          </div>

          {error && (
            <div className="m-6 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="m-6 bg-green-50 p-4 text-sm text-green-700">
              {success}
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-sm text-gray-500">
              Loading orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">
              {orders.length === 0
                ? "No orders found."
                : "No orders match your search or selected status."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="p-5">Order</th>
                    <th className="p-5">Customer</th>
                    <th className="p-5">Date</th>
                    <th className="p-5">Payment</th>
                    <th className="p-5">Total</th>
                    <th className="p-5">Order Details</th>
                    <th className="p-5">Status Management</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t border-gray-100 text-sm hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap p-5 font-semibold">
                        {order.order_number}
                      </td>

                      <td className="min-w-[180px] p-5">
                        <p className="font-semibold">
                          {order.customer_name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {order.phone}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {order.city}
                        </p>
                      </td>

                      <td className="whitespace-nowrap p-5 text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString(
                          "en-PK"
                        )}
                      </td>

                      <td className="p-5 text-xs font-semibold">
                        {order.payment_method}
                      </td>

                      <td className="whitespace-nowrap p-5 font-bold">
                        {formatPrice(order.total)}
                      </td>

                      <td className="p-5">
                        <button
                          onClick={() => handleViewDetails(order.id)}
                          className="flex items-center gap-2 whitespace-nowrap border border-black px-3 py-2.5 text-[10px] font-bold uppercase hover:bg-black hover:text-white"
                        >
                          <Eye size={14} />
                          View Details
                        </button>
                      </td>

                      <td className="min-w-[230px] p-5">
                        <div className="space-y-3">
                          <StatusBadge status={order.status} />

                          <select
                            value={
                              selectedStatuses[order.id] ||
                              order.status.toLowerCase()
                            }
                            onChange={(event) =>
                              setSelectedStatuses((current) => ({
                                ...current,
                                [order.id]: event.target.value,
                              }))
                            }
                            disabled={updatingId === order.id}
                            className="w-full border border-gray-300 bg-white px-3 py-2 text-xs outline-none focus:border-black disabled:opacity-50"
                          >
                            {orderStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleUpdateStatus(order)}
                            disabled={
                              updatingId === order.id ||
                              selectedStatuses[order.id] ===
                                order.status.toLowerCase()
                            }
                            className="flex w-full items-center justify-center gap-2 bg-black px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                          >
                            <Save size={13} />

                            {updatingId === order.id
                              ? "Updating..."
                              : "Update Status"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-xs text-gray-400">
          FASHIONAI ADMIN PANEL · ORDER MANAGEMENT
        </p>
      </div>

      {/* Order Details Modal */}
      {(detailsLoading || selectedOrder || detailsError) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            if (!detailsLoading) {
              setSelectedOrder(null);
              setDetailsError("");
            }
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-5">
              <div>
                <h2 className="text-xl font-bold">Order Details</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Customer and purchased product information
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setDetailsError("");
                }}
                disabled={detailsLoading}
                className="p-2 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close order details"
              >
                <X size={22} />
              </button>
            </div>

            {detailsLoading ? (
              <div className="p-16 text-center text-sm text-gray-500">
                Loading order details...
              </div>
            ) : detailsError ? (
              <div className="m-6 bg-red-50 p-4 text-sm text-red-700">
                {detailsError}
              </div>
            ) : selectedOrder ? (
              <div className="space-y-7 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">ORDER NUMBER</p>
                    <h3 className="mt-1 font-bold">
                      {selectedOrder.order.order_number}
                    </h3>
                  </div>

                  <StatusBadge status={selectedOrder.order.status} />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="border border-gray-200 p-5">
                    <h3 className="mb-4 flex items-center gap-2 font-bold">
                      <ShoppingBag size={17} />
                      Customer Information
                    </h3>

                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Full Name</p>
                        <p className="mt-1 font-semibold">
                          {selectedOrder.order.customer_name}
                        </p>
                      </div>

                      <div>
                        <p className="flex items-center gap-2 text-xs text-gray-500">
                          <Mail size={13} /> Email
                        </p>

                        <p className="mt-1 break-all">
                          {selectedOrder.order.email || "Not provided"}
                        </p>
                      </div>

                      <div>
                        <p className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone size={13} /> Phone
                        </p>

                        <p className="mt-1">
                          {selectedOrder.order.phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 p-5">
                    <h3 className="mb-4 flex items-center gap-2 font-bold">
                      <MapPin size={17} />
                      Delivery Address
                    </h3>

                    <div className="space-y-3 text-sm">
                      <p>{selectedOrder.order.address}</p>

                      <p>
                        {selectedOrder.order.city}
                        {selectedOrder.order.postal_code
                          ? `, ${selectedOrder.order.postal_code}`
                          : ""}
                      </p>
                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-4">
                      <p className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={13} /> Order Date
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {new Date(
                          selectedOrder.order.created_at
                        ).toLocaleString("en-PK")}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 flex items-center gap-2 font-bold">
                    <Package size={18} />
                    Purchased Products
                  </h3>

                  {selectedOrder.items.length === 0 ? (
                    <p className="border border-gray-200 p-5 text-sm text-gray-500">
                      No products found for this order.
                    </p>
                  ) : (
                    <div className="overflow-x-auto border border-gray-200">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500">
                          <tr>
                            <th className="p-4">Product</th>
                            <th className="p-4">Quantity</th>
                            <th className="p-4">Unit Price</th>
                            <th className="p-4">Total</th>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedOrder.items.map((item) => (
                            <tr
                              key={item.id}
                              className="border-t border-gray-100"
                            >
                              <td className="p-4 font-semibold">
                                {item.product_name}
                              </td>

                              <td className="p-4">
                                {item.quantity}
                              </td>

                              <td className="whitespace-nowrap p-4">
                                {formatPrice(item.unit_price)}
                              </td>

                              <td className="whitespace-nowrap p-4 font-bold">
                                {formatPrice(item.line_total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="border border-gray-200 p-5">
                    <h3 className="mb-4 flex items-center gap-2 font-bold">
                      <FileText size={17} />
                      Payment Information
                    </h3>

                    <p className="text-xs text-gray-500">
                      Payment Method
                    </p>

                    <p className="mt-1 font-semibold">
                      {selectedOrder.order.payment_method}
                    </p>
                  </div>

                  <div className="space-y-3 border border-gray-200 p-5 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Subtotal</span>

                      <span className="font-semibold">
                        {formatPrice(selectedOrder.order.subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Shipping</span>

                      <span className="font-semibold">
                        {formatPrice(selectedOrder.order.shipping)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-t border-gray-200 pt-3 text-base">
                      <span className="font-bold">Grand Total</span>

                      <span className="font-black">
                        {formatPrice(selectedOrder.order.total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 p-5">
                  <h3 className="mb-2 font-bold">Customer Notes</h3>

                  <p className="whitespace-pre-wrap text-sm text-gray-600">
                    {selectedOrder.order.notes?.trim() ||
                      "No additional notes provided."}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full bg-black px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-gray-800"
                >
                  Close Details
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between text-gray-500">
        <span className="text-xs font-semibold">{title}</span>
        {icon}
      </div>

      <p className="mt-5 text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const styles: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700",
    processing: "bg-blue-50 text-blue-700",
    shipped: "bg-purple-50 text-purple-700",
    delivered: "bg-green-50 text-green-700",
    cancelled: "bg-red-50 text-red-700",
  };

  const icons: Record<string, React.ReactNode> = {
    pending: <Clock size={12} />,
    processing: <Package size={12} />,
    shipped: <Truck size={12} />,
    delivered: <CheckCircle size={12} />,
    cancelled: <XCircle size={12} />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase ${
        styles[normalized] || "bg-gray-100 text-gray-600"
      }`}
    >
      {icons[normalized]}
      {status}
    </span>
  );
}