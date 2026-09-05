/* GASTRO MARKA EKİ — kit'e (kanon/admin-kit.js) TAŞINACAK.
   ŞERH: Bu dosya Gastro'ya özel davranış içindir. Kit SALT OKUMA olduğu için
   burada yaşıyor; her kural docs/admin-kit-oneri-gastro-2.md'de "K-öneri"
   olarak kayıtlıdır. Kit'e taşındığında bu dosyadaki karşılığı SİLİNİR.
   Yükleme sırası: kanon/admin-kit.js'ten SONRA. */

/* ═══ L2 · KOLON SIRALAMA ÜÇ DURUMLU — KİTE TAŞINDI, BURADAN SÖKÜLDÜ ═══
   Kural artık `kanon/admin-kit.js` §K13 (kit hazır 2 · c169c8b6a555).
   Gastro bu kuralı KÖ-L2 olarak PİLOTLADI; kit onu dört markanın ortağı
   yaptı ve pilot kopya burada durmaya devam ederse İKİ SÜRÜCÜ aynı işi
   yapar. Ölçüldü: iki sürücü açıkken görünür davranış bozulmuyordu
   (üçüncü tıkta taban iki kez geri kuruluyor, ikincisi etkisiz) — ama
   "bugün zararsız" bir çift denetim yarın kitin kuralı değişince sessizce
   ayrışır. Pilot, kural kite indiği an sökülür.
   ═══════════════════════════════════════════════════════════════════ */

/* ═══ L4 · ZAMANLANMIŞ YAYIN — ÖNİZLEME GERÇEKTEN HESAPLANIR ═══════════
   K-ÖNERİ: KÖ-L4 (tüm markalar). Kit'e taşınınca SİL.

   Beyar: "kuyruktaki içerikleri modül seçerek tarih-saat + adet ile yayına
   alma (örn. Cuma 108, Cumartesi 93), tekrar kuralı, önizleme listesi, durum."

   🔴 ÖNİZLEME BİR RESİM DEĞİL, BİR HESAPTIR. Statik bir tablo basmak
      §11'in ölü yüzeyi olurdu: kullanıcı adedi değiştirir, liste durur.
      Burada tarih listesi ve gün başına adet formun kendi değerlerinden
      türetilir; kuyruk sayısı ekranda BİLDİRİLEN tek ölçülmüş sayıdır
      (İçerik Onayları · "Onaylanan").
   ⚠ Kuyruğun MODÜL KIRILIMI ölçülemediği için sayı bölüştürülmüyor —
     ekran bunu yazıyor. Bilinmeyen bir kırılımı uydurmak, yöneticinin
     göremeyeceği bir yalan olurdu.
   ⚠ L7: sonuç alanı `readonly` ve kaynağı `data-hesaplanan`da yazılı. */
