// Question-aware reply engine (no AI key needed).
// Reads WHAT the user is talking about (topic) and HOW they asked (why / how / should I / what if / venting),
// reflects their own words back, and answers in the persona's voice. Variants rotate so replies don't repeat.

type Topic = {
  id: string;
  match: RegExp;
  why: string[]; // explains why they feel this way
  how: string[]; // practical steps
  feel: string[]; // empathy / reflection for venting
  ask: string[]; // follow-up question
};

const TOPICS: Topic[] = [
  {
    id: "sleep",
    match: /\b(sleep|slept|insomnia|awake|night|3 ?am|bed|nightmares?)\b/,
    why: ["a racing mind at night is usually unfinished worries from the day knocking on the door", "your brain treats bedtime as the first quiet moment to replay everything"],
    how: ["put the phone in another corner 30 minutes before bed and dump every worry onto paper, so your brain knows it is saved", "keep the same wake-up time every day, even after a bad night, and the sleep clock fixes itself"],
    feel: ["lying awake while the whole world sleeps is lonely and exhausting", "tired body, wide-awake mind: the worst combo"],
    ask: ["What usually shows up in your head when you can't sleep?", "Is it one specific worry, or just noise?"],
  },
  {
    id: "tired",
    match: /\b(tired|exhausted|drained|no energy|fatigue|burn(ed|t)? ?out|burnout|lazy|sleepy)\b/,
    why: ["running on empty usually means you're giving out more than you're getting back, not that you're weak", "constant tiredness is often stress wearing a sleepy costume"],
    how: ["pick one thing tonight that refills you, a walk, music, a call, and protect it like a meeting", "cut today's list to the three things that truly matter and let the rest wait"],
    feel: ["being tired of being tired is real", "you sound like you've been carrying a lot for a long time"],
    ask: ["What's draining you the most right now?", "When did you last do something just for yourself?"],
  },
  {
    id: "breakup",
    match: /\b(breakup|broke up|broken up|dumped|ex|heartbreak|heartbroken|miss (him|her|them)|cheated|left me)\b/,
    why: ["a breakup hurts because your brain lost a habit, a person and a future plan all at once", "missing someone doesn't mean you should go back; it means it mattered"],
    how: ["mute, don't stalk: every scroll through their profile reopens the wound", "write the reasons it ended and read them when the nostalgia hits"],
    feel: ["heartbreak is a full-body ache, and it's okay that it hurts this much", "losing someone you loved is grief, not drama"],
    ask: ["What do you miss most, them or who you were with them?", "How long has it been since it ended?"],
  },
  {
    id: "crush",
    match: /\b(crush|ghost(ed|ing)?|left on read|dating|date|situationship|likes? me|text(ed|ing)? (him|her|them))\b/,
    why: ["mixed signals hurt because your brain hates not knowing", "being ghosted says more about their communication than your worth"],
    how: ["send one clear message, then put the phone down and let their reply, or silence, be the answer", "put your energy into people who reply with the same energy"],
    feel: ["waiting for a reply that never comes is torture", "it stings when you like someone more than they show up for you"],
    ask: ["What would you want them to say, honestly?", "How long have you been waiting on them?"],
  },
  {
    id: "lonely",
    match: /\b(lonely|alone|no friends|left out|ignored|invisible|isolated|nobody (cares|talks|replies)|no one)\b/,
    why: ["loneliness isn't about how many people are around, it's about feeling unseen", "feeling left out hits hard because humans are wired to belong"],
    how: ["message one person today, just a 'hey, thought of you'; small sparks start big fires", "join one thing on a schedule, a class, a club, a game night, so connection happens without forcing it"],
    feel: ["feeling invisible is one of the heaviest feelings there is", "being surrounded by people and still lonely is very real"],
    ask: ["Who is one person you'd actually like to hear from?", "When did you last feel truly seen by someone?"],
  },
  {
    id: "friends",
    match: /\b(friend|friends|best friend|bestie|roommate|flatmate|group chat|trip without me)\b/,
    why: ["friendships drift when life schedules change, not always because someone stopped caring", "one-sided friendships hurt because you keep giving and the cup comes back empty"],
    how: ["tell them how it felt using 'I felt' instead of 'you always'; it lands softer", "invest in the friends who invest back, and let the others become acquaintances"],
    feel: ["it hurts when the people you count on don't count you in", "friend drama can sting more than any exam"],
    ask: ["Have you told them how this made you feel?", "Which friend makes you feel most like yourself?"],
  },
  {
    id: "family",
    match: /\b(parents?|mom|mum|mother|dad|father|papa|mummy|family|sister|brother|sibling|relatives|cousin|compare|comparison|ghar)\b/,
    why: ["parents often push hard because they're scared for you, even when it comes out as criticism", "being compared makes you feel like a scoreboard, not a person"],
    how: ["pick a calm moment and share one feeling, not ten complaints; one clear message gets heard", "set one small boundary, like no career talk at dinner, and hold it kindly"],
    feel: ["it's exhausting to feel like you're never enough at home", "family pressure lands differently because you can't just walk away from it"],
    ask: ["What do you wish your family understood about you?", "Who at home is easiest to talk to?"],
  },
  {
    id: "exam",
    match: /\b(exams?|test|paper|marks|grades?|results?|study|studying|syllabus|revision|viva|semester|backlog|board exam|jee|neet|cat|gate|upsc)\b/,
    why: ["exam panic shows up because your brain treats one test like a life-or-death moment", "the stress spikes when the syllabus feels endless and the clock feels short"],
    how: ["split what's left into 25-minute blocks with 5-minute breaks, and tick each one off", "do the high-weight chapters first and past papers last; perfect coverage is a myth"],
    feel: ["exam pressure can make everything else feel tiny and scary", "it's a lot to carry, especially when it feels like everything depends on it"],
    ask: ["Which subject scares you the most right now?", "How many days do you have left?"],
  },
  {
    id: "project",
    match: /\b(project|assignment|deadline|deadlines|group project|thesis|submission|report|presentation|ppt)\b/,
    why: ["deadlines feel heavier when the task is vague; your brain avoids what it can't picture", "group projects stress you because you control your part, not theirs"],
    how: ["write the very first tiny step, even 'open the doc', and do only that", "message the group with clear owners and dates; clarity beats chasing"],
    feel: ["carrying a deadline in your chest all day is exhausting", "doing everyone's work and getting the same grade is maddening"],
    ask: ["When is it due, and what's the scariest part of it?", "What's the smallest piece you could finish today?"],
  },
  {
    id: "boss",
    match: /\b(boss|manager|team lead|tl|colleague|coworker|office|workplace|toxic|yell(s|ed|ing)?|micromanag\w*|appraisal|hr)\b/,
    why: ["a harsh boss makes you feel small because your effort and your income are tied to their mood", "office stress follows you home because you can't fully switch off"],
    how: ["keep a short record of what you've delivered; facts calm you and help in tough talks", "ask for feedback in writing so it's about the work, not their mood"],
    feel: ["being yelled at in front of others feels humiliating", "working under someone who never notices your effort is draining"],
    ask: ["What did your boss say that stuck with you most?", "Is it the work itself or the people that's wearing you down?"],
  },
  {
    id: "career",
    match: /\b(job|career|placement|placements|interview|internship|rejected|rejection|resume|cv|offer|salary|promotion|fired|layoff|unemployed|hike|quit)\b/,
    why: ["rejection stings because it feels personal, but it's usually about fit and timing", "career confusion is normal; most people figure it out by trying, not thinking"],
    how: ["after each rejection, write one thing to improve and apply to two more; momentum beats perfection", "talk to one person already doing the job you want; 15 minutes of real advice beats hours of worrying"],
    feel: ["putting yourself out there and hearing 'no' is genuinely painful", "not knowing where your career is going can feel like standing in fog"],
    ask: ["What kind of work actually makes you lose track of time?", "How many applications have you sent so far?"],
  },
  {
    id: "procrastination",
    match: /\b(procrastinat\w*|scroll(ing)?|reels|instagram|youtube|distracted|can'?t focus|focus|wasting time|lazy|motivation|motivated|delay)\b/,
    why: ["procrastination isn't laziness, it's your brain dodging a feeling, usually fear of doing it badly", "scrolling feels good because it's an easy reward when the real task feels heavy"],
    how: ["use the two-minute rule: start for just two minutes, and you'll usually keep going", "put the phone in another room for one 25-minute sprint, then reward yourself"],
    feel: ["the guilt after a wasted day hurts more than the work would have", "it's frustrating to want to start and still not start"],
    ask: ["What's the task you keep running from?", "What do you think you're afraid of in it?"],
  },
  {
    id: "anxiety",
    match: /\b(anxious|anxiety|panic|panicking|nervous|scared|afraid|fear|overthink\w*|worried|worry|shaking|heart racing|tension|dar)\b/,
    why: ["anxiety is your brain's alarm going off for a fire that hasn't happened yet", "overthinking feels like problem-solving, but it's really rehearsing the worst case"],
    how: ["try box breathing: in for 4, hold 4, out for 4, hold 4, four times; it tells your body you're safe", "write the worry down and next to it what you'd actually do if it happened; it shrinks on paper"],
    feel: ["that tight, buzzing feeling is awful, and it makes sense you want it to stop", "your mind sounds like it's running a hundred tabs at once"],
    ask: ["What's the worst-case thought running in your head right now?", "Where do you feel the anxiety in your body?"],
  },
  {
    id: "confidence",
    match: /\b(confiden\w*|self[- ]?esteem|worthless|not good enough|stupid|idiot|loser|failure|fail(ed|ing)?|ugly|insecure|imposter|fraud|compare myself)\b/,
    why: ["you're judging your behind-the-scenes against everyone else's highlight reel", "one failure feels like a verdict, but it's really just a data point"],
    how: ["write three things you've handled well this year; your brain forgets wins and remembers losses", "talk to yourself the way you'd talk to your best friend in the same spot"],
    feel: ["feeling not good enough is heavy, and you don't deserve that voice in your head", "it's hard when your inner critic is louder than everyone else"],
    ask: ["Whose voice does that inner critic sound like?", "What's one thing you're quietly proud of?"],
  },
  {
    id: "future",
    match: /\b(future|what if|lost|confused|direction|purpose|meaning|life is going|figure (it|out)|after graduat\w*|what to do with my life)\b/,
    why: ["feeling lost is usually a sign you're outgrowing an old plan, not that you have no path", "the future feels scary because your brain can't plan for what it can't see"],
    how: ["don't decide your whole life; decide the next three months and try one small experiment", "list what energises you and what drains you, and move a little toward the first list"],
    feel: ["not knowing what's next is genuinely uncomfortable", "it's okay not to have it all figured out; almost nobody does"],
    ask: ["If nothing could go wrong, what would you try next?", "What part of the future worries you most?"],
  },
  {
    id: "anger",
    match: /\b(angry|anger|mad|furious|hate|annoyed|irritated|frustrat\w*|rage|unfair)\b/,
    why: ["anger usually sits on top of hurt; something important to you got stepped on", "frustration builds when you feel unheard for too long"],
    how: ["before replying to anyone, walk for ten minutes; decisions made hot get regretted cold", "name what you actually need, respect, rest or help, and ask for that one thing"],
    feel: ["you have every right to feel angry about something unfair", "that kind of frustration is exhausting to carry"],
    ask: ["What's underneath the anger, hurt or disappointment?", "What would make this feel fair to you?"],
  },
  {
    id: "sad",
    match: /\b(sad|cry|crying|cried|down|low|empty|numb|hurt|hurts|upset|dukhi|udaas|bura laga)\b/,
    why: ["sadness is how your mind processes something that mattered to you", "feeling low after a hard stretch is your system asking for care, not a sign you're broken"],
    how: ["let yourself feel it for a bit, then do one tiny caring thing: water, a shower, fresh air", "tell one person 'I'm having a rough day'; you don't have to explain everything"],
    feel: ["I'm really sorry you're feeling this low", "that sounds heavy, and it's okay to not be okay today"],
    ask: ["What happened that brought this on?", "How long have you been feeling like this?"],
  },
];

const GENERIC: Topic = {
  id: "general",
  match: /.*/,
  why: ["stress piles up quietly until one small thing tips the cup over", "what you're feeling usually makes sense once we look at what's underneath it"],
  how: ["write down the one thing that's bothering you most and the smallest step you could take on it today", "take a ten-minute break from screens and breathe slowly; a calmer mind sees more options"],
  feel: ["that sounds like a lot to carry", "thank you for telling me; it takes guts to say it out loud"],
  ask: ["What's weighing on you the most right now?", "Tell me more: what happened?"],
};

type Voice = { open: string[]; why: string; how: string; close: string[] };
const VOICES: Record<string, Voice> = {
  "donald-trump": {
    open: ["Believe me,", "Let me tell you, and people are saying this,", "Tremendous question, really tremendous."],
    why: "Here's the deal, and nobody knows deals better:",
    how: "My strategy, the best strategy:",
    close: ["You're a winner, believe me.", "We're going to win so much on this.", "Many people would never handle it like you."],
  },
  "snoop-dogg": {
    open: ["Ayy, nephew,", "Fo shizzle, listen up,", "Okay, okay, I hear you, ya dig."],
    why: "Real talk:",
    how: "Here's the smooth move:",
    close: ["Keep it smooth, keep it easy.", "Stay cool like the D-O-double-G.", "Laid back, that's the move."],
  },
  "amitabh-bachchan": {
    open: ["Deviyon aur sajjanon, suniye.", "Bahut khoob sawaal hai.", "Aap ghabraiye mat."],
    why: "Asli baat yeh hai:",
    how: "Mera jawab, lock kiya jaye:",
    close: ["Himmat rakhiye, aap jeetenge.", "Yeh aapka crorepati moment hoga.", "Computer ji, agla sawaal."],
  },
  "narendra-modi": {
    open: ["Mere pyaare dost,", "Mitron, sunye,", "Aaj hum aapke mann ki baat karenge."],
    why: "Sachchai yeh hai:",
    how: "Aapka sankalp yeh hona chahiye:",
    close: ["Aatmavishwas rakhiye.", "Yeh aapka Shanti Abhiyaan hai.", "Har chunauti ek avsar hai."],
  },
};

const pick = <T,>(arr: T[], seed: number) => arr[Math.abs(seed) % arr.length];
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
};

