'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool } = require('pg');
const { normalizeName, scoreMatch } = require('./matching');

const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({ origin(origin, cb) { if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true); return cb(new Error('Origin not allowed by CORS')); } }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024, files: 1 } });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Copy .env.example to .env and configure PostgreSQL.');
  process.exit(1);
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false });
pool.on('error', err => console.error('Unexpected PostgreSQL pool error:', err.message));

const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const validUUID = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
const asText = v => v == null ? null : String(v).trim() || null;
const asNumber = v => v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v);

async function audit(client, actor, action, entityType, entityId, details = {}) {
  await client.query('INSERT INTO audit_logs(actor,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)', [actor || 'system', action, entityType, entityId || null, JSON.stringify(details)]);
}

function parseCSV(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); if (row.some(v => v.trim())) rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); if (row.some(v => v.trim())) rows.push(row); }
  if (rows.length < 2) throw Object.assign(new Error('CSV must contain a header row and at least one data row.'), { status: 400 });
  const headers = rows.shift().map(h => h.trim().toLowerCase().replace(/[\s-]+/g, '_'));
  return rows.map(values => Object.fromEntries(headers.map((h, i) => [h, (values[i] || '').trim()])));
}
function pick(row, names) { for (const n of names) if (row[n] != null && row[n] !== '') return row[n]; return null; }
function mapRow(row) {
  const name = pick(row, ['original_name','village_name','village','location_name','name','place_name']);
  if (!name) return null;
  return { external_id: asText(pick(row, ['external_id','location_id','village_id','id','plot_id'])), original_name: String(name).trim(), script_language: asText(pick(row, ['script_language','language','lang'])), state: asText(pick(row, ['state','state_name'])), district: asText(pick(row, ['district','district_name'])), village: asText(pick(row, ['village','village_name'])), plot_id: asText(pick(row, ['plot_id','survey_no','khasra_no'])), latitude: asNumber(pick(row, ['latitude','lat'])), longitude: asNumber(pick(row, ['longitude','lon','lng'])), attributes: row };
}

app.get('/api/health', asyncRoute(async (_req, res) => {
  const result = await pool.query('SELECT NOW() AS database_time');
  res.json({ ok: true, service: 'Geocode Setu API', database: 'connected', database_time: result.rows[0].database_time, version: '1.0.0' });
}));

app.get('/api/dashboard', asyncRoute(async (_req, res) => {
  const [places, datasets, matches, statuses] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS total FROM places'),
    pool.query('SELECT COUNT(*)::int AS total FROM datasets'),
    pool.query('SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status=\'approved\')::int AS approved, COUNT(*) FILTER (WHERE status=\'needs_review\')::int AS needs_review, ROUND(AVG(confidence))::int AS average_confidence FROM matches'),
    pool.query('SELECT status, COUNT(*)::int AS count FROM matches GROUP BY status ORDER BY status')
  ]);
  res.json({ places: places.rows[0].total, datasets: datasets.rows[0].total, matches: matches.rows[0], by_status: statuses.rows });
}));

app.get('/api/datasets', asyncRoute(async (_req, res) => {
  const r = await pool.query(`SELECT d.*, COUNT(p.id)::int AS record_count FROM datasets d LEFT JOIN places p ON p.dataset_id=d.id GROUP BY d.id ORDER BY d.imported_at DESC`);
  res.json({ data: r.rows });
}));

app.post('/api/datasets', asyncRoute(async (req, res) => {
  const { name, dataset_type = 'other', source_organization = null, source_url = null, metadata = {} } = req.body || {};
  if (!String(name || '').trim()) return res.status(400).json({ error: 'Dataset name is required.' });
  const r = await pool.query('INSERT INTO datasets(name,dataset_type,source_organization,source_url,metadata) VALUES($1,$2,$3,$4,$5) RETURNING *', [String(name).trim(), dataset_type, source_organization, source_url, JSON.stringify(metadata)]);
  await pool.query('INSERT INTO audit_logs(actor,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)', [req.header('x-actor') || 'system', 'dataset_created', 'dataset', r.rows[0].id, JSON.stringify({ name })]);
  res.status(201).json({ data: r.rows[0] });
}));

