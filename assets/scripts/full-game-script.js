"use strict";

// ======================================
// CONFIGURATION
// ======================================

const CONFIG = {
  maxLevel: 5,

  maxHealth: 3,

  wormLength: 7,

  wormGap: 15,

  comboTime: 2200,

  levelGoals: [50, 120, 220, 350, 500],

  difficulties: {
    chill: {
      name: "Chill",
      hazards: 2,
      enemySpeed: 0.7,
      multiplier: 0.8,
    },

    normal: {
      name: "Normal",
      hazards: 3,
      enemySpeed: 1,
      multiplier: 1,
    },

    chaos: {
      name: "Chaos",
      hazards: 5,
      enemySpeed: 1.5,
      multiplier: 1.4,
    },
  },
};

// ======================================
// GAME STATE
// ======================================

let game = {
  player: "",

  score: 0,

  health: 3,

  level: 1,

  combo: 1,

  bestCombo: 1,

  pears: 0,

  goldenPears: 0,

  hits: 0,

  shield: false,

  running: false,

  paused: false,

  ended: false,

  startTime: 0,

  pauseTime: 0,

  pausedAmount: 0,

  lastFoodTime: 0,

  lastDamageTime: 0,

  difficulty: "normal",

  targetX: 150,

  targetY: 250,

  worm: [],

  foods: [],

  hazards: [],

  powerups: [],
};

// ======================================
// KEYBOARD
// ======================================

const keys = new Set();

// ======================================
// STORAGE KEYS
// ======================================

const PLAYER_KEY = "wormPlayer";

const LEADERBOARD_KEY = "wormLeaderboard";

const HISTORY_KEY = "wormHistory";

// ======================================
// DEFAULT LEADERBOARD
// ======================================

const defaultLeaderboard = [
  {
    name: "WormKing",
    score: 850,
  },

  {
    name: "PearDestroyer",
    score: 720,
  },

  {
    name: "Guest404",
    score: 560,
  },

  {
    name: "SirWiggles",
    score: 430,
  },

  {
    name: "CompostBoss",
    score: 350,
  },
];

// ======================================
// STORAGE FUNCTIONS
// ======================================

function loadStorage(key, defaultValue) {
  const storedValue = sessionStorage.getItem(key);

  if (storedValue === null) {
    return defaultValue;
  }

  try {
    return JSON.parse(storedValue);
  } catch {
    return defaultValue;
  }
}

