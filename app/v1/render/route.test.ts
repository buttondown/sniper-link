import { describe, it, expect } from "vitest";
import {
  matchProviderFromMxRecords,
  parseMxRecords,
  PROVIDERS,
  generateLink,
} from "./route";

// --- parseMxRecords ---

describe("parseMxRecords", () => {
  it("parses standard MX records", () => {
    const answer = [
      { type: 15, data: "10 aspmx.l.google.com." },
      { type: 15, data: "20 alt1.aspmx.l.google.com." },
    ];
    expect(parseMxRecords(answer)).toEqual([
      { priority: 10, exchange: "aspmx.l.google.com" },
      { priority: 20, exchange: "alt1.aspmx.l.google.com" },
    ]);
  });

  it("strips trailing dots from exchange hostnames", () => {
    const answer = [{ type: 15, data: "10 mail.example.com." }];
    expect(parseMxRecords(answer)).toEqual([
      { priority: 10, exchange: "mail.example.com" },
    ]);
  });

  it("handles exchanges without trailing dots", () => {
    const answer = [{ type: 15, data: "10 mail.example.com" }];
    expect(parseMxRecords(answer)).toEqual([
      { priority: 10, exchange: "mail.example.com" },
    ]);
  });

  it("lowercases exchange hostnames", () => {
    const answer = [{ type: 15, data: "10 ASPMX.L.GOOGLE.COM." }];
    expect(parseMxRecords(answer)).toEqual([
      { priority: 10, exchange: "aspmx.l.google.com" },
    ]);
  });

  it("filters out non-MX record types", () => {
    const answer = [
      { type: 1, data: "192.168.1.1" },
      { type: 15, data: "10 mail.example.com." },
      { type: 28, data: "::1" },
    ];
    expect(parseMxRecords(answer)).toEqual([
      { priority: 10, exchange: "mail.example.com" },
    ]);
  });

  it("returns empty array for no MX records", () => {
    const answer = [
      { type: 1, data: "192.168.1.1" },
      { type: 5, data: "alias.example.com." },
    ];
    expect(parseMxRecords(answer)).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(parseMxRecords([])).toEqual([]);
  });

  it("filters out records with empty exchange", () => {
    const answer = [{ type: 15, data: "0 " }];
    expect(parseMxRecords(answer)).toEqual([]);
  });

  it("filters out records with malformed priority", () => {
    const answer = [{ type: 15, data: "notanumber mail.example.com." }];
    expect(parseMxRecords(answer)).toEqual([]);
  });

  it("handles priority 0 (null MX)", () => {
    const answer = [{ type: 15, data: "0 ." }];
    expect(parseMxRecords(answer)).toEqual([]);
  });
});

// --- matchProviderFromMxRecords ---

