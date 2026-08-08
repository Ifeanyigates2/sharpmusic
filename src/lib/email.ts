export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim(),
  );
}

export function appBaseUrl(): string {
  return (
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://sharpmusic.com"
  );
}

function emailSignatureHtml() {
  const name =
    process.env.EMAIL_SIGN_NAME?.trim() || "Ifeanyi, CEO of Sharp Music";
  const contact = process.env.EMAIL_REPLY_TO?.trim() || "";
  return `
    <p style="margin-top:24px;color:#5a6b5e;font-size:13px;line-height:1.5">
      — ${escapeHtml(name)}
      ${contact ? `<br/><a href="mailto:${escapeHtml(contact)}">${escapeHtml(contact)}</a>` : ""}
    </p>
  `;
}

export async function sendRequestAddedEmail(options: {
  to: string;
  title: string;
  artist: string;
  trackUrl?: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();
  const to = options.to.trim().toLowerCase();

  if (!apiKey || !from) {
    return { ok: true, skipped: true };
  }
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, error: "Invalid recipient" };
  }

  const trackLine = options.trackUrl
    ? `<p><a href="${options.trackUrl}">Listen on Sharp Music →</a></p>`
    : `<p>It’s now available on <a href="${appBaseUrl()}">Sharp Music</a>.</p>`;

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#08110e">
      <p>Good news — we added a track you recommended.</p>
      <p><strong>${escapeHtml(options.title)}</strong> by ${escapeHtml(options.artist)}</p>
      ${trackLine}
      <p>Thanks for helping shape the Sharp Music catalog.</p>
      ${emailSignatureHtml()}
    </div>
  `;

  try {
    const payload: Record<string, unknown> = {
      from,
      to: [to],
      subject: `We added “${options.title}” on Sharp Music`,
      html,
    };
    if (replyTo) payload.reply_to = replyTo;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      return { ok: false, error: data.message || `Email failed (${res.status})` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Email failed",
    };
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
