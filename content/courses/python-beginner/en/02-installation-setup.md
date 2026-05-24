---
title: "Installation and Setup"
description: "Install Python, set up your development environment, and write your first program using VS Code"
order: 2
duration: "25 minutes"
difficulty: "beginner"
---

# Installation and Setup

Before writing Python code, you need to install Python and choose a code editor. This lesson walks through each step.

## Installing Python

### Windows
1. Go to [python.org/downloads](https://python.org/downloads)
2. Download Python 3.x for Windows
3. **Check** "Add Python to PATH" during installation
4. Click Install

Verify the installation:
```bash
python --version
```

### macOS
```bash
# Using Homebrew
brew install python3

# Verify
python3 --version
```

### Linux
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install python3 python3-pip

# Verify
python3 --version
```

> [!NOTE]
> On macOS and Linux, type `python3` instead of `python`. On Windows, just `python` works.

## Choosing a Code Editor

### VS Code (Recommended)
1. Download from [code.visualstudio.com](https://code.visualstudio.com)
2. Install the **Python extension** by Microsoft
3. Install the **Pylance** language server

### PyCharm
An IDE built specifically for Python, available in free (Community) and paid (Professional) editions.

## Your First Python File

Create a file called `hello.py`:

```python
# This is a comment
print("Hello, World!")
name = input("What is your name? ")
print(f"Nice to meet you, {name}!")
```

Run it:
```bash
python hello.py
```

## Using the Python REPL

The REPL (Read-Eval-Print Loop) lets you test code interactively:

```bash
python
```

```python
>>> 5 * 7
35
>>> for i in range(3):
...     print(i)
...
0
1
2
>>> exit()
```

## Working with pip

pip is Python's package manager:

```bash
# Install a package
pip install requests

# List installed packages
pip list

# Install from a requirements file
pip install -r requirements.txt
```

## Virtual Environments (Basic)

Isolate project dependencies:

```bash
# Create a virtual environment
python -m venv myenv

# Activate it (Windows)
myenv\Scripts\activate

# Activate it (macOS/Linux)
source myenv/bin/activate
```

> [!WARNING]
> Always use virtual environments for projects to avoid dependency conflicts!

## Project Structure Conventions

```
my-project/
├── main.py
├── requirements.txt
├── README.md
└── myenv/          # Virtual environment (don't commit)
```

> [!SUCCESS]
> A good editor with the Python extension gives you: syntax highlighting, auto-completion, error checking, and debugging — all essential for productive coding.

## Practice Questions

1. What command checks your Python installation?
2. What is the Python REPL used for?
3. What does `pip install requests` do?
4. Why should you use virtual environments?
5. How do you activate a virtual environment on Linux?
6. What extension should you install in VS Code for Python?
7. What's the difference between an IDE and a text editor?
8. How do you exit the Python REPL?
9. What does `pip list` show?
10. Create a command that installs all packages from a requirements file.
