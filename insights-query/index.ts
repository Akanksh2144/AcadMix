import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GCP_PROJECT = Deno.env.get("GCP_PROJECT_ID") || "";
const GCP_LOCATION = Deno.env.get("GCP_LOCATION") || "us-central1";
const GCP_SA_JSON = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") || "";
const MODEL_CLASSIFIER = "gemini-2.5-flash-lite";
const MODEL_FLASH = "gemini-2.5-flash";
const MODEL_PRO = "gemini-2.5-pro";
const HIDDEN_COLUMNS = new Set(["college_id","id","is_deleted","created_at","updated_at","deleted_at"]);

function sanitizeResults(data: Record<string,unknown>[]): {columns:string[];data:Record<string,unknown>[]} {
  if (!data||data.length===0) return {columns:[],data:[]};
  const cols = Object.keys(data[0]).filter(c=>!HIDDEN_COLUMNS.has(c));
  return {columns:cols,data:data.map(r=>{const o:Record<string,unknown>={};for(const c of cols)o[c]=r[c];return o;})};
}

const MV_REGISTRY: Record<string,{view:string;description:string;columns:string}> = {
  fee_collection_dept:{view:"mv_fee_collection_by_dept",description:"Fee collection by department",columns:"department,total_invoiced,total_collected,collection_rate"},
  fee_collection_type:{view:"mv_fee_collection_by_type",description:"Fee collection by fee type",columns:"fee_type,total_invoiced,total_collected,collection_rate"},
  unpaid_invoices:{view:"mv_unpaid_invoice_summary",description:"Unpaid fee invoices",columns:"department,unpaid_count,unpaid_amount"},
  scholarship:{view:"mv_scholarship_summary",description:"Scholarship applications by dept",columns:"department,total_applications,approved,rejected,pending,total_amount"},
  attendance_dept:{view:"mv_attendance_by_dept",description:"Attendance % by department",columns:"department,total_records,present_count,attendance_pct"},
  attendance_student:{view:"mv_student_attendance",description:"Per-student attendance with percentage. Supports filtering by attendance_pct threshold and department",columns:"student_name,department,roll_number,batch,enrollment_status,total_classes,attended,absent_count,attendance_pct"},
  gpa_dept:{view:"mv_gpa_by_dept",description:"Average CGPA by department",columns:"department,student_count,avg_cgpa,min_cgpa,max_cgpa"},
  top_students:{view:"mv_top_students_cgpa",description:"Top students by CGPA",columns:"student_name,department,roll_number,cgpa"},
  pass_fail:{view:"mv_pass_fail_rates",description:"Pass/fail rates by department",columns:"department,total_grades,pass_count,fail_count,pass_rate"},
  marks:{view:"mv_marks_summary",description:"Marks/exam summary",columns:"department,exam_type,subject_code,avg_marks,max_marks,min_marks,submission_count"},
  enrollment:{view:"mv_enrollment_by_dept",description:"Student enrollment by dept/batch/gender",columns:"department,batch,gender,student_count"},
  hostel:{view:"mv_hostel_occupancy",description:"Hostel occupancy rates",columns:"hostel_name,gender_type,total_capacity,occupied,occupancy_pct"},
  courses:{view:"mv_course_distribution",description:"Course distribution",columns:"department,semester,course_count,total_credits"},
  faculty_workload:{view:"mv_faculty_workload",description:"Faculty teaching workload",columns:"department,faculty_name,subjects_assigned,sections_assigned,total_hours_per_week,total_credits"},
  accreditation:{view:"mv_accreditation_kpis",description:"CO-PO mapping KPIs",columns:"department,total_cos,total_pos,total_mappings,avg_strength"},
};
const MV_LIST = Object.entries(MV_REGISTRY).map(([k,v])=>`- ${k} [cols: ${v.columns}]: ${v.description}`).join("\n");

