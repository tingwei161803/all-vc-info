/* =========================================================================
   All-VC-Info · app.js  (vanilla, zero-build)

   A composite long page whose centrepiece is a multi-axis "directory":
   region × type × sector × stage filters + full-text search over a 2.4k-row
   slim index (VC_INDEX). Full per-entity detail (VC_FULL) is lazy-loaded
   per region only when a card's dialog opens, so first paint stays light.

   Whole-page zh/en switch: every visible string is either a {en,zh} value
   read via t(), or a chrome label resolved from I18N.
   ========================================================================= */
(function () {
  "use strict";

  var META  = window.VC_META  || { axes: {}, glossary: {} };
  var INDEX = Array.isArray(window.VC_INDEX) ? window.VC_INDEX : [];
  window.VC_FULL = window.VC_FULL || {};

  var FLAG = {
    "taiwan": "🇹🇼", "united-states": "🇺🇸", "japan": "🇯🇵", "europe": "🇪🇺",
    "south-korea": "🇰🇷", "southeast-asia": "🌏", "israel": "🇮🇱", "india": "🇮🇳", "canada": "🇨🇦"
  };

  /* ---------- i18n chrome ---------- */
  var I18N = {
    en: {
      brand: "All-VC-Info",
      footer: "Unofficial research compilation · verify against each entry's sources before citing.",
      close: "Close", menu: "On this page",
      nav_overview: "Overview", nav_directory: "Directory", nav_charts: "Breakdown",
      nav_glossary: "Glossary", nav_freshness: "Fresh", nav_about: "About",
      hero_title: "Global VC & Accelerator Directory",
      hero_sub: "A cross-region, fully-sourced directory of investment organizations — VC firms, accelerators, incubators, corporate VCs, angel networks, government programs, venture studios, micro-VCs and family offices.",
      st_total: "Organizations", st_regions: "Regions", st_types: "Types", st_high: "High-confidence",
      dir_title: "Browse the directory", dir_sub: "Filter by region, type, sector and stage, or search by name, country, thesis or portfolio company.",
      search_ph: "Search name, country, thesis, portfolio…",
      f_region: "Region", f_type: "Type", f_sector: "Sector", f_stage: "Stage", f_conf: "Confidence",
      more_filters: "More filters", reset: "Reset", csv: "Export CSV",
      sort_label: "Sort", sort_name: "Name (A–Z)", sort_region: "Region", sort_new: "Founded (newest)", sort_old: "Founded (oldest)", sort_conf: "Confidence",
      showing: "Showing", of: "of", results: "organizations", load_more: "Load more",
      empty: "No organizations match these filters.",
      charts_title: "By the numbers", charts_sub: "Distribution across the dataset.",
      chart_region: "By region", chart_type: "By type",
      glossary_title: "Glossary", glossary_sub: "What each organization type and investment stage means.",
      fresh_title: "Freshness check · 2026", fresh_sub: "Spot-checked 2025–2026 developments for marquee firms (the rest of the dataset was collected June 2026).",
      about_title: "About this dataset", loading: "Loading detail…",
      lbl_hq: "HQ", lbl_founded: "Founded", lbl_stages: "Stages", lbl_check: "Check size",
      lbl_aum: "AUM", lbl_fund: "Current fund", lbl_portfolio: "Portfolio", lbl_team: "Team size",
      sec_strategy: "Strategy", sec_capital: "Capital", sec_program: "Program", sec_track: "Track record",
      sec_people: "People", sec_apply: "How to apply", sec_sources: "Sources & evidence",
      k_thesis: "Thesis", k_sectors: "Sectors", k_geo: "Geo focus", k_lead: "Lead/follow",
      k_funds: "Funds", k_cohort: "Cohort", k_batches: "Batches/yr", k_length: "Length", k_equity: "Equity",
      k_invest: "Investment", k_accept: "Acceptance", k_eligibility: "Eligibility", k_applyurl: "Apply",
      k_notable: "Notable investments", k_exits: "Exits", k_coinv: "Co-investors",
      k_cold: "Cold inbound", k_contact: "Contact", weeks: "wks", yes: "Yes", no: "No",
      visit: "Website", supports: "Supports", note: "Note"
    },
    zh: {
      brand: "全球創投名錄",
      footer: "非官方整理 · 引用前請依各筆來源自行查證。",
      close: "關閉", menu: "本頁導覽",
      nav_overview: "總覽", nav_directory: "名錄", nav_charts: "分布",
      nav_glossary: "名詞表", nav_freshness: "現況", nav_about: "關於",
      hero_title: "全球創投與加速器名錄",
      hero_sub: "跨地區、逐筆附來源的投資機構名錄 — 涵蓋創投、加速器、育成中心、企業創投、天使網絡、政府計畫、創業工作室、Micro-VC 與家族辦公室。",
      st_total: "間機構", st_regions: "個地區", st_types: "種類型", st_high: "高信心筆數",
      dir_title: "瀏覽名錄", dir_sub: "依地區、類型、產業、階段篩選,或用機構名、國家、投資論點、被投公司搜尋。",
      search_ph: "搜尋 機構名 / 國家 / 論點 / 被投公司…",
      f_region: "地區", f_type: "類型", f_sector: "產業", f_stage: "階段", f_conf: "信心度",
      more_filters: "進階篩選", reset: "清除", csv: "匯出 CSV",
      sort_label: "排序", sort_name: "名稱 (A–Z)", sort_region: "地區", sort_new: "成立(新→舊)", sort_old: "成立(舊→新)", sort_conf: "信心度",
      showing: "顯示", of: "／共", results: "間機構", load_more: "載入更多",
      empty: "沒有符合篩選條件的機構。",
      charts_title: "數據分布", charts_sub: "整個資料集的分布概況。",
      chart_region: "依地區", chart_type: "依類型",
      glossary_title: "名詞表", glossary_sub: "各機構類型與投資階段的說明。",
      fresh_title: "現況查核 · 2026", fresh_sub: "對旗艦機構抽查 2025–2026 最新動態(資料集其餘部分蒐集於 2026 年 6 月)。",
      about_title: "關於這份資料", loading: "載入詳情中…",
      lbl_hq: "總部", lbl_founded: "成立", lbl_stages: "階段", lbl_check: "單筆金額",
      lbl_aum: "管理規模", lbl_fund: "現行基金", lbl_portfolio: "投資組合", lbl_team: "團隊規模",
      sec_strategy: "投資策略", sec_capital: "資本", sec_program: "計畫內容", sec_track: "戰績",
      sec_people: "團隊", sec_apply: "如何申請", sec_sources: "來源與佐證",
      k_thesis: "投資論點", k_sectors: "產業", k_geo: "地理focus", k_lead: "領投/跟投",
      k_funds: "歷期基金", k_cohort: "每梯人數", k_batches: "一年梯次", k_length: "梯次長度", k_equity: "股權",
      k_invest: "投資金額", k_accept: "錄取率", k_eligibility: "資格", k_applyurl: "申請連結",
      k_notable: "代表案例", k_exits: "退出", k_coinv: "共同投資方",
      k_cold: "接受 cold inbound", k_contact: "聯絡", weeks: "週", yes: "是", no: "否",
      visit: "官網", supports: "佐證", note: "備註"
    }
  };

  /* ---------- safe localStorage ---------- */
  function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

  /* ---------- state ---------- */
  var state = {
    lang: lsGet("lang") || "zh",
    theme: lsGet("theme") || "light",
    q: "",
    region: new Set(), type: new Set(), sector: new Set(), stage: new Set(), conf: new Set(),
    sort: "name",
    limit: 48
  };
  var PAGE = 48;
  var visible = [];

  /* ---------- dom + helpers ---------- */
  var $ = function(id){ return document.getElementById(id); };
  var sectionsEl = $("sections"), navInner = $("sectionNavInner");
  var dialog = $("dialog"), dialogBody = $("dialogBody");

  function t(o){ if(o==null) return ""; if(typeof o==="string") return o; return o[state.lang]||o.en||o.zh||""; }
  function ui(k){ return (I18N[state.lang]||I18N.en)[k]||k; }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];}); }

  /* label lookups built from META axes */
  function lblMap(axis){ var m={}; (META.axes[axis]||[]).forEach(function(o){ m[o.key]=o; }); return m; }
  var L = { region:lblMap("region"), type:lblMap("type"), sector:lblMap("sector"), stage:lblMap("stage"), conf:lblMap("confidence") };
  function label(axis,key){ var o=L[axis][key]; return o?o[state.lang]||o.en:key; }

  /* ---------- section configs ---------- */
  var SECTIONS = [
    { type:"hero", id:"overview" },
    { type:"directory", id:"directory" },
    { type:"charts", id:"charts" },
    { type:"glossary", id:"glossary" }
  ];
  if (META.freshness && META.freshness.length) SECTIONS.push({ type:"freshness", id:"freshness" });
  SECTIONS.push({ type:"about", id:"about" });

  var NAV_ICONS = { hero:"insights", directory:"travel_explore", charts:"bar_chart", glossary:"menu_book", freshness:"new_releases", about:"info" };
  var NAV_LABEL = { overview:"nav_overview", directory:"nav_directory", charts:"nav_charts", glossary:"nav_glossary", freshness:"nav_freshness", about:"nav_about" };

  /* =======================================================================
     SECTION RENDERERS
     ===================================================================== */
  function sectionHead(titleKey, subKey){
    return '<header class="section-head"><h2 id="'+esc(titleKey)+'-h">'+esc(ui(titleKey))+"</h2>"+
      (subKey?'<p class="section-head__sub">'+esc(ui(subKey))+"</p>":"")+"</header>";
  }

  function renderHero(){
    var stats = [
      { v: META.total||INDEX.length, k:"st_total" },
      { v: (META.axes.region||[]).length, k:"st_regions" },
      { v: (META.axes.type||[]).length, k:"st_types" },
      { v: (L.conf.high?L.conf.high.count:0), k:"st_high" }
    ];
    var cells = stats.map(function(s){
      return '<div class="hero__stat" data-item>'+
        '<b class="hero__stat-value" data-count="'+esc(String(s.v))+'">0</b>'+
        '<span class="hero__stat-label">'+esc(ui(s.k))+"</span></div>";
    }).join("");
    return '<header class="section-head"><h2 id="overview-h">'+esc(ui("hero_title"))+"</h2>"+
      '<p class="section-head__sub">'+esc(ui("hero_sub"))+"</p></header>"+
      '<div class="hero__stats">'+cells+"</div>";
  }

  function chipsFor(axis){
    var sel = state[axis === "conf" ? "conf" : axis];
    return (META.axes[axis]||[]).map(function(o){
      var on = sel.has(o.key);
      return '<button class="chip'+(on?" chip--on":"")+'" type="button" aria-pressed="'+(on?"true":"false")+'" data-facet="'+esc(axis)+'" data-val="'+esc(o.key)+'">'+
        esc(o[state.lang]||o.en)+'<span class="chip__count">'+o.count+"</span></button>";
    }).join("");
  }

  function renderDirectory(){
    return sectionHead("dir_title","dir_sub")+
      '<div class="filters">'+
        '<div class="search-row">'+
          '<label class="search-box"><span class="material-symbols-rounded">search</span>'+
            '<input type="search" id="dirSearch" autocomplete="off" value="'+esc(state.q)+'" placeholder="'+esc(ui("search_ph"))+'" aria-label="'+esc(ui("search_ph"))+'"></label>'+
          '<div class="toolbar">'+
            '<select id="dirSort" aria-label="'+esc(ui("sort_label"))+'">'+
              ['name','region','new','old','conf'].map(function(s){
                return '<option value="'+s+'"'+(state.sort===s?" selected":"")+'>'+esc(ui("sort_"+s))+"</option>";
              }).join("")+
            "</select>"+
            '<button class="btn-ghost" id="dirCsv" type="button"><span class="material-symbols-rounded">download</span>'+esc(ui("csv"))+"</button>"+
            '<button class="btn-ghost" id="dirReset" type="button"><span class="material-symbols-rounded">restart_alt</span>'+esc(ui("reset"))+"</button>"+
          "</div>"+
        "</div>"+
        '<div class="facet"><span class="facet__label"><span class="material-symbols-rounded" style="font-size:16px">public</span>'+esc(ui("f_region"))+'</span><div class="chips" data-chips="region">'+chipsFor("region")+"</div></div>"+
        '<div class="facet"><span class="facet__label"><span class="material-symbols-rounded" style="font-size:16px">category</span>'+esc(ui("f_type"))+'</span><div class="chips" data-chips="type">'+chipsFor("type")+"</div></div>"+
        '<details class="facet"><summary class="facet__label" style="cursor:pointer"><span class="material-symbols-rounded" style="font-size:16px">tune</span>'+esc(ui("more_filters"))+"</summary>"+
          '<div style="margin-top:12px;display:flex;flex-direction:column;gap:12px">'+
            '<div><span class="facet__label" style="margin-bottom:6px">'+esc(ui("f_sector"))+'</span><div class="chips" data-chips="sector">'+chipsFor("sector")+"</div></div>"+
            '<div><span class="facet__label" style="margin-bottom:6px">'+esc(ui("f_stage"))+'</span><div class="chips" data-chips="stage">'+chipsFor("stage")+"</div></div>"+
            '<div><span class="facet__label" style="margin-bottom:6px">'+esc(ui("f_conf"))+'</span><div class="chips" data-chips="conf">'+chipsFor("conf")+"</div></div>"+
          "</div>"+
        "</details>"+
      "</div>"+
      '<div class="result-bar"><span class="result-count" id="dirCount"></span></div>'+
      '<div class="dir-grid" id="dirGrid"></div>'+
      '<div class="load-more-wrap" id="dirMoreWrap" hidden><button class="load-more" id="dirMore" type="button"><span class="material-symbols-rounded">expand_more</span><span id="dirMoreTxt"></span></button></div>';
  }

  function matchRec(r){
    if (state.region.size && !state.region.has(r.region)) return false;
    if (state.type.size && !state.type.has(r.type)) return false;
    if (state.conf.size && !state.conf.has(r.confidence)) return false;
    if (state.sector.size){ var sok=(r.sectors||[]).some(function(s){return state.sector.has(s);}); if(!sok) return false; }
    if (state.stage.size){ var gok=(r.stages||[]).some(function(s){return state.stage.has(s);}); if(!gok) return false; }
    if (state.q){
      var q=state.q.toLowerCase();
      if ((r.q||"").indexOf(q)===-1 && (r.name.en+" "+(r.name.zh||"")).toLowerCase().indexOf(q)===-1) return false;
    }
    return true;
  }

  var SORTERS = {
    name: function(a,b){ return a.name.en.toLowerCase()<b.name.en.toLowerCase()?-1:1; },
    region: function(a,b){ return a.region<b.region?-1:a.region>b.region?1:(a.name.en<b.name.en?-1:1); },
    new: function(a,b){ return (b.founded||0)-(a.founded||0); },
    old: function(a,b){ return (a.founded||9999)-(b.founded||9999); },
    conf: function(a,b){ var o={high:0,medium:1,low:2}; return (o[a.confidence]-o[b.confidence])||(a.name.en<b.name.en?-1:1); }
  };

  function entCard(r){
    var sectors=(r.sectors||[]).slice(0,3).map(function(s){return '<span class="tag">'+esc(label("sector",s))+"</span>";}).join("");
    var localName = r.name.zh && r.name.zh!==r.name.en && state.lang==="zh" ? '<span class="ecard__local">'+esc(r.name.zh)+"</span>" : "";
    var displayName = state.lang==="zh" ? (r.name.zh||r.name.en) : r.name.en;
    return '<article class="ecard card" tabindex="0" role="button" data-item data-slug="'+esc(r.slug)+'" data-region="'+esc(r.region)+'" aria-label="'+esc(displayName)+'">'+
      '<div class="ecard__top"><h3 class="ecard__name">'+esc(displayName)+localName+"</h3>"+
        '<span class="ecard__flag" aria-hidden="true">'+(FLAG[r.region]||"🏳️")+"</span></div>"+
      '<div class="ecard__meta">'+
        '<span class="type-badge">'+esc(label("type",r.type))+"</span>"+
        '<span class="dot"></span><span>'+esc(r.country||label("region",r.region))+"</span>"+
        (r.founded?'<span class="dot"></span><span>'+esc(String(r.founded))+"</span>":"")+
        '<span class="dot"></span><span class="conf conf--'+esc(r.confidence)+'">'+esc(label("conf",r.confidence))+"</span>"+
      "</div>"+
      (t(r.tagline)?'<p class="ecard__tagline">'+esc(t(r.tagline))+"</p>":"")+
      (sectors?'<div class="ecard__tags">'+sectors+"</div>":"")+
    "</article>";
  }

  function applyFilter(updateChips){
    visible = INDEX.filter(matchRec).sort(SORTERS[state.sort]||SORTERS.name);
    var grid=$("dirGrid"); if(!grid) return;
    var shown=visible.slice(0,state.limit);
    grid.innerHTML = shown.length ? shown.map(entCard).join("")
      : '<div class="empty" style="grid-column:1/-1"><span class="material-symbols-rounded">search_off</span>'+esc(ui("empty"))+"</div>";
    var cnt=$("dirCount");
    if(cnt) cnt.innerHTML = esc(ui("showing"))+" <b>"+Math.min(state.limit,visible.length)+"</b> "+esc(ui("of"))+" <b>"+visible.length+"</b> "+esc(ui("results"));
    var moreWrap=$("dirMoreWrap"), moreTxt=$("dirMoreTxt");
    if(moreWrap){ moreWrap.hidden = visible.length<=state.limit; }
    if(moreTxt){ moreTxt.textContent = ui("load_more")+" (+"+Math.min(PAGE,visible.length-state.limit)+")"; }
    wireCards();
    if(updateChips!==false) syncChipStates();
    syncURL();
  }

  function syncChipStates(){
    ["region","type","sector","stage","conf"].forEach(function(axis){
      var wrap=document.querySelector('[data-chips="'+axis+'"]'); if(!wrap) return;
      [].forEach.call(wrap.querySelectorAll(".chip"),function(c){
        var on=state[axis].has(c.dataset.val);
        c.classList.toggle("chip--on", on);
        c.setAttribute("aria-pressed", on?"true":"false");
      });
    });
  }

  /* ---- charts (horizontal bars) ---- */
  function hbars(axis, max){
    var rows=(META.axes[axis]||[]).slice(0, max||12);
    var top=Math.max.apply(null, rows.map(function(r){return r.count;}).concat([1]));
    return rows.map(function(r){
      var pct=Math.round(r.count/top*100);
      return '<div class="hbar"><span class="hbar__label">'+esc(r[state.lang]||r.en)+'</span>'+
        '<span class="hbar__track"><span class="hbar__fill" style="width:'+pct+'%"></span></span>'+
        '<span class="hbar__val">'+r.count+'</span></div>';
    }).join("");
  }
  function renderCharts(){
    return sectionHead("charts_title","charts_sub")+
      '<div class="charts-grid">'+
        '<figure class="chart-card" data-item><h3>'+esc(ui("chart_region"))+"</h3>"+hbars("region",9)+"</figure>"+
        '<figure class="chart-card" data-item><h3>'+esc(ui("chart_type"))+"</h3>"+hbars("type",12)+"</figure>"+
      "</div>";
  }

  /* ---- glossary ---- */
  function renderGlossary(){
    var types=(META.glossary&&META.glossary.types||[]).map(function(g){
      return '<details class="acc-item" data-item><summary class="acc-q"><span>'+esc(g[state.lang]||g.en)+'</span><span class="material-symbols-rounded acc-chevron">expand_more</span></summary>'+
        '<div class="acc-a">'+esc(g.en)+(g.zh&&g.zh!==g.en?" · "+esc(g.zh):"")+"</div></details>";
    }).join("");
    return sectionHead("glossary_title","glossary_sub")+'<div class="accordion">'+types+"</div>";
  }

  /* ---- freshness ---- */
  function renderFreshness(){
    var cards=(META.freshness||[]).map(function(f){
      var note = state.lang==="zh" ? (f.note_zh||f.note_en) : (f.note_en||f.note_zh);
      var src = f.source_url ? '<a class="det__site" href="'+esc(f.source_url)+'" target="_blank" rel="noopener"><span class="material-symbols-rounded">open_in_new</span>'+esc(f.source_title||"source")+"</a>" : "";
      return '<div class="fresh-card" data-item><div class="fresh-card__top"><span class="fresh-card__name">'+(FLAG[f.region]||"")+" "+esc(f.name)+'</span><span class="fresh-card__as">'+esc(f.as_of||"2026")+"</span></div>"+
        '<p class="fresh-card__note">'+esc(note)+"</p>"+src+"</div>";
    }).join("");
    return sectionHead("fresh_title","fresh_sub")+'<div class="fresh-grid">'+cards+"</div>";
  }

  /* ---- about ---- */
  function renderAbout(){
    var en = state.lang==="en";
    var p = en ? [
      "This is an open, unofficial directory of <b>"+(META.total||INDEX.length)+"</b> investment organizations across <b>"+(META.axes.region||[]).length+"</b> regions — VC firms, accelerators, incubators, corporate VCs, angel networks, government programs, venture studios, micro-VCs and family offices.",
      "<b>How it was built:</b> ~232 parallel research agents (24–31 segments per region) each searched a slice of a region's funding ecosystem and produced structured, sourced records, deduped and schema-validated into the dataset behind this page.",
      "<b>Provenance:</b> every quantitative claim (fund size, check size, equity %, acceptance rate…) is tied to a source quote, and each entry carries a confidence rating (high / medium / low). Open any card to see its sources.",
      "<b>Disclaimer:</b> unofficial research compilation, for reference only. Figures may be out of date — verify against each entry's sources before citing."
    ] : [
      "這是一份開放、非官方的投資機構名錄,收錄 <b>"+(META.total||INDEX.length)+"</b> 間機構、橫跨 <b>"+(META.axes.region||[]).length+"</b> 個地區 — 涵蓋創投、加速器、育成中心、企業創投、天使網絡、政府計畫、創業工作室、Micro-VC 與家族辦公室。",
      "<b>怎麼做的:</b>約 232 個平行研究 agent(每個地區 24–31 個切片),各自查證一塊資金生態系、產出結構化且附來源的資料,再去重與 schema 驗證後彙整成本頁背後的資料集。",
      "<b>可溯源:</b>每個量化數字(基金規模、單筆金額、股權 %、錄取率…)都綁定來源 quote,每筆並標示信心度(高 / 中 / 低)。點開任一卡片即可看到來源。",
      "<b>免責:</b>非官方整理,僅供參考。數字可能過時,引用前請依各筆來源自行查證。"
    ];
    var body = p.map(function(x){return "<p>"+x+"</p>";}).join("")+
      '<p><a href="https://github.com/tingwei161803/all-vc-info" target="_blank" rel="noopener">GitHub: tingwei161803/all-vc-info →</a></p>';
    return sectionHead("about_title")+'<div class="prose" data-item>'+body+"</div>";
  }

  var RENDERERS = { hero:renderHero, directory:renderDirectory, charts:renderCharts, glossary:renderGlossary, freshness:renderFreshness, about:renderAbout };

  /* =======================================================================
     PAINT
     ===================================================================== */
  function paintSections(){
    sectionsEl.innerHTML="";
    SECTIONS.forEach(function(sec){
      var fn=RENDERERS[sec.type]; if(!fn) return;
      var el=document.createElement("section");
      el.className="section section--"+sec.type; el.id=sec.id;
      el.innerHTML=fn();
      sectionsEl.appendChild(el);
    });
    wireDirectory();
    applyFilter();
  }
  function paintNav(){
    navInner.innerHTML="";
    SECTIONS.forEach(function(sec){
      var a=document.createElement("a");
      a.className="navpill"; a.href="#"+sec.id; a.dataset.target=sec.id;
      a.innerHTML='<span class="material-symbols-rounded">'+(NAV_ICONS[sec.type]||"label")+"</span><span>"+esc(ui(NAV_LABEL[sec.id]||sec.id))+"</span>";
      a.addEventListener("click",function(e){ e.preventDefault(); var el=$(sec.id); if(el) el.scrollIntoView({behavior:"smooth",block:"start"}); history.replaceState(null,"","#"+sec.id); });
      navInner.appendChild(a);
    });
  }
  function paintChrome(){
    document.documentElement.setAttribute("lang", state.lang==="zh"?"zh-Hant":"en");
    document.title = (state.lang==="zh"?"全球創投與加速器名錄":"Global VC & Accelerator Directory")+" · All-VC-Info";
    var b=$("brandName"); if(b) b.textContent=ui("brand");
    var f=$("footerText"); if(f) f.textContent=ui("footer");
  }
  function render(){ paintChrome(); paintNav(); paintSections(); setupScrollSpy(); animateCounters(); }

  /* ---- count-up ---- */
  function animateCounters(){
    var els=[].slice.call(document.querySelectorAll(".hero__stat-value[data-count]"));
    if(!els.length) return;
    function run(el){ if(el.dataset.done==="1") return; el.dataset.done="1";
      var target=parseFloat(el.dataset.count)||0, dur=1100, start=null;
      function step(ts){ if(start===null) start=ts; var p=Math.min(1,(ts-start)/dur); var e=1-Math.pow(1-p,3);
        el.textContent=String(Math.round(target*e)); if(p<1) requestAnimationFrame(step); else el.textContent=String(target); }
      requestAnimationFrame(step); }
    if(!("IntersectionObserver" in window)){ els.forEach(run); return; }
    var io=new IntersectionObserver(function(en){ en.forEach(function(e){ if(e.isIntersecting){ run(e.target); io.unobserve(e.target);} }); },{threshold:.4});
    els.forEach(function(el){ io.observe(el); });
  }

  /* ---- scrollspy ---- */
  var spy=null;
  function setupScrollSpy(){
    if(spy){ spy.disconnect(); spy=null; }
    if(!("IntersectionObserver" in window)) return;
    var pills={}; [].forEach.call(navInner.children,function(a){ pills[a.dataset.target]=a; });
    spy=new IntersectionObserver(function(ents){ ents.forEach(function(en){ var pill=pills[en.target.id]; if(!pill) return;
      if(en.isIntersecting){ [].forEach.call(navInner.children,function(p){ p.classList.remove("navpill--active"); p.removeAttribute("aria-current"); });
        pill.classList.add("navpill--active"); pill.setAttribute("aria-current","true");
        if(pill.scrollIntoView) pill.scrollIntoView({block:"nearest",inline:"center",behavior:"smooth"}); } }); },{rootMargin:"-45% 0px -50% 0px",threshold:0});
    SECTIONS.forEach(function(sec){ var el=$(sec.id); if(el) spy.observe(el); });
  }

  /* =======================================================================
     DIRECTORY WIRING
     ===================================================================== */
  var searchTimer=null;
  function wireDirectory(){
    var s=$("dirSearch");
    if(s) s.addEventListener("input",function(){ clearTimeout(searchTimer); searchTimer=setTimeout(function(){ state.q=s.value.trim(); state.limit=PAGE; applyFilter(false); },180); });
    var sort=$("dirSort"); if(sort) sort.addEventListener("change",function(){ state.sort=sort.value; applyFilter(false); });
    var reset=$("dirReset"); if(reset) reset.addEventListener("click",function(){ resetFilters(); });
    var csv=$("dirCsv"); if(csv) csv.addEventListener("click",exportCSV);
    var more=$("dirMore"); if(more) more.addEventListener("click",function(){ state.limit+=PAGE; applyFilter(false); });
    [].forEach.call(document.querySelectorAll(".chips .chip"),function(c){
      c.addEventListener("click",function(){
        var axis=c.dataset.facet, val=c.dataset.val, set=state[axis];
        if(set.has(val)) set.delete(val); else set.add(val);
        state.limit=PAGE; applyFilter();
      });
    });
  }
  function resetFilters(){
    state.q=""; state.region.clear(); state.type.clear(); state.sector.clear(); state.stage.clear(); state.conf.clear();
    state.sort="name"; state.limit=PAGE;
    var s=$("dirSearch"); if(s) s.value=""; var so=$("dirSort"); if(so) so.value="name";
    applyFilter();
  }

  function exportCSV(){
    var cols=["slug","name_en","name_local","type","region","country","hq","founded","sectors","stages","confidence","website"];
    var rows=[cols.join(",")];
    function q(v){ v=String(v==null?"":v); return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; }
    visible.forEach(function(r){
      rows.push([r.slug,r.name.en,r.name.zh,r.type,r.region,r.country,r.hq,r.founded,(r.sectors||[]).join("|"),(r.stages||[]).join("|"),r.confidence,r.website].map(q).join(","));
    });
    var blob=new Blob([rows.join("\n")],{type:"text/csv;charset=utf-8;"});
    var a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download="all-vc-info"+(visible.length<INDEX.length?"-filtered":"")+".csv"; a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); },1000);
  }

  /* ---- URL state ---- */
  function syncURL(){
    var p=new URLSearchParams();
    if(state.q) p.set("q",state.q);
    ["region","type","sector","stage","conf"].forEach(function(a){ if(state[a].size) p.set(a,[].join.call(state[a],",")); });
    if(state.sort!=="name") p.set("sort",state.sort);
    var qs=p.toString();
    history.replaceState(null,"",qs?location.pathname+"?"+qs+location.hash:location.pathname+location.hash);
  }
  function loadURL(){
    var p=new URLSearchParams(location.search);
    if(p.get("q")) state.q=p.get("q");
    ["region","type","sector","stage","conf"].forEach(function(a){ var v=p.get(a); if(v) v.split(",").forEach(function(x){ state[a].add(x); }); });
    if(p.get("sort")) state.sort=p.get("sort");
  }

  /* =======================================================================
     DIALOG — lazy-load region detail, then render
     ===================================================================== */
  var loadedRegions={}, loadingRegions={};
  function ensureFull(region,cb){
    if(loadedRegions[region]){ cb(); return; }
    if(loadingRegions[region]){ loadingRegions[region].push(cb); return; }
    loadingRegions[region]=[cb];
    function done(){ loadedRegions[region]=true; var cbs=loadingRegions[region]||[]; delete loadingRegions[region]; cbs.forEach(function(f){f();}); }
    var sc=document.createElement("script");
    sc.src="data/full/"+region+".js";
    sc.onload=done; sc.onerror=done;
    document.body.appendChild(sc);
  }

  function money(m){ if(!m) return ""; if(typeof m==="string") return m; return m.raw||(m.usd?("$"+m.usd.toLocaleString()):""); }
  function kv(k,v){ return v?'<div class="kv"><span class="kv__k">'+esc(k)+'</span><span class="kv__v">'+v+"</span></div>":""; }
  function fact(k,v){ return v?'<div class="fact"><div class="fact__k">'+esc(k)+'</div><div class="fact__v">'+esc(v)+"</div></div>":""; }

  function renderDetail(e){
    var nm=e.name||{}; var enName=nm.en||e.id; var localName=nm.local&&nm.local!==enName?nm.local:"";
    var strat=e.strategy||{}, cap=e.capital||{}, prog=e.program||{}, tr=e.track_record||{};
    var lead = t(e.summary)|| strat.thesis || "";

    var badges='<span class="type-badge">'+esc(label("type",e.type))+"</span>"+
      '<span class="conf conf--'+esc(e.confidence||"medium")+'">'+esc(label("conf",e.confidence||"medium"))+" · "+esc(ui("f_conf"))+"</span>"+
      '<span class="conf">'+(FLAG[e.region]||"")+" "+esc(e.country||label("region",e.region))+(e.hq_city?" · "+esc(e.hq_city):"")+"</span>"+
      (e.website?'<a class="det__site" href="'+esc(e.website)+'" target="_blank" rel="noopener"><span class="material-symbols-rounded">open_in_new</span>'+esc(ui("visit"))+"</a>":"");

    var facts='<div class="det__facts">'+
      fact(ui("lbl_founded"), e.founded_year)+
      fact(ui("lbl_stages"), (strat.stages||[]).map(function(s){return label("stage",s);}).join(", "))+
      fact(ui("lbl_check"), money(strat.check_size))+
      fact(ui("lbl_aum"), money(cap.aum))+
      fact(ui("lbl_fund"), money(cap.current_fund))+
      fact(ui("lbl_portfolio"), tr.portfolio_count)+
      fact(ui("lbl_team"), e.team_size)+
    "</div>";

    var html='<div class="det__head"><span class="det__flag">'+(FLAG[e.region]||"🏳️")+'</span>'+
      '<div><h2 class="det__title" id="dialogTitle">'+esc(enName)+(localName?' <span class="det__local">'+esc(localName)+"</span>":"")+"</h2></div></div>"+
      '<div class="det__badges">'+badges+"</div>"+
      (lead?'<p class="det__lead">'+esc(lead)+"</p>":"")+facts;

    // strategy
    var sectors=(strat.sector_focus||[]).map(function(s){return '<span class="tag">'+esc(label("sector",s))+"</span>";}).join("");
    var stratBody=kv(ui("k_thesis"),strat.thesis?esc(strat.thesis):"")+
      (sectors?kv(ui("k_sectors"),'<span class="chiprow">'+sectors+"</span>"):"")+
      kv(ui("k_geo"),(strat.geo_focus||[]).map(esc).join(", "))+
      kv(ui("k_lead"),strat.lead_or_follow?esc(strat.lead_or_follow):"");
    if(stratBody) html+='<div class="det__sec"><h3><span class="material-symbols-rounded">target</span>'+esc(ui("sec_strategy"))+"</h3>"+stratBody+"</div>";

    // capital
    var funds=(cap.funds||[]).map(function(f){ return "<li>"+esc(f.name||"fund")+(f.vintage_year?" ("+f.vintage_year+")":"")+(money(f.size)?' — <span class="muted">'+esc(money(f.size))+"</span>":"")+"</li>"; }).join("");
    if(funds) html+='<div class="det__sec"><h3><span class="material-symbols-rounded">savings</span>'+esc(ui("sec_capital"))+'</h3><ul class="minilist">'+funds+"</ul></div>";

    // program
    if(prog && Object.keys(prog).length){
      var pBody=kv(ui("k_length"),prog.length_weeks?prog.length_weeks+" "+ui("weeks"):"")+
        kv(ui("k_cohort"),prog.cohort_size)+kv(ui("k_batches"),prog.batches_per_year)+
        kv(ui("k_equity"),prog.equity_taken_pct!=null?String(prog.equity_taken_pct):"")+
        kv(ui("k_invest"),money(prog.investment))+kv(ui("k_accept"),prog.acceptance_rate)+
        kv(ui("k_eligibility"),prog.eligibility?esc(prog.eligibility):"")+
        (prog.application_url?kv(ui("k_applyurl"),'<a class="det__site" href="'+esc(prog.application_url)+'" target="_blank" rel="noopener">'+esc(prog.application_url)+"</a>"):"");
      if(pBody) html+='<div class="det__sec"><h3><span class="material-symbols-rounded">rocket_launch</span>'+esc(ui("sec_program"))+"</h3>"+pBody+"</div>";
    }

    // track record
    var notable=(tr.notable_investments||[]).map(function(n){ return "<li>"+esc(n.company)+(n.outcome?' <span class="muted">— '+esc(n.outcome)+"</span>":"")+"</li>"; }).join("");
    var exits=(tr.exits||[]).map(function(x){ return "<li>"+esc(x.company)+(x.type?" ("+esc(x.type)+(x.year?" "+x.year:"")+")":"")+(money(x.value)?' <span class="muted">'+esc(money(x.value))+"</span>":"")+"</li>"; }).join("");
    var trBody=(notable?kv(ui("k_notable"),'<ul class="minilist">'+notable+"</ul>"):"")+
      (exits?kv(ui("k_exits"),'<ul class="minilist">'+exits+"</ul>"):"")+
      ((tr.co_investors||[]).length?kv(ui("k_coinv"),(tr.co_investors||[]).map(esc).join(", ")):"");
    if(trBody) html+='<div class="det__sec"><h3><span class="material-symbols-rounded">trending_up</span>'+esc(ui("sec_track"))+"</h3>"+trBody+"</div>";

    // people
    var people=(e.people||[]).map(function(p){ return "<li>"+esc(p.name)+(p.role?' <span class="muted">— '+esc(p.role)+"</span>":"")+"</li>"; }).join("");
    if(people) html+='<div class="det__sec"><h3><span class="material-symbols-rounded">groups</span>'+esc(ui("sec_people"))+'</h3><ul class="minilist">'+people+"</ul></div>";

    // application
    var ap=e.application||{};
    var apBody=(ap.how_to_apply?"<p style='margin:0 0 8px;font-size:.88rem;line-height:1.5'>"+esc(ap.how_to_apply)+"</p>":"")+
      kv(ui("k_cold"),ap.accepts_cold_inbound==null?"":(ap.accepts_cold_inbound?ui("yes"):ui("no")))+
      kv(ui("k_contact"),ap.contact?esc(ap.contact):"");
    if(apBody.trim()) html+='<div class="det__sec"><h3><span class="material-symbols-rounded">how_to_reg</span>'+esc(ui("sec_apply"))+"</h3>"+apBody+"</div>";

    // sources
    var srcs=(e.sources||[]).map(function(s){
      return '<div class="src"><div class="src__head"><a class="src__title" href="'+esc(s.url)+'" target="_blank" rel="noopener"><span class="material-symbols-rounded">link</span>'+esc(s.title||s.url)+"</a>"+
        (s.publisher?'<span class="src__pub">'+esc(s.publisher)+(s.accessed?" · "+esc(s.accessed):"")+"</span>":"")+"</div>"+
        (s.supports?'<p class="src__supports">'+esc(ui("supports"))+": "+esc(s.supports)+"</p>":"")+
        (s.quote?'<blockquote class="src__quote">"'+esc(s.quote)+'"</blockquote>':"")+"</div>";
    }).join("");
    if(srcs) html+='<div class="det__sec"><h3><span class="material-symbols-rounded">fact_check</span>'+esc(ui("sec_sources"))+" ("+(e.sources||[]).length+")</h3>"+srcs+"</div>";
    if(e.verification_notes) html+='<div class="det__note"><b>'+esc(ui("note"))+":</b> "+esc(e.verification_notes)+"</div>";

    return html;
  }

  function openDialog(slug){
    var rec=INDEX.find(function(r){return r.slug===slug;});
    if(!rec) return;
    dialogBody.innerHTML='<div class="empty"><span class="material-symbols-rounded">hourglass_top</span>'+esc(ui("loading"))+"</div>";
    if(!dialog.open) dialog.showModal();
    if(location.hash.slice(1)!==slug) history.replaceState(null,"","#"+slug);
    ensureFull(rec.region,function(){
      var full=window.VC_FULL[slug];
      dialogBody.innerHTML = full ? renderDetail(full) : '<div class="empty">—</div>';
      dialogBody.scrollTop=0;
      updateDialogNav(slug);
    });
  }
  function updateDialogNav(slug){
    var i=visible.findIndex(function(r){return r.slug===slug;});
    var prev=$("dialogPrev"), next=$("dialogNext");
    if(prev) prev.disabled = i<=0;
    if(next) next.disabled = i<0 || i>=visible.length-1;
  }
  function navBy(d){
    var slug=location.hash.slice(1);
    var i=visible.findIndex(function(r){return r.slug===slug;});
    if(i<0) return;
    var j=i+d; if(j<0||j>=visible.length) return;
    openDialog(visible[j].slug);
  }
  function closeDialog(){ if(dialog.open) dialog.close(); if(location.hash) history.replaceState(null,"",location.pathname+location.search); }

  function wireCards(){
    [].forEach.call(document.querySelectorAll(".ecard[data-slug]"),function(card){
      var slug=card.dataset.slug;
      card.addEventListener("click",function(){ openDialog(slug); });
      card.addEventListener("keydown",function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); openDialog(slug); } });
    });
  }

  /* =======================================================================
     THEME + LANG + WIRING
     ===================================================================== */
  function applyTheme(){ document.documentElement.setAttribute("data-theme",state.theme); var i=$("themeIcon"); if(i) i.textContent=state.theme==="dark"?"light_mode":"dark_mode"; lsSet("theme",state.theme); }
  function applyLangChrome(){ var l=$("langLabel"); if(l) l.textContent=state.lang==="en"?"EN":"中"; lsSet("lang",state.lang); }

  function ghStar(){
    var el=$("ghStarCount"), wrap=$("ghStar"); if(!wrap) return;
    fetch("https://api.github.com/repos/"+wrap.dataset.repo).then(function(r){return r.ok?r.json():null;})
      .then(function(j){ if(j&&typeof j.stargazers_count==="number"&&el) el.textContent=j.stargazers_count; }).catch(function(){});
  }

  function wire(){
    $("themeToggle").addEventListener("click",function(){ state.theme=state.theme==="dark"?"light":"dark"; applyTheme(); });
    $("langToggle").addEventListener("click",function(){
      state.lang=state.lang==="en"?"zh":"en"; applyLangChrome();
      var open=dialog.open?location.hash.slice(1):null;
      render();
      if(open){ openDialog(open); }
    });
    $("dialogClose").addEventListener("click",closeDialog);
    $("dialogPrev").addEventListener("click",function(){ navBy(-1); });
    $("dialogNext").addEventListener("click",function(){ navBy(1); });
    dialog.addEventListener("click",function(e){ if(e.target===dialog) closeDialog(); });
    dialog.addEventListener("close",function(){ if(location.hash) history.replaceState(null,"",location.pathname+location.search); });
    document.addEventListener("keydown",function(e){ if(!dialog.open) return; if(e.key==="ArrowLeft") navBy(-1); else if(e.key==="ArrowRight") navBy(1); });
    window.addEventListener("hashchange",function(){ var s=location.hash.slice(1); if(s && INDEX.find(function(r){return r.slug===s;})){ if(!dialog.open||location.hash.slice(1)!==s) openDialog(s); } else if(!s && dialog.open){ dialog.close(); } });
  }

  function init(){
    applyTheme(); applyLangChrome(); loadURL();
    render(); wire(); ghStar();
    var s=location.hash.slice(1); if(s && INDEX.find(function(r){return r.slug===s;})) openDialog(s);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();
