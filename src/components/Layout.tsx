import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  ChartLine,
  ChevronDown,
  ClipboardList,
  MessageSquare,
  Package,
  Settings,
  Users,
  Menu,
} from "lucide-react";
import Avatar from "./Avatar";
import Logout from "./Logout";
import whiteLogo from "../assets/TradeConnnect1-04.png";
import { getCurrentUser } from "../lib/services/auth.service";
import { getErrorMessage } from "../lib/getErrorMessage";
import type { AuthUser } from "../lib/types/auth";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: ChartLine },
  {
    label: "Users",
    icon: Users,
    children: [
      { label: "Farmers", path: "/farmers" },
      { label: "Buyers", path: "/buyers" },
    ],
  },
  { label: "Listings", path: "/listings", icon: Package },
  { label: "Orders", path: "/orders", icon: ClipboardList },
  { label: "Disputes", path: "/disputes", icon: MessageSquare },
];

interface LayoutProps {
  children: React.ReactNode;
  breadcrumb?: string;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  onNotificationsClick?: () => void;
}

export default function Layout({
  children,
  breadcrumb = "Dashboard / Overview",
  title = "Good morning, There!",
  subtitle = "Here's what's happening on TradeConnect today.",
  compact = false,
  onNotificationsClick,
}: LayoutProps) {
  const location = useLocation();
  const usersSectionActive =
    location.pathname.startsWith("/users") || location.pathname === "/buyers";
  const [usersOpen, setUsersOpen] = useState(usersSectionActive);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [openSidebar, setOpenSidebar] = useState(false);
  const getCurrentDate = () => {
    const date = Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(
      new Date(),
    );
    return date;
  };

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

  return (
    <div className="flex h-screen overflow-hidden bg-global-bg gap-4 p-4">
      <button
        onClick={() => setOpenSidebar(true)}
        className="fixed left-5 top-5 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {openSidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpenSidebar(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-4 left-4 z-50 flex w-68 flex-col rounded-3xl bg-primary shadow-sm overflow-hidden transition-transform duration-300 md:static md:z-auto md:translate-x-0 ${openSidebar ? "translate-x-0" : "translate-x-[-120%]"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
            <img src={whiteLogo} alt="TradeConnect" className="h-10 w-auto" />
          </div>
          <div>
            <p className="text-xs font-medium text-white/60">TradeConnect</p>
            <h2 className="text-base font-semibold text-white leading-tight">
              Admin Portal
            </h2>
          </div>
        </div>

        {/* Nav */}
        <nav
          className="flex-1 overflow-y-auto px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.children) {
              const open = usersOpen || usersSectionActive;
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setUsersOpen((prev) => !prev)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition ${
                      usersSectionActive
                        ? "bg-white/10 text-white shadow"
                        : "text-white/50 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  {open && (
                    <div className="mt-1 ml-6 space-y-0.5 border-l border-white/15 pl-4">
                      {item.children.map((child) => {
                        const active = location.pathname === child.path;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                              active
                                ? "text-white"
                                : "text-white/40 hover:text-white"
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const active = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path!}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition ${
                  active
                    ? "bg-white/10 text-white shadow"
                    : "text-white/50 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom — Settings & Logout pushed to bottom */}
        <div className="mt-auto border-t border-white/10 px-4 py-4">
          <p className="mb-3 px-2 text-[10px] uppercase tracking-[0.25em] text-white/30">
            Manage
          </p>
          <button className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white transition">
            <span>Settings</span>
            <Settings className="h-4 w-4" />
          </button>
          <Logout />
        </div>
      </aside>

      {/* Main content — fills remaining width, independently scrollable */}
      <div className="flex flex-1 min-w-0 flex-col gap-4 overflow-y-auto py-4 pr-4">
        {/* Header */}
        {compact ? (
          <div className="flex shrink-0 items-center justify-between rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
            <p className="text-sm text-slate-500">{breadcrumb}</p>
            <div className="flex items-center gap-4">
              <button className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100">
                <Bell className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <Avatar name={user?.name ?? ""} />
                <div className="text-sm">
                  <p className="font-medium text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.account_code}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex shrink-0 flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-500">{breadcrumb}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                {title}
              </h1>
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                <CalendarDays className="mr-2 inline-block h-4 w-4" />
                {getCurrentDate()}
              </button>
              <button
                onClick={onNotificationsClick}
                className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
              >
                <Bell className="mr-2 inline-block h-4 w-4" />
                Notifications
              </button>
            </div>
          </div>
        )}

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
