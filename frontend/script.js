const txtbet = document.querySelector('#bet');
const elwin = document.querySelector('#el-win');
const txtwin = document.querySelector('#win');
const elmoney = document.querySelector('#el-money');
const txtmoney = document.querySelector('#money');
const elgame = document.querySelector('#game-area');
const btnbet = document.querySelector('#btn-bet');
const btnspin = document.querySelector('#btn-spin');
const btnputmn = document.querySelector('#btn-putmoney');
const notification = document.querySelector('#notification');
const notificationMessage = document.querySelector('#notification-message');

let money = 0;
let bet = 1;
let betstep = 0;
const betarr = [1,5,10,50,100,200,500,1000];

function showNotification(message) {
    notificationMessage.textContent = message;
    notification.style.display = 'block';
}

function hideNotification() {
    notification.style.display = 'none';
}

notification.addEventListener('click', hideNotification);

const cols = document.querySelectorAll('.column');
const col1 = cols[0];
const col2 = cols[1];
const col3 = cols[2];
const col4 = cols[3];
const col5 = cols[4];

btnputmn.addEventListener('click',()=> {
    if(money === 0){
        money = 1000;
        elmoney.classList.remove('col-red');
        startGame();
    }
}, false);

function startGame(){
    function showMoney() {
        elwin.style.display = 'none';
        elmoney.style.display = '';
        txtmoney.innerHTML = money;
    }
    showMoney();

    if (money === 0) {
        showNotification("You have no money! Click 'Put Money' to add funds.");
    }

    function showWin(w) {
        elmoney.style.display = 'none';
        elwin.style.display = '';
        txtwin.innerHTML = w;
        setTimeout(() => {
            showMoney();
            enableBtns();
        }, 2000);
    }

    var audioCash = new Audio('media/cash.mp3');
    var audioClick = new Audio('media/click.mp3');
    var audioSpin = new Audio('media/spin.mp3');
    var audioWin = new Audio('media/win.mp3');
    var audioOver = new Audio('media/over.mp3');
    audioCash.play();

    function setBet() {
        audioClick.play();
        betstep++;
        if (betstep < betarr.length) {
            bet = betarr[betstep];
        } else {
            betstep = 0;
            bet = betarr[betstep];
        }
        txtbet.innerHTML = bet;
        elmoney.classList.remove('col-red');
    }
    btnbet.addEventListener('click', setBet, false);

    function addItems(el, symbols) {
        symbols.forEach(symbol => {
            const div = document.createElement('div');
            div.innerHTML = `<i>${symbol}</i>`;
            el.prepend(div);
        });
    }

    function getStartItems() {
        for (const c of cols) {
            addItems(c, ['🍒', '🍉', '🍇'].slice(0, 3));
        }
    }
    getStartItems();

    function checkMoney() {
        if (money > 0 && money >= bet) {
            return true;
        } else if (money > 0 && money < bet) {
            elmoney.classList.add('col-red');
            audioOver.play();
            showNotification("Not enough money for this bet!");
            return false;
        } else {
            elmoney.classList.add('col-red');
            audioOver.play();
            showNotification("You have no money! Click 'Put Money' to add funds.");
            return false;
        }
    }

    function disableBtns() {
        btnbet.setAttribute('disabled', '1');
        btnspin.setAttribute('disabled', '1');
    }

    function enableBtns() {
        btnbet.removeAttribute('disabled');
        btnspin.removeAttribute('disabled');
    }

    function Spin() {
        if (checkMoney()) {
            audioSpin.play();
            disableBtns();

            cols.forEach(col => {
                const items = col.querySelectorAll('div');
                items.forEach(item => {
                    item.classList.add('spinning');
                });
            });

            fetch('http://127.0.0.1:5000/spin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bet: bet,
                    money: money
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showNotification(data.error);
                    enableBtns();
                    return;
                }

                money = data.newBalance;
                showMoney();

                const allLines = [
                    data.result.line1,
                    data.result.line2,
                    data.result.line3
                ];

                cols.forEach((col, colIndex) => {
                    const colSymbols = allLines.map(line => line[colIndex]);
                    addItems(col, colSymbols);
                });

                var tr = 1;
                for (const c of cols) {
                    c.style.transition = `${tr}s ease-out`;
                    var n = c.querySelectorAll('div').length;
                    var b = (n - 3) * 160;
                    c.style.bottom = `-${b}px`;
                    tr = tr + 0.5;
                }

                col5.ontransitionend = () => {
                    cols.forEach(col => {
                        const items = col.querySelectorAll('div');
                        items.forEach(item => {
                            item.classList.remove('spinning');
                        });
                    });

                    if (data.winAmount > 0) {
                        audioWin.play();
                        showWin(data.winAmount);
                    }

                    for (const c of cols) {
                        var ditm = c.querySelectorAll('div');
                        for (var i = 0; i < ditm.length; i++) {
                            if (i >= 3) {
                                ditm[i].remove();
                            }
                        }
                        c.style.transition = '0s';
                        c.style.bottom = '0px';
                    }

                    if (data.winAmount === 0) {
                        enableBtns();
                    }
                };
            })
            .catch(err => {
                console.error('Error during spin:', err);
                showNotification("Error connecting to the server. Try again later.");
                enableBtns();
            });
        }
    }

    btnspin.addEventListener('click', Spin, false);
}
