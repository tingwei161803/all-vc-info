# all-vc-info

> 跨國的**創投 / 加速器名錄資料庫** — 把台灣、美國、日本、歐洲、南韓、東南亞、以色列、印度、加拿大
> 的 VC、加速器、育成中心、企業創投(CVC)、天使網絡、政府計畫、創業工作室、Micro-VC、家族辦公室
> 全面整理成**結構化、可篩選、每筆帶來源佐證**的資料集。
>
> An open, cross-region directory of venture capital firms, accelerators, incubators, corporate VCs,
> angel networks, government programs, venture studios, micro-VCs and family offices — fully
> structured, filterable, and **sourced per entry**.

---

## 收錄範圍

| 維度 | 內容 |
| --- | --- |
| **9 地區** | 台灣 · 美國 · 日本 · 歐洲 · 南韓 · 東南亞 · 以色列 · 印度 · 加拿大 |
| **12 類機構** | VC · 加速器 · 育成中心 · CVC · 天使網絡 · 天使 syndicate · 政府計畫 · 創業工作室 · Micro-VC · 家族辦公室 · growth equity · 股權群募 |
| **深度** | 全面蒐集(每地區窮盡式列出可查證的知名 + 活躍機構) |
| **每筆面向** | 身份 / 資本 / 投資策略 / 加速器專屬 / 戰績 / 團隊 / 申請方式 / 來源佐證 |

每筆資料都附 `sources[]`(真實 URL + 佐證 `quote`)與 `confidence` 信心評級。

---

## 怎麼用這份資料

- 結構化資料在 `data/<region>/entities.json`,全球合併在 `data/all-entities.json`。
- 欄位定義見 [`schema/entity.schema.json`](schema/entity.schema.json),受控詞彙見 [`data/taxonomy.json`](data/taxonomy.json)。
- 整體架構、蒐集方法論、去重規則見 [`ARCHITECTURE.md`](ARCHITECTURE.md)。

```bash
# 重建合併資料 + 驗證 + 統計(全程 uv)
uv run scripts/build.py
cat data/stats.json          # 各維度數量
cat reports/validation.md    # schema 違規 / 資料品質
```

---

## 資料狀態

| 地區 | 狀態 |
| --- | --- |
| 台灣 taiwan | 🚧 蒐集中(pilot) |
| 美國 / 日本 / 歐洲 / 南韓 / 東南亞 / 以色列 / 印度 / 加拿大 | ⏳ 待蒐集 |

> 各 `data/<region>/_raw/` 內為 agent 分切片產出的原始檔;`entities.json` 為去重合併後成品。

---

## 免責

非官方整理,僅供研究參考。金額 / 股權 / 錄取率等數字以各機構官方公開資料為準,引用前請依各筆 `sources` 自行查證。
資料來源版權歸原出處;本 repo 的程式碼採 MIT。