const SCHEMA_CONTEXT = `You are an expert PostgreSQL query generator for AcadMix college ERP.
Generate ONLY valid PostgreSQL SELECT queries. No explanation, no markdown.
CRITICAL RULES:
- NEVER include college_id, id, is_deleted, created_at, updated_at, deleted_at in SELECT.
- For college_id filtering: college_id = current_setting('app.college_id')
- Only add is_deleted = false for tables that HAVE it. mark_submission_entries does NOT have is_deleted.
- Use ROUND(expr::NUMERIC, 2) for decimals. LIMIT 500 always.
- Output ONLY the SQL query.

=== TABLES ===
users(id [PK], college_id, name, email, role, login_id, is_deleted)
  role: 'student','faculty','hod','principal','admin','superadmin','tpo','exam_cell'
user_profiles(user_id [PK,FK->users], college_id, department, section, batch, current_semester:int, roll_number, enrollment_status, gender, phone, date_of_birth:date, abc_id, is_deleted)
  department: 'AIML','CIVIL','CSD','CSE','CSM','CSO','ECE','EEE','IoT','IT','MECH'
  gender: 'Male','Female' | enrollment_status: 'active','graduated','dropped','transferred'
  batch: '2021-25','2022-26','2023-27','2024-28'
departments(id [PK], college_id, name, code, hod_user_id [FK->users], is_deleted)
courses(id [PK], college_id, department_id [FK->departments], name, subject_code, credits:int, semester:int, type, course_category, hours_per_week:int, is_mooc:bool, is_deleted)
faculty_assignments(id [PK], college_id, teacher_id [FK->users], subject_code, subject_name, department, batch, section, semester:int, academic_year, credits:int, hours_per_week:int, is_lab:bool, is_deleted)
attendance_records(id [PK], college_id, student_id [FK->users], faculty_id [FK->users], subject_code, date:date, status, is_late_entry:bool, is_deleted)
  status: 'present','absent','late','excused','od','medical'
semester_grades(id [PK], college_id, student_id [FK->users], semester:int, course_id [FK->courses], grade, credits_earned:int, is_supplementary:bool, is_deleted)
  grade: 'O','A+','A','B+','B','C','D','F'
mark_submissions(id [PK], college_id, faculty_id [FK->users], subject_code, exam_type, max_marks:int, semester:int, status, is_deleted)
mark_submission_entries(id [PK], college_id, submission_id [FK->mark_submissions], student_id [FK->users], marks_obtained:float, status, co_wise_marks)
  NOTE: This table does NOT have is_deleted column.
student_fee_invoices(id [PK], college_id, student_id [FK->users], fee_type, total_amount:float, academic_year, due_date:date, is_deleted)
fee_payments(id [PK], college_id, student_id [FK->users], invoice_id [FK->student_fee_invoices], amount_paid:float, status, transaction_date:timestamptz, is_deleted)
scholarships(id [PK], college_id, name, type, amount:float, is_deleted)
scholarship_applications(id [PK], college_id, student_id [FK->users], scholarship_id [FK->scholarships], status, applied_at:timestamptz, is_deleted)
hostels(id [PK], college_id, name, total_capacity:int, gender_type, is_deleted)
rooms(id [PK], college_id, hostel_id [FK->hostels], room_number, floor:int, capacity:int, is_deleted)
beds(id [PK], college_id, room_id [FK->rooms], bed_identifier, status, is_deleted)
allocations(id [PK], college_id, student_id [FK->users], hostel_id [FK->hostels], room_id [FK->rooms], bed_id [FK->beds], academic_year, status, is_deleted)
companies(id [PK], college_id, name, sector, website, is_deleted)
placement_drives(id [PK], college_id, company_id [FK->companies], role_title, drive_type, package_lpa:float, drive_date:date, status, min_cgpa:float, is_deleted)
placement_applications(id [PK], college_id, student_id [FK->users], drive_id [FK->placement_drives], status, is_deleted)
leave_requests(id [PK], college_id, applicant_id [FK->users], applicant_role, leave_type, from_date:date, to_date:date, reason, status, is_deleted)
grievances(id [PK], college_id, submitted_by [FK->users], category, subject, status, is_anonymous:bool, is_deleted)
course_feedback(id [PK], college_id, student_id, faculty_id [FK->users], subject_code, content_rating:int, teaching_rating:int, overall_rating:int, is_deleted)
mentor_assignments(id [PK], college_id, faculty_id [FK->users], student_id [FK->users], academic_year, is_active:bool, is_deleted)
course_outcomes(id [PK], college_id, course_id [FK->courses], code, description:text, bloom_level, is_deleted)
program_outcomes(id [PK], college_id, department_id [FK->departments], code, is_deleted)
co_po_mappings(id [PK], co_id [FK->course_outcomes], po_id [FK->program_outcomes], strength:int, college_id, is_deleted)

=== FORMULAS ===
ATTENDANCE %: ROUND(COUNT(CASE WHEN status IN ('present','late','od','medical') THEN 1 END)*100.0/NULLIF(COUNT(*),0),2)
CGPA: JOIN (VALUES ('O',10),('A+',9),('A',8),('B+',7),('B',6),('C',5),('D',4),('F',0)) AS gp(grade,points) ON sg.grade=gp.grade => ROUND(SUM(sg.credits_earned*gp.points)::numeric/NULLIF(SUM(sg.credits_earned),0),2)

=== COMPLEX QUERY EXAMPLES ===
Q: Students who got F grade in any subject
A: SELECT u.name AS student_name, p.department, p.roll_number, c.name AS course_name, sg.semester, sg.grade FROM semester_grades sg JOIN users u ON sg.student_id = u.id JOIN user_profiles p ON u.id = p.user_id JOIN courses c ON sg.course_id = c.id WHERE sg.grade = 'F' AND sg.is_deleted = false AND sg.college_id = current_setting('app.college_id') ORDER BY p.department, u.name LIMIT 500

Q: Average marks in mid-term exams by department
A: SELECT fa.department, ms.exam_type, ROUND(AVG(mse.marks_obtained)::numeric, 2) AS avg_marks, ROUND(MAX(mse.marks_obtained)::numeric, 2) AS max_marks, COUNT(DISTINCT mse.student_id) AS student_count FROM mark_submissions ms JOIN mark_submission_entries mse ON ms.id = mse.submission_id JOIN faculty_assignments fa ON ms.subject_code = fa.subject_code AND ms.college_id = fa.college_id WHERE ms.exam_type ILIKE '%mid%' AND ms.is_deleted = false AND ms.college_id = current_setting('app.college_id') GROUP BY fa.department, ms.exam_type ORDER BY fa.department LIMIT 500

Q: Highest package offered in placements
A: SELECT c.name AS company_name, pd.role_title, pd.package_lpa, pd.drive_date, pd.drive_type FROM placement_drives pd JOIN companies c ON pd.company_id = c.id WHERE pd.is_deleted = false AND pd.college_id = current_setting('app.college_id') ORDER BY pd.package_lpa DESC LIMIT 10

Q: Students with CGPA above 9
A: SELECT u.name AS student_name, p.department, p.roll_number, ROUND(SUM(sg.credits_earned * gp.points)::numeric / NULLIF(SUM(sg.credits_earned), 0), 2) AS cgpa FROM semester_grades sg JOIN users u ON sg.student_id = u.id JOIN user_profiles p ON u.id = p.user_id JOIN (VALUES ('O',10),('A+',9),('A',8),('B+',7),('B',6),('C',5),('D',4),('F',0)) AS gp(grade, points) ON sg.grade = gp.grade WHERE sg.is_deleted = false AND sg.college_id = current_setting('app.college_id') GROUP BY u.name, p.department, p.roll_number HAVING ROUND(SUM(sg.credits_earned * gp.points)::numeric / NULLIF(SUM(sg.credits_earned), 0), 2) > 9 ORDER BY cgpa DESC LIMIT 500

Q: Faculty with highest feedback rating
A: SELECT u.name AS faculty_name, ROUND(AVG(cf.overall_rating)::numeric, 2) AS avg_rating, ROUND(AVG(cf.teaching_rating)::numeric, 2) AS avg_teaching, COUNT(*) AS feedback_count FROM course_feedback cf JOIN users u ON cf.faculty_id = u.id WHERE cf.is_deleted = false AND cf.college_id = current_setting('app.college_id') GROUP BY u.name ORDER BY avg_rating DESC LIMIT 10

Q: Department-wise placement statistics
A: SELECT p.department, COUNT(DISTINCT pa.student_id) AS total_applied, COUNT(DISTINCT CASE WHEN pa.status = 'selected' THEN pa.student_id END) AS selected, ROUND(COUNT(DISTINCT CASE WHEN pa.status = 'selected' THEN pa.student_id END) * 100.0 / NULLIF(COUNT(DISTINCT pa.student_id), 0), 2) AS selection_rate FROM placement_applications pa JOIN users u ON pa.student_id = u.id JOIN user_profiles p ON u.id = p.user_id WHERE pa.is_deleted = false AND pa.college_id = current_setting('app.college_id') GROUP BY p.department ORDER BY selected DESC LIMIT 500`;

