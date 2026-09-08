/* T5B · LEAD sürücüsü — yalnız lead yazar.
   K11B · iç içe modal düzeltmesi. #moOverlay/#moModal ve #lkOverlay/#lkModal
   #fbModal'ın İÇİNDE duruyor; kapalı #fbOverlay'in opacity:0'ı yığın bağlamı
   yarattığı için bu iki modal açıldığında ETKİN OPAKLIK 0 kalıyor ve ekranda
   hiç çizilmiyor (ölçüldü: show=true · opacity=1 · etkin=0).
   Aynı yuvalama #toTop'u da vuruyor (ajan A'nın L3'ü): kapalı #fbModal
   pointer-events:none taşıyor ve KALITILIYOR — düğme boyanıyor, sürücüsü
   bağlı, ama fare tıklaması hiç ulaşmıyor (playwright tıklaması 6/6 zaman
   aşımı). A kalıtımı CSS ile geri verdi; doğru yer markup: Gastro ve Fit'te
   #toTop <body> çocuğu. Düğümler <body> çocuğuna taşınır — #fbOverlay
   zaten orada. */
(function () {
  var d = document;
  if (d.documentElement.dataset.t5bLeadModal) return;   /* idempotent */
  function tasi() {
    var n = 0;
    ['moOverlay', 'moModal', 'lkOverlay', 'lkModal', 'toTop'].forEach(function (id) {
      var e = d.getElementById(id);
      if (e && e.parentElement !== d.body) { d.body.appendChild(e); n++; }
    });
    if (n) d.documentElement.dataset.t5bLeadModal = String(n);
    else d.documentElement.dataset.t5bLeadModal = '0';
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', tasi);
  else tasi();
})();
