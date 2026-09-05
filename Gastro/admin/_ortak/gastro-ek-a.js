/* GASTRO MARKA EKİ · kulvar a — kit'e (kanon/admin-kit.js) TAŞINACAK.
   ŞERH: Bu dosya Gastro'ya özel davranış içindir. Kit SALT OKUMA olduğu için
   burada yaşıyor; her kural docs/admin-kit-oneri-gastro-2-a.md'de "KÖ-A<n>"
   olarak kayıtlıdır. Kit'e taşındığında bu dosyadaki karşılığı SİLİNİR.
   Yükleme sırası: kanon/admin-kit.js'ten SONRA. */

/* ═══════════════════════════════════════════════════════════════════════
   KÖ-A1 · ÇOKLU GÖRSEL GALERİSİ — `[data-galeri]`
   ───────────────────────────────────────────────────────────────────────
   Kitin `§6 · görsel girdisi`i TEK görsel içindir: `.form-gorsel` bir
   kırpma sahnesi kurar ve ikinci bir dosyayı kabul etmez. Public tarif
   sayfası ise galeriyi `rd-gallery` + `data-gallery="[…]"` ile basar —
   yani veri modeli bir DİZİ.
   🔴 ÖLÇÜLDÜ (480 public tarif sayfası): 480'inin 480'i **bir** görsel
      taşıyor, çoklu galeri bugün hiçbir tarifte dolu değil. Alan yine de
      dizi olarak kurulur; public bileşen diziyi bekliyor ve tek görselli
      hâl o dizinin özel durumu.
   ⚠ Gerçek yükleme YOK (maket) — toast bunu YAZAR (§10'un kuralı).
   ⚠ Sıralama tutamağı kartın KENDİSİ değil: kartı `draggable` yapmak
     içindeki metin seçimini öldürürdü (L10'un aynı dersi) — burada kartın
     içinde metin yok, o yüzden kartın kendisi sürüklenir ve SİL düğmesi
     `draggable=false` ile ayrılır.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function ek(etiket, sinif) {
    var e = document.createElement(etiket);
    if (sinif) e.className = sinif;
    return e;
  }
  function toast(m) { if (window.DM_TOAST) window.DM_TOAST(m); }

  function galeriDeger(kap) {
    return [].map.call(kap.querySelectorAll('[data-rol="galeri-izgara"] .g-kart'),
      function (k) { return k.getAttribute('data-ad'); });
  }

  function galeriYaz(kap) {
    var g = kap.querySelector('[data-rol="galeri-deger"]');
    var liste = galeriDeger(kap);
    if (g) g.value = liste.join(',');
    var sayac = document.querySelector('[data-rol="galeri-sayac"]');
    if (sayac) sayac.textContent = liste.length + ' görsel';
    /* Kapak = ilk kart. Rozet yalnız birinci karta yazılır. */
    [].forEach.call(kap.querySelectorAll('.g-kart'), function (k, i) {
      var r = k.querySelector('.g-kapak-rozet');
      if (r) r.hidden = i !== 0;
    });
    kap.classList.toggle('dolu', liste.length > 0);
  }

  function galeriKart(kap, ad, url) {
    var k = ek('div', 'g-kart');
    k.setAttribute('data-ad', ad);
    k.setAttribute('draggable', 'true');
    var g = ek('span', 'g-kart-gorsel');
    if (url) g.style.backgroundImage = 'url("' + url + '")';
    k.appendChild(g);
    var rozet = ek('span', 'g-kapak-rozet');
    rozet.textContent = 'Kapak';
    rozet.hidden = true;
    k.appendChild(rozet);
    var ad2 = ek('small', 'g-kart-ad');
    ad2.textContent = ad;
    k.appendChild(ad2);
    var sil = document.createElement('button');
    sil.type = 'button';
    sil.className = 'ikon-dugme g-kart-sil';
    sil.setAttribute('draggable', 'false');
    sil.setAttribute('aria-label', ad + ' görselini kaldır');
    sil.setAttribute('data-ipucu', ad + ' görselini kaldır');
    sil.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    k.appendChild(sil);
    kap.querySelector('[data-rol="galeri-izgara"]').appendChild(k);
  }

  function galeriKur(kap) {
    if (kap.getAttribute('data-galeri-kuruldu') === '1') return;
    kap.setAttribute('data-galeri-kuruldu', '1');
    var dosya = kap.querySelector('input[type=file]');
    var birak = kap.querySelector('.birak-alani');
    if (!kap.querySelector('[data-rol="galeri-izgara"]')) {
      var iz = ek('div', 'g-izgara');
      iz.setAttribute('data-rol', 'galeri-izgara');
      kap.appendChild(iz);
    }
    if (birak && dosya) {
      birak.addEventListener('click', function () { dosya.click(); });
      birak.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dosya.click(); }
      });
      ['dragover', 'dragenter'].forEach(function (t) {
        birak.addEventListener(t, function (e) { e.preventDefault(); birak.classList.add('uzerinde'); });
      });
      ['dragleave', 'drop'].forEach(function (t) {
        birak.addEventListener(t, function () { birak.classList.remove('uzerinde'); });
      });
      birak.addEventListener('drop', function (e) {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.files) galeriEkle(kap, e.dataTransfer.files);
      });
    }
    if (dosya) dosya.addEventListener('change', function () { galeriEkle(kap, dosya.files); dosya.value = ''; });
    galeriYaz(kap);
  }

  function galeriEkle(kap, dosyalar) {
    if (!dosyalar || !dosyalar.length) return;
    var n = 0;
    [].forEach.call(dosyalar, function (d) {
      if (!/^image\//.test(d.type)) return;
      galeriKart(kap, d.name, URL.createObjectURL(d));
      n++;
    });
    galeriYaz(kap);
    if (n) toast(n + ' görsel eklendi — bu bir makettir, sunucuya hiçbir şey gönderilmedi.');
  }

  /* Sil — onay YOK: eklenmiş bir görseli kaldırmak geri alınabilir bir
     iştir (yeniden seçilir); L10'un "boş satırda onay sorulmaz" dersinin
     aynısı. Silinen kapaksa kapak rozeti bir sonrakine geçer. */
  document.addEventListener('click', function (e) {
    var s = e.target.closest && e.target.closest('.g-kart-sil');
    if (!s) return;
    e.preventDefault();
    var kap = s.closest('[data-galeri]');
    var kart = s.closest('.g-kart');
    var ad = kart.getAttribute('data-ad');
    kart.remove();
    galeriYaz(kap);
    toast('“' + ad + '” galeriden kaldırıldı.');
  });

  var surukKart = null;
  document.addEventListener('dragstart', function (e) {
    var k = e.target.closest && e.target.closest('.g-kart');
    if (!k) return;
    surukKart = k;
    k.classList.add('surukleniyor');
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  });
  document.addEventListener('dragend', function () {
    if (surukKart) { surukKart.classList.remove('surukleniyor'); surukKart = null; }
  });
  document.addEventListener('dragover', function (e) {
    if (!surukKart) return;
    var uzeri = e.target.closest && e.target.closest('.g-kart');
    if (!uzeri || uzeri === surukKart) return;
    if (uzeri.parentNode !== surukKart.parentNode) return;
    e.preventDefault();
    var kutu = uzeri.getBoundingClientRect();
    var sonra = (e.clientX - kutu.left) > kutu.width / 2;
    uzeri.parentNode.insertBefore(surukKart, sonra ? uzeri.nextSibling : uzeri);
  });
  document.addEventListener('drop', function (e) {
    if (!surukKart) return;
    if (!e.target.closest || !e.target.closest('[data-galeri]')) return;
    e.preventDefault();
    galeriYaz(surukKart.closest('[data-galeri]'));
  });

  /* ═════════════════════════════════════════════════════════════════
     KÖ-A2 · ADIM GÖRSELİ — `[data-adim-gorsel]`
     Public adım kartı kendi görselini taşır (`sc-figs > step-img`);
     ÖLÇÜLDÜ: 480 tarifin 6'sında dolu, 1.938 adım `step-card no-img`.
     Görsel bu yüzden GALERİDE değil SATIRDA yaşar — adımın kendi alanı.
     ═════════════════════════════════════════════════════════════════ */
  function adimGorselYaz(kap, ad, url) {
    var gizli = kap.querySelector('[data-field="gorsel"]');
    var on = kap.querySelector('[data-rol="adim-onizleme"]');
    if (gizli) gizli.value = ad || '';
    if (!on) return;
    on.innerHTML = '';
    on.hidden = !ad;
    if (!ad) return;
    var g = ek('span', 'g-adim-kucuk');
    if (url) g.style.backgroundImage = 'url("' + url + '")';
    on.appendChild(g);
    var t = ek('small', null);
    t.textContent = ad;
    on.appendChild(t);
    var sil = document.createElement('button');
    sil.type = 'button';
    sil.className = 'ikon-dugme g-adim-sil';
    sil.setAttribute('aria-label', 'Adım görselini kaldır');
    sil.setAttribute('data-ipucu', 'Adım görselini kaldır');
    sil.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    on.appendChild(sil);
  }

  document.addEventListener('click', function (e) {
    var d = e.target.closest && e.target.closest('[data-eylem="adim-gorsel"]');
    if (d) {
      e.preventDefault();
      var kap = d.closest('[data-adim-gorsel]');
      var f = kap && kap.querySelector('input[type=file]');
      if (f) f.click();
      return;
    }
    var s = e.target.closest && e.target.closest('.g-adim-sil');
    if (s) {
      e.preventDefault();
      adimGorselYaz(s.closest('[data-adim-gorsel]'), '', '');
      toast('Adım görseli kaldırıldı.');
    }
  });
  document.addEventListener('change', function (e) {
    var f = e.target;
    if (!f.matches || !f.matches('[data-adim-gorsel] input[type=file]')) return;
    var d = f.files && f.files[0];
    if (!d) return;
    adimGorselYaz(f.closest('[data-adim-gorsel]'), d.name, URL.createObjectURL(d));
    toast('Adım görseli seçildi — maket, sunucuya hiçbir şey gönderilmedi.');
  });

  /* ═════════════════════════════════════════════════════════════════
     KÖ-A3 · L7 · ÖZELLİK ROZETİ MALZEMEDEN TÜRETİLİR
     ─────────────────────────────────────────────────────────────────
     İki BİLDİRİLMİŞ kaynak, sıfır uydurma:
       1 · malzemenin SINIFI → sayfaya gömülü `[data-malzeme-sinif]`
           bloğu, public Mutfak Ansiklopedisi'nin `data-cat`inin kopyası
           (26 kategori · 1.200 madde)
       2 · rozetin ANLAMI    → "Yumurta İçermez" = yumurta sınıfı yok
     Kural 480 public tarif sayfasında SINANDI: public'in bastığı 430
     rozette ÇELİŞKİ 0; kural "hayır" da diyor (Vegan 275/480 engelli),
     yani "hepsine evet" diyen bir kural değil.
     🔴 Sözcük SINIRINDA eşleşir ve sözlüğün TAMAMINA bakılır — iki
        sahte çelişki tam buradan doğmuştu: "barbunya fasulyesi" içinde
        balık maddesi "barbun", "hurma şurubu" yerine kısa "hurma".
     ═════════════════════════════════════════════════════════════════ */
  var TURETME = null;
  function turetmeVeri() {
    if (TURETME !== null) return TURETME;
    var d = document.querySelector('[data-malzeme-sinif]');
    if (!d) return (TURETME = false);
    try {
      var v = JSON.parse(d.textContent);
      v.harita = {};
      v.anahtar = [];
      v.s.forEach(function (satir) {
        var i = satir.lastIndexOf('|');
        var ad = satir.slice(0, i);
        v.harita[ad] = v.sinif[+satir.slice(i + 1)];
        v.anahtar.push(ad);
      });
      v.anahtar.sort(function (a, b) { return b.length - a.length; });
      v.desen = {};
      v.anahtar.forEach(function (a) {
        v.desen[a] = new RegExp('(^|[^a-zçğıöşü0-9])' +
          a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-zçğıöşü0-9]|$)');
      });
      return (TURETME = v);
    } catch (h) { return (TURETME = false); }
  }

  function normal(x) {
    return (x || '').toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9 ]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  function rozetTuret() {
    var alan = document.querySelector('[data-hesaplanan][name="ozellik_turetilen"]');
    if (!alan) return;
    var v = turetmeVeri();
    if (!v) return;
    var adlar = [].map.call(document.querySelectorAll('[name="malzeme_ad[]"]'),
      function (g) { return g.value; }).filter(function (x) { return (x || '').trim(); });
    var siniflar = {};
    adlar.forEach(function (ad) {
      var n = normal(ad);
      for (var i = 0; i < v.anahtar.length; i++) {
        var a = v.anahtar[i];
        if (v.desen[a].test(n)) { siniflar[v.harita[a]] = 1; break; }
      }
    });
    /* 🔴 MALZEME YOKKEN ROZET BASILMAZ. "Malzemesi olmayan tarif her
       rozeti hak eder" mantıken doğru ama ekranda YALAN: yönetici daha
       hiçbir şey yazmadan sekiz rozet görürdü. Özne yoksa çıktı da yok. */
    var cikti = [];
    if (adlar.length) {
      Object.keys(v.yasak).forEach(function (rozet) {
        var yasak = v.yasak[rozet];
        var engelli = false;
        for (var i = 0; i < yasak.length; i++) if (siniflar[yasak[i]]) { engelli = true; break; }
        if (!engelli) cikti.push(rozet);
      });
    }
    alan.value = cikti.join(' · ');
    alan.setAttribute('data-turetilen', cikti.join(','));
  }
  window.DM_GASTRO_ROZET_TURET = rozetTuret;

  document.addEventListener('input', function (e) {
    if (e.target.matches && e.target.matches('[name="malzeme_ad[]"]')) rozetTuret();
  });
  document.addEventListener('change', function (e) {
    if (e.target.matches && e.target.matches('[name="malzeme_ad[]"]')) rozetTuret();
  });
  /* Satır eklenip silindiğinde de tazelenir (L10 kitin işi, sonuç bizim). */
  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    if (e.target.closest('[data-eylem="satir-ekle"], [data-islem="sil"], .tekrar-sil'))
      setTimeout(rozetTuret, 60);
  });

  /* ═════════════════════════════════════════════════════════════════
     KÖ-A4 · `.coklu-secim` ZORUNLULUK DENETİMİ
     ─────────────────────────────────────────────────────────────────
     🔴 KİT AÇIĞI, ÖLÇÜLEREK BULUNDU. `admin-kit.js`in doğrulaması
        `.alan .alan-girdi, .alan .alan-secim, .alan .alan-metin`
        üzerinde koşuyor. `.coklu-secim`in değer kutusu `type=hidden` ve
        bu sınıfların HİÇBİRİNİ taşımıyor; arama kutusu `.acilir-arama`.
        Yani zorunlu bir `<select>` aranabilir açılıra çevrildiğinde
        "zorunlu" denetimi SESSİZCE düşüyor — markup yıldızı basıyor,
        kaydet hiçbir şey demiyor.
     ⚠ Gizli kutuya `.alan-girdi` sınıfı VERİLMEDİ: o sınıf kitte
       `display:block; width:100%` taşıyor ve `input[type=hidden]`ı
       GÖRÜNÜR yapardı. Kusuru düzeltirken ikincisini doğurmak.
     Kanca ada değil BİLDİRİME bakar: `data-zorunlu` taşıyan kap.
     ═════════════════════════════════════════════════════════════════ */
  function cokluDenetle(kap) {
    var alan = kap.closest('.alan');
    if (!alan) return true;
    var g = kap.querySelector('input[data-cs]');
    var dolu = g && (g.value || '').trim();
    var ara = kap.querySelector('.acilir-arama');
    if (dolu) {
      if (window.DM_HATA_SIL) window.DM_HATA_SIL(alan);
      if (ara) { ara.removeAttribute('aria-invalid'); ara.removeAttribute('aria-describedby'); }
      return true;
    }
    if (window.DM_HATA_YAZ) window.DM_HATA_YAZ(alan, 'Bu alan zorunlu.');
    /* ⚠ `hataYaz` ARIA'yı `.alan-girdi/.alan-secim/.alan-metin`e yazar;
       `.coklu-secim`de öyle bir eleman yok, o yüzden burada ARIA'yı
       arama kutusuna biz bağlıyoruz — bildirilmiş ama sürülmeyen ARIA,
       hiç bildirilmemişten kötüdür (§4'ün "üç ad" dersi). */
    var kutu = alan.querySelector('.alan-hata');
    if (ara && kutu) {
      ara.setAttribute('aria-invalid', 'true');
      if (kutu.id) ara.setAttribute('aria-describedby', kutu.id);
    }
    return false;
  }

  document.addEventListener('click', function (e) {
    var d = e.target.closest && e.target.closest('[data-eylem]');
    if (!d) return;
    var eylem = d.getAttribute('data-eylem');
    if (['kaydet', 'yayinla', 'taslak'].indexOf(eylem) === -1) return;
    var form = d.closest('form') || document;
    var ilk = null;
    form.querySelectorAll('.coklu-secim[data-zorunlu]').forEach(function (k) {
      if (!cokluDenetle(k) && !ilk) ilk = k;
    });
    if (ilk) {
      var a = ilk.querySelector('.acilir-arama');
      if (a) a.focus();
    }
  }, true);

  /* 🔴 TIKLANAN KALEM OLAYIN İÇİNDE ZATEN KOPMUŞ OLUYOR — ölçüldü.
     Kitin `[data-cs-deger]` dinleyicisi BİZDEN ÖNCE kayıtlı (admin-kit.js
     daha önce yükleniyor); seçim yapılınca `csAc` açılır yüzeyi
     `innerHTML=''` ile yeniden çiziyor ve tıklanan düğme DOM'dan düşüyor.
     Bizim dinleyicimize sıra geldiğinde `e.target.closest(...)` **null**
     dönüyor — kap bulunamıyor, hata kutusu doldurulmuş alanda asılı
     kalıyordu (kapı: "DOLDURULDU, hata düşmedi"; PROBE: kap=false).
     Çözüm hedeften değil DURUMDAN gitmek: her tıktan sonra HATALI
     durumdaki zorunlu kaplar yeniden denetlenir. */
  function hataliKaplariTazele() {
    document.querySelectorAll('.coklu-secim[data-zorunlu]').forEach(function (k) {
      var a = k.closest('.alan');
      if (a && a.classList.contains('hatali')) cokluDenetle(k);
    });
  }
  document.addEventListener('click', function () { setTimeout(hataliKaplariTazele, 40); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') setTimeout(hataliKaplariTazele, 40);
  });

  /* ═════════════════════════════════════════════════════════════════
     KÖ-A9 · TEHLİKELİ BÖLGE — SİLİNECEK KAYDIN ADI KAYITTAN GELİR
     ─────────────────────────────────────────────────────────────────
     🔴 MARKA SIZINTISI. `admin-tarifler-form` silme düğmesi
        `data-yikici="Bulgar Split Squat"` taşıyordu — Gastro tarif
        formunda bir FIT hareketi. Parti 4 §0'ın dersi: kural marka
        bağımsızdır, VERİ değildir.

     ⚠ ÖLÇÜLDÜ: `data-yikici` ve `data-fiil` kitin HİÇBİR YERİNDE
       okunmuyor. `data-islem="sil"` dalı adı `data-ad`dan alıyor
       (`admin-kit.js:668`), `data-eylem="yikici"` dalı da `data-ad`dan
       (`:1778`). Yani sızıntı ÖLÜ MARKUP'taydı: kapı metni "Bulgar
       Split Squat" değil **"kayıt"** diyordu. Yanlış ad bugün
       görünmüyordu ama düğme `data-eylem="yikici"`ye çevrildiği anda
       canlanırdı. İkisi de markup'tan silindi.

     🔴 VE KAPI BUNU ÖLÇEMİYORDU: "Tehlikeli bölge" kartı markup'ta
        `hidden` ve HİÇBİR ŞEY onu açmıyordu — düzenleme kipinde bile
        kaydı silmenin yolu YOKTU. Ölçüm "⚪ özne yok" veriyordu; özne
        yoksa kapı susar, sıfır kusur kanıt değildir. Kart artık kipe
        bağlı: "yeni tarif"te kapalı, "düzenle"de açık.
     ⚠ Panel genelinde bu bildirim TUTARSIZ: 20 Gastro form ekranının
       9'unda kart HER ZAMAN gizli, 11'inde HER ZAMAN açık (yani yeni
       kayıt formunda da "Sil" duruyor). Kural kit'in işi → KÖ-A9.
     ═════════════════════════════════════════════════════════════════ */
  function tehlikeBolgesi() {
    var kaplar = document.querySelectorAll('[data-tehlike-bolgesi]');
    if (!kaplar.length) return;
    var q = new URLSearchParams(location.search);
    var adaylar = ['id', 'kas', 'c', 'slug', 'h', 'test', 'kod', 'kayit'];
    var anahtar = null;
    for (var i = 0; i < adaylar.length; i++) { var v = q.get(adaylar[i]); if (v) { anahtar = v; break; } }

    /* Oluştur kipi: silinecek kayıt YOK, kart kapalı kalır. */
    if (!anahtar) return;

    /* Ad kaydın kendi bildiriminden okunur; bildirilmemişse ANAHTAR
       yazılır. "Boş alandan kötüsü, emin bir başlık altında başka
       kaydın verisi" (§19) — sabit bir ada asla düşülmez. */
    var ad = anahtar;
    var kaynak = document.querySelector('[data-kayitlar]');
    if (kaynak) {
      try {
        var kayit = (JSON.parse(kaynak.textContent || '{}') || {})[anahtar];
        if (kayit && (kayit.ad || kayit.baslik || kayit.terim)) ad = kayit.ad || kayit.baslik || kayit.terim;
      } catch (h) { /* bildirilmemiş kayıt — anahtar kalır */ }
    }
    kaplar.forEach(function (k) {
      k.hidden = false;
      k.querySelectorAll('[data-islem="sil"], [data-eylem="sil"], [data-eylem="yikici"]').forEach(function (d) {
        d.setAttribute('data-ad', ad);
        /* Ölü ve marka sızdıran öznitelikler: kimse okumuyor, yanlış ad taşıyorlar. */
        d.removeAttribute('data-yikici');
        d.removeAttribute('data-fiil');
      });
    });
  }
  window.DM_GASTRO_TEHLIKE = tehlikeBolgesi;

  /* 🔴 GALERİ KARTININ TEK ÜRETİCİSİ BURASIDIR. P3-1 "Kütüphaneden seç"i
     galeride de gerçek yapıyor ve kart eklemesi gerekiyor; ikinci bir
     `galeriKart` yazmak İKİ SÜRÜCÜ demekti (KÖ-L2'nin pilot dersi). Kural
     burada kalır, dışarı yalnız KAPI verilir. */
  window.DM_GALERI_EKLE = function (kap, ad, url) {
    if (!kap || !ad) return false;
    galeriKart(kap, ad, url || '');
    galeriYaz(kap);
    return true;
  };

  /* ── KURULUM ────────────────────────────────────────────────────── */
  function kur() {
    document.querySelectorAll('[data-galeri]').forEach(galeriKur);
    tehlikeBolgesi();
    rozetTuret();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();
  /* Düzenleme kipinde kit alanları SONRA dolduruyor; rozet o doldurmanın
     ardından yeniden hesaplanmalı — yoksa "kayıt yüklendi, rozet boş". */
  window.addEventListener('load', function () { setTimeout(rozetTuret, 120); });
})();
