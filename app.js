// 5-Minute Multifamily Analyzer logic

// ---- Target Profiles ----
function loadProfiles(){
  const raw = localStorage.getItem('fiveMinMF_profiles');
  let profiles = [];
  try{ profiles = raw ? JSON.parse(raw) : []; }catch(e){ profiles = []; }
  return profiles;
}
function saveProfiles(list){
  localStorage.setItem('fiveMinMF_profiles', JSON.stringify(list));
}
function refreshProfileSelect(){
  const sel = $('profileSelect');
  const profiles = loadProfiles();
  sel.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '— Select profile —';
  sel.appendChild(placeholder);
  profiles.forEach(p=>{
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = p.name;
    opt.dataset.cap = p.cap;
    opt.dataset.coc = p.coc;
    opt.dataset.dscr = p.dscr;
    sel.appendChild(opt);
  });
}
function handleSaveProfile(){
  const name = $('profileName').value.trim();
  if(!name){ alert('Give the profile a name.'); return; }
  const cap = +$('capTarget').value;
  const coc = +$('cocTarget').value;
  const dscr = +$('dscrTarget').value;
  let profiles = loadProfiles();
  const idx = profiles.findIndex(p=>p.name.toLowerCase()===name.toLowerCase());
  const entry = {name, cap, coc, dscr};
  if(idx>=0){ profiles[idx] = entry; } else { profiles.push(entry); }
  saveProfiles(profiles);
  refreshProfileSelect();
  $('profileSelect').value = name;
  alert('Profile saved.');
}
function handleDeleteProfile(){
  const sel = $('profileSelect');
  const name = sel.value;
  if(!name){ alert('Pick a profile to delete.'); return; }
  let profiles = loadProfiles();
  profiles = profiles.filter(p=>p.name!==name);
  saveProfiles(profiles);
  refreshProfileSelect();
  sel.value='';
}
function handleLoadProfile(){
  const sel = $('profileSelect');
  const opt = sel.selectedOptions[0];
  if(!opt || !opt.dataset.cap){ return; }
  $('capTarget').value = opt.dataset.cap;
  $('cocTarget').value = opt.dataset.coc;
  $('dscrTarget').value = opt.dataset.dscr;
  analyze();
}
function attachProfileHandlers(){
  const saveBtn = $('saveProfile');
  const delBtn = $('deleteProfile');
  const sel = $('profileSelect');
  if(saveBtn) saveBtn.addEventListener('click', handleSaveProfile);
  if(delBtn) delBtn.addEventListener('click', handleDeleteProfile);
  if(sel) sel.addEventListener('change', handleLoadProfile);
  document.querySelectorAll('.preset').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $('capTarget').value = btn.dataset.cap;
      $('cocTarget').value = btn.dataset.coc;
      $('dscrTarget').value = btn.dataset.dscr;
      analyze();
    });
  });
  refreshProfileSelect();
}

const $ = (id) => document.getElementById(id);

function fmt(n, digits=0){
  if (isNaN(n)) return '—';
  return n.toLocaleString(undefined, {maximumFractionDigits: digits, minimumFractionDigits: digits});
}
function money(n){ return '$' + fmt(n, 0); }
function pct(n, d=1){ return fmt(n, d) + '%'; }

function payment(rate, nper, pv){
  // Monthly payment for amortizing loan (rate in annual %, nper in months)
  const r = rate/100/12;
  if (r === 0) return pv / nper;
  return (pv * r) / (1 - Math.pow(1 + r, -nper));
}

