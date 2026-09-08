/* ══════════════════════════════════════════════════════════════════════
   T5 · GOURMET PUBLIC · KULVAR D — DAVRANIŞ KATMANI
   Bu dosyayı YALNIZ ajan D yazar. Bağını LEAD attı (beş sayfa).

   NE YAPAR
     1 · SAYFALAMA (madde 8) — donörün motoru, YENİDEN YAZILMADI.
     2 · DOKÜMAN İŞLEMLERİ (madde 6) — kardeş markanın altı mekanizması.
     3 · SATIR EYLEMLERİ — bu dosyanın ürettiği satırlara bağlanır.

   ── YÜKLEME SIRASI (ölçüldü) ──────────────────────────────────────────
   `dm-profil.js` gövde sonunda DÜZ betik, bu dosya `<head>`de `defer`.
   Düz betik ayrıştırma sırasında, `defer` olan ondan SONRA koşar. Yani
   `dm-profil.js`in bütün dinleyicileri bağlanmış olur; bu dosya onun
   ÜSTÜNE ikinci bir dinleyici koymaz, kendi kancalarını (`data-t5d-*`)
   kullanır. `data-dm-*` kancalarına HİÇ dokunulmaz.
   ⚠ `__bagli` bayrağı ORTAKTIR: `dm-profil.js` de aynı adı kullanıyor.
     İki taraf da "bağlıysa atla" dediği için satır eylemleri hiçbir
     satırda ÇİFTLENMEZ — kanıtı olumsuz sınama O6.

   ── DELEGASYON ────────────────────────────────────────────────────────
   Bütün eylemler `document` üzerinde delege. Sebep: satırlar ÇALIŞMA
   ANINDA doğuyor; doğrudan bağlama sonradan doğan satırı ıskalar.
   ⚠ Maketin kendi formu `stopPropagation` çağırırsa delegasyon ölür —
     bu yüzden formların `submit`i değil, düğmelerin `click`i dinlenir
     ve sınama gerçekten TIKLAYARAK ölçer (yapısal ölçüt yeşil basar).

   ⚠ BACKEND YOK. Hiçbir şey sunucuya gitmez; eklenen satır ekranın kendi
     geri bildirimidir. Sayfanın kendi `.alt-not`u da bunu yazıyor
     ("Kayıtlar bu tarayıcı oturumunda tutulur").
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var d = document;
  function hepsi(s, k) { return [].slice.call((k || d).querySelectorAll(s)); }
  function yakin(el, s) { return el && el.closest ? el.closest(s) : null; }

  /* 🔴 BOŞ SEÇİCİ ATAR — `querySelector('')` SyntaxError verir ve
     dinleyicinin geri kalanını düşürür; düğme ölü GÖRÜNÜR ama kod
     vardır. Kardeş kulvarda 21 düğme tek kökten ölmüştü. */
  function sec1(v) { return v ? d.querySelector(v) : null; }

  /* Kaçış tek yerde — içerik kullanıcıdan geliyor (mekân adı, not). */
  function kac(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Bildirim — donörün kipi: `.fpx-durum` `hidden` DOĞAR, mesaj gelince
     açılır (boş `hidden`siz satır 26px'lik boş çubuk üretiyordu). */
  function duyur(yakinEl, metin) {
    var kap = (yakinEl && yakinEl.closest) ? (yakinEl.closest('.fit-pane') || d) : d;
    var s = kap.querySelector('[data-dm-bildirim]');
    if (s) { s.textContent = metin; s.hidden = !metin; }
  }

  /* ══════════════════════════════════════════════════════════════════
     1 · SAYFALAMA MOTORU — DONÖRDEN TAŞINDI, YAZILMADI
     ------------------------------------------------------------------
     kaynak : /Gourmet/go-cozum-merkezi.html → `window.FIT_PAGI`
              (aynı ağaçta, aynı markanın kendi sayfası)
     kip    : `.sayfa-dugme` düğmeleri `aria-label`la ("İlk/Önceki/
              1./Sonraki/Son sayfa"), aktif olan `.aktif` +
              `aria-current="page"`, özet `.pagi-note` içinde
              "<n> <birim> · a–b gösteriliyor · sayfa x / y".
     🔴 SAYFA BOYU 10 — donörün ölçüsü (`sayfaBoy: 10`, kaynağı
        Gastro'nun `paginate(10)`ı). Beş sayfanın YİRMİ ALTI listesinde
        de aynı sayı; "sayfa başına kart sabit" ölçütü buna bağlı.
     ⚠ Donörün `kap.hidden = toplam <= 1` davranışı KORUNDU: tek
       sayfalık listede sayfalama basılmaz. Değiştirmek donörden sapma
       olurdu; kapı bunu ölçüt olarak DEĞİL, donör kipi olarak kaydeder.
     ══════════════════════════════════════════════════════════════════ */
  var SAYFA_BOY = 10;

  function pagiKur(nav) {
    var listeId = nav.getAttribute('data-t5d-pagi');
    var liste = listeId ? d.getElementById(listeId) : null;
    if (!liste) return null;                       /* özne yok → kapı 🔴 verir */
    var ayak = nav.parentElement;                  /* .kart-alt.sayfa-ayagi */
    var not = nav.querySelector('.pagi-note');
    var birim = nav.getAttribute('data-t5d-birim') || 'kayıt';
    var sayfa = 1;

    function kalemler() { return hepsi('.kalem-satiri', liste); }

    function ciz() {
      var hepsiK = kalemler(), n = hepsiK.length;
      var toplam = Math.max(1, Math.ceil(n / SAYFA_BOY));
      if (sayfa > toplam) sayfa = toplam;
      var bas = (sayfa - 1) * SAYFA_BOY, son = Math.min(n, bas + SAYFA_BOY);

      hepsiK.forEach(function (k, i) { k.hidden = !(i >= bas && i < son); });

      hepsi('.sayfa-dugme', nav).forEach(function (b) { b.remove(); });
      function dugme(etiket, ikon, hedef, pasif, aktif) {
        var b = d.createElement('button');
        b.type = 'button';
        b.className = 'sayfa-dugme' + (ikon ? ' ok' : '') + (aktif ? ' aktif' : '');
        b.setAttribute('aria-label', etiket);
        if (aktif) b.setAttribute('aria-current', 'page');
        if (pasif) b.disabled = true;
        b.innerHTML = ikon ? '<i class="fa-solid ' + ikon + '" aria-hidden="true"></i>' : String(hedef);
        b.addEventListener('click', function () { sayfa = hedef; ciz(); });
        nav.insertBefore(b, not || null);
      }
      dugme('İlk sayfa', 'fa-angles-left', 1, sayfa === 1, false);
      dugme('Önceki sayfa', 'fa-chevron-left', sayfa - 1, sayfa === 1, false);
      for (var i = 1; i <= toplam; i++) dugme(i + '. sayfa', null, i, false, i === sayfa);
      dugme('Sonraki sayfa', 'fa-chevron-right', sayfa + 1, sayfa === toplam, false);
      dugme('Son sayfa', 'fa-angles-right', toplam, sayfa === toplam, false);

      if (not) not.textContent = n === 0
        ? ('0 ' + birim)
        : (n + ' ' + birim + ' · ' + (bas + 1) + '–' + son +
           ' gösteriliyor · sayfa ' + sayfa + ' / ' + toplam);

      nav.hidden = toplam <= 1;
      if (ayak) ayak.hidden = nav.hidden;          /* boş ayak çizgisi kalmasın */
    }

    /* Satırlar `dm-profil.js` tarafından da eklenip silinebiliyor; o
       dosya bu motoru tanımıyor. Gözlemci olmazsa sayfalama BAYAT
       kalır ve "11 kayıt" derken 11 satır birden görünür (donörün
       ölü sayfalamasının belirtisinin aynısı). */
    try {
      new MutationObserver(function () { ciz(); ozetTazele(); }).observe(liste, { childList: true });
    } catch (_) {}

    ciz();
    return { yenile: function () { sayfa = 1; ciz(); }, ciz: ciz };
  }

  var PAGI = {};
  hepsi('[data-t5d-pagi]').forEach(function (nav) {
    var m = pagiKur(nav);
    if (m) PAGI[nav.getAttribute('data-t5d-pagi')] = m;
  });
  function pagiTazele(liste) {
    var m = liste && liste.id ? PAGI[liste.id] : null;
    if (m) m.ciz();
  }

  /* ══════════════════════════════════════════════════════════════════
     2 · SATIR KALIBI — `dm-profil.js`in kalıbının AYNISI
     ------------------------------------------------------------------
     🔴 YENİ SINIF ÜRETİLMEDİ. `dm-profil.css` yalnız bu adları
        tanıyor; başka bir kalıp yazmak satırı ÇİZİMSİZ doğurur
        ("olmayan elemanın çifti de yoktur").
        Eklenen tek şey `.ks-tasi` taşıma düğmeleri — kuralları
        `t5-d.css §3`te, `hidden` doğar.
     ══════════════════════════════════════════════════════════════════ */
  function satirYap(o) {
    var kal = d.createElement('div');
    kal.className = 'kalem-satiri dm-yeni';
    kal.innerHTML =
      '<span class="ks-ikon"><i class="' + kac(o.ikon || 'fa-solid fa-location-dot') + '" aria-hidden="true"></i></span>' +
      '<span class="ks-metin"><b>' + kac(o.ad) + '</b><small>' + kac(o.alt) + '</small></span>' +
      '<span class="ks-uc"><span class="rozet pasif">' + kac(o.rozet) + '</span>' +
      '<button class="dugme hayalet dm-mini ks-tasi" type="button" data-t5d-tasi="yukari" aria-label="Yukarı taşı" hidden><i class="fa-solid fa-arrow-up" aria-hidden="true"></i></button>' +
      '<button class="dugme hayalet dm-mini ks-tasi" type="button" data-t5d-tasi="asagi" aria-label="Aşağı taşı" hidden><i class="fa-solid fa-arrow-down" aria-hidden="true"></i></button>' +
      '<button class="dugme hayalet dm-mini" type="button" data-dm-durum>Durumu gör</button>' +
      '<button class="dugme hayalet dm-mini" type="button" data-dm-sil>Kaldır</button></span>' +
      '<div class="dm-durum-govde" hidden></div>';
    kal.querySelector('.dm-durum-govde').textContent =
      'Gönderildi: ' + new Date().toLocaleString('tr-TR') + ' · Durum: ' +
      (o.rozet || 'İnceleniyor') + ' · Kayıt yalnız bu tarayıcı oturumunda tutulur.';
    return kal;
  }

  /* Satır eylemleri — `dm-profil.js` ile AYNI bayrağı kullanır, bu
     yüzden hiçbir düğme iki kez bağlanmaz. */
  function bagla(kok) {
    hepsi('[data-dm-durum]', kok).forEach(function (b) {
      if (b.__bagli) return; b.__bagli = 1;
      b.addEventListener('click', function () {
        var s = yakin(b, '.kalem-satiri'); if (!s) return;
        var g = s.querySelector('.dm-durum-govde'); if (!g) return;
        g.hidden = !g.hidden;
        b.textContent = g.hidden ? 'Durumu gör' : 'Durumu gizle';
      });
    });
    hepsi('[data-dm-sil]', kok).forEach(function (b) {
      if (b.__bagli) return; b.__bagli = 1;
      b.addEventListener('click', function () {
        var s = yakin(b, '.kalem-satiri'); if (!s) return;
        var l = s.parentElement;
        var ad = (s.querySelector('b') || {}).textContent || 'Kayıt';
        s.remove();
        sayacTazele(l); pagiTazele(l);
        var bosd = l.querySelector('.bos-durum');
        if (bosd && !hepsi('.kalem-satiri', l).length) bosd.hidden = false;
        duyur(l, ad + ' listeden kaldırıldı.');
      });
    });
  }

  function sayacTazele(liste) {
    var kap = yakin(liste, '[data-dm-kap]') || liste.parentElement;
    var s = kap ? kap.querySelector('[data-dm-sayac]') : null;
    if (s) s.textContent = hepsi('.kalem-satiri', liste).length + ' ' +
      (s.getAttribute('data-dm-sayac') || 'kayıt');
    ozetTazele();
  }

  /* ── ÖZET ŞERİDİ (`.cp-stats`) ─────────────────────────────────────
     🔴 GÖRÜNTÜ YAKALADI, SAYIM DEĞİL. Liste 11 satır taşırken kimlik
     bandındaki özet "0" diyordu: işlem BAĞLIYDI ama sonucu sayfanın
     KENDİ ÖZETİNE ulaşmıyordu. `dm-profil.js` yalnız `[data-dm-sayac]`
     rozetini tazeliyor; şeridin kancası hiç yoktu.
     Hangi sayacın hangi listeyi saydığı ETİKETİNDEN okundu (kanca
     `d-go-uygula.py` · SAYAC tablosu). Bir sayaç birden çok listeyi
     sayabilir ("Rota" = Gastronomi + Şehir); kanca virgülle ayrılır.
     Liste bulunamazsa sayaç DEĞİŞTİRİLMEZ — uydurma sayı basılmaz. */
  function ozetTazele() {
    hepsi('[data-t5d-sayac]').forEach(function (b) {
      var idler = (b.getAttribute('data-t5d-sayac') || '').split(',');
      var n = 0, bulundu = 0;
      idler.forEach(function (id) {
        var l = d.getElementById(id.trim());
        if (!l) return;
        bulundu++; n += hepsi('.kalem-satiri', l).length;
      });
      if (bulundu === idler.length) b.textContent = String(n);
    });
  }
  ozetTazele();

  /* ══════════════════════════════════════════════════════════════════
     3 · MEKANİZMALAR — kardeş markanın (Diet, `diet-profil.js`) altı
         mekanizmasının bu kulvardaki karşılıkları. Yapı sorusu kardeş
         markaya soruldu; MARKUP ve ADLAR Gourmet'in kendi gramerinden.
     ══════════════════════════════════════════════════════════════════ */
  var acan = null;

  d.addEventListener('click', function (e) {

    /* ── 3a · PANEL AÇ — `data-t5d-ac="ID"` ─────────────────────────
       Kart markup'ta DURUYOR ve `hidden`; düğme yalnız niteliği
       kaldırır. JS'in bastığı markup ilk boyamada kanonun kurallarıyla
       eşleşmiyor (kaynakta ölçülmüş kip). */
    var a = yakin(e.target, '[data-t5d-ac]');
    if (a) {
      var kart = d.getElementById(a.getAttribute('data-t5d-ac'));
      if (!kart) return;
      e.preventDefault();
      kart.hidden = false;
      acan = a;
      if (a.hasAttribute('aria-expanded')) a.setAttribute('aria-expanded', 'true');
      var ilk = kart.querySelector('select, textarea, input:not([type=hidden]), button');
      if (ilk) ilk.focus();
      kart.scrollIntoView({ block: 'nearest' });
      return;
    }

    /* ── 3b · PANEL KAPAT — `data-t5d-kapat="ID"` ───────────────────── */
    var k = yakin(e.target, '[data-t5d-kapat]');
    if (k) {
      var hedef = k.getAttribute('data-t5d-kapat');
      var kap = hedef ? d.getElementById(hedef) : yakin(k, '.kart[id]');
      if (!kap) return;
      e.preventDefault();
      kap.hidden = true;
      hepsi('[data-t5d-ac="' + kap.id + '"]').forEach(function (b) {
        if (b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded', 'false');
      });
      if (acan) { try { acan.focus(); } catch (_) {} acan = null; }
      return;
    }

    /* ── 3c · KAYIT — `data-t5d-gonder="#liste"` ─────────────────────
       GERÇEK satır ekler. Zorunlu alan boşsa eklemez, odağı ilk boş
       alana taşır ve sebebini `aria-live` ile söyler. */
    var g = yakin(e.target, '[data-t5d-gonder]');
    if (g) {
      e.preventDefault();
      var liste = sec1(g.getAttribute('data-t5d-gonder'));
      if (!liste) return;
      var panel = yakin(g, '.kart[id]') || d;
      var alanlar = hepsi('[data-t5d-alan]', panel);
      var bos = alanlar.filter(function (x) { return x.required && !String(x.value).trim(); });
      if (bos.length) { bos[0].focus(); duyur(liste, 'Zorunlu alanları doldur.'); return; }
      var v = {};
      alanlar.forEach(function (x) { v[x.getAttribute('data-t5d-alan')] = String(x.value).trim(); });
      var rozet = g.getAttribute('data-t5d-rozet') || 'İnceleniyor';
      var kalem = satirYap({
        ikon: g.getAttribute('data-t5d-ikon'),
        ad: v.ad || 'Adsız kayıt',
        alt: [v.tur, v.yer, v.tarih, v.not].filter(Boolean).join(' · '),
        rozet: rozet
      });
      var bosd = liste.querySelector('.bos-durum'); if (bosd) bosd.hidden = true;
      liste.insertBefore(kalem, liste.firstChild);
      bagla(kalem);
      /* sıralama kipi açıksa yeni satır da taşınabilir olmalı */
      if (liste.classList.contains('sira-kipi')) siraGoster(liste, true);
      sayacTazele(liste); pagiTazele(liste);
      duyur(liste, (v.ad || 'Kayıt') + ' eklendi — durum: ' + rozet + '.');
      alanlar.forEach(function (x) { if (x.tagName === 'SELECT') x.selectedIndex = 0; else x.value = ''; });
      if (panel !== d && panel.id) {
        panel.hidden = true;
        hepsi('[data-t5d-ac="' + panel.id + '"]').forEach(function (b) {
          if (b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded', 'false');
        });
      }
      return;
    }

    /* ── 3d · DURUM DÖKÜMÜ — `data-t5d-durum-toplu="#liste"` ─────────
       Belgenin "öneri durumunu görüntüleme" / "bileti görüntüleme"
       kalemi. Listedeki HER satırın durum gövdesini birlikte açar ve
       kapatır; liste boşken de GERÇEK bir şey yapar — sayımı
       `aria-live` şeridine yazar (yalan yüzey olmaması buna bağlı). */
    var t = yakin(e.target, '[data-t5d-durum-toplu]');
    if (t) {
      e.preventDefault();
      var lst = sec1(t.getAttribute('data-t5d-durum-toplu'));
      if (!lst) return;
      var govde = hepsi('.kalem-satiri:not([hidden]) .dm-durum-govde', lst);
      var ac = t.getAttribute('aria-expanded') !== 'true';
      govde.forEach(function (x) { x.hidden = !ac; });
      hepsi('.kalem-satiri:not([hidden]) [data-dm-durum]', lst).forEach(function (b) {
        b.textContent = ac ? 'Durumu gizle' : 'Durumu gör';
      });
      t.setAttribute('aria-expanded', ac ? 'true' : 'false');
      var et = t.querySelector('.t5d-et');
      if (et) et.textContent = ac ? (t.getAttribute('data-t5d-kapali') || 'Gizle')
                                  : (t.getAttribute('data-t5d-acik') || 'Göster');
      duyur(lst, govde.length
        ? (ac ? govde.length + ' kaydın durumu açıldı.' : 'Durum dökümü kapatıldı.')
        : 'Bu listede henüz kayıt yok — durum dökümü boş.');
      return;
    }

    /* ── 3e · İŞARET — `data-t5d-isaret` (aria-pressed) ──────────────
       "Listeyi gizli veya herkese açık yapma". Rozeti ve etiketi
       birlikte çevirir; `classList.toggle(ad, undefined)` tuzağına
       düşmemek için ikinci argüman HER ZAMAN boolean. */
    var s = yakin(e.target, '[data-t5d-isaret]');
    if (s) {
      e.preventDefault();
      var on = s.getAttribute('aria-pressed') !== 'true';
      s.setAttribute('aria-pressed', on ? 'true' : 'false');
      s.classList.toggle('aktif', on === true);
      var acikMetin = s.getAttribute('data-t5d-acik') || 'Açık';
      var kapaliMetin = s.getAttribute('data-t5d-kapali') || 'Kapalı';
      var eti = s.querySelector('.t5d-et');
      if (eti) eti.textContent = on ? acikMetin : kapaliMetin;
      var rz = sec1(s.getAttribute('data-t5d-rozet-hedef'));
      if (rz) {
        rz.textContent = on ? acikMetin : kapaliMetin;
        rz.classList.toggle('olumlu', on === true);
        rz.classList.toggle('pasif', on === false);
      }
      duyur(s, (on ? acikMetin : kapaliMetin) + ' olarak ayarlandı.');
      return;
    }

    /* ── 3f · SIRALAMA KİPİ — `data-t5d-sira="#liste"` ───────────────
       Kipi açar; satırlardaki ▲▼ görünür olur. Kip kapalıyken düğmeler
       `hidden` — "görünemeyen kalem düşürülmüş kalemdir" dersinin
       tersi değil: kip AÇILDIĞINDA görünüyorlar ve gerçekten taşıyorlar. */
    var sr = yakin(e.target, '[data-t5d-sira]');
    if (sr) {
      e.preventDefault();
      var sl = sec1(sr.getAttribute('data-t5d-sira'));
      if (!sl) return;
      var kip = sr.getAttribute('aria-pressed') !== 'true';
      sr.setAttribute('aria-pressed', kip ? 'true' : 'false');
      sr.classList.toggle('aktif', kip === true);
      siraGoster(sl, kip);
      var e2 = sr.querySelector('.t5d-et');
      if (e2) e2.textContent = kip ? (sr.getAttribute('data-t5d-acik') || 'Sıralamayı bitir')
                                   : (sr.getAttribute('data-t5d-kapali') || 'Sıralamayı değiştir');
      duyur(sl, kip
        ? (hepsi('.kalem-satiri', sl).length
            ? 'Sıralama kipi açık — satırları ok düğmeleriyle taşı.'
            : 'Sıralama kipi açık; liste boş olduğu için taşınacak satır yok.')
        : 'Sıralama kipi kapatıldı.');
      return;
    }

    /* ── 3g · TAŞI — satırı GERÇEKTEN yer değiştirir ─────────────────
       ⚠ Uzunluk imzası sırayı görmez: kapı satır ADLARININ dizisini
         karşılaştırır, sayısını değil. */
    var ts = yakin(e.target, '[data-t5d-tasi]');
    if (ts) {
      e.preventDefault();
      var st = yakin(ts, '.kalem-satiri'); if (!st) return;
      var lp = st.parentElement;
      var yon = ts.getAttribute('data-t5d-tasi');
      var kom = yon === 'yukari' ? st.previousElementSibling : st.nextElementSibling;
      while (kom && !kom.classList.contains('kalem-satiri')) {
        kom = yon === 'yukari' ? kom.previousElementSibling : kom.nextElementSibling;
      }
      if (!kom) { duyur(lp, 'Satır zaten ' + (yon === 'yukari' ? 'en üstte' : 'en altta') + '.'); return; }
      if (yon === 'yukari') lp.insertBefore(st, kom); else lp.insertBefore(kom, st);
      pagiTazele(lp);
      duyur(lp, ((st.querySelector('b') || {}).textContent || 'Satır') + ' taşındı.');
      return;
    }
  });

  function siraGoster(liste, ac) {
    liste.classList.toggle('sira-kipi', ac === true);
    hepsi('.ks-tasi', liste).forEach(function (b) { b.hidden = (ac !== true); });
  }

  bagla(d);
})();
