const demoSites=[{"name": "NYC Financial District", "address": "180 Maiden Lane", "sqft": 18000, "has_driveway": true, "has_outdoor_space": true, "has_kitchen_area": true, "monthly_rent": 85000, "parking_spots": 0, "zoning_clear": true, "zip_code": "10038"}, {"name": "Miami Tropical Park", "address": "8000 SW 56th St", "sqft": 15000, "has_driveway": true, "has_outdoor_space": true, "has_kitchen_area": true, "monthly_rent": 28000, "parking_spots": 0, "zoning_clear": true, "zip_code": "33155"}, {"name": "Scottsdale", "address": "7001 N Scottsdale Rd", "sqft": 12000, "has_driveway": true, "has_outdoor_space": true, "has_kitchen_area": true, "monthly_rent": 22000, "parking_spots": 0, "zoning_clear": true, "zip_code": "85253"}, {"name": "San Francisco SOMA", "address": "500 Folsom St", "sqft": 14000, "has_driveway": true, "has_outdoor_space": true, "has_kitchen_area": false, "monthly_rent": 65000, "parking_spots": 0, "zoning_clear": true, "zip_code": "94105"}, {"name": "Brownsville TX", "address": "1200 E Price Rd", "sqft": 16000, "has_driveway": true, "has_outdoor_space": true, "has_kitchen_area": true, "monthly_rent": 12000, "parking_spots": 0, "zoning_clear": true, "zip_code": "78521"}, {"name": "Palm Beach", "address": "300 S County Rd", "sqft": 11000, "has_driveway": true, "has_outdoor_space": true, "has_kitchen_area": true, "monthly_rent": 35000, "parking_spots": 0, "zoning_clear": true, "zip_code": "33480"}, {"name": "Raleigh NC", "address": "4601 Six Forks Rd", "sqft": 13000, "has_driveway": true, "has_outdoor_space": true, "has_kitchen_area": true, "monthly_rent": 18000, "parking_spots": 0, "zoning_clear": true, "zip_code": "27609"}, {"name": "Orlando", "address": "7600 Dr Phillips Blvd", "sqft": 14000, "has_driveway": true, "has_outdoor_space": true, "has_kitchen_area": true, "monthly_rent": 20000, "parking_spots": 0, "zoning_clear": true, "zip_code": "32819"}, {"name": "Charlotte", "address": "4400 Sharon Rd", "sqft": 12500, "has_driveway": true, "has_outdoor_space": true, "has_kitchen_area": true, "monthly_rent": 19000, "parking_spots": 0, "zoning_clear": true, "zip_code": "28211"}, {"name": "Denver", "address": "1600 Glenarm Pl", "sqft": 11000, "has_driveway": false, "has_outdoor_space": true, "has_kitchen_area": true, "monthly_rent": 24000, "parking_spots": 0, "zoning_clear": true, "zip_code": "80202"}, {"name": "Detroit Warehouse", "address": "5000 Michigan Ave", "sqft": 25000, "has_driveway": false, "has_outdoor_space": false, "has_kitchen_area": false, "monthly_rent": 8000, "parking_spots": 0, "zoning_clear": true, "zip_code": "48210"}, {"name": "Rural Kansas", "address": "100 Main St", "sqft": 4000, "has_driveway": true, "has_outdoor_space": true, "has_kitchen_area": false, "monthly_rent": 2000, "parking_spots": 0, "zoning_clear": true, "zip_code": "67401"}, {"name": "Houston Galleria", "address": "5000 Westheimer Rd", "sqft": 16000, "has_driveway": true, "has_outdoor_space": true, "has_kitchen_area": true, "monthly_rent": 26000, "parking_spots": 0, "zoning_clear": true, "zip_code": "77056"}, {"name": "Dallas Uptown", "address": "2500 McKinney Ave", "sqft": 13000, "has_driveway": true, "has_outdoor_space": true, "has_kitchen_area": true, "monthly_rent": 21000, "parking_spots": 0, "zoning_clear": true, "zip_code": "75201"}, {"name": "Austin Mueller", "address": "1900 Aldrich St", "sqft": 14500, "has_driveway": true, "has_outdoor_space": true, "has_kitchen_area": true, "monthly_rent": 19000, "parking_spots": 0, "zoning_clear": true, "zip_code": "78723"}];
const storageKey='alpha-sites';
const {escapeHtml}=AlphaSiteData;
let siteStorage=null;
try{siteStorage=window.localStorage;}catch(error){}
const loadedSites=AlphaSiteData.loadSites(siteStorage,storageKey,demoSites);
let sites=loadedSites.sites;
let editingIndex=-1;
function showDataWarning(message){let warning=document.getElementById('data-warning');warning.textContent=message||'';warning.hidden=!message;}
function commitSites(nextSites){let result=AlphaSiteData.commitSites(siteStorage,storageKey,nextSites);if(!result.ok){showDataWarning(result.error);return false;}sites=result.sites;showDataWarning('');return true;}
if(loadedSites.warning)showDataWarning(loadedSites.warning);
function isStale(s){if(!s.date_added)return false;let days=Math.floor((Date.now()-new Date(s.date_added))/(1000*60*60*24));let status=s.status||'Sourced';if(status==='Sourced'&&days>7)return true;if(status==='Site Visit'&&days>14)return true;if(status==='LOI'&&days>21)return true;if(status==='Negotiation'&&days>30)return true;return false;}
// The original weights total 84 at zero rent. Keep ranks and tier cutoffs intact.
const MAX_SITE_SCORE = 84;
function scoreSite(s){let scores={};scores.sqft=Math.min(s.sqft/5250,1)*25;scores.driveway=s.has_driveway?15:0;scores.outdoor=s.has_outdoor_space?12:0;scores.kitchen=s.has_kitchen_area?12:0;scores.zoning=s.zoning_clear?8:0;scores.cost=Math.max(0,8-(s.monthly_rent/s.sqft-1)*4);let total=Object.values(scores).reduce((a,b)=>a+b,0);let weak=Object.entries(scores).filter(([k,v])=>v<5).map(([k])=>k);return{total:Math.min(total,MAX_SITE_SCORE),tier:total>=75?'GREEN':total>=50?'YELLOW':'RED',weak};}
function formatMoney(value){return (value<0?'−$':'$')+Math.abs(value).toLocaleString(undefined,{maximumFractionDigits:2});}
function costAnalysis(s){
  let rent=s.monthly_rent*12;
  let guides=Math.ceil(s.sqft/5000);
  let guideSalary=110000*guides;
  let headOfSchool=guides>=2?130000:0;
  let utilities=s.sqft*3;
  let insurance=15000;
  let marketing=25000;
  let food=s.sqft/50*1500;
  let totalCost=rent+guideSalary+headOfSchool+utilities+insurance+marketing+food;
  let tuition=15000;
  let capacity=Math.floor(s.sqft/50);
  let breakEven=Math.ceil(totalCost/tuition);
  return{rent,guides,guideSalary,headOfSchool,utilities,insurance,marketing,food,totalCost,tuition,capacity,breakEven,margin:capacity*tuition-totalCost};
}
function render(){
  let ranked=sites.map((s,i)=>({site:s,idx:i,...scoreSite(s)})).sort((a,b)=>b.total-a.total);
  let green=ranked.filter(r=>r.tier==='GREEN').length;
  let yellow=ranked.filter(r=>r.tier==='YELLOW').length;
  let red=ranked.filter(r=>r.tier==='RED').length;
  document.getElementById('summary').innerHTML=`<div class="stat-box"><div class="num">${ranked.length}</div><div class="lbl">Sites</div></div><div class="stat-box green"><div class="num">${green}</div><div class="lbl">✅ Green</div></div><div class="stat-box yellow"><div class="num">${yellow}</div><div class="lbl">⚠️ Yellow</div></div><div class="stat-box red"><div class="num">${red}</div><div class="lbl">❌ Red</div></div>`;
  let stages=['Sourced','Site Visit','LOI','Negotiation','Signed'];
  document.getElementById('funnel').innerHTML=stages.map(st=>{
    let count=sites.filter(s=>(s.status||'Sourced')===st).length;
    return`<div class="funnel-stage"><div class="count">${count}</div><div class="label">${st}</div></div>`;
  }).join('');
  let tierClass={GREEN:'go',YELLOW:'caution',RED:'nogo'};
  let tierIcon={GREEN:'✅',YELLOW:'⚠️',RED:'❌'};
  document.getElementById('grid').innerHTML=ranked.map((r,i)=>{
    let s=r.site,c=costAnalysis(s);
    return`<article class="card ${tierClass[r.tier]}${isStale(r.site)?' stale':''}" data-idx="${r.idx}">${isStale(r.site)?'<div class="stale-warning">⏰ Stale</div>':''}<div class="rank">#${i+1}</div><button class="edit-btn" aria-label="Edit ${escapeHtml(s.name)}" onclick="editSite(${r.idx})">✏️</button><h2>${escapeHtml(s.name)}</h2><p class="address">${escapeHtml(s.address)}${s.zip_code?' ('+escapeHtml(s.zip_code)+')':''}</p><div><span class="status-badge status-${(s.status||'Sourced').replace(' ','-')}">${escapeHtml(s.status||'Sourced')}</span><span class="days-badge">${s.date_added?Math.floor((Date.now()-new Date(s.date_added))/(1000*60*60*24))+' days in pipeline':'New'}</span></div><div class="${s.notes?'notes':'notes-empty'}" role="button" tabindex="0" aria-label="Edit notes for ${escapeHtml(s.name)}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}" onclick="event.stopPropagation();editSite(${r.idx});setTimeout(()=>document.getElementById('edit-notes').focus(),100)">${s.notes?escapeHtml(s.notes.substring(0,80))+(s.notes.length>80?'...':''):'+ Add notes'}</div><div class="stats"><div><span class="label">Sq Ft</span><span class="value">${s.sqft.toLocaleString()}</span></div><div><span class="label">Rent</span><span class="value">$${s.monthly_rent.toLocaleString()}/mo</span></div><div><span class="label">$/sqft</span><span class="value">$${(s.monthly_rent/s.sqft).toFixed(2)}</span></div></div><div class="cost"><span title="Annual costs: $${c.totalCost.toLocaleString()}">Break-even: ${c.breakEven} students</span><span>Capacity: ${c.capacity}</span><span class="${c.margin>0?'profit':'loss'}">${'Margin: '+formatMoney(c.margin)}</span></div><div class="score-summary"><div class="score">${r.total.toFixed(1)}<span>/${MAX_SITE_SCORE}</span></div><div class="score-bar"><div class="fill" style="width:${r.total/MAX_SITE_SCORE*100}%"></div></div></div><button class="detail-btn" onclick="showCostDetail(${r.idx})">📊 Cost Breakdown</button><div class="decision">${tierIcon[r.tier]} ${r.tier}</div><div class="weak">${r.weak.length?'Weak: '+r.weak.join(', '):'✓ OK'}</div></article>`;
  }).join('');
  if(document.getElementById('map').style.display==='block')updateMarkers();
  if(document.getElementById('kanban').style.display==='flex')renderKanban();
}
function addNewSite(){
  editingIndex=-1;
  editingDraft={name:'New Site',address:'',zip_code:null,sqft:10000,monthly_rent:15000,has_driveway:true,has_outdoor_space:true,has_kitchen_area:true,zoning_clear:true,parking_spots:0,status:'Sourced',date_added:new Date().toISOString(),notes:''};
  openSiteEditor(editingDraft);
}
let editingDraft=null;
function editSite(i){
  if(!Number.isInteger(i)||i<0||i>=sites.length)return;
  editingIndex=i;
  editingDraft={...sites[i]};
  openSiteEditor(editingDraft);
}
function openSiteEditor(s){
  ['name','address','sqft'].forEach(field=>document.getElementById('edit-'+field).value=s[field]);
  document.getElementById('edit-zip').value=s.zip_code||'';
  document.getElementById('edit-rent').value=s.monthly_rent;
  document.getElementById('edit-driveway').checked=s.has_driveway;
  document.getElementById('edit-outdoor').checked=s.has_outdoor_space;
  document.getElementById('edit-kitchen').checked=s.has_kitchen_area;
  document.getElementById('edit-zoning').checked=s.zoning_clear;
  document.getElementById('edit-status').value=s.status||'Sourced';
  document.getElementById('edit-notes').value=s.notes||'';
  document.getElementById('char-count').textContent=(s.notes||'').length+'/500';
  document.getElementById('edit-title').textContent=editingIndex<0?'Add Site':'Edit Site';
  document.getElementById('delete-site').hidden=editingIndex<0;
  let modal=document.getElementById('editModal');
  modal.classList.add('active');
  SiteDialog.open(modal,{onClose:closeModal,initialFocus:document.getElementById('edit-name'),restoreFocus:()=>document.getElementById('add-site')});
}
function closeModal(){
  let modal=document.getElementById('editModal');
  modal.classList.remove('active');
  SiteDialog.close(modal);
  editingIndex=-1;
  editingDraft=null;
}
function saveSite(){
  if(!editingDraft||editingIndex>=sites.length)return;
  let candidate={
    name:document.getElementById('edit-name').value,
    address:document.getElementById('edit-address').value,
    zip_code:document.getElementById('edit-zip').value||null,
    sqft:document.getElementById('edit-sqft').valueAsNumber,
    monthly_rent:document.getElementById('edit-rent').valueAsNumber,
    has_driveway:document.getElementById('edit-driveway').checked,
    has_outdoor_space:document.getElementById('edit-outdoor').checked,
    has_kitchen_area:document.getElementById('edit-kitchen').checked,
    zoning_clear:document.getElementById('edit-zoning').checked,
    parking_spots:editingDraft.parking_spots||0,
    status:document.getElementById('edit-status').value,
    date_added:editingDraft.date_added,
    notes:document.getElementById('edit-notes').value
  };
  try{candidate=AlphaSiteData.normalizeSite(candidate);}
  catch(error){alert(error.message);return;}
  let nextSites=sites.slice();
  if(editingIndex<0)nextSites.push(candidate);
  else nextSites[editingIndex]=candidate;
  if(!commitSites(nextSites))return;
  render();
  closeModal();
}
function deleteSite(){
  if(!Number.isInteger(editingIndex)||editingIndex<0||editingIndex>=sites.length)return;
  if(!confirm('Delete?'))return;
  let deleteIndex=editingIndex;
  let nextSites=sites.slice();
  nextSites.splice(deleteIndex,1);
  if(!commitSites(nextSites))return;
  render();
  closeModal();
}
const zipCoords={"28211": [35.15, -80.82], "78723": [30.3, -97.69], "27609": [35.84, -78.63], "32819": [28.45, -81.49], "77056": [29.74, -95.46], "78521": [25.93, -97.48], "33155": [25.73, -80.31], "75201": [32.79, -96.8], "85253": [33.56, -111.89], "10038": [40.71, -74.0], "33480": [26.7, -80.04], "67401": [38.84, -97.61], "80202": [39.75, -104.99], "94105": [37.79, -122.39], "48210": [42.33, -83.11]};let map,markers=[];
function initMap(){if(map)return;map=L.map('map').setView([39,-98],4);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(map);
let legend=L.control({position:'bottomright'});legend.onAdd=function(){let d=L.DomUtil.create('div','map-legend');d.innerHTML='<div><span style="background:#16a34a"></span>Green (75+)</div><div><span style="background:#ca8a04"></span>Yellow (50-74)</div><div><span style="background:#dc2626"></span>Red (<50)</div>';return d;};legend.addTo(map);}
function updateMarkers(){
  markers.forEach(m=>map.removeLayer(m));
  markers=[];
  let tierColor={GREEN:'#16a34a',YELLOW:'#ca8a04',RED:'#dc2626'};
  sites.forEach((s,i)=>{
    let coords=zipCoords[(s.zip_code||'').slice(0,5)];
    if(!coords)return;
    let score=scoreSite(s);
    let c=costAnalysis(s);
    let m=L.circleMarker(coords,{radius:12,fillColor:tierColor[score.tier],color:'white',weight:2,fillOpacity:0.9}).addTo(map);
    m.bindPopup(`<b>${escapeHtml(s.name)}</b><br>${escapeHtml(s.address)}<br><b>Score:</b> ${score.total.toFixed(1)}/${MAX_SITE_SCORE} (${score.tier})<br><b>Break-even:</b> ${c.breakEven} students<br><b>Margin:</b> ${formatMoney(c.margin)}<br><button onclick="document.getElementById('btn-grid').click();setTimeout(()=>document.querySelector('[data-idx=\\''+i+'\\']')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}),100)" style="margin-top:8px;padding:4px 8px;cursor:pointer">View Card →</button>`);
    m.on('mouseover',function(){this.openPopup();});
    markers.push(m);
  });
  let missing=sites.length-markers.length;
  document.getElementById('map-status').textContent='Showing '+markers.length+' of '+sites.length+' sites at approximate ZIP-area locations.'+(missing?' '+missing+' '+(missing===1?'site is':'sites are')+' not mapped because the ZIP code is missing or outside the supported locations.':'');
  if(markers.length){
    let group=L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.1));
  }
}
function showView(v){document.getElementById('map-status').hidden=v!=='map';document.getElementById('map').style.display=v==='map'?'block':'none';document.getElementById('grid').style.display=v==='grid'?'grid':'none';document.getElementById('kanban').style.display=v==='kanban'?'flex':'none';document.getElementById('btn-grid').classList.toggle('active',v==='grid');document.getElementById('btn-kanban').classList.toggle('active',v==='kanban');document.getElementById('btn-map').classList.toggle('active',v==='map');if(v==='map'){initMap();updateMarkers();setTimeout(()=>map.invalidateSize(),100);}if(v==='kanban')renderKanban();}