app.post('/api/datasets/:id/upload-csv', upload.single('file'), asyncRoute(async (req, res) => {
  if (!validUUID(req.params.id)) return res.status(400).json({ error: 'Invalid dataset ID.' });
  if (!req.file) return res.status(400).json({ error: 'Upload a CSV file using form field "file".' });
  const dataset = await pool.query('SELECT id FROM datasets WHERE id=$1', [req.params.id]);
  if (!dataset.rowCount) return res.status(404).json({ error: 'Dataset not found.' });
  const parsed = parseCSV(req.file.buffer.toString('utf8').replace(/^\uFEFF/, ''));
  const rows = parsed.map(mapRow);
  const invalid = rows.filter(r => !r);
  const client = await pool.connect(); let inserted = 0;
  try {
    await client.query('BEGIN');
    for (let i = 0; i < rows.length; i++) {
      const p = rows[i]; if (!p) continue;
      await client.query(`INSERT INTO places(dataset_id,external_id,original_name,normalized_name,script_language,state,district,village,plot_id,latitude,longitude,attributes,source_row_number)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT(dataset_id,external_id,source_row_number) DO UPDATE SET original_name=EXCLUDED.original_name, normalized_name=EXCLUDED.normalized_name, attributes=EXCLUDED.attributes`,
        [req.params.id,p.external_id,p.original_name,normalizeName(p.original_name),p.script_language,p.state,p.district,p.village,p.plot_id,p.latitude,p.longitude,JSON.stringify(p.attributes),i+2]);
      inserted++;
    }
    await audit(client, req.header('x-actor') || 'system', 'csv_imported', 'dataset', req.params.id, { filename: req.file.originalname, rows_seen: rows.length, records_imported: inserted, invalid_rows: invalid.length });
    await client.query('COMMIT');
    res.status(201).json({ message: 'CSV import complete.', rows_seen: rows.length, records_imported: inserted, skipped_rows: invalid.length, note: 'Importing records does not automatically approve any match.' });
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}));

app.get('/api/places', asyncRoute(async (req, res) => {
  const { q, dataset_id, state, district, limit = '100', offset = '0' } = req.query;
  const values = []; const where = [];
  if (q) { values.push(`%${String(q).trim()}%`); where.push(`(p.original_name ILIKE $${values.length} OR p.normalized_name ILIKE $${values.length} OR COALESCE(p.external_id,'') ILIKE $${values.length} OR COALESCE(p.village,'') ILIKE $${values.length})`); }
  if (dataset_id) { if (!validUUID(dataset_id)) return res.status(400).json({ error: 'Invalid dataset_id.' }); values.push(dataset_id); where.push(`p.dataset_id=$${values.length}`); }
  if (state) { values.push(String(state)); where.push(`p.state ILIKE $${values.length}`); }
  if (district) { values.push(String(district)); where.push(`p.district ILIKE $${values.length}`); }
  const safeLimit = Math.min(500, Math.max(1, Number.parseInt(limit, 10) || 100));
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);
  values.push(safeLimit, safeOffset);
  const sql = `SELECT p.*, d.name AS dataset_name, d.dataset_type FROM places p LEFT JOIN datasets d ON d.id=p.dataset_id ${where.length ? 'WHERE '+where.join(' AND ') : ''} ORDER BY p.created_at DESC LIMIT $${values.length-1} OFFSET $${values.length}`;
  const r = await pool.query(sql, values);
  res.json({ data: r.rows, pagination: { limit: safeLimit, offset: safeOffset, returned: r.rowCount } });
}));

app.get('/api/places/:id', asyncRoute(async (req, res) => {
  if (!validUUID(req.params.id)) return res.status(400).json({ error: 'Invalid place ID.' });
  const r = await pool.query('SELECT p.*, d.name AS dataset_name, d.dataset_type, d.source_organization, d.source_url FROM places p LEFT JOIN datasets d ON d.id=p.dataset_id WHERE p.id=$1', [req.params.id]);
  if (!r.rowCount) return res.status(404).json({ error: 'Place not found.' });
  const logs = await pool.query('SELECT * FROM audit_logs WHERE entity_type IN (\'place\',\'match\') AND (entity_id=$1 OR details->>\'place_id\'=$1) ORDER BY created_at DESC LIMIT 50', [req.params.id]);
  res.json({ data: r.rows[0], provenance: logs.rows });
}));

