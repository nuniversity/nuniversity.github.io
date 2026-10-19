#!/usr/bin/env python3
"""quality_lint.py — deterministic quality gate for translated lessons.

Complements validate_lesson.py (structure) and verify_translation.py (parity):
this tool hunts QUALITY defects that structural checks cannot see:

  duration-format        frontmatter duration must be localized  "N min"
  english-quote          quoted spans left in English mid-prose
  english-paragraph      prose lines dominated by English stopwords
  residual-stamp         "as of Oct 2026" style stamps outside code
  english-heading        bare-English headings (outside dual-heading contract)
  case-studies-heading   must be the locked locale formula
  updates-heading        must be the locked locale formula
  did-you-know           must be the locked locale formula
  verdict-heading        must be the locked locale formula (casing locked)
  cross-locale           pt files must not contain ¿¡ ; es must not use você
  vosotros-form          es must not use vosotros conjugations (-éis/-áis, vosotros)
  json-english-value     question/options/explanation left in English
  emphasis-balance       odd count of ** markers
  artifacts              %s / {{0}} / TODO / TBD / Lorem leftovers
  dual-headings          validator-mandated dual headings present
  fence-balance          odd number of ``` fences
  angle-quotes-pt        PT style prefers "…" over «…» (warning)

Usage:
  python3 quality_lint.py --target content/courses/<slug>/pt/NN-lesson.md
  python3 quality_lint.py --course content/courses/<slug> --locale pt
Exit codes: 0 clean, 1 warnings only, 2 errors.
"""
import argparse
import json
import re
import sys
from pathlib import Path

EN_STOP = set(
    ("the and for with that this from you your are was were have has had will "
     "would should can when then than they their there which what about into "
     "over under between because while where each every must but any all one "
     "two use using not been being does did done doing more most other some "
     "such only own same very just also now way well back even make made "
     "need needs get gets got take taken give given show shown new old long "
     "great little first last right still too early high low each both few "
     "many much own through after above below between during without").split()
)

LOCKED = {
    "pt": {
        "case_studies": "## Casos Reais",
        "updates": "### Atualizações de 2026 (em outubro de 2026)",
        "did_you_known": "📚 Você sabia?",
        "verdict": "> **Veredito Comparativo — ",
        "dual_practice": "## Perguntas de Prática (Practice Questions)",
        "dual_takeaways": "**Pontos Principais (Key Takeaways):**",
        "success_tag": "> [!SUCCESS]",
    },
    "es": {
        "case_studies": "## Casos Reales",
        "updates": "### Actualizaciones de 2026 (en octubre de 2026)",
        "did_you_known": "📚 ¿Sabías que…?",
        "verdict": "> **Veredicto comparativo — ",
        "dual_practice": "## Preguntas de Práctica (Practice Questions)",
        "dual_takeaways": "**Conclusiones Clave (Key Takeaways):**",
        "success_tag": "> [!SUCCESS]",
    },
}


def en_ratio(text):
    words = re.findall(r"[a-zA-Z]{3,}", text.lower())
    if len(words) < 3:
        return 0.0
    return sum(w in EN_STOP for w in words) / len(words)


def strip_code_spans(text):
    return re.sub(r"`[^`]*`", "", text)


QUOTED = re.compile(r"«([^«»]{25,400})»|\"([^\"“”]{25,400})\"|“([^“”]{25,400})”")


