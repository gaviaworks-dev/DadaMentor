/* =====================================================================
   AJAN A · PARTİ 4 · A1 — `?duzenle=<slug>` DOLU FORM
   ---------------------------------------------------------------------
   Koştuğu yer: `tarif-ekle.html` · `puf-noktasi-ekle.html`
   BAĞI lead attı (L0); İÇERİĞİNİ yalnız ajan A yazar.
   KAYNAK BURASI: scripts/p4-varlik/dm-p4-a-duzenle.js — ağaca kopyalanır.

   NE YAPAR
     `?duzenle=<slug>` varsa AYNI kalıbı düzenleme kipine alır: başlık ve
     CTA metinleri "düzenle" diline döner (YAPI değişmez, yeni ekran
     açılmaz) ve form `g-defter-kayitlari.json`daki HASAT EDİLMİŞ veriyle
     doldurulur.

   🔴 VERİ UYDURULMAZ. Hasat edilemeyen alan BOŞ kalır ve ekranın
      üstündeki şerit hangi alanların gelmediğini ADIYLA sayar. Kaynağın
      değeri formun seçeneklerinden birine karşılık gelmiyorsa (örn.
      "Orta Bütçe (₺₺)" etiketi) alan İŞARETLENMEZ, o değer de şeritte
      "formda karşılığı yok" olarak yazılır.

   🔴 FETCH BAŞARISIZSA FORM ÖLMEZ. Alanlar çıplak kalır, şerit sebebi
      söyler, sayfanın kendi akışı çalışmaya devam eder.

   🔴 SAYFANIN KENDİ MEKANİZMASI KULLANILIR: malzeme satırı `[data-ek-
      msatir-ekle]`, grup `[data-ek-mgrup-ekle]`, adım `[data-ek-ekle=
      "paragraf"]` DÜĞMELERİNE TIKLANARAK doğar. Yeni akış icat edilmedi.

   🔴 BETİK SIRASI VARSAYILMAZ. `ekle.js` bu dosyadan ÖNCE koşuyor (ikisi
      de defer, belge sırası) ama alanları sonradan sıfırlayan bir
      başlatıcı olursa doldurma ezilirdi: doldurmadan önce formun hazır
      olması BEKLENİR ve doldurma sonrası değer DOĞRULANIR, tutmazsa bir
      kez daha yazılır.
   ===================================================================== */