let _cachedToken:{token:string;expires:number}|null=null;
async function getAccessToken():Promise<string> {
  if(_cachedToken&&Date.now()<_cachedToken.expires-60000)return _cachedToken.token;
  if(!GCP_SA_JSON)throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not set");
  const sa=JSON.parse(GCP_SA_JSON);
  const now=Math.floor(Date.now()/1000);
  const enc=(o:unknown)=>btoa(JSON.stringify(o)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const unsigned=`${enc({alg:"RS256",typ:"JWT"})}.${enc({iss:sa.client_email,scope:"https://www.googleapis.com/auth/cloud-platform",aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3600})}`;
  const keyData=Uint8Array.from(atob(sa.private_key.replace(/-----[^-]+-----/g,"").replace(/\n/g,"")),c=>c.charCodeAt(0));
  const cryptoKey=await crypto.subtle.importKey("pkcs8",keyData,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
  const sig=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",cryptoKey,new TextEncoder().encode(unsigned));
  const jwt=`${unsigned}.${btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}`;
  const resp=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`});
  const data=await resp.json();
  if(!data.access_token)throw new Error("OAuth failed");
  _cachedToken={token:data.access_token,expires:Date.now()+(data.expires_in||3600)*1000};
  return _cachedToken.token;
}
async function sleep(ms:number){return new Promise(r=>setTimeout(r,ms));}

async function callVertexAI(model:string,systemPrompt:string,userPrompt:string,temperature=0.1,maxTokens=2048,retries=2):Promise<string> {
  for(let attempt=0;attempt<=retries;attempt++){
    try{
      const token=await getAccessToken();
      const url=`https://${GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/${GCP_LOCATION}/publishers/google/models/${model}:generateContent`;
      // deno-lint-ignore no-explicit-any
      const effectiveMaxTokens = model===MODEL_PRO ? Math.max(maxTokens, 4096) : maxTokens;
      const gc:any={temperature,maxOutputTokens:effectiveMaxTokens,candidateCount:1};
      if(model===MODEL_FLASH||model===MODEL_CLASSIFIER)gc.thinkingConfig={thinkingBudget:0};
      if(model===MODEL_PRO)gc.thinkingConfig={thinkingBudget:2048};
      const resp=await fetch(url,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts:[{text:userPrompt}]}],systemInstruction:{parts:[{text:systemPrompt}]},generationConfig:gc})});
      if(resp.status===429&&attempt<retries){await sleep((attempt+1)*3000);continue;}
      if(!resp.ok){const err=await resp.text();throw new Error(`Vertex ${model} ${resp.status}: ${err.substring(0,300)}`);}
      const result=await resp.json();
      const parts=result.candidates?.[0]?.content?.parts||[];
      for(const p of parts){if(p.text&&!p.thought)return p.text;}
      const tp=parts.filter((p:{text?:string})=>p.text);
      return tp.length>0?tp[tp.length-1].text:"";
    }catch(e){if(attempt<retries&&e instanceof Error&&e.message.includes("429")){await sleep((attempt+1)*3000);continue;}throw e;}
  }
  throw new Error("All attempts failed");
}

