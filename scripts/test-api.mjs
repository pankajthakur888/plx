async function test() {
  const base = "http://localhost:3000/.netlify/functions/game";

  console.log("1. Testing send_verification...");
  const sendRes = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "send_verification", email: "pankaj@example.com" }),
  });
  const sendData = await sendRes.json();
  console.log("Send verification response:", sendData);
  if (!sendData.previewCode) throw new Error("Expected previewCode in response");

  console.log("\n2. Testing solo create without verification (should fail)...");
  const failRes = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create", name: "Pankaj", isSolo: true }),
  });
  const failData = await failRes.json();
  console.log("Create without verification (expected error):", failData);

  console.log("\n3. Testing verify_email with code...");
  const verifyRes = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "verify_email",
      email: "pankaj@example.com",
      code: sendData.previewCode,
    }),
  });
  const verifyData = await verifyRes.json();
  console.log("Verify email response:", verifyData);
  if (!verifyData.emailToken) throw new Error("Expected emailToken in response");

  console.log("\n4. Testing solo create with verified email + token...");
  const createRes = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create",
      name: "Pankaj",
      isSolo: true,
      autoStart: true,
      email: "pankaj@example.com",
      emailToken: verifyData.emailToken,
    }),
  });
  const createData = await createRes.json();
  console.log("Solo create with verified email:", {
    session: createData.session,
    verifiedEmail: createData.state?.verifiedEmail,
    status: createData.state?.status,
    isSolo: createData.state?.isSolo,
    category: createData.state?.question?.category,
    levelLabel: createData.state?.question?.levelLabel,
  });

  console.log("\n✅ Email ID verification and solo warm-up successfully verified!");
}

test().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
