from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", "node_modules", "dist", ".vite", "coverage", "verification", ".chrome-redactor-test"}
TEXT_EXTENSIONS = {
    ".css",
    ".html",
    ".js",
    ".json",
    ".md",
    ".py",
    ".svg",
    ".ts",
    ".tsx",
    ".txt",
    ".yml",
    ".yaml",
}

FORBIDDEN_NAMES = {"." + "codex", "." + "claude", "AGENTS" + ".md", "CLAUDE" + ".md"}

PATTERNS = {
    "local path": re.compile(r"(D:\\OneDrive|C:\\Users\\yunyo|I:\\data)", re.IGNORECASE),
    "old email": re.compile(r"yunyou" + r"maomaomao|lipeize1997" + r"@126\.com", re.IGNORECASE),
    "private company": re.compile(r"Air" + r"Liquide", re.IGNORECASE),
    "phone number": re.compile(r"(?<![\d.-])1[3-9]\d{9}(?![\d.-])"),
    "credential": re.compile(r"(api[_-]?key|access[_-]?token|auth[_-]?token|bearer\s+[a-z0-9._-]+|secret\s*=)", re.IGNORECASE),
    "identity keyword": re.compile(
        r"(" + "户" + "口" + r"|" + "籍" + "贯" + r"|" + "护" + "照" + r"|pass" + r"port)",
        re.IGNORECASE,
    ),
}

EXPECTED_FILES = [
    "README.md",
    "LICENSE",
    "CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md",
    "docs/privacy-boundary.md",
    "docs/usage.md",
    "docs/demo-assets.md",
    "examples/before/synthetic-profile-card.svg",
    "examples/after/synthetic-profile-card-redacted.svg",
    "examples/before/synthetic-screenshot.svg",
    "examples/after/synthetic-screenshot-redacted.svg",
    "examples/showcase/privacy-image-redactor-showcase.png",
    ".github/workflows/deploy-pages.yml",
]


def iter_public_files():
    for path in ROOT.rglob("*"):
        if any(part in SKIP_DIRS for part in path.relative_to(ROOT).parts):
            continue
        if path.is_file():
            yield path


def read_text(path: Path) -> str | None:
    if path.suffix.lower() not in TEXT_EXTENSIONS and path.name not in {
        ".gitignore",
        ".gitattributes",
        "LICENSE",
    }:
        return None
    return path.read_text(encoding="utf-8", errors="ignore")


def main() -> int:
    errors: list[str] = []

    for expected in EXPECTED_FILES:
        path = ROOT / expected
        if not path.exists() or path.stat().st_size == 0:
            errors.append(f"Missing or empty expected file: {expected}")

    for path in iter_public_files():
        rel = path.relative_to(ROOT).as_posix()
        if any(part in FORBIDDEN_NAMES for part in path.relative_to(ROOT).parts):
            errors.append(f"Forbidden public path: {rel}")

        text = read_text(path)
        if text is None:
            continue

        for name in FORBIDDEN_NAMES:
            if name in text and rel != ".gitignore":
                errors.append(f"Forbidden workspace marker {name!r} in {rel}")

        for label, pattern in PATTERNS.items():
            if pattern.search(text):
                errors.append(f"Potential {label} in {rel}")

        emails = re.findall(r"[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}", text)
        unexpected_emails = [
            email for email in emails
            if not email.lower().endswith(("@example.com", "@example.org", "@example.net"))
        ]
        if unexpected_emails:
            errors.append(f"Unexpected email-like text in {rel}: {unexpected_emails[:3]}")

    if errors:
        print("Public asset validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Public asset validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
