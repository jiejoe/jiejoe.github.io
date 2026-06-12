import SwiftUI
import WidgetKit

// MARK: - 环境光：随真实时间变化的安静背景（不画具体场景，靠光做真实感）

struct AmbientPalette {
    let bg: [Color]          // 背景渐变
    let glow: Color          // 角落光晕
    let glowPos: UnitPoint   // 光晕位置
    let textPrimary: Color
    let textSecondary: Color
    let isNight: Bool

    /// 人设底色（每只宠物的身份色），与时段光混合
    private static func personaTint(_ persona: PetPersona) -> (top: (Double, Double, Double), bottom: (Double, Double, Double)) {
        switch persona {
        case .aloof:  return ((0.96, 0.94, 0.90), (0.89, 0.85, 0.79)) // 奶灰暖米
        case .sunny:  return ((1.00, 0.95, 0.82), (0.99, 0.86, 0.60)) // 活力橙黄
        case .clingy: return ((0.93, 0.93, 1.00), (0.83, 0.83, 0.96)) // 蓝紫梦幻
        case .dreamy: return ((1.00, 0.93, 0.97), (0.91, 0.84, 0.98)) // 粉紫马卡龙
        }
    }

    private static func mix(_ a: (Double, Double, Double), _ b: (Double, Double, Double), _ t: Double) -> Color {
        Color(red: a.0 + (b.0 - a.0) * t,
              green: a.1 + (b.1 - a.1) * t,
              blue: a.2 + (b.2 - a.2) * t)
    }

    /// 人设色 × 时段光：白天保留宠物身份色（混入时段光 35%），夜间统一压暗
    static func palette(for slot: TimeSlot, persona: PetPersona) -> AmbientPalette {
        let base = palette(for: slot)
        if base.isNight { return base } // 夜色统一，星光下身份色让位
        let tint = personaTint(persona)
        let slotRGB = slotLightRGB(for: slot)
        return AmbientPalette(
            bg: [mix(tint.top, slotRGB.top, 0.35), mix(tint.bottom, slotRGB.bottom, 0.35)],
            glow: base.glow, glowPos: base.glowPos,
            textPrimary: base.textPrimary, textSecondary: base.textSecondary,
            isNight: false)
    }

    /// 各时段的"光色"（用于调制人设底色）
    private static func slotLightRGB(for slot: TimeSlot) -> (top: (Double, Double, Double), bottom: (Double, Double, Double)) {
        switch slot {
        case .earlyMorning: return ((1.0, 0.94, 0.85), (1.0, 0.86, 0.70))   // 晨光偏金
        case .forenoon, .noon: return ((0.97, 0.99, 1.0), (0.90, 0.95, 1.0)) // 白昼偏冷透
        case .afternoon: return ((1.0, 0.96, 0.88), (1.0, 0.90, 0.75))      // 午后偏暖
        case .evening: return ((0.98, 0.86, 0.80), (0.90, 0.76, 0.85))      // 暮色金紫
        case .night, .lateNight: return ((0.5, 0.5, 0.6), (0.4, 0.4, 0.5))
        }
    }

    static func palette(for slot: TimeSlot) -> AmbientPalette {
        switch slot {
        case .earlyMorning: // 清晨：奶白透进暖橘晨光
            return AmbientPalette(
                bg: [Color(red: 0.99, green: 0.97, blue: 0.94), Color(red: 0.98, green: 0.90, blue: 0.80)],
                glow: Color(red: 1.0, green: 0.78, blue: 0.50).opacity(0.55),
                glowPos: .topTrailing,
                textPrimary: Color(red: 0.38, green: 0.28, blue: 0.18),
                textSecondary: Color(red: 0.38, green: 0.28, blue: 0.18).opacity(0.55),
                isNight: false)
        case .forenoon, .noon: // 白天：通透的冷白
            return AmbientPalette(
                bg: [Color(red: 0.97, green: 0.98, blue: 1.0), Color(red: 0.88, green: 0.92, blue: 0.97)],
                glow: Color.white.opacity(0.8),
                glowPos: .top,
                textPrimary: Color(red: 0.25, green: 0.30, blue: 0.40),
                textSecondary: Color(red: 0.25, green: 0.30, blue: 0.40).opacity(0.55),
                isNight: false)
        case .afternoon: // 午后：暖象牙
            return AmbientPalette(
                bg: [Color(red: 1.0, green: 0.97, blue: 0.92), Color(red: 0.97, green: 0.89, blue: 0.78)],
                glow: Color(red: 1.0, green: 0.85, blue: 0.55).opacity(0.45),
                glowPos: .topLeading,
                textPrimary: Color(red: 0.40, green: 0.30, blue: 0.18),
                textSecondary: Color(red: 0.40, green: 0.30, blue: 0.18).opacity(0.55),
                isNight: false)
        case .evening: // 傍晚：金光落在暮紫上
            return AmbientPalette(
                bg: [Color(red: 0.96, green: 0.90, blue: 0.92), Color(red: 0.87, green: 0.78, blue: 0.88)],
                glow: Color(red: 1.0, green: 0.70, blue: 0.42).opacity(0.55),
                glowPos: .topTrailing,
                textPrimary: Color(red: 0.35, green: 0.24, blue: 0.38),
                textSecondary: Color(red: 0.35, green: 0.24, blue: 0.38).opacity(0.58),
                isNight: false)
        case .night, .lateNight: // 深夜：暗暖夜色 + 微星
            return AmbientPalette(
                bg: [Color(red: 0.13, green: 0.14, blue: 0.22), Color(red: 0.20, green: 0.18, blue: 0.26)],
                glow: Color(red: 0.55, green: 0.58, blue: 0.90).opacity(0.30),
                glowPos: .topTrailing,
                textPrimary: Color(red: 0.96, green: 0.94, blue: 0.90),
                textSecondary: Color(red: 0.96, green: 0.94, blue: 0.90).opacity(0.6),
                isNight: true)
        }
    }
}

