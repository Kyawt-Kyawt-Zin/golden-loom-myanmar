import test from "node:test";
import assert from "node:assert/strict";
import { getCheckoutConfirmation } from "../src/helper/checkout-confirmation.js";

const inStock = { fulfillment_type: "in_stock" };
const preorder = (id) => ({ fulfillment_type: "preorder", deposit_payment_id: id });

test("in-stock checkout does not wait for a receipt", () => {
  const result = getCheckoutConfirmation([inStock], []);
  assert.equal(result.awaitingReceipt, false);
  assert.equal(result.allReceiptsSubmitted, false);
});

test("preorder and mixed checkout wait until the receipt is submitted", () => {
  const result = getCheckoutConfirmation([inStock, preorder(5)], []);
  assert.equal(result.awaitingReceipt, true);
  assert.equal(result.allReceiptsSubmitted, false);
});

test("a preorder receipt changes the checkout to the thank-you state", () => {
  const result = getCheckoutConfirmation([preorder(5)], [5]);
  assert.equal(result.awaitingReceipt, false);
  assert.equal(result.allReceiptsSubmitted, true);
});

test("all preorder receipts must be submitted, including missing payment IDs", () => {
  assert.equal(getCheckoutConfirmation([preorder(5), preorder(6)], [5]).awaitingReceipt, true);
  assert.equal(getCheckoutConfirmation([preorder(5), preorder(null)], [5]).awaitingReceipt, true);
  assert.equal(getCheckoutConfirmation([preorder(5), preorder(6)], [5, 6]).allReceiptsSubmitted, true);
});
