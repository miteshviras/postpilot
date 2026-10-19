import { test, describe } from "node:test";
import assert from "node:assert";
import { encryptToken, decryptToken } from "../lib/crypto";

describe("Token Encryption & Decryption (AES-256-GCM)", () => {
  test("successfully encrypts and decrypts OAuth token", () => {
    const originalToken = "act.e1a2b3c4d5e6f7g8h9_tiktok_token_secret_123456";
    const encrypted = encryptToken(originalToken);

    assert.notStrictEqual(encrypted, originalToken);
    assert.strictEqual(encrypted.split(":").length, 3, "Payload should have iv:tag:ciphertext structure");

    const decrypted = decryptToken(encrypted);
    assert.strictEqual(decrypted, originalToken);
  });

  test("returns empty string when input is empty", () => {
    assert.strictEqual(encryptToken(""), "");
    assert.strictEqual(decryptToken(""), "");
  });

  test("produces different ciphertext for repeated calls (random IV)", () => {
    const token = "secret_sample_token";
    const enc1 = encryptToken(token);
    const enc2 = encryptToken(token);

    assert.notStrictEqual(enc1, enc2);
    assert.strictEqual(decryptToken(enc1), token);
    assert.strictEqual(decryptToken(enc2), token);
  });

  test("throws error if payload is corrupted or tampered", () => {
    const token = "valid_token";
    const encrypted = encryptToken(token);
    const parts = encrypted.split(":");
    // Tamper with ciphertext
    const corrupted = `${parts[0]}:${parts[1]}:${parts[2].slice(0, -2)}aa`;

    assert.throws(() => {
      decryptToken(corrupted);
    });
  });
});
