/**
 * Monthly Bible Challenge — Based on R.C. Sproul's Reading Program for Beginners
 *
 * 12-month plan, ~1 main chapter/day.
 * EVERY day starts with a Psalm + Proverb, then the main reading.
 * Each reading includes a short commentary/context note.
 * Psalms cycle through 150 psalms across the year.
 * Proverbs cycle through 31 chapters (one per day of month).
 */

export interface DailyReading {
  day: number;
  psalm: string;
  proverb: string;
  main: string;
  commentary: string; // 1-2 sentence context for the main reading
}

export interface MonthPlan {
  month: number;
  title: string;
  theme: string;
  readings: DailyReading[];
}

function buildMonth(
  month: number,
  title: string,
  theme: string,
  chapters: { ref: string; note: string }[],
  psalmStart: number,
): MonthPlan {
  const readings: DailyReading[] = chapters.map((ch, i) => ({
    day: i + 1,
    psalm: `Psalm ${((psalmStart + i) % 150) + 1}`,
    proverb: `Proverbs ${(i % 31) + 1}`,
    main: ch.ref,
    commentary: ch.note,
  }));
  return { month, title, theme, readings };
}

// ─── Month 1: Meet Jesus (Mark) ──────────────────────────────────
const m1 = buildMonth(1, 'Meet Jesus',
  'The shortest Gospel — a fast-paced introduction to Jesus',
  [
    { ref: 'Mark 1', note: 'Jesus begins His ministry with baptism, temptation, and calling His first disciples.' },
    { ref: 'Mark 2', note: 'Jesus forgives sins, eats with sinners, and declares Himself Lord of the Sabbath.' },
    { ref: 'Mark 3', note: 'Jesus appoints twelve apostles and faces growing opposition from religious leaders.' },
    { ref: 'Mark 4', note: 'Jesus teaches in parables — the sower, the lamp, and the mustard seed — then calms a storm.' },
    { ref: 'Mark 5', note: 'Three powerful miracles: a demon-possessed man healed, a woman touched, and a girl raised.' },
    { ref: 'Mark 6', note: 'Jesus is rejected in His hometown, sends out the Twelve, and feeds 5,000 people.' },
    { ref: 'Mark 7', note: 'Jesus challenges man-made traditions and shows that true purity comes from the heart.' },
    { ref: 'Mark 8', note: 'Peter confesses Jesus as the Christ, and Jesus begins to reveal His coming death.' },
    { ref: 'Mark 9', note: 'The Transfiguration reveals Jesus\' glory; He teaches that greatness means serving others.' },
    { ref: 'Mark 10', note: 'Jesus teaches on marriage, blesses children, and tells a rich man to give everything away.' },
    { ref: 'Mark 11', note: 'Jesus enters Jerusalem as King, clears the temple, and teaches on the power of faith.' },
    { ref: 'Mark 12', note: 'Confrontations with religious leaders and the greatest commandment: love God, love people.' },
    { ref: 'Mark 13', note: 'Jesus describes the end times and warns His followers to stay watchful and ready.' },
    { ref: 'Mark 14', note: 'The Last Supper, Gethsemane, betrayal by Judas, and Jesus\' trial before the council.' },
    { ref: 'Mark 15', note: 'Jesus is sentenced, crucified, and buried. The curtain in the temple is torn in two.' },
    { ref: 'Mark 16', note: 'The empty tomb — Jesus is risen! He appears to His followers and commissions them.' },
  ], 0);

