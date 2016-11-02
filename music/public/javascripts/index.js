/**
 * Created by lenovo on 2016/9/24.
 */
function $(s) {
    return document.querySelectorAll(s);
}
//音乐列表切换
var lis = $('#list li');
for (var i=0;i<lis.length;i++){
    lis[i].onclick = function () {
        for(var j=0;j<lis.length;j++){
            lis[j].className = '';
        }
        this.className = 'selected';
        load('/media/'+this.title);
    }
}
//动画效果类型切换
//为了能够使draw区别对待dot和column
draw.type = 'column';

var types = $('#type li');
for(var i=0;i<types.length;i++){
    types[i].onclick = function () {
        for(var j=0;j<types.length;j++){
            types[j].className = '';
        }
        this.className = 'selected';
        draw.type = this.type;
    }
}
//创建一个ajax请求对象
var xhr = new XMLHttpRequest();
//创建一个AudioContext对象，此对象包含各个AudioNode对象（处理元）以及它们的联系；可以理解为
//一个audio上下文对象，绝大多数情况下，一个document中只有一个AudioContext;
var ac = new (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext)();
//创建GainNode对象：改变音频音量的对象；
var gn = ac.createGain() || ac.createGainNode();//ac[ac.createGain?"createGain":"createGainNode"]();
//将gn连接到ac的destination；在下面bufferSource就不需要再次连接到ac.destination
gn.connect(ac.destination);
//创建一个音频分析对象，它能实时的分析音频资源的频域和时域信息，但不会对音频做任何处理
var analyser = ac.createAnalyser();
var size = 256;
analyser.fftSize = size * 2;
analyser.connect(gn);

//解决一些播放时的bug
var source = null;
var count = 0;

function load(url) {
    //var n = ++count;//n在函数作用域中，count是全局变量，如果还没执行完就点击count会改变，
    // 而n不会每执行一次load()，都会声明一个n，比如点击三次，就会有三个n，它们分别的值是1,2,3.
    // 但是count是全局变量，点击三次之后count是3.所以前面两个n不等于count，不会顺利执行。
    // 只有最后一次点击时声明的n与count相等。所以只会播放最后一次点击的音频。
    var n = ++count;
    source && source[source.stop ? "stop" : "nodeOff"]();
    //可以先调用一个关闭上一个请求的方法
    xhr.abort();
    //打开一个请求，获取音频文件；
    xhr.open('GET',url);
    //音频文件是二进制文件，因此xhr的类型为："arraybuffer"
    xhr.responseType = 'arraybuffer';
    //异步解码音频文件,解码成功返回Audiobuffer对象存放未压缩的PCM格式音频文件，否则返回一个错误对象；
    xhr.onload = function () {
        if(n != count) return;
        ac.decodeAudioData(xhr.response,function (buffer) {
            if(n != count) return;
            var bufferSource = ac.createBufferSource();//创建一个声音源；
            bufferSource.buffer = buffer;//告诉声音源该播放的音频文件；
            bufferSource.connect(analyser);//将该源与硬件连接,通过buffersource->analyser->
            //gainNode->ac.destination实现；
            bufferSource[bufferSource.start?'start':'nodeOn'](0);
            source = bufferSource;

        }),function (err) {
            console.log(err);
        }
    }

    xhr.send();
}
//定义changeVolume的函数
function changeVolume(persent) {
    gn.gain.value = persent * persent;
}

$('#volume')[0].onchange = function () {
    changeVolume(this.value/this.max);
}
$("#volume")[0].onchange();

//定义音频数据视觉化函数
function visualiser() {
    var arr = new Uint8Array(analyser.frequencyBinCount);

    requestAnimationFrame = window.requestAnimationFrame ||
                            window.webkitRequestAnimationFrame ||
                            window.mozRequestAnimationFrame ||
                            window.msRequestAnimationFrame;
    function v() {
        analyser.getByteFrequencyData(arr);
        //开始依据音频数据绘制图案
        draw(arr);
        requestAnimationFrame(v);
    }
    requestAnimationFrame(v);
}
visualiser();

//利用canvas将数据可视化
var box = $('#box')[0];
var canvas = document.createElement('canvas');
box.appendChild(canvas);

//关于点状图部分
var dots = [];
function random(m,n) {
    return Math.round(Math.random()*(n-m) + m);
}
function getdots() {
    dots = [];
    for(var i=0;i<size;i++){
        var x = random(0,width);
        var y = random(0,height);
        var color = 'rgb('+random(0,255)+','+random(0,255)+','+random(0,255)+')';
        dots.push({
           x : x,
           y : y,
           color : color
        });
    }
}

var ctx = canvas.getContext('2d');
var height,width;

var line,g;

function resize() {
    height = box.clientHeight;
    width = box.clientWidth;
    canvas.height = height;
    canvas.width = width;
    //线性渐变也就是矩形的绘制样式
    line = ctx.createLinearGradient(0,0,0,height);
    line.addColorStop(0,'red');
    line.addColorStop(0.5,'green');
    line.addColorStop(1,'purple');

    getdots();
}
function draw(arr) {
    ctx.clearRect(0,0,width,height);

    var w = width/100;
    for(var i=0;i<size;i++){
        if(draw.type == 'column'){
            var h = arr[i]/256 * height;
            ctx.fillStyle = line;
            ctx.fillRect(w*i,height-h,w*0.6,h);
        }else if(draw.type == 'dot'){
            //取得dots里面对应的点信息
            ctx.beginPath();
            var dot = dots[i];
            var radius = arr[i]/256 * 50;
            ctx.arc(dot.x,dot.y,radius,0,Math.PI*2,true);
            //点渐变效果
            var g = ctx.createRadialGradient(dot.x,dot.y,0,dot.x,dot.y,radius);
            g.addColorStop(0,'#fff');
            g.addColorStop(1,dot.color);
            ctx.fillStyle = g;
            ctx.fill();
        }
    }
}

resize();
window.onresize = resize;

