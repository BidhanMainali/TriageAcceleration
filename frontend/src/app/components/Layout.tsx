import { Outlet, Link, useLocation } from "react-router";
import { Activity, Users, LayoutDashboard, UserCircle } from "lucide-react";
import { cn } from "./ui/utils";
import { Button } from "./ui/button";

export default function Layout() {
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Patient Queue", href: "/queue", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Activity className="size-6 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-900">TriageAssist</h1>
                <p className="text-sm text-slate-600">Doctor Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/patient">
                <Button variant="outline" size="sm">
                  <UserCircle className="size-4 mr-2" />
                  Patient Portal
                </Button>
              </Link>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">Dr. Sarah Chen</p>
                <p className="text-xs text-slate-600">Emergency Medicine</p>
              </div>
              <div className="size-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="font-medium text-blue-700">SC</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="px-6">
          <div className="flex gap-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors",
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Icon className="size-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}