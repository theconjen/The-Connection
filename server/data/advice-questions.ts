/**
 * Advice Questions Bank for Community Advice Feature
 * 200+ authentic, relatable questions across multiple categories
 *
 * Used by: seed-advice-with-engagement.ts, advice-bot.ts
 */

export interface AdviceQuestion {
  content: string;
  category: string;
  anonymousNickname?: string;
  tags: string[];
}

// ============================================================================
// BOT PERSONAS - Realistic profiles that match real users
// ============================================================================

export interface BotPersona {
  username: string;
  displayName: string;
  bio: string;
  church?: string;
  location: string;
  favoriteVerse: string;
  interests: string[];
  voiceStyle: 'warm' | 'practical' | 'encouraging' | 'thoughtful' | 'relatable';
}

export const BOT_PERSONAS: BotPersona[] = [
  {
    username: "sarah_momof3",
    displayName: "Sarah M.",
    bio: "Mom of 3 under 7. Coffee lover. Grace-dependent. Learning to rest in the chaos.",
    church: "Grace Community Church",
    location: "Dallas, TX",
    favoriteVerse: "Lamentations 3:22-23",
    interests: ["parenting", "marriage", "faith"],
    voiceStyle: "warm",
  },
  {
    username: "mike_worshipguy",
    displayName: "Mike T.",
    bio: "Worship leader by night, accountant by day. Music is my love language.",
    church: "Hillside Baptist",
    location: "Austin, TX",
    favoriteVerse: "Psalm 100:4",
    interests: ["worship", "music", "faith"],
    voiceStyle: "encouraging",
  },
  {
    username: "newtofaith23",
    displayName: "Jordan",
    bio: "Came to faith 2 years ago. Still figuring this out. Ask me anything - I probably have the same question.",
    location: "Houston, TX",
    favoriteVerse: "2 Corinthians 5:17",
    interests: ["new-believer", "questions", "growth"],
    voiceStyle: "relatable",
  },
  {
    username: "pastor_dave",
    displayName: "Dave Wilson",
    bio: "Bi-vocational pastor. 20 years in ministry. Still learning every day.",
    church: "New Life Community",
    location: "San Antonio, TX",
    favoriteVerse: "Micah 6:8",
    interests: ["ministry", "leadership", "discipleship"],
    voiceStyle: "thoughtful",
  },
  {
    username: "running4jesus",
    displayName: "Marcus J.",
    bio: "Marathon runner. Youth group leader. Trying to keep up with both.",
    church: "Fellowship Church",
    location: "Fort Worth, TX",
    favoriteVerse: "Hebrews 12:1",
    interests: ["fitness", "youth-ministry", "sports"],
    voiceStyle: "encouraging",
  },
  {
    username: "grace_in_progress",
    displayName: "Emily R.",
    bio: "Recovering perfectionist. Therapist in training. Big fan of messy faith.",
    location: "Online Community",
    favoriteVerse: "Romans 8:1",
    interests: ["mental-health", "healing", "grace"],
    voiceStyle: "warm",
  },
  {
    username: "blue_collar_believer",
    displayName: "Tom K.",
    bio: "Electrician. Deacon. Simple faith for a complicated world.",
    church: "First Baptist",
    location: "Tyler, TX",
    favoriteVerse: "Colossians 3:23",
    interests: ["work", "faith", "practical-living"],
    voiceStyle: "practical",
  },
  {
    username: "teacher_tina",
    displayName: "Tina H.",
    bio: "3rd grade teacher. Sunday school teacher. Basically I just really love kids.",
    church: "Crosspoint Church",
    location: "Plano, TX",
    favoriteVerse: "Proverbs 22:6",
    interests: ["teaching", "kids", "parenting"],
    voiceStyle: "warm",
  },
  {
    username: "military_wife_strong",
    displayName: "Rachel S.",
    bio: "Army wife. 4 moves in 6 years. Finding home in Jesus, not zip codes.",
    location: "Currently in Georgia",
    favoriteVerse: "Isaiah 41:10",
    interests: ["military-life", "transitions", "marriage"],
    voiceStyle: "encouraging",
  },
  {
    username: "empty_nest_nancy",
    displayName: "Nancy B.",
    bio: "Empty nester discovering who I am when I'm not just 'mom'. Loving this season.",
    church: "Christ the King",
    location: "Frisco, TX",
    favoriteVerse: "Jeremiah 29:11",
    interests: ["empty-nest", "identity", "growth"],
    voiceStyle: "thoughtful",
  },
];

// Get a random bot persona
export function getRandomBotPersona(): BotPersona {
  return BOT_PERSONAS[Math.floor(Math.random() * BOT_PERSONAS.length)];
}

// Get personas that match certain interests
export function getBotPersonasByInterest(interest: string): BotPersona[] {
  return BOT_PERSONAS.filter(p => p.interests.includes(interest));
}

// ============================================================================
// SCRIPTURE REFERENCES FOR REPLIES
// ============================================================================

