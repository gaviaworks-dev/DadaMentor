/* =====================================================================
   DD-SHELL.JS — DADADİET PUBLIC KABUK (paylaşılan)
   37 public Diet sayfasının ortak kabuğunu çalışma anında üretir ve
   davranışlarını bağlar. assets/js/sa-shell.js'in public kardeşi.

   Sayfa kendini <body data-*> ile tanıtır:
     data-nav            aktif üst nav kalemi. İA revizyonundan sonra dört
                         başlık var: araclar | beslenme | programlar |
                         diyetisyenler   (boş = hiçbiri aktif değil)
                         37 mevcut sayfa hâlâ eski altı değeri yazıyor;
                         NAVMAP bunları çalışma anında yeni başlığa çevirir,
                         böylece 37 dosyaya dokunulmadı.
     data-hero="1"       header hero üstünde şeffaf başlar (heroMode)
     data-nav-mark="drawer"
                         GEÇİCİ SADAKAT BAYRAĞI — sayfa bugün drawer kalemini
                         de active işaretliyor ve aria-current basıyorsa.
                         37 sayfanın 6'sında var, 31'inde yok; bottom-nav'da
                         hiçbirinde yok. Bu tutarsızlık ayırma turunda BİREBİR
                         korunuyor. Normalleştirme ayrı commit, ayrı onay.

   Sayfa iskeleti:
     <div id="ddChromeTop"></div>
     <script src="assets/js/dd-shell.js"></script>
     <main class="page-main" id="pageMain"> … </main>
     <div id="ddChromeBottom"></div>   (= gate + footer + fab, kanonik sıra)
     <script> … SAYFA JS … </script>

   Yerleştirme yer tutucuyu DEĞİŞTİRİR (outerHTML), sarmalayıcı bırakmaz —
   DOM ayırma öncesiyle birebir aynı kalır.

   ÇALIŞMA SIRASI (bugünkü gömülü sıra korunur):
     A) hemen: üst krom markup'ı → giriş durumu → SS paramları → heroMode
        (giriş durumu SAYFA JS'inden ÖNCE çalışmalı: body.is-auth)
     B) DOMContentLoaded: alt krom markup'ı → kabuk davranışları →
        alt katman yöneticisi → DadaMentor/reveal/scroll-top
        (alt katman yöneticisi window.__bottomStrips'i SAYFA JS'inden SONRA
         okumalı — bugünkü sözleşme)
   ===================================================================== */