function saveStorage(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

// ======================================
// RANDOM GUEST NAME
// ======================================

function createGuestName() {
  const words = ["Wiggly", "Speedy", "Sneaky", "Hungry", "Mighty", "Tiny"];

  const secondWords = ["Worm", "Crawler", "Noodle", "Digger", "Pear"];

  const first = words[Math.floor(Math.random() * words.length)];

  const second = secondWords[Math.floor(Math.random() * secondWords.length)];

  const number = Math.floor(Math.random() * 900) + 100;

  return first + second + number;
}

// ======================================
// PLAYER NAME
// ======================================

function setPlayerName() {
  let name = $("#playerName").val().trim();

  if (name === "") {
    name = createGuestName();
  }

  name = name.replace(/[<>]/g, "").substring(0, 18);

  game.player = name;

  $("#playerName").val(name);

  $("#greeting").text("Welcome, " + name + "!");

  sessionStorage.setItem(PLAYER_KEY, name);

  updatePlayerStats();
}

// ======================================
// BROWSER INFORMATION
// ======================================

function getBrowser() {
  const agent = navigator.userAgent;

  if (agent.includes("Edg")) {
    return "Edge";
  }

  if (agent.includes("OPR")) {
    return "Opera";
  }

  if (agent.includes("Chrome")) {
    return "Chrome";
  }

  if (agent.includes("Firefox")) {
    return "Firefox";
  }

  if (agent.includes("Safari")) {
    return "Safari";
  }

  return "Unknown";
}

// ======================================
// CLOCK
// ======================================

function updateClock() {
  const now = new Date();

  $("#dateTime").text(now.toLocaleString());
}

// ======================================
// LEADERBOARD
// ======================================

function renderLeaderboard() {
  let leaderboard = loadStorage(LEADERBOARD_KEY, defaultLeaderboard);

  leaderboard.sort(function (a, b) {
    return b.score - a.score;
  });

  leaderboard = leaderboard.slice(0, 5);

  $("#leaderboardList").empty();

  leaderboard.forEach(function (player) {
    const row = $("<div>").addClass("leaderboard-row");

    $("<span>").text(player.name).appendTo(row);

    $("<strong>").text(player.score).appendTo(row);

    $("<li>").append(row).appendTo("#leaderboardList");
  });
}

// ======================================
// HISTORY
// ======================================

function renderHistory() {
  const history = loadStorage(HISTORY_KEY, []);

  $("#runHistory").empty();

  if (history.length === 0) {
    $("#runHistory").html("<p>No runs yet.</p>");

    return;
  }

  history
    .slice()
    .reverse()
    .slice(0, 5)
    .forEach(function (run) {
      const row = $("<div>").addClass("history-row");

      $("<strong>")
        .text(run.result + " - " + run.score + " points")
        .appendTo(row);

      $("<div>")
        .text("Level " + run.level + " | " + run.difficulty)
        .appendTo(row);

      row.appendTo("#runHistory");
    });
}

// ======================================
// PLAYER SESSION INFORMATION
// ======================================

function updatePlayerStats() {
  const history = loadStorage(HISTORY_KEY, []);

  let best = 0;

  history.forEach(function (run) {
    if (run.player === game.player) {
      if (run.score > best) {
        best = run.score;
      }
    }
  });

  $("#bestScore").text(best);

  $("#runCount").text(history.length);

  $("#browserInfo").text(getBrowser());
}

// ======================================
// BOARD INFORMATION
// ======================================

function boardWidth() {
  return $("#gameBoard").innerWidth();
}

function boardHeight() {
  return $("#gameBoard").innerHeight();
}

// ======================================
// RANDOM BOARD POSITION
// ======================================

function randomPosition() {
  const margin = 50;

  return {
    x: margin + Math.random() * (boardWidth() - margin * 2),

    y: margin + Math.random() * (boardHeight() - margin * 2),
  };
}

// ======================================
// WORM
// ======================================

function buildWorm() {
  game.worm = [];

  $("#worm").empty();

  const startX = boardWidth() * 0.25;

  const startY = boardHeight() / 2;

  for (let i = 0; i < CONFIG.wormLength; i++) {
    game.worm.push({
      x: startX - i * CONFIG.wormGap,

      y: startY,
    });

    const segment = $("<div>").addClass("worm-segment").attr("data-index", i);

    if (i === 0) {
      segment.addClass("head");
    }

    segment.appendTo("#worm");
  }

  game.targetX = startX;

  game.targetY = startY;

  drawWorm();
}

// ======================================
// DRAW WORM
// ======================================

function drawWorm() {
  game.worm.forEach(function (segment, index) {
    $(".worm-segment[data-index='" + index + "']").css({
      left: segment.x + "px",

      top: segment.y + "px",
    });
  });
}

// ======================================
// WORM MOVEMENT
// ======================================

function moveWorm(delta) {
  if (game.worm.length === 0) {
    return;
  }

  const head = game.worm[0];

  const keyboardSpeed = 280;

  if (keys.has("ArrowLeft") || keys.has("a")) {
    game.targetX -= keyboardSpeed * delta;
  }

  if (keys.has("ArrowRight") || keys.has("d")) {
    game.targetX += keyboardSpeed * delta;
  }

  if (keys.has("ArrowUp") || keys.has("w")) {
    game.targetY -= keyboardSpeed * delta;
  }

  if (keys.has("ArrowDown") || keys.has("s")) {
    game.targetY += keyboardSpeed * delta;
  }

  game.targetX = Math.max(20, Math.min(boardWidth() - 20, game.targetX));

  game.targetY = Math.max(20, Math.min(boardHeight() - 20, game.targetY));

  const dx = game.targetX - head.x;

  const dy = game.targetY - head.y;

  const length = Math.hypot(dx, dy);

  const speed = 320;

  if (length > 1) {
    const amount = Math.min(speed * delta, length);

    head.x += (dx / length) * amount;

    head.y += (dy / length) * amount;
  }

  for (let i = 1; i < game.worm.length; i++) {
    const previous = game.worm[i - 1];

    const current = game.worm[i];

    const differenceX = previous.x - current.x;

    const differenceY = previous.y - current.y;

    const distance = Math.hypot(differenceX, differenceY);

    if (distance > CONFIG.wormGap) {
      const pull = distance - CONFIG.wormGap;

      current.x += (differenceX / distance) * pull;

      current.y += (differenceY / distance) * pull;
    }
  }

  drawWorm();
}

// ======================================
// GROW WORM
// ======================================

function growWorm(amount) {
  for (let i = 0; i < amount; i++) {
    const tail = game.worm[game.worm.length - 1];

    game.worm.push({
      x: tail.x,

      y: tail.y,
    });

    $("<div>")
      .addClass("worm-segment")
      .attr("data-index", game.worm.length - 1)
      .appendTo("#worm");
  }
}

// ======================================
// CREATE PEAR
// ======================================

function createPear(golden) {
  const position = randomPosition();

  const id = "food" + Date.now() + Math.random();

  const food = {
    id: id,

    x: position.x,

    y: position.y,

    golden: golden,
  };

  game.foods.push(food);

  const element = $("<div>")
    .attr("id", id)
    .addClass("game-object food")
    .css({
      left: position.x + "px",

      top: position.y + "px",
    });

  if (golden) {
    element.addClass("golden-food").text("✨");
  } else {
    element.text("🍐");
  }

  element.appendTo("#foodLayer");
}

// ======================================
// CREATE HAZARD
// ======================================

function createHazard(moving) {
  const position = randomPosition();

  const id = "hazard" + Date.now() + Math.random();

  const angle = Math.random() * Math.PI * 2;

  const hazard = {
    id: id,

    x: position.x,

    y: position.y,

    moving: moving,

    vx: Math.cos(angle) * 80,

    vy: Math.sin(angle) * 80,
  };

  game.hazards.push(hazard);

  const element = $("<div>")
    .attr("id", id)
    .css({
      left: position.x + "px",

      top: position.y + "px",
    });

  if (moving) {
    element.addClass("moving-hazard").text("🦂");
  } else {
    element.addClass("game-object hazard").text("💥");
  }

  element.appendTo("#hazardLayer");
}

// ======================================
// CREATE POWERUP
// ======================================

function createPowerup(type) {
  const position = randomPosition();

  const id = "power" + Date.now() + Math.random();

  const powerup = {
    id: id,

    type: type,

    x: position.x,

    y: position.y,
  };

  game.powerups.push(powerup);

  const icon = type === "shield" ? "🛡️" : "💚";

  $("<div>")
    .attr("id", id)
    .addClass("game-object powerup")
    .text(icon)
    .css({
      left: position.x + "px",

      top: position.y + "px",
    })
    .appendTo("#powerupLayer");
}

// ======================================
// CLEAR OBJECTS
// ======================================

function clearObjects() {
  game.foods = [];

  game.hazards = [];

  game.powerups = [];

  $("#foodLayer").empty();

  $("#hazardLayer").empty();

  $("#powerupLayer").empty();

  $("#particleLayer").empty();
}

// ======================================
// SPAWN LEVEL
// ======================================

function spawnLevel() {
  clearObjects();

  createPear(false);

  if (game.level >= 2) {
    createPear(true);
  }

  const difficulty = CONFIG.difficulties[game.difficulty];

  const hazardCount = difficulty.hazards + game.level - 1;

  for (let i = 0; i < hazardCount; i++) {
    const moving = game.level >= 3 && i < game.level - 1;

    createHazard(moving);
  }

  if (game.level >= 2) {
    createPowerup("shield");
  }

  if (game.level >= 3) {
    createPowerup("heal");
  }
}

// ======================================
// DISTANCE
// ======================================

function getDistance(x1, y1, x2, y2) {
  return Math.hypot(
    x1 - x2,

    y1 - y2,
  );
}

// ======================================
// FOOD COLLISION
// ======================================

function checkFoodCollision() {
  const head = game.worm[0];

  if (!head) {
    return;
  }

  game.foods.slice().forEach(function (food) {
    const distance = getDistance(
      head.x,

      head.y,

      food.x,

      food.y,
    );

    if (distance < 35) {
      eatFood(food);
    }
  });
}

// ======================================
// EAT FOOD
// ======================================

function eatFood(food) {
  const currentTime = performance.now();

  game.foods = game.foods.filter(function (item) {
    return item.id !== food.id;
  });

  const foodElement = document.getElementById(food.id);

  if (foodElement) {
    foodElement.remove();
  }

  if (currentTime - game.lastFoodTime < CONFIG.comboTime) {
    game.combo++;
  } else {
    game.combo = 1;
  }

  if (game.combo > 5) {
    game.combo = 5;
  }

  game.bestCombo = Math.max(
    game.bestCombo,

    game.combo,
  );

  game.lastFoodTime = currentTime;

  const difficulty = CONFIG.difficulties[game.difficulty];

  let points = food.golden ? 30 : 10;

  points = Math.round(points * game.combo * difficulty.multiplier);

  game.score += points;

  if (food.golden) {
    game.goldenPears++;

    growWorm(2);

    createParticles(food.x, food.y, "✨");

    playSound(850);
  } else {
    game.pears++;

    growWorm(1);

    createParticles(food.x, food.y, "🍃");

    playSound(600);
  }

  $("#score").effect("highlight", 300);

  $("#liveMessage").text("+" + points + " points! Combo x" + game.combo);

  setTimeout(
    function () {
      if (game.running && !game.ended) {
        createPear(food.golden);
      }
    },
    food.golden ? 1500 : 500,
  );

  const random = Math.random();

  if (random < 0.07) {
    createPowerup("shield");
  }

  if (random > 0.93 && game.health < CONFIG.maxHealth) {
    createPowerup("heal");
  }

  checkLevel();
}

// ======================================
// HAZARD COLLISION
// ======================================

function checkHazardCollision() {
  const head = game.worm[0];

  if (!head) {
    return;
  }

  const now = performance.now();

  if (now - game.lastDamageTime < 1000) {
    return;
  }

  for (const hazard of game.hazards) {
    const distance = getDistance(
      head.x,

      head.y,

      hazard.x,

      hazard.y,
    );

    if (distance < 35) {
      damagePlayer(hazard);

      break;
    }
  }
}

// ======================================
// DAMAGE
// ======================================

function damagePlayer(hazard) {
  game.lastDamageTime = performance.now();

  if (game.shield) {
    game.shield = false;

    $("#liveMessage").text("Shield blocked the damage!");

    createParticles(
      hazard.x,

      hazard.y,

      "🛡️",
    );

    playSound(350);

    return;
  }

  game.health--;

  game.hits++;

  game.combo = 1;

  $("#gameBoard").addClass("damage");

  setTimeout(function () {
    $("#gameBoard").removeClass("damage");
  }, 300);

  $("#worm").effect(
    "shake",
    {
      distance: 10,
    },
    350,
  );

  $("#liveMessage").text("Ouch! HP remaining: " + game.health);

  playSound(150);

  if (game.health <= 0) {
    endGame(false);
  }
}

// ======================================
// POWERUP COLLISION
// ======================================

function checkPowerups() {
  const head = game.worm[0];

  if (!head) {
    return;
  }

  game.powerups.slice().forEach(function (powerup) {
    const distance = getDistance(
      head.x,

      head.y,

      powerup.x,

      powerup.y,
    );

    if (distance < 35) {
      collectPowerup(powerup);
    }
  });
}

// ======================================
// COLLECT POWERUP
// ======================================

function collectPowerup(powerup) {
  game.powerups = game.powerups.filter(function (item) {
    return item.id !== powerup.id;
  });

  const powerupElement = document.getElementById(powerup.id);

  if (powerupElement) {
    powerupElement.remove();
  }

  if (powerup.type === "shield") {
    game.shield = true;

    $("#liveMessage").text("Shield collected! Next hit is blocked.");
  }

  if (powerup.type === "heal") {
    if (game.health < CONFIG.maxHealth) {
      game.health++;

      $("#liveMessage").text("Health restored!");
    } else {
      game.score += 20;

      $("#liveMessage").text("Full HP! +20 bonus points.");
    }
  }

  playSound(700);
}

// ======================================
// MOVING HAZARDS
// ======================================

function moveHazards(delta) {
  const difficulty = CONFIG.difficulties[game.difficulty];

  game.hazards.forEach(function (hazard) {
    if (!hazard.moving) {
      return;
    }

    hazard.x += hazard.vx * difficulty.enemySpeed * delta;

    hazard.y += hazard.vy * difficulty.enemySpeed * delta;

    if (hazard.x < 20 || hazard.x > boardWidth() - 20) {
      hazard.vx *= -1;
    }

    if (hazard.y < 20 || hazard.y > boardHeight() - 20) {
      hazard.vy *= -1;
    }

    $("#" + hazard.id).css({
      left: hazard.x + "px",

      top: hazard.y + "px",
    });
  });
}

// ======================================
// PARTICLES
// ======================================

function createParticles(x, y, icon) {
  for (let i = 0; i < 6; i++) {
    const particle = $("<div>")
      .addClass("particle")
      .text(icon)
      .css({
        left: x + Math.random() * 30 + "px",

        top: y + Math.random() * 20 + "px",
      });

    particle.appendTo("#particleLayer");

    setTimeout(function () {
      particle.remove();
    }, 700);
  }
}

// ======================================
// LEVEL SYSTEM
// ======================================

function checkLevel() {
  const goal = CONFIG.levelGoals[game.level - 1];

  if (game.score < goal) {
    return;
  }

  if (game.level === CONFIG.maxLevel) {
    endGame(true);

    return;
  }

  game.running = false;

  const oldLevel = game.level;

  game.level++;

  $("#levelModalText").text(
    "Level " + oldLevel + " cleared! Welcome to Level " + game.level + ".",
  );

  const modal = new bootstrap.Modal(document.getElementById("levelModal"));

  modal.show();
}

// ======================================
// CONTINUE LEVEL
// ======================================

function continueLevel() {
  buildWorm();

  spawnLevel();

  game.running = true;

  $("#liveMessage").text("Level " + game.level + " begins!");
}

// ======================================
// HUD
// ======================================

function updateHUD() {
  let hearts = "";

  for (let i = 0; i < CONFIG.maxHealth; i++) {
    if (i < game.health) {
      hearts += "♥ ";
    } else {
      hearts += "♡ ";
    }
  }

  $("#health").text(hearts);

  $("#score").text(game.score);

  $("#level").text(game.level + " / " + CONFIG.maxLevel);

  $("#combo").text("x" + game.combo);

  $("#combo").toggleClass("hotCombo", game.combo >= 3);

  $("#shieldStatus").text(game.shield ? "ON" : "OFF");

  $("#shieldStatus").toggleClass("shieldOn", game.shield);

  const goal = CONFIG.levelGoals[game.level - 1];

  const previousGoal = game.level === 1 ? 0 : CONFIG.levelGoals[game.level - 2];

  const progress = ((game.score - previousGoal) / (goal - previousGoal)) * 100;

  $("#levelProgress").css(
    "width",

    Math.max(0, Math.min(100, progress)) + "%",
  );

  $("#levelGoalText").text(
    "Level Goal: " +
      Math.max(0, game.score - previousGoal) +
      " / " +
      (goal - previousGoal),
  );

  $("#difficultyText").text(
    "Difficulty: " + CONFIG.difficulties[game.difficulty].name,
  );

  $("#modalPlayer").text(game.player);

  $("#modalScore").text(game.score);

  $("#modalLevel").text(game.level);

  $("#modalPears").text(game.pears);

  $("#modalGolden").text(game.goldenPears);

  $("#modalHits").text(game.hits);

  $("#modalCombo").text("x" + game.bestCombo);

  $("#timer").text(getGameTime());
}

// ======================================
// GAME TIMER
// ======================================

function getGameTime() {
  if (game.startTime === 0) {
    return "00:00";
  }

  let currentTime = performance.now();

  if (game.paused) {
    currentTime = game.pauseTime;
  }

  const seconds = Math.floor(
    (currentTime - game.startTime - game.pausedAmount) / 1000,
  );

  const minutes = Math.floor(seconds / 60);

  const remaining = seconds % 60;

  return (
    String(minutes).padStart(2, "0") + ":" + String(remaining).padStart(2, "0")
  );
}

// ======================================
// RESET STATE
// ======================================

function resetState() {
  game.score = 0;

  game.health = CONFIG.maxHealth;

  game.level = 1;

  game.combo = 1;

  game.bestCombo = 1;

  game.pears = 0;

  game.goldenPears = 0;

  game.hits = 0;

  game.shield = false;

  game.running = false;

  game.paused = false;

  game.ended = false;

  game.startTime = 0;

  game.pauseTime = 0;

  game.pausedAmount = 0;

  game.lastFoodTime = 0;

  clearObjects();

  buildWorm();

  $("#worm").hide();

  $("#pauseBtn").prop("disabled", true);

  $("#difficulty").prop("disabled", false);

  updateHUD();
}

// ======================================
// START GAME
// ======================================

function startGame() {
  if (game.player === "") {
    setPlayerName();
  }

  resetState();

  game.difficulty = $("#difficulty").val();

  game.running = true;

  game.startTime = performance.now();

  $("#difficulty").prop("disabled", true);

  $("#pauseBtn").prop("disabled", false);

  $("#boardMessage").fadeOut();

  $("#worm").show();

  spawnLevel();

  $("#liveMessage").text("Go, " + game.player + "!");

  $("#gameBoard").focus();
}

// ======================================
// PAUSE GAME
// ======================================

function pauseGame() {
  if (game.startTime === 0 || game.ended) {
    return;
  }

  if (!game.paused) {
    game.paused = true;

    game.running = false;

    game.pauseTime = performance.now();

    $("#pauseBtn").html('<i class="bi bi-play-fill"></i> Resume');

    $("#boardMessage")
      .html("<h2>Paused</h2>" + "<p>Press Space or Resume.</p>")
      .fadeIn();
  } else {
    game.pausedAmount += performance.now() - game.pauseTime;

    game.paused = false;

    game.running = true;

    $("#pauseBtn").html('<i class="bi bi-pause-fill"></i> Pause');

    $("#boardMessage").fadeOut();
  }
}

// ======================================
// END GAME
// ======================================

function endGame(won) {
  if (game.ended) {
    return;
  }

  game.running = false;

  game.ended = true;

  saveRun(won ? "WIN" : "LOSS");

  $("#finalScore").text(game.score);

  if (won) {
    $("#endGameIcon").text("🏆");

    $("#endGameTitle").text("YOU WIN!");

    $("#endGameMessage").text(game.player + " conquered the Pear Kingdom!");

    playSound(900);
  } else {
    $("#endGameIcon").text("💀");

    $("#endGameTitle").text("GAME OVER");

    $("#endGameMessage").text(
      game.player + " was defeated on Level " + game.level + ".",
    );
  }

  const modal = new bootstrap.Modal(document.getElementById("endGameModal"));

  modal.show();
}

// ======================================
// SAVE RUN
// ======================================

function saveRun(result) {
  const history = loadStorage(HISTORY_KEY, []);

  history.push({
    player: game.player,

    score: game.score,

    level: game.level,

    result: result,

    difficulty: CONFIG.difficulties[game.difficulty].name,
  });

  saveStorage(
    HISTORY_KEY,

    history.slice(-20),
  );

  const leaderboard = loadStorage(
    LEADERBOARD_KEY,

    defaultLeaderboard,
  );

  leaderboard.push({
    name: game.player,

    score: game.score,
  });

  leaderboard.sort(function (a, b) {
    return b.score - a.score;
  });

  saveStorage(
    LEADERBOARD_KEY,

    leaderboard.slice(0, 10),
  );

  renderLeaderboard();

  renderHistory();

  updatePlayerStats();
}

// ======================================
// HINT
// ======================================

function showHint() {
  if (game.foods.length === 0) {
    $("#liveMessage").text("Start the game first!");

    return;
  }

  const head = game.worm[0];

  let nearest = game.foods[0];

  game.foods.forEach(function (food) {
    const currentDistance = getDistance(
      head.x,

      head.y,

      food.x,

      food.y,
    );

    const nearestDistance = getDistance(
      head.x,

      head.y,

      nearest.x,

      nearest.y,
    );

    if (currentDistance < nearestDistance) {
      nearest = food;
    }
  });

  $("#" + nearest.id).effect(
    "pulsate",
    {
      times: 4,
    },
    1000,
  );

  $("#liveMessage").text("The nearest food has been highlighted!");
}

// ======================================
// SOUND
// ======================================

function playSound(frequency) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    const context = new AudioContext();

    const oscillator = context.createOscillator();

    const gain = context.createGain();

    oscillator.connect(gain);

    gain.connect(context.destination);

    oscillator.frequency.value = frequency;

    gain.gain.value = 0.04;

    oscillator.start();

    oscillator.stop(context.currentTime + 0.08);
  } catch {
    // Sound is optional.
  }
}

