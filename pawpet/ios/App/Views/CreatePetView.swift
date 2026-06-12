import SwiftUI
import PhotosUI

/// 领养：示例展示 → 上传照片 → 生成进度 → 入驻小窝
struct CreatePetView: View {
    @EnvironmentObject var petStore: PetStore
    @EnvironmentObject var purchases: PurchaseManager

    enum Phase: Equatable {
        case intro
        case picking
        case naming(UIImage)
        case generating(petID: String)
        case done(petID: String)
        case failed(String)
    }

    @State private var phase: Phase = .intro
    @State private var quota: GeneratorAPI.Quota?
    @State private var photoItem: PhotosPickerItem?
    @State private var petName = ""
    @State private var progressMessage = "排队中…"
    @State private var progressStep = 0
    @State private var showPaywall = false

    var body: some View {
        NavigationStack {
            ScrollView {
                switch phase {
                case .intro, .picking:
                    introSection
                case .naming(let img):
                    namingSection(img)
                case .generating:
                    generatingSection
                case .done(let petID):
                    doneSection(petID)
                case .failed(let msg):
                    failedSection(msg)
                }
            }
            .navigationTitle("领养专属桌宠")
            .task { quota = try? await GeneratorAPI.fetchQuota() }
            .sheet(isPresented: $showPaywall) {
                PaywallView { startAfterPaid() }
            }
        }
    }

    // MARK: 示例 + 入口

    private var introSection: some View {
        VStack(spacing: 24) {
            // 免费名额横幅
            if let q = quota {
                HStack(spacing: 8) {
                    Image(systemName: "gift.fill")
                    Text(q.free_remaining > 0
                         ? "今日免费名额还剩 \(q.free_remaining) 个，先到先得"
                         : "今日 5 个免费名额已抢完，明天早点来～")
                        .font(.footnote.weight(.medium))
                }
                .padding(.horizontal, 14).padding(.vertical, 10)
                .background(Capsule().fill(Color.pink.opacity(0.12)))
                .foregroundStyle(.pink)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("一张照片，养一只一模一样的桌宠")
                    .font(.title3.bold())
                Text("上传你家毛孩子的照片，AI 会生成神还原的虚拟分身：8 个透明背景小动作，住进你的手机桌面。")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)

            // 真实示例：内置宠物就是生成效果
            VStack(alignment: .leading, spacing: 12) {
                Text("生成效果示例").font(.headline).padding(.horizontal, 20)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 14) {
                        ForEach(Pet.builtIns.prefix(3)) { p in
                            SampleCard(pet: p)
                        }
                    }
                    .padding(.horizontal, 20)
                }
            }

            PhotosPicker(selection: $photoItem, matching: .images) {
                Label("选一张宠物照片", systemImage: "photo.on.rectangle.angled")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(RoundedRectangle(cornerRadius: 16).fill(Color.accentColor))
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 20)
            .onChange(of: photoItem) {
                Task {
                    if let item = photoItem,
                       let data = try? await item.loadTransferable(type: Data.self),
                       let img = UIImage(data: data) {
                        phase = .naming(img)
                    }
                }
            }

