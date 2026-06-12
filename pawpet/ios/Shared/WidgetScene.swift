import SwiftUI
import WidgetKit

// MARK: - 组件风格

enum WidgetSceneStyle: String, Codable, CaseIterable {
    case card        // 暖色卡片（人设主题渐变）
    case window      // 趴在窗台
    case transparent // 透明（壁纸截图背景）

    var displayName: String {
        switch self {
        case .card: return "暖色卡片"
        case .window: return "窗台"
        case .transparent: return "透明"
        }
    }
}

extension SharedStore {
    private static let widgetStyleKey = "widgetSceneStyle"

    static var widgetStyle: WidgetSceneStyle {
        get { WidgetSceneStyle(rawValue: defaults.string(forKey: widgetStyleKey) ?? "") ?? .card }
        set { defaults.set(newValue.rawValue, forKey: widgetStyleKey) }
    }

    /// 透明组件的壁纸裁剪图（按组件尺寸分别存）
    static func transparentBGURL(family: String) -> URL? {
        FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: PetMedia.appGroupID)?
            .appendingPathComponent("widget-bg/\(family).png")
    }
}

// MARK: - 时段天空

struct SkyPalette {
    let colors: [Color]
    let textPrimary: Color
    let textSecondary: Color
    let isNight: Bool

    static func palette(for slot: TimeSlot) -> SkyPalette {
        switch slot {
        case .earlyMorning: // 日出霞光
            return SkyPalette(colors: [Color(red: 0.99, green: 0.80, blue: 0.62),
                                       Color(red: 0.84, green: 0.88, blue: 0.99)],
                              textPrimary: Color(red: 0.42, green: 0.25, blue: 0.12),
                              textSecondary: Color(red: 0.42, green: 0.25, blue: 0.12).opacity(0.65),
                              isNight: false)
        case .forenoon, .afternoon: // 白天蓝天
            return SkyPalette(colors: [Color(red: 0.49, green: 0.73, blue: 0.98),
                                       Color(red: 0.82, green: 0.92, blue: 1.0)],
                              textPrimary: .white,
                              textSecondary: Color.white.opacity(0.85),
                              isNight: false)
        case .noon: // 正午明亮
            return SkyPalette(colors: [Color(red: 0.40, green: 0.69, blue: 0.99),
                                       Color(red: 0.74, green: 0.90, blue: 1.0)],
                              textPrimary: .white,
                              textSecondary: Color.white.opacity(0.85),
                              isNight: false)
        case .evening: // 夕阳
            return SkyPalette(colors: [Color(red: 0.42, green: 0.32, blue: 0.62),
                                       Color(red: 0.98, green: 0.62, blue: 0.45)],
                              textPrimary: .white,
                              textSecondary: Color.white.opacity(0.85),
                              isNight: false)
        case .night, .lateNight: // 星夜
            return SkyPalette(colors: [Color(red: 0.07, green: 0.10, blue: 0.27),
                                       Color(red: 0.20, green: 0.25, blue: 0.48)],
                              textPrimary: .white,
                              textSecondary: Color.white.opacity(0.8),
                              isNight: true)
        }
    }
}

/// 窗外天空 + 日月星云（铺满组件，窗框叠在上面）
struct SkyView: View {
    let slot: TimeSlot

