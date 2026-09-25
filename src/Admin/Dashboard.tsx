import { useEffect, useState } from "react";
import {
  ClipboardList,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  X,
  Bell,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Layout from "../components/Layout";
import { type DashboardStats } from "../lib/types/dashboard";
import { type AuthUser } from "../lib/types/auth";
import {
  getDashboardStats,
  getNotifications,
  getRecentActivities,
} from "../lib/services/dashboard.service";
import { updateOrderStatus } from "../lib/services/orders.service";
import { getCurrentUser } from "../lib/services/auth.service";
import { getErrorMessage } from "../lib/getErrorMessage";
import { formatDate, formatDays } from "../lib/format";
import { useNavigate } from "react-router";
import type { Activity } from "../lib/types/activity";
import type { Notification } from "../lib/types/notification";

const revenueData = [
  { month: "Jan", revenue: 22 },
  { month: "Feb", revenue: 38 },
  { month: "Mar", revenue: 45 },
  { month: "Apr", revenue: 55 },
  { month: "May", revenue: 62 },
  { month: "Jun", revenue: 73 },
  { month: "Jul", revenue: 88 },
];

const Dashboard = () => {
  const [showActivity, setShowActivity] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(
    null,
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(
    null,
  );
  const navigate = useNavigate();

  const handleProcessOrder = async (
    e: React.MouseEvent,
    order: NonNullable<DashboardStats["order_action_queue"]>[number],
  ) => {
    e.stopPropagation();
    if (processingOrderId !== null) return;
    if (order.action.next_status === "new") return;

    setProcessingOrderId(order.id);
    try {
      await updateOrderStatus(order.id, order.action.next_status);
      setDashboardData((prev) =>
        prev
          ? {
              ...prev,
              order_action_queue: prev.order_action_queue.filter(
                (item) => item.id !== order.id,
              ),
              order_action_queue_count: Math.max(
                0,
                prev.order_action_queue_count - 1,
              ),
            }
          : prev,
      );
    } catch (error) {
      getErrorMessage(error);
    } finally {
      setProcessingOrderId(null);
    }
  };

  const stats = [
    {
      label: "Total Orders",
      value: dashboardData?.total_orders ?? "0",
      subtext: "12 new today",
      icon: ShoppingBag,
    },
    {
      label: "Total Listings",
      value: dashboardData?.total_listings ?? "0",
      subtext: "5 pending review",
      icon: Package,
    },
    {
      label: "Active Farmers",
      value: dashboardData?.active_farmers ?? "0",
      subtext: "3 pending verify",
      icon: Users,
    },
    {
      label: "Active Buyers",
      value: dashboardData?.active_users ?? "0",
      subtext: "31 new this week",
      icon: ClipboardList,
    },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await getDashboardStats();
        setDashboardData(response);
      } catch (error) {
        getErrorMessage(error)
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await getCurrentUser();
        setUser(response);
      } catch (error) {
        getErrorMessage(error);
      }
    };
    getUser();
  }, []);

  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      return "Good morning";
    } else if (currentHour < 18) {
      return "Good afternoon";
    } else {
      return "Good evening";
    }
  };

  useEffect(() => {
    const getRecentActivity = async () => {
      try {
        const response = await getRecentActivities({ limit: 10 });
        setRecentActivity(response);
      } catch (err) {
        getErrorMessage(err);
      }
    };
    getRecentActivity();
  }, []);

  useEffect(() => {
    const getAllNotifications = async () => {
      try {
        const response = await getNotifications({
          status: "unread",
          per_page: 10,
        });
        setNotifications(response.data || []);
        console.log("Notifications fetched successfully:", response);
      } catch (err) {
        getErrorMessage(err);
      }
    };
    getAllNotifications();
  }, []);

  return (
    <>
      <Layout
        breadcrumb="Dashboard / Overview"
        title={`${getGreeting()}, ${user?.name || "there"}!`}
        subtitle="Here's what's happening on TradeConnect today."
        onNotificationsClick={() => setShowNotifications(true)}
      >
        <div className="grid gap-4 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl border-3 border-slate-50 border-b-primary bg-white p-5 shadow-sm"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-dash-brown text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-500">{stat.subtext}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Farmer's revenue flow
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Monthly payouts recovered to verified farmers
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Week
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              {[
                {
                  label: "Total paid out",
                  value: "₦327,000",
                  sub: "+3.6% vs prior period",
                },
                {
                  label: "Peak month",
                  value: "July",
                  sub: "Highest on record",
                },
                {
                  label: "Avg monthly",
                  value: "₦46,700",
                  sub: "+12.6% vs last month",
                },
                {
                  label: "Active Farmers",
                  value: "84",
                  sub: "Earnings for this period",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-3xl bg-global-bg p-4 text-sm"
                >
                  <p className="font-semibold text-slate-900">{s.label}</p>
                  <p className="mt-3 text-2xl font-semibold">{s.value}</p>
                  <p className="mt-2 text-success">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 h-120">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenueData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="#95321C"
                    strokeDasharray="4 4"
                    vertical={true}
                  />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => `₦${value}k`} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#27AE60"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#27AE60" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 ml-8 flex items-center gap-4">
              <div className="h-3 w-6 rounded-full bg-success" />
              <p className="font-medium text-primary">Farmer Payout (₦) --</p>
              <h2 className="text-xl font-semibold text-slate-900">₦327,000</h2>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent activity</h3>
                <button
                  onClick={() => setShowActivity(true)}
                  className="text-sm font-medium text-primary"
                >
                  See all
                </button>
              </div>
              <div className="mt-5 space-y-4">
                {recentActivity.slice(0, 4).map((item) => {
                  return (
                    <div
                      key={item.title}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 ">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {item.title}
                            </p>
                            <p className="text-sm text-slate-500">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            {item.status}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDays(item.occurred_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Orders queue</h3>
                  <p className="text-sm text-slate-500">Needs action</p>
                </div>
                <button
                  className="text-sm font-medium text-primary cursor-pointer"
                  onClick={() => navigate(`/orders`)}
                >
                  View all
                </button>
              </div>
              <div className="mt-5 space-y-4">
                {dashboardData?.order_action_queue.slice(0, 4).map((order) => (
                  <div
                    key={order.order_number}
                    onClick={() =>
                      navigate(
                        `/orders?order=${encodeURIComponent(order.order_number)}`,
                      )
                    }
                    className="flex items-center justify-between cursor-pointer rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {order.order_number} - {order.buyer.name}
                      </p>

                      <p className="text-sm text-slate-500">
                        {formatDays(order.placed_at)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleProcessOrder(e, order)}
                      disabled={processingOrderId === order.id}
                      className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {processingOrderId === order.id
                        ? "Processing…"
                        : order.action.label || "View order"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </Layout>

      {/* Recent Activity Drawer */}
      {showActivity && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/30"
          onClick={() => setShowActivity(false)}
        >
          <div
            className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Activity
              </h2>
              <button
                onClick={() => setShowActivity(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 p-6">
              {recentActivity.map((item, idx) => {
                // const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm text-slate-700">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-700">
                          {item.status}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDays(item.occurred_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/30"
          onClick={() => setShowNotifications(false)}
        >
          <div
            className="h-full w-full max-w-sm overflow-y-auto bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-slate-900">
                  Notifications
                </h2>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <button className="mb-4 ml-auto block text-xs font-medium text-primary">
                Mark all as read
              </button>
              <div className="space-y-3">
                {notifications.map((n, idx) => {
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${n.title}`}
                      >
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {n.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDate(n.created_at)}
                        </p>
                      </div>
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"></span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
