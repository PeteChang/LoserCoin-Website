# Loser Coin Foundation Website

A lightweight, static website for the **Loser Coin Foundation** featuring an informative whitepaper-style landing page and a community-powered message board.

## Structure

- `index.html` &mdash; Foundation whitepaper content with mission, tokenomics, roadmap, and governance sections.
- `message-board.html` &mdash; Community message board with local storage so visitors can leave notes from their browser.
- `styles.css` &mdash; Shared styling that gives both pages a cohesive identity.
- `message-board.js` &mdash; Handles message persistence and rendering logic.

## Development

Open the HTML files directly in a browser or serve the directory with any static file server, e.g.:

```bash
npx serve .
```

Messages submitted on the board are saved to each visitor's browser via `localStorage`, keeping the experience private and simple to host.
