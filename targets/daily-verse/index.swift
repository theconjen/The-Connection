import WidgetKit
import SwiftUI

// MARK: - Data Model

struct VerseData {
    let reference: String
    let text: String
    let date: String
    let translation: String
}

// MARK: - Timeline Provider

struct DailyVerseProvider: TimelineProvider {
    private let appGroup = "group.app.theconnection.mobile"
    private let storageKey = "widget_verse_data"

    func placeholder(in context: Context) -> DailyVerseEntry {
        DailyVerseEntry(
            date: Date(),
            reference: "Philippians 4:13",
            text: "I can do all things through Christ who strengthens me.",
            translation: "WEB"
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (DailyVerseEntry) -> Void) {
        let entry = loadEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DailyVerseEntry>) -> Void) {
        let entry = loadEntry()

        // Refresh at midnight for new verse
        let calendar = Calendar.current
        let tomorrow = calendar.startOfDay(for: calendar.date(byAdding: .day, value: 1, to: Date())!)
        let timeline = Timeline(entries: [entry], policy: .after(tomorrow))
        completion(timeline)
    }

    private func loadEntry() -> DailyVerseEntry {
        guard let defaults = UserDefaults(suiteName: appGroup),
              let data = defaults.dictionary(forKey: storageKey) else {
            return placeholder(in: .init())
        }

        return DailyVerseEntry(
            date: Date(),
            reference: data["reference"] as? String ?? "Psalm 23:1",
            text: data["text"] as? String ?? "The Lord is my shepherd; I shall not want.",
            translation: data["translation"] as? String ?? "WEB"
        )
    }
}

// MARK: - Timeline Entry

struct DailyVerseEntry: TimelineEntry {
    let date: Date
    let reference: String
    let text: String
    let translation: String
}

// MARK: - Widget View

struct DailyVerseWidgetView: View {
    @Environment(\.widgetFamily) var family
    var entry: DailyVerseEntry

    // Brand colors
    let creamBg = Color(red: 248/255, green: 245/255, blue: 240/255)
    let navy = Color(red: 26/255, green: 42/255, blue: 74/255)
    let gold = Color(red: 196/255, green: 162/255, blue: 101/255)
    let textMuted = Color(red: 107/255, green: 99/255, blue: 86/255)

    var body: some View {
        ZStack {
            creamBg

            VStack(alignment: .leading, spacing: 6) {
                // Header
                HStack(spacing: 4) {
                    Text("✦")
                        .font(.system(size: 10))
                        .foregroundColor(gold)
                    Text("VERSE OF THE DAY")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(gold)
                        .tracking(0.8)
                    Spacer()
                }

                // Verse text
                Text("\"\(entry.text)\"")
                    .font(.system(size: family == .systemSmall ? 12 : 14))
                    .foregroundColor(navy)
                    .italic()
                    .lineLimit(family == .systemSmall ? 3 : 5)
                    .lineSpacing(2)

                Spacer(minLength: 2)

                // Reference
                HStack {
                    Spacer()
                    Text("— \(entry.reference)")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(gold)
                }

                // Branding
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

// MARK: - Widget Configuration

struct DailyVerseWidget: Widget {
    let kind: String = "DailyVerseWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DailyVerseProvider()) { entry in
            DailyVerseWidgetView(entry: entry)
        }
        .configurationDisplayName("Daily Verse")
        .description("Today's Bible verse from The Connection")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
