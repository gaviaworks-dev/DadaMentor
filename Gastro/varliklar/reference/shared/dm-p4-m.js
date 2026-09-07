/* =====================================================================
   AJAN M · MENÜLERİM + ALIŞVERİŞ — PARTİ 4
   ---------------------------------------------------------------------
   BAĞI lead attı; İÇERİĞİNİ yalnız kendi kulvarı yazar.
   KAYNAK BURASI: scripts/p4-varlik/dm-p4-m.js — ağaca kopyalanır.
   Bağlı olduğu sayfalar: g-menulerim.html · tarif__*.html (480) ·
   en__tarif__*.html (41).

   YÜKLEME SIRASI — `defer`, `gmenulerim-duzen.js`ten SONRA (ölçüldü:
   11664 ↔ 11667). Yani o betiğin kurduğu yüzey hazırken bağlanıyoruz.

   İÇİNDE NE VAR
     M1 · tarif havuzu süzgeci — çip duvarı → aranabilir açılır
     M2 · menü listesi kapalı tile satırı (aç/kapa · klavye · senkron)
     M3a· alışveriş panosu — dmDepo'dan GERÇEK liste
     M3b· tarif detayı malzeme satırı ↔ liste (kalıcı durum)

   🔴 `gmenulerim-duzen.js` BENİM KAYNAK DOSYAM DEĞİL ve ona
      DOKUNULMADI. O betiğin `durum` nesnesi IIFE içinde kapalı;
      dışarıdan erişilemiyor. Seçilen yol: onun çizdiği `#rpCips`
      kabını CSS ile SUSTUR, kendi yüzeyimi `.rp-tools`a KARDEŞ olarak
      kur, `.rp-card` görünürlüğünü kendim süz.
      Reddedilen yol: `#rpCips` tıklamalarını taklit etmek — o çizim
      her popup açılışında sıfırlanıyor ve taklit, kendi çizdiği
      düğmeye tıklayan bir ölçüm üretirdi ("ölçüm aracı ölçtüğünü
      değiştirir" deseninin ta kendisi).
   ===================================================================== */
