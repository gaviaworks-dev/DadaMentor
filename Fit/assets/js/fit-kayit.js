/* =====================================================================
   DadaFit · KAYIT (favori) SÖZLEŞMESİ — TEK KAYNAK   (R15/1 · 2026-08-29)
   ---------------------------------------------------------------------
   NEDEN VAR — ölçülmüş kusur, R15 ölçüm turu:
     · egzersiz kütüphanesi 25 kart · kaydet düğmesi 0
     · program listesi      9 kart · kaydet düğmesi 0
     · "Kaydettiklerim" sayfasındaki 10 satırın HEPSİ HTML'e gömülü sabitti
     · "Favorilerden kaldır" satırı DOM'dan siliyordu, depoya hiç yazmıyordu:
       yenile → 10 satır geri geliyordu
   Yani yetenek yoktu, ikonu vardı. Beyar kararı: "Sahte olan gerçek olacak."

   Desen `fit-plan-kayit.js` (FIT_PLAN) ile AYNI — iki taraf da kendi
   depolama kodunu yazmaz, çağrı yüzeyi yalnız bu dosyadadır.

   DEPOLAMA
     localStorage['dm_fit_kayit_v1'] = {
       surum: 1,
       kayitlar: [Kayit]           // en yeni başta
     }
     (kabuğun `dm_fit_*` anahtar ailesiyle aynı önek)

   KAYIT ŞEMASI
     {
       tur   : 'hareket'|'program'|'rehber'|'challenge'|'antrenor'|'test',
       slug  : 'goblet-squat',        // tur+slug BİRLİKTE benzersizdir
       ad    : 'Goblet Squat',
       href  : 'egzersiz-detay-v1.html?slug=goblet-squat',
       gorsel: 'https://…'  | '',     // kart görseli (isteğe bağlı)
       meta  : 'Bacak · Dambıl',      // kartın tek satırlık künyesi
       tarih : '2026-08-29T…'         // kaydedildiği an (ISO)
     }

   NE UYDURULMAZ
     · `ad` verilmeden kayıt AÇILMAZ. Slug'ı güzelleştirip ad üretmek
       fabrikasyondur (FIT_PLAN'ın `alternatifAd` dersi, aynı hata).
     · Görsel yoksa kart görselsiz basılır; yer tutucu görsel uydurulmaz.

   OLAY
     window → 'fit-kayit-degisti'  detail:{tur, slug, kayitli, sayi}
     Dinleyen sayfa listesini yeniler; modül kendi DOM'unu bilmez.
   ===================================================================== */