app.post('/api/matching/suggest', asyncRoute(async (req, res) => {
  const { source_place_id, target_dataset_id, limit = 10 } = req.body || {};
  if (!validUUID(source_place_id)) return res.status(400).json({ error: 'source_place_id must be a valid UUID.' });
  if (target_dataset_id && !validUUID(target_dataset_id)) return res.status(400).json({ error: 'target_dataset_id must be a valid UUID.' });
  const sourceResult = await pool.query('SELECT * FROM places WHERE id=$1', [source_place_id]);
  if (!sourceResult.rowCount) return res.status(404).json({ error: 'Source place not found.' });
  const params = [source_place_id]; let clause = 'id <> $1';
  if (target_dataset_id) { params.push(target_dataset_id); clause += ` AND dataset_id=$${params.length}`; }
  else { params.push(sourceResult.rows[0].dataset_id); clause += ` AND dataset_id IS DISTINCT FROM $${params.length}`; }
  const candidates = await pool.query(`SELECT * FROM places WHERE ${clause} ORDER BY CASE WHEN normalized_name=$${params.length+1} THEN 0 ELSE 1 END, normalized_name LIMIT 1000`, [...params, normalizeName(sourceResult.rows[0].original_name)]);
  const suggestions = candidates.rows.map(target => ({ target, ...scoreMatch(sourceResult.rows[0], target) })).sort((a,b) => b.confidence-a.confidence).slice(0, Math.min(50, Math.max(1, Number.parseInt(limit,10)||10)));
  res.json({ source: sourceResult.rows[0], suggestions, note: 'Scores are heuristic evidence scores, not calibrated probabilities. Review before treating a match as confirmed.' });
}));

app.post('/api/matches', asyncRoute(async (req, res) => {
  const { source_place_id, target_place_id } = req.body || {};
  if (!validUUID(source_place_id) || !validUUID(target_place_id) || source_place_id === target_place_id) return res.status(400).json({ error: 'Provide two different valid place UUIDs.' });
  const pair = await pool.query('SELECT * FROM places WHERE id = ANY($1::uuid[])', [[source_place_id,target_place_id]]);
  if (pair.rowCount !== 2) return res.status(404).json({ error: 'One or both places were not found.' });
  const source = pair.rows.find(p=>p.id===source_place_id), target = pair.rows.find(p=>p.id===target_place_id);
  const scored = scoreMatch(source,target);
  const r = await pool.query(`INSERT INTO matches(source_place_id,target_place_id,confidence,status,evidence) VALUES($1,$2,$3,$4,$5)
    ON CONFLICT(source_place_id,target_place_id) DO UPDATE SET confidence=EXCLUDED.confidence,status=EXCLUDED.status,evidence=EXCLUDED.evidence,updated_at=NOW() RETURNING *`, [source_place_id,target_place_id,scored.confidence,scored.status,JSON.stringify(scored.evidence)]);
  await pool.query('INSERT INTO audit_logs(actor,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)', [req.header('x-actor')||'system','match_suggested','match',r.rows[0].id,JSON.stringify({ source_place_id,target_place_id,confidence:scored.confidence,algorithm:scored.algorithm })]);
  res.status(201).json({ data: r.rows[0], scoring: scored });
}));

app.get('/api/matches', asyncRoute(async (req, res) => {
  const values=[]; const where=[];
  if (req.query.status) { values.push(req.query.status); where.push(`m.status=$${values.length}`); }
  if (req.query.min_confidence != null) { const n=Number(req.query.min_confidence); if (!Number.isInteger(n)||n<0||n>100) return res.status(400).json({error:'min_confidence must be 0-100'}); values.push(n); where.push(`m.confidence >= $${values.length}`); }
  if (req.query.q) { values.push(`%${req.query.q}%`); where.push(`(s.original_name ILIKE $${values.length} OR t.original_name ILIKE $${values.length})`); }
  values.push(Math.min(500,Math.max(1,Number.parseInt(req.query.limit,10)||100)));
  const r=await pool.query(`SELECT m.*, s.original_name AS source_name, s.external_id AS source_external_id, sd.name AS source_dataset, t.original_name AS target_name, t.external_id AS target_external_id, td.name AS target_dataset FROM matches m JOIN places s ON s.id=m.source_place_id LEFT JOIN datasets sd ON sd.id=s.dataset_id JOIN places t ON t.id=m.target_place_id LEFT JOIN datasets td ON td.id=t.dataset_id ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY m.updated_at DESC LIMIT $${values.length}`,values);
  res.json({data:r.rows});
}));

