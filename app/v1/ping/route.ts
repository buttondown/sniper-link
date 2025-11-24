export const runtime = "edge";

import * as Sentry from "@sentry/nextjs";
import { response } from "../response";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === "button_clicked") {
      return response({ success: true });
    }

    throw new Error(`Unknown type "${type}" in /v1/ping`);
  } catch (e) {
    Sentry.captureException(e);
  }
}

// For CORS preflight requests.
export function OPTIONS() {
  return response({ success: true });
}
