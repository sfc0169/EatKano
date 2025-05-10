<!DOCTYPE html> <html lang="ja"> <head> <meta charset="UTF-8"> <meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no"> <title>Piano Tiles Game</title> <!-- jQuery --> <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script> <!-- Supabase SDK --> <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> <!-- CreateJS SoundJS --> <script src="https://code.createjs.com/1.0.0/soundjs.min.js"></script> <style> html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: sans-serif; background: #000; } /* ゲーム本体を包むコンテナ */ #gameBody { position: relative; width: 100%; height: 100%; overflow: hidden; } /* 黒タイルの背景レイヤー */ #GameLayerBG { position: fixed; top: 0; left: 50%; /* 以下の translateX(-50%) で常に横方向中央寄せ */ transform: translateX(-50%); /* 横幅は JS 側で blockSize*4 に動的に設定 */ height: 100%; pointer-events: none; } .GameLayer { position: absolute; /* translate3D を JS で動的に与える */ } .block { position: absolute; background: #111; pointer-events: auto; /* left/bottom/width/height は JS で動的に設定 */ } .block.t1 { background: #222; } .block.t2 { background: #333; } .block.t3 { background: #444; } .block.t4 { background: #555; } .block.t5 { background: #666; } .block.bad { background: red!important; } #GameTimeLayer { position: fixed; top: 0; left: 50%; transform: translateX(-50%); color: #fff; font-size: 1.2rem; text-align: center; width: 200px; pointer-events: none; } #GameScoreLayer.SHADE { position: fixed; top: 30%; left: 50%; transform: translate(-50%, -30%); display: none; color: #fff; text-align: center; background: rgba(0,0,0,0.8); padding: 1rem; border-radius: 8px; z-index: 1000; } /* 簡易 Welcome/Setting UI */ #welcome, #setting, #btn_group { position: fixed; top: 10%; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,0.9); padding: 1rem; border-radius: 8px; z-index: 1000; } #setting, #btn_group { display: none; } button { margin: 0.5rem; } input { margin: 0.2rem; } </style> </head> <body onload="init()"> <!-- Welcome --> <div id="welcome"> <h1 data-i18n="title">Piano Tiles</h1> <button onclick="readyBtn()" data-i18n="start">Start</button> <div> <span data-i18n="mode">Mode:</span> <span id="mode"></span> </div> <button id="sound" onclick="changeSoundMode()" data-i18n="sound-on">Sound On</button> <button onclick="show_setting()" data-i18n="setting">Settings</button> </div> <!-- Setting --> <div id="setting"> <div><label data-i18n="username">Username</label><input id="username" type="text" data-placeholder-i18n="username"></div> <div><label data-i18n="message">Comment</label><input id="message" type="text" data-placeholder-i18n="message"></div> <div><label data-i18n="keyboard">Keys</label><input id="keyboard" type="text" placeholder="dfjk"></div> <div><label data-i18n="gameTime">Time</label><input id="gameTime" type="number" min="1"></div> <div> <button onclick="save_cookie()" data-i18n="save">Save</button> <button onclick="show_btn()" data-i18n="back">Back</button> </div> </div> <!-- Retry / Back ボタン --> <div id="btn_group"> <button onclick="replayBtn()" id="replay" data-i18n="replay">Retry</button> <button onclick="backBtn()" data-i18n="back">Back</button> </div> <!-- Score Layer --> <div id="GameScoreLayer" class="SHADE"> <div id="GameScoreLayer-text"></div> <div><span data-i18n="cps">CPS:</span> <span id="cps">0</span></div> <div><span data-i18n="score">Score:</span> <span id="GameScoreLayer-score">0</span></div> <div><span data-i18n="best">Best:</span> <span id="best">0</span></div> </div> <script> // ───────────────────────────────────────────────────────────── // Supabase 初期化 const SUPABASE_URL = 'https://pazuftgivpsfqekecfvt.supabase.co'; const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.…あなたのキー…'; const supaClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// ゲームモード定数
const MODE_NORMAL   = 1,
MODE_ENDLESS  = 2,
MODE_PRACTICE = 3;

// ─── Supabase へ結果を送信 ────────────────────────────────
async function SubmitResultsToSupabase(){
const name    = ($('#username').val()||'').trim();
const comment = ($('#message').val()||'').trim();
if(!name) return; // ユーザー名未設定なら送信しない
const score = _gameScore;
const { data, error } = await supaClient
.from('leaderboard')
.insert([{ name, score, comment }]);
if(error){
alert('スコア保存エラー: '+error.message);
}
}

