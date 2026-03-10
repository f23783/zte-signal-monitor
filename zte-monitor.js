javascript: void (function () {
  "use strict";
  var CONFIG = {
    VERSION: "6.0", POLL_INTERVAL_MS: 1500,
    API_GET: "/goform/goform_get_cmd_process", API_SET: "/goform/goform_set_cmd_process",
    SIGNAL_PARAMS: "dns_mode,prefer_dns_manual,standby_dns_manual,network_type,mcc,mnc,rssi,rsrq,lte_rsrp,wan_lte_ca,lte_ca_pcell_band,lte_ca_pcell_bandwidth,lte_ca_scell_band,lte_ca_scell_bandwidth,lte_ca_pcell_arfcn,lte_ca_scell_arfcn,Z_SINR,Z_CELL_ID,Z_eNB_id,Z_rsrq,lte_ca_scell_info,wan_ipaddr,ipv6_wan_ipaddr,static_wan_ipaddr,opms_wan_mode,opms_wan_auto_mode,ppp_status,loginfo",
    PLMN_MAP: { "22201": "2221", "22299": "22288" },
    LTE_BANDS: [
      { num: 1, freq: "2100 MHz", hex: "1" },{ num: 2, freq: "1900 MHz", hex: "2" },{ num: 3, freq: "1800 MHz", hex: "4" },{ num: 4, freq: "1700 MHz", hex: "8" },{ num: 5, freq: "850 MHz", hex: "10" },{ num: 7, freq: "2600 MHz", hex: "40" },{ num: 8, freq: "900 MHz", hex: "80" },{ num: 12, freq: "700 MHz", hex: "800" },{ num: 17, freq: "700 MHz", hex: "10000" },{ num: 20, freq: "800 MHz", hex: "80000" },{ num: 28, freq: "700 MHz", hex: "8000000" },{ num: 32, freq: "1500 MHz", hex: "80000000" },{ num: 38, freq: "2600 TDD", hex: "2000000000" },{ num: 40, freq: "2300 TDD", hex: "8000000000" },{ num: 41, freq: "2500 TDD", hex: "10000000000" }
    ],
    TOOLTIPS: {
      rsrp: "RSRP (Reference Signal Received Power)\nSinyal gucu.\n\nCok iyi: > -80 dBm\niyi: -80 ~ -90 dBm\nOrta: -90 ~ -100 dBm\nKotu: -100 ~ -110 dBm\nCok kotu: < -110 dBm",
      rsrq: "RSRQ (Reference Signal Received Quality)\nSinyal kalitesi.\n\nCok iyi: > -10 dB\niyi: -10 ~ -12 dB\nOrta: -12 ~ -15 dB\nKotu: -15 ~ -20 dB\nCok kotu: < -20 dB",
      rssi: "RSSI (Received Signal Strength Indicator)\nToplam sinyal gucu.\n\nCok iyi: > -65 dBm\niyi: -65 ~ -75 dBm\nOrta: -75 ~ -85 dBm\nKotu: -85 ~ -95 dBm\nCok kotu: < -95 dBm",
      sinr: "SINR (Signal to Interference + Noise Ratio)\nHizi en cok etkileyen deger.\n\nCok iyi: > 20 dB\niyi: 13 ~ 20 dB\nOrta: 0 ~ 13 dB\nKotu: -5 ~ 0 dB\nCok kotu: < -5 dB",
      enbid: "eNB ID\nBaz istasyonu kimlik numarasi.\nCellMapper ile haritada bulabilirsiniz.", cellid: "Cell ID\nBaz istasyonundaki hucre numarasi.",
      band: "LTE Band\nBagli frekans bandi.\nB3=1800MHz, B7=2600MHz, B20=800MHz", ca: "Carrier Aggregation\nBirden fazla bant kullanarak hiz arttirir.",
      mode: "Ag Modu\nLTE = Tek bant\nLTE-A (CA) = Birden fazla bant aktif", dns: "DNS Ayarlari\nOrnek: 1.1.1.1 (Cloudflare), 8.8.8.8 (Google)"
    }
  };
  function safeText(s,v){var e=$(s);if(e.length)e.text(String(v==null?"":v))}
  function safeHtml(s,h){var e=$(s);if(e.length)e.html(h)}
  function esc(s){var d=document.createElement("div");d.appendChild(document.createTextNode(String(s==null?"":s)));return d.innerHTML}
  function isValidIPv4(ip){var p=ip.trim().split(".");if(p.length!==4)return false;for(var i=0;i<p.length;i++){var n=Number(p[i]);if(!Number.isInteger(n)||n<0||n>255)return false}return true}
  function tt(k){return CONFIG.TOOLTIPS[k]||""}
  function getSC(t,value){var v=Number(value);if(isNaN(v))return "zs-unknown";if(t==="rsrp")return v>-80?"zs-great":v>-90?"zs-good":v>-100?"zs-mid":v>-110?"zs-bad":"zs-terrible";if(t==="rsrq")return v>-10?"zs-great":v>-12?"zs-good":v>-15?"zs-mid":v>-20?"zs-bad":"zs-terrible";if(t==="rssi")return v>-65?"zs-great":v>-75?"zs-good":v>-85?"zs-mid":v>-95?"zs-bad":"zs-terrible";if(t==="sinr")return v>20?"zs-great":v>13?"zs-good":v>0?"zs-mid":v>-5?"zs-bad":"zs-terrible";return "zs-unknown"}
  function getAuthToken(cb){$.ajax({type:"GET",url:CONFIG.API_GET,data:{cmd:"wa_inner_version,cr_version,RD",multi_data:"1"},dataType:"json",success:function(i){if(!i.wa_inner_version||!i.cr_version||!i.RD){alert("Auth hatasi");return}cb(hex_md5(hex_md5(i.wa_inner_version+i.cr_version)+i.RD))},error:function(x,s,e){alert("Auth hatasi: "+(e||s))}})}
  function updateBar(id,value,min,max){var v=Number(value);if(isNaN(v))return;var pct=Math.max(0,Math.min(100,((v-min)/(max-min))*100));var bar=$("#"+id+"b");if(!bar.length)return;bar.width(pct+"%");bar.text(id.toUpperCase()+" : "+v);bar.attr("class","zsb "+getSC(id,v))}
  function normalizePlmn(m,n,e){var p=String(m)+String(n);if(CONFIG.PLMN_MAP[p])return CONFIG.PLMN_MAP[p];if(p==="22250"&&String(e).length===6)return "22288";return p}
  function parseCA(info){if(!info||info.trim()==="")return "";var cells=info.slice(0,-1).split(";"),out=[];for(var i=0;i<cells.length;i++){var f=cells[i].split(",");out.push('<span class="zs-ca-badge">B'+esc(f[2]||"?")+'<span class="zs-ca-bw">@'+esc(f[4]||"?")+'MHz</span></span>')}return out.join(" + ")}
  var pollTimer=null,activeBands=[];
  function fetchData(){$.ajax({type:"GET",url:CONFIG.API_GET,data:{cmd:CONFIG.SIGNAL_PARAMS,multi_data:"1"},dataType:"json",success:handleData,error:function(x,s,e){console.error("[ZTE]",s,e)}})}
  function handleData(d){if(!d)return;updateBar("rsrp",d.lte_rsrp,-130,-70);updateBar("rsrq",d.rsrq,-16,-3);var cid=Number(d.Z_eNB_id)||0,enb=Math.trunc(cid/256);normalizePlmn(d.mcc,d.mnc,enb);safeText("#enbid",enb);safeText("#Z_eNB_id",cid);safeText("#lte_ca_pcell_band","B"+esc(d.lte_ca_pcell_band));safeText("#lte_ca_pcell_bandwidth",d.lte_ca_pcell_bandwidth);var sg=[{id:"#lte_rsrp",t:"rsrp",v:d.lte_rsrp},{id:"#rsrq",t:"rsrq",v:d.rsrq},{id:"#rssi",t:"rssi",v:d.rssi},{id:"#Z_SINR",t:"sinr",v:d.Z_SINR}];for(var i=0;i<sg.length;i++)safeHtml(sg[i].id,'<span class="'+getSC(sg[i].t,sg[i].v)+'">'+esc(sg[i].v)+"</span>");var nt=esc(d.network_type||"");safeHtml("#mode",nt==="LTE_A"?'<span class="zs-mode-ca">LTE-A (CA)</span>':'<span class="zs-mode-lte">'+nt+"</span>");safeHtml("#lte_ca_scell_info",parseCA(d.lte_ca_scell_info));if(d.dns_mode==="manual"){safeHtml("#dns_mode",'<span class="zs-dns-manual">'+esc(d.prefer_dns_manual||"")+(d.standby_dns_manual?", "+esc(d.standby_dns_manual):"")+"</span>")}else{safeText("#dns_mode","Otomatik")}activeBands=[];var pc=parseInt(d.lte_ca_pcell_band,10);if(!isNaN(pc)&&pc>0)activeBands.push(pc);if(d.lte_ca_scell_info&&d.lte_ca_scell_info.trim()!==""){var sc=d.lte_ca_scell_info.slice(0,-1).split(";");for(var j=0;j<sc.length;j++){var sb=parseInt(sc[j].split(",")[2],10);if(!isNaN(sb)&&sb>0&&activeBands.indexOf(sb)===-1)activeBands.push(sb)}}highlightActiveBands()}
  function promptDns(){var input=prompt('DNS sunucularini "," ile ayirin.\nOrnek: 1.1.1.1,1.0.0.1\nVarsayilan: AUTO',"AUTO");if(input==null||input.trim()==="")return;var t=input.trim().toLowerCase();if(t==="auto"){applyDns("auto","","");return}var parts=input.split(",");for(var i=0;i<parts.length;i++)parts[i]=parts[i].trim();if(parts.length<1||parts.length>2){alert("1 veya 2 DNS girin.");return}for(var j=0;j<parts.length;j++){if(!isValidIPv4(parts[j])){alert('Gecersiz IP: "'+parts[j]+'"');return}}applyDns("manual",parts[0],parts[1]||"")}
  function applyDns(mode,p,s){getAuthToken(function(tk){$.ajax({type:"POST",url:CONFIG.API_SET,data:{isTest:"false",goformId:"ROUTER_DNS_SETTING",dns_mode:mode,prefer_dns_manual:p,standby_dns_manual:s,AD:tk},success:function(){safeHtml("#dns_status",'<span class="zs-ok">\u2714</span>')},error:function(x,s,e){alert("DNS hatasi: "+(e||s))}})})}
  function highlightActiveBands(){var b=CONFIG.LTE_BANDS;for(var i=0;i<b.length;i++){var l=document.getElementById("zbl_label_"+b[i].num);if(!l)continue;l.className=activeBands.indexOf(b[i].num)!==-1?"zbl-chip zbl-active":"zbl-chip"}if(activeBands.length>0&&document.getElementById("zbl_panel")&&document.getElementById("zbl_panel").style.display!=="none"){var t="";for(var j=0;j<activeBands.length;j++){t+="B"+activeBands[j]+(j===0?" (PCell)":" (SCell)");if(j<activeBands.length-1)t+=" \u00B7 "}safeHtml("#zbl_active",'<span class="zbl-active-text">'+esc(t)+"</span>")}}
  function calcBandMask(){var total=BigInt(0);for(var i=0;i<CONFIG.LTE_BANDS.length;i++){var cb=document.getElementById("zbl_"+CONFIG.LTE_BANDS[i].num);if(cb&&cb.checked)total=total|BigInt("0x"+CONFIG.LTE_BANDS[i].hex)}return total.toString(16).toUpperCase()}
  function readBL(){$.ajax({type:"GET",url:CONFIG.API_GET,data:{cmd:"lte_band_lock",multi_data:"1"},dataType:"json",success:function(d){if(!d||!d.lte_band_lock||d.lte_band_lock===""){safeHtml("#zbl_status",'<span class="zs-info">Kilidi okunamadi. Yesil = aktif.</span>');return}var raw=d.lte_band_lock.replace(/^0[xX]/,""),cur;try{cur=BigInt("0x"+raw)}catch(e){return}for(var i=0;i<CONFIG.LTE_BANDS.length;i++){var mask=BigInt("0x"+CONFIG.LTE_BANDS[i].hex),cb=document.getElementById("zbl_"+CONFIG.LTE_BANDS[i].num);if(cb)cb.checked=(cur&mask)!==BigInt(0)}safeHtml("#zbl_status",'<span class="zs-ok">Okundu: 0x'+esc(raw.toUpperCase())+"</span>")},error:function(){safeHtml("#zbl_status",'<span class="zs-info">Kilidi okunamadi.</span>')}})}
  function applyBL(){var mask=calcBandMask();if(mask==="0"){alert("En az 1 bant secin!");return}var sel=[];for(var i=0;i<CONFIG.LTE_BANDS.length;i++){var cb=document.getElementById("zbl_"+CONFIG.LTE_BANDS[i].num);if(cb&&cb.checked)sel.push("B"+CONFIG.LTE_BANDS[i].num)}if(!confirm("Bantlar: "+sel.join(", ")+"\nHex: 0x"+mask+"\n\nUygulansin mi?"))return;safeHtml("#zbl_status",'<span class="zs-warn">Deneniyor... (1/3)</span>');var hx="0x"+mask,log=[];$.ajax({type:"GET",url:CONFIG.API_SET,data:{isTest:"false",goformId:"SET_LTE_BAND_LOCK",lte_band_lock:hx},dataType:"json",success:function(r){log.push("M1: "+JSON.stringify(r));if(r&&r.result==="success"){showBR(log,mask);return}bl2(hx,mask,log)},error:function(){log.push("M1: err");bl2(hx,mask,log)}})}
  function bl2(hx,mask,log){safeHtml("#zbl_status",'<span class="zs-warn">Deneniyor... (2/3)</span>');getAuthToken(function(tk){$.ajax({type:"POST",url:CONFIG.API_SET,data:{isTest:"false",goformId:"SET_LTE_BAND_LOCK",lte_band_lock:hx,AD:tk},dataType:"json",success:function(r){log.push("M2: "+JSON.stringify(r));if(r&&r.result==="success"){showBR(log,mask);return}bl3(hx,mask,log,tk)},error:function(){log.push("M2: err");bl3(hx,mask,log,tk)}})})}
  function bl3(hx,mask,log,tk){safeHtml("#zbl_status",'<span class="zs-warn">Deneniyor... (3/3)</span>');$.ajax({type:"POST",url:CONFIG.API_SET,data:{isTest:"false",goformId:"SET_NETWORK_BAND_LOCK",lte_band_lock:hx,AD:tk},dataType:"json",success:function(r){log.push("M3: "+JSON.stringify(r));showBR(log,mask)},error:function(){log.push("M3: err");showBR(log,mask)}})}
  function showBR(log,mask){var ok=false;for(var i=0;i<log.length;i++)if(log[i].indexOf("success")!==-1){ok=true;break}safeHtml("#zbl_status",(ok?'<span class="zs-ok">\u2714 Basarili (0x'+esc(mask)+')</span>':'<span class="zs-err">\u2718 Basarisiz</span>')+'<br><small class="zs-log">'+esc(log.join(" | "))+"</small>")}
  function selAll(){for(var i=0;i<CONFIG.LTE_BANDS.length;i++){var cb=document.getElementById("zbl_"+CONFIG.LTE_BANDS[i].num);if(cb)cb.checked=true}}
  function deselAll(){for(var i=0;i<CONFIG.LTE_BANDS.length;i++){var cb=document.getElementById("zbl_"+CONFIG.LTE_BANDS[i].num);if(cb)cb.checked=false}}
  function toggleBP(){var p=document.getElementById("zbl_panel");if(!p)return;if(p.style.display==="none"){p.style.display="block";readBL()}else{p.style.display="none"}}
  function buildBC(){var h="",b=CONFIG.LTE_BANDS;for(var i=0;i<b.length;i++){var x=b[i];h+='<label id="zbl_label_'+x.num+'" class="zbl-chip" title="Band '+x.num+" ("+x.freq+')\nModemi bu banda kilitler."><input type="checkbox" id="zbl_'+x.num+'" class="zbl-cb"><span class="zbl-num">B'+x.num+'</span><span class="zbl-freq">'+x.freq+"</span></label>"}return h}
  function buildUI(){
    $(".color_background_blue").css("background-color","#1a1d23");$(".headcontainer").hide();
    var css='<style id="zte-css">'
      +"@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');"
      +"body{padding:8px;font-family:'IBM Plex Sans',system-ui,sans-serif;background:#0f1117;color:#c9cdd5;font-size:14px}*{box-sizing:border-box}"
      +".zs-great{color:#22c55e;font-weight:700}.zs-good{color:#4ade80;font-weight:700}.zs-mid{color:#facc15;font-weight:700}.zs-bad{color:#f97316;font-weight:700}.zs-terrible{color:#ef4444;font-weight:700}.zs-unknown{color:#6b7280;font-weight:700}"
      +".zs-ok{color:#22c55e;font-weight:600}.zs-warn{color:#f59e0b;font-weight:600}.zs-err{color:#ef4444;font-weight:600}.zs-info{color:#8b95a5}.zs-log{color:#4b5563;font-size:11px;word-break:break-all}"
      +".zsc{background:#1a1d23;border:1px solid #2a2d35;border-radius:10px;margin:6px 0;overflow:hidden}"
      +".zsb{height:28px;border-radius:8px;line-height:28px;padding-left:12px;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;color:#fff;transition:width .4s ease,background .4s ease}"
      +".zsb.zs-great{background:linear-gradient(90deg,#059669,#22c55e)}.zsb.zs-good{background:linear-gradient(90deg,#16a34a,#4ade80)}.zsb.zs-mid{background:linear-gradient(90deg,#ca8a04,#facc15);color:#000}.zsb.zs-bad{background:linear-gradient(90deg,#ea580c,#f97316)}.zsb.zs-terrible{background:linear-gradient(90deg,#b91c1c,#ef4444)}.zsb.zs-unknown{background:#374151}"
      +".zcard{background:#1a1d23;border:1px solid #2a2d35;border-radius:12px;padding:14px 18px;margin:6px;display:inline-block;vertical-align:top}.zcard-row{display:flex;flex-wrap:wrap;gap:0;margin:6px 0}"
      +".zd{display:inline-flex;align-items:center;gap:6px;margin-right:18px;margin-bottom:4px;cursor:help}.zd-label{color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}.zd-value{font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:600}.zd-unit{color:#4b5563;font-size:12px}"
      +".zs-mode-ca{background:#7c3aed;color:#fff;padding:3px 10px;border-radius:6px;font-weight:700;font-size:13px;display:inline-block}.zs-mode-lte{background:#2563eb;color:#fff;padding:3px 10px;border-radius:6px;font-weight:700;font-size:13px;display:inline-block}"
      +".zs-ca-badge{background:#1e1b4b;color:#a78bfa;padding:2px 8px;border-radius:5px;font-weight:700;font-size:13px;font-family:'JetBrains Mono',monospace;display:inline-block}.zs-ca-bw{color:#7c6bc4;font-weight:400;font-size:11px;margin-left:2px}.zs-dns-manual{color:#f59e0b;font-weight:600}"
      +".zbtn{display:inline-flex;align-items:center;gap:6px;font-family:'IBM Plex Sans',sans-serif;font-weight:600;font-size:13px;color:#fff;padding:8px 16px;border-radius:8px;cursor:pointer;border:none;text-decoration:none;transition:all .15s ease;user-select:none}.zbtn:hover{transform:translateY(-1px);filter:brightness(1.15)}.zbtn:active{transform:translateY(0)}"
      +".zbtn-primary{background:linear-gradient(135deg,#3b82f6,#2563eb)}.zbtn-danger{background:linear-gradient(135deg,#ef4444,#dc2626)}.zbtn-success{background:linear-gradient(135deg,#22c55e,#16a34a)}.zbtn-ghost{background:#2a2d35;color:#9ca3af}.zbtn-ghost:hover{background:#363940}.zbtn-warn{background:linear-gradient(135deg,#f59e0b,#d97706)}"
      +".zbp{border:1px solid #2a2d35;border-radius:14px;padding:20px;margin:8px 0;background:#13151b;display:none}.zbp-title{font-weight:700;font-size:16px;color:#e2e8f0;margin-bottom:4px}.zbp-sub{font-size:12px;color:#4ade80;margin-bottom:12px}"
      +".zbl-active-text{color:#4ade80;font-weight:600;font-size:13px;font-family:'JetBrains Mono',monospace}.zbp-actions{margin-top:14px;padding-top:12px;border-top:1px solid #2a2d35;display:flex;gap:8px;flex-wrap:wrap}.zbp-status{margin-top:10px;font-size:13px}"
      +".zbl-chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.zbl-chip{display:inline-flex;align-items:center;gap:4px;padding:6px 10px;background:#1f2128;border:1.5px solid #2a2d35;border-radius:8px;cursor:pointer;user-select:none;transition:all .2s ease;font-size:13px}.zbl-chip:hover{border-color:#4b5563;background:#252830}.zbl-chip.zbl-active{border-color:#22c55e;background:#0f2a1a}.zbl-cb{margin:0;accent-color:#3b82f6;width:14px;height:14px}.zbl-num{font-family:'JetBrains Mono',monospace;font-weight:700;color:#93c5fd}.zbl-freq{font-size:11px;color:#6b7280}"
      +".zfoot{padding:10px 0;color:#374151;font-size:11px;text-align:right;font-family:'JetBrains Mono',monospace;clear:both}"
      +"</style>";
    var h=css+'<div id="zte-monitor-root">'
      +'<div class="zsc" title="'+tt("rsrp")+'"><div class="zsb" id="rsrpb"></div></div>'
      +'<div class="zsc" title="'+tt("rsrq")+'"><div class="zsb" id="rsrqb"></div></div>'
      +'<div class="zcard-row"><div class="zcard">'
      +'<div class="zd" title="'+tt("enbid")+'"><span class="zd-label">eNB ID</span><span class="zd-value" id="enbid">\u2014</span></div>'
      +'<div class="zd" title="'+tt("cellid")+'"><span class="zd-label">Cell ID</span><span class="zd-value" id="Z_eNB_id">\u2014</span></div>'
      +'<div class="zd" title="'+tt("band")+'"><span class="zd-label">Band</span><span class="zd-value" id="lte_ca_pcell_band">\u2014</span><span class="zd-unit">(<span id="lte_ca_pcell_bandwidth">\u2014</span> MHz)</span></div>'
      +'<div class="zd" title="'+tt("ca")+'"><span class="zd-label">CA</span><span class="zd-value" id="lte_ca_scell_info">\u2014</span></div>'
      +'</div><div class="zcard"><div class="zd" title="'+tt("mode")+'"><span id="mode" class="zd-value">Yukleniyor...</span></div></div>'
      +'<div class="zcard">'
      +'<div class="zd" title="'+tt("rsrp")+'"><span class="zd-label">RSRP</span><span class="zd-value" id="lte_rsrp">\u2014</span><span class="zd-unit">dBm</span></div>'
      +'<div class="zd" title="'+tt("rsrq")+'"><span class="zd-label">RSRQ</span><span class="zd-value" id="rsrq">\u2014</span><span class="zd-unit">dB</span></div>'
      +'<div class="zd" title="'+tt("rssi")+'"><span class="zd-label">RSSI</span><span class="zd-value" id="rssi">\u2014</span><span class="zd-unit">dBm</span></div>'
      +'<div class="zd" title="'+tt("sinr")+'"><span class="zd-label">SINR</span><span class="zd-value" id="Z_SINR">\u2014</span><span class="zd-unit">dB</span></div>'
      +'</div></div>'
      +'<div style="margin:10px 0;display:flex;gap:8px;flex-wrap:wrap;align-items:center">'
      +'<a class="zbtn zbtn-primary" id="zte-dns-btn" title="'+tt("dns")+'">DNS Ayar</a>'
      +'<span id="dns_mode" style="line-height:36px"></span><span id="dns_status"></span>'
      +'<a class="zbtn zbtn-danger" id="zte-band-btn" title="LTE Bant Kilitleme\nModemi belirli bantlara kilitler.">Bant Kilidi</a>'
      +'</div>'
      +'<div class="zbp" id="zbl_panel"><div class="zbp-title">LTE Bant Kilitleme</div><div class="zbp-sub">Yesil kenarlik = aktif baglanti</div><div id="zbl_active" style="margin-bottom:10px"></div>'
      +'<div class="zbl-chips" id="zbl_bands">'+buildBC()+'</div>'
      +'<div class="zbp-actions">'
      +'<a class="zbtn zbtn-success" id="zbl_apply" title="Secili bantlari modeme uygular.">Uygula</a>'
      +'<a class="zbtn zbtn-ghost" id="zbl_all" title="Tum bantlari secer (kilidi kaldirir).">Tumu Sec</a>'
      +'<a class="zbtn zbtn-warn" id="zbl_none" title="Tum secimleri kaldirir.">Temizle</a>'
      +'<a class="zbtn zbtn-ghost" id="zbl_read" title="Mevcut bant kilidi ayarini okur.">Mevcut Oku</a>'
      +'</div><div class="zbp-status" id="zbl_status"></div></div>'
      +'<div class="zfoot">ZTE Signal Monitor v'+CONFIG.VERSION+'</div></div>';
    $("body").prepend(h);
    $("#zte-dns-btn").on("click",promptDns);$("#zte-band-btn").on("click",toggleBP);
    $("#zbl_apply").on("click",applyBL);$("#zbl_all").on("click",selAll);
    $("#zbl_none").on("click",deselAll);$("#zbl_read").on("click",readBL);
  }
  if(document.getElementById("zte-monitor-root")){console.warn("[ZTE] Already running.");return}
  buildUI();fetchData();pollTimer=window.setInterval(fetchData,CONFIG.POLL_INTERVAL_MS);
  console.log("[ZTE] v"+CONFIG.VERSION+" started.");
})();
