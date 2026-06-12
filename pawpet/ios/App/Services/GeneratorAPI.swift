import Foundation
import UIKit

/// 生成后端客户端。开发期指向 Mac 的局域网 FastAPI（手机需同一 Wi-Fi）；上架前改为正式域名（HTTPS）
enum GeneratorAPI {
    static var baseURL = URL(string: "http://192.168.1.114:8900")!

    static var deviceID: String {
        if let id = UserDefaults.standard.string(forKey: "pawpet.deviceID") { return id }
        let id = UUID().uuidString
        UserDefaults.standard.set(id, forKey: "pawpet.deviceID")
        return id
    }

    struct Quota: Codable {
        let free_remaining: Int
        let is_free_for_me: Bool
    }

    struct PetStatus: Codable {
        let petId: String
        let name: String?
        let status: String          // queued/character/videos/processing/ready/failed
        let step: Int?
        let message: String?
        let characterImage: String?
        let error: String?
    }

    static func fetchQuota() async throws -> Quota {
        var req = URLRequest(url: baseURL.appendingPathComponent("api/quota"))
        req.setValue(deviceID, forHTTPHeaderField: "X-Device-Id")
        let (data, _) = try await URLSession.shared.data(for: req)
        return try JSONDecoder().decode(Quota.self, from: data)
    }

    /// 上传照片开始生成，返回 petId
    static func createPet(photo: UIImage, name: String, species: String = "宠物", receipt: String?) async throws -> String {
        guard let jpeg = photo.jpegData(compressionQuality: 0.85) else {
            throw URLError(.cannotCreateFile)
        }
        var req = URLRequest(url: baseURL.appendingPathComponent("api/pet/create"))
        req.httpMethod = "POST"
        req.setValue(deviceID, forHTTPHeaderField: "X-Device-Id")
        let boundary = "Boundary-\(UUID().uuidString)"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        func field(_ name: String, _ value: String) {
            body.append("--\(boundary)\r\nContent-Disposition: form-data; name=\"\(name)\"\r\n\r\n\(value)\r\n".data(using: .utf8)!)
        }
        field("name", name)
        field("species", species)
        if let receipt { field("receipt", receipt) }
        body.append("--\(boundary)\r\nContent-Disposition: form-data; name=\"photo\"; filename=\"photo.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(jpeg)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        req.httpBody = body

        let (data, resp) = try await URLSession.shared.data(for: req)
        if let http = resp as? HTTPURLResponse, http.statusCode == 402 {
            throw GenerationError.paymentRequired
        }
        struct CreateResp: Codable { let petId: String }
        return try JSONDecoder().decode(CreateResp.self, from: data).petId
    }

    struct PetSummary: Codable {
        let petId: String
        let name: String?
        let status: String
    }

    /// 服务端宠物列表（用于找回：生成完成但本地未领取的宠物）
    static func listPets() async throws -> [PetSummary] {
        let (data, _) = try await URLSession.shared.data(
            from: baseURL.appendingPathComponent("api/pets"))
        return try JSONDecoder().decode([PetSummary].self, from: data)
    }

    static func status(petID: String) async throws -> PetStatus {
        let url = baseURL.appendingPathComponent("api/pet/\(petID)/status")
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(PetStatus.self, from: data)
    }

    /// 下载宠物资产包并解压进 App Group 容器，组件即刻可用
    static func downloadBundle(petID: String) async throws {
        let url = baseURL.appendingPathComponent("api/pet/\(petID)/bundle.zip")
        let (tmp, _) = try await URLSession.shared.download(from: url)
        guard let dest = PetMedia.containerURL(petID: petID) else {
            throw URLError(.fileDoesNotExist)
        }
        try FileManager.default.createDirectory(at: dest, withIntermediateDirectories: true)
        try await unzip(tmp, to: dest)
    }

    /// 用 Foundation 的 Process 不可用（iOS），这里用简单的 zip 解包。
    /// 资产包结构固定（videos/ frames/ character.jpg manifest.json），
    /// 由 ZipReader 最小实现解出（仅支持 stored/deflate 条目）。
    private static func unzip(_ src: URL, to dest: URL) async throws {
        try ZipReader.extract(zipAt: src, to: dest)
    }

    enum GenerationError: LocalizedError {
        case paymentRequired
        var errorDescription: String? {
            switch self {
            case .paymentRequired: return "今日免费名额已用完，需要购买生成次数"
            }
        }
    }
}