// ─── I18N ローダ ───────────────────────────────────────
function getJsonI18N(){
const LANGUAGES = [
{ regex:/^zh\b/, lang:'zh' },
{ regex:/^ja\b/, lang:'ja' },
{ regex:/.*/,   lang:'en'}
];
const lang = LANGUAGES.find(l=>l.regex.test(navigator.language)).lang;
let data = null;
$.ajax({
url:./static/i18n/${lang}.json,
dataType:'json',
async:false,
success:d=>data=d,
error:()=>{
console.warn(lang+'.json がありません。English にフォールバック');
$.ajax({
url:'./static/i18n/en.json',
dataType:'json',
async:false,
success:d=>data=d,
error:()=>{
console.error('en.json もありません。');
data={};
}
});
}
});
data.lang = lang;
return data;
}
const I18N = getJsonI18N();
$(function(){
$('[data-i18n]').each(function(){
const key = this.dataset.i18n;
if(I18N[key]!=null) $(this).text(I18N[key]);
});
$('[data-placeholder-i18n]').each(function(){
const key = this.dataset.placeholderI18n;
if(I18N[key]!=null) $(this).attr('placeholder', I18N[key]);
});
if(I18N.lang) $('html').attr('lang', I18N.lang);
});

// ─── グローバル変数群 ─────────────────────────────────
let isDesktop = !/(ipad|iphone|ipod|android|windows phone)/i.test(navigator.userAgent);
let map = {d:1, f:2, j:3, k:4};
let body, blockSize, GameLayer = [], GameLayerBG, GameTimeLayer, touchArea=[];
let transform, transitionDuration, welcomeLayerClosed;
let mode = MODE_NORMAL, soundMode = 'on';

// ゲーム進行管理
let _gameBBList = [], _gameBBListIndex = 0;
let _gameOver = false, _gameStart = false;
let _gameSettingNum=20, _gameTime, _gameTimeNum, _gameScore, _date1, deviationTime;
let _gameStartTime, _gameStartDatetime;

// ─── 初期化関数 ────────────────────────────────────────
window.init = function(){
// ゲームレイヤーを #gameBody 内に生成
if($('#GameLayerBG').length===0){
$('#gameBody').append(createGameLayer());
}
showWelcomeLayer();
body = document.getElementById('gameBody') || document.body;
body.style.height = window.innerHeight+'px';
// transform, transitionDuration 検出
if('webkitTransform' in body.style)      transform='webkitTransform';
else if('msTransform' in body.style)     transform='msTransform';
else                                      transform='transform';
transitionDuration = transform.replace(/ransform/g,'ransitionDuration');
GameTimeLayer = document.getElementById('GameTimeLayer');
GameLayerBG   = document.getElementById('GameLayerBG');
// 各 GameLayer
GameLayer = [
document.getElementById('GameLayer1'),
document.getElementById('GameLayer2')
];
GameLayer[0].children = GameLayer[0].querySelectorAll('div.block');
GameLayer[1].children = GameLayer[1].querySelectorAll('div.block');
// タッチ/クリックイベント設定
if(GameLayerBG){
GameLayerBG.ontouchstart = gameTapEvent;
GameLayerBG.onmousedown  = gameTapEvent;
}
gameInit();
initSetting();
window.addEventListener('resize',refreshSize,false);
// キーボード対応 (desktop)
if(isDesktop){
document.onkeydown = e=>{
let k=e.key.toLowerCase();
if(map[k]) click(map[k]);
};
}
};

// ─── モード取得/設定 ───────────────────────────────────
function getMode()      { return cookie('gameMode')?parseInt(cookie('gameMode')):MODE_NORMAL; }
function getSoundMode() { return cookie('soundMode') || 'on'; }
window.changeSoundMode = function(){
soundMode = (soundMode==='on'?'off':'on');
$('#sound').text(I18N[soundMode==='on'?'sound-on':'sound-off']);
cookie('soundMode', soundMode, 100);
};
function modeToString(m){
return m===MODE_NORMAL?I18N.normal:
m===MODE_ENDLESS?I18N.endless:
I18N.practice;
}
window.changeMode = function(m){
mode = m;
cookie('gameMode', m, 100);
$('#mode').text(modeToString(m));
};

