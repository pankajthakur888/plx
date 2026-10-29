async function test() {
  const res = await fetch("http://localhost:3000/.netlify/functions/game", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create", name: "Pankaj", isSolo: true, autoStart: true })
  });
  const data = await res.json();
  console.log("Create room response:", JSON.stringify(data, null, 2));
}
test().catch(console.error);
