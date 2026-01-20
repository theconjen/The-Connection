/**
 * Theology Quote Bot
 *
 * Automatically posts quotes from theologically sound Christian leaders:
 * - Historical figures (Augustine, Luther, Calvin, etc.)
 * - Modern pastors and theologians (Spurgeon, Lewis, Piper, etc.)
 */

import { db } from '../db';
import { users, microblogs } from '../../packages/shared/src/schema';
import { eq } from 'drizzle-orm';

const BOT_USERNAME = 'theology_quote_bot';

interface Quote {
  text: string;
  author: string;
  title?: string; // Book title, sermon title, etc.
}

// Curated quotes from theologically sound Christian leaders
const QUOTES: Quote[] = [
  // C.S. Lewis
  {
    text: "I believe in Christianity as I believe that the sun has risen: not only because I see it, but because by it I see everything else.",
    author: "C.S. Lewis"
  },
  {
    text: "You can never get a cup of tea large enough or a book long enough to suit me.",
    author: "C.S. Lewis"
  },
  {
    text: "Humility is not thinking less of yourself, it's thinking of yourself less.",
    author: "C.S. Lewis"
  },

  // Charles Spurgeon
  {
    text: "A Bible that's falling apart usually belongs to someone who isn't.",
    author: "Charles Spurgeon"
  },
  {
    text: "Beware of no man more than yourself; we carry our worst enemies within us.",
    author: "Charles Spurgeon"
  },
  {
    text: "Prayer is the slender nerve that moves the muscle of omnipotence.",
    author: "Charles Spurgeon"
  },

  // Augustine of Hippo
  {
    text: "You have made us for yourself, O Lord, and our hearts are restless until they rest in you.",
    author: "Augustine of Hippo",
    title: "Confessions"
  },
  {
    text: "To fall in love with God is the greatest romance; to seek him the greatest adventure; to find him, the greatest human achievement.",
    author: "Augustine of Hippo"
  },
  {
    text: "Faith is to believe what you do not see; the reward of this faith is to see what you believe.",
    author: "Augustine of Hippo"
  },

  // Martin Luther
  {
    text: "We are saved by faith alone, but the faith that saves is never alone.",
    author: "Martin Luther"
  },
  {
    text: "Peace if possible, truth at all costs.",
    author: "Martin Luther"
  },
  {
    text: "Pray, and let God worry.",
    author: "Martin Luther"
  },

  // John Calvin
  {
    text: "There is not one blade of grass, there is no color in this world that is not intended to make us rejoice.",
    author: "John Calvin"
  },
  {
    text: "We are not to reflect on the wickedness of men but to look to the image of God in them.",
    author: "John Calvin"
  },

  // Dietrich Bonhoeffer
  {
    text: "Cheap grace is the grace we bestow on ourselves. Costly grace is the gospel which must be sought again and again.",
    author: "Dietrich Bonhoeffer",
    title: "The Cost of Discipleship"
  },
  {
    text: "Being a Christian is less about cautiously avoiding sin than about courageously and actively doing God's will.",
    author: "Dietrich Bonhoeffer"
  },

  // John Wesley
  {
    text: "Do all the good you can, by all the means you can, in all the ways you can, in all the places you can, at all the times you can, to all the people you can, as long as ever you can.",
    author: "John Wesley"
  },
  {
    text: "Though we cannot think alike, may we not love alike? May we not be of one heart, though we are not of one opinion?",
    author: "John Wesley"
  },

  // John Piper
  {
    text: "God is most glorified in us when we are most satisfied in Him.",
    author: "John Piper"
  },
  {
    text: "Missions is not the ultimate goal of the church. Worship is. Missions exists because worship doesn't.",
    author: "John Piper"
  },

  // Timothy Keller
  {
    text: "The gospel is this: We are more sinful and flawed in ourselves than we ever dared believe, yet at the very same time we are more loved and accepted in Jesus Christ than we ever dared hope.",
    author: "Timothy Keller"
  },
  {
    text: "The Christian Gospel is that I am so flawed that Jesus had to die for me, yet I am so loved and valued that Jesus was glad to die for me.",
    author: "Timothy Keller"
  },

  // Thomas Aquinas
  {
    text: "To one who has faith, no explanation is necessary. To one without faith, no explanation is possible.",
    author: "Thomas Aquinas"
  },
  {
    text: "Three things are necessary for the salvation of man: to know what he ought to believe; to know what he ought to desire; and to know what he ought to do.",
    author: "Thomas Aquinas"
  },

  // A.W. Tozer
  {
    text: "What comes into our minds when we think about God is the most important thing about us.",
    author: "A.W. Tozer"
  },
  {
    text: "Faith is not a once-done act, but a continuous gaze of the heart at the Triune God.",
    author: "A.W. Tozer"
  },

  // D.L. Moody
  {
    text: "The Bible was not given to increase our knowledge but to change our lives.",
    author: "D.L. Moody"
  },
  {
    text: "Faith makes all things possible. Love makes all things easy.",
    author: "D.L. Moody"
  },

  // G.K. Chesterton
  {
    text: "The Christian ideal has not been tried and found wanting. It has been found difficult; and left untried.",
    author: "G.K. Chesterton"
  },
  {
    text: "Joy is the gigantic secret of the Christian.",
    author: "G.K. Chesterton"
  },

  // Francis Schaeffer
  {
    text: "The beginning of men's rebellion against God was, and is, the lack of a thankful heart.",
    author: "Francis Schaeffer"
  },

  // Elisabeth Elliot
  {
    text: "God never withholds from His child that which His love and wisdom call good. God's refusals are always merciful.",
    author: "Elisabeth Elliot"
  },

  // Brother Lawrence
  {
    text: "The time of business does not with me differ from the time of prayer, and in the noise and clatter of my kitchen, while several persons are at the same time calling for different things, I possess God in as great tranquility as if I were upon my knees.",
    author: "Brother Lawrence",
    title: "The Practice of the Presence of God"
  },

  // J.C. Ryle
  {
    text: "The saddest thing in a Christian's life is that faith and fear often travel together.",
    author: "J.C. Ryle"
  },

  // Blaise Pascal
  {
    text: "There is a God-shaped vacuum in the heart of each man which cannot be satisfied by any created thing but only by God the Creator, made known through Jesus Christ.",
    author: "Blaise Pascal"
  },

  // R.C. Sproul
  {
    text: "God's grace is not a license to sin but a motivation to holiness.",
    author: "R.C. Sproul"
  },

  // Jonathan Edwards
  {
    text: "Resolution One: I will live for God. Resolution Two: If no one else does, I still will.",
    author: "Jonathan Edwards"
  },
];

