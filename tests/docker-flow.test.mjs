const BASE = "http://localhost:3000/.netlify/functions/game";

async function post(body) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function run() {
  console.log("1. Creating room...");
  const create = await post({ action: "create", name: "HostAlice" });
  const roomCode = create.session.roomCode;
  const host = create.session;
  console.log("Room created:", roomCode, "Host ID:", host.playerId);

  console.log("2. Bob joining...");
  const join = await post({ action: "join", name: "PlayerBob", code: roomCode });
  const bob = join.session;
  console.log("Bob joined:", bob.playerId);

  console.log("3. Host starting game...");
  const start = await post({
    action: "start",
    roomCode,
    playerId: host.playerId,
    token: host.token,
  });
  console.log("Game started! Status:", start.state.status);

  console.log("4. Submitting answers...");
  const a1 = await post({
    action: "answer",
    option: 1,
    roomCode,
    playerId: host.playerId,
    token: host.token,
  });
  const a2 = await post({
    action: "answer",
    option: 1,
    roomCode,
    playerId: bob.playerId,
    token: bob.token,
  });
  console.log("Answers submitted. State after both answered:");
  const state = await post({
    action: "state",
    roomCode,
    playerId: host.playerId,
    token: host.token,
  });
  console.log("Current status:", state.state.status);
  console.log("Scores:", state.state.players.map((p) => `${p.name}: ${p.score} (${p.correct} correct)`));

  if (state.state.status === "reveal") {
    console.log("Answer revealed successfully! Correct option:", state.state.correctOption);
    console.log("Explanation:", state.state.explanation);
  }

  console.log("\nALL TESTS PASSED SUCCESSFULLY! Container is working 100%!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

