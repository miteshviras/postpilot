"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { AccountBadge } from "@/components/AccountBadge";
import { 
  UploadCloud, 
  Send, 
  AlertCircle, 
  X, 
  Clock 
} from "lucide-react";
import Link from "next/link";

interface TikTokAccount {
  id: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  followerCount: number;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
}

interface UploadedVideo {
  id: string;
  originalName: string;
  publicUrl: string;
  sizeBytes: number;
  mimeType: string;
}

export default function ComposerPage() {
  const router = useRouter();

  // State
  const [accounts, setAccounts] = useState<TikTokAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  // Video State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  // Caption State
  const [defaultCaption, setDefaultCaption] = useState("");
  const [customizePerAccount, setCustomizePerAccount] = useState(false);
  const [customCaptions, setCustomCaptions] = useState<Record<string, string>>({});

  // Scheduling State
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");

  // Submitting State
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch accounts on mount
  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await fetch("/api/accounts");
        const data = await res.json();
        if (data.success && data.accounts) {
          setAccounts(data.accounts);
          // By default, select all active accounts
          const activeIds = data.accounts
            .filter((a: TikTokAccount) => a.status === "ACTIVE")
            .map((a: TikTokAccount) => a.id);
          setSelectedAccountIds(activeIds);
        }
      } catch (err: unknown) {
        console.error("Failed to load accounts", err);
      } finally {
        setIsLoadingAccounts(false);
      }
    }
    loadAccounts();
  }, []);

  // Handle Drag & Drop / File Select
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("video/") && !file.name.match(/\.(mp4|mov|webm)$/i)) {
      setErrorMessage("Please select a valid video file (.mp4, .mov, .webm)");
      return;
    }

    setErrorMessage(null);
    setVideoFile(file);
    const localUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(localUrl);

    // Auto-upload
    try {
      setIsUploading(true);
      setUploadProgress(20);

      const formData = new FormData();
      formData.append("video", file);

      // Simulating progress step
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 200);

      const res = await fetch("/api/videos", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      const data = await res.json();
      if (data.success && data.videoAsset) {
        setUploadedVideo(data.videoAsset);
      } else {
        setErrorMessage(data.error || "Video upload failed");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload video asset";
      setErrorMessage(message);
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle account selection
  const toggleAccount = (id: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all / Deselect all
  const selectAll = () => {
    setSelectedAccountIds(accounts.map((a) => a.id));
  };
  const deselectAll = () => {
    setSelectedAccountIds([]);
  };

  // Dispatch Publish Job
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedVideo) {
      setErrorMessage("Please upload a video first.");
      return;
    }
    if (selectedAccountIds.length === 0) {
      setErrorMessage("Please select at least one TikTok account.");
      return;
    }
    if (!defaultCaption.trim()) {
      setErrorMessage("Please enter a caption.");
      return;
    }

    try {
      setIsPublishing(true);
      setErrorMessage(null);

      const payload = {
        videoAssetId: uploadedVideo.id,
        accountIds: selectedAccountIds,
        defaultCaption: defaultCaption.trim(),
        customCaptions: customizePerAccount ? customCaptions : undefined,
        scheduledFor: isScheduled && scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
      };

      const res = await fetch("/api/publish-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.publishJobId) {
        // Navigate directly to the Job Progress Screen
        router.push(`/jobs/${data.publishJobId}`);
      } else {
        setErrorMessage(data.error || "Failed to create publish job.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to dispatch publish jobs.";
      setErrorMessage(message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar
          title="Bulk Publish Composer"
          subtitle="Publish one video to multiple TikTok accounts in a single workflow"
        />

        <form onSubmit={handlePublish} className="p-8 max-w-6xl w-full mx-auto space-y-8">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-rose-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="text-sm font-medium">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-xs opacity-75 hover:opacity-100 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Video & Caption (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Step 1: Video Upload Area */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#fe2c55]/20 text-[#fe2c55] font-bold text-xs flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-sm font-semibold text-white">Video Asset</h3>
                  </div>
                  {uploadedVideo && (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedVideo(null);
                        setVideoPreviewUrl(null);
                        setVideoFile(null);
                      }}
                      className="text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {!videoPreviewUrl ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.[0]) {
                        handleFileSelect(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-800 hover:border-[#fe2c55]/60 hover:bg-[#fe2c55]/5 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileSelect(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 group-hover:scale-105 group-hover:bg-[#fe2c55]/10 text-zinc-400 group-hover:text-[#fe2c55] flex items-center justify-center mx-auto mb-3 transition-all duration-200">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-white">
                      Drag & drop your TikTok video here, or{" "}
                      <span className="text-[#fe2c55]">browse files</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">MP4, MOV, or WEBM up to 100MB • 9:16 recommended</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-[9/16] max-h-[380px] mx-auto rounded-xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center">
                      <video
                        src={videoPreviewUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-950 p-3 rounded-xl border border-zinc-800/60">
                      <span className="truncate max-w-[240px] font-medium text-zinc-200">
                        {videoFile?.name || uploadedVideo?.originalName}
                      </span>
                      <span>
                        {uploadedVideo
                          ? `${(uploadedVideo.sizeBytes / (1024 * 1024)).toFixed(2)} MB`
                          : "Uploading..."}
                      </span>
                    </div>

                    {isUploading && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-zinc-400">
                          <span>Uploading video asset...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <progress
                          className="w-full h-1.5 rounded-full overflow-hidden"
                          value={uploadProgress}
                          max={100}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Caption & Hashtags */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#fe2c55]/20 text-[#fe2c55] font-bold text-xs flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-sm font-semibold text-white">Post Caption</h3>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    {defaultCaption.length} / 2200
                  </span>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={defaultCaption}
                    onChange={(e) => setDefaultCaption(e.target.value)}
                    placeholder="Write a caption with hooks, mentions, and hashtags... #fyp #viral"
                    maxLength={2200}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#fe2c55] transition-colors resize-none"
                  />

                  {/* Quick Hashtags */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {["#trending", "#fyp", "#viral", "#creator", "#reels", "#explore"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setDefaultCaption((prev) => `${prev} ${tag}`.trim())}
                        className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Per-Account Customization Toggle */}
                <div className="pt-2 border-t border-zinc-800/60">
                  <label className="flex items-center gap-2 text-xs font-medium text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customizePerAccount}
                      onChange={(e) => setCustomizePerAccount(e.target.checked)}
                      className="rounded border-zinc-700"
                    />
                    <span>Customize caption per account (optional)</span>
                  </label>

                  {customizePerAccount && (
                    <div className="mt-3 space-y-3">
                      {accounts
                        .filter((a) => selectedAccountIds.includes(a.id))
                        .map((acc) => (
                          <div key={acc.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                            <span className="text-xs font-semibold text-[#fe2c55]">{acc.displayName}</span>
                            <textarea
                              rows={2}
                              value={customCaptions[acc.id] || ""}
                              onChange={(e) =>
                                setCustomCaptions((prev) => ({ ...prev, [acc.id]: e.target.value }))
                              }
                              placeholder={`Specific caption for ${acc.displayName} (leave empty to use default)`}
                              className="mt-1.5 w-full bg-transparent border-0 text-xs text-white placeholder-zinc-600 focus:outline-none"
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Target Accounts & Scheduling (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Step 3: Target Accounts Selection */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#fe2c55]/20 text-[#fe2c55] font-bold text-xs flex items-center justify-center">
                      3
                    </span>
                    <h3 className="text-sm font-semibold text-white">Target Accounts</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-[#fe2c55] hover:underline cursor-pointer"
                    >
                      Select all
                    </button>
                    <span className="text-zinc-600">•</span>
                    <button
                      type="button"
                      onClick={deselectAll}
                      className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      None
                    </button>
                  </div>
                </div>

                {isLoadingAccounts ? (
                  <div className="py-8 text-center text-xs text-zinc-500">Loading accounts...</div>
                ) : accounts.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl">
                    <p className="text-xs text-zinc-400 mb-3">No TikTok accounts connected yet.</p>
                    <Link
                      href="/accounts"
                      className="inline-block text-xs bg-[#fe2c55] text-white font-semibold px-3 py-1.5 rounded-lg"
                    >
                      Connect Accounts
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {accounts.map((acc) => {
                      const isSelected = selectedAccountIds.includes(acc.id);
                      return (
                        <label
                          key={acc.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#fe2c55]/10 border-[#fe2c55]/40 text-white"
                              : "bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAccount(acc.id)}
                              className="rounded border-zinc-700"
                            />
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                              {acc.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={acc.avatarUrl}
                                  alt={acc.displayName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                                  {acc.displayName.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-white">{acc.displayName}</div>
                              <div className="text-[11px] text-zinc-500">{acc.handle}</div>
                            </div>
                          </div>

                          <AccountBadge status={acc.status} />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 4: Schedule Settings */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-sm font-semibold text-white">Publish Schedule</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#fe2c55]"></div>
                  </label>
                </div>

                {isScheduled && (
                  <div className="pt-2 space-y-2">
                    <label className="block text-xs font-medium text-zinc-400">Select Date & Time</label>
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      required={isScheduled}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#fe2c55]"
                    />
                    <p className="text-[11px] text-zinc-500">
                      Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </p>
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isPublishing || isUploading || selectedAccountIds.length === 0}
                className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all duration-200 cursor-pointer ${
                  isPublishing || isUploading || selectedAccountIds.length === 0
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#fe2c55] to-[#ff0050] text-white hover:opacity-95 shadow-[#fe2c55]/25 hover:shadow-2xl hover:scale-[1.01]"
                }`}
              >
                <Send className="w-4 h-4" />
                <span>
                  {isPublishing
                    ? "Dispatching Jobs..."
                    : isScheduled
                    ? `Schedule Bulk Post (${selectedAccountIds.length} accounts)`
                    : `Publish Now to ${selectedAccountIds.length} Account${selectedAccountIds.length > 1 ? "s" : ""}`}
                </span>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