(function(){

/* =====================================================================
   BAĞLANTI HARİTASI — kabuk hiçbir hedefi literal yazmaz.
   ✗ işaretliler bu repoda HENÜZ YOK; hedefleri değiştirmedik, yalnız tek
   yere topladık. Sayfa üretildiğinde / yolu değiştiğinde tek satır düzelir.
   ===================================================================== */
/* =====================================================================
   LARAVEL PORTU (2026-08-12) — bagli hedefler SUNUCUDAN gelir.
   ---------------------------------------------------------------------
   Prototipte bu harita statik .html dosya adlariydi. Full-stack surumde
   hedefler gercek route()'lardir ve sayfanin <head>'inde `window.DD_L`
   olarak basilir (resources/views/layouts/diet.blade.php). Asagidaki
   degerler YEDEKTIR: DD_L basilmamissa (ornegin prototipin kendisi
   dosyadan acildiginda) eski davranis birebir surer.

   `window.DD_SOON` ise "Yakinda" isaretli anahtarlarin listesidir
   (diet_menu_items.is_soon) — HANDOFF §5.4'un kurali burada da gecerli:
   o anahtar `null`'a cekilir, kabuk href BASMAZ ve gorunur rozet verir.
   ===================================================================== */
var L = Object.assign({
  /* --- bu repoda VAR --- */
  saglikHub:        'saglik-hub-v1.html',       /* Diet ana sayfası — logo buraya döner */
  saglikAraclari:   'saglik-araclari-v1.html',  /* menü merkezi 1 */
  hesaplayicilar:   'hesaplayicilar-v1.html',   /* hesaplayıcı listesi — merkezden ayrı sayfa */
  beslenmeHub:      'beslenme-hub-v1.html',     /* menü merkezi 2 */
  banaUygun:        'bana-uygun-olani-bul-v1.html', /* ortak başlangıç — ana menüde DEĞİL */
  programBul:       'program-bul-v1.html',
  programSure:      'program-sure-v1.html',  /* Süreye Göre sihirbazı (11. tur) */
  hesaplayici:      'beden-kutle-endeksi-v1.html',
  besinKutuphanesi: 'besin-kutuphanesi-v1.html',
  besinDegerleri:   'besin-degerleri-v1.html',
  /* Beslenme Rehberi ayrı bir sayfa değil, merkez sayfanın rehber bölümüdür —
     iki kapı yerine tek yer (9. tur). Eski beslenme-rehberi-v1.html silindi. */
  beslenmeRehberi:  'beslenme-hub-v1.html',
  dengeliTabak:     'beslenme-dengeli-tabak-v1.html', /* Beslenme mega'sının öne çıkan rehberi */
  beslenmeIpuclari: 'beslenme-ipuclari-v1.html',  /* Beslenme'nin dördüncü modülü (9. tur) */
  kacKalori:        'kac-kalori-v1.html',         /* Beslenme'nin beşinci modülü — İpuçları'nın kardeşi (12. tur) */
  pufNoktalari:     'diyet-puf-noktalari-v1.html', /* Beslenme'nin altıncı modülü — düz blog yazısı (15. tur) */
  programlar:       'diyet-listeleri-v1.html',  /* menü merkezi 3 */
  /* `programDetay` KALDIRILDI (2026-08-15): tek okuyucusu mega menünün öne
     çıkan kartıydı, o kart artık `DD_FEATURED`ten geliyor. Anahtarı burada
     bırakmak sunucunun HİÇ göndermediği bir hedefi canlı tutardı — kırık
     bağlantının kökü tam olarak buydu. */
  testler:          'saglik-testler-v1.html',
  diyetisyenler:    'diyetisyen-dizin-v1.html', /* menü merkezi 4 */
  diyetisyenBul:    'diyetisyen-bul-v1.html',
  diyetisyenOl:     'diyetisyen-ol-v1.html',
  arama:            'arama-diet-v1.html',
  /* --- kişisel alan (İA 3. faz) — tam harita assets/js/planim.js içinde --- */
  planim:           'planim-v1.html',
  planimGunluk:     'planim-gunluk-takip-v1.html',
  planimProgram:    'planim-programim-v1.html',
  planimIlerleme:   'planim-ilerlemem-v1.html',
  planimAlisveris:  'planim-alisveris-v1.html',
  /* UZMAN DESTEGIM (Beyar belgesi, 2026-08-20) — `planimRandevu` +
     `planimMesaj` + `planimVeri` UCLUSU KALDIRILDI. Belge: *"'Veri ve
     Izinlerim', 'Randevularim' ve 'Mesajlarim' acilir menude bagimsiz
     baglantilar olmamali."* Randevu ve mesaj bu anahtarin altinda tek cati
     oldu; veri/izinler `hesabim` merkezine gitti.
     Anahtarlari burada birakmak, kabugun HIC BASMADIGI hedefleri canli
     tutardi — `programDetay`in 2026-08-15'te ayni gerekceyle dusurulmesinin
     aynisi.
     Prototip karsiligi olmadigi icin varsayilan BOS: hedef YALNIZ sunucudan
     (DietShell::links) gelir — `hesabim` ile ayni desen. */
  planimUzman:      '',
  planimKayit:      'planim-kaydettiklerim-v1.html',
  planimProfil:     'planim-saglik-profilim-v1.html',
  /* ONAYLI YAPISAL SAPMA (Beyar, 2026-08-18 / T5.0) — referansta bu anahtar
     YOKTU. Gerekcesi: eski sistemde Diyet'in hesap yuzeyi hic yoktu,
     kullanici hesabini kardes marka tarafinda yonetiyordu. Yeni sistem tek
     basina ayakta duruyor; kullanicinin hesabina menuden ulasamamasi kabul
     edilemez. Prototip karsiligi olmadigi icin varsayilan bos birakildi —
     hedef YALNIZ sunucudan (DietShell::links) gelir. */
  hesabim:          '',
  /* ÜYELİK VE HESAP grubunun İKİ YENİ HEDEFİ (Beyar belgesi, 2026-08-22 —
     "Güncellenmiş Açılır Kullanıcı Menüsü"). Ekranları BU ŞERİT KURMADI;
     iki ayrı şerit kuruyor ve rotaları sonradan doğacak.
     🔴 VARSAYILAN BOŞ BIRAKILDI ve boş kalması KALEMİ HİÇ BASMAMAK demektir
     (acctItem/drawerItem). "Yakında" rozeti de basılmaz. Gerekçe kayıtlı bir
     derstir (CLAUDE.md §6): rota KAYDI yokken menü kalemi görünürse kullanıcı
     tıklar ve 404 alır. Rota doğduğu gün sunucu `DietShell::links()` üzerinden
     hedefi gönderir ve kalem KENDİLİĞİNDEN belirir — bu dosyaya tekrar
     dokunulmaz. */
  abonelikOdemeler: '',
  destekMerkezi:    '',

  /* --- bu repoda YOK (1 hedef) --- */
  yasal:            'yasal-v1.html'               /* ✗ */
}, window.DD_L || {});

/* "Yakinda" anahtarlari — sunucudan gelen liste haritayi null'a ceker.
   Kabugun kendi SOON/SOONB sabitleri zaten null hedefi rozetle basiyor. */
(function(){
  var soon = window.DD_SOON || [];
  for (var i = 0; i < soon.length; i++) { L[soon[i]] = null; }
})();

/* =====================================================================
   KABUK SÖZLÜĞÜ (2026-08-22) — SUNUCUDAN. `window.DD_LANG.sozluk`
   (`App\Domain\Diet\Support\DietShell::sozluk()`).
   ---------------------------------------------------------------------
   NEDEN: kabuk markup'ı BU DOSYADA üretiliyor ve `__()` JavaScript'e
   ulaşmıyor. Yani menü · üstbilgi · çekmece · görüş modalı · çerez şeridi
   sunucunun çeviri yolundan HİÇ geçmiyordu: `/en` altında bile Türkçe
   basılıyordu (ölçüldü — `docs/EN-yuzey-ihlalleri.md`, betik yüzeyi).

   MEKANİZMA YENİ DEĞİL, GENİŞLETİLDİ: `window.DD_LANG` zaten sunucudan
   gelen bir dil yüküydü (`menuLabel` · `switchLabel` çevrilmiş metinlerdi).
   İkinci bir kanal AÇILMADI; aynı yüke `sozluk` anahtarı eklendi.

   🔴 ANAHTARLAR ASCII, DEĞERLER ÇEVİRİ. Anahtar olarak Türkçe metnin
   kendisini kullanmak akla yakındı ama ÖLÇÜLDÜ ki işe yaramaz: çeviri
   yüzeyi kapısı (`CeviriYuzeyKapisiTest`) BU DOSYANIN dizgi sabitlerini
   tarıyor — Türkçe anahtar dosyada Türkçe dizgi olarak kalır ve kapı haklı
   olarak kırmızı düşer. ASCII anahtar `teknikDizgi()` süzgecinden geçer.

   ⚠ TR ÇIKTISI BAYT DÜZEYİNDE AYNI: `__()` karşılığı olmayan anahtar için
     kaynak dizgiyi döndürür, yani TR'de sözlük birim dönüşümdür.

   YÜK BASILMAMIŞSA (prototipin kendisi file:// ile açıldığında) `T()`
   anahtarın kendisini döndürür — sessiz boş metin yerine görünür bir
   eksik işareti. Kapı: `tests/Feature/Kabuk/KabukSozluguKapisiTest.php`,
   dosyadaki her `T('...')` anahtarının sunucu yükünde bulunmasını ölçer.
   ===================================================================== */
var TSTR = (window.DD_LANG && window.DD_LANG.sozluk) || {};
function T(k){ var v = TSTR[k]; return (v === undefined || v === null) ? k : v; }

/* =====================================================================
   data-nav EŞLEMESİ — altı başlık dörde indi, 37 sayfaya DOKUNULMADI.
   Sayfalar eski değeri yazmaya devam eder; kabuk burada yeni başlığa çevirir.
   Yeni sayfalar doğrudan yeni değeri yazabilir (eşleme kimlik olur).
   ===================================================================== */
var NAVMAP = {
  hesaplayicilar: 'araclar',       /* 10 hesaplayıcı sayfası */
  testler:        'araclar',       /* saglik-testler + test-detay */
  besin:          'beslenme',      /* besin-degerleri, kalori-cetveli, kütüphane */
  beslenme:       'beslenme',      /* beslenme-rehberi + 5 alt rehber */
  programlar:     'programlar',
  diyetisyenler:  'diyetisyenler'
};

/* ---- sayfa parametreleri ---- */
var B    = document.body;
var RAW  = B.getAttribute('data-nav') || '';
var NAV  = NAVMAP[RAW] || RAW;
var MARK = B.getAttribute('data-nav-mark') || '';

/* ============================================================================
   BANNER GRUPLARI — tek kaynak
   ----------------------------------------------------------------------------
   Banner taşıyan public sayfalar iki role ayrılır ve her rol KENDİ İÇİNDE tek
   bir banner yüksekliğinde durur. Ölçüler dd-shell.css'teki iki blokta; üyelik
   burada. Sayfalar kendi yüksekliğini taşımaz, bu listeye eklenir.

     liste  — modülün merkezi ya da listesi: arama, kütüphane, hub, dizin,
              araç/test listeleri, program listesi, besin ve makro tabloları.
     detay  — tek bir şeyin sayfası: hesaplayıcı, program, test, rehber yazısı,
              ipucu ve kalori yazısı.

   Gruba GİRMEYENLER ve nedeni:
     saglik-hub-v1        tam ekran hero (min-height:100vh) — onaylanmış istisna
     diyetisyen-profil-v1 banner'ı bölüm zemini değil .pf-banner kapak görseli —
                          onaylanmış istisna (HANDOFF §5.1)
     Planım ailesi (10)   banner YOK, olmayacak (HANDOFF §5.1)
     sihirbaz dörtlüsü    KENDİ grubu var (BG_SIHIRBAZ). 17. turda krem zemin
                          koyu görselli banner'a döndü; yine de liste/detay
                          ölçüsüne çekilmez, çünkü banner'ın hemen altındaki
                          sihirbaz kartı yukarıda durmalı. Kendi içinde eşit.
   ============================================================================ */
var BG_LISTE = ['arama-diet-v1','besin-kutuphanesi-v1','besin-degerleri-v1',
  'besin-kalori-cetveli-v1','protein-rehberi-v1','karbonhidrat-rehberi-v1',
  'yag-rehberi-v1','beslenme-hub-v1','beslenme-ipuclari-v1','kac-kalori-v1',
  'diyet-puf-noktalari-v1',
  'diyet-listeleri-v1','diyetisyen-dizin-v1','diyetisyen-ol-v1',
  'hesaplayicilar-v1','saglik-araclari-v1','saglik-testler-v1'];

var BG_DETAY = ['bazal-metabolizma-v1','beden-kutle-endeksi-v1','gunluk-kalori-v1',
  'gunluk-su-v1','hedef-kilo-suresi-v1','ideal-kilo-v1','makro-dagilim-v1',
  'porsiyon-hesaplama-v1','vucut-tipi-v1','vucut-yag-orani-v1','test-detay-v1',
  'diyet-program-aile-v1','diyet-program-detay-v1','diyet-program-detoks-v1',
  'diyet-program-ogrenci-v1','diyet-program-oruc-v1','diyet-program-protein-v1',
  'diyet-program-seker-v1','diyet-program-vegan-v1',
  'beslenme-alisveris-etiket-v1','beslenme-dengeli-tabak-v1',
  'beslenme-su-ve-icecek-v1','beslenme-disarida-yemek-v1','beslenme-atistirmalik-v1',
  'diyet-puf-noktasi-detay-v1',
  'beslenme-ogun-planlama-v1','beslenme-porsiyon-kontrolu-v1',
  'beslenme-saglikli-mutfak-v1','beslenme-ipucu-detay-v1','kac-kalori-detay-v1'];

var BG_SIHIRBAZ = ['bana-uygun-olani-bul-v1','program-bul-v1','program-sure-v1',
  'diyetisyen-bul-v1'];

/* LARAVEL PORTU (2026-08-12) — varlik koku. Prototip kok dizinden acildigi
   icin kabugun urettigi HTML'de "assets/..." RELATIF yollar duruyor; Laravel'de
   sayfa `/saglik/hesaplayici/bki` gibi derin bir yolda oldugundan ayni relatif
   yol `/saglik/hesaplayici/assets/...` diye cozulup 404 veriyordu (olculdu).
   `window.DD_ASSETS` basilmissa mutlak kok kullanilir; basilmamissa deger
   "assets/" kalir ve prototipin kendi davranisi BIREBIR surer. */
var DDA = window.DD_ASSETS || 'assets/';

/* =====================================================================
   LARAVEL PORTU (2026-08-15) — VITRIN SAYILARI SUNUCUDAN GELIR.
   ---------------------------------------------------------------------
   Prototipte ust bant "2.400+ besin degeri", mega menu "2.400+ besinin
   degeri" ve "8 hazir beslenme programi" diyordu — UCU DE SABIT metindi.
   Sayfanin kendisi ayni ekranda GERCEK toplami basiyordu (`$foodsTotal`),
   yani ziyaretci iki farkli sayi goruyordu: canlida sayfa "311 besinin",
   bant "2.400+ besin degeri" dedi (Beyar, 2026-08-15). Bant ISTEMCIDE
   basildigi icin sunucu HTML'ini tarayan denetimler kusuru hic gormedi.

   `window.DD_STATS` bu sayilarin TEK kaynagidir
   (`App\Domain\Diet\Support\DietStats`, `layouts/diet.blade.php`). Degerler
   sunucuda TR binlik ayraciyla bicimlenmis METINdir — kabuk kendi
   bicimleyicisini uydurmaz.

   VERI YOKSA SAYI BASILMAZ: sunucu 0 olan anahtari haritaya HIC koymaz,
   `dsLabel()` de sayisiz ibareye duser. "0 besin degeri" yaniltir; sayisiz
   ibare durusttur (Beyar kurali). DD_STATS hic basilmamissa (prototipin
   kendisi file:// ile acildiginda) davranis aynidir — sayisiz ibare. */
var DS = window.DD_STATS || {};
function dsLabel(key, sablon, without){
  /* SAYI CÜMLENİN İÇİNE PARAMETRE OLARAK GİRER, dizgi birleştirmeyle DEĞİL:
     Türkçede sayı önde ama her dilde öyle değil. Şablon sunucudan gelir
     (`:sayi` yer tutuculu), burada yalnız yerine konur. TR'de sonuç eski
     birleştirmeyle BAYT DÜZEYİNDE aynıdır. */
  return DS[key] ? sablon.split(':sayi').join(DS[key]) : without;
}

var PAGE = (location.pathname.split('/').pop() || 'index').replace(/\.html$/,'');

/* =====================================================================
   LARAVEL PORTU (2026-08-12) — BANNER GRUBU SUNUCUDAN DA GELEBILIR.
   ---------------------------------------------------------------------
   Yukaridaki uc dizi prototipin `.html` DOSYA ADLARINI tasir. Laravel'de
   sayfa adi diye bir sey yok (`/saglik/hesaplayicilar`), dolayisiyla
   hicbir sayfa gruba giremiyor, `data-banner` basilmiyor ve dd-shell.css'in
   min-height / seffaf-header kurallari hic devreye girmiyordu — hero'nun
   kaymasinin sebebi buydu (ILERLEME §0/S1).

   Cozum, ILERLEME'nin kendi onerisi: grup uyeligi `<body data-banner="...">`
   ile SUNUCUDAN basilir (resources/views/layouts/diet.blade.php). Asagidaki
   dosya-adi aramasi YEDEKTIR: nitelik basilmamissa (prototipin kendisi
   file:// ya da statik sunucudan acildiginda) eski davranis BIREBIR surer.
   ===================================================================== */
var BGRP = B.getAttribute('data-banner')
        || (BG_LISTE.indexOf(PAGE)    > -1 ? 'liste'
         :  BG_DETAY.indexOf(PAGE)    > -1 ? 'detay'
         :  BG_SIHIRBAZ.indexOf(PAGE) > -1 ? 'sihirbaz' : '');
if(BGRP) B.setAttribute('data-banner', BGRP);

/* Şeffaf header — KOYU banner taşıyan her sayfada. data-hero="1" elle yazılmış
   hâli korunur (saglik-hub-v1 gruplara girmiyor ama tam ekran koyu hero'su var);
   iki banner grubu ise otomatik açılır, sayfalara bayrak yazılmaz.
   17. turdan beri sihirbaz dörtlüsü de kapsamda: .wzp-top artık koyu görselli
   banner taşıyor. Dışarıda kalan tek banner sayfası diyetisyen-profil-v1;
   .pf-top zemini beyaz, beyaz metin okunmaz — onda header katı kalır. */
var HERO = B.getAttribute('data-hero') === '1' || BGRP === 'liste' || BGRP === 'detay' || BGRP === 'sihirbaz';

function AC(k){ return NAV === k ? ' class="active"' : ''; }          /* üst nav */
function AD(k){ return (NAV === k && MARK === 'drawer') ? ' active' : ''; }  /* drawer */
function ARIA(k){ return (NAV === k && MARK === 'drawer') ? ' aria-current="page"' : ''; }

/* Karşılığı henüz olmayan menü kalemi: href YOK (boş diyez de yok), görünür
   "Yakında" rozeti + sönük görünüm. Tıklanabilir görünmez, hiçbir yere gitmez. */
var SOON = ' style="opacity:.55;cursor:default;pointer-events:none"';
var SOONB = ' <span class="soon">' + T('soon') + '</span>';

/* Alt bilgi kalemi — koşul kaynağı SUNUCUDAN gelen `L` haritası (rota/kayıt
   gerçekten var mı). `url` doluysa gerçek `href`, boşsa AYNI SOON/SOONB
   rozetiyle devre dışı — sabit "Yakında" YOK, kayıt yayından kalkarsa
   (ya da hiç yoksa) kabuk kendiliğinden burada duraklar (ENVANTER-diet-page.md). */
function footLink(url, label){
  return url ? '<a href="' + url + '">' + label + '</a>' : '<a' + SOON + '>' + label + SOONB + '</a>';
}

/* =====================================================================
   HESAP MENÜSÜNÜN KOŞULLU KALEMİ — hedefi yoksa HİÇ BASILMAZ.
   ---------------------------------------------------------------------
   `footLink()`in kardeşi ama TERSİ dala düşer ve fark KASITLIDIR:

     footLink(null,…)   → sönük kalem + "Yakında" rozeti  (kalem GÖRÜNÜR)
     acctItem(null,…)   → boş dizgi                        (kalem YOK)

   NEDEN: alt bilgideki kalem bir VAAT'tir — sayfa yayından kalkmış olabilir,
   kullanıcıya "burada bir şey vardı/olacak" demek doğrudur. Hesap menüsündeki
   kalem ise bir KAPI'dır; açılmayan kapıyı çizmek CLAUDE.md §6'nın kayıtlı
   dersinin ta kendisidir: *"Bayrak middleware'i rota KAYDINI kesmiyorsa
   modülü gizlemez — Route::has() true dönüp menü kalemi görünüyor, tıklanınca
   404 veriyordu."* Burada kayıt da yok; o yüzden kalem de yok.

   KOŞUL KAYNAĞI SUNUCUDUR, bu dosya değil: `L.<anahtar>` yalnız
   `DietShell::links()` o rotayı `Route::has()` ile bulduysa dolu gelir. Rota
   doğduğu gün kalem kendiliğinden belirir; bu dosya bir daha değişmez.

   İKİ YÜZEY İKİ KALIP: masaüstü `.acct-menu` etiketini <span> içinde taşır
   (dd-shell.css:458 `.acct-menu>a span`), çekmecenin `.d-sub` bağlantısı düz
   metin. Kalıplar YENİ DEĞİL — ikisi de yanındaki koşulsuz kalemlerin
   BİREBİR aynısı; tek fark hedefi olmayanın hiç basılmaması.
   ===================================================================== */
function acctItem(url, icon, label){
  return url ? '<a href="' + url + '"><i class="fa-solid ' + icon + '"></i> <span>' + label + '</span></a>' : '';
}
function drawerItem(url, icon, label){
  return url ? '<a href="' + url + '"><i class="fa-solid ' + icon + '"></i> ' + label + '</a>' : '';
}

/* Marka değiştirici kalemi (MARKA GEÇİŞİ TURU, 2026-08-15) — footLink'in
   BİREBİR kalıbı, tek farkla: "Yakında" ROZETİ (SOONB) burada BASILMAZ.
   Gerekçe ölçüm: `.bs-name` hover'a kadar gizlidir (max-width:0,
   dd-shell.css:894) ama `.soon` rozeti gizlenmez — her kalemin yanında sürekli
   görünen bir "YAKINDA" etiketi kompakt şeridi bozardı. Pasiflik yine SOON
   (sönük + pointer-events:none) + href YOKLUĞU ile sağlanır ve tooltip
   "Yakında" der; kardeş markaların topbar'ı da rozetsiz, tıklanamaz kalem
   basıyor.

   NEDEN GEREKLİ: sunucu artık karşılığı olmayan dünyaları AÇIKÇA null
   gönderiyor. Blok hedefi
   ham bir href olarak yazmaya devam etseydi kabuk href="null" basardı — ölü
   bağlantı biçim değiştirir, kaybolmazdı. */
/* SABIT DIS URL TABLOSU — Beyar karari, 2026-08-18 (A5 marka gecis ikonlari).
   ---------------------------------------------------------------------
   Siyah banttaki marka gecis kalemleri GERI GELDI. Kural tarif seridiyle
   AYNI (docs/parite/T5.4-sapma.md §1):

     · Hedef SABIT bir dis URL'dir. route() COZULMEZ, config OKUNMAZ,
       kardes markanin hicbir tablosu okunmaz, API cagrilmaz. Asagidaki iki
       satir elle yazilmis metindir; hicbir yerden turetilmez.
     · Ikon, sira, sinif adlari, title metinleri referanstan BAYT DUZEYINDE
       gelir — bsItem()'in kendisine DOKUNULMADI, yalniz hedefin KAYNAGI
       degisti (L haritasi -> bu tablo).
     · Hedefi OLMAYAN kalem (Fit, Campus) null gecer ve bsItem'in kendi
       pasif dalina duser; referansta da oyle basiliyor (olculdu 2026-08-18:
       href yok, title="Yakinda", aria-disabled="true"). UYDURMA URL YAZILMAZ.

   URL'LERIN KANIT DOKUMU bu dosyada DEGIL, docs/parite/T5.4-sapma.md §1.6'da
   duruyor — kanit satirlarini burada tekrarlamak host adlarini bu dosyada
   gereksiz yere cogaltir ve (a) kapisinin izinli-satir listesini genisletirdi.
   Ozet: ikisi de kaynak repodaki YAZILI kanittan alindi, tahmin degil.

   ⚠ PROD DNS'i DOGRULANMADI — 07 §1 prod erisimini kapatiyor.

   🔴 BU DOSYADA MARKA DIZGISI YALNIZ ASAGIDAKI IKI DEGER SATIRINDA ve
   marka degistiricideki IKI bsItem() CAGRISINDA gecebilir — toplam DORT
   satir. Kapi: tests/Feature/Brand/BrandLeakGateTest::IZINLI_KABUK_SATIRLARI
   (satir listesi birebir; tek bayt degisirse KIRMIZI). */
var DD_DIS = {
  gastro:  'https://dadagastro.com',
  gourmet: 'https://dadagourmet.com',
  // Hedefi OLMAYAN dunya ACIKCA null gecer — uydurma URL yazilmaz, kalem
  // bsItem()/serit kaliplarinin kendi pasif dalina duser (referansta da oyle).
  fit:     null
};

function bsItem(url, cls, brand, icon){
  var inner = '<i class="fa-solid ' + icon + '"></i><span class="bs-name"><span class="bd">Dada</span><span class="sf">' + brand + '</span></span>';
  return url
    ? '<a class="bs-item ' + cls + '" href="' + url + '" title="Dada' + brand + '">' + inner + '</a>'
    : '<a class="bs-item ' + cls + '" aria-disabled="true"' + SOON + '>' + inner + '</a>';
}

/* LARAVEL PORTU (2026-08-13) — GERÇEK giriş/çıkış/kimlik.
   ---------------------------------------------------------------------
   Prototipte "Giriş Yap"/"Çıkış" demo anahtarıydı (?auth=1/?auth=0, aşağıda
   hâlâ okunuyor ama YALNIZ `window.DD_AUTH` basılmamışsa — bkz. auth IIFE).
   Kabuk artık gerçek hedefleri `L.giris`/`L.cikis`ten okur (DietShell::links()),
   kimliği `window.DD_AUTH.name/handle/avatarUrl`den basar (DietShell::auth()).
   AU — DD_AUTH kısayolu. esc() — DB'den gelen gerçek ad/kullanıcı adı ilk kez
   bu dosyada template-string'e giriyor, HTML-escape zorunlu (XSS). */
var AU = window.DD_AUTH || {};
function esc(s){
  return s == null ? '' : String(s).replace(/[&<>"']/g, function(c){
    return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
  });
}
/* HESAP AVATARI — gorsel YOKSA BAS HARF.
   Kusur (Beyar canlida gordu, 2026-08-20): avatar yuklememis kullanicinin
   header'daki dairesi BOS basiliyordu. `.acct-ava`/`.da-ava` yalniz
   `background-image` tasiyor; adres yoksa daire iceriksiz kaliyor ve
   kullanici kendi hesabini goremiyordu. Kardes marka ayni yerde adin ilk
   harfini basiyor; desen oradan alindi.

   ⚠ BUYUK HARFE CEVIRME `toLocaleUpperCase('tr')` ILE. Duz
   `toUpperCase()` Turkce'de "i"yi "I" yapar; dogrusu "İ"dir. Ayni tuzak
   bu depoda arama kutusunda bir kez odendi (docs/lessons.md, kucuk harf
   katlama). "Ismail" -> "I" degil "İ".

   Donen deger BIR NITELIK DIZGISI + ICERIK ciftidir; cagiran ikisini de
   yerine koyar. Gorsel varsa icerik BOS kalir — harf gorselin ustune
   binmez. */
function ddAvaSpan(cls){
  if (AU.avatarUrl) {
    return '<span class="' + cls + '" style="background-image:url(\'' + esc(AU.avatarUrl) + '\')"></span>';
  }
  var kaynak = (AU.name || AU.handle || '').trim();
  if (!kaynak) return '<span class="' + cls + '"></span>';
  var harf = esc(kaynak.charAt(0).toLocaleUpperCase('tr'));
  return '<span class="' + cls + ' is-harf">' + harf + '</span>';
}
/* 🔴 SONSUZ ADRES UZAYI DÜZELTMESİ — E2E turu, 2026-08-21.
   ---------------------------------------------------------------------
   ÖLÇÜLEN KUSUR: bu fonksiyon giriş bağını her sayfada
   `?return=<mevcut URL kodlanmış>` ile kuruyordu — BULUNULAN SAYFA
   `/giris` OLSA BİLE. Bağ her izlendiğinde bir öncekini kodlanmış içeren
   YENİ bir adres doğuyordu: `%2F → %252F → %25252F`. 2026-08-19'da bu
   desen üç sitede beş dakikada 2.687 isteğin %59'unu üretti
   (`docs/canli-yuk-2026-08-19.md`) ve sunucuya bir nginx kuralı kondu
   (`/etc/nginx/conf.d/f10-sonsuz-uzay.conf`): `return` değeri `giris` ya
   da `%25` içeren istekler `limit_req rate=1r/m` + `444` alıyor.

   Yani bugün bu bağ KULLANICI İÇİN ÖLÜ: `/giris` üzerindeyken kabuktaki
   "Giriş Yap"a tıklayan biri BOŞ YANIT alıyor (E2E turunda gerçek
   tarayıcıda ölçüldü: `net::ERR_EMPTY_RESPONSE`, gövde 0 karakter).

   DÜZELTME İKİ KURAL — ikisi de belirtiyi değil SEBEBİ kesiyor:
     1. Zaten giriş/kayıt yüzeyindeysek `return` HİÇ eklenmez.
     2. Mevcut adresteki `return` parametresi ATILIR; yeniden kodlanmaz.
        (İkinci kodlama `%25`i doğuran şeydi.)
   nginx kuralına DOKUNULMADI — o bir savunma katmanı olarak kalır. */
function ddLoginHref(){
  if (!L.giris) return null;

  /* ⚠ `L.giris` MUTLAK ADRES olabilir. Varsayılanlar prototip dosya adları
     ama çalışma anında `window.DD_L` onları gerçek URL'lerle eziyor
     (ölçüldü: `https://dadadiet.com/giris`). İlk yazımda karşılaştırma
     `location.pathname === L.giris.split('?')[0]` idi ve mutlak adres
     yüzünden HİÇBİR ZAMAN tutmadı — düzeltme canlıya çıktı ve `/giris`
     üzerindeki bağ hâlâ `?return=%2Fgiris` basmaya devam etti.
     Ölçüt yolları yola karşı karşılaştırır. */
  var hedefYol;
  try { hedefYol = new URL(L.giris, location.origin).pathname; }
  catch (e) { hedefYol = String(L.giris).split('?')[0]; }

  // 1 — giriş yüzeyinin kendisindeysek dönüş adresi anlamsızdır
  if (location.pathname === hedefYol) return L.giris;

  // 2 — mevcut sorgudan `return` ayıklanır (çift kodlamanın kaynağı)
  var sorgu = '';
  if (location.search.length > 1) {
    var parcalar = location.search.slice(1).split('&').filter(function (p) {
      return p !== '' && p.split('=')[0] !== 'return';
    });
    if (parcalar.length) sorgu = '?' + parcalar.join('&');
  }

  var ret = encodeURIComponent(location.pathname + sorgu);
  var sep = L.giris.indexOf('?') > -1 ? '&' : '?';
  return L.giris + sep + 'return=' + ret;
}
/* Giriş bağlantısı — hedef yoksa (rota kayıtlı değilse) AYNI SOON/SOONB
   deseni: sabit "?auth=1" YOK, kırık hedef yazılmaz. */
function loginLink(cls, extra){
  var href = ddLoginHref();
  var label = '<i class="fa-regular fa-user"></i> ' + T('girisYap');
  return href
    ? '<a class="' + cls + '"' + (extra || '') + ' href="' + href + '">' + label + '</a>'
    : '<a class="' + cls + '"' + (extra || '') + SOON + '>' + label + SOONB + '</a>';
}

/* =====================================================================
   DIL SECICI (2026-08-15) — SUNUCUDAN. `window.DD_LANG`
   (`App\Domain\Diet\Support\DietShell::lang()`).
   ---------------------------------------------------------------------
   ONCEKI HALI: etiket `<span>TR</span>` olarak SABIT gomuluydu ve tiklama
   dinleyicisi yalnizca o metni degistiriyordu. Gercek tarayicida olculdu:
   EN'e tiklaninca etiket "EN" oluyor ama `<html lang>` "tr" kaliyor, URL
   degismiyor, sayfa yeniden yuklendiginde etiket "TR"ye donuyordu — yani
   secilen dil ile gosterilen etiket AYRISIYORDU.

   Markup kardes markalarin (`resources/views/components/lang-switch.blade.php`
   variant=bare / variant=drawer) BIREBIR kopyasidir; yeni sinif/desen ICAT
   EDILMEDI. Sozlesme de ayni: TEK gecilebilir dil varsa acilir liste HIC
   kurulmaz, dugmenin ustunde SECILI degil GECILECEK dil yazar ve tek tik
   dili degistirir; iki+ dilde acilir liste devreye girer.

   VERI YOKSA SECICI BASILMAZ: sunucu gecilebilecek dil bulamazsa
   (`options` bos) kabuk hicbir sey basmaz. Bu, emsalin kendi kurali
   (lang-switch.blade.php: "Gecilecek dil kalmadiysa secici hic basilmaz") ve
   `DD_STATS`in "veri yoksa sayi basilmaz" kuraliyla ayni durustur — uydurma
   bir etiket basmaktansa hic basmamak. Bugun Diet'in hicbir rotasi `{locale}`
   oneki tasimadigi icin (olculdu: 90/0) liste bostur; o rotalar
   kaydedildigi gun secici KENDILIGINDEN geri gelir.
   ===================================================================== */
var LANG = window.DD_LANG || null;

function langHTML(){
  if(!LANG || !LANG.options || !LANG.options.length) return '';
  var a11y = esc(LANG.menuLabel || '');

  /* TEK DUGME modu — lang-switch.blade.php:53-59 birebir. */
  if(LANG.options.length === 1){
    var o = LANG.options[0];
    return '<div class="tb-lang">'
      + '<a class="tb-lang-one" href="' + esc(o.href) + '" hreflang="' + esc(o.code) + '"'
      + ' aria-label="' + esc(o.switchLabel) + '" title="' + esc(o.switchLabel) + '">'
      + '<i class="fa-solid fa-globe" aria-hidden="true"></i><span lang="' + esc(o.code) + '">' + esc(o.label) + '</span>'
      + '</a></div>';
  }

  /* ACILIR LISTE — lang-switch.blade.php:77-89 birebir. */
  var items = LANG.options.map(function(o){
    return '<a href="' + esc(o.href) + '" role="menuitem">' + esc(o.label) + ' <span>' + esc(o.name) + '</span></a>';
  }).join('');

  return '<div class="tb-lang" data-lang-dropdown>'
    + '<button class="tb-lang-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="' + a11y + '">'
    + '<i class="fa-solid fa-globe" aria-hidden="true"></i><span>' + esc(LANG.currentLabel) + '</span>'
    + '<i class="fa-solid fa-chevron-down tb-lang-caret" aria-hidden="true"></i></button>'
    + '<div class="tb-lang-menu" role="menu">' + items + '</div></div>';
}

function drawerLangHTML(){
  if(!LANG || !LANG.options || !LANG.options.length) return '';

  /* TEK DUGME modu — lang-switch.blade.php:60-67 birebir. */
  if(LANG.options.length === 1){
    var o = LANG.options[0];
    return '<div class="drawer-lang">'
      + '<a class="drawer-lang-one" href="' + esc(o.href) + '" hreflang="' + esc(o.code) + '"'
      + ' aria-label="' + esc(o.switchLabel) + '">'
      + '<span class="drawer-lang-label"><i class="fa-solid fa-globe" aria-hidden="true"></i> ' + T('dil') + '</span>'
      + '<span class="drawer-lang-cur" lang="' + esc(o.code) + '">' + esc(o.label) + ' — ' + esc(o.name) + '</span>'
      + '</a></div>';
  }

  /* AKORDIYON — lang-switch.blade.php:90-101 birebir. */
  var items = LANG.options.map(function(o){
    return '<a href="' + esc(o.href) + '"><b>' + esc(o.label) + '</b> ' + esc(o.name) + '</a>';
  }).join('');

  return '<div class="drawer-lang" data-drawer-lang>'
    + '<button class="drawer-lang-toggle" type="button" aria-expanded="false" aria-controls="drawerLangList">'
    + '<span class="drawer-lang-label"><i class="fa-solid fa-globe" aria-hidden="true"></i> ' + T('dil') + '</span>'
    + '<span class="drawer-lang-cur">' + esc(LANG.currentLabel) + ' — ' + esc(LANG.currentName)
    + ' <i class="fa-solid fa-chevron-down" aria-hidden="true"></i></span></button>'
    + '<div class="drawer-lang-list" id="drawerLangList">' + items + '</div></div>';
}

/* =====================================================================
   ONE CIKAN PROGRAM KARTI (2026-08-15) — SUNUCUDAN. `window.DD_FEATURED`
   (`App\Domain\Diet\Support\DietShell::featuredProgram()`).
   ---------------------------------------------------------------------
   ONCEKI HALI: kart `href="${L.programDetay}"` yaziyordu ama sunucu o
   anahtari HIC gondermiyordu; L'nin prototip varsayilani
   (`diyet-program-detay-v1.html`) kaliyor ve kart canlida **HTTP 404**
   veriyordu (tarayici + curl ile olculdu). Basligi ("Akdeniz Tipi
   Beslenme — 7 gunluk") ve kapagi da sabitti.

   Kapak URL'i zaten `dengeli-beslenme` kaydinin `cover_url`u oldugu icin
   kart en basindan beri o programdi — kaydi kaynagina baglamak prototipten
   SAPMA degil, sabitin geri alinmasidir.

   Veri yoksa kart BASILMAZ (kirik baglanti yerine hic kart).
   ===================================================================== */
var FEAT = window.DD_FEATURED || null;

function featuredHTML(){
  if(!FEAT || !FEAT.href) return '';
  var bg = FEAT.cover ? ' style="background-image:url(\'' + esc(FEAT.cover) + '\')"' : '';
  return '<a class="mf-fig" href="' + esc(FEAT.href) + '"' + bg + '>'
    + '<span class="r-chip">' + T('populer') + '</span>'
    + '<h4>' + esc(FEAT.title) + '</h4></a>';
}

/* =====================================================================
   ÜST KROM — topbar + header + drawer + bottom-nav + görüş modalı + çerez
   ===================================================================== */
function topHTML(){ return `
<!-- ===== TOP UTILITY BAR ===== -->
<div class="topbar">
  <div class="wrap">
    <div class="tb-left">
      <a href="${L.besinDegerleri}"><i class="fa-solid fa-leaf" style="color:var(--tomato)"></i> ${dsLabel('foods', T('tbBesinDegeri'), T('tbBesinDegerleri'))}</a>
      <span class="tb-div"></span>
      <div class="tb-soc">
        <a><i class="fa-brands fa-instagram"></i></a>
        <a><i class="fa-brands fa-youtube"></i></a>
        <a><i class="fa-brands fa-pinterest"></i></a>
      </div>
    </div>
    <div class="tb-right">
      <nav class="brand-switch" aria-label="${T('markaDunyalari')}">
        ${bsItem(DD_DIS.gastro, 'bs-gastro', 'Gastro', 'fa-utensils')}
        <a class="bs-item bs-diet is-active" href="${L.saglikHub}" aria-current="page"><i class="fa-solid fa-leaf"></i><span class="bs-name"><span class="bd">Dada</span><span class="sf">Diet</span></span></a>
        ${bsItem(null, 'bs-fit', 'Fit', 'fa-dumbbell')}
        ${bsItem(DD_DIS.gourmet, 'bs-gourmet', 'Gourmet', 'fa-map-location-dot')}
        ${bsItem(null, 'bs-campus', 'Campus', 'fa-graduation-cap')}
      </nav>

      ${langHTML()}
    </div>
  </div>
</div>

<!-- ===== HEADER ===== -->
<header class="header">
  <!-- TEK KAT: marka + ortalanmış nav + aksiyonlar (Revize T3 M2) -->
  <div class="h-top">
    <div class="wrap">
      <a class="brand dd-brand" href="${L.saglikHub}" aria-label="${T('markaEtiketi')}">
        <svg class="dd-mark" viewBox="0 0 44 44" aria-hidden="true">
          <rect x="3" y="3" width="38" height="38" rx="11" fill="#009A44"/>
          <path d="M30 12 C20 12 14 18 14 27 C14 28.4 14.2 29.7 14.6 31 C24 31 31 25 31 14.2 C31 13.4 30.6 12.7 30 12 Z" fill="#fff" opacity=".96"/>
          <path d="M16 31 C18 24 22 18 29 14" stroke="#009A44" stroke-width="2.1" fill="none" stroke-linecap="round"/>
          <path d="M22 23 l2.4 0 1.5 -3 2 5.4 1.4 -2.4 2.1 0" stroke="#009A44" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>
        </svg>
        <span class="dd-word"><b>Dada</b><span class="dd-st">Diet</span></span>
      </a>
      <!-- DÖRT BAŞLIK — her biri kendi merkez sayfasına giden GERÇEK bağlantı;
           panel yalnız hover ile açılır, başlık tıklanınca merkeze gidilir.
           Dördü de aynı mega dilinde: .mega-cats üç kısa sütun + .mega-feat. -->
      <nav class="nav">
        <!-- SAĞLIK ARAÇLARI — dar dikey açılır liste (.dropdown; kabukta tanımlı,
             markup'ı 7. turdan beri boştu). İki kalem alt alta. Merkez sayfaya
             başlığın kendisi gidiyor, ikinci bir "Tüm Sağlık Araçları" kapısı yok. -->
        <div class="nav-item">
          <a href="${L.saglikAraclari}"${AC('araclar')}${ARIA('araclar')}>${T('navAraclar')}<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></a>
          <div class="dropdown dd-col">
            <a href="${L.hesaplayicilar}"><i class="fa-solid fa-calculator"></i> <span>${T('navHesaplayicilar')}<small>${T('navHesaplayicilarAlt')}</small></span></a>
            <a href="${L.testler}"><i class="fa-solid fa-clipboard-question"></i> <span>${T('navTestler')}<small>${T('navTestlerAlt')}</small></span></a>
          </div>
        </div>

        <div class="nav-item has-mega">
          <a href="${L.beslenmeHub}"${AC('beslenme')}${ARIA('beslenme')}>${T('navBeslenme')}<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></a>
          <div class="mega">
            <div class="wrap">
              <div class="mega-grid">
                <div class="mega-cats">
                  <a href="${L.beslenmeRehberi}"><i class="fa-solid fa-book-open"></i> <span>${T('navRehber')}<small>${T('navRehberAlt')}</small></span></a>
                  <a href="${L.besinKutuphanesi}"><i class="fa-solid fa-magnifying-glass"></i> <span>${T('navKutuphane')}<small>${dsLabel('foods', T('megaBesininDegeri'), T('megaBesinlerinDegeri'))}</small></span></a>
                  <a href="${L.beslenmeIpuclari}"><i class="fa-solid fa-lightbulb"></i> <span>${T('navIpuclari')}<small>${T('navIpuclariAlt')}</small></span></a>
                  <a href="${L.kacKalori}"><i class="fa-solid fa-fire"></i> <span>${T('navKacKalori')}<small>${T('navKacKaloriAlt')}</small></span></a>
                  <a href="${L.pufNoktalari}"><i class="fa-solid fa-lightbulb"></i> <span>${T('navPufNoktalari')}<small>${T('navPufNoktalariAlt')}</small></span></a>
                  <a${SOON}><i class="fa-solid fa-utensils"></i> <span>${T('navTarifler')}${SOONB}<small>${T('navTariflerAlt')}</small></span></a>
                </div>
                <div class="mega-feat">
                  <a class="mf-fig" href="${L.dengeliTabak}" style="background-image:url('https://images.unsplash.com/photo-1467453678174-768ec283a940?w=700&q=80&auto=format&fit=crop&exp=7&gam=6&sat=-9&high=8&vib=5')">
                    <span class="r-chip">${T('megaRehberRozet')}</span>
                    <h4>${T('megaRehberBaslik')}</h4>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="nav-item has-mega">
          <a href="${L.programlar}"${AC('programlar')}${ARIA('programlar')}>${T('navProgramlar')}<i class="fa-solid fa-chevron-down" aria-hidden="true"></i></a>
          <div class="mega">
            <div class="wrap">
              <div class="mega-grid">
                <div class="mega-cats">
                  <a class="mega-cat-all" href="${L.programBul}"><i class="fa-solid fa-wand-magic-sparkles"></i> <span>${T('navProgramBul')}<small>${T('navProgramBulAlt')}</small></span><i class="fa-solid fa-arrow-right mca-arrow"></i></a>
                  <a href="${L.programlar}?hedef=tumu"><i class="fa-solid fa-bullseye"></i> <span>${T('navHedefeGore')}<small>${T('navHedefeGoreAlt')}</small></span></a>
                  <a href="${L.programlar}?yasam=tumu"><i class="fa-solid fa-people-roof"></i> <span>${T('navYasamBicimi')}<small>${T('navYasamBicimiAlt')}</small></span></a>
                  <a href="${L.programlar}?tercih=tumu"><i class="fa-solid fa-seedling"></i> <span>${T('navTercih')}<small>${T('navTercihAlt')}</small></span></a>
                  <a href="${L.programlar}?ihtiyac=tumu"><i class="fa-solid fa-list-check"></i> <span>${T('navIhtiyac')}<small>${T('navIhtiyacAlt')}</small></span></a>
                  <a href="${L.programSure}"><i class="fa-regular fa-calendar"></i> <span>${T('navSure')}<small>${T('navSureAlt')}</small></span></a>
                </div>
                <div class="mega-feat">
                  ${featuredHTML()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DİYETİSYENLER — AÇILIR PANEL YOK. Ne mega ne dar dropdown: başlık
             doğrudan dizine giden tek bağlantıdır, bu yüzden ok da taşımaz.
             Altı kalem (Sana Uygun Diyetisyeni Bul · Tüm Diyetisyenler ·
             Uzmanlık Alanları · Online Görüşme · Randevularım · Diyetisyen Ol)
             menüden çıktı; girişleri sayfa gövdelerinde duruyor (dizin
             banner'ındaki ikili düğme, profil sayfası, Planım alt gezinmesi). -->
        <div class="nav-item">
          <a href="${L.diyetisyenler}"${AC('diyetisyenler')}${ARIA('diyetisyenler')}>${T('navDiyetisyenler')}</a>
        </div>
      </nav>
      <!-- SAĞ BLOK — arama · Planım · Giriş Yap / Hesabım (İA revizyonu, sabit sıra).
           Planım ana menüye girmez; kişisel buton olarak burada durur.

           🔴 GİRİŞ KAPISI GELDİ (Beyar, 2026-08-21). Bu yorum daha önce
           Planım'ın *"her iki giriş durumunda da görünür"* olduğunu yazıyordu;
           2026-08-20 kararının o maddesi İPTAL edildi. Yeni sözleşme:
             · misafirde BASILIR ama GÖRÜNMEZ  (#btnPlanim{display:none})
             · girişli kullanıcıda HER genişlikte görünür — ≤640 dahil
               (body.is-auth #btnPlanim{display:inline-flex}, dd-shell.css:423-424)
           Gizleme CSS'tedir, koşullu basma DEĞİL: prototipin ?auth=1 demo
           anahtarı render'dan SONRA çalışır, koşullu basmak onu bozardı —
           .drawer-acct ile aynı emsal (aşağıda, dd-shell.js:775-777).
           id="btnPlanim" yeni SINIF değildir; aynı satırdaki id="btnLogin"
           dosyanın kendi emsalidir (CLAUDE.md §2 md.3). -->
      <div class="head-actions">
        <button class="icon-btn" aria-label="${T('aramaAria')}" onclick="location.href='${L.arama}'"><i class="fa-solid fa-magnifying-glass"></i></button>
        <a class="btn-login" id="btnPlanim" href="${L.planim}"><i class="fa-solid fa-list-check"></i> ${T('planim')}</a>
        ${loginLink('btn-login', ' id="btnLogin"')}
        <!-- LOGIN-STATE: hesap avatarı ▾ (logged-in) — kimlik gerçek oturumdan (DD_AUTH) -->
        <div class="acct-item acct-wrap">
          <button class="acct-btn" aria-label="${T('hesabim')}" aria-haspopup="true">
            ${ddAvaSpan('acct-ava')}
            <i class="fa-solid fa-chevron-down acct-caret"></i>
          </button>
          <div class="acct-menu">
            <div class="acct-id">
              ${ddAvaSpan('acct-ava')}
              <span class="acct-id-txt"><b>${esc(AU.name) || T('hesabim')}</b>${AU.handle ? '<small>@' + esc(AU.handle) + '</small>' : ''}</span>
            </div>
            <div class="acct-div"></div>
            <!-- KİŞİSEL ALAN (İA 3. faz) — menü artık DadaDiet Planım alanıdır.
                 Önceki hâli kardeş markanın dilindeydi (Mutfak Defterim,
                 Tariflerim, Menülerim…) ve 11 hedefi bu repoda yoktu.

                 🔴 11 KALEM → 9 KALEM, ÜÇ GRUP (Beyar belgesi, 2026-08-20):
                 *"Bu yapı, mevcut 11 ayrı menü maddesini daha anlaşılır 9 ana
                 alana indiriyor."*
                 🔴 SONRA 9 → 8 (Beyar, 2026-08-21): Planım kalemi kalktı.
                 🔴 SONRA 8 → 10..12 (Beyar belgesi, 2026-08-22 — "Güncellenmiş
                 Açılır Kullanıcı Menüsü"). Belgenin kendi listesi:
                   Günlük Kullanım        : Planım · Günlük Takip · Programım ·
                                            İlerlemem · Alışveriş Listem
                   İçerik ve Uzman Desteği: Uzman Desteğim · Kaydettiklerim ·
                                            Sağlık Profilim
                   Üyelik ve Hesap        : Aboneliğim ve Ödemelerim ·
                                            Hesap ve Ayarlar · Destek Merkezi ·
                                            Çıkış
                 Üç şey değişti: (a) Planım GERİ GELDİ ve grubun başına geçti,
                 (b) iki grup adı değişti, (c) Üyelik ve Hesap grubuna iki yeni
                 kalem girdi. Kalem SİLİNMEDİ.
                 Grupları yine iki .acct-div ayırır; ÜÇÜNCÜ AYRAÇ ÇIKIŞ'IN
                 ÜSTÜNE KONMAZ, çünkü belgede Çıkış "Üyelik ve Hesap"
                 grubunun İÇİNDEDİR. -->
            <!-- GRUP 1 — Günlük Kullanım. BEŞ KALEM.
                 🔴 "Planım" KALEMİ GERİ GELDİ (Beyar belgesi, 2026-08-22).
                 2026-08-21'in *"menü Günlük Takip ile başlar"* kararı bu
                 belgeyle DEĞİŞTİ: belge Planım'ı hem *"değiştirilmemiş"*
                 alanlar arasında sayıyor hem de grubun İLK kalemi olarak
                 yazıyor. Eski karar silinmiyor, değiştirildiği yazılıyor.
                 Header'daki #btnPlanim düğmesi YERİNDE KALIR — 2026-08-21'in
                 (b)(c)(d) maddeleri iptal edilmedi, yalnız (a) değişti. -->
            <a href="${L.planim}"><i class="fa-solid fa-list-check"></i> <span>${T('planim')}</span></a>
            <a href="${L.planimGunluk}"><i class="fa-solid fa-utensils"></i> <span>${T('amGunlukTakip')}</span></a>
            <!-- Başlık DİNAMİK (Beyar belgesi, 2026-08-20): *"Programı olmayan
                 kullanıcıda başlık dinamik olarak 'Programını Bul'"*. Ölçüt
                 DD_AUTH.hasProgram — DietShell::auth() bunu "AKTİF programı
                 var mı" diye ölçer; hasData DEĞİL. -->
            <a href="${L.planimProgram}"><i class="fa-solid fa-clipboard-list"></i> <span>${AU.hasProgram ? T('amProgramim') : T('amPrograminiBul')}</span></a>
            <a href="${L.planimIlerleme}"><i class="fa-solid fa-chart-line"></i> <span>${T('amIlerlemem')}</span></a>
            <a href="${L.planimAlisveris}"><i class="fa-solid fa-basket-shopping"></i> <span>${T('amAlisveris')}</span></a>
            <div class="acct-div"></div>
            <!-- GRUP 2 — Destek ve içerikler.
                 fa-user-doctor UYDURMA DEĞİL: bu depoda diyetisyen yüzeyinin
                 ikonudur — drawer'ın Diyetisyenler kalemi, bottom-nav'ın orta
                 FAB'ı ve diet/planim/_shell.blade.php:28in uzman sekmesi
                 aynı ikonu taşıyor. -->
            <a href="${L.planimUzman}"><i class="fa-solid fa-user-doctor"></i> <span>${T('amUzman')}</span></a>
            <a href="${L.planimKayit}"><i class="fa-solid fa-bookmark"></i> <span>${T('amKaydettiklerim')}</span></a>
            <a href="${L.planimProfil}"><i class="fa-solid fa-heart-pulse"></i> <span>${T('amSaglikProfilim')}</span></a>
            <div class="acct-div"></div>
            <!-- GRUP 3 — Üyelik ve Hesap. BELGEDEKİ SIRA: Aboneliğim ve
                 Ödemelerim · Hesap ve Ayarlar · Destek Merkezi · Çıkış.

                 🔴 BİRİNCİ VE ÜÇÜNCÜ KALEM KOŞULLUDUR. Ekranlarını bu şerit
                 KURMADI (iki ayrı şerit kuruyor) ve rotaları bugün KAYITLI
                 DEĞİL. Bu yüzden acctItem() ile basılıyorlar: hedef yoksa
                 kalem HİÇ ÇİZİLMEZ — "Yakında" rozeti de yok. Kayıtlı dersin
                 gereği (CLAUDE.md §6): kaydı olmayan rotanın menü kalemi
                 görünürse tıklayan 404 alır.
                 Rota doğduğu gün DietShell::links() hedefi gönderir ve kalem
                 kendiliğinden belirir; buraya bir daha dokunulmaz.

                 İKONLAR UYDURULMADI:
                 · fa-receipt — Beyar'ın bilgi mimarisi referansı olarak
                   verdiği üyelik/faturalandırma maketinin kendi ikonudur
                   (o maketten bu projeye ikon adından BAŞKA hiçbir şey
                   gelmedi: ne CSS, ne markup, ne marka izi).
                 · fa-headset — BU DEPONUN kendi destek yüzeyinin ikonu:
                   diet/kurumsal/cozum-merkezi.blade.php:115.
                 · fa-sliders — degismedi (asagidaki notu koru).

                 ONAYLI YAPISAL SAPMA (Beyar, 2026-08-18 / T5.0):
                 referansta "Hesap ve Ayarlar" kalemi YOKTU. Ad, ikon ve
                 yerlesim UYDURULMADI — panel kabugunun kendi sozlesmesinden
                 alindi (admin/layout.blade.php:200: fa-sliders + "Hesap
                 Ayarlari").
                 ⚠ ADI "Hesap ve Ayarlar" OLDU (Beyar belgesi, 2026-08-20);
                 yonetim panelinin kendi etiketi DEGISMEDI — iki yuzey artik
                 mesru olarak ayrisiyor (A5ShellParityTest docblock'u).
                 Dokum: docs/parite/T5.0-sapma.md §3. -->
            ${acctItem(L.abonelikOdemeler, 'fa-receipt', T('amAbonelik'))}
            <a href="${L.hesabim}"><i class="fa-solid fa-sliders"></i> <span>${T('amHesapAyarlar')}</span></a>
            ${acctItem(L.destekMerkezi, 'fa-headset', T('amDestekMerkezi'))}
            <a href="#" data-logout="1" class="acct-logout"><i class="fa-solid fa-right-from-bracket"></i> <span>${T('amCikis')}</span></a>
          </div>
        </div>
        <button class="icon-btn hamburger" id="hamburger" aria-label="${T('menuAria')}"><i class="fa-solid fa-bars"></i></button>
      </div>
    </div>
  </div>
</header>

<!-- ===== MOBİL DRAWER (≤1024px) ===== -->
<div class="drawer-overlay" id="drawerOverlay"></div>
<aside class="drawer" id="drawer" aria-label="${T('drawerAria')}">
  <div class="drawer-head">
    <a class="drawer-brand" href="${L.saglikHub}" aria-label="${T('markaEtiketi')}">
      <svg class="dd-mark" viewBox="0 0 44 44" aria-hidden="true">
        <rect x="3" y="3" width="38" height="38" rx="11" fill="#009A44"/>
        <path d="M30 12 C20 12 14 18 14 27 C14 28.4 14.2 29.7 14.6 31 C24 31 31 25 31 14.2 C31 13.4 30.6 12.7 30 12 Z" fill="#fff" opacity=".96"/>
        <path d="M16 31 C18 24 22 18 29 14" stroke="#009A44" stroke-width="2.1" fill="none" stroke-linecap="round"/>
      </svg>
      <span class="dd-word"><b>Dada</b><span class="dd-st">Diet</span></span>
    </a>
    <button class="drawer-close" id="drawerClose" aria-label="${T('drawerKapat')}"><i class="fa-solid fa-xmark"></i></button>
  </div>
  <!-- AKORDEON — en fazla iki seviye. Başlığın kendisi merkez sayfaya gider;
       sağdaki ok YALNIZCA alt menüyü açar (JS ok tıklamasını kesip toggle eder). -->
  <nav class="drawer-nav">
    <div class="d-item d-has-sub">
      <a class="d-link${AD('araclar')}" href="${L.saglikAraclari}"${ARIA('araclar')}><span><i class="fa-solid fa-toolbox"></i> ${T('navAraclar')}</span><i class="fa-solid fa-chevron-down" style="padding:14px;margin:-14px" aria-hidden="true"></i></a>
      <div class="d-sub">
        <a href="${L.saglikAraclari}"><i class="fa-solid fa-toolbox"></i> ${T('navTumAraclar')}</a>
        <a href="${L.hesaplayicilar}"><i class="fa-solid fa-calculator"></i> ${T('navHesaplayicilar')}</a>
        <a href="${L.testler}"><i class="fa-solid fa-clipboard-question"></i> ${T('navTestler')}</a>
      </div>
    </div>
    <div class="d-item d-has-sub">
      <a class="d-link${AD('beslenme')}" href="${L.beslenmeHub}"${ARIA('beslenme')}><span><i class="fa-solid fa-seedling"></i> ${T('navBeslenme')}</span><i class="fa-solid fa-chevron-down" style="padding:14px;margin:-14px" aria-hidden="true"></i></a>
      <div class="d-sub">
        <a href="${L.beslenmeRehberi}"><i class="fa-solid fa-book-open"></i> ${T('navRehber')}</a>
        <a href="${L.besinKutuphanesi}"><i class="fa-solid fa-magnifying-glass"></i> ${T('navKutuphane')}</a>
        <a href="${L.beslenmeIpuclari}"><i class="fa-solid fa-lightbulb"></i> ${T('navIpuclari')}</a>
        <a href="${L.kacKalori}"><i class="fa-solid fa-fire"></i> ${T('navKacKalori')}</a>
        <a href="${L.pufNoktalari}"><i class="fa-solid fa-lightbulb"></i> ${T('navPufNoktalari')}</a>
        <a${SOON}><i class="fa-solid fa-utensils"></i> ${T('navTarifler')}${SOONB}</a>
      </div>
    </div>
    <div class="d-item d-has-sub">
      <a class="d-link${AD('programlar')}" href="${L.programlar}"${ARIA('programlar')}><span><i class="fa-solid fa-clipboard-list"></i> ${T('navProgramlar')}</span><i class="fa-solid fa-chevron-down" style="padding:14px;margin:-14px" aria-hidden="true"></i></a>
      <div class="d-sub">
        <a href="${L.programBul}"><i class="fa-solid fa-wand-magic-sparkles"></i> ${T('navProgramBul')}</a>
        <a href="${L.programlar}?hedef=tumu"><i class="fa-solid fa-bullseye"></i> ${T('navHedefeGore')}</a>
        <a href="${L.programlar}?yasam=tumu"><i class="fa-solid fa-people-roof"></i> ${T('navYasamBicimi')}</a>
        <a href="${L.programlar}?tercih=tumu"><i class="fa-solid fa-seedling"></i> ${T('navTercih')}</a>
        <a href="${L.programlar}?ihtiyac=tumu"><i class="fa-solid fa-list-check"></i> ${T('navIhtiyac')}</a>
        <a href="${L.programSure}"><i class="fa-regular fa-calendar"></i> ${T('navSure')}</a>
      </div>
    </div>
    <!-- Diyetisyenler drawer'da da akordeon DEĞİL: tek satırlık doğrudan
         bağlantı. .d-has-sub yok, ok yok, .d-sub yok — masaüstüyle aynı. -->
    <div class="d-item">
      <a class="d-link${AD('diyetisyenler')}" href="${L.diyetisyenler}"${ARIA('diyetisyenler')}><span><i class="fa-solid fa-user-doctor"></i> ${T('navDiyetisyenler')}</span></a>
    </div>
    <!-- ===== HESAP — MOBİLİN AÇILIR KULLANICI MENÜSÜ =====================
         🔴 ÖLÇÜLMÜŞ KUSURUN KAPANDIĞI YER. Bugüne kadar masaüstü .acct-menu
         11 kalem basıyordu, mobil ise YALNIZ 4 (drawer-foot'taki .da-links
         satırı: Planım · Günlük Takip · Veri ve İzinler · Hesap Ayarları).
         Yani mobil kullanıcı yedi kalemi HİÇ göremiyordu — .acct-wrap
         <=1024px'te display:none (dd-shell.css:975). Artık iki yüzey aynı
         dokuz kalemi AYNI SIRAYLA taşıyor; kapı bunu ölçüyor
         (tests/Feature/Kabuk/KullaniciMenusuKapisiTest.php).
         ⚠ SAYI GÜNCEL DEĞİL: 2026-08-21'de Planım kalemi düştü, iki yüzey
         artık SEKİZ kalem + Çıkış taşıyor.

         NEDEN BURADA, drawer-foot'ta DEĞİL: .drawer-nav kaydırılabilir
         (flex:1;overflow-y:auto), .drawer-foot ise flex:none. On kalem
         foot'a konsaydı akordeon açıldığında foot büyür, nav'ı ezer ve
         taşan kısım hiçbir yere kaydırılamazdı.

         NEDEN .drawer-acct SARMALAYICISI: giriş kapısı CSS'tedir
         (.drawer-acct{display:none} + body.is-auth .drawer-acct{display:flex})
         ve bu, drawer'daki TEK is-auth kapılı kaptır. Kabuk iki durumu da
         BASAR, gizlemeyi CSS yapar — prototipin ?auth=1 demo anahtarı
         render'dan SONRA çalıştığı için koşullu basmak onu bozardı. Yeni
         sınıf/yeni CSS yazmak yasak (CLAUDE.md §3.1 md.1), bu yüzden var
         olan kap yeniden kullanıldı; satır içi iki bildirim yalnız kabın
         satır düzenini sütuna çeviriyor — dosyanın kendi emsali
         (.drawer-login'in style="width:100%"i, ok ikonlarının
         style="padding:14px;margin:-14px"i).

         Başlık "Hesabım" UYDURULMADI: masaüstünde bu menüyü açan düğmenin
         kendi adıdır (.acct-btn aria-label="Hesabım") ve .acct-id'nin ad
         yedeğidir. İkon fa-regular fa-user, kabuğun kendi "Giriş Yap"
         kaleminden gelir. Grup başlıkları .d-sub-group sınıfıyla basılır
         (dd-shell.css:1030) ve metinleri Beyar'ın belgesindeki üç grup
         adıdır. -->
    <div class="drawer-acct" style="padding:0">
      <div class="d-item d-has-sub" style="width:100%">
        <a class="d-link" href="${L.planim}"><span><i class="fa-regular fa-user"></i> ${T('hesabim')}</span><i class="fa-solid fa-chevron-down" style="padding:14px;margin:-14px" aria-hidden="true"></i></a>
        <div class="d-sub">
          <!-- 🔴 BU LİSTE MASAÜSTÜNÜN AYNISIDIR — kalem kalem, SIRA SIRA.
               Ölçülmüş kusur tam buydu: masaüstü 11 kalem basarken çekmece
               yalnız 4 basıyordu ve hiçbir kapı görmüyordu
               (KullaniciMenusuKapisiTest, 5. test). Bir kalemi yalnız bir
               yüzeyde değiştirmek kapıyı HAKLI OLARAK kırmızıya düşürür.
               Koşullu iki kalem de İKİ YÜZEYDE AYNI koşulu okur (L.<anahtar>);
               biri basılıp diğeri basılmazsa yüzeyler yine ayrışırdı.
               Akordeonun BAŞLIK bağlantısı (.d-link "Hesabım") bir kalem
               değil kapağıdır ve hedefi L.planim olarak KALIR. -->
          <div class="d-sub-group">${T('amGrupGunluk')}</div>
          <a href="${L.planim}"><i class="fa-solid fa-list-check"></i> ${T('planim')}</a>
          <a href="${L.planimGunluk}"><i class="fa-solid fa-utensils"></i> ${T('amGunlukTakip')}</a>
          <a href="${L.planimProgram}"><i class="fa-solid fa-clipboard-list"></i> ${AU.hasProgram ? T('amProgramim') : T('amPrograminiBul')}</a>
          <a href="${L.planimIlerleme}"><i class="fa-solid fa-chart-line"></i> ${T('amIlerlemem')}</a>
          <a href="${L.planimAlisveris}"><i class="fa-solid fa-basket-shopping"></i> ${T('amAlisveris')}</a>
          <div class="d-sub-group">${T('amGrupDestek')}</div>
          <a href="${L.planimUzman}"><i class="fa-solid fa-user-doctor"></i> ${T('amUzman')}</a>
          <a href="${L.planimKayit}"><i class="fa-solid fa-bookmark"></i> ${T('amKaydettiklerim')}</a>
          <a href="${L.planimProfil}"><i class="fa-solid fa-heart-pulse"></i> ${T('amSaglikProfilim')}</a>
          <div class="d-sub-group">${T('amGrupHesap')}</div>
          ${drawerItem(L.abonelikOdemeler, 'fa-receipt', T('amAbonelik'))}
          <a href="${L.hesabim}"><i class="fa-solid fa-sliders"></i> ${T('amHesapAyarlar')}</a>
          ${drawerItem(L.destekMerkezi, 'fa-headset', T('amDestekMerkezi'))}
          <a href="#" data-logout="1"><i class="fa-solid fa-right-from-bracket"></i> ${T('amCikis')}</a>
        </div>
      </div>
    </div>
  </nav>
  <div class="drawer-foot">
    <!-- LOGIN-STATE: logged-out giriş butonu -->
    ${loginLink('btn btn-primary drawer-login', ' style="width:100%"')}
    <!-- LOGIN-STATE: logged-in kimlik satırı — kimlik gerçek oturumdan (DD_AUTH).
         🔴 .da-links SATIRI KALDIRILDI. Beş kısayol taşıyordu (Planım · Günlük
         Takip · Veri ve İzinler · Hesap Ayarları · Çıkış) ve mobilin hesap
         menüsü FİİLEN BUYDU — masaüstünün on bir kaleminden yedisi burada hiç
         yoktu. Kalemler yukarıdaki hesap akordeonuna taşındı; KAYBOLAN KALEM
         YOK: Planım · Günlük Takip · Çıkış aynen orada, "Hesap Ayarları" adı
         "Hesap ve Ayarlar" oldu, "Veri ve İzinler" ise Beyar'ın 2026-08-20
         belgesi gereği bağımsız bağlantı olmaktan çıkıp o merkezin içine girdi.
         Satır burada kalsaydı iki hesap menüsü birden bulunurdu ve ikisi
         ayrışabilirdi — kapının önlediği kusurun ta kendisi.
         Geriye kalan satır artık masaüstündeki .acct-id kimlik bloğunun
         mobil karşılığıdır: avatar + ad, bağlantı yok. -->
    <div class="drawer-acct">
      ${ddAvaSpan('da-ava')}
      <div class="da-info">
        <b>${esc(AU.name) || T('hesabim')}</b>
      </div>
    </div>
    <!-- Planım: mobilde header sağ bloğu daraldığı için kişisel buton buraya devreder -->
    <a href="${L.planim}" class="drawer-add"><i class="fa-solid fa-list-check"></i> ${T('planim')}</a>
    <!-- KOPRU: mobilde topbar gizli (<=640) -> ana siteye donus buradan.
         Beyar karari 2026-08-18: hedef SABIT DIS URL (DD_DIS), rota
         COZULMEZ. Etiket referansin kendi metnidir; kaynakta 2026-08-17'de
         yasakli marka adindan bugunku adina duzeltilmisti.
         NOT: bu yorum template literal ICINDE — ters tirnak YAZILMAZ. -->
    <a href="${DD_DIS.gastro}" class="drawer-add"><i class="fa-solid fa-arrow-left-long"></i> DadaGastro'ya Dön</a>
    ${drawerLangHTML()}
  </div>
</aside>

<!-- ===== MOBİL BOTTOM NAV (≤640px) ===== -->
<nav class="bottom-nav" aria-label="${T('bottomNavAria')}">
  <a href="${L.saglikAraclari}" class="bn-item"><i class="fa-solid fa-toolbox"></i><span>${T('navAraclar')}</span></a>
  <a href="${L.beslenmeHub}" class="bn-item"><i class="fa-solid fa-seedling"></i><span>${T('navBeslenme')}</span></a>
  <a href="${L.diyetisyenler}" class="bn-item bn-center"><span class="bn-fab"><i class="fa-solid fa-user-doctor"></i></span><span>${T('navDiyetisyen')}</span></a>
  <a href="${L.programlar}" class="bn-item"><i class="fa-solid fa-clipboard-list"></i><span>${T('navProgramlar')}</span></a>
  <a href="${DD_DIS.gastro}" class="bn-item"><i class="fa-solid fa-house"></i><span>Ana Site</span></a>
</nav>

<!-- SAG KENAR DIKEY SERIT (Beyar karari 2026-08-24). 8px genislik,
     viewport boyu, kenara yasli surekli bant; Gorus Bildir etiketi onun
     ustunde durur. Salt gorsel: aria-hidden, tiklanamaz.
     UYARI: bu yorum bir template literal ICINDEdir; backtick YAZILAMAZ,
     yazilirsa sablon orada kapanir ve dosya sozdizimi kirilir (olculdu). -->
<div class="edge-rail" aria-hidden="true"></div>

<!-- ===== GÖRÜŞ BİLDİR (sağ kenar sabit etiket) ===== -->
<a class="feedback-tab" id="fbTab" style="cursor:pointer" aria-label="${T('fbTabAria')}">
  <i class="fa-solid fa-comment-dots"></i> ${T('fbBaslik')}
</a>

<!-- ===== GÖRÜŞ BİLDİR MODAL ===== -->
<div class="fb-overlay" id="fbOverlay"></div>
<div class="fb-modal" id="fbModal" role="dialog" aria-modal="true" aria-label="${T('fbBaslik')}">
  <div class="fb-panel">
    <div class="fb-head">
      <div>
        <h3>${T('fbBaslik')}</h3>
        <p>${T('fbAciklama')}</p>
      </div>
      <button class="fb-close" id="fbClose" type="button" aria-label="${T('kapat')}"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="fb-body">
      <form id="fbForm" method="post" action="${L.gorusBildir || ''}">
        <!-- M17: konu tipine göre alan seti değişir (Onedio referansı, mevcut dil korunarak) -->
        <div class="fb-topics" role="group" aria-label="${T('fbKonuSec')}">
          <button class="fb-topic active" type="button" data-topic="oneri"><i class="fa-solid fa-lightbulb"></i> ${T('fbKonuOneri')}</button>
          <button class="fb-topic" type="button" data-topic="soru"><i class="fa-solid fa-circle-question"></i> ${T('fbKonuSoru')}</button>
          <button class="fb-topic" type="button" data-topic="sorun"><i class="fa-solid fa-bug"></i> ${T('fbKonuSorun')}</button>
          <button class="fb-topic" type="button" data-topic="ihlal"><i class="fa-solid fa-shield-halved"></i> ${T('fbKonuIhlal')}</button>
          <button class="fb-topic" type="button" data-topic="puan"><i class="fa-solid fa-face-smile"></i> ${T('fbKonuPuan')}</button>
        </div>

        <div class="fb-fields active" data-for="oneri">
          <!-- R26 (Beyar, revizyon turu 2026-08-24 · A5 kararı): kardeş markalara
               ait kalemler kalktı, yerine DadaDiet'in kendi altı alanı geldi.
               Anahtarlar YENİ değil — sitenin ana
               navigasyonundaki navXxx sözlüğünden aynen alındı (DietShell.php
               ~400-434), aynı TR dizesi başka bağlamda zaten __() ile
               çevrilmiş olduğu için ikinci bir anahtar açılmadı. -->
          <div class="fb-chiprow" role="group" aria-label="${T('fbIlgiliAlan')}">
            <button class="chip active" type="button">${T('navTestler')}</button>
            <button class="chip" type="button">${T('navHesaplayicilar')}</button>
            <button class="chip" type="button">${T('navRehber')}</button>
            <button class="chip" type="button">${T('navKutuphane')}</button>
            <button class="chip" type="button">${T('navDiyetisyenler')}</button>
            <button class="chip" type="button">${T('navProgramlar')}</button>
            <button class="chip" type="button">${T('fbDiger')}</button>
          </div>
          <div class="fb-field"><textarea name="body" required placeholder="${T('fbOneriPh')}"></textarea></div>
          <div class="fb-field"><input type="email" name="email" placeholder="${T('fbEpostaOps')}" /></div>
        </div>

        <div class="fb-fields" data-for="soru">
          <div class="fb-field">
            <select class="fb-select" name="ek_konu" required>
              <option value="" selected disabled>${T('fbSoruKonusu')}</option>
              <option>${T('fbOptUyelikHesap')}</option>
              <option>${T('navTestler')}</option>
              <option>${T('fbOptDiyetisyenRandevu')}</option>
              <option>${T('navHesaplayicilar')}</option>
              <option>${T('fbDiger')}</option>
            </select>
          </div>
          <div class="fb-field"><textarea name="body" required placeholder="${T('fbSoruPh')}"></textarea></div>
          <div class="fb-field"><input type="email" name="email" required placeholder="${T('fbEpostaCevap')}" /></div>
        </div>

        <div class="fb-fields" data-for="sorun">
          <div class="fb-field">
            <select class="fb-select" name="ek_konu" required>
              <option value="" selected disabled>${T('fbNerede')}</option>
              <option>${T('fbOptAnasayfa')}</option>
              <option>${T('navRehber')}</option>
              <option>${T('fbOptArama')}</option>
              <option>${T('fbOptUyelikGiris')}</option>
              <option>${T('navKutuphane')}</option>
              <option>${T('fbOptMobil')}</option>
            </select>
          </div>
          <div class="fb-field"><textarea name="body" required placeholder="${T('fbSorunPh')}"></textarea></div>
          <button class="fb-shot" type="button"><i class="fa-solid fa-image"></i> ${T('fbEkranGoruntusu')} <small>${T('fbOpsiyonel')}</small></button>
          <div class="fb-field"><input type="email" name="email" placeholder="${T('fbEpostaOps')}" /></div>
        </div>

        <div class="fb-fields" data-for="ihlal">
          <div class="fb-field"><input type="url" name="ek_baglanti" required placeholder="${T('fbIhlalLink')}" /></div>
          <div class="fb-field">
            <select class="fb-select" name="ek_konu" required>
              <option value="" selected disabled>${T('fbIhlalTuru')}</option>
              <option>${T('fbOptTelif')}</option>
              <option>${T('fbOptUygunsuz')}</option>
              <option>${T('fbOptSpam')}</option>
              <option>${T('fbDiger')}</option>
            </select>
          </div>
          <div class="fb-field"><textarea name="body" required placeholder="${T('fbAciklamaPh')}"></textarea></div>
          <div class="fb-field"><input type="email" name="email" required placeholder="${T('fbEpostaZorunlu')}" /></div>
        </div>

        <div class="fb-fields" data-for="puan">
          <!-- MARKA SIZINTISI (2026-08-17): Diet'in kendi gorus formu baska
               markanin deneyimini soruyordu. Form diet.feedback.store ucuna
               gidiyor, yani toplanan veri Diet'in — soru da Diet'i sormali.
               NOT: bu yorum template literal ICINDE — ters tirnak YAZILMAZ. -->
          <p class="fb-q">${T('fbPuanSoru')}</p>
          <div class="fb-emoji" role="group" aria-label="${T('fbPuan')}">
            <button type="button" data-val="1" aria-label="${T('fbPuan1')}">😡</button>
            <button type="button" data-val="2" aria-label="${T('fbPuan2')}">🙁</button>
            <button type="button" data-val="3" aria-label="${T('fbPuan3')}">😐</button>
            <button type="button" data-val="4" aria-label="${T('fbPuan4')}">🙂</button>
            <button type="button" data-val="5" aria-label="${T('fbPuan5')}">😍</button>
          </div>
          <div class="fb-field"><textarea name="body" placeholder="${T('fbPuanPh')}"></textarea></div>
          <div class="fb-field"><input type="email" name="email" placeholder="${T('fbEpostaOps')}" /></div>
        </div>

        <label class="fb-kvkk">
          <input type="checkbox" name="kvkk_onay" value="1" required />
          <span>${T('fbKvkkOnay').split(':belge').join('<a href="' + L.yasalKvkk + '">' + T('fbKvkkBelge') + '</a>')}</span>
        </label>
        <p class="fb-q" id="fbError" role="alert" hidden><i class="fa-solid fa-circle-exclamation"></i> <span id="fbErrorText"></span></p>
        <button class="btn btn-primary fb-send" type="submit"><i class="fa-solid fa-paper-plane"></i> ${T('fbGonder')}</button>
      </form>
      <div class="fb-success" id="fbSuccess" hidden>
        <span class="ok"><i class="fa-solid fa-check"></i></span>
        <h4>${T('fbBasariBaslik')}</h4>
        <p>${T('fbBasariMetin')}</p>
      </div>
    </div>
  </div>
</div>

<!-- ===== ÇEREZ ONAY BANNER =====
     ŞERİT İLE METİN ÇELİŞİYORDU (2026-08-15). Şerit "siteyi kullanmaya devam
     ederek kabul etmiş olursun" diyordu — zımnî onay. Çerez Politikası ise
     "zorunlu çerezler dışındaki tüm kategoriler varsayılan olarak kapalıdır"
     diyor. İkisi aynı anda doğru olamaz; DOĞRU OLAN METİNDİR, şerit ona
     uyduruldu (Beyar emri).

     Şeridin yeni cümlesi ÖLÇÜLDÜ, varsayılmadı: Diet kabuğunda üçüncü taraf
     ölçüm/reklam betiği YOK (gtag · GTM · Analytics · Hotjar · Matomo ·
     Facebook için tarandı, sıfır sonuç), Diet denetleyicilerinin hiçbiri
     ViewCounter'ı çağırmıyor. Geriye oturum ve CSRF çerezleri ile tarayıcının
     kendi yerel depolaması kalıyor.

     "Reddet" + "Tümünü Kabul Et" DÜŞTÜ, tek "Anladım" kaldı — kardeş
     markaların şeritlerinde alınan (Beyar onaylı, 2026-08-11) AYNI karar, AYNI
     gerekçeyle: seçim yalnız localStorage'a yazılıyor, sunucuya hiç gitmiyor
     ve okuyan tek satır kod yok; reddedenin çerez kümesi kabul edenle birebir
     aynı kalıyordu. Kapatılabilecek isteğe bağlı bir çerez olmadığı sürece
     "Reddet" yerine getirilemeyen bir vaattir. -->
<div class="cookie-banner" id="cookieBanner" role="dialog" aria-label="${T('cookieAria')}" aria-live="polite">
  <div class="cookie-inner">
    <div class="cookie-text">
      <span class="cookie-ico"><i class="fa-solid fa-cookie-bite"></i></span>
      <p>${T('cookieMetin')} <a href="${L.yasalCerez}">${T('cookiePolitika')}</a> · <a href="${L.yasalKvkk}">${T('fbKvkkBelge')}</a></p>
    </div>
    <div class="cookie-actions">
      <button type="button" class="btn-cookie-accept" id="cookieAccept">${T('cookieKabul')}</button>
    </div>
  </div>
</div>

<!-- ===== ANA İÇERİK (footer reveal perdesi) ===== -->
`; }

/* =====================================================================
   ALT KROM — lg-gate + footer + DadaMentor FAB + scroll-top

   ÜÇ PARÇA — ayrı ayrı yerleştirilebilir:
     #ddChromeGate    lg-gate (giriş kapısı)
     #ddChromeFooter  footer
     #ddChromeFab     DadaMentor + başa dön
     #ddChromeBottom  üçü birden, kanonik sırada (çoğu sayfa bunu kullanır)
   Sayfalar bu blokları farklı sıralarda taşıyor (bazısında FAB en üstte) ve
   aralarına kendi markup'ını koyuyor (tıbbi bilgilendirme şeridi). Ayrı yer
   tutucular sayesinde DOM sırası ayırma öncesiyle birebir aynı kalıyor.
   ===================================================================== */
function gateHTML(){ return `<!-- ===== LG-GATE (giriş kapısı) — logged-out mikro-aksiyon (yorum/kaydet/takip) =====
     Markup </main> SONRASINA (lessons: fixed overlay page-main stacking context'ine girmez).
     body.is-auth iken hiç açılmaz; data-lg-gate taşıyan öğeler tetikler. SS: ?lg=1 -->
<div class="lg-overlay" id="lgOverlay"></div>
<div class="lg-gate" id="lgGate" role="dialog" aria-modal="true" aria-label="${T('lgAria')}">
  <div class="lg-panel">
    <button class="lg-close" id="lgClose" type="button" aria-label="${T('kapat')}"><i class="fa-solid fa-xmark"></i></button>
    <span class="lg-ico"><i class="fa-solid fa-lock"></i></span>
    <h4 id="lgTitle">${T('lgBaslik')}</h4>
    <!-- MARKA SIZINTISI DUZELTILDI (2026-08-17, footer turunda olculdu):
         metin baska bir markanin hesap adini soyluyordu. Marka izolasyonu
         kurali (talimat §3): hicbir yuzey baska markanin adini/host'unu
         tasimaz. DadaDiet'e cevrildi. -->
    <p id="lgDesc">${T('lgAciklama')}</p>
    <div class="lg-acts">
      ${loginLink('btn btn-primary')}
      <a class="btn btn-ghost" href="${L.saglikHub}">${T('lgAnaSayfa')}</a>
    </div>
  </div>
</div>


`; }

/* footHTML() KALDIRILDI — markup silinmedi, TASINDI (Beyar karari, 2026-08-17).
   Yeni yeri: resources/views/partials/diet/footer.blade.php
   Yerlestirme: layouts/diet.blade.php, `#ddChromeFooter` yer tutucusunun TAM
   yerinde `@include('partials.diet.footer')`.

   Gerekce: kardes markalarin ikisi de Blade partial kullaniyor; Diet tek
   istisnaydi ve bedeli olculmustu — kabuk JS'i `__()` yolunu goremedigi icin
   footer metinleri lang/en.json'a hic ugramiyordu (config/diet.php
   `locale_enabled` notu).

   ⚠ Bu dosyadaki FOOTER REVEAL IIFE (asagida) `.footer`i DOM'dan okumaya
   DEVAM EDIYOR ve calisiyor: boot() DOMContentLoaded'da kosar, sunucudan
   basilan footer o an DOM'dadir. Perde davranisi degismedi — kanit:
   scripts/diet-footer-parity.mjs. */

function fabHTML(){ return `<!-- ===== ADIM 3 KABUK: DadaMentor FAB (sol-alt) + scroll-top (sağ-alt) — </main>/footer sonrası ===== -->
<aside class="mentor-panel floating mini" id="mentorPanel" data-state="mini" aria-label="${T('mpAria')}">
  <div class="mp-media">
    <div class="mp-atmos"></div>
    <video id="mentorVideo" autoplay muted loop playsinline preload="auto">
      <source src="${DDA}video/mentor-panel.mp4" type="video/mp4" />
    </video>
  </div>
  <div class="mp-fade"></div>
  <div class="mp-mini-overlay" id="mpMiniOv" aria-hidden="false">
    <span class="mav"><i class="fa-solid fa-compass"></i></span>
    <span class="mp-mini-lbl">${T('mpMiniLbl')}</span>
  </div>
  <div class="mp-top">
    <span class="mp-tag"><i class="fa-solid fa-comment-dots"></i> Mentor</span>
    <button class="mp-toggle" type="button" id="mpToggle" aria-label="${T('mpKucult')}">
      <i class="fa-solid fa-minus" id="mpToggleIco"></i>
    </button>
  </div>
  <div class="mp-chat">
    <div class="mp-id">
      <span class="mp-av"><i class="fa-solid fa-compass"></i></span>
      <span>
        <span class="nm"><span class="bd">Dada</span><span class="sf">Mentor</span></span><br>
        <span class="on"><span class="d"></span> ${T('mpOnline')}</span>
      </span>
    </div>
    <div class="mp-bubble" id="mpBubble">${T('mpBubble')}</div>
    <div class="mp-row">
      <a class="mp-opt" href="${L.saglikAraclari}">${T('navAraclar')}</a>
      <a class="mp-opt" href="${L.beslenmeHub}">${T('navBeslenme')}</a>
      <a class="mp-opt" href="${L.diyetisyenler}">${T('navDiyetisyenler')}</a>
      <a class="mp-opt w-gastro" href="${DD_DIS.gastro}"><span class="bd">Dada</span><span class="sf">Gastro</span></a>
      ${DD_DIS.fit
        ? '<a class="mp-opt w-fit" href="' + DD_DIS.fit + '"><span class="bd">Dada</span><span class="sf">Fit</span></a>'
        : '<a class="mp-opt w-fit" title="' + T('soon') + '" aria-disabled="true"' + SOON + '><span class="bd">Dada</span><span class="sf">Fit</span>' + SOONB + '</a>'}
    </div>
  </div>
</aside>
<button class="to-top" id="toTop" type="button" aria-label="${T('toTop')}"><i class="fa-solid fa-arrow-up" aria-hidden="true"></i></button>

`; }

function place(id, fn){
  var el = document.getElementById(id);
  if(el) el.outerHTML = fn();      /* yer tutucu SİLİNİR — sarmalayıcı kalmaz */
}

/* ############ FAZ A — hemen (SAYFA JS'inden önce) ############ */
place('ddChromeTop', topHTML);

// SS paramları
// ===== Login-state simülasyonu (mockup) — İA §2.3 sözleşmesi =====
// ?auth=1 → localStorage dm_auth='1' + body.is-auth ; ?auth=0 → temizle (logout)
// param yoksa localStorage'a bakılır. Çıkış linkleri ?auth=0'a yönlendirir (M7).
(function(){
  /* =====================================================================
     LARAVEL PORTU (2026-08-12) — GERCEK oturum sunucudan gelir.
     ---------------------------------------------------------------------
     `window.DD_AUTH` basilmissa (layouts/diet.blade.php) SAHTE DURUM
     ANAHTARLARI TAMAMEN DEVRE DISI kalir: ?auth / ?veri / ?role / ?level
     hicbir sey yapmaz, localStorage'a yazilmaz, dm_user okunmaz. Oturum,
     roller ve "verisi var mi" bilgisi Laravel'den gelir.

     DD_AUTH basilmamissa (prototipin kendisi file:// ile acildiginda)
     asagidaki eski simulasyon BIREBIR calismaya devam eder.
     ===================================================================== */
  if (window.DD_AUTH) {
    var sb = document.body, sa = window.DD_AUTH;
    if (sa.auth) {
      sb.classList.add('is-auth');
      if (sa.roles && sa.roles.length) sb.setAttribute('data-roles', sa.roles.join(' '));
      if (sa.verified) sb.setAttribute('data-verified', '1');
      if (sa.level) sb.setAttribute('data-level', String(sa.level));
      if (sa.hasData) sb.classList.add('has-data');
    }
    try { localStorage.removeItem('dm_user'); localStorage.removeItem('dm_veri'); } catch (e) {}
    return;
  }

  /* C1 — tek auth/rol token dm_user{auth,roles[],verified,level}. Eski dm_auth/dm_business
     migrate+silinir. Kök kuralı: auth ⟹ roles "kullanici" ile başlar; isletme operatörü
     ["kullanici","isletme"]. Class additive (is-auth/has-business AYNEN) + body[data-roles]. */
  var KEY='dm_user', OK={kullanici:1,antrenor:1,diyetisyen:1,isletme:1};
  function rd(){ try{var r=localStorage.getItem(KEY);return r?JSON.parse(r):null;}catch(e){return null;} }
  function wr(u){ try{localStorage.setItem(KEY,JSON.stringify(u));}catch(e){} }
  var u=rd();
  if(!u){                                   // migrasyon: eski binary flag → dm_user (bir kez)
    var oa=false,ob=false;
    try{oa=localStorage.getItem('dm_auth')==='1';}catch(e){}
    try{ob=localStorage.getItem('dm_business')==='1';}catch(e){}
    if(oa||ob){ u={auth:true,roles:['kullanici'],verified:false,level:0}; if(ob)u.roles.push('isletme'); wr(u); }
  }
  try{localStorage.removeItem('dm_auth');localStorage.removeItem('dm_business');}catch(e){}  // eski anahtar temizliği
  var qs=location.search;                    // URL-param (demo/SS akışı korunur + yeni roller)
  function ens(){ if(!u)u={auth:false,roles:[],verified:false,level:0}; }
  function addR(r){ ens(); if(OK[r]&&u.roles.indexOf(r)<0)u.roles.push(r); }
  if(qs.indexOf('auth=1')>-1){ ens(); u.auth=true; }
  else if(qs.indexOf('auth=0')>-1){ u=null; try{localStorage.removeItem(KEY);}catch(e){} }
  if(qs.indexOf('business=1')>-1){ ens(); u.auth=true; addR('isletme'); }
  else if(qs.indexOf('business=0')>-1){ if(u){var bi=u.roles.indexOf('isletme'); if(bi>-1)u.roles.splice(bi,1);} }
  var rm=/[?&]role=(antrenor|diyetisyen|isletme)/.exec(qs); if(rm){ ens(); u.auth=true; addR(rm[1]); }
  if(u){
    if(qs.indexOf('verified=1')>-1)u.verified=true; else if(qs.indexOf('verified=0')>-1)u.verified=false;
    var lm=/[?&]level=(\d+)/.exec(qs); if(lm)u.level=parseInt(lm[1],10)||0;
    if(u.auth&&u.roles.indexOf('kullanici')<0)u.roles.unshift('kullanici');   // kök her zaman önde
    wr(u);
  }
  var b=document.body, authed=!!(u&&u.auth);   // DOM: eski class kanalı (additive) + data-roles
  if(authed){
    b.classList.add('is-auth');
    if(u.roles.indexOf('isletme')>-1)b.classList.add('has-business');   // C3 köprü sinyali — AYNEN
    b.setAttribute('data-roles',u.roles.join(' '));
    if(u.verified)b.setAttribute('data-verified','1');
    if(u.level)b.setAttribute('data-level',String(u.level));
  }
  /* --- DEMO VERİ ANAHTARI (İA 3. faz) — içeriği olan / olmayan üye ayrımı.
     ?veri=1 / ?veri=0 auth gibi KALICIDIR. Varsayılan: içerik YOK; bu
     durumda hiçbir yerde boş kart gösterilmez, yönlendirici başlangıç
     durumu gösterilir. Ana sayfa ve 10 Planım sayfası aynı bayrağı okur. */
  var VK='dm_veri', vd=null;
  try{ vd=localStorage.getItem(VK); }catch(e){}
  if(qs.indexOf('veri=1')>-1){ vd='1'; try{localStorage.setItem(VK,'1');}catch(e){} }
  else if(qs.indexOf('veri=0')>-1){ vd='0'; try{localStorage.setItem(VK,'0');}catch(e){} }
  if(authed && vd==='1') b.classList.add('has-data');

  /* --- GİRİŞ SONRASI DÖNÜŞ — kullanıcı başladığı sayfaya döner, portala
     düşmez. Sözleşme: <sayfa>?auth=1&donus=<hedef>.html
     Yalnız aynı klasördeki .html hedefleri kabul edilir (açık yönlendirme yok). */
  var dm=/[?&]donus=([a-z0-9-]+\.html)/i.exec(qs);
  if(authed && dm && qs.indexOf('auth=1')>-1){ location.replace(dm[1]); }
})();

if(location.search.indexOf('dd=1')>-1){document.querySelector('.nav-item').classList.add('open');var _l=document.querySelector('.tb-lang[data-lang-dropdown]');if(_l)_l.classList.add('open');}
if(location.search.indexOf('drawer=1')>-1){window.addEventListener('DOMContentLoaded',function(){document.getElementById('drawer').classList.add('open');document.getElementById('drawerOverlay').classList.add('open');var _s=document.querySelector('.d-has-sub');if(_s)_s.classList.add('open');if(window.__hdrLock)window.__hdrLock(true);});}

// header: VARSAYILAN katı (banner'ı olmayan sayfa). heroMode=true → banner
// üstünde şeffaf, ~60px scroll sonrası katı (v3a davranışı; ?hdr=solid ile
// yine zorla katı). Yükseklik iki durumda da aynı: yalnız background,
// border-color ve box-shadow değişir, .header fixed olduğu için sayfa sıçramaz.
//
// window.__hdrLock(true|false) — drawer ile kabuk arasındaki arayüz. Drawer
// açıkken header KATI olur: açık drawer'ın kendi zemini var ve şeffaf header
// onun üstünde okunmaz kalıyordu. Kapanınca kaldığı yere göre yeniden karar
// verilir (kullanıcı drawer açıkken kaydırmış olabilir).
(function(){
  var header=document.querySelector('.header');
  var heroMode=HERO;
  var forceSolid=location.search.indexOf('hdr=solid')>-1;
  var locked=false;
  function onScroll(){
    if(!heroMode||forceSolid||locked){header.classList.remove('at-top');return;}
    if(window.scrollY<60){header.classList.add('at-top');}else{header.classList.remove('at-top');}
  }
  window.__hdrLock=function(on){locked=!!on;onScroll();};
  onScroll(); window.addEventListener('scroll',onScroll,{passive:true});
})();

/* ############ FAZ B — DOMContentLoaded (SAYFA JS'inden sonra) ############ */
function boot(){
/* Sayfa kabuk parçalarını KENDİ SIRASINDA yerleştirir. Çoğu sayfa tek
   #ddChromeBottom koyar ve üçünü kanonik sırada alır; sırası farklı olan ya da
   aralarına kendi markup'ını koyan sayfalar üç yer tutucuyu ayrı ayrı koyar. */
place('ddChromeGate',   gateHTML);
/* FOOTER ARTIK BURADAN BASILMIYOR (Beyar karari, 2026-08-17) — markup
   `resources/views/partials/diet/footer.blade.php`e tasindi ve
   `layouts/diet.blade.php` onu `#ddChromeFooter` yer tutucusunun TAM
   yerinde include ediyor. DOM sirasi degismedi (place() zaten outerHTML ile
   yerinde degistiriyordu). Asagidaki FOOTER REVEAL IIFE'ye DOKUNULMADI:
   `.footer` DOMContentLoaded aninda sunucudan gelmis olarak DOM'da duruyor,
   yani perde olcumu aynen calisiyor. */
place('ddChromeFab',    fabHTML);
place('ddChromeBottom', function(){ return gateHTML() + fabHTML(); });

// save / favorite toggle (recipes + products) — sayfada varsa çalışır
document.querySelectorAll('.r-save, .p-fav, .feat-save').forEach(function(btn){
  btn.addEventListener('click',function(e){
    e.stopPropagation();
    btn.classList.toggle('saved');
    var i=btn.querySelector('i');
    if(btn.classList.contains('saved')){i.classList.remove('fa-regular');i.classList.add('fa-solid');}
    else{i.classList.remove('fa-solid');i.classList.add('fa-regular');}
  });
});

// "tümünü gör" slider okları — data-track / data-dir ile genel
document.querySelectorAll('.row-nav button').forEach(function(b){
  b.addEventListener('click',function(){
    var t=document.getElementById(b.getAttribute('data-track'));
    if(t){t.scrollBy({left:b.getAttribute('data-dir')==='prev'?-620:620,behavior:'smooth'});if(t._pauseAuto)t._pauseAuto();}
  });
});

// Üst başlıklar GERÇEK bağlantıdır — tıklama merkez sayfaya gider, panel açma
// tetikleyicisi DEĞİLDİR (İA revizyonu). Panel yalnız hover ile açılır (CSS).
// .open sınıfı yalnız ?dd=1 ekran görüntüsü paramı için kalır.
document.addEventListener('click',function(e){
  if(!e.target.closest('.nav-item'))document.querySelectorAll('.nav-item.open').forEach(function(o){o.classList.remove('open')});
});

// ---- HESAP / EKLE dropdown (header sağ blok, login-state) tıkla-aç ----
document.querySelectorAll('.acct-item').forEach(function(it){
  var trigger=it.querySelector('.icon-btn,.acct-btn');
  if(!trigger||!it.querySelector('.acct-menu'))return;
  trigger.addEventListener('click',function(e){
    e.preventDefault();
    var wasOpen=it.classList.contains('open');
    document.querySelectorAll('.acct-item.open').forEach(function(o){o.classList.remove('open')});
    if(!wasOpen)it.classList.add('open');
  });
});
document.addEventListener('click',function(e){
  if(!e.target.closest('.acct-item'))document.querySelectorAll('.acct-item.open').forEach(function(o){o.classList.remove('open')});
});

/* ---- Esc AÇIK HESAP MENÜSÜNÜ KAPATIR ----
   ÖLÇÜLMÜŞ KUSUR (docs/E2E/D-menu-raporu.md §A.4): menü dışına tıklama
   kapatıyordu ama Escape'i dinleyen tek yer drawer'dı — 1440 ve 1024'te
   Esc'ten sonra `.acct-item.open` duruyor, panel `visibility:visible`
   kalıyordu. Klavye kullanıcısının açık menüden fareye dokunmadan çıkma
   yolu yoktu.

   · YALNIZ AÇIK MENÜ VARKEN iş yapar. Tuşu tekeline ALMAZ
     (stopPropagation/stopImmediatePropagation YOK): drawer, giriş kapısı
     ve geri bildirim modalı kendi Escape dinleyicilerini aynen sürdürür.
     İkisi birden açıkken ikisi birden kapanır — ölçüldü, raporlandı.
   · Odak menüyü AÇAN düğmeye döner. Dönmeseydi odak <body>ye düşerdi ve
     bir sonraki Tab sayfanın en başından başlardı.
   · CSS `:hover` kuralı (dd-shell.css:443) bu dinleyiciden bağımsızdır:
     fare panelin üstündeyken Esc `.open`ı düşürür ama hover panel
     görünür kalır. Fare uzaklaşınca kapanır — hover'ın kendi davranışı,
     bu turun kapsamı değil. */
document.addEventListener('keydown',function(e){
  if(e.key!=='Escape')return;
  var acik=document.querySelectorAll('.acct-item.open');
  if(!acik.length)return;
  var hedef=null;
  acik.forEach(function(o){
    o.classList.remove('open');
    if(!hedef)hedef=o.querySelector('.acct-btn,.icon-btn');
  });
  if(hedef)hedef.focus();
});

/* LARAVEL PORTU (2026-08-13) — GERÇEK çıkış. `[data-logout]` taşıyan her
   bağlantı (header hesap menüsü + drawer) buradan yakalanır. `<a href>`
   ile GET çıkış YAPILMAZ (CSRF korumalı POST rotası `logout`); gerçek bir
   `<form>` üretilip CSRF token'ı `<meta name="csrf-token">`den alınarak
   submit edilir — sayfanın normal Blade `@csrf` formlarıyla birebir aynı
   mekanizma, yalnız DOM'a JS'ten ekleniyor. */
document.addEventListener('click',function(e){
  var el=e.target.closest('[data-logout]');
  if(!el)return;
  e.preventDefault();
  if(!L.cikis)return;
  var meta=document.querySelector('meta[name="csrf-token"]');
  var f=document.createElement('form');
  f.method='POST';
  f.action=L.cikis;
  f.style.display='none';
  var t=document.createElement('input');
  t.type='hidden';t.name='_token';t.value=meta?meta.content:'';
  f.appendChild(t);
  document.body.appendChild(f);
  f.submit();
});

// ---- LG-GATE (giriş kapısı) — logged-out mikro-aksiyon kapısı ----
(function(){
  var gate=document.getElementById('lgGate');
  var overlay=document.getElementById('lgOverlay');
  if(!gate)return;
  function open(title,desc){
    if(document.body.classList.contains('is-auth'))return false;   // logged-in: kapı yok
    if(title)document.getElementById('lgTitle').textContent=title;
    if(desc)document.getElementById('lgDesc').textContent=desc;
    gate.classList.add('show');overlay.classList.add('show');document.body.style.overflow='hidden';
    return true;
  }
  function close(){gate.classList.remove('show');overlay.classList.remove('show');document.body.style.overflow='';}
  window.__lgGate=open;window.__lgGateClose=close;
  document.getElementById('lgClose').addEventListener('click',close);
  overlay.addEventListener('click',close);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&gate.classList.contains('show'))close();});
  // data-lg-gate taşıyan öğeler logged-out'ta kapıyı açar (capture: sayfa toggle'ından önce keser)
  document.addEventListener('click',function(e){
    var t=e.target.closest('[data-lg-gate]');
    if(!t)return;
    if(document.body.classList.contains('is-auth'))return;          // logged-in: normal davranış
    e.preventDefault();e.stopPropagation();
    open(t.getAttribute('data-lg-title'),t.getAttribute('data-lg-desc'));
  },true);
  if(location.search.indexOf('lg=1')>-1){open();}                    // SS paramı
})();

