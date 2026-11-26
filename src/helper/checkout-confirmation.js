export const getCheckoutConfirmation = (orders, submittedDepositIds) => {
  const preorderOrders = orders.filter(
    (order) => order.fulfillment_type === "preorder",
  );
  const allReceiptsSubmitted =
    preorderOrders.length > 0 &&
    preorderOrders.every(
      (order) =>
        order.deposit_payment_id &&
        submittedDepositIds.includes(order.deposit_payment_id),
    );

  return {
    preorderOrders,
    allReceiptsSubmitted,
    awaitingReceipt: preorderOrders.length > 0 && !allReceiptsSubmitted,
  };
};
