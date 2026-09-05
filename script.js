/* MedLens - local workspace logic */
(function(){
"use strict";
const $=(s,c=document)=>c.querySelector(s);
const $$=(s,c=document)=>Array.from(c.querySelectorAll(s));

/* ============ MEDICAL DATA ============ */
const REF={
  hemoglobin:{unit:"g/dL",min:13.0,max:17.0,display:"13.0 - 17.0 g/dL"},
  hemoglobinF:{unit:"g/dL",min:12.0,max:15.5,display:"12.0 - 15.5 g/dL"},
  wbc:{unit:"/uL",min:4000,max:11000,display:"4,000 - 11,000 /uL"},
  platelet:{unit:"/uL",min:150000,max:410000,display:"150,000 - 410,000 /uL"},
  glucose:{unit:"mg/dL",min:70,max:100,display:"70 - 100 mg/dL"},
  creatinine:{unit:"mg/dL",min:0.6,max:1.2,display:"0.6 - 1.2 mg/dL"},
  tsh:{unit:"uIU/mL",min:0.4,max:4.0,display:"0.4 - 4.0 uIU/mL"},
  vitD:{unit:"ng/mL",min:30,max:100,display:"30 - 100 ng/mL"},
  chol:{unit:"mg/dL",min:125,max:200,display:"125 - 200 mg/dL"}
};
function lab(test,result,refKey,date,source,conf,confPct,verified){
  const r=REF[refKey];
  return {test: test,result: result,unit: r.unit,min: r.min,max: r.max,ref: r.display,date: date,source: source,conf: conf,confPct: confPct,verified: !!verified,reviewer: verified?"Dr. Rao":null};
}
const patients=[
  {id:"P-1001",name:"Ananya Sharma",age:34,sex:"Female",dob:"1992-04-18",phone:"+91 98110 22334",symptoms:["Persistent fatigue","Occasional headache"],conditions:["Iron-deficiency anemia","Migraine"],allergies:["Sulfa drugs"],meds:[{n:"Iron supplement 60 mg",d:"Once daily after food"},{n:"Paracetamol 500 mg",d:"As needed"}],emergency:"Rohit Sharma - +91 98110 55667",notes:"Vegetarian diet. Reports irregular sleep.",status:"Active",risk:"Low",lastReport:"2026-08-28",reports:2,verified:true},
  {id:"P-1002",name:"Rahul Verma",age:58,sex:"Male",dob:"1968-03-12",phone:"+91 99301 44556",symptoms:["Increased thirst","Frequent urination","Fatigue"],conditions:["Type 2 Diabetes","Hypertension","Hypothyroidism (under review)"],allergies:["Penicillin (patient-reported)"],meds:[{n:"Metformin 500 mg",d:"Twice daily (under review)"},{n:"Amlodipine 5 mg",d:"Once daily, morning"},{n:"Atorvastatin 10 mg",d:"Once daily, night"}],emergency:"Sunita Verma - +91 99301 77889",notes:"Quit smoking 2020. Family history of diabetes.",status:"Pending Review",risk:"High",lastReport:"2026-09-02",reports:4,verified:false},
  {id:"P-1003",name:"Maria Dsouza",age:45,sex:"Female",dob:"1981-07-09",phone:"+91 98200 11223",symptoms:["Weight gain","Cold intolerance"],conditions:["Hypothyroidism","High cholesterol"],allergies:["None reported"],meds:[{n:"Levothyroxine 50 mcg",d:"Once daily, empty stomach"},{n:"Rosuvastatin 10 mg",d:"Once daily, night"}],emergency:"Joseph Dsouza - +91 98200 33445",notes:"Thyroid review due in 6 weeks.",status:"Active",risk:"Moderate",lastReport:"2026-09-01",reports:3,verified:true},
  {id:"P-1004",name:"James Carter",age:62,sex:"Male",dob:"1964-01-25",phone:"+1 415-555-0132",symptoms:["Swelling in ankles","Reduced appetite"],conditions:["Chronic Kidney Disease (Stage 2)","Hypertension"],allergies:["Latex"],meds:[{n:"Lisinopril 10 mg",d:"Once daily"},{n:"Furosemide 20 mg",d:"Once daily, morning"}],emergency:"Emily Carter - +1 415-555-0199",notes:"Low-sodium diet advised. Nephrology follow-up pending.",status:"Needs Attention",risk:"High",lastReport:"2026-08-30",reports:3,verified:false},
  {id:"P-1005",name:"Priya Nair",age:29,sex:"Female",dob:"1997-11-02",phone:"+91 97450 66778",symptoms:["No symptoms (annual checkup)"],conditions:["Vitamin D insufficiency"],allergies:["None reported"],meds:[{n:"Vitamin D3 60,000 IU",d:"Once weekly for 8 weeks"}],emergency:"Arun Nair - +91 97450 99001",notes:"Active lifestyle, regular exercise.",status:"Verified",risk:"Low",lastReport:"2026-08-22",reports:2,verified:true},
  {id:"P-1006",name:"David Kim",age:51,sex:"Male",dob:"1975-05-30",phone:"+1 212-555-0147",symptoms:["Mild abdominal discomfort","Fatigue after meals"],conditions:["Prediabetes","Fatty liver (Grade 1)"],allergies:["Aspirin"],meds:[{n:"Metformin 500 mg",d:"Once daily with dinner"}],emergency:"Sarah Kim - +1 212-555-0188",notes:"Diet and exercise plan started in July.",status:"Pending Review",risk:"Moderate",lastReport:"2026-09-04",reports:4,verified:false}
];
const labsByPatient={
  "P-1001":[lab("Hemoglobin",10.8,"hemoglobinF","2026-08-28","report","High",97,false),lab("WBC Count",6800,"wbc","2026-08-28","report","High",96,true),lab("Platelet Count",262000,"platelet","2026-08-28","report","High",95,true),lab("Glucose (Fasting)",88,"glucose","2026-08-28","report","High",94,true),lab("Creatinine",0.8,"creatinine","2026-08-28","report","High",93,true),lab("TSH",2.1,"tsh","2026-08-28","report","Medium",84,false),lab("Vitamin D",26,"vitD","2026-08-28","report","Medium",81,false),lab("Total Cholesterol",178,"chol","2026-08-28","report","High",92,true)],
  "P-1002":[lab("Hemoglobin",13.8,"hemoglobin","2026-09-02","report","High",98,true),lab("WBC Count",7200,"wbc","2026-09-02","report","High",96,true),lab("Platelet Count",245000,"platelet","2026-09-02","report","High",95,true),lab("Glucose (Fasting)",142,"glucose","2026-09-02","report","High",97,false),lab("Creatinine",1.1,"creatinine","2026-09-02","report","High",93,true),lab("TSH",6.8,"tsh","2026-09-02","report","Medium",82,false),lab("Vitamin D",18,"vitD","2026-09-02","report","Medium",80,false),lab("Total Cholesterol",186,"chol","2026-09-02","report","High",91,true)],
  "P-1003":[lab("Hemoglobin",12.9,"hemoglobinF","2026-09-01","report","High",95,true),lab("WBC Count",5900,"wbc","2026-09-01","report","High",94,true),lab("Platelet Count",228000,"platelet","2026-09-01","report","High",93,true),lab("Glucose (Fasting)",94,"glucose","2026-09-01","report","High",92,true),lab("Creatinine",0.9,"creatinine","2026-09-01","report","High",91,true),lab("TSH",5.4,"tsh","2026-09-01","report","High",94,false),lab("Vitamin D",32,"vitD","2026-09-01","report","Medium",83,true),lab("Total Cholesterol",224,"chol","2026-09-01","report","High",93,false)],
  "P-1004":[lab("Hemoglobin",12.4,"hemoglobin","2026-08-30","report","High",92,false),lab("WBC Count",8100,"wbc","2026-08-30","report","High",91,true),lab("Platelet Count",198000,"platelet","2026-08-30","report","High",90,true),lab("Glucose (Fasting)",104,"glucose","2026-08-30","report","Medium",84,false),lab("Creatinine",1.6,"creatinine","2026-08-30","report","High",95,false),lab("TSH",2.8,"tsh","2026-08-30","report","Medium",82,true),lab("Vitamin D",24,"vitD","2026-08-30","report","Medium",80,false),lab("Total Cholesterol",190,"chol","2026-08-30","report","High",89,true)],
  "P-1005":[lab("Hemoglobin",13.2,"hemoglobinF","2026-08-22","report","High",97,true),lab("WBC Count",6400,"wbc","2026-08-22","report","High",96,true),lab("Platelet Count",275000,"platelet","2026-08-22","report","High",95,true),lab("Glucose (Fasting)",86,"glucose","2026-08-22","report","High",95,true),lab("Creatinine",0.7,"creatinine","2026-08-22","report","High",94,true),lab("TSH",1.9,"tsh","2026-08-22","report","High",93,true),lab("Vitamin D",22,"vitD","2026-08-22","report","High",92,true),lab("Total Cholesterol",168,"chol","2026-08-22","report","High",93,true)],
  "P-1006":[lab("Hemoglobin",14.6,"hemoglobin","2026-09-04","report","High",94,true),lab("WBC Count",7700,"wbc","2026-09-04","report","High",93,true),lab("Platelet Count",259000,"platelet","2026-09-04","report","Medium",85,false),lab("Glucose (Fasting)",118,"glucose","2026-09-04","report","High",95,false),lab("Creatinine",1.0,"creatinine","2026-09-04","report","High",92,true),lab("TSH",3.2,"tsh","2026-09-04","report","Medium",83,true),lab("Vitamin D",28,"vitD","2026-09-04","report","Medium",81,false),lab("Total Cholesterol",208,"chol","2026-09-04","report","High",91,false)]
};
let reports=[
  {id:"RPT-2410",file:"HbA1c_Sep2026_DavidKim.pdf",patientId:"P-1006",patient:"David Kim",type:"HbA1c",date:"2026-09-04",status:"Pending Review",conf:"High",pct:93,size:"1.1 MB"},
  {id:"RPT-2409",file:"CBC_Sep2026_JamesCarter.pdf",patientId:"P-1004",patient:"James Carter",type:"CBC",date:"2026-09-03",status:"Processing",conf:"Medium",pct:74,size:"2.4 MB"},
  {id:"RPT-2407",file:"Prescription_Sep02_RVerma.jpg",patientId:"P-1002",patient:"Rahul Verma",type:"Prescription",date:"2026-09-02",status:"Pending Review",conf:"Medium",pct:82,size:"890 KB"},
  {id:"RPT-2403",file:"Thyroid_Sep02_RVerma.pdf",patientId:"P-1002",patient:"Rahul Verma",type:"Thyroid",date:"2026-09-02",status:"Pending Review",conf:"Medium",pct:82,size:"1.4 MB"},
  {id:"RPT-2402",file:"Lipid_Sep01_MDsouza.pdf",patientId:"P-1003",patient:"Maria Dsouza",type:"Lipid Panel",date:"2026-09-01",status:"Processed",conf:"High",pct:95,size:"1.8 MB"},
  {id:"RPT-2405",file:"Kidney_Aug30_JCarter.pdf",patientId:"P-1004",patient:"James Carter",type:"Kidney Function",date:"2026-08-30",status:"Pending Review",conf:"Medium",pct:86,size:"1.6 MB"},
  {id:"RPT-2401",file:"CBC_Aug28_ASharma.pdf",patientId:"P-1001",patient:"Ananya Sharma",type:"CBC",date:"2026-08-28",status:"Processed",conf:"High",pct:96,size:"1.2 MB"},
  {id:"RPT-2408",file:"Liver_Aug25_DKim.pdf",patientId:"P-1006",patient:"David Kim",type:"Liver Function",date:"2026-08-25",status:"Processed",conf:"High",pct:91,size:"1.5 MB"},
  {id:"RPT-2406",file:"Vitamin_Aug22_PNair.pdf",patientId:"P-1005",patient:"Priya Nair",type:"Vitamin Panel",date:"2026-08-22",status:"Verified",conf:"High",pct:97,size:"980 KB"},
  {id:"RPT-2404",file:"HbA1c_Aug10_RVerma.pdf",patientId:"P-1002",patient:"Rahul Verma",type:"HbA1c",date:"2026-08-10",status:"Verified",conf:"High",pct:95,size:"1.0 MB"}
];
let conflicts=[
  {id:"C-1",patientId:"P-1002",title:"Medication dosage differs across reports",desc:"Metformin strength appears differently in two documents dated 3 weeks apart. Confirm the current prescribed strength before verification.",a:"Prescription, 12 Aug 2026: Metformin 500 mg, twice daily",b:"Discharge summary, 02 Sep 2026: Metformin 850 mg, twice daily",status:"open"},
  {id:"C-2",patientId:"P-1002",title:"Allergy record mismatch",desc:"Patient-reported allergy does not match the previous structured record. Confirm with the patient and update the allergy list.",a:"Patient intake, 02 Sep 2026: Allergic to Penicillin (rash)",b:"Previous record, 18 Jun 2026: No known drug allergies",status:"open"},
  {id:"C-3",patientId:"P-1002",title:"Same test, different values on close dates",desc:"TSH changed from 4.1 to 6.8 within 3 weeks. Both values are extracted correctly from their documents - verify whether retest or clinical review is needed.",a:"Panel 10 Aug 2026: TSH 4.1 (ref 0.4-4.0)",b:"Panel 02 Sep 2026: TSH 6.8 (ref 0.4-4.0)",status:"open"},
  {id:"C-4",patientId:"P-1004",title:"Creatinine trend needs confirmation",desc:"Creatinine rose from 1.3 to 1.6 mg/dL. Confirm sample dates and hydration status.",a:"Kidney panel 02 Aug 2026: Creatinine 1.3 mg/dL",b:"Kidney panel 30 Aug 2026: Creatinine 1.6 mg/dL",status:"open"},
  {id:"C-5",patientId:"P-1006",title:"Fasting status unclear for glucose",desc:"Glucose 118 flagged High against fasting range, but requisition does not clearly state fasting. Confirm sample context.",a:"Requisition: fasting checkbox unticked",b:"Result 04 Sep 2026: Glucose (Fasting) 118 mg/dL",status:"open"}
];
let timeline=[
  {patientId:"P-1002",date:"2026-09-04",title:"New report added",desc:"Prescription scan linked to Rahul Verma record.",source:"report",actor:"Dr. Rao",tone:"teal"},
  {patientId:"P-1002",date:"2026-09-02",title:"Lab results extracted",desc:"8 values extracted from Thyroid panel; 3 flagged against reference ranges.",source:"report",actor:"MedLens AI",tone:""},
  {patientId:"P-1002",date:"2026-09-02",title:"Report uploaded",desc:"Thyroid_Sep02_RVerma.pdf uploaded and queued.",source:"report",actor:"Front desk",tone:"teal"},
  {patientId:"P-1002",date:"2026-09-01",title:"Conflict flagged",desc:"Metformin 500 mg vs 850 mg mismatch detected.",source:"ai",actor:"MedLens AI",tone:"warn"},
  {patientId:"P-1002",date:"2026-08-28",title:"Value verified",desc:"Hemoglobin 13.8 g/dL verified by reviewer.",source:"input",actor:"Dr. Rao",tone:"ok"},
  {patientId:"P-1002",date:"2026-08-10",title:"Record reviewed",desc:"HbA1c report reviewed; no conflicts at that time.",source:"report",actor:"Dr. Rao",tone:"ok"},
  {patientId:"P-1002",date:"2026-06-18",title:"Patient registered",desc:"Rahul Verma registered via intake form.",source:"input",actor:"Front desk",tone:""},
  {patientId:"P-1003",date:"2026-09-01",title:"Lab results extracted",desc:"Lipid panel extracted; cholesterol flagged High.",source:"report",actor:"MedLens AI",tone:""},
  {patientId:"P-1003",date:"2026-09-01",title:"Report uploaded",desc:"Lipid_Sep01_MDsouza.pdf uploaded.",source:"report",actor:"Front desk",tone:"teal"},
  {patientId:"P-1004",date:"2026-09-03",title:"Report uploaded",desc:"CBC report uploading; extraction in progress.",source:"report",actor:"Front desk",tone:"teal"},
  {patientId:"P-1004",date:"2026-08-30",title:"Lab results extracted",desc:"Kidney panel extracted; creatinine flagged High.",source:"report",actor:"MedLens AI",tone:"rose"},
  {patientId:"P-1001",date:"2026-08-28",title:"Record reviewed",desc:"CBC reviewed by clinician.",source:"input",actor:"Dr. Rao",tone:"ok"},
  {patientId:"P-1005",date:"2026-08-22",title:"Value verified",desc:"Vitamin D 22 ng/mL verified.",source:"input",actor:"Dr. Rao",tone:"ok"},
  {patientId:"P-1006",date:"2026-09-04",title:"Lab results extracted",desc:"Glucose extracted; fasting context unclear.",source:"report",actor:"MedLens AI",tone:"warn"}
];
const comparePrev={
  "P-1001":[10.4,6500,258000,90,0.8,2.4,24,172],
  "P-1002":[13.2,6800,238000,128,1.0,4.1,22,178],
  "P-1003":[12.6,6100,231000,92,0.9,4.6,30,216],
  "P-1004":[12.9,7900,205000,99,1.3,2.6,26,184],
  "P-1005":[13.0,6200,270000,84,0.7,2.0,19,165],
  "P-1006":[14.4,7400,251000,112,0.9,3.0,25,201]
};
/* The workspace starts empty. New records are created through the forms and upload controls. */
patients.splice(0,patients.length);
Object.keys(labsByPatient).forEach(function(id){delete labsByPatient[id];});
reports=[];conflicts=[];timeline=[];
Object.keys(comparePrev).forEach(function(id){delete comparePrev[id];});
let stats={patients:0,reports:0,pending:0,alerts:0};
let selectedPatientId="", editingIndex=-1, activeConflictId=null, modalFiles=[];
let searchRequestId=0, searchTimer=null;
const API_BASE=(window.location.protocol === "file:") ? "http://127.0.0.1:5000/api" : "/api";

async function apiRequest(path,options){
  const response=await fetch(API_BASE+path,options||{});
  const body=await response.json().catch(function(){return {};});
  if(!response.ok||body.success===false)throw new Error(body.message||"The server could not complete this request.");
  return body.data;
}
function mapPatient(p){return {id:p.id||p.patient_id,name:p.name||p.full_name,age:p.age,sex:p.sex,dob:p.dob||p.date_of_birth||"—",phone:p.phone||"—",symptoms:p.symptoms||[],conditions:p.conditions||p.existing_conditions||[],allergies:p.allergies||[],meds:p.meds||p.medications||[],emergency:p.emergency||p.emergency_contact||"—",notes:p.notes||"—",status:p.status||"Active",risk:p.risk||"Low",lastReport:p.lastReport||p.last_report||"",reports:p.reports||p.report_count||0,verified:!!p.verified};}
function mapReport(r){return {id:String(r.id),file:r.file||r.filename,patientId:r.patient_id,patient:r.patient||r.patient_name||r.patient_id,type:r.type||r.report_type||"General",date:r.date||r.upload_date||"",status:r.status||"Uploaded",conf:r.confidence||"Medium",pct:r.pct||r.confidence_pct||0,size:fmtSize(r.size||r.file_size||0)};}
async function loadBackendData(){
  try{
    const results=await Promise.all([apiRequest("/patients"),apiRequest("/reports"),apiRequest("/dashboard")]);
    patients.length=0;reports.length=0;
    patients.push.apply(patients,results[0].map(mapPatient));
    reports.push.apply(reports,results[1].map(mapReport));
    stats={patients:results[2].total_patients||0,reports:results[2].total_reports||0,pending:results[2].pending_review||0,alerts:results[2].alerts_detected||0};
    if(patients.length)selectedPatientId=patients[0].id;
    renderStats();renderRecent("");renderPatientsTable();renderReportsTable("");refreshPatientSelects();renderRecord(selectedPatientId);renderTimeline();renderInsights();
    for(let i=0;i<patients.length;i++)await loadPatientRecord(patients[i].id);
    renderStats();
    renderReportsTable("");
  }catch(err){toast("Backend unavailable",err.message+" Start the Flask server to sync your workspace.","warn");}
}
async function loadPatientRecord(id){
  if(!id)return;
  try{
    const data=await apiRequest("/patients/"+encodeURIComponent(id)+"/record");
    const patient=mapPatient(data.patient);
    const local=getPatient(id);
    if(local){patient.reports=reports.filter(function(report){return report.patientId===id;}).length;Object.assign(local,patient);}
    labsByPatient[id]=(data.laboratory_results||data.lab_results||[]).map(function(l){return {test:l.test||l.test_name,result:l.result!=null?l.result:l.value,unit:l.unit||"",min:l.min!=null?l.min:l.ref_min,max:l.max!=null?l.max:l.ref_max,ref:l.ref||l.reference_range||"",date:l.date||"",source:l.source_type||l.source||"report",conf:l.conf||l.confidence||"Medium",confPct:l.confPct||l.confidence_pct||0,verified:!!l.verified,reviewer:l.verified_by||null};});
    conflicts=(data.conflicts||[]).map(function(c){return {id:c.id,patientId:c.patient_id,title:c.title,desc:c.desc||c.description||"",a:c.a||c.source_a||"",b:c.b||c.source_b||"",status:c.status,resolution:c.resolution,resolvedBy:c.resolved_by};});
    timeline=(data.timeline||data.timeline_events||[]).map(function(t){return {patientId:t.patient_id,date:t.date||(t.created_at||"").slice(0,10),title:t.title||t.event,desc:t.desc||t.description||"",source:t.source_type||t.source||"input",actor:t.actor||"",tone:t.event_type==="conflict_detected"?"warn":""};});
    renderRecord(id);renderTimeline();renderInsights();
  }catch(err){toast("Could not load record",err.message,"warn");}
}

/* ============ HELPERS ============ */
function initials(n){return (n||"Reviewer").trim().split(/\s+/).map(function(w){return w[0];}).join("").slice(0,2).toUpperCase();}
function fmtDate(iso){if(!iso||iso==="—")return "—";const d=new Date(iso+"T00:00:00");if(isNaN(d))return iso;const M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return ("0"+d.getDate()).slice(-2)+" "+M[d.getMonth()]+" "+d.getFullYear();}
function statusOf(r,min,max){return r<min?"Low":(r>max?"High":"Normal");}
function statusBadge(s){const m={"Normal":"badge-normal","Low":"badge-low","High":"badge-high","Verified":"badge-verified","Active":"badge-active","Processed":"badge-info","Processing":"badge-pending","Pending Review":"badge-pending","Needs Attention":"badge-alert"};return '<span class="badge '+(m[s]||"badge-neutral")+'">'+s+'</span>';}
function srcBadge(s){const m={input:"src-input",report:"src-report",ai:"src-ai"};const t={input:"Patient input",report:"Uploaded report",ai:"AI-generated"};return '<span class="src-badge '+(m[s]||"src-report")+'">'+(t[s]||s)+'</span>';}
function confHTML(c,p){const m={High:"high",Medium:"med",Low:"low"};const label=c==="Low"?"Needs verification":c;return '<span style="white-space:nowrap"><span class="conf-dot '+(m[c]||"med")+'"></span>'+label+(p?' <span class="muted small">'+p+'%</span>':"")+'</span>';}
function riskBadge(r){return '<span class="risk-badge risk-'+r.toLowerCase()+'">'+r+'</span>';}
function fmtSize(b){if(typeof b==="string")return b;if(b<1024)return b+" B";if(b<1048576)return Math.round(b/1024)+" KB";return (b/1048576).toFixed(1)+" MB";}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function reviewer(){const el=$("#settingReviewer");return (el&&el.value.trim())||localStorage.getItem("medlensReviewerName")||"Reviewer";}
function updateReviewerIdentity(name){
  const value=(name||"Reviewer").trim()||"Reviewer";
  const side=$("#sideReviewerName"),top=$("#topReviewerName"),avatar=$("#avatarBtn");
  if(side)side.textContent=value;
  if(top)top.textContent=value;
  if(avatar){avatar.textContent=initials(value);avatar.setAttribute("aria-label","Open profile for "+value);}
}
function loadReviewerSettings(){
  const saved=localStorage.getItem("medlensReviewerName")||"Reviewer";
  const input=$("#settingReviewer");
  if(input)input.value=saved;
  updateReviewerIdentity(saved);
  if(input)input.addEventListener("input",function(){updateReviewerIdentity(input.value);});
}
function getPatient(id){for(let i=0;i<patients.length;i++){if(patients[i].id===id)return patients[i];}return null;}
function patientLabs(id){return labsByPatient[id]||[];}
function addTimeline(pid,title,desc,source,actor,tone){timeline.unshift({patientId:pid,date:new Date().toISOString().slice(0,10),title:title,desc:desc,source:source||"input",actor:actor||reviewer(),tone:tone||"ok"});}
function num(n){return Number(n).toLocaleString("en-US");}

/* ============ TOASTS ============ */
function toast(title,msg,type){
  type=type||"success";
  const box=$("#toastContainer");
  const el=document.createElement("div");
  el.className="toast "+type;
  const ico={success:"OK",info:"i",warn:"!",error:"X"}[type]||"OK";
  el.innerHTML='<span class="toast-ico">'+ico+'</span><div><strong>'+esc(title)+'</strong>'+(msg?'<p>'+esc(msg)+'</p>':"")+'</div>';
  el.setAttribute("role","status");
  el.addEventListener("click",function(){el.classList.add("out");setTimeout(function(){el.remove();},300);});
  box.appendChild(el);
  setTimeout(function(){el.classList.add("out");setTimeout(function(){el.remove();},320);},3800);
}

/* ============ MODALS ============ */
function openModal(id){const m=$("#"+id);if(!m)return;m.classList.add("open");m.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";}
function closeModal(m){if(typeof m==="string")m=$("#"+m);if(!m)return;m.classList.remove("open");m.setAttribute("aria-hidden","true");if(!$(".modal.open"))document.body.style.overflow="";}
$$(".modal").forEach(function(m){
  m.addEventListener("click",function(e){if(e.target===m)closeModal(m);});
  $$("[data-close]",m).forEach(function(b){b.addEventListener("click",function(){closeModal(m);});});
});
document.addEventListener("keydown",function(e){if(e.key==="Escape"){$$(".modal.open").forEach(closeModal);}});

/* ============ NAVIGATION ============ */
const TITLES={dashboard:["Clinical Intelligence Dashboard","Structured, traceable and reviewable patient records"],patients:["Patients and Intake","Registration, search and filtering"],reports:["Reports and Upload","Processing simulation and extraction"],record:["Structured Medical Record","Source-traced, reviewable patient record"],compare:["Compare Reports","Previous vs current, side by side"],timeline:["Timeline and Audit History","Chronological, source-tagged events"],settings:["Settings","Workspace, privacy and safety"]};
function closeSidebar(){$("#sidebar").classList.remove("open");$("#sidebarOverlay").classList.remove("show");$("#hamburgerBtn").setAttribute("aria-expanded","false");}
function showView(v){
  $$(".view").forEach(function(s){s.classList.remove("active");});
  const sec=$("#view-"+v);if(sec)sec.classList.add("active");
  $$(".nav-item").forEach(function(n){const on=n.dataset.view===v;n.classList.toggle("active",on);if(on)n.setAttribute("aria-current","page");else n.removeAttribute("aria-current");});
  if(TITLES[v]){$("#pageTitle").textContent=TITLES[v][0];$("#pageSubtitle").textContent=TITLES[v][1];}
  closeSidebar();window.scrollTo({top:0,behavior:"smooth"});
}
$$(".nav-item").forEach(function(n){n.addEventListener("click",function(){showView(n.dataset.view);});});
$$("[data-goto]").forEach(function(b){b.addEventListener("click",function(){
  showView(b.dataset.goto);
  if(b.dataset.focus){setTimeout(function(){const f=$("#"+b.dataset.focus);if(f){f.focus();f.scrollIntoView({behavior:"smooth",block:"center"});}},140);}
  if(b.dataset.tab==="conflicts"){setTimeout(function(){const c=$("#conflictsCard");if(c){c.scrollIntoView({behavior:"smooth",block:"center"});c.style.boxShadow="0 0 0 3px rgba(29,78,216,.25)";setTimeout(function(){c.style.boxShadow="";},1600);}},160);}
});});
$("#hamburgerBtn").addEventListener("click",function(){const s=$("#sidebar");const open=!s.classList.contains("open");s.classList.toggle("open",open);$("#sidebarOverlay").classList.toggle("show",open);$("#hamburgerBtn").setAttribute("aria-expanded",String(open));});
$("#sidebarOverlay").addEventListener("click",closeSidebar);
$("#notifBtn").addEventListener("click",function(e){e.stopPropagation();const d=$("#notifDropdown");const o=!d.classList.contains("open");d.classList.toggle("open",o);$("#notifBtn").setAttribute("aria-expanded",String(o));});
document.addEventListener("click",function(e){if(!e.target.closest(".notif-wrap"))$("#notifDropdown").classList.remove("open");});
$("#markReadBtn").addEventListener("click",function(){$$(".notif-item.unread").forEach(function(n){n.classList.remove("unread");});const b=$(".notif-badge");if(b)b.style.display="none";toast("Notifications","All notifications marked as read.","info");});
$("#avatarBtn").addEventListener("click",function(){showView("settings");});

/* ============ STATS ============ */
function renderStats(){
  const patientCount=patients.length||stats.patients,reportCount=reports.length||stats.reports;
  $("#statPatients").textContent=patientCount;
  $("#statReports").textContent=reportCount;
  $("#statPending").textContent=stats.pending;
  $("#statAlerts").textContent=stats.alerts;
  const nc=$("#navPatientCount");if(nc)nc.textContent=stats.patients;
  $("#statPatientsSub").textContent=patientCount?patientCount+" patient"+(patientCount===1?"":"s")+" in workspace":"No patients added";
  $("#statReportsSub").textContent=reportCount?reportCount+" report"+(reportCount===1?"":"s")+" processed":"No reports uploaded";
  const allLabs=Object.keys(labsByPatient).reduce(function(total,id){return total+patientLabs(id).length;},0);
  const verifiedLabs=Object.keys(labsByPatient).reduce(function(total,id){return total+patientLabs(id).filter(function(l){return l.verified;}).length;},0);
  const completeness=allLabs?Math.round((verifiedLabs/allLabs)*100):(patientCount?Math.min(25,patientCount*10):0);
  $("#dashboardCompletenessScore").textContent=completeness+"%";
  $("#dashboardCompletenessBar").style.width=completeness+"%";
  $("#heroPatientText").textContent=patientCount?"Patient records are ready to review":"Add a patient to begin";
  $("#heroRecordAction").textContent=patientCount?"Open patient records":"Add your first patient";
  const action=$("#heroRecordAction");if(action){action.dataset.goto=patientCount?"record":"patients";if(patientCount)delete action.dataset.focus;else action.dataset.focus="f-fullName";}
}

/* ============ PATIENT TABLES ============ */
function patientRow(p,full){
  const av='<span class="avatar avatar-sm" aria-hidden="true">'+initials(p.name)+'</span>';
  let conds=p.conditions.slice(0,2).map(function(c){return '<span class="cond-chip">'+esc(c)+'</span>';}).join("");
  if(p.conditions.length>2)conds+='<span class="cond-chip">+'+(p.conditions.length-2)+'</span>';
  if(full)return '<tr><td><div class="patient-cell">'+av+'<div><strong>'+esc(p.name)+'</strong><small>'+esc(p.id)+'</small></div></div></td>'
    +'<td class="muted">'+esc(p.id)+'</td><td>'+p.age+' / '+esc(p.sex)+'</td><td style="white-space:nowrap">'+fmtDate(p.lastReport)+'</td>'
    +'<td>'+conds+'</td><td>'+riskBadge(p.risk)+'</td><td>'+statusBadge(p.status)+'</td>'
    +'<td style="white-space:nowrap"><button class="btn btn-ghost btn-xs" data-act="view" data-id="'+p.id+'">View</button> <button class="btn btn-secondary btn-xs" data-act="record" data-id="'+p.id+'">Record</button></td></tr>';
  return '<tr data-patient="'+p.id+'" style="cursor:pointer" tabindex="0" aria-label="Open record for '+esc(p.name)+'">'
    +'<td><div class="patient-cell">'+av+'<div><strong>'+esc(p.name)+'</strong><small>'+esc(p.id)+'</small></div></div></td>'
    +'<td>'+p.age+'</td><td style="white-space:nowrap">'+fmtDate(p.lastReport)+'</td><td>'+conds+'</td>'
    +'<td><strong>'+p.reports+'</strong></td><td>'+statusBadge(p.status)+'</td>'
    +'<td><button class="btn btn-ghost btn-xs" data-act="view" data-id="'+p.id+'">View</button></td></tr>';
}
function openPatientDetails(id){
  const patient=getPatient(id);
  if(!patient){toast("Patient unavailable","This patient could not be found. Refresh the page and try again.","error");return;}
  $$(".modal.open").forEach(closeModal);
  selectedPatientId=patient.id;
  showView("record");
  const selector=$("#recordPatientSelect");
  if(selector)selector.value=patient.id;
  renderRecord(patient.id);
  loadPatientRecord(patient.id);
}
function renderRecent(q){
  q=(q||"").toLowerCase();
  const list=patients.filter(function(p){return !q||p.name.toLowerCase().indexOf(q)>-1||p.id.toLowerCase().indexOf(q)>-1;}).slice(0,5);
  $("#recentPatientsBody").innerHTML=list.length?list.map(function(p){return patientRow(p,false);}).join(""):'<tr><td colspan="7" class="muted" style="text-align:center;padding:22px">No patients match.</td></tr>';
  $$("#recentPatientsBody tr[data-patient]").forEach(function(tr){
    const open=function(){openPatientDetails(tr.dataset.patient);};
    tr.addEventListener("click",function(e){if(e.target.closest("button"))return;open();});
    tr.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();open();}});
  });
}
function renderPatientsTable(){
  const q=($("#patientsSearch").value||"").toLowerCase();
  const st=$("#filterStatus").value, rk=$("#filterRisk").value, vf=$("#filterVerification").value;
  const list=patients.filter(function(p){
    const hit=!q||p.name.toLowerCase().indexOf(q)>-1||p.id.toLowerCase().indexOf(q)>-1||p.conditions.join(" ").toLowerCase().indexOf(q)>-1;
    const okS=!st||p.status===st, okR=!rk||p.risk===rk;
    const okV=!vf||(vf==="verified"?p.verified:!p.verified);
    return hit&&okS&&okR&&okV;
  });
  $("#patientsTableBody").innerHTML=list.length?list.map(function(p){return patientRow(p,true);}).join(""):'<tr><td colspan="8" class="muted" style="text-align:center;padding:22px">No patients match the current filters.</td></tr>';
  $("#patientsCount").textContent=list.length+" of "+patients.length+" patients";
}
document.addEventListener("click",function(e){
  const b=e.target.closest("[data-act]");if(!b)return;e.stopPropagation();
  if(b.dataset.act==="view"||b.dataset.act==="record")openPatientDetails(b.dataset.id);
});
["patientsSearch","filterStatus","filterRisk","filterVerification"].forEach(function(id){
  const el=$("#"+id);el.addEventListener("input",renderPatientsTable);el.addEventListener("change",renderPatientsTable);
});
function closeGlobalSearch(){const box=$("#globalSearchResults");if(box){box.classList.remove("open");box.innerHTML="";}}
function searchResult(kind,id,title,detail){return '<button type="button" class="global-search-result" role="option" data-search-kind="'+esc(kind)+'" data-search-id="'+esc(id||"")+'"><span class="search-result-kind">'+esc(kind)+'</span><span class="search-result-copy"><strong>'+esc(title)+'</strong><small>'+esc(detail||"")+'</small></span></button>';}
function renderGlobalSearchResults(query,results){
  const box=$("#globalSearchResults");if(!box)return;
  if(!query){closeGlobalSearch();return;}
  if(!results.length){box.innerHTML='<div class="global-search-empty">No matching patients, reports, or pages.</div>';box.classList.add("open");return;}
  box.innerHTML=results.slice(0,12).map(function(r){return searchResult(r.kind,r.id,r.title,r.detail);}).join("");box.classList.add("open");
}
function localSearchResults(query){
  const q=query.toLowerCase(),results=[];
  patients.forEach(function(p){if((p.name+" "+p.id+" "+p.conditions.join(" ")).toLowerCase().indexOf(q)>-1)results.push({kind:"Patient",id:p.id,title:p.name,detail:p.id+" - "+p.status});});
  reports.forEach(function(r){if((r.file+" "+r.type+" "+r.patient+" "+r.id).toLowerCase().indexOf(q)>-1)results.push({kind:"Report",id:r.id,title:r.file,detail:r.patient+" - "+r.type});});
  Object.keys(TITLES).forEach(function(id){if((TITLES[id][0]+" "+TITLES[id][1]).toLowerCase().indexOf(q)>-1)results.push({kind:"Page",id:id,title:TITLES[id][0],detail:TITLES[id][1]});});
  return results;
}
async function runGlobalSearch(query){
  const requestId=++searchRequestId;
  const results=localSearchResults(query);renderGlobalSearchResults(query,results);
  try{
    const data=await apiRequest("/search?q="+encodeURIComponent(query));
    if(requestId!==searchRequestId)return;
    (data.labs||data.lab_results||[]).forEach(function(l){results.push({kind:"Lab result",id:l.patient_id,title:l.test_name+" - "+(l.value_text||l.value),detail:(l.patient_name||l.patient_id)+" - "+(l.status||"Needs review")});});
    renderGlobalSearchResults(query,results);
  }catch(_err){if(requestId===searchRequestId)renderGlobalSearchResults(query,results);}
}
async function submitGlobalSearch(){
  const query=$("#globalSearch").value.trim();if(!query)return;
  let first=$("#globalSearchResults .global-search-result");
  if(!first){await runGlobalSearch(query);first=$("#globalSearchResults .global-search-result");}
  if(first)first.click();
}
$("#globalSearch").addEventListener("input",function(e){
  const q=e.target.value.trim();renderRecent(q);renderReportsTable(q);
  if(document.querySelector("#view-patients.active")){$("#patientsSearch").value=q;renderPatientsTable();}
  clearTimeout(searchTimer);searchTimer=q?setTimeout(function(){runGlobalSearch(q);},120):closeGlobalSearch();
});
$("#globalSearch").addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();submitGlobalSearch();}if(e.key==="Escape"){e.preventDefault();closeGlobalSearch();}});
$("#globalSearchResults").addEventListener("click",function(e){
  const result=e.target.closest("[data-search-kind]");if(!result)return;
  const kind=result.dataset.searchKind,id=result.dataset.searchId;$("#globalSearch").value="";closeGlobalSearch();
  if(kind==="Patient"||kind==="Lab result"){openPatientDetails(id);return;}
  if(kind==="Report"){const report=reports.filter(function(r){return String(r.id)===String(id);})[0];if(report){openPatientDetails(report.patientId);setTimeout(function(){openSourceForReport(report.id);},120);}return;}
  if(kind==="Page")showView(id);
});
document.addEventListener("click",function(e){if(!e.target.closest(".search-wrap"))closeGlobalSearch();});
document.addEventListener("keydown",function(e){if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#globalSearch").focus();}});

/* ============ INTAKE FORM ============ */
function setErr(id,msg){const s=document.querySelector('[data-err="'+id+'"]');const f=$("#"+id);if(s)s.textContent=msg||"";if(f)f.classList.toggle("invalid",!!msg);}
function resetPatientFormMode(){
  const form=$("#intakeForm"),id=$("#f-patientId");
  delete form.dataset.editingId;id.disabled=false;$("#intakeTitle").textContent="Add a Patient";$("#intakeSubtitle").textContent="Enter the patient details below. Required fields are marked *.";$("#btnSavePatient").textContent="Save Patient";
}
function editPatientDetails(id){
  const p=getPatient(id);if(!p)return;
  showView("patients");
  const form=$("#intakeForm");form.dataset.editingId=p.id;
  $("#intakeTitle").textContent="Edit Patient Details";$("#intakeSubtitle").textContent="Update the information below, then save your changes.";$("#btnSavePatient").textContent="Save Changes";
  $("#f-patientId").value=p.id;$("#f-patientId").disabled=true;$("#f-fullName").value=p.name||"";$("#f-age").value=p.age||"";$("#f-sex").value=p.sex||"";$("#f-dob").value=p.dob&&p.dob!=="—"?p.dob:"";$("#f-phone").value=p.phone&&p.phone!=="—"?p.phone:"";$("#f-symptoms").value=(p.symptoms||[]).join(", ");$("#f-conditions").value=(p.conditions||[]).join(", ");$("#f-allergies").value=(p.allergies||[]).filter(function(value){return value!=="None reported";}).join(", ");$("#f-meds").value=(p.meds||[]).map(function(m){return m.n||m.name||"";}).join(", ");$("#f-emergency").value=p.emergency&&p.emergency!=="—"?p.emergency:"";$("#f-notes").value=p.notes&&p.notes!=="—"?p.notes:"";
  setTimeout(function(){$("#intakeCard").scrollIntoView({behavior:"smooth",block:"start"});$("#f-fullName").focus();},80);
}
$("#intakeForm").addEventListener("submit",async function(e){
  e.preventDefault();
  const id=$("#f-patientId").value.trim(),name=$("#f-fullName").value.trim(),age=$("#f-age").value.trim(),sex=$("#f-sex").value;
  let ok=true;
  const editingId=e.target.dataset.editingId;
  const dup=getPatient(id);
  const isDuplicate=dup&&(!editingId||dup.id!==editingId);
  setErr("f-patientId",!id?"Patient ID is required.":(isDuplicate?"This ID already exists.":""));if(!id||isDuplicate)ok=false;
  setErr("f-fullName",!name?"Full name is required.":"");if(!name)ok=false;
  const badAge=!age||isNaN(+age)||+age<0||+age>130;
  setErr("f-age",!age?"Age is required.":(badAge?"Enter a valid age (0-130).":""));if(badAge)ok=false;
  setErr("f-sex",!sex?"Please select.":"");if(!sex)ok=false;
  if(!ok){toast("Check the form","Please fix the highlighted required fields.","error");return;}
  function split(v){return v.split(",").map(function(s){return s.trim();}).filter(Boolean);}
  const sym=split($("#f-symptoms").value), al=split($("#f-allergies").value);
  const p={id:id,name:name,age:+age,sex:sex,dob:$("#f-dob").value||"—",phone:$("#f-phone").value.trim()||"—",
    symptoms:sym.length?sym:["Not recorded"],conditions:split($("#f-conditions").value),
    allergies:al.length?al:["None reported"],
    meds:split($("#f-meds").value).map(function(m){return {n:m,d:"As recorded at intake"};}),
    emergency:$("#f-emergency").value.trim()||"—",notes:$("#f-notes").value.trim()||"—",
    status:"Pending Review",risk:"Low",lastReport:new Date().toISOString().slice(0,10),reports:0,verified:false};
  if(editingId){
    try{
      const saved=await apiRequest("/patients/"+encodeURIComponent(editingId),{method:"PUT",headers:{"Content-Type":"application/json","X-Reviewer":reviewer()},body:JSON.stringify({full_name:p.name,age:p.age,sex:p.sex,date_of_birth:p.dob,phone:p.phone,symptoms:p.symptoms,existing_conditions:p.conditions,allergies:p.allergies,medications:p.meds,emergency_contact:p.emergency,notes:p.notes})});
      const local=getPatient(editingId);if(local)Object.assign(local,mapPatient(saved));
      resetPatientFormMode();e.target.reset();["f-patientId","f-fullName","f-age","f-sex"].forEach(function(i){setErr(i,"");});
      renderPatientsTable();renderRecent("");refreshPatientSelects();toast("Patient updated",p.name+"'s details were saved.","success");openPatientDetails(editingId);
    }catch(err){toast("Could not update patient",err.message,"error");}
    return;
  }
  try{
    const saved=await apiRequest("/patients",{method:"POST",headers:{"Content-Type":"application/json","X-Reviewer":reviewer()},body:JSON.stringify({patient_id:p.id,full_name:p.name,age:p.age,sex:p.sex,date_of_birth:p.dob,phone:p.phone,symptoms:p.symptoms,existing_conditions:p.conditions,allergies:p.allergies,medications:p.meds,emergency_contact:p.emergency,notes:p.notes})});
    Object.assign(p,mapPatient(saved));
  }catch(err){toast("Could not save patient",err.message,"error");return;}
  patients.unshift(p);labsByPatient[p.id]=[];comparePrev[p.id]=[13.5,7000,250000,95,0.9,2.2,30,180];
  addTimeline(p.id,"Patient registered",p.name+" registered via intake form.","input",reviewer(),"");
  stats.patients++;stats.pending++;
  renderStats();renderRecent($("#globalSearch").value);renderPatientsTable();refreshPatientSelects();
  e.target.reset();["f-patientId","f-fullName","f-age","f-sex"].forEach(function(i){setErr(i,"");});
  toast("Patient saved",name+" ("+id+") added to your workspace.","success");
});
$("#btnClearForm").addEventListener("click",function(){resetPatientFormMode();$("#intakeForm").reset();["f-patientId","f-fullName","f-age","f-sex"].forEach(function(i){setErr(i,"");});toast("Form cleared","The patient form has been reset.","info");});

/* ============ REPORTS + UPLOAD SIMULATION ============ */
function reportRow(r){
  const p=getPatient(r.patientId)||{name:r.patient||r.patientId,id:r.patientId,age:"—",sex:"—",conditions:[]};
  const labs=patientLabs(p.id),latest=labs[0],out=labs.filter(function(l){return statusOf(l.result,l.min,l.max)!=="Normal";});
  const analysis=latest?labs.length+" result(s) analyzed"+(out.length?" - "+out.length+" need review":" - all within range"):"Analysis will appear after processing";
  const latestText=latest?latest.test+": "+num(latest.result)+" "+latest.unit:"No analyzed result yet";
  return '<tr><td><div class="patient-cell"><span class="avatar avatar-sm" aria-hidden="true">'+initials(p.name)+'</span><div><strong>'+esc(p.name)+'</strong><small>'+esc(p.id)+'</small></div></div></td>'
  +'<td>'+esc(String(p.age)+" yrs - "+p.sex)+'</td><td><span class="src-badge src-ai">AI analyzed</span><br><small class="muted">'+esc(analysis)+'</small></td><td>'+esc(latestText)+'</td>'
  +'<td>'+statusBadge(out.length?"Pending Review":"Processed")+'</td>'
  +'<td style="white-space:nowrap"><button class="btn btn-ghost btn-xs" data-gorecord="'+p.id+'">View</button> <button class="btn btn-secondary btn-xs" data-edit-patient="'+p.id+'">Edit</button></td></tr>';
}
function renderReportsTable(globalQ){
  const q=((globalQ!=null?globalQ:$("#globalSearch").value)||"").toLowerCase();
  const t=$("#filterReportType").value,s=$("#filterReportStatus").value,d=$("#filterReportDate").value;
  const now=new Date("2026-09-05");
  const grouped={};
  reports.forEach(function(r){const p=getPatient(r.patientId);const key=r.patientId;if(!p)return;const hit=!q||p.name.toLowerCase().indexOf(q)>-1||p.id.toLowerCase().indexOf(q)>-1||r.type.toLowerCase().indexOf(q)>-1;const okT=!t||r.type===t,okS=!s||r.status===s;let okD=true;if(d){okD=((now-new Date(r.date))/86400000)<=+d;}if(hit&&okT&&okS&&okD&&(!grouped[key]||r.date>grouped[key].date))grouped[key]=r;});
  const list=Object.keys(grouped).map(function(key){return grouped[key];});
  $("#reportsTableBody").innerHTML=list.length?list.map(reportRow).join(""):'<tr><td colspan="6" class="muted" style="text-align:center;padding:22px">No analyzed patient reports match the current filters.</td></tr>';
  $("#reportsCount").textContent=list.length?list.length+" patient"+(list.length===1?"":"s")+" with analyzed reports":"No analyzed reports yet.";
}
["filterReportType","filterReportStatus","filterReportDate"].forEach(function(id){$("#"+id).addEventListener("change",function(){renderReportsTable();});});
document.addEventListener("click",function(e){
  const s=e.target.closest("[data-src]");if(s){openSourceForReport(s.dataset.src);return;}
  const edit=e.target.closest("[data-edit-patient]");if(edit){editPatientDetails(edit.dataset.editPatient);return;}
  const g=e.target.closest("[data-gorecord]");if(g){selectPatient(g.dataset.gorecord);showView("record");}
});
function simulateFile(fileObj,listEl,onDone){
  const isImg=/\.(jpg|jpeg|png)$/i.test(fileObj.name);
  const item=document.createElement("div");item.className="file-item";
  item.innerHTML='<div class="file-top"><span class="file-ico'+(isImg?" img":"")+'">'+(isImg?"IMG":"PDF")+'</span><div><strong>Medical report</strong><small>'+fmtSize(fileObj.size)+' - queued</small></div><span class="file-status processing">Processing report...</span></div><div class="progress" role="progressbar" aria-label="Processing file" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="progress-fill"></div></div>';
  listEl.prepend(item);
  const fill=$(".progress-fill",item),bar=$(".progress",item),st=$(".file-status",item),sub=$("small",item);
  const stages=["Reading document...","Extracting tables...","Matching reference ranges...","Tagging provenance..."];
  let p=0;
  const iv=setInterval(function(){
    p=Math.min(100,p+4+Math.random()*9);
    fill.style.width=p+"%";bar.setAttribute("aria-valuenow",Math.round(p));
    sub.textContent=fmtSize(fileObj.size)+" - "+stages[Math.min(3,Math.floor(p/26))];
    if(p>=100){clearInterval(iv);st.textContent="Analysis complete";st.classList.remove("processing");st.classList.add("done");sub.textContent=fmtSize(fileObj.size)+" - 8 values extracted";if(onDone)onDone(item);}
  },150);
}
function extractedLines(){return ["Hemoglobin 13.8 g/dL - ref 13.0-17.0 (Normal)","Glucose (Fasting) 142 mg/dL - ref 70-100 (High)","TSH 6.8 uIU/mL - ref 0.4-4.0 (High, medium confidence)","Vitamin D 18 ng/mL - ref 30-100 (Low)","4 further values within their printed ranges"];}
async function afterUpload(fileObj){
  const p=getPatient(selectedPatientId);
  if(!p){toast("Add a patient first","Choose Add a Patient before uploading a report.","warn");return;}
  const form=new FormData();form.append("patient_id",p.id);form.append("report_type","General");form.append("file",fileObj);
  let result;
  try{result=await apiRequest("/reports",{method:"POST",body:form});}
  catch(err){toast("Upload failed",err.message,"error");return;}
  $("#extractedPreview").classList.remove("hidden");
  $("#extractedList").innerHTML=(result.extracted||[]).map(function(item){return "<li>"+esc(item.test_name)+" - "+esc(item.value)+" "+esc(item.unit)+" ("+esc(item.reference_range||"No reference range")+")</li>";}).join("");
  ["pipeStep3","pipeStep4"].forEach(function(id){const li=$("#"+id);if(li)li.classList.add("done");});
  await loadBackendData();
  toast("Processing completed","Analysis complete - 8 values extracted.","success");
}
function handleMainFiles(files){
  const list=$("#fileList");if(!files||!files.length)return;
  Array.from(files).slice(0,3).forEach(function(f){
    if(!/\.(pdf|jpg|jpeg|png)$/i.test(f.name)){toast("Unsupported format",f.name+" - use PDF, JPG or PNG.","error");return;}
    if(f.size>15*1048576){toast("File too large",f.name+" exceeds 15 MB.","error");return;}
    toast("Report uploaded",f.name+" received. Extraction started.","info");
    simulateFile(f,list,function(){afterUpload(f);});
  });
}
const dz=$("#dropZone"),fi=$("#fileInput");
dz.addEventListener("click",function(e){if(!e.target.closest("button"))fi.click();});
dz.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();fi.click();}});
$("#btnBrowse").addEventListener("click",function(e){e.stopPropagation();fi.click();});
fi.addEventListener("change",function(){handleMainFiles(fi.files);fi.value="";});
["dragover","dragenter"].forEach(function(ev){dz.addEventListener(ev,function(e){e.preventDefault();dz.classList.add("drag");});});
["dragleave","drop"].forEach(function(ev){dz.addEventListener(ev,function(e){e.preventDefault();dz.classList.remove("drag");});});
dz.addEventListener("drop",function(e){handleMainFiles(e.dataTransfer.files);});
$("#btnViewExtractSource").addEventListener("click",function(){openSourceGeneric("Latest extraction","Uploaded report");});
$("#btnUploadFromRecord").addEventListener("click",function(){openModal("modalUpload");});
$("#btnUploadHero").addEventListener("click",function(){openModal("modalUpload");});
const mdz=$("#modalDropZone"),mfi=$("#modalFileInput");
mdz.addEventListener("click",function(){mfi.click();});
mdz.addEventListener("keydown",function(e){if(e.key==="Enter")mfi.click();});
$("#btnModalBrowse").addEventListener("click",function(e){e.stopPropagation();mfi.click();});
mfi.addEventListener("change",function(){modalFiles=Array.from(mfi.files).slice(0,2);renderModalFiles();mfi.value="";});
mdz.addEventListener("dragover",function(e){e.preventDefault();mdz.classList.add("drag");});
mdz.addEventListener("dragleave",function(e){e.preventDefault();mdz.classList.remove("drag");});
mdz.addEventListener("drop",function(e){e.preventDefault();mdz.classList.remove("drag");modalFiles=Array.from(e.dataTransfer.files).slice(0,2);renderModalFiles();});
function renderModalFiles(){
  const list=$("#modalFileList");list.innerHTML="";
  modalFiles.forEach(function(f){const d=document.createElement("div");d.className="file-item";d.innerHTML='<div class="file-top"><span class="file-ico">PDF</span><div><strong>'+esc(f.name)+'</strong><small>'+fmtSize(f.size)+' - ready to process</small></div><span class="file-status processing">Selected</span></div>';list.appendChild(d);});
  $("#btnStartProcessing").disabled=!modalFiles.length;
}
$("#btnStartProcessing").addEventListener("click",function(){
  if(!modalFiles.length)return;
  const pid=$("#modalPatient").value||selectedPatientId;const p=getPatient(pid);
  if(!p){toast("Add a patient first","Choose Add a Patient before uploading a report.","warn");return;}
  const list=$("#modalFileList");list.innerHTML="";
  toast("Report uploaded",modalFiles[0].name+" attached to "+p.name+".","info");
  simulateFile(modalFiles[0],list,async function(){
    const form=new FormData();form.append("patient_id",p.id);form.append("report_type","General");form.append("file",modalFiles[0]);
    try{await apiRequest("/reports",{method:"POST",body:form});await loadBackendData();selectPatient(pid);toast("Processing completed","The report was added to the patient record.","success");}
    catch(err){toast("Upload failed",err.message,"error");}
    modalFiles=[];$("#btnStartProcessing").disabled=true;
    setTimeout(function(){closeModal("modalUpload");showView("record");},1100);
  });
});

