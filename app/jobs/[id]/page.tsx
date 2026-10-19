"use client";

import { useEffect, useState, use, useCallback, Suspense } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { ProgressRing } from "@/components/ProgressRing";
import { 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Send
} from "lucide-react";

interface JobItem {
  id: string;
  accountId: string;
  status: "PENDING" | "UPLOADING" | "PROCESSING" | "PUBLISHED" | "FAILED";
  tiktokPublishId: string | null;
  tiktokShareId: string | null;
  errorMessage: string | null;
  attemptCount: number;
  publishedAt: string | null;
  account: {
    id: string;
    displayName: string;
    handle: string;
    avatarUrl: string | null;
  };
}

interface PublishJobDetails {
  id: string;
  defaultCaption: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "PARTIAL_SUCCESS" | "FAILED";
  scheduledAt: string | null;
  totalAccounts: number;
  publishedCount: number;
  failedCount: number;
  processingCount: number;
  progressPercent: number;
  isCompleted: boolean;
  createdAt: string;
  videoAsset: {
    originalName: string;
    publicUrl: string;
    sizeBytes: number;
  };
  items: JobItem[];
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-zinc-950 text-zinc-100 items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#fe2c55]" />
        </div>
      }
    >
      <JobDetailContent params={params} />
    </Suspense>
  );
}

function JobDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;

  const [job, setJob] = useState<PublishJobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/publish-jobs/${jobId}`);
      const data = await res.json();
      if (data.success && data.job) {
        setJob(data.job);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch job", err);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  // Poll for real-time progress while active
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (active) {
        await fetchJob();
      }
    };
    load();

    const interval = setInterval(() => {
      fetchJob();
    }, 2500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fetchJob]);

  const handleRetryFailed = async () => {
    try {
      setIsRetrying(true);
      setNotification(null);

      const res = await fetch(`/api/publish-jobs/${jobId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success) {
        setNotification({ type: "success", message: data.message || "Retry dispatched!" });
        fetchJob();
      } else {
        setNotification({ type: "error", message: data.error || data.message || "Retry failed." });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to retry";
      setNotification({ type: "error", message });
    } finally {
      setIsRetrying(false);
    }
  };

  const getItemBadge = (status: JobItem["status"]) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Published
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      case "PROCESSING":
      case "UPLOADING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fe2c55]/15 text-[#fe2c55] border border-[#fe2c55]/30">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            {status === "UPLOADING" ? "Uploading" : "Processing"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar
          title="Job Progress Monitor"
          subtitle={`Tracking bulk publish dispatch • Batch ${jobId.slice(0, 8)}`}
        />

        <div className="p-8 max-w-6xl w-full mx-auto space-y-8">
          {notification && (
            <div
              className={`p-4 rounded-2xl flex items-center justify-between border ${
                notification.type === "success"
                  ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-200"
                  : "bg-rose-950/40 border-rose-800/50 text-rose-200"
              }`}
            >
              <span className="text-sm font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="text-xs opacity-75 hover:opacity-100 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {isLoading || !job ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-[#fe2c55]" />
              <p className="text-sm">Fetching job status...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Progress Summary Hero Banner */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  {/* Progress Ring (4 cols) */}
                  <div className="md:col-span-4 flex justify-center">
                    <ProgressRing
                      progress={job.progressPercent}
                      size={160}
                      strokeWidth={12}
                      sublabel={job.isCompleted ? "Completed" : "In Progress"}
                    />
                  </div>

                  {/* Summary & Counters (8 cols) */}
                  <div className="md:col-span-8 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Bulk Publish Status
                      </span>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                          job.status === "COMPLETED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : job.status === "PARTIAL_SUCCESS"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : job.status === "FAILED"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-[#fe2c55]/20 text-[#fe2c55] border border-[#fe2c55]/30 animate-pulse"
                        }`}
                      >
                        {job.status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-base text-zinc-200 line-clamp-2 italic font-serif">
                      &ldquo;{job.defaultCaption}&rdquo;
                    </p>

                    <div className="grid grid-cols-4 gap-3 pt-2">
                      <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-center">
                        <span className="text-[11px] text-zinc-400 block">Total</span>
                        <span className="text-xl font-bold text-white">{job.totalAccounts}</span>
                      </div>
                      <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-center">
                        <span className="text-[11px] text-zinc-400 block">Published</span>
                        <span className="text-xl font-bold text-emerald-400">{job.publishedCount}</span>
                      </div>
                      <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-center">
                        <span className="text-[11px] text-zinc-400 block">Processing</span>
                        <span className="text-xl font-bold text-[#25f4ee]">{job.processingCount}</span>
                      </div>
                      <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-center">
                        <span className="text-[11px] text-zinc-400 block">Failed</span>
                        <span className="text-xl font-bold text-rose-400">{job.failedCount}</span>
                      </div>
                    </div>

                    {/* Retry Button if any failed */}
                    {job.failedCount > 0 && (
                      <div className="pt-2 flex items-center gap-4">
                        <button
                          onClick={handleRetryFailed}
                          disabled={isRetrying}
                          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-rose-600/20 cursor-pointer"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                          <span>Retry Failed Accounts ({job.failedCount})</span>
                        </button>
                        <span className="text-xs text-zinc-400">
                          Retries run with automatic exponential backoff.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Per-Account Item Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Per-Account Publishing Status</h3>
                  <span className="text-xs text-zinc-500">Live auto-refresh enabled</span>
                </div>

                <div className="space-y-3">
                  {job.items.map((item) => {
                    const isErrorExpanded = expandedErrorId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 transition-colors hover:border-zinc-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                              {item.account.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.account.avatarUrl}
                                  alt={item.account.displayName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-zinc-400 text-xs">
                                  {item.account.displayName.charAt(0)}
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">
                                  {item.account.displayName}
                                </span>
                                <span className="text-xs text-zinc-500">{item.account.handle}</span>
                              </div>
                              <div className="text-xs text-zinc-400 mt-0.5">
                                {item.tiktokPublishId ? (
                                  <span className="font-mono text-[11px] text-zinc-500">
                                    Publish ID: {item.tiktokPublishId}
                                  </span>
                                ) : (
                                  <span>Awaiting dispatch...</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {getItemBadge(item.status)}

                            {item.status === "FAILED" && item.errorMessage && (
                              <button
                                onClick={() =>
                                  setExpandedErrorId(isErrorExpanded ? null : item.id)
                                }
                                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                              >
                                <span>Details</span>
                                {isErrorExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            {item.status === "PUBLISHED" && (
                              <span className="text-xs text-zinc-400">
                                {item.publishedAt
                                  ? new Date(item.publishedAt).toLocaleTimeString()
                                  : "Completed"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Error details expandable drawer */}
                        {isErrorExpanded && item.errorMessage && (
                          <div className="mt-3 p-3 rounded-xl bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300 font-mono">
                            <span className="font-semibold block text-rose-200 mb-1">
                              TikTok Provider Error:
                            </span>
                            {item.errorMessage}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <Link
                  href="/composer"
                  className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Create Another Bulk Post</span>
                </Link>
                <Link
                  href="/history"
                  className="flex items-center gap-2 text-xs font-semibold text-[#fe2c55] hover:underline"
                >
                  <span>View Full Post History</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
