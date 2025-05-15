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
    text: "The Lord is my shepherd; I shall not want.",
    author: "Psalm 23:1",
    reference: "Bible, KJV"
  },
  {
    id: 4,
    text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
    author: "Proverbs 3:5-6",
    reference: "Bible, NIV"
  },
  {
    id: 5,
    text: "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!",
    author: "2 Corinthians 5:17",
    reference: "Bible, NIV"
  },
  {
    id: 6,
    text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
    author: "Romans 8:28",
    reference: "Bible, NIV"
  },
  {
    id: 7,
    text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
    author: "Philippians 4:6",
    reference: "Bible, NIV"
  },
  {
    id: 8,
    text: "The joy of the Lord is your strength.",
    author: "Nehemiah 8:10",
    reference: "Bible, NIV"
  },
  {
    id: 9,
    text: "The Lord is my light and my salvation; whom shall I fear?",
    author: "Psalm 27:1",
    reference: "Bible, KJV"
  },
  {
    id: 10,
    text: "Faith is taking the first step even when you don't see the whole staircase.",
    author: "Martin Luther King Jr."
  },
  {
    id: 11,
    text: "God loves each of us as if there were only one of us.",
    author: "Augustine of Hippo"
  },
  {
    id: 12,
    text: "Christ literally walked in our shoes and entered into our affliction.",
    author: "Tim Keller"
  },
  {
    id: 13,
    text: "There is nothing that makes us love a person so much as praying for them.",
    author: "William Law"
  },
  {
    id: 14,
    text: "Let nothing disturb you, let nothing frighten you. All things pass. God does not change. Patience achieves everything.",
    author: "Teresa of Ávila"
  },
  {
    id: 15,
    text: "The opportunity of a lifetime must be seized within the lifetime of the opportunity.",
    author: "Leonard Ravenhill"
  },
  {
    id: 16,
    text: "No man is greater than his prayer life. The pastor who is not praying is playing; the people who are not praying are straying.",
    author: "Leonard Ravenhill"
  },
  {
    id: 17,
    text: "Are the things you are living for worth Christ dying for?",
    author: "Leonard Ravenhill"
  },
  {
    id: 18,
    text: "Entertainment is the devil's substitute for joy. The more joy you have in the Lord, the less entertainment you need.",
    author: "Leonard Ravenhill"
  },
  {
    id: 19,
    text: "If Jesus had preached the same message that ministers preach today, He would never have been crucified.",
    author: "Leonard Ravenhill"
  },
  {
    id: 20,
    text: "The early Church was married to poverty, prisons and persecutions. Today, the church is married to prosperity, personality, and popularity.",
    author: "Leonard Ravenhill"
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