/* ============ STRUCTURED RECORD ============ */
function refreshPatientSelects(){
  const opts=patients.length?patients.map(function(p){return '<option value="'+p.id+'">'+esc(p.name)+' - '+p.id+'</option>';}).join(""): '<option value="">No patients added yet</option>';
  $("#recordPatientSelect").innerHTML=opts;$("#recordPatientSelect").value=selectedPatientId;
  $("#comparePatient").innerHTML=opts;$("#comparePatient").value=selectedPatientId;
  $("#timelinePatientFilter").innerHTML='<option value="">All patients</option>'+opts;
  $("#modalPatient").innerHTML=opts;$("#modalPatient").value=selectedPatientId;
  buildCompareReports();
}
function selectPatient(id){if(!getPatient(id))return;selectedPatientId=id;const s=$("#recordPatientSelect");if(s)s.value=id;renderRecord(id);loadPatientRecord(id);}
$("#recordPatientSelect").addEventListener("change",function(e){renderRecord(e.target.value);});
$("#btnEditPatientDetails").addEventListener("click",function(){if(selectedPatientId)editPatientDetails(selectedPatientId);});
function renderRecord(pid){
  const p=getPatient(pid)||patients[0];
  if(!p){
    selectedPatientId="";
    $("#r-avatar").textContent="--";$("#r-name").textContent="No patient selected";$("#r-status").textContent="Waiting for patient";$("#r-status").className="badge badge-neutral";$("#r-risk").textContent="";$("#r-risk").className="risk-badge";
    $("#r-meta").textContent="Add a patient to view their medical record.";$("#r-updated").textContent="No information available yet";$("#r-completenessBar").style.width="0%";$("#r-completenessText").textContent="No record yet";$("#exportPatientName").textContent="No patient selected";
    $("#cardPatientInfo").innerHTML='<p class="muted">Patient information will appear here.</p>';$("#cardSymptoms").innerHTML='<span class="muted small">No symptoms recorded.</span>';$("#cardConditions").innerHTML='<span class="muted small">No conditions recorded.</span>';$("#cardAllergies").innerHTML='<span class="muted small">No allergies recorded.</span>';$("#cardMeds").innerHTML='<li class="muted">No medications recorded.</li>';$("#clinicalAlertsList").innerHTML='<div class="alert-item info"><div><strong>No alerts yet</strong><p>Add a patient and report to see alerts.</p></div></div>';$("#alertCount").textContent="0";$("#provenanceBody").innerHTML='<p class="muted small">Information sources will appear here.</p>';$("#labTableBody").innerHTML='<tr><td colspan="9" class="muted" style="text-align:center;padding:20px">Add a patient to begin.</td></tr>';$("#aiSummaryBody").innerHTML='<p class="muted">A patient summary will appear after you add a patient.</p>';$("#conflictCount").textContent="0";$("#conflictsList").innerHTML='<p class="muted">No conflicts yet.</p>';$("#prevReportsList").innerHTML='<p class="muted small">No reports yet.</p>';return;
  }
  selectedPatientId=p.id;
  $("#r-avatar").textContent=initials(p.name);
  $("#r-name").textContent=p.name;
  const st=$("#r-status");st.textContent=p.status;
  st.className="badge "+({"Verified":"badge-verified","Active":"badge-active","Pending Review":"badge-pending","Needs Attention":"badge-alert"}[p.status]||"badge-neutral");
  const rk=$("#r-risk");rk.textContent=p.risk+" priority";rk.className="risk-badge risk-"+p.risk.toLowerCase();
  $("#r-meta").textContent=p.id+" - "+p.age+" yrs - "+p.sex+" - DOB "+(p.dob!=="—"?fmtDate(p.dob):"—");
  const linkedReports=reports.filter(function(report){return report.patientId===p.id;}).length;
  p.reports=linkedReports;
  const labs=patientLabs(p.id);
  const verified=labs.filter(function(l){return l.verified;}).length;
  const pct=labs.length?Math.round((verified/labs.length)*100):0;
  const complete=labs.length?Math.round(60+(pct*0.35)):55;
  $("#r-updated").textContent="Last updated "+fmtDate(p.lastReport)+" - "+labs.length+" lab values - "+linkedReports+" report"+(linkedReports===1?"":"s")+" linked";
  $("#r-completenessBar").style.width=complete+"%";
  $("#r-completenessText").textContent=complete+"% complete - "+(labs.length-verified)+" item(s) need verification";
  $("#exportPatientName").textContent=p.name;
  $("#cardPatientInfo").innerHTML="<dt>Phone</dt><dd>"+esc(p.phone)+"</dd><dt>Emergency</dt><dd>"+esc(p.emergency)+"</dd><dt>Blood work</dt><dd>"+labs.length+" tests on file</dd><dt>Notes</dt><dd>"+esc(p.notes)+"</dd>";
  $("#cardSymptoms").innerHTML=p.symptoms.map(function(s){return '<span class="cond-chip">'+esc(s)+'</span>';}).join("");
  $("#cardConditions").innerHTML=p.conditions.length?p.conditions.map(function(s){return '<span class="cond-chip">'+esc(s)+'</span>';}).join(""):'<span class="muted small">None recorded</span>';
  const hasAC=conflicts.some(function(c){return c.patientId===p.id&&c.status==="open"&&/allerg/i.test(c.title);});
  $("#cardAllergies").innerHTML=p.allergies.map(function(a){const al=/penicillin|latex|aspirin|sulfa/i.test(a)?" alert":"";return '<span class="cond-chip'+al+'">'+esc(a)+'</span>';}).join("");
  $("#allergyFlag").style.display=hasAC?"":"none";
  $("#cardMeds").innerHTML=p.meds.length?p.meds.map(function(m){return '<li><div><strong>'+esc(m.n)+'</strong><br><small>'+esc(m.d)+'</small></div>'+srcBadge("report")+'</li>';}).join(""):'<li class="muted">No medications recorded</li>';
  renderLabs(p);renderPrevReports(p);renderAlerts(p);renderProvenance(p);renderAI(p);renderConflicts(p);
  if($("#comparePatient").value!==p.id){$("#comparePatient").value=p.id;buildCompareReports();}
}
function renderLabs(p){
  const labs=patientLabs(p.id);
  if(!labs.length){$("#labTableBody").innerHTML='<tr><td colspan="9" class="muted" style="text-align:center;padding:20px">No lab values yet - upload a report to simulate extraction.</td></tr>';return;}
  $("#labTableBody").innerHTML=labs.map(function(l,i){
    const s=statusOf(l.result,l.min,l.max);
    const v=l.verified?'<span class="verified-tag">Verified'+(l.reviewer?' - '+esc(l.reviewer):"")+'</span>':'<button class="btn btn-ghost btn-xs" data-verify="'+i+'">Verify</button>';
    return '<tr><td><strong>'+esc(l.test)+'</strong></td><td><strong>'+num(l.result)+'</strong></td><td class="muted">'+esc(l.unit)+'</td>'
    +'<td style="white-space:nowrap">'+esc(l.ref)+'</td><td>'+statusBadge(s)+'</td><td style="white-space:nowrap">'+fmtDate(l.date)+'</td>'
    +'<td>'+srcBadge(l.source)+' <button class="link-btn" data-labsrc="'+i+'">View</button></td><td>'+confHTML(l.conf,l.confPct)+'</td>'
    +'<td style="white-space:nowrap">'+v+' <button class="btn btn-secondary btn-xs" data-edit="'+i+'">Edit</button></td></tr>';
  }).join("");
}
document.addEventListener("click",function(e){
  const v=e.target.closest("[data-verify]");
  if(v){const l=patientLabs(selectedPatientId)[+v.dataset.verify];l.verified=true;l.reviewer=reviewer();const p=getPatient(selectedPatientId);addTimeline(p.id,"Value verified",l.test+" "+l.result+" "+l.unit+" verified by "+l.reviewer+".","input",l.reviewer,"ok");renderRecord(p.id);renderTimeline();toast("Record verified",l.test+" marked as verified by reviewer.","success");return;}
  const ed=e.target.closest("[data-edit]");if(ed){openEditModal(+ed.dataset.edit);return;}
  const ls=e.target.closest("[data-labsrc]");if(ls){openSourceForLab(patientLabs(selectedPatientId)[+ls.dataset.labsrc]);return;}
  const vs=e.target.closest("[data-viewsource]");if(vs){openSourceGeneric(vs.dataset.viewsource,"Linked documents");return;}
});
$("#btnVerifyAll").addEventListener("click",function(){
  const labs=patientLabs(selectedPatientId);
  if(!labs.length){toast("Nothing to verify","No lab values for this patient yet.","warn");return;}
  labs.forEach(function(l){l.verified=true;l.reviewer=reviewer();});
  const p=getPatient(selectedPatientId);p.verified=true;if(p.status==="Pending Review")p.status="Active";
  addTimeline(p.id,"Record reviewed","All "+labs.length+" values verified by "+reviewer()+".","input",reviewer(),"ok");
  stats.pending=Math.max(0,stats.pending-1);
  renderStats();renderRecord(p.id);renderPatientsTable();renderRecent("");renderTimeline();
  toast("Record verified","All values verified for "+p.name+".","success");
});
function renderPrevReports(p){
  const list=reports.filter(function(r){return r.patientId===p.id;});
  $("#prevReportsList").innerHTML=list.length?list.map(function(r){return '<div class="prev-item"><span class="file-ico">PDF</span><div><strong>'+esc(r.file)+'</strong><small>'+esc(r.type)+' - '+fmtDate(r.date)+' - '+esc(r.status)+'</small></div><button class="btn btn-ghost btn-xs" data-src="'+r.id+'">View source</button></div>';}).join(""):'<p class="muted small">No linked reports yet.</p>';
}
function renderAlerts(p){
  const labs=patientLabs(p.id);
  const out=labs.filter(function(l){return statusOf(l.result,l.min,l.max)!=="Normal";});
  const open=conflicts.filter(function(c){return c.patientId===p.id&&c.status==="open";});
  let html="";
  out.slice(0,3).forEach(function(l){const s=statusOf(l.result,l.min,l.max);html+='<div class="alert-item '+(s==="High"?"high":"info")+'"><div><strong>'+(s==="High"?"High":"Low")+' - '+esc(l.test)+'</strong><p>'+num(l.result)+' '+esc(l.unit)+' - ref '+esc(l.ref)+'</p></div></div>';});
  if(open.length)html+='<div class="alert-item warn"><div><strong>'+open.length+' conflict(s) need review</strong><p>Human decision required before verification.</p></div></div>';
  if(!html)html='<div class="alert-item info"><div><strong>No active alerts</strong><p>All values within range, no open conflicts.</p></div></div>';
  $("#clinicalAlertsList").innerHTML=html;
  $("#alertCount").textContent=String(out.length+open.length);
}
function renderProvenance(p){
  const labs=patientLabs(p.id);
  const a=2+p.symptoms.length,b=labs.length+p.meds.length;
  $("#provenanceBody").innerHTML='<div class="prov-row"><span>'+srcBadge("input")+'</span><span class="prov-count">'+a+' items</span></div><div class="prov-row"><span>'+srcBadge("report")+'</span><span class="prov-count">'+b+' items</span></div><div class="prov-row"><span>'+srcBadge("ai")+'</span><span class="prov-count">4 items</span></div><p class="muted small" style="margin-top:8px">Every field traces to one of these origins. Open View source to inspect.</p>';
}
function renderAI(p){
  const labs=patientLabs(p.id);
  const normal=labs.filter(function(l){return statusOf(l.result,l.min,l.max)==="Normal";}).slice(0,3).map(function(l){return l.test+" "+num(l.result)+" "+l.unit+" is within its printed range";});
  const review=labs.filter(function(l){return statusOf(l.result,l.min,l.max)!=="Normal";}).map(function(l){return l.test+": "+num(l.result)+" "+l.unit+" is "+statusOf(l.result,l.min,l.max).toLowerCase()+" vs ref "+l.ref;});
  const allergyNote=conflicts.some(function(c){return c.patientId===p.id&&c.status==="open"&&/allerg/i.test(c.title);})?"has an unresolved mismatch -":"appears consistent -";
  $("#aiSummaryBody").innerHTML=
    '<div class="ai-block"><h4>Key observations</h4><ul>'+(normal.length?normal:["No lab values on file yet"]).map(function(x){return "<li>"+esc(x)+".</li>";}).join("")+"<li>Record for "+esc(p.name)+" links "+p.reports+" report(s) with source tags intact.</li></ul></div>"
    +'<div class="ai-block"><h4>Important reported findings</h4><ul>'+p.symptoms.map(function(s){return "<li>Patient reports: "+esc(s)+".</li>";}).join("")+"<li>Known conditions: "+esc(p.conditions.join("; ")||"none recorded")+".</li></ul></div>"
    +'<div class="ai-block"><h4>Values requiring review</h4><ul>'+(review.length?review.map(function(x){return "<li>"+esc(x)+" - worth discussing with the clinician.</li>";}).join(""):"<li>No out-of-range values in the latest extraction.</li>")+"</ul></div>"
    +'<div class="ai-block"><h4>Information gaps</h4><ul><li>Blood pressure and weight not present in latest documents.</li><li>Allergy list "+allergyNote+" confirm at next visit.</li><li>Bring prior prescriptions to complete medication history.</li></ul></div>';
}
function renderConflicts(p){
  const list=conflicts.filter(function(c){return c.patientId===p.id;});
  const open=list.filter(function(c){return c.status==="open";}).length;
  $("#conflictCount").textContent=open?open+" open":"All resolved";
  $("#conflictsList").innerHTML=list.length?list.map(function(c){
    const right=c.status==="open"?'<button class="btn btn-secondary btn-sm" data-review="'+c.id+'">Review</button>':'<span class="verified-tag">Resolved</span>';
    const res=c.resolution?'<p class="small"><strong>Resolution:</strong> '+esc(c.resolution)+' <span class="muted">- '+esc(c.resolvedBy||"")+'</span></p>':"";
    return '<div class="conflict-item '+(c.status==="resolved"?"resolved":"")+'"><div class="conflict-top"><span class="conflict-warn">'+(c.status==="resolved"?"OK":"!")+'</span><div style="flex:1"><strong>'+esc(c.title)+'</strong><p>'+esc(c.desc)+'</p></div>'+right+'</div><div class="conflict-srcs"><div><strong>Source A</strong><br>'+esc(c.a)+'</div><div><strong>Source B</strong><br>'+esc(c.b)+'</div></div>'+res+'</div>';
  }).join(""):'<p class="muted">No conflicts detected for this patient.</p>';
}
document.addEventListener("click",function(e){
  const r=e.target.closest("[data-review]");if(!r)return;
  const c=conflicts.filter(function(x){return x.id===r.dataset.review;})[0];if(!c)return;
  activeConflictId=c.id;
  $("#conflictTitle").textContent="Review: "+c.title;
  $("#conflictDesc").textContent=c.desc;
  $("#conflictSourceA").textContent=c.a;$("#conflictSourceB").textContent=c.b;
  $("#conflictCorrected").value="";$("#conflictNotes").value="";
  document.querySelector('input[name="conflictChoice"][value="A"]').checked=true;
  openModal("modalConflict");
});
$$('input[name="conflictChoice"]').forEach(function(r){r.addEventListener("change",function(){
  const c=conflicts.filter(function(x){return x.id===activeConflictId;})[0];if(!c)return;
  const txt=r.value==="A"?c.a:c.b;const parts=txt.split(":");$("#conflictCorrected").value=parts.length>1?parts.slice(1).join(":").trim():txt;
});});
$("#btnResolveConflict").addEventListener("click",function(){
  const c=conflicts.filter(function(x){return x.id===activeConflictId;})[0];if(!c)return;
  const val=$("#conflictCorrected").value.trim();
  if(!val){toast("Correction required","Enter the confirmed value before resolving.","error");$("#conflictCorrected").focus();return;}
  c.status="resolved";c.resolution=val+($("#conflictNotes").value.trim()?" - Note: "+$("#conflictNotes").value.trim():"");c.resolvedBy=reviewer();
  stats.alerts=Math.max(0,stats.alerts-1);
  addTimeline(c.patientId,"Conflict resolved",c.title+" - confirmed: "+val+".","input",c.resolvedBy,"ok");
  renderStats();renderRecord(c.patientId);renderTimeline();closeModal("modalConflict");
  toast("Conflict resolved","Correction saved and audit-logged.","success");
});
function openEditModal(i){
  const l=patientLabs(selectedPatientId)[i];if(!l)return;
  editingIndex=i;
  $("#editTestName").textContent=l.test;$("#editUnit").textContent=l.unit;$("#editRef").textContent=l.ref;
  $("#editValueInput").value=l.result;$("#editNotes").value="";
  updateEditPreview();openModal("modalEdit");
}
function updateEditPreview(){
  const l=patientLabs(selectedPatientId)[editingIndex];if(!l)return;
  const v=parseFloat(String($("#editValueInput").value).replace(/,/g,""));
  if(isNaN(v)){$("#editPreview").textContent="Enter a numeric value to preview its status.";return;}
  $("#editPreview").innerHTML="Preview: <strong>"+num(v)+" "+esc(l.unit)+"</strong> - "+statusBadge(statusOf(v,l.min,l.max))+' <span class="muted">(range '+esc(l.ref)+')</span>';
}
$("#editValueInput").addEventListener("input",updateEditPreview);
$("#btnSaveEdit").addEventListener("click",function(){
  const labs=patientLabs(selectedPatientId);const l=labs[editingIndex];if(!l)return;
  const v=parseFloat(String($("#editValueInput").value).replace(/,/g,""));
  if(isNaN(v)){toast("Invalid value","Enter a numeric result.","error");return;}
  const old=l.result;l.result=v;l.verified=true;l.reviewer=reviewer();l.date=new Date().toISOString().slice(0,10);
  addTimeline(selectedPatientId,"Value corrected and verified",l.test+" updated "+num(old)+" to "+num(v)+" "+l.unit+" by "+l.reviewer+".","input",l.reviewer,"ok");
  renderRecord(selectedPatientId);renderTimeline();closeModal("modalEdit");
  toast("Changes saved",l.test+" updated and marked Verified by reviewer.","success");
});

