import SwiftUI

@main
struct PawPetApp: App {
    @StateObject private var petStore = PetStore()
    @StateObject private var purchases = PurchaseManager()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(petStore)
                .environmentObject(purchases)
        }
    }
}

struct RootView: View {
    @EnvironmentObject var petStore: PetStore
    // 截图/调试用：xcrun simctl launch ... --args -debugTab 1
    @State private var tab = UserDefaults.standard.integer(forKey: "debugTab")

    var body: some View {
        TabView(selection: $tab) {
            HomeView()
                .tabItem { Label("小窝", systemImage: "house.fill") }
                .tag(0)
            WidgetGalleryView()
                .tabItem { Label("组件", systemImage: "square.grid.2x2.fill") }
                .tag(1)
            CreatePetView()
                .tabItem { Label("领养", systemImage: "plus.circle.fill") }
                .tag(2)
            SettingsView()
                .tabItem { Label("我的", systemImage: "person.fill") }
                .tag(3)
        }
        .onOpenURL { url in
            // pawpet://pet/<id> 从组件点进来：直接回小窝看这只宠物的动态
            if url.host == "pet", let id = url.pathComponents.dropFirst().first {
                petStore.select(petID: id)
                tab = 0
            }
        }
    }
}
