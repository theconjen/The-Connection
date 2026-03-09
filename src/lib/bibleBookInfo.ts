/**
 * Bible Book metadata for the "My Bible Reading" screen.
 *
 * Themes adapted from Matthew Henry's Commentary on the Whole Bible.
 * Source: https://www.biblestudytools.com/commentaries/matthew-henry-complete/
 * Matthew Henry (1662–1714) — public domain.
 */

export interface BibleBookInfo {
  name: string;
  chapters: number;
  testament: 'OT' | 'NT';
  theme: string;
  description: string;
  /** Total reading time in minutes */
  readingTimeMinutes: number;
}

/** Format minutes into a human-readable string like "3 hr 31 min" or "14 min" */
export function formatReadingTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
}

export const BIBLE_BOOKS: BibleBookInfo[] = [
  // ─── Old Testament ───────────────────────────────────────────
  {
    name: 'Genesis',
    chapters: 50,
    testament: 'OT',
    theme: 'Beginnings & Covenant Promises',
    description:
      'Where everything begins — the creation of the world, the first humans, the flood, and the stories of Abraham, Isaac, Jacob, and Joseph. You\'ll see God choosing a family through whom He\'ll bless all nations.',
    readingTimeMinutes: 211,
  },
  {
    name: 'Exodus',
    chapters: 40,
    testament: 'OT',
    theme: 'Deliverance & the Law',
    description:
      'Israel escapes slavery in Egypt through dramatic miracles, then receives God\'s law at Mount Sinai. You\'ll read about the ten plagues, the parting of the Red Sea, and the Ten Commandments.',
    readingTimeMinutes: 180,
  },
  {
    name: 'Leviticus',
    chapters: 27,
    testament: 'OT',
    theme: 'Holiness & Sacrificial Worship',
    description:
      'God\'s instructions for worship, sacrifices, and holy living. It can feel dense, but it reveals how seriously God takes holiness — and how every sacrifice points to a greater one to come.',
    readingTimeMinutes: 120,
  },
  {
    name: 'Numbers',
    chapters: 36,
    testament: 'OT',
    theme: 'Wilderness Wanderings & God\'s Faithfulness',
    description:
      'Israel\'s 40-year journey through the wilderness — full of complaining, rebellion, and yet God\'s constant provision. A honest look at what happens when faith wavers and God stays faithful anyway.',
    readingTimeMinutes: 180,
  },
  {
    name: 'Deuteronomy',
    chapters: 34,
    testament: 'OT',
    theme: 'Covenant Renewal & Obedience',
    description:
      'Moses\' farewell speeches to Israel before they enter the Promised Land. He recaps their history, restates God\'s laws, and pleads with them to choose life by loving and obeying God.',
    readingTimeMinutes: 144,
  },
  {
    name: 'Joshua',
    chapters: 24,
    testament: 'OT',
    theme: 'Conquest & Inheritance',
    description:
      'Israel finally enters the Promised Land under Joshua\'s leadership. You\'ll read about the fall of Jericho, the conquest of Canaan, and the land being divided among the twelve tribes.',
    readingTimeMinutes: 102,
  },
  {
    name: 'Judges',
    chapters: 21,
    testament: 'OT',
    theme: 'Cycles of Sin & Deliverance',
    description:
      'A dark and chaotic period where Israel repeatedly turns from God, falls into trouble, and cries out for rescue. Features colorful leaders like Deborah, Gideon, and Samson.',
    readingTimeMinutes: 101,
  },
  {
    name: 'Ruth',
    chapters: 4,
    testament: 'OT',
    theme: 'Redemption & Loyal Love',
    description:
      'A short, beautiful love story set during the time of the Judges. Ruth\'s loyalty to her mother-in-law Naomi leads her to Boaz, and their family line leads directly to King David — and eventually to Jesus.',
    readingTimeMinutes: 14,
  },
  {
    name: '1 Samuel',
    chapters: 31,
    testament: 'OT',
    theme: 'From Judges to Kings',
    description:
      'Israel gets its first king. You\'ll follow Samuel the prophet, watch Saul rise and fall, and see young David go from shepherd boy to giant-slayer to fugitive. A gripping story of faith, jealousy, and calling.',
    readingTimeMinutes: 134,
  },
  {
    name: '2 Samuel',
    chapters: 24,
    testament: 'OT',
    theme: 'David\'s Reign & God\'s Covenant',
    description:
      'David becomes king and builds a kingdom — but his reign is marked by both incredible highs and devastating personal failures. Honest, messy, and deeply human.',
    readingTimeMinutes: 120,
  },
  {
    name: '1 Kings',
    chapters: 22,
    testament: 'OT',
    theme: 'Solomon\'s Glory & the Divided Kingdom',
    description:
      'Solomon builds the temple and gains legendary wisdom, but his later unfaithfulness splits the kingdom in two. Introduces the prophet Elijah and his dramatic confrontation on Mount Carmel.',
    readingTimeMinutes: 120,
  },
  {
    name: '2 Kings',
    chapters: 25,
    testament: 'OT',
    theme: 'Decline, Exile & God\'s Judgment',
    description:
      'The northern and southern kingdoms spiral toward destruction despite prophets warning them to turn back. Elisha performs miracles, kings rise and fall, and both nations eventually go into exile.',
    readingTimeMinutes: 120,
  },
  {
    name: '1 Chronicles',
    chapters: 29,
    testament: 'OT',
    theme: 'David\'s Legacy & Temple Preparations',
    description:
      'A retelling of Israel\'s history focused on David\'s reign and his passionate preparations for building God\'s temple. Heavy on genealogies early on, but builds to David\'s powerful prayer of dedication.',
    readingTimeMinutes: 120,
  },
  {
    name: '2 Chronicles',
    chapters: 36,
    testament: 'OT',
    theme: 'The Temple, Revival & Exile',
    description:
      'Picks up with Solomon\'s temple and traces the kings of Judah — some faithful, most not. The highlights are the revival stories: kings like Hezekiah and Josiah who turned the nation back to God.',
    readingTimeMinutes: 139,
  },
  {
    name: 'Ezra',
    chapters: 10,
    testament: 'OT',
    theme: 'Return & Restoration',
    description:
      'After 70 years in exile, the Jewish people return to Jerusalem and rebuild the temple. A story of fresh starts, identity, and rediscovering what it means to be God\'s people.',
    readingTimeMinutes: 40,
  },
  {
    name: 'Nehemiah',
    chapters: 13,
    testament: 'OT',
    theme: 'Rebuilding & Reform',
    description:
      'Nehemiah leads the effort to rebuild Jerusalem\'s walls in just 52 days despite fierce opposition. Part construction project, part spiritual revival — a masterclass in faithful leadership.',
    readingTimeMinutes: 60,
  },
  {
    name: 'Esther',
    chapters: 10,
    testament: 'OT',
    theme: 'Providence & Deliverance',
    description:
      'A Jewish woman becomes queen of Persia and risks her life to save her people from a genocide plot. God\'s name is never mentioned, but His fingerprints are on every page.',
    readingTimeMinutes: 31,
  },
  {
    name: 'Job',
    chapters: 42,
    testament: 'OT',
    theme: 'Suffering & God\'s Sovereignty',
    description:
      'A righteous man loses everything and wrestles with why. His friends offer bad advice, Job demands answers from God, and God finally speaks — not with explanations, but with overwhelming majesty.',
    readingTimeMinutes: 106,
  },
  {
    name: 'Psalms',
    chapters: 150,
    testament: 'OT',
    theme: 'Prayer, Praise & the Heart\'s Cry',
    description:
      'The Bible\'s songbook and prayer journal — 150 poems covering every human emotion: joy, despair, anger, gratitude, doubt, and worship. Read a few at a time and let them become your own prayers.',
    readingTimeMinutes: 300,
  },
  {
    name: 'Proverbs',
    chapters: 31,
    testament: 'OT',
    theme: 'Wisdom for Daily Living',
    description:
      'Bite-sized wisdom for everyday life — money, relationships, work, words, and character. Best read slowly, a chapter a day. The core idea: real wisdom starts with honoring God.',
    readingTimeMinutes: 95,
  },
  {
    name: 'Ecclesiastes',
    chapters: 12,
    testament: 'OT',
    theme: 'Life\'s Meaning Under the Sun',
    description:
      'A philosopher\'s brutally honest search for meaning — wealth, pleasure, achievement, knowledge. His conclusion? Without God, everything is meaningless. With Him, even simple things have purpose.',
    readingTimeMinutes: 31,
  },
  {
    name: 'Song of Solomon',
    chapters: 8,
    testament: 'OT',
    theme: 'Divine Love & Intimacy',
    description:
      'A passionate love poem between a bride and groom. It celebrates romantic love as a gift from God — and many see in it a picture of God\'s deep, pursuing love for His people.',
    readingTimeMinutes: 17,
  },
  {
    name: 'Isaiah',
    chapters: 66,
    testament: 'OT',
    theme: 'Judgment, Comfort & the Coming Messiah',
    description:
      'The most quoted prophet in the New Testament. The first half warns of judgment; the second overflows with comfort and stunning predictions about Jesus — written 700 years before His birth.',
    readingTimeMinutes: 223,
  },
  {
    name: 'Jeremiah',
    chapters: 52,
    testament: 'OT',
    theme: 'The Weeping Prophet & Coming Judgment',
    description:
      'Jeremiah spent 40 years warning Judah to repent, and they never listened. It\'s heartbreaking but powerful — a prophet who kept speaking truth even when it cost him everything.',
    readingTimeMinutes: 240,
  },
  {
    name: 'Lamentations',
    chapters: 5,
    testament: 'OT',
    theme: 'Grief & Hope in Destruction',
    description:
      'Five gut-wrenching poems grieving Jerusalem\'s destruction. Raw and painful, yet right in the middle comes one of the Bible\'s most beloved lines: "Great is thy faithfulness."',
    readingTimeMinutes: 20,
  },
  {
    name: 'Ezekiel',
    chapters: 48,
    testament: 'OT',
    theme: 'God\'s Glory Departing & Returning',
    description:
      'Wild visions, symbolic actions, and powerful prophecies from a priest in exile. Ezekiel sees God\'s glory leave the temple — and promises that one day, God will give His people new hearts.',
    readingTimeMinutes: 219,
  },
  {
    name: 'Daniel',
    chapters: 12,
    testament: 'OT',
    theme: 'Faithfulness in Exile & God\'s Kingdom',
    description:
      'Stories of courage in Babylon — the fiery furnace, the lion\'s den — plus apocalyptic visions of world empires and God\'s eternal kingdom. A book about standing firm when the pressure is on.',
    readingTimeMinutes: 60,
  },
  {
    name: 'Hosea',
    chapters: 14,
    testament: 'OT',
    theme: 'Unfailing Love for an Unfaithful People',
    description:
      'God tells Hosea to marry an unfaithful woman as a living picture of how Israel has treated Him. Painful but deeply moving — it shows a love that refuses to give up.',
    readingTimeMinutes: 32,
  },
  {
    name: 'Joel',
    chapters: 3,
    testament: 'OT',
    theme: 'The Day of the Lord & Restoration',
    description:
      'A devastating locust plague becomes a wake-up call to repent. Joel promises that God will pour out His Spirit on all people — a prophecy fulfilled at Pentecost.',
    readingTimeMinutes: 12,
  },
  {
    name: 'Amos',
    chapters: 9,
    testament: 'OT',
    theme: 'Justice & Righteousness',
    description:
      'A shepherd with no religious credentials boldly confronts Israel\'s wealthy elite for oppressing the poor while keeping up religious appearances. God wants justice, not just worship songs.',
    readingTimeMinutes: 24,
  },
  {
    name: 'Obadiah',
    chapters: 1,
    testament: 'OT',
    theme: 'Judgment on Pride',
    description:
      'The Bible\'s shortest Old Testament book — just 21 verses. A sharp warning to Edom (Israel\'s neighbor) for gloating over Jerusalem\'s fall. Pride and cruelty don\'t go unnoticed by God.',
    readingTimeMinutes: 4,
  },
  {
    name: 'Jonah',
    chapters: 4,
    testament: 'OT',
    theme: 'God\'s Mercy Beyond Borders',
    description:
      'A prophet runs from God, gets swallowed by a great fish, and reluctantly preaches to Israel\'s worst enemy — who repents. The real twist? Jonah is angry that God shows mercy.',
    readingTimeMinutes: 8,
  },
  {
    name: 'Micah',
    chapters: 7,
    testament: 'OT',
    theme: 'Justice, Mercy & Humble Walking',
    description:
      'A small-town prophet takes on corruption in high places. Contains one of the Bible\'s most beautiful summaries: "Do justly, love mercy, and walk humbly with your God."',
    readingTimeMinutes: 18,
  },
  {
    name: 'Nahum',
    chapters: 3,
    testament: 'OT',
    theme: 'God\'s Judgment on Oppressors',
    description:
      'A prophecy against Nineveh — the brutal Assyrian capital. God is patient, but there comes a point when He acts against those who crush the helpless.',
    readingTimeMinutes: 7,
  },
  {
    name: 'Habakkuk',
    chapters: 3,
    testament: 'OT',
    theme: 'Faith Amid Injustice',
    description:
      'A prophet who dares to ask God hard questions: Why do the wicked prosper? Why does injustice go unpunished? God\'s answer doesn\'t explain everything — but it\'s enough: "The righteous shall live by faith."',
    readingTimeMinutes: 9,
  },
  {
    name: 'Zephaniah',
    chapters: 3,
    testament: 'OT',
    theme: 'Judgment & Joyful Restoration',
    description:
      'Starts with terrifying warnings of judgment, then ends with one of the most tender images in Scripture: God rejoicing over His people with singing.',
    readingTimeMinutes: 10,
  },
  {
    name: 'Haggai',
    chapters: 2,
    testament: 'OT',
    theme: 'Rebuilding God\'s House',
    description:
      'A short, punchy message to the returned exiles: you\'ve built nice houses for yourselves, but God\'s temple is still in ruins. Time to get your priorities straight.',
    readingTimeMinutes: 6,
  },
  {
    name: 'Zechariah',
    chapters: 14,
    testament: 'OT',
    theme: 'Messianic Visions & Future Glory',
    description:
      'Full of strange, vivid visions and remarkably detailed prophecies about Jesus — riding on a donkey, betrayed for 30 silver coins, pierced. Written 500 years before it all happened.',
    readingTimeMinutes: 35,
  },
  {
    name: 'Malachi',
    chapters: 4,
    testament: 'OT',
    theme: 'Faithfulness Before the Silence',
    description:
      'The last prophetic voice before 400 years of silence. God confronts half-hearted worship and broken promises, then hints at a messenger who will prepare the way — John the Baptist.',
    readingTimeMinutes: 11,
  },
  // ─── New Testament ──────────────────────────────────────────
  {
    name: 'Matthew',
    chapters: 28,
    testament: 'NT',
    theme: 'Jesus the Promised King',
    description:
      'Written for a Jewish audience, showing how Jesus fulfills Old Testament prophecy. Features the Sermon on the Mount, powerful parables, and the story of Jesus\' death and resurrection.',
    readingTimeMinutes: 141,
  },
  {
    name: 'Mark',
    chapters: 16,
    testament: 'NT',
    theme: 'Jesus the Servant in Action',
    description:
      'The shortest, fastest-paced Gospel — action over explanation. Jesus heals, teaches, and confronts evil at a relentless pace. A great starting point if you\'re new to the Bible.',
    readingTimeMinutes: 83,
  },
  {
    name: 'Luke',
    chapters: 24,
    testament: 'NT',
    theme: 'Jesus the Savior of All',
    description:
      'Written by a doctor with an eye for detail. Emphasizes Jesus\' compassion for outsiders — the poor, women, Samaritans, and sinners. Contains beloved parables like the Good Samaritan and the Prodigal Son.',
    readingTimeMinutes: 144,
  },
  {
    name: 'John',
    chapters: 21,
    testament: 'NT',
    theme: 'Jesus the Son of God',
    description:
      'The most reflective Gospel — less action, more meaning. Built around seven miraculous signs and Jesus\' seven "I am" statements. Written so "you may believe that Jesus is the Christ."',
    readingTimeMinutes: 111,
  },
  {
    name: 'Acts',
    chapters: 28,
    testament: 'NT',
    theme: 'The Spirit\'s Work Through the Church',
    description:
      'The sequel to Luke — how the early church exploded from a small group in Jerusalem to communities across the Roman Empire. Full of adventure: shipwrecks, prison breaks, and the Holy Spirit at work.',
    readingTimeMinutes: 135,
  },
  {
    name: 'Romans',
    chapters: 16,
    testament: 'NT',
    theme: 'The Gospel of Righteousness by Faith',
    description:
      'Paul\'s most systematic letter — a step-by-step explanation of the gospel: why everyone needs saving, how God saves through faith, and what a saved life looks like. Dense but life-changing.',
    readingTimeMinutes: 60,
  },
  {
    name: '1 Corinthians',
    chapters: 16,
    testament: 'NT',
    theme: 'Church Order & Christian Living',
    description:
      'Paul addresses a messy church dealing with divisions, sexual immorality, lawsuits, and worship chaos. Contains the famous "love chapter" (13) and teaching on spiritual gifts and resurrection.',
    readingTimeMinutes: 60,
  },
  {
    name: '2 Corinthians',
    chapters: 13,
    testament: 'NT',
    theme: 'Strength in Weakness',
    description:
      'Paul\'s most personal letter — he opens up about his suffering, defends his ministry, and reveals the paradox at the heart of faith: God\'s power shows up best in our weakness.',
    readingTimeMinutes: 38,
  },
  {
    name: 'Galatians',
    chapters: 6,
    testament: 'NT',
    theme: 'Freedom in Christ Alone',
    description:
      'Paul is fired up. Some teachers are telling new believers they need to follow Jewish law to be saved. Paul says absolutely not — you are saved by faith in Christ, period. Freedom, not rules.',
    readingTimeMinutes: 20,
  },
  {
    name: 'Ephesians',
    chapters: 6,
    testament: 'NT',
    theme: 'The Church as Christ\'s Body',
    description:
      'One of Paul\'s most uplifting letters. The first half is about who you are in Christ (chosen, loved, alive); the second half is about how to live it out — including the famous "armor of God."',
    readingTimeMinutes: 19,
  },
  {
    name: 'Philippians',
    chapters: 4,
    testament: 'NT',
    theme: 'Joy in Every Circumstance',
    description:
      'A joyful letter written from prison. Paul shares his secret to contentment no matter what: "I can do all things through Christ who strengthens me." Short, warm, and encouraging.',
    readingTimeMinutes: 14,
  },
  {
    name: 'Colossians',
    chapters: 4,
    testament: 'NT',
    theme: 'The Supremacy of Christ',
    description:
      'Christ is supreme over everything — creation, the church, your daily life. Paul wrote this to counter people adding extra rules and mysticism to the faith. Jesus is enough.',
    readingTimeMinutes: 13,
  },
  {
    name: '1 Thessalonians',
    chapters: 5,
    testament: 'NT',
    theme: 'Living in Light of Christ\'s Return',
    description:
      'Written to a young church wondering about Jesus\' return and what happens to believers who die before then. Paul\'s answer: be encouraged — the dead in Christ will rise first.',
    readingTimeMinutes: 11,
  },
  {
    name: '2 Thessalonians',
    chapters: 3,
    testament: 'NT',
    theme: 'Standing Firm Until He Comes',
    description:
      'A follow-up to calm fears that the "Day of the Lord" had already happened. Paul says: don\'t panic, don\'t quit your jobs — stand firm and keep working until He comes.',
    readingTimeMinutes: 7,
  },
  {
    name: '1 Timothy',
    chapters: 6,
    testament: 'NT',
    theme: 'Guarding Sound Doctrine',
    description:
      'Paul\'s advice to his young protégé Timothy on how to lead a church — choosing good leaders, handling false teaching, caring for the vulnerable, and staying faithful under pressure.',
    readingTimeMinutes: 15,
  },
  {
    name: '2 Timothy',
    chapters: 4,
    testament: 'NT',
    theme: 'Enduring to the End',
    description:
      'Paul\'s last letter, written from prison before his execution. A father-figure\'s final charge to a spiritual son: stay strong, preach the Word, finish well. Deeply moving.',
    readingTimeMinutes: 11,
  },
  {
    name: 'Titus',
    chapters: 3,
    testament: 'NT',
    theme: 'Godly Living & Good Works',
    description:
      'Instructions for setting up healthy churches on the island of Crete. Short and practical — what good leadership looks like, and how grace transforms the way we live.',
    readingTimeMinutes: 6,
  },
  {
    name: 'Philemon',
    chapters: 1,
    testament: 'NT',
    theme: 'Forgiveness & Reconciliation',
    description:
      'The Bible\'s shortest letter — Paul asks a slave owner to welcome back his runaway slave as a brother, not property. A powerful picture of the gospel: debt paid, relationship restored.',
    readingTimeMinutes: 3,
  },
  {
    name: 'Hebrews',
    chapters: 13,
    testament: 'NT',
    theme: 'Christ Greater Than All',
    description:
      'Written to Jewish believers tempted to go back to the old ways. The argument: Jesus is greater than angels, Moses, and the entire old covenant. Don\'t go back — press forward.',
    readingTimeMinutes: 44,
  },
  {
    name: 'James',
    chapters: 5,
    testament: 'NT',
    theme: 'Faith That Works',
    description:
      'The most practical book in the New Testament — straight talk about controlling your tongue, handling wealth, enduring trials, and putting your faith into action. No fluff.',
    readingTimeMinutes: 15,
  },
  {
    name: '1 Peter',
    chapters: 5,
    testament: 'NT',
    theme: 'Hope Through Suffering',
    description:
      'Written to persecuted believers scattered across the Roman Empire. Peter\'s message: suffering is real, but it\'s temporary — your inheritance is eternal and nothing can take it away.',
    readingTimeMinutes: 15,
  },
  {
    name: '2 Peter',
    chapters: 3,
    testament: 'NT',
    theme: 'Growing in Grace & Guarding Truth',
    description:
      'A warning against false teachers and a reminder that Jesus will return — even if it seems delayed. Peter urges: grow in grace, stay alert, and live holy lives while you wait.',
    readingTimeMinutes: 10,
  },
  {
    name: '1 John',
    chapters: 5,
    testament: 'NT',
    theme: 'Assurance & Walking in the Light',
    description:
      'John writes to give believers confidence in their salvation. Built around simple, powerful truths: God is light, God is love, and if you know Him, your life will show it.',
    readingTimeMinutes: 16,
  },
  {
    name: '2 John',
    chapters: 1,
    testament: 'NT',
    theme: 'Truth & Love Together',
    description:
      'A brief letter — just 13 verses — urging believers to hold onto both truth and love. Watch out for deceivers, but never stop loving each other.',
    readingTimeMinutes: 2,
  },
  {
    name: '3 John',
    chapters: 1,
    testament: 'NT',
    theme: 'Hospitality & Faithful Service',
    description:
      'Another short letter — praising a man named Gaius for his hospitality and calling out a leader named Diotrephes for his pride. A snapshot of real church life.',
    readingTimeMinutes: 2,
  },
  {
    name: 'Jude',
    chapters: 1,
    testament: 'NT',
    theme: 'Contending for the Faith',
    description:
      'A short, urgent letter warning that false teachers have slipped into the church. Jude says: fight for the faith that was handed down to you — and trust God to keep you from falling.',
    readingTimeMinutes: 4,
  },
  {
    name: 'Revelation',
    chapters: 22,
    testament: 'NT',
    theme: 'The Triumph of Christ & the New Creation',
    description:
      'The Bible\'s epic finale — visions of heaven, spiritual warfare, final judgment, and a new creation where God wipes every tear away. Symbolic and mysterious, but the message is clear: Jesus wins.',
    readingTimeMinutes: 70,
  },
];

/** Lookup a book by name (case-insensitive) */
export function getBookInfo(name: string): BibleBookInfo | undefined {
  return BIBLE_BOOKS.find(
    b => b.name.toLowerCase() === name.toLowerCase()
  );
}
