const api=window.CEE_API_URL||'http://localhost:3000/api';
const status=document.querySelector('#quizStatus'),form=document.querySelector('#quizForm'),submit=document.querySelector('#submitQuiz');
const testId=Number(new URLSearchParams(location.search).get('testId')||42);
let questions=[];

function escapeHtml(value){
  return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

async function loadQuiz(){
  try{
    if(!Number.isInteger(testId))throw new Error('Invalid test id.');
    status.hidden=false;
    try {
      const testResponse=await fetch(`${api}/tests/${encodeURIComponent(testId)}`,{credentials:"include"});
      if(testResponse.ok){
        const test=await testResponse.json();
        document.title=`Set ${test.id} — ${test.title} | CEE Saturday`;
        const heading=document.querySelector('.quiz-shell h1');
        const eyebrow=document.querySelector('.quiz-shell .eyebrow');
        const sub=document.querySelector('.quiz-shell .section-sub');
        if(heading)heading.textContent=`Set ${test.id}: ${test.title}`;
        if(eyebrow)eyebrow.textContent=`Week ${test.week_number} · Saturday practice`;
        if(sub)sub.textContent=`${test.question_count} questions · ${test.duration_minutes} minutes. Choose the best answer for each question.`;
      }
    } catch (_) {}
    form.hidden=true;
    submit.hidden=true;
    const res=await fetch(`${api}/questions?testId=${encodeURIComponent(testId)}`,{credentials:"include"});
    if(!res.ok){
      const body=await res.json().catch(()=>({}));
      throw new Error(body.error||'The quiz service is unavailable.');
    }
    const payload=await res.json();
    questions=Array.isArray(payload)?payload:(payload.questions||[]);
    if(!questions.length)throw new Error('No questions have been published for this set yet.');
    status.hidden=true;
    form.hidden=false;
    submit.hidden=false;
    form.innerHTML=questions.map((q,i)=>`<article class="archive-card quiz-question">
      <span class="tag">${escapeHtml(q.subject).toUpperCase()} · ${escapeHtml(q.unit)}</span>
      <h3>${i+1}. ${escapeHtml(q.prompt)}</h3>
      ${['a','b','c','d'].map(k=>`<label><input required type="radio" name="q${q.id}" value="${k}"><span>${escapeHtml(q[`option_${k}`])}</span></label>`).join('')}
    </article>`).join('');
  }catch(error){
    status.hidden=false;
    form.hidden=true;
    submit.hidden=true;
    status.innerHTML=`<strong>Quiz connection needed</strong><br>${escapeHtml(error.message)}<br><br>Start the backend at <code>http://localhost:3000</code>, then open this site through a local static server.`;
  }
}

submit.addEventListener('click',async()=>{
  if(!form.reportValidity())return;
  submit.disabled=true;
  submit.textContent='Checking answers…';
  const answers=questions.map(q=>({questionId:q.id,option:new FormData(form).get(`q${q.id}`)}));
  try{
    const res=await fetch(`${api}/attempts`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({testId,answers})});
    const result=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(result.error||'Could not submit your result.');
    form.hidden=true;
    submit.hidden=true;
    status.hidden=false;
    status.innerHTML=`<span class="tag">RESULT</span><h2 style="margin:10px 0">${result.score}/${result.total} correct</h2><p>Your score is ${result.percentage}%. Review the repeated-question bank to plan your next revision.</p><a class="btn" href="saturday-tests.html#repeated">Review repeated questions</a>`;
  }catch(error){
    submit.disabled=false;
    submit.textContent='Submit my answers';
    alert(error.message||'Could not submit your result. Check that the backend is running.');
  }
});

loadQuiz();
