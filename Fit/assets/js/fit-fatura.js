/* =====================================================================
 FIT_FATURA — FATURA DEFTERİNİN TEK KAYNAĞI
 ---------------------------------------------------------------------
 Numara · tarih · tür · durum · kalem dökümü · tahsilat bilgisi. Hem
 `odemelerim-v1.html`in fatura tablosu hem de belge açılır penceresi
 (#fdModal) buradan okur; iki yerde iki farklı rakam olamaz.

 🔴 TUTARLAR KURUŞ TAMSAYISIDIR. Kayan noktalı para aritmetiği
 (0.1+0.2) yuvarlama hatası üretir; gösterim anında biçimlenir.
 🔴 KDV ORANI TEK YERDE: `KDV_ORAN`. Dijital hizmet için %20 ve tutarlar
 KDV DÂHİL girilir; ara toplam ile vergi ondan AYRIŞTIRILIR
 (`ara = round(toplam / 1.20)`), tersi değil — fatura toplamının
 kuruşu kaymasın diye.

 ⚠ SATICI KÜNYESİ BİLEREK BOŞ: DadaFit'in ticari unvanı, vergi dairesi
 ve VKN'si henüz yok. Buraya uydurma bir vergi numarası yazmak SAHTE
 BELGE üretmek olurdu; alan yer tutucu metinle duruyor ve ekranda ne
 olduğu yazılı. Gerçek künye geldiğinde tek nesne değişir.

 ⚠ ETTN'ler örnektir ve gerçek bir e-Arşiv kaydına karşılık gelmez;
 ekranın başındaki dürüst şerit bunu söylüyor.
 ===================================================================== */