/* ============ SOURCE MODALS ============ */
function docTable(rows,hl){
  let h='<div class="doc-head"><strong>CITYCARE DIAGNOSTICS</strong><br><small>Sample Report (FICTIONAL)</small></div><table><tr><th>Test</th><th>Result</th><th>Ref. Range</th></tr>';
  rows.forEach(function(r,i){h+='<tr'+(i===hl?' style="background:#fef9c3;font-weight:700"':"")+'><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td><td>'+esc(r[2])+'</td></tr>';});
  return h+'</table><p style="margin-top:8px;font-size:11px;color:#64748b">Fictional demo data - verify against original document.</p>';
}
function openSourceForReport(id){
  const r=reports.filter(function(x){return x.id===id;})[0];if(!r)return;
  $("#sourceTitle").textContent="Source - "+r.file;
  $("#sourceMeta").textContent=r.patient+" - "+r.type+" - "+fmtDate(r.date)+" - "+r.id;
  $("#sourceDocPreview").innerHTML=docTable([["Hemoglobin","13.8 g/dL","13.0 - 17.0"],["Glucose (F)","142 mg/dL","70 - 100"],["TSH","6.8 uIU/mL","0.4 - 4.0"],["Vitamin D","18 ng/mL","30 - 100"]],1);
  $("#sourceExcerpt").innerHTML=["Document parsed into 8 structured fields.","Each value keeps its printed reference range.","Out-of-range values flagged; confidence attached."].map(function(x){return '<div class="extract-line">'+esc(x)+'</div>';}).join("");
  $("#sourceProv").innerHTML=srcBadge("report")+'<span class="badge badge-info">'+r.conf+' confidence</span>';
  openModal("modalSource");
}
function openSourceForLab(l){
  $("#sourceTitle").textContent="Source - "+l.test;
  $("#sourceMeta").textContent="Extracted "+fmtDate(l.date)+" - CityCare Diagnostics (fictional)";
  $("#sourceDocPreview").innerHTML=docTable([[l.test,num(l.result)+" "+l.unit,l.ref],["WBC Count","7,200 /uL","4,000 - 11,000"],["Creatinine","1.1 mg/dL","0.6 - 1.2"]],0);
  $("#sourceExcerpt").innerHTML=[l.test+": "+num(l.result)+" "+l.unit+" (ref "+l.ref+")",'Status "'+statusOf(l.result,l.min,l.max)+'" derived only from this printed range.',"Confidence "+l.conf+" ("+l.confPct+"%) - "+(l.verified?"Verified by "+l.reviewer:"Awaiting human verification")+"."].map(function(x){return '<div class="extract-line">'+esc(x)+'</div>';}).join("");
  $("#sourceProv").innerHTML=srcBadge(l.source)+srcBadge("ai");
  openModal("modalSource");
}
function openSourceGeneric(kind,meta){
  const titles={symptoms:"Source - Symptoms",conditions:"Source - Conditions",meds:"Source - Medications",provenance:"Source - Provenance map","Latest extraction":"Source - Latest extraction"};
  $("#sourceTitle").textContent=titles[kind]||"Source excerpt";
  const pn=(getPatient(selectedPatientId)||{name:""}).name;
  $("#sourceMeta").textContent=pn+" - "+meta;
  const map={symptoms:[["Symptom","Fatigue, 2 weeks","Intake"],["Symptom","Headache","Intake"]],conditions:[["Condition","Type 2 Diabetes","Since 2019"],["Condition","Hypertension","Since 2021"]],meds:[["Medicine","Metformin 500 mg","Twice daily"],["Medicine","Amlodipine 5 mg","Morning"]],provenance:[["Origin","Count",""],["Patient input","6",""],["Uploaded report","11",""]],"Latest extraction":[["Hemoglobin","13.8 g/dL","13.0 - 17.0"],["TSH","6.8 uIU/mL","0.4 - 4.0"]]};
  const rows=map[kind]||map["Latest extraction"];
  let h='<div class="doc-head"><strong>PATIENT DOCUMENT (FICTIONAL)</strong><br><small>Excerpt for traceability</small></div><table><tr><th>Field</th><th>Value</th><th>Note</th></tr>';
  rows.forEach(function(r){h+="<tr><td>"+esc(r[0])+"</td><td>"+esc(r[1])+"</td><td>"+esc(r[2])+"</td></tr>";});
  $("#sourceDocPreview").innerHTML=h+"</table>";
  $("#sourceExcerpt").innerHTML=["Highlighted section is the origin of the structured value.","Side-by-side layout keeps source and structure visible together."].map(function(x){return '<div class="extract-line">'+esc(x)+'</div>';}).join("");
  $("#sourceProv").innerHTML=srcBadge("input")+srcBadge("report")+srcBadge("ai");
  openModal("modalSource");
}
function openPatientModal(id){
  const p=getPatient(id);if(!p)return;
  $("#patientModalTitle").textContent=p.name+" - "+p.id;
  $("#patientModalBody").innerHTML='<div style="display:flex;gap:12px;align-items:center"><span class="avatar avatar-md">'+initials(p.name)+'</span><div><strong>'+p.age+' yrs - '+esc(p.sex)+'</strong><br><span class="muted small">Last report '+fmtDate(p.lastReport)+' - '+p.reports+' reports</span></div><span style="margin-left:auto">'+statusBadge(p.status)+'</span></div>'
  +'<div class="prov-tags">'+srcBadge("input")+riskBadge(p.risk)+'</div>'
  +'<p class="small"><strong>Conditions:</strong> '+esc(p.conditions.join(", ")||"—")+'</p>'
  +'<p class="small"><strong>Allergies:</strong> '+esc(p.allergies.join(", "))+'</p>'
  +'<p class="small"><strong>Medications:</strong> '+esc(p.meds.map(function(m){return m.n;}).join(", ")||"—")+'</p>'
  +'<p class="muted small">Open the full record for labs, AI summary, conflicts and provenance.</p>';
  $("#btnOpenRecordFromModal").onclick=function(){closeModal("modalPatient");selectPatient(id);showView("record");};
  openModal("modalPatient");
}

