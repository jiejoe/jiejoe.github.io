import Foundation
import Compression

/// 最小 zip 解包器：只支持 stored(0) / deflate(8) 条目，
/// 足够解我们后端固定结构的 bundle.zip（videos/ frames/ character.jpg manifest.json）
enum ZipReader {
    enum ZipError: Error { case badFormat, unsupportedMethod, decompressFailed }

    static func extract(zipAt src: URL, to dest: URL) throws {
        let data = try Data(contentsOf: src)
        var offset = 0

        while offset + 30 <= data.count {
            let sig = data.readUInt32(at: offset)
            if sig != 0x04034b50 { break } // 不是本地文件头：到中央目录了

            let method = data.readUInt16(at: offset + 8)
            let flags = data.readUInt16(at: offset + 6)
            let compSize = Int(data.readUInt32(at: offset + 18))
            let nameLen = Int(data.readUInt16(at: offset + 26))
            let extraLen = Int(data.readUInt16(at: offset + 28))

            guard offset + 30 + nameLen <= data.count else { throw ZipError.badFormat }
            let nameData = data.subdata(in: (offset + 30)..<(offset + 30 + nameLen))
            let name = String(data: nameData, encoding: .utf8) ?? ""
            let dataStart = offset + 30 + nameLen + extraLen

            // 带 data descriptor（flag bit 3）时 compSize 为 0——我们后端不产这种 zip，防御性跳过
            if flags & 0x08 != 0 && compSize == 0 { throw ZipError.badFormat }

            guard dataStart + compSize <= data.count else { throw ZipError.badFormat }
            let payload = data.subdata(in: dataStart..<(dataStart + compSize))

            if !name.hasSuffix("/") && !name.isEmpty {
                let out: Data
                switch method {
                case 0: out = payload
                case 8: out = try inflate(payload)
                default: throw ZipError.unsupportedMethod
                }
                let fileURL = dest.appendingPathComponent(name)
                try FileManager.default.createDirectory(
                    at: fileURL.deletingLastPathComponent(), withIntermediateDirectories: true)
                try out.write(to: fileURL)
            }

            offset = dataStart + compSize
        }
    }

    /// raw DEFLATE 解压（zip 条目即 raw deflate，对应 Compression 框架的 ZLIB 算法）
    private static func inflate(_ input: Data) throws -> Data {
        var out = Data()
        let bufSize = 1 << 20
        let dstBuf = UnsafeMutablePointer<UInt8>.allocate(capacity: bufSize)
        defer { dstBuf.deallocate() }

        try input.withUnsafeBytes { (raw: UnsafeRawBufferPointer) in
            guard let srcPtr = raw.bindMemory(to: UInt8.self).baseAddress else {
                throw ZipError.decompressFailed
            }
            var stream = compression_stream(dst_ptr: dstBuf, dst_size: bufSize,
                                            src_ptr: srcPtr, src_size: input.count,
                                            state: nil)
            guard compression_stream_init(&stream, COMPRESSION_STREAM_DECODE, COMPRESSION_ZLIB) == COMPRESSION_STATUS_OK else {
                throw ZipError.decompressFailed
            }
            defer { compression_stream_destroy(&stream) }
            stream.src_ptr = srcPtr
            stream.src_size = input.count
            stream.dst_ptr = dstBuf
            stream.dst_size = bufSize

            while true {
                let status = compression_stream_process(&stream, Int32(COMPRESSION_STREAM_FINALIZE.rawValue))
                switch status {
                case COMPRESSION_STATUS_OK, COMPRESSION_STATUS_END:
                    out.append(dstBuf, count: bufSize - stream.dst_size)
                    if status == COMPRESSION_STATUS_END { return }
                    stream.dst_ptr = dstBuf
                    stream.dst_size = bufSize
                default:
                    throw ZipError.decompressFailed
                }
            }
        }
        return out
    }
}

private extension Data {
    func readUInt16(at offset: Int) -> UInt16 {
        UInt16(self[offset]) | (UInt16(self[offset + 1]) << 8)
    }
    func readUInt32(at offset: Int) -> UInt32 {
        UInt32(self[offset]) | (UInt32(self[offset + 1]) << 8)
            | (UInt32(self[offset + 2]) << 16) | (UInt32(self[offset + 3]) << 24)
    }
}
