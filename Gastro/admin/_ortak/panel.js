/* ═══════════════════════════════════════════════════════════════════════
   GASTRO ADMIN · KABUK DAVRANIŞI — donör `admin-fit/_ortak/panel.js` ile
   BİREBİR aynı. 🔴 BU DOSYA BİR KEZ BAYATLADI: kabuk damgası betik
   KÜMESİNİ dayatıyordu (aynı ad yükleniyor mu), İÇERİĞİNİ değil. Gastro
   6.299 baytta kalmış, donör 12.942'ye çıkmıştı; 34 ekranda sekme klavye
   gezintisi hiç kurulmuyordu. Dosya vardı, yükleniyordu, hata vermiyordu
   — yalnız eksik iş yapıyordu. Deploy doğrulaması yakaladı.
   Değiştirirken donörle md5 eşitliği sınanmalı
   ───────────────────────────────────────────────────────────────────────
   🔴 NEDEN VAR: kanonik kabuk `aria-expanded` + `aria-controls` bildiren
   denetimler taşıyor (üst çubuk araması, süzgeç açılırları, kolon
   seçici, hesap menüsü). Davranış sınaması 61 ekranın 48'inde bunların
   HİÇ ÇALIŞMADIĞINI gösterdi — yüzey açılmıyor, `aria-expanded` dönmüyor.

   Bildirilmiş ama sürülmeyen bir ARIA denetimi, HİÇ bildirilmemiş
   olmasından KÖTÜDÜR: ekran okuyucuya "burada açılır bir şey var" der
   ve açmaz. Markup ölçümü bunu göremez (sınıf kümesi bozulmaz, düğüm
   sayısı değişmez, konsol susar); yalnız TIKLAYAN bir sınama görür.

   Sözleşme: her açılır `aria-expanded` taşıyan bir tetikleyici ve
   `aria-controls` ile işaret ettiği bir yüzeyden oluşur. Sınıf ile ARIA
   BİRLİKTE güncellenir — kanonun §21 akordeon kuralının aynısı.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var acik = null;

  function kapat(t) {
    if (!t) return;
    var y = document.getElementById(t.getAttribute('aria-controls'));
    t.setAttribute('aria-expanded', 'false');
    if (y) y.hidden = true;
    if (acik === t) acik = null;
  }

  function ac(t) {
    var y = document.getElementById(t.getAttribute('aria-controls'));
    if (!y) return;                      /* hedefi olmayan tetik sessizce durur */
    if (acik && acik !== t) kapat(acik); /* aynı anda tek açılır — §21'in kuralı */
    t.setAttribute('aria-expanded', 'true');
    y.hidden = false;
    acik = t;
  }

  /* 🔴 KAPSAM: KABUK **VE** GÖVDE — TEK DAVRANIŞ KAYNAĞI.
     Bir tur önce bu betik yalnız kabukla sınırlandırılmıştı, gerekçe
     "iki toggle sistemi çakışıyor"du. O gerekçe ÖLÇÜMLE ÇÜRÜDÜ:
     iki betik birlikte yüklüyken açılır ÇALIŞIYOR (aria=true, hidden
     kalkıyor); çakışma sanılan şey ölçümün kendi kusuruydu — dört
     tetiği ardışık tıklıyordum ve ikinciye tıklamak birincinin
     "dışarı tıklaması" oluyordu. Daraltınca gövde açılırları öksüz
     kaldı (5/6 ekran kırmızı) ve kusur GERÇEKTEN doğdu.
     Kabuk gibi davranış da TEK kaynaktan gelir; sürüm kayması ancak
     böyle imkânsız olur (bkz. revenge-56'nın bayat kopya vakası:
     dosya vardı, yükleniyordu, hata vermiyordu, hiçbir şey yapmıyordu). */
  /* ── MODÜL MENÜSÜ · dar ekranın çekmecesi ───────────────────────────
     Menü bir açılır yüzey değil, gövdenin durumu: kanon `body.panel-acik`
     bekliyor. O yüzden genel toggle'dan ÖNCE ve ayrı ele alınır. */
  document.addEventListener('click', function (e) {
    var ac = e.target.closest('.panel-ac');
    if (ac) {
      e.preventDefault();
      var acik = document.body.classList.toggle('panel-acik');
      ac.setAttribute('aria-expanded', String(acik));
      return;
    }
    /* Perdeye ya da bir modüle tıklayınca kapanır. */
    if (document.body.classList.contains('panel-acik')) {
      var menu = document.querySelector('.panel-menu');
      if (!menu.contains(e.target) || e.target.closest('.panel-menu-link')) {
        document.body.classList.remove('panel-acik');
        var d = document.querySelector('.panel-ac');
        if (d) d.setAttribute('aria-expanded', 'false');
      }
    }
  });

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[aria-expanded][aria-controls]');
    if (t && t.classList.contains('panel-ac')) return;   /* yukarıda ele alındı */
    if (t) {
      e.preventDefault();
      (t.getAttribute('aria-expanded') === 'true' ? kapat : ac)(t);
      return;
    }
    /* dışarı tıklama — açık yüzeyin İÇİ sayılmaz */
    if (acik) {
      var y = document.getElementById(acik.getAttribute('aria-controls'));
      if (!y || !y.contains(e.target)) kapat(acik);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (acik) { var t = acik; kapat(t); t.focus(); return; }
    if (document.body.classList.contains('panel-acik')) {
      document.body.classList.remove('panel-acik');
      var d = document.querySelector('.panel-ac');
      if (d) { d.setAttribute('aria-expanded', 'false'); d.focus(); }
    }
  });

  /* ── TOPLU İŞLEM ÇUBUĞU · seçim sayısına bağlı ────────────────────
     Kanon §75e çubuğu tabloya bağladı; sözleşmenin çalışan hâli budur. */
  function secimiTazele(tablo) {
    var kutular = tablo.querySelectorAll('tbody .sec input[type=checkbox]');
    var secili = tablo.querySelectorAll('tbody .sec input[type=checkbox]:checked');
    var kart = tablo.closest('.kart') || document;
    var cubuk = kart.querySelector('.toplu-islem');
    var sayac = kart.querySelector('[data-rol="secim-sayisi"]');
    if (cubuk) cubuk.hidden = secili.length === 0;
    if (sayac) sayac.textContent = String(secili.length);
    var hepsi = kart.querySelector('thead .sec input[type=checkbox]');
    if (hepsi) {
      hepsi.checked = kutular.length > 0 && secili.length === kutular.length;
      hepsi.indeterminate = secili.length > 0 && secili.length < kutular.length;
    }
    tablo.querySelectorAll('tbody tr').forEach(function (tr) {
      var k = tr.querySelector('.sec input[type=checkbox]');
      tr.classList.toggle('secili', !!(k && k.checked));
    });
  }
  document.addEventListener('change', function (e) {
    var k = e.target.closest('.sec input[type=checkbox]');
    if (!k) return;
    var tablo = k.closest('table'); if (!tablo) return;
    if (k.closest('thead'))
      tablo.querySelectorAll('tbody .sec input[type=checkbox]')
        .forEach(function (x) { x.checked = k.checked; });
    secimiTazele(tablo);
  });

  /* ── SIRALAMA · D2 kalemi 3 · `aria-sort` aynı anda TEK başlıkta ──── */
  document.addEventListener('click', function (e) {
    var d = e.target.closest('.tablo th.sirali > button'); if (!d) return;
    var th = d.parentElement, tablo = th.closest('table');
    var bas = Array.prototype.slice.call(tablo.querySelectorAll('thead th'));
    var i = bas.indexOf(th), artan = th.getAttribute('aria-sort') !== 'ascending';
    bas.forEach(function (x) { if (x !== th) x.removeAttribute('aria-sort'); });
    th.setAttribute('aria-sort', artan ? 'ascending' : 'descending');
    var g = tablo.tBodies[0]; if (!g) return;
    var m = function (tr) { var h = tr.children[i]; return h ? (h.textContent || '').trim() : ''; };
    Array.prototype.slice.call(g.rows)
      .sort(function (a, b) { return m(a).localeCompare(m(b), 'tr', { numeric: true }) * (artan ? 1 : -1); })
      .forEach(function (tr) { g.appendChild(tr); });
  });

  /* Açılır içi çip seçimi ve tetikteki sayaç. */
  document.addEventListener('click', function (e) {
    var c = e.target.closest('.acilir-yuzey .cip'); if (!c) return;
    var y = c.closest('.acilir-yuzey');
    c.classList.toggle('aktif');
    var n = y.querySelectorAll('.cip.aktif:not(:first-child)').length;
    var t = document.querySelector('[aria-controls="' + y.id + '"]');
    var s = t && t.querySelector('.sayi');
    if (s) { s.textContent = n ? String(n) : ''; s.setAttribute('data-sayi', String(n)); }
  });

  /* ── MARKA AYARLARI · DEĞER TOKENDAN OKUNUR ────────────────────────
     🔴 Renk alanları SABİT HEX taşıyordu: `#0093D0` · `#0075A6` ·
     `#F5A623`. Biri doğruydu, biri FIT için bile yanlıştı
     (`--marka-koyu` #00719F, yazılan #0075A6), biri kanonda hiç yok.
     Ve üçü de marka katmanını atlıyordu — aynı ekran Gastro'da da MAVİ
     başlıyordu. `.yetkili`nin kardeşi: kalıp doğru, değer yanlış yerden.
     ⚠ Hiçbir denetim yakalamıyordu: `style=` değil, `value=`.
        (revenge-56 Gastro tarafında ölçüp bildirdi.)
     Çözüm: alan `data-token` taşır, değerini ÇÖZÜLMÜŞ tokenden okur.
     Böylece dört markada da o markanın kendi rengi görünür ve ekran
     "ayarların bugünkü hâli"ni gerçekten gösterir. */
  (function () {
    var kok = getComputedStyle(document.documentElement);
    var olc = document.createElement('span');
    olc.style.display = 'none';
    document.body.appendChild(olc);
    document.querySelectorAll('[data-token]').forEach(function (g) {
      var ham = kok.getPropertyValue(g.dataset.token).trim();
      if (!ham) return;
      /* `color-mix()` ve `color(srgb …)` ham hâlde okunur — tarayıcıya
         çözdürülür, yoksa alanda formülün kendisi görünür. */
      olc.style.color = '';
      olc.style.color = ham;
      var coz = getComputedStyle(olc).color;
      var m = coz.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return;
      g.value = '#' + [m[1], m[2], m[3]]
        .map(function (x) { return ('0' + (+x).toString(16)).slice(-2); })
        .join('').toUpperCase();
    });
    olc.remove();
  })();

  document.querySelectorAll('.tablo').forEach(secimiTazele);

  /* ═══════════════════════════════════════════════════════════════════
     SEKME LİSTESİ — role="tablist" ne söz veriyorsa o yapılır.

     🔴 54 ekranda sekmeler TIKLAMAYA DA KLAVYEYE DE CEVAP VERMİYORDU.
     Ölçüldü: üçüncü sekmeye tıkla → `aria-selected` değişmiyor, `.aktif`
     yerinde kalıyor; ok tuşu odağı kıpırdatmıyor; `Tab` altı sekmeyi tek
     tek geziyor. Oysa aynı maketin açılırları, toplu işlem çubuğu ve
     sıralaması ÇALIŞIYOR — yani kusur "maket statiktir" değil, maketin
     kendi standardına uymayan bir bileşen.

     Ve bu borç, 84 kırık ARIA bağı düzeltilince BÜYÜDÜ: artık markup
     düzgün bir sekme listesi VAAT EDİYOR. W3C APG'ye göre sekme listesi
     TEK duraktır (gezici tabindex) ve oklarla gezilir; altı ayrı durak
     vaadin tersidir. *Bir rolü bildirmek, o rolün klavye sözleşmesini de
     bildirmektir.*

     İki nüfus ayrı ele alınır:
       · ayrı panoları olan sekmeler (form/detay, 27 ekran) → pano açılıp
         kapanır; kaldıraç zaten markup'ta olan `hidden`
       · tek bölgeyi süzen sekmeler (liste, 27 ekran) → hepsi AYNI panoyu
         gösteriyor, o yüzden gizleme YOK; yalnız seçim durumu güncellenir
     Ayrım sayıyla yapılır (`benzersizPano`), varsayımla değil. */
  document.querySelectorAll('[role="tablist"]').forEach(function (liste) {
    var sekmeler = [].slice.call(liste.querySelectorAll('[role="tab"]'));
    if (sekmeler.length < 2) return;

    var panoIdleri = sekmeler
      .map(function (t) { return t.getAttribute('aria-controls'); })
      .filter(Boolean);
    var benzersizPano = panoIdleri.filter(function (x, i) {
      return panoIdleri.indexOf(x) === i;
    }).length;
    var panoDegisir = benzersizPano > 1;

    function sec(sekme, odakla) {
      sekmeler.forEach(function (t) {
        var bu = t === sekme;
        t.setAttribute('aria-selected', bu ? 'true' : 'false');
        t.classList.toggle('aktif', bu);
        /* gezici tabindex: seçili olan tek durak */
        t.tabIndex = bu ? 0 : -1;
        if (!panoDegisir) return;
        var pano = document.getElementById(t.getAttribute('aria-controls'));
        if (pano) { if (bu) pano.removeAttribute('hidden'); else pano.setAttribute('hidden', ''); }
      });
      if (odakla) sekme.focus();
    }

    var aktif = sekmeler.filter(function (t) {
      return t.getAttribute('aria-selected') === 'true';
    })[0] || sekmeler[0];
    sec(aktif, false);

    sekmeler.forEach(function (sekme, i) {
      sekme.addEventListener('click', function () { sec(sekme, false); });
      sekme.addEventListener('keydown', function (e) {
        var y = -1;
        if (e.key === 'ArrowRight') y = (i + 1) % sekmeler.length;
        else if (e.key === 'ArrowLeft') y = (i - 1 + sekmeler.length) % sekmeler.length;
        else if (e.key === 'Home') y = 0;
        else if (e.key === 'End') y = sekmeler.length - 1;
        else return;
        e.preventDefault();
        sec(sekmeler[y], true);
      });
    });
  });

})();
