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
      /* 🔴 FORM SATIRINDA METİN YOKTUR — ajan C ölçtü (admin-paket-form):
         hücrede `<input>` var, `textContent` boş, ilk metinli hücre bir
         `<select>` ve onun METNİ TÜM SEÇENEK LİSTESİ. Onay modalı
         «"ErişimKotaNitelik" listeden kaldırılacak» diyordu.
         Ad önce DENETİMİN DEĞERİNDEN okunur; metin ikinci sıradadır. */
      var d = h.querySelector('input:not([type=checkbox]):not([type=radio]):not([type=hidden]), select, textarea');
      if (d) {
        var dv = d.tagName === 'SELECT'
          ? ((d.selectedOptions && d.selectedOptions[0] && d.selectedOptions[0].textContent) || '')
          : (d.value || '');
        dv = dv.trim().replace(/\s+/g, ' ');
        if (dv) return dv.slice(0, 60);
        continue;                    /* boş girdi → sonraki hücre; METNİNE bakma */
      }
      var t = (h.textContent || '').trim().replace(/\s+/g, ' ');
      if (t) return t.slice(0, 60);
    }
    /* Satır kendi adını BİLDİRMİŞ olabilir — bildirim sezgiden önce gelir. */
    if (tr.getAttribute && tr.getAttribute('data-ad')) return tr.getAttribute('data-ad').slice(0, 60);
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
      var tekrar = !tr && d.closest('.adim-karti, .kalem-satiri, .tekrar-satiri');
      if (tekrar) {
        e.preventDefault();
        var listeT = tekrar.parentElement;
        var komsuT = tekrar.nextElementSibling;

        /* 🔴 İKİNCİ SİLME YOLU L10'UN İKİ KURALINI DA ÇİĞNİYORDU — ajan C
           ölçtü (admin-challenge-form #chTaslar, gerçek `fill()` ile):
             tek BOŞ satır, sil  → satır 1 → 0   "son satır silinmez" İHLAL
             iki satır, 2. DOLU  → onay YOK      "dolu satır onay ister" İHLAL
           Ve birincisinin bedeli ölçüldü: liste boşalınca `satir-ekle`
           klonlayacak kalıp bulamıyor ve kartın dibine ALAKASIZ TEK ALANLI
           bir satır açıyor — bu dosyanın kendi `satir-ekle` yorumunda
           yazılı olan kusurun ta kendisi. L10'un guard'ı tam da bunu
           önlemek için vardı ama bu dal onu hiç görmüyordu.
           İki dal birbirinin TERSİYDİ: `<tr>` dalı boş satırda bile
           soruyor, `.adim-karti` dalı dolu satırda bile sormuyordu.
           Kural artık TEK KAYNAKTAN (L10) okunuyor. */
        var koruma = window.DM_TEKRAR_KORUMA;
        if (koruma && listeT && koruma.sonMu(listeT)) {
          toast('Son satır silinemez — yeni satır bu satırın kalıbından üretiliyor. İçeriğini boşaltabilirsiniz.');
          return;
        }
        if (koruma && koruma.dolu(tekrar)) {
          onaySor('Satırı sil',
                  'Bu satırdaki bilgiler kaldırılacak. Sürdürmek istiyor musunuz?',
                  'Sil', function (evet) { if (evet) tekrarSil(); });
          return;
        }
        return tekrarSil();

        function tekrarSil() {
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
        }
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
        /* 🔴 KİT SEÇİLEN HEDEFİ UYGULAMIYORDU — ajan A ölçtü: yalnız "sil" ve
           "pasif" tanınıyor, KALAN HER HEDEF `.birlesti` olup hapa
           "Birleştirildi" yazıyordu. Kanıt: `admin-sozluk`ta 3 satır seçili,
           "Arşivle" → toast "Arşivle tamamlandı", durum ["Yayında" ×3]
           DEĞİŞMEDİ. Bu yüzden 20 "Yayınla"/"Arşivle" düğmesi bilerek
           bağlanmamıştı: bağlamak kronometreyi BAŞKA bir yalanla değiştirirdi.
           Hedef artık SONUCUNU bildirebilir: `data-hedefler="Arşivle:Arşivlendi|Sil"`.
           🔴 BİLDİRİLMEMİŞ SONUÇ UYDURULMAZ: "Arşivle"den "Arşivlendi"
              türetmek fiil çekimi tahmin etmektir ve Gastro'da başka
              kelimeyle yazıldığında sessizce yanlış yazardı. Sonuç
              bildirilmemişse hap DEĞİŞTİRİLMEZ ve toast bunu SÖYLER —
              yanlış bir durum yazmaktansa hiç yazmamak. */
        var hedefler = [];
        (d.getAttribute('data-hedefler') || 'Birleştir:Birleştirildi|Pasife al:Pasif|Sil')
          .split('|').forEach(function (h, i) {
            var p = h.split(':');
            hedefler.push({ deger: String(i) + ':' + p[0] + ':' + (p[1] || ''),
                            ad: p[0], ikon: 'fa-arrow-right-arrow-left' });
          });
        secimSor(d.getAttribute('data-baslik') || 'Toplu işlem',
                 secili.length + ' satır seçili.', hedefler, function (v) {
          var parca = v.split(':');
          var ad = parca[1], sonuc = parca[2] || '';
          onaySor(ad + '?', secili.length + ' satıra uygulanacak.', 'Uygula', function (evet) {
            if (!evet) return;
            var yazilan = 0;
            [].forEach.call(secili, function (k) {
              var tr = k.closest('tr'); if (!tr) return;
              if (/^sil/i.test(ad) && !sonuc) { tr.remove(); return; }
              tr.classList.add('toplu-islendi');
              var h = tr.querySelector('.durum-hapi, .rozet, .hap');
              if (sonuc && h) { h.textContent = sonuc; yazilan++; }
              k.checked = false;
            });
            if (tablo && window.DM_SECIM_TAZELE) window.DM_SECIM_TAZELE(tablo);
            toast(sonuc
              ? secili.length + ' satır güncellendi — ' + sonuc.toLocaleLowerCase('tr') + '.'
              : secili.length + ' satıra “' + ad + '” uygulandı. Sonuç durumu markup\'ta bildirilmediği için satır durumu değiştirilmedi (data-hedefler="' + ad + ':<sonuç>").');
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
        /* L10 · klon numarasını, tutamağını ve sil düğmesini kazanır;
           kurulum idempotent (ikinci koşuda 0 yazar). */
        if (window.DM_TEKRAR_KUR) window.DM_TEKRAR_KUR(liste);
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
  /* ── MARKA SÜZGECİ — L4/L5 kütüğünün ikinci boyutu ────────────────
     🔴 "KURAL MARKA BAĞIMSIZ" DEMEK "VERİ MARKA BAĞIMSIZ" DEMEK DEĞİL.
        Ajan C ölçerek çürüttü: kütük üç markanın birleşimiydi ve marka
        bilgisini atıyordu. FIT antrenörüne `ekipman` alanında "Baharat ·
        Baklagil · Balık · Bitkisel süt · Blender" öneriliyordu (47
        değerin 29'u FIT'te yok); `seviye`de 10 değerin ÜÇÜ ŞEF ADIYDI
        (Canan Komi · Ece Aşçı · Nurgül Karaca); `programlar` kütüğündeki
        21 programın 12'si Diet ÖĞÜN PLANIYDI ve antrenör formunda
        "Glütensiz Hafta" bir koçluk programı gibi önerilecekti.
        Kural her markada aynı; VERİNİN markası vardır.
     ⚠ Marka bildirilmemişse (`body[data-marka]` yok) süzme YAPILMAZ —
       kütüğün tamamı döner. Bildirim yoksa varsayım da yoktur. */
  function markaSuz(liste) {
    if (!liste || !liste.length) return [];
    var m = document.body && document.body.getAttribute('data-marka');
    if (!m) return liste;
    /* 🔴 İKİ BİÇİM TESADÜFEN ÇALIŞIYORDU — ajan B yakaladı: `DM_KAYITLAR`
       markayı DİZİ taşıyor (`m:["fit"]`), `DM_SABLONLAR` DİZE (`m:"diet"`).
       `x.m.indexOf(m)` ikisinde de çalışır ama dizede bu ALT DİZE
       aramasıdır: bir marka adı başkasının içinde geçerse (ya da bir gün
       "fit" ile "fitness" yan yana olursa) SESSİZ YANLIŞ POZİTİF verir.
       Biçim burada tekleştirilir; kütük ne taşırsa taşısın karşılaştırma
       TAM EŞİTLİK üzerinden yapılır. */
    var s = liste.filter(function (x) {
      if (!x || !x.m) return false;
      var mm = (typeof x.m === 'string') ? [x.m] : x.m;
      for (var i = 0; i < mm.length; i++) if (mm[i] === m) return true;
      return false;
    });
    return s;
  }
  window.DM_MARKA_SUZ = markaSuz;

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

    /* ── L5 · İLİŞKİLİ KAYIT SEÇİMİ — `data-kayit="<modül>"` ──────────
       "Antrenör dizininden seç", "hareket kataloğundan seç" bir SERBEST
       METİN alanı değildir: kaynak, o modülün liste ekranındaki gerçek
       kayıtlardır. Kütük `kanon/admin-veri.js`te ve HASAT edilmiştir —
       burada hiçbir ad uydurulmaz.
       ⚠ Kütükte olmayan modül `null` döner, yani alan SERBEST GİRİŞE
         düşer (3. basamak). "Bağlı değil" diyen bir yüzey basılmaz. */
    var modul = kap.getAttribute('data-kayit');
    if (modul && window.DM_KAYITLAR && window.DM_KAYITLAR[modul]) {
      var kk = markaSuz(window.DM_KAYITLAR[modul]);
      if (kk.length) return kk.map(function (r) { return r.n; });
      /* Bu markada kayıt yoksa alan SERBEST GİRİŞE düşer — başka markanın
         kaydını önermek uydurma kayıt üretmektir. */
      return null;
    }

    /* ── L4 · ÖNERİ — `data-oneri="<alan adı>"` ───────────────────────
       "Önceden girilmiş verilerden otomatik tamamlama." Öneri kümesi iki
       yerden BİRLEŞTİRİLİR ve ikisi de gerçektir:
         1 · hasat edilmiş sözlük (`DM_ONERI`, üç markanın ekranlarından)
         2 · BU SAYFADA o ada bağlı ne varsa (aynı `data-ad`ı taşıyan
             öteki kapların çipleri, aynı adı taşıyan `<select>`in
             seçenekleri, `<datalist>`)
       İkincisi olmadan öneri DONUK kalırdı: kullanıcının bu oturumda
       girdiği değer bir sonraki alanda önerilmez.                     */
    var oneriAd = kap.getAttribute('data-oneri');
    if (oneriAd) {
      var küme = {}, cikti = [];
      /* 🔴 YER TUTUCU BİR DEĞER DEĞİLDİR — kapı yakaladı: kütük "Seç…"i
         süzüyordu ama kitin SAYFA hasadı (2. kaynak) `<option>`ları ham
         okuyup onu da öneriyordu. FIT ekipman alanında "Seç…" bir etiket
         olarak seçilebiliyordu. Süzgeç kütükte VE burada aynı olmalı;
         iki yerde ayrı ölçüt, iki ayrı gerçektir. */
      var yerTutucu = function (v) {
        return !v
          || /^(seç|seçiniz|seçin|tümü|hepsi|—|–|-|\.\.\.)…?$/i.test(v)
          || /^(seç|seçiniz)\b/i.test(v)
          || /—\s*(sözlükte yok|kayıt yok|bulunamadı|eşleşme yok)/i.test(v);
      };
      var kat = function (v) {
        v = (v || '').replace(/\s+/g, ' ').trim();
        if (yerTutucu(v)) return;
        if (v && !küme[v]) { küme[v] = 1; cikti.push(v); }
      };
      if (window.DM_ONERI && window.DM_ONERI[oneriAd])
        markaSuz(window.DM_ONERI[oneriAd]).forEach(function (o) { kat(o.v); });
      document.querySelectorAll('.coklu-secim[data-oneri="' + oneriAd + '"] .cipler [data-deger]')
        .forEach(function (c) { kat(c.getAttribute('data-deger')); });
      document.querySelectorAll('select[name="' + oneriAd + '"] option, select[name="' + oneriAd + '[]"] option, datalist#dl-' + oneriAd + ' option')
        .forEach(function (o) { kat(o.textContent || o.value); });
      if (cikti.length) return cikti;
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
      /* 🔴 L4 · ÖNERİ ALANI KAPALI LİSTE DEĞİLDİR. `data-oneri` bir
         ETİKET alanıdır: geçmiş değerler ÖNERİLİR, ama yeni bir etiket
         yazılabilir. Öneri kümesi dolu diye serbest girişi kapatmak,
         alanı sessizce bir açılıra çevirirdi — kullanıcı yazdığı etiketi
         ekleyemez, sebebini de göremezdi.
         ⚠ `data-kayit` (ilişkili kayıt) BU DALDAN GEÇMEZ: olmayan bir
           antrenörü seçtirmek uydurma kayıt üretmektir. */
      if (kap.hasAttribute('data-oneri') && q &&
          kaynak.indexOf(q) === -1 && secili.indexOf(q) === -1) {
        var yeni = document.createElement('button');
        yeni.type = 'button'; yeni.className = 'acilir-kalem acilir-yeni';
        yeni.setAttribute('role', 'option'); yeni.setAttribute('data-cs-deger', q);
        yeni.innerHTML = '<i class="fa-solid fa-plus" aria-hidden="true"></i> “' + q + '” ekle';
        y.appendChild(yeni);
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


/* ═══════════════════════════════════════════════════════════════════════
   ADMIN UI KİTİ · LOGIC REVİZE — L1–L11
   ───────────────────────────────────────────────────────────────────────
   Tarih: 2026-09-05 · FIT admin revize · parti 4 · lead
   Kural belgesi: `docs/admin-ui-kit.md` §14 (L kuralları)

   🔴 NUMARA NEDEN "L": Beyar'ın görev metni bu turun kurallarına K1–K11
      diyor. Kanonda K1–K37 DOLU (`admin.css` K1 = ölçek, K11 = görsel
      girdisi) ve sözleşme üç markaya gidiyor — ikinci bir K1 sözleşmede
      ikinci bir gerçektir (§5b'nin "anahtar adı tek" dersinin kural
      karşılığı). Bu turun kuralları L1–L11 olarak yazıldı; eşleme
      tablosu belgede. Beyar'ın adları raporda korunuyor.

   Bu blok YALNIZ bu turun kurallarını taşır. Önceki davranışa
   dokunulmadı; `.coklu-secim` seçenek kaynağına iki basamak (L4 · L5)
   ve `satir-ekle`ye üç yetenek (L10) YERİNDE eklendi — çünkü onlar
   mevcut kalıbın genişlemesi, ikinci bir kalıp değil.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KOK = document.body;
  if (!KOK || !KOK.classList.contains('yetkili')) return;

  var toast = window.DM_TOAST || function () {};
  var onaySor = window.DM_ONAY || function (o, e) { e && e(); };

  function ek(etiket, sinif, metin) {
    var e = document.createElement(etiket);
    if (sinif) e.className = sinif;
    if (metin != null) e.textContent = metin;
    return e;
  }

  /* ═══════════════════════════════════════════════════════════════════
     L1 · VİDEO GİRDİSİ — BAĞLANTI **VEYA** DOSYA, TEK BİLEŞEN
     ───────────────────────────────────────────────────────────────────
     Markup bir alanı bildirir, kit bileşeni kurar:

         <input class="alan-girdi" data-video="video" name="video">

     Doğan yüzey: iki sekme (Bağlantı · Dosya) + önizleme + süre.
     Değer HEP `name`i taşıyan asıl girdide kalır — kit ikinci bir
     kaynak açmaz (§24'ün "ikinci metin kaynağı doğmaz" dersinin video
     karşılığı).

     ── SÜRE: NE OTOMATİK, NE DEĞİL — ölçülerek ayrıldı ─────────────
     🔴 "Süre otomatik" her iki sekmede AYNI ŞEKİLDE karşılanamaz ve
        karşılanmış gibi yapmak yalan olurdu:
          DOSYA      → süre GERÇEKTEN okunur. `<video>` öğesinin
                       `loadedmetadata` olayı saniyeyi verir; ölçüm
                       tarayıcının kendisinden gelir, uydurma yok.
          BAĞLANTI   → YouTube/Vimeo süresi ancak o servisin API'siyle
                       bilinir. Panel bir MAKET ve kit ağ çağrısı
                       YAPMAZ (§7'nin `content_css` dersi: yayında
                       sessizce 404 olan bir bağımlılık, hiç olmayan
                       bağımlılıktan kötüdür). Süre alanı elle kalır ve
                       yüzey bunu YAZAR — sessizce boş bırakmaz.

     ── ÖNİZLEME ────────────────────────────────────────────────────
     YouTube → küçük resim (`img.youtube.com`, `<img>` ile; CORS
     gerekmez ve ağ yoksa alt metne düşer). Vimeo → adres doğrulanır ve
     "Vimeo · <id>" künyesi çizilir (Vimeo küçük resmi ancak API ile
     gelir — uydurulmadı). Dosya → `<video controls>` ile GERÇEK oynatma.

     ⚠ Gerçek yükleme YOK; toast bunu yazar (§10'un kuralı).
     ═══════════════════════════════════════════════════════════════ */

  /* Adres çözümleme — üç servis, hepsi ÖLÇÜLEBİLİR desenle. */
  function videoCozumle(adres) {
    adres = (adres || '').trim();
    if (!adres) return null;
    var yt = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(adres);
    if (yt) return { servis: 'YouTube', kimlik: yt[1], adres: adres,
                     kucuk: 'https://img.youtube.com/vi/' + yt[1] + '/hqdefault.jpg' };
    var vm = /vimeo\.com\/(?:video\/)?(\d{6,})/.exec(adres);
    if (vm) return { servis: 'Vimeo', kimlik: vm[1], adres: adres, kucuk: null };
    if (/^https?:\/\//i.test(adres) && /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(adres))
      return { servis: 'Doğrudan dosya', kimlik: adres.split('/').pop(), adres: adres, kucuk: null, dogrudan: true };
    return { servis: null, adres: adres };
  }

  function sureYaz(kap, saniye) {
    /* 🔴 `querySelector('')` FIRLATIR — bildirim yoksa boş dize geçiyordu
       ve kapı üç JS hatası saydı. Hedef bildirilmemişse alan YOKTUR. */
    var hedefSec = kap.getAttribute('data-sure-hedef');
    var alan = hedefSec ? document.querySelector(hedefSec) : null;
    var etiket = kap.querySelector('[data-rol="video-sure"]');
    if (saniye == null || !isFinite(saniye)) {
      if (etiket) etiket.textContent = '';
      return;
    }
    var s = Math.round(saniye);
    var dk = Math.floor(s / 60), sn = s % 60;
    if (etiket) etiket.textContent = 'Süre: ' + dk + ':' + (sn < 10 ? '0' : '') + sn + ' (' + s + " sn, dosyadan okundu)";
    /* Hedef alan BİLDİRİLMİŞSE doldurulur — kit rastgele bir "süre"
       alanı aramaz (denetimin öznesi kayar dersi). */
    if (alan) { alan.value = String(s); alan.dispatchEvent(new Event('input', { bubbles: true })); }
  }

  function videoOnizle(kap) {
    var yuzey = kap.querySelector('[data-rol="video-onizleme"]');
    var asil = kap.querySelector('[data-rol="video-adres"]');
    if (!yuzey || !asil) return;
    yuzey.innerHTML = '';
    var v = videoCozumle(asil.value);
    if (!v) { yuzey.hidden = true; sureYaz(kap, null); return; }
    yuzey.hidden = false;

    if (!v.servis) {
      var uy = ek('p', 'alan-yardim');
      uy.appendChild(ek('span', null, 'Adres tanınmadı. YouTube, Vimeo ya da doğrudan bir video dosyası adresi bekleniyor.'));
      yuzey.appendChild(uy);
      sureYaz(kap, null);
      return;
    }

    if (v.dogrudan) {
      var vid = document.createElement('video');
      vid.className = 'video-oynatici'; vid.controls = true; vid.preload = 'metadata';
      vid.src = v.adres;
      vid.addEventListener('loadedmetadata', function () { sureYaz(kap, vid.duration); });
      yuzey.appendChild(vid);
    } else if (v.kucuk) {
      var im = document.createElement('img');
      im.className = 'video-kucuk'; im.src = v.kucuk; im.loading = 'lazy';
      im.alt = v.servis + ' videosunun küçük resmi';
      yuzey.appendChild(im);
    }
    var kunye = ek('p', 'alan-yardim');
    kunye.appendChild(ek('span', null, v.servis + ' · ' + v.kimlik));
    yuzey.appendChild(kunye);

    if (!v.dogrudan) {
      /* 🔴 SESSİZ BOŞLUK YOK — sürenin NEDEN okunamadığı yazılır. */
      var not = ek('p', 'alan-yardim');
      not.appendChild(ek('span', null, 'Süre ' + v.servis + ' bağlantısından okunamaz (servis API’si gerekir); elle girilir. Dosya yüklenirse süre kendiliğinden dolar.'));
      yuzey.appendChild(not);
      sureYaz(kap, null);
    }
  }

  function videoKur(girdi) {
    if (girdi.getAttribute('data-video-kuruldu') === '1') return;
    girdi.setAttribute('data-video-kuruldu', '1');

    var kap = ek('div', 'video-girdi');
    var kimlik = girdi.id || ('vg-' + Math.random().toString(36).slice(2, 8));
    if (girdi.getAttribute('data-sure-hedef')) kap.setAttribute('data-sure-hedef', girdi.getAttribute('data-sure-hedef'));

    /* İki sekme — kanonun `.sekmeler` sözleşmesi (§3), ikinci bir
       sekme sınıfı AÇILMAZ. */
    var ray = ek('div', 'sekmeler video-sekmeler');
    ray.setAttribute('role', 'tablist');
    ray.setAttribute('aria-label', 'Video kaynağı');
    var sBag = ek('button', 'sekme aktif', 'Bağlantı');
    var sDos = ek('button', 'sekme', 'Dosya yükle');
    [sBag, sDos].forEach(function (s, i) {
      s.type = 'button'; s.setAttribute('role', 'tab');
      s.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      s.setAttribute('data-video-sekme', i === 0 ? 'bag' : 'dosya');
      ray.appendChild(s);
    });

    var pBag = ek('div', 'video-pano'); pBag.setAttribute('data-video-pano', 'bag');
    var pDos = ek('div', 'video-pano'); pDos.setAttribute('data-video-pano', 'dosya'); pDos.hidden = true;

    /* Asıl girdi YERİNDE kalır — `name`i, değeri, doğrulaması onun. */
    girdi.setAttribute('data-rol', 'video-adres');
    girdi.parentNode.insertBefore(kap, girdi);
    pBag.appendChild(girdi);

    var dosya = document.createElement('input');
    dosya.type = 'file'; dosya.accept = 'video/*'; dosya.className = 'alan-girdi';
    dosya.id = kimlik + '-dosya';
    dosya.setAttribute('aria-label', 'Video dosyası seç');
    pDos.appendChild(dosya);

    var onizleme = ek('div', 'video-onizleme');
    onizleme.setAttribute('data-rol', 'video-onizleme');
    onizleme.hidden = true;
    var sure = ek('p', 'alan-yardim');
    var sureSpan = ek('span'); sureSpan.setAttribute('data-rol', 'video-sure');
    sure.appendChild(sureSpan);

    kap.appendChild(ray); kap.appendChild(pBag); kap.appendChild(pDos);
    kap.appendChild(onizleme); kap.appendChild(sure);

    ray.addEventListener('click', function (e) {
      var s = e.target.closest('[data-video-sekme]');
      if (!s) return;
      var bag = s.getAttribute('data-video-sekme') === 'bag';
      [sBag, sDos].forEach(function (x) {
        var a = x === s;
        x.classList.toggle('aktif', a);
        x.setAttribute('aria-selected', String(a));
      });
      pBag.hidden = !bag; pDos.hidden = bag;
    });

    girdi.addEventListener('input', function () { videoOnizle(kap); });
    girdi.addEventListener('change', function () { videoOnizle(kap); });

    dosya.addEventListener('change', function () {
      var f = dosya.files && dosya.files[0];
      if (!f) return;
      onizleme.hidden = false; onizleme.innerHTML = '';
      var vid = document.createElement('video');
      vid.className = 'video-oynatici'; vid.controls = true; vid.preload = 'metadata';
      var url = URL.createObjectURL(f);
      vid.src = url;
      vid.addEventListener('loadedmetadata', function () { sureYaz(kap, vid.duration); });
      onizleme.appendChild(vid);
      var k = ek('p', 'alan-yardim');
      k.appendChild(ek('span', null, f.name + ' · ' + (f.size / 1048576).toFixed(1) + ' MB'));
      onizleme.appendChild(k);
      /* 🔴 MAKET OLDUĞU YAZILIR — dosya sunucuya GİTMEZ. */
      toast('Video önizlemesi hazır. Bu makette dosya sunucuya yüklenmez.');
    });

    if (girdi.value) videoOnizle(kap);
  }

  /* ═══════════════════════════════════════════════════════════════════
     L2 · HAZIR METİN ŞABLONU — ARA, SEÇ, ÜSTÜNE YAZ
     ───────────────────────────────────────────────────────────────────
     "Güvenlik uyarısı", "güvenlik notu", "program uyarısı" gibi alanlar
     her kayıtta yeniden yazılmaz: şablon kütüphanesinden ARANIP seçilir,
     seçilen metin alana İNER ve orada SERBESTÇE düzenlenir.

         <textarea data-sablon="guvenlik" …>

     Kütüphane `window.DM_SABLONLAR` — `admin-ayarlar`ın "Metin
     şablonları" sekmesinde liste + form ile yönetilir (§5b: düzenle =
     tam sayfa form, `admin-sablon-form.html?id=`).

     🔴 ÇOK SEÇİM, VE SEÇİLEN METİN ALANA İNER — kit alanı KİLİTLEMEZ.
        Şablon bir başlangıç metnidir, bir değer değil. Seçim alanın
        SONUNA eklenir; var olan metin silinmez (yazdığını yutan bir
        yardımcı, yardımcı değildir).
     ⚠ Kütük yoksa düğme HİÇ DOĞMAZ — "şablon yok" diyen ölü bir düğme
       basmak §11'in yasağıdır.
     ═══════════════════════════════════════════════════════════════ */

  function sablonlar(tur) {
    var k = window.DM_SABLONLAR && window.DM_SABLONLAR[tur];
    if (!k || !k.length) return null;
    /* 🔴 ŞABLONUN DA MARKASI VAR (ajan C): `not` türündeki 10 şablonun
       10'unun kaynağı Diet'in hesaplayıcı formu (BMH/BKİ metodoloji
       notları). FIT challenge özetine "Mifflin-St Jeor denklemi
       kullanılır" önermek olurdu — tür aynı, İÇERİĞİ başka markanın. */
    var s = window.DM_MARKA_SUZ ? window.DM_MARKA_SUZ(k) : k;
    return s.length ? s : null;      /* bu markada şablon yoksa düğme DOĞMAZ */
  }

  function sablonAc(alan, tur) {
    var liste = sablonlar(tur);
    if (!liste) return;
    var secili = {};
    var kap = ek('div', 'kit-kapi');
    kap.setAttribute('role', 'dialog');
    kap.setAttribute('aria-modal', 'true');
    kap.setAttribute('aria-label', 'Hazır metin şablonları');

    var kutu = ek('div', 'kit-kapi-kutu');
    kutu.appendChild(ek('h2', null, 'Hazır metin şablonu'));
    var ara = document.createElement('input');
    ara.type = 'search'; ara.className = 'alan-girdi'; ara.placeholder = 'Şablon ara…';
    ara.setAttribute('aria-label', 'Şablon ara');
    kutu.appendChild(ara);
    var govde = ek('div', 'sablon-listesi');
    kutu.appendChild(govde);
    var sayac = ek('p', 'alan-yardim');
    var sayacSpan = ek('span'); sayac.appendChild(sayacSpan);
    kutu.appendChild(sayac);

    var satir = ek('div', 'eylem-satiri');
    var vaz = ek('button', 'dugme hayalet', 'Vazgeç'); vaz.type = 'button';
    var uyg = ek('button', 'dugme birincil', 'Seçilenleri ekle'); uyg.type = 'button';
    satir.appendChild(vaz); satir.appendChild(uyg);
    kutu.appendChild(satir);
    kap.appendChild(kutu);

    function ciz() {
      var q = (ara.value || '').toLocaleLowerCase('tr').trim();
      govde.innerHTML = '';
      var uyan = liste.filter(function (s) {
        return !q || (s.ad + ' ' + s.metin).toLocaleLowerCase('tr').indexOf(q) !== -1;
      });
      uyan.forEach(function (s, i) {
        var l = ek('label', 'sablon-kalem');
        var c = document.createElement('input');
        c.type = 'checkbox'; c.value = s.ad; c.checked = !!secili[s.ad];
        c.addEventListener('change', function () {
          if (c.checked) secili[s.ad] = s.metin; else delete secili[s.ad];
          say();
        });
        l.appendChild(c);
        var g = ek('span', 'sablon-govde');
        g.appendChild(ek('b', null, s.ad));
        g.appendChild(ek('small', null, s.metin));
        l.appendChild(g);
        govde.appendChild(l);
      });
      if (!uyan.length) {
        /* Boş sonuç KAÇ KAYITTA arandığını yazar (§18'in dersi). */
        govde.appendChild(ek('div', 'acilir-bos', '“' + ara.value + '” ' + liste.length + ' şablonda bulunamadı'));
      }
    }
    function say() {
      var n = Object.keys(secili).length;
      sayacSpan.textContent = n ? n + ' şablon seçildi' : liste.length + ' şablon · birden çok seçilebilir';
      uyg.disabled = !n;
    }

    ara.addEventListener('input', ciz);
    ciz(); say();

    function kapat() { kap.remove(); if (alan && document.contains(alan)) alan.focus(); }
    vaz.addEventListener('click', kapat);
    kap.addEventListener('click', function (e) { if (e.target === kap) kapat(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape' && document.contains(kap)) { kapat(); document.removeEventListener('keydown', esc); }
    });
    uyg.addEventListener('click', function () {
      var metin = Object.keys(secili).map(function (a) { return secili[a]; }).join('\n\n');
      if (!metin) return;
      /* TinyMCE sürülüyorsa değeri EDİTÖRE yazmak gerekir; textarea'ya
         yazmak sessizce kaybolurdu (editörün kendi tamponu var). */
      var ed = window.tinymce && window.tinymce.get && alan.id && window.tinymce.get(alan.id);
      if (ed) {
        var eski = ed.getContent({ format: 'text' }).trim();
        ed.setContent((eski ? ed.getContent() : '') +
          metin.split('\n\n').map(function (p) { return '<p>' + p + '</p>'; }).join(''));
      } else {
        alan.value = (alan.value.trim() ? alan.value.replace(/\s+$/, '') + '\n\n' : '') + metin;
        alan.dispatchEvent(new Event('input', { bubbles: true }));
      }
      kapat();
      toast(Object.keys(secili).length + ' şablon eklendi. Metin serbestçe düzenlenebilir.');
    });

    document.body.appendChild(kap);
    ara.focus();
  }

  function sablonKur(alan) {
    if (alan.getAttribute('data-sablon-kuruldu') === '1') return;
    var tur = alan.getAttribute('data-sablon');
    if (!sablonlar(tur)) return;          /* kütük yok → düğme DOĞMAZ */
    alan.setAttribute('data-sablon-kuruldu', '1');
    var d = ek('button', 'dugme hayalet sablon-dugme');
    d.type = 'button';
    d.innerHTML = '<i class="fa-solid fa-file-lines" aria-hidden="true"></i> Hazır şablondan ekle';
    d.addEventListener('click', function () { sablonAc(alan, tur); });
    var etiket = alan.closest('.alan');
    if (etiket) etiket.appendChild(d); else alan.parentNode.insertBefore(d, alan.nextSibling);
  }

  /* ═══════════════════════════════════════════════════════════════════
     L3 · İKON SEÇİCİ — GÖRSELLİ, ARANABİLİR
     ───────────────────────────────────────────────────────────────────
     🔴 SERBEST METİN İKON ADI YASAK. Bir ikon alanına elle "fa-star"
        yazmak iki kusur üretir: yanlış yazım sessizce boş bir kare
        çizer, ve yönetici hangi adların var olduğunu HİÇ göremez.

         <input data-ikon name="ikon">      → seçiciye çevrilir

     Kütüphane `kanon/admin-ikon-kutuphane.js` — 485 ikon, projede
     GERÇEKTEN kullanılanlardan hasat edilmiş. Yazınca süzer; ikonun
     KENDİSİ ve adı birlikte görünür.

     ⚠ Değer yine `name`i taşıyan girdide durur (gizlenir, silinmez):
       form gönderimi, `formDoldur` ve doğrulama onu bulmaya devam eder.
       "Eleman durdu, öznitelik düştü" dersinin tersi — eleman DURUYOR.
     ═══════════════════════════════════════════════════════════════ */

  function ikonKutuphane() {
    return (window.DM_IKONLAR && window.DM_IKONLAR.length) ? window.DM_IKONLAR : null;
  }

  /* Değer iki biçimde geliyor: "fa-star" ve "star" (ekranların yarısı
     ön eki yazmıyor — ölçüldü). İkisi de aynı ikondur. */
  function ikonNormal(v) {
    v = (v || '').trim().replace(/^fa-(solid|regular|brands)\s+/, '').trim();
    if (!v) return '';
    return /^fa-/.test(v) ? v : 'fa-' + v;
  }

  function ikonSeciciKur(girdi) {
    if (girdi.getAttribute('data-ikon-kuruldu') === '1') return;
    /* 🔴 ÇİFT SÜRÜCÜ YASAK — ajan C ölçtü: `admin-rozet-form`un ikon alanı
       bu turda zaten `.coklu-secim`e bağlanmış (46 ikon, hepsi kütüphanede
       var). Oraya `data-ikon` eklenince yüzey 1 → 3 oldu: tek alanda iki
       sürücü. Bir alanın tek yüzeyi olur; kit ikinciyi AÇMAZ.
       (Madde 5'in "alan başına tek editör" dersinin ikon karşılığı.) */
    if (girdi.closest && girdi.closest('.coklu-secim')) return;
    var kut = ikonKutuphane();
    if (!kut) return;                    /* kütüphane yok → alan olduğu gibi kalır */
    girdi.setAttribute('data-ikon-kuruldu', '1');

    /* 🔴 İKON ALANI HER ZAMAN `<input>` DEĞİL — ÖLÇÜLDÜ. FIT'te 66 ikon
       alanının 10'u `<select class="alan-secim">` (admin-hareket-form'un
       ÜÇÜ de öyle). İlk yazım yalnız `<input>` kuruyordu ve o ekranlarda
       seçici HİÇ DOĞMUYORDU — kapı "ikon alanı bulunamadı" diyordu ve
       kusur alanın TİPİNDEYDİ, yokluğunda değil.
       `<select>` değeri taşımaya devam eder (form gönderimi, `formDoldur`);
       yalnız yüzeyi gizlenir. Seçilen ikon listede yoksa seçeneği kit
       EKLER — kütüphane 485, bir ekranın listesi 81. */
    var secimMi = girdi.tagName === 'SELECT';

    var kap = ek('div', 'ikon-secici');
    girdi.parentNode.insertBefore(kap, girdi);
    kap.appendChild(girdi);
    if (secimMi) { girdi.hidden = true; girdi.setAttribute('aria-hidden', 'true'); girdi.tabIndex = -1; }
    else { girdi.type = 'hidden'; }      /* değer DURUYOR, yüzeyi değişti */

    var tetik = ek('button', 'alan-girdi ikon-tetik');
    tetik.type = 'button';
    tetik.setAttribute('aria-haspopup', 'listbox');
    tetik.setAttribute('aria-expanded', 'false');
    var goster = ek('span', 'ikon-gosterim');
    tetik.appendChild(goster);
    kap.appendChild(tetik);

    var yuzey = ek('div', 'acilir-yuzey ikon-yuzey');
    yuzey.hidden = true;
    yuzey.setAttribute('role', 'listbox');
    yuzey.setAttribute('aria-label', 'İkon seç');
    var ara = document.createElement('input');
    ara.type = 'search'; ara.className = 'alan-girdi ikon-ara';
    ara.placeholder = 'İkon ara…';
    ara.setAttribute('aria-label', 'İkon ara');
    var izgara = ek('div', 'ikon-izgara');
    var bos = ek('p', 'acilir-bos');
    bos.hidden = true;
    yuzey.appendChild(ara); yuzey.appendChild(izgara); yuzey.appendChild(bos);
    kap.appendChild(yuzey);

    function tetikCiz() {
      var v = ikonNormal(girdi.value);
      goster.innerHTML = '';
      if (v) {
        var i = document.createElement('i');
        i.className = 'fa-solid ' + v; i.setAttribute('aria-hidden', 'true');
        goster.appendChild(i);
        goster.appendChild(ek('span', null, v));
        tetik.setAttribute('aria-label', 'Seçili ikon: ' + v + ' — değiştir');
      } else {
        goster.appendChild(ek('span', 'ikon-bos', 'İkon seç'));
        tetik.setAttribute('aria-label', 'İkon seç');
      }
    }

    function izgaraCiz() {
      var q = (ara.value || '').toLocaleLowerCase('tr').trim();
      izgara.innerHTML = '';
      var uyan = kut.filter(function (x) {
        if (!q) return true;
        if (x.i.indexOf(q) !== -1) return true;
        for (var j = 0; j < x.k.length; j++) if (x.k[j].indexOf(q) !== -1) return true;
        return false;
      });
      /* 🔴 SINIRSIZ ÇİZİM YOK: 485 ikonun hepsini her tuşta çizmek
         ölçülebilir bir yavaşlık. İlk 120 çizilir, kalanı sayıyla
         BİLDİRİLİR — "gizlendi" değil, "daraltın" denir. */
      uyan.slice(0, 120).forEach(function (x) {
        var d = ek('button', 'ikon-kalem');
        d.type = 'button';
        d.setAttribute('role', 'option');
        d.setAttribute('data-ikon-deger', x.i);
        d.setAttribute('aria-selected', String(ikonNormal(girdi.value) === x.i));
        d.title = '';
        d.setAttribute('data-ipucu', x.i);
        d.innerHTML = '<i class="fa-solid ' + x.i + '" aria-hidden="true"></i><span>' + x.i.replace(/^fa-/, '') + '</span>';
        izgara.appendChild(d);
      });
      bos.hidden = uyan.length !== 0;
      if (!uyan.length) bos.textContent = '“' + ara.value + '” ' + kut.length + ' ikonda bulunamadı';
      else if (uyan.length > 120) {
        bos.hidden = false;
        bos.textContent = uyan.length + ' ikon uyuyor · ilk 120 gösteriliyor, aramayı daraltın';
      }
    }

    function ac() {
      yuzey.hidden = false; tetik.setAttribute('aria-expanded', 'true');
      izgaraCiz(); ara.focus();
    }
    function kapat() {
      yuzey.hidden = true; tetik.setAttribute('aria-expanded', 'false');
    }

    tetik.addEventListener('click', function () { yuzey.hidden ? ac() : kapat(); });
    ara.addEventListener('input', izgaraCiz);
    izgara.addEventListener('click', function (e) {
      var k = e.target.closest('[data-ikon-deger]');
      if (!k) return;
      var yeniDeger = k.getAttribute('data-ikon-deger');
      if (secimMi) {
        /* Seçenek listede yoksa eklenir — yoksa `value` ataması sessizce
           DÜŞER ve seçici çalışıyor görünüp hiçbir şey kaydetmezdi. */
        var varMi = [].some.call(girdi.options, function (o) { return ikonNormal(o.value) === yeniDeger; });
        if (!varMi) {
          var o = document.createElement('option');
          o.value = yeniDeger; o.textContent = yeniDeger.replace(/^fa-/, '');
          girdi.appendChild(o);
        }
        [].forEach.call(girdi.options, function (o) {
          if (ikonNormal(o.value) === yeniDeger) girdi.value = o.value;
        });
      } else {
        girdi.value = yeniDeger;
      }
      girdi.dispatchEvent(new Event('change', { bubbles: true }));
      tetikCiz(); kapat(); tetik.focus();
    });
    yuzey.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { kapat(); tetik.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (!kap.contains(e.target)) kapat();
    });
    girdi.addEventListener('change', tetikCiz);
    tetikCiz();
  }

  /* ═══════════════════════════════════════════════════════════════════
     L5b · DÖRT VE ÜSTÜ SEÇENEKLİ RADYO → AÇILIR
     ───────────────────────────────────────────────────────────────────
     Beyar: *"4+ seçenekli radio yok → dropdown."* Kural KİTTE sürülür,
     ekranlarda değil — çünkü aynı kural Gastro ve Diet'in markup'ına
     dokunmadan orada da koşmalı (marka bağımsızlık ölçütü).

     🔴 DEĞER KORUNUR: `name` · seçili değer · `required` · `disabled`
        aynen geçer. Radyoların kendisi SİLİNMEZ, `hidden` bir kapta
        durur — EKSİ BİRİNCİ MADDE (eleman silinmez) ve form gönderimi
        bozulmaz.
     ⚠ ÜÇ VE ALTI DOKUNULMAZ: az seçenekli radyo grubu hepsini AYNI ANDA
       gösterir ve bu bir üstünlüktür; açılıra çevirmek gizlerdi.
     ⚠ Görsel/ikonlu seçenek kartları (`.secim-karti`) dışarıda: onlar
       bir radyo grubu değil, bir GÖRSEL seçim yüzeyi.
     ═══════════════════════════════════════════════════════════════ */

  function radyoGruplari(kok) {
    var harita = {};
    (kok || document).querySelectorAll('.alan input[type="radio"][name]').forEach(function (r) {
      if (r.closest('.secim-karti, .oran-grubu, [data-radyo-birak]')) return;
      (harita[r.name] = harita[r.name] || []).push(r);
    });
    return harita;
  }

  function radyoAcilira(kok) {
    var harita = radyoGruplari(kok), donusen = 0;
    Object.keys(harita).forEach(function (ad) {
      var rs = harita[ad];
      if (rs.length < 4) return;
      var alan = rs[0].closest('.alan');
      if (!alan || alan.getAttribute('data-radyo-donustu') === '1') return;
      alan.setAttribute('data-radyo-donustu', '1');

      var sec = document.createElement('select');
      sec.className = 'alan-secim';
      var etiket = alan.querySelector('.alan-etiket');
      if (etiket) {
        if (!etiket.id) etiket.id = 'lbl-' + ad.replace(/[^\w-]/g, '');
        sec.setAttribute('aria-labelledby', etiket.id);
      } else {
        sec.setAttribute('aria-label', ad);
      }
      if (rs[0].required) sec.required = true;

      var bos = document.createElement('option');
      bos.value = ''; bos.textContent = 'Seçiniz…';
      sec.appendChild(bos);

      rs.forEach(function (r) {
        var o = document.createElement('option');
        o.value = r.value;
        /* Etiket metni radyonun KENDİ etiketinden okunur; ikinci bir
           metin kaynağı doğmaz. */
        var lb = r.closest('label') ||
                 (r.id && document.querySelector('label[for="' + r.id + '"]'));
        o.textContent = (lb ? lb.textContent : r.value).replace(/\s+/g, ' ').trim() || r.value;
        if (r.checked) o.selected = true;
        if (r.disabled) o.disabled = true;
        sec.appendChild(o);
      });

      /* Radyolar YAŞAMAYA DEVAM EDER; değeri onlar taşır. */
      var saklama = ek('div', 'radyo-saklama');
      saklama.hidden = true;
      rs.forEach(function (r) {
        var l = r.closest('label');
        saklama.appendChild(l && l.parentNode ? l : r);
      });

      sec.addEventListener('change', function () {
        rs.forEach(function (r) { r.checked = (r.value === sec.value); });
        rs[0].dispatchEvent(new Event('change', { bubbles: true }));
      });

      var sarma = rs[0].closest('.secenek-grubu, .radyo-grubu') || null;
      var yer = sarma && sarma.parentNode ? sarma : alan;
      if (sarma) { sarma.parentNode.insertBefore(sec, sarma); sarma.remove(); }
      else { alan.appendChild(sec); }
      alan.appendChild(saklama);
      donusen++;
    });
    return donusen;
  }

  /* ═══════════════════════════════════════════════════════════════════
     L7 · HESAPLANAN ALAN SALT OKUNUR — KAYNAĞI YAZILI
     ───────────────────────────────────────────────────────────────────
         <input data-hesaplanan="katılımcı sayısı" …>

     🔴 Hesaplanan bir değeri DÜZENLENEBİLİR göstermek iki kere yalandır:
        yönetici değiştirebileceğini sanır, ve değiştirdiği şey bir
        sonraki hesapta geri döner. Alan `readonly` olur, kaynağı
        yardım rayında YAZILIR ("sistemden: …").
     ⚠ `disabled` DEĞİL `readonly`: `disabled` alan form gönderiminden
       düşer ve değer sessizce kaybolurdu.
     ═══════════════════════════════════════════════════════════════ */

  function hesaplananKur(girdi) {
    if (girdi.getAttribute('data-hesaplanan-kuruldu') === '1') return;
    girdi.setAttribute('data-hesaplanan-kuruldu', '1');
    girdi.readOnly = true;
    girdi.setAttribute('aria-readonly', 'true');
    var kaynak = girdi.getAttribute('data-hesaplanan') || '';
    var alan = girdi.closest('.alan');
    if (!alan) return;
    alan.classList.add('alan-hesaplanan');
    if (alan.querySelector('[data-rol="hesaplanan-not"]')) return;
    var p = ek('p', 'alan-yardim');
    p.setAttribute('data-rol', 'hesaplanan-not');
    var i = document.createElement('i');
    i.className = 'fa-solid fa-calculator'; i.setAttribute('aria-hidden', 'true');
    p.appendChild(i);
    p.appendChild(ek('span', null, ' Sistemden hesaplanır: ' + kaynak + ' · elle değiştirilmez'));
    alan.appendChild(p);
  }

  /* ═══════════════════════════════════════════════════════════════════
     L8b · KRİTİK SATIR İŞLEMİ ONAY İSTER
     ───────────────────────────────────────────────────────────────────
     İade · iptal · geri alma geri alınamaz para işlemleridir; `sil`in
     onay kapısı onlarda da geçerlidir. Kitte zaten `yikici` eylemi var
     (§11) — kural bu eyleme BAĞLANMAKTIR, yeni bir kapı açmak değil.

     🔴 Kanca ada değil BİLDİRİME bakar: `data-kritik` taşıyan her
        denetim onay ister. Ekran metnine ("İade") bakan bir kanca
        Gastro'da başka kelimeyle yazıldığında sessizce kaçardı.
     ═══════════════════════════════════════════════════════════════ */

  document.addEventListener('click', function (e) {
    var d = e.target.closest('[data-kritik]');
    if (!d || d.getAttribute('data-kritik-onaylandi') === '1') return;
    /* 🔴 ÇİFT KAPI YASAK — ajan C ölçtü: `data-kritik` + `data-eylem="yikici"`
       birlikte bildirilince AYNI SORU İKİ KEZ soruluyordu (önce L8b'nin
       genel metni, Evet'e basınca ekranın kendi metni). Ve `data-kritik`
       YALNIZ bildirilince kapı açılıyor, onaydan sonra HİÇBİR ŞEY olmuyordu
       (§11'in ölü yüzeyi — üstelik kullanıcı "iade başlattım" sanır).
       Karar: `data-kritik` bir EYLEM DEĞİL, bir NİTELEMEDİR — "bu eylem
       onay ister" der. Kitin kendi onay kapısı olan eylemlerde (`yikici`,
       `sil`) gereklilik ZATEN karşılanmıştır ve o kapının metni ekranın
       kendi metnidir, yani DAHA İYİDİR. L8b orada susar.
       ⚠ Böylece `data-kritik` bir BİLDİRİM olarak kalır: kapı onu sayar,
         Gastro/Diet'te kelime değişse de kanca kaymaz. */
    if (d.matches('[data-eylem="yikici"], [data-eylem="sil"], [data-islem="sil"]')) return;
    e.preventDefault();
    e.stopPropagation();
    var ne = d.getAttribute('data-kritik') || (d.getAttribute('aria-label') || d.textContent || 'Bu işlem').trim();
    /* 🔴 İMZA YANLIŞTI — AJAN C TIKLAYARAK BULDU. `onaySor` KONUMSAL
       (`baslik, metin, dugmeMetni, cb`); ilk yazımım nesne+callback
       veriyordu ve modal "[object Object]" ile fonksiyon kaynağını
       basıyordu. 🔴 KAPI AÇILIYORDU: kapı SAYAN bir ölçüm bunu YEŞİL
       görür — "onay kapısı doğdu mu" sorusunun cevabı evetti, "ne YAZIYOR"
       diye sorulmamıştı. Kayıtlı dersin bir kardeşi: kapı sorduğu soruyu
       ölçer. Kapıya artık metin ölçütü de eklendi. */
    onaySor(ne + ' onayı',
            ne + ' geri alınamaz. Sürdürmek istiyor musunuz?',
            'Evet, sürdür',
            function (evet) {
      /* 🔴 `onayKapat` GERİ ÇAĞRIYI İPTALDE DE ÇAĞIRIR — `cb(sonuc)`,
         `sonuc` false. Kitin kendi çağrıları bunu `if (!evet) return;`
         ile okuyor; benim ilk yazımım argümanı YOK SAYIYORDU, yani
         "Vazgeç"e basınca eylem YİNE KOŞUYORDU. Onay kapısı açılıyor
         ama KAPATMIYORDU — kapının en kötü hâli, çünkü kullanıcı
         korunduğunu sanır. Kapı bunu ölçerek buldu (satır 4→3). */
      if (!evet) return;
      d.setAttribute('data-kritik-onaylandi', '1');
      d.click();
      d.removeAttribute('data-kritik-onaylandi');
    });
  }, true);

  /* ═══════════════════════════════════════════════════════════════════
     L11 · TABLO BAŞLIĞI — BAŞLIK SAYISI HÜCRE SAYISINA EŞİTTİR
     ───────────────────────────────────────────────────────────────────
     Bir tablonun `<thead>`indeki `<th>` sayısı satırların `<td>`
     sayısıyla UYUŞMAZSA her başlık yanlış sütuna düşer ve tablo
     sessizce yalan söyler. Kit bunu ÖLÇER ve konsola yazar; düzeltmesi
     markup işidir (kit hücre uydurmaz).

     Kitin YAPTIĞI: başlığın kendi sözleşmesi — `scope="col"`, sıralama
     düğmesi varsa `aria-sort`, ve `<thead>`in yapışkan kalması.
     ═══════════════════════════════════════════════════════════════ */

  function tabloBasligiKur() {
    var kusur = [];
    document.querySelectorAll('table').forEach(function (t) {
      var bas = t.tHead && t.tHead.rows[0];
      if (!bas) return;
      var thSay = 0;
      [].forEach.call(bas.cells, function (c) { thSay += (c.colSpan || 1); });
      [].forEach.call(bas.cells, function (c) {
        if (c.tagName === 'TH' && !c.getAttribute('scope')) c.setAttribute('scope', 'col');
      });
      var govde = t.tBodies && t.tBodies[0];
      var ilk = govde && govde.rows[0];
      if (!ilk) return;
      var tdSay = 0;
      [].forEach.call(ilk.cells, function (c) { tdSay += (c.colSpan || 1); });
      if (thSay !== tdSay) kusur.push({ tablo: t.id || t.className || '(adsız)', baslik: thSay, hucre: tdSay });
    });
    if (kusur.length) {
      /* Sessiz kalmaz — ama toast da basmaz: bu yöneticinin değil,
         geliştiricinin göreceği bir kusurdur. */
      console.warn('[kit L11] tablo başlığı hücreyle uyuşmuyor:', kusur);
    }
    return kusur;
  }

  /* ═══════════════════════════════════════════════════════════════════
     L10 · TEKRARLAYAN SATIR — NUMARALI · SÜRÜKLE-SIRALA · SİL ONAYLI
     ───────────────────────────────────────────────────────────────────
     "Yeni özellik", "hizmet paketleri", "adımlar", "sorular" — hepsi
     aynı kalıptır ve kitte `satir-ekle` olarak zaten var. L10 o kalıba
     ÜÇ YETENEK ekler; ikinci bir tekrarlayıcı kalıbı AÇMAZ:

         numara     satırın kaçıncı olduğu GÖRÜNÜR ve sürükleyince döner
         tutamak    sürükle-bırak ile sıra değişir (klavyeyle de: ok tuşu)
         sil        onay ister — yazılmış bir satır tek tıkla kaybolmaz

     Kanca ADA DEĞİL İÇERİĞE bakar (K24'ün dersi): bir kap, içinde
     `satir-ekle` düğmesinin BİLDİRDİĞİ liste ise tekrarlayıcıdır. Kapın
     adı `.adim-liste` de olabilir `.kalem-listesi` de — liste büyümez.

     🔴 SİL ONAYI BOŞ SATIRDA SORULMAZ. Yeni eklenmiş, hiç yazılmamış bir
        satırı silmek geri alınabilir bir şey değil, YANLIŞLIKLA EKLEMEYİ
        geri almaktır. Onay kapısı orada gürültüdür ve kullanıcı onay
        kapılarını okumayı bırakır. Dolu satır onay ister, boş satır
        doğrudan gider.
     ⚠ Sürükleme HTML5 `draggable` ile; `mouse.wheel`in kayıtlı dersi
       gibi ölçüm aracıyla çakışmasın diye tutamak AYRI bir eleman
       (satırın kendisi sürüklenebilir yapılırsa içindeki metin seçimi
       ölür).
     ═══════════════════════════════════════════════════════════════ */

  /* Bir liste kabı tekrarlayıcı mı — SORUYU DÜĞME CEVAPLAR. */
  function tekrarListeleri() {
    var kaplar = [];
    document.querySelectorAll('[data-eylem="satir-ekle"], .satir-ekle').forEach(function (d) {
      var yakin = d.closest('.form-bolum') || d.closest('.kart') || document;
      var l = (d.getAttribute('data-hedef') && document.querySelector(d.getAttribute('data-hedef')))
            || yakin.querySelector('.adim-liste, .kalem-listesi, .tablo tbody');
      if (l && kaplar.indexOf(l) === -1) kaplar.push(l);
    });
    return kaplar;
  }

  function tekrarSatirlari(liste) {
    return [].filter.call(liste.children, function (c) { return c.nodeType === 1; });
  }

  function numaralariYaz(liste) {
    var satirlar = tekrarSatirlari(liste);
    satirlar.forEach(function (s, i) {
      var n = s.querySelector('[data-rol="satir-no"]');
      if (n) n.textContent = String(i + 1);
      /* 🔴 TEK SATIRLIK LİSTEDE TUTAMAK SIRALAYAMAZ ve ölü buton taraması
         bunu ölü saydı — HAKLI OLARAK: denetim bir iş VAAT ediyor ve o iş
         mümkün değil. Sıralanacak bir şey yoksa tutamak da yoktur; ikinci
         satır doğunca geri gelir. `hidden` kullanılıyor, `display:none`
         değil — ekran okuyucu da görmemeli (§12'nin tersi: orada metin
         okunmaya devam etmeli, burada denetim HİÇ YOK). */
      var t = s.querySelector('.tekrar-tutamak');
      if (t) t.hidden = satirlar.length < 2;
    });
  }

  function satirDolu(s) {
    var dolu = false;
    s.querySelectorAll('input, textarea, select').forEach(function (x) {
      if (x.type === 'hidden' || x.type === 'button') return;
      if (x.type === 'checkbox' || x.type === 'radio') { if (x.checked) dolu = true; return; }
      /* 🔴 `<select>` HER ZAMAN BİR DEĞER TAŞIR — varsayılan seçim veri
         değildir. İlk yazım `x.value` okuyordu ve seçim taşıyan HER satır
         "dolu" sayılıyordu: yeni eklenmiş bomboş bir satır bile onay
         soruyordu (ölçüldü, admin-challenge-form #chTaslar senaryo C).
         Onay gürültüsü, kullanıcıya onay kapılarını okumayı bıraktırır.
         Ölçüt: seçim VARSAYILANDAN ayrılmış mı. */
      if (x.tagName === 'SELECT') {
        if (x.selectedIndex > 0) dolu = true;
        return;
      }
      if ((x.value || '').trim()) dolu = true;
    });
    if (!dolu && s.querySelector('.cipler [data-deger]')) dolu = true;
    return dolu;
  }

  function tekrarKur(liste) {
    if (!liste) return 0;
    var yazilan = 0;
    /* Tablo gövdesi bir tekrarlayıcı olabilir ama SATIR İŞLEMİ zaten
       vardır (§11 `data-islem`); orada ikinci bir sil düğmesi açmayız. */
    var tablo = liste.tagName === 'TBODY';
    tekrarSatirlari(liste).forEach(function (s) {
      if (s.getAttribute('data-tekrar-kuruldu') === '1') return;
      s.setAttribute('data-tekrar-kuruldu', '1');
      yazilan++;

      /* 🔴 KİT İKİNCİ TAKIM ÜRETİYORDU — ajan B ölçtü: 60 tekrar satırının
         60'ı ÇİFT denetimliydi (iki numara, iki tutamak, iki sil). Markup
         kendi `.adim-no`sunu ve kendi işlem düğmelerini zaten taşıyor;
         kit onların üstüne kendi `.tekrar-bas`ını koyuyordu.
         Kural: KİT İKİNCİ YÜZEY AÇMAZ, VAR OLANI BENİMSER. Satır kendi
         numarasını/tutamağını/silmesini bildirmişse kit onları kendi
         rollerine bağlar; bildirmemişse üretir.
         (L3'ün "çift sürücü yasak" kararının tekrarlayıcı karşılığı —
          madde 5'in "alan başına tek editör" dersinin üçüncü kaydı.) */
      var varNo   = s.querySelector('.adim-no, [data-rol="satir-no"]');
      var varTut  = s.querySelector('.tutamak, .tekrar-tutamak, [data-islem="sirala"], [data-eylem="sirala"]');
      var varSil  = s.querySelector('[data-islem="sil"], .tekrar-sil');
      if (!tablo && (varNo || varTut || varSil)) {
        /* BENİMSE — eksik olanı da üretme; satırın kendi tasarımı kalır. */
        if (varNo && !varNo.getAttribute('data-rol')) varNo.setAttribute('data-rol', 'satir-no');
        if (varTut && !varTut.classList.contains('tekrar-tutamak')) {
          varTut.classList.add('tekrar-tutamak');
          varTut.draggable = true;
          if (!varTut.getAttribute('data-ipucu'))
            varTut.setAttribute('data-ipucu', 'Tıkla: bir aşağı · sürükle ya da ok tuşları: serbest');
        }
        s.classList.add('tekrar-satiri');
        return;
      }

      if (!tablo) {
        var bas = document.createElement('div');
        bas.className = 'tekrar-bas';

        var tut = document.createElement('button');
        tut.type = 'button'; tut.className = 'ikon-dugme tekrar-tutamak';
        tut.setAttribute('aria-label', 'Satırı bir aşağı taşı — sürüklenebilir, ok tuşlarıyla da sıralanır');
        tut.setAttribute('data-ipucu', 'Tıkla: bir aşağı · sürükle ya da ok tuşları: serbest');
        tut.innerHTML = '<i class="fa-solid fa-grip-vertical" aria-hidden="true"></i>';
        tut.draggable = true;

        var no = document.createElement('span');
        no.className = 'tekrar-no'; no.setAttribute('data-rol', 'satir-no');

        var sil = document.createElement('button');
        sil.type = 'button'; sil.className = 'ikon-dugme tekrar-sil';
        sil.setAttribute('aria-label', 'Satırı sil');
        sil.setAttribute('data-ipucu', 'Satırı sil');
        sil.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';

        bas.appendChild(tut); bas.appendChild(no); bas.appendChild(sil);
        s.insertBefore(bas, s.firstChild);
        s.classList.add('tekrar-satiri');
      }
    });
    numaralariYaz(liste);
    return yazilan;
  }

  function tumTekrarlariKur() {
    var n = 0;
    tekrarListeleri().forEach(function (l) { n += tekrarKur(l); });
    return n;
  }

  /* ── SİL — dolu satır ONAY ister, boş satır gitmez sadece gider ──── */
  document.addEventListener('click', function (e) {
    var d = e.target.closest('.tekrar-sil');
    if (!d) return;
    e.preventDefault();
    var s = d.closest('.tekrar-satiri');
    if (!s) return;
    var liste = s.parentNode;
    /* 🔴 SON SATIR SİLİNMEZ: kalıp orada yaşıyor. `satir-ekle` son satırı
       KLONLAYARAK çalışır — listeyi boşaltmak eylemi ölü bırakırdı ve
       kusur sessiz olurdu (düğme çalışır, hiçbir şey doğmaz). */
    if (tekrarSatirlari(liste).length <= 1) {
      toast('Son satır silinemez — yeni satır bu satırın kalıbından üretiliyor. İçeriğini boşaltabilirsiniz.');
      return;
    }
    function git() { s.remove(); numaralariYaz(liste); toast('Satır silindi.'); }
    if (satirDolu(s)) {
      /* Aynı imza kusuru buradaydı da — kendi kapım bu YOLU HİÇ SINAMAMIŞTI
         (numara ve tutamak ölçülüyordu, SİLME ölçülmüyordu). Bir kapının
         yeşili, kapının sınadığı yol kadar geçerlidir. */
      onaySor('Satırı sil',
              'Bu satırdaki bilgiler kaldırılacak. Sürdürmek istiyor musunuz?',
              'Sil', function (evet) { if (evet) git(); });
    } else { git(); }
  });

  /* ── TIKLAMA DA BİR SIRALAMADIR ──────────────────────────────────
     🔴 ÖLÜ BUTON TARAMASI TUTAMAKLARI ÖLÜ SAYDI — 8 tanesini. Ve HAKLIYDI:
        tutamak yalnız sürükleme ve ok tuşlarıyla çalışıyordu, TIKLAYINCA
        hiçbir şey olmuyordu. Bir denetime bakıp tıklayan kullanıcı için
        o denetim ölüdür.
        Kitin kendi sözleşmesi bunu zaten çözmüştü: §24'ün `sirala` eylemi
        "satırı bir yukarı/aşağı taşır; TIKLAMA ↓, ok tuşları ↑↓" diyor.
        L10 o kuralı tekrar etmek yerine ondan SAPMIŞTI. Aynı kural.
     ⚠ Sürükleme sırasında tıklama doğmaz (`dragend` tıklamayı yutar),
       yani iki yol çakışmıyor. */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.tekrar-tutamak');
    if (!t) return;
    e.preventDefault();
    var s = t.closest('.tekrar-satiri');
    if (!s || !s.parentNode) return;
    var liste = s.parentNode;
    /* Son satırdaysa başa döner — "tıklama ↓" sonsuz bir merdiven değil,
       döngüsel bir sıralama. Yoksa son satırda düğme yine ölü olurdu. */
    if (s.nextElementSibling) liste.insertBefore(s.nextElementSibling, s);
    else liste.insertBefore(s, liste.firstElementChild);
    numaralariYaz(liste);
    t.focus();
  });

  /* ── SÜRÜKLE-SIRALA ─────────────────────────────────────────────── */
  var surukAktif = null;
  document.addEventListener('dragstart', function (e) {
    var t = e.target.closest('.tekrar-tutamak');
    if (!t) return;
    surukAktif = t.closest('.tekrar-satiri');
    if (!surukAktif) return;
    surukAktif.classList.add('surukleniyor');
    try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', ''); } catch (h) { /* eski tarayıcı */ }
  });
  document.addEventListener('dragover', function (e) {
    if (!surukAktif) return;
    var uzeri = e.target.closest ? e.target.closest('.tekrar-satiri') : null;
    if (!uzeri || uzeri === surukAktif || uzeri.parentNode !== surukAktif.parentNode) return;
    e.preventDefault();
    var k = uzeri.getBoundingClientRect();
    var once = (e.clientY - k.top) < k.height / 2;
    uzeri.parentNode.insertBefore(surukAktif, once ? uzeri : uzeri.nextSibling);
  });
  document.addEventListener('dragend', function () {
    if (!surukAktif) return;
    surukAktif.classList.remove('surukleniyor');
    numaralariYaz(surukAktif.parentNode);
    surukAktif = null;
  });

  /* ── KLAVYE — tutamakta ok tuşu satırı taşır ─────────────────────
     §24'ün dersi: `aria-label` bir şey VAAT ediyorsa o şey çalışmalı. */
  document.addEventListener('keydown', function (e) {
    var t = e.target.closest && e.target.closest('.tekrar-tutamak');
    if (!t || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    var s = t.closest('.tekrar-satiri');
    if (!s) return;
    e.preventDefault();
    var liste = s.parentNode;
    if (e.key === 'ArrowUp' && s.previousElementSibling) liste.insertBefore(s, s.previousElementSibling);
    if (e.key === 'ArrowDown' && s.nextElementSibling) liste.insertBefore(s.nextElementSibling, s);
    numaralariYaz(liste);
    t.focus();
  });

  /* ═══════════════════════════════════════════════════════════════════
     KURULUM — tek giriş, klondan sonra yeniden çağrılabilir
     ═══════════════════════════════════════════════════════════════ */
  function Lkur(kok) {
    kok = kok || document;
    kok.querySelectorAll('[data-video]').forEach(videoKur);
    kok.querySelectorAll('[data-sablon]').forEach(sablonKur);
    kok.querySelectorAll('[data-ikon]').forEach(ikonSeciciKur);
    kok.querySelectorAll('[data-hesaplanan]').forEach(hesaplananKur);
    radyoAcilira(kok);
    if (kok === document) { tabloBasligiKur(); tumTekrarlariKur(); }
  }

  window.DM_L_KUR = Lkur;
  window.DM_TEKRAR_KUR = tekrarKur;
  /* Silme kuralının TEK KAYNAĞI — `data-islem="sil"` dalı da bunu okur.
     İki dal aynı soruyu iki farklı şekilde yanıtlıyordu; artık yanıt bir. */
  window.DM_TEKRAR_KORUMA = {
    dolu: satirDolu,
    sonMu: function (liste) { return tekrarSatirlari(liste).length <= 1; }
  };
  window.DM_TEKRAR_TUMU = tumTekrarlariKur;
  window.DM_RADYO_ACILIRA = radyoAcilira;
  window.DM_TABLO_BASLIK = tabloBasligiKur;
  window.DM_IKON_NORMAL = ikonNormal;
  window.DM_VIDEO_COZUMLE = videoCozumle;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { Lkur(document); });
  } else { Lkur(document); }

})();


/* ═══════════════════════════════════════════════════════════════════════
   K12 · ÇOK DİLLİ İÇERİK — DİL SEKMESİ RAYI
   ───────────────────────────────────────────────────────────────────────
   Tarih: 2026-09-05 · parti 5 · lead

   Markup bir alanı ÇEVRİLEBİLİR diye bildirir, kit gerisini kurar:

       <input class="alan-girdi" name="baslik" data-dil>

   Doğan yüzey: alanın bağlı olduğu BÖLÜMÜN üstünde bir dil sekmesi rayı
   (varsayılan dil ilk kalem). Her sekme AYNI alanları o dil için gösterir.
   Değer `name="baslik[tr]"` / `name="baslik[en]"` olarak toplanır.

   ── NEDEN ALANLAR TAŞINMIYOR ────────────────────────────────────────
   🔴 İlk tasarım her dil için alanların KLONUNU ayrı panolara koyuyordu.
      Uygulanmadı, üç bedeli var ve üçü de ölçülebilir:
        · EKSİ BİRİNCİ MADDE — markup yeniden dizilir, `.alan-izgara`nın
          subgrid hizası (K23–K26) bozulur, hata rayı kayar.
        · TinyMCE her klonda YENİDEN kurulmalı; L10'un klon güvenliğinin
          editör tarafı burada da doğar (madde 5'in kusuru).
        · Çevrilmeyen alanlar (fiyat · tarih · ilişki · görsel) araya
          serpiştirilmiş; onları panonun DIŞINDA tutmak alanları
          fiziksel olarak ayırmayı gerektirirdi.
      Kural bunun yerine DEĞERİ değiştirir, ALANI değil: görünen denetim
      HER ZAMAN aktif dilin denetimidir; öteki diller gizli girdilerde
      durur. Ekranın düzeni bir piksel bile oynamaz.

   ── ÇEVRİLMEYEN ALAN SEKMENİN DIŞINDADIR ────────────────────────────
   `data-dil` bildirmeyen alan tek kalır ve dil değişince DEĞİŞMEZ.
   Kural bunu görsel olarak da söyler: çevrilebilir alan bir dil rozeti
   taşır, ötekiler taşımaz.

   ── DİL EKLENİNCE/ÇIKINCA ───────────────────────────────────────────
   Ray `DM_DILLER`den kurulur ve o liste `admin-dil-ceviri` ekranının
   KENDİ bildiriminden hasat edilir. Üçüncü dil o ekranda açılınca üçüncü
   sekme kendiliğinden doğar; kapatılınca düşer. Kitte dil listesi YOK.

   ⚠ Public site seçili dile göre o alanı basar — bu KANON kuralıdır ve
     public uygulaması AYRI TURDUR. Panel `name="<ad>[<kod>]"` sözleşmesini
     üretir; public tarafın okuyacağı şey budur.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KOK = document.body;
  if (!KOK || !KOK.classList.contains('yetkili')) return;

  var toast = window.DM_TOAST || function () {};

  function diller() {
    var d = window.DM_DILLER;
    return (d && d.length) ? d : null;
  }
  function varsayilanDil() {
    var d = diller();
    if (!d) return null;
    for (var i = 0; i < d.length; i++) if (d[i].varsayilan) return d[i].kod;
    return d[0].kod;
  }

  /* Alanın değerini OKU/YAZ — girdi tipine göre. TinyMCE sürülüyorsa
     editörün kendi tamponu asıldır; textarea'ya yazmak sessizce kaybolur
     (L2'nin kayıtlı dersi). */
  function alanOku(el) {
    var ed = window.tinymce && window.tinymce.get && el.id && window.tinymce.get(el.id);
    if (ed) return ed.getContent();
    return el.value || '';
  }
  function alanYaz(el, v) {
    var ed = window.tinymce && window.tinymce.get && el.id && window.tinymce.get(el.id);
    if (ed) { ed.setContent(v || ''); return; }
    el.value = v || '';
  }

  /* Bir alanın dil deposu: her dil için gizli girdi. Ad sözleşmesi
     `<ad>[<kod>]` — public tarafın okuyacağı biçim. */
  function depoKur(el, dl) {
    var ham = el.getAttribute('data-dil-ad') || el.name || el.id;
    if (!ham) return null;
    /* 🔴 DİZİ EKİ SİLİNİYORDU — ajan F ölçtü ve bu bir ENGELLEYİCİYDİ:
       `adim_baslik[]` dört satırda da `adim_baslik[tr]` oluyordu; 48 depo
       adının 24'ü ÇİFT. Değerler DOM'da doğru ayrışıyor ama SUNUCUYA GİDEN
       AD dört satırı BİRE indiriyor — kayıp sessiz, çünkü ekranda her şey
       doğru görünüyor. Bedeli ölçüldü: 15 ekran / 269 aday (adayların
       %81'i) bu kural düzelmeden bildirilemezdi.
       Ad artık `<ad>[<kod>][]` — dil eki dizi ekinin ÖNÜNE girer. */
    var dizi = /\[\s*\]$/.test(ham);
    ham = ham.replace(/\[\s*\]$/, '').replace(/\[[a-z-]{2,5}\]$/, '');
    el.setAttribute('data-dil-ad', ham);
    el.setAttribute('data-dil-dizi', dizi ? '1' : '0');
    var kap = el.closest('.alan') || el.parentNode;
    dl.forEach(function (d) {
      if (kap.querySelector('input[type=hidden][data-dil-depo="' + d.kod + '"][data-dil-ad="' + ham + '"]')) return;
      var g = document.createElement('input');
      g.type = 'hidden';
      g.setAttribute('data-dil-depo', d.kod);
      g.setAttribute('data-dil-ad', ham);
      g.name = ham + '[' + d.kod + ']' + (dizi ? '[]' : '');
      /* Varsayılan dilin deposu, alanın BUGÜNKÜ değeriyle doğar — mevcut
         kayıt hiçbir şey kaybetmez. */
      g.value = d.varsayilan ? alanOku(el) : '';
      kap.appendChild(g);
    });
    /* Görünen denetim artık `name` TAŞIMAZ: değer depolardan gönderilir.
       İki yerden gönderilseydi sunucu hangisini alacağını bilemezdi. */
    if (el.name) { el.setAttribute('data-dil-eski-ad', el.name); el.removeAttribute('name'); }
    return ham;
  }

  function depo(el, kod) {
    var ham = el.getAttribute('data-dil-ad');
    var kap = el.closest('.alan') || el.parentNode;
    return kap.querySelector('input[type=hidden][data-dil-depo="' + kod + '"][data-dil-ad="' + ham + '"]');
  }

  /* Bir grubun kapsadığı çevrilebilir alanlar. Kanca ADA DEĞİL İÇERİĞE
     bakar (K24'ün dersi): grup, `data-dil` çocuğu TAŞIYAN bölümdür. */
  function grupAlanlari(grup) {
    return [].slice.call(grup.querySelectorAll('[data-dil]'));
  }

  function eksikSay(grup, kod) {
    var n = 0;
    grupAlanlari(grup).forEach(function (el) {
      var g = depo(el, kod);
      if (g && !String(g.value).replace(/<[^>]*>/g, '').trim()) n++;
    });
    return n;
  }

  function rozetTazele(grup) {
    var dl = diller(); if (!dl) return;
    var ray = grup.__dilRay; if (!ray) return;
    dl.forEach(function (d) {
      var s = ray.querySelector('[data-dil-sekme="' + d.kod + '"]');
      if (!s) return;
      var r = s.querySelector('.dil-eksik');
      var n = eksikSay(grup, d.kod);
      if (!n) { if (r) r.remove(); return; }
      if (!r) {
        r = document.createElement('span');
        r.className = 'dil-eksik';
        s.appendChild(r);
      }
      r.textContent = n;
      /* 🔴 SAYI TEK BAŞINA BİR ŞEY SÖYLEMEZ — erişilebilir ad tam cümle. */
      s.setAttribute('aria-label', d.ad + ' — ' + n + ' alan çevrilmedi');
    });
  }

  function dileGec(grup, kod) {
    var dl = diller(); if (!dl) return;
    var eski = grup.getAttribute('data-dil-aktif');
    /* 1 · ÇIKARKEN KAYDET — yoksa sekme değişimi yazılanı yutar. */
    if (eski && eski !== kod) {
      grupAlanlari(grup).forEach(function (el) {
        var g = depo(el, eski);
        if (g) g.value = alanOku(el);
      });
    }
    /* 2 · GİRERKEN YÜKLE */
    grupAlanlari(grup).forEach(function (el) {
      var g = depo(el, kod);
      alanYaz(el, g ? g.value : '');
      el.setAttribute('data-dil-su-an', kod);
      /* Etiketteki dil işareti — kullanıcı hangi dili yazdığını ALANIN
         KENDİSİNDE görür, yalnız rayda değil. Uzun formda ray ekrandan
         çıkar ve o an hangi dilde olduğu kaybolurdu. */
      var kap = el.closest('.alan');
      if (kap) kap.setAttribute('data-dil-isaret', kod);
      var et = kap && kap.querySelector('.alan-etiket');
      if (et) et.setAttribute('data-dil-isaret', kod);
    });
    grup.setAttribute('data-dil-aktif', kod);
    var ray = grup.__dilRay;
    if (ray) {
      [].forEach.call(ray.querySelectorAll('[data-dil-sekme]'), function (s) {
        var a = s.getAttribute('data-dil-sekme') === kod;
        s.classList.toggle('aktif', a);
        s.setAttribute('aria-selected', String(a));
      });
    }
    rozetTazele(grup);
  }

  function grupKur(grup) {
    if (grup.getAttribute('data-dil-kuruldu') === '1') return false;
    var dl = diller();
    if (!dl || dl.length < 2) return false;      /* tek dil → ray DOĞMAZ */
    var alanlar = grupAlanlari(grup);
    if (!alanlar.length) return false;
    grup.setAttribute('data-dil-kuruldu', '1');

    alanlar.forEach(function (el) {
      depoKur(el, dl);
      /* Çevrilebilir alan bir dil rozeti taşır; çevrilmeyen taşımaz.
         🔴 `.alan` SARMALAYICISI HER ZAMAN YOK — ajan F ölçtü: L10
            satırlarındaki alanlar `.adim-govde` gibi kaplarda duruyor ve
            16 alan görsel işaret ALMIYORDU (deposu doğruydu, işareti
            yoktu). Kanca kabın ADINA değil, ETİKETİ TAŞIYAN en yakın
            kaba bakar; o da yoksa alanın kendi ebeveynine. */
      var kap = el.closest('.alan') ||
                (el.parentElement && el.parentElement.querySelector('.alan-etiket, label')
                  ? el.parentElement : null) ||
                el.parentElement;
      if (kap) kap.classList.add('alan-cevrilebilir');
    });

    var ray = document.createElement('div');
    ray.className = 'sekmeler dil-sekmeler';
    ray.setAttribute('role', 'tablist');
    ray.setAttribute('aria-label', 'İçerik dili');
    dl.forEach(function (d) {
      var s = document.createElement('button');
      s.type = 'button';
      s.className = 'sekme' + (d.varsayilan ? ' aktif' : '');
      s.setAttribute('role', 'tab');
      s.setAttribute('data-dil-sekme', d.kod);
      s.setAttribute('aria-selected', String(!!d.varsayilan));
      s.appendChild(document.createTextNode(d.ad));
      ray.appendChild(s);
    });
    /* Ray bölümün BAŞINA — başlık varsa onun ardına (başlık bölümün adıdır,
       dil onun altındaki bir kiptir). */
    var bas = grup.querySelector('.form-bolum-bas, .kart-baslik');
    if (bas && bas.parentNode === grup) grup.insertBefore(ray, bas.nextSibling);
    else grup.insertBefore(ray, grup.firstChild);
    grup.__dilRay = ray;

    ray.addEventListener('click', function (e) {
      var s = e.target.closest('[data-dil-sekme]');
      if (!s) return;
      e.preventDefault();
      dileGec(grup, s.getAttribute('data-dil-sekme'));
    });
    /* Yazdıkça rozet tazelenir — kaydetmeyi beklemez. */
    grup.addEventListener('input', function (e) {
      if (!e.target.closest('[data-dil]')) return;
      var kod = grup.getAttribute('data-dil-aktif');
      var el = e.target.closest('[data-dil]');
      var g = depo(el, kod);
      if (g) g.value = alanOku(el);
      rozetTazele(grup);
    });

    dileGec(grup, varsayilanDil());
    return true;
  }

  /* Grup = `data-dil` çocuğu taşıyan EN YAKIN bölüm. Kanca kabın adına
     değil içeriğine bakar; `.form-bolum` yoksa `.kart-govde`ye çıkar. */
  function gruplar() {
    var bulunan = [];
    document.querySelectorAll('[data-dil]').forEach(function (el) {
      /* 🔴 GRUP = PANEL, BÖLÜM DEĞİL — ajan F sordu: "Anlatım" panelinde
         üç `.form-bolum` var ve ÜÇ bağımsız dil rayı doğuyordu. Kullanıcı
         "bu paneli İngilizce yaz" diye düşünür, "bu bölümü" diye değil;
         üç ray üç ayrı dil durumu demek ve biri TR'de biri EN'de kalabilir.
         Grup önce SEKME PANOSUDUR; pano yoksa bölüme, o da yoksa forma
         düşer. Böylece panel başına TEK ray, TEK dil durumu. */
      var g = el.closest('[role="tabpanel"]') || el.closest('.form-bolum') ||
              el.closest('.kart-govde') || el.closest('form');
      if (g && bulunan.indexOf(g) === -1) bulunan.push(g);
    });
    return bulunan;
  }

  function K12kur() {
    var n = 0;
    gruplar().forEach(function (g) { if (grupKur(g)) n++; });
    return n;
  }

  /* ── KAYDET UYARISI ──────────────────────────────────────────────
     🔴 Uyarı KAYDI ENGELLEMEZ. Eksik çeviri bir DOĞRULAMA HATASI değil,
        bir iş durumudur: yönetici Türkçeyi bugün, İngilizceyi yarın
        yazabilir. Engelleyen bir kural onu alanı sahte bir metinle
        doldurmaya iter — kuralın amacının tersi.
     ⚠ Yakalama evresinde koşar ki kitin kendi `kaydet` dalından ÖNCE
       görülsün; ama olayı KESMEZ. */
  document.addEventListener('click', function (e) {
    var d = e.target.closest('[data-eylem="kaydet"], [data-eylem="yayinla"], [data-eylem="taslak"]');
    if (!d) return;
    var dl = diller(); if (!dl) return;
    var toplam = 0, dokum = [];
    gruplar().forEach(function (g) {
      if (g.getAttribute('data-dil-kuruldu') !== '1') return;
      /* Görünen alanın son hâli deposuna yazılmamış olabilir. */
      var aktif = g.getAttribute('data-dil-aktif');
      grupAlanlari(g).forEach(function (el) {
        var s = depo(el, aktif); if (s) s.value = alanOku(el);
      });
      dl.forEach(function (x) {
        var n = eksikSay(g, x.kod);
        if (n) { toplam += n; dokum.push(x.ad + ' ' + n); }
      });
      rozetTazele(g);
    });
    if (toplam) toast('Kaydedildi — çevrilmemiş alan var: ' + dokum.join(' · ') + '.');
  }, true);

  window.DM_K12_KUR = K12kur;
  window.DM_K12_EKSIK = eksikSay;
  window.DM_K12_GRUPLAR = gruplar;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { K12kur(); });
  } else { K12kur(); }

})();