export const SCRIPTURE_REFERENCES = [
  { verse: "Philippians 4:6-7", text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God." },
  { verse: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future." },
  { verse: "Romans 8:28", text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." },
  { verse: "Isaiah 40:31", text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles." },
  { verse: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart and lean not on your own understanding." },
  { verse: "1 Peter 5:7", text: "Cast all your anxiety on him because he cares for you." },
  { verse: "Matthew 11:28", text: "Come to me, all you who are weary and burdened, and I will give you rest." },
  { verse: "Psalm 46:10", text: "Be still, and know that I am God." },
  { verse: "2 Corinthians 12:9", text: "My grace is sufficient for you, for my power is made perfect in weakness." },
  { verse: "James 1:5", text: "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault." },
  { verse: "Psalm 23:4", text: "Even though I walk through the darkest valley, I will fear no evil, for you are with me." },
  { verse: "Romans 15:13", text: "May the God of hope fill you with all joy and peace as you trust in him." },
  { verse: "Lamentations 3:22-23", text: "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning." },
  { verse: "Hebrews 4:16", text: "Let us then approach God's throne of grace with confidence, so that we may receive mercy and find grace to help us in our time of need." },
  { verse: "Psalm 34:18", text: "The Lord is close to the brokenhearted and saves those who are crushed in spirit." },
];

// Get a random scripture reference
export function getRandomScripture(): typeof SCRIPTURE_REFERENCES[0] {
  return SCRIPTURE_REFERENCES[Math.floor(Math.random() * SCRIPTURE_REFERENCES.length)];
}

// ============================================================================
// CROSS-PROMOTION TEMPLATES (mention other communities)
// ============================================================================

export const CROSS_PROMOTION_TEMPLATES = [
  "This sounds like something the {community} group talks about a lot - might be worth checking out for ongoing support!",
  "Have you looked into the {community} community? They have great discussions on this topic.",
  "If you're looking for more people walking through this, the {community} group might be helpful.",
  "The {community} community has been a great resource for me on stuff like this.",
  "Not sure if you've seen it, but there's a {community} group here that deals with exactly this.",
];

export const COMMUNITY_MENTIONS = [
  "Accountability Partners",
  "Prayer Warriors",
  "Marriage Enrichment",
  "Recovery & Freedom",
  "Young Professionals",
  "Parents Circle",
  "Men's Ministry",
  "Women's Ministry",
  "Empty Nesters",
  "Grief Support",
];

// Get a random cross-promotion
export function getRandomCrossPromotion(): string {
  const template = CROSS_PROMOTION_TEMPLATES[Math.floor(Math.random() * CROSS_PROMOTION_TEMPLATES.length)];
  const community = COMMUNITY_MENTIONS[Math.floor(Math.random() * COMMUNITY_MENTIONS.length)];
  return template.replace("{community}", community);
}

// ============================================================================
// ANONYMOUS NICKNAMES (for anonymous posts)
// ============================================================================

// Anonymous nicknames that feel real and relatable
export const ANONYMOUS_NICKNAMES = [
  "Seeking Wisdom",
  "Learning Daily",
  "Grateful Heart",
  "New Believer",
  "Seasoned Saint",
  "Curious Mind",
  "Hopeful Heart",
  "Still Standing",
  "Work in Progress",
  "Just Wondering",
  "Humble Seeker",
  "Faith Walker",
  "Trusting God",
  "Growing Slowly",
  "Praying Mom",
  "Tired Dad",
  "Young Professional",
  "Empty Nester",
  "College Student",
  "Single and Seeking",
  "Newly Married",
  "Church Planter",
  "Small Group Leader",
  "Worship Leader",
  "Youth Pastor's Wife",
  "First Gen Christian",
  "Prodigal Returned",
  "Career Changer",
  "Military Spouse",
  "Homeschool Mom",
  "Stay at Home Dad",
  "Recovering Perfectionist",
  "Anxious Believer",
  "Former Atheist",
  "Pastor's Kid",
  "Missionary Kid",
  "Introverted Christian",
  "Night Shift Nurse",
  "Blue Collar Believer",
  "Suburban Mom",
  "City Dweller",
  "Rural Pastor",
  "Bi-vocational Minister",
  "Seminary Student",
  "Recently Widowed",
  "Blended Family",
  "Foster Parent",
  "Adoptive Mom",
  "Special Needs Parent",
  "Caregiver",
];

// ============================================================================
// FAITH & SPIRITUAL GROWTH (40+ questions)
// ============================================================================

const faithQuestions: AdviceQuestion[] = [
  {
    content: "How do you handle doubt without losing faith? Been wrestling with some hard questions lately.",
    category: "faith",
    tags: ["faith", "doubt", "questions"],
  },
  {
    content: "What's one thing you wish someone told you when you first became a Christian?",
    category: "faith",
    tags: ["new-believer", "advice", "wisdom"],
  },
  {
    content: "How do you stay connected to God when life gets crazy busy?",
    category: "faith",
    tags: ["busy", "spiritual-life", "discipline"],
  },
  {
    content: "Is it okay to be angry at God? Because I am right now.",
    category: "faith",
    tags: ["anger", "honesty", "struggle"],
  },
  {
    content: "What does your quiet time actually look like? Mine feels so inconsistent.",
    category: "faith",
    tags: ["quiet-time", "devotion", "discipline"],
  },
  {
    content: "How do you pray when you don't know what to say? I feel like I'm just rambling.",
    category: "faith",
    tags: ["prayer", "struggle", "growth"],
  },
  {
    content: "What Bible reading plan actually worked for you? I've started and stopped so many.",
    category: "faith",
    tags: ["bible", "reading-plan", "discipline"],
  },
  {
    content: "How do you hear God's voice? I see people saying 'God told me...' and I wonder what I'm missing.",
    category: "faith",
    tags: ["hearing-god", "guidance", "faith"],
  },
  {
    content: "What's helped you move from head knowledge about God to actually feeling close to Him?",
    category: "faith",
    tags: ["intimacy", "relationship", "growth"],
  },
  {
    content: "How do you handle it when prayers go unanswered for years?",
    category: "faith",
    tags: ["prayer", "waiting", "faith"],
  },
  {
    content: "What do you do when you just don't feel God's presence anymore?",
    category: "faith",
    tags: ["dry-season", "faith", "struggle"],
  },
  {
    content: "How did you figure out your spiritual gifts? I still don't know what mine are.",
    category: "faith",
    tags: ["spiritual-gifts", "calling", "identity"],
  },
  {
    content: "What book besides the Bible has most impacted your faith?",
    category: "faith",
    tags: ["books", "growth", "recommendations"],
  },
  {
    content: "How do you balance grace and truth? I tend to lean too far one way.",
    category: "faith",
    tags: ["grace", "truth", "balance"],
  },
  {
    content: "What does fasting look like for you? Is it just food or other things too?",
    category: "faith",
    tags: ["fasting", "discipline", "spiritual-life"],
  },
  {
    content: "How do you deal with repetitive sins you keep confessing? Feels like a broken record.",
    category: "faith",
    tags: ["sin", "struggle", "confession"],
  },
  {
    content: "What's helped you actually memorize Scripture? Nothing seems to stick for me.",
    category: "faith",
    tags: ["memorization", "scripture", "discipline"],
  },
  {
    content: "How do you worship God when you're going through something really hard?",
    category: "faith",
    tags: ["worship", "trials", "faith"],
  },
  {
    content: "What does surrendering to God actually look like practically?",
    category: "faith",
    tags: ["surrender", "control", "faith"],
  },
  {
    content: "How do you stay spiritually sharp when church feels dry or routine?",
    category: "faith",
    tags: ["church", "growth", "routine"],
  },
  {
    content: "What's a verse that changed everything for you? Looking for something to anchor on.",
    category: "faith",
    tags: ["scripture", "anchor", "favorites"],
  },
  {
    content: "How do you handle seasons where serving feels more like obligation than joy?",
    category: "faith",
    tags: ["serving", "burnout", "ministry"],
  },
  {
    content: "What helps you remember what God has done? I forget so quickly.",
    category: "faith",
    tags: ["remembering", "gratitude", "faithfulness"],
  },
  {
    content: "How do you approach the confusing or controversial parts of the Bible?",
    category: "faith",
    tags: ["bible", "difficult-passages", "study"],
  },
  {
    content: "What's your advice for someone who believes in God but struggles to trust Him?",
    category: "faith",
    tags: ["trust", "faith", "struggle"],
  },
  {
    content: "How do you explain your faith to someone who thinks Christianity is outdated?",
    category: "faith",
    tags: ["apologetics", "culture", "witness"],
  },
  {
    content: "What helped you stop comparing your faith journey to others?",
    category: "faith",
    tags: ["comparison", "identity", "growth"],
  },
  {
    content: "How do you find community as a Christian introvert? Church socials drain me.",
    category: "faith",
    tags: ["introvert", "community", "church"],
  },
  {
    content: "What does rest actually look like for you? I struggle to Sabbath well.",
    category: "faith",
    tags: ["sabbath", "rest", "discipline"],
  },
  {
    content: "How do you share your testimony when it's not dramatic? Mine feels too boring.",
    category: "faith",
    tags: ["testimony", "evangelism", "identity"],
  },
  {
    content: "What's helped you forgive someone who never apologized?",
    category: "faith",
    tags: ["forgiveness", "healing", "relationships"],
  },
  {
    content: "How do you stay hopeful about the future when the world feels so broken?",
    category: "faith",
    tags: ["hope", "world", "future"],
  },
  {
    content: "What do you do when you're spiritually exhausted but everyone needs something from you?",
    category: "faith",
    tags: ["exhaustion", "boundaries", "ministry"],
  },
  {
    content: "How do you deal with the guilt of past sins even though you know you're forgiven?",
    category: "faith",
    tags: ["guilt", "forgiveness", "past"],
  },
  {
    content: "What's your go-to when spiritual warfare feels real and heavy?",
    category: "faith",
    tags: ["spiritual-warfare", "struggle", "victory"],
  },
  {
    content: "How do you steward a platform or influence for God without getting prideful?",
    category: "faith",
    tags: ["influence", "humility", "leadership"],
  },
  {
    content: "What helps you stay grounded when life is actually going well?",
    category: "faith",
    tags: ["prosperity", "humility", "gratitude"],
  },
  {
    content: "How do you handle Christians who hurt you worse than non-Christians ever did?",
    category: "faith",
    tags: ["church-hurt", "forgiveness", "healing"],
  },
  {
    content: "Church hurt is real. How long did it take you to trust a church again?",
    category: "faith",
    tags: ["church-hurt", "trust", "healing"],
  },
  {
    content: "How do you deal with Christians who are worse people than your non-Christian friends?",
    category: "faith",
    tags: ["hypocrisy", "frustration", "grace"],
  },
];

// ============================================================================
// RELATIONSHIPS & MARRIAGE (35+ questions)
// ============================================================================

const relationshipQuestions: AdviceQuestion[] = [
  {
    content: "My spouse and I disagree on how to raise our kids spiritually. How do you navigate that?",
    category: "relationships",
    tags: ["marriage", "parenting", "disagreement"],
  },
  {
    content: "How do you set boundaries with toxic family members while still honoring them?",
    category: "relationships",
    tags: ["family", "boundaries", "honor"],
  },
  {
    content: "Dating as a Christian in 2025 is rough. What's actually working for you?",
    category: "relationships",
    tags: ["dating", "singleness", "modern"],
  },
  {
    content: "How do you keep your marriage fresh after 10+ years? We're in a rut.",
    category: "relationships",
    tags: ["marriage", "long-term", "intimacy"],
  },
  {
    content: "What do you do when your spouse isn't interested in growing spiritually?",
    category: "relationships",
    tags: ["marriage", "spiritual-growth", "unequal"],
  },
  {
    content: "How do you handle in-laws who don't respect your boundaries?",
    category: "relationships",
    tags: ["in-laws", "boundaries", "family"],
  },
  {
    content: "What's helped you forgive a spouse who broke your trust?",
    category: "relationships",
    tags: ["marriage", "trust", "forgiveness"],
  },
  {
    content: "How do you stay content in singleness when everyone around you is getting married?",
    category: "relationships",
    tags: ["singleness", "contentment", "waiting"],
  },
  {
    content: "What does healthy conflict look like in marriage? We either explode or shut down.",
    category: "relationships",
    tags: ["marriage", "conflict", "communication"],
  },
  {
    content: "How do you reconnect with your spouse after a season of just being roommates?",
    category: "relationships",
    tags: ["marriage", "intimacy", "reconnect"],
  },
  {
    content: "What do you do when you love your spouse but aren't in love with them anymore?",
    category: "relationships",
    tags: ["marriage", "love", "feelings"],
  },
  {
    content: "How did you know you were ready to get married? I'm scared to make the wrong choice.",
    category: "relationships",
    tags: ["dating", "engagement", "decision"],
  },
  {
    content: "How do you maintain friendships after having kids? I've lost touch with everyone.",
    category: "relationships",
    tags: ["friendship", "parenting", "community"],
  },
  {
    content: "What's helped you and your spouse get on the same page about finances?",
    category: "relationships",
    tags: ["marriage", "finances", "agreement"],
  },
  {
    content: "How do you deal with loneliness in marriage? It's not supposed to feel this way.",
    category: "relationships",
    tags: ["marriage", "loneliness", "connection"],
  },
  {
    content: "What do you do when your family doesn't approve of your relationship?",
    category: "relationships",
    tags: ["family", "dating", "approval"],
  },
  {
    content: "How do you rebuild a friendship after a major falling out?",
    category: "relationships",
    tags: ["friendship", "reconciliation", "healing"],
  },
  {
    content: "How do you support a friend going through something you've never experienced?",
    category: "relationships",
    tags: ["friendship", "support", "empathy"],
  },
  {
    content: "What's the hardest part of marriage no one warned you about?",
    category: "relationships",
    tags: ["marriage", "expectations", "reality"],
  },
  {
    content: "How do you date your spouse when money is tight and babysitters are expensive?",
    category: "relationships",
    tags: ["marriage", "dating", "budget"],
  },
  {
    content: "How do you navigate different love languages when yours are opposite?",
    category: "relationships",
    tags: ["marriage", "love-languages", "connection"],
  },
  {
    content: "What do you do when your spouse's family has different values than yours?",
    category: "relationships",
    tags: ["marriage", "family", "values"],
  },
  {
    content: "How did you handle the transition from engaged to married? The first year was hard.",
    category: "relationships",
    tags: ["newlywed", "transition", "expectations"],
  },
  {
    content: "How do you stay close to friends who are in different life stages?",
    category: "relationships",
    tags: ["friendship", "life-stages", "connection"],
  },
  {
    content: "What's helped you let go of resentment toward your spouse?",
    category: "relationships",
    tags: ["marriage", "resentment", "forgiveness"],
  },
  {
    content: "How do you find Christian friends as an adult? It was easier in college.",
    category: "relationships",
    tags: ["friendship", "community", "adult"],
  },
  {
    content: "How do you handle a spouse with different political views?",
    category: "relationships",
    tags: ["marriage", "politics", "disagreement"],
  },
  {
    content: "What's your advice for couples considering whether to have kids?",
    category: "relationships",
    tags: ["marriage", "kids", "decision"],
  },
  {
    content: "How do you deal with comparing your relationship to others on social media?",
    category: "relationships",
    tags: ["comparison", "social-media", "contentment"],
  },
  {
    content: "What do you do when your extended family expects too much of your time?",
    category: "relationships",
    tags: ["family", "boundaries", "time"],
  },
  {
    content: "How do you navigate having friends who aren't believers?",
    category: "relationships",
    tags: ["friendship", "non-believers", "balance"],
  },
  {
    content: "What's helped you through a friendship breakup? It hurts more than I expected.",
    category: "relationships",
    tags: ["friendship", "loss", "healing"],
  },
  {
    content: "How do you handle a spouse who processes everything differently than you?",
    category: "relationships",
    tags: ["marriage", "communication", "differences"],
  },
  {
    content: "How do you make time for your marriage when you're both exhausted?",
    category: "relationships",
    tags: ["marriage", "busy", "priority"],
  },
  {
    content: "What's your advice for blended families trying to find their rhythm?",
    category: "relationships",
    tags: ["blended-family", "adjustment", "unity"],
  },
];

// ============================================================================
// WORK & CAREER (30+ questions)
// ============================================================================

const workQuestions: AdviceQuestion[] = [
  {
    content: "Boss asked me to do something unethical. How do you stand your ground without losing your job?",
    category: "work",
    tags: ["ethics", "workplace", "integrity"],
  },
  {
    content: "How do you share your faith at work without being 'that person'?",
    category: "work",
    tags: ["witness", "workplace", "evangelism"],
  },
  {
    content: "Feeling called to ministry but I have a mortgage and kids. How do people actually make that leap?",
    category: "work",
    tags: ["calling", "ministry", "transition"],
  },
  {
    content: "How do you deal with a toxic work environment as a Christian? Quitting isn't an option right now.",
    category: "work",
    tags: ["toxic", "workplace", "survival"],
  },
  {
    content: "What does work-life balance actually look like for you? Mine is nonexistent.",
    category: "work",
    tags: ["balance", "boundaries", "priorities"],
  },
  {
    content: "How do you handle office gossip without seeming holier-than-thou?",
    category: "work",
    tags: ["gossip", "workplace", "integrity"],
  },
  {
    content: "How do you stay motivated in a job you hate while trusting God's timing?",
    category: "work",
    tags: ["motivation", "waiting", "faith"],
  },
  {
    content: "What's helped you navigate being the only Christian in your workplace?",
    category: "work",
    tags: ["isolation", "workplace", "witness"],
  },
  {
    content: "How do you respond when coworkers make fun of your faith?",
    category: "work",
    tags: ["persecution", "workplace", "response"],
  },
  {
    content: "How do you balance ambition with contentment? I want to do well but not be greedy.",
    category: "work",
    tags: ["ambition", "contentment", "success"],
  },
  {
    content: "What's your advice for Christians in sales or commission jobs? The pressure to cut corners is real.",
    category: "work",
    tags: ["sales", "integrity", "pressure"],
  },
  {
    content: "How do you handle working for someone whose values don't align with yours?",
    category: "work",
    tags: ["leadership", "values", "respect"],
  },
  {
    content: "How did you figure out what God wanted you to do for work?",
    category: "work",
    tags: ["calling", "career", "guidance"],
  },
  {
    content: "What's helped you deal with job loss or unexpected unemployment?",
    category: "work",
    tags: ["job-loss", "unemployment", "faith"],
  },
  {
    content: "How do you bring excellence to your work without becoming a workaholic?",
    category: "work",
    tags: ["excellence", "balance", "identity"],
  },
  {
    content: "What do you do when you're overlooked for a promotion you deserved?",
    category: "work",
    tags: ["promotion", "disappointment", "trust"],
  },
  {
    content: "How do you handle business partnerships with non-Christians?",
    category: "work",
    tags: ["business", "partnership", "wisdom"],
  },
  {
    content: "What's your advice for Christians starting their own business?",
    category: "work",
    tags: ["entrepreneur", "business", "faith"],
  },
  {
    content: "How do you make ethical decisions at work when the line isn't clear?",
    category: "work",
    tags: ["ethics", "decisions", "gray-area"],
  },
  {
    content: "How do you deal with imposter syndrome as a Christian professional?",
    category: "work",
    tags: ["imposter-syndrome", "identity", "confidence"],
  },
  {
    content: "What's helped you find purpose in a job that feels meaningless?",
    category: "work",
    tags: ["purpose", "meaning", "perspective"],
  },
  {
    content: "How do you handle making decisions that affect other people's livelihoods?",
    category: "work",
    tags: ["leadership", "decisions", "responsibility"],
  },
  {
    content: "What do you do when success at work requires compromising family time?",
    category: "work",
    tags: ["success", "family", "priorities"],
  },
  {
    content: "How do Christians in healthcare navigate moral dilemmas at work?",
    category: "work",
    tags: ["healthcare", "ethics", "conscience"],
  },
  {
    content: "How do you handle working night shifts or weekends and missing church?",
    category: "work",
    tags: ["schedule", "church", "community"],
  },
  {
    content: "What's helped you lead with integrity when the pressure is on?",
    category: "work",
    tags: ["leadership", "integrity", "pressure"],
  },
  {
    content: "How do you deal with jealousy when a coworker gets what you've been working for?",
    category: "work",
    tags: ["jealousy", "comparison", "contentment"],
  },
  {
    content: "How do you pray about big career decisions? I don't want to miss God's will.",
    category: "work",
    tags: ["decisions", "prayer", "guidance"],
  },
  {
    content: "What's your experience with Christian networking or faith-based business groups?",
    category: "work",
    tags: ["networking", "community", "business"],
  },
  {
    content: "How do you respond when your job conflicts with Sundays or religious holidays?",
    category: "work",
    tags: ["schedule", "holidays", "boundaries"],
  },
];

// ============================================================================
// MENTAL HEALTH & STRUGGLES (35+ questions)
// ============================================================================

const mentalHealthQuestions: AdviceQuestion[] = [
  {
    content: "Anyone else deal with anxiety despite having faith? How do you reconcile that?",
    category: "mental-health",
    tags: ["anxiety", "faith", "struggle"],
  },
  {
    content: "How do you fight loneliness when you're surrounded by people at church?",
    category: "mental-health",
    tags: ["loneliness", "church", "connection"],
  },
  {
    content: "Addiction keeps pulling me back. What actually helped you break free?",
    category: "mental-health",
    tags: ["addiction", "freedom", "recovery"],
  },
  {
    content: "How do you deal with depression without feeling like a bad Christian?",
    category: "mental-health",
    tags: ["depression", "faith", "shame"],
  },
  {
    content: "What's helped you process grief that feels like it will never end?",
    category: "mental-health",
    tags: ["grief", "loss", "healing"],
  },
  {
    content: "How do you stop the spiral of negative thoughts? They're relentless.",
    category: "mental-health",
    tags: ["thoughts", "anxiety", "mind"],
  },
  {
    content: "Is therapy compatible with faith? Some people make me feel guilty for going.",
    category: "mental-health",
    tags: ["therapy", "faith", "help"],
  },
  {
    content: "How did you find a Christian counselor who actually helped?",
    category: "mental-health",
    tags: ["counseling", "therapy", "resources"],
  },
  {
    content: "What do you do when you feel numb spiritually and emotionally?",
    category: "mental-health",
    tags: ["numbness", "feeling", "breakthrough"],
  },
  {
    content: "How do you handle panic attacks? They come out of nowhere.",
    category: "mental-health",
    tags: ["panic", "anxiety", "coping"],
  },
  {
    content: "What's helped you with insomnia or racing thoughts at night?",
    category: "mental-health",
    tags: ["insomnia", "sleep", "anxiety"],
  },
  {
    content: "How do you support a spouse dealing with mental health issues?",
    category: "mental-health",
    tags: ["marriage", "support", "mental-health"],
  },
  {
    content: "How do you talk to your kids about your own mental health struggles?",
    category: "mental-health",
    tags: ["parenting", "honesty", "mental-health"],
  },
  {
    content: "What helped you stop self-medicating with food, alcohol, or other things?",
    category: "mental-health",
    tags: ["coping", "addiction", "healing"],
  },
  {
    content: "How do you maintain boundaries when you're a natural people-pleaser?",
    category: "mental-health",
    tags: ["boundaries", "people-pleasing", "health"],
  },
  {
    content: "What's helped you recover from burnout? I'm running on empty.",
    category: "mental-health",
    tags: ["burnout", "rest", "recovery"],
  },
  {
    content: "How do you deal with intrusive thoughts that make you feel like a terrible person?",
    category: "mental-health",
    tags: ["thoughts", "shame", "struggle"],
  },
  {
    content: "What does self-care look like that isn't just bubble baths and face masks?",
    category: "mental-health",
    tags: ["self-care", "practical", "health"],
  },
  {
    content: "How do you ask for help when you've always been the strong one?",
    category: "mental-health",
    tags: ["help", "vulnerability", "strength"],
  },
  {
    content: "What helped you stop living in survival mode?",
    category: "mental-health",
    tags: ["survival", "thriving", "healing"],
  },
  {
    content: "How do you deal with the shame of past mistakes that keep haunting you?",
    category: "mental-health",
    tags: ["shame", "past", "freedom"],
  },
  {
    content: "What's your experience with medication for mental health as a Christian?",
    category: "mental-health",
    tags: ["medication", "mental-health", "help"],
  },
  {
    content: "How do you rebuild your identity after a major life change?",
    category: "mental-health",
    tags: ["identity", "change", "rebuilding"],
  },
  {
    content: "What helped you stop catastrophizing everything?",
    category: "mental-health",
    tags: ["anxiety", "thinking", "peace"],
  },
  {
    content: "How do you handle triggers that bring back past trauma?",
    category: "mental-health",
    tags: ["trauma", "triggers", "healing"],
  },
  {
    content: "What's helped you feel emotions again after years of shutting them down?",
    category: "mental-health",
    tags: ["emotions", "healing", "feeling"],
  },
  {
    content: "How do you deal with the mental load of being the one who carries everything?",
    category: "mental-health",
    tags: ["mental-load", "stress", "responsibility"],
  },
  {
    content: "What's your advice for someone who's never processed childhood stuff?",
    category: "mental-health",
    tags: ["childhood", "healing", "therapy"],
  },
  {
    content: "How do you separate your worth from your productivity?",
    category: "mental-health",
    tags: ["worth", "productivity", "identity"],
  },
  {
    content: "What helped you get through a season when nothing brought joy?",
    category: "mental-health",
    tags: ["depression", "joy", "perseverance"],
  },
  {
    content: "How do you handle comparison that steals your peace?",
    category: "mental-health",
    tags: ["comparison", "peace", "contentment"],
  },
  {
    content: "What's helped you process anger in a healthy way?",
    category: "mental-health",
    tags: ["anger", "emotions", "health"],
  },
  {
    content: "How do you deal with fear of the future?",
    category: "mental-health",
    tags: ["fear", "future", "trust"],
  },
  {
    content: "What resources have helped you understand trauma and faith together?",
    category: "mental-health",
    tags: ["trauma", "faith", "resources"],
  },
  {
    content: "How do you know when to take a mental health break vs push through?",
    category: "mental-health",
    tags: ["rest", "perseverance", "wisdom"],
  },
];

// ============================================================================
// PARENTING & FAMILY (30+ questions)
// ============================================================================

const parentingQuestions: AdviceQuestion[] = [
  {
    content: "Teenagers questioning everything we taught them. Is this normal? How do I respond?",
    category: "parenting",
    tags: ["teenagers", "faith", "doubt"],
  },
  {
    content: "How do you teach kids about faith without forcing it on them?",
    category: "parenting",
    tags: ["kids", "faith", "balance"],
  },
  {
    content: "My adult child walked away from faith. How do you cope?",
    category: "parenting",
    tags: ["prodigal", "adult-child", "grief"],
  },
  {
    content: "How do you discipline kids in a way that's biblical but not harsh?",
    category: "parenting",
    tags: ["discipline", "grace", "boundaries"],
  },
  {
    content: "What do you do when your kids don't want to go to church?",
    category: "parenting",
    tags: ["church", "resistance", "kids"],
  },
  {
    content: "How do you handle screen time limits when everyone else lets their kids have unlimited?",
    category: "parenting",
    tags: ["screens", "boundaries", "culture"],
  },
  {
    content: "What age-appropriate ways have worked for teaching your kids to pray?",
    category: "parenting",
    tags: ["prayer", "kids", "teaching"],
  },
  {
    content: "How do you stay connected to your spouse when the kids consume all your energy?",
    category: "parenting",
    tags: ["marriage", "kids", "connection"],
  },
  {
    content: "What's helped you with the guilt of being a working parent?",
    category: "parenting",
    tags: ["working-parent", "guilt", "balance"],
  },
  {
    content: "How do you explain hard things (death, divorce, illness) to kids?",
    category: "parenting",
    tags: ["hard-conversations", "kids", "truth"],
  },
  {
    content: "How do you handle different parenting styles between you and your spouse?",
    category: "parenting",
    tags: ["parenting-styles", "marriage", "unity"],
  },
  {
    content: "What's helped you with the exhaustion of parenting young kids?",
    category: "parenting",
    tags: ["exhaustion", "young-kids", "survival"],
  },
  {
    content: "How do you encourage your kids' gifts without becoming a stage parent?",
    category: "parenting",
    tags: ["gifts", "kids", "balance"],
  },
  {
    content: "What do you do when your child is being bullied?",
    category: "parenting",
    tags: ["bullying", "protection", "response"],
  },
  {
    content: "How do you navigate social media and your teenagers?",
    category: "parenting",
    tags: ["social-media", "teens", "boundaries"],
  },
  {
    content: "How do you have conversations about purity without creating shame?",
    category: "parenting",
    tags: ["purity", "sex-ed", "grace"],
  },
  {
    content: "What's helped you let go as your kids become adults?",
    category: "parenting",
    tags: ["letting-go", "adult-children", "transition"],
  },
  {
    content: "How do you parent differently than how you were raised?",
    category: "parenting",
    tags: ["cycles", "change", "intentional"],
  },
  {
    content: "What do you do when your kids fight constantly?",
    category: "parenting",
    tags: ["sibling-rivalry", "peace", "conflict"],
  },
  {
    content: "How do you make family devotions work without it feeling forced?",
    category: "parenting",
    tags: ["devotions", "family", "faith"],
  },
  {
    content: "What's your advice for parents of special needs kids?",
    category: "parenting",
    tags: ["special-needs", "support", "advocacy"],
  },
  {
    content: "How do you handle grandparents who undermine your parenting?",
    category: "parenting",
    tags: ["grandparents", "boundaries", "respect"],
  },
  {
    content: "How do you parent through your own unresolved issues?",
    category: "parenting",
    tags: ["healing", "self-awareness", "growth"],
  },
  {
    content: "What's helped you with the loneliness of stay-at-home parenting?",
    category: "parenting",
    tags: ["stay-at-home", "loneliness", "community"],
  },
  {
    content: "How do you prepare kids for a world that doesn't share your values?",
    category: "parenting",
    tags: ["culture", "preparation", "values"],
  },
  {
    content: "What do you do when you've yelled at your kids and feel terrible?",
    category: "parenting",
    tags: ["anger", "repair", "forgiveness"],
  },
  {
    content: "How do you balance extracurriculars with family time and church?",
    category: "parenting",
    tags: ["activities", "balance", "priorities"],
  },
  {
    content: "What's helped you connect with your opposite-gender child?",
    category: "parenting",
    tags: ["connection", "parenting", "relationship"],
  },
  {
    content: "How do you teach kids about money from a biblical perspective?",
    category: "parenting",
    tags: ["money", "stewardship", "teaching"],
  },
  {
    content: "What do you do when your child's anxiety is through the roof?",
    category: "parenting",
    tags: ["anxiety", "kids", "support"],
  },
];

// ============================================================================
// LIFE TRANSITIONS & DECISIONS (25+ questions)
// ============================================================================

const transitionQuestions: AdviceQuestion[] = [
  {
    content: "How do you find a good church when you move to a new city?",
    category: "transitions",
    tags: ["church", "moving", "community"],
  },
  {
    content: "How do you know when it's time to leave a church vs work through problems?",
    category: "transitions",
    tags: ["church", "leaving", "wisdom"],
  },
  {
    content: "What helped you adjust to empty nesting? The house feels so quiet.",
    category: "transitions",
    tags: ["empty-nest", "adjustment", "identity"],
  },
  {
    content: "How do you rebuild life after divorce? The shame is overwhelming.",
    category: "transitions",
    tags: ["divorce", "rebuilding", "grace"],
  },
  {
    content: "What helped you through a major health diagnosis?",
    category: "transitions",
    tags: ["health", "diagnosis", "faith"],
  },
  {
    content: "How do you make big decisions when you and your spouse disagree?",
    category: "transitions",
    tags: ["decisions", "marriage", "unity"],
  },
  {
    content: "What's your advice for someone starting over in a new career?",
    category: "transitions",
    tags: ["career", "change", "starting-over"],
  },
  {
    content: "How do you handle major financial setbacks or unexpected debt?",
    category: "transitions",
    tags: ["finances", "setback", "trust"],
  },
  {
    content: "What helped you adjust after retirement? I don't know what to do with myself.",
    category: "transitions",
    tags: ["retirement", "purpose", "adjustment"],
  },
  {
    content: "How do you grieve a dream that didn't work out?",
    category: "transitions",
    tags: ["grief", "dreams", "disappointment"],
  },
  {
    content: "What's helped you care for aging parents while raising your own kids?",
    category: "transitions",
    tags: ["sandwich-generation", "caregiving", "balance"],
  },
  {
    content: "How do you start over after a major failure everyone knows about?",
    category: "transitions",
    tags: ["failure", "shame", "rebuilding"],
  },
  {
    content: "What helped you decide whether to stay or go in a difficult situation?",
    category: "transitions",
    tags: ["decisions", "wisdom", "discernment"],
  },
  {
    content: "How do you handle life not turning out the way you expected?",
    category: "transitions",
    tags: ["expectations", "disappointment", "trust"],
  },
  {
    content: "What's helped you through seasons of waiting that feel endless?",
    category: "transitions",
    tags: ["waiting", "patience", "trust"],
  },
  {
    content: "How do you decide if you should move for a job opportunity?",
    category: "transitions",
    tags: ["moving", "career", "decisions"],
  },
  {
    content: "What helped you rebuild trust in yourself after making bad decisions?",
    category: "transitions",
    tags: ["trust", "self", "rebuilding"],
  },
  {
    content: "How do you handle life when everything changes at once?",
    category: "transitions",
    tags: ["change", "overwhelm", "survival"],
  },
  {
    content: "What's your advice for newlyweds in the first year of marriage?",
    category: "transitions",
    tags: ["newlywed", "marriage", "advice"],
  },
  {
    content: "How do you know when a season is ending and something new is beginning?",
    category: "transitions",
    tags: ["seasons", "discernment", "change"],
  },
  {
    content: "What helped you through infertility or pregnancy loss?",
    category: "transitions",
    tags: ["infertility", "loss", "grief"],
  },
  {
    content: "How do you honor your late spouse while moving forward?",
    category: "transitions",
    tags: ["grief", "widow", "moving-forward"],
  },
  {
    content: "What's helped you navigate being suddenly single again?",
    category: "transitions",
    tags: ["single-again", "divorce", "adjustment"],
  },
  {
    content: "How do you decide whether to downsize or stay in your home?",
    category: "transitions",
    tags: ["downsizing", "home", "decisions"],
  },
  {
    content: "What helped you rediscover purpose after kids left home?",
    category: "transitions",
    tags: ["empty-nest", "purpose", "identity"],
  },
];

// ============================================================================
// CULTURE & CURRENT ISSUES (15+ questions)
// ============================================================================

const cultureQuestions: AdviceQuestion[] = [
  {
    content: "How do you engage with politics without losing your witness or your mind?",
    category: "culture",
    tags: ["politics", "witness", "balance"],
  },
  {
    content: "How do you respond when Christians are portrayed negatively in media?",
    category: "culture",
    tags: ["media", "representation", "response"],
  },
  {
    content: "What's your approach to controversial topics in mixed company?",
    category: "culture",
    tags: ["controversy", "conversation", "wisdom"],
  },
  {
    content: "How do you use social media in a way that honors God?",
    category: "culture",
    tags: ["social-media", "witness", "boundaries"],
  },
  {
    content: "How do you stay informed without getting consumed by bad news?",
    category: "culture",
    tags: ["news", "anxiety", "balance"],
  },
  {
    content: "What's helped you have conversations across political divides?",
    category: "culture",
    tags: ["politics", "conversation", "unity"],
  },
  {
    content: "How do you respond to friends who've left the faith?",
    category: "culture",
    tags: ["deconstruction", "friends", "response"],
  },
  {
    content: "What's your approach to entertainment that conflicts with your values?",
    category: "culture",
    tags: ["entertainment", "values", "discernment"],
  },
  {
    content: "How do you engage with family members who have very different views?",
    category: "culture",
    tags: ["family", "disagreement", "love"],
  },
  {
    content: "What's helped you stand firm without being combative?",
    category: "culture",
    tags: ["conviction", "grace", "witness"],
  },
  {
    content: "How do you discern what voices to listen to online?",
    category: "culture",
    tags: ["discernment", "online", "influence"],
  },
  {
    content: "What do you say when people ask why Christians seem so judgmental?",
    category: "culture",
    tags: ["perception", "judgment", "response"],
  },
  {
    content: "How do you maintain hope in a world that feels increasingly dark?",
    category: "culture",
    tags: ["hope", "world", "perseverance"],
  },
  {
    content: "What's your advice for living countercultural without being weird?",
    category: "culture",
    tags: ["countercultural", "witness", "relevance"],
  },
  {
    content: "How do you handle AI, technology, and faith questions with no clear answers?",
    category: "culture",
    tags: ["technology", "ethics", "wisdom"],
  },
];

// ============================================================================
// COMBINED EXPORT
// ============================================================================

export const ALL_ADVICE_QUESTIONS: AdviceQuestion[] = [
  ...faithQuestions,
  ...relationshipQuestions,
  ...workQuestions,
  ...mentalHealthQuestions,
  ...parentingQuestions,
  ...transitionQuestions,
  ...cultureQuestions,
];

// Helper to get random questions
export function getRandomQuestions(count: number): AdviceQuestion[] {
  const shuffled = [...ALL_ADVICE_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Helper to get random nickname
export function getRandomNickname(): string {
  return ANONYMOUS_NICKNAMES[Math.floor(Math.random() * ANONYMOUS_NICKNAMES.length)];
}

// Helper to get questions by category
export function getQuestionsByCategory(category: string): AdviceQuestion[] {
  return ALL_ADVICE_QUESTIONS.filter(q => q.category === category);
}

console.info(`📚 Loaded ${ALL_ADVICE_QUESTIONS.length} advice questions across ${
  new Set(ALL_ADVICE_QUESTIONS.map(q => q.category)).size
} categories`);
