import SwiftUI
import StoreKit

struct PaywallView: View {
    @EnvironmentObject var purchases: PurchaseManager
    @Environment(\.dismiss) private var dismiss
    var onPurchased: () -> Void = {}

    @State private var purchasing = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // 头图：三只示例宠物
                    HStack(spacing: -20) {
                        PetFrameImage(petID: "juju", action: .idle).frame(width: 90, height: 90)
                        PetFrameImage(petID: "dollar", action: .happy).frame(width: 110, height: 110)
                        PetFrameImage(petID: "mixian", action: .idle).frame(width: 90, height: 90)
                    }
                    .padding(.top, 20)

                    VStack(spacing: 6) {
                        Text("把你家毛孩子带进手机桌面")
                            .font(.title3.bold())
                        Text("AI 神还原 · 8 个透明小动作 · 专属桌面组件")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        benefit("wand.and.stars", "上传照片生成专属桌宠，毛色花纹神还原")
                        benefit("square.grid.2x2", "解锁全部组件样式与多宠轮播")
                        benefit("heart.fill", "每天不同时段的姿势与暖心台词")
                        benefit("gift.fill", "每日前 5 名用户免费生成 1 次")
                    }
                    .padding(20)
                    .background(RoundedRectangle(cornerRadius: 20).fill(Color(.secondarySystemBackground)))
                    .padding(.horizontal, 20)

                    // 商品
                    VStack(spacing: 12) {
                        ForEach(purchases.products, id: \.id) { product in
                            Button {
                                buy(product)
                            } label: {
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(productTitle(product.id)).font(.headline)
                                        Text(productSubtitle(product.id))
                                            .font(.caption).foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Text(product.displayPrice).font(.headline)
                                }
                                .padding(16)
                                .background(RoundedRectangle(cornerRadius: 16)
                                    .stroke(Color.accentColor, lineWidth: product.id == PurchaseManager.proYearly ? 2 : 1))
                            }
                            .buttonStyle(.plain)
                        }
                        if purchases.products.isEmpty {
                            ProgressView("商品加载中…")
                        }
                    }
                    .padding(.horizontal, 20)

                    if let errorMessage {
                        Text(errorMessage).font(.caption).foregroundStyle(.red)
                    }

                    VStack(spacing: 8) {
                        Button("恢复购买") { Task { await purchases.restore() } }
                            .font(.footnote)
                        HStack(spacing: 16) {
                            Link("服务条款", destination: URL(string: "https://pawpet.app/terms")!)
                            Link("隐私政策", destination: URL(string: "https://pawpet.app/privacy")!)
                        }
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                        Text("订阅自动续期，可随时在系统设置中取消")
                            .font(.caption2).foregroundStyle(.tertiary)
                    }
                    .padding(.bottom, 24)
                }
            }
            .navigationTitle("解锁专属桌宠")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { dismiss() } label: { Image(systemName: "xmark.circle.fill").foregroundStyle(.tertiary) }
                }
            }
            .disabled(purchasing)
        }
    }

    private func benefit(_ icon: String, _ text: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).foregroundStyle(Color.accentColor).frame(width: 24)
            Text(text).font(.subheadline)
        }
    }

    private func productTitle(_ id: String) -> String {
        switch id {
        case PurchaseManager.generateOnce: return "单次生成"
        case PurchaseManager.proMonthly: return "Pro 月度"
        case PurchaseManager.proYearly: return "Pro 年度 · 最划算"
        default: return id
        }
    }

    private func productSubtitle(_ id: String) -> String {
        switch id {
        case PurchaseManager.generateOnce: return "生成 1 只专属桌宠"
        case PurchaseManager.proMonthly: return "每月 2 次生成 + 全部组件样式"
        case PurchaseManager.proYearly: return "每月 2 次生成 + 全部组件样式，省 ¥76"
        default: return ""
        }
    }

    private func buy(_ product: Product) {
        purchasing = true
        Task {
            defer { purchasing = false }
            do {
                if try await purchases.purchase(product) {
                    dismiss()
                    onPurchased()
                }
            } catch {
                errorMessage = "购买失败：\(error.localizedDescription)"
            }
        }
    }
}
