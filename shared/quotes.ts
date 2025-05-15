export interface DailyQuote {
  id: number;
  text: string;
  author: string;
  reference?: string;
}

export const spiritualQuotes: DailyQuote[] = [
  {
    id: 1,
    text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
    author: "Joshua 1:9",
    reference: "Bible, NIV"
  },
  {
    id: 2,
    text: "I can do all things through Christ who strengthens me.",
    author: "Philippians 4:13",
    reference: "Bible, NKJV"
  },
  {
    id: 3,
    text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
    author: "Jeremiah 29:11",
    reference: "Bible, NIV"
  },
  {
    id: 4,
    text: "The Lord is my shepherd; I shall not want.",
    author: "Psalm 23:1",
    reference: "Bible, KJV"
  },
  {
    id: 5,
    text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
    author: "Proverbs 3:5-6",
    reference: "Bible, NIV"
  },
  {
    id: 6,
    text: "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!",
    author: "2 Corinthians 5:17",
    reference: "Bible, NIV"
  },
  {
    id: 7,
    text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
    author: "Romans 8:28",
    reference: "Bible, NIV"
  },
  {
    id: 8,
    text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
    author: "Philippians 4:6",
    reference: "Bible, NIV"
  },
  {
    id: 9,
    text: "The joy of the Lord is your strength.",
    author: "Nehemiah 8:10",
    reference: "Bible, NIV"
  },
  {
    id: 10,
    text: "Faith is taking the first step even when you don't see the whole staircase.",
    author: "Martin Luther King Jr."
  },
  {
    id: 11,
    text: "When I stand before God at the end of my life, I would hope that I would not have a single bit of talent left and could say, I used everything you gave me.",
    author: "Erma Bombeck"
  },
  {
    id: 12,
    text: "Prayer is not asking. It is a longing of the soul. It is daily admission of one's weakness.",
    author: "Mahatma Gandhi"
  },
  {
    id: 13,
    text: "We are not human beings having a spiritual experience. We are spiritual beings having a human experience.",
    author: "Pierre Teilhard de Chardin"
  },
  {
    id: 14,
    text: "Being a Christian is more than just an instantaneous conversion - it is a daily process whereby you grow to be more and more like Christ.",
    author: "Billy Graham"
  },
  {
    id: 15,
    text: "God never said that the journey would be easy, but He did say that the arrival would be worthwhile.",
    author: "Max Lucado"
  },
  {
    id: 16,
    text: "The Lord is my light and my salvation; whom shall I fear?",
    author: "Psalm 27:1",
    reference: "Bible, KJV"
  },
  {
    id: 17,
    text: "God loves each of us as if there were only one of us.",
    author: "Augustine of Hippo"
  },
  {
    id: 18,
    text: "Christ literally walked in our shoes and entered into our affliction.",
    author: "Tim Keller"
  },
  {
    id: 19,
    text: "There is nothing that makes us love a person so much as praying for them.",
    author: "William Law"
  },
  {
    id: 20,
    text: "Let nothing disturb you, let nothing frighten you. All things pass. God does not change. Patience achieves everything.",
    author: "Teresa of Ávila"
  }
];

/**
 * Returns a quote based on the current date
 * This ensures the same quote is shown all day but changes daily
 */
export function getDailyQuote(): DailyQuote {
  const today = new Date();
  const dayOfYear = today.getDate() + today.getMonth() * 30; // Simple approximation
  const quoteIndex = dayOfYear % spiritualQuotes.length;
  return spiritualQuotes[quoteIndex];
}

/**
 * Returns a random quote that's different from the daily quote
 */
export function getRandomQuote(): DailyQuote {
  const dailyQuote = getDailyQuote();
  let randomIndex = Math.floor(Math.random() * spiritualQuotes.length);
  
  // Make sure we don't return the same quote as the daily quote
  if (spiritualQuotes[randomIndex].id === dailyQuote.id) {
    randomIndex = (randomIndex + 1) % spiritualQuotes.length;
  }
  
  return spiritualQuotes[randomIndex];
}