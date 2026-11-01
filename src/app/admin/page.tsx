
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  ShieldCheck,
  Activity,
  ArrowUpRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function verifyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("nexora_admin_session")?.value;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!token || !sessionSecret) {
    return false;
  }

  try {
    const secret = new TextEncoder().encode(sessionSecret);
    const { payload } = await jwtVerify(token, secret);

    return payload.role === "admin";
  } catch {
    return false;
  }
}

export default async function AdminDashboard() {
  const isAdmin = await verifyAdminSession();

  if (!isAdmin) {
    redirect("/admin/login");
  }

  const modules = [
    {
      title: "Activity Management",
      description: "Create, publish, edit and manage campus activities.",
      icon: CalendarDays,
      href: "/dashboard",
    },
    {
      title: "Student Management",
      description: "Manage student information and institutional directories.",
      icon: Users,
      href: null,
    },
    {
      title: "Registration Management",
      description: "Review and manage student activity registrations.",
      icon: ClipboardList,
      href: null,
    },
    {
      title: "Institution Settings",
      description: "Manage institutional configuration and preferences.",
      icon: Settings,
      href: null,
    },
  ];

  return (
    <main className="min-h-screen bg-[#080D19] text-white">
      <header className="border-b border-[#E5DEC9] bg-[#101827]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xl font-black tracking-widest text-cyan-400">
              KRIYALAYA
            </p>
            <p className="text-xs tracking-wider text-[#81796E]">
              ADMINISTRATION PORTAL
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ShieldCheck className="text-cyan-400" size={20} />
            <span className="hidden text-sm text-[#2B1E1F] sm:inline">
              Administrator
            </span>

            <form action="/api/admin/logout" method="POST">
              <button
                type="submit"
                className="ml-3 flex items-center gap-2 rounded-lg border border-[#E5DEC9] px-4 py-2 text-sm transition hover:border-cyan-400 hover:text-cyan-400"
              >
                <LogOut size={16} />
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-widest text-cyan-400">
            <LayoutDashboard size={18} />
            ADMIN COMMAND CENTER
          </div>

          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
            Institution Overview
          </h1>

          <p className="mt-3 text-[#81796E]">
            Manage your institution's campus activities from one central place.
          </p>
        </div>

        <div className="mb-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Total Activities",
            "Registered Students",
            "Pending Approvals",
            "Active Coordinators",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[#E5DEC9] bg-[#111827] p-6"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#81796E]">{item}</p>
                <Activity size={18} className="text-cyan-400" />
              </div>

              <p className="mt-5 text-3xl font-bold text-cyan-400">—</p>

              <p className="mt-2 text-xs text-slate-500">
                Statistics integration coming next
              </p>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            Administration Modules
          </h2>
          <p className="mt-2 text-sm text-[#81796E]">
            Access and manage the core areas of KRIYALAYA.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <div
                key={module.title}
                className="rounded-2xl border border-[#E5DEC9] bg-[#111827] p-7 transition hover:border-cyan-400/40 hover:bg-[#142033]"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3">
                    <Icon size={25} className="text-cyan-400" />
                  </div>

                  {module.href && (
                    <ArrowUpRight size={20} className="text-slate-500" />
                  )}
                </div>

                <h3 className="text-lg font-semibold">
                  {module.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#81796E]">
                  {module.description}
                </p>

                {module.href ? (
                  <a
                    href={module.href}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    Open Module <ArrowUpRight size={15} />
                  </a>
                ) : (
                  <p className="mt-6 text-xs font-semibold tracking-wider text-slate-500">
                    MODULE — COMING SOON
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-cyan-400" size={22} />
            <h2 className="font-semibold">Secure Administration</h2>
          </div>

          <p className="mt-3 text-sm leading-6 text-[#81796E]">
            This area is protected by KRIYALAYA administrator authentication.
            Only users with a valid administrator session can access it.
          </p>
        </div>

        <footer className="mt-12 border-t border-[#E5DEC9] pt-6 text-center text-xs text-slate-500">
          KRIYALAYA — Omnia Fluentia. Connect. Coordinate. Create.
        </footer>
      </section>
    </main>
  );
}
