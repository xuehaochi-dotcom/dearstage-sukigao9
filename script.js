
const $ = (s) => document.querySelector(s);

let state = null;

function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function show(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
}

function makeBlocks(){
  // 61人 → 18ブロック：4人×7 + 3人×11
  const shuffled = shuffle(ARTISTS);
  const sizes = [...Array(7).fill(4), ...Array(11).fill(3)];
  let p=0;
  return sizes.map(size => shuffled.slice(p,p+=size));
}

function roundRobin(players){
  const pairs=[];
  for(let i=0;i<players.length;i++){
    for(let j=i+1;j<players.length;j++) pairs.push([players[i],players[j]]);
  }
  return shuffle(pairs);
}

function init(){
  state = {
    blocks: makeBlocks(),
    blockIndex: 0,
    blockScores: new Map(),
    currentPairs: [],
    pairIndex: 0,
    finalists: [],
    finalPairs: [],
    finalIndex: 0,
    finalScores: new Map(),
    finalHistory: []
  };
  state.blocks.forEach(block=>block.forEach(p=>state.blockScores.set(p.id,0)));
}

function imageFor(person){
  return person.image;
}

function setPerson(side, person){
  $(`#${side}Name`).textContent = person.name;
  const img = $(`#${side}Img`);
  img.src = imageFor(person);\n  img.onerror = () => { img.src = person.image.replace(/\\.jpg$/, ".svg"); };
  img.alt = person.name;
  img.onerror = () => { img.style.display="none"; };
  img.onload = () => { img.style.display="block"; };
}

function updateMatchUI(){
  const isFinal = state.finalPairs.length>0;
  const pair = isFinal ? state.finalPairs[state.finalIndex] : state.currentPairs[state.pairIndex];
  const total = isFinal ? state.finalPairs.length : state.currentPairs.length;
  const index = isFinal ? state.finalIndex : state.pairIndex;
  $("#phaseLabel").textContent = isFinal ? "FINAL / ROUND ROBIN" : "QUALIFYING / BLOCK";
  $("#matchTitle").textContent = isFinal
    ? "18人・完全総当たり"
    : `予選 ${state.blockIndex+1} / 18`;
  $("#counter").textContent = `${index+1} / ${total}`;
  $("#progressBar").style.width = `${((index)/total)*100}%`;
  setPerson("left",pair[0]);
  setPerson("right",pair[1]);
}

function startBlock(){
  const block=state.blocks[state.blockIndex];
  state.currentPairs=roundRobin(block);
  state.pairIndex=0;
  show("#screen-match");
  updateMatchUI();
}

function chooseWinner(winner){
  const isFinal=state.finalPairs.length>0;
  if(isFinal){
    const loser = state.finalPairs[state.finalIndex][0].id===winner.id
      ? state.finalPairs[state.finalIndex][1]
      : state.finalPairs[state.finalIndex][0];
    state.finalScores.set(winner.id,(state.finalScores.get(winner.id)||0)+1);
    state.finalHistory.push({winner:winner.id, loser:loser.id});
    state.finalIndex++;
    if(state.finalIndex < state.finalPairs.length){
      updateMatchUI();
    }else{
      finishFinal();
    }
  }else{
    state.blockScores.set(winner.id,(state.blockScores.get(winner.id)||0)+1);
    state.pairIndex++;
    if(state.pairIndex < state.currentPairs.length){
      updateMatchUI();
    }else{
      finishBlock();
    }
  }
}

function finishBlock(){
  const block=state.blocks[state.blockIndex];
  const ranked=[...block].sort((a,b)=>{
    const d=(state.blockScores.get(b.id)||0)-(state.blockScores.get(a.id)||0);
    if(d) return d;
    return Math.random()-.5;
  });
  state.finalists.push(ranked[0]);
  state.blockIndex++;
  if(state.blockIndex < state.blocks.length){
    $("#betweenEyebrow").textContent=`QUALIFYING ${state.blockIndex} / 18`;
    $("#betweenTitle").textContent="次の予選へ";
    $("#betweenText").textContent=`ここまでの予選通過者は ${state.finalists.length}人。`;
    $("#betweenBtn").textContent="NEXT BLOCK";
    show("#screen-between");
    $("#betweenBtn").onclick=startBlock;
  }else{
    prepareFinal();
  }
}

function prepareFinal(){
  state.finalists=shuffle(state.finalists);
  state.finalScores=new Map(state.finalists.map(p=>[p.id,0]));
  state.finalPairs=roundRobin(state.finalists); // 18人なら153試合
  state.finalIndex=0;
  $("#betweenEyebrow").textContent="18 → 9";
  $("#betweenTitle").textContent="FINAL ROUND";
  $("#betweenText").textContent="ここから18人の完全総当たり。全153試合を通して、あなたの好き顔9を決めます。";
  $("#betweenBtn").textContent="FINAL START";
  show("#screen-between");
  $("#betweenBtn").onclick=()=>{
    show("#screen-match");
    updateMatchUI();
  };
}

function finishFinal(){
  const scoreMap=state.finalScores;
  const rank=[...state.finalists].sort((a,b)=>{
    const d=(scoreMap.get(b.id)||0)-(scoreMap.get(a.id)||0);
    if(d) return d;
    // 同率時：直接対決。2人ならその結果、3人以上なら同率者内勝利数
    const sa=scoreMap.get(a.id)||0, sb=scoreMap.get(b.id)||0;
    const tied=state.finalists.filter(x=>(scoreMap.get(x.id)||0)===sa);
    if(sa===sb && tied.length>1){
      const direct=state.finalHistory.find(h=>
        (h.winner===a.id && h.loser===b.id)||(h.winner===b.id && h.loser===a.id)
      );
      if(direct) return direct.winner===a.id ? -1 : 1;
    }
    return a.name.localeCompare(b.name,"ja");
  });
  state.ranking=rank.slice(0,9);
  renderResult();
}

function renderResult(){
  const grid=$("#resultGrid");
  grid.innerHTML="";
  state.ranking.forEach((p,i)=>{
    const el=document.createElement("article");
    el.className="result-item";
    el.innerHTML=`
      <div class="result-rank">${i+1} / 9</div>
      <div class="result-photo"><img src="${imageFor(p)}" alt="${p.name}"></div>
      <div class="result-name">${p.name}</div>
    `;
    grid.appendChild(el);
  });
  show("#screen-result");
}

$("#startBtn").onclick=()=>{init();startBlock();};
$("#leftCard").onclick=()=>chooseWinner(state.finalPairs.length ? state.finalPairs[state.finalIndex][0] : state.currentPairs[state.pairIndex][0]);
$("#rightCard").onclick=()=>chooseWinner(state.finalPairs.length ? state.finalPairs[state.finalIndex][1] : state.currentPairs[state.pairIndex][1]);
$("#restartBtn").onclick=()=>{init();startBlock();};
