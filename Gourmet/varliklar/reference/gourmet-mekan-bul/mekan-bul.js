/* mekan-bul.js — A6 Mekân Bul sihirbazı, progresif geliştirme katmanı.
   Form JS'siz de TAM çalışır (native radio/checkbox + gerçek POST submit,
   sunucu-taraflı adım geçişi) — bu dosya yalnız kozmetik/UX katmanı ekler:
   (1) radio seçimine göre alt alan göster/gizle (adım 1 konum yolu + adım 4
   "Kendim Belirleyeyim"), (2) "Konumumu Bul" geolocation, (3) mesafe slider
   canlı etiket, (4) RV3: adım 1 kademeli bölge alanı (şehir→ilçe→semt),
   (5) RV3: adım 3 mutfak sekmeleri, (6) RV3: adım 5 accordion. */
(function () {
  'use strict';

  // ---- (1) Radio seçimine göre alt alan toggle ----
  // RV3: eskiden yalnız name="yontem" içindi; artık data-toggle-sub taşıyan
  // HER radio grubu için çalışır (adım 4'ün "Kendim Belirleyeyim" kalemi de
  // aynı sözleşmeyi kullanıyor). Alt alanlar aynı .wstep içinde eşleştirilir.
  var toggleRadios = document.querySelectorAll('input[type="radio"][data-toggle-sub]');
  if (toggleRadios.length) {
    var groups = {};
    toggleRadios.forEach(function (radio) {
      (groups[radio.name] = groups[radio.name] || []).push(radio);
    });

    Object.keys(groups).forEach(function (name) {
      var radios = groups[name];
      var values = radios.map(function (r) { return r.value; });
      // Yalnız BU grubun sahiplendiği alt alanlar (başka grubunkini gizleme).
      var subFields = [].filter.call(
        document.querySelectorAll('.mb-sub-field[data-sub]'),
        function (el) { return values.indexOf(el.getAttribute('data-sub')) !== -1; }
      );
      if (!subFields.length) return;

      var syncSub = function (value) {
        subFields.forEach(function (el) {
          el.hidden = el.getAttribute('data-sub') !== value;
        });
        // Yarıçap yalnız konum/harita yollarında anlamlı (RV3 madde 13) —
        // bölge seçiminde mesafe hesabının çıkış noktası yok, slider
        // yanıltıcı olurdu.
        if (name === 'yontem') {
          var dist = document.getElementById('mbDistBar');
          if (dist) dist.hidden = (value !== 'mevcut' && value !== 'harita');
        }
      };

      radios.forEach(function (radio) {
        radio.addEventListener('change', function () {
          if (radio.checked) syncSub(radio.value);
        });
      });
    });
  }

  // ---- (2) Konumumu Bul ----
  var geoBtn = document.getElementById('mbGeolocate');
  if (geoBtn) {
    geoBtn.addEventListener('click', function () {
      var status = document.getElementById('mbGeoStatus');
      if (!('geolocation' in navigator)) {
        if (status) status.innerHTML = '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Tarayıcın konum paylaşımını desteklemiyor — "Bölge Seç" ile devam edebilirsin.';
        return;
      }
      geoBtn.disabled = true;
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          var latInput = document.getElementById('mbLat');
          var lngInput = document.getElementById('mbLng');
          if (latInput) latInput.value = pos.coords.latitude;
          if (lngInput) lngInput.value = pos.coords.longitude;
          geoBtn.disabled = false;
          var status2 = document.getElementById('mbGeoStatus');
          if (status2) status2.innerHTML = '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Konumun alındı — devam edebilirsin.';
        },
        function () {
          geoBtn.disabled = false;
          var status3 = document.getElementById('mbGeoStatus');
          if (status3) status3.innerHTML = '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Konum izni verilmedi — "Bölge Seç" ile şehir ve semt üzerinden devam edebilirsin.';
        },
      );
    });
  }

  // ---- (3) Mesafe slider canlı etiket ----
  var slider = document.getElementById('mbDist');
  if (slider) {
    var fill = document.getElementById('mbDistFill');
    var label = document.getElementById('mbDistVal');
    var sync = function () {
      var min = +slider.min, max = +slider.max, val = +slider.value;
      if (fill) fill.style.width = ((val - min) / (max - min) * 100) + '%';
      if (label) label.textContent = val + ' km';
    };
    slider.addEventListener('input', sync);
    sync();
  }

  // ---- (4) RV3 madde 13 — kademeli bölge alanı ----
  // Şehir seçilince ilçe listesi, ilçe seçilince semt listesi dolar. Veri
  // sunucudan gelen gerçek ağaç (yayındaki mekânların district/neighborhood
  // değerleri) — uydurma yer adı yok. JS kapalıysa alanlar zaten sunucu
  // tarafında seçili değerle basılı gelir, form çalışmaya devam eder.
  var cascade = document.getElementById('mbCascade');
  if (cascade) {
    var tree = {};
    try { tree = JSON.parse(cascade.getAttribute('data-region-tree') || '{}'); } catch (e) { tree = {}; }

    var citySel = document.getElementById('mbSehir');
    var ilceSel = document.getElementById('mbIlce');
    var semtSel = document.getElementById('mbSemt');
    var ilceField = document.getElementById('mbIlceField');
    var semtField = document.getElementById('mbSemtField');

    var fill2 = function (select, items, placeholder, keep) {
      var current = keep && [].some.call(select.options, function (o) { return o.value === keep; }) ? keep : select.value;
      select.innerHTML = '';
      var opt0 = document.createElement('option');
      opt0.value = '';
      opt0.textContent = placeholder;
      select.appendChild(opt0);
      items.forEach(function (name) {
        var o = document.createElement('option');
        o.value = name;
        o.textContent = name;
        if (name === (keep || current)) o.selected = true;
        select.appendChild(o);
      });
    };

    var syncSemt = function (keep) {
      var city = citySel.value, ilce = ilceSel.value;
      var list = (city && ilce && tree[city] && tree[city][ilce]) ? tree[city][ilce] : [];
      fill2(semtSel, list, 'Tüm semtler', keep);
      semtField.hidden = !ilce || list.length === 0;
    };

    var syncIlce = function (keepIlce, keepSemt) {
      var city = citySel.value;
      var list = (city && tree[city]) ? Object.keys(tree[city]) : [];
      fill2(ilceSel, list, 'Tüm ilçeler', keepIlce);
      ilceField.hidden = !city || list.length === 0;
      syncSemt(keepSemt);
    };

    citySel.addEventListener('change', function () { syncIlce('', ''); });
    ilceSel.addEventListener('change', function () { syncSemt(''); });
    syncIlce(ilceSel.getAttribute('data-selected') || '', semtSel.getAttribute('data-selected') || '');
  }

  // ---- (5) RV3 madde 14 — mutfak sekmeleri ----
  // Gizli sekmenin checkbox'ları DOM'da KALIR (yalnız CSS ile gizlenir), o
  // yüzden sekme değişimi seçimi düşürmez ve form hepsini birden POST eder.
  // Rozet sayısı ilk render'da sunucudan gelir, burada canlı güncellenir.
  var tabBar = document.getElementById('mbCuisineTabs');
  if (tabBar) {
    var tabs = tabBar.querySelectorAll('.mb-tab');
    var panels = document.querySelectorAll('.mb-tabpanel');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var key = tab.getAttribute('data-tab');
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle('active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        panels.forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-panel') === key);
        });
      });
    });

    document.querySelectorAll('input[data-tab-item]').forEach(function (input) {
      input.addEventListener('change', function () {
        var key = input.getAttribute('data-tab-item');
        var count = document.querySelectorAll('input[data-tab-item="' + key + '"]:checked').length;
        var dot = tabBar.querySelector('[data-tab-count="' + key + '"]');
        if (dot) {
          dot.textContent = count;
          dot.hidden = count === 0;
        }
      });
    });
  }

  // ---- (6) RV3 madde 16 — adım 5 accordion ----
  // Site genelindeki facet paneliyle AYNI sözleşme: .fct + .open. Seçim
  // yapıldıkça grup başlığındaki sayaç güncellenir (kapalı grupta da kaç
  // seçim olduğu görünsün diye).
  document.querySelectorAll('[data-acc]').forEach(function (group) {
    var head = group.querySelector('.fct-head');
    if (head) {
      head.addEventListener('click', function () {
        group.classList.toggle('open');
      });
    }

    var dot = group.querySelector('.fct-dot');
    if (!dot) return;
    group.addEventListener('change', function () {
      var count = group.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked').length;
      dot.textContent = count;
      group.classList.toggle('has-active', count > 0);
    });
  });
})();
