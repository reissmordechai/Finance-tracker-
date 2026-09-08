import { Resend } from "resend";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: process.env.RESEND_FROM || "Finance Tracker <onboarding@resend.dev>",
    to,
    subject: "Reset your Finance Tracker password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0F3D2E;">Reset your password</h2>
        <p>Someone (hopefully you) asked to reset the password on your Finance Tracker account.</p>
        <p>
          <a href="${resetUrl}" style="background:#0F3D2E; color:#F2EEE3; padding:12px 20px; border-radius:8px; text-decoration:none; display:inline-block;">
            Set a new password
          </a>
        </p>
        <p style="color:#8A8370; font-size:13px;">This link works once and expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
