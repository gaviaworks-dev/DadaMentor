/* =====================================================================
   g-menulerim — MENÜ DÜZENLEME, AYNI SAYFADA
   ---------------------------------------------------------------------
   BEYAR KARARI (madde 1b, 2026-09-04):
     "Kap Ekle / Değiştir = aynı sayfada tarif havuzu POPUP'ı (#rpModal /
      'Tarif havuzu'), menü kimliğiyle; seçilen tarif o menünün o kabına
      yazılır, sayfa değişmez. ?menu=&eylem= yönlendirmesi kalkar;
      Alışveriş listesi · Kopyala · Sıralama · Menüye tarif ekle
      düğmeleri de aynı sayfada gerçek sonuç üretir."

   ── ÖLÇÜLEN ÖNCEKİ DAVRANIŞ (render DOM, 8779, 2026-09-04) ──────────
     Kap Ekle       → bugun-ne-pisirsem.html?menu=…&eylem=kap-ekle
     Değiştir       → …&kap=<slug>&eylem=degistir
     Çıkar          → …&eylem=cikar
     Alışveriş/Kopyala/Sıralama/Tarif ekle → …&eylem=liste|kopyala|sirala|tarif-ekle
     Ad değiştir    → …&eylem=ad-degistir
   Hedef sayfa bu sorguları OKUMUYOR (`openMenuFromQueryParam` yalnız
   `?menu=` sayısal kimliği okuyor, `eylem` hiçbir yerde geçmiyor —
   ölçüldü: `grep eylem= bugun-ne-pisirsem.js` → 0). Yani sekiz düğme de
   kullanıcıyı BAŞKA BİR SAYFAYA atıp hiçbir şey yapmıyordu.

   ── MARKUP ÜRETİLMEZ, KLONLANIR ──────────────────────────────────────
   KOPYALAMA-KURALI eksi birinci madde: "markup sıfırdan yazılmaz".
   Yeni kap kartı, sayfanın KENDİ `.menu-card`ının klonudur; yalnız
   metin · bağ · görsel · olgular değişir. Havuz kartı ise maketin kendi
   `poolCardHtml` kalıbıdır (`bugun-ne-pisirsem.js`ten birebir okundu).

   ── VERİ NEREDEN ────────────────────────────────────────────────────
   tarif havuzu   sayfanın KENDİ menü kartları (42 ayrık tarif, ölçüldü)
   malzeme        `varliklar/reference/shared/gastro-tarif-adimlari.json`
                  — canlı donörün tarif sayfalarından hasat (506 malzeme)
   🔴 REYON (manav/kasap/…) DONÖRDE YOK: `.ing-row` reyon niteliği
      taşımıyor (ölçüldü). Liste reyona göre GRUPLANMAZ; sayfanın kendi
      cümlesinin ikinci yarısı uygulanır — "aynı malzeme tek satırda
      toplanır ve miktarları eklenir" + "kaynağı her satırın altında
      yazar". Reyon eksiği raporda açık kalem.
   ===================================================================== */
