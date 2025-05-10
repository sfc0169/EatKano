// IMPORTANT: Make sure to include the Supabase SDK in your HTML file before this script:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const MODE_NORMAL = 1, MODE_ENDLESS = 2, MODE_PRACTICE = 3;

// ─── Supabase Client Initialization ───
const SUPABASE_URL = 'https://pazuftgivpsfqekecfvt.supabase.co';
// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// IMPORTANT: REPLACE WITH YOUR ACTUAL SUPABASE ANONYMOUS KEY
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhenVmdGdpdnBzZnFla2VjZnZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NzUwNTUsImV4cCI6MjA2MjM1MTA1NX0.m_N4lzEf6rbSqN18oDre4MCx8MteakGfyvv9vs3p5EY'; // 提供されたキーを使用
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
const supaClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// ─── End of Supabase Client Initialization ───

(function(w) {

    // ─── Supabase Submit Score Function (Replaces old SubmitResults and encrypt) ───
    async function SubmitResultsToSupabase() {
        const usernameVal = ($("#username").val() || '').trim(); // Get value from HTML input
        const messageVal = ($("#message").val() || '').trim();   // Get value from HTML input

        if (!usernameVal) {
            // console.log("Username not entered in settings. Score will not be submitted to Supabase.");
            // alert("ユーザー名が設定画面で入力されていません。スコアはランキングに登録されません。"); // Optional: Notify user
            return; // Do not submit if username is empty
        }

        const scoreToSubmit = _gameScore; // Use the current game score

        // console.log(`Attempting to submit to Supabase: Name=${usernameVal}, Score=${scoreToSubmit}, Comment=${messageVal}`);

        const { data, error } = await supaClient
            .from('leaderboard') // Ensure this is your table name
            .insert([
                { name: usernameVal, score: scoreToSubmit, comment: messageVal }
                // created_at is expected to be set by DB (DEFAULT now())
            ]);

        if (error) {
            console.error('Supabase score submission error:', error);
            alert('スコアの保存に失敗しました。エラー: ' + error.message);
        } else {
            // console.log('Supabase score submission successful:', data);
            // alert('スコアがランキングに保存されました！'); // Optional: Notify user of success
        }
    }
    // ─── End of Supabase Submit Score Function ───

    function getJsonI18N() {
        const LANGUAGES = [
            { regex: /^zh\b/, lang: 'zh' },
            { regex: /^ja\b/, lang: 'ja' },
            { regex: /.*/, lang: 'en'}
        ];
        const lang = LANGUAGES.find(l => l.regex.test(navigator.language))?.lang || 'en';
        
        let i18nData = null; // Initialize to null
        $.ajax({
            url: `./static/i18n/${lang}.json`,
            dataType: 'json',
            method: 'GET',
            async: false, // Synchronous: Blocks execution until complete.
            success: data => i18nData = data, // Assign to local i18nData
            error: () => {
                // alert('找不到语言文件: ' + lang); // Original alert
                console.warn('Language file not found: ' + lang + '.json. Falling back to English.');
                $.ajax({
                    url: `./static/i18n/en.json`,
                    dataType: 'json',
                    method: 'GET',
                    async: false,
                    success: data => i18nData = data,
                    error: () => {
                        console.error('English language file also not found.');
                        i18nData = {}; // Assign empty object to prevent errors
                    }
                });
            }
        });
        return i18nData;
    }

    const I18N = getJsonI18N();

    // Apply I18N texts after DOM is ready
    $(function() {
        if (I18N) { // Check if I18N was loaded successfully
            $('[data-i18n]').each(function() {
                const key = this.dataset.i18n;
                if (I18N[key] !== undefined) {
                    $(this).text(I18N[key]);
                }
            });
            $('[data-placeholder-i18n]').each(function() {
                const key = this.dataset.placeholderI18n;
                if (I18N[key] !== undefined) {
                    $(this).attr('placeholder', I18N[key]);
                }
            });
            if (I18N['lang']) {
                $('html').attr('lang', I18N['lang']);
            }
        }
    });

    let isDesktop = !navigator['userAgent'].match(/(ipad|iphone|ipod|android|windows phone)/i);
    let fontunit = isDesktop ? 20 : ((window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth) / 320) * 10;
    document.write('<style type="text/css">' +
        'html,body {font-size:' + (fontunit < 30 ? fontunit : '30') + 'px;}' +
        // ゲーム要素を中央揃えするために追加したCSS
        '#gameBody {margin:0 auto; max-width:100%; position:relative;} ' +
        '#GameLayerBG {margin:0 auto; position:relative;} ' +
        (isDesktop ? '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position: absolute;}' :
            '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position:fixed;}@media screen and (orientation:landscape) {#landscape {display: box; display: -webkit-box; display: -moz-box; display: -ms-flexbox;}}') +
        '</style>');

    let map = {'d': 1, 'f': 2, 'j': 3, 'k': 4};
    if (isDesktop) {
        document.write('<div id="gameBody">'); // オリジナルに合わせて開始タグだけを書き込む
        document.onkeydown = function (e) {
            let key = e.key.toLowerCase();
            if (map.hasOwnProperty(key)) { // More direct check
                click(map[key]);
            }
        }
    }

    let body, blockSize, GameLayer = [],
        GameLayerBG, touchArea = [],
        GameTimeLayer;
    let transform, transitionDuration, welcomeLayerClosed;

    let mode = getMode();
    let soundMode = getSoundMode();

    w.init = function() {
        // オリジナルコードに合わせて実装
        showWelcomeLayer();
        body = document.getElementById('gameBody') || document.body;
        body.style.height = window.innerHeight + 'px';

        transform = typeof (body.style.webkitTransform) !== 'undefined' ? 'webkitTransform' : (typeof (body.style.msTransform) !==
        'undefined' ? 'msTransform' : 'transform');
        transitionDuration = transform.replace(/ransform/g, 'ransitionDuration');

        GameTimeLayer = document.getElementById('GameTimeLayer');
        GameLayer.push(document.getElementById('GameLayer1'));
        GameLayer[0].children = GameLayer[0].querySelectorAll('div');
        GameLayer.push(document.getElementById('GameLayer2'));
        GameLayer[1].children = GameLayer[1].querySelectorAll('div');
        GameLayerBG = document.getElementById('GameLayerBG');

        if (GameLayerBG) {
            if (GameLayerBG.ontouchstart === null) {
                GameLayerBG.ontouchstart = gameTapEvent;
            } else {
                GameLayerBG.onmousedown = gameTapEvent;
            }
        } else {
            console.error("GameLayerBG not found in init.");
            return;
        }

        gameInit();
        initSetting();
        window.addEventListener('resize', refreshSize, false);
    }

    function getMode() { // Original
        const modeCookie = cookie('gameMode');
        return modeCookie ? parseInt(modeCookie) : MODE_NORMAL;
    }

    function getSoundMode() { // Original
        return cookie('soundMode') || 'on';
    }

    w.changeSoundMode = function() { // Original, with I18N check
        soundMode = (soundMode === 'on' ? 'off' : 'on');
        if (I18N) $('#sound').text(I18N[soundMode === 'on' ? 'sound-on' : 'sound-off']);
        cookie('soundMode', soundMode, 100);
    }

    function modeToString(m) { // Original, with I18N check
        if(!I18N) return "Mode";
        return m === MODE_NORMAL ? I18N['normal'] : (m === MODE_ENDLESS ? I18N['endless'] : I18N['practice']);
    }

    w.changeMode = function(m) { // Original
        mode = m;
        cookie('gameMode', m, 100);
        $('#mode').text(modeToString(m));
    }

    w.readyBtn = function() { // Original
        closeWelcomeLayer();
        updatePanel();
    }

    w.winOpen = function() { // Original
        window.open(location.href + '?r=' + Math.random(), 'nWin', 'height=500,width=320,toolbar=no,menubar=no,scrollbars=no');
        let opened = window.open('about:blank', '_self');
        if(opened) { opened.opener = null; opened.close(); }
    }

    let refreshSizeTime; // Original
    function refreshSize() { clearTimeout(refreshSizeTime); refreshSizeTime = setTimeout(_refreshSize, 200); }

    function _refreshSize() { // Original logic, with fixes for original
        if (!body) body = document.getElementById('gameBody') || document.body;
        if (!body || body.offsetWidth === 0) return;
        countBlockSize();
        if (blockSize <= 0) return;
        if (GameLayer.length < 2 || !GameLayer[0]?.children || !GameLayer[1]?.children) return;

        for (let i = 0; i < GameLayer.length; i++) {
            let box = GameLayer[i];
            for (let j = 0; j < box.children.length; j++) {
                let r = box.children[j], rstyle = r.style;
                rstyle.left = (j % 4) * blockSize + 'px';
                rstyle.bottom = Math.floor(j / 4) * blockSize + 'px';
                rstyle.width = blockSize + 'px'; rstyle.height = blockSize + 'px';
            }
        }
        let f, a;
        if (GameLayer[0].y > GameLayer[1].y) { f = GameLayer[0]; a = GameLayer[1]; }
        else { f = GameLayer[1]; a = GameLayer[0]; }
        let y = ((_gameBBListIndex) % 10) * blockSize;
        f.y = y; f.style[transform] = 'translate3D(0,' + f.y + 'px,0)';
        a.y = -blockSize * Math.floor(f.children.length / 4) + y; // オリジナルに合わせた計算式
        a.style[transform] = 'translate3D(0,' + a.y + 'px,0)';
    }

    function countBlockSize() { // Original logic, with checks
        if (!body) body = document.getElementById('gameBody') || document.body;
        if (!body || body.offsetWidth === 0) return;
        blockSize = body.offsetWidth / 4;
        body.style.height = window.innerHeight + 'px';
        if (GameLayerBG) GameLayerBG.style.height = window.innerHeight + 'px';
        touchArea[0] = window.innerHeight;
        touchArea[1] = window.innerHeight - blockSize * 3;
    }

    let _gameBBList = [], _gameBBListIndex = 0, _gameOver = false, _gameStart = false,
        _gameSettingNum=20, _gameTime, _gameTimeNum, _gameScore, _date1, deviationTime;
    let _gameStartTime, _gameStartDatetime;

    function gameInit() { // Original
        if (typeof createjs !== 'undefined' && createjs.Sound) {
            createjs.Sound.registerSound({ src: "./static/music/err.mp3", id: "err" });
            createjs.Sound.registerSound({ src: "./static/music/end.mp3", id: "end" });
            createjs.Sound.registerSound({ src: "./static/music/tap.mp3", id: "tap" });
        }
        gameRestart();
    }

    function gameRestart() { // Original, with checks
        _gameBBList = []; _gameBBListIndex = 0; _gameScore = 0; _gameOver = false; _gameStart = false;
        _gameSettingNum = parseInt(cookie('gameTime')) || 20;
        _gameTimeNum = _gameSettingNum; _gameStartTime = 0; _date1 = null; deviationTime = 0;
        if (GameLayer.length < 2 || !GameLayer[0]?.children || !GameLayer[1]?.children) { return; }
        countBlockSize();
        if (blockSize > 0) {
            refreshGameLayer(GameLayer[0]); refreshGameLayer(GameLayer[1], 1);
        }
        updatePanel();
    }

    function gameStart() { // Original
        _date1 = new Date(); _gameStartDatetime = _date1.getTime(); _gameStart = true; _gameStartTime = 0;
        if(_gameTime) clearInterval(_gameTime);
        _gameTime = setInterval(timer, 1000);
    }

    function getCPS() { // Original
        const elapsedTime = (new Date().getTime() - _gameStartDatetime) / 1000;
        if (elapsedTime <= 0 || _gameScore === 0) return 0;
        let cps = _gameScore / elapsedTime;
        return isNaN(cps) || !isFinite(cps) || _gameStartTime < 2 ? 0 : cps;
    }

    function timer() { // Original, with checks
        _gameTimeNum--; _gameStartTime++;
        if (mode === MODE_NORMAL && _gameTimeNum <= 0) {
            if (GameTimeLayer && I18N) GameTimeLayer.innerHTML = (I18N['time-up'] || 'Time Up') + '!';
            gameOver();
            if (GameLayerBG) GameLayerBG.classList.add('flash');
            if (soundMode === 'on' && createjs?.Sound) createjs.Sound.play("end");
        }
        updatePanel();
    }

    function updatePanel() { // Original, with checks
        if (!GameTimeLayer) GameTimeLayer = document.getElementById('GameTimeLayer');
        if (!GameTimeLayer || !I18N) return;
        if (mode === MODE_NORMAL) {
            if (!_gameOver) GameTimeLayer.innerHTML = createTimeText(_gameTimeNum);
        } else if (mode === MODE_ENDLESS) {
            let cps = getCPS();
            let text = (cps === 0 && _gameScore === 0 ? (I18N['calculating'] || 'Calculating...') : cps.toFixed(2));
            GameTimeLayer.innerHTML = `CPS:${text}`;
        } else { GameTimeLayer.innerHTML = `SCORE:${_gameScore}`; }
    }

    function focusOnReplay(){ // Corrected typo
        const replayBtnEl = document.getElementById('replay');
        if (replayBtnEl) replayBtnEl.focus();
    }

    function gameOver() { // Original, with className fix
        _gameOver = true; if(_gameTime) clearInterval(_gameTime);
        let cps = getCPS(); updatePanel();
        setTimeout(function () {
            if (GameLayerBG) GameLayerBG.classList.remove('flash'); // Use classList
            showGameScoreLayer(cps);
            focusOnReplay();
        }, 1500);
    }

    function createTimeText(n) { return 'TIME:' + Math.max(0, Math.ceil(n)); } // Original

    let _ttreg = / t{1,2}(\d+)/, _clearttClsReg = / t{1,2}\d+| bad/; // Original

    function refreshGameLayer(box, loop, offset) { // Original logic
        if (!box?.children || blockSize <= 0) return;
        let i = Math.floor(Math.random() * 1000) % 4 + (loop ? 0 : 4);
        for (let j = 0; j < box.children.length; j++) {
            let r = box.children[j], rstyle = r.style;
            rstyle.left = (j % 4) * blockSize + 'px'; rstyle.bottom = Math.floor(j / 4) * blockSize + 'px';
            rstyle.width = blockSize + 'px'; rstyle.height = blockSize + 'px';
            r.className = r.className.replace(_clearttClsReg, ''); r.notEmpty = false;
            if (i === j) {
                _gameBBList.push({ cell: i % 4, id: r.id });
                r.className += ' t' + (Math.floor(Math.random() * 5) + 1); r.notEmpty = true;
                i = (Math.floor(j / 4) + 1) * 4 + Math.floor(Math.random() * 4);
            }
        }
        if (loop) {
            box.style[transitionDuration] = '0ms'; box.style.display = 'none';
            box.y = -blockSize * (Math.floor(box.children.length / 4) + (offset || 0)); // `* loop` was likely redundant
            box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
            setTimeout(function () { box.style.display = 'block'; }, 50); // Simplified from nested setTimeout
        } else {
            box.y = 0; box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
        }
        box.style[transitionDuration] = '150ms';
    }

    function gameLayerMoveNextRow() { // Original logic
        for (let i = 0; i < GameLayer.length; i++) {
            let g = GameLayer[i]; if (!g?.children) continue;
            g.y += blockSize;
            if (g.y > blockSize * (Math.floor(g.children.length / 4))) {
                refreshGameLayer(g, 1, -1);
            } else { g.style[transform] = 'translate3D(0,' + g.y + 'px,0)'; }
        }
    }

    function gameTapEvent(e) { // Original logic (当たり判定) with modification for bad tile animation
        if (_gameOver) return false;
        let tar = e.target;
        let eventY = e.clientY || (e.targetTouches && e.targetTouches[0] ? e.targetTouches[0].clientY : 0);
        let eventX = (e.clientX || (e.targetTouches && e.targetTouches[0] ? e.targetTouches[0].clientX : 0)) - (body ? body.offsetLeft : 0);
        if (_gameBBList.length === 0 || _gameBBListIndex >= _gameBBList.length) return false;
        let p = _gameBBList[_gameBBListIndex];
        if ((touchArea[1] === undefined || blockSize <= 0) && body && body.offsetWidth > 0) countBlockSize();
        if (touchArea[1] !== undefined && (eventY > touchArea[0] || eventY < touchArea[1])) return false;

        // 元の判定ロジックを忠実に再現
        const correctBlackTileElement = document.getElementById(p.id); // 常に正しい黒タイルを参照
        if ((p.id === tar.id && tar.notEmpty) || // 黒タイル直接タップ
            (p.cell === 0 && eventX < blockSize && correctBlackTileElement && correctBlackTileElement.notEmpty) ||
            (p.cell === 1 && eventX > blockSize && eventX < 2 * blockSize && correctBlackTileElement && correctBlackTileElement.notEmpty) ||
            (p.cell === 2 && eventX > 2 * blockSize && eventX < 3 * blockSize && correctBlackTileElement && correctBlackTileElement.notEmpty) ||
            (p.cell === 3 && eventX > 3 * blockSize && correctBlackTileElement && correctBlackTileElement.notEmpty)
        ) {
            if (!_gameStart) gameStart();
            if (soundMode === 'on' && createjs?.Sound) createjs.Sound.play("tap");
            
            // target は p.id の要素に強制 (列タップの場合も正しいタイルに作用させるため)
            const actualTarget = document.getElementById(p.id);
            if (actualTarget) { // 要素が存在することを確認
                actualTarget.className = actualTarget.className.replace(_ttreg, ' tt$1');
                actualTarget.notEmpty = false;
            }

            _gameBBListIndex++;
            _gameScore++;
            updatePanel();
            gameLayerMoveNextRow();
        } else if (_gameStart && tar && tar.classList && tar.classList.contains('block') && !tar.notEmpty) { // 白いタイルをタップ
            if (soundMode === 'on' && createjs?.Sound) createjs.Sound.play("err");
            tar.classList.add('bad');
            if (mode === MODE_PRACTICE) {
                setTimeout(() => { tar.classList.remove('bad'); }, 500);
            } else {
                // アニメーションが完了するのを待ってからゲームオーバー
                setTimeout(() => { gameOver(); }, 800); // 0.8秒後にゲームオーバー処理を実行
            }
        }
        return false;
    }

    function createGameLayer() { // Original
        let html = '<div id="GameLayerBG">';
        for (let i = 1; i <= 2; i++) {
            let id = 'GameLayer' + i;
            html += `<div id="${id}" class="GameLayer">`;
            for (let j = 0; j < 10; j++) {
                for (let k = 0; k < 4; k++) {
                    html += `<div id="${id}-${k + j * 4}" num="${k + j * 4}" class="block${k ? ' bl' : ''}"></div>`;
                }
            }
            html += '</div>';
        }
        html += '</div><div id="GameTimeLayer" class="text-center"></div>';
        return html;
    }

    function closeWelcomeLayer() { /* Original */ welcomeLayerClosed = true; $('#welcome').css('display', 'none'); updatePanel(); }
    function showWelcomeLayer() { /* Original */ welcomeLayerClosed = false; $('#mode').text(modeToString(mode)); $('#welcome').css('display', 'block'); }
    function getBestScore(currentScore) { /* Original (bast->best fix) */
        let cookieName = (mode === MODE_NORMAL ? 'best-score' : 'endless-best-score');
        let best = parseFloat(cookie(cookieName)) || 0;
        if (currentScore > best) { best = currentScore; cookie(cookieName, best.toFixed(mode === MODE_ENDLESS ? 2 : 0), 100); }
        return best;
    }
    function scoreToString(s) { /* Original */ return mode === MODE_ENDLESS ? parseFloat(s).toFixed(2) : String(Math.floor(s)); }
    function legalDeviationTime() { /* Original */ return _date1 ? deviationTime < (_gameSettingNum + 3) * 1000 : true; }

    function showGameScoreLayer(cps) { // Original, with minor jQuery safety
        const gameScoreLayer = $('#GameScoreLayer');
        if (_gameBBList.length > 0 && _gameBBListIndex > 0 && _gameBBList[_gameBBListIndex - 1]) {
            const lastBlock = $(`#${_gameBBList[_gameBBListIndex - 1].id}`);
            if (lastBlock.length) {
                const classAttr = lastBlock.attr('class');
                if (classAttr) {
                    const cMatch = classAttr.match(_ttreg);
                    if (cMatch && cMatch[1]) gameScoreLayer.attr('class', 'BBOX SHADE bgc' + cMatch[1]);
                    else gameScoreLayer.attr('class', 'BBOX SHADE bgc1');
                } else gameScoreLayer.attr('class', 'BBOX SHADE bgc1');
            } else gameScoreLayer.attr('class', 'BBOX SHADE bgc1');
        } else gameScoreLayer.attr('class', 'BBOX SHADE bgc1');
        
        $('#GameScoreLayer-text').html(shareText(cps)); // Calls Supabase submission
        let scoreVal = (mode === MODE_ENDLESS ? cps : _gameScore);
        let best = getBestScore(scoreVal);
        gameScoreLayer.css('color', (mode !== MODE_NORMAL || legalDeviationTime()) ? '' : 'red');
        $('#cps').text(cps.toFixed(2));
        $('#score').text(scoreToString(_gameScore));
        $('#GameScoreLayer-score').css('display', mode === MODE_ENDLESS ? 'none' : 'flex');
        $('#best').text(scoreToString(best));
        gameScoreLayer.css('display', 'block');
    }

    function hideGameScoreLayer() { /* Original */ $('#GameScoreLayer').css('display', 'none'); }
    w.replayBtn = function() { /* Original */ gameRestart(); hideGameScoreLayer(); }
    w.backBtn = function() { /* Original */ gameRestart(); hideGameScoreLayer(); showWelcomeLayer(); }

    function shareText(cps) { // Modified for Supabase
        if (mode === MODE_NORMAL) {
            let date2 = new Date(); if (!_date1) _date1 = date2;
            deviationTime = (date2.getTime() - _date1.getTime());
            if (!legalDeviationTime()) {
                return (I18N ? I18N['time-over'] : 'Time over by: ') + ((deviationTime / 1000) - _gameSettingNum).toFixed(2) + 's';
            }
            SubmitResultsToSupabase(); // ★★★ Supabase送信 ★★★
        }
        if (!I18N) return "Score: " + cps.toFixed(2);
        if (cps <= 5) return I18N['text-level-1'] || 'Lvl 1'; if (cps <= 8) return I18N['text-level-2'] || 'Lvl 2';
        if (cps <= 10) return I18N['text-level-3'] || 'Lvl 3'; if (cps <= 15) return I18N['text-level-4'] || 'Lvl 4';
        return I18N['text-level-5'] || 'Lvl 5';
    }

    function toStr(obj) { /* Original */ if (typeof obj === 'object') { try {return JSON.stringify(obj);} catch(e){return String(obj);}} else { return String(obj); } }
    function cookie(name, value, timeInDays) { /* Modified (no eval) */
        if (name) {
            if (value !== undefined) {
                let expires = ""; if (timeInDays) { let date = new Date(); date.setTime(date.getTime() + (timeInDays * 24 * 60 * 60 * 1000)); expires = "; expires=" + date.toUTCString(); }
                document.cookie = name + "=" + (escape(toStr(value)) || "") + expires + "; path=/"; return true;
            } else {
                let nameEQ = name + "="; let ca = document.cookie.split(';');
                for (let i = 0; i < ca.length; i++) {
                    let c = ca[i]; while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                    if (c.indexOf(nameEQ) === 0) {
                        let valStr = unescape(c.substring(nameEQ.length, c.length));
                        try { if ((valStr.startsWith('{') && valStr.endsWith('}')) || (valStr.startsWith('[') && valStr.endsWith(']'))) return JSON.parse(valStr); if (!isNaN(parseFloat(valStr)) && isFinite(valStr)) return parseFloat(valStr); } catch (e) {}
                        return valStr;
                    }
                } return null;
            }
        }
        let data = {}; let ca = document.cookie.split(';'); for (let i = 0; i < ca.length; i++) { let pair = ca[i].split('='); if(pair.length === 2) data[pair[0].trim()] = unescape(pair[1]); } return data;
    }

    document.write(createGameLayer()); // オリジナルに合わせて直接書き込み

    function initSetting() { /* Original */
        $("#username").val(cookie("username") || ""); $("#message").val(cookie("message") || "");
        const titleVal = cookie("title"); if (titleVal) { $('title').text(titleVal); $('#title').val(titleVal); }
        const keyboardVal = cookie("keyboard");
        if (keyboardVal) {
            const kbStr = String(keyboardVal).toLowerCase(); $("#keyboard").val(kbStr);
            if(kbStr.length === 4) { map = {}; map[kbStr.charAt(0)] = 1; map[kbStr.charAt(1)] = 2; map[kbStr.charAt(2)] = 3; map[kbStr.charAt(3)] = 4; }
        }
        const gameTimeVal = cookie('gameTime');
        if (gameTimeVal) { const gt = parseInt(gameTimeVal); if (!isNaN(gt) && gt > 0) { $('#gameTime').val(gt); _gameSettingNum = gt; } }
    }

    w.show_btn = function() { /* Original */ $('#btn_group').css('display', 'flex'); $('#desc').css('display', 'block'); $('#setting').css('display', 'none'); }
    w.show_setting = function() { /* Original */
        $('#btn_group').css('display', 'none'); $('#desc').css('display', 'none'); $('#setting').css('display', 'block');
        if (I18N) $('#sound').text(soundMode === 'on' ? (I18N['sound-on'] || 'Sound: ON') : (I18N['sound-off'] || 'Sound: OFF'));
    }
    w.save_cookie = function() { /* Original */
        const s = ['username', 'message', 'keyboard', 'title', 'gameTime'];
        for (let k of s) { let v = $(`#${k}`).val(); if (v !== null && v !== undefined) cookie(k, String(v).trim(), 100); }
        const gtVal = $('#gameTime').val(); if(gtVal){ const ngt = parseInt(gtVal); if(!isNaN(ngt) && ngt > 0) _gameSettingNum = ngt; }
        initSetting();
    }
    function isnull(val) { /* Original */ if (val === null || val === undefined) return true; return String(val).replace(/(^\s*)|(\s*$)/g, '') === ''; }

    function click(index) { /* Original logic (with target block finding adjusted) */
        if (!welcomeLayerClosed || _gameOver || _gameBBList.length === 0 || _gameBBListIndex >= _gameBBList.length) return;
        let p = _gameBBList[_gameBBListIndex];
        const currentBlockEl = document.getElementById(p.id); if (!currentBlockEl) return;
        const parentEl = currentBlockEl.parentElement; if (!parentEl) return;
        const currentBlockNumAttr = currentBlockEl.getAttribute("num"); if(currentBlockNumAttr === null) return;
        const currentBlockNum = parseInt(currentBlockNumAttr);
        const rowStartNum = currentBlockNum - p.cell;
        const targetCol = index - 1;
        const targetGlobalNum = rowStartNum + targetCol;
        let targetEl = null;
        for (let i = 0; i < parentEl.children.length; i++) {
            if (parentEl.children[i].getAttribute("num") === String(targetGlobalNum)) {
                targetEl = parentEl.children[i]; break;
            }
        }
        if (!targetEl) return;
        let fakeEvent = { target: targetEl, clientX: (targetCol + 0.5) * blockSize + (body ? body.offsetLeft : 0), clientY: (touchArea[1] !== undefined ? (touchArea[0] + touchArea[1]) / 2 : window.innerHeight / 2) };
        gameTapEvent(fakeEvent);
    }

    const clickBeforeStyle = $('<style id="clickBeforeStyleInjectedByJS"></style>').appendTo('head'); // Original
    const clickAfterStyle = $('<style id="clickAfterStyleInjectedByJS"></style>').appendTo('head');  // Original
    function saveImage(dom, callback) { /* Original */ if (dom.files && dom.files[0]) { let r = new FileReader(); r.onload = function() { callback(this.result); }; r.readAsDataURL(dom.files[0]); } }
    w.getClickBeforeImage = function() { /* Original */ $('#click-before-image').trigger('click'); }
    w.saveClickBeforeImage = function() { /* Original (with !important styles) */ const i = document.getElementById('click-before-image'); saveImage(i, r => { clickBeforeStyle.html(`.t1,.t2,.t3,.t4,.t5{background-size:contain!important;background-image:url(${r})!important;background-repeat:no-repeat!important;background-position:center!important;}`); }); }
    w.getClickAfterImage = function() { /* Original */ $('#click-after-image').trigger('click'); }
    w.saveClickAfterImage = function() { /* Original (with !important styles) */ const i = document.getElementById('click-after-image'); saveImage(i, r => { clickAfterStyle.html(`.tt1,.tt2,.tt3,.tt4,.tt5{background-size:contain!important;background-image:url(${r})!important;background-repeat:no-repeat!important;background-position:center!important;}`); }); }

})(window);
