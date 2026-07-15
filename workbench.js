
"use strict";

const WORKBENCH_CATEGORY_META={
  "Tools":{icon:"🪚",description:"Hand tools, portable tools and measuring equipment."},
  "Timber & Boards":{icon:"🌳",description:"UK timber species, boards, defects and moisture."},
  "Joints":{icon:"🧩",description:"Common bench-joinery joints and where they are used."},
  "Fixings & Adhesives":{icon:"🔩",description:"Mechanical fixings, cabinet fittings and adhesives."},
  "Machinery":{icon:"⚙️",description:"Fixed workshop machinery and safe operating principles."},
  "Health & Safety":{icon:"⚠️",description:"Practical workshop controls, PPE, RPE and safe systems."},
  "Drawings & Quality":{icon:"📐",description:"Drawings, setting out, tolerances and quality checks."}
};

let workbenchQuery="";
let workbenchCategory="All";
let workbenchCurrentId=null;

function workbenchState(){
  try{
    return JSON.parse(localStorage.getItem("benchBuddyWorkbench")||'{"favourites":[],"recent":[]}');
  }catch(error){
    return {favourites:[],recent:[]};
  }
}

function saveWorkbenchState(value){
  localStorage.setItem("benchBuddyWorkbench",JSON.stringify(value));
}

function rememberWorkbenchCard(id){
  const value=workbenchState();
  value.recent=[id,...value.recent.filter(item=>item!==id)].slice(0,8);
  saveWorkbenchState(value);
}

function toggleWorkbenchFavourite(id){
  const value=workbenchState();
  value.favourites=value.favourites.includes(id)
    ? value.favourites.filter(item=>item!==id)
    : [id,...value.favourites];
  saveWorkbenchState(value);
}

function workbenchMatches(card,query){
  if(!query)return true;
  const haystack=[
    card.title,card.category,card.summary,card.level,
    ...(card.uses||[]),...(card.advantages||[]),...(card.mistakes||[]),
    ...(card.keywords||[]),...(card.ksbs||[])
  ].join(" ").toLowerCase();
  return query.toLowerCase().split(/\s+/).every(word=>haystack.includes(word));
}

function workbenchCardTile(card){
  const favourite=workbenchState().favourites.includes(card.id);
  return `<button class="workbench-card-tile" data-workbench-card="${card.id}">
    <span class="workbench-card-image">
      <img src="${card.image||""}" alt="${card.imageAlt||card.title}" loading="lazy"
        onerror="this.style.display='none';this.parentElement.classList.add('image-failed');">
      <span class="workbench-image-fallback">${card.icon||"🧰"}</span>
    </span>
    <span class="workbench-card-copy">
      <b>${card.title}</b>
      <small>${card.category} • ${card.level}</small>
    </span>
    <span class="workbench-star ${favourite?"active":""}" aria-label="Favourite">${favourite?"★":"☆"}</span>
  </button>`;
}