(function () {
  'use strict';
  if (window.dmP4M) return;                       /* iki kez bağlanmaz */
  window.dmP4M = { surum: 1 };

  var EN = (document.documentElement.lang || 'tr').toLowerCase().indexOf('en') === 0;
  function S(tr, en) { return EN ? en : tr; }
  function esc(v) { var d = document.createElement('div'); d.textContent = v == null ? '' : String(v); return d.innerHTML; }
  function el(t, c, m) { var e = document.createElement(t); if (c) e.className = c; if (m != null) e.textContent = m; return e; }
  function toast(m, se) { if (window.dmToast) window.dmToast(m, se); }

  /* ═══════════════════════════════════════════════════════════════════
     M1 · TARİF HAVUZU SÜZGECİ
     -----------------------------------------------------------------
     KARAR (ölçülerek): ÇOKLU seçim. Gerekçe kaynağın kendi kipi —
     `tarifler.html` süzgecinde dört grubun dördü de `<input
     type="checkbox" name="…[]">` (ölçüldü: kategori 33 · beslenme 21 ·
     süre 6 · zorluk 5 kutu; `type="radio"` SIFIR). Havuzun bugünkü tek
     seçimi kaynaktan bir SAPMAYDI; "seçilenler çip olarak altında"
     isteği ancak çoklu seçimle bir şey ifade eder.
     Grup İÇİ VEYA, gruplar ARASI VE — kaynağın facet kipi.
     ═══════════════════════════════════════════════════════════════════ */

  /* Kademeler UYDURULMADI — `gmenulerim-duzen.js`ten BİREBİR alındı;
     o da `tarifler.html` süzgecinden hasat etmiş. Değiştirilmedi. */
  var SURE_KADEME = [{"ad":"15 dakikadan az","alt":0,"ust":15},{"ad":"15–30 dakika","alt":15,"ust":30},{"ad":"30–45 dakika","alt":30,"ust":45},{"ad":"45–60 dakika","alt":45,"ust":60},{"ad":"1–2 saat","alt":60,"ust":120},{"ad":"2 saatten uzun","alt":120,"ust":1000000000}];
  var ZORLUK_SIRA = ["Çok Kolay","Kolay","Orta","Zor","Ustalık Gerektirir"];
  var BESLENME_AD = {"vegan":"Vegan","vejetaryen":"Vejetaryen","glutensiz":"Glutensiz","protein-agirlikli":"Protein Ağırlıklı","az-yagli":"Az Yağlı","glutenli":"Glutenli","laktozsuz":"Laktozsuz","sut-icermez":"Süt İçermez","yumurta-icermez":"Yumurta İçermez","seker-ilavesiz":"Şeker İlavesiz","yuksek-lifli":"Yüksek Lifli","tam-tahilli":"Tam Tahıllı","acili":"Acılı","baharatli":"Baharatlı","diyabete-uygun":"Diyabete Uygun","kalp-dostu":"Kalp Dostu","dusuk-kalorili":"Düşük Kalorili","pesketaryen":"Pesketaryen","kuruyemis-icermez":"Kuruyemiş İçermez","dusuk-karbonhidratli":"Düşük Karbonhidratlı","ketojenik":"Ketojenik"};

  var GRUPLAR = [
    { k:'kategori', ad:'Kategori', ara:'Kategori ara…' },
    { k:'sure',     ad:'Süre',     ara:'Süre ara…'     },
    { k:'zorluk',   ad:'Zorluk',   ara:'Zorluk ara…'   },
    { k:'beslenme', ad:'Beslenme', ara:'Beslenme ara…' }
  ];

  function sureKademesi(dk) {
    if (dk == null) return '';
    for (var i = 0; i < SURE_KADEME.length; i++)
      if (dk > SURE_KADEME[i].alt && dk <= SURE_KADEME[i].ust) return SURE_KADEME[i].ad;
    return '';
  }

  /* Süzgeç DEĞERLERİ havuzun KENDİ kartlarından okunur — `tarifHavuzu()`
     ile birebir aynı kaynak ve aynı alanlar. Veri uydurulmuyor. */
  function tarifOlgulari() {
    var ix = {};
    document.querySelectorAll('article.menu-card[data-recipe-slug]').forEach(function (k) {
      var slug = k.getAttribute('data-recipe-slug');
      if (!slug || ix[slug]) return;
      var kapAd = k.querySelector('.mc-course');
      var kategori = kapAd ? ((kapAd.childNodes[1] || {}).textContent || '').trim() : '';
      var fs = k.querySelector('.mc-facts .fa-clock');
      var sp = fs && fs.parentNode.querySelector('.rf-txt');
      var mm = sp && sp.textContent.match(/(\d+)/);
      var fz = k.querySelector('.mc-facts .fa-gauge-simple');
      var zp = fz && fz.parentNode.querySelector('.rf-txt');
      ix[slug] = {
        kategori: kategori,
        sure: sureKademesi(mm ? Number(mm[1]) : null),
        zorluk: zp ? zp.textContent.trim() : '',
        beslenme: (k.getAttribute('data-beslenme') || '').split(/\s+/).filter(Boolean)
      };
    });
    return ix;
  }

  function m1() {
    var modal  = document.getElementById('rpModal');
    var araclar = modal && modal.querySelector('.rp-tools');
    var grid   = document.getElementById('rpGrid');
    var cipKap = document.getElementById('rpCips');
    if (!modal || !araclar || !grid || !cipKap) return null;

    var sec = { kategori:[], sure:[], zorluk:[], beslenme:[] };
    var olgu = {};
    var kutular = {};

    /* ── YÜZEY ── kanon K5: `.coklu-secim` > `.coklu-kutu` + `.acilir-yuzey` */
    /* İki şerit `.rp-tools`un DOĞRUDAN çocuğu olur — sarmalayıcı,
       arama kutusuyla aynı flex satırını imkânsız kılıyordu (ölçüldü). */
    var satir = el('div', 'rp-suz rp-suz-satir');
    satir.setAttribute('data-m-suz', '');
    satir.setAttribute('role', 'group');
    satir.setAttribute('aria-label', 'Tercih süzgeci');
    var cipSatir = el('div', 'rp-suz rp-suz-cipler');
    cipSatir.setAttribute('role', 'group');
    cipSatir.setAttribute('aria-label', 'Seçili süzgeçler');

    GRUPLAR.forEach(function (g) {
      var kap = el('div', 'coklu-secim rp-suz-grup');
      kap.setAttribute('data-m-grup', g.k);
      var kutu = el('button', 'coklu-kutu');
      kutu.type = 'button';
      kutu.setAttribute('aria-haspopup', 'listbox');
      kutu.setAttribute('aria-expanded', 'false');
      kutu.setAttribute('aria-label', g.ad + ' süzgeci');
      var ad = el('span', 'rp-suz-ad', g.ad);
      var say = el('span', 'rp-suz-say', '0'); say.hidden = true;
      var ok = el('i', 'fa-solid fa-chevron-down coklu-ok'); ok.setAttribute('aria-hidden', 'true');
      kutu.appendChild(ad); kutu.appendChild(say); kutu.appendChild(ok);

      var pop = el('div', 'acilir-yuzey'); pop.hidden = true;
      var bas = el('div', 'acilir-bas'); bas.appendChild(document.createTextNode(g.ad));
      var temizle = el('button', null, 'Temizle'); temizle.type = 'button';
      bas.appendChild(temizle);
      var araSatir = el('div', 'acilir-ara-satir');
      var araIkon = el('i', 'fa-solid fa-magnifying-glass'); araIkon.setAttribute('aria-hidden', 'true');
      var ara = el('input', 'acilir-arama');
      ara.type = 'text'; ara.autocomplete = 'off';
      ara.placeholder = g.ara; ara.setAttribute('aria-label', g.ara);
      araSatir.appendChild(araIkon); araSatir.appendChild(ara);
      var liste = el('div', 'acilir-liste');
      liste.setAttribute('role', 'listbox');
      liste.setAttribute('aria-multiselectable', 'true');
      liste.setAttribute('aria-label', g.ad);
      var bos = el('p', 'acilir-bos', 'Bu aramaya uyan seçenek yok.'); bos.hidden = true;
      pop.appendChild(bas); pop.appendChild(araSatir); pop.appendChild(liste); pop.appendChild(bos);
      kap.appendChild(kutu); kap.appendChild(pop);
      satir.appendChild(kap);

      kutular[g.k] = { kap:kap, kutu:kutu, ad:ad, say:say, pop:pop, ara:ara, liste:liste, bos:bos };

      kutu.addEventListener('click', function (e) { e.stopPropagation(); ac(g.k, pop.hidden); });
      temizle.addEventListener('click', function (e) {
        e.stopPropagation(); sec[g.k] = []; ciz(); suz();
      });
      ara.addEventListener('input', function () { araSuz(g.k); });
      ara.addEventListener('click', function (e) { e.stopPropagation(); });
      pop.addEventListener('click', function (e) { e.stopPropagation(); });
      kutu.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); ac(g.k, true);
          var ilk = liste.querySelector('.acilir-kalem:not([hidden])'); if (ilk) ilk.focus(); }
      });
      pop.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); ac(g.k, false); kutu.focus(); }
      });
    });

    var tumTemiz = el('button', 'cip rp-suz-temiz');
    tumTemiz.type = 'button';
    tumTemiz.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i> Süzgeci temizle';
    tumTemiz.hidden = true;
    tumTemiz.addEventListener('click', function () {
      GRUPLAR.forEach(function (g) { sec[g.k] = []; }); ciz(); suz();
      satir.querySelector('.coklu-kutu').focus();      /* odak kaybolmasın */
    });
    /* 🔴 "Süzgeci temizle" AÇILIR ŞERİDİNE DEĞİL, ÇİP ŞERİDİNE konur.
       İlk yazımda kutuların yanındaydı: seçim yapılınca satır dolup
       düğme İKİNCİ SATIRA kırılıyordu ve dört kutunun hizası
       bozuluyordu (1440 karesinde gözle görüldü,
       rapor/ss/p4/alt/m1-alt-a.png'in ilk sürümü). Düğme zaten
       SEÇİMLERLE birlikte doğup ölüyor; yeri de onların yanı. */
    cipSatir.appendChild(tumTemiz);

    araclar.appendChild(satir);
    araclar.appendChild(cipSatir);
    document.addEventListener('click', function () { GRUPLAR.forEach(function (g) { ac(g.k, false); }); });

    function ac(k, acik) {
      GRUPLAR.forEach(function (g) {
        var b = kutular[g.k];
        var a = (g.k === k) ? !!acik : false;
        b.pop.hidden = !a;
        b.kutu.setAttribute('aria-expanded', a ? 'true' : 'false');
      });
    }
    function araSuz(k) {
      var b = kutular[k], q = b.ara.value.trim().toLocaleLowerCase('tr'), n = 0;
      [].forEach.call(b.liste.children, function (kl) {
        var g = !q || kl.getAttribute('data-etiket').toLocaleLowerCase('tr').indexOf(q) >= 0;
        kl.hidden = !g; if (g) n++;
      });
      b.bos.hidden = n > 0;
    }

    /* ── ADAYLAR ── `#rpGrid`teki kartlar. O ızgara `havuzCiz()`in
       çıktısı: menüde olan tarifler zaten düşmüş, arama zaten
       uygulanmış. Kendi süzgecim ONUN üstüne biner. */
    function adaylar() {
      return [].slice.call(grid.querySelectorAll('.rp-card[data-recipe-slug]'))
        .map(function (k) {
          var s = k.getAttribute('data-recipe-slug');
          return { el:k, slug:s, o:olgu[s] || { kategori:'', sure:'', zorluk:'', beslenme:[] } };
        });
    }
    function gecer(o, haric) {
      for (var i = 0; i < GRUPLAR.length; i++) {
        var g = GRUPLAR[i].k;
        if (g === haric || !sec[g].length) continue;
        if (g === 'beslenme') {
          if (!sec[g].some(function (v) { return (o.beslenme || []).indexOf(v) >= 0; })) return false;
        } else if (sec[g].indexOf(o[g]) < 0) return false;
      }
      return true;
    }

    /* Sayaç kendi grubunun seçimini HARİÇ tutar — bugünkü mantık aynen
       korundu (`cipGecer(t, haric)`). */
    function sayaclar(k) {
      var m = {};
      adaylar().forEach(function (a) {
        if (!gecer(a.o, k)) return;
        var d = (k === 'beslenme') ? (a.o.beslenme || []) : [a.o[k]];
        d.forEach(function (v) { if (v) m[v] = (m[v] || 0) + 1; });
      });
      return m;
    }

    function etiketle(k, v) { return k === 'beslenme' ? (BESLENME_AD[v] || v) : v; }

    function ciz() {
      GRUPLAR.forEach(function (g) {
        var b = kutular[g.k], say = sayaclar(g.k);
        var anahtar = Object.keys(say);
        /* seçili ama sayacı 0 olan değer de listede kalır — yoksa
           kullanıcı kendi seçimini geri alamaz */
        sec[g.k].forEach(function (v) { if (anahtar.indexOf(v) < 0) anahtar.push(v); });
        if (g.k === 'sure')        anahtar.sort(function (a, c) { return SURE_KADEME.map(function (x) { return x.ad; }).indexOf(a) - SURE_KADEME.map(function (x) { return x.ad; }).indexOf(c); });
        else if (g.k === 'zorluk') anahtar.sort(function (a, c) { return ZORLUK_SIRA.indexOf(a) - ZORLUK_SIRA.indexOf(c); });
        else anahtar.sort(function (a, c) { return (say[c] || 0) - (say[a] || 0) || etiketle(g.k, a).localeCompare(etiketle(g.k, c), 'tr'); });

        b.liste.innerHTML = '';
        anahtar.forEach(function (v) {
          var n = say[v] || 0, secili = sec[g.k].indexOf(v) >= 0;
          var kl = el('button', 'acilir-kalem' + (secili ? ' aktif' : ''));
          kl.type = 'button';
          kl.setAttribute('role', 'option');
          kl.setAttribute('aria-selected', secili ? 'true' : 'false');
          kl.setAttribute('data-deger', v);
          kl.setAttribute('data-etiket', etiketle(g.k, v));
          if (!n && !secili) kl.disabled = true;
          var ik = el('i', secili ? 'fa-solid fa-square-check' : 'fa-regular fa-square');
          ik.setAttribute('aria-hidden', 'true');
          kl.appendChild(ik);
          kl.appendChild(el('span', null, etiketle(g.k, v)));
          kl.appendChild(el('span', 'yan', String(n)));
          kl.addEventListener('click', function (e) {
            e.stopPropagation();
            var i = sec[g.k].indexOf(v);
            if (i < 0) sec[g.k].push(v); else sec[g.k].splice(i, 1);
            ciz(); suz();
            var y = kutular[g.k].liste.querySelector('[data-deger="' + CSS.escape(v) + '"]');
            if (y) y.focus();
          });
          b.liste.appendChild(kl);
        });
        araSuz(g.k);
        /* B KİPİ için kutu içi çipler — varsayılanda CSS ile gizli;
           `.rp-tools[data-m1-alt="b"]` açar. Alternatif ölçülebilir
           kalsın diye üretiliyor, A kipinde çizime GİRMİYOR. */
        [].slice.call(b.kutu.querySelectorAll('.rp-suz-kutu-cip')).forEach(function (x) { x.remove(); });
        sec[g.k].forEach(function (v) {
          var c = el('span', 'coklu-cip rp-suz-kutu-cip', etiketle(g.k, v));
          b.kutu.insertBefore(c, b.say);
        });
        var n = sec[g.k].length;
        b.say.textContent = String(n); b.say.hidden = !n;
        b.ad.textContent = g.ad;
        b.kutu.setAttribute('aria-label', g.ad + ' süzgeci' + (n ? ' — ' + n + ' seçili' : ''));
      });

      /* Seçilen çip şeridi. 🔴 `innerHTML=''` ŞERİDİ TEMİZLERKEN
         "Süzgeci temizle" DÜĞMESİNİ DE SİLİYORDU (düğme şeridin içinde
         yaşıyor): ikinci çizimden sonra düğme DOM'dan düşüyor, kapı
         `null.click()` ile ÇÖKÜYORDU. Yalnız çipler kaldırılır. */
      [].slice.call(cipSatir.querySelectorAll('.coklu-cip')).forEach(function (x) { x.remove(); });
      var toplam = 0;
      GRUPLAR.forEach(function (g) {
        sec[g.k].forEach(function (v) {
          toplam++;
          var c = el('span', 'coklu-cip');
          c.appendChild(el('span', null, etiketle(g.k, v)));
          var x = el('button', null); x.type = 'button';
          x.setAttribute('aria-label', etiketle(g.k, v) + ' süzgecini kaldır');
          x.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
          x.addEventListener('click', function () {
            sec[g.k].splice(sec[g.k].indexOf(v), 1); ciz(); suz();
          });
          c.appendChild(x);
          cipSatir.insertBefore(c, tumTemiz);
        });
      });
      tumTemiz.hidden = toplam === 0;
    }

    /* ── SÜZME ── kart SİLİNMEZ, görünürlüğü kapanır. */
    var bosKart = null;
    function suz() {
      var a = adaylar(), gorunur = 0;
      a.forEach(function (x) {
        var g = gecer(x.o, null);
        if (g) { x.el.removeAttribute('data-m-suz-disi'); gorunur++; }
        else x.el.setAttribute('data-m-suz-disi', '');
      });
      if (bosKart && bosKart.parentNode) bosKart.parentNode.removeChild(bosKart);
      bosKart = null;
      if (a.length && !gorunur) {
        /* Boş hâl kalıbı `havuzCiz()`in kendi `.rp-empty`si — uydurulmadı. */
        bosKart = el('div', 'rp-empty');
        bosKart.innerHTML = '<i class="fa-solid fa-bowl-rice" aria-hidden="true"></i>' +
          '<p>Seçtiğin süzgeçlere uyan tarif yok.</p>';
        grid.appendChild(bosKart);
      }
    }

    /* ── POPUP AÇILIŞI ── `havuzAc()` `durum.sec`i sıfırlıyor; bizimki
       de sıfırlanmalı, yoksa iki süzgeç ayrı hatırlar. */
    var acikti = modal.classList.contains('show');
    new MutationObserver(function () {
      var a = modal.classList.contains('show');
      if (a === acikti) return;
      acikti = a;
      if (!a) return;
      olgu = tarifOlgulari();
      GRUPLAR.forEach(function (g) { sec[g.k] = []; kutular[g.k].ara.value = ''; });
      ac(null, false);
      ciz(); suz();
    }).observe(modal, { attributes:true, attributeFilter:['class'] });

    /* ── IZGARA YENİDEN ÇİZİLDİ ── (arama · yeniden açılış). */
    new MutationObserver(function () { ciz(); suz(); })
      .observe(grid, { childList:true });

    olgu = tarifOlgulari();
    ciz(); suz();
    return { sec:sec, ciz:ciz, suz:suz, satir:satir, cipSatir:cipSatir };
  }

  /* ═══════════════════════════════════════════════════════════════════
     M2 · MENÜ TILE — AÇ / KAPA
     ═══════════════════════════════════════════════════════════════════ */
  function tileOlgu(menuEl) {
    /* Olgular menünün KENDİ araç çubuğundan okunur; `menuTazele()`
       orayı güncelliyor, biz de oradan besleniyoruz — "aynı sayı →
       kaynağa bak": tek tanık, iki yüzey. */
    var mbm = menuEl.querySelectorAll('.menu-bar-meta .mbm');
    function b(i) { var e = mbm[i] && mbm[i].querySelector('b'); return e ? e.textContent.trim() : ''; }
    var kart = menuEl.querySelectorAll('article.menu-card').length;
    return { kap:b(0) || (kart + ' kap'), sure:b(1), kisi:b(2), kart:kart };
  }
  function tileTazele(menuEl) {
    var t = menuEl.querySelector(':scope > .mnl-tile');
    if (!t) return;
    var o = tileOlgu(menuEl);
    var f = t.querySelector('.fiyat b'); if (f) f.textContent = String(o.kart);
    var s = t.querySelector('[data-mnl-sure]'); if (s) s.textContent = o.sure;
    var k = t.querySelector('[data-mnl-kisi]'); if (k) k.textContent = o.kisi;
    var ad = menuEl.querySelector('.md-title-text');
    var tb = t.querySelector('.bilgi b');
    if (ad && tb) tb.textContent = ad.textContent.trim();
  }
  function tileBagla(menuEl) {
    var t = menuEl.querySelector(':scope > .mnl-tile');
    if (!t || t.dataset.mBagli) return;
    t.dataset.mBagli = '1';
    t.addEventListener('click', function () {
      var acik = menuEl.classList.toggle('mnl-kapali') === false;
      t.setAttribute('aria-expanded', acik ? 'true' : 'false');
      if (acik) tileTazele(menuEl);
    });
    /* kart eklenip çıktıkça satır olguları senkron kalsın */
    var set = menuEl.querySelector('.menu-set');
    if (set) new MutationObserver(function () { tileTazele(menuEl); })
      .observe(set, { childList:true, subtree:true, characterData:true });
  }
  function m2() {
    var tumu = [].slice.call(document.querySelectorAll('article.menu-detail'));
    if (!tumu.length) return null;
    tumu.forEach(tileBagla);
    /* `kopyala()` bütün article'ı KLONLUYOR — klonun tile kimliği
       çiftlenir. Panoyu izle, yeni gelen article'ı yeniden anahtarla. */
    var sayac = 0;
    document.querySelectorAll('[data-pane]').forEach(function (pano) {
      new MutationObserver(function (ml) {
        ml.forEach(function (m) {
          [].forEach.call(m.addedNodes, function (n) {
            if (n.nodeType !== 1 || !n.matches || !n.matches('article.menu-detail')) return;
            var t = n.querySelector(':scope > .mnl-tile');
            if (t) {
              var yeniK = 'mnl-kopya-' + (++sayac);
              var hedef = [];
              ['.md-head', '.menu-bar-sec', '.menu-set'].forEach(function (s, i) {
                var e = n.querySelector(':scope > ' + s);
                if (e) { e.id = yeniK + '-' + i; hedef.push(e.id); }
              });
              t.setAttribute('aria-controls', hedef.join(' '));
              delete t.dataset.mBagli;
            }
            n.classList.add('mnl-kapali');
            if (t) t.setAttribute('aria-expanded', 'false');
            tileBagla(n); tileTazele(n);
          });
        });
      }).observe(pano, { childList:true, subtree:true });
    });
    return { tile: document.querySelectorAll('.mnl-tile').length };
  }

  /* ═══════════════════════════════════════════════════════════════════
     M3a · ALIŞVERİŞ PANOSU — dmDepo'dan GERÇEK liste
     -----------------------------------------------------------------
     🔴 Sayfa bugüne kadar 21 malzeme · "%38 tamamlandı" uydurma sabit
        veri basıyordu. Hepsi düştü; her sayı `dmDepo.liste()`den
        hesaplanıyor. Liste boşsa BOŞ HÂL görünür — sıfır gerçek bir
        sayıdır.
     ═══════════════════════════════════════════════════════════════════ */
  function m3a() {
    var liste = document.getElementById('shopList');
    if (!liste || !window.dmDepo) return null;
    var D = window.dmDepo;
    var bos     = document.getElementById('alBos');
    var sayac   = document.getElementById('alCount');
    var ssTotal = document.getElementById('ssTotal');
    var ssDone  = document.getElementById('ssDone');
    var ssBar   = document.getElementById('ssBar');
    var ssPct   = document.getElementById('ssPct');
    var ssSub   = document.getElementById('ssSub');
    var alPrint = document.getElementById('alPrint');
    var bantSayac = document.getElementById('alBantSayac');
    var clearDone = document.getElementById('clearDone');
    var addName = document.getElementById('addName');
    var addQty  = document.getElementById('addQty');
    var addReyon= document.getElementById('addReyon');
    var addBtn  = document.getElementById('addBtn');
    var paylasBtn = document.getElementById('alShare');
    var paylasPop = document.getElementById('alSharePop');

    function ciz() {
      var l = D.liste();
      var toplam = l.length;
      var alinan = l.filter(function (k) { return k.alindi; }).length;
      var yuzde = toplam ? Math.round(alinan / toplam * 100) : 0;

      /* reyon sırası deponun kendi REYONLAR dizisinden — prototipin
         `#addReyon` seçenek SIRASI (uydurulmadı). */
      var kova = {}, reyonSay = 0;
      l.forEach(function (k) { (kova[k.reyon] = kova[k.reyon] || []).push(k); });

      liste.innerHTML = '';
      D.REYONLAR.forEach(function (r) {
        var ks = kova[r.k];
        if (!ks || !ks.length) return;
        reyonSay++;
        var grup = el('div', 'shop-group');
        grup.setAttribute('data-reyon', r.k);
        var bas = el('div', 'shop-ghead');
        var i = el('i', 'fa-solid ' + r.ikon); i.setAttribute('aria-hidden', 'true');
        bas.appendChild(i);
        bas.appendChild(el('b', null, r.ad));
        bas.appendChild(el('span', 'gcnt', ks.length + ' kalem'));
        var kap = el('div', 'shop-items');
        ks.forEach(function (k) {
          var lb = el('label', 'shop-item' + (k.alindi ? ' done' : ''));
          lb.setAttribute('data-id', k.id);
          var cb = el('input'); cb.type = 'checkbox'; cb.checked = !!k.alindi;
          cb.setAttribute('aria-label', k.ad + ' — alındı olarak işaretle');
          cb.addEventListener('change', function () { D.isaretle(k.id, cb.checked); });
          var cbx = el('span', 'cbx'); cbx.setAttribute('aria-hidden', 'true');
          var ad = el('span', 'si-name');
          ad.appendChild(document.createTextNode(k.ad));
          if (k.kaynak && k.kaynak.length) {
            ad.appendChild(el('small', 'si-src', k.kaynak.map(function (x) { return x.ad; }).join(' · ')));
          } else if (k.el) {
            ad.appendChild(el('small', 'si-src', 'Elle eklendi'));
          }
          var mik = el('span', 'si-qty', k.miktar || '—');
          var sil = el('button', 'si-del'); sil.type = 'button';
          sil.setAttribute('aria-label', k.ad + ' kalemini listeden çıkar');
          sil.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
          sil.addEventListener('click', function (e) {
            e.preventDefault(); e.stopPropagation();
            var yedek = k;
            D.cikar(k.id);
            toast('Listeden çıkarıldı', { alt:k.ad, geri:{ cb:function () { D.ekle(yedek); } } });
          });
          lb.appendChild(cb); lb.appendChild(cbx); lb.appendChild(ad); lb.appendChild(mik); lb.appendChild(sil);
          kap.appendChild(lb);
        });
        grup.appendChild(bas); grup.appendChild(kap);
        liste.appendChild(grup);
      });

      /* Boş hâl ↔ liste: ikisi aynı anda görünmez. `hidden` tek kaynak. */
      if (bos) bos.hidden = toplam > 0;
      liste.hidden = toplam === 0;
      if (sayac) sayac.textContent = toplam + ' kalem';
      if (ssTotal) ssTotal.textContent = String(toplam);
      if (ssDone)  ssDone.textContent  = String(alinan);
      if (ssPct)   ssPct.textContent   = String(yuzde);
      if (ssSub)   ssSub.textContent   = toplam + ' kalem · ' + reyonSay + ' reyon';
      /* 🔴 Bu bir DEĞER, markup değil: donörün `style="width:0%"`ı
         satır içi yazılmıştı, buraya çalışma zamanına taşındı. */
      if (ssBar) { ssBar.style.width = yuzde + '%';
        var p = ssBar.parentNode;
        if (p) { p.setAttribute('role','progressbar'); p.setAttribute('aria-valuenow', String(yuzde));
                 p.setAttribute('aria-valuemin','0'); p.setAttribute('aria-valuemax','100');
                 p.setAttribute('aria-label','Listenin tamamlanma oranı'); } }
      /* Bandın "Listedeki malzeme" sayacı — aynı tek tanıktan.
         (Uydurma "21" enjektörde kimliğe bağlandı.) */
      if (bantSayac) bantSayac.textContent = String(toplam);
      if (clearDone) clearDone.disabled = alinan === 0;
      if (alPrint)   alPrint.disabled   = toplam === 0;

      /* pano hapları — GERÇEK sayaç */
      var hap = document.getElementById('alHaplar');
      if (hap) {
        var kaynak = {};
        l.forEach(function (k) { (k.kaynak || []).forEach(function (x) { kaynak[x.slug] = 1; }); });
        hap.innerHTML =
          '<span class="galeri-hap"><i class="fa-solid fa-basket-shopping hap-kazanildi"></i> <b>' + toplam + '</b> malzeme</span>' +
          '<span class="galeri-hap"><i class="fa-solid fa-circle-check hap-kazanildi"></i> <b>' + alinan + '</b> alındı</span>' +
          '<span class="galeri-hap"><i class="fa-solid fa-hourglass-half hap-yolda"></i> <b>' + (toplam - alinan) + '</b> kaldı</span>' +
          '<span class="galeri-hap"><i class="fa-solid fa-utensils hap-olcusuz"></i> <b>' + Object.keys(kaynak).length + '</b> tariften geldi</span>';
      }
    }

    if (addBtn) addBtn.addEventListener('click', function () {
      var ad = (addName && addName.value || '').trim();
      if (!ad) { if (addName) addName.focus(); toast('Kalem adı gerekli', { tip:'hata' }); return; }
      var s = D.ekle({ ad:ad, miktar:(addQty && addQty.value || '').trim(),
                       reyon:(addReyon && addReyon.value) || undefined, el:true, kaynak:[] });
      if (addName) addName.value = ''; if (addQty) addQty.value = '';
      toast(s.durum === 'eklendi' ? 'Listeye eklendi' : 'Listede zaten vardı, birleştirildi',
            { alt:ad, geri:s.durum === 'eklendi' ? { cb:function () { D.cikar(s.kalem.id); } } : null });
      if (addName) addName.focus();
    });
    if (addName) addName.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addBtn && addBtn.click(); }
    });
    if (clearDone) clearDone.addEventListener('click', function () {
      var yedek = D.liste().filter(function (k) { return k.alindi; });
      if (!yedek.length) return;
      D.temizle(true);
      toast(yedek.length + ' işaretli kalem silindi', {
        geri:{ cb:function () { yedek.forEach(function (k) { D.ekle(k); D.isaretle(k.id, true); }); } } });
    });
    function yazdir() {
      document.body.classList.add('dm-liste-yazdir');
      window.print();
    }
    window.addEventListener('afterprint', function () {
      document.body.classList.remove('dm-liste-yazdir');
    });
    if (alPrint) alPrint.addEventListener('click', yazdir);
    if (paylasBtn && paylasPop) {
      paylasBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var a = paylasPop.hidden;
        paylasPop.hidden = !a;
        paylasBtn.setAttribute('aria-expanded', a ? 'true' : 'false');
      });
      paylasPop.addEventListener('click', function (e) { e.stopPropagation(); });
      document.addEventListener('click', function () {
        paylasPop.hidden = true; paylasBtn.setAttribute('aria-expanded', 'false');
      });
      function listeMetni() {
        return D.liste().map(function (k) {
          return '• ' + k.ad + (k.miktar ? ' — ' + k.miktar : '');
        }).join('\n');
      }
      var wa = paylasPop.querySelector('[data-share="wa"]');
      var pdf = paylasPop.querySelector('[data-share="pdf"]');
      if (wa) wa.addEventListener('click', function () {
        /* Donörün `href="#"` yer tutucusu DEĞİL: gerçek paylaşım
           niyeti, gerçek listeyle. Boşken tıklanamaz. */
        var m = listeMetni();
        if (!m) { toast('Listen boş', { tip:'bilgi' }); return; }
        wa.href = 'https://wa.me/?text=' + encodeURIComponent('Alışveriş listem\n' + m);
      });
      if (pdf) pdf.addEventListener('click', function () { paylasPop.hidden = true; yazdir(); });
      var kopyala = paylasPop.querySelector('[data-share="copy"]');
      if (kopyala) kopyala.addEventListener('click', function () {
        var m = listeMetni();
        if (!m) { toast('Listen boş', { tip:'bilgi' }); paylasPop.hidden = true; return; }
        if (navigator.clipboard) navigator.clipboard.writeText(m).then(
          function () { toast('Liste panoya kopyalandı', { alt:D.liste().length + ' kalem' }); },
          function () { toast('Panoya kopyalanamadı', { tip:'hata' }); });
        else toast('Bu tarayıcı panoya kopyalamıyor', { tip:'hata' });
        paylasPop.hidden = true;
      });
    }

    document.addEventListener('dm-depo', function (e) {
      if (!e.detail || (e.detail.bolum !== 'alisveris' && e.detail.bolum !== '*')) return;
      ciz();
    });
    ciz();
    return { ciz:ciz };
  }

  /* ═══════════════════════════════════════════════════════════════════
     M3b · TARİF DETAYI — MALZEME SATIRI ↔ LİSTE
     -----------------------------------------------------------------
     🔴 TUZAK (deponun kayıtlı dersi + parti 3 A): `.ing-add`
        `<form onclick="event.stopPropagation()">` İÇİNDE. Delegasyon
        `document`e ULAŞMAZ — düğmeye DOĞRUDAN bağlanır ve form'un
        `submit`i `preventDefault` edilir, yoksa sayfa yeniden yüklenir.
     ═══════════════════════════════════════════════════════════════════ */
  function satirKalemi(satir) {
    var n = satir.querySelector('.in');
    if (!n) return null;
    var c = n.cloneNode(true);
    c.querySelectorAll('small').forEach(function (s) { s.remove(); });
    var ad = c.textContent.trim().replace(/\s+/g, ' ');
    if (!ad) return null;
    /* 🔴 Miktar porsiyona göre DEĞİŞİR — okuma ANINDA okunur, önbelleğe
       alınmaz (aksi hâlde porsiyon artırılınca eski miktar eklenirdi). */
    var q = satir.querySelector('.iq');
    var mik = q ? q.textContent.trim().replace(/\s+/g, ' ') : '';
    var h1 = document.querySelector('h1');
    var baslik = h1 ? h1.textContent.trim().replace(/\s+/g, ' ') : '';
    var slug = (location.pathname.split('/').pop() || '')
      .replace(/^en__/, '').replace(/^tarif__/, '').replace(/\.html$/, '');
    return { ad:ad, miktar:mik, kaynak: baslik ? [{ slug:slug, ad:baslik }] : [] };
  }

  function m3b() {
    var dugmeler = [].slice.call(document.querySelectorAll('.ing-add'));
    var hepsi = document.getElementById('addAllBtn');
    if (!dugmeler.length && !hepsi) return null;
    if (!window.dmDepo) return null;
    var D = window.dmDepo;

    /* Form gönderimi kesilir — düğme `type="submit"`. */
    document.querySelectorAll('.ing-acts form, .ing-foot form').forEach(function (f) {
      if (f.dataset.mBagli) return;
      f.dataset.mBagli = '1';
      f.addEventListener('submit', function (e) { e.preventDefault(); });
    });

    function durumTazele() {
      dugmeler.forEach(function (b) {
        var satir = b.closest('.ing-row');
        var k = satir && satirKalemi(satir);
        var v = k && D.kalemVar(k.ad);
        b.classList.toggle('listede', !!v);
        b.setAttribute('aria-pressed', v ? 'true' : 'false');
        b.title = v ? S('Alışveriş listesinden çıkar', 'Remove from shopping list')
                    : S('Alışveriş listesine ekle', 'Add to shopping list');
        b.setAttribute('aria-label', b.title);
      });
    }

    dugmeler.forEach(function (b) {
      if (b.dataset.mBagli) return;
      b.dataset.mBagli = '1';
      b.setAttribute('data-m-bagli', '1');
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var satir = b.closest('.ing-row');
        var k = satir && satirKalemi(satir);
        if (!k) return;
        if (D.kalemVar(k.ad)) {
          D.cikar(D.slugla(k.ad));
          toast(S('Listeden çıkarıldı', 'Removed from list'),
                { alt:k.ad, geri:{ metin:S('Geri al','Undo'), cb:function () { D.ekle(k); } } });
        } else {
          var s = D.ekle(k);
          toast(s.durum === 'birlesti' ? S('Listede vardı, miktar eklendi', 'Already listed — amount merged')
                                       : S('Listeye eklendi', 'Added to list'),
                { alt:k.ad + (k.miktar ? ' · ' + k.miktar : ''),
                  geri:{ metin:S('Geri al','Undo'), cb:function () { D.cikar(s.kalem.id); } } });
        }
      });
    });

    if (hepsi && !hepsi.dataset.mBagli) {
      hepsi.dataset.mBagli = '1';
      hepsi.setAttribute('data-m-bagli', '1');
      hepsi.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var eklenen = [], zaten = 0;
        [].slice.call(document.querySelectorAll('.ing-row')).forEach(function (satir) {
          var k = satirKalemi(satir);
          if (!k) return;
          if (D.kalemVar(k.ad)) { zaten++; return; }
          var s = D.ekle(k);
          if (s.durum === 'eklendi') eklenen.push(s.kalem.id);
        });
        if (!eklenen.length) {
          toast(S('Hepsi listende zaten var', 'Everything is already on your list'),
                { tip:'bilgi', alt: zaten + S(' malzeme', ' ingredients') });
          return;
        }
        toast(eklenen.length + S(' malzeme listeye eklendi', ' ingredients added'),
              { alt: zaten ? zaten + S(' tanesi zaten vardı', ' were already there') : null,
                geri:{ metin:S('Geri al','Undo'), cb:function () { eklenen.forEach(function (i) { D.cikar(i); }); } } });
      });
    }

    document.addEventListener('dm-depo', function (e) {
      if (!e.detail || (e.detail.bolum !== 'alisveris' && e.detail.bolum !== '*')) return;
      durumTazele();
    });
    /* Porsiyon değişince satırın miktarı değişir; DURUM adla tutuluyor,
       ad değişmediği için işaret kalır — yine de yeniden okunur. */
    var kap = document.getElementById('ingList');
    if (kap) new MutationObserver(durumTazele).observe(kap, { subtree:true, characterData:true, childList:true });
    durumTazele();
    return { ingAdd:dugmeler.length, addAll:!!hepsi };
  }


  /* ═══════════════════════════════════════════════════════════════════
     ORTAK · MALZEME SÖZLÜĞÜ
     -----------------------------------------------------------------
     🔴 VERİ UYDURULMAZ. `gastro-tarif-adimlari.json` canlı donörün
     tarif sayfalarından hasat edilmiş 65 tarif · 506 malzeme ve
     `gmenulerim-duzen.js`in KENDİ kullandığı kaynak — M4 ve M6 aynı
     tanıktan besleniyor ("aynı sayı → kaynağa bak"in doğru yönü:
     iki yüzey aynı sayıyı basıyorsa aynı KAYNAKTAN basmalı).
     ═══════════════════════════════════════════════════════════════════ */
  var _malzemeSoz = null;
  function malzemeler() {
    if (!_malzemeSoz) _malzemeSoz = fetch('varliklar/reference/shared/gastro-tarif-adimlari.json',
      { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });          /* null = OKUNAMADI, {} DEĞİL */
    return _malzemeSoz;
  }
  function miktarMetni(m) {
    if (m.miktar == null) return '';
    var s = String(Math.round(m.miktar * 100) / 100);
    return m.birim ? s + ' ' + m.birim : s;
  }
  /* Menünün kaplarını gezer; her kap için sözlükten malzeme çeker.
     Sözlükte OLMAYAN kap için satır BASILMAZ, adı `eksik`e yazılır. */
  function menuMalzemesi(menuEl, soz) {
    var kalem = [], eksik = [];
    [].slice.call(menuEl.querySelectorAll('article.menu-card[data-recipe-slug]')).forEach(function (k) {
      var slug = k.getAttribute('data-recipe-slug');
      var bas = k.querySelector('.mc-body h3 a');
      var ad = bas ? bas.textContent.trim().replace(/\s+/g, ' ') : slug;
      var mz = (soz[slug] || {}).malzeme || [];
      if (!mz.length) { eksik.push(ad); return; }
      mz.forEach(function (m) {
        kalem.push({ ad: m.ad, miktar: miktarMetni(m), kaynak: [{ slug: slug, ad: ad }] });
      });
    });
    return { kalem: kalem, eksik: eksik };
  }

  /* ═══════════════════════════════════════════════════════════════════
     M4 · "ALIŞVERİŞ LİSTESİ OLUŞTUR" → dmDepo
     -----------------------------------------------------------------
     ÖNCE ölçüldü: düğme `.mnl-panel`ini açıyor (33 satır) ama
     `dmDepo.liste()` 0 → 0; toast yok. Yani özet çıkıyor, LİSTE
     doğmuyor — L3'ün "g-menulerim#alisveris o listeyi gösterir"
     cümlesinin yarısı eksikti.

     🔴 `gmenulerim-duzen.js` BENİM DOSYAM DEĞİL: paneli o açıyor,
        ben AYNI düğmeye İKİNCİ bir dinleyici bağlıyorum. Panel
        SİLİNMİYOR — özet onun, depoya yazmak benim.

     🔴 HER TIKLAMADA yazılır, panelin açık/kapalı olmasına BAKILMAZ.
        Sebep ölçüldü: `kopyala()` article'ı klonlarken `data-mnl="1"`
        niteliği de kopyalanıyor ve `menuBagla` klonu ATLIYOR — klon
        menünün çubuk düğmeleri ÖLÜ (kaynakta kusur, bildirildi).
        Panel varlığına bağlansaydım klonlarda ben de ölürdüm.
        Depo zaten BİRLEŞTİRİYOR: ikinci tık satır çoğaltmaz, toast
        "hepsi zaten listende" der. Sonuç her tıklamada DOĞRU.
     ═══════════════════════════════════════════════════════════════════ */
  function m4() {
    var dugmeler = [].slice.call(document.querySelectorAll('.menu-bar-acts [data-mnl-eylem="liste"]'));
    if (!dugmeler.length || !window.dmDepo) return null;
    var D = window.dmDepo;

    dugmeler.forEach(function (b) {
      if (b.dataset.m4) return;
      b.dataset.m4 = '1';
      b.setAttribute('data-m4-bagli', '1');
      b.addEventListener('click', function () {
        var menuEl = b.closest('article.menu-detail');
        if (!menuEl) return;
        var adEl = menuEl.querySelector('.md-title-text');
        var menuAd = adEl ? adEl.textContent.trim() : '';
        malzemeler().then(function (soz) {
          if (!soz) {                       /* okunamadı — SAYI UYDURMA */
            toast('Malzeme listesi okunamadı', { tip:'hata',
              alt:'Bağlantı yokken menüden liste çıkarılamıyor' });
            return;
          }
          var v = menuMalzemesi(menuEl, soz);
          var eklenen = [], zaten = 0, birlesen = 0;
          v.kalem.forEach(function (k) {
            var s = D.ekle(k);
            if (s.durum === 'eklendi') eklenen.push(s.kalem.id);
            else if (s.durum === 'birlesti') birlesen++;
            else zaten++;
          });
          var alt = [];
          if (birlesen) alt.push(birlesen + ' satır birleşti');
          if (zaten) alt.push(zaten + ' kalem zaten vardı');
          if (v.eksik.length) alt.push(v.eksik.length + ' kabın malzeme verisi yok');
          if (!eklenen.length) {
            toast(v.kalem.length
                    ? 'Bu menünün malzemeleri zaten listende'
                    : 'Bu menünün malzeme verisi yok',
                  { tip:'bilgi', alt: alt.join(' · ') || menuAd });
            return;
          }
          toast(eklenen.length + ' malzeme listene eklendi',
            { alt: (menuAd ? menuAd + (alt.length ? ' · ' : '') : '') + alt.join(' · '),
              geri: { metin:'Geri al', cb:function () { eklenen.forEach(function (i) { D.cikar(i); }); } } });
        });
      });
    });
    return { dugme: dugmeler.length };
  }

  /* ═══════════════════════════════════════════════════════════════════
     M5 · ÖLÜ SÜZGEÇ ÇİPLERİ
     -----------------------------------------------------------------
     ÖNCE ölçüldü: `#gunluk` 5 + `#ozel-gun` 3 = SEKİZ çip; tıklamak
     hiçbir şey yapmıyor (menü sayısı değişmiyor, `aria-pressed`
     dönmüyor, veri niteliği 0). `.cip.suzgec` dinleyicisi yalnız ajan
     A'nın dosyalarında ve bu sayfada YÜKLÜ DEĞİL.

     🔴 BAŞKA KULVARIN DİNLEYİCİSİNE GÜVENİLMEDİ — kendi dinleyicim.
     🔴 Değerler enjektörde SAYFANIN KENDİ SAYILARINA karşı doğrulandı
        (bkz. gastro-p4-ajan-m.mjs §M5); burada yalnız okunuyor.
     🔴 `classList.toggle(ad, kosul)` İKİ ARGÜMANLI ÇAĞRILMAZ —
        ikinci argüman `undefined` gelirse toggle TAKAS eder ve her çip
        aktif kalır, `aria-pressed` yine doğru basar (deponun kayıtlı
        dersi). Sınıf `add`/`remove` ile açık açık yazılıyor.
     ═══════════════════════════════════════════════════════════════════ */
  function m5() {
    var kaplar = [].slice.call(document.querySelectorAll('.cipler'))
      .filter(function (k) { return k.querySelector('.cip.suzgec[data-suz-deger]'); });
    if (!kaplar.length) return null;
    var kurulan = [];

    kaplar.forEach(function (kap) {
      var pano = kap.closest('[data-pane]');
      if (!pano || kap.dataset.m5) return;
      kap.dataset.m5 = '1';
      var cipler = [].slice.call(kap.querySelectorAll('.cip.suzgec[data-suz-deger]'));
      var secili = '';

      /* Boş hâl — kanonun `.bos-durum`u; yeni bileşen açılmadı. */
      var bos = document.createElement('div');
      bos.className = 'bos-durum kart-ici mnl-suz-bos';
      bos.hidden = true;
      bos.setAttribute('role', 'status');
      bos.innerHTML = '<span class="bos-ikon"><i class="fa-solid fa-filter-circle-xmark" aria-hidden="true"></i></span>' +
        '<h3>Bu süzgeçle menü yok</h3><p>Seçtiğin süzgece uyan menü bulunamadı. ' +
        '“Tümü”ne dokunarak listeyi geri getirebilirsin.</p>';
      var sonMenu = [].slice.call(pano.querySelectorAll('article.menu-detail')).pop();
      if (sonMenu && sonMenu.parentNode) sonMenu.parentNode.insertBefore(bos, sonMenu.nextSibling);

      function menuler() {
        return [].slice.call(pano.querySelectorAll('article.menu-detail'));
      }
      /* 🔴 `ciz()` DOM'a yazıyor ve gözlemci DOM'u dinliyor: ilk
         çizimde çip etiketi `appendChild` ile doğuyor ve gözlemciyi
         tetikliyor. İkinci çizimde metin düğümü zaten var (yalnız
         `nodeValue` değişir, childList değil) ve döngü kendiliğinden
         duruyor — ama bayrak açıkça yazıldı, kendiliğindenliğe
         güvenilmedi. */
      var cizimde = false;
      function ciz() {
        if (cizimde) return 0;
        cizimde = true;
        try { return cizGovde(); } finally { cizimde = false; }
      }
      function cizGovde() {
        var hepsi = menuler();
        var gorunur = 0;
        hepsi.forEach(function (m) {
          var uyar = !secili || m.getAttribute('data-suz') === secili;
          if (uyar) { m.classList.remove('mnl-suz-disi'); gorunur++; }
          else m.classList.add('mnl-suz-disi');
        });
        /* SAYAÇLAR GERÇEK — o anki DOM'dan, markup'tan değil. */
        cipler.forEach(function (c) {
          var d = c.getAttribute('data-suz-deger');
          var n = d ? hepsi.filter(function (m) { return m.getAttribute('data-suz') === d; }).length
                    : hepsi.length;
          var etiket = (c.getAttribute('data-suz-etiket') ||
            (function () { var t = c.textContent.trim().replace(/\s+\d+$/, '').trim();
                           c.setAttribute('data-suz-etiket', t); return t; })());
          var son = c.lastChild;
          if (son && son.nodeType === 3) son.nodeValue = ' ' + etiket + ' ' + n;
          else c.appendChild(document.createTextNode(' ' + etiket + ' ' + n));
          var aktif = (d || '') === secili;
          if (aktif) c.classList.add('aktif'); else c.classList.remove('aktif');
          c.setAttribute('aria-pressed', aktif ? 'true' : 'false');
        });
        bos.hidden = gorunur > 0;
        return gorunur;
      }

      cipler.forEach(function (c) {
        c.addEventListener('click', function () {
          var d = c.getAttribute('data-suz-deger') || '';
          secili = (secili === d) ? '' : d;      /* ikinci tık Tümü'ye döner */
          ciz();
        });
      });
      /* Menü klonlanınca/çıkarılınca sayaçlar gerçeği söylemeye devam etsin */
      new MutationObserver(function () { ciz(); })
        .observe(pano, { childList: true, subtree: true });
      ciz();
      kurulan.push({ pano: pano.getAttribute('data-pane'), cip: cipler.length });
    });
    return { kap: kurulan };
  }

  /* ═══════════════════════════════════════════════════════════════════
     M6 · HAFTALIK PANONUN "MALZEME" HAPI
     -----------------------------------------------------------------
     Sayı artık ETKİN PLANIN kendi tariflerinden hesaplanıyor.
     ÖLÇÜLDÜ: markup'ta yazan 21 hiçbir kaynaktan türetilemiyordu —
     etkin planın 7 tarifinin ayrık malzemesi 44, alışveriş listesi 0.
     🔴 Sözlük OKUNAMAZSA sayı basılmaz, HAP GİZLENİR: yanlış sayı
        göstermektense hiç göstermemek.
     ═══════════════════════════════════════════════════════════════════ */
  function m6() {
    var el2 = document.getElementById('haftaMalzemeSayac');
    if (!el2) return null;
    var hap = el2.closest('.galeri-hap');
    var pano = document.querySelector('[data-pane="haftalik"]');
    if (!pano) return null;
    /* "Etkin plan" — eyebrow metninden okunur, sıraya güvenilmez. */
    var etkin = [].slice.call(pano.querySelectorAll('article.menu-detail')).filter(function (m) {
      var e = m.querySelector('.md-head .eyebrow');
      return e && /etkin plan/i.test(e.textContent);
    })[0];
    if (!etkin) { if (hap) hap.hidden = true; return { etkin:false }; }

    function tazele() {
      return malzemeler().then(function (soz) {
        if (!soz) { if (hap) hap.hidden = true; return null; }
        var v = menuMalzemesi(etkin, soz);
        var ayrik = {};
        v.kalem.forEach(function (k) { ayrik[window.dmDepo ? window.dmDepo.slugla(k.ad) : k.ad] = 1; });
        var n = Object.keys(ayrik).length;
        el2.textContent = String(n);
        if (hap) hap.hidden = false;
        return { sayi: n, eksikKap: v.eksik.length };
      });
    }
    var sz = tazele();
    /* Plandan kap eklenip çıkarıldıkça sayı gerçeği söylemeye devam etsin */
    var set = etkin.querySelector('.menu-set');
    if (set) new MutationObserver(function () { tazele(); })
      .observe(set, { childList: true, subtree: true });
    return { etkin: true, soz: sz };
  }

  /* ── KUR ─────────────────────────────────────────────────────────── */
  function kur() {
    window.dmP4M.m1  = m1();
    window.dmP4M.m2  = m2();
    window.dmP4M.m3a = m3a();
    window.dmP4M.m3b = m3b();
    window.dmP4M.m4  = m4();
    window.dmP4M.m5  = m5();
    window.dmP4M.m6  = m6();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();
})();
