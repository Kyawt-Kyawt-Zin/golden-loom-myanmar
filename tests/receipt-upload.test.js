import test from "node:test";
import assert from "node:assert/strict";
import { submitExistingOrderReceipt } from "../src/helper/receipt-upload.js";

test("an explicit S3 driver skips the local upload", async () => {
  const value = await submitExistingOrderReceipt({ driver: "s3", submitLocal: () => { throw new Error("unexpected local upload"); }, submitS3: async () => "uploaded" });
  assert.equal(value, "uploaded");
});

test("the explicit local-disabled response retries with S3", async () => {
  const disabled = Object.assign(new Error("Local uploads are disabled while S3 media mode is enabled"), { status: 409 });
  let calls = 0;
  const value = await submitExistingOrderReceipt({ submitLocal: async () => { throw disabled; }, submitS3: async () => { calls++; return "uploaded"; } });
  assert.equal(value, "uploaded"); assert.equal(calls, 1);
});

test("other upload failures do not trigger a second upload", async () => {
  const original = Object.assign(new Error("network failed"), { status: 500 });
  let calls = 0;
  await assert.rejects(submitExistingOrderReceipt({ submitLocal: async () => { throw original; }, submitS3: async () => { calls++; } }), (error) => error === original);
  assert.equal(calls, 0);
});
