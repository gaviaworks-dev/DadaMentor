/* GASTRO MARKA EKİ · kulvar c — kit'e (kanon/admin-kit.js) TAŞINACAK.
   ŞERH: Bu dosya Gastro'ya özel davranış içindir. Kit SALT OKUMA olduğu için
   burada yaşıyor; her kural docs/admin-kit-oneri-gastro-2-c.md'de "KÖ-C<n>"
   olarak kayıtlıdır. Kit'e taşındığında bu dosyadaki karşılığı SİLİNİR.
   Yükleme sırası: kanon/admin-kit.js'ten SONRA.

   ⚠ Kitin dağıtıcısı `document` üzerinde KABARMA evresinde dinliyor ve o
     dinleyici bu dosyadan ÖNCE bağlandı. Bir eylemi kitten önce ele almanın
     tek yolu YAKALAMA evresidir (`capture:true`): yakalama, hedefe inerken
     document'te İLK çalışır. `stopPropagation()` orada çağrılınca olay
     kabarma evresine hiç ulaşmaz — kit o tıklamayı görmez. */
(function () {
  'use strict';

  var T   = function (m) { (window.DM_TOAST || function () {})(m); };
  var KUR = function (k) { if (window.DM_L_KUR) window.DM_L_KUR(k); };

  /* ═══════════════════════════════════════════════════════════════════
     KÖ-C1 · İÇ İÇE TEKRARLAYICI — "madde ekle" KENDİ listesine ekler
     ───────────────────────────────────────────────────────────────────
     🔴 ÖLÇÜLDÜ (tıklanarak, `scripts/olcum/p2/c-01-madde-ekle.mjs`):
        admin-mutfaga-giris-form'da bir bölümün içindeki "Madde ekle"
        düğmesi BÖLÜM ekliyordu — bölüm 1 → 2, kendi madde listesi 0 → 0.

     KÖK, kitin `satir-ekle` dalında:
         var yakin = d.closest('.form-bolum') …
         yakin.querySelector('.adim-liste, …')
     `querySelector` BELGE SIRASINDA İLK eşleşeni verir. İç düğmenin en
     yakın `.form-bolum`u DIŞ bölümdür ve o kabın ilk `.adim-liste`si
     dış listedir (`#rfBolumler`). Yani kanca doğru soruyu YANLIŞ KAPTA
     soruyordu — K24/K29'un "kural doğru, kanca kaçmış" deseninin
     tekrarlayıcı karşılığı; burada kaçan şey ad değil KAPSAM.

     Kural: iç liste kendini BİLDİRİR (`data-ic-liste`) ve düğmesi de
     (`data-ic-ekle`). Bildirim olmadan kit uydurmaz, biz de uydurmayız.
     ⚠ Dış listeye dokunulmaz: kitin kendi `satir-ekle`si orada doğru
       çalışıyor ve ölçüldü (bölüm N → N+1).
     ═══════════════════════════════════════════════════════════════════ */

  function icListe(dugme) {
    var kap = dugme.closest('[data-ic-kap]') || dugme.closest('.alan') || dugme.parentNode;
    return kap ? kap.querySelector('[data-ic-liste]') : null;
  }
  function satirlar(liste) {
    return [].filter.call(liste.children, function (n) { return n.nodeType === 1; });
  }

  /* 🔴 KLON İÇ LİSTEYİ DE TAŞIR. Kitin `satir-ekle`si dış bölümü
     klonlarken içindeki BÜTÜN madde satırları da geliyor (değerleri
     boşalmış olarak). Yeni bir bölüm bir madde satırıyla doğmalı; kitin
     bunun için BİLDİRİLMİŞ bir kancası var: `data-klon-sil`. */
  function klonIsaretle(liste) {
    satirlar(liste).forEach(function (s, i) {
      if (i === 0) s.removeAttribute('data-klon-sil');
      else s.setAttribute('data-klon-sil', '');
    });
  }

  function icSatirEkle(dugme) {
    var liste = icListe(dugme);
    if (!liste) { T('Bu düğmenin listesi markup\'ta bildirilmemiş (data-ic-liste).'); return; }
    var mevcut = satirlar(liste);
    var son = mevcut[mevcut.length - 1];
    if (!son) { T('Kalıp satırı yok — liste boş bırakılamaz.'); return; }

    var yeni = son.cloneNode(true);
    /* Değer sıfırlaması kitin kendi kuralıyla aynı: metin ve seçim gider,
       gizli alanlar (sıra) ve kaplar durur. */
    yeni.querySelectorAll('input, textarea').forEach(function (x) {
      if (x.type === 'hidden') return;
      if (x.type === 'checkbox' || x.type === 'radio') x.checked = false;
      else x.value = '';
    });
    yeni.querySelectorAll('select').forEach(function (x) { x.selectedIndex = 0; });
    yeni.querySelectorAll('.alan-hata').forEach(function (x) { x.classList.remove('goster'); });
    yeni.classList.add('yeni');
    liste.appendChild(yeni);

    if (window.DM_TEKRAR_KUR) window.DM_TEKRAR_KUR(liste);   /* numara · tutamak · sil */
    KUR(yeni);
    klonIsaretle(liste);
    icSayacTazele(liste);
    var ilk = yeni.querySelector('input:not([type="hidden"]), select, textarea');
    if (ilk) ilk.focus();
    T('Yeni madde eklendi.');
  }

  /* Sayaç iç listenin KENDİ etiketindedir; kitin `listeTazele`si dış
     bölümün sayacını arar ve iç listeninkini bulamaz (aynı kapsam
     kusuru). Bildirim: `data-ic-sayac` iç listenin üstünde. */
  function icSayacTazele(liste) {
    var kap = liste.closest('[data-ic-kap]') || liste.parentNode;
    var s = kap && kap.querySelector('[data-ic-sayac]');
    if (!s) return;
    var birim = (s.textContent || '').replace(/^\s*\d+\s*/, '').trim();
    s.textContent = satirlar(liste).length + (birim ? ' ' + birim : '');
  }

  document.addEventListener('click', function (e) {
    var d = e.target.closest && e.target.closest('[data-ic-ekle]');
    if (!d) return;
    e.preventDefault();
    e.stopPropagation();           /* kit bu tıklamayı GÖRMEZ */
    icSatirEkle(d);
  }, true);

  /* Silme kitin `.tekrar-sil`i ile olur; sonrasında iç sayaç ve klon
     işareti tazelenmeli. Kit sildikten SONRA kabarma evresinde bilgi
     yok — listeyi gözleyerek değil, aynı düğmeye kabarma evresinde
     bağlanarak tazeliyoruz (kit önce koşar, biz sonra). */
  document.addEventListener('click', function (e) {
    var d = e.target.closest && e.target.closest('.tekrar-sil');
    if (!d) return;
    var liste = d.closest('[data-ic-liste]');
    if (!liste) return;
    setTimeout(function () { klonIsaretle(liste); icSayacTazele(liste); }, 0);
  });

  /* ═══════════════════════════════════════════════════════════════════
     KÖ-C2 · SÜRE GİRDİSİ — `ss:dd` maskesi ve doğrulaması
     ───────────────────────────────────────────────────────────────────
     🔴 ÖLÇÜLDÜ (devir §9-9): `admin-video-form`un "Süre" alanı
        `type="number" min="1" max="52"` idi; listedeki gerçek değer
        `12:48`. Yani alan bir SAYI istiyor, veri bir SÜRE. Kaydın
        değeri alana hiç sığmıyordu.
     §9b'nin tablosunda süre YOK — kite ÖNERİ olarak gidiyor
     (`data-girdi="sure"`). Maske değeri BOZMAZ: `value` görünen biçim,
     ham saniye `dataset.ham`da (§9b'nin kendi deseni).
     ⚠ `readonly`/`disabled` alan maskelenmez (§9b).
     ═══════════════════════════════════════════════════════════════════ */

  function sureBicimle(ham) {
    var r = String(ham || '').replace(/\D/g, '').slice(0, 6);
    if (!r) return '';
    if (r.length <= 2) return r;
    return r.slice(0, r.length - 2) + ':' + r.slice(-2);
  }
  function sureSaniye(v) {
    var p = String(v || '').split(':');
    if (p.length !== 2) return null;
    var d = parseInt(p[0], 10), s = parseInt(p[1], 10);
    if (!isFinite(d) || !isFinite(s) || s > 59) return null;
    return d * 60 + s;
  }
  /* 🔴 `hataYaz`/`hataSil` GİRDİYİ DEĞİL `.alan` KABINI bekler — kitin
     kendi şerhinde yazılı ("hataSil `.alan` KABINI bekler, girdiyi değil;
     ilk yazımda girdiyi geçirdim ve SESSİZCE hiçbir şey olmadı").
     Aynı tuzağa bu dosyanın ilk yazımı da düştü ve kapı ölçtü:
     "12:75" → hata=false. Kabı geçiyoruz; markup'ın kendi hata kutusu
     `.goster` sınıfıyla açıldığı için o da ekleniyor. */
  function sureDenetle(g) {
    var kap = g.closest('.alan') || g.parentNode;
    var yaz = window.DM_HATA_YAZ, sil = window.DM_HATA_SIL;
    var kutuAc = function (ac) {
      var k = kap.querySelector('.alan-hata');
      if (k) k.classList.toggle('goster', ac);
    };
    if (!g.value) { if (sil) sil(kap); kutuAc(false); return true; }
    var sn = sureSaniye(g.value);
    if (sn === null) {
      if (yaz) yaz(kap, 'Süre dd:ss biçiminde yazılır — saniye 00–59 arası olmalı (örn. 12:48).');
      kutuAc(true);
      return false;
    }
    g.dataset.ham = String(sn);
    if (sil) sil(kap);
    kutuAc(false);
    return true;
  }

  function sureKur(g) {
    if (g.getAttribute('data-sure-kuruldu') === '1') return;
    if (g.readOnly || g.disabled) return;
    g.setAttribute('data-sure-kuruldu', '1');
    if (!g.getAttribute('inputmode')) g.setAttribute('inputmode', 'numeric');

    g.addEventListener('input', function (e) {
      /* 🔴 L1 SÜREYİ SANİYE OLARAK YAZAR — kit `alan.value = String(s)`
         deyip GÜVENİLMEZ (`isTrusted:false`) bir `input` olayı atıyor.
         Biçim bildirimi olmadığı için o sayı ham hâlde alanda kalıyordu
         ("Süre: 14" gibi). Kaynağı olayın kendisi söylüyor: kullanıcı
         yazmadıysa saniyeyi dd:ss'e çeviririz. Bu bir TAHMİN değil,
         kitin kendi sözleşmesinin okunuşu (KÖ-C3 · `data-sure-bicim`). */
      if (!e.isTrusted && /^\d+$/.test(g.value)) {
        var sn = parseInt(g.value, 10);
        g.dataset.ham = String(sn);
        /* Public `00:14` · `12:48` diye basıyor — dakika da iki haneli. */
        g.value = ('0' + Math.floor(sn / 60)).slice(-2) + ':' + ('0' + (sn % 60)).slice(-2);
        var not = document.querySelector(g.getAttribute('data-sure-not') || '');
        if (not) not.textContent = 'Süre dosyadan okundu (' + sn + ' sn) ve dd:ss biçimine çevrildi.';
        return;
      }
      var son = g.selectionStart === g.value.length;
      g.value = sureBicimle(g.value);
      if (son) { try { g.setSelectionRange(g.value.length, g.value.length); } catch (h) { /* eski tarayıcı */ } }
    });
    g.addEventListener('blur', function () { sureDenetle(g); });
  }

  /* ═══════════════════════════════════════════════════════════════════
     KÖ-C4 · KOŞULLU ALAN — bir seçim başka alanları AÇAR/KAPATIR
     ───────────────────────────────────────────────────────────────────
     Video türü `seri` değilken "Seri" ve "Bölüm no" alanları anlamsız;
     tür `kisa` (Dada Akış) iken dikey kapak ve akış sırası anlamlı.
     🔴 Gizlenen alan `disabled` YAPILMAZ (L7'nin dersi: `disabled` alan
        form gönderiminden düşer ve değer sessizce kaybolur). Yalnız
        `hidden` — değer yerinde kalır.
     ⚠ Kapalı alanın `required`i kaldırılır, yoksa görünmeyen bir alan
       kaydetmeyi engeller ve kullanıcı NEDENİNİ göremez.
     ═══════════════════════════════════════════════════════════════════ */

  function kosulUygula(kaynak) {
    var ad = kaynak.getAttribute('data-kosul-ad');
    var deger = kaynak.value;
    document.querySelectorAll('[data-kosul="' + ad + '"]').forEach(function (k) {
      var kabul = (k.getAttribute('data-kosul-deger') || '').split('|');
      var goster = kabul.indexOf(deger) !== -1;
      k.hidden = !goster;
      k.querySelectorAll('input, select, textarea').forEach(function (g) {
        if (goster) { if (g.hasAttribute('data-kosul-zorunlu')) g.required = true; }
        else { if (g.required) g.setAttribute('data-kosul-zorunlu', ''); g.required = false; }
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     KÖ-C5 · İÇ İÇE DİZİYİ KAYITTAN DOLDURMA
     ───────────────────────────────────────────────────────────────────
     🔴 `DM_FORM_DOLDUR` düz diziyi karşılıyor (`kazanim[]`), İÇ İÇE
        diziyi karşılayamıyor: dizi dalı `ilk.closest('.adim-karti')`in
        EBEVEYNİNİ tekrarlayıcı sayıyor, yani bütün iç satırlar BİRİNCİ
        bölümün listesine yığılırdı.

     ÖZNE GERÇEK — ölçüldü (37 canlı ders sayfası, 2026-09-05):
        230 bölüm · 73 vurgu · ÜÇ bölümde hem ipucu hem alıntı var.
        Yani "bölüm başına en fazla bir vurgu" varsayımı YANLIŞ olurdu
        ve düz alan bu üç bölümde veriyi sessizce KAYBEDERDİ.

     Bildirim: iç liste `data-ic-doldur="<ad>"` yazar; kayıt o adı
     DİZİLER DİZİSİ olarak taşır (dış sıra = bölüm sırası).
     ⚠ Kitin doldurması BİTTİKTEN sonra koşar: dış satırlar önce
       kayda göre çoğalır, iç listeler sonra dolar.
     ═══════════════════════════════════════════════════════════════════ */

  function icDoldur() {
    var kayitDugum = document.querySelector('script[type="application/json"][data-kayitlar]');
    if (!kayitDugum) return;
    var anahtar = new URLSearchParams(location.search).get('id');
    if (!anahtar) return;
    var kutuk;
    try { kutuk = JSON.parse(kayitDugum.textContent); } catch (h) { return; }
    var kayit = kutuk[anahtar];
    if (!kayit) return;

    document.querySelectorAll('[data-ic-doldur]').forEach(function (liste, sira) {
      var ad = liste.getAttribute('data-ic-doldur');
      var hepsi = kayit[ad];
      if (!Array.isArray(hepsi)) return;
      var benim = hepsi[sira];
      var mevcut = satirlar(liste);
      var kalip = mevcut[0];
      if (!kalip) return;
      /* Kap DURUR, içi kaydın gerçeğini söyler (kitin kendi kuralı):
         vurgusuz bölüm tek BOŞ satırla kalır, satır silinmez. */
      while (satirlar(liste).length > 1) satirlar(liste).pop().remove();
      if (!benim || !benim.length) {
        kalip.querySelectorAll('input, textarea').forEach(function (x) { if (x.type !== 'hidden') x.value = ''; });
        kalip.querySelectorAll('select').forEach(function (x) { x.selectedIndex = 0; });
      } else {
        benim.forEach(function (v, i) {
          var s = i === 0 ? kalip : kalip.cloneNode(true);
          if (i > 0) liste.appendChild(s);
          Object.keys(v).forEach(function (alan) {
            var g = s.querySelector('[data-ic-alan="' + alan + '"]');
            if (!g) return;
            if (g.tagName === 'SELECT') {
              var bulundu = false;
              [].forEach.call(g.options, function (o) {
                if (!bulundu && (o.value === v[alan] || (o.textContent || '').trim() === v[alan])) { g.value = o.value; bulundu = true; }
              });
              if (!bulundu && g.options.length) g.selectedIndex = 0;
            } else { g.value = v[alan]; }
          });
        });
      }
      if (window.DM_TEKRAR_KUR) window.DM_TEKRAR_KUR(liste);
      klonIsaretle(liste);
      icSayacTazele(liste);
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     KURULUM — idempotent; klondan sonra yeniden çağrılabilir
     ═══════════════════════════════════════════════════════════════════ */
  function ekCKur() {
    icDoldur();
    /* İç listeler kitin `tekrarListeleri()`sine GÖRÜNMEZ (aynı kapsam
       kusuru: o da düğmeden dış listeye çözüyor). Numara/tutamak/sil
       burada kurulur. */
    document.querySelectorAll('[data-ic-liste]').forEach(function (l) {
      if (window.DM_TEKRAR_KUR) window.DM_TEKRAR_KUR(l);
      klonIsaretle(l);
      icSayacTazele(l);
    });
    document.querySelectorAll('[data-girdi="sure"]').forEach(sureKur);
    document.querySelectorAll('[data-kosul-ad]').forEach(function (k) {
      if (k.getAttribute('data-kosul-kuruldu') !== '1') {
        k.setAttribute('data-kosul-kuruldu', '1');
        k.addEventListener('change', function () { kosulUygula(k); });
      }
      kosulUygula(k);
    });
  }

  /* 🔴 `defer` betiği DOMContentLoaded'dan ÖNCE ama `readyState`
     'interactive' iken koşar. "loading değilse hemen kur" deseni burada
     kiti YARIŞA sokar: kitin kendi kurulumu da DOMContentLoaded'da ve
     bizden ÖNCE bağlanmış. Doğru sıra için olayı BEKLERİZ; olay çoktan
     geçmişse (betik sonradan yüklendiyse) hemen koşarız. */
  if (document.readyState === 'complete') ekCKur();
  else document.addEventListener('DOMContentLoaded', ekCKur);
  window.GASTRO_EK_C_KUR = ekCKur;
  window.GASTRO_EK_C_SURE = { bicimle: sureBicimle, saniye: sureSaniye, denetle: sureDenetle };
})();
