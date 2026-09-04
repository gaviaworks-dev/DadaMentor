/* =====================================================================
   DadaFit · PLAN KAYDI — TEK KAYNAK  (REVİZYON 6 · madde 18–19 sözleşmesi)
   ---------------------------------------------------------------------
   Antrenman Oluşturucu (H3) ürettiği planı buraya YAZAR.
   Fit Planım sayfaları buradan OKUR. İki taraf da kendi depolama
   kodunu yazmaz — çağrı yüzeyi yalnız bu dosyadadır.

   DEPOLAMA
     localStorage['dm_fit_planlar_v1']  →  { planlar:[Plan], aktifId:string|null }
     (kabuğun `dm_fit_*` anahtar ailesiyle aynı önek — fit-shell.js pref())

   PLAN ŞEMASI
     {
       id        : 'plan_<zaman>_<rastgele>',   // FIT_PLAN üretir
       ad        : 'Ev · 3 gün · Başlangıç',    // görünen ad
       olusturma : '2026-08-21T09:00:00.000Z',  // ISO
       kaynak    : 'antrenman-olusturucu',      // hangi motor ürettiyse
       secimler  : { gunSayisi, seviye, hedef, mekan, ekipman:[], sure, cinsiyet },
       gunler    : [ {
           no        : 1,
           ad        : 'Gün 1',
           odak      : 'İtiş',
           isinma    : '5 dk hafif tempo + omuz çevirme',   // v2 · §3.3
           hareketler: [ {
               slug, ad, set, tekrar, sure,                 // set/tekrar/sure serbest
               dinlenme  : 60,          // v2 · saniye — setler arası
               ekipman   : ['dambıl'],  // v2 · gereken ekipman
               video     : 'slug',      // v2 · form videosu (egzersiz-detay slug'ı)
               uyari     : '…',         // v2 · form/güvenlik uyarısı
               alternatif  : 'slug',    // v2 · "bu bana uymuyor" karşılığı
               alternatifAd: 'Şınav (Push-up)'  // v2 · alternatifin GÖRÜNEN adı
           } ]
       } ],
       ilerleme  : {                            // anahtar: 'g<gunNo>-h<hareketIdx>'
          'g1-h0': { yapildi:true, seviye:'tam', tarih:'2026-08-21T…',
                     agirlik:12, tekrarYapilan:10, efor:7 }   // v2 · §5.3/§5.4
       },
       gunDurum  : {                            // v3 · R14-B — anahtar: 'g<gunNo>'
          'g1': { durum:'tamamlandi', tarih:'2026-08-21T…', kayit:true }
       },
       durum     : 'devam' | 'tamamlandi',      // v4 · R14-B/#5
       bitis     : '2026-08-25T…' | null,       // v4 · son gün karar aldığı an
       arsivlendi: true,                        // v4 · arşive bir kez düştü (mühür)
       tur       : 2,                           // v4 · kaçıncı tur (yeniden başlat)
       bitisKartKapali: 2 | null                // v4 · #6 kartı KAÇINCI TURDA kapatıldı
     }

   ŞEMA v2 — R10 · belge §3.3 · §5.3 · §5.4
     Eklenen alanların HEPSİ İSTEĞE BAĞLI. Eski planlar (v1) kırılmaz:
     alan yoksa okuyan taraf göstermez, uydurmaz. Oluşturucu bu alanları
     doldurmaya başlayana kadar Fit Planım onları basitçe atlar — yarım
     dolu bir kart, sahte dolu bir karttan iyidir.

     gunler[].isinma                → §3.3 ısınma
     hareketler[].dinlenme (sn)     → §3.3 setler arası dinlenme
     hareketler[].ekipman []        → §3.3 gereken ekipman
     hareketler[].video (slug)      → §3.3 form videosu
     hareketler[].uyari             → §3.3 form/güvenlik uyarısı
     hareketler[].alternatif (slug) → §3.3 "bu hareket bana uymuyor"
     hareketler[].alternatifAd      → alternatifin GÖRÜNEN adı. Slug→ad tablosu
       yalnız Oluşturucu'da; okuyan sayfa slug'ı güzelleştirirse FABRİKASYON
       yapar ('sinav' → "Sinav", doğrusu "Şınav (Push-up)"). Ad yoksa okuyan
       taraf etiketi adsız basar — uydurmaz.
     ilerleme[k].agirlik/tekrarYapilan/efor → §5.3 performans · §5.4 hareket bazlı
       Bu üçü aynı zamanda KANIT: yalnız gerçekten yapan girebilir.

   İLERLEME SEVİYELERİ (sabit, uydurulmayacak)
     'tam'    → tamamlandı
     'yarim'  → yarım bırakıldı
     'atlandi'→ atlandı

   ŞEMA v3 — R14-B · GÜN TAMAMLANMA (Beyar kararı, 2026-08-25)
     Ölçülen kusur: Tam/Yarım/Atlandı akışı `isaretle()` çağrısında bitiyordu.
     Gün de plan da "tamamlandı" diye bir hâl bilmiyordu; ekranda hiçbir şey
     olmuyor, geçmişe hiçbir kayıt düşmüyordu.

     "GÜN TAMAMLANDI" TANIMI — kararla tanım, oranla değil:
       Günün HER hareketi bir karar almışsa gün tamamlanmıştır.
       Karar = tam | yarim | ATLANDI. Atlanan da karardır: kullanıcı o
       hareketle işini bitirmiştir. Hiç dokunulmamış tek hareket varsa gün
       bitmemiştir.

     BU TANIM `oran`I DEĞİŞTİRMEZ. `oran`/`yapilan` eskisi gibi 'atlandi'yı
     YAPILMIŞ SAYMAZ — tamamı atlanmış bir gün "tamamlandı" olur ama oranı
     0 kalır. İki soru ayrı sorudur: "bu günle işin bitti mi" ve "ne kadarını
     gerçekten yaptın". Tek sayıya indirmek ikisini de yalan yapardı.

     ŞEMA v4 — R14-B/#5·#6 · PLAN TAMAMLANMA (Beyar, 2026-08-25)
       Gün tamamlanma v3'te çözüldü ama PLAN hâlâ "bitti" diye bir hâl
       bilmiyordu: arşiv boş kalıyor, bitişte hiçbir geri bildirim
       olmuyordu.
         durum/bitis  → planın kendi tamamlanma kaydı
         arsivlendi   → arşive BİR KEZ düşer (gunDurum.kayit ile aynı mantık)
         tur          → yeniden başlatma sayacı; her tur ayrı arşiv kaydı
         bitisKartKapali → #6 özet kartını kullanıcının kapattığı TUR.
                        Bayrak değil TUR NUMARASI: "kapatıldı/kapatılmadı"
                        ile tutulunca yeniden başlatılan planın 2. turu
                        bittiğinde kart bir daha hiç açılmıyordu (ölçüldü).
                        Kart görünürlüğü = durum==='tamamlandi' &&
                        bitisKartKapali !== tur. Böylece kapatma O TURA
                        aittir; yeni tur yeni bir bitiştir, kartını hak eder.

     YENİDEN BAŞLAT (`yenidenBasla`): aynı plan, işaretler sıfır, `tur`+1.
     Eski turun ARŞİV KAYDI SİLİNMEZ — yeni tur eskisinin üstüne yazmaz,
     yanına yazılır. Sessiz veri kaybı kusurdur.

     gunDurum[k].kayit — KÖPRÜ MÜHRÜ. Gün tamamlanınca kabuk bir kez
     `antrenmanTamamla()` çağırıp Aktivite Kayıtlarım'a kayıt düşürür
     (fit-shell.js → "PLAN → PROGRAM KÖPRÜSÜ"). Bu bayrak o kaydın
     yazıldığını söyler. Kullanıcı bir işareti geri alıp günü tekrar
     tamamlarsa `durum` yeniden 'tamamlandi' olur ama `kayit` DURUR ve
     ikinci bir geçmiş kaydı yazılmaz — geçmişe yazılan geri alınamaz,
     ama çoğaltılamaz da.
   ===================================================================== */
