# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:import-analysis] Failed to resolve import \"@/core/components/ui/scroll-area\" from \"src/modules/users/components/UserPermissionsManager.tsx\". Does the file exist?"
  - generic [ref=e5]: /Users/ujang/Projects/Burangrang/hse-dashboard/frontend/src/modules/users/components/UserPermissionsManager.tsx:7:27
  - generic [ref=e6]: "26 | import { Checkbox } from '@/core/components/ui/checkbox'; 27 | import { Input } from '@/core/components/ui/input'; 28 | import { ScrollArea } from '@/core/components/ui/scroll-area'; | ^ 29 | import { Badge } from '@/core/components/ui/badge'; 30 | import { useUserPermissions } from '../hooks/useUserPermissions';"
  - generic [ref=e7]: at TransformPluginContext._formatError (file:///Users/ujang/Projects/Burangrang/hse-dashboard/frontend/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:49258:41) at TransformPluginContext.error (file:///Users/ujang/Projects/Burangrang/hse-dashboard/frontend/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:49253:16) at normalizeUrl (file:///Users/ujang/Projects/Burangrang/hse-dashboard/frontend/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:64307:23) at async file:///Users/ujang/Projects/Burangrang/hse-dashboard/frontend/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:64439:39 at async Promise.all (index 9) at async TransformPluginContext.transform (file:///Users/ujang/Projects/Burangrang/hse-dashboard/frontend/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:64366:7) at async PluginContainer.transform (file:///Users/ujang/Projects/Burangrang/hse-dashboard/frontend/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:49099:18) at async loadAndTransform (file:///Users/ujang/Projects/Burangrang/hse-dashboard/frontend/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:51978:27) at async viteTransformMiddleware (file:///Users/ujang/Projects/Burangrang/hse-dashboard/frontend/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:62106:24
  - generic [ref=e8]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e9]: server.hmr.overlay
    - text: to
    - code [ref=e10]: "false"
    - text: in
    - code [ref=e11]: vite.config.ts
    - text: .
```