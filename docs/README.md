📢 Use this project, [contribute](https://github.com/{OrganizationName}/{AppName}) to it or open issues to help evolve it using [Store Discussion](https://github.com/vtex-apps/store-discussion).

# Cronometer Countdown App

VTEX IO app (React + Store) that renders a **countdown** to a future date and time. Output is plain text in the form `01d : 02h : 16m : 53s` (two digits per unit), configurable via props and the Site Editor.

**App dependency:** [`vtex.css-handles`](https://github.com/vtex-apps/css-handles) is declared in this app’s `manifest.json` (`1.x`); VTEX IO resolves it at link/publish time (it is not published on the public npm registry).

For implementation notes, SSR trade-offs, and follow-ups, see the [Development Log](./DEVELOPMENT_LOG.md).

## Features

- Live countdown (updates every second).
- **SSR-safe:** no `window` usage; the interval runs only inside `useEffect` using global `setInterval` / `clearInterval`.
- Date in **DD/MM/YYYY** (day / month / four-digit year) and time in **HH:mm:ss** (no milliseconds in the input).
- Explicit **time zone** (`timezone`, IANA ID) so the target is interpreted as wall-clock time in that region—consistent target instant between render server and browser.
- Custom **separator** between units (e.g. ` : ` or ` | `).
- Invalid-format message via **i18n** (`store/countdown.invalidFormat` in `messages/{en,pt,es}.json` and `defaultMessage` in code).
- Optional **`classes`** prop for `useCustomClasses` from parent blocks (not exposed in the Site Editor schema).
- **CSS Handles:** uses [`useCssHandles`](https://developers.vtex.com/docs/apps/vtex.css-handles) (returns `{ handles, withModifiers }` — class names are taken from **`handles`**). If the storefront runtime does not populate a handle, the component falls back to predictable classes with prefix **`sunhouse-cron-app-0-x-`** plus the handle name (e.g. `sunhouse-cron-app-0-x-container`). If you bump the app **major** in `manifest.json`, update the constant `CSS_HANDLES_APP_NS` in `react/Countdown.tsx` so fallback selectors stay in sync.

## Configuration

### 1. Theme dependency

In the **store theme** `manifest.json`, add:

```json
"dependencies": {
  "sunhouse.cron-app": "0.x"
}
```

Adjust the major version to match what is published on your account.

### 2. Using the block

Declare the `cron-countdown` block in the desired template (`blocks.json` / `blocks.jsonc`) or as a child of another block that accepts content.

**Minimal example:**

```json
"cron-countdown": {
  "props": {
    "targetDate": "04/04/2026",
    "targetTime": "16:45:33",
    "timezone": "America/Sao_Paulo",
    "separator": " : "
  }
}
```

**Custom page example:**

```json
{
  "store.custom#promo-countdown": {
    "blocks": ["flex-layout.row#countdown-row"]
  },
  "flex-layout.row#countdown-row": {
    "children": ["cron-countdown"]
  },
  "cron-countdown": {
    "props": {
      "targetDate": "04/04/2026",
      "targetTime": "16:45:33"
    }
  }
}
```

### 3. Development

From the app directory:

```bash
vtex link
```

After changing dependencies or blocks in the theme, run `vtex link` in the theme repository as well.

## Blocks

| Block name       | Description |
| ---------------- | ----------- |
| `cron-countdown` | Countdown to `targetDate` + `targetTime` in the given `timezone`. |

## Props — `cron-countdown`

### Site Editor (`Countdown.schema`)

| Prop name    | Type     | Description | Default value |
| ------------ | -------- | ----------- | ------------- |
| `targetDate` | `string` | Target date in **DD/MM/YYYY** (e.g. `04/04/2026`). | `04/04/2026` |
| `targetTime` | `string` | Target time in **HH:mm:ss** (e.g. `16:45:33`). | `16:45:33` |
| `separator`  | `string` | Text between each unit (days, hours, minutes, seconds). E.g. ` : ` or ` \| `. | ` : ` |
| `timezone`   | `string` | IANA time zone ID (e.g. `America/Sao_Paulo`, `America/New_York`, `Europe/Lisbon`). | `America/Sao_Paulo` |

### Code-only (not in schema)

| Prop name | Type | Description |
| --------- | ---- | ----------- |
| `classes` | `Record<string, unknown>` (optional) | Passed through to `useCssHandles` so a parent block using **`useCustomClasses`** can override handle class names. |

Common VTEX prop types: `string`, `enum`, `number`, `boolean`, `object`, `array`.

## Behavior

- The end instant is computed as **wall-clock** date/time in the configured `timezone`, converted internally to UTC (`Intl.DateTimeFormat` + iterative correction; no extra date library). The remaining time uses `Date.now()` relative to that instant.
- If `targetDate` / `targetTime` are malformed, if `timezone` is invalid for `Intl`, or if the wall time cannot be resolved (e.g. some DST edge cases), the block shows the invalid-format message (`store/countdown.invalidFormat`).
- At zero, the display stays at `00d`, `00h`, `00m`, `00s`.

## Customization (CSS handles)

To apply CSS customizations in this and other blocks, follow [Using CSS handles for store customization](https://vtex.io/docs/recipes/style/using-css-handles-for-store-customization). The hook API is documented in [`vtex.css-handles`](https://developers.vtex.com/docs/apps/vtex.css-handles).

| CSS handles |
| ----------- |
| `container` |
| `separator` |
| `timeUnit`  |

In the markup: `container` wraps everything; each `Xd` / `Xh` / `Xm` / `Xs` segment uses `timeUnit`; between each pair of units there is a **`separator` handle** whose **text node** is the `separator` **prop** value (so merchants can style the gap independently of the string).

**Class names in the DOM:** when the VTEX render runtime provides extension metadata, the CSS classes are generated by `vtex.css-handles` (scoped to this app). If a handle would otherwise be empty, this app uses the fallback pattern **`sunhouse-cron-app-0-x-<handle>`** (e.g. `sunhouse-cron-app-0-x-timeUnit`), matching `sunhouse.cron-app@0.x` in the manifest. After changing the published **major** version, update `CSS_HANDLES_APP_NS` in `react/Countdown.tsx` (and adjust theme CSS if you relied on the old prefix).

<!-- DOCS-IGNORE:start -->

## Contributors ✨

Thanks goes to these wonderful people:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind are welcome!

<!-- DOCS-IGNORE:end -->

----
