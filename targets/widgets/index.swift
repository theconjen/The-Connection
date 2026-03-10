import WidgetKit
import SwiftUI

// ============================================================
// MARK: - Brand Colors
// ============================================================

private let creamBg = Color(red: 248/255, green: 245/255, blue: 240/255)
private let navy = Color(red: 26/255, green: 42/255, blue: 74/255)
private let gold = Color(red: 196/255, green: 162/255, blue: 101/255)
private let textMuted = Color(red: 107/255, green: 99/255, blue: 86/255)
private let trackBg = Color(red: 224/255, green: 216/255, blue: 204/255)
private let appGroup = "group.app.theconnection.mobile"

// ============================================================
// MARK: - Daily Verse Widget
// ============================================================

struct DailyVerseEntry: TimelineEntry {
    let date: Date
    let reference: String
    let text: String
}

struct DailyVerseProvider: TimelineProvider {
    func placeholder(in context: Context) -> DailyVerseEntry {
        DailyVerseEntry(date: Date(), reference: "Philippians 4:13", text: "I can do all things through Christ who strengthens me.")
    }

    func getSnapshot(in context: Context, completion: @escaping (DailyVerseEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DailyVerseEntry>) -> Void) {
        let tomorrow = Calendar.current.startOfDay(for: Calendar.current.date(byAdding: .day, value: 1, to: Date())!)
        completion(Timeline(entries: [loadEntry()], policy: .after(tomorrow)))
    }

    private func loadEntry() -> DailyVerseEntry {
        guard let defaults = UserDefaults(suiteName: appGroup),
              let data = defaults.dictionary(forKey: "widget_verse_data") else {
            return placeholder(in: .init())
        }
        return DailyVerseEntry(
            date: Date(),
            reference: data["reference"] as? String ?? "Psalm 23:1",
            text: data["text"] as? String ?? "The Lord is my shepherd; I shall not want."
        )
    }
}

struct DailyVerseWidgetView: View {
    @Environment(\.widgetFamily) var family
    var entry: DailyVerseEntry

    var body: some View {
        ZStack {
            creamBg
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 4) {
                    Text("✦").font(.system(size: 10)).foregroundColor(gold)
                    Text("VERSE OF THE DAY")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(gold)
                        .tracking(0.8)
                    Spacer()
                }

                Text("\"\(entry.text)\"")
                    .font(.system(size: family == .systemSmall ? 12 : 14))
                    .foregroundColor(navy)
                    .italic()
                    .lineLimit(family == .systemSmall ? 3 : 5)
                    .lineSpacing(2)

                Spacer(minLength: 2)

                HStack {
                    Spacer()
                    Text("— \(entry.reference)")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(gold)
                }
                HStack {
                    Spacer()
                    Text("The Connection")
                        .font(.system(size: 9))
                        .foregroundColor(textMuted)
                }
            }
            .padding(14)
        }
    }
}

struct DailyVerseWidget: Widget {
    let kind = "DailyVerseWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DailyVerseProvider()) { entry in
            DailyVerseWidgetView(entry: entry)
        }
        .configurationDisplayName("Daily Verse")
        .description("Today's Bible verse from The Connection")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// ============================================================
// MARK: - Bible Progress Widget
// ============================================================

struct BibleProgressEntry: TimelineEntry {
    let date: Date
    let planTitle: String
    let completedCount: Int
    let totalCount: Int
    let percentComplete: Int
    let nextReading: String
}

struct BibleProgressProvider: TimelineProvider {
    func placeholder(in context: Context) -> BibleProgressEntry {
        BibleProgressEntry(date: Date(), planTitle: "The Gospels", completedCount: 12, totalCount: 30, percentComplete: 40, nextReading: "Matthew 5")
    }

    func getSnapshot(in context: Context, completion: @escaping (BibleProgressEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<BibleProgressEntry>) -> Void) {
        let refresh = Calendar.current.date(byAdding: .hour, value: 2, to: Date())!
        completion(Timeline(entries: [loadEntry()], policy: .after(refresh)))
    }

    private func loadEntry() -> BibleProgressEntry {
        guard let defaults = UserDefaults(suiteName: appGroup),
              let data = defaults.dictionary(forKey: "widget_progress_data") else {
            return placeholder(in: .init())
        }
        return BibleProgressEntry(
            date: Date(),
            planTitle: data["planTitle"] as? String ?? "Bible Challenge",
            completedCount: data["completedCount"] as? Int ?? 0,
            totalCount: data["totalCount"] as? Int ?? 0,
            percentComplete: data["percentComplete"] as? Int ?? 0,
            nextReading: data["nextReading"] as? String ?? "Start reading"
        )
    }
}

struct BibleProgressWidgetView: View {
    @Environment(\.widgetFamily) var family
    var entry: BibleProgressEntry

    var body: some View {
        ZStack {
            creamBg
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 4) {
                    Text("📖").font(.system(size: 10))
                    Text("BIBLE CHALLENGE")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(gold)
                        .tracking(0.8)
                    Spacer()
                    Text("\(entry.percentComplete)%")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(gold)
                }

                Text(entry.planTitle)
                    .font(.system(size: family == .systemSmall ? 15 : 17, weight: .bold))
                    .foregroundColor(navy)
                    .lineLimit(1)

                Text("Next: \(entry.nextReading)")
                    .font(.system(size: 12))
                    .foregroundColor(textMuted)
                    .lineLimit(1)

                Spacer(minLength: 2)

                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 3).fill(trackBg).frame(height: 6)
                        RoundedRectangle(cornerRadius: 3).fill(gold)
                            .frame(width: geo.size.width * CGFloat(max(entry.percentComplete, 2)) / 100, height: 6)
                    }
                }
                .frame(height: 6)

                HStack {
                    Text("Day \(entry.completedCount) of \(entry.totalCount)")
                        .font(.system(size: 10))
                        .foregroundColor(textMuted)
                    Spacer()
                    Text("The Connection")
                        .font(.system(size: 9))
                        .foregroundColor(textMuted)
                }
            }
            .padding(14)
        }
    }
}

struct BibleProgressWidget: Widget {
    let kind = "BibleProgressWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: BibleProgressProvider()) { entry in
            BibleProgressWidgetView(entry: entry)
        }
        .configurationDisplayName("Bible Challenge")
        .description("Your Bible reading progress from The Connection")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// ============================================================
// MARK: - Widget Bundle (combines both widgets in one extension)
// ============================================================

@main
struct TheConnectionWidgets: WidgetBundle {
    var body: some Widget {
        DailyVerseWidget()
        BibleProgressWidget()
    }
}
