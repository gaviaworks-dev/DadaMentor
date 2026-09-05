/* =====================================================================
   g-mutfak-defterim — PARTİ 2 · AJAN A
   Süzgeç · arama · sayfalama · "Yeni not yaz".
   YALNIZ bu sayfadan yüklenir. Hiçbir metin/sayı üretmez: bütün
   değerler sayfanın KENDİ kartlarından okunur.
   ===================================================================== */
(function () {
  'use strict';

  var SAYFA = { 'lst-grid': 6, 'pufl-grid': 4 };

  function esc(v) { var d = document.createElement('div'); d.textContent = v == null ? '' : String(v); return d.innerHTML; }
  function kucuk(t) { return String(t || '').toLocaleLowerCase('tr'); }

  /* ── SAYFALAMA NOTUNUN BİRİMİ · sekmenin KENDİ nesne adı ────────
     L1'in şartı "listeleyen her yüzeyde AYNI KİP"; kaynağın kendi kipi
     jenerik "kayıt" değil NESNE ADI kullanıyor. Ağaçta ÖLÇÜLDÜ
     (dokunulmamış yüzeyler): "717 üyeden 1-24 arası gösteriliyor",
     "765 terimden 1-54 arası gösteriliyor",
     "1561 püf noktasından 1-12 arası gösteriliyor".
     Kalıbın ŞEKLİ ortak, BİRİM sayfanın nesnesinden geliyor.
     Karışık tür taşıyan sekmede (tarif + püf) "içerikten" kullanılır.
     🔴 GERİ DÜŞÜŞ "kayıttan" DEĞİL: sözlükte olmayan bir pano için
     jenerik birime düşmek, düzeltilen kusuru sessizce geri getirirdi. */
  var BIRIM = {
    'tariflerim':     'tariften',
    'puf':            'püf noktasından',
    'taslaklarim':    'taslaktan',
    'incelemede':     'içerikten',
    'yayinda':        'içerikten',
    'denediklerim':   'tariften',
    'kaydettiklerim': 'tariften',
    'notlarim':       'nottan'
  };
  function birimBul(el) {
    var pane = el && el.closest ? el.closest('[id^="mutfak-defterim-pane-"]') : null;
    var ad = pane ? pane.id.replace('mutfak-defterim-pane-', '') : '';
    return BIRIM[ad] || 'içerikten';
  }

  /* ── SÜZGEÇ + ARAMA + SAYFALAMA ─────────────────────────────── */
  function kur(arac) {
    var izgara = document.getElementById(arac.getAttribute('data-hedef'));
    if (!izgara) return;
    var kartlar = [].slice.call(izgara.querySelectorAll('[data-p2a="rkart"]'));
    if (!kartlar.length) return;
    var boyut = SAYFA[izgara.classList.contains('pufl-grid') ? 'pufl-grid' : 'lst-grid'];
    var pagi = document.querySelector('nav.pagi[data-hedef="' + arac.getAttribute('data-hedef') + '"]');
    var birim = birimBul(izgara);
    var durum = { ara: '', kategori: '', durum: '', ay: '', sayfa: 1 };

    var bos = document.createElement('div');
    bos.className = 'dk-bos';
    bos.hidden = true;
    bos.innerHTML = '<i class="fa-solid fa-filter-circle-xmark" aria-hidden="true"></i>' +
      '<b>Bu süzgeçle kayıt yok</b><p>Arama ya da süzgeç seçimini değiştir.</p>';
    izgara.appendChild(bos);

    function gecer(k) {
      if (durum.ara && kucuk(k.getAttribute('data-ad')).indexOf(durum.ara) < 0) return false;
      if (durum.kategori && k.getAttribute('data-kategori') !== durum.kategori) return false;
      if (durum.durum && k.getAttribute('data-durum') !== durum.durum) return false;
      if (durum.ay && k.getAttribute('data-ay') !== durum.ay) return false;
      return true;
    }

    /* Donörün sayfalama markup'ı — tarifler.html:2690 · not kalıbı
       "<toplam> <nesne adı>den <a>–<b> arası gösteriliyor".
       🔴 BU ŞERH ÖNCE YANLIŞTI: puf-noktalari.html'in notunu
       "N kayıttan a–b" diye yazmıştım; sayfanın gerçek metni
       "1561 püf noktasından 1–12 arası gösteriliyor". Yanlış okunan
       donör, jenerik birimi beş sayfalama bloğuna birden taşıdı. */
    function pagiCiz(toplam, sayfa, sayfaSayisi, ilk, son) {
      if (!pagi) return;
      if (!toplam) { pagi.innerHTML = ''; return; }
      var h = '';
      function ok(ikon, etiket, hedef, kapali) {
        return kapali
          ? '<span class="pg arrow" disabled aria-hidden="true"><i class="' + ikon + '" aria-hidden="true"></i></span>'
          : '<button class="pg arrow" type="button" data-sayfa="' + hedef + '" aria-label="' + etiket + '"><i class="' + ikon + '" aria-hidden="true"></i></button>';
      }
      h += ok('fa-solid fa-angles-left', 'İlk sayfa', 1, sayfa === 1);
      h += ok('fa-solid fa-chevron-left', 'Önceki sayfa', sayfa - 1, sayfa === 1);
      var goster = [];
      for (var i = 1; i <= sayfaSayisi; i++)
        if (i === 1 || i === sayfaSayisi || Math.abs(i - sayfa) <= 1) goster.push(i);
      var onceki = 0;
      goster.forEach(function (i) {
        if (onceki && i - onceki > 1) h += '<span class="pg-dots" aria-hidden="true">…</span>';
        h += (i === sayfa)
          ? '<span class="pg active" aria-current="page">' + i + '</span>'
          : '<button class="pg" type="button" data-sayfa="' + i + '">' + i + '</button>';
        onceki = i;
      });
      h += ok('fa-solid fa-chevron-right', 'Sonraki sayfa', sayfa + 1, sayfa === sayfaSayisi);
      h += ok('fa-solid fa-angles-right', 'Son sayfa', sayfaSayisi, sayfa === sayfaSayisi);
      h += '<span class="pagi-note">' + toplam + ' ' + birim + ' ' + ilk + '–' + son + ' arası gösteriliyor</span>';
      pagi.innerHTML = h;
      pagi.querySelectorAll('[data-sayfa]').forEach(function (b) {
        b.addEventListener('click', function () { durum.sayfa = Number(b.getAttribute('data-sayfa')); ciz(); });
      });
    }

    function ciz() {
      var uygun = kartlar.filter(gecer);
      var sayfaSayisi = Math.max(1, Math.ceil(uygun.length / boyut));
      if (durum.sayfa > sayfaSayisi) durum.sayfa = sayfaSayisi;
      var bas = (durum.sayfa - 1) * boyut;
      kartlar.forEach(function (k) { k.hidden = true; });
      uygun.slice(bas, bas + boyut).forEach(function (k) { k.hidden = false; });
      bos.hidden = uygun.length > 0;
      pagiCiz(uygun.length, durum.sayfa, sayfaSayisi, uygun.length ? bas + 1 : 0,
              Math.min(bas + boyut, uygun.length));
    }

    /* araç çubuğu */
    var ara = arac.querySelector('[data-alan="ara"]');
    if (ara) {
      var z;
      ara.addEventListener('input', function () {
        clearTimeout(z);
        z = setTimeout(function () { durum.ara = kucuk(ara.value.trim()); durum.sayfa = 1; ciz(); }, 200);
      });
    }
    arac.querySelectorAll('select[data-alan]').forEach(function (s) {
      s.addEventListener('change', function () { durum[s.getAttribute('data-alan')] = s.value; durum.sayfa = 1; ciz(); });
    });

    /* VAR OLAN `.cipler` çipleri — silinmedi, bağlandı.
       Eşleşme kartların KENDİ değerleriyle; eşleşmeyen çip dokunulmaz. */
    var pane = izgara.closest('.fit-pane') || document;
    var cipKap = pane.querySelector('.cipler');
    var cipler = cipKap ? [].slice.call(cipKap.querySelectorAll('.cip.suzgec')) : [];
    var alanlar = ['kategori', 'durum'];
    function cipAlani(etiket) {
      for (var i = 0; i < alanlar.length; i++) {
        var a = alanlar[i];
        for (var j = 0; j < kartlar.length; j++)
          if (kartlar[j].getAttribute('data-' + a) === etiket) return a;
      }
      return null;
    }
    cipler.forEach(function (c) {
      var etiket = c.textContent.trim().replace(/\s+\d+$/, '');
      var tumu = /^tümü$/i.test(etiket);
      var alan = tumu ? null : cipAlani(etiket);
      if (!tumu && !alan) return;                  /* eşleşmeyen çip DOKUNULMAZ */
      c.addEventListener('click', function () {
        if (tumu) { durum.kategori = ''; durum.durum = ''; }
        else { durum[alan] = (durum[alan] === etiket) ? '' : etiket; }
        durum.sayfa = 1;
        cipler.forEach(function (o) {
          var e = o.textContent.trim().replace(/\s+\d+$/, '');
          var t = /^tümü$/i.test(e);
          var a = t ? null : cipAlani(e);
          var aktif = t ? (!durum.kategori && !durum.durum) : (a && durum[a] === e);
          o.classList.toggle('aktif', !!aktif);
          o.setAttribute('aria-pressed', aktif ? 'true' : 'false');
        });
        ciz();
      });
    });

    var sifirla = arac.querySelector('.dk-sifirla');
    if (sifirla) sifirla.addEventListener('click', function () {
      durum = { ara: '', kategori: '', durum: '', ay: '', sayfa: 1 };
      if (ara) ara.value = '';
      arac.querySelectorAll('select[data-alan]').forEach(function (s) { s.value = ''; });
      cipler.forEach(function (o, i) {
        o.classList.toggle('aktif', i === 0);
        o.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      });
      ciz();
    });

    ciz();
  }

  document.querySelectorAll('.dk-arac[data-hedef]').forEach(kur);

  /* ── YENİ NOT ────────────────────────────────────────────────
     Sayfa DEĞİŞMEZ: düzenleyici listenin başında açılır, kaydedilen
     not listenin BAŞINA girer. Markup kanonun kendi bileşenlerinden
     (`.kart` · `.alan-girdi` · `.alan-metin` · `.durum-hapi`) ve
     var olan bir not kartının KLONUNDAN kurulur. */
  (function () {
    var dugme = document.querySelector('[data-p2a="not-ekle"]');
    var liste = document.getElementById('dk-not-liste');
    if (!dugme || !liste) return;
    var ornek = liste.querySelector('.kart[data-p2a="not"]');
    if (!ornek) return;

    /* Bağlanabilir tarifler — sayfanın KENDİ verisinden (notların bağlı
       olduğu tarifler + "Tariflerin tek listede" ızgarası) */
    function tarifler() {
      var m = {};
      document.querySelectorAll('#dk-grid-tariflerim [data-p2a="rkart"] h4 a').forEach(function (a) {
        m[a.textContent.trim()] = a.getAttribute('href');
      });
      liste.querySelectorAll('.dk-not-bag[href]').forEach(function (a) {
        m[a.textContent.trim()] = a.getAttribute('href');
      });
      return m;
    }

    function aylar(d) {
      var A = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
      return d.getDate() + ' ' + A[d.getMonth()] + ' ' + d.getFullYear();
    }

    function kapat(k) { k.remove(); dugme.hidden = false; dugme.focus(); }

    dugme.addEventListener('click', function () {
      if (liste.querySelector('.dk-not-yeni')) return;
      var tr = tarifler();
      var d = document.createElement('div');
      d.className = 'kart dk-not-yeni';
      d.innerHTML =
        '<div class="kart-bas"><h3><i class="fa-solid fa-note-sticky" aria-hidden="true"></i> Yeni not</h3></div>' +
        '<div class="kart-govde">' +
          '<div class="alan"><label class="alan-etiket" for="dkNotBaslik">Not başlığı</label>' +
          '<input class="alan-girdi" id="dkNotBaslik" type="text" placeholder="Kısa bir başlık"></div>' +
          '<div class="alan"><label class="alan-etiket" for="dkNotMetin">Not</label>' +
          '<textarea class="alan-metin" id="dkNotMetin" placeholder="Kendine yazdığın not"></textarea></div>' +
          '<div class="alan"><label class="alan-etiket" for="dkNotTarif">Tarife bağla</label>' +
          '<select class="alan-secim" id="dkNotTarif"><option value="">Bağlı tarif yok</option>' +
          Object.keys(tr).sort(function (a, b) { return a.localeCompare(b, 'tr'); })
            .map(function (t) { return '<option value="' + esc(tr[t]) + '">' + esc(t) + '</option>'; }).join('') +
          '</select></div>' +
        '</div>' +
        '<div class="kart-alt"><span class="not"><i class="fa-solid fa-lock" aria-hidden="true"></i> Yalnız sana görünür</span>' +
        '<button class="dugme hayalet kucuk" type="button" data-vazgec>Vazgeç</button>' +
        '<button class="dugme birincil kucuk" type="button" data-kaydet><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Notu kaydet</button></div>';
      liste.insertBefore(d, liste.firstChild);
      dugme.hidden = true;
      d.querySelector('#dkNotBaslik').focus();
      d.querySelector('[data-vazgec]').addEventListener('click', function () { kapat(d); });
      d.querySelector('[data-kaydet]').addEventListener('click', function () {
        var bas = d.querySelector('#dkNotBaslik').value.trim();
        var met = d.querySelector('#dkNotMetin').value.trim();
        var sel = d.querySelector('#dkNotTarif');
        var url = sel.value, ad = sel.options[sel.selectedIndex].textContent;
        if (!bas || !met) {
          d.querySelector(bas ? '#dkNotMetin' : '#dkNotBaslik').classList.add('hatali');
          d.querySelector(bas ? '#dkNotMetin' : '#dkNotBaslik').focus();
          return;
        }
        var y = ornek.cloneNode(true);                 /* MARKUP KLONLANIR */
        y.querySelector('.kart-bas h3').innerHTML =
          '<i class="fa-solid fa-note-sticky" aria-hidden="true"></i> ' + esc(bas);
        var hap = y.querySelector('.durum-hapi');
        if (hap) {
          hap.className = 'durum-hapi kucuk-ikonlu ' + (url ? 'acik' : 'bekleyen');
          hap.textContent = url ? 'Tarife bağlı' : 'Serbest not';
        }
        y.querySelector('.kart-govde p').textContent = met;
        var kunye = y.querySelector('.ozet-kunye');
        kunye.innerHTML = '<span><b>' + esc(aylar(new Date())) + '</b></span>' +
          (url ? '<span><a class="dk-not-bag" href="' + esc(url) + '">' + esc(ad) + '</a> tarifine bağlı</span>'
               : '<span><b>Bağlı tarif yok</b></span>');
        y.setAttribute('data-p2a', 'not');
        liste.insertBefore(y, liste.firstChild);
        kapat(d);
        y.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  })();
})();
