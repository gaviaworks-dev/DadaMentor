/* Ölçü Birimleri (measurement.index) — ref olcu-birimleri-v1.html SAYFA JS
   bloğundan kaynak-transfer (satır 2297-2378). GERÇEK işlev: client-side
   dönüştürücü + one-page tab-nav + standart ölçüler tıkla-aç — sahte-veri
   motoru DEĞİL, sayfanın kendisi (lead direktifi, salt-UI istisnası).

   FB "ölçü teyit" FAZ 2 (Beyar kararı 4): dönüştürücü TEK KAYNAĞA bağlandı.
   Eski hardcoded `DATA` bloğu kaldırıldı; veri artık
   MeasurementConversionTable::converterData() → blade @json(#cvData) üzerinden
   gelir (drift biter). Malzeme seçimi 10-kalem <select> yerine 65+ malzeme
   üzerinde yazarak-filtreleme (combobox) — token/class dili korunur (fk-input
   + .cv-pop, yeni renk/radius icat edilmez).

   TAŞINMADI: "tablo sekmeleri (disc-tabs deseni)" bloğu (ref satır 2367-2377,
   .dt click → .tbl-pane hidden toggle). portal.js zaten TÜM .dt elemanlarını
   click → .disc-pane toggle olarak GENEL bağlıyor (satır ~106-113); bu sayfanın
   .tbl-pane'lerine blade'de ek `disc-pane` class'ı verildi, aynı mekanizmayı
   tekrar bağlamak çift-listener yaratırdı (tarif-liste.blade.php emsali). */

/* ===== ONE-PAGE TAB NAV: smooth scroll + scrollspy ===== */
(function(){
  var tabs=[].slice.call(document.querySelectorAll('#obTabs .ob-tab'));
  if(!tabs.length)return;
  var ids=tabs.map(function(t){return t.getAttribute('data-target');});
  tabs.forEach(function(t){
    t.addEventListener('click',function(){
      var el=document.getElementById(t.getAttribute('data-target'));
      if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });
  function setActive(){
    var y=(window.scrollY||0)+140,cur=ids[0];
    ids.forEach(function(id){var el=document.getElementById(id);if(el&&el.offsetTop<=y)cur=id;});
    tabs.forEach(function(t){t.classList.toggle('active',t.getAttribute('data-target')===cur);});
  }
  window.addEventListener('scroll',setActive,{passive:true});setActive();
})();

/* ===== STANDART ÖLÇÜLER: dokunmatik için tıkla-aç (hover CSS ile) ===== */
(function(){
  var cards=[].slice.call(document.querySelectorAll('.std-card'));
  cards.forEach(function(c){
    c.addEventListener('click',function(){
      var open=c.classList.contains('open');
      cards.forEach(function(x){x.classList.remove('open');});
      if(!open)c.classList.add('open');
    });
    c.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();c.click();}});
  });
  document.addEventListener('click',function(e){if(!e.target.closest('.std-card'))cards.forEach(function(x){x.classList.remove('open');});});
})();

/* ===== SAYFA JS — ÖLÇÜ BİRİMLERİ: canlı dönüştürücü (GERÇEK işlev) =====
   Veri kaynağı: #cvData JSON (converterData). Combobox + hesaplayıcı.
   NOT: hesap mantığı (d.v[birim] * miktar) ve veri kaynağı KORUNDU; yalnız
   sunum + etkileşim katmanı yenilendi (arama ikonu + temizle, miktar stepper,
   öne çıkan ölçü hero + kalan birim defteri, boş durum, aria-activedescendant).
   Ölçü-birimi dropdown'ı geri getirilmedi (Beyar UX kararı korunur). */
