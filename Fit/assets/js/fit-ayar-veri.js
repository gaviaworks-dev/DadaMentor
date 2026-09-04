/* =====================================================================
   FIT_AYAR — K13 PARA PARAMETRELERİNİN TEK KAYNAĞI
   ---------------------------------------------------------------------
   ÖLÇÜLMÜŞ KUSUR (docs/fit-panel-yeterlilik.md §"Koda gömülü sabit"):
   komisyon oranı ve alt sınır `admin-odemeler-v1.html`, `admin-raporlar-v1.html`
   ve `admin-ayarlar-v1.html`'de ÜÇ bağımsız kopya olarak yaşıyordu; hiçbiri
   diğerini okumuyordu, `admin-ayarlar-v1.html` da hiçbir yere yazmıyordu
   (0 `localStorage.setItem`) — Ayarlar'a girilen sayı kimseye ulaşmıyordu.

   Bu modül `fit-rozet.js` / `fit-su.js`in izlediği kalıptır: `oku()` /
   `yaz()` çifti + değişiklikte `CustomEvent`. Üç ekran (`admin-ayarlar-v1`,
   `admin-odemeler-v1`, `admin-raporlar-v1`) artık BURADAN okur; kendi
   kopyalarını taşımaz.

   🔴 VARSAYILAN DEĞERLER CLAUDE.md K13'TEN BİREBİR ALINDI — uydurulmadı:
   "Hizmet komisyonu %10 · ödeme ay sonu toplu · alt sınır 1000 TL ·
   fatura eşiği 10.000 TL". `localStorage`da kayıt yoksa (ilk açılış ya da
   `removeItem`) panel bu dört sayıya döner.

   ⚠ YAZMA GERÇEK. Panel geneli maket olsa da Beyar'ın bu kalemdeki kararı
   açık: Ayarlar formunun "Para & Komisyon" sekmesi gerçekten `localStorage`a
   yazar. Değer TARAYICIDA saklanır, sunucuya gitmez — ekranlardaki şerit
   bunu söyler, "kaydedildi" ile "sunucuya gitti"yi karıştırmaz.

   DEPOLAMA
     localStorage['dm_fit_ayar_v1'] = {
       surum:1,
       degerler:{ komisyonYuzde, abonelikKomisyonYuzde, odemeGunu,
                  altSinirKurus, faturaEsigiKurus, iade },
       guncelleme:'ISO'
     }
     (kabuğun `dm_fit_*` anahtar önekiyle aynı aile)

   Para kuruş TAMSAYISI olarak tutulur, float değil (fit-fatura.js deseni) —
   `altSinirKurus` ve `faturaEsigiKurus` kuruştur, alan TL gösterir.
   ===================================================================== */
(function (kok) {
  'use strict';

  var ANAHTAR = 'dm_fit_ayar_v1';
  var SURUM = 1;

  /* K13 (+ K5, K6) — KARARLAR'daki kalemler, BİREBİR. */
  var VARSAYILAN = {
    komisyonYuzde: 10,            /* K13 · hizmet komisyonu, tüm üreticiler için aynı (K5) */
    abonelikKomisyonYuzde: '',    /* K6 · ticari karar, KARARLAR'da yok — bilerek boş/tanımsız */
    odemeGunu: 'ay-sonu',         /* K13 · ödeme ay sonu toplu */
    altSinirKurus: 100000,        /* K13 · alt sınır 1.000,00 ₺ */
    faturaEsigiKurus: 1000000,    /* K13 · fatura eşiği 10.000,00 ₺ */
    iade: 'komisyon-kalir'        /* K5 · iade olursa komisyon geri gitmez */
  };

  /* `odemeGunu` enum'unun GÖRÜNEN adı — TEK sözlük. `admin-odemeler-v1` ve
     `admin-hizmetler-v1` bu enum'u ayrı ayrı kendi metnine çeviriyordu
     ('ay-sonu/hafta/anlik' ↔ 'Ay sonu · toplu' serbest metin) — ikisi de
     Ayarlar'ın enum'uyla (`ay-sonu/ayin-15/haftalik`) uyuşmuyordu. Artık
     üçü de BURADAN okur. */
  var ODEME_GUNU_AD = {
    'ay-sonu':  'Ay sonu — toplu',
    'ayin-15':  'Her ayın 15’i',
    'haftalik': 'Haftalık — cuma'
  };
  function odemeGunuAd(kod) { return ODEME_GUNU_AD[kod] || kod; }

  var ALANLAR = Object.keys(VARSAYILAN);

  function varsayilanKopya() {
    var v = {};
    ALANLAR.forEach(function (k) { v[k] = VARSAYILAN[k]; });
    return v;
  }

  function oku() {
    var d;
    try { d = JSON.parse(kok.localStorage.getItem(ANAHTAR) || 'null'); }
    catch (e) { d = null; }
    var v = varsayilanKopya();
    if (d && d.degerler && typeof d.degerler === 'object') {
      ALANLAR.forEach(function (k) {
        if (d.degerler[k] !== undefined && d.degerler[k] !== null) v[k] = d.degerler[k];
      });
    }
    return v;
  }

  /* `degerler` kısmi olabilir — verilmeyen alan ÖNCEKİ (ya da varsayılan)
     değerinde kalır, sıfırlanmaz. */
  function yaz(degerler) {
    if (!degerler || typeof degerler !== 'object') return false;
    var v = oku();
    ALANLAR.forEach(function (k) {
      if (degerler[k] !== undefined) v[k] = degerler[k];
    });
    var kayit = { surum: SURUM, degerler: v, guncelleme: new Date().toISOString() };
    try { kok.localStorage.setItem(ANAHTAR, JSON.stringify(kayit)); }
    catch (e) { return false; }
    kok.dispatchEvent(new CustomEvent('fit-ayar-degisti', { detail: v }));
    return true;
  }

  kok.FIT_AYAR = {
    VARSAYILAN: VARSAYILAN, oku: oku, yaz: yaz,
    ODEME_GUNU_AD: ODEME_GUNU_AD, odemeGunuAd: odemeGunuAd
  };
})(window);
