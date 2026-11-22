import type { Metadata } from "next";
import AdminPanel from "@/components/admin/AdminPanel";

export const metadata: Metadata = { title: "Studio admin", robots: { index: false, follow: false } };
export default function AdminPage() { return <div className="min-h-[70vh] bg-pale-blush"><div className="mx-auto w-full max-w-[1400px] px-5 py-10 md:px-10"><AdminPanel /></div></div>; }