function workbench(){
  const categories=Object.keys(WORKBENCH_CATEGORY_META);
  const value=workbenchState();
  const filtered=WORKBENCH_CARDS.filter(card=>
    (workbenchCategory==="All"||card.category===workbenchCategory)&&
    workbenchMatches(card,workbenchQuery)
  );
  const recent=value.recent.map(id=>WORKBENCH_CARDS.find(card=>card.id===id)).filter(Boolean);
  const favourites=value.favourites.map(id=>WORKBENCH_CARDS.find(card=>card.id===id)).filter(Boolean);

  view().innerHTML=`
    <section class="card hero workbench-hero">
      <span class="eyebrow">OFFLINE KNOWLEDGE LIBRARY</span>
      <h2>🧰 Workbench</h2>
      <p>Search practical UK bench-joinery reference cards for tools, materials, joints, fixings, machinery, safety and quality.</p>
      <small>${WORKBENCH_CARDS.length} cards available</small>
    </section>

    <section class="card">
      <div class="section-heading"><div><h3>Workbench Drawers</h3><p>Choose a category to browse the library.</p></div></div>
      <div class="workbench-categories">
        <button class="workbench-category ${workbenchCategory==="All"?"active":""}" data-workbench-category="All">
          <span>🧰</span><b>All cards</b><small>${WORKBENCH_CARDS.length}</small>
        </button>
        ${categories.map(category=>{
          const meta=WORKBENCH_CATEGORY_META[category];
          const count=WORKBENCH_CARDS.filter(card=>card.category===category).length;
          return `<button class="workbench-category ${workbenchCategory===category?"active":""}" data-workbench-category="${category}">
            <span>${meta.icon}</span><b>${category}</b><small>${count} cards</small>
          </button>`;
        }).join("")}
      </div>
    </section>

    <section class="card">
      <div class="section-heading"><div><h3>Search the Workbench</h3><p>Search by item, use, category, assignment or KSB.</p></div></div>
      <div class="workbench-search-wrap">
        <span>🔍</span>
        <input id="workbenchSearch" value="${workbenchQuery}" placeholder="Search tools, timber, fixings, joints or KSBs…" autocomplete="off" inputmode="search">
        ${workbenchQuery?'<button id="clearWorkbenchSearch" class="secondary">Clear</button>':""}
      </div>
    </section>

    ${favourites.length&&!workbenchQuery&&workbenchCategory==="All"?`
      <section class="card"><div class="section-heading"><h3>★ Favourites</h3></div>
      <div class="workbench-list">${favourites.map(workbenchCardTile).join("")}</div></section>`:""}

    ${recent.length&&!workbenchQuery&&workbenchCategory==="All"?`
      <section class="card"><div class="section-heading"><h3>Recently viewed</h3></div>
      <div class="workbench-list">${recent.map(workbenchCardTile).join("")}</div></section>`:""}

    <section class="card">
      <div class="split"><div><h3>${workbenchCategory==="All"?"All Workbench cards":workbenchCategory}</h3>
      <p class="small">${filtered.length} result${filtered.length===1?"":"s"}${workbenchQuery?` for “${workbenchQuery}”`:""}</p></div></div>
      <div class="workbench-list">
        ${filtered.length?filtered.map(workbenchCardTile).join(""):'<div class="empty">No Workbench cards match this search yet.</div>'}
      </div>
    </section>`;

  const search=document.getElementById("workbenchSearch");
  if(search){
    search.addEventListener("input",()=>{
      workbenchQuery=search.value.trim();
      clearTimeout(search._timer);
      search._timer=setTimeout(workbench,180);
    });
  }

  document.getElementById("clearWorkbenchSearch")?.addEventListener("click",()=>{
    workbenchQuery="";
    workbench();
  });

  view().querySelectorAll("[data-workbench-category]").forEach(button=>button.onclick=()=>{
    workbenchCategory=button.dataset.workbenchCategory;
    workbenchQuery="";
    workbench();
  });

  view().querySelectorAll("[data-workbench-card]").forEach(button=>button.onclick=event=>{
    const id=button.dataset.workbenchCard;
    if(event.target.closest(".workbench-star")){
      event.stopPropagation();
      toggleWorkbenchFavourite(id);
      workbench();
      return;
    }
    openWorkbenchCard(id);
  });
}
function openWorkbenchCard(id){
  const card=WORKBENCH_CARDS.find(item=>item.id===id);
  if(!card){workbench();return}
  workbenchCurrentId=id;
  rememberWorkbenchCard(id);
  const value=workbenchState();
  const favourite=value.favourites.includes(id);
  const related=(card.related||[]).map(relatedId=>WORKBENCH_CARDS.find(item=>item.id===relatedId)).filter(Boolean);

  view().innerHTML=`
    <div class="subpage-back"><button class="secondary" id="backToWorkbench">← Back to Workbench</button></div>
    <article class="card workbench-detail">
      <div class="workbench-detail-head">
        <div class="workbench-detail-image">
          <img src="${card.image||""}" alt="${card.imageAlt||card.title}"
            onerror="this.style.display='none';this.parentElement.classList.add('image-failed');">
          <span class="workbench-image-fallback">${card.icon||"🧰"}</span>
          <small>${card.category}</small>
        </div>
        <div><span class="eyebrow">${card.level}</span><h2>${card.title}</h2><p>${card.summary}</p></div>
        <button class="workbench-favourite-button ${favourite?"active":""}" id="workbenchFavourite">${favourite?"★ Favourite":"☆ Add favourite"}</button>
      </div>

      <div class="workbench-detail-grid">
        <section><h3>Common uses</h3><ul>${card.uses.map(item=>`<li>${item}</li>`).join("")}</ul></section>
        <section><h3>Advantages</h3><ul>${card.advantages.map(item=>`<li>${item}</li>`).join("")}</ul></section>
      </div>

      <section class="workbench-warning"><h3>⚠ Common mistakes</h3>
        <ul>${card.mistakes.map(item=>`<li>${item}</li>`).join("")}</ul>
      </section>

      <section class="workbench-tip"><h3>💡 EPA tip</h3><p>${card.tip}</p></section>

      <div class="workbench-meta-grid">
        <section><h3>Linked assignments</h3><p>${card.assignments.length?card.assignments.map(id=>`<button class="mini-chip" data-workbench-assignment="${id}">Assignment ${id}</button>`).join(" "):"General reference"}</p></section>
        <section><h3>Linked KSBs</h3><p>${card.ksbs.map(item=>`<span class="mini-chip">${item}</span>`).join(" ")}</p></section>
      </div>

      ${related.length?`<section><h3>Related topics</h3><div class="workbench-list">${related.map(workbenchCardTile).join("")}</div></section>`:""}
    </article>`;

  document.getElementById("backToWorkbench").onclick=workbench;
  document.getElementById("workbenchFavourite").onclick=()=>{
    toggleWorkbenchFavourite(id);
    openWorkbenchCard(id);
  };
  view().querySelectorAll("[data-workbench-card]").forEach(button=>button.onclick=()=>openWorkbenchCard(button.dataset.workbenchCard));
  view().querySelectorAll("[data-workbench-assignment]").forEach(button=>button.onclick=()=>{
    openAssignmentId=Number(button.dataset.workbenchAssignment);
    state.lastAssignment=openAssignmentId;
    saveState(state);
    go("evidence");
  });
}