function analyze(){
  // Inputs
  const units = +$('units').value;
  const avgRent = +$('avgRent').value;
  const otherIncMo = +$('otherInc').value;
  const occ = +$('occ').value/100;
  const price = +$('price').value;
  const acqPct = +$('acqPct').value/100;
  const initialCapex = +$('initialCapex').value;

  const usePerDoor = $('expMode').checked;
  const expRatio = +$('expRatio').value/100;
  const expPerDoor = +$('expPerDoor').value;

  const ltv = +$('ltv').value/100;
  const rate = +$('rate').value;
  const amort = +$('amort').value;
  const ioYears = +$('ioYears').value;

  const capTarget = +$('capTarget').value/100;
  const cocTarget = +$('cocTarget').value/100;
  const dscrTarget = +$('dscrTarget').value;

  // Income
  const gpr = units * avgRent * 12; // gross potential rent
  const egi = (units * avgRent * 12 * occ) + (otherIncMo * 12); // simple economic occupancy
  // Expenses
  const opex = usePerDoor ? (units * expPerDoor) : (egi * expRatio);
  const noi = egi - opex;

  // Debt
  const loanAmt = price * ltv;
  const acqCosts = price * acqPct;
  const cashIn = (price - loanAmt) + acqCosts + initialCapex;
  const piMonthly = payment(rate, amort*12, loanAmt);
  const annualPI = piMonthly * 12;
  const dscr = annualPI === 0 ? NaN : (noi / annualPI);

  // CoC (use full P&I; note IO helps cashflow short-term)
  const annualCashFlow = noi - annualPI;
  const coc = cashIn <= 0 ? NaN : (annualCashFlow / cashIn);

  // Cap
  const cap = price === 0 ? NaN : (noi / price * 100);

  // Break-even occupancy
  const gpi = gpr + (otherIncMo * 12);
  const beOcc = gpi === 0 ? NaN : ((opex + annualPI) / gpi * 100);

  // Update UI
  $('gprVal').textContent = money(gpr);
  $('egiVal').textContent = money(egi);
  $('opexVal').textContent = money(opex);
  $('noiVal').textContent = money(noi);
  $('capVal').textContent = isNaN(cap) ? '—' : pct(cap, 2);
  $('debtVal').textContent = money(loanAmt);
  $('piVal').textContent = money(annualPI);
  $('dscrVal').textContent = isNaN(dscr) ? '—' : fmt(dscr, 2);
  $('cocVal').textContent = isNaN(coc) ? '—' : pct(coc*100, 2);
  $('beOccVal').textContent = isNaN(beOcc) ? '—' : pct(beOcc, 1);
  $('cashInVal').textContent = money(cashIn);

  // Badges
  setBadge('capBadge', cap/100 >= capTarget);
  setBadge('cocBadge', coc >= cocTarget);
  setBadge('dscrBadge', dscr >= dscrTarget);

  // Price guidance
  const dscrGuide = +$('dscrGuide').value;
  const capGuide = +$('capGuide').value/100;
  // For DSCR guide: find price that yields DSCR target given loan terms
  // We approximate by iterating on price; NOI scales with price? No, NOI is independent of price in this quick screen.
  // So to hit DSCR target, we need loan small enough that NOI / debt >= target.
  // Given loan = price*ltv and annualPI depends on loan, we'll binary search price.
  function dscrAtPrice(p){
    const loan = p * ltv;
    const pi = payment(rate, amort*12, loan)*12;
    return (pi === 0) ? Infinity : (noi / pi);
  }
  let lo=0, hi = price*2 || 1_000_000, best=NaN;
  for(let i=0;i<40;i++){
    const mid = (lo+hi)/2;
    const d = dscrAtPrice(mid);
    if (d >= dscrGuide){ // can afford this price
      best = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  $('maxPriceDscr').textContent = isNaN(best) ? '—' : money(best);

  // For Cap guide: price at which NOI / price = capGuide => price = NOI / capGuide
  const maxPriceCap = capGuide > 0 ? (noi / capGuide) : NaN;
  $('maxPriceCap').textContent = isNaN(maxPriceCap) ? '—' : money(maxPriceCap);
}

function setBadge(id, pass){
  const el = $(id);
  el.classList.remove('pass','fail');
  el.classList.add(pass ? 'pass' : 'fail');
}

function resetForm(){
  document.querySelectorAll('input').forEach(inp=>{
    inp.value = inp.defaultValue;
  });
  $('expMode').checked = false;
  toggleExpenseMode();
  analyze();
}

function toggleExpenseMode(){
  const checked = $('expMode').checked;
  $('expModeLabel').textContent = checked ? 'Per Door ($/yr)' : 'Expense Ratio';
  $('expRatioRow').classList.toggle('hidden', checked);
  $('expPerDoorRow').classList.toggle('hidden', !checked);
}

function saveState(){
  const data = {};
  document.querySelectorAll('input').forEach(inp=> data[inp.id]=inp.value);
  localStorage.setItem('fiveMinMF', JSON.stringify(data));
}

function loadState(){
  const raw = localStorage.getItem('fiveMinMF');
  if (!raw) return;
  try{
    const data = JSON.parse(raw);
    Object.entries(data).forEach(([k,v])=>{
      const el = $(k);
      if (el) el.value = v;
    });
    toggleExpenseMode();
  }catch(e){}
}

function shareLink(){
  const params = new URLSearchParams();
  document.querySelectorAll('input').forEach(inp=> params.set(inp.id, inp.value));
  const url = location.origin + location.pathname + '?' + params.toString();
  if (navigator.share){
    navigator.share({title:'5-Min Multifamily Analyzer', url}).catch(()=>{});
  } else {
    prompt('Copy this link:', url);
  }
}

function loadFromUrl(){
  const q = new URLSearchParams(location.search);
  if (![...q.keys()].length) return;
  q.forEach((v,k)=>{
    const el = $(k);
    if (el) el.value = v;
  });
  toggleExpenseMode();
}

document.addEventListener('DOMContentLoaded', ()=>{
  attachProfileHandlers();
  $('expMode').addEventListener('change', toggleExpenseMode);
  $('analyze').addEventListener('click', analyze);
  $('reset').addEventListener('click', resetForm);
  $('saveState').addEventListener('click', ()=>{ saveState(); alert('Saved on this device.'); });
  $('clearState').addEventListener('click', ()=>{ localStorage.removeItem('fiveMinMF'); alert('Cleared.'); });
  $('shareLink').addEventListener('click', shareLink);

  loadFromUrl();
  loadState();
  analyze();
});
