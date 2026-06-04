# all-vc-info

> 跨國的**創投 / 加速器名錄資料庫** — 把台灣、美國、日本、歐洲、南韓、東南亞、以色列、印度、加拿大
> 的 VC、加速器、育成中心、企業創投(CVC)、天使網絡、政府計畫、創業工作室、Micro-VC、家族辦公室
> 全面整理成**結構化、可篩選、每筆帶來源佐證**的資料集。
>
> An open, cross-region directory of venture capital firms, accelerators, incubators, corporate VCs,
> angel networks, government programs, venture studios, micro-VCs and family offices — fully
> structured, filterable, and **sourced per entry**.

---

## 🌐 線上互動圖鑑

**<https://tingwei161803.github.io/all-vc-info/>**

多軸篩選(地區 × 類型 × 產業 × 階段)· 全文搜尋(機構名/國家/論點/被投公司)· 中英雙語全頁切換 ·
深淺色模式 · 點卡片看完整詳情與**來源 quote 佐證** · 可分享的 URL 篩選狀態 · CSV 匯出。
純靜態 HTML/CSS/JS(Material Design 3、零 build),由 `docs/` 經 GitHub Pages 部署。

> 網站資料層由 `uv run scripts/build_site.py` 從 `data/<region>/entities.json` 產生
> (slim 索引全載 + 各區完整詳情 lazy-load)。

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

## 資料狀態 — ✅ 9 區全部完成(兩輪蒐集)

**4,055 筆機構 · 9 區 · 0 schema 違規**(信心度:high 2,731 / medium 1,233 / low 91)

| 地區 | 筆數 | 地區 | 筆數 |
| --- | ---: | --- | ---: |
| 🇪🇺 歐洲 europe | 822 | 🇨🇦 加拿大 canada | 371 |
| 🇺🇸 美國 united-states | 695 | 🇸🇬 東南亞 southeast-asia | 368 |
| 🇮🇳 印度 india | 447 | 🇰🇷 南韓 south-korea | 352 |
| 🇮🇱 以色列 israel | 373 | 🇹🇼 台灣 taiwan | 255 |
| 🇯🇵 日本 japan | 372 | **合計** | **4,055** |

**依類型**:VC 1,766 · 加速器 515 · CVC 404 · 育成 274 · 政府計畫 264 · Micro-VC 193 · growth-equity 179 · 創業工作室 158 · 天使網絡 153 · 家族辦公室 89 · 天使 syndicate 46 · 股權群募 14

> 兩輪蒐集:第一輪每區 24–31 個切片(主流機構),第二輪深層擴充(利基產業 / 二線城市 / 新興管理人 / 創投債 / 大市場地理細分)。各 `data/<region>/_raw/` 為 agent 切片原始檔;`entities.json` 為去重合併 + schema 驗證後成品。共 **9,602 條來源**(97% 帶原文 quote)。

---

## 免責

非官方整理,僅供研究參考。金額 / 股權 / 錄取率等數字以各機構官方公開資料為準,引用前請依各筆 `sources` 自行查證。
資料來源版權歸原出處;本 repo 的程式碼採 MIT。
