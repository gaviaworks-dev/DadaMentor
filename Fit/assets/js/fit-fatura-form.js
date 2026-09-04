/* =====================================================================
   DadaFit · FATURA BİLGİLERİ FORMU — TEK KAYNAK
   ---------------------------------------------------------------------
   Bu form önce `hesabim-v1.html`de yaşadı, sonra `odemelerim-v1.html`e
   taşındı ve orada SAYFAYA GÖMÜLÜYDÜ: markup, sürücü ve stil tek sayfanın
   içindeydi. Ödeme akışı da aynı formu isteyince iki seçenek kaldı —
   markup'ı kopyalamak ya da tek kaynağa çekmek. Kopya iki formun zamanla
   ayrışması demekti (alan eklenir, biri güncellenir, öteki unutulur), bu
   yüzden form buraya çıkarıldı.

   BU DOSYA NE YAPAR
     · Modal markup'ını üretir (`MARKUP`) ve verilen yuvanın yerine basar.
     · Alan doğrulamasını bağlar (blur'da + gönderimde).
     · Kaydı tarayıcı hafızasına yazar/okur (`dm_fit_fatura_v1`).

   🔴 BU EKRANIN GERÇEK YETENEĞİ: alan doğrulaması ve TARAYICI HAFIZASI.
   Kaydedilen bilgi sayfayı yenileyince geri gelir — sunucu gerekmediği
   için burada yalan yok. MAKET olan tek şey faturanın KESİLMESİ; şerit
   bunu popup'ın başında bir kez söylüyor.

   DOĞRULAMA BLUR'DA çalışır, her tuş vuruşunda değil: kullanıcı alanı
   doldururken kırmızıya boyamak sinir bozucudur ve hatayı erken gösterip
   sonra kaldırmak "titreyen form" hissi verir. Gönderimde hepsi birden
   denetlenir ve ilk hatalı alana odak gider.

   TİP GEÇİŞİNDE ORTAK ALANLAR SIFIRLANMAZ: telefon · e-posta · il ·
   ilçe · adres · posta kodu yerinde kalır. Yalnız kimlik bloğu değişir
   ve KAPANAN bloğun alanları doğrulamaya girmez.

   BAĞIMLILIKLAR (sayfa bu üçünü BU dosyadan ÖNCE yüklemeli)
     fit-modal.js  → odak tuzağı · ESC · odak dönüşü
     fit-ulke.js   → ülke kodu seçicisinin verisi ve davranışı
     fit-shell.css → `.fb-*` modal kabuğu, `.fk-*` alan kiti,
                     `#ftModal` / `.ft-*` / `.od-sonuc` (bu formla
                     birlikte sayfadan kabuğa taşındı)

   KULLANIM
     <div id="ftFormYuva"></div>
     <script src="assets/js/fit-modal.js"></script>
     <script src="assets/js/fit-ulke.js"></script>
     <script src="assets/js/fit-fatura-form.js"></script>
     <script>FIT_FATURA_FORM.kur({ yuva:'ftFormYuva', tetik:'odFtBilgi' });</script>
   ===================================================================== */
