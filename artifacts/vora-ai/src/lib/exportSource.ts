/**
 * Splits a single-file generated HTML document into a real
 * source-tree (index.html + styles.css + script.js + README.md +
 * package.json + vercel.json) and injects the "Built with Vora AI"
 * badge unless the caller is the Owner who has stripped it.
 */

const BADGE_MARK = "data-vora-badge";

function escapeForCss(s: string): string {
  return s.replace(/<\/style>/gi, "<\\/style>");
}
function escapeForJs(s: string): string {
  return s.replace(/<\/script>/gi, "<\\/script>");
}

function buildBadgeSnippet(): { style: string; html: string } {
  const style = `
/* Vora AI viral badge */
[${BADGE_MARK}]{position:fixed;bottom:14px;right:14px;z-index:2147483647;
  font:600 11px/1 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;
  text-decoration:none;display:inline-flex;align-items:center;gap:6px;
  padding:8px 12px;border-radius:9999px;color:#fff;
  background:linear-gradient(135deg,#06b6d4 0%,#7c3aed 100%);
  box-shadow:0 8px 24px rgba(124,58,237,.35),0 0 0 1px rgba(255,255,255,.1) inset;
  letter-spacing:.02em;backdrop-filter:blur(8px);}
[${BADGE_MARK}] svg{width:12px;height:12px;display:block}
[${BADGE_MARK}]:hover{transform:translateY(-1px);transition:transform .15s ease}
`;
  const html = `<a ${BADGE_MARK} href="https://vora.ai" target="_blank" rel="noopener noreferrer" aria-label="Built with Vora AI">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 19 21 12 17 5 21 12 2"></polygon></svg>
Built with Vora AI
</a>`;
  return { style, html };
}

export interface SplitProject {
  indexHtml: string;
  stylesCss: string;
  scriptJs: string;
  readmeMd: string;
  packageJson: string;
  vercelJson: string;
}

export interface SplitOptions {
  title: string;
  prompt: string;
  /** When true, the viral badge is NOT injected. Only available to Owner. */
  stripBadge?: boolean;
}

export function splitProject(rawHtml: string, opts: SplitOptions): SplitProject {
  const title = (opts.title || "Vora Project").trim();
  const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "vora-project";

  let html = rawHtml || "";

  // Extract every <style>…</style> block into styles.css
  const styles: string[] = [];
  html = html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_m, css: string) => {
    styles.push(css.trim());
    return "";
  });

  // Extract every <script> block that isn't a CDN or external src
  const scripts: string[] = [];
  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (_m, attrs: string, body: string) => {
    if (/\bsrc\s*=/.test(attrs)) {
      // External script — keep it inline (e.g. Tailwind CDN, Alpine, etc.)
      return `<script${attrs}>${body}</script>`;
    }
    if (body.trim()) scripts.push(body.trim());
    return "";
  });

  // Inject viral badge for non-owner exports
  let badgeStyle = "";
  let badgeHtml = "";
  if (!opts.stripBadge) {
    const { style, html: bh } = buildBadgeSnippet();
    badgeStyle = style;
    badgeHtml = bh;
  }

  const combinedCss = [badgeStyle.trim(), ...styles].filter(Boolean).join("\n\n");
  const combinedJs = scripts.join("\n\n;\n");

  // Re-link styles.css and script.js into <head>/end of <body>
  const linkTag = combinedCss ? `<link rel="stylesheet" href="./styles.css" />` : "";
  const scriptTag = combinedJs ? `<script src="./script.js" defer></script>` : "";

  if (/<\/head>/i.test(html)) {
    html = html.replace(/<\/head>/i, `${linkTag}\n${scriptTag}\n</head>`);
  } else if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head[^>]*>/i, (m) => `${m}\n${linkTag}\n${scriptTag}`);
  } else {
    html = `<head>\n${linkTag}\n${scriptTag}\n</head>\n` + html;
  }

  if (badgeHtml) {
    if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, `${badgeHtml}\n</body>`);
    } else {
      html = `${html}\n${badgeHtml}`;
    }
  }

  const indexHtml = html.trim() + "\n";
  const stylesCss = combinedCss ? escapeForCss(combinedCss) + "\n" : "";
  const scriptJs = combinedJs ? escapeForJs(combinedJs) + "\n" : "";

  const readmeMd = [
    `# ${title}`,
    "",
    `> Built with **Vora AI** — your AI website builder.`,
    "",
    `## Original prompt`,
    "",
    "```",
    opts.prompt || "(no prompt recorded)",
    "```",
    "",
    `## Project structure`,
    "",
    "```",
    `${safeName}/`,
    `├── index.html      # Markup (Tailwind via CDN)`,
    stylesCss ? `├── styles.css     # Extracted page styles` : "",
    scriptJs ? `├── script.js      # Page interactivity` : "",
    `├── package.json    # NPM metadata`,
    `├── vercel.json     # Vercel config (clean URLs)`,
    `└── README.md`,
    "```",
    "",
    `## Deploy to Vercel`,
    "",
    "1. Drag this folder into [vercel.com/new](https://vercel.com/new)",
    "2. Or run `vercel --prod` from this directory.",
    "",
    `## Run locally`,
    "",
    "Just open `index.html` in a browser, or:",
    "",
    "```bash",
    "npx serve .",
    "```",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  const packageJson = JSON.stringify(
    {
      name: safeName,
      version: "1.0.0",
      private: true,
      description: `Built with Vora AI — ${opts.prompt?.slice(0, 80) ?? ""}`.trim(),
      scripts: {
        start: "npx serve .",
        deploy: "vercel --prod",
      },
    },
    null,
    2
  );

  const vercelJson = JSON.stringify(
    {
      cleanUrls: true,
      trailingSlash: false,
      headers: [
        {
          source: "/(.*)",
          headers: [
            { key: "X-Built-With", value: "Vora AI" },
            { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          ],
        },
      ],
    },
    null,
    2
  );

  return { indexHtml, stylesCss, scriptJs, readmeMd, packageJson, vercelJson };
}
