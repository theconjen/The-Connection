/**
 * Frequently Asked Questions — Top 20 from GotQuestions.org + Additional Pressing Questions
 * These are the most commonly searched Christian questions on the internet.
 * Each entry follows the LibraryPostSeed interface for seeding into the apologetics library.
 */

import { LibraryPostSeed } from './apologetics-library-content';

// ============================================================================
// FAQ — Theology
// ============================================================================

const faqTheology: LibraryPostSeed[] = [
  {
    domain: 'apologetics',
    areaName: 'Theology',
    tagName: 'Gender & Ministry',
    title: 'What does the Bible say about women pastors?',
    tldr: 'Christians disagree on this question. Complementarians believe Scripture reserves the senior pastoral office for men based on passages like 1 Timothy 2:12. Egalitarians argue those texts address specific first-century situations and that the broader biblical trajectory affirms women in all ministry roles. Both sides affirm women\'s equal dignity, spiritual giftedness, and vital role in the church.',
    keyPoints: [
      '1 Timothy 2:12 and 1 Corinthians 14:34-35 are the primary restrictive texts; their interpretation is debated among serious scholars',
      'The Bible records women in significant leadership: Deborah (judge), Priscilla (teacher), Phoebe (deacon/patron), Junia (possibly an apostle)',
      'Complementarians see a distinction between equal worth and different roles, rooted in creation order',
      'Egalitarians argue the restrictive passages address local problems (false teaching, disorder) and that Galatians 3:28 establishes the principle',
      'Most traditions agree women can teach, prophesy, serve as deacons, lead ministries, and exercise spiritual gifts',
    ],
    scriptureRefs: ['1 Timothy 2:11-15', 'Galatians 3:28', 'Romans 16:1-7', 'Judges 4:4-5', '1 Corinthians 14:34-35', 'Acts 18:26', 'Joel 2:28-29'],
    bodyMarkdown: `This is one of the most debated questions in the church today. Faithful Christians who love Scripture and take it seriously land on different sides. Understanding the arguments requires careful attention to the biblical texts, their historical context, and the broader theology of Scripture.

## The Key Texts

### The Restrictive Passages

**1 Timothy 2:11-15** is the central text in this debate. Paul writes: "I do not permit a woman to teach or to assume authority over a man; she must be quiet." He then appeals to the order of creation (Adam was formed first) and the fall (Eve was deceived).

**1 Corinthians 14:34-35** says women "should remain silent in the churches." However, Paul had already acknowledged women praying and prophesying in public worship just three chapters earlier (1 Corinthians 11:5), which complicates a blanket reading.

### The Expansive Passages

**Galatians 3:28**: "There is neither male nor female, for you are all one in Christ Jesus." While this primarily addresses salvation, many scholars argue it has implications for community life.

**Romans 16:1-7**: Paul commends Phoebe as a *diakonos* (deacon/minister) and *prostatis* (patron/leader). He greets Priscilla (listed before her husband) and Junia, whom he describes as "outstanding among the apostles"—though the translation of this phrase is debated.

**Acts 2:17-18**: Peter quotes Joel's prophecy that "your sons and daughters will prophesy," presenting the Spirit's empowerment of women as a hallmark of the new covenant era.

## The Complementarian View

Complementarians (including many Baptists, Presbyterians, and Catholics) hold that:

- God created men and women as equal in value but with different roles
- The pastoral/elder office is reserved for qualified men (1 Timothy 3:1-7)
- Paul's appeal to creation order (not cultural custom) makes his instruction transcultural
- This reflects God's design, not a statement about women's competence or worth
- Women have vast scope for ministry: teaching women and children, missions, counseling, deacon ministry, worship leading, and more

**Key scholars**: Wayne Grudem, Thomas Schreiner, John Piper

## The Egalitarian View

Egalitarians (including many Methodists, Pentecostals, Anglicans, and some Baptists) hold that:

- Paul's restrictions in 1 Timothy addressed specific false teaching being spread by women in Ephesus
- The word *authentein* (translated "authority") is extremely rare and may mean "to domineer" rather than ordinary authority
- Paul's appeal to Adam and Eve addresses the specific deception happening, not a universal gender hierarchy
- The trajectory of Scripture moves toward full inclusion (slavery → freedom, Jew/Gentile → unity, male/female → equality)
- The early church had women in significant leadership, which Paul himself affirmed

**Key scholars**: Gordon Fee, Philip Payne, Cynthia Long Westfall, N.T. Wright

## What Both Sides Agree On

- Women and men are equally created in God's image (Genesis 1:27)
- Women are equally gifted by the Holy Spirit (1 Corinthians 12)
- Women played crucial roles in Jesus' ministry and the early church
- The church needs women's voices, leadership, and gifts
- This is an in-house debate among believers, not a test of orthodoxy

## A Word of Wisdom

However you land on this question, guard against two errors: (1) dismissing the biblical texts as outdated without doing the hard exegetical work, and (2) using these texts to diminish or silence women in ways that go beyond what even the most restrictive reading requires. The church at its best has always honored women as co-laborers in the gospel (Philippians 4:3).`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed', 'Pentecostal', 'Anglican'],
    sources: [
      { author: 'Thomas R. Schreiner', title: 'Two Views on Women in Ministry', publisher: 'Zondervan', year: 2005 },
      { author: 'Philip B. Payne', title: 'Man and Woman, One in Christ', publisher: 'Zondervan', year: 2009 },
      { author: 'Wayne Grudem', title: 'Evangelical Feminism and Biblical Truth', publisher: 'Multnomah', year: 2004 },
      { author: 'Cynthia Long Westfall', title: 'Paul and Gender', publisher: 'Baker Academic', year: 2016 },
    ],
  },
  {
    domain: 'apologetics',
    areaName: 'Theology',
    tagName: 'Sexuality & Ethics',
    title: 'What does the Bible say about homosexuality?',
    tldr: 'The Bible contains several passages that address same-sex sexual behavior, and the historic Christian position across Catholic, Orthodox, and Protestant traditions has understood these as prohibiting it. A revisionist reading argues the texts address exploitative practices (not loving committed relationships). This remains one of the most pastorally sensitive and debated issues in the modern church.',
    keyPoints: [
      'Six passages are commonly cited: Genesis 19, Leviticus 18:22 and 20:13, Romans 1:26-27, 1 Corinthians 6:9-10, and 1 Timothy 1:10',
      'The traditional view holds these texts reflect a consistent biblical sexual ethic: sex belongs within male-female marriage',
      'The revisionist view argues the texts address pederasty, temple prostitution, or exploitation—not loving same-sex partnerships',
      'The word arsenokoitai (1 Corinthians 6:9) is debated; it appears to be coined from the Leviticus prohibition',
      'All sides should agree that LGBTQ+ individuals deserve dignity, safety, compassion, and a place in the conversation',
    ],
    scriptureRefs: ['Romans 1:26-27', 'Leviticus 18:22', '1 Corinthians 6:9-11', 'Genesis 2:24', '1 Timothy 1:10', 'Matthew 19:4-6'],
    bodyMarkdown: `Few topics generate more heat and less light in the church today. This question involves real people—friends, family members, fellow Christians—and demands both theological honesty and genuine compassion. We will present the major views fairly.

## The Biblical Texts

### Old Testament

**Genesis 19** (Sodom and Gomorrah): The men of Sodom demand to "know" Lot's visitors. Traditional readings see this as sexual sin; others argue the primary sin was violent inhospitality and attempted gang rape (see Ezekiel 16:49-50, which cites Sodom's sins as pride, excess, and neglect of the poor).

**Leviticus 18:22 and 20:13**: "Do not have sexual relations with a man as one does with a woman; that is detestable." These are part of the Holiness Code. Traditionalists see them as moral law still in force. Revisionists note the surrounding context includes laws Christians no longer observe and argue these addressed specific pagan practices.

### New Testament

**Romans 1:26-27**: Paul describes same-sex behavior as a consequence of idolatry: people "exchanged natural sexual relations for unnatural ones." This is the most detailed New Testament reference. The debate centers on whether "natural" means God's created design (traditional) or acting against one's own nature/orientation (revisionist).

**1 Corinthians 6:9-10**: Paul lists *arsenokoitai* and *malakoi* among those who will not inherit the kingdom. *Arsenokoitai* is a compound word (arsen = male, koite = bed) that appears to echo Leviticus 18:22 in the Greek translation. Translators render it variously as "homosexuals," "sodomites," or "men who practice homosexuality." The revisionist view argues it refers to exploitative acts, not orientation or committed partnerships.

**1 Timothy 1:10**: Lists *arsenokoitai* among lawbreakers, in a context echoing the Ten Commandments.

## The Traditional View

The historic position of the Catholic, Orthodox, and most Protestant churches:

- Scripture consistently presents marriage as between a man and a woman (Genesis 2:24, Matthew 19:4-6)
- Every biblical reference to same-sex sexual behavior is negative; there are no positive examples
- The Romans 1 passage describes the behavior as contrary to God's created design, not merely cultural convention
- The Christian sexual ethic calls all unmarried people—heterosexual and homosexual—to celibacy
- Same-sex attraction is not itself sinful; acting on it is

**Key voices**: Robert Gagnon, Wesley Hill (who is himself gay and celibate), Rosaria Butterfield, the Nashville Statement

## The Revisionist/Affirming View

A growing number of Christians, churches, and scholars argue:

- The biblical authors had no concept of sexual orientation or loving, committed same-sex partnerships
- The texts address exploitative practices: pederasty (older men with boys), prostitution, rape, and excess
- Romans 1 describes idolatrous people acting against their own heterosexual nature, not people with a homosexual orientation
- The biblical principles of love, faithfulness, and covenantal commitment can apply to same-sex marriages
- The church's treatment of LGBTQ+ individuals has caused tremendous harm that demands repentance

**Key voices**: Matthew Vines, James Brownson, David Gushee

## What Everyone Should Agree On

Regardless of where you land theologically:

1. **Every person is made in God's image** and deserves dignity and respect
2. **The church has often failed** LGBTQ+ individuals through cruelty, rejection, and silence during the AIDS crisis
3. **Bullying, violence, and conversion therapy** that harms mental health are wrong
4. **This conversation requires humility**—people on both sides are trying to be faithful to God
5. **The gospel is for everyone**—no one is beyond the reach of God's love

## For Those Who Are Struggling

If you experience same-sex attraction and are trying to follow Jesus, know that you are not alone. Resources like the writings of Wesley Hill (*Washed and Waiting*) and organizations that provide pastoral support can be helpful. You are loved by God, and your journey matters to the church.`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed', 'Anglican', 'Progressive'],
    sources: [
      { author: 'Robert A.J. Gagnon', title: 'The Bible and Homosexual Practice', publisher: 'Abingdon Press', year: 2001 },
      { author: 'Matthew Vines', title: 'God and the Gay Christian', publisher: 'Convergent', year: 2014 },
      { author: 'Wesley Hill', title: 'Washed and Waiting', publisher: 'Zondervan', year: 2010 },
      { author: 'James V. Brownson', title: 'Bible, Gender, Sexuality', publisher: 'Eerdmans', year: 2013 },
    ],
  },
  {
    domain: 'apologetics',
    areaName: 'Theology',
    tagName: 'Salvation',
    title: 'Can a Christian lose their salvation? (Eternal security explained)',
    tldr: 'Christians hold different views on this. The "once saved, always saved" position (eternal security) teaches that true believers cannot lose their salvation because it depends on God\'s faithfulness, not human performance. The Arminian view holds that believers can willfully abandon faith and forfeit salvation. Both views take Scripture seriously and agree that genuine faith produces persevering obedience.',
    keyPoints: [
      'Eternal security is grounded in passages like John 10:28-29 ("no one can snatch them out of my hand"), Romans 8:38-39, and Ephesians 1:13-14',
      'Warning passages like Hebrews 6:4-6, Hebrews 10:26-31, and 2 Peter 2:20-22 appear to describe real believers falling away',
      'Calvinists distinguish between true believers (who persevere) and false professors (who fall away, proving they were never saved)',
      'Arminians argue the warnings are genuine—believers can shipwreck their faith through persistent, willful rebellion',
      'Both sides agree that someone living in unrepentant sin with no concern for God shows no evidence of saving faith',
    ],
    scriptureRefs: ['John 10:28-29', 'Romans 8:38-39', 'Ephesians 1:13-14', 'Hebrews 6:4-6', 'Hebrews 10:26-31', 'Philippians 1:6', '2 Peter 2:20-22', '1 John 2:19'],
    bodyMarkdown: `"Once saved, always saved"—is it true? This question touches the heart of the gospel: Does salvation ultimately depend on God's power or human faithfulness? The answer shapes how Christians understand assurance, sanctification, and the nature of faith itself.

## The Eternal Security View (Calvinist/Reformed)

### The Biblical Case

**John 10:28-29**: Jesus says, "I give them eternal life, and they shall never perish; no one will snatch them out of my hand. My Father, who has given them to me, is greater than all; no one can snatch them out of my Father's hand."

**Romans 8:38-39**: "Neither death nor life, neither angels nor demons... nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord."

**Ephesians 1:13-14**: Believers are "sealed with the Holy Spirit of promise, who is the guarantee of our inheritance."

**Philippians 1:6**: "He who began a good work in you will carry it on to completion until the day of Christ Jesus."

### The Logic

If salvation is God's work from start to finish—if he chose us, called us, justified us, and will glorify us (Romans 8:29-30)—then our security rests on his faithfulness, not ours. The "golden chain" of Romans 8:29-30 has no broken links: everyone God foreknew, he predestined, called, justified, and glorified. None are lost along the way.

### What About People Who Fall Away?

Reformed theology handles this with 1 John 2:19: "They went out from us, but they did not really belong to us. For if they had belonged to us, they would have remained with us; but their going showed that none of them belonged to us." Those who permanently fall away were never truly regenerate—they had an outward profession without inward transformation.

## The Conditional Security View (Arminian/Wesleyan)

### The Biblical Case

**Hebrews 6:4-6**: "It is impossible for those who have once been enlightened, who have tasted the heavenly gift, who have shared in the Holy Spirit, who have tasted the goodness of the word of God and the powers of the coming age and who have fallen away, to be brought back to repentance." The language here ("enlightened," "tasted the heavenly gift," "shared in the Holy Spirit") appears to describe genuine believers, not mere professors.

**Hebrews 10:26-29**: "If we deliberately keep on sinning after we have received the knowledge of the truth, no sacrifice for sins is left... How much more severely do you think someone deserves to be punished who has trampled the Son of God underfoot, treated as an unholy thing the blood of the covenant that sanctified them?"

**2 Peter 2:20-22**: Those who "have escaped the corruption of the world by knowing our Lord and Savior Jesus Christ and are again entangled in it" are described as worse off than before.

### The Logic

If the warning passages are genuine warnings to real believers, then it must be possible to fall away. Otherwise, the warnings are meaningless. God's grace is not irresistible—it can be resisted and ultimately rejected through persistent, deliberate apostasy. This does not mean believers lose salvation over every sin, but that sustained, willful rebellion against known truth can sever the relationship.

## What Both Views Share

This is crucial: the practical implications of both views are remarkably similar.

1. **Genuine faith perseveres**: Both Calvinists and Arminians agree that true saving faith produces a changed life. Someone living in continuous, unrepentant sin with zero spiritual concern is not demonstrating saving faith.

2. **Assurance is possible**: Both affirm believers can have confidence in their salvation—Calvinists because God holds them, Arminians because God's grace sustains those who continue in faith.

3. **Sin is serious**: Neither view gives license to sin. Eternal security is not a "free pass"—the Reformed insist that the elect will persevere in holiness. Conditional security warns that willful rebellion has eternal consequences.

4. **The gospel is about grace**: Salvation is not earned by works in either view. It is received by faith and sustained by God's grace.

## Pastoral Wisdom

If you struggle with assurance of salvation, consider this: the very fact that you care about your relationship with God is itself evidence of the Spirit's work in you. Those who have truly abandoned God don't worry about whether they've abandoned God. Your concern is a sign of spiritual life, not spiritual death.

The proper response to either view is the same: trust Christ, walk in repentance, grow in holiness, and rest in God's promise that he is faithful.`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed', 'Protestant', 'Pentecostal'],
    sources: [
      { author: 'Thomas R. Schreiner & Ardel B. Caneday', title: 'The Race Set Before Us', publisher: 'IVP Academic', year: 2001 },
      { author: 'Robert Shank', title: 'Life in the Son', publisher: 'Bethany House', year: 1960 },
      { author: 'John Piper', title: 'Five Points', publisher: 'Christian Focus', year: 2013 },
      { author: 'Ben Witherington III', title: 'The Problem with Evangelical Theology', publisher: 'Baylor University Press', year: 2005 },
    ],
  },
  {
    domain: 'apologetics',
    areaName: 'Theology',
    tagName: 'Life & Death',
    title: 'What does the Bible say about suicide?',
    tldr: 'The Bible does not contain a direct command about suicide, but it consistently affirms that life is a sacred gift from God. The historic Christian position discourages suicide as contrary to God\'s sovereignty over life. However, modern theology and pastoral care recognize that mental illness is real, that suicidal people need compassion rather than condemnation, and that God\'s grace is greater than any single act.',
    keyPoints: [
      'The Bible records several suicides (Saul, Judas, Ahithophel, Zimri, Samson) without offering explicit theological commentary on the act itself',
      'The "thou shalt not kill" commandment (Exodus 20:13) and the sanctity of life (Genesis 1:27, Psalm 139) form the biblical foundation against taking any human life, including one\'s own',
      'The Catholic tradition has historically classified suicide as mortal sin, but the modern Catechism recognizes psychological factors that diminish moral responsibility',
      'Most Protestant theologians emphasize that salvation depends on faith in Christ, not on the manner of death—a believer who dies by suicide does not automatically lose salvation',
      'The most important response is compassion: if someone is suicidal, they need help, not theology lectures',
    ],
    scriptureRefs: ['Psalm 139:13-16', 'Genesis 1:27', 'Exodus 20:13', '1 Corinthians 6:19-20', 'Romans 8:38-39', 'Psalm 34:18', '1 Kings 19:4'],
    bodyMarkdown: `This question often arises in the context of profound pain—someone has lost a loved one, or someone is themselves in crisis. We must handle it with extreme care. Theological accuracy matters, but compassion matters more.

**If you or someone you know is in crisis, please contact the 988 Suicide and Crisis Lifeline by calling or texting 988. You are not alone.**

## What the Bible Shows Us

### Suicides in Scripture

The Bible records at least six suicides:

- **Saul** (1 Samuel 31:4) — fell on his sword in battle
- **Saul's armor-bearer** (1 Samuel 31:5) — followed Saul
- **Ahithophel** (2 Samuel 17:23) — hanged himself after his counsel was rejected
- **Zimri** (1 Kings 16:18) — burned the palace down around himself
- **Judas** (Matthew 27:5) — hanged himself after betraying Jesus
- **Samson** (Judges 16:30) — pulled down the temple on himself and the Philistines

Notably, Scripture records these events without offering direct theological commentary. It does not say "and God condemned them for this" or "this was the unforgivable sin." The narrative simply records what happened.

### Elijah's Despair

One of the most important passages is **1 Kings 19:4**, where the prophet Elijah—exhausted, afraid, and depressed—prays: "I have had enough, LORD. Take my life." God's response is not rebuke. He sends an angel with food and water, lets Elijah sleep, and then gently restores him. God met Elijah's suicidal despair with provision and presence, not condemnation.

### The Sanctity of Life

The Bible consistently teaches that human life is sacred:

- We are made in God's image (Genesis 1:27)
- God knit us together in the womb (Psalm 139:13-16)
- Our bodies are temples of the Holy Spirit (1 Corinthians 6:19-20)
- God is sovereign over life and death (Job 1:21, Deuteronomy 32:39)

These truths form the foundation for preserving life. However, they are meant as affirmations of our worth, not weapons to wield against people in despair.

## The Theological Question: Is Suicide an Unforgivable Sin?

### The Catholic Position

Historically, the Catholic Church classified suicide as a mortal sin because it violates the Fifth Commandment and rejects God's sovereignty over life. However, the **modern Catechism (CCC 2282-2283)** has significantly nuanced this:

> "Grave psychological disturbances, anguish, or grave fear of hardship, suffering, or torture can diminish the responsibility of the one committing suicide. We should not despair of the eternal salvation of persons who have taken their own lives. By ways known to him alone, God can provide the opportunity for salutary repentance."

### The Protestant Position

Most Protestant theologians reject the idea that suicide is an unforgivable sin:

- The only unforgivable sin Jesus identified is blasphemy against the Holy Spirit (Matthew 12:31-32), which is persistent, deliberate rejection of God's saving work—not a single act committed in despair
- Salvation depends on faith in Christ, not on the circumstances of death (Romans 8:38-39)
- A believer who dies by suicide is still covered by the blood of Christ
- Mental illness can profoundly impair judgment and freedom of will

### What We Can Say with Confidence

- Suicide is a tragedy, not God's plan for anyone
- God's grace is vast enough to cover even our worst moments
- We cannot make final judgments about anyone's eternal destiny—that belongs to God alone
- The proper Christian response to suicide is grief, compassion, and support for survivors

## The Pastoral Priority

When someone is suicidal, the appropriate response is not a theology lesson. It is:

1. **Listen** without judgment
2. **Take it seriously** — never dismiss someone's pain
3. **Get professional help** — connect them with counselors, crisis lines, or emergency services
4. **Stay present** — isolation is dangerous; your presence matters
5. **Pray** — but not as a substitute for practical help

The church should be the safest place for someone to say "I'm struggling." If it isn't, we have work to do.

## For Those Grieving a Suicide Loss

If you have lost someone to suicide, please hear this: it was not your fault. You could not have known, and you could not have prevented it. Your loved one's eternal destiny is in God's hands—the same God who is "close to the brokenhearted" (Psalm 34:18). Grief after suicide is uniquely painful because it mixes sorrow with guilt, anger, and unanswered questions. Seek support from a counselor or a grief support group. You do not have to carry this alone.`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed', 'Protestant'],
    sources: [
      { author: 'Albert Y. Hsu', title: 'Grieving a Suicide', publisher: 'IVP', year: 2002 },
      { author: 'Catechism of the Catholic Church', title: 'Paragraphs 2280-2283', publisher: 'Libreria Editrice Vaticana', year: 1992 },
      { author: 'Matthew Stanford', title: 'Grace for the Afflicted', publisher: 'IVP', year: 2008 },
    ],
  },
  {
    domain: 'apologetics',
    areaName: 'Theology',
    tagName: 'Afterlife',
    title: 'Do pets and animals go to heaven?',
    tldr: 'The Bible does not give a definitive answer. Scripture affirms that animals are part of God\'s good creation and that the new creation will include animals (Isaiah 11:6-9). Whether your specific pet will be there is not directly addressed. However, many theologians note that a God who cares for sparrows (Matthew 10:29) and who promises to make "all things new" (Revelation 21:5) is more than capable of including beloved animals in the renewed world.',
    keyPoints: [
      'Animals are part of God\'s good creation (Genesis 1:21-25) and he takes delight in them (Psalm 104)',
      'The Bible describes animals in the future renewed creation: the wolf and lamb will lie together (Isaiah 11:6-9, Isaiah 65:25)',
      'The Hebrew word nephesh (living soul/being) is used for both animals (Genesis 1:20-21) and humans (Genesis 2:7)',
      'Romans 8:19-22 says all creation groans and will be "liberated from bondage to decay"—this includes the animal kingdom',
      'C.S. Lewis, Billy Graham, and Pope Francis have all expressed hope that animals may be part of the life to come',
    ],
    scriptureRefs: ['Isaiah 11:6-9', 'Romans 8:19-22', 'Revelation 21:5', 'Psalm 104:24-30', 'Matthew 10:29', 'Genesis 1:21-25', 'Ecclesiastes 3:21'],
    bodyMarkdown: `Anyone who has loved and lost a pet knows this question comes from the heart, not idle curiosity. The grief of losing a beloved animal companion is real, and it deserves a thoughtful answer.

## What the Bible Does Say

### Animals Are Part of God's Good Creation

Genesis 1 records God creating animals and declaring them "good" (Genesis 1:21, 1:25) before humans even exist. God delights in his creatures. Psalm 104 is an extended celebration of God's care for animals—lions, goats, storks, whales—and declares "the earth is full of your creatures" (Psalm 104:24).

Jesus himself pointed to God's care for animals: "Are not two sparrows sold for a penny? Yet not one of them will fall to the ground outside your Father's care" (Matthew 10:29).

### Animals in the New Creation

The prophets describe the renewed world in terms that explicitly include animals:

**Isaiah 11:6-9**: "The wolf will live with the lamb, the leopard will lie down with the goat, the calf and the lion and the yearling together; and a little child will lead them... They will neither harm nor destroy on all my holy mountain."

**Isaiah 65:25**: "The wolf and the lamb will feed together, and the lion will eat straw like the ox."

**Romans 8:19-22**: Paul writes that "the creation itself will be liberated from its bondage to decay and brought into the freedom and glory of the children of God." The word "creation" (*ktisis*) here refers to the natural world, including animals. If creation itself will be renewed, animals are included.

**Revelation 21:5**: "I am making everything new." Not "I am making all new things" but "all things new"—the renewal of what already exists.

### The Question of Animal "Souls"

**Ecclesiastes 3:21** asks: "Who knows if the human spirit rises upward and if the spirit of the animal goes down into the earth?" This is an honest expression of uncertainty, not a definitive statement.

In Hebrew, both animals and humans are called *nephesh chayyah*—"living beings" or "living souls" (Genesis 1:20-21, 24; Genesis 2:7). The Bible does not draw the sharp line between "humans have souls, animals don't" that many Christians assume.

However, humans alone are made in the *image of God* (Genesis 1:27), which gives humanity a unique dignity and relationship with God. This distinction is real but does not require that animals are excluded from the life to come.

## What Theologians Have Said

**C.S. Lewis** explored this question thoughtfully in *The Problem of Pain*. He suggested that animals beloved by humans might participate in eternity through their relationship with their human owners, just as humans participate in eternity through their relationship with Christ. He was speculative but hopeful.

**John Wesley**, the founder of Methodism, preached a sermon ("The General Deliverance") arguing that animals will be restored and elevated in the new creation, compensated for their suffering in this life.

**Billy Graham** said: "God will prepare everything for our perfect happiness in heaven, and if it takes my dog being there, I believe he'll be there."

**Pope Francis** reportedly said: "Paradise is open to all God's creatures"—though the exact wording has been debated.

**Peter Kreeft**, Catholic philosopher, writes: "If we love animals, I think God will give them to us in heaven. Would God be less generous than we wish?"

## An Honest Answer

The Bible does not say "your dog will be in heaven" or "your cat won't be in heaven." It simply doesn't address the question directly. What it does tell us:

1. God created animals and called them good
2. God cares about animals—not one sparrow is forgotten
3. The new creation will include animals
4. God promises to make all things new
5. Heaven will be better than we can imagine, not worse

If the God who numbers the hairs on your head and watches over sparrows has the power to include your beloved companion in the world to come, we have every reason to hope. And if heaven is truly the place of perfect joy, nothing you need for that joy will be missing.`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed', 'Protestant'],
    sources: [
      { author: 'C.S. Lewis', title: 'The Problem of Pain (Chapter 9: Animal Pain)', publisher: 'HarperOne', year: 1940 },
      { author: 'Peter Kreeft', title: 'Everything You Ever Wanted to Know About Heaven', publisher: 'Ignatius Press', year: 1990 },
      { author: 'John Wesley', title: 'The General Deliverance (Sermon 60)', year: 1781 },
    ],
  },
];

