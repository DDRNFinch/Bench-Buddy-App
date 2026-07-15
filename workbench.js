
"use strict";

const WORKBENCH_CATEGORY_META={
  "Tools":{icon:"🪚",image:"./workbench-images/tools.jpg",description:"Hand tools, portable tools and measuring equipment."},
  "Timber & Boards":{icon:"🌳",image:"./workbench-images/timber.jpg",description:"UK timber species, boards, defects and moisture."},
  "Joints":{icon:"🧩",image:"./workbench-images/joints.png",description:"Common bench-joinery joints and where they are used."},
  "Fixings & Adhesives":{icon:"🔩",image:"./workbench-images/fixings.jpg",description:"Mechanical fixings, cabinet fittings and adhesives."},
  "Machinery":{icon:"⚙️",image:"./workbench-images/machinery.jpg",description:"Fixed workshop machinery and safe operating principles."},
  "Health & Safety":{icon:"⚠️",image:"./workbench-images/safety.jpg",description:"Practical workshop controls, PPE, RPE and safe systems."},
  "Drawings & Quality":{icon:"📐",image:"./workbench-images/drawings.png",description:"Drawings, setting out, tolerances and quality checks."}
};

const WORKBENCH_ITEM_IMAGES={
  "mortice-chisel":"./workbench-images/mortice-chisel.jpg",
  "mortice-and-tenon":"./workbench-images/joints.png",
  "woodscrew":"./workbench-images/fixings.jpg",
  "table-saw":"./workbench-images/machinery.jpg",
  "ppe":"./workbench-images/safety.jpg",
  "mdf":"./workbench-images/timber.jpg",
  "jack-plane":"./workbench-images/tools.jpg",
  "smoothing-plane":"./workbench-images/tools.jpg"
};

function workbenchImage(card){
  return WORKBENCH_ITEM_IMAGES[card.id]||WORKBENCH_CATEGORY_META[card.category]?.image||"./workbench-images/tools.jpg";
}


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
    <img class="workbench-card-photo" src="${workbenchImage(card)}" alt="${card.title}" loading="lazy">
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
  const today=[...WORKBENCH_CARDS]
    .sort((a,b)=>{
      const day=Math.floor(Date.now()/86400000);
      return ((a.id.charCodeAt(0)+day)%17)-((b.id.charCodeAt(0)+day)%17);
    })
    .slice(0,3);

  view().innerHTML=`
    <section class="card hero workbench-hero">
      <span class="eyebrow">OFFLINE KNOWLEDGE LIBRARY</span>
      <h2>🧰 Workbench</h2>
      <p>Search practical UK bench-joinery reference cards for tools, materials, joints, fixings, machinery, safety and quality.</p>
      <div class="workbench-search-wrap">
        <span>🔍</span>
        <input id="workbenchSearch" value="${workbenchQuery}" placeholder="Search tools, timber, fixings, joints or KSBs…">
        ${workbenchQuery?'<button id="clearWorkbenchSearch" class="secondary">Clear</button>':""}
      </div>
      <small>${WORKBENCH_CARDS.length} cards available offline</small>
    </section>

    ${!workbenchQuery&&workbenchCategory==="All"?`
    <section class="card">
      <div class="section-heading"><div><h3>Today’s Toolbox</h3><p>Three quick references to explore today.</p></div></div>
      <div class="workbench-feature-grid">${today.map(workbenchCardTile).join("")}</div>
    </section>`:""}

    <section class="card">
      <div class="section-heading"><div><h3>Workbench drawers</h3><p>Choose a category or search the full library.</p></div></div>
      <div class="workbench-categories">
        <button class="workbench-category ${workbenchCategory==="All"?"active":""}" data-workbench-category="All">
          <span>🧰</span><b>All cards</b><small>${WORKBENCH_CARDS.length}</small>
        </button>
        ${categories.map(category=>{
          const meta=WORKBENCH_CATEGORY_META[category];
          const count=WORKBENCH_CARDS.filter(card=>card.category===category).length;
          return `<button class="workbench-category ${workbenchCategory===category?"active":""}" data-workbench-category="${category}">
            <img src="${meta.image}" alt="${category}" loading="lazy"><b>${meta.icon} ${category}</b><small>${count} cards</small>
          </button>`;
        }).join("")}
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
    search.focus();
    search.setSelectionRange(search.value.length,search.value.length);
  }
  document.getElementById("clearWorkbenchSearch")?.addEventListener("click",()=>{
    workbenchQuery="";
    workbench();
  });
  view().querySelectorAll("[data-workbench-category]").forEach(button=>button.onclick=()=>{
    const category=button.dataset.workbenchCategory;
    if(category==="All")openWorkbenchCategory("All");
    else openWorkbenchCategory(category);
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

function openWorkbenchCategory(category){
  workbenchCategory=category;
  workbenchQuery="";
  const meta=category==="All"?{icon:"🧰",image:"./workbench-images/tools.jpg",description:"Browse the complete Workbench knowledge library."}:WORKBENCH_CATEGORY_META[category];
  const cards=WORKBENCH_CARDS.filter(card=>category==="All"||card.category===category);

  view().innerHTML=`
    <div class="subpage-back"><button class="secondary" id="backToWorkbenchHome">← Back to Workbench</button></div>
    <section class="card workbench-category-page-head">
      <img src="${meta.image}" alt="${category}" class="workbench-category-hero-image">
      <div><span class="eyebrow">WORKBENCH DRAWER</span><h2>${meta.icon} ${category==="All"?"All cards":category}</h2><p>${meta.description}</p><small>${cards.length} cards</small></div>
    </section>
    <section class="card">
      <div class="workbench-search-wrap"><span>🔍</span><input id="categorySearch" placeholder="Search within ${category}…"><button id="clearCategorySearch" class="secondary">Clear</button></div>
      <div id="categoryCardList" class="workbench-list">${cards.map(workbenchCardTile).join("")}</div>
    </section>`;

  document.getElementById("backToWorkbenchHome").onclick=()=>{workbenchCategory="All";workbenchQuery="";workbench()};
  const input=document.getElementById("categorySearch");
  const renderList=()=>{
    const q=input.value.trim();
    const filtered=cards.filter(card=>workbenchMatches(card,q));
    document.getElementById("categoryCardList").innerHTML=filtered.length?filtered.map(workbenchCardTile).join(""):'<div class="empty">No cards match this search.</div>';
    document.querySelectorAll("[data-workbench-card]").forEach(button=>button.onclick=event=>{
      const id=button.dataset.workbenchCard;
      if(event.target.closest(".workbench-star")){event.stopPropagation();toggleWorkbenchFavourite(id);renderList();return}
      openWorkbenchCard(id);
    });
  };
  input.addEventListener("input",renderList);
  document.getElementById("clearCategorySearch").onclick=()=>{input.value="";renderList();input.focus()};
  renderList();
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
        <div class="workbench-visual"><img src="${workbenchImage(card)}" alt="${card.title}"><small>${card.category}</small></div>
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
      <small class="workbench-image-credit">Reference photographs are stored locally in the app and sourced from Wikimedia Commons under their stated licences.</small>
    </article>`;

  document.getElementById("backToWorkbench").onclick=()=>openWorkbenchCategory(card.category);
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
