import { useState, useMemo, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { supabase } from "./supabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

// ── 색상 & 상수 ───────────────────────────────────────────────
const LIME   = "#B8FF00";
const DARK   = "#0A0A0A";
const CARD   = "#141414";
const BORDER = "#222";
const MUTED  = "#555";
const TEXT   = "#F0F0F0";
const BLUE   = "#4FC3F7";
const ORANGE = "#FF7043";
const DAYS   = ["월","화","수","목","금","토","일"];

const DEFAULT_EXERCISES = [
  { name:"벤치프레스",      tip:"등을 살짝 아치형으로 유지하고 견갑골을 모아주세요. 바를 가슴 하단에 내리는 게 포인트!" },
  { name:"스쿼트",          tip:"무릎이 발끝 방향으로 향하도록 하고, 엉덩이를 뒤로 빼며 앉으세요. 코어에 힘을 꽉!" },
  { name:"데드리프트",      tip:"허리를 곧게 펴고 바를 몸에 최대한 붙여서 들어올리세요. 엉덩이 힘으로 밀어올리는 느낌!" },
  { name:"풀업",            tip:"팔꿈치를 몸쪽으로 당기는 느낌으로 광배근을 쥐어짜듯 올라오세요." },
  { name:"딥스",            tip:"몸을 살짝 앞으로 기울이면 가슴에, 수직으로 유지하면 삼두에 더 집중됩니다." },
  { name:"숄더프레스",      tip:"팔꿈치가 90도가 될 때까지 내리고, 바벨이 귀 옆을 지나가도록 올리세요." },
  { name:"레그프레스",      tip:"발 위치를 높이 놓을수록 햄스트링, 낮이 놓을수록 대퇴사두에 집중됩니다." },
  { name:"바벨로우",        tip:"상체를 45도로 숙이고 바를 배꼽 쪽으로 당겨주세요. 등을 항상 곧게!" },
  { name:"인클라인프레스",  tip:"30~45도 각도 벤치에서 진행. 상부 가슴에 강한 자극을 줍니다." },
  { name:"런지",            tip:"앞 무릎이 발끝을 넘지 않도록 주의하고, 상체는 수직을 유지하세요." },
  { name:"플랭크",          tip:"엉덩이가 올라가거나 처지지 않도록! 머리부터 발끝까지 일직선으로 유지." },
  { name:"버피",            tip:"유산소와 근력을 동시에! 점프할 때 팔을 머리 위로 완전히 뻗어주세요." },
  { name:"러닝",            tip:"착지는 발 중간으로, 팔을 90도로 구부려 앞뒤로 흔들어주세요. 호흡은 코로!" },
  { name:"케이블크로스오버", tip:"팔을 교차할 때 가슴 근육이 완전히 수축되는 느낌을 집중하세요." },
  { name:"바이셉컬",        tip:"팔꿈치를 고정하고 전완근만 움직이세요. 최상단에서 1초 정지하면 효과 UP!" },
  { name:"트라이셉익스텐션", tip:"팔꿈치를 귀 옆에 고정하고 팔뚝만 움직여주세요. 삼두 완전 수축 느낌!" },
  { name:"레그컬",          tip:"발목을 당기는 느낌으로 햄스트링을 수축. 천천히 내려오는 게 핵심입니다." },
  { name:"레그익스텐션",    tip:"최상단에서 대퇴사두를 완전히 수축시키고 1~2초 유지하면 효과적!" },
  { name:"자전거",          tip:"안장 높이를 페달이 최하단일 때 무릎이 약간 굽혀지는 정도로 맞추세요." },
  { name:"기타",            tip:"" },
];

const DEFAULT_FOODS = [
  { name:"닭가슴살 100g", kcal:165, carb:0,  protein:31, fat:4,  tip:"고단백 저지방의 왕! 브로콜리나 고구마와 함께 먹으면 영양 균형이 완벽해요." },
  { name:"흰쌀밥 1공기",  kcal:300, carb:66, protein:5,  fat:1,  tip:"운동 전·후 에너지 보충에 최고. 단백질 식품(닭가슴살, 달걀)과 함께 드세요." },
  { name:"고구마 1개",    kcal:130, carb:30, protein:2,  fat:0,  tip:"운동 전 1~2시간에 먹으면 지속적인 에너지를 공급해줘요. 단백질과 궁합 최고!" },
  { name:"달걀 1개",      kcal:78,  carb:1,  protein:6,  fat:5,  tip:"완전식품! 아보카도와 함께 먹으면 지용성 비타민 흡수율이 올라가요." },
  { name:"프로틴쉐이크",  kcal:120, carb:5,  protein:24, fat:2,  tip:"운동 후 30분 이내 섭취가 황금 시간! 바나나와 함께 갈아 마시면 맛도 좋아요." },
  { name:"아메리카노",    kcal:10,  carb:1,  protein:0,  fat:0,  tip:"운동 30분 전 카페인 섭취 시 퍼포먼스 향상 효과. 빈속엔 주의하세요!" },
  { name:"바나나 1개",    kcal:105, carb:27, protein:1,  fat:0,  tip:"빠른 에너지 보충에 최고! 운동 직전·직후 모두 OK. 프로틴쉐이크와 환상의 조합." },
  { name:"그릭요거트",    kcal:100, carb:6,  protein:17, fat:1,  tip:"장 건강 + 단백질 두 마리 토끼! 꿀이나 베리류를 올려 먹으면 더욱 맛있어요." },
];

function getTodayStr() { return new Date().toISOString().split("T")[0]; }

// ── 스타일 ────────────────────────────────────────────────────
const S = {
  app:      { background:DARK, minHeight:"100vh", fontFamily:"'DM Mono','Courier New',monospace", color:TEXT, maxWidth:430, margin:"0 auto", paddingBottom:90 },
  header:   { padding:"22px 20px 14px", borderBottom:`1px solid ${BORDER}`, display:"flex", alignItems:"center", justifyContent:"space-between" },
  logo:     { fontSize:21, fontWeight:700, letterSpacing:3, color:LIME, textTransform:"uppercase" },
  dateChip: { fontSize:11, color:MUTED, letterSpacing:1, border:`1px solid ${BORDER}`, padding:"4px 10px", borderRadius:4 },
  nav:      { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"#0D0D0D", borderTop:`1px solid ${BORDER}`, display:"flex", zIndex:100 },
  navBtn:  (a) => ({ flex:1, padding:"10px 0 7px", background:"none", border:"none", color:a?LIME:MUTED, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, borderTop:a?`2px solid ${LIME}`:"2px solid transparent", transition:"all 0.15s" }),
  navLbl:  (a) => ({ fontSize:9, letterSpacing:1.2, fontWeight:600, color:a?LIME:MUTED, textTransform:"uppercase" }),
  sec:      { padding:"18px" },
  card:     { background:CARD, border:`1px solid ${BORDER}`, borderRadius:8, padding:15, marginBottom:11 },
  input:    { width:"100%", background:"#1A1A1A", border:`1px solid ${BORDER}`, borderRadius:6, color:TEXT, padding:"10px 12px", fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none" },
  textarea: { width:"100%", background:"#1A1A1A", border:`1px solid ${BORDER}`, borderRadius:6, color:TEXT, padding:"10px 12px", fontSize:12, fontFamily:"inherit", boxSizing:"border-box", outline:"none", resize:"vertical", minHeight:60 },
  select:   { width:"100%", background:"#1A1A1A", border:`1px solid ${BORDER}`, borderRadius:6, color:TEXT, padding:"10px 12px", fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none" },
  label:    { fontSize:10, letterSpacing:2, color:MUTED, textTransform:"uppercase", marginBottom:5, display:"block" },
  row:      { display:"flex", gap:9 },
  btn:      { width:"100%", background:LIME, border:"none", borderRadius:6, color:"#000", padding:"11px", fontSize:12, fontWeight:700, letterSpacing:2, textTransform:"uppercase", cursor:"pointer", fontFamily:"inherit" },
  btnGhost: { background:"none", border:`1px solid ${BORDER}`, borderRadius:6, color:MUTED, padding:"10px 14px", fontSize:11, cursor:"pointer", fontFamily:"inherit" },
  btnDanger:{ background:"none", border:`1px solid #FF444444`, borderRadius:6, color:"#FF7777", padding:"10px 14px", fontSize:11, cursor:"pointer", fontFamily:"inherit" },
  secTitle: { fontSize:10, letterSpacing:3, color:MUTED, textTransform:"uppercase", marginBottom:12, fontWeight:600 },
  logItem:  { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:`1px solid ${BORDER}` },
  logName:  { fontSize:14, fontWeight:600, color:TEXT },
  logSub:   { fontSize:11, color:MUTED, marginTop:2 },
  logVal:   { fontSize:13, color:LIME, fontWeight:700 },
  statBox:  { background:CARD, border:`1px solid ${BORDER}`, borderRadius:8, padding:"13px 6px", flex:1, textAlign:"center" },
  statNum:  { fontSize:24, fontWeight:700, color:LIME, letterSpacing:-1 },
  statLbl:  { fontSize:9, color:MUTED, letterSpacing:2, textTransform:"uppercase", marginTop:3 },
  delBtn:   { background:"none", border:"none", color:"#FF4444", cursor:"pointer", fontSize:16, padding:"0 3px", lineHeight:1 },
  tag:      { background:"#1E1E1E", border:`1px solid ${BORDER}`, borderRadius:4, padding:"3px 8px", fontSize:10, color:MUTED },
  tipBox:   { background:"#0F1A00", border:`1px solid ${LIME}33`, borderRadius:6, padding:"10px 12px", marginTop:10, fontSize:12, color:"#C8E88A", lineHeight:1.6 },
  tt:       { background:"#1A1A1A", border:`1px solid ${BORDER}`, borderRadius:6, fontSize:12, color:TEXT },
  uploadBox:{ border:`2px dashed ${BORDER}`, borderRadius:8, padding:"20px 16px", textAlign:"center", cursor:"pointer", background:"#111", marginBottom:12 },
  subToggle:{ display:"flex", marginBottom:18, background:"#1A1A1A", borderRadius:8, padding:4 },
  subBtn:  (a) => ({ flex:1, padding:"8px", background:a?LIME:"transparent", border:"none", borderRadius:6, color:a?"#000":MUTED, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }),
  spinner:  { display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:DARK, color:MUTED, fontSize:14, letterSpacing:2 },
};

// ── 공통 컴포넌트 ─────────────────────────────────────────────
function TipBox({ tip }) {
  if (!tip) return null;
  return <div style={S.tipBox}>💡 {tip}</div>;
}

function Spinner({ text = "로딩중..." }) {
  return <div style={S.spinner}>{text}</div>;
}

// ── 로그인 화면 ───────────────────────────────────────────────
function Login() {
  const [mode, setMode]       = useState("login");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg]         = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  async function handleEmail() {
    if (!email || !password) { setMsg("이메일과 비밀번호를 입력해주세요."); return; }
    setLoading(true); setMsg(null);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message === "Invalid login credentials" ? "이메일 또는 비밀번호가 올바르지 않아요." : error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMsg(error.message);
      else setMsg("✅ 가입 완료! 이메일을 확인하여 인증을 완료해주세요.");
    }
    setLoading(false);
  }

  return (
    <div style={{ background:DARK, minHeight:"100vh", fontFamily:"'DM Mono','Courier New',monospace", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ width:"100%", maxWidth:360 }}>
        {/* 로고 */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:32, fontWeight:700, letterSpacing:5, color:LIME }}>FITLOG</div>
          <div style={{ fontSize:12, color:MUTED, marginTop:6, letterSpacing:2 }}>나만의 헬스 기록앱</div>
        </div>

        {/* 구글 로그인 */}
        <button
          onClick={handleGoogle}
          style={{ width:"100%", background:"#fff", border:"none", borderRadius:8, color:"#111", padding:"13px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:20 }}>
          <span style={{ fontSize:18 }}>G</span> Google로 계속하기
        </button>

        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <div style={{ flex:1, height:1, background:BORDER }} />
          <span style={{ fontSize:11, color:MUTED }}>또는</span>
          <div style={{ flex:1, height:1, background:BORDER }} />
        </div>

        {/* 이메일/비밀번호 */}
        <div style={{ marginBottom:10 }}>
          <label style={S.label}>이메일</label>
          <input style={S.input} type="email" placeholder="hello@email.com" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={S.label}>비밀번호</label>
          <input style={S.input} type="password" placeholder="6자 이상" value={password} onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleEmail()} />
        </div>

        <button style={S.btn} onClick={handleEmail} disabled={loading}>
          {loading ? "..." : mode==="login" ? "로그인" : "회원가입"}
        </button>

        {msg && (
          <div style={{ marginTop:12, padding:"10px 12px", background: msg.startsWith("✅")?"#0F1A00":"#1A0000", border:`1px solid ${msg.startsWith("✅")?LIME+"44":"#FF444444"}`, borderRadius:6, fontSize:12, color: msg.startsWith("✅")?"#C8E88A":"#FF7777" }}>
            {msg}
          </div>
        )}

        <div style={{ textAlign:"center", marginTop:20 }}>
          <button
            onClick={() => { setMode(m=>m==="login"?"signup":"login"); setMsg(null); }}
            style={{ background:"none", border:"none", color:MUTED, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
            {mode==="login" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 운동 탭 ───────────────────────────────────────────────────
function WorkoutTab({ workouts, addWorkout, deleteWorkout, exerciseDB }) {
  const today = getTodayStr();
  const [form, setForm]       = useState({ exercise: exerciseDB[0]?.name || "", weight:"", sets:"", reps:"" });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]   = useState(false);

  const todayW      = workouts.filter(w => w.date===today);
  const totalVolume = todayW.reduce((s,w) => s+w.weight*w.sets*w.reps, 0);
  const selectedTip = exerciseDB.find(e => e.name===form.exercise)?.tip || "";

  async function handleAdd() {
    if (!form.sets || !form.reps || !form.exercise) return;
    setSaving(true);
    await addWorkout(form);
    setForm(f => ({ ...f, weight:"", sets:"", reps:"" }));
    setShowForm(false);
    setSaving(false);
  }

  return (
    <div style={S.sec}>
      <div style={{ display:"flex", gap:9, marginBottom:18 }}>
        <div style={S.statBox}><div style={S.statNum}>{todayW.length}</div><div style={S.statLbl}>오늘 운동</div></div>
        <div style={S.statBox}><div style={S.statNum}>{totalVolume.toLocaleString()}</div><div style={S.statLbl}>총 볼륨 kg</div></div>
      </div>

      <button style={{ ...S.btn, marginBottom:14 }} onClick={() => setShowForm(!showForm)}>
        {showForm ? "✕ 닫기" : "+ 운동 추가"}
      </button>

      {showForm && (
        <div style={{ ...S.card, borderColor:LIME+"44" }}>
          <div style={{ marginBottom:11 }}>
            <label style={S.label}>운동 종류</label>
            <select style={S.select} value={form.exercise} onChange={e => setForm(f=>({...f, exercise:e.target.value}))}>
              {exerciseDB.map(o => <option key={o.name} value={o.name}>{o.name}</option>)}
            </select>
            <TipBox tip={selectedTip} />
          </div>
          <div style={S.row}>
            {[["무게(kg)","weight","80"],["세트","sets","4"],["횟수","reps","8"]].map(([l,k,ph]) => (
              <div key={k} style={{ flex:1 }}>
                <label style={S.label}>{l}</label>
                <input style={S.input} type="number" placeholder={ph} value={form[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} />
              </div>
            ))}
          </div>
          <button style={{ ...S.btn, marginTop:13, opacity:saving?0.6:1 }} onClick={handleAdd} disabled={saving}>
            {saving ? "저장 중..." : "기록하기"}
          </button>
        </div>
      )}

      <div style={S.secTitle}>오늘의 운동</div>
      {todayW.length===0
        ? <div style={{ textAlign:"center", color:MUTED, fontSize:13, padding:"28px 0" }}>아직 기록이 없어요 💪</div>
        : todayW.map(w => (
          <div key={w.id} style={S.logItem}>
            <div>
              <div style={S.logName}>{w.exercise}</div>
              <div style={S.logSub}>{w.weight>0?`${w.weight}kg · `:""}{w.sets}세트 × {w.reps}회</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              {w.weight>0 && <div style={S.logVal}>{(w.weight*w.sets*w.reps).toLocaleString()}<span style={{ fontSize:10, color:MUTED }}>kg</span></div>}
              <button style={S.delBtn} onClick={() => deleteWorkout(w.id)}>×</button>
            </div>
          </div>
        ))
      }

      {workouts.filter(w=>w.date!==today).length>0 && (
        <>
          <div style={{ ...S.secTitle, marginTop:22 }}>최근 기록</div>
          {[...new Set(workouts.filter(w=>w.date!==today).map(w=>w.date))].slice(0,3).map(date => (
            <div key={date} style={S.card}>
              <div style={{ fontSize:10, color:MUTED, letterSpacing:2, marginBottom:7 }}>{date}</div>
              {workouts.filter(w=>w.date===date).map(w => (
                <div key={w.id} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:13 }}>{w.exercise}</span>
                  <span style={{ fontSize:12, color:MUTED }}>{w.sets}×{w.reps}{w.weight>0?` @ ${w.weight}kg`:""}</span>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── 식단 탭 ───────────────────────────────────────────────────
function FoodTab({ foods, addFood, deleteFood, foodDB }) {
  const today  = getTodayStr();
  const [form, setForm]           = useState({ name:"", kcal:"", carb:"", protein:"", fat:"" });
  const [showForm, setShowForm]   = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [saving, setSaving]       = useState(false);

  const todayF   = foods.filter(f => f.date===today);
  const totals   = todayF.reduce((s,f) => ({ kcal:s.kcal+f.kcal, carb:s.carb+f.carb, protein:s.protein+f.protein, fat:s.fat+f.fat }), { kcal:0,carb:0,protein:0,fat:0 });
  const macroSum = totals.carb+totals.protein+totals.fat || 1;

  async function handleAdd(data=null) {
    const d = data || { ...form, kcal:Number(form.kcal)||0, carb:Number(form.carb)||0, protein:Number(form.protein)||0, fat:Number(form.fat)||0 };
    if (!d.name) return;
    setSaving(true);
    await addFood(d);
    setForm({ name:"", kcal:"", carb:"", protein:"", fat:"" });
    setShowForm(false); setShowPresets(false); setSelectedFood(null);
    setSaving(false);
  }

  return (
    <div style={S.sec}>
      <div style={{ ...S.card, borderColor:LIME+"33", marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:13 }}>
          <div>
            <div style={{ fontSize:10, color:MUTED, letterSpacing:2, textTransform:"uppercase" }}>오늘 섭취</div>
            <div style={{ fontSize:34, fontWeight:700, color:LIME, letterSpacing:-2 }}>{totals.kcal.toLocaleString()}<span style={{ fontSize:13, color:MUTED }}> kcal</span></div>
          </div>
          <div style={{ textAlign:"right", fontSize:11, lineHeight:1.8 }}>
            <div style={{ color:MUTED }}>탄 <span style={{ color:BLUE }}>{totals.carb}g</span></div>
            <div style={{ color:MUTED }}>단 <span style={{ color:LIME }}>{totals.protein}g</span></div>
            <div style={{ color:MUTED }}>지 <span style={{ color:ORANGE }}>{totals.fat}g</span></div>
          </div>
        </div>
        <div style={{ display:"flex", gap:2, height:5, borderRadius:3, overflow:"hidden", background:"#1A1A1A" }}>
          <div style={{ width:`${(totals.carb/macroSum*100).toFixed(0)}%`, background:BLUE, transition:"width 0.4s" }} />
          <div style={{ width:`${(totals.protein/macroSum*100).toFixed(0)}%`, background:LIME, transition:"width 0.4s" }} />
          <div style={{ width:`${(totals.fat/macroSum*100).toFixed(0)}%`, background:ORANGE, transition:"width 0.4s" }} />
        </div>
        <div style={{ display:"flex", gap:12, marginTop:6 }}>
          {[["탄수화물",BLUE],["단백질",LIME],["지방",ORANGE]].map(([n,c]) => (
            <div key={n} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:7, height:7, borderRadius:2, background:c }} />
              <span style={{ fontSize:10, color:MUTED }}>{n}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...S.row, marginBottom:14 }}>
        <button style={{ ...S.btn, flex:1 }} onClick={() => { setShowPresets(!showPresets); setShowForm(false); setSelectedFood(null); }}>⚡ 빠른 추가</button>
        <button style={{ ...S.btn, flex:1, background:"#1A1A1A", color:TEXT, border:`1px solid ${BORDER}` }}
          onClick={() => { setShowForm(!showForm); setShowPresets(false); setSelectedFood(null); }}>✎ 직접 입력</button>
      </div>

      {showPresets && (
        <div style={{ ...S.card, marginBottom:14 }}>
          <div style={S.secTitle}>내 음식 DB</div>
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {foodDB.map((p,i) => (
              <div key={i}>
                <button
                  onClick={() => setSelectedFood(selectedFood?.name===p.name ? null : p)}
                  style={{ width:"100%", background:selectedFood?.name===p.name?"#1A2A00":"#1A1A1A", border:`1px solid ${selectedFood?.name===p.name?LIME+"88":BORDER}`, borderRadius:7, color:TEXT, padding:"11px 13px", fontSize:12, cursor:"pointer", fontFamily:"inherit", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"all 0.15s" }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13 }}>{p.name}</div>
                    <div style={{ color:MUTED, fontSize:10, marginTop:2 }}>탄{p.carb}g · 단{p.protein}g · 지{p.fat}g</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ color:LIME, fontWeight:700 }}>{p.kcal} kcal</div>
                    <div style={{ color:MUTED, fontSize:10, marginTop:2 }}>{selectedFood?.name===p.name?"▲ 접기":"▼ 상세"}</div>
                  </div>
                </button>
                {selectedFood?.name===p.name && (
                  <div style={{ background:"#0F1A00", border:`1px solid ${LIME}33`, borderRadius:"0 0 7px 7px", padding:"10px 13px", marginTop:-1 }}>
                    {p.tip && <div style={{ fontSize:12, color:"#C8E88A", lineHeight:1.6, marginBottom:10 }}>💡 {p.tip}</div>}
                    <button style={{ ...S.btn, fontSize:11, opacity:saving?0.6:1 }} onClick={() => handleAdd(p)} disabled={saving}>
                      {saving ? "저장 중..." : "+ 식단에 추가"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ ...S.card, borderColor:LIME+"44", marginBottom:14 }}>
          <div style={{ marginBottom:9 }}>
            <label style={S.label}>음식 이름</label>
            <input style={S.input} placeholder="닭가슴살 100g" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
          </div>
          <div style={{ marginBottom:9 }}>
            <label style={S.label}>칼로리</label>
            <input style={S.input} type="number" placeholder="165" value={form.kcal} onChange={e => setForm(f=>({...f,kcal:e.target.value}))} />
          </div>
          <div style={S.row}>
            {[["탄수화물","carb","66"],["단백질","protein","30"],["지방","fat","5"]].map(([l,k,ph]) => (
              <div key={k} style={{ flex:1 }}>
                <label style={S.label}>{l}(g)</label>
                <input style={S.input} type="number" placeholder={ph} value={form[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} />
              </div>
            ))}
          </div>
          <button style={{ ...S.btn, marginTop:13, opacity:saving?0.6:1 }} onClick={() => handleAdd()} disabled={saving}>
            {saving ? "저장 중..." : "추가하기"}
          </button>
        </div>
      )}

      <div style={S.secTitle}>오늘 식단</div>
      {todayF.length===0
        ? <div style={{ textAlign:"center", color:MUTED, fontSize:13, padding:"28px 0" }}>아직 기록이 없어요 🥗</div>
        : todayF.map(f => (
          <div key={f.id} style={S.logItem}>
            <div>
              <div style={S.logName}>{f.name}</div>
              <div style={S.logSub}>탄{f.carb}g · 단{f.protein}g · 지{f.fat}g</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={S.logVal}>{f.kcal}<span style={{ fontSize:10, color:MUTED }}>kcal</span></div>
              <button style={S.delBtn} onClick={() => deleteFood(f.id)}>×</button>
            </div>
          </div>
        ))
      }
    </div>
  );
}

// ── 통계 탭 ───────────────────────────────────────────────────
function StatsTab({ workouts, foods }) {
  const weeklyData = useMemo(() => {
    const days = [];
    for (let i=6; i>=0; i--) {
      const d = new Date(); d.setDate(d.getDate()-i);
      const ds = d.toISOString().split("T")[0];
      days.push({
        name: DAYS[(d.getDay()+6)%7],
        칼로리: foods.filter(f=>f.date===ds).reduce((s,f)=>s+f.kcal,0),
        볼륨:   workouts.filter(w=>w.date===ds).reduce((s,w)=>s+w.weight*w.sets*w.reps,0),
      });
    }
    return days;
  }, [workouts, foods]);

  return (
    <div style={S.sec}>
      <div style={{ display:"flex", gap:9, marginBottom:18 }}>
        <div style={S.statBox}><div style={S.statNum}>{workouts.length}</div><div style={S.statLbl}>총 운동</div></div>
        <div style={S.statBox}><div style={S.statNum}>{Math.round(weeklyData.reduce((s,d)=>s+d.칼로리,0)/7)}</div><div style={S.statLbl}>평균 kcal</div></div>
        <div style={S.statBox}><div style={{ fontSize:19, fontWeight:700, color:LIME }}>{(workouts.reduce((s,w)=>s+w.weight*w.sets*w.reps,0)/1000).toFixed(1)}t</div><div style={S.statLbl}>총 볼륨</div></div>
      </div>
      <div style={S.secTitle}>주간 칼로리</div>
      <div style={{ ...S.card, marginBottom:18 }}>
        <ResponsiveContainer width="100%" height={145}>
          <BarChart data={weeklyData} margin={{ top:0,right:0,bottom:0,left:-20 }}>
            <CartesianGrid stroke={BORDER} vertical={false} />
            <XAxis dataKey="name" tick={{ fill:MUTED, fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:MUTED, fontSize:10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={S.tt} cursor={{ fill:"#ffffff08" }} />
            <Bar dataKey="칼로리" fill={LIME} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={S.secTitle}>주간 운동 볼륨 (kg)</div>
      <div style={{ ...S.card, marginBottom:18 }}>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={weeklyData} margin={{ top:10,right:10,bottom:0,left:-20 }}>
            <CartesianGrid stroke={BORDER} vertical={false} />
            <XAxis dataKey="name" tick={{ fill:MUTED, fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:MUTED, fontSize:10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={S.tt} />
            <Line type="monotone" dataKey="볼륨" stroke={LIME} strokeWidth={2} dot={{ fill:LIME, r:4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={S.secTitle}>자주 한 운동 TOP 5</div>
      <div style={S.card}>
        {Object.entries(workouts.reduce((acc,w)=>{ acc[w.exercise]=(acc[w.exercise]||0)+1; return acc; },{}))
          .sort((a,b)=>b[1]-a[1]).slice(0,5)
          .map(([name,count],i) => (
            <div key={name} style={{ ...S.logItem, borderBottom:i<4?`1px solid ${BORDER}`:"none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                <span style={{ fontSize:11, color:LIME, fontWeight:700, width:14 }}>{i+1}</span>
                <span style={{ fontSize:13 }}>{name}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <div style={{ height:4, borderRadius:2, background:LIME, width:Math.min(count*18,80) }} />
                <span style={{ fontSize:11, color:MUTED }}>{count}회</span>
              </div>
            </div>
          ))
        }
        {workouts.length===0 && <div style={{ textAlign:"center", color:MUTED, fontSize:13, padding:"18px 0" }}>운동 기록이 없어요</div>}
      </div>
    </div>
  );
}

// ── 몸무게 탭 ─────────────────────────────────────────────────
function WeightTab({ weightLogs, addWeight, deleteWeight, profile, saveProfile }) {
  const [newWeight, setNewWeight] = useState("");
  const [newDate, setNewDate]     = useState(getTodayStr());
  const [editProfile, setEditProfile] = useState(false);
  const [draft, setDraft]         = useState(profile);
  const [saving, setSaving]       = useState(false);

  const sorted  = [...weightLogs].sort((a,b)=>a.date.localeCompare(b.date));
  const latest  = sorted[sorted.length-1];
  const oldest  = sorted[0];
  const totalChange = latest&&oldest ? (latest.value-oldest.value).toFixed(1) : null;
  const lastWeekItems = sorted.filter(w => { const d=new Date(); d.setDate(d.getDate()-7); return w.date>=d.toISOString().split("T")[0]; });
  const weekChange = lastWeekItems.length>=2 ? (lastWeekItems[lastWeekItems.length-1].value-lastWeekItems[0].value).toFixed(1) : null;

  const bmi     = latest?.value && profile.height ? (latest.value/Math.pow(profile.height/100,2)).toFixed(1) : null;
  const bmiInfo = bmi ? (bmi<18.5?["저체중","#4FC3F7"]:bmi<23?["정상",LIME]:bmi<25?["과체중","#FFD740"]:["비만","#FF7043"]) : null;

  const chartData = sorted.slice(-20).map(w=>({ date:w.date.slice(5), 몸무게:w.value }));
  const minV = sorted.length ? Math.min(...sorted.map(w=>w.value))-1 : 60;
  const maxV = sorted.length ? Math.max(...sorted.map(w=>w.value))+1 : 90;

  async function handleAddWeight() {
    const v = parseFloat(newWeight);
    if (!v||!newDate) return;
    setSaving(true);
    await addWeight({ date:newDate, value:v });
    setNewWeight(""); setNewDate(getTodayStr());
    setSaving(false);
  }

  async function handleSaveProfile() {
    setSaving(true);
    await saveProfile(draft);
    setEditProfile(false);
    setSaving(false);
  }

  return (
    <div style={S.sec}>
      <div style={{ ...S.card, textAlign:"center", padding:"20px 16px", marginBottom:14 }}>
        <div style={{ fontSize:40, marginBottom:8 }}>{profile.avatar||"⚖️"}</div>
        <div style={{ fontSize:18, fontWeight:700 }}>{profile.name||"내 프로필"}</div>
        <div style={{ fontSize:12, color:MUTED, marginTop:2 }}>{profile.goal||"목표를 설정해보세요"}</div>
        {bmi && (
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#1A1A1A", border:`1px solid ${bmiInfo[1]}44`, borderRadius:6, padding:"7px 18px", marginTop:11 }}>
            <span style={{ fontSize:20, fontWeight:700, color:bmiInfo[1] }}>BMI {bmi}</span>
            <span style={{ fontSize:12, color:bmiInfo[1] }}>{bmiInfo[0]}</span>
          </div>
        )}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:18 }}>
        {[["키",profile.height?`${profile.height}cm`:"-"],["현재",latest?`${latest.value}kg`:"-"],["목표",profile.targetWeight?`${profile.targetWeight}kg`:"-"]]
          .map(([l,v])=>(
            <div key={l} style={S.statBox}>
              <div style={{ fontSize:15, fontWeight:700, color:LIME }}>{v}</div>
              <div style={S.statLbl}>{l}</div>
            </div>
          ))
        }
      </div>

      {sorted.length>=2 && (
        <div style={{ ...S.card, marginBottom:18 }}>
          <div style={S.secTitle}>변화 요약</div>
          <div style={{ display:"flex", gap:8 }}>
            {[
              ["전체 변화", totalChange!==null?`${totalChange>0?"+":""}${totalChange}kg`:"-", totalChange<0?LIME:ORANGE],
              ["이번 주",   weekChange!==null?`${weekChange>0?"+":""}${weekChange}kg`:"-",    weekChange!==null&&weekChange<=0?LIME:ORANGE],
              ["측정 횟수", `${sorted.length}회`, TEXT],
            ].map(([l,v,c])=>(
              <div key={l} style={{ flex:1, textAlign:"center", background:"#1A1A1A", borderRadius:6, padding:"11px 6px" }}>
                <div style={{ fontSize:14, fontWeight:700, color:c }}>{v}</div>
                <div style={{ fontSize:10, color:MUTED, marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {chartData.length>=2 && (
        <>
          <div style={S.secTitle}>몸무게 변화 추이</div>
          <div style={{ ...S.card, marginBottom:18 }}>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top:10,right:10,bottom:0,left:-10 }}>
                <CartesianGrid stroke={BORDER} vertical={false} />
                <XAxis dataKey="date" tick={{ fill:MUTED, fontSize:10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[minV,maxV]} tick={{ fill:MUTED, fontSize:10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={S.tt} formatter={v=>[`${v}kg`,"몸무게"]} />
                <Line type="monotone" dataKey="몸무게" stroke={LIME} strokeWidth={2.5} dot={{ fill:LIME, r:3 }} activeDot={{ r:5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div style={S.secTitle}>몸무게 기록</div>
      <div style={{ ...S.card, marginBottom:14 }}>
        <div style={S.row}>
          <div style={{ flex:1.4 }}>
            <label style={S.label}>날짜</label>
            <input style={S.input} type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} />
          </div>
          <div style={{ flex:1 }}>
            <label style={S.label}>몸무게 (kg)</label>
            <input style={S.input} type="number" step="0.1" placeholder="78.5" value={newWeight} onChange={e=>setNewWeight(e.target.value)} />
          </div>
        </div>
        <button style={{ ...S.btn, marginTop:11, opacity:saving?0.6:1 }} onClick={handleAddWeight} disabled={saving}>
          {saving?"저장 중...":"기록하기"}
        </button>
      </div>

      <div style={S.secTitle}>기록 목록</div>
      <div style={S.card}>
        {[...sorted].reverse().slice(0,10).map((w,i,arr)=>{
          const prev = arr[i+1];
          const diff = prev ? (w.value-prev.value).toFixed(1) : null;
          const col  = diff===null?MUTED:diff<0?LIME:diff>0?ORANGE:MUTED;
          return (
            <div key={w.id} style={{ ...S.logItem, borderBottom:i<arr.length-1?`1px solid ${BORDER}`:"none" }}>
              <div>
                <div style={S.logName}>{w.value} <span style={{ fontSize:12, color:MUTED }}>kg</span></div>
                <div style={S.logSub}>{w.date}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                {diff!==null && <span style={{ fontSize:13, color:col, fontWeight:600 }}>{diff>0?"+":""}{diff}</span>}
                <button style={S.delBtn} onClick={()=>deleteWeight(w.id)}>×</button>
              </div>
            </div>
          );
        })}
        {sorted.length===0 && <div style={{ textAlign:"center", color:MUTED, fontSize:13, padding:"18px 0" }}>기록이 없어요</div>}
      </div>

      <div style={{ marginTop:18 }}>
        {!editProfile
          ? <button style={S.btn} onClick={()=>{ setDraft(profile); setEditProfile(true); }}>프로필 수정</button>
          : (
            <div style={{ ...S.card, borderColor:LIME+"44" }}>
              <div style={S.secTitle}>프로필 수정</div>
              {[["이름","name","text","홍길동"],["목표","goal","text","다이어트"],["키(cm)","height","number","175"],["목표 체중(kg)","targetWeight","number","72"],["목표 칼로리","targetKcal","number","2200"]]
                .map(([l,k,t,ph])=>(
                  <div key={k} style={{ marginBottom:9 }}>
                    <label style={S.label}>{l}</label>
                    <input style={S.input} type={t} placeholder={ph} value={draft[k]||""} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))} />
                  </div>
                ))
              }
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:11 }}>
                {["💪","🏋️","🔥","⚡","🦾","🏃","🧗","🥊"].map(e=>(
                  <button key={e} onClick={()=>setDraft(d=>({...d,avatar:e}))}
                    style={{ background:draft.avatar===e?LIME+"22":"none", border:`1px solid ${draft.avatar===e?LIME:BORDER}`, borderRadius:8, fontSize:21, padding:7, cursor:"pointer" }}>
                    {e}
                  </button>
                ))}
              </div>
              <div style={S.row}>
                <button style={{ ...S.btn, flex:1, opacity:saving?0.6:1 }} onClick={handleSaveProfile} disabled={saving}>{saving?"저장 중...":"저장"}</button>
                <button style={{ ...S.btnGhost, flex:1 }} onClick={()=>setEditProfile(false)}>취소</button>
              </div>
            </div>
          )
        }
      </div>
    </div>
  );
}

// ── DB 관리 탭 ────────────────────────────────────────────────
function DBTab({ exerciseDB, addExercise, deleteExercise, uploadExercises, foodDB, addFoodDB, deleteFoodDB, uploadFoods }) {
  const [subTab, setSubTab]   = useState("exercise");
  const [newEx, setNewEx]     = useState({ name:"", tip:"" });
  const [showExForm, setShowExForm] = useState(false);
  const [newFood, setNewFood] = useState({ name:"", kcal:"", carb:"", protein:"", fat:"", tip:"" });
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const [saving, setSaving]   = useState(false);
  const fileInputRef          = useRef();

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type:"binary" });
        let addedEx = 0, addedFood = 0;

        if (wb.Sheets[wb.SheetNames[0]]) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header:1 });
          const list = rows.slice(1).map(r => ({ name:String(r[0]||"").trim(), tip:String(r[1]||"").trim() })).filter(r=>r.name);
          addedEx = await uploadExercises(list);
        }
        if (wb.SheetNames.length >= 2) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[1]], { header:1 });
          const list = rows.slice(1).map(r => ({ name:String(r[0]||"").trim(), kcal:Number(r[1])||0, carb:Number(r[2])||0, protein:Number(r[3])||0, fat:Number(r[4])||0, tip:String(r[5]||"").trim() })).filter(r=>r.name);
          addedFood = await uploadFoods(list);
        }
        setUploadMsg(`✅ 완료! 운동 ${addedEx}개, 음식 ${addedFood}개 추가`);
        setTimeout(()=>setUploadMsg(null), 4000);
      } catch {
        setUploadMsg("❌ 파일 읽기 실패. 형식을 확인해주세요.");
        setTimeout(()=>setUploadMsg(null), 4000);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  }

  function downloadTemplate() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["운동명","팁"],["케틀벨 스윙","히프힌지 동작이 핵심!"],["시티드로우","광배근 수축에 집중!"]]), "운동DB");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["음식명","칼로리","탄수화물(g)","단백질(g)","지방(g)","팁"],["현미밥 1공기",280,58,6,2,"GI지수 낮아 다이어트에 좋아요."],["아보카도 1/2개",120,6,2,11,"건강한 지방의 보고!"]]), "음식DB");
    XLSX.writeFile(wb, "FITLOG_DB_템플릿.xlsx");
  }

  async function handleAddExercise() {
    const name = newEx.name.trim();
    if (!name || exerciseDB.find(e=>e.name===name)) return;
    setSaving(true);
    await addExercise({ name, tip:newEx.tip.trim() });
    setNewEx({ name:"", tip:"" }); setShowExForm(false);
    setSaving(false);
  }

  async function handleAddFood() {
    if (!newFood.name.trim()) return;
    setSaving(true);
    await addFoodDB({ ...newFood, name:newFood.name.trim(), kcal:Number(newFood.kcal)||0, carb:Number(newFood.carb)||0, protein:Number(newFood.protein)||0, fat:Number(newFood.fat)||0, tip:newFood.tip.trim() });
    setNewFood({ name:"", kcal:"", carb:"", protein:"", fat:"", tip:"" }); setShowFoodForm(false);
    setSaving(false);
  }

  return (
    <div style={S.sec}>
      {/* 엑셀 업로드 */}
      <div style={S.secTitle}>엑셀 일괄 업로드</div>
      <div style={{ ...S.card, marginBottom:18 }}>
        <div style={{ fontSize:12, color:MUTED, lineHeight:1.7, marginBottom:12 }}>
          시트1: <span style={{ color:LIME }}>운동DB</span> (운동명 | 팁)<br/>
          시트2: <span style={{ color:LIME }}>음식DB</span> (음식명 | 칼로리 | 탄수화물 | 단백질 | 지방 | 팁)
        </div>
        <div style={S.row}>
          <button style={{ ...S.btn, flex:1, fontSize:11 }} onClick={()=>fileInputRef.current.click()}>📂 엑셀 업로드</button>
          <button style={{ ...S.btnGhost, flex:1, fontSize:11, color:LIME, borderColor:LIME+"44" }} onClick={downloadTemplate}>⬇ 템플릿</button>
        </div>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display:"none" }} onChange={handleFileUpload} />
        {uploadMsg && (
          <div style={{ marginTop:10, padding:"9px 12px", background:"#0F1A00", border:`1px solid ${LIME}44`, borderRadius:6, fontSize:12, color:"#C8E88A" }}>{uploadMsg}</div>
        )}
      </div>

      <div style={S.subToggle}>
        {[["exercise","🏋️ 운동 DB"],["food","🍽️ 음식 DB"]].map(([k,l])=>(
          <button key={k} onClick={()=>setSubTab(k)} style={S.subBtn(subTab===k)}>{l}</button>
        ))}
      </div>

      {subTab==="exercise" && (
        <>
          <button style={{ ...S.btn, marginBottom:11 }} onClick={()=>setShowExForm(!showExForm)}>
            {showExForm?"✕ 닫기":"+ 운동 직접 추가"}
          </button>
          {showExForm && (
            <div style={{ ...S.card, borderColor:LIME+"44", marginBottom:11 }}>
              <div style={{ marginBottom:9 }}>
                <label style={S.label}>운동 이름</label>
                <input style={S.input} placeholder="예) 케틀벨 스윙" value={newEx.name} onChange={e=>setNewEx(f=>({...f,name:e.target.value}))} />
              </div>
              <div style={{ marginBottom:9 }}>
                <label style={S.label}>운동 팁 (선택)</label>
                <textarea style={S.textarea} placeholder="이 운동을 효과적으로 하는 팁..." value={newEx.tip} onChange={e=>setNewEx(f=>({...f,tip:e.target.value}))} />
              </div>
              <button style={{ ...S.btn, opacity:saving?0.6:1 }} onClick={handleAddExercise} disabled={saving}>{saving?"저장 중...":"추가하기"}</button>
            </div>
          )}
          <div style={S.secTitle}>등록된 운동 ({exerciseDB.length}개)</div>
          <div style={S.card}>
            {exerciseDB.map((ex,i)=>(
              <div key={ex.id||ex.name} style={{ ...S.logItem, borderBottom:`1px solid ${BORDER}` }}>
                <div style={{ flex:1 }}>
                  <div style={S.logName}>{ex.name}</div>
                  {ex.tip && <div style={{ fontSize:11, color:MUTED, marginTop:3, lineHeight:1.5 }}>{ex.tip.slice(0,50)}{ex.tip.length>50?"…":""}</div>}
                </div>
                <div style={{ marginLeft:10 }}>
                  {ex.is_default ? <span style={S.tag}>기본</span> : <button style={S.delBtn} onClick={()=>deleteExercise(ex.id)}>×</button>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {subTab==="food" && (
        <>
          <button style={{ ...S.btn, marginBottom:11 }} onClick={()=>setShowFoodForm(!showFoodForm)}>
            {showFoodForm?"✕ 닫기":"+ 음식 직접 추가"}
          </button>
          {showFoodForm && (
            <div style={{ ...S.card, borderColor:LIME+"44", marginBottom:11 }}>
              {[["음식 이름","name","text","현미밥 1공기"],["칼로리 (kcal)","kcal","number","280"]].map(([l,k,t,ph])=>(
                <div key={k} style={{ marginBottom:9 }}>
                  <label style={S.label}>{l}</label>
                  <input style={S.input} type={t} placeholder={ph} value={newFood[k]} onChange={e=>setNewFood(f=>({...f,[k]:e.target.value}))} />
                </div>
              ))}
              <div style={{ ...S.row, marginBottom:9 }}>
                {[["탄수화물","carb","58"],["단백질","protein","6"],["지방","fat","2"]].map(([l,k,ph])=>(
                  <div key={k} style={{ flex:1 }}>
                    <label style={S.label}>{l}(g)</label>
                    <input style={S.input} type="number" placeholder={ph} value={newFood[k]} onChange={e=>setNewFood(f=>({...f,[k]:e.target.value}))} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:9 }}>
                <label style={S.label}>팁 / 궁합 (선택)</label>
                <textarea style={S.textarea} placeholder="예) 닭가슴살과 함께 먹으면 단백질 보충에 최고!" value={newFood.tip} onChange={e=>setNewFood(f=>({...f,tip:e.target.value}))} />
              </div>
              <button style={{ ...S.btn, opacity:saving?0.6:1 }} onClick={handleAddFood} disabled={saving}>{saving?"저장 중...":"DB에 추가"}</button>
            </div>
          )}
          <div style={S.secTitle}>등록된 음식 ({foodDB.length}개)</div>
          <div style={S.card}>
            {foodDB.map((f,i)=>(
              <div key={f.id||f.name+i} style={{ ...S.logItem, borderBottom:i<foodDB.length-1?`1px solid ${BORDER}`:"none" }}>
                <div style={{ flex:1 }}>
                  <div style={S.logName}>{f.name}</div>
                  <div style={S.logSub}>탄{f.carb}g · 단{f.protein}g · 지{f.fat}g</div>
                  {f.tip && <div style={{ fontSize:11, color:MUTED, marginTop:3 }}>{f.tip.slice(0,50)}{f.tip.length>50?"…":""}</div>}
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5, marginLeft:10 }}>
                  <div style={{ fontSize:12, color:LIME, fontWeight:700 }}>{f.kcal}kcal</div>
                  {f.is_default ? <span style={S.tag}>기본</span> : <button style={S.delBtn} onClick={()=>deleteFoodDB(f.id)}>×</button>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── APP ROOT ─────────────────────────────────────────────────
export default function App() {
  const [user, setUser]           = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [tab, setTab]             = useState("workout");

  const [workouts, setWorkouts]     = useState([]);
  const [foods, setFoods]           = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [profile, setProfileState]  = useState({ name:"", avatar:"⚖️", height:"", targetWeight:"", targetKcal:"2000", goal:"" });
  const [exerciseDB, setExerciseDB] = useState([]);
  const [foodDB, setFoodDB]         = useState([]);

  // ── 인증 설정 ──────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── 로그인 시 데이터 로드 ──────────────────────────────────
  useEffect(() => {
    if (user) loadAllData();
    else { setWorkouts([]); setFoods([]); setWeightLogs([]); setExerciseDB([]); setFoodDB([]); }
  }, [user]);

  async function loadAllData() {
    setDataLoading(true);
    const uid = user.id;

    const [
      { data: w },
      { data: f },
      { data: wl },
      { data: p },
      { data: exDB },
      { data: fDB },
    ] = await Promise.all([
      supabase.from("workouts").select("*").eq("user_id", uid).order("date", { ascending: false }),
      supabase.from("foods").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      supabase.from("weight_logs").select("*").eq("user_id", uid).order("date"),
      supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("exercise_db").select("*").eq("user_id", uid).order("id"),
      supabase.from("food_db").select("*").eq("user_id", uid).order("id"),
    ]);

    setWorkouts(w || []);
    setFoods(f || []);
    setWeightLogs(wl || []);

    if (p) setProfileState({ name:p.name, avatar:p.avatar, height:p.height, targetWeight:p.target_weight, targetKcal:p.target_kcal, goal:p.goal });

    // 운동 DB: 처음 로그인이면 기본값 삽입
    if (exDB && exDB.length > 0) {
      setExerciseDB(exDB);
    } else {
      const { data: inserted } = await supabase.from("exercise_db")
        .insert(DEFAULT_EXERCISES.map(e => ({ user_id:uid, name:e.name, tip:e.tip, is_default:true })))
        .select();
      setExerciseDB(inserted || []);
    }

    // 음식 DB: 처음 로그인이면 기본값 삽입
    if (fDB && fDB.length > 0) {
      setFoodDB(fDB);
    } else {
      const { data: inserted } = await supabase.from("food_db")
        .insert(DEFAULT_FOODS.map(f => ({ user_id:uid, name:f.name, kcal:f.kcal, carb:f.carb, protein:f.protein, fat:f.fat, tip:f.tip, is_default:true })))
        .select();
      setFoodDB(inserted || []);
    }

    setDataLoading(false);
  }

  // ── 운동 ──────────────────────────────────────────────────
  async function addWorkout(form) {
    const { data } = await supabase.from("workouts").insert({ user_id:user.id, date:getTodayStr(), exercise:form.exercise, weight:Number(form.weight)||0, sets:Number(form.sets), reps:Number(form.reps) }).select();
    if (data) setWorkouts(p => [data[0], ...p]);
  }
  async function deleteWorkout(id) {
    await supabase.from("workouts").delete().eq("id", id);
    setWorkouts(p => p.filter(w => w.id !== id));
  }

  // ── 식단 ──────────────────────────────────────────────────
  async function addFood(d) {
    const { data } = await supabase.from("foods").insert({ user_id:user.id, date:getTodayStr(), name:d.name, kcal:d.kcal, carb:d.carb, protein:d.protein, fat:d.fat }).select();
    if (data) setFoods(p => [data[0], ...p]);
  }
  async function deleteFood(id) {
    await supabase.from("foods").delete().eq("id", id);
    setFoods(p => p.filter(f => f.id !== id));
  }

  // ── 몸무게 ────────────────────────────────────────────────
  async function addWeight({ date, value }) {
    const { data } = await supabase.from("weight_logs").upsert({ user_id:user.id, date, value }, { onConflict:"user_id,date" }).select();
    if (data) setWeightLogs(p => [...p.filter(w=>w.date!==date), data[0]].sort((a,b)=>a.date.localeCompare(b.date)));
  }
  async function deleteWeight(id) {
    await supabase.from("weight_logs").delete().eq("id", id);
    setWeightLogs(p => p.filter(w => w.id !== id));
  }

  // ── 프로필 ────────────────────────────────────────────────
  async function saveProfile(d) {
    await supabase.from("profiles").upsert({ user_id:user.id, name:d.name||"", avatar:d.avatar||"⚖️", height:d.height||"", target_weight:d.targetWeight||"", target_kcal:d.targetKcal||"2000", goal:d.goal||"" }, { onConflict:"user_id" });
    setProfileState(d);
  }

  // ── 운동 DB ───────────────────────────────────────────────
  async function addExercise({ name, tip }) {
    const { data } = await supabase.from("exercise_db").insert({ user_id:user.id, name, tip:tip||"", is_default:false }).select();
    if (data) setExerciseDB(p => [...p, data[0]]);
  }
  async function deleteExercise(id) {
    await supabase.from("exercise_db").delete().eq("id", id);
    setExerciseDB(p => p.filter(e => e.id !== id));
  }
  async function uploadExercises(list) {
    const toInsert = list.filter(e => !exerciseDB.find(x=>x.name===e.name)).map(e => ({ user_id:user.id, name:e.name, tip:e.tip||"", is_default:false }));
    if (!toInsert.length) return 0;
    const { data } = await supabase.from("exercise_db").insert(toInsert).select();
    if (data) setExerciseDB(p => [...p, ...data]);
    return toInsert.length;
  }

  // ── 음식 DB ───────────────────────────────────────────────
  async function addFoodDB(f) {
    const { data } = await supabase.from("food_db").insert({ user_id:user.id, name:f.name, kcal:f.kcal, carb:f.carb, protein:f.protein, fat:f.fat, tip:f.tip||"", is_default:false }).select();
    if (data) setFoodDB(p => [...p, data[0]]);
  }
  async function deleteFoodDB(id) {
    await supabase.from("food_db").delete().eq("id", id);
    setFoodDB(p => p.filter(f => f.id !== id));
  }
  async function uploadFoods(list) {
    const toInsert = list.filter(f => !foodDB.find(x=>x.name===f.name)).map(f => ({ user_id:user.id, name:f.name, kcal:f.kcal||0, carb:f.carb||0, protein:f.protein||0, fat:f.fat||0, tip:f.tip||"", is_default:false }));
    if (!toInsert.length) return 0;
    const { data } = await supabase.from("food_db").insert(toInsert).select();
    if (data) setFoodDB(p => [...p, ...data]);
    return toInsert.length;
  }

  async function signOut() { await supabase.auth.signOut(); }

  // ── 렌더 ──────────────────────────────────────────────────
  if (authLoading) return <Spinner text="FITLOG ..." />;
  if (!user)       return <Login />;
  if (dataLoading) return <Spinner text="데이터 불러오는 중..." />;

  const today = new Date().toLocaleDateString("ko-KR", { month:"long", day:"numeric", weekday:"short" });
  const tabs = [
    { id:"workout", icon:"🏋️", label:"운동"   },
    { id:"food",    icon:"🍽️", label:"식단"   },
    { id:"stats",   icon:"📊", label:"통계"   },
    { id:"weight",  icon:"⚖️", label:"몸무게"  },
    { id:"db",      icon:"⚙️", label:"DB관리" },
  ];

  return (
    <div style={S.app}>
      <div style={S.header}>
        <div style={S.logo}>FITLOG</div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={S.dateChip}>{today}</div>
          <button onClick={signOut} style={{ background:"none", border:`1px solid ${BORDER}`, borderRadius:4, color:MUTED, fontSize:11, padding:"4px 8px", cursor:"pointer", fontFamily:"inherit" }}>로그아웃</button>
        </div>
      </div>

      {tab==="workout" && <WorkoutTab workouts={workouts} addWorkout={addWorkout} deleteWorkout={deleteWorkout} exerciseDB={exerciseDB} />}
      {tab==="food"    && <FoodTab    foods={foods} addFood={addFood} deleteFood={deleteFood} foodDB={foodDB} />}
      {tab==="stats"   && <StatsTab   workouts={workouts} foods={foods} />}
      {tab==="weight"  && <WeightTab  weightLogs={weightLogs} addWeight={addWeight} deleteWeight={deleteWeight} profile={profile} saveProfile={saveProfile} />}
      {tab==="db"      && <DBTab      exerciseDB={exerciseDB} addExercise={addExercise} deleteExercise={deleteExercise} uploadExercises={uploadExercises} foodDB={foodDB} addFoodDB={addFoodDB} deleteFoodDB={deleteFoodDB} uploadFoods={uploadFoods} />}

      <nav style={S.nav}>
        {tabs.map(t=>(
          <button key={t.id} style={S.navBtn(tab===t.id)} onClick={()=>setTab(t.id)}>
            <span style={{ fontSize:17 }}>{t.icon}</span>
            <span style={S.navLbl(tab===t.id)}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
