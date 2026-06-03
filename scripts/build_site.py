# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Generate the docs/ site data layer from the canonical data/ datasets.

Outputs (zero-build, plain `window.*` globals — no fetch, works from file://):
    docs/data/meta.js          window.VC_META   (stats, bilingual taxonomy, glossary, freshness)
    docs/data/index.js         window.VC_INDEX  (~2.4k slim records: cards + filters + search)
    docs/data/full/<region>.js window.VC_FULL   (full per-entity detail, lazy-loaded on dialog open)

Run:  uv run scripts/build_site.py
"""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT / "docs" / "data"
TAX = json.loads((DATA / "taxonomy.json").read_text("utf-8"))

# zh labels for the axes taxonomy.json only ships in English
SECTOR_ZH = {
    "generalist": "綜合", "ai-ml": "AI / 機器學習", "fintech": "金融科技",
    "web3-crypto": "Web3 / 加密", "biotech": "生技", "healthtech": "醫療科技",
    "deeptech": "深科技", "hardware-semiconductor": "硬體 / 半導體", "robotics": "機器人",
    "climate-energy": "氣候 / 能源", "consumer": "消費", "ecommerce": "電商",
    "saas-enterprise": "SaaS / 企業軟體", "gaming": "遊戲", "edtech": "教育科技",
    "proptech": "房產科技", "agritech": "農業 / 食品科技", "mobility": "交通 / 移動",
    "logistics": "物流", "cybersecurity": "資安", "spacetech": "太空科技", "impact": "影響力 / ESG",
}
STAGE_ZH = {
    "pre-seed": "種子前", "seed": "種子", "series-a": "A 輪", "series-b": "B 輪",
    "series-c-plus": "C 輪以後", "growth": "成長期", "all": "全階段",
}
CONF_ZH = {"high": "高", "medium": "中", "low": "低"}


def regions() -> list[str]:
    return [r["slug"] for r in TAX["regions"]]


def load_region(region: str) -> list[dict]:
    f = DATA / region / "entities.json"
    return json.loads(f.read_text("utf-8")) if f.exists() else []


def clip(s: str, n: int) -> str:
    s = " ".join((s or "").split())
    return s if len(s) <= n else s[: n - 1].rstrip() + "…"


def bilingual(en: str, local: str, cap: int) -> dict:
    en = clip(en, cap)
    zh = clip(local or en, cap)
    return {"en": en, "zh": zh}


def tagline(e: dict) -> dict:
    summ = e.get("summary") or {}
    strat = e.get("strategy") or {}
    en = summ.get("en") or strat.get("thesis") or ""
    zh = summ.get("local") or summ.get("en") or strat.get("thesis") or ""
    return bilingual(en, zh, 160)


def search_blob(e: dict) -> str:
    """Lowercased haystack so search reaches portfolio + people without the full record."""
    parts: list[str] = []
    nm = e.get("name") or {}
    parts += [nm.get("en", ""), nm.get("local", "")]
    parts += e.get("aka") or []
    parts += [e.get("country", ""), e.get("hq_city", "")]
    strat = e.get("strategy") or {}
    parts.append(strat.get("thesis", ""))
    for inv in (e.get("track_record") or {}).get("notable_investments") or []:
        parts.append(inv.get("company", ""))
    for p in e.get("people") or []:
        parts.append(p.get("name", ""))
    return " ".join(x for x in parts if x).lower()


def slim(e: dict) -> dict:
    nm = e.get("name") or {}
    strat = e.get("strategy") or {}
    return {
        "slug": e["id"],
        "name": {"en": nm.get("en", e["id"]), "zh": nm.get("local") or nm.get("en", e["id"])},
        "type": e.get("type", "vc"),
        "region": e["region"],
        "country": e.get("country", ""),
        "hq": e.get("hq_city", ""),
        "founded": e.get("founded_year"),
        "sectors": strat.get("sector_focus") or [],
        "stages": strat.get("stages") or [],
        "confidence": e.get("confidence", "medium"),
        "website": e.get("website", ""),
        "tagline": tagline(e),
        "q": search_blob(e),
    }


def write_js(path: Path, varexpr: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(varexpr, "utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    index: list[dict] = []
    counts = {k: Counter() for k in ("region", "type", "sector", "stage", "confidence", "country")}
    total = 0

    for region in regions():
        ents = load_region(region)
        if not ents:
            continue
        # full per-region detail, keyed by slug, lazy-loaded on demand
        full = {e["id"]: e for e in ents}
        write_js(
            OUT / "full" / f"{region}.js",
            "window.VC_FULL=window.VC_FULL||{};Object.assign(window.VC_FULL,"
            + json.dumps(full, ensure_ascii=False) + ");",
        )
        for e in ents:
            index.append(slim(e))
            total += 1
            counts["region"][region] += 1
            counts["type"][e.get("type", "vc")] += 1
            counts["confidence"][e.get("confidence", "medium")] += 1
            if e.get("country"):
                counts["country"][e["country"]] += 1
            strat = e.get("strategy") or {}
            for s in strat.get("sector_focus") or []:
                counts["sector"][s] += 1
            for s in strat.get("stages") or []:
                counts["stage"][s] += 1

    # sort index by region then name for stable display
    index.sort(key=lambda r: (r["region"], r["name"]["en"].lower()))
    write_js(OUT / "index.js", "window.VC_INDEX=" + json.dumps(index, ensure_ascii=False) + ";")

    # bilingual taxonomy (only the values that actually occur, in count order)
    def axis(name, label_fn):
        return [
            {"key": k, "en": label_fn(k)[0], "zh": label_fn(k)[1], "count": c}
            for k, c in counts[name].most_common()
        ]

    type_lbl = {t["slug"]: (t["label_en"], t["label_zh"]) for t in TAX["types"]}
    region_lbl = {r["slug"]: (r["label_en"], r["label_zh"]) for r in TAX["regions"]}

    meta = {
        "total": total,
        "generated": "2026-06-03",
        "collected": "2026-06",
        "axes": {
            "region": axis("region", lambda k: region_lbl.get(k, (k, k))),
            "type": axis("type", lambda k: type_lbl.get(k, (k, k))),
            "sector": axis("sector", lambda k: (
                next((s["label_en"] for s in TAX["sectors"] if s["slug"] == k), k),
                SECTOR_ZH.get(k, k))),
            "stage": axis("stage", lambda k: (
                next((s["label_en"] for s in TAX["stages"] if s["slug"] == k), k),
                STAGE_ZH.get(k, k))),
            "confidence": [
                {"key": k, "en": k.title(), "zh": CONF_ZH.get(k, k), "count": counts["confidence"][k]}
                for k in ("high", "medium", "low") if counts["confidence"][k]
            ],
        },
        "glossary": {
            "types": [{"key": t["slug"], "en": t["label_en"], "zh": t["label_zh"]} for t in TAX["types"]],
            "stages": [{"key": s["slug"], "en": s["label_en"], "zh": STAGE_ZH.get(s["slug"], s["slug"])} for s in TAX["stages"]],
        },
    }

    # optional freshness section (written by the fact-check agent; embed if present)
    fresh = OUT / "_freshness.json"
    if fresh.exists():
        try:
            meta["freshness"] = json.loads(fresh.read_text("utf-8"))
        except json.JSONDecodeError:
            pass

    write_js(OUT / "meta.js", "window.VC_META=" + json.dumps(meta, ensure_ascii=False) + ";")

    # report
    idx_kb = (OUT / "index.js").stat().st_size / 1024
    print(f"✓ {total} entities → docs/data/")
    print(f"  index.js: {idx_kb:.0f} KB  ({len(index)} slim records)")
    print(f"  full/: {len(list((OUT / 'full').glob('*.js')))} region files")
    print(f"  axes: region={len(meta['axes']['region'])} type={len(meta['axes']['type'])} "
          f"sector={len(meta['axes']['sector'])} stage={len(meta['axes']['stage'])}")
    print(f"  freshness embedded: {'yes' if 'freshness' in meta else 'not yet'}")


if __name__ == "__main__":
    main()