// ─── Month 2: The Beginning (Genesis 1-11 + short epistles) ────
const m2 = buildMonth(2, 'The Beginning',
  'Creation, the fall, and short letters of encouragement',
  [
    { ref: 'Genesis 1', note: 'God creates the heavens and the earth in six days — everything begins with His word.' },
    { ref: 'Genesis 2', note: 'God forms Adam, plants Eden, and creates Eve — the first human relationship.' },
    { ref: 'Genesis 3', note: 'The serpent tempts, humanity falls, and sin enters the world — but God promises a rescuer.' },
    { ref: 'Genesis 4', note: 'Cain and Abel — the first murder shows how quickly sin corrupts the human heart.' },
    { ref: 'Genesis 5', note: 'The genealogy from Adam to Noah traces God\'s faithful line through generations.' },
    { ref: 'Genesis 6', note: 'Wickedness fills the earth. God grieves but finds one righteous man: Noah.' },
    { ref: 'Genesis 7', note: 'The flood comes. Noah\'s family and the animals are saved inside the ark.' },
    { ref: 'Genesis 8', note: 'The waters recede, the dove brings an olive branch, and Noah steps onto dry ground.' },
    { ref: 'Genesis 9', note: 'God makes a covenant with Noah — the rainbow is His promise never to flood the earth again.' },
    { ref: 'Genesis 10', note: 'The Table of Nations — Noah\'s descendants spread across the earth after the flood.' },
    { ref: 'Genesis 11', note: 'The Tower of Babel — humanity\'s pride is scattered, and God calls Abram in the next chapter.' },
    { ref: 'Philippians 1', note: 'Paul writes from prison with joy, teaching that Christ gives purpose even in suffering.' },
    { ref: 'Philippians 2', note: 'The ultimate example of humility — Jesus emptied Himself and became a servant.' },
    { ref: 'Philippians 3', note: 'Paul counts everything as loss compared to knowing Christ. Press on toward the goal.' },
    { ref: 'Philippians 4', note: '"I can do all things through Christ." Paul teaches contentment and peace through prayer.' },
    { ref: 'Colossians 1', note: 'Christ is the image of the invisible God and holds all creation together.' },
    { ref: 'Colossians 2', note: 'Beware of empty philosophy — your fullness is found in Christ alone, not human rules.' },
    { ref: 'Colossians 3', note: 'Put on the new self: compassion, kindness, humility, and love that binds everything together.' },
    { ref: 'Colossians 4', note: 'Final instructions: pray with thanksgiving, speak with grace, make the most of every opportunity.' },
    { ref: '1 Thessalonians 1', note: 'Paul praises the church\'s faith — they became an example to believers everywhere.' },
    { ref: '1 Thessalonians 2', note: 'Paul recalls his gentle ministry — like a mother caring for her children.' },
    { ref: '1 Thessalonians 3', note: 'Timothy brings good news of their faith, and Paul overflows with thanksgiving.' },
    { ref: '1 Thessalonians 4', note: 'Live to please God, love each other more, and hope in the resurrection of the dead.' },
    { ref: '1 Thessalonians 5', note: 'Be ready for Christ\'s return. Rejoice always, pray continually, give thanks in everything.' },
  ], 16);

// ─── Month 3: The Life of Christ (John) ─────────────────────────
const m3 = buildMonth(3, 'The Life of Christ',
  "John's Gospel — who Jesus really is",
  [
    { ref: 'John 1', note: '"In the beginning was the Word." Jesus is God made flesh, the light of the world.' },
    { ref: 'John 2', note: 'Jesus turns water into wine at a wedding and drives merchants from the temple.' },
    { ref: 'John 3', note: '"You must be born again." Nicodemus learns that God so loved the world He gave His Son.' },
    { ref: 'John 4', note: 'Jesus offers living water to a Samaritan woman — worship is about spirit and truth.' },
    { ref: 'John 5', note: 'Jesus heals on the Sabbath and claims equality with God — the religious leaders are furious.' },
    { ref: 'John 6', note: '"I am the bread of life." Jesus feeds 5,000, walks on water, and many followers leave.' },
    { ref: 'John 7', note: 'Jesus teaches at the Feast of Tabernacles. The crowd is divided — who is this man?' },
    { ref: 'John 8', note: '"The truth will set you free." Jesus forgives an adulterous woman and confronts the Pharisees.' },
    { ref: 'John 9', note: 'Jesus heals a man born blind, proving He is the light of the world — but the leaders refuse to see.' },
    { ref: 'John 10', note: '"I am the good shepherd." Jesus knows His sheep and lays down His life for them.' },
    { ref: 'John 11', note: 'Jesus raises Lazarus from the dead — the greatest miracle before His own resurrection.' },
    { ref: 'John 12', note: 'Mary anoints Jesus\' feet. He enters Jerusalem and predicts His death will draw all people.' },
    { ref: 'John 13', note: 'Jesus washes His disciples\' feet and gives the new commandment: love one another.' },
    { ref: 'John 14', note: '"I am the way, the truth, and the life." Jesus promises the Holy Spirit and eternal peace.' },
    { ref: 'John 15', note: '"I am the vine, you are the branches." Abide in Christ to bear fruit.' },
    { ref: 'John 16', note: 'Jesus prepares His disciples for His departure and promises the Spirit of truth.' },
    { ref: 'John 17', note: 'Jesus\' prayer for His disciples and all future believers — that they would be one.' },
    { ref: 'John 18', note: 'Betrayal, arrest, and Peter\'s denial. Jesus stands before Pilate: "My kingdom is not of this world."' },
    { ref: 'John 19', note: 'The crucifixion. "It is finished." Jesus is buried in a borrowed tomb.' },
    { ref: 'John 20', note: 'The resurrection! Mary sees the risen Lord, and Thomas believes when he sees.' },
    { ref: 'John 21', note: 'Jesus restores Peter with three questions: "Do you love me? Feed my sheep."' },
  ], 40);