(function () {
  'use strict';

  var q = new URLSearchParams(location.search);
  var SLUG = q.get('duzenle');
  if (!SLUG) return;                       /* ekleme kipi — hiç karışma */

  var form = document.querySelector('form[data-ek-form]');
  if (!form) return;
  var TIP = form.getAttribute('data-ek-form');       /* 'tarif' | 'puf' */
  var VERI_YOLU = 'varliklar/reference/shared/g-defter-kayitlari.json';

  var $  = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return [].slice.call((k || document).querySelectorAll(s)); };
  var met = function (s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); };
  /* eşleşme: büyük/küçük ve Türkçe harf farkını yutar, uydurmaz */
  var anahtar = function (s) {
    return met(s).toLocaleLowerCase('tr')
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '');
  };

  var TIPADI = TIP === 'puf' ? 'püf noktası' : 'tarif';
  var eksikler = [];                  /* kaynaktan gelmeyen alan adları */
  var karsiliksiz = [];               /* kaynakta VAR, formda seçenek YOK */

  /* ── 1 · DÜZENLEME DİLİ ────────────────────────────────────────────
     Metin değişir, YAPI değişmez: aynı kart, aynı adım şeridi, aynı
     düğmeler. `data-p4a-duzenle` bayrağı ölçüm için. */
  function diliCevir() {
    document.documentElement.setAttribute('data-p4a-duzenle', TIP);
    var h1 = $('.ek-tepe h1');
    if (h1) h1.textContent = TIP === 'puf' ? 'Püf noktasını düzenle' : 'Tarifi düzenle';
    var cur = $('.ek-tepe .kirinti .cur');
    if (cur) cur.textContent = TIP === 'puf' ? 'Püf Noktasını Düzenle' : 'Tarifi Düzenle';
    document.title = (TIP === 'puf' ? 'Püf Noktasını Düzenle' : 'Tarifi Düzenle') + ' — DadaGastro';
    var g = $('[data-ek-gonder]');
    if (g) {
      var i = g.querySelector('i');
      g.textContent = ' ' + (TIP === 'puf' ? 'Püf noktasını güncelle' : 'Tarifi güncelle');
      if (i) g.insertBefore(i, g.firstChild);
    }
    var t = $('[data-ek-taslak]');
    if (t) {
      var ti = t.querySelector('i');
      t.textContent = ' Değişikliği taslağa al';
      if (ti) t.insertBefore(ti, t.firstChild);
    }
    var geri = $('.ek-tepe .see-all');
    if (geri) geri.setAttribute('href', 'g-mutfak-defterim.html' +
      (TIP === 'puf' ? '#puf' : '#tariflerim'));
  }

  /* ── 2 · ŞERİT ─────────────────────────────────────────────────────
     Kanonun kendi `.bilgi-notu` bileşeni; yeni bileşen açılmadı. */
  function serit(kip, baslikMetin, cumleler) {
    var eski = $('[data-p4a-serit]');
    if (eski) eski.remove();
    var kap = $('.ek-govde .wrap.kap') || $('.ek-govde') || form;
    var n = document.createElement('div');
    n.className = 'bilgi-notu p4a-serit' + (kip === 'hata' ? ' p4a-serit-hata' : '');
    n.setAttribute('data-p4a-serit', kip);
    n.setAttribute('role', 'status');
    var ikon = document.createElement('i');
    ikon.className = 'fa-solid ' + (kip === 'hata' ? 'fa-triangle-exclamation' : 'fa-pen-to-square');
    ikon.setAttribute('aria-hidden', 'true');
    n.appendChild(ikon);
    var g = document.createElement('div');
    var p1 = document.createElement('p');
    var b = document.createElement('b'); b.textContent = baslikMetin;
    p1.appendChild(b);
    g.appendChild(p1);
    cumleler.forEach(function (c) {
      var p = document.createElement('p');
      p.className = 'p4a-serit-alt';
      p.textContent = c;
      g.appendChild(p);
    });
    n.appendChild(g);
    kap.insertBefore(n, kap.firstChild);
    return n;
  }

  /* ── 3 · ALAN YAZICILARI ───────────────────────────────────────────
     Her yazma sonrası `input`+`change` gönderilir: sayaçlar, "hazır"
     kartı ve görünürlük şeridi sayfanın KENDİ dinleyicileriyle tazelenir. */
  function ates(el) {
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function yaz(el, deger, ad) {
    if (!el) return false;
    if (deger == null || deger === '') { if (ad) eksikler.push(ad); return false; }
    el.value = String(deger);
    ates(el);
    return true;
  }
  /* select: değer formun KENDİ seçeneklerinden biriyse seçilir; değilse
     seçim yapılmaz ve değer "karşılıksız" diye bildirilir. */
  function sec(el, deger, ad) {
    if (!el) return false;
    if (deger == null || deger === '') { if (ad) eksikler.push(ad); return false; }
    var hedef = anahtar(deger), bulundu = null;
    $$('option', el).forEach(function (o) {
      if (!bulundu && o.value !== '' && anahtar(o.textContent) === hedef) bulundu = o;
    });
    if (!bulundu) { karsiliksiz.push(ad + ': “' + met(deger) + '”'); return false; }
    el.value = bulundu.value || bulundu.textContent.trim();
    ates(el);
    return true;
  }

  /* ── 4 · KAPAK GÖRSELİ ─────────────────────────────────────────────
     `ekle.js`in `gorselKur()`u IIFE içinde, dışarıdan çağrılamıyor;
     ürettiği DÜĞÜM birebir aynı yapıda kurulur (sınıf adları ve düğme
     nitelikleri kaynaktan kopyalandı) — böylece kapak/silme düğmeleri
     `ekle.js`in kendi belge düzeyindeki dinleyicisine düşer. */
  function kapakBas(url) {
    var izgara = $('[data-ek-gorseller="' + (TIP === 'puf' ? 'kapak' : 'tarif') + '"]');
    if (!izgara || !url) { if (!url) eksikler.push('kapak görseli'); return false; }
    var kutu = document.createElement('div');
    kutu.className = 'ek-gorsel ek-kapakli';
    kutu.setAttribute('data-p4a-mevcut', '1');
    var img = document.createElement('img');
    img.src = url; img.alt = 'Şu anki kapak görseli';
    kutu.appendChild(img);
    var muhur = document.createElement('span');
    muhur.className = 'ek-kapak-muhur';
    muhur.innerHTML = '<i class="fa-solid fa-star" aria-hidden="true"></i> Kapak';
    kutu.appendChild(muhur);
    var arac = document.createElement('span');
    arac.className = 'ek-gorsel-arac';
    arac.innerHTML =
      '<button type="button" data-ek-kapak title="Kapak yap" aria-label="Kapak görseli yap"><i class="fa-solid fa-star" aria-hidden="true"></i></button>' +
      '<button type="button" data-ek-gorsel-sil title="Görseli kaldır" aria-label="Görseli kaldır"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button>';
    kutu.appendChild(arac);
    izgara.appendChild(kutu);
    /* sayaç sayfanın kendi tazeleyicisinden geçsin */
    $$('[data-ek-sayac="gorsel"] b').forEach(function (b) {
      b.textContent = $$('[data-ek-gorseller] .ek-gorsel').length;
    });
    return true;
  }

  /* ── 5 · ETİKETLER (kanon K5 çoklu seçici) ─────────────────────────── */
  function etiketleriIsaretle(liste) {
    var yuzey = $('[data-ek-etiket-liste]');
    if (!yuzey) return;
    if (!liste || !liste.length) { eksikler.push('etiketler'); return; }
    var secenek = $$('[data-etiket]', yuzey);
    liste.forEach(function (e) {
      var h = anahtar(e), bul = null;
      secenek.forEach(function (o) {
        if (!bul && anahtar(o.getAttribute('data-etiket')) === h) bul = o;
      });
      if (bul) { if (bul.getAttribute('aria-selected') !== 'true') bul.click(); }
      else karsiliksiz.push('etiket: “' + met(e) + '”');
    });
  }

  /* ── 6 · MALZEME SATIRLARI ─────────────────────────────────────────── */
  function malzemeleriBas(liste) {
    var satirDugme = $('[data-ek-msatir-ekle]');
    var grupDugme  = $('[data-ek-mgrup-ekle]');
    var kap = $('[data-ek-malzemeler]');
    if (!kap || !satirDugme) return;
    if (!liste || !liste.length) { eksikler.push('malzemeler'); return; }
    var sonGrup = null, notluk = 0;
    liste.forEach(function (m) {
      if (m.grup && m.grup !== sonGrup && grupDugme) {
        sonGrup = m.grup;
        grupDugme.click();
        var g = kap.lastElementChild;
        var gi = g && g.querySelector('input[name="malzeme-grup"]');
        if (gi) { gi.value = m.grup; ates(gi); }
      }
      satirDugme.click();
      var s = kap.lastElementChild;
      if (!s) return;
      var mi = s.querySelector('.ek-miktar'), bi = s.querySelector('.ek-birim'),
          ai = s.querySelector('.ek-ad'),     ti = s.querySelector('.ek-alt');
      if (mi && m.miktar) { mi.value = m.miktar; ates(mi); }
      if (bi) {
        var h = anahtar(m.birimTam || m.birimMetin), bul = null;
        $$('option', bi).forEach(function (o) {
          if (!bul && o.value !== '' && anahtar(o.textContent) === h) bul = o;
        });
        /* "g" ↔ "Gram" · "kg" ↔ "Kilogram": kısaltma kaynağın kendi
           `data-u` niteliğinden gelir, uydurulmaz; ikisi de tutmazsa
           birim BOŞ kalır ve satır miktarını yine gösterir. */
        if (bul) { bi.value = bul.value || bul.textContent.trim(); ates(bi); }
        else if (m.birimMetin) karsiliksiz.push('birim: “' + met(m.birimMetin) + '”');
      }
      if (ai && m.ad) { ai.value = m.ad; ates(ai); }
      if (ti && m.alternatif) { ti.value = m.alternatif; ates(ti); }
      if (m.not) notluk++;
    });
    if (notluk) karsiliksiz.push(notluk + ' malzemenin açıklama notu (formda alan yok)');
  }

  /* ── 7 · HAZIRLANIŞ ADIMLARI ───────────────────────────────────────── */
  function adimlariBas(liste) {
    var ekle = $('[data-ek-ekle="paragraf"]');
    var kap = $('[data-ek-bloklar]');
    if (!kap || !ekle) return;
    if (!liste || !liste.length) { eksikler.push('hazırlanış adımları'); return; }
    var kayipBaslik = 0;
    liste.forEach(function (a) {
      ekle.click();
      var b = kap.lastElementChild;
      var ta = b && b.querySelector('textarea[name="blok-paragraf"]');
      if (ta && a.metin) { ta.value = a.metin; ates(ta); }
      if (a.baslik || a.sure) kayipBaslik++;
    });
    if (kayipBaslik) karsiliksiz.push(kayipBaslik +
      ' adımın başlığı ve süresi (paragraf bloğunda alan yok)');
  }

  /* ── 8 · PÜF METNİ (TinyMCE ya da çıplak textarea) ─────────────────── */
  function metniBas(html) {
    var ta = $('textarea[data-ek-metin-alan]');
    if (!ta) return;
    if (!html) { eksikler.push('metin'); return; }
    ta.value = html;
    ates(ta);
    /* Editör CDN'den geliyor ve GEÇ doğabilir: varsa şimdi, yoksa
       doğduğunda içerik verilir. Editör hiç gelmezse çıplak textarea
       zaten dolu — alan ÖLMEZ (kayıtlı ders: ağ yoksa çıplak çalışır). */
    var denendi = 0;
    (function bagla() {
      var ed = window.tinymce && window.tinymce.get && window.tinymce.get(ta.id);
      if (ed && ed.initialized) { try { ed.setContent(html); } catch (e) {} return; }
      if (++denendi > 40) return;                      /* ~8 sn sonra bırak */
      setTimeout(bagla, 200);
    })();
  }

  /* ── 9 · UYGULA ────────────────────────────────────────────────────── */
  function uygula(k) {
    if (TIP === 'tarif') {
      yaz($('#tfAd'), k.baslik, 'başlık');
      sec($('#tfKategori'), k.kategori, 'kategori');
      sec($('#tfMutfak'), k.mutfak, 'mutfak');
      etiketleriIsaretle(k.etiketler);
      yaz($('#tfHikaye'), k.ozet, 'hikâye/özet');
      kapakBas(k.kapak);
      yaz($('#tfPorsiyon'), k.porsiyon, 'porsiyon');
      yaz($('#tfHazirlik'), k.hazirlik, 'hazırlık süresi');
      yaz($('#tfPisirme'), k.pisirme, 'pişirme süresi');
      sec($('#tfZorluk'), k.zorluk, 'zorluk');
      yaz($('#tfDerece'), k.derece, 'pişirme derecesi');
      malzemeleriBas(k.malzeme);
      adimlariBas(k.adim);
    } else {
      yaz($('#pufBaslik'), k.baslik, 'başlık');
      sec($('#pufKategori'), k.kategori, 'kategori');
      yaz($('#pufEtiket'), (k.etiketler || [])[0], 'etiket');
      kapakBas(k.kapak);
      metniBas(k.metin);
    }
    /* Hasat kaydının kendi `eksik` listesi de eklenir — alan formda hiç
       yoksa yukarıdaki yazıcılar onu göremezdi. Alan adları Türkçeye
       çevrilir, aynı alan İKİ KEZ yazılmaz (ölçüldü: "pişirme derecesi"
       ile "derece" aynı alanın iki adıydı). */
    var AD = { baslik:'başlık', kategori:'kategori', ozet:'hikâye/özet', kapak:'kapak görseli',
               porsiyon:'porsiyon', hazirlik:'hazırlık süresi', pisirme:'pişirme süresi',
               zorluk:'zorluk', derece:'pişirme derecesi', mutfak:'mutfak',
               etiketler:'etiketler', malzeme:'malzemeler', adim:'hazırlanış adımları',
               metin:'metin' };
    (k.eksik || []).forEach(function (e) {
      var t = AD[e] || e;
      if (eksikler.indexOf(t) < 0) eksikler.push(t);
    });
  }

  /* Doldurma sonrası DOĞRULAMA: sayfanın kendi başlatıcısı alanı
     sıfırlarsa yakalanır ve bir kez daha yazılır. */
  function dogrula(k) {
    var ad = TIP === 'tarif' ? $('#tfAd') : $('#pufBaslik');
    if (ad && k.baslik && met(ad.value) !== met(k.baslik)) return false;
    return true;
  }

  function calis(k) {
    diliCevir();
    if (!k) {
      serit('hata', met(SLUG) + ' kaydı bulunamadı — form BOŞ açıldı.', [
        'Bu ' + TIPADI + ' defterindeki kayıtlarla eşleşmedi. Alanları elle doldurabilirsin; ' +
        'ekran düzenleme kipinde ama hiçbir alan kaynaktan gelmedi.'
      ]);
      return;
    }
    uygula(k);
    if (!dogrula(k)) { eksikler.length = 0; karsiliksiz.length = 0; uygula(k); }

    var cumle = [];
    cumle.push('Alanlar defterdeki kayıttan ve ' +
      (k.kaynakSayfa ? 'yayındaki ' + TIPADI + ' sayfasından' : 'yalnız defter kaydından') +
      ' dolduruldu. Bu bir makettir: “güncelle” dediğinde değişiklik hiçbir yere gönderilmez.');
    if (eksikler.length)
      cumle.push('Kaynakta bulunmadığı için BOŞ bırakılan alanlar: ' + eksikler.join(', ') + '.');
    if (karsiliksiz.length)
      cumle.push('Kaynakta olup bu formda karşılığı olmayanlar: ' + karsiliksiz.join(' · ') + '.');
    serit('bilgi', met(k.baslik || SLUG) + ' düzenleniyor', cumle);
  }

  /* ── 10 · VERİYİ AL ────────────────────────────────────────────────── */
  function baslat() {
    fetch(VERI_YOLU, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { calis((d && d.kayit) ? d.kayit[TIP + ':' + SLUG] : null); })
      .catch(function (e) {
        /* 🔴 FORM ÖLMEZ — dil düzenlemeye döner, alanlar çıplak kalır. */
        diliCevir();
        serit('hata', 'Kayıt okunamadı — form BOŞ açıldı.', [
          'Defter kayıtları dosyası alınamadı (' + e.message + '). Alanları elle ' +
          'doldurabilirsin; sayfanın kendi akışı çalışıyor.'
        ]);
      });
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', baslat);
  else baslat();
})();