/* ============ COMPARE ============ */
function buildCompareReports(){
  const pid=$("#comparePatient").value||selectedPatientId;
  const list=reports.filter(function(r){return r.patientId===pid;});
  const opts=list.map(function(r){return '<option value="'+r.id+'">'+esc(r.type)+' - '+fmtDate(r.date)+'</option>';}).join("")||'<option value="">No reports available</option>';
  $("#comparePrev").innerHTML=opts;$("#compareCurr").innerHTML=opts;
  $("#comparePrev").disabled=list.length<2;$("#compareCurr").disabled=list.length<2;
  if(list.length>=2){$("#comparePrev").selectedIndex=1;$("#compareCurr").selectedIndex=0;}
  renderCompare();
}
$("#comparePatient").addEventListener("change",buildCompareReports);
$("#comparePrev").addEventListener("change",renderCompare);
$("#compareCurr").addEventListener("change",renderCompare);
function renderCompare(){
  const pid=$("#comparePatient").value||selectedPatientId;
  const p=getPatient(pid);const labs=patientLabs(pid);const reportList=reports.filter(function(r){return r.patientId===pid;});
  if(!p){$("#comparePrevCard").innerHTML='<p class="muted">Add a patient to compare reports.</p>';$("#compareCurrCard").innerHTML="";$("#compareSummary").innerHTML="";$("#compareTableBody").innerHTML='<tr><td colspan="6" class="muted" style="text-align:center;padding:20px">No reports available yet.</td></tr>';return;}
  if(reportList.length<2){$("#comparePrevCard").innerHTML='<p class="muted">Upload a second report to compare.</p>';$("#compareCurrCard").innerHTML='<p class="muted small">This patient has '+reportList.length+' report'+(reportList.length===1?"":"s")+'.</p>';$("#compareSummary").innerHTML="";$("#compareTableBody").innerHTML='<tr><td colspan="6" class="muted" style="text-align:center;padding:20px">Upload a second report to compare this patient\'s results.</td></tr>';return;}
  const prev=reportList[1]&&patientLabs(pid).filter(function(l){return l.date===reportList[1].date;}).map(function(l){return l.result;});
  const po=$("#comparePrev").selectedOptions[0],co=$("#compareCurr").selectedOptions[0];
  const prevLabel=po?po.textContent:"Previous",currLabel=co?co.textContent:"Current";
  $("#comparePrevCard").innerHTML='<p class="mini-label" style="color:var(--muted)">Previous report</p><h4>'+esc(prevLabel)+'</h4><p class="muted small">'+esc(p.name)+' - '+esc(p.id)+'</p><div class="prov-tags" style="margin-top:8px">'+srcBadge("report")+'<span class="badge badge-neutral">Baseline</span></div>';
  $("#compareCurrCard").innerHTML='<p class="mini-label" style="color:var(--primary)">Current report</p><h4>'+esc(currLabel)+'</h4><p class="muted small">'+esc(p.name)+' - '+esc(p.id)+'</p><div class="prov-tags" style="margin-top:8px">'+srcBadge("report")+'<span class="badge badge-active">Latest</span></div>';
  if(!labs.length){$("#compareTableBody").innerHTML='<tr><td colspan="6" class="muted" style="text-align:center;padding:20px">No lab values for this patient yet.</td></tr>';$("#compareSummary").innerHTML="";return;}
  let changed=0,up=0,down=0;
  $("#compareTableBody").innerHTML=labs.map(function(l,i){
    const pv=prev[i]!=null?prev[i]:l.result;
    const d=l.result-pv;const isCh=Math.abs(d)>0.0001;
    if(isCh){changed++;if(d>0)up++;else down++;}
    const s=statusOf(l.result,l.min,l.max);
    const cls=!isCh?"delta-same":(d>0?"delta-up":"delta-down");
    const arrow=!isCh?"stable":(d>0?"+":"")+(Math.round(d*10)/10);
    return '<tr class="'+(isCh?"row-changed":"")+'"><td><strong>'+esc(l.test)+'</strong></td><td>'+num(pv)+' '+esc(l.unit)+'</td><td><strong>'+num(l.result)+' '+esc(l.unit)+'</strong></td><td>'+esc(l.ref)+'</td><td class="'+cls+'">'+arrow+'</td><td>'+statusBadge(s)+'</td></tr>';
  }).join("");
  $("#compareSummary").innerHTML='<span class="sum-chip"><b>'+changed+'</b> changed</span><span class="sum-chip"><b class="delta-up">'+up+' up</b></span><span class="sum-chip"><b class="delta-down">'+down+' down</b></span><span class="sum-chip">'+srcBadge("ai")+' trend computed locally</span>';
}

