import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

/**
 * Order placed subscriber — fires when a new order is created.
 * Extend this to send confirmation emails, trigger fulfillment, etc.
 */
// eslint-disable-next-line @typescript-eslint/require-await
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>): Promise<void> {
  const logger = container.resolve("logger");
  logger.info(`📦 New order placed: ${data.id}`);

  // TODO: Integrate notification service (e.g. Resend, SendGrid)
  // const notificationService = container.resolve("notificationService");
  // await notificationService.send("order-placed", { orderId: data.id });
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