// ======================================
// MOUSE MOVEMENT
// ======================================

$("#gameBoard").mousemove(function (event) {
  if (!game.running) {
    return;
  }

  const offset = $("#gameBoard").offset();

  game.targetX = event.pageX - offset.left;

  game.targetY = event.pageY - offset.top;
});

// ======================================
// KEYBOARD
// ======================================

$(document).keydown(function (event) {
  let key = event.key;

  if (key.length === 1) {
    key = key.toLowerCase();
  }

  keys.add(key);

  if (event.code === "Space") {
    if (document.activeElement !== $("#playerName")[0]) {
      event.preventDefault();

      pauseGame();
    }
  }
});

$(document).keyup(function (event) {
  let key = event.key;

  if (key.length === 1) {
    key = key.toLowerCase();
  }

  keys.delete(key);
});

// ======================================
// GAME LOOP
// ======================================

let lastFrame = performance.now();

function gameLoop(time) {
  const delta = Math.min(
    (time - lastFrame) / 1000,

    0.04,
  );

  lastFrame = time;

  if (game.running && !game.paused && !game.ended) {
    moveWorm(delta);

    moveHazards(delta);

    checkFoodCollision();

    checkHazardCollision();

    checkPowerups();

    if (
      game.combo > 1 &&
      performance.now() - game.lastFoodTime > CONFIG.comboTime
    ) {
      game.combo = 1;
    }
  }

  updateHUD();

  requestAnimationFrame(gameLoop);
}

