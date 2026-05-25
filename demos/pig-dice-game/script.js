'use strict';
import { Game } from './game.js';

const diceEl = document.querySelector('.dice');
const btnNew = document.querySelector('.btn--new');
const btnRoll = document.querySelector('.btn--roll');
const btnHold = document.querySelector('.btn--hold');
const playerSelect = document.getElementById('player-count');
const activePanel = document.getElementById('active-player-panel');
const nameEl = document.getElementById('name--0');
const scoreEl = document.getElementById('score--0');
const currentEl = document.getElementById('current--0');
const otherPlayersEl = document.getElementById('other-players');

let game = new Game(2);
let playing = true;

function renderStandings(players, currentPlayerIndex) {
    otherPlayersEl.innerHTML = '';
    const others = players.filter((_, i) => i !== currentPlayerIndex);

    if (others.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'player-list__empty';
        empty.textContent = 'No other players yet.';
        otherPlayersEl.appendChild(empty);
        return;
    }

    others
        .slice()
        .sort((a, b) => b.score - a.score)
        .forEach((p) => {
            const row = document.createElement('li');
            row.className = 'player-list__row';
            row.innerHTML = `
                <span class="player-list__name">${p.name}</span>
                <span class="player-list__score">${p.score}</span>
            `;
            otherPlayersEl.appendChild(row);
        });
}

function render() {
    const { players, currentPlayerIndex, diceValue } = game.gameState;
    const activePlayer = players[currentPlayerIndex];

    nameEl.textContent = activePlayer.name;
    scoreEl.textContent = activePlayer.score;
    currentEl.textContent = activePlayer.currentScore;

    renderStandings(players, currentPlayerIndex);

    if (diceValue) {
        diceEl.src = `dice-${diceValue}.png?${Date.now()}`;
        diceEl.classList.remove('hidden');
    } else {
        diceEl.classList.add('hidden');
    }
}

function animateDice() {
    diceEl.classList.remove('rolling');
    void diceEl.offsetWidth;
    diceEl.classList.add('rolling');
}

btnRoll.addEventListener('click', () => {
    if (!playing) return;
    game.rollDice();
    render();
    animateDice();
});

btnHold.addEventListener('click', () => {
    if (!playing) return;
    const won = game.hold();
    if (won) {
        playing = false;
        diceEl.classList.add('hidden');
        activePanel.classList.add('player--winner');
    }
    render();
});

btnNew.addEventListener('click', () => {
    const playerCount = parseInt(playerSelect.value, 10) || 2;
    game = new Game(playerCount);
    playing = true;
    activePanel.classList.remove('player--winner');
    render();
});

render();
