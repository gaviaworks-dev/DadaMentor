/* T5D · GOURMET — kulvar A sürücüsü. Yalnız ajan A yazar.
   ═══ MADDE 4 · fatura penceresi AÇILIYOR AMA KAPANMIYOR ═════════════
   ÖLÇÜLDÜ (rapor/gourmet-t5d/a-m4-once.json · dört kapatma ucu):
       X (#ftClose)      → KAPANIYOR   (kabuğun genel `.fb-close` kapatıcısı)
       Escape            → KAPANIYOR   (kabuğun genel keydown'ı)
       Vazgeç (#ftVazgec)→ KAPANMIYOR  ← sınıf "fb-modal show" kalıyor
       dışına tıklama    → KAPANMIYOR
   KÖK (ölçüldü, rapor/gourmet-t5d/a-m4-surucu.json): pencerenin kendi
   sürücüsü HİÇ BAĞLI DEĞİL. `FIT_FATURA_FORM.kur({yuva:'ftFormYuva'})`
   bir montaj yuvası arıyor; render DOM kopyasında pencere zaten basılı
   olduğu için `#ftFormYuva` yok → `kur()` null dönüyor → `FIT_MODAL`
   hiç kurulmuyor: dışarı tıklama, Vazgeç, odak tuzağı ve odak dönüşü
   yok. `document.getElementById('ftFormYuva')` = null (ÖLÇÜLDÜ).
   🔴 DONÖR DE AYNI KUSURU TAŞIYOR — VARSAYMADIM, ÖLÇTÜM: Fit'te de
   `yuvaVar:false`, Vazgeç kapatmıyor, dışarı tıklama kapatmıyor, açılış
   odağı BODY'de kalıyor. Yani bu kalem donörden KOPYALANMIŞ bir kusur;
   ölçüt Beyar'ın maddesinden geliyor, donörden değil.
   ÇÖZÜM: yuvayı geri kurup 109 KB'lık markup'ı yeniden ÜRETTİRMEDİM —
   üretim ikinci bir `#ftModal` basma ve sayfadaki metinleri donörünkiyle
   ezme riski taşıyor. Onun yerine kanonun kendi modal bileşeni
   (`FIT_MODAL`) mevcut markup'a kuruluyor: dışarı tıklama · perde ·
   kapat düğmesi · Escape · Tab tuzağı · odak dönüşü hepsi bileşenden
   geliyor, elle modal mantığı yazılmıyor.                              */
(function () {
  'use strict';

  function kur() {
    var kap = document.getElementById('ftModal');
    if (!kap) return;                                   /* bu sayfa değil */
    if (kap.getAttribute('data-t5da-modal') === '1') return;   /* iki kez kurma */
    if (!window.FIT_MODAL || !FIT_MODAL.kur) return;

    var h = FIT_MODAL.kur({
      kap: '#ftModal', panel: '.fb-panel', ortu: '#ftOverlay', kapat: '#ftClose'
    });
    if (!h) return;
    kap.setAttribute('data-t5da-modal', '1');

    /* Açılış da bileşenden geçmeli: kabuğun genel `[aria-haspopup="dialog"]`
       kapısı `.show` sınıfını DOĞRUDAN ekliyor ve bileşen "açığım"
       demiyordu; o hâlde `h.kapat()` hiçbir şey yapmazdı. */
    var tetik = document.getElementById('odFtBilgi');
    if (tetik) tetik.addEventListener('click', function () { h.ac(tetik); });

    /* Vazgeç — donörde de bağsız kalan uç. */
    var vazgec = document.getElementById('ftVazgec');
    if (vazgec) vazgec.addEventListener('click', function () { h.kapat(); });

    /* Kabuğun genel kapatıcısı (`.fb-close` tıklaması · Escape) sınıfı
       bileşene HABER VERMEDEN silebiliyor. O durumda bileşen "hâlâ
       açığım" sanır ve `ac()` erken döner → pencere BİR DAHA AÇILMAZ.
       Sınıfı izle, düştüyse bileşeni eşitle. */
    new MutationObserver(function () {
      if (h.acikMi() && !kap.classList.contains('show')) h.kapat();
    }).observe(kap, { attributes: true, attributeFilter: ['class'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();
})();