def lint_file(path, locale, source_text=None):
    """Lint one translated file. If source_text is given (parity/legacy mode),
    presence checks that the EN source itself fails are skipped: dual headings
    and Comparative Verdict box only enforced when the source has them."""
    errors, warnings = [], []
    lines = Path(path).read_text(encoding="utf-8").splitlines()
    L = LOCKED[locale]

    src_has_pq = source_text is None or bool(
        re.search(r"^## .*Practice Questions", source_text, re.MULTILINE))
    src_has_kt = source_text is None or bool(
        re.search(r"^## .*Key Takeaways", source_text, re.MULTILINE) or
        ("> [!SUCCESS]" in source_text and "Key Takeaways" in source_text))
    src_has_success = source_text is None or ("> [!SUCCESS]" in source_text)
    src_has_verdict = source_text is None or bool(
        re.search(r"^> \*\*(Veredito|Veredicto)", source_text, re.MULTILINE))

    in_fence = False
    fence_count = 0
    star_count = 0
    has_practice = has_takeaways = has_success = False
    has_verdict = False

    for i, raw in enumerate(lines, 1):
        if raw.lstrip().startswith("```"):
            in_fence = not in_fence
            fence_count += 1
            continue

        if not in_fence:
            star_count += raw.count("**")
            if raw.startswith("## ") and L["dual_practice"][3:] in raw:
                has_practice = True
            if L["dual_takeaways"] in raw or (raw.startswith("## ") and "Key Takeaways" in raw):
                has_takeaways = True
            if raw.startswith(L["success_tag"]):
                has_success = True

            # duration (frontmatter, first ~30 lines only)
            m = re.match(r"^duration:\s*\"(\d+)\s*(minutes?|minutos?|min)\"\s*$", raw)
            if m and m.group(2) != "min":
                errors.append((i, "duration-format",
                               f'duration must be "{m.group(1)} min", found "{m.group(0)[10:-1]}"'))
            elif raw.startswith("duration:"):
                if not re.match(r'^duration:\s*"\d+ min"\s*$', raw):
                    errors.append((i, "duration-format",
                                   f'non-localized duration: {raw.strip()[:60]}'))

            # residual English date stamps
            if re.search(r"\bas of (Oct|October|Sept|September|Jan|February)\b", raw):
                errors.append((i, "residual-stamp",
                               f"English date stamp: …{raw.strip()[:70]}"))

            # locked formulas (H2 only for case studies — "### Caso A" subheads are fine)
            if re.match(r"^## ", raw):
                if re.search(r"Case Studies|Casos|Caso", raw):
                    # allow a numbered prefix (verify requires ## N. parity):
                    # "## 12. Casos Reais" == locked formula "## Casos Reais"
                    if not (raw.startswith(L["case_studies"]) or
                            re.match(r"^## \d+\. " + re.escape(L["case_studies"][3:]) + r"\b", raw)):
                        errors.append((i, "case-studies-heading",
                                       f'expected "{L["case_studies"]}", found: {raw.strip()[:70]}'))
            if re.match(r"^### (2026 Updates|Atualiza|Actualiz)", raw):
                if not raw.startswith(L["updates"]):
                    errors.append((i, "updates-heading",
                                   f'expected "{L["updates"]}", found: {raw.strip()[:70]}'))
            # bare English heading (any level; dual-heading parens are contracted)
            if re.match(r"^#{1,6} ", raw) and not re.search(
                    r"\((Practice Questions|Key Takeaways)\)", raw):
                body = re.sub(r"^#+\s*", "", raw)
                body = re.sub(r"\d+\.\s*", "", body)
                w = re.findall(r"[a-zA-Z]{3,}", body.lower())
                if len(w) >= 3 and en_ratio(body) >= 0.60 and not re.search(r"[áéíóúñÁÉÍÓÚÑ]", body):
                    errors.append((i, "english-heading",
                                   f"bare English heading: {raw.strip()[:70]}"))

            if "📚" in raw and L["did_you_known"] not in raw:
                errors.append((i, "did-you-know",
                               f'expected "{L["did_you_known"]}", found: {raw.strip()[:70]}'))
            if raw.startswith("> **Veredit") or raw.startswith("> **Veredict"):
                has_verdict = True
                if not raw.startswith(L["verdict"]):
                    errors.append((i, "verdict-heading",
                                   f'expected "{L["verdict"]}", found: {raw.strip()[:70]}'))
            if "Comparative Verdict" in raw or "Real-World Case Studies" in raw:
                errors.append((i, "english-heading", f"untranslated EN heading: {raw.strip()[:70]}"))

            # cross-locale
            if locale == "pt" and re.search(r"[¿¡]", raw):
                errors.append((i, "cross-locale", f"Spanish marks in pt file: {raw.strip()[:70]}"))
            if locale == "es" and re.search(r"\b[vV]ocê", raw):
                errors.append((i, "cross-locale", f"Portuguese 'você' in es file: {raw.strip()[:70]}"))
            if locale == "es" and re.search(r"\bvosotros\b|\b[VV]osotras\b", raw):
                errors.append((i, "vosotros-form", f"vosotros register: {raw.strip()[:70]}"))
            if locale == "es" and re.search(r"\b\w+(éis|áis)\b", strip_code_spans(raw)):
                m2 = re.search(r"\b(?!dieciséis\b)\w+(éis|áis)\b", strip_code_spans(raw), re.I)
                if m2:
                    errors.append((i, "vosotros-form", f"2nd-person-plural verb form: …{m2.group(0)}…"))

            if locale == "pt" and "«" in raw:
                warnings.append((i, "angle-quotes-pt", "PT prefers “…” over «…»"))

            # English quoted spans (skip pure code/table-of-flags lines)
            prose = strip_code_spans(raw)
            if not prose.lstrip().startswith("|"):
                for m in QUOTED.finditer(prose):
                    span = next(g for g in m.groups() if g)
                    if re.search(r"[áéíóúñÁÉÍÓÚÑ]", span):
                        continue
                    w = re.findall(r"[a-zA-Z]{3,}", span.lower())
                    if len(w) >= 6 and en_ratio(span) >= 0.33:
                        errors.append((i, "english-quote",
                                       f'English quote left in translation: "…{span[:60]}…"'))

            # English-dominated prose line
            w = re.findall(r"[a-zA-Z]{3,}", raw.lower())
            if len(w) >= 8 and en_ratio(raw) >= 0.50 and not raw.lstrip().startswith(("|", "-", "*", ">")):
                if not re.search(r"[áéíóúñÁÉÍÓÚÑ]", raw):
                    errors.append((i, "english-paragraph",
                                   f"English-dominated prose: {raw.strip()[:70]}"))

            # artifacts
            if re.search(r"%s\b|\{\{0\}\}|Lorem ipsum|\bTODO\b|\bTBD\b", raw):
                errors.append((i, "artifacts", f"translation artifact: {raw.strip()[:70]}"))
        else:
            # code fences: only artifacts check (TODO in code may be legit — skip)
            pass

    # whole-file checks
    if fence_count % 2 != 0:
        errors.append((len(lines), "fence-balance", "odd number of ``` fences"))
    if star_count % 2 != 0:
        warnings.append((len(lines), "emphasis-balance", "odd count of ** markers"))
    if src_has_pq and not has_practice:
        errors.append((0, "dual-headings", f'missing "{L["dual_practice"]}"'))
    if src_has_kt and not has_takeaways:
        errors.append((0, "dual-headings", f'missing "{L["dual_takeaways"]}"'))
    if src_has_success and not has_success:
        errors.append((0, "dual-headings", f'missing "{L["success_tag"]}"'))
    if src_has_verdict and not has_verdict:
        warnings.append((0, "verdict-heading", "no Comparative Verdict box found"))

    # question JSON values in English (warning-level; options may be locked terms)
    text = "\n".join(lines)
    for block in re.findall(r"```question\n(.*?)\n```", text, re.S):
        try:
            data = json.loads(block)
        except Exception:
            continue
        values = []
        if isinstance(data.get("question"), str):
            values.append(("question", data["question"]))
        for opt in data.get("options", []) if isinstance(data.get("options"), list) else []:
            if isinstance(opt, str):
                values.append(("options", opt))
        if isinstance(data.get("explanation"), str):
            values.append(("explanation", data["explanation"]))
        for key, val in values:
            if re.search(r"[áéíóúñÁÉÍÓÚÑ¿¡]", val):
                continue
            w = re.findall(r"[a-zA-Z]{3,}", val.lower())
            if len(w) >= 8 and en_ratio(val) >= 0.45:
                warnings.append((0, "json-english-value",
                                 f'{data.get("id","?")}: {key} still English: "{val[:60]}…"'))
    return errors, warnings


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--target")
    ap.add_argument("--course")
    ap.add_argument("--locale", choices=["pt", "es"])
    ap.add_argument("--source",
                    help="EN source file for parity mode (single --target only; "
                    "default: en sibling <course>/en/<file>)")
    args = ap.parse_args()

    def source_text_for(p: Path) -> str | None:
        if args.source and args.target:
            sp = Path(args.source)
        else:
            en_dir = p.parent.parent / "en"
            sp = en_dir / p.name
            if not sp.is_file():
                # localized target name (e.g. pt/01-o-que-sao-processos.md):
                # fall back to the EN file with the same order prefix
                pref = p.name.split("-")[0]
                cands = sorted(en_dir.glob(f"{pref}-*.md")) if en_dir.is_dir() else []
                if cands:
                    sp = cands[0]
        try:
            return sp.read_text(encoding="utf-8")
        except OSError:
            return None

    files = []
    if args.target:
        p = Path(args.target)
        loc = args.locale or ("pt" if "/pt/" in str(p) else "es" if "/es/" in str(p) else None)
        if not loc:
            print("cannot infer locale; pass --locale", file=sys.stderr)
            return 2
        files.append((p, loc))
    elif args.course:
        if not args.locale:
            print("--locale required with --course", file=sys.stderr)
            return 2
        d = Path(args.course) / args.locale
        files = sorted((p, args.locale) for p in d.glob("*.md"))
        if not files:
            print(f"no lessons in {d}", file=sys.stderr)
            return 2
    else:
        ap.print_help()
        return 2

    n_err = n_warn = 0
    for path, loc in files:
        errors, warnings = lint_file(path, loc, source_text=source_text_for(path))
        for ln, code, msg in errors:
            print(f"ERROR   {path}:{ln} [{code}] {msg}")
        for ln, code, msg in warnings:
            print(f"WARNING {path}:{ln} [{code}] {msg}")
        n_err += len(errors)
        n_warn += len(warnings)
        if errors or warnings:
            print(f"-- {path}: {len(errors)} errors, {len(warnings)} warnings")
    print(f"quality_lint: {len(files)} files, {n_err} errors, {n_warn} warnings")
    return 2 if n_err else (1 if n_warn else 0)


if __name__ == "__main__":
    sys.exit(main())