/// 组件背景（containerBackground 用）：人设色×时段光渐变 + 角落光晕 + 夜间微星
struct AmbientBackground: View {
    let slot: TimeSlot
    var persona: PetPersona = .aloof

    var body: some View {
        let p = AmbientPalette.palette(for: slot, persona: persona)
        ZStack {
            LinearGradient(colors: p.bg, startPoint: .top, endPoint: .bottom)
            // 环境光晕（radial，很轻）
            RadialGradient(colors: [p.glow, .clear],
                           center: p.glowPos, startRadius: 0, endRadius: 220)
            if p.isNight {
                GeometryReader { geo in
                    ForEach(0..<5, id: \.self) { i in
                        let xs: [CGFloat] = [0.16, 0.34, 0.58, 0.80, 0.70]
                        let ys: [CGFloat] = [0.12, 0.22, 0.08, 0.18, 0.34]
                        Circle()
                            .fill(Color.white.opacity(i % 2 == 0 ? 0.7 : 0.4))
                            .frame(width: i % 3 == 0 ? 3 : 2)
                            .position(x: geo.size.width * xs[i], y: geo.size.height * ys[i])
                    }
                }
            }
        }
    }
}

// MARK: - 唯一的组件设计：大宠物贴底站在光里

/// 宠物 + 接触阴影。宠物尽量大、底边贴住组件下沿——「就站在桌面上」
struct GroundedPetView<PetImage: View>: View {
    let isNight: Bool
    @ViewBuilder let petImage: () -> PetImage

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .bottom) {
                // 接触阴影：贴脚，窄而实
                Ellipse()
                    .fill(Color.black.opacity(isNight ? 0.45 : 0.20))
                    .frame(width: geo.size.width * 0.52, height: geo.size.height * 0.055)
                    .blur(radius: 3)
                    .offset(y: -geo.size.height * 0.012)
                petImage()
                    .frame(maxWidth: geo.size.width, maxHeight: geo.size.height * 0.97,
                           alignment: .bottom)
            }
            .frame(width: geo.size.width, height: geo.size.height, alignment: .bottom)
        }
    }
}

/// 小组件：一句话 + 大宠物
struct AmbientSmallView<PetImage: View>: View {
    let slot: TimeSlot
    let copyLine: String
    @ViewBuilder let petImage: () -> PetImage

    var body: some View {
        let p = AmbientPalette.palette(for: slot)
        ZStack(alignment: .top) {
            GroundedPetView(isNight: p.isNight, petImage: petImage)
                .padding(.top, 26)
            Text(copyLine)
                .font(.system(size: 11.5, weight: .semibold, design: .rounded))
                .foregroundStyle(p.textPrimary)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
                .widgetAccentable()
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.top, 13)
                .padding(.horizontal, 12)
        }
    }
}

/// 中组件：左侧问候+台词+陪伴，右侧大宠物
struct AmbientMediumView<PetImage: View>: View {
    let slot: TimeSlot
    let copyLine: String
    let companionLine: String
    @ViewBuilder let petImage: () -> PetImage

    var body: some View {
        let p = AmbientPalette.palette(for: slot)
        HStack(spacing: 4) {
            VStack(alignment: .leading, spacing: 7) {
                Text(slot.greeting)
                    .font(.system(size: 17, weight: .bold, design: .rounded))
                    .foregroundStyle(p.textPrimary)
                Text(copyLine)
                    .font(.system(size: 13.5, weight: .medium, design: .rounded))
                    .foregroundStyle(p.textPrimary.opacity(0.82))
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 2)
                Text(companionLine)
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(p.textSecondary)
            }
            .widgetAccentable()
            .padding(.leading, 16)
            .padding(.vertical, 14)

            GroundedPetView(isNight: p.isNight, petImage: petImage)
                .frame(width: 132)
                .padding(.top, 10)
        }
    }
}

/// 大组件：上方问候+日期，中间大宠物，底部一句话
struct AmbientLargeView<PetImage: View>: View {
    let slot: TimeSlot
    let date: Date
    let copyLine: String
    let companionLine: String
    @ViewBuilder let petImage: () -> PetImage

    var body: some View {
        let p = AmbientPalette.palette(for: slot)
        VStack(spacing: 0) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(slot.greeting)
                        .font(.system(size: 19, weight: .bold, design: .rounded))
                        .foregroundStyle(p.textPrimary)
                    Text(date, format: .dateTime.month().day().weekday())
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(p.textSecondary)
                }
                Spacer()
                Text(companionLine)
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(p.textSecondary)
                    .padding(.top, 4)
            }
            .widgetAccentable()
            .padding(.horizontal, 18)
            .padding(.top, 16)

            GroundedPetView(isNight: p.isNight, petImage: petImage)
                .padding(.horizontal, 24)
                .padding(.top, 4)

            Text(copyLine)
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .foregroundStyle(p.textPrimary.opacity(0.85))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
                .widgetAccentable()
                .padding(.top, 10)
                .padding(.bottom, 14)
                .padding(.horizontal, 16)
        }
    }
}