app.patch('/api/matches/:id/review', asyncRoute(async (req,res)=>{
  if(!validUUID(req.params.id)) return res.status(400).json({error:'Invalid match ID.'});
  const {decision,reviewer, note} = req.body||{};
  const map={approve:'approved',reject:'rejected',needs_review:'needs_review'};
  if(!map[decision]) return res.status(400).json({error:'decision must be approve, reject, or needs_review.'});
  const actor=String(reviewer||req.header('x-actor')||'reviewer').slice(0,200);
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const updated=await client.query(`UPDATE matches SET status=$1,reviewed_by=$2,review_note=$3,reviewed_at=NOW(),updated_at=NOW() WHERE id=$4 RETURNING *`,[map[decision],actor,asText(note),req.params.id]);
    if(!updated.rowCount){await client.query('ROLLBACK');return res.status(404).json({error:'Match not found.'});}
    await audit(client,actor,`match_${decision}`,'match',req.params.id,{status:map[decision],note:asText(note),source_place_id:updated.rows[0].source_place_id,target_place_id:updated.rows[0].target_place_id});
    await client.query('COMMIT'); res.json({data:updated.rows[0]});
  } catch(e){await client.query('ROLLBACK');throw e;} finally{client.release();}
}));

app.get('/api/provenance', asyncRoute(async (req,res)=>{
  const values=[]; const where=[];
  if(req.query.entity_type){values.push(req.query.entity_type);where.push(`entity_type=$${values.length}`);}
  if(req.query.entity_id){if(!validUUID(req.query.entity_id))return res.status(400).json({error:'Invalid entity_id.'});values.push(req.query.entity_id);where.push(`entity_id=$${values.length}`);}
  values.push(Math.min(500,Math.max(1,Number.parseInt(req.query.limit,10)||100)));
  const r=await pool.query(`SELECT * FROM audit_logs ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY created_at DESC LIMIT $${values.length}`,values);
  res.json({data:r.rows});
}));

app.get('/api/export/matches.csv', asyncRoute(async (req,res)=>{
  const r=await pool.query(`SELECT m.id,m.confidence,m.status,m.evidence,m.reviewed_by,m.review_note,m.reviewed_at,m.created_at,s.original_name AS source_name,sd.name AS source_dataset,t.original_name AS target_name,td.name AS target_dataset FROM matches m JOIN places s ON s.id=m.source_place_id LEFT JOIN datasets sd ON sd.id=s.dataset_id JOIN places t ON t.id=m.target_place_id LEFT JOIN datasets td ON td.id=t.dataset_id ORDER BY m.created_at DESC`);
  const columns=['id','source_name','source_dataset','target_name','target_dataset','confidence','status','reviewed_by','review_note','reviewed_at','created_at','evidence'];
  const esc=v=>{const s=typeof v==='object'&&v!==null?JSON.stringify(v):String(v??'');return /[",\r\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;};
  const csv=[columns.join(','),...r.rows.map(row=>columns.map(c=>esc(row[c])).join(','))].join('\r\n');
  res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition','attachment; filename="geocode-setu-matches.csv"');res.send('\uFEFF'+csv);
}));

app.use((err,_req,res,_next)=>{
  if(err instanceof multer.MulterError) return res.status(400).json({error:err.code==='LIMIT_FILE_SIZE'?'File is too large.':err.message});
  const status=Number(err.status)||500;
  if(status>=500) console.error(err.stack||err);
  res.status(status).json({error:status>=500?'Internal server error. Check backend logs.':err.message});
});

async function start(){
  try { await pool.query('SELECT 1'); app.listen(port,()=>console.log(`Geocode Setu API listening on http://localhost:${port}`)); }
  catch(err){console.error('Could not connect to PostgreSQL:',err.message);process.exit(1);}
}
process.on('SIGINT',async()=>{await pool.end();process.exit(0)});
process.on('SIGTERM',async()=>{await pool.end();process.exit(0)});
start();