(function (kok) {
  'use strict';

  var ANAHTAR   = 'dm_fit_planlar_v1';
  var SEVIYELER = ['tam', 'yarim', 'atlandi'];

  /* ---- düşük seviye: oku / yaz ------------------------------------ */
  function bos() { return { planlar: [], aktifId: null }; }

  function oku() {
    try {
      var ham = kok.localStorage.getItem(ANAHTAR);
      if (!ham) return bos();
      var d = JSON.parse(ham);
      if (!d || !Array.isArray(d.planlar)) return bos();
      if (typeof d.aktifId === 'undefined') d.aktifId = null;
      return d;
    } catch (e) { return bos(); }
  }

  function yaz(d) {
    try { kok.localStorage.setItem(ANAHTAR, JSON.stringify(d)); return true; }
    catch (e) { return false; }          /* kota dolu / gizli kip */
  }

  function yeniId() {
    return 'plan_' + Date.now().toString(36) + '_' +
           Math.random().toString(36).slice(2, 8);
  }

  function ilerlemeAnahtari(gunNo, hareketIdx) {
    return 'g' + gunNo + '-h' + hareketIdx;
  }

  function gunAnahtari(gunNo) { return 'g' + gunNo; }

  /* v3 — günün HER hareketi karar almış mı (tam|yarim|atlandi fark etmez).
     Hareketsiz gün tamamlanmış sayılmaz: boş listeye "bitti" demek
     kullanıcının yapmadığı bir şeyi yaptı saymaktır. */
  function gunKararli(p, g) {
    var h = (g && g.hareketler) || [];
    if (!h.length) return false;
    for (var i = 0; i < h.length; i++) {
      var it = (p.ilerleme || {})[ilerlemeAnahtari(g.no, i)];
      if (!it || !it.yapildi) return false;
    }
    return true;
  }

  function gunuBul(p, gunNo) {
    return (p.gunler || []).filter(function (g) { return g.no === gunNo; })[0] || null;
  }

  /* ---- olay: kayıt değişince dinleyenler haberdar olsun ------------ */
  function haberVer(tur, id, ek) {
    try {
      var d = { tur: tur, id: id };
      /* v3 — gün tamamlanma geçişi olayla duyurulur; köprüyü kabuk kurar
         (bu modül FIT_SHELL'i BİLMEZ, sözleşme modülü bağımsız kalır). */
      if (ek) { for (var a in ek) if (ek.hasOwnProperty(a)) d[a] = ek[a]; }
      kok.dispatchEvent(new CustomEvent('fit-plan-degisti', { detail: d }));
    } catch (e) {}
  }

  /* ---- genel yüzey ------------------------------------------------- */
  var API = {

    ANAHTAR:   ANAHTAR,
    SEVIYELER: SEVIYELER,

    /* localStorage yazılabiliyor mu (gizli kip / kota) */
    kullanilabilir: function () {
      try {
        kok.localStorage.setItem('__fit_test__', '1');
        kok.localStorage.removeItem('__fit_test__');
        return true;
      } catch (e) { return false; }
    },

    /* Planı kaydeder. id taşıyorsa GÜNCELLER, taşımıyorsa yeni kayıt açar.
       Dönen değer: kaydedilen planın id'si (yazılamazsa null). */
    kaydet: function (plan) {
      if (!plan || typeof plan !== 'object') return null;
      var d = oku();
      var p = JSON.parse(JSON.stringify(plan));

      if (!p.id) p.id = yeniId();
      if (!p.olusturma) p.olusturma = new Date().toISOString();
      if (!p.ilerleme || typeof p.ilerleme !== 'object') p.ilerleme = {};
      if (!p.gunDurum || typeof p.gunDurum !== 'object') p.gunDurum = {};   /* v3 */
      if (p.durum !== 'tamamlandi') p.durum = 'devam';                      /* v4 */
      if (typeof p.tur !== 'number' || p.tur < 1) p.tur = 1;
      if (!('bitis' in p)) p.bitis = null;
      if (!Array.isArray(p.gunler)) p.gunler = [];
      p.guncelleme = new Date().toISOString();

      var i = d.planlar.findIndex(function (x) { return x.id === p.id; });
      if (i > -1) d.planlar[i] = p; else d.planlar.unshift(p);

      if (!d.aktifId) d.aktifId = p.id;
      if (!yaz(d)) return null;
      haberVer('kaydet', p.id);
      return p.id;
    },

    /* Yeniden eskiye sıralı kayıt listesi */
    listele: function () {
      return oku().planlar.slice().sort(function (a, b) {
        return String(b.olusturma).localeCompare(String(a.olusturma));
      });
    },

    getir: function (id) {
      if (!id) return null;
      var p = oku().planlar.filter(function (x) { return x.id === id; })[0];
      return p || null;
    },

    sil: function (id) {
      var d = oku();
      var n = d.planlar.length;
      d.planlar = d.planlar.filter(function (x) { return x.id !== id; });
      if (d.planlar.length === n) return false;
      if (d.aktifId === id) d.aktifId = d.planlar.length ? d.planlar[0].id : null;
      if (!yaz(d)) return false;
      haberVer('sil', id);
      return true;
    },

    aktifYap: function (id) {
      var d = oku();
      if (!d.planlar.some(function (x) { return x.id === id; })) return false;
      d.aktifId = id;
      if (!yaz(d)) return false;
      haberVer('aktif', id);
      return true;
    },

    /* Aktif plan nesnesi (yoksa null) */
    aktif: function () {
      var d = oku();
      if (!d.aktifId) return null;
      return d.planlar.filter(function (x) { return x.id === d.aktifId; })[0] || null;
    },

    /* Tek hareketi işaretler.
       durum: {yapildi:boolean, seviye:'tam'|'yarim'|'atlandi',
               agirlik?:number, tekrarYapilan?:number, efor?:1..10}
       yapildi:false verilirse kayıt SİLİNİR (işaret geri alınır).

       v2 — son üç alan §5.3 performans ve §5.4 hareket bazlı ilerlemeyi
       besliyor; aynı zamanda KANIT: yalnız gerçekten yapan girebilir.
       Verilmezse YAZILMAZ (undefined alan üretilmiyor); var olan bir kaydın
       üzerine kısmi güncelleme gelirse eski değerler KORUNUR. */
    isaretle: function (id, gunNo, hareketIdx, durum) {
      var d = oku();
      var p = d.planlar.filter(function (x) { return x.id === id; })[0];
      if (!p) return false;
      if (!p.ilerleme) p.ilerleme = {};

      var k = ilerlemeAnahtari(gunNo, hareketIdx);
      durum = durum || {};

      if (durum.yapildi === false) {
        delete p.ilerleme[k];
      } else {
        var sev = SEVIYELER.indexOf(durum.seviye) > -1 ? durum.seviye : 'tam';
        var eski = p.ilerleme[k] || {};
        var yeni = {
          yapildi: true,
          seviye:  sev,
          tarih:   durum.tarih || new Date().toISOString()
        };
        /* v2 alanları: verilmişse yaz, verilmemişse ESKİSİNİ KORU.
           Kısmi güncelleme (yalnız seviye değişti) performans verisini
           silmemeli — sessiz veri kaybı kusurdur. */
        ['agirlik','tekrarYapilan','efor'].forEach(function(alan){
          if (typeof durum[alan] === 'number')      yeni[alan] = durum[alan];
          else if (typeof eski[alan] === 'number')  yeni[alan] = eski[alan];
        });
        p.ilerleme[k] = yeni;
      }

      /* ---- v3 · GÜN DURUMU (R14-B · Beyar kararı #1) ----------------
         İşaret değişti; bu günün "her hareket karar aldı mı" hâli
         yeniden hesaplanır. Tek kaynak burası — sayfalar kendi
         tamamlanma mantığını yazmaz, `gunDurumu()` ile okur. */
      if (!p.gunDurum) p.gunDurum = {};
      var gk      = gunAnahtari(gunNo);
      var onceki  = p.gunDurum[gk] || null;
      var kararli = gunKararli(p, gunuBul(p, gunNo));
      var gecis   = false;

      if (kararli) {
        if (!onceki || onceki.durum !== 'tamamlandi') {
          p.gunDurum[gk] = {
            durum: 'tamamlandi',
            tarih: new Date().toISOString(),
            /* mühür KORUNUR: daha önce geçmişe yazıldıysa bir daha yazılmaz */
            kayit: !!(onceki && onceki.kayit)
          };
          gecis = !p.gunDurum[gk].kayit;
        }
      } else if (onceki && onceki.durum === 'tamamlandi') {
        /* gün geri açıldı — durum düşer, mühür DURUR */
        p.gunDurum[gk] = { durum: 'devam', tarih: onceki.tarih, kayit: !!onceki.kayit };
      }

      /* ---- v4 · PLAN DURUMU (R14-B/#5) ------------------------------
         Gün durumu değişti; planın tamamı karar aldı mı? Gün mantığıyla
         AYNI kalıp: geçiş anı yakalanır, mühür (`arsivlendi`) ikinci
         kaydı engeller. */
      var hepsi = (p.gunler || []).length > 0 &&
                  (p.gunler || []).every(function (x) { return gunKararli(p, x); });
      var planGecis = false;

      if (hepsi) {
        if (p.durum !== 'tamamlandi') {
          p.durum = 'tamamlandi';
          p.bitis = new Date().toISOString();
          planGecis = !p.arsivlendi;
        }
      } else if (p.durum === 'tamamlandi') {
        /* bir gün geri açıldı — plan artık bitmiş değil. `bitis` temizlenir
           (yanlış bir bitiş tarihi göstermektense tarih göstermemek doğru),
           `arsivlendi` mührü DURUR: arşive düşen kayıt geri alınmaz. */
        p.durum = 'devam';
        p.bitis = null;
      }

      p.guncelleme = new Date().toISOString();
      if (!yaz(d)) return false;
      var ek = null;
      if (gecis || planGecis) {
        ek = {};
        if (gecis)     ek.gunTamamlandi  = gunNo;
        if (planGecis) ek.planTamamlandi = true;
      }
      haberVer('ilerleme', id, ek);
      return true;
    },

    /* v4 — arşiv mührü. Kabuk, arşiv kaydını YAZDIKTAN SONRA çağırır. */
    planArsivIsaretle: function (id) {
      var d = oku();
      var p = d.planlar.filter(function (x) { return x.id === id; })[0];
      if (!p) return false;
      if (p.arsivlendi) return true;
      p.arsivlendi = true;
      return yaz(d);
    },

    /* v4 — #6 özet kartını kapat. Kapatma BU TURA yazılır. */
    bitisKartiKapat: function (id) {
      var d = oku();
      var p = d.planlar.filter(function (x) { return x.id === id; })[0];
      if (!p) return false;
      p.bitisKartKapali = (typeof p.tur === 'number' ? p.tur : 1);
      if (!yaz(d)) return false;
      haberVer('bitisKart', id);
      return true;
    },

    /* v4 — YENİDEN BAŞLAT: aynı plan, işaretler sıfır, yeni tur.
       Eski turun arşiv kaydına DOKUNULMAZ. Çağıranın önce arşivi yazmış
       olması beklenir (kabuk köprüsü bunu plan bitince zaten yapıyor). */
    yenidenBasla: function (id) {
      var d = oku();
      var p = d.planlar.filter(function (x) { return x.id === id; })[0];
      if (!p) return false;
      p.ilerleme   = {};
      p.gunDurum   = {};
      p.durum      = 'devam';
      p.bitis      = null;
      p.arsivlendi = false;          /* yeni tur kendi arşiv kaydını hak eder */
      /* bitisKartKapali'ya DOKUNULMAZ: eski turun numarasını taşıyor, yeni
         turla eşleşmiyor, dolayısıyla yeni bitişte kart kendiliğinden açılır */
      p.tur        = (typeof p.tur === 'number' ? p.tur : 1) + 1;
      p.guncelleme = new Date().toISOString();
      if (!yaz(d)) return false;
      haberVer('yenidenBasla', id, { tur: p.tur });
      return true;
    },

    /* v3 — bir günün tamamlanma kaydı. Yoksa null.
       {durum:'tamamlandi'|'devam', tarih, kayit} */
    gunDurumu: function (id, gunNo) {
      var p = API.getir(id);
      if (!p || !p.gunDurum) return null;
      return p.gunDurum[gunAnahtari(gunNo)] || null;
    },

    /* v3 — köprü mührü. Kabuk, geçmiş kaydını YAZDIKTAN SONRA çağırır.
       İkinci kez çağrılması zararsızdır (mühür zaten basılı). */
    gunKayitIsaretle: function (id, gunNo) {
      var d = oku();
      var p = d.planlar.filter(function (x) { return x.id === id; })[0];
      if (!p) return false;
      if (!p.gunDurum) p.gunDurum = {};
      var gk = gunAnahtari(gunNo);
      var g  = p.gunDurum[gk];
      if (!g) return false;
      if (g.kayit) return true;
      g.kayit = true;
      return yaz(d);
    },

    isaret: function (id, gunNo, hareketIdx) {
      var p = API.getir(id);
      if (!p || !p.ilerleme) return null;
      return p.ilerleme[ilerlemeAnahtari(gunNo, hareketIdx)] || null;
    },

    /* Özet — Fit Planım üst kartı bunu basar.
       toplam  : plandaki hareket sayısı
       yapilan : 'tam' + 'yarim' işaretli hareket sayısı ('atlandi' sayılmaz)
       oran    : 0–100 tam sayı  ← ATLANANI SAYMAZ, v3'te DEĞİŞMEDİ
       aktifGun: sırada bekleyen ilk günün no'su
       bitti   : v3 — planın TÜM günleri karar almış mı

       R14-B · #2 — KÖR NOKTA GİDERİLDİ. `aktifGun` eskiden "hepsi bittiyse
       SON GÜN" dönüyordu; ekran %100'de bile son güne "Sırada" yazıyordu,
       yani "bitti" ile "son gündeyim" ayırt edilemiyordu. Artık `bitti`
       ayrı bir alan; `aktifGun` bittiğinde de son günü döndürmeye devam
       ediyor (eski çağıranlar kırılmasın) ama okuyan taraf ÖNCE `bitti`ye
       bakar.

       AKTİF GÜN ÖLÇÜTÜ DE DÜZELDİ: eskiden "yapılan < toplam" idi ve
       'atlandi' yapılmış sayılmadığı için tamamı atlanmış bir gün sonsuza
       kadar "sırada" kalıyordu. Artık ölçüt KARAR (bkz. şema v3). */
    ozet: function (id) {
      var p = API.getir(id || (oku().aktifId));
      if (!p) return null;

      var toplam = 0, yapilan = 0, sonTarih = null, aktifGun = null;
      var gunSayisi = (p.gunler || []).length, kararliGun = 0;
      /* v4 · #6 — bitiş özet kartı "kaç tam / yarım / atlandı" istiyor.
         Bu üç sayı ORANDAN farklı bir şey söyler: oran ne kadar yapıldığını,
         bu döküm neye nasıl karar verildiğini gösterir. */
      var sayim = { tam: 0, yarim: 0, atlandi: 0, karasiz: 0 };

      (p.gunler || []).forEach(function (g) {
        var gToplam = (g.hareketler || []).length;
        toplam += gToplam;

        (g.hareketler || []).forEach(function (_, i) {
          var it = (p.ilerleme || {})[ilerlemeAnahtari(g.no, i)];
          if (!it || !it.yapildi) { sayim.karasiz++; return; }
          if (sayim.hasOwnProperty(it.seviye)) sayim[it.seviye]++;
          /* oran ölçütü — DEĞİŞMEDİ: atlanan yapılmış sayılmaz */
          if (it.seviye !== 'atlandi') yapilan++;
          if (it.tarih && (!sonTarih || it.tarih > sonTarih)) sonTarih = it.tarih;
        });

        /* gün ölçütü — KARAR (şema v3), orandan bağımsız */
        if (gunKararli(p, g)) kararliGun++;
        else if (aktifGun === null) aktifGun = g.no;
      });

      var bitti = gunSayisi > 0 && kararliGun === gunSayisi;

      if (aktifGun === null && gunSayisi) {
        aktifGun = p.gunler[gunSayisi - 1].no;
      }

      return {
        id:       p.id,
        ad:       p.ad || 'Planım',
        toplam:   toplam,
        yapilan:  yapilan,
        oran:     toplam ? Math.round((yapilan / toplam) * 100) : 0,
        sonTarih: sonTarih,
        aktifGun: aktifGun,
        gunSayisi:gunSayisi,
        bitenGun:kararliGun,   /* v3 — karar almış gün sayısı */
        bitti:   bitti,        /* v3 — plan tamamlandı mı */
        sayim:   sayim,        /* v4 — {tam, yarim, atlandi, karasiz} */
        durum:   p.durum || 'devam',              /* v4 */
        bitisTarihi: p.bitis || null,             /* v4 */
        olusturma:   p.olusturma || null,         /* v4 */
        tur:     (typeof p.tur === 'number' ? p.tur : 1),
        bitisKartKapali: (typeof p.bitisKartKapali === 'number' ? p.bitisKartKapali : null)
      };
    },

    /* Tüm kayıtları siler — yalnız "verilerimi temizle" akışı için */
    temizle: function () {
      try { kok.localStorage.removeItem(ANAHTAR); haberVer('temizle', null); return true; }
      catch (e) { return false; }
    }
  };

  kok.FIT_PLAN = API;

})(window);
