export const runtime = "edge";

import * as Sentry from "@sentry/nextjs";
import { response } from "../response";

const HOST = process.env.NODE_ENV === "production" ? "https://sniperl.ink" : "";
// When this flag is true, links on Android will use the Intent URL API to open
// the Play Store listing, where users can then tap "Open" to open the app.
// This is unfortunately the best solution we've found on Android.
// When this flag is false, we'll fall back to the desktop web URL.
const ANDROID_OPEN_PLAY_STORE = true;

type Provider =
  | "gmail"
  | "yahoo"
  | "proton"
  | "icloud"
  | "microsoft"
  | "hey"
  | "aol"
  | "mail_ru";

type Context = "desktop" | "ios" | "android";

const PROVIDER_TO_PRETTY_NAME: Record<Provider, string> = {
  gmail: "Gmail",
  yahoo: "Yahoo Mail",
  proton: "Proton Mail",
  icloud: "iCloud Mail",
  microsoft: "Outlook",
  hey: "HEY",
  aol: "AOL",
  mail_ru: "Mail.ru",
};

const PROVIDER_DOMAINS: Record<Provider, string[]> = {
  gmail: ["gmail.com", "googlemail.com", "google.com"],
  yahoo: [
    "yahoo.com",
    "myyahoo.com",
    "yahoo.co.uk",
    "yahoo.fr",
    "yahoo.it",
    "ymail.com",
    "rocketmail.com",
  ],
  microsoft: [
    "outlook.com",
    "live.com",
    "live.de",
    "hotmail.com",
    "hotmail.co.uk",
    "hotmail.de",
    "msn.com",
    "passport.com",
    "passport.net",
    "msn.com",
  ],
  proton: ["proton.me", "protonmail.com", "protonmail.ch"],
  icloud: ["icloud.com", "me.com", "mac.com"],
  hey: ["hey.com"],
  aol: ["aol.com"],
  mail_ru: ["mail.ru"],
};

const generateContext = (userAgent: string): Context => {
  if (userAgent.includes("iPhone")) {
    return "ios";
  }

  if (userAgent.includes("Android")) {
    return "android";
  }

  return "desktop";
};

const extractDomain = (email: string) => email.split("@").pop() || "";

const generateProvider = async (email: string): Promise<Provider | null> => {
  const domain = extractDomain(email);

  for (const provider in PROVIDER_DOMAINS) {
    const providerKey = provider as Provider;

    if (PROVIDER_DOMAINS[providerKey].includes(domain)) {
      return providerKey;
    }
  }

  return await generateProviderViaDNS(domain);
};

type OutlookType = "consumer" | "office365";

const detectOutlookType = (mxValues: string): OutlookType | null => {
  if (mxValues.includes("olc.protection.outlook.com")) {
    return "consumer";
  }
  if (mxValues.includes("mail.protection.outlook.com")) {
    return "office365";
  }
  return null;
};