// ─── Welcome → ゲーム開始 ─────────────────────────────
window.readyBtn = function(){
closeWelcomeLayer();
updatePanel();
};
function showWelcomeLayer(){
welcomeLayerClosed = false;
$('#mode').text(modeToString(mode));
$('#welcome').show();
}
function closeWelcomeLayer(){
welcomeLayerClosed = true;
$('#welcome').hide();
}

// ─── 画面サイズ変化対応 ───────────────────────────────
let refreshSizeTime;
function refreshSize(){
clearTimeout(refreshSizeTime);
refreshSizeTime = setTimeout(_refreshSize,200);
}
function _refreshSize(){
if(!body) body = document.getElementById('gameBody') || document.body;
countBlockSize();
// 各ブロック位置・サイズ調整
GameLayer.forEach(box=>{
box.children.forEach((r,j)=>{
r.style.left   = (j%4)*blockSize+'px';
r.style.bottom = Math.floor(j/4)*blockSize+'px';
r.style.width  = blockSize+'px';
r.style.height = blockSize+'px';
});
});
// 縦スクロール位置も再配置
let f, a;
if(GameLayer[0].y > GameLayer[1].y){ f=GameLayer[0]; a=GameLayer[1]; }
else                                { f=GameLayer[1]; a=GameLayer[0]; }
let y = (_gameBBListIndex % 10)*blockSize;
f.y = y;
f.style[transform] = 'translate3D(0,'+y+'px,0)';
a.y = y - blockSize * Math.floor(f.children.length/4);
a.style[transform] = 'translate3D(0,'+a.y+'px,0)';
}

// ─── ブロックサイズ・中央寄せ計算 ─────────────────────
function countBlockSize(){
blockSize = body.offsetWidth / 4;
body.style.height = window.innerHeight + 'px';
if(GameLayerBG){
// 幅を 4×blockSize に固定し、中央寄せ
GameLayerBG.style.width  = (blockSize4) + 'px';
GameLayerBG.style.left   = '50%';
GameLayerBG.style[transform] = 'translateX(-50%)';
GameLayerBG.style.height = window.innerHeight + 'px';
}
touchArea[0] = window.innerHeight;
touchArea[1] = window.innerHeight - blockSize3;
}

// ─── ゲーム初期化 / リスタート ───────────────────────
function gameInit(){
if(createjs && createjs.Sound){
createjs.Sound.registerSound({src:"./static/music/err.mp3",id:"err"});
createjs.Sound.registerSound({src:"./static/music/end.mp3",id:"end"});
createjs.Sound.registerSound({src:"./static/music/tap.mp3",id:"tap"});
}
gameRestart();
}
function gameRestart(){
_gameBBList = [];
_gameBBListIndex = 0;
_gameScore = 0;
_gameOver = false;
_gameStart = false;
_gameSettingNum = parseInt(cookie('gameTime')) || 20;
_gameTimeNum = _gameSettingNum;
countBlockSize();
if(blockSize>0){
refreshGameLayer(GameLayer[0]);
refreshGameLayer(GameLayer[1], 1);
}
updatePanel();
}

// ─── ゲーム開始 / タイマー ────────────────────────────
function gameStart(){
_date1 = new Date();
_gameStartDatetime = _date1.getTime();
_gameStart = true;
_gameStartTime = 0;
clearInterval(_gameTime);
_gameTime = setInterval(timer, 1000);
}
function timer(){
_gameTimeNum--;
_gameStartTime++;
if(mode===MODE_NORMAL && _gameTimeNum<=0){
GameTimeLayer.innerHTML = I18N['time-up'] + '!';
gameOver();
if(GameLayerBG) GameLayerBG.classList.add('flash');
if(soundMode==='on' && createjs.Sound) createjs.Sound.play("end");
}
updatePanel();
}

// ─── パネル更新 ─────────────────────────────────────
function updatePanel(){
if(!GameTimeLayer) return;
if(mode===MODE_NORMAL){
if(!_gameOver) GameTimeLayer.innerHTML = 'TIME:' + Math.ceil(_gameTimeNum);
}
else if(mode===MODE_ENDLESS){
let cps = _gameStartDatetime ? (_gameScore/((new Date().getTime()-_gameStartDatetime)/1000)) : 0;
GameTimeLayer.innerHTML = 'CPS:' + (cps? cps.toFixed(2) : (I18N['calculating']||'...'));
}
else{
GameTimeLayer.innerHTML = 'SCORE:' + _gameScore;
}
}

