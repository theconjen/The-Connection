/**
 * Seeds the Bible Reading Plans Table
 * 
 * This script adds the Connect Crew 2025 Reading Journal as a reading plan
 */

import { storage } from "./storage";
import { db } from "./db";
import { sql } from "drizzle-orm";

// Ensure the database has the necessary tables
async function ensureTables() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bible_reading_plans (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        duration INTEGER NOT NULL,
        readings JSONB NOT NULL,
        creator_id INTEGER REFERENCES users(id),
        group_id INTEGER REFERENCES groups(id),
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bible_reading_progress (
        id SERIAL PRIMARY KEY,
        plan_id INTEGER NOT NULL REFERENCES bible_reading_plans(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        current_day INTEGER DEFAULT 1,
        completed_days JSONB DEFAULT '[]',
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );
    `);
    
    console.log("Bible reading plan tables created successfully");
    return true;
  } catch (error) {
    console.error("Error creating Bible reading plan tables:", error);
    return false;
  }
}

// Create the Connect Crew 2025 Reading Journal plan
async function seedConnectCrewPlan() {
  try {
    // Check if the plan already exists
    const plans = await storage.getAllBibleReadingPlans();
    const existingPlan = plans.find(plan => 
      plan.title === "Connect Crew 2025 Reading Journal"
    );
    
    if (existingPlan) {
      console.log("Connect Crew 2025 Reading Journal plan already exists");
      return;
    }
    
    // Old Testament Narrative readings
    const otNarrativeReadings = [
      { day: 1, book: "Genesis", chapters: "1-11", description: "Creation, the Fall, Noah's Ark" },
      { day: 2, book: "Genesis", chapters: "12-25", description: "Abraham's story" },
      { day: 3, book: "Genesis", chapters: "26-36", description: "Isaac and Jacob's stories" },
      { day: 4, book: "Genesis", chapters: "37-50", description: "Joseph's story" },
      { day: 5, book: "Exodus", chapters: "1-12", description: "Moses and the Exodus begins" },
      { day: 6, book: "Exodus", chapters: "13-24", description: "Red Sea crossing, Ten Commandments" },
      { day: 7, book: "Exodus", chapters: "25-40", description: "Tabernacle instructions" },
      { day: 8, book: "Numbers", chapters: "1-14", description: "Census and beginning of wilderness journey" },
      { day: 9, book: "Numbers", chapters: "15-36", description: "Wilderness journey continues" },
      { day: 10, book: "Joshua", chapters: "1-12", description: "Entering and conquering Canaan" },
      { day: 11, book: "Joshua", chapters: "13-24", description: "Division of the land" },
      { day: 12, book: "Judges", chapters: "1-21", description: "Cycle of judges" },
      { day: 13, book: "Ruth", chapters: "1-4", description: "Ruth and Naomi's story" },
      { day: 14, book: "1 Samuel", chapters: "1-15", description: "Samuel and Saul" },
      { day: 15, book: "1 Samuel", chapters: "16-31", description: "David's rise" }
    ];
    
    // New Testament readings
    const ntReadings = [
      { day: 16, book: "Matthew", chapters: "1-14", description: "Birth of Jesus, early ministry" },
      { day: 17, book: "Matthew", chapters: "15-28", description: "Later ministry, death and resurrection" },
      { day: 18, book: "Mark", chapters: "1-16", description: "Jesus' ministry with emphasis on action" },
      { day: 19, book: "Luke", chapters: "1-12", description: "Birth of Jesus, early ministry" },
      { day: 20, book: "Luke", chapters: "13-24", description: "Later ministry, death and resurrection" },
      { day: 21, book: "John", chapters: "1-11", description: "Jesus' divinity and early miracles" },
      { day: 22, book: "John", chapters: "12-21", description: "Last days, death and resurrection" },
      { day: 23, book: "Acts", chapters: "1-14", description: "Early church, Peter's ministry" },
      { day: 24, book: "Acts", chapters: "15-28", description: "Paul's journeys" },
      { day: 25, book: "Romans", chapters: "1-16", description: "Paul's theology of salvation" },
      { day: 26, book: "1 Corinthians", chapters: "1-16", description: "Church issues at Corinth" },
      { day: 27, book: "2 Corinthians", chapters: "1-13", description: "Paul's defense of his ministry" },
      { day: 28, book: "Galatians, Ephesians", chapters: "All", description: "Freedom in Christ, unity of believers" },
      { day: 29, book: "Philippians, Colossians", chapters: "All", description: "Joy in Christ, supremacy of Christ" },
      { day: 30, book: "1 & 2 Thessalonians", chapters: "All", description: "Christ's return" }
    ];
    
    // All readings combined
    const allReadings = [...otNarrativeReadings, ...ntReadings];
    
    // Create the plan
    await storage.createBibleReadingPlan({
      title: "Connect Crew 2025 Reading Journal",
      description: "A Bible reading journal that takes you through the narrative of the Bible. This plan includes sections for reflection, questions, and tracking your progress. It's designed to provide a comprehensive overview of Scripture in a manageable format.",
      duration: 30,
      readings: allReadings,
      isPublic: true
    });
    
    console.log("Connect Crew 2025 Reading Journal plan created successfully");
  } catch (error) {
    console.error("Error seeding Connect Crew plan:", error);
  }
}

// Run the seeding process
export async function seedBibleReadingPlans() {
  const tablesCreated = await ensureTables();
  if (tablesCreated) {
    await seedConnectCrewPlan();
  }
}