    var body: some View {
        let p = SkyPalette.palette(for: slot)
        GeometryReader { geo in
            ZStack {
                LinearGradient(colors: p.colors, startPoint: .top, endPoint: .bottom)

                if p.isNight {
                    // 月亮
                    Circle()
                        .fill(Color(red: 1.0, green: 0.96, blue: 0.82))
                        .frame(width: geo.size.width * 0.16)
                        .overlay(
                            Circle()
                                .fill(p.colors[0])
                                .frame(width: geo.size.width * 0.13)
                                .offset(x: -geo.size.width * 0.045, y: -geo.size.width * 0.02)
                        )
                        .shadow(color: Color.yellow.opacity(0.35), radius: 8)
                        .position(x: geo.size.width * 0.78, y: geo.size.height * 0.20)
                    // 星星
                    ForEach(0..<7, id: \.self) { i in
                        let xs: [CGFloat] = [0.12, 0.28, 0.45, 0.60, 0.35, 0.88, 0.70]
                        let ys: [CGFloat] = [0.15, 0.30, 0.10, 0.25, 0.45, 0.42, 0.08]
                        Circle()
                            .fill(Color.white.opacity(i % 2 == 0 ? 0.9 : 0.55))
                            .frame(width: i % 3 == 0 ? 3.5 : 2.2)
                            .position(x: geo.size.width * xs[i], y: geo.size.height * ys[i])
                    }
                } else {
                    // 太阳（清晨/傍晚偏低偏暖）
                    let lowSun = slot == .earlyMorning || slot == .evening
                    Circle()
                        .fill(lowSun ? Color(red: 1.0, green: 0.72, blue: 0.40)
                                     : Color(red: 1.0, green: 0.92, blue: 0.60))
                        .frame(width: geo.size.width * (lowSun ? 0.22 : 0.16))
                        .blur(radius: 1.5)
                        .shadow(color: Color.orange.opacity(0.4), radius: 10)
                        .position(x: geo.size.width * (lowSun ? 0.24 : 0.78),
                                  y: geo.size.height * (lowSun ? 0.34 : 0.18))
                    // 云
                    CloudShape()
                        .fill(Color.white.opacity(0.85))
                        .frame(width: geo.size.width * 0.34, height: geo.size.height * 0.14)
                        .position(x: geo.size.width * 0.62, y: geo.size.height * 0.30)
                    CloudShape()
                        .fill(Color.white.opacity(0.6))
                        .frame(width: geo.size.width * 0.26, height: geo.size.height * 0.11)
                        .position(x: geo.size.width * 0.20, y: geo.size.height * 0.14)
                }
            }
        }
    }
}

struct CloudShape: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        let w = rect.width, h = rect.height
        p.addEllipse(in: CGRect(x: 0, y: h * 0.35, width: w * 0.45, height: h * 0.65))
        p.addEllipse(in: CGRect(x: w * 0.22, y: 0, width: w * 0.5, height: h * 0.9))
        p.addEllipse(in: CGRect(x: w * 0.5, y: h * 0.25, width: w * 0.5, height: h * 0.75))
        return p
    }
}

/// 窗台场景：天空在外、白窗框、宠物趴在窗台上
/// `petImage`/文字由调用方注入，App 预览与 Widget 共用同一套视觉
struct WindowSceneView<PetView: View>: View {
    let slot: TimeSlot
    let petName: String
    let copyLine: String
    let showGreeting: Bool
    @ViewBuilder let petView: () -> PetView

    private let frameColor = Color(red: 0.97, green: 0.95, blue: 0.91)   // 暖白窗框
    private let frameShade = Color(red: 0.82, green: 0.78, blue: 0.72)