// ---- DİL SEÇİCİ (üst bant dropdown) ----
// YALNIZ AÇ/KAPA. Dil seçimi artık `<a href>` ile GERÇEK bir adres
// değişimidir — kalem tıklanınca sayfa o dilde yeniden render edilir ve
// etiketi SUNUCU basar. Eski hâli seçimi istemcide "simüle ediyor", yalnız
// `textContent`i değiştiriyordu: etiket EN oluyor, sayfa TR kalıyordu.
// Tek düğme modunda (`.tb-lang-one`) `[data-lang-dropdown]` hiç basılmaz ve
// bu blok kendiliğinden no-op'tur — emsalin (`resources/js/portal.js`)
// guard'lı deseninin aynısı.
(function(){
  var lang=document.querySelector('.tb-lang[data-lang-dropdown]');
  if(!lang)return;
  var btn=lang.querySelector('.tb-lang-btn');
  if(!btn)return;
  btn.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    var open=lang.classList.toggle('open');
    btn.setAttribute('aria-expanded',open?'true':'false');
  });
  document.addEventListener('click',function(e){
    if(!e.target.closest('.tb-lang[data-lang-dropdown]')){lang.classList.remove('open');btn.setAttribute('aria-expanded','false');}
  });
})();

// ---- MOBİL DRAWER aç/kapa ----
(function(){
  var drawer=document.getElementById('drawer');
  var overlay=document.getElementById('drawerOverlay');
  var burger=document.getElementById('hamburger');
  var closeBtn=document.getElementById('drawerClose');
  /* Drawer açılırken header katıya kilitlenir, kapanırken kilit kalkar —
     şeffaf header açık drawer'ın üstünde okunmuyordu. */
  function open(){drawer.classList.add('open');overlay.classList.add('open');document.body.style.overflow='hidden';if(window.__hdrLock)window.__hdrLock(true);}
  function close(){drawer.classList.remove('open');overlay.classList.remove('open');document.body.style.overflow='';if(window.__hdrLock)window.__hdrLock(false);}
  burger.addEventListener('click',open);
  closeBtn.addEventListener('click',close);
  overlay.addEventListener('click',close);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
  // AKORDEON — başlığın kendisi merkez sayfaya gider; YALNIZ sağdaki ok
  // alt menüyü açar/kapatır. Ok tıklaması navigasyonu keser (İA revizyonu).
  drawer.querySelectorAll('.d-has-sub > .d-link').forEach(function(lnk){
    lnk.addEventListener('click',function(e){
      if(!e.target.closest('.fa-chevron-down'))return;   // başlığa tıklandı → git
      e.preventDefault(); e.stopPropagation();
      var item=lnk.parentElement;
      var wasOpen=item.classList.contains('open');
      drawer.querySelectorAll('.d-item.open').forEach(function(o){o.classList.remove('open')});
      if(!wasOpen)item.classList.add('open');
    });
  });
  // alt link veya alt menüsüz başlığa tıklayınca drawer kapansın.
  // .d-has-sub başlıkları listede YOK: ok tıklaması kapatmamalı, başlık zaten gider.
  drawer.querySelectorAll('.d-sub a[href], .d-item:not(.d-has-sub) > a.d-link, .drawer-foot a, .drawer-foot > button').forEach(function(a){
    a.addEventListener('click',close);
  });
  // drawer dil seçici — YALNIZ akordiyon aç/kapa (N dile ölçeklenir).
  // Seçimin kendisi `<a href>`: sayfa o dilde yeniden yüklenir, etiketi
  // sunucu basar. Tek düğme modunda `[data-drawer-lang]` hiç basılmaz ve bu
  // blok no-op'tur — emsalin (`resources/js/portal.js`) guard'lı deseni.
  var dl=document.querySelector('[data-drawer-lang]');
  if(dl){
    var dlToggle=dl.querySelector('.drawer-lang-toggle');
    if(dlToggle){
      dlToggle.addEventListener('click',function(){
        var open=dl.classList.toggle('open');
        dlToggle.setAttribute('aria-expanded',open?'true':'false');
      });
    }
  }
})();

