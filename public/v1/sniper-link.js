const DEV = false && location.host === "localhost:3040";
const HOST = DEV ? "http://localhost:3040" : "https://sniperl.ink";

class SniperLink extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    const template = document.createElement("template");
    template.innerHTML = `<div part="container"></div>
    <style>
      [part="container"] {
        display: block;
        width: max-content;
      }

      [part="button"] {
        display: flex;
        align-items: center;
        column-gap: 10px;
        background-color: ${this.COLORS.gray[50]};
        border: 1px solid ${this.COLORS.gray[200]};
        padding: 8px 14px;
        border-radius: 8px;
        text-decoration: none;
        filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.05));
      }

      [part="image"] {
        width: 24px;
        height: 24px;
        object-fit: contain;
      }

      [part="text"] {
        font-size: 16px;
        font-family: system-ui, sans-serif;
        font-weight: 700;
        color: ${this.COLORS.gray[800]};
        margin: 0;
      }

      [part="loading"] {
        height: 24px;
        width: 24px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' fill='%23a3a3a3' viewBox='0 0 256 256'%3E%3Cpath d='M236,128a108,108,0,0,1-216,0c0-42.52,24.73-81.34,63-98.9A12,12,0,1,1,93,50.91C63.24,64.57,44,94.83,44,128a84,84,0,0,0,168,0c0-33.17-19.24-63.43-49-77.09A12,12,0,1,1,173,29.1C211.27,46.66,236,85.48,236,128Z'%3E%3C/path%3E%3C/svg%3E");
        background-size: 20px;
        background-repeat: no-repeat;
        background-position: center;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>`;

    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.container = this.shadowRoot.querySelector("div");

    this.requestCache = {};
    this.requestInFlight = false;
  }

  get recipient() {
    const email = this.getAttribute("recipient");
    // Handle plus-addressed emails by removing everything between + and @
    if (email && email.includes("+") && email.includes("@")) {
      const [localPart, domain] = email.split("@");
      const basePart = localPart.split("+")[0];
      return `${basePart}@${domain}`;
    }
    return email;
  }

  set recipient(value) {
    if (value) {
      this.setAttribute("recipient", value);
    } else {
      this.removeAttribute("recipient");
    }
  }

  get sender() {
    return this.getAttribute("sender");
  }

  set sender(value) {
    if (value) {
      this.setAttribute("sender", value);
    } else {
      this.removeAttribute("sender");
    }
  }

  get templateText() {
    return this.getAttribute("template") ?? "Open in {provider}";
  }

  set template(value) {
    if (value) {
      this.setAttribute("template", value);
    } else {
      this.removeAttribute("template");
    }
  }

  async fetchData() {
    const originalEmail = this.getAttribute("recipient");
    const cacheKey = `${originalEmail}_${this.sender}`;

    if (this.requestCache[cacheKey]) {
      return this.requestCache[cacheKey];
    }

    this.container.appendChild(
      this.element(
        "div",
        { part: "button" },
        this.element("div", { part: "loading" })
      )
    );

    const response = await fetch(
      `${HOST}/v1/render?recipient=${this.recipient}&sender=${this.sender}&source=webcomponent`
    );

    const json = await response.json();
    const payload = { json, status: response.status };
    this.requestCache[cacheKey] = payload;
    return payload;
  }

  async render() {
    if (!this.recipient || !this.sender) {
      console.warn(
        "[Sniper Link] Missing required attributes (recipient, sender)"
      );
      return;
    }

    if (this.requestInFlight) {
      return;
    }

    this.requestInFlight = true;
    const { json, status } = await this.fetchData();
    this.requestInFlight = false;

    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }

    // Potentially un-hide from last render.
    this.removeAttribute("hidden");

    if (status !== 200) {
      console.warn("[Sniper Link]", json.detail, json.metadata);

      if (json.code === "unknown_email_provider") {
        this.setAttribute("hidden", "hidden");
      }

      return;
    }

    this.container.appendChild(
      this.element(
        "a",
        {
          part: "button",
          href: json.url,
          target: "_blank",
        },
        [
          this.element("img", { part: "image", src: json.image }),
          this.element(
            "p",
            { part: "text" },
            this.templateText.replace(/{provider}/g, json.provider_pretty)
          ),
        ]
      )
    );
  }

  async connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ["recipient", "sender", "template"];
  }

  attributeChangedCallback() {
    this.render();
  }

  get COLORS() {
    return {
      // Stolen from Tailwind's "neutral"
      gray: {
        50: "#fafafa",
        100: "#f5f5f5",
        200: "#e5e5e5",
        300: "#d4d4d4",
        400: "#a3a3a3",
        500: "#737373",
        600: "#525252",
        700: "#404040",
        800: "#262626",
        900: "#171717",
        950: "#0a0a0a",
      },
    };
  }

  element(tag, attributes, children) {
    const el = document.createElement(tag);

    for (const [key, value] of Object.entries(attributes)) {
      if (key === "onClick") {
        el.addEventListener("click", value);
        continue;
      }

      el.setAttribute(key, value);
    }

    if (children) {
      if (typeof children === "string") {
        el.innerText = children;
      } else if (Array.isArray(children)) {
        children.forEach((child) => {
          el.appendChild(child);
        });
      } else {
        el.appendChild(children);
      }
    }

    return el;
  }
}

window.customElements.define("sniper-link", SniperLink);
