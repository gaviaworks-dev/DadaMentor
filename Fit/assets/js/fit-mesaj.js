/* =====================================================================
   DadaFit · ANTRENÖR SOHBETİ SÖZLEŞMESİ — TEK KAYNAK  (R15/5 · 2026-08-29)
   ---------------------------------------------------------------------
   NE YAPAR
     Üyenin RANDEVU ALDIĞI antrenörlerle yazışma yüzeyi. İki yüzey, tek
     motor: sağdan açılan panel (her sayfada) ve `mesajlarim-v1.html`
     (tam ekran: geçmiş · arama · dosya eki).

   DESEN
     `fit-plan-kayit.js` (FIT_PLAN) ve `fit-kayit.js` (FIT_KAYIT) ile AYNI:
     çağrı yüzeyi yalnız bu dosyadadır, sayfa kendi depolama kodunu yazmaz.
     Dosya başında şema · `oku`/`yaz` · olay yayını · `kullanilabilir()`
     gizli-kip kontrolü · göç güvenliği.

   KENDİ KENDİNE YETER
     Bu modül kabuğun dosyalarına DOKUNMAZ. Kendi `<link>`ini (fit-mesaj.css)
     ve kendi DOM'unu enjekte eder; kabuğun `#fbModal` ailesiyle çakışacak
     tek bir ad kullanmaz (hepsi `msj` önekli).

   DEPOLAMA
     localStorage['dm_fit_mesaj_v1'] = {
       surum: 1,
       sohbetler: {
         '<antrenor-slug>': {
           slug     : 'selin-aksoy',
           antrenor : 'Selin Aksoy',          // randevudan gelir, UYDURULMAZ
           okundu   : '2026-08-29T…' | null,  // son okuma anı (ISO)
           mesajlar : [ Mesaj ]               // ESKİDEN YENİYE
         }
       }
     }
     (kabuğun `dm_fit_*` anahtar ailesiyle aynı önek)

   MESAJ ŞEMASI
     {
       id    : 'm_<zaman>_<rastgele>',
       yon   : 'uye' | 'antrenor',
       metin : 'serbest metin',
       tarih : '2026-08-29T…',          // ISO
       ek    : { ad:'olcum.pdf', boyut:184320, tur:'application/pdf' } | null
     }

   🔴 NE UYDURULMAZ — BEYAR KURALI
     · ANTRENÖR CEVABI ÜRETİLMEZ. Kullanıcı yazınca "antrenör yazıyor…",
       gecikmeli otomatik yanıt, okundu tiki gibi hiçbir simülasyon YOKTUR.
       Karşı tarafta kimse yok; olmadığını ekran da söylüyor.
     · Açılış demosu SABİT ve DEPOYA YAZILMAZ (aşağıdaki `DEMO`). Okuma
       anında birleştirilir, her balonu `Örnek` rozeti taşır ve YALNIZ ilk
       antrenörde görünür — her sohbette tekrarlanması "sistem böyle
       yazıyor" izlenimi verirdi.
     · Antrenör avatarı uydurulmaz: randevu kaydında görsel alanı yok,
       o yüzden adın baş harfi (monogram) basılır.
     · Dosya eki: dosyanın ADI · BOYUTU · TÜRÜ gerçekten okunur ve gerçekten
       kaydedilir; dosyanın KENDİSİ hiçbir yere yüklenmez ve ekranda bunu
       yazan bir satır durur. Yükleniyormuş gibi yapan bir çubuk yoktur.

   KİMİNLE YAZIŞILIR
     `FIT_SHELL.state.read().randevular` → [{antrenor, slug, hizmet, fiyat,
     tarih, saat, durum}]. Sohbet listesi BURADAN türer; randevusu olmayan
     antrenörle sohbet açılmaz. Randevu yoksa yüzen düğme sohbet açmaz,
     antrenör listesine götürür.

   OTURUM
     ⚠ Görev metninde oturum bayrağı `localStorage['dm_fit_login']` diye
     geçiyor; bu depoda ÖYLE BİR ANAHTAR YOK (ölçüldü: 0 kullanım).
     Kabuk `dm_user` JSON'unu okuyup `body.is-auth` sınıfını basıyor
     (fit-shell.js · "Login-state simülasyonu"). Bu modül TEK doğru
     sinyale, `body.is-auth`e bakar.

   OLAY
     window → 'fit-mesaj-degisti'
              detail:{ slug, sayi, okunmamis }
     Dinleyen sayfa listesini yeniler; modül kendi DOM'unu bilir, sayfanınkini
     bilmez.
   ===================================================================== */