// ======================================
// BUTTON EVENTS
// ======================================

$("#nameBtn").click(setPlayerName);

$("#playerName").keypress(function (event) {
  if (event.key === "Enter") {
    setPlayerName();
  }
});

$("#startBtn").click(startGame);

$("#pauseBtn").click(pauseGame);

$("#resetBtn").click(function () {
  resetState();

  $("#boardMessage")
    .html(
      '<i class="bi bi-bug-fill"></i>' +
        "<h2>Ready to Wriggle?</h2>" +
        "<p>Press Start when ready.</p>",
    )
    .show();

  $("#liveMessage").text("Game reset.");
});

$("#hintBtn").click(showHint);

$("#continueLevelBtn").click(function () {
  setTimeout(
    continueLevel,

    200,
  );
});

$("#playAgainBtn").click(function () {
  setTimeout(
    startGame,

    200,
  );
});

// ======================================
// CHEAT MODE
// ======================================

function cheatMode() {
  if (!game.running) {
    startGame();
  }

  game.health = 99;

  game.score += 250;

  game.combo = 5;

  game.bestCombo = 5;

  game.shield = true;

  console.log("🪱 WORM GOD MODE ACTIVATED");

  console.log("HP: 99");

  console.log("Bonus Score: +250");

  console.log("Combo: x5");

  console.log("Shield: ON");

  $("#liveMessage").text("A mysterious power surrounds your worm...");

  updateHUD();
}

// Make cheatMode available in console.

window.cheatMode = cheatMode;

// ======================================
// WORM STATS CONSOLE COMMAND
// ======================================

function wormStats() {
  console.table({
    Player: game.player,

    Score: game.score,

    Level: game.level,

    HP: game.health,

    Pears: game.pears,

    GoldenPears: game.goldenPears,

    Combo: game.combo,

    BestCombo: game.bestCombo,

    Difficulty: game.difficulty,
  });
}

window.wormStats = wormStats;

// ======================================
// STARTUP
// ======================================

function initialize() {
  const storedName = sessionStorage.getItem(PLAYER_KEY);

  if (storedName) {
    game.player = storedName;

    $("#playerName").val(storedName);

    $("#greeting").text("Welcome back, " + storedName + "!");
  }

  $("#browserInfo").text(getBrowser());

  updateClock();

  setInterval(
    updateClock,

    1000,
  );

  renderLeaderboard();

  renderHistory();

  updatePlayerStats();

  buildWorm();

  $("#worm").hide();

  updateHUD();

  console.log("Worm Simulator loaded!");

  console.log("Try cheatMode()");

  console.log("Try wormStats()");

  requestAnimationFrame(gameLoop);
}

initialize();
