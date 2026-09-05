/* ═══════════════════════════════════════════════════════════════════════
   ADMIN UI KİTİ · DAVRANIŞ — dört markanın ORTAK panel davranışı
   ───────────────────────────────────────────────────────────────────────
   Tarih: 2026-09-04 · FIT admin revize · parti 1
   Kural belgesi: `docs/admin-ui-kit.md`

   Kapsam — bu dosya YALNIZ kitin getirdiği yeni davranışları taşır:
       · menü katlama (durum `localStorage`da)
       · toast (kaydet / sil / yayınla sonrası)
       · silme onayı (onay kapısı)
       · satır işlemleri (düzenle · sil · sabitle · pasif)
       · görsel önizleme + kırpma çerçevesi
       · alan altı doğrulama

   🔴 MEVCUT DAVRANIŞA DOKUNULMADI. Açılırlar, sekme rayı, toplu işlem,
      sıralama ve marka ayarları `_ortak/panel.js`te yaşıyor ve orada
      kalıyor. İki dosya AYRI olaylara bağlanır; ortak hedefe iki
      dinleyici bağlanan tek yer satır işlemleridir ve orada bu dosya
      `.satir-islem` ile kapsanmıştır — panel.js o adı hiç görmüyor.

   ⚠ Betik FORM GÖNDERMEZ. Maket kilidi: hiçbir eylem sunucuya gitmez,
     "kaydedildi" bir görsel geri bildirimdir ve öyle olduğu toast
     metninde YAZILIDIR ("maket").
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KOK = document.body;
  if (!KOK || !KOK.classList.contains('yetkili')) return;

  /* ───────────────────────────────────────────────────────────────────
     1 · MENÜ KATLAMA — durum `localStorage`da
     ─────────────────────────────────────────────────────────────────── */
  var ANAHTAR = 'dm-admin-menu-katli';

  function katliMi() {
    try { return localStorage.getItem(ANAHTAR) === '1'; } catch (e) { return false; }
  }
  function katlamaYaz(v) {
    try { localStorage.setItem(ANAHTAR, v ? '1' : '0'); } catch (e) { /* özel pencere */ }
  }
  function katlamaUygula(v) {
    KOK.classList.toggle('panel-katli', v);
    var d = document.querySelector('.panel-katla');
    if (d) {
      /* `aria-pressed` — çentik bir aç/kapa düğmesi; menü gizlenmiyor,
         daralıyor. `aria-expanded` kabuğun açılır sözleşmesine düşüyor
         ve menüyü `hidden` yapıyordu (bkz. enjektör şerhi). */
      d.setAttribute('aria-pressed', String(v));
      d.removeAttribute('aria-expanded');
      d.removeAttribute('aria-controls');
      d.setAttribute('aria-label', v ? 'Menüyü genişlet' : 'Menüyü daralt');
      var i = d.querySelector('i');
      if (i) i.className = v ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left';
    }
  }
  /* 🔴 Durum SAYFA AÇILIRKEN uygulanır, tıklamada değil. Yoksa katlı
     kip her gezinmede bir kare açık çiziliyor ve menü "zıplıyor". */
  katlamaUygula(katliMi());

  document.addEventListener('click', function (e) {
    var d = e.target.closest('.panel-katla');
    if (!d) return;
    e.preventDefault();
    var yeni = !KOK.classList.contains('panel-katli');
    katlamaUygula(yeni);
    katlamaYaz(yeni);
  });

  /* Dar kipte menü kalemi ipucu taşır — metin görünmediği için ad
     BAŞKA bir yerden okunmalı. Kaynağı kalemin kendi metni. */
  document.querySelectorAll('.panel-menu-link').forEach(function (a) {
    if (a.hasAttribute('data-ipucu')) return;
    var s = a.querySelector('.sayac');
    var ad = (a.textContent || '').replace(s ? s.textContent : '', '').trim();
    if (ad) a.setAttribute('data-ipucu', ad);
  });
  /* Ray ikonları ipucunu `title`dan devralır — `title` gecikmeli ve
     biçimsiz; kitin kendi ipucu yüzeyi anında ve tokenli. */
  document.querySelectorAll('.panel-ray-ikon[title], .panel-ray-imza[title]').forEach(function (a) {
    if (!a.hasAttribute('data-ipucu')) a.setAttribute('data-ipucu', a.getAttribute('title'));
  });

  /* ── 1a · AKTİF MARKA ÇİPİ · `body[data-marka]`dan ────────────────
     2026-09-05 · madde 1. Ray üç markada BAYT-ÖZDEŞ olmak zorunda;
     aktif kalem markup'ta işaretlenirse bu imkânsız. İşareti kit kurar.
     ⚠ `aria-current` da birlikte döner: görsel çip ile ekran okuyucunun
       duyduğu şey tek yazıcıdan geçer (§22'nin ray karşılığı). Markup
       hiçbir markada `aktif` taşımadığı için "iki kalem birden aktif"
       hâli doğamaz. */
  (function () {
    var marka = document.body.getAttribute('data-marka');
    var kalemler = document.querySelectorAll('.panel-ray-ikon[data-eko]');
    if (!marka || !kalemler.length) return;
    kalemler.forEach(function (a) {
      var bu = a.getAttribute('data-eko') === marka;
      a.classList.toggle('aktif', bu);
      if (bu) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  })();

  /* ───────────────────────────────────────────────────────────────────
     1b · SAYFA BAŞI TAŞMA MENÜSÜ — "•••"
     ───────────────────────────────────────────────────────────────────
     Beyar kuralı: *"Butonlar ASLA ikinci satıra düşmez. Sığmıyorsa
     birincil buton kalır, ikincil butonlar ••• taşma menüsüne girer
     (1280 altında otomatik). Sığıyor mu ÖLÇ, ölçmeden karar verme."*

     🔴 KARAR ÖLÇÜMLE VERİLİYOR. Kırılım noktası tek başına yetmez: aynı
        genişlikte üç kısa düğme sığar, iki uzun düğme sığmaz — sığma
        METİN UZUNLUĞUNA bağlı, ekrana değil. (Kanonun §75c şerhinde
        kayıtlı: "ayrım ekranın kararı değil, düğme metinlerinin
        UZUNLUĞU".) O yüzden gerçek genişlikler ölçülüyor; 1280 yalnız
        bir ALT SINIR olarak ayrıca uygulanıyor.
     🔴 BİRİNCİL DÜĞME MENÜYE İNMEZ. Sayfanın ana eylemi her zaman
        görünür kalır.
     ⚠ Düğmeler SİLİNMEZ, TAŞINIR — ve şerit sığdığında geri döner.
       Taşıma tersine çevrilebilir olmasaydı pencere büyütüldüğünde
       eylemler menüde hapis kalırdı. */
  function tasmaKur(bas) {
    var serit = bas.querySelector(':scope > .eylem-satiri');
    if (!serit) return;
    var tasma = serit.querySelector(':scope > .eylem-tasma');
    if (!tasma) {
      tasma = document.createElement('div');
      tasma.className = 'eylem-tasma';
      tasma.hidden = true;
      var yid = 'tasma-' + Math.random().toString(36).slice(2, 7);
      tasma.innerHTML =
        '<button type="button" class="ikon-dugme" aria-haspopup="true" aria-expanded="false"' +
        ' aria-controls="' + yid + '" aria-label="Diğer eylemler" title="Diğer eylemler">' +
        '<i class="fa-solid fa-ellipsis" aria-hidden="true"></i></button>' +
        '<div class="eylem-tasma-yuzey" id="' + yid + '" hidden></div>';
      serit.appendChild(tasma);
    }
    var yuzey = tasma.querySelector('.eylem-tasma-yuzey');

    /* 1 · her ölçümden önce hepsini şeride geri al — ölçüm TEMİZ hâlde
           yapılmalı, yoksa menüye inen düğme bir daha asla dönmez. */
    while (yuzey.firstChild) serit.insertBefore(yuzey.firstChild, tasma);
    tasma.hidden = true;

    var adaylar = [].slice.call(serit.children).filter(function (el) {
      return el !== tasma && !el.classList.contains('birincil');
    });
    if (!adaylar.length) return;

    /* 2 · sığıyor mu — şeridin gerçek genişliği kabın payını aşıyor mu */
    function tasiyorMu() {
      var solW = bas.firstElementChild ? bas.firstElementChild.getBoundingClientRect().width : 0;
      var bosluk = parseFloat(getComputedStyle(bas).columnGap) || 0;
      return serit.scrollWidth > (bas.clientWidth - solW - bosluk) + 1;
    }
    var dar = window.innerWidth < 1280;

    /* 3 · sondan başa doğru indir; birincil hiç dokunulmaz. */
    var i = adaylar.length - 1;
    while ((dar || tasiyorMu()) && i >= 0) {
      tasma.hidden = false;
      yuzey.insertBefore(adaylar[i], yuzey.firstChild);
      i--;
      if (!dar && !tasiyorMu()) break;
    }
    if (!yuzey.children.length) tasma.hidden = true;
  }

  /* ───────────────────────────────────────────────────────────────────
     1c · K33 · SÜZGEÇ ŞERİDİ TAŞMA MENÜSÜ — "•••"
     ───────────────────────────────────────────────────────────────────
     2026-09-05 · revize turu madde 5. Beyar kuralı: *"süzgeç satırı
     sarmalar (sabit aralık), Kolonlar/Dışa aktar sağda sabit genişlik,
     sayaç en sağda; 8+ süzgeçte 'Daha fazla' taşma menüsü."*

     ÖLÇÜLDÜ (`rk-suzgec.mjs` · 131 ekran · 209 şerit · üç marka):
                            @1280        @1440
       TAŞAN süzgeç          5            2
       ÖRTÜŞEN               0            0
       8+ süzgeçli şerit     1            1     (gastro admin-tarifler, 9)
       çok satırlı şerit     0            0
       açılır kayık          0            0

     🔴 K22 İLE ÇELİŞMİYOR, ONU TAMAMLIYOR. K22 (parti 3) geniş ekranda
        şeridi `flex-wrap:nowrap` yapıyor ve sığdırma yükünü ARAMA
        KUTUSUNA veriyor. O karar 8 süzgeçe kadar tutuyor; dokuzuncuda
        arama kutusu tabanına (200px) dayanıyor ve şerit TAŞIYOR.
        Sarmayı geri açmak K22'nin çözdüğü "satır ziyanı"nı geri
        getirirdi. Taşan süzgeçler menüye iner: satır tek kalır,
        hiçbir denetim kaybolmaz.

     🔴 SAYAÇ VE `.sag` GRUBU MENÜYE İNMEZ — §1b'nin "birincil düğme
        inmez" kuralının süzgeç karşılığı. Kolonlar/Dışa aktar bir
        SÜZGEÇ değil, şeridin sabit sağ ucudur; sayaç da bir denetim
        değil, sonucun kendisi. İnen yalnız süzgeç denetimleridir.

     ⚠ ÖLÇÜM ÖNCE TEMİZ HÂLDE: her tazelemede menüdekiler şeride geri
       alınır. Yoksa pencere büyütülünce süzgeçler menüde HAPİS kalır
       (§1b'nin kayıtlı dersi).
     ⚠ 8+ EŞİĞİ TEK BAŞINA ÖLÇÜT DEĞİL: 6 uzun etiketli süzgeç de
       taşabilir. Ölçüt GERÇEK TAŞMA; 8+ ayrıca bir alt sınır olarak
       uygulanır (§1b'nin 1280 alt sınırıyla aynı desen).              */
  function suzgecTasmaKur(serit) {
    var tasma = serit.querySelector(':scope > .suzgec-tasma');
    if (!tasma) {
      tasma = document.createElement('div');
      tasma.className = 'suzgec-tasma';
      tasma.hidden = true;
      var yid = 'suztasma-' + Math.random().toString(36).slice(2, 7);
      tasma.innerHTML =
        '<button type="button" class="suzgec-dugme" aria-haspopup="true" aria-expanded="false"' +
        ' aria-controls="' + yid + '" aria-label="Daha fazla süzgeç" title="Daha fazla süzgeç">' +
        '<i class="fa-solid fa-ellipsis" aria-hidden="true"></i>' +
        '<span class="sayi" data-sayi=""></span></button>' +
        '<div class="acilir-yuzey suzgec-tasma-yuzey" id="' + yid + '" role="group"' +
        ' aria-label="Daha fazla süzgeç" hidden></div>';
      /* `.sag` grubundan ÖNCE durur — sağ uç sabit kalır. */
      var sag = serit.querySelector(':scope > .sag');
      if (sag) serit.insertBefore(tasma, sag); else serit.appendChild(tasma);
    }
    var yuzey = tasma.querySelector('.suzgec-tasma-yuzey');

    /* 1 · temiz hâle dön */
    while (yuzey.firstChild) serit.insertBefore(yuzey.firstChild, tasma);
    tasma.hidden = true;

    /* 2 · adaylar: yalnız SÜZGEÇ denetimleri. Arama kutusu (daralabilir),
           `.sag` grubu ve sayaç dışarıda. */
    var adaylar = [].slice.call(serit.children).filter(function (el) {
      if (el === tasma) return false;
      if (el.classList.contains('sag') || el.classList.contains('suzgec-sayac')) return false;
      if (el.querySelector && el.querySelector('input[type="search"]')) return false;
      if (el.matches && el.matches('input[type="search"], .panel-arama, .arama-kutu, label')) return false;
      return !!(el.classList.contains('suzgec-dugme') || el.classList.contains('alan-secim') ||
                el.tagName === 'SELECT' || el.querySelector('.suzgec-dugme, .alan-secim, select'));
    });
    if (!adaylar.length) return;

    function tasiyorMu() {
      var s = getComputedStyle(serit);
      var ic = serit.clientWidth - (parseFloat(s.paddingLeft) || 0) - (parseFloat(s.paddingRight) || 0);
      return serit.scrollWidth > serit.clientWidth + 1 ||
             [].slice.call(serit.children).some(function (e) {
               var r = e.getBoundingClientRect(), cr = serit.getBoundingClientRect();
               return r.width > 0 && (r.right > cr.right - (parseFloat(s.paddingRight) || 0) + 1);
             }) || ic < 0;
    }
    /* 8+ alt sınırı: dokuzuncudan itibaren fazlası zaten menüye iner. */
    var esik = 8;

    var i = adaylar.length - 1;
    while (i >= 0 && (tasiyorMu() || adaylar.length - yuzey.children.length > esik)) {
      tasma.hidden = false;
      yuzey.insertBefore(adaylar[i], yuzey.firstChild);
      i--;
    }
    if (!yuzey.children.length) { tasma.hidden = true; return; }
    var sayi = tasma.querySelector('.sayi');
    if (sayi) sayi.setAttribute('data-sayi', String(yuzey.children.length));
  }

  /* ───────────────────────────────────────────────────────────────────
     1d · K36 · ŞERİTTE ETİKET ÜSTTE YOK — süzgeç KENDİ ADINI SÖYLER
     ───────────────────────────────────────────────────────────────────
     2026-09-05 · madde 5-EK. Beyar: *"süzgeç şeridinde etiket üstte YOK,
     her süzgeç kit çip-dropdown'u (ilk seçenek etiket görevi:
     'Tür: Tümü'), arama kutusuyla aynı satır ve aynı yükseklik."*

     ÖLÇÜLDÜ (`rk-suzgec-hiza.mjs` · 131 ekran · üç marka): K35'ten
     sonra geriye TEK ekran kaldı — `admin-rehber`:
         görünür etiket   "Tür"        (kardeşlerinde 0)
         select üst kenarı y620        · şeridin çoğunluğu y607
     Kardeş ekranların 43'ünde süzgeç etiketsiz bir çip-dropdown
     ("Durum ⌄"); burada adsız bir `<div>` içinde `<label>` + `<select>`
     duruyor ve etiket akışta yer kaplayıp select'i 13px aşağı itiyor.

     🔴 ETİKET SİLİNMEZ, İNDİRİLİR. `display:none` erişilebilirliği
        kırardı: select'in adı yalnız o etiketten geliyor (`for=`).
        `.yalniz-okuyucu` görsel akıştan çıkarır, ekran okuyucuda BIRAKIR
        — kabuğun kendi `.panel-arama` etiketinde kullandığı desenin
        aynısı (aynı şeritte zaten var, ölçüldü).

     🔴 AD KAYBOLMASIN DİYE İLK SEÇENEK ETİKETİ ÜSTLENİR: "Tümü" →
        "Tür: Tümü". Gözle bakan kullanıcı süzgecin NE olduğunu artık
        kapalıyken de görür — etiketin taşıdığı bilginin karşılığı.
     ⚠ METİN UYDURULMAZ: iki parça da markup'ın kendi metni (etiketin
       metni + seçeneğin metni). İkinci bir metin kaynağı doğmaz —
       §24'ün "ipucu `aria-label`dan türetilir" kuralının aynısı.
     ⚠ İDEMPOTENT: `data-etiketlendi` damgası. Damgasız yazım ikinci
       koşumda "Tür: Tür: Tümü" üretirdi.
       (hafıza: "İdempotent olmayan dönüşüm")
     ⚠ KAPSAM DAR: yalnız `.suzgec-cubuk` içindeki, `.yalniz-okuyucu`
       OLMAYAN ve bir denetime `for=` ile bağlı etiketler. Form
       ekranlarının etiketleri bu kuralın dışında — orada etiket üstte
       DURMALI.                                                        */
  function seritEtiketNormalle(kok) {
    (kok || document).querySelectorAll('.suzgec-cubuk label').forEach(function (l) {
      if (l.classList.contains('yalniz-okuyucu') || l.classList.contains('sr-only')) return;
      if (l.hasAttribute('data-etiketlendi')) return;
      var ad = (l.textContent || '').trim().replace(/[:：]\s*$/, '');
      if (!ad) return;
      var hedef = l.getAttribute('for') ? document.getElementById(l.getAttribute('for'))
                                        : l.querySelector('select, input');
      l.setAttribute('data-etiketlendi', '1');
      l.classList.add('yalniz-okuyucu');
      if (!hedef) return;
      /* Ad kaybolmasın: ilk seçenek etiketi üstlenir. */
      if (hedef.tagName === 'SELECT' && hedef.options.length) {
        var ilk = hedef.options[0];
        var m = (ilk.textContent || '').trim();
        if (m && m.indexOf(ad + ':') !== 0) ilk.textContent = ad + ': ' + m;
      }
      if (!hedef.getAttribute('aria-label')) hedef.setAttribute('aria-label', ad);
    });
  }
  window.DM_SERIT_ETIKET = seritEtiketNormalle;

  function tasmaTazele() {
    document.querySelectorAll('.panel-bas').forEach(tasmaKur);
    seritEtiketNormalle();
    document.querySelectorAll('.suzgec-cubuk').forEach(suzgecTasmaKur);
  }
  tasmaTazele();
  var tasmaZaman;
  window.addEventListener('resize', function () {
    clearTimeout(tasmaZaman); tasmaZaman = setTimeout(tasmaTazele, 120);
  });

  /* 🔴 AÇMA/KAPAMA KENDİ DİNLEYİCİSİNİ AÇMAZ — ÖLÇÜMLE ÖĞRENİLDİ.
     İlk yazımda kit bu düğmeye kendi tıklama dinleyicisini bağlıyordu.
     Ama `_ortak/panel.js` ZATEN `aria-expanded` + `aria-controls`
     bildiren HER tetiği yönetiyor (kabuğun açılır sözleşmesi). İki
     dinleyici arka arkaya çalışınca biri açıyor öteki kapatıyordu:
     menü tıklamada AÇILMIYORDU ve konsolda hata da yoktu.
     Ölçüm yakaladı ("menü açıldı: false"), kitin dinleyicisi kaldırıldı.
     Menü ARIA sözleşmesini bildiriyor; onu süren tek kaynak kabuktur —
     "kabuk gibi davranış da TEK kaynaktan gelir" kuralı.
     ⚠ Dışarı tıklayınca kapanma ve "aynı anda tek açılır" da oradan
       geliyor; burada ikinci kez yazılmıyor. */

  /* ───────────────────────────────────────────────────────────────────
     2 · TOAST
     ─────────────────────────────────────────────────────────────────── */
  var toastKap = null;
  function kap() {
    if (toastKap && document.body.contains(toastKap)) return toastKap;
    toastKap = document.createElement('div');
    toastKap.className = 'toast-kap';
    toastKap.setAttribute('role', 'status');
    toastKap.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastKap);
    return toastKap;
  }
  /* 🔴 YİNELEME ENGELİ — Beyar ekranda gördü: aynı ileti üç kez üst üste
     yığılmıştı ("… başlatıldı" · "… tamamlandı" · "… başlatıldı").
     Aynı metin görünürken ikincisini basmak bilgi eklemiyor, ekranı
     kapatıyor. Zaten duran toast'un ömrü tazelenir ve bir sayaç alır. */
  function toast(metin, tur) {
    var mevcut = null;
    kap().querySelectorAll('.toast').forEach(function (x) {
      var s = x.querySelector('span');
      if (s && s.textContent === metin && x.className.indexOf(tur || 'basarili') !== -1) mevcut = x;
    });
    if (mevcut && metin) {
      var n = (parseInt(mevcut.dataset.kere || '1', 10) || 1) + 1;
      mevcut.dataset.kere = String(n);
      var sy = mevcut.querySelector('.toast-kere');
      if (!sy) {
        sy = document.createElement('b');
        sy.className = 'toast-kere';
        mevcut.querySelector('span').insertAdjacentElement('afterend', sy);
      }
      sy.textContent = '×' + n;
      clearTimeout(mevcut._zaman);
      mevcut._zaman = setTimeout(function () { mevcut.remove(); }, 4200);
      return mevcut;
    }
    /* Yığın en çok üç; dördüncü gelince en eskisi düşer. */
    var duran = kap().querySelectorAll('.toast');
    if (duran.length >= 3) duran[0].remove();

    var t = document.createElement('div');
    t.className = 'toast ' + (tur || 'basarili');
    var ikon = tur === 'hata' ? 'fa-circle-exclamation' : 'fa-circle-check';
    var i = document.createElement('i');
    i.className = 'fa-solid ' + ikon;
    i.setAttribute('aria-hidden', 'true');
    var s = document.createElement('span');
    s.textContent = metin;
    var k = document.createElement('button');
    k.type = 'button'; k.className = 'toast-kapat';
    k.setAttribute('aria-label', 'Bildirimi kapat');
    k.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    k.addEventListener('click', function () { t.remove(); });
    t.appendChild(i); t.appendChild(s); t.appendChild(k);
    kap().appendChild(t);
    t._zaman = setTimeout(function () { t.remove(); }, 4200);
    return t;
  }
  window.DM_TOAST = toast;      /* ekran betiklerinin de çağırabilmesi için */

  /* ───────────────────────────────────────────────────────────────────
     3 · ONAY KAPISI — silme
     ─────────────────────────────────────────────────────────────────── */
  var onayOrtu = null, onayCb = null, onceOdak = null;

  function onayKur() {
    if (onayOrtu) return onayOrtu;
    onayOrtu = document.createElement('div');
    onayOrtu.className = 'onay-ortu';
    onayOrtu.hidden = true;
    onayOrtu.innerHTML =
      '<div class="onay-kapi" role="alertdialog" aria-modal="true" aria-labelledby="onayBas" aria-describedby="onayMetin">' +
        '<h2 id="onayBas"></h2><p id="onayMetin"></p>' +
        '<div class="eylem-satiri">' +
          '<button type="button" class="dugme hayalet" data-onay="hayir">Vazgeç</button>' +
          '<button type="button" class="dugme tehlike" data-onay="evet">Sil</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(onayOrtu);
    onayOrtu.addEventListener('click', function (e) {
      if (e.target === onayOrtu) return onayKapat(false);
      var d = e.target.closest('[data-onay]');
      if (d) onayKapat(d.getAttribute('data-onay') === 'evet');
    });
    return onayOrtu;
  }
  function onayKapat(sonuc) {
    if (!onayOrtu || onayOrtu.hidden) return;
    onayOrtu.hidden = true;
    var cb = onayCb; onayCb = null;
    if (onceOdak && document.contains(onceOdak)) onceOdak.focus();
    onceOdak = null;
    if (cb) cb(sonuc);
  }
  function onaySor(baslik, metin, dugmeMetni, cb) {
    var o = onayKur();
    o.querySelector('#onayBas').textContent = baslik;
    o.querySelector('#onayMetin').textContent = metin;
    o.querySelector('[data-onay="evet"]').textContent = dugmeMetni || 'Sil';
    onceOdak = document.activeElement;
    onayCb = cb;
    o.hidden = false;
    o.querySelector('[data-onay="hayir"]').focus();
  }
  window.DM_ONAY = onaySor;

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && onayOrtu && !onayOrtu.hidden) { e.preventDefault(); onayKapat(false); }
  });

  /* ───────────────────────────────────────────────────────────────────
     4 · SATIR İŞLEMLERİ
     ───────────────────────────────────────────────────────────────────
     Sözleşme markup'ta: `.satir-islem` içindeki düğme `data-islem`
     taşır. Dört değer: `duzenle` · `sil` · `sabitle` · `pasif`.
     🔴 Hedefi olmayan düğme SESSİZCE DURUR (panel.js'in açılır kuralıyla
        aynı disiplin) — uydurma davranış üretmez.
     ─────────────────────────────────────────────────────────────────── */
  /* 🔴 SATIRIN ADI İLK HÜCRE DEĞİLDİR. İlk yazım `querySelector('th,td')`
     diyordu ve o hücre SEÇİM KUTUSU — metni boş. Sonuç: panel başlığı
     " — düzenle", toast '“” kaydedildi' çıkıyordu. Ölçümde görüldü.
     Ad, METNİ OLAN ilk hücreden okunur; seçim ve işlem sütunları atlanır. */
  function satirAdi(tr) {
    var hepsi = [].slice.call(tr.cells || tr.querySelectorAll('th,td'));
    for (var i = 0; i < hepsi.length; i++) {
      var h = hepsi[i];
      if (h.classList.contains('sec')) continue;
      if (h.querySelector('input[type=checkbox]')) continue;
      if (h.querySelector('.satir-islem, [data-islem]')) continue;
      var t = (h.textContent || '').trim().replace(/\s+/g, ' ');
      if (t) return t.slice(0, 60);
    }
    return 'kayıt';
  }

  /* ═══════════════════════════════════════════════════════════════════
     SATIRDAN KURULAN DÜZENLEME PANELİ — KALDIRILDI
     ───────────────────────────────────────────────────────────────────
     Beyar kararı, 2026-09-04: **"Düzenle" oluştur formuyla AYNI tam
     sayfa formdur, kayıt verisiyle dolu (`admin-*-form.html?id=…`).**
     Satırdan panel kurma yok.

     Neden: panel `thead` başlıklarını alan adı, hücreleri değer sayarak
     bir form uyduruyordu ve ÖLÇÜLDÜ ki bu veriyi bozuyor —
     `admin-taksonomi`de iki hücreyi birleştirip "Kuvvetkuvvet · üst:
     kök" diye bir başlık üretiyor, salt okunur "42 kayıt" sayısını
     düzenlenebilir bir ALAN diye basıyordu. Tablo bir kaydın TAM
     alanlarını göstermez; gösterdiği şey sütun seçkisidir. Bir formu
     sütunlardan türetmek, "türetilen şey kaybeder" dersinin form
     karşılığıdır.

     Yan panel yaşamaya devam ediyor ama YALNIZ tek alanlı hızlı
     işlemler için (durum değiştir · sıralama) ve o panel MARKUP'TA
     BİLDİRİLİR: `data-eylem="panel-ac"` + `data-hedef="#panelId"`.
     Kit artık hiçbir paneli tablodan sentezlemiyor.

     Ölü kod bırakılmadı: `duzKur` · `duzKapat` · `duzKaydet` · `duzAc`
     ve `window.DM_DUZENLE` birlikte gitti. Kaldırılan bir davranışın
     işlevi dosyada durursa bir sonraki tur onu "var, öyleyse
     kullanılabilir" diye geri bağlar.
     ═══════════════════════════════════════════════════════════════ */


  document.addEventListener('click', function (e) {
    var d = e.target.closest('[data-islem]');
    if (!d) return;
    var islem = d.getAttribute('data-islem');
    var tr = d.closest('tr');
    e.preventDefault();

    if (islem === 'duzenle') {
      /* Sıra: bildirilen panel → gerçek detay sayfası → satırdan kurulan
         panel. Üçüncü basamak sayesinde "bağlı değil" hâli YOK. */
      var hedefId = d.getAttribute('data-hedef');
      var yuzey = hedefId && (document.getElementById(hedefId.replace(/^#/, '')) ||
                              (/^[#.\[]/.test(hedefId) ? document.querySelector(hedefId) : null));
      if (yuzey) {
        yuzey.hidden = false;
        yuzey.classList.add('acik');
        var ilk = yuzey.querySelector('input, select, textarea, button');
        if (ilk) ilk.focus();
        return;
      }
      /* 🔴 GERİ DÜŞÜŞ PANELDEN ÇIKAMAZ — 2026-09-04'te TIKLANARAK ölçüldü.
         `admin-anatomi` ve `admin-challenge`in satır "Düzenle"si basınca
         `../anatomi-v1.html?kas=…` ve `../challenge-v1.html?slug=…` açıyordu:
         yönetici düzenlemeye basıp ÜYE YÜZÜNE düşüyordu. Sebep bu satırdı —
         düğme kendi hedefini taşımayınca SATIRIN İLK BAĞLANTISINA düşülüyor,
         o bağlantı da "Sitede gör". Kusur ölü buton tarayıcısına GÖRÜNMÜYOR:
         düğme çalışıyor, adres değişiyor, kapı yeşil veriyor. Kapı "bir şey
         oldu mu" diye soruyor, "DOĞRU şey mi oldu" diye değil.
         Kural: düğmenin KENDİ href'i açık niyettir, olduğu gibi izlenir;
         satırdan TÜREtilen bağ ise paneli terk ediyorsa kullanılmaz —
         o durumda satırdan kurulan panele düşülür (üçüncü basamak zaten var). */
      function panelIci(a) {
        if (!a) return false;
        if (a.hasAttribute('target')) return false;        /* yeni sekme = "sitede gör" */
        var h = a.getAttribute('href') || '';
        if (!h || h.charAt(0) === '#') return false;
        if (/^[a-z][a-z0-9+.-]*:/i.test(h)) return false;  /* http: · mailto: · javascript: */
        if (h.charAt(0) === '/') return false;             /* kök-mutlak: panelin dışı olabilir */
        if (h.indexOf('../') === 0) return false;          /* bir dizin yukarısı = üye yüzü */
        return true;
      }
      var kendi = d.getAttribute('href');
      if (kendi && kendi.charAt(0) !== '#') { window.location.href = kendi; return; }
      /* ⚠ İLK BAĞI ALIP ELEMEK YETMEZ. Gerçek satırların çoğu ÖNCE dışa
         açılan "Sitede gör"ü, SONRA panel içi bağı taşıyor; ilkini alıp
         reddeden bir savunma geçerli bağı hiç görmeden panele düşerdi.
         (Olumsuz sınamanın C örneği tam bunu yakaladı.) Satırın BÜTÜN
         bağlarına bakılır, panel içi OLAN İLKİ izlenir. */
      var bag = null;
      if (tr) {
        var adaylar = tr.querySelectorAll('a[href]:not([href^="#"])');
        for (var bi = 0; bi < adaylar.length; bi++) {
          if (panelIci(adaylar[bi])) { bag = adaylar[bi]; break; }
        }
      }
      if (bag) { window.location.href = bag.getAttribute('href'); return; }

      /* 🔴 SATIRDAN PANEL KURMA DALI KALDIRILDI — Beyar kararı 2026-09-04.
         "Düzenle" oluştur formuyla AYNI tam sayfa formdur, kayıt
         verisiyle dolu (`admin-*-form.html?id=…`). Satırdan kurulan
         panel bunun yerine geçemez ve ÖLÇÜLDÜ ki geçmeye çalışınca
         veriyi bozuyor: `admin-taksonomi`de iki hücreyi birleştirip
         "Kuvvetkuvvet · üst: kök" diye bir başlık uyduruyor, salt
         okunur "42 kayıt" sayısını düzenlenebilir bir ALAN diye basıyordu.
         Yan panel yalnız TEK ALANLI hızlı işlemler içindir (durum
         değiştir, sıralama) — düzenleme için değil.

         Yerine geçen: sayfanın KENDİ bildirdiği form. Liste ekranının
         sayfa başındaki "Yeni …" düğmesi o modülün formunu zaten
         gösteriyor; düzenleme aynı forma kaydın anahtarıyla gider.
         Bu bir TAHMİN değil, sayfadan OKUMA — uydurulan tek şey yok. */
      var yeniDugme = document.querySelector('.panel-bas [href*="-form.html"]');
      if (yeniDugme && tr) {
        var anahtar = d.getAttribute('data-duzenle')
                   || tr.getAttribute('data-id')
                   || tr.getAttribute('data-slug');
        var hedefYol = yeniDugme.getAttribute('href');
        if (anahtar) hedefYol += (hedefYol.indexOf('?') === -1 ? '?' : '&') + 'id=' + encodeURIComponent(anahtar);
        window.location.href = hedefYol;
        return;
      }
      /* Buraya düşen satırın hedefi markup'ta BİLDİRİLMEMİŞTİR. Kit
         uydurma bir yüzey açmaz; kusur `adm-duzenle-form.mjs` kapısında
         "düzenle denetimi hedefsiz" diye sayılır ve markup'ta kapatılır. */
      return;
    }

    if (islem === 'sil') {
      /* 🔴 TEKRARLAYAN SATIR SİLİNEMİYORDU. Bu dal yalnız `<tr>` ile
         çalışıyordu; form tekrarlayıcılarının satırı `.adim-karti`.
         Ölçüldü: silme onayı VERİLİYOR, sonra hiçbir şey olmuyordu —
         onay modalı çıktığı için kapıya "canlı" görünüyordu.
         Tekrarlayıcı satırı onay SORMADAN gider: geri alma çipi yok ama
         satır boş bir form satırıdır, yıkıcılık eşiğinin altında; yerine
         toast + `Geri al` verilir, silme kuralının kendisi korunur. */
      var tekrar = !tr && d.closest('.adim-karti, .kalem-satiri');
      if (tekrar) {
        e.preventDefault();
        var listeT = tekrar.parentElement;
        var komsuT = tekrar.nextElementSibling;
        tekrar.remove();
        /* ⚠ `listeTazele` BAŞKA IIFE'DE. Bu dosyada birden çok IIFE var
           (kayıtlı vaka: `duzAc` 1.'de, `panel-ac` 2.'de) ve doğrudan
           çağrı burada ReferenceError atıyordu: satır siliniyor, sonra
           işleyici patlıyor, numara ve toast hiç gelmiyordu. Ölçümde
           çıktı — silme "çalışıyor" görünüp numaraları 2,3,4,5 bırakmıştı.
           Pencere kancasından çağrılır; kanca IIFE 2 koşarken kuruluyor,
           yani ilk tıklamadan çok önce hazır. */
        if (window.DM_LISTE_TAZELE) window.DM_LISTE_TAZELE(listeT);
        var tT = toast('Satır silindi.');
        var gT = document.createElement('button');
        gT.type = 'button'; gT.className = 'toast-geri'; gT.textContent = 'Geri al';
        gT.addEventListener('click', function () {
          if (komsuT && komsuT.parentNode === listeT) listeT.insertBefore(tekrar, komsuT);
          else listeT.appendChild(tekrar);
          if (window.DM_LISTE_TAZELE) window.DM_LISTE_TAZELE(listeT);
          tT.remove(); toast('Satır geri alındı.');
        });
        var spT = tT.querySelector('span'); if (spT) spT.insertAdjacentElement('afterend', gT);
        return;
      }
      var ad = tr ? satirAdi(tr) : (d.getAttribute('data-ad') || 'kayıt');
      onaySor('Silinsin mi?', '“' + ad + '” listeden kaldırılacak.',
        'Sil', function (evet) {
          if (!evet || !tr) return;
          var tablo = tr.closest('table');
          var komsu = tr.nextElementSibling, ebeveyn = tr.parentNode;
          tr.remove();
          if (tablo && window.DM_SECIM_TAZELE) window.DM_SECIM_TAZELE(tablo);
          /* 🔴 GERİ AL — yıkıcı eylemin karşılığı yalnız onay değil,
             dönüş yolu. Satır bellekte duruyor; toast onu geri koyuyor. */
          var t = toast('“' + ad + '” silindi.');
          var g = document.createElement('button');
          g.type = 'button'; g.className = 'toast-geri'; g.textContent = 'Geri al';
          g.addEventListener('click', function () {
            if (komsu && komsu.parentNode === ebeveyn) ebeveyn.insertBefore(tr, komsu);
            else ebeveyn.appendChild(tr);
            if (tablo && window.DM_SECIM_TAZELE) window.DM_SECIM_TAZELE(tablo);
            t.remove(); toast('“' + ad + '” geri alındı.');
          });
          var sp = t.querySelector('span'); if (sp) sp.insertAdjacentElement('afterend', g);
        });
      return;
    }

    if (islem === 'sabitle') {
      if (!tr) return;
      var govdeS = tr.parentNode;
      var sabit = tr.classList.toggle('sabit');
      d.setAttribute('aria-pressed', String(sabit));
      var si = d.querySelector('i');
      if (si) si.className = sabit ? 'fa-solid fa-thumbtack' : 'fa-regular fa-thumbtack';
      if (sabit) {
        /* Satır ÜSTE taşınır — sabitlemenin görünür karşılığı bu.
           Nereden geldiği saklanır ki geri alınabilsin. */
        if (!tr.dataset.eskiSira) {
          tr.dataset.eskiSira = String([].indexOf.call(govdeS.rows, tr));
        }
        govdeS.insertBefore(tr, govdeS.firstElementChild);
      } else {
        var n = Number(tr.dataset.eskiSira || 0);
        var hedefS = govdeS.rows[n + 1] || null;
        govdeS.insertBefore(tr, hedefS);
        delete tr.dataset.eskiSira;
      }
      toast(satirAdi(tr) + (sabit ? ' en üste sabitlendi.' : ' sabitlemesi kaldırıldı.'));
      return;
    }

    if (islem === 'pasif') {
      if (!tr) return;
      var pasif = tr.classList.toggle('pasif');
      d.setAttribute('aria-pressed', String(pasif));
      /* Satırın durum hapını da çevir — durum DEĞİŞSİN, yalnız satır
         solmasın. Hap yoksa atlanır, uydurulmaz. */
      var hap = tr.querySelector('.durum-hapi, .rozet, .hap');
      if (hap) {
        if (pasif) {
          hap.setAttribute('data-onceki', hap.textContent.trim());
          hap.textContent = 'Pasif';
        } else if (hap.getAttribute('data-onceki')) {
          hap.textContent = hap.getAttribute('data-onceki');
        }
      }
      toast(satirAdi(tr) + (pasif ? ' pasife alındı.' : ' yeniden etkin.'));
      return;
    }
  });

  /* ───────────────────────────────────────────────────────────────────
     5 · ALAN ALTI DOĞRULAMA
     ───────────────────────────────────────────────────────────────────
     Kural: hata alanın ALTINDA doğar, form gönderilmez, ilk hatalı
     alana odaklanılır ve TEK bir toast basılır (alan başına toast
     basmak ekranı kirletiyor).
     ─────────────────────────────────────────────────────────────────── */
  function hataYaz(alan, metin) {
    alan.classList.add('hatali');
    var girdi = alan.querySelector('.alan-girdi, .alan-secim, .alan-metin');
    var kutu = alan.querySelector('.alan-hata');
    if (!kutu) {
      kutu = document.createElement('p');
      kutu.className = 'alan-hata';
      kutu.innerHTML = '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><span></span>';
      var yardim = alan.querySelector('.alan-yardim');
      if (yardim) yardim.insertAdjacentElement('beforebegin', kutu);
      else alan.appendChild(kutu);
    }
    kutu.hidden = false;
    var s = kutu.querySelector('span') || kutu;
    s.textContent = metin;
    if (girdi) {
      girdi.setAttribute('aria-invalid', 'true');
      if (!kutu.id) kutu.id = 'hata-' + Math.random().toString(36).slice(2, 8);
      girdi.setAttribute('aria-describedby', kutu.id);
    }
  }
  function hataSil(alan) {
    alan.classList.remove('hatali');
    var kutu = alan.querySelector('.alan-hata');
    if (kutu) kutu.hidden = true;
    var girdi = alan.querySelector('.alan-girdi, .alan-secim, .alan-metin');
    if (girdi) { girdi.removeAttribute('aria-invalid'); girdi.removeAttribute('aria-describedby'); }
  }

  function alanDenetle(girdi) {
    var alan = girdi.closest('.alan');
    if (!alan) return true;
    var deger = (girdi.value || '').trim();
    var zorunlu = girdi.hasAttribute('required') || alan.querySelector('.zorunlu, label .yildiz');
    if (zorunlu && !deger) { hataYaz(alan, 'Bu alan zorunlu.'); return false; }
    if (deger && girdi.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(deger)) {
      hataYaz(alan, 'Geçerli bir e-posta adresi yaz.'); return false;
    }
    if (deger && girdi.hasAttribute('maxlength')) {
      var enc = parseInt(girdi.getAttribute('maxlength'), 10);
      if (enc && deger.length > enc) { hataYaz(alan, 'En çok ' + enc + ' karakter.'); return false; }
    }
    /* Tarih aralığı — bitiş başlangıçtan önce olamaz (EK-3'ün şartı). */
    if (deger && girdi.hasAttribute('data-aralik-bitis')) {
      var bas = document.querySelector('[data-aralik-baslangic="' + girdi.getAttribute('data-aralik-bitis') + '"]');
      if (bas && bas.value && deger < bas.value) {
        hataYaz(alan, 'Bitiş tarihi başlangıçtan önce olamaz.'); return false;
      }
    }
    hataSil(alan);
    return true;
  }
  window.DM_ALAN_DENETLE = alanDenetle;
  /* 🔴 İKİ IIFE, TEK HATA YÜZEYİ. `hataYaz`/`hataSil` bu blokta yaşıyor;
     §23 (girdi tipi) ikinci blokta. Devir belgesi §20-2'nin kusuru tam
     buydu: `hataSil` başka IIFE'de kaldı, çağrı ReferenceError attı ve
     doldurma döngüsü ortada kesildi — belirti "sayaç kusuru" sanıldı
     çünkü konsol dinlenmiyordu. Üçüncü kapsam tuzağına düşmemek için
     yüzey AÇIKÇA dışarı veriliyor. */
  window.DM_HATA_YAZ = hataYaz;
  window.DM_HATA_SIL = hataSil;

  /* Yazarken hatayı temizle — kullanıcı düzeltirken kırmızı durmasın. */
  document.addEventListener('input', function (e) {
    var g = e.target.closest('.alan-girdi, .alan-secim, .alan-metin');
    if (!g) return;
    var alan = g.closest('.alan');
    if (alan && alan.classList.contains('hatali')) alanDenetle(g);
  });
  document.addEventListener('blur', function (e) {
    var g = e.target.closest && e.target.closest('.alan-girdi, .alan-secim, .alan-metin');
    if (g) alanDenetle(g);
  }, true);

  /* Kaydet / yayınla / taslak — doğrula, sonra toast. */
  document.addEventListener('click', function (e) {
    var d = e.target.closest('[data-eylem]');
    if (!d) return;
    var eylem = d.getAttribute('data-eylem');
    if (['kaydet', 'yayinla', 'taslak'].indexOf(eylem) === -1) return;
    e.preventDefault();

    var form = d.closest('form') || document.querySelector('.form-duzen') || document;
    var girdiler = form.querySelectorAll('.alan .alan-girdi, .alan .alan-secim, .alan .alan-metin');
    var ilkHata = null;
    girdiler.forEach(function (g) { if (!alanDenetle(g) && !ilkHata) ilkHata = g; });

    if (ilkHata) {
      ilkHata.focus();
      ilkHata.scrollIntoView({ block: 'center' });
      toast('Form kaydedilmedi — doldurulması gereken alanlar var.', 'hata');
      return;
    }
    var metin = eylem === 'yayinla' ? 'Yayınlandı.'
              : eylem === 'taslak'  ? 'Taslak kaydedildi.'
                                    : 'Kaydedildi.';
    toast(metin + '');
  });

  /* Silme düğmesi form içinde de olabilir (ör. "Sayfayı sil"). */
  document.addEventListener('click', function (e) {
    var d = e.target.closest('[data-eylem="sil"]');
    if (!d) return;
    e.preventDefault();
    var ad = d.getAttribute('data-ad') ||
      (document.querySelector('.panel-bas h1') || {}).textContent || 'kayıt';
    onaySor('Silinsin mi?', '“' + String(ad).trim() + '” kalıcı olarak kaldırılacak. Bu işlem geri alınamaz.',
      'Sil', function (evet) { if (evet) toast('Silindi.'); });
  });

  /* ───────────────────────────────────────────────────────────────────
     6 · GÖRSEL GİRDİSİ — önizleme + kırpma çerçevesi
     ───────────────────────────────────────────────────────────────────
     Gerçek yükleme YOK; dosya `URL.createObjectURL` ile yerel okunur.
     Oran seçimi 1:1 · 16:9 · serbest. Çerçeve sürüklenebilir.
     ─────────────────────────────────────────────────────────────────── */
  function kirpmaKur(kutu, url) {
    var sahne = kutu.querySelector('.kirpma-sahne');
    var cerceve = kutu.querySelector('.kirpma-cerceve');
    var img = sahne && sahne.querySelector('img');
    if (!sahne || !cerceve || !img) return;
    img.src = url;
    img.onload = function () { oranUygula(kutu, kutu.getAttribute('data-oran') || '16:9'); };
  }
  function oranUygula(kutu, oran) {
    var sahne = kutu.querySelector('.kirpma-sahne');
    var cerceve = kutu.querySelector('.kirpma-cerceve');
    if (!sahne || !cerceve) return;
    kutu.setAttribute('data-oran', oran);
    kutu.querySelectorAll('.oran-grubu [data-oran]').forEach(function (b) {
      b.classList.toggle('aktif', b.getAttribute('data-oran') === oran);
      b.setAttribute('aria-pressed', String(b.getAttribute('data-oran') === oran));
    });
    var w = sahne.clientWidth, h = sahne.clientHeight;
    if (!w || !h) return;
    if (oran === 'serbest') {
      cerceve.style.width = Math.round(w * 0.9) + 'px';
      cerceve.style.height = Math.round(h * 0.9) + 'px';
    } else {
      var p = oran.split(':'), r = (+p[0]) / (+p[1]);
      var cw = w * 0.9, ch = cw / r;
      if (ch > h * 0.9) { ch = h * 0.9; cw = ch * r; }
      cerceve.style.width = Math.round(cw) + 'px';
      cerceve.style.height = Math.round(ch) + 'px';
    }
    cerceve.style.left = ''; cerceve.style.top = '';
    cerceve.style.inset = '0'; cerceve.style.margin = 'auto';
  }

  document.addEventListener('change', function (e) {
    var g = e.target.closest('input[type="file"][accept*="image"]');
    if (!g) return;
    var kutu = g.closest('.form-gorsel');
    if (!kutu || !g.files || !g.files[0]) return;
    kutu.classList.add('dolu');
    kirpmaKur(kutu, URL.createObjectURL(g.files[0]));
    toast('Görsel seçildi — kırpma çerçevesini sürükleyerek ayarla.');
  });

  document.addEventListener('click', function (e) {
    var o = e.target.closest('.oran-grubu [data-oran]');
    if (o) { e.preventDefault(); oranUygula(o.closest('.form-gorsel'), o.getAttribute('data-oran')); return; }
    var v = e.target.closest('[data-gorsel="vazgec"]');
    if (v) {
      e.preventDefault();
      var k = v.closest('.form-gorsel');
      if (k) { k.classList.remove('dolu'); var f = k.querySelector('input[type=file]'); if (f) f.value = ''; }
      return;
    }
    var u = e.target.closest('[data-gorsel="uygula"]');
    if (u) {
      e.preventDefault();
      var kk = u.closest('.form-gorsel');
      var c = kk && kk.querySelector('.kirpma-cerceve');
      if (c) toast('Kırpma uygulandı — ' + Math.round(c.offsetWidth) + '×' + Math.round(c.offsetHeight) + ' px.');
      return;
    }
  });

  /* Çerçeve sürükleme — sahnenin dışına çıkmaz. */
  (function () {
    var suruk = null, bx = 0, by = 0, sl = 0, st = 0;
    document.addEventListener('pointerdown', function (e) {
      var c = e.target.closest('.kirpma-cerceve');
      if (!c) return;
      suruk = c; bx = e.clientX; by = e.clientY;
      var s = c.parentElement.getBoundingClientRect(), r = c.getBoundingClientRect();
      sl = r.left - s.left; st = r.top - s.top;
      c.style.inset = 'auto'; c.style.margin = '0';
      c.style.left = sl + 'px'; c.style.top = st + 'px';
      c.setPointerCapture(e.pointerId);
    });
    document.addEventListener('pointermove', function (e) {
      if (!suruk) return;
      var s = suruk.parentElement.getBoundingClientRect();
      var nl = Math.max(0, Math.min(s.width - suruk.offsetWidth, sl + e.clientX - bx));
      var nt = Math.max(0, Math.min(s.height - suruk.offsetHeight, st + e.clientY - by));
      suruk.style.left = nl + 'px'; suruk.style.top = nt + 'px';
    });
    document.addEventListener('pointerup', function () { suruk = null; });
  })();

})();


/* ═══════════════════════════════════════════════════════════════════════
   ADMIN UI KİTİ · ÖLÜ BUTON YASAĞI — `data-eylem` DAĞITICISI
   ───────────────────────────────────────────────────────────────────────
   Beyar kuralı, 2026-09-04: *"Tıklanınca bir şey olmayan buton/link
   kalmaz."*

   🔴 SAYFA BAŞINA ÖZEL JS YOK. Tek mekanizma: markup `data-eylem`
      bildirir, bu dağıtıcı karşılığını üretir. Ekranın yapması gereken
      tek şey doğru adı yazmaktır.

   ⚠ MAKET KİLİDİ KORUNUR: hiçbir eylem sunucuya gitmez. "Hazırlanıyor"
     bir zamanlayıcıdır, indirilen dosya CLIENT'TA üretilir (tablonun
     kendi hücrelerinden), ve toast bunu YAZAR. Uydurma veri yok —
     dışa aktarılan şey ekranda GÖRÜNEN veridir.

   ⚠ Bu blok AYRI bir IIFE: birinci blok temel kalemleri (toast · onay ·
     satır işlemi · doğrulama) kurar ve `window.DM_*` ile paylaşır.
     Ayrılık kasıtlı — biri kırılırsa öteki koşmaya devam eder.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!document.body || !document.body.classList.contains('yetkili')) return;

  var toast = window.DM_TOAST || function () {};
  var onaySor = window.DM_ONAY || function (a, b, c, cb) { cb(true); };

  /* ── Genel amaçlı seçim kapısı (format seçimi · hedef seçimi) ───────── */
  var kapi = null, kapiCb = null, kapiOdak = null;
  function kapiKur() {
    if (kapi) return kapi;
    kapi = document.createElement('div');
    kapi.className = 'onay-ortu secim-kapi';
    kapi.hidden = true;
    kapi.innerHTML =
      '<div class="onay-kapi" role="dialog" aria-modal="true" aria-labelledby="secimBas">' +
        '<h2 id="secimBas"></h2><p></p><div class="secenekler"></div>' +
        '<div class="eylem-satiri"><button type="button" class="dugme hayalet" data-secim-kapat>Vazgeç</button></div>' +
      '</div>';
    document.body.appendChild(kapi);
    kapi.addEventListener('click', function (e) {
      if (e.target === kapi || e.target.closest('[data-secim-kapat]')) return kapiKapat(null);
      var s = e.target.closest('.secenek');
      if (s) kapiKapat(s.getAttribute('data-deger'));
    });
    return kapi;
  }
  function kapiKapat(deger) {
    if (!kapi || kapi.hidden) return;
    kapi.hidden = true;
    var cb = kapiCb; kapiCb = null;
    if (kapiOdak && document.contains(kapiOdak)) kapiOdak.focus();
    if (cb && deger !== null) cb(deger);
  }
  function secimSor(baslik, aciklama, secenekler, cb) {
    var k = kapiKur();
    k.querySelector('#secimBas').textContent = baslik;
    var p = k.querySelector('p');
    p.textContent = aciklama || ''; p.hidden = !aciklama;
    var kap = k.querySelector('.secenekler');
    kap.innerHTML = '';
    secenekler.forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'secenek'; b.setAttribute('data-deger', s.deger);
      b.innerHTML = '<i class="fa-solid ' + (s.ikon || 'fa-file') + '" aria-hidden="true"></i>' +
                    '<span>' + s.ad + '</span>' + (s.not ? '<small>' + s.not + '</small>' : '');
      kap.appendChild(b);
    });
    kapiOdak = document.activeElement;
    kapiCb = cb;
    k.hidden = false;
    var ilk = kap.querySelector('.secenek'); if (ilk) ilk.focus();
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && kapi && !kapi.hidden) { e.preventDefault(); kapiKapat(null); }
  });

  /* ── Tablodan örnek dosya üret — VERİ EKRANDAN OKUNUR ──────────────── */
  function tabloVerisi(kok) {
    var t = (kok && kok.querySelector('.tablo, table')) || document.querySelector('.tablo, table');
    if (!t) return null;
    var satirlar = [];
    t.querySelectorAll('thead tr').forEach(function (tr) {
      satirlar.push([].map.call(tr.children, function (h) {
        return (h.textContent || '').trim().replace(/\s+/g, ' ');
      }));
    });
    t.querySelectorAll('tbody tr').forEach(function (tr) {
      if (tr.hidden) return;
      satirlar.push([].map.call(tr.children, function (h) {
        return (h.textContent || '').trim().replace(/\s+/g, ' ');
      }));
    });
    return satirlar;
  }
  function csvUret(satirlar) {
    return satirlar.map(function (s) {
      return s.map(function (h) { return '"' + String(h).replace(/"/g, '""') + '"'; }).join(';');
    }).join('\r\n');
  }
  function dosyaSun(ad, icerik, tur, toastEl) {
    var blob = new Blob(["﻿" + icerik], { type: tur });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = ad; a.textContent = ad;
    a.addEventListener('click', function () { setTimeout(function () { URL.revokeObjectURL(url); }, 4000); });
    var t = toastEl || toast('', 'basarili');
    var s = t.querySelector('span');
    if (s) { s.textContent = 'Dosya hazır: '; s.appendChild(a); }
    /* İndirme bağlantısı toast'un ömründen uzun yaşasın. */
    t.dataset.kalici = '1';
    return a;
  }

  /* 🔴 ADRESTEN GELEN ÖLÇÜT `suzgecTazele`YE DE GÖRÜNMELİ.
     İlk yazımda `adrestenSuzgec` satırları DOĞRUDAN gizliyordu; hemen
     ardından `suzgecTazele` koşuyor ve kendi ölçütü boş olduğu için
     hepsini GERİ AÇIYORDU. Canlıda ölçüldü: not "12 kayıt" yazıyor,
     tabloda 17/17 satır duruyor — sayfa kendi kendisiyle çelişiyordu.
     Ölçüt tek havuzda tutulur; iki yol da aynı listeyi okur. */
  var ADRES_OLCUT = [];

  /* ── Süzgeç uygulama · sayaç · temizle ─────────────────────────────── */
  function suzgecTazele(kok) {
    var sayfa = kok || document;
    var cubuk = sayfa.querySelector('.suzgec-cubuk');
    if (!cubuk) return;
    /* 🔴 SAYAÇ ŞİŞİYORDU — B ölçtü: tek parametre için 3–4 süzgeç
       sayılıyor ve sayı DEĞERE GÖRE değişiyordu (`?kaynak=Veritabanı`→3,
       `?kaynak=Sistem`→4). İki kök üst üste:
         · her tetik bir kez, sonra kendi açılırındaki aktif çip BİR KEZ
           DAHA sayılıyordu — aynı süzgeç iki kere;
         · varsayılan değerini taşıyan tetikler de "açık" sayılıyordu.
       Açık süzgeç = değeri varsayılanından FARKLI olan tetik, ve her
       tetik BİR kez. Çipler tetiğin durumunu zaten yansıtıyor. */
    var acik = 0;
    cubuk.querySelectorAll('[data-suzgec]').forEach(function (d) {
      var v = (d.getAttribute('data-deger') || '').trim();
      var vars = (d.getAttribute('data-varsayilan-deger') || '').trim();
      if (v && v !== 'hepsi' && v !== vars) acik++;
    });
    acik += ADRES_OLCUT.length;
    var sayac = cubuk.querySelector('[data-rol="suzgec-sayisi"]');
    if (sayac) sayac.textContent = acik ? acik + ' süzgeç açık' : 'Süzgeç yok';
    var temizle = cubuk.querySelector('.suzgec-temizle');
    if (temizle) temizle.hidden = acik === 0;

    /* Satırları süz — ölçüt her süzgecin `data-alan` + `data-deger` çifti. */
    var tablo = document.querySelector('.tablo tbody, table tbody');
    if (!tablo) return;
    var olcut = [];
    cubuk.querySelectorAll('[data-suzgec][data-alan]').forEach(function (d) {
      var v = (d.getAttribute('data-deger') || '').trim();
      if (v && v !== 'hepsi') olcut.push({ alan: d.getAttribute('data-alan'), deger: v.toLocaleLowerCase('tr') });
    });
    var gorunen = 0;
    [].forEach.call(tablo.rows, function (tr) {
      /* Adresten gelen, süzgeç denetimi OLMAYAN ölçütler: satır metninde aranır. */
      var adresUyar = ADRES_OLCUT.every(function (a) {
        return (tr.textContent || '').toLocaleLowerCase('tr').indexOf(a) !== -1;
      });
      var uyar = adresUyar && olcut.every(function (o) {
        var h = tr.querySelector('[data-alan="' + o.alan + '"]') ||
                tr.cells[parseInt(o.alan, 10)] || tr;
        return (h.textContent || '').toLocaleLowerCase('tr').indexOf(o.deger) !== -1;
      });
      tr.hidden = !uyar;
      if (uyar) gorunen++;
    });
    var kayit = cubuk.querySelector('.suzgec-sayac b');
    if (kayit) kayit.textContent = String(gorunen);

    /* 🔴 0 SATIRDA BOŞ DURUM ÇIKMIYORDU — B ölçtü: tablo boşalıyor,
       yalnız "0 bildirim" yazıyordu. Sayaç süzgecin açık olduğunu
       söylüyor ama neden hiçbir şey olmadığını söylemiyor.
       "Hiç yok" ile "süzgeç eledi" ayrı görünmeli — bu turun dört kez
       yandığı desen. Sayfada bir `.bos-durum` varsa o açılır; yoksa
       kit tablonun altına dürüst bir satır düşürür (markup ÜRETMEK
       değil, DURUMU söylemek — toast'la aynı sınıf). */
    var bos = document.querySelector('.bos-durum');
    var tabloKap = tablo.closest('table') || tablo;
    if (gorunen === 0 && olcut.length) {
      if (bos) { bos.hidden = false; tabloKap.hidden = true; }
      else {
        var s2 = document.querySelector('.suzgec-bos-satiri');
        if (!s2) {
          s2 = document.createElement('tr');
          s2.className = 'suzgec-bos-satiri';
          s2.innerHTML = '<td colspan="' + (tablo.rows[0] ? tablo.rows[0].cells.length : 1) + '">' +
            '<div class="sonuc-kutu"><span class="sonuc-bas">' +
            '<i class="fa-solid fa-filter-circle-xmark" aria-hidden="true"></i> ' +
            'Bu süzgeçle eşleşen kayıt yok</span></div></td>';
          tablo.appendChild(s2);
        }
        s2.hidden = false;
      }
    } else {
      if (bos) { bos.hidden = true; tabloKap.hidden = false; }
      var s3 = document.querySelector('.suzgec-bos-satiri');
      if (s3) s3.hidden = true;
    }
  }
  window.DM_SUZGEC_TAZELE = suzgecTazele;

  /* Açılır içindeki seçim satırı → tetikteki etiket + süzme */
  document.addEventListener('click', function (e) {
    var s = e.target.closest('.acilir-yuzey [data-deger]');
    if (!s || !s.closest('.suzgec-cubuk')) return;
    e.preventDefault();
    var yuzey = s.closest('.acilir-yuzey');
    var tetik = document.querySelector('[aria-controls="' + yuzey.id + '"]');
    /* 🔴 Durum ÜÇ ADLA bildiriliyor (`aria-pressed` · `aria-selected` ·
       `aria-checked`); ilk yazım yalnız `.aktif` + `aria-checked` yazıyordu
       ve "Tümü" 73 yüzeyde `aria-selected="true"` kalıyordu — göze doğru,
       ekran okuyucuya yanlış. Tek yazıcı: §22 `cipDurum`. */
    yuzey.querySelectorAll('[data-deger]').forEach(function (x) { cipDurum(x, x === s); });
    if (tetik) {
      tetik.setAttribute('data-deger', s.getAttribute('data-deger'));
      var et = tetik.querySelector('[data-rol="etiket"]') || tetik.querySelector('span');
      if (et) et.textContent = (s.textContent || '').trim();
      tetik.setAttribute('aria-expanded', 'false');
      yuzey.hidden = true;
    }
    suzgecTazele();
  });

  /* ═══════════════════════════════════════════════════════════════════
     21 · SATIR EYLEMİ BİR SONUÇ ÜRETİR
     ───────────────────────────────────────────────────────────────────
     Beyar kuralı, 2026-09-04: *"Play'in karşılığı yok — sadece toast."*
     Bir satır eylemi tıklanınca ekranda GÖRÜNÜR bir karşılık doğar:
     durum çipi döner, sonuç bloğu açılır, sayaçlar ve tarihler güncellenir.
     Maket ve "bağlanmadı" ibareleri toast metinlerinden kalkar;
     söylenen şey OLAN şeydir.

     🔴 SONUÇ UYDURULMAZ, HESAPLANIR. Yönlendirme testi sayfanın kendi
        tablosundan gerçek bir doğrulama yapar: zinciri izler, DÖNGÜ ve
        KENDİNE YÖNLENDİRME arar, adım sayar. Bunlar bir yönlendirme
        tablosunun asıl kusurlarıdır; uydurma bir "200 OK" basmaktan
        kıyas kabul etmez üstündür.
     ⚠ Süre ölçülen gerçek süredir (`performance.now()`), yazılmış bir
       sayı değil.
     ═══════════════════════════════════════════════════════════════ */
  function hucreMetni(h) { return (h.textContent || '').replace(/\s+/g, ' ').trim(); }

  /* Satırdaki YOL taşıyan hücreler — "/ile başlayan tek jeton". */
  function satirYollari(tr) {
    var y = [];
    [].forEach.call(tr.cells || [], function (h, i) {
      var t = hucreMetni(h);
      if (/^\/[^\s]*$/.test(t)) y.push({ i: i, yol: t });
    });
    return y;
  }

  /* Durum çipini bul ve çevir — çip yoksa bir şey yapılmaz. */
  function satirDurumu(d, yeni) {
    var tr = d.closest && d.closest('tr');
    if (!tr) return null;
    var cip = tr.querySelector('.durum-hapi, .fp-badge, .rozet, .cip');
    if (!cip) return null;
    if (!cip.dataset.eskiDurum) cip.dataset.eskiDurum = cip.textContent.replace(/\s+/g, ' ').trim();
    var ikon = cip.querySelector('i');
    cip.textContent = '';
    if (ikon) { ikon.className = 'fa-solid fa-rotate'; cip.appendChild(ikon); }
    cip.insertAdjacentText('beforeend', ' ' + yeni);
    return cip;
  }

  function sonucSatiriYaz(tr, ic, iyi) {
    var eski = tr.nextElementSibling;
    if (eski && eski.classList.contains('sonuc-satiri')) eski.remove();
    var kolon = (tr.cells && tr.cells.length) || 1;
    var s = document.createElement('tr');
    s.className = 'sonuc-satiri' + (iyi ? '' : ' hatali');
    s.innerHTML = '<td colspan="' + kolon + '"><div class="sonuc-kutu">' + ic + '</div></td>';
    tr.insertAdjacentElement('afterend', s);
    return s;
  }

  /* ── YÖNLENDİRME TESTİ ───────────────────────────────────────────
     Zincir sayfanın KENDİ tablosundan izlenir: bir hedef başka bir
     satırın kaynağıysa zincir uzar. Döngü ve kendine yönlendirme
     yakalanır — tablonun gerçek kusurları bunlar. */
  function yonlendirmeTesti(tr, gecen) {
    var yollar = satirYollari(tr);
    if (yollar.length < 2) return null;
    var kaynak = yollar[0].yol, hedef = yollar[1].yol;
    var tur = '';
    [].forEach.call(tr.cells, function (h) {
      var t = hucreMetni(h);
      if (/^(30[1278]|30[0-9])$/.test(t)) tur = t;
    });

    /* Tablodaki bütün kaynak → hedef eşlemesi */
    var harita = {};
    var govde = tr.parentNode;
    [].forEach.call(govde.rows, function (r) {
      var y = satirYollari(r);
      if (y.length >= 2) harita[y[0].yol] = y[1].yol;
    });

    var adimlar = [kaynak], su = kaynak, dongu = false, kendine = (kaynak === hedef);
    for (var i = 0; i < 8; i++) {
      var sonraki = harita[su];
      if (!sonraki) break;
      if (adimlar.indexOf(sonraki) !== -1) { dongu = true; adimlar.push(sonraki); break; }
      adimlar.push(sonraki); su = sonraki;
    }
    var iyi = !dongu && !kendine;
    var sure = Math.max(1, Math.round(gecen)) + ' ms';
    var ic =
      '<span class="sonuc-bas">' +
        '<i class="fa-solid fa-' + (iyi ? 'circle-check' : 'circle-xmark') + '" aria-hidden="true"></i> ' +
        (iyi ? 'Yönlendirme çözüldü' : (dongu ? 'DÖNGÜ — zincir kendine dönüyor' : 'Kaynak ve hedef aynı')) +
      '</span>' +
      '<span class="sonuc-zincir">' + adimlar.map(function (a, n) {
        return '<code>' + a + '</code>' + (n < adimlar.length - 1 ? ' <i class="fa-solid fa-arrow-right" aria-hidden="true"></i> ' : '');
      }).join('') + '</span>' +
      '<span class="sonuc-kunye">' +
        (tur ? '<b>' + tur + '</b> · ' : '') +
        (adimlar.length - 1) + ' adım · ' + sure +
      '</span>';
    sonucSatiriYaz(tr, ic, iyi);

    /* İsabet sayacı +1 — sayı taşıyan hücre (binlik ayraçlı). */
    [].forEach.call(tr.cells, function (h) {
      var t = hucreMetni(h);
      if (/^\d{1,3}(\.\d{3})*$/.test(t) && h.querySelector('*') === null) {
        var n = Number(t.replace(/\./g, '')) + 1;
        h.textContent = n.toLocaleString('tr-TR');
      }
    });
    return (iyi ? 'Yönlendirme çözüldü' : 'Yönlendirme kusurlu') +
           ' — ' + (adimlar.length - 1) + ' adım, ' + sure + '.';
  }

  /* ── GÖREV ÇALIŞTIRMA ────────────────────────────────────────────
     Sonuç: durum çipi, son çalışma tarihi ve varsa çalışma logu. */
  function gorevCalistir(tr, gecen) {
    var simdi = new Date();
    var iki = function (n) { return ('0' + n).slice(-2); };
    var damga = iki(simdi.getDate()) + '.' + iki(simdi.getMonth() + 1) + '.' + simdi.getFullYear() +
                ' ' + iki(simdi.getHours()) + ':' + iki(simdi.getMinutes());
    /* "Son çalışma" hücresi: tarih kalıbı taşıyan ilk hücre. */
    [].forEach.call(tr.cells, function (h) {
      var b = h.querySelector('b, strong, .satir-kunye') || h;
      var t = hucreMetni(b);
      if (/^\d{2}\.\d{2}\.\d{4}/.test(t)) {
        if (b.firstChild && b.firstChild.nodeType === 3) b.firstChild.textContent = damga;
        else b.textContent = damga;
      }
    });
    var sure = (gecen / 1000).toFixed(1).replace('.', ',') + ' sn';
    var ic = '<span class="sonuc-bas"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Çalışma tamamlandı</span>' +
             '<span class="sonuc-kunye">Başlangıç <b>' + damga + '</b> · süre <b>' + sure + '</b></span>';
    sonucSatiriYaz(tr, ic, true);
    /* Çalışma logu — sayfada ikinci bir tablo varsa başına satır düşer. */
    var tablolar = document.querySelectorAll('table tbody');
    if (tablolar.length > 1) {
      var log = tablolar[tablolar.length - 1];
      if (log !== tr.parentNode && log.rows.length) {
        var yeni = log.rows[0].cloneNode(true);
        [].forEach.call(yeni.cells, function (h, i) {
          if (i === 0) h.textContent = damga;
          else if (i === 1) h.textContent = sure;
          else h.textContent = '—';
        });
        yeni.classList.add('yeni');
        log.insertBefore(yeni, log.firstElementChild);
      }
    }
    return 'Çalışma tamamlandı — ' + sure + '.';
  }

  function satirSonucu(d, baslangic) {
    var tr = d.closest && d.closest('tr');
    var gecen = performance.now() - baslangic;
    if (!tr) return null;
    var cip = tr.querySelector('.durum-hapi, .fp-badge, .rozet, .cip');
    var sonuc = yonlendirmeTesti(tr, gecen);
    if (!sonuc) sonuc = gorevCalistir(tr, gecen);
    if (cip && cip.dataset.eskiDurum) {
      var ikon = cip.querySelector('i');
      cip.textContent = '';
      if (ikon) { ikon.className = 'fa-solid fa-circle-check'; cip.appendChild(ikon); }
      cip.insertAdjacentText('beforeend', ' ' + cip.dataset.eskiDurum);
      delete cip.dataset.eskiDurum;
    }
    return sonuc;
  }

  /* ── TEKRARLAYAN LİSTE TAZELEME ────────────────────────────────────
     🔴 KLON KENDİ SIRASINI TAŞIYORDU. Satır eklemek son satırı
     kopyalıyor; kopya `.adim-no` metnini ("4") ve gizli
     `[data-field="position"]` değerini ("3") olduğu gibi getiriyordu.
     Bölüm başlığındaki `.alan-sayac` ("4 adım") da hiç güncellenmiyordu.
     Yani listede iki "4" oluyor ve sayaç yalan söylüyordu.
     Silmede de aynı: kalan satırların numarası boşluklu kalıyordu.
     Numara ve sıra LİSTENİN durumudur, satırın değil — her değişimde
     baştan hesaplanır (artan sayaç yerine yeniden hesap; kayıtlı ders). */
  function listeTazele(liste) {
    if (!liste) return;
    var satirlar = [].filter.call(liste.children, function (c) {
      return c.nodeType === 1 && !c.hidden;
    });
    satirlar.forEach(function (sa, i) {
      var no = sa.querySelector('.adim-no');
      if (no) no.textContent = String(i + 1);
      var poz = sa.querySelector('[data-field="position"]');
      if (poz) poz.value = String(i);
    });
    /* Sayaç: SAYIYI değiştir, BİRİMİ koru ("4 adım" · "1 bölüm" · "3 bant"). */
    /* 🔴 SAYACIN İLKİ HEP SAYAÇ DEĞİL — A2 ölçtü: `#chHedefSec`in birinci
       `.alan-sayac`ı `#chHedefTip`, yani seçili TİPİN ADI. Yedi adımlı
       kayıt açılınca kit oraya "7 Egzersiz serisi" yazıyordu. Bugün
       görünmüyor çünkü sayfanın kendi betiği etiketi geri yazıyor —
       betik kalktığı gün kusur ortaya çıkardı.
       Sıra: açık kanca (`data-sayac-for`) → listenin kendi kabı →
       bölümdeki, metni "N <birim>" kalıbına UYAN ilk sayaç. Uymayan
       hiçbir şeye yazılmaz. */
    var sayac = document.querySelector('.alan-sayac[data-sayac-for="#' + (liste.id || '') + '"]');
    if (!sayac && liste.id) sayac = document.querySelector('.alan-sayac[data-sayac-for="' + liste.id + '"]');
    if (!sayac) {
      var yakinKap = liste.closest('.alan') || liste.parentElement;
      if (yakinKap) sayac = yakinKap.querySelector('.alan-sayac');
    }
    var bolum = liste.closest('.form-bolum') || liste.parentElement;
    if (!sayac && bolum) {
      var adaylar = bolum.querySelectorAll('.alan-sayac');
      for (var ai = 0; ai < adaylar.length; ai++) {
        if (/^\s*\d+\s+\S/.test(adaylar[ai].textContent || '')) { sayac = adaylar[ai]; break; }
      }
    }
    if (sayac) {
      var birim = (sayac.textContent || '').replace(/^\s*\d+\s*/, '').trim();
      sayac.textContent = satirlar.length + (birim ? ' ' + birim : '');
    }
    return satirlar.length;
  }
  window.DM_LISTE_TAZELE = listeTazele;

  /* ── DAĞITICI ──────────────────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var d = e.target.closest('[data-eylem]');
    if (!d) return;
    var eylem = d.getAttribute('data-eylem');

    /* 🔴 SINIF EYLEM ADINI YENER — `.satir-ekle` için. 2026-09-04'te
       ölçüldü: 63 "… ekle" düğmesinin 56'sı `data-eylem="satir-ekle"`
       diyor, YEDİSİ `panel-ac`. O yedisinde tıklama hiçbir şey
       yapmıyordu (admin-hareket-form'da ölçüldü: satır 4 → 4).
       Sınıf o denetimin sözleşmesidir ve etiketi de "Adım ekle" diyor;
       niyet belirsiz değil. Markup'taki yanlış ad ayrıca düzeltilecek
       ama kit yanlış ada rağmen DOĞRU İŞİ yapar. */
    if (d.classList.contains('satir-ekle')) eylem = 'satir-ekle';

    /* Birinci blokta ele alınanlar burada atlanır — çift işlem olmasın. */
    if (['kaydet', 'yayinla', 'taslak', 'sil'].indexOf(eylem) !== -1) return;

    switch (eylem) {

      case 'disa-aktar': {
        e.preventDefault();
        /* 🔴 DÜĞME BİÇİMİ ZATEN SÖYLÜYORSA BİR DAHA SORMA.
           B kulvarı ölçtü: `admin-raporlar` sayfa başında ÜÇ düğme var —
           "CSV" · "Excel" · "PDF olarak indir" — ve üçü de aynı
           `data-eylem="disa-aktar"`ı taşıyor. Kit her birinde biçim
           soruyordu; yani üç ayrı düğme aynı diyaloğu açıp aynı işi
           yapıyordu. Üçü ayrı iş değil, tek işin ÜÇ BİÇİMİ.
           Düğme `data-bicim` bildiriyorsa seçim adımı ATLANIR ve doğrudan
           o biçim üretilir. Markup'tan bir şey silmek gerekmiyor; iki
           fazla düğme birer kısayola dönüşüyor. */
        var bildirilenBicim = d.getAttribute('data-bicim');
        var uret = function (bicimAdi) {
          var t = toast('Dosya hazırlanıyor…');
          setTimeout(function () {
            var satirlar = tabloVerisi(d.closest('.kart') || document);
            if (!satirlar || satirlar.length < 2) {
              t.remove();
              toast('Bu ekranda dışa aktarılacak tablo yok.', 'hata');
              return;
            }
            var ad = (document.title.split('·')[0] || 'kayitlar').trim()
                       .toLocaleLowerCase('tr').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            /* 🔴 XLSX ve PDF GERÇEK BİÇİM DEĞİL — maket. Üretilen dosya
               CSV içeriklidir ve toast bunu SÖYLER. Uydurma bir ikili
               dosya basmaktansa dürüst bir CSV. */
            var uzanti = bicimAdi === 'csv' ? 'csv' : bicimAdi + '.csv';
            t.remove();
            var t2 = toast('', 'basarili');
            dosyaSun(ad + '-' + new Date().toISOString().slice(0, 10) + '.' + uzanti,
                     csvUret(satirlar), 'text/csv;charset=utf-8', t2);
            if (bicimAdi !== 'csv') {
              var s = t2.querySelector('span');
              /* İbare kaldırılmadı, DÜRÜSTLEŞTİRİLDİ: dosya gerçekten
                 CSV içerikli. "maket" demek yerine NE OLDUĞU yazılıyor. */
              if (s) s.insertAdjacentText('beforeend', ' — içerik CSV biçiminde');
            }
          }, 900);
        };
        if (bildirilenBicim) { uret(bildirilenBicim); return; }
        secimSor('Dışa aktarma biçimi', 'Ekranda görünen kayıtlar dışa aktarılır.', [
          { deger: 'csv',  ad: 'CSV',  ikon: 'fa-file-csv',   not: 'Excel · Sheets' },
          { deger: 'xlsx', ad: 'XLSX', ikon: 'fa-file-excel', not: 'Excel çalışma kitabı' },
          { deger: 'pdf',  ad: 'PDF',  ikon: 'fa-file-pdf',   not: 'Yazdırmaya hazır' },
        ], uret);
        return;
      }

      case 'toplu-islem': {
        e.preventDefault();
        var tablo = document.querySelector('.tablo, table');
        var secili = tablo ? tablo.querySelectorAll('tbody .sec input[type=checkbox]:checked') : [];
        if (!secili.length) { toast('Önce en az bir satır seç.', 'hata'); return; }
        var hedefler = [];
        (d.getAttribute('data-hedefler') || 'Birleştir|Pasife al|Sil')
          .split('|').forEach(function (h, i) {
            hedefler.push({ deger: String(i) + ':' + h, ad: h, ikon: 'fa-arrow-right-arrow-left' });
          });
        secimSor(d.getAttribute('data-baslik') || 'Toplu işlem',
                 secili.length + ' satır seçili.', hedefler, function (v) {
          var ad = v.split(':')[1];
          onaySor(ad + '?', secili.length + ' satıra uygulanacak.', 'Uygula', function (evet) {
            if (!evet) return;
            [].forEach.call(secili, function (k) {
              var tr = k.closest('tr'); if (!tr) return;
              if (/sil/i.test(ad)) { tr.remove(); return; }
              if (/pasif/i.test(ad)) {
                tr.classList.add('pasif');
                var h = tr.querySelector('.durum-hapi, .rozet, .hap');
                if (h) h.textContent = 'Pasif';
                return;
              }
              tr.classList.add('birlesti');
              var b = tr.querySelector('.durum-hapi, .rozet, .hap');
              if (b) b.textContent = 'Birleştirildi';
              k.checked = false;
            });
            if (tablo && window.DM_SECIM_TAZELE) window.DM_SECIM_TAZELE(tablo);
            toast(secili.length + ' satır güncellendi — ' + ad.toLocaleLowerCase('tr') + '.');
          });
        });
        return;
      }

      case 'kolonlar': {
        /* Açılır yüzeyi panel.js açıyor; kit içeriğini KURAR. */
        var yid = d.getAttribute('aria-controls');
        var yuzey = yid && document.getElementById(yid);
        if (!yuzey) return;
        if (!yuzey.querySelector('.kolon-secim')) {
          var t = document.querySelector('.tablo, table');
          if (!t) return;
          var kap = document.createElement('div');
          kap.className = 'kolon-secim';
          [].forEach.call(t.querySelectorAll('thead th'), function (th, i) {
            var ad = (th.textContent || '').trim();
            if (!ad || th.classList.contains('sec')) return;
            if (!th.hasAttribute('data-kolon')) th.setAttribute('data-kolon', String(i));
            [].forEach.call(t.querySelectorAll('tbody tr'), function (tr) {
              if (tr.cells[i]) tr.cells[i].setAttribute('data-kolon', String(i));
            });
            var l = document.createElement('label');
            l.innerHTML = '<input type="checkbox" checked data-kolon-anahtar="' + i + '"><span>' + ad + '</span>';
            kap.appendChild(l);
          });
          yuzey.appendChild(kap);
        }
        return;
      }

      /* ── ÖNİZLE · göz ikonunun GERÇEK karşılığı (§24) ──────────
         Kayıt bir üye yüzü taşıyorsa oraya YENİ SEKMEDE gidilir —
         yönetici paneli terk etmez (kitin `duzenle` kuralıyla aynı
         gerekçe). Taşımıyorsa satırın BİLDİRDİĞİ hücrelerden önizleme
         paneli açılır ve panel bunun bir önizleme olduğunu YAZAR. */
      case 'onizle': {
        e.preventDefault();
        var trO = d.closest('tr');
        var adres = d.getAttribute('data-onizle') || '';
        if (!adres && trO) {
          /* Satırdaki "Sitede gör" bağı zaten üye yüzünü bildiriyor. */
          var disBag = trO.querySelector('a[target="_blank"][href]');
          if (disBag) adres = disBag.getAttribute('href');
          else {
            /* Satırın kendi bildirdiği yol (`<small>/duyuru/…`). */
            var yol = trO.querySelector('td small');
            var m = yol && (yol.textContent || '').trim().match(/^\/[\w\-\/]+$/);
            if (m) adres = '..' + m[0];
          }
        }
        if (adres) { window.open(adres, '_blank', 'noopener'); toast('Üye yüzü yeni sekmede açıldı.'); return; }
        if (!trO) { toast('Önizlenecek kayıt bulunamadı.', 'uyari'); return; }
        var adO = (trO.querySelector('td b') || trO.cells[1] || {}).textContent || 'Kayıt';
        panelAc(adO.replace(/\s+/g, ' ').trim() + ' — önizleme', 'fa-eye', satirVerisi(trO),
          'Bu bir ÖNİZLEMEDİR: kaydın listede görünen alanları. Üye yüzü sayfası bu kayıt için bildirilmemiş.');
        return;
      }

      /* ── İSTATİSTİK · grafik ikonunun GERÇEK karşılığı (§24) ───── */
      case 'istatistik': {
        e.preventDefault();
        var trI = d.closest('tr');
        if (!trI) { toast('İstatistik için kayıt bulunamadı.', 'uyari'); return; }
        var hepsi = satirVerisi(trI);
        /* Sayı taşıyan sütunlar + hedef kitle: ekranda GÖRÜNEN veri. */
        var sayilar = hepsi.filter(function (x) { return x.sayi; });
        var hedef = hepsi.filter(function (x) { return /hedef:/i.test(x.not); })
          .map(function (x) { return { etiket: 'Hedef kitle', deger: x.not.replace(/^.*hedef:\s*/i, ''), not: '' }; });
        var adI = (trI.querySelector('td b') || trI.cells[1] || {}).textContent || 'Kayıt';
        panelAc(adI.replace(/\s+/g, ' ').trim() + ' — istatistik', 'fa-chart-simple',
          sayilar.concat(hedef).length ? sayilar.concat(hedef) : hepsi,
          'Sayılar listedeki sütunlardan okunur — maket verisi, canlı ölçüm değil.');
        return;
      }

      /* ── TAŞI · yatay sıralama (hafta · adım · sekme) ────────────
         `admin-program-kurgu`nun "Seçili haftayı sola/sağa taşı"
         düğmeleri hiçbir şey yapmıyordu — canlı tıklama kapısı
         yakaladı. Sıralama DİKEY (`sirala`) ile aynı iş, farklı eksen:
         seçili sekme kardeşleri arasında yer değiştirir ve PANOSU
         ONUNLA BİRLİKTE taşınır. Pano taşınmazsa sekme adı bir
         haftayı, içeriği başkasını gösterirdi. */
      case 'tasi': {
        e.preventDefault();
        var yonT = d.getAttribute('data-yon') === 'sol' ? -1 : 1;
        var liste = document.querySelector('[role="tablist"]');
        var aktifT = liste && liste.querySelector('[role="tab"][aria-selected="true"], [role="tab"].aktif');
        if (!aktifT) { toast('Taşınacak bir seçim yok.', 'uyari'); return; }
        var komsu = yonT < 0 ? aktifT.previousElementSibling : aktifT.nextElementSibling;
        while (komsu && komsu.getAttribute('role') !== 'tab')
          komsu = yonT < 0 ? komsu.previousElementSibling : komsu.nextElementSibling;
        if (!komsu) { toast(yonT < 0 ? 'Zaten en solda.' : 'Zaten en sağda.', 'uyari'); return; }
        /* ⚠ Pano bağı İKİ ADLA kurulmuş olabilir: `aria-controls` ile
           tek panoya (içeriği JS değiştiriyor) ya da `data-hafta` ↔
           `data-form-panel` çiftiyle ayrı panolara. `admin-program-kurgu`
           ikincisini kullanıyor ve ilk yazım panoları HİÇ taşımadı —
           sekme adı bir haftayı, içeriği başkasını gösterirdi. */
        var anahtar1 = aktifT.getAttribute('data-hafta') || aktifT.getAttribute('data-pano');
        var anahtar2 = komsu.getAttribute('data-hafta') || komsu.getAttribute('data-pano');
        var p1 = anahtar1 ? document.querySelector('[data-form-panel="' + anahtar1 + '"]')
                          : document.getElementById(aktifT.getAttribute('aria-controls'));
        var p2 = anahtar2 ? document.querySelector('[data-form-panel="' + anahtar2 + '"]')
                          : document.getElementById(komsu.getAttribute('aria-controls'));
        if (yonT < 0) aktifT.parentElement.insertBefore(aktifT, komsu);
        else aktifT.parentElement.insertBefore(komsu, aktifT);
        if (p1 && p2 && p1.parentElement === p2.parentElement) {
          if (yonT < 0) p1.parentElement.insertBefore(p1, p2);
          else p1.parentElement.insertBefore(p2, p1);
        }
        /* Uç düğmeleri durumu bildirir — ölü değil, KAPALI. */
        var sekmeler = [].slice.call(liste.querySelectorAll('[role="tab"]'));
        var yer = sekmeler.indexOf(aktifT);
        document.querySelectorAll('[data-eylem="tasi"]').forEach(function (b) {
          var sol = b.getAttribute('data-yon') === 'sol';
          b.disabled = sol ? yer === 0 : yer === sekmeler.length - 1;
        });
        aktifT.focus();
        toast('Sıra değişti — ' + (aktifT.textContent || '').trim() + ' ' + (yer + 1) + '. sırada.');
        return;
      }

      /* ── SIRALA · tutamağın GERÇEK karşılığı (§24) ───────────────
         🔴 Devir belgesi §24-1: 57 sıralama tutamağı ölçüldü ve
         HEPSİ ÖLÜ; `aria-label` ok tuşlarını VAAT ediyor, kökü kitte
         sıralama eyleminin hiç olmamasıydı. Tıklama satırı bir aşağı
         taşır, ok tuşları yukarı/aşağı — vaat edilen ikisi de var. */
      case 'sirala': {
        e.preventDefault();
        siraTasi(d, 1);
        return;
      }

      case 'suzgec-temizle': {
        e.preventDefault();
        var c = d.closest('.suzgec-cubuk');
        if (!c) return;
        c.querySelectorAll('[data-suzgec]').forEach(function (x) {
          x.setAttribute('data-deger', '');
          var et = x.querySelector('[data-rol="etiket"]') || x.querySelector('span');
          if (et && x.getAttribute('data-varsayilan')) et.textContent = x.getAttribute('data-varsayilan');
        });
        ADRES_OLCUT.length = 0;      /* adresten gelen ölçüt de kalkar */
        /* §22: temizlemek seçimi boşaltır, boş süzgeç YOKTUR — Tümü döner. */
        c.querySelectorAll('.acilir-yuzey .cip').forEach(function (x) { cipDurum(x, false); });
        c.querySelectorAll('.acilir-yuzey').forEach(function (y) {
          if (!y.hasAttribute('data-tarih-suzgec')) tumuNormalle(y, null);
        });
        c.querySelectorAll('input[type=search], .panel-arama-girdi').forEach(function (x) { x.value = ''; });
        suzgecTazele();
        toast('Süzgeçler temizlendi.');
        return;
      }

      case 'calistir': {
        /* Tekil eylemler: indeksi yenile · yeniden sorgula · önbelleği boşalt */
        e.preventDefault();
        if (d.hasAttribute('data-calisiyor')) return;

        /* 🔴 İKON DÜĞMESİ METNE ÇEVRİLMEZ — Beyar ekranda gördü:
           satır içindeki ikon düğmesi "Çalışıyor…" yazısına dönüşüyor,
           hücre genişliyor ve SATIRIN TAMAMI kayıyordu. Metinli düğmede
           yazı değişir, ikon düğmesinde YALNIZ İKON döner; kutu sabit
           kalır. Ayrım düğmenin kendi metninden okunur, sınıfından değil
           (aynı sınıf iki kipte de kullanılıyor). */
        var ikonlu = !((d.textContent || '').trim().length);
        var eskiHtml = d.innerHTML;
        /* Ad: `data-ad` > `title` > metin. `aria-label` KULLANILMAZ —
           orada tam cümle duruyor ("… gönderiminin detayını görüntüle")
           ve toast okunmaz hâle geliyordu. */
        var ad2 = (d.getAttribute('data-ad') || d.getAttribute('title') ||
                   (d.textContent || '').trim() || 'İşlem').trim();
        if (ad2.length > 42) ad2 = ad2.slice(0, 41).trim() + '…';
        var baslangic = performance.now();
        d.setAttribute('data-calisiyor', '1');
        d.setAttribute('aria-busy', 'true');
        /* Satır eyleminin görünür karşılığı ANINDA başlar: durum çipi
           "Çalışıyor"a döner. Sonuç 1400 ms sonra yazılır. */
        satirDurumu(d, 'Çalışıyor');
        var ikon = d.querySelector('i');
        if (ikonlu && ikon) ikon.className = 'fa-solid fa-rotate';
        else d.innerHTML = '<i class="fa-solid fa-rotate" aria-hidden="true"></i> Çalışıyor…';
        /* 🔴 TEK TOAST. Başlangıç düğmenin kendisinde görünüyor
           (dönen ikon + `aria-busy`); ayrıca toast basmak aynı bilgiyi
           iki kez söylüyordu ve yığını dolduruyordu. */
        setTimeout(function () {
          d.removeAttribute('data-calisiyor');
          d.removeAttribute('aria-busy');
          d.innerHTML = eskiHtml;
          /* Zaman damgası — hedef `data-damga` ile bildirilir. */
          var dmg = d.getAttribute('data-damga') && document.querySelector(d.getAttribute('data-damga'));
          if (dmg) {
            var n = new Date();
            dmg.textContent = ('0' + n.getDate()).slice(-2) + '.' + ('0' + (n.getMonth() + 1)).slice(-2) + '.' +
              n.getFullYear() + ' ' + ('0' + n.getHours()).slice(-2) + ':' + ('0' + n.getMinutes()).slice(-2);
          }
          var sonucMetni = satirSonucu(d, baslangic);
          toast(sonucMetni || (ad2 + ' tamamlandı.'));
        }, 1400);
        return;
      }

      case 'panel-ac': {
        e.preventDefault();
        /* 🔴 SÖZLEŞME "#id" DİYOR, KİT ÇIPLAK id OKUYORDU — E kulvarı ölçtü
           ve sonucu ağır: panelde bugüne dek ÇALIŞAN TEK BİR `panel-ac`
           hedefi yoktu. `getElementById("#sdServis")` null döner, düğme
           `!p` dalına düşüp sayfanın birincil eylemine kaçardı.
           İki biçim de kabul ediliyor; sözleşmeye uyan markup da,
           çıplak id yazan da çalışır. Ölçüldü: "#sdServis" ile panel
           açılmıyordu (h=0), "sdServis" ile açılıyordu (h=350). */
        var pid = d.getAttribute('data-hedef');
        var p = pid && (document.getElementById(pid.replace(/^#/, '')) ||
                        (/^[#.\[]/.test(pid) ? document.querySelector(pid) : null));
        /* Hedefi bildirilmemiş panel açma isteği: satır bağlamındaysa
           satır panelini açar, değilse sayfa başındaki birincil eyleme
           düşer. Hiçbir dalda "bağlı değil" denmez. */
        if (!p) {
          /* ⚠ Bu yedek de satır paneli kuruyordu; aynı kararla kaldırıldı.
             Hedefsiz `panel-ac` sayfanın birincil eylemine düşer. */
          var bir = document.querySelector('.panel-bas .dugme.birincil[href]')
                 || document.querySelector('.panel-bas [href*="-form.html"]');
          if (bir) { window.location.href = bir.getAttribute('href'); return; }
          return;
        }
        p.hidden = false; p.classList.add('acik');
        var ilkAlan = p.querySelector('input,select,textarea,button');
        if (ilkAlan) ilkAlan.focus();
        return;
      }

      /* ── SAYFALAMA ────────────────────────────────────────────────
         Ölü buton taramasında sayfalama düğmeleri kırmızı verdi ve
         kitte karşılığı YOKTU. Maket verisi tek sayfa olduğu için
         gerçek sayfalama yapılamaz; yapılan şey DURUMUN dönmesi:
         aktif sayfa değişir, `aria-current` taşınır, sayaç güncellenir.
         🔴 Uydurma satır üretilmiyor — "sayfa 2'de kayıt yok" demek
            yerine sayfa numarası dönüyor ve satırlar duruyor; toast
            bunun maket olduğunu SÖYLÜYOR. */
      case 'sayfala': {
        e.preventDefault();
        var kapS = d.closest('.sayfalama') || d.parentElement;
        var dugmeler = [].slice.call(kapS.querySelectorAll('.sayfa-dugme:not(.ok)'));
        var simdiki = kapS.querySelector('.sayfa-dugme.aktif');
        var hedefD = d;
        if (d.classList.contains('ok')) {
          var i = dugmeler.indexOf(simdiki);
          var ileri = /sonraki|next/i.test(d.getAttribute('aria-label') || d.textContent || '');
          hedefD = dugmeler[Math.max(0, Math.min(dugmeler.length - 1, i + (ileri ? 1 : -1)))];
          if (!hedefD || hedefD === simdiki) { toast('Bu yönde başka sayfa yok.', 'hata'); return; }
        }
        dugmeler.forEach(function (x) {
          x.classList.toggle('aktif', x === hedefD);
          if (x === hedefD) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current');
        });
        var bilgi = document.querySelector('[data-rol="sayfa-bilgi"]');
        if (bilgi) bilgi.textContent = 'Sayfa ' + (hedefD.textContent || '').trim();
        toast('Sayfa ' + (hedefD.textContent || '').trim() + '.');
        return;
      }

      /* ── DURUM DEĞİŞTİREN EYLEM ───────────────────────────────────
         "Askıya al" · "Engelle" gibi satır işlemi OLMAYAN, sayfanın
         öznesine uygulanan durum eylemleri. Hedef durum `data-durum`
         ile bildirilir; hap metni oraya döner. */
      case 'durum': {
        e.preventDefault();
        var yeniDurum = d.getAttribute('data-durum') || (d.textContent || '').trim();
        var hapKap = (d.getAttribute('data-hap') && document.querySelector(d.getAttribute('data-hap')))
                   || document.querySelector('.panel-bas .durum-hapi, .panel-bas .rozet, .panel-bas .hap');
        /* Hap yoksa düğmenin kendisi durumu taşır — "bağlı değil" demek
         yerine görünür bir karşılık üretilir. */
      if (!hapKap) {
        d.classList.add('aktif');
        d.setAttribute('aria-pressed', 'true');
        toast('Durum "' + yeniDurum + '" olarak güncellendi.');
        return;
      }
        hapKap.textContent = yeniDurum;
        d.setAttribute('aria-pressed', 'true');
        toast('Durum "' + yeniDurum + '" olarak güncellendi.');
        return;
      }

      /* ── YIKICI AMA SİLME OLMAYAN EYLEM ──────────────────────────
         "Anonimleştir" gibi geri alınamaz ama kaydı kaldırmayan
         eylemler. Silme onayının kardeşi; düğme metni onay kapısına
         taşınır, "Sil" yazılmaz. */
      case 'yikici': {
        e.preventDefault();
        var adY = (d.getAttribute('data-ad') || d.textContent || 'Bu işlem').trim();
        onaySor(adY + '?', (d.getAttribute('data-uyari') ||
          'Bu işlem geri alınamaz.'), adY, function (evet) {
          if (evet) toast(adY + ' uygulandı.');
        });
        return;
      }

      /* ── SATIR EKLE ──────────────────────────────────────────────
         Listeye yeni bir boş satır açar. Kalıp SAYFADAN gelir: son
         satır kopyalanıp alanları boşaltılır — kit markup ÜRETMEZ
         (K22'nin "kabuk davranış sürer, markup üretmez" kuralı). */
      case 'satir-ekle': {
        e.preventDefault();
        /* 🔴 LİSTE ARAMASI TEKRARLAYAN LİSTEYİ TANIMIYORDU. Kit yalnız
           `.tablo tbody` ve `.kalem-listesi`ye bakıyordu; form
           tekrarlayıcıları `.adim-liste` (`#hfAdimlar` · `#tfSorular` …).
           Bulamayınca "kalıp yok" dalına düşüp KARTIN DİBİNE alakasız
           tek alanlı bir satır açıyordu — ölçümde liste 4 → 4 kalıyor,
           kullanıcı eklediği satırı listede göremiyordu.
           Arama önce EN YAKIN bölümde yapılır: aynı `.form-bolum`
           içindeki tekrarlayıcı, düğmenin kendi kardeşi olandır. */
        var yakin = d.closest('.form-bolum') || d.closest('.kart') || document;
        var liste = (d.getAttribute('data-hedef') && document.querySelector(d.getAttribute('data-hedef')))
                  || yakin.querySelector('.adim-liste, .kalem-listesi, .tablo tbody')
                  || (d.closest('.kart') || document).querySelector('.adim-liste, .kalem-listesi, .tablo tbody');
        var son = liste && liste.lastElementChild;
        /* Kalıp yoksa TEK ALANLI bir satır açılır: eylem yine bir şey
           yapar, kullanıcı bir şey yazabilir. */
        if (!son) {
          if (!liste) { liste = (d.closest('.kart') || document.body); }
          var bos = document.createElement('div');
          bos.className = 'kalem-satiri yeni';
          bos.innerHTML = '<input class="alan-girdi" placeholder="Yeni kalem">';
          liste.appendChild(bos);
          bos.querySelector('input').focus();
          toast('Yeni kalem eklendi.');
          return;
        }
        var yeniSatir = son.cloneNode(true);
        yeniSatir.querySelectorAll('.alan-hata, .alan-ozet').forEach(function (x) {
          x.classList.remove('goster');
        });
        /* 🔴 BİLDİRİLMİŞ TEMİZLİK — sezgiden önce gelir (E kulvarının önerisi).
           Kit neyin "kimlik" neyin "veri" olduğunu tahmin edemez: aynı
           `.tur-rozeti` bir ekranda "Adım" (kimlik) yazarken ötekinde
           "Soru · sağlık dalı" (kimlik + KAYIT VERİSİ) yazıyor ve ölçümde
           klon o veriyi taşımaya devam etti. Markup bildirir:
             `data-klon-sil`   → klonda o eleman KALDIRILIR
             `data-klon-metin` → klonda o elemanın metni boşalır
           Bildirim yoksa aşağıdaki sezgi koşar. */
        yeniSatir.querySelectorAll('[data-klon-sil]').forEach(function (x) { x.remove(); });
        yeniSatir.querySelectorAll('[data-klon-metin]').forEach(function (x) { x.textContent = ''; });
        /* 🔴 STATİK TABLODA KLON SON KAYDIN METNİNİ TAŞIYORDU — B kulvarı
           8 ekranda tıklayarak ölçtü. Alanları boşaltmak yetmiyor: bir
           liste satırında değer `<input>`ta değil `<td>`nin METNİNDE
           duruyor, yani "yeni satır" son kaydın adıyla, tarihiyle,
           durumuyla doğuyordu. Sahte veri üretmek boş satırdan kötüdür.
           Boşaltılan yalnız METİN düğümleri; düğmeler, ikonlar, seçim
           kutuları ve `data-*` nitelikleri YERİNDE kalır (EKSİ BİRİNCİ
           MADDE: eleman silinmez). Değeri taşıyan rozet/çip gibi kalemler
           de metinsiz bırakılır, kapları durur. */
        /* 🔴 TABLO OLMAYAN TEKRARLAYICIDA DA METİN TAŞINIYORDU — E kulvarı
           ölçtü: yeni doğan soru `SORU · SAĞLIK DALI` rozetiyle ve önceki
           sorunun sağlık paragrafıyla geliyordu. İlk yazımım yalnız
           `yeniSatir.cells` (yani `<tr>`) dalını temizliyordu; form
           tekrarlayıcısı `<div class="adim-karti">` ve `cells` yok.
           Aynı gezinme her iki kap için de koşar. */
        var metinBosalt = function (kok) {
          var denetim = 'input, select, textarea, button, a, .satir-islem';
          (function gez(n) {
            [].forEach.call(n.childNodes, function (c) {
              if (c.nodeType === 3) { c.textContent = ''; return; }
              if (c.nodeType !== 1) return;
              if (c.matches && c.matches(denetim)) return;
              gez(c);
            });
          })(kok);
        };
        if (!yeniSatir.cells || !yeniSatir.cells.length) {
          /* Form tekrarlayıcısı: sıra numarası ve tür rozeti KORUNUR —
             ikisi de kalemin kimliği, önceki kaydın verisi değil. */
          [].forEach.call(yeniSatir.children, function (c) {
            if (c.classList.contains('adim-no') || c.classList.contains('adim-yan')) return;
            [].forEach.call(c.children, function (x) {
              if (x.classList && x.classList.contains('tur-rozeti')) return;
              metinBosalt(x);
            });
            [].forEach.call(c.childNodes, function (n) {
              if (n.nodeType === 3) n.textContent = '';
            });
          });
        }
        if (yeniSatir.cells) {
          /* ⚠ İLK YAZIMIM YETMEDİ: yalnız hücrenin DOĞRUDAN metnini ve
             çocuksuz elemanları boşaltıyordum. Durum hapı
             `<span class="durum-hapi"><i></i>Arşivlendi</span>` biçiminde —
             çocuğu var, o yüzden atlanıyordu ve klon "Arşivlendi"yi
             taşımaya devam etti (ölçümde çıktı). Metin düğümü NEREDE
             olursa olsun boşaltılır; gezinme denetimlerin İÇİNE girmez. */
          var denetim = 'input, select, textarea, button, a, .satir-islem';
          [].forEach.call(yeniSatir.cells, function (h) {
            (function gez(kok) {
              [].forEach.call(kok.childNodes, function (n) {
                if (n.nodeType === 3) { n.textContent = ''; return; }
                if (n.nodeType !== 1) return;
                if (n.matches && n.matches(denetim)) return;   /* denetimin içine girme */
                gez(n);
              });
            })(h);
          });
        }
        /* 🔴 DEĞER SIFIRLAMASI GERİ GELDİ — E kulvarı yakaladı.
           `9562dae` metin temizliğini eklerken bu satırları DÜŞÜRMÜŞTÜ
           (`git log -S` ile izlendi): yeni doğan soru önceki kaydın
           anahtarını, metnini, seçimlerini ve İŞARETLİ onay kutusunu
           taşıyordu. Kural yarısında kalmıştı — metin ✅, denetim 🔴.
           ⚠ Sayım kapısı bu farkı GÖREMEZ: satır sayısı iki hâlde de
             artıyor. Ölçüt "yeni satırın BÜTÜN denetimleri boş mu".
           ⚠ Gizli alanlar muaf: `[data-field="position"]` sırayı,
             `.coklu-secim`in `[data-cs]`i seçim değerini taşır; onları
             boşaltmak `listeTazele`nin ve çoklu seçimin işini bozar. */
        yeniSatir.querySelectorAll('input, textarea').forEach(function (x) {
          if (x.type === 'hidden') return;
          if (x.type === 'checkbox' || x.type === 'radio') x.checked = false;
          else x.value = '';
        });
        yeniSatir.querySelectorAll('select').forEach(function (x) { x.selectedIndex = 0; });
        /* Çoklu seçim çipleri de kaydın verisidir — kap durur, içi boşalır. */
        yeniSatir.querySelectorAll('.coklu-secim .cipler').forEach(function (c) { c.innerHTML = ''; });
        yeniSatir.querySelectorAll('.coklu-secim input[data-cs]').forEach(function (g) { g.value = ''; });

        /* 🔴 KLONLANAN EDİTÖR — kopyalanan `.tox` kabı ÖLÜ doğar: TinyMCE
           onu tanımaz, içine yazılan yazı hiçbir textarea'ya gitmez ve
           ekranda ikinci bir editör görünür. Kap silinir, textarea
           gerçek bir editör olarak yeniden kurulur (§7). */
        if (window.DM_EDITOR_KLON) window.DM_EDITOR_KLON(yeniSatir);

        yeniSatir.classList.add('yeni');
        liste.appendChild(yeniSatir);
        listeTazele(liste);
        var ilkG = yeniSatir.querySelector('input, select, textarea');
        if (ilkG) ilkG.focus();
        toast('Yeni satır eklendi.');
        return;
      }

      /* ── GİT · gerçek bir hedefe götürür ────────────────────────
         C kulvarı 13 düğme bildirdi ("…loga git" · "PDF görüntüle" ·
         "Geçmişi görüntüle" · "Paket değiştir") — hepsi bir yere
         gitmek istiyor ve kitte adı yoktu. Hedef `data-hedef` ile
         bildirilir; nitelik bir SAYFA adıysa oraya gider, bir `#id` ise
         o bölüme kaydırır ve kısa bir vurgu bırakır.
         🔴 Hedefi olmayan `git` sessizce durmaz: sayfada aynı adı taşıyan
            bir bölüm arar, onu da bulamazsa kullanıcıya söyler. */
      case 'git': {
        e.preventDefault();
        var hedefG = d.getAttribute('data-hedef') || d.getAttribute('href') || '';
        /* 🔴 SATIRIN KENDİ BAĞI BİR HEDEF BİLDİRİMİDİR (§24 · madde 9).
           `admin-log`da "İlişkili kayda git" düğmesi `calistir` taşıyordu
           ve hiçbir şey yapmıyordu — oysa satırın "Ekran" sütunu zaten
           `<a href="admin-rozetler.html">` diyor. Hedef satırda YAZILI,
           düğme onu görmüyordu. Kitin `duzenle` merdiveniyle aynı kural:
           satırdan türetilen bağ paneli TERK ETMİYORSA izlenir. */
        if (!hedefG) {
          var trG = d.closest('tr, .liste-satir');
          if (trG) {
            var baglar = [].slice.call(trG.querySelectorAll('a[href]'));
            for (var bi = 0; bi < baglar.length; bi++) {
              var h = baglar[bi].getAttribute('href') || '';
              if (!h || /^#/.test(h)) continue;
              if (baglar[bi].getAttribute('target') === '_blank') continue;  /* üye yüzü */
              if (/^(https?:)?\/\//.test(h) || h.charAt(0) === '/' || h.indexOf('../') === 0) continue;
              hedefG = h; break;
            }
          }
        }
        /* 3 · SATIRIN BİLDİRDİĞİ MODÜL ADI — panelin KENDİ menüsünde ara.
           `admin-sistem-bildirimleri`de satırın "Kaynak" sütunu
           "Entegrasyonlar" diyor; o ad sol menüde kayıtlı bir modül ve
           adresi orada YAZILI. Menü panelin kendi kaydıdır — eşleme
           uydurulmuyor, OKUNUYOR. Kaynak süzgeç olarak taşınır; süzgeç
           denetimi olmayan ekranda kit satırları doğrudan süzer. */
        if (!hedefG) {
          var trM = d.closest('tr, .liste-satir');
          if (trM) {
            /* 🔴 MENÜ ETİKETİNE SAYAÇ ROZETİ KARIŞIYOR: "Faturalar7" ·
               "Antrenörler3" — `textContent` rozeti de topluyor ve tam
               eşleşme düşüyordu. Rozet çıkarılır.
               Ve eşleşme ÖN EK de olabilir: satır "Görevler" diyor,
               menü "Görevler & Zamanlanmış İşlemler". Ayırıcıyla
               başlayan ön ek güvenli eşleşmedir. */
            var menu = [];
            document.querySelectorAll('.panel-menu-link[href]').forEach(function (a) {
              var kopya = a.cloneNode(true);
              kopya.querySelectorAll('.sayac, .sayi, .rozet').forEach(function (x) { x.remove(); });
              var ad = (kopya.textContent || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('tr');
              if (ad) menu.push({ ad: ad, yol: a.getAttribute('href') });
            });
            function menudeAra(ad) {
              var k = ad.toLocaleLowerCase('tr');
              for (var i = 0; i < menu.length; i++) if (menu[i].ad === k) return menu[i].yol;
              for (var j = 0; j < menu.length; j++)
                if (menu[j].ad.indexOf(k) === 0 && /^[\s&·\/,-]/.test(menu[j].ad.charAt(k.length))) return menu[j].yol;
              return null;
            }
            for (var ci = 0; ci < trM.cells.length && !hedefG; ci++) {
              var h = trM.cells[ci];
              if (h.classList.contains('eylem') || h.classList.contains('sec')) continue;
              var kucuk = h.querySelector('small');
              var ana = (h.textContent || '').replace(kucuk ? (kucuk.textContent || '') : '', '')
                          .replace(/\s+/g, ' ').trim();
              var yol = ana && menudeAra(ana);
              if (yol) hedefG = yol + '?kaynak=' + encodeURIComponent(ana);
            }
          }
        }
        if (hedefG && !/^#/.test(hedefG)) { window.location.href = hedefG; return; }
        var bolge = hedefG ? document.querySelector(hedefG) : null;
        if (!bolge) {
          var ad = (d.getAttribute('data-ad') || d.textContent || '').trim();
          bolge = [].slice.call(document.querySelectorAll('.kart-baslik, h2, h3'))
            .filter(function (x) { return ad && (x.textContent || '').trim().indexOf(ad.split(' ')[0]) !== -1; })[0];
          if (bolge) bolge = bolge.closest('.kart') || bolge;
        }
        if (!bolge) {
          /* 🔴 SON BASAMAK: hedef modül yoksa KAYIT GÖSTERİLİR.
             `admin-sistem-bildirimleri`de iki satırın kaynağı
             ("Güvenlik" · "Sistem") panelde bir modül DEĞİL; o adla bir
             ekran uydurmak §26'nın "ada bakan talimat" tuzağı olurdu.
             Ama düğme de sessiz kalamaz ve "bağlanmadı" DİYEMEZ
             (Beyar yasağı). Dürüst karşılık: satırın kendisi — kaydın
             bildirdiği alanlar panelde gösterilir, kaynak adı dahil.
             Kullanıcı nereye gideceğine kendi karar verir. */
          var trS = d.closest('tr, .liste-satir');
          if (trS && typeof panelAc === 'function') {
            var adS = (trS.querySelector('td b') || trS.cells[1] || {}).textContent || 'Kayıt';
            panelAc(adS.replace(/\s+/g, ' ').trim() + ' — kayıt', 'fa-circle-info', satirVerisi(trS),
              'Bu kaydın kaynağı panelde ayrı bir modül olarak tutulmuyor; kaydın kendisi gösteriliyor.');
            return;
          }
          toast('Bu eylem için bir hedef bildirilmemiş.', 'hata'); return;
        }
        bolge.scrollIntoView({ block: 'start' });
        bolge.classList.add('guncellendi');
        setTimeout(function () { bolge.classList.remove('guncellendi'); }, 1600);
        return;
      }

      case 'panel-kapat': {
        e.preventDefault();
        var kapali = d.closest('[id]');
        if (kapali) { kapali.hidden = true; kapali.classList.remove('acik'); }
        return;
      }
    }
  });

  /* Kolon gizle/göster */
  document.addEventListener('change', function (e) {
    var k = e.target.closest('[data-kolon-anahtar]');
    if (!k) return;
    var i = k.getAttribute('data-kolon-anahtar');
    document.querySelectorAll('[data-kolon="' + i + '"]').forEach(function (h) {
      h.classList.toggle('gizli', !k.checked);
    });
  });

  /* Arama kutusu da bir süzgeçtir. */
  document.addEventListener('input', function (e) {
    var g = e.target.closest('.suzgec-cubuk input[type=search], .suzgec-cubuk .panel-arama-girdi');
    if (!g) return;
    var q = (g.value || '').trim().toLocaleLowerCase('tr');
    var tb = document.querySelector('.tablo tbody, table tbody');
    if (!tb) return;
    var n = 0;
    [].forEach.call(tb.rows, function (tr) {
      var uy = !q || (tr.textContent || '').toLocaleLowerCase('tr').indexOf(q) !== -1;
      tr.hidden = !uy; if (uy) n++;
    });
    var kayit = document.querySelector('.suzgec-sayac b');
    if (kayit) kayit.textContent = String(n);
  });


  /* ═══════════════════════════════════════════════════════════════════
     18 · ÇOKLU SEÇİM — `.coklu-secim`
     ───────────────────────────────────────────────────────────────────
     🔴 BU KALIP TAMAMEN ÖLÜYDÜ. 2026-09-04'te TIKLANARAK ölçüldü:
     beş örneğin beşinde arama kutusuna yazıldı, `.acilir-yuzey`
     `hidden` kaldı ve sıfır seçenek doğdu (admin-hareket-form 3 ·
     admin-program-form 1 · admin-rehber-form 1). Ne `admin-kit.js`te
     ne `_ortak/panel.js`te sürücüsü vardı — markup bir açılır VAAT
     ediyor, hiçbir şey o vaadi tutmuyordu.

     ⚠ Ölü buton tarayıcısına da görünmüyordu: aday bir `<button>`
     değil, bir `<input>`. Kapının nüfusu düğmelerdi; bu yüzey o
     nüfusun dışında kaldı. (Kayıtlı ders: denetimin öznesi kayar.)

     ── SEÇENEK KAYNAĞI — üç yol, bu sırayla ────────────────────────
       1 · `data-secenek='["Quadriceps","Gluteus"]'`  (JSON dizi)
           ya da `data-secenek="Quadriceps, Gluteus"` (virgüllü)
       2 · `data-kaynak="#birSelect"` → o `<select>`/`<datalist>`in
           seçeneklerini okur (tek kaynak, kopya doğmaz)
       3 · kaynak YOKSA → serbest etiket girişi (yaz + Enter)

     🔴 ÜÇÜNCÜ BASAMAK SAYESİNDE "BAĞLI DEĞİL" HÂLİ YOK. Kaynağı
        bildirilmemiş bir alan maket bir açılır göstermez; gerçekten
        çalışan bir etiket girişi olur. "Bu özellik bağlanmadı" diyen
        bir yüzey basılmaz (Beyar kuralı).

     Değer `<input type="hidden">`da toplanır; adı `data-ad`dan gelir,
     yoksa kabın `id`sinden türetilir. Çipler `.cipler` kabına yazılır,
     kap yoksa kit onu açar.
     ═══════════════════════════════════════════════════════════════ */
  function csKap(el) { return el && el.closest ? el.closest('.coklu-secim') : null; }

  function csSecenekler(kap) {
    var ham = kap.getAttribute('data-secenek');
    if (ham) {
      var t = ham.trim();
      if (t.charAt(0) === '[') { try { return JSON.parse(t); } catch (h) { /* virgüle düş */ } }
      return t.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    }
    var sec = kap.getAttribute('data-kaynak') && document.querySelector(kap.getAttribute('data-kaynak'));
    if (sec) {
      return [].map.call(sec.querySelectorAll('option'), function (o) {
        return (o.textContent || o.value || '').trim();
      }).filter(Boolean);
    }
    return null;                       /* kaynak yok → serbest giriş */
  }

  function csCipKap(kap) {
    var c = kap.querySelector('.cipler');
    if (!c) { c = document.createElement('div'); c.className = 'cipler'; kap.appendChild(c); }
    return c;
  }

  function csGizliAlan(kap) {
    var g = kap.querySelector('input[type=hidden][data-cs]');
    if (!g) {
      g = document.createElement('input');
      g.type = 'hidden'; g.setAttribute('data-cs', '');
      g.name = kap.getAttribute('data-ad') || ((kap.id || 'coklu') + '[]');
      kap.appendChild(g);
    }
    return g;
  }

  function csDegerler(kap) {
    return [].map.call(csCipKap(kap).querySelectorAll('[data-deger]'), function (c) {
      return c.getAttribute('data-deger');
    });
  }

  function csYaz(kap) { csGizliAlan(kap).value = csDegerler(kap).join(','); }

  function csEkle(kap, deger) {
    deger = (deger || '').trim();
    if (!deger) return false;
    /* 🔴 TEK DEĞER KİPİ — A1 ölçtü: bir rozet TEK ikon taşır, ama kap
       sınırsız çip alıyordu. `data-tek` bildiren kapta yeni seçim
       eskisinin YERİNE geçer; çoklu kap olduğu gibi kalır. */
    if (kap.hasAttribute('data-tek')) {
      csCipKap(kap).innerHTML = '';
    }
    /* Aynı değer iki kez eklenmez — sessizce yutmaz, var olanı yanıp söndürür. */
    var varOlan = csCipKap(kap).querySelector('[data-deger="' + deger.replace(/"/g, '\\"') + '"]');
    if (varOlan) {
      varOlan.classList.add('vurgu');
      setTimeout(function () { varOlan.classList.remove('vurgu'); }, 700);
      return false;
    }
    var cip = document.createElement('span');
    /* ⚠ YENİ SINIF AÇILMADI: seçilmiş çip kanonun `.cip.aktif`idir
       (`bilesenler.css:6656`). İlk yazımda `secili` diye ikinci bir ad
       uydurmuştum — kanonda karşılığı olan bir duruma yeni ad açmak, bu
       turda üçüncü kez yakalanan desen. */
    cip.className = 'cip aktif';
    cip.setAttribute('data-deger', deger);
    cip.textContent = deger;
    var x = document.createElement('button');
    x.type = 'button'; x.className = 'cip-sil';
    x.setAttribute('aria-label', deger + ' seçimini kaldır');
    x.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    cip.appendChild(x);
    csCipKap(kap).appendChild(cip);
    csYaz(kap);
    return true;
  }

  function csYuzey(kap) {
    var y = kap.querySelector('.acilir-yuzey');
    if (!y) {
      y = document.createElement('div');
      y.className = 'acilir-yuzey'; y.setAttribute('role', 'listbox'); y.hidden = true;
      kap.appendChild(y);
    }
    if (!y.id) y.id = 'cs-' + (kap.id || Math.random().toString(36).slice(2, 8));
    return y;
  }

  function csAc(kap, q) {
    var girdi = kap.querySelector('.acilir-arama');
    var y = csYuzey(kap);
    var kaynak = csSecenekler(kap);
    var secili = csDegerler(kap);
    y.innerHTML = '';

    if (kaynak) {
      var qq = (q || '').toLocaleLowerCase('tr');
      var uyan = kaynak.filter(function (o) {
        return secili.indexOf(o) === -1 &&
               (!qq || o.toLocaleLowerCase('tr').indexOf(qq) !== -1);
      });
      if (!uyan.length) {
        /* 🔴 BOŞ SONUÇ SESSİZ KALMAZ — kaç kayıtta arandığı yazılır.
           "hiç yok" ile "aramadım" aynı görünmemeli. */
        var bos = document.createElement('div');
        bos.className = 'acilir-bos';
        bos.textContent = q
          ? '“' + q + '” ' + kaynak.length + ' kayıtta bulunamadı'
          : 'Seçilebilecek kayıt kalmadı';
        y.appendChild(bos);
      } else {
        uyan.slice(0, 50).forEach(function (o) {
          var k = document.createElement('button');
          k.type = 'button'; k.className = 'acilir-kalem';
          k.setAttribute('role', 'option'); k.setAttribute('data-cs-deger', o);
          k.textContent = o;
          y.appendChild(k);
        });
      }
    } else if (q) {
      var ek = document.createElement('button');
      ek.type = 'button'; ek.className = 'acilir-kalem';
      ek.setAttribute('role', 'option'); ek.setAttribute('data-cs-deger', q);
      ek.textContent = '“' + q + '” ekle';
      y.appendChild(ek);
    } else {
      y.hidden = true;
      if (girdi) girdi.setAttribute('aria-expanded', 'false');
      return;
    }
    y.hidden = false;
    if (girdi) {
      girdi.setAttribute('aria-expanded', 'true');
      girdi.setAttribute('aria-controls', y.id);
    }
  }

  function csKapat(kap) {
    var y = kap.querySelector('.acilir-yuzey');
    if (y) y.hidden = true;
    var g = kap.querySelector('.acilir-arama');
    if (g) g.setAttribute('aria-expanded', 'false');
  }

  /* 🔴 ADLANDIRILMIŞ ALAN ANCAK ETKİLEŞİMDE DOĞUYORDU — A1'in 13②'si.
     `csGizliAlan` yalnız çip eklenince çağrılıyordu; o ana kadar kapta
     `name` taşıyan hiçbir eleman yoktu ve `formDoldur` alanı `name` ile
     aradığı için kaydı HİÇ göremiyordu. Belirti "çip doğmuyor"du, kök
     "alan yok"muş. Kap yüklenirken kurulur; ad `data-ad`dan, yoksa
     `id`den türer ve markup onu bildirebilir. */
  function csKur() {
    document.querySelectorAll('.coklu-secim').forEach(function (kap) {
      csGizliAlan(kap);
      csCipKap(kap);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', csKur);
  } else { csKur(); }
  window.DM_COKLU_KUR = csKur;

  document.addEventListener('input', function (e) {
    var g = e.target.closest('.coklu-secim .acilir-arama');
    if (!g) return;
    csAc(csKap(g), (g.value || '').trim());
  });
  /* ⚠ ODAK ÇIKINCA HEPSİNİ KAPATMAK YÜZEYİ TIKLANAMAZ YAPIYORDU.
     İlk yazım `else` dalında BÜTÜN `.coklu-secim`leri kapatıyordu.
     Seçeneğe basılınca odak input'tan `<button>`a geçiyor, `focusin`
     yüzeyi `hidden` yapıyor ve tıklama HİÇ TAMAMLANMIYORDU — ölçümde
     çıktı: süzgeç çalışıyor, boş sonuç metni doğru, ama çip doğmuyor.
     Artık yalnız ODAĞIN ÇIKTIĞI kaplar kapanır; odağı İÇİNDE tutan kap
     açık kalır. Ayrıca `mousedown` engellenir ki input odağı hiç
     kaybetmesin (etiket girişlerinin bilinen deseni). */
  document.addEventListener('mousedown', function (e) {
    if (e.target.closest('.coklu-secim [data-cs-deger]')) e.preventDefault();
  });
  document.addEventListener('focusin', function (e) {
    var g = e.target.closest('.coklu-secim .acilir-arama');
    if (g) { csAc(csKap(g), (g.value || '').trim()); return; }
    var icinde = e.target.closest ? e.target.closest('.coklu-secim') : null;
    document.querySelectorAll('.coklu-secim').forEach(function (k) {
      if (k !== icinde) csKapat(k);
    });
  });
  document.addEventListener('click', function (e) {
    var k = e.target.closest('.coklu-secim [data-cs-deger]');
    if (k) {
      e.preventDefault();
      var kap = csKap(k);
      csEkle(kap, k.getAttribute('data-cs-deger'));
      var g = kap.querySelector('.acilir-arama');
      if (g) { g.value = ''; g.focus(); }
      csAc(kap, '');
      return;
    }
    var sil = e.target.closest('.coklu-secim .cip-sil');
    if (sil) {
      e.preventDefault();
      var kapS = csKap(sil), cip = sil.closest('[data-deger]');
      if (cip) cip.remove();
      csYaz(kapS);
      return;
    }
    if (!e.target.closest('.coklu-secim')) {
      document.querySelectorAll('.coklu-secim').forEach(csKapat);
    }
  });
  document.addEventListener('keydown', function (e) {
    var g = e.target.closest('.coklu-secim .acilir-arama');
    if (!g) return;
    var kap = csKap(g);
    if (e.key === 'Enter') {
      e.preventDefault();
      var ilk = kap.querySelector('.acilir-yuzey [data-cs-deger]');
      if (ilk) { csEkle(kap, ilk.getAttribute('data-cs-deger')); g.value = ''; csAc(kap, ''); }
      return;
    }
    if (e.key === 'Escape') { csKapat(kap); return; }
    /* Boş kutuda Geri tuşu son çipi alır — etiket girişlerinin deseni. */
    if (e.key === 'Backspace' && !g.value) {
      var cipler = csCipKap(kap).querySelectorAll('[data-deger]');
      if (cipler.length) { cipler[cipler.length - 1].remove(); csYaz(kap); }
    }
  });


  /* ═══════════════════════════════════════════════════════════════════
     19 · DÜZENLEME KİPİ — form kaydın verisiyle DOLU açılır
     ───────────────────────────────────────────────────────────────────
     §5b'nin ikinci yarısı. "Düzenle" tam sayfa forma gidiyor (birinci
     yarı); bu blok o formu DOLDURUR. Doldurmadan gitmek yarım iştir:
     boş bir "yeni kayıt" formu da "forma gitti" sayılır ama düzenleme
     yapılamaz.

     🔴 VERİ TABLODAN TÜRETİLMEZ. Kaldırılan satır panelinin kusuru tam
        buydu: `thead` başlıklarını alan adı sayıyordu. Tablo bir SÜTUN
        SEÇKİSİ gösterir, kaydın tam alanlarını değil. Bunun yerine form
        sayfası kendi kayıtlarını BİLDİRİR:

        <script type="application/json" data-kayitlar>
          { "boyun": { "ad": "Boyun (Baş çevirici)", "latin": "…" } }
        </script>

        Anahtar adresteki değerdir (`?id=` · `?kas=` · `?c=` · `?slug=` ·
        `?h=` — hangisi varsa). Alanlar `name` ile eşlenir; `name`i
        olmayan alan doldurulmaz (uydurma yok).

     ⚠ MAKET SINIRI: bildirilen kayıt kümesi neyse form onu doldurur.
       Listede olup burada bildirilmemiş bir anahtar gelirse form BOŞ
       kalmaz — kip yine "düzenle"ye döner, başlık kaydın anahtarını
       yazar ve alan-yardım satırı bunun bildirilmemiş bir kayıt
       olduğunu SÖYLER. Sessiz boşluk "veri yok" ile "bildirmedim"i
       aynı gösterirdi.
     ═══════════════════════════════════════════════════════════════ */
  function kayitAnahtari() {
    var q = new URLSearchParams(location.search);
    var adaylar = ['id', 'kas', 'c', 'slug', 'h', 'test', 'kod', 'kayit'];
    for (var i = 0; i < adaylar.length; i++) {
      var v = q.get(adaylar[i]);
      if (v) return v;
    }
    return null;
  }

  /* ── §19c · SALT OKUNUR DETAY YÜZEYİ ────────────────────────────
     2026-09-05 · Gastro önerisi Ö5 + Ö5-ek (Ajan C'nin kök satırı).

     🔴 ERKEN ÇIKIŞ SIRASI YANLIŞTI ve kusuru bu doğuruyordu:

         var form = document.querySelector('form');
         if (!form) return;              ← detay ekranında BURADA çıkıyordu
         var anahtar = kayitAnahtari();  ←   bu satıra hiç gelinmiyordu

     `admin-abonelik-detay` bir `<form>` taşımıyor (künye düz metin).
     Blok HİÇ koşmuyordu: ne başlık değişiyor, ne bildirilmemiş anahtar
     uyarısı doğuyor, ne kayıt okunuyordu. Ölçüldü — üç ayrı `?id=`
     değeri, ÜÇÜNDE DE aynı sabit kayıt:
        ?id=ABN-2026-0412 → "Ece Aşçı — ABN-2026-0412"
        ?id=ABN-2026-0399 → "Ece Aşçı — ABN-2026-0412"   🔴
        ?id=yok-boyle-bir → "Ece Aşçı — ABN-2026-0412"   🔴

     🔴 DÜZELTME SIRASI ÖNEMLİ: Ö5'in önerdiği `[data-alan]` dalı
        `formDoldur`un İÇİNE yazılsaydı YİNE koşmazdı. Önce erken çıkış
        gevşetiliyor: anahtar okunur, başlık ve kip kurulur, uyarı doğar;
        DENETİM doldurma dalı yalnız form varsa sürer, yoksa salt okunur
        `[data-alan="<anahtar>"]` düğümlerine yazılır.

     ⚠ VERİ UYDURULMAZ: yalnız `data-kayitlar`ın BİLDİRDİĞİ alanlar,
       yalnız `[data-alan]` TAŞIYAN düğümlere yazılır. Bildirmeyen ekran
       eskisi gibi durur; hiçbir düğüm icat edilmez.                   */
  function detayYaz(kayit) {
    var yazilan = 0;
    Object.keys(kayit).forEach(function (ad) {
      var deger = kayit[ad];
      document.querySelectorAll('[data-alan="' + ad + '"]').forEach(function (d) {
        d.textContent = Array.isArray(deger) ? deger.join(', ') : String(deger);
        yazilan++;
      });
    });
    return yazilan;
  }

  function formDoldur() {
    /* 🔴 ANAHTAR ÖNCE OKUNUR — form varlığından ÖNCE. Ö5-ek'in kökü. */
    var anahtar = kayitAnahtari();
    if (!anahtar) return;                       /* oluştur kipi — dokunma */
    var form = document.querySelector('form');

    var kaynak = document.querySelector('[data-kayitlar]');
    var kayit = null;
    if (kaynak) {
      try {
        var hepsi = JSON.parse(kaynak.textContent || '{}');
        kayit = hepsi[anahtar] || null;
      } catch (h) { kayit = null; }
    }

    /* Başlık her hâlde düzenleme kipine döner — hangi kayıtta olduğunu
       kullanıcı görmeli. */
    var h1 = document.querySelector('.panel-bas h1');
    if (h1) {
      var ad = (kayit && (kayit.ad || kayit.baslik || kayit.terim)) || anahtar;
      h1.textContent = ad + ' — düzenle';
    }
    document.body.classList.add('duzenleme-kipi');

    if (!kayit) {
      /* ── Ö8 · UYARI DOĞRU OLSUN: form GERÇEKTEN boşaltılır ────────
         2026-09-05. Uyarı "form boş açıldı" diyordu; form boş DEĞİLDİ.
         Markup'ın maket değerleri yerinde duruyor ve yönetici
         bildirilmemiş bir anahtarda BAŞKA KAYDIN adını görüyordu:
            admin-video-form?id=yok-boyle-video
              uyarı → "…tanımlı değil; form boş açıldı."
              ad    → "Tam Kıvamında Karnıyarık"   🔴 başka kaydın adı
         Kit `!kayit` dalında `return` ediyordu; temizlik ise `kayit`
         VARSA koşan dalın içindeydi. Bu kitin kendi yazdığı kuralın
         karşıtı (§19: "boş alandan kötüsü, emin bir başlık altında
         başka kaydın verisi"). Temizlik dalın BAŞINA alındı.
         ⚠ `readonly` alan "—"ye döner: boş bırakmak "veri yok" ile
           "okunamadı"yı aynı gösterirdi.                              */
      if (form) {
        form.querySelectorAll('input, textarea').forEach(function (x) {
          if (x.type === 'hidden' || x.type === 'submit' || x.type === 'button') return;
          if (x.type === 'checkbox' || x.type === 'radio') x.checked = false;
          else x.value = x.readOnly ? '—' : '';
        });
        form.querySelectorAll('select').forEach(function (x) { x.selectedIndex = 0; });
        form.querySelectorAll('.coklu-secim .cipler').forEach(function (c) { c.innerHTML = ''; });
        form.querySelectorAll('.coklu-secim input[data-cs]').forEach(function (g) { g.value = ''; });
        var uyari = document.createElement('div');
        uyari.className = 'uyari-kutu bilgi-notu';
        uyari.innerHTML = '<i class="fa-solid fa-circle-info" aria-hidden="true"></i>' +
          '<div>“' + anahtar + '” kaydının alanları bu panelde tanımlı değil; ' +
          'form boş açıldı.</div>';
        var kap = form.querySelector('.form-bolum') || form;
        kap.insertBefore(uyari, kap.firstChild);
      }
      return;
    }

    /* ── Ö6 · DÜZENLEME KİPİ BİRİNCİL EYLEMİ DE ÇEVİRİR ───────────
       2026-09-05 · Gastro Ajan A ölçtü. Kit gövdeye `duzenleme-kipi`
       yazıyordu ama o sınıfı OKUYAN tek bir kural yoktu:
         grep duzenleme-kipi kanon/*.js kanon/*.css _ortak/*.js
         → admin-kit.js:2167  (tek geçiş, YAZAN)
       Kit bir durum bildiriyor, karşılığı yok — `.coklu-secim`in ve
       `data-say-for`ün kayıtlı deseninin üçüncü örneği.

       Ölçüldü:            oluştur        düzenle (?id=)
         H1                "Yeni tarif"   "Etli Kuru Fasulye — düzenle" ✅
         body sınıfı       yok            VAR                           ✅
         kaydet metni      "Tarifi kaydet" "Tarifi kaydet"              🔴

       Yönetici var olan bir kaydı DEĞİŞTİRİRKEN düğme hâlâ "kaydet"
       diyor; ayrım yalnız H1'de duruyor ve H1 sayfanın tepesinde, düğme
       dibinde — sabit çubuk kaydırılınca H1 ekranda DEĞİL.

       ⚠ METİN MARKUP'TAN TÜRETİLİR, ikinci bir metin kaynağı doğmaz
         (§24'ün "ipucu `aria-label`dan türetilir" kuralının aynısı):
         "Tarifi kaydet" → "Tarifi güncelle" · "Dönüşümü kaydet" →
         "Dönüşümü güncelle". `aria-label` da birlikte döner; yoksa
         açılmaz.                                                       */
    if (form) document.querySelectorAll('.form-eylem .dugme.birincil, .panel-bas .dugme.birincil[type="submit"]')
      .forEach(function (d) {
        var m = (d.textContent || '').trim();
        if (/kaydet$/i.test(m)) d.textContent = m.replace(/kaydet$/i, 'güncelle');
        var al = d.getAttribute('aria-label');
        if (al && /kaydet$/i.test(al)) d.setAttribute('aria-label', al.replace(/kaydet$/i, 'güncelle'));
      });

    /* ── Ö5 · FORM YOKSA SALT OKUNUR DETAY DALI ─────────────────── */
    if (!form) { detayYaz(kayit); return; }

    /* 🔴 BOŞ FORMUN DEMO HATA HÂLİ DOLU KAYDA AİT DEĞİLDİR.
       Markup "2 alan düzeltilmeli" özetini ve kırmızı kenarları taşıyor;
       bunlar boş formun gösterimi. Düzenleme kipine geçilince hepsi
       düşer — doğrulama kullanıcı kaydetmeye basınca yeniden koşar. */
    /* 🔴 BİLDİRİLMEMİŞ ÇOKLU SEÇİM YANLIŞ VERİ GÖSTERİYORDU — A2 ölçtü,
       ve bu benim çip düzeltmemin yan etkisi. Markup'ta duran demo çip
       (`#pfHedef` → "Güç & Kondisyon") kayıt onu bildirmese bile
       kalıyordu: ÜÇ AYRI programın formunda aynı hedef görünüyordu.
       Boş alandan kötüsü budur — emin bir başlık altında başka kaydın
       verisi. Düzenleme kipinde bütün çip kapları boşaltılır; kaydın
       bildirdikleri hemen ardından yeniden kurulur. */
    form.querySelectorAll('.coklu-secim .cipler').forEach(function (c) { c.innerHTML = ''; });
    form.querySelectorAll('.coklu-secim input[data-cs]').forEach(function (g) { g.value = ''; });
    form.querySelectorAll('.alan-ozet').forEach(function (o) { o.classList.remove('goster'); });
    form.querySelectorAll('.alan-hata').forEach(function (o) { o.classList.remove('goster'); o.hidden = true; });
    form.querySelectorAll('.hatali').forEach(function (o) { o.classList.remove('hatali'); });
    form.querySelectorAll('[aria-invalid]').forEach(function (o) { o.removeAttribute('aria-invalid'); });
    Object.keys(kayit).forEach(function (ad) {
      var deger = kayit[ad];
      /* ── Ö7 · `[]` EKLİ ANAHTAR KİTİ ORTADAN KIRIYORDU ────────────
         2026-09-05 · Gastro kulvarı ölçtü, lead bağımsız üretti.
         Dış arama iki yazımı da kabul ediyordu (`x` ve `x[]`), ama
         tekrarlayıcı dalı ada `[]` EKLİYOR. Anahtar zaten `x[]` ise
         aranan seçici `[name="x[][]"]` oluyor, `mevcut` boş dönüyor ve
         `mevcut[mevcut.length-1].cloneNode` PATLIYOR:
             PAGEERROR: Cannot read properties of undefined
                        (reading 'cloneNode')   admin-kit.js:2275
         Hata döngünün ORTASINDA atılıyor: önceki alanlar dolu,
         sonrakiler boş kalıyor (ölçüldü: çıplak 35 dolu · `[]`-ekli 20).
         Kök AD, `[]` eki kırpılarak türetilir; sözleşmenin adı yine
         çıplak addır, iki yazım da çalışır.
         ⚠ Bozma sınamasının kendisi ilk turda yanlış özneyi bozmuştu:
           `[]` eki bir ONAY KUTUSU grubuna konunca 35/35 dolu kaldı —
           kusur "`[]` eki" değil, "`[]` eki + TEKRARLAYICI dalı".     */
      var kokAd = String(ad).replace(/\[\]$/, '');
      var alanlar = form.querySelectorAll('[name="' + kokAd + '"], [name="' + kokAd + '[]"]');
      /* Çoklu seçim kabı adını `data-ad` ile bildirebilir; bildirmemişse
         kendi `id`si de aranır (markup değişmeden çalışsın diye). */
      if (!alanlar.length) {
        var csK = form.querySelector('.coklu-secim[data-ad="' + kokAd + '"], .coklu-secim#' + kokAd);
        if (csK) alanlar = csK.querySelectorAll('input[data-cs]');
      }
      if (!alanlar.length) return;

      /* 🔴 DİZİ DEĞER TEK ALANA YIĞILIYORDU — A2 ölçtü. İlk yazım
         `alanlar[0]`e virgülle basıyordu: bir kaydın dört adımı tek
         kutuya yığılıyor, onay kutusu grubunda yalnız ilki işaretleniyordu.
         Sonuç: `name="x[]"` taşıyan BÜTÜN tekrarlayan bölümler §5b'nin
         dışında kalıyordu (challenge adımları ve kilometre taşları,
         antrenör paketleri/belgeleri, program kazanımları, PAR-Q soruları).

         Dizi üç ayrı şekilde karşılanır:
           · onay kutusu / radyo grubu → değerleri EŞLEŞENLER işaretlenir
           · tek alanlı tekrarlayıcı   → satır sayısı kayda göre AYARLANIR
           · fazla/eksik satır          → klonlanır ya da kaldırılır
         ⚠ Klon aynı `satir-ekle` gövdesinden geçmez (o dal bir olaya
           bağlı); temizlik burada tekrarlanıyor ve `data-klon-*`
           bildirimlerine uyuyor. */
      /* ⚠ ÇİP DALI DİZİ DALINDAN ÖNCE KOŞAR. İlk yazımda sonraya
         koymuştum ve dizi değer çip dalına HİÇ ULAŞMIYORDU: dizi kolu
         `ilk.value = deger.join(', ')` ile bitiyor, gizli alan doluyor
         ama kullanıcı hiçbir çip görmüyordu. Belirti aynıydı, kök
         sıralamaydı — ölçüm gösterdi (gizli "Quadriceps, Gluteus",
         görünen çip 0). */
      /* 🔴 ÇOKLU SEÇİM ÇİP DOĞURMUYORDU — A1 ölçtü: `formDoldur` gizli
         alanın değerini yazıyor, `csEkle` çağrılmıyordu; yani kayıt
         yükleniyor ama kullanıcı hiçbir çip GÖRMÜYORDU. Değer kutusu
         `.coklu-secim` kabındaysa çipler kurulur. */
      var csAlan = alanlar[0];
      if (csAlan && csAlan.hasAttribute && csAlan.hasAttribute('data-cs')) {
        var csKabi = csAlan.closest('.coklu-secim');
        if (csKabi) {
          var cipKabi = csKabi.querySelector('.cipler');
          if (cipKabi) cipKabi.innerHTML = '';
          var degerler = Array.isArray(deger) ? deger : String(deger).split(',');
          degerler.forEach(function (v) {
            v = String(v).trim();
            if (!v) return;
            var cip = document.createElement('span');
            cip.className = 'cip aktif';
            cip.setAttribute('data-deger', v);
            cip.textContent = v;
            var x = document.createElement('button');
            x.type = 'button'; x.className = 'cip-sil';
            x.setAttribute('aria-label', v + ' seçimini kaldır');
            x.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
            cip.appendChild(x);
            (cipKabi || csKabi).appendChild(cip);
          });
          csAlan.value = degerler.map(function (v) { return String(v).trim(); }).filter(Boolean).join(',');
          return;
        }
      }
      if (Array.isArray(deger)) {
        var ilk = alanlar[0];
        /* a · onay kutusu / radyo grubu */
        if (ilk.type === 'checkbox' || ilk.type === 'radio') {
          [].forEach.call(alanlar, function (k) {
            k.checked = deger.map(String).indexOf(String(k.value)) !== -1;
          });
          return;
        }
        /* b · tekrarlayıcı — satır sayısını kayda eşitle */
        var satir = ilk.closest('.adim-karti, .kalem-satiri, tr');
        var kap = satir && satir.parentNode;
        if (satir && kap) {
          var mevcut = [].filter.call(kap.children, function (c) {
            return c.querySelector('[name="' + kokAd + '[]"]');
          });
          while (mevcut.length < deger.length) {
            var kopya = mevcut[mevcut.length - 1].cloneNode(true);
            kopya.querySelectorAll('[data-klon-sil]').forEach(function (x) { x.remove(); });
            kopya.querySelectorAll('[data-klon-metin]').forEach(function (x) { x.textContent = ''; });
            kopya.querySelectorAll('input, textarea').forEach(function (x) {
              if (x.type === 'hidden') return;
              if (x.type === 'checkbox' || x.type === 'radio') x.checked = false; else x.value = '';
            });
            /* ⚠ `<select>` de temizlenir — A2 ölçtü: dizi dalı klonlarken
               yalnız input/textarea'yı boşaltıyordum, seçim klonlandığı
               satırın değerini taşıyordu (form-tasarım "Alan türü"). */
            kopya.querySelectorAll('select').forEach(function (x) { x.selectedIndex = 0; });
            kap.appendChild(kopya);
            mevcut.push(kopya);
          }
          /* 🔴 TEKRARLAYICI TEK SATIRIN ALTINA İNEMİYORDU — A1 ölçtü:
             kaynağında o bölüm OLMAYAN kayıt maket satırını görüyordu
             (`?id=hareket-rehberi-v1` CTA'da üç demo kartı). Boş dizi
             bildirmek de çözmüyordu. Artık tek satıra inilir ve o satır
             BOŞALTILIR — kap durur, içi kaydın gerçeğini söyler. */
          while (mevcut.length > Math.max(deger.length, 1)) {
            mevcut.pop().remove();
          }
          if (!deger.length && mevcut[0]) {
            mevcut[0].querySelectorAll('input, textarea').forEach(function (x) {
              if (x.type === 'hidden') return;
              if (x.type === 'checkbox' || x.type === 'radio') x.checked = false; else x.value = '';
            });
            mevcut[0].querySelectorAll('select').forEach(function (x) { x.selectedIndex = 0; });
          }
          deger.forEach(function (v, i) {
            var g = mevcut[i] && mevcut[i].querySelector('[name="' + kokAd + '[]"]');
            if (g) g.value = String(v);
          });
          if (window.DM_LISTE_TAZELE) window.DM_LISTE_TAZELE(kap);
          return;
        }
        /* c · tekrarlayıcı değil, çok değerli tek alan → virgülle */
        ilk.value = deger.join(', ');
        ilk.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
      if (alanlar.length > 1 && alanlar[0].type === 'radio') {
        [].forEach.call(alanlar, function (r) { r.checked = (r.value === String(deger)); });
        return;
      }
      var el = alanlar[0];
      if (el.type === 'checkbox') { el.checked = !!deger; return; }
      if (el.tagName === 'SELECT') {
        /* ── Ö9 · SEÇİCİYE UYMAYAN DEĞER SESSİZCE BOŞALIYORDU ───────
           2026-09-05 · Gastro Ajan B ölçtü.
           `el.value = deger` eşleşmezse tarayıcı `selectedIndex`i -1
           yapar: seçici boş görünür, konsol susar, kapı "form dolu"
           der (ilk metin alanı doludur). Ölçüldü:
              kayıttan gelen  value="Baharat (57)"  selectedIndex=5  ✅
              satırın biçimi  value="Baharat"       selectedIndex=-1 🔴
           Sessiz düşmek burada `!kayit` dalından TEHLİKELİ: orada
           başlık düzenleme kipine dönüyor ve kullanıcı bir şeyin eksik
           olduğunu görüyor; burada form DOLU görünüyor ve kaydet'e
           basılırsa kategori GERÇEKTEN silinir.

           Üç kademe: birebir → sayaç eki kırpılmış (`Sos (93)` → `Sos`)
           → hâlâ yoksa alanın yardım rayına SÖYLE. Kit susmaz.
           ⚠ Kırpma yalnız KARŞILAŞTIRMADA; seçeneğin kendi değeri
             değişmez, yani veri bozulmaz.                             */
        var hedef = String(deger);
        var sadeles = function (x) { return String(x).replace(/\s*\(\d+\)\s*$/, '').trim(); };
        var bulundu = false;
        [].forEach.call(el.options, function (o) {
          if (bulundu) return;
          if (o.value === hedef || (o.textContent || '').trim() === hedef) { el.value = o.value; bulundu = true; }
        });
        if (!bulundu) [].forEach.call(el.options, function (o) {
          if (bulundu) return;
          if (sadeles(o.value) === sadeles(hedef) || sadeles(o.textContent) === sadeles(hedef)) {
            el.value = o.value; bulundu = true;
          }
        });
        if (!bulundu) {
          if (el.options.length) el.selectedIndex = 0;
          var alanKap = el.closest && el.closest('.alan');
          var ray = alanKap && alanKap.querySelector('.alan-yardim');
          var not = 'Kayıttaki değer (“' + hedef + '”) bu listede yok.';
          if (ray && ray.textContent.indexOf(not) === -1) {
            var u = document.createElement('span');
            u.className = 'alan-uyari'; u.textContent = not;
            ray.appendChild(u);
          } else if (!ray && alanKap) {
            var y = document.createElement('div');
            y.className = 'alan-yardim';
            y.innerHTML = '<span class="alan-uyari"></span>';
            y.firstChild.textContent = not;
            alanKap.appendChild(y);
          }
        }
        return;
      }
      el.value = Array.isArray(deger) ? deger.join(', ') : String(deger);
      /* 🔴 DOLAN ALANIN ÜSTÜNDE HATA DURMAZ — A1 ölçtü: `?id=aerobik`de
         alan "Aerobik" ile doluyken kırmızı kenar, "Terim zorunlu." ve
         "2 alan düzeltilmeli" özeti duruyordu. Markup boş formun hata
         hâlini taşıyor; dolduran taraf onu düşürmezse form DOLU KAYDIN
         ÜSTÜNDE YALAN SÖYLER. */
      /* ⚠ `hataSil` `.alan` KABINI bekler, girdiyi değil — ilk yazımda
         girdiyi geçirdim ve sessizce hiçbir şey olmadı (konsol da temiz
         kaldı, çünkü `classList.remove` her elemanda çalışır). Ayrıca
         markup hatayı `hidden` ile değil `.goster` sınıfıyla açıyor. */
      /* ⚠ `hataSil`i ÇAĞIRMIYORUM: o işlev BİRİNCİ IIFE'de, burası
         üçüncüsü — çağrı `ReferenceError` atıyor ve doldurma DÖNGÜNÜN
         ORTASINDA kesiliyordu. Belirti sinsiydi: başlık değişiyor (döngüden
         önce), alanlar dolmuyor, sayaç tazelenmiyor ve `DM_FORM_DOLDUR`
         export'u hiç çalışmıyordu — konsolu dinlemeyen bir ölçüm bunu
         "sayaç kusuru" diye okur. Bu turda üçüncü kapsam tuzağı
         (kayıtlı vaka: `duzAc` 1.'de, `panel-ac` 2.'de).
         Temizlik burada, kapsam gerektirmeden yapılıyor. */
      var kapAlan = el.closest && el.closest('.alan');
      if (kapAlan) {
        kapAlan.classList.remove('hatali');
        kapAlan.querySelectorAll('.alan-hata').forEach(function (x) {
          x.classList.remove('goster'); x.hidden = true;
        });
      }
      el.classList.remove('hatali');
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     19b · KARAKTER SAYACI — `data-say-for`
     ───────────────────────────────────────────────────────────────────
     🔴 SÜRÜCÜSÜ HİÇ YOKTU. A1 "sayaç tazelenmiyor" diye bildirdi; sebep
     `formDoldur`un `input` olayını yollamaması DEĞİL — `data-say-for`
     niteliğini ne `admin-kit.js` ne `_ortak/panel.js` okuyordu. Markup
     "0 / 80" yazıp duruyordu ve KULLANICI YAZARKEN DE hiç değişmiyordu.
     `.coklu-secim`le aynı sınıf: markup bir vaat ediyor, tutan yok.
     Sayı değişir, birim/ek korunur ("0 / 60 önerilen" → "42 / 60 önerilen"). */
  function sayacTazele(el) {
    if (!el || !el.id) return;
    var s = document.querySelector('.alan-sayac[data-say-for="' + el.id + '"]');
    if (!s) return;
    var uzun = (el.value || '').length;
    var enCok = el.getAttribute('maxlength');
    var ek = (s.textContent || '').replace(/^\s*\d+\s*\/\s*\d+\s*/, '').trim();
    s.textContent = uzun + (enCok ? ' / ' + enCok : '') + (ek ? ' ' + ek : '');
    /* Sınıra yaklaşınca uyarır — sayı tek başına okunmaz. */
    if (enCok) s.classList.toggle('dolu', uzun >= Number(enCok) * 0.9);
  }
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id) sayacTazele(e.target);
  });
  function sayaclariTazele() {
    document.querySelectorAll('.alan-sayac[data-say-for]').forEach(function (s) {
      sayacTazele(document.getElementById(s.getAttribute('data-say-for')));
    });
  }
  window.DM_SAYAC_TAZELE = sayaclariTazele;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { formDoldur(); sayaclariTazele(); });
  } else { formDoldur(); sayaclariTazele(); }
  window.DM_FORM_DOLDUR = formDoldur;


  /* ═══════════════════════════════════════════════════════════════════
     20 · SABİT EYLEM ÇUBUĞU — sayfada TEK olanı işaretle
     ───────────────────────────────────────────────────────────────────
     Sözleşme §6: "Sayfanın hiçbir yerinde ikinci eylem seti yoktur" ve
     sabitlenen ÇUBUK SAYFANIN SON çubuğudur.

     🔴 CSS BUNU SEÇEMİYOR. Kural `:last-of-type` ile yazılmıştı; o
     seçici KARDEŞLER arasında son olanı bulur, oysa çubuklar farklı
     ebeveynlerde duruyor. Ölçüldü: `admin-ayarlar`da SEKİZ `.form-eylem`
     var ve birden fazlası `position:fixed` alıyor — üst üste binen
     çubuklar alttakinin düğmelerini örtüyor. (Kuralın kendi yorumu
     "`:last-of-type` yetmez, `:has()` ile yazılıyor" diyordu ama CSS
     öyle yazılmamıştı — yorum koda değil NİYETE bakıyordu.)

     "Belgede en son" bir CSS sorusu değil, bir DOM sorusudur; kit
     işaretler, CSS o işarete bakar. Markup üretilmiyor — var olan
     elemana sınıf yazılıyor (K22 sınırının doğru tarafı).
     ⚠ Bu, sayfada birden çok eylem çubuğu OLMASINI meşrulaştırmaz;
       fazlalık bir markup kusurudur ve ayrıca sayılır.
     ═══════════════════════════════════════════════════════════════ */
  function eylemCubuguIsaretle() {
    var hepsi = [].slice.call(document.querySelectorAll('.panel-sayfa .form-eylem'));
    if (!hepsi.length) return;
    hepsi.forEach(function (c) { c.classList.remove('cubuk-sabit'); });
    /* ⚠ "DOM'DA SON" SEKMELİ SAYFADA YANLIŞ ÖLÇÜT. `admin-ayarlar`ın
       altı çubuğu altı SEKMEYE ait ve aynı anda yalnız biri görünür;
       DOM'da sonuncuyu sabitlemek, kullanıcı ikinci sekmedeyken
       GÖRÜNMEYEN bir çubuğu sabitlemek demekti. Ölçüt görünürlüktür:
       sabitlenen, o an EKRANDA olan son çubuktur. Sekme değişince
       yeniden hesaplanır — durum, sayfanın değil görünümün durumudur. */
    var gorunur = hepsi.filter(function (c) {
      return c.offsetParent !== null || c.classList.contains('cubuk-sabit');
    });
    var secilen = (gorunur.length ? gorunur : hepsi).slice(-1)[0];
    secilen.classList.add('cubuk-sabit');
    /* 🔴 SAYFA DİBİ PAYI ÇUBUĞUN GERÇEK BOYUNU BİLMİYORDU.
       Kural payı 116px diye YAZIYORDU (48 + 44 + 2×12) ve o sayı çubuğun
       tek satır kaldığı varsayımına dayanıyordu. `admin-entegrasyonlar`da
       ölçüldü: çubuk 56px'lik bir kutu, ama içindeki "Anahtarı yenile"
       düğmesi 44px ve kutu gölgesiyle birlikte son satırın üstüne 24px
       biniyordu — satırın "Düzenle"si sayfa sonuna kadar kaydırılsa bile
       TIKLANAMIYORDU. (A1 aynı kusuru `admin-sozluk`ta bulmuştu; orada
       kaynağı bir liste ekranındaki kart ayağıydı.)
       Yazılmış sayı yerine ÖLÇÜLEN boy: kit çubuğu ölçüp gövdeye yazar,
       kural onu okur. Çubuk sarınca pay kendiliğinden büyür. */
    var boy = Math.ceil(secilen.getBoundingClientRect().height) || 68;
    document.body.style.setProperty('--kit-cubuk-h', boy + 'px');
  }
  /* Pencere yeniden boyutlanınca çubuk sarabilir — pay yeniden ölçülür. */
  window.addEventListener('resize', function () {
    if (window.DM_EYLEM_CUBUGU) window.DM_EYLEM_CUBUGU();
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', eylemCubuguIsaretle);
  } else { eylemCubuguIsaretle(); }
  /* Sekme değişimi görünürlüğü değiştirir → işaret yeniden hesaplanır.
     `_ortak/panel.js` sekmeyi `[role="tab"]` üzerinden sürüyor; kit onun
     sözleşmesine DOKUNMADAN yalnız sonrasını dinliyor. */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[role="tab"], .form-sekme, .sekme')) {
      setTimeout(eylemCubuguIsaretle, 0);
    }
  });
  window.DM_EYLEM_CUBUGU = eylemCubuguIsaretle;


  /* ═══════════════════════════════════════════════════════════════════
     22 · ADRESTEN GELEN SÜZGEÇ — `?<alan>=<deger>`
     ───────────────────────────────────────────────────────────────────
     🔴 YARIM KALAN BAĞ. B kulvarı 21 düğmeyi gerçek ekrana bağladı
     ("… teriminin kullanıldığı içerikleri gör" → `admin-hareketler.html
     ?taksonomi=<terim>"), ölçtü: **panel-içi 21/21, süzgeç 0/21**.
     Ekran tam listeyi açıyor — sanki hiç soru sorulmamış gibi. Doğru
     ekrana gitmek, doğru SORUYU sormakla aynı şey değil.
     §11 sayfa başına JS'i yasakladığı için okuyucu kite ait.

     Sözleşme: adresteki her `<alan>=<deger>` çifti için şeritte
     `data-varsayilan="<Alan>"` taşıyan süzgeç bulunur, `data-deger`i
     eşleşen çipi seçilir ve `suzgecTazele()` koşar.
     🔴 EŞLEŞEN SATIR YOKSA SESSİZ KALINMAZ: liste "«X» için kayıt yok"
        boş durumuna düşer. "Hiç yok" ile "süzgeci okumadım" aynı
        görünmemeli — bu turda dört kez yandığımız desen.
     ⚠ Kayıt anahtarları (`id` ve kardeşleri) süzgeç DEĞİLDİR, atlanır. */
  var SUZGEC_DISI = ['id', 'kas', 'c', 'slug', 'h', 'test', 'kod', 'kayit'];

  function adrestenSuzgec() {
    var cubuk = document.querySelector('.suzgec-cubuk');
    if (!cubuk) return;
    var q = new URLSearchParams(location.search);
    var uygulanan = [];
    q.forEach(function (deger, alan) {
      if (SUZGEC_DISI.indexOf(alan) !== -1 || !deger) return;
      var hedef = null;
      cubuk.querySelectorAll('[data-suzgec]').forEach(function (t) {
        var ad = (t.getAttribute('data-varsayilan') || t.getAttribute('data-suzgec') || '')
                   .toLocaleLowerCase('tr');
        if (ad === alan.toLocaleLowerCase('tr')) hedef = t;
      });
      if (!hedef) {
        /* 🔴 SÜZGEÇ DENETİMİ YOKSA BAĞ SESSİZCE ÖLÜYORDU (§24 · madde 9).
           `admin-taksonomi`nin liste ikonu `admin-hareketler.html?taksonomi=Kuvvet`
           adresine gidiyor ve orada `taksonomi` diye bir süzgeç YOK —
           ölçüldü: 17 satırın 17'si görünüyor, süzgeç notu doğmuyor.
           Yönetici "bu terime bağlı içerikler" bekliyor, TAM LİSTE
           görüyor ve farkı anlamıyor. Devir belgesi §24-4 bunu "B'nin
           12 bağı yarım" diye bırakmıştı.
           Denetimi olmayan parametre satırları DOĞRUDAN süzer: eşleşme
           satırın kendi metninde aranır ve not "hangi parametre"
           olduğunu YAZAR. Uydurma bir süzgeç yüzeyi AÇILMAZ. */
        if (!document.querySelector('.tablo tbody, table tbody')) return;
        ADRES_OLCUT.push(deger.toLocaleLowerCase('tr'));
        uygulanan.push(alan + ': ' + deger);
        return;
      }
      /* Çipi seç — açılırın kendi tıklama yolundan geçmeden, ama aynı
         durumu bırakarak (tetikteki etiket + `data-deger`). */
      var yuzeyId = hedef.getAttribute('aria-controls');
      var yuzey = yuzeyId && document.getElementById(yuzeyId);
      var secildi = false;
      if (yuzey) {
        yuzey.querySelectorAll('[data-deger]').forEach(function (k) {
          var esit = (k.getAttribute('data-deger') || '').toLocaleLowerCase('tr') ===
                     deger.toLocaleLowerCase('tr') ||
                     (k.textContent || '').trim().toLocaleLowerCase('tr') ===
                     deger.toLocaleLowerCase('tr');
          k.classList.toggle('aktif', esit);
          k.setAttribute('aria-checked', String(esit));
          if (esit) {
            secildi = true;
            hedef.setAttribute('data-deger', k.getAttribute('data-deger') || deger);
            var et = hedef.querySelector('[data-rol="etiket"]') || hedef.querySelector('span');
            if (et) et.textContent = (k.textContent || deger).trim();
          }
        });
      }
      if (!secildi) {
        /* Çip yoksa süzgeç yine uygulanır — değer doğrudan yazılır. */
        hedef.setAttribute('data-deger', deger);
        var et2 = hedef.querySelector('[data-rol="etiket"]') || hedef.querySelector('span');
        if (et2) et2.textContent = deger;
      }
      uygulanan.push(alan + ': ' + deger);
    });
    if (!uygulanan.length) return;
    if (window.DM_SUZGEC_TAZELE) window.DM_SUZGEC_TAZELE();
    /* Süzgecin nereden geldiği GÖRÜNÜR olmalı — kullanıcı listeyi eksik
       sanmasın. Şeridin sayacının yanına bir bildirim düşer. */
    var not = document.createElement('p');
    not.className = 'suzgec-adres-notu';
    not.setAttribute('role', 'status');
    var tablo = document.querySelector('.tablo tbody, table tbody');
    var kalan = tablo ? [].filter.call(tablo.rows, function (r) { return !r.hidden; }).length : null;
    not.innerHTML = '<i class="fa-solid fa-filter" aria-hidden="true"></i> ' +
      'Bu liste <b>' + uygulanan.join(' · ') + '</b> süzgeciyle açıldı' +
      (kalan === 0 ? ' — <b>eşleşen kayıt yok.</b>' : (kalan !== null ? ' · ' + kalan + ' kayıt.' : '.')) +
      ' <button type="button" class="dugme hayalet" data-eylem="suzgec-temizle">Süzgeci kaldır</button>';
    cubuk.insertAdjacentElement('afterend', not);
  }

  /* ═══════════════════════════════════════════════════════════════════
     22 · SÜZGEÇ ÇİPİ · "TÜMÜ" DIŞLAYICIDIR
     ───────────────────────────────────────────────────────────────────
     Beyar kuralı, 2026-09-04 (parti 3): *"Tümü seçiliyken tek kalem
     seçince Tümü kalkmıyor."*

     Kural iki cümle:
       1 · Bir kalem seçilince **Tümü düşer**.
       2 · Seçim boşalınca **Tümü döner** — süzgeç asla boş kalmaz.

     🔴 ÖLÇÜM OKUDUĞUMU ÇÜRÜTTÜ. Markup'a bakınca kusur dört ekranda
     görünüyordu (`data-deger` taşımayan çipler; onları yalnız panel.js
     toggle ediyor, Tümü'ye hiç dokunulmuyor). TIKLAYARAK ölçülünce
     **142 yüzeyin 85'i** kırmızı çıktı: `data-deger` taşıyan 130
     yüzeyin 73'ünde de Tümü "seçili" kalıyordu — ama GÖZLE DEĞİL.

     Kök: kitin tek-seçim yazıcısı yalnız `.aktif` sınıfını ve
     `aria-checked`i güncelliyordu. Markup ise durumu ÜÇ AYRI adla
     bildiriyor: `aria-pressed` (düğme kipi) · `aria-selected`
     (`role="option"`) · `aria-checked`. Tümü'nün `.aktif`i kalkıyor,
     `aria-selected="true"` YERİNDE KALIYORDU — yani ekran görsel olarak
     doğru, **ekran okuyucuya yalan** söylüyordu. panel.js'in kendi
     başlığındaki uyarının aynısı: *bildirilmiş ama sürülmeyen bir ARIA
     denetimi, hiç bildirilmemiş olmasından kötüdür.*

     Çözüm tek yazıcı: `cipDurum()` markup'ın BİLDİRDİĞİ her adı birlikte
     çevirir; bildirmediğini uydurmaz.

     ⚠ İKİ NÜFUS AYRI KALIR, birleştirilmedi:
       · `data-deger` taşıyan yüzey → tek seçim (`role="option"`),
         kit tetiğin etiketini de yazıyor ve yüzeyi kapatıyor;
       · taşımayan yüzey → çoklu seçim, panel.js toggle ediyor.
     İkisini tek kipe indirmek satır süzme ölçütünü (tek `data-deger`)
     yeniden yazmak olurdu; kural ikisinde de aynı: Tümü yalnız kalır.

     ⚠ SIRA: panel.js her ekranda kitten ÖNCE yükleniyor (83/83 ölçüldü),
     bu yüzden onun toggle'ı bu dinleyiciden önce koşar ve buradaki
     normalleştirme SON durumu görür. Yine de yazım DURUMA bakar,
     olaya değil — sıra kayarsa sonuç değişmez (idempotent).            */

  var TUMU_METIN = /^(tümü|hepsi)$/i;

  /* Bir çipin durumunu markup'ın bildirdiği HER adla birlikte yazar. */
  function cipDurum(c, acik) {
    c.classList.toggle('aktif', acik);
    if (c.hasAttribute('aria-pressed'))  c.setAttribute('aria-pressed',  String(acik));
    if (c.hasAttribute('aria-selected')) c.setAttribute('aria-selected', String(acik));
    if (c.hasAttribute('aria-checked'))  c.setAttribute('aria-checked',  String(acik));
  }
  function cipAcik(c) {
    return c.classList.contains('aktif') ||
           c.getAttribute('aria-pressed') === 'true' ||
           c.getAttribute('aria-selected') === 'true' ||
           c.getAttribute('aria-checked') === 'true';
  }
  window.DM_CIP_DURUM = cipDurum;

  /* ═══════════════════════════════════════════════════════════════════
     22c · K34 · SÜZGEÇ DIŞI `role="listbox"` KAPLARININ SÜRÜCÜSÜ
     ───────────────────────────────────────────────────────────────────
     2026-09-05 · Gastro önerisi Ö13. Ölü buton taraması `admin-rozet-form`
     ikon havuzunda **51 ölü kalem** buldu, 49'u tek başına ikon
     seçicinin. Aynı boşluk `admin-form-tasarim` ve `admin-medya`da da
     var — toplam **86 yalnız-ikon ölü kalem**, üç ekranın üç ayrı
     yerinde AYNI kap:

         <div class="cipler" role="listbox" aria-label="İkon seçenekleri">
           <button role="option" aria-selected="false" data-ico="fa-solid fa-bed">

     Tıklanınca hiçbir şey olmuyordu: `aria-selected` dönmüyor, seçim
     bir alana yazılmıyor. Kitin çip sürücüsü `[data-deger]` taşıyan
     çipleri ve SÜZGEÇ YÜZEYİNİN içindekileri tanıyor; bu listbox bir
     süzgeç yüzeyi değil ve anahtarı `data-ico`.

     🔴 HİÇBİR KULVARIN ÇÖZEMEYECEĞİ BOŞLUKTU: ekran sayfa JS'i yazamaz
        (kanon dışı), kit de kabı tanımıyordu. *"markup taşındı, davranış
        kalmadı"* deseninin kit karşılığı — yüzey tam, sürücü yok.
        (hafıza: "aynı boşluğa üç ajan birden" — alan sahipsizdi.)

     DEĞER NEREYE YAZILIR (üç kademe, hepsi markup'ın BİLDİRDİĞİ yerden):
       1 · kabın `data-ad`ı ile eşleşen gizli girdi
       2 · kabın hemen ardındaki `input[type=hidden]` (rozet formunun
           `#rfIkonAlan` kalıbı — ölçüldü, kap ile kardeş)
       3 · hiçbiri yoksa seçim yalnız durum olarak yazılır; uydurma bir
           alan AÇILMAZ (§26 "ada bakan talimat").

     ⚠ ANAHTAR DA UYDURULMAZ: `data-deger` yoksa `data-ico`, o da yoksa
       kalemin metni. Üçü de markup'ın kendi bildirimi.
     ⚠ ÖNİZLEME VE AD: kap `data-onizle` / `data-ad-yazar` ile bir hedef
       BİLDİRİYORSA kit onu tazeler; bildirmiyorsa dokunmaz.
     ⚠ KAPSAM DAR: süzgeç şeridi, süzgeç yüzeyi, `.coklu-secim` ve üst
       aramanın `.acilir-yuzey`i DIŞARIDA — üçünün de kendi sürücüsü var
       ve iki sürücü aynı tıklamayı çevirirse net etki sıfır olur
       (§1b'nin kayıtlı "iki dinleyici" vakası).                       */
  document.addEventListener('click', function (e) {
    var k = e.target.closest ? e.target.closest('[role="option"]') : null;
    if (!k) return;
    var kap = k.closest('[role="listbox"]');
    if (!kap) return;
    /* kendi sürücüsü olan yüzeyler */
    if (kap.classList.contains('acilir-yuzey') || kap.closest('.coklu-secim') ||
        kap.closest('.suzgec-cubuk') || kap.closest('.panel-arama')) return;
    e.preventDefault();

    var tek = kap.getAttribute('aria-multiselectable') !== 'true';
    var deger = k.getAttribute('data-deger') || k.getAttribute('data-ico') ||
                (k.textContent || '').trim();
    var secildi = k.getAttribute('aria-selected') !== 'true';
    if (tek) {
      kap.querySelectorAll('[role="option"]').forEach(function (x) { cipDurum(x, x === k && secildi); });
    } else {
      cipDurum(k, secildi);
    }

    /* değer yazılır — üç kademe, hepsi bildirilmiş hedefe */
    var seciliDegerler = [].slice.call(kap.querySelectorAll('[role="option"][aria-selected="true"]'))
      .map(function (x) { return x.getAttribute('data-deger') || x.getAttribute('data-ico') || (x.textContent || '').trim(); });
    var ad = kap.getAttribute('data-ad');
    var alan = null;
    if (ad) alan = document.querySelector('input[name="' + ad + '"], input#' + ad);
    if (!alan) {
      var kardes = kap.nextElementSibling;
      while (kardes && !alan) {
        if (kardes.tagName === 'INPUT' && kardes.type === 'hidden') alan = kardes;
        kardes = kardes.nextElementSibling;
      }
    }
    if (alan) {
      alan.value = seciliDegerler.join(',');
      alan.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /* Önizleme ve ad — YALNIZ markup bildirmişse. */
    var onizleSec = kap.getAttribute('data-onizle');
    if (onizleSec) {
      var o = document.querySelector(onizleSec);
      if (o && deger && secildi) o.className = deger;
    }
    var adSec = kap.getAttribute('data-ad-yazar');
    if (adSec) {
      var a = document.querySelector(adSec);
      if (a) a.textContent = seciliDegerler.join(', ');
    }
    toast(secildi ? (deger + ' seçildi') : 'Seçim kaldırıldı');
  });

  /* Yüzeyin "Tümü" çipi: markup bildiriyorsa o, yoksa metinden bulunur
     ve BİR KEZ damgalanır. Damga sayesinde kural metne değil bildirime
     bakar; başka dilde/adda bir "hepsi" çipi `data-cip-tumu` yazarak
     kendini bildirebilir. */
  function tumuCipi(yuzey) {
    var d = yuzey.querySelector('[data-cip-tumu]');
    if (d) return d;
    var bulunan = null;
    yuzey.querySelectorAll('.cip').forEach(function (c) {
      if (!bulunan && TUMU_METIN.test((c.textContent || '').trim())) bulunan = c;
    });
    if (bulunan) bulunan.setAttribute('data-cip-tumu', '');
    return bulunan;
  }

  /* Kuralın kapsadığı yüzey: süzgeç şeridindeki çip yüzeyi.
     🔴 Tarih aralığı süzgeci HARİÇ — o `admin-tarih.js`in kendi tek-seçim
        kipi ve "Tümü" çipi yok (ilk kalemi "Bugün"). Konuma göre "ilk çip
        Tümü'dür" varsayımı panel.js'te vardı ve orada da yanlıştı. */
  function suzgecYuzeyi(el) {
    var y = el.closest ? el.closest('.acilir-yuzey') : null;
    if (!y || y.hasAttribute('data-tarih-suzgec')) return null;
    if (!y.closest('.suzgec-cubuk')) return null;
    return y;
  }

  /* Tetikteki sayaç: AKTİF ama Tümü OLMAYAN çip sayısı.
     panel.js aynı sayıyı `:not(:first-child)` ile konumdan çıkarıyordu;
     burada bildirimden çıkıyor ve kit sonra koştuğu için bu değer kalır. */
  function tetikSayaci(yuzey) {
    var tumu = tumuCipi(yuzey), n = 0;
    yuzey.querySelectorAll('.cip').forEach(function (c) {
      if (c !== tumu && cipAcik(c)) n++;
    });
    var tetik = yuzey.id ? document.querySelector('[aria-controls="' + yuzey.id + '"]') : null;
    var s = tetik && tetik.querySelector('.sayi');
    if (s) { s.textContent = n ? String(n) : ''; s.setAttribute('data-sayi', String(n)); }
    return n;
  }

  /* Yüzeyi kurala uydurur. Duruma bakar, tıklanan çipe değil —
     iki kez koşarsa aynı sonucu verir. */
  function tumuNormalle(yuzey, tiklanan) {
    var tumu = tumuCipi(yuzey);
    if (!tumu) return;
    var digerler = [];
    yuzey.querySelectorAll('.cip').forEach(function (c) { if (c !== tumu) digerler.push(c); });

    if (!tiklanan) digerler.forEach(function (c) { cipDurum(c, c.classList.contains('aktif')); });
    if (tiklanan === tumu) {
      /* Tümü'ye basmak seçimi sıfırlar — ötekiler düşer. */
      cipDurum(tumu, true);
      digerler.forEach(function (c) { cipDurum(c, false); });
    } else {
      /* 🔴 SEÇİLEN ÇİPİN KENDİ ARIA'SI DA YALAN SÖYLÜYORDU. Çoklu seçim
         yüzeyinde `.aktif`i panel.js çeviriyor, `aria-pressed`e hiç
         dokunmuyor: "DadaFit" görsel olarak seçili, ekran okuyucuya
         `aria-pressed="false"`. Kuralın ilk yazımı yalnız Tümü'yü
         düzeltiyordu; kapı OR ile okuduğu için ikinci yalanı GÖRMEDİ.
         Kapıya `ariaCeliskisi` kovası eklenince 12 yüzeyde çıktı.
         Kural: BİLDİRİLEN ARIA `.aktif`i izler — sınıf tek gerçektir. */
      digerler.forEach(function (c) { cipDurum(c, c.classList.contains('aktif')); });
      var seciliVar = digerler.some(cipAcik);
      cipDurum(tumu, !seciliVar);      /* kalem varsa düşer · yoksa döner */
    }
    tetikSayaci(yuzey);
  }
  window.DM_TUMU_NORMALLE = tumuNormalle;

  /* Açılış durumu da kurala uyar: markup "Tümü + iki kalem seçili"
     bırakmışsa ekran daha ilk saniyede kendiyle çelişir. */
  function tumuKur() {
    document.querySelectorAll('.suzgec-cubuk .acilir-yuzey').forEach(function (y) {
      if (y.hasAttribute('data-tarih-suzgec')) return;
      if (!tumuCipi(y)) return;
      tumuNormalle(y, null);
    });
  }

  document.addEventListener('click', function (e) {
    var c = e.target.closest ? e.target.closest('.cip') : null;
    if (!c) return;
    var y = suzgecYuzeyi(c);
    if (!y || !tumuCipi(y)) return;
    tumuNormalle(y, c);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tumuKur);
  else tumuKur();


  /* ═══════════════════════════════════════════════════════════════════
     23 · GİRDİ TİPİ — MASKE VE DOĞRULAMA
     ───────────────────────────────────────────────────────────────────
     2026-09-04 · parti 3 · Beyar kuralı (madde 8):
     *"Telefon alanı '+90 5555555555555' kabul ediyor."*

     Alan tipini MARKUP BİLDİRİR, kit sürer:
         data-girdi="telefon|eposta|url|slug|sayi|para|iban|vergino|tarih"

     🔴 AD NEDEN `data-tip` DEĞİL: `data-tip` KANONDA DOLU — üç ekranda
        28 kullanımı var ve anlamı BAŞKA (challenge tipi sureli/seri/
        aliskanlik, hizmet tipi aylik/seans/tanisma). Görev metni
        `data-tip` diyordu; ölçüldü ve kullanılmadı, çünkü kit o adı
        görünce `<label class="onay-kutusu" data-tip="seri">`i girdi
        sanıp maskelemeye çalışırdı. `.kunye` dersinin girdi karşılığı:
        ad yazmadan önce kanon taranır.

     Her tip üç şey yapar: MASKE (yazarken biçimlenir) · SÜZGEÇ
     (yapıştırma temizlenir) · DOĞRULAMA (blur'da K26 kalıbıyla hata).
     ⚠ Maske DEĞERİ BOZMAZ: `value` görünen biçim, ham değer
       `dataset.ham`da (tarih seçicinin `dataset.iso`suyla aynı desen).
     ⚠ `readonly`/`disabled` alan maskelenmez — orada değer bir KAYIT.
     ═══════════════════════════════════════════════════════════════════ */
  var GIRDI = {
    telefon: {
      mod: 'tel', ipucu: '+90 5xx xxx xx xx',
      /* +90 ve ARDINDAN TAM 10 hane. Beyar'ın örneği (+90 5555555555555)
         13 hane ve bu yüzden geçersiz. */
      maske: function (h) {
        var d = h.replace(/\D/g, '');
        if (d.indexOf('90') === 0) d = d.slice(2);
        d = d.slice(0, 10);
        var par = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean);
        return d ? '+90 ' + par.join(' ') : '';
      },
      ham: function (v) { return v.replace(/\D/g, '').replace(/^90/, ''); },
      gecerli: function (v) { return !v || /^\d{10}$/.test(v.replace(/\D/g, '').replace(/^90/, '')); },
      hata: 'Telefon +90 ve 10 hane olmalı — örn. +90 532 111 22 33.'
    },
    eposta: {
      mod: 'email', ipucu: 'ad@alan.com',
      gecerli: function (v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      hata: 'Geçerli bir e-posta adresi yaz — örn. ad@alan.com.'
    },
    url: {
      mod: 'url', ipucu: 'https://',
      maske: function (h) { return h.replace(/\s+/g, ''); },
      gecerli: function (v) {
        var t = v.trim(); if (!t) return true;
        if (t.charAt(0) === '/') return true;         /* site içi yol geçerli */
        try { var u = new URL(t); return u.protocol === 'http:' || u.protocol === 'https:'; }
        catch (e) { return false; }
      },
      hata: 'Adres https:// ile başlamalı ya da / ile site içi yol olmalı.'
    },
    slug: {
      mod: 'text', ipucu: 'kucuk-harf-ve-tire',
      /* Türkçe harfler ASCII karşılığına iner — yoksa adres bozulur. */
      maske: function (h) {
        var tr = { 'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g', 'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c' };
        return h.replace(/[ıİşŞğĞüÜöÖçÇ]/g, function (c) { return tr[c] || c; })
                .toLowerCase().replace(/[^a-z0-9/-]+/g, '-')
                .replace(/-{2,}/g, '-').replace(/^-/, '');
      },
      gecerli: function (v) { return !v || /^[a-z0-9/-]+$/.test(v); },
      hata: 'Adres yalnız küçük harf, rakam ve tire içerebilir.'
    },
    sayi: {
      mod: 'decimal',
      gecerli: function (v, g) {
        if (!v) return true;
        var n = parseFloat(String(v).replace(',', '.'));
        if (isNaN(n)) return false;
        var mn = g && g.getAttribute('min'), mx = g && g.getAttribute('max');
        if (mn !== null && mn !== '' && mn !== undefined && n < parseFloat(mn)) return false;
        if (mx !== null && mx !== '' && mx !== undefined && n > parseFloat(mx)) return false;
        return true;
      },
      hata: function (g) {
        var mn = g.getAttribute('min'), mx = g.getAttribute('max');
        if (mn && mx) return 'Değer ' + mn + ' ile ' + mx + ' arasında olmalı.';
        if (mn) return 'Değer en az ' + mn + ' olmalı.';
        if (mx) return 'Değer en çok ' + mx + ' olabilir.';
        return 'Yalnız sayı yazılabilir.';
      }
    },
    para: {
      mod: 'decimal', ipucu: '0,00',
      /* TR biçimi: binlik nokta, kuruş virgül. */
      maske: function (h) {
        var t = String(h).replace(/[^\d,]/g, '');
        var par = t.split(','), tam = par[0].replace(/^0+(?=\d)/, ''), kur = par[1];
        tam = tam.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return tam ? (tam + (kur !== undefined ? ',' + kur.slice(0, 2) : '')) : '';
      },
      ham: function (v) { return v.replace(/\./g, '').replace(',', '.'); },
      gecerli: function (v) { return !v || /^\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(v); },
      hata: 'Tutar biçimi: 1.250,00'
    },
    iban: {
      mod: 'text', ipucu: 'TR00 0000 0000 0000 0000 0000 00',
      maske: function (h) {
        var t = String(h).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 26);
        return t.replace(/(.{4})/g, '$1 ').trim();
      },
      ham: function (v) { return v.replace(/\s/g, ''); },
      gecerli: function (v) { var t = v.replace(/\s/g, ''); return !t || /^TR\d{24}$/.test(t); },
      hata: 'IBAN TR ile başlar ve 26 karakterdir.'
    },
    vergino: {
      mod: 'numeric', ipucu: '10 hane (VKN) ya da 11 hane (TCKN)',
      maske: function (h) { return String(h).replace(/\D/g, '').slice(0, 11); },
      gecerli: function (v) { return !v || /^\d{10}$/.test(v) || /^\d{11}$/.test(v); },
      hata: 'Vergi no 10, T.C. kimlik no 11 hanedir.'
    },
    tarih: { gecerli: function () { return true; } }   /* `admin-tarih.js` sürüyor */
  };

  function girdiTipi(g) {
    return (g && g.getAttribute) ? (GIRDI[g.getAttribute('data-girdi')] || null) : null;
  }

  function girdiBicimle(g) {
    var t = girdiTipi(g); if (!t || !t.maske) return;
    var once = g.value, bas = g.selectionStart, sonMu = bas === once.length;
    var yeni = t.maske(once);
    if (yeni === once) { if (t.ham) g.dataset.ham = t.ham(yeni); return; }
    g.value = yeni;
    if (t.ham) g.dataset.ham = t.ham(yeni);
    if (!sonMu && g.setSelectionRange) {
      var fark = yeni.length - once.length;
      try { g.setSelectionRange(Math.max(0, bas + fark), Math.max(0, bas + fark)); } catch (e) {}
    }
  }

  function girdiDenetle(g) {
    var t = girdiTipi(g); if (!t) return true;
    var ok = t.gecerli ? t.gecerli(g.value, g) : true;
    var alan = g.closest ? g.closest('.alan') : null;
    if (!alan) return ok;
    if (ok) { if (window.DM_HATA_SIL) window.DM_HATA_SIL(alan); }
    else if (window.DM_HATA_YAZ) {
      window.DM_HATA_YAZ(alan, typeof t.hata === 'function' ? t.hata(g) : t.hata);
    }
    return ok;
  }
  window.DM_GIRDI_DENETLE = girdiDenetle;

  function girdiKur(kok) {
    (kok || document).querySelectorAll('[data-girdi]').forEach(function (g) {
      if (!g.matches || !g.matches('input, textarea')) return;
      if (g.disabled || g.readOnly) return;     /* kayıt — kullanıcı girdisi değil */
      var t = girdiTipi(g); if (!t) return;
      if (t.mod && !g.getAttribute('inputmode')) g.setAttribute('inputmode', t.mod);
      if (t.ipucu && !g.getAttribute('placeholder')) g.setAttribute('placeholder', t.ipucu);
      if (g.value) girdiBicimle(g);
    });
  }
  window.DM_GIRDI_KUR = girdiKur;

  document.addEventListener('input', function (e) {
    var g = e.target;
    if (!g || !g.getAttribute || !g.getAttribute('data-girdi')) return;
    if (g.disabled || g.readOnly) return;
    girdiBicimle(g);
  });
  document.addEventListener('blur', function (e) {
    var g = e.target;
    if (g && g.getAttribute && g.getAttribute('data-girdi')) girdiDenetle(g);
  }, true);
  /* Yapıştırma: maske `input` olayında zaten koşuyor, ama yapıştırılan
     metin bir an ham görünüyordu. */
  document.addEventListener('paste', function (e) {
    var g = e.target;
    if (!g || !g.getAttribute || !g.getAttribute('data-girdi')) return;
    setTimeout(function () { girdiBicimle(g); }, 0);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { girdiKur(); });
  else girdiKur();


  /* ═══════════════════════════════════════════════════════════════════
     24 · YALNIZ-İKON DÜĞME · İPUCU + GERÇEK KARŞILIK
     ───────────────────────────────────────────────────────────────────
     2026-09-04 · parti 3 · Beyar kuralı (madde 9):
     *"Göz, istatistik… hover'da açıklama yok, tıklayınca ne olduğu
     belli değil. Her ikonun gerçek karşılığı olsun."*

     ÖLÇÜLDÜ: 2.155 yalnız-ikon düğme · `aria-label` 2.155/2.155 VAR ·
     ipucu 1.032'sinde YOK. İpucu metni `aria-label`dan TÜRETİLİR —
     ikinci bir metin kaynağı doğmaz, ikisi kayamaz.

     🔴 VE İKİ İKON YANLIŞ İŞ YAPIYORDU (`admin-duyurular`, Beyar'ın
        gösterdiği ekran): göz de istatistik de `data-eylem="calistir"`
        taşıyordu — kitin "Çalışıyor… → toast → zaman damgası" eylemi.
        Yani düğme "önizle" diyor, kronometre çalıştırıyor. Ölü buton
        DEĞİL (toast doğuyor, tarayıcı yeşil veriyor) ama **yanlış iş**;
        bu turun üçüncü "doğru şey mi oldu" kusuru.

     Üç gerçek eylem eklendi:
       `onizle`     → kaydın üye yüzü YENİ SEKMEDE; yoksa satırın
                      BİLDİRDİĞİ hücrelerden önizleme paneli
       `istatistik` → o kaydın sayı taşıyan sütunları, `thead` etiketi
                      ve hedef kitlesiyle birlikte
       `sirala`     → satırı bir yukarı/aşağı taşır (tutamak)

     ⚠ İkisi de veriyi UYDURMAZ: panel satırın kendi hücrelerinden ve
       `thead`in kendi etiketlerinden kurulur, ekranda GÖRÜNEN veridir.
       (§5b'nin yasağı FORM içindir — orada tablodan alan türetmek
       kaydın tam alanlarını göstermediği için yalan olur. Burada
       gösterilen şey zaten o satırın kendisi.)
     ═══════════════════════════════════════════════════════════════════ */


  /* ── ÇİP GRUBU · seçim bir SÜZGEÇTİR (§24) ──────────────────────────
     `admin-yasal-form`un sürüm çipleri (`v5.0 · 15.08.2026` …) hiçbir
     şey yapmıyordu; sayfanın kendi yardım metni ise *"Bir sürüme
     tıklayınca karşılaştırma açılır"* diye söz veriyor. Canlı tıklama
     kapısı üçünü de "karşılıksız" saydı.

     Uydurma bir karşılaştırma görünümü AÇILMADI (§26: "ada bakan
     talimat"). Çipin kendi metni zaten bir ÖLÇÜT ve sayfada o ölçütü
     taşıyan gerçek bir tablo var (yasal formda "Onay kayıtları", her
     satır bir sürüm taşıyor). Çip artık o tabloyu SÜZER: seçim görünür
     bir durum kazanır, satırlar filtrelenir, ikinci tık seçimi kaldırır.

     ⚠ Kapsam dar tutuldu: yalnız `data-eylem` TAŞIMAYAN, süzgeç
       şeridinde OLMAYAN ve `.cipler` grubunda duran çipler. Süzgeç
       şeridinin çipleri §22'nin kendi yolundan geçiyor; form içi çoklu
       seçim çipleri `.coklu-secim` sürücüsünde.                        */
  document.addEventListener('click', function (e) {
    var c = e.target.closest ? e.target.closest('.cipler > .cip') : null;
    if (!c || c.getAttribute('data-eylem') || c.getAttribute('data-deger')) return;
    if (c.closest('.suzgec-cubuk') || c.closest('.coklu-secim') || c.closest('.oran-grubu')) return;
    var grup = c.parentElement;
    e.preventDefault();
    /* 🔴 İLK YAZIM "aynı kartta tablo yoksa karışma" diyordu ve
       `admin-yasal-form`un sürüm çipleri (kartında tablo YOK) hâlâ
       karşılıksız kaldı. Seçim ZATEN bir karşılıktır: durum görünür
       değişir. Tablo varsa ayrıca süzülür — yoksa seçim tek başına
       yeter, uydurma bir görünüm açılmaz. */
    var kart = c.closest('.kart') || document;
    var tablo = kart.querySelector('table tbody') ||
                (function () {
                  var anahtar = (c.textContent || '').trim().split(/[·|]/)[0].trim().toLocaleLowerCase('tr');
                  var bulunan = null;
                  document.querySelectorAll('table tbody').forEach(function (tb) {
                    if (!bulunan && (tb.textContent || '').toLocaleLowerCase('tr').indexOf(anahtar) !== -1) bulunan = tb;
                  });
                  return bulunan;
                })();
    var secildi = !c.classList.contains('aktif');
    grup.querySelectorAll('.cip').forEach(function (x) {
      var bu = x === c && secildi;
      x.classList.toggle('aktif', bu);
      if (x.hasAttribute('aria-pressed')) x.setAttribute('aria-pressed', String(bu));
    });
    var ara = secildi ? (c.textContent || '').trim().split(/[·|]/)[0].trim().toLocaleLowerCase('tr') : '';
    var gorunen = null;
    if (tablo) {
      gorunen = 0;
      [].forEach.call(tablo.rows, function (r) {
        var uyar = !ara || (r.textContent || '').toLocaleLowerCase('tr').indexOf(ara) !== -1;
        r.hidden = !uyar; if (uyar) gorunen++;
      });
      var kap = tablo.closest('table');
      if (secildi && kap) kap.scrollIntoView({ block: 'nearest' });
    }
    toast(secildi
      ? (c.textContent || '').trim() + (gorunen !== null ? ' — ' + gorunen + ' kayıt' : ' seçildi')
      : 'Seçim kaldırıldı' + (gorunen !== null ? ' — ' + gorunen + ' kayıt' : ''));
  });

  /* ── Sıralama: satırı taşı, durumu SÖYLE ────────────────────────
     Tutamak `role` bildirmiyor ama `aria-label`ı ok tuşlarını vaat
     ediyor; ikisi de bağlandı. Taşınan satır kısa süre işaretlenir —
     "bir şey oldu" görünür olmalı, yoksa kullanıcı iki kez basar. */
  /* 🔴 SATIR HER ZAMAN `<tr>` DEĞİL. İlk yazım yalnız tabloyu biliyordu
     ve `admin-menu`nün 90 tutamağı ÖLÜ kaldı — orada satır
     `.adim-karti`. Ölü buton kapısı bunu yakaladı. Kap listesi
     bildirilir; hiçbiri tutmazsa düğmenin kendi kardeş yapısından
     TÜRETİLİR (aynı etiket + aynı sınıfı taşıyan ≥2 kardeş). */
  function siraSatiri(dugme) {
    var bilinen = dugme.closest('tr, li, .adim-karti, .liste-satir, .satir, .kart.satir');
    if (bilinen) return bilinen;
    var e = dugme;
    while (e && e.parentElement) {
      var p = e.parentElement, ayni = 0;
      for (var i = 0; i < p.children.length; i++)
        if (p.children[i].tagName === e.tagName && p.children[i].className === e.className) ayni++;
      if (ayni >= 2) return e;
      e = p;
    }
    return null;
  }

  function siraTasi(dugme, yon) {
    var tr = siraSatiri(dugme); if (!tr) return;
    var govde = tr.parentElement; if (!govde) return;
    var hedef = yon < 0 ? tr.previousElementSibling : tr.nextElementSibling;
    while (hedef && hedef.hidden) hedef = yon < 0 ? hedef.previousElementSibling : hedef.nextElementSibling;
    if (!hedef) { toast(yon < 0 ? 'Satır zaten en üstte.' : 'Satır zaten en altta.', 'uyari'); return; }
    if (yon < 0) govde.insertBefore(tr, hedef); else govde.insertBefore(hedef, tr);
    tr.classList.add('siralaniyor');
    setTimeout(function () { tr.classList.remove('siralaniyor'); }, 900);
    var kardesler = govde.rows ? [].slice.call(govde.rows) : [].slice.call(govde.children);
    var sira = kardesler.indexOf(tr) + 1;
    /* Sıra numarası taşıyan hücreler varsa yeniden numaralanır. */
    kardesler.forEach(function (r, i) {
      var n = r.querySelector('[data-rol="sira-no"], .sira-no');
      if (n) n.textContent = String(i + 1);
      var g = r.querySelector('input[data-field="position"], input[name="sira"]');
      if (g) g.value = String(i + 1);
    });
    dugme.focus();
    toast('Sıra değişti — satır ' + sira + '. konumda.');
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    var d = e.target.closest ? e.target.closest('.tutamak, [data-eylem="sirala"]') : null;
    if (!d) return;
    e.preventDefault();
    siraTasi(d, e.key === 'ArrowUp' ? -1 : 1);
  });

  /* ── İpucu: yalnız-ikon her düğmede ─────────────────────────────── */
  function ipucuKur(kok) {
    (kok || document).querySelectorAll('button, a').forEach(function (b) {
      if (b.getAttribute('data-ipucu')) return;
      if ((b.textContent || '').replace(/\s+/g, '')) return;      /* metni var */
      if (!b.querySelector('i[class*="fa-"], svg')) return;       /* ikonu yok */
      var ad = b.getAttribute('aria-label') || b.getAttribute('title') || '';
      if (!ad) return;
      b.setAttribute('data-ipucu', ad);
      /* `title` de duruyorsa tarayıcının kendi balonu ikinci bir yüzey
         olur ve ikisi üst üste çıkar — kit balonu tek kalır. */
      if (b.getAttribute('title')) b.removeAttribute('title');
    });
  }
  window.DM_IPUCU_KUR = ipucuKur;

  /* ── Satırın BİLDİRDİĞİ veriyi oku: thead etiketi + hücre ───────── */
  function satirVerisi(tr) {
    var tablo = tr.closest('table'); if (!tablo) return [];
    var bas = [].slice.call(tablo.querySelectorAll('thead th')).map(function (th) {
      return (th.textContent || '').replace(/\s+/g, ' ').trim();
    });
    var out = [];
    [].forEach.call(tr.cells, function (td, i) {
      if (td.classList.contains('sec') || td.classList.contains('eylem')) return;
      var etiket = bas[i] || '';
      var ana = (td.querySelector('b') || td).textContent || '';
      var alt = td.querySelector('small');
      out.push({
        etiket: etiket,
        deger: ana.replace(alt ? (alt.textContent || '') : '', '').replace(/\s+/g, ' ').trim(),
        not: alt ? (alt.textContent || '').replace(/\s+/g, ' ').trim() : '',
        sayi: td.classList.contains('num')
      });
    });
    return out;
  }

  function panelAc(baslik, ikon, satirlar, altNot) {
    var eski = document.querySelector('.kit-onizleme');
    if (eski) eski.remove();
    var k = document.createElement('div');
    k.className = 'onay-ortu kit-onizleme';
    var govde = satirlar.map(function (s) {
      return '<div class="satir-kunye"><span>' + s.etiket + '</span><b>' + (s.deger || '—') + '</b>' +
             (s.not ? '<small>' + s.not + '</small>' : '') + '</div>';
    }).join('');
    k.innerHTML =
      '<div class="onay-kapi" role="dialog" aria-modal="true" aria-labelledby="kitOnzBas">' +
        '<h2 id="kitOnzBas"><i class="fa-solid ' + ikon + '" aria-hidden="true"></i> ' + baslik + '</h2>' +
        '<div class="kit-onizleme-govde">' + govde + '</div>' +
        (altNot ? '<p class="alan-yardim"><span>' + altNot + '</span></p>' : '') +
        '<div class="eylem-satiri"><button type="button" class="dugme hayalet" data-onz-kapat>Kapat</button></div>' +
      '</div>';
    document.body.appendChild(k);
    var odak = document.activeElement;
    function kapat() { k.remove(); if (odak && document.contains(odak)) odak.focus(); }
    k.addEventListener('click', function (e) {
      if (e.target === k || e.target.closest('[data-onz-kapat]')) kapat();
    });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape' && document.contains(k)) { kapat(); document.removeEventListener('keydown', esc); }
    });
    var ilk = k.querySelector('[data-onz-kapat]'); if (ilk) ilk.focus();
    return k;
  }
  window.DM_KIT_PANEL = panelAc;

  function ilkKurulum() { adrestenSuzgec(); ipucuKur(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ilkKurulum);
  } else { ilkKurulum(); }

})();
