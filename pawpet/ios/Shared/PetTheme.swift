import SwiftUI

/// 每只宠物（按人设）独立的视觉主题——组件与 App 共用
struct PetTheme {
    let gradientTop: Color
    let gradientBottom: Color
    let accent: Color
    let textPrimary: Color
    let textSecondary: Color
    let bubbleBackground: Color
    /// 组件底部装饰条 emoji（小场景感）
    let sceneDecor: String
    /// 名字标签底色
    let nameChip: Color

    static func theme(for persona: PetPersona) -> PetTheme {
        switch persona {
        case .aloof: // 包子：奶灰暖米，慵懒贵族
            return PetTheme(
                gradientTop: Color(red: 0.96, green: 0.94, blue: 0.90),
                gradientBottom: Color(red: 0.87, green: 0.84, blue: 0.80),
                accent: Color(red: 0.62, green: 0.50, blue: 0.38),
                textPrimary: Color(red: 0.30, green: 0.26, blue: 0.22),
                textSecondary: Color(red: 0.30, green: 0.26, blue: 0.22).opacity(0.6),
                bubbleBackground: Color.white.opacity(0.75),
                sceneDecor: "🛋️",
                nameChip: Color(red: 0.62, green: 0.50, blue: 0.38).opacity(0.15)
            )
        case .sunny: // Dollar：活力橙黄，阳光草地
            return PetTheme(
                gradientTop: Color(red: 1.00, green: 0.95, blue: 0.82),
                gradientBottom: Color(red: 0.99, green: 0.84, blue: 0.55),
                accent: Color(red: 0.92, green: 0.55, blue: 0.16),
                textPrimary: Color(red: 0.42, green: 0.26, blue: 0.05),
                textSecondary: Color(red: 0.42, green: 0.26, blue: 0.05).opacity(0.6),
                bubbleBackground: Color.white.opacity(0.8),
                sceneDecor: "🌻",
                nameChip: Color(red: 0.92, green: 0.55, blue: 0.16).opacity(0.16)
            )
        case .clingy: // 米线：蓝紫梦幻，优雅
            return PetTheme(
                gradientTop: Color(red: 0.93, green: 0.93, blue: 1.00),
                gradientBottom: Color(red: 0.80, green: 0.80, blue: 0.96),
                accent: Color(red: 0.45, green: 0.42, blue: 0.85),
                textPrimary: Color(red: 0.22, green: 0.20, blue: 0.45),
                textSecondary: Color(red: 0.22, green: 0.20, blue: 0.45).opacity(0.6),
                bubbleBackground: Color.white.opacity(0.8),
                sceneDecor: "🪞",
                nameChip: Color(red: 0.45, green: 0.42, blue: 0.85).opacity(0.14)
            )
        case .dreamy: // 噗噗：粉紫马卡龙，童话
            return PetTheme(
                gradientTop: Color(red: 1.00, green: 0.93, blue: 0.97),
                gradientBottom: Color(red: 0.90, green: 0.82, blue: 0.98),
                accent: Color(red: 0.85, green: 0.42, blue: 0.72),
                textPrimary: Color(red: 0.45, green: 0.20, blue: 0.40),
                textSecondary: Color(red: 0.45, green: 0.20, blue: 0.40).opacity(0.6),
                bubbleBackground: Color.white.opacity(0.85),
                sceneDecor: "🌈",
                nameChip: Color(red: 0.85, green: 0.42, blue: 0.72).opacity(0.14)
            )
        }
    }

    var gradient: LinearGradient {
        LinearGradient(colors: [gradientTop, gradientBottom],
                       startPoint: .top, endPoint: .bottom)
    }
}
