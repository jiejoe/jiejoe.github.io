import Foundation

/// 一天的时段——组件按时段切换宠物姿势与文案
enum TimeSlot: String, CaseIterable {
    case earlyMorning  // 6-9   伸懒腰/打哈欠
    case forenoon      // 9-12  散步
    case noon          // 12-14 干饭
    case afternoon     // 14-17 舔毛/发呆
    case evening       // 17-20 撒娇
    case night         // 20-23 露肚皮
    case lateNight     // 23-6  睡觉

    static func slot(for date: Date = Date()) -> TimeSlot {
        let h = Calendar.current.component(.hour, from: date)
        switch h {
        case 6..<9: return .earlyMorning
        case 9..<12: return .forenoon
        case 12..<14: return .noon
        case 14..<17: return .afternoon
        case 17..<20: return .evening
        case 20..<23: return .night
        default: return .lateNight
        }
    }

    /// 该时段的首选动作（宠物没有该动作时按序回退）
    var preferredActions: [PetAction] {
        switch self {
        case .earlyMorning: return [.stretch, .yawn, .idle]
        case .forenoon: return [.walk, .idle]
        case .noon: return [.eat, .lick, .idle]
        case .afternoon: return [.lick, .idle]
        case .evening: return [.happy, .idle]
        case .night: return [.belly, .happy, .idle]
        case .lateNight: return [.sleep, .idle]
        }
    }

    func action(for pet: Pet) -> PetAction {
        preferredActions.first(where: { pet.actions.contains($0) }) ?? .idle
    }

    var greeting: String {
        switch self {
        case .earlyMorning: return "早安"
        case .forenoon: return "上午好"
        case .noon: return "午饭时间"
        case .afternoon: return "下午好"
        case .evening: return "晚上好"
        case .night: return "夜深了"
        case .lateNight: return "晚安"
        }
    }

    /// 时段的下一个边界时刻，用于 Widget 时间线刷新
    func nextBoundary(after date: Date = Date()) -> Date {
        let cal = Calendar.current
        let boundaries = [6, 9, 12, 14, 17, 20, 23]
        let h = cal.component(.hour, from: date)
        let today = cal.startOfDay(for: date)
        for b in boundaries where b > h {
            return cal.date(byAdding: .hour, value: b, to: today)!
        }
        // 跨天到明天 6 点
        let tomorrow = cal.date(byAdding: .day, value: 1, to: today)!
        return cal.date(byAdding: .hour, value: 6, to: tomorrow)!
    }
}
