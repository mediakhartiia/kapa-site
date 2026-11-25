(function(){
  var q=location.search, d=document.documentElement;
  // Показ: рух увімкнено, навіть коли в системі «зменшити рух». ?motion=0 вимикає.
  // На продакшені: рух лише без prefers-reduced-motion або з ?motion=1.
  var PREVIEW=false;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var on=/motion=1/.test(q)||(PREVIEW&&!/motion=0/.test(q))||!reduce;
  if(/motion=0/.test(q))on=false;
  if(on)d.classList.add('mo');
  window.K={motion:on};

  // поява
  var els=[].slice.call(document.querySelectorAll('.rv,[data-in]'));
  if(on&&'IntersectionObserver'in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -12% 0px'});
    els.forEach(function(e){io.observe(e)});
  }else els.forEach(function(e){e.classList.add('is-in')});

  // шапка й прилипла кнопка
  var hd=document.querySelector('.hd'), cta=document.querySelector('.cta');
  var offs=[].slice.call(document.querySelectorAll('[data-cta-off]'));
  var lights=[].slice.call(document.querySelectorAll('[data-light]'));
  function tick(){
    var y=scrollY, vh=innerHeight;
    if(hd){
      hd.classList.toggle('is-solid',y>vh*.6);
      var onL=lights.some(function(s){var r=s.getBoundingClientRect();return r.top<=36&&r.bottom>36});
      hd.classList.toggle('on-light',onL);
    }
    if(cta){
      var hide=offs.some(function(s){var r=s.getBoundingClientRect();return r.top<vh-120&&r.bottom>120});
      cta.classList.toggle('is-off',hide);
    }
    var vt=document.querySelector('.vtag');if(vt)vt.style.opacity=y>200?0:1;
    (window.K.ticks||[]).forEach(function(f){f(y,vh)});
  }
  window.K.ticks=[];
  window.K.progress=function(el){var r=el.getBoundingClientRect(),h=r.height-innerHeight;return h<=0?(r.top<0?1:0):Math.min(1,Math.max(0,-r.top/h))};
  var raf=0;addEventListener('scroll',function(){if(!raf)raf=requestAnimationFrame(function(){raf=0;tick()})},{passive:true});
  addEventListener('resize',tick);addEventListener('load',tick);
  window.K.tick=tick;setTimeout(tick,0);

  // форма → api/lead.js → контакт-центр 3333
  var DIRN={instr:'Інструктори',drill:'Дрілл-сержанти',ofic:'Офіцерські посади',zabez:'Забезпечення'};
  [].forEach.call(document.querySelectorAll('form.lead'),function(f){
    var b=f.querySelector('button[type=submit]'),bt=b.querySelector('span'),srv=f.querySelector('.srv'),T=bt.textContent;
    f.addEventListener('submit',function(e){
      e.preventDefault();if(b.getAttribute('aria-busy')==='true')return;var ok=true;
      [].forEach.call(f.querySelectorAll('[required]'),function(i){
        var fl=i.closest('.fld');var bad=i.type==='checkbox'?!i.checked:!i.value.trim();
        if(i.name==='name'&&!bad)bad=i.value.trim().length<2;
        if(i.type==='tel'&&!bad)bad=i.value.replace(/\D/g,'').length<10;
        if(fl)fl.classList.toggle('err',bad);i.setAttribute('aria-invalid',bad?'true':'false');
        if(bad&&ok){i.focus();ok=false}
      });
      if(!ok)return;
      var d=f.elements.tel.value.replace(/\D/g,'');if(d.length===10&&d[0]==='0')d='38'+d;if(d.length===9)d='380'+d;
      var st=f.querySelector('input[name=st]:checked');
      var data={name:f.elements.name.value.trim(),phone:'+'+d,email:'',direction:DIRN[f.elements.dir.value]||'Потрібна консультація',
        status:st&&st.value==='civ'?'Цивільний':'Військовий',consent:f.elements.consent.checked,company:f.elements.company.value,page:innerWidth<=720?'mobile':'desktop'};
      srv.hidden=true;b.setAttribute('aria-busy','true');bt.textContent='Надсилаємо…';
      fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
      .then(function(r){if(!r.ok)throw new Error(r.status);f.classList.add('is-sent');var h=f.querySelector('.done [tabindex]');if(h)h.focus()})
      .catch(function(){srv.innerHTML='Не вдалося надіслати заявку. Дані лишились у формі — спробуй ще раз або телефонуй <a href="tel:3333">3333</a>.';srv.hidden=false;bt.textContent='Надіслати ще раз'})
      .then(function(){b.removeAttribute('aria-busy');if(bt.textContent==='Надсилаємо…')bt.textContent=T});
    });
  });
  // кнопки «на цю посаду» підставляють напрям
  document.addEventListener('click',function(e){
    var a=e.target.closest('[data-dir]');if(!a)return;
    var s=document.querySelector('form.lead select[name=dir]');if(s)s.value=a.getAttribute('data-dir');
  });
})();