/* ============ TIMELINE ============ */
function renderTimeline(){
  const f=$("#timelinePatientFilter").value;
  const list=timeline.filter(function(t){return !f||t.patientId===f;}).slice().sort(function(a,b){return b.date.localeCompare(a.date);});
  $("#timelineList").innerHTML=list.length?list.map(function(t){
    const p=getPatient(t.patientId);
    return '<li><span class="tl-dot '+(t.tone||"")+'"></span><div class="tl-card"><span class="tl-date">'+fmtDate(t.date)+' - '+esc(p?p.name:t.patientId)+'</span><br><strong>'+esc(t.title)+'</strong><p class="muted small">'+esc(t.desc)+'</p><div class="tl-meta">'+srcBadge(t.source)+'<span>'+esc(t.actor)+'</span></div></div></li>';
  }).join(""):'<li class="muted">No events for this filter yet.</li>';
}
$("#timelinePatientFilter").addEventListener("change",renderTimeline);

/* ============ EXPORT / SETTINGS ============ */
$("#btnExportRecord").addEventListener("click",function(){$("#exportReady").classList.add("hidden");$("#exportPatientName").textContent=(getPatient(selectedPatientId)||{name:""}).name;openModal("modalExport");});
$("#btnConfirmExport").addEventListener("click",function(){$("#exportReady").classList.remove("hidden");toast("Export prepared","Patient record prepared for export.","success");});
$("#btnPrintRecord").addEventListener("click",function(){toast("Opening print view","Use Save as PDF in the print dialog.","info");setTimeout(function(){window.print();},500);});
$$(".switch").forEach(function(sw){sw.addEventListener("click",function(){const on=!sw.classList.contains("on");sw.classList.toggle("on",on);sw.setAttribute("aria-checked",String(on));});});
$("#btnSaveSettings").addEventListener("click",function(){const name=reviewer();localStorage.setItem("medlensReviewerName",name);updateReviewerIdentity(name);toast("Settings saved","Your name and preferences were updated.","success");});
$("#btnResetDemo").addEventListener("click",function(){toast("Workspace cleared","All information has been removed.","info");setTimeout(function(){location.reload();},900);});

