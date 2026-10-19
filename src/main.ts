import "./style.css";
import { Game, move, same, type Point } from "./model";
import { read, save, defaults, type Preferences } from "./storage";
import { icon, names, flower } from "./icons";

const $ = <T extends HTMLElement = HTMLElement>(s: string) =>
  document.querySelector<T>(s)!;
let prefs: Preferences = { ...defaults },
  storageError = false;
try {
  const r = read(localStorage);
  prefs = r.data;
  storageError = r.error;
} catch {
  storageError = true;
}
let game: Game,
  started = false,
  stage = 1,
  reaction = "idle",
  hint: Point[] = [];
let reactionTimer = 0,
  hintTimer = 0,
  routeTimer = 0,
  audio: AudioContext | undefined;
const testMode = new URLSearchParams(location.search).get("test") === "1";
let seed = 731;
let resultHandled = false;
$("#app").innerHTML = `
<header class="topbar"><a class="brand" href="./" aria-label="치비링크 홈"><span class="brand-flower">${flower}</span><span>chibi<span class="brand-light">link</span><small>모모의 작은 카페</small></span></a><div class="header-right"><span class="local-note"><i></i> 오늘도, 가볍게 한 판</span><button class="icon-button" id="sound" aria-label="소리 켜기">♪</button><button class="icon-button" id="settings" aria-label="설정">⚙</button></div></header>
<main><div class="page-heading"><div><p class="eyebrow">A LITTLE BREAK, A SWEET MATCH</p><h1>작은 연결, 달콤한 휴식<span>.</span></h1><p class="subtitle">같은 디저트를 이어보세요. 모모가 곁에서 응원할게요.</p></div><button id="how" class="text-button">게임 방법 <span>↗</span></button></div>
<div class="game-layout"><section class="game-panel" aria-label="사천성 게임"><div class="game-top"><button id="stage-picker" class="stage-button"><span class="stage-number">01</span><span><small>오늘의 디저트</small><strong id="stage-title">첫 번째 티타임</strong></span><span class="chevron">⌄</span></button><div class="mode-pill" id="mode-label">♧ 편안한 모드</div></div>
<div class="stats"><div><span>남은 패</span><strong id="remaining">36<small> / 36</small></strong></div><div><span id="time-label">플레이 시간</span><strong id="time">00:00</strong></div><div><span>스코어</span><strong id="score">0</strong></div><div class="combo-stat"><span>연속 연결</span><strong id="combo">0 <small>COMBO</small></strong></div></div>
<div class="board-area"><div id="board" role="group" aria-label="디저트 패"><svg id="route" aria-hidden="true"></svg></div><div id="cover" class="board-cover"><div class="cover-card"><span class="cover-flower">${flower}</span><p class="eyebrow">MOMO'S LITTLE CAFÉ</p><h2>잠깐 쉬어갈까요?</h2><p>같은 그림을 연결하고<br>나만의 작은 여유를 찾아보세요.</p><button class="primary" id="start">티타임 시작하기 <span>→</span></button><span class="cover-foot">시간에 쫓기지 않는 편안한 모드</span></div></div></div>
<div class="board-bottom"><span class="status-dot"></span><span id="notice" role="status">최대 두 번 꺾어서, 같은 디저트를 연결해요.</span></div>
<div class="controls"><button id="hint"><span>☀</span> 힌트 <kbd>H</kbd></button><button id="shuffle"><span>⤨</span> 섞기 <kbd>S</kbd></button><button id="pause"><span>Ⅱ</span> 일시정지 <kbd>P</kbd></button></div></section>
<aside class="companion"><div class="companion-top"><span class="eyebrow">YOUR LITTLE COMPANION</span><span class="sparkle">✧</span></div><div class="speech" aria-live="polite"><strong id="speech-title">어서 와요!</strong><p id="speech-text">따뜻한 차 한 잔처럼,<br>오늘도 편안하게 즐겨요.</p></div><div class="mascot-frame" id="mascot-frame"><img class="mascot-sprite" id="mascot" src="${import.meta.env.BASE_URL}assets/momo-idle.png" alt="미소 짓는 치비 캐릭터 모모"><span id="mascot-fallback" hidden>모모 ♡</span><span class="mascot-ground"></span></div><div class="companion-name"><span>모모</span><small>당신의 티타임 메이트</small></div><div class="little-tip"><span>✦ MOMO'S TIP</span><p>패 바깥쪽에도 길이 있어요.<br>조금 돌아가도 괜찮아요.</p><div class="tip-path">□ <i>└─────┘</i> □</div></div><div class="best-record"><span>나의 최고 점수</span><strong id="best">0 <small>pts</small></strong></div></aside></div>
<footer><span>MADE FOR YOUR SLOW MOMENTS</span><span>한 쌍씩, 천천히. <span class="footer-flower">✿</span></span></footer></main>
<dialog id="dialog"><button class="dialog-close icon-button" aria-label="닫기">×</button><div id="dialog-body"></div></dialog>`;
const stageNames = [
  "첫 번째 티타임",
  "딸기가 좋아",
  "마카롱 산책",
  "오후의 찻잔",
  "달콤한 약속",
  "작은 축하",
  "구름 위 디저트",
  "체리의 편지",
  "별빛 카페",
  "우리의 티타임",
];
function persist() {
  try {
    storageError = !save(localStorage, prefs);
  } catch {
    storageError = true;
  }
  if (storageError) notice("저장이 어려워요. 이번 게임은 계속 즐길 수 있어요.");
}
function notice(s: string) {
  $("#notice").textContent = s;
}
function react(name: string, title: string, body: string) {
  clearTimeout(reactionTimer);
  reaction = name;
  $("#mascot").setAttribute(
    "src",
    `${import.meta.env.BASE_URL}assets/momo-${name}.png`,
  );
  $("#mascot").setAttribute("alt", `모모: ${title}`);
  $("#speech-title").textContent = title;
  $("#speech-text").textContent = body;
  $("#mascot-frame").dataset.reaction = name;
  if (name !== "idle")
    reactionTimer = window.setTimeout(
      () => react("idle", "잘하고 있어요!", "한 쌍씩, 천천히 찾아봐요."),
      2400,
    );
}
$("#mascot").addEventListener("error", () => {
  $("#mascot").hidden = true;
  $("#mascot-fallback").hidden = false;
});
$("#mascot").addEventListener("load", () => {
  $("#mascot").hidden = false;
  $("#mascot-fallback").hidden = true;
});
function applyPrefs() {
  document.body.classList.toggle("no-character", !prefs.character);
  document.body.classList.toggle("no-motion", !prefs.motion);
  $("#sound").textContent = prefs.muted ? "♫̸" : "♪";
  $("#sound").setAttribute(
    "aria-label",
    prefs.muted ? "소리 켜기" : "소리 끄기",
  );
  $("#sound").setAttribute("aria-pressed", String(!prefs.muted));
  $("#best").innerHTML = `${prefs.best.toLocaleString()} <small>pts</small>`;
}
function sound() {
  if (prefs.muted) return;
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const t = audio.currentTime;
    for (const [i, f] of [523.25, 659.25].entries()) {
      const o = audio.createOscillator(),
        g = audio.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t + i * 0.07);
      g.gain.linearRampToValueAtTime(0.06, t + i * 0.07 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.22);
      o.connect(g).connect(audio.destination);
      o.start(t + i * 0.07);
      o.stop(t + i * 0.07 + 0.24);
      o.onended = () => {
        o.disconnect();
        g.disconnect();
      };
    }
  } catch {
    /* Audio is optional. */
  }
}
function clearEffects() {
  clearTimeout(hintTimer);
  clearTimeout(routeTimer);
  hint = [];
  $("#route").innerHTML = "";
}
function newGame(begin = false) {
  resultHandled = false;
  clearEffects();
  clearTimeout(reactionTimer);
  const compact = matchMedia("(max-width: 700px)").matches;
  game = new Game(
    seed++,
    stage,
    prefs.timed,
    () => performance.now(),
    compact ? 4 : 6,
    innerHeight < 500 && !compact ? 2 : innerHeight < 660 ? 4 : 6,
  );
  started = begin;
  $("#cover").hidden = begin;
  $("#board").classList.toggle("preview", !begin);
  $("#stage-title").textContent = stageNames[stage - 1];
  $(".stage-number").textContent = String(stage).padStart(2, "0");
  $("#mode-label").textContent = prefs.timed ? "◷ 도전 모드" : "♧ 편안한 모드";
  $("#time-label").textContent = prefs.timed ? "남은 시간" : "플레이 시간";
  $("#pause").innerHTML = "<span>Ⅱ</span> 일시정지 <kbd>P</kbd>";
  renderBoard();
  updateStats();
  react(
    begin ? "ready" : "idle",
    begin ? "준비됐나요?" : "어서 와요!",
    begin
      ? "같은 디저트를 두 개 골라봐요."
      : "따뜻한 차 한 잔처럼, 오늘도 편안하게 즐겨요.",
  );
  notice(
    stage === 1
      ? "같은 그림 두 개를 눌러요. 선은 두 번까지 꺾을 수 있어요."
      : "패 바깥쪽으로 돌아가는 길도 찾아보세요.",
  );
}
function renderBoard() {
  const active =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  const focused = active?.classList.contains("tile")
    ? { x: active.dataset.x, y: active.dataset.y }
    : null;
  const board = $("#board");
  board.style.setProperty("--cols", String(game.board.cols));
  board.style.setProperty("--rows", String(game.board.rows));
  board.querySelectorAll(".tile").forEach((e) => e.remove());
  game.board.cells.forEach((v, i) => {
    const p = { x: i % game.board.cols, y: Math.floor(i / game.board.cols) },
      el = document.createElement("button");
    el.className =
      "tile" +
      (!v ? " empty" : "") +
      (game.selected && same(p, game.selected) ? " selected" : "") +
      (hint.some((h) => same(h, p)) ? " hinted" : "");
    el.dataset.x = String(p.x);
    el.dataset.y = String(p.y);
    el.dataset.value = String(v);
    el.disabled = !v || !started || game.status !== "playing";
    el.setAttribute(
      "aria-label",
      `${p.y + 1}행 ${p.x + 1}열 ${v ? names[v - 1] : "빈 칸"}`,
    );
    el.setAttribute(
      "aria-pressed",
      String(!!game.selected && same(p, game.selected)),
    );
    el.innerHTML = v ? icon(v) : "";
    el.addEventListener("click", () => select(p));
    board.append(el);
  });
  if (focused) {
    const target =
      board.querySelector<HTMLButtonElement>(
        `.tile[data-x="${focused.x}"][data-y="${focused.y}"]:not(:disabled)`,
      ) ?? board.querySelector<HTMLButtonElement>(".tile:not(:disabled)");
    target?.focus({ preventScroll: true });
  }
  ["hint", "shuffle", "pause"].forEach((id) => {
    $<HTMLButtonElement>(`#${id}`).disabled =
      !started || game.status === "won" || game.status === "lost";
  });
}
function updateStats() {
  const left = game.board.cells.filter(Boolean).length;
  $("#remaining").innerHTML =
    `${left}<small> / ${game.board.cols * game.board.rows}</small>`;
  $("#score").textContent = game.score.toLocaleString();
  $("#combo").innerHTML = `${game.combo} <small>COMBO</small>`;
  const ms = game.timed ? game.remaining : game.elapsed;
  const seconds = game.timed ? Math.ceil(ms / 1000) : Math.floor(ms / 1000);
  $("#time").textContent =
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  $("#time").classList.toggle("urgent", game.timed && ms < 30000);
}
function drawRoute(route: Point[]) {
  const board = $("#board"),
    first = $<HTMLButtonElement>(".tile"),
    rect = board.getBoundingClientRect(),
    tile = first.getBoundingClientRect(),
    gap = parseFloat(getComputedStyle(board).gap);
  const coords = route.map(
    (p) =>
      `${tile.left - rect.left + tile.width / 2 + p.x * (tile.width + gap)},${tile.top - rect.top + tile.height / 2 + p.y * (tile.height + gap)}`,
  );
  const svg = $("#route");
  svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
  svg.innerHTML = `<polyline points="${coords.join(" ")}"/>`;
  clearTimeout(routeTimer);
  routeTimer = window.setTimeout(() => (svg.innerHTML = ""), 500);
}
function select(p: Point) {
  if (!started) return;
  const before = game.status;
  const result = game.select(p);
  hint = [];
  renderBoard();
  updateStats();
  if (result.kind === "match") {
    if (result.route) drawRoute(result.route);
    sound();
    react(
      game.combo > 1 ? "excited" : "pleased",
      game.combo > 1 ? `${game.combo}콤보! 멋져요!` : "달콤한 한 쌍!",
      "다음 디저트도 찾아볼까요?",
    );
    notice(
      result.reshuffled
        ? "남은 길이 없어 패를 자동으로 섞었어요. 다시 이어볼까요?"
        : "좋아요! 다음 한 쌍을 찾아보세요.",
    );
  } else if (result.kind === "invalid") {
    react(
      "puzzled",
      "다른 길이 있을까요?",
      "같은 그림을 두 번 이하로 꺾어서 연결해요.",
    );
    notice("아직 연결할 수 없는 패예요. 다른 짝을 찾아보세요.");
  }
  if (
    game.status !== before &&
    (game.status === "won" || game.status === "lost")
  )
    finish();
}
function showDialog(content: string) {
  $("#dialog-body").innerHTML = content;
  $<HTMLDialogElement>("#dialog").showModal();
}
function finish() {
  if (resultHandled) return;
  resultHandled = true;
  clearEffects();
  renderBoard();
  if (game.status === "won") {
    prefs.best = Math.max(prefs.best, game.score);
    prefs.stage = Math.max(prefs.stage, Math.min(10, stage + 1));
    persist();
    applyPrefs();
    react("clear", "오늘도 잘했어요!", "당신 덕분에 달콤한 티타임이 됐어요.");
  } else react("sad", "잠깐 쉬어가도 괜찮아요.", "우리 다시 한번 해볼까요?");
  showDialog(
    `<p class="eyebrow">${game.status === "won" ? "SWEET LITTLE VICTORY" : "ANOTHER CUP?"}</p><h2>${game.status === "won" ? "티타임 완성!" : "시간이 다 되었어요"}</h2><p>${stageNames[stage - 1]} · ${game.pairs}쌍 연결</p><div class="result-score">${game.score.toLocaleString()}<small>POINTS</small></div><p>힌트 ${game.hintCount}회 · 섞기 ${game.shuffles}회</p><button class="primary" id="next">${game.status === "won" && stage < 10 ? "다음 티타임 →" : "다시 즐기기 →"}</button><button class="text-button" id="result-menu">처음으로</button>`,
  );
  $("#next").onclick = () => {
    if (game.status === "won" && stage < 10) stage++;
    closeDialog();
    newGame(true);
  };
  $("#result-menu").onclick = () => {
    closeDialog();
    newGame(false);
  };
}
function closeDialog() {
  $<HTMLDialogElement>("#dialog").close();
}
function pause() {
  if (!started || game.status !== "playing") return;
  game.pause();
  clearEffects();
  renderBoard();
  showDialog(
    '<p class="eyebrow">TAKE YOUR TIME</p><h2>잠깐의 쉼표</h2><p>차가 식기 전에, 돌아와도 좋아요.<br>시간은 잠시 멈춰둘게요.</p><button class="primary" id="resume">계속하기 →</button><button class="text-button" id="restart">다시 시작</button>',
  );
  $("#resume").onclick = () => {
    closeDialog();
    game.resume();
    renderBoard();
  };
  $("#restart").onclick = () => {
    closeDialog();
    newGame(true);
  };
}
$(".dialog-close").onclick = closeDialog;
$("#dialog").addEventListener("close", () => {
  if (started && game.status === "paused") {
    game.resume();
    renderBoard();
  }
});
$("#start").onclick = () => newGame(true);
$("#pause").onclick = pause;
$("#hint").onclick = () => {
  const p = game.hint();
  if (p) {
    hint = p;
    renderBoard();
    react("ready", "여기를 살펴봐요!", "반짝이는 두 패를 연결해보세요.");
    notice("테두리가 빛나는 두 패를 눌러보세요.");
    clearTimeout(hintTimer);
    hintTimer = window.setTimeout(() => {
      hint = [];
      renderBoard();
    }, 3000);
  }
};
$("#shuffle").onclick = () => {
  clearEffects();
  if (game.shuffle()) {
    renderBoard();
    react("pleased", "새로운 기분으로!", "모든 디저트의 짝을 다시 배치했어요.");
    notice("남은 패를 풀 수 있는 배열로 섞었어요.");
  }
};
$("#sound").onclick = () => {
  prefs.muted = !prefs.muted;
  persist();
  applyPrefs();
  if (!prefs.muted) sound();
};
function interruptForDialog() {
  if (started && game.status === "playing") {
    game.pause();
    clearEffects();
    renderBoard();
  }
}
$("#settings").onclick = () => {
  interruptForDialog();
  showDialog(
    `<p class="eyebrow">MAKE YOURSELF AT HOME</p><h2>나의 티타임 설정</h2><label class="setting">도전 모드 <input type="checkbox" id="timed-setting" ${prefs.timed ? "checked" : ""}></label><p class="fine-print">모드는 다음 게임부터 적용돼요.</p><label class="setting">모모 표시 <input type="checkbox" id="character-setting" ${prefs.character ? "checked" : ""}></label><label class="setting">캐릭터 움직임 <input type="checkbox" id="motion-setting" ${prefs.motion ? "checked" : ""}></label><label class="setting">효과음 <input type="checkbox" id="audio-setting" ${!prefs.muted ? "checked" : ""}></label><button class="primary" id="settings-done">저장하고 돌아가기</button>`,
  );
  $("#settings-done").onclick = () => {
    prefs.timed = $<HTMLInputElement>("#timed-setting").checked;
    prefs.character = $<HTMLInputElement>("#character-setting").checked;
    prefs.motion = $<HTMLInputElement>("#motion-setting").checked;
    prefs.muted = !$<HTMLInputElement>("#audio-setting").checked;
    persist();
    applyPrefs();
    closeDialog();
    if (!started) newGame(false);
  };
};
$("#how").onclick = () => {
  interruptForDialog();
  showDialog(
    `<p class="eyebrow">A SIMPLE LITTLE RITUAL</p><h2>이렇게 즐겨요</h2><ol class="instructions"><li><strong>같은 그림 두 개를 골라요.</strong><p>마우스, 터치 또는 Tab과 Enter로 선택하세요.</p></li><li><strong>선은 두 번까지 꺾을 수 있어요.</strong><p>다른 패를 통과할 수 없지만, 보드 바깥으로 돌아갈 수 있어요.</p></li><li><strong>모두 연결하면 티타임 완성!</strong><p>막히면 힌트(H)와 섞기(S), 잠깐 쉴 땐 일시정지(P)를 눌러요.</p></li></ol><button class="primary" id="understood">알겠어요 →</button>`,
  );
  $("#understood").onclick = closeDialog;
};
$("#stage-picker").onclick = () => {
  interruptForDialog();
  showDialog(
    `<p class="eyebrow">TEN SWEET MOMENTS</p><h2>오늘의 티타임</h2><div class="stage-grid">${stageNames.map((name, i) => `<button data-stage="${i + 1}" ${i + 1 > prefs.stage ? "disabled" : ""}><strong>${String(i + 1).padStart(2, "0")}</strong><small>${i + 1 > prefs.stage ? "아직 준비 중" : name}</small></button>`).join("")}</div><p class="fine-print">한 스테이지를 마치면 다음 티타임이 열려요.</p>`,
  );
  document.querySelectorAll<HTMLButtonElement>("[data-stage]").forEach(
    (el) =>
      (el.onclick = () => {
        stage = Number(el.dataset.stage);
        closeDialog();
        newGame(true);
      }),
  );
};
document.addEventListener("keydown", (e) => {
  if (
    $<HTMLDialogElement>("#dialog").open ||
    e.repeat ||
    e.altKey ||
    e.ctrlKey ||
    e.metaKey ||
    e.target instanceof HTMLInputElement
  )
    return;
  const id = (
    { h: "hint", s: "shuffle", p: "pause" } as Record<string, string>
  )[e.key.toLowerCase()];
  if (id && started) {
    e.preventDefault();
    $<HTMLButtonElement>("#" + id).click();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
window.addEventListener("orientationchange", () => {
  pause();
  clearEffects();
});
window.addEventListener("resize", () => {
  $("#route").innerHTML = "";
});
setInterval(() => {
  if (!started) return;
  game.tick();
  updateStats();
  if (game.status === "lost" || game.status === "won") finish();
}, 100);
applyPrefs();
newGame();
if (storageError)
  notice("저장한 설정을 읽지 못했어요. 기본 설정으로 시작합니다.");
if (testMode) {
  Object.assign(window, {
    __CHIBILINK__: {
      drawRoute: (route: Point[]) => drawRoute(route),
      snapshot: () => ({
        board: game.board,
        status: game.status,
        score: game.score,
        elapsed: game.elapsed,
        remaining: game.remaining,
        selected: game.selected,
        reaction,
        started,
      }),
      move: () => move(game.board),
      expression: (name: string) => {
        if (
          [
            "idle",
            "excited",
            "pleased",
            "puzzled",
            "worried",
            "sad",
            "clear",
            "ready",
            "blink",
          ].includes(name)
        )
          react(name, "표정 확인", "패딩 검증");
      },
      fixture: (name: string) => {
        if (name === "won" || name === "lost") {
          started = true;
          game.status = name;
          finish();
        }
      },
    },
  });
}
