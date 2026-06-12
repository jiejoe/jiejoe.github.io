import SwiftUI
import WidgetKit

/// 组件 Tab：所见即所得预览（与 Widget 同一套视图），没有选择题
struct WidgetGalleryView: View {
    @EnvironmentObject var petStore: PetStore
    @State private var showHowTo = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 22) {
                    Text("组件随时间自己生活：清晨醒来、中午干饭、深夜入睡，姿势和悄悄话每一刻钟换一次")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 20)

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
        }
    }

    private func petSection(_ pet: Pet) -> some View {
        let theme = PetTheme.theme(for: pet.persona)
        let slot = TimeSlot.slot()
        let line = CopyLibrary.line(persona: pet.persona, slot: slot,
                                    petName: pet.name, seed: CopyLibrary.quarterSeed())
        let companion = CopyLibrary.milestoneLine(days: pet.daysTogether)
            ?? CopyLibrary.companionLine(days: pet.daysTogether)
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
                    ZStack {
                        AmbientBackground(slot: slot, persona: pet.persona)
                        AmbientSmallView(slot: slot, copyLine: line) {
                            PetFrameImage(petID: pet.id, action: slot.action(for: pet))
                        }
                    }
                    .frame(width: 158, height: 158)
                    .clipShape(RoundedRectangle(cornerRadius: 28))
                    .shadow(color: .black.opacity(0.08), radius: 8, y: 4)

                    ZStack {
                        AmbientBackground(slot: slot, persona: pet.persona)
                        AmbientMediumView(slot: slot, copyLine: line, companionLine: companion) {
                            PetFrameImage(petID: pet.id, action: slot.action(for: pet))
                        }
                    }
                    .frame(width: 338, height: 158)
                    .clipShape(RoundedRectangle(cornerRadius: 28))
                    .shadow(color: .black.opacity(0.08), radius: 8, y: 4)
                }
                .padding(.horizontal, 20)
            }
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
                step(4, "想要玻璃质感：长按桌面 → 自定义 → 透明，系统会给组件真正的玻璃效果")
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