// ─── 誤タップ / 正常タップ判定 ───────────────────────
let _ttreg=/ t{1,2}(\d+)/,
_clearttClsReg=/ t{1,2}\d+| bad/;
function refreshGameLayer(box, loop, offset){
if(!box||!box.children||blockSize<=0) return;
let i = Math.floor(Math.random()*4) + (loop?0:4);
for(let j=0;j<box.children.length;j++){
let r=box.children[j];
r.style.left   = (j%4)*blockSize+'px';
r.style.bottom = Math.floor(j/4)*blockSize+'px';
r.style.width  = blockSize+'px';
r.style.height = blockSize+'px';
r.className = r.className.replace(_clearttClsReg,'');
r.notEmpty = false;
if(i===j){
_gameBBList.push({cell:i%4, id:r.id});
r.className += ' t'+(Math.floor(Math.random()*5)+1);
r.notEmpty = true;
i = (Math.floor(j/4)+1)4 + Math.floor(Math.random()4);
}
}
if(loop){
box.style[transitionDuration] = '0ms';
box.style.display = 'none';
box.y = -blockSize(Math.floor(box.children.length/4)+(offset||0));
box.style[transform] = 'translate3D(0,'+box.y+'px,0)';
setTimeout(()=>{ box.style.display='block'; },50);
} else {
box.y = 0;
box.style[transform] = 'translate3D(0,0,0)';
}
box.style[transitionDuration] = '150ms';
}
function gameLayerMoveNextRow(){
GameLayer.forEach(g=>{
if(!g||!g.children) return;
g.y += blockSize;
if(g.y > blockSize(Math.floor(g.children.length/4))){
refreshGameLayer(g,1,-1);
} else {
g.style[transform] = 'translate3D(0,'+g.y+'px,0)';
}
});
}

function gameTapEvent(e){
if(_gameOver) return false;
let tar = e.target;
let cy = e.clientY || (e.targetTouches && e.targetTouches[0].clientY) || 0;
let cx = (e.clientX || (e.targetTouches && e.targetTouches[0].clientX) || 0)
- (body?body.offsetLeft:0);
if(_gameBBListIndex >= _gameBBList.length) return false;
if(cy>touchArea[0] || cy<touchArea[1]) return false;
let p = _gameBBList[_gameBBListIndex];
let correct = document.getElementById(p.id);
let hit = false;
if(p.id===tar.id && tar.notEmpty) hit=true;
else if(p.cell===0 && cx<blockSize && correct && correct.notEmpty) hit=true;
else if(p.cell===1 && cx>blockSize && cx<2blockSize && correct && correct.notEmpty) hit=true;
else if(p.cell===2 && cx>2blockSize && cx<3blockSize && correct && correct.notEmpty) hit=true;
else if(p.cell===3 && cx>3blockSize && correct && correct.notEmpty) hit=true;

if(hit){
if(!_gameStart) gameStart();
if(soundMode==='on' && createjs.Sound) createjs.Sound.play("tap");
if(correct){
correct.className = correct.className.replace(_ttreg,' tt$1');
correct.notEmpty = false;
}
_gameBBListIndex++;
_gameScore++;
updatePanel();
gameLayerMoveNextRow();
} else if(_gameStart && tar.classList && tar.classList.contains('block') && !tar.notEmpty){
if(soundMode==='on' && createjs.Sound) createjs.Sound.play("err");
tar.classList.add('bad');
if(mode===MODE_PRACTICE){
setTimeout(()=>tar.classList.remove('bad'),500);
} else {
gameOver();
}
}
return false;
}

// ─── ゲームオーバー処理 ─────────────────────────────────
function gameOver(){
_gameOver = true;
clearInterval(_gameTime);
updatePanel();
setTimeout(()=>{
if(GameLayerBG) GameLayerBG.classList.remove('flash');
showGameScoreLayer(getCPS());
$('#replay').focus();
},1500);
}
function getCPS(){
if(!_gameStartDatetime) return 0;
let t=(new Date().getTime()-_gameStartDatetime)/1000;
return t>0? _gameScore/t : 0;
}

