import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, ChevronLeft, ChevronRight, Calendar, BarChart2, X,
  Trash2, Star, ShieldAlert, Flame, Search, AlertTriangle,
  Inbox, LogOut, Loader2, CalendarDays, PlayCircle, Circle,
  CheckCircle2, XCircle, ArrowRight, Zap, TrendingUp,
  TrendingDown, Minus, Clock, History, Building2, Award,
  Users, UserCheck, Bell, Copy, ClipboardList, Eye,
  Timer, Link2, Sun, Moon, Zap as ZapIcon, Coffee,
  BatteryFull, BatteryMedium, BatteryLow, Sunrise,
  Sunset, CheckSquare, Link, Unlink, SkipForward,
  MessageSquare, Target, Activity, RefreshCw
} from "lucide-react";
import { DEMO_MODE, supabase } from "./lib/supabase.js";
import { loadTasks, saveTasks, loadTasksFromDB, saveTaskToDB, deleteTaskFromDB } from "./lib/storage.js";

// ─── THEME ───────────────────────────────────────────────────────────────────
const BG   = "#0a0a14";
const S1   = "#0f0f1e";
const S2   = "#161628";
const S3   = "#1e1e38";
const BD   = "#242444";
const BD2  = "#333360";
const ACC  = "#7c3aed";
const ACCL = "#a78bfa";
const T1   = "#ffffff";
const T2   = "#b8b8d8";
const T3   = "#686890";
const GCAL = "#10b981";

// ─── GRID ────────────────────────────────────────────────────────────────────
const HOUR_H  = 56;
const START_H = 6;
const END_H   = 23;
const HOURS   = Array.from({ length: END_H - START_H }, (_, i) => i + START_H);

// ─── TASK TYPES ──────────────────────────────────────────────────────────────
const TASK_TYPES = {
  work:     { label: "Work",     color: "#818cf8", bg: "rgba(129,140,248,.18)", border: "rgba(129,140,248,.38)", icon: "💼" },
  meeting:  { label: "Meeting",  color: "#34d399", bg: "rgba(52,211,153,.18)",  border: "rgba(52,211,153,.38)",  icon: "👥" },
  personal: { label: "Personal", color: "#60a5fa", bg: "rgba(96,165,250,.18)",  border: "rgba(96,165,250,.38)",  icon: "🙋" },
};

// ─── PRIORITIES ──────────────────────────────────────────────────────────────
const PRIO = {
  urgent: { label: "Urgent", dot: "#f87171", bg: "rgba(248,113,113,.18)", border: "rgba(248,113,113,.38)" },
  high:   { label: "High",   dot: "#fb923c", bg: "rgba(251,146,60,.18)",  border: "rgba(251,146,60,.38)" },
  normal: { label: "Normal", dot: "#818cf8", bg: "rgba(129,140,248,.12)", border: "rgba(129,140,248,.28)" },
};

// ─── STATUSES ────────────────────────────────────────────────────────────────
const STATUS = {
  not_started: { label: "Not Started", color: "#94a3b8", bg: "rgba(148,163,184,.18)", border: "rgba(148,163,184,.35)", Icon: Circle,       next: "in_progress" },
  in_progress: { label: "In Progress", color: "#60a5fa", bg: "rgba(96,165,250,.18)",  border: "rgba(96,165,250,.35)",  Icon: PlayCircle,   next: "done" },
  done:        { label: "Done",        color: "#34d399", bg: "rgba(52,211,153,.18)",  border: "rgba(52,211,153,.35)",  Icon: CheckCircle2, next: "not_started" },
  cancelled:   { label: "Cancelled",   color: "#f87171", bg: "rgba(248,113,113,.18)", border: "rgba(248,113,113,.35)", Icon: XCircle,      next: "not_started" },
};

// ─── DEPARTMENTS ─────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  { code: "OP", name: "Operations",       color: "#a5b4fc", bg: "#1e1b4b" },
  { code: "MT", name: "Maintenance",      color: "#fb923c", bg: "#431407" },
  { code: "MS", name: "Marketing & Sales",color: "#f9a8d4", bg: "#500724" },
  { code: "HR", name: "Human Resources",  color: "#d8b4fe", bg: "#3b0764" },
  { code: "PU", name: "Purchasing",       color: "#67e8f9", bg: "#083344" },
  { code: "SF", name: "Safety",           color: "#fca5a5", bg: "#450a0a" },
  { code: "BD", name: "Business Dev",     color: "#c4b5fd", bg: "#2e1065" },
  { code: "MR", name: "Mgmt Rep",         color: "#fcd34d", bg: "#451a03" },
  { code: "EX", name: "Executive",        color: "#e2e8f0", bg: "#1e293b" },
];
const DEPT = Object.fromEntries(DEPARTMENTS.map(d => [d.code, d]));