// ============================================================================
// FAQ — Modern Questions
// ============================================================================

const faqModernQuestions: LibraryPostSeed[] = [
  {
    domain: 'apologetics',
    areaName: 'Modern Questions',
    tagName: 'Christian Living',
    title: 'Is getting a tattoo a sin? What does the Bible say about tattoos?',
    tldr: 'The only direct biblical reference is Leviticus 19:28: "Do not put tattoo marks on yourselves." However, this is part of the Old Testament ceremonial law given specifically to Israel, alongside commands Christians no longer observe (mixed fabrics, dietary laws). Most scholars agree this prohibition was connected to pagan mourning rituals, not a universal moral law. The New Testament does not mention tattoos. Christians are free to disagree on this.',
    keyPoints: [
      'Leviticus 19:28 is the only verse that directly mentions tattoo marks, in the context of pagan mourning practices',
      'The surrounding verses prohibit things like trimming beards (v.27) and mixing fabrics (v.19)—laws most Christians do not consider binding',
      'The New Testament never mentions tattoos; the "marks" in Galatians 6:17 refer to scars from persecution, not body art',
      '1 Corinthians 6:19-20 ("your body is a temple") is often cited but is about sexual immorality in context, not body modification',
      'This is a matter of Christian liberty and conscience (Romans 14), not a salvation issue',
    ],
    scriptureRefs: ['Leviticus 19:28', '1 Corinthians 6:19-20', 'Romans 14:1-4', 'Galatians 6:17', 'Colossians 2:16-17', '1 Samuel 16:7'],
    bodyMarkdown: `Tattoos are everywhere in modern culture, and Christians wondering whether it's okay to get one often encounter strong opinions on both sides. Let's look at what the Bible actually says—and what it doesn't.

## The Leviticus Passage

**Leviticus 19:28**: "Do not cut your bodies for the dead or put tattoo marks on yourselves. I am the LORD."

This is the only verse in the entire Bible that directly mentions tattoos. To understand it properly, we need context:

### The Context

Leviticus 19 is part of the Holiness Code—laws given to Israel to distinguish them from surrounding pagan nations. The same chapter prohibits:

- Eating meat with blood (v.26)
- Practicing divination (v.26)
- Cutting the hair at the sides of your head (v.27)
- Trimming your beard (v.27)
- Wearing garments of mixed fabrics (v.19)
- Planting two kinds of seed in one field (v.19)

Most Christians recognize that these ceremonial and cultural laws were fulfilled in Christ (Colossians 2:16-17) and do not apply directly to New Covenant believers. We eat pork, wear cotton-polyester blends, and trim our beards without moral concern. The question is whether tattoos fall in the same category as these cultural laws or in the category of moral law (like prohibitions against stealing or lying in the same chapter).

### The Pagan Connection

The prohibition in Leviticus 19:28 is specifically linked to mourning practices for the dead. Ancient Near Eastern peoples would cut themselves and mark their bodies as part of pagan funeral rites and worship of deceased spirits. God's concern was idolatry and pagan religious practice, not body art in general.

## New Testament Silence

The New Testament says nothing about tattoos. This is significant because the apostles addressed many Old Testament laws (food laws, circumcision, Sabbath) and clarified which applied to Gentile Christians. Tattoos are never mentioned.

### "Your Body Is a Temple"

**1 Corinthians 6:19-20** is frequently cited: "Do you not know that your bodies are temples of the Holy Spirit...? Therefore honor God with your bodies."

However, reading the full context makes clear that Paul is specifically addressing **sexual immorality** (1 Corinthians 6:15-18), not body modification. Using this verse against tattoos requires applying it to things the author was not discussing. If applied consistently, it would also prohibit ear piercings, hair dye, and arguably unhealthy eating.

## Arguments For and Against

### Reasons Some Christians Avoid Tattoos

- Desire to honor the Leviticus principle, even if not bound by the specific law
- Concern about cultural associations
- Personal conviction that their body should remain "unmarked"
- Romans 14 principle: if it bothers your conscience, don't do it

### Reasons Some Christians Get Tattoos

- The Leviticus prohibition is ceremonial law, not moral law
- Many Christians use tattoos to express their faith (crosses, Scripture verses, meaningful symbols)
- It can be a conversation starter and witness
- Christian liberty allows what is not specifically prohibited in the New Covenant

## The Principle: Christian Liberty

**Romans 14:1-4** is the best framework for this question. Paul addresses "disputable matters"—things not clearly commanded or prohibited—and says:

> "Who are you to judge someone else's servant? To their own master, servants stand or fall."

A tattoo is not a salvation issue. It is a matter of personal conviction and Christian liberty. If your conscience says no, respect that. If your conscience is clear, you are free. But do not judge your brother or sister either way.

## Practical Wisdom

If you're considering a tattoo, some wise considerations:

- **Motive matters**: Is it for vanity, rebellion, or meaningful expression?
- **Content matters**: A Bible verse is different from something crude or idolatrous
- **Permanence matters**: Make sure it's something you'll still value in 20 years
- **Witness matters**: Consider how it might affect your relationships and ministry context
- **Conscience matters**: If you have to talk yourself into it, that hesitation may be the Spirit's guidance`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed'],
    sources: [
      { author: 'John H. Walton', title: 'The IVP Bible Background Commentary: Old Testament', publisher: 'IVP Academic', year: 2000 },
      { author: 'Gordon D. Fee', title: 'The First Epistle to the Corinthians (NICNT)', publisher: 'Eerdmans', year: 2014 },
      { author: 'Douglas Moo', title: 'The Epistle to the Romans (NICNT)', publisher: 'Eerdmans', year: 2018 },
    ],
  },
  {
    domain: 'apologetics',
    areaName: 'Modern Questions',
    tagName: 'Sexuality & Ethics',
    title: 'What does the Bible say about masturbation?',
    tldr: 'The Bible does not explicitly mention masturbation. The story of Onan (Genesis 38:9-10) is about refusing to fulfill a family obligation, not about masturbation. However, Jesus\' teaching on lust (Matthew 5:28) is relevant because masturbation is typically accompanied by lustful thoughts. Most Christian traditions discourage the practice while acknowledging it is not directly named as sin in Scripture.',
    keyPoints: [
      'The Bible never directly mentions masturbation by name—there is no explicit command for or against it',
      'The story of Onan (Genesis 38:9-10) is about his refusal to provide an heir for his dead brother, not about masturbation',
      'Jesus\' teaching in Matthew 5:28 ("anyone who looks at a woman lustfully has already committed adultery") is the most relevant principle',
      'The Catholic Catechism (CCC 2352) classifies masturbation as "an intrinsically and gravely disordered action" while recognizing mitigating factors',
      'Most Protestant pastors counsel that the practice should be evaluated by whether it involves lust, fantasy about others, or compulsive behavior',
    ],
    scriptureRefs: ['Matthew 5:28', 'Genesis 38:9-10', '1 Corinthians 6:18-20', '1 Thessalonians 4:3-5', 'Philippians 4:8', 'Galatians 5:16'],
    bodyMarkdown: `This is one of the most commonly searched questions about Christianity and sex, yet it's rarely addressed from the pulpit. The silence creates confusion and guilt. Let's look at what Scripture says and doesn't say.

## What the Bible Does NOT Say

### The Story of Onan

**Genesis 38:9-10** is often cited as a proof text against masturbation. Onan was required by levirate law to produce an heir with his dead brother's wife. Instead, "he spilled his semen on the ground" and God struck him dead.

However, Onan's sin was not about the physical act itself—it was about:
- Refusing his family duty to provide an heir for his brother
- Exploiting Tamar sexually while denying her the child she was owed
- Disobedience to a direct obligation

This passage is about selfishness and violation of covenant duty, not about masturbation.

### Other "Proof Texts"

There are no other passages that directly address the topic. Attempts to read it into texts about "uncleanness" (e.g., Leviticus 15) refer to ceremonial purity laws about bodily discharges, not moral prohibitions.

## What the Bible DOES Say

While the specific act is not named, several biblical principles apply:

### Jesus on Lust

**Matthew 5:28**: "Anyone who looks at a woman lustfully has already committed adultery with her in his heart."

This is the most relevant teaching. The question becomes: can masturbation be separated from lustful fantasy? In most cases, it involves sexual thoughts about someone who is not your spouse, which Jesus clearly identifies as sin.

### Self-Control as a Virtue

**Galatians 5:22-23** lists self-control as a fruit of the Spirit. **1 Thessalonians 4:3-5** calls believers to "learn to control your own body in a way that is holy and honorable, not in passionate lust like the pagans."

The question is not just "is the physical act sinful?" but "is this practice building self-control or undermining it?"

### The Thought Life

**Philippians 4:8**: "Whatever is true, whatever is noble, whatever is right, whatever is pure... think about such things."

Christianity cares deeply about the inner life. The thought patterns that typically accompany masturbation—fantasy, objectification, often pornography—are difficult to square with this standard.

## What Christian Traditions Teach

### Catholic

The Catechism (CCC 2352) teaches that masturbation is "an intrinsically and gravely disordered action" but acknowledges that "the immaturity of adolescence, force of acquired habit, conditions of anxiety or other psychological or social factors can lessen, if not even reduce to a minimum, moral culpability."

### Orthodox

Generally regards masturbation as a passion to be overcome through prayer, fasting, and spiritual direction, rather than a legal violation.

### Protestant (Evangelical/Reformed)

Views range from:
- **Strictly against**: Any sexual activity outside marriage is sin
- **Nuanced**: The act itself may not be sinful, but the lust accompanying it usually is
- **Pastoral**: Focus on the heart issue—is this compulsive? Is pornography involved? Is it interfering with real relationships?

## Practical Pastoral Guidance

Most pastors and counselors offer guidance along these lines:

1. **Don't carry unnecessary shame**: If the Bible doesn't explicitly name something as sin, we shouldn't either. Shame spirals can be more destructive than the behavior itself.

2. **Examine the heart**: Is this accompanied by lustful fantasy about real or imagined people? Is pornography involved? Those are the clearer sin issues.

3. **Watch for compulsion**: When any behavior becomes compulsive—when you feel powerless to stop—it has become a form of bondage, which is contrary to the freedom Christ offers (Galatians 5:1).

4. **Consider the trajectory**: Is this practice leading you toward healthy sexuality and relational intimacy, or away from it?

5. **Grace is real**: If you struggle, you are not disqualified from God's love. Bring it to God honestly rather than hiding in shame. "If we confess our sins, he is faithful and just to forgive us" (1 John 1:9).

6. **Seek help without shame**: If this is connected to pornography addiction or compulsive behavior, professional Christian counseling can help. You are not alone in this struggle.`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed'],
    sources: [
      { author: 'Catechism of the Catholic Church', title: 'Paragraph 2352', publisher: 'Libreria Editrice Vaticana', year: 1992 },
      { author: 'Lewis B. Smedes', title: 'Sex for Christians', publisher: 'Eerdmans', year: 1994 },
      { author: 'Juli Slattery', title: 'Rethinking Sexuality', publisher: 'Multnomah', year: 2018 },
    ],
  },
  {
    domain: 'apologetics',
    areaName: 'Modern Questions',
    tagName: 'Marriage',
    title: 'What does the Bible say about interracial marriage?',
    tldr: 'The Bible does not prohibit interracial marriage. The Old Testament prohibitions against "intermarriage" were about religion, not race—Israel was forbidden from marrying people who worshiped other gods. The Bible affirms that all humans are one race made in God\'s image (Acts 17:26), and several interracial marriages in Scripture are presented positively (Moses and Zipporah, Ruth and Boaz, Rahab in Jesus\' genealogy).',
    keyPoints: [
      'The Old Testament "intermarriage" prohibitions (Deuteronomy 7:3-4) were explicitly about idolatry, not ethnicity—"for they will turn your children away from following me to serve other gods"',
      'Moses married Zipporah, an Ethiopian/Midianite woman; when Miriam criticized this, God struck her with leprosy (Numbers 12)',
      'Ruth (a Moabite) married Boaz (an Israelite) and became the great-grandmother of King David and an ancestor of Jesus',
      'Acts 17:26 declares God "made from one man every nation of mankind"—all humans share one origin and equal dignity',
      'The use of Scripture to justify racial segregation (as in the antebellum South and apartheid) is a well-documented misuse of the Bible',
    ],
    scriptureRefs: ['Acts 17:26', 'Genesis 1:27', 'Galatians 3:28', 'Numbers 12:1-15', 'Deuteronomy 7:3-4', 'Ruth 4:13-17', 'Revelation 7:9'],
    bodyMarkdown: `This question has a painful history. For centuries, portions of the Bible were misused to justify racial segregation and bans on interracial marriage. The last U.S. state anti-miscegenation law was struck down by the Supreme Court in *Loving v. Virginia* (1967), and some churches continued to resist long after. It's important to be clear about what the Bible actually teaches.

## The Short Answer

The Bible does not prohibit interracial marriage. It has no concept of "race" as we understand it. The prohibitions against intermarriage in the Old Testament were entirely about **religious faithfulness**, not skin color or ethnicity.

## The Old Testament "Intermarriage" Texts

**Deuteronomy 7:3-4**: "Do not intermarry with them. Do not give your daughters to their sons or take their daughters for your sons, **for they will turn your children away from following me to serve other gods**, and the LORD's anger will burn against you."

The text itself states the reason: **idolatry**, not race. When Israelites married people from other nations who worshiped Yahweh, there was no problem. When they married idol-worshipers, it was forbidden.

This is confirmed by the story of Solomon. His problem was not that his wives were foreign—it was that they "turned his heart after other gods" (1 Kings 11:4).

## Interracial Marriages the Bible Celebrates

### Moses and Zipporah

Moses married Zipporah, a Midianite (Exodus 2:21). Numbers 12:1 says he also married a "Cushite woman" (from modern-day Ethiopia/Sudan). When his sister Miriam complained about this marriage, God's response was swift and severe—he struck Miriam with leprosy (Numbers 12:9-10). God defended the interracial marriage and punished the one who objected to it.

### Ruth and Boaz

Ruth was a Moabite—a people generally despised by Israel. Yet the entire Book of Ruth celebrates her faithfulness and her marriage to Boaz. Their great-grandson was King David, and Ruth appears in the genealogy of Jesus himself (Matthew 1:5).

### Rahab

Rahab was a Canaanite prostitute who demonstrated faith in the God of Israel (Joshua 2). She married an Israelite named Salmon and also appears in Jesus' genealogy (Matthew 1:5).

### The Ethiopian Eunuch

In Acts 8:26-39, Philip shares the gospel with an Ethiopian official who believes and is immediately baptized. There is no hint of racial barrier to full inclusion.

## The Biblical Vision of Humanity

### One Human Race

**Acts 17:26**: "From one man he made all the nations, that they should inhabit the whole earth."

**Genesis 1:27**: "God created mankind in his own image." Not some races in his image—*all* of humanity.

The Bible knows nothing of the modern concept of "race" as a biological category. It speaks of nations, tribes, languages, and peoples—but all are descended from the same source and equally bear God's image.

### The Future Vision

**Revelation 7:9**: "After this I looked, and there before me was a great multitude that no one could count, from every nation, tribe, people and language, standing before the throne."

The culmination of God's plan is not racial separation but racial unity in worship. Every ethnicity is represented. The diversity is preserved and celebrated, not erased.

### Galatians 3:28

"There is neither Jew nor Gentile, neither slave nor free, nor is there male and female, for you are all one in Christ Jesus."

The deepest division in the ancient world—Jew and Gentile—was obliterated in Christ. If that wall fell, no racial boundary can stand.

## The Sinful History of Misusing Scripture

It must be acknowledged that Christians used the Bible to justify slavery, segregation, and bans on interracial marriage. Common arguments included:

- The "curse of Ham" (Genesis 9:25) — a text about Canaan, not Africa, and not about race
- The "separation of nations" at Babel (Genesis 11) — about language and geography, not a command against mixing
- "God separated the races" — nowhere stated in Scripture

These arguments were exegetically bankrupt and morally catastrophic. The Southern Baptist Convention formally apologized for its role in supporting racism in 1995. The history stands as a warning about reading cultural prejudice into the Bible.

## Conclusion

If you are in an interracial relationship or considering one, the Bible is on your side. The only biblical concern about marriage partners is spiritual, not racial: "Do not be yoked together with unbelievers" (2 Corinthians 6:14). Shared faith, not shared ethnicity, is the biblical standard for marriage compatibility.`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed', 'Historically Black Church'],
    sources: [
      { author: 'J. Daniel Hays', title: 'From Every People and Nation: A Biblical Theology of Race', publisher: 'IVP Academic', year: 2003 },
      { author: 'Jemar Tisby', title: 'The Color of Compromise', publisher: 'Zondervan', year: 2019 },
      { author: 'Jarvis J. Williams', title: 'One New Man: The Cross and Racial Reconciliation in Pauline Theology', publisher: 'B&H Academic', year: 2010 },
    ],
  },
];