window.FIT_FATURA = (function () {
  'use strict';

  var KDV_ORAN = 20;

  /* Satıcı — gerçek künye gelene kadar yer tutucu. */
  var SATICI = {
    unvan: 'DadaFit',
    kunyeYok: 'Ticari unvan, vergi dairesi ve vergi numarası satışa açılmadan önce yazılacak.'
  };

  /* Alıcı — kullanıcının "Fatura Bilgilerim" formunda kaydettiği bilgi
     varsa O kullanılır (tarayıcı hafızası), yoksa maket persona. İki
     ekran böylece birbirine bağlanır: yazdığın bilgi belgede görünür. */
  var ALICI_VARSAYILAN = {
    ad: 'Elif Şahin', kimlikEtiket: 'T.C. Kimlik No', kimlik: '—',
    adres: 'Adres bilgisi girilmedi', eposta: 'elif@ornek.com'
  };

  /* kalem: [açıklama, alt açıklama, adet, birim fiyat (kuruş, KDV dâhil)] */
  var DEFTER = [
    { no:'DFT-2026-004150', ettn:'8f2a1c60-1d44-4e0b-9a31-7c5e2b0a4150',
      tarih:'22 Ağustos 2026', tarihKisa:'22 Ağu 2026', tur:'antrenor',
      durum:'ok', durumAd:'Ödendi', donem:'Tek seferlik',
      konu:'Antrenör seansı — Selin Aksoy · birebir online',
      kalem:[['Antrenör seansı — Selin Aksoy','Birebir online seans · 50 dk',1,45000]],
      kart:'Visa •••• 4242', marka:'fa-cc-visa', odemeAni:'22 Ağustos 2026, 19:40' },

    { no:'DFT-2026-004128', ettn:'3b71e9a2-52c8-4d17-8f60-1a9d4e7c4128',
      tarih:'15 Ağustos 2026', tarihKisa:'15 Ağu 2026', tur:'uyelik',
      durum:'ok', durumAd:'Ödendi', donem:'15 Ağu – 14 Eyl 2026',
      konu:'DadaFit Pro — Ağustos dönemi',
      kalem:[['DadaFit Pro — Aylık','Platform paketi · 15 Ağu – 14 Eyl 2026 dönemi',1,9900]],
      kart:'Visa •••• 4242', marka:'fa-cc-visa', odemeAni:'15 Ağustos 2026, 09:14' },

    { no:'DFT-2026-004131', ettn:'c04d7b18-9e33-4a52-b7e1-6f2c8d514131',
      tarih:'11 Ağustos 2026', tarihKisa:'11 Ağu 2026', tur:'antrenor',
      durum:'ok', durumAd:'Ödendi', donem:'Tek seferlik',
      konu:'Antrenör seansı — Mert Özkan · form kontrolü',
      kalem:[['Antrenör seansı — Mert Özkan','Form kontrolü seansı · 30 dk',1,45000]],
      kart:'Visa •••• 4242', marka:'fa-cc-visa', odemeAni:'11 Ağustos 2026, 12:05' },

    { no:'DFT-2026-004095', ettn:'5a19f4d7-2b60-4c88-91ae-3d7b0c624095',
      tarih:'2 Ağustos 2026', tarihKisa:'2 Ağu 2026', tur:'antrenor',
      durum:'ok', durumAd:'Ödendi', donem:'2 Ağu – 1 Eyl 2026',
      konu:'Antrenör paketi — Selin Aksoy · 4 seans',
      kalem:[['Antrenör paketi — Selin Aksoy','Kuvvet Temeli · 4 seanslık paket',1,140000]],
      kart:'Visa •••• 4242', marka:'fa-cc-visa', odemeAni:'2 Ağustos 2026, 08:31' },

    { no:'DFT-2026-003988', ettn:'7e2c5081-4f19-4b3d-a06c-92e147d03988',
      tarih:'29 Temmuz 2026', tarihKisa:'29 Tem 2026', tur:'iade',
      durum:'wait', durumAd:'İade sürecinde', donem:'Tek seferlik',
      konu:'Antrenör seansı — Selin Aksoy · iade talebi açık',
      kalem:[['Antrenör seansı — Selin Aksoy','Birebir online seans · 50 dk · IAD-2026-0042 talebi açık',1,45000]],
      kart:'Visa •••• 4242', marka:'fa-cc-visa', odemeAni:'29 Temmuz 2026, 18:22' },

    { no:'DFT-2026-003901', ettn:'1d68b3ca-77e5-4920-8c4f-0b5a2e693901',
      tarih:'20 Temmuz 2026', tarihKisa:'20 Tem 2026', tur:'antrenor',
      durum:'ok', durumAd:'Ödendi', donem:'Tek seferlik',
      konu:'Antrenör paketi — Mert Özkan · 8 seans',
      kalem:[['Antrenör paketi — Mert Özkan','Birebir Takip · 8 seanslık paket',1,240000]],
      kart:'Visa •••• 4242', marka:'fa-cc-visa', odemeAni:'20 Temmuz 2026, 14:02' },

    { no:'DFT-2026-003844', ettn:'9c3f0e26-6a81-4d75-bb12-5e8c1f403844',
      tarih:'15 Temmuz 2026', tarihKisa:'15 Tem 2026', tur:'uyelik',
      durum:'ok', durumAd:'Ödendi', donem:'15 Tem – 14 Ağu 2026',
      konu:'DadaFit Pro — Temmuz dönemi',
      kalem:[['DadaFit Pro — Aylık','Platform paketi · 15 Tem – 14 Ağu 2026 dönemi',1,9900]],
      kart:'Visa •••• 4242', marka:'fa-cc-visa', odemeAni:'15 Temmuz 2026, 09:11' },

    { no:'DFT-2026-003512', ettn:'2f47ac93-08d6-4e61-97ba-4c0d3b213512',
      tarih:'15 Haziran 2026', tarihKisa:'15 Haz 2026', tur:'uyelik',
      durum:'ok', durumAd:'Ödendi', donem:'15 Haz – 14 Tem 2026',
      konu:'DadaFit Pro — Haziran dönemi',
      kalem:[['DadaFit Pro — Aylık','Platform paketi · 15 Haz – 14 Tem 2026 dönemi',1,9900]],
      kart:'Visa •••• 4242', marka:'fa-cc-visa', odemeAni:'15 Haziran 2026, 09:08' },

    { no:'DFT-2026-002995', ettn:'6b0e19f5-3c72-4a08-85d4-7a1e6c902995',
      tarih:'20 Şubat 2026', tarihKisa:'20 Şub 2026', tur:'iade',
      durum:'off', durumAd:'İade edildi', donem:'İade belgesi',
      konu:'DadaFit Pro — Şubat dönemi iadesi',
      kalem:[['DadaFit Pro — Şubat dönemi iadesi','Cayma hakkı · IAD-2026-0018 talebinin karşılığı',1,-9900]],
      kart:'Visa •••• 4242', marka:'fa-cc-visa', odemeAni:'20 Şubat 2026, 11:47' },

    { no:'DFT-2026-002980', ettn:'4a85d2b1-1e69-4f30-b2c7-8d3f0a712980',
      tarih:'14 Şubat 2026', tarihKisa:'14 Şub 2026', tur:'antrenor',
      durum:'ok', durumAd:'Ödendi', donem:'Tek seferlik',
      konu:'Antrenör paketi — Deniz Kaya · 8 seans',
      kalem:[['Antrenör paketi — Deniz Kaya','Başlangıç Programı · 8 seanslık paket',1,240000]],
      kart:'Visa •••• 4242', marka:'fa-cc-visa', odemeAni:'14 Şubat 2026, 10:19' }
  ];

  /* =====================================================================
   GERÇEK KAYITLAR — K8 (Ajan 2, 2026-08-30)
   ---------------------------------------------------------------------
   `DEFTER` yukarıdaki 10 satır SABİT ÖRNEK VERİDİR — dokunulmadı. Bu
   tarayıcıda gerçekten yapılan abonelik/randevu ödemeleri `ekle()` ile
   `dm_fit_fatura_kayit_v1`e yazılır ve sayfa yüklenirken DEFTER'in
   BAŞINA eklenir (en yeni en üstte, örnek satırların önünde). İki liste
   tek dizide birleşiyor ki `odemelerim-v1.html`in fatura tablosu ve
   `#fdModal` belge penceresi tek kaynaktan okumaya devam etsin.
   Gerçek satır `kaynak:'gercek'` taşır; örnek satırlarda bu alan yok —
   ekranlar ikisini birbirinden bu alanla ayırt eder ve SÖYLER (dürüstlük
   kuralı, `docs/fit-kit.md` §13 `.adm-src`in public karşılığı). */
  var GERCEK_ANAHTAR = 'dm_fit_fatura_kayit_v1';

  function gercekOku() {
    try {
      var d = JSON.parse(localStorage.getItem(GERCEK_ANAHTAR) || 'null');
      return Array.isArray(d) ? d : [];
    } catch (e) { return []; }
  }
  function gercekYaz(liste) {
    try { localStorage.setItem(GERCEK_ANAHTAR, JSON.stringify(liste)); } catch (e) {}
  }
  /* saklanan liste de "en yeni ilk" sırada; DEFTER'e ters sıradan
     unshift edilir ki en yeni gerçek satır en üste, en eski gerçek
     satır örnek verinin hemen üstüne otursun — aralarındaki sıra bozulmaz. */
  (function () {
    var gc = gercekOku();
    for (var i = gc.length - 1; i >= 0; i--) DEFTER.unshift(gc[i]);
  })();

  function ay3(d) {
    return ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][d.getMonth()];
  }
  function ayUzun(d) {
    return ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'][d.getMonth()];
  }
  function no2(n) { return (n < 10 ? '0' : '') + n; }

  /* `kayit`: {tur, donem, konu, kalem} — kalem burada da [açıklama, alt
     açıklama, adet, birim fiyat KURUŞ KDV DÂHİL] biçimindedir, çağıran
     kuruşu kendi hesaplar (fiyat parametreleri koda gömülmez — K13). */
  function ekle(kayit) {
    var s = new Date();
    var tarih = s.getDate() + ' ' + ayUzun(s) + ' ' + s.getFullYear();
    var tarihKisa = s.getDate() + ' ' + ay3(s) + ' ' + s.getFullYear();
    var saat = no2(s.getHours()) + ':' + no2(s.getMinutes());
    var kayitTam = {
      no: 'DFT-' + s.getFullYear() + '-' + Math.floor(100000 + Math.random() * 899999),
      ettn: 'g' + Math.random().toString(16).slice(2, 10) + '-gerc-ek00-0000-' + Math.random().toString(16).slice(2, 14),
      tarih: tarih, tarihKisa: tarihKisa, tur: kayit.tur,
      durum: 'ok', durumAd: 'Ödendi', donem: kayit.donem || 'Tek seferlik',
      konu: kayit.konu, kalem: kayit.kalem,
      kart: 'Visa •••• 4242', marka: 'fa-cc-visa',
      odemeAni: tarih + ', ' + saat, kaynak: 'gercek'
    };
    DEFTER.unshift(kayitTam);
    var liste = gercekOku();
    liste.unshift(kayitTam);
    gercekYaz(liste);
    return kayitTam;
  }

  /* ---- para: kuruş tamsayısı → "₺1.400,00" ---- */
  function tl(kurus) {
    var eksi = kurus < 0;
    var t = (Math.abs(Math.round(kurus)) / 100).toFixed(2);
    var p = t.split('.');
    return (eksi ? '−' : '') + '₺' + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + p[1];
  }

  function bul(no) {
    for (var i = 0; i < DEFTER.length; i++) if (DEFTER[i].no === no) return DEFTER[i];
    return null;
  }

  /* Toplamlar KDV DÂHİL tutardan ayrıştırılır (bkz. başlık şerhi). */
  function toplamlar(f) {
    var genel = 0;
    f.kalem.forEach(function (k) { genel += k[2] * k[3]; });
    var ara = Math.round(genel / (1 + KDV_ORAN / 100));
    return { ara: ara, kdv: genel - ara, genel: genel };
  }

  /* Alıcı künyesi: kullanıcı "Fatura Bilgilerim"i doldurduysa oradan. */
  function alici() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem('dm_fit_fatura_v1') || 'null'); } catch (e) { d = null; }
    if (!d) return ALICI_VARSAYILAN;
    var kurumsal = d.tip === 'kurumsal';
    var adres = [d.ftAdres, [d.ftIlce, d.ftIl].filter(Boolean).join(' / '), d.ftPosta]
      .filter(function (x) { return x && String(x).trim(); }).join(', ');
    return {
      ad: (kurumsal ? d.ftUnvan : d.ftAd) || ALICI_VARSAYILAN.ad,
      kimlikEtiket: kurumsal ? 'Vergi No (VKN)' : 'T.C. Kimlik No',
      kimlik: (kurumsal ? d.ftVkn : d.ftTckn) || '—',
      vergiDairesi: kurumsal ? (d.ftDaire || '—') : null,
      adres: adres || ALICI_VARSAYILAN.adres,
      eposta: d.ftEposta || ALICI_VARSAYILAN.eposta,
      kaynak: 'form'
    };
  }

  return {
    defter: DEFTER, satici: SATICI, kdvOran: KDV_ORAN,
    tl: tl, bul: bul, toplamlar: toplamlar, alici: alici, ekle: ekle
  };
})();
