import {
  Bell,
  ClipboardList,
  LayoutGrid,
  MessageSquare,
  Settings,
  ShoppingBag,
  Menu,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Avatar from "./Avatar";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../lib/services/auth.service";
import { getErrorMessage } from "../lib/getErrorMessage";
import type { AuthUser } from "../lib/types/auth";
import { useCart } from "../Buyers/CartContext";
import CartDrawer from "../Buyers/CartDrawer";
import Logout from "./Logout";
import whiteLogo from "../assets/TradeConnnect1-04.png";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const navItems: NavItem[] = [
  { label: "Marketplace", icon: LayoutGrid, path: "/marketplace" },
  { label: "Orders", icon: ClipboardList, path: "/marketplace/orders" },
  { label: "Disputes", icon: MessageSquare, path: "/marketplace/disputes" },
];

export default function BuyerLayout({
  children,
  breadcrumb,
}: {
  children: React.ReactNode;
  breadcrumb?: string;
}) {
  const location = useLocation();
  const [buyer, setBuyer] = useState<AuthUser | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);
  const { count } = useCart();

  useEffect(() => {
    setOpenSidebar(false);
  }, [location.pathname]);

  useEffect(() => {
    const getBuyer = async () => {
      try {
        const response = await getCurrentUser();
        setBuyer(response);
      } catch (err) {
        getErrorMessage(err);
      }
    };
    getBuyer();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-global-bg gap-4 p-4">
      <button
        className="fixed left-5 top-5 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg md:hidden"
        onClick={() => setOpenSidebar(true)}
      >
        <Menu className="h-5 w-5"></Menu>
      </button>

      {openSidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpenSidebar(false)}
        ></div>
      )}
      {/* Sidebar — fixed width, full height */}
      <aside  className={`fixed inset-y-4 left-4 z-50 flex w-68 flex-col rounded-3xl bg-primary shadow-sm overflow-hidden transition-transform duration-300 md:static md:z-auto md:translate-x-0 ${openSidebar ? "translate-x-0" : "translate-x-[-120%]"}`}>
        <div className="flex items-center gap-3 px-6 pt-6 pb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
            <img src={whiteLogo} alt="TradeConnect" className="h-10 w-auto" />
          </div>
          <div>
            <p className="text-xs font-medium text-white/60">TradeConnect</p>
            <h2 className="text-base font-semibold text-white leading-tight">
              Buyer Portal
            </h2>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 px-4">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white shadow"
                    : "text-white/50 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom — Settings & Logout pushed to bottom */}
        <div className="mt-auto border-t border-white/10 px-4 py-4">
          <Link
            to="/marketplace/settings"
            className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium hover:text-white transition ${
              location.pathname === "/marketplace/settings"
                ? "bg-white/10 text-white"
                : "text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>Settings</span>
            <Settings className="h-4 w-4" />
          </Link>

          <Logout />
        </div>
      </aside>

      <div className="flex flex-1 min-w-0 flex-col gap-4 overflow-y-auto py-4 pr-4">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <p className="text-sm text-slate-600">{breadcrumb}</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
            >
              <ShoppingBag className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                  {count}
                </span>
              )}
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100">
              <Bell className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <Avatar name={buyer?.name ?? ""} />
              <div className="text-sm">
                <p className="font-medium text-slate-900">{buyer?.name}</p>
                <p className="text-xs text-slate-400">{buyer?.account_code}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        {children}
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
