import SwiftUI

/// 组件 Tab：预览每只宠物的桌面组件设计 + 添加教程
struct WidgetGalleryView: View {
    @EnvironmentObject var petStore: PetStore
    @State private var showHowTo = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 28) {
                    ForEach(petStore.pets) { pet in
                        petSection(pet)
                    }

                    Button { showHowTo = true } label: {
                        Label("怎么把组件放到桌面？", systemImage: "questionmark.circle")
                            .font(.subheadline)
                    }
                    .padding(.bottom, 24)
                }
                .padding(.top, 12)
            }
            .navigationTitle("桌面组件")
            .sheet(isPresented: $showHowTo) { HowToAddWidgetSheet() }
        }
    }

    private func petSection(_ pet: Pet) -> some View {
        let theme = PetTheme.theme(for: pet.persona)
        let slot = TimeSlot.slot()
        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("\(pet.name)的组件")
                    .font(.headline)
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
                    // 小组件预览
                    WidgetPreviewSmall(pet: pet, slot: slot)
                        .frame(width: 158, height: 158)
                    // 中组件预览
                    WidgetPreviewMedium(pet: pet, slot: slot)
                        .frame(width: 338, height: 158)
                }
                .padding(.horizontal, 20)
            }
        }
    }
}

// MARK: - 与 Widget 同款的预览视图（设计稿即真实组件）

struct WidgetPreviewSmall: View {
    let pet: Pet
    let slot: TimeSlot

    var body: some View {
        let theme = PetTheme.theme(for: pet.persona)
        let action = slot.action(for: pet)
        ZStack {
            RoundedRectangle(cornerRadius: 24).fill(theme.gradient)
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
            RoundedRectangle(cornerRadius: 24).fill(theme.gradient)
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
                step(4, "在 App 里切换宠物，组件会跟着换")
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
