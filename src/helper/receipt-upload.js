const LOCAL_DISABLED = "Local uploads are disabled while S3 media mode is enabled";

export const submitExistingOrderReceipt = async ({ driver, submitLocal, submitS3 }) => {
  if (driver === "s3") return submitS3();
  try {
    return await submitLocal();
  } catch (error) {
    // The server rejects this request before accepting the file, so this
    // specific configuration error can safely be retried through S3.
    if (error.status !== 409 || error.message !== LOCAL_DISABLED) throw error;
    return submitS3();
  }
};
