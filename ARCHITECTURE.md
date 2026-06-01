# 資料架構與蒐集方法論 / Data Architecture & Methodology

> `all-vc-info` 是一份**跨國的創投 / 加速器名錄資料庫**。主角是「投資機構本身」(不是被投公司),
> 橫跨 9 個地區、12 種機構類型,每筆資料都帶**來源與佐證**(`sources[]` + `quote`)與**信心評級**。

---

## 1. 設計原則

| 原則 | 做法 |
| --- | --- |
| **逐機構溯源** | 每個 entity 至少 1 個真實 `sources` URL;每個數字(基金規模 / check size / 股權 / 錄取率…)都要有 `quote` 佐證,查不到就填 `null`,**不猜**。 |
| **誠實標示信心** | `confidence`: `high`(官方/一手) / `medium`(可靠二手) / `low`(單一弱來源或推估)。 |
| **原文金額不硬換匯** | 金額用 `{ raw, usd, currency }`,`raw` 保留原幣別字串(如 `NT$2,000,000`),避免 agent 亂換匯造假。 |
| **平行寫入零衝突** | 每個 agent 只寫自己的 `_raw/<segment>.json`,完全隔離 → 事後用 `build.py` 去重合併。 |
| **受控詞彙** | `type / stage / sector / region / status / confidence` 一律用 `data/taxonomy.json` 的 slug,保證可篩選。 |

---

## 2. 目錄結構

```
all-vc-info/
├── schema/entity.schema.json     # 一個「投資機構」的 JSON Schema(欄位定義 + 型別)
├── data/
│   ├── taxonomy.json             # 受控詞彙:type / stage / sector / region…
│   ├── countries.json            # 9 地區 metadata(語言 / 樞紐城市 / 權威來源站)
│   ├── <region>/
│   │   ├── _raw/<segment>.json   # ← agent 原始產出,一個切片一檔(永不衝突)
│   │   └── entities.json         # ← build.py 去重合併 + 驗 schema 後的結果
│   ├── all-entities.json         # 全球合併(build.py 產生)
│   └── stats.json                # 各維度統計(build.py 產生)
├── scripts/build.py              # 合併 / 去重 / 驗證 / 統計(uv run)
└── reports/validation.md         # schema 違規 + 資料品質報告(build.py 產生)
```

9 個地區:`taiwan · united-states · japan · europe · south-korea · southeast-asia · israel · india · canada`

---

## 3. 資料模型(entity)

完整定義見 [`schema/entity.schema.json`](schema/entity.schema.json)。維度概覽:

- **身份**:`name{en,local}` · `type` · `subtypes` · `founded_year` · `status` · `region` · `country` · `hq_city` · `offices` · `website` · `links`
- **資本**(VC/CVC/growth):`capital.aum` · `capital.current_fund` · `capital.funds[]`
- **策略**:`strategy.stages` · `check_size` · `ownership_target_pct` · `geo_focus` · `sector_focus` · `thesis`
- **加速器/育成專屬**:`program.{length_weeks, cohort_size, batches_per_year, equity_taken_pct, investment, format, demo_day, perks, application_url, application_cycles, acceptance_rate, eligibility}`
- **戰績**:`track_record.{portfolio_count, notable_investments[], exits[], co_investors[]}`
- **人 / 申請**:`people[]` · `team_size` · `application.{how_to_apply, accepts_cold_inbound, contact}`
- **佐證 meta**:`sources[]{url,title,publisher,accessed,supports,quote}` · `confidence` · `verification_notes` · `last_updated` · `researched_by`

必填:`id · name · type · region · country · sources · confidence · last_updated`。其餘可選——查不到就省略,不要塞假值。

---

## 4. 平行蒐集方法論(fan-out)

每個地區把搜尋切成 **~24 個 segment(切片)**,一個 segment = 一個 agent。切片以「機構類型 × 產業/階段」交叉而成,讓 agent 之間**覆蓋面互補、重疊最小**。通用切片表:

| # | segment slug | 範圍 |
| --- | --- | --- |
| 1 | `tier1-vc` | 頭部 / 品牌創投(generalist、多階段) |
| 2 | `seed-early-vc` | 種子 / 早期創投 |
| 3 | `growth-late-vc` | 成長期 / 後期 / growth equity |
| 4 | `micro-emerging-vc` | Micro-VC / solo GP / 新興基金 |
| 5–11 | `ai-vc` `fintech-vc` `web3-vc` `biotech-health-vc` `deeptech-hardware-vc` `climate-vc` `consumer-saas-vc` | 各產業專注基金 |
| 12 | `accelerator-general` | 一般加速器 |
| 13 | `accelerator-sector` | 產業專注加速器 |
| 14 | `university-incubator` | 大學 / 學界育成、加速器 |
| 15 | `government-program` | 政府 / 公部門創業計畫、主權/國家基金 |
| 16 | `cvc-tech` | 科技業企業創投 |
| 17 | `cvc-finance-industrial` | 金融 / 傳產 / 電信 CVC |
| 18 | `incubator-private` | 民間(非學界)育成中心 |
| 19 | `venture-studio` | 創業工作室 / company builder |
| 20 | `angel-network` | 天使網絡 / syndicate / SPV |
| 21 | `family-office` | 參與創投的家族辦公室 |
| 22 | `impact-diversity-vc` | impact / 女性 / 多元 focus |
| 23 | `corporate-accelerator` | 企業辦的加速器 |
| 24 | `emerging-2020plus` | 2020 後新成立基金 + 二線城市 |

> `europe` / `southeast-asia` 是多國桶,除通用切片外會再加幾個**國別切片**(如 `uk-vc`、`germany-vc`、`indonesia-vc`)以提升覆蓋。

每個 agent 的任務:用 `WebSearch`/`WebFetch` 做**真實查證**(英文 + 當地語言)、產出符合 schema 的 entity 陣列、寫入自己的 `_raw/<segment>.json`、回傳精簡摘要。

---

## 5. 去重與合併(Dedup)

`build.py` 讀所有 `_raw/*.json` → 攤平 → 以 `is_same_entity(a,b)` 兩兩判斷是否同一機構 → 合併(`sources` 取聯集、`confidence` 取高者、空欄位回填)。

預設規則:**同一 region 且正規化英文名相同** 即視為同一機構。這是有 trade-off 的設計決策——太鬆會把 `XYZ Capital` 與 `XYZ Partners` 誤併、太緊會讓 `Sequoia` 與 `Sequoia Capital` 留成兩筆。`is_same_entity()` 在 `scripts/build.py` 標了 `CONTRIBUTION POINT`,可依需求微調(例如再比對官網網域、或對多國桶要求 `country` 也相同)。

---

## 6. 重建資料集

```bash
# 全程使用 uv(本專案偏好);jsonschema 由 build.py 的 PEP 723 標頭自動解析
uv run scripts/build.py
```

產出:各 `data/<region>/entities.json`、`data/all-entities.json`、`data/stats.json`、`reports/validation.md`。

---

## 7. 免責

非官方整理,僅供研究參考。金額 / 股權 / 錄取率等數字以各機構官方公開資料為準,引用前請依 `sources` 自行查證。
