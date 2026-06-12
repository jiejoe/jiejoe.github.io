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
}