    var body: some View {
        let p = SkyPalette.palette(for: slot)
        GeometryReader { geo in
            let w = geo.size.width, h = geo.size.height
            let sillTop = h * 0.66          // 窗台台面高度
            let mullion = max(4, w * 0.022)  // 窗棂宽

            ZStack {
                SkyView(slot: slot)

                // 文案写在"玻璃"上（左上）
                VStack(alignment: .leading, spacing: 2) {
                    if showGreeting {
                        Text("\(slot.greeting)，铲屎官")
                            .font(.system(size: max(13, w * 0.045), weight: .bold, design: .rounded))
                            .foregroundStyle(p.textPrimary)
                    }
                    Text(copyLine)
                        .font(.system(size: max(10, w * 0.034), weight: .medium, design: .rounded))
                        .foregroundStyle(p.textSecondary)
                        .lineLimit(2)
                }
                .shadow(color: .black.opacity(p.isNight ? 0.5 : 0.15), radius: 2, y: 1)
                .padding(.horizontal, w * 0.09)
                .padding(.top, h * 0.08)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)

                // 窗棂（居中竖一道，只到窗台为止）
                Rectangle()
                    .fill(frameColor)
                    .frame(width: mullion, height: sillTop)
                    .shadow(color: .black.opacity(0.18), radius: 1.5, x: 1)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)

                // 窗台（高光边 + 台面）
                VStack(spacing: 0) {
                    Rectangle().fill(Color.white.opacity(0.9)).frame(height: 2)
                    Rectangle()
                        .fill(LinearGradient(colors: [frameColor, frameShade],
                                             startPoint: .top, endPoint: .bottom))
                }
                .frame(height: h - sillTop)
                .frame(maxHeight: .infinity, alignment: .bottom)

                // 宠物趴在窗台上：底边压住台面，带接触阴影
                ZStack(alignment: .bottom) {
                    Ellipse()
                        .fill(Color.black.opacity(0.22))
                        .frame(width: w * 0.42, height: h * 0.045)
                        .blur(radius: 3)
                        .offset(y: -h * 0.005)
                    petView()
                        .frame(height: h * 0.46)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
                .padding(.bottom, h - sillTop - h * 0.035)

                // 外窗框
                RoundedRectangle(cornerRadius: 0)
                    .strokeBorder(frameColor, lineWidth: max(5, w * 0.030))
                    .overlay(
                        RoundedRectangle(cornerRadius: 0)
                            .strokeBorder(Color.black.opacity(0.10), lineWidth: 1)
                            .padding(max(5, w * 0.030))
                    )

                // 名字小铭牌（右下角窗台上）
                Text(petName)
                    .font(.system(size: max(9, w * 0.030), weight: .semibold, design: .rounded))
                    .foregroundStyle(Color(red: 0.45, green: 0.38, blue: 0.30))
                    .padding(.horizontal, 7).padding(.vertical, 2.5)
                    .background(Capsule().fill(Color.white.opacity(0.85)))
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                    .padding([.bottom, .trailing], max(8, w * 0.045))
            }
        }
    }
}

/// 透明风格：壁纸裁剪图打底，宠物直接坐在壁纸上
struct TransparentSceneView<PetView: View>: View {
    let familyKey: String
    let copyLine: String
    let petName: String
    @ViewBuilder let petView: () -> PetView

    var body: some View {
        GeometryReader { geo in
            ZStack {
                if let url = SharedStore.transparentBGURL(family: familyKey),
                   let ui = UIImage(contentsOfFile: url.path) {
                    Image(uiImage: ui)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: geo.size.width, height: geo.size.height)
                        .clipped()
                } else {
                    // 未配置壁纸时给个中性深色底 + 提示
                    Color(red: 0.12, green: 0.12, blue: 0.14)
                    Text("在 App「组件」里设置透明背景")
                        .font(.system(size: 10))
                        .foregroundStyle(.white.opacity(0.5))
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                        .padding(.top, 8)
                }

                VStack(spacing: 4) {
                    Spacer(minLength: 0)
                    ZStack(alignment: .bottom) {
                        Ellipse()
                            .fill(Color.black.opacity(0.25))
                            .frame(width: geo.size.width * 0.40, height: geo.size.height * 0.05)
                            .blur(radius: 4)
                        petView()
                            .frame(height: geo.size.height * 0.58)
                    }
                    Text(copyLine)
                        .font(.system(size: max(10, geo.size.width * 0.032), weight: .medium, design: .rounded))
                        .foregroundStyle(.white)
                        .shadow(color: .black.opacity(0.6), radius: 2, y: 1)
                        .lineLimit(1)
                        .padding(.bottom, geo.size.height * 0.06)
                }
            }
        }
    }
}
