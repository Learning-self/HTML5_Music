/**
 * Created by lenovo on 2016/10/4.
 */
function musicVisualiser(obj) {
    //当前正在播放的资源
    this.source = null;
    //记录点击次数
    this.count = 0;
    //创建一个音频分析对象
    this.analyser = ac.createAnalyser();
    this.size = obj.size;
    this.analyser.fftSize = this.size * 2;
    //创建一个音量控制对象
    this.gainNode = ac[ac.createGain?'createGain':'createGainNode']();
    //进行连接
    this.source.connect(this.analyser);
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(ac.destination);
    //建立ajax请求
    this.xhr = new XMLHttpRequest();
}
//定义一个全局的AudioContext;
var ac = new (window.AudioContext ||
              window.mozAudioContext ||
              window.webkitAudioContext  ||
              window.msAudioContext)();
//定义对象的获取音频函数
musicVisualiser.prototype.load = function (url,fun) {
    this.xhr.open('GET',url);
    this.xhr.responseType = 'arraybuffer';
    var self = this;
    this.xhr.onload = function () {
        fun(self.xhr.response);
    }
}
//定义解码函数
musicVisualiser.prototype.decode = function (arrayBuffer) {
    ac.decodeAudioData(arrayBuffer,succ(buffer){
        var audioBuffersource = ac.createBufferSource();
        audioBuffersource.buffer = buffer;
        audioBuffersource.connect(musicVisualiser.source);
        audioBuffersource[audioBuffersource.start?'start':'nodeOn']();
    },err(e){
        console.log(e);
    });
}