(function (kok) {
  'use strict';

  var ANAHTAR = 'dm_fit_kayit_v1';
  var TURLER  = ['hareket', 'program', 'rehber', 'challenge', 'antrenor', 'test'];

  /* tür → görünen ad. Çip ve rozet metni buradan okunur, sayfada tekrar
     edilmez; yeni tür eklenince tek satır değişir. */
  var TUR_AD = {
    hareket:   'Hareket',
    program:   'Program',
    rehber:    'Rehber',
    challenge: 'Challenge',
    antrenor:  'Antrenör',
    test:      'Fit Test'
  };

  var TUR_IKON = {
    hareket:   'fa-solid fa-person-running',
    program:   'fa-solid fa-dumbbell',
    rehber:    'fa-solid fa-book-open',
    challenge: 'fa-solid fa-trophy',
    antrenor:  'fa-solid fa-user-tie',
    test:      'fa-solid fa-clipboard-check'
  };

  /* ---- düşük seviye: oku / yaz ------------------------------------ */
  function bos() { return { surum: 1, kayitlar: [] }; }

  function oku() {
    try {
      var ham = kok.localStorage.getItem(ANAHTAR);
      if (!ham) return bos();
      var d = JSON.parse(ham);
      if (!d || !Array.isArray(d.kayitlar)) return bos();
      if (typeof d.surum !== 'number') d.surum = 1;
      return d;
    } catch (e) { return bos(); }
  }

  function yaz(d) {
    try { kok.localStorage.setItem(ANAHTAR, JSON.stringify(d)); return true; }
    catch (e) { return false; }              /* kota dolu / gizli kip */
  }

  function haberVer(tur, slug, kayitli, sayi) {
    try {
      kok.dispatchEvent(new CustomEvent('fit-kayit-degisti', {
        detail: { tur: tur, slug: slug, kayitli: kayitli, sayi: sayi }
      }));
    } catch (e) {}
  }

  /* ---- genel yüzey ------------------------------------------------- */
  var API = {

    ANAHTAR:  ANAHTAR,
    TURLER:   TURLER,
    TUR_AD:   TUR_AD,
    TUR_IKON: TUR_IKON,

    kullanilabilir: function () {
      try {
        kok.localStorage.setItem('__fit_kyt__', '1');
        kok.localStorage.removeItem('__fit_kyt__');
        return true;
      } catch (e) { return false; }
    },

    kayitli: function (tur, slug) {
      if (!tur || !slug) return false;
      return oku().kayitlar.some(function (k) {
        return k.tur === tur && k.slug === slug;
      });
    },

    /* Kaydeder. Zaten kayıtlıysa DOKUNMAZ (tarihi ezmez) ve true döner. */
    ekle: function (o) {
      if (!o || !o.tur || !o.slug) return false;
      if (TURLER.indexOf(o.tur) < 0) return false;
      /* ad uydurulmaz — bkz. başlıktaki "NE UYDURULMAZ" */
      if (!o.ad) return false;

      var d = oku();
      if (d.kayitlar.some(function (k) { return k.tur === o.tur && k.slug === o.slug; })) return true;

      d.kayitlar.unshift({
        tur:    o.tur,
        slug:   String(o.slug),
        ad:     String(o.ad),
        href:   o.href   ? String(o.href)   : '',
        gorsel: o.gorsel ? String(o.gorsel) : '',
        meta:   o.meta   ? String(o.meta)   : '',
        tarih:  new Date().toISOString()
      });
      if (!yaz(d)) return false;
      haberVer(o.tur, o.slug, true, d.kayitlar.length);
      return true;
    },

    /* Kaydı siler. */
    kaldir: function (tur, slug) {
      var d = oku(), n = d.kayitlar.length;
      d.kayitlar = d.kayitlar.filter(function (k) {
        return !(k.tur === tur && k.slug === slug);
      });
      if (d.kayitlar.length === n) return false;

      if (!yaz(d)) return false;
      haberVer(tur, slug, false, d.kayitlar.length);
      return true;
    },

    /* Tek çağrıda aç/kapa. Dönen değer: İŞLEMDEN SONRAKİ kayıtlılık. */
    degistir: function (o) {
      if (!o || !o.tur || !o.slug) return false;
      if (API.kayitli(o.tur, o.slug)) { API.kaldir(o.tur, o.slug); return false; }
      return API.ekle(o) ? true : false;
    },

    /* Yeniden eskiye. `tur` verilirse yalnız o tür. */
    listele: function (tur) {
      var l = oku().kayitlar.slice().sort(function (a, b) {
        return String(b.tarih).localeCompare(String(a.tarih));
      });
      return tur ? l.filter(function (k) { return k.tur === tur; }) : l;
    },

    sayi: function (tur) { return API.listele(tur).length; },

    /* Tür → adet dökümü; boş türler de 0 ile döner (çip sayacı için). */
    dokum: function () {
      var d = {}, l = API.listele();
      TURLER.forEach(function (t) { d[t] = 0; });
      l.forEach(function (k) { if (d.hasOwnProperty(k.tur)) d[k.tur]++; });
      d.toplam = l.length;
      return d;
    },

    /* R15 · KOLEKSİYON YÜZEYİ KALDIRILDI (Beyar, 2026-08-30): "böyle bir
       özelliğimiz yok". `koleksiyonlar/koleksiyonAc/koleksiyonSil/
       koleksiyonDegistir/koleksiyonUyesi` ve şemadaki `koleksiyonlar[]`
       dizisi söküldü. `oku()` eski kayıtta o alanı görürse SESSİZCE
       yok sayar — kullanıcının deposunu bozmaz, taşımaz, uydurmaz. */

    temizle: function () {
      try { kok.localStorage.removeItem(ANAHTAR); haberVer(null, null, null, 0); return true; }
      catch (e) { return false; }
    },

    /* =================================================================
       DOM KÖPRÜSÜ — `[data-kaydet]` düğmeleri
       -----------------------------------------------------------------
       25 egzersiz + 9 program kartına ayrı ayrı olay bağlamak yerine
       BELGE ÜZERİNDE TEK delegasyon. Sonradan basılan kart (süzgeç,
       "daha fazla yükle", modül sayfasının kendi listesi) kendiliğinden
       çalışır — yeniden bağlama çağrısı gerekmez.

       Düğme sözleşmesi:
         <button data-kaydet type="button"
                 data-tur="hareket" data-slug="…" data-ad="…"
                 data-href="…" data-gorsel="…" data-meta="…"
                 aria-pressed="false">…</button>

       Düğme AÇIK KİPTE `aria-pressed="true"` taşır ve ikonu dolu
       bookmark'a döner. Görsel durum ile depo durumu tek yerden
       eşitlenir (`tazele`), yani "yalnız ikon değişiyor" kusuru
       yapısal olarak imkânsız: ikon `kayitli()`den okunur.
       ================================================================= */
    tazele: function (kok2) {
      var alan = kok2 || document;
      var btns = alan.querySelectorAll('[data-kaydet]');
      Array.prototype.forEach.call(btns, function (b) {
        var tur = b.getAttribute('data-tur'), slug = b.getAttribute('data-slug');
        var on  = API.kayitli(tur, slug);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.classList.toggle('is-on', on);
        var i = b.querySelector('i');
        if (i) i.className = (on ? 'fa-solid' : 'fa-regular') + ' fa-bookmark';
        var ad = b.getAttribute('data-ad') || 'Bu içerik';
        b.setAttribute('aria-label', on ? ad + ' — kaydı kaldır' : ad + ' — kaydet');
        b.setAttribute('title',      on ? 'Kaydı kaldır' : 'Kaydet');
      });
      return btns.length;
    }
  };

  /* tek delegasyon — belge düzeyinde, bir kez */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-kaydet]');
    if (!b) return;
    /* kart bir bağlantının içindeyse gezinmeyi durdur: kullanıcı kaydetmek
       istedi, sayfa değiştirmek değil */
    e.preventDefault();
    e.stopPropagation();

    if (!API.kullanilabilir()) {
      /* gizli kip / kota: sessizce "kaydedildi" demek yalan olurdu */
      b.setAttribute('title', 'Tarayıcı depolaması kapalı — kayıt tutulamıyor');
      b.classList.add('kyt-hata');
      return;
    }

    API.degistir({
      tur:    b.getAttribute('data-tur'),
      slug:   b.getAttribute('data-slug'),
      ad:     b.getAttribute('data-ad'),
      href:   b.getAttribute('data-href'),
      gorsel: b.getAttribute('data-gorsel'),
      meta:   b.getAttribute('data-meta')
    });
    API.tazele();
  });

  /* başka sekmede değişirse bu sekme de eşitlensin */
  kok.addEventListener('storage', function (e) {
    if (e && e.key === ANAHTAR) API.tazele();
  });

  kok.addEventListener('fit-kayit-degisti', function () { API.tazele(); });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { API.tazele(); });
  } else {
    API.tazele();
  }

  kok.FIT_KAYIT = API;

})(window);
