/**
 * 今天吃什么 — 淘宝闪购评论自动分析
 * 平台：AutoJs6 (https://github.com/tvsj/AutoJs6)
 * 权限：无障碍服务 + 网络请求
 */

"auto";
console.show();

const API_URL = "https://what-to-eat-production-35c2.up.railway.app/api/analyze-review";
const TOKEN = "wte_" + device.serial;

// ====================== 浮动按钮 ======================
let floatBtn = null;

function createFloatingButton() {
    if (floatBtn) return;
    floatBtn = floaty.window(
        <frame gravity="right|bottom" margin="0 0 80 16">
            <button id="btn" text="🔍"
                style="width:56px;height:56px;borderRadius:28px;
                background:#f97316;color:#fff;fontSize:24px;
                elevation:8px;border:none;"/>
            <button id="btn2" text="📋"
                style="width:48px;height:48px;borderRadius:24px;
                background:#fff;color:#f97316;fontSize:20px;
                elevation:6px;border:2px solid #f97316;marginTop:8px;"/>
        </frame>
    );
    floatBtn.btn.click(() => analyzeReviews());
    floatBtn.btn2.click(() => scrapeShop());
    setInterval(() => {}, 1000); // 防止浮窗被回收
}

// ====================== 店铺信息抓取 ======================
function scrapeShop() {
    let shopName = "";
    let dishes = [];

    // 遍历无障碍树找店铺名和菜品
    auto().forEach(function(node) {
        if (!node || !node.text) return;
        let txt = node.text.trim();
        if (!txt || txt.length < 2) return;

        // 判断是店名
        if (node.className && node.className.includes("TextView") &&
            (txt.includes("店") || txt.includes("餐厅") || txt.includes("馆") ||
             txt.includes("餐") || txt.includes("食")) && txt.length < 20 && !shopName) {
            shopName = txt;
        }

        // 判断是菜品（包含常见菜名关键词）
        if (txt.length >= 3 && txt.length <= 20 &&
            (txt.includes("饭") || txt.includes("面") || txt.includes("粉") ||
             txt.includes("鸡") || txt.includes("肉") || txt.includes("菜") ||
             txt.includes("汤") || txt.includes("煲") || txt.includes("锅") ||
             txt.includes("串") || txt.includes("堡") || txt.includes("卷"))) {
            if (!dishes.includes(txt)) dishes.push(txt);
        }
    });

    if (shopName || dishes.length > 0) {
        let result = {
            shop: shopName ? { name: shopName, platform: "淘宝闪购" } : null,
            dishes: dishes.slice(0, 20),
            exportedAt: new Date().toISOString()
        };
        setClip(JSON.stringify(result, null, 2));
        toast("✅ 已复制！店铺：" + (shopName || "未识别") +
            "\n菜品：" + dishes.length + " 道\n打开PWA → 设置 → 粘贴导入");
    } else {
        toast("⚠️ 未识别到店铺信息和菜品\n请确保在店铺详情页使用");
    }
}

// ====================== 评论分析 ======================
function analyzeReviews() {
    toast("🔍 正在提取评论...");
    let reviews = [];
    let processed = 0;
    let fakeCount = 0;
    let realCount = 0;

    // 从无障碍树提取评论文字
    let candidates = [];
    auto().forEach(function(node) {
        if (!node || !node.text) return;
        let txt = node.text.trim();
        // 评论通常是较长的文字段落
        if (txt.length >= 10 && txt.length <= 2000 &&
            !txt.startsWith("http") && !txt.startsWith("@") &&
            txt.split("").filter(c => /[一-龥]/.test(c)).length >= 5) {
            // 去重
            if (!candidates.includes(txt)) {
                candidates.push(txt);
            }
        }
    });

    if (candidates.length === 0) {
        toast("⚠️ 未找到评论文字\n请在评论区页面使用");
        return;
    }

    // 过滤掉非评论的UI文字
    let uiKeywords = ["设置", "搜索", "首页", "我的", "购物车", "客服",
        "收藏", "关注", "分享", "举报", "回复", "点赞", "评论",
        "更多", "筛选", "排序", "推荐", "价格", "销量", "评分"];
    candidates = candidates.filter(t => {
        return !uiKeywords.some(k => t === k || t.startsWith(k));
    });

    toast("📊 找到 " + candidates.length + " 条候选文本，开始分析...");

    // 逐条送API分析
    let i = 0;
    let timer = setInterval(() => {
        if (i >= candidates.length) {
            clearInterval(timer);
            toast("🎉 分析完成！" + processed + " 条\n" +
                "🔴 可疑: " + fakeCount + " 条\n" +
                "🟢 可信: " + realCount + " 条");
            return;
        }

        let text = candidates[i++];
        try {
            let resp = http.postJson(API_URL, {
                text: text,
                user_token: TOKEN
            });
            if (resp.statusCode == 200) {
                let data = resp.body.json();
                processed++;
                if (data.is_fake) fakeCount++;
                else realCount++;
                log((data.is_fake ? "🔴" : "🟢") + " " + text.slice(0, 30) + "...");
            }
        } catch (e) {
            // 网络不可达，用本地规则标记
            log("⚪ (离线) " + text.slice(0, 30) + "...");
            processed++;
        }
    }, 800); // 每条间隔800ms，避免API限流
}

// ====================== 启动 ======================
events.on("exit", () => {
    if (floatBtn) floatBtn.close();
});

// 检查无障碍服务
if (!auto.service) {
    toast("请先开启无障碍服务");
    auto.waitFor();
}

createFloatingButton();
toast("🚀 今天吃什么助手已就绪\n浮动按钮已显示在屏幕右侧");