/** Turn "I feel like nobody cares about me" into "you feel like nobody cares about you". */
function reflect(text: string): string {
  const first = text.split(/[.!?\n]/).map((x) => x.trim()).find((x) => x.split(/\s+/).length >= 3) ?? text.trim();
  const words = first.split(/\s+/).slice(0, 14).join(" ");
  const swapped = words
    .replace(/\bI'm\b/gi, "you're").replace(/\bI am\b/gi, "you are").replace(/\bI've\b/gi, "you've").replace(/\bI'll\b/gi, "you'll")
    .replace(/\bI\b/g, "you").replace(/\bmy\b/gi, "your").replace(/\bme\b/gi, "you").replace(/\bmyself\b/gi, "yourself").replace(/\bmine\b/gi, "yours");
  return swapped.replace(/[,;:]+$/, "").replace(/^(so|and|but|like|ugh|yaar|bro)\s+/i, "");
}

type Form = "why" | "how" | "should" | "whatif" | "is_normal" | "vent";
function formOf(t: string): Form {
  if (/\bwhy\b/.test(t)) return "why";
  if (/\bwhat if\b/.test(t)) return "whatif";
  if (/\b(is it (normal|okay|ok|bad|wrong)|am i (normal|overreacting|wrong|crazy|the problem))\b/.test(t)) return "is_normal";
  if (/\bshould i\b|\bshall i\b|\bdo i (quit|leave|stay|tell)\b/.test(t)) return "should";
  if (/\b(how (do|can|should) i|how to|what (should|can|do) i do|what do i do|any (tips|advice)|help me|kya karu|kya karun)\b/.test(t)) return "how";
  return "vent";
}