// ─── Month 4: The Full Story (Luke) ─────────────────────────────
const m4 = buildMonth(4, 'The Full Story',
  "Luke's detailed account of Jesus' life and ministry",
  [
    { ref: 'Luke 1', note: 'The angel Gabriel announces the births of John the Baptist and Jesus. Mary sings her praise.' },
    { ref: 'Luke 2', note: 'Jesus is born in Bethlehem. Shepherds visit, and the boy Jesus amazes teachers in the temple.' },
    { ref: 'Luke 3', note: 'John the Baptist prepares the way. Jesus is baptized and His genealogy traces back to Adam.' },
    { ref: 'Luke 4', note: 'Jesus resists Satan\'s temptations and declares His mission in the Nazareth synagogue.' },
    { ref: 'Luke 5', note: 'Miraculous catch of fish, a leper cleansed, and Levi leaves everything to follow Jesus.' },
    { ref: 'Luke 6', note: 'The Beatitudes — blessed are the poor, the hungry, those who weep. Love your enemies.' },
    { ref: 'Luke 7', note: 'A centurion\'s faith amazes Jesus, a widow\'s son is raised, and a sinful woman is forgiven.' },
    { ref: 'Luke 8', note: 'The parable of the sower, a storm calmed, and a demon-possessed man set free.' },
    { ref: 'Luke 9', note: 'The Twelve are sent out, 5,000 fed, Peter confesses Christ, and the Transfiguration.' },
    { ref: 'Luke 10', note: 'The Good Samaritan teaches who our neighbor is. Mary chooses the better thing.' },
    { ref: 'Luke 11', note: 'Jesus teaches the Lord\'s Prayer and warns against hypocrisy.' },
    { ref: 'Luke 12', note: 'Don\'t worry about your life — God knows what you need. Be ready for the Master\'s return.' },
    { ref: 'Luke 13', note: 'Repent or perish. The narrow door. Jesus weeps over Jerusalem.' },
    { ref: 'Luke 14', note: 'The cost of discipleship — count the cost before you follow. The great banquet parable.' },
    { ref: 'Luke 15', note: 'Three parables of things lost and found: the sheep, the coin, and the prodigal son.' },
    { ref: 'Luke 16', note: 'The shrewd manager and the rich man and Lazarus — faithfulness with what God gives you.' },
    { ref: 'Luke 17', note: 'Jesus heals ten lepers but only one returns to give thanks. The kingdom is among you.' },
    { ref: 'Luke 18', note: 'Persistent prayer, the Pharisee and tax collector, and the rich ruler who walked away sad.' },
    { ref: 'Luke 19', note: 'Zacchaeus is transformed by Jesus\' visit. Jesus weeps over Jerusalem and enters as King.' },
    { ref: 'Luke 20', note: 'Religious leaders challenge Jesus\' authority. He silences them with wisdom.' },
    { ref: 'Luke 21', note: 'The widow\'s offering and Jesus\' teaching about the end times — stand firm in faith.' },
    { ref: 'Luke 22', note: 'The Last Supper, prayer on the Mount of Olives, betrayal, and Peter\'s denial.' },
    { ref: 'Luke 23', note: 'Jesus before Pilate and Herod, crucified between two criminals, and buried.' },
    { ref: 'Luke 24', note: 'The empty tomb, the road to Emmaus, and Jesus ascends to heaven.' },
  ], 61);

// ─── Month 5: The Early Church (Acts) ───────────────────────────
const m5 = buildMonth(5, 'The Early Church',
  'How the church began and spread across the world',
  [
    { ref: 'Acts 1', note: 'Jesus ascends to heaven and the disciples wait for the promised Holy Spirit.' },
    { ref: 'Acts 2', note: 'Pentecost — the Holy Spirit comes, Peter preaches, and 3,000 are added to the church.' },
    { ref: 'Acts 3', note: 'Peter heals a lame man at the temple gate and proclaims Jesus as the source of life.' },
    { ref: 'Acts 4', note: 'Peter and John are arrested but boldly declare they cannot stop speaking about Jesus.' },
    { ref: 'Acts 5', note: 'Ananias and Sapphira, the apostles\' miracles, and the Sanhedrin cannot stop the movement.' },
    { ref: 'Acts 6', note: 'Seven deacons are chosen to serve. Stephen, full of grace and power, performs wonders.' },
    { ref: 'Acts 7', note: 'Stephen\'s powerful speech and martyrdom — the first Christian killed for his faith.' },
    { ref: 'Acts 8', note: 'Persecution scatters the church. Philip brings the gospel to Samaria and an Ethiopian.' },
    { ref: 'Acts 9', note: 'Saul meets Jesus on the Damascus road and is transformed from persecutor to preacher.' },
    { ref: 'Acts 10', note: 'Peter\'s vision — God shows that the gospel is for all nations, not just the Jews.' },
    { ref: 'Acts 11', note: 'The church in Antioch grows — Gentile believers are called "Christians" for the first time.' },
    { ref: 'Acts 12', note: 'Peter is miraculously freed from prison. Herod\'s pride leads to his downfall.' },
    { ref: 'Acts 13', note: 'Paul and Barnabas are sent on the first missionary journey. The gospel goes global.' },
    { ref: 'Acts 14', note: 'Paul and Barnabas preach, face opposition, and strengthen new believers everywhere.' },
    { ref: 'Acts 15', note: 'The Jerusalem Council — salvation is by grace through faith, not by following the law.' },
    { ref: 'Acts 16', note: 'Paul\'s vision of Macedonia, Lydia\'s conversion, and the Philippian jailer saved.' },
    { ref: 'Acts 17', note: 'Paul in Athens — "the unknown God" sermon at the Areopagus. Some believe.' },
    { ref: 'Acts 18', note: 'Paul stays in Corinth for 18 months, making tents and building the church.' },
    { ref: 'Acts 19', note: 'Revival in Ephesus — people burn their magic books and the silversmiths riot.' },
    { ref: 'Acts 20', note: 'Paul\'s farewell to the Ephesian elders — guard the flock and remember the weak.' },
    { ref: 'Acts 21', note: 'Paul returns to Jerusalem despite warnings and is arrested in the temple.' },
    { ref: 'Acts 22', note: 'Paul tells his conversion story to the crowd. His Roman citizenship saves him from flogging.' },
    { ref: 'Acts 23', note: 'A plot to kill Paul is uncovered, and he is sent to the governor in Caesarea.' },
    { ref: 'Acts 24', note: 'Paul stands trial before Governor Felix and speaks about righteousness and self-control.' },
    { ref: 'Acts 25', note: 'Paul appeals to Caesar. King Agrippa agrees to hear his case.' },
    { ref: 'Acts 26', note: 'Paul\'s defense before Agrippa — "I was not disobedient to the heavenly vision."' },
    { ref: 'Acts 27', note: 'Shipwreck on the way to Rome. God protects Paul and everyone on board survives.' },
    { ref: 'Acts 28', note: 'Paul arrives in Rome, heals the sick on Malta, and preaches the kingdom boldly.' },
  ], 85);

