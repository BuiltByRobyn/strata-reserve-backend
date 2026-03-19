import { Resend } from 'resend';
import type { NewStrataEmailParams } from '../types/email.types';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Strata Reserve Planning <noreply@stratareserveplanning.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://your-app-url.com').replace(/\/$/, '');

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function sendNewStrataEmail(params: NewStrataEmailParams): Promise<void> {
  if (!resend || !ADMIN_EMAIL) return;

  const location = [params.town, params.province].filter(Boolean).join(', ');

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New Strata Created: ${params.strataPlan}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
        <h2 style="color: #1e40af;">New Strata Property Added</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <th style="text-align: left; padding: 8px 12px; background: #f3f4f6; border: 1px solid #e5e7eb;">Strata Plan</th>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${params.strataPlan}</td>
          </tr>
          ${params.complexName ? `
          <tr>
            <th style="text-align: left; padding: 8px 12px; background: #f3f4f6; border: 1px solid #e5e7eb;">Complex Name</th>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${params.complexName}</td>
          </tr>` : ''}
          ${location ? `
          <tr>
            <th style="text-align: left; padding: 8px 12px; background: #f3f4f6; border: 1px solid #e5e7eb;">Location</th>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${location}</td>
          </tr>` : ''}
        </table>
        <a href="${FRONTEND_URL}/admin/strata" style="
          display: inline-block;
          background-color: #2563eb;
          color: white;
          padding: 10px 20px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
        ">View in Admin Portal</a>
      </div>
    `,
  });
}