const generateProviderViaDNS = async (
  domain: string,
): Promise<Provider | null> => {
  // https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/make-api-requests/dns-json
  const res = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${domain}&type=MX`,
    { headers: { Accept: "application/dns-json" } },
  );

  if (res.status !== 200) {
    return null;
  }

  const json = await res.json();

  if (json.Status !== 0) {
    return null;
  }

  if (!json.Answer) {
    return null;
  }

  // 15 = MX
  // https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml#dns-parameters-4
  const mxValues: string = json.Answer.filter(
    (record: any) => record.type === 15,
  )
    .map((record: any) => record.data)
    .join(" ")
    .toLowerCase();

  return matchProviderFromMxValues(mxValues);
};

export const matchProviderFromMxValues = (
  mxValues: string,
): Provider | null => {
  // Check for Outlook type first (consumer vs Office 365)
  const outlookType = detectOutlookType(mxValues);
  if (outlookType) {
    return "microsoft";
  }

  for (const provider in PROVIDER_DOMAINS) {
    const providerKey = provider as Provider;

    for (const domain of PROVIDER_DOMAINS[providerKey]) {
      if (
        mxValues.includes(`.${domain}`) ||
        mxValues.includes(` ${domain}`)
      ) {
        return providerKey;
      }
    }
  }

  return null;
};

const generateURL = async (
  context: Context,
  provider: Provider,
  sender: string,
  recipient: string,
): Promise<string | undefined> => {
  if (provider === "gmail") {
    if (context === "ios") {
      // googlegmail:// URL scheme opens the Gmail app directly
      return `googlegmail://`;
    }
    if (context === "android" && ANDROID_OPEN_PLAY_STORE) {
      // Intent URL to open Gmail app, falls back to web Gmail if not installed
      return `intent://open/#Intent;scheme=googlegmail;package=com.google.android.gm;S.browser_fallback_url=https%3A%2F%2Fmail.google.com%2Fmail%2F;end`;
    }
    return `https://mail.google.com/mail/u/${recipient}/#search/from%3A(${sender})+in%3Aanywhere+newer_than%3A1h`;
  }
  if (provider === "yahoo") {
    if (context === "ios") {
      return `ymail://`;
    }
    if (context === "android" && ANDROID_OPEN_PLAY_STORE) {
      return "intent://#Intent;package=com.yahoo.mobile.client.android.mail;end";
    }
    return `https://mail.yahoo.com/d/search/keyword=from:${sender}`;
  }
  if (provider === "proton") {
    if (context === "ios") {
      return `protonmail://`;
    }
    if (context === "android" && ANDROID_OPEN_PLAY_STORE) {
      return "intent://#Intent;package=ch.protonmail.android;end";
    }
    return `https://mail.proton.me/u/0/all-mail#from=${sender}`;
  }
  if (provider === "icloud") {
    if (context === "ios") {
      return `message://`;
    }
    return `https://www.icloud.com/mail`;
  }
  if (provider === "microsoft") {
    // Detect Outlook type (consumer vs Office 365) via MX records
    const domain = extractDomain(recipient);
    const mxRes = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${domain}&type=MX`,
      { headers: { Accept: "application/dns-json" } },
    );
    
    let outlookType: OutlookType | null = null;
    if (mxRes.status === 200) {
      const mxJson = await mxRes.json();
      if (mxJson.Status === 0 && mxJson.Answer) {
        const mxValues: string = mxJson.Answer.filter(
          (record: any) => record.type === 15,
        )
          .map((record: any) => record.data)
          .join(" ")
          .toLowerCase();
        outlookType = detectOutlookType(mxValues);
      }
    }
    
    // Default to consumer for known Microsoft domains if MX lookup fails
    if (!outlookType && PROVIDER_DOMAINS.microsoft.includes(domain)) {
      outlookType = "consumer";
    }
    
    if (context === "ios") {
      if (outlookType === "consumer") {
        // Consumer Outlook: use search query
        const encodedSender = encodeURIComponent(sender);
        return `ms-outlook://search?querytext=${encodedSender}`;
      } else {
        // Office 365: also use search query
        const encodedSender = encodeURIComponent(sender);
        return `ms-outlook://search?querytext=${encodedSender}`;
      }
    }
    if (context === "android" && ANDROID_OPEN_PLAY_STORE) {
      // Android: no queryText, just open emails view
      return "intent://emails#Intent;package=com.microsoft.office.outlook;scheme=ms-outlook;end";
    }
    return `https://outlook.live.com/mail/?login_hint=${recipient}`;
  }
  if (provider === "hey") {
    // HEY's URL scheme is "hey://", but this link takes you to the "Everything" view.
    return `https://app.hey.com/topics/everything`;
  }
  if (provider === "aol") {
    // Couldn't find a URL scheme for AOL, but this link opens the app.
    return `https://mail.aol.com/d/search/keyword=from:${sender}`;
  }
  if (provider === "mail_ru") {
    // Not sure that the Mail.ru app has a URL scheme - if it does, I couldn't find it.
    if (context === "android" && ANDROID_OPEN_PLAY_STORE) {
      return "intent://#Intent;package=ru.mail.mailapp;end";
    }
    return `https://e.mail.ru/search/?q_from=${sender}`;
  }
};

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
          detail: `Unknown email provider`,
          metadata: { recipient },
        },
        { status: 404 },
      );
    }

    const url = await generateURL(context, provider, sender, recipient);
    return response({
      url,
      image: `${HOST}/logos/${provider}.png`,
      provider_pretty: PROVIDER_TO_PRETTY_NAME[provider],
    });
  } catch (e) {
    Sentry.captureException(e);
  }
}

// For CORS preflight requests.
export function OPTIONS() {
  return response({ success: true });
}
