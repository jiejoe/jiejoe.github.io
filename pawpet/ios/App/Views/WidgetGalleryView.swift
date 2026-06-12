import SwiftUI
import PhotosUI
import WidgetKit

/// 组件 Tab：风格切换（卡片/窗台/透明）+ 所见即所得预览 + 透明背景设置
struct WidgetGalleryView: View {
    @EnvironmentObject var petStore: PetStore
    @State private var style: WidgetSceneStyle = SharedStore.widgetStyle
    @State private var showHowTo = false
    @State private var showTransparentSetup = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 22) {
                    stylePicker

                    if style == .transparent {
                        transparentHint
                    }

                    ForEach(petStore.pets) { pet in
                        petSection(pet)
                    }

                    Button { showHowTo = true } label: {
                        Label("怎么把组件放到桌面？", systemImage: "questionmark.circle")
                            .font(.subheadline)
                    }
                    .padding(.bottom, 90)
                }
                .padding(.top, 12)
            }
            .navigationTitle("桌面组件")
            .sheet(isPresented: $showHowTo) { HowToAddWidgetSheet() }
            .sheet(isPresented: $showTransparentSetup) { TransparentSetupSheet() }
        }
    }

    // MARK: 风格切换

    private var stylePicker: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("组件风格").font(.headline).padding(.horizontal, 20)
            Picker("风格", selection: $style) {
                ForEach(WidgetSceneStyle.allCases, id: \.self) { s in
                    Text(s.displayName).tag(s)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 20)
            .onChange(of: style) {
                SharedStore.widgetStyle = style
                WidgetCenter.shared.reloadAllTimelines()
            }
        }
    }

    private var transparentHint: some View {
        Button { showTransparentSetup = true } label: {
            HStack(spacing: 12) {
                Image(systemName: "wand.and.rays")
                VStack(alignment: .leading, spacing: 2) {
                    Text("设置透明背景").font(.subheadline.bold())
                    Text("导入一张空桌面截图，宠物就像直接趴在壁纸上")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "chevron.right").font(.caption)
            }
            .padding(14)
            .background(RoundedRectangle(cornerRadius: 14).fill(Color.accentColor.opacity(0.1)))
            .padding(.horizontal, 20)
        }
        .buttonStyle(.plain)
    }

    // MARK: 每只宠物的预览

    private func petSection(_ pet: Pet) -> some View {
        let theme = PetTheme.theme(for: pet.persona)
        let slot = TimeSlot.slot()
        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("\(pet.name)的组件").font(.headline)
                Text(pet.persona.displayName)
                    .font(.caption2)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(Capsule().fill(theme.nameChip))
                    .foregroundStyle(theme.accent)
                Spacer()
                if pet.id == petStore.selectedPetID {
                    Label("组件展示中", systemImage: "checkmark.circle.fill")
                        .font(.caption).foregroundStyle(.green)
                } else {
                    Button("用这只") { petStore.select(petID: pet.id) }
                        .font(.caption.bold())
                        .buttonStyle(.bordered)
                }
            }
            .padding(.horizontal, 20)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(alignment: .top, spacing: 14) {
                    preview(pet: pet, slot: slot, familyKey: "small")
                        .frame(width: 158, height: 158)
                        .clipShape(RoundedRectangle(cornerRadius: 24))
                    preview(pet: pet, slot: slot, familyKey: "medium")
                        .frame(width: 338, height: 158)
                        .clipShape(RoundedRectangle(cornerRadius: 24))
                }
                .padding(.horizontal, 20)
            }
        }
    }

    @ViewBuilder
    private func preview(pet: Pet, slot: TimeSlot, familyKey: String) -> some View {
        switch style {
        case .window:
            WindowSceneView(slot: slot, petName: pet.name,
                            copyLine: CopyLibrary.line(persona: pet.persona, slot: slot, petName: pet.name),
                            showGreeting: familyKey != "small") {
                PetFrameImage(petID: pet.id, action: slot.action(for: pet))
            }
        case .transparent:
            TransparentSceneView(familyKey: familyKey,
                                 copyLine: CopyLibrary.line(persona: pet.persona, slot: slot, petName: pet.name),
                                 petName: pet.name) {
                PetFrameImage(petID: pet.id, action: slot.action(for: pet))
            }
        case .card:
            if familyKey == "small" {
                WidgetPreviewSmall(pet: pet, slot: slot)
            } else {
                WidgetPreviewMedium(pet: pet, slot: slot)
            }
        }
    }
}