// ============================================================================
// FAQ — Historical Evidence
// ============================================================================

const faqHistorical: LibraryPostSeed[] = [
  {
    domain: 'apologetics',
    areaName: 'Historical Evidence',
    tagName: 'Genesis',
    title: 'Where did Cain get his wife?',
    tldr: 'Cain married one of his sisters or close relatives. Genesis 5:4 states that Adam and Eve "had other sons and daughters." In the earliest generations of humanity, marriage between siblings was the only option and was not prohibited until the Mosaic law (Leviticus 18). Genetic concerns would not have applied to the first generations because the human gene pool had not yet accumulated harmful mutations.',
    keyPoints: [
      'Genesis 5:4 explicitly states Adam and Eve had other sons and daughters beyond Cain, Abel, and Seth',
      'Marriage between close relatives was not prohibited until the Mosaic law, over 2,000 years later (Leviticus 18:6-18)',
      'Abraham married his half-sister Sarah (Genesis 20:12) without condemnation, showing this was acceptable before the Law',
      'Genetic problems from intermarriage accumulate over generations; the first generations would have had a pristine gene pool',
      'This is not a Bible contradiction—it only seems problematic if you assume Genesis mentions every person who existed',
    ],
    scriptureRefs: ['Genesis 4:17', 'Genesis 5:4', 'Genesis 1:28', 'Leviticus 18:6-18', 'Genesis 20:12'],
    bodyMarkdown: `"Where did Cain get his wife?" is one of the oldest objections raised against the Bible. Skeptics ask it as a "gotcha"—if Adam and Eve were the first humans and only had Cain and Abel, where did Cain's wife come from? The answer is straightforward once you read the full text.

## The Simple Answer

**Genesis 5:4**: "After Seth was born, Adam lived 800 years and had **other sons and daughters**."

Adam and Eve had many children. Cain married one of his sisters (or possibly a niece, if we allow for a generation gap). The Bible does not name all of Adam and Eve's children—only those relevant to the narrative (Cain, Abel, Seth).

## But Isn't That Incest?

By modern standards and modern law, yes. But several important points:

### 1. There Was No Alternative

If humanity began with one couple, sibling marriage was the only option for the first generation. The command to "be fruitful and multiply" (Genesis 1:28) necessitated it.

### 2. The Prohibition Came Later

The laws against incest were not given until Moses, roughly 2,500 years after creation (Leviticus 18:6-18). Before that, close-relative marriage was practiced without condemnation:

- Abraham married his half-sister Sarah (Genesis 20:12)
- Isaac married his cousin Rebekah (Genesis 24:15)
- Jacob married his cousins Rachel and Leah (Genesis 29)

God prohibited close-relative marriage when it became harmful and unnecessary—when the human population was large enough for other options.

### 3. Genetic Concerns Didn't Apply Yet

The genetic reason incest is dangerous today is that close relatives are likely to carry the same recessive harmful mutations, increasing the odds of genetic disorders in offspring. But in the earliest generations:

- The human genome was "fresh"—few harmful mutations had accumulated
- Genetic diversity within one family was sufficient for healthy reproduction
- Over thousands of years, mutations accumulated, making close-relative marriage genetically risky
- This is precisely when God prohibited it in the Law

## The Bigger Point

This question is actually a textbook example of an objection that dissolves once you read the passage carefully. The Bible itself provides the answer in Genesis 5:4. The objection only works if you assume Genesis names every person—which it clearly doesn't. Biblical genealogies are selective, highlighting key figures in the narrative.

## What About the "Land of Nod"?

Genesis 4:16-17 says Cain went to the "land of Nod" and knew his wife there. Some assume this means there were already people in Nod unrelated to Adam. But the text doesn't say Cain *found* his wife in Nod—it says he went there and "knew" (had relations with) his wife. He likely married a sister before leaving or brought her with him.

The name "Nod" means "wandering"—it may have been named after Cain's exile rather than being a pre-existing civilization.`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed'],
    sources: [
      { author: 'Gleason Archer', title: 'Encyclopedia of Bible Difficulties', publisher: 'Zondervan', year: 1982 },
      { author: 'John H. Walton', title: 'The Lost World of Adam and Eve', publisher: 'IVP Academic', year: 2015 },
      { author: 'Kenneth A. Mathews', title: 'Genesis 1-11:26 (NAC)', publisher: 'Broadman & Holman', year: 1996 },
    ],
  },
];

// ============================================================================
// FAQ — Theology (Afterlife, Sacraments, Holy Spirit, Christology)
// ============================================================================

