import { describe, it, expect } from "vitest";
import { matchProviderFromMxValues } from "./route";

describe("matchProviderFromMxValues", () => {
  it("matches Gmail from google.com MX records", () => {
    const mxValues = "10 aspmx.l.google.com. 20 alt1.aspmx.l.google.com.";
    expect(matchProviderFromMxValues(mxValues)).toBe("gmail");
  });

  it("does not match Gmail when provider domain is a substring of the hostname", () => {
    const mxValues = "10 ilovegmail.com.";
    expect(matchProviderFromMxValues(mxValues)).toBeNull();
  });

  it("matches Microsoft from Office 365 MX records", () => {
    const mxValues = "10 example-com.mail.protection.outlook.com.";
    expect(matchProviderFromMxValues(mxValues)).toBe("microsoft");
  });

  it("matches Microsoft from consumer Outlook MX records", () => {
    const mxValues = "10 example-com.olc.protection.outlook.com.";
    expect(matchProviderFromMxValues(mxValues)).toBe("microsoft");
  });

  it("matches Yahoo from yahoo MX records", () => {
    const mxValues = "10 mx1.biz.mail.yahoo.com.";
    expect(matchProviderFromMxValues(mxValues)).toBe("yahoo");
  });

  it("does not match Yahoo when domain is a substring", () => {
    const mxValues = "10 mx.notyahoo.com.";
    expect(matchProviderFromMxValues(mxValues)).toBeNull();
  });

  it("matches Proton from protonmail MX records", () => {
    const mxValues = "10 mail.protonmail.ch.";
    expect(matchProviderFromMxValues(mxValues)).toBe("proton");
  });

  it("returns null for unknown MX records", () => {
    const mxValues = "10 mx.example.com.";
    expect(matchProviderFromMxValues(mxValues)).toBeNull();
  });

  it("matches when provider domain is the entire hostname", () => {
    const mxValues = "10 google.com.";
    expect(matchProviderFromMxValues(mxValues)).toBe("gmail");
  });
});
