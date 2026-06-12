import WidgetKit
import SwiftUI

// MARK: - Timeline

struct PetEntry: TimelineEntry {
    let date: Date
    let pet: Pet
    let slot: TimeSlot
    let action: PetAction
    let copyLine: String
}

struct PetTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> PetEntry {
        entry(for: Date())
    }

    func getSnapshot(in context: Context, completion: @escaping (PetEntry) -> Void) {
        completion(entry(for: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PetEntry>) -> Void) {
        // 当前时段一条 + 未来每个时段边界各一条（覆盖 24h），系统会按时刷新
        var entries: [PetEntry] = [entry(for: Date())]
        var cursor = Date()
        for _ in 0..<8 {
            let next = TimeSlot.slot(for: cursor).nextBoundary(after: cursor)
            entries.append(entry(for: next))
            cursor = next.addingTimeInterval(60)
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }

    private func entry(for date: Date) -> PetEntry {
        let pet = SharedStore.pet(byID: SharedStore.selectedPetID)
        let slot = TimeSlot.slot(for: date)
        let action = slot.action(for: pet)
        let line = CopyLibrary.line(persona: pet.persona, slot: slot,
                                    petName: pet.name,
                                    seed: CopyLibrary.defaultSeed(date: date))
        return PetEntry(date: date, pet: pet, slot: slot, action: action, copyLine: line)
    }
}

// MARK: - Widget 定义

struct PawPetWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "PawPetWidget", provider: PetTimelineProvider()) { entry in
            PawWidgetEntryView(entry: entry)
                .containerBackground(for: .widget) {
                    switch SharedStore.widgetStyle {
                    case .card:
                        PetTheme.theme(for: entry.pet.persona).gradient
                    case .window:
                        SkyView(slot: entry.slot)
                    case .transparent:
                        Color.black
                    }
                }
                .widgetURL(URL(string: "pawpet://pet/\(entry.pet.id)"))
        }
        .configurationDisplayName("我的桌宠")
        .description("你的毛孩子住在桌面上：不同时段不同姿势，还会说话")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .contentMarginsDisabled()
    }
}

struct PawWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: PetEntry

    var body: some View {
        let style = SharedStore.widgetStyle
        switch style {
        case .window:
            WindowSceneView(slot: entry.slot,
                            petName: entry.pet.name,
                            copyLine: entry.copyLine,
                            showGreeting: family != .systemSmall) {
                WidgetPetImage(petID: entry.pet.id, action: entry.action)
            }
        case .transparent:
            TransparentSceneView(familyKey: familyKey,
                                 copyLine: entry.copyLine,
                                 petName: entry.pet.name) {
                WidgetPetImage(petID: entry.pet.id, action: entry.action)
            }
        case .card:
            switch family {
            case .systemSmall: SmallPetView(entry: entry)
            case .systemLarge: LargePetView(entry: entry)
            default: MediumPetView(entry: entry)
            }
        }
    }

    private var familyKey: String {
        switch family {
        case .systemSmall: return "small"
        case .systemLarge: return "large"
        default: return "medium"
        }
    }
}

// MARK: - 帧图加载

struct WidgetPetImage: View {
    let petID: String
    let action: PetAction

    var body: some View {
        if let url = PetMedia.frameURL(petID: petID, action: action),
           let img = UIImage(contentsOfFile: url.path) {
            Image(uiImage: img)
                .resizable()
                .scaledToFit()
                .shadow(color: .black.opacity(0.10), radius: 6, y: 4)
        } else {
            Text("🐾").font(.system(size: 40))
        }
    }
}

// MARK: - 小组件：宠物 + 一句话

struct SmallPetView: View {
    let entry: PetEntry
    var theme: PetTheme { PetTheme.theme(for: entry.pet.persona) }

    var body: some View {
        VStack(spacing: 2) {
            HStack {
                Text(entry.pet.name)
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(theme.textPrimary)
                Spacer()
                Text(theme.sceneDecor).font(.system(size: 11))
            }
            Spacer(minLength: 0)
            WidgetPetImage(petID: entry.pet.id, action: entry.action)
                .frame(maxHeight: 78)
            Spacer(minLength: 0)
            Text(entry.copyLine)
                .font(.system(size: 10, weight: .medium, design: .rounded))
                .foregroundStyle(theme.textSecondary)
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.8)
        }
        .padding(12)
    }
}

// MARK: - 中组件：问候 + 台词 + 陪伴天数

struct MediumPetView: View {
    let entry: PetEntry
    var theme: PetTheme { PetTheme.theme(for: entry.pet.persona) }

    var body: some View {
        HStack(spacing: 14) {
            WidgetPetImage(petID: entry.pet.id, action: entry.action)
                .frame(width: 108)
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Text("\(entry.slot.greeting)，铲屎官")
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(theme.textPrimary)
                    Text(theme.sceneDecor).font(.system(size: 13))
                }
                Text(entry.copyLine)
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(theme.textPrimary.opacity(0.85))
                    .lineLimit(2)
                Spacer(minLength: 2)
                HStack(spacing: 6) {
                    Text("\(entry.pet.name) · \(entry.action.displayName)中")
                        .font(.system(size: 11, design: .rounded))
                    Text(CopyLibrary.companionLine(days: entry.pet.daysTogether))
                        .font(.system(size: 11, design: .rounded))
                        .lineLimit(1)
                }
                .foregroundStyle(theme.textSecondary)
                .padding(.horizontal, 8).padding(.vertical, 4)
                .background(Capsule().fill(theme.nameChip))
                .minimumScaleFactor(0.7)
            }
            Spacer(minLength: 0)
        }
        .padding(14)
    }
}

// MARK: - 大组件：小场景 + 日程感

struct LargePetView: View {
    let entry: PetEntry
    var theme: PetTheme { PetTheme.theme(for: entry.pet.persona) }

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(entry.slot.greeting)，铲屎官")
                        .font(.system(size: 17, weight: .bold, design: .rounded))
                        .foregroundStyle(theme.textPrimary)
                    Text(entry.date, format: .dateTime.month().day().weekday())
                        .font(.system(size: 12, design: .rounded))
                        .foregroundStyle(theme.textSecondary)
                }
                Spacer()
                Text(theme.sceneDecor).font(.system(size: 22))
            }

            Spacer(minLength: 0)
            WidgetPetImage(petID: entry.pet.id, action: entry.action)
                .frame(maxHeight: 170)
            // 地面阴影，边界感
            Ellipse()
                .fill(Color.black.opacity(0.08))
                .frame(width: 130, height: 14)
                .blur(radius: 5)
                .offset(y: -6)
            Spacer(minLength: 0)

            // 台词气泡
            Text("“\(entry.copyLine)”")
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .foregroundStyle(theme.textPrimary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 16).padding(.vertical, 10)
                .background(RoundedRectangle(cornerRadius: 16).fill(theme.bubbleBackground))

            HStack {
                Text("\(entry.pet.name)正在\(entry.action.displayName)")
                Spacer()
                Text(CopyLibrary.companionLine(days: entry.pet.daysTogether))
            }
            .font(.system(size: 11, design: .rounded))
            .foregroundStyle(theme.textSecondary)
        }
        .padding(16)
    }
}
