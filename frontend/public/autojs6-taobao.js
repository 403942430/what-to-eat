/**
 * 今天吃什么 — 淘宝闪购评论自动分析
 * AutoJs6 v6.7.0+
 * 权限：无障碍服务
 */

"auto";
console.show();

var API_URL = "https://what-to-eat-production-35c2.up.railway.app/api/analyze-review";
var TOKEN = "wte_" + device.serial;

// ====================== 遍历无障碍树 ======================
function findAllTexts() {
    var result = [];
    var root = auto.root;
    if (!root) return result;
    _walkNode(root, result);
    return result;
}

function _walkNode(node, arr) {
    if (!node) return;
    try {
        var txt = node.text;
        if (txt && txt.toString().trim().length >= 2) {
            arr.push({
                text: txt.toString().trim(),
                className: node.className ? node.className.toString() : ""
            });
        }
        var count = node.childCount;
        for (var i = 0; i < count; i++) {
            _walkNode(node.child(i), arr);
        }
    } catch (e) {}
}

// ====================== 店铺抓取 ======================
function scrapeShop() {
    toast("📋 正在扫描店铺信息...");
    var nodes = findAllTexts();
    var shopName = "";
    var dishes = [];
    var seen = {};

    var shopKeywords = ["店", "餐厅", "馆", "餐", "食", "厨房"];
    var dishKeywords = ["饭", "面", "粉", "鸡", "肉", "菜", "汤", "煲", "锅", "串", "堡", "卷", "饺", "粥", "鱼", "虾", "排"];

    nodes.forEach(function(n) {
        var t = n.text;
        if (!t || t.length < 2 || seen[t]) return;
        seen[t] = true;

        // 店铺名
        if (!shopName && t.length < 20) {
            for (var i = 0; i < shopKeywords.length; i++) {
                if (t.indexOf(shopKeywords[i]) >= 0) { shopName = t; break; }
            }
        }

        // 菜品
        if (t.length >= 2 && t.length <= 20 && dishes.length < 30) {
            for (var j = 0; j < dishKeywords.length; j++) {
                if (t.indexOf(dishKeywords[j]) >= 0) { dishes.push(t); break; }
            }
        }
    });

    var result = {
        shop: shopName ? { name: shopName, platform: "淘宝闪购" } : null,
        dishes: dishes,
        exportedAt: new Date().toISOString()
    };
    setClip(JSON.stringify(result, null, 2));
    toast("✅ 已复制！\n店铺：" + (shopName || "未识别") + "\n菜品：" + dishes.length + " 道");
}

// ====================== 评论分析 ======================
function analyzeReviews() {
    toast("🔍 正在提取评论...");
    var nodes = findAllTexts();
    var candidates = [];
    var seen = {};

    var uiNoise = ["设置","搜索","首页","我的","购物车","客服","收藏",
        "关注","分享","举报","回复","点赞","评论","更多","筛选","排序",
        "推荐","价格","销量","评分","添加","删除","编辑","保存","取消",
        "提交","确认","返回","关闭","退出","登录","注册","忘记密码",
        "优惠","红包","满减","配送","自提","评价","已售","月售","起送",
        "距离","分钟","小时","公里","米"];

    nodes.forEach(function(n) {
        var t = n.text;
        if (!t || t.length < 8 || t.length > 2000 || seen[t]) return;
        // 跳过纯数字/日期/金额
        if (/^[\d\.\-\/\s:：￥¥]+$/.test(t)) return;
        // 跳过UI文字
        var noise = false;
        for (var i = 0; i < uiNoise.length; i++) {
            if (t.indexOf(uiNoise[i]) >= 0 && t.length < 15) { noise = true; break; }
        }
        if (noise) return;
        // 必须包含足够中文
        var cnCount = 0;
        for (var j = 0; j < t.length; j++) {
            var c = t.charCodeAt(j);
            if (c >= 0x4e00 && c <= 0x9fff) cnCount++;
        }
        if (cnCount < 5) return;

        seen[t] = true;
        candidates.push(t);
    });

    if (candidates.length === 0) {
        toast("⚠️ 未找到评论文字\n请在评论区页面使用");
        return;
    }

    toast("📊 找到 " + candidates.length + " 条评论，分析中...");
    var processed = 0;
    var fakeCount = 0;
    var realCount = 0;

    // 逐条发送API
    var i = 0;
    var timer = setInterval(function() {
        if (i >= candidates.length) {
            clearInterval(timer);
            toast("🎉 完成！共 " + processed + " 条\n🔴可疑 " + fakeCount + " 条\n🟢可信 " + realCount + " 条");
            return;
        }
        var text = candidates[i++];
        try {
            var resp = http.postJson(API_URL, {
                text: text,
                user_token: TOKEN
            });
            if (resp.statusCode == 200) {
                var data = resp.body.json();
                processed++;
                if (data.is_fake) fakeCount++; else realCount++;
                console.log((data.is_fake ? "🔴" : "🟢") + " " + text.slice(0, 40) + "...");
            }
        } catch (e) {
            processed++;
            console.log("⚪ (离线) " + text.slice(0, 40) + "...");
        }
    }, 1000);
}

// ====================== 浮窗 ======================
var floatBtn = null;

function createFloat() {
    floatBtn = floaty.window(
        <frame gravity="right|bottom" margin="0 0 100 16">
            <vertical>
                <button id="btn1" text="🔍 分析评论"
                    style="width:120;height:48;borderRadius:24;
                    background:#f97316;color:#fff;fontSize:15;
                    elevation:8;border:none;marginBottom:8;"/>
                <button id="btn2" text="📋 抓取店铺"
                    style="width:120;height:48;borderRadius:24;
                    background:#fff;color:#f97316;fontSize:15;
                    elevation:6;border:2px solid #f97316;"/>
            </vertical>
        </frame>
    );
    floatBtn.btn1.click(() => analyzeReviews());
    floatBtn.btn2.click(() => scrapeShop());
}

// ====================== 启动 ======================
if (!auto.service) {
    toast("请先开启无障碍服务");
    auto.waitFor();
}

createFloat();
toast("🚀 今天吃什么助手已就绪");
setInterval(function(){}, 2000);
