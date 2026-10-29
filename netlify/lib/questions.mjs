/**
 * PLX-V0 — 15 General Knowledge Questions
 * 3 Rounds × 5 Questions
 *
 * Round 1 (Warm-up)  — Questions 0–4   — Easier, fun facts
 * Round 2 (Brain Rush) — Questions 5–9  — Medium difficulty
 * Round 3 (Final Showdown) — Questions 10–14 — Harder, trickier
 */
export const QUESTIONS = [
  // ── Round 1: Warm-up ──────────────────────────────────────────
  {
    prompt: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Mercury"],
    answer: 1,
    explanation: "Mars appears reddish because iron minerals in its soil oxidize — essentially, the planet is covered in rust."
  },
  {
    prompt: "How many sides does a hexagon have?",
    options: ["Five", "Seven", "Six", "Eight"],
    answer: 2,
    explanation: "The prefix 'hexa-' comes from Greek and means six. A hexagon has six sides and six angles."
  },
  {
    prompt: "Which ocean is the largest on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    answer: 3,
    explanation: "The Pacific Ocean covers more than 165 million km² — larger than all the land on Earth combined."
  },
  {
    prompt: "What is the chemical symbol for gold?",
    options: ["Ag", "Au", "Gd", "Go"],
    answer: 1,
    explanation: "Gold's symbol 'Au' comes from the Latin word 'aurum', meaning 'shining dawn'."
  },
  {
    prompt: "Which animal is the tallest living land animal?",
    options: ["African Elephant", "Ostrich", "Giraffe", "Camel"],
    answer: 2,
    explanation: "Giraffes can stand up to 5.7 meters (18.7 ft) tall — their necks alone can be over 2 meters long!"
  },

  // ── Round 2: Brain Rush ───────────────────────────────────────
  {
    prompt: "What is the capital city of Japan?",
    options: ["Kyoto", "Tokyo", "Osaka", "Sapporo"],
    answer: 1,
    explanation: "Tokyo has been Japan's capital since 1868 and is the world's most populous metropolitan area."
  },
  {
    prompt: "Which gas do plants primarily absorb for photosynthesis?",
    options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
    answer: 2,
    explanation: "Plants use CO₂, water, and sunlight to produce glucose and oxygen through photosynthesis."
  },
  {
    prompt: "How many minutes are there in two hours?",
    options: ["100", "110", "120", "140"],
    answer: 2,
    explanation: "Each hour contains 60 minutes, so 2 × 60 = 120 minutes."
  },
  {
    prompt: "Which instrument has keys, pedals, and strings?",
    options: ["Flute", "Piano", "Trumpet", "Violin"],
    answer: 1,
    explanation: "A piano uses keys to trigger hammers that strike tuned strings, with pedals to sustain or dampen sound."
  },
  {
    prompt: "What is the hardest naturally occurring mineral?",
    options: ["Quartz", "Topaz", "Corundum", "Diamond"],
    answer: 3,
    explanation: "Diamond ranks 10 on the Mohs hardness scale — it can only be scratched by another diamond."
  },

  // ── Round 3: Final Showdown ───────────────────────────────────
  {
    prompt: "What is the largest mammal on Earth?",
    options: ["African Elephant", "Blue Whale", "Giraffe", "Orca"],
    answer: 1,
    explanation: "Blue whales can reach 30 meters (100 ft) in length and weigh up to 200 tonnes — the largest animals that have ever lived."
  },
  {
    prompt: "Which continent contains the Sahara Desert?",
    options: ["Asia", "South America", "Africa", "Australia"],
    answer: 2,
    explanation: "The Sahara spans 9.2 million km² across northern Africa — roughly the size of the entire United States."
  },
  {
    prompt: "What is the square root of 144?",
    options: ["10", "11", "12", "14"],
    answer: 2,
    explanation: "12 × 12 = 144. Fun fact: 144 is also the 12th Fibonacci number!"
  },
  {
    prompt: "Which programming language runs natively in web browsers?",
    options: ["JavaScript", "C", "Rust", "Go"],
    answer: 0,
    explanation: "JavaScript was created in 1995 specifically for the Netscape browser, and today runs natively in all modern browsers."
  },
  {
    prompt: "How many colors are traditionally named in a rainbow?",
    options: ["Five", "Six", "Seven", "Eight"],
    answer: 2,
    explanation: "The seven traditional colors are red, orange, yellow, green, blue, indigo, and violet — first described by Isaac Newton."
  }
];