// ---- SÜRÜKLE-KAYDIR (mouse ile yatay slider'lar) ----
// Sayfa kendi track selector'larını alttaki listeye ekler (.row-track hazır gelir)
(function(){
  function enableDrag(el){
    el.classList.add('drag-scroll');
    var down=false,startX=0,startScroll=0,moved=false;
    el.addEventListener('pointerdown',function(e){
      if(e.pointerType==='touch')return;           // touch zaten native kayar
      down=true;moved=false;startX=e.clientX;startScroll=el.scrollLeft;
    });
    el.addEventListener('pointermove',function(e){
      if(!down)return;
      var dx=e.clientX-startX;
      if(Math.abs(dx)>4){moved=true;el.classList.add('dragging');}
      el.scrollLeft=startScroll-dx;
    });
    function up(){down=false;setTimeout(function(){el.classList.remove('dragging');},0);}
    el.addEventListener('pointerup',up);
    el.addEventListener('pointercancel',up);
    el.addEventListener('pointerleave',up);
    // sürükleme sonrası yanlışlıkla tıklamayı engelle
    el.addEventListener('click',function(e){if(moved){e.preventDefault();e.stopPropagation();moved=false;}},true);
    // dikey wheel'i yatay scroll'a çevir (trackpad/mouse)
    el.addEventListener('wheel',function(e){
      if(el.scrollWidth<=el.clientWidth)return;
      if(Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
      e.preventDefault();el.scrollLeft+=e.deltaY;
    },{passive:false});
  }
  ['.row-track','.cat-track','.grid-4','.vid-grid','.chips','.chef-row','.disc-grid'].forEach(function(sel){
    document.querySelectorAll(sel).forEach(enableDrag);
  });
})();

// ---- FOOTER REVEAL — footer yüksekliğini ölç, içerik sonuna boşluk aç ----
(function(){
  var main=document.getElementById('pageMain');
  var foot=document.querySelector('.footer');
  if(!main||!foot)return;
  function fit(){
    if(window.matchMedia('(min-width:641px)').matches){
      main.style.marginBottom=foot.offsetHeight+'px';
    }else{
      main.style.marginBottom='';
    }
  }
  fit();
  window.addEventListener('resize',fit);
  window.addEventListener('load',fit);          // logo/font yüklenince yükseklik oturur
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);

  /* FOOTER'IN KENDI YUKSEKLIGI DE DEGISIR — OLCULDU.
     Yukaridaki uc tetikleyici yalniz PENCERE olaylarini dinliyordu; footer
     load'tan SONRA buyurse (yasal baglantilar bir satir daha sarar, magaza
     rozetleri yerine oturur, accordion durumu degisir) bosluk BAYAT kalir ve
     #pageMain'in kuyrugu sabit footer'in altinda kalirdi.

     Olcum (Chromium 1440x900, /programlar?hedef=tumu, footer'a 200px eklendi):
       ResizeObserver VAR  → bosluk 612px → 812px, footer 812px   ✔ esit
       ResizeObserver YOK  → bosluk 612px'te KALDI, footer 812px  ✘ bayat
     Negatif kontrol boyle kosuldu: window.ResizeObserver sayfa acilmadan
     silindi, ayni uyarim tekrarlandi, bosluk guncellenmedi.

     Kutu secimi de OLCULDU, varsayilan DEGIL: ResizeObserver varsayilan olarak
     content-box izler. Footer'in dolgusu (padding) degisince icerik kutusu AYNI
     kalir, gozlemci HIC tetiklenmez ve bosluk yine bayat kalirdi:
       content-box uyarimi + varsayilan kutu → 612 → 812  ✔
       padding uyarimi     + varsayilan kutu → 612'de kaldi ✘
       padding uyarimi     + border-box      → 612 → 812  ✔
     offsetHeight zaten kenarlik kutusudur; gozlemci de onu izlemelidir.

     ⚠ BU DUZELTME BEYAR'IN /programlar SIKAYETINI COZMEZ — olculdu, ayri kok
     neden bulundu: liste.blade.php'de bir HTML yorumu <!-- ile acilip --}} ile
     kapatiliyor, bu yuzden </main> yorumun icinde kaliyor ve footer #pageMain'in
     COCUGU olarak ayrisiyor. main z-index:2 bir yigin baglami kurdugu icin
     icerideki z-index:1 footer, main'in kendi icerigini ORTUYOR. Duzeltme o
     dosyaya aittir, bu dosyaya degil. */

  if(window.ResizeObserver){
    var ro=new ResizeObserver(fit);
    try{ ro.observe(foot,{box:'border-box'}); }catch(e){ ro.observe(foot); }
  }

  /* Geri navigasyonda (bfcache) sayfa yeniden ölçülmez; `pageshow` onu yakalar. */
  window.addEventListener('pageshow',fit);
})();