/* ═══════════════════════════════════════════════════════════════════════
   K13 · KOLON SIRALAMA ÜÇ DURUMLU — artan → azalan → VARSAYILAN
   ───────────────────────────────────────────────────────────────────────
   Beyar: *"artan → azalan → varsayılan; şu an varsayılana dönmüyor."*
   Gastro kulvarı bunu KÖ-L2 olarak pilotladı (`gastro-ek.js`); kural
   buraya taşındı ve artık dört markanın ortağı.

   ÖLÇÜLDÜ · `_ortak/panel.js:146` sürücüsü İKİ durumlu:
       var artan = th.getAttribute('aria-sort') !== 'ascending';
   Üçüncü tık `descending` görüp yine `ascending` yapıyor; kullanıcının
   tabloyu GELDİĞİ HÂLE döndürme yolu YOK.

   🔴 SÜRÜCÜ SÖKÜLMEDİ. `panel.js` kittir ve SALT OKUMA (§13); ayrıca dört
      markada bayt-özdeşliği kendi sözleşmesi. Bu kural onun ÜSTÜNE biner:
        · YAKALAMA evresi — panel.js sıralamadan ÖNCE tablonun varsayılan
          hâlini bir kez saklar (satır sırası + başlangıç `aria-sort`ları).
          Anlık saklama, `DOMContentLoaded`da değil: satırları sonradan
          değişen tablo da DOĞRU tabanla saklanır.
        · KABARMA evresi — panel.js kendi işini bitirdikten SONRA koşar
          (aynı evre, sonra eklenen dinleyici sonra çalışır) ve üçüncü
          tıkta varsayılanı geri kurar.
   ⚠ ARAYA GİRİLMİYOR (`stopPropagation` YOK): kesmek panel.js'in seçim ve
     satır işlemlerini de öldürürdü. Bu bir DÜZELTME, bir kesme değil.
   ⚠ Üçüncü durumun GÖRSELİ kanonda zaten var: `aria-sort` yokken başlık
     sönük çift ok gösteriyor. Yeni bir görünüm açılmadı.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KOK = document.body;
  if (!KOK || !KOK.classList.contains('yetkili')) return;

  var TABAN = new WeakMap();       /* tablo → {satirlar:[], sira:[{th,deger}]} */
  var ONCEKI = new WeakMap();      /* th → tıklamadan ÖNCEKİ aria-sort */

  function basliklar(tablo) {
    return [].slice.call(tablo.querySelectorAll('thead th'));
  }

  function tabaniSakla(tablo) {
    if (TABAN.has(tablo)) return;
    var g = tablo.tBodies[0];
    if (!g) return;
    TABAN.set(tablo, {
      satirlar: [].slice.call(g.rows),
      sira: basliklar(tablo).map(function (th) {
        return { th: th, deger: th.getAttribute('aria-sort') };
      })
    });
  }

  function tabanaDon(tablo) {
    var t = TABAN.get(tablo);
    if (!t) return false;
    var g = tablo.tBodies[0];
    if (!g) return false;
    t.satirlar.forEach(function (tr) { if (tr.parentNode === g) g.appendChild(tr); });
    t.sira.forEach(function (x) {
      if (x.deger) x.th.setAttribute('aria-sort', x.deger);
      else x.th.removeAttribute('aria-sort');
    });
    return true;
  }

  /* 1 · YAKALAMA — panel.js'ten ÖNCE */
  document.addEventListener('click', function (e) {
    var d = e.target.closest ? e.target.closest('.tablo th.sirali > button') : null;
    if (!d) return;
    var th = d.parentElement, tablo = th.closest('table');
    if (!tablo) return;
    tabaniSakla(tablo);
    ONCEKI.set(th, th.getAttribute('aria-sort'));
  }, true);

  /* 2 · KABARMA — panel.js'ten SONRA */
  document.addEventListener('click', function (e) {
    var d = e.target.closest ? e.target.closest('.tablo th.sirali > button') : null;
    if (!d) return;
    var th = d.parentElement, tablo = th.closest('table');
    if (!tablo) return;
    /* Üçüncü tık: ÖNCESİ azalandı. panel.js onu yine artana çevirdi;
       biz varsayılana döndürüyoruz. */
    if (ONCEKI.get(th) !== 'descending') return;
    if (tabanaDon(tablo)) {
      ONCEKI.set(th, null);
      if (window.DM_SECIM_TAZELE) window.DM_SECIM_TAZELE(tablo);
      if (window.DM_LISTE_TAZELE) window.DM_LISTE_TAZELE(tablo.tBodies[0]);
    }
  });

  /* Başlığın üç durumlu olduğu BİLDİRİLİR — ipucu metni ve imleç oradan. */
  function K13kur() {
    var n = 0;
    document.querySelectorAll('.tablo th.sirali > button').forEach(function (b) {
      var th = b.parentElement;
      if (th.getAttribute('data-siralanabilir') === '1') return;
      th.setAttribute('data-siralanabilir', '1');
      if (!b.getAttribute('data-ipucu'))
        b.setAttribute('data-ipucu', 'Sırala: artan → azalan → varsayılan');
      n++;
    });
    return n;
  }
  window.DM_K13_KUR = K13kur;
  window.DM_K13_TABAN = function (t) { return TABAN.get(t); };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', K13kur);
  } else { K13kur(); }

})();