// ─── Month 6: Freedom & Faith (Epistles) ────────────────────────
const m6 = buildMonth(6, 'Freedom & Faith',
  'Letters on grace, identity in Christ, and faithful living',
  [
    { ref: 'Galatians 1', note: 'Paul defends the true gospel — there is no other. He was called by God, not man.' },
    { ref: 'Galatians 2', note: 'Justification comes by faith in Christ, not by works of the law.' },
    { ref: 'Galatians 3', note: 'The law was our guardian until Christ came. Now we are all children of God by faith.' },
    { ref: 'Galatians 4', note: 'We are no longer slaves but sons and heirs — adopted into God\'s family.' },
    { ref: 'Galatians 5', note: 'Freedom in Christ! Walk by the Spirit and bear the fruit: love, joy, peace, patience...' },
    { ref: 'Galatians 6', note: 'Bear one another\'s burdens. You reap what you sow. Boast only in the cross.' },
    { ref: 'Ephesians 1', note: 'God chose us before the foundation of the world — blessed with every spiritual blessing.' },
    { ref: 'Ephesians 2', note: '"By grace you have been saved through faith." We are God\'s workmanship, created for good works.' },
    { ref: 'Ephesians 3', note: 'The mystery revealed — Gentiles are fellow heirs. Paul prays for power to know Christ\'s love.' },
    { ref: 'Ephesians 4', note: 'One body, one Spirit, one hope. Grow up into Christ and put on the new self.' },
    { ref: 'Ephesians 5', note: 'Walk in love as Christ loved us. Marriage reflects Christ\'s love for the church.' },
    { ref: 'Ephesians 6', note: 'Put on the full armor of God — belt of truth, shield of faith, sword of the Spirit.' },
    { ref: '1 Peter 1', note: 'A living hope through the resurrection. You are being refined like gold through trials.' },
    { ref: '1 Peter 2', note: 'You are a chosen people, a royal priesthood. Live as strangers in this world.' },
    { ref: '1 Peter 3', note: 'Suffer for doing good rather than evil. Always be ready to explain your hope.' },
    { ref: '1 Peter 4', note: 'Rejoice in sharing Christ\'s sufferings. Use your gifts to serve one another.' },
    { ref: '1 Peter 5', note: 'Humble yourselves under God\'s mighty hand. Cast all your anxiety on Him.' },
    { ref: '1 Timothy 1', note: 'Paul charges Timothy to fight the good fight of faith and guard sound doctrine.' },
    { ref: '1 Timothy 2', note: 'Pray for all people. God desires everyone to be saved and know the truth.' },
    { ref: '1 Timothy 3', note: 'Qualifications for church leaders — they must be above reproach and full of integrity.' },
    { ref: '1 Timothy 4', note: 'Train yourself in godliness. Don\'t let anyone look down on you because of your youth.' },
    { ref: '1 Timothy 5', note: 'Instructions for caring for widows and honoring elders in the church.' },
    { ref: '1 Timothy 6', note: 'Godliness with contentment is great gain. Fight the good fight and take hold of eternal life.' },
  ], 113);

