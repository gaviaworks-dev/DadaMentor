/* =====================================================================
   DADAFIT — YORUM VE DEĞERLENDİRME SÖZLEŞMESİ            (R19 · A15)
   ---------------------------------------------------------------------
   TEK KAYNAK. Egzersiz detay · program detay · antrenör profili aynı
   modülü okur; yönetim panelinin moderasyon kuyruğu `hepsi()`yi okur.

   EMSAL — dadagastro-profil, SALT OKUMA ile ölçüldü:
     resources/views/tarifler/_reviews.blade.php        (267 satır)
     resources/views/tarifler/_stars.blade.php          (yarım yıldız kuralı)
     public/reference/tarif-detay/tarif-detay.js:280-411 (form · filtre)
     public/reference/tarif-detay/tarif-detay.css:1070-1172 (ölçüler)
     app/Http/Controllers/Web/RecipeController.php:271-286 (sıra · limit)
     app/Domain/Gastro/Enums/ReviewStatus.php           (altı durum)
     app/Domain/Gastro/Services/ReviewSummaryService.php (ortalama kuralı)
     app/Domain/Gastro/Policies/ReviewPolicy.php:69     (kim yanıtlar)

   GERÇEKTEN KAYDEDER. Bu yüzey maket DEĞİLDİR: yazılan yorum
   `localStorage['dm_fit_yorum_v1']`e gider ve yenilemede durur. Ekran
   "sunucuya gitmez, bu tarayıcıda saklanır" der — "kaydedilmedi" DEMEZ.

   İKİ DEPO, İKİ İŞ:
     dm_fit_yorum_v1   = { surum:1, yorumlar:[…], guncelleme:ISO }
                         KULLANICININ yazdığı yorumlar + tohum kayıtların
                         durum değişiklikleri (moderasyon).
     dm_fit_faydali_v1 = { surum:1, oylar:{ '<id>':1 }, guncelleme:ISO }
                         KULLANICININ faydalı oyu. ⚠ Bu anahtar profil-v1'de
                         R19'da kuruldu ve BOZULMADI — biçimi birebir aynı,
                         motor buraya taşındı. İkinci bir "faydalı" deposu
                         YOK; profil-v1 artık bu modülü çağırır.
     Taban sayı depoda tutulmaz: tohum kaydın `faydali` alanıdır, HTML'de
     `data-base-oy`dur. Depo yalnız KULLANICININ oyunu tutar.

   ⚠ Ters tırnak (template literal) kullanılmaz — docs/lessons.md §30.
   ===================================================================== */
