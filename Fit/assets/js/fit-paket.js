/* =====================================================================
 FIT_PAKET — KADEME ⇄ ÖZELLİK EŞLEMESİNİN TEK KAYNAĞI
 ---------------------------------------------------------------------
 🔴 MİMARİ ŞART (Beyar, 2026-08-29): kademe–özellik eşlemesi TEK BİR
 YERDE durur. Bu dosya o yerdir. Kademe kartları da, karşılaştırma
 tablosu da, ödeme ekranının plan özeti de AYNI diziden üretilir;
 hiçbir ekran kendi listesini elle yazmaz.

 NEDEN VERİ, NEDEN METİN DEĞİL: ileride admin panelden yönetilecek —
 modüller listelenecek, her modülün yanında kademe seçimi olacak.
 O gün bu dosyanın yerini bir API cevabı alır ve EKRANLAR DEĞİŞMEZ,
 çünkü ekranlar `GRUPLAR`ı okuyor, HTML'e gömülü satırları değil.

 🔴 K6 GERİ ALINDI (Beyar, 2026-08-29). "Fit'te abonelik yoktur" kararı
 kalktı; ÜÇ kademe var: Ücretsiz · Pro · Pro Max.
 ⚠ Eski "Pro Max AI" adı KALKTI. Paket adında "AI" geçmez.
 ⚠ KARARLAR.md'nin yapay zekâ asistanı yasağı YERİNDE: burada bir AI
   ÖZELLİĞİ değil, bir paket satırının ADI yazılıdır ("yapay zekâ
   destekli program üretimi"). Bu turda hiçbir AI ekranı yazılmadı.

 VERİ SÖZLEŞMESİ
   KADEMELER[]  → {key, ad, ikon, ozet, fiyat, fiyatMetin, one,
                   yonelme, belirtme, tamlayan}
     Üç ek alan TÜRKÇE ÇEKİMDİR, süs değil: "Pro'a Yükselt" ve "Pro'in
     tamamı" yanlış yazımdır. Ekler ada bağlıdır ve ad TEK YERDE durduğu
     için çekimi de burada durur — her ekran kendi eklemesini uydurmasın.
       yonelme  → "Pro'ya"    (… Yükselt / … Düş)
       belirtme → "Pro'yu"    (… Seç)
       tamlayan → "Pro'nun"   (… tamamı)
     fiyat/fiyatMetin `null` ise ekran SAYI BASMAZ, "Fiyat onay
     bekliyor" yazar. 🔴 K13: para değerleri koda gömülü metin değildir,
     alandır — panelden gelecek. Pro Max'in fiyatı Beyar tarafından
     verilmedi, bu yüzden UYDURULMADI, null bırakıldı.

   GRUPLAR[]    → {ad, ikon, moduller:[{ad, nitelik?, k:{...}}]}
     `k` her kademe için bir hücre değeri taşır:
        true    → var        (tabloda ✓)
        false   → yok        (tabloda ✗)
        "metin" → kapsam     (tabloda metnin kendisi: "Temel", "Sınırsız")
     `nitelik:true` → satır bir AVANTAJ değil bir NİTELİKTİR (ör.
     "Reklam var"). Kartlarda yeşil onay yerine nötr nokta basılır;
     "reklamlı" bir kazanım gibi görünmesin diye.

 İÇERİK KAYNAĞI: kademe kalemlerini Beyar birebir yazdı (2026-08-29).
 Buraya satır EKLENMEDİ, uydurulmadı; yalnız modül satırlarına ayrıldı
 ve kademe sütunlarına dağıtıldı. "Pro = Ücretsizin tamamı + …" kuralı
 verinin kendisinde durur: taşınan kalem üç sütunda da AYNI değeri
 taşır, o yüzden kartlardaki "yenilikler" listesi FARKTAN hesaplanır
 (bkz. `yenilikler()`), elle ikinci bir liste yazılmaz.
 ===================================================================== */
