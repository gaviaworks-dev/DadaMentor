/* =====================================================================
   DadaGastro MAKET — "Menüyü Kur" veri yolu
   ---------------------------------------------------------------------
   Bu bir ARAYÜZ PROTOTİPİ parçasıdır. Arka uç yok. Emsal:
   `maket-auth.js` — dinamik siteyi statik kopyada taklit eden, kabul
   edilmiş desen. Aynı kipte yazıldı: AYRI dosya, sayfanın kendi JS'ine
   DOKUNMAZ, markup üretmez, CSS yazmaz.

   ── NEDEN VAR (ölçüldü, tahmin değil) ────────────────────────────────
   "Menüm" düzenleme görünümünün TAMAMI zaten makette duruyor —
   `#menuDetail` (`hidden`), `#mdHead`/`#mdTitleText`/`#mdTitlePen`,
   `#mdRenameBox`, `.menu-bar > #mdMeta`, `#mdSave`/`#mdCook`, `#mdSet`,
   `#rpOverlay`+`#rpModal`. Görünmemesinin sebebi eksik markup DEĞİL,
   eksik VERİ YOLU:

     #scBuild → buildMenu() → fetch(bnpConfig.menuStoreUrl, POST)
                            → fetch(menuAttachUrlTemplate, POST) × n
                            → location.href = menuDeepLinkTemplate

   Statik kopyada arka uç olmadığı için bu istekler düşüyor. ÖLÇÜLDÜ
   (konsol, 127.0.0.1:8779):
     Access to fetch at 'https://dadagastro.com/menuler' from origin
     'http://127.0.0.1:8779' has been blocked by CORS policy
   `.catch(function(){})` hatayı yuttuğu için kullanıcıya HİÇBİR ŞEY
   olmuyor gibi görünüyor.

   ── YÖNTEM ───────────────────────────────────────────────────────────
   `window.fetch` SARMALANIR. Yalnız `window.bnpConfig`in menü uçları
   yakalanır; başka her istek olduğu gibi geçirilir. Sayfanın kendi
   `bugun-ne-pisirsem.js` dosyasına tek satır dokunulmaz.

   ── JSON ŞEKLİ TAHMİN EDİLMEDİ ───────────────────────────────────────
   Sayfanın kendi üreticilerinden OKUNDU (bugun-ne-pisirsem.js):
     render(data)        → data.id · data.name · data.total_minutes ·
                           data.courses[] · data.course_options{}
     courseCardHtml(c)   → c.recipe_id · c.recipe_slug · c.course_key ·
                           c.course_label · c.cover · c.url · c.title
     factsHtml(row)      → row.total_time_min · row.difficulty ·
                           row.servings_label · row.cost_tier · row.cost_label
     courseIcon(key)     → course_options[key].icon
     renderPool()        → { results: [ …factsHtml alanları + id·title·cover ] }

   ── VERİ NEREDEN GELİYOR ─────────────────────────────────────────────
   🔴 UYDURULMADI. Hepsi sayfanın KENDİ DOM'undan okunuyor:
     tarif      `#scGrid .rp-card[data-recipe-id|-slug|-title|-cat|-cover]`
     süre       `.rp-meta` içindeki `.fa-clock` satırı  ("55 dk" → 55)
     zorluk     `.fa-gauge-simple` satırı               ("Çok Kolay")
     porsiyon   `.fa-utensils` satırı                   ("4 kişilik")
     bütçe      `.r-cost b.rc-on` SAYISI + `title`      (tier + etiket)
     adres      `.rp-fig[href]`
     kap türü   `#scTabs` rayı — sayfanın kendisi ona
                `aria-label="Kap kategorisi"` diyor: slug · etiket · ikon

   🔴 KAYITLI SAPMA — `course_options` KAYNAĞI FARKLI.
      Canlıda bu liste sunucudan geliyor (`MenuDetailController`) ve
      GİRİŞ ARKASINDA: `GET /bugun-ne-pisirsem/menu/{id}` anonim **401**
      döndürdü (ölçüldü). Gerçek kap taksonomisi görülemedi. Bu yüzden
      makette sayfanın KENDİ "Kap kategorisi" rayı kullanılıyor. Uydurma
      etiket/ikon YOK; hepsi maketin kendi markup'ında yazılı.
      Sapma raporda ayrıca bildirildi.

   Kap türü türetimi de uydurma değil: sayfanın kendi şerhi söylüyor —
   "course_key pivot'u boş kalan bu menüler CookingSessionService'te
    KATEGORİ-TÜREVLİ fallback'le kap türü kazanır" (bugun-ne-pisirsem.js
   başlık bloğu). Burada da kap türü tarifin kendi kategorisinden gelir.

   ── SUNULMAYAN UÇLAR (bilerek) ───────────────────────────────────────
     · `menuFromCuratedSetUrlTemplate` — hazır menü kartlarında tarif
       LİSTESİ yok (`.hm-card` yalnız başlık · sayı · 4 küçük görsel ·
       süre · etiket taşıyor; 94 kartın hiçbirinde tarif kimliği yok,
       makette başka hiçbir dosyada da geçmiyor). Sunmak, hangi tarifin
       hangi menüde olduğunu UYDURMAK olurdu.
     · `cooking*` — adım metinleri gerçek `RecipeStep` içeriği. Uydurma
       pişirme talimatı yazılmaz.
   İkisi de olduğu gibi geçirilir; bugünkü davranış değişmez.
   ===================================================================== */
