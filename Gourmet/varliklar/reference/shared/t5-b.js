/* T5 · GOURMET — kulvar B sürücüsü. Yalnız ajan B yazar.
   ══════════════════════════════════════════════════════════════════════
   GÖRÜŞ BİLDİR · GÖNDERİM SONRASI DURUM (devir §5-1'in açık kalemi)

   ÖLÇÜLEN KUSUR (gerçek, doldurulmuş gönderimle · 1440×900):
     Gourmet'in formu `action="https://dadagourmet.com/geri-bildirim"`
     POST ediyor ve tarayıcı MAKETTEN ÇIKIP CANLI SİTEYE GİDİYOR.
     Ölçüm: son URL `https://dadagourmet.com/geri-bildirim` · gezinme 2.
     Tek zorunlu alan KVKK onay kutusu; işaretlenince form geçerli oluyor
     ve gönderim gerçekten kalkıyor. Yani "Gönder" ölü bir düğme değil —
     maketin dışına açılan bir kapı.

   DONÖR (Fit ve Diet · ikisi de birebir aynı markup'ı taşıyor):
     <div class="fb-success" id="fbSuccess" hidden>
       <span class="ok"><i class="fa-solid fa-flask"></i></span>
       <h4>Görüşün gönderilmedi — burası maket</h4>
       <p>Yazdıkların hiçbir yere iletilmedi ve kaydedilmedi. …</p>
       <button class="btn btn-ghost fb-again" type="button" id="fbAgain">Forma dön</button>
     </div>
   Metin UYDURULMADI: iki donörden birebir alındı. Metnin kendisi bir
   doğruluk beyanı — "görüşün bize ulaştı" demek YALAN olurdu, hiçbir yere
   gitmiyor (kayıtlı ders: yalan düğme).

   🔴 PANEL NEDEN MARKUP'A YAZILMIYOR — ÖLÇÜLDÜ (4 kip, b-go-fbsuccess-tuzak.mjs):
     Maketin paketi (gourmet-BB1JjHfF.js) şu dalı taşıyor:
         i && (a && (a.hidden = !0), c())
         i = #fbSuccess · a = #fbForm · c() = modalı AÇ
     Paket `#fbSuccess`i "gönderim sonrası sunucu durumu" sanıyor. Panel
     ayrıştırma anında DOM'daysa modal SAYFA AÇILIŞINDA açılıyor ve form
     gizleniyor (kip B: modalGorunur true · formHidden true).
     Paneli `hidden` yazmak DA yetmiyor (kip C): dal elemanın VARLIĞINA
     bakıyor, modal yine açılıyor ve sürücü onu geri kapatınca GÖRÜNÜR bir
     yanıp sönme kalıyor.
     → Uygulanan kip D: panel markup'ta HİÇ YOK, gönderim anında ÜRETİLİYOR.
       Paketin dalı hiç tetiklenmiyor; ne açılışta modal, ne yanıp sönme.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* İDEMPOTENS · betik iki kez yüklenirse dinleyici ÇİFTLENMEZ.
     Bayrak DOM'da değil `window`da tutuluyor: kayıtlı ders "render DOM'unda
     'bağlandı' bayrağı" — DOM'a yazılan bir işaret kaydedilmiş kopyada
     donar ve betik "zaten kuruldum" sanıp hiç bağlanmaz. `window` her
     yüklemede temiz doğar, o tuzak kapalı. */
  if (window.__t5bGorus) return;
  window.__t5bGorus = true;

  var PANEL =
    '<div class="fb-success" id="fbSuccess" hidden>' +
      '<span class="ok"><i class="fa-solid fa-flask" aria-hidden="true"></i></span>' +
      '<h4>Görüşün gönderilmedi — burası maket</h4>' +
      '<p>Yazdıkların hiçbir yere iletilmedi ve kaydedilmedi. Bu ekran, canlı ' +
      'sürümde gönderimden sonra göreceğin adımın yerini tutuyor.</p>' +
      '<button class="btn btn-ghost fb-again" type="button" id="fbAgain">Forma dön</button>' +
    '</div>';

  function kur() {
    var f = document.getElementById('fbForm');
    var md = document.getElementById('fbModal');
    if (!f || !md) return;                       /* özne yok — sessizce çık */

    function panelSok() {
      var s = document.getElementById('fbSuccess');
      if (s && s.parentNode) s.parentNode.removeChild(s);
      f.hidden = false;
    }

    function panelAc() {
      if (document.getElementById('fbSuccess')) return;   /* çift gönderim */
      f.hidden = true;
      var kap = md.querySelector('.fb-body') || md;
      kap.insertAdjacentHTML('beforeend', PANEL);
      var s = document.getElementById('fbSuccess');
      if (!s) return;
      s.hidden = false;
      /* Odak panelin KENDİ düğmesine veriliyor: donörün markup'ına
         `tabindex`/`role`/`aria-live` EKLENMİYOR (donörde yok), ama panel
         dinamik doğduğu için odak taşınmazsa ekran okuyucu hiç haber
         alamaz. Doğal odaklanabilir eleman kullanmak bu ikisini uzlaştırır. */
      var geri = document.getElementById('fbAgain');
      if (geri) {
        geri.addEventListener('click', panelSok);
        try { geri.focus({ preventScroll: true }); } catch (e) { geri.focus(); }
      }
    }

    f.addEventListener('submit', function (e) {
      /* 🔴 GEZİNMEYİ DURDUR. Maket formu canlı siteye POST ediyor; ölçüldü.
         Panelin metni de zaten "hiçbir yere iletilmedi" diyor — gönderimi
         gerçekten durdurmak o beyanı DOĞRU kılıyor. */
      e.preventDefault();
      panelAc();
    });

    /* Sekmeye yeniden basıldığında ya da modal kapandığında forma dönülür;
       aksi hâlde panel bir sonraki açılışta karşılıyor olurdu.
       `stopPropagation` YOK: paketin kendi dinleyicisi de koşmalı
       (kayıtlı ders: stopPropagation delegasyonu öldürür). */
    var tab = document.getElementById('fbTab') || document.querySelector('.feedback-tab, .kenar-sekmesi');
    if (tab) tab.addEventListener('click', panelSok);
    var kapat = document.getElementById('fbClose');
    if (kapat) kapat.addEventListener('click', panelSok);
    var ortu = document.getElementById('fbOverlay');
    if (ortu) ortu.addEventListener('click', panelSok);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur, { once: true });
  else kur();
})();