/* ---- FOOTER ACCORDION — üç orta menü, YALNIZ mobilde ----
   "Dada Diet Footer" belgesi: "Üç orta menü mobilde açılır-kapanır accordion
   olarak çalışmalıdır."

   ÜÇ ÖLÇÜLMÜŞ KARAR:
     1. `aria-expanded` SUNUCUDAN BASILMAZ, buraya yazılır. Masaüstünde
        accordion diye bir şey yok (kalemler her zaman açık) — sunucudan sabit
        bir "false" basmak ekrandaki durumu YANLIŞ bildirmek olurdu. Bu yüzden
        masaüstünde nitelik tamamen SÖKÜLÜR, mobilde gerçek duruma yazılır.
     2. Kapanma sınıfı (`is-closed`) JS'in eseridir; CSS'te varsayılan kapalı
        durum YOKTUR. Script hiç çalışmazsa üç menü de açık kalır — bozuk JS
        footer menüsünü yutmaz.
     3. Kırılma noktası 641px: dd-shell.css'teki `.foot-grid{grid-template-
        columns:1fr}` ile AYNI eşik (satır 903). İkisi ayrışırsa tek sütuna
        inmiş ama accordion'suz bir footer çıkardı. */
(function(){
  var toggles=[].slice.call(document.querySelectorAll('.foot-col [data-foot-acc]'));
  if(!toggles.length)return;
  var mq=window.matchMedia('(max-width:640px)');

  function panelOf(btn){
    var id=btn.getAttribute('aria-controls');
    return id?document.getElementById(id):null;
  }
  function setOpen(btn,open){
    var panel=panelOf(btn);
    if(panel)panel.classList.toggle('is-closed',!open);
    btn.setAttribute('aria-expanded',open?'true':'false');
  }
  /* Eşiği geçince durumu yeniden kur: mobile inince hepsi KAPALI başlar
     (accordion'un varlık sebebi yer kazanmak), masaüstüne çıkınca sınıf ve
     nitelik ikisi de silinir — geride yarım bir durum kalmaz. */
  function sync(){
    toggles.forEach(function(btn){
      if(mq.matches){
        setOpen(btn,false);
      }else{
        var panel=panelOf(btn);
        if(panel)panel.classList.remove('is-closed');
        btn.removeAttribute('aria-expanded');
      }
    });
  }
  toggles.forEach(function(btn){
    btn.addEventListener('click',function(){
      if(!mq.matches)return;                    // masaüstünde tıklama no-op
      setOpen(btn,btn.getAttribute('aria-expanded')!=='true');
    });
  });
  sync();
  // Safari <14 `addEventListener`i MediaQueryList'te desteklemez — kardeş
  // guard deseni (bu dosyadaki öteki mq kullanımları resize dinliyor).
  if(mq.addEventListener)mq.addEventListener('change',sync);
  else window.addEventListener('resize',sync);
})();