(function () {
  'use strict';

  var ANAHTAR = 'dg-maket-menu';        /* sessionStorage kovası */

  /* ── TEPSİ HAVUZUNUN ANLIK GÖRÜNTÜSÜ · 🔴 SIRA HAYATİ ───────────────
     ÖLÇÜLDÜ 2026-09-04 (konsol + render DOM, 8779):
       GET https://dadagastro.com/bugun-ne-pisirsem/havuz?mod=gunluk-pratik
       → "blocked by CORS policy" → sayfanın kendi `.catch`i
         `#scGrid.innerHTML`i HATA PANOSUYLA EZİYOR:
         "Bağlantı kurulamadı, tekrar dene." · kart 24 → 0
     Kart 0 olunca tepsiye hiçbir şey eklenemiyor; `.sc-side` `.show`
     sınıfını hiç almıyor (`renderTray`: `if (n > 0) side.classList.add('show')`),
     yani TEPSİ HİÇ AÇILMIYOR — içindeki sağ ok (`#scMin`) ve
     "Menüyü Kur" (`#scBuild`) ekranda hiç görünmüyor. Beyar'ın
     "tepside sağ ok silinmiş" dediği belirtinin kökü bu; markup'ta
     düğme DURUYOR (canlı · dump · yerel · deploy dördünde de birebir,
     ölçüldü).

     Bu yüzden ızgaranın ilk hâli, sayfanın kendi betiği koşmadan ÖNCE
     kopyalanır. maket-menu.js `defer` ve `bugun-ne-pisirsem.js`ten ÖNCE
     bağlı (d12'nin kendi şartı) — `defer`ler belge sırasında koşar, yani
     bu satır ilk çalışan koddur. Kartlar UYDURULMAZ: sayfanın kendi
     statik markup'ıdır. */
  var HAVUZ_ILK = (function () {
    var g = document.getElementById('scGrid');
    return g ? g.innerHTML : '';
  })();
  var HAVUZ_SAYAC_ILK = (function () {
    var c = document.getElementById('scCount');
    return c ? c.textContent.trim() : '';
  })();

  var ozgunFetch = window.fetch ? window.fetch.bind(window) : null;
  if (!ozgunFetch) return;

  /* ── depo ───────────────────────────────────────────────────────────
     🔴 sessionStorage ŞART, bellek YETMEZ: `buildMenu` son adımda
     `window.location.href = menuDeepLinkTemplate` diyor — yani TAM SAYFA
     yeniden yükleme yapıyor (canlının davranışı; sayfanın kendi kodu,
     değiştirilmedi). Bellekteki menü o yüklemede ölürdü ve dönüşte
     `openMenuFromQueryParam` boş bulurdu. */
  function depoOku() {
    try { return JSON.parse(sessionStorage.getItem(ANAHTAR) || '{}'); }
    catch (e) { return {}; }
  }
  function depoYaz(d) {
    try { sessionStorage.setItem(ANAHTAR, JSON.stringify(d)); } catch (e) {}
  }
  function menuOku(id) { return depoOku()[String(id)] || null; }
  function menuYaz(m) { var d = depoOku(); d[String(m.id)] = m; depoYaz(d); }

  /* ── sayfanın kendi verisi ──────────────────────────────────────── */

  /* Bir `.rp-card`ı `factsHtml`in beklediği satıra çevirir.
     Alan adları sayfanın kendi üreticisinden; değerler kartın kendi
     DOM'undan. Bulunamayan alan ATLANIR (null) — `factsHtml` zaten
     her alanı `if` ile koruyor, boş satır basmaz. */
  function karttanTarif(kart) {
    var q = function (sec) { var e = kart.querySelector(sec); return e ? e.textContent.trim() : null; };
    /* `.rp-meta` satırları ikonla ayrılıyor; ikon sınıfı alanın kimliği */
    var alan = function (ikon) {
      var i = kart.querySelector('.rp-meta ' + ikon);
      if (!i) return null;
      var s = i.parentElement && i.parentElement.querySelector('.rf-txt');
      return s ? s.textContent.trim() : null;
    };
    var sure = alan('.fa-clock');
    var maliyet = kart.querySelector('.r-cost');
    var bag = kart.querySelector('.rp-fig[href]') || kart.querySelector('h4 a[href]');
    return {
      id:              Number(kart.getAttribute('data-recipe-id')),
      slug:            kart.getAttribute('data-recipe-slug'),
      title:           kart.getAttribute('data-recipe-title') || q('h4'),
      cat:             kart.getAttribute('data-recipe-cat'),
      cover:           kart.getAttribute('data-recipe-cover') || '',
      url:             bag ? bag.getAttribute('href') : '#',
      /* "55 dk" → 55 · `factsHtml` sayının yanına " dk"yı kendi ekliyor */
      total_time_min:  sure ? (parseInt(sure, 10) || null) : null,
      difficulty:      alan('.fa-gauge-simple'),
      servings_label:  alan('.fa-utensils'),
      cost_tier:       maliyet ? maliyet.querySelectorAll('b.rc-on').length : null,
      cost_label:      maliyet ? (maliyet.getAttribute('title') || '') : null,
    };
  }

  /* Sayfadaki bütün tarif kartları — id ve slug ile aranabilir.
     `#scGrid` dışında `#rpGrid`e basılanlar da sayılır (havuzdan eklenen
     tarif sonra "Değiştir"e konu olabiliyor). */
  function tarifIndeksi() {
    var ix = { id: {}, slug: {}, hepsi: [] };
    var kartlar = document.querySelectorAll('.rp-card[data-recipe-id][data-recipe-slug]');
    for (var i = 0; i < kartlar.length; i++) {
      var t = karttanTarif(kartlar[i]);
      if (!t.id || !t.slug || ix.id[t.id]) continue;
      ix.id[t.id] = t; ix.slug[t.slug] = t; ix.hepsi.push(t);
    }
    return ix;
  }

  /* Kap türleri — sayfanın kendi "Kap kategorisi" rayından.
     `courseIcon` `course_options[key].icon` okuyor; ray her kalemde
     gerçek bir Font Awesome sınıfı taşıyor, ikon uydurulmuyor. */
  function kapSecenekleri() {
    var o = {};
    var dt = document.querySelectorAll('#scTabs .dt[data-cat]');
    for (var i = 0; i < dt.length; i++) {
      var k = dt[i].getAttribute('data-cat');
      if (!k) continue;                                  /* "Tümü" kap değil */
      var ikon = dt[i].querySelector('i');
      var sinif = ikon ? (ikon.className.match(/fa-[a-z0-9-]+(?!.*fa-solid)/g) || []) : [];
      o[k] = {
        label: dt[i].textContent.trim(),
        icon: (sinif.filter(function (c) { return c !== 'fa-solid'; })[0]) || 'fa-utensils',
      };
    }
    return o;
  }

  /* Tarifin kap türü — KATEGORİSİNDEN türetilir (sayfanın kendi şerhi).
     Ray'da etiketi tutan kalem varsa onun slug'ı kullanılır; yoksa
     tarifin kendi kategori adı hem etiket hem anahtar olur (slug'lanır).
     Hiçbir durumda yeni bir kategori ADI icat edilmez. */
  function kapTuru(tarif, secenek) {
    var kat = (tarif.cat || '').trim();
    for (var k in secenek)
      if (secenek[k].label.toLocaleLowerCase('tr') === kat.toLocaleLowerCase('tr'))
        return { key: k, label: secenek[k].label };
    if (!kat) return { key: 'diger', label: 'Kap' };
    var slug = kat.toLocaleLowerCase('tr')
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return { key: slug || 'diger', label: kat };
  }

  /* Tarif → kap kaydı (courseCardHtml + factsHtml'in beklediği şekil) */
  function kapYap(tarif, secenek) {
    var t = kapTuru(tarif, secenek);
    return {
      recipe_id: tarif.id, recipe_slug: tarif.slug,
      course_key: t.key, course_label: t.label,
      title: tarif.title, url: tarif.url, cover: tarif.cover,
      total_time_min: tarif.total_time_min, difficulty: tarif.difficulty,
      servings_label: tarif.servings_label,
      cost_tier: tarif.cost_tier, cost_label: tarif.cost_label,
    };
  }

  /* `render(data)`ın okuduğu üst alanlar.

     🔴 `course_options` RAYIN TAMAMI DEĞİL — ÖLÇÜLMÜŞ DARALTMA.
     Ray 30 kalem taşıyor ama sayfadaki tarif havuzu yalnız 12 kategoriyi
     dolduruyor (ölçüldü: 24 kart · 12 farklı kategori). Tamamını basmak
     iki somut kusur üretiyordu:
       1 · "Kap Ekle" kutusu 30 çiple kabararak ızgaranın en uzun hücresi
           oldu; kap kartları ona uyup gövdelerinde boş alan bıraktı
           (ekran görüntüsü: f4a-yerel-sonra-02-menum.png).
       2 · 18 çip ÖLÜ — havuz o kategoride tarif bulamayıp
           "Bu kap türünde uygun tarif bulunamadı." panosunu açıyordu.
     Daraltma yeni etiket UYDURMAZ: rayın kendi kalemlerinin, kendi
     sırasında, havuzun gerçekten doldurabildiği alt kümesidir. Menüde
     zaten duran bir kap türü listede kalır — `courseIcon` onun ikonunu
     bu haritadan okuyor. */
  function menuTazele(m) {
    m.total_minutes = m.courses.reduce(function (t, c) { return t + (c.total_time_min || 0); }, 0);
    var tum = kapSecenekleri();
    var havuz = {};
    tarifIndeksi().hepsi.forEach(function (t) { havuz[kapTuru(t, tum).key] = true; });
    m.courses.forEach(function (c) { havuz[c.course_key] = true; });
    var o = {};
    for (var k in tum) if (havuz[k]) o[k] = tum[k];
    /* Havuzda olup rayda karşılığı olmayan kategori (ör. "Tavuk ve Hindi"
       rayda VAR ama başka bir ad rayda yoksa) — tarifin kendi adıyla girer */
    tarifIndeksi().hepsi.forEach(function (t) {
      var kt = kapTuru(t, tum);
      if (!o[kt.key]) o[kt.key] = { label: kt.label, icon: 'fa-utensils' };
    });
    m.course_options = o;
    return m;
  }

  var JSON_BASLIK = { 'Content-Type': 'application/json' };
  function cevap(govde, kod) {
    return Promise.resolve(new Response(JSON.stringify(govde),
      { status: kod || 200, headers: JSON_BASLIK }));
  }

  /* ── uç eşleme ──────────────────────────────────────────────────────
     Şablonlar (`__MENU__`, `__RECIPE__`) bnpConfig'ten OKUNUR, elle
     yazılmaz: sayfa yeniden üretilirse (deploy) adresler değişse bile
     eşleme kayar değil, config'i izler. */
  function kalip(sablon) {
    if (!sablon) return null;
    var kac = String(sablon).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    /* Dört yuva da karşılanır — `__SESSION__` ve `__SET__` yalnız
       "sunulmaz" listesinde geçiyor ama kalıp onları da tanımazsa o
       adresler HİÇ eşleşmez ve blok sessizce ölü kalırdı. */
    return new RegExp('^' + kac
      .replace('__MENU__', '(?<menu>[^/?#]+)')
      .replace('__RECIPE__', '(?<recipe>[^/?#]+)')
      .replace('__SESSION__', '(?<session>[^/?#]+)')
      .replace('__SET__', '(?<set>[^/?#]+)') + '(?:[?#].*)?$');
  }

  function govdeOku(init) {
    if (!init || !init.body) return {};
    try { return JSON.parse(init.body); } catch (e) { return {}; }
  }

  /* ═══════════════════════════════════════════════════════════════════
     PİŞİRME OTURUMU — gerçek adım verisiyle
     ---------------------------------------------------------------------
     Oturum şekli sayfanın KENDİ okuyucularından çıkarıldı (uydurulmadı):
       renderPlan   d.name · d.course_label · d.minutes · d.rest_minutes ·
                    d.why · d.start_minutes · d.lead_minutes · d.order_custom
       renderStep   step.dish_index · dish_name · course_label · is_passive ·
                    note · step_number · step_count · duration_min · title · body
       ortak        session.id · menu_name · phase · dish_plan ·
                    current_step · current_index · total_steps · progress_percent
     ═══════════════════════════════════════════════════════════════ */
  var ADIM_YOLU = 'varliklar/reference/shared/gastro-tarif-adimlari.json';
  var adimSoz = null;
  function adimlar() {
    if (!adimSoz) adimSoz = ozgunFetch(ADIM_YOLU, { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; });
    return adimSoz;
  }

  var OTURUM = 'dg-maket-pisirme';
  function oturumOku(id) {
    try { return (JSON.parse(sessionStorage.getItem(OTURUM) || '{}'))[String(id)] || null; }
    catch (e) { return null; }
  }
  function oturumYaz(o) {
    try {
      var d = JSON.parse(sessionStorage.getItem(OTURUM) || '{}');
      d[String(o.id)] = o; sessionStorage.setItem(OTURUM, JSON.stringify(d));
    } catch (e) {}
  }

  /* Plan sırası SAYFANIN KENDİ CÜMLESİNDEN: "uzun pişen ve soğuması
     gereken kaplar önce başlar; tazeliği önemli kaplar en sona kalır"
     → süreye göre AZALAN. Eşitlikte menüdeki sıra korunur (kararlı). */
  function planKur(menu, sozluk) {
    var kaplar = menu.courses.map(function (c, i) {
      var a = ((sozluk[c.recipe_slug] || {}).adim || []).slice();
      /* Süre: gerçek adım sürelerinin toplamı. Adımların hiçbirinde süre
         yoksa kartın kendi `total_time_min` değeri kullanılır — ikisi de
         maketin/donörün ölçülmüş verisi, tahmin yok. */
      var toplam = a.reduce(function (t, x) { return t + (x.duration_min || 0); }, 0);
      return {
        _sira: i, _slug: c.recipe_slug, _adim: a,
        name: c.title, course_label: c.course_label,
        minutes: toplam || c.total_time_min || 0,
        rest_minutes: 0,        /* donörde YOK — türetilmedi */
        why: '',                /* donörde YOK — türetilmedi */
      };
    });
    kaplar.sort(function (a, b) { return (b.minutes - a.minutes) || (a._sira - b._sira); });
    return kaplar;
  }

  /* `start_minutes`/`lead_minutes` çizelgenin kendisi: hepsi AYNI ANDA
     biter ("tek servis anı" — sayfanın kendi etiketi). */
  function planZamanla(kaplar, ozel) {
    var span = kaplar.reduce(function (m, d) { return Math.max(m, d.minutes); }, 0) || 1;
    var akan = 0;
    kaplar.forEach(function (d, i) {
      d.lead_minutes = d.minutes + d.rest_minutes;
      d.start_minutes = ozel ? Math.min(akan, Math.max(span - d.minutes, 0))
                             : Math.max(span - d.lead_minutes, 0);
      d.order_custom = !!ozel;
      akan += 0;                        /* özel sırada da servis anı ortak */
      d._i = i;
    });
    return kaplar;
  }

  /* Adım listesi düzleştirilir: kap kap, plan sırasında.
     🔴 ÖRGÜ (buildWeave) YOK — `is_passive` donörde işaretli değil,
        el değişimi türetilemez. Sapma şerhte ve raporda. */
  function adimDizisi(kaplar) {
    var d = [];
    kaplar.forEach(function (k, ki) {
      k._adim.forEach(function (a, ai) {
        d.push({
          dish_index: ki, dish_name: k.name, course_label: k.course_label,
          is_passive: false,
          step_number: ai + 1, step_count: k._adim.length,
          duration_min: a.duration_min || 0,
          title: a.title, body: a.body,
        });
      });
    });
    return d;
  }

  function oturumTazele(o) {
    var d = adimDizisi(o.dish_plan);
    o.total_steps = d.length;
    if (o.current_index < 0) o.current_index = 0;
    if (o.current_index > o.total_steps) o.current_index = o.total_steps;
    /* Üç evre, sayfanın kendi `renderPhase`i bunları okuyor:
         0            → 'plan'  (çizelge ekranı, "Pişirmeye Başla")
         1…toplam     → 'step'  (adım ekranı)
         bitti bayrağı→ 'done'  (kutlama ekranı) */
    o.phase = o.bitti ? 'done' : (o.current_index === 0 ? 'plan' : 'step');
    o.current_step = (o.phase === 'step') ? d[o.current_index - 1] : null;
    o.progress_percent = o.total_steps ? Math.round(o.current_index / o.total_steps * 100) : 0;
    return o;
  }

  function pisirmeBaslat(menuId) {
    return adimlar().then(function (sozluk) {
      var mn = menuOku(menuId);
      if (!mn) return cevap({ hata: 'menu-yok' }, 404);
      var kaplar = planZamanla(planKur(mn, sozluk), false);
      if (!kaplar.length) return cevap({ hata: 'kap-yok' }, 422);
      var o = oturumTazele({
        id: 'ms-' + mn.id, menu_name: mn.name, dish_plan: kaplar,
        current_index: 0, bitti: false,
      });
      oturumYaz(o);
      return cevap(o);
    });
  }

  function pisirmeIlerle(sid, yon) {
    var o = oturumOku(sid);
    if (!o) return cevap({ hata: 'oturum-yok' }, 404);
    var toplam = adimDizisi(o.dish_plan).length;
    if (yon === 'prev') {
      o.bitti = false;
      o.current_index = Math.max(0, o.current_index - 1);
    } else {
      if (o.current_index >= toplam) o.bitti = true;
      else o.current_index = o.current_index + 1;
    }
    oturumTazele(o); oturumYaz(o);
    return cevap(o);
  }

  /* Sıralama — `renderPlan`ın kendi düğmeleri:
       {action:'move', dish_index, direction:'up'|'down'} · {action:'reset'} */
  function pisirmeSirala(sid, g) {
    var o = oturumOku(sid);
    if (!o) return cevap({ hata: 'oturum-yok' }, 404);
    if (g.action === 'reset') {
      o.dish_plan.sort(function (a, b) { return (b.minutes - a.minutes) || (a._sira - b._sira); });
      planZamanla(o.dish_plan, false);
    } else if (g.action === 'move') {
      var i = Number(g.dish_index);
      var j = g.direction === 'up' ? i - 1 : i + 1;
      if (i >= 0 && j >= 0 && i < o.dish_plan.length && j < o.dish_plan.length) {
        var t = o.dish_plan[i]; o.dish_plan[i] = o.dish_plan[j]; o.dish_plan[j] = t;
      }
      planZamanla(o.dish_plan, true);
    }
    o.current_index = 0; o.bitti = false;
    oturumTazele(o); oturumYaz(o);
    return cevap(o);
  }

  /* ── SARMALAYICI ───────────────────────────────────────────────── */
  window.fetch = function (girdi, init) {
    var cfg = window.bnpConfig;
    var url = typeof girdi === 'string' ? girdi
            : (girdi && girdi.url) ? girdi.url : '';
    if (!cfg || !url) return ozgunFetch(girdi, init);

    var yontem = ((init && init.method) || (girdi && girdi.method) || 'GET').toUpperCase();
    var m;

    /* 1 · MENÜ KUR — POST menuStoreUrl → {id, …} */
    if (yontem === 'POST' && cfg.menuStoreUrl && url.split('?')[0] === cfg.menuStoreUrl.split('?')[0]) {
      var g = govdeOku(init);
      var d = depoOku();
      var yeniId = 1;
      for (var k in d) if (Number(k) >= yeniId) yeniId = Number(k) + 1;
      var menu = menuTazele({
        id: yeniId,
        /* Ad `buildMenu`de zaten hesaplanıyor (#scName ya da "Menüm") —
           burada tekrar edilmez, gövdeden okunur. */
        name: (g.name || 'Menüm'),
        subtitle: g.subtitle || null,
        courses: [],
      });
      menuYaz(menu);
      return cevap(menu, 201);
    }

    /* 2 · TARİF EKLE — POST menuAttachUrlTemplate → 200 (gövde okunmuyor) */
    if (yontem === 'POST' && (m = eslesme(cfg.menuAttachUrlTemplate, url))) {
      var mn = menuOku(m.groups.menu);
      if (!mn) return cevap({ hata: 'menu-yok' }, 404);
      var ix = tarifIndeksi();
      var tf = ix.slug[decodeURIComponent(m.groups.recipe)];
      if (tf && !mn.courses.some(function (c) { return c.recipe_slug === tf.slug; }))
        mn.courses.push(kapYap(tf, kapSecenekleri()));
      menuYaz(menuTazele(mn));
      return cevap({ ok: true });
    }

    /* 3 · MENÜYÜ GÖSTER — GET menuShowUrlTemplate → menü JSON'u
           (hem `?menu=` derin bağı hem `refresh()` buradan besleniyor) */
    if (yontem === 'GET' && (m = eslesme(cfg.menuShowUrlTemplate, url))) {
      var g3 = menuOku(m.groups.menu);
      return g3 ? cevap(menuTazele(g3)) : cevap({ hata: 'menu-yok' }, 404);
    }

    /* 4 · TARİF HAVUZU — GET menuPoolUrlTemplate?course_key=&q=
           `renderPool` `{results:[…]}` bekliyor. Havuz sayfanın KENDİ
           kartlarıdır; kap türüne göre süzülür, yoksa hepsi verilir
           (boş liste "kap türünde tarif yok" panosunu açardı — yanlış
           olurdu, çünkü tarif var, yalnız o kategoride yok). */
    if (yontem === 'GET' && (m = eslesme(cfg.menuPoolUrlTemplate, url))) {
      var sorgu = new URLSearchParams((url.split('?')[1] || ''));
      var kap = sorgu.get('course_key') || '';
      var q = (sorgu.get('q') || '').trim().toLocaleLowerCase('tr');
      var sec = kapSecenekleri();
      var mn4 = menuOku(m.groups.menu);
      var icerde = mn4 ? mn4.courses.map(function (c) { return c.recipe_slug; }) : [];
      var liste = tarifIndeksi().hepsi.filter(function (t) {
        if (icerde.indexOf(t.slug) > -1) return false;         /* menüde olan tekrar önerilmez */
        if (q && (t.title || '').toLocaleLowerCase('tr').indexOf(q) < 0) return false;
        return true;
      });
      if (kap) {
        var uygun = liste.filter(function (t) { return kapTuru(t, sec).key === kap; });
        if (uygun.length) liste = uygun;
      }
      return cevap({ results: liste.slice(0, 24) });
    }

    /* 5 · KAP EKLE — POST menuCourseAddUrlTemplate {course_key, recipe_id} */
    if (yontem === 'POST' && (m = eslesme(cfg.menuCourseAddUrlTemplate, url))) {
      var mn5 = menuOku(m.groups.menu);
      if (!mn5) return cevap({ hata: 'menu-yok' }, 404);
      var g5 = govdeOku(init);
      var t5 = tarifIndeksi().id[Number(g5.recipe_id)];
      if (t5 && !mn5.courses.some(function (c) { return c.recipe_slug === t5.slug; })) {
        var kap5 = kapYap(t5, kapSecenekleri());
        /* Kullanıcı hangi kap türü çipine bastıysa o türe girer —
           `openPicker('add', key)` o anahtarı taşıyor. */
        if (g5.course_key) {
          kap5.course_key = g5.course_key;
          var s5 = kapSecenekleri()[g5.course_key];
          if (s5) kap5.course_label = s5.label;
        }
        mn5.courses.push(kap5);
      }
      menuYaz(menuTazele(mn5));
      return cevap(mn5);
    }

    /* 6 · KAP DEĞİŞTİR — PUT menuCourseSwapUrlTemplate {recipe_id}
           URL'deki __RECIPE__ ESKİ tarifin slug'ı (sayfanın kendi şerhi:
           "data-swap/data-remove DEĞERİ recipe SLUG'ı taşır").
           Kap türü ve SIRA korunur — değişen yalnız tarif. */
    if (yontem === 'PUT' && (m = eslesme(cfg.menuCourseSwapUrlTemplate, url))) {
      var mn6 = menuOku(m.groups.menu);
      if (!mn6) return cevap({ hata: 'menu-yok' }, 404);
      var eski = decodeURIComponent(m.groups.recipe);
      var yeni = tarifIndeksi().id[Number(govdeOku(init).recipe_id)];
      for (var i6 = 0; i6 < mn6.courses.length; i6++) {
        if (mn6.courses[i6].recipe_slug !== eski) continue;
        if (!yeni) break;
        var k6 = kapYap(yeni, kapSecenekleri());
        k6.course_key = mn6.courses[i6].course_key;
        k6.course_label = mn6.courses[i6].course_label;
        mn6.courses[i6] = k6;
        break;
      }
      menuYaz(menuTazele(mn6));
      return cevap(mn6);
    }

    /* 7 · KAP ÇIKAR — DELETE menuCourseRemoveUrlTemplate */
    if (yontem === 'DELETE' && (m = eslesme(cfg.menuCourseRemoveUrlTemplate, url))) {
      var mn7 = menuOku(m.groups.menu);
      if (!mn7) return cevap({ hata: 'menu-yok' }, 404);
      var cik = decodeURIComponent(m.groups.recipe);
      mn7.courses = mn7.courses.filter(function (c) { return c.recipe_slug !== cik; });
      menuYaz(menuTazele(mn7));
      return cevap(mn7);
    }

    /* 8 · MENÜ ADI — PUT menuUpdateUrlTemplate {name}
           `saveRename` cevabı okumuyor, ardından `refresh()` çağırıyor. */
    if (yontem === 'PUT' && (m = eslesme(cfg.menuUpdateUrlTemplate, url))) {
      var mn8 = menuOku(m.groups.menu);
      if (!mn8) return cevap({ hata: 'menu-yok' }, 404);
      var ad = (govdeOku(init).name || '').trim();
      if (ad) mn8.name = ad;
      menuYaz(menuTazele(mn8));
      return cevap(mn8);
    }

    /* 10 · TEPSİ HAVUZU — GET scratchPoolUrl?mod=&kategori=&q=
           `loadScratchPool` `{html, categories, countLabel, emptyText}`
           bekliyor (sayfanın kendi kodu, okundu). Gövde SAYFANIN KENDİ
           statik kartlarıdır — `HAVUZ_ILK`, betik yüklenirken kopyalandı.

           🔴 `categories` BİLEREK GÖNDERİLMEZ. `renderCategoryRail`
           yalnız `{name, slug}` yazıyor; göndersek sayfanın kendi
           "Kap kategorisi" rayındaki İKONLAR düşerdi (ray 30 kalemin
           her birinde gerçek bir FA sınıfı taşıyor) ve `kapSecenekleri()`
           ikonsuz kalırdı — "İKON SEÇİMİ KANON KARARI DEĞİL, kaynaktan
           gelir". Alan yokken `renderCategoryRail` erken dönüyor
           (`if (!tabs || !categories) return`), ray olduğu gibi kalır.

           🔴 `mod` SÜZGECİ YOK — KAYITLI SAPMA. Statik kopyada mod ↔ tarif
           eşlemesi HİÇBİR YERDE yazılı değil (ölçüldü: 20 mod çipi, hiçbir
           kartta mod niteliği yok). Uydurmak, hangi tarifin hangi modda
           olduğunu ICAT etmek olurdu; bütün modlar aynı havuzu görür ve
           bu rapora yazıldı. */
    if (yontem === 'GET' && cfg.scratchPoolUrl &&
        url.split('?')[0] === cfg.scratchPoolUrl.split('?')[0]) {
      var s10 = new URLSearchParams((url.split('?')[1] || ''));
      var kat10 = (s10.get('kategori') || '').trim();
      var q10 = (s10.get('q') || '').trim().toLocaleLowerCase('tr');
      var kap10 = document.createElement('div');
      kap10.innerHTML = HAVUZ_ILK;
      var kartlar10 = [].slice.call(kap10.querySelectorAll('.rp-card'));
      var sec10 = kapSecenekleri();
      var kalan10 = kartlar10.filter(function (k) {
        if (q10 && (k.getAttribute('data-recipe-title') || '')
              .toLocaleLowerCase('tr').indexOf(q10) < 0) return false;
        if (kat10) {
          var t10 = { cat: k.getAttribute('data-recipe-cat') };
          if (kapTuru(t10, sec10).key !== kat10) return false;
        }
        return true;
      });
      var govde10 = kalan10.map(function (k) { return k.outerHTML; }).join('');
      return cevap({
        html: govde10,
        /* Sayaç etiketi sayfanın kendi biçiminde ("720 tarif"); süzülünce
           gerçek kalan sayı yazılır, ilk hâl süzgeçsizken korunur. */
        countLabel: (kat10 || q10) ? (kalan10.length + ' tarif') : HAVUZ_SAYAC_ILK,
        /* Boş pano metni sayfanın kendi `data-error-text`i gibi kısa;
           yeni ton uydurulmadı, `renderPool`un kardeş cümlesi kullanıldı. */
        emptyText: 'Bu kap türünde uygun tarif bulunamadı.',
      });
    }

    /* ── 11-13 · MENÜYÜ PİŞİR ─────────────────────────────────────────
       Beyar: *"'Menüyü Pişir' canlıdaki gibi popup/adım akışı açacak."*

       🔴 ÖNCEKİ TURDA BİLEREK SUNULMUYORDU, gerekçesi şuydu: "adım
       metinleri gerçek `RecipeStep` içeriği, uydurma pişirme talimatı
       yazılmaz." Gerekçe hâlâ geçerli — bu yüzden metin UYDURULMADI,
       DONÖRDEN HASAT EDİLDİ:
         `scripts/olcum/gtarif-adim-hasat.mjs` → 65 tarif · 270 adım · 506 malzeme
         kaynak `https://dadagastro.com/tarif/<slug>` (herkese açık, 200)
         alanlar `.sc-top h3` → title · `.step-card__body p` → body
                 `.step-time` → duration_min
       Statik dosya: `varliklar/reference/shared/gastro-tarif-adimlari.json`

       🔴 DONÖRÜN VERMEDİĞİ ÜÇ ALAN — TÜRETİLMEDİ, BOŞ BIRAKILDI:
         `is_passive`     donörün HTML'inde işaret yok  → false
         `rest_minutes`   yok                            → 0 (sayfa kendi
                          kodunda `d.rest_minutes ?` ile koruyor)
         `why`            plan gerekçesi sunucu metni     → '' (boş)
       Bunların yokluğu ÖRGÜYÜ de düşürüyor: sunucu pasif adımlarda
       kaplar arası el değiştiriyor (`buildWeave`), burada adımlar plan
       sırasında kap kap akar. Sapma raporda kayıtlı.

       ZAMAN ÇİZELGESİ UYDURMA DEĞİL, SAYFANIN KENDİ KURALI:
       `renderPlan` metni — *"Sofra tek seferde kurulacak şekilde
       sıraladık; uzun pişen kaplar önce başlar"*. Yani sıra = süreye göre
       AZALAN, `start_minutes = span - minutes` (hepsi aynı anda biter).
       Sayılar gerçek adım sürelerinden toplanır. */
    if (yontem === 'POST' && (m = eslesme(cfg.cookingStartUrlTemplate, url)))
      return pisirmeBaslat(m.groups.menu);

    if (yontem === 'POST' && (m = eslesme(cfg.cookingAdvanceUrlTemplate, url)))
      return pisirmeIlerle(m.groups.session, govdeOku(init).direction);

    if (yontem === 'POST' && (m = eslesme(cfg.cookingReorderUrlTemplate, url)))
      return pisirmeSirala(m.groups.session, govdeOku(init));

    /* 9 · SUNULMAYAN AMA DIŞARI DA SIZDIRILMAYAN UÇLAR
       🔴 Bu blok, kendi değişikliğimin YAN ETKİSİNİ kapatıyor. Panel daha
       önce hiç açılmadığı için `#mdCook` ("Menüyü Pişir") ve hazır menü
       kartları ERİŞİLEMEZDİ; artık erişilebilir. Olduğu gibi geçirmek,
       maketten canlı siteye giden YENİ bir istek doğururdu (ölçüldü:
       `POST https://dadagastro.com/bugun-ne-pisirsem/menu/1/pisir`).
       Statik kopya canlıya istek atmaz. Uydurma pişirme adımı ya da
       uydurma hazır-menü içeriği de üretilmez — istek burada durur,
       sayfanın kendi `.catch`i sessizce yutar: görünen davranış
       "hiçbir şey olmuyor", yani bugünküyle aynı. */
    var sunulmaz = [cfg.menuFromCuratedSetUrlTemplate];
    for (var s9 = 0; s9 < sunulmaz.length; s9++)
      if (eslesme(sunulmaz[s9], url))
        return cevap({ hata: 'maket-sunulmuyor', uc: url }, 501);

    return ozgunFetch(girdi, init);
  };

  /* `menuCourse{Swap,Remove}` şablonları AYNI adrese bakıyor; eşleme
     tek yerden yapılsın diye küçük yardımcı. Kalıp her çağrıda değil,
     bir kez derlenir. */
  var onbellek = {};
  function eslesme(sablon, url) {
    if (!sablon) return null;
    if (!(sablon in onbellek)) onbellek[sablon] = kalip(sablon);
    var r = onbellek[sablon];
    return r ? r.exec(url) : null;
  }

  /* ── DERİN BAĞ YERELE ÇEVRİLİR ──────────────────────────────────────
     `buildMenu` son adımda `menuDeepLinkTemplate`e gidiyor ve makette o
     değer hâlâ MUTLAK canlı adres (`https://dadagastro.com/…`) — dump o
     alanı yeniden yazmamış. Dokunulmazsa "Menüyü Kur" kullanıcıyı canlı
     siteye ATAR. Değiştirilen şey MARKUP değil, sayfanın kendi CONFIG
     DEĞERİ; akış (tam sayfa yeniden yükleme + `?menu=`) canlıdaki gibi
     korunur.
     `auth=1` taşınır: `maket-auth.js`in kendi geleneği ("bayrak URL'de
     taşındığı için sayfa içi bağlantılara da eklenir") — yoksa dönüşte
     üye görünümü düşerdi. */
  function derinBagiYerelle() {
    var cfg = window.bnpConfig;
    if (!cfg || !cfg.menuDeepLinkTemplate) return;
    if (cfg.menuDeepLinkTemplate.indexOf('http') !== 0) return;   /* zaten yerel */
    var uye = new URLSearchParams(location.search).get('auth') === '1';
    cfg.menuDeepLinkTemplate = location.pathname.split('/').pop() +
      '?menu=__MENU__' + (uye ? '&auth=1' : '');
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', derinBagiYerelle);
  else derinBagiYerelle();
})();
