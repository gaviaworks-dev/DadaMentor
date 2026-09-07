/* =====================================================================
   PARTİ 5 · AJAN P · `g-toplulugum.html#paylasim` — ARAMA SÜRÜCÜSÜ
   ---------------------------------------------------------------------
   Madde 6'nın davranış ayağı. Kutunun kendisi `.ie-arama` (dm-p4.css);
   burada YALNIZ süzme, temizleme, boş hâl ve sayaç var.

   🔴 "MARKUP TAŞINDI, DAVRANIŞ KALMADI" — kutuyu basmak yetmez; süzmeyen
      arama kutusu YALAN YÜZEYDİR. Kapı bunu TIKLAYARAK ölçüyor
      (`p-kapi.mjs` ölçüt 7): terim yaz → görünen kart azalsın,
      olmayan terim → boş hâl, temizle → geri gelsin.

   🔴 "RENDER DOM'UNDA BAĞLANDI BAYRAĞI" — kurulum işareti DOM'a
      YAZILMAZ. Enjektör HTML'i diske yazıyor; DOM'a basılmış bir
      `data-kuruldu` kopyaya donar ve ikinci yüklemede "zaten kuruldum"
      der, dinleyici hiç bağlanmaz. İşaret modül kapsamında (`kuruldu`)
      ve bağ DELEGASYONLA `document`ta.

   🔴 `stopPropagation` DELEGASYONU ÖLDÜRÜR — donörün `.r-card` kalıbında
      `<form onclick="event.stopPropagation()">` var; orada gerekli
      çünkü kartın TAMAMI bir bağ. Burada kart bağ değil ve o öznitelik
      `document`taki delegasyonu keserdi: form KOPYALANDI, ÖZNİTELİK
      KOPYALANMADI. Kaydet düğmesinin sürücüsü de burada (aşağıda).

   REVİZE (2026-09-07): iki iş eklendi —
     · `.r-save` sınıf takası (kaynağın kendi sözleşmesi)
     · süzgeç açıkken sayfalamayı gizleme
   ===================================================================== */
