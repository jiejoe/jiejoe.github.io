import SwiftUI
import AVFoundation
import WidgetKit

/// 触觉反馈：常驻 generator + prepare，避免首次触发被系统丢弃
enum Haptics {
    private static let impact = UIImpactFeedbackGenerator(style: .medium)
    private static let notify = UINotificationFeedbackGenerator()
    private static let light = UIImpactFeedbackGenerator(style: .light)

    static func pat() {
        impact.prepare()
        impact.impactOccurred(intensity: 1.0)
    }
    static func success() {
        notify.prepare()
        notify.notificationOccurred(.success)
    }
    static func tick() {
        light.prepare()
        light.impactOccurred(intensity: 0.7)
    }
}

/// 小窝：宠物互动主页。视频状态机沿用 PRD 设计：
/// idle 默认；摸它 → happy；30s 没动静 → yawn；更久 → sleep；随机 lick/stretch
struct HomeView: View {
    @EnvironmentObject var petStore: PetStore
    @State private var action: PetAction = .idle
    @State private var copyLine: String = ""
    @State private var idleTicks = 0
    @State private var heartBurst = false
    @State private var foodDrop = false
    @State private var soundPlayer: AVAudioPlayer?

    private let timer = Timer.publish(every: 5, on: .main, in: .common).autoconnect()

    var pet: Pet { petStore.selectedPet }
    var theme: PetTheme { PetTheme.theme(for: pet.persona) }

    var body: some View {
        ZStack {
            theme.gradient.ignoresSafeArea()

            VStack(spacing: 0) {
                header
                Spacer()
                bubble
                    .padding(.bottom, 18)
                petStage
                Spacer()
                Spacer()
            }
        }
        .onAppear { refreshCopy() }
        .onChange(of: petStore.selectedPetID) {
            action = .idle
            idleTicks = 0
            refreshCopy()
        }
        .onReceive(timer) { _ in tick() }
    }

    // MARK: 顶部：宠物切换 + 陪伴天数

