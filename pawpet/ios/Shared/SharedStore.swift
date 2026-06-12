import Foundation

/// App 与 Widget 通过 App Group 共享的轻量存储
enum SharedStore {
    static let defaults = UserDefaults(suiteName: PetMedia.appGroupID) ?? .standard

    private static let selectedPetKey = "selectedPetID"
    private static let customPetsKey = "customPets"
    private static let adoptionDatesKey = "adoptionDates"

    // MARK: 当前选中（组件展示）的宠物

    static var selectedPetID: String {
        get { defaults.string(forKey: selectedPetKey) ?? "juju" }
        set { defaults.set(newValue, forKey: selectedPetKey) }
    }

    // MARK: 自定义宠物注册表

    static func loadCustomPets() -> [Pet] {
        guard let data = defaults.data(forKey: customPetsKey),
              let pets = try? JSONDecoder().decode([Pet].self, from: data) else { return [] }
        return pets
    }

    static func saveCustomPets(_ pets: [Pet]) {
        if let data = try? JSONEncoder().encode(pets) {
            defaults.set(data, forKey: customPetsKey)
        }
    }

    // MARK: 领养日（陪伴天数起点），内置宠物首次启动时记录

    static func adoptionDate(for petID: String) -> Date {
        var dates = (defaults.dictionary(forKey: adoptionDatesKey) as? [String: TimeInterval]) ?? [:]
        if let t = dates[petID] { return Date(timeIntervalSince1970: t) }
        let now = Date()
        dates[petID] = now.timeIntervalSince1970
        defaults.set(dates, forKey: adoptionDatesKey)
        return now
    }

    /// 全部宠物（内置 + 自定义），领养日已注入
    static func allPets() -> [Pet] {
        var pets = Pet.builtIns + loadCustomPets()
        for i in pets.indices {
            pets[i].adoptionDate = adoptionDate(for: pets[i].id)
        }
        return pets
    }

    static func pet(byID id: String) -> Pet {
        allPets().first(where: { $0.id == id }) ?? Pet.builtIns[0]
    }

    // MARK: 互动回声：宠物记得你刚才做了什么（App 写，Widget 读）

    private static let lastInteractionTypeKey = "lastInteractionType"
    private static let lastInteractionDateKey = "lastInteractionDate"
    private static let adventureStartKey = "adventureStart"
    private static let giftCountKey = "giftCount"
    private static let lastGiftDayKey = "lastGiftDay"

    static func recordInteraction(_ type: String) {
        defaults.set(type, forKey: lastInteractionTypeKey)
        defaults.set(Date().timeIntervalSince1970, forKey: lastInteractionDateKey)
        // 今天还没出过门的话，互动会让宠物 30 分钟后出门"捡宝贝"（3 小时回来）
        if adventureStart == nil, lastGiftDay != dayKey() {
            adventureStart = Date().addingTimeInterval(30 * 60)
        }
    }

    static var lastInteraction: (type: String, date: Date)? {
        guard let t = defaults.string(forKey: lastInteractionTypeKey) else { return nil }
        let ts = defaults.double(forKey: lastInteractionDateKey)
        guard ts > 0 else { return nil }
        return (t, Date(timeIntervalSince1970: ts))
    }

    // MARK: 小冒险（appointment 机制）：出门 → 回来带小礼物

    static var adventureStart: Date? {
        get {
            let ts = defaults.double(forKey: adventureStartKey)
            return ts > 0 ? Date(timeIntervalSince1970: ts) : nil
        }
        set { defaults.set(newValue?.timeIntervalSince1970 ?? 0, forKey: adventureStartKey) }
    }

    static let adventureDuration: TimeInterval = 3 * 3600

    static var giftCount: Int {
        get { defaults.integer(forKey: giftCountKey) }
        set { defaults.set(newValue, forKey: giftCountKey) }
    }

    static var lastGiftDay: String? {
        get { defaults.string(forKey: lastGiftDayKey) }
        set { defaults.set(newValue, forKey: lastGiftDayKey) }
    }

    static func dayKey(_ date: Date = Date()) -> String {
        let c = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return "\(c.year ?? 0)-\(c.month ?? 0)-\(c.day ?? 0)"
    }

    /// 冒险结束时发礼物（每天最多一件），幂等
    static func settleAdventureIfNeeded(at date: Date = Date()) {
        guard let start = adventureStart, date >= start.addingTimeInterval(adventureDuration) else { return }
        if lastGiftDay != dayKey(date) {
            giftCount += 1
            lastGiftDay = dayKey(date)
        }
        adventureStart = nil
    }
}
