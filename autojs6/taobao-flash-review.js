"auto";
console.show();
console.log("🚀 今天吃什么 v3 — OCR 截图识别版");

var API_URL = "https://what-to-eat-production-35c2.up.railway.app/api/analyze-review";
var TOKEN = "wte_" + device.serial;
var panelWindow = null;
var resultWindow = null;

// ====================== OCR 截图 + 分析 ======================
function analyzeFromScreen() {
    if (panelWindow) { panelWindow.close(); panelWindow = null; }
    if (resultWindow) { resultWindow.close(); resultWindow = null; }

    try {
        toast("📸 截屏+OCR识别中...");
        requestScreenCapture();
        sleep(500);
        var img = captureScreen();
        if (!img) { toast("⚠️ 截屏失败"); return; }

        // 尝试内置 OCR 模块
        var results = [];
        try {
            results = ocr.detect(img);
        } catch (e) {
            img.recycle();
            toast("⚠️ OCR模块不可用\n需要安装PaddleOCR插件\nAutoJs6主页→插件中心→Paddle OCR");
            return;
        }

        // 提取文字
        var texts = [];
        results.forEach(function(r) {
            if (r.text && r.text.trim().length >= 8) {
                texts.push({ text: r.text.trim(), y: r.bounds ? r.bounds.top : 9999 });
            }
        });
        img.recycle();

        // 过滤UI噪音
        var noise = ["设置","搜索","首页","购物车","订单","我的","客服","收藏",
            "关注","分享","举报","回复","点赞","更多","筛选","排序",
            "推荐","价格","销量","评分","添加","编辑","保存","取消",
            "提交","确认","返回","关闭","退出","登录","注册",
            "优惠","红包","满减","配送","自提","评价","已售","月售",
            "起送","距离","分钟","公里","去支付","立即","加入",
            "退款","售后","满意","不满意","味道","包装","新鲜"];

        var candidates = [];
        var seen = {};
        texts.sort(function(a, b) { return a.y - b.y; }).forEach(function(t) {
            var text = t.text;
            if (!text || text.length > 2000 || seen[text]) return;
            var isNoise = false;
            for (var i = 0; i < noise.length; i++) {
                if (text === noise[i] || text === "全部") { isNoise = true; break; }
            }
            if (isNoise) return;
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
            toast("⚠️ 未识别到评论文字\n请确保在评论区页面");
            return;
        }

        toast("📊 识别到 " + candidates.length + " 条文本，分析中...");

        // 逐条调用API
        var processed = 0, fakeCount = 0, realCount = 0;
        var batchSize = Math.min(candidates.length, 15);

        for (var i = 0; i < batchSize; i++) {
            try {
                var resp = http.postJson(API_URL, {
                    text: candidates[i],
                    user_token: TOKEN
                });
                if (resp.statusCode == 200) {
                    var data = resp.body.json();
                    processed++;
                    if (data.is_fake) fakeCount++; else realCount++;
                    console.log((data.is_fake ? "🔴":"🟢") + " " + candidates[i].slice(0, 30));
                }
            } catch (e) {
                processed++;
            }
            sleep(500);
        }

        var resultText = "📊 分析 " + processed + " 条\n" +
            "🔴 可疑: " + fakeCount + " 条\n" +
            "🟢 可信: " + realCount + " 条\n" +
            "📸 共识别: " + candidates.length + " 条";
        showResult(resultText, fakeCount > realCount ? "#dc2626" : "#16a34a");

    } catch (e) {
        toast("⚠️ 错误: " + e.message);
    }
}

// ====================== 结果显示 ======================
function showResult(text, color) {
    if (resultWindow) resultWindow.close();
    resultWindow = floaty.rawWindow(
        <card w="*" h="auto" cardCornerRadius="16dp" cardElevation="12dp"
            gravity="center" margin="20 0" padding="16">
            <vertical>
                <text text="分析结果" textSize="18sp" textStyle="bold"
                    textColor="#333" marginBottom="12"/>
                <text id="content" text={text} textSize="15sp"
                    textColor={color} lineSpacingMultiplier="1.4" marginBottom="12"/>
                <button id="btnOk" text="关闭" textSize="14sp" textColor="#999"/>
            </vertical>
        </card>
    );
    resultWindow.btnOk.click(function() {
        resultWindow.close(); resultWindow = null;
    });
    setTimeout(function() {
        if (resultWindow) { resultWindow.close(); resultWindow = null; }
    }, 6000);
}

// ====================== 浮动按钮 ======================
var floatWin = floaty.rawWindow(
    <frame gravity="right|bottom" margin="0 0 120 16">
        <vertical>
            <button id="btnA" text="🔍"
                style="width:64;height:64;borderRadius:32;
                background:#f97316;color:#fff;fontSize:26;
                elevation:12;border:none;marginBottom:16;padding:0;"/>
            <button id="btnB" text="📋"
                style="width:64;height:64;borderRadius:32;
                background:#fff;color:#f97316;fontSize:26;
                elevation:10;border:3px solid #f97316;padding:0;"/>
        </vertical>
    </frame>
);

floatWin.btnA.click(function() {
    toast("📸 正在截图分析...");
    setTimeout(analyzeFromScreen, 300);
});

floatWin.btnB.click(function() {
    toast("📋 请在店铺或菜单页点此按钮\n将尝试OCR识别店名和菜品");
});

floatWin.setPosition(device.width - 84, device.height - 300);

toast("🚀 就绪！打开评论区 → 点🔍");
console.log("✅ 浮动按钮已显示");

setInterval(function() {}, 3000);