let costChart=null;
function showCostDetail(i){
  let s=sites[i],c=costAnalysis(s);
  document.getElementById('cost-site-name').textContent=s.name+' — Cost Breakdown';
  document.getElementById('cost-total').textContent='$'+c.totalCost.toLocaleString();
  document.getElementById('cost-breakeven').textContent=c.breakEven+' students';
  document.getElementById('cost-capacity').textContent=c.capacity+' students';
  let marginEl=document.getElementById('cost-margin');
  marginEl.style.background=c.margin>=0?'#dcfce7':'#fef9c3';
  marginEl.innerHTML='<div style="font-size:1.25rem;font-weight:600;color:'+(c.margin>=0?'#166534':'#854d0e')+'">'+formatMoney(c.margin)+'</div><div style="font-size:0.75rem;color:#585858">Modeled Annual Margin at Capacity</div>';
  document.getElementById('cost-details').innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px">
      <div style="padding:12px;background:#f8fafc;border-radius:8px;border-left:3px solid #3b82f6"><div style="font-weight:600">Rent — $${c.rent.toLocaleString()}</div><div style="font-size:0.8rem;color:#64748b">$${s.monthly_rent.toLocaleString()}/mo × 12 months. Largest fixed cost; negotiate aggressively.</div></div>
      <div style="padding:12px;background:#f8fafc;border-radius:8px;border-left:3px solid #8b5cf6"><div style="font-weight:600">Guide Salaries — $${c.guideSalary.toLocaleString()}</div><div style="font-size:0.8rem;color:#64748b">${c.guides} guide${c.guides>1?'s':''} × $110k. One guide per ~5,000 sqft for optimal coverage.</div></div>
      <div style="padding:12px;background:#f8fafc;border-radius:8px;border-left:3px solid #ec4899"><div style="font-weight:600">Head of School — ${c.headOfSchool?'$'+c.headOfSchool.toLocaleString():'N/A'}</div><div style="font-size:0.8rem;color:#64748b">${c.headOfSchool?'Required when campus has 2+ guides for coordination.':'Not needed until campus scales to 2+ guides.'}</div></div>
      <div style="padding:12px;background:#f8fafc;border-radius:8px;border-left:3px solid #f97316"><div style="font-weight:600">Utilities — $${c.utilities.toLocaleString()}</div><div style="font-size:0.8rem;color:#64748b">Estimated at $3/sqft annually. Includes electric, water, internet.</div></div>
      <div style="padding:12px;background:#f8fafc;border-radius:8px;border-left:3px solid #14b8a6"><div style="font-weight:600">Insurance — $${c.insurance.toLocaleString()}</div><div style="font-size:0.8rem;color:#64748b">General liability + property insurance. May vary by location.</div></div>
      <div style="padding:12px;background:#f8fafc;border-radius:8px;border-left:3px solid #eab308"><div style="font-weight:600">Marketing — $${c.marketing.toLocaleString()}</div><div style="font-size:0.8rem;color:#64748b">Grassroots outreach, events, digital ads for enrollment drives.</div></div>
      <div style="padding:12px;background:#f8fafc;border-radius:8px;border-left:3px solid #22c55e"><div style="font-weight:600">Food Service — $${c.food.toLocaleString()}</div><div style="font-size:0.8rem;color:#64748b">${c.capacity} students × $1,500/year. Catering program (e.g., Sifted).</div></div>
    </div>`;
  let modal=document.getElementById('costModal');
  modal.classList.add('active');
  SiteDialog.open(modal,{onClose:closeCostModal,restoreFocus:()=>document.getElementById('add-site')});
  if(costChart){costChart.destroy();}
  if(typeof Chart==='function')costChart=new Chart(document.getElementById('costChart'),{type:'doughnut',data:{labels:['Rent','Guides','Head of School','Utilities','Insurance','Marketing','Food'],datasets:[{data:[c.rent,c.guideSalary,c.headOfSchool,c.utilities,c.insurance,c.marketing,c.food],backgroundColor:['#3b82f6','#8b5cf6','#ec4899','#f97316','#14b8a6','#eab308','#22c55e']}]},options:{animation:window.matchMedia('(prefers-reduced-motion: reduce)').matches?false:undefined,plugins:{legend:{position:'bottom',labels:{boxWidth:12,padding:8,font:{size:11}}}}}});

}
function closeCostModal(){let modal=document.getElementById('costModal');modal.classList.remove('active');SiteDialog.close(modal);}
document.getElementById('edit-notes').addEventListener('keydown',function(e){if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();saveSite();}});
render();

function exportSites(){
  let data=JSON.stringify(sites,null,2);
  let blob=new Blob([data],{type:'application/json'});
  let url=URL.createObjectURL(blob);
  let a=document.createElement('a');
  a.href=url;a.download='alpha-sites-'+new Date().toISOString().slice(0,10)+'.json';
  a.click();URL.revokeObjectURL(url);
  if(navigator.share&&/Mobi|Android/i.test(navigator.userAgent)){
    navigator.share({title:'Alpha Sites Export',files:[new File([blob],'alpha-sites.json',{type:'application/json'})]}).catch(()=>{});
  }
}
function importSites(e){
  let input=e.target;
  let file=input.files[0];
  if(!file)return;
  if(file.size>AlphaSiteData.MAX_IMPORT_BYTES){
    alert('Import failed: the file must be 1 MB or smaller.');
    input.value='';
    return;
  }
  let reader=new FileReader();
  reader.onload=function(ev){
    try{
      let imported=AlphaSiteData.parseSiteList(ev.target.result);
      let nextSites=sites.map(site=>({...site}));
      let added=0,updated=0;
      imported.forEach(s=>{
        let idx=nextSites.findIndex(x=>x.name===s.name);
        if(idx>=0){nextSites[idx]=s;updated++;}
        else{nextSites.push(s);added++;}
      });
      if(nextSites.length>AlphaSiteData.MAX_SITES)throw new Error('An import cannot produce more than '+AlphaSiteData.MAX_SITES+' sites.');
      if(!commitSites(nextSites))return;
      render();
      alert('Import complete: '+added+' added, '+updated+' updated');
    }catch(error){
      alert('Import failed: '+(error instanceof SyntaxError?'the file is not valid JSON.':error.message));
    }finally{
      input.value='';
    }
  };
  reader.onerror=function(){alert('Import failed: the file could not be read.');input.value='';};
  try{reader.readAsText(file);}
  catch(error){alert('Import failed: the file could not be read.');input.value='';}
}

let draggedIdx=null;
function renderKanban(){
  let stages=['Sourced','Site Visit','LOI','Negotiation','Signed'];
  let tierClass={GREEN:'go',YELLOW:'caution',RED:'nogo'};
  document.getElementById('kanban').innerHTML=stages.map(st=>{
    let cards=sites.map((s,i)=>({site:s,idx:i,...scoreSite(s)})).filter(r=>(r.site.status||'Sourced')===st);
    return`<div class="kanban-col" data-stage="${st}" ondragover="kanbanDragOver(event)" ondragleave="kanbanDragLeave(event)" ondrop="kanbanDrop(event)">
      <h4>${st}<span>${cards.length}</span></h4>
      ${cards.map(r=>`<div class="kanban-card ${tierClass[r.tier]}" draggable="true" role="button" tabindex="0" aria-label="Edit ${escapeHtml(r.site.name)}" data-idx="${r.idx}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}" onclick="editSite(${r.idx})" ondragstart="kanbanDragStart(event)" ondragend="kanbanDragEnd(event)">
        <div style="font-weight:600;font-size:0.9rem">${escapeHtml(r.site.name)}</div>
        <div style="font-size:0.75rem;color:#64748b">${escapeHtml(r.site.address)}</div>
        <div style="font-size:0.8rem;margin-top:4px"><b>${r.total.toFixed(0)}</b>/${MAX_SITE_SCORE}</div>
      </div>`).join('')}
    </div>`;
  }).join('');
}
function kanbanDragStart(e){draggedIdx=parseInt(e.target.dataset.idx);e.target.classList.add('dragging');}
function kanbanDragEnd(e){e.target.classList.remove('dragging');draggedIdx=null;}
function kanbanDragOver(e){e.preventDefault();e.currentTarget.classList.add('drag-over');}
function kanbanDragLeave(e){e.currentTarget.classList.remove('drag-over');}
function kanbanDrop(e){
  e.preventDefault();e.currentTarget.classList.remove('drag-over');
  if(draggedIdx===null)return;
  let newStage=e.currentTarget.dataset.stage;
  if(!Number.isInteger(draggedIdx)||draggedIdx<0||draggedIdx>=sites.length||AlphaSiteData.STATUSES.indexOf(newStage)===-1){draggedIdx=null;return;}
  let nextSites=sites.map(site=>({...site}));
  nextSites[draggedIdx].status=newStage;
  if(!commitSites(nextSites)){draggedIdx=null;return;}
  render();renderKanban();
  draggedIdx=null;
}
