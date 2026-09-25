import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Package,
  ShieldCheck,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Layout from "../components/Layout";
import Avatar from "../components/Avatar";
import StatusBadge from "../components/StatusBadge";
import {
  getFarmer,
  getFarmerActivities,
  setFarmerStatus,
  setFarmerVerification,
} from "../lib/services/farmers.service";
import { getDashboardPayouts } from "../lib/services/dashboard.service";
import {
  type Farmer,
  type FarmerVerificationStatus,
} from "../lib/types/farmer";
import type { DashboardPayouts, DashboardPeriod } from "../lib/types/dashboard";
import { getErrorMessage } from "../lib/getErrorMessage";
import { formatDate, formatDays, formatNaira } from "../lib/format";
import type { Activity, ActivityType } from "../lib/types/activity";

const tabs = ["Overview", "Listings", "Orders", "Activity Log"] as const;
type Tab = (typeof tabs)[number];

export default function FarmerProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "verified" | "rejected"
  >("pending");
  const [farmerStatusState, setFarmerStatusState] = useState<
    "active" | "inactive"
  >();
  const [farmerActivity, setFarmerActivity] = useState<Activity[]>([]);
  const params = useParams();
  const farmerId = Number(params.id);

  useEffect(() => {
    const handleFarmerProfile = async (farmerId: number) => {
      try {
        const response = await getFarmer(farmerId);
        setFarmer(response);
        setVerificationStatus(response.verification_status);
        setFarmerStatusState(response.status);
      } catch (error) {
        getErrorMessage(error);
      }
    };
    const handleFarmerActivities = async (farmerId: number) => {
      try {
        const response = await getFarmerActivities(farmerId);
        setFarmerActivity(response);
      } catch (error) {
        getErrorMessage(error);
      }
    };
    handleFarmerProfile(farmerId);
    handleFarmerActivities(farmerId);
  }, [farmerId]);

  const handleVerifyFarmer = async (
    id: number,
    status: FarmerVerificationStatus,
  ) => {
    try {
      const response = await setFarmerVerification(id, status);
      setVerificationStatus(response.verification_status);
    } catch (error) {
      getErrorMessage(error);
    }
  };

  const handleFarmerStatusChange = async (
    id: number,
    status: "active" | "inactive",
  ) => {
    try {
      const response = await setFarmerStatus(id, status);
      setFarmerStatusState(response.status);
    } catch (error) {
      getErrorMessage(error);
    }
  };

  return (
    <Layout
      breadcrumb={`Farmers / ${farmer?.name ?? "Farmer Profile"}`}
      compact
    >
      {/* Back */}
      <button
        onClick={() => navigate("/farmers")}
        className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Farmers
      </button>

      {/* Profile hero card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Top row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar name={farmer?.name ?? "F"} size="lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-slate-900">
                  {farmer?.name}
                </h1>
                <StatusBadge status={farmerStatusState ?? farmer?.status} />
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                {farmer?.phone_number}
              </p>
              <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                {farmer?.lga}, {farmer?.state}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                handleFarmerStatusChange(
                  farmerId,
                  farmerStatusState === "active" ? "inactive" : "active",
                )
              }
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {farmerStatusState === "active"
                ? "Deactivate Farmer"
                : "Activate Farmer"}
            </button>
            <button
              onClick={() => handleVerifyFarmer(farmerId, "verified")}
              className="rounded-xl border border-green-200 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50"
            >
              {verificationStatus === "verified" ? "Verified" : "Verify Farmer"}
            </button>
            <button
              onClick={() => handleVerifyFarmer(farmerId, "rejected")}
              className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              {verificationStatus === "rejected" ? "Rejected" : "Reject Farmer"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 divide-x divide-slate-100 rounded-2xl bg-global-bg">
          <div className="px-6 py-4 text-center">
            <p className="text-2xl font-semibold text-slate-900">
              {farmer?.listings_count}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Listings</p>
          </div>
          <div className="px-6 py-4 text-center">
            <p className="text-2xl font-semibold text-slate-900">
              {farmer?.orders_count}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Completed Orders</p>
          </div>
          <div className="px-6 py-4 text-center">
            <p className="text-2xl font-semibold text-slate-900">
              ₦{Number(farmer?.total_earned ?? 0).toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Total Earnings</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-100">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab
                  ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab}
              {tab === "Listings" && (
                <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                  {farmer?.listings_count ?? 0}
                </span>
              )}
              {tab === "Orders" && (
                <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                  {farmer?.orders_count ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {activeTab === "Overview" && (
            <OverviewTab
              farmer={farmer}
              activities={farmerActivity}
              farmerId={farmerId}
            />
          )}
          {activeTab === "Listings" && <ListingsTab farmer={farmer} />}
          {activeTab === "Orders" && <OrdersTab farmer={farmer} />}
          {activeTab === "Activity Log" && (
            <ActivityLogTab activities={farmerActivity} />
          )}
        </div>
      </div>
    </Layout>
  );
}

const REVENUE_PERIODS: DashboardPeriod[] = ["week", "month", "year"];

interface RevenuePoint {
  label: string;
  amount: number;
}

// The `series`/`peak` shapes aren't documented with a literal example (the API
// docs show them as `[]`/`{}` in every sample response), so read them
// defensively against a handful of plausible key names instead of assuming one.
function normalizeSeries(series: unknown[] | undefined): RevenuePoint[] {
  if (!series?.length) return [];
  return series.map((raw, idx) => {
    const entry = (raw ?? {}) as Record<string, unknown>;
    const label =
      entry.label ?? entry.period ?? entry.bucket ?? entry.date ?? entry.month;
    const amount =
      entry.paid_out ?? entry.amount ?? entry.total ?? entry.value ?? entry.revenue;
    return {
      label: label != null ? String(label) : `#${idx + 1}`,
      amount: Number(amount) || 0,
    };
  });
}

function normalizePeak(peak: Record<string, unknown> | undefined) {
  if (!peak || Object.keys(peak).length === 0) return null;
  const label = peak.label ?? peak.period ?? peak.bucket ?? peak.month ?? peak.date;
  const amount = peak.paid_out ?? peak.amount ?? peak.total ?? peak.value;
  if (label == null && amount == null) return null;
  return {
    label: label != null ? String(label) : "—",
    amount: amount != null ? Number(amount) : null,
  };
}

function FarmerRevenueChart({ farmerId }: { farmerId: number }) {
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [payouts, setPayouts] = useState<DashboardPayouts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const loadPayouts = async () => {
      setLoading(true);
      try {
        const response = await getDashboardPayouts({ period, farmer_id: farmerId });
        if (!ignore) setPayouts(response);
      } catch (error) {
        getErrorMessage(error);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadPayouts();
    return () => {
      ignore = true;
    };
  }, [period, farmerId]);

  const series = useMemo(() => normalizeSeries(payouts?.series), [payouts]);
  const peak = useMemo(
    () => normalizePeak(payouts?.summary.peak as Record<string, unknown> | undefined),
    [payouts],
  );
  const changePercent = payouts?.summary.change_percent ?? 0;

  return (
    <div className="rounded-2xl border border-slate-100 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Revenue</p>
          <h3 className="mt-0.5 text-base font-semibold text-slate-900">
            Payouts released to this farmer
          </h3>
        </div>
        <div className="inline-flex items-center rounded-2xl bg-slate-100 p-1 text-xs">
          {REVENUE_PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-xl px-3 py-1.5 font-medium capitalize transition ${
                period === p
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-global-bg p-4 text-sm">
          <p className="font-semibold text-slate-900">Paid out</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {formatNaira(Number(payouts?.summary.paid_out ?? 0))}
          </p>
          <p
            className={`mt-1 flex items-center gap-1 text-xs ${
              changePercent >= 0 ? "text-success" : "text-rose-600"
            }`}
          >
            {changePercent >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {changePercent >= 0 ? "+" : ""}
            {changePercent.toFixed(1)}% vs prior {period}
          </p>
        </div>
        <div className="rounded-2xl bg-global-bg p-4 text-sm">
          <p className="font-semibold text-slate-900">Payouts</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {payouts?.summary.payouts_count ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-500">Released this {period}</p>
        </div>
        <div className="rounded-2xl bg-global-bg p-4 text-sm">
          <p className="font-semibold text-slate-900">Avg per period</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {formatNaira(Number(payouts?.summary.average_per_bucket ?? 0))}
          </p>
          <p className="mt-1 text-xs text-slate-500">Across the series</p>
        </div>
        <div className="rounded-2xl bg-global-bg p-4 text-sm">
          <p className="font-semibold text-slate-900">Peak</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {peak?.label ?? "—"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {peak?.amount != null ? formatNaira(peak.amount) : "No data yet"}
          </p>
        </div>
      </div>

      <div className="mt-6 h-64">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="loader"></div>
          </div>
        ) : series.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            No payout activity yet for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => formatNaira(Number(value))} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#27AE60"
                strokeWidth={2}
                dot={{ r: 4, fill: "#27AE60" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function OverviewTab({
  farmer,
  activities,
  farmerId,
}: {
  farmer: Farmer | null;
  activities: Activity[];
  farmerId: number;
}) {
  return (
    <div className="space-y-6">
      <FarmerRevenueChart farmerId={farmerId} />
      <div className="grid gap-6 lg:grid-cols-2">
      {/* Farm Information */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-100 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">
            Farm Information
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Farm Name</dt>
              <dd className="font-medium text-slate-800">
                {farmer?.farm?.name ?? "Ibrahim Family Farm"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Location</dt>
              <dd className="font-medium text-slate-800">{`${farmer?.lga}, ${farmer?.state}`}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Farming method</dt>
              <dd className="font-medium text-slate-800">
                {farmer?.farm?.farming_method ?? "Mixed Farming"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Hometown</dt>
              <dd className="font-medium text-slate-800">{farmer?.lga}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-100 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">
            Top Products
          </h3>
          <div className="space-y-3">
            {farmer?.listings?.slice(0, 3).map((produce) => (
              <div
                key={produce.produce.name}
                className="flex items-center justify-between rounded-xl bg-global-bg px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <img className="text-xl" src={produce.produce.image_url} />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {produce.produce.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {farmer.listings_count} listings
                    </p>
                  </div>
                </div>
                <StatusBadge status={produce.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Personal Information + History */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-100 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">
            Personal Information
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Full Name</dt>
              <dd className="font-medium text-slate-800">{farmer?.name}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-slate-500">State</dt>
              <dd className="font-medium text-slate-800">
                {farmer?.state} State
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Experience</dt>
              <dd className="font-medium text-slate-800">
                {farmer?.farm?.years_experience != null
                  ? `${farmer.farm.years_experience} yrs`
                  : "Not specified"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-slate-500">
                <Phone className="h-3.5 w-3.5" /> Phone
              </dt>
              <dd className="font-medium text-slate-800">
                {farmer?.phone_number || "Not specified"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-slate-500">
                <Mail className="h-3.5 w-3.5" /> Email
              </dt>
              <dd className="font-medium text-slate-800">
                {farmer?.email || "Not specified"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-100 p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">
            History Timeline
          </h3>
          <div className="space-y-3">
            {activities?.map((item, idx) => {
              const { icon: Icon, color } = activityStyles[item.type];
              return (
                <div key={idx} className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                  <p className="shrink-0 text-xs text-slate-400">
                    {formatDays(item.occurred_at)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function ListingsTab({ farmer }: { farmer: Farmer | null }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-120 text-left text-sm">
        <thead>
          <tr className="text-slate-500">
            <th className="pb-3 font-medium">Produce</th>
            <th className="pb-3 font-medium">Price</th>
            <th className="pb-3 font-medium">Stock</th>
            <th className="pb-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {farmer?.listings?.map((item, idx) => (
            <tr key={idx} className="border-t border-slate-100">
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <img
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-global-bg text-xl"
                    src={item.produce.image_url}
                  />
                  <div>
                    <p className="font-medium text-slate-900">
                      {item.produce.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.produce.category.name}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-3 font-medium text-primary">{item.price}</td>
              <td className="py-3 text-slate-600">{item.stock}</td>
              <td className="py-3">
                <StatusBadge status={item.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrdersTab({ farmer }: { farmer: Farmer | null }) {
  if (!farmer?.recent_orders || farmer.recent_orders.length === 0) {
    return <p className="text-sm text-slate-500">No order yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-120 text-left text-sm">
        <thead>
          <tr className="text-slate-500">
            <th className="pb-3 font-medium">Order</th>
            <th className="pb-3 font-medium">Buyer</th>
            <th className="pb-3 font-medium">Amount</th>
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {farmer.recent_orders.map((order, idx) => (
            <tr key={idx} className="border-t border-slate-100">
              <td className="py-3">
                <p className="font-medium text-slate-900">
                  {order.order_number}
                </p>
                <p className="text-xs text-slate-400">{order.produce?.name}</p>
              </td>
              <td className="py-3 text-slate-600">{order.buyer?.name}</td>
              <td className="py-3 font-medium text-slate-900">{order.total}</td>
              <td className="py-3 text-slate-500">
                {formatDate(order.placed_at)}
              </td>
              <td className="py-3">
                <StatusBadge status={order.payment_status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const activityStyles: Record<
  ActivityType,
  { icon: typeof Package; color: string }
> = {
  order: { icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50" },
  listing: { icon: Package, color: "text-sky-600 bg-sky-50" },
  dispute: { icon: AlertTriangle, color: "text-rose-600 bg-rose-50" },
  farmer: { icon: ShieldCheck, color: "text-slate-600 bg-slate-100" },
  buyer: { icon: Mail, color: "text-slate-600 bg-slate-100" },
};

function ActivityLogTab({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-slate-500">No activity yet.</p>;
  }

  return (
    <div className="space-y-4">
      {activities.map((item) => {
        const { icon: Icon, color } = activityStyles[item.type];
        return (
          <div
            key={item.id}
            className="flex items-start gap-4 rounded-2xl bg-global-bg px-5 py-4"
          >
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-800">{item.title}</p>
              {item.description && (
                <p className="text-sm text-slate-500">{item.description}</p>
              )}
            </div>
            <p className="shrink-0 text-sm text-slate-400">
              {formatDays(item.occurred_at)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
