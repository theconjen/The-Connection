import { pool } from "./db.js";
async function seedQandA() {
  console.log("Starting apologetics Q&A seeding...");
  try {
    const topicsResult = await pool.query(`SELECT COUNT(*) FROM apologetics_topics`);
    if (topicsResult.rows[0].count > 0) {
      console.log("Apologetics topics already exist, skipping seeding");
      return;
    }
    const demoUserResult = await pool.query(`SELECT id FROM users WHERE username = 'demo' LIMIT 1`);
    if (demoUserResult.rows.length === 0) {
      console.log("Demo user not found, skipping seeding");
      return;
    }
    const demoUserId = demoUserResult.rows[0].id;
    console.log(`Found demo user with ID: ${demoUserId}`);
    await pool.query(`
      UPDATE users 
      SET is_verified_apologetics_answerer = true 
      WHERE id = $1
    `, [demoUserId]);
    console.log("Marked demo user as verified apologetics answerer");
    const topicsData = [
      {
        title: "The Existence of God",
        description: "Discussions about philosophical and scientific arguments for God's existence, including cosmological, teleological, moral, and ontological arguments.",
        slug: "existence-of-god"
      },
      {
        title: "Problem of Evil and Suffering",
        description: "Addressing the challenge of reconciling a good and all-powerful God with the existence of evil and suffering in the world.",
        slug: "problem-of-evil"
      },
      {
        title: "The Reliability of the Bible",
        description: "Examining historical, archaeological, and textual evidence for the trustworthiness of biblical texts.",
        slug: "bible-reliability"
      },
      {
        title: "Science and Faith",
        description: "Exploring the relationship between scientific discoveries and religious belief, addressing apparent conflicts and areas of harmony.",
        slug: "science-faith"
      },
      {
        title: "The Divinity of Jesus",
        description: "Assessing historical evidence and theological arguments regarding Jesus's claims to divinity.",
        slug: "divinity-of-jesus"
      },
      {
        title: "Comparative Religion",
        description: "Comparing Christianity with other world religions and philosophical systems, examining unique claims and areas of overlap.",
        slug: "comparative-religion"
      }
    ];
    console.log("Creating apologetics topics...");
    for (const topic of topicsData) {
      await pool.query(`
        INSERT INTO apologetics_topics (title, description, slug)
        VALUES ($1, $2, $3)
      `, [topic.title, topic.description, topic.slug]);
    }
    console.log(`Created ${topicsData.length} apologetics topics`);
    const topicsQueryResult = await pool.query(`SELECT id, slug, title FROM apologetics_topics`);
    const topics = topicsQueryResult.rows;
    const questions = [];
    for (const topic of topics) {
      if (topic.slug === "existence-of-god") {
        questions.push({
          topic_id: topic.id,
          user_id: demoUserId,
          title: "How do we respond to the claim that the universe can exist without a creator?",
          content: "I've been having discussions with friends who argue that scientific theories like the multiverse hypothesis eliminate the need for a divine creator. They say the universe could have come from nothing or existed eternally. How can I respond to these claims from a Christian perspective while still respecting scientific inquiry?",
          status: "open"
        });
        questions.push({
          topic_id: topic.id,
          user_id: demoUserId,
          title: "What is the most compelling argument for God's existence in your view?",
          content: "There seem to be many arguments for God's existence - cosmological, teleological, moral, etc. Which do you find most compelling when discussing with skeptics, and why? I'm trying to develop a more effective approach in conversations with non-believing friends.",
          status: "open"
        });
      } else if (topic.slug === "problem-of-evil") {
        questions.push({
          topic_id: topic.id,
          user_id: demoUserId,
          title: "How can a good God allow innocent children to suffer?",
          content: "This is the question I struggle with most in my faith. When I see news of children suffering from diseases, abuse, or disasters, I find it difficult to reconcile with the idea of a loving God who is all-powerful. What perspective can help me understand this without resorting to 'God works in mysterious ways'?",
          status: "open"
        });
      } else if (topic.slug === "bible-reliability") {
        questions.push({
          topic_id: topic.id,
          user_id: demoUserId,
          title: "How do we address apparent contradictions in the Bible?",
          content: "I've been reading through the Gospels and noticed some differences in how events are described. For example, the resurrection accounts seem to have different details. How should I understand these apparent contradictions, and how do they affect our view of biblical reliability?",
          status: "open"
        });
      } else if (topic.slug === "science-faith") {
        questions.push({
          topic_id: topic.id,
          user_id: demoUserId,
          title: "Does evolution contradict the Genesis creation account?",
          content: "I'm a biology student who's also a Christian. I'm studying evolutionary theory, and while the evidence seems compelling from a scientific perspective, I'm unsure how to reconcile it with the Genesis creation account. Are they necessarily in conflict? How do other Christians who work in science address this?",
          status: "open"
        });
      } else if (topic.slug === "divinity-of-jesus") {
        questions.push({
          topic_id: topic.id,
          user_id: demoUserId,
          title: "What historical evidence supports Jesus' resurrection?",
          content: "Outside of the Bible itself, what historical evidence do we have that supports the resurrection of Jesus? I've heard critics claim it was just a story developed by his followers. What would be the strongest historical case I could present to someone skeptical of the resurrection accounts?",
          status: "open"
        });
      } else if (topic.slug === "comparative-religion") {
        questions.push({
          topic_id: topic.id,
          user_id: demoUserId,
          title: "How is Christianity unique among world religions?",
          content: "I have friends from various religious backgrounds who suggest that all religions are basically teaching the same core values and just have different cultural expressions. What makes Christianity uniquely different from other world religions in terms of its core claims and teachings?",
          status: "open"
        });
      }
    }
    console.log("Creating apologetics questions...");
    for (const question of questions) {
      await pool.query(`
        INSERT INTO apologetics_questions (title, content, user_id, topic_id, status, view_count)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [question.title, question.content, question.user_id, question.topic_id, question.status, 0]);
    }
    console.log(`Created ${questions.length} apologetics questions`);
    const questionsQueryResult = await pool.query(`SELECT id, title FROM apologetics_questions`);
    const createdQuestions = questionsQueryResult.rows;
    const answersToCreate = [];
    for (const question of createdQuestions) {
      if (question.title.includes("God allow innocent children") || question.title.includes("most compelling argument") || question.title.includes("Christianity unique")) {
        let answerContent = "";
        if (question.title.includes("God allow innocent children")) {
          answerContent = "The problem of suffering, especially regarding innocent children, is one of the most challenging aspects of Christian theology. Rather than providing simplistic answers, we should acknowledge several perspectives:\n\n1. Free will: Much suffering results from human choices and actions. God values human freedom, even though it can be misused to cause harm.\n\n2. Fallen world: Christian theology teaches that we live in a world affected by sin and brokenness, where natural processes can cause suffering.\n\n3. God's presence in suffering: The Christian message uniquely presents a God who entered into human suffering through Jesus. Rather than remaining distant, God experienced pain and death firsthand.\n\n4. Future redemption: Christianity teaches that present suffering is not the final word. Scripture promises a future restoration where suffering will end.\n\n5. God's intimate care: Jesus showed special concern for children and used harsh language for those who harm them (Matthew 18:6).\n\nRather than offering neat explanations, sometimes the most authentic response is to join in lament while holding onto hope in God's ultimate goodness and redemption.";
        } else if (question.title.includes("most compelling argument")) {
          answerContent = "Different arguments resonate with different people based on their backgrounds and thinking styles. Here are some of the most compelling approaches:\n\n1. The Cosmological Argument: The universe had a beginning (supported by Big Bang cosmology) and everything that begins to exist has a cause. This points to a transcendent, immaterial, powerful first cause.\n\n2. Fine-Tuning Argument: The fundamental constants of physics and initial conditions of the universe appear precisely calibrated to permit life. This specified complexity suggests design rather than random chance.\n\n3. Moral Argument: Objective moral values and duties seem to exist across cultures. These make most sense if grounded in a transcendent moral lawgiver rather than being merely evolutionary or social constructs.\n\n4. The Historical Evidence for Jesus: The historical evidence for Jesus' life, death, and reported resurrection provides a concrete basis for considering his claims about God.\n\n5. The Argument from Consciousness: The existence of consciousness is difficult to explain through purely materialistic processes.\n\nInstead of presenting these as 'proofs,' I find it more effective to offer them as cumulative clues that make theism a reasonable position. The goal in conversations should be understanding rather than 'winning,' and recognizing that both belief and unbelief require faith commitments.";
        } else if (question.title.includes("Christianity unique")) {
          answerContent = "While there are indeed ethical overlaps between religions, Christianity makes several unique claims that distinguish it fundamentally from other world religions:\n\n1. Grace vs. Works: Christianity uniquely teaches salvation by grace through faith, not by human effort or merit. Other religions generally teach some form of earning divine favor through right actions.\n\n2. Incarnation: The claim that God became human in Jesus is unique to Christianity. In other religions, divine beings may appear temporarily in human form, but not as a full incarnation.\n\n3. The Nature of God: Christianity teaches a Trinitarian understanding of God as one being in three persons, different from the strict monotheism of Islam or the polytheism of Hinduism.\n\n4. Resurrection: While some religions have rebirth concepts, Christianity's claim of bodily resurrection is distinctive, beginning with Jesus himself.\n\n5. The Problem of Sin: Christianity diagnoses humanity's problem as sin (rebellion against God) rather than ignorance, and offers reconciliation rather than primarily offering moral teachings or enlightenment.\n\n6. Historical Focus: Christianity is rooted in specific historical claims about Jesus that are open to investigation, rather than timeless philosophical principles.\n\n7. Relationship vs. Religion: Christianity emphasizes a personal relationship with God rather than primarily religious observances.\n\nThese distinctive claims mean that while we should respect other traditions, it's not accurate to say all religions are teaching the same thing in different ways.";
        }
        answersToCreate.push({
          question_id: question.id,
          content: answerContent,
          user_id: demoUserId,
          is_verified_answer: true
        });
      }
    }
    console.log("Creating apologetics answers...");
    for (const answer of answersToCreate) {
      await pool.query(`
        INSERT INTO apologetics_answers (content, question_id, user_id, is_verified_answer)
        VALUES ($1, $2, $3, $4)
      `, [answer.content, answer.question_id, answer.user_id, answer.is_verified_answer]);
      await pool.query(`
        UPDATE apologetics_questions
        SET status = 'answered'
        WHERE id = $1
      `, [answer.question_id]);
    }
    console.log(`Created ${answersToCreate.length} apologetics answers`);
    console.log("Apologetics Q&A data seeding completed successfully");
  } catch (error) {
    console.error("Error seeding apologetics Q&A:", error);
  }
}
if (import.meta.url === new URL(import.meta.url).href) {
  seedQandA().then(() => process.exit(0)).catch((error) => {
    console.error("Failed to seed apologetics Q&A data:", error);
    process.exit(1);
  });
}
export {
  seedQandA
};