(function (window, document) {
  'use strict';

  var ANAHTAR_YORUM   = 'dm_fit_yorum_v1';
  var ANAHTAR_FAYDALI = 'dm_fit_faydali_v1';
  var SURUM = 1;

  /* --- Gastro'nun altı durumu (ReviewStatus.php:12-17), Türkçe ad ------
     Moderasyon paneli (A14) bu listeyi okuyup çipini kurar. Gastro'nun
     etiketleri: Onay Bekliyor · Yayında · Reddedildi · Şikayetli · Gizli ·
     Kaldırıldı (ReviewStatus::label(), :21-28). Yeni durum İCAT EDİLMEDİ. */
  var DURUMLAR = [
    { ad: 'bekliyor',   etiket: 'Onay Bekliyor', gastro: 'pending',  sinif: 'wait' },
    { ad: 'onayli',     etiket: 'Yayında',       gastro: 'approved', sinif: 'ok' },
    { ad: 'reddedildi', etiket: 'Reddedildi',    gastro: 'rejected', sinif: 'stop' },
    { ad: 'sikayetli',  etiket: 'Şikayetli',     gastro: 'flagged',  sinif: 'wait' },
    { ad: 'gizli',      etiket: 'Gizli',         gastro: 'hidden',   sinif: 'off' },
    { ad: 'kaldirildi', etiket: 'Kaldırıldı',    gastro: 'removed',  sinif: 'off' }
  ];

  /* --- Varlık künyeleri — moderasyon kuyruğu satırında "nerede" sütunu -- */
  var VARLIK = {
    'egzersiz|goblet-squat':            { ad: 'Goblet Squat',            yol: 'egzersiz-detay-v1.html?slug=goblet-squat' },
    'egzersiz|sinav':                   { ad: 'Şınav',                   yol: 'egzersiz-detay-v1.html?slug=sinav' },
    'egzersiz|plank':                   { ad: 'Plank',                   yol: 'egzersiz-detay-v1.html?slug=plank' },
    'program|4-hafta-ev-antrenmani':    { ad: '4 Hafta Ev Antrenmanı',   yol: 'program-detay-v1.html?slug=4-hafta-ev-antrenmani' },
    'program|8-hafta-guc':              { ad: '8 Hafta Güç Programı',    yol: 'program-detay-v1.html?slug=8-hafta-guc' },
    'antrenor|selin-aksoy':             { ad: 'Selin Aksoy',             yol: 'antrenor-detay-v1.html?slug=selin-aksoy' },
    'antrenor|mert-ozkan':              { ad: 'Mert Özkan',              yol: 'antrenor-detay-v1.html?slug=mert-ozkan' }
  };

  var AVA = 'https://images.unsplash.com/';
  var FOTO = {
    pinar:  AVA + 'photo-1544005313-94ddf0286df2?w=120&q=80&auto=format&fit=crop&exp=7&gam=6&sat=-9&high=8&vib=5',
    mert:   AVA + 'photo-1500648767791-00dcc994a43e?w=120&q=80&auto=format&fit=crop&exp=7&gam=6&sat=-9&high=8&vib=5',
    elif:   AVA + 'photo-1487412720507-e7ab37603c6f?w=120&q=80&auto=format&fit=crop&exp=7&gam=6&sat=-9&high=8&vib=5',
    burak:  AVA + 'photo-1531123897727-8f129e1688ce?w=120&q=80&auto=format&fit=crop&exp=7&gam=6&sat=-9&high=8&vib=5',
    ayse:   AVA + 'photo-1438761681033-6461ffad8d80?w=120&q=80&auto=format&fit=crop&exp=7&gam=6&sat=-9&high=8&vib=5',
    kerem:  AVA + 'photo-1507003211169-0a1dd7228f2d?w=120&q=80&auto=format&fit=crop&exp=7&gam=6&sat=-9&high=8&vib=5'
  };

  /* gün cinsinden geriye giden ISO damgası — "3 gün önce" metni buradan */
  function gunOnce(g) {
    var d = new Date();
    d.setDate(d.getDate() - g);
    return d.toISOString();
  }

  /* --- TOHUM KAYITLAR ---------------------------------------------------
     Örnek veridir; sunucu yoktur. profil-v1 ve antrenor-detay'ın ekranda
     ZATEN duran yorumları buraya BİREBİR taşındı (ad · metin · puan ·
     etiket · yanıt · faydalı taban sayısı) — veri kaybı yok, yalnız
     kaynak tek yere indi. at-1/at-2/at-3 kimlikleri profil-v1'in
     `data-review-id`leriyle AYNI: eski faydalı oyları geçerli kalır. */
  var TOHUM = [
    /* --- antrenör · Selin Aksoy (profil-v1 atyorumlar + antrenor-detay) --- */
    { id: 'at-1', tur: 'antrenor', slug: 'selin-aksoy', puan: 5, durum: 'onayli', faydali: 14,
      yazar: { ad: 'Pınar G.', foto: FOTO.pinar, rozet: 'Doğrulanmış danışan', alt: 'Online danışan · 4 ay' },
      etiketler: ['Evde Antrenman', 'Başlangıç'], tarih: gunOnce(14),
      metin: 'Spor salonuna adım atmaya çekinen biriydim. Her şeyi evimde, kendi tempomda yapabileceğim şekilde kurdu. Hiç yargılanmadığımı hissettim — bu benim için en önemlisiydi.',
      yanit: { ad: 'Selin Aksoy', rol: 'Antrenörün yanıtı', tarih: gunOnce(13),
        metin: 'Bu kadar yol katettiğin için tebrikler Pınar! Düzenli alışkanlığın harika 👏' } },

    { id: 'at-2', tur: 'antrenor', slug: 'selin-aksoy', puan: 5, durum: 'onayli', faydali: 9,
      yazar: { ad: 'Mert A.', foto: FOTO.mert, rozet: 'Doğrulanmış danışan', alt: 'Online danışan · 6 ay' },
      etiketler: ['Kilo Yönetimi', 'Online'], tarih: gunOnce(30),
      metin: 'Masa başı işten dolayı sürekli yorgundum. Plan her hafta yenileniyor, sıkılmama izin vermiyor. Mesaj attığımda hep hızlı dönüyor; kendimi yalnız hissetmedim.',
      yanit: null },

    { id: 'at-3', tur: 'antrenor', slug: 'selin-aksoy', puan: 5, durum: 'onayli', faydali: 8,
      yazar: { ad: 'Elif D.', foto: FOTO.elif, rozet: 'Doğrulanmış danışan', alt: 'Hibrit danışan · 3 ay' },
      etiketler: ['Başlangıç', 'Beslenme'], tarih: gunOnce(32),
      metin: 'Daha önce denediğim her şey beni kötü hissettirip bırakmama neden olmuştu. Beden-pozitif yaklaşımı sayesinde ilk kez tartı yerine kendime odaklandım. Diyetisyeniyle ortak çalışması büyük artı.',
      yanit: null },

    /* R20 · Bu iki tohum kaydın durumu BİLEREK 'onayli' DEĞİL: moderasyon
       kuyruğunun gerçek veriden beslendiğini gösteren tek yol, veride
       gerçekten denetim bekleyen bir kayıt bulunmasıdır. Public tarafta
       ikisi de listede GÖRÜNMEZ (`getir()` varsayılan olarak yalnız
       onaylıları döner) — yönetim panelinde görünür. `sebep` alanı yalnız
       şikayetli kayıtta vardır; bildirim akışı sebep sormuyor (kuyruk 30). */
    { id: 'at-4', tur: 'antrenor', slug: 'selin-aksoy', puan: 4, durum: 'sikayetli',
      sebep: 'reklam', bildiren: 2, faydali: 3,
      yazar: { ad: 'Kerem Y.', foto: FOTO.kerem, rozet: 'Doğrulanmış danışan', alt: 'Yüz yüze danışan · 2 ay' },
      etiketler: ['Güç & Kondisyon'], tarih: gunOnce(45),
      metin: 'Programın kendisi çok iyi kurgulanmış, ilerlemeyi görüyorum. Tek eksik randevu bulmak bazen zor oluyor — çok talep görüyor.',
      yanit: null },

    /* --- egzersiz · Goblet Squat --------------------------------------- */
    { id: 'eg-1', tur: 'egzersiz', slug: 'goblet-squat', puan: 5, durum: 'onayli', faydali: 22,
      yazar: { ad: 'Burak T.', foto: FOTO.burak, rozet: '', alt: '' },
      etiketler: ['Evde Antrenman'], tarih: gunOnce(6),
      metin: 'Dizim uzun süredir ağrıyordu ve klasik squat\'ta form bozuyordum. Goblet varyasyonunda ağırlığı önde tutunca gövde dik kalıyor, ağrı da gitti. Videodaki dirsek-diz teması ipucu tam yerinde.',
      yanit: null },

    { id: 'eg-2', tur: 'egzersiz', slug: 'goblet-squat', puan: 4, durum: 'onayli', faydali: 11,
      yazar: { ad: 'Ayşe K.', foto: FOTO.ayse, rozet: '', alt: '' },
      etiketler: ['Başlangıç'], tarih: gunOnce(19),
      metin: 'Ekipmansız başlamak isteyenler için: kettlebell yerine su dolu bir bidon da iş görüyor. Adım adım anlatım net, tek isteğim nefes ritminin biraz daha açıklanması.',
      yanit: { ad: 'Selin Aksoy', rol: 'Antrenörün yanıtı', tarih: gunOnce(18),
        metin: 'Haklısın Ayşe — inerken nefes al, kalkarken ver. Anlatıma ekledik, teşekkürler.' } },

    { id: 'eg-3', tur: 'egzersiz', slug: 'goblet-squat', puan: 3, durum: 'bekliyor', faydali: 2,
      yazar: { ad: 'Kerem Y.', foto: FOTO.kerem, rozet: '', alt: '' },
      etiketler: [], tarih: gunOnce(41),
      metin: 'Hareketin kendisi iyi ama benim boyumda topuk yüksekliği olmadan derine inemiyorum. Alternatif olarak plaka koymayı deneyenler için bir not olsaydı iyi olurdu.',
      yanit: null },

    /* --- program · 4 Hafta Ev Antrenmanı -------------------------------- */
    { id: 'pr-1', tur: 'program', slug: '4-hafta-ev-antrenmani', puan: 5, durum: 'onayli', faydali: 17,
      yazar: { ad: 'Pınar G.', foto: FOTO.pinar, rozet: 'Programı bitirdi', alt: '4 hafta tamamlandı' },
      etiketler: ['Evde Antrenman', 'Başlangıç'], tarih: gunOnce(9),
      metin: 'Dört haftayı da bitirdim. En sevdiğim yanı günlerin 25 dakikayı geçmemesi — işten sonra bahane üretemiyorsun. Üçüncü haftada zorlaştı ama bıraktırmadı.',
      yanit: null },

    { id: 'pr-2', tur: 'program', slug: '4-hafta-ev-antrenmani', puan: 4, durum: 'onayli', faydali: 6,
      yazar: { ad: 'Mert A.', foto: FOTO.mert, rozet: 'Programı bitirdi', alt: '4 hafta tamamlandı' },
      etiketler: ['Kilo Yönetimi'], tarih: gunOnce(26),
      metin: 'Kurgu iyi, gün gün ne yapacağını biliyorsun. Dinlenme günlerinde esneme önerisi olsaydı beş yıldız verirdim.',
      yanit: { ad: 'DadaFit Ekibi', rol: 'Program sahibinin yanıtı', tarih: gunOnce(25),
        metin: 'Not alındı Mert — dinlenme günü esneme akışı sıradaki güncellemede geliyor.' } },

    { id: 'pr-3', tur: 'program', slug: '4-hafta-ev-antrenmani', puan: 5, durum: 'onayli', faydali: 4,
      yazar: { ad: 'Ayşe K.', foto: FOTO.ayse, rozet: '', alt: '2. hafta' },
      etiketler: ['Başlangıç'], tarih: gunOnce(38),
      metin: 'İkinci haftadayım. Hiç spor geçmişim yoktu; ilk gün korktum ama hareketlerin hepsinin video anlatımı olması işi kolaylaştırdı.',
      yanit: null }
  ];

  /* ---------------------------------------------------------------- depo */
  function oku(anahtar, bos) {
    try {
      var ham = localStorage.getItem(anahtar);
      if (!ham) return bos();
      var d = JSON.parse(ham);
      if (!d || typeof d !== 'object') return bos();
      return d;
    } catch (e) { return bos(); }
  }
  function yaz(anahtar, d) {
    try {
      d.guncelleme = new Date().toISOString();
      localStorage.setItem(anahtar, JSON.stringify(d));
      return true;
    } catch (e) { return false; }
  }
  function bosYorum()   { return { surum: SURUM, yorumlar: [], durumlar: {} }; }
  function bosFaydali() { return { surum: SURUM, oylar: {} }; }

  function depoYorum() {
    var d = oku(ANAHTAR_YORUM, bosYorum);
    if (!d.yorumlar || Object.prototype.toString.call(d.yorumlar) !== '[object Array]') d.yorumlar = [];
    if (!d.durumlar || typeof d.durumlar !== 'object') d.durumlar = {};
    if (!d.yanitlar || typeof d.yanitlar !== 'object') d.yanitlar = {};
    if (!d.bildirimler || typeof d.bildirimler !== 'object') d.bildirimler = {};
    return d;
  }
  function depoFaydali() {
    var d = oku(ANAHTAR_FAYDALI, bosFaydali);
    if (!d.oylar || typeof d.oylar !== 'object') d.oylar = {};
    return d;
  }

  /* --------------------------------------------------------------- yardım */
  function kopya(y) {
    var c = {}, k;
    for (k in y) if (Object.prototype.hasOwnProperty.call(y, k)) c[k] = y[k];
    c.yazar = y.yazar ? { ad: y.yazar.ad, foto: y.yazar.foto, rozet: y.yazar.rozet, alt: y.yazar.alt } : null;
    c.etiketler = (y.etiketler || []).slice();
    c.yanit = y.yanit ? { ad: y.yanit.ad, rol: y.yanit.rol, metin: y.yanit.metin, tarih: y.yanit.tarih } : null;
    return c;
  }

  function varlikAd(tur, slug) {
    var v = VARLIK[tur + '|' + slug];
    return v ? v.ad : slug;
  }
  function varlikYol(tur, slug) {
    var v = VARLIK[tur + '|' + slug];
    return v ? v.yol : null;
  }

  /* Tohum + kullanıcı kayıtları, moderasyon geçersiz kılmaları uygulanmış. */
  function tumu() {
    var d = depoYorum(), liste = [], i, y;
    for (i = 0; i < TOHUM.length; i++) {
      y = kopya(TOHUM[i]);
      y.tohum = true;
      if (d.durumlar[y.id]) y.durum = d.durumlar[y.id];
      if (d.yanitlar && d.yanitlar[y.id]) y.yanit = d.yanitlar[y.id];
      liste.push(y);
    }
    for (i = 0; i < d.yorumlar.length; i++) {
      y = kopya(d.yorumlar[i]);
      y.tohum = false;
      if (d.durumlar[y.id]) y.durum = d.durumlar[y.id];
      if (d.yanitlar && d.yanitlar[y.id]) y.yanit = d.yanitlar[y.id];
      liste.push(y);
    }
    for (i = 0; i < liste.length; i++) {
      liste[i].varlikAd  = varlikAd(liste[i].tur, liste[i].slug);
      liste[i].varlikYol = varlikYol(liste[i].tur, liste[i].slug);
      liste[i].faydaliToplam = (parseInt(liste[i].faydali, 10) || 0) + (faydaliMi(liste[i].id) ? 1 : 0);
      liste[i].bildirildi = !!d.bildirimler[liste[i].id];
    }
    /* Gastro sırası: RecipeController.php:284 `->latest('id')` — EN YENİ
       ÖNCE, sabit. Gastro'da kullanıcıya açık bir sıralama ekseni YOK. */
    liste.sort(function (a, b) { return (b.tarih || '').localeCompare(a.tarih || ''); });
    return liste;
  }

  function faydaliMi(id) {
    return !!depoFaydali().oylar[id];
  }

  /* ------------------------------------------------------------ sözleşme */
  var API = {
    ANAHTAR: ANAHTAR_YORUM,
    ANAHTAR_FAYDALI: ANAHTAR_FAYDALI,
    DURUMLAR: DURUMLAR.slice(),
    /* Gastro'da yorum gövdesi max 4000 karakter (ReviewController.php:37),
       yanıt max 2000 (:119). Puan 1..5 tam sayı ve ZORUNLU (:36). */
    SINIR: { metin: 4000, yanit: 2000, listeLimit: 30 },

    /* Bütün yorumlar — moderasyon kuyruğu (A14) bunu okur. */
    hepsi: function () { return tumu(); },

    /* Bir varlığın yorumları. `hepsi` true ise denetimdekiler de gelir. */
    getir: function (tur, slug, secenek) {
      var hepsiMi = !!(secenek && secenek.denetimDahil);
      return tumu().filter(function (y) {
        if (y.tur !== tur || y.slug !== slug) return false;
        if (y.durum === 'onayli') return true;
        /* Gastro kuralı (RecipeController.php:276-281): kendi bekleyen
           yorumunu YALNIZ sahibi görür; `kaldirildi` hiç görünmez. */
        if (y.durum === 'kaldirildi') return false;
        if (hepsiMi) return true;
        return !!y.benim;
      });
    },

    /* Yeni yorum — dm_fit_yorum_v1'e GERÇEKTEN yazar. */
    ekle: function (kayit) {
      if (!kayit || !kayit.tur || !kayit.slug) return null;
      var puan = parseInt(kayit.puan, 10);
      if (!(puan >= 1 && puan <= 5)) return null;      /* Gastro: puan zorunlu */
      var d = depoYorum();
      var y = {
        id: 'y-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36),
        tur: kayit.tur,
        slug: kayit.slug,
        puan: puan,
        metin: String(kayit.metin || '').slice(0, API.SINIR.metin),
        tarih: new Date().toISOString(),
        /* Gastro: yeni yorum Pending doğar — _reviews.blade.php:111
           "Yorumlar denetim sonrası yayınlanır." */
        durum: 'bekliyor',
        faydali: 0,
        benim: true,
        yazar: {
          ad: (kayit.yazar && kayit.yazar.ad) || 'Sen',
          foto: (kayit.yazar && kayit.yazar.foto) || '',
          rozet: (kayit.yazar && kayit.yazar.rozet) || '',
          alt: (kayit.yazar && kayit.yazar.alt) || ''
        },
        etiketler: (kayit.etiketler || []).slice(),
        yanit: null
      };
      d.yorumlar.push(y);
      if (!yaz(ANAHTAR_YORUM, d)) return null;
      return kopya(y);
    },

    /* Faydalı — aç/kapa, kalıcı. dm_fit_faydali_v1 (profil-v1 ile ORTAK). */
    faydali: function (id) {
      var d = depoFaydali();
      if (d.oylar[id]) delete d.oylar[id]; else d.oylar[id] = 1;
      if (!yaz(ANAHTAR_FAYDALI, d)) return null;
      return !!d.oylar[id];
    },
    faydaliMi: faydaliMi,

    /* Yanıt — Gastro'da yalnız içerik sahibi yanıtlar (ReviewPolicy.php:69)
       ve yanıt tek seviyedir (_reviews.blade.php:224-240 — `.c-replies`
       içindeki karta ayrıca yanıt formu BASILMAZ). Fit de öyle. */
    yanitla: function (id, metin, kimlik) {
      var m = String(metin || '').trim().slice(0, API.SINIR.yanit);
      if (!m) return false;
      var d = depoYorum(), i;
      /* tohum kaydın yanıtı da depoda yaşar — tohum dizisi değiştirilmez */
      if (!d.yanitlar || typeof d.yanitlar !== 'object') d.yanitlar = {};
      d.yanitlar[id] = {
        ad: (kimlik && kimlik.ad) || 'Sahibi',
        rol: (kimlik && kimlik.rol) || 'Sahibinin yanıtı',
        metin: m,
        tarih: new Date().toISOString()
      };
      for (i = 0; i < d.yorumlar.length; i++) if (d.yorumlar[i].id === id) d.yorumlar[i].yanit = d.yanitlar[id];
      return yaz(ANAHTAR_YORUM, d);
    },

    /* Bildir — Gastro'da rapor AYRI bir kayıttır ve yorumun durumunu
       DEĞİŞTİRMEZ (_reviews.blade.php:198-207: `reviews.report` formu,
       `reportedBy()` yalnız düğmeyi "Bildirildi"ye çevirir; yorum yayında
       kalır, `flagged`e geçirmek moderatörün kararıdır). Fit de öyle:
       burada yalnız bildirim işaretlenir; kuyruk (A14) `bildirildi`
       alanını okuyup satırı öne çeker. */
    bildir: function (id) {
      var d = depoYorum();
      if (!d.bildirimler || typeof d.bildirimler !== 'object') d.bildirimler = {};
      d.bildirimler[id] = 1;
      return yaz(ANAHTAR_YORUM, d);
    },
    bildirdiMi: function (id) {
      var d = depoYorum();
      return !!(d.bildirimler && d.bildirimler[id]);
    },

    /* Moderasyon eylemi — panel (A14) ve "Bildir" düğmesi bunu çağırır.
       Gastro'nun altı durumundan biri; başkası kabul edilmez. */
    durum: function (id, yeni) {
      var gecerli = false, i;
      for (i = 0; i < DURUMLAR.length; i++) if (DURUMLAR[i].ad === yeni) gecerli = true;
      if (!gecerli) return false;
      var d = depoYorum();
      d.durumlar[id] = yeni;
      var j;
      for (j = 0; j < d.yorumlar.length; j++) if (d.yorumlar[j].id === id) d.yorumlar[j].durum = yeni;
      return yaz(ANAHTAR_YORUM, d);
    },

    /* Puan özeti. Gastro kuralı (ReviewSummaryService.php:79-85): ortalama
       ve dağılım YALNIZ onaylı yorumlardan hesaplanır — denetimdeki bir
       yorum ortalamayı oynatmaz. `bekleyen` ayrı sayılır ki ekran
       kullanıcıya kendi yorumunun nerede olduğunu söyleyebilsin.
       `tavsiye`: 4-5 yıldız = tavsiye (RECOMMEND_THRESHOLD = 4, :17). */
    ozet: function (tur, slug) {
      var hepsi = tumu().filter(function (y) { return y.tur === tur && y.slug === slug; });
      var onayli = hepsi.filter(function (y) { return y.durum === 'onayli'; });
      var dagilim = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, toplam = 0, i, p;
      for (i = 0; i < onayli.length; i++) {
        p = onayli[i].puan;
        if (dagilim[p] === undefined) continue;
        dagilim[p]++; toplam += p;
      }
      var adet = onayli.length;
      var tavsiye = adet ? Math.round((dagilim[5] + dagilim[4]) / adet * 100) : 0;
      return {
        ortalama: adet ? Math.round(toplam / adet * 10) / 10 : 0,
        adet: adet,
        dagilim: dagilim,
        yuzde: {
          5: adet ? Math.round(dagilim[5] / adet * 1000) / 10 : 0,
          4: adet ? Math.round(dagilim[4] / adet * 1000) / 10 : 0,
          3: adet ? Math.round(dagilim[3] / adet * 1000) / 10 : 0,
          2: adet ? Math.round(dagilim[2] / adet * 1000) / 10 : 0,
          1: adet ? Math.round(dagilim[1] / adet * 1000) / 10 : 0
        },
        tavsiye: tavsiye,
        bekleyen: hepsi.filter(function (y) { return y.durum === 'bekliyor'; }).length
      };
    },

    /* Sayfa scriptlerinin ortak biçimlendiricileri — dört ekran aynı
       cümleyi iki ayrı yerde kurmasın diye burada. */
    yildizHtml: function (puan, sinif) {
      /* Gastro _stars.blade.php:11-16 birebir: kalan >= .75 yukarı
         yuvarlanır, >= .25 yarım yıldız olur, gerisi boş. */
      var dolu = Math.floor(puan), kalan = puan - dolu, s = '', i;
      if (kalan >= 0.75 && dolu < 5) { dolu++; kalan = 0; }
      var yarim = kalan >= 0.25;
      var bos = Math.max(0, 5 - dolu - (yarim ? 1 : 0));
      for (i = 0; i < dolu; i++) s += '<i class="fa-solid fa-star" aria-hidden="true"></i>';
      if (yarim) s += '<i class="fa-solid fa-star-half-stroke" aria-hidden="true"></i>';
      for (i = 0; i < bos; i++) s += '<i class="fa-regular fa-star" aria-hidden="true"></i>';
      return '<span class="' + (sinif || 'fy-stars') + '">' + s + '</span>';
    },

    /* "3 gün önce" — Gastro `diffForHumans()` karşılığı. */
     neZaman: function (iso) {
      var t = Date.parse(iso);
      if (!t) return '';
      var fark = Math.floor((Date.now() - t) / 1000);
      if (fark < 60) return 'az önce';
      if (fark < 3600) return Math.floor(fark / 60) + ' dakika önce';
      if (fark < 86400) return Math.floor(fark / 3600) + ' saat önce';
      var gun = Math.floor(fark / 86400);
      if (gun < 7) return gun + ' gün önce';
      if (gun < 30) return Math.floor(gun / 7) + ' hafta önce';
      if (gun < 365) return Math.floor(gun / 30) + ' ay önce';
      return Math.floor(gun / 365) + ' yıl önce';
    },

    durumEtiket: function (ad) {
      for (var i = 0; i < DURUMLAR.length; i++) if (DURUMLAR[i].ad === ad) return DURUMLAR[i].etiket;
      return ad;
    },

    /* Sıfırlama — yalnız QA nöbetleri içindir, ekranda düğmesi yoktur. */
    sifirla: function () {
      try {
        localStorage.removeItem(ANAHTAR_YORUM);
        localStorage.removeItem(ANAHTAR_FAYDALI);
        return true;
      } catch (e) { return false; }
    }
  };

  window.FIT_YORUM = API;

  /* =====================================================================
     EKRAN SÜRÜCÜSÜ — `[data-fit-yorum]` taşıyan her kaba bölümü basar.
       data-fit-yorum="egzersiz"        tür
       data-yorum-slug="goblet-squat"   varlık
       data-yorum-baslik="Bu hareketi değerlendir"
       data-yorum-sahip="1"             varsa "Yanıtla" görünür (Gastro
                                        ReviewPolicy.php:69 — yalnız sahibi)
     Gastro'nun `_reviews.blade.php` sırası birebir: özet → yazma formu →
     filtre çipleri → liste → daha fazla.
     ===================================================================== */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function kartHtml(y, sahipMi) {
    var h = '';
    h += '<article class="rev-item fy-item" data-yorum-id="' + esc(y.id) + '" data-puan="' + y.puan + '">';
    h += '<div class="rev-top">';
    h += y.yazar && y.yazar.foto
      ? '<div class="rev-av" style="background-image:url(\'' + esc(y.yazar.foto) + '\')"></div>'
      : '<div class="rev-av fy-av-harf" aria-hidden="true">' + esc((y.yazar && y.yazar.ad || '?').charAt(0)) + '</div>';
    h += '<div class="rev-who"><b>' + esc(y.yazar && y.yazar.ad);
    if (y.yazar && y.yazar.rozet) {
      h += ' <span class="rev-badge"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> ' + esc(y.yazar.rozet) + '</span>';
    }
    /* Gastro'nun `.c-self` rozeti (_reviews.blade.php:162) kendi yorumunu
       diğerlerinden ayırır. Bu depoda oturumun gerçek adı yok; yazar adı
       zaten "Sen" basılıyor, o hâlde rozet aynı şeyi iki kez söylerdi. */
    if (y.benim && (y.yazar && y.yazar.ad) !== 'Sen') h += ' <span class="fy-self">sen</span>';
    h += '</b><span>' + esc(y.yazar && y.yazar.alt ? y.yazar.alt + ' · ' : '') + API.neZaman(y.tarih);
    if (y.durum !== 'onayli') h += ' · <em class="fy-denetim">' + esc(API.durumEtiket(y.durum).toLocaleLowerCase('tr')) + '</em>';
    h += '</span></div>';
    h += '<div class="rev-rate">' + API.yildizHtml(y.puan, 'fy-rate-stars').replace(/^<span[^>]*>|<\/span>$/g, '') + '</div>';
    h += '</div>';
    h += '<p class="rev-text">' + esc(y.metin) + '</p>';
    if (y.etiketler && y.etiketler.length) {
      h += '<div class="rev-tags">';
      for (var i = 0; i < y.etiketler.length; i++) h += '<span class="rev-tag">' + esc(y.etiketler[i]) + '</span>';
      h += '</div>';
    }
    if (y.yanit) {
      h += '<div class="rev-reply"><b><i class="fa-solid fa-reply" aria-hidden="true"></i> ' + esc(y.yanit.rol) + '</b>' + esc(y.yanit.metin) + '</div>';
    }
    h += '<div class="rev-foot">';
    var basili = faydaliMi(y.id);
    h += '<button class="rev-help fy-help' + (basili ? ' is-voted' : '') + '" type="button" data-yorum-faydali="' + esc(y.id) + '" aria-pressed="' + (basili ? 'true' : 'false') + '"' +
      ' data-lg-gate data-lg-title="Yorumu faydalı bulmak için giriş yap" data-lg-desc="Bir yorumu faydalı işaretleyebilmek için DadaFit hesabına giriş yapman gerekiyor. Yorumları okumak serbest.">';
    h += '<i class="fa-' + (basili ? 'solid' : 'regular') + ' fa-thumbs-up" aria-hidden="true"></i> Faydalı <b>' + y.faydaliToplam + '</b></button>';
    if (sahipMi && !y.yanit) {
      h += '<button class="rev-help fy-help fy-yanit-ac" type="button" data-yorum-yanit="' + esc(y.id) + '"><i class="fa-solid fa-comment" aria-hidden="true"></i> Yanıtla</button>';
    }
    if (!y.benim && !y.bildirildi) {
      h += '<button class="rev-help fy-help fy-bildir" type="button" data-yorum-bildir="' + esc(y.id) + '"' +
        ' data-lg-gate data-lg-title="Yorumu bildirmek için giriş yap" data-lg-desc="Kural dışı bir yorumu denetime bildirebilmek için DadaFit hesabına giriş yapman gerekiyor.">' +
        '<i class="fa-solid fa-flag" aria-hidden="true"></i> Bildir</button>';
    } else if (y.bildirildi) {
      /* Gastro `_reviews.blade.php:200`: bildirilen yorumda düğme KALIR,
         `disabled` olur ve "Bildirildi" yazar — <span>'e dönüşmez. Kalem
         sayısı sabit kalır, odak sırası bozulmaz. */
      h += '<button class="rev-help fy-help fy-bildirildi" type="button" disabled aria-disabled="true"><i class="fa-solid fa-check" aria-hidden="true"></i> Bildirildi</button>';
    }
    h += '</div>';
    if (sahipMi && !y.yanit) {
      h += '<form class="fy-yanit-form" data-yorum-yanit-form="' + esc(y.id) + '" hidden>';
      h += '<textarea rows="2" maxlength="' + API.SINIR.yanit + '" placeholder="Yanıtını yaz..." aria-label="Yanıt metni" required></textarea>';
      h += '<div class="fy-yanit-act"><button class="btn btn-primary" type="submit">Gönder</button>';
      h += '<button class="btn btn-ghost" type="button" data-yorum-yanit-iptal>Vazgeç</button></div></form>';
    }
    h += '</article>';
    return h;
  }

  function bolumHtml(kap) {
    var tur   = kap.getAttribute('data-fit-yorum');
    var slug  = kap.getAttribute('data-yorum-slug') || '';
    var basl  = kap.getAttribute('data-yorum-baslik') || 'Değerlendir';
    var sahip = kap.getAttribute('data-yorum-sahip') === '1';
    var liste = API.getir(tur, slug);
    var o     = API.ozet(tur, slug);
    var limit = parseInt(kap.getAttribute('data-yorum-limit'), 10) || API.SINIR.listeLimit;
    var gosterilen = liste.slice(0, limit);
    var kalan = Math.max(0, liste.length - gosterilen.length);
    var girisli = document.body.classList.contains('is-auth');
    var h = '';

    /* --- 1 · başlık --------------------------------------------------- */
    h += '<div class="sec-head sec-fit fy-head"><div>';
    h += '<span class="eyebrow"><i class="fa-solid fa-comments" aria-hidden="true"></i> Değerlendirmeler</span>';
    h += '<h2>Yorumlar (' + o.adet + ')</h2>';
    h += '</div></div>';

    /* --- 2 · puan özeti (Gastro .rev-summary → rs-avg + rs-bars) ------- */
    h += '<div class="fy-ozet" aria-label="Puan özeti">';
    h += '<div class="fy-avg"><b>' + (o.adet ? o.ortalama.toFixed(1).replace('.', ',') : '—') + '</b>';
    h += API.yildizHtml(o.ortalama, 'fy-stars');
    h += '<span>' + o.adet + ' değerlendirme</span>';
    if (o.adet) h += '<span class="fy-rec"><i class="fa-solid fa-thumbs-up" aria-hidden="true"></i> %' + o.tavsiye + ' tavsiye ediyor</span>';
    h += '</div><div class="fy-bars">';
    for (var s = 5; s >= 1; s--) {
      h += '<div class="fy-bar"><span class="lbl">' + s + ' <i class="fa-solid fa-star" aria-hidden="true"></i></span>';
      h += '<span class="track"><i style="width:' + o.yuzde[s] + '%"></i></span>';
      h += '<span class="cnt">' + o.dagilim[s] + '</span></div>';
    }
    h += '</div></div>';

    /* --- 3 · yazma formu (girişliye) ya da giriş daveti ---------------- */
    if (girisli) {
      h += '<form class="fy-form" data-yorum-form novalidate>';
      h += '<div class="rev-av fy-av-harf" aria-hidden="true">S</div>';
      h += '<div class="fy-body"><div class="fy-top">';
      h += '<span class="t">' + esc(basl) + '</span>';
      h += '<span class="fy-input-stars" role="radiogroup" aria-label="Yıldız puanı">';
      for (var i = 1; i <= 5; i++) {
        h += '<button type="button" data-puan="' + i + '" aria-label="' + i + ' yıldız"><i class="fa-solid fa-star" aria-hidden="true"></i></button>';
      }
      h += '</span><span class="fy-hint" data-yorum-ipucu>Puan zorunlu</span></div>';
      h += '<textarea class="fy-text" maxlength="' + API.SINIR.metin + '" aria-label="Yorum metni" placeholder="Deneyimini yaz — neyi denedin, sana ne iyi geldi?"></textarea>';
      h += '<div class="fy-foot"><p class="fy-disc"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> Yorumlar denetim sonrası yayınlanır. Sunucu yok — yazdığın bu tarayıcıda saklanır ve yenilemede durur.</p>';
      h += '<button class="btn btn-primary" type="submit"><i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Yorumu Paylaş</button></div>';
      h += '<div class="fy-ok" data-yorum-basari hidden role="status"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Yorumun alındı — denetim sonrası yayınlanacak. Teşekkürler!</div>';
      h += '</div></form>';
    } else {
      h += '<div class="fy-login"><span class="fy-login-ico"><i class="fa-solid fa-lock" aria-hidden="true"></i></span>';
      h += '<div class="fy-login-body"><b>Yorum yapmak için giriş yap</b>';
      h += '<p>Puan vermek ve deneyimini paylaşmak için DadaFit hesabına giriş yapman gerekiyor. Yorumları okumak serbest.</p>';
      h += '<div class="fy-login-act"><a class="btn btn-primary" href="fit-giris.html"><i class="fa-solid fa-user" aria-hidden="true"></i> Giriş Yap</a>';
      h += '<a class="btn btn-ghost" href="fit-giris.html#kayit">Üye Ol</a></div></div></div>';
    }

    /* --- 4 · filtre çipleri (Gastro .rev-filter, foto ekseni HARİÇ) ----- */
    if (liste.length) {
      var say = function (f) {
        return liste.filter(function (y) {
          if (f === 'hepsi') return true;
          if (f === 'dusuk') return y.puan <= 3;
          return String(y.puan) === f;
        }).length;
      };
      /* aria-pressed ŞART: süzgeç bir aç/kapa grubudur, seçili çip
         durumunu ekran okuyucuya yalnız bu söyler (`.is-on` yalnız boyar). */
      h += '<div class="fy-filtre" role="group" aria-label="Yorum filtresi">';
      h += '<button class="fy-cip is-on" type="button" aria-pressed="true" data-yorum-filtre="hepsi">Tümü (' + say('hepsi') + ')</button>';
      h += '<button class="fy-cip" type="button" aria-pressed="false" data-yorum-filtre="5">5 yıldız (' + say('5') + ')</button>';
      h += '<button class="fy-cip" type="button" aria-pressed="false" data-yorum-filtre="4">4 yıldız (' + say('4') + ')</button>';
      h += '<button class="fy-cip" type="button" aria-pressed="false" data-yorum-filtre="dusuk">3 ve altı (' + say('dusuk') + ')</button>';
      h += '</div>';
      h += '<div class="fy-bos" data-yorum-bos hidden><i class="fa-solid fa-comment-dots" aria-hidden="true"></i> Bu filtreye uyan yorum yok.</div>';
      h += '<div class="rev-list fy-liste" data-yorum-liste>';
      for (var k = 0; k < gosterilen.length; k++) h += kartHtml(gosterilen[k], sahip);
      h += '</div>';
      if (kalan > 0) {
        h += '<div class="fy-more"><button class="btn btn-ghost" type="button" data-yorum-devam>';
        h += '<i class="fa-solid fa-plus" aria-hidden="true"></i> Daha Fazla Yorum Göster <small>· ' + kalan + ' yorum daha</small></button></div>';
      }
    } else {
      /* Gastro .rev-empty-first — boş ekran bir davettir (kit §9). */
      h += '<div class="fp-card fpx-bos fy-ilk"><span class="pe-ico"><i class="fa-solid fa-comment-dots" aria-hidden="true"></i></span>';
      h += '<h4>Henüz yorum yok</h4><p>Bu sayfada ilk değerlendirmeyi sen yazabilirsin — puanın ve birkaç cümlen sonraki kişiye yol gösterir.</p></div>';
    }
    return h;
  }

  function bagla(kap) {
    var tur   = kap.getAttribute('data-fit-yorum');
    var slug  = kap.getAttribute('data-yorum-slug') || '';
    var sahip = kap.getAttribute('data-yorum-sahip') === '1';

    /* Sekme sayacı — sayfada sabit yazılı bir rakam kalmasın diye
       (`tools/denetim.mjs` "sahte durum" kalemi). data-yorum-sayac bir
       CSS seçicisidir; o elemanın metni ozet().adet ile değiştirilir. */
    function sayacYaz() {
      var sel = kap.getAttribute('data-yorum-sayac');
      if (!sel) return;
      var hedefler = document.querySelectorAll(sel), o = API.ozet(tur, slug), i;
      for (i = 0; i < hedefler.length; i++) hedefler[i].textContent = String(o.adet);
    }

    function ciz() { kap.innerHTML = bolumHtml(kap); sayacYaz(); kur(); }

    function kur() {
      /* --- yıldız girişi (Gastro tarif-detay.js:325-333 deseni) -------- */
      var form = kap.querySelector('[data-yorum-form]');
      if (form) {
        var puan = 0;
        var yildizlar = [].slice.call(form.querySelectorAll('.fy-input-stars button'));
        var ipucu = form.querySelector('[data-yorum-ipucu]');
        var boya = function (n) {
          for (var i = 0; i < yildizlar.length; i++) yildizlar[i].classList.toggle('on', i < n);
        };
        yildizlar.forEach(function (b, i) {
          b.addEventListener('mouseenter', function () { boya(i + 1); });
          b.addEventListener('focus', function () { boya(i + 1); });
          b.addEventListener('click', function () {
            puan = i + 1; boya(puan);
            ipucu.textContent = 'Puanın: ' + puan + '/5';
            ipucu.classList.remove('err'); ipucu.classList.add('ok');
          });
        });
        form.querySelector('.fy-input-stars').addEventListener('mouseleave', function () { boya(puan); });

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!puan) {
            ipucu.textContent = 'Puan vermeden yorum gönderilemez';
            ipucu.classList.remove('ok'); ipucu.classList.add('err');
            form.querySelector('.fy-input-stars').classList.add('shake');
            setTimeout(function () { form.querySelector('.fy-input-stars').classList.remove('shake'); }, 450);
            return;
          }
          var ta = form.querySelector('.fy-text');
          var kayit = API.ekle({ tur: tur, slug: slug, puan: puan, metin: ta.value });
          if (!kayit) {
            ipucu.textContent = 'Tarayıcı depolaması kapalı — yorum tutulamıyor';
            ipucu.classList.remove('ok'); ipucu.classList.add('err');
            return;
          }
          ciz();
          var ok = kap.querySelector('[data-yorum-basari]');
          if (ok) { ok.hidden = false; ok.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        });
      }

      /* --- faydalı: aç/kapa, kalıcı ----------------------------------- */
      [].slice.call(kap.querySelectorAll('[data-yorum-faydali]')).forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-yorum-faydali');
          var sonuc = API.faydali(id);
          if (sonuc === null) { b.setAttribute('title', 'Tarayıcı depolaması kapalı — oy tutulamıyor'); return; }
          var sayi = b.querySelector('b');
          var taban = parseInt(sayi.textContent, 10) || 0;
          sayi.textContent = sonuc ? taban + 1 : Math.max(0, taban - 1);
          b.classList.toggle('is-voted', sonuc);
          b.setAttribute('aria-pressed', sonuc ? 'true' : 'false');
          b.querySelector('i').className = (sonuc ? 'fa-solid' : 'fa-regular') + ' fa-thumbs-up';
        });
      });

      /* --- bildir → rapor kaydı; yorum yayında KALIR (Gastro deseni) --- */
      [].slice.call(kap.querySelectorAll('[data-yorum-bildir]')).forEach(function (b) {
        b.addEventListener('click', function () {
          API.bildir(b.getAttribute('data-yorum-bildir'));
          ciz();
        });
      });

      /* --- yanıtla (yalnız sahibi — Gastro ReviewPolicy.php:69) -------- */
      if (sahip) {
        [].slice.call(kap.querySelectorAll('[data-yorum-yanit]')).forEach(function (b) {
          b.addEventListener('click', function () {
            var f = kap.querySelector('[data-yorum-yanit-form="' + b.getAttribute('data-yorum-yanit') + '"]');
            if (!f) return;
            f.hidden = !f.hidden;
            if (!f.hidden) f.querySelector('textarea').focus();
          });
        });
        [].slice.call(kap.querySelectorAll('[data-yorum-yanit-iptal]')).forEach(function (b) {
          b.addEventListener('click', function () { b.closest('.fy-yanit-form').hidden = true; });
        });
        [].slice.call(kap.querySelectorAll('[data-yorum-yanit-form]')).forEach(function (f) {
          f.addEventListener('submit', function (e) {
            e.preventDefault();
            var ta = f.querySelector('textarea');
            if (!ta.value.trim()) { ta.focus(); return; }
            API.yanitla(f.getAttribute('data-yorum-yanit-form'), ta.value, {
              ad: kap.getAttribute('data-yorum-sahip-ad') || 'Sen',
              rol: kap.getAttribute('data-yorum-sahip-rol') || 'Sahibinin yanıtı'
            });
            ciz();
          });
        });
      }

      /* --- filtre çipleri (Gastro tarif-detay.js:392-411 deseni) ------- */
      var cipler = [].slice.call(kap.querySelectorAll('[data-yorum-filtre]'));
      var kartlar = [].slice.call(kap.querySelectorAll('.fy-item'));
      var bos = kap.querySelector('[data-yorum-bos]');
      cipler.forEach(function (c) {
        c.addEventListener('click', function () {
          cipler.forEach(function (x) { x.classList.remove('is-on'); x.setAttribute('aria-pressed', 'false'); });
          c.classList.add('is-on'); c.setAttribute('aria-pressed', 'true');
          var f = c.getAttribute('data-yorum-filtre'), gorunen = 0;
          kartlar.forEach(function (k) {
            var p = k.getAttribute('data-puan');
            var ac = f === 'hepsi' || (f === 'dusuk' && parseInt(p, 10) <= 3) || f === p;
            k.hidden = !ac;
            if (ac) gorunen++;
          });
          if (bos) bos.hidden = gorunen > 0;
        });
      });

      /* --- daha fazla: listeyi tam uzunlukta yeniden bas -------------- */
      var devam = kap.querySelector('[data-yorum-devam]');
      if (devam) {
        devam.addEventListener('click', function () {
          kap.setAttribute('data-yorum-limit', '1000000');
          ciz();
        });
      }
    }

    ciz();
  }

  function kurTumu() {
    var kaplar = document.querySelectorAll('[data-fit-yorum]');
    for (var i = 0; i < kaplar.length; i++) bagla(kaplar[i]);
  }
  API.kur = kurTumu;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', kurTumu);
  } else {
    kurTumu();
  }
})(window, document);
