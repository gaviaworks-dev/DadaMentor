/* ══════════════════════════════════════════════════════════════════════
   DadaDiet · PROFİL MODÜL EKRANLARI — sekme sürücüsü ve pano eylemleri
   ----------------------------------------------------------------------
   KURULUM BAYRAĞI SORUSU (kanon dersi, 2026-09-03): kabuğun kendi sekme
   sürücüsü `#hsRay` + `.hesap-bolme[role="tabpanel"]` çiftine bakıyor ve
   ilk satırında `if(!ray) return;` diyor. Bu hat O ADLARI KULLANMAZ —
   modül kipi `nav[data-sekme-grup]` + `.fit-pane[data-pane]`. İki sürücü
   aynı düğmeye hiç dokunmuyor; "çift anahtar" tuzağı doğmuyor.

   🔴 SINIF İLE ARIA BİRLİKTE güncellenir (erişilebilirlik tabanı) ve
      gizleme `hidden` NİTELİĞİYLE yapılır — kanonun `[hidden]` kuralı
      dosya sonunda TEK YETKİLİ, ikinci bir gizleme kuralı yazılmaz.

   ── FAZ 3 (2026-09-05) · ALTI MEKANİZMA ───────────────────────────────
   Ölçüldü (`scripts/olcum/b-diet-eylem.mjs`, ilk koşu): 166 öznenin
   123'ü ÖLÜYDÜ — tıklanınca DOM'da hiçbir şey değişmiyordu. Markup
   taşınmış, davranış kalmamıştı. Yapı ölçümü bunu görmez; işlem ADININ
   sayfada geçmesi yeterli sanılır.

   Sürücü ALTI mekanizmaya indirgendi; her düğme bunlardan birine bağlı:

     1 · PANEL      `data-ac="ID"` / `data-kapat`
     2 · AKORDEON   `.akordeon-bas[aria-controls]` — grupta TEK açık kalem
     3 · İŞARET     `data-isaret` (aria-pressed) · `data-isaret-grup`
     4 · ONAY       `data-onay-ac="ID"` → onay kutusu → `data-onay-uygula`
     5 · KAYIT      `data-gonder="ID"` → gerçek satır ekler / durum yazar
     6 · GERİ AL    her yıkıcı ve her ekleyen işlem `.geri-al` bırakır

   🔴 GERİ ALMA ZORUNLU: kanon §15'in şerhi *"hiçbir şey sessizce
      kaybolmaz"* diyor. Bir işlem DOM'u değiştiriyorsa geri alınabilir
      olmalı; sınama da tam bunu ölçüyor (boz → yakalandı → geri al).

   ⚠ BACKEND YOK. Hiçbir şey sunucuya gitmez; "gönderildi" satırları
     ekranın kendi geri bildirimidir — donörün (`deneme/hesabim.html`)
     kendi şerhi de aynısını söylüyor.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── yardımcılar ──────────────────────────────────────────────────── */
  function hepsi(sec, kok) { return [].slice.call((kok || document).querySelectorAll(sec)); }
  function yakin(el, sec) { return el && el.closest ? el.closest(sec) : null; }

  /* 🔴 BOŞ SEÇİCİ ATAR. `querySelector('')` SyntaxError verir; niteliği
     olmayan bir düğmede `getAttribute(...) || ''` deseni tam bunu üretir
     ve dinleyicinin geri kalanını düşürür — düğme ölü GÖRÜNÜR, oysa
     kod var. Ölçüldü: 21 düğme, 21 SyntaxError, tek kök. */
  function sec1(deger) { return deger ? document.querySelector(deger) : null; }

  /* Metinden eleman kurar — `innerHTML` yerine, çünkü içerik kullanıcıdan
     gelebiliyor (not metni, dosya adı). Kaçış tek yerde yapılır. */
  function kac(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ══ 0 · ROL KAPISI — doküman şerhi bir KOŞULdur ═════════════════
     `Nihai Profil Menüsü.pdf`: *"Diyetisyenim — hizmet alanlara özel."*
     KOPYALAMA-KURALI · EKSİ İKİNCİ MADDE: şerh bir açıklama değil, bir
     KOŞUL. Rolü olmayan kullanıcı kabı GÖRMEZ.

     🔴 NEDEN JS — ölçüldü, 2026-09-05. Önceki tur "görünürlüğü CSS
        yürütür" diye yazmıştı ve markup'a kapıyı koymuştu; ama bu hatta
        `[data-roles~="hizmet"]` seçicisi kabukta da kanonda da sayfada
        da YOK (üçünde de `grep` 0). FIT'in tek rol kuralı `isletme`
        içindir. Yani rol düşünce hiçbir şey olmuyordu ve şerh doğru
        sanıldığı için kimse sınamamıştı — "bağlanmamış" kip.
        Kanona kural önerildi (rapor); bu hat kuralı JS'le yürütüyor.
     ⚠ Gizleme `hidden` NİTELİĞİYLE — kanonun `[hidden]` kuralı tek
       yetkili, sayfaya ikinci bir gizleme kuralı yazılmaz.
     ⚠ `data-roles` ÇALIŞMA ANINDA da değişebilir (kabuk betiği oturumu
       geç yazıyor). Gözlemci olmadan kapı yalnız ilk boyamada doğru
       olurdu — ve olumsuz sınama bunu göremezdi. */
  var panoTazele = null;               // sekme sürücüsü kurulunca dolar

  function rolVarMi(rol) {
    return (' ' + (document.body.getAttribute('data-roles') || '') + ' ')
      .indexOf(' ' + rol + ' ') >= 0;
  }

  function rolTazele() {
    hepsi('[data-rol-kapi]').forEach(function (el) {
      el.hidden = rolVarMi(el.getAttribute('data-rol-kapi'));
    });
    var eksik = hepsi('[data-rol-gerek]').filter(function (el) {
      return !rolVarMi(el.getAttribute('data-rol-gerek'));
    });
    eksik.forEach(function (el) { el.hidden = true; });
    if (eksik.length) return;
    /* Rol GERİ GELDİĞİNDE panoları tek tek açmak yanlış olurdu —
       hepsi birden görünürdü. Sekme sürücüsü yeniden uygulanır ki
       yalnız AKTİF pano açılsın. */
    hepsi('[data-rol-gerek].sekme-ray').forEach(function (el) { el.hidden = false; });
    if (panoTazele) panoTazele();
  }
  if (document.querySelector('[data-rol-gerek], [data-rol-kapi]')) {
    rolTazele();
    new MutationObserver(rolTazele).observe(document.body,
      { attributes: true, attributeFilter: ['data-roles'] });
  }

  /* ══ 1 · SEKME RAYI ═══════════════════════════════════════════════ */
  var raylar = hepsi('nav[data-sekme-grup]');

  raylar.forEach(function (ray) {
    var sekmeler = hepsi('.sekme[role="tab"]', ray);
    var panolar = sekmeler.map(function (s) {
      return document.getElementById(s.getAttribute('aria-controls'));
    });

    function ac(i, odakla) {
      if (i < 0 || i >= sekmeler.length) return;
      sekmeler.forEach(function (s, k) {
        var etkin = k === i;
        s.classList.toggle('aktif', etkin);
        s.setAttribute('aria-selected', etkin ? 'true' : 'false');
        s.tabIndex = etkin ? 0 : -1;
      });
      panolar.forEach(function (p, k) {
        if (!p) return;
        /* Rol kapısı KAZANIR: rolü olmayan kullanıcıda pano sekme
           sürücüsü yüzünden açılmaz. */
        var rol = p.getAttribute('data-rol-gerek');
        p.hidden = (k !== i) || (rol && !rolVarMi(rol));
      });
      if (odakla) sekmeler[i].focus();
    }

    function indeks(ad) {
      for (var i = 0; i < sekmeler.length; i++) {
        if (sekmeler[i].getAttribute('data-tab') === ad) return i;
      }
      return -1;
    }

    sekmeler.forEach(function (s, i) {
      s.addEventListener('click', function () {
        ac(i, false);
        try { history.replaceState(null, '', '#' + s.getAttribute('data-tab')); } catch (_) {}
      });
      s.addEventListener('keydown', function (e) {
        var k = e.key, y = -1, n = sekmeler.length;
        if (k === 'ArrowRight' || k === 'ArrowDown') y = (i + 1) % n;
        else if (k === 'ArrowLeft' || k === 'ArrowUp') y = (i - 1 + n) % n;
        else if (k === 'Home') y = 0;
        else if (k === 'End') y = n - 1;
        if (y < 0) return;
        e.preventDefault();
        ac(y, true);
        try { history.replaceState(null, '', '#' + sekmeler[y].getAttribute('data-tab')); } catch (_) {}
      });
    });

    /* Pano içinden sekmeye gönderen bağlantılar — "Alternatife geç" gibi.
       Kendi rayına ait olmayan adı görmezden gelir; iki ray aynı sayfada
       yaşayabilsin diye indeks HER RAYDA ayrı çözülür. */
    document.addEventListener('click', function (e) {
      var a = yakin(e.target, '[data-sekme-git]');
      if (!a) return;
      var i = indeks(a.getAttribute('data-sekme-git'));
      if (i < 0) return;
      e.preventDefault();
      ac(i, false);
      ray.scrollIntoView({ block: 'start' });
      try { history.replaceState(null, '', '#' + a.getAttribute('data-sekme-git')); } catch (_) {}
    });

    var basAd = (location.hash || '').replace(/^#/, '');
    var bas = basAd ? indeks(basAd) : -1;
    ac(bas < 0 ? 0 : bas, false);

    /* Rol kapısı panoları kapattıysa, rol geri gelince AKTİF panoyu
       yeniden açacak olan çengel budur. */
    panoTazele = function () {
      for (var i = 0; i < sekmeler.length; i++) {
        if (sekmeler[i].classList.contains('aktif')) { ac(i, false); return; }
      }
      ac(0, false);
    };
  });

  /* ══ 2 · PANEL — `data-ac="ID"` / `data-kapat` ════════════════════
     Kart markup'ta DURUYOR ve `hidden`; düğme yalnız niteliği kaldırır.
     Markup'ı JS'in basması hâlinde kanonun kuralları ilk boyamada
     eşleşmez (kaynakta ölçülmüş kip).
     Açan düğme `aria-expanded` taşır ve panel kapanınca odak DÜĞMEYE
     döner — kaynağın modal sözleşmesindeki "odağın açan düğmeye dönüşü"
     kuralının panel karşılığı. */
  var acan = null;

  document.addEventListener('click', function (e) {
    var d = yakin(e.target, '[data-ac]');
    if (d) {
      var kart = document.getElementById(d.getAttribute('data-ac'));
      if (!kart) return;
      e.preventDefault();
      kart.hidden = false;
      acan = d;
      if (d.hasAttribute('aria-expanded')) d.setAttribute('aria-expanded', 'true');
      /* Satırın bağlamı panele TAŞINIR — "Kahvaltı satırındaki Besin
         ekle"ye basıp panelde "Akşam" görmek sessiz bir yanlıştır. */
      var onAyar = d.getAttribute('data-ac-secim');
      if (onAyar) {
        var sec = kart.querySelector('select[data-on-ayar]');
        if (sec) {
          [].forEach.call(sec.options, function (o, i) {
            if (o.textContent.trim() === onAyar) sec.selectedIndex = i;
          });
        }
      }
      var ilk = kart.querySelector('select, textarea, input:not([type=hidden]), button');
      if (ilk) ilk.focus();
      kart.scrollIntoView({ block: 'nearest' });
      return;
    }
    var k = yakin(e.target, '[data-kapat]');
    if (k) {
      var hedef = k.getAttribute('data-kapat');
      var kap = hedef ? document.getElementById(hedef) : yakin(k, '.kart[id]');
      if (!kap) return;
      e.preventDefault();
      kap.hidden = true;
      hepsi('[data-ac="' + kap.id + '"]').forEach(function (b) {
        if (b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded', 'false');
      });
      if (acan) { try { acan.focus(); } catch (_) {} acan = null; }
    }
  });

  /* ══ 2b · AYRINTI — tablo satırı ve kart içi katlanır alan ════════
     Donörün kipi (`fit-egzersizlerim` · `.fpx-perf-ac`): düğme
     `aria-expanded` + `aria-controls` taşır, alan `hidden` durur.
     `.akordeon` kullanılamayan yerde (tablo `<tr>` içi) aynı sözleşme
     bu mekanizmayla kurulur; `data-ayrinti-grup` verilirse grupta TEK
     açık kalem kuralı burada da işler — kural bileşenin değil, GRUBUN
     kuralıdır (kanon §21 şerhi: "bütün ekranlarda geçerli"). */
  document.addEventListener('click', function (e) {
    var d = yakin(e.target, '[data-ayrinti]');
    if (!d) return;
    e.preventDefault();
    var alan = document.getElementById(d.getAttribute('data-ayrinti'));
    if (!alan) return;
    var acikti = d.getAttribute('aria-expanded') === 'true';
    var grup = d.getAttribute('data-ayrinti-grup');
    if (grup) {
      hepsi('[data-ayrinti-grup="' + grup + '"]').forEach(function (o) {
        o.setAttribute('aria-expanded', 'false');
        var a = document.getElementById(o.getAttribute('data-ayrinti'));
        if (a) a.hidden = true;
      });
    }
    d.setAttribute('aria-expanded', acikti ? 'false' : 'true');
    alan.hidden = acikti;
  });

  /* ══ 3 · AKORDEON — kanon §21, TEK AÇIK KALEM ═════════════════════
     🔴 Sözleşme hem `.acik` sınıfını hem `aria-expanded`i kapsar; ikisi
        BİRLİKTE güncellenir. Açık kaleme tekrar basmak kapatır ("hepsi
        kapalı" geçerli bir hâldir).
     Yükseklik kanonda YAZILMAZ (içerik uzunluğu bilinemez); JS ölçülen
     `scrollHeight`i yazar — kanon §21'in kendi şerhi böyle diyor. */
  hepsi('.akordeon').forEach(function (grup) {
    var kalemler = hepsi('.akordeon-kalem', grup);

    function kapa(kalem) {
      var bas = kalem.querySelector('.akordeon-bas');
      var govde = kalem.querySelector('.akordeon-govde');
      kalem.classList.remove('acik');
      if (bas) bas.setAttribute('aria-expanded', 'false');
      if (govde) govde.style.maxHeight = '';
    }

    function acKalem(kalem) {
      var bas = kalem.querySelector('.akordeon-bas');
      var govde = kalem.querySelector('.akordeon-govde');
      kalem.classList.add('acik');
      if (bas) bas.setAttribute('aria-expanded', 'true');
      if (govde) govde.style.maxHeight = govde.scrollHeight + 'px';
    }

    kalemler.forEach(function (kalem) {
      var bas = kalem.querySelector('.akordeon-bas');
      if (!bas) return;
      bas.addEventListener('click', function () {
        var acikMiydi = kalem.classList.contains('acik');
        kalemler.forEach(kapa);
        if (!acikMiydi) acKalem(kalem);
      });
    });
  });

  /* ══ 4 · İŞARET — `data-isaret` (aria-pressed) ════════════════════
     `data-isaret-grup` verilmişse grupta TEK seçili kalır (radyo kipi);
     verilmemişse serbest aç/kapa. `data-isaret-hap` bir durum hapı
     kimliği ise o hapın metni ve sınıfı da güncellenir — durum İKİ
     yerde birden görünür, biri ekran okuyucunun (aria-pressed), biri
     gözün (hap). */
  function hapYaz(el, metin, sinif) {
    if (!el) return;
    el.className = 'durum-hapi' + (sinif ? ' ' + sinif : '');
    el.innerHTML = '<i class="fa-solid ' +
      (sinif === 'cozulen' ? 'fa-circle-check' : 'fa-circle-half-stroke') +
      '" aria-hidden="true"></i> ' + kac(metin);
  }

  /* Tek kalemin hâlini yazar — GRUP KURALI BURADA DEĞİL.
     🔴 Ayrım şart: "varsayılana dön" radyo kipinde `click()` ile geri
     alınamaz (basılı kaleme basmak onu bırakmaz). Durum yazımı ile grup
     kuralı ayrılmazsa sıfırlama sessizce yarım kalır — ölçüldü. */
  function isaretYaz(b, basili) {
    b.setAttribute('aria-pressed', basili ? 'true' : 'false');
    b.classList.toggle('aktif', basili);
    var metin = b.getAttribute(basili ? 'data-isaret-metin-acik' : 'data-isaret-metin-kapali');
    if (metin && b.lastChild) b.lastChild.textContent = ' ' + metin;
    var hap = document.getElementById(b.getAttribute('data-isaret-hap') || '');
    if (hap) {
      hapYaz(hap, b.getAttribute(basili ? 'data-isaret-hap-acik' : 'data-isaret-hap-kapali') ||
        (basili ? 'Seçildi' : 'Seçili değil'), basili ? 'cozulen' : '');
    }
  }

  document.addEventListener('click', function (e) {
    var b = yakin(e.target, '[data-isaret]');
    if (!b) return;
    e.preventDefault();
    var grupAd = b.getAttribute('data-isaret-grup');
    var basili = b.getAttribute('aria-pressed') === 'true';
    if (grupAd) {
      hepsi('[data-isaret-grup="' + grupAd + '"]').forEach(function (o) { isaretYaz(o, false); });
    }
    isaretYaz(b, grupAd ? true : !basili);
    sayaclariTazele(yakin(b, '.kart'));
  });

  /* Onay kutusuyla işaretlenen satırlar (öğün listesi) — sayaç ve
     "kalan" bilgisi satırların GERÇEK hâlinden okunur, sabit yazılmaz. */
  function sayaclariTazele(kart) {
    if (!kart) return;
    var sayac = kart.querySelector('[data-sayac-kutu]');
    if (!sayac) return;
    var kutular = hepsi('[data-sayac-kalem] input[type=checkbox]', kart);
    var isaretli = kutular.filter(function (i) { return i.checked; }).length;
    hapYaz(sayac, isaretli + ' / ' + kutular.length + ' tamamlandı',
      isaretli === kutular.length ? 'cozulen' : 'bekleyen');
  }

  hepsi('[data-sayac-kalem] input[type=checkbox]').forEach(function (kutu) {
    kutu.addEventListener('change', function () {
      var satir = yakin(kutu, '[data-sayac-kalem]');
      var hap = satir && satir.querySelector('.durum-hapi');
      if (hap) hapYaz(hap, kutu.checked ? 'Tamamlandı' : 'Bekliyor', kutu.checked ? 'cozulen' : '');
      sayaclariTazele(yakin(kutu, '.kart'));
    });
  });
  hepsi('[data-sayac-kutu]').forEach(function (s) { sayaclariTazele(yakin(s, '.kart')); });

  /* ══ 5 · ONAY KAPISI — kanon §39 ══════════════════════════════════
     Onay kutusu işaretlenmeden gönder düğmesi `disabled` durur ve sebebi
     `.durum-satir.kapali` ile YAZIYLA söylenir. Kapı açıldığında kutu ve
     sebep her seferinde SIFIRLANIR — bir önceki onayın işareti yeni
     işlemi sessizce onaylamasın. */
  hepsi('.onay-kapisi').forEach(function (kapi) {
    var kutu = kapi.querySelector('.onay-kutusu input[type=checkbox]');
    var gonder = kapi.querySelector('[data-onay-uygula]');
    var sebep = kapi.querySelector('.durum-satir.kapali');
    if (!kutu || !gonder) return;
    function tazele() {
      gonder.disabled = !kutu.checked;
      if (sebep) sebep.hidden = kutu.checked;
    }
    kutu.addEventListener('change', tazele);
    tazele();
  });

  /* Kapıyı açan düğme — kapıyı taşıyan kartı gösterir ve kutuyu sıfırlar. */
  document.addEventListener('click', function (e) {
    var d = yakin(e.target, '[data-onay-ac]');
    if (!d) return;
    var kart = document.getElementById(d.getAttribute('data-onay-ac'));
    if (!kart) return;
    e.preventDefault();
    var kutu = kart.querySelector('.onay-kutusu input[type=checkbox]');
    if (kutu) { kutu.checked = false; kutu.dispatchEvent(new Event('change')); }
    /* Kapı hangi satır için açıldı — düğmenin kendi satırı hedeftir. */
    var satir = yakin(d, '[data-satir]');
    kart.setAttribute('data-hedef-satir', satir ? satir.getAttribute('data-satir') : '');
    var ozetMetni = d.getAttribute('data-onay-ozet') ||
      (satir ? satir.getAttribute('data-satir-ad') : '') || '';
    var ozet = kart.querySelector('[data-onay-ozet]');
    if (ozet && ozetMetni) ozet.textContent = ozetMetni;
    kart.setAttribute('data-hedef-ozet', ozetMetni);
    kart.hidden = false;
    acan = d;
    kart.scrollIntoView({ block: 'nearest' });
    var ilk = kart.querySelector('.onay-kutusu input');
    if (ilk) ilk.focus();
  });

  /* ══ 6 · UYGULA + GERİ AL ═════════════════════════════════════════
     `data-onay-uygula` bir İŞ TÜRÜ yazar; sürücü onu DOM üzerinde
     gerçekten uygular ve `.geri-al` şeridi bırakır. Şeritteki düğme
     eski hâli AYNEN geri koyar (satırın önceki `outerHTML`i saklanır) —
     "geri alınabilir" bir söz değil, ölçülebilir bir davranıştır. */
  function geriAlSeridi(kap, metin, geriFn) {
    var eski = kap.querySelector('.geri-al');
    if (eski) eski.remove();
    var serit = document.createElement('div');
    serit.className = 'geri-al';
    serit.setAttribute('role', 'status');
    serit.innerHTML = '<span>' + kac(metin) + '</span>' +
      '<button type="button" data-geri-al>Geri al</button>';
    kap.insertBefore(serit, kap.firstChild);
    serit.querySelector('[data-geri-al]').addEventListener('click', function () {
      geriFn();
      serit.remove();
    });
    return serit;
  }

  function durumYaz(satir, metin, sinif) {
    var hap = satir.querySelector('.durum-hapi');
    if (hap) hapYaz(hap, metin, sinif);
  }

  document.addEventListener('click', function (e) {
    var d = yakin(e.target, '[data-onay-uygula]');
    if (!d || d.disabled) return;
    e.preventDefault();
    var kart = yakin(d, '.kart[id]');
    var is = d.getAttribute('data-onay-uygula');          // geri-cek | kaldir | iptal | duraklat | toplu | disari
    var hedefAd = kart ? kart.getAttribute('data-hedef-satir') : '';
    var listeSec = d.getAttribute('data-onay-liste');      // toplu işlemde kapsam
    var yeniDurum = d.getAttribute('data-onay-durum') || 'Geri çekildi';
    var kayitSec = d.getAttribute('data-onay-kayit');      // erişim geçmişine satır yazacak liste

    var satirlar = [];
    if (listeSec) satirlar = hepsi(listeSec + ' [data-satir]');
    else if (hedefAd) satirlar = hepsi('[data-satir="' + hedefAd + '"]');

    var yedek = satirlar.map(function (s) { return { el: s, html: s.outerHTML, ebeveyn: s.parentNode, sonra: s.nextSibling }; });

    /* 🔴 SATIRA YALNIZ `data-onay-durum` VARSA DOKUNULUR. İndirme ve
       paylaşma satırın kendi durumunu (Gelen/Giden) DEĞİŞTİRMEZ; ilk
       yazımda her onay satırı "Geri çekildi" yapıyordu ve dosya kutusunda
       "Gelen" hapı indirince siliniyordu. */
    /* Anahtar kapatma — satır değil ANAHTAR hedefi. §4.5'in kapanış
       şartının gerçek karşılığı: kapatınca hepsi kapanır. */
    var anahtarKap = sec1(d.getAttribute('data-onay-anahtar'));
    var anahtarYedek = null;
    if (anahtarKap) {
      var kutular = hepsi('input[type=checkbox]', anahtarKap);
      anahtarYedek = kutular.map(function (k) { return { el: k, isaretli: k.checked }; });
      kutular.forEach(function (k) { k.checked = false; });
    }

    if (is === 'kaldir') {
      satirlar.forEach(function (s) { s.remove(); });
    } else if (d.hasAttribute('data-onay-durum')) {
      satirlar.forEach(function (s) { durumYaz(s, yeniDurum, d.getAttribute('data-onay-sinif') || 'hata'); });
    }

    /* Erişim geçmişi gerçekten yazılır — "izni geri çektim" cümlesi
       ekranın başka bir yerinde de doğrulanabilir olmalı. */
    var kayitSatiri = null;
    if (kayitSec) {
      var liste = sec1(kayitSec);
      if (liste) {
        kayitSatiri = document.createElement('div');
        kayitSatiri.className = 'kalem-satiri';
        kayitSatiri.innerHTML =
          '<span class="ks-ikon" aria-hidden="true"><i class="fa-solid fa-clock-rotate-left"></i></span>' +
          '<div class="ks-metin"><b>' +
          kac((kart && kart.getAttribute('data-hedef-ozet')) ||
              d.getAttribute('data-onay-kayit-baslik') || 'İşlem kaydı') +
          '</b><span>' + kac(bugun()) + ' · bu tarayıcıdan, senin isteğinle</span></div>' +
          '<div class="ks-uc"><span class="durum-hapi hata">Kayıt</span></div>';
        liste.insertBefore(kayitSatiri, liste.firstChild);
      }
    }

    if (kart) kart.hidden = true;
    var kap = (satirlar[0] && yakin(satirlar[0], '.kart-govde')) ||
              (kart && kart.parentNode) || document.querySelector('.modul-govde');
    geriAlSeridi(kap, d.getAttribute('data-onay-mesaj') || 'İşlem uygulandı.', function () {
      yedek.forEach(function (y) {
        if (is === 'kaldir') {
          var yer = document.createElement('div');
          yer.innerHTML = y.html;
          y.ebeveyn.insertBefore(yer.firstElementChild, y.sonra);
        } else {
          var yer2 = document.createElement('div');
          yer2.innerHTML = y.html;
          y.el.parentNode.replaceChild(yer2.firstElementChild, y.el);
        }
      });
      if (kayitSatiri) kayitSatiri.remove();
      if (anahtarYedek) anahtarYedek.forEach(function (k) { k.el.checked = k.isaretli; });
    });
  });

  function bugun() {
    var aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz',
                 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    var t = new Date();
    return t.getDate() + ' ' + aylar[t.getMonth()] + ' ' + t.getFullYear();
  }

  /* ══ 7 · KAYIT / EKLEME — `data-gonder` ═══════════════════════════
     Panelin alanları okunur, listeye GERÇEK bir satır eklenir, panel
     kapanır, `.kaydedildi` rozeti belirir ve `.geri-al` şeridi satırı
     kaldırabilir. Zorunlu alan boşsa `.alan-hata.goster` yazılır ve
     ekleme YAPILMAZ — "gönderdim" yalanı doğmasın. */
  document.addEventListener('click', function (e) {
    var d = yakin(e.target, '[data-gonder]');
    if (!d) return;
    e.preventDefault();
    /* 🔴 `.kart[id]` ARANMAZ. Form her zaman açılır bir panelde değil;
       "Bugüne not ekle" kartı sayfada AÇIK duruyor ve id'si yoktu —
       `.kart[id]` arayan ilk yazım o düğmeyi sessizce ölü bıraktı
       (ölçüldü: `b-diet-eylem` · gunluk-takibim/not). */
    var panel = yakin(d, '.kart');
    if (!panel) return;

    var zorunlu = hepsi('[data-zorunlu]', panel);
    var eksik = zorunlu.filter(function (a) { return !String(a.value || '').trim(); });
    hepsi('.alan-hata', panel).forEach(function (h) { h.classList.remove('goster'); });
    hepsi('.alan-girdi', panel).forEach(function (g) { g.classList.remove('hatali'); });
    if (eksik.length) {
      eksik.forEach(function (a) {
        a.classList.add('hatali');
        var alan = yakin(a, '.alan');
        var hata = alan && alan.querySelector('.alan-hata');
        if (hata) hata.classList.add('goster');
      });
      eksik[0].focus();
      return;
    }

    var liste = sec1(d.getAttribute('data-gonder'));
    var yeniSatir = null;
    if (liste) {
      var baslikAlan = panel.querySelector('[data-satir-baslik]');
      var altAlan = panel.querySelector('[data-satir-alt]');
      var baslik = baslikAlan ? (baslikAlan.value || baslikAlan.getAttribute('placeholder') || '') : '';
      var alt = altAlan ? (altAlan.value || '') : '';
      if (baslikAlan && baslikAlan.tagName === 'SELECT') {
        baslik = baslikAlan.options[baslikAlan.selectedIndex].textContent;
      }
      yeniSatir = document.createElement('div');
      yeniSatir.className = 'kalem-satiri';
      yeniSatir.setAttribute('data-satir', 'yeni-' + Date.now());
      yeniSatir.innerHTML =
        '<span class="ks-ikon" aria-hidden="true"><i class="fa-solid ' +
        kac(d.getAttribute('data-satir-ikon') || 'fa-circle-plus') + '"></i></span>' +
        '<div class="ks-metin"><b>' + kac(baslik.trim() || 'Yeni kayıt') + '</b>' +
        '<span>' + kac(bugun() + (alt ? ' · ' + alt.trim().slice(0, 160) : '')) + '</span></div>' +
        '<div class="ks-uc"><span class="durum-hapi bekleyen">' +
        kac(d.getAttribute('data-satir-durum') || 'Yeni') + '</span></div>';
      liste.insertBefore(yeniSatir, liste.firstChild);
    }

    /* Yalnız AÇILIR panel kapanır; sayfada sabit duran form kapanmaz. */
    var acanlar = panel.id ? hepsi('[data-ac="' + panel.id + '"]') : [];
    if (acanlar.length) {
      panel.hidden = true;
      acanlar.forEach(function (b) {
        if (b.hasAttribute('aria-expanded')) b.setAttribute('aria-expanded', 'false');
      });
    } else {
      /* Sabit formda alanlar temizlenir — aynı not iki kez gönderilmesin. */
      hepsi('[data-satir-alt], [data-zorunlu]', panel).forEach(function (a) {
        if (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT') a.value = '';
      });
    }

    var rozet = document.getElementById(d.getAttribute('data-kaydedildi') || '');
    if (rozet) {
      rozet.classList.add('gorunur');
      setTimeout(function () { rozet.classList.remove('gorunur'); }, 4000);
    }

    if (liste && yeniSatir) {
      geriAlSeridi(yakin(liste, '.kart-govde') || liste.parentNode,
        d.getAttribute('data-gonder-mesaj') || 'Kayıt eklendi.', function () {
          yeniSatir.remove();
        });
    }
    if (acan) { try { acan.focus(); } catch (_) {} acan = null; }
  });

  /* ══ 7b · TOPLU İŞARET / SIFIRLAMA / ÖZET YAZMA ═══════════════════
     Üçü de aynı sözleşmeye uyar: DOM'un GERÇEK hâlini okur, gerçekten
     değiştirir, `.geri-al` bırakır. Hiçbiri sabit metin basmaz — sayılar
     satırlardan sayılır, seçimler `aria-pressed`ten okunur. */

  document.addEventListener('click', function (e) {
    var d = yakin(e.target, '[data-toplu-isaret]');
    if (!d) return;
    e.preventDefault();
    var liste = sec1(d.getAttribute('data-toplu-isaret'));
    if (!liste) return;
    var kutular = hepsi('[data-sayac-kalem] input[type=checkbox]', liste);
    var yedek = kutular.map(function (k) { return k.checked; });
    var degisen = 0;
    kutular.forEach(function (k) {
      if (!k.checked) { k.checked = true; degisen++; k.dispatchEvent(new Event('change')); }
    });
    if (!degisen) return;
    geriAlSeridi(yakin(liste, '.kart-govde') || liste,
      degisen + ' öğün tamamlandı olarak işaretlendi.', function () {
        kutular.forEach(function (k, i) {
          if (k.checked !== yedek[i]) { k.checked = yedek[i]; k.dispatchEvent(new Event('change')); }
        });
      });
  });

  /* Grubun MARKUP'TAKİ varsayılanı kurulumda saklanır; "varsayılana dön"
     o hâli geri koyar. Sabit bir dizin yazılmaz — hangi kalemin
     varsayılan olduğunu markup söyler. */
  var isaretVarsayilan = {};
  hepsi('[data-isaret-grup]').forEach(function (b) {
    var g = b.getAttribute('data-isaret-grup');
    if (!isaretVarsayilan[g]) isaretVarsayilan[g] = [];
    isaretVarsayilan[g].push({ el: b, basili: b.getAttribute('aria-pressed') === 'true' });
  });

  document.addEventListener('click', function (e) {
    var d = yakin(e.target, '[data-sifirla-grup]');
    if (!d) return;
    e.preventDefault();
    var kalemler = [];
    d.getAttribute('data-sifirla-grup').split(/\s+/).forEach(function (g) {
      (isaretVarsayilan[g] || []).forEach(function (k) { kalemler.push(k); });
    });
    /* Geri alma için ŞU ANKİ hâl saklanır; varsayılan zaten kurulumda
       saklandı. İkisi de aynı listeden okunur, sıra karışamaz. */
    var simdi = kalemler.map(function (k) { return k.el.getAttribute('aria-pressed') === 'true'; });
    var fark = 0;
    kalemler.forEach(function (k, i) { if (simdi[i] !== k.basili) fark++; });
    var kap = yakin(d, '.kart-govde') || yakin(d, '.kart') || d.parentNode;
    /* 🔴 DEĞİŞİKLİK YOKSA DA KONUŞ. Sessiz kalan düğme ölü düğmeden
       ayırt edilemez; kullanıcı da "bastım, bir şey olmadı" der. */
    if (!fark) {
      var eskiSerit = kap.querySelector('.geri-al');
      if (eskiSerit) eskiSerit.remove();
      var bilgi = document.createElement('div');
      bilgi.className = 'geri-al';
      bilgi.setAttribute('role', 'status');
      bilgi.innerHTML = '<span>Zaten varsayılan durumdasın — değişen bir seçim yok.</span>' +
        '<button type="button" data-geri-al>Tamam</button>';
      kap.insertBefore(bilgi, kap.firstChild);
      bilgi.querySelector('[data-geri-al]').addEventListener('click', function () { bilgi.remove(); });
      return;
    }
    kalemler.forEach(function (k, i) { if (simdi[i] !== k.basili) isaretYaz(k.el, k.basili); });
    geriAlSeridi(kap, 'Seçimler varsayılana döndürüldü (' + fark + ' değişiklik).', function () {
      kalemler.forEach(function (k, i) {
        if ((k.el.getAttribute('aria-pressed') === 'true') !== simdi[i]) isaretYaz(k.el, simdi[i]);
      });
    });
  });

  document.addEventListener('click', function (e) {
    var d = yakin(e.target, '[data-ozet-yaz]');
    if (!d) return;
    e.preventDefault();
    var hedef = sec1(d.getAttribute('data-ozet-yaz'));
    var kapsam = sec1(d.getAttribute('data-ozet-kapsam')) || document;
    if (!hedef) return;
    var secili = hepsi('[data-isaret][aria-pressed="true"]', kapsam);
    var eskiHtml = hedef.innerHTML, eskiGizli = hedef.hidden;
    if (!secili.length) {
      hedef.hidden = false;
      hedef.innerHTML = '<div class="durum-satir kapali"><i class="fa-solid fa-circle-info" ' +
        'aria-hidden="true"></i> Henüz bir alternatif seçmedin — seçtiğin an burada listelenir.</div>';
      return;
    }
    hedef.hidden = false;
    hedef.innerHTML = secili.map(function (s) {
      return '<div class="durum-satir tamam"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> ' +
        kac(s.getAttribute('data-ozet-metin') || s.textContent.trim()) + '</div>';
    }).join('') +
      '<div class="durum-satir"><i class="fa-regular fa-clock" aria-hidden="true"></i> ' +
      kac(bugun()) + ' · ' + secili.length + ' değişiklik günün planına yazıldı.</div>';
    var rozet = document.getElementById(d.getAttribute('data-kaydedildi') || '');
    if (rozet) {
      rozet.classList.add('gorunur');
      setTimeout(function () { rozet.classList.remove('gorunur'); }, 4000);
    }
    geriAlSeridi(yakin(hedef, '.kart-govde') || hedef.parentNode,
      secili.length + ' seçim güne uygulandı.', function () {
        hedef.innerHTML = eskiHtml; hedef.hidden = eskiGizli;
      });
  });

  /* ── YAZDIRMA — tarayıcının kendi eylemi ────────────────────────────
     Prototipte dosya üretilmez; düğme yazdırma kutusunu açar ve NE
     yazdırıldığını ekrana da yazar. `print()` bazı ortamlarda engelli
     olabildiği için sarmalanır: engellense de ekrandaki kayıt düşer,
     yani düğme her hâlde bir iş yapar. */
  document.addEventListener('click', function (e) {
    var d = yakin(e.target, '[data-yazdir]');
    if (!d) return;
    e.preventDefault();
    var panel = yakin(d, '.kart[id]');
    var not = document.createElement('div');
    not.className = 'durum-satir tamam';
    not.innerHTML = '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> ' +
      kac(bugun()) + ' · yazdırma kutusu açıldı.';
    if (panel) {
      var govde = panel.querySelector('.kart-govde');
      if (govde) govde.appendChild(not);
    }
    try { window.print(); } catch (_) {}
  });

  /* ══ 7c · ALAN FORMU — kaydet / değişiklikleri geri al ═════════════
     Form MARKUP'TAKİ değerleriyle kurulur ve ilk hâl saklanır; "geri al"
     o hâli geri koyar, "kaydet" GERÇEK değerleri ekrana yazar. İkisi de
     ölçülebilir: DOM değişir, geri alınır. */
  var alanIlk = new WeakMap();
  hepsi('[data-alan-kaydet], [data-alan-sifirla]').forEach(function (d) {
    var form = sec1(d.getAttribute('data-alan-kaydet') || d.getAttribute('data-alan-sifirla'));
    if (!form || alanIlk.has(form)) return;
    alanIlk.set(form, hepsi('input, select, textarea', form).map(function (a) {
      return { el: a, deger: a.value, isaretli: a.checked };
    }));
  });

  document.addEventListener('click', function (e) {
    var d = yakin(e.target, '[data-alan-sifirla]');
    if (!d) return;
    e.preventDefault();
    var form = sec1(d.getAttribute('data-alan-sifirla'));
    var ilk = form && alanIlk.get(form);
    if (!ilk) return;
    var simdi = ilk.map(function (k) { return { deger: k.el.value, isaretli: k.el.checked }; });
    var fark = 0;
    ilk.forEach(function (k, i) {
      if (simdi[i].deger !== k.deger || simdi[i].isaretli !== k.isaretli) fark++;
    });
    var kap = yakin(d, '.kart') || form;
    if (!fark) {
      var e0 = kap.querySelector('.geri-al');
      if (e0) e0.remove();
      var bilgi = document.createElement('div');
      bilgi.className = 'geri-al';
      bilgi.setAttribute('role', 'status');
      bilgi.innerHTML = '<span>Kaydedilmemiş bir değişiklik yok.</span>' +
        '<button type="button">Tamam</button>';
      kap.insertBefore(bilgi, kap.firstChild);
      bilgi.querySelector('button').addEventListener('click', function () { bilgi.remove(); });
      return;
    }
    ilk.forEach(function (k) { k.el.value = k.deger; k.el.checked = k.isaretli; });
    geriAlSeridi(kap, fark + ' alan ilk hâline döndürüldü.', function () {
      ilk.forEach(function (k, i) { k.el.value = simdi[i].deger; k.el.checked = simdi[i].isaretli; });
    });
  });

  document.addEventListener('click', function (e) {
    var d = yakin(e.target, '[data-alan-kaydet]');
    if (!d) return;
    e.preventDefault();
    var form = sec1(d.getAttribute('data-alan-kaydet'));
    var hedef = sec1(d.getAttribute('data-ozet-hedef'));
    if (!form || !hedef) return;
    var eskiHtml = hedef.innerHTML, eskiGizli = hedef.hidden;
    var kaynak = hepsi('.alan', form);
    if (!kaynak.length) {
      /* Anahtar formu (`.ayar-satir` + `.anahtar`): açık/kapalı hâl
         yazıyla da söylenir — anahtarın görsel hâli tek tanık kalmasın. */
      var satirlarA = hepsi('.ayar-satir', form).map(function (a) {
        var ad = a.querySelector('.as-metin b');
        var kutu = a.querySelector('input[type=checkbox]');
        if (!ad || !kutu) return '';
        return '<div class="durum-satir ' + (kutu.checked ? 'tamam' : 'kapali') + '">' +
          '<i class="fa-solid ' + (kutu.checked ? 'fa-circle-check' : 'fa-lock') + '" aria-hidden="true"></i> ' +
          kac(ad.textContent.trim()) + ': <b>' + (kutu.checked ? 'paylaşılıyor' : 'kapalı') + '</b></div>';
      }).filter(Boolean);
      hedef.hidden = false;
      hedef.innerHTML = satirlarA.join('') +
        '<div class="durum-satir"><i class="fa-regular fa-clock" aria-hidden="true"></i> ' +
        kac(bugun()) + ' · izinler kaydedildi. Kapalı türleri hiçbir diyetisyen göremez.</div>';
      var rozetA = document.getElementById(d.getAttribute('data-kaydedildi') || '');
      if (rozetA) {
        rozetA.classList.add('gorunur');
        setTimeout(function () { rozetA.classList.remove('gorunur'); }, 4000);
      }
      geriAlSeridi(yakin(hedef, '.kart-govde') || hedef.parentNode, 'İzinler kaydedildi.', function () {
        hedef.innerHTML = eskiHtml; hedef.hidden = eskiGizli;
      });
      return;
    }
    var satirlar = kaynak.map(function (a) {
      var etiket = a.querySelector('.alan-etiket');
      var girdi = a.querySelector('input, select, textarea');
      if (!etiket || !girdi) return '';
      var deger = girdi.tagName === 'SELECT'
        ? girdi.options[girdi.selectedIndex].textContent : girdi.value;
      return '<div class="durum-satir tamam"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> ' +
        kac(etiket.textContent.replace('*', '').trim()) + ': <b>' + kac(deger) + '</b></div>';
    }).filter(Boolean);
    hedef.hidden = false;
    hedef.innerHTML = satirlar.join('') +
      '<div class="durum-satir"><i class="fa-regular fa-clock" aria-hidden="true"></i> ' +
      kac(bugun()) + ' · profil güncellendi. Program ve öğün önerileri bu değerlere göre süzülür.</div>';
    var rozet = document.getElementById(d.getAttribute('data-kaydedildi') || '');
    if (rozet) {
      rozet.classList.add('gorunur');
      setTimeout(function () { rozet.classList.remove('gorunur'); }, 4000);
    }
    geriAlSeridi(yakin(hedef, '.kart-govde') || hedef.parentNode, 'Profil güncellendi.', function () {
      hedef.innerHTML = eskiHtml; hedef.hidden = eskiGizli;
    });
  });

  /* ══ 8 · SU TAKİBİ — bardak sayacı ═══════════════════════════════
     Hedef ve alınan miktar markup'ta yazılı; betik yalnız artırıp azaltır
     ve §46 ölçerini günceller. Değer uydurmaz, markup'takini okur. */
  var suKap = document.getElementById('gtSu');
  if (suKap) {
    var olcer = suKap.querySelector('.olcer > span');
    var sayiEl = suKap.querySelector('[data-su-sayi]');
    var toplamEl = suKap.querySelector('[data-su-toplam]');
    var hedef = parseInt(suKap.getAttribute('data-hedef'), 10) || 10;
    var ml = parseInt(suKap.getAttribute('data-bardak-ml'), 10) || 250;
    var tazele = function (n) {
      var yuzde = Math.min(100, Math.round((n / hedef) * 100));
      if (olcer) olcer.style.width = yuzde + '%';
      if (sayiEl) sayiEl.textContent = n + ' / ' + hedef;
      if (toplamEl) toplamEl.textContent = ((n * ml) / 1000).toFixed(2).replace('.', ',') + ' L';
      var o = suKap.querySelector('.olcer');
      if (o) o.setAttribute('aria-label', 'Su hedefi: yüzde ' + yuzde);
      [].forEach.call(suKap.querySelectorAll('[data-bardak]'), function (b, i) {
        b.classList.toggle('aktif', i < n);
        b.setAttribute('aria-pressed', i < n ? 'true' : 'false');
      });
    };
    suKap.addEventListener('click', function (e) {
      var b = yakin(e.target, '[data-bardak]');
      if (b) {
        var i = parseInt(b.getAttribute('data-bardak'), 10);
        var suan = suKap.querySelectorAll('[data-bardak].aktif').length;
        tazele(i + 1 === suan ? i : i + 1);
        return;
      }
      if (yakin(e.target, '[data-su-ekle]')) {
        tazele(Math.min(hedef, suKap.querySelectorAll('[data-bardak].aktif').length + 1));
      }
    });
    tazele(suKap.querySelectorAll('[data-bardak].aktif').length);
  }

  /* ══ 9 · SOHBET — §62 yazışma panosu ══════════════════════════════
     Gönder gerçekten balon basar; boş metinde basmaz. Kişi değişince
     akış O KİŞİNİN kabına geçer (üç kap da markup'ta duruyor). */
  hepsi('[data-sohbet]').forEach(function (pano) {
    var kisiler = hepsi('.sohbet-kisi', pano);
    var akislar = hepsi('[data-sohbet-akis]', pano);
    var yaz = pano.querySelector('.sohbet-yaz textarea, .sohbet-yaz input[type=text]');
    var gonder = pano.querySelector('[data-sohbet-gonder]');
    var uyari = pano.querySelector('[data-sohbet-uyari]');

    kisiler.forEach(function (k) {
      k.addEventListener('click', function () {
        kisiler.forEach(function (o) {
          o.classList.remove('secili');
          o.setAttribute('aria-pressed', 'false');
        });
        k.classList.add('secili');
        k.setAttribute('aria-pressed', 'true');
        /* Yazışmayı açmak onu OKUNMUŞ yapar — okunmamış beneği söner.
           Seçili kişiye tekrar basmak da bu işi yapar; "hiçbir şey
           olmuyor" hâli kalmaz. */
        var benek = k.querySelector('.sohbet-nokta');
        if (benek) benek.hidden = true;
        var ad = k.getAttribute('data-kisi');
        akislar.forEach(function (a) { a.hidden = a.getAttribute('data-sohbet-akis') !== ad; });
        var bas = pano.querySelector('[data-sohbet-bas-ad]');
        if (bas) bas.textContent = k.getAttribute('data-kisi-ad') || bas.textContent;
      });
    });

    if (gonder && yaz) {
      gonder.addEventListener('click', function () {
        var metin = String(yaz.value || '').trim();
        if (!metin) {
          if (uyari) uyari.hidden = false;
          yaz.focus();
          return;
        }
        if (uyari) uyari.hidden = true;
        var akis = akislar.filter(function (a) { return !a.hidden; })[0] || akislar[0];
        if (!akis) return;
        var balon = document.createElement('div');
        balon.className = 'sohbet-balon uye';
        balon.innerHTML = '<p>' + kac(metin) + '</p>' +
          '<span class="sohbet-kunye">' + kac(saat()) + ' · <span class="sohbet-mono">Gönderildi</span></span>';
        akis.appendChild(balon);
        akis.scrollTop = akis.scrollHeight;
        yaz.value = '';
      });
    }
  });

  function saat() {
    var t = new Date();
    return ('0' + t.getHours()).slice(-2) + ':' + ('0' + t.getMinutes()).slice(-2);
  }
})();