// ---- GÖRÜŞ BİLDİR (kenar etiketi → modal) ----
(function(){
  var tab=document.getElementById('fbTab');
  var modal=document.getElementById('fbModal');
  var overlay=document.getElementById('fbOverlay');
  if(!tab||!modal)return;
  var form=document.getElementById('fbForm');
  var success=document.getElementById('fbSuccess');
  var errBox=document.getElementById('fbError');
  var errText=document.getElementById('fbErrorText');
  var sendBtn=form.querySelector('.fb-send');
  var sending=false;
  function fbHata(msg){ if(!errBox)return; errText.textContent=msg; errBox.hidden=false; }
  function fbHataGizle(){ if(!errBox)return; errBox.hidden=true; errText.textContent=''; }
  function open(){modal.classList.add('show');overlay.classList.add('show');document.body.style.overflow='hidden';}
  function close(){
    modal.classList.remove('show');overlay.classList.remove('show');document.body.style.overflow='';
    setTimeout(function(){form.hidden=false;success.hidden=true;form.reset();fbHataGizle();},300);
  }
  tab.addEventListener('click',function(e){e.preventDefault();open();});
  /* FOOTER'DAKI "Öneri ve Şikâyet" (2026-08-17) — footer artik SUNUCUDAN
     basiliyor, yani eski satir-ici `onclick="document.getElementById('fbTab')
     .click()"` cagrisi Blade'e tasinamazdi (satir-ici JS hem CSP'ye takilir
     hem klavyeyle erisilemez). Kalem artik gercek bir parca hedefi tasiyor
     (`href="#fbTab"`, o eleman HER sayfada var — olculdu) ve burada delege
     ediliyor: JS acikken modal acilir, kapaliyken tarayici gorus bildirme
     etiketine atlar. Iki durumda da olu bag YOK. */
  document.addEventListener('click',function(e){
    var trigger=e.target.closest&&e.target.closest('[data-diet-feedback]');
    if(!trigger)return;
    e.preventDefault();
    open();
  });
  document.getElementById('fbClose').addEventListener('click',close);
  overlay.addEventListener('click',close);
  modal.addEventListener('click',function(e){if(e.target===modal)close();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
  // M17 — konu tipine göre alan seti: aktif pane görünür, pasif pane'lerin
  // input'ları disable edilir (gizli required alanlar submit'i bloklamasın)
  function syncPanes(){
    var cur=modal.querySelector('.fb-topic.active').getAttribute('data-topic');
    modal.querySelectorAll('.fb-fields').forEach(function(p){
      var on=p.getAttribute('data-for')===cur;
      p.classList.toggle('active',on);
      p.querySelectorAll('input,textarea,select,button').forEach(function(el){el.disabled=!on});
    });
  }
  modal.querySelectorAll('.fb-topic').forEach(function(t){
    t.addEventListener('click',function(){
      modal.querySelectorAll('.fb-topic').forEach(function(x){x.classList.remove('active')});
      t.classList.add('active');
      syncPanes();
    });
  });
  syncPanes();
  // emoji + chip seçimleri (tek seçim)
  modal.querySelectorAll('.fb-emoji button').forEach(function(b){
    b.addEventListener('click',function(){
      modal.querySelectorAll('.fb-emoji button').forEach(function(x){x.classList.remove('active')});
      b.classList.add('active');
    });
  });
  modal.querySelectorAll('.fb-chiprow .chip').forEach(function(c){
    c.addEventListener('click',function(){
      modal.querySelectorAll('.fb-chiprow .chip').forEach(function(x){x.classList.remove('active')});
      c.classList.add('active');
    });
  });
  /* 🔴 KABLOLAMA (2026-08-22) — FORM ARTIK GERÇEKTEN GÖNDERİYOR.
     Önceki hâli `preventDefault()` çağırıp başarı panelini açıyor ve HİÇBİR
     istek atmıyordu: kullanıcı "Görüşün bize ulaştı" görüyordu, `diet_feedback`
     0 satırdı. Karşısında çalışan bir uç ZATEN vardı (`diet.feedback.store`);
     eksik olan karar değil, kabloydu.

     NEDEN `fetch`, NEDEN NATIVE DEĞİL: modal bu dosyadan basılıyor. Native
     gönderim sayfayı yeniden yükler, modal kapanır — "başarı paneli YALNIZ
     sunucu başarı döndüğünde açılır" kuralı karşılanamaz, doğrulama hatasında
     da kullanıcının yazdığı metin kaybolurdu. CSRF token'ın KAYNAĞI
     DEĞİŞMEDİ: `<meta name="csrf-token">` — bu dosyadaki çıkış formunun
     (`[data-logout]`, ~1355) kullandığı desenin aynısı, ikinci bir mekanizma
     icat edilmedi.

     🔴 PASİF PANELLER: yük `new FormData(form)` ile toplanır ve FormData
     `disabled` alanları TANIM GEREĞİ dışarıda bırakır. Yani `syncPanes()`in
     kurduğu kural gönderime kendiliğinden yansır; ayrı bir filtre YAZILMADI
     ve `syncPanes()`e dokunulmadı. */

  /* Alan etiketi MARKUP'TAN okunur, elle yazılmaz: select'te boş (yer tutucu)
     option'ın metni, input'ta placeholder. Sondaki zorunluluk yıldızı düşer. */
  function fbEtiket(el){
    if(el.tagName==='SELECT'){
      var o=el.querySelector('option[value=""]');
      return o?o.textContent.replace(/\s*\*\s*$/,'').trim():'';
    }
    return (el.getAttribute('placeholder')||'').replace(/\s*\*\s*$/,'').trim();
  }

  /* Her konu panelinde ucun KOLONU OLMAYAN alanlar var: öneri çipi, konu/yer
     seçimi, ihlal linki. Bunlar için uydurma kolon AÇILMADI — ama kullanıcının
     girdiği şey de KAYBEDİLMEDİ: kendi etiketleriyle gövdenin başına eklenir.
     Yöneticinin `admin/diet/geri-bildirim` ekranında gördüğü tek alan gövde. */
  function fbGovde(fd){
    var pane=modal.querySelector('.fb-fields.active');
    var onek=[];
    // Etiket zaten noktalamayla bitiyorsa iki üst üste işaret yazılmaz
    // ("Sorunu nerede yaşadın?: Mobil uygulama" → "Sorunu nerede yaşadın? …").
    var satir=function(l,v){ return l+(/[?:!.]$/.test(l)?' ':': ')+v; };
    if(pane){
      var row=pane.querySelector('.fb-chiprow');
      var chip=row&&row.querySelector('.chip.active');
      if(chip&&!chip.disabled)onek.push(satir((row.getAttribute('aria-label')||'').trim(),chip.textContent.trim()));
      pane.querySelectorAll('select,input[type="url"]').forEach(function(el){
        if(el.disabled||!el.value)return;
        var l=fbEtiket(el);
        if(l)onek.push(satir(l,el.value.trim()));
      });
    }
    var govde=String(fd.get('body')||'').trim();
    return (onek.length?onek.join('\n')+'\n\n':'')+govde;
  }

  /* Kullanıcıya BASILAN metnin ilk kaynağı SUNUCUNUN kendi doğrulama
     mesajıdır (`lang/tr/validation.php`). Aşağıdaki iki cümle yalnız sunucu
     hiç konuşamadığında (ağ hatası / gövdesiz yanıt) devreye girer. */
  function fbHataMetni(res){
    var d=res.data||{};
    if(d.errors){
      var out=[];
      Object.keys(d.errors).forEach(function(k){ [].push.apply(out,d.errors[k]); });
      if(out.length)return out.join(' ');
    }
    if(d.message)return d.message;
    if(res.status===429)return T('fbHata429');
    return T('fbHataGenel');
  }

  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(sending)return;
    var action=form.getAttribute('action');
    if(!action){ fbHata(T('fbHataUc')); return; }
    var meta=document.querySelector('meta[name="csrf-token"]');
    /* ÖLÇÜLDÜ (E2E, 2026-08-22): 404 sayfası kabuğu basıyor ama `csrf_token()`
       BOŞ geliyor (hata görünümü oturum middleware'inin dışında doğuyor).
       Token'sız istek kesin 419 alır ve kullanıcı İngilizce "CSRF token
       mismatch." görürdü; peşin peşin durdurulup anlaşılır cümle basılır.
       404 kabuğunun kendisi AYRI BİR KONU — raporlandı, burada kapatılmadı. */
    if(!meta||!meta.content){ fbHata(T('fbHataOturum')); return; }
    var fd=new FormData(form);                 // `disabled` alanlar OTOMATİK dışarıda
    fd.set('body',fbGovde(fd));
    fd.delete('ek_konu'); fd.delete('ek_baglanti');   // gövdeye katıldılar, uca gitmezler
    fd.set('topic',modal.querySelector('.fb-topic.active').getAttribute('data-topic'));
    var em=modal.querySelector('.fb-emoji button.active');
    // Kolonun ADI `emoji` — sayı değil GLİF yazılır; yönetim ekranı onu
    // gövdenin yanına doğrudan basıyor (geri-bildirim/index.blade.php:53).
    if(em&&!em.disabled)fd.set('emoji',em.textContent.trim());
    fd.set('page_url',location.href.slice(0,512));    // kolon 512, uzun adres kullanıcıyı bloklamasın
    if(meta)fd.set('_token',meta.content);
    fbHataGizle();
    sending=true; if(sendBtn)sendBtn.disabled=true;
    fetch(action,{
      method:'POST',
      body:fd,
      credentials:'same-origin',
      headers:{'Accept':'application/json','X-Requested-With':'XMLHttpRequest','X-CSRF-TOKEN':meta?meta.content:''}
    }).then(function(r){
      return r.json().catch(function(){return {};}).then(function(j){return {ok:r.ok,status:r.status,data:j};});
    }).then(function(res){
      sending=false; if(sendBtn)sendBtn.disabled=false;
      // 🔴 BAŞARI PANELİ YALNIZ BURADA AÇILIR — sunucu 2xx döndüğünde.
      if(res.ok){ form.hidden=true; success.hidden=false; return; }
      fbHata(fbHataMetni(res));
    }).catch(function(){
      sending=false; if(sendBtn)sendBtn.disabled=false;
      fbHata(T('fbHataAg'));
    });
  });
  if(location.search.indexOf('fb=1')>-1){open();}
})();

