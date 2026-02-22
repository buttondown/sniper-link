export const runtime = "edge";

import * as Sentry from "@sentry/nextjs";
import { response } from "../response";

const HOST = process.env.NODE_ENV === "production" ? "https://sniperl.ink" : "";

// --- Types ---

type ProviderName =
  | "gmail"
  | "yahoo"
  | "proton"
  | "icloud"
  | "microsoft"
  | "hey"
  | "aol"
  | "mail_ru";

type Context = "desktop" | "ios" | "android";

type LinkOptions = Readonly<{ recipient: string; sender: string }>;

type Provider = {
  name: ProviderName;
  prettyName: string;
  domains: ReadonlyArray<string>;
  getDesktopLink: (options: LinkOptions) => string;
  getIosLink?: (options: LinkOptions) => string;
  getAndroidLink: (options: LinkOptions) => string;
};

// --- Helpers ---

/**
 * Creates an Android Chrome intent URL which opens a package by its ID
 * or hits an HTTP fallback.
 * https://developer.chrome.com/docs/android/intents
 */
const getAndroidIntentUrl = (
  packageName: string,
  fallbackUrl: string,
): string =>
  `intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;launchFlags=0x10000000;package=${packageName};S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`;

const buildUrl = (baseHref: string, key: string, value: string): string => {
  const result = new URL(baseHref);
  result.searchParams.set(key, value);
  return result.toString();
};

// --- Provider Definitions ---

export const PROVIDERS: ReadonlyArray<Provider> = [
  {
    name: "gmail",
    prettyName: "Gmail",
    domains: ["gmail.com", "googlemail.com", "google.com"],
    getDesktopLink: ({ recipient, sender }) =>
      `https://mail.google.com/mail/u/${encodeURIComponent(recipient)}/#search/from%3A(${encodeURIComponent(sender)})+in%3Aanywhere+newer_than%3A1h`,
    getIosLink: () => "googlegmail://",
    getAndroidLink: () =>
      getAndroidIntentUrl("com.google.android.gm", "https://mail.google.com/"),
  },
  {
    name: "yahoo",
    prettyName: "Yahoo Mail",
    domains: [
      "yahoo.com",
      "myyahoo.com",
      "yahoo.co.uk",
      "yahoo.fr",
      "yahoo.it",
      "ymail.com",
      "rocketmail.com",
    ],
    getDesktopLink: ({ sender }) =>
      `https://mail.yahoo.com/d/search/keyword=from:${encodeURIComponent(sender)}`,
    getIosLink: () => "ymail://",
    getAndroidLink: () =>
      getAndroidIntentUrl(
        "com.yahoo.mobile.client.android.mail",
        "https://mail.yahoo.com/",
      ),
  },
  {
    name: "microsoft",
    prettyName: "Outlook",
    domains: [
      "outlook.com",
      "live.com",
      "live.de",
      "hotmail.com",
      "hotmail.co.uk",
      "hotmail.de",
      "msn.com",
      "passport.com",
      "passport.net",
    ],
    getDesktopLink: ({ recipient }) =>
      buildUrl("https://outlook.live.com/mail/", "login_hint", recipient),
    getIosLink: ({ sender }) =>
      `ms-outlook://search?querytext=${encodeURIComponent(sender)}`,
    getAndroidLink: () =>
      getAndroidIntentUrl(
        "com.microsoft.office.outlook",
        "https://outlook.live.com/",
      ),
  },
  {
    name: "proton",
    prettyName: "Proton Mail",
    domains: ["proton.me", "pm.me", "protonmail.com", "protonmail.ch"],
    getDesktopLink: ({ sender }) =>
      `https://mail.proton.me/u/0/all-mail#from=${encodeURIComponent(sender)}`,
    getIosLink: () => "protonmail://",
    getAndroidLink: () =>
      getAndroidIntentUrl(
        "ch.protonmail.android",
        "https://mail.proton.me/",
      ),
  },
  {
    name: "icloud",
    prettyName: "iCloud Mail",
    domains: ["icloud.com", "me.com", "mac.com"],
    getDesktopLink: () => "https://www.icloud.com/mail",
    getIosLink: () => "message://",
    getAndroidLink: () => "https://www.icloud.com/mail",
  },
  {
    name: "hey",
    prettyName: "HEY",
    domains: ["hey.com"],
    getDesktopLink: () => "https://app.hey.com/topics/everything",
    getAndroidLink: () =>
      getAndroidIntentUrl("com.basecamp.hey", "https://app.hey.com/"),
  },
  {
    name: "aol",
    prettyName: "AOL",
    domains: ["aol.com"],
    getDesktopLink: ({ sender }) =>
      `https://mail.aol.com/d/search/keyword=from:${encodeURIComponent(sender)}`,
    getAndroidLink: () =>
      getAndroidIntentUrl("com.aol.mobile.aolapp", "https://mail.aol.com/"),
  },
  {
    name: "mail_ru",
    prettyName: "Mail.ru",
    domains: ["mail.ru"],
    getDesktopLink: ({ sender }) =>
      buildUrl("https://e.mail.ru/search/", "q_from", sender),
    getAndroidLink: () =>
      getAndroidIntentUrl("ru.mail.mailapp", "https://e.mail.ru/"),
  },
];

