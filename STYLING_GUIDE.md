# Styling Guide for Component Packages with Tailwind CSS

When creating a component package with Tailwind CSS that will be imported into other React/Next.js apps, you need to ensure the consuming app can properly process the Tailwind classes.

## Problem

Tailwind CSS uses a content scanning system. If the consuming app's Tailwind config doesn't include your package's files, the classes won't be included in the final CSS bundle, resulting in missing styles.

## Solutions

### Solution 1: Configure Consuming App's Tailwind Config (Recommended)

**In the consuming app's `tailwind.config.js` or `tailwind.config.ts`:**

Add your package's source files to the `content` array:

```typescript
// tailwind.config.ts
export default {
  content: [
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    // Include your package's source files
    '../../your-package/src/**/*.{ts,tsx,js,jsx}',
    // Or if installed via npm
    './node_modules/@your-org/your-package/src/**/*.{ts,tsx,js,jsx}',
  ],
  // ... rest of config
}
```

**Pros:**
- ✅ Works with any React/Next.js app
- ✅ Allows consuming app to customize Tailwind theme
- ✅ No build step needed for styles
- ✅ Tree-shaking works correctly

**Cons:**
- ❌ Requires manual configuration in each consuming app
- ❌ Consuming app must have Tailwind configured

### Solution 2: Export Pre-compiled CSS (Alternative)

**In your package:**

1. Build a CSS file during package build:

```javascript
// package.json
{
  "scripts": {
    "build:css": "tailwindcss -i ./src/styles/globals.css -o ./dist/styles.css --minify"
  }
}
```

2. Export the CSS file:

```json
// package.json
{
  "exports": {
    "./styles": "./dist/styles.css"
  }
}
```

3. **In the consuming app:**

```typescript
// app/layout.tsx or _app.tsx
import '@your-org/your-package/styles'
```

**Pros:**
- ✅ No Tailwind config needed in consuming app
- ✅ Works with any framework (React, Vue, etc.)
- ✅ Simpler setup for consumers

**Cons:**
- ❌ Larger bundle size (includes all classes)
- ❌ No tree-shaking
- ❌ Consuming app can't customize theme easily
- ❌ Requires build step

### Solution 3: Use CSS Modules or Styled Components (Not Recommended for Tailwind)

If you need complete style isolation, consider CSS Modules or styled-components, but this defeats the purpose of using Tailwind.

## Best Practice: Hybrid Approach

**Recommended setup for `@chia/wallet-connect`:**

1. **Export both source CSS and compiled CSS:**

```json
// package.json
{
  "exports": {
    ".": "./dist/index.js",
    "./styles": "./src/styles/globals.css",  // For Tailwind-aware apps
    "./styles-compiled": "./dist/styles.css" // For non-Tailwind apps
  }
}
```

2. **Document both approaches in README:**

```markdown
## Styling Setup

### For Tailwind-enabled apps (Recommended):
1. Add to your `tailwind.config.js`:
```js
content: [
  './node_modules/@chia/wallet-connect/src/**/*.{ts,tsx}',
]
```
2. Import styles:
```ts
import '@chia/wallet-connect/styles'
```

### For non-Tailwind apps:
```ts
import '@chia/wallet-connect/styles-compiled'
```
```

## Current Implementation

The `@chia/wallet-connect` package currently uses **Solution 1**:

- Exports source CSS: `@chia/wallet-connect/styles` → `src/styles/globals.css`
- Consuming apps must:
  1. Add package source to Tailwind `content` array
  2. Import the styles: `import '@chia/wallet-connect/styles'`

## Example: pengui Configuration

```typescript
// pengui/tailwind.config.ts
export default {
  content: [
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    // Include chia-wallet-connect package
    '../../chia-wallet-connect/src/**/*.{ts,tsx,js,jsx}',
    './node_modules/@chia/wallet-connect/src/**/*.{ts,tsx,js,jsx}',
  ],
  // ... rest of config
}
```

## Troubleshooting

### Styles not appearing?

1. ✅ Check that package files are in Tailwind `content` array
2. ✅ Verify styles are imported: `import '@chia/wallet-connect/styles'`
3. ✅ Check browser DevTools - are classes present but not styled? (Tailwind not scanning)
4. ✅ Rebuild the consuming app after config changes
5. ✅ Check for CSS conflicts or specificity issues

### Custom colors not working?

Make sure the consuming app's Tailwind config includes your package's custom theme extensions, or merge the configs.
