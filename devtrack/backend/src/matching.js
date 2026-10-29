'use strict';

// Explainable, deterministic baseline matcher. This is not a trained AI model.
function normalizeName(value = '') {
  return String(value)
    .normalize('NFKC')
    .toLocaleLowerCase('und')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[।॥.,'’"`~!@#$%^&*()_+={}\[\]:;<>?/\\|\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

function similarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  return Math.max(0, 1 - levenshtein(a, b) / Math.max(a.length, b.length));
}

function distanceKm(a, b) {
  if (![a.latitude, a.longitude, b.latitude, b.longitude].every(v => Number.isFinite(Number(v)))) return null;
  const rad = n => Number(n) * Math.PI / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function scoreMatch(source, target) {
  const evidence = [];
  let score = 0;
  const nameA = normalizeName(source.original_name || source.village || '');
  const nameB = normalizeName(target.original_name || target.village || '');
  const nameSim = similarity(nameA, nameB);
  if (nameA && nameB && nameA === nameB) { score += 55; evidence.push({ factor: 'normalized_name_exact', points: 55, detail: 'Names match after Unicode and punctuation normalization.' }); }
  else if (nameSim >= 0.72) { const pts = Math.round(nameSim * 45); score += pts; evidence.push({ factor: 'name_similarity', points: pts, detail: `Normalized name similarity is ${Math.round(nameSim * 100)}%.` }); }
  else evidence.push({ factor: 'name_similarity', points: 0, detail: `Names differ; similarity is ${Math.round(nameSim * 100)}%.` });

  const sameDistrict = source.district && target.district && normalizeName(source.district) === normalizeName(target.district);
  if (sameDistrict) { score += 15; evidence.push({ factor: 'district_match', points: 15, detail: 'District names match after normalization.' }); }
  const sameState = source.state && target.state && normalizeName(source.state) === normalizeName(target.state);
  if (sameState) { score += 10; evidence.push({ factor: 'state_match', points: 10, detail: 'State names match after normalization.' }); }
  const sameExternalId = source.external_id && target.external_id && String(source.external_id).trim() === String(target.external_id).trim();
  if (sameExternalId) { score += 15; evidence.push({ factor: 'external_id_match', points: 15, detail: 'External IDs are identical.' }); }
  const d = distanceKm(source, target);
  if (d !== null) {
    if (d <= 0.5) { score += 20; evidence.push({ factor: 'coordinate_proximity', points: 20, detail: `Coordinates are ${d.toFixed(2)} km apart.` }); }
    else if (d <= 5) { score += 12; evidence.push({ factor: 'coordinate_proximity', points: 12, detail: `Coordinates are ${d.toFixed(2)} km apart.` }); }
    else if (d <= 20) { score += 5; evidence.push({ factor: 'coordinate_proximity', points: 5, detail: `Coordinates are ${d.toFixed(1)} km apart.` }); }
    else evidence.push({ factor: 'coordinate_proximity', points: 0, detail: `Coordinates are ${d.toFixed(1)} km apart; not considered nearby.` });
  }
  score = Math.min(100, score);
  // Never claim high confidence from name alone; different scripts need transliteration/aliases.
  let status = score >= 80 ? 'high_confidence' : score >= 55 ? 'medium_confidence' : 'needs_review';
  if (nameA && nameB && nameA !== nameB && !sameExternalId && d === null && nameSim < 0.9) status = 'needs_review';
  return { confidence: score, status, evidence, distance_km: d === null ? null : Number(d.toFixed(3)), algorithm: 'geocode-setu-baseline-v1' };
}

module.exports = { normalizeName, levenshtein, similarity, distanceKm, scoreMatch };