(function () {
  'use strict';

  var kok = document.getElementById('menulerim-pane-gunluk') ? document : null;
  if (!document.querySelector('article.menu-detail')) return;

  var rpOverlay = document.getElementById('rpOverlay');
  var rpModal   = document.getElementById('rpModal');
  var rpGrid    = document.getElementById('rpGrid');
  var rpSearch  = document.getElementById('rpSearch');
  var rpTitle   = document.getElementById('rpTitle');
  var rpSub     = document.getElementById('rpSub');
  var rpClose   = document.getElementById('rpClose');
  if (!rpModal || !rpGrid) return;

  function esc(v) { var d = document.createElement('div'); d.textContent = v == null ? '' : String(v); return d.innerHTML; }
  var slugla = function (t) {
    return String(t || '').toLocaleLowerCase('tr')
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  /* ── TARİF HAVUZU · SAYFANIN KENDİ KARTLARINDAN ────────────────────
     Havuz uydurulmaz. Sayfadaki BÜTÜN menü kartları taranır, ayrık
     tarifler (slug'a göre) toplanır; her birinin başlığı · görseli ·
     bağı · olgu satırı kendi kartından okunur. */
  function tarifHavuzu() {
    var ix = {}, sira = [];
    document.querySelectorAll('article.menu-card[data-recipe-slug]').forEach(function (k) {
      var slug = k.getAttribute('data-recipe-slug');
      if (!slug || ix[slug]) return;
      var bas = k.querySelector('.mc-body h3 a');
      var med = k.querySelector('.mc-media');
      var kapAd = k.querySelector('.mc-course');
      ix[slug] = {
        slug: slug,
        title: bas ? bas.textContent.trim() : slug,
        url: bas ? bas.getAttribute('href') : '#',
        cover: med ? (med.getAttribute('style') || '').replace(/^.*url\(['"]?/, '').replace(/['"]?\).*$/, '') : '',
        factsHtml: (k.querySelector('.mc-facts') || {}).innerHTML || '',
        kapEtiket: kapAd ? kapAd.childNodes[1] && kapAd.childNodes[1].textContent.trim() : '',
        /* P2A-HAVUZ-SUZGEC · süzgeç alanları — kartın KENDİ verisi */
        kategori: kapAd ? ((kapAd.childNodes[1] || {}).textContent || '').trim() : '',
        dk: (function () {
          var f = k.querySelector('.mc-facts .fa-clock');
          var sp = f && f.parentNode.querySelector('.rf-txt');
          var mm = sp && sp.textContent.match(/(\d+)/);
          return mm ? Number(mm[1]) : null;
        })(),
        zorluk: (function () {
          var f = k.querySelector('.mc-facts .fa-gauge-simple');
          var sp = f && f.parentNode.querySelector('.rf-txt');
          return sp ? sp.textContent.trim() : '';
        })(),
        beslenme: (k.getAttribute('data-beslenme') || '').split(/\s+/).filter(Boolean),
        ikon: kapAd && kapAd.querySelector('i') ? kapAd.querySelector('i').className : 'fa-solid fa-utensils',
      };
      sira.push(ix[slug]);
    });
    return { ix: ix, hepsi: sira };
  }

  /* Maketin KENDİ havuz kartı kalıbı (bugun-ne-pisirsem.js · poolCardHtml).
     Tek fark: kimlik `data-recipe-id` yerine slug — kanon sayfasının
     kartları sayısal kimlik TAŞIMIYOR (ölçüldü: 0/68). Ad değil, DEĞER
     değişti; kalıbın kendisi birebir. */
  function havuzKartHtml(t) {
    return '<article class="rp-card" data-recipe-slug="' + esc(t.slug) + '">' +
      '<div class="rp-fig" style="background-image:url(\'' + t.cover + '\')"></div>' +
      '<div class="rp-info"><h4>' + esc(t.title) + '</h4>' +
      '<div class="rp-meta">' + t.factsHtml + '</div>' +
      '<button class="rp-add-btn" type="button" data-pick="' + esc(t.slug) + '">' +
      '<i class="fa-solid fa-plus" aria-hidden="true"></i> Ekle</button>' +
      '</div></article>';
  }

  var durum = { menu: null, kip: null, kart: null, kapEtiket: '', kapIkon: '', q: '' };

  function havuzCiz() {
    var h = tarifHavuzu();
    /* Menüde ZATEN olan tarif tekrar önerilmez — maketin kendi havuz
       kuralı (`maket-menu.js` uç 4: "menüde olan tekrar önerilmez").
       Değiştirilen kart da dahil: kaynağın kuralı ayrım yapmıyor. */
    var icerde = {};
    if (durum.menu) durum.menu.querySelectorAll('article.menu-card[data-recipe-slug]').forEach(function (k) {
      icerde[k.getAttribute('data-recipe-slug')] = 1;
    });
    var q = durum.q.toLocaleLowerCase('tr');
    var liste = h.hepsi.filter(function (t) {
      if (icerde[t.slug]) return false;                    /* menüde olan tekrar önerilmez */
      if (q && t.title.toLocaleLowerCase('tr').indexOf(q) < 0) return false;
      if (!cipGecer(t)) return false;                       /* P2A-HAVUZ-SUZGEC */
      return true;
    });
    if (!liste.length) {
      rpGrid.innerHTML = '<div class="rp-empty"><i class="fa-solid fa-bowl-rice" aria-hidden="true"></i>' +
        '<p>Bu kap türünde uygun tarif bulunamadı.</p></div>';
      return;
    }
    rpGrid.innerHTML = liste.map(havuzKartHtml).join('');
    rpGrid.querySelectorAll('[data-pick]').forEach(function (b) {
      b.addEventListener('click', function () { sec(b.getAttribute('data-pick')); });
    });
  }

  function havuzAc(menuEl, kip, kart, kapEtiket, kapIkon) {
    durum.menu = menuEl; durum.kip = kip; durum.kart = kart || null;
    durum.kapEtiket = kapEtiket || ''; durum.kapIkon = kapIkon || 'fa-solid fa-utensils';
    durum.q = '';
    durum.sec = { kategori: '', sure: '', zorluk: '', beslenme: '' };   /* P2A-HAVUZ-SUZGEC */
    if (rpSearch) rpSearch.value = '';
    var ad = menuEl.querySelector('.md-title-text');
    if (rpTitle) rpTitle.textContent = 'Tarif Havuzu';
    if (rpSub) rpSub.textContent = (kip === 'degistir'
      ? '“' + (kart.querySelector('.mc-body h3 a') || {}).textContent + '” yerine ne gelsin?'
      : 'Menüne katman istediğin tarifi seç — havuzdan ekle.')
      + (ad ? ' · ' + ad.textContent.trim() : '');
    rpOverlay.classList.add('show');
    rpModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    cipleriCiz();                                           /* P2A-HAVUZ-SUZGEC */
    havuzCiz();
  }
  function havuzKapat() {
    rpOverlay.classList.remove('show');
    rpModal.classList.remove('show');
    document.body.style.overflow = '';
  }

  /* ── SEÇİM · KART KLONLANIR, YAZILMAZ ──────────────────────────── */
  function sec(slug) {
    var t = tarifHavuzu().ix[slug];
    if (!t || !durum.menu) return havuzKapat();
    var set = durum.menu.querySelector('.menu-set');
    if (durum.kip === 'degistir' && durum.kart) {
      kartaYaz(durum.kart, t, null);                 /* kap türü KORUNUR */
    } else {
      var ornek = durum.menu.querySelector('article.menu-card') ||
                  document.querySelector('article.menu-card');
      if (!ornek) return havuzKapat();
      var yeni = ornek.cloneNode(true);
      kartaYaz(yeni, t, durum.kapEtiket || t.kapEtiket, durum.kapIkon || t.ikon);
      var ekle = set.querySelector('.mc-add');
      set.insertBefore(yeni, ekle || null);
    }
    menuTazele(durum.menu);
    havuzKapat();
  }

  function kartaYaz(kart, t, kapEtiket, kapIkon) {
    kart.setAttribute('data-recipe-slug', t.slug);
    var bas = kart.querySelector('.mc-body h3 a');
    if (bas) { bas.textContent = t.title; bas.setAttribute('href', t.url); }
    var med = kart.querySelector('.mc-media');
    if (med) med.setAttribute('style', "background-image:url('" + t.cover + "')");
    var olgu = kart.querySelector('.mc-facts');
    if (olgu) olgu.innerHTML = t.factsHtml;
    if (kapEtiket) {
      var kc = kart.querySelector('.mc-course');
      if (kc) {
        var adim = kc.querySelector('.mc-step');
        kc.innerHTML = '<i class="' + (kapIkon || 'fa-solid fa-utensils') + '" aria-hidden="true"></i> ' + esc(kapEtiket) + ' ';
        if (adim) kc.appendChild(adim); else {
          var sp = document.createElement('span'); sp.className = 'mc-step'; kc.appendChild(sp);
        }
      }
    }
    eylemleriBagla(kart);
  }

  /* ── MENÜ ÖZETİ · KAP SAYISI · SÜRE — SAYFANIN KENDİ ALANLARI ──── */
  function menuTazele(menuEl) {
    var kartlar = [].slice.call(menuEl.querySelectorAll('article.menu-card'));
    kartlar.forEach(function (k, i) {
      var st = k.querySelector('.mc-step');
      if (st) st.textContent = (i + 1) + ' / ' + kartlar.length;
    });
    var mbm = menuEl.querySelectorAll('.menu-bar-meta .mbm');
    if (mbm[0]) {
      var b = mbm[0].querySelector('b'), alt = mbm[0].querySelectorAll('span span')[1] || mbm[0].querySelector('span span+span');
      if (b) b.textContent = kartlar.length + ' kap';
      var etiketler = kartlar.map(function (k) {
        var c = k.querySelector('.mc-course');
        return c ? c.textContent.replace(/\s*\d+\s*\/\s*\d+\s*$/, '').trim() : '';
      }).filter(Boolean);
      var altSpan = mbm[0].querySelector('span > span:last-child');
      if (altSpan) altSpan.textContent = etiketler.join(' · ');
    }
    if (mbm[1]) {
      var dk = kartlar.reduce(function (t, k) {
        var m = (k.textContent.match(/(\d+)\s*dk/) || [])[1];
        return t + (m ? Number(m) : 0);
      }, 0);
      var b1 = mbm[1].querySelector('b');
      if (b1) b1.textContent = '~' + dk + ' dk';
    }
  }

  /* ── ALIŞVERİŞ LİSTESİ PANELİ · GERÇEK MALZEMEYLE ─────────────── */
  var malzemeSoz = null;
  function malzemeler() {
    if (!malzemeSoz) malzemeSoz = fetch('varliklar/reference/shared/gastro-tarif-adimlari.json',
      { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
    return malzemeSoz;
  }

  function listePaneli(menuEl) {
    var eski = menuEl.querySelector('.mnl-panel[data-panel="liste"]');
    if (eski) { eski.remove(); return; }                     /* ikinci tık kapatır */
    var p = panelAc(menuEl, 'liste', 'fa-basket-shopping', 'Alışveriş listesi',
      '<p class="mnl-yukleniyor">Malzemeler toplanıyor…</p>');
    malzemeler().then(function (sz) {
      var kartlar = [].slice.call(menuEl.querySelectorAll('article.menu-card[data-recipe-slug]'));
      var toplam = {}, eksik = [];
      kartlar.forEach(function (k) {
        var slug = k.getAttribute('data-recipe-slug');
        var bas = k.querySelector('.mc-body h3 a');
        var ad = bas ? bas.textContent.trim() : slug;
        var mz = (sz[slug] || {}).malzeme || [];
        if (!mz.length) { eksik.push(ad); return; }
        mz.forEach(function (m) {
          var anahtar = m.ad.toLocaleLowerCase('tr') + '|' + (m.birim || '');
          if (!toplam[anahtar]) toplam[anahtar] = { ad: m.ad, birim: m.birim, miktar: 0, kaynak: [] };
          if (m.miktar != null) toplam[anahtar].miktar += m.miktar;
          if (toplam[anahtar].kaynak.indexOf(ad) < 0) toplam[anahtar].kaynak.push(ad);
        });
      });
      var satir = Object.keys(toplam).map(function (a) { return toplam[a]; })
        .sort(function (x, y) { return x.ad.localeCompare(y.ad, 'tr'); });
      var say = satir.length;
      p.querySelector('.mnl-govde').innerHTML =
        '<div class="galeri-ozet"><span class="galeri-hap"><i class="fa-solid fa-basket-shopping"></i> <b>' + say +
        '</b> malzeme</span><span class="galeri-hap"><i class="fa-solid fa-utensils"></i> <b>' + kartlar.length +
        '</b> kaptan geldi</span></div>' +
        '<ul class="mnl-liste">' + satir.map(function (r) {
          var m = r.miktar ? (Math.round(r.miktar * 100) / 100) + (r.birim ? ' ' + esc(r.birim) : '') : '';
          return '<li><label><input type="checkbox"><span class="mnl-mik">' + m + '</span>' +
                 '<span class="mnl-ad">' + esc(r.ad) + '<small>' + esc(r.kaynak.join(' · ')) + '</small></span></label></li>';
        }).join('') + '</ul>' +
        (eksik.length ? '<p class="mnl-not">Malzemesi olmayan kap: ' + esc(eksik.join(' · ')) + '</p>' : '') +
        '<p class="mnl-not">Aynı malzeme birden çok kapta geçiyorsa tek satırda toplandı, miktarları eklendi. ' +
        'Reyon gruplaması kaynakta yok — satırın altında hangi kaptan geldiği yazıyor.</p>';
    });
  }

  function panelAc(menuEl, ad, ikon, baslik, govde) {
    var v = menuEl.querySelector('.mnl-panel');
    if (v) v.remove();
    /* 🔴 YENİ BİLEŞEN YAZILMADI — KANONUN KENDİ KABI KULLANILDI.
       Sayfa `kanon/bilesenler.css` yüklüyor; panel `.kart` + `.kart-bas`
       kabında, özet şeridi `.galeri-ozet`/`.galeri-hap` ile, not satırı
       `.galeri-not` ile basılır. Üçü de bu sayfanın "Alışveriş listem"
       sekmesinde ZATEN kullanılıyor (ölçüldü) — desen uydurulmadı. */
    var d = document.createElement('div');
    d.className = 'kart mnl-panel';
    d.setAttribute('data-panel', ad);
    d.innerHTML = '<div class="kart-bas"><h3><i class="fa-solid ' + ikon + '" aria-hidden="true"></i> ' +
      esc(baslik) + '</h3><button class="mnl-kapat" type="button" aria-label="Paneli kapat">' +
      '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div><div class="kart-govde mnl-govde">' + govde + '</div>';
    var set = menuEl.querySelector('.menu-set');
    menuEl.insertBefore(d, set);
    d.querySelector('.mnl-kapat').addEventListener('click', function () { d.remove(); });
    return d;
  }

  /* ── MENÜYÜ KOPYALA · menü bloğunun KLONU ─────────────────────── */
  function kopyala(menuEl) {
    var yeni = menuEl.cloneNode(true);
    var p = yeni.querySelector('.mnl-panel'); if (p) p.remove();
    var kim = menuEl.getAttribute('data-menu') + '-kopya';
    var n = 2;
    while (document.querySelector('[data-menu="' + kim + '"]')) { kim = menuEl.getAttribute('data-menu') + '-kopya-' + (n++); }
    yeni.setAttribute('data-menu', kim);
    var ad = yeni.querySelector('.md-title-text');
    if (ad) ad.textContent = ad.textContent.trim() + ' (kopya)';
    menuEl.parentNode.insertBefore(yeni, menuEl.nextSibling);
    menuBagla(yeni);
    menuTazele(yeni);
    yeni.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ── SIRALAMAYI DEĞİŞTİR · SÜRÜKLE-SIRALA ─────────────────────── */
  function siralamaAc(menuEl, btn) {
    var set = menuEl.querySelector('.menu-set');
    var acik = set.classList.toggle('mnl-sirala');
    btn.setAttribute('aria-pressed', acik ? 'true' : 'false');
    set.querySelectorAll('article.menu-card').forEach(function (k) {
      k.setAttribute('draggable', acik ? 'true' : 'false');
      if (acik && !k.dataset.mnlDrag) {
        k.dataset.mnlDrag = '1';
        k.addEventListener('dragstart', function (e) { k.classList.add('mnl-tasiniyor'); e.dataTransfer.effectAllowed = 'move'; });
        k.addEventListener('dragend', function () { k.classList.remove('mnl-tasiniyor'); menuTazele(menuEl); });
        k.addEventListener('dragover', function (e) {
          e.preventDefault();
          var t = set.querySelector('.mnl-tasiniyor');
          if (!t || t === k) return;
          var r = k.getBoundingClientRect();
          set.insertBefore(t, (e.clientX - r.left) > r.width / 2 ? k.nextSibling : k);
        });
      }
    });
    if (!acik) set.querySelectorAll('article.menu-card').forEach(function (k) { k.removeAttribute('draggable'); });
  }

  /* ── AD DEĞİŞTİR · YERİNDE ────────────────────────────────────── */
  function adDegistir(menuEl) {
    var sp = menuEl.querySelector('.md-title-text');
    if (!sp || sp.dataset.mnlDuzen) return;
    var eski = sp.textContent.trim();
    var inp = document.createElement('input');
    inp.type = 'text'; inp.className = 'mnl-ad-input'; inp.value = eski;
    inp.setAttribute('aria-label', 'Menü adı');
    sp.dataset.mnlDuzen = '1';
    sp.replaceWith(inp); inp.focus(); inp.select();
    var bitir = function (kaydet) {
      var y = document.createElement('span');
      y.className = 'md-title-text';
      y.textContent = kaydet && inp.value.trim() ? inp.value.trim() : eski;
      inp.replaceWith(y);
    };
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); bitir(true); }
      if (e.key === 'Escape') bitir(false);
    });
    inp.addEventListener('blur', function () { bitir(true); });
  }

  /* ── BAĞLAMA ──────────────────────────────────────────────────── */
  function eylemleriBagla(kart) {
    var menuEl = kart.closest('article.menu-detail');
    var sw = kart.querySelector('.mc-act.swap');
    if (sw && !sw.dataset.mnl) {
      sw.dataset.mnl = '1'; sw.removeAttribute('href'); sw.setAttribute('role', 'button'); sw.tabIndex = 0;
      sw.addEventListener('click', function (e) { e.preventDefault(); havuzAc(menuEl, 'degistir', kart); });
    }
    var rm = kart.querySelector('.mc-act.remove');
    if (rm && !rm.dataset.mnl) {
      rm.dataset.mnl = '1'; rm.removeAttribute('href'); rm.setAttribute('role', 'button'); rm.tabIndex = 0;
      rm.addEventListener('click', function (e) { e.preventDefault(); kart.remove(); menuTazele(menuEl); });
    }
  }

  function menuBagla(menuEl) {
    menuEl.querySelectorAll('article.menu-card').forEach(eylemleriBagla);

    var pen = menuEl.querySelector('.md-title-pen');
    if (pen && !pen.dataset.mnl) {
      pen.dataset.mnl = '1'; pen.removeAttribute('href'); pen.setAttribute('role', 'button'); pen.tabIndex = 0;
      pen.addEventListener('click', function (e) { e.preventDefault(); adDegistir(menuEl); });
    }

    /* Kap Ekle kutusu — ana bağ + kap türü çipleri */
    var add = menuEl.querySelector('.mc-add');
    if (add && !add.dataset.mnl) {
      add.dataset.mnl = '1';
      var ana = add.querySelector('a[href]');
      if (ana) { ana.removeAttribute('href'); ana.setAttribute('role', 'button'); ana.tabIndex = 0; }
      add.querySelectorAll('.mc-add-pick a').forEach(function (a) {
        var etiket = a.textContent.trim();
        a.removeAttribute('href'); a.setAttribute('role', 'button'); a.tabIndex = 0;
        a.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
          havuzAc(menuEl, 'ekle', null, etiket, '');
        });
      });
      add.addEventListener('click', function (e) {
        if (e.target.closest('.mc-add-pick')) return;
        e.preventDefault();
        havuzAc(menuEl, 'ekle', null, '', '');
      });
    }

    /* Menü çubuğu — dört düğme */
    menuEl.querySelectorAll('.menu-bar-acts [data-mnl-eylem], .menu-bar-acts a[href*="eylem="]').forEach(function (b) {
      if (b.dataset.mnl) return;
      b.dataset.mnl = '1';
      /* Eylem adı MARKUP'TAN okunur: d13 `href`i `data-mnl-eylem`e
         çevirdi (değer değişimi, eleman değişimi değil). `href` biçimi
         yedek olarak duruyor — betik iki kaynağı da tanır. */
      var eylem = b.getAttribute('data-mnl-eylem') ||
                  ((b.getAttribute('href') || '').match(/eylem=([a-z-]+)/) || [,''])[1];
      b.removeAttribute('href'); b.setAttribute('role', 'button'); b.tabIndex = 0;
      b.addEventListener('click', function (e) {
        e.preventDefault();
        if (eylem === 'liste') listePaneli(menuEl);
        else if (eylem === 'kopyala') kopyala(menuEl);
        else if (eylem === 'sirala') siralamaAc(menuEl, b);
        else if (eylem === 'tarif-ekle') havuzAc(menuEl, 'ekle', null, '', '');
      });
    });
  }


  /* ═══ P2A-HAVUZ-SUZGEC ════════════════════════════════════════════
     Aramanın altındaki tercih süzgeci. Değerler HAVUZUN KENDİ
     kartlarından çıkar; grup boşsa BASILMAZ. Sayaçlar o anki havuzdan
     hesaplanır (kendi grubunun seçimi hariç tutulur — süzgeç mantığı).
     ═══════════════════════════════════════════════════════════════ */
  /* Kademeler UYDURULMADI — `tarifler.html` süzgecinden hasat edildi
     (name="sure[]" / name="zorluk[]" / name="beslenme[]"). */
  var SURE_KADEME = [{"ad":"15 dakikadan az","alt":0,"ust":15},{"ad":"15–30 dakika","alt":15,"ust":30},{"ad":"30–45 dakika","alt":30,"ust":45},{"ad":"45–60 dakika","alt":45,"ust":60},{"ad":"1–2 saat","alt":60,"ust":120},{"ad":"2 saatten uzun","alt":120,"ust":1000000000}];
  var ZORLUK_SIRA = ["Çok Kolay","Kolay","Orta","Zor","Ustalık Gerektirir"];
  var BESLENME_AD = {"vegan":"Vegan","vejetaryen":"Vejetaryen","glutensiz":"Glutensiz","protein-agirlikli":"Protein Ağırlıklı","az-yagli":"Az Yağlı","glutenli":"Glutenli","laktozsuz":"Laktozsuz","sut-icermez":"Süt İçermez","yumurta-icermez":"Yumurta İçermez","seker-ilavesiz":"Şeker İlavesiz","yuksek-lifli":"Yüksek Lifli","tam-tahilli":"Tam Tahıllı","acili":"Acılı","baharatli":"Baharatlı","diyabete-uygun":"Diyabete Uygun","kalp-dostu":"Kalp Dostu","dusuk-kalorili":"Düşük Kalorili","pesketaryen":"Pesketaryen","kuruyemis-icermez":"Kuruyemiş İçermez","dusuk-karbonhidratli":"Düşük Karbonhidratlı","ketojenik":"Ketojenik"};

  function sureKademesi(dk) {
    if (dk == null) return '';
    for (var i = 0; i < SURE_KADEME.length; i++)
      if (dk > SURE_KADEME[i].alt && dk <= SURE_KADEME[i].ust) return SURE_KADEME[i].ad;
    return '';
  }

  /* Bir tarif, `haric` grubu dışındaki seçili çiplerden geçiyor mu */
  function cipGecer(t, haric) {
    var s = durum.sec || {};
    if (s.kategori && haric !== 'kategori' && t.kategori !== s.kategori) return false;
    if (s.sure && haric !== 'sure' && sureKademesi(t.dk) !== s.sure) return false;
    if (s.zorluk && haric !== 'zorluk' && t.zorluk !== s.zorluk) return false;
    if (s.beslenme && haric !== 'beslenme' && (t.beslenme || []).indexOf(s.beslenme) < 0) return false;
    return true;
  }

  /* Popup'ta o an aday olan tarifler (menüde olan tekrar önerilmez) */
  function adaylar() {
    var h = tarifHavuzu();
    var icerde = {};
    if (durum.menu) durum.menu.querySelectorAll('article.menu-card[data-recipe-slug]').forEach(function (k) {
      icerde[k.getAttribute('data-recipe-slug')] = 1;
    });
    return h.hepsi.filter(function (t) { return !icerde[t.slug]; });
  }

  function grupCiz(anahtar, baslik, degerler, sayac) {
    if (!degerler.length) return '';                         /* veri yoksa grup BASILMAZ */
    var s = durum.sec || {};
    return '<div class="rp-cgrup" data-grup="' + anahtar + '">' +
      '<span class="rp-cbas">' + esc(baslik) + '</span>' +
      degerler.map(function (d) {
        var n = sayac[d.deger] || 0;
        var secili = s[anahtar] === d.deger;
        return '<button type="button" class="rp-cip' + (n || secili ? '' : ' rp-cbos') + '" ' +
          'data-grup="' + anahtar + '" data-deger="' + esc(d.deger) + '" ' +
          'aria-pressed="' + (secili ? 'true' : 'false') + '">' +
          esc(d.etiket) + '<span class="rp-csay">' + n + '</span></button>';
      }).join('') + '</div>';
  }

  function cipleriCiz() {
    var kap = document.getElementById('rpCips');
    if (!kap) return;
    var hepsi = adaylar();

    function sayacUret(haric, cikar) {
      var m = {};
      hepsi.forEach(function (t) {
        if (!cipGecer(t, haric)) return;
        var d = cikar(t);
        (Array.isArray(d) ? d : [d]).forEach(function (v) { if (v) m[v] = (m[v] || 0) + 1; });
      });
      return m;
    }
    function degerListesi(sayac, sira, etiketle) {
      var anahtarlar = Object.keys(sayac);
      if (sira) anahtarlar.sort(function (a, b) { return sira.indexOf(a) - sira.indexOf(b); });
      else anahtarlar.sort(function (a, b) { return sayac[b] - sayac[a] || a.localeCompare(b, 'tr'); });
      return anahtarlar.map(function (a) { return { deger: a, etiket: etiketle ? etiketle(a) : a }; });
    }

    var sKat = sayacUret('kategori', function (t) { return t.kategori; });
    var sSur = sayacUret('sure',     function (t) { return sureKademesi(t.dk); });
    var sZor = sayacUret('zorluk',   function (t) { return t.zorluk; });
    var sBes = sayacUret('beslenme', function (t) { return t.beslenme || []; });

    var sureSira = SURE_KADEME.map(function (k) { return k.ad; });
    var html =
      grupCiz('kategori', 'Kategori', degerListesi(sKat), sKat) +
      grupCiz('sure',     'Süre',     degerListesi(sSur, sureSira), sSur) +
      grupCiz('zorluk',   'Zorluk',   degerListesi(sZor, ZORLUK_SIRA), sZor) +
      grupCiz('beslenme', 'Beslenme', degerListesi(sBes, null, function (a) { return BESLENME_AD[a] || a; }), sBes);

    var s = durum.sec || {};
    var acik = ['kategori', 'sure', 'zorluk', 'beslenme'].filter(function (g) { return s[g]; }).length;
    if (html && acik) html += '<div class="rp-cgrup"><button type="button" class="rp-cip rp-ctemiz" id="rpCTemiz">' +
      '<i class="fa-solid fa-xmark" aria-hidden="true"></i> Süzgeci temizle</button></div>';

    kap.innerHTML = html;
    kap.querySelectorAll('.rp-cip[data-grup]').forEach(function (b) {
      b.addEventListener('click', function () {
        var g = b.getAttribute('data-grup'), d = b.getAttribute('data-deger');
        durum.sec[g] = (durum.sec[g] === d) ? '' : d;         /* ikinci tık kaldırır */
        cipleriCiz(); havuzCiz();
      });
    });
    var t = document.getElementById('rpCTemiz');
    if (t) t.addEventListener('click', function () {
      durum.sec = { kategori: '', sure: '', zorluk: '', beslenme: '' };
      cipleriCiz(); havuzCiz();
    });
  }

  document.querySelectorAll('article.menu-detail').forEach(menuBagla);

  if (rpClose) rpClose.addEventListener('click', havuzKapat);
  if (rpOverlay) rpOverlay.addEventListener('click', havuzKapat);
  if (rpSearch) {
    var zaman;
    rpSearch.addEventListener('input', function () {
      clearTimeout(zaman);
      zaman = setTimeout(function () { durum.q = rpSearch.value.trim(); havuzCiz(); }, 250);
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && rpModal.classList.contains('show')) havuzKapat();
  });
})();
