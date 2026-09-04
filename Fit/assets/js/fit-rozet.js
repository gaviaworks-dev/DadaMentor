/* =====================================================================
   DadaFit · ROZET · PUAN · LİDERLİK — TEK KAYNAK   (R15/5)
   ---------------------------------------------------------------------
   ESKİ HÂL (ölçüldü): iki ayrı rozet ekranı vardı ve İKİSİ DE STATİKTİ.
     rozetler-v1.html            → 42 rozet, 8 aile, hepsi sabit HTML;
                                   sayfanın kendi notu "örnek bir hesaba ait"
     fit-planim-rozetler-v1.html → aile satırlarını DOM'dan sayıyordu
   Tek ekran (`rozetlerim-v1.html`) ve tek motor (bu dosya) kaldı.

   ÖLÇÜ NEREDEN GELİYOR — hepsi gerçek kayıt:
     dm_fit               → gecmis[] · arsiv[] · program (kabuk durum modülü)
     dm_fit_planlar_v1    → FIT_PLAN (antrenman planları, gün kararları)
     dm_fit_challenge_v1  → FIT_CHALLENGE (üç tipli challenge motoru)

   ✅ R20/K3 · ÖLÇÜSÜ OLMAYAN İKİ EKSEN AÇILDI — vaadin karşılığı kuruldu.
   Bu blok daha önce şunu yazıyordu: "test çözmek" ve "antrenörle paylaşılan
   bilgileri doldurmak" eksenlerinin deposu YOK, rozetleri `olcut:null` taşır
   ve ekranda "Ölçü bekliyor" görünür. Ölçüldü ki bu, 50 rozetin 4'ünü
   (225 puan) ömür boyu kazanılamaz kılıyordu.
   İki depo açıldı ve İKİSİ DE SAĞLIK VERİSİ TAŞIMIYOR:
     · dm_fit_test_v1 = { surum:1, cozulen:[testSlug…], guncelleme:ISO }
       Yalnız hangi testin çözüldüğü. Puan, cevap, sonuç YOK —
       fit-testi-detay-v1.html'in "tarama yanıtları hiçbir yere yazılmaz"
       kararı olduğu gibi duruyor. Bir sayaç sağlık verisi değildir.
     · dm_fit_antrenor_bilgi_v1 = { surum:1, toplamAlan:N, doluAlan:M,
       guncelleme:ISO } — alanların İÇERİĞİ değil, kaçının dolu olduğu.
   Geriye ÖLÇÜSÜZ rozet kalmadı; "Ölçü bekliyor" durumu (`olcusuz`) motorda
   DURUYOR — yeni bir rozet ölçüsüz doğarsa ekran onu yine dürüstçe basar.
   Mesafe/adım ailesi (km · adım) `gecmis[].metrik` üzerinden ölçülüyor ve
   huniyi `bagli-uygulamalar-v1.html` besliyor (kaynak:'cihaz').

   DEPOLAMA
     localStorage['dm_fit_rozet_v1'] = {
       surum:1,
       kazanildi: { <rozetSlug>: ISO },   // MÜHÜR — geri alınmaz
       gorulen:   { <rozetSlug>: 1 }      // "yeni!" işaretini söndürür
     }
   PUAN TÜRETİLİR, SAKLANMAZ: toplam puan = kazanılmış rozetlerin puanları
   toplamı. Ayrı bir sayaç tutulsaydı iki sayı ayrışabilirdi; tek gerçek var.

   MÜHÜR KURALI: bir rozet bir kez kazanılınca `kazanildi`ye tarihiyle yazılır
   ve ölçü sonradan düşse bile geri ALINMAZ. Ekranın kendi sözü budur
   ("kazanılan rozet geri alınmaz") ve söz tutulur.
   ===================================================================== */