// ---- ÇEREZ ONAY BANNER ----
(function(){
  var banner=document.getElementById('cookieBanner');
  if(!banner)return;
  var KEY='dm-cookie-consent';
  var force=location.search.indexOf('cc=1')>-1;   // SS/test için zorla göster
  function stored(){try{return localStorage.getItem(KEY);}catch(e){return null;}}
  function dismiss(val){
    try{localStorage.setItem(KEY,val);}catch(e){}
    banner.classList.remove('show');if(window.__bnUpdate)window.__bnUpdate();
  }
  if(force || !stored()){
    setTimeout(function(){banner.classList.add('show');if(window.__bnUpdate)window.__bnUpdate();},700);
  }
  // "Reddet" düğmesi şeritten kaldırıldı (yukarıdaki blok yorumu). Guard'sız
  // getElementById zinciri burada TypeError atıp ALTINDAKİ tüm IIFE'leri
  // öldürürdü — kardeş markada ui.js aynı sebeple `if (reject)` yazıyor.
  var accept=document.getElementById('cookieAccept');
  var reject=document.getElementById('cookieReject');
  if(accept)accept.addEventListener('click',function(){dismiss('accepted');});
  if(reject)reject.addEventListener('click',function(){dismiss('rejected');});
})();

/* ===== MOBİL ALT KATMAN YÖNETİCİSİ (revize2/mobil1 — kanonik) ===== */
/* ===== MOBİL ALT KATMAN YÖNETİCİSİ (revize2/mobil1 — kanonik) =====
   Kural: ekranda en fazla 1 sabit alt şerit. Çerez onayı (geçici, öncelikli)
   ya da sayfanın kendi aksiyon şeridi (window.__bottomStrips) açıkken global
   bottom-nav gizlenir; şerit olan sayfalarda nav ayrıca aşağı kaydırınca gizlenir. */
