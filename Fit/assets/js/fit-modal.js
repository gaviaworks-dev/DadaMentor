/* =====================================================================
   FIT_MODAL — ORTAK MODAL İSKELETİ                      (R8 · AJAN-C)
   ---------------------------------------------------------------------
   Neden var. Prototipteki her modal kendi açma/kapama mantığını elle
   yazıyordu; her kopya bir şeyi unutuyordu. R8 · kalem 11'de ölçülen
   hâl (localhost, Playwright):

     profil-v1  #aptModal   → Esc ✅ · dışarı ⛔ · düğme ✅ · odak dönüşü ⛔
     antrenor-detay #aptModal → Esc ⛔ · dışarı ⛔ · düğme ✅ · odak dönüşü ⛔

   Kök neden. `.apt-modal{position:fixed;inset:0}` bütün pencereyi
   kaplıyor ve `#…Overlay`in ÜSTÜNDE duruyor; "dışarı" tıklaması
   overlay'e hiç ulaşmıyor. Playwright'ın kendi kaydı da bunu yazıyor:
   `<div id="aptModal"…> intercepts pointer events`. Dolayısıyla
   dışarı-tıklama dinleyicisi overlay'e DEĞİL, kabın kendisine bağlanır
   ve olay panelin dışına düştüğünde kapatır.

   Ne veriyor (bir modalın borcu olan altı şeyin hepsi, tek yerde):
     1. Esc                — yalnız EN ÜSTTEKİ açık modalı kapatır
     2. dışarı tıklama     — kaba VE overlay'e bağlı; panel içi sayılmaz
     3. kapat düğmesi      — [data-fm-close] ya da `kapat` seçicisi
     4. odak tuzağı        — Tab/Shift+Tab panel içinde sarmalanır
     5. odak dönüşü        — kapanınca TETİKLEYEN elemana geri
     6. scroll kilidi      — FIT_SHELL sayacına devredilir (çift kilit yok)

   Kullanım:
     var h = FIT_MODAL.kur({
       kap:     '#aptModal',        // .show alan dış kap (zorunlu)
       panel:   '.apt-panel',       // kap içindeki gerçek kutu (zorunlu)
       ortu:    '#aptOverlay',      // ayrı örtü düğümü (varsa)
       kapat:   '#aptClose',        // ek kapat düğmesi seçicisi (opsiyonel)
       sinif:   'show',             // açık sınıfı (varsayılan 'show')
       acilinca:  function(){},     // açıldıktan sonra (opsiyonel)
       kapaninca: function(){}      // kapandıktan sonra (opsiyonel)
     });
     h.ac(tetikleyiciEl);  h.kapat();  h.acikMi();

   `kap` ya da `panel` yoksa `kur` null döner — çağıran sayfa patlamaz.
   ===================================================================== */