// ─── Month 7: The Exodus ─────────────────────────────────────────
const m7 = buildMonth(7, 'The Exodus',
  "God rescues His people and gives them His law",
  [
    { ref: 'Exodus 1', note: 'Israel enslaved in Egypt. Pharaoh orders Hebrew boys killed, but the midwives fear God.' },
    { ref: 'Exodus 2', note: 'Baby Moses is saved from the Nile, raised in Pharaoh\'s palace, then flees to Midian.' },
    { ref: 'Exodus 3', note: 'The burning bush — God reveals His name "I AM" and calls Moses to free His people.' },
    { ref: 'Exodus 4', note: 'God gives Moses signs and Aaron as his spokesman. Moses returns to Egypt.' },
    { ref: 'Exodus 5', note: 'Pharaoh refuses to let Israel go and makes their labor even harder.' },
    { ref: 'Exodus 6', note: 'God renews His covenant promise — "I will take you as my people and be your God."' },
    { ref: 'Exodus 7', note: 'The first plague — water turns to blood. Pharaoh\'s heart is hardened.' },
    { ref: 'Exodus 8', note: 'Frogs, gnats, and flies. Pharaoh keeps promising to let them go, then changes his mind.' },
    { ref: 'Exodus 9', note: 'Livestock disease, boils, and hail. God distinguishes between Egypt and Israel.' },
    { ref: 'Exodus 10', note: 'Locusts devour the land and thick darkness covers Egypt for three days.' },
    { ref: 'Exodus 11', note: 'God announces the final plague — the death of every firstborn in Egypt.' },
    { ref: 'Exodus 12', note: 'The Passover — a lamb is slain, blood on the doorposts, and Israel is set free.' },
    { ref: 'Exodus 13', note: 'God leads His people with a pillar of cloud by day and fire by night.' },
    { ref: 'Exodus 14', note: 'The Red Sea parts! Israel walks through on dry ground and Egypt\'s army is destroyed.' },
    { ref: 'Exodus 15', note: 'Moses and Miriam sing a song of victory — "The Lord is my strength and my song."' },
    { ref: 'Exodus 16', note: 'God provides manna from heaven and quail — daily bread for His people in the wilderness.' },
    { ref: 'Exodus 17', note: 'Water from the rock and victory over the Amalekites — God fights for His people.' },
    { ref: 'Exodus 18', note: 'Jethro advises Moses to delegate — wise leadership means sharing the load.' },
    { ref: 'Exodus 19', note: 'Israel arrives at Mount Sinai. God descends in thunder and smoke to meet His people.' },
    { ref: 'Exodus 20', note: 'The Ten Commandments — God\'s moral foundation for all of life and society.' },
  ], 136);

// ─── Month 8: God's Kingdom (1 Samuel) ──────────────────────────
const m8 = buildMonth(8, "God's Kingdom",
  "The rise of Israel's first king and God's sovereign plan",
  [
    { ref: '1 Samuel 1', note: 'Hannah\'s desperate prayer for a child. God answers, and Samuel is born.' },
    { ref: '1 Samuel 2', note: 'Hannah\'s song of praise. Eli\'s sons are corrupt, but Samuel grows in God\'s favor.' },
    { ref: '1 Samuel 3', note: 'God calls young Samuel in the night — "Speak, Lord, for your servant is listening."' },
    { ref: '1 Samuel 4', note: 'The ark of the covenant is captured by the Philistines. Israel is devastated.' },
    { ref: '1 Samuel 5', note: 'The ark causes chaos among the Philistines — their idol Dagon falls before it.' },
    { ref: '1 Samuel 6', note: 'The Philistines return the ark. It brings judgment on those who treat it carelessly.' },
    { ref: '1 Samuel 7', note: 'Samuel leads Israel to repentance and victory. He raises a stone of remembrance.' },
    { ref: '1 Samuel 8', note: 'Israel demands a king "like the other nations." God warns them of the cost.' },
    { ref: '1 Samuel 9', note: 'Saul, a tall and handsome Benjamite, is chosen by God to be Israel\'s first king.' },
    { ref: '1 Samuel 10', note: 'Samuel anoints Saul, the Spirit comes upon him, and he is proclaimed king.' },
    { ref: '1 Samuel 11', note: 'Saul\'s first military victory rescues the people of Jabesh-gilead.' },
    { ref: '1 Samuel 12', note: 'Samuel\'s farewell speech — obey God and He will bless; rebel and face consequences.' },
    { ref: '1 Samuel 13', note: 'Saul makes an unlawful sacrifice. Samuel tells him his kingdom will not last.' },
    { ref: '1 Samuel 14', note: 'Jonathan\'s bold faith leads to victory: "Nothing can hinder the Lord."' },
    { ref: '1 Samuel 15', note: 'Saul disobeys God again. "To obey is better than sacrifice." God rejects Saul as king.' },
    { ref: '1 Samuel 16', note: 'God sends Samuel to anoint David — "Man looks at the outward appearance, but God looks at the heart."' },
    { ref: '1 Samuel 17', note: 'David vs. Goliath — a shepherd boy defeats a giant with a sling and faith in God.' },
    { ref: '1 Samuel 18', note: 'David and Jonathan\'s friendship. Saul becomes jealous and tries to kill David.' },
    { ref: '1 Samuel 19', note: 'Saul\'s attempts to murder David intensify. Jonathan and Michal help David escape.' },
    { ref: '1 Samuel 20', note: 'David and Jonathan\'s covenant of friendship — loyalty and love in dangerous times.' },
    { ref: '1 Samuel 21', note: 'David flees to Nob, eats the holy bread, and pretends to be insane before a Philistine king.' },
    { ref: '1 Samuel 22', note: 'David gathers a band of outcasts. Saul massacres the priests of Nob in his rage.' },
    { ref: '1 Samuel 23', note: 'David rescues the town of Keilah but keeps running from Saul through the wilderness.' },
    { ref: '1 Samuel 24', note: 'David spares Saul\'s life in a cave — he refuses to harm God\'s anointed.' },
    { ref: '1 Samuel 25', note: 'Abigail\'s wisdom prevents David from taking revenge. Nabal dies and David marries her.' },
    { ref: '1 Samuel 26', note: 'David spares Saul\'s life a second time, proving his integrity and trust in God.' },
    { ref: '1 Samuel 27', note: 'David hides among the Philistines — a low point of faith, living in enemy territory.' },
    { ref: '1 Samuel 28', note: 'Saul consults a medium at Endor in desperation. Samuel\'s ghost delivers grim news.' },
  ], 6);

