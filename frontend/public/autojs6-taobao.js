/**
 * 今天吃什么 — 淘宝闪购 / 任意外卖App 评论自动分析
 * AutoJs6 v6.7.0 + PaddleOCR 插件
 * 权限：无障碍服务 + 屏幕截图
 */

"auto";
console.show();

var API_URL = "https://what-to-eat-production-35c2.up.railway.app/api/analyze-review";
var TOKEN = "wte_" + device.serial;
var running = false;

// ====================== OCR 提取屏幕文字 ======================
function extractScreenText() {
    // 检查OCR插件
    if (!ocr || !ocr.detect) {
        toast("⚠️ 请先安装 PaddleOCR 插件\nAutoJs6 → 插件中心 → Paddle OCR");
        return [];
    }

    toast("📸 截屏+OCR识别中...");
    try {
        var img = images.captureScreen();
        if (!img) { toast("⚠️ 截屏失败"); return []; }

        // OCR识别
        var results = ocr.detect(img, { mode: "zh" });
        img.recycle();

        var texts = [];
        results.forEach(function(r) {
            if (r.text && r.text.trim().length >= 2) {
                texts.push({ text: r.text.trim(), y: r.bounds ? r.bounds.top : 0 });
            }
        });
        return texts;
    } catch (e) {
        toast("⚠️ OCR失败：" + e.message);
        return [];
    }
}

// ====================== 评论分析 ======================
function analyzeReviews() {
    if (running) { toast("⏳ 正在分析中，请等待"); return; }
    running = true;

    var texts = extractScreenText();
    if (texts.length === 0) { running = false; return; }

    var candidates = [];
    var seen = {};
    var uiNoise = [
        "设置","搜索","首页","我的","购物车","客服","收藏","关注",
        "分享","举报","回复","点赞","评论","更多","筛选","排序",
        "推荐","价格","销量","评分","添加","删除","编辑","保存",
        "取消","提交","确认","返回","关闭","退出","登录","注册",
        "优惠","红包","满减","配送","自提","评价","已售","月售",
        "起送","距离","分钟","小时","公里","米","去支付","立即",
        "加入","购物","订单","售后","退款","投诉","商家","品牌",
        "满意","不满意","包装","味道","新鲜","好吃","难吃","分量",
    ];

    texts.forEach(function(t) {
        var text = t.text;
        if (!text || text.length < 10 || text.length > 2000 || seen[text]) return;
        if (/^[\d\.\-\/\s:：￥¥\*★☆]+$/.test(text)) return;
        // 跳过纯UI文字
        var isNoise = false;
        for (var i = 0; i < uiNoise.length; i++) {
            if (text === uiNoise[i]) { isNoise = true; break; }
        }
        if (isNoise) return;
        // 必须包含中文
        var cn = 0;
        for (var j = 0; j < text.length; j++) {
            var c = text.charCodeAt(j);
            if (c >= 0x4e00 && c <= 0x9fff) cn++;
        }
        if (cn < 4) return;

        seen[text] = true;
        candidates.push(text);
    });

    if (candidates.length === 0) {
        toast("⚠️ 未找到评论文字\n请确保在评论区页面使用");
        running = false;
        return;
    }

    toast("📊 识别到 " + candidates.length + " 条文本，开始云端分析...");
    var processed = 0, fakeCount = 0, realCount = 0, total = candidates.length;

    candidates.forEach(function(text, idx) {
        try {
            var resp = http.postJson(API_URL, {
                text: text,
                user_token: TOKEN
            });
            if (resp.statusCode == 200) {
                var data = resp.body.json();
                processed++;
                if (data.is_fake) fakeCount++; else realCount++;
            }
        } catch (e) {
            processed++;
        }
        // 进度更新
        if ((idx + 1) % 3 === 0 || idx === total - 1) {
            toast("⏳ " + (idx + 1) + "/" + total +
                "\n🔴可疑 " + fakeCount + "  🟢可信 " + realCount);
        }
    });

    running = false;
    toast("🎉 分析完成！\n📊 共 " + total + " 条\n"
        + "🔴 可疑 " + fakeCount + " 条\n"
        + "🟢 可信 " + realCount + " 条\n"
        + "💡 精确率 " + (total > 0 ? Math.round(fakeCount/total*100) : 0) + "% 可疑");
}

// ====================== 店铺抓取 ======================
function scrapeShop() {
    if (running) return;
    var texts = extractScreenText();
    if (texts.length === 0) return;

    var shopName = "", dishes = [], seen = {};
    var shopKeys = ["店","餐厅","馆","厨房","小厨","食府","美食","外卖"];
    var dishKeys = ["饭","面","粉","鸡","鸭","鱼","肉","虾","蟹","牛",
        "猪","羊","菜","汤","煲","锅","串","堡","卷","饺","粥","排",
        "翅","腿","丸","饼","包","卤","烤","炸","炒","蒸","煮"];

    texts.forEach(function(t) {
        var text = t.text;
        if (!text || text.length < 2 || seen[text]) return;
        seen[text] = true;
        // 店名
        if (!shopName && text.length <= 25) {
            for (var i = 0; i < shopKeys.length; i++) {
                if (text.indexOf(shopKeys[i]) >= 0) { shopName = text; break; }
            }
        }
        // 菜品
        if (text.length >= 2 && text.length <= 25 && dishes.length < 30) {
            for (var j = 0; j < dishKeys.length; j++) {
                if (text.indexOf(dishKeys[j]) >= 0) {
                    if (dishes.indexOf(text) < 0) dishes.push(text);
                    break;
                }
            }
        }
    });

    var result = {
        shop: shopName ? { name: shopName, platform: "淘宝闪购" } : null,
        dishes: dishes.slice(0, 25),
        exportedAt: new Date().toISOString()
    };
    setClip(JSON.stringify(result, null, 2));
    toast("✅ 已复制到剪贴板！\n店铺：" + (shopName || "未识别")
        + "\n菜品：" + dishes.length + " 道\n打开PWA → 设置 → 粘贴导入");
}

// ====================== 大号浮动按钮 ======================
var floatBtn = null;

function createFloat() {
    floatBtn = floaty.rawWindow(
        <frame gravity="right|center_vertical" margin="0 0 0 12">
            <vertical>
                <button id="btn1"
                    style="width:56;height:56;borderRadius:28;
                    background:#f97316;color:#fff;fontSize:18;
                    elevation:10;border:none;marginBottom:12;"
                    text="🔍"/>
                <button id="btn2"
                    style="width:56;height:56;borderRadius:28;
                    background:#fff;color:#f97316;fontSize:18;
                    elevation:8;border:2px solid #f97316;"
                    text="📋"/>
            </vertical>
        </frame>
    );

    floatBtn.btn1.on("click", function() {
        toast("🔍 开始分析评论...");
        setTimeout(analyzeReviews, 500);
    });

    floatBtn.btn2.on("click", function() {
        toast("📋 开始抓取店铺...");
        setTimeout(scrapeShop, 500);
    });

    // 让按钮可拖动
    floatBtn.setPosition(device.width - 80, device.height / 3);
}

// ====================== 启动 ======================
toast("🚀 启动中...");
if (!auto.service) {
    toast("请开启无障碍服务\n设置 → 无障碍 → AutoJs6");
    auto.waitFor();
}

// 申请截图权限
if (!images.requestScreenCapture()) {
    toast("⚠️ 需要屏幕截图权限");
}

createFloat();
toast("✅ 今天吃什么助手已就绪\n右侧两个圆形按钮：\n🔍分析评论  📋抓取店铺");