window.FIT_PAKET = (function () {
  'use strict';

  var KADEMELER = [
    {
      key: 'ucretsiz', ad: 'Ücretsiz', ikon: 'fa-solid fa-user', kart: 't0',
      yonelme: "Ücretsiz'e", belirtme: "Ücretsiz'i", tamlayan: "Ücretsiz'in",
      ozet: 'Hareket etmeye bugün başlamak için yeterli. Süresi dolmaz, tahsilat alınmaz.',
      fiyat: 0, fiyatMetin: '₺0', birim: '/ ay'
    },
    {
      key: 'pro', ad: 'Pro', ikon: 'fa-solid fa-bolt', kart: 't2', one: true,
      yonelme: "Pro'ya", belirtme: "Pro'yu", tamlayan: "Pro'nun",
      ozet: 'Program, ölçüm ve antrenör katmanının tamamı — düzenli çalışan biri için.',
      fiyat: 99, fiyatMetin: '₺99', birim: '/ ay'
    },
    {
      key: 'promax', ad: 'Pro Max', ikon: 'fa-solid fa-gem', kart: 't3',
      yonelme: "Pro Max'e", belirtme: "Pro Max'i", tamlayan: "Pro Max'in",
      ozet: "Pro'nun tamamı, üstüne yapay zekâ destekli program üretimi ve sınırsız antrenör iletişimi.",
      fiyat: null, fiyatMetin: null, birim: '/ ay'
    }
  ];

  var GRUPLAR = [
    {
      ad: 'Egzersiz kütüphanesi', ikon: 'fa-solid fa-person-running',
      moduller: [
        { ad: 'Egzersiz kapsamı',
          k: { ucretsiz: '25 temel egzersiz', pro: 'Orta ve ileri seviye dâhil', promax: 'Orta ve ileri seviye dâhil' } },
        { ad: 'Görsel ve adım adım anlatım',
          k: { ucretsiz: true, pro: true, promax: true } },
        { ad: 'Kas grubu, ekipman ve seviye filtresi',
          k: { ucretsiz: true, pro: true, promax: true } },
        { ad: 'Video serileri',
          k: { ucretsiz: false, pro: 'Tümü', promax: 'Tümü' } }
      ]
    },
    {
      ad: 'Programlar', ikon: 'fa-solid fa-dumbbell',
      moduller: [
        { ad: 'Yeni Başlayanlar 4 Haftalık Program',
          k: { ucretsiz: true, pro: true, promax: true } },
        { ad: 'Çok haftalık programların tamamı',
          k: { ucretsiz: false, pro: true, promax: true } },
        { ad: 'Güç, HIIT, mobilite, esneklik, postür ve ofis programları',
          k: { ucretsiz: false, pro: true, promax: true } },
        { ad: 'Antrenman Oluşturucu',
          k: { ucretsiz: false, pro: 'Kural tabanlı', promax: 'Yapay zekâ destekli' } },
        { ad: 'Ekipman ve gün sayısına göre program üretme',
          k: { ucretsiz: false, pro: true, promax: true } },
        { ad: 'Kişiye özel haftalık uyarlama',
          k: { ucretsiz: false, pro: false, promax: true } },
        { ad: 'Antrenman takvimi ve hatırlatmalar',
          k: { ucretsiz: false, pro: true, promax: true } }
      ]
    },
    {
      ad: 'Enerji Defteri ve challenge', ikon: 'fa-solid fa-bolt',
      moduller: [
        { ad: 'Enerji Defteri',
          k: { ucretsiz: 'Temel', pro: 'Temel', promax: 'Temel' } },
        { ad: 'Günlük alınan ve harcanan enerji',
          k: { ucretsiz: true, pro: true, promax: true } },
        { ad: 'TDEE hesaplama',
          k: { ucretsiz: true, pro: true, promax: true } },
        { ad: 'Gastro tarif bağlantıları',
          k: { ucretsiz: true, pro: true, promax: true } },
        { ad: '30 Günlük Challenge',
          k: { ucretsiz: 'Aylık', pro: 'Aylık', promax: 'Aylık' } },
        { ad: 'Rozetler ve challenge kapsamı',
          k: { ucretsiz: 'Temel', pro: 'Gelişmiş', promax: 'Gelişmiş' } }
      ]
    },
    {
      ad: 'Hedef, ilerleme ve ölçüm', ikon: 'fa-solid fa-chart-line',
      moduller: [
        { ad: 'Aktif hedef',
          k: { ucretsiz: '1 hedef', pro: '1 hedef', promax: '1 hedef' } },
        { ad: 'Geçmiş kaydı',
          k: { ucretsiz: 'Son 7 gün', pro: 'Sınırsız', promax: 'Sınırsız' } },
        { ad: 'İlerleme takibi',
          k: { ucretsiz: 'Temel', pro: 'Gelişmiş', promax: 'Gelişmiş' } },
        { ad: 'Kilo, ölçü, tekrar ve performans takibi',
          k: { ucretsiz: false, pro: true, promax: true } },
        { ad: 'Haftalık ve aylık grafikler',
          k: { ucretsiz: false, pro: true, promax: true } }
      ]
    },
    {
      ad: 'Antrenör', ikon: 'fa-solid fa-user-tie',
      moduller: [
        { ad: 'Antrenör profillerini inceleme',
          k: { ucretsiz: true, pro: true, promax: true } },
        { ad: 'Antrenör randevusu',
          k: { ucretsiz: false, pro: true, promax: 'Öncelikli' } },
        { ad: 'Antrenörle mesajlaşma',
          k: { ucretsiz: false, pro: true, promax: 'Sınırsız' } },
        { ad: 'Antrenöre gönderilebilir gelişim raporu',
          k: { ucretsiz: false, pro: true, promax: true } }
      ]
    },
    {
      ad: 'Bağlantılar', ikon: 'fa-solid fa-arrows-rotate',
      moduller: [
        { ad: 'Diet ve Gastro senkronizasyonu',
          k: { ucretsiz: false, pro: true, promax: true } },
        { ad: 'Sağlık uygulaması entegrasyonu',
          k: { ucretsiz: false, pro: true, promax: true } }
      ]
    },
    {
      ad: 'Deneyim ve destek', ikon: 'fa-solid fa-headset',
      moduller: [
        { ad: 'Reklam', nitelik: true,
          k: { ucretsiz: 'Reklam var', pro: 'Reklamsız', promax: 'Reklamsız' } },
        { ad: 'Destek',
          k: { ucretsiz: 'Standart', pro: 'Öncelikli', promax: 'Öncelikli' } }
      ]
    }
  ];

  /* Abonelikten AYRI duran para ilişkisi (K4 · P5). Ekranlarda tek
     kaynaktan basılır ki üç sayfada üç farklı cümle olmasın. */
  var AYRI_UCRET = 'Antrenör görüşmeleri ve birebir seans ücretleri aboneliğe dâhil değildir; bedeli antrenöre ayrı ödersin. Abonelik yalnız randevu ve mesajlaşma yolunu açar, seans bedelini kapsamaz.';

  /* --------------------------------------------------------------- */
  function kademe(key) {
    for (var i = 0; i < KADEMELER.length; i++) if (KADEMELER[i].key === key) return KADEMELER[i];
    return null;
  }
  function sira(key) {
    for (var i = 0; i < KADEMELER.length; i++) if (KADEMELER[i].key === key) return i;
    return -1;
  }

  /* ---------------------------------------------------------------
     AKTİF KADEME — kullanıcının GERÇEK paketi. TEK OKUYUCU.
     ---------------------------------------------------------------
     🔴 NEDEN BURADA: `paketlerim-v1.html` ve `odemelerim-v1.html`
     kademeyi yalnız `?paket=` sorgu parametresinden okuyor ve parametre
     yokken **'pro'** varsayıyordu. Ölçüldü: `dm_user.paket` boşken de,
     `pro_max` iken de iki ekran "Pro" diyordu — ücretsiz üye kendini
     Pro sanıyor, Pro Max üyeye Pro satılmaya çalışılıyordu. Kabuk
     (`fit-shell.js`) ve `hesabim-v1.html` aynı anda doğru kaynaktan
     okuyordu; ayrışan bu ikisiydi.

     KAYNAK YENİ DEĞİL: doğru okuyan yüzeylerin zaten kullandığı
     `localStorage.dm_user.paket`. Oraya yalnız `pro-odeme-v1.html`
     yazar. Burada yeni bir depo AÇILMADI, yalnız o kaynağın okunması
     tek yere alındı.

     İKİ YAZIM VAR VE İKİSİ DE GERÇEK: depo anahtarı `pro_max` (alt
     çizgili — `pro-odeme-v1.html:927` onu yazıyor, `fit-shell.js:1657`
     ve `hesabim-v1.html:2192` onu okuyor), katalog anahtarı `promax`
     (çizgisiz). Eşleme burada, tek yerde.

     `?paket=` MAKET PERSONA anahtarıdır (`hesabim-v1.html`in deyimiyle
     aynı): ekranın hangi kullanıcıyı çizdiği URL'de görünsün diye
     GÖSTERİMİ değiştirir. Kaydı yazmaz, kalıcı değildir — parametre
     düşünce ekran gerçek kademeye döner.

     Paketsizin doğru kademesi **Ücretsiz**'dir; 'pro' varsaymak
     kullanıcıya sahip olmadığı bir paketi göstermekti.
     --------------------------------------------------------------- */
  var DEPO_ESLEME = { ucretsiz: 'ucretsiz', pro: 'pro', pro_max: 'promax', promax: 'promax' };

  function aktifKademe(gosterim) {
    var g = DEPO_ESLEME[gosterim] || gosterim;
    if (g && kademe(g)) return g;                    /* maket persona anahtarı */
    var p = null;
    try { p = (JSON.parse(localStorage.getItem('dm_user') || 'null') || {}).paket || null; }
    catch (e) { p = null; }
    var key = DEPO_ESLEME[p];
    return (key && kademe(key)) ? key : 'ucretsiz';
  }
  function tumModuller() {
    var out = [];
    GRUPLAR.forEach(function (g) { g.moduller.forEach(function (m) { out.push(m); }); });
    return out;
  }
  function dolu(v) { return v !== false && v !== null && v !== undefined && v !== ''; }

  /* Kademede AÇIK olan her satır. Kart listesi ve sayaç bundan okur. */
  function ozellikler(key) {
    return tumModuller().filter(function (m) { return dolu(m.k[key]); });
  }

  /* Bir alt kademeye GÖRE yeni olan satırlar. "Pro = Ücretsizin
     tamamı + …" cümlesi böylece ikinci kez elle yazılmaz: fark
     hesaplanır. İlk kademede fark yoktur, tüm açık satırlar döner. */
  function yenilikler(key) {
    var i = sira(key);
    if (i <= 0) return ozellikler(key);
    var alt = KADEMELER[i - 1].key;
    return tumModuller().filter(function (m) {
      return dolu(m.k[key]) && m.k[key] !== m.k[alt];
    });
  }

  /* Kademede KAPALI olan satırlar — ücretsiz kartında "neyi kaçırıyorsun"
     bölümü bunu kullanır. Kapı gösterirken yalan söylememek için. */
  function kapalilar(key) {
    return tumModuller().filter(function (m) { return !dolu(m.k[key]); });
  }

  function fiyatMetni(key) {
    var t = kademe(key);
    if (!t) return '';
    return t.fiyatMetin === null ? 'Fiyat onay bekliyor' : t.fiyatMetin;
  }

  /* Satırın kademedeki okunur karşılığı: "Antrenman Oluşturucu —
     Kural tabanlı" / "Video serileri — Tümü" / "TDEE hesaplama". */
  function etiket(m, key) {
    var v = m.k[key];
    return (v === true) ? m.ad : m.ad + ' — ' + v;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ===== KARŞILAŞTIRMA TABLOSU ==================================== */
  function hucre(v) {
    if (v === true)  return '<i class="fa-solid fa-check yes" aria-hidden="true"></i><span class="sr-only">var</span>';
    if (!dolu(v))    return '<i class="fa-solid fa-xmark nope" aria-hidden="true"></i><span class="sr-only">yok</span>';
    return esc(v);
  }

  function tabloBas(el, opts) {
    if (!el) return;
    opts = opts || {};
    var vurgu = opts.vurgu || 'pro';           /* öne çıkan sütun */
    var h = '<table class="cmp-table"><caption class="sr-only">Ücretsiz, Pro ve Pro Max kademelerinin özellik karşılaştırması</caption><thead><tr>' +
            '<th scope="col">Özellik</th>';
    KADEMELER.forEach(function (t) {
      h += '<th scope="col"' + (t.key === vurgu ? ' class="col-pop"' : '') + '>' +
           '<span class="ch-name"><i class="' + t.ikon + '" aria-hidden="true"></i> ' + esc(t.ad) + '</span>' +
           '<span class="ch-price">' + esc(fiyatMetni(t.key)) + (t.fiyatMetin === null ? '' : ' ' + esc(t.birim)) + '</span>' +
           '</th>';
    });
    h += '</tr></thead><tbody>';
    GRUPLAR.forEach(function (g) {
      h += '<tr class="cmp-group"><th colspan="' + (KADEMELER.length + 1) + '" scope="colgroup">' +
           '<i class="' + g.ikon + '" aria-hidden="true"></i> ' + esc(g.ad) + '</th></tr>';
      g.moduller.forEach(function (m) {
        h += '<tr><th scope="row">' + esc(m.ad) + '</th>';
        KADEMELER.forEach(function (t) {
          h += '<td' + (t.key === vurgu ? ' class="col-pop"' : '') + '>' + hucre(m.k[t.key]) + '</td>';
        });
        h += '</tr>';
      });
    });
    h += '</tbody></table>';
    el.innerHTML = h;
  }

  /* ===== KADEME KARTLARI ========================================== */
  /* opts.aktif   → hangi kademedeyiz (kartın düğmesi "Mevcut paketin" olur)
     opts.eylem   → (kademe) => {etiket, href, sinif, kapali} — sayfa karar verir */
  function kartlarBas(el, opts) {
    if (!el) return;
    opts = opts || {};
    var aktif = opts.aktif || null;
    var h = '';
    KADEMELER.forEach(function (t, i) {
      var yeni = yenilikler(t.key);
      var kapali = kapalilar(t.key);
      var altAd = i > 0 ? KADEMELER[i - 1].tamlayan : null;   /* "Pro'nun tamamı" */
      var eylem = opts.eylem ? opts.eylem(t) : null;

      h += '<div class="pro-card ' + t.kart + (t.one ? ' featured' : '') + (t.key === aktif ? ' is-aktif' : '') + '">';
      if (t.key === aktif)      h += '<span class="pro-flag pf-now"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Mevcut paketin</span>';
      else if (t.one)           h += '<span class="pro-flag">En popüler</span>';
      h += '<div class="pro-tier"><i class="' + t.ikon + '" aria-hidden="true"></i><b>' + esc(t.ad) + '</b></div>';
      h += '<p class="pro-desc">' + esc(t.ozet) + '</p>';

      h += '<div class="pro-price">';
      if (t.fiyatMetin === null) {
        h += '<b aria-hidden="true">&mdash;</b><span>' + esc(fiyatMetni(t.key)) + '</span>';
      } else {
        h += '<b>' + esc(t.fiyatMetin) + '</b><span>' + esc(t.birim) + '</span>';
        /* ₺0'a "fiyat onay bekliyor" ROZETİ BASILMAZ: ücretsizin onaylanacak
           bir tutarı yok, rozet orada gürültü olur. Rozet yalnız gerçekten
           onay bekleyen ücretli tutarda durur. */
        if (t.fiyat) h += '<span class="price-flag"><i class="fa-solid fa-clock" aria-hidden="true"></i> Fiyat onay bekliyor</span>';
      }
      h += '</div>';

      /* KART EN FAZLA `KART_LIMIT` KALEM GÖSTERİR. Sebebi ölçüldü: Pro'nun
         farkı 23 satır, Pro Max'inki 4 — sınırsız listede kartlar üç farklı
         boyda oluyor ve düğmeler üç ayrı yükseklikte kalıyordu. Kesilen
         kalem KAYBOLMUYOR: hemen altında "ve N özellik daha" satırı
         karşılaştırma tablosuna gidiyor, tablo da AYNI veriden basılıyor.
         (Kartlar ayrıca `align-items:stretch` ile eşit boyda; düğmeler tek
         çizgide.) */
      var KART_LIMIT = 8;
      var gosterilen = yeni.slice(0, KART_LIMIT);
      var gizli = yeni.length - gosterilen.length;

      h += '<ul class="pro-feats">';
      if (altAd) h += '<li><i class="fa-solid fa-check" aria-hidden="true"></i> <b>' + esc(altAd) + ' tamamı</b></li>';
      gosterilen.forEach(function (m) {
        var ik = m.nitelik ? 'fa-solid fa-circle-dot' : 'fa-solid fa-check';
        h += '<li' + (m.nitelik ? ' class="nitelik"' : '') + '><i class="' + ik + '" aria-hidden="true"></i> ' + esc(etiket(m, t.key)) + '</li>';
      });
      h += '</ul>';
      if (gizli > 0) {
        h += '<a class="pro-daha" href="#karsilastir">ve ' + gizli + ' özellik daha ' +
             '<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>';
      }

      if (kapali.length) {
        h += '<details class="pro-kapali"><summary>' + kapali.length + ' özellik bu kademede kapalı</summary><ul class="pro-feats">';
        kapali.forEach(function (m) {
          h += '<li class="no"><i class="fa-solid fa-xmark" aria-hidden="true"></i> ' + esc(m.ad) + '</li>';
        });
        h += '</ul></details>';
      }

      if (eylem) {
        h += eylem.kapali
          ? '<button class="btn ' + (eylem.sinif || 'btn-ghost') + '" type="button" disabled>' + esc(eylem.etiket) + '</button>'
          : '<a class="btn ' + (eylem.sinif || 'btn-primary') + '" href="' + esc(eylem.href) + '">' + esc(eylem.etiket) + '</a>';
      }
      h += '</div>';
    });
    el.innerHTML = h;
  }

  return {
    kademeler: KADEMELER,
    gruplar: GRUPLAR,
    ayriUcret: AYRI_UCRET,
    kademe: kademe,
    aktifKademe: aktifKademe,
    sira: sira,
    ozellikler: ozellikler,
    yenilikler: yenilikler,
    kapalilar: kapalilar,
    fiyatMetni: fiyatMetni,
    etiket: etiket,
    tabloBas: tabloBas,
    kartlarBas: kartlarBas
  };
})();
