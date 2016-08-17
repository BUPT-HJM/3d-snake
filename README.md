# 3d-snake

## **最终效果**
<img src="http://7xp9v5.com1.z0.glb.clouddn.com/game.gif" alt="">
- demo访问地址： [http://bupt-hjm.github.io/3d-snake](http://bupt-hjm.github.io/3d-snake) 
- github地址：[https://github.com/BUPT-HJM/3d-snake](https://github.com/BUPT-HJM/3d-snake)

> demo只能访问到无websocket服务器的一部分，按键盘上下左右控制贪吃蛇的移动

## **如何愉快地玩耍**

- 第一步，~~当然是先star啦这是必须的呀:)~~ 先`git clone`把项目下到本地
- 第二步，当然你电脑得`node`，因为我的`node_modules`已经直接放在github上了，就不用你`npm install`了，你就可以直接一步`node websocket.js`开启websocket服务器
- 第三步就是把index.html和index2.html都打开就可以啦，可以通过index2.html的遥控来控制index.html

> 有人可能会问，标题不是写手机控制吗，当然你也可以本地再起个服务器，然后电脑和手机同一个局域网，手机访问index2.html就行了（注意要变动下localhost），或者也可以挂到云主机上，这个我试过了效果还不错，因为这个我做的这个只支持单用户，就不放地址了

## **项目细节**

### **一、threejs构建3D立体效果**
>游戏中使用threejs创建了场景,摆好相机，然后加上一个渲染器便实现了酷炫的3D效果
>（以下只给关键代码，省去部分代码）

**1.创建场景**
``` javascript
//场景
scene = new THREE.Scene();
//照相机
camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -500, 1000);
camera.position.x = 100;
camera.position.y = 100;
camera.position.z = 100;
//渲染器
renderer = new THREE.CanvasRenderer();
renderer.setClearColor( 0xf0f0f0 );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
container.appendChild( renderer.domElement );
```
**2.场景加入必要的东西**
``` javascript
//加入线条
var size = 500, step = 50;

var geometry = new THREE.Geometry();
for ( var i = - size; i <= size; i += step) {

    geometry.vertices.push( new THREE.Vector3( - size, 0, i ) );
    geometry.vertices.push( new THREE.Vector3(   size, 0, i ) );

    geometry.vertices.push( new THREE.Vector3( i, 0, - size ) );
    geometry.vertices.push( new THREE.Vector3( i, 0,   size ) );
}
var material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } );

var line = new THREE.LineSegments( geometry, material );
scene.add( line );


//加入灯光
var ambientLight = new THREE.AmbientLight( Math.random() * 0x10 );
scene.add( ambientLight );

var directionalLight = new THREE.DirectionalLight( 0xffffff );
directionalLight.position.x = -0.3;
directionalLight.position.y = 0.8;
directionalLight.position.z = 0.3;
directionalLight.position.normalize();
scene.add( directionalLight );
```

>可能有读者疑问，那个蛇的部分哪里加进去了，蛇的部分就是一些正方体，以为蛇的长度会变动，所以并没有在`init`代码中具体加入，只给出了`cubeGroup = new THREE.Object3D();`
>而在贪吃蛇游戏部分封装了一个绘制Cube的韩式易于调用绘制蛇身，也是往`scene`加入

``` javascript
function Cube(x, y, z, a, color) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.a = a;
    this.color = color;
 }

Cube.prototype.draw = function() {
    var geometry = new THREE.BoxGeometry( this.a, this.a, this.a );
    var material = new THREE.MeshLambertMaterial( { color: this.color, overdraw: 0.5 } );
    var cube = new THREE.Mesh( geometry, material );
    cube.position.x = this.x;
    cube.position.z = this.z;
    cubeGroup.add(cube);
    scene.add(cubeGroup);
 }
```

**3.创建交互动画**
>其实此部分也只是实现一直重绘，而不是空间移动，通过照相机的视角实现3D效果

``` javascript
function render() {
    //写变化
    scene.remove(cubeGroup);
    cubeGroup = new THREE.Object3D();
    snake.draw();
    if(GameStart) {
        snake.move();
    }
    food.draw();
    camera.lookAt( scene.position );
    renderer.render( scene, camera );
}
```

### **二、贪吃蛇游戏算法部分**
>其实贪吃蛇的算法并不难，就是刚开始先定好初始长度，其实蛇的身子就是一个数组，移动的关键在于`蛇头`,要特别的取出蛇头，在键盘交互或者消息传输来后给出移动方向后，在蛇头处“缓存”一个相同的蛇头，根据坐标判断是否吃到东西，假如蛇头碰到食物，就直接让原来的蛇头往那个方向移动，刚刚放的那个相同的蛇头就在原处（就是其他不变），这样就实现了增长和移动,假如没碰到食物，还是让原来那个蛇头也是往那个方向移动，但是要把这个蛇的身子的这个数组`pop()`掉最后一个元素，实现蛇身长度没变。这样一直做下去，其实也就实现了贪吃蛇游戏。

``` javascript
function Snake () {
    var snakeArr = [];
    for (var i = 0; i < 4; i++) {
        var cube = new Cube(i*50, 50, 0, 50, 0xffffff);
        snakeArr.splice(0,0,cube);
    }
    var head = snakeArr[0];
    head.color = "red";


    this.head = snakeArr[0];
    this.snakeArr = snakeArr;
    this.direction = 39;
}

Snake.prototype.draw = function () {
    if(this.isover) {
        return;
    }
    for (var i = 0; i < this.snakeArr.length; i++) {
        this.snakeArr[i].draw();
    }
}

Snake.prototype.move = function () {
    var cube = new Cube(this.head.x, this.head.y, this.head.z, this.head.a, 0xffffff);
    this.snakeArr.splice(1, 0, cube);


    if (isEat()) {
        food = new getRandomFood();
    } else {
        this.snakeArr.pop();

    }
    switch (this.direction) {
        case 37://左
            this.head.x -= this.head.a;
            break;
        case 38://上
            this.head.z -= this.head.a;
            break;
        case 39: //右
            this.head.x += this.head.a;
            break;
        case 40://下
            this.head.z += this.head.a;
            break;
        default:
            break;
    }
    if (this.head.x > 450 || this.head.x < -500 || this.head.z > 450 || this.head.z < -500){
            this.isover= true;
            stop();
    }

    for (var i = 1; i < this.snakeArr.length; i++) {
        if (this.snakeArr[i].x == this.head.x && this.snakeArr[i].z == this.head.z){
            this.isover= true;
            stop();
        }
    }
 }
```

>到这里基本贪吃蛇游戏关键部分讲解也就结束了，我这里也只是粗略的讲解，代码只截取部分，有需要的可以直接上[https://github.com/BUPT-HJM/3d-snake](https://github.com/BUPT-HJM/3d-snake)查看。建议读者可以先尝试用`canvas`去写,原理都是一样的。

### **三、websocket多屏互动部分**
>这里我使用了`nodejs-websocket`，其实用起来也不是很复杂

**1.websocket服务器部分**
在服务器这里的部分就是需要开server，listen一下端口，判断游戏端和控制端是否都加载完成，并且要判断是游戏端还是控制端来保存connection对象，具体可以参考[https://www.npmjs.com/package/nodejs-websocket](https://www.npmjs.com/package/nodejs-websocket)
``` javascript
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
```

**2.游戏端部分**
游戏端通过`onmessage`来接收消息，然后根据消息对页面交互
``` javascript
if (window.WebSocket) {
        var ws = new WebSocket('ws://localhost:8001');

        ws.onopen = function(e) {
            console.log("连接服务器成功");
            ws.send("game");
        }
        ws.onclose = function(e) {
            console.log("服务器关闭");
        }
        ws.onerror = function() {
            console.log("连接出错");
        }

        ws.onmessage = function(e) {
            switch(e.data){
                    case "left":{
                        if (snake.direction !== 39){
                            GameStart = true;
                            snake.direction = 37;
                        }
                        break;
                    }
                    case "top":{
                        if (snake.direction !== 40){
                            GameStart = true;
                            snake.direction = 38;
                        }
                        break;
                    }
                    case "right":{
                        if (snake.direction !== 37){
                            GameStart = true;
                            snake.direction = 39;

                        }
                        break;
                    }
                    case "bottom":{
                        if (snake.direction !== 38){
                            GameStart = true;
                            snake.direction = 40;
                        }
                        break;
                    }
                    case "restart": {
                        location.reload();
                        break;
                    }
                    default:
                        break;
                }
        }
    }
```

**3.控制端部分**
通过点击`send`不同的消息
``` javascript
if (window.WebSocket) {
        var ws = new WebSocket('ws://localhost:8001');

        ws.onopen = function(e) {
            console.log("连接服务器成功");
            ws.send("control");
        }
        ws.onclose = function(e) {
            console.log("服务器关闭");
        }
        ws.onerror = function() {
            console.log("连接出错");
        }

        ws.onmessage = function(e) {
        }
    }
    document.querySelector(".item-1 .item-tri-1").onclick = function() {
        ws.send("top");
    }
    document.querySelector(".item-1 .item-tri-2").onclick = function() {
        ws.send("bottom");
    }
    document.querySelector(".item-2 .item-tri-1").onclick = function() {
        ws.send("left");
    }
    document.querySelector(".item-2 .item-tri-2").onclick = function() {
        ws.send("right");
    }
    document.querySelector("#restart").onclick = function() {
        ws.send("restart");
    }
```

最后大功告成啦哈哈哈~看完记得给star啦~送上github地址[https://github.com/BUPT-HJM/3d-snake](https://github.com/BUPT-HJM/3d-snake),欢迎`clone`愉快地玩耍~



## **参考**
- [threejs中文文档](http://techbrood.com/threejs/docs/#使用指南/入门介绍/创建一个场景(Scene))
- [http://www.cnblogs.com/axes/p/3586132.html](http://www.cnblogs.com/axes/p/3586132.html)


---

>可自由转载、引用，但需署名作者且注明文章出处。