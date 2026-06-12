import Foundation

/// 情感化文案库：按人设 × 时段，给组件和 App 提供台词
enum CopyLibrary {

    /// 取一句台词。`seed` 用日期+小时做种子，保证组件同一时段稳定、跨时段变化。
    /// 约 1/3 概率换成「关心你」的提醒档（Widgetable 验证的碎碎念情绪价值）
    static func line(persona: PetPersona, slot: TimeSlot, petName: String, seed: Int? = nil) -> String {
        let s = seed ?? defaultSeed()
        if abs(s) % 3 == 2, let care = careLines[slot], !care.isEmpty {
            return care[abs(s / 3) % care.count]
        }
        let pool = lines[persona]?[slot] ?? []
        guard !pool.isEmpty else { return "\(petName)在等你回家" }
        return pool[abs(s) % pool.count].replacingOccurrences(of: "{name}", with: petName)
    }

    /// 关心型提醒（跨人设通用，借宠物口吻照顾用户）
    private static let careLines: [TimeSlot: [String]] = [
        .earlyMorning: ["记得吃早饭，不许空腹出门", "今天也要好好吃饭哦", "出门前喝口水嘛"],
        .forenoon: ["坐久了就学我伸个懒腰", "工作再忙，水杯不能空", "眼睛累了就看看我"],
        .noon: ["你吃午饭了没？我先吃了", "再忙也要按时吃饭！", "饭后散两步，像我一样"],
        .afternoon: ["三点啦，起来活动活动", "水杯空了吧，去续一杯", "肩膀酸了吧？转一转"],
        .evening: ["晚饭别凑合，好好犒劳自己", "到家了就把烦恼关在门外", "今天辛苦啦，我都看见了"],
        .night: ["热水泡泡脚，舒服得很", "手机放远点，陪我待会儿", "今天的你已经很棒了"],
        .lateNight: ["别熬夜了，我都困了", "再不睡我可要生气了哦", "梦里我陪你，快睡"],
    ]

    static func defaultSeed(date: Date = Date()) -> Int {
        let c = Calendar.current.dateComponents([.day, .hour], from: date)
        return (c.day ?? 0) * 24 + (c.hour ?? 0)
    }

    /// 一刻钟一个种子：组件 15 分钟换一拍，台词/姿势自然流动
    static func quarterSeed(date: Date = Date()) -> Int {
        let c = Calendar.current.dateComponents([.day, .hour, .minute], from: date)
        return (c.day ?? 0) * 96 + (c.hour ?? 0) * 4 + (c.minute ?? 0) / 15
    }

    /// 陪伴里程碑：特别的日子说特别的话（优先级高于普通陪伴文案）
    static func milestoneLine(days: Int) -> String? {
        switch days {
        case 7: return "我们认识一周啦 🎉"
        case 14: return "第 14 天，默契加倍"
        case 30: return "满月纪念日！抱一个 🎈"
        case 100: return "第 100 天，比心 💯"
        case 365: return "一周年！你是我的家人 🎂"
        case 520: return "第 520 天，我爱你"
        default: return nil
        }
    }

    /// 陪伴天数的一句话
    static func companionLine(days: Int) -> String {
        switch days {
        case 1: return "今天是我们认识的第 1 天"
        case 2...7: return "陪伴第 \(days) 天，还在熟悉你"
        case 8...30: return "陪伴第 \(days) 天，越来越懂你"
        case 31...99: return "陪伴第 \(days) 天，离不开你了"
        default: return "陪伴第 \(days) 天，你是我的全世界"
        }
    }

    private static let lines: [PetPersona: [TimeSlot: [String]]] = [
        .aloof: [
            .earlyMorning: ["伸个懒腰…才不是特意等你起床", "勉强陪你迎接今天吧", "早。本喵已经醒了很久了"],
            .forenoon: ["巡视领地中，勿扰", "今天的阳光勉强及格", "去忙吧，我看着你"],
            .noon: ["干饭是头等大事", "先吃饭，待会儿再理你", "今天的饭…还行吧"],
            .afternoon: ["毛要舔得一丝不苟", "下午茶时间，本喵优雅如初", "无事发生，岁月静好"],
            .evening: ["哼，今天也就想你了八次", "回来了？…我才没有在等你", "勉强蹭蹭你吧"],
            .night: ["只给你看的肚皮，懂？", "今天表现不错，奖励你摸三下", "夜宵就免了，保持身材"],
            .lateNight: ["睡了。你也早点睡", "梦里也要保持高冷", "晚安，明天继续装不在乎你"],
        ],
        .sunny: [
            .earlyMorning: ["新的一天！冲鸭！", "早安早安！今天也超爱你！", "起床啦！尾巴已经摇起来了！"],
            .forenoon: ["出去玩吗！现在！立刻！", "今天的风都是开心的味道", "陪你上班，精神满满！"],
            .noon: ["饭饭！是饭饭的味道！", "干饭不积极，思想有问题！", "吃饱了才有力气想你！"],
            .afternoon: ["打个小盹，梦里全是你", "下午也要元气满满哦", "你在干嘛呀？想你了！"],
            .evening: ["你回来啦！！开心到飞起！", "今天最棒的事就是见到你", "快快快，陪我玩一会儿！"],
            .night: ["肚皮防御解除！快来摸！", "今天也是幸福的一天", "睡前再玩一局嘛~"],
            .lateNight: ["呼…梦里也在向你跑去", "晚安！明天第一个迎接你！", "今天也谢谢你陪我"],
        ],
        .clingy: [
            .earlyMorning: ["睁开眼第一件事，就是找你", "早安，今天也要黏着你", "陪我多赖一分钟床嘛"],
            .forenoon: ["你走到哪，我跟到哪", "上午的阳光和你都很好", "隔着屏幕也要贴贴"],
            .noon: ["一起吃饭才香呀", "吃饭的时候也在看你哦", "午安，记得好好吃饭"],
            .afternoon: ["梳好毛，等你夸我漂亮", "下午好，已经想你三小时了", "优雅，是为了你"],
            .evening: ["终于等到你回来了", "今晚也要挨着你坐", "蹭蹭你，充个电"],
            .night: ["把最柔软的肚皮交给你", "今天的快乐，都是你给的", "再陪我一会儿好不好"],
            .lateNight: ["要牵着你的梦一起睡", "晚安，我就睡在离你最近的地方", "梦里见，不许迟到"],
        ],
        .dreamy: [
            .earlyMorning: ["叮~今日份魔法已充满", "早安！彩虹色的一天开始啦", "伸懒腰，把烦恼都抖掉"],
            .forenoon: ["去找一朵会笑的云", "今天会有小小的好运哦", "和你在一起，每天都是童话"],
            .noon: ["午餐是星星味的", "吃饱饱，才能继续发光", "能量补给中…叮！"],
            .afternoon: ["午后的梦里有棉花糖", "安静地陪着你，就很好", "收集了三缕阳光送给你"],
            .evening: ["今晚的晚霞，是我画的", "辛苦啦，抱抱你", "回家的路上有星星护送"],
            .night: ["把今天的不开心都吃掉啦", "你看，月亮升起来了", "今天的你也闪闪发光"],
            .lateNight: ["晚安，去梦里种彩虹", "睡吧，我会守着你的梦", "明天也会是温柔的一天"],
        ],
    ]
}
