/* ===== DADA ROUTE (Yol Güzergâhım) motoru =====
   Referans motoru (v7-6cu356/yol-guzergahim-v2.html) çekirdeği KORUNDU: Leaflet init ·
   CITY · ROAD_POOL · OSRM routing · perpendicular mesafe (distToSeg/distToRoute).
   2026-07-29 doküman turu ("Dada Route – Yol Haritası"): sapma ekseni km→SÜRE, ara
   durak modeli, alternatif rota kartları, zengin rota özeti, hızlı filtreler, güzergâh
   planı, kaydetme kapısı, kayıtlı güzergâh kategorileri, boş/hata durumları, demo modu
   ve analitik olayları eklendi. Yazım standardı (§21): "güzergâh" ve "mekân" şapkalı. */
(function(){
  if(typeof L==='undefined')return;
  var mapEl=document.getElementById('routeMap');
  if(!mapEl)return;

  /* =====================================================================
     MERKEZÎ YAPILANDIRMA (§16, §6, §17, §18)
     Doküman §16: "Bu oranları yapılandırılabilir hâle getir. Kod içinde
     değiştirilemez sabitler olarak dağıtmak yerine merkezî bir yapılandırmada
     tut." Sıralama ağırlıkları, sapma toleransı seçenekleri, pilot güzergâhlar
     ve sağlayıcı ayarları TEK yerde. Backend geldiğinde bu nesne sunucudan
     beslenecek — çağrı yerleri değişmez.
     ===================================================================== */
  /* =====================================================================
     MERKEZÎ YAPILANDIRMA — ARTIK SUNUCUDAN GELİYOR (§16, §6, §17, §18)
     Bu nesnenin eski hâli kod içinde sabitti ve kendi notu şunu söylüyordu:
     "Backend geldiğinde bu nesne sunucudan beslenecek — çağrı yerleri
     değişmez." 2026-08-06 turunda tam olarak bu oldu: değerler
     `#routeMap[data-boot]` içinden okunur (config/dadaroute.php + Settings +
     route_quick_filters + route_presets). Alan ADLARI korundu; aşağıdaki
     yüzlerce çağrı yeri DEĞİŞMEDİ.
     Boot okunamazsa (JSON bozuk / öznitelik yok) sayfa ölmez: aynı alanların
     güvenli varsayılanlarına düşer.
     ===================================================================== */
  var BOOT={};
  try{ BOOT=JSON.parse(mapEl.getAttribute('data-boot')||'{}')||{}; }catch(e){ BOOT={}; }

  var ROUTE_CFG={
    // §17 harita/rota sağlayıcısı — çağrı SUNUCUDAN yapılır, anahtar tarayıcıya İNMEZ.
    provider: BOOT.provider || {
      adi:'Tahminî rota', surucu:'straight', demo:true,
      yetenek:{ ucretliYol:false, feribot:false, trafik:false, routeMatrix:false, calismaSaati:false }
    },
    maxAraDurak: BOOT.maxAraDurak || 3,
    varsayilanMolaDk: BOOT.varsayilanMolaDk || 45,
    tolerans: (BOOT.tolerans && BOOT.tolerans.length) ? BOOT.tolerans : [
      {id:'tam', ad:'Tam Yol Üstü', dk:0},
      {id:'dk10', ad:'En Fazla 10 Dakika Sapma', dk:10},
      {id:'ozel', ad:'Özel Mesafe Seç', dk:null}
    ],
    varsayilanTolerans: BOOT.varsayilanTolerans || 'dk10',
    tamYolUstuKm: BOOT.tamYolUstuKm || 1.0,
    sapmaHiziKmS: BOOT.sapmaHiziKmS || 55,
    siralamaAgirliklari: BOOT.siralamaAgirliklari || {},
    pilotGuzergahlar: BOOT.pilotGuzergahlar || [],
    // Veri uçları (rota/mekân/yer). Yoksa ilgili özellik sessizce devre dışı
    // kalır — uydurma adres kurulmaz.
    uclar: BOOT.uclar || {}
  };
  // Sağlayıcı künyesi eski alan adıyla da okunuyordu (provider.adi).
  if(ROUTE_CFG.provider && ROUTE_CFG.provider.ad && !ROUTE_CFG.provider.adi) ROUTE_CFG.provider.adi=ROUTE_CFG.provider.ad;
  // §6 "Özel Mesafe" slider aralığı sunucudan (admin ezebilir).
  var OZEL_KM_ARALIK = BOOT.ozelKm || {min:2,max:30,'default':12};
  // §17 DEMO MODU: sağlayıcı gerçek bir üretim motoru DEĞİLSE true.
  // Artık "anahtar var mı" değil, sunucunun bildirdiği gerçek durum.
  var DEMO_MODE = !!(ROUTE_CFG.provider && ROUTE_CFG.provider.demo);
  // CSRF — yazma uçları oturum korumalıdır.
  var CSRF=mapEl.getAttribute('data-csrf')||'';
  function apiFetch(url,opts){
    opts=opts||{};
    opts.headers=Object.assign({'Accept':'application/json','X-Requested-With':'XMLHttpRequest'},opts.headers||{});
    if(opts.method&&opts.method!=='GET'){ opts.headers['Content-Type']='application/json'; opts.headers['X-CSRF-TOKEN']=CSRF; }
    opts.credentials='same-origin';
    return fetch(url,opts).then(function(r){
      if(!r.ok) return r.json().catch(function(){return {};}).then(function(j){ var e=new Error('http '+r.status); e.status=r.status; e.body=j; throw e; });
      return r.json();
    });
  }

  /* =====================================================================
     §22 ANALİTİK OLAYLARI
     Dokümandaki 17 olay adı birebir. Kişisel veri ve ham konum GÖNDERİLMEZ
     (§22 + KVKK şerhi) — yalnız sayısal/kategorik alanlar. Backend/analitik
     hattı yokken olaylar window.dataLayer'a yazılır; hat bağlanınca tek
     fonksiyon değişir, 17 çağrı yeri sabit kalır.
     ===================================================================== */
  function track(olay,veri){
    var payload=Object.assign({event:olay,modul:'dada_route',demo:DEMO_MODE},veri||{});
    try{ (window.dataLayer=window.dataLayer||[]).push(payload); }catch(e){}
  }

  function cssVar(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
  var COL_ROUTE=cssVar('--tomato')||'#E14827';
  var COL_CASE=cssVar('--paper')||'#ffffff';        // rota casing (akışı net göster)
  var COL_ALT=cssVar('--route-alt')||'#A8A29A';     // alternatif rota (nötr gri)

  // ---- Harita: TAM ETKİLEŞİMLİ (drag/zoom/scroll/touch hepsi açık) ----
  // Global harita, demo Türkiye merkezli başlar. Overlay YOK → harita serbest grab edilir.
  var map=L.map('routeMap',{
    center:[39.4,34.0], zoom:6,
    dragging:true, scrollWheelZoom:true, touchZoom:true, doubleClickZoom:true,
    boxZoom:false, keyboard:true, inertia:true, zoomControl:true, tap:true,
    worldCopyJump:true
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
  // konteyner görünür olduktan sonra ölç (split-layout flex'inde 0-boyut tuzağını önler)
  /* ---- YERLER: uç + ara durak seçimi.
     Eskiden 54 satırlık sabit `CITY` dizisiydi. Artık `route_places` tablosu
     (admin yönetir) sunucudan aranır; burada tutulan dizi yalnız o aramanın
     SON SONUCUDUR (autocomplete tıklaması için kimlik eşlemesi). ---- */
  var CITY=[];

  /* ---- YOL ÜSTÜ MEKÂNLAR
     Eskiden ~260 satırlık uydurma `ROAD_POOL` sabitiydi. Artık rota
     çizildikten sonra `/dada-route/mekanlar` ucundan GERÇEK `venues`
     kayıtlarıyla dolar (koridor taraması, açık/kapalı durumu, öğün/aile/
     yöresel eksenleri ve kapak görseli sunucudan gelir). ---- */
  var ROAD_POOL=[];

  /* =====================================================================
     §14 MEKÂN VERİ MODELİ — ARTIK SUNUCUDA TÜRETİLİYOR
     Bu blok, uydurma kategori adından (ör. "Kahvaltı & Serpme") öğün/aile/
     yöresel eksenlerini TAHMİN EDEN bir eşleme tablosuydu; §14'ün geri kalan
     alanları (çalışma saati, doğrulama tarihi, otopark, erişilebilirlik,
     fiyat seviyesi…) "veritabanı gelene kadar null" şerhiyle boş duruyordu.
     2026-08-06: veritabanı geldi. Türetme App\Domain\Gourmet\Route\
     RouteVenuePresenter'a taşındı ve GERÇEK alanlara bağlandı —
     venue_type + venue_feature pivotu + venue_cuisine taksonomisi +
     venue_hours/venue_closures (açık/kapalı) + last_verified_at.
     §15 kuralı KORUNDU: doğrulama verisi yoksa sahte tarih üretilmez,
     `sonDogrulama` null döner ve kart "doğrulanmadı" durumunu basar.
     Mekân nesnesinin ALAN ADLARI değişmedi — aşağıdaki çağrı yerleri aynı.
     ===================================================================== */
  var stops=[null,null];            // TEK TİP durak listesi (sıra = seçim sırası; ilk≈başlangıç, son≈varış ama hepsi "durak")
  var route={poly:null};
  var stopMarkers=[];
  var routeLine=null, routeCasing=null;
  var currentRoutes=[], activeIdx=0, routeLayers=[], altByIdx={};   // alternatif rotalar (altByIdx: route index → harita çizgisi, liste senkronu için)
  var routeSource='tahmini';
  var buildSeq=0, dragIdx=null;

  // DOM
  var stopListEl=document.getElementById('ygStopList'), stopAddBtn=document.getElementById('ygStopAdd'),
      reverseBtn=document.getElementById('ygReverse'),
      newRouteBtn=document.getElementById('ygNewRoute'),
      startEmpty=document.getElementById('ygStart'),
      summaryEl=document.getElementById('ygSummary'),
      kmEl=document.getElementById('ygKm'), kmUnitEl=document.getElementById('ygKmUnit'), noteEl=document.getElementById('ygNote');

  // ---- harita durak pini (TEK TİP, numaralı — Kalkış/Varış ayrımı YOK) ----
  function stopIcon(n){return L.divIcon({className:'yg-pin stop',html:'<span class="yg-pin-b">'+n+'</span>',iconSize:[28,28],iconAnchor:[14,14],popupAnchor:[0,-14]});}
  function placeStopMarkers(){
    stopMarkers.forEach(function(mk){map.removeLayer(mk);}); stopMarkers=[];
    stops.forEach(function(c,i){ if(!c)return;
      stopMarkers.push(L.marker([c.lat,c.lng],{icon:stopIcon(i+1)}).addTo(map).bindPopup('<b>'+(i+1)+'. Durak</b><br>'+c.ad));
    });
  }
  function filled(){return stops.filter(Boolean);}
  /* Durak kutusunda basılan metin. Öneri listesi ilçeyi birincil (`ad`), ili
     ikincil (`alt`) satırda gösterir; seçimden SONRA kutuda yalnız `ad`
     kalıyordu ve "Merkez" yazan 60+ ilçe birbirinden ayırt edilemiyordu.
     Tek satırlık input'ta aynı ayrımı virgüllü sıralama taşır
     (ilçe önce, il sonra) — ek CSS/sınıf icat edilmez. */
  function stopLabel(c){ return c ? (c.ad + (c.alt ? ', ' + c.alt : '')) : ''; }
  /* Karar 5 (Beyar, 2026-08-07) — durağın İLİ. Ölçüm: `route_places`in
     seçilen satırı YÖNETİLİYORSA (`is_managed`) `province_id` her zaman
     doludur — hem il hem ilçe satırında; ama autocomplete yanıtı
     (`RoutePlace::toEnginePayload`) yalnız `alt`i taşır ve `alt`in anlamı
     TÜRE göre değişir: il satırında coğrafi bölge (`§16` "region"), ilçe
     satırında ilin adı. Bu yüzden il BURADA, seçimin `tur`üne göre türetilir:
     il seçildiyse il zaten `ad`in kendisi; ilçe seçildiyse `alt` ilin adıdır;
     POI'de (`tur==='poi'`) il bilinmez, uydurulmaz. Sunucudan geri yüklenen
     kayıtlarda `il` ZATEN çözülmüş gelir (`c.il`) — o zaman yeniden türetme
     yapılmaz, doğrudan kullanılır. */
  function stopIl(c){
    if(!c)return null;
    if(c.il)return c.il;
    if(c.tur==='city')return c.ad;
    if(c.tur==='district')return c.alt||null;
    return null;
  }
  function chainPoints(){ return filled(); }          // OSRM çağrısı: duraklar SEÇİM SIRASIyla
  function syncReverse(){ reverseBtn.disabled=filled().length<2; }
  function maybeBuild(){
    activeRouteId=null;        // planlama divergence (durak ekle/çıkar/sürükle/geo-başla) → ziyaret bağlamından çık (karar 1+3); loadRoute buildRoute'u DOĞRUDAN çağırır, buraya uğramaz
    syncReverse();
    if(filled().length>=2)buildRoute();
    else { clearRoute(); summaryEl.hidden=true; if(startEmpty)startEmpty.hidden=false; }
  }

  // ---- durak listesi: ekle / çıkar / sürükle-sırala + her satırda CITY autocomplete ----
  function renderStops(){
    stopListEl.innerHTML='';
    var son=stops.length-1;
    stops.forEach(function(c,i){
      // §2 — arama alanı yalnız "şehir seç" değil; kalkış/varış uçları ayrı etiketlenir
      var ara=(i>0&&i<son);
      var etiket = i===0 ? 'Nereden?' : (i===son ? 'Nereye?' : (i+'. ara durak'));
      var ipucu  = i===0 ? 'Nereden? Şehir, ilçe, semt veya nokta'
                         : (i===son ? 'Nereye? Şehir, ilçe, semt veya nokta' : 'Ara durak — şehir, ilçe veya nokta');
      var li=document.createElement('li');
      li.className='yg-stop'+(ara?' is-mid':''); li.setAttribute('draggable','true'); li.setAttribute('data-i',i);
      li.innerHTML='<span class="yg-marker station" aria-hidden="true">'+(i+1)+'</span>'+
        '<div class="yg-stop-body">'+
          '<div class="yg-field"><input type="text" class="yg-stop-input" data-i="'+i+'" autocomplete="off" placeholder="'+ipucu+'" aria-label="'+etiket+'"><button class="yg-stop-clear" type="button" tabindex="-1" aria-label="Seçimi temizle"><i class="fa-solid fa-xmark"></i></button><div class="ac-panel" hidden></div></div>'+
          '<span class="yg-grip" aria-hidden="true" title="Sürükle"><i class="fa-solid fa-grip-vertical"></i></span>'+
          '<button class="yg-stop-x" type="button" aria-label="Durağı kaldır" title="Durağı kaldır"'+(stops.length<=2?' disabled':'')+'><i class="fa-solid fa-trash-can"></i></button>'+
        '</div>'+
        // §3 — ara durakta tahmini bekleme süresi + rotaya eklediği süre
        (ara&&c?'<div class="yg-stop-wait">'+
          '<label><i class="fa-regular fa-clock"></i> Tahmini bekleme'+
            '<select class="yg-wait-sel" data-i="'+i+'">'+
              [15,30,45,60,90].map(function(v){
                var sel=(c.molaDk!=null?c.molaDk:ROUTE_CFG.varsayilanMolaDk)===v?' selected':'';
                return '<option value="'+v+'"'+sel+'>'+v+' dk</option>';
              }).join('')+
            '</select>'+
          '</label>'+
          '<span class="yg-stop-add-t">Rotaya +'+fmtDakika(c.molaDk!=null?c.molaDk:ROUTE_CFG.varsayilanMolaDk)+'</span>'+
        '</div>':'');
      li.querySelector('.yg-stop-input').value=stopLabel(c);
      // Satır her render'da YENİDEN doğuyor (innerHTML) — dolayısıyla öneri
      // davranışı da her satıra taze bağlanır. Çekirdek kendi `data-*` bayrağı
      // ile aynı elemana iki kez bağlanmayı zaten engeller.
      bindStopAutocomplete(li.querySelector('.yg-stop-input'),li.querySelector('.ac-panel'),i);
      var xb=li.querySelector('.yg-stop-x'); if(xb)xb.addEventListener('click',function(){if(stops.length<=2)return;stops.splice(i,1);renderStops();placeStopMarkers();maybeBuild();});
      // CLEAR × (input içi) — sadece metni temizler, durak satırı kalır (kullanıcı yeni şehir yazar)
      var cb=li.querySelector('.yg-stop-clear'); if(cb)cb.addEventListener('click',function(){
        var inp=li.querySelector('.yg-stop-input'); inp.value=''; stops[i]=null;
        var box=li.querySelector('.ac-panel'); if(box){box.hidden=true;box.innerHTML='';}
        inp.focus(); placeStopMarkers(); maybeBuild();
      });
      li.addEventListener('dragstart',function(e){dragIdx=i;li.classList.add('dragging');try{e.dataTransfer.effectAllowed='move';}catch(_){}});
      li.addEventListener('dragend',function(){dragIdx=null;li.classList.remove('dragging');});
      li.addEventListener('dragover',function(e){e.preventDefault();li.classList.add('drop-into');});
      li.addEventListener('dragleave',function(){li.classList.remove('drop-into');});
      li.addEventListener('drop',function(e){e.preventDefault();li.classList.remove('drop-into');if(dragIdx!=null&&dragIdx!==i){var it=stops.splice(dragIdx,1)[0];stops.splice(i,0,it);renderStops();placeStopMarkers();maybeBuild();track('route_stop_reordered',{konum:i});}});
      // §3 bekleme süresi — planı yeniden hesaplatır (rota geometrisi değişmez, süre değişir)
      var ws=li.querySelector('.yg-wait-sel');
      if(ws)ws.addEventListener('change',function(){
        if(stops[i]){ stops[i].molaDk=+ws.value; renderStops(); updateSummary(); renderPlan(); }
      });
      stopListEl.appendChild(li);
    });
    syncStopAddBtn();
  }
  // §22 route_form_started — kullanıcı forma ilk kez dokunduğunda, bir kez
  var formBasladi=false;
  stopListEl.addEventListener('focusin',function(e){
    if(formBasladi||!e.target.closest('.yg-stop-input'))return;
    formBasladi=true; track('route_form_started',{});
  });
  /* ---- OTOMATİK TAMAMLAMA ----
     Kaynak SUNUCU (`route_places` — 81 il + 973 ilçe, admin yönetir).
     Eskiden 54 kalemlik sabit dizi üzerinde yerel filtreydi.

     Davranış BURADA YAZILMAZ: gecikme, yarış kilidi, klavye gezinmesi
     (↑/↓/Enter/Esc) ve erişilebilirlik nitelikleri paylaşılan çekirdekte
     (`reference/shared/dada-autocomplete.js`) durur ve `ac-*` sınıf ailesini
     kullanır. Bu blok yalnız İKİ ucu bağlar: öneri nereden gelir, seçilince
     ne olur.

     Çekirdek yüklenmemişse (dosya 404 / eski önbellek) alan düz metin girişi
     olarak çalışmaya devam eder — sayfa çökmez, yalnız öneri açılmaz. */
  function bindStopAutocomplete(inp,box,i){
    if(!global_DadaAutocomplete()) return;
    global_DadaAutocomplete().bind(inp,{
      panel:box,
      icon:'fa-location-dot',
      emptyText:'Eşleşen yer yok',
      fetch:function(q){
        var url=ROUTE_CFG.uclar.yerler;
        if(!url) return Promise.resolve([]);
        return apiFetch(url+'?q='+encodeURIComponent(q)).then(function(j){
          // Zaten seçilmiş durak yeniden önerilmez (aynı şehri iki kez
          // koymak rotayı bozar, kullanıcıya da anlamsız gelir).
          var taken=filled().map(function(x){return x.ad;});
          return (j.yerler||[]).filter(function(c){return taken.indexOf(c.ad)<0;})
            .map(function(c){ return {label:c.ad, sub:c.alt||'', value:c}; });
        });
      },
      onSelect:function(item){
        var sec=item.value;
        // `alt` (ilde bölge, ilçede il) da TAŞINIR — kutuda "Bahçelievler,
        // İstanbul" basılabilsin diye; düşerse öneri satırındaki ayrım seçimle
        // birlikte kaybolurdu.
        stops[i]={id:sec.id,ad:sec.ad,alt:sec.alt||null,tur:sec.tur||null,lat:sec.lat,lng:sec.lng};
        track('route_stop_selected',{konum:i,tur:sec.tur});
        renderStops(); placeStopMarkers(); maybeBuild();
      }
    });
  }
  function global_DadaAutocomplete(){ return window.DadaAutocomplete||null; }
  /* §3 ARA DURAK — kullanıcı en fazla ÜÇ ara durak ekleyebilir.
     Liste tek tip: ilk satır kalkış, son satır varış, aradakiler ara duraktır.
     Yani toplam satır sınırı 2 + maxAraDurak. Dördüncü ara durak istendiğinde
     dokümandaki uyarı metni birebir gösterilir. */
  function araDurakSayisi(){ return Math.max(0,stops.length-2); }
  function durakEklenebilir(){ return araDurakSayisi()<ROUTE_CFG.maxAraDurak; }
  function syncStopAddBtn(){
    if(!stopAddBtn)return;
    var ok=durakEklenebilir();
    stopAddBtn.disabled=!ok;
    stopAddBtn.title=ok?'':'Bu rotaya en fazla '+ROUTE_CFG.maxAraDurak+' durak ekleyebilirsin.';
  }
  if(stopAddBtn)stopAddBtn.addEventListener('click',function(){
    if(!durakEklenebilir()){
      geoToast('Bu rotaya en fazla '+ROUTE_CFG.maxAraDurak+' durak ekleyebilirsin. Yeni bir durak eklemek için mevcut duraklardan birini kaldır.','fa-circle-info');
      return;
    }
    // yeni ara durak SON'DAN ÖNCE eklenir — varış noktası sonda kalsın
    stops.splice(stops.length-1,0,null);
    renderStops();
    var ins=stopListEl.querySelectorAll('.yg-stop-input');
    if(ins.length>1)ins[ins.length-2].focus();
  });
  if(reverseBtn)reverseBtn.addEventListener('click',function(){ if(filled().length<2)return; activeRouteId=null; stops.reverse(); renderStops(); placeStopMarkers(); buildRoute(); });   // ters-çevir = planlama divergence → ziyaret bağlamından çık
  renderStops();

  /* ============ ROTA: SUNUCU TARAFI SAĞLAYICI ============
     Bu blok, tarayıcıdan `router.project-osrm.org` (OSRM'in AÇIK DEMO
     sunucusu) adresine giden doğrudan çağrıydı. Demo sunucunun kullanım
     politikası üretimi dışlar, kotası ve SLA'sı yoktur, yanıt önbelleklenemez.
     Çağrı `/dada-route/rota` ucuna taşındı: sağlayıcı sunucuda seçilir
     (config/dadaroute.php — OSRM host'u yapılandırılabilir, üretimde kendi
     sunucumuz), sonuç önbelleklenir ve anahtar/kota tarayıcıya İNMEZ.
     Yanıt biçimi OSRM sözleşmesiyle AYNI tutuldu → aşağıdaki çizim/özet/
     alternatif kodu değişmedi. Ek olarak `token` gelir: koridor sorgusu bu
     token'la yapılır, istemci polyline TAŞIMAZ.
     ============================================================ */
  var routeToken=null, routeProvider=null;
  function osrmFetch(){
    var url=ROUTE_CFG.uclar.rota;
    if(!url) return Promise.reject(new Error('rota ucu yok'));
    var ch=chainPoints();
    return apiFetch(url,{
      method:'POST',
      body:JSON.stringify({duraklar:ch.map(function(c){return {lat:c.lat,lng:c.lng};})})
    }).then(function(j){
      if(!j||!j.rotalar||!j.rotalar.length)throw new Error('rota yok');
      routeToken=j.token||null; routeProvider=j.saglayici||null;
      return j.rotalar.map(function(rt){
        return {
          poly:rt.geometry.coordinates.map(function(c){return [c[1],c[0]];}),
          km:rt.distance/1000,
          dakika:Math.round(rt.duration/60),
          tahmini:!!rt.tahmini
        };
      });
    });
  }
  function osrmRoute(){
    return osrmFetch().catch(function(){
      return new Promise(function(res){setTimeout(res,900);}).then(osrmFetch);
    });
  }

  /* Koridor içi GERÇEK mekânlar. Rota çizildikten sonra ve tolerans
     değiştiğinde çağrılır; sunucu sonucu önbelleklediği için tolerans
     gidip gelmesi ucuzdur. `venuesSeq` yarış kilidi: bayat yanıt yoksayılır. */
  var venuesSeq=0, corridorCounts={on:0,near:0,total:0};
  function loadVenues(){
    var url=ROUTE_CFG.uclar.mekanlar;
    if(!url||!routeToken){ return Promise.resolve(); }
    var seq=++venuesSeq;
    var q=url+'?token='+encodeURIComponent(routeToken)+'&alternatif='+activeIdx+
      (tolId==='ozel' ? '&km='+encodeURIComponent(ozelKm) : '&dk='+encodeURIComponent(tolTanim().dk||0));
    return apiFetch(q).then(function(j){
      if(seq!==venuesSeq)return;
      ROAD_POOL=j.mekanlar||[];
      corridorCounts={on:(j.sayac&&j.sayac.yolUstu)||0,near:(j.sayac&&j.sayac.yolaYakin)||0,total:(j.sayac&&j.sayac.toplam)||0};
      spawnVenues(); refreshCounts();
    }).catch(function(e){
      if(seq!==venuesSeq)return;
      // Rota önbelleği düşmüşse (409) rota yeniden çizilir; başka hatada
      // liste boşalır ama sayfa ayakta kalır (§13).
      if(e&&e.status===409){ routeToken=null; buildRoute(); return; }
      ROAD_POOL=[]; spawnVenues();
    });
  }

  function buildRoute(){
    if(filled().length<2)return;
    if(startEmpty)startEmpty.hidden=true;
    var seq=++buildSeq;
    setComputing();
    if(typeof fetch!=='function'){ showRouteError(); return; }
    osrmRoute().then(function(routes){
      if(seq!==buildSeq)return;                 // bayat sonuç → yoksay (yarış kilidi)
      routeSource='gercek';
      currentRoutes=routes; activeIdx=0; route.poly=routes[0].poly;
      drawRoutes(); placeStopMarkers();
      updateSummary(); renderAltList(); refreshThreshold(true);
      ensureDashExpanded();   // AUTO-EXPAND: yeni rota hesaplandı (durak ekle/çıkar/yön çevir buraya gelir) → kapalıysa yumuşak aç
      fitActive();
      track('route_created',{durak:filled().length,alternatif:routes.length,km:Math.round(routes[0].km||0)});
    }).catch(function(){
      if(seq!==buildSeq)return;
      showRouteError();
    });
  }
  // aktif=beyaz casing+domates hat (akış net); alternatifler=gri ince, tıkla-seç
  // alt çizgi temel/hover stilleri — nötr gri, ana rotadan İNCE ama net (silik değil); ana hat hep üstte
  var ALT_BASE={color:COL_ALT,weight:4.5,opacity:.9}, ALT_HOVER={color:COL_ALT,weight:6.5,opacity:1};
  function drawRoutes(){
    routeLayers.forEach(function(l){map.removeLayer(l);}); routeLayers=[]; altByIdx={};
    if(routeCasing){map.removeLayer(routeCasing);routeCasing=null;}
    if(routeLine){map.removeLayer(routeLine);routeLine=null;}
    currentRoutes.forEach(function(r,i){
      if(i===activeIdx)return;
      // ince beyaz casing → alt çizgi harita zemininden ayrışsın (Google deseni; silik kalmaz)
      var altCase=L.polyline(r.poly,{color:COL_CASE,weight:8,opacity:.7,lineJoin:'round',lineCap:'round'}).addTo(map);
      var alt=L.polyline(r.poly,Object.assign({lineJoin:'round',lineCap:'round'},ALT_BASE)).addTo(map);
      alt.bindTooltip(fmtDist(r.km)+' · '+fmtDakika(r.dakika),{sticky:true,direction:'top',className:'yg-alt-tip',opacity:1});
      alt.on('click',function(){selectRoute(i);});
      alt.on('mouseover',function(){hoverAlt(i,true);});
      alt.on('mouseout',function(){hoverAlt(i,false);});
      routeLayers.push(altCase,alt);
      altByIdx[i]={line:alt};
    });
    var ap=currentRoutes[activeIdx].poly;
    routeCasing=L.polyline(ap,{color:COL_CASE,weight:9.5,opacity:.95,lineJoin:'round',lineCap:'round'}).addTo(map);
    routeLine =L.polyline(ap,{color:COL_ROUTE,weight:5.5,opacity:1,lineJoin:'round',lineCap:'round'}).addTo(map);
    routeLine.bringToFront();   // ana rota DAİMA üstte (alt hover'da bile ezilmez → "asıl yol bu" net)
  }
  // harita↔liste çift-yönlü senkron: alt çizgi/kart hover → ikisi birden belirginleşir (ana hat üstte kalır)
  function hoverAlt(i,on){
    var o=altByIdx[i]; if(o&&o.line)o.line.setStyle(on?ALT_HOVER:ALT_BASE);
    if(routeLine)routeLine.bringToFront();
    if(altListEl){var btn=altListEl.querySelector('.yg-alt[data-idx="'+i+'"]'); if(btn)btn.classList.toggle('is-hover',on);}
  }
  function selectRoute(i){
    if(i===activeIdx||!currentRoutes[i])return;
    activeIdx=i; route.poly=currentRoutes[i].poly;
    drawRoutes(); updateSummary(); renderAltList(); refreshThreshold(true);
    ensureDashExpanded();   // AUTO-EXPAND: alternatif rota seçildi → kapalıysa yumuşak aç
    track('alternative_route_selected',{tur:rotaTuru(i),km:Math.round((currentRoutes[i]||{}).km||0)});
  }
  function clearRoute(){
    routeLayers.forEach(function(l){map.removeLayer(l);}); routeLayers=[]; altByIdx={};
    if(routeLine){map.removeLayer(routeLine);routeLine=null;}
    if(routeCasing){map.removeLayer(routeCasing);routeCasing=null;}
    stopMarkers.forEach(function(mk){map.removeLayer(mk);}); stopMarkers=[];
    clearVenuePins(); if(dashEl)dashEl.hidden=true; syncBottomOffset();
    currentRoutes=[]; activeIdx=0; route.poly=null;
    // STALE FIX: rota geçersizleşince (durak <2 / hata / reset / yükleme-öncesi) bağımlı TÜM çıktılar tek noktadan gitsin —
    // alternatif km kartları + koridor sayaçları panelde kalmasın (eskiden yalnız resetPlanner temizliyordu → durak-sil'de stale kalıyordu)
    if(altsEl)altsEl.hidden=true; if(altListEl)altListEl.innerHTML='';
    if(corrEl)corrEl.hidden=true;
    if(cntOnEl)cntOnEl.textContent='0'; if(cntNearEl)cntNearEl.textContent='0';
    closeDetail(); renderSelected();   // detay kapan + "güzergahımdaki mekanlar" gizlen (seçim korunur)
    if(viewAllEl && !viewAllEl.hidden) closeAllView();   // rota gidince tam listeden Rota Kur'a dön
    updateSheetCtx(); updateBrowseCta();   // FAZ 4: peek chip → "Rotanı çiz" prompt'a dön, browse CTA gizle
  }
  // ---- B: "Yeni Güzergah" — yüklü/taze rotadan TERTEMİZ planlamaya dön ----
  function resetPlanner(){
    stops=[null,null]; selectedVenues=[]; activeRouteId=null;     // sıfır-bağlam (divergence mantığıyla tutarlı)
    nameEdited=false; lastAutoName=''; if(saveNameEl)saveNameEl.value='';
    tolId=ROUTE_CFG.varsayilanTolerans; ozelKm=12; corridor=aktifKoridorKm();
    if(corrSlider)corrSlider.value=ozelKm;
    clearRoute();                                                  // harita/poly temizle → renderSelected mine+save gizler
    if(summaryEl)summaryEl.hidden=true; if(altsEl)altsEl.hidden=true; if(corrEl)corrEl.hidden=true;
    if(planEl)planEl.hidden=true;
    renderStops(); placeStopMarkers();                            // boş 2 durak, pin yok
    if(startEmpty)startEmpty.hidden=false;
    selectTab('route'); disarmReset();
    var f=stopListEl.querySelector('.yg-stop-input'); if(f)f.focus();
  }
  function updateNewRouteBtn(){
    if(!newRouteBtn)return;
    var has=filled().length>0 || !!route.poly;                    // temizlenecek bir şey varken görünür
    newRouteBtn.hidden=!has; if(!has)disarmReset();
  }
  var newRoutePending=false, newRouteTimer=null;
  /* §2 — "'Yeni Rota Oluştur' işleminde mevcut seçimlerin silineceği kullanıcıya
     AÇIKÇA belirtilmelidir." İki adımlı onay korunuyor ama ikinci adımın metni
     artık ne kaybedileceğini söylüyor (durak + eklenen mekân sayısıyla). */
  function armReset(){ newRoutePending=true; if(!newRouteBtn)return;
    var n=filled().length, v=selectedVenues.length;
    newRouteBtn.classList.add('confirm');
    newRouteBtn.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i> '+
      n+' durak'+(v?' + '+v+' mekân':'')+' silinecek — onayla';
    clearTimeout(newRouteTimer); newRouteTimer=setTimeout(disarmReset,4000); }
  function disarmReset(){ newRoutePending=false; clearTimeout(newRouteTimer); if(!newRouteBtn)return;
    newRouteBtn.classList.remove('confirm'); newRouteBtn.innerHTML='<i class="fa-solid fa-rotate-left"></i> Yeni Rota Oluştur'; }
  if(newRouteBtn)newRouteBtn.addEventListener('click',function(){
    var unsaved=!!route.poly && !activeRouteId;                   // taze/diverged çizili rota = kaydedilmemiş iş
    if(unsaved && !newRoutePending){ armReset(); return; }        // 2-adımlı onay (kazara kayıp önle); yüklü&temiz → direkt sıfırla
    resetPlanner();
  });
  function fitPad(){
    var pad={paddingTopLeft:[34,84],paddingBottomRight:[40,40]};
    var pb=panel.getBoundingClientRect();
    if(window.innerWidth>860){
      pad.paddingTopLeft=[Math.round(pb.width)+28,84];   // desktop: sol dock genişliği
    } else {
      // mobil: panel ALT bottom-sheet → rota, sheet ÜSTÜndeki görünür haritaya sığsın.
      // üst = header (~72px) · alt = GÖRÜNÜR sheet yüksekliği (detent'e göre, getBoundingClientRect transform-sonrası).
      var vis=Math.max(0, Math.round(window.innerHeight - pb.top));   // görünür sheet
      pad.paddingTopLeft=[22,72];
      pad.paddingBottomRight=[40, vis+16];
    }
    return pad;
  }
  function fitActive(){ if(!routeLine)return; map.fitBounds(routeLine.getBounds().pad(0.04), fitPad()); }
  // fallback (poly'siz eski kayıt): OSRM beklenirken yeni stops'a fit → boşlukta eski zoom/koridor görünmesin (B-1)
  function fitStops(){ var f=filled(); if(f.length<2)return; map.fitBounds(L.latLngBounds(f.map(function(c){return [c.lat,c.lng];})).pad(0.12), fitPad()); }

  // ---- perpendicular mesafe (v1 çekirdeği — şehir merkezine DEĞİL, rota çizgisine) ----
  function distToSeg(p,a,b){
    var kx=111.32*Math.cos(p.lat*Math.PI/180), ky=110.57;
    var ax=a[1]*kx,ay=a[0]*ky,bx=b[1]*kx,by=b[0]*ky,px=p.lng*kx,py=p.lat*ky;
    var dx=bx-ax,dy=by-ay,L2=dx*dx+dy*dy;
    var t=L2?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/L2)):0;
    return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));
  }
  function distToRoute(m){var min=Infinity,r=route.poly;if(!r)return min;for(var i=0;i<r.length-1;i++)min=Math.min(min,distToSeg({lat:m.lat,lng:m.lng},r[i],r[i+1]));return min;}
  // §8 "Mekân sonuçları rota üzerindeki yolculuk sırasına göre listelenmelidir."
  // Mekânın rota çizgisi üzerindeki en yakın parçasının indeksi = yolculuk sırası.
  function rotaSirasi(m){
    var r=route.poly; if(!r)return 0;
    var min=Infinity, at=0;
    for(var i=0;i<r.length-1;i++){ var d=distToSeg({lat:m.lat,lng:m.lng},r[i],r[i+1]); if(d<min){min=d;at=i;} }
    return at;
  }
  /* =====================================================================
     §6 SAPMA TOLERANSI — EKSEN SÜRE (referans km sliderının yerine)
     Doküman §6: "Sapma ayarını yalnızca kilometre üzerinden oluşturma.
     Kullanıcı kararını öncelikle yolculuğa eklenecek süre üzerinden vermelidir."
     Kullanıcı dakika seçer; koridor yarıçapı ondan TÜRETİLİR.

     ŞERH (§6 + §17 — rapora ve demo şeridine yazıldı): doküman ek sürenin
     gerçek yol ağı üzerinden (rotadan çıkış + mekâna varış + ana rotaya dönüş)
     hesaplanmasını ister. Bu Route Matrix yeteneği gerektirir
     (ROUTE_CFG.provider.yetenek.routeMatrix). Sağlayıcı bağlanana kadar ek süre
     rotaya dik uzaklıktan gidiş-dönüş olarak TAHMİN edilir ve arayüzde
     "yaklaşık" ibaresiyle gösterilir — gerçekmiş gibi sunulmaz.
     ===================================================================== */
  var tolId=ROUTE_CFG.varsayilanTolerans, ozelKm=12;
  function tolTanim(id){ return ROUTE_CFG.tolerans.filter(function(t){return t.id===(id||tolId);})[0]||ROUTE_CFG.tolerans[2]; }
  // sapma süresi (dk) — gidiş + dönüş; sağlayıcı gelince gerçek matrisle değişir
  function sapmaDk(off){ return Math.max(0,Math.round((off*2)/ROUTE_CFG.sapmaHiziKmS*60)); }
  // dakika toleransından koridor yarıçapı (km): dk = off*2/hız*60  ⇒  off = dk*hız/120
  function dkToKm(dk){ return dk*ROUTE_CFG.sapmaHiziKmS/120; }
  function aktifKoridorKm(){
    var t=tolTanim();
    if(t.id==='ozel')return ozelKm;
    if(t.id==='tam') return ROUTE_CFG.tamYolUstuKm;
    return dkToKm(t.dk);
  }
  var corridor=aktifKoridorKm();
  // §7 tanım: "Tam Yol Üstü — rotadan çıkmadan veya çok küçük bir sapmayla ulaşılabilen"
  function proxTier(off){return off<=ROUTE_CFG.tamYolUstuKm?'on':'near';}
  /* Sayaçlar SUNUCUDAN gelir (koridor taramasının kendisinden — ikinci bir
     tarama yapılmaz). Yanıt henüz gelmediyse yerel listeden hesaplanır ki
     ilk boyamada 0 görünmesin. Sunucu sayacı TAVANDAN ETKİLENMEZ: yanıt
     `corridor_result_cap` ile kırpılsa bile toplam gerçek sayıdır. */
  function computeCounts(){
    if(corridorCounts.total>0||ROAD_POOL.length===0)
      return {on:corridorCounts.on,near:corridorCounts.near,total:corridorCounts.total};
    var on=0,near=0;
    if(route.poly)ROAD_POOL.forEach(function(m){var off=distToRoute(m); if(off<=corridor){ if(proxTier(off)==='on')on++; else near++; }});
    return {on:on,near:near,total:on+near};
  }
  /* Yalnız sayaç/özet satırını tazeler — koridoru yeniden İSTEMEZ
     (loadVenues yanıtı geldiğinde çağrılır, sonsuz döngü olmaz). */
  function refreshCounts(){
    var c=computeCounts();
    if(cntOnEl)cntOnEl.textContent=c.on;
    if(cntNearEl)cntNearEl.textContent=c.near;
    if(noteEl){
      noteEl.className='yg-sum-note';
      noteEl.innerHTML='<i class="fa-solid fa-utensils"></i><span><b>'+c.total+'</b> yol üstü mekân bu rotada — aşağıdaki kadranda.</span>';
    }
  }

  // ---- özet: SADE (km + durum notu; süre/rozet YOK — kullanıcı tercihi) ----
  function fmtDakika(d){ if(d==null)return '—'; var h=Math.floor(d/60),m=d%60; return h? h+'sa '+m+'dk':m+' dk'; }
  // mesafe: km<1 → metre (10m'e yuvarlı, "0 km" yerine "850 m"); aksi km
  function fmtDistParts(km){ if(km==null)return {v:'—',u:''}; if(km<1){ return {v:String(Math.round(km*1000/10)*10),u:'m'}; } return {v:String(Math.round(km)),u:'km'}; }
  function fmtDist(km){ var p=fmtDistParts(km); return p.u?p.v+' '+p.u:p.v; }
  // varış saati (§4, §5, §10) — şimdi + yolculuk süresi
  function fmtSaat(d){ try{ return d.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}); }catch(e){ return '—'; } }
  function varisSaati(dk){ return dk==null?null:fmtSaat(new Date(Date.now()+dk*60000)); }

  /* §5 + §10 — duraklarla birlikte toplam: temel rota + seçilen her mekânın
     sapma süresi + mola süresi. Eklenen mesafe = sapmanın gidiş-dönüşü. */
  function planOzeti(){
    var r=currentRoutes[activeIdx]||{};
    var baseDk=(r.dakika!=null?r.dakika:null), baseKm=(r.km!=null?r.km:null);
    var ekDk=0, ekKm=0;
    selectedVenues.forEach(function(v){
      var off=distToRoute(v);
      ekKm+=off*2;
      ekDk+=sapmaDk(off)+(v.molaDk!=null?v.molaDk:ROUTE_CFG.varsayilanMolaDk);
    });
    return {
      baseDk:baseDk, baseKm:baseKm, ekDk:ekDk, ekKm:ekKm,
      toplamDk:(baseDk==null?null:baseDk+ekDk),
      toplamKm:(baseKm==null?null:baseKm+ekKm)
    };
  }
  // §5 "Rotadaki şehirler" — duraklar kesin; koridordaki mekânların illeri eklenir
  function rotaSehirleri(){
    var out=[];
    filled().forEach(function(c){ if(out.indexOf(c.ad)<0)out.push(c.ad); });
    currentVenueList.forEach(function(x){ var il=x.m.il; if(il&&out.indexOf(il)<0)out.push(il); });
    return out;
  }

  function setComputing(){
    summaryEl.hidden=false; kmEl.textContent='…';
    if(sumGridEl)sumGridEl.innerHTML='';
    noteEl.className='yg-sum-note';
    noteEl.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i><span>Gerçek yol çiziliyor…</span>';
    if(altsEl)altsEl.hidden=true; if(corrEl)corrEl.hidden=true;
  }
  // §13 "Rota oluşturulamadı" — kullanıcıya sistem kodu/geliştirici hatası GÖSTERİLMEZ
  function showRouteError(){
    clearRoute(); summaryEl.hidden=false; kmEl.textContent='—';
    if(sumGridEl)sumGridEl.innerHTML='';
    noteEl.className='yg-sum-note err';
    noteEl.innerHTML='<i class="fa-solid fa-triangle-exclamation"></i><span>Bu iki nokta arasında uygun bir otomobil rotası oluşturamadık. Adresleri kontrol ederek tekrar dene.'+
      '<br><button class="yg-retry" id="ygRetry" type="button"><i class="fa-solid fa-rotate-right"></i> Tekrar dene</button></span>';
    var rb=document.getElementById('ygRetry'); if(rb)rb.addEventListener('click',function(){ if(filled().length>=2)buildRoute(); });
    if(altsEl)altsEl.hidden=true; if(corrEl)corrEl.hidden=true;
    track('route_creation_failed',{durakSayisi:filled().length});
  }

  /* =====================================================================
     §5 ROTA ÖZETİ — dokümandaki 12 veri noktası tek kartta
     "Rota oluşturulmadan önce '— km' ve çok sayıda '0' gösterme": kart yalnız
     rota varken açılır, değeri olmayan satır BASILMAZ (boş blok yok).
     ===================================================================== */
  function sumRow(ikon,etiket,deger,sinif){
    if(deger==null||deger==='')return '';
    return '<div class="yg-sum-row'+(sinif?' '+sinif:'')+'"><span class="yg-sum-k"><i class="fa-solid '+ikon+'"></i> '+etiket+'</span>'+
           '<span class="yg-sum-v">'+deger+'</span></div>';
  }
  function updateSummary(){
    summaryEl.hidden=false;
    var r=currentRoutes[activeIdx];
    var dp=fmtDistParts(r&&r.km!=null?r.km:null);
    kmEl.textContent=dp.v; if(kmUnitEl)kmUnitEl.textContent=dp.u;
    if(corrEl)corrEl.hidden=false;
    if(!sumGridEl)return;
    var p=planOzeti(), sehirler=rotaSehirleri(), c=computeCounts(), secili=selectedVenues.length;
    var html='';
    // Karar 4 (2026-08-07): sağlayıcı zaman aşımına düşüp düz-çizgi yedeğine
    // geçtiğinde sunucu bu rotayı `tahmini=true` ile işaretler (RouteResult
    // ->isEstimate). Satır YALNIZ o durumda basılır — gerçek sağlayıcı
    // sonucunda "yaklaşık" ibaresi gösterilmez (§27: yalnız gerçekten eksik
    // olan yazılır).
    html+=sumRow('fa-triangle-exclamation','Rota kaynağı', (r&&r.tahmini)?'Yaklaşık — sağlayıcıya şu an ulaşılamadı':null,'acc');
    html+=sumRow('fa-clock','Tahmini yolculuk süresi', p.baseDk!=null?fmtDakika(p.baseDk):null);
    html+=sumRow('fa-flag-checkered','Tahmini varış saati', varisSaati(p.baseDk));
    html+=sumRow('fa-route','Seçilen rota türü', rotaTuru(activeIdx));
    html+=sumRow('fa-city','Rotadaki şehirler', sehirler.length?sehirler.join(' · '):null);
    html+=sumRow('fa-utensils','Yol üstü mekân sayısı', c.total?String(c.total):null);
    if(secili){
      html+=sumRow('fa-location-dot','Seçilen gastronomi durağı', secili+' mekân','acc');
      html+=sumRow('fa-hourglass-half','Duraklarla birlikte toplam süre', p.toplamDk!=null?fmtDakika(p.toplamDk):null,'acc');
      html+=sumRow('fa-plus','Yolculuğa eklenen süre', fmtDakika(p.ekDk),'acc');
      html+=sumRow('fa-plus','Eklenen toplam mesafe', fmtDist(p.ekKm),'acc');
    }
    // §4/§5 ücretli yol + feribot: sağlayıcı bu veriyi vermiyor → SATIR AÇILMAZ,
    // gerekçe demo şeridinde tek cümleyle duruyor (§27: tahmin yürütme).
    if(ROUTE_CFG.provider.yetenek.ucretliYol) html+=sumRow('fa-coins','Ücretli yol', r&&r.ucretliYol);
    if(ROUTE_CFG.provider.yetenek.feribot)    html+=sumRow('fa-ship','Feribot', r&&r.feribot);
    sumGridEl.innerHTML=html;
  }

  /* =====================================================================
     §4 ALTERNATİF ROTALAR
     Sağlayıcıdan gelen alternatifler süre/mesafeye göre SINIFLANDIRILIR:
     en düşük süre → "En Hızlı", en düşük mesafe → "En Kısa".
     "Daha Az Ücretli Yol" ücretli-yol verisi gerektirir; sağlayıcı bunu
     vermediği sürece UYDURULMAZ (§4'ün kendi kuralı: "Yeterli veri yoksa
     Faz 1'de aktif etme"). Yetenek açılınca etiket kendiliğinden görünür.
     Kartta: ad · mesafe · süre · varış · uygun mekân sayısı · süre/mesafe farkı.
     ===================================================================== */
  function rotaTuru(i){
    var r=currentRoutes[i]; if(!r)return null;
    if(r.tur)return r.tur;
    return i===0?'En Hızlı':('Alternatif '+i);
  }
  function siniflandirRotalar(){
    if(!currentRoutes.length)return;
    var hizli=0,kisa=0;
    currentRoutes.forEach(function(r,i){
      if(r.dakika!=null&&currentRoutes[hizli].dakika!=null&&r.dakika<currentRoutes[hizli].dakika)hizli=i;
      if(r.km!=null&&currentRoutes[kisa].km!=null&&r.km<currentRoutes[kisa].km)kisa=i;
    });
    currentRoutes.forEach(function(r,i){ r.tur='Alternatif '+i; });
    currentRoutes[hizli].tur='En Hızlı';
    if(kisa!==hizli)currentRoutes[kisa].tur='En Kısa';
    // ücretli-yol verisi geldiğinde "Daha Az Ücretli" burada işaretlenir
    if(ROUTE_CFG.provider.yetenek.ucretliYol){
      var ucuz=null;
      currentRoutes.forEach(function(r,i){ if(r.ucretDeger!=null&&(ucuz===null||r.ucretDeger<currentRoutes[ucuz].ucretDeger))ucuz=i; });
      if(ucuz!=null&&ucuz!==hizli&&ucuz!==kisa)currentRoutes[ucuz].tur='Daha Az Ücretli';
    }
  }
  // bir rotanın koridorunda kaç uygun mekân var (§4 "yol üstü uygun mekân sayısı")
  function rotaMekanSayisi(r){
    if(!r||!r.poly)return null;
    var eski=route.poly; route.poly=r.poly;
    var n=0; ROAD_POOL.forEach(function(m){ if(distToRoute(m)<=corridor)n++; });
    route.poly=eski; return n;
  }
  function fark(v,ref,fmt){
    if(v==null||ref==null)return '';
    var d=v-ref; if(Math.abs(d)<0.5)return '<span class="yg-alt-d same">aynı</span>';
    return '<span class="yg-alt-d '+(d>0?'up':'down')+'">'+(d>0?'+':'−')+fmt(Math.abs(d))+'</span>';
  }
  function renderAltList(){
    if(!altsEl||!altListEl)return;
    if(currentRoutes.length<2){altsEl.hidden=true;altListEl.innerHTML='';return;}
    siniflandirRotalar();
    altsEl.hidden=false; altListEl.innerHTML='';
    var aktif=currentRoutes[activeIdx]||{};
    currentRoutes.forEach(function(r,i){
      var b=document.createElement('button');
      b.type='button'; b.className='yg-alt'+(i===activeIdx?' is-active':''); b.dataset.idx=i;
      var n=rotaMekanSayisi(r);
      var farklar=(i===activeIdx)?'':(fark(r.dakika,aktif.dakika,fmtDakika)+fark(r.km,aktif.km,fmtDist));
      b.innerHTML='<span class="yg-alt-bar"></span>'+
        '<span class="yg-alt-main">'+
          '<span class="yg-alt-tag">'+rotaTuru(i)+'</span>'+
          '<span class="yg-alt-figs"><b class="yg-alt-km">'+fmtDist(r.km)+'</b>'+
            '<span class="yg-alt-time">'+fmtDakika(r.dakika)+'</span>'+
            (varisSaati(r.dakika)?'<span class="yg-alt-eta">varış '+varisSaati(r.dakika)+'</span>':'')+
          '</span>'+
          (n!=null?'<span class="yg-alt-venues"><i class="fa-solid fa-utensils"></i> '+n+' uygun mekân</span>':'')+
          (farklar?'<span class="yg-alt-deltas">'+farklar+'</span>':'')+
        '</span>';
      b.addEventListener('click',function(){selectRoute(i);});
      if(i!==activeIdx){
        b.addEventListener('mouseenter',function(){hoverAlt(i,true);});
        b.addEventListener('mouseleave',function(){hoverAlt(i,false);});
      }
      altListEl.appendChild(b);
    });
  }

  /* =====================================================================
     §6 TOLERANS ŞERİDİ — dakika seçenekleri + "Özel Mesafe Seç"
     ===================================================================== */
  function renderTolerans(){
    if(!tolChipsEl)return;
    tolChipsEl.innerHTML=ROUTE_CFG.tolerans.map(function(t){
      return '<button class="yg-tol-chip'+(t.id===tolId?' is-active':'')+'" type="button" data-tol="'+t.id+'">'+t.ad+'</button>';
    }).join('');
    if(tolCustomEl)tolCustomEl.hidden=(tolId!=='ozel');
  }
  /* Tolerans değişimi koridoru DEĞİŞTİRİR → mekân kümesi sunucudan yeniden
     istenir (sonuç önbellekli, bu yüzden ucuz). Slider sürüklenirken her
     pikselde istek atılmasın diye kısa debounce; çip tıklaması anında gider. */
  var corridorTimer=null;
  function refreshThreshold(hemen){
    corridor=aktifKoridorKm();
    if(corrValEl)corrValEl.textContent=ozelKm+' km';
    if(corrSlider){
      corrSlider.value=ozelKm;
      corrSlider.style.setProperty('--thumb', ozelKm<=8?'var(--green)':(ozelKm<=20?'var(--yellow)':'var(--tomato)'));
    }
    renderTolerans();
    refreshCounts();
    if(routeToken){
      clearTimeout(corridorTimer);
      corridorTimer=setTimeout(loadVenues, hemen?0:220);
    }
  }

  // ============ DALGA 2-3: yol üstü mekanlar — pinler + ALT KADRAN + DETAY KARTI + SEÇİLİ MEKANLAR (durak DEĞİL) ============
  var panel=document.querySelector('.yg-panel'),
      altsEl=document.getElementById('ygAlts'), altListEl=document.getElementById('ygAltList'),
      corrEl=document.getElementById('ygCorr'), corrSlider=document.getElementById('ygCorrSlider'),
      corrValEl=document.getElementById('ygCorrVal'), cntOnEl=document.getElementById('ygCntOn'), cntNearEl=document.getElementById('ygCntNear'),
      sumGridEl=document.getElementById('ygSumGrid'),
      tolChipsEl=document.getElementById('ygTolChips'), tolCustomEl=document.getElementById('ygTolCustom'),
      quickEl=document.getElementById('ygQuickFilters'), planEl=document.getElementById('ygPlan'),
      planListEl=document.getElementById('ygPlanList'), planFootEl=document.getElementById('ygPlanFoot'),
      dashEl=document.getElementById('ygDash'), dashCountEl=document.getElementById('ygDashCount'), dashScrollEl=document.getElementById('ygDashScroll'),
      dashTitleTxtEl=document.getElementById('ygDashTitleTxt');
  // detay kartı + güzergahımdaki mekanlar DOM
  var detailEl=document.getElementById('ygDetail'), detailMediaEl=document.getElementById('ygDetailMedia'),
      detailBadgeEl=document.getElementById('ygDetailBadge'), detailNameEl=document.getElementById('ygDetailName'),
      detailLocEl=document.getElementById('ygDetailLoc'), detailTagEl=document.getElementById('ygDetailTag'),
      detailStarEl=document.getElementById('ygDetailStar'), detailStarValEl=document.getElementById('ygDetailStarVal'),
      detailAddEl=document.getElementById('ygDetailAdd'), detailAddTxtEl=document.getElementById('ygDetailAddTxt'),
      detailVisitEl=document.getElementById('ygDetailVisit'), detailVisitTxtEl=document.getElementById('ygDetailVisitTxt'),
      detailMoreEl=document.getElementById('ygDetailMore'), detailMoreTxtEl=document.getElementById('ygDetailMoreTxt'),
      detailMoreIcoEl=document.getElementById('ygDetailMoreIco'),
      detailDetourEl=document.getElementById('ygDetailDetour'), detailVerifyEl=document.getElementById('ygDetailVerify'),
      detailSaveEl=document.getElementById('ygDetailSave'), detailShareEl=document.getElementById('ygDetailShare'),
      detailReportEl=document.getElementById('ygDetailReport'),
      detailCloseEl=document.getElementById('ygDetailClose');
  var mineEl=document.getElementById('ygMine'), mineCntEl=document.getElementById('ygMineCnt'),
      mineEmptyEl=document.getElementById('ygMineEmpty'), mineListEl=document.getElementById('ygMineList'),
      mineSubEl=document.getElementById('ygMineSub');

  var venuePins=[], VIMG='?w=300&q=80&auto=format&fit=crop';
  // A1: mekana tıkla→uç zoom'u (liste + alt slider TEK kaynak). Orta-karar: balon belirgin, sokak/bina seviyesine inmez.
  var VENUE_ZOOM=13;
  // GLITCH FIX: mekana tıklayınca PARABOLİK flyTo (sinematik uzaklaş→yaklaş — istenen davranış). Glitch'in kaynağı parabol DEĞİL:
  //   (1) RACE — devam eden animasyon (rota fitActive / önceki tıklama) bitmeden yenisi → ara state. map.stop() temiz keser.
  //   (2) Animasyon sırasında harita kayarken pinler sabit mouse altından geçip tooltip flicker → mapAnimating bayrağı bastırır (aşağıda).
  // setView (sert snap / boş-gri tile) GERİ ALINDI → flyTo parabolü korunur. maxZoom=VENUE_ZOOM ile tepe aşırı dibe inmez,
  // easeLinearity ile geçiş yumuşatılır (pixelli ara faz minimize).
  // İLK-TIKLAMA PIXELLİ FIX: ilk tıklama fit zoom'undan (geniş rota, z~8-9) VENUE_ZOOM'a BÜYÜK zoom-in → hedef z13 tile'ları
  // cache'de yok → varışta düşük-res büyütme ("kocaman pixelli"). Sonraki tıklamalar zaten z13 + paylaşılan cache → temiz.
  // Çözüm (parabolü BOZMADAN): flyTo'dan ÖNCE hedef z13 3x3 tile'ı tarayıcı cache'ine ısıt (minimal 9 istek; cache'lenince tekrar yok).
  function lon2tile(lon,z){ return Math.floor((lon+180)/360*Math.pow(2,z)); }
  function lat2tile(lat,z){ return Math.floor((1-Math.log(Math.tan(lat*Math.PI/180)+1/Math.cos(lat*Math.PI/180))/Math.PI)/2*Math.pow(2,z)); }
  var TILE_SUBS=['a','b','c'];
  // A7-7 · Beyar kararı (pano `kc`, 2026-08-24, şık C): "şimdilik aynı sunucuda
  // kalınsın; ön-yükleme kapatılıp istek sayısı düşürülsün" — OSM'in topluluk
  // karo sunucusu ticari sitede sözleşmesiz tüketiliyordu, mekân başına bu
  // fonksiyon 9 EK karo isteği üretiyordu (ölçüldü). ÇAĞRI KALDIRILDI, fonksiyon
  // KASITLI ÖLÜ bırakıldı — üstteki yorum (pixelli-varış hikâyesi) hâlâ
  // fonksiyonun NEDEN var olduğunu anlatıyor; ölçüm istek sayısını düşürmeyi
  // istiyor, ısıtma tekniğinin kendisini yasaklamıyor. Görünen davranış
  // (flyTo'nun sinematik uçuşu) DEĞİŞMEDİ, yalnız ısıtma isteği gitmiyor.
  function preloadVenueTiles(lat,lng){
    var z=VENUE_ZOOM, xc=lon2tile(lng,z), yc=lat2tile(lat,z), i=0;
    for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++){
      var img=new Image(); img.src='https://'+TILE_SUBS[(i++)%3]+'.tile.openstreetmap.org/'+z+'/'+(xc+dx)+'/'+(yc+dy)+'.png';
    }
  }
  function flyToVenue(lat,lng){ map.stop(); map.flyTo([lat,lng],VENUE_ZOOM,{duration:.7,easeLinearity:.25}); }
  // FAZ 4: mobilde harita ALT yarısı sheet'le örtülü → bir noktaya uçarken merkezi sheet kadar AŞAĞI kaydır ki
  // nokta (konum/şehir) GÖRÜNÜR alanın (header↔sheet) ortasına gelsin (yoksa geometrik merkez sheet arkasında kalıyordu).
  function flyToVisible(lat,lng,zoom,opts){
    opts=opts||{duration:.7};
    if(typeof mqMobile!=='undefined' && mqMobile.matches && panel){
      var vh=window.innerHeight, peek=panel.classList.contains('sheet-peek');
      var sV=peek?PEEK_PX:(panel.classList.contains('sheet-full')?Math.round(0.86*vh):Math.round(0.52*vh));
      var dy=Math.round((sV-60)/2);   // görünür merkez = (header 60 ↔ sheetTop) ortası
      if(dy>10){ var pt=map.project([lat,lng],zoom); pt.y+=dy; map.flyTo(map.unproject(pt,zoom),zoom,opts); return; }
    }
    map.flyTo([lat,lng],zoom,opts);
  }
  var selectedVenues=[];           // "Güzergahımdaki mekanlar" — durak listesinden AYRI koleksiyon (mekan≠durak)
  var activeRouteId=null;          // (b) "Yükle"yince ziyaret bağlamı: yalnız yüklü KAYITLI rotada ziyaret-affordance açık; serbest planlamada null (karar 1+3 yapısal güvencesi)
  /* MEKÂN KİMLİĞİ — ad DEĞİL, veritabanı id'si.
     Mekânlar gerçek `venues` kayıtları olduğundan aynı adın birden fazla
     şubesi olabilir (parent_venue_id); ada göre eşleştirme iki farklı şubeyi
     tek mekân sanardı. Eski kayıtlarda (localStorage) id yok — o kayıtlar
     ada düşer, geriye dönük uyumlu. */
  function vid(m){ return (m&&m.id!=null) ? ('v'+m.id) : (m?m.ad:''); }
  function isVisited(m){ return !!(activeRouteId && visited[activeRouteId] && visited[activeRouteId][vid(m)]); }  // ziyaret HER ZAMAN rota id'sine göre (global ASLA — karar 2/3)
  var currentVenueList=[];         // koridor içi {m,off} (dash + pin + detay kaynağı)
  var detailVenue=null;            // açık detay kartının mekanı
  /* Kapak görseli artık GERÇEK mekân kapağıdır (media imzalı URL'i veya
     cover_external_url) ve tam adres olarak gelir. Eski Unsplash-id yolu,
     kayıtlı güzergâhlardaki geçmiş kayıtlar için korunur. */
  function imgUrl(id){
    if(!id) return '';
    return /^(https?:)?\/\//.test(id) ? id : 'https://images.unsplash.com/'+id+VIMG;
  }
  function isSel(m){return selectedVenues.some(function(v){return vid(v)===vid(m);});}
  // harita preview tooltip — sel state dahil; seçim değişince syncVenuePin yeniden bağlar (yeşil çerçeve)
  function venueTipHtml(m){
    var off=route.poly?distToRoute(m):null;
    var tier=(off!=null&&isFinite(off))?'<span class="yg-vtip-tier '+proxTier(off)+'">'+proxLabel(off)+'</span>':'';
    var spon=m.sponsor?'<span class="yg-vtip-spon"><i class="fa-solid fa-bullhorn"></i> Sponsorlu</span>':'';  // hover'da reklam disclosure (3 yüzey senkron)
    // KOMPAKT: sponsor → "Sponsorlu" pill meta SLOTUNU alır (tier YERİNE, fazladan satır DEĞİL) → balon dikeyde normal kartla aynı yükseklik.
    // Yakınlık (Yol üstü/yakın) sponsor için detay kartında görünür. Diğer mekanlar: tier korunur.
    return '<span class="yg-vtip-img" style="background-image:url(\''+imgUrl(m.img)+'\')"></span>'+
    '<span class="yg-vtip-b"><span class="yg-vtip-name">'+m.ad+'</span><span class="yg-vtip-loc">'+m.konum+'</span>'+(m.sponsor?spon:tier)+'</span>';}
  // === ÇAKIŞIK PİN HOVER FLICKER FIX ===
  // Kök neden: üst üste binen pinlerin hit-area'ları çakışıyor + Leaflet'in OTOMATIK tooltip hover handler'ı (mouseover→aç / mouseout→kapa)
  // iki pin arasında ping-pong yapıyor → balon titriyor. Çözüm: (1) riseOnHover kapalı (z-index zıplaması kesilir),
  // (2) Leaflet'in otomatik aç/kapa handler'ı kaldırılıp MANUEL kontrol: hover seti + kapanışta debounce (yapışkan) +
  // DETERMİNİSTİK tek-sahip (hoverSet'teki pinlerden venuePins sırasındaki İLK = sabit) → çakışıkta tek balon, titremez.
  // MANUEL hover kontrolü — çoklu-tooltip flicker fix (yoğun/çakışık pin kümesi; Playwright kanıtlı: 7-pin küme → aynı anda 4 balon):
  //  (a) COALESCE: art arda gelen mouseover fırtınası tek evalTip'e indirgenir (8ms) → çakışıkta birden fazla balon AÇILMAZ
  //  (b) SON-HOVER SAHİP (sticky last-owner): venuePins sıra-bağımlılığı yerine en son mouseover alan pin sahip → deterministik + kullanıcı niyeti + flip-flop kökten kesilir
  //  (c) TEK-TOOLTIP INVARIANT: sahip değişince eski + pick dışı TÜM balonlar kapatılır, sonra yeni açılır → aynı anda en fazla 1 tooltip (openCount<=1)
  var hoverSet=[], tipTimer=null, tipMk=null, mapAnimating=false, pendingMk=null, coalesceTimer=null;
  // TEK PAYLAŞILAN TOOLTIP: per-marker bindTooltip yerine map'e bağlı TEK tooltip nesnesi → yapısal olarak aynı anda
  // en fazla 1 balon DOM'da (orphan/çoklu-balon imkânsız). pick değişince içerik+konum+kimlik-class'ı güncellenir.
  var hoverTip=L.tooltip({direction:'top',offset:[0,-14],opacity:1,className:'yg-vtip'});
  function mDataOf(mk){ for(var i=0;i<venuePins.length;i++){ if(venuePins[i].mk===mk)return venuePins[i].m; } return null; }
  function showHoverTip(mk){
    var m=mDataOf(mk); if(!m){ hideHoverTip(); return; }
    hoverTip.setContent(venueTipHtml(m));
    hoverTip.setLatLng(mk.getLatLng());
    if(!map.hasLayer(hoverTip))hoverTip.addTo(map);
    var el=hoverTip.getElement();   // register kimliği: sponsor (slate spine) / sel (yeşil + ✓) — class toggle, base yg-vtip korunur
    if(el){ el.classList.toggle('sponsor',!!m.sponsor); el.classList.toggle('sel',isSel(m)); }
    // PİN SCALE/halka: tek-sahip is-hover (saf CSS :hover değil) → harita kayınca takılmaz
    for(var i=0;i<venuePins.length;i++){ var pe=venuePins[i].mk.getElement(); if(pe)pe.classList.toggle('is-hover',venuePins[i].mk===mk); }
  }
  function hideHoverTip(){ if(map&&map.hasLayer(hoverTip))map.removeLayer(hoverTip);
    for(var i=0;i<venuePins.length;i++){ var pe=venuePins[i].mk.getElement(); if(pe)pe.classList.remove('is-hover'); } }
  function pickHoverPin(){
    // SON-HOVER: en son mouseover alan pin hâlâ cursor altındaysa sahip = o (sıra-bağımsız, niyeti yansıtır)
    if(pendingMk){ var pe=pendingMk.getElement(); if(pe&&pe.matches(':hover')&&hoverSet.indexOf(pendingMk)>=0)return pendingMk; }
    // pendingMk ayrıldıysa mevcut sahip hâlâ hover'da ise KORU (sticky → titremez); değilse hoverSet'teki en yeni geçerli
    if(tipMk&&hoverSet.indexOf(tipMk)>=0){ var te=tipMk.getElement(); if(te&&te.matches(':hover'))return tipMk; }
    return hoverSet.length?hoverSet[hoverSet.length-1]:null;
  }
  var lastTipSwitch=0, TIP_SWITCH_CD=150;   // FLICKER FIX: sahip-geçiş histerezisi (yoğun çakışık kümede A↔B salınımını mekanizmadan bağımsız kes)
  function evalTip(){
    coalesceTimer=null;
    // STALE temizliği: çakışık pinde atlama hareketinde bazı pinlerin mouseout'u kaçabilir → hoverSet kalıntısını :hover ile süz.
    hoverSet=hoverSet.filter(function(mk){ var el=mk.getElement(); return el && el.matches(':hover'); });
    var pick=pickHoverPin();
    if(!pick){ if(tipMk){hideHoverTip();tipMk=null;} return; }   // küme tamamen terk → ANINDA kapat (cooldown'a tabi değil)
    if(tipMk!==pick){
      // HİSTEREZİS: son geçişten <CD ise sahibi KORU → çakışık pinde sahip flip-flop'u kesilir.
      // (Küme-içi pinler ~px komşu → tooltip neredeyse aynı yerde; algılanmaz "lag", titreme YOK.)
      var now=Date.now();
      if(tipMk && (now-lastTipSwitch)<TIP_SWITCH_CD) return;
      lastTipSwitch=now; tipMk=pick; showHoverTip(pick);   // tek tooltip taşınır+güncellenir → openCount yapısal <=1
    }
  }
  function tipOver(mk){ if(mapAnimating)return; clearTimeout(tipTimer); pendingMk=mk; if(hoverSet.indexOf(mk)<0)hoverSet.push(mk);
    if(coalesceTimer)clearTimeout(coalesceTimer); coalesceTimer=setTimeout(evalTip,8); }   // COALESCE: mouseover fırtınası → tek evalTip; pending close iptal (yapışkan)
  function tipOut(mk){ var i=hoverSet.indexOf(mk); if(i>=0)hoverSet.splice(i,1); if(mk===pendingMk)pendingMk=null; clearTimeout(tipTimer); tipTimer=setTimeout(evalTip,160); }   // kapanış debounce'lı
  function resetHoverTip(){ clearTimeout(tipTimer); if(coalesceTimer)clearTimeout(coalesceTimer); coalesceTimer=null; pendingMk=null; hoverSet=[]; hideHoverTip(); tipMk=null; }
  // GÜVENLİK AĞI: çakışık pinde atlama hareketinde marker mouseout'u kaçabilir → tooltip stale açık kalır.
  // Map mousemove'da cursor herhangi bir pin üstünde DEĞİLSE debounce'lı kapat (mouseout'a bağımlı değil).
  if(map)map.on('mousemove',function(e){
    if(!tipMk||mapAnimating)return;
    var t=e.originalEvent&&e.originalEvent.target;
    if(t&&t.closest&&t.closest('.yg-vpin'))return;            // hâlâ bir pin üstünde → açık kalsın
    clearTimeout(tipTimer); tipTimer=setTimeout(function(){ pendingMk=null; hoverSet=[]; hideHoverTip(); tipMk=null; },160);
  });
  // ANİMASYON SIRASINDA HOVER BASTIR (İş 2 kök neden): flyTo/zoom sırasında harita kayarken pinler SABİT mouse altından
  // geçip mouseover/mouseout fırtınası → tooltip flicker. Hareket/zoom başında balonu kapat + hover'ı kilitle, bitince serbest.
  if(map){
    map.on('movestart zoomstart',function(){ mapAnimating=true; clearTimeout(tipTimer); if(coalesceTimer)clearTimeout(coalesceTimer); coalesceTimer=null; pendingMk=null; hoverSet=[]; hideHoverTip(); tipMk=null; });
    map.on('moveend zoomend',function(){ mapAnimating=false; });
  }
  // Per-marker tooltip YOK (tek paylaşılan hoverTip kullanılıyor) → yalnız manuel hover handler bağla.
  // İçerik+kimlik-class showHoverTip'te pick anında üretilir → sel/sponsor her zaman güncel (rebind gerekmez).
  function bindVenueTooltip(mk,m){
    mk.off('mouseover'); mk.off('mouseout');
    mk.on('mouseover',function(){ tipOver(mk); });
    mk.on('mouseout',function(){ tipOut(mk); });
  }
  function clearVenuePins(){if(typeof resetHoverTip==='function')resetHoverTip(); venuePins.forEach(function(p){map.removeLayer(p.mk);});venuePins=[];}
  function venueIcon(m){var vis=isSel(m)&&isVisited(m);   // ziyaret sinyali yalnız güzergaha eklenmiş + yüklü rotada işaretli mekanda
    var spon=!!m.sponsor;                                 // SPONSOR (mock/demo) — slate pin + DADA logo mark (premium, marka-içi)
    var inner=vis?'<i class="fa-solid fa-check"></i>'
      :spon?'<span class="vp-logo" aria-hidden="true"></span>'
      :'<i class="fa-solid fa-location-dot"></i>';
    return L.divIcon({className:'yg-vpin'+(spon?' sponsor':'')+(isSel(m)?' sel':'')+(vis?' visited':''),
    html:'<span class="vp">'+inner+'</span>',
    iconSize:[30,30],iconAnchor:[15,15],popupAnchor:[0,-16]});}

  /* =====================================================================
     §7 HIZLI FİLTRELER — dokümandaki 15 kalem, tek durum, iki yüzey
     (sol panel şeridi + "Tüm Mekânlar" görünümü aynı state'i paylaşır).
     Şerit yatay kayar → mobilde sayfayı uzatmaz (§7 son cümle).
     "Şu An Açık" çalışma saati verisi ister; sağlayıcı/veritabanı bağlı
     değilken çip PASİF durur (§1: kapsam dışını aktifmiş gibi gösterme).
     Doküman "gelişmiş filtreler" için ayrı panel önerir ama kalemlerini
     saymaz — uydurulmadı, tanımlanınca eklenecek.
     ===================================================================== */
  /* Çip listesi SUNUCUDAN (route_quick_filters — admin yönetir). Her çip bir
     KURAL taşır: {kural, deger}. Eski sabit dizide kural örtüktü (ogun/dk/id
     karşılaştırmaları); artık açık ve veritabanında. Boot boşsa tek "Tümü"
     çipi kalır — uydurma çip basılmaz. */
  var FILTRELER=(ROUTE_CFG && BOOT.filtreler && BOOT.filtreler.length)
    ? BOOT.filtreler
    : [{id:'all', ad:'Tümü', kural:'all'}];
  function filtreTanim(id){ return FILTRELER.filter(function(f){return f.id===id;})[0]||FILTRELER[0]; }
  function filtreKullanilabilir(f){ return !f.gerekli || !!(ROUTE_CFG.provider.yetenek||{})[f.gerekli]; }
  function renderFilterBar(el){
    if(!el)return;
    el.innerHTML=FILTRELER.map(function(f){
      // Veri kaynağı bağlı olmayan filtre ETİKETSİZ-DISABLED kalır. Marka kuralı
      // (2026-07-27): "Yakında" ve HER TÜRLÜ bekleme ifadesi yasak — tooltip de
      // yazılmaz. Gerekçe demo şeridinde veri-durumu cümlesi olarak zaten var.
      var ok=filtreKullanilabilir(f);
      return '<button class="yg-fl-chip'+(f.id===allFilter?' is-active':'')+'" type="button" data-f="'+f.id+'"'+
        (ok?'':' disabled')+'>'+f.ad+'</button>';
    }).join('');
  }
  function renderFilterBars(){ renderFilterBar(quickEl); renderFilterBar(allChipsEl); }

  /* =====================================================================
     §16 MEKÂN SIRALAMA — ağırlıklı puan (ağırlıklar ROUTE_CFG'de)
     "Mekân yalnızca düz çizgide rotaya yakın olduğu için önerilmemelidir."
     Verisi olmayan bileşen NÖTR (0.5) alır — uydurma sinyal üretilmez;
     veri bağlanınca aynı formül gerçek değerle çalışır.
     ===================================================================== */
  function suankiOgun(){
    var h=new Date().getHours();
    if(h>=6&&h<11)return 'kahvalti';
    if(h>=11&&h<15)return 'ogle';
    if(h>=15&&h<17)return 'kahve';
    if(h>=17&&h<22)return 'aksam';
    return 'hizli';
  }
  /* §16 AĞIRLIKLI PUAN GERİ ALINDI (Karar 1, Beyar — 2026-08-07).
     `130819de` burada duran ölü/NaN ikinci formül kopyasını (ağırlıkları
     Türkçe anahtarla okuyup İngilizce `siralamaAgirliklari`yla hiç
     eşleşmediği, dolayısıyla her mekân için NaN üreten kopya) sunucunun
     gerçek `skor`una bağlamıştı. NaN karşılaştırıcı 0 sayıldığından eski hâl
     `.sort()`u fiilen no-op'a düşürüyordu ve vitrin YOLCULUK SIRASINDA
     kalıyordu; `130819de` bunu (istenmeden) PUAN sırasına çevirdi — Beyar bu
     davranış değişikliğini istemedi.
     Ölü/NaN formül YENİDEN YAZILMAZ. Vitrin de tam liste gibi §8 yolculuk
     sırasını kullanır — sıralama ölçütü aşağıda `renderDash` içinde tek
     satırda AÇIKÇA yazılı (`a.seq-b.seq`). */
  // filtre uygulanmış liste — kadran ve tam liste AYNI kümeyi VE AYNI sırayı gösterir (§8)
  function filteredList(){ return currentVenueList.filter(matchVenue); }

  // rota üstü mekânlar (koridor içi) — §16 ağırlıklı puana göre; harita pini + alt kadran kartı
  function spawnVenues(){
    clearVenuePins();
    if(!route.poly){ if(dashEl)dashEl.hidden=true; syncBottomOffset(); closeDetail(); renderSelected(); updateSheetCtx(); updateBrowseCta(); return; }
    // §8 — sonuçlar YOLCULUK SIRASINA göre (rota çizgisi üzerindeki ilerlemeye göre);
    // §16 ağırlıklı puan alt kadranın öneri vitrinini sıralar (renderDash).
    currentVenueList=ROAD_POOL.map(function(m){return {m:m,off:distToRoute(m),seq:rotaSirasi(m)};})
      .filter(function(x){return x.off<=corridor;})
      .sort(function(a,b){ return a.seq-b.seq; });
    currentVenueList.forEach(function(x){
      var m=x.m, off=x.off;
      var mk=L.marker([m.lat,m.lng],{icon:venueIcon(m),riseOnHover:false}).addTo(map);   // riseOnHover KAPALI: çakışık pinde z-index zıplaması flicker'a yol açıyordu (manuel tooltip + scale öne çıkarmayı zaten sağlıyor)
      bindVenueTooltip(mk,m);   // hover önizleme: foto + ad + konum (+ seçili ise yeşil çerçeve)
      mk.on('click',function(){ openDetail(m,off); });
      venuePins.push({mk:mk,m:m});
    });
    renderDash(filteredList());
    renderSelected();
    renderPlan();
    // detay açıksa: mekan hâlâ koridorda ise tag'i tazele, değilse kapat
    if(detailVenue){ var still=currentVenueList.filter(function(x){return vid(x.m)===vid(detailVenue);})[0];
      if(still)openDetail(still.m,still.off); else closeDetail(); }
    if(viewAllEl && !viewAllEl.hidden) renderAll();   // tam liste açıkken koridor/rota değişirse tazele
    updateSheetCtx(); updateBrowseCta();   // FAZ 4: peek chip (kalkış→varış·km·mekan) + browse CTA (N mekan) tazele
  }
  // ALT KADRAN = HIZLI VİTRİN: yalnız öncelikli ilk SHOWCASE (§16 ağırlıklı puan, sunucudan); tümü "Tümünü Gör"de
  var SHOWCASE=12;
  function renderDash(list){
    if(!dashEl||!dashScrollEl)return;
    if(!list.length){dashEl.hidden=true;syncBottomOffset();return;}
    dashEl.hidden=false;
    // FAZ 3: mobilde venue rayı yalnız BROWSE (sheet peek) modunda görünür → PLAN modunda (half/full) gizle
    if(typeof mqMobile!=='undefined' && mqMobile.matches && panel && !panel.classList.contains('sheet-peek')) applyDashCollapsed(true,false);
    // C: yüklü rotada başlık "öneri" olduğunu netleştirir (sol liste = senin mekanların)
    if(dashTitleTxtEl)dashTitleTxtEl.textContent = activeRouteId ? 'Bu rota için öneriler' : 'Yol üstü mekânlar';
    if(dashCountEl)dashCountEl.textContent=list.length;          // TOPLAM yol-üstü+yakın (vitrin değil)
    // SPONSOR (mock/demo) — koridorda 1 sponsor varsa vitrinin İLK slotuna sabitle; geri kalan yolculuk sırası.
    // data-i = list (currentVenueList) ORİJİNAL index → click→detay eşlemesi reorder'dan etkilenmez.
    // Karar 1 (2026-08-07, GERİ ALINDI — bkz. filteredList üstündeki not):
    // vitrin de §8 YOLCULUK SIRASINI kullanır. `list` zaten `seq` artan
    // sıralı geldiği için `rest` aynı sırayı miras alır; yine de ölçüt tek
    // satırda AÇIKÇA yazılır (filter/sort iç semantiği ileride değişirse
    // sessizce kırılmasın).
    // §25 "Organik öneriler ile ticari sonuçlar kesin biçimde ayrılmalıdır": sponsor
    // kartı sıralamaya GİRMEZ, ayrı ve etiketli olarak ilk slotta durur.
    var spon=list.filter(function(x){return x.m.sponsor;})[0];
    var rest=list.filter(function(x){return !x.m.sponsor;})
      .slice().sort(function(a,b){ return a.seq-b.seq; });
    var show=(spon?[spon]:[]).concat(rest.slice(0,SHOWCASE-(spon?1:0)));
    var html=show.map(function(x){
      var m=x.m, tier=proxTier(x.off), i=currentVenueList.indexOf(x), isSpon=!!m.sponsor;
      // K3 (kapanış turu) — sponsor↔editör AYNI köşe slotunu paylaşır (eski
      // sponsor↔dada dışlamasıyla BİREBİR, `m.dada`→`m.editor` rename A1'de
      // sunucuda yapıldı ama istemci güncellenmemişti). Kaynak: Gourmet mekân
      // kartı rozeti (mekan-liste/_card.blade.php `is_editor_pick`, fa-thumbs-up).
      var badge=isSpon
        ? '<span class="yd-badge spon"><i class="fa-solid fa-bullhorn"></i> Sponsorlu</span>'
        : (m.editor ? '<span class="yd-badge"><i class="fa-solid fa-thumbs-up"></i> Editör Önerisi</span>' : '');
      return '<button class="yg-dcard'+(isSpon?' sponsor':'')+(isSel(m)?' sel':'')+'" type="button" data-i="'+i+'">'+
        '<span class="yd-media" style="background-image:url(\''+imgUrl(m.img)+'\')">'+badge+'</span>'+
        '<span class="yd-body">'+
          '<span class="yd-name">'+m.ad+'</span>'+
          '<span class="yd-loc">'+m.konum+'</span>'+
          '<span class="yd-tag '+tier+'">'+proxLabel(x.off)+'</span>'+
          '<span class="yd-detour">'+sapmaMetni(x.off)+'</span>'+
          (isSpon?'<span class="yd-cta">'+(m.sponsorCta||'Menüyü Gör')+' <i class="fa-solid fa-arrow-right"></i></span>':'')+
        '</span></button>';
    }).join('');
    if(list.length>SHOWCASE){
      html+='<button class="yg-dmore" type="button"><i class="fa-solid fa-layer-group"></i> Tümünü Gör<span>+'+(list.length-SHOWCASE)+' mekân daha</span></button>';
    }
    dashScrollEl.innerHTML=html;
    if(detailVenue)setActiveCards(detailVenue.ad);   // A2: yeniden render'da aktif kart vurgusunu koru
    syncBottomOffset();
  }
  if(dashScrollEl)dashScrollEl.addEventListener('click',function(e){
    if(e.target.closest('.yg-dmore')){ openAllView(); return; }
    var c=e.target.closest('.yg-dcard'); if(!c)return;
    var x=currentVenueList[+c.getAttribute('data-i')]; if(!x)return;
    flyToVenue(x.m.lat,x.m.lng);
    openDetail(x.m,x.off);
  });
  if(corrSlider)corrSlider.addEventListener('input',function(){
    ozelKm=+corrSlider.value; refreshThreshold(); spawnVenues();
    track('detour_tolerance_changed',{tolerans:'ozel',km:ozelKm});
  });
  // §6 tolerans şeridi — dakika seçenekleri (ve "Özel Mesafe Seç" → km slider)
  if(tolChipsEl)tolChipsEl.addEventListener('click',function(e){
    var c=e.target.closest('.yg-tol-chip'); if(!c)return;
    tolId=c.getAttribute('data-tol');
    refreshThreshold(); spawnVenues();
    var t=tolTanim();
    track('detour_tolerance_changed',{tolerans:t.id,dakika:t.dk,km:Math.round(aktifKoridorKm()*10)/10});
  });

  // ---- B1: alt kadran AÇ-KAPAT (bottom-sheet tutamak) — durum localStorage'da kalıcı; B2 full-view gizlemesinden bağımsız ----
  var dashHandleEl=document.getElementById('ygDashHandle');
  var dashHandleIco=document.getElementById('ygDashHandleIco');
  var DASH_KEY='dada_yg_v2_dashcollapsed';
  var coordLock=false;   // FAZ 3: sheet↔dash karşılıklı dışlama re-entry guard
  function applyDashCollapsed(c,save){
    if(!dashEl)return;
    dashEl.classList.toggle('collapsed',c);
    if(dashHandleEl){ dashHandleEl.setAttribute('aria-expanded',c?'false':'true');
      dashHandleEl.setAttribute('aria-label',c?'Mekân panelini göster':'Mekân panelini gizle'); }
    if(dashHandleIco)dashHandleIco.className='fa-solid '+(c?'fa-chevron-up':'fa-chevron-down');   // çift-ok yön: kapalı=yukarı(aç) / açık=aşağı(kapat)
    if(save)lsSet(DASH_KEY,c);
    // FAZ 3: dash AÇILIRSA (c=false) mobilde browse moduna geç → sheet'i peek'e indir (karşılıklı dışlama)
    if(typeof mqMobile!=='undefined' && mqMobile.matches && !coordLock && c===false){
      coordLock=true; applySheetDetent('peek',true); coordLock=false;
    }
    syncBottomOffset();   // kapalıyken kadran gizli → FAB/prompt/toast tabana iner
  }
  var dashCollapsed=!!lsGet(DASH_KEY,false);
  applyDashCollapsed(dashCollapsed,false);
  // AUTO-EXPAND: yalnız ANLAMLI rota/güzergah değişiminde (yeni hesaplama/yön/alternatif/yükleme) çağrılır → kapalıysa yumuşak aç + state güncelle.
  // Eşik (corridor) slider'ında ÇAĞRILMAZ (mikro-ayar → zorla açma agresif olur). State tutarlı (lsSet).
  function ensureDashExpanded(){ if(dashCollapsed){ dashCollapsed=false; applyDashCollapsed(false,true); } }
  if(dashHandleEl)dashHandleEl.addEventListener('click',function(){ dashCollapsed=!dashCollapsed; applyDashCollapsed(dashCollapsed,true); });

  // ---- FAZ 2: MOBİL BOTTOM-SHEET DETENT (grip tap-cycle: peek→half→full→peek). matchMedia guard → davranış yalnız mobil. ----
  var sheetGripEl=document.querySelector('.yg-sheet-grip');
  var sheetCtxEl=document.getElementById('ygSheetCtx'),
      sheetCtxMainEl=document.getElementById('ygSheetCtxMain'),
      sheetCtxSubEl=document.getElementById('ygSheetCtxSub'),
      browseCtaEl=document.getElementById('ygBrowseCta'),
      browseCntEl=document.getElementById('ygBrowseCnt');
  var SHEET_KEY='dada_yg_v2_sheetdetent';
  var mqMobile=window.matchMedia('(max-width:860px)');
  var DETENTS=['peek','half','full'];
  var PEEK_PX=84;   // peek görünür yükseklik (grip + özet chip) — CSS .sheet-peek ile EŞ
  var sheetDetent=(function(){ var s=lsGet(SHEET_KEY,'half'); return DETENTS.indexOf(s)>=0?s:'half'; })();
  // PEEK özet chip metni — rota varsa kalkış→varış·km·mekan, yoksa "Rotanı çiz" prompt
  function sheetCtxText(){
    var f=(typeof filled==='function')?filled():[];
    if(route && route.poly && f.length>=2){
      var km=(kmEl?(''+kmEl.textContent).trim():''), n=currentVenueList?currentVenueList.length:0;
      return {main:f[0].ad+' → '+f[f.length-1].ad, sub:(km && km!=='—' && km!=='…'?km+' km · ':'')+n+' mekân'};
    }
    return {main:'Rotanı çiz', sub:'Kalkış ve varış şehrini seç'};
  }
  function updateSheetCtx(){ if(!sheetCtxMainEl)return; var t=sheetCtxText(); sheetCtxMainEl.textContent=t.main; if(sheetCtxSubEl)sheetCtxSubEl.textContent=t.sub; }
  // BROWSE keşif CTA — half/full'da rota+mekan varsa "N yol üstü mekan · Haritada gör" göster (peek'te ray zaten görünür)
  function updateBrowseCta(){
    if(!browseCtaEl)return;
    var show=mqMobile.matches && route && route.poly && currentVenueList && currentVenueList.length>0 && sheetDetent!=='peek';
    browseCtaEl.hidden=!show;
    if(show && browseCntEl)browseCntEl.textContent=currentVenueList.length;
  }
  function applySheetDetent(d,save){
    if(!panel)return;
    if(DETENTS.indexOf(d)<0)d='half';
    sheetDetent=d;
    panel.classList.remove('sheet-peek','sheet-half','sheet-full');
    panel.classList.add('sheet-'+d);
    if(sheetGripEl){
      sheetGripEl.setAttribute('aria-label', d==='full'?'Paneli küçült':(d==='peek'?'Paneli aç':'Paneli genişlet'));
      sheetGripEl.setAttribute('aria-expanded', d==='peek'?'false':'true');
    }
    if(save)lsSet(SHEET_KEY,d);
    // FAZ 3: karşılıklı dışlama — half/full = PLAN (venue rayı gizli) · peek = BROWSE (ray kullanıcı tercihine göre).
    if(mqMobile.matches && !coordLock){
      coordLock=true;
      if(d==='peek'){ if(dashEl && !dashEl.hidden) applyDashCollapsed(dashCollapsed,false); }   // rayı tercihe göre geri getir
      else { applyDashCollapsed(true,false); }                                                    // plan → rayı gizle (pref'i BOZMA)
      coordLock=false;
    }
    updateSheetCtx(); updateBrowseCta();
    if(typeof syncViewToggle==='function')syncViewToggle();   // §8 Harita/Liste segmenti detent'i izler
    syncBottomOffset();   // görünür alt-yığın (sheet detent + ray) değişti → FAB/prompt/toast/detay re-sync
  }
  // grip TAP = peek↔half toggle (basınca iner/biner) · DRAG = serbest detent snap (peek/half/full) → çentik affordance'ı davranışla eşler.
  function cycleSheetDetent(){ applySheetDetent(sheetDetent==='peek'?'half':'peek', true); }
  /* §8 mobil — "Alt sabit butonlar: Haritayı Gör / Listeyi Gör".
     Harita = sheet peek'e iner (harita + mekân rayı görünür),
     Liste  = sheet half'a çıkar (planlama + liste görünür). */
  var viewToggleEl=document.getElementById('ygViewToggle');
  function syncViewToggle(){
    if(!viewToggleEl)return;
    var harita=(sheetDetent==='peek');
    viewToggleEl.querySelectorAll('button').forEach(function(b){
      b.classList.toggle('is-active', (b.getAttribute('data-v')==='map')===harita);
      b.setAttribute('aria-pressed', ((b.getAttribute('data-v')==='map')===harita)?'true':'false');
    });
  }
  if(viewToggleEl)viewToggleEl.addEventListener('click',function(e){
    var b=e.target.closest('button[data-v]'); if(!b)return;
    applySheetDetent(b.getAttribute('data-v')==='map'?'peek':'half', true);
    syncViewToggle();
  });
  function detentT(d){ var vh=window.innerHeight; return d==='full'?0:(d==='half'?Math.round(0.34*vh):Math.round(0.86*vh-PEEK_PX)); }
  var dragging=false,dragStartY=0,dragBaseT=0,dragCurT=0,dragMoved=0;
  function gripDown(e){
    if(!mqMobile.matches||!panel)return;
    dragging=true; dragMoved=0;
    dragStartY=(e.touches?e.touches[0].clientY:e.clientY);
    dragBaseT=detentT(sheetDetent); dragCurT=dragBaseT;
    panel.classList.add('sheet-dragging');
    if(e.pointerId!=null && sheetGripEl.setPointerCapture){ try{sheetGripEl.setPointerCapture(e.pointerId);}catch(_){ } }
  }
  function gripMove(e){
    if(!dragging)return;
    var y=(e.touches?e.touches[0].clientY:e.clientY), dy=y-dragStartY;
    dragMoved=Math.max(dragMoved,Math.abs(dy));
    var vh=window.innerHeight, maxT=Math.round(0.86*vh-PEEK_PX);
    dragCurT=Math.max(0,Math.min(maxT,dragBaseT+dy));
    panel.style.transform='translateY('+dragCurT+'px)';
    if(e.cancelable)e.preventDefault();
  }
  function gripUp(){
    if(!dragging)return; dragging=false;
    panel.classList.remove('sheet-dragging');
    if(dragMoved<6){ panel.style.transform=''; cycleSheetDetent(); return; }   // küçük hareket = TAP
    var cands=[['full',detentT('full')],['half',detentT('half')],['peek',detentT('peek')]];
    cands.sort(function(a,b){return Math.abs(a[1]-dragCurT)-Math.abs(b[1]-dragCurT);});
    var target=cands[0][0];
    requestAnimationFrame(function(){ if(panel)panel.style.transform=''; });   // inline temizle → class transform (.34s) devralır
    applySheetDetent(target,true);
  }
  function syncSheetForViewport(){
    if(!panel)return;
    if(mqMobile.matches){ applySheetDetent(sheetDetent,false); }
    else { panel.classList.remove('sheet-peek','sheet-half','sheet-full'); panel.style.transform=''; }   // desktop → sol dock
    updateSheetCtx(); updateBrowseCta();
  }
  if(sheetGripEl){
    sheetGripEl.setAttribute('role','button');
    sheetGripEl.setAttribute('tabindex','0');
    sheetGripEl.removeAttribute('aria-hidden');
    sheetGripEl.addEventListener('pointerdown',gripDown);
    window.addEventListener('pointermove',gripMove,{passive:false});
    window.addEventListener('pointerup',gripUp);
    window.addEventListener('pointercancel',gripUp);
    sheetGripEl.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); cycleSheetDetent(); } });
  }
  if(sheetCtxEl)sheetCtxEl.addEventListener('click',function(){ applySheetDetent('half',true); });    // peek chip → genişle (düzenle)
  if(browseCtaEl)browseCtaEl.addEventListener('click',function(){ applySheetDetent('peek',true); });   // CTA → browse (harita + ray)
  syncSheetForViewport();
  if(mqMobile.addEventListener)mqMobile.addEventListener('change',syncSheetForViewport);
  else if(mqMobile.addListener)mqMobile.addListener(syncSheetForViewport);   // eski Safari fallback

  // ---- K1: mekan detay kartı (tıkla → harita uçar + kart) ----
  function tierLabel(off){return proxTier(off)==='on'?'Yol üstü':'Yola yakın';}
  // yakınlık etiketi metni — TÜM yüzeylerde tutarlı (kadran/detay/tam liste):
  //   ~0 (<0.5km) → "Tam yol üstü" (mesafesiz; "0 km" garipliği gider) · <1km → metre · ≥1km → km
  function proxLabel(off){
    if(off<0.5)return 'Tam yol üstü';
    var dist = off<1 ? (Math.round(off*1000/10)*10)+' m' : Math.round(off)+' km';
    return tierLabel(off)+' · '+dist;
  }
  /* §6 — "Mekân kartlarında hem ek süreyi hem mesafeyi göster."
     Örnek biçim dokümandan: "Rotadan 4,2 km · Yolculuğa yaklaşık 8 dakika ekler".
     "yaklaşık" ibaresi bilinçli: süre gerçek yol ağı matrisi bağlanana kadar
     tahmindir (§6 şerhi, demo şeridinde de yazılı). */
  function sapmaMetni(off){
    var dk=sapmaDk(off);
    var km=off<1 ? (Math.round(off*1000/10)*10)+' m' : (Math.round(off*10)/10).toString().replace('.',',')+' km';
    if(dk<=0)return 'Rotadan '+km+' · yolculuğa süre eklemez';
    return 'Rotadan '+km+' · yolculuğa yaklaşık '+dk+' dakika ekler';
  }
  function openDetail(m,off){
    hideGeoPrompt();              // mekan detayına geçince en-yakın-şehir promptunu kapat (mobil çakışma + temiz odak)
    detailVenue=m;
    detailMediaEl.style.backgroundImage="url('"+imgUrl(m.img)+"')";
    // SPONSOR disclosure (mock/demo) — slate/cream + megafon. A1 sonrası bu
    // rozet slotunun ticari sakini sponsorluktur; "Dada öneriyor" dalı
    // bayrakla birlikte kalktı. K3 (kapanış turu) — editör seçkisi AYNI
    // slotu sponsorsuz mekânlarda devralır (`m.dada`→`m.editor` rename A1'de
    // sunucuda yapıldı, istemci güncellenmemişti). Kaynak: Gourmet mekân
    // detayı rozeti (mekan-detay/_gallery.blade.php `is_editor_pick`,
    // `.tbadge.t-dada`, fa-award — aynı tomato register burada `.yg-detail-badge`).
    var isSpon=!!m.sponsor;
    detailEl.classList.toggle('is-sponsor',isSpon);
    if(isSpon){
      detailBadgeEl.className='yg-detail-badge spon';
      detailBadgeEl.innerHTML='<i class="fa-solid fa-bullhorn"></i> Sponsorlu';
      detailBadgeEl.hidden=false;
    }else if(m.editor){
      detailBadgeEl.className='yg-detail-badge';
      detailBadgeEl.innerHTML='<i class="fa-solid fa-award"></i> Editör Önerisi';
      detailBadgeEl.hidden=false;
    }else{
      detailBadgeEl.className='yg-detail-badge';
      detailBadgeEl.innerHTML='';
      detailBadgeEl.hidden=true;
    }
    // ikincil link: sponsorda ticari CTA "Menüyü Gör" (sponsorCta) → primary "Güzergâha Ekle" korunur (iki-domates karışıklığı YOK)
    if(detailMoreTxtEl)detailMoreTxtEl.textContent=isSpon?(m.sponsorCta||'Menüyü Gör'):'Mekânı İncele';
    if(detailMoreIcoEl)detailMoreIcoEl.className=isSpon?'fa-solid fa-utensils':'fa-solid fa-arrow-up-right-from-square';
    // Mekân detay sayfası GERÇEK adrestir (gourmet.venues.show). Adres yoksa
    // (Gourmet bayrağı kapalı) blade'in yedeği kalır — ölü link üretilmez.
    if(detailMoreEl&&m.url)detailMoreEl.setAttribute('href',m.url);
    detailNameEl.textContent=m.ad;
    detailLocEl.textContent=m.konum;
    var tier=proxTier(off);
    detailTagEl.className='yg-detail-tag '+tier;
    detailTagEl.textContent=proxLabel(off);
    // K3 kararı (kapanış turu, Karar 3) — yıldızın TEK kapısı `m.dada`ydı; A1
    // ile bayrak öldüğü için yıldız hiçbir mekânda basılmıyordu. Kapı artık
    // `puan` alanının kendisi (editör seçkisiyle eşleşme ŞARTI DEĞİL):
    // rating_count=0 mekân zaten `puan:null` gönderir (RouteVenuePresenter
    // §27 "0,0 sahte sinyal" yasağı) — o yüzden puanı olan HER mekânda basılır.
    detailStarEl.hidden=(m.puan==null);
    if(m.puan!=null && detailStarValEl)detailStarValEl.textContent=m.puan.toFixed(1);
    // §9 sapma bilgisi + §15 veri güvenilirliği satırı
    if(detailDetourEl)detailDetourEl.textContent=sapmaMetni(off);
    if(detailVerifyEl){
      // §15 "Gerçek veri bulunmadığı hâlde sahte doğrulama tarihi üretme."
      if(m.sonDogrulama){
        detailVerifyEl.className='yg-detail-verify ok';
        detailVerifyEl.innerHTML='<i class="fa-solid fa-circle-check"></i> Bilgiler '+fmtDate(m.sonDogrulama)+
          ' tarihinde doğrulandı. Gitmeden önce işletmeyle iletişime geçmenizi öneririz.';
      } else {
        detailVerifyEl.className='yg-detail-verify warn';
        detailVerifyEl.innerHTML='<i class="fa-regular fa-circle-question"></i> Bu mekânın çalışma saatleri yakın zamanda doğrulanmadı. '+
          'Gitmeden önce işletmeyle iletişime geçmeni öneririz.';
      }
    }
    updateDetailBtn(m);
    updateVisitBtn(m);
    updateSaveVenueBtn(m);
    detailEl.hidden=false;
    track('place_card_viewed',{mekan:m.cat||null,sponsor:!!m.sponsor});
    setActiveCards(vid(m));      // A2: bu mekanın kartını (slider + tam liste) aktif işaretle
    setActivePin(vid(m));        // çift yönlü: haritadaki pini de aktif/seçili işaretle (3 yüzey senkron)
    // FAZ 4: mobilde mekana dokununca sheet'i peek'e indir → detay kartı harita üstünde net dursun (planlama sheet'i arkasında kopuk kalmasın)
    if(typeof mqMobile!=='undefined' && mqMobile.matches && sheetDetent!=='peek') applySheetDetent('peek',true);
  }
  function closeDetail(){ detailVenue=null; if(detailEl)detailEl.hidden=true; clearActiveCards(); clearActivePin(); }  // balon kapanınca 3 yüzeyde de aktiflik kalkar
  function updateDetailBtn(m){
    var added=isSel(m);
    detailAddEl.classList.toggle('is-added',added);
    detailAddTxtEl.textContent=added?'Eklendi':'Güzergâha Ekle';
    var ic=detailAddEl.querySelector('i'); if(ic)ic.className=added?'fa-solid fa-check':'fa-solid fa-plus';
  }
  // ZİYARET TOGGLE durumu — yalnız yüklü KAYITLI rota + güzergaha eklenmiş mekanda görünür (karar 1 gate)
  function updateVisitBtn(m){
    if(!detailVisitEl)return;
    var canVisit=!!activeRouteId && isSel(m);
    detailVisitEl.hidden=!canVisit;
    if(!canVisit)return;
    var v=isVisited(m);
    detailVisitEl.classList.toggle('is-visited',v);
    if(detailVisitTxtEl)detailVisitTxtEl.textContent=v?'Ziyaret edildi':'Ziyaret ettim';
    var ic=detailVisitEl.querySelector('i'); if(ic)ic.className=v?'fa-solid fa-circle-check':'fa-regular fa-circle-check';
  }
  /* §9 İKİNCİL AKSİYONLAR — Kaydet · Paylaş · Ziyaret Ettim · Hata Bildir.
     "Kaydet" kullanıcının mekân koleksiyonu (Gourmet hesabındaki kaydedilenler);
     misafirde giriş sayfasına götürür — rota keşfini engellemez (§11). */
  var KEY_VFAV='dada_yg_v2_venuefav';
  var venueFav=lsGet(KEY_VFAV,{}); if(!venueFav||typeof venueFav!=='object')venueFav={};
  function isVenueFav(m){ return !!venueFav[vid(m)]; }
  function updateSaveVenueBtn(m){
    if(!detailSaveEl)return;
    var on=isVenueFav(m);
    detailSaveEl.classList.toggle('is-on',on);
    detailSaveEl.setAttribute('aria-pressed',on?'true':'false');
    var ic=detailSaveEl.querySelector('i'); if(ic)ic.className=(on?'fa-solid':'fa-regular')+' fa-bookmark';
  }
  /* Mekân aksiyon adresi — `{slug}` yer tutucusunu doldurur. Uç yoksa null. */
  function mekanUrl(tpl,m){ return (tpl&&m&&m.slug) ? tpl.replace('__SLUG__',encodeURIComponent(m.slug)) : null; }

  if(detailSaveEl)detailSaveEl.addEventListener('click',function(){
    if(!detailVenue)return;
    if(!girisYapildi){ acKaydetKapisi(); return; }
    var m=detailVenue, url=mekanUrl(ROUTE_CFG.uclar.mekanKaydet,m);
    // İYİMSER GÜNCELLEME: buton anında döner, sunucu reddederse geri alınır.
    if(venueFav[vid(m)])delete venueFav[vid(m)]; else venueFav[vid(m)]=true;
    lsSet(KEY_VFAV,venueFav); updateSaveVenueBtn(m);
    geoToast(isVenueFav(m)?'Mekân kaydedildi':'Kayıt kaldırıldı','fa-bookmark');
    if(!url)return;   // Gourmet bayrağı kapalı → yalnız yerel işaret
    apiFetch(url,{method:'POST'}).then(function(j){
      // Sunucunun gerçek durumu esastır (başka sekmede değişmiş olabilir).
      if(j&&typeof j.active==='boolean'){
        if(j.active)venueFav[vid(m)]=true; else delete venueFav[vid(m)];
        lsSet(KEY_VFAV,venueFav);
        if(detailVenue&&vid(detailVenue)===vid(m))updateSaveVenueBtn(m);
      }
    }).catch(function(){
      if(venueFav[vid(m)])delete venueFav[vid(m)]; else venueFav[vid(m)]=true;
      lsSet(KEY_VFAV,venueFav);
      if(detailVenue&&vid(detailVenue)===vid(m))updateSaveVenueBtn(m);
      geoToast('Mekân kaydedilemedi. Lütfen tekrar dene.','fa-triangle-exclamation');
    });
  });
  if(detailShareEl)detailShareEl.addEventListener('click',function(){
    if(!detailVenue)return;
    var m=detailVenue, metin=m.ad+' — '+m.konum, url=location.origin+location.pathname;
    track('route_shared',{kaynak:'mekân'});
    if(navigator.share){ navigator.share({title:m.ad,text:metin,url:url}).catch(function(){}); return; }
    if(navigator.clipboard){ navigator.clipboard.writeText(metin+' — '+url).then(function(){ geoToast('Mekân bağlantısı kopyalandı','fa-circle-check'); },function(){}); return; }
    geoToast('Bağlantı: '+url,'fa-link');
  });
  /* §1 + §15 "Yanlış mekân bilgisi bildirme" — bildirim kalemleri dokümandaki
     doğrulama başlıklarından: konum, çalışma saati, kapanmış işletme, diğer. */
  var reportEl=document.getElementById('ygReport'), reportNameEl=document.getElementById('ygReportName');
  function acHataBildir(){
    if(!reportEl||!detailVenue)return;
    if(reportNameEl)reportNameEl.textContent=detailVenue.ad;
    reportEl.hidden=false;
  }
  if(detailReportEl)detailReportEl.addEventListener('click',acHataBildir);
  if(reportEl)reportEl.addEventListener('click',function(e){
    if(e.target===reportEl||e.target.closest('[data-rep="kapat"]')){ reportEl.hidden=true; return; }
    var b=e.target.closest('[data-rep-tip]'); if(!b)return;
    var tip=b.getAttribute('data-rep-tip'), m=detailVenue;
    track('place_error_reported',{tip:tip,mekan:m?m.cat:null});
    reportEl.hidden=true;
    var url=mekanUrl(ROUTE_CFG.uclar.mekanHata,m);
    if(!url||!girisYapildi){
      // Uç yok ya da misafir: bildirim kaydedilemez. Kaydedilmiş gibi
      // GÖSTERİLMEZ — §27, sahte onay yasak.
      geoToast(girisYapildi?'Bildirim şu an alınamıyor.':'Bildirim için giriş yapman gerekiyor.','fa-circle-info');
      return;
    }
    apiFetch(url,{method:'POST',body:JSON.stringify({topic:tip,message:(b.textContent||tip).trim()})})
      .then(function(){ geoToast('Bildirimin alındı — teşekkürler','fa-circle-check'); })
      .catch(function(){ geoToast('Bildirim gönderilemedi. Lütfen tekrar dene.','fa-triangle-exclamation'); });
  });

  function toggleVisited(m){
    if(!activeRouteId||!isSel(m))return;                 // güvence: yalnız yüklü rotadaki eklenmiş mekan; ziyaret HER ZAMAN id'ye göre
    visited[activeRouteId]=visited[activeRouteId]||{};
    if(visited[activeRouteId][vid(m)])delete visited[activeRouteId][vid(m)];
    else visited[activeRouteId][vid(m)]=true;
    lsSet(KEY_VIS,visited);
    track('place_marked_visited',{isaretli:!!visited[activeRouteId][vid(m)]});
    syncVenuePin(m);                                     // karar 4 harita yarısı: pin yeşil/soluk ✓
    if(detailVenue&&vid(detailVenue)===vid(m))updateVisitBtn(m);
    renderSelected();                                    // karar 4 liste yarısı: sol liste üstü-çizik
    renderSaved();                                       // karar 5: saved sekme ilerleme/checklist AYNI visited[id]'den tazelenir
  }
  if(detailCloseEl)detailCloseEl.addEventListener('click',closeDetail);
  if(detailAddEl)detailAddEl.addEventListener('click',function(){ if(detailVenue)toggleSelected(detailVenue); });
  if(detailVisitEl)detailVisitEl.addEventListener('click',function(){ if(detailVenue)toggleVisited(detailVenue); });

  // ---- K2: "Güzergâha Ekle" toggle + pin/kart senkron (durağa EKLEMEZ) ----
  // A2: AKTİF KART vurgusu — son tıklanan/balonu açık mekan. Tek seferde bir kart aktif (önceki temizlenir);
  // slider (.yg-dcard) + tam liste (.yg-fl-card) TUTARLI. data-i = currentVenueList index (her iki render aynı şema).
  function clearActiveCards(){
    if(dashScrollEl)dashScrollEl.querySelectorAll('.yg-dcard.is-active').forEach(function(el){el.classList.remove('is-active');});
    if(allListEl)allListEl.querySelectorAll('.yg-fl-card.is-active').forEach(function(el){el.classList.remove('is-active');});
  }
  function setActiveCards(ad){
    clearActiveCards();
    var idx=currentVenueList.map(function(x){return vid(x.m);}).indexOf(ad); if(idx<0)return;
    if(dashScrollEl){var d=dashScrollEl.querySelector('.yg-dcard[data-i="'+idx+'"]'); if(d)d.classList.add('is-active');}
    if(allListEl){var f=allListEl.querySelector('.yg-fl-card[data-i="'+idx+'"]'); if(f)f.classList.add('is-active');}
  }
  // çift yönlü senkron: aktif PİN — kart/liste tıkla→pin seçili, pin tıkla→kart/liste seçili (hepsi openDetail huni'sinden).
  var activePinAd=null;
  function clearActivePin(){
    venuePins.forEach(function(p){var el=p.mk.getElement(); if(el)el.classList.remove('is-active');});
    activePinAd=null;
  }
  function setActivePin(ad){
    clearActivePin();
    var e=venuePins.filter(function(p){return vid(p.m)===ad;})[0]; if(!e)return;
    var el=e.mk.getElement(); if(el)el.classList.add('is-active');
    activePinAd=ad;
  }
  function syncVenuePin(m){ var e=venuePins.filter(function(p){return vid(p.m)===vid(m);})[0]; if(e){ e.mk.setIcon(venueIcon(m)); bindVenueTooltip(e.mk,m);
    if(activePinAd===m.ad){ var el=e.mk.getElement(); if(el)el.classList.add('is-active'); } } }   // setIcon yeni DOM yaratır → aktif pin vurgusunu geri uygula
  function syncVenueCard(m){
    var idx=currentVenueList.map(function(x){return vid(x.m);}).indexOf(vid(m));
    if(idx<0||!dashScrollEl)return;
    var card=dashScrollEl.querySelector('.yg-dcard[data-i="'+idx+'"]');
    if(card)card.classList.toggle('sel',isSel(m));
  }
  /* §3 — "Mekân kartına 'Bu Mekânı Durak Yap' aksiyonu eklenmelidir."
     Mekânı gastronomi seçkisinden ROTA DURAĞINA yükseltir: rota yeniden
     hesaplanır, mekân artık güzergâhın kendi noktasıdır. Ara durak sınırı
     (§3, en fazla 3) burada da geçerlidir. */
  function mekaniDurakYap(m){
    if(!durakEklenebilir()){
      geoToast('Bu rotaya en fazla '+ROUTE_CFG.maxAraDurak+' durak ekleyebilirsin. Yeni bir durak eklemek için mevcut duraklardan birini kaldır.','fa-circle-info');
      return;
    }
    if(stops.some(function(s){return s&&s.ad===m.ad;}))return;   // durak listesi ad eksenli (yer + mekân karışık)
    // yolculuk sırasına göre doğru araya yerleştir (uçlar korunur)
    var seq=rotaSirasi(m), at=stops.length-1;
    for(var i=1;i<stops.length-1;i++){ if(stops[i]&&rotaSirasi(stops[i])>seq){ at=i; break; } }
    stops.splice(at,0,{ad:m.ad,lat:m.lat,lng:m.lng,molaDk:ROUTE_CFG.varsayilanMolaDk});
    // durak olduysa gastronomi seçkisinden çıkar (mükerrer sayım olmasın)
    var si=selectedVenues.map(function(v){return vid(v);}).indexOf(vid(m));
    if(si>=0)selectedVenues.splice(si,1);
    closeDetail();
    renderStops(); placeStopMarkers(); maybeBuild();
    geoToast('“'+m.ad+'” durak olarak eklendi','fa-map-pin');
    track('place_added_to_route',{tip:'durak'});
  }
  var detailStopEl=document.getElementById('ygDetailStop');
  if(detailStopEl)detailStopEl.addEventListener('click',function(){ if(detailVenue)mekaniDurakYap(detailVenue); });

  function toggleSelected(m){
    var i=selectedVenues.map(function(v){return vid(v);}).indexOf(vid(m));
    if(i>=0){
      selectedVenues.splice(i,1);
      track('place_removed_from_route',{mekan:m.cat||null});
    } else {
      // §10 — plan varsayılan olarak YOLCULUK SIRASINDA kurulur; kullanıcı sonra değiştirebilir
      var seq=rotaSirasi(m);
      var at=selectedVenues.findIndex(function(v){ return rotaSirasi(v)>seq; });
      if(at<0)selectedVenues.push(m); else selectedVenues.splice(at,0,m);
      track('place_added_to_route',{mekan:m.cat||null,sapmaDk:sapmaDk(distToRoute(m))});
    }
    syncVenuePin(m); syncVenueCard(m); syncFlCard(m);
    if(detailVenue&&vid(detailVenue)===vid(m)){ updateDetailBtn(m); updateVisitBtn(m); }   // güzergâha ekleyince ziyaret-affordance belirir/kaybolur
    renderSelected(); renderPlan(); updateSummary();
  }

  /* =====================================================================
     §10 GÜZERGÂH PLANIM
     Seçilen gastronomi duraklarının sıralı planı. Her durakta: sıra no ·
     mekân adı · il/ilçe · rotadan sapma · yolculuğa eklenen süre · tahmini
     varış saati · o saatte açık/kapalı · önerilen mola · sırala · çıkar.
     Alt özet: normal süre · duraklarla birlikte · eklenen süre · eklenen mesafe.
     Ana aksiyonlar: Kaydet · Paylaş · Harita Uygulamasında Aç.

     ŞERH: "tahmini açık/kapalı" çalışma saati verisi ister; veri bağlı
     olmadığı için satır §13'ün "doğrulanmadı" durumunu gösterir — tahmin
     ÜRETİLMEZ (§15: sahte doğrulama üretme).
     ===================================================================== */
  function planVarisDk(idx){
    // idx'inci durağa kadar: temel sürenin rota üzerindeki ilerleme oranı + önceki sapmalar/molalar
    var r=currentRoutes[activeIdx]||{}; if(r.dakika==null||!route.poly)return null;
    var toplamSeg=Math.max(1,route.poly.length-1), birikim=0;
    for(var k=0;k<idx;k++){
      var pv=selectedVenues[k];
      birikim+=sapmaDk(distToRoute(pv))+(pv.molaDk!=null?pv.molaDk:ROUTE_CFG.varsayilanMolaDk);
    }
    var v=selectedVenues[idx];
    var oran=Math.min(1,rotaSirasi(v)/toplamSeg);
    return Math.round(r.dakika*oran + birikim + sapmaDk(distToRoute(v)));
  }
  function renderPlan(){
    if(!planEl)return;
    if(!route.poly||!selectedVenues.length){ planEl.hidden=true; return; }
    planEl.hidden=false;
    var p=planOzeti();
    planListEl.innerHTML=selectedVenues.map(function(v,i){
      var off=distToRoute(v), varis=planVarisDk(i), mola=(v.molaDk!=null?v.molaDk:ROUTE_CFG.varsayilanMolaDk);
      return '<li class="yg-pl-row" data-i="'+i+'">'+
        '<span class="yg-pl-no">'+(i+1)+'</span>'+
        '<div class="yg-pl-main">'+
          '<span class="yg-pl-name">'+v.ad+'</span>'+
          '<span class="yg-pl-loc">'+(v.ilce||'')+(v.ilce&&v.il?' · ':'')+(v.il||v.konum||'')+'</span>'+
          '<span class="yg-pl-facts">'+
            '<span><i class="fa-solid fa-arrows-left-right"></i> '+sapmaMetni(off)+'</span>'+
            (varis!=null?'<span><i class="fa-solid fa-flag-checkered"></i> Tahmini varış '+varisSaati(varis)+'</span>':'')+
            '<span class="yg-pl-unverified"><i class="fa-regular fa-circle-question"></i> Çalışma saati doğrulanmadı</span>'+
          '</span>'+
          '<label class="yg-pl-stay"><i class="fa-regular fa-clock"></i> Önerilen mola'+
            '<select class="yg-pl-stay-sel" data-i="'+i+'">'+
              [15,30,45,60,90].map(function(x){return '<option value="'+x+'"'+(mola===x?' selected':'')+'>'+x+' dk</option>';}).join('')+
            '</select>'+
          '</label>'+
        '</div>'+
        '<div class="yg-pl-acts">'+
          '<button class="yg-pl-up" type="button" aria-label="Yukarı taşı"'+(i===0?' disabled':'')+'><i class="fa-solid fa-chevron-up"></i></button>'+
          '<button class="yg-pl-down" type="button" aria-label="Aşağı taşı"'+(i===selectedVenues.length-1?' disabled':'')+'><i class="fa-solid fa-chevron-down"></i></button>'+
          '<button class="yg-pl-x" type="button" aria-label="Rotadan çıkar"><i class="fa-solid fa-xmark"></i></button>'+
        '</div>'+
      '</li>';
    }).join('');
    planFootEl.innerHTML=
      '<div class="yg-pl-sum">'+
        '<div><span>Normal yolculuk</span><b>'+(p.baseDk!=null?fmtDakika(p.baseDk):'—')+'</b></div>'+
        '<div><span>Duraklarla birlikte</span><b>'+(p.toplamDk!=null?fmtDakika(p.toplamDk):'—')+'</b></div>'+
        '<div><span>Eklenen süre</span><b>'+fmtDakika(p.ekDk)+'</b></div>'+
        '<div><span>Eklenen mesafe</span><b>'+fmtDist(p.ekKm)+'</b></div>'+
      '</div>'+
      '<div class="yg-pl-cta">'+
        '<button class="yg-pl-share" type="button"><i class="fa-solid fa-share-nodes"></i> Paylaş</button>'+
        '<button class="yg-pl-maps" type="button"><i class="fa-solid fa-diamond-turn-right"></i> Harita Uygulamasında Aç</button>'+
      '</div>';
  }
  if(planListEl)planListEl.addEventListener('click',function(e){
    var row=e.target.closest('.yg-pl-row'); if(!row)return;
    var i=+row.getAttribute('data-i'), v=selectedVenues[i]; if(!v)return;
    if(e.target.closest('.yg-pl-x')){ toggleSelected(v); return; }
    if(e.target.closest('.yg-pl-up')&&i>0){ selectedVenues.splice(i-1,0,selectedVenues.splice(i,1)[0]); renderPlan(); renderSelected(); updateSummary(); track('route_stop_reordered',{yon:'yukari'}); return; }
    if(e.target.closest('.yg-pl-down')&&i<selectedVenues.length-1){ selectedVenues.splice(i+1,0,selectedVenues.splice(i,1)[0]); renderPlan(); renderSelected(); updateSummary(); track('route_stop_reordered',{yon:'asagi'}); return; }
  });
  if(planListEl)planListEl.addEventListener('change',function(e){
    var sel=e.target.closest('.yg-pl-stay-sel'); if(!sel)return;
    var v=selectedVenues[+sel.getAttribute('data-i')]; if(!v)return;
    v.molaDk=+sel.value; renderPlan(); updateSummary();
  });
  if(planFootEl)planFootEl.addEventListener('click',function(e){
    if(e.target.closest('.yg-pl-share')){ paylasGuzergah(); return; }
    if(e.target.closest('.yg-pl-maps')){ haritadaAc(); return; }
  });

  /* §1/§10 — Paylaş ve Harita Uygulamasında Aç.
     Navigasyon Dada Route'un işi DEĞİL (§ürün kararı): kullanıcı seçtiği
     duraklarla birlikte harita uygulamasına devredilir. */
  function noktaZinciri(){
    var f=filled(), out=f.slice(0,1);
    selectedVenues.forEach(function(v){ out.push({ad:v.ad,lat:v.lat,lng:v.lng}); });
    return out.concat(f.slice(1));
  }
  function haritadaAc(){
    var z=noktaZinciri(); if(z.length<2)return;
    var org=z[0], dst=z[z.length-1], ara=z.slice(1,-1);
    var url='https://www.google.com/maps/dir/?api=1'+
      '&origin='+encodeURIComponent(org.lat+','+org.lng)+
      '&destination='+encodeURIComponent(dst.lat+','+dst.lng)+
      (ara.length?'&waypoints='+encodeURIComponent(ara.map(function(w){return w.lat+','+w.lng;}).join('|')):'')+
      '&travelmode=driving';
    track('route_opened_in_map',{durak:ara.length});
    window.open(url,'_blank','noopener');
  }
  function paylasGuzergah(){
    var f=filled(); if(f.length<2)return;
    var baslik=f[0].ad+' → '+f[f.length-1].ad;
    var metin=baslik+' · '+fmtDist((currentRoutes[activeIdx]||{}).km)+
      (selectedVenues.length?' · '+selectedVenues.length+' lezzet durağı':'');
    var url=location.origin+location.pathname+'?kalkis='+encodeURIComponent(f[0].ad)+'&varis='+encodeURIComponent(f[f.length-1].ad);
    track('route_shared',{durak:selectedVenues.length});
    if(navigator.share){ navigator.share({title:'Dada Route — '+baslik,text:metin,url:url}).catch(function(){}); return; }
    if(navigator.clipboard){ navigator.clipboard.writeText(metin+' — '+url).then(function(){ geoToast('Güzergâh bağlantısı kopyalandı','fa-circle-check'); },function(){}); return; }
    geoToast('Bağlantı: '+url,'fa-link');
  }

  // ---- K3: sol panel "Güzergahımdaki mekanlar" listesi ----
  function renderSelected(){
    if(!mineEl)return;
    var loaded=!!activeRouteId;                          // A: yalnız yüklü rotada satır tık-toggle affordance
    mineEl.classList.toggle('is-loaded',loaded);
    if(!route.poly){ mineEl.hidden=true; if(mineSubEl)mineSubEl.hidden=true; updateSaveBlock(); updateNewRouteBtn(); return; }
    mineEl.hidden=false;
    updateSaveBlock();
    // C: sahiplik çapası — bunlar SENİN eklediklerin (alt şerit = öneri)
    if(mineSubEl){ if(loaded){ var rc=getRec(activeRouteId); mineSubEl.hidden=false; mineSubEl.innerHTML='<b>'+(rc?rc.ad:'Bu güzergâh')+'</b> için eklediğin mekânlar — satıra dokun: ziyaret işaretle'; } else mineSubEl.hidden=true; }
    if(mineCntEl)mineCntEl.textContent=selectedVenues.length;
    if(!selectedVenues.length){ if(mineEmptyEl)mineEmptyEl.hidden=false; if(mineListEl)mineListEl.innerHTML=''; updateNewRouteBtn(); return; }
    if(mineEmptyEl)mineEmptyEl.hidden=true;
    mineListEl.innerHTML=selectedVenues.map(function(m,i){
      var vis=isVisited(m);                              // karar 4 liste yarısı: yüklü rotada ziyaretliyse üstü-çizik + sönük (saved checklist diliyle tutarlı)
      return '<li class="yg-mine-card'+(vis?' visited':'')+'" data-i="'+i+'"'+
        (loaded?' role="button" tabindex="0" aria-pressed="'+(vis?'true':'false')+'" title="'+(vis?'Ziyareti geri al':'Ziyaret ettim')+'"':'')+'>'+
        '<span class="yg-mine-media" style="background-image:url(\''+imgUrl(m.img)+'\')">'+(vis?'<span class="yg-mine-vchk"><i class="fa-solid fa-check"></i></span>':'')+'</span>'+
        '<span class="yg-mine-info"><span class="yg-mine-name">'+m.ad+'</span><span class="yg-mine-loc">'+m.konum+'</span></span>'+
        '<button class="yg-mine-x" type="button" aria-label="Mekânı çıkar"><i class="fa-solid fa-xmark"></i></button>'+
      '</li>';
    }).join('');
    updateNewRouteBtn();
  }
  // A: gövde tık = ziyaret toggle + sağda detay preview (yüklü rota); X = mekanı çıkar (mevcut davranış)
  if(mineListEl)mineListEl.addEventListener('click',function(e){
    var li=e.target.closest('.yg-mine-card'); if(!li)return;
    var m=selectedVenues[+li.getAttribute('data-i')]; if(!m)return;
    if(e.target.closest('.yg-mine-x')){ toggleSelected(m); return; }   // çıkar → preview/ziyaret tetiklemez
    if(activeRouteId){ toggleVisited(m); openDetail(m,distToRoute(m)); }   // ziyaret (mevcut) + mevcut detay kartını sağda aç (yeni kart değil)
  });
  // A: klavye erişimi — yüklü rotada satır Enter/Space ile ziyaret + preview
  if(mineListEl)mineListEl.addEventListener('keydown',function(e){
    if(e.key!=='Enter'&&e.key!==' ')return;
    var li=e.target.closest('.yg-mine-card'); if(!li||!activeRouteId)return;
    e.preventDefault();
    var m=selectedVenues[+li.getAttribute('data-i')]; if(m){ toggleVisited(m); openDetail(m,distToRoute(m)); }
  });

  // ============ K9: TÜM ROTA MEKANLARI — arama + filtre + dikey tam liste (push view) ============
  var tabsEl=document.querySelector('.yg-tabs'),
      dashAllBtn=document.getElementById('ygDashAll'),
      viewAllEl=document.getElementById('viewAll'),
      allBackEl=document.getElementById('ygAllBack'),
      allSearchEl=document.getElementById('ygAllSearch'),
      allChipsEl=document.getElementById('ygAllChips'),
      allCntEl=document.getElementById('ygAllCount'),
      allEmptyEl=document.getElementById('ygAllEmpty'),
      allListEl=document.getElementById('ygAllList');
  var allFilter='all', allQuery='';
  // §7 — filtre kümesi FILTRELER'den okunur; iki yüzey (sol şerit + tam liste) aynı durumu paylaşır
  /* §7 — çip kuralını uygular. Kural adları RouteQuickFilterKind enum'uyla
     BİREBİR (tek kaynak): sunucu yeni bir çip tanımladığında burada kod
     değişmez. Mekân nesnesi tüm eksenleri taşıdığı için süzgeç AĞA GİTMEZ —
     çipe basınca liste anında güncellenir (bugünkü davranış korunur).
     PRICE_ORDER: PriceLevel enum'unun ₺ sırası (economy<mid<upper). */
  var PRICE_ORDER={'₺':1,'₺₺':2,'₺₺₺':3};
  function matchVenue(x){
    var f=filtreTanim(allFilter), m=x.m, kural=f.kural||'all', deger=f.deger;
    switch(kural){
      case 'detour_tier':
        if(deger==='on'){ if(proxTier(x.off)!=='on') return false; }
        else if(sapmaDk(x.off)>+deger) return false;
        break;
      // `dada_pick` dalı A1 ile kalktı (bayrak öldü). Çip türünün sunucu
      // tarafındaki enum kalemi B1'de temizleniyor; switch'in `default`u yok,
      // yani eşleşmeyen kural SÜZMEZ — artık bir `dada_pick` çipi düşse bile
      // liste boşalmaz, çip etkisiz kalır.
      case 'open_now':   if(m.acik!=='open'&&m.acik!=='closing_soon') return false; break;
      case 'meal':       if((m.ogunler||[]).indexOf(deger)<0) return false; break;
      case 'local':      if(!m.yoresel) return false; break;
      case 'family':     if(!m.aileyeUygun) return false; break;
      case 'venue_type': if(m.tur!==deger) return false; break;
      case 'cuisine':    if(String(m.mutfakId)!==String(deger)) return false; break;
      case 'feature':    if((m.ozellikler||[]).indexOf(deger)<0) return false; break;
      case 'price_max':  if(!(PRICE_ORDER[m.fiyatSeviyesi]<=+deger)) return false; break;
      case 'rating_min': if(m.puan==null||m.puan<+deger) return false; break;
      case 'sponsored':  if(!m.sponsor) return false; break;
    }
    if(allQuery){ var hay=(m.ad+' '+m.konum+' '+(m.cat||'')).toLocaleLowerCase('tr');
      if(hay.indexOf(allQuery)<0)return false; }
    return true;
  }
  // tam liste: currentVenueList (yolculuk sırası) üstüne arama+filtre; data-i = list index (senkron için)
  function renderAll(){
    if(!allListEl)return;
    var html='', shown=0;
    // SPONSOR pin (mock/demo) — eşleşen sonuç kümesinde sponsor mekan EN ÜSTE; geri kalan MEVCUT göreli sırada (stable partition, sort değil).
    // Yapay enjeksiyon YOK: sponsor yalnız aktif filtre/aramaya zaten uyuyorsa tepeye alınır (matchVenue filtresinden geçenler arasında).
    var matched=[]; currentVenueList.forEach(function(x,i){ if(matchVenue(x))matched.push({x:x,i:i}); });
    var ordered=matched.filter(function(e){return e.x.m.sponsor;}).concat(matched.filter(function(e){return !e.x.m.sponsor;}));
    ordered.forEach(function(e){
      var x=e.x, i=e.i; shown++;
      var m=x.m, tier=proxTier(x.off), added=isSel(m), isSpon=!!m.sponsor;
      // SPONSOR (mock/demo) — "Sponsorlu" disclosure görsel sol-üst köşede (slate register).
      // Köşe overlay → meta satırı (yakınlık) normal düzende, satırı uzatmaz (dikey şişme YOK).
      // K3 (kapanış turu) — sponsor↔editör AYNI köşe slotunu paylaşır (bkz.
      // renderDash aynı gerekçe: `m.dada`→`m.editor` rename A1'de sunucuda
      // yapıldı, istemci güncellenmemişti).
      var badge=isSpon
        ? '<span class="yg-fl-badge spon"><i class="fa-solid fa-bullhorn"></i> Sponsorlu</span>'
        : (m.editor ? '<span class="yg-fl-badge"><i class="fa-solid fa-thumbs-up"></i> Editör Önerisi</span>' : '');
      // §9 mekân kartı: kapak · ad · kategori/mutfak · il-ilçe · puan · yakınlık ·
      // sapma mesafesi + eklenecek süre · veri güncelliği. İkincil bilgi satır
      // şişirmesin diye tek meta satırında toplanır (§9 son cümle).
      var meta=[];
      if(m.mutfak)meta.push(m.mutfak);
      if(m.puan!=null)meta.push('<i class="fa-solid fa-star"></i> '+m.puan.toFixed(1));
      html+='<li class="yg-fl-card'+(isSpon?' sponsor':'')+'" data-i="'+i+'">'+
        '<button class="yg-fl-main" type="button" data-i="'+i+'">'+
          '<span class="yg-fl-media" style="background-image:url(\''+imgUrl(m.img)+'\')">'+badge+'</span>'+
          '<span class="yg-fl-body">'+
            '<span class="yg-fl-name">'+m.ad+'</span>'+
            '<span class="yg-fl-loc">'+m.konum+'</span>'+
            (meta.length?'<span class="yg-fl-meta">'+meta.join('<span class="dot"></span>')+'</span>':'')+
            '<span class="yg-fl-tag '+tier+'">'+proxLabel(x.off)+'</span>'+
            '<span class="yg-fl-detour">'+sapmaMetni(x.off)+'</span>'+
          '</span>'+
        '</button>'+
        '<button class="yg-fl-add'+(added?' is-added':'')+'" type="button" data-i="'+i+'" aria-label="Güzergâha Ekle">'+
          '<i class="fa-solid '+(added?'fa-check':'fa-plus')+'"></i> <span>'+(added?'Eklendi':'Ekle')+'</span>'+
        '</button>'+
      '</li>';
    });
    if(allCntEl)allCntEl.textContent=shown+' mekân';
    if(!shown){ renderNoResults(); return; }
    if(allEmptyEl)allEmptyEl.hidden=true;
    allListEl.innerHTML=html;
    if(detailVenue)setActiveCards(detailVenue.ad);   // A2: tam liste yeniden render'da aktif vurguyu koru
  }
  /* §13 "Sonuç bulunamadı" — dokümandaki metin + DÖRT aksiyonun hepsi çalışır.
     "Çalışmayan buton bırakma" (§27): her aksiyon gerçek bir durum değiştirir. */
  function renderNoResults(){
    if(!allEmptyEl)return;
    allListEl.innerHTML='';
    var dahaGenis=ROUTE_CFG.tolerans.filter(function(t){return t.dk!=null&&t.dk>(tolTanim().dk||0);})[0];
    allEmptyEl.hidden=false;
    allEmptyEl.innerHTML='<div class="yg-fl-empty-ico"><i class="fa-solid fa-utensils"></i></div>'+
      '<p>Bu güzergâhta henüz doğrulanmış bir Dada durağı bulamadık.</p>'+
      '<div class="yg-fl-empty-acts">'+
        (dahaGenis?'<button type="button" data-a="tol"><i class="fa-solid fa-arrows-left-right-to-line"></i> Sapma toleransını artır</button>':'')+
        (currentRoutes.length>1?'<button type="button" data-a="alt"><i class="fa-solid fa-route"></i> Alternatif rotayı dene</button>':'')+
        (allFilter!=='all'||allQuery?'<button type="button" data-a="hepsi"><i class="fa-solid fa-layer-group"></i> Tüm yakın mekânları görüntüle</button>':'')+
        '<button type="button" data-a="oner"><i class="fa-solid fa-plus"></i> Yeni mekân öner</button>'+
      '</div>';
    track('no_results_shown',{filtre:allFilter,tolerans:tolId});
  }
  if(allEmptyEl)allEmptyEl.addEventListener('click',function(e){
    var b=e.target.closest('button[data-a]'); if(!b)return;
    var a=b.getAttribute('data-a');
    if(a==='tol'){
      var next=ROUTE_CFG.tolerans.filter(function(t){return t.dk!=null&&t.dk>(tolTanim().dk||0);})[0];
      if(next){ tolId=next.id; refreshThreshold(); spawnVenues(); renderAll();
        track('detour_tolerance_changed',{tolerans:next.id,dakika:next.dk,kaynak:'bos_durum'}); }
    } else if(a==='alt'){
      selectRoute((activeIdx+1)%currentRoutes.length); renderAll();
    } else if(a==='hepsi'){
      allFilter='all'; allQuery=''; if(allSearchEl)allSearchEl.value='';
      renderFilterBars(); renderDash(filteredList()); renderAll();
    } else if(a==='oner'){
      // mekân öneri akışı Gourmet tarafında yaşıyor — yeni sekmede açılır
      var u=mapEl.getAttribute('data-suggest-url'); if(u)window.open(u,'_blank','noopener');
    }
  });

  // tam listedeki kartın "Ekle" durumunu noktasal senkronla (slider ↔ tam liste tutarlılığı)
  function syncFlCard(m){
    if(!allListEl||!viewAllEl||viewAllEl.hidden)return;
    var idx=currentVenueList.map(function(x){return vid(x.m);}).indexOf(vid(m)); if(idx<0)return;
    var add=allListEl.querySelector('.yg-fl-add[data-i="'+idx+'"]'); if(!add)return;
    var on=isSel(m); add.classList.toggle('is-added',on);
    var ic=add.querySelector('i'); if(ic)ic.className='fa-solid '+(on?'fa-check':'fa-plus');
    var sp=add.querySelector('span'); if(sp)sp.textContent=on?'Eklendi':'Ekle';
  }
  function updateChips(){ renderFilterBars(); }
  // §7 — iki yüzeydeki şerit AYNI durumu yazar; seçim değişince kadran + tam liste birlikte tazelenir
  function onFilterClick(e){
    var c=e.target.closest('.yg-fl-chip'); if(!c||c.disabled)return;
    allFilter=c.getAttribute('data-f');
    renderFilterBars(); renderDash(filteredList());
    if(viewAllEl && !viewAllEl.hidden)renderAll();
  }
  function openAllView(){
    if(!route.poly)return;
    // §7 — filtre durumu iki yüzey arasında KORUNUR (şerit ile tam liste aynı state)
    allQuery=''; if(allSearchEl)allSearchEl.value=''; updateChips(); renderAll();
    if(tabsEl)tabsEl.style.display='none';
    viewRoute.classList.remove('is-active'); viewRoute.hidden=true;
    viewSaved.classList.remove('is-active'); viewSaved.hidden=true;
    viewAllEl.classList.add('is-active'); viewAllEl.hidden=false; viewAllEl.scrollTop=0;
    // B2: tam liste solda her şeyi gösteriyor → alt slider gereksiz. YUMUŞAK gizle (full-hidden translateY .34s, handle ile aynı dil; ani pop YOK).
    // hidden=true KULLANMA (display:none animasyon almaz); collapse class korunur → geri dönünce saygı duyulur.
    if(dashEl)dashEl.classList.add('full-hidden'); syncBottomOffset();
    // FAZ 4: mobilde "Tümünü Gör" → sheet TAM açılsın (liste gömülü/yarım gelmesin; sticky başlık+arama+filtre + scroll liste)
    if(typeof mqMobile!=='undefined' && mqMobile.matches) applySheetDetent('full',true);
  }
  function closeAllView(){
    viewAllEl.classList.remove('is-active'); viewAllEl.hidden=true;
    if(tabsEl)tabsEl.style.display='';
    if(dashEl)dashEl.classList.remove('full-hidden');   // B2: slider YUMUŞAK geri gelir (collapse class dashEl'de kalır → kullanıcı kapattıysa kapalı döner)
    renderDash(currentVenueList);
    selectTab('route');
    // FAZ 4: mobilde "Geri" → browse'a dön (peek: harita + ray), tam liste kapanınca planlama formuna gömülme
    if(typeof mqMobile!=='undefined' && mqMobile.matches) applySheetDetent('peek',true);
  }
  if(dashAllBtn)dashAllBtn.addEventListener('click',openAllView);
  if(allBackEl)allBackEl.addEventListener('click',closeAllView);
  if(allSearchEl)allSearchEl.addEventListener('input',function(){ allQuery=allSearchEl.value.trim().toLocaleLowerCase('tr'); renderAll(); });
  if(allChipsEl)allChipsEl.addEventListener('click',onFilterClick);
  if(quickEl)quickEl.addEventListener('click',onFilterClick);
  if(allListEl)allListEl.addEventListener('click',function(e){
    var add=e.target.closest('.yg-fl-add');
    if(add){ var xa=currentVenueList[+add.getAttribute('data-i')]; if(xa)toggleSelected(xa.m); return; }
    var main=e.target.closest('.yg-fl-main');
    if(main){ var xm=currentVenueList[+main.getAttribute('data-i')]; if(xm){ flyToVenue(xm.m.lat,xm.m.lng); openDetail(xm.m,xm.off); } }
  });

  // ============ KONUM BUL — geolocation → mavi nokta + flyTo + en yakın şehir "Buradan başla" ============
  var appEl=document.querySelector('.yg-app'),
      geoBtn=document.getElementById('ygLocate'),
      geoPrompt=document.getElementById('ygGeoPrompt'), geoCityEl=document.getElementById('ygGeoCity'),
      geoStartEl=document.getElementById('ygGeoStart'), geoCloseEl=document.getElementById('ygGeoClose'),
      toastWrap=document.getElementById('ygToastWrap');
  var geoMarker=null, geoNearest=null;
  // alt kadran açıkken FAB/prompt/toast'ı kadran yüksekliği kadar yukarı kaydır (çakışma önle)
  function syncBottomOffset(){
    if(!appEl)return;
    // ---- FAZ 3: MOBİL alt-yığın tek-kaynak — sheet (peek/half/full) + (peek modda) venue rayı. ----
    if(typeof mqMobile!=='undefined' && mqMobile.matches && panel){
      var vh=window.innerHeight;
      var peek=panel.classList.contains('sheet-peek');
      // sV = görünür sheet — detent'ten DETERMINISTIK (canlı rect transition ortasında yanlış okuyordu):
      // peek=96px (CSS translateY 86dvh-96) · full=86dvh · half=52dvh.
      var sV=peek?PEEK_PX:(panel.classList.contains('sheet-full')?Math.round(0.86*vh):Math.round(0.52*vh));
      var dHidden=!dashEl || dashEl.hidden;
      var dVis=!dHidden && !dashEl.classList.contains('collapsed') && !dashEl.classList.contains('full-hidden');
      var dH=dVis?dashEl.offsetHeight:0;
      var browseDash=peek && dVis;                          // ray yalnız peek (browse) modunda
      appEl.style.setProperty('--dashb',(browseDash?sV:8)+'px');   // ray bottom: peek üstü / (gizli) taban
      var occ=sV+(browseDash?dH:0);                         // alttaki en üst dolu nokta (sheet + ray)
      appEl.style.setProperty('--locb',(occ+8)+'px');       // FAB/geo/toast: occ üstü
      appEl.style.setProperty('--dashh',occ+'px');          // detay: bottom = 8 + occ → occ üstü (artık sheet ARKASINA düşmez)
      return;
    }
    // ---- DESKTOP (orijinal mantık AYNEN) ----
    // kadran görünür VE açık ise yüksekliği kadar offset; gizli/kapalı (collapsed) / full-view (full-hidden) ise FAB tabana iner
    var hidden=!dashEl || dashEl.hidden;
    var fullHidden=!hidden && dashEl.classList.contains('full-hidden');
    var collapsed=!hidden && dashEl.classList.contains('collapsed');
    var vis=!hidden && !collapsed && !fullHidden;
    var h=vis?dashEl.offsetHeight:0;
    appEl.style.setProperty('--locb',(h?(h+12):0)+'px');
    var dashh=vis?(dashEl.offsetHeight+8):((collapsed && !fullHidden)?44:0);
    appEl.style.setProperty('--dashh',dashh+'px');
  }
  function geoToast(msg,icon){
    if(!toastWrap)return;
    syncBottomOffset();
    var t=document.createElement('div'); t.className='yg-toast';
    t.innerHTML='<i class="fa-solid '+(icon||'fa-circle-info')+'"></i><span>'+msg+'</span>';
    toastWrap.appendChild(t);
    requestAnimationFrame(function(){t.classList.add('show');});
    setTimeout(function(){ t.classList.remove('show'); setTimeout(function(){ if(t.parentNode)t.parentNode.removeChild(t); },260); },4400);
  }
  // haversine (km) — en yakın CITY tespiti
  function haversine(aLat,aLng,bLat,bLng){
    var R=6371, toRad=Math.PI/180;
    var dLat=(bLat-aLat)*toRad, dLng=(bLng-aLng)*toRad;
    var s=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(aLat*toRad)*Math.cos(bLat*toRad)*Math.sin(dLng/2)*Math.sin(dLng/2);
    return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s));
  }
  /* En yakın yer SUNUCUDA bulunur (route_places, bbox ön-elemeli). Ham konum
     SAKLANMAZ — yalnız bu istek boyunca kullanılır (§22 KVKK şerhi).
     `haversine` yerinde duruyor: mesafe etiketini yanıt gelmeden de
     hesaplayabilmek ve harita içi ölçümler için. */
  function nearestCity(lat,lng){
    var url=ROUTE_CFG.uclar.enYakin;
    if(!url) return Promise.resolve(null);
    return apiFetch(url+'?lat='+encodeURIComponent(lat)+'&lng='+encodeURIComponent(lng))
      .then(function(j){ return j&&j.yer ? {city:j.yer, dist:(j.uzaklikKm!=null?j.uzaklikKm:haversine(lat,lng,j.yer.lat,j.yer.lng))} : null; })
      .catch(function(){ return null; });
  }
  var geoIcon=L.divIcon({className:'yg-geo',html:'<span class="yg-geo-pulse"></span><span class="yg-geo-dot"></span>',iconSize:[22,22],iconAnchor:[11,11]});
  function showGeoMarker(lat,lng){
    if(geoMarker)geoMarker.setLatLng([lat,lng]);
    else geoMarker=L.marker([lat,lng],{icon:geoIcon,interactive:false,keyboard:false,zIndexOffset:600}).addTo(map);
  }
  function hideGeoPrompt(){ if(geoPrompt)geoPrompt.hidden=true; geoNearest=null; }
  function setGeoBusy(b){
    if(!geoBtn)return;
    geoBtn.classList.toggle('busy',b); geoBtn.disabled=b;
    var ic=geoBtn.querySelector('i'); if(ic)ic.className='fa-solid '+(b?'fa-spinner':'fa-location-crosshairs');
  }
  /* `dogrudanDoldur` true ise en yakın yer SORULMADAN kalkışa yazılır
     (§2 "Konumumu kullan" düğmesi). false ise harita FAB'ının bugünkü
     davranışı korunur: konum gösterilir, kullanıcı "Buradan başla"ya basana
     kadar forma DOKUNULMAZ. İki yol da aynı sunucu ucunu kullanır; ters
     coğrafyalama servisi çağrılmaz. */
  function locate(dogrudanDoldur){
    hideGeoPrompt();
    if(!navigator.geolocation){ geoToast('Bu tarayıcı konum paylaşımını desteklemiyor.','fa-triangle-exclamation'); return; }
    setGeoBusy(true);
    setLocateBusy(true);
    navigator.geolocation.getCurrentPosition(function(pos){
      setGeoBusy(false);
      var lat=pos.coords.latitude, lng=pos.coords.longitude;
      showGeoMarker(lat,lng);
      flyToVisible(lat,lng,11);   // mobilde sheet kadar yukarı offset → konum görünür alana otursun (aşağıda/arkada kalmasın)
      nearestCity(lat,lng).then(function(n){
        setLocateBusy(false);
        if(!n){
          // Konum alındı ama sözlükte karşılık yok (ör. Türkiye dışı) —
          // uydurma yer BASILMAZ, kullanıcı sakin bir cümleyle bilgilendirilir.
          geoToast('Konumuna yakın bir yer bulunamadı. Kalkış noktanı yazarak seçebilirsin.','fa-circle-info');
          return;
        }
        if(dogrudanDoldur){
          stops[0]={id:n.city.id,ad:n.city.ad,alt:n.city.alt||null,tur:n.city.tur||null,lat:n.city.lat,lng:n.city.lng};
          renderStops(); placeStopMarkers(); maybeBuild();
          selectTab('route');
          geoToast('Kalkış noktan '+n.city.ad+' olarak ayarlandı ('+Math.round(n.dist)+' km).','fa-location-dot');
          track('route_location_used',{uzaklik_km:Math.round(n.dist)});
          return;
        }
        if(geoPrompt){
          geoNearest=n.city;
          if(geoCityEl)geoCityEl.textContent=n.city.ad+' · '+Math.round(n.dist)+' km';
          syncBottomOffset(); geoPrompt.hidden=false;
        }
      });
    },function(err){
      setGeoBusy(false);
      setLocateBusy(false);
      var msg='Konumun şu an alınamadı. Lütfen tekrar dene.';
      if(err){ if(err.code===1)msg='Konum izni reddedildi. Kalkış noktanı yazarak da seçebilirsin.';
        else if(err.code===3)msg='Konum alınamadı (zaman aşımı). Tekrar dene.'; }
      geoToast(msg,'fa-triangle-exclamation');   // sahte konum YOK — yalnız kibar bilgi
    },{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
  }
  var locateBtn=document.getElementById('ygUseLocation');
  function setLocateBusy(b){
    if(!locateBtn)return;
    locateBtn.disabled=b;
    var ic=locateBtn.querySelector('i');
    if(ic)ic.className='fa-solid '+(b?'fa-spinner':'fa-location-crosshairs');
  }
  if(geoBtn)geoBtn.addEventListener('click',function(){locate(false);});
  if(locateBtn)locateBtn.addEventListener('click',function(){locate(true);});
  if(geoCloseEl)geoCloseEl.addEventListener('click',hideGeoPrompt);
  if(geoStartEl)geoStartEl.addEventListener('click',function(){
    if(!geoNearest)return;
    stops[0]=geoNearest;                          // en yakın şehri 1. durağa (kalkış) koy — ONAYLI
    renderStops(); placeStopMarkers(); maybeBuild();
    hideGeoPrompt(); selectTab('route');          // Güzergahlarım/Tüm Mekanlar açıksa Rota Kur'a dön
  });
  window.addEventListener('resize',syncBottomOffset,{passive:true});
  syncBottomOffset();

  // ============ TAB GEÇİŞİ (Rota Kur ↔ Güzergahlarım) ============
  var tabRoute=document.getElementById('tabRoute'), tabSaved=document.getElementById('tabSaved'),
      viewRoute=document.getElementById('viewRoute'), viewSaved=document.getElementById('viewSaved'),
      goBuild=document.getElementById('ygGoBuild');
  function selectTab(which){
    var routeOn=(which==='route');
    if(viewAllEl){viewAllEl.classList.remove('is-active');viewAllEl.hidden=true;}   // tab değişince tam liste kapanır
    if(tabsEl)tabsEl.style.display='';
    tabRoute.classList.toggle('is-active',routeOn); tabRoute.setAttribute('aria-selected',routeOn);
    tabSaved.classList.toggle('is-active',!routeOn); tabSaved.setAttribute('aria-selected',!routeOn);
    viewRoute.classList.toggle('is-active',routeOn); viewRoute.hidden=!routeOn;
    viewSaved.classList.toggle('is-active',!routeOn); viewSaved.hidden=routeOn;
    if(!routeOn)renderSaved();    // Güzergahlarım'a geçince kayıtlı listeyi tazele
  }
  tabRoute.addEventListener('click',function(){selectTab('route');});
  tabSaved.addEventListener('click',function(){selectTab('saved');});
  if(goBuild)goBuild.addEventListener('click',function(){selectTab('route');var f=stopListEl.querySelector('.yg-stop-input');if(f)f.focus();});

  // ============ DALGA 3-B: KAYDET + localStorage + GÜZERGAHLARIM + CHECKPOINT (ROUTE-SCOPED ziyaret) ============
  var KEY_ROUTES='dada_yg_v2_routes', KEY_VIS='dada_yg_v2_visited';
  function lsGet(k,def){ try{var v=localStorage.getItem(k);return v?JSON.parse(v):def;}catch(e){return def;} }
  function lsSet(k,val){ try{localStorage.setItem(k,JSON.stringify(val));return true;}catch(e){return false;} }
  var savedRoutes=lsGet(KEY_ROUTES,[]);  if(!Array.isArray(savedRoutes))savedRoutes=[];
  var visited=lsGet(KEY_VIS,{});         if(!visited||typeof visited!=='object')visited={};

  // DOM
  var saveEl=document.getElementById('ygSave'), saveNameEl=document.getElementById('ygSaveName'),
      saveBtnEl=document.getElementById('ygSaveBtn'),
      saveCtxEl=document.getElementById('ygSaveCtx'), saveCtxNameEl=document.getElementById('ygSaveCtxName'),
      saveBtnTxtEl=document.getElementById('ygSaveBtnTxt'), saveBtnIcoEl=document.getElementById('ygSaveBtnIco'),
      savedListEl=document.getElementById('ygSavedList'), savedHeadEl=document.getElementById('ygSavedHead'),
      savedTabsEl=document.getElementById('ygSavedTabs'),
      savedTotalEl=document.getElementById('ygSavedTotal'), savedEmptyEl=document.getElementById('ygSavedEmpty'),
      savedCntEl=document.getElementById('savedCnt');
  var nameEdited=false, lastAutoName='';
  function autoRouteName(){ var f=filled(); return f.length>=2 ? f[0].ad+' → '+f[f.length-1].ad : ''; }

  // KAYDET bloğu: rota varken görünür; ad otomatik (kullanıcı düzenlemediyse tazelenir)
  function updateSaveBlock(){
    if(!saveEl)return;
    if(!route.poly || filled().length<2){ saveEl.hidden=true; return; }
    saveEl.hidden=false;
    var loaded = !!activeRouteId && !!getRec(activeRouteId);   // yüklü kayıtlı rota mı (divergence'ta activeRouteId null → false)
    if(saveCtxEl){ saveCtxEl.hidden=!loaded; if(loaded && saveCtxNameEl)saveCtxNameEl.textContent=getRec(activeRouteId).ad; }
    if(saveBtnTxtEl)saveBtnTxtEl.textContent = loaded ? 'Güncelle' : 'Güzergâhımı Kaydet';
    if(saveBtnIcoEl)saveBtnIcoEl.className = loaded ? 'fa-solid fa-arrows-rotate' : 'fa-regular fa-bookmark';
    // ad otomatik (kalkış→varış) — YALNIZ yeni kayıtta tazele; yüklü rotada rec/kullanıcı adını koru
    if(!loaded && saveNameEl && (!nameEdited || saveNameEl.value.trim()==='')){ var auto=autoRouteName(); saveNameEl.value=auto; lastAutoName=auto; }
  }
  if(saveNameEl)saveNameEl.addEventListener('input',function(){
    nameEdited = saveNameEl.value.trim()!=='' && saveNameEl.value.trim()!==lastAutoName.trim();
  });
  function buildRecord(name,existing){
    var f=filled(), ar=currentRoutes[activeIdx];
    return {
      id: existing ? existing.id : ('r'+Date.now().toString(36)+'_'+savedRoutes.length),   // GÜNCELLE'de id sabit → duplikasyon yok + visited[id] korunur
      ad:name||autoRouteName()||'Güzergâhım',
      stops:f.map(function(c){return {id:c.id,ad:c.ad,alt:c.alt||null,tur:c.tur||null,il:c.il||null,lat:c.lat,lng:c.lng,molaDk:c.molaDk};}),
      venues:selectedVenues.map(function(v){return {id:v.id,slug:v.slug,url:v.url,ad:v.ad,konum:v.konum,lat:v.lat,lng:v.lng,img:v.img,cat:v.cat,puan:v.puan,il:v.il,ilce:v.ilce,molaDk:v.molaDk,sapmaDk:v.sapmaDk,sapmaKm:v.sapmaKm,stopId:v.stopId};}),
      poly: (ar&&ar.poly) ? ar.poly : (existing?existing.poly:null),          // KALICI geometri → ağ-bağımsız sadık görüntüleme (B-3 fix)
      km:   (ar&&ar.km!=null) ? ar.km : (existing?existing.km:null),
      dakika:(ar&&ar.dakika!=null) ? ar.dakika : (existing?existing.dakika:null),
      corridor:corridor,
      tolerans:tolId, ozelKm:ozelKm,                                           // §6 tolerans seçimi de kayda girer
      filtreler:[allFilter], saglayici:routeProvider, alternatif:activeIdx,     // kayıt kendi bağlamını taşır
      sunucu: existing ? !!existing.sunucu : sunucuDepo,
      favori: existing ? !!existing.favori : false,                            // §12 Favoriler
      yolculukTarihi: existing ? (existing.yolculukTarihi||null) : null,       // §12 Yaklaşan Yolculuklar (kullanıcı verir)
      sonKullanim: Date.now(),                                                 // §12 Son Kullanılanlar
      ts: existing ? existing.ts : Date.now()                                  // güncellemede oluşturma tarihi korunur
    };
  }
  /* =====================================================================
     §11 ÜYELİK VE KAYDETME AKIŞI
     "Kullanıcı rota oluşturmak için giriş yapmak zorunda olmamalıdır. Üyelik
     zorunluluğu YALNIZ rota kaydetme gibi hesap gerektiren işlemlerde."
     Rota kurma, filtreleme, mekân ekleme, harita uygulamasında açma ve paylaşma
     misafirde TAM çalışır; kapı sadece "Kaydet"te belirir ve kapatılabilir —
     "Üyelik ekranı rota keşfinin önünde zorunlu engel oluşturmamalıdır."
     Oturum durumu sunucudan gelir (blade #routeMap data-auth).
     ===================================================================== */
  var girisYapildi=mapEl.getAttribute('data-auth')==='1';
  var girisUrl=mapEl.getAttribute('data-login-url')||'';
  var kayitUrl=mapEl.getAttribute('data-register-url')||'';
  var gateEl=document.getElementById('ygSaveGate');
  function acKaydetKapisi(){
    if(!gateEl)return;
    gateEl.hidden=false;
    track('registration_started_from_route',{});
  }
  function kapatKaydetKapisi(){ if(gateEl)gateEl.hidden=true; }
  if(gateEl)gateEl.addEventListener('click',function(e){
    if(e.target===gateEl||e.target.closest('[data-gate="kapat"]')){ kapatKaydetKapisi(); return; }
    if(e.target.closest('[data-gate="devam"]')){ kapatKaydetKapisi(); return; }   // "Kaydetmeden Devam Et"
  });

  /* =====================================================================
     DEPOLAMA — SUNUCU (üye) / localStorage (misafir)
     §11 gereği rota KURMAK giriş istemez; kapı yalnız "Kaydet"tedir. Giriş
     yapılmışsa kayıt hesaba (route_plans) yazılır ve cihazlar arası taşınır;
     misafirde bugünkü localStorage yolu AYNEN korunur. Misafirin yerel
     kayıtları girişte SESSİZCE devralınmaz (kullanıcı verisi habersiz
     taşınmaz) — kullanıcı yükleyip tekrar kaydederse hesabına geçer.
     ===================================================================== */
  var sunucuDepo = girisYapildi && !!ROUTE_CFG.uclar.guzergahlar;

  /* Kaydedilen geometri seyreltilir: mini harita ve "anında yeniden çizim"
     için 800 nokta fazlasıyla yeter, ham polyline (binlerce nokta) satırı
     gereksiz şişirir. Uçlar korunur. */
  function seyrelt(poly,enFazla){
    if(!poly||poly.length<=enFazla)return poly||[];
    var adim=Math.ceil(poly.length/enFazla), out=[];
    for(var i=0;i<poly.length;i+=adim)out.push([+poly[i][0].toFixed(5),+poly[i][1].toFixed(5)]);
    var son=poly[poly.length-1];
    out.push([+son[0].toFixed(5),+son[1].toFixed(5)]);
    return out;
  }

  function recToPayload(rec){
    var st=rec.stops||[], ilk=st[0]||{}, sonSt=st[st.length-1]||{};
    var duraklar=[];
    st.slice(1,-1).forEach(function(c){
      duraklar.push({rol:'waypoint',ad:c.ad,il:stopIl(c),lat:c.lat,lng:c.lng,mola_dk:(c.molaDk!=null?c.molaDk:null)});
    });
    (rec.venues||[]).forEach(function(v){
      duraklar.push({rol:'venue',mekan_id:(v.id!=null?v.id:null),ad:v.ad,il:(v.il||null),lat:v.lat,lng:v.lng,
        mola_dk:(v.molaDk!=null?v.molaDk:null),sapma_dk:(v.sapmaDk!=null?v.sapmaDk:null),sapma_km:(v.sapmaKm!=null?v.sapmaKm:null)});
    });
    return {
      ad:rec.ad,
      favori:!!rec.favori,
      yolculuk_tarihi:rec.yolculukTarihi||null,
      // Karar 5 (2026-08-07) — kalkış/varış ili `stopIl()` ile türetilir/taşınır.
      kalkis:{ad:ilk.ad,il:stopIl(ilk),lat:ilk.lat,lng:ilk.lng},
      varis:{ad:sonSt.ad,il:stopIl(sonSt),lat:sonSt.lat,lng:sonSt.lng},
      tolerans_dk:(tolTanim(rec.tolerans).dk!=null?tolTanim(rec.tolerans).dk:null),
      tolerans_km:(rec.tolerans==='ozel'?rec.ozelKm:null),
      // Kaydın KENDİ alanları — küresel arayüz durumu DEĞİL. Aksi hâlde
      // listeden favori işaretlemek, o an ekranda duran başka rotanın
      // sağlayıcısını/filtresini kayda yazardı.
      filtreler:rec.filtreler||null,
      saglayici:rec.saglayici||null,
      mesafe_m:(rec.km!=null?Math.round(rec.km*1000):null),
      sure_sn:(rec.dakika!=null?rec.dakika*60:null),
      geometri:rec.poly?JSON.stringify(seyrelt(rec.poly,800)):null,
      alternatif:(rec.alternatif!=null?rec.alternatif:0),
      duraklar:duraklar
    };
  }

  /* Sunucu kaydını motorun kayıt biçimine çevirir — renderSaved/loadRoute
     tek bir kayıt şekli görür, iki kod yolu doğmaz. */
  function planToRec(p){
    var wp=[], vn=[];
    (p.duraklar||[]).forEach(function(d){
      if(d.rol==='waypoint') wp.push({ad:d.ad,il:d.il||null,lat:d.lat,lng:d.lng,molaDk:d.mola_dk});
      else vn.push({id:d.mekan_id,stopId:d.id,ad:d.ad,il:d.il||null,lat:d.lat,lng:d.lng,molaDk:d.mola_dk,sapmaDk:d.sapma_dk,sapmaKm:d.sapma_km,ziyaret:!!d.ziyaret});
    });
    var poly=null;
    try{ poly=p.geometri?JSON.parse(p.geometri):null; }catch(e){ poly=null; }
    var rec={
      id:p.id, sunucu:true, ad:p.ad,
      // `il` sunucudan ZATEN çözülmüş gelir (stopIl() bunu `c.il` üzerinden aynen taşır).
      stops:[{ad:p.kalkis.ad,il:p.kalkis.il||null,lat:p.kalkis.lat,lng:p.kalkis.lng}].concat(wp).concat([{ad:p.varis.ad,il:p.varis.il||null,lat:p.varis.lat,lng:p.varis.lng}]),
      venues:vn, poly:poly,
      km:(p.mesafe_m!=null?p.mesafe_m/1000:null),
      dakika:(p.sure_sn!=null?Math.round(p.sure_sn/60):null),
      corridor:null,
      tolerans:(p.tolerans_km!=null?'ozel':'dk'+p.tolerans_dk), ozelKm:(p.tolerans_km!=null?p.tolerans_km:ozelKm),
      favori:!!p.favori, yolculukTarihi:p.yolculuk_tarihi||null,
      filtreler:p.filtreler||null, saglayici:p.saglayici||null, alternatif:(p.alternatif!=null?p.alternatif:0),
      sonKullanim:(Date.parse(p.guncellendi)||Date.now()), ts:(Date.parse(p.guncellendi)||Date.now())
    };
    // Ziyaret durumu sunucudan gelir; yerel harita onunla TAZELENİR.
    visited[p.id]={};
    vn.forEach(function(v){ if(v.ziyaret)visited[p.id][vid(v)]=true; });
    return rec;
  }

  function sunucuKayitlariYukle(){
    if(!sunucuDepo)return Promise.resolve();
    return apiFetch(ROUTE_CFG.uclar.guzergahlar).then(function(j){
      savedRoutes=(j.guzergahlar||[]).map(planToRec);
      updateSavedCount(); renderSaved();
    }).catch(function(){ /* sessiz: yerel liste neyse o kalır */ });
  }

  if(saveBtnEl)saveBtnEl.addEventListener('click',function(){
    if(!route.poly||filled().length<2)return;
    if(!girisYapildi){ acKaydetKapisi(); return; }        // §11 — kapı YALNIZ burada
    var nm=(saveNameEl?saveNameEl.value.trim():'')||autoRouteName();
    var ex = activeRouteId ? getRec(activeRouteId) : null;      // yüklü rota → GÜNCELLE (aynı id overwrite); değilse YENİ
    var rec = buildRecord(nm, ex);
    var guncelleme=!!ex;

    function yerelYaz(){
      if(ex){
        var i=savedRoutes.map(function(r){return r.id;}).indexOf(ex.id);
        if(i>=0)savedRoutes[i]=rec; else savedRoutes.push(rec);
        geoToast('“'+rec.ad+'” güncellendi','fa-circle-check');
        updateSavedCount(); renderSaved(); updateSaveBlock();    // bağlam/Güncelle korunur, sekmede kal
      } else {
        savedRoutes.push(rec);
        geoToast('“'+rec.ad+'” kaydedildi','fa-circle-check');   // konum-bul toast desenini yeniden kullan
        updateSavedCount(); renderSaved(); selectTab('saved');   // yeni kaydı göster
      }
      nameEdited=false;
    }

    if(sunucuDepo){
      var url=ROUTE_CFG.uclar.guzergahlar+(ex&&ex.sunucu?('/'+ex.id):'');
      apiFetch(url,{method:(ex&&ex.sunucu)?'PATCH':'POST',body:JSON.stringify(recToPayload(rec))})
        .then(function(j){
          var kayit=planToRec(j.guzergah);
          var i=savedRoutes.map(function(r){return r.id;}).indexOf(kayit.id);
          if(i>=0)savedRoutes[i]=kayit; else savedRoutes.push(kayit);
          activeRouteId=kayit.id; nameEdited=false;
          geoToast('“'+kayit.ad+'” '+(guncelleme?'güncellendi':'kaydedildi'),'fa-circle-check');
          updateSavedCount(); renderSaved();
          if(guncelleme)updateSaveBlock(); else selectTab('saved');
        })
        .catch(function(e){
          var msg=(e&&e.body&&e.body.message)?e.body.message:'Güzergâh kaydedilemedi. Lütfen tekrar dene.';
          geoToast(msg,'fa-triangle-exclamation');
        });
    } else {
      yerelYaz(); lsSet(KEY_ROUTES,savedRoutes);
    }
    track('route_saved',{mekanSayisi:selectedVenues.length,durakSayisi:filled().length,guncelleme:guncelleme});
  });

  function updateSavedCount(){
    if(!savedCntEl)return;
    savedCntEl.textContent=savedRoutes.length;
    savedCntEl.hidden=!savedRoutes.length;
  }
  function fmtDate(ts){ try{ return new Date(ts).toLocaleDateString('tr-TR',{day:'numeric',month:'short',year:'numeric'}); }catch(e){ return ''; } }
  function visitCount(rec){
    var v=visited[rec.id]||{}, n=0;
    (rec.venues||[]).forEach(function(x){ if(v[vid(x)])n++; });
    return n;
  }

  /* =====================================================================
     §12 KAYITLI GÜZERGÂHLAR — dört kategori
     Son Kullanılanlar · Favoriler · Yaklaşan Yolculuklar · Tamamlanan Rotalar.
     Hepsi KAYDIN GERÇEK DURUMUNDAN hesaplanır; uydurma kategori doldurma yok:
       · Son Kullanılanlar → sonKullanim/ts sırası
       · Favoriler        → kullanıcının yıldızladığı kayıtlar
       · Yaklaşan         → kullanıcının tarih verdiği, tarihi geçmemiş kayıtlar
       · Tamamlanan       → eklenen mekânların tamamı ziyaret işaretli
     "Yaklaşan"ın tarihi kullanıcıdan gelir (kartta tarih alanı) — sistem
     kendiliğinden tarih ATAMAZ.
     ===================================================================== */
  var savedKat='son';
  var SAVED_KATEGORILER=[
    {id:'son',   ad:'Son Kullanılanlar'},
    {id:'fav',   ad:'Favoriler'},
    {id:'yakin', ad:'Yaklaşan Yolculuklar'},
    {id:'bitmis',ad:'Tamamlanan Rotalar'}
  ];
  function rotaTamamlandi(r){ var nv=(r.venues||[]).length; return nv>0&&visitCount(r)===nv; }
  function katFiltre(r){
    if(savedKat==='fav')   return !!r.favori;
    if(savedKat==='yakin') return !!r.yolculukTarihi && new Date(r.yolculukTarihi).getTime()>=Date.now()-864e5;
    if(savedKat==='bitmis')return rotaTamamlandi(r);
    return true;
  }
  // §12 rota küçük haritası — KAYITLI geometriden çizilir (dış servis çağrısı YOK)
  function miniMap(r){
    var p=r.poly; if(!p||p.length<2)return '';
    var la=p.map(function(c){return c[0];}), ln=p.map(function(c){return c[1];});
    var la0=Math.min.apply(null,la), la1=Math.max.apply(null,la);
    var ln0=Math.min.apply(null,ln), ln1=Math.max.apply(null,ln);
    var dw=Math.max(1e-6,ln1-ln0), dh=Math.max(1e-6,la1-la0);
    var step=Math.max(1,Math.floor(p.length/60));
    var pts=[];
    for(var i=0;i<p.length;i+=step){
      pts.push(((p[i][1]-ln0)/dw*100).toFixed(1)+','+((la1-p[i][0])/dh*38).toFixed(1));
    }
    return '<svg class="yg-sv-mini" viewBox="0 0 100 38" preserveAspectRatio="none" aria-hidden="true">'+
      '<polyline points="'+pts.join(' ')+'" fill="none" stroke="var(--tomato)" stroke-width="2.4" '+
      'stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';
  }
  function renderSavedTabs(){
    if(!savedTabsEl)return;
    savedTabsEl.innerHTML=SAVED_KATEGORILER.map(function(k){
      var n=savedRoutes.filter(function(r){ var eski=savedKat; savedKat=k.id; var ok=katFiltre(r); savedKat=eski; return ok; }).length;
      return '<button class="yg-fl-chip'+(k.id===savedKat?' is-active':'')+'" type="button" data-k="'+k.id+'">'+k.ad+
        (n?' <span class="yg-sv-kn">'+n+'</span>':'')+'</button>';
    }).join('');
  }
  // GÜZERGÂHLARIM listesi
  function renderSaved(){
    if(!savedListEl)return;
    updateSavedCount();
    var has=savedRoutes.length>0;
    if(savedEmptyEl)savedEmptyEl.hidden=has;
    if(savedHeadEl)savedHeadEl.hidden=!has;
    if(savedTabsEl)savedTabsEl.hidden=!has;
    if(savedTotalEl)savedTotalEl.textContent=savedRoutes.length;
    if(!has){ savedListEl.innerHTML=''; return; }
    renderSavedTabs();
    // en son kullanılan üstte
    var arr=savedRoutes.slice()
      .filter(katFiltre)
      .sort(function(a,b){return (b.sonKullanim||b.ts||0)-(a.sonKullanim||a.ts||0);});
    if(!arr.length){
      savedListEl.innerHTML='<li class="yg-sv-empty-kat">Bu kategoride güzergâh yok.</li>';
      return;
    }
    savedListEl.innerHTML=arr.map(function(r){
      var nv=(r.venues||[]).length, vc=visitCount(r), done=(nv>0&&vc===nv);
      var prog = nv>0 ? '<div class="yg-sv-prog"><div class="yg-sv-prog-bar"><span style="width:'+Math.round(vc/nv*100)+'%"></span></div>'+
          '<span class="yg-sv-prog-txt'+(done?' done':'')+'">'+(done?'<i class="fa-solid fa-circle-check"></i> Tümü ziyaret edildi ('+nv+'/'+nv+')':vc+'/'+nv+' ziyaret edildi')+'</span></div>' : '';
      var checklist = nv>0 ? '<ul class="yg-sv-venues" hidden>'+ (r.venues||[]).map(function(v){
          var on=!!(visited[r.id]&&visited[r.id][vid(v)]);
          return '<li><button class="yg-sv-vrow'+(on?' on':'')+'" type="button" data-ad="'+encodeURIComponent(vid(v))+'">'+
            '<span class="yg-sv-cbox"><i class="fa-solid fa-check"></i></span>'+
            '<span class="yg-sv-vname">'+v.ad+'</span>'+
          '</button></li>';
        }).join('') +'</ul>' : '';
      // §12 kart alanları: ad · kalkış-varış · küçük harita · mesafe · süre ·
      // son kullanım · eklenen mekân · ziyaret edilen mekân
      var uclar=(r.stops||[]).length>=2 ? r.stops[0].ad+' → '+r.stops[r.stops.length-1].ad : '';
      return '<li class="yg-sv-card'+(r.favori?' is-fav':'')+'" data-id="'+r.id+'">'+
        '<div class="yg-sv-name"><i class="fa-solid fa-route"></i><span>'+r.ad+'</span>'+
          '<button class="yg-sv-fav" type="button" aria-label="Favorilere ekle" aria-pressed="'+(r.favori?'true':'false')+'">'+
            '<i class="'+(r.favori?'fa-solid':'fa-regular')+' fa-star"></i></button></div>'+
        (uclar?'<div class="yg-sv-ends">'+uclar+'</div>':'')+
        miniMap(r)+
        '<div class="yg-sv-meta">'+(r.stops||[]).length+' durak<span class="dot"></span>'+nv+' mekân'+
          (nv>0?'<span class="dot"></span>'+vc+' ziyaret':'')+
          (r.km!=null?'<span class="dot"></span>'+fmtDist(r.km):'')+
          (r.dakika!=null?'<span class="dot"></span>'+fmtDakika(r.dakika):'')+'</div>'+
        '<div class="yg-sv-date"><i class="fa-regular fa-clock"></i> Son kullanım: '+fmtDate(r.sonKullanim||r.ts)+'</div>'+
        '<label class="yg-sv-trip"><i class="fa-regular fa-calendar"></i> Yolculuk tarihi'+
          '<input type="date" class="yg-sv-trip-i" value="'+(r.yolculukTarihi||'')+'"></label>'+
        prog+
        '<div class="yg-sv-acts">'+
          '<button class="yg-sv-btn yg-sv-load" type="button"><i class="fa-solid fa-route"></i> Tekrar Kullan</button>'+
          '<button class="yg-sv-btn yg-sv-edit" type="button"><i class="fa-solid fa-pen"></i> Düzenle</button>'+
          '<button class="yg-sv-btn yg-sv-copy" type="button"><i class="fa-regular fa-copy"></i> Kopyala</button>'+
          '<button class="yg-sv-btn yg-sv-share" type="button"><i class="fa-solid fa-share-nodes"></i> Paylaş</button>'+
          (nv>0?'<button class="yg-sv-btn yg-sv-check" type="button" aria-label="Ziyaretleri göster"><i class="fa-solid fa-list-check"></i> Ziyaretler</button>':'')+
          '<button class="yg-sv-btn yg-sv-del" type="button" aria-label="Güzergâhı sil"><i class="fa-solid fa-trash-can"></i></button>'+
        '</div>'+
        '<div class="yg-sv-confirm" hidden><span>Bu güzergâhı sil?</span><button class="yg-sv-cancel" type="button">Vazgeç</button><button class="yg-sv-yes" type="button">Sil</button></div>'+
        checklist+
      '</li>';
    }).join('');
  }

  /* KAYIT KİMLİĞİ TİP-BAĞIMSIZ KARŞILAŞTIRILIR.
     Kayıt yerelken id motorun ürettiği DİZGİydi ('r1a2b3_0'); sunucu deposuna
     geçilince gerçek satır kimliği SAYI oldu (route_plans.id). Kart kimliğini
     ise DOM taşır (`data-id`) ve `getAttribute` her zaman dizge döndürür —
     dolayısıyla `'4' === 4` yanlış çıkıyor, `getRec` undefined dönüyor ve
     kayıtlı güzergâh kartındaki HER eylem (Tekrar Kullan · Düzenle · Kopyala ·
     Paylaş · Favori · Sil · ziyaret işareti) sessizce hiçbir şey yapmıyordu.
     Ölçüldü: 12 uçtan 5'i (paylas/ziyaret/PATCH/DELETE + yükleme) hiç
     çağrılmıyordu. Karşılaştırma tek noktadan dizgeye indirilir. */
  function sameId(a,b){ return String(a)===String(b); }
  function getRec(id){ return savedRoutes.filter(function(r){return sameId(r.id,id);})[0]; }
  function deleteRoute(id){
    var rec=getRec(id);
    savedRoutes=savedRoutes.filter(function(r){return !sameId(r.id,id);});
    if(visited[id]){ delete visited[id]; lsSet(KEY_VIS,visited); }   // route-scoped ziyaret de temizlensin
    updateSavedCount(); renderSaved();
    if(rec&&rec.sunucu&&sunucuDepo){
      apiFetch(ROUTE_CFG.uclar.guzergahlar+'/'+id,{method:'DELETE'})
        .catch(function(){ geoToast('Güzergâh silinemedi. Lütfen tekrar dene.','fa-triangle-exclamation'); sunucuKayitlariYukle(); });
    } else {
      lsSet(KEY_ROUTES,savedRoutes);
    }
  }
  function loadRoute(rec){
    // `alt` GERİYE DÖNÜK: eski kayıtta (ve sunucu kaydında, orada kolon yok)
    // alanı bulunmaz → undefined kalır, stopLabel yalnız `ad` basar; bugünkü
    // davranış aynen korunur.
    // `il` KORUNUR (Karar 5) — yeniden `tur`den türetilmez, doğrudan taşınır
    // (stopIl() `c.il` doluysa onu aynen döner); yoksa (eski kayıt) null kalır.
    stops=(rec.stops||[]).map(function(s){return {ad:s.ad,alt:s.alt||null,il:s.il||null,lat:s.lat,lng:s.lng};});
    while(stops.length<2)stops.push(null);
    // ESKİ kayıtta `dada` alanı bulunabilir; okunmaz, taşınmaz — sessizce
    // yok sayılır (A1 sonrası tüketici yüzeyi kalmadı). Kırılma yok.
    // VERİ KAYBI DÜZELTİLDİ (2026-08-07, K2 2. dilim — Beyar bulgusu): bu satır
    // `id` (mekân FK'si), `stopId`, `molaDk`/`sapmaDk`/`sapmaKm`i TAŞIMIYORDU.
    // Sonuç: kayıtlı rota yüklenip TEKRAR kaydedilince buildRecord→recToPayload
    // bu alanları `undefined` okuyor, `mekan_id`/`mola_dk`/`sapma_dk`/`sapma_km`
    // sunucuya NULL gidiyor, SaveRoutePlan durağı FK'siz "serbest nokta"ya
    // düşürüyordu — ÖLÇÜLDÜ (route_plan_stops.stoppable_id/detour_minutes/
    // detour_km ilk kayıtta dolu, tekrar kayıtta NULL). `rec.venues` (server
    // payload()'ından `planToRec` ile gelir) bu alanların HEPSİNİ zaten taşır —
    // burada yalnız aktarılmıyordu.
    selectedVenues=(rec.venues||[]).map(function(v){return {id:v.id,stopId:v.stopId,ad:v.ad,konum:v.konum,il:v.il||null,lat:v.lat,lng:v.lng,img:v.img,cat:v.cat,puan:v.puan,molaDk:v.molaDk,sapmaDk:v.sapmaDk,sapmaKm:v.sapmaKm};});
    if(rec.tolerans){ tolId=rec.tolerans; if(rec.ozelKm!=null)ozelKm=rec.ozelKm; corridor=aktifKoridorKm(); }
    else if(rec.corridor){ tolId='ozel'; ozelKm=rec.corridor; corridor=rec.corridor; }   // eski kayıt (km eksenli) → özel mesafeye taşınır
    if(corrSlider)corrSlider.value=ozelKm;
    nameEdited=true; if(saveNameEl)saveNameEl.value=rec.ad;   // yüklenen adı koru (re-save'de override)
    renderStops();
    selectTab('route');
    activeRouteId=rec.id;                                    // (b) ziyaret bağlamı — buildRoute/draw'dan ÖNCE: spawnVenues→venueIcon ziyaret pinini bu id'den okur
    clearRoute();                                            // B-1 stale fix: eski çizgi/mekan pinleri/zoom artığını temizle
    placeStopMarkers();                                      // yeni durak pinleri (clearRoute eskileri sildi)
    if(rec.poly && rec.poly.length){                         // KALICI geometri → ANINDA, ağ-bağımsız sadık görüntüleme (B-3)
      routeSource='gercek';
      currentRoutes=[{poly:rec.poly, km:(rec.km!=null?rec.km:null), dakika:(rec.dakika!=null?rec.dakika:null)}];
      activeIdx=0; route.poly=rec.poly;
      drawRoutes(); updateSummary(); renderAltList(); refreshThreshold(); spawnVenues(); ensureDashExpanded(); fitActive();   /* AUTO-EXPAND: kayıtlı güzergah yüklendi → kapalıysa yumuşak aç */
      /* Kayıtlı geometri ANINDA çizildi (ağ beklenmedi). Koridor mekânları
         için sunucudan yalnız TOKEN alınır — aynı durak zinciri olduğu için
         yanıt önbellekten döner. Başarısız olursa kayıtlı çizim OLDUĞU GİBİ
         kalır (§13: hata sayfayı bozmaz), yalnız mekân listesi boş görünür. */
      osrmRoute().then(function(){ loadVenues(); }).catch(function(){});
    } else {                                                 // eski poly'siz kayıt → fallback canlı-OSRM, AMA önce yeni stops'a fit + spinner (boşlukta stale yok)
      fitStops(); buildRoute();
    }
  }
  if(savedListEl)savedListEl.addEventListener('click',function(e){
    var card=e.target.closest('.yg-sv-card'); if(!card)return;
    var id=card.getAttribute('data-id');
    if(e.target.closest('.yg-sv-load')){ var r=getRec(id); if(r){ r.sonKullanim=Date.now(); if(!r.sunucu)lsSet(KEY_ROUTES,savedRoutes); loadRoute(r); } return; }
    if(e.target.closest('.yg-sv-edit')){                       // §12 Düzenle — yükle + adı düzenlemeye aç
      var re=getRec(id); if(re){ re.sonKullanim=Date.now(); if(!re.sunucu)lsSet(KEY_ROUTES,savedRoutes); loadRoute(re);
        if(saveNameEl){ saveNameEl.focus(); saveNameEl.select(); } }
      return;
    }
    if(e.target.closest('.yg-sv-copy')){                       // §12 Kopyala — yeni kayıt, aynı içerik
      var rc=getRec(id);
      if(rc){
        var kopya=JSON.parse(JSON.stringify(rc));
        kopya.ad=(rc.ad+' (kopya)').slice(0,64); kopya.ts=Date.now(); kopya.sonKullanim=Date.now(); kopya.favori=false;
        if(rc.sunucu&&sunucuDepo){
          // Sunucuda kopya = YENİ kayıt (POST). Yerelde id uydurulmaz.
          apiFetch(ROUTE_CFG.uclar.guzergahlar,{method:'POST',body:JSON.stringify(recToPayload(kopya))})
            .then(function(j){ savedRoutes.push(planToRec(j.guzergah)); geoToast('“'+kopya.ad+'” oluşturuldu','fa-circle-check'); updateSavedCount(); renderSaved(); })
            .catch(function(){ geoToast('Kopya oluşturulamadı.','fa-triangle-exclamation'); });
        } else {
          kopya.id='r'+Date.now().toString(36)+'_'+savedRoutes.length;
          savedRoutes.push(kopya); lsSet(KEY_ROUTES,savedRoutes);
          geoToast('“'+kopya.ad+'” oluşturuldu','fa-circle-check'); updateSavedCount(); renderSaved();
        }
      }
      return;
    }
    if(e.target.closest('.yg-sv-share')){ var rs=getRec(id); if(rs)paylasKayit(rs); return; }
    if(e.target.closest('.yg-sv-fav')){                        // §12 Favoriler kategorisi
      var rf=getRec(id);
      if(rf){
        rf.favori=!rf.favori; renderSaved();
        if(rf.sunucu&&sunucuDepo){
          apiFetch(ROUTE_CFG.uclar.guzergahlar+'/'+id,{method:'PATCH',body:JSON.stringify(recToPayload(rf))})
            .catch(function(){ rf.favori=!rf.favori; renderSaved(); geoToast('Favori güncellenemedi.','fa-triangle-exclamation'); });
        } else { lsSet(KEY_ROUTES,savedRoutes); }
      }
      return;
    }
    if(e.target.closest('.yg-sv-del')){ var cf=card.querySelector('.yg-sv-confirm'); if(cf)cf.hidden=false; return; }
    if(e.target.closest('.yg-sv-cancel')){ var cf2=card.querySelector('.yg-sv-confirm'); if(cf2)cf2.hidden=true; return; }
    if(e.target.closest('.yg-sv-yes')){ deleteRoute(id); return; }
    if(e.target.closest('.yg-sv-check')){
      var btn=e.target.closest('.yg-sv-check'), ul=card.querySelector('.yg-sv-venues');
      if(ul){ var show=ul.hidden; ul.hidden=!show; btn.classList.toggle('open',show); }
      return;
    }
    var vrow=e.target.closest('.yg-sv-vrow');
    if(vrow){                                                // CHECKPOINT toggle — route-scoped, kalıcı
      var ad=decodeURIComponent(vrow.getAttribute('data-ad'));
      visited[id]=visited[id]||{};
      if(visited[id][ad]){ delete visited[id][ad]; vrow.classList.remove('on'); }
      else { visited[id][ad]=true; vrow.classList.add('on'); }
      // Sunucu kaydında ziyaret DURAK SATIRINDA tutulur (route_plan_stops.
      // visited_at) — rota kapsamlıdır, aynı mekân başka güzergâhta
      // etkilenmez. Yerel harita yine tazelenir ki arayüz anında tepki versin.
      var kayit=getRec(id);
      if(kayit&&kayit.sunucu&&sunucuDepo){
        var durak=(kayit.venues||[]).filter(function(v){return vid(v)===ad;})[0];
        if(durak&&durak.stopId){
          apiFetch(ROUTE_CFG.uclar.guzergahlar+'/'+id+'/durak/'+durak.stopId+'/ziyaret',{method:'POST'})
            .catch(function(){ geoToast('Ziyaret işareti kaydedilemedi.','fa-triangle-exclamation'); });
        }
      } else {
        lsSet(KEY_VIS,visited);
      }
      // ilerleme metnini/çubuğunu güncelle (checklist'i kapatmadan)
      var rec=getRec(id); if(rec){ var nv=(rec.venues||[]).length, vc=visitCount(rec), done=(nv>0&&vc===nv);
        var bar=card.querySelector('.yg-sv-prog-bar>span'), txt=card.querySelector('.yg-sv-prog-txt');
        if(bar)bar.style.width=Math.round(vc/nv*100)+'%';
        if(txt){ txt.className='yg-sv-prog-txt'+(done?' done':''); txt.innerHTML=done?'<i class="fa-solid fa-circle-check"></i> Tümü ziyaret edildi ('+nv+'/'+nv+')':vc+'/'+nv+' ziyaret edildi'; }
      }
      if(sameId(id,activeRouteId)){ spawnVenues(); if(detailVenue)updateVisitBtn(detailVenue); }   // bu rota haritada yüklüyse pin/sol-liste/detay da tazelensin (çift entry tutarlı); kimlik dizge/sayı olabilir → sameId
      return;
    }
  });
  // §12 kategori sekmeleri + yolculuk tarihi (kullanıcı verir; sistem atamaz)
  if(savedTabsEl)savedTabsEl.addEventListener('click',function(e){
    var c=e.target.closest('.yg-fl-chip'); if(!c)return;
    savedKat=c.getAttribute('data-k'); renderSaved();
  });
  if(savedListEl)savedListEl.addEventListener('change',function(e){
    var d=e.target.closest('.yg-sv-trip-i'); if(!d)return;
    var card=d.closest('.yg-sv-card'); if(!card)return;
    var rec=getRec(card.getAttribute('data-id')); if(!rec)return;
    var onceki=rec.yolculukTarihi||null;
    rec.yolculukTarihi=d.value||null; renderSavedTabs();
    /* §12 "Yaklaşan Yolculuklar" sekmesi bu tarihten beslenir. Kayıt sunucuda
       duruyorsa tarih de SUNUCUYA yazılır — eskiden yalnız localStorage'a
       yazılıyordu ve sayfa yenilenince (liste hesaptan geldiği için) tarih
       kayboluyordu. Favori kalemi zaten bu deseni kullanıyor; ikisi aynı
       yolu izler. */
    if(rec.sunucu&&sunucuDepo){
      apiFetch(ROUTE_CFG.uclar.guzergahlar+'/'+rec.id,{method:'PATCH',body:JSON.stringify(recToPayload(rec))})
        .catch(function(){ rec.yolculukTarihi=onceki; renderSaved(); geoToast('Yolculuk tarihi kaydedilemedi.','fa-triangle-exclamation'); });
    } else { lsSet(KEY_ROUTES,savedRoutes); }
  });
  function paylasMetni(rec,url){
    var uclar=(rec.stops||[]).length>=2?rec.stops[0].ad+' → '+rec.stops[rec.stops.length-1].ad:rec.ad;
    var metin=rec.ad+' · '+uclar+(rec.km!=null?' · '+fmtDist(rec.km):'');
    track('route_shared',{kaynak:'kayitli',mekan:(rec.venues||[]).length});
    if(navigator.share){ navigator.share({title:'Dada Route — '+rec.ad,text:metin,url:url}).catch(function(){}); return; }
    if(navigator.clipboard){ navigator.clipboard.writeText(metin+' — '+url).then(function(){ geoToast('Güzergâh bağlantısı kopyalandı','fa-circle-check'); },function(){}); return; }
    geoToast('Bağlantı: '+url,'fa-link');
  }
  /* Sunucu kaydında paylaşım GERÇEK bir adrestir: uç bir `share_token` üretir
     ve /dada-route/g/{token} güzergâhı salt-okuma açar. Token'ın kendisi
     yetkidir — sahibinin adı/e-postası paylaşılmaz. Misafirin yerel kaydında
     böyle bir adres YOKTUR; o durumda sayfanın kendi adresi paylaşılır
     (bugünkü davranış), uydurma bağlantı üretilmez. */
  function paylasKayit(rec){
    if(rec.sunucu&&sunucuDepo){
      apiFetch(ROUTE_CFG.uclar.guzergahlar+'/'+rec.id+'/paylas',{method:'POST'})
        .then(function(j){ paylasMetni(rec,j.adres||(location.origin+location.pathname)); })
        .catch(function(){ paylasMetni(rec,location.origin+location.pathname); });
      return;
    }
    paylasMetni(rec,location.origin+location.pathname);
  }

  // başka sekmede değişirse senkronla (cross-page güncellik — CLAUDE.md dersi)
  window.addEventListener('storage',function(ev){
    if(ev.key===KEY_ROUTES){ savedRoutes=lsGet(KEY_ROUTES,[]); if(!Array.isArray(savedRoutes))savedRoutes=[]; updateSavedCount(); if(viewSaved && !viewSaved.hidden)renderSaved(); }
    if(ev.key===KEY_VIS){ visited=lsGet(KEY_VIS,{})||{}; if(viewSaved && !viewSaved.hidden)renderSaved();
      if(activeRouteId){ spawnVenues(); if(detailVenue)updateVisitBtn(detailVenue); } }   // yüklü rota açıksa harita pinleri + sol liste + detay ziyaret durumunu da tazele
  });

  /* =====================================================================
     §17 DEMO MODU ŞERİDİ
     "API anahtarı sağlanmamışsa gerçek API çalışıyormuş gibi davranma.
      Açıkça belirtilmiş demo modu oluştur."
     Şerit hangi verinin gerçek, hangisinin tahmin/eksik olduğunu tek yerde
     söyler. Anahtar bağlanıp yetenekler açılınca kendiliğinden kaybolur.
     §18: pilot güzergâhlar da burada, tek tıkla kurulur.
     ===================================================================== */
  var demoEl=document.getElementById('ygDemo'), demoNoteEl=document.getElementById('ygDemoNote'),
      pilotEl=document.getElementById('ygPilots');
  /* §17 — pilotlar HER ZAMAN basılır (gerçek veri, demo şeridinden bağımsız).
     Şerit yalnız SAĞLAYICI demo iken görünür ve artık "mekânlar örnek veri"
     DEMEZ: mekânlar gerçek `venues` kayıtlarıdır. Eksik olan tek şey
     sağlayıcı yetenekleridir; §27 gereği yalnız gerçekten eksik olan yazılır. */
  function renderPilots(){
    if(!pilotEl)return;
    pilotEl.innerHTML=(ROUTE_CFG.pilotGuzergahlar||[]).map(function(p,i){
      return '<button class="yg-pilot" type="button" data-p="'+i+'">'+p.ad+'</button>';
    }).join('');
  }
  function renderDemoBar(){
    renderPilots();
    if(!demoEl)return;
    if(!DEMO_MODE){ demoEl.hidden=true; return; }
    demoEl.hidden=false;
    var yetenek=ROUTE_CFG.provider.yetenek||{}, eksik=[];
    if(!yetenek.routeMatrix)   eksik.push('sapma süreleri gerçek yol ağı yerine tahmin');
    if(!yetenek.ucretliYol)    eksik.push('ücretli yol bilgisi yok');
    if(!yetenek.feribot)       eksik.push('feribot bilgisi yok');
    if(!yetenek.trafik)        eksik.push('trafik bilgisi yok');
    if(demoNoteEl)demoNoteEl.textContent='Rota '+ROUTE_CFG.provider.adi+' ile çiziliyor'+
      (eksik.length?('. Bu sürümde: '+eksik.join(' · ')+'.'):'.');
  }
  // §18 — pilot güzergâh tek tıkla kurulur. Uçlar boot ile TAM NESNE gelir
  // (route_presets → route_places FK), bu yüzden ad eşleştirmesi yapılmaz.
  if(pilotEl)pilotEl.addEventListener('click',function(e){
    var b=e.target.closest('.yg-pilot'); if(!b)return;
    var p=(ROUTE_CFG.pilotGuzergahlar||[])[+b.getAttribute('data-p')];
    if(!p||!p.from||!p.to)return;
    stops=[{id:p.from.id,ad:p.from.ad,alt:p.from.alt||null,lat:p.from.lat,lng:p.from.lng},
           {id:p.to.id,ad:p.to.ad,alt:p.to.alt||null,lat:p.to.lat,lng:p.to.lng}];
    activeRouteId=null; renderStops(); placeStopMarkers(); maybeBuild();
    track('route_form_started',{kaynak:'pilot',pilot:b.textContent});
  });

  // init: demo şeridi + filtre şeritleri + tolerans + kayıt sayacı
  renderDemoBar(); renderFilterBars(); renderTolerans();
  updateSavedCount(); renderSaved();
  // Üyede kayıtlar hesaptan gelir (localStorage değil).
  sunucuKayitlariYukle();
  /* Paylaşılan güzergâh (/dada-route/g/{token}) — sunucu kaydı `data-shared`
     ile basar; kayıt listesine EKLENMEZ (başkasının güzergâhı), doğrudan
     haritaya yüklenir. */
  try{
    var paylasilan=mapEl.getAttribute('data-shared');
    if(paylasilan){
      var pj=JSON.parse(paylasilan);
      loadRoute(planToRec({
        id:'paylasim', ad:pj.ad, kalkis:pj.kalkis, varis:pj.varis,
        tolerans_dk:pj.tolerans_dk, tolerans_km:null, mesafe_m:pj.mesafe_m, sure_sn:pj.sure_sn,
        geometri:null, duraklar:pj.duraklar||[], guncellendi:null
      }));
    }
  }catch(e){}

})();
