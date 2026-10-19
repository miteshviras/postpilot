/**
 * TikTok Content Posting API v2 Client
 * Supports both official TikTok Direct Post API and development simulator mode.
 */

const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/";
const TIKTOK_POST_INIT_URL = "https://open.tiktokapis.com/v2/post/publish/video/init/";
const TIKTOK_POST_STATUS_URL = "https://open.tiktokapis.com/v2/post/publish/status/fetch/";

export interface TikTokTokenResponse {
  openId: string;
  unionId?: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  scope: string;
}

export interface TikTokUserProfile {
  openId: string;
  unionId?: string;
  avatarUrl?: string;
  displayName: string;
  handle: string;
  followerCount?: number;
}

export interface TikTokPublishInitResponse {
  publishId: string;
  uploadUrl: string;
}

export interface TikTokPublishStatusResponse {
  status: "PROCESSING_DOWNLOAD" | "PROCESSING_UPLOAD" | "SUCCESS" | "FAILED";
  failReason?: string;
  shareId?: string;
}

/**
 * Builds the TikTok OAuth 2.0 Authorization URL
 */
export function getTikTokAuthUrl(state: string): string {
  const clientKey = process.env.TIKTOK_CLIENT_ID || "mock_client_key";
  const redirectUri = process.env.TIKTOK_REDIRECT_URI || "http://localhost:3000/api/auth/tiktok/callback";
  const scope = "user.info.basic,video.publish,video.upload";

  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: "code",
    scope: scope,
    redirect_uri: redirectUri,
    state: state,
  });

  return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchanges authorization code for access and refresh tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<TikTokTokenResponse> {
  const clientKey = process.env.TIKTOK_CLIENT_ID || "mock_client_key";
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET || "mock_secret";
  const redirectUri = process.env.TIKTOK_REDIRECT_URI || "http://localhost:3000/api/auth/tiktok/callback";

  // If using mock credentials or in mock flow, generate simulated response
  if (code.startsWith("mock_") || clientKey === "mock_client_key") {
    return {
      openId: `tt_${Date.now().toString(36)}`,
      unionId: `union_${Date.now().toString(36)}`,
      accessToken: `mock_access_token_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      expiresIn: 86400, // 24 hours
      refreshExpiresIn: 31536000, // 365 days
      scope: "user.info.basic,video.publish,video.upload",
    };
  }

  const response = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const data = await response.json();
  if (data.error || !data.data) {
    throw new Error(`TikTok OAuth exchange failed: ${data.error_description || data.message || JSON.stringify(data)}`);
  }

  return {
    openId: data.data.open_id,
    unionId: data.data.union_id,
    accessToken: data.data.access_token,
    refreshToken: data.data.refresh_token,
    expiresIn: data.data.expires_in,
    refreshExpiresIn: data.data.refresh_expires_in,
    scope: data.data.scope,
  };
}

/**
 * Refreshes an expired access token using refresh_token
 */
export async function refreshTikTokAccessToken(refreshToken: string): Promise<TikTokTokenResponse> {
  const clientKey = process.env.TIKTOK_CLIENT_ID || "mock_client_key";
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET || "mock_secret";

  if (refreshToken.startsWith("mock_") || clientKey === "mock_client_key") {
    return {
      openId: `tt_refreshed`,
      accessToken: `mock_refreshed_access_${Date.now()}`,
      refreshToken: `mock_refreshed_refresh_${Date.now()}`,
      expiresIn: 86400,
      refreshExpiresIn: 31536000,
      scope: "user.info.basic,video.publish,video.upload",
    };
  }

  const response = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();
  if (data.error || !data.data) {
    throw new Error(`TikTok token refresh failed: ${data.error_description || JSON.stringify(data)}`);
  }

  return {
    openId: data.data.open_id,
    accessToken: data.data.access_token,
    refreshToken: data.data.refresh_token,
    expiresIn: data.data.expires_in,
    refreshExpiresIn: data.data.refresh_expires_in,
    scope: data.data.scope,
  };
}

/**
 * Fetches user profile information from TikTok
 */
export async function getTikTokUserProfile(accessToken: string): Promise<TikTokUserProfile> {
  if (accessToken.startsWith("mock_")) {
    const randomSuffix = Math.floor(Math.random() * 900) + 100;
    return {
      openId: `mock_openid_${randomSuffix}`,
      displayName: `Creator Studio ${randomSuffix}`,
      handle: `@creator_${randomSuffix}`,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      followerCount: 12500 + randomSuffix * 10,
    };
  }

  const response = await fetch(`${TIKTOK_USER_INFO_URL}?fields=open_id,union_id,avatar_url,display_name`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  if (data.error || !data.data?.user) {
    throw new Error(`Failed to fetch TikTok user info: ${data.error_description || JSON.stringify(data)}`);
  }

  const user = data.data.user;
  return {
    openId: user.open_id,
    unionId: user.union_id,
    avatarUrl: user.avatar_url,
    displayName: user.display_name,
    handle: `@${user.display_name?.toLowerCase().replace(/\s+/g, "_") || "user"}`,
  };
}

/**
 * Initiates direct video post on TikTok
 */
export async function initTikTokVideoPost(
  accessToken: string,
  caption: string,
  videoSizeBytes: number
): Promise<TikTokPublishInitResponse> {
  if (accessToken.startsWith("mock_")) {
    return {
      publishId: `v_pub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      uploadUrl: `http://localhost:3000/api/mock/tiktok/upload`,
    };
  }

  const response = await fetch(TIKTOK_POST_INIT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: {
        title: caption,
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000,
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: videoSizeBytes,
        chunk_size: videoSizeBytes,
        total_chunk_count: 1,
      },
    }),
  });

  const data = await response.json();
  if (data.error || !data.data) {
    throw new Error(`Failed to initialize TikTok publish: ${data.error?.message || JSON.stringify(data)}`);
  }

  return {
    publishId: data.data.publish_id,
    uploadUrl: data.data.upload_url,
  };
}

/**
 * Uploads video buffer to TikTok upload URL
 */
export async function uploadVideoToTikTokUrl(
  uploadUrl: string,
  videoBuffer: Buffer
): Promise<void> {
  if (uploadUrl.includes("mock")) {
    // Simulator delay
    await new Promise((res) => setTimeout(res, 300));
    return;
  }

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": videoBuffer.length.toString(),
      "Content-Range": `bytes 0-${videoBuffer.length - 1}/${videoBuffer.length}`,
    },
    body: new Uint8Array(videoBuffer),
  });

  if (!response.ok) {
    throw new Error(`Failed to upload video chunk to TikTok: HTTP ${response.status} ${response.statusText}`);
  }
}

/**
 * Checks publication status on TikTok
 */
export async function checkTikTokPublishStatus(
  accessToken: string,
  publishId: string
): Promise<TikTokPublishStatusResponse> {
  if (accessToken.startsWith("mock_")) {
    return {
      status: "SUCCESS",
      shareId: `share_${publishId}`,
    };
  }

  const response = await fetch(TIKTOK_POST_STATUS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      publish_id: publishId,
    }),
  });

  const data = await response.json();
  if (data.error || !data.data) {
    throw new Error(`Failed to check TikTok status: ${data.error?.message || JSON.stringify(data)}`);
  }

  return {
    status: data.data.status,
    failReason: data.data.fail_reason,
    shareId: data.data.publicaly_available_post_id?.[0],
  };
}
