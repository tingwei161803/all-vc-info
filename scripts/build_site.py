# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Generate the docs/ multi-page site data layer from the canonical data/ datasets.

Outputs (zero-build, plain `window.*` globals — no fetch, works from file://):
    docs/data/meta.js          window.VC_META   (stats, bilingual taxonomy, glossary,
                                                  freshness, ANALYTICS, region summaries)
    docs/data/index.js         window.VC_INDEX  (slim records: cards + filters + search)
    docs/data/full/<region>.js window.VC_FULL   (full per-entity detail, lazy-loaded)

Run:  uv run scripts/build_site.py
"""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT / "docs" / "data"
TAX = json.loads((DATA / "taxonomy.json").read_text("utf-8"))

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
TYPE_ZH = {t["slug"]: t["label_zh"] for t in TAX["types"]}
TYPE_EN = {t["slug"]: t["label_en"] for t in TAX["types"]}
REGION_ZH = {r["slug"]: r["label_zh"] for r in TAX["regions"]}
REGION_EN = {r["slug"]: r["label_en"] for r in TAX["regions"]}


def regions() -> list[str]:
    return [r["slug"] for r in TAX["regions"]]


def load_region(region: str) -> list[dict]:
    f = DATA / region / "entities.json"
    return json.loads(f.read_text("utf-8")) if f.exists() else []


def clip(s: str, n: int) -> str:
    s = " ".join((s or "").split())
    return s if len(s) <= n else s[: n - 1].rstrip() + "…"


def bi(en: str, local: str, cap: int) -> dict:
    en = clip(en, cap)
    return {"en": en, "zh": clip(local or en, cap)}


def tagline(e: dict) -> dict:
    summ = e.get("summary") or {}
    strat = e.get("strategy") or {}
    return bi(summ.get("en") or strat.get("thesis") or "",
              summ.get("local") or summ.get("en") or strat.get("thesis") or "", 160)


def search_blob(e: dict) -> str:
    parts: list[str] = []
    nm = e.get("name") or {}
    parts += [nm.get("en", ""), nm.get("local", "")]
    parts += e.get("aka") or []
    parts += [e.get("country", ""), e.get("hq_city", "")]
    parts.append((e.get("strategy") or {}).get("thesis", ""))
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
        "type": e.get("type", "vc"), "region": e["region"], "country": e.get("country", ""),
        "hq": e.get("hq_city", ""), "founded": e.get("founded_year"),
        "sectors": strat.get("sector_focus") or [], "stages": strat.get("stages") or [],
        "confidence": e.get("confidence", "medium"), "website": e.get("website", ""),
        "tagline": tagline(e), "q": search_blob(e),
    }


def aum_usd(e: dict):
    cap = e.get("capital") or {}
    for key in ("aum", "current_fund"):
        m = cap.get(key) or {}
        if isinstance(m, dict) and isinstance(m.get("usd"), (int, float)) and m["usd"] > 0:
            return m["usd"], (m.get("raw") or "")
    return None, ""


def parse_pct(v):
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    m = re.search(r"(\d+(?:\.\d+)?)", str(v))
    return float(m.group(1)) if m else None


def founded_bucket(y):
    if not isinstance(y, int):
        return None
    if y < 2000:
        return "<2000"
    if y < 2010:
        return "2000–09"
    if y < 2015:
        return "2010–14"
    if y < 2020:
        return "2015–19"
    if y < 2025:
        return "2020–24"
    return "2025+"


FOUNDED_ORDER = ["<2000", "2000–09", "2010–14", "2015–19", "2020–24", "2025+"]


def write_js(path: Path, expr: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(expr, "utf-8")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    index: list[dict] = []
    all_ents: list[dict] = []
    counts = {k: Counter() for k in ("region", "type", "sector", "stage", "confidence")}

    for region in regions():
        ents = load_region(region)
        if not ents:
            continue
        full = {e["id"]: e for e in ents}
        write_js(OUT / "full" / f"{region}.js",
                 "window.VC_FULL=window.VC_FULL||{};Object.assign(window.VC_FULL," + json.dumps(full, ensure_ascii=False) + ");")
        for e in ents:
            index.append(slim(e))
            all_ents.append(e)
            counts["region"][region] += 1
            counts["type"][e.get("type", "vc")] += 1
            counts["confidence"][e.get("confidence", "medium")] += 1
            strat = e.get("strategy") or {}
            for s in strat.get("sector_focus") or []:
                counts["sector"][s] += 1
            for s in strat.get("stages") or []:
                counts["stage"][s] += 1

    index.sort(key=lambda r: (r["region"], r["name"]["en"].lower()))
    write_js(OUT / "index.js", "window.VC_INDEX=" + json.dumps(index, ensure_ascii=False) + ";")

    total = len(all_ents)
    reg_order = [r for r, _ in counts["region"].most_common()]
    type_order = [t for t, _ in counts["type"].most_common()]

    def axis(name, label_fn):
        return [{"key": k, "en": label_fn(k)[0], "zh": label_fn(k)[1], "count": c}
                for k, c in counts[name].most_common()]

    region_lbl = {r["slug"]: (r["label_en"], r["label_zh"]) for r in TAX["regions"]}
    type_lbl = {t["slug"]: (t["label_en"], t["label_zh"]) for t in TAX["types"]}
    sector_lbl = lambda k: (next((s["label_en"] for s in TAX["sectors"] if s["slug"] == k), k), SECTOR_ZH.get(k, k))
    stage_lbl = lambda k: (next((s["label_en"] for s in TAX["stages"] if s["slug"] == k), k), STAGE_ZH.get(k, k))

    # ---- analytics ----
    # region x type heatmap matrix
    rt = defaultdict(lambda: defaultdict(int))
    for e in all_ents:
        rt[e["region"]][e.get("type", "vc")] += 1
    matrix = [[rt[r].get(t, 0) for t in type_order] for r in reg_order]

    # founded histogram
    fb = Counter()
    for e in all_ents:
        b = founded_bucket(e.get("founded_year"))
        if b:
            fb[b] += 1
    founded = [{"bucket": b, "count": fb.get(b, 0)} for b in FOUNDED_ORDER]

    # top firms by AUM
    aum_rows = []
    for e in all_ents:
        usd, raw = aum_usd(e)
        if usd:
            nm = e.get("name") or {}
            aum_rows.append({"slug": e["id"], "name": {"en": nm.get("en", e["id"]), "zh": nm.get("local") or nm.get("en", e["id"])},
                             "region": e["region"], "type": e.get("type"), "usd": usd, "raw": raw})
    aum_rows.sort(key=lambda r: -r["usd"])
    top_aum = aum_rows[:30]

    # accelerator economics
    acc = [e for e in all_ents if e.get("type") in ("accelerator", "incubator")]
    equities = [parse_pct((e.get("program") or {}).get("equity_taken_pct")) for e in acc]
    equities = [x for x in equities if x is not None]
    acc_invest = sum(1 for e in acc if ((e.get("program") or {}).get("investment") or {}).get("raw"))
    accel = {
        "count": len(acc),
        "with_equity": len(equities),
        "equity_zero": sum(1 for x in equities if x == 0),
        "equity_avg": round(sum(equities) / len(equities), 1) if equities else None,
        "equity_buckets": [
            {"label": "0% (equity-free)", "count": sum(1 for x in equities if x == 0)},
            {"label": "0–5%", "count": sum(1 for x in equities if 0 < x <= 5)},
            {"label": "5–7%", "count": sum(1 for x in equities if 5 < x <= 7)},
            {"label": "7–10%", "count": sum(1 for x in equities if 7 < x <= 10)},
            {"label": ">10%", "count": sum(1 for x in equities if x > 10)},
        ],
        "with_investment": acc_invest,
    }

    # provenance / data quality
    n_sources = sum(len(e.get("sources") or []) for e in all_ents)
    n_quote = sum(1 for e in all_ents for s in (e.get("sources") or []) if s.get("quote"))
    provenance = {
        "entities": total,
        "sources": n_sources,
        "avg_sources": round(n_sources / total, 2) if total else 0,
        "with_quote_sources": n_quote,
        "by_confidence": [{"key": k, "en": k.title(), "zh": CONF_ZH[k], "count": counts["confidence"].get(k, 0)}
                          for k in ("high", "medium", "low")],
    }

    # per-region summary
    region_summary = {}
    for r in reg_order:
        re_ents = [e for e in all_ents if e["region"] == r]
        tcount, scount = Counter(), Counter()
        years = []
        for e in re_ents:
            tcount[e.get("type", "vc")] += 1
            for s in (e.get("strategy") or {}).get("sector_focus") or []:
                scount[s] += 1
            if isinstance(e.get("founded_year"), int):
                years.append(e["founded_year"])
        region_summary[r] = {
            "count": len(re_ents),
            "high": sum(1 for e in re_ents if e.get("confidence") == "high"),
            "top_types": [{"key": k, "en": TYPE_EN.get(k, k), "zh": TYPE_ZH.get(k, k), "count": c} for k, c in tcount.most_common(5)],
            "top_sectors": [{"key": k, "en": sector_lbl(k)[0], "zh": sector_lbl(k)[1], "count": c} for k, c in scount.most_common(6)],
            "median_founded": sorted(years)[len(years) // 2] if years else None,
        }

    meta = {
        "total": total, "generated": "2026-06-03", "collected": "2026-06",
        "axes": {
            "region": axis("region", lambda k: region_lbl.get(k, (k, k))),
            "type": axis("type", lambda k: type_lbl.get(k, (k, k))),
            "sector": axis("sector", sector_lbl),
            "stage": axis("stage", stage_lbl),
            "confidence": [{"key": k, "en": k.title(), "zh": CONF_ZH.get(k, k), "count": counts["confidence"][k]}
                           for k in ("high", "medium", "low") if counts["confidence"][k]],
        },
        "glossary": {
            "types": [{"key": t["slug"], "en": t["label_en"], "zh": t["label_zh"]} for t in TAX["types"]],
            "stages": [{"key": s["slug"], "en": s["label_en"], "zh": STAGE_ZH.get(s["slug"], s["slug"])} for s in TAX["stages"]],
            "sectors": [{"key": s["slug"], "en": s["label_en"], "zh": SECTOR_ZH.get(s["slug"], s["slug"])} for s in TAX["sectors"]],
        },
        "analytics": {
            "region_type": {"regions": [{"key": r, "en": REGION_EN.get(r, r), "zh": REGION_ZH.get(r, r)} for r in reg_order],
                            "types": [{"key": t, "en": TYPE_EN.get(t, t), "zh": TYPE_ZH.get(t, t)} for t in type_order],
                            "matrix": matrix},
            "founded": founded,
            "top_aum": top_aum,
            "accelerators": accel,
            "provenance": provenance,
        },
        "region_summary": region_summary,
    }

    fresh = OUT / "_freshness.json"
    if fresh.exists():
        try:
            meta["freshness"] = json.loads(fresh.read_text("utf-8"))
        except json.JSONDecodeError:
            pass

    write_js(OUT / "meta.js", "window.VC_META=" + json.dumps(meta, ensure_ascii=False) + ";")

    idx_kb = (OUT / "index.js").stat().st_size / 1024
    print(f"✓ {total} entities → docs/data/")
    print(f"  index.js: {idx_kb:.0f} KB  ({len(index)} slim records)")
    print(f"  analytics: region×type {len(reg_order)}×{len(type_order)}, top_aum={len(top_aum)}, accelerators={accel['count']}")
    print(f"  provenance: {provenance['sources']} sources, {provenance['avg_sources']} avg/entity, {n_quote} quoted")
    print(f"  freshness embedded: {'yes' if 'freshness' in meta else 'not yet'}")


if __name__ == "__main__":
    main()