/* ═══════════════════════════════════════════════════════════════════════
   K16 · HESAPLANAN ETİKET/ROZET KAYNAKTAN TÜRETİLİR
   ───────────────────────────────────────────────────────────────────────
   Beyar: *"Hesaplanan etiket/rozet kaynaktan türetilir, salt okunur +
   manuel ek."*

       <div class="rozet-alani" data-turetilen="seviye" data-turetilen-ek></div>

   `data-turetilen` bir ALAN ADI ya da `#id`dir. Kit o alanın değerini
   okur, rozeti çizer ve kaynak değişince YENİDEN çizer.

   🔴 TÜRETİLEN ROZET DÜZENLENEBİLİR GÖSTERİLMEZ — L7'nin rozet karşılığı:
      yönetici değiştirebileceğini sanar ve değiştirdiği şey bir sonraki
      hesapta geri döner. Rozet salt okunur, kaynağı YAZILI.
   🔴 AMA KAYNAK KİLİTLENMEZ: "manuel ek" gerçek bir ihtiyaç. Türetilenin
      YANINA elle rozet eklenebilir (`data-turetilen-ek`), ve eklenenler
      türetilenden GÖRSEL OLARAK ayrılır — ikisi karışırsa yönetici hangi
      rozetin nereden geldiğini bilemez.
   ⚠ Kaynak boşsa rozet BASILMAZ (boş bir rozet bir bilgi değil, gürültü).
     Kaynağın bulunamadığı hâl AYRI: yüzey "kaynak bildirilmedi" der —
     sessizce boş kalmaz.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KOK = document.body;
  if (!KOK || !KOK.classList.contains('yetkili')) return;

  function kaynakBul(kap) {
    var ad = kap.getAttribute('data-turetilen');
    if (!ad) return null;
    if (ad.charAt(0) === '#') return document.querySelector(ad);
    var f = kap.closest('form') || document;
    return f.querySelector('[name="' + ad + '"], [name="' + ad + '[]"], #' + ad);
  }

  function kaynakDeger(el) {
    if (!el) return '';
    if (el.tagName === 'SELECT') {
      var o = el.selectedOptions && el.selectedOptions[0];
      return o ? (o.textContent || o.value || '').trim() : '';
    }
    if (el.type === 'checkbox') return el.checked ? (el.getAttribute('data-etiket') || 'Evet') : '';
    /* Çoklu seçim kabının değeri çiplerdedir. */
    var kap = el.closest && el.closest('.coklu-secim');
    if (kap) {
      return [].map.call(kap.querySelectorAll('.cipler [data-deger]'), function (c) {
        return c.getAttribute('data-deger');
      }).join(', ');
    }
    return (el.value || '').trim();
  }

  function turetKur(kap) {
    if (kap.getAttribute('data-turetilen-kuruldu') === '1') return false;
    kap.setAttribute('data-turetilen-kuruldu', '1');

    var yuzey = document.createElement('div');
    yuzey.className = 'turetilen-rozetler';
    yuzey.setAttribute('data-rol', 'turetilen');
    kap.appendChild(yuzey);

    var not = document.createElement('p');
    not.className = 'alan-yardim';
    not.setAttribute('data-rol', 'turetilen-not');
    kap.appendChild(not);

    function ciz() {
      var el = kaynakBul(kap);
      yuzey.innerHTML = '';
      if (!el) {
        /* 🔴 SESSİZ BOŞLUK YOK: kaynağın bulunamaması bir KUSURDUR ve
           yüzeyde yazılır — geliştirici de yönetici de görür. */
        not.textContent = 'Kaynak bildirilmedi: “' + kap.getAttribute('data-turetilen') + '” adlı alan bu formda bulunamadı.';
        not.hidden = false;
        return;
      }
      var d = kaynakDeger(el);
      var parcalar = d ? d.split(',').map(function (x) { return x.trim(); }).filter(Boolean) : [];
      parcalar.forEach(function (p) {
        var r = document.createElement('span');
        r.className = 'rozet turetilen';
        r.textContent = p;
        r.setAttribute('data-turetilen-deger', p);
        yuzey.appendChild(r);
      });
      var etiket = (el.closest('.alan') && el.closest('.alan').querySelector('.alan-etiket'));
      var kaynakAd = (etiket ? etiket.textContent.replace(/\s+/g, ' ').trim().replace(/\s*\*$/, '') : kap.getAttribute('data-turetilen'));
      not.textContent = parcalar.length
        ? 'Kaynaktan türetilir: ' + kaynakAd + ' · elle değiştirilmez'
        : 'Kaynak boş: ' + kaynakAd + ' seçilince rozet doğar.';
      not.hidden = false;
    }

    /* Kaynak DEĞİŞİNCE yeniden çizilir — türetme bir kerelik değil. */
    var el = kaynakBul(kap);
    var dinle = el && (el.closest('.coklu-secim') || el);
    if (dinle) {
      ['input', 'change'].forEach(function (t) {
        dinle.addEventListener(t, ciz);
      });
      /* Çip eklenip silinmesi `input` üretmez — kap gözlenir. */
      if (el.closest && el.closest('.coklu-secim') && window.MutationObserver) {
        new MutationObserver(ciz).observe(el.closest('.coklu-secim'), { childList: true, subtree: true });
      }
    }
    ciz();

    /* MANUEL EK — türetilenden AYRI kapta, ayrı görünümde. */
    if (kap.hasAttribute('data-turetilen-ek')) {
      var ekKap = document.createElement('div');
      ekKap.className = 'coklu-secim turetilen-ek';
      ekKap.setAttribute('data-ad', (kap.getAttribute('data-turetilen') || 'rozet') + '_ek[]');
      ekKap.setAttribute('data-oneri', kap.getAttribute('data-turetilen') || 'rozet');
      ekKap.innerHTML =
        '<div class="cipler"></div>' +
        '<input class="alan-girdi acilir-arama" type="search" placeholder="Elle rozet ekle…" ' +
        'aria-label="Elle rozet ekle" role="combobox" aria-expanded="false">';
      kap.appendChild(ekKap);
      if (window.DM_COKLU_KUR) window.DM_COKLU_KUR();
    }
    return true;
  }

  function K16kur() {
    var n = 0;
    document.querySelectorAll('[data-turetilen]').forEach(function (k) { if (turetKur(k)) n++; });
    return n;
  }
  window.DM_K16_KUR = K16kur;


  /* ═══════════════════════════════════════════════════════════════════
     K14 · ZAMANLANMIŞ YAYIN — TAKVİME BÖLME
     ───────────────────────────────────────────────────────────────────
     Beyar'ın amacı: *"AI ile üretilen içeriği editörler TAKVİME BÖLEREK
     yayına alır"* — 201 taslak tarif, "Cuma 108, Cumartesi 93".

         <div data-zamanlama
              data-zamanlama-toplam="#kpiTaslakSayisi"
              data-zamanlama-adet="#gfAdet"
              data-zamanlama-baslangic="#gfBaslangic"
              data-zamanlama-tekrar="#gfTekrar">
           <div data-rol="zamanlama-onizleme"></div>
         </div>

     Kit dağılımı HESAPLAR ve önizlemeyi yazar.

     🔴 TOPLAM UYDURULMAZ. Sayı `data-zamanlama-toplam`ın gösterdiği
        yüzeyden OKUNUR (bir KPI, bir sayaç, bir `value`). Bildirilmemişse
        önizleme "kaç kayıt bölüneceği bildirilmedi" der ve HİÇBİR SAYI
        BASMAZ. Sahte bir "201" yazmak, panelin en tehlikeli yalanı
        olurdu: editör ona bakarak takvim kurar.
     🔴 SON GÜN ARTIĞI GİZLENMEZ. 201 kayıt günde 108 ise iki gün eder ve
        ikinci gün 93'tür — kit bunu AÇIKÇA yazar, "2 gün" deyip geçmez.
     ⚠ Hafta sonu/tatil kuralı YOK ve olmadığı YAZILI: takvim bilgisi
       panelde bildirilmiyor, uydurulmaz (§1).
     ═══════════════════════════════════════════════════════════════════ */

  /* 🔴 SÖZLEŞME ÇELİŞKİSİ — ajan E buldu ve tuzağa DÜŞTÜ: K14'ün seçicileri
     `querySelector` çağırıyor ve `#` istiyor; §5b'nin `data-hedef`i ise
     ÇIPLAK id, çünkü orada kit `getElementById` çağırıyor. Aynı panelde iki
     karşıt biçim ve İKİSİ DE SESSİZCE başarısız oluyor.
     §5b'nin kendi çözümü uygulandı: kit İKİ BİÇİMİ DE kabul eder. */
  function hedefBul(sec) {
    if (!sec) return null;
    if (/^[#.\[]/.test(sec)) { try { return document.querySelector(sec); } catch (h) { return null; } }
    return document.getElementById(sec) || (function () {
      try { return document.querySelector(sec); } catch (h) { return null; }
    })();
  }

  function sayiOku(sec) {
    var el = hedefBul(sec);
    if (!el) return null;
    var ham = (el.value !== undefined && el.value !== '') ? el.value : (el.textContent || '');
    /* "1.842" · "201 taslak" · "4.120 kişi" → sayı. Binlik NOKTA, TR. */
    var m = String(ham).replace(/\s/g, '').match(/-?[\d.]+(?:,\d+)?/);
    if (!m) return null;
    var n = parseFloat(m[0].replace(/\./g, '').replace(',', '.'));
    return isFinite(n) ? n : null;
  }

  var GUN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  var AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz',
            'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  function tarihOku(sec) {
    var el = hedefBul(sec);
    if (!el) return null;
    /* Tarih seçicinin GERÇEK değeri `dataset.iso`da (§8'in sözleşmesi);
       görünen değer biçimlenmiştir. */
    var iso = el.dataset && el.dataset.iso;
    if (iso) { var d = new Date(iso); if (!isNaN(d)) return d; }
    var v = (el.value || '').trim();
    var m = /^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?$/.exec(v);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0));
    return null;
  }

  function zamanlamaHesapla(kap) {
    var toplam = sayiOku(kap.getAttribute('data-zamanlama-toplam'));
    var adet = sayiOku(kap.getAttribute('data-zamanlama-adet'));
    var bas = tarihOku(kap.getAttribute('data-zamanlama-baslangic'));
    var tekrarEl = hedefBul(kap.getAttribute('data-zamanlama-tekrar'));
    var tekrar = tekrarEl ? (tekrarEl.value || (tekrarEl.selectedOptions && tekrarEl.selectedOptions[0] && tekrarEl.selectedOptions[0].textContent) || '') : 'gunluk';
    return { toplam: toplam, adet: adet, bas: bas, tekrar: String(tekrar).toLocaleLowerCase('tr') };
  }

  function zamanlamaCiz(kap) {
    var y = kap.querySelector('[data-rol="zamanlama-onizleme"]');
    if (!y) return;
    var h = zamanlamaHesapla(kap);
    y.innerHTML = '';

    var eksik = [];
    if (h.toplam == null) eksik.push('bölünecek kayıt sayısı');
    if (!h.adet || h.adet <= 0) eksik.push('günlük adet');
    if (!h.bas) eksik.push('başlangıç tarihi');
    if (eksik.length) {
      var p = document.createElement('p');
      p.className = 'alan-yardim';
      p.textContent = 'Önizleme için ' + eksik.join(' · ') + ' gerekli. Bildirilmeden takvim çizilmez.';
      y.appendChild(p);
      return;
    }

    var artis = /hafta/.test(h.tekrar) ? 7 : (/tek/.test(h.tekrar) ? 0 : 1);
    var kalan = h.toplam, i = 0, satirlar = [];
    while (kalan > 0 && i < 60) {
      var g = new Date(h.bas.getTime());
      g.setDate(g.getDate() + i * (artis || 1));
      var bu = Math.min(h.adet, kalan);
      satirlar.push({ tarih: g, adet: bu, son: (kalan - bu) <= 0 });
      kalan -= bu;
      i++;
      if (!artis) break;                 /* tek sefer → tek satır */
    }

    var liste = document.createElement('ul');
    liste.className = 'zamanlama-onizleme';
    satirlar.forEach(function (s) {
      var li = document.createElement('li');
      var t = document.createElement('b');
      t.textContent = GUN[s.tarih.getDay()] + ' ' + s.tarih.getDate() + ' ' + AY[s.tarih.getMonth()];
      var n = document.createElement('span');
      /* 🔴 SON GÜN ARTIĞI AÇIKÇA YAZILIR — "2 gün" deyip geçmek editöre
         yanlış takvim kurdurur. */
      n.textContent = s.adet + ' kayıt' + (s.son && s.adet < h.adet ? ' (son gün · artan)' : '');
      li.appendChild(t); li.appendChild(n);
      liste.appendChild(li);
    });
    y.appendChild(liste);

    var ozet = document.createElement('p');
    ozet.className = 'alan-yardim';
    ozet.textContent = h.toplam + ' kayıt · günde ' + h.adet + ' · ' + satirlar.length + ' gün' +
      (kalan > 0 ? ' (ilk 60 gün gösteriliyor, ' + kalan + ' kayıt daha var)' : '') +
      ' · hafta sonu ve tatil kuralı YOK (panelde bildirilmiyor).';
    y.appendChild(ozet);
  }

  function K14kur() {
    var n = 0;
    document.querySelectorAll('[data-zamanlama]').forEach(function (kap) {
      if (kap.getAttribute('data-zamanlama-kuruldu') === '1') return;
      kap.setAttribute('data-zamanlama-kuruldu', '1');
      n++;
      ['data-zamanlama-toplam', 'data-zamanlama-adet', 'data-zamanlama-baslangic', 'data-zamanlama-tekrar']
        .forEach(function (a) {
          var el = hedefBul(kap.getAttribute(a));
          if (!el) return;
          ['input', 'change'].forEach(function (t) {
            el.addEventListener(t, function () { zamanlamaCiz(kap); });
          });
        });
      zamanlamaCiz(kap);
    });
    return n;
  }
  window.DM_K14_KUR = K14kur;
  window.DM_K14_CIZ = zamanlamaCiz;

  /* ═══════════════════════════════════════════════════════════════════
     K14b · TİPE BAĞLI ALAN — bildirim vardı, SÜRÜCÜSÜ HİÇ YOKTU
     ───────────────────────────────────────────────────────────────────
     🔴 Ajan E ölçtü: `grep -rn 'tip-alan' kanon/ _ortak/` → SIFIR. İki
        ekran (`admin-gorev-form` · `admin-challenge-form`) bu bildirimi
        taşıyor ve alanlar HİÇ süzülmüyordu — tür "Tek seferlik" seçilince
        cron alanı hâlâ görünüyordu. Bildirilmiş ama sürülmeyen bir
        nitelik, hiç bildirilmemişten kötüdür (§22'nin ARIA dersinin alan
        karşılığı: yüzey bir söz veriyor, hiçbir şey tutmuyor).

         <select data-tip-alan-secici>            → sürücü
         <div class="alan" data-tip-alan="sureli seri">  → yalnız o değerlerde

     ⚠ Gizlenen alan `disabled` YAPILMAZ, `hidden` yapılır: `disabled` alan
       form gönderiminden DÜŞER ve değer sessizce kaybolur (L7'nin dersi).
     ⚠ Sürücü bildirilmemişse EN YAKIN forma bakılır; o da yoksa kural
       koşmaz — kit rastgele bir seçim kutusu seçmez.
     ═══════════════════════════════════════════════════════════════════ */
  function tipDeger(sec) {
    if (!sec) return '';
    var v = sec.value;
    if ((!v || v === 'on') && sec.selectedOptions && sec.selectedOptions[0])
      v = sec.selectedOptions[0].getAttribute('data-tip') || sec.selectedOptions[0].textContent;
    return String(v || '').trim().toLocaleLowerCase('tr');
  }

  function tipUygula(sec) {
    var kapsam = sec.closest('form') || document;
    var v = tipDeger(sec);
    var gizlenen = 0;
    kapsam.querySelectorAll('[data-tip-alan]').forEach(function (a) {
      var izin = (a.getAttribute('data-tip-alan') || '')
        .split(/[\s,|]+/).map(function (x) { return x.trim().toLocaleLowerCase('tr'); }).filter(Boolean);
      var goster = !izin.length || izin.indexOf(v) !== -1;
      a.hidden = !goster;
      if (!goster) gizlenen++;
    });
    return gizlenen;
  }

  function K14bKur() {
    var n = 0;
    document.querySelectorAll('[data-tip-alan-secici]').forEach(function (sec) {
      if (sec.getAttribute('data-tip-kuruldu') === '1') return;
      sec.setAttribute('data-tip-kuruldu', '1');
      n++;
      ['change', 'input'].forEach(function (t) {
        sec.addEventListener(t, function () { tipUygula(sec); });
      });
      tipUygula(sec);
    });
    /* Sürücü bildirilmemiş ama alanlar bildirilmişse SESSİZ KALMAZ. */
    if (!n && document.querySelector('[data-tip-alan]'))
      console.warn('[kit K14b] `data-tip-alan` bildirilmiş ama `data-tip-alan-secici` YOK — alanlar süzülmeyecek.');
    return n;
  }
  window.DM_K14B_KUR = K14bKur;
  window.DM_TIP_UYGULA = tipUygula;

  function kur() { K16kur(); K14kur(); K14bKur(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', kur);
  } else { kur(); }

})();
