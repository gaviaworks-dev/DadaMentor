/* =====================================================================
 FIT_REKLAM — REKLAM ENVANTERİNİN TEK KAYNAĞI
 ---------------------------------------------------------------------
 🔴 NEDEN VAR: ölçüldü (`docs/gastro-olcum/fit-yonetilmeyenler.md` C-7)
 ki yönetim panelindeki ALAN ile satış sayfasındaki FORMAT aynı şey
 değil. `admin-reklam-v1.html` on alan kodu tutuyordu, `reklam-ver-v1.html`
 sekiz format satıyordu, **kesişimleri sıfırdı**. Üç ekran (liste + alan
 formu + kampanya formu) aynı envanteri okuyacaksa envanterin tek bir
 yeri olmalı; yoksa dördüncü bir dil daha doğardı.

 İKİ TARAF DA DEPODAN OKUNDU, HİÇBİRİ UYDURULMADI:
   · SATILAN (8) — `reklam-ver-v1.html`, `data-placement` taşıyan
     `.yer-card` düğümleri. Ad, konum ve ölçü metni o kartların
     `<h4>` · `.yer-loc` · `.yer-fmt` alanlarından birebir alındı.
   · ALAN (10) — `admin-reklam-v1.html`in R16/4 turunda kurduğu alan
     tablosu. Hedef sayfalar bu depoda gerçekten duran dosyalar.

 EŞLEME BİR VERİDİR, BİR YORUM DEĞİL. Her satılan format hangi alan(lar)a
 düşüyor, `esles` alanında yazılıdır ve üç hâl vardır:
   `tam`    → sayfa VE konum birebir tutuyor
   `kismi`  → sayfa tutuyor, konum ya da ölçü tutmuyor (`catisma` yazılı)
   `yok`    → o formatın düşeceği hiçbir alan envanterde yok
 Eşleşmeyen format SESSİZCE UYDURULMADI: ekran onu uyarı şeridiyle ve
 `stop` rozetiyle gösterir. Envanter sözleşmesi ancak `yok` ve `kismi`
 satırları bittiğinde birleşmiş sayılır.
 ===================================================================== */
