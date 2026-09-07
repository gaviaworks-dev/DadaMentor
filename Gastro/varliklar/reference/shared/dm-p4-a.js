/* =====================================================================
   AJAN A · PARTİ 4 · g-mutfak-defterim
   ---------------------------------------------------------------------
   BAĞI lead attı (L0); İÇERİĞİNİ yalnız ajan A yazar.
   KAYNAK BURASI: scripts/p4-varlik/dm-p4-a.js — ağaca kopyalanır.

   A1 · "Düzenle" DOLU form açar        → tarif-ekle.html?duzenle=<slug>
   A2 · Düzenle/İstatistik/Ayarlar      → KANON MODAL, kart uzamaz
   A3 · Arama + kanon süzgeç satırı     → sekiz panonun sekizinde

   ORTAK KURAL: hiçbir metin/sayı ÜRETİLMEZ. Süzgeç değerleri, çip
   etiketleri ve sayaçlar panonun KENDİ öznelerinden okunur; özne
   bulunmayan grup BASILMAZ.
   ===================================================================== */
(function () {
  'use strict';

  var $  = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return [].slice.call((k || document).querySelectorAll(s)); };
  var met = function (el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; };
  var kucuk = function (t) { return String(t || '').toLocaleLowerCase('tr'); };
  /* hasat betiğiyle BİREBİR aynı slug — anahtarlar tutmazsa form boş açılır */
  function slugla(s) {
    return String(s || '').toLocaleLowerCase('tr')
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function anahtar(s) { return slugla(s).replace(/-/g, ''); }
  /* `maket-auth.js` bağlara `?auth=1` ekliyor — oturum bayrağı korunur */
  var AUTH = /(?:^|[?&])auth=1(?:&|$)/.test(location.search) ? '&auth=1' : '';

  /* ═══════════════════════════════════════════════════════════════════
     A1 · "DÜZENLE" → ?duzenle=<slug>
     ═══════════════════════════════════════════════════════════════════ */
  function kartKimlik(kart) {
    var bag = kart.querySelector('a[href]');
    var href = bag ? (bag.getAttribute('href') || '').split(/[?#]/)[0] : '';
    if (/^puf-noktalari__/.test(href))
      return { tip: 'puf', slug: href.replace(/^puf-noktalari__/, '').replace(/\.html$/, '') };
    if (/^tarif__/.test(href))
      return { tip: 'tarif', slug: href.replace(/^tarif__/, '').replace(/\.html$/, '') };
    /* Bağı olmayan kart (incelemedeki içerik henüz yayında değil):
       slug BAŞLIKTAN türetilir — hasat betiği de aynısını yapıyor. */
    var tip = kart.getAttribute('data-tip') === 'puf' ? 'puf' : 'tarif';
    return { tip: tip, slug: slugla(met(kart.querySelector('h4'))) };
  }
  function satirKimlik(tr) {
    var h = tr.querySelectorAll('td');
    var ad = met(h[0] && h[0].querySelector('b'));
    var tur = met(h[1]);
    return { tip: /püf/i.test(tur) ? 'puf' : 'tarif', slug: slugla(ad) };
  }
  function duzenleAdresi(k) {
    return (k.tip === 'puf' ? 'puf-noktasi-ekle.html' : 'tarif-ekle.html') +
           '?duzenle=' + encodeURIComponent(k.slug) + AUTH;
  }

  /* Düğmeler `<a>`ya ÇEVRİLMEZ (yapı korunur); yönlendirme yakalama
     evresinde yapılır ve p3'ün panel açıcısına HİÇ ulaşmaz. */
  document.addEventListener('click', function (e) {
    var d = e.target.closest && e.target.closest('[data-p3a-ac="duzenle"]');
    if (!d) return;
    var kart = d.closest('.r-card, .dk-puf');
    if (!kart) return;
    e.preventDefault(); e.stopPropagation();
    location.href = duzenleAdresi(kartKimlik(kart));
  }, true);

  /* TABLO SATIRLARINDAKİ "İçeriği düzenle" — bugün hiçbir şey yapmıyor
     (ölçüldü: dinleyicisi yok). Aynı etiketi taşıyan kart düğmesiyle
     aynı yere gider. */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('table.tablo tbody tr button');
    if (!b || !/düzenle/i.test(met(b))) return;
    var tr = b.closest('tr');
    if (!tr) return;
    e.preventDefault(); e.stopPropagation();
    location.href = duzenleAdresi(satirKimlik(tr));
  }, true);

  /* ═══════════════════════════════════════════════════════════════════
     A2 · KART İÇİ PANEL → KANON MODAL (kart yüksekliği SABİT)
     ---------------------------------------------------------------
     🔴 İÇERİK SİLİNMEZ: `.dk-pop` düğümü modalın GÖVDESİNE taşınır ve
        kapanışta kartındaki YERİNE geri konur.
     🔴 DAVRANIŞ DA TAŞINIR: p3'ün eylem işleyicisi kartı
        `closest('.r-card')` ile buluyor; panel modaldeyken bu zincir
        kopar ("markup taşındı, davranış kalmadı" dersi). Modal içindeki
        her `[data-p3a-eylem]` tıklaması yakalama evresinde alınır,
        panel kartına geri konur, tıklama yeniden gönderilir ve panel
        modala döner. Böylece durum değiştirme / silme / geri alma
        p3'ün KENDİ kodunda, kartın İÇİNDE koşar.
     ═══════════════════════════════════════════════════════════════════ */
  var modal = null, yer = null, acikPanel = null, acikDugme = null;

  function modalKur() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'dm-modal dk-modal';
    modal.id = 'p4aKartModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'p4aKartModalBas');
    modal.hidden = true;
    modal.innerHTML =
      '<div class="dm-modal-bas">' +
        '<span class="dm-modal-ico"><i class="fa-solid fa-chart-simple" data-p4a-ikon aria-hidden="true"></i></span>' +
        '<div><h2 id="p4aKartModalBas">Kart</h2><p data-p4a-modal-alt></p></div>' +
        '<button class="dm-modal-kapat" type="button" data-p4a-kapat aria-label="Pencereyi kapat">' +
          '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
      '</div>' +
      '<div class="dm-modal-govde" data-p4a-modal-govde></div>' +
      '<div class="dm-modal-ayak"><span class="sag">' +
        '<button class="dugme hayalet" type="button" data-p4a-kapat>Kapat</button>' +
      '</span></div>';
    document.body.appendChild(modal);
    $$('[data-p4a-kapat]', modal).forEach(function (b) {
      b.addEventListener('click', function () { window.dmModal.kapat(modal); });
    });
    /* dmModal'ın kapanış yolları üç tane (düğme · Escape · perde) ve
       geri çağrısı yok — sınıf değişimi izlenir, üçü de yakalanır. */
    new MutationObserver(function () {
      if (!modal.classList.contains('acik')) geriTasi();
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    return modal;
  }

  var IKON = { istatistik: 'fa-chart-simple', ayarlar: 'fa-sliders', duzenle: 'fa-pen' };

  /* A6 modalın AYAĞINI değiştiriyor (Vazgeç + Kaydet). Diğer kipler
     kendi ayağını geri kurmazsa bir sonraki istatistik modalinde not
     düğmeleri kalırdı — "durum sızıntısı". */
  function ayagiSifirla() {
    if (!modal) return;
    var sag = $('.dm-modal-ayak .sag', modal);
    if (!sag) return;
    sag.innerHTML = '';
    var k = document.createElement('button');
    k.className = 'dugme hayalet'; k.type = 'button';
    k.setAttribute('data-p4a-kapat', '');
    k.textContent = 'Kapat';
    k.addEventListener('click', function () { window.dmModal.kapat(modal); });
    sag.appendChild(k);
  }

  function modalAc(dugme) {
    var panel = document.getElementById(dugme.getAttribute('aria-controls'));
    var kart = dugme.closest('.r-card, .dk-puf');
    if (!panel || !kart || !window.dmModal) return false;
    modalKur();
    geriTasi();                                   /* önceki açık kalmasın */
    yer = { ana: panel.parentNode, sonra: panel.nextSibling, dugme: dugme };
    var kip = dugme.getAttribute('data-p3a-ac');
    var bas = panel.querySelector('.dk-pop-bas');
    $('#p4aKartModalBas', modal).textContent =
      met(bas) || panel.getAttribute('aria-label') || 'Kart';
    $('[data-p4a-modal-alt]', modal).textContent = met(kart.querySelector('h4'));
    $('[data-p4a-ikon]', modal).className = 'fa-solid ' + (IKON[kip] || IKON.istatistik);
    ayagiSifirla();
    $('[data-p4a-modal-govde]', modal).appendChild(panel);
    panel.hidden = false;
    dugme.setAttribute('aria-expanded', 'true');
    acikPanel = panel; acikDugme = dugme;
    window.dmModal.ac(modal);
    return true;
  }

  function geriTasi() {
    if (!acikPanel || !yer) return;
    acikPanel.hidden = true;
    if (yer.sonra && yer.sonra.parentNode === yer.ana) yer.ana.insertBefore(acikPanel, yer.sonra);
    else yer.ana.appendChild(acikPanel);
    if (acikDugme) acikDugme.setAttribute('aria-expanded', 'false');
    acikPanel = null; acikDugme = null; yer = null;
  }

  document.addEventListener('click', function (e) {
    var d = e.target.closest && e.target.closest('[data-p3a-ac]');
    if (!d) return;
    var kip = d.getAttribute('data-p3a-ac');
    if (kip === 'duzenle') return;                       /* A1 devraldı */
    if (!d.closest('.r-card, .dk-puf')) return;
    e.preventDefault(); e.stopPropagation();
    if (d.getAttribute('aria-expanded') === 'true' && modal &&
        modal.classList.contains('acik')) { window.dmModal.kapat(modal); return; }
    modalAc(d);
  }, true);

  /* Modal içindeki p3 eylemleri — panel kartına dönerek koşar. */
  var KAPATAN = { kapat: 1, 'sil-onay': 1 };
  document.addEventListener('click', function (e) {
    var ey = e.target.closest && e.target.closest('[data-p3a-eylem]');
    if (!ey || !modal || !modal.contains(ey)) return;
    e.preventDefault(); e.stopPropagation();
    var tur = ey.getAttribute('data-p3a-eylem');
    var panel = acikPanel, dugme = acikDugme;
    geriTasi();                                   /* zincir yeniden kurulur */
    /* 🔴 `ey.click()` KULLANILMAZ: HTML'in "click in progress" bayrağı,
       bir click gönderimi sürerken AYNI eleman üzerinde `click()`
       çağrısını sessizce YUTUYOR — ölçüldü, durum değiştirme hiç
       koşmadı ve hiçbir hata basmadı. Olay elle gönderilir. */
    ey.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    if (KAPATAN[tur]) { window.dmModal.kapat(modal); return; }
    /* modal açık kalmalı: panel geri taşınır */
    if (panel && dugme && document.body.contains(dugme)) modalAc(dugme);
  }, true);

  /* ═══════════════════════════════════════════════════════════════════
     A3 · ARAMA + KANON SÜZGEÇ SATIRI · HER SEKMEDE
     ---------------------------------------------------------------
     Motor sayfanın KENDİ denetimlerini kullanır. Parti 2'nin süzgeç
     kapanışı aynı denetimlere bağlıydı; denetimler `cloneNode` ile
     TAZELENİR (p2'nin eleman düzeyindeki dinleyicileri düşer, markup
     bayt bayt aynı kalır) ve tek motor kalır — iki motor aynı listeyi
     çizerse hangisinin kazandığı yükleme sırasına bağlı olurdu.
     ═══════════════════════════════════════════════════════════════════ */
  var SAYFA_BOYU = { 'lst-grid': 6, 'pufl-grid': 4 };
  /* p2'nin kendi birim sözlüğü (kaynağın ölçülmüş kipi) — jenerik
     "kayıttan"a düşülmez. */
  var BIRIM = {
    tariflerim: 'tariften', puf: 'püf noktasından', taslaklarim: 'taslaktan',
    incelemede: 'içerikten', yayinda: 'içerikten', denediklerim: 'tariften',
    kaydettiklerim: 'tariften', notlarim: 'nottan'
  };

  /* Çip etiketi ↔ özne eşlemesi. Varsayılan kural: etiketin karşılığı
     öznenin KENDİ alan değerlerinden biridir. Aşağıdaki üç kalem
     `denediklerim` panosunun kendi çipleri; hiçbir alanla birebir
     eşleşmiyorlar ve bugün ÖLÜ düğmeler (ölçüldü). Karşılıkları yine
     kartın KENDİ verisinden okunur — yeni veri uydurulmadı. */
  var OZEL = {
    'puan verdiklerim':   function (o) { return /verdin\s*$/i.test(o.alan.durum || ''); },
    'puan bekleyenler':   function (o) { return /vermedin\s*$/i.test(o.alan.durum || ''); },
    'tekrar yaptıklarım': function (o) { var m = o.metin.match(/(\d+)\.\s*kez/); return !!m && +m[1] >= 2; }
  };

  function panoKur(pane) {
    var ad = pane.id.replace('mutfak-defterim-pane-', '');
    var izgara = pane.querySelector('.dk-grid');
    var tablo  = pane.querySelector('table.tablo tbody');
    var notKap = null;
    if (!izgara && !tablo) {
      /* notlarım: "Son yazdıkların" kartları — kap kartların ORTAK atası */
      var nk = $$('.kart', pane).filter(function (k) { return k.querySelector('.kart-bas h3'); });
      if (nk.length > 1) notKap = nk[0].parentNode;
      if (!notKap) return null;
    }

    /* ── ÖZNELER ─────────────────────────────────────────────────── */
    var ozne = [];
    if (izgara) $$('[data-p2a="rkart"]', izgara).forEach(function (k) {
      ozne.push({ el: k, tur: 'kart',
        alan: { kategori: k.getAttribute('data-kategori'), durum: k.getAttribute('data-durum'),
                ay: k.getAttribute('data-ay'), tip: k.getAttribute('data-tip') },
        ad: kucuk(k.getAttribute('data-ad') || met(k.querySelector('h4'))),
        metin: met(k) });
    });
    else if (tablo) $$('tr', tablo).forEach(function (t) {
      var h = t.querySelectorAll('td');
      ozne.push({ el: t, tur: 'satir',
        alan: { tur: met(h[1]), durum: met(h[2]) },
        ad: kucuk(met(h[0])), metin: met(t) });
    });
    else $$('.kart', notKap).forEach(function (k) {
      if (!k.querySelector('.kart-bas h3')) return;
      ozne.push({ el: k, tur: 'not',
        alan: { durum: met(k.querySelector('.kart-bas .durum-hapi')) },
        ad: kucuk(met(k.querySelector('.kart-bas h3'))), metin: met(k) });
    });
    if (ozne.length < 2) return null;      /* süzülecek bir şey yok */
    /* 🔴 ÖZNE İŞARETLENİR. Panoda motorun yönetmediği BAŞKA listeler de
       var (incelemede'nin "inceleme geçmişi" tablosu, yayında'nın "en
       çok okunan üç içerik" kartları). İşaret olmadan ölçüm onları da
       sayıyor ve SAHTE KIRMIZI veriyor (ölçüldü, ilk kapı koşumu). */
    ozne.forEach(function (o) { o.el.setAttribute('data-p4a-ozne', ad); });

    /* ── ARAÇ ÇUBUĞU ─────────────────────────────────────────────── */
    var arac = pane.querySelector('.dk-arac');
    if (arac) {
      var yeni = arac.cloneNode(true);     /* p2 dinleyicileri düşer */
      arac.parentNode.replaceChild(yeni, arac);
      arac = yeni;
    } else {
      arac = aracCubuguYap(ad, ozne);
      var hedefKap = (izgara || (tablo ? tablo.closest('.kart') : notKap));
      hedefKap.parentNode.insertBefore(arac, hedefKap);
    }
    var ara = arac.querySelector('[data-alan="ara"]');
    var secler = $$('select[data-alan]', arac);
    var sifirla = arac.querySelector('.dk-sifirla');

    /* ── ÇİP SATIRI ──────────────────────────────────────────────── */
    var cipKap = pane.querySelector('.cipler');
    if (cipKap) {
      var ck = cipKap.cloneNode(true);
      cipKap.parentNode.replaceChild(ck, cipKap);
      cipKap = ck;
    } else {
      cipKap = ciplerYap(ad, ozne);
      if (cipKap) arac.parentNode.insertBefore(cipKap, arac.nextSibling);
    }
    var cipler = cipKap ? $$('.cip.suzgec, .cip', cipKap) : [];

    /* Her çipe bir SÜZGEÇ İŞLEVİ bağlanır; işlevi çıkmayan çip
       tıklanamaz yapılmaz, ama sayacı gerçeği söyler (0 çıkarsa 0). */
    cipler.forEach(function (c) {
      var etiket = met(c).replace(/\s+\d+$/, '').trim();
      c.setAttribute('data-p4a-etiket', etiket);
      if (/^tümü$/i.test(etiket)) { c._p4a = null; c._tumu = true; return; }
      var oz = OZEL[kucuk(etiket)];
      if (oz) { c._p4a = oz; return; }
      var alan = null;
      ['kategori', 'durum', 'tip', 'tur'].forEach(function (a) {
        if (alan) return;
        if (ozne.some(function (o) { return anahtar(o.alan[a]) === anahtar(etiket); })) alan = a;
      });
      c._p4a = alan ? function (o) { return anahtar(o.alan[alan]) === anahtar(etiket); } : null;
      if (!alan) c.setAttribute('data-p4a-karsiliksiz', '1');
    });

    /* ── DURUM ───────────────────────────────────────────────────── */
    var d = { ara: '', cip: null, sayfa: 1, sec: {} };
    var boyut = izgara
      ? SAYFA_BOYU[izgara.classList.contains('pufl-grid') ? 'pufl-grid' : 'lst-grid']
      : ozne.length;
    var pagi = $('nav.pagi[data-hedef="' + (izgara ? izgara.id : '') + '"]');
    var birim = BIRIM[ad] || 'içerikten';

    /* ── BOŞ HÂL · kanon `.bos-durum` DÖRT PARÇA ─────────────────── */
    var bos = pane.querySelector('.dk-bos') || pane.querySelector('.bos-durum');
    if (!bos) {
      bos = document.createElement('div');
      bos.className = 'bos-durum kart-ici dk-bos';
      (izgara || (tablo ? tablo.closest('.tablo-kap').parentNode : notKap)).appendChild(bos);
    }
    bos.className = (bos.className.indexOf('kart-ici') < 0 ? 'bos-durum kart-ici' : bos.className)
      .replace(/\bdk-bos\b/, '').trim() + ' dk-bos';
    bos.hidden = true;
    bos.innerHTML =
      '<span class="bos-ikon"><i class="fa-solid fa-filter-circle-xmark" aria-hidden="true"></i></span>' +
      '<h4 data-p4a-bos-bas>Bu süzgeçle kayıt yok</h4>' +
      '<p data-p4a-bos-alt>Arama ya da süzgeç seçimini değiştir.</p>' +
      '<button class="dugme hayalet" type="button" data-p4a-bos-temizle>' +
        '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Süzgeci temizle</button>';

    /* ── SÜZGEÇ ──────────────────────────────────────────────────── */
    function gecerCipsiz(o) {
      if (d.ara && o.ad.indexOf(d.ara) < 0 && kucuk(o.metin).indexOf(d.ara) < 0) return false;
      for (var a in d.sec) if (d.sec[a] && anahtar(o.alan[a]) !== anahtar(d.sec[a])) return false;
      return true;
    }
    function gecer(o) { return gecerCipsiz(o) && (!d.cip || !d.cip._p4a || d.cip._p4a(o)); }

    function ciz() {
      var uygun = ozne.filter(gecer);
      var sayfaSayisi = Math.max(1, Math.ceil(uygun.length / boyut));
      if (d.sayfa > sayfaSayisi) d.sayfa = sayfaSayisi;
      var bas = (d.sayfa - 1) * boyut;
      var goster = uygun.slice(bas, bas + boyut);
      ozne.forEach(function (o) { o.el.hidden = goster.indexOf(o) < 0; });

      /* 🔴 SAYAÇ GERÇEK: çipin sayısı o an EŞLEŞEN özne sayısıdır —
         arama kutusuna yazınca da değişir. */
      cipler.forEach(function (c) {
        var n = c._tumu ? ozne.filter(gecerCipsiz).length
                        : (c._p4a ? ozne.filter(function (o) { return gecerCipsiz(o) && c._p4a(o); }).length : 0);
        var s = c.querySelector('.cip-sayi');
        if (!s) {
          /* kaynağın kendi kalıbı (`g-bildirimler.html`): etiket + `.cip-sayi` */
          c.textContent = c.textContent.replace(/\s+\d+\s*$/, ' ');
          s = document.createElement('span'); s.className = 'cip-sayi';
          c.appendChild(s);
        }
        s.textContent = n;
        /* 🔴 `classList.toggle(ad, zorlama)` — ikinci argüman `undefined`
           gelirse ZORLAMA DEĞİL TAKAS yapar. `c._tumu` süzgeç çiplerinde
           tanımsız olduğu için `false || undefined` → `undefined` çıkıyor
           ve HER çip aktif kalıyordu; `aria-pressed` ise doğru "false"
           basıyordu, yani ölçüt ikisini de sormadıkça görünmezdi.
           Kusuru EKRAN GÖRÜNTÜSÜ yakaladı. Değer boole'a zorlanır. */
        var etkin = !!(d.cip === c || (c._tumu && !d.cip));
        c.classList.toggle('aktif', etkin);
        c.setAttribute('aria-pressed', etkin ? 'true' : 'false');
      });

      bos.hidden = uygun.length > 0;
      if (!uygun.length) {
        var bb = bos.querySelector('[data-p4a-bos-bas]');
        var ba = bos.querySelector('[data-p4a-bos-alt]');
        if (d.ara) {
          bb.textContent = '“' + (ara ? ara.value.trim() : d.ara) + '” aramasına uyan kayıt yok';
          ba.textContent = 'Yazımı değiştirebilir ya da süzgeci temizleyip listenin tamamına dönebilirsin.';
        } else {
          bb.textContent = 'Bu süzgeçle kayıt yok';
          ba.textContent = 'Seçtiğin süzgeçle eşleşen bir kayıt bulunmuyor. Süzgeci temizleyip listenin tamamına dönebilirsin.';
        }
      }
      pagiCiz(uygun.length, sayfaSayisi, bas);
    }

    function pagiCiz(toplam, sayfaSayisi, bas) {
      if (!pagi) return;
      if (!toplam) { pagi.innerHTML = ''; return; }
      /* Donörün kalıbı — p2'nin ölçülmüş biçimi birebir korundu. */
      var h = '';
      function ok(ikon, etiket, hedef, kapali) {
        return kapali
          ? '<span class="pg arrow" disabled aria-hidden="true"><i class="' + ikon + '" aria-hidden="true"></i></span>'
          : '<button class="pg arrow" type="button" data-sayfa="' + hedef + '" aria-label="' + etiket + '"><i class="' + ikon + '" aria-hidden="true"></i></button>';
      }
      h += ok('fa-solid fa-angles-left', 'İlk sayfa', 1, d.sayfa === 1);
      h += ok('fa-solid fa-chevron-left', 'Önceki sayfa', d.sayfa - 1, d.sayfa === 1);
      var lst = [], onceki = 0;
      for (var i = 1; i <= sayfaSayisi; i++)
        if (i === 1 || i === sayfaSayisi || Math.abs(i - d.sayfa) <= 1) lst.push(i);
      lst.forEach(function (i) {
        if (onceki && i - onceki > 1) h += '<span class="pg-dots" aria-hidden="true">…</span>';
        h += (i === d.sayfa) ? '<span class="pg active" aria-current="page">' + i + '</span>'
                             : '<button class="pg" type="button" data-sayfa="' + i + '">' + i + '</button>';
        onceki = i;
      });
      h += ok('fa-solid fa-chevron-right', 'Sonraki sayfa', d.sayfa + 1, d.sayfa === sayfaSayisi);
      h += ok('fa-solid fa-angles-right', 'Son sayfa', sayfaSayisi, d.sayfa === sayfaSayisi);
      h += '<span class="pagi-note">' + toplam + ' ' + birim + ' ' +
           (toplam ? bas + 1 : 0) + '–' + Math.min(bas + boyut, toplam) + ' arası gösteriliyor</span>';
      pagi.innerHTML = h;
      $$('[data-sayfa]', pagi).forEach(function (b) {
        b.addEventListener('click', function () { d.sayfa = +b.getAttribute('data-sayfa'); ciz(); });
      });
    }

    /* ── BAĞLAMA ─────────────────────────────────────────────────── */
    if (ara) {
      var z;
      ara.addEventListener('input', function () {
        clearTimeout(z);
        z = setTimeout(function () { d.ara = kucuk(ara.value.trim()); d.sayfa = 1; ciz(); }, 200);
      });
    }
    secler.forEach(function (s) {
      s.addEventListener('change', function () {
        d.sec[s.getAttribute('data-alan')] = s.value; d.sayfa = 1; ciz();
      });
    });
    cipler.forEach(function (c) {
      c.addEventListener('click', function () {
        d.cip = (c._tumu || d.cip === c) ? null : c; d.sayfa = 1; ciz();
      });
    });
    function temizle() {
      d = { ara: '', cip: null, sayfa: 1, sec: {} };
      if (ara) ara.value = '';
      secler.forEach(function (s) { s.value = ''; });
      ciz();
    }
    if (sifirla) sifirla.addEventListener('click', temizle);
    bos.querySelector('[data-p4a-bos-temizle]').addEventListener('click', temizle);

    ciz();
    pane.setAttribute('data-p4a-suzgec', ozne.length);

    /* 🔴 ÖZNE SONRADAN DOĞABİLİR. `notlarim`da sayfanın kendi "Yeni not
       yaz" akışı listenin BAŞINA bir kart ekliyor (p2, `data-p2a="not"`).
       Kurulumda yakalanan dizi donmuş olsaydı yeni not hiçbir süzgece
       uymaz, aramada da kaybolmaz, sayaçta da görünmezdi. Düzenleyici
       kartı (`.dk-not-yeni`) özne DEĞİL — süzülmez. */
    var kap = izgara || (tablo || null) || notKap;
    if (kap && window.MutationObserver) {
      new MutationObserver(function (kayitlar) {
        var yeniVar = false;
        kayitlar.forEach(function (m) {
          [].forEach.call(m.addedNodes, function (n) {
            if (n.nodeType !== 1 || n.classList.contains('dk-not-yeni')) return;
            if (ozne.some(function (o) { return o.el === n; })) return;
            var uygun = n.matches('[data-p2a="rkart"]') || n.matches('tr') ||
                        (n.matches('.kart') && n.querySelector('.kart-bas h3'));
            if (!uygun) return;
            n.setAttribute('data-p4a-ozne', ad);
            ozne.push({ el: n, tur: izgara ? 'kart' : (tablo ? 'satir' : 'not'),
              alan: { kategori: n.getAttribute('data-kategori'), durum: n.getAttribute('data-durum') ||
                      met(n.querySelector('.kart-bas .durum-hapi')),
                      ay: n.getAttribute('data-ay'), tip: n.getAttribute('data-tip') },
              ad: kucuk(n.getAttribute('data-ad') || met(n.querySelector('h4, .kart-bas h3'))),
              metin: met(n) });
            yeniVar = true;
          });
        });
        if (yeniVar) { pane.setAttribute('data-p4a-suzgec', ozne.length); ciz(); }
      }).observe(kap, { childList: true });
    }
    return { ad: ad, ozne: ozne.length, cip: cipler.length, arama: !!ara };
  }

  /* Araç çubuğu YOK olan panolar için — kalıp sayfanın kendi
     `.dk-arac`ından bire bir alındı (arama + tarih seçimi + sıfırla). */
  function aracCubuguYap(ad, ozne) {
    var kap = document.createElement('div');
    kap.className = 'dk-arac';
    kap.setAttribute('data-p4a', 'arac');
    var ara = document.createElement('span');
    ara.className = 'dk-ara';
    ara.innerHTML = '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
      '<label class="yalniz-okuyucu" for="dk-ara-' + ad + '">Başlıkta ara</label>' +
      '<input type="search" id="dk-ara-' + ad + '" data-alan="ara" placeholder="Başlıkta ara…">';
    kap.appendChild(ara);
    var sif = document.createElement('button');
    sif.className = 'dugme hayalet kucuk dk-sifirla';
    sif.type = 'button';
    sif.innerHTML = '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Sıfırla';
    kap.appendChild(sif);
    return kap;
  }

  /* Çip satırı YOK olan pano için — gruplar öznelerin KENDİ
     değerlerinden çıkar; iki ayrı değeri olmayan grup BASILMAZ. */
  var GRUP_BASLIK = { durum: 'Durum', kategori: 'Kategori', tur: 'Tür', tip: 'Tür' };
  function ciplerYap(ad, ozne) {
    var enIyi = null;
    ['durum', 'kategori', 'tur', 'tip'].forEach(function (a) {
      var deger = [];
      ozne.forEach(function (o) {
        var v = o.alan[a];
        if (v && deger.indexOf(v) < 0) deger.push(v);
      });
      if (deger.length >= 2 && (!enIyi || deger.length < enIyi.deger.length))
        enIyi = { alan: a, deger: deger };
    });
    if (!enIyi) return null;                       /* 🔴 özne yok → BASMA */
    var kap = document.createElement('div');
    kap.className = 'cipler';
    kap.setAttribute('role', 'group');
    kap.setAttribute('data-p4a', 'cipler');
    kap.setAttribute('aria-label', (GRUP_BASLIK[enIyi.alan] || 'Süzgeç') + ' süzgeci');
    var b = document.createElement('span');
    b.className = 'cipler-basligi';
    b.textContent = GRUP_BASLIK[enIyi.alan] || 'Süzgeç';
    kap.appendChild(b);
    [null].concat(enIyi.deger).forEach(function (v) {
      var c = document.createElement('button');
      c.className = 'cip suzgec';
      c.type = 'button';
      c.setAttribute('aria-pressed', 'false');
      c.textContent = (v == null ? 'Tümü' : v) + ' ';
      kap.appendChild(c);
    });
    return kap;
  }


  /* ═══════════════════════════════════════════════════════════════════
     A4 · ÖZET SAYAÇLARI ÖLÇÜLEN LİSTEYE BAĞLANIR
     ---------------------------------------------------------------
     🔴 KARAR (lead, bu tur otonom): ekran aynı şeyi iddia eden iki sayı
        gösteremez. Yer gerçeği LİSTEDİR, hap onun özetidir. Hiçbir hap
        SİLİNMEZ (eksi birinci madde) — listeye BAĞLANIR.
     🔴 Türetilemeyen sayı DOKUNULMAZ ve `data-p4a-turetilemez` ile
        işaretlenir; raporda gerekçesiyle sayılır. "Düzeltilmedi" ile
        "gözden kaçtı" ayrı şeyler.
     ═══════════════════════════════════════════════════════════════════ */
  var PANO_ADI = ['tariflerim','puf','taslaklarim','incelemede','yayinda',
                  'denediklerim','kaydettiklerim','notlarim'];

  function ozneler(ad) {
    var pane = document.getElementById('mutfak-defterim-pane-' + ad);
    return pane ? $$('[data-p4a-ozne]', pane) : [];
  }
  /* Kartın istatistik panelindeki bir olgunun SAYISI (kaynağın kendi verisi) */
  function olguSayi(el, re) {
    var d = null;
    $$('[data-p3a-pop="istatistik"] .dk-olgu', el).forEach(function (o) {
      var t = met(o);
      if (d === null && re.test(t)) {
        var m = t.match(/[\d]+(?:[.,][\d]+)?/);
        if (m) d = parseFloat(m[0].replace(',', '.'));
      }
    });
    return d;
  }
  function topla(ad, re) {
    var t = 0, v = 0;
    ozneler(ad).forEach(function (o) { var x = olguSayi(o, re); if (x != null) { t += x; v++; } });
    return v ? t : null;
  }
  /* Değerlendirme: kartın "5,0 · 3 değerlendirme" olgusu — AĞIRLIKLI
     ortalama, çünkü kaynağın kendi alt metni "N değerlendirmenin
     ortalaması" diyor: birim değerlendirme, tarif değil. */
  function puanOzet(ad) {
    var top = 0, adet = 0;
    ozneler(ad).forEach(function (o) {
      var s = null;
      $$('[data-p3a-pop="istatistik"] .dk-olgu', o).forEach(function (x) {
        var t = met(x);
        if (/değerlendirme/.test(t) && !/yok/.test(t)) s = t;
      });
      if (!s) return;
      var m = s.match(/([\d]+[.,][\d]+)\s*·\s*(\d+)/);
      if (!m) return;
      top += parseFloat(m[1].replace(',', '.')) * (+m[2]);
      adet += +m[2];
    });
    return adet ? { ort: top / adet, adet: adet } : null;
  }
  function turSay(ad, etiket) {
    var h = anahtar(etiket), n = 0;
    ozneler(ad).forEach(function (o) {
      var t = o.getAttribute('data-tip');
      var r = o.querySelector('.rozet, .kart-bas .durum-hapi');
      if (r) t = met(r);
      if (anahtar(t) === h) n++;
    });
    return n;
  }
  function durumSay(ad, re) {
    var n = 0;
    ozneler(ad).forEach(function (o) {
      var d = o.getAttribute('data-durum') || met(o.querySelector('.kart-bas .durum-hapi'));
      if (re.test(d || '')) n++;
    });
    return n;
  }
  function ayirt(ad, f) {
    var k = [];
    ozneler(ad).forEach(function (o) { var v = f(o); if (v && k.indexOf(v) < 0) k.push(v); });
    return k;
  }
  function slugOf(el) {
    var a = el.querySelector('a[href]');
    if (!a) return null;
    return (a.getAttribute('href') || '').split(/[?#]/)[0].replace(/\.html$/, '');
  }
  var AYLAR = ['ocak','şubat','mart','nisan','mayıs','haziran','temmuz',
               'ağustos','eylül','ekim','kasım','aralık'];
  function ayIndeks(s) {
    var p2 = String(s || '').toLocaleLowerCase('tr').split(' ');
    var i = AYLAR.indexOf(p2[0]);
    return i < 0 ? null : { i: i, yil: +p2[1] || 0, ad: s };
  }
  function enEskiAy(ad) {
    var e = null;
    ozneler(ad).forEach(function (o) {
      var a = ayIndeks(o.getAttribute('data-ay'));
      if (!a) return;
      if (!e || a.yil < e.yil || (a.yil === e.yil && a.i < e.i)) e = a;
    });
    return e;
  }
  /* taslak tablosundaki "Eksik" hücresi: "2 adım eksik" → 2, metin → 1 */
  function eksikToplam() {
    var t = 0;
    ozneler('taslaklarim').forEach(function (o) {
      var h = o.querySelectorAll('td')[2];
      if (!h) return;
      var s = met(h);
      if (!s) return;
      var m = s.match(/^(\d+)\s/);
      t += m ? +m[1] : 1;
    });
    return t;
  }

  /* ── SAYI YAZICILARI ─────────────────────────────────────────────── */
  function biçim(v) {
    if (v == null) return null;
    return (Math.round(v * 10) % 10 === 0) ? String(Math.round(v))
      : String(Math.round(v * 10) / 10).replace('.', ',');
  }
  function sayacYaz(el, anahtarAdi, deger, altMetin) {
    if (!el) return false;
    if (deger == null && altMetin == null) return false;
    var b = el.querySelector('b') || el;
    if (deger != null) {
      var yeni = typeof deger === 'string' ? deger : biçim(deger);
      if (met(b) !== yeni) b.textContent = yeni;
      el.setAttribute('data-p4a-beklenen', yeni);
    }
    el.setAttribute('data-p4a-sayac', anahtarAdi);
    if (altMetin != null) {
      var a = el.querySelector('.puan-alt');
      if (a && met(a) !== altMetin) a.textContent = altMetin;
    }
    return true;
  }
  /* Etiketine göre bul: kaynağın KENDİ sözcükleri anahtar — sıraya ya da
     indekse bağlanmaz (kaynak satır ekleyince kayardı). */
  /* 🔴 TÜRKÇE `İ` TUZAĞI: JS'in `/i` bayrağı `İ` (U+0130) ile `i`yi
     EŞLEMEZ. `bantBul(/incelemede/)` "İncelemede" etiketini bulamıyordu
     ve o sayaç sessizce BAĞLANMADAN kalıyordu — kapı da yalnız BAĞLI
     sayaçları denetlediği için görmüyordu ("özne yoksa kapı susar").
     Bütün eşleşmeler Türkçe kurallarıyla küçültülmüş metin üzerinde. */
  function esles(el, re) { return re.test(kucuk(met(el))); }
  function hapBul(pane, re) {
    return $$('.galeri-hap', pane).filter(function (e) { return esles(e, re); })[0] || null;
  }
  function kartBul2(pane, re) {
    return $$('.puan-karti', pane).filter(function (e) {
      return esles(e.querySelector('.puan-bas'), re);
    })[0] || null;
  }
  function bantBul(re) {
    return $$('.cp-stats .sayac').filter(function (e) {
      return esles(e.querySelector('span'), re);
    })[0] || null;
  }

  function sayaclariBagla() {
    var bagli = 0, atlanan = [];
    var P = function (ad) { return document.getElementById('mutfak-defterim-pane-' + ad); };
    var say = function (ad) { return ozneler(ad).length; };

    /* ── BANT (sekmelerin üstü) ─────────────────────────────────────
       Beşinin beşi de listeden türüyor; "Toplam görüntülenme" bile:
       tariflerim kartlarının görüntülenme olgularının TOPLAMI (ölçüldü:
       105+61+83+94+65+65+63 = 536). "Türetilemez" sanılan sayı ölçünce
       türedi — varsayım değil ÖLÇÜM karar verir. */
    bagli += sayacYaz(bantBul(/yayındaki tarif/i), 'bant.tarif', say('tariflerim')) ? 1 : 0;
    bagli += sayacYaz(bantBul(/püf noktası/i), 'bant.puf', say('puf')) ? 1 : 0;
    bagli += sayacYaz(bantBul(/^taslak/i), 'bant.taslak', say('taslaklarim')) ? 1 : 0;
    bagli += sayacYaz(bantBul(/incelemede/i), 'bant.incelemede', say('incelemede')) ? 1 : 0;
    /* 🔴 Bant "Toplam görüntülenme" 536 diyordu, `#yayinda` puan kartı
       AYNI ETİKETLE 750. İkisi de görünür, ikisi de aynı şeyi iddia
       ediyor: bant yalnız tarifleri sayıyordu. Toplam = tarif + püf. */
    var tumGor = (topla('tariflerim', /görüntülenme/) || 0) + (topla('puf', /okunma/) || 0);
    bagli += sayacYaz(bantBul(/toplam görüntülenme/i), 'bant.goruntulenme', tumGor || null) ? 1 : 0;

    /* ── #tariflerim ───────────────────────────────────────────────── */
    var t = P('tariflerim');
    if (t) {
      bagli += sayacYaz(hapBul(t, /yayında$/i), 'tariflerim.yayinda', say('tariflerim')) ? 1 : 0;
      bagli += sayacYaz(hapBul(t, /incelemede$/i), 'tariflerim.incelemede', say('incelemede')) ? 1 : 0;
      bagli += sayacYaz(hapBul(t, /taslak$/i), 'tariflerim.taslak', say('taslaklarim')) ? 1 : 0;
      var po = puanOzet('tariflerim');
      bagli += sayacYaz(hapBul(t, /ortalama puan/i), 'tariflerim.puan', po ? po.ort : null) ? 1 : 0;
    }

    /* ── #puf ───────────────────────────────────────────────────────
       "3 farklı başlık türü" hapı, KENDİ panosundaki puan kartıyla da
       çelişiyordu ("Başlık türü 4"); ikisi de listeye bağlandı. */
    var pf = P('puf');
    if (pf) {
      var okun = topla('puf', /okunma/), kayd = topla('puf', /kaydetme/);
      var turler = ayirt('puf', function (o) { return o.getAttribute('data-kategori'); }).length;
      bagli += sayacYaz(hapBul(pf, /yayında$/i), 'puf.yayinda', say('puf')) ? 1 : 0;
      bagli += sayacYaz(hapBul(pf, /okunma$/i), 'puf.okunma', okun) ? 1 : 0;
      bagli += sayacYaz(hapBul(pf, /başlık türü$/i), 'puf.tur', turler) ? 1 : 0;
      bagli += sayacYaz(hapBul(pf, /kaydetme$/i), 'puf.kaydetme', kayd) ? 1 : 0;
      bagli += sayacYaz(kartBul2(pf, /toplam okunma/i), 'puf.k.okunma', okun) ? 1 : 0;
      bagli += sayacYaz(kartBul2(pf, /yazı başına/i), 'puf.k.basina',
                        okun == null ? null : Math.round(okun / Math.max(1, say('puf')))) ? 1 : 0;
      bagli += sayacYaz(kartBul2(pf, /kaydedilme/i), 'puf.k.kaydetme', kayd,
                        (okun && kayd) ? 'okuyanların %' + Math.round(kayd / okun * 100) + "'i kaydetti" : null) ? 1 : 0;
      bagli += sayacYaz(kartBul2(pf, /başlık türü/i), 'puf.k.tur', turler) ? 1 : 0;
    }

    /* ── #taslaklarim ──────────────────────────────────────────────── */
    var ts = P('taslaklarim');
    if (ts) {
      var hazir = ozneler('taslaklarim').filter(function (o) {
        var h = o.querySelectorAll('td')[2]; return !h || !met(h); }).length;
      bagli += sayacYaz(hapBul(ts, /taslak$/i), 'taslak.adet', say('taslaklarim')) ? 1 : 0;
      bagli += sayacYaz(hapBul(ts, /eksik alan$/i), 'taslak.eksik', eksikToplam()) ? 1 : 0;
      bagli += sayacYaz(hapBul(ts, /gönderime hazır$/i), 'taslak.hazir', hazir) ? 1 : 0;
      bagli += sayacYaz(kartBul2(ts, /bekleyen taslak/i), 'taslak.k.adet', say('taslaklarim'),
        turSay('taslaklarim', 'Tarif') + ' tarif · ' + turSay('taslaklarim', 'Püf noktası') + ' püf noktası') ? 1 : 0;
      bagli += sayacYaz(kartBul2(ts, /gönderime hazır/i), 'taslak.k.hazir', hazir) ? 1 : 0;
      atlanan.push({ ad: 'taslaklarim · "14 / 18 alan dolu" (hap + puan kartı)',
        sebep: 'alan sayımı listede yok — tablo yalnız EKSİK sütununu taşıyor, dolu alan sayısı hiçbir yerde yazmıyor' });
      atlanan.push({ ad: 'taslaklarim · "En eski taslak 23 gün"',
        sebep: 'makette "bugün" tanımlı değil; satırlar "2 gün önce" ile "12 Ağustos 2026"yı karıştırıyor, gün farkı türetilemez' });
    }

    /* ── #yayinda ──────────────────────────────────────────────────── */
    var y = P('yayinda');
    if (y) {
      var yGor = 0, yGorVar = 0;
      ozneler('yayinda').forEach(function (o) {
        var h = o.querySelectorAll('td')[2];
        var n = h ? parseInt(met(h).replace(/\D/g, ''), 10) : NaN;
        if (!isNaN(n)) { yGor += n; yGorVar++; }
      });
      var yPuanTop = 0, yPuanAdet = 0;
      ozneler('yayinda').forEach(function (o) {
        var h = o.querySelectorAll('td')[3];
        var m = h ? met(h).match(/([\d]+[.,][\d]+)\s*·\s*(\d+)/) : null;
        if (m) { yPuanTop += parseFloat(m[1].replace(',', '.')) * (+m[2]); yPuanAdet += +m[2]; }
      });
      bagli += sayacYaz(kartBul2(y, /yayındaki içerik/i), 'yayinda.adet', say('yayinda'),
        turSay('yayinda', 'Tarif') + ' tarif · ' + turSay('yayinda', 'Püf noktası') + ' püf noktası') ? 1 : 0;
      bagli += sayacYaz(kartBul2(y, /toplam görüntülenme/i), 'yayinda.goruntulenme',
        yGorVar ? yGor : null,
        topla('tariflerim', /görüntülenme/) + ' tarif · ' + topla('puf', /okunma/) + ' püf noktası') ? 1 : 0;
      bagli += sayacYaz(kartBul2(y, /ortalama puan/i), 'yayinda.puan',
        yPuanAdet ? yPuanTop / yPuanAdet : null,
        yPuanAdet ? yPuanAdet + ' değerlendirmenin ortalaması' : null) ? 1 : 0;
      atlanan.push({ ad: 'yayinda · "Kaydedilme 64"',
        sebep: 'başkalarının kaydetmesi listede hiç yok — tablo görüntülenme ve puan taşıyor, kaydetme taşımıyor' });
    }

    /* ── #denediklerim ─────────────────────────────────────────────── */
    var d2 = P('denediklerim');
    if (d2) {
      var tekrar = ozneler('denediklerim').filter(function (o) {
        var m = met(o).match(/(\d+)\.\s*kez/); return !!m && +m[1] >= 2; }).length;
      bagli += sayacYaz(hapBul(d2, /denenmiş tarif$/i), 'denedik.adet', say('denediklerim')) ? 1 : 0;
      bagli += sayacYaz(hapBul(d2, /puan verdin$/i), 'denedik.puan', durumSay('denediklerim', /verdin\s*$/i)) ? 1 : 0;
      bagli += sayacYaz(hapBul(d2, /tekrar yaptın$/i), 'denedik.tekrar', tekrar) ? 1 : 0;
      atlanan.push({ ad: 'denediklerim · "5 nota bağladın"',
        sebep: 'ölçütü yazılı değil ve kartta karşılığı yok. İki okuma da 5 vermiyor: notlarım panosunda bu tariflere bağlı not 1, notlarımdaki tarife bağlı not 4' });
    }

    /* ── #kaydettiklerim ───────────────────────────────────────────── */
    var kd = P('kaydettiklerim');
    if (kd) {
      var kayitliTarif = ozneler('kaydettiklerim').filter(function (o) {
        return anahtar(o.getAttribute('data-durum')) === anahtar('Tarif'); });
      var denenen = ozneler('denediklerim').map(slugOf).filter(Boolean);
      var kesisim = kayitliTarif.filter(function (o) {
        var s2 = slugOf(o); return s2 && denenen.indexOf(s2) > -1; }).length;
      var eski = enEskiAy('kaydettiklerim');
      bagli += sayacYaz(kartBul2(kd, /kayıtlı içerik/i), 'kaydet.adet', say('kaydettiklerim'),
        ayirt('kaydettiklerim', function (o) { return o.getAttribute('data-durum'); }).length + ' ayrı türde') ? 1 : 0;
      bagli += sayacYaz(kartBul2(kd, /denediklerin/i), 'kaydet.denenen',
        kesisim + ' / ' + kayitliTarif.length, 'kayıtlı tariflerin') ? 1 : 0;
      bagli += sayacYaz(kartBul2(kd, /en eski kayıt/i), 'kaydet.eski', null,
        eski ? eski.ad + "'dan beri" : null) ? 1 : 0;
      /* Etiket ("Tatlı") DOKUNULMAZ — listede tepe değer yok, başka bir
         kategori seçmek de uydurma olurdu. Alt metnin PAYDASI yalan
         söylüyordu ("18 tarifin"), o listeye bağlanır. */
      var enCok = kartBul2(kd, /en çok kaydettiğin/i);
      if (enCok) {
        var etiketi = met(enCok.querySelector('.puan-sayi'));
        var oKategori = kayitliTarif.filter(function (o) {
          return anahtar(o.getAttribute('data-kategori')) === anahtar(etiketi); }).length;
        bagli += sayacYaz(enCok, 'kaydet.encok', null,
          kayitliTarif.length + " tarifin " + oKategori + "'i") ? 1 : 0;
      }
      atlanan.push({ ad: 'kaydettiklerim · "En eski kayıt 7 ay"',
        sebep: 'makette "bugün" tanımlı değil; alt metni (en eski AY) listeden türetildi, ay farkı türetilmedi' });
      atlanan.push({ ad: 'kaydettiklerim · "En çok kaydettiğin Tatlı"',
        sebep: 'listede TEPE DEĞER YOK — dokuz kaydın dokuz ayrı kategorisi var, her kategori bir kez geçiyor' });
    }

    /* ── #notlarim ─────────────────────────────────────────────────── */
    var nt = P('notlarim');
    if (nt) {
      bagli += sayacYaz(hapBul(nt, /\bnot$/i), 'not.adet', say('notlarim')) ? 1 : 0;
      bagli += sayacYaz(hapBul(nt, /tarife bağlı$/i), 'not.bagli', turSay('notlarim', 'Tarife bağlı')) ? 1 : 0;
      bagli += sayacYaz(hapBul(nt, /serbest$/i), 'not.serbest', turSay('notlarim', 'Serbest not')) ? 1 : 0;
      bagli += sayacYaz(hapBul(nt, /yalnız sana görünür$/i), 'not.gizli', say('notlarim')) ? 1 : 0;
    }

    /* Düzyazıdaki sayılar da aynı özneyi iddia ediyor — onlar da bağlanır. */
    var dz = { bagli: 0, atlanan: [] };
    try { dz = duzyaziBagla(); } catch (e) { if (window.console) console.error('[p4a]', e); }
    bagli += dz.bagli;
    atlanan = atlanan.concat(dz.atlanan);
    document.documentElement.setAttribute('data-p4a-sayac-bagli', bagli);
    document.documentElement.setAttribute('data-p4a-sayac-atlanan', atlanan.length);
    window.__p4aAtlanan = atlanan;          /* ölçüm okusun diye */
    return bagli;
  }


  /* ── A4c · DÜZYAZIDAKİ SAYILAR ────────────────────────────────────
     🔴 Haplar düzelince cümle YALAN KALDI: `#denediklerim`in altındaki
        şerit hâlâ "Denediğin 12 tarifin 9'una puan verdin — %75" diyordu
        ve ölçüt yalnız `.galeri-hap`a baktığı için YEŞİL kalıyordu.
        Kusuru EKRAN GÖRÜNTÜSÜ yakaladı.
     🔴 Türkçe ek uydurulmaz: "9'una" ile "7'sine" farkı sayının OKUNUŞUNA
        bağlı. Ek tablosu kaynağın kendi yazımından türetildi; tablo
        dışına düşen sayıda cümleye DOKUNULMAZ (yanlış ek, yanlış sayı
        kadar kötüdür). */
  var SAYI_ADI = ['sıfır','bir','iki','üç','dört','beş','altı','yedi','sekiz',
                  'dokuz','on','on bir','on iki','on üç','on dört','on beş',
                  'on altı','on yedi','on sekiz','on dokuz','yirmi'];
  /* iyelik + yönelme eki: "N tarifin M<EK>" — 9 → "'una", 7 → "'sine" */
  var YONELME_BIR = { 1:"'ine", 2:"'sine", 3:"'üne", 4:"'üne", 5:"'ine",
                      6:"'sına", 7:"'sine", 8:"'ine", 9:"'una" };
  var YONELME_ON  = { 10:"'una", 20:"'sine", 30:"'una", 40:"'ına", 50:"'sine",
                      60:"'ına", 70:"'ine", 80:"'ine", 90:"'ına", 100:"'üne" };
  function yonelme(n) {
    if (n % 10 === 0) return YONELME_ON[n] || null;
    return YONELME_BIR[n % 10] || null;
  }
  function sayiAdi(n) { return (n >= 0 && n < SAYI_ADI.length) ? SAYI_ADI[n] : null; }

  function duzyaziBagla() {
    var n = 0, atla = [];
    var P = function (a) { return document.getElementById('mutfak-defterim-pane-' + a); };
    var say = function (a) { return ozneler(a).length; };

    /* ① #denediklerim · "Denediğin N tarifin M'…a puan verdin — %P" */
    var d3 = P('denediklerim');
    if (d3) {
      var not = $$('.galeri-not', d3)[0];
      var toplam = say('denediklerim');
      var puanli = durumSay('denediklerim', /verdin\s*$/i);
      var puansiz = toplam - puanli;
      var yuzde = toplam ? Math.round(puanli / toplam * 100) : 0;
      var ek = yonelme(puanli), puansizAdi = sayiAdi(puansiz);
      if (not && ek && puansizAdi) {
        var t = met(not)
          .replace(/Denediğin\s+\d+\s+tarifin\s+\d+['’][^\s]*\s+puan verdin\s*—\s*%\d+/,
                   'Denediğin ' + toplam + ' tarifin ' + puanli + ek + ' puan verdin — %' + yuzde)
          .replace(/Puan vermediğin\s+\S+\s+tarif/, 'Puan vermediğin ' + puansizAdi + ' tarif');
        if (t !== met(not)) { not.textContent = t; }
        not.setAttribute('data-p4a-sayac', 'denedik.duzyazi');
        /* 🔴 `data-p4a-beklenen` DEĞİL: o nitelik "görünen metin buna eşit
           olmalı" demek ve kapı onu birebir karşılaştırıyor. Cümlenin
           beklentisi tek bir sayı değil ÜÇ sayı; ayrı bir nitelikte
           taşınır ve kendi ölçütüyle (K6c) sınanır. Karıştırınca kapı
           kendi niteliğinden SAHTE KIRMIZI verdi. */
        not.setAttribute('data-p4a-ozet', toplam + '/' + puanli + '/' + yuzde);
        n++;
      } else if (not) {
        atla.push({ ad: 'denediklerim · şerit cümlesi',
          sebep: 'sayının Türkçe eki tabloda yok (' + puanli + ') — yanlış ek yazmak yerine cümleye dokunulmadı' });
      }
      /* ölçer çubuğu aynı oranı çiziyor — çalışma zamanı değeri, satır içi
         style DEĞİL bir kural değil; kaynağın kendi kutusu güncellenir. */
      var cubuk = d3.querySelector('.olcer > span');
      if (cubuk) {
        cubuk.style.width = yuzde + '%';
        cubuk.setAttribute('data-p4a-sayac', 'denedik.olcer');
        cubuk.setAttribute('data-p4a-oran', String(yuzde));
        n++;
      }
      /* "Son dört deneme" başlığı — listede 10 kart var */
      var bas = $$('h2', d3).filter(function (h) { return /^son\s+\S+\s+deneme$/i.test(kucuk(met(h))); })[0];
      var adi = sayiAdi(toplam);
      if (bas && adi) {
        bas.textContent = 'Son ' + adi + ' deneme';
        bas.setAttribute('data-p4a-sayac', 'denedik.baslik');
        bas.setAttribute('data-p4a-beklenen', 'Son ' + adi + ' deneme');
        n++;
      } else if (bas) atla.push({ ad: 'denediklerim · "Son … deneme" başlığı',
        sebep: 'sayı adı tablosu 0–20 arası; ' + toplam + ' için ad yok' });
    }

    /* ② #tariflerim · "Yayındaki <ad> tarifin toplam N kez görüntülendi,
          M değerlendirme aldı" — üçü de listeden türüyor. */
    var t2 = P('tariflerim');
    if (t2) {
      var n2 = $$('.galeri-not', t2)[0];
      var adet = say('tariflerim');
      var gor = topla('tariflerim', /görüntülenme/);
      var po2 = puanOzet('tariflerim');
      var ad2 = sayiAdi(adet);
      if (n2 && ad2 && gor != null && po2) {
        var t3 = met(n2)
          .replace(/Yayındaki\s+\S+\s+tarifin/, 'Yayındaki ' + ad2 + ' tarifin')
          .replace(/toplam\s+[\d.]+\s+kez görüntülendi/, 'toplam ' + gor + ' kez görüntülendi')
          .replace(/,\s*\d+\s+değerlendirme aldı/, ', ' + po2.adet + ' değerlendirme aldı');
        if (t3 !== met(n2)) n2.textContent = t3;
        n2.setAttribute('data-p4a-sayac', 'tariflerim.duzyazi');
        n2.setAttribute('data-p4a-ozet', adet + '/' + gor + '/' + po2.adet);
        n++;
      }
      atla.push({ ad: 'tariflerim · şerit cümlesindeki "9 kişi tarafından pişirildi"',
        sebep: 'kaç kişinin pişirdiği listede hiç yok — kart da tablo da bu veriyi taşımıyor' });
    }

    /* ③ #puf · "Yazdığın <ad> püf noktası" başlığı + "<Ad> püf noktanın" */
    var p3 = P('puf');
    if (p3) {
      var pAdet = say('puf'), pAd = sayiAdi(pAdet);
      if (pAd) {
        var h2 = $$('h2', p3).filter(function (h) { return /^yazdığın\s+\S+\s+püf noktası$/i.test(kucuk(met(h))); })[0];
        if (h2) { h2.textContent = 'Yazdığın ' + pAd + ' püf noktası';
                  h2.setAttribute('data-p4a-sayac', 'puf.baslik'); n++; }
        var ld = $$('.lead', p3).filter(function (l) { return /püf nokta(n|sının)/i.test(met(l)) && /^\S+\s+püf noktanın/i.test(kucuk(met(l))); })[0];
        if (ld) { ld.textContent = met(ld).replace(/^\S+\s+püf noktanın/,
                    pAd.charAt(0).toLocaleUpperCase('tr') + pAd.slice(1) + ' püf noktanın');
                  ld.setAttribute('data-p4a-sayac', 'puf.lead'); n++; }
        var kk = kartBul2(p3, /toplam okunma/);
        if (kk) { var alt2 = kk.querySelector('.puan-alt');
                  if (alt2) alt2.textContent = pAd + ' yazının toplamı'; n++; }
      }
    }

    document.documentElement.setAttribute('data-p4a-duzyazi-bagli', n);
    return { bagli: n, atlanan: atla };
  }

  /* ═══════════════════════════════════════════════════════════════════
     A4b · `#yayinda` TABLOSU EKSİKTİ — kaynağın KENDİ cümlesiyle tamamlanır
     ---------------------------------------------------------------
     🔴 Bu panoda çelişkinin yönü TERSİYDİ ve ancak ölçünce görüldü:
        puan kartı "11 içerik (7 tarif · 4 püf)" diyor ve BU DOĞRU —
        7 tarif `#tariflerim`de, 4 püf `#puf`ta duruyor. Yalan söyleyen
        özet değil, TABLO: sekiz satır çiziyor, üç püf noktası eksik.
     🔴 Satır eklemenin gerekçesi tahmin değil, bölümün KENDİ cümlesi:
        "Tarif ve püf noktalarının TAMAMI bu listede."
        Eksik satırların verisi de uydurulmadı — `#puf` kartlarının
        kendi başlığı, kategorisi ve okunma olgusu taşındı; püf
        noktalarında değerlendirme verisi olmadığı için puan hücresi
        var olan püf satırındaki gibi "—" kalır.
     ═══════════════════════════════════════════════════════════════════ */
  function yayindaTamamla() {
    var pane = document.getElementById('mutfak-defterim-pane-yayinda');
    if (!pane) return 0;
    var govde = pane.querySelector('table.tablo tbody');
    if (!govde) return 0;
    var satirlar = $$('tr', govde);
    if (!satirlar.length) return 0;
    var pufSatir = satirlar.filter(function (r) {
      return /püf/i.test(met(r.querySelectorAll('td')[1])); })[0];
    if (!pufSatir) return 0;                       /* kalıp yoksa ÜRETME */
    var mevcut = satirlar.map(function (r) {
      return anahtar(met(r.querySelectorAll('td')[0].querySelector('b'))); });
    var eklendi = 0;
    ozneler('puf').forEach(function (k) { void k; });   /* puf henüz kurulmadı */
    var pufPane = document.getElementById('mutfak-defterim-pane-puf');
    if (!pufPane) return 0;
    $$('[data-p2a="rkart"]', pufPane).forEach(function (kart) {
      var ad = met(kart.querySelector('h4'));
      if (!ad || mevcut.indexOf(anahtar(ad)) > -1) return;
      var okunma = olguSayi(kart, /okunma/);
      if (okunma == null) return;                  /* verisi yoksa BASMA */
      var r = pufSatir.cloneNode(true);            /* MARKUP KLONLANIR */
      var h = r.querySelectorAll('td');
      h[0].querySelector('b').textContent = ad;
      var kucuk = h[0].querySelector('small');
      if (kucuk) kucuk.textContent = kart.getAttribute('data-kategori') || '';
      h[2].textContent = String(okunma);
      h[3].textContent = '—';                      /* püfte değerlendirme YOK */
      r.setAttribute('data-p4a-eklendi', 'puf');
      govde.appendChild(r);
      eklendi++;
    });
    if (eklendi) {                                  /* bölümün kendi kuralı:
                                                       "Görüntülenmeye göre sıralı" */
      $$('tr', govde)
        .sort(function (a, b) {
          return (parseInt(met(b.querySelectorAll('td')[2]).replace(/\D/g, ''), 10) || 0) -
                 (parseInt(met(a.querySelectorAll('td')[2]).replace(/\D/g, ''), 10) || 0); })
        .forEach(function (r) { govde.appendChild(r); });
    }
    pane.setAttribute('data-p4a-eklenen-satir', eklendi);
    return eklendi;
  }

  /* ═══════════════════════════════════════════════════════════════════
     A5 · TABLO SATIRINDAKİ "İSTATİSTİKLER" → AYNI KANON MODAL
     ---------------------------------------------------------------
     Yeni sayfa ÜRETİLMEDİ, yeni veri UYDURULMADI: modalın gövdesi
     satırın KENDİ hücrelerinden kurulur; başlığı birebir eşleşen bir
     kart varsa o kartın istatistik paneli de (A2'deki gibi TAŞINARAK)
     eklenir ve kapanışta kartına geri döner.
     ═══════════════════════════════════════════════════════════════════ */
  function satirOlgu(ikon, kalinMetin, kuyruk) {
    var d = document.createElement('div');
    d.className = 'dk-olgu';
    var i = document.createElement('i');
    i.className = 'fa-solid ' + ikon; i.setAttribute('aria-hidden', 'true');
    var s2 = document.createElement('span');
    s2.className = 'dk-olgu-metin';
    var b = document.createElement('b'); b.textContent = kalinMetin;
    s2.appendChild(b);
    if (kuyruk) s2.appendChild(document.createTextNode(' ' + kuyruk));
    d.appendChild(i); d.appendChild(s2);
    return d;
  }
  function satirModalAc(tr) {
    if (!window.dmModal) return false;
    modalKur();
    geriTasi();
    var h = tr.querySelectorAll('td');
    var ad = met(h[0].querySelector('b')) || met(h[0]);
    var kategori = met(h[0].querySelector('small'));
    var tur = met(h[1]), gor = met(h[2]), puan = met(h[3]);
    $('#p4aKartModalBas', modal).textContent = 'İstatistikler';
    $('[data-p4a-modal-alt]', modal).textContent = ad;
    $('[data-p4a-ikon]', modal).className = 'fa-solid fa-chart-simple';
    var govde = $('[data-p4a-modal-govde]', modal);
    govde.innerHTML = '';
    ayagiSifirla();
    /* Kartı BİREBİR eşleşen içerik varsa onun paneli de taşınır. */
    var eş = null;
    ['tariflerim', 'puf'].forEach(function (p2) {
      var pane = document.getElementById('mutfak-defterim-pane-' + p2);
      if (!pane || eş) return;
      $$('[data-p2a="rkart"]', pane).forEach(function (k) {
        if (!eş && anahtar(met(k.querySelector('h4'))) === anahtar(ad)) eş = k;
      });
    });
    var pop = eş ? eş.querySelector('[data-p3a-pop="istatistik"]') : null;
    /* 🔴 AYNI SAYI İKİ KEZ YAZILMAZ. Kartın paneli görüntülenmeyi ve
       değerlendirmeyi zaten taşıyor; satırdan yalnız panelde OLMAYAN
       kalem (tür + kategori) eklenir. Panel yoksa satırın kendi
       hücreleri gövdeyi tek başına kurar. (Ölçüldü: ilk yazımda
       "105 görüntülenme" modalda iki kez çıkıyordu.) */
    var kap = document.createElement('div');
    kap.className = 'dk-pop dk-pop-istatistik';
    kap.setAttribute('data-p4a-satir-pop', pop ? 'ek' : 'tam');
    if (tur) kap.appendChild(satirOlgu('fa-tag', tur, kategori ? '· ' + kategori : ''));
    if (!pop) {
      if (gor) kap.appendChild(satirOlgu('fa-eye', gor, 'görüntülenme'));
      kap.appendChild(satirOlgu('fa-star', (puan && puan !== '—') ? puan : 'Değerlendirme yok',
                                (puan && puan !== '—') ? 'değerlendirme' : ''));
    }
    govde.appendChild(kap);
    if (pop) {
      yer = { ana: pop.parentNode, sonra: pop.nextSibling,
              dugme: eş.querySelector('[data-p3a-ac="istatistik"]') };
      govde.appendChild(pop);
      pop.hidden = false;
      acikPanel = pop; acikDugme = yer.dugme;
    }
    tr.setAttribute('data-p4a-modal', pop ? 'satir+kart' : 'satir');
    window.dmModal.ac(modal);
    return true;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('table.tablo tbody tr button');
    if (!b) return;
    var t = met(b).toLocaleLowerCase('tr');
    if (t.indexOf('istatistik') < 0) return;
    e.preventDefault(); e.stopPropagation();
    satirModalAc(b.closest('tr'));
  }, true);

  /* ═══════════════════════════════════════════════════════════════════
     A6 · "NOTU DÜZENLE" / "DÜZENLE" — KANON MODAL + KALICI KAYIT
     ---------------------------------------------------------------
     Not METNİ zaten kartın içinde; ayrı bir ekran gerekmiyor. Modal
     `dmModal`, kayıt `dmDepo` (maket depo), bildirim `dmToast`.
     🔴 Depo bir MAKET: "kaydedildi" diyen ama hiçbir yere gitmeyen
        yüzey yalan söyler. Toast bunu açıkça yazar.
     🔴 `localStorage` her okumada atabilir; `dmDepo` bunu kendi
        yutuyor ve bellek yedeğine düşüyor — kalıcılık `dmDepo.kalici`
        ile SORULUR ve arayüz doğru cümleyi kurar.
     ═══════════════════════════════════════════════════════════════════ */
  var NOT_BOLUM = 'a-notlar';
  function notKimlik(kart) {
    var s2 = slugOf(kart);
    if (s2) return s2;
    return 'not:' + slugla(met(kart.querySelector('h4, .kart-bas h3')));
  }
  function notGovde(kart) {
    return kart.querySelector('.dk-ozet') || kart.querySelector('.kart-govde p');
  }
  function notlariGeriYukle() {
    if (!window.dmDepo) return 0;
    var kayit = window.dmDepo.oku(NOT_BOLUM, {}) || {}, n = 0;
    ['denediklerim', 'notlarim'].forEach(function (ad) {
      var pane = document.getElementById('mutfak-defterim-pane-' + ad);
      if (!pane) return;
      $$('[data-p2a="rkart"], .kart', pane).forEach(function (k) {
        var g = notGovde(k);
        if (!g || !k.querySelector('h4, .kart-bas h3')) return;
        var id = notKimlik(k);
        if (kayit[id] != null) { g.textContent = kayit[id]; k.setAttribute('data-p4a-not', '1'); n++; }
      });
    });
    return n;
  }
  function notModalAc(kart) {
    if (!window.dmModal) return false;
    var g = notGovde(kart);
    if (!g) return false;
    modalKur();
    geriTasi();
    $('#p4aKartModalBas', modal).textContent = 'Notu düzenle';
    $('[data-p4a-modal-alt]', modal).textContent = met(kart.querySelector('h4, .kart-bas h3'));
    $('[data-p4a-ikon]', modal).className = 'fa-solid fa-pen';
    var govde = $('[data-p4a-modal-govde]', modal);
    govde.innerHTML = '';
    var alan = document.createElement('div');
    alan.className = 'alan';
    var et = document.createElement('label');
    et.className = 'alan-etiket';
    et.setAttribute('for', 'p4aNotAlan');
    et.textContent = 'Notun';
    var ta = document.createElement('textarea');
    ta.className = 'alan-metin';
    ta.id = 'p4aNotAlan';
    ta.rows = 6;
    ta.value = met(g);
    ta.setAttribute('data-p4a-not-alan', '');
    var yardim = document.createElement('span');
    yardim.className = 'alan-yardim';
    yardim.innerHTML = '<i class="fa-solid fa-lock" aria-hidden="true"></i> <span>Not yalnız sana görünür. ' +
      (window.dmDepo && window.dmDepo.kalici
        ? 'Bu makette tarayıcına kaydedilir, sunucuya gitmez.'
        : 'Tarayıcı deposu kapalı: not yalnız bu sayfa açık kaldığı sürece durur.') + '</span>';
    alan.appendChild(et); alan.appendChild(ta); alan.appendChild(yardim);
    govde.appendChild(alan);

    var ayak = $('.dm-modal-ayak .sag', modal);
    ayak.innerHTML = '';
    var vaz = document.createElement('button');
    vaz.className = 'dugme hayalet'; vaz.type = 'button';
    vaz.textContent = 'Vazgeç';
    vaz.addEventListener('click', function () { window.dmModal.kapat(modal); });
    var kaydet = document.createElement('button');
    kaydet.className = 'dugme birincil'; kaydet.type = 'button';
    kaydet.setAttribute('data-p4a-not-kaydet', '');
    kaydet.innerHTML = '<i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Notu kaydet';
    kaydet.addEventListener('click', function () {
      var yeni = ta.value.trim();
      if (!yeni) { ta.classList.add('hatali'); ta.focus(); return; }
      ta.classList.remove('hatali');
      var eski = met(g);
      var id = notKimlik(kart);
      var kayit = (window.dmDepo && window.dmDepo.oku(NOT_BOLUM, {})) || {};
      kayit[id] = yeni;
      var kalici = window.dmDepo ? window.dmDepo.yaz(NOT_BOLUM, kayit) : false;
      g.textContent = yeni;
      kart.setAttribute('data-p4a-not', '1');
      window.dmModal.kapat(modal);
      if (window.dmToast) window.dmToast('Not kaydedildi', {
        tip: 'basarili',
        alt: kalici ? 'Bu makette tarayıcına kaydedildi — sunucuya gitmez.'
                    : 'Tarayıcı deposu kapalı: not yalnız bu sayfada durur.',
        geri: { metin: 'Geri al', cb: function () {
          var k2 = (window.dmDepo && window.dmDepo.oku(NOT_BOLUM, {})) || {};
          if (eski) { k2[id] = eski; } else { delete k2[id]; }
          if (window.dmDepo) window.dmDepo.yaz(NOT_BOLUM, k2);
          g.textContent = eski;
        } }
      });
    });
    ayak.appendChild(vaz); ayak.appendChild(kaydet);
    window.dmModal.ac(modal);
    ta.focus();
    return true;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button');
    if (!b) return;
    var t = met(b);
    if (!/^(notu düzenle|düzenle)$/i.test(t)) return;
    var kart = b.closest('[data-p2a="rkart"], .kart');
    if (!kart || !kart.closest('#mutfak-defterim-pane-denediklerim, #mutfak-defterim-pane-notlarim')) return;
    if (!notGovde(kart)) return;
    e.preventDefault(); e.stopPropagation();
    notModalAc(kart);
  }, true);

  function kur() {
    var kurulan = [];
    /* 🔴 SIRA ÖNEMLİ: liste ÖNCE tamamlanır (yeni satırlar da özne olsun),
       depodaki notlar ÖNCE karta uygulanır (arama onları da görsün),
       panolar SONRA kurulur, sayaçlar EN SON bağlanır (nüfusu okuyorlar). */
    try { yayindaTamamla(); } catch (e) { if (window.console) console.error('[p4a]', e); }
    try { notlariGeriYukle(); } catch (e) { if (window.console) console.error('[p4a]', e); }
    $$('[id^="mutfak-defterim-pane-"]').forEach(function (pane) {
      /* 🔴 KAPALI PANODA ÖLÇÜM YAPILMAZ ama KURULUM yapılabilir:
         kurulum geometri okumaz, yalnız DOM'a bağlanır. */
      var r = null;
      try { r = panoKur(pane); } catch (e) { if (window.console) console.error('[p4a]', e); }
      if (r) kurulan.push(r);
    });
    document.documentElement.setAttribute('data-p4a-panolar', kurulan.length);
    try { sayaclariBagla(); } catch (e) { if (window.console) console.error('[p4a]', e); }
  }

  /* p2 betiği `defer` ile bu dosyadan ÖNCE koşuyor; yine de sıra
     VARSAYILMAZ — p2'nin ilk çizimi bittikten sonra kurulur. */
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', function () { setTimeout(kur, 0); });
  else setTimeout(kur, 0);
})();
