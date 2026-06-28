"auto";
console.show();
console.log("🚀 今天吃什么助手启动中...");

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
                    <button id="close" text="关闭" textSize="14sp" textColor="#999" marginRight="8"/>
                    <button id="analyze" text="分析" textSize="14sp" textColor="#f97316" textStyle="bold"/>
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

    // 自动填入剪贴板
    try {
        var clip = getClip();
        if (clip && clip.length >= 5) {
            panelWindow.input.setText(clip);
            panelWindow.status.setText("✅ 已自动填入剪贴板");
        }
    } catch(e) {}
}

function doAnalyze(text) {
    showResult("⏳ 分析中...", "#999");
    try {
        var resp = http.postJson(API_URL, { text: text, user_token: TOKEN });
        if (resp.statusCode == 200) {
            var data = resp.body.json();
            var isFake = data.is_fake;
            var conf = Math.round(data.confidence * 100);
            var indicators = data.indicators || [];
            var lines = [
                (isFake ? "🔴 疑似虚假评论" : "🟢 可能是真实评论"),
                "置信度: " + conf + "%",
                "来源: 云端ML"
            ];
            if (indicators.length > 0) {
                lines.push("");
                lines.push("命中规则:");
                indicators.forEach(function(ind) {
                    lines.push("  · " + ind.word + " (" + ind.type + ")");
                });
            }
            showResult(lines.join("\n"), isFake ? "#dc2626" : "#16a34a");
        } else {
            showResult("⚠️ API 错误: " + resp.statusMessage, "#999");
        }
    } catch (e) {
        showResult("📡 离线模式\n无法连接云端分析", "#f97316");
    }
}

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
                <button id="dismiss" text="关闭" textSize="14sp" textColor="#999"/>
            </vertical>
        </card>
    );
    resultWindow.dismiss.on("click", function() {
        resultWindow.close(); resultWindow = null;
    });
    setTimeout(function() {
        if (resultWindow) { resultWindow.close(); resultWindow = null; }
    }, 5000);
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
    w.btn2.on("click", function() {
        toast("📋 在店铺页面使用\n或手动粘贴JSON到PWA设置页导入");
    });
    w.setPosition(device.width - 72, device.height / 3);
    console.log("✅ 浮动按钮已显示");
    return w;
}

// ====================== 启动 ======================
toast("🚀 今天吃什么助手启动中...");
createFloat();
toast("✅ 助手就绪！\n复制评论 → 点🔍 → 自动分析");

// 保持脚本运行
setInterval(function() {}, 3000);