// Pre-computed domain-to-provider map for O(1) lookups.
const PROVIDER_BY_DOMAIN = new Map<string, Provider>();
for (const provider of PROVIDERS) {
  for (const domain of provider.domains) {
    PROVIDER_BY_DOMAIN.set(domain, provider);
  }
}

// --- Context Detection ---

const generateContext = (userAgent: string): Context => {
  if (userAgent.includes("iPhone")) return "ios";
  if (userAgent.includes("Android")) return "android";
  return "desktop";
};

// --- Link Generation ---

export const generateLink = (
  context: Context,
  provider: Provider,
  options: LinkOptions,
): string => {
  if (context === "ios" && provider.getIosLink) {
    return provider.getIosLink(options);
  }
  if (context === "android") {
    return provider.getAndroidLink(options);
  }
  return provider.getDesktopLink(options);
};

// --- Email Parsing ---

const extractDomain = (email: string) => email.split("@").pop() || "";

// --- MX Record Matching ---

const getProviderForMxExchange = (
  exchange: string,
): Provider | undefined => {
  const direct = PROVIDER_BY_DOMAIN.get(exchange);
  if (direct) return direct;

  for (const provider of PROVIDERS) {
    for (const domain of provider.domains) {
      if (exchange.endsWith(`.${domain}`)) {
        return provider;
      }
    }
  }
  return undefined;
};

type MxRecord = { priority: number; exchange: string };

/**
 * Parse Cloudflare DNS-over-HTTPS MX response into structured records.
 * MX record data is formatted as "<priority> <exchange>".
 */
export const parseMxRecords = (answer: { type: number; data: string }[]): MxRecord[] => {
  return answer
    .filter((record) => record.type === 15)
    .map((record) => {
      const spaceIndex = record.data.indexOf(" ");
      const priority = Number.parseInt(record.data.slice(0, spaceIndex), 10);
      const exchange = record.data
        .slice(spaceIndex + 1)
        .replace(/\.$/, "")
        .toLowerCase();
      return { priority, exchange };
    })
    .filter((r) => r.exchange && !Number.isNaN(r.priority));
};

/**
 * Given parsed MX records, find the provider using priority-based matching.
 *
 * Returns a provider only if the best priority level that contains a recognized
 * provider has exactly one unique provider. This prevents false positives when
 * MX records are ambiguous (e.g., split routing between two providers).
 */
export const matchProviderFromMxRecords = (
  records: MxRecord[],
): Provider | null => {
  let bestPriorityWithProvider = Number.POSITIVE_INFINITY;
  const providersByPriority = new Map<
    number,
    Set<Provider | undefined>
  >();

  for (const { priority, exchange } of records) {
    if (priority > bestPriorityWithProvider) continue;

    const provider = getProviderForMxExchange(exchange);
    const providersAtThisPriority =
      providersByPriority.get(priority) ?? new Set();
    providersAtThisPriority.add(provider);
    providersByPriority.set(priority, providersAtThisPriority);

    if (provider) {
      bestPriorityWithProvider = Math.min(
        bestPriorityWithProvider,
        priority,
      );
    }
  }

  const candidates = providersByPriority.get(bestPriorityWithProvider);
  if (!candidates || candidates.size !== 1) return null;

  const first = candidates.values().next().value;
  return first ?? null;
};


// --- Provider Detection ---

const generateProviderViaDNS = async (
  domain: string,
): Promise<Provider | null> => {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${domain}&type=MX`,
      { headers: { Accept: "application/dns-json" } },
    );

    if (res.status !== 200) return null;

    const json = await res.json();
    if (json.Status !== 0 || !json.Answer) return null;

    const records = parseMxRecords(json.Answer);
    return matchProviderFromMxRecords(records);
  } catch {
    return null;
  }
};

const generateProvider = async (email: string): Promise<Provider | null> => {
  const domain = extractDomain(email);
  const hardcoded = PROVIDER_BY_DOMAIN.get(domain);
  if (hardcoded) return hardcoded;

  return await generateProviderViaDNS(domain);
};

// --- HTTP Handler ---

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
