import WidgetKit
import SwiftUI

// MARK: - Timeline：每 15 分钟一个 entry，姿势与台词自然轮换

struct PetEntry: TimelineEntry {
    let date: Date
    let pet: Pet
    let slot: TimeSlot
    let action: PetAction
    let copyLine: String
    let companionLine: String
}

struct PetTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> PetEntry {
        entry(for: Date(), index: 0)
    }

    func getSnapshot(in context: Context, completion: @escaping (PetEntry) -> Void) {
        completion(entry(for: Date(), index: 0))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PetEntry>) -> Void) {
        // 未来 8 小时，每 15 分钟换一拍：宠物姿势轮换、台词轮换，像它自己在过日子
        var entries: [PetEntry] = []
        let cal = Calendar.current
        let now = Date()
        // 对齐到一刻钟
        let minute = cal.component(.minute, from: now)
        let aligned = cal.date(byAdding: .minute, value: -(minute % 15), to: now) ?? now
        for i in 0..<32 {
            let t = cal.date(byAdding: .minute, value: 15 * i, to: aligned) ?? now
            entries.append(entry(for: t, index: i))
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }

    private func entry(for date: Date, index: Int) -> PetEntry {
        let pet = SharedStore.pet(byID: SharedStore.selectedPetID)
        let slot = TimeSlot.slot(for: date)
        let quarterIndex = CopyLibrary.quarterSeed(date: date)

        // 姿势在时段动作池里轮换（按刻钟序号），偶尔回到 idle 喘口气
        var pool = slot.preferredActions.filter { pet.actions.contains($0) }
        if pool.isEmpty { pool = [.idle] }
        if !pool.contains(.idle) { pool.append(.idle) }
        var action = pool[abs(quarterIndex) % pool.count]

        // 文案优先级：礼物归来 > 冒险中 > 互动回声 > 星期感知(偶尔) > 日常轮换
        SharedStore.settleAdventureIfNeeded(at: date)
        var line: String?
        if let start = SharedStore.adventureStart {
            if date >= start && date < start.addingTimeInterval(SharedStore.adventureDuration) {
                line = CopyLibrary.adventureLine(phase: "out", gift: "", giftCount: 0)
                action = pet.actions.contains(.walk) ? .walk : action
            }
        } else if SharedStore.lastGiftDay == SharedStore.dayKey(date),
                  Calendar.current.component(.hour, from: date) < 22 {
            // 今天的礼物已带回：白天持续展示战利品（22 点后让位给晚安档）
            line = CopyLibrary.adventureLine(phase: "back",
                                             gift: CopyLibrary.giftEmoji(for: date),
                                             giftCount: SharedStore.giftCount)
            action = pet.actions.contains(.happy) ? .happy : action
        }
        if line == nil, let inter = SharedStore.lastInteraction {
            line = CopyLibrary.echoLine(interaction: inter, petName: pet.name, now: date)
        }
        if line == nil, abs(quarterIndex) % 4 == 1 {
            line = CopyLibrary.weekdayLine(date: date)
        }
        let finalLine = line ?? CopyLibrary.line(persona: pet.persona, slot: slot,
                                                 petName: pet.name, seed: quarterIndex)

        let companion = CopyLibrary.milestoneLine(days: pet.daysTogether)
            ?? CopyLibrary.companionLine(days: pet.daysTogether)
        return PetEntry(date: date, pet: pet, slot: slot, action: action,
                        copyLine: finalLine, companionLine: companion)
    }
}

// MARK: - Widget 定义（唯一设计，无风格选项）

struct PawPetWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "PawPetWidget", provider: PetTimelineProvider()) { entry in
            PawWidgetEntryView(entry: entry)
                .containerBackground(for: .widget) {
                    AmbientBackground(slot: entry.slot)
                }
                .widgetURL(URL(string: "pawpet://pet/\(entry.pet.id)"))
        }
        .configurationDisplayName("我的桌宠")
        .description("你的毛孩子住在桌面上，姿势和心情随时间自然变化")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .contentMarginsDisabled()
    }
}

struct PawWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: PetEntry

    var body: some View {
        switch family {
        case .systemSmall:
            AmbientSmallView(slot: entry.slot, copyLine: entry.copyLine) {
                WidgetPetImage(petID: entry.pet.id, action: entry.action)
            }
        case .systemLarge:
            AmbientLargeView(slot: entry.slot, date: entry.date,
                             copyLine: entry.copyLine,
                             companionLine: entry.companionLine) {
                WidgetPetImage(petID: entry.pet.id, action: entry.action)
            }
        default:
            AmbientMediumView(slot: entry.slot, copyLine: entry.copyLine,
                              companionLine: entry.companionLine) {
                WidgetPetImage(petID: entry.pet.id, action: entry.action)
            }
        }
    }
}

// MARK: - 帧图加载（iOS 26 系统玻璃/色调模式下保持全彩）

struct WidgetPetImage: View {
    let petID: String
    let action: PetAction

    var body: some View {
        if let url = PetMedia.frameURL(petID: petID, action: action),
           let img = UIImage(contentsOfFile: url.path) {
            let base = Image(uiImage: img)
            Group {
                if #available(iOSApplicationExtension 18.0, *) {
                    base.resizable()
                        .widgetAccentedRenderingMode(.fullColor)
                } else {
                    base.resizable()
                }
            }
            .scaledToFit()
        } else {
            Text("🐾").font(.system(size: 40))
        }
    }
}