/**
 * Get random quote from the collection
 */
function getRandomQuote(): Quote {
  const randomIndex = Math.floor(Math.random() * QUOTES.length);
  return QUOTES[randomIndex];
}

/**
 * Format quote for posting
 */
function formatQuotePost(quote: Quote): string {
  const titlePart = quote.title ? ` (${quote.title})` : '';
  return `"${quote.text}"\n\n— ${quote.author}${titlePart}\n\n#ChristianQuote #Theology #Faith #Wisdom`;
}

/**
 * Get bot user ID
 */
async function getBotUserId(): Promise<number> {
  const [bot] = await db
    .select()
    .from(users)
    .where(eq(users.username, BOT_USERNAME))
    .limit(1);

  if (!bot) {
    throw new Error(`Bot user "${BOT_USERNAME}" not found. Run create-bot-users.ts first.`);
  }

  return bot.id;
}

/**
 * Post quote to feed (microblogs)
 */
async function postQuote(userId: number, content: string): Promise<void> {
  try {
    await db.insert(microblogs).values({
      userId,
      content,
      createdAt: new Date(),
    });

  } catch (error) {
    console.error('Error posting quote:', error);
    throw error;
  }
}

/**
 * Main function - Post a theology quote
 */
async function main() {

  try {
    // Get bot user ID
    const botUserId = await getBotUserId();

    // Get random quote
    const quote = getRandomQuote();

    // Format post
    const postContent = formatQuotePost(quote);
    );
    );

    // Post to feed
    await postQuote(botUserId, postContent);

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as postTheologyQuote };
