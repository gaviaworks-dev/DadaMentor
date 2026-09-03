/* =====================================================================
   SOZLUK-LISTE — SAYFA JS
   Temel: kaynak-transfer IIFE'si (reference/sozluk/sozluk-v1.html) — tüm
   yayındaki terimler sunucudan tek seferde DOM'a basılır; A-Z/kategori/arama
   filtresi + satır-içi accordion istemci-taraflı kalır.

   İŞ A-1 (istemci-taraflı sayfalama, Beyar): sonsuz tek liste yerine
   filtrelenmiş görünür set PAGE_SIZE'lık sayfalara bölünür. Sayfalama site
   ortak `.pagi/.pg` kitiyle JS render edilir (LengthAwarePaginator DEĞİL —
   veri seti istemci-filtreli, server-side sayfalama filtreleri bozardı;
   x-pagination component'i bu sayfaya uygun değil). URL senkron:
   ?harf/?kategori/?q/?page (paylaşılabilir); filtre/arama değişince sayfa 1'e
   döner; sayfa değişince liste başına yumuşak scroll. Tüm terimler yine
   DOM'da olduğundan SEO tam; JS yoksa liste tümüyle görünür.
   ===================================================================== */
(function(){
  var PAGE_SIZE=54; // 48-60 bandı ortası; 765 terim → en çok 15 sayfa, 3'e/9'a bölünür, rahat kaydırma
  var LETTERS='A B C Ç D E F G Ğ H I İ J K L M N O Ö P R S Ş T U Ü V Y Z'.split(' ');
  var bar=document.getElementById('azBar');
  var items=Array.prototype.slice.call(document.querySelectorAll('.term-item'));
  var present={};
  items.forEach(function(it){present[it.getAttribute('data-ltr')]=true;});
  LETTERS.forEach(function(L){
    var b=document.createElement('button');
    b.className='az';b.type='button';b.textContent=L;b.setAttribute('data-ltr',L);
    if(!present[L])b.disabled=true;
    bar.appendChild(b);
  });

  var state={ltr:'*',cat:'*',q:'',qRaw:'',page:1};
  var count=document.getElementById('szCount');
  var empty=document.getElementById('szEmpty');
  var list=document.getElementById('termList');
  var pagi=document.getElementById('szPagi');
  var total=list?parseInt(list.getAttribute('data-total'),10)||0:0;

  function matches(it){
    return (state.ltr==='*'||it.getAttribute('data-ltr')===state.ltr)
      && (state.cat==='*'||it.getAttribute('data-cat')===state.cat)
      && (state.q===''||(it.getAttribute('data-name')||'').indexOf(state.q)>-1);
  }

  /* ---- URL senkron (paylaşılabilir kombinasyon) ---- */
  function buildQuery(pageOverride){
    var p=new URLSearchParams();
    if(state.ltr!=='*')p.set('harf',state.ltr);
    if(state.cat!=='*')p.set('kategori',state.cat);
    if(state.qRaw!=='')p.set('q',state.qRaw);
    var pg=pageOverride!=null?pageOverride:state.page;
    if(pg>1)p.set('page',pg);
    var s=p.toString();
    return s?(location.pathname+'?'+s):location.pathname;
  }
  function syncUrl(){
    try{history.replaceState(null,'',buildQuery());}catch(e){}
  }

  /* ---- sayfalama markup (windowed: 1 … c-1 c c+1 … son) ---- */
  function pageTokens(cur,last){
    var out=[];
    for(var i=1;i<=last;i++){
      if(i===1||i===last||(i>=cur-1&&i<=cur+1))out.push(i);
      else if(out[out.length-1]!=='…')out.push('…');
    }
    return out;
  }
  function pgArrow(dir,target){
    var icon='<i class="fa-solid fa-chevron-'+dir+'" aria-hidden="true"></i>';
    if(target==null){
      var s=document.createElement('span');
      s.className='pg arrow';s.setAttribute('disabled','');s.setAttribute('aria-hidden','true');s.innerHTML=icon;
      return s;
    }
    var a=document.createElement('a');
    a.className='pg arrow';a.href=buildQuery(target);a.setAttribute('data-page',target);
    a.setAttribute('rel',dir==='left'?'prev':'next');
    a.setAttribute('aria-label',dir==='left'?'Önceki sayfa':'Sonraki sayfa');
    a.innerHTML=icon;
    return a;
  }
  function renderPagi(cur,last){
    pagi.innerHTML='';
    if(last<=1)return; // tek sayfa → sayfalama gizli
    var nav=document.createElement('nav');
    nav.className='pagi';nav.setAttribute('aria-label','Sayfalama');
    nav.appendChild(pgArrow('left',cur>1?cur-1:null));
    pageTokens(cur,last).forEach(function(t){
      if(t==='…'){
        var d=document.createElement('span');d.className='pg-dots';d.setAttribute('aria-hidden','true');d.textContent='…';nav.appendChild(d);
      }else{
        var a=document.createElement('a');
        a.className='pg'+(t===cur?' active':'');a.href=buildQuery(t);a.setAttribute('data-page',t);a.textContent=t;
        if(t===cur)a.setAttribute('aria-current','page');
        nav.appendChild(a);
      }
    });
    nav.appendChild(pgArrow('right',cur<last?cur+1:null));
    var note=document.createElement('span');
    note.className='pagi-note';note.textContent='Sayfa '+cur+' / '+last;
    nav.appendChild(note);
    pagi.appendChild(nav);
  }

  function apply(){
    var m=items.filter(matches);
    var n=m.length;
    var last=Math.max(1,Math.ceil(n/PAGE_SIZE));
    if(state.page>last)state.page=last;
    if(state.page<1)state.page=1;
    var start=(state.page-1)*PAGE_SIZE,end=start+PAGE_SIZE;
    var show={};
    m.forEach(function(it,idx){if(idx>=start&&idx<end)show[items.indexOf(it)]=true;});
    items.forEach(function(it,idx){
      var vis=!!show[idx];
      it.style.display=vis?'':'none';
      if(!vis)it.classList.remove('open'); // sayfa/filtre dışı satır kapanır
    });
    count.innerHTML=(n===total
      ? '<b>'+total+'</b> terim'
      : '<b>'+n+'</b> terim <span class="muted">· toplam '+total+' terim</span>');
    empty.style.display=n===0?'block':'none';
    list.style.display=n===0?'none':'';
    renderPagi(state.page,last);
    syncUrl();
  }

  /* ---- liste başına scroll (sayfa değişiminde) ---- */
  function scrollToTop(){
    var y=(count.getBoundingClientRect().top+window.pageYOffset)-130; // sticky header payı
    window.scrollTo({top:y<0?0:y,behavior:'smooth'});
  }
  function gotoPage(p){
    state.page=p;apply();scrollToTop();
  }

  /* ---- filtre kontrolleri (değişince sayfa 1'e döner) ---- */
  bar.addEventListener('click',function(e){
    var b=e.target.closest('.az');if(!b||b.disabled)return;
    bar.querySelectorAll('.az').forEach(function(x){x.classList.remove('active')});
    b.classList.add('active');
    state.ltr=b.getAttribute('data-ltr');state.page=1;apply();
  });
  // Kategori düğmesi sınıfı `.chip` → `.szc` (Beyar 2026-08-23): şerit
  // DadaFit yapısına geçti, düğmeler artık ikon + ad + sayı taşıyor ve
  // genel `.chip` diliyle aynı kutu değil. id'ler (szCats) DEĞİŞMEDİ.
  document.querySelectorAll('#szCats .szc').forEach(function(ch){
    ch.addEventListener('click',function(){
      document.querySelectorAll('#szCats .szc').forEach(function(x){x.classList.remove('active')});
      ch.classList.add('active');
      state.cat=ch.getAttribute('data-cat');state.page=1;apply();
    });
  });
  var inp=document.getElementById('szSearch');
  inp.addEventListener('input',function(){
    state.qRaw=inp.value.trim();
    state.q=state.qRaw.toLocaleLowerCase('tr');
    state.page=1;apply();
  });
  document.getElementById('szEmptyClear').addEventListener('click',function(){
    state={ltr:'*',cat:'*',q:'',qRaw:'',page:1};inp.value='';
    bar.querySelectorAll('.az').forEach(function(x){x.classList.remove('active')});
    bar.querySelector('.az-all').classList.add('active');
    document.querySelectorAll('#szCats .szc').forEach(function(x){x.classList.remove('active')});
    document.querySelector('#szCats .szc').classList.add('active');
    apply();
  });

  /* ---- sayfalama tıklaması (event delegation; gerçek href korunur —
          paylaşılabilir/orta-tık, ama JS istemci-taraflı geçiş yapar) ---- */
  pagi.addEventListener('click',function(e){
    var a=e.target.closest('.pg');
    if(!a||a.hasAttribute('disabled')||a.classList.contains('active'))return;
    var p=parseInt(a.getAttribute('data-page'),10);
    if(!p)return;
    e.preventDefault();
    gotoPage(p);
  });

  /* ---- accordion (BEYAR "üçüncü yol"): gövde aç/kapa; sağ ok = detay linki ---- */
  function toggleRow(row){
    if(!row)return;
    var it=row.parentElement;
    var was=it.classList.contains('open');
    document.querySelectorAll('.term-item.open').forEach(function(o){
      o.classList.remove('open');
      var r=o.querySelector('.term-row'); if(r)r.setAttribute('aria-expanded','false');
    });
    if(!was){it.classList.add('open');row.setAttribute('aria-expanded','true');}
  }
  document.querySelectorAll('.term-row').forEach(function(row){
    row.addEventListener('click',function(e){
      if(e.target.closest('.tr-go-link'))return; // sağ ok = detay linki
      toggleRow(row);
    });
    row.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleRow(row);}
    });
  });

  /* ---- derin link / URL geri-yükleme: ?harf ?kategori ?q ?page ?terim ---- */
  var qs=new URLSearchParams(location.search);
  var h=qs.get('harf');
  if(h){
    var hb=bar.querySelector('.az[data-ltr="'+h.toLocaleUpperCase('tr')+'"]');
    if(hb&&!hb.disabled){bar.querySelectorAll('.az').forEach(function(x){x.classList.remove('active')});hb.classList.add('active');state.ltr=hb.getAttribute('data-ltr');}
  }
  var kat=qs.get('kategori');
  if(kat){
    var kb=document.querySelector('#szCats .szc[data-cat="'+kat.replace(/"/g,'')+'"]');
    if(kb){document.querySelectorAll('#szCats .szc').forEach(function(x){x.classList.remove('active')});kb.classList.add('active');state.cat=kat;}
  }
  var qq=qs.get('q');
  if(qq){inp.value=qq;state.qRaw=qq.trim();state.q=state.qRaw.toLocaleLowerCase('tr');}
  var pgParam=parseInt(qs.get('page'),10);
  if(pgParam>0)state.page=pgParam;
  apply();

  var t=qs.get('terim');
  if(t){
    var el=document.getElementById('t-'+t);
    if(el){
      // hedef terim başka bir sayfadaysa o sayfaya geç
      var idx=items.filter(matches).indexOf(el);
      if(idx>=0){state.page=Math.floor(idx/PAGE_SIZE)+1;apply();}
      toggleRow(el.querySelector('.term-row'));
      setTimeout(function(){el.scrollIntoView({behavior:'smooth',block:'center'});},150);
    }
  }
})();

/* ---- MADDE 6 (Beyar revize paketi, 2026-07-20): kategori chip rayı kenar
   durumu (.has-overflow/.at-start/.at-end) — tarif-bulucu .mz-grid deseninin
   (31fec2e) BİREBİR portu. Kategori seti sunucudan sabit basıldığından
   (JS'le sonradan görünür olan yeni ray yok) tek seferlik ölçüm + scroll/
   resize senkronu yeterli, tarif-bulucu'daki accordion-tetikli re-measure
   burada gerekmiyor. ---- */
(function(){
  function syncEdges(g){
    var max=g.scrollWidth-g.clientWidth;
    var overflow=max>2;
    g.classList.toggle('has-overflow',overflow);
    g.classList.toggle('at-start',!overflow||g.scrollLeft<=2);
    g.classList.toggle('at-end',!overflow||g.scrollLeft>=max-2);
  }
  var cats=document.getElementById('szCats');
  if(!cats)return;
  syncEdges(cats);
  cats.addEventListener('scroll',function(){syncEdges(cats);},{passive:true});
  window.addEventListener('resize',function(){syncEdges(cats);});
})();