(function(){
  var node=document.getElementById('cvData');
  var LIST=[];
  try{LIST=JSON.parse(node.textContent)||[];}catch(e){LIST=[];}
  if(!LIST.length)return;
  var MAP={};LIST.forEach(function(d){MAP[d.key]=d;});

  /* birim üst-verisi: etiket + ikon + sabit hacim (ml). Sıra = defter sırası;
     hacimler standart kaplarla (aside) tutarlı. */
  var META={
    su :{label:'su bardağı',  icon:'fa-glass-water', ml:200},
    cay:{label:'çay bardağı',  icon:'fa-mug-hot',     ml:100},
    yk :{label:'yemek kaşığı', icon:'fa-spoon',       ml:15},
    tk :{label:'tatlı kaşığı', icon:'fa-spoon',       ml:5},
    ck :{label:'çay kaşığı',   icon:'fa-spoon',       ml:4}
  };
  var ORDER=['su','cay','yk','tk','ck'];

  var combo=document.querySelector('.cv-combo');
  var search=document.getElementById('cvSearch'),ing=document.getElementById('cvIng'),pop=document.getElementById('cvPop');
  var clear=document.getElementById('cvClear'),amt=document.getElementById('cvAmt'),result=document.getElementById('cvResult');
  var out=document.getElementById('cvOut'),desc=document.getElementById('cvDesc'),rows=document.getElementById('cvRows');
  var heroIco=document.getElementById('cvHeroIco'),heroMeas=document.getElementById('cvHeroMeas'),heroMl=document.getElementById('cvHeroMl');
  if(!combo||!search||!ing||!pop||!amt||!result||!out||!desc||!rows)return;

  function fmt(n){
    var r=n>=100?Math.round(n):Math.round(n*10)/10;
    return String(r).replace('.',',');
  }
  function low(s){return String(s).toLocaleLowerCase('tr');}
  function amtVal(){return parseFloat(String(amt.value).replace(',','.'))||0;}
  function amtTxt(){return String(amt.value).replace('.',',');}
  function setAdesc(id){if(id)search.setAttribute('aria-activedescendant',id);else search.removeAttribute('aria-activedescendant');}

  /* ---- hesaplayıcı: öne çıkan ölçü + kalan birim defteri ---- */
  function calc(){
    var d=MAP[ing.value];
    if(!d){result.classList.add('is-empty');return;}
    result.classList.remove('is-empty');
    var a=amtVal(),aTxt=amtTxt();
    /* öne çıkan birim: su bardağı; su ile ölçülmeyen malzemede yemek kaşığı */
    var feat=(d.v.su!==null&&d.v.su!==undefined)?'su':'yk';
    var fm=META[feat],fg=d.v[feat]*a;
    heroIco.className='fa-solid '+fm.icon;
    heroMeas.textContent=aTxt+' '+fm.label;
    heroMl.textContent=fmt(fm.ml*a)+' ml';
    out.innerHTML=fmt(fg)+'<small>'+d.unit+'</small>';
    desc.textContent=aTxt+' '+fm.label+' '+d.name+' yaklaşık '+fmt(fg)+' '+(d.unit==='ml'?'mililitredir':'gramdır')+'.'
      +(feat!=='su'?' Bu malzeme su bardağıyla ölçülmez.':'');
    rows.innerHTML=ledger(d,a,aTxt,feat);
  }
  /* öne çıkan dışındaki her birim, girilen miktara göre ölçekli (val*a) */
  function ledger(d,a,aTxt,feat){
    var html='';
    ORDER.forEach(function(u){
      if(u===feat)return;
      var val=d.v[u];
      if(val===null||val===undefined)return;
      var m=META[u];
      html+='<div class="cv-row">'
        +'<span class="cv-row-ico"><i class="fa-solid '+m.icon+'" aria-hidden="true"></i></span>'
        +'<span class="cv-row-meas"><b>'+aTxt+' '+m.label+'</b><small>'+fmt(m.ml*a)+' ml</small></span>'
        +'<span class="cv-row-val">'+fmt(val*a)+' <em>'+d.unit+'</em></span>'
        +'</div>';
    });
    return html;
  }

  /* ---- combobox: yazarak filtreleme ---- */
  var results=[],active=-1;
  function openPop(){pop.hidden=false;search.setAttribute('aria-expanded','true');}
  function closePop(){pop.hidden=true;search.setAttribute('aria-expanded','false');setAdesc('');active=-1;}
  function filter(q){
    q=low(q).trim();
    if(!q)return LIST.slice(0,8);
    var starts=[],has=[];
    LIST.forEach(function(d){
      var n=low(d.name);
      if(n.indexOf(q)===0)starts.push(d);
      else if(n.indexOf(q)>-1)has.push(d);
    });
    return starts.concat(has).slice(0,8);
  }
  function render(){
    if(!results.length){
      pop.innerHTML='<li class="cv-empty" aria-disabled="true"><i class="fa-solid fa-circle-question" aria-hidden="true"></i> Eşleşen malzeme yok</li>';
      setAdesc('');openPop();return;
    }
    pop.innerHTML=results.map(function(d,i){
      return '<li class="cv-opt'+(i===active?' active':'')+'" id="cv-opt-'+i+'" role="option" data-key="'+d.key+'" aria-selected="'+(i===active)+'">'+
             '<span>'+d.name+'</span><small>'+d.cat+'</small></li>';
    }).join('');
    setAdesc(active>-1?'cv-opt-'+active:'');
    openPop();
  }
  function scrollActive(){
    var el=pop.querySelector('.cv-opt.active');
    if(el&&el.scrollIntoView)el.scrollIntoView({block:'nearest'});
  }
  function syncClear(){combo.classList.toggle('has-value',!!search.value);}
  function select(d){
    if(!d)return;
    ing.value=d.key;
    search.value=d.name;
    syncClear();
    closePop();
    calc();
  }
  function refresh(){results=filter(search.value);active=-1;render();}

  search.addEventListener('input',function(){syncClear();refresh();});
  search.addEventListener('focus',function(){search.select();refresh();});
  search.addEventListener('keydown',function(e){
    if(pop.hidden&&(e.key==='ArrowDown'||e.key==='ArrowUp')){refresh();return;}
    if(e.key==='ArrowDown'){e.preventDefault();if(results.length){active=(active+1)%results.length;render();scrollActive();}}
    else if(e.key==='ArrowUp'){e.preventDefault();if(results.length){active=(active-1+results.length)%results.length;render();scrollActive();}}
    else if(e.key==='Enter'){if(!pop.hidden&&active>-1){e.preventDefault();select(results[active]);}}
    else if(e.key==='Escape'){if(!pop.hidden){e.preventDefault();closePop();}}
  });
  /* mousedown (blur'dan önce) ile seçim */
  pop.addEventListener('mousedown',function(e){
    var li=e.target.closest('.cv-opt');
    if(!li)return;
    e.preventDefault();
    select(MAP[li.getAttribute('data-key')]);
  });
  search.addEventListener('blur',function(){
    setTimeout(function(){
      closePop();
      /* geçersiz metin girildiyse seçili malzemeye geri dön */
      var d=MAP[ing.value];if(d)search.value=d.name;
      syncClear();
    },120);
  });

  /* ---- temizle: seçimi sıfırla → boş durum ---- */
  if(clear)clear.addEventListener('click',function(){
    search.value='';ing.value='';
    syncClear();
    result.classList.add('is-empty');
    results=filter('');active=-1;render();
    search.focus();
  });

  /* ---- miktar stepper (− / +) ---- */
  [].slice.call(document.querySelectorAll('.cv-step')).forEach(function(b){
    b.addEventListener('click',function(){
      var step=parseFloat(amt.step)||0.25,dir=parseFloat(b.getAttribute('data-dir'))||1;
      var min=parseFloat(amt.min),max=parseFloat(amt.max);
      var v=Math.round((amtVal()+dir*step)/step)*step;
      v=Math.round(v*100)/100;
      if(!isNaN(min))v=Math.max(min,v);
      if(!isNaN(max))v=Math.min(max,v);
      amt.value=String(v);
      calc();
    });
  });
  amt.addEventListener('input',calc);amt.addEventListener('change',calc);

  /* boş-durum popüler malzeme çipleri → doğrudan seçim (aynı select yolu) */
  [].slice.call(document.querySelectorAll('.cv-chip')).forEach(function(c){
    c.addEventListener('click',function(){select(MAP[c.getAttribute('data-key')]);});
  });

  syncClear();
  calc();
})();

