/* =====================================================================
   DadaFit · SU TAKİBİ — TEK KAYNAK   (R15/7)
   ---------------------------------------------------------------------
   ESKİ HÂL (ölçüldü): su, kabuğun `dm_fit.bugun.su` alanında BARDAK olarak
   duruyordu. Üç kusuru vardı ve üçü de aynı sebepten:
     · TARİHSİZ — hangi güne ait olduğu yazmıyordu, bu yüzden geçmiş yok,
       grafik yok, seri yok. Ekran bunu dürüstçe yazıyordu bile:
       "önceki günler örnek veridir — günlük su geçmişi henüz saklanmıyor".
     · HEDEF SABİT — 8 bardak, koda gömülü, kullanıcı değiştiremiyordu.
     · ANLAMSIZ — sayaç, günün ne geçtiğinden habersizdi.
   Bu modül üçünü de kapatıyor: kayıt GÜN GÜN tutuluyor, hedefi kullanıcı
   koyuyor, hedef antrenman yapılan günde otomatik yükseliyor.

   DEPOLAMA
     localStorage['dm_fit_su_v1'] = {
       surum:1,
       birim:'bardak' | 'ml',        // kullanıcının GÖRDÜĞÜ birim
       bardakMl:200,                 // bir bardak kaç ml
       hedefMl:2000,                 // TABAN günlük hedef (antrenman payı hariç)
       gunler:{ 'YYYY-MM-DD':{ ml:N, guncelleme:ISO } },
       hatirlatma:{ acik:false, sikligiDk:90, bas:'08:00', son:'22:00' }
     }
     (kabuğun `dm_fit_*` anahtar ailesiyle aynı önek)

   🔴 İÇERİDE HER ŞEY MİLİLİTRE. Bardak yalnız bir GÖRÜNTÜ birimidir ve
   `bardakMl` ile çevrilir. İki birimi iki ayrı sayı olarak saklamak, biri
   değiştiğinde ötekini yalan yapardı.

   GÖÇ — `dm_fit.bugun.su` (bardak, tarihsiz) BUGÜNE taşınır, bir kez.
   Tarihsiz olduğu için başka bir güne yazmak uydurma olurdu; taşınabilecek
   tek dürüst gün bugündür. Kabuk API'si (suEkle/suSifirla) SİLİNMEZ — o
   dosya bu ajana kapalı — ama bu modül onu bir daha ÇAĞIRMAZ.

   ===================================================================
   ANTRENMAN GÜNÜ HEDEF ARTIŞI — kural ve gerekçesi
   ===================================================================
   ACSM/NATA sıvı yenileme rehberi, egzersiz sırasında **saatte 0,4–0,8 L**
   içmeyi öneriyor. Orta değeri (0,6 L/saat) dakikaya bölüyoruz:

       ek_ml = kayıtlı antrenman dakikası × 10 ml     (0,6 L/saat)

   · 50 ml'ye yuvarlanır (ölçülemeyecek bir hassasiyet göstermek yalan olur)
   · günlük tavan 1500 ml (üç saatlik antrenmanın karşılığı; üstü kişisel
     ölçüm ister, tahminle sürdürülemez)
   · Süresi BİLİNMEYEN ama kalorisi bilinen kayıt: `kcal × 1,5 ml`. Klasik
     yenileme aralığı 1–2 ml/kcal'dir; alt ucu alıyoruz çünkü bu bir
     TAHMİN ve fazla tahmin etmek az tahmin etmekten daha az dürüst.
   · İkisi de yoksa katkı 0'dır ve ekranda "şu kadar kaydın süresi yok"
     diye SÖYLENİR — sessizce sıfır saymak, kaydı yok saymak olurdu.

   KANIT KADEMESİ — BU MODÜLDE DÖRT KAYNAK DA SAYILIR.
   Challenge motorunda `beyan`, sayısal hedefi beslemez; orada sayı bir
   BAŞARIDIR ve beyanla şişirilebilir olmamalıdır. Burada sayı bir başarı
   değil, **su içme önerisidir**. Beyan edilmiş bir antrenman da yapılmış
   bir harekettir ve gerçek risk az su içmektir, çok değil. Kural bilerek
   ayrı; hangi kaydın katkı verdiği `ekNeden.kaynaklar` ile GÖSTERİLİR.
   Bedeli de kayıtlı: hedef yükseldiği için o gün "tuttu" saymak zorlaşır —
   bu yüzden artışın neden olduğu ekranda tek cümleyle yazılır.
   ===================================================================== */
