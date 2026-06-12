import SwiftUI
import AVFoundation

// HEVC alpha 透明视频循环播放（沿用萌伴验证过的方案：
// 不设 videoComposition，pixelBufferAttributes 指定 BGRA 让 AVPlayer 原生输出透明）
final class VideoLoopUIView: UIView {
    private var player: AVQueuePlayer?
    private var looper: AVPlayerLooper?
    private var playerLayer: AVPlayerLayer?
    private(set) var currentURL: URL?

    override func layoutSubviews() {
        super.layoutSubviews()
        playerLayer?.frame = bounds
    }

    func setup(url: URL) {
        backgroundColor = .clear
        isOpaque = false
        currentURL = url
        let item = AVPlayerItem(url: url)
        let qp = AVQueuePlayer(playerItem: item)
        qp.isMuted = true
        looper = AVPlayerLooper(player: qp, templateItem: item)
        player = qp
        let layer = AVPlayerLayer(player: qp)
        layer.videoGravity = .resizeAspect
        layer.backgroundColor = UIColor.clear.cgColor
        layer.isOpaque = false
        layer.pixelBufferAttributes = [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
        ]
        self.layer.addSublayer(layer)
        playerLayer = layer
        qp.play()
    }

    func update(url: URL) {
        guard url != currentURL else { return }
        currentURL = url
        looper = nil
        guard let qp = player else { return }
        qp.pause()
        qp.removeAllItems()
        let item = AVPlayerItem(url: url)
        qp.insert(item, after: nil)
        looper = AVPlayerLooper(player: qp, templateItem: item)
        qp.play()
    }
}

struct LoopingVideoView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> VideoLoopUIView {
        let v = VideoLoopUIView()
        v.setup(url: url)
        return v
    }

    func updateUIView(_ uiView: VideoLoopUIView, context: Context) {
        uiView.update(url: url)
    }
}
