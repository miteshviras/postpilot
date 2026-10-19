import { test, describe } from "node:test";
import assert from "node:assert";
import { saveVideoFile, getVideoBuffer, deleteVideoFile } from "../lib/storage";

describe("Video Storage Pipeline", () => {
  test("saves and retrieves video buffer", async () => {
    const dummyBuffer = Buffer.from("dummy video content for unit testing");
    const filename = "test_clip.mp4";

    const stored = await saveVideoFile(dummyBuffer, filename, "video/mp4");
    assert.ok(stored.storageKey);
    assert.strictEqual(stored.originalName, filename);
    assert.strictEqual(stored.sizeBytes, dummyBuffer.length);
    assert(stored.publicUrl.startsWith("/uploads/"));

    const retrievedBuffer = await getVideoBuffer(stored.storageKey);
    assert.strictEqual(retrievedBuffer.toString(), dummyBuffer.toString());

    // Cleanup
    await deleteVideoFile(stored.storageKey);
  });
});
