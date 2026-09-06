# Data boundary

`mock/viral-terminal.js` contains the temporary UI fixtures. Components consume `@/data`, never vendor SDKs or database clients directly.

When the backend is ready, keep the exported selectors (`getSignal`, `getToken`, `getCreator`) and domain collections while replacing their mock implementations with API calls, server actions, or repository adapters. `lib/launchState.js` is browser-only prototype state and must be replaced by authoritative backend reservation/launch endpoints.
