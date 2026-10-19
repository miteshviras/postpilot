import { test, describe } from "node:test";
import assert from "node:assert";
import { 
  getTikTokAuthUrl, 
  exchangeCodeForTokens, 
  initTikTokVideoPost, 
  checkTikTokPublishStatus 
} from "../lib/tiktok";

describe("TikTok API Client & Simulator", () => {
  test("generates valid TikTok OAuth authorize URL with state", () => {
    const state = "test_state_12345";
    const authUrl = getTikTokAuthUrl(state);

    assert(authUrl.startsWith("https://www.tiktok.com/v2/auth/authorize/"));
    assert(authUrl.includes("state=test_state_12345"));
    assert(authUrl.includes("response_type=code"));
    assert(authUrl.includes("user.info.basic"));
    assert(authUrl.includes("video.publish"));
  });

  test("exchanges code in simulator mode", async () => {
    const mockCode = "mock_authorization_code_abc";
    const tokens = await exchangeCodeForTokens(mockCode);

    assert.ok(tokens.accessToken);
    assert.ok(tokens.refreshToken);
    assert.strictEqual(tokens.expiresIn, 86400);
    assert(tokens.accessToken.startsWith("mock_access_token_"));
  });

  test("initializes direct post in simulator mode", async () => {
    const mockAccessToken = "mock_access_token_123";
    const result = await initTikTokVideoPost(mockAccessToken, "Test caption #fyp", 1024 * 1024);

    assert.ok(result.publishId);
    assert(result.publishId.startsWith("v_pub_"));
    assert.ok(result.uploadUrl);
  });

  test("verifies publication status in simulator mode", async () => {
    const mockAccessToken = "mock_access_token_123";
    const status = await checkTikTokPublishStatus(mockAccessToken, "v_pub_sample_123");

    assert.strictEqual(status.status, "SUCCESS");
    assert.strictEqual(status.shareId, "share_v_pub_sample_123");
  });
});