/* ============ INSIGHTS SYNC + INIT ============ */
function renderInsights(){
  const labs=patientLabs(selectedPatientId);
  const n=labs.filter(function(l){return statusOf(l.result,l.min,l.max)==="Normal";}).length;
  const h=labs.filter(function(l){return statusOf(l.result,l.min,l.max)==="High";});
  const lw=labs.filter(function(l){return statusOf(l.result,l.min,l.max)==="Low";});
  const rows=$$(".insight-row");
  if(rows[0]){rows[0].querySelector("strong").textContent=n+" values within range";}
  if(rows[1]&&h.length){rows[1].querySelector("strong").textContent=h.length+" high value(s) flagged";rows[1].querySelector("p").textContent=h[0].test+" "+h[0].result+" "+h[0].unit+" (ref "+h[0].ref+") - needs review";}
  if(rows[2]&&lw.length){rows[2].querySelector("strong").textContent=lw.length+" low value(s) flagged";rows[2].querySelector("p").textContent=lw[0].test+" "+lw[0].result+" "+lw[0].unit+" (ref "+lw[0].ref+") - needs review";}
}
renderStats();renderRecent("");renderPatientsTable();renderReportsTable("");
refreshPatientSelects();renderRecord(selectedPatientId);renderTimeline();renderInsights();
loadReviewerSettings();
loadBackendData();
})();
