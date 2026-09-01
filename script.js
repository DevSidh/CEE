const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
// Site-wide loading effect: a top progress bar that fills while the page loads, then fades out.
(function pageLoadProgress(){
  const bar=document.createElement('div');
  bar.id='pageProgress';
  bar.style.cssText='position:fixed;top:0;left:0;height:3px;width:0;background:linear-gradient(90deg,#6cb5ff,#1769e0);z-index:9999;transition:width .25s ease,opacity .4s ease;box-shadow:0 0 8px #1769e0aa';
  document.documentElement.appendChild(bar);
  requestAnimationFrame(()=>{bar.style.width='70%'});
  window.addEventListener('load',()=>{
    bar.style.width='100%';
    setTimeout(()=>{bar.style.opacity='0';setTimeout(()=>bar.remove(),400)},250);
  });
})();
const modal=$('#authModal');
$$('[data-auth]').forEach(b=>b.addEventListener('click',()=>{modal?.classList.add('show');$('#authEmail')?.focus()}));
$('#closeModal')?.addEventListener('click',()=>modal.classList.remove('show'));modal?.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('show')});
$('.mobile-toggle')?.addEventListener('click',()=>{$('.navbar').classList.toggle('open')});
$$('.faq-q').forEach(q=>q.addEventListener('click',()=>q.parentElement.classList.toggle('open')));
let taglines=['Start small. Show up Saturday.','Practice the patterns that repeat.','Build your CEE score, one set at a time.'];let ti=0,ci=0,del=false;const type=$('#typewriter');function typewrite(){if(!type||matchMedia('(prefers-reduced-motion: reduce)').matches)return;if(!del){type.textContent=taglines[ti].slice(0,++ci);if(ci===taglines[ti].length){del=true;setTimeout(typewrite,1500);return}}else{type.textContent=taglines[ti].slice(0,--ci);if(ci===0){del=false;ti=(ti+1)%taglines.length}}setTimeout(typewrite,del?28:55)}typewrite();
function countdown(){let next=new Date();next.setHours(9,0,0,0);while(next.getDay()!==6||next<new Date())next.setDate(next.getDate()+1);let d=next-new Date();let vals=[Math.floor(d/864e5),Math.floor(d/36e5)%24,Math.floor(d/6e4)%60,Math.floor(d/1e3)%60];['days','hours','mins','secs'].forEach((id,i)=>{let el=$('#'+id);if(el)el.firstChild.textContent=String(vals[i]).padStart(2,'0')});}countdown();setInterval(countdown,1000);
const testimonials=[['“The Saturday archive gave me a realistic cadence. I stopped guessing what to study and spent my time revising the exact weak areas.”','Aastha Shrestha','MBBS, 2080 intake'],['“The repeated-question bank made the units feel connected. I used it every weekend for the final three months.”','Prakash Koirala','BDS, 2080 intake'],['“Clear notes, honest solutions, and no noise. That was enough to make a serious difference in my preparation.”','Sakshi Rai','MBBS, 2079 intake']];let current=0;function showTestimonial(i){const t=testimonials[i];let q=$('#quote'),n=$('#personName'),r=$('#personRole');if(q){q.textContent=t[0];n.textContent=t[1];r.textContent=t[2];$$('.dots button').forEach((b,x)=>b.classList.toggle('active',x===i))}}$$('.dots button').forEach((b,i)=>b.addEventListener('click',()=>showTestimonial(current=i)));
$$('.filter').forEach(b=>b.addEventListener('click',()=>{let group=b.closest('.filterbar');group.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');let target=b.dataset.filter;let scope=group.dataset.target;document.querySelectorAll(scope+' [data-subject]').forEach(card=>card.style.display=(target==='all'||card.dataset.subject===target)?'':'none')}));
$$('#launchTest').forEach(button=>button.addEventListener('click',e=>{e.preventDefault();let o=$('#loader');o.classList.add('show');let tx=$('#loaderText'),sub=$('#loaderSub');setTimeout(()=>{tx.textContent='Shuffling repeated questions in';sub.textContent='Physics · Chemistry · Botany · Zoology'},1200);setTimeout(()=>{tx.textContent='Ready for Saturday.';tx.classList.add('loader-ready');sub.textContent='Your practice set is opening.'},2500);setTimeout(()=>{location.href='quiz.html?testId=42'},3400)}));
const initialSubject=new URLSearchParams(location.search).get('subject');if(initialSubject){[...$$('.filter')].find(b=>b.dataset.filter===initialSubject)?.click()}
// Lightweight SEO defaults for every static page. Change the canonical domain after deployment.
const seo={
  'index.html':['CEE Saturday | Free CEE practice tests, notes & video lectures','Free Saturday practice tests, handwritten notes and video lectures for Nepal CEE medical entrance aspirants.'],
  'saturday-tests.html':['CEE Saturday Tests | Weekly CEE practice archive','Take free CEE-style weekly practice sets and revise the most repeated concepts by subject.'],
  'notes.html':['CEE Notes | Unit-wise CEE revision notes','Download unit-wise Physics, Chemistry, Botany and Zoology revision notes for CEE Nepal.'],
  'videos.html':['CEE Video Lectures | CEE Saturday','Watch unit-wise CEE video lectures by subject from featured teachers.'],
  'quiz.html':['Saturday Quiz | CEE Saturday','Take this week’s free CEE-style Saturday practice set and get your score instantly.']
};
const page=location.pathname.split('/').pop()||'index.html',meta=seo[page]||seo['index.html'];
document.title=meta[0];
[['description',meta[1]],['robots','index,follow,max-image-preview:large'],['theme-color','#1769e0']].forEach(([name,content])=>{let el=document.querySelector(`meta[name="${name}"]`)||document.head.appendChild(document.createElement('meta'));el.name=name;el.content=content});
['og:title','og:description','twitter:title','twitter:description'].forEach((property,i)=>{let el=document.querySelector(`meta[property="${property}"]`)||document.head.appendChild(document.createElement('meta'));el.setAttribute('property',property);el.content=i%2?meta[1]:meta[0]});