    private var header: some View {
        VStack(spacing: 10) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(petStore.pets) { p in
                        Button { petStore.select(petID: p.id) } label: {
                            VStack(spacing: 4) {
                                PetFrameImage(petID: p.id, action: .idle)
                                    .frame(width: 44, height: 44)
                                    .padding(5)
                                    .background(
                                        Circle().fill(p.id == petStore.selectedPetID
                                                      ? theme.accent.opacity(0.25)
                                                      : Color.white.opacity(0.5))
                                    )
                                Text(p.name)
                                    .font(.caption2)
                                    .foregroundStyle(theme.textPrimary)
                            }
                        }
                    }
                }
                .padding(.horizontal, 20)
            }
            .frame(height: 78)
            HStack(spacing: 8) {
                Text(CopyLibrary.companionLine(days: pet.daysTogether))
                if SharedStore.giftCount > 0 {
                    Text("🧺 宝贝 ×\(SharedStore.giftCount)")
                        .padding(.horizontal, 8).padding(.vertical, 2)
                        .background(Capsule().fill(Color.white.opacity(0.5)))
                }
            }
            .font(.footnote)
            .foregroundStyle(theme.textSecondary)
            actionBar
        }
        .padding(.top, 20)
    }

    // MARK: 舞台

    private var petStage: some View {
        ZStack {
            Ellipse()
                .fill(Color.black.opacity(0.10))
                .frame(width: 230, height: 26)
                .blur(radius: 10)
                .offset(y: 168)

            if action == .sleep {
                Text("💤").font(.system(size: 32)).offset(x: 110, y: -140)
            }

            Group {
                if let url = PetMedia.videoURL(petID: pet.id, action: availableAction) {
                    LoopingVideoView(url: url)
                } else {
                    PetFrameImage(petID: pet.id, action: availableAction)
                }
            }
            .frame(width: 350, height: 350)
            .onTapGesture { pat() }

            if heartBurst {
                ForEach(0..<6, id: \.self) { i in
                    Text(["💕", "✨", "💖", "⭐", "💫", "🩷"][i])
                        .font(.system(size: 24))
                        .offset(x: CGFloat.random(in: -110...110),
                                y: CGFloat.random(in: -170 ... -70))
                        .transition(.scale.combined(with: .opacity))
                }
            }

            // 喂食：粮粒从上方落到宠物嘴边
            if foodDrop {
                ForEach(0..<4, id: \.self) { i in
                    Text(["🍖", "🐟", "🥫", "🍗"][i])
                        .font(.system(size: 20))
                        .offset(x: CGFloat(i - 2) * 28 + 14, y: foodDrop ? 80 : -180)
                        .opacity(foodDrop ? 0 : 1)
                        .animation(.easeIn(duration: 0.8).delay(Double(i) * 0.12), value: foodDrop)
                }
            }
        }
        .animation(.spring(response: 0.4), value: heartBurst)
    }

    /// 宠物没这个动作素材时回退：优先 idle，其次它拥有的第一个动作
    private var availableAction: PetAction {
        if pet.actions.contains(action) { return action }
        return pet.actions.contains(.idle) ? .idle : (pet.actions.first ?? .idle)
    }

    // MARK: 台词气泡 & 动作按钮

    private var bubble: some View {
        Text(copyLine)
            .font(.system(size: 16, weight: .medium, design: .rounded))
            .foregroundStyle(theme.textPrimary)
            .padding(.horizontal, 18)
            .padding(.vertical, 10)
            .background(Capsule().fill(theme.bubbleBackground))
    }

    /// 互动条：动词 + emoji，简单直接
    private var actionBar: some View {
        let interactions: [(emoji: String, verb: String, target: PetAction)] = [
            ("🖐", "摸摸", .happy), ("🍖", "喂饭", .eat), ("🦴", "遛弯", .walk),
            ("🫧", "洗脸", .lick), ("🙃", "翻肚皮", .belly), ("🧘", "伸懒腰", .stretch),
            ("😴", "哄睡", .sleep),
        ].filter { pet.actions.contains($0.target) }

        return ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(interactions, id: \.verb) { item in
                    Button {
                        if item.target == .happy { pat() }
                        else if item.target == .eat { feed() }
                        else { Haptics.tick(); play(item.target) }
                    } label: {
                        HStack(spacing: 5) {
                            Text(item.emoji).font(.system(size: 15))
                            Text(item.verb)
                                .font(.system(size: 14, weight: .semibold, design: .rounded))
                        }
                        .padding(.horizontal, 13)
                        .padding(.vertical, 9)
                        .background(
                            Capsule().fill(item.target == action ? theme.accent : Color.white.opacity(0.65))
                        )
                        .foregroundStyle(item.target == action ? Color.white : theme.textPrimary)
                    }
                }
            }
            .padding(.horizontal, 20)
        }
    }

    // MARK: 行为

    private func pat() {
        play(.happy)
        heartBurst = true
        Haptics.pat() // 触觉：像真的摸到了
        SharedStore.recordInteraction("pat")
        WidgetCenter.shared.reloadAllTimelines() // 组件马上"记得"这次抚摸
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { heartBurst = false }
    }

    private func feed() {
        foodDrop = false
        play(.eat)
        Haptics.success()
        SharedStore.recordInteraction("feed")
        WidgetCenter.shared.reloadAllTimelines()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { foodDrop = true }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.6) { foodDrop = false }
    }

    private func play(_ a: PetAction) {
        action = a
        idleTicks = 0
        // 做什么就说什么：动作专属台词（按实际能播的动作取，避免文不对景）
        let played = pet.actions.contains(a) ? a : .idle
        copyLine = CopyLibrary.actionLine(played, persona: pet.persona, petName: pet.name)
        if let url = PetMedia.soundURL(petID: pet.id, action: played) {
            soundPlayer = try? AVAudioPlayer(contentsOf: url)
            soundPlayer?.volume = 0.5
            soundPlayer?.play()
        }
    }

    /// 5 秒一拍的状态机：无操作逐步 yawn → sleep，偶尔随机小动作。
    /// 自主行为也带专属台词——它做什么就嘟囔什么
    private func tick() {
        idleTicks += 1
        switch idleTicks {
        case 6: autoPlay(.yawn)          // 30s
        case 8: autoPlay(.idle)
        case 12: autoPlay(.walk)         // 60s 遛个弯
        case 14: autoPlay(.idle)
        case 24: autoPlay(.sleep)        // 120s 睡了
        default:
            if action == .idle && idleTicks % 5 == 0 && Bool.random() {
                let a = [.lick, .stretch].filter { pet.actions.contains($0) }.randomElement()
                autoPlay(a ?? .idle)
            } else if [.lick, .stretch].contains(action) && idleTicks % 2 == 0 {
                autoPlay(.idle)
            } else if action == .idle && idleTicks % 4 == 0 {
                refreshCopy() // 发呆时换换心里话
            }
        }
    }

    /// 自主行为：换动作 + 配台词，但不打断"无操作计时"
    private func autoPlay(_ a: PetAction) {
        guard pet.actions.contains(a) || a == .idle else { return }
        action = a
        copyLine = CopyLibrary.actionLine(a, persona: pet.persona, petName: pet.name)
    }

    private func refreshCopy() {
        copyLine = CopyLibrary.line(
            persona: pet.persona,
            slot: TimeSlot.slot(),
            petName: pet.name,
            seed: Int.random(in: 0..<1000)
        )
    }
}

/// 静态姿势帧（组件帧复用做头像/回退）
struct PetFrameImage: View {
    let petID: String
    let action: PetAction

    var body: some View {
        if let url = PetMedia.frameURL(petID: petID, action: action),
           let img = UIImage(contentsOfFile: url.path) {
            Image(uiImage: img)
                .resizable()
                .scaledToFit()
        } else {
            Text("🐾").font(.system(size: 30))
        }
    }
}
