Install shadcn/typeset in this project.

Typeset is a single stylesheet that styles rendered markdown: wrap the output in a `typeset` container and everything inside (headings, lists, tables, code, blockquotes, math) is styled. Everything outside is untouched.

1. Download https://ui.shadcn.com/typeset.css and save it as typeset.css next to the project's main CSS file (where Tailwind is imported). If the file already exists, replace it with the downloaded copy.

2. Import it in the main CSS file, after the Tailwind import:

@import "./typeset.css";

3. Load the fonts in the root layout and update the HTML element:

// app/layout.tsx import { Source_Sans_3, Roboto } from "next/font/google"

const sourceSans3 = Source_Sans_3({ subsets: \["latin"\], variable: "--font-source-sans-3", })

const roboto = Roboto({ subsets: \["latin"\], variable: "--font-roboto", })

4. Add this preset to the main CSS file, after the typeset import. If a class named .typeset-docs already exists, update its values in place. Leave any other typeset-\* presets untouched: they are separate surfaces:

.typeset-docs { --typeset-font-body: var(--font-source-sans-3); --typeset-font-heading: var(--font-source-sans-3); --typeset-font-mono: var(--font-roboto); --typeset-size: 16px; --typeset-leading: 1.75; --typeset-flow: 1.25em; }

5. Do not apply the class anywhere yet. Search the project for surfaces that render markdown or rich content: react-markdown, Streamdown, or MDX components, dangerouslySetInnerHTML with parsed markdown, prose classes, CMS content renderers. Present the candidates you find as a short list and ask the user which surface should use typeset. Then wrap only the surface they pick:

 {content}

If the picked surface already has its own typography (a prose class, styled markdown components), list those styles and let the user decide what to remove before wrapping.

Notes:

- To exclude an embedded component from typeset styles, add the not-typeset class or the data-not-typeset attribute to it.
- Verify on the surface the user picked: headings, lists, tables, and code inside the container should be styled with no classes on the content itself.
- Docs: <https://ui.shadcn.com/docs/typeset>\
  \
  :root {

    --background: oklch(1 0 0);

    --foreground: oklch(0.141 0.005 285.823);

    --card: oklch(1 0 0);

    --card-foreground: oklch(0.141 0.005 285.823);

    --popover: oklch(1 0 0);

    --popover-foreground: oklch(0.141 0.005 285.823);

    --primary: oklch(0.491 0.27 292.581);

    --primary-foreground: oklch(0.969 0.016 293.756);

    --secondary: oklch(0.967 0.001 286.375);

    --secondary-foreground: oklch(0.21 0.006 285.885);

    --muted: oklch(0.967 0.001 286.375);

    --muted-foreground: oklch(0.552 0.016 285.938);

    --accent: oklch(0.491 0.27 292.581);

    --accent-foreground: oklch(0.969 0.016 293.756);

    --destructive: oklch(0.577 0.245 27.325);

    --border: oklch(0.92 0.004 286.32);

    --input: oklch(0.92 0.004 286.32);

    --ring: oklch(0.705 0.015 286.067);

    --chart-1: oklch(0.897 0.196 126.665);

    --chart-2: oklch(0.768 0.233 130.85);

    --chart-3: oklch(0.648 0.2 131.684);

    --chart-4: oklch(0.532 0.157 131.589);

    --chart-5: oklch(0.453 0.124 130.933);

    --radius: 0.625rem;

    --sidebar: oklch(0.985 0 0);

    --sidebar-foreground: oklch(0.141 0.005 285.823);

    --sidebar-primary: oklch(0.541 0.281 293.009);

    --sidebar-primary-foreground: oklch(0.969 0.016 293.756);

    --sidebar-accent: oklch(0.967 0.001 286.375);

    --sidebar-accent-foreground: oklch(0.21 0.006 285.885);

    --sidebar-border: oklch(0.92 0.004 286.32);

    --sidebar-ring: oklch(0.705 0.015 286.067);

  }

  .dark {

    --background: oklch(0.141 0.005 285.823);

    --foreground: oklch(0.985 0 0);

    --card: oklch(0.21 0.006 285.885);

    --card-foreground: oklch(0.985 0 0);

    --popover: oklch(0.21 0.006 285.885);

    --popover-foreground: oklch(0.985 0 0);

    --primary: oklch(0.432 0.232 292.759);

    --primary-foreground: oklch(0.969 0.016 293.756);

    --secondary: oklch(0.274 0.006 286.033);

    --secondary-foreground: oklch(0.985 0 0);

    --muted: oklch(0.274 0.006 286.033);

    --muted-foreground: oklch(0.705 0.015 286.067);

    --accent: oklch(0.432 0.232 292.759);

    --accent-foreground: oklch(0.969 0.016 293.756);

    --destructive: oklch(0.704 0.191 22.216);

    --border: oklch(1 0 0 / 10%);

    --input: oklch(1 0 0 / 15%);

    --ring: oklch(0.552 0.016 285.938);

    --chart-1: oklch(0.897 0.196 126.665);

    --chart-2: oklch(0.768 0.233 130.85);

    --chart-3: oklch(0.648 0.2 131.684);

    --chart-4: oklch(0.532 0.157 131.589);

    --chart-5: oklch(0.453 0.124 130.933);

    --sidebar: oklch(0.21 0.006 285.885);

    --sidebar-foreground: oklch(0.985 0 0);

    --sidebar-primary: oklch(0.606 0.25 292.717);

    --sidebar-primary-foreground: oklch(0.969 0.016 293.756);

    --sidebar-accent: oklch(0.274 0.006 286.033);

    --sidebar-accent-foreground: oklch(0.985 0 0);

    --sidebar-border: oklch(1 0 0 / 10%);

    --sidebar-ring: oklch(0.552 0.016 285.938);

  }