var ws = require("nodejs-websocket");
console.log("开始建立连接...")

var gameReady = false;
var controlReady = false;
var game = null;
var cotrol = null;


var server = ws.createServer(function(conn) {
    conn.on("text", function(str) {
        console.log("收到的信息为:" + str)
        if (str === "game") {
            game = conn;
            gameReady = true;
            console.log("Game is ready")
        }
        if (str === "control") {
            control = conn;
            controlReady = true;
            console.log("Control is ready")
        }

        if (gameReady && controlReady) {
            game.sendText(str);
        }
        conn.sendText(str);
    })
    conn.on("close", function(code, reason) {
        console.log("关闭连接")
    });
    conn.on("error", function(code, reason) {
        console.log("异常关闭")
    });
}).listen(8001)
console.log("WebSocket建立完毕")