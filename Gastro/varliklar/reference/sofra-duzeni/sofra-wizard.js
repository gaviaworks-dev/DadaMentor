/* ===== SOFRA KURULUM SİHİRBAZI — kaynak-transfer (reference/rehber/sofra-duzeni-v1.html
   satır 2259-2636) — FB18 hibrit karar (Beyar bağlayıcı 2026-07-15).
   PARCA/svgKuver/SEMA BİREBİR taşındı (sabit sunum kodu — "SVG diyagram parça
   eşlemesi Blade/JS'te sabit sunum kodu kalır"). Adım metinleri (tag/title/
   paragraph/checklist/tip) artık referansın kendi statik SOFRALAR dizisinden
   DEĞİL, window.SOFRA_WIZARD_DATA'dan gelir — sofra/index.blade.php bunu
   gerçek yayındaki Content(sofra) kayıtlarından (table_setting_steps) @json
   ile basar. SEMA hâlâ adım İNDEKSİNE göre eşleşir (referansla AYNI kırılganlık
   — admin adım sırasını/sayısını referansla uyumlu tutmalı, künye alanında
   hatırlatma notu var). Açık büfe (id=bufe) SEMA'da hiç yoktu — istisna korunur. */
(function(){
  var wiz=document.getElementById('swz'); if(!wiz) return;
  var SOFRALAR = window.SOFRA_WIZARD_DATA || [];
  if (!SOFRALAR.length) return;

  /* ===== KUŞBAKIŞI KUVER ŞEMASI — tek parametrik builder (referanstan BİREBİR
     geometri); REV 2026-08-04 (Beyar red: foto-gerçekçi AI adım görseli yerine
     mevcut SVG diyagram derinlik/doku/tipografi ile zenginleştirildi — bkz.
     docs/lessons.md "Öğretici adım diyagramı foto-gerçekçi AI ile üretilmez").
     Koordinat/açı/viewBox/masa matematiği DOKUNULMADI — parçalara yalnız
     parlaklık (gradient "shn" katmanı) ve masaya doku+derinlik eklendi; gölge
     svgKuver()'de her parça <g>'ına tek filtre olarak uygulanır. CUR_UID her
     svgKuver() çağrısında artan sayaçla yenilenir ki aynı sayfada yan yana
     birden çok diyagram (ör. /dev/sofra-svg-onizleme) gradient/filter id'si
     çakışmasın. ===== */
  var CUR_UID='sk0';
  function fkP(x,y,len,ang){
    var t='<path d="M'+(x-9)+' '+y+' v20 M'+x+' '+y+' v24 M'+(x+9)+' '+y+' v20"/>'
      +'<path d="M'+(x-9)+' '+(y+18)+' Q'+x+' '+(y+36)+' '+(x+9)+' '+(y+18)+'"/>'
      +'<line x1="'+x+'" y1="'+(y+32)+'" x2="'+x+'" y2="'+(y+len)+'"/>'
      +'<line class="shn" x1="'+x+'" y1="'+(y+40)+'" x2="'+x+'" y2="'+(y+len*.62)+'" stroke="url(#'+CUR_UID+'-metal)" stroke-width="1.4"/>';
    return ang?'<g transform="rotate('+ang+' '+x+' '+y+')">'+t+'</g>':t;
  }
  function kfP(x,y,len,ang){
    var t='<path d="M'+(x-5)+' '+y+' L'+(x-5)+' '+(y+64)+' Q'+(x+9)+' '+(y+50)+' '+(x+5)+' '+(y+16)+' Q'+(x+3)+' '+(y+3)+' '+(x-5)+' '+y+' Z"/>'
      +'<path class="shn" d="M'+(x-2)+' '+(y+6)+' Q'+(x+5)+' '+(y+22)+' '+(x+1)+' '+(y+48)+'" stroke="url(#'+CUR_UID+'-metal)" stroke-width="1.3"/>'
      +'<line x1="'+x+'" y1="'+(y+64)+'" x2="'+x+'" y2="'+(y+len)+'"/>';
    return ang?'<g transform="rotate('+ang+' '+x+' '+y+')">'+t+'</g>':t;
  }
  function spP(x,y,len,ang,rx,ry){
    rx=rx||10;ry=ry||17;
    var t='<ellipse cx="'+x+'" cy="'+(y+ry)+'" rx="'+rx+'" ry="'+ry+'"/>'
      +'<ellipse class="shn" cx="'+(x-rx*.32)+'" cy="'+(y+ry*.72)+'" rx="'+(rx*.42)+'" ry="'+(ry*.3)+'" fill="url(#'+CUR_UID+'-sheen)"/>'
      +'<line x1="'+x+'" y1="'+(y+ry*2)+'" x2="'+x+'" y2="'+(y+len)+'"/>';
    return ang?'<g transform="rotate('+ang+' '+x+' '+y+')">'+t+'</g>':t;
  }
  function crP(cx,cy,r,ir,mat){
    var shn=mat==='glass'
      ?'<ellipse class="shn" cx="'+cx+'" cy="'+cy+'" rx="'+(r*.34)+'" ry="'+(r*.86)+'" fill="url(#'+CUR_UID+'-glass)"/>'
      :'<ellipse class="shn" cx="'+(cx-r*.3)+'" cy="'+(cy-r*.34)+'" rx="'+(r*.46)+'" ry="'+(r*.3)+'" fill="url(#'+CUR_UID+'-sheen)"/>';
    return '<circle class="fl" cx="'+cx+'" cy="'+cy+'" r="'+r+'"/>'+(ir?'<circle cx="'+cx+'" cy="'+cy+'" r="'+ir+'"/>':'')+shn;
  }
  var PARCA={
    servisTabagi:{lbl:"Servis Tabağı",lx:380,ly:392,d:function(){return crP(380,252,112)}},
    tabak:{lbl:"Yemek Tabağı",lx:380,ly:330,d:function(){return crP(380,252,92)}},
    tabakKahvalti:{lbl:"Kahvaltı Tabağı",lx:380,ly:346,d:function(){return crP(380,252,74)}},
    pastaTabagi:{lbl:"Pasta/Tatlı Tabağı",lx:380,ly:258,d:function(){return crP(380,252,70)}},
    tabakBolmeli:{lbl:"Bölmeli Tabak",lx:380,ly:300,d:function(){return '<rect class="fl" x="290" y="170" width="180" height="164" rx="22"/><path d="M380 170 V254 M290 254 H470"/>'}},
    derinKase:{lbl:"Çorba Kâsesi",lx:380,ly:248,d:function(){return crP(380,252,56,36)}},
    salataKayik:{lbl:"Salata Kayığı",lx:225,ly:96,d:function(){return '<ellipse class="fl" cx="225" cy="140" rx="48" ry="26"/><ellipse cx="225" cy="140" rx="30" ry="14"/><ellipse class="shn" cx="212" cy="128" rx="18" ry="8" fill="url(#'+CUR_UID+'-sheen)"/>'}},
    recelTabagi:{lbl:"Reçel/Tatlı Tabağı",lx:225,ly:76,d:function(){return crP(225,128,36,22)}},
    anaCatal:{lbl:"Ana Çatal",lx:252,ly:348,d:function(){return fkP(252,178,150)}},
    salataCatal:{lbl:"Salata Çatalı",lx:208,ly:370,d:function(){return fkP(208,178,150)}},
    balikCatal:{lbl:"Balık Çatalı",lx:208,ly:370,d:function(){return fkP(208,178,150)}},
    anaBicak:{lbl:"Ana Bıçak",lx:508,ly:348,d:function(){return kfP(508,178,150)}},
    balikBicak:{lbl:"Balık Bıçağı",lx:550,ly:370,d:function(){return kfP(550,182,142)}},
    corbaKasigi:{lbl:"Çorba Kaşığı",lx:550,ly:370,d:function(){return spP(550,178,150)}},
    corbaKasigiDis:{lbl:"Çorba Kaşığı",lx:592,ly:392,d:function(){return spP(592,178,150)}},
    tatliCatalY:{lbl:"Tatlı Çatalı — sapı sola",lx:380,ly:160,d:function(){return fkP(452,134,146,90)}},
    tatliKasikY:{lbl:"Tatlı Kaşığı — sapı sağa",lx:380,ly:90,d:function(){return spP(308,110,146,-90)}},
    tatliCatalSag:{lbl:"Tatlı Çatalı",lx:478,ly:348,d:function(){return fkP(478,190,130)}},
    suBardagi:{lbl:"Su Bardağı",lx:516,ly:56,d:function(){return crP(516,100,28,20,'glass')}},
    mesrubatBardagi:{lbl:"Meşrubat",lx:585,ly:180,d:function(){return crP(585,140,22,15,'glass')}},
    ikinciBardak:{lbl:"2. Bardak (45°)",lx:585,ly:180,d:function(){return crP(585,140,22,15,'glass')}},
    serbetBardagi:{lbl:"Şerbet/Ayran",lx:585,ly:180,d:function(){return crP(585,140,22,15,'glass')}},
    cayBardagi:{lbl:"Çay Bardağı — kulp sağa",lx:516,ly:56,d:function(){return crP(516,102,26,18,'glass')+'<path d="M542 96 a10 10 0 1 1 0 12"/>'}},
    cocukBardak:{lbl:"Devrilmez Bardak",lx:498,ly:50,d:function(){return crP(498,96,24,16,'glass')+'<circle cx="498" cy="96" r="31"/>'}},
    pecete:{lbl:"Peçete",lx:143,ly:348,d:function(){return '<rect class="fl" x="116" y="190" width="54" height="124" rx="8"/><line x1="134" y1="190" x2="134" y2="314"/>'}},
    peceteTabak:{lbl:"Peçete",lx:380,ly:328,d:function(){return '<rect class="fl" x="352" y="196" width="56" height="112" rx="8"/><line x1="370" y1="196" x2="370" y2="308"/>'}},
    ekmekTabagi:{lbl:"Ekmek Tabağı",lx:168,ly:140,d:function(){return crP(168,80,40,28)}},
    tereyagBicagi:{lbl:"Tereyağı Bıçağı",lx:168,ly:28,d:function(){return kfP(188,70,46,105)}},
    yerKarti:{lbl:"Yer Kartı",lx:436,ly:44,la:"start",d:function(){return '<rect class="fl" x="334" y="36" width="92" height="42" rx="6"/><path d="M348 52 H412 M348 63 H392"/>'}},
    cocukCatal:{lbl:"Küt Uçlu Çatal",lx:258,ly:352,d:function(){return fkP(258,205,118)}},
    cocukKasik:{lbl:"Küçük Kaşık",lx:502,ly:352,d:function(){return spP(502,205,118,0,9,14)}}
  };
  function svgKuver(sm){
    CUR_UID='sk'+(svgKuver._n=(svgKuver._n||0)+1);
    var u=CUR_UID;
    /* defs: masa dokusu (gradient+desen+vinyet) + parça parlaklığı (porselen/
       cam/metal sheen) + tek ortak temas gölgesi filtresi. Hepsi bu çağrıya
       özel id'lerle (u- öneki) — sayaç aynı sayfada çoklu diyagram güvenliği. */
    var defs='<defs>'
      +'<linearGradient id="'+u+'-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8f2e7"/><stop offset="1" stop-color="#efe3ce"/></linearGradient>'
      +'<radialGradient id="'+u+'-vign" cx="50%" cy="40%" r="72%"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#8f8570" stop-opacity=".24"/></radialGradient>'
      +'<pattern id="'+u+'-grain" width="6" height="6" patternTransform="rotate(24)" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="6" stroke="#cbc1ac" stroke-width="1" stroke-opacity=".2"/></pattern>'
      +'<radialGradient id="'+u+'-sheen" cx="35%" cy="30%" r="65%"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="55%" stop-color="#fff" stop-opacity=".14"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>'
      +'<linearGradient id="'+u+'-glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="38%" stop-color="#fff" stop-opacity=".75"/><stop offset="55%" stop-color="#fff" stop-opacity=".08"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></linearGradient>'
      +'<linearGradient id="'+u+'-metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="45%" stop-color="#fff" stop-opacity=".85"/><stop offset="60%" stop-color="#fff" stop-opacity="0"/></linearGradient>'
      +'<linearGradient id="'+u+'-edge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d5cbb5" stop-opacity="0"/><stop offset=".5" stop-color="#d5cbb5" stop-opacity="1"/><stop offset="1" stop-color="#d5cbb5" stop-opacity="0"/></linearGradient>'
      +'<filter id="'+u+'-shadow" x="-70%" y="-70%" width="240%" height="240%"><feDropShadow dx="0" dy="4" stdDeviation="3.4" flood-color="#211E16" flood-opacity=".24"/></filter>'
      +'</defs>';
    var h='<svg viewBox="0 0 760 440" role="img" aria-label="Kuşbakışı sofra yerleşim şeması">'+defs
      +'<rect x="46" y="14" width="668" height="388" rx="28" fill="url(#'+u+'-wood)"/>'
      +'<rect x="46" y="14" width="668" height="388" rx="28" fill="url(#'+u+'-grain)"/>'
      +'<rect x="46" y="14" width="668" height="388" rx="28" fill="url(#'+u+'-vign)"/>';
    sm.parts.forEach(function(id){
      var pr=PARCA[id];if(!pr)return;
      var st=sm.yeni.indexOf(id)>-1?'pc-y':(sm.tam?'pc-t':'pc-o');
      h+='<g class="pc '+st+'" filter="url(#'+u+'-shadow)">'+pr.d()+'</g>';
    });
    sm.parts.forEach(function(id){
      var pr=PARCA[id];
      if(pr&&sm.yeni.indexOf(id)>-1)h+='<text class="pl" x="'+pr.lx+'" y="'+pr.ly+'" text-anchor="'+(pr.la||'middle')+'">'+pr.lbl+'</text>';
    });
    h+='<line class="mk" x1="60" y1="402" x2="700" y2="402" stroke="url(#'+u+'-edge)"/>'
      +'<line class="mkt" x1="60" y1="396" x2="60" y2="408"/><line class="mkt" x1="700" y1="396" x2="700" y2="408"/>'
      +'<text class="mkl" x="380" y="428" text-anchor="middle">MASA KENARI</text></svg>';
    var leg='';
    if(sm.yeni.length)leg+='<span class="ly"><i></i> Bu adımda eklenen</span>';
    if(sm.tam)leg+='<span class="lt"><i></i> Tam kuver — kontrol</span>';
    else if(sm.parts.length>sm.yeni.length)leg+='<span class="lo"><i></i> Önceki adımlardan</span>';
    return '<div class="swz-sema">'+h+'<div class="swz-sema-leg">'+leg+'</div></div>';
  }

  /* Sofra-adım-görseli (2026-08-04, docs/lessons.md "Öğretici adım diyagramı..."
     güncellemesi — foto-gerçekçi AI kararı TERSİNE DÖNDÜ, referans-zinciri
     yöntemiyle üretilen gerçek fotoğraf artık SVG'nin YERİNE geçebilir, SVG
     SİLİNMEDİ, görselsiz adımda fallback olarak kalır — bkz. render()).
     s.img (SofraController::wizardEntry, Media::signedUrl()) VARSA bu kolon
     basılır; component-token.md §6 kuralı: kare/oranlı görsel <img> değil,
     div+background-image (cover/center). Ayrı CSS sınıfı yok (sofra-wizard.css
     bu görev kapsamında dokunulmadı) — inline stil aynı tasarım token'larını
     (var(--radius-lg) vb.) kullanır.

     REV 2026-08-16 (Beyar): aspect-ratio 760/440 → 3/2. Eski değer SVG kuver
     viewBox'ıyla hizalanmak için seçilmişti (1.7273); kaynak kareler ise 3:2
     üretiliyor (ölçüldü: 91/91 dosya 1600x1073 = 1.4911). cover, dar oranlı
     kaynağı geniş kaba oturturken üst+alttan kırpıyordu — ölçülen kayıp
     dört genişlikte 47-58px, yani karenin yaklaşık %14'ü. Kap üretimin
     kendi oranına çekildi; kırpma sıfıra iner. background-size/position
     DEĞİŞMEDİ.

     Kolon geçişindeki "sıçrama" gerekçesi ölçümle düştü: .swz-photo ile
     .swz-sema aynı kutu DEĞİL, render() içinde birbirinin ALTERNATİFİ
     (s.img ? photoCol : svgKuver) ve SVG kendi viewBox oranını
     .swz-sema svg{width:100 yuzde;height:auto} ile korur — buradaki
     aspect-ratio SVG'ye hiç uygulanmaz. Kaldı ki yayındaki 91 adımın
     91'inde foto var, yani svgKuver canlıda hiç basılmıyor. */
  function photoCol(s){
    return '<div class="swz-photo" role="img" aria-label="'+esc(s.t)+'" style="'
      +'aspect-ratio:3/2;border-radius:var(--radius-lg);box-shadow:var(--sh-sm);'
      +'border:1px solid var(--line);background-image:url(\''+esc(s.img)+'\');'
      +'background-size:cover;background-position:center"></div>';
  }

  /* SEMA — onaylı adım × parça matrisi (0-index adım → kümülatif parça listesi),
     referanstan BİREBİR (sabit sunum kodu). Açık büfe (bufe) istisna: kuver yok. */
  var SEMA={
    gunluk:{
      1:{parts:["tabak","derinKase","salataKayik"],yeni:["tabak","derinKase","salataKayik"]},
      2:{parts:["tabak","derinKase","salataKayik","anaCatal","anaBicak","corbaKasigi"],yeni:["anaCatal","anaBicak","corbaKasigi"]},
      3:{parts:["tabak","derinKase","salataKayik","anaCatal","anaBicak","corbaKasigi","suBardagi","mesrubatBardagi"],yeni:["suBardagi","mesrubatBardagi"]},
      5:{parts:["tabak","derinKase","salataKayik","anaCatal","anaBicak","corbaKasigi","suBardagi","mesrubatBardagi","pecete"],yeni:["pecete"],tam:true}
    },
    misafir:{
      1:{parts:["servisTabagi","tabak"],yeni:["servisTabagi","tabak"]},
      2:{parts:["servisTabagi","tabak","salataCatal","anaCatal","anaBicak","corbaKasigi","tatliCatalY","tatliKasikY"],yeni:["salataCatal","anaCatal","anaBicak","corbaKasigi","tatliCatalY","tatliKasikY"]},
      3:{parts:["servisTabagi","tabak","salataCatal","anaCatal","anaBicak","corbaKasigi","tatliCatalY","tatliKasikY","suBardagi","mesrubatBardagi"],yeni:["suBardagi","mesrubatBardagi"]},
      4:{parts:["servisTabagi","tabak","salataCatal","anaCatal","anaBicak","corbaKasigi","tatliCatalY","tatliKasikY","suBardagi","mesrubatBardagi","peceteTabak","ekmekTabagi","tereyagBicagi"],yeni:["peceteTabak","ekmekTabagi","tereyagBicagi"]},
      6:{parts:["servisTabagi","tabak","salataCatal","anaCatal","anaBicak","corbaKasigi","tatliCatalY","tatliKasikY","suBardagi","mesrubatBardagi","peceteTabak","ekmekTabagi","tereyagBicagi"],yeni:[],tam:true}
    },
    kahvalti:{
      1:{parts:["tabakKahvalti","anaCatal","anaBicak","recelTabagi"],yeni:["tabakKahvalti","anaCatal","anaBicak","recelTabagi"]},
      3:{parts:["tabakKahvalti","anaCatal","anaBicak","recelTabagi","cayBardagi"],yeni:["cayBardagi"]},
      5:{parts:["tabakKahvalti","anaCatal","anaBicak","recelTabagi","cayBardagi","pecete"],yeni:["pecete"],tam:true}
    },
    resmi:{
      1:{parts:["servisTabagi","tabak","derinKase"],yeni:["servisTabagi","tabak","derinKase"]},
      2:{parts:["servisTabagi","tabak","derinKase","balikCatal","anaCatal","anaBicak","balikBicak","corbaKasigiDis","tatliCatalY","tatliKasikY"],yeni:["balikCatal","anaCatal","anaBicak","balikBicak","corbaKasigiDis","tatliCatalY","tatliKasikY"]},
      3:{parts:["servisTabagi","tabak","derinKase","balikCatal","anaCatal","anaBicak","balikBicak","corbaKasigiDis","tatliCatalY","tatliKasikY","suBardagi","ikinciBardak"],yeni:["suBardagi","ikinciBardak"]},
      4:{parts:["servisTabagi","tabak","derinKase","balikCatal","anaCatal","anaBicak","balikBicak","corbaKasigiDis","tatliCatalY","tatliKasikY","suBardagi","ikinciBardak","peceteTabak","ekmekTabagi","tereyagBicagi"],yeni:["peceteTabak","ekmekTabagi","tereyagBicagi"]},
      5:{parts:["servisTabagi","tabak","derinKase","balikCatal","anaCatal","anaBicak","balikBicak","corbaKasigiDis","tatliCatalY","tatliKasikY","suBardagi","ikinciBardak","peceteTabak","ekmekTabagi","tereyagBicagi","yerKarti"],yeni:["yerKarti"]},
      6:{parts:["servisTabagi","tabak","derinKase","balikCatal","anaCatal","anaBicak","balikBicak","corbaKasigiDis","tatliCatalY","tatliKasikY","suBardagi","ikinciBardak","peceteTabak","ekmekTabagi","tereyagBicagi","yerKarti"],yeni:[],tam:true}
    },
    ramazan:{
      1:{parts:["tabak","derinKase","corbaKasigi","anaCatal","anaBicak"],yeni:["tabak","derinKase","corbaKasigi"]},
      3:{parts:["tabak","derinKase","corbaKasigi","anaCatal","anaBicak","suBardagi","serbetBardagi"],yeni:["suBardagi","serbetBardagi"]},
      5:{parts:["tabak","derinKase","corbaKasigi","anaCatal","anaBicak","suBardagi","serbetBardagi"],yeni:[],tam:true}
    },
    bayram:{
      1:{parts:["pastaTabagi","tatliCatalSag"],yeni:["pastaTabagi","tatliCatalSag"]},
      5:{parts:["pastaTabagi","tatliCatalSag","cayBardagi"],yeni:["cayBardagi"],tam:true}
    },
    cocuklu:{
      1:{parts:["tabakBolmeli"],yeni:["tabakBolmeli"]},
      2:{parts:["tabakBolmeli","cocukCatal","cocukKasik"],yeni:["cocukCatal","cocukKasik"]},
      3:{parts:["tabakBolmeli","cocukCatal","cocukKasik","cocukBardak"],yeni:["cocukBardak"]},
      4:{parts:["tabakBolmeli","cocukCatal","cocukKasik","cocukBardak"],yeni:[],tam:true}
    }
  };
  SOFRALAR.forEach(function(s){var m=SEMA[s.id];if(m)Object.keys(m).forEach(function(i){if(s.steps[+i])s.steps[+i].sema=m[i]})});

  var inner=document.getElementById('swzInner'),count=document.getElementById('swzCount'),
      railEl=document.getElementById('swzRail'),
      prev=document.getElementById('swzPrev'),next=document.getElementById('swzNext'),
      closeBtn=document.getElementById('swzClose'),title=document.getElementById('swzTitle');
  var cur=null,idx=0;
  function esc(s){return (s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  /* REV 2026-07-20 (madde 8): eski bottom cm-dots yerine tek segmentli ray —
     hem ilerleme (dolu/aktif/boş segment) hem tıkla-atla navigasyonu taşır. */
  function buildRail(){
    railEl.innerHTML=cur?cur.steps.map(function(){return '<i class="seg"></i>'}).join(''):'';
    railEl.querySelectorAll('.seg').forEach(function(seg,i){seg.addEventListener('click',function(){idx=i;render()})});
  }
  function render(){
    wiz.classList.toggle('picking',!cur);
    if(!cur){
      title.textContent='Sofrayı Adım Adım Kur';
      count.textContent='Sofranı seç';
      inner.className='cm-inner no-fig';
      inner.innerHTML='<div class="cm-num"><span class="n"><i class="fa-solid fa-utensils"></i></span><span class="cm-tag">Kurulum Sihirbazı</span></div>'
        +'<h2>Hangi sofrayı kuruyorsun?</h2>'
        +'<p>Sofranı seç — adımlar ve yerleşim talimatları seçtiğin sofraya göre gelsin.</p>'
        +'<div class="swz-pick">'+SOFRALAR.map(function(s,i){
          return '<button type="button" data-sofra="'+i+'"><span class="pk-ico"><i class="fa-solid '+esc(s.ikon)+'"></i></span><b>'+esc(s.ad)+'</b><span>'+esc(s.desc)+'</span></button>'
        }).join('')+'</div>';
      inner.querySelectorAll('[data-sofra]').forEach(function(b){
        b.addEventListener('click',function(){cur=SOFRALAR[+b.getAttribute('data-sofra')];idx=0;buildRail();render()});
      });
      return;
    }
    var s=cur.steps[idx],n=cur.steps.length,hasFig=!!(s.img||s.sema);
    // Metin kolonu (başlık/gövde/checklist/ipucu) — s.p admin metni, Blade
    // tarafında RichText::allowEmphasis ile önceden temizlendi.
    var left='<div class="cm-num"><span class="n">'+(idx+1)+'</span><span class="cm-tag">'+esc(s.tag)+'</span></div>';
    left+='<h2>'+esc(s.t)+'</h2><p>'+s.p+'</p>';
    if(s.list&&s.list.length){left+='<ul class="swz-list">'+s.list.map(function(x){return '<li><i class="fa-solid fa-check"></i><span>'+esc(x)+'</span></li>'}).join('')+'</ul>'}
    if(s.tip){left+='<div class="swz-tip"><i class="fa-solid fa-lightbulb"></i><span>'+esc(s.tip)+'</span></div>'}
    // Görsel kolonu — fotoğraf (s.img) VEYA şema (s.sema) olan adımlarda;
    // ikisi de yoksa metin tek kolon ortalanır (cm-stage üstten hizalı, taşma yok).
    // s.img VARSA gerçek fotoğraf, YOKSA SVG kuver şeması (fallback, silinmedi).
    inner.className='cm-inner'+(hasFig?' has-fig':' no-fig');
    inner.innerHTML='<div class="cm-col cm-col--text">'+left+'</div>'+(hasFig?'<div class="cm-col cm-col--visual">'+(s.img?photoCol(s):svgKuver(s.sema))+'</div>':'');
    title.textContent=cur.ad;
    count.textContent='Adım '+(idx+1)+' / '+n;
    railEl.querySelectorAll('.seg').forEach(function(seg,i){seg.className='seg'+(i===idx?' on':(i<idx?' done':''))});
    prev.disabled=false;
    prev.innerHTML=idx===0?'<i class="fa-solid fa-chevron-left"></i> Sofra Seçimi':'<i class="fa-solid fa-chevron-left"></i> Önceki';
    next.innerHTML=idx===n-1?'Sofra Hazır <i class="fa-solid fa-check"></i>':'Sonraki Adım <i class="fa-solid fa-chevron-right"></i>';
  }
  function open(sofra){cur=sofra||null;idx=0;buildRail();render();wiz.classList.add('open');document.body.style.overflow='hidden'}
  function close(){wiz.classList.remove('open');document.body.style.overflow=''}
  function goPrev(){if(!cur)return;if(idx>0){idx--;render()}else{cur=null;buildRail();render()}}
  function goNext(){if(!cur)return;if(idx<cur.steps.length-1){idx++;render()}else{close()}}
  document.querySelectorAll('.disc-kur[data-kur]').forEach(function(el){
    el.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();
      var m=SOFRALAR.filter(function(s){return s.id===el.getAttribute('data-kur')})[0];
      if(m)open(m);
    },true);
  });
  closeBtn.addEventListener('click',close);
  prev.addEventListener('click',goPrev);
  next.addEventListener('click',goNext);
  document.addEventListener('keydown',function(e){
    if(!wiz.classList.contains('open'))return;
    if(e.key==='Escape')close();
    else if(e.key==='ArrowRight')goNext();
    else if(e.key==='ArrowLeft')goPrev();
  });
  var q=new URLSearchParams(location.search).get('kur');
  if(q==='1'){open()}
  else if(q){var m=SOFRALAR.filter(function(s){return s.id===q})[0];if(m)open(m)}

  /* Yalnız yerel önizleme aracı için debug-hook (üretim davranışını etkilemez,
     hiçbir yerde tüketilmez) — /dev/sofra-svg-onizleme svgKuver()+SEMA'ya
     buradan erişir, wizard'ı açmadan üç adımı yan yana render eder. */
  window.__sofraSvgDebug={svgKuver:svgKuver,SEMA:SEMA};
})();