(function (kok) {
  'use strict';

  var KEY = 'dm_fit_rozet_v1';
  var SURUM = 1;

  /* ==================================================================
     1 · KADEME MERDİVENİ — sekiz kademe, İKİ ÖLÇÜT
     ------------------------------------------------------------------
     EMSAL ÖLÇÜLDÜ (yerel Gastro deposu, yalnız okundu):
       database/seeders/CommunityTierSeeder.php → 30 kademe, 8 segment
       app/Domain/Gastro/Support/TierLadder.php:24-27 → üye, `threshold_points`
       VE `min_recipes` VE `min_tips` barajlarını birlikte geçtiği EN YÜKSEK
       kademeye yerleşir. Yani kademe tek ölçütle atlanmıyor: puan bir
       baraj, üretim ikinci baraj.
     Gastro'da kademe iki yerde görünüyor: `rozetlerim/show.blade.php`
       (tam merdiven + rank-now paneli) ve `tarifler/_chef-card.blade.php:56`
       (yazar adının yanında `.sc-deg` unvan rozeti).

     🔴 KADEME ≠ PAKET. Paket satın alınır (Ücretsiz · Pro · Pro Max),
     kademe KAZANILIR. İkisi aynı anda görünür ve birbirinin yerine geçmez.

     DADAFİT UYARLAMASI
       · Adlar hareket ve gelişim temalı (mutfak dili yok).
       · Gastro'nun `min_recipes`/`min_tips` barajının Fit karşılığı
         AKTİF GÜN: puan hızlı toplanabilir, gün toplanamaz. Böylece
         kademe "çok rozet açtım" ile değil, "sürdürdüm" ile yükselir.
       · `minGun` eşikleri eski Hareket Yolculuğu basamaklarından BİREBİR
         taşındı (1·7·20·45·90·180·365·500) — uydurulmadı.
       · `minPuan` eşikleri katalogun GERÇEK tavanına göre ölçeklendi:
         50 rozet toplam 4.170 puan, ölçülebilir olanlar 3.945 (ölçüldü).
         Son kademe 3.800 puanla erişilebilir kalıyor; ulaşılamayan bir
         merdiven, merdiven değildir.
       · `key` değerleri DEĞİŞMEDİ: rozetlerin `basamak` alanı bunlara
         bakıyor ve galeri süzgeci bu eşleşmeyle çalışıyor. (Gastro bu
         eşleşmeyi kuramamıştı — rozetin kademesi yoktu; Fit'te var.)
     ================================================================== */
  var KADEMELER = [
    { key: 'baslangic',   ad: 'Yeni Başlayan',  minPuan: 0,    minGun: 1,   ico: 'fa-solid fa-shoe-prints' },
    { key: 'ilk-hafta',   ad: 'İlk Adım',       minPuan: 100,  minGun: 7,   ico: 'fa-solid fa-calendar-week' },
    { key: 'ilk-ay',      ad: 'Düzenli',        minPuan: 300,  minGun: 20,  ico: 'fa-solid fa-calendar-days' },
    { key: 'uc-ay',       ad: 'Kararlı',        minPuan: 650,  minGun: 45,  ico: 'fa-solid fa-person-walking' },
    { key: 'alti-ay',     ad: 'Dayanıklı',      minPuan: 1200, minGun: 90,  ico: 'fa-solid fa-person-running' },
    { key: 'bir-yil',     ad: 'Güçlü',          minPuan: 1900, minGun: 180, ico: 'fa-solid fa-mountain' },
    { key: 'iki-yil',     ad: 'Usta',           minPuan: 2800, minGun: 365, ico: 'fa-solid fa-mountain-sun' },
    { key: 'kendi-yolun', ad: 'Kendi Yolunda',  minPuan: 3800, minGun: 500, ico: 'fa-solid fa-route' }
  ];
  /* Eski ad korunuyor: `esik` alanına bakan çağıran kalmadı ama dizinin
     kendisine `BASAMAKLAR` diye bakan olabilir. */
  var BASAMAKLAR = KADEMELER;

  /* ==================================================================
     2 · AİLELER — her ailenin TEK ölçülebilir kaynağı vardır
     ================================================================== */
  var AILELER = [
    { key: 'baslangic',  ad: 'Başlangıç',                 ico: 'fa-solid fa-flag-checkered',
      olcu: 'İlk kez yapılanlar — kişisel kilometre taşların.' },
    { key: 'aktif-gun',  ad: 'Aktif Gün ve Seri',         ico: 'fa-solid fa-calendar-check',
      olcu: 'Hareket ettiğin gün sayısı ve üst üste geldiğin gün (seri).' },
    { key: 'kuvvet',     ad: 'Kuvvet',                    ico: 'fa-solid fa-dumbbell',
      olcu: 'Set ve tekrar kaydı taşıyan antrenmanlar.' },
    { key: 'sure',       ad: 'Hareket Süresi',            ico: 'fa-solid fa-clock',
      olcu: 'Kayıtlı toplam hareket süresi (dakika).' },
    { key: 'program',    ad: 'Program ve Challenge',      ico: 'fa-solid fa-trophy',
      olcu: 'Tamamlanan plan, program ve challenge sayısı.' },
    { key: 'cesitlilik', ad: 'Çeşitlilik ve Toparlanma',  ico: 'fa-solid fa-shuffle',
      olcu: 'Farklı hareket sayısı ve planlı dinlenme günü.' },
    { key: 'mesafe',     ad: 'Mesafe ve Adım',            ico: 'fa-solid fa-shoe-prints',
      olcu: 'Cihazdan ya da ölçümden gelen kilometre ve adım.' },
    { key: 'su',         ad: 'Su',                        ico: 'fa-solid fa-droplet',
      olcu: 'Günlük su hedefini tuttuğun gün sayısı ve üst üste seri (FIT_SU).' },
    { key: 'bilgi',      ad: 'Test ve Bilgi Paylaşımı',   ico: 'fa-solid fa-clipboard-question',
      olcu: 'Çözülen Fit testi ve antrenörünle paylaştığın bilgiler.' }
  ];

  /* ==================================================================
     3 · KATALOG
     Alanlar:  slug · ad · aile · ico · basamak · puan · nasil
               olcut  → hangi ölçüye bakılacak (null ⇒ ölçü bekliyor)
               hedef  → o ölçünün eşiği
               kaynakEkran → ölçü yoksa, hangi ekranın kaydetmesi gerekiyor
     ================================================================== */
  var KATALOG = [
    /* --- Başlangıç ------------------------------------------------- */
    { slug:'ilk-hareket',      ad:'İlk Hareket',        aile:'baslangic', ico:'fa-solid fa-shoe-prints', basamak:'baslangic', puan:10,  olcut:'kayit',        hedef:1,  nasil:'İlk hareketini kaydet — ne kadar kısa olduğu fark etmez.' },
    { slug:'ilk-antrenman',    ad:'İlk Antrenman',      aile:'baslangic', ico:'fa-solid fa-play',        basamak:'baslangic', puan:10,  olcut:'aktifGun',     hedef:1,  nasil:'Bir antrenmanı baştan sona bitir.' },
    { slug:'ilk-program-gunu', ad:'İlk Program Günü',   aile:'baslangic', ico:'fa-solid fa-list-check',  basamak:'baslangic', puan:10,  olcut:'planGun',      hedef:1,  nasil:'Bir planın ilk gününü tamamla.' },
    { slug:'ilk-adim',         ad:'İlk Challenge Günü', aile:'baslangic', ico:'fa-solid fa-seedling',    basamak:'ilk-hafta', puan:25,  olcut:'challengeGun', hedef:1,  nasil:"Bir challenge'ın ilk gününü tamamla." },
    { slug:'ilk-cesit',        ad:'İkinci Hareket',     aile:'baslangic', ico:'fa-solid fa-shuffle',     basamak:'baslangic', puan:10,  olcut:'cesit',        hedef:2,  nasil:'İki farklı hareket kaydet.' },

    /* --- Aktif gün ve seri ----------------------------------------- */
    { slug:'aktif-7',   ad:'7 Aktif Gün',   aile:'aktif-gun', ico:'fa-solid fa-calendar-check', basamak:'ilk-hafta',   puan:25,  olcut:'aktifGun', hedef:7,   nasil:'Toplam 7 gün hareket et. Günlerin üst üste olması gerekmez.' },
    { slug:'aktif-20',  ad:'20 Aktif Gün',  aile:'aktif-gun', ico:'fa-solid fa-calendar-days',  basamak:'ilk-ay',      puan:50,  olcut:'aktifGun', hedef:20,  nasil:'Toplam 20 gün hareket et.' },
    { slug:'aktif-45',  ad:'45 Aktif Gün',  aile:'aktif-gun', ico:'fa-solid fa-calendar-plus',  basamak:'uc-ay',       puan:100, olcut:'aktifGun', hedef:45,  nasil:'Toplam 45 gün hareket et.' },
    { slug:'aktif-90',  ad:'90 Aktif Gün',  aile:'aktif-gun', ico:'fa-solid fa-person-running', basamak:'alti-ay',     puan:250, olcut:'aktifGun', hedef:90,  nasil:'Toplam 90 gün hareket et.' },
    { slug:'aktif-180', ad:'180 Aktif Gün', aile:'aktif-gun', ico:'fa-solid fa-mountain',       basamak:'bir-yil',     puan:250, olcut:'aktifGun', hedef:180, nasil:'Toplam 180 gün hareket et.' },
    { slug:'seri-3',    ad:'3 Gün Seri',    aile:'aktif-gun', ico:'fa-solid fa-fire',           basamak:'baslangic',   puan:25,  olcut:'seri',     hedef:3,   nasil:'Üç gün üst üste hareket et.' },
    { slug:'seri-5',    ad:'5 Gün Seri',    aile:'aktif-gun', ico:'fa-solid fa-fire-flame-curved', basamak:'ilk-hafta', puan:50, olcut:'seri',    hedef:5,   nasil:'Beş gün üst üste hareket et.' },
    { slug:'seri-14',   ad:'14 Gün Seri',   aile:'aktif-gun', ico:'fa-solid fa-fire-flame-simple', basamak:'ilk-ay',   puan:100, olcut:'seri',     hedef:14,  nasil:'On dört gün üst üste hareket et.' },

    /* --- Kuvvet ----------------------------------------------------- */
    { slug:'kuvvet-ilk',    ad:'İlk Kuvvet Günü',   aile:'kuvvet', ico:'fa-solid fa-dumbbell',      basamak:'baslangic', puan:10,  olcut:'kuvvetGun', hedef:1,    nasil:'Set ve tekrar kaydı taşıyan bir antrenman bitir.' },
    { slug:'kuvvet-10',     ad:'10 Kuvvet Günü',    aile:'kuvvet', ico:'fa-solid fa-hand-fist',     basamak:'ilk-ay',    puan:50,  olcut:'kuvvetGun', hedef:10,   nasil:'On ayrı günde kuvvet çalış.' },
    { slug:'kuvvet-30',     ad:'30 Kuvvet Günü',    aile:'kuvvet', ico:'fa-solid fa-weight-hanging',basamak:'uc-ay',     puan:100, olcut:'kuvvetGun', hedef:30,   nasil:'Otuz ayrı günde kuvvet çalış.' },
    { slug:'tekrar-1000',   ad:'1.000 Tekrar',      aile:'kuvvet', ico:'fa-solid fa-repeat',        basamak:'ilk-ay',    puan:50,  olcut:'tekrar',    hedef:1000, nasil:'Kayıtlı tekrarların toplamı 1.000 olsun.' },
    { slug:'set-500',       ad:'500 Set',           aile:'kuvvet', ico:'fa-solid fa-layer-group',   basamak:'uc-ay',     puan:100, olcut:'set',       hedef:500,  nasil:'Kayıtlı setlerin toplamı 500 olsun.' },

    /* --- Süre ------------------------------------------------------- */
    { slug:'dk-60',    ad:'İlk Saat',      aile:'sure', ico:'fa-solid fa-clock',        basamak:'baslangic', puan:10,  olcut:'toplamDk', hedef:60,   nasil:'Kayıtlı toplam hareket süren 60 dakikaya ulaşsın.' },
    { slug:'dk-600',   ad:'10 Saat',       aile:'sure', ico:'fa-solid fa-hourglass-half', basamak:'ilk-hafta', puan:25, olcut:'toplamDk', hedef:600,  nasil:'Toplam 600 dakika hareket et.' },
    { slug:'dk-1800',  ad:'30 Saat',       aile:'sure', ico:'fa-solid fa-stopwatch',    basamak:'ilk-ay',    puan:50,  olcut:'toplamDk', hedef:1800, nasil:'Toplam 1.800 dakika hareket et.' },
    { slug:'dk-6000',  ad:'100 Saat',      aile:'sure', ico:'fa-solid fa-hourglass-end',basamak:'uc-ay',     puan:250, olcut:'toplamDk', hedef:6000, nasil:'Toplam 6.000 dakika hareket et.' },
    { slug:'dk-gun-45',ad:'Uzun Seans',    aile:'sure', ico:'fa-solid fa-gauge-high',   basamak:'ilk-ay',    puan:50,  olcut:'enUzunSeans', hedef:45, nasil:'Tek seferde 45 dakika ve üzeri bir antrenman bitir.' },

    /* --- Program ve challenge --------------------------------------- */
    { slug:'plan-ilk',        ad:'İlk Planını Bitirdin',   aile:'program', ico:'fa-solid fa-clipboard-check', basamak:'ilk-hafta', puan:50,  olcut:'bitenPlan',      hedef:1, nasil:'Antrenman Oluşturucu ile kurduğun bir planı sonuna kadar götür.' },
    { slug:'plan-3',          ad:'Üç Plan',                aile:'program', ico:'fa-solid fa-clipboard-list',  basamak:'ilk-ay',    puan:100, olcut:'bitenPlan',      hedef:3, nasil:'Üç planı tamamla.' },
    { slug:'program-ilk',     ad:'İlk Program',            aile:'program', ico:'fa-solid fa-diagram-project', basamak:'ilk-ay',    puan:50,  olcut:'bitenProgram',   hedef:1, nasil:'Bir hazır programı sonuna kadar götür.' },
    { slug:'challenge-ilk',   ad:'İlk Challenge',          aile:'program', ico:'fa-solid fa-trophy',          basamak:'ilk-ay',    puan:100, olcut:'bitenChallenge', hedef:1, nasil:"Bir challenge'ı bitir." },
    { slug:'challenge-aliskanlik', ad:'Alışkanlık Ustası', aile:'program', ico:'fa-solid fa-seedling',        basamak:'uc-ay',     puan:250, olcut:'bitenAliskanlik', hedef:1, nasil:'Bir alışkanlık challenge’ını sonuna kadar götür.' },
    { slug:'challenge-seri',  ad:'Seriyi Bitirdin',        aile:'program', ico:'fa-solid fa-list-ol',         basamak:'ilk-ay',    puan:100, olcut:'bitenSeri',      hedef:1, nasil:'Bir egzersiz serisi challenge’ının bütün adımlarını kapat.' },
    { slug:'challenge-sureli',ad:'Hedefe Vardın',          aile:'program', ico:'fa-solid fa-gauge-high',      basamak:'uc-ay',     puan:250, olcut:'bitenSureli',    hedef:1, nasil:'Bir süreli hedef challenge’ını süresi içinde tamamla.' },
    { slug:'challenge-3',     ad:'Üç Challenge',           aile:'program', ico:'fa-solid fa-medal',           basamak:'alti-ay',   puan:250, olcut:'bitenChallenge', hedef:3, nasil:'Üç challenge bitir.' },

    /* --- Çeşitlilik ve toparlanma ------------------------------------ */
    { slug:'cesit-5',     ad:'5 Farklı Hareket',   aile:'cesitlilik', ico:'fa-solid fa-shuffle',        basamak:'ilk-hafta', puan:25,  olcut:'cesit',     hedef:5,  nasil:'Beş farklı hareket kaydet.' },
    { slug:'cesit-15',    ad:'15 Farklı Hareket',  aile:'cesitlilik', ico:'fa-solid fa-shapes',         basamak:'ilk-ay',    puan:50,  olcut:'cesit',     hedef:15, nasil:'On beş farklı hareket kaydet.' },
    { slug:'cesit-40',    ad:'40 Farklı Hareket',  aile:'cesitlilik', ico:'fa-solid fa-palette',        basamak:'uc-ay',     puan:100, olcut:'cesit',     hedef:40, nasil:'Kırk farklı hareket kaydet.' },
    { slug:'dinlenme-ilk',ad:'Planlı Dinlenme',    aile:'cesitlilik', ico:'fa-solid fa-bed',            basamak:'ilk-hafta', puan:25,  olcut:'dinlenme',  hedef:1,  nasil:'Bir günü planlı dinlenmeye ayır. Dinlenme de ilerlemenin parçasıdır.' },
    { slug:'dinlenme-5',  ad:'Toparlanmayı Bilen', aile:'cesitlilik', ico:'fa-solid fa-mug-hot',        basamak:'ilk-ay',    puan:50,  olcut:'dinlenme',  hedef:5,  nasil:'Beş günü planlı dinlenmeye ayır.' },

    /* --- Mesafe ve adım ---------------------------------------------- */
    { slug:'km-10',    ad:'İlk 10 km',    aile:'mesafe', ico:'fa-solid fa-route',        basamak:'ilk-hafta', puan:25,  olcut:'km',   hedef:10,     nasil:'Ölçülmüş toplam mesafen 10 kilometreye ulaşsın.' },
    { slug:'km-100',   ad:'100 km',       aile:'mesafe', ico:'fa-solid fa-road',         basamak:'ilk-ay',    puan:100, olcut:'km',   hedef:100,    nasil:'Ölçülmüş toplam mesafen 100 kilometreye ulaşsın.' },
    { slug:'km-500',   ad:'500 km',       aile:'mesafe', ico:'fa-solid fa-flag',         basamak:'kendi-yolun', puan:250, olcut:'km', hedef:500,    nasil:'Ölçülmüş toplam mesafen 500 kilometreye ulaşsın.' },
    { slug:'adim-100k',ad:'100.000 Adım', aile:'mesafe', ico:'fa-solid fa-shoe-prints',  basamak:'ilk-ay',    puan:100, olcut:'adim', hedef:100000, nasil:'Cihazdan gelen toplam adımın 100.000’e ulaşsın.' },
    { slug:'adim-1m',  ad:'1 Milyon Adım',aile:'mesafe', ico:'fa-solid fa-person-hiking',basamak:'iki-yil',   puan:250, olcut:'adim', hedef:1000000,nasil:'Cihazdan gelen toplam adımın 1.000.000’e ulaşsın.' },

    /* --- Su (R15/7) — ölçü FIT_SU'dan, seri challenge motorunun alışkanlık
           hesabından. Hedef antrenman yapılan günde yükseldiği için "tuttu"
           o günün YÜKSELMİŞ hedefine göre değerlendirilir. ---------------- */
    { slug:'su-ilk',    ad:'İlk Dolu Gün',   aile:'su', ico:'fa-solid fa-droplet',        basamak:'baslangic', puan:10,  olcut:'suGun',  hedef:1,  nasil:'Bir gün su hedefini tut.' },
    { slug:'su-7',      ad:'7 Dolu Gün',     aile:'su', ico:'fa-solid fa-bottle-water',   basamak:'ilk-hafta', puan:25,  olcut:'suGun',  hedef:7,  nasil:'Toplam yedi gün su hedefini tut.' },
    { slug:'su-30',     ad:'30 Dolu Gün',    aile:'su', ico:'fa-solid fa-glass-water',    basamak:'ilk-ay',    puan:100, olcut:'suGun',  hedef:30, nasil:'Toplam otuz gün su hedefini tut.' },
    { slug:'su-seri-3', ad:'3 Gün Üst Üste', aile:'su', ico:'fa-solid fa-water',          basamak:'baslangic', puan:25,  olcut:'suSeri', hedef:3,  nasil:'Üç gün üst üste su hedefini tut.' },
    { slug:'su-seri-7', ad:'7 Gün Üst Üste', aile:'su', ico:'fa-solid fa-faucet-drip',    basamak:'ilk-ay',    puan:50,  olcut:'suSeri', hedef:7,  nasil:'Yedi gün üst üste su hedefini tut.' },

    /* --- Test ve bilgi paylaşımı — 🔴 ÖLÇÜ BEKLİYOR ------------------- */
    /* R20/K3 · DÖRDÜ DE ÖLÇÜSÜNE BAĞLANDI. Ölçülmüştü: 50 rozetin 9'u hiçbir
       yoldan kazanılamıyordu (4.170 puanın 950'si) ve dördü buradaki
       `olcut:null` taşıyanlardı — kart ömür boyu "%0 · yolda" duruyordu.
       Sağlık verisi kararı KORUNDU: test SONUCU hâlâ hiçbir yere yazılmıyor;
       yazılan tek şey hangi testin ÇÖZÜLDÜĞÜ (slug listesi). Bir sayaç sağlık
       verisi değildir. Aynı biçimde antrenörle paylaşılan bilgilerin İÇERİĞİ
       değil, kaç alanın dolu olduğu ölçülüyor. */
    { slug:'test-ilk',      ad:'İlk Fit Testi',       aile:'bilgi', ico:'fa-solid fa-clipboard-question', basamak:'baslangic', puan:25, olcut:'test', hedef:1,
      nasil:'Bir Fit testini çöz.',
      kaynakEkran:'fit-testleri-v1.html', kaynakEkranAd:'Fit Testleri' },
    { slug:'test-3',        ad:'Üç Test',             aile:'bilgi', ico:'fa-solid fa-square-poll-vertical', basamak:'ilk-ay',  puan:50, olcut:'test', hedef:3,
      nasil:'Üç ayrı Fit testini çöz.',
      kaynakEkran:'fit-testleri-v1.html', kaynakEkranAd:'Fit Testleri' },
    { slug:'antrenor-bilgi',ad:'Antrenörüne Anlattın', aile:'bilgi', ico:'fa-solid fa-user-doctor',       basamak:'ilk-hafta', puan:50, olcut:'antrenorBilgi', hedef:1,
      nasil:'Antrenörünle paylaşılan sağlık ve hedef bilgilerinden en az birini doldur.',
      kaynakEkran:'antrenor-detay-v1.html', kaynakEkranAd:'Antrenör sayfası' },
    { slug:'antrenor-tam',  ad:'Eksiksiz Profil',      aile:'bilgi', ico:'fa-solid fa-id-card',           basamak:'ilk-ay',    puan:100, olcut:'antrenorTam', hedef:1,
      nasil:'Antrenörünle paylaşılan bütün alanları doldur.',
      kaynakEkran:'antrenor-detay-v1.html', kaynakEkranAd:'Antrenör sayfası' }
  ];

  /* ==================================================================
     4 · ÖLÇÜLER — hepsi gerçek depodan
     ================================================================== */
  function S() { return kok.FIT_SHELL && kok.FIT_SHELL.state; }

  function gunAnahtar(iso) {
    var t = new Date(iso); if (isNaN(t)) return null;
    return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') +
           '-' + String(t.getDate()).padStart(2, '0');
  }

  function enUzunKosu(gunler) {
    var s = gunler.slice().sort(), en = 0, k = 0, onceki = null;
    s.forEach(function (g) {
      if (onceki === null) { k = 1; }
      else {
        var p = onceki.split('-'), q = g.split('-');
        var fark = Math.round((Date.UTC(+q[0], +q[1] - 1, +q[2]) - Date.UTC(+p[0], +p[1] - 1, +p[2])) / 86400000);
        k = (fark === 1) ? k + 1 : 1;
      }
      if (k > en) en = k;
      onceki = g;
    });
    return en;
  }

  function olcular() {
    var st = S(); var s = st ? st.read() : null;
    var gecmis = (s && Array.isArray(s.gecmis)) ? s.gecmis : [];

    var gunSet = {}, kuvvetGunSet = {}, cesitSet = {};
    var toplamDk = 0, enUzunSeans = 0, km = 0, adim = 0, set = 0, tekrar = 0;
    var tarihsiz = 0;

    gecmis.forEach(function (g) {
      if (!g) return;
      if (typeof g.dk === 'number') {
        toplamDk += g.dk;
        if (g.dk > enUzunSeans) enUzunSeans = g.dk;
      }
      if (g.slug) cesitSet[g.slug] = 1;

      var a = g.tarihISO ? gunAnahtar(g.tarihISO) : null;
      if (a) gunSet[a] = 1; else tarihsiz++;

      var m = g.metrik;
      if (m && typeof m === 'object') {
        if (a && (typeof m.set === 'number' || typeof m.tekrar === 'number')) kuvvetGunSet[a] = 1;
        if (typeof m.set === 'number') set += m.set;
        if (typeof m.tekrar === 'number') tekrar += m.tekrar;
        /* km ve adım YALNIZ ölçülmüş/cihaz kaydından — beyan mesafe saymaz */
        if (g.kaynak === 'olculdu' || g.kaynak === 'cihaz') {
          if (typeof m.km === 'number') km += m.km;
          if (typeof m.adim === 'number') adim += m.adim;
        }
      }
    });

    var gunler = Object.keys(gunSet);

    /* Planlar — FIT_PLAN sözleşmesi */
    var bitenPlan = 0, planGun = 0;
    if (kok.FIT_PLAN && kok.FIT_PLAN.listele) {
      kok.FIT_PLAN.listele().forEach(function (p) {
        if (p.durum === 'tamamlandi') bitenPlan++;
        var gd = p.gunDurum || {};
        Object.keys(gd).forEach(function (k) { if (gd[k] && gd[k].durum === 'tamamlandi') planGun++; });
      });
    }

    /* Programlar — kabuk arşivi */
    var bitenProgram = 0, dinlenmeSet = {};
    if (s) {
      (s.arsiv || []).forEach(function (a) {
        if (a.kaynak !== 'plan' && a.durum === 'tamamlandi') bitenProgram++;
        /* R20/K12 · DİNLENME KÜMÜLATİF. Eskiden ölçü YALNIZ aktif programın
           `dinlenmeler[]` dizisinden okunuyordu; program değişince sayaç geri
           gidiyordu (ölçüldü: dinlenme 1 → yeni program → 0). `dinlenme-5`
           rozeti ancak TEK bir program içinde beş dinlenme günü olan
           kullanıcıya düşebiliyordu. Arşiv kaydı artık dinlenme günlerini
           birlikte taşıyor (fit-shell.js `_arsivKaydi`).
           TARİHE göre tekilleştiriliyor: aynı gün iki kayıtta geçerse
           (arşivlenmiş program + üstüne binen yeni program) iki kez sayılmaz. */
        (Array.isArray(a.dinlenmeler) ? a.dinlenmeler : []).forEach(function (t) { dinlenmeSet[t] = 1; });
      });
      if (s.program && Array.isArray(s.program.dinlenmeler)) {
        s.program.dinlenmeler.forEach(function (t) { dinlenmeSet[t] = 1; });
      }
    }
    var dinlenme = Object.keys(dinlenmeSet).length;

    /* Challenge — FIT_CHALLENGE motoru */
    var bitenChallenge = 0, bitenAliskanlik = 0, bitenSeri = 0, bitenSureli = 0, challengeGun = 0;
    if (kok.FIT_CHALLENGE && kok.FIT_CHALLENGE.katilimlar) {
      kok.FIT_CHALLENGE.katilimlar().forEach(function (x) {
        if (x.ilerleme) challengeGun += (x.ilerleme.kayitSayisi || 0);
        if (x.katilim.durum !== 'tamamlandi') return;
        bitenChallenge++;
        if (x.katalog.tip === 'aliskanlik') bitenAliskanlik++;
        if (x.katalog.tip === 'seri')       bitenSeri++;
        if (x.katalog.tip === 'sureli')     bitenSureli++;
      });
    }

    /* Su ölçüleri kendi modülünden gelir; bu dosya su hesabı YAPMAZ.
       Modül yüklü değilse alanlar 0 kalır ve rozetler "yolda" görünür —
       uydurma bir sayı üretilmez. */
    var su = (kok.FIT_SU && kok.FIT_SU.olcu) ? kok.FIT_SU.olcu() : { suGun: 0, suSeri: 0 };

    /* R20/K3 · TEST SAYACI — dm_fit_test_v1.
       ŞEMA: { surum:1, cozulen:['denge','esneklik',…], guncelleme:ISO }
       Yalnız SLUG tutulur; puan, sonuç, cevap ve sağlık verisi YOK ve
       olmayacak (fit-testi-detay-v1.html'in kendi kararı korunuyor).
       Aynı test iki kez çözülürse bir kez sayılır — slug dizisi tekildir. */
    var test = 0;
    try {
      var td = JSON.parse(kok.localStorage.getItem('dm_fit_test_v1') || 'null');
      if (td && Array.isArray(td.cozulen)) {
        var tset = {};
        td.cozulen.forEach(function (x) { if (x) tset[x] = 1; });
        test = Object.keys(tset).length;
      }
    } catch (e) {}

    /* R20/K3 · ANTRENÖRLE PAYLAŞILAN BİLGİ — dm_fit_antrenor_bilgi_v1.
       ŞEMA: { surum:1, toplamAlan:Number, doluAlan:Number, guncelleme:ISO }
       Alanların İÇERİĞİ bu ölçüye girmez; yalnız kaçının dolu olduğu.
       `antrenorTam` ancak toplamAlan bilinir VE hepsi doluysa 1 olur —
       toplamAlan 0 ise ölçü 0 kalır, bilinmeyen bir bütünü "tam" saymayız. */
    var antrenorBilgi = 0, antrenorTam = 0;
    try {
      var ab = JSON.parse(kok.localStorage.getItem('dm_fit_antrenor_bilgi_v1') || 'null');
      if (ab && typeof ab === 'object') {
        var dolu = (typeof ab.doluAlan === 'number') ? ab.doluAlan : 0;
        var top  = (typeof ab.toplamAlan === 'number') ? ab.toplamAlan : 0;
        antrenorBilgi = dolu > 0 ? 1 : 0;
        antrenorTam   = (top > 0 && dolu >= top) ? 1 : 0;
      }
    } catch (e) {}

    return {
      kayit: gecmis.length,
      aktifGun: gunler.length,
      suGun: su.suGun, suSeri: su.suSeri,
      seri: enUzunKosu(gunler),
      kuvvetGun: Object.keys(kuvvetGunSet).length,
      cesit: Object.keys(cesitSet).length,
      toplamDk: Math.round(toplamDk),
      enUzunSeans: Math.round(enUzunSeans),
      km: Math.round(km * 10) / 10,
      adim: Math.round(adim),
      set: Math.round(set), tekrar: Math.round(tekrar),
      planGun: planGun, bitenPlan: bitenPlan, bitenProgram: bitenProgram,
      dinlenme: dinlenme,
      test: test, antrenorBilgi: antrenorBilgi, antrenorTam: antrenorTam,
      challengeGun: challengeGun, bitenChallenge: bitenChallenge,
      bitenAliskanlik: bitenAliskanlik, bitenSeri: bitenSeri, bitenSureli: bitenSureli,
      tarihsizKayit: tarihsiz
    };
  }

  /* ==================================================================
     5 · DEPO — mühür defteri
     ================================================================== */
  function bos() { return { surum: SURUM, kazanildi: {}, gorulen: {} }; }

  function oku() {
    var d;
    try { d = JSON.parse(kok.localStorage.getItem(KEY) || 'null'); }
    catch (e) { d = null; }
    if (!d || typeof d !== 'object') return bos();
    if (!d.kazanildi || typeof d.kazanildi !== 'object') d.kazanildi = {};
    if (!d.gorulen  || typeof d.gorulen  !== 'object') d.gorulen  = {};
    d.surum = SURUM;
    return d;
  }

  function yaz(d) {
    try { kok.localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { return false; }
    kok.dispatchEvent(new CustomEvent('fit-rozet-degisti', { detail: d }));
    return true;
  }

  /* ==================================================================
     6 · DEĞERLENDİRME — ölçüyü geçen her rozet mühürlenir
     Dönen değer: bu çağrıda YENİ kazanılan rozetler (bildirim için).
     ================================================================== */
  function degerlendir() {
    var m = olcular(), d = oku(), yeni = [];
    KATALOG.forEach(function (r) {
      if (d.kazanildi[r.slug]) return;
      if (!r.olcut) return;                       /* ölçü bekliyor — mühürlenmez */
      var simdi = m[r.olcut];
      if (typeof simdi !== 'number') return;
      if (simdi >= r.hedef) {
        d.kazanildi[r.slug] = new Date().toISOString();
        yeni.push(r);
      }
    });
    if (yeni.length) {
      yaz(d);
      /* Kazanım bildirim akışına da düşer — kabuk API'si, yeni alan yok. */
      var st = S();
      if (st && st.bildirimEkle) {
        yeni.forEach(function (r) {
          st.bildirimEkle({
            anahtar: 'rozet_' + r.slug, tur: 'rozet',
            baslik: 'Yeni rozet: ' + r.ad,
            metin: r.nasil + ' · +' + r.puan + ' puan',
            href: 'fit-rozetlerim.html#koleksiyon'
          });
        });
      }
    }
    return yeni;
  }

  /* ==================================================================
     7 · GÖRÜNÜM VERİSİ
     ================================================================== */
  function durum(r, m, d) {
    if (d.kazanildi[r.slug]) return 'kazanildi';
    if (!r.olcut) return 'olcusuz';
    return 'yolda';
  }

  function liste() {
    var m = olcular(), d = oku();
    return KATALOG.map(function (r) {
      var dr = durum(r, m, d);
      var simdi = r.olcut ? (m[r.olcut] || 0) : 0;
      return {
        slug: r.slug, ad: r.ad, aile: r.aile, ico: r.ico, basamak: r.basamak,
        puan: r.puan, nasil: r.nasil, olcut: r.olcut, hedef: r.hedef,
        kaynakEkran: r.kaynakEkran || null, kaynakEkranAd: r.kaynakEkranAd || null,
        kaynakNot: r.kaynakNot || null,
        durum: dr,
        tarih: d.kazanildi[r.slug] || null,
        yeni: !!(d.kazanildi[r.slug] && !d.gorulen[r.slug]),
        simdi: Math.min(simdi, r.hedef),
        oran: (dr === 'kazanildi') ? 100 : (r.olcut ? Math.min(100, Math.round(simdi / r.hedef * 100)) : 0),
        kalan: (dr === 'kazanildi' || !r.olcut) ? 0 : Math.max(0, r.hedef - simdi)
      };
    });
  }

  function puan() {
    var d = oku(), t = 0;
    KATALOG.forEach(function (r) { if (d.kazanildi[r.slug]) t += r.puan; });
    return t;
  }

  function ozet() {
    var l = liste();
    return {
      kazanildi: l.filter(function (x) { return x.durum === 'kazanildi'; }).length,
      yolda:     l.filter(function (x) { return x.durum === 'yolda'; }).length,
      olcusuz:   l.filter(function (x) { return x.durum === 'olcusuz'; }).length,
      toplam: l.length, puan: puan(), olcu: olcular()
    };
  }

  /* ==================================================================
     KADEME — iki ölçütlü, Gastro'nun TierLadder::resolve deseni
     ------------------------------------------------------------------
     Üye, PUAN eşiğini VE AKTİF GÜN barajını birlikte geçtiği EN YÜKSEK
     kademeye yerleşir. Tek ölçüt yeterli olsaydı kademe "çok rozet
     açtım" ile atlanırdı; ikinci baraj onu sürdürmeye bağlıyor.

     `kademe()` KABUĞUN OKUDUĞU YÜZEYDİR (profil kartı · hesabım).
     Döndürdüğü şekil sabittir; alan adı değiştirilmez.
     ================================================================== */
  function kademe() {
    var m = olcular(), p = puan(), i = -1;
    KADEMELER.forEach(function (k, ix) {
      if (p >= k.minPuan && m.aktifGun >= k.minGun) i = ix;
    });
    var simdiki = i >= 0 ? KADEMELER[i] : null;
    var sonraki = KADEMELER[i + 1] || null;

    /* İlerleme İKİ EKSENLİ olduğu için tek bir yüzde YALAN olurdu:
       puanı tamamlamış ama günü tamamlamamış biri "%100" görürdü.
       Yüzde, iki eksenin DÜŞÜK olanıdır — asıl engel hangisiyse o.

       ⚠ ÜÇÜNCÜ HÂL: EKSEN ÖLÇÜLEMEZ (null).  Bir eksenin aralığı sıfır
       olabilir — iki kademe arasında o eksende hiç mesafe yoktur. Bugün
       gerçek örneği ilk basamaktır: Kademesiz → Yeni Başlayan yolunda
       puan eşiği 0'dan 0'a gider. Eski kod bu durumda oranı 100 yazıyordu
       ve ekran "Puan %100 · eşik 0" basıyordu: 0 puanı olan birine
       "puan eşiğini geçtin" demek, olmayan bir başarıyı bildirmekti.
       Sıfır aralık "tamamlandı" değil, "ölçülemez"dir → null döner ve
       ekran o ekseni hiç konuşmaz. (Ölçüldü: `puanOran`/`gunOran`ı okuyan
       tek yer rozetlerim-v1.html; kabuk profil kartı ve hesabim-v1
       yalnız `sira`·`ad`·`ico`·`toplam` okuyor, onlar etkilenmez.)

       `oran` SAYI KALIR — kabuk sözleşmesi onu sayı bekliyor. Ölçülemez
       eksen minimuma katılmaz; `Math.min(null, 50)` 0 verirdi ve çubuğu
       yanlış yere çekerdi. */
    var puanOran = 100, gunOran = 100;
    if (sonraki) {
      var altP = simdiki ? simdiki.minPuan : 0, altG = simdiki ? simdiki.minGun : 0;
      puanOran = sonraki.minPuan > altP ? Math.min(100, Math.round((p - altP) / (sonraki.minPuan - altP) * 100)) : null;
      gunOran  = sonraki.minGun  > altG ? Math.min(100, Math.round((m.aktifGun - altG) / (sonraki.minGun - altG) * 100)) : null;
      if (puanOran !== null && puanOran < 0) puanOran = 0;
      if (gunOran  !== null && gunOran  < 0) gunOran  = 0;
    }
    var olculebilir = [puanOran, gunOran].filter(function (o) { return typeof o === 'number'; });
    var kalanPuan = sonraki ? Math.max(0, sonraki.minPuan - p) : 0;
    var kalanGun  = sonraki ? Math.max(0, sonraki.minGun - m.aktifGun) : 0;

    return {
      ad: simdiki ? simdiki.ad : 'Kademesiz',
      key: simdiki ? simdiki.key : null,
      ico: simdiki ? simdiki.ico : 'fa-solid fa-medal',
      sira: i + 1,                       /* 1 tabanlı; kademesizse 0 */
      toplam: KADEMELER.length,
      puan: p,
      aktifGun: m.aktifGun,
      sonraki: sonraki ? { ad: sonraki.ad, key: sonraki.key, ico: sonraki.ico,
                           minPuan: sonraki.minPuan, minGun: sonraki.minGun } : null,
      kalanPuan: kalanPuan,
      kalanGun: kalanGun,
      oran: !sonraki ? 100 : (olculebilir.length ? Math.min.apply(null, olculebilir) : 100),
      puanOran: puanOran, gunOran: gunOran,
      /* Sonraki kademeye engel olan eksen — ekran hangisini söyleyeceğini
         tahmin etmesin diye burada karara bağlanıyor.
         Ölçülemez eksen buraya HİÇ giremez ve bu bir kural değil, sonuç:
         aralık sıfırsa `sonraki.minX <= altX` ve kullanıcı zaten `altX`in
         üstündedir, yani o eksenin `kalan`ı hep 0'dır. Yine de ekran
         "geçtin" cümlesini basmasın diye `puanOran === null` bakar. */
      engel: !sonraki ? null : (kalanPuan > 0 && kalanGun > 0) ? 'ikisi'
             : kalanPuan > 0 ? 'puan' : kalanGun > 0 ? 'gun' : null,
      kademeler: KADEMELER
    };
  }

  /* Yolculuk — kademe merdiveninin ekran görünümü. Geriye dönük ad. */
  /* Yolculuk — aktif gün sayısına göre basamak. */
  function yolculuk() {
    var k = kademe(), m = olcular();
    return {
      basamaklar: KADEMELER, kademeler: KADEMELER,
      indeks: k.sira - 1, simdiki: k.key ? KADEMELER[k.sira - 1] : null,
      sonraki: k.sonraki ? KADEMELER[k.sira] : null,
      aktifGun: m.aktifGun, oran: k.oran,
      kalan: k.kalanGun, kalanPuan: k.kalanPuan, engel: k.engel,
      toplamDk: m.toplamDk, puan: k.puan
    };
  }


  /* ==================================================================
     8 · LİDERLİK — 🔴 MAKET, dürüstçe işaretli
     Prototipte sunucu yok; BAŞKA KULLANICI VERİSİ YOK. Aşağıdaki yedi satır
     uydurma isimlerdir ve öyle etiketlenir. TEK GERÇEK SATIR kullanıcının
     kendisidir: puanı gerçek rozet defterinden gelir, sırası da o gerçek
     puanın maket satırlar arasındaki yeridir.
     "Yakında" yazılmaz, sahte düğme konmaz.
     ================================================================== */
  var MAKET_SATIRLAR = [
    { ad: 'Zeynep Y.', handle: '@zeynepy', puan: 1480, rozet: 26 },
    { ad: 'Mert K.',   handle: '@mertk',   puan: 1205, rozet: 22 },
    { ad: 'Selin A.',  handle: '@selina',  puan: 940,  rozet: 19 },
    { ad: 'Barış T.',  handle: '@barist',  puan: 615,  rozet: 14 },
    { ad: 'Deniz Ö.',  handle: '@denizo',  puan: 420,  rozet: 11 },
    { ad: 'Ayça S.',   handle: '@aycas',   puan: 265,  rozet: 8 },
    { ad: 'Kaan D.',   handle: '@kaand',   puan: 120,  rozet: 5 }
  ];

  function liderlik() {
    var benimPuan = puan();
    var benimRozet = ozet().kazanildi;
    /* Kullanıcı adı KABUĞUN BASTIĞI kimlik kartından okunur.
       `FIT_USER` kabukta tanımlı ama dosyanın tamamı bir IIFE içinde
       (fit-shell.js:22) — `window.FIT_USER` YOKTUR (ölçüldü). Adı burada
       ikinci kez yazmak iki kaynak üretirdi; ekranda zaten duran değeri
       okuyoruz. Kabuk ileride `FIT_SHELL.user`ı açarsa o kazanır. */
    var kimlik = document.querySelector('.fp-kimlik-id .fp-handle2');
    var uad = kimlik && kimlik.querySelector('.fp-uad');
    var ad = (kok.FIT_SHELL && kok.FIT_SHELL.user && kok.FIT_SHELL.user.ad) ||
             (kimlik ? kimlik.textContent.replace(uad ? uad.textContent : '', '').trim() : '') || 'Sen';
    var handle = (kok.FIT_SHELL && kok.FIT_SHELL.user && kok.FIT_SHELL.user.handle) ||
                 (uad ? uad.textContent.trim() : '') || '';
    var ben = {
      ad: ad, handle: handle,
      puan: benimPuan, rozet: benimRozet, ben: true, gercek: true
    };
    var satirlar = MAKET_SATIRLAR.map(function (x) {
      return { ad: x.ad, handle: x.handle, puan: x.puan, rozet: x.rozet, ben: false, gercek: false };
    });
    satirlar.push(ben);
    satirlar.sort(function (a, b) {
      if (b.puan !== a.puan) return b.puan - a.puan;
      return a.ben ? 1 : -1;                       /* eşitlikte maket üstte */
    });
    satirlar.forEach(function (x, i) { x.sira = i + 1; });
    return {
      satirlar: satirlar,
      benimSira: satirlar.filter(function (x) { return x.ben; })[0].sira,
      maketSayisi: MAKET_SATIRLAR.length
    };
  }

  /* ==================================================================
     9 · YARDIMCI YÜZEY
     ================================================================== */
  function gorulduIsaretle(slug) {
    var d = oku();
    if (slug) { if (d.kazanildi[slug]) d.gorulen[slug] = 1; }
    else Object.keys(d.kazanildi).forEach(function (k) { d.gorulen[k] = 1; });
    return yaz(d);
  }

  function dinle(fn) {
    document.addEventListener('fit:state', fn);
    kok.addEventListener('fit-rozet-degisti', fn);
    kok.addEventListener('fit-challenge-degisti', fn);
    kok.addEventListener('fit-plan-degisti', fn);
    kok.addEventListener('fit-su-degisti', fn);
    kok.addEventListener('storage', function (e) {
      if (!e.key || e.key.indexOf('dm_fit') === 0) fn();
    });
    fn();
  }

  kok.FIT_ROZET = {
    KATALOG: KATALOG, AILELER: AILELER, BASAMAKLAR: BASAMAKLAR, KADEMELER: KADEMELER,
    olcular: olcular, degerlendir: degerlendir, liste: liste, ozet: ozet,
    puan: puan, kademe: kademe, yolculuk: yolculuk, liderlik: liderlik,
    gorulduIsaretle: gorulduIsaretle, dinle: dinle, oku: oku,
    temizle: function () { try { kok.localStorage.removeItem(KEY); } catch (e) {} yaz(bos()); }
  };

  /* Her durum değişiminde yeniden değerlendir — rozet, olayın kendisinden
     değil ÖLÇÜNÜN sonucundan doğar. */
  document.addEventListener('fit:state', function () { degerlendir(); });
  kok.addEventListener('fit-plan-degisti', function () { degerlendir(); });
  kok.addEventListener('fit-challenge-degisti', function () { degerlendir(); });
  kok.addEventListener('fit-su-degisti', function () { degerlendir(); });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { degerlendir(); });
  } else { degerlendir(); }

})(window);
