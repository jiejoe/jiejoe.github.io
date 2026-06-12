import Foundation
import StoreKit

/// StoreKit 2 内购：
/// - paw.generate.once   消耗型 ¥18    单次生成
/// - paw.pro.monthly     订阅   ¥12/月 每月2次生成+全部组件样式
/// - paw.pro.yearly      订阅   ¥68/年
@MainActor
final class PurchaseManager: ObservableObject {
    static let generateOnce = "paw.generate.once"
    static let proMonthly = "paw.pro.monthly"
    static let proYearly = "paw.pro.yearly"

    @Published var products: [Product] = []
    @Published var isPro = false
    /// 本地可用的生成次数（购买单次/订阅赠送）
    @Published var generationCredits: Int = UserDefaults.standard.integer(forKey: "pawpet.credits")

    private var updatesTask: Task<Void, Never>?

    init() {
        updatesTask = Task { await observeTransactions() }
        Task {
            await loadProducts()
            await refreshEntitlements()
        }
    }

    deinit { updatesTask?.cancel() }

    func loadProducts() async {
        do {
            products = try await Product.products(for: [
                Self.generateOnce, Self.proMonthly, Self.proYearly,
            ])
        } catch {
            print("加载商品失败: \(error)")
        }
    }

    func purchase(_ product: Product) async throws -> Bool {
        let result = try await product.purchase()
        switch result {
        case .success(let verification):
            guard case .verified(let transaction) = verification else { return false }
            await grant(for: transaction)
            await transaction.finish()
            return true
        case .userCancelled, .pending:
            return false
        @unknown default:
            return false
        }
    }

    func restore() async {
        try? await AppStore.sync()
        await refreshEntitlements()
    }

    func consumeCredit() {
        guard generationCredits > 0 else { return }
        generationCredits -= 1
        UserDefaults.standard.set(generationCredits, forKey: "pawpet.credits")
    }

    private func grant(for transaction: Transaction) async {
        switch transaction.productID {
        case Self.generateOnce:
            generationCredits += 1
            UserDefaults.standard.set(generationCredits, forKey: "pawpet.credits")
        case Self.proMonthly, Self.proYearly:
            isPro = true
            // 订阅每月赠 2 次，简化：购买当下 +2，续期发放走服务端（上线后用 App Store Server Notifications）
            generationCredits += 2
            UserDefaults.standard.set(generationCredits, forKey: "pawpet.credits")
        default: break
        }
    }

    private func refreshEntitlements() async {
        for await entitlement in Transaction.currentEntitlements {
            if case .verified(let t) = entitlement,
               t.productID == Self.proMonthly || t.productID == Self.proYearly {
                isPro = true
            }
        }
    }

    private func observeTransactions() async {
        for await update in Transaction.updates {
            if case .verified(let t) = update {
                await grant(for: t)
                await t.finish()
            }
        }
    }
}