(function (kok) {
  'use strict';

  var ANAHTAR = 'dm_fit_mesaj_v1';
  var YONLER  = ['uye', 'antrenor'];
  var EK_SINIR = 20 * 1024 * 1024;          /* 20 MB — künye sınırı, bkz. `ekSec` */

  /* Açılış demosu — SABİT, depoya yazılmaz, yalnız ilk antrenörde görünür.
     Tarihler sabittir: her açılışta "az önce" görünmesi sahtelik olurdu. */
  var DEMO = [
    { id:'demo-1', yon:'antrenor', demo:true, tarih:'2026-08-27T06:12:00.000Z',
      metin:'Merhaba! Randevunu aldım. İlk seanstan önce iki şeyi bilmem gerekiyor: son altı ayda bir sakatlık yaşadın mı ve haftada kaç gün ayırabilirsin?' },
    { id:'demo-2', yon:'uye', demo:true, tarih:'2026-08-27T06:41:00.000Z',
      metin:'Sakatlık yok. Haftada üç gün ayırabilirim, akşamları daha uygun.' },
    { id:'demo-3', yon:'antrenor', demo:true, tarih:'2026-08-27T07:05:00.000Z',
      metin:'Üç gün yeter. İlk seansta hareket taramasi yapacağız, spor ayakkabı ve su yanında olsun.' }
  ];

  /* ---- düşük seviye: oku / yaz ------------------------------------ */
  function bos() { return { surum: 1, sohbetler: {} }; }

  /* GÖÇ — okuma anında, yazma anında değil. Alan bazlı tamamlama:
     eski kayıt kırılmaz, eksik alan varsayılanla dolar, var olan hiçbir
     değer ezilmez (FIT_PLAN'ın `goc` dersi). */
  function goc(d) {
    if (!d || typeof d !== 'object') return bos();
    if (typeof d.surum !== 'number') d.surum = 1;
    if (!d.sohbetler || typeof d.sohbetler !== 'object') d.sohbetler = {};
    Object.keys(d.sohbetler).forEach(function (s) {
      var c = d.sohbetler[s];
      if (!c || typeof c !== 'object') { delete d.sohbetler[s]; return; }
      if (!Array.isArray(c.mesajlar)) c.mesajlar = [];
      if (!('okundu' in c)) c.okundu = null;
      c.slug = c.slug || s;
      c.mesajlar = c.mesajlar.filter(function (m) {
        return m && YONLER.indexOf(m.yon) > -1 && typeof m.tarih === 'string';
      });
    });
    return d;
  }

  function oku() {
    try {
      var ham = kok.localStorage.getItem(ANAHTAR);
      if (!ham) return bos();
      return goc(JSON.parse(ham));
    } catch (e) { return bos(); }
  }

  function yaz(d) {
    try { kok.localStorage.setItem(ANAHTAR, JSON.stringify(d)); return true; }
    catch (e) { return false; }                 /* kota dolu / gizli kip */
  }

  function haberVer(slug) {
    try {
      kok.dispatchEvent(new CustomEvent('fit-mesaj-degisti', {
        detail: { slug: slug || null, sayi: API.toplamSayi(), okunmamis: API.okunmamis() }
      }));
    } catch (e) {}
  }

  function S() { return kok.FIT_SHELL && kok.FIT_SHELL.state; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function yeniId() {
    return 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  /* ---- biçimleme --------------------------------------------------- */
  function tarihObj(iso) { var t = new Date(iso); return isNaN(t.getTime()) ? null : t; }

  function saatMetni(iso) {
    var t = tarihObj(iso); if (!t) return '';
    try { return t.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return ''; }
  }

  function gunMetni(iso) {
    var t = tarihObj(iso); if (!t) return '';
    var bugun = new Date(), dun = new Date(bugun.getTime() - 86400000);
    function ayniGun(a, b) {
      return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }
    if (ayniGun(t, bugun)) return 'Bugün';
    if (ayniGun(t, dun))   return 'Dün';
    try { return t.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }); }
    catch (e) { return ''; }
  }

  function boyutMetni(b) {
    var n = Number(b);
    if (!isFinite(n) || n < 0) return '';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
    return (n / 1024 / 1024).toFixed(1) + ' MB';
  }

  function monogram(ad) {
    var p = String(ad || '').trim().split(/\s+/).filter(Boolean);
    if (!p.length) return '?';
    if (p.length === 1) return p[0].slice(0, 2).toLocaleUpperCase('tr-TR');
    return (p[0][0] + p[p.length - 1][0]).toLocaleUpperCase('tr-TR');
  }

  var EK_IKON = [
    [/^image\//,                        'fa-solid fa-image'],
    [/^video\//,                        'fa-solid fa-film'],
    [/^audio\//,                        'fa-solid fa-music'],
    [/pdf/,                             'fa-solid fa-file-pdf'],
    [/sheet|excel|csv/,                 'fa-solid fa-file-csv'],
    [/word|document|text\/plain/,       'fa-solid fa-file-lines']
  ];
  function ekIkon(tur) {
    var t = String(tur || '');
    for (var i = 0; i < EK_IKON.length; i++) if (EK_IKON[i][0].test(t)) return EK_IKON[i][1];
    return 'fa-solid fa-paperclip';
  }

  /* =====================================================================
     GENEL YÜZEY
     ===================================================================== */
  var API = {

    ANAHTAR: ANAHTAR,
    DEMO:    DEMO,

    kullanilabilir: function () {
      try {
        kok.localStorage.setItem('__fit_msj__', '1');
        kok.localStorage.removeItem('__fit_msj__');
        return true;
      } catch (e) { return false; }
    },

    oku: oku,

    /* Randevu alınmış antrenörler — en yeni randevu başta, slug'a göre tekil.
       KAYNAK kabuğun durum modülü; bu modül kendi antrenör listesi tutmaz. */
    antrenorler: function () {
      var st = S(); if (!st) return [];
      var r = st.read().randevular || [];
      var gorulen = {}, out = [];
      r.forEach(function (x) {
        if (!x || !x.slug || !x.antrenor) return;      /* adsız kayıt atlanır */
        if (gorulen[x.slug]) return;
        gorulen[x.slug] = 1;
        out.push({
          slug:     String(x.slug),
          antrenor: String(x.antrenor),
          hizmet:   x.hizmet ? String(x.hizmet) : '',
          tarih:    x.tarih  ? String(x.tarih)  : '',
          saat:     x.saat   ? String(x.saat)   : '',
          durum:    x.durum  ? String(x.durum)  : ''
        });
      });
      return out;
    },

    /* Randevu durumunun rozet sınıfı — kabuğun kendi tablosundan.
       Burada ikinci bir eşleme tutmak iki kaynak demek olurdu. */
    durumRozet: function (durum) {
      var st = S();
      if (st && typeof st.randevuRozet === 'function') return st.randevuRozet(durum);
      return 'off';
    },
    durumEtiket: function (durum) {
      var st = S();
      if (st && typeof st.randevuEtiket === 'function') return st.randevuEtiket(durum);
      return durum || '';
    },

    /* Bir sohbetin TÜM mesajları: sabit demo + depodakiler, eskiden yeniye.
       Demo yalnız listedeki İLK antrenöre bağlıdır (bkz. NE UYDURULMAZ):
       panel o antrenörle açıldığı için açılış ekranı dolu gelir.
       ⚠ Liste EN YENİ randevu başta sıralı; yeni randevu alınırsa demo yeni
       antrenöre geçer, eskisi boşalır. Maket için kabul edilebilir bir
       kayma; gerçek veri gelince `DEMO` tamamen kalkacağı için sabitlemedim.
       Beyar aksini isterse tek satır: `antrenorler().slice(-1)[0]`. */
    mesajlar: function (slug) {
      if (!slug) return [];
      var ilk = API.antrenorler()[0];
      var demo = (ilk && ilk.slug === slug) ? DEMO.slice() : [];
      var c = oku().sohbetler[slug];
      var kendi = c ? c.mesajlar.slice() : [];
      return demo.concat(kendi).sort(function (a, b) {
        return String(a.tarih).localeCompare(String(b.tarih));
      });
    },

    sonMesaj: function (slug) {
      var l = API.mesajlar(slug);
      return l.length ? l[l.length - 1] : null;
    },

    /* Üyenin mesajını KAYDEDER. Karşı tarafa iletmez ve iletiyormuş gibi
       yapmaz — dönen değer yalnız "kaydedildi mi" sorusunun cevabıdır. */
    gonder: function (slug, metin, ek) {
      if (!slug) return null;
      var t = String(metin == null ? '' : metin).trim();
      if (!t && !ek) return null;

      var kayit = API.antrenorler().filter(function (a) { return a.slug === slug; })[0];
      if (!kayit) return null;                 /* randevusu olmayan antrenör */

      var d = oku();
      if (!d.sohbetler[slug]) {
        d.sohbetler[slug] = { slug: slug, antrenor: kayit.antrenor, okundu: null, mesajlar: [] };
      }
      d.sohbetler[slug].antrenor = kayit.antrenor;   /* ad randevudan tazelenir */

      var m = {
        id:    yeniId(),
        yon:   'uye',
        metin: t,
        tarih: new Date().toISOString(),
        ek:    ek ? { ad: String(ek.ad), boyut: Number(ek.boyut) || 0, tur: String(ek.tur || '') } : null
      };
      d.sohbetler[slug].mesajlar.push(m);
      if (!yaz(d)) return null;
      haberVer(slug);
      return m;
    },

    /* Sohbeti okundu say. Yalnız ANTRENÖR mesajları okunmamış olabilir;
       üyenin kendi yazdığı zaten okunmuştur. */
    okunduIsaretle: function (slug) {
      if (!slug) return false;
      var kayit = API.antrenorler().filter(function (a) { return a.slug === slug; })[0];
      if (!kayit) return false;
      var d = oku();
      if (!d.sohbetler[slug]) {
        d.sohbetler[slug] = { slug: slug, antrenor: kayit.antrenor, okundu: null, mesajlar: [] };
      }
      var yeni = new Date().toISOString();
      if (d.sohbetler[slug].okundu === yeni) return true;
      d.sohbetler[slug].okundu = yeni;
      if (!yaz(d)) return false;
      haberVer(slug);
      return true;
    },

    /* Bir sohbette okunmamış ANTRENÖR mesajı sayısı. */
    okunmamisSayi: function (slug) {
      var c = oku().sohbetler[slug];
      var okundu = c ? c.okundu : null;
      return API.mesajlar(slug).filter(function (m) {
        return m.yon === 'antrenor' && (!okundu || String(m.tarih) > String(okundu));
      }).length;
    },

    /* Tüm sohbetlerdeki okunmamış toplamı — yüzen düğmenin rozeti. */
    okunmamis: function () {
      return API.antrenorler().reduce(function (t, a) { return t + API.okunmamisSayi(a.slug); }, 0);
    },

    toplamSayi: function () {
      return API.antrenorler().reduce(function (t, a) { return t + API.mesajlar(a.slug).length; }, 0);
    },

    /* Arama — tüm sohbetlerde metin geçen mesajlar, yeniden eskiye. */
    ara: function (q) {
      var s = String(q || '').trim().toLocaleLowerCase('tr-TR');
      if (s.length < 2) return [];
      var out = [];
      API.antrenorler().forEach(function (a) {
        API.mesajlar(a.slug).forEach(function (m) {
          var govde = String(m.metin || '') + ' ' + (m.ek ? m.ek.ad : '');
          if (govde.toLocaleLowerCase('tr-TR').indexOf(s) > -1) {
            out.push({ slug: a.slug, antrenor: a.antrenor, mesaj: m });
          }
        });
      });
      return out.sort(function (x, y) { return String(y.mesaj.tarih).localeCompare(String(x.mesaj.tarih)); });
    },

    temizle: function () {
      try { kok.localStorage.removeItem(ANAHTAR); haberVer(null); return true; }
      catch (e) { return false; }
    },

    /* ---- görünüm yardımcıları (iki yüzey de aynı HTML'i basar) ------ */
    esc: esc,
    monogram: monogram,
    saatMetni: saatMetni,
    gunMetni: gunMetni,
    boyutMetni: boyutMetni,
    ekIkon: ekIkon,

    /* Bir mesaj listesini balonlara çevirir. Gün ayracı, künye, ek şeridi
       ve `Örnek` rozeti burada basılır — iki yüzeyde iki farklı balon
       görünümü olmasın diye. */
    akisHtml: function (liste) {
      if (!liste.length) return '';
      var sonGun = '';
      return liste.map(function (m) {
        var g = gunMetni(m.tarih), ayrac = '';
        if (g && g !== sonGun) { ayrac = '<div class="msj-gun">' + esc(g) + '</div>'; sonGun = g; }
        var kim = m.yon === 'uye' ? 'uye' : 'antrenor';
        var ek = m.ek
          ? '<span class="msj-ek"><i class="' + ekIkon(m.ek.tur) + '" aria-hidden="true"></i>' +
            '<b>' + esc(m.ek.ad) + '</b><small>' + esc(boyutMetni(m.ek.boyut)) + '</small></span>'
          : '';
        return ayrac +
          '<div class="msj-balon ' + kim + '">' +
            '<p>' + esc(m.metin) + '</p>' + ek +
            '<span class="msj-kunye">' +
              (m.demo ? '<span class="fp-badge off">Örnek</span>' : '') +
              esc(saatMetni(m.tarih)) +
            '</span>' +
          '</div>';
      }).join('');
    },

    /* Yazma kutusu — panel ve sayfa AYNI markup'ı kullanır. */
    yazHtml: function (idOnek) {
      return '' +
        '<div class="msj-yaz">' +
          '<div class="msj-secilen" id="' + idOnek + 'Ek" hidden>' +
            '<i class="fa-solid fa-paperclip" aria-hidden="true"></i>' +
            '<b></b><small></small>' +
            '<button type="button" data-ek-sil aria-label="Eki kaldır"><i class="fa-solid fa-xmark"></i></button>' +
          '</div>' +
          '<form novalidate>' +
            '<input type="file" id="' + idOnek + 'Dosya" tabindex="-1" aria-hidden="true" />' +
            '<button class="msj-btn ek" type="button" data-ek-ac aria-label="Dosya ekle" title="Dosya ekle">' +
              '<i class="fa-solid fa-paperclip" aria-hidden="true"></i></button>' +
            '<label class="sr-only" for="' + idOnek + 'Metin">Mesajın</label>' +
            '<textarea id="' + idOnek + 'Metin" rows="1" placeholder="Mesajını yaz…"></textarea>' +
            '<button class="msj-btn gonder" type="submit" aria-label="Mesajı kaydet" title="Mesajı kaydet">' +
              '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i></button>' +
          '</form>' +
          '<p class="msj-uyari" id="' + idOnek + 'Uyari" hidden></p>' +
          '<p class="msj-ipucu">Dosya eki maket: adı ve boyutu kaydedilir, dosyanın kendisi yüklenmez.</p>' +
        '</div>';
    },

    /* Yazma kutusunu çalıştırır. `seciliSlug()` o anki sohbeti döndürmeli,
       `sonra()` kayıttan sonra çağrılır. Tek yerde: iki yüzeyde iki ayrı
       gönderme kodu olsaydı biri sessizce bozulurdu. */
    yazBagla: function (kokEl, idOnek, seciliSlug, sonra) {
      var form   = kokEl.querySelector('.msj-yaz form');
      var metin  = kokEl.querySelector('#' + idOnek + 'Metin');
      var dosya  = kokEl.querySelector('#' + idOnek + 'Dosya');
      var serit  = kokEl.querySelector('#' + idOnek + 'Ek');
      var uyari  = kokEl.querySelector('#' + idOnek + 'Uyari');
      var ekBtn  = kokEl.querySelector('[data-ek-ac]');
      if (!form || !metin) return;

      var bekleyen = null;

      function uyar(t) {
        if (!uyari) return;
        uyari.textContent = t || '';
        uyari.hidden = !t;
      }
      function ekBas() {
        if (!serit) return;
        if (!bekleyen) { serit.hidden = true; if (ekBtn) ekBtn.classList.remove('is-dolu'); return; }
        serit.querySelector('b').textContent = bekleyen.ad;
        serit.querySelector('small').textContent = boyutMetni(bekleyen.boyut);
        serit.querySelector('i').className = ekIkon(bekleyen.tur);
        serit.hidden = false;
        if (ekBtn) ekBtn.classList.add('is-dolu');
      }
      function buyut() {
        metin.style.height = 'auto';
        metin.style.height = Math.min(metin.scrollHeight, 132) + 'px';
      }

      metin.addEventListener('input', buyut);
      metin.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', {cancelable:true})); }
      });

      if (ekBtn && dosya) ekBtn.addEventListener('click', function () { dosya.click(); });
      if (dosya) dosya.addEventListener('change', function () {
        var f = dosya.files && dosya.files[0];
        if (!f) { bekleyen = null; ekBas(); return; }
        if (f.size > EK_SINIR) {
          /* Sınır künyeye değil dürüstlüğe ait: 20 MB'lık bir dosyanın
             "eklendi" görünmesi, hiçbir yere gitmediği için yanıltıcı olur. */
          uyar('Bu dosya 20 MB üstünde. Maket ekranda yalnız dosya künyesi tutuluyor; bu boyutta bir eki künye olarak göstermek yanıltıcı olur.');
          dosya.value = ''; bekleyen = null; ekBas(); return;
        }
        uyar('');
        bekleyen = { ad: f.name, boyut: f.size, tur: f.type || '' };
        ekBas();
      });

      if (serit) serit.addEventListener('click', function (e) {
        if (!e.target.closest('[data-ek-sil]')) return;
        bekleyen = null; if (dosya) dosya.value = ''; ekBas();
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var slug = seciliSlug();
        if (!slug) { uyar('Önce bir antrenör seç.'); return; }
        if (!API.kullanilabilir()) {
          uyar('Tarayıcı depolaması kapalı — mesaj kaydedilemiyor. Gizli kipteysen kapatıp yeniden dene.');
          return;
        }
        var t = metin.value.trim();
        if (!t && !bekleyen) return;
        var m = API.gonder(slug, t, bekleyen);
        if (!m) { uyar('Mesaj kaydedilemedi.'); return; }
        uyar('');
        metin.value = ''; buyut();
        bekleyen = null; if (dosya) dosya.value = ''; ekBas();
        if (typeof sonra === 'function') sonra(m);
      });
    }
  };

  kok.FIT_MESAJ = API;

  /* =====================================================================
     YÜZEN DÜĞME + PANEL
     ---------------------------------------------------------------------
     Yalnız giriş yapmış üyede basılır (`body.is-auth`). `mesajlarim-v1`
     sayfasında basılmaz: zaten oradasın, kendi üstünde açan bir panel
     gürültüdür.
     ===================================================================== */

  /* Kendi stilini kendi getirir — kabuğa satır eklemeden çalışsın diye.
     Yol, bu betiğin kendi `src`inden türetilir (alt klasörde de çalışır). */
  (function stilYukle() {
    try {
      var bu = document.currentScript;
      var yol = bu && bu.src ? bu.src.replace(/\/js\/fit-mesaj\.js.*$/, '/css/fit-mesaj.css')
                             : 'assets/css/fit-mesaj.css';
      var var_ = Array.prototype.some.call(document.querySelectorAll('link[rel="stylesheet"]'), function (l) {
        return (l.getAttribute('href') || '').indexOf('fit-mesaj.css') > -1;
      });
      if (var_) return;
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = yol;
      document.head.appendChild(l);
    } catch (e) {}
  })();

  function kur() {
    var b = document.body;
    if (!b) return;
    if (b.getAttribute('data-fit-page') === 'mesajlarim-v1') return;   /* zaten oradayız */
    if (!b.classList.contains('is-auth')) return;                      /* yalnız üyeye */
    if (document.getElementById('msjFab')) return;                     /* bir kez */

    var secili = null;

    /* ---- yüzen düğme ---------------------------------------------- */
    var fab = document.createElement('button');
    fab.id = 'msjFab';
    fab.type = 'button';
    fab.className = 'msj-fab';
    b.appendChild(fab);

    /* ---- panel ----------------------------------------------------- */
    var ortu = document.createElement('div');
    ortu.className = 'msj-ortu';
    ortu.id = 'msjOrtu';
    b.appendChild(ortu);

    var panel = document.createElement('aside');
    panel.className = 'msj-panel';
    panel.id = 'msjPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Antrenör sohbeti');
    panel.innerHTML =
      /* WhatsApp deseni: başlık panelin adını değil KONUŞULAN KİŞİYİ taşır.
         İçerik `basBas()` ile seçime göre yenilenir. */
      '<div class="msj-bas">' +
        '<span class="msj-mono buyuk" id="msjBasAva" aria-hidden="true"></span>' +
        '<div class="msj-bas-id">' +
          '<h2 id="msjBasAd">Antrenör sohbeti</h2>' +
          '<p class="msj-bas-alt" id="msjBasAlt"></p>' +
        '</div>' +
        '<a class="msj-tumu" href="mesajlarim-v1.html" id="msjTumu" ' +
          'aria-label="Tüm mesajları aç" title="Tümünü gör">' +
          '<i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>' +
        '<button class="msj-kapat" type="button" id="msjKapat" aria-label="Sohbeti kapat">' +
          '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
      '</div>' +
      '<div class="msj-kisiler" id="msjKisiler" role="group" aria-label="Antrenörlerin" hidden></div>' +
      '<div class="hr-note">' +
        '<i class="fa-solid fa-flask" aria-hidden="true"></i>' +
        '<p><b>Bu ekran maket: mesajın kaydedilir ama antrenöre iletilmez.</b> ' +
        'Yazdığın tarayıcında durur; karşı taraftan yanıt gelmez, örnek yazışma açılış içeriğidir.</p>' +
      '</div>' +
      '<div class="msj-akis" id="msjAkis" tabindex="0" aria-live="polite" aria-label="Mesaj akışı"></div>' +
      API.yazHtml('msjP');
    b.appendChild(panel);

    var avaEl     = panel.querySelector('#msjBasAva');
    var adEl      = panel.querySelector('#msjBasAd');
    var altEl     = panel.querySelector('#msjBasAlt');
    var kisilerEl = panel.querySelector('#msjKisiler');
    var akisEl    = panel.querySelector('#msjAkis');
    var kapatBtn  = panel.querySelector('#msjKapat');
    var yazEl     = panel.querySelector('.msj-yaz');

    /* ---- basma ----------------------------------------------------- */
    /* Düğme İKİ AYRI KALEM: randevusu varsa sohbet açan <button>, yoksa
       antrenör listesine giden <a>. Aynı düğmeye "sohbet" yazıp boş panel
       açtırmak yalan olurdu; etiket de hedef de değişiyor, o yüzden eleman
       da değişiyor. Yeniden basımda tür değişmediyse dokunulmaz. */
    function fabTur(bosMu) {
      var istenen = bosMu ? 'A' : 'BUTTON';
      if (fab && fab.tagName === istenen) return fab;
      var yeni = document.createElement(bosMu ? 'a' : 'button');
      yeni.id = 'msjFab';
      yeni.className = 'msj-fab' + (bosMu ? ' is-bos' : '');
      if (bosMu) yeni.href = 'antrenorler-v1.html'; else yeni.type = 'button';
      if (fab && fab.parentNode) fab.parentNode.replaceChild(yeni, fab);
      else b.appendChild(yeni);
      fab = yeni;
      return fab;
    }

    function fabBas() {
      var liste = API.antrenorler();
      if (!liste.length) {
        fabTur(true).innerHTML =
          '<i class="fa-solid fa-user-tie" aria-hidden="true"></i>' +
          '<span>Henüz antrenörün yok — antrenörlere göz at</span>';
        return;
      }
      fabTur(false);
      var n = API.okunmamis();
      fab.innerHTML =
        '<i class="fa-solid fa-comment-dots" aria-hidden="true"></i>' +
        '<span class="msj-fab-rozet"' + (n ? '' : ' hidden') + '>' + (n > 99 ? '99+' : n) + '</span>';
      fab.setAttribute('aria-label',
        n ? 'Antrenör sohbeti — ' + n + ' okunmamış mesaj' : 'Antrenör sohbeti');
      fab.setAttribute('aria-expanded', panel.classList.contains('acik') ? 'true' : 'false');
    }

    /* ---- BAŞLIK = KİMLİK -------------------------------------------
       Monogram + ad + randevu satırı. Ad randevu kaydından BİREBİR gelir;
       kısaltılmaz, güzelleştirilmez. Randevu yoksa başlık kişi taklidi
       yapmaz, panelin kendi adını söyler.
       BALONLARDA AVATAR YOK — bilerek: bu bir BİREBİR yazışma, grup değil.
       WhatsApp da gönderen avatarını yalnız grup sohbetinde basar. 420px
       panelde her gelen balona 28px'lik bir avatar kolonu koymak metin
       ölçüsünü kısaltır ve aynı monogramı N kez tekrarlardı; kimliği
       başlık taşıyor, balonu hiza + renk ayırıyor. */
    function basBas() {
      var a = API.antrenorler().filter(function (x) { return x.slug === secili; })[0];
      if (!a) {
        avaEl.hidden = true;
        adEl.textContent  = 'Antrenör sohbeti';
        altEl.textContent = 'Randevu aldığın antrenör yok.';
        altEl.removeAttribute('title');
        panel.setAttribute('aria-label', 'Antrenör sohbeti');
        return;
      }
      avaEl.hidden = false;
      avaEl.className   = 'msj-mono buyuk ' + API.durumRozet(a.durum);
      avaEl.textContent = monogram(a.antrenor);
      adEl.textContent  = a.antrenor;
      var alt = [API.durumEtiket(a.durum), a.hizmet,
                 [a.tarih, a.saat].filter(Boolean).join(' ')]
                .filter(Boolean).join(' · ');
      altEl.textContent = alt;
      altEl.setAttribute('title', alt);          /* kırpılan hâlin tamamı */
      panel.setAttribute('aria-label', a.antrenor + ' ile sohbet');
    }

    function kisilerBas() {
      var liste = API.antrenorler();
      if (secili && !liste.some(function (a) { return a.slug === secili; })) secili = null;
      if (!secili && liste.length) secili = liste[0].slug;

      /* Tek antrenörde seçici basılmaz — bir kalemlik seçim seçim değildir. */
      if (liste.length < 2) { kisilerEl.hidden = true; kisilerEl.innerHTML = ''; return; }
      kisilerEl.hidden = false;
      kisilerEl.innerHTML = liste.map(function (a) {
        var on = a.slug === secili, n = API.okunmamisSayi(a.slug);
        return '<button class="msj-kisi" type="button" data-slug="' + esc(a.slug) + '" ' +
               'aria-pressed="' + (on ? 'true' : 'false') + '" ' +
               'title="' + esc(a.antrenor + ' · ' + API.durumEtiket(a.durum)) + '">' +
                 '<span class="msj-mono ' + esc(API.durumRozet(a.durum)) + '" aria-hidden="true">' +
                   esc(monogram(a.antrenor)) + '</span>' +
                 '<span>' + esc(a.antrenor) + '</span>' +
                 '<span class="msj-nokta"' + (n ? '' : ' hidden') + '></span>' +
               '</button>';
      }).join('');
    }

    function akisBas() {
      var liste = API.antrenorler();
      if (!liste.length) { akisEl.innerHTML = ''; return; }
      if (!secili) secili = liste[0].slug;
      var kayit = liste.filter(function (a) { return a.slug === secili; })[0];
      var m = API.mesajlar(secili);

      if (!m.length) {
        akisEl.innerHTML =
          '<div class="fp-card fpx-bos">' +
            '<span class="pe-ico"><i class="fa-solid fa-comment-dots" aria-hidden="true"></i></span>' +
            '<h4>' + esc(kayit ? kayit.antrenor : 'Antrenörün') + ' ile ilk mesaj sende</h4>' +
            '<p>Randevundan önce sormak istediğini buraya yaz. Maket ekranda mesajın kaydedilir, karşı tarafa iletilmez.</p>' +
          '</div>';
      } else {
        akisEl.innerHTML = API.akisHtml(m);
      }
      akisEl.scrollTop = akisEl.scrollHeight;
    }

    function tazele() { fabBas(); kisilerBas(); basBas(); akisBas(); }

    /* ---- aç / kapa -------------------------------------------------- */
    var oncekiOdak = null;

    function ac() {
      if (!API.antrenorler().length) return;
      oncekiOdak = document.activeElement;
      kisilerBas(); basBas(); akisBas();
      ortu.classList.add('acik');
      panel.classList.add('acik');
      fab.setAttribute('aria-expanded', 'true');
      if (secili) API.okunduIsaretle(secili);
      fabBas();
      var alan = panel.querySelector('#msjPMetin');
      if (alan) alan.focus();
    }

    function kapat() {
      ortu.classList.remove('acik');
      panel.classList.remove('acik');
      fab.setAttribute('aria-expanded', 'false');
      if (oncekiOdak && oncekiOdak.focus) oncekiOdak.focus();
    }

    b.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('#msjFab');
      if (!t) return;
      if (t.tagName === 'A') return;              /* randevusuz: bağlantı gibi davransın */
      e.preventDefault();
      panel.classList.contains('acik') ? kapat() : ac();
    });
    kapatBtn.addEventListener('click', kapat);
    ortu.addEventListener('click', kapat);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('acik')) kapat();
    });

    kisilerEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-slug]'); if (!btn) return;
      secili = btn.getAttribute('data-slug');
      API.okunduIsaretle(secili);
      tazele();
    });

    API.yazBagla(yazEl, 'msjP', function () { return secili; }, function () { akisBas(); fabBas(); });

    /* ---- ÇEREZ ŞERİDİ NÖBETİ ---------------------------------------
       Kabuğun kanonik kuralı: "ekranda en fazla 1 sabit alt şerit. Çerez
       onayı (geçici, öncelikli) açıkken global bottom-nav gizlenir."
       (fit-shell.js · "MOBİL ALT KATMAN YÖNETİCİSİ")
       ÖLÇÜLDÜ: çerez şeridi ilk ziyarette @1024 ve @768'de sohbet
       düğmesinin üstüne biniyor (@1440'ta binmiyor — şerit 1180px ve
       ortalı, düğme onun sağında kalıyor). Kabuk kendi `.to-top`unu
       `--bc-lift` ile yukarı kaldırıyor ama o pay 92px tabana göre
       hesaplanmış; 22px tabana uygulanınca düğme şeridin İÇİNE düşüyor
       (ölçüldü: @768 → 81..137, şerit 24..139).
       Bu yüzden ikinci bir sihirli sayı üretilmedi: kural uygulandı.
       Şerit gerçekten kesişiyorsa düğme çekilir, onay verilince döner. */
    (function cerezNobeti() {
      var serit = document.getElementById('cookieBanner');
      if (!serit) return;
      function guncelle() {
        var acik = serit.classList.contains('show') && serit.getClientRects().length > 0;
        var kesis = false;
        if (acik && fab && fab.getClientRects().length) {
          var s = serit.getBoundingClientRect(), f = fab.getBoundingClientRect();
          kesis = !(s.right <= f.left || f.right <= s.left || s.bottom <= f.top || f.bottom <= s.top);
        }
        /* Kesişmeyi ölçmek için düğmenin GÖRÜNÜR olması gerekiyor; bir kez
           gizlendikten sonra şerit kapanana kadar gizli kalır. */
        if (kesis) fab.classList.add('msj-cerez');
        else if (!acik) fab.classList.remove('msj-cerez');
      }
      try {
        new MutationObserver(guncelle).observe(serit, { attributes: true, attributeFilter: ['class'] });
      } catch (e) {}
      kok.addEventListener('resize', guncelle);
      /* şerit 700ms gecikmeli açılıyor — kabuğun kendi `lift()`i de aynı
         iki zamanlayıcıyı kullanıyor */
      setTimeout(guncelle, 60); setTimeout(guncelle, 800);
      guncelle();
    })();

    /* dış değişiklikler: randevu alındı, başka sekmede yazıldı, depo temizlendi
       ⚠ AKIŞ DA YENİLENİR. Önceden burada yalnız `fabBas(); kisilerBas();`
       vardı: form üzerinden yazınca akış `yazBagla`nın `sonra()` geri
       çağrısıyla boyanıyordu ama `FIT_MESAJ.gonder(...)` DOĞRUDAN
       çağrılınca (konsol, başka bir modül, ileride antrenör paneli) mesaj
       depoya giriyor, liste önizlemesi değişiyor, AÇIK AKIŞ ise yenilemeye
       kadar eski kalıyordu. Ölçüldü ve kapatıldı: tek yazma yolu değil,
       tek OLAY yolu var. */
    kok.addEventListener('fit-mesaj-degisti', function () { fabBas(); kisilerBas(); basBas(); akisBas(); });
    document.addEventListener('fit:state', tazele);
    kok.addEventListener('storage', function (e) {
      if (e && (e.key === ANAHTAR || e.key === 'dm_fit')) tazele();
    });

    tazele();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();

})(window);