/* ===== REVİZE 1: sağ referans panel sekmeleri (Standart Kaplar / Paket & Kalıp)
   İZOLE toggle — GLOBAL portal.js .dt→.disc-pane handler'ına bilinçli
   BAĞLANMAZ (o handler TÜM .disc-pane'leri global toggle ediyor; scoped
   .cv-seg-btn + .cv-tabpane ile tablo sekmeleriyle çapraz-toggle önlenir).
   tablist/tab/tabpanel + roving tabindex + ok tuşu navigasyonu. */
(function(){
  var tabs=[].slice.call(document.querySelectorAll('.cv-seg-btn'));
  if(tabs.length<2)return;
  var panes=[].slice.call(document.querySelectorAll('.cv-tabpane'));
  function activate(t,focus){
    tabs.forEach(function(x){
      var on=x===t;
      x.classList.toggle('is-active',on);
      x.setAttribute('aria-selected',on?'true':'false');
      x.tabIndex=on?0:-1;
    });
    var target=t.getAttribute('data-pane');
    panes.forEach(function(p){p.hidden=(p.id!==target);});
    if(focus)t.focus();
  }
  tabs.forEach(function(t,i){
    t.addEventListener('click',function(){activate(t,false);});
    t.addEventListener('keydown',function(e){
      if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();activate(tabs[(i+1)%tabs.length],true);}
      else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();activate(tabs[(i-1+tabs.length)%tabs.length],true);}
    });
  });
})();

/* ===== DÖNÜŞÜM TABLOLARI: tablo-içi dikey scroll fade ipucu =====
   Her .tbl-frame'in .tbl-scroll'u scroll edilebilir mi + dibe gelindi mi
   ölçülür; alt-fade yalnız scroll varsa ve dipte değilken görünür. Gizli
   pane'ler (display:none) 0 ölçer → tab değişince (portal.js .dt toggle)
   yeniden ölçülür. */
(function(){
  var frames=[].slice.call(document.querySelectorAll('.tbl-frame'));
  if(!frames.length)return;
  function sync(frame){
    var sc=frame.querySelector('.tbl-scroll');
    if(!sc)return;
    frame.classList.toggle('is-scrollable',sc.scrollHeight-sc.clientHeight>4);
    frame.classList.toggle('is-bottom',sc.scrollTop+sc.clientHeight>=sc.scrollHeight-4);
  }
  function syncAll(){frames.forEach(sync);}
  frames.forEach(function(frame){
    var sc=frame.querySelector('.tbl-scroll');
    if(sc)sc.addEventListener('scroll',function(){sync(frame);},{passive:true});
    sync(frame);
  });
  window.addEventListener('resize',syncAll,{passive:true});
  var tabWrap=document.getElementById('tblTabs');
  if(tabWrap)tabWrap.addEventListener('click',function(){setTimeout(syncAll,60);});
})();