export function respond(personaId: string, userText: string, history: string[], turn: number, fallbackPhrases: string[]): string {
  const t = userText.toLowerCase();
  const topic = TOPICS.find((x) => x.match.test(t)) ?? (history.length ? TOPICS.find((x) => x.match.test(history.join(" ").toLowerCase())) : undefined) ?? GENERIC;
  const voice = VOICES[personaId] ?? { open: fallbackPhrases, why: "Here's the thing:", how: "Here's your move:", close: fallbackPhrases };
  const seed = hash(userText) + turn * 7;
  const form = formOf(t);
  const echo = reflect(userText);
  const open = pick(voice.open, seed);
  const close = pick(voice.close, seed + 3);

  const parts: string[] = [open];
  switch (form) {
    case "why":
      parts.push(`You're asking why ${echo.replace(/^.*?\bwhy\s+/i, "").replace(/^(do|does|did|am|is|are|can'?t|cannot)\s+(you|i|we|they|people)\s+/i, (_m, aux, who) => `${who} ${/can/i.test(aux) ? "can't " : ""}`).replace(/\?$/, "")}.`, `${voice.why} ${pick(topic.why, seed)}.`, `${voice.how} ${pick(topic.how, seed + 1)}.`);
      break;
    case "how":
      parts.push(`So you want to know how to handle this.`, `${voice.how} ${pick(topic.how, seed)}.`, `And also: ${pick(topic.how, seed + 1)}.`);
      break;
    case "should":
      parts.push(
        `"${echo.replace(/\?$/, "")}?" Big question.`,
        `Don't decide while you're at your most stressed. Write two lists, what you gain and what you lose, and sleep on it one night.`,
        `${voice.how} ${pick(topic.how, seed)}.`
      );
      break;
    case "whatif":
      parts.push(`That "what if" is your anxiety writing the worst movie script.`, `${voice.why} ${pick(topic.why, seed)}.`, `${voice.how} ${pick(topic.how, seed + 1)}.`);
      break;
    case "is_normal":
      parts.push(`Yes, it's completely normal to feel this way, and you're not overreacting.`, `${voice.why} ${pick(topic.why, seed)}.`, `${voice.how} ${pick(topic.how, seed + 1)}.`);
      break;
    default:
      parts.push(`So ${echo.charAt(0).toLowerCase() + echo.slice(1)}. ${cap(pick(topic.feel, seed))}.`, `${voice.why} ${pick(topic.why, seed + 1)}.`, `${voice.how} ${pick(topic.how, seed + 2)}.`);
  }
  parts.push(close, pick(topic.ask, seed + turn));
  // After an opener that ends in a comma, continue the sentence in lower case
  return parts
    .join(" ")
    .replace(/,\s+([A-Z])(?=[a-z])/g, (_m, c) => `, ${c.toLowerCase()}`)
    .replace(/\s+/g, " ")
    .replace(/\.\./g, ".")
    .trim();
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