// ─── Month 9: Grace (Romans + Hebrews 1-7) ──────────────────────
const m9 = buildMonth(9, 'Grace',
  "Paul's greatest letters on salvation and the new covenant",
  [
    { ref: 'Romans 1', note: 'The gospel is the power of God for salvation. Without God, humanity spirals into darkness.' },
    { ref: 'Romans 2', note: 'God\'s judgment is impartial — no one escapes, whether Jew or Gentile.' },
    { ref: 'Romans 3', note: '"All have sinned and fall short." But we are justified freely by God\'s grace through faith.' },
    { ref: 'Romans 4', note: 'Abraham was justified by faith, not works — the same faith available to us today.' },
    { ref: 'Romans 5', note: 'Peace with God through Jesus. Where sin increased, grace overflowed even more.' },
    { ref: 'Romans 6', note: 'Dead to sin, alive in Christ. Sin no longer has dominion over you.' },
    { ref: 'Romans 7', note: 'Paul\'s struggle: "I do what I don\'t want to do." The law reveals sin but can\'t save.' },
    { ref: 'Romans 8', note: 'No condemnation! Nothing can separate us from God\'s love. The Spirit gives us life.' },
    { ref: 'Romans 9', note: 'God\'s sovereign choice in salvation — His mercy, His timing, His plan.' },
    { ref: 'Romans 10', note: '"If you confess with your mouth and believe in your heart, you will be saved."' },
    { ref: 'Romans 11', note: 'God has not rejected Israel. His gifts and calling are irrevocable.' },
    { ref: 'Romans 12', note: 'Offer your body as a living sacrifice. Be transformed. Use your gifts to serve.' },
    { ref: 'Romans 13', note: 'Submit to authorities, pay your debts, and clothe yourself with the Lord Jesus.' },
    { ref: 'Romans 14', note: 'Don\'t judge each other on disputable matters. The kingdom is about righteousness, peace, and joy.' },
    { ref: 'Romans 15', note: 'Accept one another as Christ accepted you. Paul\'s missionary ambitions.' },
    { ref: 'Romans 16', note: 'Paul greets his friends and co-workers — the early church was built on real relationships.' },
    { ref: 'Hebrews 1', note: 'Jesus is greater than the angels — He is the exact representation of God\'s nature.' },
    { ref: 'Hebrews 2', note: 'Jesus became human to destroy death and help those who are tempted.' },
    { ref: 'Hebrews 3', note: 'Jesus is greater than Moses. Don\'t harden your hearts like Israel in the wilderness.' },
    { ref: 'Hebrews 4', note: 'A Sabbath rest remains for God\'s people. His word is living, active, and sharp.' },
    { ref: 'Hebrews 5', note: 'Jesus is our great high priest — He learned obedience through what He suffered.' },
    { ref: 'Hebrews 6', note: 'Press on to maturity. God\'s promise is an anchor for the soul, firm and secure.' },
    { ref: 'Hebrews 7', note: 'Jesus\' priesthood is greater than the Levitical system — He lives to intercede forever.' },
  ], 34);