(function () {
  'use strict';
  var form = document.querySelector('form[data-zamanli-yayin]');
  if (!form) return;

  var AY = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  var GUNAD = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];

  function q(s) { return form.querySelector(s) || document.querySelector(s); }
  function sayi(el, varsayilan) {
    var n = parseInt((el && el.value || '').replace(/\D/g, ''), 10);
    return isFinite(n) && n > 0 ? n : varsayilan;
  }
  /* Tarihi "GG.AA.YYYY SS:DD" ya da flatpickr'ın bıraktığı biçimden okur.
     Okunamıyorsa BUGÜN değil, null döner — uydurulmuş bir başlangıç
     önizlemeyi sessizce yanlış yapardı. */
  function tarihOku(m) {
    if (!m) return null;
    var g = m.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})(?:[ ,]+(\d{1,2}):(\d{2}))?/);
    if (g) return new Date(+g[3], +g[2] - 1, +g[1], +(g[4] || 0), +(g[5] || 0));
    var d = new Date(m);
    return isNaN(d) ? null : d;
  }
  function bicim(d) {
    return ('0' + d.getDate()).slice(-2) + ' ' + AY[d.getMonth()] + ' ' + d.getFullYear()
      + ' · ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function secilenGunler() {
    var c = form.querySelectorAll('#gfGunler .cip[aria-pressed="true"]');
    return Array.prototype.map.call(c, function (b) { return +b.getAttribute('data-gun'); });
  }

  function tazele() {
    var govde = q('#gfOnizleme'); if (!govde) return;
    var kuyrukEl = q('#gfKuyruk');
    var kuyruk = kuyrukEl ? parseInt((kuyrukEl.textContent || '0').replace(/\D/g, ''), 10) : 0;
    var adet = sayi(q('#gfAdet'), 0);
    var bas = tarihOku(q('#gfBaslangic') && q('#gfBaslangic').value);
    var tekrar = (q('#gfTekrar') || {}).value || 'gunluk';
    var gunler = secilenGunler();
    var sonuc = q('#gfSonuc'), sonraki = q('#gfSonraki');

    function bos(mesaj) {
      govde.innerHTML = '<tr><td colspan="4" class="bos-hucre">' + mesaj + '</td></tr>';
      if (sonuc) sonuc.value = '—';
      if (sonraki) sonraki.textContent = '—';
    }
    if (!bas) return bos('İlk yayın tarihini gir — liste ondan başlar.');
    if (!adet) return bos('Gün başına adet gir.');
    if (tekrar === 'haftalik' && !gunler.length) return bos('En az bir gün seç.');

    var kalan = kuyruk, satir = [], d = new Date(bas.getTime()), koruma = 0;
    while (kalan > 0 && satir.length < 60 && koruma++ < 400) {
      var uygun = tekrar === 'bir' ? satir.length === 0
                : tekrar === 'gunluk' ? true
                : gunler.indexOf(d.getDay()) >= 0;
      if (uygun) {
        var bu = Math.min(adet, kalan);
        kalan -= bu;
        satir.push({ t: new Date(d.getTime()), n: bu, kalan: kalan });
        if (tekrar === 'bir') break;
      }
      d.setDate(d.getDate() + 1);
    }
    govde.innerHTML = satir.map(function (r) {
      return '<tr><td><b>' + bicim(r.t) + '</b></td><td>' + GUNAD[r.t.getDay()] + '</td>'
        + '<td class="num">' + r.n + '</td><td class="num">' + r.kalan + '</td></tr>';
    }).join('') || '<tr><td colspan="4" class="bos-hucre">Bu kuralla yayın günü doğmuyor.</td></tr>';
    if (sonuc) sonuc.value = satir.length
      ? satir.length + ' yayın günü · ' + (kalan > 0 ? 'kuyruk bitmiyor, kalan ' + kalan : 'kuyruk biter')
      : '—';
    if (sonraki && satir.length) sonraki.textContent = bicim(satir[0].t);
  }

  /* Tür değişince o türe ait alanlar açılır/kapanır (ölü alan bırakmaz).
     🔴 GİZLEMEK YETMEZ — ÖLÇÜLDÜ. Kitin `alanDenetle`si zorunluluğu iki
        yerden okuyor: `required` niteliği VE alanın etiketindeki
        `.zorunlu` işareti. Cron alanı "sistem görevi" türüne aitti ve
        gizliyken bile zorunlu sayılıyordu: form eksiksiz doldurulduğu
        hâlde "Kaydet" hep «doldurulması gereken alanlar var» diyordu ve
        hatalı alan EKRANDA GÖRÜNMÜYORDU — kullanıcının çözemeyeceği bir
        kapı. Uygulanmayan alan `disabled` olur (form gönderiminden düşer,
        L7'nin kuralı) ve zorunluluk işareti askıya alınır. */
  function turTazele() {
    var secili = form.querySelector('[data-gorev-turu]:checked');
    var tur = secili ? secili.getAttribute('data-gorev-turu') : 'yayin';
    Array.prototype.forEach.call(form.querySelectorAll('[data-tur-alani]'), function (el) {
      var kapali = el.getAttribute('data-tur-alani') !== tur;
      el.hidden = kapali;
      Array.prototype.forEach.call(el.querySelectorAll('input, select, textarea'), function (g) {
        g.disabled = kapali;
      });
      Array.prototype.forEach.call(el.querySelectorAll('.zorunlu, .zorunlu-pasif'), function (z) {
        z.className = kapali ? 'zorunlu-pasif' : 'zorunlu';
      });
      if (kapali) { var a = el.querySelector('.alan-hata'); if (a) a.remove(); el.classList.remove('hata'); }
    });
    var sekmeler = form.querySelectorAll('.form-sekme');
    if (sekmeler[2]) sekmeler[2].hidden = tur !== 'yayin';   /* önizleme yalnız yayında anlamlı */
  }
  function gunTazele() {
    var a = q('#gfGunAlani'); if (!a) return;
    a.hidden = ((q('#gfTekrar') || {}).value !== 'haftalik');
  }

  form.addEventListener('input', function () { tazele(); });
  form.addEventListener('change', function () { turTazele(); gunTazele(); tazele(); });
  form.addEventListener('click', function (e) {
    if (e.target.closest('#gfGunler .cip, #gfModuller .cip')) setTimeout(tazele, 0);
  });
  turTazele(); gunTazele(); tazele();
})();

