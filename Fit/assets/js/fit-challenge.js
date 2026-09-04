/* =====================================================================
   DadaFit · CHALLENGE MOTORU — TEK KAYNAK   (R15/5)
   ---------------------------------------------------------------------
   ESKİ HÂL (ölçüldü, 2026-08-29): tek tip challenge vardı ve ilerleme
   kullanıcının elle bastığı bir düğmeden geliyordu:
     FIT_SHELL.state.challengeGunTamamla()  →  gun++ · seri++
   Hiçbir kanıt almıyordu. "Bugünü işaretle"ye otuz kez basan biri
   challenge'ı bitirmiş sayılıyordu.

   YENİ HÂL — TEK HUNİ.
   Her tamamlanma `FIT_SHELL.state.antrenmanTamamla()`'dan geçer. O çağrı
   `dm_fit`e yazar ve `fit:state` olayını yayınlar (kabuğun write()'ı zaten
   yayınlıyor — YENİ bir olay kanalı açılmadı). Bu motor o olaya abone olur
   ve ilerlemeyi HER SEFERİNDE `gecmis[]`ten YENİDEN HESAPLAR. Sayaç
   artırmaz: artırılan sayaç, kaydı silinse bile yerinde kalır; hesaplanan
   ilerleme kaydın kendisidir.

   GEÇMİŞ KAYDINDA OKUNAN ÜÇ ALAN (kabuk 2026-08-29'da yazmaya başladı):
     tarihISO  → süreli hedef penceresi + alışkanlık serisi
     slug      → egzersiz serisi eşleşmesi
     metrik    → sayısal hedef toplamı, ör. {km, tekrar, set, dk, adim}
   ÜÇÜ DE İSTEĞE BAĞLIDIR. Eski kayıtlarda yoklar; okuyan taraf yokluğu
   GÖSTERMEZ, UYDURMAZ (`fit-plan-kayit.js` v2 göçünün deseni). Alanı
   olmayan kayıt pencereye giremez — "bilinmiyor" ile "olmadı" ayrı şeyler,
   ikisini de sıfır saymak yalan olurdu; kaç kaydın tarihsiz olduğu
   `ilerleme().tarihsiz` ile GÖSTERİLİR.

   KANIT KADEMESİ (kabuktan gelir: olculdu · video · cihaz · beyan)
     beyan          → alışkanlık serisini BESLER, sayısal hedefi BESLEMEZ
     olculdu/cihaz  → hepsini besler
     video          → modül 2026-08-29'da kalktı; eski kayıtlarda olabilir,
                      alışkanlık tarafında sayılır, sayısal hedefte sayılmaz
   Gerekçe: "100 km koştum" demek ile ölçülmüş 100 km ayrı şeydir. Alışkanlık
   challenge'ı zaten beyanın kendisini ölçer — orada beyan geçerli kanıttır.

   DEPOLAMA
     localStorage['dm_fit_challenge_v1'] = {
       surum:1,
       katilim: { <slug>: { slug, baslangic:ISO, durum, bitis:ISO|null, tur:N } }
     }
     durum ∈ devam · tamamlandi · birakildi
     (kabuğun `dm_fit_*` anahtar ailesiyle aynı önek)

   KABUKLA UYUM
     `dm_fit.challenge` (tek nesne) hâlâ dört ekranın okuduğu şema.
     Bu motor onu SİLMEZ; birincil katılımı her hesaplamada oraya yansıtır
     (`_yansit`). Böylece challenge-merkezi · programlarim · bildirimler
     eski alanları okumaya devam eder, sayılar da gerçek olur.

   ADMIN
     `KATALOG` bugün bu dosyada duran tek veri dizisidir. Şema, panelden
     gelecek satırla birebir aynı: yeni bir tip eklemek TIP tablosuna bir
     kayıt, yeni bir challenge eklemek diziye bir satırdır.
   ===================================================================== */
