---
title: "Understanding the CLI Interface"
description: "Master the OpenCode command-line interface. Learn all available commands, flags, options, and how to navigate the interactive session effectively."
order: 4
duration: "30 min"
difficulty: "beginner"
---

# Understanding the CLI Interface

## Command Structure

OpenCode follows a standard CLI structure:

```bash
opencode [command] [options] [arguments]
```

---

## Main Commands

| Command | Description | Example |
|---------|-------------|---------|
| `opencode` | Start interactive session | `opencode` |
| `opencode chat` | Start chat session | `opencode chat` |
| `opencode run` | Run a single prompt | `opencode run "fix the bug"` |
| `opencode config` | Manage configuration | `opencode config list` |
| `opencode providers` | List LLM providers | `opencode providers` |
| `opencode skills` | List available skills | `opencode skills` |
| `opencode version` | Show version | `opencode --version` |

---

## Interactive Session Commands

Once in an interactive session, use these commands:

### Navigation

| Command | Description |
|---------|-------------|
| `/help` | Show all available commands |
| `/quit` or `/exit` | Exit OpenCode |
| `/clear` | Clear current conversation |
| `/history` | View conversation history |
| `/save [name]` | Save session to file |
| `/load [name]` | Load saved session |

### Session Management

| Command | Description |
|---------|-------------|
| `/model [name]` | Switch LLM model |
| `/agent [name]` | Switch agent |
| `/skill [name]` | Load a specific skill |
| `/debug` | Toggle debug mode |
| `/verbose` | Toggle verbose output |

---

## Command-Line Options

### Global Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help |
| `-v, --version` | Show version |
| `-c, --config [path]` | Specify config file |
| `-p, --provider [name]` | Set LLM provider |
| `-m, --model [name]` | Set model |
| `--debug` | Enable debug mode |
| `--verbose` | Enable verbose output |

### Run Command Options

| Option | Description |
|--------|-------------|
| `-f, --file [path]` | Read input from file |
| `-o, --output [path]` | Write output to file |
| `--no-color` | Disable colored output |
| `--timeout [ms]` | Set timeout in milliseconds |

---

## Example Usage Patterns

### Single Prompt Execution

```bash
opencode run "Explain what this function does"
```

### Read from File

```bash
opencode run -f question.txt
```

### Write to File

```bash
opencode run -o answer.md "Write a README for this project"
```

### Debug Mode

```bash
opencode --debug
```

Debug output shows:
- API requests and responses
- Tool invocations
- Permission checks
- Agent routing decisions

---

## Tab Completion

OpenCode supports tab completion for:

- Commands (`/he` → `/help`)
- File paths (`/read src/ma` → `/read src/main.py`)
- Model names (`/model gpt` → `/model gpt-4o`)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Ctrl+C` | Cancel current operation |
| `Ctrl+D` | Exit session |
| `Ctrl+L` | Clear screen |
| `Up Arrow` | Previous command |
| `Down Arrow` | Next command |
| `Tab` | Auto-complete |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENCODE_CONFIG` | Path to config file |
| `OPENCODE_PROVIDER` | Default LLM provider |
| `OPENCODE_MODEL` | Default model |
| `OPENCODE_DEBUG` | Enable debug mode |
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `GOOGLE_API_KEY` | Google API key |

---

## Practice Questions

```question
{
  "id": "oc-cli-q1",
  "type": "multiple-choice",
  "question": "What command runs OpenCode with a single prompt without entering interactive mode?",
  "options": [
    "opencode start",
    "opencode exec",
    "opencode run",
    "opencode once"
  ],
  "correct": 2,
  "explanation": "The 'opencode run' command executes a single prompt and returns the result without starting an interactive session."
}
```

```question
{
  "id": "oc-cli-q2",
  "type": "multiple-choice",
  "question": "Which option enables debug mode from the command line?",
  "options": [
    "--verbose",
    "--debug",
    "--trace",
    "--log"
  ],
  "correct": 1,
  "explanation": "The --debug flag enables debug mode, which shows detailed information about API requests, tool invocations, and routing decisions."
}
```

```question
{
  "id": "oc-cli-q3",
  "type": "multiple-choice",
  "question": "How do you switch models during an interactive session?",
  "options": [
    "/use model-name",
    "/switch model-name",
    "/model model-name",
    "/set model model-name"
  ],
  "correct": 2,
  "explanation": "The /model command switches the active model during an interactive session."
}
```

```question
{
  "id": "oc-cli-q4",
  "type": "multiple-choice",
  "question": "Which keyboard shortcut cancels the current operation?",
  "options": [
    "Ctrl+Z",
    "Ctrl+C",
    "Ctrl+X",
    "Esc"
  ],
  "correct": 1,
  "explanation": "Ctrl+C cancels the current operation, which is useful when an AI response is taking too long."
}
```

```question
{
  "id": "oc-cli-q5",
  "type": "multiple-choice",
  "question": "What does the -f flag do in the run command?",
  "options": [
    "Sets the output format",
    "Reads input from a file",
    "Filters the output",
    "Forces overwrite"
  ],
  "correct": 1,
  "explanation": "The -f flag reads input from a file instead of requiring you to type the prompt directly."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- OpenCode supports both interactive and single-prompt execution modes
- Use `/help` in interactive mode to see all available commands
- The `--debug` flag shows detailed information about AI operations
- Tab completion works for commands, file paths, and model names
- Environment variables can configure defaults for provider and model
- Keyboard shortcuts provide quick access to common actions
- The `-f` flag allows reading prompts from files for batch processing