// MARK: - 透明背景设置：截图 + 拖框选区

struct TransparentSetupSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var photoItem: PhotosPickerItem?
    @State private var screenshot: UIImage?
    @State private var familyKey = "small"
    @State private var boxCenter: CGPoint = .zero
    @State private var saved = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Text("1️⃣ 长按桌面进入编辑 → 左滑到最后一页截图空桌面\n2️⃣ 导入截图，把选框拖到你打算放组件的位置")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 20)

                Picker("尺寸", selection: $familyKey) {
                    Text("小组件").tag("small")
                    Text("中组件").tag("medium")
                    Text("大组件").tag("large")
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 20)

                if let shot = screenshot {
                    cropper(shot)
                } else {
                    PhotosPicker(selection: $photoItem, matching: .screenshots) {
                        VStack(spacing: 10) {
                            Image(systemName: "photo.badge.plus").font(.largeTitle)
                            Text("导入空桌面截图")
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 260)
                        .background(RoundedRectangle(cornerRadius: 16)
                            .strokeBorder(style: StrokeStyle(lineWidth: 1.5, dash: [6])))
                        .padding(.horizontal, 20)
                    }
                }

                if screenshot != nil {
                    Button {
                        saveCrop()
                    } label: {
                        Text(saved ? "已保存 ✓ 组件即刻生效" : "保存这个位置")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(RoundedRectangle(cornerRadius: 14)
                                .fill(saved ? Color.green : Color.accentColor))
                            .foregroundStyle(.white)
                    }
                    .padding(.horizontal, 20)
                }
                Spacer(minLength: 0)
            }
            .padding(.top, 12)
            .navigationTitle("透明组件设置")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) { Button("完成") { dismiss() } }
            }
            .onChange(of: photoItem) {
                Task {
                    if let item = photoItem,
                       let data = try? await item.loadTransferable(type: Data.self),
                       let img = UIImage(data: data) {
                        screenshot = img
                        saved = false
                    }
                }
            }
            .onChange(of: familyKey) { saved = false }
        }
    }

    /// 选框宽高占屏宽的比例（按 iOS 通用组件占位近似）
    private var boxFraction: (w: CGFloat, h: CGFloat) {
        switch familyKey {
        case "medium": return (0.84, 0.395)
        case "large": return (0.84, 0.84)
        default: return (0.395, 0.395)
        }
    }

    private func cropper(_ shot: UIImage) -> some View {
        GeometryReader { geo in
            let imgAspect = shot.size.width / shot.size.height
            let viewW = geo.size.width
            let viewH = viewW / imgAspect
            let boxW = viewW * boxFraction.w
            let boxH = viewW * boxFraction.h
            let center = boxCenter == .zero ? CGPoint(x: viewW / 2, y: viewH / 3) : boxCenter

            ZStack {
                Image(uiImage: shot)
                    .resizable()
                    .frame(width: viewW, height: viewH)

                // 暗化 + 选框
                Color.black.opacity(0.45)
                    .frame(width: viewW, height: viewH)
                    .reverseMask {
                        RoundedRectangle(cornerRadius: 22)
                            .frame(width: boxW, height: boxH)
                            .position(center)
                    }
                RoundedRectangle(cornerRadius: 22)
                    .strokeBorder(Color.white, lineWidth: 2)
                    .frame(width: boxW, height: boxH)
                    .position(center)
                    .gesture(
                        DragGesture()
                            .onChanged { v in
                                boxCenter = CGPoint(
                                    x: min(max(v.location.x, boxW / 2), viewW - boxW / 2),
                                    y: min(max(v.location.y, boxH / 2), viewH - boxH / 2))
                            }
                    )
            }
            .frame(width: viewW, height: viewH)
            .clipped()
            .contentShape(Rectangle())
        }
        .aspectRatio(screenshot!.size.width / screenshot!.size.height, contentMode: .fit)
        .padding(.horizontal, 20)
    }

    private func saveCrop() {
        guard let shot = screenshot else { return }
        // 视图坐标 → 图片像素坐标
        let scale = shot.size.width / (UIScreen.main.bounds.width - 40)
        let viewW = UIScreen.main.bounds.width - 40
        let viewH = viewW / (shot.size.width / shot.size.height)
        let boxW = viewW * boxFraction.w
        let boxH = viewW * boxFraction.h
        let center = boxCenter == .zero ? CGPoint(x: viewW / 2, y: viewH / 3) : boxCenter
        let cropRect = CGRect(x: (center.x - boxW / 2) * scale,
                              y: (center.y - boxH / 2) * scale,
                              width: boxW * scale,
                              height: boxH * scale)
        guard let cg = shot.cgImage?.cropping(to: cropRect) else { return }
        let out = UIImage(cgImage: cg)
        guard let url = SharedStore.transparentBGURL(family: familyKey),
              let data = out.pngData() else { return }
        try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(),
                                                 withIntermediateDirectories: true)
        try? data.write(to: url)
        saved = true
        WidgetCenter.shared.reloadAllTimelines()
    }
}

