import Foundation
import SwiftUI

// MARK: - 动作

enum PetAction: String, Codable, CaseIterable {
    case idle, yawn, lick, walk, sleep, happy, eat, belly, stretch

    var displayName: String {
        switch self {
        case .idle: return "发呆"
        case .yawn: return "打哈欠"
        case .lick: return "舔毛"
        case .walk: return "散步"
        case .sleep: return "睡觉"
        case .happy: return "撒娇"
        case .eat: return "干饭"
        case .belly: return "露肚皮"
        case .stretch: return "伸懒腰"
        }
    }
}

// MARK: - 人设（决定主题与文案口吻）

enum PetPersona: String, Codable, CaseIterable {
    case aloof   // 高冷慵懒（包子）
    case sunny   // 阳光活力（Dollar）
    case clingy  // 优雅黏人（米线）
    case dreamy  // 治愈童话（噗噗）

    var displayName: String {
        switch self {
        case .aloof: return "高冷慵懒"
        case .sunny: return "阳光活力"
        case .clingy: return "优雅黏人"
        case .dreamy: return "治愈童话"
        }
    }
}

enum PetSpecies: String, Codable {
    case cat, dog, plush, other

    var emoji: String {
        switch self {
        case .cat: return "🐱"
        case .dog: return "🐶"
        case .plush: return "🦄"
        case .other: return "🐾"
        }
    }
}

// MARK: - 宠物

struct Pet: Identifiable, Codable, Hashable {
    let id: String
    var name: String
    var species: PetSpecies
    var persona: PetPersona
    var isBuiltIn: Bool
    var adoptionDate: Date
    /// 该宠物拥有的动作（内置宠物 8 个，自定义按生成结果）
    var actions: [PetAction]

    var daysTogether: Int {
        max(1, (Calendar.current.dateComponents([.day], from: adoptionDate, to: Date()).day ?? 0) + 1)
    }

    static let builtIns: [Pet] = [
        Pet(id: "juju", name: "包子", species: .cat, persona: .aloof, isBuiltIn: true,
            adoptionDate: Date(), actions: defaultActions + [.stretch]),
        Pet(id: "dollar", name: "Dollar", species: .dog, persona: .sunny, isBuiltIn: true,
            adoptionDate: Date(), actions: defaultActions),
        Pet(id: "mixian", name: "米线", species: .cat, persona: .clingy, isBuiltIn: true,
            adoptionDate: Date(), actions: defaultActions),
        Pet(id: "uni", name: "噗噗", species: .plush, persona: .dreamy, isBuiltIn: true,
            adoptionDate: Date(), actions: [.idle]),
    ]

    static let defaultActions: [PetAction] = [.idle, .yawn, .lick, .walk, .sleep, .happy, .eat, .belly]
}

// MARK: - 媒体定位（App 与 Widget 共用）

enum PetMedia {
    static let appGroupID = "group.com.kotoko.pawpet"

    /// 组件姿势帧（两个 target 都打包了 PetFrames 资源）
    static func frameURL(petID: String, action: PetAction) -> URL? {
        if let url = Bundle.main.url(forResource: action.rawValue, withExtension: "png",
                                     subdirectory: "PetFrames/\(petID)") {
            return url
        }
        // 自定义宠物：App Group 容器
        return containerURL(petID: petID)?
            .appendingPathComponent("frames/\(action.rawValue).png")
    }

    /// 透明视频（仅主 App 打包了 PetMedia 资源）
    static func videoURL(petID: String, action: PetAction) -> URL? {
        if let url = Bundle.main.url(forResource: action.rawValue, withExtension: "mov",
                                     subdirectory: "PetMedia/\(petID)/videos") {
            return url
        }
        return containerURL(petID: petID)?
            .appendingPathComponent("videos/\(action.rawValue).mov")
    }

    static func soundURL(petID: String, action: PetAction) -> URL? {
        Bundle.main.url(forResource: action.rawValue, withExtension: "mp3",
                        subdirectory: "PetMedia/\(petID)/sounds")
    }

    static func characterImageURL(petID: String) -> URL? {
        if let url = Bundle.main.url(forResource: "character", withExtension: "jpg",
                                     subdirectory: "PetMedia/\(petID)") {
            return url
        }
        if let url = Bundle.main.url(forResource: "character", withExtension: "png",
                                     subdirectory: "PetMedia/\(petID)") {
            return url
        }
        return containerURL(petID: petID)?.appendingPathComponent("character.jpg")
    }

    static func containerURL(petID: String) -> URL? {
        FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: appGroupID)?
            .appendingPathComponent("pets/\(petID)", isDirectory: true)
    }

    /// 自定义宠物存在性检查：容器里有 frames/idle.png 即认为就绪
    static func customPetReady(petID: String) -> Bool {
        guard let url = containerURL(petID: petID)?.appendingPathComponent("frames/idle.png") else { return false }
        return FileManager.default.fileExists(atPath: url.path)
    }
}