(function (global) {
  'use strict';

  /* açık modallar — en son açılan dizinin sonunda (Esc onu kapatır) */
  var YIGIN = [];

  var ODAKLANABILIR = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  /* Görünür ve gerçekten odaklanabilir olanlar. `hidden` alt ağaçlar
     (modalların success/body geçişi bunu kullanıyor) elenmeli — yoksa
     tuzak görünmeyen bir düğmeye odak verip kullanıcıyı kör bırakır. */
  function odaklar(panel) {
    return Array.prototype.filter.call(
      panel.querySelectorAll(ODAKLANABILIR),
      function (el) {
        if (el.disabled || el.getAttribute('aria-hidden') === 'true') return false;
        if (el.closest('[hidden]')) return false;
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      }
    );
  }

  function kilitle() {
    if (global.FIT_SHELL && FIT_SHELL.lockScroll) FIT_SHELL.lockScroll();
    else document.body.style.overflow = 'hidden';
  }
  function coz() {
    if (global.FIT_SHELL && FIT_SHELL.unlockScroll) FIT_SHELL.unlockScroll();
    else document.body.style.overflow = '';
  }

  /* --- tek global dinleyici: Esc + Tab tuzağı ------------------------
     Her modal kendi keydown'ını bağlarsa N modal = N dinleyici ve Esc
     hepsini birden kapatır (profil-v1'in eski hâli tam olarak buydu:
     `closeApt(); closeMsg();`). Tek dinleyici yalnız yığının tepesine
     bakar. */
  document.addEventListener('keydown', function (e) {
    if (!YIGIN.length) return;
    var m = YIGIN[YIGIN.length - 1];

    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      m.kapat();
      return;
    }
    if (e.key !== 'Tab') return;

    var liste = odaklar(m.panel);
    if (!liste.length) { e.preventDefault(); m.panel.focus(); return; }

    var ilk = liste[0], son = liste[liste.length - 1], akt = document.activeElement;

    /* Odak panelin dışına düşmüşse (tarayıcı adres çubuğundan dönüş,
       programatik focus) sarmalamayı yine de biz yapalım. */
    if (!m.panel.contains(akt)) { e.preventDefault(); (e.shiftKey ? son : ilk).focus(); return; }

    if (e.shiftKey && akt === ilk) { e.preventDefault(); son.focus(); }
    else if (!e.shiftKey && akt === son) { e.preventDefault(); ilk.focus(); }
  }, true);

  function kur(o) {
    var kap = typeof o.kap === 'string' ? document.querySelector(o.kap) : o.kap;
    if (!kap) return null;
    var panel = typeof o.panel === 'string' ? kap.querySelector(o.panel) : o.panel;
    if (!panel) return null;

    var ortu  = o.ortu ? (typeof o.ortu === 'string' ? document.querySelector(o.ortu) : o.ortu) : null;
    var sinif = o.sinif || 'show';
    var acik  = false;
    var tetik = null;

    /* panelin kendisi de odak alabilsin — içinde hiç odaklanabilir yoksa
       ya da açılışta metnin başına konmak gerektiğinde */
    if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1');

    var h = {
      kap: kap, panel: panel,
      acikMi: function () { return acik; },

      ac: function (tetikleyici) {
        if (acik) return;
        tetik = tetikleyici ||
                (document.activeElement && document.activeElement !== document.body
                  ? document.activeElement : null);
        kap.classList.add(sinif);
        if (ortu) ortu.classList.add(sinif);
        kap.removeAttribute('aria-hidden');
        acik = true;
        YIGIN.push(h);
        kilitle();
        /* --- 5 · AÇILIŞ ODAĞI ------------------------------------------
           ÖNCE tek `requestAnimationFrame` bekleniyordu. Yetmiyor: kap
           `visibility .25s` geçişi taşıdığında (`.apt-modal` — hem
           profil-v1 hem antrenor-detay) rAF-1 karesinde computed
           `visibility` HÂLÂ `hidden`, ve `visibility:hidden` bir alt
           ağaçtaki `.focus()` sessizce hiçbir şey yapmıyor. Modal açık,
           odak tetikleyicide kalıyor — ekran okuyucu kullanıcısı modalın
           açıldığını duymuyor. AJAN-G kare kare ölçüp bildirdi; ben
           antrenor-detay VE profil-v1'de yeniden ürettim.

           `transitionend` tek başına yetmez: `prefers-reduced-motion`da
           ya da geçişsiz bir modalda (anatomi diyaloğu) hiç ateşlenmez.
           Bu yüzden "odak İÇERİ DÜŞENE KADAR dene": ilk denemede oturursa
           tek karede biter, geçiş varsa birkaç kare sonra oturur.
           Odak zaten panelin içindeyse hiçbir şeye dokunulmaz — kullanıcı
           bu arada başka bir alana geçtiyse onu geri çekmeyiz. */
        var deneme = 0;
        (function odakVer() {
          if (!acik) return;                                  // bu arada kapandıysa bırak
          if (panel.contains(document.activeElement)) return; // zaten içeride
          var l = odaklar(panel);
          (l.length ? l[0] : panel).focus();
          if (!panel.contains(document.activeElement) && ++deneme < 20) requestAnimationFrame(odakVer);
        })();
        if (o.acilinca) o.acilinca(h);
      },

      kapat: function () {
        if (!acik) return;
        kap.classList.remove(sinif);
        if (ortu) ortu.classList.remove(sinif);
        acik = false;
        var i = YIGIN.indexOf(h); if (i > -1) YIGIN.splice(i, 1);
        coz();
        /* odak TETİKLEYENE döner — kapat düğmesinde kalmaz */
        if (tetik && document.contains(tetik) && tetik.focus) tetik.focus();
        tetik = null;
        if (o.kapaninca) o.kapaninca(h);
      }
    };

    /* --- 2 · dışarı tıklama -----------------------------------------
       Kaba bağlanıyor: kap tüm pencereyi kaplasa bile panelin dışına
       düşen tıklama yakalanır. `mousedown`+`click` ikilisi: kullanıcı
       panel içinde basıp dışarıda bırakırsa (metin seçimi) kapanmasın. */
    var basimIcerde = false;
    kap.addEventListener('mousedown', function (e) { basimIcerde = panel.contains(e.target); });
    kap.addEventListener('click', function (e) {
      if (e.target !== kap && panel.contains(e.target)) return;
      if (basimIcerde) { basimIcerde = false; return; }
      h.kapat();
    });
    if (ortu) ortu.addEventListener('click', function () { h.kapat(); });

    /* --- 3 · kapat düğmeleri ----------------------------------------
       DELEGE: panel içeriği sonradan innerHTML ile değişebiliyor
       (anatomi paneli her kas seçiminde yeniden basılıyor). Doğrudan
       bağlanan dinleyici o an ölürdü. */
    kap.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-fm-close]')) h.kapat();
    });
    if (o.kapat) {
      var kb = typeof o.kapat === 'string' ? document.querySelector(o.kapat) : o.kapat;
      if (kb) kb.addEventListener('click', function () { h.kapat(); });
    }

    return h;
  }

  /* tetikleyici → modal bağlamanın kısa yolu */
  function tetikle(sec, h, once) {
    if (!h) return;
    var el = typeof sec === 'string' ? document.querySelector(sec) : sec;
    if (!el) return;
    el.addEventListener('click', function () { if (once) once(h); h.ac(el); });
  }

  global.FIT_MODAL = { kur: kur, tetikle: tetikle, yigin: YIGIN };
})(window);