describe("matchProviderFromMxRecords", () => {
  it("returns null for empty records", () => {
    expect(matchProviderFromMxRecords([])).toBeNull();
  });

  it("matches Gmail from google.com subdomains", () => {
    const records = [
      { priority: 10, exchange: "aspmx.l.google.com" },
      { priority: 20, exchange: "alt1.aspmx.l.google.com" },
    ];
    expect(matchProviderFromMxRecords(records)?.name).toBe("gmail");
  });

  it("matches Microsoft from Outlook protection MX", () => {
    const records = [
      { priority: 10, exchange: "example-com.mail.protection.outlook.com" },
    ];
    expect(matchProviderFromMxRecords(records)?.name).toBe("microsoft");
  });

  it("matches Microsoft from consumer Outlook MX", () => {
    const records = [
      { priority: 10, exchange: "example-com.olc.protection.outlook.com" },
    ];
    expect(matchProviderFromMxRecords(records)?.name).toBe("microsoft");
  });

  it("matches Yahoo from yahoo subdomains", () => {
    const records = [
      { priority: 10, exchange: "mx1.biz.mail.yahoo.com" },
    ];
    expect(matchProviderFromMxRecords(records)?.name).toBe("yahoo");
  });

  it("matches Proton from protonmail subdomains", () => {
    const records = [{ priority: 10, exchange: "mail.protonmail.ch" }];
    expect(matchProviderFromMxRecords(records)?.name).toBe("proton");
  });

  it("returns null for unrecognized exchanges", () => {
    const records = [
      { priority: 10, exchange: "mx.example.com" },
      { priority: 20, exchange: "mx2.example.com" },
    ];
    expect(matchProviderFromMxRecords(records)).toBeNull();
  });

  it("returns null when best priority has two different providers", () => {
    const records = [
      { priority: 10, exchange: "aspmx.l.google.com" },
      { priority: 10, exchange: "mail.protonmail.ch" },
    ];
    expect(matchProviderFromMxRecords(records)).toBeNull();
  });

  it("returns null when best priority has a recognized and unrecognized exchange", () => {
    const records = [
      { priority: 10, exchange: "aspmx.l.google.com" },
      { priority: 10, exchange: "mx.unknown.example" },
    ];
    expect(matchProviderFromMxRecords(records)).toBeNull();
  });

  it("picks the provider from the best priority, ignoring worse priorities", () => {
    const records = [
      { priority: 10, exchange: "aspmx.l.google.com" },
      { priority: 20, exchange: "mail.protonmail.ch" },
    ];
    expect(matchProviderFromMxRecords(records)?.name).toBe("gmail");
  });

  it("handles same provider across same priority (multiple Google MX records)", () => {
    const records = [
      { priority: 10, exchange: "aspmx.l.google.com" },
      { priority: 10, exchange: "alt1.aspmx.l.google.com" },
      { priority: 20, exchange: "mail.protonmail.ch" },
    ];
    expect(matchProviderFromMxRecords(records)?.name).toBe("gmail");
  });

  it("skips unrecognized lower-priority records when higher priority matches", () => {
    const records = [
      { priority: 5, exchange: "mx.unknown.example" },
      { priority: 10, exchange: "aspmx.l.google.com" },
    ];
    expect(matchProviderFromMxRecords(records)?.name).toBe("gmail");
  });

  it("handles records arriving in non-sorted order", () => {
    const records = [
      { priority: 30, exchange: "mail.protonmail.ch" },
      { priority: 10, exchange: "aspmx.l.google.com" },
      { priority: 20, exchange: "mx.unknown.example" },
    ];
    expect(matchProviderFromMxRecords(records)?.name).toBe("gmail");
  });

  it("matches exact domain (not just subdomains)", () => {
    const records = [{ priority: 10, exchange: "google.com" }];
    expect(matchProviderFromMxRecords(records)?.name).toBe("gmail");
  });

  it("does not match when provider domain is a substring of the hostname", () => {
    const records = [
      { priority: 10, exchange: "ilovegmail.com" },
      { priority: 10, exchange: "notgoogle.com" },
    ];
    expect(matchProviderFromMxRecords(records)).toBeNull();
  });

  it("returns null for empty exchange strings", () => {
    const records = [{ priority: 0, exchange: "" }];
    expect(matchProviderFromMxRecords(records)).toBeNull();
  });

});
// --- Provider link URLs ---

const opts = { recipient: "user@test.com", sender: "news@sender.com" };

describe("provider desktop links", () => {
  const find = (name: string) => PROVIDERS.find((p) => p.name === name)!;

  it("gmail: searches by sender in recipient's mailbox", () => {
    const url = find("gmail").getDesktopLink(opts);
    expect(url).toContain("mail.google.com/mail/u/");
    expect(url).toContain(encodeURIComponent(opts.recipient));
    expect(url).toContain(encodeURIComponent(opts.sender));
    expect(url).toContain("newer_than%3A1h");
  });

  it("yahoo: searches by sender", () => {
    const url = find("yahoo").getDesktopLink(opts);
    expect(url).toContain("mail.yahoo.com/d/search/keyword=from:");
    expect(url).toContain(encodeURIComponent(opts.sender));
  });

  it("microsoft: passes login_hint as query param", () => {
    const url = find("microsoft").getDesktopLink(opts);
    expect(url).toContain("outlook.live.com/mail/");
    expect(url).toContain("login_hint=");
    expect(url).toContain(encodeURIComponent(opts.recipient));
  });

  it("proton: filters by sender in all-mail", () => {
    const url = find("proton").getDesktopLink(opts);
    expect(url).toContain("mail.proton.me/u/0/all-mail");
    expect(url).toContain(encodeURIComponent(opts.sender));
  });

  it("icloud: links to icloud mail", () => {
    expect(find("icloud").getDesktopLink(opts)).toBe(
      "https://www.icloud.com/mail",
    );
  });

  it("hey: links to everything view", () => {
    expect(find("hey").getDesktopLink(opts)).toBe(
      "https://app.hey.com/topics/everything",
    );
  });

  it("aol: searches by sender", () => {
    const url = find("aol").getDesktopLink(opts);
    expect(url).toContain("mail.aol.com/d/search/keyword=from:");
    expect(url).toContain(encodeURIComponent(opts.sender));
  });

  it("mail_ru: passes q_from as query param", () => {
    const url = find("mail_ru").getDesktopLink(opts);
    expect(url).toContain("e.mail.ru/search/");
    expect(url).toContain("q_from=");
    expect(url).toContain(encodeURIComponent(opts.sender));
  });
});