const faqTheology2: LibraryPostSeed[] = [
  {
    domain: 'apologetics',
    areaName: 'Theology',
    tagName: 'Afterlife',
    title: 'What happens after death? What does the Bible say about the afterlife?',
    tldr: 'The Bible teaches that death is not the end. Believers enter the presence of God immediately after death (Luke 23:43, Philippians 1:23, 2 Corinthians 5:8) and await the final resurrection when Christ returns. The ultimate hope is not disembodied heavenly existence but bodily resurrection in a renewed creation (1 Corinthians 15, Revelation 21). The wicked face judgment, though Christians disagree on the exact nature of hell.',
    keyPoints: [
      'The Bible teaches conscious existence after death, not soul sleep or annihilation at death',
      'Jesus told the thief on the cross, "Today you will be with me in paradise" (Luke 23:43)—immediate presence with God',
      'Paul said to be "away from the body" is to be "at home with the Lord" (2 Corinthians 5:8)',
      'The final destiny is bodily resurrection, not just "going to heaven"—God will resurrect and transform our physical bodies (1 Corinthians 15:42-44)',
      'Revelation 21-22 describes the ultimate hope: God dwelling with humanity on a renewed earth, not souls floating on clouds',
    ],
    scriptureRefs: ['Luke 23:43', '2 Corinthians 5:8', 'Philippians 1:23', '1 Corinthians 15:42-44', 'Revelation 21:1-5', '1 Thessalonians 4:13-18', 'John 14:2-3', 'Hebrews 9:27'],
    bodyMarkdown: `What happens when we die? This is arguably the most universal human question, and the Bible has much to say about it. The Christian hope is both more immediate and more physical than many people realize.

## Immediately After Death

### For Believers

The Bible teaches that believers enter God's presence immediately at death:

**Luke 23:43**: Jesus told the thief on the cross, "Truly I tell you, today you will be with me in paradise." Not "after the resurrection" or "eventually"—*today*.

**Philippians 1:23**: Paul says, "I desire to depart and be with Christ, which is better by far." He expected to be with Christ immediately upon death.

**2 Corinthians 5:8**: "We would prefer to be away from the body and at home with the Lord."

This state is sometimes called the **intermediate state**—the period between death and the final resurrection. The believer is conscious, with Christ, and at peace, but not yet in their final resurrected body.

### For Unbelievers

**Hebrews 9:27**: "People are destined to die once, and after that to face judgment."

**Luke 16:19-31** (the parable of the rich man and Lazarus): While this is a parable and we should be cautious about building detailed theology from it, it portrays conscious existence after death for both the righteous (in "Abraham's bosom") and the wicked (in torment).

The exact nature of this intermediate judgment is debated. Some traditions teach a particular judgment at death followed by a general judgment at Christ's return.

## The Final Resurrection

The Christian hope is not merely "going to heaven when you die." It is **bodily resurrection**.

**1 Corinthians 15:42-44**: "The body that is sown is perishable, it is raised imperishable; it is sown in dishonor, it is raised in glory; it is sown in weakness, it is raised in power; it is sown a natural body, it is raised a spiritual body."

This is not a ghost or a spirit. It is a real, physical, transformed body—like Jesus' resurrection body, which could eat, be touched, and walk through walls. It is our current body, raised and glorified.

**1 Thessalonians 4:16-17**: "The Lord himself will come down from heaven... and the dead in Christ will rise first. After that, we who are still alive and are still left will be caught up together with them."

## The New Creation

The final destiny of believers is not a disembodied spiritual realm but a **renewed physical creation**:

**Revelation 21:1-5**: "Then I saw a new heaven and a new earth... I saw the Holy City, the new Jerusalem, coming down out of heaven from God... 'Look! God's dwelling place is now among the people, and he will dwell with them.'"

Note the direction: God comes *down* to dwell with humanity on a renewed earth. The popular image of souls floating on clouds playing harps is not biblical. The Bible's vision is earthy, physical, and communal—a restored creation where God lives with his people forever.

**Revelation 21:4**: "He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain."

## What About Hell?

Christians hold three main views:

### Eternal Conscious Torment (Traditional)
The wicked experience conscious punishment forever. Based on Matthew 25:46 ("eternal punishment"), Revelation 20:10, and Mark 9:48. Held by most Catholic, Orthodox, and Evangelical traditions.

### Annihilationism/Conditional Immortality
The wicked are ultimately destroyed—they cease to exist after judgment. "Eternal punishment" means the punishment is permanent (irreversible), not perpetual (ongoing). Supported by Matthew 10:28 ("destroy both soul and body") and growing among evangelical scholars like John Stott and Edward Fudge.

### Universal Reconciliation
God will ultimately reconcile all people to himself. Based on passages like 1 Timothy 2:4, Colossians 1:20, and Romans 11:32. Held by some Orthodox theologians and a minority of Protestants. The mainstream church has historically rejected this view, though it has serious proponents.

## What About Purgatory?

The Catholic Church teaches purgatory—a state of purification after death for those who die in grace but are not yet fully sanctified. Based on 2 Maccabees 12:46, 1 Corinthians 3:13-15, and the logic that nothing impure can enter heaven (Revelation 21:27). Protestants and Orthodox generally reject purgatory, though C.S. Lewis (an Anglican) expressed something like it.

## The Christian Hope

The Christian view of the afterlife is not escapism. It is the promise that everything wrong will be made right, that death does not have the final word, and that the God who created this beautiful world will not abandon it but will renew it. As Paul wrote: "Where, O death, is your victory? Where, O death, is your sting?" (1 Corinthians 15:55).`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed', 'Protestant'],
    sources: [
      { author: 'N.T. Wright', title: 'Surprised by Hope', publisher: 'HarperOne', year: 2008 },
      { author: 'Randy Alcorn', title: 'Heaven', publisher: 'Tyndale House', year: 2004 },
      { author: 'Anthony Hoekema', title: 'The Bible and the Future', publisher: 'Eerdmans', year: 1979 },
    ],
  },
  {
    domain: 'apologetics',
    areaName: 'Theology',
    tagName: 'Holy Spirit',
    title: 'What does the Bible say about speaking in tongues?',
    tldr: 'Speaking in tongues appears in Acts (as known languages enabling cross-cultural proclamation) and in 1 Corinthians 12-14 (as a spiritual gift for prayer and worship). Christians disagree on whether this gift continues today. Pentecostals and charismatics believe it does; cessationists argue miraculous gifts ceased with the apostles. Paul valued tongues but prioritized prophecy and intelligible teaching for building up the church.',
    keyPoints: [
      'At Pentecost (Acts 2:4-11), the disciples spoke in known foreign languages they had not learned—people from many nations understood in their own tongues',
      'In 1 Corinthians 12-14, Paul describes tongues as a spiritual gift, possibly including both known languages and ecstatic prayer speech',
      'Paul says tongues without interpretation does not edify the church: "I would rather speak five intelligible words than ten thousand words in a tongue" (1 Corinthians 14:19)',
      'Cessationists argue 1 Corinthians 13:8 ("tongues will cease") means the gift ended with the apostolic era or the completion of the New Testament',
      'Continuationists point out that 1 Corinthians 13:10 says gifts cease "when completeness comes"—which they interpret as Christ\'s return, not the canon',
    ],
    scriptureRefs: ['Acts 2:4-11', '1 Corinthians 12:10', '1 Corinthians 14:1-5', '1 Corinthians 14:18-19', '1 Corinthians 14:27-28', '1 Corinthians 13:8-10', 'Mark 16:17', 'Romans 8:26'],
    bodyMarkdown: `Few topics divide Christians as sharply as speaking in tongues. Entire denominations are defined by their position on this gift. Let's examine what the Bible actually says.

## Tongues in Acts

### Pentecost (Acts 2)

On the day of Pentecost, the Holy Spirit came upon the disciples and "they began to speak in other tongues as the Spirit enabled them" (Acts 2:4). The crowd was amazed because "each one heard their own language being spoken" (Acts 2:6).

This was clearly **known human languages** (*glossai* = languages/tongues). Parthians, Medes, Elamites, and people from across the Roman world all heard the gospel in their native languages. This was a reversal of Babel—God uniting what was divided.

### Later in Acts

Tongues appear again in Acts 10:46 (Cornelius's household—confirming Gentile inclusion) and Acts 19:6 (disciples in Ephesus). In both cases, tongues served as evidence of the Holy Spirit's arrival in a new group of people.

## Tongues in 1 Corinthians

Paul addresses tongues extensively in 1 Corinthians 12-14. Here the picture is more complex:

### As a Spiritual Gift

**1 Corinthians 12:10**: Tongues and interpretation of tongues are listed among spiritual gifts. Not everyone receives this gift (12:30).

### Tongues in Prayer

**1 Corinthians 14:2**: "Anyone who speaks in a tongue does not speak to people but to God. Indeed, no one understands them; they utter mysteries by the Spirit."

This suggests a form of tongues that is not a known human language but a Spirit-empowered prayer language. Paul says he who speaks in tongues "edifies himself" (14:4).

### Paul's Regulations

Paul valued tongues but imposed strict order:

1. **Prophecy is greater** unless tongues are interpreted (14:5)
2. **Limit speakers**: Two or three at most per service (14:27)
3. **Require interpretation**: If no interpreter is present, the speaker should remain silent in church (14:28)
4. **Intelligibility matters**: "I would rather speak five intelligible words to instruct others than ten thousand words in a tongue" (14:19)
5. **Everything orderly**: "God is not a God of disorder but of peace" (14:33)

## The Debate: Do Tongues Continue Today?

### Cessationism

Cessationists believe miraculous sign gifts (tongues, healing, prophecy) ceased with the apostles or with the completion of the New Testament canon.

**Arguments:**
- **1 Corinthians 13:8**: "Where there are tongues, they will be stilled." Cessationists argue "when completeness comes" (13:10) refers to the completed Bible
- **Hebrews 2:3-4**: Signs and wonders confirmed the apostolic message—once confirmed, they were no longer needed
- Tongues served a specific purpose: authenticating the gospel to new groups (Jews, Gentiles, fringe disciples). That purpose was fulfilled
- Historical evidence of tongues-like phenomena is sparse from the 2nd century until the 20th

**Denominations**: Many Baptists, Presbyterians, Reformed churches

### Continuationism

Continuationists believe all spiritual gifts remain active until Christ returns.

**Arguments:**
- **1 Corinthians 13:10**: "When completeness comes" refers to Christ's return, not the biblical canon—because the next verse says "now we see in part; then we shall see face to face"
- Joel 2:28-29 (quoted in Acts 2:17) says the Spirit's gifts are for "the last days"—the entire church age, not just the apostolic era
- Hundreds of millions of Christians worldwide practice tongues today—the Pentecostal/Charismatic movement is the fastest-growing segment of global Christianity
- Paul said "do not forbid speaking in tongues" (1 Corinthians 14:39)

**Denominations**: Pentecostal, Assemblies of God, Charismatic Catholic, many non-denominational churches

### The Middle Ground

Many Christians hold a "open but cautious" position:
- They believe gifts *can* continue but exercise careful discernment
- They don't require tongues as evidence of the Spirit (against classical Pentecostal doctrine)
- They welcome genuine spiritual gifts while guarding against emotionalism and disorder

## Is Tongues the Evidence of the Spirit?

Classical Pentecostal doctrine teaches that speaking in tongues is the **initial physical evidence** of Spirit baptism. However:

- Paul explicitly says "Do all speak in tongues?" expecting the answer "no" (1 Corinthians 12:30)
- Galatians 5:22-23 lists the fruit of the Spirit (love, joy, peace...) without mentioning tongues
- Many Spirit-filled believers throughout history have never spoken in tongues

Most non-Pentecostal Christians affirm that the Spirit's presence is evidenced by the fruit of the Spirit and transformation of character, not by any single gift.

## Common Ground

All Bible-believing Christians agree:
- The Holy Spirit is active today
- Spiritual gifts are real and given for the building up of the church
- Love is the "most excellent way" (1 Corinthians 12:31-13:13)
- Worship should be orderly and edifying
- No gift should become a source of pride or division`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed', 'Pentecostal', 'Charismatic'],
    sources: [
      { author: 'Gordon D. Fee', title: 'God\'s Empowering Presence', publisher: 'Baker Academic', year: 2009 },
      { author: 'D.A. Carson', title: 'Showing the Spirit', publisher: 'Baker Academic', year: 1987 },
      { author: 'Sam Storms', title: 'The Beginner\'s Guide to Spiritual Gifts', publisher: 'Bethany House', year: 2012 },
      { author: 'Richard B. Gaffin Jr.', title: 'Perspectives on Pentecost', publisher: 'P&R Publishing', year: 1979 },
    ],
  },
  {
    domain: 'apologetics',
    areaName: 'Theology',
    tagName: 'Sacraments',
    title: 'Is baptism necessary for salvation? What does the Bible say about baptism?',
    tldr: 'Christians agree that baptism is important and commanded by Jesus (Matthew 28:19). They disagree on whether it is absolutely necessary for salvation. Some traditions (Catholic, Church of Christ) see baptism as the means through which saving grace is applied. Most Protestants see it as an outward sign of an inward reality—essential as an act of obedience but not the mechanism of salvation itself, which comes by faith (Ephesians 2:8-9).',
    keyPoints: [
      'Jesus commanded baptism in the Great Commission: "baptizing them in the name of the Father, Son, and Holy Spirit" (Matthew 28:19)',
      'Acts 2:38 links baptism to forgiveness: "Repent and be baptized, every one of you, for the forgiveness of your sins"',
      'The thief on the cross was saved without baptism (Luke 23:43), showing it is not absolutely required in extraordinary circumstances',
      'Mark 16:16 says "whoever believes and is baptized will be saved" but the negative is "whoever does not believe will be condemned"—not "whoever is not baptized"',
      '1 Peter 3:21 says "baptism now saves you—not the removal of dirt from the body but the pledge of a clear conscience toward God"',
    ],
    scriptureRefs: ['Matthew 28:19', 'Acts 2:38', 'Romans 6:3-4', 'Mark 16:16', '1 Peter 3:21', 'Ephesians 2:8-9', 'Luke 23:43', 'Acts 22:16', 'Galatians 3:27'],
    bodyMarkdown: `Baptism is one of the few things virtually all Christians practice—yet they disagree profoundly on what it means and whether it's necessary for salvation. Let's examine the evidence.

## What Jesus Said

**Matthew 28:19**: "Go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit." Baptism is clearly commanded.

**Mark 16:16**: "Whoever believes and is baptized will be saved, but whoever does not believe will be condemned." Note: the second clause mentions unbelief as the basis of condemnation, not lack of baptism.

**John 3:5**: "No one can enter the kingdom of God unless they are born of water and the Spirit." Some interpret "water" as baptism; others see it as natural birth or the cleansing work of the Word (Ephesians 5:26).

## The Major Views

### Baptismal Regeneration

**Held by**: Catholic, Orthodox, Church of Christ, some Lutherans

This view teaches that baptism is the ordinary means through which God applies saving grace. In baptism, sin is forgiven, the person is united with Christ, and the Holy Spirit is received.

**Key texts:**
- **Acts 2:38**: "Repent and be baptized... for the forgiveness of your sins"
- **Acts 22:16**: "Get up, be baptized and wash your sins away"
- **1 Peter 3:21**: "Baptism now saves you"
- **Titus 3:5**: "He saved us through the washing of rebirth and renewal by the Holy Spirit"
- **Galatians 3:27**: "All of you who were baptized into Christ have clothed yourselves with Christ"

The Catholic Catechism (CCC 1257) teaches: "Baptism is necessary for salvation for those to whom the Gospel has been proclaimed and who have had the possibility of asking for this sacrament." However, the Church also recognizes "baptism of desire" (for catechumens who die before baptism) and "baptism of blood" (for martyrs).

### Believer's Baptism (Ordinance View)

**Held by**: Baptists, many Evangelicals, Pentecostals

This view teaches that salvation comes by faith alone (Ephesians 2:8-9) and baptism is an outward sign of an inward reality that has already occurred. It is commanded and important—but it is a response to salvation, not the cause of it.

**Key texts:**
- **Ephesians 2:8-9**: "For it is by grace you have been saved, through faith... not by works"
- **Luke 23:43**: The thief on the cross was saved without baptism
- **Acts 10:44-48**: Cornelius and his household received the Holy Spirit *before* baptism
- **Romans 4:1-5**: Abraham was justified by faith, not by any ritual
- **1 Corinthians 1:17**: Paul said "Christ did not send me to baptize, but to preach the gospel"—suggesting baptism and the saving gospel are distinct

### Covenant Baptism (Reformed)

**Held by**: Presbyterians, Reformed, some Methodists

This view sees baptism as a covenant sign (like circumcision in the Old Testament) applied to believers and their children. It is a means of grace but not the sole or absolute condition of salvation. God works through baptism, but is not limited to it.

## The Thief on the Cross

The thief on the cross (Luke 23:43) is significant because Jesus promised him paradise without baptism. This shows that:

- In extraordinary circumstances, God saves apart from baptism
- Faith is the essential element; baptism is the normal expression of it
- Even traditions that teach baptismal regeneration acknowledge exceptions (baptism of desire)

## What Mode? Immersion, Pouring, or Sprinkling?

- **Immersion**: The Greek *baptizo* means "to dip" or "to immerse." Most scholars agree this was the earliest practice. Baptists and Orthodox churches practice immersion
- **Pouring/Sprinkling**: The *Didache* (early 2nd century) allowed pouring when immersion wasn't possible. Catholic, Presbyterian, and Methodist churches typically pour or sprinkle
- The mode is less important than the meaning—dying and rising with Christ (Romans 6:3-4)

## Infant vs. Believer's Baptism

- **Infant baptism**: Practiced by Catholic, Orthodox, Lutheran, Reformed, Methodist, and Anglican churches. Based on covenant theology, household baptisms in Acts (16:15, 16:33), and the parallel with circumcision
- **Believer's baptism**: Practiced by Baptist, Pentecostal, and many Evangelical churches. Based on the pattern in Acts where faith precedes baptism (Acts 2:41, 8:12, 8:36-37)

## What Everyone Agrees On

Despite deep disagreements, virtually all Christians affirm:

1. Jesus commanded baptism—it is not optional for those who follow him
2. Baptism identifies us with Christ's death and resurrection (Romans 6:3-4)
3. Baptism marks entrance into the visible community of faith
4. Deliberate refusal to be baptized, when possible, calls the sincerity of faith into question
5. God is sovereign and not limited by sacraments—he can save however he chooses`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed', 'Baptist', 'Pentecostal'],
    sources: [
      { author: 'G.R. Beasley-Murray', title: 'Baptism in the New Testament', publisher: 'Eerdmans', year: 1962 },
      { author: 'Everett Ferguson', title: 'Baptism in the Early Church', publisher: 'Eerdmans', year: 2009 },
      { author: 'Thomas R. Schreiner & Shawn D. Wright', title: 'Believer\'s Baptism: Sign of the New Covenant in Christ', publisher: 'B&H Academic', year: 2006 },
    ],
  },
  {
    domain: 'apologetics',
    areaName: 'Theology',
    tagName: 'Christology',
    title: 'Did Jesus go to hell between his death and resurrection?',
    tldr: 'The Apostles\' Creed says Jesus "descended into hell," but Christians interpret this phrase very differently. Some believe Jesus literally went to the realm of the dead (Hades/Sheol) to proclaim victory. Others believe the "descent" language refers to his suffering on the cross or his real experience of death. The key passages are 1 Peter 3:18-20 and Ephesians 4:8-10, both of which are among the most debated texts in the New Testament.',
    keyPoints: [
      'The Apostles\' Creed phrase "he descended into hell" was a later addition (not in the earliest versions) and uses "hell" to translate the Latin "inferos" (realm of the dead), not the place of punishment',
      '1 Peter 3:18-20 says Christ "went and made proclamation to the imprisoned spirits"—the identity of these spirits and timing of the proclamation is heavily debated',
      'Ephesians 4:8-10 mentions Christ descending "to the lower, earthly regions"—which may mean hell, the grave, or simply the earth (incarnation)',
      'Jesus told the thief "today you will be with me in paradise" (Luke 23:43), suggesting he went to a place of blessing, not torment',
      'The traditional view: Jesus descended to the realm of the dead (not hell as punishment) to proclaim victory and liberate the righteous dead',
    ],
    scriptureRefs: ['1 Peter 3:18-20', 'Ephesians 4:8-10', 'Luke 23:43', 'Acts 2:27', 'Psalm 16:10', 'Romans 10:7', 'Matthew 12:40', 'Colossians 2:15'],
    bodyMarkdown: `"He descended into hell"—these words from the Apostles' Creed have puzzled Christians for centuries. Did Jesus actually go to hell? If so, why? And what happened there?

## The Creed's Language

The phrase "he descended into hell" (*descendit ad inferos* in Latin) was not in the earliest versions of the Apostles' Creed. It first appeared in the 4th century. The Latin *inferos* means "the lower regions" or "the realm of the dead"—not necessarily the place of eternal punishment.

This distinction matters. In ancient thought, all the dead went to Sheol/Hades (the realm of the dead), which was distinct from Gehenna (the place of final punishment). The creed likely affirms that Jesus truly died and entered the realm of the dead, not that he went to the place of damnation.

## The Key Biblical Passages

### 1 Peter 3:18-20

"He was put to death in the body but made alive in the Spirit. After being made alive, he went and made proclamation to the imprisoned spirits—to those who were disobedient long ago when God waited patiently in the days of Noah."

This is one of the most difficult passages in the New Testament. Major interpretations:

1. **Christ's spirit went to the realm of the dead between Friday and Sunday** to proclaim victory to fallen angels imprisoned since Noah's flood. This was a victory announcement, not an evangelistic offer.

2. **The pre-incarnate Christ** preached through Noah to the people of his generation (who are now "in prison" = dead). Peter is looking backward, not describing a post-crucifixion event.

3. **The risen Christ** (after being "made alive") proclaimed his victory over demonic powers during his ascension to heaven.

### Ephesians 4:8-10

"He who ascended is the very one who also descended to the lower, earthly regions."

Options:
- "Lower regions" = the realm of the dead (underworld)
- "Lower regions" = the earth itself (the incarnation—descending from heaven to earth)
- "Lower regions" = the grave

### Acts 2:27 / Psalm 16:10

Peter quotes David: "You will not abandon me to the realm of the dead (*Hades*), you will not let your Holy One see decay." Peter applies this to Jesus—his soul was not abandoned in Hades and his body did not decay. This implies Jesus' soul went to Hades but was not left there.

### Luke 23:43

Jesus told the thief on the cross: "Today you will be with me in paradise." This presents a problem for the "descent into hell" view—if Jesus was in paradise that day, he wasn't in hell (as punishment). However, some ancient views held that paradise was a region *within* the realm of the dead, separate from the place of torment (like "Abraham's bosom" in Luke 16:22).

## The Major Theological Interpretations

### 1. The Harrowing of Hell (Catholic/Orthodox Traditional)

Between his death and resurrection, Christ descended to the realm of the dead to liberate the righteous who had died before his coming—Abraham, Moses, David, the prophets. He proclaimed his victory and led them to heaven. This is dramatically depicted in Orthodox iconography, where Christ pulls Adam and Eve from the grave.

**Scriptural support**: 1 Peter 3:18-20, Ephesians 4:8-9, Matthew 27:52-53 (saints rose from tombs)

### 2. Victory Proclamation (Many Evangelicals)

Christ descended not to save anyone but to proclaim his triumph over the demonic powers and the realm of death. Colossians 2:15: "Having disarmed the powers and authorities, he made a public spectacle of them, triumphing over them by the cross."

### 3. Suffering on the Cross (Calvin/Reformed)

Calvin interpreted "he descended into hell" as Christ experiencing the full wrath of God against sin on the cross—a spiritual descent into hell-like suffering, not a geographical journey. The cry "My God, my God, why have you forsaken me?" (Matthew 27:46) was the descent.

### 4. Simply Means He Really Died (Some Protestants)

"Descended into hell" = "descended into the grave." It affirms the reality of Christ's death against any view that he didn't truly die. No journey to an underworld is implied.

## What We Can Affirm

Despite the disagreements, Christians broadly agree on these truths:

1. Jesus truly died a real human death
2. Jesus' death was victorious over sin, death, and the powers of evil
3. Jesus rose bodily on the third day
4. No one who died before Christ is excluded from his saving work—the cross reaches backward as well as forward in history
5. The exact mechanics of what happened between Good Friday and Easter Sunday are less important than the result: Christ conquered death`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed', 'Lutheran'],
    sources: [
      { author: 'Wayne Grudem', title: 'Systematic Theology (Chapter 27)', publisher: 'Zondervan', year: 1994 },
      { author: 'Hans Urs von Balthasar', title: 'Mysterium Paschale', publisher: 'Ignatius Press', year: 1990 },
      { author: 'Matthew Y. Emerson', title: 'He Descended to the Dead: An Evangelical Theology of Holy Saturday', publisher: 'IVP Academic', year: 2019 },
    ],
  },
];