window.FIT_FATURA_FORM = (function () {
  'use strict';

  var ANAHTAR = 'dm_fit_fatura_v1';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* Kayıtlı fatura kimliği — yoksa null. `fit-fatura.js:alici()` aynı
     anahtarı kendi okur; bu iki okuyucu bilerek birbirinden bağımsız. */
  function oku() {
    var ham; try { ham = localStorage.getItem(ANAHTAR); } catch (e) { return null; }
    if (!ham) return null;
    try { return JSON.parse(ham); } catch (e) { return null; }
  }

  var MARKUP = [
    '<div class="fb-overlay" id="ftOverlay"></div>',
    '<div class="fb-modal" id="ftModal" role="dialog" aria-modal="true" aria-labelledby="ftModalTitle">',
    '  <div class="fb-panel">',
    '    <div class="fb-head">',
    '      <div>',
    '        <h3 id="ftModalTitle">Fatura Bilgilerim</h3>',
    '        <p id="ftModalSub">Faturaların kime, hangi kimlikle ve hangi adrese düzenleneceğini belirler.</p>',
    '      </div>',
    '      <button class="fb-close" id="ftClose" type="button" aria-label="Kapat"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>',
    '    </div>',
    '    <div class="fb-body">',
    '      <div class="hr-note" role="note">',
    '        <i class="fa-solid fa-circle-info" aria-hidden="true"></i>',
    '        <p><b>Bu ekran maket: bilgiler tarayıcında saklanır, fatura kesilmez.</b> Girdiğin bilgiler bu tarayıcıda kalır ve sayfayı yenileyince geri gelir; hiçbir sunucuya gönderilmez.</p>',
    '      </div>',
    '',
    '      <form id="ftForm" autocomplete="on" novalidate>',
    '',
    '        <!-- ---- TİP: segment denetimi ---- -->',
    '        <div class="fk-field">',
    '          <span class="fk-label" id="ftTipLbl">Fatura tipi</span>',
    '          <div class="ft-seg" role="group" aria-labelledby="ftTipLbl">',
    '            <button type="button" data-tip="bireysel" aria-pressed="true"><i class="fa-solid fa-user" aria-hidden="true"></i> Bireysel</button>',
    '            <button type="button" data-tip="kurumsal" aria-pressed="false"><i class="fa-solid fa-building" aria-hidden="true"></i> Kurumsal</button>',
    '          </div>',
    '        </div>',
    '',
    '        <!-- ---- KİMLİK: BİREYSEL ---- -->',
    '        <div class="ft-blok" data-blok="bireysel">',
    '          <div class="fk-field">',
    '            <label class="fk-label" for="ftAd">Ad soyad <span class="req" aria-hidden="true">*</span></label>',
    '            <input class="fk-input" id="ftAd" name="ad" type="text" autocomplete="name" placeholder="Adın ve soyadın" aria-describedby="ftAdHata" />',
    '            <p class="fk-hata" id="ftAdHata" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> <span>Ad ve soyadını birlikte yaz.</span></p>',
    '          </div>',
    '          <div class="fk-field">',
    '            <label class="fk-label" for="ftTckn">T.C. Kimlik No <span class="opt">(isteğe bağlı)</span></label>',
    '            <input class="fk-input" id="ftTckn" name="tckn" type="text" inputmode="numeric" maxlength="11" placeholder="11 hane" aria-describedby="ftTcknHata ftTcknHelp" />',
    '            <p class="fk-hata" id="ftTcknHata" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> <span>Geçerli bir T.C. kimlik numarası gir.</span></p>',
    '            <span class="fk-help" id="ftTcknHelp"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Yalnız fatura üzerinde görünür. Boş bırakabilirsin; e-Arşiv fatura için kurumlar isteyebilir.</span>',
    '          </div>',
    '        </div>',
    '',
    '        <!-- ---- KİMLİK: KURUMSAL ---- -->',
    '        <div class="ft-blok" data-blok="kurumsal" hidden>',
    '          <div class="fk-field">',
    '            <label class="fk-label" for="ftUnvan">Firma unvanı <span class="req" aria-hidden="true">*</span></label>',
    '            <input class="fk-input" id="ftUnvan" name="unvan" type="text" autocomplete="organization" placeholder="Ticaret sicilindeki tam unvan" aria-describedby="ftUnvanHata" />',
    '            <p class="fk-hata" id="ftUnvanHata" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> <span>Firma unvanını yaz.</span></p>',
    '          </div>',
    '          <div class="fk-grid c2">',
    '            <div class="fk-field">',
    '              <label class="fk-label" for="ftDaire">Vergi dairesi <span class="req" aria-hidden="true">*</span></label>',
    '              <input class="fk-input" id="ftDaire" name="vergidaire" type="text" placeholder="Örneğin Kadıköy" aria-describedby="ftDaireHata" />',
    '              <p class="fk-hata" id="ftDaireHata" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> <span>Vergi dairesini yaz.</span></p>',
    '            </div>',
    '            <div class="fk-field">',
    '              <label class="fk-label" for="ftVkn">Vergi no (VKN) <span class="req" aria-hidden="true">*</span></label>',
    '              <input class="fk-input" id="ftVkn" name="vkn" type="text" inputmode="numeric" maxlength="10" placeholder="10 hane" aria-describedby="ftVknHata" />',
    '              <p class="fk-hata" id="ftVknHata" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> <span>Vergi numarası 10 haneli olmalı.</span></p>',
    '            </div>',
    '          </div>',
    '          <div class="fk-field">',
    '            <label class="hs-check" for="ftEfatura">',
    '              <input type="checkbox" id="ftEfatura" name="efatura" />',
    '              <span>e-Fatura mükellefiyim</span>',
    '            </label>',
    '            <span class="fk-help" id="ftEfaturaNot" hidden><i class="fa-solid fa-file-invoice" aria-hidden="true"></i> Faturan e-Fatura olarak iletilir; e-posta yerine entegratörün üzerinden düşer.</span>',
    '          </div>',
    '        </div>',
    '',
    '        <!-- ---- ORTAK: İLETİŞİM (tip değişince SIFIRLANMAZ) ---- -->',
    '        <div class="fk-grid c2">',
    '          <div class="fk-field">',
    '            <label class="fk-label" for="ftTel">Telefon <span class="req" aria-hidden="true">*</span></label>',
    '            <div class="fk-tel" data-cc-kok>',
    '              <button class="fk-cc" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="Ülke kodu">',
    '                <span class="fk-cc-flag" aria-hidden="true">&#127481;&#127479;</span><span class="fk-cc-dial">+90</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i>',
    '              </button>',
    '              <input class="fk-input" id="ftTel" name="telefon" type="tel" autocomplete="tel-national" placeholder="555 555 55 55" aria-describedby="ftTelHata" />',
    '              <input type="hidden" name="ulke" id="ftUlke" value="TR" />',
    '              <div class="fk-cc-pop" role="dialog" aria-label="Ülke seç" hidden>',
    '                <div class="fk-cc-search">',
    '                  <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>',
    '                  <label class="sr-only" for="ftCcAra">Ülke ara</label>',
    '                  <input id="ftCcAra" type="text" placeholder="Ülke veya kod ara" autocomplete="off" />',
    '                </div>',
    '                <ul class="fk-cc-list" role="listbox" aria-label="Ülkeler" tabindex="-1"></ul>',
    '                <p class="fk-cc-bos" hidden>Eşleşen ülke yok.</p>',
    '              </div>',
    '            </div>',
    '            <p class="fk-hata" id="ftTelHata" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> <span>Telefon numarasını yaz (en az 7 hane).</span></p>',
    '          </div>',
    '          <div class="fk-field">',
    '            <label class="fk-label" for="ftEposta">E-posta <span class="req" aria-hidden="true">*</span></label>',
    '            <input class="fk-input" id="ftEposta" name="eposta" type="email" autocomplete="email" placeholder="ornek@eposta.com" aria-describedby="ftEpostaHata ftEpostaHelp" />',
    '            <p class="fk-hata" id="ftEpostaHata" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> <span>Geçerli bir e-posta adresi yaz.</span></p>',
    '            <span class="fk-help" id="ftEpostaHelp"><i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Fatura bu adrese gönderilir.</span>',
    '          </div>',
    '        </div>',
    '',
    '        <!-- ---- ORTAK: ADRES ---- -->',
    '        <div class="fk-grid c2">',
    '          <div class="fk-field">',
    '            <label class="fk-label" for="ftIl">İl <span class="req" aria-hidden="true">*</span></label>',
    '            <select class="fk-select" id="ftIl" name="il" aria-describedby="ftIlHata">',
    '              <option value="">İl seç</option>',
    '              <option>Adana</option><option>Adıyaman</option><option>Afyonkarahisar</option><option>Ağrı</option><option>Aksaray</option><option>Amasya</option><option>Ankara</option><option>Antalya</option><option>Ardahan</option><option>Artvin</option><option>Aydın</option><option>Balıkesir</option><option>Bartın</option><option>Batman</option><option>Bayburt</option><option>Bilecik</option><option>Bingöl</option><option>Bitlis</option><option>Bolu</option><option>Burdur</option><option>Bursa</option><option>Çanakkale</option><option>Çankırı</option><option>Çorum</option><option>Denizli</option><option>Diyarbakır</option><option>Düzce</option><option>Edirne</option><option>Elazığ</option><option>Erzincan</option><option>Erzurum</option><option>Eskişehir</option><option>Gaziantep</option><option>Giresun</option><option>Gümüşhane</option><option>Hakkâri</option><option>Hatay</option><option>Iğdır</option><option>Isparta</option><option>İstanbul</option><option>İzmir</option><option>Kahramanmaraş</option><option>Karabük</option><option>Karaman</option><option>Kars</option><option>Kastamonu</option><option>Kayseri</option><option>Kilis</option><option>Kırıkkale</option><option>Kırklareli</option><option>Kırşehir</option><option>Kocaeli</option><option>Konya</option><option>Kütahya</option><option>Malatya</option><option>Manisa</option><option>Mardin</option><option>Mersin</option><option>Muğla</option><option>Muş</option><option>Nevşehir</option><option>Niğde</option><option>Ordu</option><option>Osmaniye</option><option>Rize</option><option>Sakarya</option><option>Samsun</option><option>Şanlıurfa</option><option>Siirt</option><option>Sinop</option><option>Sivas</option><option>Şırnak</option><option>Tekirdağ</option><option>Tokat</option><option>Trabzon</option><option>Tunceli</option><option>Uşak</option><option>Van</option><option>Yalova</option><option>Yozgat</option><option>Zonguldak</option>',
    '            </select>',
    '            <p class="fk-hata" id="ftIlHata" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> <span>İl seç.</span></p>',
    '          </div>',
    '          <div class="fk-field">',
    '            <label class="fk-label" for="ftIlce">İlçe <span class="req" aria-hidden="true">*</span></label>',
    '            <input class="fk-input" id="ftIlce" name="ilce" type="text" placeholder="Önce il seç" disabled aria-describedby="ftIlceHata ftIlceHelp" />',
    '            <p class="fk-hata" id="ftIlceHata" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> <span>İlçeyi yaz.</span></p>',
    '            <span class="fk-help" id="ftIlceHelp"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> İl seçilince açılır.</span>',
    '          </div>',
    '        </div>',
    '        <div class="fk-field">',
    '          <label class="fk-label" for="ftAdres">Adres <span class="req" aria-hidden="true">*</span><span class="fk-count" id="ftAdresSayac">0 / 240</span></label>',
    '          <textarea class="fk-textarea" id="ftAdres" name="adres" maxlength="240" placeholder="Mahalle, cadde, sokak, kapı ve daire numarası" aria-describedby="ftAdresHata"></textarea>',
    '          <p class="fk-hata" id="ftAdresHata" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> <span>Adresi en az 10 karakterle yaz.</span></p>',
    '        </div>',
    '        <div class="fk-grid c2">',
    '          <div class="fk-field">',
    '            <label class="fk-label" for="ftPosta">Posta kodu <span class="opt">(isteğe bağlı)</span></label>',
    '            <input class="fk-input" id="ftPosta" name="postakodu" type="text" inputmode="numeric" maxlength="5" autocomplete="postal-code" placeholder="5 hane" aria-describedby="ftPostaHata" />',
    '            <p class="fk-hata" id="ftPostaHata" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> <span>Posta kodu 5 haneli olmalı.</span></p>',
    '          </div>',
    '          <div class="fk-field" style="display:flex;align-items:flex-end">',
    '            <label class="hs-check" for="ftVarsayilan" style="width:100%">',
    '              <input type="checkbox" id="ftVarsayilan" name="varsayilan" checked />',
    '              <span>Bu bilgileri varsayılan fatura adresim yap</span>',
    '            </label>',
    '          </div>',
    '        </div>',
    '',
    '        <div class="ft-foot">',
    '          <p class="note">Değişiklik bir sonraki faturadan itibaren geçerli olur. Kesilmiş faturalar geriye dönük düzenlenmez.</p>',
    '          <button class="btn btn-ghost" type="button" id="ftVazgec">Vazgeç</button>',
    '          <button class="btn btn-primary" type="submit"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Bilgileri Kaydet</button>',
    '        </div>',
    '      </form>',
    '',
    '      <p class="od-sonuc" id="ftSonuc" role="status">',
    '        <i class="fa-solid fa-circle-half-stroke" aria-hidden="true"></i>',
    '        <span class="od-sonuc-txt"></span>',
    '      </p>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('\n');

  /* ==================================================================
     KUR — markup'ı yuvaya basar, sürücüyü bağlar.
     opt.yuva  : yerine markup basılacak elemanın id'si (zorunlu)
     opt.tetik : modalı açan düğmenin id'si (isteğe bağlı)
     opt.kaydedildi : kayıt yazıldıktan sonra çağrılır (isteğe bağlı) —
                      çağıran sayfa kendi özetini burada tazeler.
     Dönen: { ac, kapat, oku } · yuva yoksa null.
     ================================================================== */
  function kur(opt) {
    opt = opt || {};
    var yuva = $(opt.yuva || 'ftFormYuva');
    if (!yuva) return null;

    /* `outerHTML` ile YUVANIN YERİNE basılır: sarmalayıcı bir div kalmaz,
       DOM sayfaya gömülü hâliyle birebir aynı olur. */
    yuva.outerHTML = MARKUP;

    var kap = $('ftModal'); if (!kap) return null;

    var fm = (window.FIT_MODAL && window.FIT_MODAL.kur({
      kap: '#ftModal', panel: '.fb-panel', ortu: '#ftOverlay', kapat: '#ftClose'
    })) || null;
    if (window.FIT_ULKE) window.FIT_ULKE.kur(kap);

    var form = $('ftForm'), seg = kap.querySelector('.ft-seg'),
        il = $('ftIl'), ilce = $('ftIlce'), ilceHelp = $('ftIlceHelp'),
        adres = $('ftAdres'), adresSayac = $('ftAdresSayac'),
        efatura = $('ftEfatura'), efaturaNot = $('ftEfaturaNot'),
        vazgec = $('ftVazgec'), ulke = $('ftUlke');
    var tip = 'bireysel';

    /* Maket sonuç şeridi — sayfanın `sonuc()` yardımcısının aynısı, ama
       modülün kendi kopyası: form artık sayfadan bağımsız yaşıyor. */
    function sonuc(id, baslik, metin) {
      var el = $(id); if (!el) return;
      var t = el.querySelector('.od-sonuc-txt');
      if (t) t.innerHTML = '<b>' + esc(baslik) + '</b>' + esc(metin);
      el.classList.add('show');
    }

    /* ---- tip geçişi ---- */
    function tipUygula(yeni) {
      tip = yeni;
      Array.prototype.forEach.call(seg.querySelectorAll('button[data-tip]'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-tip') === yeni ? 'true' : 'false');
      });
      Array.prototype.forEach.call(kap.querySelectorAll('.ft-blok'), function (b) {
        b.hidden = b.getAttribute('data-blok') !== yeni;
      });
      /* kapanan bloğun hatası ekranda kalmasın */
      Array.prototype.forEach.call(kap.querySelectorAll('.ft-blok[hidden] .fk-hata'), function (h) { h.classList.remove('show'); });
      Array.prototype.forEach.call(kap.querySelectorAll('.ft-blok[hidden] .fk-input'), function (i) { i.classList.remove('is-err'); i.removeAttribute('aria-invalid'); });
    }
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-tip]'); if (!b) return;
      tipUygula(b.getAttribute('data-tip'));
    });

    /* ---- il → ilçe kapısı ---- */
    function ilceKapisi() {
      var acik = !!il.value;
      ilce.disabled = !acik;
      ilce.placeholder = acik ? 'İlçe adı' : 'Önce il seç';
      if (!acik) { ilce.value = ''; ilce.classList.remove('is-err'); $('ftIlceHata').classList.remove('show'); }
      if (ilceHelp) ilceHelp.innerHTML = acik
        ? '<i class="fa-solid fa-circle-info" aria-hidden="true"></i> ' + il.value + ' ilçesini yaz. İlçe listesi backend geldiğinde açılır kutuya döner.'
        : '<i class="fa-solid fa-circle-info" aria-hidden="true"></i> İl seçilince açılır.';
    }
    il.addEventListener('change', ilceKapisi);

    if (adres) adres.addEventListener('input', function () { adresSayac.textContent = adres.value.length + ' / 240'; });
    if (efatura) efatura.addEventListener('change', function () { if (efaturaNot) efaturaNot.hidden = !efatura.checked; });

    /* rakam alanları yalnız rakam alsın */
    [['ftTckn', 11], ['ftVkn', 10], ['ftPosta', 5]].forEach(function (x) {
      var el = $(x[0]); if (!el) return;
      el.addEventListener('input', function () { el.value = el.value.replace(/\D/g, '').slice(0, x[1]); });
    });

    /* ---- doğrulayıcılar ---- */
    /* TCKN sağlaması resmî algoritmadır: 11 hane · ilk hane 0 değil ·
       (tek hanelerin toplamı×7 − çift hanelerin toplamı) %10 = 10. hane ·
       ilk 10 hanenin toplamı %10 = 11. hane. Sunucu gerektirmez, bu yüzden
       burada GERÇEKTEN çalışır. */
    function tcknGecerli(v) {
      if (!/^[1-9][0-9]{9}[0-9]$/.test(v)) return false;
      var d = v.split('').map(Number);
      var tek = d[0] + d[2] + d[4] + d[6] + d[8];
      var cift = d[1] + d[3] + d[5] + d[7];
      if (((tek * 7 - cift) % 10 + 10) % 10 !== d[9]) return false;
      var ilk10 = d.slice(0, 10).reduce(function (a, b) { return a + b; }, 0);
      return ilk10 % 10 === d[10];
    }
    function epostaGecerli(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }

    function isaret(el, hataId, gecerli) {
      var h = $(hataId);
      el.classList.toggle('is-err', !gecerli);
      el.setAttribute('aria-invalid', gecerli ? 'false' : 'true');
      if (h) h.classList.toggle('show', !gecerli);
      return gecerli;
    }

    /* Her alanın kuralı TEK YERDE: hem blur hem gönderim buradan okur. */
    var KURAL = {
      ftAd:      { tip:'bireysel', zorunlu:true,  test:function(v){ return v.trim().split(/\s+/).filter(Boolean).length >= 2; } },
      ftTckn:    { tip:'bireysel', zorunlu:false, test:tcknGecerli },
      ftUnvan:   { tip:'kurumsal', zorunlu:true,  test:function(v){ return v.trim().length >= 2; } },
      ftDaire:   { tip:'kurumsal', zorunlu:true,  test:function(v){ return v.trim().length >= 2; } },
      ftVkn:     { tip:'kurumsal', zorunlu:true,  test:function(v){ return /^[0-9]{10}$/.test(v); } },
      ftTel:     { zorunlu:true,  test:function(v){ return v.replace(/\D/g,'').length >= 7; } },
      ftEposta:  { zorunlu:true,  test:epostaGecerli },
      ftIl:      { zorunlu:true,  test:function(v){ return !!v; } },
      ftIlce:    { zorunlu:true,  test:function(v){ return v.trim().length >= 2; } },
      ftAdres:   { zorunlu:true,  test:function(v){ return v.trim().length >= 10; } },
      ftPosta:   { zorunlu:false, test:function(v){ return /^[0-9]{5}$/.test(v); } }
    };
    function denetle(id) {
      var k = KURAL[id], el = $(id); if (!k || !el) return true;
      if (k.tip && k.tip !== tip) return true;              /* kapalı blok */
      var v = el.value || '';
      if (!v.trim()) return isaret(el, id + 'Hata', !k.zorunlu);
      return isaret(el, id + 'Hata', k.test(v));
    }
    Object.keys(KURAL).forEach(function (id) {
      var el = $(id); if (!el) return;
      el.addEventListener('blur', function () { denetle(id); });   /* BLUR'DA */
    });

    /* ---- tarayıcı hafızası ---- */
    var ALANLAR = ['ftAd','ftTckn','ftUnvan','ftDaire','ftVkn','ftTel','ftEposta','ftIl','ftIlce','ftAdres','ftPosta'];
    function yukle() {
      var d = oku(); if (!d) return;
      tipUygula(d.tip === 'kurumsal' ? 'kurumsal' : 'bireysel');
      ALANLAR.forEach(function (id) { if (d[id] != null && $(id)) $(id).value = d[id]; });
      if (ulke && d.ulke) ulke.value = d.ulke;
      if (efatura) { efatura.checked = !!d.efatura; if (efaturaNot) efaturaNot.hidden = !efatura.checked; }
      var vs = $('ftVarsayilan'); if (vs) vs.checked = d.varsayilan !== false;
      ilceKapisi();
      if (adres) adresSayac.textContent = adres.value.length + ' / 240';
    }
    function kaydet() {
      var d = { tip:tip, ulke: ulke ? ulke.value : 'TR',
                efatura: !!(efatura && efatura.checked),
                varsayilan: !!($('ftVarsayilan') && $('ftVarsayilan').checked) };
      ALANLAR.forEach(function (id) { if ($(id)) d[id] = $(id).value; });
      try { localStorage.setItem(ANAHTAR, JSON.stringify(d)); return true; }
      catch (e) { return false; }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ilk = null;
      Object.keys(KURAL).forEach(function (id) {
        if (!denetle(id) && !ilk) ilk = $(id);
      });
      if (ilk) { ilk.focus(); ilk.scrollIntoView({ behavior:'smooth', block:'center' }); return; }

      var ok = kaydet();
      sonuc('ftSonuc',
        ok ? 'Fatura bilgilerin bu tarayıcıya kaydedildi. ' : 'Bilgiler kaydedilemedi. ',
        ok ? 'Sayfayı yenilediğinde geri gelir. Hiçbir sunucuya gönderilmedi ve bu ekranda fatura kesilmez — kayıtlı bilgi yalnız faturanın nasıl görüneceğini gösterir.'
           : 'Tarayıcının depolama izni kapalı görünüyor; gizli sekmede ya da site verileri engelliyken bu ekran bilgi saklayamaz.');
      if (ok && typeof opt.kaydedildi === 'function') opt.kaydedildi(oku());
    });

    if (vazgec && fm) vazgec.addEventListener('click', function () { fm.kapat(); });

    var ac = opt.tetik ? $(opt.tetik) : null;
    if (ac && fm) {
      ac.setAttribute('aria-haspopup', 'dialog');
      ac.setAttribute('aria-controls', 'ftModal');
      ac.addEventListener('click', function () {
        var s = $('ftSonuc'); if (s) s.classList.remove('show');
        fm.ac(ac);
      });
    }
    yukle();
    ilceKapisi();

    return {
      ac: function (odakDonus) { if (fm) fm.ac(odakDonus || ac || null); },
      kapat: function () { if (fm) fm.kapat(); },
      oku: oku
    };
  }

  return { ANAHTAR: ANAHTAR, oku: oku, kur: kur };
})();
