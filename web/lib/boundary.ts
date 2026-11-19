// Therapy-only domain boundary.
// Runs BEFORE any AI call (and in demo mode), so clear off-topic requests and jailbreak attempts
// always get the same fixed reply. Subtle cases are handled by the STRICT DOMAIN BOUNDARY in the AI prompt.
// Crisis messages are checked earlier (precheck) and always win over this filter.

export const OFF_TOPIC_REPLY =
  "This is not something we are here to discuss. Is there anything that I can help you with related to your therapy?";

export type BoundaryHit = { kind: "injection" | "politics" | "news" | "gossip" | "trivia" | "coding" | "math" | "homework" | "knowledge" | "shopping" | "recipe" | "medical" | "legal" };

const any = (t: string, list: RegExp[]) => list.some((r) => r.test(t));

// Asking for something / asking a question
const QUESTION = [
  /\?\s*$/,
  /^(what|who|whom|whose|when|where|which|why|how|is|are|was|were|do|does|did|can|could|would|will|should|shall|tell|give|show|list|name|explain|define|recommend|suggest)\b/,
  /\b(what is|what's|what are|who is|who's|who was|who won|when (is|was|did|will)|where is|how (do|does|to|many|much|far|old|long)|can you|could you|would you|will you|please|tell me|give me|show me|let me know|do you know|what do you think|your (opinion|view|take)|should i (take|use|buy|watch|sue|vote))\b/,
];
// Doing a task for the user (always off-topic when paired with a subject below)
const TASK = [
  /\b(write|rewrite|draft|compose|generate|solve|calculate|compute|find|fix|evaluate|simplify|debug|translate|summari[sz]e|paraphrase|convert|do my|finish my|complete my|make me an?|create an?|build an?|sing|rap|play)\b/,
  /\bgive me (the |an? )?(answer|answers|code|recipe|essay|summary|solution|list)\b/,
  /\bhelp me (write|solve|code|debug|with (my )?(homework|assignment|code|essay|maths?|project report))\b/,
];
// Personal feelings: if present (and it's not a hard task), it's venting, so stay on topic
const FEELING = /\b(i feel|i'?m feeling|feeling|i am (so |really |very )?(stressed|anxious|sad|scared|worried|tired|lost|lonely|overwhelmed|nervous|angry|upset|frustrated|depressed|hopeless|burnt out|demotivated)|i'?m (so |really |very )?(stressed|anxious|sad|scared|worried|tired|lost|lonely|overwhelmed|nervous|angry|upset|frustrated|depressed|hopeless|burnt out|demotivated)|stress(es|ed|ing)? (me )?(out|about)|stresses me|stressful|anxiety|scared|afraid|nervous|worried|can'?t (cope|handle|sleep|focus|stop)|panic|crying|cry|heartbroken|breakup|broke up|ghosted|pressure|burnout|procrastinat|overthink|my (mind|heart)|hurts?|mann? nahi|tension|pareshan|dukhi|udaas|dar lag)\b/;

const SUBJECTS: Record<Exclude<BoundaryHit["kind"], "injection" | "politics" | "medical" | "legal">, RegExp[]> = {
  news: [/\b(latest news|news (today|about|on)|headlines|current affairs|current events|what happened (in|at|to)|stock (price|market)|share price|sensex|nifty|bitcoin|crypto|weather|forecast|ipl|cricket score|match score|world cup|who won)\b/],
  gossip: [/\b(net worth|how rich|gossip|rumou?rs?|who is .{1,30} dating|is .{1,30} (married|dating|divorced)|your (wife|husband|kids|children|daughter|son|family life|girlfriend|boyfriend|songs?|albums?|movies?|films?|net worth|salary|age|birthday))\b/],
  trivia: [/\b(movie|movies|film|films|song|songs|album|albums|tv show|web series|series|book|books|novel|anime|lyrics|box office|oscar|grammy|filmography|discography|cast of|release date|actor|actress|singer|rapper|bollywood|hollywood)\b/, /\b(sing|rap) (me |for me|a song|something)\b/],
  coding: [/\b(code|coding|program|programming|script|function|bug|debug|compile|compiler|python|javascript|typescript|java|c\+\+|html|css|sql|regex|api|algorithm|leetcode|github|react|node\.?js|excel formula|recursion|loop|variable|array|linked list|data structures?|oops|object oriented|database|machine learning)\b/],
  math: [/\d\s*[a-z]?\s*[-+*/x×÷^=]\s*\d/, /\d+\s*%/, /\b(equation|integral|derivative|differentiate|integrate|algebra|calculus|trigonometry|probability|solve for|square root|percentage of|math problem|maths problem|sum of|factorial|matrix|theorem)\b/],
  homework: [/\b(essay|assignment|homework|thesis|dissertation|cover letter|resume|cv|email to|letter to|paragraph on|poem|short story|story about|summary of|notes on|answer key|question paper|mcq|project report|presentation on|ppt on|lab report|case study)\b/],
  knowledge: [/\b(capital of|population of|distance (from|between)|history of|who invented|who discovered|meaning of|definition of|how does .{1,40} work|tallest|largest|smallest|fastest|planet|solar system|currency of|founder of|ceo of|speed of light|world war|facts? about|trivia|general knowledge|gk question|full form of|which country|what year)\b/],
  shopping: [/\b(should i buy|which (phone|laptop|car|bike|scooter|brand|headphones?|tv|watch|course) (should|to|is)|best (phone|laptop|headphones?|car|bike|tv|watch|deal|course)|iphone|samsung|price of|cheapest|discount|coupon|amazon|flipkart)\b/],
  recipe: [/\b(recipe|recipes|how to (cook|make|bake|prepare)|ingredients for|biryani|pasta|cake|cookies|curry|dal|paneer|cocktail|smoothie)\b/],
};

const INJECTION = [
  /\b(ignore|disregard|forget|override|bypass)\b.{0,40}\b(instructions?|rules?|prompt|guidelines|restrictions?|previous|above|everything)\b/,
  /\b(system|developer|hidden|initial) (prompt|message|instructions?)\b/,
  /\b(reveal|show|print|repeat|leak)\b.{0,30}\b(instructions?|prompt|rules?|guidelines)\b/,
  /\b(jailbreak|jail break|dan mode|do anything now|developer mode|god mode|unfiltered|no restrictions|without restrictions)\b/,
  /\b(you are now|from now on you are|pretend (to be|you are|you're)|act as|roleplay as|role-play as|behave like|simulate)\b.{0,40}\b(ai|chatgpt|gpt|assistant|bot|model|linux|terminal|calculator|lawyer|doctor|teacher|tutor|translator|search engine|different|another|someone else|evil|unrestricted)\b/,
  /\b(drop|break|exit|leave|stop)\b.{0,15}\b(character|the act|roleplay|role-play|persona)\b/,
  /\b(are you|r u)\b.{0,10}\b(chatgpt|gpt|claude|gemini|llama|an? (ai|llm|language model|bot))\b/,
  /\b(what|which) (model|llm|ai) are you\b/,
  /\b(repeat|print|output|copy|show)\b.{0,40}\b(text|words|everything|message|messages|lines?)\b.{0,25}\b(above|before|earlier|starting with|verbatim)\b/,
  /\byou are (a|an) (pirate|robot|cat|dog|teacher|chef|lawyer|doctor|hacker|poet|comedian)\b/,
  /\bignore (everything|all|that|this)\b/,
  /^(system|assistant|developer|admin)\s*:/,
  /\bnew (instructions|rules|role|persona)\b/,
  /\banswer (all|any|every) (questions?|thing)\b/,
];

const POLITICS = /\b(prime minister|president|chief minister|minister|mla|mp\b|governor|election|elections|vote for|voting for|who should i vote|bjp|congress party|aap party|democrats?|republicans?|left wing|right wing|parliament|lok sabha|rajya sabha|senate|government policy|policies|politics|political|politician|manifesto|campaign|war in|ukraine|russia|gaza|israel|palestine|pakistan|china|tariffs?|immigration|biden|obama|kamala|harris|rahul gandhi|kejriwal|putin|xi jinping|nehru|gandhi|ambedkar|caste|religion|hindu|muslim|christian|temple|mosque|church)\b/;
const POLITICS_OK = /\b(office politics|politics at (work|office|home|college|school)|family politics|group politics|friend group politics)\b/;
const OPINION = /\b(what do you think|your (opinion|view|take|thoughts)|do you (support|like|hate|agree)|who (is|was) better|who should|is .{1,30} (good|bad|right|wrong))\b/;

const MEDICAL = /\b(medicine|medicines|medication|meds|tablet|tablets|pill|pills|dosage|dose|mg\b|prescribe|prescription drug|antidepressants?|ssri|xanax|zoloft|prozac|lexapro|melatonin|sleeping pills?|paracetamol|ibuprofen|antibiotic|side effects?|diagnos(e|is)|do i have (adhd|depression|anxiety|bipolar|ocd|ptsd|autism|cancer|diabetes|covid)|symptoms of|treatment for|cure for|disease|blood pressure|therapy medication)\b/;
const LEGAL = /\b(lawyer|advocate|legal advice|legally|sue|suing|lawsuit|court|fir\b|police complaint|file a case|divorce papers|contract|tax|taxes|gst|ipc|section \d+|bail|is it (legal|illegal)|illegal|copyright|visa|immigration law|rental agreement|landlord law)\b/;

// Producing something for the user: always off-topic (writing, solving, coding, translating, performing...)
const GENERATE =
  /(^|[.!?,]\s*|\b(can|could|would|will) you (please )?|\bplease |\bhelp me (to )?|\bi (want|need) you to |\bi want (a|an|the) )(write|rewrite|draft|compose|generate|solve|calculate|compute|evaluate|simplify|debug|fix|code|program|translate|summari[sz]e|paraphrase|convert|repeat|sing|rap|create|build|design|plan|make (me )?(a|an|the|my)\b|give me (the |an? |some )?(answer|answers|code|recipe|essay|summary|solution|list|poem|story|song|caption|bio|post|script))/;
// First-person or life-and-feelings words: if present, a question is about the user's own life
const PERSONAL = /\b(i|i'm|im|i've|i'd|i'll|me|my|mine|myself|we|our|us|mujhe|mera|meri|mere|main|hum|humara|apna)\b/;
const LIFE =
  /\b(feel|feeling|feelings|emotion|emotions|stress|stressed|anxiety|anxious|sad|sadness|lonely|loneliness|heartbreak|heartbroken|breakup|love|relationship|relationships|crush|ex|friend|friends|friendship|family|parents|mom|dad|sibling|exam|exams|study|studying|career|job|boss|office|college|school|placement|interview|procrastination|procrastinate|burnout|burnt out|motivation|confidence|self[- ]?esteem|overthinking|overthink|sleep|tired|guilt|guilty|fear|failure|rejection|pressure|life|future|mental|mind|cope|coping|healing|move on|calm|relax|happy|happiness|anger|angry|jealous|jealousy)\b/;
const REQUEST_PHRASES = /\b(tell|give|show|help|let|teach|make) me\b|\b(can|could|would|will) you\b|\bdo you know\b|\bplease\b/g;
// Self-medication or remedies for a mental state
const REMEDY = /\b(take|try|use|drink|eat|consume)\b.{0,25}\b(for|to (cure|treat|fix|help with))\b.{0,15}\b(stress|anxiety|sleep|insomnia|depression|panic|focus|adhd)\b/;
const HEALTHY_REMEDY = /\b(walk|break|nap|rest|bath|shower|day off|holiday|leave|vacation|breath|breathe|breathing|journal|journaling|music|yoga|meditat\w*|water|friend)\b/;
const SUPPLEMENTS = /\b(ashwagandha|supplements?|vitamins?|cbd|weed|marijuana|ganja|alcohol|whisky|vodka|beer|nicotine|cigarettes?|vape|caffeine pills?|modafinil|adderall|ritalin|valium|alprazolam|benzos?)\b/;

export function checkBoundary(input: string): BoundaryHit | null {
  const t = input.toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, " ").trim();
  if (!t) return null;

  if (any(t, INJECTION)) return { kind: "injection" };

  const asks = any(t, QUESTION);
  const task = any(t, TASK);
  const feels = FEELING.test(t);
  const stripped = t.replace(REQUEST_PHRASES, " ");
  const personal = PERSONAL.test(stripped) || LIFE.test(stripped);

  // Medical and legal advice: off limits whenever they ask, even while venting
  if (MEDICAL.test(t) && (asks || task)) return { kind: "medical" };
  if (SUPPLEMENTS.test(t) && (asks || task)) return { kind: "medical" };
  if (REMEDY.test(t) && !HEALTHY_REMEDY.test(t)) return { kind: "medical" };
  if (LEGAL.test(t) && (asks || task)) return { kind: "legal" };

  // Politics / real-world opinions: off limits when they ask or want an opinion (office politics is fine)
  if (POLITICS.test(t) && !POLITICS_OK.test(t) && (asks || task || OPINION.test(t) || !feels)) return { kind: "politics" };

  // Asking the therapist to produce or perform something: never part of therapy
  if (GENERATE.test(t) && !/\bmake me feel\b/.test(t)) return { kind: "homework" };

  for (const [kind, patterns] of Object.entries(SUBJECTS) as [keyof typeof SUBJECTS, RegExp[]][]) {
    if (!any(t, patterns)) continue;
    if (task) return { kind };
    if (asks && !feels) return { kind };
  }

  // Any other question or request that isn't about the user's own life or feelings
  if ((asks || task) && !personal) return { kind: "knowledge" };
  return null;
}
