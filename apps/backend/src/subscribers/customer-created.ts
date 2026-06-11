import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

interface CustomerCreatedEvent {
  id: string;
}

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<CustomerCreatedEvent>): Promise<void> {
  const logger = container.resolve("logger");
  const customerService = container.resolve("customer");

  logger.info(`👤 New customer created event received: ${data.id}`);

  try {
    const customer = await customerService.retrieveCustomer(data.id);
    if (!customer?.email) {
      logger.warn(`⚠️ Customer ${data.id} details or email not found.`);
      return;
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const senderEmail = process.env.SENDER_EMAIL || "onboarding@resend.dev";

    if (!resendApiKey || resendApiKey === "re_your_resend_api_key") {
      logger.info(`ℹ️ Resend API Key is not configured. Skipping welcome email transmission.`);
      return;
    }

    const customerName = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Network User";

    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WANNASINGH NETWORK | ACCESS GRANTED</title>
</head>
<body style="margin: 0; padding: 0; background-color: #131313; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e2e1; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #131313;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <!-- Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; border: 1px solid #262626; background-color: #181818; padding: 40px 30px; text-align: left;">
          
          <!-- Header Logo -->
          <tr>
            <td style="padding-bottom: 30px; border-bottom: 1px solid #262626;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 16px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #ffffff;">WANNASINGH</span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; font-size: 8px; font-weight: 600; letter-spacing: 0.15em; border: 1px solid #d0bcff; color: #d0bcff; padding: 4px 8px; border-radius: 2px;">
                      AUTH PROTOCOL v2.0
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 0 30px 0;">
              <h1 style="font-size: 22px; font-weight: 600; letter-spacing: -0.02em; color: #ffffff; margin: 0 0 16px 0; text-transform: uppercase;">
                ACCESS GRANTED
              </h1>
              <p style="font-size: 13px; line-height: 1.6; color: #a3a3a3; margin: 0 0 20px 0;">
                Greetings, <strong>${customerName}</strong>.
              </p>
              <p style="font-size: 13px; line-height: 1.6; color: #a3a3a3; margin: 0 0 30px 0;">
                Your account registration on the WANNASINGH network has been successfully completed. You now have full access protocol clearance to explore our catalog, drops, and tactical technical specifications.
              </p>
            </td>
          </tr>

          <!-- Action Button -->
          <tr>
            <td style="padding-bottom: 40px;">
              <a href="${process.env.STORE_CORS || 'http://localhost:4321'}/auth?tab=login" style="display: block; text-align: center; background-color: #ffffff; color: #131313; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-decoration: none; padding: 18px 24px; text-transform: uppercase; border: 1px solid #ffffff; transition: all 0.3s ease;">
                GO TO STOREFRONT LOGIN →
              </a>
            </td>
          </tr>

          <!-- Technical Specs -->
          <tr>
            <td style="border-top: 1px solid #262626; padding-top: 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="display: block; font-size: 8px; color: #525252; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 2px;">SECURE NODE</span>
                    <span style="font-size: 9px; color: #a3a3a3; font-family: monospace;">AETHER.OPS.SYS</span>
                  </td>
                  <td align="right">
                    <span style="display: block; font-size: 8px; color: #525252; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 2px;">IDENTITY ID</span>
                    <span style="font-size: 9px; color: #a3a3a3; font-family: monospace;">${customer.id}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>

        <!-- Footer Note -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; margin-top: 20px; text-align: center;">
          <tr>
            <td>
              <p style="font-size: 10px; color: #525252; margin: 0; letter-spacing: 0.05em;">
                This is an automated system transmission.
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>`;

    logger.info(`📨 Dispatching welcome email to ${customer.email} via Resend API...`);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: senderEmail,
        to: customer.email,
        subject: "WANNASINGH NETWORK | Access Credentials Active",
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`❌ Resend API response error: ${response.status} - ${errorText}`);
    } else {
      const resData = await response.json();
      logger.info(`✅ Welcome email dispatched successfully. ID: ${resData.id}`);
    }
  } catch (err: any) {
    logger.error(`❌ Error executing customer-created welcome email subscriber: ${err.message}`);
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
};
