# Sniper Link

After someone submits their email address, show a button that takes them straight to their inbox to confirm their email.

Sniper Link is a free, open-source tool that helps increase email confirmation rates by detecting the user's email provider and providing a direct link to their inbox.

## Installation

### Using the hosted version

Simply include the script tag in your HTML:

```html
<script src="https://sniperl.ink/v1/sniper-link.js" defer></script>
```

### Self-hosting

1. Clone this repository:
```bash
git clone https://github.com/buttondown/sniper-link.git
cd sniper-link
```

2. Install dependencies:
```bash
bun install
```

3. Build the project:
```bash
bun build
```

4. Deploy the `public` directory and the Next.js application.

## Usage

```html
<sniper-link
  recipient="me@example.com"
  sender="justin@buttondown.email"
></sniper-link>

<script src="https://sniperl.ink/v1/sniper-link.js"></script>
```

## Styling

You can override all styles of the Sniper Link button.

There are a few parts to the button: a `button` element, which contains an `image` (the logo of the provider) and `text` (which says “Open in {Provider}”), and a `container` that holds the `button`. While loading, a `button` is rendered with a `loading` element inside whose background-image is an SVG loading spinner.

You can override the styles by adding CSS that uses the `::part` selector and our names for the elements (`container`, `button`, `image`, and `text`):

```css
sniper-link::part(container) {
}

sniper-link::part(button) {
}

sniper-link::part(image) {
}

sniper-link::part(text) {
}

sniper-link::part(loading) {
}
```

### Unrecognized providers

If the provider of an email address can't be discerned or isn't supported, the `sniper-link` element will receive a `hidden` attribute. You can use this attribute to style the button in this case (usually hide, if the browser doesn't do this by default).

## Customizing text

By default, the text says “Open in {provider}”. You can customize this:

```html
<sniper-link
  recipient="me@example.com"
  sender="justin@buttondown.email"
  template="Confirm email using {provider}"
></sniper-link>
```

## Development

To run the development server:

```bash
bun dev
```

The application will be available at `http://localhost:3040`.

## Supported Email Providers

Sniper Link supports the following email providers:
- Gmail
- Yahoo
- Proton
- iCloud
- Outlook
- HEY
- AOL
- Mail.ru

These providers account for over 85% of email traffic.

## API

You can also use Sniper Link via API:

```javascript
fetch(`https://sniperl.ink/v1/render?recipient=${recipient}&sender=${sender}`)
  .then(response => response.json())
  .then(data => {
    // Use data.url to redirect the user
  });
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

Inspired by [Sniper Links: How To Increase Your Email Confirmation Rates](https://growth.design/sniper-link) from growth.design.