// ─── クリエイト HTML ───────────────────────────────────
function createGameLayer(){
let html = '<div id="GameLayerBG">';
for(let i=1;i<=2;i++){
html += <div id="GameLayer${i}" class="GameLayer">;
for(let j=0;j<10;j++){
for(let k=0;k<4;k++){
let num = k + j*4;
html += <div id="GameLayer${i}-${num}" num="${num}" class="block${k?' bl':''}"></div>;
}
}
html += '</div>';
}
html += '</div>';
html += '<div id="GameTimeLayer" class="text-center"></div>';
return html;
}

// ─── スコア表示 ───────────────────────────────────────
function showGameScoreLayer(cps){
let $l = $('#GameScoreLayer');
// 最後に押したタイルの色を bgcN に
let cls = 'bgc1';
let last = _gameBBList[_gameBBListIndex-1];
if(last){
let c = (document.getElementById(last.id)||{}).className.match(_ttreg);
if(c && c[1]) cls = 'bgc'+c[1];
}
$l.attr('class','SHADE '+cls);
$('#GameScoreLayer-text').html(shareText(cps));
let displayScore = (mode===MODE_ENDLESS? cps : _gameScore);
let best = getBestScore(displayScore);
$l.css('color', (mode!==MODE_NORMAL||legalDeviationTime())? '':'red' );
$('#cps').text(cps.toFixed(2));
$('#score').text(displayScore.toFixed(mode===MODE_ENDLESS?2:0));
$('#GameScoreLayer-score').css('display', mode===MODE_ENDLESS?'none':'block');
$('#best').text(best.toFixed(mode===MODE_ENDLESS?2:0));
$l.show();
}
function hideGameScoreLayer(){
$('#GameScoreLayer').hide();
}

// ─── リトライ / 戻る ─────────────────────────────────
window.replayBtn = function(){
gameRestart();
hideGameScoreLayer();
};
window.backBtn = function(){
gameRestart();
hideGameScoreLayer();
showWelcomeLayer();
};

// ─── シェアテキスト & Supabase 送信呼び出し ─────────────
function shareText(cps){
if(mode===MODE_NORMAL){
let d2=new Date();
deviationTime = d2.getTime() - (_date1?_date1.getTime():d2.getTime());
if(!legalDeviationTime()){
return I18N['time-over'] + ((deviationTime/1000)-_gameSettingNum).toFixed(2) + 's';
}
SubmitResultsToSupabase();
}
if(cps<=5)  return I18N['text-level-1'];
if(cps<=8)  return I18N['text-level-2'];
if(cps<=10) return I18N['text-level-3'];
if(cps<=15) return I18N['text-level-4'];
return I18N['text-level-5'];
}

// ─── Cookie ユーティリティ ───────────────────────────
function toStr(o){ return (typeof o==='object')? JSON.stringify(o): String(o); }
function cookie(name, value, days){
if(value!==undefined){
let expires = '';
if(days){
let d=new Date();
d.setTime(d.getTime()+days864e5);
expires = ';expires='+d.toUTCString();
}
document.cookie = name+'='+escape(toStr(value))+expires+';path=/';
return true;
}
let m = document.cookie.match('(?:^|;)\s'+name+'=([^;]+)');
if(m){
let v = unescape(m[1]);
try{ if((v[0]=='{'&&v.slice(-1)=='}')||(v[0]=='['&&v.slice(-1)==']')) return JSON.parse(v); }
catch(e){}
if(!isNaN(parseFloat(v))&&isFinite(v)) return parseFloat(v);
return v;
}
return null;
}

// ─── その他 UI 初期値ロード ──────────────────────────
function initSetting(){
$('#username').val(cookie('username')||'');
$('#message').val(cookie('message')||'');
let kb = cookie('keyboard');
if(kb && kb.length===4){
$('#keyboard').val(kb);
map = {};
map[kb[0]] = 1;
map[kb[1]] = 2;
map[kb[2]] = 3;
map[kb[3]] = 4;
}
let gt = cookie('gameTime');
if(gt) {
$('#gameTime').val(gt);
_gameSettingNum = parseInt(gt) || _gameSettingNum;
}
let titleVal = cookie('title');
if(titleVal){
$('title').text(titleVal);
$('#title').val(titleVal);
}
}

// ─── 設定パネル／戻る表示切替 ────────────────────────
window.show_setting = function(){
$('#welcome,#btn_group').hide();
$('#setting').show();
$('#sound').text(soundMode==='on'? I18N['sound-on']:I18N['sound-off']);
};
window.show_btn = function(){
$('#setting').hide();
$('#welcome,#btn_group').show();
};

})(window);
</script>

</body> </html>
