/* GASTRO MARKA EKİ · kulvar b — kit'e (kanon/admin-kit.js) TAŞINACAK.
   ŞERH: Bu dosya Gastro'ya özel davranış içindir. Kit SALT OKUMA olduğu için
   burada yaşıyor; her kural docs/admin-kit-oneri-gastro-2-b.md'de "KÖ-B<n>"
   olarak kayıtlıdır. Kit'e taşındığında bu dosyadaki karşılığı SİLİNİR.
   Yükleme sırası: kanon/admin-kit.js'ten SONRA. */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════════
     KÖ-B1 · SİSTEM ÖNERİSİ — ilişkili kayıt, L7 mantığıyla
     ───────────────────────────────────────────────────────────────────
     L7 "hesaplanan alan salt okunur, KAYNAĞI YAZILI" der. Burada
     hesaplanan şey bir sayı değil bir LİSTE: bu kayda en yakın öteki
     kayıtlar. Kural ölçülebilir olmalı, yoksa "sistem öneriyor" cümlesi
     bir vaat olur ve §11'in ölü butonunun liste hâline gelir:

         aynı kategori          +2
         her ortak etiket       +1
         puan 0 olan            listeye HİÇ girmez

     Kaynak UYDURULMAZ: bu ekranın kendi `[data-kayitlar]` kütüğü. Kayıt
     kütüğünde etiket taşıyan kayıt yoksa öneri yalnız kategoriden doğar
     ve yüzey bunu YAZAR — "neye göre önerdiğini söylemeyen öneri, bir
     öneri değil bir iddiadır".
     ⚠ Öneri kaydı DEĞİŞTİRMEZ. Seçime taşımak kullanıcının tek tıkıdır;
       sessizce eklemek yöneticinin yazdığı listeyi ezerdi.
     ═══════════════════════════════════════════════════════════════════ */

  var ONERI_UST = 5;

  function kayitlar() {
    var k = document.querySelector('[data-kayitlar]');
    if (!k) return null;
    try { return JSON.parse(k.textContent); } catch (h) { return null; }
  }

  function dizi(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v.map(function (x) { return String(x).trim(); }).filter(Boolean);
    return String(v).split(',').map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function puanla(kutuk, anahtar) {
    var ben = kutuk[anahtar];
    var benEtiket = dizi(ben.etiketler);
    var cikti = [];
    Object.keys(kutuk).forEach(function (a) {
      if (a === anahtar) return;
      var o = kutuk[a], puan = 0, neden = [];
      if (ben.kategori && o.kategori && ben.kategori === o.kategori) { puan += 2; neden.push('aynı kategori'); }
      var ortak = dizi(o.etiketler).filter(function (e) { return benEtiket.indexOf(e) !== -1; });
      if (ortak.length) { puan += ortak.length; neden.push(ortak.length + ' ortak etiket (' + ortak.join(' · ') + ')'); }
      if (puan > 0) cikti.push({ anahtar: a, ad: o.ad || o.terim || a, puan: puan, neden: neden.join(' · ') });
    });
    cikti.sort(function (x, y) { return y.puan - x.puan || x.ad.localeCompare(y.ad, 'tr'); });
    return cikti;
  }

  function not(kap, metin) {
    var d = document.createElement('p');
    d.className = 'oneri-bos';
    d.textContent = metin;
    kap.appendChild(d);
  }

  function oneriYaz() {
    var kap = document.getElementById('tfOneri');
    if (!kap) return;
    kap.innerHTML = '';
    var kutuk = kayitlar();
    var anahtar = new URLSearchParams(location.search).get('id');
    /* ⚠ ÖZNE YOKSA SESSİZ KALMAZ: "öneri yok" ile "kayıt açılmadı" aynı
       görünmemeli (devir belgesi §8'in dersi kapıya değil YÜZEYE de bakar). */
    if (!kutuk) { not(kap, 'Kayıt kütüğü bu ekranda bildirilmemiş — öneri hesaplanamıyor.'); return; }
    if (!anahtar || !kutuk[anahtar]) {
      not(kap, 'Öneri, açık bir kaydın kategorisi ve etiketlerinden hesaplanır. Yeni kayıtta kaydettikten sonra doğar.');
      return;
    }
    var liste = puanla(kutuk, anahtar);
    var toplam = Object.keys(kutuk).length - 1;
    if (!liste.length) {
      not(kap, 'Bu kayıtla kategori ya da etiket paylaşan başka püf noktası yok — ' + toplam + ' kayıtta arandı.');
      return;
    }
    liste.slice(0, ONERI_UST).forEach(function (o) {
      var s = document.createElement('div');
      s.className = 'oneri-satiri';
      var m = document.createElement('div');
      m.className = 'oneri-metin';
      var b = document.createElement('b'); b.textContent = o.ad;
      var k = document.createElement('small'); k.textContent = o.neden + ' · puan ' + o.puan;
      m.appendChild(b); m.appendChild(k);
      var d = document.createElement('button');
      d.type = 'button'; d.className = 'dugme hayalet oneri-ekle';
      d.setAttribute('data-b-oneri-ekle', o.ad);
      d.textContent = 'Seçime ekle';
      s.appendChild(m); s.appendChild(d);
      kap.appendChild(s);
    });
    var alt = document.createElement('p');
    alt.className = 'oneri-kaynak';
    alt.textContent = liste.length + ' aday ' + toplam + ' kayıtta bulundu · ilk ' + Math.min(ONERI_UST, liste.length) + ' gösteriliyor.';
    kap.appendChild(alt);
  }

  /* ── Öneriyi seçime taşı ─────────────────────────────────────────
     Çip kitin biçiminde kurulur (`.cip.aktif` + `data-deger` + `.cip-sil`)
     ve gizli alan yeniden yazılır; silme kitin kendi delege dinleyicisine
     düşer. İkinci bir çip stili AÇILMADI (kit sözleşmesi §4). */
  function cipEkle(kapId, deger) {
    var kap = document.getElementById(kapId);
    if (!kap) return false;
    var cipler = kap.querySelector('.cipler');
    if (!cipler) { cipler = document.createElement('div'); cipler.className = 'cipler'; kap.appendChild(cipler); }
    if (cipler.querySelector('[data-deger="' + deger.replace(/"/g, '\\"') + '"]')) return false;
    var c = document.createElement('span');
    c.className = 'cip aktif';
    c.setAttribute('data-deger', deger);
    c.textContent = deger;
    var x = document.createElement('button');
    x.type = 'button'; x.className = 'cip-sil';
    x.setAttribute('aria-label', deger + ' seçimini kaldır');
    x.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    c.appendChild(x);
    cipler.appendChild(c);
    var gizli = kap.querySelector('input[data-cs]');
    if (gizli) {
      gizli.value = [].map.call(cipler.querySelectorAll('[data-deger]'), function (e) {
        return e.getAttribute('data-deger');
      }).join(',');
    }
    return true;
  }

  document.addEventListener('click', function (e) {
    var d = e.target.closest && e.target.closest('[data-b-oneri-ekle]');
    if (!d) return;
    e.preventDefault();
    var ad = d.getAttribute('data-b-oneri-ekle');
    var oldu = cipEkle('tfIlgili', ad);
    if (window.DM_TOAST) {
      window.DM_TOAST(oldu ? '“' + ad + '” elle seçilenlere eklendi.' : '“' + ad + '” zaten seçili.',
                      oldu ? 'basarili' : 'uyari');
    }
    if (oldu) { d.disabled = true; d.textContent = 'Eklendi'; }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', oneriYaz);
  else oneriYaz();
  window.GEKB_ONERI_YAZ = oneriYaz;     /* ölçüm kapısı yeniden çağırabilsin */
})();
