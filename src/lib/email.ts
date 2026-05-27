export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(notification: EmailNotification) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured. Email logged but not sent:', notification);
    return { id: null, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Thrift List <notifications@thriftlist.app>',
        to: notification.to,
        subject: notification.subject,
        html: notification.html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend API error:', data);
      return { id: null, error: data.message || 'Failed to send email' };
    }

    console.log('Email sent via Resend:', data.id);
    return { id: data.id, error: null };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { id: null, error: 'Network error' };
  }
}

export function generatePostingSuccessEmail(itemTitle: string, platform: string, url?: string) {
  return {
    to: '', // Will be filled with user email
    subject: `Successfully posted "${itemTitle}" to ${platform}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #c4a882;">Posting Successful!</h2>
        <p>Your item "<strong>${itemTitle}</strong>" has been successfully posted to <strong>${platform}</strong>.</p>
        ${url ? `<p>You can view your listing <a href="${url}" style="color: #c4a882;">here</a>.</p>` : ''}
        <p>Best regards,<br>Thrift List Team</p>
      </div>
    `,
  };
}

export function generatePostingFailureEmail(itemTitle: string, platform: string, error: string) {
  return {
    to: '', // Will be filled with user email
    subject: `Failed to post "${itemTitle}" to ${platform}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ef4444;">Posting Failed</h2>
        <p>Unfortunately, your item "<strong>${itemTitle}</strong>" could not be posted to <strong>${platform}</strong>.</p>
        <p><strong>Error:</strong> ${error}</p>
        <p>Please try again or check your account settings for the platform.</p>
        <p>Best regards,<br>Thrift List Team</p>
      </div>
    `,
  };
}