// ─── Month 10: Wisdom (1 Corinthians + Hebrews 8-13) ────────────
const m10 = buildMonth(10, 'Wisdom',
  'Living wisely in community and understanding the new covenant',
  [
    { ref: '1 Corinthians 1', note: 'God chose the foolish things of the world to shame the wise. The cross is power.' },
    { ref: '1 Corinthians 2', note: 'The Spirit reveals God\'s deep wisdom — what no eye has seen or ear has heard.' },
    { ref: '1 Corinthians 3', note: 'We are God\'s fellow workers. Build on the foundation of Christ with lasting materials.' },
    { ref: '1 Corinthians 4', note: 'Apostles are servants of Christ. Be faithful with what God has entrusted to you.' },
    { ref: '1 Corinthians 5', note: 'Paul addresses serious sin in the church — purity matters in the body of believers.' },
    { ref: '1 Corinthians 6', note: 'Your body is a temple of the Holy Spirit. Honor God with how you live.' },
    { ref: '1 Corinthians 7', note: 'Practical wisdom on marriage and singleness — each is a gift from God.' },
    { ref: '1 Corinthians 8', note: 'Knowledge puffs up, but love builds up. Don\'t let your freedom cause others to stumble.' },
    { ref: '1 Corinthians 9', note: 'Paul gives up his rights for the gospel — he runs the race to win the prize.' },
    { ref: '1 Corinthians 10', note: 'Learn from Israel\'s mistakes. God is faithful and won\'t let you be tempted beyond what you can bear.' },
    { ref: '1 Corinthians 11', note: 'Instructions on worship and the Lord\'s Supper — examine yourself before you participate.' },
    { ref: '1 Corinthians 12', note: 'One body, many parts. Every spiritual gift matters — the church needs all of them.' },
    { ref: '1 Corinthians 13', note: 'The love chapter — love is patient, kind, and never fails. The greatest is love.' },
    { ref: '1 Corinthians 14', note: 'Pursue love and desire spiritual gifts. Worship should be orderly and understandable.' },
    { ref: '1 Corinthians 15', note: 'The resurrection chapter — if Christ is not raised, our faith is in vain. But He IS risen!' },
    { ref: '1 Corinthians 16', note: 'Final instructions: be on guard, stand firm, be strong, and do everything in love.' },
    { ref: 'Hebrews 8', note: 'Jesus mediates a better covenant with better promises — the old is becoming obsolete.' },
    { ref: 'Hebrews 9', note: 'Christ entered the true heavenly tabernacle with His own blood — once for all.' },
    { ref: 'Hebrews 10', note: 'No more sacrifices needed. Draw near to God with confidence and hold fast to hope.' },
    { ref: 'Hebrews 11', note: 'The faith hall of fame — Abel, Noah, Abraham, Moses, and many more who trusted God.' },
    { ref: 'Hebrews 12', note: 'Run the race with endurance, looking to Jesus. God disciplines those He loves.' },
    { ref: 'Hebrews 13', note: 'Keep loving each other. Jesus Christ is the same yesterday, today, and forever.' },
  ], 57);

// ─── Month 11: God's Faithfulness (2 Samuel) ────────────────────
const m11 = buildMonth(11, "God's Faithfulness",
  "David's reign and God's promises through hardship",
  [
    { ref: '2 Samuel 1', note: 'David mourns the deaths of Saul and Jonathan with a heartfelt lament.' },
    { ref: '2 Samuel 2', note: 'David is anointed king of Judah. Civil war begins between David\'s and Saul\'s houses.' },
    { ref: '2 Samuel 3', note: 'Abner switches allegiance to David but is killed by Joab in revenge.' },
    { ref: '2 Samuel 4', note: 'Ish-bosheth is murdered. David punishes the assassins — he won\'t profit from treachery.' },
    { ref: '2 Samuel 5', note: 'David becomes king over all Israel, conquers Jerusalem, and makes it his capital.' },
    { ref: '2 Samuel 6', note: 'David brings the ark to Jerusalem. He dances before the Lord with all his might.' },
    { ref: '2 Samuel 7', note: 'God\'s covenant with David — his throne will be established forever. A promise pointing to Jesus.' },
    { ref: '2 Samuel 8', note: 'David\'s military victories expand Israel\'s borders. He rules with justice and righteousness.' },
    { ref: '2 Samuel 9', note: 'David shows kindness to Mephibosheth, Jonathan\'s son — grace to the undeserving.' },
    { ref: '2 Samuel 10', note: 'War with the Ammonites and Arameans. David\'s army wins decisive victories.' },
    { ref: '2 Samuel 11', note: 'David\'s greatest failure — adultery with Bathsheba and the murder of Uriah.' },
    { ref: '2 Samuel 12', note: 'Nathan confronts David: "You are the man!" David repents, but consequences follow.' },
    { ref: '2 Samuel 13', note: 'Amnon\'s sin against Tamar and Absalom\'s revenge — the family begins to fracture.' },
    { ref: '2 Samuel 14', note: 'Absalom returns to Jerusalem but is kept from the king\'s presence for two years.' },
    { ref: '2 Samuel 15', note: 'Absalom rebels and steals the hearts of Israel. David flees Jerusalem in tears.' },
    { ref: '2 Samuel 16', note: 'David is cursed by Shimei. Absalom enters Jerusalem and takes his father\'s throne.' },
    { ref: '2 Samuel 17', note: 'Competing counsel — Hushai\'s advice saves David by buying him time to escape.' },
    { ref: '2 Samuel 18', note: 'Absalom is killed in battle. David\'s grief is devastating: "O my son Absalom!"' },
    { ref: '2 Samuel 19', note: 'David returns as king but the nation is divided. Restoring unity is painful.' },
    { ref: '2 Samuel 20', note: 'Sheba\'s rebellion is put down. Joab remains a ruthless but effective commander.' },
    { ref: '2 Samuel 21', note: 'Famine, justice for the Gibeonites, and battles with Philistine giants.' },
    { ref: '2 Samuel 22', note: 'David\'s song of deliverance — "The Lord is my rock, my fortress, my deliverer."' },
    { ref: '2 Samuel 23', note: 'David\'s last words and his mighty warriors — men of extraordinary courage and loyalty.' },
    { ref: '2 Samuel 24', note: 'David\'s census brings judgment, but mercy prevails. He builds an altar on the threshing floor.' },
  ], 79);

