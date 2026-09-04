#!/usr/bin/env python3
"""Validate Tailwind CSS class usage in React/JSX/TSX files.

Non-blocking hook: exit 0 = pass, exit 1 = warning.

Environment Variables:
    OPENCODE_FILE_PATH: Path to the file being validated

Exit Codes:
    0 - Validation passed
    1 - Non-blocking warning (potential issues detected)
"""
import os
import re
import sys
from pathlib import Path


KNOWN_UTILITIES = {
    # Layout
    "flex", "grid", "block", "inline-block", "inline-flex", "inline-grid",
    "hidden", "contents", "list-item",
    # Flexbox
    "flex-row", "flex-col", "flex-wrap", "flex-nowrap",
    "items-start", "items-center", "items-end", "items-stretch", "items-baseline",
    "justify-start", "justify-center", "justify-end", "justify-between", "justify-around", "justify-evenly",
    "flex-1", "flex-auto", "flex-initial", "flex-none",
    "grow", "shrink-0",
    # Grid
    "grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4", "grid-cols-6", "grid-cols-12",
    "col-span-1", "col-span-2", "col-span-3", "col-span-4", "col-span-6", "col-span-12",
    # Spacing
    "p-0", "p-1", "p-2", "p-3", "p-4", "p-5", "p-6", "p-8", "p-10", "p-12",
    "m-0", "m-1", "m-2", "m-3", "m-4", "m-auto",
    "px-0", "px-2", "px-4", "px-6", "px-8",
    "py-0", "py-2", "py-4", "py-6", "py-8",
    "mx-auto", "my-auto",
    "gap-0", "gap-2", "gap-4", "gap-6", "gap-8",
    # Typography
    "text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl",
    "font-thin", "font-light", "font-normal", "font-medium", "font-semibold", "font-bold",
    "text-left", "text-center", "text-right", "text-justify",
    "leading-none", "leading-tight", "leading-snug", "leading-normal", "leading-relaxed",
    "tracking-tight", "tracking-normal", "tracking-wide",
    "truncate", "line-clamp-1", "line-clamp-2", "line-clamp-3",
    "sr-only", "not-sr-only",
    # Colors
    "text-white", "text-black", "text-transparent", "text-current",
    "bg-white", "bg-black", "bg-transparent", "bg-current",
    "text-gray-50", "text-gray-100", "text-gray-200", "text-gray-300", "text-gray-400",
    "text-gray-500", "text-gray-600", "text-gray-700", "text-gray-800", "text-gray-900",
    "bg-gray-50", "bg-gray-100", "bg-gray-200", "bg-gray-300", "bg-gray-400",
    "bg-gray-500", "bg-gray-600", "bg-gray-700", "bg-gray-800", "bg-gray-900",
    "text-blue-500", "text-blue-600", "text-blue-700",
    "bg-blue-500", "bg-blue-600", "bg-blue-700",
    "text-red-500", "text-red-600", "text-red-700",
    "bg-red-500", "bg-red-600", "bg-red-700",
    "text-green-500", "text-green-600", "text-green-700",
    "bg-green-500", "bg-green-600", "bg-green-700",
    "text-yellow-500", "text-yellow-600", "text-yellow-700",
    "bg-yellow-500", "bg-yellow-600", "bg-yellow-700",
    # Borders
    "border", "border-0", "border-2", "border-4", "border-8",
    "border-t", "border-r", "border-b", "border-l",
    "rounded-none", "rounded-sm", "rounded", "rounded-md", "rounded-lg", "rounded-xl", "rounded-2xl", "rounded-full",
    "ring-0", "ring-1", "ring-2", "ring-4", "ring",
    # Shadows
    "shadow-none", "shadow-sm", "shadow", "shadow-md", "shadow-lg", "shadow-xl", "shadow-2xl", "shadow-inner",
    # Sizing
    "w-0", "w-1", "w-2", "w-4", "w-8", "w-12", "w-16", "w-20", "w-24", "w-32", "w-48", "w-64",
    "w-full", "w-screen", "w-min", "w-max", "w-fit",
    "h-0", "h-1", "h-2", "h-4", "h-8", "h-12", "h-16", "h-20", "h-24", "h-32", "h-48", "h-64",
    "h-full", "h-screen", "h-min", "h-max", "h-fit",
    "min-h-0", "min-h-full", "min-h-screen",
    "max-h-full", "max-h-screen",
    "max-w-xs", "max-w-sm", "max-w-md", "max-w-lg", "max-w-xl", "max-w-2xl", "max-w-4xl", "max-w-6xl", "max-w-7xl",
    # Position
    "static", "fixed", "absolute", "relative", "sticky",
    "inset-0", "top-0", "right-0", "bottom-0", "left-0",
    "z-0", "z-10", "z-20", "z-30", "z-40", "z-50",
    # Transitions
    "transition", "transition-all", "transition-colors", "transition-opacity", "transition-shadow", "transition-transform",
    "duration-75", "duration-100", "duration-150", "duration-200", "duration-300", "duration-500", "duration-700", "duration-1000",
    "ease-linear", "ease-in", "ease-out", "ease-in-out",
    # Animation
    "animate-none", "animate-spin", "animate-ping", "animate-pulse", "animate-bounce",
    # Interactivity
    "cursor-auto", "cursor-default", "cursor-pointer", "cursor-wait", "cursor-text", "cursor-move", "cursor-not-allowed",
    "select-none", "select-text", "select-all", "select-auto",
    "pointer-events-none", "pointer-events-auto",
    # Overflow
    "overflow-auto", "overflow-hidden", "overflow-visible", "overflow-scroll", "overflow-x-auto", "overflow-y-auto",
}