// ============================================================================
// FAQ — Science & Faith
// ============================================================================

const faqScience: LibraryPostSeed[] = [
  {
    domain: 'apologetics',
    areaName: 'Science & Faith',
    tagName: 'Creation',
    title: 'What does the Bible say about dinosaurs?',
    tldr: 'The Bible doesn\'t use the word "dinosaur" (coined in 1842), but it describes creation of all land animals (Genesis 1:24-25) and references large mysterious creatures like "behemoth" (Job 40:15-24) and "leviathan" (Job 41). Christians disagree on the timeline—young-earth creationists believe humans and dinosaurs coexisted; old-earth creationists and evolutionary creationists believe dinosaurs went extinct millions of years before humans. All agree God created all living things.',
    keyPoints: [
      'The word "dinosaur" was invented in 1842 by Richard Owen—the Bible obviously wouldn\'t use a modern scientific term',
      'Genesis 1:24-25 describes God creating "living creatures according to their kinds"—which would include dinosaurs',
      'Job 40:15-24 describes "behemoth" with a "tail like a cedar" and Job 41 describes "leviathan"—some identify these as dinosaurs, others as a hippo/crocodile or mythological imagery',
      'Young-earth creationists (literal 6-day creation ~6,000 years ago) believe humans and dinosaurs coexisted and dinosaurs went extinct after the Flood',
      'Old-earth creationists and evolutionary creationists accept the scientific consensus that dinosaurs went extinct ~66 million years ago and see no conflict with Scripture',
    ],
    scriptureRefs: ['Genesis 1:24-25', 'Job 40:15-24', 'Job 41:1-34', 'Psalm 104:24-26', 'Colossians 1:16', 'Romans 1:20'],
    bodyMarkdown: `Dinosaurs fascinate everyone—especially children who wonder how T. Rex fits into the Bible. The answer depends significantly on how you read Genesis and how you relate Scripture to scientific evidence.

## The Bible and Large Creatures

### Behemoth (Job 40:15-24)

God describes to Job a creature called "behemoth":

> "Look at Behemoth, which I made along with you and which feeds on grass like an ox. What strength it has in its loins, what power in the muscles of its belly! Its tail sways like a cedar; the sinews of its thighs are close-knit. Its bones are tubes of bronze, its limbs like rods of iron."

**Dinosaur interpretation**: The "tail like a cedar" fits a sauropod dinosaur (like Brachiosaurus) far better than a hippo or elephant, whose tails are small. The description of enormous strength and bronze-like bones suggests something beyond any living animal.

**Natural interpretation**: Most Old Testament scholars identify behemoth as a hippopotamus or elephant, with poetic exaggeration. "Tail like a cedar" could metaphorically describe movement, not size. The Hebrew context suggests a known animal.

### Leviathan (Job 41)

God describes a fearsome sea/river creature with armored scales, terrifying teeth, and (possibly) fire-breathing ability. Some identify this as a crocodile (with poetic embellishment), others as a plesiosaur or mythological chaos creature representing the sea.

### What These Texts Tell Us

Whether or not behemoth and leviathan are dinosaurs, Job 40-41 makes a theological point: God created creatures of staggering power and wildness that are beyond human control, demonstrating his sovereignty over all creation.

## The Three Main Christian Views

### Young-Earth Creationism (YEC)

**Position**: God created everything in six literal 24-hour days roughly 6,000-10,000 years ago. Dinosaurs and humans coexisted. Dinosaurs went extinct after the Flood.

**Arguments**:
- Genesis 1 describes literal days (evening and morning)
- Land animals (including dinosaurs) were created on Day 6, same as humans
- Dinosaurs were on Noah's ark (juveniles, not full-grown adults)
- Most went extinct in the post-Flood world due to climate change, reduced food supply, and hunting
- Behemoth and leviathan may be surviving dinosaurs known to Job

**Challenges**: Requires rejecting mainstream geology, paleontology, and radiometric dating. Most scientists (including many Christian scientists) find the evidence for an ancient earth overwhelming.

**Key voices**: Ken Ham (Answers in Genesis), Institute for Creation Research

### Old-Earth Creationism (OEC)

**Position**: God created the universe billions of years ago. The "days" of Genesis are long ages or literary frameworks. Dinosaurs lived and went extinct long before humans, as the fossil record shows.

**Arguments**:
- The Hebrew word *yom* (day) can mean a long period (as in "in the day of the Lord")
- Genesis 1 may be a literary/theological framework, not a scientific chronology
- The fossil record shows dinosaurs thriving for ~165 million years and going extinct ~66 million years ago
- God's creation of diverse life over vast time reflects his creativity and patience
- Science and Scripture both reveal truth—they cannot ultimately contradict

**Key voices**: Hugh Ross (Reasons to Believe), William Lane Craig

### Evolutionary Creationism (EC)

**Position**: God created through the process of evolution over billions of years. Dinosaurs evolved, diversified, and went extinct as part of God's providential governance of creation.

**Arguments**:
- Genesis 1 teaches *that* God created, not *how* (it's theology, not science)
- Evolution is God's method, not a replacement for God
- The fossil record, genetics, and geology all tell a consistent story
- Many faithful Christians throughout history have read Genesis non-literally (Augustine, Origen)

**Key voices**: Francis Collins (BioLogos), Denis Lamoureux, John Walton

## What All Christians Agree On

Regardless of their view on the age of the earth:

1. **God created everything** that exists (Colossians 1:16)
2. **Creation reveals God's glory** (Psalm 19:1, Romans 1:20)
3. **Dinosaurs were part of God's creation**—magnificent creatures that display his creativity and power
4. **The age of the earth is not a salvation issue**—Christians can disagree on this and still be faithful believers
5. **Science and faith are not enemies**—many of history's greatest scientists were devout Christians

## For Parents

When your child asks about dinosaurs and the Bible, the best approach is honesty: "We know God made dinosaurs because he made all living things. Christians disagree about exactly when and how. What we all agree on is that God is the Creator and his creation is amazing."

Curiosity about dinosaurs can be a doorway to wonder about the Creator.`,
    perspectives: ['Catholic', 'Evangelical', 'Reformed', 'Pentecostal'],
    sources: [
      { author: 'John H. Walton', title: 'The Lost World of Genesis One', publisher: 'IVP Academic', year: 2009 },
      { author: 'Hugh Ross', title: 'A Matter of Days', publisher: 'RTB Press', year: 2015 },
      { author: 'Ken Ham', title: 'The New Answers Book 1', publisher: 'Master Books', year: 2006 },
      { author: 'Denis O. Lamoureux', title: 'Evolution: Scripture and Nature Say Yes!', publisher: 'Zondervan', year: 2016 },
    ],
  },
];

// ============================================================================
// FAQ — Modern Questions (continued)
// ============================================================================