// ─── Month 12: Hope & Promise (Isaiah selections) ───────────────
const m12 = buildMonth(12, 'Hope & Promise',
  "Isaiah's prophecies of the Messiah and God's redemption",
  [
    { ref: 'Isaiah 1', note: 'God\'s case against Israel — they have rebelled, but He offers cleansing: "Though your sins are like scarlet..."' },
    { ref: 'Isaiah 2', note: 'A vision of the last days — all nations will stream to God\'s mountain. Walk in His light.' },
    { ref: 'Isaiah 3', note: 'Judgment on Judah\'s leaders for their injustice and pride.' },
    { ref: 'Isaiah 4', note: 'A remnant will be called holy. God will be a shelter and shade over His people.' },
    { ref: 'Isaiah 5', note: 'The song of the vineyard — God\'s people produced bad fruit despite His perfect care.' },
    { ref: 'Isaiah 6', note: 'Isaiah\'s vision of God\'s throne — "Holy, holy, holy!" He is cleansed and sent: "Here am I, send me."' },
    { ref: 'Isaiah 7', note: 'The sign of Immanuel — "a virgin shall conceive." A prophecy pointing to Jesus\' birth.' },
    { ref: 'Isaiah 8', note: 'Trust God, not human alliances. He is both sanctuary and stumbling stone.' },
    { ref: 'Isaiah 9', note: '"For unto us a child is born" — Wonderful Counselor, Mighty God, Prince of Peace.' },
    { ref: 'Isaiah 40', note: '"Comfort my people." Those who wait on the Lord will renew their strength and soar like eagles.' },
    { ref: 'Isaiah 41', note: '"Fear not, for I am with you." God holds you by the right hand.' },
    { ref: 'Isaiah 42', note: 'The Servant of the Lord — gentle, just, and a light to the nations.' },
    { ref: 'Isaiah 43', note: '"I have called you by name, you are mine." When you pass through waters, God is with you.' },
    { ref: 'Isaiah 44', note: 'God is the only God. Idols are nothing. He will pour out His Spirit on His people.' },
    { ref: 'Isaiah 45', note: 'God calls Cyrus by name 150 years before his birth — every knee will bow to the Lord.' },
    { ref: 'Isaiah 46', note: 'God carries His people from birth to old age. No idol can compare to Him.' },
    { ref: 'Isaiah 47', note: 'Babylon\'s pride will be its downfall. No empire is above God\'s judgment.' },
    { ref: 'Isaiah 48', note: 'God refines His people not to destroy them but to prove their worth.' },
    { ref: 'Isaiah 49', note: 'The Servant will restore Israel and be a light to the Gentiles — salvation to the ends of the earth.' },
    { ref: 'Isaiah 50', note: 'The Servant sets His face like flint. He trusts God even in suffering.' },
    { ref: 'Isaiah 51', note: '"Listen to me, you who pursue righteousness." God\'s salvation will last forever.' },
    { ref: 'Isaiah 52', note: '"How beautiful on the mountains are the feet of those who bring good news!"' },
    { ref: 'Isaiah 53', note: 'The Suffering Servant — "He was pierced for our transgressions." The heart of the gospel.' },
    { ref: 'Isaiah 54', note: 'God\'s everlasting love for His people — His covenant of peace will not be shaken.' },
    { ref: 'Isaiah 55', note: '"Come, everyone who thirsts." God\'s word will accomplish everything He sends it to do.' },
  ], 103);

export const BIBLE_READING_PLAN: MonthPlan[] = [
  m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12,
];

export function getMonthPlan(monthNumber: number): MonthPlan | undefined {
  return BIBLE_READING_PLAN.find(m => m.month === monthNumber);
}

export function getMonthReadingCount(monthNumber: number): number {
  const plan = getMonthPlan(monthNumber);
  return plan?.readings.length ?? 0;
}
