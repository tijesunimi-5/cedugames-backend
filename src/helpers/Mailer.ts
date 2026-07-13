export const SendOtp = async (email: string, otp: string) => {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.error(
      "Critical: BREVO_API_KEY is missing from environment variables",
    );
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        subject: " Secure One-Time Password (OTP) Verification",

        sender: {
          name: "Cedugames",
          email: "tijesunimiidowu16@gmail.com",
        },
        to: [{ email: email }],
        htmlContent: `
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

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || `HTTP error! status: ${response.status}`,
      );
    }

    console.log(
      ` Transactional OTP API dispatch success! Message ID: ${result.messageId}`,
    );
    return true;
  } catch (error: any) {
    console.error(" Critical Transactional API Failure Vector:", error.message);
    return false;
  }
};