            Text("生成约需 5-8 分钟 · 正脸全身照效果最佳")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 16)
    }

    // MARK: 起名 & 确认

    private func namingSection(_ img: UIImage) -> some View {
        VStack(spacing: 20) {
            Image(uiImage: img)
                .resizable().scaledToFill()
                .frame(width: 220, height: 220)
                .clipShape(RoundedRectangle(cornerRadius: 24))

            TextField("给它起个名字", text: $petName)
                .textFieldStyle(.roundedBorder)
                .padding(.horizontal, 40)

            let free = quota?.is_free_for_me == true || (quota?.free_remaining ?? 0) > 0
            let hasCredit = purchases.generationCredits > 0

            Button {
                if free || hasCredit {
                    start(photo: img)
                } else {
                    showPaywall = true
                }
            } label: {
                Text(free ? "免费生成（今日名额内）"
                     : hasCredit ? "开始生成（剩 \(purchases.generationCredits) 次）"
                     : "解锁生成 ¥18 起")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(RoundedRectangle(cornerRadius: 16).fill(Color.accentColor))
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 20)
            .disabled(petName.isEmpty)

            Button("换一张") { phase = .intro; photoItem = nil }
                .font(.subheadline)
        }
        .padding(.vertical, 24)
    }

    // MARK: 生成中

    private var generatingSection: some View {
        VStack(spacing: 24) {
            PetFrameImage(petID: "uni", action: .idle)
                .frame(width: 140, height: 140)
                .opacity(0.9)
            Text("你的毛孩子正在苏醒中… 🐾")
                .font(.title3.bold())
            ProgressView(value: Double(progressStep), total: 5)
                .padding(.horizontal, 60)
            Text(progressMessage)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text("可以先去逛逛，好了会在这里等你")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 60)
    }

    private func doneSection(_ petID: String) -> some View {
        VStack(spacing: 20) {
            PetFrameImage(petID: petID, action: .idle)
                .frame(width: 220, height: 220)
            Text("\(petName) 来啦！").font(.title2.bold())
            Text("已入驻小窝，把它的组件添加到桌面吧")
                .foregroundStyle(.secondary)
            Button {
                petStore.select(petID: petID)
                phase = .intro
                photoItem = nil
                petName = ""
            } label: {
                Text("去看看它")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(RoundedRectangle(cornerRadius: 16).fill(Color.accentColor))
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 20)
        }
        .padding(.vertical, 40)
    }

    private func failedSection(_ msg: String) -> some View {
        VStack(spacing: 16) {
            Text("😿 生成没成功").font(.title3.bold())
            Text(msg).font(.subheadline).foregroundStyle(.secondary)
            Text("生成失败不扣次数/名额")
                .font(.caption).foregroundStyle(.tertiary)
            Button("再试一次") { phase = .intro }
                .buttonStyle(.borderedProminent)
        }
        .padding(.vertical, 60)
    }

    // MARK: 流程

    private func start(photo: UIImage) {
        Task {
            do {
                let free = quota?.is_free_for_me == true || (quota?.free_remaining ?? 0) > 0
                if !free { purchases.consumeCredit() }
                let petID = try await GeneratorAPI.createPet(
                    photo: photo, name: petName,
                    receipt: free ? nil : "credit") // TODO: 上线换成真实收据
                phase = .generating(petID: petID)
                await poll(petID: petID)
            } catch GeneratorAPI.GenerationError.paymentRequired {
                showPaywall = true
                phase = .intro
            } catch {
                phase = .failed(error.localizedDescription)
            }
        }
    }

    private func startAfterPaid() {
        if case .naming(let img) = phase { start(photo: img) }
    }

    private func poll(petID: String) async {
        while true {
            try? await Task.sleep(for: .seconds(5))
            guard let s = try? await GeneratorAPI.status(petID: petID) else { continue }
            progressMessage = s.message ?? ""
            progressStep = s.step ?? 0
            if s.status == "ready" {
                do {
                    try await GeneratorAPI.downloadBundle(petID: petID)
                } catch {
                    phase = .failed("资产下载失败：\(error.localizedDescription)")
                    return
                }
                // 按实际下载到的姿势帧登记动作（生成动作数可能少于全集）
                let actions = PetAction.allCases.filter { a in
                    guard let url = PetMedia.containerURL(petID: petID)?
                        .appendingPathComponent("frames/\(a.rawValue).png") else { return false }
                    return FileManager.default.fileExists(atPath: url.path)
                }
                let pet = Pet(id: petID, name: petName, species: .cat, persona: .clingy,
                              isBuiltIn: false, adoptionDate: Date(),
                              actions: actions.isEmpty ? [.idle] : actions)
                petStore.register(custom: pet)
                phase = .done(petID: petID)
                return
            }
            if s.status == "failed" {
                phase = .failed(s.error ?? "未知错误")
                return
            }
        }
    }
}

/// 示例卡片：角色图 + 动作帧 排成「照片 → 桌宠」的对比
struct SampleCard: View {
    let pet: Pet

    var body: some View {
        let theme = PetTheme.theme(for: pet.persona)
        VStack(spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 20).fill(theme.gradient)
                VStack(spacing: 6) {
                    if let url = PetMedia.characterImageURL(petID: pet.id),
                       let img = UIImage(contentsOfFile: url.path) {
                        Image(uiImage: img)
                            .resizable().scaledToFill()
                            .frame(width: 84, height: 84)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                    Image(systemName: "arrow.down")
                        .font(.caption.bold())
                        .foregroundStyle(theme.accent)
                    PetFrameImage(petID: pet.id, action: .happy)
                        .frame(width: 110, height: 110)
                }
                .padding(.vertical, 14)
            }
            .frame(width: 160, height: 260)
            Text("\(pet.name) · \(pet.persona.displayName)")
                .font(.caption.weight(.medium))
                .foregroundStyle(.secondary)
        }
    }
}