// Three-tier classifier: KNOWN (MV) / SIMPLE (Flash) / COMPLEX (Pro)
async function classifyQuery(q:string):Promise<{type:"KNOWN"|"SIMPLE"|"COMPLEX";mvKey?:string;filter?:string}> {
  const prompt=`Classify this database query into exactly one category:

KNOWN:<key> — matches a pre-computed materialized view (use filter if needed)
SIMPLE — straightforward single-table query or simple count/list (e.g. "how many students", "list faculty", "total count")
COMPLEX — requires multi-table JOINs, aggregations with HAVING, subqueries, grade calculations, marks analysis, or cross-domain analysis

Views:
${MV_LIST}

Query: "${q}"

Examples:
- "attendance by department" => KNOWN:attendance_dept
- "students below 50% attendance" => KNOWN:attendance_student|filter:attendance_pct < 50
- "faculty load in ECE" => KNOWN:faculty_workload|filter:department = 'ECE'
- "how many students?" => SIMPLE
- "total faculty count" => SIMPLE
- "pending leave requests" => SIMPLE
- "students who got F grade" => COMPLEX
- "average marks in mid-terms by department" => COMPLEX
- "highest package in placements" => COMPLEX
- "CGPA above 9" => COMPLEX
- "department-wise placement stats" => COMPLEX
- "complete overview of CSE" => COMPLEX

Respond ONLY: KNOWN:<key>, KNOWN:<key>|filter:<condition>, SIMPLE, or COMPLEX`;
  const result=(await callVertexAI(MODEL_CLASSIFIER,"Query complexity classifier. Respond with exactly one of: KNOWN:<key>, KNOWN:<key>|filter:<condition>, SIMPLE, or COMPLEX.",prompt,0.0,100)).trim();
  if(result.startsWith("KNOWN:")){
    const parts=result.replace("KNOWN:","").split("|filter:");
    const key=parts[0].trim();
    const filter=parts[1]?.trim();
    if(MV_REGISTRY[key])return {type:"KNOWN",mvKey:key,filter};
  }
  if(result==="SIMPLE")return {type:"SIMPLE"};
  return {type:"COMPLEX"};
}

