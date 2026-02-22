export const runtime = "edge";

import * as Sentry from "@sentry/nextjs";
import { response } from "../response";
import { generateContext, generateLink, generateProvider } from "./providers";

const HOST = process.env.NODE_ENV === "production" ? "https://sniperl.ink" : "";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let recipient = searchParams.get("recipient");
    let sender = searchParams.get("sender");
    const context = generateContext(request.headers.get("user-agent") || "");

    if (!recipient || !sender) {
      return response(
        {
          code: "missing_fields",
          detail: "Missing recipient or sender",
          metadata: {},
        },
        { status: 400 },
      );
    }

    recipient = recipient.trim().toLowerCase();
    sender = sender.trim().toLowerCase();

    const provider = await generateProvider(recipient);

    if (!provider) {
      return response(
        {
          code: "unknown_email_provider",
          detail: "Unknown email provider",
          metadata: { recipient },
        },
        { status: 404 },
      );
    }

    const url = generateLink(context, provider, { recipient, sender });
    return response({
      url,
      image: `${HOST}/logos/${provider.name}.png`,
      provider_pretty: provider.prettyName,
    });
  } catch (e) {
    Sentry.captureException(e);
  }
}

// For CORS preflight requests.
export function OPTIONS() {
  return response({ success: true });
}
