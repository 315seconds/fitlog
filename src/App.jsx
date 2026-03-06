import { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

const LIME   = "#B8FF00";
const DARK   = "#0A0A0A";
const CARD   = "#141414";
const BORDER = "#222";
const MUTED  = "#555";
const TEXT   = "#F0F0F0";
const BLUE   = "#4FC3F7";
const ORANGE = "#FF7043";
const DAYS   = ["월","화","수","목","금","토","일"];

// exerciseDB: [{name, tip}]
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

// foodDB: [{name, kcal, carb, protein, fat, tip}]
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

const seedWorkouts = [
  { id:1, date:"2026-02-20", exercise:"벤치프레스", weight:80,   sets:4, reps:8  },
  { id:2, date:"2026-02-20", exercise:"스쿼트",     weight:100,  sets:5, reps:5  },
  { id:3, date:"2026-02-24", exercise:"데드리프트",  weight:120,  sets:3, reps:5  },
  { id:4, date:"2026-02-27", exercise:"풀업",        weight:0,    sets:4, reps:10 },
  { id:5, date:"2026-03-03", exercise:"벤치프레스", weight:82.5, sets:4, reps:8  },
];
const seedFoods = [
  { id:1, date:"2026-02-27", name:"닭가슴살 100g", kcal:165, carb:0,  protein:31, fat:4 },
  { id:2, date:"2026-02-27", name:"흰쌀밥 1공기",  kcal:300, carb:66, protein:5,  fat:1 },
  { id:3, date:"2026-03-03", name:"프로틴쉐이크",  kcal:120, carb:5,  protein:24, fat:2 },
  { id:4, date:"2026-03-05", name:"달걀 1개",      kcal:78,  carb:1,  protein:6,  fat:5 },
];
const seedWeights = [
  { id:1, date:"2026-02-06", value:80.2 },
  { id:2, date:"2026-02-10", value:79.8 },
  { id:3, date:"2026-02-14", value:79.5 },
  { id:4, date:"2026-02-17", value:79.1 },
  { id:5, date:"2026-02-21", value:78.8 },
  { id:6, date:"2026-02-24", value:78.5 },
  { id:7, date:"2026-02-28", value:78.2 },
  { id:8, date:"2026-03-04", value:77.9 },
];

function getTodayStr() { return new Date().toISOString().split("T")[0]; }

// ── STYLES ───────────────────────────────────────────────────
const S = {
  app:      { background:DARK, minHeight:"100vh", fontFamily:"'DM Mono','Courier New',monospace", color:TEXT, maxWidth:430, margin:"0 auto", paddingBottom:90 },
  header:   { padding:"22px 20px 14px", borderBottom:`1px solid ${BORDER}`, display:"flex", alignItems:"center", justifyContent:"space-between" },
  logo:     { fontSize:21, fontWeight:700, letterSpacing:3, color:LIME, textTransform:"uppercase" },
  dateChip: { fontSize:11, color:MUTED, letterSpacing:1, border:`1px solid ${BORDER}`, padding:"4px 10px", borderRadius:4 },
  nav:      { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"#0D0D0D", borderTop:`1px solid ${BORDER}`, display:"flex", zIndex:100 },
  navBtn:  (a) => ({ flex:1, padding:"10px 0 7px", background:"none", border:"none", color:a?LIME:MUTED, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, borderTop:a?`2px solid ${LIME}`:"2px solid transparent", transition:"all 0.15s" }),
  navLbl:  (a) => ({ fontSize:9, letterSpacing:1.2, fontWeight:600, color:a?LIME:MUTED, textTransform:"uppercase" }),
  sec:      { padding:"18px 18px" },
  card:     { background:CARD, border:`1px solid ${BORDER}`, borderRadius:8, padding:15, marginBottom:11 },
  input:    { width:"100%", background:"#1A1A1A", border:`1px solid ${BORDER}`, borderRadius:6, color:TEXT, padding:"10px 12px", fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none" },
  textarea: { width:"100%", background:"#1A1A1A", border:`1px solid ${BORDER}`, borderRadius:6, color:TEXT, padding:"10px 12px", fontSize:12, fontFamily:"inherit", boxSizing:"border-box", outline:"none", resize:"vertical", minHeight:60 },
  select:   { width:"100%", background:"#1A1A1A", border:`1px solid ${BORDER}`, borderRadius:6, color:TEXT, padding:"10px 12px", fontSize:13, fontFamily:"inherit", boxSizing:"border-box", outline:"none" },
  label:    { fontSize:10, letterSpacing:2, color:MUTED, textTransform:"uppercase", marginBottom:5, display:"block" },
  row:      { display:"flex", gap:9 },
  btn:      { width:"100%", background:LIME, border:"none", borderRadius:6, color:"#000", padding:"11px", fontSize:12, fontWeight:700, letterSpacing:2, textTransform:"uppercase", cursor:"pointer", fontFamily:"inherit" },
  btnGhost: { background:"none", border:`1px solid ${BORDER}`, borderRadius:6, color:MUTED, padding:"10px 14px", fontSize:11, cursor:"pointer", fontFamily:"inherit", letterSpacing:1 },
  btnSm:    { background:"#1A1A1A", border:`1px solid ${BORDER}`, borderRadius:5, color:MUTED, padding:"6px 12px", fontSize:11, cursor:"pointer", fontFamily:"inherit" },
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
  uploadBox:{ border:`2px dashed ${BORDER}`, borderRadius:8, padding:"22px 16px", textAlign:"center", cursor:"pointer", background:"#111", marginBottom:12 },
  subToggle:{ display:"flex", gap:0, marginBottom:18, background:"#1A1A1A", borderRadius:8, padding:4 },
  subBtn:  (a) => ({ flex:1, padding:"8px", background:a?LIME:"transparent", border:"none", borderRadius:6, color:a?"#000":MUTED, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }),
};

// ── TIP BOX ──────────────────────────────────────────────────
function TipBox({ tip }) {
  if (!tip) return null;
  return <div style={S.tipBox}>💡 {tip}</div>;
}

// ── WORKOUT TAB ──────────────────────────────────────────────
function WorkoutTab({ workouts, setWorkouts, exerciseDB }) {
  const today = getTodayStr();
  const [form, setForm]       = useState({ exercise: exerciseDB[0]?.name || "", weight:"", sets:"", reps:"" });
  const [showForm, setShowForm] = useState(false);
  const todayW       = workouts.filter(w => w.date===today);
  const totalVolume  = todayW.reduce((s,w) => s+w.weight*w.sets*w.reps, 0);
  const selectedTip  = exerciseDB.find(e => e.name===form.exercise)?.tip || "";

  function add() {
    if (!form.sets || !form.reps || !form.exercise) return;
    setWorkouts(p => [...p, { ...form, id:Date.now(), date:today, weight:Number(form.weight)||0, sets:Number(form.sets), reps:Number(form.reps) }]);
    setForm(f => ({ ...f, weight:"", sets:"", reps:"" }));
    setShowForm(false);
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
          <button style={{ ...S.btn, marginTop:13 }} onClick={add}>기록하기</button>
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
              <button style={S.delBtn} onClick={() => setWorkouts(p=>p.filter(x=>x.id!==w.id))}>×</button>
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

// ── FOOD TAB ─────────────────────────────────────────────────
function FoodTab({ foods, setFoods, foodDB }) {
  const today = getTodayStr();
  const [form, setForm]           = useState({ name:"", kcal:"", carb:"", protein:"", fat:"" });
  const [showForm, setShowForm]   = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null); // for tip display
  const todayF   = foods.filter(f => f.date===today);
  const totals   = todayF.reduce((s,f) => ({ kcal:s.kcal+f.kcal, carb:s.carb+f.carb, protein:s.protein+f.protein, fat:s.fat+f.fat }), { kcal:0,carb:0,protein:0,fat:0 });
  const macroSum = totals.carb+totals.protein+totals.fat || 1;

  function addFood(data=null) {
    const d = data || { ...form, kcal:Number(form.kcal)||0, carb:Number(form.carb)||0, protein:Number(form.protein)||0, fat:Number(form.fat)||0 };
    if (!d.name) return;
    setFoods(p => [...p, { ...d, id:Date.now(), date:today }]);
    setForm({ name:"", kcal:"", carb:"", protein:"", fat:"" });
    setShowForm(false); setShowPresets(false); setSelectedFood(null);
  }

  return (
    <div style={S.sec}>
      {/* Kcal card */}
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

      {/* Preset list */}
      {showPresets && (
        <div style={{ ...S.card, marginBottom:14 }}>
          <div style={S.secTitle}>내 음식 DB</div>
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {foodDB.map((p,i) => (
              <div key={i}>
                <button
                  onClick={() => setSelectedFood(selectedFood?.name===p.name ? null : p)}
                  style={{ width:"100%", background: selectedFood?.name===p.name ? "#1A2A00" : "#1A1A1A", border:`1px solid ${selectedFood?.name===p.name ? LIME+"88" : BORDER}`, borderRadius:7, color:TEXT, padding:"11px 13px", fontSize:12, cursor:"pointer", fontFamily:"inherit", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"all 0.15s" }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13 }}>{p.name}</div>
                    <div style={{ color:MUTED, fontSize:10, marginTop:2 }}>탄{p.carb}g · 단{p.protein}g · 지{p.fat}g</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ color:LIME, fontWeight:700 }}>{p.kcal} kcal</div>
                    <div style={{ color:MUTED, fontSize:10, marginTop:2 }}>{selectedFood?.name===p.name ? "▲ 접기" : "▼ 상세"}</div>
                  </div>
                </button>
                {selectedFood?.name===p.name && (
                  <div style={{ background:"#0F1A00", border:`1px solid ${LIME}33`, borderRadius:"0 0 7px 7px", padding:"10px 13px", marginTop:-1 }}>
                    {p.tip && <div style={{ fontSize:12, color:"#C8E88A", lineHeight:1.6, marginBottom:10 }}>💡 {p.tip}</div>}
                    <button style={{ ...S.btn, fontSize:11 }} onClick={() => addFood(p)}>+ 식단에 추가</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual form */}
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
          <button style={{ ...S.btn, marginTop:13 }} onClick={() => addFood()}>추가하기</button>
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
              <button style={S.delBtn} onClick={() => setFoods(p=>p.filter(x=>x.id!==f.id))}>×</button>
            </div>
          </div>
        ))
      }
    </div>
  );
}

// ── STATS TAB ────────────────────────────────────────────────
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

// ── WEIGHT TAB ────────────────────────────────────────────────
function WeightTab({ profile, setProfile, weightLogs, setWeightLogs }) {
  const [newWeight, setNewWeight] = useState("");
  const [newDate, setNewDate]     = useState(getTodayStr());
  const [editProfile, setEditProfile] = useState(false);
  const [draft, setDraft]         = useState(profile);

  const sorted  = [...weightLogs].sort((a,b)=>a.date.localeCompare(b.date));
  const latest  = sorted[sorted.length-1];
  const oldest  = sorted[0];
  const totalChange = latest&&oldest ? (latest.value-oldest.value).toFixed(1) : null;
  const lastWeekItems = sorted.filter(w => { const d=new Date(); d.setDate(d.getDate()-7); return w.date>=d.toISOString().split("T")[0]; });
  const weekChange    = lastWeekItems.length>=2 ? (lastWeekItems[lastWeekItems.length-1].value-lastWeekItems[0].value).toFixed(1) : null;

  const bmi     = latest?.value && profile.height ? (latest.value/Math.pow(profile.height/100,2)).toFixed(1) : null;
  const bmiInfo = bmi ? (bmi<18.5?["저체중","#4FC3F7"]:bmi<23?["정상",LIME]:bmi<25?["과체중","#FFD740"]:["비만","#FF7043"]) : null;

  const chartData = sorted.slice(-20).map(w=>({ date:w.date.slice(5), 몸무게:w.value }));
  const minV = sorted.length ? Math.min(...sorted.map(w=>w.value))-1 : 60;
  const maxV = sorted.length ? Math.max(...sorted.map(w=>w.value))+1 : 90;

  function addWeight() {
    const v = parseFloat(newWeight);
    if (!v||!newDate) return;
    setWeightLogs(p => [...p.filter(w=>w.date!==newDate), { id:Date.now(), date:newDate, value:v }].sort((a,b)=>a.date.localeCompare(b.date)));
    setNewWeight(""); setNewDate(getTodayStr());
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
              ["이번 주",   weekChange!==null?`${weekChange>0?"+":""}${weekChange}kg`:"-",  weekChange!==null&&weekChange<=0?LIME:ORANGE],
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
        <button style={{ ...S.btn, marginTop:11 }} onClick={addWeight}>기록하기</button>
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
                <button style={S.delBtn} onClick={()=>setWeightLogs(p=>p.filter(x=>x.id!==w.id))}>×</button>
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
                <button style={{ ...S.btn, flex:1 }} onClick={()=>{ setProfile(draft); setEditProfile(false); }}>저장</button>
                <button style={{ ...S.btnGhost, flex:1 }} onClick={()=>setEditProfile(false)}>취소</button>
              </div>
            </div>
          )
        }
      </div>
    </div>
  );
}

// ── DB TAB ────────────────────────────────────────────────────
function DBTab({ exerciseDB, setExerciseDB, foodDB, setFoodDB }) {
  const [subTab, setSubTab]   = useState("exercise");
  const [newEx, setNewEx]     = useState({ name:"", tip:"" });
  const [showExForm, setShowExForm] = useState(false);
  const [newFood, setNewFood] = useState({ name:"", kcal:"", carb:"", protein:"", fat:"", tip:"" });
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const fileInputRef = useRef();

  // ── Excel upload ──────────────────────────────────────────
  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb   = XLSX.read(ev.target.result, { type:"binary" });
        let addedEx = 0, addedFood = 0;

        // 시트 1: 운동 DB  →  컬럼: 운동명 | 팁
        const exSheet = wb.Sheets[wb.SheetNames[0]];
        if (exSheet) {
          const rows = XLSX.utils.sheet_to_json(exSheet, { header:1 });
          rows.forEach((row, i) => {
            if (i===0) return; // 헤더 스킵
            const name = String(row[0]||"").trim();
            const tip  = String(row[1]||"").trim();
            if (!name) return;
            setExerciseDB(p => {
              if (p.find(e=>e.name===name)) return p;
              addedEx++;
              return [...p, { name, tip }];
            });
          });
        }

        // 시트 2: 음식 DB  →  컬럼: 음식명 | 칼로리 | 탄수화물 | 단백질 | 지방 | 팁
        if (wb.SheetNames.length >= 2) {
          const foodSheet = wb.Sheets[wb.SheetNames[1]];
          const rows = XLSX.utils.sheet_to_json(foodSheet, { header:1 });
          rows.forEach((row, i) => {
            if (i===0) return;
            const name    = String(row[0]||"").trim();
            const kcal    = Number(row[1])||0;
            const carb    = Number(row[2])||0;
            const protein = Number(row[3])||0;
            const fat     = Number(row[4])||0;
            const tip     = String(row[5]||"").trim();
            if (!name) return;
            setFoodDB(p => {
              if (p.find(f=>f.name===name)) return p;
              addedFood++;
              return [...p, { name, kcal, carb, protein, fat, tip }];
            });
          });
        }

        setUploadMsg(`✅ 업로드 완료! 운동 ${addedEx}개, 음식 ${addedFood}개 추가됨`);
        setTimeout(()=>setUploadMsg(null), 4000);
      } catch(err) {
        setUploadMsg("❌ 파일 읽기 실패. 형식을 확인해주세요.");
        setTimeout(()=>setUploadMsg(null), 4000);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  }

  // ── 샘플 엑셀 다운로드 ────────────────────────────────────
  function downloadTemplate() {
    const wb = XLSX.utils.book_new();

    const exData = [
      ["운동명", "팁"],
      ["케틀벨 스윙", "히프힌지 동작이 핵심! 팔이 아닌 엉덩이 힘으로 스윙하세요."],
      ["시티드로우",  "등을 곧게 펴고 팔꿈치를 뒤로 당기는 느낌으로 광배근을 수축!"],
    ];
    const foodData = [
      ["음식명", "칼로리", "탄수화물(g)", "단백질(g)", "지방(g)", "팁"],
      ["현미밥 1공기", 280, 58, 6, 2, "흰쌀밥보다 GI지수가 낮아 다이어트에 유리해요."],
      ["아보카도 1/2개", 120, 6, 2, 11, "건강한 지방의 보고! 달걀과 함께 먹으면 비타민 흡수율 UP."],
    ];

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(exData),   "운동DB");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(foodData), "음식DB");
    XLSX.writeFile(wb, "FITLOG_DB_템플릿.xlsx");
  }

  function addExercise() {
    const name = newEx.name.trim();
    if (!name || exerciseDB.find(e=>e.name===name)) return;
    setExerciseDB(p=>[...p,{ name, tip:newEx.tip.trim() }]);
    setNewEx({ name:"", tip:"" }); setShowExForm(false);
  }
  function addFood() {
    if (!newFood.name.trim()) return;
    setFoodDB(p=>[...p,{ ...newFood, name:newFood.name.trim(), kcal:Number(newFood.kcal)||0, carb:Number(newFood.carb)||0, protein:Number(newFood.protein)||0, fat:Number(newFood.fat)||0, tip:newFood.tip.trim() }]);
    setNewFood({ name:"", kcal:"", carb:"", protein:"", fat:"", tip:"" }); setShowFoodForm(false);
  }

  const isDefaultEx   = (name) => DEFAULT_EXERCISES.find(e=>e.name===name);
  const isDefaultFood = (name) => DEFAULT_FOODS.find(f=>f.name===name);

  return (
    <div style={S.sec}>
      {/* Excel upload section */}
      <div style={S.secTitle}>엑셀 일괄 업로드</div>
      <div style={S.card}>
        <div style={{ fontSize:12, color:MUTED, lineHeight:1.7, marginBottom:12 }}>
          시트1: <span style={{ color:LIME }}>운동DB</span> (운동명 | 팁)<br/>
          시트2: <span style={{ color:LIME }}>음식DB</span> (음식명 | 칼로리 | 탄수화물 | 단백질 | 지방 | 팁)
        </div>
        <div style={S.row}>
          <button style={{ ...S.btn, flex:1, fontSize:11 }} onClick={()=>fileInputRef.current.click()}>
            📂 엑셀 업로드 (.xlsx)
          </button>
          <button style={{ ...S.btnGhost, flex:1, fontSize:11, color:LIME, borderColor:LIME+"44" }} onClick={downloadTemplate}>
            ⬇ 템플릿 다운로드
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display:"none" }} onChange={handleFileUpload} />
        {uploadMsg && (
          <div style={{ marginTop:10, padding:"9px 12px", background:"#0F1A00", border:`1px solid ${LIME}44`, borderRadius:6, fontSize:12, color:"#C8E88A" }}>
            {uploadMsg}
          </div>
        )}
      </div>

      {/* Sub tab */}
      <div style={S.subToggle}>
        {[["exercise","🏋️ 운동 DB"],["food","🍽️ 음식 DB"]].map(([k,l])=>(
          <button key={k} onClick={()=>setSubTab(k)} style={S.subBtn(subTab===k)}>{l}</button>
        ))}
      </div>

      {/* ── 운동 DB ── */}
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
                <textarea style={S.textarea} placeholder="이 운동을 효과적으로 하는 팁을 입력하세요..." value={newEx.tip} onChange={e=>setNewEx(f=>({...f,tip:e.target.value}))} />
              </div>
              <button style={S.btn} onClick={addExercise}>추가하기</button>
            </div>
          )}
          <div style={S.secTitle}>등록된 운동 ({exerciseDB.length}개)</div>
          <div style={S.card}>
            {exerciseDB.map((ex,i)=>(
              <div key={ex.name}>
                <div style={{ ...S.logItem, borderBottom:`1px solid ${BORDER}` }}>
                  <div style={{ flex:1 }}>
                    <div style={S.logName}>{ex.name}</div>
                    {ex.tip && <div style={{ fontSize:11, color:MUTED, marginTop:3, lineHeight:1.5 }}>{ex.tip.slice(0,45)}{ex.tip.length>45?"…":""}</div>}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:10 }}>
                    {isDefaultEx(ex.name) ? <span style={S.tag}>기본</span> : <button style={S.delBtn} onClick={()=>setExerciseDB(p=>p.filter(e=>e.name!==ex.name))}>×</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── 음식 DB ── */}
      {subTab==="food" && (
        <>
          <button style={{ ...S.btn, marginBottom:11 }} onClick={()=>setShowFoodForm(!showFoodForm)}>
            {showFoodForm?"✕ 닫기":"+ 음식 직접 추가"}
          </button>
          {showFoodForm && (
            <div style={{ ...S.card, borderColor:LIME+"44", marginBottom:11 }}>
              <div style={{ marginBottom:9 }}>
                <label style={S.label}>음식 이름</label>
                <input style={S.input} placeholder="현미밥 1공기" value={newFood.name} onChange={e=>setNewFood(f=>({...f,name:e.target.value}))} />
              </div>
              <div style={{ marginBottom:9 }}>
                <label style={S.label}>칼로리 (kcal)</label>
                <input style={S.input} type="number" placeholder="280" value={newFood.kcal} onChange={e=>setNewFood(f=>({...f,kcal:e.target.value}))} />
              </div>
              <div style={{ ...S.row, marginBottom:9 }}>
                {[["탄수화물","carb","58"],["단백질","protein","6"],["지방","fat","2"]].map(([l,k,ph])=>(
                  <div key={k} style={{ flex:1 }}>
                    <label style={S.label}>{l}(g)</label>
                    <input style={S.input} type="number" placeholder={ph} value={newFood[k]} onChange={e=>setNewFood(f=>({...f,[k]:e.target.value}))} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:9 }}>
                <label style={S.label}>팁 / 궁합 음식 (선택)</label>
                <textarea style={S.textarea} placeholder="예) 닭가슴살과 함께 먹으면 단백질 보충에 최고!" value={newFood.tip} onChange={e=>setNewFood(f=>({...f,tip:e.target.value}))} />
              </div>
              <button style={S.btn} onClick={addFood}>DB에 추가</button>
            </div>
          )}
          <div style={S.secTitle}>등록된 음식 ({foodDB.length}개)</div>
          <div style={S.card}>
            {foodDB.map((f,i)=>(
              <div key={f.name+i} style={{ ...S.logItem, borderBottom:i<foodDB.length-1?`1px solid ${BORDER}`:"none" }}>
                <div style={{ flex:1 }}>
                  <div style={S.logName}>{f.name}</div>
                  <div style={S.logSub}>탄{f.carb}g · 단{f.protein}g · 지{f.fat}g</div>
                  {f.tip && <div style={{ fontSize:11, color:MUTED, marginTop:3, lineHeight:1.5 }}>{f.tip.slice(0,50)}{f.tip.length>50?"…":""}</div>}
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5, marginLeft:10 }}>
                  <div style={{ fontSize:12, color:LIME, fontWeight:700 }}>{f.kcal}kcal</div>
                  {isDefaultFood(f.name) ? <span style={S.tag}>기본</span> : <button style={S.delBtn} onClick={()=>setFoodDB(p=>p.filter((_,j)=>j!==i))}>×</button>}
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
  const [tab, setTab]               = useState("workout");
  const [workouts, setWorkouts]     = useState(seedWorkouts);
  const [foods, setFoods]           = useState(seedFoods);
  const [weightLogs, setWeightLogs] = useState(seedWeights);
  const [profile, setProfile]       = useState({ name:"", avatar:"⚖️", height:"", targetWeight:"", targetKcal:"2000", goal:"" });
  const [exerciseDB, setExerciseDB] = useState([...DEFAULT_EXERCISES]);
  const [foodDB, setFoodDB]         = useState([...DEFAULT_FOODS]);

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
        <div style={S.dateChip}>{today}</div>
      </div>

      {tab==="workout" && <WorkoutTab workouts={workouts} setWorkouts={setWorkouts} exerciseDB={exerciseDB} />}
      {tab==="food"    && <FoodTab    foods={foods} setFoods={setFoods} foodDB={foodDB} />}
      {tab==="stats"   && <StatsTab   workouts={workouts} foods={foods} />}
      {tab==="weight"  && <WeightTab  profile={profile} setProfile={setProfile} weightLogs={weightLogs} setWeightLogs={setWeightLogs} />}
      {tab==="db"      && <DBTab      exerciseDB={exerciseDB} setExerciseDB={setExerciseDB} foodDB={foodDB} setFoodDB={setFoodDB} />}

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
