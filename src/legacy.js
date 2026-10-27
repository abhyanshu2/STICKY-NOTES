export function startLegacyApp() {

// ─────────── UTILITIES ───────────
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const nowISO = () => new Date().toISOString();
const fmtDate = iso => {
  if(!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
};
const fmtDateShort = iso => {
  if(!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
};
const countWords = s => (s||'').trim() ? (s||'').trim().split(/\s+/).length : 0;
const pad = n => String(n).padStart(2,'0');
const toLocalDT = iso => {
  if(!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toLocalD = iso => {
  if(!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
};
const isToday = iso => {
  if(!iso) return false;
  const d = new Date(iso), n = new Date();
  return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate();
};
const isOverdue = iso => {
  if(!iso) return false;
  return new Date(iso) < new Date() && !isToday(iso);
};
function debounce(fn,ms=160){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);}}

// ─────────── THEME ───────────
let currentTheme = localStorage.getItem('notiq_theme') || 'dark';
function applyTheme(theme){
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  $('#theme-icon').textContent = theme === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('notiq_theme', theme);
}
$('#theme-toggle').addEventListener('click', () => {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
});
applyTheme(currentTheme);

// ─────────── STATE ───────────
const NOTE_KEY = 'notiq_notes_v1';
const TASK_KEY = 'notiq_tasks_v1';
let notes = [], tasks = [];
let activeNoteId = null, editingTaskId = null;
let noteFilter = 'all', taskFilter = 'all';
let noteView = 'grid', noteSort = 'updated';
let noteSearchQ = '';
let selectedColor = '#f97316';
let pinned = false;
let selectedPrio = 'medium';
let lastDeletedNote = null, lastDeletedTask = null;
const reminderTimers = new Map();

// ─────────── STORAGE ───────────
function loadAll(){
  notes = JSON.parse(localStorage.getItem(NOTE_KEY)||'[]');
  tasks = JSON.parse(localStorage.getItem(TASK_KEY)||'[]');
}
function saveNotes(){ localStorage.setItem(NOTE_KEY, JSON.stringify(notes)); }
function saveTasks(){ localStorage.setItem(TASK_KEY, JSON.stringify(tasks)); }
function updateStorageUI(){
  const used = new Blob([localStorage.getItem(NOTE_KEY)||'',localStorage.getItem(TASK_KEY)||'']).size;
  const max = 5*1024*1024;
  const pct = Math.min(100, Math.round(used/max*100));
  $('#storage-fill').style.width = pct+'%';
  $('#storage-pct').textContent = pct+'%';
}

// ─────────── NAV / PANELS ───────────
let currentPanel = 'dashboard';
function showPanel(name){
  currentPanel = name;
  $$('.panel').forEach(p=>p.classList.remove('active'));
  $$('.nav-item').forEach(n=>n.classList.remove('active'));
  $('#panel-'+name).classList.add('active');
  $('[data-panel="'+name+'"]').classList.add('active');
  const titles = {dashboard:'Dashboard',notes:'Notes',todo:'Tasks'};
  $('#page-title').textContent = titles[name]||'Notiq';
  const labels = {dashboard:'New Note',notes:'New Note',todo:'New Task'};
  $('#add-btn-label').textContent = labels[name]||'New';
  $('.search-wrap').style.visibility = name==='notes'?'visible':'hidden';
  if(name==='notes') renderNotes();
  if(name==='todo') renderTasks();
  if(name==='dashboard') renderDashboard();
}
$$('.nav-item').forEach(item=>{
  item.addEventListener('click',()=>{ showPanel(item.dataset.panel); closeSidebar(); });
});
$$('.dash-card-link').forEach(link=>{
  link.addEventListener('click',()=>showPanel(link.dataset.panel));
});

const hamburger = $('#hamburger');
hamburger.addEventListener('click',()=>{
  $('#sidebar').classList.toggle('open');
  $('#mob-overlay').classList.toggle('open');
});
function closeSidebar(){
  $('#sidebar').classList.remove('open');
  $('#mob-overlay').classList.remove('open');
}
$('#mob-overlay').addEventListener('click',closeSidebar);

// ─────────── DASHBOARD ───────────
function renderDashboard(){
  const totalNotes = notes.length;
  const totalTasks = tasks.length;
  const pending = tasks.filter(t=>!t.done).length;
  const overdue = tasks.filter(t=>!t.done && t.due && isOverdue(t.due)).length;
  $('#d-notes').textContent = totalNotes;
  $('#d-tasks').textContent = totalTasks;
  $('#d-pending').textContent = pending;
  $('#d-overdue').textContent = overdue;

  const dnl = $('#dash-notes-list');
  const recent = [...notes].sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)).slice(0,4);
  if(recent.length===0){dnl.innerHTML='<div class="dash-empty">No notes yet. Create your first!</div>';}
  else{
    dnl.innerHTML='';
    recent.forEach(n=>{
      const el = document.createElement('div');
      el.className='dash-note-mini';
      el.style.setProperty('--note-c',n.color||'#f97316');
      el.innerHTML=`<div class="dash-note-mini-body">
        <div class="dash-note-mini-title">${esc(n.title||'Untitled')}</div>
        <div class="dash-note-mini-preview">${esc(n.body||'No content')}</div>
      </div>`;
      el.addEventListener('click',()=>{showPanel('notes');setTimeout(()=>openNoteEditor(n.id),50);});
      dnl.appendChild(el);
    });
  }

  const dtl = $('#dash-tasks-list');
  const pw = $('#dash-progress-wrap');
  if(tasks.length===0){
    dtl.innerHTML='<div class="dash-empty">No tasks yet. Add your first task!</div>';
    pw.style.display='none';
  } else {
    dtl.innerHTML='';
    const sorted=[...tasks].sort((a,b)=>{
      const pmap={high:0,medium:1,low:2};
      return (pmap[a.priority]||1)-(pmap[b.priority]||1);
    }).slice(0,5);
    sorted.forEach(t=>{
      const el=document.createElement('div');
      el.className='dash-todo-mini';
      const chk=document.createElement('div');
      chk.className='dash-todo-check-mini'+(t.done?' done':'');
      if(t.done) chk.innerHTML='<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
      chk.addEventListener('click',()=>{
        const idx=tasks.findIndex(x=>x.id===t.id);
        if(idx>=0){tasks[idx].done=!tasks[idx].done;saveTasks();renderDashboard();}
      });
      const dot=document.createElement('div');
      dot.className='dash-prio-dot '+(t.priority||'medium');
      const txt=document.createElement('div');
      txt.className='dash-todo-text-mini'+(t.done?' done':'');
      txt.textContent=t.text;
      el.appendChild(chk);el.appendChild(dot);el.appendChild(txt);
      dtl.appendChild(el);
    });
    const done=tasks.filter(t=>t.done).length;
    const pct=tasks.length?Math.round(done/tasks.length*100):0;
    pw.style.display='block';
    $('#dash-progress-fill').style.width=pct+'%';
    $('#dash-progress-pct').textContent=pct+'%';
  }
  updateBadges();
  updateStorageUI();
}

function updateBadges(){
  $('#notes-count').textContent=notes.length;
  $('#tasks-count').textContent=tasks.filter(t=>!t.done).length;
}

// ─────────── NOTES ───────────
function renderNotes(){
  const grid = $('#notes-grid');
  grid.className = 'notes-grid'+(noteView==='list'?' list-view':'');
  grid.innerHTML='';

  let filtered = noteSearchQ
    ? notes.filter(n=>(n.title||'').toLowerCase().includes(noteSearchQ)||(n.body||'').toLowerCase().includes(noteSearchQ))
    : [...notes];

  if(noteFilter==='pinned') filtered=filtered.filter(n=>n.pinned);
  if(noteFilter==='reminder') filtered=filtered.filter(n=>n.reminder&&!n.notified);

  filtered.sort((a,b)=>{
    if(noteSort==='pinned'){if(a.pinned!==b.pinned)return a.pinned?-1:1;}
    if(noteSort==='title') return (a.title||'').localeCompare(b.title||'');
    if(noteSort==='created') return new Date(b.createdAt)-new Date(a.createdAt);
    return new Date(b.updatedAt)-new Date(a.updatedAt);
  });
  if(noteSort!=='pinned') filtered.sort((a,b)=>a.pinned===b.pinned?0:a.pinned?-1:1);

  if(filtered.length===0){
    grid.innerHTML=`<div class="empty" style="grid-column:1/-1">
      <div class="empty-ico">📝</div>
      <h3>${noteSearchQ?'No notes found':'No notes yet'}</h3>
      <p>${noteSearchQ?'Try a different search term':'Click "New Note" to create your first note.'}</p>
    </div>`;
    return;
  }

  filtered.forEach(n=>{
    const card=document.createElement('div');
    card.className='note-card'+(n.pinned?' pinned':'');
    card.style.setProperty('--nc',n.color||'#f97316');
    card.dataset.id=n.id;

    card.innerHTML=`
      <div class="note-card-hd">
        <div class="note-title-text">${esc(n.title||'Untitled')}</div>
        <div class="note-actions-row">
          <button class="note-act-btn pin-btn" title="${n.pinned?'Unpin':'Pin'}">
            <svg viewBox="0 0 24 24" fill="${n.pinned?'#f59e0b':'none'}" stroke="${n.pinned?'#f59e0b':'currentColor'}" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </button>
          <button class="note-act-btn edit-btn" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="note-act-btn del" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>
      <div class="note-body-text">${esc(n.body||'')}</div>
      <div class="note-foot">
        <span class="note-date">${fmtDate(n.updatedAt)}</span>
        ${n.pinned?'<span class="note-pin-badge">📌 Pinned</span>':''}
        ${n.reminder&&!n.notified?`<span class="note-rem-badge">🔔 ${fmtDateShort(n.reminder)}</span>`:''}
        ${n.body?`<span class="note-wc">${countWords(n.body)}w</span>`:''}
      </div>`;

    card.querySelector('.pin-btn').addEventListener('click',e=>{e.stopPropagation();toggleNotePin(n.id);});
    card.querySelector('.edit-btn').addEventListener('click',e=>{e.stopPropagation();openNoteEditor(n.id);});
    card.querySelector('.del').addEventListener('click',e=>{e.stopPropagation();deleteNote(n.id);});
    card.addEventListener('click',()=>openNoteEditor(n.id));

    card.draggable=true;
    card.addEventListener('dragstart',e=>{e.dataTransfer.setData('noteId',n.id);card.style.opacity='.5';});
    card.addEventListener('dragend',()=>{card.style.opacity='1';});
    card.addEventListener('dragover',e=>{e.preventDefault();card.style.background='var(--card2)';});
    card.addEventListener('dragleave',()=>{card.style.background='';});
    card.addEventListener('drop',e=>{
      e.preventDefault();card.style.background='';
      const draggedId=e.dataTransfer.getData('noteId');
      if(draggedId===n.id)return;
      const di=notes.findIndex(x=>x.id===draggedId);
      const ti=notes.findIndex(x=>x.id===n.id);
      if(di>=0&&ti>=0){[notes[di],notes[ti]]=[notes[ti],notes[di]];saveNotes();renderNotes();}
    });
    grid.appendChild(card);
  });
  updateBadges();
  updateStorageUI();
}

function toggleNotePin(id){
  const n=notes.find(x=>x.id===id);
  if(!n)return;
  n.pinned=!n.pinned;n.updatedAt=nowISO();
  saveNotes();renderNotes();
}

function deleteNote(id){
  const idx=notes.findIndex(x=>x.id===id);
  if(idx<0)return;
  lastDeletedNote=notes[idx];
  notes.splice(idx,1);
  saveNotes();renderNotes();
  showSnack('Note deleted',()=>{
    notes.unshift(lastDeletedNote);lastDeletedNote=null;
    saveNotes();renderNotes();
  });
}

function openNoteEditor(id=null){
  activeNoteId=id;
  pinned=false;
  selectedColor='#f97316';

  if(!id){
    $('#modal-lbl').textContent='New Note';
    $('#note-title-inp').value='';
    $('#note-body-inp').value='';
    $('#note-reminder').value='';
    pinned=false;
  } else {
    const n=notes.find(x=>x.id===id);
    if(!n)return;
    $('#modal-lbl').textContent='Edit Note';
    $('#note-title-inp').value=n.title||'';
    $('#note-body-inp').value=n.body||'';
    $('#note-reminder').value=n.reminder?toLocalDT(n.reminder):'';
    pinned=!!n.pinned;
    selectedColor=n.color||'#f97316';
  }

  $('#pin-toggle').classList.toggle('on',pinned);
  $$('.cdot').forEach(d=>{d.classList.toggle('sel',d.dataset.color===selectedColor);});
  updateModalWC();

  $('#note-modal-ov').classList.add('open');
  setTimeout(()=>$('#note-title-inp').focus(),120);
}

function closeNoteEditor(){
  $('#note-modal-ov').classList.remove('open');
  activeNoteId=null;
}

function saveNote(){
  const title=$('#note-title-inp').value.trim()||'Untitled';
  const body=$('#note-body-inp').value.trim();
  const reminderLocal=$('#note-reminder').value;
  const reminderAt=reminderLocal?new Date(reminderLocal).toISOString():null;

  if(activeNoteId){
    const n=notes.find(x=>x.id===activeNoteId);
    if(!n)return;
    n.title=title;n.body=body;n.color=selectedColor;n.pinned=pinned;
    n.reminder=reminderAt;n.notified=false;n.updatedAt=nowISO();
  } else {
    notes.unshift({
      id:uid(),title,body,color:selectedColor,pinned,
      createdAt:nowISO(),updatedAt:nowISO(),
      reminder:reminderAt,notified:false
    });
  }
  saveNotes();scheduleAllReminders();
  closeNoteEditor();
  if(currentPanel==='notes') renderNotes();
  if(currentPanel==='dashboard') renderDashboard();
  updateBadges();
}

function updateModalWC(){
  const w=countWords($('#note-body-inp').value);
  $('#modal-wc').textContent=w+' word'+(w===1?'':'s');
}

$$('.cdot').forEach(dot=>{
  dot.addEventListener('click',()=>{
    selectedColor=dot.dataset.color;
    $$('.cdot').forEach(d=>d.classList.toggle('sel',d===dot));
  });
});
$('#pin-toggle').addEventListener('click',()=>{
  pinned=!pinned;
  $('#pin-toggle').classList.toggle('on',pinned);
});
$('#note-body-inp').addEventListener('input',updateModalWC);
$('#modal-save-btn').addEventListener('click',saveNote);
$('#modal-cancel-btn').addEventListener('click',closeNoteEditor);
$('#modal-close-btn').addEventListener('click',closeNoteEditor);
$('#note-modal-ov').addEventListener('click',e=>{if(e.target===$('#note-modal-ov'))closeNoteEditor();});

$('#search-input').addEventListener('input',debounce(e=>{
  noteSearchQ=e.target.value.trim().toLowerCase();
  renderNotes();
},180));

$$('.ftab[data-filter]').forEach(t=>{
  t.addEventListener('click',()=>{
    $$('.ftab[data-filter]').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    noteFilter=t.dataset.filter;
    renderNotes();
  });
});

$('#vbtn-grid').addEventListener('click',()=>{
  noteView='grid';
  $('#vbtn-grid').classList.add('active');
  $('#vbtn-list').classList.remove('active');
  renderNotes();
});
$('#vbtn-list').addEventListener('click',()=>{
  noteView='list';
  $('#vbtn-list').classList.add('active');
  $('#vbtn-grid').classList.remove('active');
  renderNotes();
});
$('#sort-select').addEventListener('change',e=>{noteSort=e.target.value;renderNotes();});

// ─────────── TASKS ───────────
function renderTasks(){
  const list=$('#todo-list');
  list.innerHTML='';

  let filtered=[...tasks];
  if(taskFilter==='active') filtered=filtered.filter(t=>!t.done);
  if(taskFilter==='done') filtered=filtered.filter(t=>t.done);
  if(taskFilter==='high') filtered=filtered.filter(t=>t.priority==='high');
  if(taskFilter==='today') filtered=filtered.filter(t=>t.due&&isToday(t.due));

  filtered.sort((a,b)=>{
    if(a.done!==b.done) return a.done?1:-1;
    const pm={high:0,medium:1,low:2};
    const pa=pm[a.priority]??1, pb=pm[b.priority]??1;
    if(pa!==pb) return pa-pb;
    if(a.due&&b.due) return new Date(a.due)-new Date(b.due);
    if(a.due) return -1;if(b.due) return 1;
    return 0;
  });

  const active=tasks.filter(t=>!t.done).length;
  const done=tasks.filter(t=>t.done).length;
  $('#todo-stat-txt').textContent=`${active} remaining · ${done} done`;

  if(filtered.length===0){
    list.innerHTML=`<div class="empty">
      <div class="empty-ico">✅</div>
      <h3>${taskFilter==='done'?'No completed tasks':'No tasks here'}</h3>
      <p>${taskFilter==='all'?'Add a task above to get started.':'Try a different filter.'}</p>
    </div>`;
    updateBadges();
    return;
  }

  filtered.forEach(t=>{
    const item=document.createElement('div');
    item.className='todo-item'+(t.done?' done':'');
    item.dataset.p=t.priority||'medium';
    item.dataset.id=t.id;

    const dueTxt=t.due
      ? (isOverdue(t.due)&&!t.done
        ? `<span class="todo-due-txt overdue">⚠ Overdue · ${fmtDateShort(t.due)}</span>`
        : isToday(t.due)
          ? `<span class="todo-due-txt today">📅 Today</span>`
          : `<span class="todo-due-txt">📅 ${fmtDateShort(t.due)}</span>`)
      : '';

    item.innerHTML=`
      <div class="todo-chk">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="todo-content">
        <div class="todo-text">${esc(t.text)}</div>
        <div class="todo-info">
          <span class="prio-badge">${(t.priority||'medium').toUpperCase()}</span>
          ${dueTxt}
        </div>
      </div>
      <div class="todo-item-actions">
        <button class="todo-ia-btn edit" title="Edit task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="todo-ia-btn" title="Delete task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        </button>
      </div>`;

    item.querySelector('.todo-chk').addEventListener('click',()=>toggleTask(t.id));
    item.querySelector('.todo-ia-btn.edit').addEventListener('click',()=>openEditTask(t.id));
    item.querySelectorAll('.todo-ia-btn:not(.edit)')[0].addEventListener('click',()=>deleteTask(t.id));
    list.appendChild(item);
  });
  updateBadges();
  updateStorageUI();
}

function addTask(){
  const text=$('#todo-input').value.trim();
  if(!text) return;
  const due=$('#todo-due').value;
  tasks.unshift({
    id:uid(),text,done:false,
    priority:selectedPrio,
    due:due?new Date(due).toISOString():null,
    createdAt:nowISO()
  });
  $('#todo-input').value='';
  $('#todo-due').value='';
  saveTasks();renderTasks();
}

function toggleTask(id){
  const t=tasks.find(x=>x.id===id);
  if(!t)return;
  t.done=!t.done;
  saveTasks();renderTasks();
  if(currentPanel==='dashboard') renderDashboard();
}

function deleteTask(id){
  const idx=tasks.findIndex(x=>x.id===id);
  if(idx<0)return;
  lastDeletedTask=tasks[idx];
  tasks.splice(idx,1);
  saveTasks();renderTasks();
  showSnack('Task deleted',()=>{
    tasks.unshift(lastDeletedTask);lastDeletedTask=null;
    saveTasks();renderTasks();
  });
}

function openEditTask(id){
  editingTaskId=id;
  const t=tasks.find(x=>x.id===id);
  if(!t)return;
  $('#etm-text').value=t.text;
  $('#etm-due').value=t.due?toLocalD(t.due):'';
  $$('#etm-pchips .pchip').forEach(c=>{
    c.classList.toggle('sel',c.dataset.p===(t.priority||'medium'));
  });
  $('#task-modal-ov').classList.add('open');
  setTimeout(()=>$('#etm-text').focus(),80);
}

function saveEditTask(){
  const t=tasks.find(x=>x.id===editingTaskId);
  if(!t)return;
  t.text=$('#etm-text').value.trim()||t.text;
  const p=$$('#etm-pchips .pchip.sel')[0];
  t.priority=p?p.dataset.p:'medium';
  const due=$('#etm-due').value;
  t.due=due?new Date(due).toISOString():null;
  saveTasks();renderTasks();
  $('#task-modal-ov').classList.remove('open');
  editingTaskId=null;
}

$$('#etm-pchips .pchip').forEach(c=>{
  c.addEventListener('click',()=>{
    $$('#etm-pchips .pchip').forEach(x=>x.classList.remove('sel'));
    c.classList.add('sel');
  });
});
$('#etm-save').addEventListener('click',saveEditTask);
$('#etm-cancel').addEventListener('click',()=>{$('#task-modal-ov').classList.remove('open');editingTaskId=null;});
$('#task-modal-ov').addEventListener('click',e=>{if(e.target===$('#task-modal-ov')){$('#task-modal-ov').classList.remove('open');editingTaskId=null;}});

$$('.pchips:not(#etm-pchips) .pchip').forEach(c=>{
  c.addEventListener('click',()=>{
    $$('.pchips:not(#etm-pchips) .pchip').forEach(x=>x.classList.remove('sel'));
    c.classList.add('sel');
    selectedPrio=c.dataset.p;
  });
});

$$('.ftab[data-tf]').forEach(t=>{
  t.addEventListener('click',()=>{
    $$('.ftab[data-tf]').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    taskFilter=t.dataset.tf;
    renderTasks();
  });
});

$('#todo-add-btn').addEventListener('click',addTask);
$('#todo-input').addEventListener('keydown',e=>{if(e.key==='Enter')addTask();});
$('#clear-done-btn').addEventListener('click',()=>{
  tasks=tasks.filter(t=>!t.done);
  saveTasks();renderTasks();
  showSnack('Cleared all done tasks');
});

$('#add-btn').addEventListener('click',()=>{
  if(currentPanel==='todo'){ $('#todo-input').focus(); }
  else { showPanel('notes'); openNoteEditor(); }
});

// ─────────── SNACKBAR ───────────
let snackTimer=null;
function showSnack(msg,undoFn=null){
  clearTimeout(snackTimer);
  $('#snack-msg').textContent=msg;
  const undoEl=$('#snack-undo');
  undoEl.style.display=undoFn?'inline':'none';
  $('#snackbar').classList.add('show');
  undoEl.onclick=()=>{
    if(undoFn)undoFn();
    $('#snackbar').classList.remove('show');
    clearTimeout(snackTimer);
  };
  snackTimer=setTimeout(()=>$('#snackbar').classList.remove('show'),4000);
}

// ─────────── REMINDERS ───────────
function scheduleReminder(n){
  if(reminderTimers.has(n.id)){clearTimeout(reminderTimers.get(n.id));reminderTimers.delete(n.id);}
  if(!n.reminder||n.notified)return;
  const delay=new Date(n.reminder).getTime()-Date.now();
  if(delay<=0){fireReminder(n);return;}
  reminderTimers.set(n.id,setTimeout(()=>fireReminder(n),delay));
}
function scheduleAllReminders(){reminderTimers.forEach(clearTimeout);reminderTimers.clear();notes.forEach(scheduleReminder);}
function fireReminder(n){
  n.notified=true;n.updatedAt=nowISO();saveNotes();
  if(currentPanel==='notes')renderNotes();
  if(currentPanel==='dashboard')renderDashboard();
  showNotifBanner(n.title||'Untitled',n.body||'Time to check your note!');
  if('Notification' in window&&Notification.permission==='granted'){
    new Notification('🔔 '+(n.title||'Reminder'),{body:n.body||'Check your note!'});
  }
}
function showNotifBanner(title,body){
  $('#notif-title').textContent='🔔 '+title;
  $('#notif-body').textContent=body;
  $('#notif-banner').style.display='block';
  setTimeout(()=>$('#notif-banner').style.display='none',5000);
}

// ─────────── KEYBOARD SHORTCUTS ───────────
document.addEventListener('keydown',e=>{
  const noteModalOpen=$('#note-modal-ov').classList.contains('open');
  const taskModalOpen=$('#task-modal-ov').classList.contains('open');
  if(noteModalOpen){
    if(e.key==='Escape'){e.preventDefault();closeNoteEditor();}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='enter'){e.preventDefault();saveNote();}
  } else if(taskModalOpen){
    if(e.key==='Escape'){e.preventDefault();$('#task-modal-ov').classList.remove('open');editingTaskId=null;}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='enter'){e.preventDefault();saveEditTask();}
  } else {
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='n'){e.preventDefault();openNoteEditor();}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='1'){e.preventDefault();showPanel('dashboard');}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='2'){e.preventDefault();showPanel('notes');}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='3'){e.preventDefault();showPanel('todo');}
  }
});

function esc(s){
  if(!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─────────── INIT ───────────
(function init(){
  loadAll();
  renderDashboard();
  scheduleAllReminders();
  if('Notification' in window && Notification.permission==='default'){
    Notification.requestPermission();
  }
})();

}