const faqModernQuestions2: LibraryPostSeed[] = [
  {
    domain: 'apologetics',
    areaName: 'Modern Questions',
    tagName: 'Christian Living',
    title: 'What does the Bible say about tithing? Should Christians tithe?',
    tldr: 'The Old Testament commanded Israel to tithe (give 10%) of their income. The New Testament does not repeat the 10% command but calls for generous, sacrificial, cheerful giving (2 Corinthians 9:7). Most Christians see 10% as a helpful guideline or starting point, not a legalistic requirement. What matters most is the heart: giving generously, joyfully, and proportionally to what God has provided.',
    keyPoints: [
      'The Old Testament tithe was actually multiple tithes totaling roughly 23% annually—not just 10%',
      'Malachi 3:10 ("Bring the whole tithe into the storehouse") is the most quoted tithing text but was addressed to Old Covenant Israel',
      'Jesus affirmed tithing for Pharisees under the Law (Matthew 23:23) but his emphasis was on justice, mercy, and faithfulness',
      'The New Testament standard is proportional, sacrificial, cheerful giving: "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion" (2 Corinthians 9:7)',
      'The early church practiced radical generosity that went far beyond 10%—selling possessions and sharing with those in need (Acts 2:44-45)',
    ],
    scriptureRefs: ['Malachi 3:10', '2 Corinthians 9:6-7', 'Matthew 23:23', 'Acts 2:44-45', '1 Corinthians 16:2', 'Luke 21:1-4', 'Proverbs 3:9-10', '2 Corinthians 8:1-5'],
    bodyMarkdown: `Money is one of Jesus' most frequent topics—he talked about it more than heaven and hell combined. The question of tithing touches on obedience, generosity, and how we relate to our possessions.

## The Old Testament Tithe

### What Israel Was Required to Give

The Old Testament actually describes multiple tithes:

1. **The Levitical Tithe** (Numbers 18:21-24): 10% to support the Levites (who had no land inheritance)
2. **The Festival Tithe** (Deuteronomy 14:22-27): 10% for annual feasts and celebrations
3. **The Poor Tithe** (Deuteronomy 14:28-29): 10% every third year for the poor, foreigners, orphans, and widows

Combined, this was roughly **23% annually**—significantly more than the "10%" most people think of.

### Malachi 3:10

"Bring the whole tithe into the storehouse, that there may be food in my house. Test me in this, says the LORD Almighty, and see if I will not throw open the floodgates of heaven and pour out so much blessing that there will not be room enough to store it."

This is the most quoted tithing passage. Important context:
- It was addressed to Old Covenant Israel, specifically to priests who were withholding the tithe
- The "storehouse" was the Temple storage for Levitical support
- God's challenge to "test me" is unique—this is the only place God invites testing
- Prosperity gospel preachers often misuse this as a formula for financial blessing

## What Jesus Said

**Matthew 23:23**: "Woe to you, teachers of the law and Pharisees, you hypocrites! You give a tenth of your spices—mint, dill and cumin. But you have neglected the more important matters of the law—justice, mercy and faithfulness. You should have practiced the latter, **without neglecting the former**."

Jesus affirmed tithing for those under the Mosaic Law but emphasized that giving without justice, mercy, and faithfulness is hollow.

**Luke 21:1-4**: Jesus praised the widow who gave two small coins—everything she had. His standard was not a percentage but sacrifice and trust.

## The New Testament Standard

The New Testament never commands a specific percentage. Instead, it establishes principles:

### 1. Give Proportionally
**1 Corinthians 16:2**: "On the first day of every week, each one of you should set aside a sum of money in keeping with your income."

### 2. Give Generously and Cheerfully
**2 Corinthians 9:6-7**: "Whoever sows generously will also reap generously. Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."

### 3. Give Sacrificially
**2 Corinthians 8:1-5**: The Macedonian churches gave "out of the most severe trial" and "beyond their ability"—not because they were wealthy, but because they first gave themselves to the Lord.

### 4. Give to Meet Real Needs
**Acts 2:44-45**: "All the believers were together and had everything in common. They sold property and possessions to give to anyone who had need." The early church's generosity went far beyond 10%.

## So Should Christians Tithe 10%?

### View 1: Yes, the Tithe Continues

Many churches teach that the 10% tithe is a binding principle for Christians:
- The tithe predates the Mosaic Law—Abraham tithed to Melchizedek (Genesis 14:20)
- Jesus affirmed it (Matthew 23:23)
- It provides a concrete, measurable standard
- Most of church history has affirmed the tithe

### View 2: No Specific Percentage, But Give Generously

Other Christians argue:
- The Mosaic tithe system is fulfilled in Christ, like the rest of the ceremonial law
- The New Testament deliberately avoids naming a percentage
- For some people (the poor), 10% is too burdensome; for others (the wealthy), it's too little
- The New Covenant standard—cheerful, sacrificial, proportional giving—may call for more or less than 10%

### View 3: 10% as a Starting Point

Many pastors suggest a practical middle ground: use 10% as a guideline and starting point, then grow in generosity from there. The goal is not legalistic compliance with a number but a heart of generosity that reflects God's generosity to us.

## Practical Wisdom

1. **Give something**: Whatever your theology of tithing, giving nothing is not an option for a follower of Jesus
2. **Give first**: Don't give from leftovers; set aside giving before other expenses (Proverbs 3:9)
3. **Give to your local church**: Your church community is the primary context for Christian life and should be the primary recipient of your giving
4. **Give beyond your church**: Support missions, the poor, disaster relief, and other causes
5. **Give cheerfully**: If you give begrudgingly, work on your heart before your wallet
6. **Don't give to get**: Tithing is not a slot machine. God promises to provide, but "prosperity gospel" formulas distort the biblical message`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed', 'Pentecostal', 'Protestant'],
    sources: [
      { author: 'Randy Alcorn', title: 'The Treasure Principle', publisher: 'Multnomah', year: 2001 },
      { author: 'David A. Croteau', title: 'Perspectives on Tithing: Four Views', publisher: 'B&H Academic', year: 2011 },
      { author: 'Craig L. Blomberg', title: 'Neither Poverty nor Riches', publisher: 'IVP Academic', year: 1999 },
    ],
  },
  {
    domain: 'apologetics',
    areaName: 'Modern Questions',
    tagName: 'Christian Living',
    title: 'Is drinking alcohol a sin? What does the Bible say about alcohol?',
    tldr: 'The Bible does not prohibit alcohol—Jesus turned water into wine (John 2:1-11) and instituted the Lord\'s Supper with wine (Matthew 26:29). However, Scripture consistently condemns drunkenness (Ephesians 5:18, Proverbs 20:1) and warns about alcohol\'s dangers. The biblical position is that moderate drinking is permitted but not required, drunkenness is sin, and those who choose to abstain are exercising valid wisdom.',
    keyPoints: [
      'Jesus drank wine and his first miracle was turning water into wine at a wedding (John 2:1-11)—this was real wine, not grape juice',
      'Paul told Timothy to "use a little wine for your stomach" (1 Timothy 5:23), showing moderate drinking was acceptable',
      'Drunkenness is consistently condemned: "Do not get drunk on wine, which leads to debauchery" (Ephesians 5:18)',
      'Proverbs 20:1 warns: "Wine is a mocker and beer a brawler; whoever is led astray by them is not wise"',
      'Romans 14:21 says it\'s better not to drink if it causes a weaker brother to stumble—liberty must be governed by love',
    ],
    scriptureRefs: ['John 2:1-11', 'Ephesians 5:18', 'Proverbs 20:1', '1 Timothy 5:23', 'Romans 14:21', 'Psalm 104:14-15', 'Matthew 26:29', 'Proverbs 23:29-35'],
    bodyMarkdown: `This question generates strong feelings. Some Christians see any alcohol consumption as sinful; others enjoy wine with dinner without a second thought. What does the Bible actually say?

## The Bible Is Not Prohibitionist

### Positive References to Wine

**Psalm 104:14-15**: God gives "wine that gladdens human hearts." Wine is presented as one of God's good gifts.

**Ecclesiastes 9:7**: "Go, eat your food with gladness, and drink your wine with a joyful heart, for God has already approved what you do."

**John 2:1-11**: Jesus' first miracle was turning water into wine at a wedding—and it was excellent wine (the master of the banquet praised its quality). If drinking wine were sinful, Jesus would not have provided it.

**Matthew 26:29**: Jesus drank wine at the Last Supper and said he would drink it again "in my Father's kingdom."

**1 Timothy 5:23**: Paul advised Timothy: "Stop drinking only water, and use a little wine because of your stomach and your frequent illnesses."

### Was It Really Alcoholic Wine?

Some have argued that biblical "wine" was just grape juice. This is historically unsustainable:
- Ancient wine was fermented—that's why the Bible warns about drunkenness
- The Greek word *oinos* consistently means fermented wine in ancient literature
- Jesus was accused of being a "drunkard" (Matthew 11:19)—you can't be accused of drunkenness from grape juice
- At the wedding in Cana, the master noted people usually serve cheaper wine after guests are drunk (John 2:10)—this only makes sense with alcoholic wine

## The Bible Strongly Condemns Drunkenness

While moderate drinking is permitted, **drunkenness is clearly sinful**:

**Ephesians 5:18**: "Do not get drunk on wine, which leads to debauchery. Instead, be filled with the Spirit."

**Proverbs 23:29-35**: A vivid warning about the consequences of excess drinking—"Who has woe? Who has sorrow?... Those who linger over wine."

**Proverbs 20:1**: "Wine is a mocker and beer a brawler; whoever is led astray by them is not wise."

**Galatians 5:19-21**: "Drunkenness" is listed among the "acts of the flesh" alongside sexual immorality and idolatry.

**1 Corinthians 6:10**: "Drunkards" are listed among those who will not inherit the kingdom of God.

The line between moderate drinking and drunkenness is important. The Bible treats alcohol like many good things—food, sex, money—that become sinful when misused or turned into idols.

## The Principle of Love and Conscience

**Romans 14:21**: "It is better not to eat meat or drink wine or to do anything else if it will cause your brother or sister to fall."

Even when something is permissible, love for others may call us to abstain:
- Don't drink around a recovering alcoholic
- Don't flaunt your freedom in a community where it would cause stumbling
- Don't pressure others to drink
- Be sensitive to cultural contexts where alcohol carries different baggage

**Romans 14:22-23**: "Whatever you believe about these things keep between yourself and God... everything that does not come from faith is sin." If your conscience condemns drinking, don't drink.

## Valid Reasons to Abstain

The Bible permits alcohol but does not require it. There are excellent reasons to choose abstinence:

1. **Family history of alcoholism**: If addiction runs in your family, wisdom says avoid the risk
2. **Personal struggle**: If you can't stop at one drink, don't start
3. **Ministry context**: Some ministry settings are best served by abstinence
4. **Cultural witness**: In some communities, abstinence is a more powerful testimony
5. **Health reasons**: Legitimate medical reasons to avoid alcohol
6. **Personal conviction**: If the Spirit leads you to abstain, obey

## The Balanced Position

The biblical view avoids two extremes:

**Legalism** (all drinking is sinful): This goes beyond what Scripture teaches and adds a commandment God didn't give. It also puts Christians in the awkward position of condemning Jesus' own behavior.

**License** (drinking without limits): This ignores the Bible's clear warnings about drunkenness and the real dangers of alcohol abuse, addiction, and destruction.

The biblical position: **Freedom with responsibility, governed by love.** You may drink moderately with gratitude. You must never get drunk. You should always consider how your choices affect others.`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed', 'Baptist', 'Protestant'],
    sources: [
      { author: 'Kenneth L. Gentry Jr.', title: 'God Gave Wine', publisher: 'Oakdown Books', year: 2001 },
      { author: 'Norman L. Geisler', title: 'A Christian Perspective on Wine Drinking', publisher: 'Dallas Theological Seminary', year: 1982 },
      { author: 'Daniel B. Wallace', title: 'The Bible and Alcohol', year: 2004, url: 'https://bible.org' },
    ],
  },
  {
    domain: 'apologetics',
    areaName: 'Modern Questions',
    tagName: 'Christian Living',
    title: 'Is gambling a sin? What does the Bible say about gambling?',
    tldr: 'The Bible never directly mentions gambling, lottery tickets, or betting. However, several biblical principles apply: love of money is dangerous (1 Timothy 6:10), get-rich-quick schemes are foolish (Proverbs 13:11), stewardship of resources matters, and exploiting the poor is condemned. Most Christian traditions discourage gambling—especially habitual or high-stakes gambling—while acknowledging the Bible doesn\'t explicitly prohibit it.',
    keyPoints: [
      'The Bible does not mention gambling by name—there is no "thou shalt not gamble" command',
      'Casting lots was practiced in the Bible (Proverbs 16:33, Acts 1:26) but was a method of seeking God\'s will, not a wager for profit',
      '1 Timothy 6:9-10 warns that the desire to get rich leads to "ruin and destruction"—gambling thrives on this desire',
      'Proverbs 13:11 says "wealth gained hastily will dwindle, but whoever gathers little by little will increase it"',
      'The gambling industry disproportionately harms the poor—Christians are called to protect the vulnerable, not exploit them',
    ],
    scriptureRefs: ['1 Timothy 6:9-10', 'Proverbs 13:11', 'Proverbs 28:20', 'Luke 12:15', 'Hebrews 13:5', 'Proverbs 16:33', 'Matthew 25:14-30'],
    bodyMarkdown: `Gambling is a massive global industry—casinos, lotteries, sports betting, online poker—and Christians want to know where the Bible draws the line. The answer requires applying biblical principles since the Bible doesn't address gambling directly.

## What the Bible Does NOT Say

There is no verse that says "gambling is a sin." The Bible doesn't mention casinos, lotteries, or betting. This means we must reason from principles rather than proof-texts.

### Casting Lots in the Bible

The Bible records the use of lots (a form of random chance) multiple times:

- **Proverbs 16:33**: "The lot is cast into the lap, but its every decision is from the LORD"
- **Acts 1:26**: The apostles cast lots to choose Matthias to replace Judas
- **Jonah 1:7**: Sailors cast lots to determine who caused the storm

However, lot-casting in the Bible was used to discern God's will or make fair decisions—not to win money at others' expense. It's a different category from recreational gambling.

## Biblical Principles That Apply

### 1. The Love of Money

**1 Timothy 6:9-10**: "Those who want to get rich fall into temptation and a trap and into many foolish and harmful desires that plunge people into ruin and destruction. For the love of money is a root of all kinds of evil."

Gambling is fundamentally driven by the desire for quick financial gain. The lure of hitting the jackpot appeals to exactly the impulse Paul warns against.

### 2. Get-Rich-Quick Warnings

**Proverbs 13:11**: "Dishonest money dwindles away, but whoever gathers money little by little makes it grow." (Some translations: "Wealth gained hastily will dwindle.")

**Proverbs 28:20**: "A faithful person will be richly blessed, but one eager to get rich will not go unpunished."

**Proverbs 28:22**: "The stingy are eager to get rich and are unaware that poverty awaits them."

The biblical model for financial provision is honest work, wise stewardship, and patient accumulation—the opposite of gambling's promise of instant wealth.

### 3. Stewardship

**Matthew 25:14-30** (Parable of the Talents): God entrusts us with resources and expects us to use them wisely. Gambling—where the mathematical odds ensure that most participants lose money over time—is arguably poor stewardship.

The house always wins. Lotteries return roughly 50 cents per dollar; casinos are designed to take your money. Calling this "entertainment" has limits when family budgets are at stake.

### 4. Contentment

**Hebrews 13:5**: "Keep your lives free from the love of money and be content with what you have."

**Luke 12:15**: Jesus said, "Watch out! Be on your guard against all kinds of greed; life does not consist in an abundance of possessions."

Gambling thrives on discontentment—the feeling that what you have isn't enough and that a windfall would solve your problems.

### 5. Concern for the Vulnerable

**Proverbs 14:31**: "Whoever oppresses the poor shows contempt for their Maker."

The gambling industry disproportionately harms the poor and vulnerable. Studies consistently show that lower-income people spend a higher percentage of their income on lottery tickets and gambling. State lotteries have been called "a tax on the poor." Christians should be concerned about systems that exploit vulnerable people.

## What About Friendly Bets and Office Pools?

Many Christians distinguish between:

- **Casual, small-stakes entertainment** (a $5 Super Bowl pool, a friendly poker game): Low risk, social bonding, no exploitation
- **Habitual gambling**: A pattern that consumes time, money, and mental energy
- **High-stakes or addictive gambling**: Risking money you can't afford to lose, chasing losses, hiding the behavior

The first category is a gray area where Christians can exercise judgment. The latter categories raise serious concerns about addiction, stewardship, and idolatry.

## The Addiction Factor

Gambling addiction is real and devastating. It destroys families, finances, and lives. The same brain pathways activated by drugs and alcohol are triggered by gambling. If you or someone you know struggles with gambling addiction:

- The National Problem Gambling Helpline: 1-800-522-4700
- Many churches offer recovery programs
- Gamblers Anonymous provides peer support

## A Practical Framework

Ask yourself these questions:
1. **Can I afford to lose this money?** If not, don't gamble it
2. **Am I gambling out of contentment or discontentment?** Check your motive
3. **Is this controlling me?** If you can't stop, it's a problem
4. **Am I being a good steward?** Would I be comfortable telling God how I spent this money?
5. **Is this hurting anyone?** Including your family's financial security
6. **Am I modeling wisdom?** What does this teach my children?`,
    perspectives: ['Catholic', 'Evangelical', 'Reformed', 'Protestant', 'Baptist'],
    sources: [
      { author: 'John Piper', title: 'Desiring God: Thoughts on Gambling', publisher: 'Desiring God Ministries', year: 2016 },
      { author: 'Rex M. Rogers', title: 'Gambling: Don\'t Bet on It', publisher: 'Kregel', year: 2005 },
      { author: 'Earl L. Grinols', title: 'Gambling in America: Costs and Benefits', publisher: 'Cambridge University Press', year: 2004 },
    ],
  },
  {
    domain: 'apologetics',
    areaName: 'Modern Questions',
    tagName: 'Sexuality & Ethics',
    title: 'Is sex before marriage a sin? What does the Bible say about premarital sex?',
    tldr: 'The Bible consistently reserves sexual intimacy for the marriage covenant between husband and wife. The Greek word porneia (sexual immorality) in the New Testament encompasses all sexual activity outside marriage, including premarital sex. While modern culture treats sex as casual, the biblical view sees it as a covenant act that bonds two people together (Genesis 2:24, 1 Corinthians 6:16). Christians across all major traditions agree on this teaching.',
    keyPoints: [
      'The Greek word porneia (translated "sexual immorality" or "fornication") is consistently condemned in the New Testament and encompasses premarital sex (1 Corinthians 6:18, Galatians 5:19, 1 Thessalonians 4:3)',
      'Genesis 2:24 establishes the pattern: "a man leaves his father and mother and is united to his wife, and they become one flesh"—sexual union within marriage',
      'Every positive portrayal of sex in the Bible (Song of Solomon, Proverbs 5:18-19, Hebrews 13:4) is within the context of marriage',
      '1 Corinthians 7:2 addresses sexual temptation by recommending marriage, implying sex outside marriage is the problem being solved',
      'This is one of the few sexual ethics questions where Catholic, Orthodox, Evangelical, and mainline Protestant churches broadly agree',
    ],
    scriptureRefs: ['1 Corinthians 6:18-20', '1 Thessalonians 4:3-5', 'Hebrews 13:4', 'Genesis 2:24', 'Galatians 5:19', '1 Corinthians 7:2', 'Song of Solomon 2:7', 'Ephesians 5:3'],
    bodyMarkdown: `In a culture where premarital sex is the norm, the Christian teaching on sexual purity can seem impossibly countercultural. But understanding why the Bible teaches what it does—not just the rule but the reason—makes a significant difference.

## What the Bible Teaches

### The Foundation: Sex Within Covenant

**Genesis 2:24**: "That is why a man leaves his father and mother and is united to his wife, and they become one flesh."

This is the foundational biblical statement about sex. Note the order: leaving, uniting (covenant commitment), then becoming one flesh (sexual union). Jesus quoted this verse as authoritative (Matthew 19:5), as did Paul (Ephesians 5:31).

### Porneia: The New Testament Term

The Greek word *porneia* (from which we get "pornography") appears 25 times in the New Testament. It is translated as "sexual immorality" or "fornication" and is consistently condemned:

- **1 Corinthians 6:18**: "Flee from sexual immorality (*porneia*)"
- **Galatians 5:19**: *Porneia* is listed first among the "acts of the flesh"
- **1 Thessalonians 4:3**: "God's will is your sanctification: that you abstain from sexual immorality (*porneia*)"
- **Ephesians 5:3**: "Among you there must not be even a hint of sexual immorality (*porneia*)"

In its Jewish and early Christian context, *porneia* referred to any sexual activity outside the marriage covenant—including premarital sex, adultery, prostitution, and incest. This is well-established in both Jewish and Greco-Roman usage of the term.

### Marriage Honors Sex

**Hebrews 13:4**: "Marriage should be honored by all, and the marriage bed kept pure, for God will judge the adulterer and all the sexually immoral."

**1 Corinthians 7:2**: "Since sexual immorality is occurring, each man should have sexual relations with his own wife, and each woman with her own husband."

Paul's solution to sexual temptation is marriage—implying that sex outside marriage is the problem being addressed.

## Why Does the Bible Teach This?

The biblical sexual ethic isn't arbitrary. It reflects deep truths about sex, relationships, and human flourishing:

### 1. Sex Creates a Bond

**1 Corinthians 6:16**: "Do you not know that he who unites himself with a prostitute is one with her in body? For it is said, 'The two will become one flesh.'"

Sex is not merely physical—it creates a spiritual and emotional bond. Modern neuroscience confirms this: oxytocin and vasopressin (bonding hormones) are released during sexual activity, creating attachment. Repeatedly bonding and breaking these connections causes real psychological harm.

### 2. Covenant Provides Safety

Marriage creates a context of commitment, trust, and permanence in which sexual vulnerability is safe. Sex involves exposing yourself completely to another person. The marriage covenant says, "I commit to you permanently before God and community." Without that commitment, vulnerability carries significant emotional risk.

### 3. Children Deserve Stability

Sex can produce children. The marriage covenant provides the stable, committed context that children need. While single parents can be excellent parents, the biblical design is for children to be raised by committed parents.

### 4. Sex Reflects the Gospel

**Ephesians 5:31-32**: Paul quotes Genesis 2:24 about marriage and then says, "This is a profound mystery—but I am talking about Christ and the church." Sexual union within marriage is an image of Christ's faithful, exclusive, permanent love for his people. Casual sex distorts this picture.

## What About "We're Basically Married"?

Some couples who are engaged or living together argue they are effectively married. But the Bible distinguishes between commitment (covenant) and cohabitation. Public, permanent commitment before God and community is what makes marriage—not just living together or planning to marry eventually.

## Grace for Those Who Have Fallen Short

If you've already had sex outside marriage, hear this clearly:

1. **You are not damaged goods**: Your value is not determined by your sexual history. You are made in God's image and loved unconditionally.
2. **Forgiveness is real**: "If we confess our sins, he is faithful and just to forgive us" (1 John 1:9). There is no sin that disqualifies you from God's grace.
3. **You can start over**: Sexual purity is not about being a virgin. It's about honoring God with your body from this point forward. Every day is a fresh start.
4. **Shame is not from God**: Conviction says "I did something wrong and I can change." Shame says "I am wrong and I can't change." God brings conviction; the enemy brings shame.

## Practical Wisdom for Singles

1. **Set boundaries early**: Decide your physical limits before the heat of the moment
2. **Avoid compromising situations**: Being alone late at night with someone you're attracted to tests your willpower unnecessarily
3. **Find accountability**: A trusted friend or mentor who can ask honest questions
4. **Remember the why**: You're not avoiding sex because it's dirty—you're saving it because it's sacred
5. **Trust God's timing**: Singleness is not a waiting room for marriage. It's a season with its own calling and gifts (1 Corinthians 7:7-8)`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed', 'Protestant', 'Pentecostal'],
    sources: [
      { author: 'Timothy Keller', title: 'The Meaning of Marriage', publisher: 'Dutton', year: 2011 },
      { author: 'Denny Burk', title: 'What Is the Meaning of Sex?', publisher: 'Crossway', year: 2013 },
      { author: 'Juli Slattery', title: 'Rethinking Sexuality', publisher: 'Multnomah', year: 2018 },
    ],
  },
  {
    domain: 'apologetics',
    areaName: 'Modern Questions',
    tagName: 'Marriage',
    title: 'What does the Bible say about divorce and remarriage?',
    tldr: 'Jesus taught that God\'s design is lifelong marriage and that divorce was permitted in the Old Testament because of "hardness of heart" (Matthew 19:8). He allowed an exception for sexual immorality (Matthew 5:32, 19:9). Paul added that if an unbelieving spouse leaves, the believer is "not bound" (1 Corinthians 7:15). Christians disagree on whether remarriage is permitted after divorce. All agree that marriage is sacred, divorce is grievous, and divorced people need grace rather than judgment.',
    keyPoints: [
      'Jesus said God\'s original design is permanent marriage: "What God has joined together, let no one separate" (Matthew 19:6)',
      'Jesus allowed one exception: "anyone who divorces his wife, except for sexual immorality (porneia), and marries another woman commits adultery" (Matthew 19:9)',
      'Paul added the "Pauline privilege": if an unbelieving spouse leaves, the believer "is not bound" (1 Corinthians 7:15)',
      'The Catholic Church teaches that valid marriages are indissoluble; the annulment process determines if a valid marriage existed',
      'Most Protestant churches permit divorce in cases of adultery, abandonment, and (increasingly) abuse, with remarriage allowed for the innocent party',
    ],
    scriptureRefs: ['Matthew 19:3-9', 'Matthew 5:31-32', '1 Corinthians 7:10-15', 'Malachi 2:16', 'Mark 10:2-12', 'Deuteronomy 24:1-4', 'Romans 7:2-3'],
    bodyMarkdown: `Divorce is one of the most painful realities in the church. Nearly half of marriages end in divorce—including Christian marriages. People need biblical guidance that is honest about God's design and compassionate toward those in broken situations.

## God's Design: Permanent Marriage

**Matthew 19:4-6**: Jesus said, "Haven't you read that at the beginning the Creator 'made them male and female,' and said, 'For this reason a man will leave his father and mother and be united to his wife, and the two will become one flesh'? So they are no longer two, but one flesh. Therefore what God has joined together, let no one separate."

**Malachi 2:16**: "The man who hates and divorces his wife... does violence to the one he should protect" (CSB). [Note: the traditional KJV translation "God hates divorce" is disputed in modern translations, but the sentiment is clear—divorce is grievous to God.]

The starting point for any discussion of divorce must be: God designed marriage to last a lifetime. Divorce is always a tragedy, never a triumph. It always involves broken promises, broken trust, and broken hearts.

## The Exception Clauses

### Jesus' Exception: Sexual Immorality

**Matthew 19:9**: "I tell you that anyone who divorces his wife, except for sexual immorality (*porneia*), and marries another woman commits adultery."

This is called the "Matthean exception clause." It appears in Matthew 5:32 and 19:9 but not in Mark 10:11-12 or Luke 16:18, which state the prohibition without exception. The debate:

- **Broad reading**: *Porneia* includes adultery, pornography addiction, and persistent sexual sin
- **Narrow reading**: *Porneia* here means something specific—perhaps premarital unfaithfulness discovered after marriage (betrothal unfaithfulness)
- **Catholic reading**: The exception refers to invalid marriages (unions within prohibited degrees of kinship), not divorce from a valid marriage

### Paul's Exception: Abandonment by an Unbeliever

**1 Corinthians 7:15**: "But if the unbeliever leaves, let it be so. The brother or the sister is not bound in such circumstances; God has called us to live in peace."

This "Pauline privilege" addresses mixed marriages where the non-Christian spouse abandons the marriage. "Not bound" (*ou dedoulotai*) likely means freed from the marriage obligation—though some restrict this to freedom from the duty to pursue reconciliation.

### What About Abuse?

The Bible does not explicitly address divorce for domestic abuse, which creates a difficult pastoral question. However, many scholars and pastors argue:

- Abuse is a form of abandonment—violating the marriage covenant through violence
- The principle of 1 Corinthians 7:15 ("God has called us to live in peace") applies
- Protecting the safety of a spouse and children takes priority over maintaining a legal marriage
- "What God has joined together" assumes a genuine covenant—abuse is a fundamental breach

Most evangelical churches today recognize abuse as grounds for separation and, often, divorce.

## The Question of Remarriage

### Catholic Position

A valid, consummated sacramental marriage is indissoluble. Divorce (civil) may be tolerated for serious reasons, but remarriage is not permitted while the first spouse lives. The annulment process determines whether a valid marriage existed in the first place.

### Orthodox Position

The Orthodox Church acknowledges that marriages can "die" and permits divorce and remarriage (up to three times), though second marriages involve a penitential rite acknowledging the failure of the first.

### Protestant Positions

- **Conservative**: Remarriage is permitted only for the innocent party in cases of adultery or abandonment. The guilty party should not remarry
- **Moderate**: Remarriage is permitted after legitimate divorce (adultery, abandonment, abuse), with pastoral counsel and evidence of repentance
- **Strict**: No remarriage is permitted while the first spouse lives (based on Mark 10:11-12 and Romans 7:2-3)

## Pastoral Wisdom

### For Those Considering Divorce

1. **Exhaust every option first**: Counseling, pastoral support, separation with intention to reconcile
2. **Protect safety**: If there is abuse, physical safety comes first. Separation is not the same as divorce
3. **Seek wise counsel**: Don't make this decision alone or in the heat of emotion
4. **Grieve honestly**: Divorce is a death. Treat it with appropriate gravity

### For Those Already Divorced

1. **You are not a second-class Christian**: Divorce is sin (when wrongful) or tragedy (when unavoidable), but it is not the unforgivable sin
2. **Grace is real**: God specializes in redemption. He can bring beauty from ashes
3. **Take time to heal**: Don't rush into another relationship. Process the grief, learn from the experience, and allow God to do his work
4. **The church should welcome you**: If your church treats divorced people as outcasts, that church has failed to understand the gospel

### For the Church

The church must hold two things simultaneously:
- **The high standard**: Marriage is sacred, permanent, and worth fighting for. We should never treat divorce casually
- **Radical grace**: Divorced people are among the most hurting people in our congregations. They need compassion, not condemnation. Jesus reserved his harshest words for the self-righteous, not for the broken`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed', 'Protestant'],
    sources: [
      { author: 'David Instone-Brewer', title: 'Divorce and Remarriage in the Bible', publisher: 'Eerdmans', year: 2002 },
      { author: 'Craig S. Keener', title: 'And Marries Another: Divorce and Remarriage in the Teaching of the New Testament', publisher: 'Baker Academic', year: 1991 },
      { author: 'Andrew Cornes', title: 'Divorce and Remarriage: Biblical Principles and Pastoral Practice', publisher: 'Mentor', year: 2002 },
    ],
  },
];

