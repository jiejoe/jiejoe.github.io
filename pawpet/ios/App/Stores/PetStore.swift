import Foundation
import SwiftUI
import WidgetKit

@MainActor
final class PetStore: ObservableObject {
    @Published var pets: [Pet] = []
    @Published var selectedPetID: String = SharedStore.selectedPetID

    var selectedPet: Pet {
        pets.first(where: { $0.id == selectedPetID }) ?? Pet.builtIns[0]
    }

    init() {
        reload()
    }

    func reload() {
        pets = SharedStore.allPets()
        selectedPetID = SharedStore.selectedPetID
    }

    func select(petID: String) {
        guard pets.contains(where: { $0.id == petID }) else { return }
        selectedPetID = petID
        SharedStore.selectedPetID = petID
        WidgetCenter.shared.reloadAllTimelines()
    }

    /// 自定义宠物生成完成后登记
    func register(custom pet: Pet) {
        var customs = SharedStore.loadCustomPets()
        customs.removeAll { $0.id == pet.id }
        customs.append(pet)
        SharedStore.saveCustomPets(customs)
        reload()
        select(petID: pet.id)
    }
}
