"auto";
console.show();
console.log("=== 调试开始 ===");

// 测试 1: toast
try {
    toast("测试1: toast 正常");
    console.log("✅ toast OK");
} catch(e) { console.log("❌ toast: " + e); }

sleep(1000);

// 测试 2: floaty.rawWindow 最小用法
var w = null;
try {
    w = floaty.rawWindow(
        <frame gravity="right|bottom">
            <button id="b" text="测"
                style="width:60;height:60;background:#f97316;color:#fff;fontSize:20;"/>
        </frame>
    );
    w.setPosition(device.width - 80, device.height - 200);
    console.log("✅ floaty rawWindow OK, w=" + w);
} catch(e) {
    console.log("❌ floaty rawWindow: " + e);
    // 降级试普通floaty.window
    try {
        w = floaty.window(
            <frame gravity="right|bottom">
                <button id="b" text="测2"
                    style="width:60;height:60;background:#f97316;color:#fff;fontSize:20;"/>
            </frame>
        );
        w.setPosition(device.width - 80, device.height - 200);
        console.log("✅ floaty.window OK");
    } catch(e2) {
        console.log("❌ floaty.window also failed: " + e2);
    }
}

sleep(500);

// 测试 3: click 事件
var clicked = false;
try {
    w.b.click(function() {
        clicked = true;
        toast("按钮被点击了！");
        console.log("✅ click事件触发");
    });
    console.log("✅ click绑定 OK");
} catch(e) {
    console.log("❌ click绑定: " + e);
    // 试试其他方式
    try {
        w.b.on("click", function() {
            clicked = true;
            toast("onclick触发");
        });
        console.log("✅ on(click) OK");
    } catch(e2) {
        console.log("❌ on(click): " + e2);
    }
}

// 测试 4: http
try {
    var resp = http.get("https://what-to-eat-production-35c2.up.railway.app/api/health");
    console.log("✅ http GET: " + resp.statusCode + " " + resp.body.string());
} catch(e) {
    console.log("❌ http: " + e);
}

// 测试 5: 截图
try {
    requestScreenCapture();
    sleep(500);
    var img = captureScreen();
    if (img) {
        console.log("✅ 截图 OK: " + img.getWidth() + "x" + img.getHeight());
        img.recycle();
    } else {
        console.log("❌ 截图返回null");
    }
} catch(e) {
    console.log("❌ 截图: " + e);
}

// 测试 6: OCR
try {
    var img2 = captureScreen();
    var r = ocr.detect(img2, { mode: "zh" });
    console.log("✅ OCR OK: " + (r ? r.length : 0) + " 条结果");
    img2.recycle();
} catch(e) {
    console.log("❌ OCR: " + e.message);
}

console.log("=== 调试结束，按钮应显示在右下角 ===");
toast("调试完成，查看日志");
setInterval(function(){}, 3000);