// ============================================================================
// ADDITIONAL PRESSING QUESTIONS — High-demand topics not in top 20
// ============================================================================

const faqAdditional: LibraryPostSeed[] = [
  {
    domain: 'apologetics',
    areaName: 'Modern Questions',
    tagName: 'Mental Health',
    title: 'What does the Bible say about anxiety and mental health?',
    tldr: 'The Bible takes anxiety seriously—it does not dismiss it as a lack of faith. Scripture records godly people who struggled with depression (Elijah), anxiety (David), and despair (Jeremiah). Jesus himself experienced anguish in Gethsemane (Luke 22:44). The Bible offers spiritual resources (prayer, trust, community) while never suggesting these replace professional mental health care. Faith and therapy are allies, not competitors.',
    keyPoints: [
      'Philippians 4:6-7 says "do not be anxious about anything" but follows it with a prescription: prayer, petition, and thanksgiving—it\'s an invitation to bring anxiety to God, not a rebuke',
      'David wrote psalms of deep anguish: "Why, my soul, are you downcast? Why so disturbed within me?" (Psalm 42:5)—honest expression of mental distress',
      'Elijah experienced suicidal depression after his greatest victory (1 Kings 19:4) and God responded with rest, food, and presence—not rebuke',
      'Jesus experienced severe anxiety in Gethsemane: "his sweat was like drops of blood" (Luke 22:44)—anxiety is not sinful',
      'Mental illness is a medical condition that can be treated. Seeking professional help is wisdom (Proverbs 12:15), not weakness or faithlessness',
    ],
    scriptureRefs: ['Philippians 4:6-7', 'Psalm 42:5-6', '1 Kings 19:4-8', 'Luke 22:44', '1 Peter 5:7', 'Matthew 11:28-30', 'Psalm 34:17-18', 'Proverbs 12:15'],
    bodyMarkdown: `Mental health is one of the most important conversations the church needs to have. Too many Christians have been told their anxiety or depression is simply "a lack of faith." This is not what the Bible teaches.

## The Bible Takes Mental Suffering Seriously

### David: The Anxious Psalmist

Many psalms express raw emotional anguish:

**Psalm 42:5-6**: "Why, my soul, are you downcast? Why so disturbed within me?" David doesn't hide his internal distress—he brings it before God in brutal honesty.

**Psalm 38:4, 6**: "My guilt has overwhelmed me like a burden too heavy to bear... I am bowed down and brought very low; all day long I go about mourning."

**Psalm 88** is the darkest psalm—it ends without resolution, without hope, without a happy conclusion. It simply says: "darkness is my closest friend" (v.18). The fact that God included this psalm in Scripture validates the experience of those who see no light at the end of the tunnel.

### Elijah: Depression After Victory

1 Kings 19 tells a remarkable story. After his greatest spiritual victory (defeating the prophets of Baal on Mount Carmel), Elijah collapsed into suicidal despair:

**1 Kings 19:4**: "He came to a broom bush, sat down under it and prayed that he might die. 'I have had enough, LORD,' he said. 'Take my life.'"

God's response is instructive. He did not:
- Rebuke Elijah for lack of faith
- Tell him to "just pray harder"
- Quote Scripture at him
- Tell him to snap out of it

Instead, God:
- Let him sleep (physical rest)
- Sent an angel with food and water (physical nourishment)
- Let him sleep again (more rest)
- Then gently engaged him (emotional/spiritual care)

God treated Elijah's depression as a whole-person condition requiring physical, emotional, and spiritual care.

### Jesus: Anguish in Gethsemane

**Luke 22:44**: "Being in anguish, he prayed more earnestly, and his sweat was like drops of blood falling to the ground."

**Matthew 26:38**: "My soul is overwhelmed with sorrow to the point of death."

If the sinless Son of God experienced severe anxiety and emotional anguish, then anxiety is not a sign of spiritual failure. It is part of the human experience in a broken world.

## What Philippians 4:6-7 Actually Says

"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus."

This is one of the most quoted—and most misused—verses about anxiety. It is NOT saying:

- "If you're anxious, you're sinning"
- "Just pray and your anxiety will disappear"
- "Christians shouldn't need therapy or medication"

It IS saying:

- Bring your anxiety to God instead of carrying it alone
- Prayer is a resource, not a magic formula
- God's peace can coexist with difficult circumstances ("transcends understanding"—it doesn't always make logical sense)

## Faith AND Professional Help

### The Bible Supports Seeking Help

**Proverbs 12:15**: "The way of fools seems right to them, but the wise listen to advice."

**Proverbs 11:14**: "Where there is no guidance, a people falls, but in an abundance of counselors there is safety."

If you had a broken leg, you wouldn't "just pray about it"—you'd go to a doctor. Mental health conditions deserve the same practical wisdom. Therapy and medication are tools God uses, just as he uses surgeons and antibiotics.

### What Professional Help Looks Like

- **Therapy/Counseling**: Cognitive behavioral therapy (CBT), EMDR, and other evidence-based approaches can be tremendously effective
- **Medication**: Antidepressants and anti-anxiety medication correct chemical imbalances in the brain. Taking them is no more a sign of weak faith than taking insulin for diabetes
- **Pastoral counseling**: For spiritual dimensions of mental health, a trained pastor can complement professional therapy
- **Community**: Isolation worsens mental health. Connection with others—church, support groups, friends—is therapeutic

## What the Church Should Do

1. **Stop stigmatizing mental illness**: Depression is not demon possession. Anxiety is not faithlessness. PTSD is not spiritual weakness.
2. **Create safe spaces**: People should be able to say "I'm struggling" without being told they just need to pray more
3. **Refer to professionals**: Pastors are not therapists. Good pastoral care includes knowing when to refer
4. **Check on each other**: "Bear one another's burdens" (Galatians 6:2) includes mental and emotional burdens
5. **Lament together**: The church should be a community where grief, fear, and pain can be expressed honestly

## If You're Struggling Right Now

- You are not weak. You are not faithless. You are human.
- God is not disappointed in you. He is "close to the brokenhearted" (Psalm 34:18)
- It is okay to get help. It is wise to get help.
- You are not alone—many of the greatest saints struggled with what we now call mental illness
- **Crisis resources**: 988 Suicide and Crisis Lifeline (call or text 988), Crisis Text Line (text HOME to 741741)`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed', 'Protestant', 'Pentecostal'],
    sources: [
      { author: 'Matthew Stanford', title: 'Grace for the Afflicted: A Clinical and Biblical Perspective on Mental Illness', publisher: 'IVP', year: 2008 },
      { author: 'Edward T. Welch', title: 'Running Scared: Fear, Worry, and the God of Rest', publisher: 'New Growth Press', year: 2007 },
      { author: 'Kathryn Greene-McCreight', title: 'Darkness Is My Only Companion: A Christian Response to Mental Illness', publisher: 'Brazos Press', year: 2006 },
    ],
  },
  {
    domain: 'apologetics',
    areaName: 'Theology',
    tagName: 'Core Doctrine',
    title: 'What is the unforgivable sin? What is blasphemy against the Holy Spirit?',
    tldr: 'Jesus said "every kind of sin and slander can be forgiven, but blasphemy against the Spirit will not be forgiven" (Matthew 12:31). In context, the Pharisees had attributed Jesus\' miracles (done by the Holy Spirit) to Satan. Most theologians understand this as a persistent, deliberate, fully-informed rejection of God\'s saving work—not a one-time sin committed in ignorance or weakness. If you\'re worried you\'ve committed it, you almost certainly haven\'t—the very concern shows a heart still responsive to God.',
    keyPoints: [
      'Jesus spoke this in response to Pharisees who said his miracles were powered by Satan/Beelzebul (Matthew 12:24-32)',
      'The sin is not a single thoughtless word but a settled, deliberate, fully-informed rejection of what you know to be the Holy Spirit\'s work',
      'It is unforgivable not because God can\'t forgive it, but because the person in this state has permanently hardened themselves against the very means of forgiveness',
      'If you are worried about having committed it, that worry itself is evidence you have not—someone who has fully rejected the Spirit would feel no concern',
      'Throughout history, pastors have consistently counseled anxious Christians: your fear of having committed this sin is proof that you haven\'t',
    ],
    scriptureRefs: ['Matthew 12:31-32', 'Mark 3:28-30', 'Luke 12:10', 'Hebrews 6:4-6', 'Hebrews 10:26-29', '1 John 1:9', '1 John 5:16'],
    bodyMarkdown: `Few Bible passages cause more anxiety than Jesus' warning about the "unforgivable sin." Christians throughout history have worried they might have committed it. Let's look carefully at what Jesus actually said and what he meant.

## The Context: Matthew 12:22-32

Jesus healed a demon-possessed man who was blind and mute. The crowds were amazed and wondered if Jesus was the Messiah. But the Pharisees said: **"It is only by Beelzebul, the prince of demons, that this fellow drives out demons"** (Matthew 12:24).

Jesus responded with logical arguments (a house divided against itself cannot stand) and then delivered this warning:

**Matthew 12:31-32**: "And so I tell you, every kind of sin and slander can be forgiven, but blasphemy against the Spirit will not be forgiven. Anyone who speaks a word against the Son of Man will be forgiven, but anyone who speaks against the Holy Spirit will not be forgiven, either in this age or in the age to come."

**Mark 3:30** explicitly identifies what prompted this: "He said this because they were saying, 'He has an impure spirit.'"

## What IS the Unforgivable Sin?

Based on the context, the blasphemy against the Holy Spirit was:

1. **Witnessing** the clear work of God's Spirit firsthand
2. **Recognizing** it for what it was (the Pharisees were educated religious leaders who knew the Scriptures)
3. **Deliberately attributing** it to Satan—calling good evil and evil good
4. **Hardening** themselves against the only means of salvation

This was not ignorance. This was not a moment of weakness. This was a calculated, informed, persistent rejection of divine truth by people who should have known better.

### Why It's Unforgivable

The sin is unforgivable not because it exceeds God's capacity to forgive, but because it represents a condition in which forgiveness becomes impossible from the human side:

- The Holy Spirit is the one who convicts of sin, draws people to Christ, and enables repentance
- To permanently and deliberately reject the Spirit's work is to cut yourself off from the very means of salvation
- It's like destroying the only bridge across a chasm and then asking why you can't cross

Think of it as spiritual suicide—not a sin God won't forgive, but a state from which the person will never seek forgiveness.

## What It Is NOT

### It's Not a One-Time Sin

The Greek verb tense in Mark 3:30 (*elegon*—they "were saying") suggests ongoing, persistent action—not a single utterance. This was a settled disposition, not a momentary lapse.

### It's Not Cursing or Angry Words

Peter denied Jesus three times with curses (Matthew 26:74). He was forgiven and became the leader of the church. Paul persecuted Christians and "blasphemed" (1 Timothy 1:13). He was forgiven and became the greatest apostle. If profanity, denial, or even persecution can be forgiven, then angry words spoken in ignorance are not the unforgivable sin.

### It's Not Doubt or Struggling Faith

Thomas doubted the resurrection (John 20:25). He was not condemned—Jesus invited him to touch his wounds. Doubt is not blasphemy. Struggling faith is still faith.

### It's Not Any Specific Sin

It's not adultery, murder, addiction, or any particular moral failure. David committed adultery and murder and was forgiven. Paul approved the killing of Stephen and was forgiven. "Every kind of sin and slander can be forgiven" (Matthew 12:31)—Jesus could not have been clearer.

## The Crucial Pastoral Point

**If you are worried that you've committed the unforgivable sin, you haven't.**

This is not a glib reassurance—it's theological logic:

- The unforgivable sin involves a complete, permanent hardening against the Holy Spirit
- Someone in that state would feel no guilt, no concern, no desire for God
- The very fact that you're worried about it shows the Spirit is still active in your heart
- Your fear is actually evidence of spiritual sensitivity, not spiritual death

Every pastor and theologian throughout church history has made this same observation. Augustine, Luther, Calvin, Spurgeon, and countless others have counseled anxious Christians with this truth.

## What About Hebrews 6:4-6?

"It is impossible for those who have once been enlightened... if they fall away, to be brought back to repentance."

This passage describes a similar reality from a different angle: people who experienced the full reality of God's grace and then permanently turned away. Whether this describes the same thing as the unforgivable sin is debated, but the principle is similar—persistent, final rejection of known truth.

Even here, note that the passage describes those who have "fallen away" past the point of return—not those who are struggling, sinning, or doubting. The struggling Christian who reads Hebrews 6 with fear is not the person Hebrews 6 describes.

## Rest in This

**1 John 1:9**: "If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness."

If you can confess, you can be forgiven. If you want to return to God, the door is open. The unforgivable sin is not something you accidentally stumble into—it is a settled, deliberate, permanent rejection of God's grace by someone who has fully hardened their heart. That is not you.`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed', 'Protestant'],
    sources: [
      { author: 'Wayne Grudem', title: 'Systematic Theology (Chapter 24)', publisher: 'Zondervan', year: 1994 },
      { author: 'D.A. Carson', title: 'Matthew (Expositor\'s Bible Commentary)', publisher: 'Zondervan', year: 2010 },
      { author: 'Sam Storms', title: 'Tough Topics: Biblical Answers to 25 Challenging Questions', publisher: 'Crossway', year: 2013 },
    ],
  },
  {
    domain: 'apologetics',
    areaName: 'Theology',
    tagName: 'Afterlife',
    title: 'What does the Bible say about hell? Is hell eternal?',
    tldr: 'Jesus spoke about hell more than anyone else in the Bible, using images of fire, darkness, and separation from God. Christians hold three major views: (1) eternal conscious torment (traditional—hell is everlasting suffering), (2) annihilationism/conditional immortality (the wicked are ultimately destroyed, not tortured forever), and (3) universal reconciliation (God will eventually redeem all). The majority position throughout church history has been eternal conscious torment, but the debate continues among serious scholars.',
    keyPoints: [
      'Jesus used the word Gehenna (a burning trash dump outside Jerusalem) as his primary image for hell—a place of destruction, fire, and exclusion',
      'Key passages include Matthew 25:46 ("eternal punishment"), Mark 9:48 ("where the fire never goes out"), and Revelation 20:10 ("tormented day and night forever")',
      'Annihilationists argue that "eternal punishment" means the punishment is permanent/irreversible, not that the punishing goes on forever—the wicked perish (John 3:16, Matthew 10:28)',
      'The doctrine of hell is meant to underscore the seriousness of sin and the urgency of the gospel—not to be wielded as a weapon of fear',
      'C.S. Lewis described hell as the "greatest monument to human freedom"—God respects the choice of those who persistently reject him',
    ],
    scriptureRefs: ['Matthew 25:41-46', 'Mark 9:43-48', 'Revelation 20:10-15', 'Matthew 10:28', '2 Thessalonians 1:9', 'John 3:16', 'Luke 16:19-31', 'Romans 6:23'],
    bodyMarkdown: `Hell is one of the most difficult and debated doctrines in Christianity. It raises profound questions about God's justice, mercy, and the nature of human freedom. Let's examine what the Bible says and how Christians have understood it.

## What Jesus Taught

Jesus spoke about hell more than any other figure in the Bible. He used vivid imagery:

**Gehenna**: Jesus' primary word for hell (*gehenna* appears 12 times in the Gospels, 11 from Jesus). Gehenna was the Valley of Hinnom outside Jerusalem—historically a site of child sacrifice (2 Kings 23:10) and later used as a burning trash dump. It evoked destruction, shame, and fire.

**Fire**: "Depart from me, you who are cursed, into the eternal fire prepared for the devil and his angels" (Matthew 25:41). "If your hand causes you to stumble, cut it off. It is better for you to enter life maimed than with two hands to go into hell, where the fire never goes out" (Mark 9:43).

**Darkness**: "Throw that worthless servant outside, into the darkness, where there will be weeping and gnashing of teeth" (Matthew 25:30).

**Separation**: The rich man in Luke 16 is separated from Abraham by "a great chasm" that cannot be crossed (Luke 16:26).

**Destruction**: "Do not be afraid of those who kill the body but cannot kill the soul. Rather, be afraid of the One who can destroy both soul and body in hell" (Matthew 10:28).

Note the tension: fire and darkness are opposite images. This suggests Jesus is using metaphorical language to describe something beyond our experience—the images point to a terrible reality without providing a literal blueprint.

## The Three Major Views

### 1. Eternal Conscious Torment (Traditional)

**The view**: The wicked will experience conscious suffering forever in separation from God.

**Key texts**:
- Matthew 25:46: "Then they will go away to eternal punishment, but the righteous to eternal life." The same Greek word (*aionios*) modifies both "punishment" and "life"—if life is eternal, so is punishment
- Revelation 20:10: "They will be tormented day and night for ever and ever"
- Mark 9:48: "Where the worm does not die and the fire is not quenched"

**Held by**: The majority of Catholic, Orthodox, and Protestant theologians throughout history. Augustine, Aquinas, Luther, Calvin, Edwards, and most evangelical theologians today.

**Strengths**: Takes the "eternal" language at face value. Represents the historic consensus. Upholds the infinite seriousness of sin against an infinite God.

**Challenges**: Raises questions about proportionality (infinite punishment for finite sin?) and whether a God of love would sustain conscious suffering forever.

### 2. Annihilationism / Conditional Immortality

**The view**: The wicked are ultimately destroyed—they cease to exist. "Eternal punishment" means the punishment is permanent and irreversible, not that the process of punishing continues forever.

**Key texts**:
- Matthew 10:28: God can "destroy both soul and body in hell"—destroy, not torture
- John 3:16: "Whoever believes... shall not **perish** but have eternal life"—perish means cease to exist
- Romans 6:23: "The wages of sin is **death**"—not eternal torment, but death
- 2 Thessalonians 1:9: "They will be punished with everlasting **destruction**"
- Malachi 4:1-3: The wicked will be "ashes under the soles of your feet"

**Held by**: John Stott, Edward Fudge, Clark Pinnock, many Seventh-day Adventists, and a growing number of evangelical scholars.

**Strengths**: Takes "destruction" and "death" language seriously. Resolves the proportionality problem. Preserves God's justice without requiring eternal torture.

**Challenges**: Must reinterpret passages like Revelation 20:10 and Matthew 25:46. Less historical support (though it has ancient precedent in writers like Arnobius and Irenaeus, arguably).

### 3. Universal Reconciliation

**The view**: God will ultimately reconcile all people to himself. Hell is real but remedial—a purifying process, not an eternal destination.

**Key texts**:
- 1 Timothy 2:4: God "wants all people to be saved and to come to a knowledge of the truth"
- Colossians 1:19-20: "God was pleased... through him to reconcile to himself **all things**"
- Romans 11:32: "God has bound everyone over to disobedience so that he may have mercy on them **all**"
- Philippians 2:10-11: "Every knee should bow... and every tongue acknowledge that Jesus Christ is Lord"

**Held by**: Origin (early church father), some Orthodox theologians, George MacDonald, and a minority of Protestants (Robin Parry, David Bentley Hart).

**Strengths**: Takes God's desire to save all seriously. Resolves the problem of eternal suffering. Has ancient church support (Origin).

**Challenges**: Must reinterpret many warning passages. Jesus' language suggests finality, not remediation. The mainstream church has historically rejected this view.

## C.S. Lewis on Hell

Lewis offered one of the most compelling modern reflections in *The Great Divorce* and *The Problem of Pain*:

> "The doors of hell are locked on the inside."

Lewis argued that hell is the logical consequence of human freedom. God does not send people to hell against their will—they choose it by persistently choosing themselves over God. In the end, there are only two kinds of people: those who say to God, "Thy will be done," and those to whom God says, "Thy will be done."

## What We Can Affirm

Despite disagreement on the details, Christians broadly agree:

1. **God is just**: Whatever hell is, it is not arbitrary or unjust. God will judge fairly.
2. **Sin is serious**: Hell underscores that sin is not trivial. Our choices have eternal weight.
3. **The gospel is urgent**: The reality of judgment makes the gospel "good news" in the truest sense
4. **God desires salvation**: "He is patient with you, not wanting anyone to perish, but everyone to come to repentance" (2 Peter 3:9)
5. **We should not weaponize hell**: Using hell as a scare tactic or a tool of manipulation distorts the gospel

## A Final Word

The doctrine of hell should produce three responses: (1) **gratitude** for God's grace that rescues us, (2) **urgency** to share the gospel with others, and (3) **humility** before a God whose justice and mercy are both beyond our full comprehension. It should never produce smugness, cruelty, or delight in the suffering of others.`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed', 'Protestant'],
    sources: [
      { author: 'Edward William Fudge', title: 'The Fire That Consumes', publisher: 'Cascade Books', year: 2011 },
      { author: 'Robert A. Peterson', title: 'Hell on Trial', publisher: 'P&R Publishing', year: 1995 },
      { author: 'C.S. Lewis', title: 'The Great Divorce', publisher: 'HarperOne', year: 1946 },
      { author: 'David Bentley Hart', title: 'That All Shall Be Saved', publisher: 'Yale University Press', year: 2019 },
    ],
  },
  {
    domain: 'apologetics',
    areaName: 'Modern Questions',
    tagName: 'Christian Living',
    title: 'Is watching pornography a sin? How can I break free?',
    tldr: 'Yes, the Bible teaches that pornography is sinful because it involves lust (Matthew 5:28), objectifies people made in God\'s image, fuels the exploitation of real human beings, and rewires the brain in harmful ways. However, shame and secrecy make the problem worse, not better. Freedom comes through honesty, accountability, professional help when needed, and the relentless grace of God.',
    keyPoints: [
      'Jesus said "anyone who looks at a woman lustfully has already committed adultery with her in his heart" (Matthew 5:28)—pornography is designed to provoke exactly this',
      'Pornography violates the dignity of people made in God\'s image by reducing them to objects for consumption',
      'The porn industry is linked to trafficking, exploitation, and abuse—consumption creates demand for these harms',
      'Neuroscience shows pornography is addictive: it floods the brain with dopamine and rewires neural pathways, similar to drug addiction',
      'Recovery is possible but requires honesty, accountability, often professional counseling, and understanding that relapse is part of recovery, not the end of it',
    ],
    scriptureRefs: ['Matthew 5:28', 'Job 31:1', '1 Corinthians 6:18-20', 'Philippians 4:8', 'Galatians 5:16', 'James 1:14-15', 'Psalm 101:3', 'Romans 13:14'],
    bodyMarkdown: `Pornography is the most widespread and least discussed struggle in the church. Surveys consistently show that the majority of Christian men and a significant percentage of Christian women view pornography. The church has often responded with shame-based messaging that makes the problem worse. Let's address this honestly.

## Why the Bible Says It's Wrong

### 1. Lust

**Matthew 5:28**: "Anyone who looks at a woman lustfully has already committed adultery with her in his heart."

Pornography exists to provoke sexual desire toward people who are not your spouse. It is lust by design. This isn't about a fleeting attraction—it's about deliberately cultivating sexual fantasy about another person.

### 2. Objectification

**Genesis 1:27**: Every person in a pornographic image or video is made in the image of God. Pornography reduces a person—someone's son or daughter—to a body part for consumption. This dehumanization is the opposite of the Christian ethic of love.

### 3. The Thought Life

**Philippians 4:8**: "Whatever is true, whatever is noble, whatever is right, whatever is pure... think about such things."

Pornography fills the mind with content that is the antithesis of purity, nobility, and truth. It normalizes distorted sexuality and creates unrealistic expectations that damage real relationships.

### 4. Exploitation

The porn industry profits from human suffering. Research has documented widespread coercion, trafficking, and abuse within the industry. Consumption creates demand. Christians who care about justice cannot ignore the supply chain of what they consume.

## The Science of Porn Addiction

Pornography is not merely a moral issue—it's a neurological one:

- **Dopamine flooding**: Viewing pornography triggers massive dopamine release, similar to cocaine. The brain adapts by requiring more extreme content to achieve the same response (tolerance)
- **Escalation**: Users frequently progress to more extreme, disturbing content over time
- **Erectile dysfunction**: Increasing rates of porn-induced ED in young men, documented in medical literature
- **Relationship damage**: Partners of porn users report feelings of betrayal, inadequacy, and broken trust comparable to infidelity
- **Neural pathway rewiring**: Regular use creates deeply grooved habits that feel impossible to break through willpower alone

This is not weakness—it is the brain functioning exactly as it was designed to when exposed to supernormal stimuli. Understanding the science removes shame and directs you toward effective strategies.

## Why Shame Doesn't Work

The traditional church approach—"just stop sinning, you pervert"—does not work. Here's why:

- **Shame drives secrecy**: The more ashamed you feel, the less likely you are to seek help
- **Secrecy enables addiction**: Addiction thrives in isolation and darkness
- **The shame cycle**: Use → shame → isolation → stress → use → more shame. Shame is fuel for addiction, not the cure

Jesus dealt with sexual sin through direct honesty combined with radical grace:
- To the woman caught in adultery: "Neither do I condemn you. Go now and leave your life of sin" (John 8:11)—grace first, then the call to change

## The Path to Freedom

### 1. Break the Silence

Tell someone—a trusted friend, mentor, pastor, or counselor. "Confess your sins to each other and pray for each other so that you may be healed" (James 5:16). The moment you speak it out loud, the power of secrecy breaks.

### 2. Install Accountability Software

Tools like Covenant Eyes, Bark, or Screen Accountability provide transparency with a trusted partner. This is not about being policed—it's about removing easy access during moments of weakness.

### 3. Identify Triggers

Most pornography use follows patterns:
- **HALT**: Hungry, Angry, Lonely, Tired—these emotional states are primary triggers
- **Time and place**: Late at night, alone, phone in bed
- **Stress**: Work, relationship, or financial pressure

Identify your triggers and create a plan for each one.

### 4. Get Professional Help

If you've been unable to stop on your own, see a counselor who specializes in sexual addiction. This is not overkill—it's wisdom. Certified Sex Addiction Therapists (CSATs) and licensed Christian counselors can provide evidence-based treatment.

### 5. Understand Relapse

Relapse is not failure—it is part of recovery. If you slip after weeks or months of freedom, don't let the shame spiral pull you back into the cycle. Get up, confess, and keep going. Progress is not perfection. The direction matters more than individual stumbles.

### 6. Replace, Don't Just Remove

You can't just stop a behavior—you need to replace it. Fill the time and emotional space with:
- Exercise (reduces stress, releases healthy dopamine)
- Meaningful relationships (addresses loneliness)
- Creative pursuits (provides healthy engagement)
- Prayer and Scripture (renews the mind)
- Service to others (shifts focus outward)

## For Spouses and Partners

If your spouse uses pornography:
- Your pain is real and valid. You are not overreacting.
- It is not your fault. You did not cause this.
- This can be worked through with professional help, but it requires honesty from both partners
- Consider seeing a counselor individually before attempting couples therapy
- Setting boundaries is healthy, not controlling

## The Hope

Freedom is real. Thousands of people have broken free from pornography through a combination of grace, accountability, professional help, and the power of the Holy Spirit. The journey is rarely quick or easy, but it is worth it. "It is for freedom that Christ has set us free" (Galatians 5:1).`,
    perspectives: ['Catholic', 'Evangelical', 'Reformed', 'Protestant'],
    sources: [
      { author: 'William M. Struthers', title: 'Wired for Intimacy: How Pornography Hijacks the Male Brain', publisher: 'IVP', year: 2009 },
      { author: 'Jay Stringer', title: 'Unwanted: How Sexual Brokenness Reveals Our Way to Healing', publisher: 'NavPress', year: 2018 },
      { author: 'Gary Wilson', title: 'Your Brain on Porn', publisher: 'Commonwealth Publishing', year: 2014 },
    ],
  },
  {
    domain: 'apologetics',
    areaName: 'Modern Questions',
    tagName: 'Christian Living',
    title: 'Is it okay to doubt God? How do I deal with doubts about my faith?',
    tldr: 'Doubt is not the opposite of faith—unbelief is. Many of the Bible\'s greatest figures wrestled with doubt: Abraham, Moses, David, Jeremiah, John the Baptist, Thomas, and even Jesus\' cry of "My God, why have you forsaken me?" Honest doubt that seeks answers is a pathway to deeper faith. The Bible never condemns honest questioning—it condemns stubborn refusal to believe despite evidence.',
    keyPoints: [
      'John the Baptist, who announced Jesus as the Messiah, later sent disciples to ask "Are you the one, or should we expect someone else?" (Matthew 11:3)—and Jesus did not rebuke him',
      'Thomas doubted the resurrection despite the testimony of the other disciples; Jesus invited him to examine the evidence rather than condemning his doubt (John 20:27)',
      'The Psalms are full of anguished questions directed at God: "How long, LORD? Will you forget me forever?" (Psalm 13:1)',
      'Jude 1:22 says "be merciful to those who doubt"—doubt calls for compassion, not condemnation',
      'Many great Christian thinkers (C.S. Lewis, Mother Teresa, Frederick Buechner) experienced profound seasons of doubt that ultimately strengthened their faith',
    ],
    scriptureRefs: ['Mark 9:24', 'Matthew 11:2-6', 'John 20:27-29', 'Psalm 13:1-2', 'Psalm 22:1', 'Jude 1:22', 'Habakkuk 1:2-3', 'James 1:5-6'],
    bodyMarkdown: `If you're experiencing doubt, you are in remarkably good company. The Bible is full of doubters—and God seems far more patient with doubt than the church often is.

## Doubt Is Not the Enemy

### The Bible's Doubters

**Abraham** questioned God's promise: "Sovereign LORD, how can I know that I will gain possession of it?" (Genesis 15:8). God responded not with rebuke but with a covenant ceremony.

**Moses** argued with God at the burning bush: "Who am I that I should go?" and "What if they do not believe me?" (Exodus 3:11, 4:1). God responded with patience and signs.

**David** cried out: "How long, LORD? Will you forget me forever? How long will you hide your face from me?" (Psalm 13:1). These words are in the Bible—God included them in his Word.

**Jeremiah** accused God: "You deceived me, LORD, and I was deceived" (Jeremiah 20:7). He's called the "weeping prophet," not the "rebuked prophet."

**Habakkuk** complained: "How long, LORD, must I call for help, but you do not listen?" (Habakkuk 1:2). God's response was to engage his questions, not silence them.

**John the Baptist**—who identified Jesus as "the Lamb of God who takes away the sin of the world"—later sent his disciples from prison to ask: "Are you the one who is to come, or should we expect someone else?" (Matthew 11:3). Jesus did not rebuke him. He said, "Go back and report what you hear and see" and then called John the greatest man born of women (Matthew 11:11).

**Thomas** refused to believe the resurrection without physical evidence (John 20:25). Jesus did not condemn him—he appeared, showed his wounds, and invited Thomas to touch them. Then he said, "Stop doubting and believe" (John 20:27). Note: Jesus provided evidence first, then called for faith.

### The Most Important Verse for Doubters

**Mark 9:24**: A father brings his sick son to Jesus and says, "I do believe; help me overcome my unbelief!"

This is the most honest prayer in the Bible. It acknowledges that faith and doubt can coexist. Jesus did not turn him away. He healed his son. Faith mixed with doubt is still faith.

## Types of Doubt

Not all doubt is the same:

### Intellectual Doubt
"Is Christianity actually true? Is there evidence?" This kind of doubt is addressed by apologetics—the very purpose of this platform. Study, ask questions, engage with evidence. God invites investigation (Isaiah 1:18: "Come now, let us reason together").

### Emotional Doubt
"I know the arguments, but I don't *feel* God's presence." This is extremely common and is often related to life circumstances, depression, grief, or spiritual dryness. It is not a sign of spiritual failure—it is a normal part of the human experience.

### Moral Doubt
"How can God allow this suffering?" This is the problem of evil, and it has driven some of the deepest Christian theology. Wrestling with suffering is not faithlessness—it's honesty.

### Volitional Doubt
"I don't *want* to believe." This is the only type of doubt that approaches what the Bible calls unbelief—a willful decision to reject God despite evidence and conviction.

## How to Handle Doubt

### 1. Be Honest About It

Don't pretend. God already knows. The Psalms model radical honesty with God. You don't have to clean up your doubts before bringing them to him.

### 2. Ask Questions

**James 1:5**: "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault."

God does not fault you for asking. Study, read, listen to thoughtful Christians who have wrestled with the same questions. Doubts that are never examined become permanent.

### 3. Distinguish Doubt from Unbelief

Doubt says: "I'm struggling to believe, but I want to." Unbelief says: "I refuse to believe regardless of the evidence." Doubt is honest. Unbelief is stubborn. God responds to honesty.

### 4. Don't Make Permanent Decisions During Temporary Storms

Doubt often hits during suffering, loss, or emotional crisis. The worst time to abandon your faith is in the middle of a storm. Hold on. Seasons change. The feelings will shift. Don't make a permanent decision based on a temporary state.

### 5. Stay in Community

Isolation amplifies doubt. Being with other believers—hearing their stories, singing together, praying together—keeps faith alive even when your personal flame is low.

### 6. Remember What You Know

When emotions are unreliable, lean on what you *know*, not what you *feel*. The evidence for Christianity doesn't change because you're having a bad week. Write down your reasons for believing so you can review them when doubt hits.

## What the Church Should Do

**Jude 1:22**: "Be merciful to those who doubt."

The church should be the safest place to ask hard questions. If questioning is treated as rebellion, people will stop asking—and often stop believing. A community that welcomes honest doubt produces deeper, more resilient faith than one that demands performance.

## C.S. Lewis on Doubt

Lewis, who went from atheism to Christianity and back through periods of doubt (especially after his wife's death), wrote:

> "Now that I am a Christian I do have moods in which the whole thing looks very improbable: but when I was an atheist I had moods in which Christianity looked terribly probable."

Moods are not arguments. Feelings are not facts. Faith is the decision to trust what the evidence supports, even when emotions waver.`,
    perspectives: ['Catholic', 'Orthodox', 'Evangelical', 'Reformed', 'Protestant'],
    sources: [
      { author: 'Os Guinness', title: 'God in the Dark: The Assurance of Faith Beyond a Shadow of Doubt', publisher: 'Crossway', year: 1996 },
      { author: 'Gary R. Habermas', title: 'Dealing with Doubt', publisher: 'Moody Press', year: 1990 },
      { author: 'Timothy Keller', title: 'The Reason for God: Belief in an Age of Skepticism', publisher: 'Penguin', year: 2008 },
    ],
  },
];

export { faqTheology, faqModernQuestions, faqHistorical, faqTheology2, faqScience, faqModernQuestions2, faqAdditional };