function extractSQL(raw:string):string {
  let sql=raw.replace(/^```(?:sql)?\s*/i,"").replace(/\s*```$/i,"").replace(/;\s*$/,"").trim();
  const m=sql.match(/\b(SELECT\s|WITH\s)/i);
  if(m&&m.index&&m.index>0)sql=sql.substring(m.index);
  const lines=sql.split('\n'),out:string[]=[];
  let inQ=false;
  for(const l of lines){const t=l.trim();if(!inQ&&/^(SELECT|WITH)\b/i.test(t))inQ=true;if(inQ){if(/^(This|Note|The above|Here|I |\*\*|--\s*Note)/.test(t)&&out.length>0)break;out.push(l);}}
  return out.length>0?out.join('\n').replace(/;\s*$/,'').trim():sql;
}
function validateSQL(sql:string):boolean {
  const u=sql.toUpperCase().trim();
  if(!u.startsWith("SELECT")&&!u.startsWith("WITH"))return false;
  return !/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b/.test(u);
}
async function generateSQL(q:string,model:string,errorCtx?:string):Promise<string>{
  const up=errorCtx?`Previous SQL failed: ${errorCtx}\nGenerate CORRECTED PostgreSQL SELECT for: ${q}\nReturn ONLY raw SQL.`:`Generate a PostgreSQL SELECT query for: ${q}`;
  return extractSQL(await callVertexAI(model,SCHEMA_CONTEXT,up,0.1,2048));
}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response(null,{headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"}});
  const H={"Access-Control-Allow-Origin":"*","Content-Type":"application/json"};
  try{
    const {message,college_id}=await req.json();
    if(!message)return new Response(JSON.stringify({error:"Message required"}),{status:400,headers:H});
    const t0=Date.now();
    const classification=await classifyQuery(message);
    const t1=Date.now();
    let rawData:Record<string,unknown>[],source:string;

    if(classification.type==="KNOWN"&&classification.mvKey){
      // === MV PATH ===
      const mv=MV_REGISTRY[classification.mvKey];
      const adminClient=createClient(SUPABASE_URL,SUPABASE_SERVICE_KEY);
      let query=adminClient.from(mv.view).select("*");
      if(college_id)query=query.eq("college_id",college_id);
      if(classification.filter){
        const filters=classification.filter.split(/\s+AND\s+/i);
        for(const f of filters){
          const match=f.trim().match(/^(\w+)\s*(=|<|>|<=|>=|!=|ILIKE)\s*(.+)$/i);
          if(match){
            const [,col,op,val]=match;
            const v=val.replace(/^'/,"").replace(/'$/,"").trim();
            const opL=op.toUpperCase();
            if(opL==="=")query=query.eq(col,v);
            else if(opL==="<")query=query.lt(col,parseFloat(v));
            else if(opL===">")query=query.gt(col,parseFloat(v));
            else if(opL==="<=")query=query.lte(col,parseFloat(v));
            else if(opL===">=")query=query.gte(col,parseFloat(v));
            else if(opL==="!=")query=query.neq(col,v);
            else if(opL==="ILIKE")query=query.ilike(col,v);
          }
        }
      }
      const {data:mvData,error:mvError}=await query.limit(500);
      if(mvError)throw new Error(`MV query failed: ${mvError.message}`);
      rawData=mvData||[];source=`mv:${classification.mvKey}`;

    } else {
      // === SIMPLE (Flash) or COMPLEX (Pro direct) ===
      const model = classification.type==="COMPLEX" ? MODEL_PRO : MODEL_FLASH;
      console.log(`Routing "${message.substring(0,60)}" => ${classification.type} => ${model}`);
      let sql = await generateSQL(message, model);
      if(!sql||!validateSQL(sql)){
        // Fallback: if primary model fails validation, try the other
        const fallback = model===MODEL_PRO ? MODEL_FLASH : MODEL_PRO;
        sql = await generateSQL(message, fallback);
        if(!validateSQL(sql))throw new Error("SQL validation failed on both models");
      }
      const adminClient=createClient(SUPABASE_URL,SUPABASE_SERVICE_KEY);
      const {data:d1,error:e1}=await adminClient.rpc("insights_execute_safe",{sql_query:sql,p_college_id:college_id||''});
      if(e1){
        // Self-heal: use Pro to repair (or Flash if Pro was primary)
        const repairModel = model===MODEL_PRO ? MODEL_PRO : MODEL_PRO; // always Pro for repair
        console.log(`${model} SQL failed: ${e1.message}, repairing with Pro`);
        const repaired=await generateSQL(message,repairModel,`${e1.message}\nFailing SQL: ${sql}`);
        if(!validateSQL(repaired))throw new Error(`Repair failed: ${e1.message}`);
        const {data:d2,error:e2}=await adminClient.rpc("insights_execute_safe",{sql_query:repaired,p_college_id:college_id||''});
        if(e2)throw new Error(`Query failed after repair: ${e2.message}`);
        rawData=d2||[];source=`${classification.type.toLowerCase()}:${model===MODEL_PRO?'pro':'flash'}-repaired`;
      } else {rawData=d1||[];source=`${classification.type.toLowerCase()}:${model===MODEL_PRO?'pro':'flash'}`;}
    }

    const sanitized=sanitizeResults(rawData);
    const t2=Date.now();

    // Summary
    let summary="",chartSuggestion:string|null=null;
    try{
      const sample=sanitized.data.slice(0,8);
      const sp=`Question: ${message}\nColumns: ${sanitized.columns.join(", ")}\nRows: ${sanitized.data.length}\nSample: ${JSON.stringify(sample)}\nRespond JSON: {"summary":"1-2 sentence insight","chart_suggestion":"bar_chart" or "pie_chart" or "line_chart" or null}`;
      const raw=await callVertexAI(MODEL_CLASSIFIER,"Summarize data for college admin. JSON only.",sp,0.2,256,1);
      const parsed=JSON.parse(raw.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/i,"").trim());
      summary=parsed.summary||"";chartSuggestion=parsed.chart_suggestion||null;
    }catch{}

    return new Response(JSON.stringify({columns:sanitized.columns,data:sanitized.data,row_count:sanitized.data.length,summary,chart_suggestion:chartSuggestion,source,timing:{classify_ms:t1-t0,query_ms:t2-t1,total_ms:Date.now()-t0}}),{status:200,headers:H});
  }catch(err:unknown){
    const msg=err instanceof Error?err.message:String(err);
    console.error("insights-query error:",msg);
    return new Response(JSON.stringify({error:msg}),{status:500,headers:H});
  }
});
