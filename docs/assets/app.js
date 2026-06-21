/* =========================================================================
   All-VC-Info · app.js — multi-page, config-driven engine (vanilla, zero-build)

   Each page sets window.SITE_PAGE = { id, kind, title, sub, sections:[...] }
   BEFORE this script. A section is { type, id, title, sub, source?, ...opts }.
   RENDERERS[type] turns it into HTML; one render() repaints the whole page +
   cross-page rail + section nav in the active language (zh/en, no leaks).

   Data layer: VC_META (taxonomy + analytics), VC_INDEX (slim, all rows),
   VC_FULL (full detail, lazy-loaded per region on dialog open).
   ========================================================================= */
(function () {
  "use strict";

  var META = window.VC_META || { axes: {}, glossary: {}, analytics: {}, region_summary: {} };
  var INDEX = Array.isArray(window.VC_INDEX) ? window.VC_INDEX : [];
  window.VC_FULL = window.VC_FULL || {};
  var A = META.analytics || {};

  var FLAG = { "taiwan": "🇹🇼", "united-states": "🇺🇸", "japan": "🇯🇵", "europe": "🇪🇺",
    "south-korea": "🇰🇷", "southeast-asia": "🌏", "israel": "🇮🇱", "india": "🇮🇳", "canada": "🇨🇦" };

  /* cross-page nav registry */
  var PAGES = [
    { id: "home", href: "index.html", icon: "home", en: "Overview", zh: "總覽" },
    { id: "directory", href: "directory.html", icon: "travel_explore", en: "Directory", zh: "完整名錄" },
    { id: "regions", href: "region.html", icon: "public", en: "Regions", zh: "分地區" },
    { id: "analysis", href: "analysis.html", icon: "analytics", en: "Analysis", zh: "統計分析" },
    { id: "methodology", href: "methodology.html", icon: "menu_book", en: "Method", zh: "方法論" }
  ];

  var I18N = {
    en: { brand: "All-VC-Info", footer: "Unofficial research compilation · every figure is traceable to the sources on each entry. Verify before citing.", by: "Researched & compiled by Peter",
      close: "Close", search_ph: "Search name, country, thesis, portfolio…",
      f_region: "Region", f_type: "Type", f_sector: "Sector", f_stage: "Stage", f_conf: "Confidence",
      more_filters: "More filters", reset: "Reset", csv: "Export CSV", sort_label: "Sort",
      sort_name: "Name (A–Z)", sort_region: "Region", sort_new: "Founded (newest)", sort_old: "Founded (oldest)", sort_conf: "Confidence",
      showing: "Showing", of: "of", results: "organizations", load_more: "Load more", empty: "No organizations match these filters.",
      loading: "Loading detail…", visit: "Website", supports: "Supports", note: "Note", explore: "Explore",
      lbl_hq: "HQ", lbl_founded: "Founded", lbl_stages: "Stages", lbl_check: "Check size", lbl_aum: "AUM", lbl_fund: "Current fund", lbl_portfolio: "Portfolio", lbl_team: "Team size",
      sec_strategy: "Strategy", sec_capital: "Capital", sec_program: "Program", sec_track: "Track record", sec_people: "People", sec_apply: "How to apply", sec_sources: "Sources & evidence",
      k_thesis: "Thesis", k_sectors: "Sectors", k_geo: "Geo focus", k_lead: "Lead/follow", k_funds: "Funds", k_cohort: "Cohort", k_batches: "Batches/yr", k_length: "Length", k_equity: "Equity",
      k_invest: "Investment", k_accept: "Acceptance", k_eligibility: "Eligibility", k_applyurl: "Apply", k_notable: "Notable investments", k_exits: "Exits", k_coinv: "Co-investors", k_cold: "Cold inbound", k_contact: "Contact",
      weeks: "wks", yes: "Yes", no: "No", view_region: "View region", entities: "organizations", top_types: "Top types", top_sectors: "Top sectors", rank: "Rank", count: "Count" },
    zh: { brand: "全球創投名錄", footer: "非官方整理 · 每個數字都可回溯到該筆的來源。引用前請自行查證。", by: "由 Peter 搜尋整理",
      close: "關閉", search_ph: "搜尋 機構名 / 國家 / 論點 / 被投公司…",
      f_region: "地區", f_type: "類型", f_sector: "產業", f_stage: "階段", f_conf: "信心度",
      more_filters: "進階篩選", reset: "清除", csv: "匯出 CSV", sort_label: "排序",
      sort_name: "名稱 (A–Z)", sort_region: "地區", sort_new: "成立(新→舊)", sort_old: "成立(舊→新)", sort_conf: "信心度",
      showing: "顯示", of: "／共", results: "間機構", load_more: "載入更多", empty: "沒有符合篩選條件的機構。",
      loading: "載入詳情中…", visit: "官網", supports: "佐證", note: "備註", explore: "瀏覽",
      lbl_hq: "總部", lbl_founded: "成立", lbl_stages: "階段", lbl_check: "單筆金額", lbl_aum: "管理規模", lbl_fund: "現行基金", lbl_portfolio: "投資組合", lbl_team: "團隊規模",
      sec_strategy: "投資策略", sec_capital: "資本", sec_program: "計畫內容", sec_track: "戰績", sec_people: "團隊", sec_apply: "如何申請", sec_sources: "來源與佐證",
      k_thesis: "投資論點", k_sectors: "產業", k_geo: "地理focus", k_lead: "領投/跟投", k_funds: "歷期基金", k_cohort: "每梯人數", k_batches: "一年梯次", k_length: "梯次長度", k_equity: "股權",
      k_invest: "投資金額", k_accept: "錄取率", k_eligibility: "資格", k_applyurl: "申請連結", k_notable: "代表案例", k_exits: "退出", k_coinv: "共同投資方", k_cold: "接受 cold inbound", k_contact: "聯絡",
      weeks: "週", yes: "是", no: "否", view_region: "查看此地區", entities: "間機構", top_types: "主要類型", top_sectors: "主要產業", rank: "排名", count: "數量" }
  };

  function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function lsSet(k,v){ try { localStorage.setItem(k,v); } catch(e){} }

  var PAGE = window.SITE_PAGE || { id: "home", kind: "home", title: { en: "All-VC-Info", zh: "全球創投名錄" }, sections: [] };
  var PARAMS = new URLSearchParams(location.search);
  var CUR_REGION = PAGE.kind === "region" ? (PARAMS.get("r") || "") : "";

  var state = {
    lang: lsGet("lang") || "zh", theme: lsGet("theme") || "light",
    q: "", region: new Set(), type: new Set(), sector: new Set(), stage: new Set(), conf: new Set(),
    sort: "name", limit: 48
  };
  var PER = 48, visible = [];
  if (CUR_REGION) state.region.add(CUR_REGION);

  var $ = function(id){ return document.getElementById(id); };
  var sectionsEl = $("sections"), navInner = $("sectionNavInner"), railEl = $("siteRail");
  var dialog = $("dialog"), dialogBody = $("dialogBody");

  function t(o){ if(o==null) return ""; if(typeof o==="string") return o; return o[state.lang]||o.en||o.zh||""; }
  function ui(k){ return (I18N[state.lang]||I18N.en)[k]||k; }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];}); }
  function lblMap(ax){ var m={}; (META.axes[ax]||[]).forEach(function(o){ m[o.key]=o; }); return m; }
  var L = { region:lblMap("region"), type:lblMap("type"), sector:lblMap("sector"), stage:lblMap("stage"), conf:lblMap("confidence") };
  function label(ax,key){ var o=L[ax][key]; return o?o[state.lang]||o.en:key; }
  function num(n){ return (n==null?0:n).toLocaleString(); }
  function money(m){ if(!m) return ""; if(typeof m==="string") return m; return m.raw||(m.usd?("$"+num(m.usd)):""); }
  function usdShort(v){ if(v>=1e9) return "$"+(v/1e9).toFixed(v>=1e10?0:1)+"B"; if(v>=1e6) return "$"+(v/1e6).toFixed(0)+"M"; return "$"+num(v); }

  /* ---------- data sources for chart sections ---------- */
  function resolveSource(src, opts) {
    opts = opts || {};
    if (!src) return [];
    if (src.indexOf("axis:") === 0) {
      var ax = src.slice(5), arr = (META.axes[ax] || []).slice();
      if (opts.limit) arr = arr.slice(0, opts.limit);
      return arr.map(function(o){ return { label: { en: o.en, zh: o.zh }, value: o.count, key: o.key }; });
    }
    if (src === "analytics:founded") return (A.founded || []).map(function(f){ return { label: { en: f.bucket, zh: f.bucket }, value: f.count }; });
    if (src === "region:top_types") { var r = (META.region_summary[CUR_REGION] || {}).top_types || []; return r.map(function(o){ return { label: { en: o.en, zh: o.zh }, value: o.count, key: o.key }; }); }
    if (src === "region:top_sectors") { var s = (META.region_summary[CUR_REGION] || {}).top_sectors || []; return s.map(function(o){ return { label: { en: o.en, zh: o.zh }, value: o.count, key: o.key }; }); }
    return [];
  }

  /* ---------- generic renderers ---------- */
  function head(sec){
    return '<header class="section-head"><h2 id="'+esc(sec.id)+'-h">'+esc(t(sec.title))+"</h2>"+
      (t(sec.sub)?'<p class="section-head__sub">'+esc(t(sec.sub))+"</p>":"")+"</header>";
  }

  function R_kpi(sec){
    var stats = sec.stats;
    if (sec.source === "overview") stats = [
      { label: { en: "organizations", zh: "間機構" }, value: META.total || INDEX.length },
      { label: { en: "regions", zh: "個地區" }, value: (META.axes.region || []).length },
      { label: { en: "org types", zh: "種類型" }, value: (META.axes.type || []).length },
      { label: { en: "high-confidence", zh: "高信心筆數" }, value: (L.conf.high ? L.conf.high.count : 0) }
    ];
    var cells = (stats||[]).map(function(s){
      return '<div class="hero__stat" data-item><b class="hero__stat-value" data-count="'+esc(String(s.value))+'">0</b>'+
        '<span class="hero__stat-label">'+esc(t(s.label))+"</span></div>";
    }).join("");
    return head(sec)+'<div class="hero__stats">'+cells+"</div>";
  }

  function R_bars(sec){
    var data = sec.data || resolveSource(sec.source, sec);
    var top = Math.max.apply(null, data.map(function(d){return d.value;}).concat([1]));
    var rows = data.map(function(d){
      var pct = Math.round(d.value/top*100);
      return '<div class="hbar"><span class="hbar__label">'+esc(t(d.label))+'</span>'+
        '<span class="hbar__track"><span class="hbar__fill" style="width:'+pct+'%"></span></span>'+
        '<span class="hbar__val">'+num(d.value)+'</span></div>';
    }).join("");
    return head(sec)+'<div class="chart-card" data-item>'+rows+"</div>";
  }

  function R_donut(sec){
    var data = (sec.data || resolveSource(sec.source, sec)).filter(function(d){return d.value>0;});
    var total = data.reduce(function(a,d){return a+d.value;},0)||1;
    var C=2*Math.PI*60, off=0;
    var palette=["#6750A4","#7D5260","#625B71","#3B7A57","#B8860B","#4F8DB5","#9A6A6A","#5B8A72","#8E6FB0","#C07A4A","#6A8CAF","#A0688C"];
    var segs=data.map(function(d,i){
      var frac=d.value/total, len=C*frac, dash=len+" "+(C-len), col=palette[i%palette.length];
      var el='<circle r="60" cx="80" cy="80" fill="none" stroke="'+col+'" stroke-width="28" stroke-dasharray="'+dash+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 80 80)"><title>'+esc(t(d.label))+": "+num(d.value)+"</title></circle>";
      off+=len; return el;
    }).join("");
    var legend=data.map(function(d,i){
      return '<li><span class="lg-dot" style="background:'+palette[i%palette.length]+'"></span>'+esc(t(d.label))+' <b>'+num(d.value)+'</b> <span class="muted">'+Math.round(d.value/total*100)+'%</span></li>';
    }).join("");
    return head(sec)+'<div class="donut-wrap" data-item><svg class="donut" viewBox="0 0 160 160" role="img" aria-label="'+esc(t(sec.title))+'">'+segs+'<text x="80" y="76" text-anchor="middle" class="donut-total">'+num(total)+'</text><text x="80" y="94" text-anchor="middle" class="donut-cap">'+esc(ui("count"))+'</text></svg><ul class="legend">'+legend+"</ul></div>";
  }

  function R_heatmap(sec){
    var h=A.region_type||{regions:[],types:[],matrix:[]};
    var max=1; h.matrix.forEach(function(row){row.forEach(function(v){if(v>max)max=v;});});
    var cols=h.types.map(function(tp){return '<th>'+esc(tp[state.lang]||tp.en)+"</th>";}).join("");
    var rows=h.regions.map(function(rg,i){
      var cells=h.matrix[i].map(function(v){
        var o=v/max; var bg=v?'background:rgba(103,80,164,'+(0.12+o*0.78).toFixed(3)+')':'';
        var cls=o>0.55?' class="hot"':'';
        return '<td'+cls+' style="'+bg+'"><span>'+(v||"")+"</span></td>";
      }).join("");
      return '<tr><th class="rowhdr">'+(FLAG[rg.key]||"")+" "+esc(rg[state.lang]||rg.en)+"</th>"+cells+"</tr>";
    }).join("");
    return head(sec)+'<div class="heatmap-wrap" data-item><table class="heatmap"><thead><tr><th></th>'+cols+"</tr></thead><tbody>"+rows+"</tbody></table></div>";
  }

  function R_regioncards(sec){
    var cards=(META.axes.region||[]).map(function(o){
      var rs=META.region_summary[o.key]||{};
      var types=(rs.top_types||[]).slice(0,3).map(function(x){return '<span class="tag">'+esc(x[state.lang]||x.en)+' '+x.count+"</span>";}).join("");
      return '<a class="rcard" data-item href="region.html?r='+esc(o.key)+'"><div class="rcard__top"><span class="rcard__flag">'+(FLAG[o.key]||"🏳️")+'</span><span class="rcard__n">'+esc(o[state.lang]||o.en)+'</span><span class="rcard__c">'+num(o.count)+'</span></div>'+
        '<div class="rcard__tags">'+types+'</div><span class="rcard__go">'+esc(ui("view_region"))+' →</span></a>';
    }).join("");
    return head(sec)+'<div class="rcards">'+cards+"</div>";
  }

  function R_toplist(sec){
    var rows=(A.top_aum||[]).slice(0, sec.limit||20);
    var top=rows.length?rows[0].usd:1;
    var html=rows.map(function(r,i){
      var pct=Math.round(r.usd/top*100);
      return '<a class="trow" data-item href="directory.html#'+esc(r.slug)+'"><span class="trank">'+(i+1)+'</span>'+
        '<span class="tname">'+(FLAG[r.region]||"")+" "+esc(r.name[state.lang]||r.name.en)+'<span class="muted"> · '+esc(label("type",r.type))+'</span></span>'+
        '<span class="hbar__track tbar"><span class="hbar__fill" style="width:'+pct+'%"></span></span>'+
        '<span class="tval">'+usdShort(r.usd)+"</span></a>";
    }).join("");
    return head(sec)+'<div class="toplist" data-item>'+html+"</div>";
  }

  function R_accel(sec){
    var ac=A.accelerators||{};
    var data=(ac.equity_buckets||[]).map(function(b){return {label:{en:b.label,zh:b.label},value:b.count};});
    var top=Math.max.apply(null,data.map(function(d){return d.value;}).concat([1]));
    var bars=data.map(function(d){var pct=Math.round(d.value/top*100);
      return '<div class="hbar"><span class="hbar__label">'+esc(t(d.label))+'</span><span class="hbar__track"><span class="hbar__fill" style="width:'+pct+'%"></span></span><span class="hbar__val">'+num(d.value)+'</span></div>';}).join("");
    var kpis='<div class="hero__stats" style="margin-bottom:16px">'+
      '<div class="hero__stat"><b class="hero__stat-value">'+num(ac.count)+'</b><span class="hero__stat-label">'+(state.lang==="zh"?"加速器/育成":"accelerators")+'</span></div>'+
      '<div class="hero__stat"><b class="hero__stat-value">'+num(ac.equity_zero)+'</b><span class="hero__stat-label">'+(state.lang==="zh"?"完全不收股權":"equity-free")+'</span></div>'+
      '<div class="hero__stat"><b class="hero__stat-value">'+(ac.equity_avg!=null?ac.equity_avg+"%":"—")+'</b><span class="hero__stat-label">'+(state.lang==="zh"?"平均收取股權":"avg equity taken")+'</span></div>'+
      '<div class="hero__stat"><b class="hero__stat-value">'+num(ac.with_investment)+'</b><span class="hero__stat-label">'+(state.lang==="zh"?"提供現金投資":"give cash")+'</span></div></div>';
    return head(sec)+kpis+'<div class="chart-card" data-item>'+bars+"</div>";
  }

  function R_provenance(sec){
    var p=A.provenance||{};
    var conf=(p.by_confidence||[]).map(function(c){return {label:{en:c.en,zh:c.zh},value:c.count};});
    var top=Math.max.apply(null,conf.map(function(d){return d.value;}).concat([1]));
    var bars=conf.map(function(d,i){var pct=Math.round(d.value/top*100);var cls=["conf-high","conf-med","conf-low"][i]||"";
      return '<div class="hbar"><span class="hbar__label">'+esc(t(d.label))+'</span><span class="hbar__track"><span class="hbar__fill '+cls+'" style="width:'+pct+'%"></span></span><span class="hbar__val">'+num(d.value)+'</span></div>';}).join("");
    var kpis='<div class="hero__stats" style="margin-bottom:16px">'+
      '<div class="hero__stat"><b class="hero__stat-value" data-count="'+p.entities+'">0</b><span class="hero__stat-label">'+(state.lang==="zh"?"間機構":"organizations")+'</span></div>'+
      '<div class="hero__stat"><b class="hero__stat-value" data-count="'+p.sources+'">0</b><span class="hero__stat-label">'+(state.lang==="zh"?"條來源":"sources")+'</span></div>'+
      '<div class="hero__stat"><b class="hero__stat-value">'+p.avg_sources+'</b><span class="hero__stat-label">'+(state.lang==="zh"?"平均來源/筆":"avg sources/entity")+'</span></div>'+
      '<div class="hero__stat"><b class="hero__stat-value" data-count="'+p.with_quote_sources+'">0</b><span class="hero__stat-label">'+(state.lang==="zh"?"附原文 quote":"with quote")+'</span></div></div>';
    return head(sec)+kpis+'<div class="chart-card" data-item>'+bars+"</div>";
  }

  function R_glossary(sec){
    var kind=sec.kind||"types";
    var items=((META.glossary&&META.glossary[kind])||[]).map(function(g){
      return '<details class="acc-item" data-item><summary class="acc-q"><span>'+esc(g[state.lang]||g.en)+'</span><span class="material-symbols-rounded acc-chevron">expand_more</span></summary><div class="acc-a">'+esc(g.en)+(g.zh&&g.zh!==g.en?" · "+esc(g.zh):"")+"</div></details>";
    }).join("");
    return head(sec)+'<div class="accordion">'+items+"</div>";
  }

  function R_freshness(sec){
    var cards=(META.freshness||[]).map(function(f){
      var note=state.lang==="zh"?(f.note_zh||f.note_en):(f.note_en||f.note_zh);
      var src=f.source_url?'<a class="det__site" href="'+esc(f.source_url)+'" target="_blank" rel="noopener"><span class="material-symbols-rounded">open_in_new</span>'+esc(f.source_title||"source")+"</a>":"";
      return '<div class="fresh-card" data-item><div class="fresh-card__top"><span class="fresh-card__name">'+(FLAG[f.region]||"")+" "+esc(f.name)+'</span><span class="fresh-card__as">'+esc(f.as_of||"2026")+'</span></div><p class="fresh-card__note">'+esc(note)+'</p>'+src+'</div>';
    }).join("");
    return head(sec)+'<div class="fresh-grid">'+cards+"</div>";
  }

  function R_prose(sec){
    var body=(sec.blocks||[]).map(function(b){
      if(b.type==="h3") return "<h3>"+esc(t(b.text))+"</h3>";
      if(b.type==="ul"){ var arr=(b.items&&(b.items[state.lang]||b.items.en))||[]; return "<ul>"+arr.map(function(li){return "<li>"+li+"</li>";}).join("")+"</ul>"; }
      return "<p>"+(b.html?t(b.text):esc(t(b.text)))+"</p>";
    }).join("");
    return head(sec)+'<div class="prose" data-item>'+body+"</div>";
  }

  function R_cta(sec){
    var btns=(sec.links||[]).map(function(l){
      return '<a class="cta-btn" href="'+esc(l.href)+'"><span class="material-symbols-rounded">'+(l.icon||"arrow_forward")+'</span>'+esc(t(l.label))+"</a>";
    }).join("");
    return '<div class="cta-card" data-item><h2>'+esc(t(sec.title))+"</h2>"+(t(sec.sub)?"<p>"+esc(t(sec.sub))+"</p>":"")+'<div class="cta-row">'+btns+"</div></div>";
  }

  /* ---------- DIRECTORY ---------- */
  function chipsFor(axis){
    var sel=state[axis==="conf"?"conf":axis];
    return (META.axes[axis]||[]).map(function(o){
      var on=sel.has(o.key);
      return '<button class="chip'+(on?" chip--on":"")+'" type="button" aria-pressed="'+(on?"true":"false")+'" data-facet="'+esc(axis)+'" data-val="'+esc(o.key)+'">'+esc(o[state.lang]||o.en)+'<span class="chip__count">'+o.count+"</span></button>";
    }).join("");
  }
  function R_directory(sec){
    var lockRegion=sec.lockRegion;
    var regionFacet=lockRegion?"":'<div class="facet"><span class="facet__label"><span class="material-symbols-rounded" style="font-size:16px">public</span>'+esc(ui("f_region"))+'</span><div class="chips" data-chips="region">'+chipsFor("region")+"</div></div>";
    return head(sec)+
      '<div class="filters">'+
        '<div class="search-row"><label class="search-box"><span class="material-symbols-rounded">search</span>'+
          '<input type="search" id="dirSearch" autocomplete="off" value="'+esc(state.q)+'" placeholder="'+esc(ui("search_ph"))+'" aria-label="'+esc(ui("search_ph"))+'"></label>'+
          '<div class="toolbar"><select id="dirSort" aria-label="'+esc(ui("sort_label"))+'">'+
            ["name","region","new","old","conf"].map(function(s){return '<option value="'+s+'"'+(state.sort===s?" selected":"")+'>'+esc(ui("sort_"+s))+"</option>";}).join("")+
          '</select><button class="btn-ghost" id="dirCsv" type="button"><span class="material-symbols-rounded">download</span>'+esc(ui("csv"))+'</button>'+
          '<button class="btn-ghost" id="dirReset" type="button"><span class="material-symbols-rounded">restart_alt</span>'+esc(ui("reset"))+"</button></div></div>"+
        regionFacet+
        '<div class="facet"><span class="facet__label"><span class="material-symbols-rounded" style="font-size:16px">category</span>'+esc(ui("f_type"))+'</span><div class="chips" data-chips="type">'+chipsFor("type")+"</div></div>"+
        '<details class="facet"><summary class="facet__label" style="cursor:pointer"><span class="material-symbols-rounded" style="font-size:16px">tune</span>'+esc(ui("more_filters"))+'</summary><div style="margin-top:12px;display:flex;flex-direction:column;gap:12px">'+
          '<div><span class="facet__label" style="margin-bottom:6px">'+esc(ui("f_sector"))+'</span><div class="chips" data-chips="sector">'+chipsFor("sector")+"</div></div>"+
          '<div><span class="facet__label" style="margin-bottom:6px">'+esc(ui("f_stage"))+'</span><div class="chips" data-chips="stage">'+chipsFor("stage")+"</div></div>"+
          '<div><span class="facet__label" style="margin-bottom:6px">'+esc(ui("f_conf"))+'</span><div class="chips" data-chips="conf">'+chipsFor("conf")+"</div></div>"+
        "</div></details></div>"+
      '<div class="result-bar"><span class="result-count" id="dirCount"></span></div>'+
      '<div class="dir-grid" id="dirGrid"></div>'+
      '<div class="load-more-wrap" id="dirMoreWrap" hidden><button class="load-more" id="dirMore" type="button"><span class="material-symbols-rounded">expand_more</span><span id="dirMoreTxt"></span></button></div>';
  }

  function matchRec(r){
    if(state.region.size&&!state.region.has(r.region)) return false;
    if(state.type.size&&!state.type.has(r.type)) return false;
    if(state.conf.size&&!state.conf.has(r.confidence)) return false;
    if(state.sector.size&&!(r.sectors||[]).some(function(s){return state.sector.has(s);})) return false;
    if(state.stage.size&&!(r.stages||[]).some(function(s){return state.stage.has(s);})) return false;
    if(state.q){var q=state.q.toLowerCase(); if((r.q||"").indexOf(q)===-1&&(r.name.en+" "+(r.name.zh||"")).toLowerCase().indexOf(q)===-1) return false;}
    return true;
  }
  var SORTERS={ name:function(a,b){return a.name.en.toLowerCase()<b.name.en.toLowerCase()?-1:1;},
    region:function(a,b){return a.region<b.region?-1:a.region>b.region?1:(a.name.en<b.name.en?-1:1);},
    new:function(a,b){return (b.founded||0)-(a.founded||0);}, old:function(a,b){return (a.founded||9999)-(b.founded||9999);},
    conf:function(a,b){var o={high:0,medium:1,low:2};return (o[a.confidence]-o[b.confidence])||(a.name.en<b.name.en?-1:1);} };
  function entCard(r){
    var sectors=(r.sectors||[]).slice(0,3).map(function(s){return '<span class="tag">'+esc(label("sector",s))+"</span>";}).join("");
    var dn=state.lang==="zh"?(r.name.zh||r.name.en):r.name.en;
    var local=r.name.zh&&r.name.zh!==r.name.en&&state.lang==="zh"?'<span class="ecard__local">'+esc(r.name.zh)+"</span>":"";
    return '<article class="ecard card" tabindex="0" role="button" data-item data-slug="'+esc(r.slug)+'" aria-label="'+esc(dn)+'">'+
      '<div class="ecard__top"><h3 class="ecard__name">'+esc(dn)+local+'</h3><span class="ecard__flag" aria-hidden="true">'+(FLAG[r.region]||"🏳️")+"</span></div>"+
      '<div class="ecard__meta"><span class="type-badge">'+esc(label("type",r.type))+'</span><span class="dot"></span><span>'+esc(r.country||label("region",r.region))+"</span>"+
        (r.founded?'<span class="dot"></span><span>'+esc(String(r.founded))+"</span>":"")+'<span class="dot"></span><span class="conf conf--'+esc(r.confidence)+'">'+esc(label("conf",r.confidence))+"</span></div>"+
      (t(r.tagline)?'<p class="ecard__tagline">'+esc(t(r.tagline))+"</p>":"")+(sectors?'<div class="ecard__tags">'+sectors+"</div>":"")+"</article>";
  }
  function applyFilter(updateChips){
    visible=INDEX.filter(matchRec).sort(SORTERS[state.sort]||SORTERS.name);
    var grid=$("dirGrid"); if(!grid) return;
    var shown=visible.slice(0,state.limit);
    grid.innerHTML=shown.length?shown.map(entCard).join(""):'<div class="empty" style="grid-column:1/-1"><span class="material-symbols-rounded">search_off</span>'+esc(ui("empty"))+"</div>";
    var cnt=$("dirCount"); if(cnt) cnt.innerHTML=esc(ui("showing"))+" <b>"+Math.min(state.limit,visible.length)+"</b> "+esc(ui("of"))+" <b>"+num(visible.length)+"</b> "+esc(ui("results"));
    var mw=$("dirMoreWrap"),mt=$("dirMoreTxt"); if(mw) mw.hidden=visible.length<=state.limit; if(mt) mt.textContent=ui("load_more")+" (+"+Math.min(PER,visible.length-state.limit)+")";
    wireCards(); if(updateChips!==false) syncChips(); syncURL();
  }
  function syncChips(){
    ["region","type","sector","stage","conf"].forEach(function(ax){
      var wrap=document.querySelector('[data-chips="'+ax+'"]'); if(!wrap) return;
      [].forEach.call(wrap.querySelectorAll(".chip"),function(c){var on=state[ax].has(c.dataset.val);c.classList.toggle("chip--on",on);c.setAttribute("aria-pressed",on?"true":"false");});
    });
  }
  function wireDirectory(){
    var s=$("dirSearch"); var tmr;
    if(s) s.addEventListener("input",function(){clearTimeout(tmr);tmr=setTimeout(function(){state.q=s.value.trim();state.limit=PER;applyFilter(false);},180);});
    var so=$("dirSort"); if(so) so.addEventListener("change",function(){state.sort=so.value;applyFilter(false);});
    var rs=$("dirReset"); if(rs) rs.addEventListener("click",function(){state.q="";["type","sector","stage","conf"].forEach(function(k){state[k].clear();});if(!CUR_REGION)state.region.clear();state.sort="name";state.limit=PER;var i=$("dirSearch");if(i)i.value="";applyFilter();});
    var cs=$("dirCsv"); if(cs) cs.addEventListener("click",exportCSV);
    var mo=$("dirMore"); if(mo) mo.addEventListener("click",function(){state.limit+=PER;applyFilter(false);});
    [].forEach.call(document.querySelectorAll(".chips .chip"),function(c){c.addEventListener("click",function(){var ax=c.dataset.facet,v=c.dataset.val,set=state[ax];if(set.has(v))set.delete(v);else set.add(v);state.limit=PER;applyFilter();});});
  }
  function exportCSV(){
    var cols=["slug","name_en","name_local","type","region","country","hq","founded","sectors","stages","confidence","website"];
    var rows=[cols.join(",")];
    function q(v){v=String(v==null?"":v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}
    visible.forEach(function(r){rows.push([r.slug,r.name.en,r.name.zh,r.type,r.region,r.country,r.hq,r.founded,(r.sectors||[]).join("|"),(r.stages||[]).join("|"),r.confidence,r.website].map(q).join(","));});
    var blob=new Blob([rows.join("\n")],{type:"text/csv;charset=utf-8;"});var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="all-vc-info"+(visible.length<INDEX.length?"-filtered":"")+".csv";a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
  }
  function syncURL(){
    if(PAGE.kind!=="directory") return;
    var p=new URLSearchParams();
    if(state.q) p.set("q",state.q);
    ["region","type","sector","stage","conf"].forEach(function(a){if(state[a].size)p.set(a,[].join.call(state[a],","));});
    if(state.sort!=="name") p.set("sort",state.sort);
    var qs=p.toString();
    history.replaceState(null,"",qs?location.pathname+"?"+qs+location.hash:location.pathname+location.hash);
  }
  function loadURL(){
    if(PAGE.kind!=="directory") return;
    var p=PARAMS;
    if(p.get("q")) state.q=p.get("q");
    ["region","type","sector","stage","conf"].forEach(function(a){var v=p.get(a);if(v)v.split(",").forEach(function(x){state[a].add(x);});});
    if(p.get("sort")) state.sort=p.get("sort");
  }

  /* ---------- DIALOG ---------- */
  var loadedRegions={}, loadingRegions={};
  function ensureFull(region,cb){
    if(loadedRegions[region]){cb();return;}
    if(loadingRegions[region]){loadingRegions[region].push(cb);return;}
    loadingRegions[region]=[cb];
    function done(){loadedRegions[region]=true;var cbs=loadingRegions[region]||[];delete loadingRegions[region];cbs.forEach(function(f){f();});}
    var sc=document.createElement("script");sc.src="data/full/"+region+".js";sc.onload=done;sc.onerror=done;document.body.appendChild(sc);
  }
  function kv(k,v){return v?'<div class="kv"><span class="kv__k">'+esc(k)+'</span><span class="kv__v">'+v+"</span></div>":"";}
  function fact(k,v){return v?'<div class="fact"><div class="fact__k">'+esc(k)+'</div><div class="fact__v">'+esc(v)+"</div></div>":"";}
  function renderDetail(e){
    var nm=e.name||{},en=nm.en||e.id,loc=nm.local&&nm.local!==en?nm.local:"";
    var strat=e.strategy||{},cap=e.capital||{},prog=e.program||{},tr=e.track_record||{};
    var lead=t(e.summary)||strat.thesis||"";
    var badges='<span class="type-badge">'+esc(label("type",e.type))+"</span>"+
      '<span class="conf conf--'+esc(e.confidence||"medium")+'">'+esc(label("conf",e.confidence||"medium"))+" · "+esc(ui("f_conf"))+"</span>"+
      '<span class="conf">'+(FLAG[e.region]||"")+" "+esc(e.country||label("region",e.region))+(e.hq_city?" · "+esc(e.hq_city):"")+"</span>"+
      (e.website?'<a class="det__site" href="'+esc(e.website)+'" target="_blank" rel="noopener"><span class="material-symbols-rounded">open_in_new</span>'+esc(ui("visit"))+"</a>":"");
    var facts='<div class="det__facts">'+fact(ui("lbl_founded"),e.founded_year)+fact(ui("lbl_stages"),(strat.stages||[]).map(function(s){return label("stage",s);}).join(", "))+fact(ui("lbl_check"),money(strat.check_size))+fact(ui("lbl_aum"),money(cap.aum))+fact(ui("lbl_fund"),money(cap.current_fund))+fact(ui("lbl_portfolio"),tr.portfolio_count)+fact(ui("lbl_team"),e.team_size)+"</div>";
    var html='<div class="det__head"><span class="det__flag">'+(FLAG[e.region]||"🏳️")+'</span><div><h2 class="det__title" id="dialogTitle">'+esc(en)+(loc?' <span class="det__local">'+esc(loc)+"</span>":"")+'</h2></div></div><div class="det__badges">'+badges+"</div>"+(lead?'<p class="det__lead">'+esc(lead)+"</p>":"")+facts;
    var sectors=(strat.sector_focus||[]).map(function(s){return '<span class="tag">'+esc(label("sector",s))+"</span>";}).join("");
    var sb=kv(ui("k_thesis"),strat.thesis?esc(strat.thesis):"")+(sectors?kv(ui("k_sectors"),'<span class="chiprow">'+sectors+"</span>"):"")+kv(ui("k_geo"),(strat.geo_focus||[]).map(esc).join(", "))+kv(ui("k_lead"),strat.lead_or_follow?esc(strat.lead_or_follow):"");
    if(sb) html+='<div class="det__sec"><h3><span class="material-symbols-rounded">target</span>'+esc(ui("sec_strategy"))+"</h3>"+sb+"</div>";
    var funds=(cap.funds||[]).map(function(f){return "<li>"+esc(f.name||"fund")+(f.vintage_year?" ("+f.vintage_year+")":"")+(money(f.size)?' — <span class="muted">'+esc(money(f.size))+"</span>":"")+"</li>";}).join("");
    if(funds) html+='<div class="det__sec"><h3><span class="material-symbols-rounded">savings</span>'+esc(ui("sec_capital"))+'</h3><ul class="minilist">'+funds+"</ul></div>";
    if(prog&&Object.keys(prog).length){
      var pb=kv(ui("k_length"),prog.length_weeks?prog.length_weeks+" "+ui("weeks"):"")+kv(ui("k_cohort"),prog.cohort_size)+kv(ui("k_batches"),prog.batches_per_year)+kv(ui("k_equity"),prog.equity_taken_pct!=null?String(prog.equity_taken_pct):"")+kv(ui("k_invest"),money(prog.investment))+kv(ui("k_accept"),prog.acceptance_rate)+kv(ui("k_eligibility"),prog.eligibility?esc(prog.eligibility):"")+(prog.application_url?kv(ui("k_applyurl"),'<a class="det__site" href="'+esc(prog.application_url)+'" target="_blank" rel="noopener">'+esc(prog.application_url)+"</a>"):"");
      if(pb) html+='<div class="det__sec"><h3><span class="material-symbols-rounded">rocket_launch</span>'+esc(ui("sec_program"))+"</h3>"+pb+"</div>";
    }
    var notable=(tr.notable_investments||[]).map(function(n){return "<li>"+esc(n.company)+(n.outcome?' <span class="muted">— '+esc(n.outcome)+"</span>":"")+"</li>";}).join("");
    var exits=(tr.exits||[]).map(function(x){return "<li>"+esc(x.company)+(x.type?" ("+esc(x.type)+(x.year?" "+x.year:"")+")":"")+(money(x.value)?' <span class="muted">'+esc(money(x.value))+"</span>":"")+"</li>";}).join("");
    var trb=(notable?kv(ui("k_notable"),'<ul class="minilist">'+notable+"</ul>"):"")+(exits?kv(ui("k_exits"),'<ul class="minilist">'+exits+"</ul>"):"")+((tr.co_investors||[]).length?kv(ui("k_coinv"),(tr.co_investors||[]).map(esc).join(", ")):"");
    if(trb) html+='<div class="det__sec"><h3><span class="material-symbols-rounded">trending_up</span>'+esc(ui("sec_track"))+"</h3>"+trb+"</div>";
    var people=(e.people||[]).map(function(p){return "<li>"+esc(p.name)+(p.role?' <span class="muted">— '+esc(p.role)+"</span>":"")+"</li>";}).join("");
    if(people) html+='<div class="det__sec"><h3><span class="material-symbols-rounded">groups</span>'+esc(ui("sec_people"))+'</h3><ul class="minilist">'+people+"</ul></div>";
    var ap=e.application||{};var apb=(ap.how_to_apply?"<p style='margin:0 0 8px;font-size:.88rem;line-height:1.5'>"+esc(ap.how_to_apply)+"</p>":"")+kv(ui("k_cold"),ap.accepts_cold_inbound==null?"":(ap.accepts_cold_inbound?ui("yes"):ui("no")))+kv(ui("k_contact"),ap.contact?esc(ap.contact):"");
    if(apb.trim()) html+='<div class="det__sec"><h3><span class="material-symbols-rounded">how_to_reg</span>'+esc(ui("sec_apply"))+"</h3>"+apb+"</div>";
    var srcs=(e.sources||[]).map(function(s){return '<div class="src"><div class="src__head"><a class="src__title" href="'+esc(s.url)+'" target="_blank" rel="noopener"><span class="material-symbols-rounded">link</span>'+esc(s.title||s.url)+"</a>"+(s.publisher?'<span class="src__pub">'+esc(s.publisher)+(s.accessed?" · "+esc(s.accessed):"")+"</span>":"")+"</div>"+(s.supports?'<p class="src__supports">'+esc(ui("supports"))+": "+esc(s.supports)+"</p>":"")+(s.quote?'<blockquote class="src__quote">"'+esc(s.quote)+'"</blockquote>':"")+"</div>";}).join("");
    if(srcs) html+='<div class="det__sec"><h3><span class="material-symbols-rounded">fact_check</span>'+esc(ui("sec_sources"))+" ("+(e.sources||[]).length+")</h3>"+srcs+"</div>";
    if(e.verification_notes) html+='<div class="det__note"><b>'+esc(ui("note"))+":</b> "+esc(e.verification_notes)+"</div>";
    return html;
  }
  function openDialog(slug){
    var rec=INDEX.find(function(r){return r.slug===slug;}); if(!rec) return;
    dialogBody.innerHTML='<div class="empty"><span class="material-symbols-rounded">hourglass_top</span>'+esc(ui("loading"))+"</div>";
    if(!dialog.open) dialog.showModal();
    if(location.hash.slice(1)!==slug) history.replaceState(null,"","#"+slug);
    ensureFull(rec.region,function(){var f=window.VC_FULL[slug];dialogBody.innerHTML=f?renderDetail(f):'<div class="empty">—</div>';dialogBody.scrollTop=0;updNav(slug);});
  }
  function updNav(slug){var i=visible.findIndex(function(r){return r.slug===slug;});var p=$("dialogPrev"),n=$("dialogNext");if(p)p.disabled=i<=0;if(n)n.disabled=i<0||i>=visible.length-1;}
  function navBy(d){var slug=location.hash.slice(1);var i=visible.findIndex(function(r){return r.slug===slug;});if(i<0)return;var j=i+d;if(j<0||j>=visible.length)return;openDialog(visible[j].slug);}
  function closeDialog(){if(dialog.open)dialog.close();if(location.hash)history.replaceState(null,"",location.pathname+location.search);}
  function wireCards(){[].forEach.call(document.querySelectorAll(".ecard[data-slug]"),function(c){var s=c.dataset.slug;c.addEventListener("click",function(){openDialog(s);});c.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();openDialog(s);}});});}

  /* ---------- registry + paint ---------- */
  var RENDERERS={ kpi:R_kpi, bars:R_bars, donut:R_donut, heatmap:R_heatmap, regioncards:R_regioncards, toplist:R_toplist, accel:R_accel, provenance:R_provenance, glossary:R_glossary, freshness:R_freshness, prose:R_prose, cta:R_cta, directory:R_directory };
  var NAV_ICONS={ kpi:"insights", bars:"bar_chart", donut:"donut_large", heatmap:"grid_on", regioncards:"public", toplist:"leaderboard", accel:"rocket_launch", provenance:"verified", glossary:"menu_book", freshness:"new_releases", prose:"article", cta:"campaign", directory:"travel_explore" };

  function sections(){
    var secs=(PAGE.sections||[]).slice();
    if(PAGE.kind==="region" && !CUR_REGION){
      return [{ type:"regioncards", id:"pick", title:{en:"Browse by region",zh:"依地區瀏覽"}, sub:{en:"Pick a region for its full investor landscape, breakdowns and directory.",zh:"選一個地區,看該地區完整的機構樣貌、分布與名錄。"} }];
    }
    if(PAGE.kind==="region"){
      var rs=META.region_summary[CUR_REGION]||{count:0};
      var rlabel=(L.region[CUR_REGION]||{en:CUR_REGION,zh:CUR_REGION});
      secs=[
        { type:"kpi", id:"r-stat", title:{en:(FLAG[CUR_REGION]||"")+" "+(rlabel.en),zh:(FLAG[CUR_REGION]||"")+" "+(rlabel.zh)}, sub:{en:"Investor landscape in "+rlabel.en+".",zh:rlabel.zh+"的投資機構樣貌。"},
          stats:[ {label:{en:"organizations",zh:"間機構"},value:rs.count}, {label:{en:"high-confidence",zh:"高信心"},value:rs.high||0},
                  {label:{en:"top type",zh:"最多類型"},value:(rs.top_types&&rs.top_types[0]?rs.top_types[0].count:0)}, {label:{en:"median founded",zh:"成立中位年"},value:rs.median_founded||0} ] },
        { type:"bars", id:"r-types", title:{en:"By type",zh:"依類型"}, source:"region:top_types" },
        { type:"bars", id:"r-sectors", title:{en:"Top sectors",zh:"主要產業"}, source:"region:top_sectors" },
        { type:"directory", id:"r-dir", title:{en:"All "+rlabel.en+" organizations",zh:rlabel.zh+"全部機構"}, lockRegion:CUR_REGION }
      ];
    }
    return secs;
  }
  var SECS=[];
  function paint(){
    SECS=sections();
    sectionsEl.innerHTML="";
    SECS.forEach(function(sec){var fn=RENDERERS[sec.type];if(!fn)return;var el=document.createElement("section");el.className="section section--"+sec.type;el.id=sec.id;el.innerHTML=fn(sec);sectionsEl.appendChild(el);});
    if(document.querySelector(".filters")) wireDirectory();
    applyFilter();
  }
  function paintNav(){
    navInner.innerHTML="";
    SECS.forEach(function(sec){if(sec.type==="cta")return;var a=document.createElement("a");a.className="navpill";a.href="#"+sec.id;a.dataset.target=sec.id;a.innerHTML='<span class="material-symbols-rounded">'+(NAV_ICONS[sec.type]||"label")+"</span><span>"+esc(t(sec.title))+"</span>";a.addEventListener("click",function(e){e.preventDefault();var el=$(sec.id);if(el)el.scrollIntoView({behavior:"smooth",block:"start"});history.replaceState(null,"","#"+sec.id);});navInner.appendChild(a);});
  }
  function paintRail(){
    if(!railEl) return;
    railEl.innerHTML=PAGES.map(function(p){var on=p.id===PAGE.id;return '<a class="railpill'+(on?" railpill--on":"")+'" href="'+p.href+'"'+(on?' aria-current="page"':"")+'><span class="material-symbols-rounded">'+p.icon+"</span><span>"+esc(p[state.lang]||p.en)+"</span></a>";}).join("");
  }
  function paintChrome(){
    document.documentElement.setAttribute("lang",state.lang==="zh"?"zh-Hant":"en");
    var ptitle = t(PAGE.title);
    if(PAGE.kind==="region" && CUR_REGION){ var rl=L.region[CUR_REGION]; if(rl) ptitle=(rl[state.lang]||rl.en); }
    document.title=ptitle+" · All-VC-Info";
    var b=$("brandName"); if(b) b.textContent=ui("brand");
    var f=$("footerText"); if(f) f.innerHTML=esc(ui("footer"))+'<br><span class="footer__by">'+esc(ui("by"))+' · <a href="https://www.linkedin.com/in/ai-med/" target="_blank" rel="noopener noreferrer">LinkedIn</a></span>'
      +'<div class="profile-links" style="display:flex;gap:12px;justify-content:center;align-items:center;margin-top:10px">'
      +  '<a class="icon-btn" href="https://www.peteraim.com" target="_blank" rel="noopener" title="Home" aria-label="Back to peteraim.com / 返回首頁">'
      +    '<span class="material-symbols-rounded">home</span>'
      +  '</a>'
      +  '<a class="icon-btn" href="https://www.linkedin.com/in/ai-med/" target="_blank" rel="noopener" title="LinkedIn" aria-label="LinkedIn (opens in new tab)">'
      +    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>'
      +  '</a>'
      +'</div>';
  }
  function render(){ paintChrome(); paintRail(); paint(); paintNav(); spy(); counters(); }

  function counters(){
    var els=[].slice.call(document.querySelectorAll("[data-count]")); if(!els.length) return;
    function run(el){if(el.dataset.done==="1")return;el.dataset.done="1";var tg=parseFloat(el.dataset.count)||0,dur=1000,st=null;function step(ts){if(st===null)st=ts;var p=Math.min(1,(ts-st)/dur),e=1-Math.pow(1-p,3);el.textContent=num(Math.round(tg*e));if(p<1)requestAnimationFrame(step);else el.textContent=num(tg);}requestAnimationFrame(step);}
    if(!("IntersectionObserver" in window)){els.forEach(run);return;}
    var io=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){run(e.target);io.unobserve(e.target);}});},{threshold:.3});
    els.forEach(function(el){io.observe(el);});
  }
  var spyObs=null;
  function spy(){
    if(spyObs){spyObs.disconnect();spyObs=null;} if(!("IntersectionObserver" in window))return;
    var pills={};[].forEach.call(navInner.children,function(a){pills[a.dataset.target]=a;});
    spyObs=new IntersectionObserver(function(ents){ents.forEach(function(en){var pill=pills[en.target.id];if(!pill)return;if(en.isIntersecting){[].forEach.call(navInner.children,function(p){p.classList.remove("navpill--active");p.removeAttribute("aria-current");});pill.classList.add("navpill--active");pill.setAttribute("aria-current","true");if(pill.scrollIntoView)pill.scrollIntoView({block:"nearest",inline:"center",behavior:"smooth"});}});},{rootMargin:"-45% 0px -50% 0px",threshold:0});
    SECS.forEach(function(sec){var el=$(sec.id);if(el)spyObs.observe(el);});
  }

  function applyTheme(){document.documentElement.setAttribute("data-theme",state.theme);var i=$("themeIcon");if(i)i.textContent=state.theme==="dark"?"light_mode":"dark_mode";lsSet("theme",state.theme);}
  function applyLangChrome(){var l=$("langLabel");if(l)l.textContent=state.lang==="en"?"EN":"中";lsSet("lang",state.lang);}
  function ghStar(){var el=$("ghStarCount"),w=$("ghStar");if(!w)return;fetch("https://api.github.com/repos/"+w.dataset.repo).then(function(r){return r.ok?r.json():null;}).then(function(j){if(j&&typeof j.stargazers_count==="number"&&el)el.textContent=j.stargazers_count;}).catch(function(){});}

  function wire(){
    $("themeToggle").addEventListener("click",function(){state.theme=state.theme==="dark"?"light":"dark";applyTheme();});
    $("langToggle").addEventListener("click",function(){state.lang=state.lang==="en"?"zh":"en";applyLangChrome();var open=dialog&&dialog.open?location.hash.slice(1):null;render();if(open)openDialog(open);});
    if(dialog){$("dialogClose").addEventListener("click",closeDialog);var dp=$("dialogPrev"),dn=$("dialogNext");if(dp)dp.addEventListener("click",function(){navBy(-1);});if(dn)dn.addEventListener("click",function(){navBy(1);});dialog.addEventListener("click",function(e){if(e.target===dialog)closeDialog();});dialog.addEventListener("close",function(){if(location.hash)history.replaceState(null,"",location.pathname+location.search);});document.addEventListener("keydown",function(e){if(!dialog.open)return;if(e.key==="ArrowLeft")navBy(-1);else if(e.key==="ArrowRight")navBy(1);});window.addEventListener("hashchange",function(){var s=location.hash.slice(1);if(s&&INDEX.find(function(r){return r.slug===s;})){if(!dialog.open||location.hash.slice(1)!==s)openDialog(s);}else if(!s&&dialog.open)dialog.close();});}
  }
  function init(){applyTheme();applyLangChrome();loadURL();render();wire();ghStar();var s=location.hash.slice(1);if(s&&INDEX.find(function(r){return r.slug===s;}))openDialog(s);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