/// 反向遮罩：挖洞效果
extension View {
    func reverseMask<M: View>(@ViewBuilder _ mask: () -> M) -> some View {
        self.mask {
            ZStack {
                Rectangle()
                mask().blendMode(.destinationOut)
            }
            .compositingGroup()
        }
    }
}

// MARK: - 卡片风格预览（与 Widget 同款）

struct WidgetPreviewSmall: View {
    let pet: Pet
    let slot: TimeSlot

    var body: some View {
        let theme = PetTheme.theme(for: pet.persona)
        let action = slot.action(for: pet)
        ZStack {
            theme.gradient
            VStack(spacing: 4) {
                HStack {
                    Text(pet.name)
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundStyle(theme.textPrimary)
                    Spacer()
                    Text(theme.sceneDecor).font(.system(size: 12))
                }
                Spacer()
                PetFrameImage(petID: pet.id, action: action)
                    .frame(maxHeight: 76)
                Spacer()
                Text(CopyLibrary.line(persona: pet.persona, slot: slot, petName: pet.name))
                    .font(.system(size: 10, weight: .medium, design: .rounded))
                    .foregroundStyle(theme.textSecondary)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
            }
            .padding(12)
        }
    }
}

struct WidgetPreviewMedium: View {
    let pet: Pet
    let slot: TimeSlot

    var body: some View {
        let theme = PetTheme.theme(for: pet.persona)
        let action = slot.action(for: pet)
        ZStack {
            theme.gradient
            HStack(spacing: 14) {
                PetFrameImage(petID: pet.id, action: action)
                    .frame(width: 110, height: 110)
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 6) {
                        Text(slot.greeting)
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                            .foregroundStyle(theme.textPrimary)
                        Text(theme.sceneDecor).font(.system(size: 13))
                    }
                    Text(CopyLibrary.line(persona: pet.persona, slot: slot, petName: pet.name))
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(theme.textPrimary.opacity(0.85))
                        .lineLimit(2)
                    Spacer(minLength: 2)
                    Text(CopyLibrary.companionLine(days: pet.daysTogether))
                        .font(.system(size: 11, design: .rounded))
                        .foregroundStyle(theme.textSecondary)
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .background(Capsule().fill(theme.nameChip))
                }
                Spacer(minLength: 0)
            }
            .padding(16)
        }
    }
}

struct HowToAddWidgetSheet: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 20) {
                step(1, "长按手机桌面空白处，进入编辑模式")
                step(2, "点左上角「+」，搜索「爪爪桌宠」")
                step(3, "选择喜欢的尺寸，点「添加小组件」")
                step(4, "在 App 里切换宠物和风格，组件会跟着换")
                Spacer()
            }
            .padding(24)
            .navigationTitle("添加组件教程")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("知道了") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium])
    }

    private func step(_ n: Int, _ text: String) -> some View {
        HStack(alignment: .top, spacing: 14) {
            Text("\(n)")
                .font(.headline)
                .frame(width: 30, height: 30)
                .background(Circle().fill(Color.accentColor.opacity(0.15)))
                .foregroundStyle(Color.accentColor)
            Text(text).font(.body)
        }
    }
}