// ─── DATE / TIME HELPERS ─────────────────────────────────────────────────────
const fd      = d  => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today   = () => fd(new Date());
const addD    = (s, n) => { const [y,m,d]=s.split('-').map(Number), dt=new Date(y,m-1,d); dt.setDate(dt.getDate()+n); return fd(dt); };
const addM    = (s, n) => { const [y,m,d]=s.split('-').map(Number), dt=new Date(y,m-1,d); dt.setMonth(dt.getMonth()+n); return fd(dt); };
const WSHORT  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MSHORT  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const wday    = s => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d).getDay(); };
const wshort  = s => WSHORT[wday(s)];
const mday    = s => { const [,m,d]=s.split('-').map(Number); return `${MSHORT[m-1]} ${+d}`; };
const fmtLong = s => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}); };
const fmtTs   = iso => new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
function weekDays(s) {
  const [y,m,d]=s.split('-').map(Number), dt=new Date(y,m-1,d), day=dt.getDay();
  dt.setDate(dt.getDate()-(day===0?6:day-1));
  return Array.from({length:7},(_,i)=>addD(fd(dt),i));
}
const daysUntil = s => { if(!s) return null; const t=today(); if(s<t) return -(Math.round((new Date(t)-new Date(s))/86400000)); return Math.round((new Date(s)-new Date(t))/86400000); };
const dueLabel = s => {
  if(!s) return null;
  const d=daysUntil(s);
  if(d<0)  return { text:`${-d}d overdue`, color:'#f87171' };
  if(d===0) return { text:'Due Today',    color:'#fbbf24' };
  if(d===1) return { text:'Tomorrow',     color:'#a78bfa' };
  if(d<=7)  return { text:`${d}d left`,   color:T2 };
  return       { text:mday(s),           color:T3 };
};
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const to12h = t => { if(!t) return ''; const [h,m]=t.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`; };
const minutesBetween = (s,e) => { if(!s||!e) return 0; const [sh,sm]=s.split(':').map(Number),[eh,em]=e.split(':').map(Number); return (eh*60+em)-(sh*60+sm); };
const fmtDuration = mins => mins>0?`${Math.floor(mins/60)}h ${mins%60}m`:'';

// ─── COLOR ───────────────────────────────────────────────────────────────────
function blockColor(task) {
  if(task.priority==='urgent') return { color:'#f87171', bg:'rgba(248,113,113,.2)',  border:'rgba(248,113,113,.45)', left:'#f87171' };
  if(task.priority==='high')   return { color:'#fb923c', bg:'rgba(251,146,60,.2)',   border:'rgba(251,146,60,.45)',  left:'#fb923c' };
  const tt = TASK_TYPES[task.taskType||'work'];
  if(task.taskType==='meeting')  return { color:tt.color, bg:tt.bg, border:tt.border, left:tt.color };
  if(task.taskType==='personal') return { color:tt.color, bg:tt.bg, border:tt.border, left:tt.color };
  const d = task.department ? DEPT[task.department] : null;
  if(d) return { color:d.color, bg:d.bg+'dd', border:d.color+'66', left:d.color };
  return { color:tt.color, bg:tt.bg, border:tt.border, left:tt.color };
}

// ─── MIGRATION ───────────────────────────────────────────────────────────────
function migrate(list) {
  return list.map(tk => {
    if(!tk.status||tk.status==='pending') tk = {...tk, status:'not_started'};
    if(!tk.sessions) {
      const s = tk.scheduledDate && tk.scheduledTime
        ? [{ id:uid(), date:tk.scheduledDate, startTime:tk.scheduledTime, endTime:tk.endTime||null }]
        : [];
      tk = {...tk, sessions:s};
    }
    if(!tk.statusHistory) tk = {...tk, statusHistory:[{status:tk.status, at:tk.createdAt||new Date().toISOString()}]};
    if(tk.estimatedHours===undefined) tk = {...tk, estimatedHours:null};
    if(!tk.delegatedTo) tk = {...tk, delegatedTo:null, delegatedAt:null, followUpEvery:3, followUpHistory:[]};
    if(!tk.dependencies) tk = {...tk, dependencies:[]};
    if(tk.actualMinutes===undefined) tk = {...tk, actualMinutes:0};
    if(tk.pomodoroCount===undefined) tk = {...tk, pomodoroCount:0};
    return tk;
  });
}

// ─── GOOGLE CALENDAR ─────────────────────────────────────────────────────────
function useGoogleCalendar() {
  const [gcalToken,  setGcalToken]  = useState(()=>sessionStorage.getItem('gcal_token'));
  const [gcalEvents, setGcalEvents] = useState([]);
  const [gcalLoad,   setGcalLoad]   = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  async function fetchEvents(token, dateMin, dateMax) {
    try {
      setGcalLoad(true);
      const url=new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
      url.searchParams.set('timeMin',dateMin+'T00:00:00Z'); url.searchParams.set('timeMax',dateMax+'T23:59:59Z');
      url.searchParams.set('singleEvents','true'); url.searchParams.set('orderBy','startTime'); url.searchParams.set('maxResults','100');
      const res=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
      if(!res.ok){setGcalToken(null);sessionStorage.removeItem('gcal_token');return;}
      const data=await res.json();
      setGcalEvents((data.items||[]).map(ev=>({
        id:ev.id, title:ev.summary||'(No title)',
        date:(ev.start?.dateTime||ev.start?.date||'').slice(0,10),
        startTime:ev.start?.dateTime?ev.start.dateTime.slice(11,16):null,
        endTime:ev.end?.dateTime?ev.end.dateTime.slice(11,16):null,
        allDay:!!ev.start?.date&&!ev.start?.dateTime,
      })));
    } catch(e){} finally{setGcalLoad(false);}
  }
  function connect(){
    if(!clientId){alert('Add VITE_GOOGLE_CLIENT_ID to .env');return;}
    if(!window.google){alert('Refresh page first');return;}
    window.google.accounts.oauth2.initTokenClient({
      client_id:clientId, scope:'https://www.googleapis.com/auth/calendar.readonly',
      callback:r=>{if(r.access_token){sessionStorage.setItem('gcal_token',r.access_token);setGcalToken(r.access_token);}},
    }).requestAccessToken();
  }
  function disconnect(){sessionStorage.removeItem('gcal_token');setGcalToken(null);setGcalEvents([]);}
  return{gcalToken,gcalEvents,gcalLoad,connect,disconnect,fetchEvents};
}

// ─── CHIP ────────────────────────────────────────────────────────────────────
const Chip=({children,c=T2,bg='transparent',br=BD2})=>(
  <span style={{background:bg,border:`1px solid ${br}`,color:c,fontSize:9,padding:'2px 6px',borderRadius:3,fontWeight:700,display:'inline-flex',alignItems:'center',gap:3,lineHeight:1.5,whiteSpace:'nowrap'}}>
    {children}
  </span>
);

// ─── QUICK CAPTURE MODAL ─────────────────────────────────────────────────────
function QuickAddModal({onSave, onClose}) {
  const [title,    setTitle]    = useState('');
  const [dueDate,  setDueDate]  = useState(today());
  const [priority, setPriority] = useState('normal');
  const [taskType, setTaskType] = useState('work');
  const [dept,     setDept]     = useState('');
  const [delegTo,  setDelegTo]  = useState('');
  const [estHours, setEstHours] = useState('');

  function save() {
    if(!title.trim()) return;
    onSave({
      id:uid(), title:title.trim(), dueDate, priority, taskType,
      department:dept||null, status:'not_started', notes:'',
      sessions:[], important:false, rescheduleCount:0,
      createdAt:new Date().toISOString(),
      statusHistory:[{status:'not_started', at:new Date().toISOString()}],
      estimatedHours: estHours ? parseFloat(estHours) : null,
      delegatedTo: delegTo.trim()||null,
      delegatedAt: delegTo.trim() ? new Date().toISOString() : null,
      followUpEvery: 3,
      followUpHistory: [],
    });
  }

  const F={background:S2,border:`1px solid ${BD2}`,borderRadius:8,color:T1,fontSize:13,padding:'10px 12px',width:'100%',outline:'none',boxSizing:'border-box'};
  const tt=TASK_TYPES[taskType];
  const dl=dueDate?daysUntil(dueDate):null;

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.87)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,zIndex:50}} onClick={onClose}>
      <div style={{background:S1,border:`1px solid ${BD2}`,borderRadius:16,padding:24,width:'100%',maxWidth:440}} onClick={e=>e.stopPropagation()}>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:T1}}>Capture Task</div>
            <div style={{fontSize:10,color:T3,marginTop:2}}>Step 1 — Log it fast, plan it later</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:T3,cursor:'pointer'}}><X size={15}/></button>
        </div>

        {/* Type */}
        <div style={{display:'flex',gap:6,marginBottom:16}}>
          {Object.entries(TASK_TYPES).map(([k,v])=>(
            <button key={k} onClick={()=>setTaskType(k)} style={{flex:1,padding:'8px 4px',borderRadius:8,border:`1px solid ${taskType===k?v.color:BD}`,background:taskType===k?v.bg:'transparent',color:taskType===k?v.color:T3,cursor:'pointer',fontSize:12,fontWeight:taskType===k?700:400,display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        {/* Title */}
        <input autoFocus value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&save()}
          placeholder="Task name — what needs to be done?"
          style={{...F,fontSize:14,fontWeight:600,marginBottom:14,border:`1px solid ${title?tt.color+'88':BD2}`}}/>

        {/* Due date + dept side by side */}
        <div style={{display:'flex',gap:10,marginBottom:14}}>
          <div style={{flex:1}}>
            <label style={{fontSize:10,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',display:'block',marginBottom:5}}>Deadline</label>
            <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} style={F}/>
            {dueDate&&dl!==null&&(
              <div style={{fontSize:10,marginTop:3,color:dl<0?'#f87171':dl===0?'#fbbf24':T2,fontWeight:600}}>
                {dl<0?`${-dl}d overdue`:dl===0?'Today':dl===1?'Tomorrow':`${dl} days`} — {wshort(dueDate)}, {mday(dueDate)}
              </div>
            )}
          </div>
          <div style={{flex:1}}>
            <label style={{fontSize:10,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',display:'block',marginBottom:5}}>Department</label>
            <select value={dept} onChange={e=>setDept(e.target.value)} style={{...F,color:dept&&DEPT[dept]?DEPT[dept].color:T3}}>
              <option value="">No Department</option>
              {DEPARTMENTS.map(d=><option key={d.code} value={d.code}>{d.code} — {d.name}</option>)}
            </select>
          </div>
        </div>

        {/* Priority */}
        <div style={{marginBottom:22}}>
          <label style={{fontSize:10,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',display:'block',marginBottom:7}}>Priority</label>
          <div style={{display:'flex',gap:6}}>
            {Object.entries(PRIO).map(([k,v])=>(
              <button key={k} onClick={()=>setPriority(k)} style={{flex:1,padding:'8px 4px',borderRadius:8,border:`1px solid ${priority===k?v.dot:BD}`,background:priority===k?v.bg:'transparent',color:priority===k?v.dot:T3,cursor:'pointer',fontSize:12,fontWeight:priority===k?700:400,display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
                {k==='urgent'?<ShieldAlert size={11}/>:k==='high'?<Flame size={11}/>:<Circle size={11}/>}{v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Estimate + Delegate */}
        <div style={{display:'flex',gap:10,marginBottom:16}}>
          <div style={{flex:1}}>
            <label style={{fontSize:10,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',display:'block',marginBottom:5}}>Est. Hours</label>
            <input type="number" min="0.5" step="0.5" value={estHours} onChange={e=>setEstHours(e.target.value)} placeholder="e.g. 2.5"
              style={{...F,color:T1}}/>
          </div>
          <div style={{flex:2}}>
            <label style={{fontSize:10,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',display:'block',marginBottom:5}}>Delegate To (name)</label>
            <input value={delegTo} onChange={e=>setDelegTo(e.target.value)} placeholder="Leave blank = do it myself"
              style={{...F,color:delegTo?'#67e8f9':T1}}/>
          </div>
        </div>

        <button onClick={save} disabled={!title.trim()} style={{width:'100%',padding:'12px',borderRadius:10,border:'none',background:title.trim()?tt.color:S2,color:title.trim()?'#fff':T3,fontSize:14,fontWeight:700,cursor:title.trim()?'pointer':'not-allowed'}}>
          {delegTo.trim()?`Delegate to ${delegTo.trim()} →`:'Add to Inbox →'}
        </button>
      </div>
    </div>
  );
}

// ─── PLAN MODAL ──────────────────────────────────────────────────────────────
function PlanModal({task, onSave, onDelete, onClose}) {
  const [status,   setStatus]   = useState(task.status||'not_started');
  const [sessions, setSessions] = useState(task.sessions||[]);
  const [notes,    setNotes]    = useState(task.notes||'');
  const [priority, setPriority] = useState(task.priority||'normal');
  const [dueDate,  setDueDate]  = useState(task.dueDate||today());
  const [dept,     setDept]     = useState(task.department||'');
  const [important,setImportant]= useState(!!task.important);
  const [showMore, setShowMore] = useState(false);
  const [confirmDel,setConfirmDel]=useState(false);
  const [estHours, setEstHours] = useState(task.estimatedHours||'');
  const [delegTo,  setDelegTo]  = useState(task.delegatedTo||'');
  const [followUpEvery, setFollowUpEvery] = useState(task.followUpEvery||3);
  const [fuNote,   setFuNote]   = useState('');
  // new session form
  const [nsDate,   setNsDate]   = useState(today());
  const [nsStart,  setNsStart]  = useState('');
  const [nsEnd,    setNsEnd]    = useState('');

  const dl = dueDate ? daysUntil(dueDate) : null;
  const totalMins = sessions.reduce((a,s)=>a+minutesBetween(s.startTime,s.endTime),0);
  const bc = blockColor(task);
  const tt = TASK_TYPES[task.taskType||'work'];

  function addSession(){
    if(!nsDate||!nsStart) return;
    setSessions(s=>[...s,{id:uid(),date:nsDate,startTime:nsStart,endTime:nsEnd||null}]);
    setNsStart(''); setNsEnd('');
  }
  function removeSession(id){ setSessions(s=>s.filter(x=>x.id!==id)); }

  function addFollowUp(){
    if(!fuNote.trim()) return;
    const entry = {at:new Date().toISOString(), note:fuNote.trim()};
    task = {...task, followUpHistory:[...(task.followUpHistory||[]), entry]};
    setFuNote('');
  }

  function save(){
    const newAt = new Date().toISOString();
    const hist = [...(task.statusHistory||[])];
    if(status !== task.status) hist.push({status, at:newAt});
    const fuHistory = fuNote.trim()
      ? [...(task.followUpHistory||[]), {at:newAt, note:fuNote.trim()}]
      : (task.followUpHistory||[]);
    onSave({
      ...task, status, priority, dueDate:dueDate||null,
      department:dept||null, important, notes:notes.trim(), sessions,
      scheduledDate: sessions[0]?.date||null,
      scheduledTime: sessions[0]?.startTime||null,
      statusHistory: hist,
      completedAt: status==='done'&&task.status!=='done' ? newAt : task.completedAt||null,
      estimatedHours: estHours ? parseFloat(estHours) : null,
      delegatedTo: delegTo.trim()||null,
      delegatedAt: delegTo.trim()&&!task.delegatedAt ? newAt : task.delegatedAt||null,
      followUpEvery, followUpHistory: fuHistory,
    });
  }

  // Smart deadline warning
  const scheduledMins = sessions.reduce((a,s)=>a+minutesBetween(s.startTime,s.endTime),0);
  const scheduledHours = scheduledMins/60;
  const estH = estHours ? parseFloat(estHours) : null;
  const hoursGap = estH ? estH - scheduledHours : null;
  const dl2 = dueDate ? daysUntil(dueDate) : null;
  const noSessionWarning = dl2!==null && dl2<=2 && sessions.length===0;
  const hourWarning = hoursGap!==null && hoursGap>0.1;

  const F={background:S2,border:`1px solid ${BD2}`,borderRadius:8,color:T1,fontSize:13,padding:'9px 11px',outline:'none',boxSizing:'border-box'};
  const L={fontSize:10,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',display:'block',marginBottom:5,marginTop:14};

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.87)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,zIndex:50}} onClick={onClose}>
      <div style={{background:S1,border:`1px solid ${BD2}`,borderLeft:`3px solid ${bc.left}`,borderRadius:16,padding:22,width:'100%',maxWidth:520,maxHeight:'95vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',marginBottom:5}}>
              <span style={{fontSize:10,color:tt.color,fontWeight:700}}>{tt.icon} {tt.label}</span>
              {task.department&&DEPT[task.department]&&(
                <span style={{fontSize:9,padding:'1px 6px',borderRadius:3,background:DEPT[task.department].bg,color:DEPT[task.department].color,fontWeight:700,border:`1px solid ${DEPT[task.department].color}44`}}>{task.department}</span>
              )}
              {task.important&&<Star size={11} style={{color:'#fbbf24',fill:'#fbbf24'}}/>}
            </div>
            <div style={{fontSize:16,fontWeight:700,color:T1,lineHeight:1.3}}>{task.title}</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:T3,cursor:'pointer',marginLeft:10,flexShrink:0}}><X size={15}/></button>
        </div>

        {/* Deadline banner */}
        {dueDate&&(
          <div style={{background:dl!==null&&dl<0?'rgba(248,113,113,.12)':dl===0?'rgba(251,191,36,.1)':'rgba(129,140,248,.08)',border:`1px solid ${dl!==null&&dl<0?'rgba(248,113,113,.35)':dl===0?'rgba(251,191,36,.3)':BD}`,borderRadius:8,padding:'8px 12px',marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:9,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em'}}>Deadline</div>
              <div style={{fontSize:13,fontWeight:700,color:T1,marginTop:1}}>{wshort(dueDate)}, {mday(dueDate)}</div>
            </div>
            <div style={{fontSize:20,fontWeight:800,fontFamily:'monospace',color:dl!==null&&dl<0?'#f87171':dl===0?'#fbbf24':dl!==null&&dl<=3?'#fb923c':ACCL}}>
              {dl!==null&&dl<0?`${-dl}d LATE`:dl===0?'TODAY':dl===1?'1d left':`${dl}d left`}
            </div>
          </div>
        )}

        {/* Smart warnings */}
        {(noSessionWarning||hourWarning)&&(
          <div style={{background:'rgba(251,146,60,.1)',border:'1px solid rgba(251,146,60,.35)',borderRadius:8,padding:'8px 12px',marginBottom:14,display:'flex',flexDirection:'column',gap:4}}>
            <div style={{fontSize:9,color:'#fb923c',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',display:'flex',alignItems:'center',gap:4}}><AlertTriangle size={9}/> Smart Warning</div>
            {noSessionWarning&&<div style={{fontSize:11,color:'#fbbf24',fontWeight:600}}>⚠ Deadline in {dl2===0?'today':dl2+'d'} — no sessions scheduled yet!</div>}
            {hourWarning&&<div style={{fontSize:11,color:'#fb923c',fontWeight:600}}>⏱ Need {hoursGap.toFixed(1)}h more — only {scheduledHours.toFixed(1)}h/{estH}h planned</div>}
          </div>
        )}

        {/* Status */}
        <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:14}}>
          {Object.entries(STATUS).map(([k,v])=>(
            <button key={k} onClick={()=>setStatus(k)} style={{flex:'1 1 auto',minWidth:80,padding:'7px 5px',borderRadius:8,border:`1px solid ${status===k?v.color:BD}`,background:status===k?v.bg:'transparent',color:status===k?v.color:T3,cursor:'pointer',fontSize:11,fontWeight:status===k?700:400,display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
              <v.Icon size={11}/>{v.label}
            </button>
          ))}
        </div>

        <div style={{height:1,background:BD,marginBottom:14}}/>

        {/* Work sessions */}
        <div style={{fontSize:11,fontWeight:700,color:ACCL,marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
          <CalendarDays size={13}/> Work Sessions
          {totalMins>0&&<span style={{fontSize:10,color:T3,fontWeight:400}}>— Total: {fmtDuration(totalMins)}</span>}
        </div>

        {/* Session list */}
        {sessions.length>0&&(
          <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:10}}>
            {sessions.map((s,i)=>{
              const mins=minutesBetween(s.startTime,s.endTime);
              const isPast=s.date<today();
              return(
                <div key={s.id} style={{display:'flex',alignItems:'center',gap:8,background:S2,border:`1px solid ${isPast?BD:BD2}`,borderRadius:7,padding:'7px 10px',opacity:isPast?.7:1}}>
                  <div style={{width:3,height:28,borderRadius:99,background:bc.left,flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:isPast?T3:T1}}>{wshort(s.date)}, {mday(s.date)}</div>
                    <div style={{fontSize:10,color:T3,fontFamily:'monospace',marginTop:1}}>
                      {s.startTime?to12h(s.startTime):'(no time)'}{s.endTime?` → ${to12h(s.endTime)}`:''}{mins>0&&<span style={{color:ACCL,marginLeft:6}}>{fmtDuration(mins)}</span>}
                    </div>
                  </div>
                  <button onClick={()=>removeSession(s.id)} style={{background:'none',border:'none',color:T3,cursor:'pointer',padding:4}}>
                    <X size={11}/>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add session form */}
        <div style={{background:S2,border:`1px solid ${BD}`,borderRadius:8,padding:'10px 12px',marginBottom:14}}>
          <div style={{fontSize:10,color:T3,fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:'.05em'}}>+ Add Work Session</div>
          <div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'flex-end'}}>
            <div style={{flex:'2 1 120px'}}>
              <div style={{fontSize:9,color:T3,marginBottom:3}}>DATE</div>
              <input type="date" value={nsDate} onChange={e=>setNsDate(e.target.value)} style={{...F,padding:'7px 8px',width:'100%'}}/>
            </div>
            <div style={{flex:'1 1 90px'}}>
              <div style={{fontSize:9,color:T3,marginBottom:3}}>START</div>
              <div style={{position:'relative'}}>
                <input type="time" step="60" value={nsStart} onChange={e=>setNsStart(e.target.value)} style={{...F,padding:'7px 8px',width:'100%',fontFamily:'monospace'}}/>
                {nsStart&&<span style={{position:'absolute',right:5,top:'50%',transform:'translateY(-50%)',fontSize:8,color:ACCL,pointerEvents:'none'}}>{to12h(nsStart)}</span>}
              </div>
            </div>
            <div style={{flex:'1 1 90px'}}>
              <div style={{fontSize:9,color:T3,marginBottom:3}}>END</div>
              <div style={{position:'relative'}}>
                <input type="time" step="60" value={nsEnd} onChange={e=>setNsEnd(e.target.value)} style={{...F,padding:'7px 8px',width:'100%',fontFamily:'monospace'}}/>
                {nsEnd&&<span style={{position:'absolute',right:5,top:'50%',transform:'translateY(-50%)',fontSize:8,color:ACCL,pointerEvents:'none'}}>{to12h(nsEnd)}</span>}
              </div>
            </div>
            <button onClick={addSession} disabled={!nsDate||!nsStart} style={{padding:'7px 14px',borderRadius:7,border:`1px solid ${nsDate&&nsStart?ACCL:BD}`,background:nsDate&&nsStart?'rgba(124,58,237,.25)':'transparent',color:nsDate&&nsStart?ACCL:T3,cursor:nsDate&&nsStart?'pointer':'not-allowed',fontSize:12,fontWeight:700,flexShrink:0}}>
              Add
            </button>
          </div>
          {nsStart&&nsEnd&&minutesBetween(nsStart,nsEnd)>0&&(
            <div style={{fontSize:10,color:GCAL,marginTop:6}}>{fmtDuration(minutesBetween(nsStart,nsEnd))} session</div>
          )}
        </div>

        {/* Notes */}
        <label style={L}>Notes / Agenda</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Meeting agenda, task details, what to prepare…" style={{...F,resize:'vertical',width:'100%'}}/>

        {/* More fields */}
        <button onClick={()=>setShowMore(x=>!x)} style={{background:'none',border:'none',color:T3,fontSize:11,cursor:'pointer',padding:'10px 0',display:'flex',alignItems:'center',gap:5}}>
          {showMore?'▲':'▼'} {showMore?'Hide':'More'} (priority, deadline, department, important)
        </button>

        {showMore&&(
          <div style={{borderTop:`1px solid ${BD}`,paddingTop:12}}>
            <label style={L}>Priority</label>
            <div style={{display:'flex',gap:6}}>
              {Object.entries(PRIO).map(([k,v])=>(
                <button key={k} onClick={()=>setPriority(k)} style={{flex:1,padding:'7px 4px',borderRadius:8,border:`1px solid ${priority===k?v.dot:BD}`,background:priority===k?v.bg:'transparent',color:priority===k?v.dot:T3,cursor:'pointer',fontSize:11,fontWeight:priority===k?700:400}}>
                  {v.label}
                </button>
              ))}
            </div>
            <label style={L}>Deadline</label>
            <input type="date" value={dueDate||''} onChange={e=>setDueDate(e.target.value)} style={{...F,width:'100%'}}/>
            <label style={L}>Department</label>
            <select value={dept} onChange={e=>setDept(e.target.value)} style={{...F,width:'100%',color:dept&&DEPT[dept]?DEPT[dept].color:T3}}>
              <option value="">No Department</option>
              {DEPARTMENTS.map(d=><option key={d.code} value={d.code}>{d.code} — {d.name}</option>)}
            </select>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,color:T2,marginTop:14}}>
              <input type="checkbox" checked={important} onChange={e=>setImportant(e.target.checked)} style={{accentColor:'#fbbf24'}}/>
              Mark as Important ★
            </label>
            <label style={L}>Estimated Hours</label>
            <input type="number" min="0.5" step="0.5" value={estHours} onChange={e=>setEstHours(e.target.value)} placeholder="e.g. 3" style={{...F,width:'100%'}}/>
            <label style={L}>Delegate To</label>
            <input value={delegTo} onChange={e=>setDelegTo(e.target.value)} placeholder="Person's name (blank = do yourself)" style={{...F,width:'100%',color:delegTo?'#67e8f9':T1}}/>
            {delegTo&&(
              <>
                <label style={L}>Follow Up Every (days)</label>
                <input type="number" min="1" max="30" value={followUpEvery} onChange={e=>setFollowUpEvery(+e.target.value)} style={{...F,width:'100%'}}/>
              </>
            )}
          </div>
        )}

        {/* Delegation follow-up history */}
        {task.delegatedTo&&(
          <div style={{marginTop:14,borderTop:`1px solid ${BD}`,paddingTop:12}}>
            <div style={{fontSize:9,color:'#67e8f9',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8,display:'flex',alignItems:'center',gap:5}}>
              <Users size={9}/> Delegated to {task.delegatedTo}
              {task.delegatedAt&&<span style={{fontSize:9,color:T3,fontWeight:400}}>— since {fmtTs(task.delegatedAt)}</span>}
            </div>
            {(task.followUpHistory||[]).length>0&&(task.followUpHistory||[]).slice(-3).map((h,i)=>(
              <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:5,fontSize:11}}>
                <Bell size={9} style={{color:'#67e8f9',marginTop:1,flexShrink:0}}/>
                <span style={{color:T2,flex:1}}>{h.note}</span>
                <span style={{fontSize:9,color:T3,fontFamily:'monospace',flexShrink:0}}>{fmtTs(h.at)}</span>
              </div>
            ))}
            <div style={{display:'flex',gap:6,marginTop:6}}>
              <input value={fuNote} onChange={e=>setFuNote(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&fuNote.trim()&&setFuNote(fuNote)}
                placeholder="Follow-up note (saved with task)…"
                style={{...F,flex:1,padding:'6px 10px',fontSize:11}}/>
              <span style={{fontSize:9,color:T3,alignSelf:'center',whiteSpace:'nowrap'}}>→ save</span>
            </div>
          </div>
        )}

        {/* Status history */}
        {task.statusHistory&&task.statusHistory.length>0&&(
          <div style={{marginTop:16,borderTop:`1px solid ${BD}`,paddingTop:12}}>
            <div style={{fontSize:9,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8,display:'flex',alignItems:'center',gap:5}}>
              <History size={9}/> Status History
            </div>
            {task.statusHistory.map((h,i)=>{
              const st=STATUS[h.status]||STATUS.not_started;
              const isLast=i===task.statusHistory.length-1;
              return(
                <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:5,opacity:isLast?1:.6}}>
                  <st.Icon size={10} style={{color:st.color,marginTop:1,flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <span style={{fontSize:11,fontWeight:isLast?600:400,color:isLast?st.color:T3}}>{st.label}</span>
                  </div>
                  <span style={{fontSize:9,color:T3,fontFamily:'monospace'}}>{fmtTs(h.at)}</span>
                </div>
              );
            })}
            {task.dueDate&&task.completedAt&&(
              <div style={{marginTop:6,padding:'5px 8px',borderRadius:5,background:task.completedAt.slice(0,10)<=task.dueDate?'rgba(52,211,153,.1)':'rgba(248,113,113,.1)',border:`1px solid ${task.completedAt.slice(0,10)<=task.dueDate?'rgba(52,211,153,.3)':'rgba(248,113,113,.3)'}`}}>
                <span style={{fontSize:10,fontWeight:700,color:task.completedAt.slice(0,10)<=task.dueDate?'#34d399':'#f87171'}}>
                  {task.completedAt.slice(0,10)<=task.dueDate?'✓ Completed on time':'⚠ Completed late'}
                  {' — deadline was '}{mday(task.dueDate)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{display:'flex',gap:8,marginTop:18}}>
          {onDelete&&(
            confirmDel
              ?<button onClick={()=>onDelete(task.id)} style={{padding:'10px 14px',borderRadius:8,border:'none',background:'#ef4444',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>Confirm Delete</button>
              :<button onClick={()=>setConfirmDel(true)} style={{padding:'10px',borderRadius:8,border:`1px solid ${BD2}`,background:'transparent',color:T3,cursor:'pointer',fontSize:12}}>
                <Trash2 size={13}/>
              </button>
          )}
          <button onClick={onClose} style={{flex:1,padding:'10px',borderRadius:8,border:`1px solid ${BD2}`,background:'transparent',color:T2,cursor:'pointer',fontSize:13}}>Cancel</button>
          <button onClick={save} style={{flex:2,padding:'10px',borderRadius:8,border:'none',background:tt.color,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── INBOX CARD ──────────────────────────────────────────────────────────────
function InboxCard({task, onPlan, onStatusCycle, onPomodoro}) {
  const st=STATUS[task.status||'not_started'];
  const bc=blockColor(task);
  const dl=dueLabel(task.dueDate);
  const tt=TASK_TYPES[task.taskType||'work'];
  const p=PRIO[task.priority||'normal'];
  const d=task.department?DEPT[task.department]:null;
  const totalMins=(task.sessions||[]).reduce((a,s)=>a+minutesBetween(s.startTime,s.endTime),0);
  // deadline warning
  const dlu=daysUntil(task.dueDate);
  const scheduledH=totalMins/60;
  const estH=task.estimatedHours;
  const hoursGap=estH&&estH-scheduledH>0.1?estH-scheduledH:null;
  const noSessionWarn=dlu!==null&&dlu<=2&&(task.sessions||[]).length===0&&task.status!=='done'&&task.status!=='cancelled';
  // delegation
  const isDeleg=!!task.delegatedTo;
  const lastFu=(task.followUpHistory||[]).slice(-1)[0];
  const daysSinceFollow=lastFu?Math.floor((Date.now()-new Date(lastFu.at))/86400000):task.delegatedAt?Math.floor((Date.now()-new Date(task.delegatedAt))/86400000):null;
  const followOverdue=daysSinceFollow!==null&&daysSinceFollow>(task.followUpEvery||3);

  return(
    <div style={{background:S1,border:`1px solid ${BD}`,borderLeft:`3px solid ${bc.left}`,borderRadius:8,padding:'10px 12px',display:'flex',alignItems:'flex-start',gap:10}}>
      {onPomodoro&&task.status==='in_progress'&&(
        <button onClick={e=>{e.stopPropagation();onPomodoro(task);}} title="Start Pomodoro"
          style={{marginTop:1,flexShrink:0,background:'rgba(248,113,113,.15)',border:'1px solid rgba(248,113,113,.35)',borderRadius:5,cursor:'pointer',color:'#f87171',padding:'4px 6px',display:'flex',alignItems:'center'}}>
          <Timer size={12}/>
        </button>
      )}
      <button onClick={()=>onStatusCycle(task.id)} title={`${st.label} → click to advance`}
        style={{marginTop:1,flexShrink:0,background:st.bg,border:`1px solid ${st.border}`,borderRadius:5,cursor:'pointer',color:st.color,padding:'4px 6px',display:'flex',alignItems:'center'}}>
        <st.Icon size={12}/>
      </button>
      <div style={{flex:1,minWidth:0,cursor:'pointer'}} onClick={()=>onPlan(task)}>
        <div style={{display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>
          {task.important&&<Star size={10} style={{color:'#fbbf24',fill:'#fbbf24',flexShrink:0}}/>}
          <span style={{fontSize:11,color:tt.color}}>{tt.icon}</span>
          <span style={{fontSize:13,fontWeight:500,color:task.status==='done'||task.status==='cancelled'?T3:T1,textDecoration:task.status==='done'||task.status==='cancelled'?'line-through':'none'}}>
            {task.title}
          </span>
        </div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:6}}>
          <Chip c={st.color} bg={st.bg} br={st.border}><st.Icon size={8}/> {st.label}</Chip>
          {task.priority!=='normal'&&<Chip c={p.dot} bg={p.bg} br={p.border}>{p.label}</Chip>}
          {dl&&<Chip c={dl.color} bg={`${dl.color}14`} br={`${dl.color}30`}>{dl.text}</Chip>}
          {d&&<Chip c={d.color} bg={d.bg+'aa'} br={d.color+'44'}><Building2 size={8}/>{d.code}</Chip>}
          {(task.sessions||[]).length>0&&<Chip c={ACCL} bg="rgba(167,139,250,.12)" br="rgba(167,139,250,.3)"><CalendarDays size={8}/>{task.sessions.length} session{task.sessions.length>1?'s':''}{totalMins>0?` · ${fmtDuration(totalMins)}`:''}</Chip>}
          {isDeleg&&<Chip c="#67e8f9" bg="rgba(103,232,249,.1)" br="rgba(103,232,249,.3)"><Users size={8}/>{task.delegatedTo}{followOverdue&&<span style={{color:'#f87171',marginLeft:2}}>⚠{daysSinceFollow}d</span>}</Chip>}
          {noSessionWarn&&<Chip c="#fbbf24" bg="rgba(251,191,36,.1)" br="rgba(251,191,36,.3)"><AlertTriangle size={8}/>No sessions!</Chip>}
          {hoursGap&&<Chip c="#fb923c" bg="rgba(251,146,60,.1)" br="rgba(251,146,60,.3)"><Clock size={8}/>+{hoursGap.toFixed(1)}h needed</Chip>}
        </div>
        {task.notes&&<div style={{fontSize:11,color:T3,marginTop:5,lineHeight:1.5}}>{task.notes}</div>}
        {task.actualMinutes>0&&<div style={{fontSize:9,color:ACCL,marginTop:3}}>🍅 {task.pomodoroCount} pomodoros · {fmtDuration(task.actualMinutes)} actual</div>}
        <div style={{fontSize:9,color:T3,marginTop:5}}>Tap to plan →</div>
      </div>
    </div>
  );
}

// ─── INBOX VIEW ──────────────────────────────────────────────────────────────
function InboxView({tasks, onPlan, onStatusCycle, onPomodoro}) {
  const [q, setQ]   = useState('');
  const [pf, setPf] = useState('all');
  const [tf, setTf] = useState('all');
  const t = today();

  const filtered = useMemo(()=>tasks.filter(tk=>{
    if(tk.status==='done'||tk.status==='cancelled') return false;
    if(pf==='overdue'  &&(tk.dueDate>=t||!tk.dueDate)) return false;
    if(pf==='today'    &&tk.dueDate!==t) return false;
    if(pf==='this_week'){const d=weekDays(t);if(!d.includes(tk.dueDate))return false;}
    if(tf!=='all'&&(tk.taskType||'work')!==tf) return false;
    if(q.trim()){const s=q.toLowerCase();return(tk.title||'').toLowerCase().includes(s);}
    return true;
  }).sort((a,b)=>{
    const pa=a.priority==='urgent'?0:a.priority==='high'?1:2;
    const pb=b.priority==='urgent'?0:b.priority==='high'?1:2;
    if(pa!==pb) return pa-pb;
    return (a.dueDate||'9999').localeCompare(b.dueDate||'9999');
  }),[tasks,q,pf,tf,t]);

  const overdue  = tasks.filter(tk=>tk.status!=='done'&&tk.status!=='cancelled'&&tk.dueDate&&tk.dueDate<t).length;
  const dueToday = tasks.filter(tk=>tk.status!=='done'&&tk.status!=='cancelled'&&tk.dueDate===t).length;

  const FC=({label,val,count,ac=ACCL})=>(
    <button onClick={()=>setPf(val)} style={{padding:'4px 11px',borderRadius:20,border:`1px solid ${pf===val?ac:BD2}`,background:pf===val?`${ac}18`:'transparent',color:pf===val?ac:T2,fontSize:11,cursor:'pointer',fontWeight:pf===val?700:400,display:'flex',alignItems:'center',gap:4}}>
      {label}{count>0&&<span style={{fontSize:9,background:pf===val?ac:`${ac}30`,color:pf===val?'#fff':ac,borderRadius:10,padding:'0 5px',fontWeight:700}}>{count}</span>}
    </button>
  );

  return(
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{position:'relative'}}>
        <Search size={13} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:T3,pointerEvents:'none'}}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search tasks…"
          style={{width:'100%',background:S1,border:`1px solid ${BD2}`,borderRadius:9,padding:'9px 11px 9px 34px',color:T1,fontSize:13,outline:'none',boxSizing:'border-box'}}/>
      </div>
      <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
        <FC label="All Active" val="all" count={0}/>
        {overdue>0 &&<FC label="Overdue"    val="overdue"   count={overdue}   ac="#f87171"/>}
        {dueToday>0&&<FC label="Due Today"  val="today"     count={dueToday}  ac="#fbbf24"/>}
        <FC label="This Week" val="this_week" count={0}/>
        <span style={{color:BD2}}>│</span>
        {Object.entries(TASK_TYPES).map(([k,v])=>(
          <button key={k} onClick={()=>setTf(tf===k?'all':k)} style={{padding:'4px 10px',borderRadius:20,border:`1px solid ${tf===k?v.color:BD}`,background:tf===k?v.bg:'transparent',color:tf===k?v.color:T3,fontSize:11,cursor:'pointer',fontWeight:tf===k?700:400,display:'flex',alignItems:'center',gap:4}}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>
      <div style={{fontSize:11,color:T3}}>{filtered.length} active task{filtered.length!==1?'s':''}</div>
      <div style={{display:'flex',flexDirection:'column',gap:5}}>
        {filtered.length===0&&(
          <div style={{textAlign:'center',padding:'56px 0',color:T3}}>
            <Inbox size={30} style={{margin:'0 auto 12px',opacity:.2}}/>
            <p style={{fontSize:13,fontWeight:600,color:T2}}>All clear!</p>
            <p style={{fontSize:11,marginTop:4}}>No active tasks in this filter</p>
          </div>
        )}
        {filtered.map(tk=><InboxCard key={tk.id} task={tk} onPlan={onPlan} onStatusCycle={onStatusCycle} onPomodoro={onPomodoro}/>)}
      </div>
    </div>
  );
}

// ─── CALENDAR GRID ───────────────────────────────────────────────────────────
function getTaskBlocks(task) {
  if(!task.sessions||task.sessions.length===0) return [];
  return task.sessions.map(s=>({task, session:s}));
}

function CalendarGrid({days, tasks, gcalEvents, onSlotClick, onTaskClick, typeFilter}) {
  const t=today(), now=new Date(), nowH=now.getHours(), nowM=now.getMinutes();
  const hasGcal=gcalEvents.length>0;

  const px=ts=>{if(!ts)return null;const[h,m]=ts.split(':').map(Number);if(h<START_H||h>=END_H)return null;return((h-START_H)*60+m)/60*HOUR_H;};
  const bh=(s,e)=>{if(!s||!e)return HOUR_H-2;const[sh,sm]=s.split(':').map(Number),[eh,em]=e.split(':').map(Number);return Math.max(((eh*60+em)-(sh*60+sm))/60*HOUR_H-2,28);};

  const activeTasks=tasks.filter(tk=>tk.status!=='done'&&tk.status!=='cancelled'&&(typeFilter.length===0||typeFilter.includes(tk.taskType||'work')));
  const taskW=hasGcal?'58%':'100%';

  return(
    <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden',border:`1px solid ${BD}`,borderRadius:12,background:S1}}>
      {/* Column headers */}
      <div style={{display:'flex',flexShrink:0,borderBottom:`1px solid ${BD}`,background:S2}}>
        <div style={{width:52,flexShrink:0,borderRight:`1px solid ${BD}`}}/>
        {days.map(day=>{
          const isT=day===t, wd=weekDays(t);
          const dayTasks=activeTasks.filter(tk=>(tk.sessions||[]).some(s=>s.date===day));
          const hasOverdue=activeTasks.filter(tk=>tk.dueDate===day).some(tk=>day<t);
          return(
            <div key={day} style={{flex:1,padding:'8px 5px 6px',textAlign:'center',borderRight:`1px solid ${BD}`,background:isT?'rgba(124,58,237,.12)':'transparent'}}>
              <div style={{fontSize:10,fontWeight:700,color:isT?ACCL:T3,textTransform:'uppercase',letterSpacing:'.07em'}}>{wshort(day)}</div>
              <div style={{fontSize:18,fontWeight:800,color:isT?ACCL:T1,lineHeight:1.3}}>{day.split('-')[2]}</div>
              {isT&&<div style={{width:5,height:5,borderRadius:'50%',background:ACCL,margin:'2px auto 0'}}/>}
            </div>
          );
        })}
      </div>

      {/* Due row — deadlines without a scheduled session */}
      <div style={{display:'flex',flexShrink:0,borderBottom:`1px solid ${BD}`,minHeight:30,background:BG}}>
        <div style={{width:52,flexShrink:0,borderRight:`1px solid ${BD}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontSize:8,color:T3,fontWeight:700}}>DUE</span>
        </div>
        {days.map(day=>{
          const dl=tasks.filter(tk=>tk.dueDate===day&&tk.status!=='done'&&tk.status!=='cancelled'&&(typeFilter.length===0||typeFilter.includes(tk.taskType||'work')));
          const isLate=day<t;
          return(
            <div key={day} style={{flex:1,borderRight:`1px solid ${BD}`,padding:'3px 3px',display:'flex',flexWrap:'wrap',gap:2,alignContent:'flex-start',background:isLate&&dl.length>0?'rgba(248,113,113,.04)':'transparent'}}>
              {dl.map(tk=>{
                const bc=blockColor(tk); const d=tk.department?DEPT[tk.department]:null;
                return(
                  <div key={tk.id} onClick={()=>onTaskClick(tk)}
                    style={{fontSize:9,fontWeight:700,padding:'2px 5px',borderRadius:3,background:bc.bg,color:bc.color,border:`1px solid ${bc.border}`,borderLeft:`2px solid ${bc.left}`,cursor:'pointer',maxWidth:'100%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:3}}>
                    {TASK_TYPES[tk.taskType||'work'].icon}{tk.important&&'★ '}{tk.title}{d&&<span style={{opacity:.8}}> {d.code}</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div style={{flex:1,overflowY:'auto'}}>
        <div style={{display:'flex',minHeight:HOURS.length*HOUR_H}}>
          <div style={{width:52,flexShrink:0,borderRight:`1px solid ${BD}`}}>
            {HOURS.map(h=>(
              <div key={h} style={{height:HOUR_H,borderBottom:`1px solid ${BD}`,display:'flex',alignItems:'flex-start',justifyContent:'flex-end',paddingRight:7,paddingTop:5}}>
                <span style={{fontSize:10,fontFamily:'monospace',color:T3,fontWeight:600}}>{String(h).padStart(2,'0')}:00</span>
              </div>
            ))}
          </div>
          {days.map(day=>{
            const isT=day===t;
            const blocks=activeTasks.flatMap(getTaskBlocks).filter(({session})=>session.date===day);
            const myGcal=gcalEvents.filter(ev=>ev.date===day&&!ev.allDay&&ev.startTime);
            const nowTop=isT&&nowH>=START_H&&nowH<END_H?((nowH-START_H)*60+nowM)/60*HOUR_H:null;
            return(
              <div key={day} style={{flex:1,borderRight:`1px solid ${BD}`,position:'relative',background:isT?'rgba(124,58,237,.025)':'transparent'}}>
                {HOURS.map(h=>(
                  <div key={h} onClick={()=>onSlotClick(day,`${String(h).padStart(2,'0')}:00`)}
                    style={{height:HOUR_H,borderBottom:`1px solid ${BD}`,cursor:'pointer'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(124,58,237,.07)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}/>
                ))}
                {nowTop!==null&&(
                  <div style={{position:'absolute',left:0,right:0,top:nowTop,zIndex:10,pointerEvents:'none',display:'flex',alignItems:'center'}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:'#ef4444',marginLeft:-3.5,flexShrink:0}}/>
                    <div style={{flex:1,height:1.5,background:'rgba(239,68,68,.6)'}}/>
                  </div>
                )}
                {blocks.map(({task:tk, session:s})=>{
                  const top=px(s.startTime); if(top===null) return null;
                  const h=bh(s.startTime,s.endTime), bc=blockColor(tk), st=STATUS[tk.status||'not_started'];
                  const d=tk.department?DEPT[tk.department]:null;
                  const tt=TASK_TYPES[tk.taskType||'work'];
                  return(
                    <div key={s.id} onClick={e=>{e.stopPropagation();onTaskClick(tk);}}
                      style={{position:'absolute',top,left:1,width:`calc(${taskW} - 3px)`,height:h,borderRadius:6,background:bc.bg,border:`1px solid ${bc.border}`,borderLeft:`4px solid ${bc.left}`,padding:'3px 7px',overflow:'hidden',cursor:'pointer',zIndex:5,boxSizing:'border-box'}}>
                      <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:1}}>
                        <st.Icon size={9} style={{color:st.color,flexShrink:0}}/>
                        <span style={{fontSize:10,fontWeight:700,color:bc.color,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{tk.important&&'★ '}{tk.title}</span>
                        <span style={{fontSize:10,flexShrink:0}}>{tt.icon}</span>
                      </div>
                      {h>28&&(
                        <div style={{fontSize:9,color:T2,fontFamily:'monospace',display:'flex',gap:6,alignItems:'center'}}>
                          <span>{to12h(s.startTime)}{s.endTime?` → ${to12h(s.endTime)}`:''}</span>
                          {d&&<span style={{color:d.color,fontWeight:700,background:d.bg+'cc',padding:'0 4px',borderRadius:2}}>{d.code}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
                {hasGcal&&myGcal.map(ev=>{
                  const top=px(ev.startTime); if(top===null) return null;
                  const h=bh(ev.startTime,ev.endTime);
                  return(
                    <div key={ev.id} style={{position:'absolute',top,left:`calc(${taskW} + 1px)`,width:'calc(42% - 2px)',height:h,borderRadius:5,background:'rgba(16,185,129,.13)',border:'1px solid rgba(16,185,129,.35)',borderLeft:`3px solid ${GCAL}`,padding:'3px 5px',overflow:'hidden',zIndex:5,boxSizing:'border-box'}}>
                      <div style={{fontSize:10,fontWeight:700,color:GCAL,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.title}</div>
                      {h>28&&<div style={{fontSize:9,color:'rgba(16,185,129,.7)',fontFamily:'monospace'}}>{to12h(ev.startTime)}{ev.endTime?` → ${to12h(ev.endTime)}`:''}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── INSIGHTS VIEW ───────────────────────────────────────────────────────────
function InsightsView({tasks}) {
  const t=today(), wdays=weekDays(t);
  const lastWeekStart=addD(wdays[0],-7), lastWeekEnd=addD(wdays[6],-7);

  const active    = tasks.filter(x=>x.status!=='done'&&x.status!=='cancelled');
  const done      = tasks.filter(x=>x.status==='done');
  const overdue   = active.filter(x=>x.dueDate&&x.dueDate<t);
  const inProg    = active.filter(x=>x.status==='in_progress');
  const inbox     = active.filter(x=>!(x.sessions||[]).length);

  const doneThisWeek = done.filter(x=>x.completedAt&&x.completedAt.slice(0,10)>=wdays[0]);
  const doneLastWeek = done.filter(x=>x.completedAt&&x.completedAt.slice(0,10)>=lastWeekStart&&x.completedAt.slice(0,10)<=lastWeekEnd);
  const weekDelta    = doneThisWeek.length-doneLastWeek.length;

  // On-time analysis
  const doneWithDeadline = done.filter(x=>x.dueDate&&x.completedAt);
  const onTime  = doneWithDeadline.filter(x=>x.completedAt.slice(0,10)<=x.dueDate);
  const late    = doneWithDeadline.filter(x=>x.completedAt.slice(0,10)>x.dueDate);
  const onTimeRate = doneWithDeadline.length ? Math.round(onTime.length/doneWithDeadline.length*100) : null;

  // Workload by day
  const workloadByDay=wdays.map(day=>({
    day,
    due:      tasks.filter(x=>x.dueDate===day&&x.status!=='cancelled').length,
    scheduled:tasks.filter(x=>(x.sessions||[]).some(s=>s.date===day)&&x.status!=='done'&&x.status!=='cancelled').length,
  }));
  const maxWL=Math.max(...workloadByDay.map(d=>d.due+d.scheduled),1);

  // By type completion
  const typeBreak=Object.entries(TASK_TYPES).map(([k,v])=>({
    ...v, key:k,
    active:active.filter(x=>(x.taskType||'work')===k).length,
    done:done.filter(x=>(x.taskType||'work')===k).length,
  }));

  // Department breakdown
  const deptBreak=DEPARTMENTS.map(d=>({
    ...d,
    active:active.filter(x=>x.department===d.code).length,
    done:done.filter(x=>x.department===d.code).length,
    overdue:overdue.filter(x=>x.department===d.code).length,
  })).filter(d=>d.active+d.done>0).sort((a,b)=>(b.active+b.done)-(a.active+a.done));

  // Late completions list
  const lateList=late.sort((a,b)=>b.completedAt.localeCompare(a.completedAt)).slice(0,5);

  // Upcoming deadlines
  const upcoming=active.filter(x=>x.dueDate&&x.dueDate>=t&&x.dueDate<=wdays[6]).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));

  const TrendIcon=weekDelta>0?TrendingUp:weekDelta<0?TrendingDown:Minus;
  const trendColor=weekDelta>0?'#34d399':weekDelta<0?'#f87171':T3;

  const Stat=({label,value,sub,color=T1,Icon})=>(
    <div style={{background:S1,border:`1px solid ${BD}`,borderRadius:10,padding:'14px'}}>
      <div style={{fontSize:9,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:5,display:'flex',alignItems:'center',gap:4}}>{Icon&&<Icon size={9}/>}{label}</div>
      <div style={{fontSize:26,fontWeight:800,fontFamily:'monospace',color,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:10,color:T3,marginTop:4}}>{sub}</div>}
    </div>
  );

  return(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
        <Stat label="Active"      value={active.length}   sub={`${inbox.length} unscheduled · ${active.length-inbox.length} planned`} color={T1}     Icon={Inbox}/>
        <Stat label="Done Total"  value={done.length}     sub={`${doneThisWeek.length} this week`}         color="#34d399" Icon={CheckCircle2}/>
        <Stat label="Overdue"     value={overdue.length}  sub={overdue.length?'Needs attention':'All on track 🎉'} color={overdue.length?'#f87171':'#34d399'} Icon={AlertTriangle}/>
        <Stat label="In Progress" value={inProg.length}   sub="currently working on"                       color="#60a5fa" Icon={PlayCircle}/>
      </div>

      {/* On-time rate */}
      {onTimeRate!==null&&(
        <div style={{background:S1,border:`1px solid ${BD}`,borderRadius:10,padding:'14px 16px'}}>
          <div style={{fontSize:9,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10,display:'flex',alignItems:'center',gap:5}}>
            <Award size={9}/> On-Time Completion Rate
          </div>
          <div style={{display:'flex',gap:20,alignItems:'center'}}>
            <div>
              <div style={{fontSize:34,fontWeight:800,fontFamily:'monospace',color:onTimeRate>=80?'#34d399':onTimeRate>=60?'#fbbf24':'#f87171'}}>{onTimeRate}%</div>
              <div style={{fontSize:10,color:T3,marginTop:2}}>{onTime.length} on time · {late.length} late · {doneWithDeadline.length} total</div>
            </div>
            <div style={{flex:1}}>
              <div style={{height:10,background:BD,borderRadius:99,overflow:'hidden'}}>
                <div style={{height:'100%',background:onTimeRate>=80?'#34d399':onTimeRate>=60?'#fbbf24':'#f87171',borderRadius:99,width:`${onTimeRate}%`,transition:'width .5s'}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:4,fontSize:9,color:T3}}>
                <span>0%</span><span>Target 80%</span><span>100%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Week vs last week */}
      <div style={{background:S1,border:`1px solid ${BD}`,borderRadius:10,padding:'14px 16px'}}>
        <div style={{fontSize:9,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12}}>This Week vs Last Week</div>
        <div style={{display:'flex',gap:24,alignItems:'center'}}>
          <div><div style={{fontSize:28,fontWeight:800,color:T1,fontFamily:'monospace'}}>{doneThisWeek.length}</div><div style={{fontSize:10,color:T3,marginTop:2}}>completed this week</div></div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,color:trendColor}}><TrendIcon size={20}/><span style={{fontSize:13,fontWeight:700}}>{weekDelta>0?'+':''}{weekDelta}</span></div>
          <div><div style={{fontSize:28,fontWeight:800,color:T3,fontFamily:'monospace'}}>{doneLastWeek.length}</div><div style={{fontSize:10,color:T3,marginTop:2}}>last week</div></div>
        </div>
      </div>

      {/* Workload by day */}
      <div style={{background:S1,border:`1px solid ${BD}`,borderRadius:10,padding:'14px 16px'}}>
        <div style={{fontSize:9,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12}}>Workload This Week</div>
        <div style={{display:'flex',gap:5,alignItems:'flex-end',height:80}}>
          {workloadByDay.map(({day,due,scheduled:sc})=>{
            const total=due+sc, isT=day===t, isPast=day<t;
            return(
              <div key={day} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <div style={{fontSize:10,color:isT?T1:T3,fontWeight:isT?700:400,minHeight:14}}>{total||''}</div>
                <div style={{width:'100%',borderRadius:4,background:BD,height:52,display:'flex',flexDirection:'column',justifyContent:'flex-end',opacity:isPast?.5:1}}>
                  {sc>0&&<div style={{height:`${sc/maxWL*100}%`,background:ACCL+'cc',minHeight:3}}/>}
                  {due>0&&<div style={{height:`${due/maxWL*100}%`,background:'#f87171cc',minHeight:3}}/>}
                </div>
                <div style={{fontSize:9,color:isT?ACCL:T3,fontWeight:isT?700:400}}>{wshort(day)}</div>
              </div>
            );
          })}
        </div>
        <div style={{display:'flex',gap:14,marginTop:8}}>
          <div style={{display:'flex',alignItems:'center',gap:4,fontSize:9,color:T3}}><div style={{width:8,height:8,borderRadius:2,background:'#f87171cc'}}/> Due</div>
          <div style={{display:'flex',alignItems:'center',gap:4,fontSize:9,color:T3}}><div style={{width:8,height:8,borderRadius:2,background:ACCL+'cc'}}/> Scheduled Sessions</div>
        </div>
      </div>

      {/* By type */}
      <div style={{background:S1,border:`1px solid ${BD}`,borderRadius:10,padding:'14px 16px'}}>
        <div style={{fontSize:9,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12}}>Completion by Task Type</div>
        {typeBreak.map(s=>{
          const total=s.active+s.done, rate=total?Math.round(s.done/total*100):0;
          return(
            <div key={s.key} style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <span style={{fontSize:18,width:24,textAlign:'center',flexShrink:0}}>{s.icon}</span>
              <div style={{flex:1}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:12,color:T1,fontWeight:500}}>{s.label}</span>
                  <span style={{fontSize:10,color:T3}}>{s.done}/{total} · <span style={{color:s.color,fontWeight:700}}>{rate}%</span></span>
                </div>
                <div style={{height:5,background:BD,borderRadius:99}}>
                  <div style={{height:'100%',background:s.color,borderRadius:99,width:`${rate}%`}}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Department breakdown */}
      {deptBreak.length>0&&(
        <div style={{background:S1,border:`1px solid ${BD}`,borderRadius:10,padding:'14px 16px'}}>
          <div style={{fontSize:9,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12,display:'flex',alignItems:'center',gap:5}}>
            <Building2 size={9}/> By Department
          </div>
          {deptBreak.map(d=>{
            const total=d.active+d.done, rate=total?Math.round(d.done/total*100):0;
            return(
              <div key={d.code} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:4,background:d.bg+'cc',color:d.color,border:`1px solid ${d.color}55`,minWidth:28,textAlign:'center',flexShrink:0}}>{d.code}</span>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:3}}>
                    <span style={{fontSize:11,color:T2}}>{d.name}</span>
                    <span style={{fontSize:10,color:T3}}>{d.done}/{total}{d.overdue>0&&<span style={{color:'#f87171'}}> · {d.overdue} late</span>}</span>
                  </div>
                  <div style={{height:4,background:BD,borderRadius:99}}>
                    <div style={{height:'100%',background:d.color,borderRadius:99,width:`${rate}%`}}/>
                  </div>
                </div>
                <span style={{fontSize:11,fontWeight:700,color:d.color,flexShrink:0,fontFamily:'monospace'}}>{rate}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Deadlines this week */}
      {upcoming.length>0&&(
        <div style={{background:S1,border:`1px solid ${BD}`,borderRadius:10,padding:'14px 16px'}}>
          <div style={{fontSize:9,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10}}>Deadlines This Week</div>
          {upcoming.map(tk=>{
            const bc=blockColor(tk), dl=dueLabel(tk.dueDate), st=STATUS[tk.status||'not_started'], d=tk.department?DEPT[tk.department]:null;
            return(
              <div key={tk.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:`1px solid ${BD}`}}>
                <div style={{width:3,height:32,borderRadius:99,background:bc.left,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,color:T1,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{TASK_TYPES[tk.taskType||'work'].icon} {tk.title}</div>
                  <div style={{fontSize:10,color:T3,marginTop:1,display:'flex',gap:6}}>
                    <span style={{color:st.color}}>{st.label}</span>
                    {d&&<span style={{color:d.color}}>{d.code}</span>}
                    {(tk.sessions||[]).length>0&&<span>{tk.sessions.length} session{tk.sessions.length>1?'s':''}</span>}
                  </div>
                </div>
                {dl&&<span style={{fontSize:10,color:dl.color,fontWeight:700,flexShrink:0}}>{dl.text}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Late completions */}
      {lateList.length>0&&(
        <div style={{background:'rgba(248,113,113,.05)',border:'1px solid rgba(248,113,113,.2)',borderRadius:10,padding:'14px 16px'}}>
          <div style={{fontSize:9,color:'#f87171',fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10}}>Recently Completed Late</div>
          {lateList.map(tk=>{
            const days=Math.round((new Date(tk.completedAt)-new Date(tk.dueDate))/86400000);
            const d=tk.department?DEPT[tk.department]:null;
            return(
              <div key={tk.id} style={{display:'flex',gap:8,alignItems:'center',marginBottom:6}}>
                <XCircle size={11} style={{color:'#f87171',flexShrink:0}}/>
                <span style={{fontSize:12,color:T2,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tk.title}</span>
                {d&&<span style={{fontSize:9,color:d.color,fontWeight:700,flexShrink:0}}>{d.code}</span>}
                <span style={{fontSize:10,color:'#f87171',fontWeight:700,flexShrink:0}}>+{days}d late</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Late Pattern Analysis */}
      {late.length>=2&&(()=>{
        const byType={}, byDept={};
        late.forEach(tk=>{
          const k=tk.taskType||'work'; byType[k]=(byType[k]||0)+1;
          if(tk.department){byDept[tk.department]=(byDept[tk.department]||0)+1;}
        });
        const topType=Object.entries(byType).sort((a,b)=>b[1]-a[1])[0];
        const topDept=Object.entries(byDept).sort((a,b)=>b[1]-a[1])[0];
        return(
          <div style={{background:'rgba(251,146,60,.06)',border:'1px solid rgba(251,146,60,.25)',borderRadius:10,padding:'14px 16px'}}>
            <div style={{fontSize:9,color:'#fb923c',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10,display:'flex',alignItems:'center',gap:5}}>
              <Activity size={9}/> Late Pattern Analysis
            </div>
            <div style={{fontSize:11,color:T2,lineHeight:1.8}}>
              {topType&&<div>📊 Most late: <span style={{color:TASK_TYPES[topType[0]]?.color,fontWeight:700}}>{TASK_TYPES[topType[0]]?.label}</span> tasks ({topType[1]} times) — try adding more time buffer</div>}
              {topDept&&DEPT[topDept[0]]&&<div>🏢 Most late dept: <span style={{color:DEPT[topDept[0]].color,fontWeight:700}}>{DEPT[topDept[0]].name}</span> — may need more resources</div>}
              {late.length>=3&&<div>⚠ {late.length} late completions total — consider estimating hours more conservatively</div>}
            </div>
          </div>
        );
      })()}

      {/* Bottleneck Alert */}
      {(()=>{
        const bottlenecks=active.filter(tk=>{
          const days=tk.createdAt?Math.floor((Date.now()-new Date(tk.createdAt))/86400000):0;
          return days>5&&(tk.status==='not_started'||tk.status==='in_progress');
        }).sort((a,b)=>{
          const da=Math.floor((Date.now()-new Date(a.createdAt))/86400000);
          const db=Math.floor((Date.now()-new Date(b.createdAt))/86400000);
          return db-da;
        }).slice(0,3);
        if(bottlenecks.length===0) return null;
        return(
          <div style={{background:'rgba(124,58,237,.07)',border:'1px solid rgba(124,58,237,.3)',borderRadius:10,padding:'14px 16px'}}>
            <div style={{fontSize:9,color:ACCL,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10,display:'flex',alignItems:'center',gap:5}}>
              <Target size={9}/> Bottleneck Alert
            </div>
            {bottlenecks.map(tk=>{
              const days=Math.floor((Date.now()-new Date(tk.createdAt))/86400000);
              const bc=blockColor(tk);
              return(
                <div key={tk.id} style={{display:'flex',gap:8,alignItems:'center',marginBottom:6,fontSize:11}}>
                  <div style={{width:3,height:16,borderRadius:99,background:bc.left,flexShrink:0}}/>
                  <span style={{color:T1,flex:1}}>{tk.title}</span>
                  <span style={{color:'#f87171',fontWeight:700,fontSize:10}}>{days}d stuck</span>
                </div>
              );
            })}
            <div style={{fontSize:10,color:T3,marginTop:6}}>💡 Decide: Do it now / Delegate / Cancel</div>
          </div>
        );
      })()}

      {/* Inbox backlog */}
      {inbox.length>0&&(
        <div style={{background:'rgba(251,191,36,.05)',border:'1px solid rgba(251,191,36,.2)',borderRadius:10,padding:'14px 16px'}}>
          <div style={{fontSize:9,color:'#fbbf24',fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10,display:'flex',alignItems:'center',gap:5}}>
            <Zap size={9}/> Inbox Backlog — {inbox.length} task{inbox.length!==1?'s':''} not yet scheduled
          </div>
          {inbox.slice(0,5).map(tk=>{
            const bc=blockColor(tk), dl=dueLabel(tk.dueDate);
            return(
              <div key={tk.id} style={{display:'flex',gap:8,alignItems:'center',marginBottom:5}}>
                <div style={{width:3,height:18,borderRadius:99,background:bc.left,flexShrink:0}}/>
                <span style={{fontSize:12,color:T1,flex:1}}>{tk.title}</span>
                {dl&&<span style={{fontSize:10,color:dl.color,fontWeight:700}}>{dl.text}</span>}
              </div>
            );
          })}
          {inbox.length>5&&<div style={{fontSize:10,color:'#fbbf24',marginTop:5}}>+{inbox.length-5} more in inbox…</div>}
        </div>
      )}
    </div>
  );
}

// ─── POMODORO TIMER ──────────────────────────────────────────────────────────
function PomodoroTimer({task, onComplete, onClose}) {
  const WORK=25*60, BREAK=5*60;
  const [phase,  setPhase]  = useState('work'); // 'work'|'break'
  const [left,   setLeft]   = useState(WORK);
  const [running,setRunning]= useState(false);
  const [done,   setDone]   = useState(0);

  useEffect(()=>{
    if(!running) return;
    const i=setInterval(()=>{
      setLeft(l=>{
        if(l<=1){
          clearInterval(i);
          if(phase==='work'){
            setDone(d=>d+1);
            setPhase('break');
            setLeft(BREAK);
            setRunning(false);
            new Notification('🍅 Pomodoro done!',{body:`Take a 5-min break — ${task.title}`});
          } else {
            setPhase('work');
            setLeft(WORK);
            setRunning(false);
          }
          return 0;
        }
        return l-1;
      });
    },1000);
    return()=>clearInterval(i);
  },[running,phase]);

  const mm=String(Math.floor(left/60)).padStart(2,'0');
  const ss=String(left%60).padStart(2,'0');
  const pct=(phase==='work'?(WORK-left)/WORK:(BREAK-left)/BREAK)*100;
  const c=phase==='work'?'#f87171':'#34d399';
  const r=44, circ=2*Math.PI*r;

  function finish(){
    onComplete({actualMins:(done*25)+Math.round((WORK-left)/60), pomodoros:done});
    onClose();
  }

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:70}} onClick={onClose}>
      <div style={{background:S1,border:`1px solid ${BD2}`,borderRadius:20,padding:32,width:300,textAlign:'center'}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:11,color:phase==='work'?'#f87171':'#34d399',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>
          {phase==='work'?'🍅 Focus Time':'☕ Break Time'}
        </div>
        <div style={{fontSize:12,color:T2,marginBottom:20,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.title}</div>
        <div style={{position:'relative',width:120,height:120,margin:'0 auto 24px'}}>
          <svg width="120" height="120" style={{transform:'rotate(-90deg)'}}>
            <circle cx="60" cy="60" r={r} fill="none" stroke={BD} strokeWidth="6"/>
            <circle cx="60" cy="60" r={r} fill="none" stroke={c} strokeWidth="6"
              strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)} strokeLinecap="round"
              style={{transition:'stroke-dashoffset .5s'}}/>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <div style={{fontSize:30,fontWeight:800,fontFamily:'monospace',color:c}}>{mm}:{ss}</div>
            {done>0&&<div style={{fontSize:10,color:T3}}>🍅×{done}</div>}
          </div>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:16}}>
          <button onClick={()=>setRunning(r=>!r)} style={{padding:'10px 24px',borderRadius:10,border:'none',background:running?S2:c,color:running?c:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',border:`1px solid ${c}`}}>
            {running?'Pause':'Start'}
          </button>
          <button onClick={()=>{setLeft(phase==='work'?WORK:BREAK);setRunning(false);}} style={{padding:'10px',borderRadius:10,border:`1px solid ${BD2}`,background:'transparent',color:T3,cursor:'pointer'}}>
            <RefreshCw size={14}/>
          </button>
        </div>
        <button onClick={finish} style={{width:'100%',padding:'9px',borderRadius:8,border:`1px solid ${BD2}`,background:'transparent',color:T2,fontSize:12,cursor:'pointer'}}>
          Done — log {done} pomodoro{done!==1?'s':''}
        </button>
      </div>
    </div>
  );
}

// ─── MORNING BRIEF MODAL ──────────────────────────────────────────────────────
function MorningBriefModal({tasks, mood, onSetMood, onClose}) {
  const t=today();
  const active=tasks.filter(x=>x.status!=='done'&&x.status!=='cancelled');
  const todayTasks=active.filter(x=>x.dueDate===t||(x.sessions||[]).some(s=>s.date===t));
  const overdue=active.filter(x=>x.dueDate&&x.dueDate<t);
  const urgent=active.filter(x=>x.priority==='urgent'||x.priority==='high');
  const delegAlerts=active.filter(tk=>{
    if(!tk.delegatedTo) return false;
    const lastFu=(tk.followUpHistory||[]).slice(-1)[0];
    const ref=lastFu?lastFu.at:tk.delegatedAt;
    const days=ref?Math.floor((Date.now()-new Date(ref))/86400000):999;
    return days>(tk.followUpEvery||3);
  });
  const MOODS=[
    {k:'high',  icon:'⚡', label:'High Energy',   c:'#34d399'},
    {k:'medium',icon:'😊', label:'Normal',         c:'#60a5fa'},
    {k:'low',   icon:'😴', label:'Low Energy',     c:'#f87171'},
  ];
  const topTasks=[...todayTasks,...urgent.filter(x=>!todayTasks.includes(x))].slice(0,5);

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.88)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,zIndex:60}} onClick={onClose}>
      <div style={{background:S1,border:`1px solid ${BD2}`,borderRadius:20,padding:26,width:'100%',maxWidth:440}} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:'center',marginBottom:20}}>
          <div style={{fontSize:22}}>☀️</div>
          <div style={{fontSize:16,fontWeight:800,color:T1,marginTop:6}}>Good Morning!</div>
          <div style={{fontSize:11,color:T3,marginTop:2}}>{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>
        </div>

        {/* Mood */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:9,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Energy Level Today</div>
          <div style={{display:'flex',gap:6}}>
            {MOODS.map(m=>(
              <button key={m.k} onClick={()=>onSetMood(m.k)} style={{flex:1,padding:'10px 6px',borderRadius:10,border:`1px solid ${mood===m.k?m.c:BD}`,background:mood===m.k?`${m.c}18`:'transparent',color:mood===m.k?m.c:T3,cursor:'pointer',fontSize:11,fontWeight:mood===m.k?700:400,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <span style={{fontSize:18}}>{m.icon}</span>{m.label}
              </button>
            ))}
          </div>
          {mood==='low'&&<div style={{fontSize:10,color:'#f87171',marginTop:6}}>💡 Low energy day — focus on easy tasks, defer hard ones</div>}
          {mood==='high'&&<div style={{fontSize:10,color:'#34d399',marginTop:6}}>💡 High energy — great time for deep work & urgent tasks</div>}
        </div>

        {/* Stats */}
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {[
            {v:todayTasks.length, label:"Today's Tasks", c:'#60a5fa'},
            {v:overdue.length,    label:'Overdue',        c:overdue.length?'#f87171':T3},
            {v:delegAlerts.length,label:'Follow-up Due',  c:delegAlerts.length?'#fb923c':T3},
          ].map((s,i)=>(
            <div key={i} style={{flex:1,background:S2,border:`1px solid ${BD}`,borderRadius:8,padding:'10px',textAlign:'center'}}>
              <div style={{fontSize:22,fontWeight:800,color:s.c,fontFamily:'monospace'}}>{s.v}</div>
              <div style={{fontSize:9,color:T3,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Top tasks */}
        {topTasks.length>0&&(
          <div style={{background:S2,border:`1px solid ${BD}`,borderRadius:10,padding:'12px',marginBottom:16}}>
            <div style={{fontSize:9,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>Focus List for Today</div>
            {topTasks.map((tk,i)=>{
              const bc=blockColor(tk), p=PRIO[tk.priority||'normal'];
              return(
                <div key={tk.id} style={{display:'flex',gap:8,alignItems:'center',marginBottom:6}}>
                  <span style={{fontSize:10,color:T3,fontFamily:'monospace',width:14}}>{i+1}.</span>
                  <div style={{width:3,height:16,borderRadius:99,background:bc.left,flexShrink:0}}/>
                  <span style={{fontSize:12,color:T1,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tk.title}</span>
                  {tk.dueDate===t&&<span style={{fontSize:9,color:'#fbbf24',fontWeight:700}}>TODAY</span>}
                </div>
              );
            })}
          </div>
        )}

        {delegAlerts.length>0&&(
          <div style={{background:'rgba(248,113,113,.08)',border:'1px solid rgba(248,113,113,.25)',borderRadius:8,padding:'10px',marginBottom:16}}>
            <div style={{fontSize:10,color:'#f87171',fontWeight:700,marginBottom:6}}>⚠ Follow-up Needed</div>
            {delegAlerts.map(tk=>(
              <div key={tk.id} style={{fontSize:11,color:T2,marginBottom:3}}>• {tk.title} → <span style={{color:'#67e8f9'}}>{tk.delegatedTo}</span></div>
            ))}
          </div>
        )}

        <button onClick={onClose} style={{width:'100%',padding:'11px',borderRadius:10,border:'none',background:ACC,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>
          Let's go! 🚀
        </button>
      </div>
    </div>
  );
}

// ─── END OF DAY MODAL ─────────────────────────────────────────────────────────
function EndOfDayModal({tasks, onClose, onSaveNote}) {
  const t=today();
  const doneToday=tasks.filter(x=>x.status==='done'&&x.completedAt&&x.completedAt.slice(0,10)===t);
  const inProg=tasks.filter(x=>x.status==='in_progress');
  const [note, setNote]=useState('');
  const [focus, setFocus]=useState('');

  function save(){
    onSaveNote({date:t, completed:doneToday.length, note:note.trim(), tomorrowFocus:focus.trim(), at:new Date().toISOString()});
    onClose();
  }

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.88)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,zIndex:60}} onClick={onClose}>
      <div style={{background:S1,border:`1px solid ${BD2}`,borderRadius:20,padding:26,width:'100%',maxWidth:440}} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:'center',marginBottom:20}}>
          <div style={{fontSize:22}}>🌙</div>
          <div style={{fontSize:16,fontWeight:800,color:T1,marginTop:6}}>End of Day</div>
          <div style={{fontSize:11,color:T3,marginTop:2}}>Wrap up before you go</div>
        </div>

        <div style={{display:'flex',gap:8,marginBottom:20}}>
          <div style={{flex:1,background:S2,border:`1px solid ${BD}`,borderRadius:8,padding:'10px',textAlign:'center'}}>
            <div style={{fontSize:24,fontWeight:800,color:'#34d399',fontFamily:'monospace'}}>{doneToday.length}</div>
            <div style={{fontSize:9,color:T3,marginTop:2}}>Completed Today</div>
          </div>
          <div style={{flex:1,background:S2,border:`1px solid ${BD}`,borderRadius:8,padding:'10px',textAlign:'center'}}>
            <div style={{fontSize:24,fontWeight:800,color:'#60a5fa',fontFamily:'monospace'}}>{inProg.length}</div>
            <div style={{fontSize:9,color:T3,marginTop:2}}>Still In Progress</div>
          </div>
        </div>

        {doneToday.length>0&&(
          <div style={{background:S2,border:`1px solid ${BD}`,borderRadius:10,padding:'12px',marginBottom:14}}>
            <div style={{fontSize:9,color:'#34d399',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>✅ Done Today</div>
            {doneToday.map(tk=>(
              <div key={tk.id} style={{fontSize:11,color:T2,marginBottom:4,display:'flex',alignItems:'center',gap:6}}>
                <CheckCircle2 size={10} style={{color:'#34d399',flexShrink:0}}/>
                {tk.title}
              </div>
            ))}
          </div>
        )}

        <div style={{marginBottom:12}}>
          <label style={{fontSize:10,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',display:'block',marginBottom:6}}>Today's Notes / Blockers</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="Any blockers? What went well?"
            style={{width:'100%',background:S2,border:`1px solid ${BD2}`,borderRadius:8,color:T1,fontSize:12,padding:'9px 11px',outline:'none',resize:'none',boxSizing:'border-box'}}/>
        </div>

        <div style={{marginBottom:20}}>
          <label style={{fontSize:10,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',display:'block',marginBottom:6}}>Tomorrow's #1 Priority</label>
          <input value={focus} onChange={e=>setFocus(e.target.value)} placeholder="What's the most important thing tomorrow?"
            style={{width:'100%',background:S2,border:`1px solid ${BD2}`,borderRadius:8,color:T1,fontSize:12,padding:'9px 11px',outline:'none',boxSizing:'border-box'}}/>
        </div>

        <div style={{display:'flex',gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:'10px',borderRadius:8,border:`1px solid ${BD2}`,background:'transparent',color:T2,fontSize:12,cursor:'pointer'}}>Skip</button>
          <button onClick={save} style={{flex:2,padding:'10px',borderRadius:8,border:'none',background:ACC,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Save & Done 🌙</button>
        </div>
      </div>
    </div>
  );
}

// ─── COMMITMENT TRACKER ───────────────────────────────────────────────────────
function CommitmentView({commitments, onAdd, onDone, onDelete}) {
  const [text,    setText]    = useState('');
  const [toWhom,  setToWhom]  = useState('');
  const [dueDate, setDueDate] = useState(today());
  const t=today();

  function add(){
    if(!text.trim()) return;
    onAdd({id:uid(), text:text.trim(), toWhom:toWhom.trim(), dueDate, done:false, createdAt:new Date().toISOString()});
    setText(''); setToWhom(''); setDueDate(today());
  }

  const pending=commitments.filter(c=>!c.done).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  const done=commitments.filter(c=>c.done).slice(-5);

  const F={background:S2,border:`1px solid ${BD2}`,borderRadius:8,color:T1,fontSize:12,padding:'8px 10px',outline:'none',boxSizing:'border-box'};

  return(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{background:S1,border:`1px solid ${BD}`,borderRadius:12,padding:'16px'}}>
        <div style={{fontSize:11,fontWeight:700,color:ACCL,marginBottom:12,display:'flex',alignItems:'center',gap:6}}><MessageSquare size={13}/> New Commitment</div>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder='"จะส่งรายงานให้ภายใน..."'
          style={{...F,width:'100%',marginBottom:8}}/>
        <div style={{display:'flex',gap:7,marginBottom:10}}>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:T3,marginBottom:3}}>TO WHOM</div>
            <input value={toWhom} onChange={e=>setToWhom(e.target.value)} placeholder="ชื่อคน / ทีม"
              style={{...F,width:'100%'}}/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:T3,marginBottom:3}}>BY DATE</div>
            <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} style={{...F,width:'100%'}}/>
          </div>
        </div>
        <button onClick={add} disabled={!text.trim()} style={{width:'100%',padding:'9px',borderRadius:8,border:'none',background:text.trim()?ACC:S2,color:text.trim()?'#fff':T3,fontSize:12,fontWeight:700,cursor:text.trim()?'pointer':'not-allowed'}}>
          Log Commitment
        </button>
      </div>

      {pending.length>0&&(
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          <div style={{fontSize:9,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em'}}>Pending ({pending.length})</div>
          {pending.map(c=>{
            const dl=daysUntil(c.dueDate);
            const overdue=dl!==null&&dl<0;
            const soon=dl!==null&&dl<=1;
            return(
              <div key={c.id} style={{background:S1,border:`1px solid ${overdue?'rgba(248,113,113,.4)':soon?'rgba(251,191,36,.3)':BD}`,borderLeft:`3px solid ${overdue?'#f87171':soon?'#fbbf24':ACCL}`,borderRadius:8,padding:'10px 12px',display:'flex',gap:10,alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:T1,fontWeight:500,marginBottom:4}}>{c.text}</div>
                  <div style={{display:'flex',gap:8,fontSize:10,color:T3}}>
                    {c.toWhom&&<span style={{color:'#67e8f9'}}>→ {c.toWhom}</span>}
                    <span style={{color:overdue?'#f87171':soon?'#fbbf24':T3}}>
                      {overdue?`${-dl}d overdue`:dl===0?'Due today':dl===1?'Due tomorrow':`${dl}d left`}
                    </span>
                  </div>
                </div>
                <div style={{display:'flex',gap:5}}>
                  <button onClick={()=>onDone(c.id)} style={{padding:'5px 8px',borderRadius:6,border:`1px solid #34d399`,background:'rgba(52,211,153,.15)',color:'#34d399',cursor:'pointer',fontSize:10,fontWeight:700}}>Done</button>
                  <button onClick={()=>onDelete(c.id)} style={{padding:'5px',borderRadius:6,border:`1px solid ${BD}`,background:'transparent',color:T3,cursor:'pointer'}}><X size={11}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pending.length===0&&<div style={{textAlign:'center',padding:'30px 0',color:T3,fontSize:12}}>No pending commitments 🎉</div>}

      {done.length>0&&(
        <div style={{opacity:.5}}>
          <div style={{fontSize:9,color:T3,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Recently Done</div>
          {done.map(c=>(
            <div key={c.id} style={{fontSize:11,color:T3,marginBottom:4,display:'flex',gap:6,alignItems:'center'}}>
              <CheckCircle2 size={10} style={{color:'#34d399'}}/> {c.text}
              {c.toWhom&&<span style={{color:'#67e8f9',fontSize:9}}>→ {c.toWhom}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DELEGATION VIEW ─────────────────────────────────────────────────────────
function DelegationView({tasks, onPlan, onUpdate}) {
  const delegated = tasks.filter(tk=>tk.delegatedTo&&tk.status!=='done'&&tk.status!=='cancelled')
    .sort((a,b)=>{
      const dA=daysSinceDelegation(a), dB=daysSinceDelegation(b);
      return dB-dA;
    });

  function daysSinceDelegation(tk){
    const lastFu=(tk.followUpHistory||[]).slice(-1)[0];
    const ref=lastFu?lastFu.at:tk.delegatedAt;
    return ref?Math.floor((Date.now()-new Date(ref))/86400000):999;
  }

  function logFollowUp(tk){
    const note=window.prompt(`Follow-up note for "${tk.title}" (delegated to ${tk.delegatedTo}):`);
    if(note===null) return;
    const entry={at:new Date().toISOString(), note:note||'Followed up'};
    onUpdate({...tk, followUpHistory:[...(tk.followUpHistory||[]), entry]});
  }

  if(delegated.length===0) return(
    <div style={{textAlign:'center',padding:'60px 0',color:T3}}>
      <UserCheck size={34} style={{margin:'0 auto 12px',opacity:.2}}/>
      <p style={{fontSize:13,fontWeight:600,color:T2}}>No delegated tasks</p>
      <p style={{fontSize:11,marginTop:4}}>Assign a task to someone in Quick Capture</p>
    </div>
  );

  return(
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      <div style={{fontSize:11,color:T3,marginBottom:4}}>{delegated.length} task{delegated.length!==1?'s':''} delegated</div>
      {delegated.map(tk=>{
        const bc=blockColor(tk);
        const days=daysSinceDelegation(tk);
        const overdue=days>(tk.followUpEvery||3);
        const lastFu=(tk.followUpHistory||[]).slice(-1)[0];
        const dl=dueLabel(tk.dueDate);
        const d=tk.department?DEPT[tk.department]:null;
        return(
          <div key={tk.id} style={{background:S1,border:`1px solid ${overdue?'rgba(248,113,113,.4)':BD}`,borderLeft:`3px solid ${overdue?'#f87171':bc.left}`,borderRadius:8,padding:'10px 12px'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
              <div style={{flex:1,minWidth:0,cursor:'pointer'}} onClick={()=>onPlan(tk)}>
                <div style={{fontSize:13,fontWeight:600,color:T1,marginBottom:5}}>{tk.title}</div>
                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                  <Chip c="#67e8f9" bg="rgba(103,232,249,.1)" br="rgba(103,232,249,.3)"><Users size={8}/>{tk.delegatedTo}</Chip>
                  {d&&<Chip c={d.color} bg={d.bg+'aa'} br={d.color+'44'}>{d.code}</Chip>}
                  {dl&&<Chip c={dl.color} bg={`${dl.color}14`} br={`${dl.color}30`}>{dl.text}</Chip>}
                  <Chip c={overdue?'#f87171':T3} bg={overdue?'rgba(248,113,113,.1)':'transparent'} br={overdue?'rgba(248,113,113,.3)':BD}>
                    <Clock size={8}/>{days===0?'today':`${days}d ago`} {overdue&&'⚠ overdue follow-up'}
                  </Chip>
                </div>
                {lastFu&&<div style={{fontSize:10,color:T3,marginTop:5}}>Last: {lastFu.note} — {fmtTs(lastFu.at)}</div>}
                {(tk.followUpHistory||[]).length===0&&tk.delegatedAt&&(
                  <div style={{fontSize:10,color:T3,marginTop:5}}>Delegated {fmtTs(tk.delegatedAt)} — no follow-up yet</div>
                )}
              </div>
              <button onClick={()=>logFollowUp(tk)} style={{padding:'6px 10px',borderRadius:7,border:`1px solid ${overdue?'#f87171':ACCL}`,background:overdue?'rgba(248,113,113,.15)':'rgba(124,58,237,.2)',color:overdue?'#f87171':ACCL,cursor:'pointer',fontSize:11,fontWeight:700,flexShrink:0,display:'flex',alignItems:'center',gap:4}}>
                <Bell size={11}/> Follow Up
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── WEEKLY REVIEW VIEW ───────────────────────────────────────────────────────
function WeeklyReviewView({tasks, onExport}) {
  const t=today(), wdays=weekDays(t);
  const weekStart=wdays[0], weekEnd=wdays[6];
  const lastWeekStart=addD(weekStart,-7), lastWeekEnd=addD(weekEnd,-7);

  const doneThisWeek=tasks.filter(x=>x.status==='done'&&x.completedAt&&x.completedAt.slice(0,10)>=weekStart&&x.completedAt.slice(0,10)<=weekEnd);
  const doneLastWeek=tasks.filter(x=>x.status==='done'&&x.completedAt&&x.completedAt.slice(0,10)>=lastWeekStart&&x.completedAt.slice(0,10)<=lastWeekEnd);
  const active=tasks.filter(x=>x.status!=='done'&&x.status!=='cancelled');
  const overdue=active.filter(x=>x.dueDate&&x.dueDate<t);
  const inProg=active.filter(x=>x.status==='in_progress');
  const delegated=active.filter(x=>x.delegatedTo);

  const onTime=doneThisWeek.filter(x=>x.dueDate&&x.completedAt&&x.completedAt.slice(0,10)<=x.dueDate);
  const late=doneThisWeek.filter(x=>x.dueDate&&x.completedAt&&x.completedAt.slice(0,10)>x.dueDate);

  // delegation alerts
  const delegAlerts=delegated.filter(tk=>{
    const lastFu=(tk.followUpHistory||[]).slice(-1)[0];
    const ref=lastFu?lastFu.at:tk.delegatedAt;
    const days=ref?Math.floor((Date.now()-new Date(ref))/86400000):999;
    return days>(tk.followUpEvery||3);
  });

  // unscheduled > 7 days old
  const staleTasks=active.filter(x=>!(x.sessions||[]).length&&x.createdAt&&Math.floor((Date.now()-new Date(x.createdAt))/86400000)>7);

  const S=({v,label,color=T1,sub})=>(
    <div style={{background:S1,border:`1px solid ${BD}`,borderRadius:10,padding:'12px',textAlign:'center'}}>
      <div style={{fontSize:26,fontWeight:800,fontFamily:'monospace',color,lineHeight:1}}>{v}</div>
      <div style={{fontSize:9,color:T3,fontWeight:700,textTransform:'uppercase',marginTop:4}}>{label}</div>
      {sub&&<div style={{fontSize:9,color:T3,marginTop:2}}>{sub}</div>}
    </div>
  );

  return(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:15,fontWeight:800,color:T1}}>Weekly Review</div>
          <div style={{fontSize:10,color:T3,marginTop:1}}>{mday(weekStart)} – {mday(weekEnd)}</div>
        </div>
        <button onClick={onExport} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:8,border:`1px solid ${ACCL}`,background:'rgba(124,58,237,.2)',color:ACCL,cursor:'pointer',fontSize:12,fontWeight:700}}>
          <ClipboardList size={13}/> Export Report
        </button>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
        <S v={doneThisWeek.length} label="Completed" color="#34d399" sub={`vs ${doneLastWeek.length} last week`}/>
        <S v={onTime.length} label="On Time" color="#60a5fa"/>
        <S v={late.length} label="Late" color={late.length?'#f87171':T3}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
        <S v={overdue.length} label="Overdue" color={overdue.length?'#f87171':T3}/>
        <S v={inProg.length} label="In Progress" color="#a78bfa"/>
        <S v={delegated.length} label="Delegated" color="#67e8f9"/>
      </div>

      {/* Delegation alerts */}
      {delegAlerts.length>0&&(
        <div style={{background:'rgba(248,113,113,.07)',border:'1px solid rgba(248,113,113,.3)',borderRadius:10,padding:'14px'}}>
          <div style={{fontSize:9,color:'#f87171',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10,display:'flex',alignItems:'center',gap:5}}>
            <Bell size={9}/> Follow-Up Overdue ({delegAlerts.length})
          </div>
          {delegAlerts.map(tk=>{
            const lastFu=(tk.followUpHistory||[]).slice(-1)[0];
            const ref=lastFu?lastFu.at:tk.delegatedAt;
            const days=ref?Math.floor((Date.now()-new Date(ref))/86400000):0;
            return(
              <div key={tk.id} style={{display:'flex',gap:8,alignItems:'center',marginBottom:6,fontSize:12}}>
                <AlertTriangle size={11} style={{color:'#f87171',flexShrink:0}}/>
                <span style={{color:T1,flex:1}}>{tk.title}</span>
                <span style={{color:'#67e8f9',fontSize:10}}>{tk.delegatedTo}</span>
                <span style={{color:'#f87171',fontWeight:700,fontSize:10}}>{days}d no follow-up</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Inbox health */}
      {staleTasks.length>0&&(
        <div style={{background:'rgba(251,191,36,.07)',border:'1px solid rgba(251,191,36,.3)',borderRadius:10,padding:'14px'}}>
          <div style={{fontSize:9,color:'#fbbf24',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10,display:'flex',alignItems:'center',gap:5}}>
            <Zap size={9}/> Inbox Health — {staleTasks.length} tasks unscheduled 7+ days
          </div>
          {staleTasks.slice(0,5).map(tk=>{
            const days=Math.floor((Date.now()-new Date(tk.createdAt))/86400000);
            const dl=dueLabel(tk.dueDate);
            return(
              <div key={tk.id} style={{display:'flex',gap:8,alignItems:'center',marginBottom:5,fontSize:11}}>
                <span style={{color:T2,flex:1}}>{tk.title}</span>
                {dl&&<span style={{color:dl.color,fontWeight:700,fontSize:10}}>{dl.text}</span>}
                <span style={{color:T3,fontSize:10}}>{days}d old</span>
              </div>
            );
          })}
          {staleTasks.length>5&&<div style={{fontSize:10,color:'#fbbf24',marginTop:4}}>+{staleTasks.length-5} more…</div>}
        </div>
      )}

      {/* Done this week list */}
      {doneThisWeek.length>0&&(
        <div style={{background:S1,border:`1px solid ${BD}`,borderRadius:10,padding:'14px'}}>
          <div style={{fontSize:9,color:'#34d399',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:10}}>Completed This Week</div>
          {doneThisWeek.map(tk=>{
            const isOnTime=tk.dueDate&&tk.completedAt&&tk.completedAt.slice(0,10)<=tk.dueDate;
            const d=tk.department?DEPT[tk.department]:null;
            return(
              <div key={tk.id} style={{display:'flex',gap:8,alignItems:'center',padding:'5px 0',borderBottom:`1px solid ${BD}`}}>
                <CheckCircle2 size={11} style={{color:isOnTime?'#34d399':'#fbbf24',flexShrink:0}}/>
                <span style={{fontSize:12,color:T1,flex:1}}>{tk.title}</span>
                {d&&<span style={{fontSize:9,color:d.color,fontWeight:700}}>{d.code}</span>}
                <span style={{fontSize:10,color:isOnTime?'#34d399':'#fbbf24',fontWeight:700}}>{isOnTime?'On time':'Late'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── REPORT MODAL ─────────────────────────────────────────────────────────────
function ReportModal({tasks, onClose}) {
  const [copied, setCopied] = useState(false);
  const t=today(), wdays=weekDays(t);
  const weekStart=wdays[0], weekEnd=wdays[6];

  const active=tasks.filter(x=>x.status!=='done'&&x.status!=='cancelled');
  const doneThisWeek=tasks.filter(x=>x.status==='done'&&x.completedAt&&x.completedAt.slice(0,10)>=weekStart);
  const overdue=active.filter(x=>x.dueDate&&x.dueDate<t);
  const delegated=active.filter(x=>x.delegatedTo);
  const onTime=doneThisWeek.filter(x=>x.dueDate&&x.completedAt&&x.completedAt.slice(0,10)<=x.dueDate);
  const onTimeRate=doneThisWeek.length?Math.round(onTime.length/doneThisWeek.filter(x=>x.dueDate).length*100)||100:null;

  // Group done by department
  const byDept={};
  doneThisWeek.forEach(tk=>{
    const key=tk.department||'Other';
    if(!byDept[key]) byDept[key]=[];
    byDept[key].push(tk);
  });

  const lines=[];
  lines.push(`══════════════════════════════════`);
  lines.push(`  WEEKLY TASK REPORT`);
  lines.push(`  ${mday(weekStart)} – ${mday(weekEnd)}`);
  lines.push(`══════════════════════════════════`);
  lines.push(``);
  lines.push(`📊 SUMMARY`);
  lines.push(`  Completed this week : ${doneThisWeek.length} tasks`);
  lines.push(`  On-time rate        : ${onTimeRate!==null?onTimeRate+'%':'N/A'}`);
  lines.push(`  Active tasks        : ${active.length}`);
  lines.push(`  Overdue             : ${overdue.length}`);
  lines.push(`  Delegated (pending) : ${delegated.length}`);
  lines.push(``);

  if(doneThisWeek.length>0){
    lines.push(`✅ COMPLETED THIS WEEK`);
    Object.entries(byDept).forEach(([dept,list])=>{
      const dinfo=DEPT[dept];
      lines.push(`  [${dept}]${dinfo?` ${dinfo.name}`:''}`);
      list.forEach(tk=>{
        const isLate=tk.dueDate&&tk.completedAt&&tk.completedAt.slice(0,10)>tk.dueDate;
        lines.push(`  ${isLate?'⚠':'✓'} ${tk.title}${isLate?' (LATE)':''}`);
      });
    });
    lines.push(``);
  }

  if(overdue.length>0){
    lines.push(`⚠ OVERDUE TASKS`);
    overdue.forEach(tk=>{
      const days=daysUntil(tk.dueDate);
      const d=tk.department?DEPT[tk.department]:null;
      lines.push(`  • ${tk.title} [${d?d.code:'–'}] — ${-days}d late`);
    });
    lines.push(``);
  }

  if(delegated.length>0){
    lines.push(`👥 DELEGATION STATUS`);
    delegated.forEach(tk=>{
      const lastFu=(tk.followUpHistory||[]).slice(-1)[0];
      const ref=lastFu?lastFu.at:tk.delegatedAt;
      const days=ref?Math.floor((Date.now()-new Date(ref))/86400000):0;
      const overdueFu=days>(tk.followUpEvery||3);
      lines.push(`  • ${tk.title}`);
      lines.push(`    → ${tk.delegatedTo}${overdueFu?` ⚠ no follow-up ${days}d`:` (last contact ${days}d ago)`}`);
    });
    lines.push(``);
  }

  lines.push(`──────────────────────────────────`);
  lines.push(`Generated: ${new Date().toLocaleString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}`);

  const text=lines.join('\n');

  function copy(){
    navigator.clipboard.writeText(text).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  }

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.87)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,zIndex:60}} onClick={onClose}>
      <div style={{background:S1,border:`1px solid ${BD2}`,borderRadius:16,padding:22,width:'100%',maxWidth:560,maxHeight:'90vh',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:800,color:T1,display:'flex',alignItems:'center',gap:7}}><ClipboardList size={15} style={{color:ACCL}}/> Export Report</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:T3,cursor:'pointer'}}><X size={15}/></button>
        </div>
        <pre style={{flex:1,overflowY:'auto',background:BG,border:`1px solid ${BD}`,borderRadius:8,padding:'14px',fontSize:11,color:T2,fontFamily:'monospace',lineHeight:1.7,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
          {text}
        </pre>
        <button onClick={copy} style={{marginTop:14,padding:'11px',borderRadius:10,border:`1px solid ${copied?'#34d399':ACCL}`,background:copied?'rgba(52,211,153,.2)':'rgba(124,58,237,.25)',color:copied?'#34d399':ACCL,fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
          {copied?<><CheckCircle2 size={14}/> Copied!</>:<><Copy size={14}/> Copy to Clipboard</>}
        </button>
      </div>
    </div>
  );
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
const Splash=()=><div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center'}}><Loader2 size={22} style={{color:ACCL,animation:'spin 1s linear infinite'}}/></div>;

function AuthScreen() {
  const [email,setEmail]=useState(''), [sent,setSent]=useState(false), [loading,setLoading]=useState(false);
  async function send(){setLoading(true);await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin}});setLoading(false);setSent(true);}
  return(
    <div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{width:'100%',maxWidth:320}}>
        <h1 style={{fontSize:28,fontWeight:800,color:ACCL,textAlign:'center',marginBottom:4}}>The Nun</h1>
        <p style={{textAlign:'center',color:T2,fontSize:13,marginBottom:28}}>Task Management System</p>
        {sent?<p style={{color:GCAL,textAlign:'center',fontSize:13}}>Check your email for the sign-in link.</p>:(
          <div style={{display:'flex',flexDirection:'column',gap:9}}>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="your@email.com"
              style={{background:S1,border:`1px solid ${BD2}`,borderRadius:9,padding:'11px 13px',color:T1,fontSize:13,outline:'none'}}/>
            <button onClick={send} disabled={!email||loading} style={{padding:'11px',borderRadius:9,border:'none',background:email?ACC:'#1a0e30',color:email?'#fff':T3,fontSize:13,fontWeight:700,cursor:email?'pointer':'not-allowed'}}>
              {loading?'Sending…':'Sign In'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ENTRY ───────────────────────────────────────────────────────────────────
export default function App() {
  if(DEMO_MODE) return <TheNun demoMode/>;
  const [session,setSession]=useState(undefined);
  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,s)=>setSession(s));
    return()=>subscription.unsubscribe();
  },[]);
  if(session===undefined) return <Splash/>;
  if(!session) return <AuthScreen/>;
  return <TheNun session={session}/>;
}

// ─── THE NUN ─────────────────────────────────────────────────────────────────
function TheNun({session, demoMode}) {
  const [tasks,      setTasks]      = useState([]);
  const [ready,      setReady]      = useState(false);
  const [view,       setView]       = useState('inbox');
  // inboxTab kept for compatibility but use inboxSubView now
  const [calView,    setCalView]    = useState('week');
  const [selDate,    setSelDate]    = useState(today());
  const [typeFilter, setTypeFilter] = useState(['work','meeting','personal']);
  const [quickOpen,  setQuickOpen]  = useState(false);
  const [planTask,   setPlanTask]   = useState(null);
  const [showReport,   setShowReport]   = useState(false);
  const [showMorning,  setShowMorning]  = useState(false);
  const [showEOD,      setShowEOD]      = useState(false);
  const [pomodoroTask, setPomodoroTask] = useState(null);
  const [mood,         setMood]         = useState(()=>localStorage.getItem('thenun:mood:'+today())||'');
  const [commitments,  setCommitments]  = useState(()=>{ try{return JSON.parse(localStorage.getItem('thenun:commitments'))||[];}catch{return[];} });
  const [eodLogs,      setEodLogs]      = useState(()=>{ try{return JSON.parse(localStorage.getItem('thenun:eod'))||[];}catch{return[];} });
  const [inboxSubView, setInboxSubView] = useState('mine'); // 'mine'|'delegated'|'commitment'
  const [toast,        setToast]        = useState('');
  const [now,          setNow]          = useState(new Date());
  const gcal = useGoogleCalendar();

  useEffect(()=>{
    loadTasksFromDB().then(raw=>{
      const migrated=migrate(raw);
      const t=today(), updated=migrated.map(tk=>{
        if((tk.status==='not_started'||tk.status==='in_progress')&&tk.dueDate&&tk.dueDate<t){
          return{...tk,dueDate:addD(t,1),rescheduleCount:(tk.rescheduleCount||0)+1};
        }
        return tk;
      });
      setTasks(updated); saveTasks(updated); setReady(true);
    });
  },[]);
  useEffect(()=>{const i=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(i);},[]);
  useEffect(()=>{
    if(!gcal.gcalToken) return;
    const days=calView==='week'?weekDays(selDate):[selDate];
    gcal.fetchEvents(gcal.gcalToken,days[0],days[days.length-1]);
  },[gcal.gcalToken,selDate,calView]);

  function persist(next, deleted){
    setTasks(next); saveTasks(next);
    next.forEach(t => saveTaskToDB(t));
    if(deleted) deleteTaskFromDB(deleted);
  }
  function showToast(msg){setToast(msg);setTimeout(()=>setToast(''),2200);}

  function cycleStatus(id){
    setTasks(prev=>{
      const tk=prev.find(x=>x.id===id); if(!tk) return prev;
      const ns=STATUS[tk.status||'not_started'].next;
      const newAt=new Date().toISOString();
      const hist=[...(tk.statusHistory||[]),{status:ns,at:newAt}];
      const next=prev.map(x=>x.id===id?{...x,status:ns,statusHistory:hist,completedAt:ns==='done'?newAt:tk.completedAt||null}:x);
      saveTasks(next); showToast(`→ ${STATUS[ns].label}`); return next;
    });
  }

  function quickAdd(data){persist([...tasks,data]);setQuickOpen(false);showToast(data.delegatedTo?`Delegated to ${data.delegatedTo} ✓`:'Added to inbox ✓');}
  function savePlan(data){persist(tasks.map(t=>t.id===data.id?data:t));setPlanTask(null);showToast('Saved ✓');}
  function deleteTk(id){persist(tasks.filter(t=>t.id!==id), id);setPlanTask(null);showToast('Deleted');}
  function updateTask(data){persist(tasks.map(t=>t.id===data.id?data:t));showToast('Updated ✓');}

  function saveMood(m){ setMood(m); localStorage.setItem('thenun:mood:'+today(), m); }

  function saveEOD(log){
    const next=[...eodLogs.filter(x=>x.date!==log.date), log];
    setEodLogs(next); localStorage.setItem('thenun:eod', JSON.stringify(next));
    showToast('Day logged 🌙');
  }

  function addCommitment(c){
    const next=[...commitments,c]; setCommitments(next);
    localStorage.setItem('thenun:commitments', JSON.stringify(next));
    showToast('Commitment logged ✓');
  }
  function doneCommitment(id){
    const next=commitments.map(c=>c.id===id?{...c,done:true,doneAt:new Date().toISOString()}:c);
    setCommitments(next); localStorage.setItem('thenun:commitments', JSON.stringify(next));
    showToast('Commitment done ✓');
  }
  function deleteCommitment(id){
    const next=commitments.filter(c=>c.id!==id);
    setCommitments(next); localStorage.setItem('thenun:commitments', JSON.stringify(next));
  }

  function finishPomodoro({actualMins, pomodoros}){
    if(!pomodoroTask) return;
    const updated={...pomodoroTask,
      actualMinutes:(pomodoroTask.actualMinutes||0)+actualMins,
      pomodoroCount:(pomodoroTask.pomodoroCount||0)+pomodoros,
    };
    updateTask(updated);
    showToast(`🍅 ${pomodoros} pomodoro${pomodoros!==1?'s':''} done!`);
  }

  // Notification setup
  useEffect(()=>{
    if(!('Notification' in window)) return;
    if(Notification.permission==='default') Notification.requestPermission();
  },[]);

  // Bottleneck count for badge
  const bottleneckCount = useMemo(()=>
    tasks.filter(tk=>tk.status!=='done'&&tk.status!=='cancelled'&&tk.createdAt&&Math.floor((Date.now()-new Date(tk.createdAt))/86400000)>5).length
  ,[tasks]);

  const t=today();
  const active=tasks.filter(x=>x.status!=='done'&&x.status!=='cancelled');
  const inboxCount=active.filter(x=>!(x.sessions||[]).length&&!x.delegatedTo).length;
  const overdueCount=active.filter(x=>x.dueDate&&x.dueDate<t).length;
  const delegCount=active.filter(x=>x.delegatedTo).length;
  const displayDays=calView==='week'?weekDays(selDate):[selDate];
  // delegation follow-up alerts
  const followAlerts=active.filter(tk=>{
    if(!tk.delegatedTo) return false;
    const lastFu=(tk.followUpHistory||[]).slice(-1)[0];
    const ref=lastFu?lastFu.at:tk.delegatedAt;
    const days=ref?Math.floor((Date.now()-new Date(ref))/86400000):999;
    return days>(tk.followUpEvery||3);
  }).length;

  if(!ready) return <Splash/>;

  return(
    <div style={{minHeight:'100vh',height:'100vh',background:BG,color:T1,fontFamily:"'Inter',system-ui,sans-serif",display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${BG};overflow:hidden;}
        input,select,textarea{font-family:inherit;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${BD2};border-radius:99px;}
        @keyframes spin{to{transform:rotate(360deg)}}
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=time]::-webkit-calendar-picker-indicator{filter:invert(.5);}
      `}</style>

      {/* HEADER */}
      <div style={{borderBottom:`1px solid ${BD}`,padding:'8px 18px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,background:S2}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:ACCL,letterSpacing:'-0.3px'}}>The Nun</div>
            <div style={{fontSize:8,color:T3,fontWeight:600,letterSpacing:'.08em'}}>TASK MANAGEMENT SYSTEM{demoMode?' · DEMO':''}</div>
          </div>
          <div style={{display:'flex',gap:5}}>
            {overdueCount>0&&<Badge n={overdueCount} label="Overdue" c="#f87171"/>}
            {inboxCount>0 &&<Badge n={inboxCount}  label="Inbox"   c={ACCL}/>}
            {mood&&<span style={{fontSize:13,cursor:'pointer'}} onClick={()=>setShowMorning(true)}>{mood==='high'?'⚡':mood==='medium'?'😊':'😴'}</span>}
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {gcal.gcalToken?(
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:GCAL}}/>
              <span style={{fontSize:10,color:GCAL,fontWeight:700}}>Google Cal</span>
              {gcal.gcalLoad&&<Loader2 size={10} style={{color:GCAL,animation:'spin 1s linear infinite'}}/>}
              <button onClick={gcal.disconnect} style={{background:'none',border:`1px solid ${BD}`,color:T3,cursor:'pointer',fontSize:9,padding:'2px 6px',borderRadius:4}}>✕</button>
            </div>
          ):(
            <button onClick={gcal.connect} style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:6,border:`1px solid ${GCAL}55`,background:`${GCAL}12`,color:GCAL,cursor:'pointer',fontSize:10,fontWeight:700}}>
              <CalendarDays size={11}/> Google Cal
            </button>
          )}
          <button onClick={()=>setShowMorning(true)} title="Morning Brief" style={{display:'flex',alignItems:'center',gap:4,padding:'4px 8px',borderRadius:6,border:`1px solid ${BD}`,background:'transparent',color:'#fbbf24',cursor:'pointer',fontSize:10,fontWeight:700}}>
            <Sun size={12}/> Brief
          </button>
          <button onClick={()=>setShowEOD(true)} title="End of Day Wrap-up" style={{display:'flex',alignItems:'center',gap:4,padding:'4px 8px',borderRadius:6,border:`1px solid ${BD}`,background:'transparent',color:'#a78bfa',cursor:'pointer',fontSize:10,fontWeight:700}}>
            <Moon size={12}/> EOD
          </button>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:12,fontFamily:'monospace',color:T1,fontWeight:600}}>{now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</div>
            <div style={{fontSize:9,color:T2}}>{now.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</div>
          </div>
          {!demoMode&&<button onClick={()=>supabase.auth.signOut()} style={{background:'none',border:'none',color:T3,cursor:'pointer'}}><LogOut size={13}/></button>}
        </div>
      </div>

      {/* NAV */}
      <div style={{borderBottom:`1px solid ${BD}`,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 18px',background:BG}}>
        <div style={{display:'flex'}}>
          {[
            ['inbox','Inbox',Inbox,inboxCount],
            ['schedule','Schedule',Calendar,0],
            ['review','Review',Eye,0],
            ['insights','Insights',BarChart2,bottleneckCount],
          ].map(([k,l,Icon,cnt])=>(
            <button key={k} onClick={()=>setView(k)} style={{display:'flex',alignItems:'center',gap:5,padding:'9px 10px',fontSize:12,fontWeight:view===k?700:400,color:view===k?ACCL:T2,background:'none',border:'none',borderBottom:`2px solid ${view===k?ACCL:'transparent'}`,cursor:'pointer'}}>
              <Icon size={13}/>{l}
              {cnt>0&&<span style={{fontSize:9,background:k==='insights'?'#fb923c':ACCL,color:'#fff',borderRadius:10,padding:'0 5px',fontWeight:700}}>{cnt}</span>}
              {k==='inbox'&&followAlerts>0&&<span style={{fontSize:9,background:'#f87171',color:'#fff',borderRadius:10,padding:'0 5px',fontWeight:700}}>{followAlerts}!</span>}
            </button>
          ))}
        </div>
        {view==='schedule'&&(
          <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
            <div style={{display:'flex',background:S2,border:`1px solid ${BD}`,borderRadius:6,padding:2}}>
              {[['day','Day'],['week','Week']].map(([k,l])=>(
                <button key={k} onClick={()=>setCalView(k)} style={{padding:'3px 10px',borderRadius:4,border:'none',background:calView===k?S3:'transparent',color:calView===k?T1:T2,fontSize:11,fontWeight:calView===k?700:400,cursor:'pointer'}}>{l}</button>
              ))}
            </div>
            <button onClick={()=>setSelDate(calView==='week'?addD(selDate,-7):addD(selDate,-1))} style={{background:S2,border:`1px solid ${BD}`,borderRadius:5,padding:'3px 6px',color:T2,cursor:'pointer',display:'flex'}}><ChevronLeft size={12}/></button>
            <button onClick={()=>setSelDate(today())} style={{padding:'3px 9px',borderRadius:5,border:`1px solid ${selDate===today()?ACC:BD}`,background:selDate===today()?'rgba(124,58,237,.2)':S2,color:selDate===today()?ACCL:T2,fontSize:11,cursor:'pointer',fontWeight:600}}>Today</button>
            <button onClick={()=>setSelDate(calView==='week'?addD(selDate,7):addD(selDate,1))} style={{background:S2,border:`1px solid ${BD}`,borderRadius:5,padding:'3px 6px',color:T2,cursor:'pointer',display:'flex'}}><ChevronRight size={12}/></button>
            <span style={{fontSize:11,color:T2,fontWeight:600,whiteSpace:'nowrap'}}>
              {calView==='week'?`${mday(weekDays(selDate)[0])} – ${mday(weekDays(selDate)[6])}`:fmtLong(selDate)}
            </span>
            <div style={{display:'flex',gap:3}}>
              {Object.entries(TASK_TYPES).map(([k,v])=>{
                const on=typeFilter.includes(k);
                return(
                  <button key={k} onClick={()=>setTypeFilter(f=>f.includes(k)?f.filter(x=>x!==k):[...f,k])}
                    style={{padding:'3px 9px',borderRadius:20,border:`1px solid ${on?v.color:BD}`,background:on?v.bg:'transparent',color:on?v.color:T3,fontSize:10,cursor:'pointer',fontWeight:on?700:400}}>
                    {v.icon} {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column',minHeight:0}}>
        {view==='inbox'&&(
          <div style={{flex:1,overflowY:'auto',padding:'14px 18px',maxWidth:720,width:'100%',margin:'0 auto'}}>
            {/* sub-tabs */}
            <div style={{display:'flex',gap:5,marginBottom:14,flexWrap:'wrap'}}>
              {[
                {k:'mine',       label:'My Tasks',    extra:inboxCount>0?inboxCount:null,  c:ACCL},
                {k:'delegated',  label:'Delegated',   extra:delegCount>0?delegCount:null,  c:followAlerts?'#f87171':'#67e8f9', icon:<Users size={10}/>},
                {k:'commitment', label:'Commitments', extra:commitments.filter(c=>!c.done).length||null, c:'#a78bfa', icon:<MessageSquare size={10}/>},
              ].map(tab=>(
                <button key={tab.k} onClick={()=>setInboxSubView(tab.k)}
                  style={{padding:'5px 12px',borderRadius:20,border:`1px solid ${inboxSubView===tab.k?tab.c:BD2}`,background:inboxSubView===tab.k?`${tab.c}18`:'transparent',color:inboxSubView===tab.k?tab.c:T2,fontSize:11,cursor:'pointer',fontWeight:inboxSubView===tab.k?700:400,display:'flex',alignItems:'center',gap:4}}>
                  {tab.icon}{tab.label}
                  {tab.extra&&<span style={{fontSize:9,background:tab.c,color:'#fff',borderRadius:10,padding:'0 5px'}}>{tab.extra}</span>}
                </button>
              ))}
            </div>
            {inboxSubView==='mine'       && <InboxView tasks={tasks.filter(x=>!x.delegatedTo)} onPlan={setPlanTask} onStatusCycle={cycleStatus} onPomodoro={setPomodoroTask}/>}
            {inboxSubView==='delegated'  && <DelegationView tasks={tasks} onPlan={setPlanTask} onUpdate={updateTask}/>}
            {inboxSubView==='commitment' && <CommitmentView commitments={commitments} onAdd={addCommitment} onDone={doneCommitment} onDelete={deleteCommitment}/>}
          </div>
        )}
        {view==='schedule'&&(
          <div style={{flex:1,display:'flex',flexDirection:'column',padding:'10px 18px',overflow:'hidden',minHeight:0}}>
            <CalendarGrid days={displayDays} tasks={tasks} gcalEvents={gcal.gcalEvents}
              onSlotClick={(date,time)=>{
                setPlanTask({id:uid(),title:'New Task',dueDate:date,priority:'normal',taskType:'work',status:'not_started',department:null,notes:'',sessions:[{id:uid(),date,startTime:time,endTime:null}],important:false,rescheduleCount:0,createdAt:new Date().toISOString(),statusHistory:[{status:'not_started',at:new Date().toISOString()}]});
              }}
              onTaskClick={setPlanTask}
              typeFilter={typeFilter}
            />
          </div>
        )}
        {view==='review'&&(
          <div style={{flex:1,overflowY:'auto',padding:'14px 18px',maxWidth:640,margin:'0 auto',width:'100%'}}>
            <WeeklyReviewView tasks={tasks} onExport={()=>setShowReport(true)}/>
          </div>
        )}
        {view==='insights'&&(
          <div style={{flex:1,overflowY:'auto',padding:'14px 18px',maxWidth:600,margin:'0 auto',width:'100%'}}>
            <InsightsView tasks={tasks}/>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={()=>setQuickOpen(true)} style={{position:'fixed',bottom:20,right:20,width:50,height:50,borderRadius:'50%',background:ACC,border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 22px rgba(124,58,237,.65)',zIndex:40,transition:'transform .15s'}} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
        <Plus size={21}/>
      </button>

      {/* TOAST */}
      {toast&&<div style={{position:'fixed',bottom:80,left:'50%',transform:'translateX(-50%)',background:S2,border:`1px solid ${BD2}`,color:T1,fontSize:11,padding:'7px 16px',borderRadius:20,boxShadow:'0 4px 18px rgba(0,0,0,.7)',zIndex:50,whiteSpace:'nowrap'}}>{toast}</div>}

      {/* MODALS */}
      {quickOpen&&<QuickAddModal onSave={quickAdd} onClose={()=>setQuickOpen(false)}/>}
      {planTask&&<PlanModal task={planTask} onSave={savePlan} onDelete={planTask.id&&tasks.find(t=>t.id===planTask.id)?deleteTk:null} onClose={()=>setPlanTask(null)}/>}
      {showReport&&<ReportModal tasks={tasks} onClose={()=>setShowReport(false)}/>}
      {showMorning&&<MorningBriefModal tasks={tasks} mood={mood} onSetMood={saveMood} onClose={()=>setShowMorning(false)}/>}
      {showEOD&&<EndOfDayModal tasks={tasks} onClose={()=>setShowEOD(false)} onSaveNote={saveEOD}/>}
      {pomodoroTask&&<PomodoroTimer task={pomodoroTask} onComplete={finishPomodoro} onClose={()=>setPomodoroTask(null)}/>}
    </div>
  );
}

function Badge({n,label,c}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:4,padding:'2px 8px',borderRadius:20,border:`1px solid ${c}44`,background:`${c}14`,fontSize:9,fontWeight:700,color:c}}>
      <span style={{fontFamily:'monospace'}}>{n}</span>{label}
    </div>
  );
}
