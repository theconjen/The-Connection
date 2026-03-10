import WidgetKit
import SwiftUI

// MARK: - Timeline Provider

struct BibleProgressProvider: TimelineProvider {
    private let appGroup = "group.app.theconnection.mobile"
    private let storageKey = "widget_progress_data"

    func placeholder(in context: Context) -> BibleProgressEntry {
        BibleProgressEntry(
            date: Date(),
            planTitle: "The Gospels",
            completedCount: 12,
            totalCount: 30,
            percentComplete: 40,
            nextReading: "Matthew 5"
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (BibleProgressEntry) -> Void) {
        let entry = loadEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<BibleProgressEntry>) -> Void) {
        let entry = loadEntry()

        // Refresh every 2 hours
        let refreshDate = Calendar.current.date(byAdding: .hour, value: 2, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(refreshDate))
        completion(timeline)
    }

    private func loadEntry() -> BibleProgressEntry {
        guard let defaults = UserDefaults(suiteName: appGroup),
              let data = defaults.dictionary(forKey: storageKey) else {
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

// MARK: - Timeline Entry

struct BibleProgressEntry: TimelineEntry {
    let date: Date
    let planTitle: String
    let completedCount: Int
    let totalCount: Int
    let percentComplete: Int
    let nextReading: String
}

// MARK: - Widget View

struct BibleProgressWidgetView: View {
    @Environment(\.widgetFamily) var family
    var entry: BibleProgressEntry

    // Brand colors
    let creamBg = Color(red: 248/255, green: 245/255, blue: 240/255)
    let navy = Color(red: 26/255, green: 42/255, blue: 74/255)
    let gold = Color(red: 196/255, green: 162/255, blue: 101/255)
    let textMuted = Color(red: 107/255, green: 99/255, blue: 86/255)
    let trackBg = Color(red: 224/255, green: 216/255, blue: 204/255)

    var body: some View {
        ZStack {
            creamBg

            VStack(alignment: .leading, spacing: 6) {
                // Header
                HStack(spacing: 4) {
                    Text("📖")
                        .font(.system(size: 10))
                    Text("BIBLE CHALLENGE")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(gold)
                        .tracking(0.8)
                    Spacer()
                    Text("\(entry.percentComplete)%")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(gold)
                }

                // Plan title
                Text(entry.planTitle)
                    .font(.system(size: family == .systemSmall ? 15 : 17, weight: .bold))
                    .foregroundColor(navy)
                    .lineLimit(1)

                // Next reading
                Text("Next: \(entry.nextReading)")
                    .font(.system(size: 12))
                    .foregroundColor(textMuted)
                    .lineLimit(1)

                Spacer(minLength: 2)

                // Progress bar
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(trackBg)
                            .frame(height: 6)

                        RoundedRectangle(cornerRadius: 3)
                            .fill(gold)
                            .frame(width: geo.size.width * CGFloat(max(entry.percentComplete, 2)) / 100, height: 6)
                    }
                }
                .frame(height: 6)

                // Stats
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

// MARK: - Widget Configuration

struct BibleProgressWidget: Widget {
    let kind: String = "BibleProgressWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: BibleProgressProvider()) { entry in
            BibleProgressWidgetView(entry: entry)
        }
        .configurationDisplayName("Bible Challenge")
        .description("Your Bible reading progress from The Connection")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