describe("provider iOS links", () => {
  const find = (name: string) => PROVIDERS.find((p) => p.name === name)!;

  it("gmail: googlegmail:// deep link", () => {
    expect(find("gmail").getIosLink!(opts)).toBe("googlegmail://");
  });

  it("yahoo: ymail:// deep link", () => {
    expect(find("yahoo").getIosLink!(opts)).toBe("ymail://");
  });

  it("microsoft: ms-outlook:// search with sender", () => {
    const url = find("microsoft").getIosLink!(opts);
    expect(url).toContain("ms-outlook://search");
    expect(url).toContain(encodeURIComponent(opts.sender));
  });

  it("proton: protonmail:// deep link", () => {
    expect(find("proton").getIosLink!(opts)).toBe("protonmail://");
  });

  it("icloud: message:// deep link", () => {
    expect(find("icloud").getIosLink!(opts)).toBe("message://");
  });

  it("hey: no iOS-specific link", () => {
    expect(find("hey").getIosLink).toBeUndefined();
  });

  it("aol: no iOS-specific link", () => {
    expect(find("aol").getIosLink).toBeUndefined();
  });

  it("mail_ru: no iOS-specific link", () => {
    expect(find("mail_ru").getIosLink).toBeUndefined();
  });
});

describe("provider Android links", () => {
  const find = (name: string) => PROVIDERS.find((p) => p.name === name)!;

  it("gmail: intent URL with fallback", () => {
    const url = find("gmail").getAndroidLink(opts);
    expect(url).toContain("package=com.google.android.gm");
    expect(url).toContain("browser_fallback_url=");
  });

  it("yahoo: intent URL with fallback", () => {
    const url = find("yahoo").getAndroidLink(opts);
    expect(url).toContain("package=com.yahoo.mobile.client.android.mail");
    expect(url).toContain("browser_fallback_url=");
  });

  it("microsoft: intent URL with fallback", () => {
    const url = find("microsoft").getAndroidLink(opts);
    expect(url).toContain("package=com.microsoft.office.outlook");
    expect(url).toContain("browser_fallback_url=");
  });

  it("proton: intent URL with fallback", () => {
    const url = find("proton").getAndroidLink(opts);
    expect(url).toContain("package=ch.protonmail.android");
    expect(url).toContain("browser_fallback_url=");
  });

  it("icloud: web fallback (no native Android app)", () => {
    expect(find("icloud").getAndroidLink(opts)).toBe(
      "https://www.icloud.com/mail",
    );
  });

  it("hey: intent URL with fallback", () => {
    const url = find("hey").getAndroidLink(opts);
    expect(url).toContain("package=com.basecamp.hey");
    expect(url).toContain("browser_fallback_url=");
  });

  it("aol: intent URL with fallback", () => {
    const url = find("aol").getAndroidLink(opts);
    expect(url).toContain("package=com.aol.mobile.aolapp");
    expect(url).toContain("browser_fallback_url=");
  });

  it("mail_ru: intent URL with fallback", () => {
    const url = find("mail_ru").getAndroidLink(opts);
    expect(url).toContain("package=ru.mail.mailapp");
    expect(url).toContain("browser_fallback_url=");
  });
});

// --- generateLink context routing ---

describe("generateLink", () => {
  const find = (name: string) => PROVIDERS.find((p) => p.name === name)!;

  it("returns iOS link when context is ios and provider has one", () => {
    const url = generateLink("ios", find("gmail"), opts);
    expect(url).toBe("googlegmail://");
  });

  it("falls back to desktop when context is ios but provider has no iOS link", () => {
    const url = generateLink("ios", find("hey"), opts);
    expect(url).toBe("https://app.hey.com/topics/everything");
  });

  it("returns Android link when context is android", () => {
    const url = generateLink("android", find("gmail"), opts);
    expect(url).toContain("package=com.google.android.gm");
  });

  it("returns desktop link when context is desktop", () => {
    const url = generateLink("desktop", find("gmail"), opts);
    expect(url).toContain("mail.google.com");
  });
});
