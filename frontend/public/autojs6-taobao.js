/**
 * 今天吃什么 — 淘宝闪购评论分析助手
 * AutoJs6 v6.7.0
 * 用法：淘宝里长按复制评论文字 → 点悬浮窗 → 粘贴 → 自动分析
 */

"auto";
console.show();

var API_URL = "https://what-to-eat-production-35c2.up.railway.app/api/analyze-review";
var TOKEN = "wte_" + device.serial;

// ====================== 分析面板 ======================
var panelWindow = null;
var resultWindow = null;

function showPanel() {
    if (panelWindow) { panelWindow.close(); panelWindow = null; return; }
    if (resultWindow) { resultWindow.close(); resultWindow = null; }

    panelWindow = floaty.rawWindow(
        <card w="*" h="auto" cardCornerRadius="16dp" cardElevation="12dp"
            gravity="center" margin="20 0" padding="16">
            <vertical>
                <text text="🔍 评论分析" textSize="18sp" textStyle="bold"
                    textColor="#333" marginBottom="12"/>
                <input id="input" hint="粘贴评论文字到这里..." textSize="14sp"
                    h="120" gravity="top" singleLine="false"
                    background="#f5f5f5" padding="12" marginBottom="12"/>
                <horizontal gravity="right">
                    <button id="close" text="关闭" textSize="14sp"
                        style="Widget.AppCompat.Button.Borderless"
                        textColor="#999" marginRight="8"/>
                    <button id="analyze" text="分析" textSize="14sp"
                        style="Widget.AppCompat.Button.Borderless"
                        textColor="#f97316" textStyle="bold"/>
                </horizontal>
                <text id="status" text="" textSize="12sp" textColor="#999" marginTop="8"/>
            </vertical>
        </card>
    );

    panelWindow.close.on("click", function() {
        panelWindow.close(); panelWindow = null;
    });

    panelWindow.analyze.on("click", function() {
        var text = panelWindow.input.getText().toString().trim();
        if (!text) {
            panelWindow.status.setText("请先粘贴评论文字");
            return;
        }
        panelWindow.status.setText("分析中...");
        panelWindow.close(); panelWindow = null;
        doAnalyze(text);
    });

    // 获取剪贴板内容并填入
    try {
        var clip = getClip();
        if (clip && clip.length >= 5) {
            panelWindow.input.setText(clip);
            panelWindow.status.setText("✅ 已读取剪贴板，点「分析」即可");
        }
    } catch(e) {}
}

// ====================== 执行分析 ======================
function doAnalyze(text) {
    showResult("⏳ 正在分析...", "#999");
    try {
        var resp = http.postJson(API_URL, {
            text: text,
            user_token: TOKEN
        });
        if (resp.statusCode == 200) {
            var data = resp.body.json();
            var isFake = data.is_fake;
            var conf = Math.round(data.confidence * 100);
            var indicators = data.indicators || [];
            var source = "云端ML";

            var lines = [
                (isFake ? "🔴 疑似虚假评论" : "🟢 可能是真实评论"),
                "置信度: " + conf + "%",
                "来源: " + source,
                ""
            ];
            if (indicators.length > 0) {
                lines.push("命中规则:");
                indicators.forEach(function(ind) {
                    lines.push("  · " + ind.word + " (" + ind.type + ")");
                });
            }
            showResult(lines.join("\n"), isFake ? "#dc2626" : "#16a34a");
        } else {
            showResult("⚠️ API 返回错误\n" + resp.statusMessage, "#999");
        }
    } catch (e) {
        // 离线模式
        showResult("📡 离线模式\n无法连接分析服务\n结果仅供参考", "#f97316");
    }
}

// ====================== 结果显示 ======================
function showResult(text, color) {
    if (resultWindow) resultWindow.close();

    resultWindow = floaty.rawWindow(
        <card w="*" h="auto" cardCornerRadius="16dp" cardElevation="12dp"
            gravity="center" margin="20 0" padding="16">
            <vertical>
                <text id="title" text="分析结果" textSize="18sp" textStyle="bold"
                    textColor="#333" marginBottom="12"/>
                <text id="content" text={text} textSize="15sp"
                    textColor={color} lineSpacingMultiplier="1.4" marginBottom="12"/>
                <button id="dismiss" text="关闭" textSize="14sp"
                    style="Widget.AppCompat.Button.Borderless" textColor="#999"/>
            </vertical>
        </card>
    );

    resultWindow.dismiss.on("click", function() {
        resultWindow.close(); resultWindow = null;
    });

    // 3秒后自动关闭
    setTimeout(function() {
        if (resultWindow) { resultWindow.close(); resultWindow = null; }
    }, 5000);
}

// ====================== 店铺抓取 ======================
function scrapeShop() {
    try {
        var clip = getClip();
        var data = JSON.parse(clip);
        toast("✅ 检测到剪贴板JSON数据\n店铺：" + (data.shop ? data.shop.name : "未知"));
        return;
    } catch(e) {}

    // 从无障碍树尝试提取店名
    var shopName = "";
    try {
        var root = auto.root;
        if (root) _findShop(root);
    } catch(e) {}

    function _findShop(node) {
        if (shopName || !node) return;
        try {
            var t = node.text ? node.text.toString().trim() : "";
            if (t.length >= 2 && t.length <= 30 &&
                (t.indexOf("店") >= 0 || t.indexOf("馆") >= 0 || t.indexOf("餐厅") >= 0)) {
                shopName = t;
            }
            var c = node.childCount;
            for (var i = 0; i < c; i++) _findShop(node.child(i));
        } catch(e) {}
    }

    var result = {
        shop: shopName ? { name: shopName, platform: "淘宝闪购" } : null,
        hint: "在店铺页面使用，或手动粘贴JSON"
    };
    setClip(JSON.stringify(result, null, 2));
    toast("📋 " + (shopName ? "已抓取：" + shopName : "未识别店铺\n请确保在店铺页面使用"));
}

// ====================== 浮动按钮 ======================
function createFloat() {
    var w = floaty.rawWindow(
        <frame gravity="right|center_vertical" margin="0 0 0 8">
            <vertical>
                <button id="btn1"
                    style="width:52;height:52;borderRadius:26;
                    background:#f97316;color:#fff;fontSize:20;
                    elevation:10;border:none;marginBottom:10;"
                    text="🔍"/>
                <button id="btn2"
                    style="width:52;height:52;borderRadius:26;
                    background:#fff;color:#f97316;fontSize:20;
                    elevation:8;border:2px solid #f97316;"
                    text="📋"/>
            </vertical>
        </frame>
    );

    w.btn1.on("click", showPanel);
    w.btn2.on("click", scrapeShop);
    w.setPosition(device.width - 72, device.height / 3);
}

// ====================== 启动 ======================
createFloat();
toast("✅ 今天吃什么助手已就绪\n复制评论 → 点🔍 → 自动分析");
