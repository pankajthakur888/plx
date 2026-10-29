/**
 * PLX-V0 — Question Bank with Levels & Categories
 *
 * Level 1: Warm-up (Easy)          — Fun trivia, approachable facts
 * Level 2: Brain Rush (Medium)      — Deeper knowledge, quick thinking
 * Level 3: Final Showdown (Hard)    — Tricky facts, precision recall
 */

export const LEVEL_LABELS = {
  1: "Level 1 · Warm-up",
  2: "Level 2 · Brain Rush",
  3: "Level 3 · Final Showdown",
};

export const QUESTION_BANK = {
  // ── Level 1: Warm-up (Easy) ───────────────────────────────────
  1: [
    {
      prompt: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Mercury"],
      answer: 1,
      category: "Space",
      level: 1,
      levelLabel: LEVEL_LABELS[1],
      explanation: "Mars appears reddish because iron minerals in its soil oxidize — essentially, the planet is covered in rust.",
    },
    {
      prompt: "How many sides does a hexagon have?",
      options: ["Five", "Seven", "Six", "Eight"],
      answer: 2,
      category: "Math & Geometry",
      level: 1,
      levelLabel: LEVEL_LABELS[1],
      explanation: "The prefix 'hexa-' comes from Greek and means six. A hexagon has six sides and six angles.",
    },
    {
      prompt: "Which ocean is the largest on Earth?",
      options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
      answer: 3,
      category: "Geography",
      level: 1,
      levelLabel: LEVEL_LABELS[1],
      explanation: "The Pacific Ocean covers more than 165 million km² — larger than all the land on Earth combined.",
    },
    {
      prompt: "What is the chemical symbol for gold?",
      options: ["Ag", "Au", "Gd", "Go"],
      answer: 1,
      category: "Science",
      level: 1,
      levelLabel: LEVEL_LABELS[1],
      explanation: "Gold's symbol 'Au' comes from the Latin word 'aurum', meaning 'shining dawn'.",
    },
    {
      prompt: "Which animal is the tallest living land animal?",
      options: ["African Elephant", "Ostrich", "Giraffe", "Camel"],
      answer: 2,
      category: "Nature",
      level: 1,
      levelLabel: LEVEL_LABELS[1],
      explanation: "Giraffes can stand up to 5.7 meters (18.7 ft) tall — their necks alone can be over 2 meters long!",
    },
    {
      prompt: "How many colors are in a standard rainbow?",
      options: ["Five", "Six", "Seven", "Eight"],
      answer: 2,
      category: "Nature",
      level: 1,
      levelLabel: LEVEL_LABELS[1],
      explanation: "The seven traditional colors are red, orange, yellow, green, blue, indigo, and violet.",
    },
    {
      prompt: "What is the fastest land animal in the world?",
      options: ["Lion", "Cheetah", "Gazelle", "Greyhound"],
      answer: 1,
      category: "Nature",
      level: 1,
      levelLabel: LEVEL_LABELS[1],
      explanation: "Cheetahs can accelerate from 0 to 60 mph in just 3 seconds, reaching top speeds near 70 mph.",
    },
    {
      prompt: "How many days are in a leap year?",
      options: ["364", "365", "366", "367"],
      answer: 2,
      category: "General",
      level: 1,
      levelLabel: LEVEL_LABELS[1],
      explanation: "A leap year has 366 days instead of 365, adding an extra day (February 29) to keep the calendar synchronized with Earth's orbit.",
    },
    {
      prompt: "What is the freezing point of water in Celsius?",
      options: ["-10°C", "0°C", "32°C", "100°C"],
      answer: 1,
      category: "Science",
      level: 1,
      levelLabel: LEVEL_LABELS[1],
      explanation: "Under standard atmospheric pressure, liquid water freezes into ice at exactly 0 degrees Celsius.",
    },
    {
      prompt: "Which country is home to the famous Eiffel Tower?",
      options: ["Italy", "Spain", "Germany", "France"],
      answer: 3,
      category: "Geography",
      level: 1,
      levelLabel: LEVEL_LABELS[1],
      explanation: "The Eiffel Tower was constructed in Paris, France as the centerpiece for the 1889 World's Fair.",
    },
    {
      prompt: "What primary color do you mix with blue to get green?",
      options: ["Red", "Yellow", "Orange", "Purple"],
      answer: 1,
      category: "Art & Colors",
      level: 1,
      levelLabel: LEVEL_LABELS[1],
      explanation: "In traditional subtractive color mixing, combining blue and yellow pigments produces green.",
    },
    {
      prompt: "Which fruit is famous for keeping 'the doctor away'?",
      options: ["Banana", "Orange", "Apple", "Strawberry"],
      answer: 2,
      category: "Food & Trivia",
      level: 1,
      levelLabel: LEVEL_LABELS[1],
      explanation: "The proverb 'An apple a day keeps the doctor away' originated in Wales during the 19th century.",
    },
    {
      prompt: "How many hours are there in three full days?",
      options: ["48", "60", "72", "84"],
      answer: 2,
      category: "Math & Time",
      level: 1,
      levelLabel: LEVEL_LABELS[1],
      explanation: "Each day has 24 hours, so 3 × 24 = 72 hours.",
    },
    {
      prompt: "What is the capital of the United Kingdom?",
      options: ["Dublin", "Edinburgh", "London", "Manchester"],
      answer: 2,
      category: "Geography",
      level: 1,
      levelLabel: LEVEL_LABELS[1],
      explanation: "London is the capital and largest city of England and the United Kingdom.",
    },
    {
      prompt: "Which organ pumps blood throughout the human body?",
      options: ["Brain", "Lungs", "Liver", "Heart"],
      answer: 3,
      category: "Anatomy",
      level: 1,
      levelLabel: LEVEL_LABELS[1],
      explanation: "The human heart beats about 100,000 times per day to circulate oxygen-rich blood throughout the body.",
    },
  ],

  // ── Level 2: Brain Rush (Medium) ──────────────────────────────
  2: [
    {
      prompt: "What is the capital city of Japan?",
      options: ["Kyoto", "Tokyo", "Osaka", "Sapporo"],
      answer: 1,
      category: "Geography",
      level: 2,
      levelLabel: LEVEL_LABELS[2],
      explanation: "Tokyo has been Japan's capital since 1868 and is the world's most populous metropolitan area.",
    },
    {
      prompt: "Which gas do plants primarily absorb for photosynthesis?",
      options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
      answer: 2,
      category: "Science",
      level: 2,
      levelLabel: LEVEL_LABELS[2],
      explanation: "Plants use CO₂, water, and sunlight to produce glucose and oxygen through photosynthesis.",
    },
    {
      prompt: "How many minutes are there in two hours?",
      options: ["100", "110", "120", "140"],
      answer: 2,
      category: "Math",
      level: 2,
      levelLabel: LEVEL_LABELS[2],
      explanation: "Each hour contains 60 minutes, so 2 × 60 = 120 minutes.",
    },
    {
      prompt: "Which instrument has keys, pedals, and strings?",
      options: ["Flute", "Piano", "Trumpet", "Violin"],
      answer: 1,
      category: "Music",
      level: 2,
      levelLabel: LEVEL_LABELS[2],
      explanation: "A piano uses keys to trigger hammers that strike tuned strings, with pedals to sustain or dampen sound.",
    },
    {
      prompt: "What is the hardest naturally occurring mineral?",
      options: ["Quartz", "Topaz", "Corundum", "Diamond"],
      answer: 3,
      category: "Science",
      level: 2,
      levelLabel: LEVEL_LABELS[2],
      explanation: "Diamond ranks 10 on the Mohs hardness scale — it can only be scratched by another diamond.",
    },
    {
      prompt: "Who painted the Mona Lisa?",
      options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
      answer: 2,
      category: "Art & History",
      level: 2,
      levelLabel: LEVEL_LABELS[2],
      explanation: "Leonardo da Vinci began painting the Mona Lisa in Florence, Italy, around 1503.",
    },
    {
      prompt: "Which element has the atomic number 1 on the periodic table?",
      options: ["Helium", "Hydrogen", "Carbon", "Oxygen"],
      answer: 1,
      category: "Chemistry",
      level: 2,
      levelLabel: LEVEL_LABELS[2],
      explanation: "Hydrogen is the lightest element and the most abundant chemical substance in the universe.",
    },
    {
      prompt: "In which year did the Titanic sink?",
      options: ["1905", "1912", "1918", "1923"],
      answer: 1,
      category: "History",
      level: 2,
      levelLabel: LEVEL_LABELS[2],
      explanation: "The RMS Titanic struck an iceberg on the night of April 14 and sank in the early morning of April 15, 1912.",
    },
    {
      prompt: "What is the smallest prime number?",
      options: ["0", "1", "2", "3"],
      answer: 2,
      category: "Math",
      level: 2,
      levelLabel: LEVEL_LABELS[2],
      explanation: "A prime number is greater than 1 and divisible only by 1 and itself; 2 is the only even prime number.",
    },
    {
      prompt: "Which planet in our solar system has the most rings?",
      options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
      answer: 1,
      category: "Space",
      level: 2,
      levelLabel: LEVEL_LABELS[2],
      explanation: "Saturn's spectacular ring system spans up to 282,000 kilometers, composed mostly of ice particles and rock dust.",
    },
    {
      prompt: "What is the largest internal organ in the human body?",
      options: ["Heart", "Liver", "Lungs", "Brain"],
      answer: 1,
      category: "Biology",
      level: 2,
      levelLabel: LEVEL_LABELS[2],
      explanation: "The liver is the heaviest and largest internal organ, performing over 500 vital metabolic functions.",
    },
    {
      prompt: "Which country has the longest coastline in the world?",
      options: ["Russia", "Australia", "Canada", "Indonesia"],
      answer: 2,
      category: "Geography",
      level: 2,
      levelLabel: LEVEL_LABELS[2],
      explanation: "Canada possesses over 243,000 km of coastline bordering the Atlantic, Pacific, and Arctic oceans.",
    },
    {
      prompt: "What is the currency of the United Kingdom?",
      options: ["Euro", "Pound Sterling", "Dollar", "Franc"],
      answer: 1,
      category: "Economics",
      level: 2,
      levelLabel: LEVEL_LABELS[2],
      explanation: "The pound sterling (£) is the world's oldest currency still in continuous use.",
    },
    {
      prompt: "What does the 'HTTP' stand for in web addresses?",
      options: [
        "HyperText Transfer Protocol",
        "High Tech Transmission Path",
        "Home Tool Transfer Page",
        "Hyper Terminal Text Parser",
      ],
      answer: 0,
      category: "Technology",
      level: 2,
      levelLabel: LEVEL_LABELS[2],
      explanation: "HTTP (HyperText Transfer Protocol) is the foundational application layer protocol used for transmitting web pages across the internet.",
    },
    {
      prompt: "Which gas makes up about 78% of Earth's atmosphere?",
      options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"],
      answer: 2,
      category: "Science",
      level: 2,
      levelLabel: LEVEL_LABELS[2],
      explanation: "Nitrogen comprises approximately 78.08% of dry air, with oxygen making up about 20.95%.",
    },
  ],

  // ── Level 3: Final Showdown (Hard) ────────────────────────────
  3: [
    {
      prompt: "What is the largest mammal on Earth?",
      options: ["African Elephant", "Blue Whale", "Giraffe", "Orca"],
      answer: 1,
      category: "Biology",
      level: 3,
      levelLabel: LEVEL_LABELS[3],
      explanation: "Blue whales can reach 30 meters (100 ft) in length and weigh up to 200 tonnes — the largest animals that have ever lived.",
    },
    {
      prompt: "Which continent contains the Sahara Desert?",
      options: ["Asia", "South America", "Africa", "Australia"],
      answer: 2,
      category: "Geography",
      level: 3,
      levelLabel: LEVEL_LABELS[3],
      explanation: "The Sahara spans 9.2 million km² across northern Africa — roughly the size of the entire United States.",
    },
    {
      prompt: "What is the square root of 144?",
      options: ["10", "11", "12", "14"],
      answer: 2,
      category: "Math",
      level: 3,
      levelLabel: LEVEL_LABELS[3],
      explanation: "12 × 12 = 144. Fun fact: 144 is also the 12th Fibonacci number!",
    },
    {
      prompt: "Which programming language runs natively in web browsers?",
      options: ["JavaScript", "C", "Rust", "Go"],
      answer: 0,
      category: "Technology",
      level: 3,
      levelLabel: LEVEL_LABELS[3],
      explanation: "JavaScript was created in 1995 specifically for the Netscape browser, and today runs natively in all modern browsers.",
    },
    {
      prompt: "What is the only mammal capable of true sustained flight?",
      options: ["Flying Squirrel", "Bat", "Sugar Glider", "Colugo"],
      answer: 1,
      category: "Nature",
      level: 3,
      levelLabel: LEVEL_LABELS[3],
      explanation: "While gliding mammals can leap and soar on membranes, bats are the only mammals with powered, flapping wings.",
    },
    {
      prompt: "What is the speed of light in a vacuum (approximate)?",
      options: ["150,000 km/s", "300,000 km/s", "450,000 km/s", "1,000,000 km/s"],
      answer: 1,
      category: "Physics",
      level: 3,
      levelLabel: LEVEL_LABELS[3],
      explanation: "Light travels through a vacuum at precisely 299,792,458 meters per second (~300,000 km/s).",
    },
    {
      prompt: "Which ancient civilization constructed the city of Machu Picchu?",
      options: ["Aztecs", "Mayans", "Incas", "Olmecs"],
      answer: 2,
      category: "History",
      level: 3,
      levelLabel: LEVEL_LABELS[3],
      explanation: "Machu Picchu was built by the Inca Empire in the 15th century high in the Andes mountains of Peru.",
    },
    {
      prompt: "What is the rarest blood type in the world?",
      options: ["O positive", "A negative", "AB negative", "B negative"],
      answer: 2,
      category: "Medicine",
      level: 3,
      levelLabel: LEVEL_LABELS[3],
      explanation: "AB negative is the rarest major blood type, occurring in less than 1% of the global population.",
    },
    {
      prompt: "Which deep-sea trench is the deepest known point on Earth?",
      options: ["Java Trench", "Puerto Rico Trench", "Mariana Trench", "Tonga Trench"],
      answer: 2,
      category: "Geography",
      level: 3,
      levelLabel: LEVEL_LABELS[3],
      explanation: "The Challenger Deep in the Mariana Trench reaches approximately 10,994 meters (36,070 ft) below sea level.",
    },
    {
      prompt: "What is the powerhouse organelle of eukaryotic cells?",
      options: ["Ribosome", "Endoplasmic Reticulum", "Mitochondria", "Golgi Apparatus"],
      answer: 2,
      category: "Biology",
      level: 3,
      levelLabel: LEVEL_LABELS[3],
      explanation: "Mitochondria generate most of the chemical energy needed by cells in the form of ATP.",
    },
    {
      prompt: "Who proposed the General Theory of Relativity in 1915?",
      options: ["Isaac Newton", "Albert Einstein", "Niels Bohr", "Galileo Galilei"],
      answer: 1,
      category: "Physics",
      level: 3,
      levelLabel: LEVEL_LABELS[3],
      explanation: "Albert Einstein published the general theory of relativity in November 1915, transforming our understanding of gravity and spacetime.",
    },
    {
      prompt: "Which river is traditionally considered the longest in the world?",
      options: ["Amazon River", "Nile River", "Yangtze River", "Mississippi River"],
      answer: 1,
      category: "Geography",
      level: 3,
      levelLabel: LEVEL_LABELS[3],
      explanation: "The Nile River in northeastern Africa flows approximately 6,650 kilometers (4,132 miles).",
    },
    {
      prompt: "In computer science, what does 'DNS' stand for?",
      options: [
        "Data Network System",
        "Domain Name System",
        "Digital Node Server",
        "Direct Name Service",
      ],
      answer: 1,
      category: "Technology",
      level: 3,
      levelLabel: LEVEL_LABELS[3],
      explanation: "The Domain Name System (DNS) translates human-friendly domain names (like github.com) into IP addresses computers use to route data.",
    },
    {
      prompt: "What is the main component of the Sun by mass?",
      options: ["Helium", "Hydrogen", "Carbon", "Oxygen"],
      answer: 1,
      category: "Astronomy",
      level: 3,
      levelLabel: LEVEL_LABELS[3],
      explanation: "Hydrogen accounts for roughly 73% of the Sun's mass, with helium making up nearly all the rest (~25%).",
    },
    {
      prompt: "How many bones are in the adult human skeleton?",
      options: ["186", "206", "226", "256"],
      answer: 1,
      category: "Anatomy",
      level: 3,
      levelLabel: LEVEL_LABELS[3],
      explanation: "Human babies are born with around 270 bones, which fuse as they grow to leave 206 distinct bones in adulthood.",
    },
  ],
};

/**
 * Standard 15 match questions (5 per round/level).
 * Maintained for deterministic baseline testing and fallback.
 */
export const QUESTIONS = [
  ...QUESTION_BANK[1].slice(0, 5),
  ...QUESTION_BANK[2].slice(0, 5),
  ...QUESTION_BANK[3].slice(0, 5),
];

/**
 * Helper to generate a fresh 15-question match drawing 5 questions
 * from each level (Level 1, Level 2, Level 3).
 */
export function createMatchQuestions(shuffle = true) {
  if (!shuffle) return [...QUESTIONS];

  const pickRandom = (arr, count) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, count);
  };

  return [
    ...pickRandom(QUESTION_BANK[1], 5),
    ...pickRandom(QUESTION_BANK[2], 5),
    ...pickRandom(QUESTION_BANK[3], 5),
  ];
}
