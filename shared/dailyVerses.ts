/**
 * 365 Daily Bible Verses — one for each day of the year.
 *
 * This list is shared between:
 *   - server/services/dailyVerseNotificationService.ts (push notifications)
 *   - mobile: src/components/DailyVerseBanner.tsx (home screen banner)
 *
 * Selection: dayOfYear % 365
 * Keep this file in sync across both codebases.
 */

export const DAILY_VERSE_REFERENCES: string[] = [
  // ── January (1-31) ──
  'Lamentations 3:22-23',   // 1  - New every morning
  'Jeremiah 29:11',          // 2
  'Isaiah 43:19',            // 3
  'Psalm 20:4',              // 4
  'Proverbs 16:3',           // 5
  'Philippians 3:13-14',     // 6
  '2 Corinthians 5:17',      // 7
  'Isaiah 40:31',            // 8
  'Psalm 37:4',              // 9
  'Romans 8:28',             // 10
  'Matthew 6:33',            // 11
  'Proverbs 3:5-6',          // 12
  'Joshua 1:9',              // 13
  'Philippians 4:13',        // 14
  'Psalm 46:1',              // 15
  'Isaiah 41:10',            // 16
  'Romans 12:2',             // 17
  'Hebrews 11:1',            // 18
  'James 1:2-4',             // 19
  'Psalm 119:105',           // 20
  'John 3:16',               // 21
  'Ephesians 2:8-9',         // 22
  'Galatians 5:22-23',       // 23
  'Psalm 23:1-3',            // 24
  'Matthew 11:28-30',        // 25
  '1 Peter 5:7',             // 26
  'Romans 15:13',            // 27
  'Philippians 4:6-7',       // 28
  'Psalm 27:1',              // 29
  '2 Timothy 1:7',           // 30
  'Colossians 3:23',         // 31

  // ── February (32-59) ──
  '1 Corinthians 13:4-7',    // 32
  'Psalm 139:14',            // 33
  'Micah 6:8',               // 34
  'Romans 5:8',              // 35
  'Psalm 34:18',             // 36
  'Proverbs 27:17',          // 37
  'Isaiah 43:2',             // 38
  'Psalm 121:1-2',           // 39
  'Matthew 28:20',           // 40
  'Romans 8:38-39',          // 41
  'Proverbs 18:10',          // 42
  'Psalm 91:1-2',            // 43
  'Matthew 5:14-16',         // 44
  '1 John 4:19',             // 45
  'Psalm 34:8',              // 46
  'John 14:27',              // 47
  'Deuteronomy 31:6',        // 48
  'Psalm 118:24',            // 49
  'Isaiah 26:3',             // 50
  'Proverbs 4:23',           // 51
  '1 Thessalonians 5:16-18', // 52
  'Psalm 100:4-5',           // 53
  'Hebrews 12:1-2',          // 54
  'John 15:5',               // 55
  'Ephesians 6:10-11',       // 56
  'Psalm 51:10',             // 57
  'Romans 6:23',             // 58
  'Matthew 7:7',             // 59

  // ── March (60-90) ──
  'Psalm 103:1-3',           // 60
  'Proverbs 22:6',           // 61
  'Isaiah 55:8-9',           // 62
  'John 10:10',              // 63
  '1 Corinthians 10:13',     // 64
  'Psalm 16:11',             // 65
  'Colossians 3:2',          // 66
  'James 4:8',               // 67
  'Psalm 19:14',             // 68
  'Proverbs 11:25',          // 69
  'Ephesians 4:32',          // 70
  'Mark 10:27',              // 71
  'Psalm 62:1-2',            // 72
  'Romans 1:16',             // 73
  'John 8:32',               // 74
  'Psalm 145:18',            // 75
  'Isaiah 30:21',            // 76
  'Hebrews 4:16',            // 77
  'Proverbs 15:1',           // 78
  '2 Chronicles 7:14',       // 79
  'Psalm 40:1-3',            // 80
  'Galatians 6:9',           // 81
  'John 16:33',              // 82
  'Psalm 73:26',             // 83
  'Matthew 19:26',           // 84
  'Proverbs 19:21',          // 85
  'Ephesians 3:20',          // 86
  'Psalm 30:5',              // 87
  'Romans 10:9',             // 88
  'Isaiah 54:17',            // 89
  'Psalm 147:3',             // 90

  // ── April (91-120) ──
  'John 11:25-26',           // 91
  'Psalm 56:3-4',            // 92
  '1 John 1:9',              // 93
  'Matthew 5:6',             // 94
  'Proverbs 2:6',            // 95
  'Psalm 86:5',              // 96
  'Hebrews 13:5-6',          // 97
  'John 1:12',               // 98
  'Psalm 32:8',              // 99
  'Galatians 2:20',          // 100
  'Isaiah 12:2',             // 101
  'Proverbs 3:9-10',         // 102
  'Romans 8:1',              // 103
  'Psalm 84:11',             // 104
  'Matthew 5:16',            // 105
  '1 Corinthians 15:58',     // 106
  'Psalm 9:1-2',             // 107
  'John 6:35',               // 108
  'Proverbs 16:9',           // 109
  'Philippians 1:6',         // 110
  'Psalm 55:22',             // 111
  'Isaiah 58:11',            // 112
  'Colossians 3:15',         // 113
  'James 1:17',              // 114
  'Psalm 4:8',               // 115
  'Romans 8:31',             // 116
  'Proverbs 12:25',          // 117
  'John 14:6',               // 118
  'Psalm 27:4',              // 119
  'Ephesians 2:10',          // 120

  // ── May (121-151) ──
  'Matthew 6:34',            // 121
  'Psalm 63:1',              // 122
  '1 Peter 2:9',             // 123
  'Proverbs 31:25',          // 124
  'Isaiah 40:29',            // 125
  'John 13:34-35',           // 126
  'Psalm 107:1',             // 127
  'Romans 12:12',            // 128
  'Hebrews 10:24-25',        // 129
  'Proverbs 14:26',          // 130
  'Psalm 138:8',             // 131
  'Matthew 22:37-39',        // 132
  '1 John 4:4',              // 133
  'Isaiah 46:4',             // 134
  'Psalm 18:2',              // 135
  'Galatians 6:2',           // 136
  'John 8:12',               // 137
  'Proverbs 17:17',          // 138
  'Psalm 42:11',             // 139
  'Romans 14:8',             // 140
  '2 Corinthians 12:9',      // 141
  'Matthew 5:9',             // 142
  'Psalm 143:8',             // 143
  'Ephesians 4:2-3',         // 144
  'Isaiah 49:15-16',         // 145
  'Proverbs 10:12',          // 146
  'John 15:12-13',           // 147
  'Psalm 36:5-6',            // 148
  '1 Corinthians 16:14',     // 149
  'Hebrews 6:19',            // 150
  'Psalm 90:12',             // 151

  // ── June (152-181) ──
  'Matthew 17:20',           // 152
  'Romans 8:26',             // 153
  'Proverbs 21:21',          // 154
  'Isaiah 61:1',             // 155
  'Psalm 46:10',             // 156
  'John 14:1',               // 157
  'Colossians 3:12-13',      // 158
  'Psalm 77:11-12',          // 159
  '1 Peter 3:15',            // 160
  'Proverbs 16:24',          // 161
  'James 3:17',              // 162
  'Psalm 145:8-9',           // 163
  'Ephesians 1:3-4',         // 164
  'Matthew 10:31',           // 165
  'Romans 3:23-24',          // 166
  'Isaiah 53:5',             // 167
  'Psalm 23:4',              // 168
  'John 4:14',               // 169
  'Proverbs 3:3-4',          // 170
  '1 John 3:1',              // 171
  'Psalm 71:5-6',            // 172
  'Hebrews 13:8',            // 173
  'Galatians 3:28',          // 174
  'Psalm 111:10',            // 175
  'Matthew 6:26',            // 176
  'Romans 8:18',             // 177
  'Proverbs 23:26',          // 178
  'Isaiah 44:22',            // 179
  'Psalm 33:4-5',            // 180
  'John 17:3',               // 181

  // ── July (182-212) ──
  'Psalm 1:1-3',             // 182
  '2 Corinthians 4:16-17',   // 183
  'Matthew 7:12',            // 184
  'Proverbs 25:11',          // 185
  'Isaiah 9:6',              // 186
  'Psalm 119:11',            // 187
  'John 6:68',               // 188
  'Romans 13:10',            // 189
  'Ephesians 5:1-2',         // 190
  '1 Thessalonians 5:11',    // 191
  'Psalm 103:11-12',         // 192
  'Proverbs 28:1',           // 193
  'Hebrews 11:6',            // 194
  'Matthew 25:40',           // 195
  'Psalm 116:1-2',           // 196
  'Isaiah 41:13',            // 197
  'John 11:35',              // 198
  '1 Corinthians 2:9',       // 199
  'Psalm 37:23-24',          // 200
  'Proverbs 20:7',           // 201
  'Colossians 2:6-7',        // 202
  'Galatians 5:1',           // 203
  'Psalm 130:5-6',           // 204
  'Romans 12:21',            // 205
  'Matthew 18:20',           // 206
  'James 1:12',              // 207
  'Isaiah 55:10-11',         // 208
  'Psalm 150:6',             // 209
  'Proverbs 13:12',          // 210
  'John 20:29',              // 211
  'Ephesians 6:18',          // 212

  // ── August (213-243) ──
  '1 Peter 1:3',             // 213
  'Psalm 8:3-4',             // 214
  'Proverbs 1:7',            // 215
  'Matthew 9:37-38',         // 216
  'Romans 11:33',            // 217
  'Isaiah 6:8',              // 218
  'Psalm 139:7-10',          // 219
  'John 15:16',              // 220
  'Hebrews 12:11',           // 221
  '2 Corinthians 9:7',       // 222
  'Psalm 19:1',              // 223
  'Proverbs 18:24',          // 224
  'Galatians 6:7-8',         // 225
  'Matthew 28:18-20',        // 226
  'Psalm 37:5-6',            // 227
  '1 John 5:14',             // 228
  'Isaiah 40:8',             // 229
  'Romans 12:1',             // 230
  'Proverbs 9:10',           // 231
  'Psalm 25:4-5',            // 232
  'John 14:26',              // 233
  'Colossians 1:16-17',      // 234
  'James 5:16',              // 235
  'Ephesians 3:16-17',       // 236
  'Psalm 48:14',             // 237
  'Matthew 16:26',           // 238
  '1 Corinthians 3:16',      // 239
  'Proverbs 4:7',            // 240
  'Isaiah 35:4',             // 241
  'Psalm 126:5-6',           // 242
  'Hebrews 4:12',            // 243

  // ── September (244-273) ──
  'Romans 8:37',             // 244
  'John 5:24',               // 245
  'Psalm 91:11-12',          // 246
  'Proverbs 24:16',          // 247
  'Matthew 5:44',            // 248
  'Isaiah 11:6',             // 249
  'Galatians 3:26',          // 250
  'Psalm 34:1-3',            // 251
  '1 Peter 4:8',             // 252
  'Proverbs 31:30',          // 253
  '2 Corinthians 1:3-4',     // 254
  'Psalm 65:11',             // 255
  'John 10:27-28',           // 256
  'Ephesians 4:29',          // 257
  'Romans 10:17',            // 258
  'Isaiah 49:13',            // 259
  'Psalm 68:19',             // 260
  'Matthew 12:36',           // 261
  'Hebrews 10:35-36',        // 262
  'Proverbs 14:30',          // 263
  'James 4:10',              // 264
  'Psalm 113:3',             // 265
  '1 John 2:15-17',          // 266
  'Colossians 3:17',         // 267
  'Isaiah 48:17',            // 268
  'Psalm 85:10-11',          // 269
  'John 12:46',              // 270
  'Romans 12:9-10',          // 271
  'Proverbs 30:5',           // 272
  'Matthew 6:21',            // 273

  // ── October (274-304) ──
  '1 Corinthians 15:55-57',  // 274
  'Psalm 96:1-3',            // 275
  'Galatians 5:13-14',       // 276
  'Isaiah 60:1',             // 277
  'Proverbs 15:13',          // 278
  'John 7:38',               // 279
  'Psalm 31:14-15',          // 280
  'Ephesians 5:15-16',       // 281
  'Romans 8:6',              // 282
  'Hebrews 3:13',            // 283
  'Matthew 5:3-4',           // 284
  'Psalm 104:33-34',         // 285
  '1 Peter 1:8-9',           // 286
  'Proverbs 8:11',           // 287
  'Isaiah 62:3',             // 288
  'James 2:17',              // 289
  'Psalm 57:1',              // 290
  '2 Corinthians 3:17',      // 291
  'John 21:17',              // 292
  'Colossians 1:27',         // 293
  'Romans 5:3-4',            // 294
  'Proverbs 3:7-8',          // 295
  'Matthew 7:24-25',         // 296
  'Psalm 119:50',            // 297
  '1 Thessalonians 4:11-12', // 298
  'Isaiah 52:7',             // 299
  'Galatians 5:16',          // 300
  'Psalm 5:3',               // 301
  'Hebrews 13:1-2',          // 302
  'John 1:14',               // 303
  'Proverbs 19:17',          // 304

  // ── November (305-334) ──
  'Psalm 95:1-3',            // 305
  'Ephesians 5:20',          // 306
  '1 Chronicles 16:34',      // 307
  'Matthew 14:27',           // 308
  'Romans 15:5-6',           // 309
  'Isaiah 25:1',             // 310
  'Psalm 106:1',             // 311
  'Proverbs 11:2',           // 312
  'John 4:24',               // 313
  '1 Corinthians 12:27',     // 314
  'Psalm 136:1',             // 315
  'Colossians 4:2',          // 316
  'James 1:5',               // 317
  'Isaiah 33:6',             // 318
  'Psalm 28:7',              // 319
  'Romans 8:15-16',          // 320
  'Matthew 11:25',           // 321
  'Hebrews 12:28-29',        // 322
  'Proverbs 17:22',          // 323
  '1 Peter 2:24',            // 324
  'Psalm 67:1-2',            // 325
  'Galatians 4:4-5',         // 326
  'John 3:30',               // 327
  '2 Corinthians 8:9',       // 328
  'Isaiah 7:14',             // 329
  'Psalm 148:1-3',           // 330
  'Ephesians 1:7-8',         // 331
  'Proverbs 22:2',           // 332
  'Matthew 1:23',            // 333
  'Psalm 72:18-19',          // 334

  // ── December (335-365) ──
  'Luke 2:10-11',            // 335
  'Isaiah 9:2',              // 336
  'Psalm 89:1',              // 337
  'Romans 6:11',             // 338
  'John 1:1-3',              // 339
  'Proverbs 16:16',          // 340
  '1 John 4:9-10',           // 341
  'Psalm 98:1-2',            // 342
  'Matthew 2:10-11',         // 343
  'Hebrews 1:3',             // 344
  'Isaiah 11:1-2',           // 345
  'Luke 1:46-47',            // 346
  'Psalm 96:11-13',          // 347
  'Colossians 1:19-20',      // 348
  'Titus 3:4-5',             // 349
  'Proverbs 8:17',           // 350
  'John 1:9',                // 351
  'Psalm 85:10',             // 352
  'Galatians 4:6-7',         // 353
  'Isaiah 42:6',             // 354
  'Romans 8:32',             // 355
  'Matthew 5:8',             // 356
  'Psalm 147:11',            // 357
  'Luke 2:14',               // 358
  '1 Timothy 1:15',          // 359
  'Revelation 21:3-4',       // 360
  'Proverbs 3:11-12',        // 361
  'John 1:16',               // 362
  'Psalm 117:1-2',           // 363
  'Isaiah 60:19-20',         // 364
  'Revelation 22:20-21',     // 365
];
