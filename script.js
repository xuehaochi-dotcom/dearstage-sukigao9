const $ = (s) => document.querySelector(s);

let state = null;


/* =========================
   共通
========================= */

function shuffle(arr){
  const a = [...arr];

  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));

    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
}


function show(id){
  document
    .querySelectorAll(".screen")
    .forEach(s => s.classList.remove("active"));

  $(id).classList.add("active");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   画像
========================= */

function imageFor(person){
  return person.image;
}


function setPerson(side, person){

  $(`#${side}Name`).textContent = person.name;

  const img = $(`#${side}Img`);

  img.src = imageFor(person);
  img.alt = person.name;
  img.style.display = "block";

  img.onerror = () => {
    img.style.display = "none";
  };
}


/* =========================
   初期化
========================= */

function init(){

  state = {

    /* 予選1 */
    qual1Blocks: [],
    qual1Index: 0,
    qual1Selected: new Set(),
    qual1Winners: [],

    /* 予選2 */
    qual2Blocks: [],
    qual2Index: 0,
    qual2Selected: new Set(),
    qual2Winners: [],

    /* 最終 */
    finalists: [],
    finalPairs: [],
    finalIndex: 0,

    finalScores: new Map(),
    finalHistory: [],

    ranking: []
  };

  makeQual1Blocks();
}


/* =========================
   予選1
   60人 → 4人×15
   各ブロックから2人
========================= */

function makeQual1Blocks(){

  const shuffled = shuffle(ARTISTS);

  state.qual1Blocks = [];

  for(let i = 0; i < shuffled.length; i += 4){

    state.qual1Blocks.push(
      shuffled.slice(i, i + 4)
    );

  }
}


function startQual1(){

  state.qual1Index = 0;
  state.qual1Selected = new Set();
  state.qual1Winners = [];

  show("#screen-qual1");

  renderQual1();
}


function renderQual1(){

  const block =
    state.qual1Blocks[state.qual1Index];

  $("#qual1Title").textContent =
    `${state.qual1Index + 1} / ${state.qual1Blocks.length}`;

  $("#qual1Grid").innerHTML = "";

  block.forEach(person => {

    const card =
      document.createElement("button");

    card.className =
      "candidate-card";

    card.innerHTML = `
      <img
        src="${imageFor(person)}"
        alt="${person.name}"
      >
      <div>${person.name}</div>
    `;

    card.onclick = () => {

      if(state.qual1Selected.has(person.id)){

        state.qual1Selected.delete(person.id);

        card.classList.remove("selected");

      }else{

        if(state.qual1Selected.size >= 2){
          return;
        }

        state.qual1Selected.add(person.id);

        card.classList.add("selected");
      }

      updateQual1Button();
    };

    $("#qual1Grid").appendChild(card);
  });

  updateQual1Button();
}


function updateQual1Button(){

  $("#qual1Count").textContent =
    `${state.qual1Selected.size} / 2`;

  $("#qual1NextBtn").disabled =
    state.qual1Selected.size !== 2;
}


function finishQual1Block(){

  const block =
    state.qual1Blocks[state.qual1Index];

  block.forEach(person => {

    if(state.qual1Selected.has(person.id)){

      state.qual1Winners.push(person);

    }

  });

  state.qual1Index++;

  if(
    state.qual1Index <
    state.qual1Blocks.length
  ){

    state.qual1Selected = new Set();

    renderQual1();

  }else{

    prepareQual2();
  }
}


/* =========================
   予選2
   30人 → 5人×6
   各ブロックから2人
   → 12人
========================= */

function prepareQual2(){

  state.qual1Winners =
    shuffle(state.qual1Winners);

  state.qual2Blocks = [];

  for(
    let i = 0;
    i < state.qual1Winners.length;
    i += 5
  ){

    state.qual2Blocks.push(
      state.qual1Winners.slice(i, i + 5)
    );

  }

  state.qual2Index = 0;
  state.qual2Selected = new Set();
  state.qual2Winners = [];

  $("#betweenEyebrow").textContent =
    "30 → 12";

  $("#betweenTitle").textContent =
    "SECOND QUALIFYING";

  $("#betweenText").textContent =
    "予選1を通過した30人から、さらに12人へ。5人の中から好きな2人を選んでください。";

  $("#betweenBtn").textContent =
    "SECOND ROUND START";

  show("#screen-between");

  $("#betweenBtn").onclick =
    startQual2;
}


function startQual2(){

  show("#screen-qual2");

  renderQual2();
}


function renderQual2(){

  const block =
    state.qual2Blocks[state.qual2Index];

  $("#qual2Title").textContent =
    `${state.qual2Index + 1} / ${state.qual2Blocks.length}`;

  $("#qual2Grid").innerHTML = "";

  block.forEach(person => {

    const card =
      document.createElement("button");

    card.className =
      "candidate-card";

    card.innerHTML = `
      <img
        src="${imageFor(person)}"
        alt="${person.name}"
      >
      <div>${person.name}</div>
    `;

    card.onclick = () => {

      if(state.qual2Selected.has(person.id)){

        state.qual2Selected.delete(person.id);

        card.classList.remove("selected");

      }else{

        if(state.qual2Selected.size >= 2){
          return;
        }

        state.qual2Selected.add(person.id);

        card.classList.add("selected");
      }

      $("#qual2Count").textContent =
        `${state.qual2Selected.size} / 2`;

      $("#qual2NextBtn").disabled =
        state.qual2Selected.size !== 2;
    };

    $("#qual2Grid").appendChild(card);
  });

  $("#qual2Count").textContent =
    "0 / 2";

  $("#qual2NextBtn").disabled =
    true;
}


function finishQual2Block(){

  const block =
    state.qual2Blocks[state.qual2Index];

  block.forEach(person => {

    if(state.qual2Selected.has(person.id)){

      state.qual2Winners.push(person);

    }

  });

  state.qual2Index++;

  if(
    state.qual2Index <
    state.qual2Blocks.length
  ){

    state.qual2Selected = new Set();

    renderQual2();

  }else{

    prepareFinal();
  }
}


/* =========================
   最終
   12人 → 総当たり
   66試合
========================= */

function roundRobin(players){

  const pairs = [];

  for(
    let i = 0;
    i < players.length;
    i++
  ){

    for(
      let j = i + 1;
      j < players.length;
      j++
    ){

      pairs.push([
        players[i],
        players[j]
      ]);

    }
  }

  return shuffle(pairs);
}


function prepareFinal(){

  state.finalists =
    shuffle(state.qual2Winners);

  state.finalScores =
    new Map(
      state.finalists.map(
        p => [p.id, 0]
      )
    );

  state.finalPairs =
    roundRobin(state.finalists);

  state.finalIndex = 0;

  $("#betweenEyebrow").textContent =
    "12 → 9";

  $("#betweenTitle").textContent =
    "FINAL ROUND";

  $("#betweenText").textContent =
    "12人の完全総当たり。全66試合を通して、あなたの好きなお顔ベスト9を決めます。";

  $("#betweenBtn").textContent =
    "FINAL START";

  show("#screen-between");

  $("#betweenBtn").onclick = () => {

    show("#screen-match");

    updateMatchUI();
  };
}


/* =========================
   最終対決
========================= */

function updateMatchUI(){

  const pair =
    state.finalPairs[state.finalIndex];

  const total =
    state.finalPairs.length;

  $("#phaseLabel").textContent =
    "FINAL / ROUND ROBIN";

  $("#matchTitle").textContent =
    "12人・完全総当たり";

  $("#counter").textContent =
    `${state.finalIndex + 1} / ${total}`;

  $("#progressBar").style.width =
    `${(state.finalIndex / total) * 100}%`;

  setPerson(
    "left",
    pair[0]
  );

  setPerson(
    "right",
    pair[1]
  );
}


function chooseWinner(winner){

  const pair =
    state.finalPairs[state.finalIndex];

  const loser =
    pair[0].id === winner.id
      ? pair[1]
      : pair[0];

  state.finalScores.set(
    winner.id,
    (state.finalScores.get(winner.id) || 0) + 1
  );

  state.finalHistory.push({
    winner: winner.id,
    loser: loser.id
  });

  state.finalIndex++;

  if(
    state.finalIndex <
    state.finalPairs.length
  ){

    updateMatchUI();

  }else{

    finishFinal();
  }
}


/* =========================
   結果
========================= */

function finishFinal(){

  const scoreMap =
    state.finalScores;

  const rank =
    [...state.finalists].sort((a, b) => {

      const sa =
        scoreMap.get(a.id) || 0;

      const sb =
        scoreMap.get(b.id) || 0;

      if(sa !== sb){
        return sb - sa;
      }

      const direct =
        state.finalHistory.find(h =>
          (h.winner === a.id &&
           h.loser === b.id) ||
          (h.winner === b.id &&
           h.loser === a.id)
        );

      if(direct){

        return direct.winner === a.id
          ? -1
          : 1;
      }

      return a.name.localeCompare(
        b.name,
        "ja"
      );

    });

  state.ranking =
    rank.slice(0, 9);

  renderResult();
}


function renderResult(){

  const grid =
    $("#resultGrid");

  grid.innerHTML = "";

  state.ranking.forEach(
    (p, i) => {

      const el =
        document.createElement("article");

      el.className =
        "result-item";

      el.innerHTML = `
        <div class="result-rank">
          ${i + 1} / 9
        </div>

        <div class="result-photo">
          <img
            src="${imageFor(p)}"
            alt="${p.name}"
          >
        </div>

        <div class="result-name">
          ${p.name}
        </div>
      `;

      grid.appendChild(el);
    }
  );

  show("#screen-result");
}


/* =========================
   ボタン
========================= */

$("#startBtn").onclick = () => {

  init();

  startQual1();
};


$("#qual1NextBtn").onclick = () => {

  finishQual1Block();
};


$("#qual2NextBtn").onclick = () => {

  finishQual2Block();
};


$("#leftCard").onclick = () => {

  chooseWinner(
    state.finalPairs[
      state.finalIndex
    ][0]
  );
};


$("#rightCard").onclick = () => {

  chooseWinner(
    state.finalPairs[
      state.finalIndex
    ][1]
  );
};


$("#restartBtn").onclick = () => {

  init();

  startQual1();
};
