import { env } from "../config/env";

export const SendOtp = async (email: string, otp: string): Promise<void> => {
  if (!env.ZEPTOMAIL_TOKEN || !env.ZEPTOMAIL_FROM_EMAIL) {
    throw new Error("ZeptoMail is not configured");
  }

  try {
    const response = await fetch("https://api.zeptomail.com/v1.1/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        Authorization: `zoho-enczapikey ${env.ZEPTOMAIL_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        subject: " Secure One-Time Password (OTP) Verification",

        from: {
          name: env.ZEPTOMAIL_FROM_NAME,
          address: env.ZEPTOMAIL_FROM_EMAIL,
        },
        to: [{ email_address: { address: email, name: email } }],
        htmlbody: `
          <div style="font-family: sans-serif; max-width: 500px; padding: 20px; background-color: #0a0a0a; color: #f5f5f5; border-radius: 12px; border: 1px solid #262626;">
            <h2 style="color: #800080; margin-bottom: 4px;">Cedugames</h2>
            <p style="font-size: 14px; color: #a3a3a3;">Use the secure verification pin below to complete your authentication lifecycle initialization:</p>
            <div style="background-color: #171717; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0; border: 1px solid #404040;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ffffff;">${otp}</span>
            </div>
            <p style="font-size: 11px; color: #525252; line-height: 1.4;">If you did not initiate this system access validation, please ignore this email sequence. This code expires strictly in 15 minutes.</p>
          </div>
        `,
      }),
    });

    const result = await response.json() as { message?: string; request_id?: string };

    if (!response.ok) {
      throw new Error(
        result.message || `HTTP error! status: ${response.status}`,
      );
    }

    console.log(JSON.stringify({ level: "info", event: "otp_email_sent", requestId: result.request_id }));
  } catch (error: any) {
    console.error(JSON.stringify({ level: "error", event: "otp_email_failed", message: error.message }));
    throw error;
  }
};
