"use client";

import Demo from "./Demo";
import CodeBlock from "./components/CodeBlock";

const WEB_COMPONENT_CODE = `<sniper-link
  recipient="you@example.com"
  from="justin@buttondown.email"
/>
<script src="https://sniperl.ink/v1/sniper-link.js" defer></script>`;

const API_CODE = `fetch(\`https://sniperl.ink/v1/render?recipient=\${
    recipient
  }&sender=justin@buttondown.email\`)`;

export default function Home() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What email providers do you support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Gmail, Yahoo, Proton, iCloud, Outlook, HEY, AOL, and Mail.ru, to start. We're also monitoring for new providers and will add them as they come up. Let us know if there's a provider you'd like us to add!",
        },
      },
      {
        "@type": "Question",
        name: "What platforms do you support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The redirects are based on the device being used: desktop, iOS, and Android are supported!",
        },
      },
      {
        "@type": "Question",
        name: "What happens with unrecognized providers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "When the email provider cannot be determined, the sniper-link element will have a hidden attribute. This attribute can be used for styling the button or the adjacent elements.",
        },
      },
      {
        "@type": "Question",
        name: "Are you doing anything nefarious with my subscribers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nope. Don't want 'em.",
        },
      },
      {
        "@type": "Question",
        name: "I still do not trust you. Can I just supply a domain instead of the full email address?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yup.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-neutral-100 font-sans p-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd),
        }}
      />
      <div className="flex flex-col lg:flex-row">
        <div className="max-w-prose p-8 space-y-8">
          <div className="">
            <h1 className="text-lg font-extrabold font-sans text-white p-2 mb-2 leading-[20px] bg-green-500 inline-flex items-center gap-1">
              <svg
                data-testid="geist-icon"
                height="16"
                stroke-linejoin="round"
                viewBox="0 0 16 16"
                width="16"
                style={{ color: "currentcolor" }}
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M5.5 2V0H7V2H5.5ZM0.96967 2.03033L2.46967 3.53033L3.53033 2.46967L2.03033 0.96967L0.96967 2.03033ZM4.24592 4.24592L4.79515 5.75631L7.79516 14.0063L8.46663 15.8529L9.19636 14.0285L10.2739 11.3346L13.4697 14.5303L14.5303 13.4697L11.3346 10.2739L14.0285 9.19636L15.8529 8.46663L14.0063 7.79516L5.75631 4.79516L4.24592 4.24592ZM11.6471 8.53337L10.1194 9.14447C9.6747 9.32235 9.32235 9.6747 9.14447 10.1194L8.53337 11.6471L6.75408 6.75408L11.6471 8.53337ZM0 7H2V5.5H0V7Z"
                  fill="currentColor"
                ></path>
              </svg>
              <div className="opacity-100">SNIPER</div>
              <div className="opacity-60">LINK</div>
            </h1>
            <p className="text-sm font-sans text-gray-500">
              Increase email confirmation rates by showing a button that
              directly opens the user&apos;s email client
            </p>
          </div>

          <div className="">
            <h2 className="font-semibold text-gray-800">Why?</h2>
            <p className="text-gray-600">
              Using double opt-in for your email newsletter or app can be vital
              for ensuring that your subscribers are real people. But because of
              the extra friction in a second step, it can also be a huge source
              of missed activation.
            </p>
          </div>

          <div className="">
            <h2 className="font-semibold text-gray-800">What?</h2>
            <p className="text-gray-600">
              Sniper Link is a widget that you can add to your sign-up forms
              that links subscribers directly to their email inbox — filtered
              down to your sender, bypassing spam filters. You can fully
              customize the way it looks and behaves, so it blends in to your
              website.
            </p>
          </div>

          <div className="">
            <h2 className="font-semibold text-gray-800">How?</h2>
            <p className="text-gray-600 mb-2">
              Using our pre-built web component:
            </p>
            <CodeBlock code={WEB_COMPONENT_CODE} language="html" />
            <p className="text-gray-600 mb-2">
              Or by calling our API directly:
            </p>
            <CodeBlock code={API_CODE} language="javascript" />
          </div>

          <div className="">
            <h2 className="font-semibold text-gray-800">Custom Styling</h2>
            <p className="text-gray-600 mb-2">
              The Sniper Link button can be customized using CSS. There are four
              parts to the button:
            </p>
            <ul className="text-gray-600 space-y-1 mb-4">
              <li>
                <code className="bg-gray-100 px-1 rounded">container</code>: A
                wrapper that holds the entire button.
              </li>
              <li>
                <code className="bg-gray-100 px-1 rounded">button</code>: The
                clickable element.
              </li>
              <li>
                <code className="bg-gray-100 px-1 rounded">image</code>: A logo
                representing the email provider.
              </li>
              <li>
                <code className="bg-gray-100 px-1 rounded">text</code>: A label,
                by default showing &quot;Open in &quot;provider.
              </li>
            </ul>
            <p className="text-gray-600 mb-2">
              You can use the{" "}
              <code className="bg-gray-100 px-1 rounded">::part</code> CSS
              selector to override the default styles:
            </p>
            <CodeBlock
              code={`sniper-link::part(button) {
  background-color: darkorange;
  justify-content: center;
  border-radius: 99px;
}

sniper-link::part(text) {
  color: white;
  text-shadow: 0 0 4px hsla(0, 0%, 0%, 0.2);
}`}
              language="css"
            />
          </div>

          <div className="">
            <h2 className="font-semibold text-gray-800">Custom Label Text</h2>
            <p className="text-gray-600 mb-2">
              The default text on the Sniper Link button is &quot;Open in
              &quot;provider&quot; &quot;, but you can change it using the{" "}
              <code className="bg-gray-100 px-1 rounded">template</code>{" "}
              attribute:
            </p>
            <CodeBlock
              code={`<sniper-link
  recipient="me@gmail.com"
  sender="justin@buttondown.email"
  template="Confirm email using {provider}"
></sniper-link>`}
              language="html"
            />
          </div>

          <div className="">
            <h2 className="font-semibold text-gray-800">API Usage</h2>
            <p className="text-gray-600 mb-2">
              If you want to create your own custom button, you can directly
              depend on our API:
            </p>
            <CodeBlock
              code={`GET https://sniperl.ink/v1/render?recipient={recipient}&sender={sender}`}
              language="http"
            />
            <p className="text-gray-600 mb-2">
              The response will look like this:
            </p>
            <CodeBlock
              code={`{
  "url": "https://...",
  "image": "https://sniperl.ink/logos/gmail.png",
  "provider_pretty": "Gmail"
}`}
              language="json"
            />
          </div>

          <div className="">
            <h2 className="font-semibold text-gray-800">FAQ?</h2>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-gray-800">
                  What email providers do you support?
                </p>
                <p className="text-gray-600">
                  Gmail, Yahoo, Proton, iCloud, Outlook, HEY, AOL, and Mail.ru,
                  to start. We&apos;re also monitoring for new providers and
                  will add them as they come up. Let us know if there&apos;s a
                  provider you&apos;d like us to add!
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  What platforms do you support?
                </p>
                <p className="text-gray-600">
                  The redirects are based on the device being used: desktop,
                  iOS, and Android are supported!
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  What happens with unrecognized providers?
                </p>
                <p className="text-gray-600">
                  When the email provider cannot be determined, the sniper-link
                  element will have a{" "}
                  <code className="bg-gray-100 px-1 rounded">hidden</code>{" "}
                  attribute. This attribute can be used for styling the button
                  or the adjacent elements.
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  Are you doing anything nefarious with my subscribers?
                </p>
                <p className="text-gray-600">Nope. Don&apos;t want &apos;em.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  I still do not trust you. Can I just supply a domain instead
                  of the full email address?
                </p>
                <p className="text-gray-600">Yup.</p>
              </div>
            </div>
          </div>

          <div className="">
            <h2 className="font-semibold text-gray-800">Behind the Scenes</h2>
            <p className="text-gray-600 mb-2">
              Here&apos;s how Sniper Link works:
            </p>
            <ul className="text-gray-600 space-y-1">
              <li>
                • First we check whether the domain of the email address is
                obvious (i.e. it ends in{" "}
                <code className="bg-gray-100 px-1 rounded">@gmail.com</code> or
                similar).
              </li>
              <li>
                • If the domain is not obvious, we do a DNS lookup to try to
                determine what email provider is being used for the domain.
              </li>
              <li>
                • Then, we determine the user&apos;s platform (desktop, iOS, or
                Android) in order to provide the best possible URL for their
                provider and platform.
              </li>
              <li>
                • Finally, we serve the detected provider and URL to the user
                via the{" "}
                <code className="bg-gray-100 px-1 rounded">
                  &lt;sniper-link&gt;
                </code>{" "}
                component or API response.
              </li>
            </ul>
          </div>

          <div className="">
            <h2 className="font-semibold text-gray-800">Who built this?</h2>
            <p className="text-gray-600">
              Your friends at{" "}
              <a
                href="https://buttondown.com?utm_source=sniper-link"
                className="text-green-600 hover:text-green-800"
              >
                Buttondown
              </a>
              , and they even made it{" "}
              <a
                href="https://github.com/buttondown/sniper-link"
                className="text-green-600 hover:text-green-800"
              >
                open source
              </a>
              . Thanks to{" "}
              <a
                href="https://growth.design/sniper-link"
                className="text-green-600 hover:text-green-800"
              >
                Dan & Louis-Xavier
              </a>{" "}
              for the idea.
            </p>
            <p className="text-gray-600 mt-2">
              For support, email{" "}
              <a
                href="mailto:support@buttondown.com"
                className="text-green-600 hover:text-green-800"
              >
                support@buttondown.com
              </a>
              .
            </p>
          </div>
        </div>

        <div className="hidden lg:block flex-1">
          <div className="flex h-[calc(100vh)] overflow-y-hidden p-32 sticky top-0 flex-col">
            <Demo />
          </div>
        </div>

        {/* Mobile Demo Section - Shown only on small screens */}
        <div className="lg:hidden p-8 pt-0 sticky bottom-0 -mx-4 -mb-4">
          <Demo />
        </div>
      </div>
    </div>
  );
}
