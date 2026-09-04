# OpenCode Plugins Specification

## Overview

Plugins provide shared logic, APIs, and integrations that can be reused across skills. They extend capabilities beyond what native tools provide.

## Plugin Architecture

### Plugin Bundle

Each plugin is a self-contained bundle:
```
plugin-name/
├── package.json           # Plugin manifest
├── index.js               # Plugin entry point
└── dist/                  # Compiled files
```

### Plugin Manifest

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "main": "dist/index.js"
}
```

## Configuration

### In opencode.json

```json
{
  "plugin": [
    "file:///path/to/plugin/dist/index.js",
    "npm:my-plugin"
  ]
}
```

### Plugin Sources

| Source | Format | Example |
|--------|--------|---------|
| Local file | `file://` | `file:///path/to/plugin/dist/index.js` |
| npm package | `npm:` | `npm:@opencode/plugin-github` |
| GitHub repo | `github:` | `github:org/repo` |

## Plugin Interface

### Plugin API

Plugins must export an interface:

```javascript
module.exports = {
  name: "my-plugin",
  version: "1.0.0",
  
  // Plugin initialization
  init(context) {
    // Initialize plugin
  },
  
  // Provide tools
  tools: [
    {
      name: "my-tool",
      description: "Tool description",
      parameters: {
        type: "object",
        properties: {
          input: { type: "string" }
        }
      },
      async execute(params) {
        // Tool logic
        return { result: "success" };
      }
    }
  ],
  
  // Provide hooks
  hooks: [
    {
      name: "my-hook",
      event: "file.write",
      async execute(context) {
        // Hook logic
      }
    }
  ]
};
```

## Plugin Types

### Tool Plugins

Provide additional tools to agents:

```javascript
module.exports = {
  tools: [
    {
      name: "github-create-issue",
      description: "Create a GitHub issue",
      async execute({ title, body, labels }) {
        // GitHub API call
        return { issue: { number: 123 } };
      }
    }
  ]
};
```

### Hook Plugins

Register hooks for file operations:

```javascript
module.exports = {
  hooks: [
    {
      name: "lint-on-save",
      event: "file.write",
      async execute({ filePath }) {
        // Run linter
        const result = await runLinter(filePath);
        return { success: true };
      }
    }
  ]
};
```

### Integration Plugins

Connect to external services:

```javascript
module.exports = {
  tools: [
    {
      name: "slack-send-message",
      async execute({ channel, message }) {
        // Slack API call
      }
    }
  ],
  hooks: [
    {
      name: "notify-on-deploy",
      event: "deploy.complete",
      async execute({ deployment }) {
        // Send notification
      }
    }
  ]
};
```

## Plugin Discovery

### Automatic Discovery

Plugins in `node_modules/` are automatically discovered:
```
.opencode/
├── node_modules/
│   └── my-plugin/
│       ├── package.json
│       └── dist/
│           └── index.js
└── opencode.json
```

### Manual Registration

Explicitly list plugins in `opencode.json`:
```json
{
  "plugin": [
    "file:///path/to/custom-plugin/dist/index.js"
  ]
}
```

## Best Practices

### 1. Keep Plugins Small

Each plugin should do one thing well:
- Tool plugins: Provide one or two tools
- Hook plugins: Handle one event type
- Integration plugins: Connect to one service

### 2. Use TypeScript

Type safety prevents bugs:
```typescript
import type { Plugin, Tool, Hook } from "@opencode/sdk";

const plugin: Plugin = {
  name: "my-plugin",
  tools: [
    {
      name: "my-tool",
      async execute(params: MyParams): Promise<MyResult> {
        // Type-safe implementation
      }
    }
  ]
};

export default plugin;
```

### 3. Document Plugins

Provide clear documentation:
```markdown
# My Plugin

## Description
Brief description of what the plugin does.

## Tools
- `my-tool`: Description of the tool

## Hooks
- `my-hook`: Description of the hook

## Configuration
How to configure the plugin.
```

### 4. Test Plugins

```javascript
describe("My Plugin", () => {
  it("should provide tools", () => {
    expect(plugin.tools).toHaveLength(1);
    expect(plugin.tools[0].name).toBe("my-tool");
  });
  
  it("should execute tools", async () => {
    const result = await plugin.tools[0].execute({ input: "test" });
    expect(result).toEqual({ result: "success" });
  });
});
```

### 5. Version Plugins

Use semantic versioning:
```json
{
  "version": "1.0.0"
}
```

- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

## Anti-patterns

### ❌ Monolithic Plugins

```javascript
// BAD - One plugin does everything
module.exports = {
  tools: [
    { name: "github-create-issue" },
    { name: "slack-send-message" },
    { name: "database-query" },
    { name: "send-email" }
  ]
};
```

### ✅ Focused Plugins

```javascript
// GOOD - Each plugin does one thing
// github-plugin
module.exports = {
  tools: [
    { name: "github-create-issue" },
    { name: "github-list-issues" }
  ]
};
```

### ❌ Synchronous Operations

```javascript
// BAD - Blocks the agent
module.exports = {
  tools: [
    {
      async execute(params) {
        const result = syncOperation(params);
        return result;
      }
    }
  ]
};
```

### ✅ Async Operations

```javascript
// GOOD - Non-blocking
module.exports = {
  tools: [
    {
      async execute(params) {
        const result = await asyncOperation(params);
        return result;
      }
    }
  ]
};
```

## Security Considerations

### 1. Validate Inputs

Always validate plugin inputs:
```javascript
module.exports = {
  tools: [
    {
      async execute(params) {
        if (!params.input) {
          throw new Error("Missing required parameter: input");
        }
        // Proceed with validated input
      }
    }
  ]
};
```

### 2. Sandbox Execution

Run plugins in isolated environments:
- Use worker threads
- Limit file system access
- Restrict network access

### 3. Audit Plugins

Log plugin operations:
```javascript
module.exports = {
  tools: [
    {
      async execute(params) {
        console.log(`Tool executed: ${this.name}`, params);
        // Proceed with execution
      }
    }
  ]
};
```

## References

- [OpenCode Plugins](https://opencode.ai/docs/plugins/)
- [Plugin Development Guide](https://opencode.ai/docs/plugins/development/)
- [Plugin API Reference](https://opencode.ai/docs/plugins/api/)