(function (kok) {
  'use strict';

  var KEY = 'dm_fit_su_v1';
  var SURUM = 1;

  var DK_BASINA_ML   = 10;      /* 0,6 L/saat — ACSM aralığının orta değeri */
  var KCAL_BASINA_ML = 1.5;     /* süresi bilinmeyen kayıt için alt uç tahmin */
  var EK_TAVAN_ML    = 1500;    /* günlük tavan */
  var EK_ADIM_ML     = 50;      /* yuvarlama adımı */

  var BOS = {
    surum: SURUM,
    birim: 'bardak',
    bardakMl: 200,
    hedefMl: 2000,
    gunler: {},
    hatirlatma: { acik: false, sikligiDk: 90, bas: '08:00', son: '22:00' }
  };

  /* ---------------- gizli kip kontrolü ----------------
     `fit-kayit.js` deseni: depo yazılamıyorsa ekran sahte bir kalıcılık
     vaat etmemeli. */
  var _ok = null;
  function kullanilabilir() {
    if (_ok !== null) return _ok;
    try {
      kok.localStorage.setItem('__fit_su_probe', '1');
      kok.localStorage.removeItem('__fit_su_probe');
      _ok = true;
    } catch (e) { _ok = false; }
    return _ok;
  }

  /* ---------------- tarih yardımcıları ---------------- */
  function anahtar(d) {
    var t = (d instanceof Date) ? d : new Date(d);
    if (isNaN(t)) return null;
    return t.getFullYear() + '-' +
           String(t.getMonth() + 1).padStart(2, '0') + '-' +
           String(t.getDate()).padStart(2, '0');
  }
  function bugunAnahtar() { return anahtar(new Date()); }
  function gunEkle(ah, n) {
    var p = String(ah).split('-');
    var t = new Date(+p[0], +p[1] - 1, +p[2]);
    t.setDate(t.getDate() + n);
    return anahtar(t);
  }

  /* ---------------- depolama ---------------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* GÖÇ okuma anında yapılır: kullanıcı depoyu hiç açmasa bile eski kayıt
     yeni koda güvenli girer (kabuğun `goc()` deseni). Eksik alan varsayılanla
     tamamlanır, var olan hiçbir değer EZİLMEZ. */
  function goc(v) {
    if (!v || typeof v !== 'object') v = clone(BOS);
    if (typeof v.birim !== 'string' || (v.birim !== 'ml' && v.birim !== 'bardak')) v.birim = BOS.birim;
    if (typeof v.bardakMl !== 'number' || v.bardakMl <= 0) v.bardakMl = BOS.bardakMl;
    if (typeof v.hedefMl !== 'number' || v.hedefMl <= 0) v.hedefMl = BOS.hedefMl;
    if (!v.gunler || typeof v.gunler !== 'object') v.gunler = {};
    if (!v.hatirlatma || typeof v.hatirlatma !== 'object') v.hatirlatma = clone(BOS.hatirlatma);
    ['acik', 'sikligiDk', 'bas', 'son'].forEach(function (k) {
      if (!(k in v.hatirlatma)) v.hatirlatma[k] = BOS.hatirlatma[k];
    });
    v.surum = SURUM;

    /* KABUK GÖÇÜ — `dm_fit.bugun.su` (bardak, tarihsiz) bir kez bugüne. */
    if (!v.kabukGocu) {
      try {
        var S = kok.FIT_SHELL && kok.FIT_SHELL.state;
        var eski = S ? ((S.read().bugun || {}).su || 0) : 0;
        if (eski > 0) {
          var b = bugunAnahtar();
          var v2 = v.gunler[b] || { ml: 0 };
          /* Üstüne YAZMAZ, ekler: kullanıcı bu modülde de içmiş olabilir. */
          v2.ml = (v2.ml || 0) + eski * v.bardakMl;
          v2.guncelleme = new Date().toISOString();
          v.gunler[b] = v2;
        }
      } catch (e) { /* kabuk yoksa göç edilecek bir şey de yok */ }
      v.kabukGocu = true;
    }
    return v;
  }

  function oku() {
    var d;
    try { d = JSON.parse(kok.localStorage.getItem(KEY) || 'null'); }
    catch (e) { d = null; }
    return goc(d);
  }

  function yaz(d) {
    try { kok.localStorage.setItem(KEY, JSON.stringify(d)); }
    catch (e) { return false; }
    kok.dispatchEvent(new CustomEvent('fit-su-degisti', { detail: d }));
    return true;
  }

  /* ==================================================================
     ANTRENMAN PAYI — bugünkü `gecmis[]` kayıtlarından
     ================================================================== */
  function ekHesapla(gunAh) {
    var S = kok.FIT_SHELL && kok.FIT_SHELL.state;
    var gecmis = S ? (S.read().gecmis || []) : [];
    var dk = 0, kcal = 0, sayi = 0, suresiz = 0;
    var kaynaklar = {};

    gecmis.forEach(function (g) {
      if (!g || !g.tarihISO || anahtar(g.tarihISO) !== gunAh) return;
      sayi++;
      kaynaklar[g.kaynak || 'beyan'] = (kaynaklar[g.kaynak || 'beyan'] || 0) + 1;
      if (typeof g.dk === 'number' && g.dk > 0) dk += g.dk;
      else if (typeof g.kcal === 'number' && g.kcal > 0) kcal += g.kcal;
      else suresiz++;
    });

    var ham = dk * DK_BASINA_ML + kcal * KCAL_BASINA_ML;
    var ek = Math.min(EK_TAVAN_ML, Math.round(ham / EK_ADIM_ML) * EK_ADIM_ML);
    return {
      ml: ek, dk: dk, kcal: Math.round(kcal),
      kayitSayisi: sayi, suresizKayit: suresiz,
      kaynaklar: kaynaklar,
      tavanaDayandi: ham > EK_TAVAN_ML
    };
  }

  /* ==================================================================
     GÜN ÖZETİ
     ================================================================== */
  function gun(gunAh) {
    var d = oku();
    var ah = gunAh || bugunAnahtar();
    var kayit = d.gunler[ah] || { ml: 0 };
    var ek = ekHesapla(ah);
    var hedef = d.hedefMl + ek.ml;
    return {
      tarih: ah,
      ml: kayit.ml || 0,
      bardak: Math.round((kayit.ml || 0) / d.bardakMl * 10) / 10,
      tabanMl: d.hedefMl,
      ekMl: ek.ml,
      hedefMl: hedef,
      hedefBardak: Math.round(hedef / d.bardakMl * 10) / 10,
      bardakMl: d.bardakMl,
      birim: d.birim,
      oran: hedef ? Math.min(100, Math.round((kayit.ml || 0) / hedef * 100)) : 0,
      /* Taban payının çubuk üstündeki oranı — antrenman payını GÖRÜNÜR
         kılmak için; kullanıcı hedefin nerede büyüdüğünü görmeli. */
      tabanOran: hedef ? Math.round(d.hedefMl / hedef * 100) : 100,
      tamam: (kayit.ml || 0) >= hedef,
      ekNeden: ek,
      guncelleme: kayit.guncelleme || null
    };
  }

  function bugun() { return gun(bugunAnahtar()); }

  /* ==================================================================
     YAZMA
     ================================================================== */
  function ekleMl(ml) {
    if (typeof ml !== 'number' || !isFinite(ml)) return false;
    var d = oku(), ah = bugunAnahtar();
    var k = d.gunler[ah] || { ml: 0 };
    k.ml = Math.max(0, Math.round((k.ml || 0) + ml));
    k.guncelleme = new Date().toISOString();
    d.gunler[ah] = k;
    if (!yaz(d)) return false;
    if (kok.FIT_ROZET && kok.FIT_ROZET.degerlendir) kok.FIT_ROZET.degerlendir();
    return true;
  }
  function bardakEkle(n) { return ekleMl((n || 1) * oku().bardakMl); }
  function sifirla() {
    var d = oku(), ah = bugunAnahtar();
    if (!d.gunler[ah]) return false;
    d.gunler[ah] = { ml: 0, guncelleme: new Date().toISOString() };
    return yaz(d);
  }

  /* Hedef ve birim — kullanıcı ne girdiyse o. `hedefMl` her zaman ml'dir;
     bardak girildiyse burada çevrilir, iki sayı saklanmaz. */
  function hedefAyarla(deger, birim) {
    var d = oku();
    var ml = (birim === 'bardak') ? deger * d.bardakMl : deger;
    ml = Math.round(ml);
    if (!isFinite(ml) || ml < 250 || ml > 8000) return false;   /* makul sınır */
    d.hedefMl = ml;
    return yaz(d);
  }
  function birimAyarla(birim) {
    if (birim !== 'ml' && birim !== 'bardak') return false;
    var d = oku(); d.birim = birim; return yaz(d);
  }
  function bardakBoyuAyarla(ml) {
    if (typeof ml !== 'number' || ml < 100 || ml > 1000) return false;
    var d = oku(); d.bardakMl = Math.round(ml); return yaz(d);
  }
  function hatirlatmaAyarla(o) {
    var d = oku();
    if (!o || typeof o !== 'object') return false;
    if ('acik' in o) d.hatirlatma.acik = !!o.acik;
    if (typeof o.sikligiDk === 'number') d.hatirlatma.sikligiDk = o.sikligiDk;
    if (typeof o.bas === 'string') d.hatirlatma.bas = o.bas;
    if (typeof o.son === 'string') d.hatirlatma.son = o.son;
    return yaz(d);
  }

  /* Gün içinde kaç hatırlatma düşeceği — ayarın SONUCU görünsün diye. */
  function hatirlatmaSayisi() {
    var h = oku().hatirlatma;
    var dk = function (s) { var p = String(s).split(':'); return (+p[0]) * 60 + (+p[1] || 0); };
    var uzunluk = dk(h.son) - dk(h.bas);
    if (!(uzunluk > 0) || !(h.sikligiDk > 0)) return 0;
    return Math.floor(uzunluk / h.sikligiDk) + 1;
  }

  /* ==================================================================
     GEÇMİŞ · GRAFİK · SERİ
     ================================================================== */
  /* Son n günün dizisi (en eski önce). Kayıt olmayan gün ATLANMAZ,
     ml:0 olarak gelir — grafikte boş gün de bir bilgidir. */
  function aralik(n, bitisAh) {
    var d = oku(), son = bitisAh || bugunAnahtar(), out = [];
    for (var i = n - 1; i >= 0; i--) {
      var ah = gunEkle(son, -i);
      var k = d.gunler[ah] || { ml: 0 };
      var ek = ekHesapla(ah);
      var hedef = d.hedefMl + ek.ml;
      out.push({
        tarih: ah, ml: k.ml || 0, hedefMl: hedef, ekMl: ek.ml,
        oran: hedef ? Math.min(100, Math.round((k.ml || 0) / hedef * 100)) : 0,
        tamam: (k.ml || 0) >= hedef,
        kayitVar: !!d.gunler[ah]
      });
    }
    return out;
  }

  function ozetle(dizi) {
    var kayitli = dizi.filter(function (x) { return x.kayitVar; });
    var toplam = dizi.reduce(function (a, x) { return a + x.ml; }, 0);
    return {
      gunler: dizi,
      tutan: dizi.filter(function (x) { return x.tamam; }).length,
      kayitliGun: kayitli.length,
      toplamMl: toplam,
      /* Ortalama YALNIZ kayıt olan günlerden. Kayıtsız günü 0 sayıp
         ortalamaya katmak, ölçülmemişi "içmedi" saymak olurdu. */
      ortalamaMl: kayitli.length ? Math.round(toplam / kayitli.length) : 0
    };
  }

  function haftalik() { return ozetle(aralik(7)); }
  function aylik()    { return ozetle(aralik(30)); }

  /* SERİ — challenge motorunun ALIŞKANLIK hesabını kullanır.
     İkinci bir seri mantığı yazılmıyor: hedefi tutulan günlerin listesini
     `FIT_CHALLENGE.seriHesapla`ya veriyoruz, telafi kuralı dahil aynı
     davranışı alıyoruz. Motor yoksa seri gösterilmez (uydurulmaz). */
  function seri() {
    var C = kok.FIT_CHALLENGE;
    var d = oku();
    var tutan = Object.keys(d.gunler).filter(function (ah) {
      var ek = ekHesapla(ah);
      return (d.gunler[ah].ml || 0) >= (d.hedefMl + ek.ml);
    }).sort();
    if (!tutan.length) return { guncel: 0, enUzun: 0, telafiKalan: null, toplamGun: 0, motor: !!(C && C.seriHesapla) };
    if (!C || !C.seriHesapla) return { guncel: 0, enUzun: 0, telafiKalan: null, toplamGun: tutan.length, motor: false };
    var r = C.seriHesapla(tutan, tutan[0], bugunAnahtar());
    return {
      guncel: r.guncel, enUzun: r.enUzun,
      telafiKalan: Math.max(0, (C.TELAFI_HAKKI || 2) - r.telafi),
      toplamGun: tutan.length, motor: true
    };
  }

  /* Rozet motorunun okuduğu iki ölçü. */
  function olcu() {
    var s = seri();
    return { suGun: s.toplamGun, suSeri: s.enUzun };
  }

  /* ---------------- abonelik ---------------- */
  function dinle(fn) {
    kok.addEventListener('fit-su-degisti', fn);
    document.addEventListener('fit:state', fn);        /* antrenman → hedef değişir */
    kok.addEventListener('storage', function (e) {
      if (!e.key || e.key === KEY || e.key === 'dm_fit') fn();
    });
    fn();
  }

  kok.FIT_SU = {
    KEY: KEY,
    DK_BASINA_ML: DK_BASINA_ML, KCAL_BASINA_ML: KCAL_BASINA_ML,
    EK_TAVAN_ML: EK_TAVAN_ML,
    kullanilabilir: kullanilabilir,
    oku: oku, gun: gun, bugun: bugun,
    ekleMl: ekleMl, bardakEkle: bardakEkle, sifirla: sifirla,
    hedefAyarla: hedefAyarla, birimAyarla: birimAyarla, bardakBoyuAyarla: bardakBoyuAyarla,
    hatirlatmaAyarla: hatirlatmaAyarla, hatirlatmaSayisi: hatirlatmaSayisi,
    aralik: aralik, haftalik: haftalik, aylik: aylik,
    seri: seri, olcu: olcu, dinle: dinle,
    temizle: function () { try { kok.localStorage.removeItem(KEY); } catch (e) {} yaz(goc(null)); }
  };

  /* Antrenman kaydı düşünce hedef değişir → rozet ölçüsü de değişir. */
  document.addEventListener('fit:state', function () {
    if (kok.FIT_ROZET && kok.FIT_ROZET.degerlendir) kok.FIT_ROZET.degerlendir();
  });

})(window);
