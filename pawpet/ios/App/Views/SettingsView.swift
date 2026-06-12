import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var petStore: PetStore
    @EnvironmentObject var purchases: PurchaseManager
    @State private var showPaywall = false

    var body: some View {
        NavigationStack {
            List {
                Section("我的宠物") {
                    ForEach(petStore.pets) { pet in
                        HStack {
                            PetFrameImage(petID: pet.id, action: .idle)
                                .frame(width: 40, height: 40)
                            VStack(alignment: .leading) {
                                Text(pet.name)
                                Text("\(pet.persona.displayName) · 陪伴 \(pet.daysTogether) 天")
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            if !pet.isBuiltIn {
                                Text("专属").font(.caption2)
                                    .padding(.horizontal, 6).padding(.vertical, 2)
                                    .background(Capsule().fill(Color.pink.opacity(0.15)))
                                    .foregroundStyle(.pink)
                            }
                        }
                    }
                }

                Section("会员") {
                    HStack {
                        Text("生成次数")
                        Spacer()
                        Text("\(purchases.generationCredits) 次").foregroundStyle(.secondary)
                    }
                    HStack {
                        Text("Pro 会员")
                        Spacer()
                        Text(purchases.isPro ? "已开通" : "未开通").foregroundStyle(.secondary)
                    }
                    Button("购买 / 升级") { showPaywall = true }
                    Button("恢复购买") { Task { await purchases.restore() } }
                }

                Section("关于") {
                    Link("隐私政策", destination: URL(string: "https://pawpet.app/privacy")!)
                    Link("服务条款", destination: URL(string: "https://pawpet.app/terms")!)
                    HStack {
                        Text("版本")
                        Spacer()
                        Text("1.0.0").foregroundStyle(.secondary)
                    }
                    // 上架中国区前补充 ICP 备案号
                    Text("照片仅用于生成你的专属桌宠，生成完成后服务器不保留原图")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }
            .navigationTitle("我的")
            .sheet(isPresented: $showPaywall) { PaywallView() }
        }
    }
}
