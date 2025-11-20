/**
 * Seed apologetics resources (books, podcasts, videos)
 */
import { db } from "./db";

if (!db) throw new Error('db is not initialized. Run with USE_DB=true or initialize the database first.');
import { apologeticsResources } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedResources() {
  console.log("Starting resources seeding...");
  
  try {
    // Check if resources already exist
    const existingResources = await db.select({ count: sql<number>`count(*)` }).from(apologeticsResources);
    if (existingResources[0]?.count > 0) {
      console.log("Resources already exist, skipping seeding");
      return;
    }

    const resourcesData = [
      // Books
      {
        title: "The Reason for God by Timothy Keller",
        description: "Addresses common objections to Christianity with intellectual depth and pastoral sensitivity. Perfect for skeptics and believers alike.",
        type: "book",
        iconName: "book",
        url: "https://www.amazon.com/Reason-God-Belief-Age-Skepticism/dp/1594483493"
      },
      {
        title: "Mere Christianity by C.S. Lewis",
        description: "Classic apologetics work explaining core Christian beliefs through logic and reason. Originally BBC radio talks during WWII.",
        type: "book",
        iconName: "book",
        url: "https://www.amazon.com/Mere-Christianity-C-S-Lewis/dp/0060652926"
      },
      {
        title: "The Case for Christ by Lee Strobel",
        description: "Former atheist journalist investigates historical evidence for Jesus. Interviews leading scholars and experts.",
        type: "book",
        iconName: "book",
        url: "https://www.amazon.com/Case-Christ-Journalists-Personal-Investigation/dp/0310345863"
      },
      {
        title: "I Don't Have Enough Faith to Be an Atheist by Norman Geisler & Frank Turek",
        description: "Presents logical arguments for Christianity using philosophy, science, and history. Step-by-step case building.",
        type: "book",
        iconName: "book",
        url: "https://www.amazon.com/Dont-Have-Enough-Faith-Atheist/dp/1581345615"
      },
      {
        title: "Cold-Case Christianity by J. Warner Wallace",
        description: "Homicide detective applies investigative techniques to examine Gospel accounts. Unique perspective on evidence.",
        type: "book",
        iconName: "book",
        url: "https://www.amazon.com/Cold-Case-Christianity-Homicide-Detective-Investigates/dp/1434704696"
      },
      
      // Podcasts
      {
        title: "Unbelievable? with Justin Brierley",
        description: "Premier UK podcast featuring debates between Christians and skeptics. Weekly discussions on faith, science, and philosophy.",
        type: "podcast",
        iconName: "mic",
        url: "https://www.premierchristianradio.com/Shows/Saturday/Unbelievable"
      },
      {
        title: "Reasonable Faith Podcast with William Lane Craig",
        description: "Leading philosopher discusses arguments for Christianity. Covers cosmology, morality, resurrection, and more.",
        type: "podcast",
        iconName: "mic",
        url: "https://www.reasonablefaith.org/podcasts/defenders-podcast-series-3"
      },
      {
        title: "Stand to Reason with Greg Koukl",
        description: "Practical training in defending your faith with grace and truth. Weekly Q&A and strategy discussions.",
        type: "podcast",
        iconName: "mic",
        url: "https://www.str.org/podcasts"
      },
      {
        title: "The Veritas Forum",
        description: "University talks exploring life's hardest questions through Christianity. Features leading academics and thinkers.",
        type: "podcast",
        iconName: "mic",
        url: "https://www.veritas.org/podcast/"
      },
      
      // Videos/Channels
      {
        title: "InspiringPhilosophy YouTube Channel",
        description: "Animated videos defending Christianity using philosophy, science, and biblical scholarship. Clear and engaging.",
        type: "video",
        iconName: "play",
        url: "https://www.youtube.com/@InspiringPhilosophy"
      },
      {
        title: "Capturing Christianity YouTube Channel",
        description: "Interviews with scholars and debates on Christian apologetics. Run by Cameron Bertuzzi.",
        type: "video",
        iconName: "play",
        url: "https://www.youtube.com/@CapturingChristianity"
      },
      {
        title: "The Bible Project",
        description: "Beautiful animated videos explaining biblical themes and books. Excellent for understanding Scripture.",
        type: "video",
        iconName: "play",
        url: "https://www.youtube.com/@BibleProject"
      },
      {
        title: "Cross Examined with Frank Turek",
        description: "Addresses student questions on university campuses. Direct answers to tough objections.",
        type: "video",
        iconName: "play",
        url: "https://www.youtube.com/@CrossExamined"
      },

      // Online Resources
      {
        title: "ReasonableFaith.org",
        description: "William Lane Craig's website with articles, videos, and academic resources on Christian apologetics.",
        type: "article",
        iconName: "globe",
        url: "https://www.reasonablefaith.org/"
      },
      {
        title: "Got Questions?",
        description: "Comprehensive Q&A site answering thousands of Bible and theology questions with Scripture references.",
        type: "article",
        iconName: "globe",
        url: "https://www.gotquestions.org/"
      },
      {
        title: "BioLogos",
        description: "Explores harmony between science and Christian faith. Founded by Francis Collins (Human Genome Project).",
        type: "article",
        iconName: "globe",
        url: "https://biologos.org/"
      },
    ];

    console.log("Creating apologetics resources...");
    const insertedResources = await db.insert(apologeticsResources).values(resourcesData).returning();
    console.log(`Created ${insertedResources.length} apologetics resources`);
    
    console.log("Resources seeding completed successfully");
  } catch (error) {
    console.error("Error seeding resources:", error);
  }
}
