"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { 
  Activity, 
  Send, 
  RefreshCw, 
  ArrowRight 
} from "lucide-react";

interface JobSummary {
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
}

export default function JobsIndexPage() {
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      try {
        const res = await fetch("/api/publish-jobs");
        const data = await res.json();
        if (data.success && data.jobs) {
          setJobs(data.jobs);
        }
      } catch (err) {
        console.error("Failed to load jobs", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadJobs();
  }, []);

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar
          title="Job Monitor"
          subtitle="Real-time status of all bulk publishing workflows"
          action={{
            label: "New Bulk Post",
            href: "/composer",
            icon: Send,
          }}
        />

        <div className="p-8 max-w-6xl w-full mx-auto space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-[#fe2c55]" />
              <p className="text-sm">Loading job records...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-3xl p-12 text-center bg-zinc-900/20">
              <div className="w-16 h-16 rounded-2xl bg-[#fe2c55]/10 text-[#fe2c55] flex items-center justify-center mx-auto mb-4 border border-[#fe2c55]/20">
                <Activity className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Bulk Jobs Yet</h3>
              <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
                Start your first bulk publishing job from the composer to post a video across multiple TikTok accounts simultaneously.
              </p>
              <Link
                href="/composer"
                className="inline-flex items-center gap-2 bg-[#fe2c55] hover:bg-[#e0264b] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-[#fe2c55]/20"
              >
                <Send className="w-4 h-4" />
                <span>Go to Bulk Composer</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Showing {jobs.length} publish job(s)</span>
                <span>Click a job to monitor real-time progress</span>
              </div>

              <div className="space-y-3">
                {jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block bg-zinc-900/50 hover:bg-zinc-800/40 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-5 transition-all duration-150 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold shrink-0 border border-zinc-700/60 group-hover:border-[#fe2c55]/50 group-hover:text-[#fe2c55] transition-colors">
                          <Activity className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-semibold text-white text-sm line-clamp-1">
                              {job.defaultCaption || "Untitled bulk post"}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                job.status === "COMPLETED"
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                                  : job.status === "FAILED"
                                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                                  : job.status === "PARTIAL_SUCCESS"
                                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                                  : "bg-[#fe2c55]/15 text-[#fe2c55] border border-[#fe2c55]/25 animate-pulse"
                              }`}
                            >
                              {job.status.replace("_", " ")}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                            <span>{new Date(job.createdAt).toLocaleString()}</span>
                            <span>•</span>
                            <span>{job.totalAccounts} target account(s)</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-medium">
                              {job.successCount} succeeded
                            </span>
                            {job.failedCount > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-rose-400 font-medium">
                                  {job.failedCount} failed
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-400 group-hover:text-white transition-colors">
                        <span>View Details</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