window.FIT_REKLAM = (function () {
  'use strict';

  /* ---- SATILAN FORMATLAR — reklam-ver-v1.html'den okundu ---------- */
  var FORMAT = [
    { kod:'masthead',         ad:'Masthead',                    asama:'Keşif',
      olcu:'970×250',         olcuAlt:'320×100 mobil',
      konum:'Ana sayfa · header altı',                          tip:'gorsel' },
    { kod:'leaderboard',      ad:'Leaderboard',                 asama:'Keşif',
      olcu:'728×90',          olcuAlt:'Hedef bazlı',
      konum:'Egzersizler ve program listesi · içerik üstü',     tip:'gorsel' },
    { kod:'native-liste',     ad:'Native / Liste Arası Kart',   asama:'Keşif',
      olcu:'İçerik formatı',  olcuAlt:'“Sponsorlu” etiketli',
      konum:'Program listesi · ızgara arası 6. kart',           tip:'native' },
    { kod:'mpu',              ad:'MPU / Kare',                  asama:'Niyet',
      olcu:'300×250',         olcuAlt:'Sticky · bağlamsal',
      konum:'Egzersiz detay · ekipman ve set takibi yanı',      tip:'gorsel' },
    { kod:'niyet-native',     ad:'Niyet-Bazlı Native',          asama:'Niyet',
      olcu:'İçerik formatı',  olcuAlt:'Performans',
      konum:'“Bana Uygun Başlangıcı Bul” sihirbazı sonucu',     tip:'native' },
    { kod:'mobil-sticky',     ad:'Mobil Sticky',                asama:'Bağlılık',
      olcu:'320×100',         olcuAlt:'Tüm mobil · kapatılabilir',
      konum:'Tüm sayfalar · mobil alt kenar',                   tip:'gorsel' },
    { kod:'challenge-native', ad:'Sponsorlu Challenge',         asama:'Bağlılık',
      olcu:'İçerik formatı',  olcuAlt:'Katılım bazlı',
      konum:'Challenge Merkezi · katılım kartı',                tip:'native' },
    { kod:'half-page',        ad:'Half Page',                   asama:'Bağlılık',
      olcu:'300×600',         olcuAlt:'Sticky yan sütun',
      konum:'Hareket rehberi · sözlük · doğru form',            tip:'gorsel' }
  ];

  /* ---- ENVANTERDEKİ ALANLAR — admin-reklam'ın R16/4 tablosu ------- */
  var ALAN = [
    { kod:'hub-ust',       ad:'Ana sayfa üst şerit',      sayfa:'dadafit-hub-v1.html',        konum:'Hero altı',              olcu:'1240×160', tip:'gorsel', sira:1,  durum:'aktif', kampanya:2, doluluk:88 },
    { kod:'hub-orta',      ad:'Ana sayfa orta kutu',      sayfa:'dadafit-hub-v1.html',        konum:'Programlar bölümü altı', olcu:'620×320',  tip:'gorsel', sira:2,  durum:'aktif', kampanya:1, doluluk:64 },
    { kod:'kutuphane-yan', ad:'Kütüphane yan kolon',      sayfa:'egzersiz-kutuphane-v1.html', konum:'Süzgeç altı',            olcu:'300×600',  tip:'gorsel', sira:3,  durum:'aktif', kampanya:1, doluluk:41 },
    { kod:'program-liste', ad:'Program listesi arası',    sayfa:'program-liste-v1.html',      konum:'6. karttan sonra',       olcu:'1240×120', tip:'gorsel', sira:4,  durum:'aktif', kampanya:1, doluluk:33 },
    { kod:'egzersiz-alt',  ad:'Hareket detayı alt şerit', sayfa:'egzersiz-detay-v1.html',     konum:'Alternatifler altı',     olcu:'860×140',  tip:'gorsel', sira:5,  durum:'bos',   kampanya:0, doluluk:0 },
    { kod:'challenge-ust', ad:'Challenge merkezi üstü',   sayfa:'challenge-merkezi-v1.html',  konum:'Banner altı',            olcu:'1240×160', tip:'gorsel', sira:6,  durum:'aktif', kampanya:1, doluluk:57 },
    { kod:'antrenor-yan',  ad:'Antrenör dizini yan kutu', sayfa:'antrenorler-v1.html',        konum:'Kart ızgarası yanı',     olcu:'300×250',  tip:'gorsel', sira:7,  durum:'durdu', kampanya:0, doluluk:0 },
    { kod:'sozluk-alt',    ad:'Sözlük alt şerit',         sayfa:'sozluk-v1.html',             konum:'Sayfa sonu',             olcu:'860×120',  tip:'gorsel', sira:8,  durum:'aktif', kampanya:1, doluluk:22 },
    { kod:'defter-video',  ad:'Enerji defteri video',     sayfa:'fit-egzersizlerim.html',      konum:'Haftalık özet üstü',     olcu:'620×350',  tip:'video',  sira:9,  durum:'aktif', kampanya:1, doluluk:70 },
    { kod:'hub-sponsor',   ad:'Ana sayfa sponsor şeridi', sayfa:'dadafit-hub-v1.html',        konum:'Footer üstü',            olcu:'1240×90',  tip:'logo',   sira:10, durum:'aktif', kampanya:3, doluluk:96 }
  ];

  /* ---- EŞLEME — format → alan(lar). Her satır bir ÖLÇÜM sonucudur. */
  var ESLEME = [
    { format:'masthead',         alan:['hub-ust'],       hal:'kismi',
      catisma:'Sayfa aynı, ölçü değil: satılan 970×250, envanterdeki alan 1240×160. ' +
              'Mobil karşılık (320×100) envanterde hiç yok.' },
    { format:'leaderboard',      alan:[],                hal:'yok',
      catisma:'Liste sayfalarında “içerik üstü” bir şerit alanı yok. Kütüphanedeki alan ' +
              'yan kolon (kutuphane-yan), program listesindeki ise ızgara arası (program-liste).' },
    { format:'native-liste',     alan:['program-liste'], hal:'tam',
      catisma:'Konum birebir (“ızgara arası 6. kart”). Tip çelişkili: satılan bir native ' +
              'kart, envanterdeki alan 1240×120 şerit olarak tanımlı.' },
    { format:'mpu',              alan:[],                hal:'yok',
      catisma:'Egzersiz detay sayfasında alan var (egzersiz-alt) ama o alt şerit; ' +
              'satılan MPU ekipman/set takibi yanında sticky bir yan sütun.' },
    { format:'niyet-native',     alan:[],                hal:'yok',
      catisma:'“Bana Uygun Başlangıcı Bul” sonucu sayfasında hiç reklam alanı tanımlı değil.' },
    { format:'mobil-sticky',     alan:[],                hal:'yok',
      catisma:'Envanterde sayfaya değil GÖVDEYE bağlı (global) bir alan kavramı yok; ' +
              'mobil alt kenar yuvası hiç açılmamış.' },
    { format:'challenge-native', alan:['challenge-ust'], hal:'kismi',
      catisma:'Sayfa aynı, konum ve tip değil: satılan katılım kartının içine giren bir ' +
              'native, envanterdeki alan banner altı 1240×160 şerit.' },
    { format:'half-page',        alan:['kutuphane-yan'], hal:'kismi',
      catisma:'Ölçü birebir (300×600) ama sayfa listesi tutmuyor: satış rehber ve sözlük ' +
              'sayfalarını vaat ediyor, envanterdeki tek 300×600 alan egzersiz kütüphanesinde. ' +
              'Sözlükteki alan (sozluk-alt) 860×120 alt şerit.' }
  ];

  function formatBul(kod){
    for (var i = 0; i < FORMAT.length; i++) if (FORMAT[i].kod === kod) return FORMAT[i];
    return null;
  }
  function alanBul(kod){
    for (var i = 0; i < ALAN.length; i++) if (ALAN[i].kod === kod) return ALAN[i];
    return null;
  }
  function eslemeBul(formatKod){
    for (var i = 0; i < ESLEME.length; i++) if (ESLEME[i].format === formatKod) return ESLEME[i];
    return null;
  }
  /* Bir alanın hangi satılan formatları taşıdığı — eşleme dizisinden
     TÜRETİLİR, ikinci bir tablo tutulmaz. */
  function alaninFormatlari(alanKod){
    return ESLEME.filter(function (e) { return e.alan.indexOf(alanKod) >= 0; })
                 .map(function (e) { return e.format; });
  }
  function ozet(){
    var t = { tam:0, kismi:0, yok:0 };
    ESLEME.forEach(function (e) { t[e.hal]++; });
    t.satilmayanAlan = ALAN.filter(function (a) { return !alaninFormatlari(a.kod).length; }).length;
    return t;
  }

  return {
    FORMAT: FORMAT, ALAN: ALAN, ESLEME: ESLEME,
    formatBul: formatBul, alanBul: alanBul, eslemeBul: eslemeBul,
    alaninFormatlari: alaninFormatlari, ozet: ozet
  };
})();