RESPONSIVE_PREFIXES = ["sm:", "md:", "lg:", "xl:", "2xl:"]
STATE_PREFIXES = ["hover:", "focus:", "focus-within:", "focus-visible:", "active:", "disabled:", "visited:", "first:", "last:", "odd:", "even:"]
DARK_PREFIX = "dark:"


def extract_classes_from_file(content: str) -> list[str]:
    """Extract all class names from className attributes."""
    classes = []
    patterns = [
        r'className="([^"]*)"',
        r"className='([^']*)'",
        r'className=\{`([^`]*)`\}',
        r'className=\{([^}]+)\}',
        r'class="([^"]*)"',
    ]

    for pattern in patterns:
        for match in re.finditer(pattern, content):
            class_str = match.group(1)
            if not class_str.startswith("{"):
                classes.extend(class_str.split())

    return classes


def validate_class(class_name: str) -> list[str]:
    """Validate a single Tailwind class."""
    warnings = []

    clean_class = class_name
    for prefix in RESPONSIVE_PREFIXES + STATE_PREFIXES + [DARK_PREFIX]:
        if clean_class.startswith(prefix):
            clean_class = clean_class[len(prefix):]
            break

    if clean_class not in KNOWN_UTILITIES:
        if not re.match(r'^(text|bg|border|ring|shadow|from|to|via|placeholder)-\[.+\]$', clean_class):
            if not re.match(r'^(w|h|min-w|max-w|min-h|max-h)-\[.+\]$', clean_class):
                if not re.match(r'^(p|m|px|py|mx|my|pt|pb|pl|pr|mt|mb|ml|mr|gap|space)-\d+$', clean_class):
                    if not re.match(r'^(text|leading|tracking)-\d+$', clean_class):
                        if not re.match(r'^(top|right|bottom|left|inset)-\d+$', clean_class):
                            if not re.match(r'^col-(span|start|end)-\d+$', clean_class):
                                if not re.match(r'^grid-rows-\d+$', clean_class):
                                    if not re.match(r'^(translate|rotate|scale|skew)-\d+$', clean_class):
                                        warnings.append(f"Unknown utility class: '{clean_class}'")

    return warnings


def main() -> int:
    file_path = os.environ.get("OPENCODE_FILE_PATH", "")
    if not file_path:
        return 0

    path = Path(file_path)
    if not path.exists():
        return 0

    if path.suffix not in [".tsx", ".jsx", ".ts", ".js", ".html"]:
        return 0

    try:
        content = path.read_text(encoding="utf-8")
    except Exception:
        return 0

    classes = extract_classes_from_file(content)
    if not classes:
        return 0

    all_warnings = []
    for cls in classes:
        warnings = validate_class(cls)
        all_warnings.extend(warnings)

    if all_warnings:
        for warning in all_warnings[:20]:
            print(f"TAILWIND WARNING: {warning}", file=sys.stderr)
        if len(all_warnings) > 20:
            print(f"TAILWIND WARNING: ... and {len(all_warnings) - 20} more", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