window.__bottomStrips=window.__bottomStrips||[];
(function(){
  var nav=document.querySelector('.bottom-nav');
  if(!nav)return;
  var cookie=document.getElementById('cookieBanner');
  var strips=window.__bottomStrips.map(function(s){return document.querySelector(s);}).filter(Boolean);
  var lastY=window.scrollY||0;
  function stripShown(){for(var i=0;i<strips.length;i++){if(strips[i]&&strips[i].classList.contains('show'))return true;}return false;}
  function update(){
    var y=window.scrollY||0;
    if((cookie&&cookie.classList.contains('show'))||stripShown()){nav.classList.add('bn-hidden');lastY=y;return;}
    if(strips.length===0||y<80){nav.classList.remove('bn-hidden');lastY=y;return;}
    if(y-lastY>12){nav.classList.add('bn-hidden');lastY=y;}
    else if(lastY-y>12){nav.classList.remove('bn-hidden');lastY=y;}
  }
  window.addEventListener('scroll',update,{passive:true});
  window.addEventListener('resize',update,{passive:true});
  document.addEventListener('click',function(){setTimeout(update,60);},true);
  window.__bnUpdate=update;update();
})();

/* ===== HESAPLAYICI GEÇİŞ RAYI — aktif kalemi görünür kıl =====
   Ray tek satır olduğu için (dd-shell.css .calc-switch) on kalem çoğu
   genişlikte sığmaz ve yatay kaydırır. Aktif hesaplayıcı rayın sonunda
   kalırsa açılışta görünmez; sayfa yüklenince onu yatayda ortalıyoruz.
   scrollLeft doğrudan yazılır — scrollIntoView sayfayı DİKEYDE de kaydırır
   ve ray katlamanın altında olduğu için sayfa aşağı sıçrardı. */
(function(){
  var rail=document.querySelector('.calc-switch');
  if(!rail)return;
  var act=rail.querySelector('a.active');
  if(!act)return;
  function center(){
    if(rail.scrollWidth<=rail.clientWidth){rail.scrollLeft=0;return;}
    rail.scrollLeft=act.offsetLeft-(rail.clientWidth-act.offsetWidth)/2;
  }
  center();
  if(window.addEventListener)window.addEventListener('resize',center);
})();

/* ===== DadaMentor FAB + scroll-reveal + scroll-top ===== */
/* ===== ADIM 3 KABUK JS — DadaMentor + Reveal + Scroll-top (Diet hesaplayıcı; ayrı IIFE, sayfa JS ile çakışmaz) ===== */
// ---- DADAMENTOR ASİSTAN PANELİ (floating collapse/expand morph + footer-hide) ----
(function(){
  var panel=document.getElementById('mentorPanel');
  if(!panel)return;
  var mpToggle=document.getElementById('mpToggle');
  var mpToggleIco=document.getElementById('mpToggleIco');
  var mpMiniOv=document.getElementById('mpMiniOv');
  var panelState='mini';
  function collapse(){
    panelState='mini';panel.setAttribute('data-state','mini');panel.classList.add('mini');
    if(mpToggleIco)mpToggleIco.className='fa-solid fa-plus';
    if(mpToggle)mpToggle.setAttribute('aria-label',T('mpBuyut'));
    if(mpMiniOv)mpMiniOv.setAttribute('aria-hidden','false');
  }
  function expand(){
    panelState='full';panel.setAttribute('data-state','full');panel.classList.remove('mini');
    if(mpToggleIco)mpToggleIco.className='fa-solid fa-minus';
    if(mpToggle)mpToggle.setAttribute('aria-label',T('mpKucult'));
    if(mpMiniOv)mpMiniOv.setAttribute('aria-hidden','true');
  }
  if(mpToggle)mpToggle.addEventListener('click',function(e){e.stopPropagation();panelState==='full'?collapse():expand();});
  if(mpMiniOv)mpMiniOv.addEventListener('click',expand);
  function onFootScroll(){
    var y=window.scrollY||document.documentElement.scrollTop;
    var max=document.documentElement.scrollHeight-window.innerHeight;
    panel.classList.toggle('foot-hide',(max-y)<260);
  }
  window.addEventListener('scroll',onFootScroll,{passive:true});
  window.addEventListener('resize',onFootScroll);
  onFootScroll();
})();
// ---- ÖLÇÜLÜ SCROLL-REVEAL (FOUC-güvenli; .reveal hedefi yoksa no-op; class 'in') ----
(function(){
  var els=document.querySelectorAll('.reveal');
  if(!els.length)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(!('IntersectionObserver' in window))return;
  document.documentElement.classList.add('reveal-ready');
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
  },{threshold:.12,rootMargin:'0px 0px -7% 0px'});
  els.forEach(function(el){io.observe(el);});
})();
// ---- SCROLL-TO-TOP (sağ-alt; scrollY eşiği, dipte gizle) ----
(function(){
  var btn=document.getElementById('toTop');
  if(!btn)return;
  var smooth=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function upd(){
    var y=window.scrollY||document.documentElement.scrollTop;
    var max=document.documentElement.scrollHeight-window.innerHeight;
    btn.classList.toggle('show', y>620 && (max-y)>120);
  }
  btn.addEventListener('click',function(){window.scrollTo({top:0,behavior:smooth?'smooth':'auto'});});
  window.addEventListener('scroll',upd,{passive:true});
  window.addEventListener('resize',upd);
  upd();
})();
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
