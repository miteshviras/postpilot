"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { 
  BarChart3, 
  Search, 
  Filter, 
  Send, 
  ExternalLink, 
  RefreshCw, 
  TrendingUp, 
  Film
} from "lucide-react";

interface JobHistoryItem {
  id: string;
  defaultCaption: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "PARTIAL_SUCCESS" | "FAILED";
  totalAccounts: number;
  successCount: number;
  failedCount: number;
  createdAt: string;
  videoAsset: {
    originalName: string;
    publicUrl: string;
    sizeBytes: number;
  };
  items: {
    id: string;
    status: string;
    account: {
      id: string;
      displayName: string;
      handle: string;
    };
  }[];
}

export default function HistoryPage() {
  const [jobs, setJobs] = useState<JobHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/publish-jobs");
        const data = await res.json();
        if (data.success && data.jobs) {
          setJobs(data.jobs);
        }
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesStatus = statusFilter === "ALL" || job.status === statusFilter;
    const matchesQuery =
      searchQuery === "" ||
      job.defaultCaption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.items.some((i) => i.account.displayName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesQuery;
  });

  // Calculate metrics
  const totalBatches = jobs.length;
  const totalPostAttempts = jobs.reduce((acc, j) => acc + j.totalAccounts, 0);
  const totalSuccess = jobs.reduce((acc, j) => acc + j.successCount, 0);
  const totalFailed = jobs.reduce((acc, j) => acc + j.failedCount, 0);
  const successRate = totalPostAttempts > 0 ? Math.round((totalSuccess / totalPostAttempts) * 100) : 100;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar
          title="History & Analytics"
          subtitle="Audit log of bulk publications and platform delivery performance"
          action={{
            label: "Create Bulk Post",
            href: "/composer",
            icon: Send,
          }}
        />

        <div className="p-8 max-w-6xl w-full mx-auto space-y-8">
          {/* Analytics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-zinc-400">Total Bulk Batches</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{totalBatches}</span>
                <span className="text-xs text-zinc-500">runs</span>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-zinc-400">Posts Published</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-400">{totalSuccess}</span>
                <span className="text-xs text-zinc-500">successful</span>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-zinc-400">Delivery Success Rate</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{successRate}%</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
              <span className="text-xs font-medium text-zinc-400">Failed Dispatches</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-400">{totalFailed}</span>
                <span className="text-xs text-zinc-500">errors</span>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by caption or account..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fe2c55]"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              {["ALL", "COMPLETED", "IN_PROGRESS", "PARTIAL_SUCCESS", "FAILED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                    statusFilter === status
                      ? "bg-[#fe2c55] text-white"
                      : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  {status === "ALL" ? "All Statuses" : status.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-[#fe2c55]" />
              <p className="text-sm">Loading post history...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-3xl p-12 text-center bg-zinc-900/20">
              <BarChart3 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white mb-1">No Matching Posts Found</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                No publish jobs match your filter criteria. Try clearing search or dispatching a new post.
              </p>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 text-zinc-400 font-semibold border-b border-zinc-800">
                    <tr>
                      <th className="py-3.5 px-5">Date & Time</th>
                      <th className="py-3.5 px-5">Caption & Video</th>
                      <th className="py-3.5 px-5">Target Creators</th>
                      <th className="py-3.5 px-5">Delivery Status</th>
                      <th className="py-3.5 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-zinc-800/30 transition-colors">
                        {/* Date */}
                        <td className="py-4 px-5 text-zinc-300 whitespace-nowrap">
                          <div>{new Date(job.createdAt).toLocaleDateString()}</div>
                          <div className="text-[11px] text-zinc-500">
                            {new Date(job.createdAt).toLocaleTimeString()}
                          </div>
                        </td>

                        {/* Caption & Video */}
                        <td className="py-4 px-5 max-w-xs">
                          <p className="font-medium text-white truncate">{job.defaultCaption}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                            <Film className="w-3 h-3 text-[#fe2c55]" />
                            <span className="truncate">{job.videoAsset.originalName}</span>
                          </div>
                        </td>

                        {/* Target Creators */}
                        <td className="py-4 px-5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {job.items.slice(0, 3).map((item) => (
                              <span
                                key={item.id}
                                className="bg-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded-md"
                              >
                                {item.account.displayName}
                              </span>
                            ))}
                            {job.items.length > 3 && (
                              <span className="text-[10px] text-zinc-500 self-center">
                                +{job.items.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                job.status === "COMPLETED"
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                                  : job.status === "FAILED"
                                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                                  : job.status === "PARTIAL_SUCCESS"
                                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                                  : "bg-[#fe2c55]/15 text-[#fe2c55] border border-[#fe2c55]/25"
                              }`}
                            >
                              {job.status.replace("_", " ")}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              {job.successCount}/{job.totalAccounts}
                            </span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="inline-flex items-center gap-1 text-[#fe2c55] hover:underline font-semibold text-xs"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