/* ═══ L5c · ŞEF PLANI — "EN AZ YILLIK ÜCRET" HESAPLANIR VE DOĞRULAR ═════
   K-ÖNERİ: KÖ-L5c. Kit'e taşınınca SİL.

   Kural public'ten ÖLÇÜLDÜ (g-sef-panelim · "Aylık ve yıllık ücret"):
     "Yıllık ücret aylığın on katından düşük olamaz; site kuralı gereği
      yıllık abonelikte en az iki ay indirim uygulanır."

   🔴 KURALI YAZMAK YETMEZ, KOŞMALI. Yardım rayına cümleyi yazıp alanı
      serbest bırakmak, yöneticinin göremeyeceği bir kural bırakır:
      ₺49 aylık + ₺100 yıllık kaydedilir ve public'te iki ay indirim sözü
      yalan olur. L7'nin hesaplanan alanı burada bir DOĞRULAMA da yapıyor. */
(function () {
  'use strict';
  var form = document.getElementById('spForm');
  if (!form) return;
  var aylik = document.getElementById('spAylik');
  var yillik = document.getElementById('spYillik');
  var enAz = document.getElementById('spEnAz');
  if (!aylik || !yillik || !enAz) return;

  function tazele() {
    var a = parseFloat(aylik.value);
    if (!isFinite(a) || a <= 0) { enAz.value = '—'; yillik.removeAttribute('min'); uyar(''); return; }
    var esik = a * 10;
    enAz.value = '₺' + esik.toLocaleString('tr-TR');
    yillik.setAttribute('min', String(esik));
    var y = parseFloat(yillik.value);
    uyar(isFinite(y) && y > 0 && y < esik
      ? 'Yıllık ücret aylığın on katından düşük olamaz — en az ₺' + esik.toLocaleString('tr-TR') + '.'
      : '');
  }
  function uyar(metin) {
    var alan = yillik.closest('.alan'); if (!alan) return;
    var e = alan.querySelector('[data-gastro-hata]');
    if (!metin) { if (e) e.remove(); alan.classList.remove('hata'); yillik.removeAttribute('aria-invalid'); return; }
    if (!e) {
      e = document.createElement('span');
      e.className = 'alan-hata'; e.setAttribute('data-gastro-hata', '1'); e.setAttribute('role', 'alert');
      alan.appendChild(e);
    }
    e.textContent = metin;
    alan.classList.add('hata');
    yillik.setAttribute('aria-invalid', 'true');
  }
  form.addEventListener('input', tazele);
  form.addEventListener('change', tazele);
  tazele();
})();