(function () {
  'use strict';

  var kuruldu = false;

  /* Türkçe duyarlı normalleştirme — "İ/ı" tuzağı `toLocaleLowerCase`
     olmadan aramayı sessizce boşa düşürüyor ("İçecek" ≠ "içecek"). */
  function norm(s) {
    return String(s == null ? '' : s)
      .toLocaleLowerCase('tr')
      .replace(/[’'`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function kartlar(aile) {
    var izgara = aile.querySelector('.rozet-izgara');
    return izgara ? Array.prototype.slice.call(izgara.children) : [];
  }

  /* Sayfalama "128 tariften 1–6 arası" der; süzgeç açıkken bu cümle
     YANLIŞ olur (ekranda 1 kart durabilir). Terim varken gizlenir.
     🔴 `.pagi{display:flex}` yazar kuralı `[hidden]`ı yener; gizleme
        bildirimi `dm-p5-p.css`te (`.rozet-ailesi .pagi[hidden]`). */
  function pagiTazele(aile, terimVar) {
    var pagi = aile.querySelector('[data-p5p-pagi]');
    if (!pagi) return;
    if (terimVar) pagi.setAttribute('hidden', '');
    else pagi.removeAttribute('hidden');
  }

  function gizle(el, gizliMi) {
    /* iki argümanlı — `toggle(ad, undefined)` TAKAS eder ve her çağrıda
       durumu tersine çevirir (bu depoda ölçülmüş kusur). */
    el.classList.toggle('p5p-gizli', !!gizliMi);
    if (gizliMi) el.setAttribute('hidden', '');
    else el.removeAttribute('hidden');
  }

  function suz(kutu) {
    var aile = kutu.closest('.rozet-ailesi');
    if (!aile) return;
    var girdi = kutu.querySelector('input[type=search]');
    if (!girdi) return;

    var terim = norm(girdi.value);
    var hepsi = kartlar(aile);
    var gorunen = 0;

    for (var i = 0; i < hepsi.length; i++) {
      var k = hepsi[i];
      var esles = !terim || norm(k.textContent).indexOf(terim) > -1;
      gizle(k, !esles);
      if (esles) gorunen++;
    }

    kutu.classList.toggle('dolu', girdi.value.length > 0);

    var sayac = aile.querySelector('[data-p5p-sayac]');
    if (sayac) {
      if (terim) {
        sayac.textContent = gorunen + ' / ' + hepsi.length + ' kart';
        sayac.removeAttribute('hidden');
      } else {
        sayac.textContent = '';
        sayac.setAttribute('hidden', '');
      }
    }

    pagiTazele(aile, !!terim);

    var bos = aile.querySelector('[data-p5p-bos]');
    if (bos) {
      var gosterBos = !!terim && gorunen === 0;
      var yuva = bos.querySelector('[data-p5p-terim]');
      if (yuva) yuva.textContent = girdi.value.trim();
      var toplam = bos.querySelector('[data-p5p-toplam]');
      if (toplam) toplam.textContent = String(hepsi.length);
      if (gosterBos) bos.removeAttribute('hidden');
      else bos.setAttribute('hidden', '');
    }
  }

  function temizle(kutu, odakla) {
    var girdi = kutu.querySelector('input[type=search]');
    if (!girdi) return;
    girdi.value = '';
    suz(kutu);
    if (odakla) girdi.focus();
  }

  function kur() {
    if (kuruldu) return;
    kuruldu = true;

    document.addEventListener('input', function (e) {
      var girdi = e.target.closest && e.target.closest('[data-p5p-arama] input[type=search]');
      if (!girdi) return;
      suz(girdi.closest('[data-p5p-arama]'));
    });

    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var sil = t.closest('[data-p5p-arama] .ie-arama-sil');
      if (sil) { temizle(sil.closest('[data-p5p-arama]'), true); return; }
      var dug = t.closest('[data-p5p-temizle]');
      if (dug) {
        var aile = dug.closest('.rozet-ailesi');
        var kutu = aile && aile.querySelector('[data-p5p-arama]');
        if (kutu) temizle(kutu, true);
        return;
      }

      /* KAYDET — SÜRÜCÜ İCAT EDİLMEDİ. Kaynağın kendi sözleşmesi
         (`portal-Co4op6F_.js` · `.r-save:not([data-save-toggle])`):
         `.saved` sınıfı takas edilir, kalp `fa-regular` ↔ `fa-solid`
         çiftini değiştirir. `dm-p3-a.js` aynı sözleşmeyi
         g-mutfak-defterim'de kurmuştu; kural `tarif-liste.css`te
         (`.r-save.saved`) zaten yürürlükte.
         🔴 `toggle(ad)` TEK argümanla çağrılıyor ve dönüşü okunuyor —
            `toggle(ad, undefined)` her çağrıda takas edip aria'yı
            durumdan koparıyordu (bu depoda ölçülmüş kusur). */
      var kaydet = t.closest('.r-card.p5p-tarif .r-save');
      if (kaydet) {
        e.preventDefault();
        var acik = kaydet.classList.toggle('saved');
        var kalp = kaydet.querySelector('i');
        if (kalp) {
          kalp.classList.toggle('fa-solid', acik);
          kalp.classList.toggle('fa-regular', !acik);
        }
        kaydet.setAttribute('aria-pressed', acik ? 'true' : 'false');
        kaydet.setAttribute('aria-label', acik ? 'Kaydedilenlerden çıkar' : 'Kaydet');
      }
    });

    /* Esc — kanonun arama kutularındaki alışkanlık; kutu doluysa temizler. */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var girdi = e.target.closest && e.target.closest('[data-p5p-arama] input[type=search]');
      if (girdi && girdi.value) { e.preventDefault(); temizle(girdi.closest('[data-p5p-arama]'), true); }
    });

    /* Sekme açılışında (ya da tarayıcı girdiyi geri yüklediğinde) durum
       tutarlı başlasın — boş kutuda hiçbir kart gizli kalmaz. */
    var kutular = document.querySelectorAll('[data-p5p-arama]');
    for (var i = 0; i < kutular.length; i++) suz(kutular[i]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kur);
  else kur();
})();
