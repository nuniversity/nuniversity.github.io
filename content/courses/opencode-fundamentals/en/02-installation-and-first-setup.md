---
title: "Installation and First Setup"
description: "Install OpenCode on your system and configure it with your first LLM provider. Set up API keys, verify the installation, and run your first command."
order: 2
duration: "30 min"
difficulty: "beginner"
---

# Installation and First Setup

## Prerequisites

Before installing OpenCode, ensure you have:

| Requirement | Minimum Version | How to Check |
|------------|-----------------|--------------|
| Node.js | 18.0+ | `node --version` |
| npm | 8.0+ | `npm --version` |
| Git | 2.0+ | `git --version` |

> [!NOTE]
> OpenCode is a Node.js application distributed via npm. It runs on macOS, Linux, and Windows.

---

## Installation

### Using npm (Recommended)

```bash
npm install -g opencode
```

### Using yarn

```bash
yarn global add opencode
```

### Using pnpm

```bash
pnpm add -g opencode
```

### Verify Installation

```bash
opencode --version
```

Expected output:
```
opencode v1.x.x
```

> [!TIP]
> If you see "command not found", ensure npm's global bin directory is in your PATH.

---

## Initial Configuration

### Step 1: Create Configuration Directory

```bash
mkdir -p .opencode
```

### Step 2: Create opencode.json

Create `opencode.json` in your project root:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agents": {
    "default": {
      "model": "gpt-4o",
      "description": "General-purpose coding assistant"
    }
  }
}
```

### Step 3: Set Up API Keys

Create a `.env` file in your project root:

```bash
# OpenAI
OPENAI_API_KEY=sk-your-api-key-here

# Anthropic (optional)
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# Google (optional)
GOOGLE_API_KEY=your-google-api-key-here
```

> [!WARNING]
> Never commit API keys to version control. Add `.env` to your `.gitignore` file.

---

## Provider Configuration

### OpenAI

```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "model": "gpt-4o"
    }
  }
}
```

### Anthropic

```json
{
  "providers": {
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}",
      "model": "claude-sonnet-4-20250514"
    }
  }
}
```

### Google

```json
{
  "providers": {
    "google": {
      "apiKey": "${GOOGLE_API_KEY}",
      "model": "gemini-pro"
    }
  }
}
```

---

## First Run

### Start OpenCode

```bash
opencode
```

You should see:

```
OpenCode v1.x.x
Type your message or /help for commands
>
```

### Test the Connection

Type a simple message:

```
> Hello, can you help me with my code?
```

If successful, the AI will respond with a greeting and ask how it can help.

---

## Configuration File Locations

OpenCode searches for configuration in this order:

| Priority | Location | Purpose |
|----------|----------|---------|
| 1 | `.opencode/config.json` | Project-specific (preferred) |
| 2 | `opencode.json` | Project-specific (legacy) |
| 3 | `~/.config/opencode/config.json` | User-wide defaults |

> [!TIP]
> Use `.opencode/config.json` for team projects. You can selectively version-control it while keeping sensitive data in `.env`.

---

## Basic Commands

| Command | Description |
|---------|-------------|
| `opencode` | Start interactive session |
| `opencode --version` | Show version |
| `opencode --help` | Show help |
| `opencode config` | Open configuration |
| `opencode providers` | List available providers |

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Command not found" | npm PATH not set | Run `npm config get prefix` and add to PATH |
| "Invalid API key" | Wrong key format | Check key starts with `sk-` (OpenAI) or `sk-ant-` (Anthropic) |
| "Rate limit exceeded" | Too many requests | Wait or upgrade your API plan |
| "Model not found" | Wrong model name | Check provider documentation for valid model names |

---

## Practice Questions

```question
{
  "id": "oc-install-q1",
  "type": "multiple-choice",
  "question": "What is the minimum Node.js version required for OpenCode?",
  "options": [
    "14.0+",
    "16.0+",
    "18.0+",
    "20.0+"
  ],
  "correct": 2,
  "explanation": "OpenCode requires Node.js version 18.0 or higher for optimal performance and compatibility."
}
```

```question
{
  "id": "oc-install-q2",
  "type": "multiple-choice",
  "question": "Where should you store API keys for OpenCode?",
  "options": [
    "In the opencode.json file",
    "In environment variables or .env file",
    "In a config.json file",
    "Directly in your code"
  ],
  "correct": 1,
  "explanation": "API keys should be stored in environment variables or a .env file, never in code or config files that might be committed to version control."
}
```

```question
{
  "id": "oc-install-q3",
  "type": "multiple-choice",
  "question": "Which configuration file location is recommended for team projects?",
  "options": [
    "opencode.json in project root",
    ".opencode/config.json",
    "~/.config/opencode/config.json",
    "~/.opencode/config.json"
  ],
  "correct": 1,
  "explanation": ".opencode/config.json is preferred for team projects because it can be selectively version-controlled while keeping sensitive data separate."
}
```

```question
{
  "id": "oc-install-q4",
  "type": "multiple-choice",
  "question": "What command starts an interactive OpenCode session?",
  "options": [
    "opencode start",
    "opencode run",
    "opencode",
    "opencode init"
  ],
  "correct": 2,
  "explanation": "Running 'opencode' without arguments starts an interactive session where you can type messages and receive AI responses."
}
```

```question
{
  "id": "oc-install-q5",
  "type": "multiple-choice",
  "question": "Which package managers can be used to install OpenCode?",
  "options": [
    "Only npm",
    "npm and yarn only",
    "npm, yarn, and pnpm",
    "pip and npm"
  ],
  "correct": 2,
  "explanation": "OpenCode can be installed using npm, yarn, or pnpm — all three are supported package managers."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- OpenCode requires Node.js 18+ and can be installed via npm, yarn, or pnpm
- Configuration is stored in `opencode.json` or `.opencode/config.json`
- API keys should be stored in environment variables or `.env` files
- The `.opencode/config.json` location is preferred for team projects
- Run `opencode` to start an interactive session
- Multiple LLM providers (OpenAI, Anthropic, Google) are supported