-- Seed a broader set of apologetics and theology areas for permission assignments
INSERT INTO apologetics_topics (name, description, icon_name, slug)
VALUES
  ('Existence of God', 'Arguments for God''s existence, including cosmological, teleological, and moral cases.', 'universe', 'existence-of-god'),
  ('Problem of Evil & Suffering', 'Responses to the logical and emotional challenges posed by evil and pain.', 'help-circle', 'problem-of-evil'),
  ('Reliability of Scripture', 'Historical, archaeological, and textual evidence for the trustworthiness of the Bible.', 'book', 'bible-reliability'),
  ('Science & Faith', 'How scientific discovery relates to Christian doctrine, from cosmology to biology.', 'atom', 'science-faith'),
  ('Person & Work of Christ', 'Christology, the incarnation, and the redemptive work of Jesus.', 'cross', 'person-and-work-of-christ'),
  ('Resurrection & Historical Jesus', 'Historical evidence and argumentation for the resurrection and the identity of Jesus.', 'history', 'resurrection-historical-jesus'),
  ('Trinity & Nature of God', 'Doctrine of the Trinity, divine attributes, and theology proper.', 'triangle', 'trinity-nature-of-god'),
  ('Creation & Origins', 'Creation doctrines, Genesis, and engagement with origins debates.', 'sparkles', 'creation-origins'),
  ('Christian Ethics & Moral Theology', 'Applied ethics, moral philosophy, and contemporary cultural issues.', 'scale', 'christian-ethics'),
  ('Biblical Interpretation & Hermeneutics', 'Principles for reading and interpreting Scripture faithfully.', 'book-open', 'hermeneutics'),
  ('World Religions & Cults', 'Comparative religion, new religious movements, and interfaith dialogue.', 'globe', 'world-religions-and-cults'),
  ('Church History & Tradition', 'Historical theology, councils, and development of Christian doctrine.', 'church', 'church-history'),
  ('Salvation & Soteriology', 'Grace, faith, atonement theories, and the nature of salvation.', 'heart', 'soteriology'),
  ('Holy Spirit & Spiritual Gifts', 'Pneumatology, spiritual gifts, and discernment of spirits.', 'feather', 'pneumatology'),
  ('Eschatology & End Times', 'Biblical teaching on last things, hope, and final judgment.', 'sunset', 'eschatology'),
  ('Faith & Reason / Worldview', 'Worldview formation, rationality of faith, and philosophical foundations.', 'compass', 'faith-and-reason'),
  ('Christian Life & Spiritual Formation', 'Discipleship, prayer, spiritual disciplines, and pastoral theology.', 'footprints', 'spiritual-formation'),
  ('Evangelism & Cultural Engagement', 'Communicating the gospel and engaging contemporary culture winsomely.', 'megaphone', 'evangelism-and-culture')
ON CONFLICT (slug) DO NOTHING;