(function (kok) {
  'use strict';

  var KEY = 'dm_fit_challenge_v1';
  var SURUM = 1;
  var TELAFI_HAKKI = 2;                 /* ayda iki — belge §15 */
  var SAYISAL_KANIT = ['olculdu', 'cihaz'];

  /* ==================================================================
     TİPLER — üçü de aynı sözleşmeyi doldurur:
       olc(k, kayitlar, gecenGun) → { biriken, hedef, birim, oran, tamam }
     Yeni tip eklemek buraya bir kayıt eklemektir; ekranlar değişmez.
     ================================================================== */
  var TIP = {
    sureli: {
      etiket: 'Süreli hedef',
      ikon: 'fa-solid fa-gauge-high',
      aciklama: 'Belirli bir sürede sayısal bir hedefe ulaş.',
      kanit: 'Yalnız ölçülmüş ve cihazdan gelen kayıtlar sayılır; beyan sayılmaz.'
    },
    seri: {
      etiket: 'Egzersiz serisi',
      ikon: 'fa-solid fa-list-ol',
      aciklama: 'Belirlenen antrenmanları sırayla bitir.',
      kanit: 'Her adım, o antrenmanın kaydıyla kapanır.'
    },
    aliskanlik: {
      etiket: 'Alışkanlık',
      ikon: 'fa-solid fa-seedling',
      aciklama: 'Her gün işaretle, seriyi koru.',
      kanit: 'Günü işaretlemen yeterli — beyan burada geçerli kanıttır.'
    }
  };

  /* ==================================================================
     KATALOG — prototipte tek veri dizisi, ileride admin panelinden.
     Slug'lar diskteki gerçek sayfalarla eşleşir; uydurma yok.
     ⚠ R16/1'de bu söz ÖLÇÜLDÜ ve tutmuyordu: seri adımlarının yedi slug'ının
     hiçbiri egzersiz kataloğunda yoktu (25 gerçek slug'a karşı 0 eşleşme).
     Adımlar gerçek hareketlere çekildi; söz artık ölçülebilir.
     Bu diziyi DEĞİŞTİREN, slug'ı taşıyan sayfaları da değiştirir:
     programini-bul-v1 · programlar-merkezi-v1 · tests/wizard-page.mjs.
     ================================================================== */
  var KATALOG = [
    {
      slug: 'hareket-aliskanligi', tip: 'aliskanlik',
      ad: '30 Günde Hareket Alışkanlığı', gun: 30,
      kategori: 'aliskanlik', kategoriAd: 'Alışkanlık', durum: 'aktif',
      /* SUNUM ALANLARI da katalogdadır. Detay sayfası kendi metin kümesini
         taşıyordu ve katalogla ayrışabiliyordu; tek kaynak burasıdır. */
      baslik: '30 günde <em>hareket alışkanlığı</em>', gunlukSure: '10–15 dk',
      donem: 'Alışkanlık challenge’ı',
      uzunOzet: 'Büyük hedef değil, küçük süreklilik. Her gün 10–15 dakika ufak bir hareket; ayın sonunda bir alışkanlık. Kaçırdığın gün suçluluk yok — kaldığın yerden devam et.',
      ozet: 'Her gün 10–15 dakika. Kaçırdığın gün seriyi sıfırlamaz; ayda iki telafi hakkın var.',
      odul: { rozet: 'challenge-aliskanlik', puan: 250 },
      gorsel: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&q=80&auto=format&fit=crop&exp=7&gam=6&sat=-12'
    },
    {
      slug: 'ekipmansiz-temel', tip: 'seri',
      ad: '7 Gün Ekipmansız Temel Seri', gun: 7,
      kategori: 'kuvvet', kategoriAd: 'Temel kuvvet', durum: 'yaklasan',
      baslik: '7 günde <em>ekipmansız temel seri</em>', gunlukSure: '8–10 dk',
      donem: 'Egzersiz serisi challenge’ı',
      uzunOzet: 'Yedi temel hareket, sırayla. Hiçbirinde ekipman yok. Her adım o hareketin kendi sayfasında, gerçek bir antrenman kaydıyla kapanır; birini bitirmeden sonraki açılmaz. Aktivasyonla başlar, kuvvetle devam eder, core ile biter.',
      ozet: 'Yedi ekipmansız hareket, sırayla. Her adım o hareketin kaydıyla kapanır; birini bitirmeden sonraki başlamaz.',
      /* Adım slug’ları `egzersiz-detay-v1.html` kataloğundaki GERÇEK
         kayıtlardır — tıklanır, açılır, yapılır, kapanır.
         ⚠ Önceki sürümde yedi esneme slug’ı vardı ve ÖLÇÜLDÜ: 25 gerçek
         egzersiz slug’ına karşı 0 eşleşme. Yani bu tip UI’dan HİÇ ilerleyemiyordu;
         adımı kapatacak bir sayfa yoktu. Sıra: aktivasyon → bacak → üst → core. */
      adimlar: [
        { slug: 'kopru',      ad: 'Köprü (Glute Bridge)' },
        { slug: 'superman',   ad: 'Superman (Yüzüstü Uzanma)' },
        { slug: 'hava-squat', ad: 'Hava Squat' },
        { slug: 'hamle',      ad: 'Hamle (Lunge)' },
        { slug: 'sinav',      ad: 'Şınav (Push-up)' },
        { slug: 'dead-bug',   ad: 'Dead Bug (Ölü Böcek)' },
        { slug: 'plank',      ad: 'Plank (Şınav Duruşu)' }
      ],
      odul: { rozet: 'challenge-seri', puan: 100 },
      gorsel: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=700&q=80&auto=format&fit=crop&exp=7&gam=6&sat=-12'
    },
    {
      slug: 'bin-tekrar', tip: 'sureli',
      ad: '21 Günde 1.000 Tekrar', gun: 21,
      kategori: 'kondisyon', kategoriAd: 'Kondisyon', durum: 'aktif',
      baslik: '21 günde <em>1.000 tekrar</em>', gunlukSure: '15–30 dk',
      donem: 'Süreli hedef challenge’ı',
      uzunOzet: 'Yirmi bir günde toplam bin tekrar — günde ortalama kırk sekiz. Hangi hareket olduğu önemli değil; antrenman sayfasında işaretlediğin her set buraya sayılır. Saydığımız tekrar ÖLÇÜLMÜŞ tekrardır: kronometreyi çalıştırıp setini kapattığında kaydedilen sayı. Beyan bu hedefe girmez.',
      ozet: 'Yirmi bir günde toplam 1.000 tekrar. Antrenman sayfasında kapattığın her set buraya sayılır.',
      /* ⚠ ÖNCEKİ SÜRÜM “21 günde 100 km” idi ve ÖLÇÜLDÜ: bu depoda mesafe
         üreten HİÇBİR yüzey yok (GPS yok, `metrik.km` yazan 0 çağıran).
         Kanıt kuralı elle girilen beyanı elediği için hedef hiçbir yoldan
         dolamıyordu — tutulamayan bir sözdü. Ölçü, uygulamanın GERÇEKTEN
         saydığı şeye çevrildi: `egzersiz-detay-v1.html`in set sayacı. */
      hedef: { birim: 'tekrar', deger: 1000, ad: 'tekrar' },
      odul: { rozet: 'challenge-sureli', puan: 250 },
      gorsel: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=700&q=80&auto=format&fit=crop&exp=7&gam=6&sat=-14'
    }
  ];

  /* ---------------- depolama ---------------- */
  function bos() { return { surum: SURUM, katilim: {} }; }

  function oku() {
    var d;
    try { d = JSON.parse(kok.localStorage.getItem(KEY) || 'null'); }
    catch (e) { d = null; }
    if (!d || typeof d !== 'object') return bos();
    if (!d.katilim || typeof d.katilim !== 'object') d.katilim = {};
    d.surum = SURUM;
    return d;
  }

  function yaz(d) {
    try { kok.localStorage.setItem(KEY, JSON.stringify(d)); }
    catch (e) { return false; }
    kok.dispatchEvent(new CustomEvent('fit-challenge-degisti', { detail: d }));
    return true;
  }

  /* ---------------- yardımcılar ---------------- */
  function S() { return kok.FIT_SHELL && kok.FIT_SHELL.state; }

  function gunAnahtar(iso) {
    var t = new Date(iso);
    if (isNaN(t)) return null;
    return t.getFullYear() + '-' +
           String(t.getMonth() + 1).padStart(2, '0') + '-' +
           String(t.getDate()).padStart(2, '0');
  }

  function bugunAnahtar() { return gunAnahtar(new Date().toISOString()); }

  /* Bir günlük adım: yerel gün başından itibaren n gün sonrası. */
  function gunEkle(anahtar, n) {
    var p = String(anahtar).split('-');
    var t = new Date(+p[0], +p[1] - 1, +p[2]);
    t.setDate(t.getDate() + n);
    return gunAnahtar(t.toISOString());
  }

  function gunFark(a, b) {                       /* b − a, tam gün */
    var pa = String(a).split('-'), pb = String(b).split('-');
    var ta = Date.UTC(+pa[0], +pa[1] - 1, +pa[2]);
    var tb = Date.UTC(+pb[0], +pb[1] - 1, +pb[2]);
    return Math.round((tb - ta) / 86400000);
  }

  /* `gecmis[]`ten pencereye düşen kayıtlar. Tarihsiz kayıt PENCEREYE GİRMEZ
     ama sayılır ve dışarı bildirilir — sessizce yutmak, kullanıcının
     geçmişinin ne kadarının ölçülebilir olduğunu gizlerdi. */
  function pencere(k, kat) {
    var st = S(); var s = st ? st.read() : null;
    var hepsi = (s && Array.isArray(s.gecmis)) ? s.gecmis : [];
    var bas = kat && kat.baslangic ? gunAnahtar(kat.baslangic) : null;
    var son = bas ? gunEkle(bas, (k.gun || 30) - 1) : null;
    var ic = [], tarihsiz = 0;
    hepsi.forEach(function (g) {
      if (!g || !g.tarihISO) { tarihsiz++; return; }
      var a = gunAnahtar(g.tarihISO);
      if (!a || !bas) return;
      if (a >= bas && a <= son) ic.push({ kayit: g, gun: a });
    });
    return { kayitlar: ic, tarihsiz: tarihsiz, bas: bas, son: son };
  }

  function sayisalMi(g) { return SAYISAL_KANIT.indexOf(g.kaynak) >= 0; }

  /* Aktif günler → güncel seri (telafi haklı) ve en uzun seri (haksız).
     İkisi AYRI sayıdır ve ayrı gösterilir: telafi bir kolaylıktır, "beş gün
     üst üste yaptım" cümlesini değiştirmemeli. */
  function seriHesapla(gunler, bas, son) {
    var set = {}; gunler.forEach(function (g) { set[g] = 1; });
    var bugun = bugunAnahtar();
    var uc = (bugun < son) ? bugun : son;             /* seri bugüne kadar bakar */

    var guncel = 0, telafiKullanilan = 0;
    for (var g = uc; g >= bas; g = gunEkle(g, -1)) {
      if (set[g]) { guncel++; continue; }
      if (g === bugun) continue;                      /* bugün henüz bitmedi */
      if (telafiKullanilan < TELAFI_HAKKI) { telafiKullanilan++; continue; }
      break;
    }

    var enUzun = 0, kosu = 0;
    for (var h = bas; h <= son; h = gunEkle(h, 1)) {
      if (set[h]) { kosu++; if (kosu > enUzun) enUzun = kosu; }
      else kosu = 0;
    }
    return { guncel: guncel, enUzun: enUzun, telafi: telafiKullanilan };
  }

  /* ==================================================================
     İLERLEME — üç tip, tek sözleşme. HER ÇAĞRIDA YENİDEN HESAPLANIR.
     ================================================================== */
  function ilerleme(slug) {
    var k = bul(slug); if (!k) return null;
    var kat = oku().katilim[slug] || null;
    if (!kat) {
      return { slug: slug, tip: k.tip, katildi: false, durum: null, oran: 0,
               tamam: false, gecenGun: 0, toplamGun: k.gun, kalanGun: k.gun,
               tarihsiz: 0, kanit: {}, adimlar: [], seri: 0, enUzunSeri: 0,
               telafiKalan: TELAFI_HAKKI, biriken: 0,
               hedef: k.hedef ? k.hedef.deger : k.gun,
               birim: k.hedef ? k.hedef.birim : 'gün' };
    }

    var p = pencere(k, kat);
    var bugun = bugunAnahtar();
    var gecen = Math.min(k.gun, gunFark(p.bas, bugun) + 1);
    if (gecen < 0) gecen = 0;

    var kanit = { olculdu: 0, cihaz: 0, video: 0, beyan: 0 };
    p.kayitlar.forEach(function (x) {
      var kn = x.kayit.kaynak || 'beyan';
      if (kanit[kn] === undefined) kanit[kn] = 0;
      kanit[kn]++;
    });

    /* Pencereye kayıt düşen GÜNLER üç tipte de hesaplanır — takvim kutuları
       bunu okur. Seri ve süreli hedefte gün sayısı ilerlemenin ÖLÇÜSÜ değil
       (orada adım ve kilometre sayılır) ama takvimde hangi güne kayıt
       düştüğünü göstermek yine de doğrudur ve tek gerçeği tekrarlar. */
    var gunSet = {};
    p.kayitlar.forEach(function (x) { gunSet[x.gun] = 1; });
    var gunler = Object.keys(gunSet).sort();

    var out = {
      slug: slug, tip: k.tip, katildi: true, durum: kat.durum,
      baslangic: kat.baslangic, bitis: kat.bitis || null, tur: kat.tur || 1,
      toplamGun: k.gun, gecenGun: gecen, kalanGun: Math.max(0, k.gun - gecen),
      tarihsiz: p.tarihsiz, kanit: kanit, kayitSayisi: p.kayitlar.length,
      gunler: gunler, adimlar: [], seri: 0, enUzunSeri: 0, telafiKalan: TELAFI_HAKKI
    };

    if (k.tip === 'sureli') {
      var birim = k.hedef.birim;
      var toplam = 0, sayilanKayit = 0, elenenBeyan = 0;
      p.kayitlar.forEach(function (x) {
        var m = x.kayit.metrik;
        if (!m || typeof m[birim] !== 'number') return;
        if (!sayisalMi(x.kayit)) { elenenBeyan++; return; }
        toplam += m[birim]; sayilanKayit++;
      });
      out.biriken = Math.round(toplam * 10) / 10;
      out.hedef = k.hedef.deger;
      out.birim = birim;
      out.birimAd = k.hedef.ad || birim;
      out.sayilanKayit = sayilanKayit;
      out.elenenBeyan = elenenBeyan;
      out.oran = Math.min(100, Math.round(out.biriken / out.hedef * 100));
      out.tamam = out.biriken >= out.hedef;

    } else if (k.tip === 'seri') {
      var kalanAdim = (k.adimlar || []).slice();
      /* Sıra korunur: bir adım, kendinden ÖNCEKİLER kapandıktan sonraki bir
         kayıtla kapanır. Aynı gün iki adım yapılabilir; tarih sırası yeter. */
      var sirali = p.kayitlar.slice().sort(function (a, b) {
        return String(a.kayit.tarihISO).localeCompare(String(b.kayit.tarihISO));
      });
      var i = 0;
      out.adimlar = kalanAdim.map(function (a) { return { slug: a.slug, ad: a.ad, tamam: false, tarih: null }; });
      sirali.forEach(function (x) {
        if (i >= out.adimlar.length) return;
        if (x.kayit.slug && x.kayit.slug === out.adimlar[i].slug) {
          out.adimlar[i].tamam = true;
          out.adimlar[i].tarih = x.kayit.tarihISO;
          i++;
        }
      });
      out.biriken = i;
      out.hedef = out.adimlar.length;
      out.birim = 'adım';
      out.birimAd = 'adım';
      out.siradaki = out.adimlar[i] || null;
      out.oran = out.hedef ? Math.round(i / out.hedef * 100) : 0;
      out.tamam = out.hedef > 0 && i >= out.hedef;

    } else {                                            /* aliskanlik */
      var seri = seriHesapla(gunler, p.bas, p.son);
      out.biriken = gunler.length;
      out.hedef = k.gun;
      out.birim = 'gün';
      out.birimAd = 'gün';
      out.bugunIsaretli = !!gunSet[bugun];
      out.seri = seri.guncel;
      out.enUzunSeri = seri.enUzun;
      out.telafiKalan = Math.max(0, TELAFI_HAKKI - seri.telafi);
      out.oran = Math.round(gunler.length / k.gun * 100);
      out.tamam = gunler.length >= k.gun;
    }

    /* Süre dolduysa ve hedef tutmadıysa: bitti ama tamamlanmadı. Sessizce
       "devam ediyor" göstermek kullanıcıyı bitmiş bir yarışta koşturur. */
    out.suresiDoldu = gecen >= k.gun;
    return out;
  }

  /* ---------------- katılım yaşam döngüsü ---------------- */
  function bul(slug) {
    return KATALOG.filter(function (k) { return k.slug === slug; })[0] || null;
  }

  function katil(slug) {
    var k = bul(slug); if (!k) return false;
    var d = oku();
    var eski = d.katilim[slug];
    d.katilim[slug] = {
      slug: slug,
      baslangic: new Date().toISOString(),
      durum: 'devam', bitis: null,
      tur: eski ? (eski.tur || 1) + 1 : 1
    };
    if (!yaz(d)) return false;
    _yansit();
    return true;
  }

  function birak(slug) {
    var d = oku(); var kat = d.katilim[slug]; if (!kat) return false;
    kat.durum = 'birakildi'; kat.bitis = new Date().toISOString();
    if (!yaz(d)) return false;
    _yansit();
    return true;
  }

  /* Alışkanlık challenge'ında "bugünü işaretle" — TEK HUNİ.
     Sayaç artırmaz; `antrenmanTamamla` üzerinden geçmişe kanıtlı bir kayıt
     düşürür ve ilerleme o kayıttan yeniden hesaplanır. */
  function isaretle(slug, ek) {
    var k = bul(slug); if (!k) return false;
    var st = S(); if (!st) return false;
    var i = ilerleme(slug);
    if (!i || !i.katildi || i.durum !== 'devam') return false;
    if (k.tip === 'aliskanlik' && i.bugunIsaretli) return false;   /* günde bir */

    st.antrenmanTamamla({
      ad: k.ad + ' · günlük görev',
      slug: (ek && ek.slug) || k.slug,
      tarihISO: new Date().toISOString(),
      metrik: (ek && ek.metrik) || null,
      dk: (ek && typeof ek.dk === 'number') ? ek.dk : null,
      kcal: (ek && typeof ek.kcal === 'number') ? ek.kcal : null,
      kaynak: (ek && ek.kaynak) || 'beyan'
    });
    return true;                                   /* fit:state → tazele() */
  }

  /* ---------------- kabuk şemasına yansıtma ---------------- */
  /* `dm_fit.challenge` dört ekranın okuduğu tek-nesne şeması. Motor onu
     silmez; birincil katılımı (en son katılınan `devam`) oraya yazar.
     Yazarken DEĞER UYDURMAZ: gun/seri/telafi hesaplanan sayılardır. */
  function _yansit() {
    var st = S(); if (!st) return;
    var d = oku();
    var adaylar = Object.keys(d.katilim)
      .map(function (s) { return d.katilim[s]; })
      .filter(function (x) { return x.durum === 'devam'; })
      .sort(function (a, b) { return String(b.baslangic).localeCompare(String(a.baslangic)); });

    var s = st.read();
    if (!adaylar.length) {
      var bitenVar = Object.keys(d.katilim).some(function (x) { return d.katilim[x].durum === 'tamamlandi'; });
      if (!bitenVar && s.challenge) { s.challenge = null; st.write(s); }
      return;
    }
    var kat = adaylar[0];
    var k = bul(kat.slug); if (!k) return;
    var i = ilerleme(kat.slug);
    /* ⚠ `tip` ALANI R16/1'DE EKLENDİ ve gerekçesi bir kusurdur:
       `seri` alanı alışkanlıkta "üst üste gün", diğer iki tipte `biriken`di
       (tekrar sayısı / kapanan adım). `programlarim-v1` bu alanı okuyup
       **"güncel seri · N gün"** diye basıyordu — süreli hedefe katılmış bir
       üyeye "132 gün güncel seri" yazıyordu. Aynı alan, tipe göre başka bir
       şey ölçünce okuyan taraf onu ayırt edemiyor. Alan artık tipini de
       taşıyor; "gün" diye basan ekran önce tipe bakar. */
    var yeni = {
      slug: k.slug, ad: k.ad, tip: k.tip,
      durum: i.tamam ? 'tamamlandi' : 'devam',
      gun: Math.max(1, Math.min(k.gun, i.gecenGun)),
      toplam: k.gun,
      seri: (k.tip === 'aliskanlik') ? i.seri : i.biriken,
      telafi: TELAFI_HAKKI - (i.telafiKalan === undefined ? TELAFI_HAKKI : i.telafiKalan)
    };
    var onceki = JSON.stringify(s.challenge || null);
    if (onceki === JSON.stringify(yeni)) return;      /* döngü kırıcı */
    s.challenge = yeni;
    st.write(s);
  }

  /* Tamamlanma mühürü — hedef tutunca durum kalıcı olarak `tamamlandi`.
     Rozet/puan bu mühre bakar; kayıt sonradan değişse bile geri alınmaz
     (ekranın kendi sözü: "kazanılan rozet geri alınmaz"). */
  function tazele() {
    var d = oku(); var degisti = false;
    Object.keys(d.katilim).forEach(function (slug) {
      var kat = d.katilim[slug];
      if (kat.durum !== 'devam') return;
      var i = ilerleme(slug);
      if (i && i.tamam) {
        kat.durum = 'tamamlandi';
        kat.bitis = new Date().toISOString();
        degisti = true;
      }
    });
    if (degisti) yaz(d);
    _yansit();
    if (kok.FIT_ROZET && kok.FIT_ROZET.degerlendir) kok.FIT_ROZET.degerlendir();
    return degisti;
  }

  /* ---------------- listeleme ---------------- */
  function katilimlar() {
    var d = oku();
    return Object.keys(d.katilim).map(function (s) {
      return { katilim: d.katilim[s], katalog: bul(s), ilerleme: ilerleme(s) };
    }).filter(function (x) { return x.katalog; })
      .sort(function (a, b) {
        return String(b.katilim.baslangic).localeCompare(String(a.katilim.baslangic));
      });
  }

  function ozet() {
    var hepsi = katilimlar();
    return {
      devam: hepsi.filter(function (x) { return x.katilim.durum === 'devam'; }),
      biten: hepsi.filter(function (x) { return x.katilim.durum === 'tamamlandi'; }),
      birakilan: hepsi.filter(function (x) { return x.katilim.durum === 'birakildi'; }),
      acik: KATALOG.filter(function (k) {
        var kat = oku().katilim[k.slug];
        return !kat || kat.durum !== 'devam';
      })
    };
  }

  /* ---------------- abonelik ---------------- */
  function dinle(fn) {
    document.addEventListener('fit:state', fn);
    kok.addEventListener('fit-challenge-degisti', fn);
    kok.addEventListener('storage', function (e) {
      if (!e.key || e.key === KEY || e.key === 'dm_fit') fn();
    });
    fn();
  }

  var API = {
    KATALOG: KATALOG, TIP: TIP, TELAFI_HAKKI: TELAFI_HAKKI,
    /* Alışkanlık serisi hesabı DIŞARI AÇILDI (R15/7). Su takibi de "üst üste
       kaç gün tuttu" sorusunu soruyor; ikinci bir seri mantığı yazmak yerine
       aynı fonksiyonu çağırıyor — telafi kuralı dahil davranış tek yerde. */
    seriHesapla: seriHesapla,
    bul: bul, listele: function () { return KATALOG.slice(); },
    katil: katil, birak: birak, isaretle: isaretle,
    ilerleme: ilerleme, katilimlar: katilimlar, ozet: ozet,
    tazele: tazele, dinle: dinle,
    oku: oku,
    temizle: function () { try { kok.localStorage.removeItem(KEY); } catch (e) {} yaz(bos()); }
  };

  kok.FIT_CHALLENGE = API;

  /* Kabuk her yazdığında ilerlemeyi yeniden hesapla ve mührü kontrol et.
     `_yansit` kendi yazdığında tekrar tetiklenir; JSON karşılaştırması
     döngüyü kırar (yukarıda). */
  document.addEventListener('fit:state', function () { tazele(); });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { tazele(); });
  } else { tazele(); }

})(window);
