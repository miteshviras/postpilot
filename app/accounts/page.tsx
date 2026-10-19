"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { AccountBadge } from "@/components/AccountBadge";
import { 
  Users, 
  Plus, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import Link from "next/link";

interface TikTokAccount {
  id: string;
  openId: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  followerCount: number;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  lastSyncAt: string | null;
  lastPublishAt: string | null;
  createdAt: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<TikTokAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(() => {
    if (typeof window === "undefined") return null;
    const searchParams = new URLSearchParams(window.location.search);
    const successMsg = searchParams.get("success");
    const errorMsg = searchParams.get("error");
    if (successMsg) return { type: "success", message: successMsg };
    if (errorMsg) return { type: "error", message: errorMsg };
    return null;
  });

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts);
      }
    } catch (err: unknown) {
      console.error("Failed to load accounts", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetch("/api/accounts");
        const data = await res.json();
        if (isMounted && data.success) {
          setAccounts(data.accounts);
        }
      } catch (err: unknown) {
        console.error("Failed to load accounts", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleConnectTikTok = async (mock = false) => {
    try {
      setIsConnecting(true);
      setNotification(null);

      const res = await fetch("/api/auth/tiktok/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mock }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.authUrl) {
          window.location.href = data.authUrl;
        } else if (data.mock) {
          setNotification({ type: "success", message: "Demo TikTok account connected successfully!" });
          fetchAccounts();
        }
      } else {
        setNotification({ type: "error", message: data.error || "Failed to initiate TikTok connection." });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect.";
      setNotification({ type: "error", message });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to disconnect ${name}?`)) return;

    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: "success", message: `Account disconnected.` });
        setAccounts((prev) => prev.filter((acc) => acc.id !== id));
      } else {
        setNotification({ type: "error", message: data.error || "Failed to disconnect." });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to disconnect.";
      setNotification({ type: "error", message });
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar
          title="Connected Accounts"
          subtitle="Manage authorized TikTok creators & profiles for bulk publishing"
          action={{
            label: "Connect TikTok Account",
            onClick: () => handleConnectTikTok(false),
            icon: Plus,
          }}
        />

        <div className="p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Notification Alert Banner */}
          {notification && (
            <div
              className={`p-4 rounded-2xl flex items-center justify-between border ${
                notification.type === "success"
                  ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-200"
                  : "bg-rose-950/40 border-rose-800/50 text-rose-200"
              }`}
            >
              <div className="flex items-center gap-3">
                {notification.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span className="text-sm font-medium">{notification.message}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-xs opacity-75 hover:opacity-100 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Quick Metrics & Mode Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-zinc-400">Total Accounts</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{accounts.length}</span>
                <span className="text-xs text-zinc-500">authorized</span>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-zinc-400">Active Status</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-400">
                  {accounts.filter((a) => a.status === "ACTIVE").length}
                </span>
                <span className="text-xs text-zinc-500">ready to post</span>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-xs font-medium text-zinc-400">Developer Testing</span>
              <button
                onClick={() => handleConnectTikTok(true)}
                disabled={isConnecting}
                className="mt-2 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold py-2 px-3 rounded-xl transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#25f4ee]" />
                <span>+ Connect Demo Account</span>
              </button>
            </div>
          </div>

          {/* Accounts Table / Cards */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-[#fe2c55]" />
              <p className="text-sm">Loading connected profiles...</p>
            </div>
          ) : accounts.length === 0 ? (
            /* Empty State */
            <div className="border border-dashed border-zinc-800 rounded-3xl p-12 text-center bg-zinc-900/20">
              <div className="w-16 h-16 rounded-2xl bg-[#fe2c55]/10 text-[#fe2c55] flex items-center justify-center mx-auto mb-4 border border-[#fe2c55]/20">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No TikTok Accounts Connected</h3>
              <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
                Connect your first TikTok account through OAuth or generate a demo account to start bulk publishing videos.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => handleConnectTikTok(false)}
                  disabled={isConnecting}
                  className="bg-[#fe2c55] hover:bg-[#e0264b] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-[#fe2c55]/20 cursor-pointer"
                >
                  Connect Official TikTok
                </button>
                <button
                  onClick={() => handleConnectTikTok(true)}
                  disabled={isConnecting}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  + Add Demo Account
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Authorized TikTok Creators</h3>
                <Link
                  href="/composer"
                  className="text-xs font-semibold text-[#fe2c55] hover:underline flex items-center gap-1"
                >
                  <span>Go to Bulk Composer</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="divide-y divide-zinc-800/60">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-5 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700/60 shrink-0">
                        {acc.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={acc.avatarUrl}
                            alt={acc.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold">
                            {acc.displayName.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{acc.displayName}</span>
                          <AccountBadge status={acc.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                          <span>{acc.handle}</span>
                          <span>•</span>
                          <span>{acc.followerCount.toLocaleString()} followers</span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block text-xs text-zinc-400">
                        <div>
                          Last sync:{" "}
                          <span className="text-zinc-300">
                            {acc.lastSyncAt ? new Date(acc.lastSyncAt).toLocaleDateString() : "Never"}
                          </span>
                        </div>
                        <div className="text-zinc-500 mt-0.5">
                          Last publish:{" "}
                          {acc.lastPublishAt ? new Date(acc.lastPublishAt).toLocaleDateString() : "None"}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDisconnect(acc.id, acc.displayName)}
                        className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                        title="Disconnect account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
