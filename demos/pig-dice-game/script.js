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

function render() {
    const { players, currentPlayerIndex, diceValue } = game.gameState;
    const activePlayer = players[currentPlayerIndex];

    nameEl.textContent = activePlayer.name;
    scoreEl.textContent = activePlayer.score;
    currentEl.textContent = activePlayer.currentScore;

    otherPlayersEl.innerHTML = '';
    players.forEach((p, i) => {
        if (i === currentPlayerIndex) return;
        const row = document.createElement('div');
        row.className = 'player-summary';
        row.innerHTML = `<strong>${p.name}</strong><span class="dots"></span>${p.score}`;
        otherPlayersEl.appendChild(row);
    });

    if (diceValue) {
        diceEl.src = `dice-${diceValue}.png?${Date.now()}`;
        diceEl.classList.remove('hidden');
    } else {
        diceEl.classList.add('hidden');
    }
}

btnRoll.addEventListener('click', () => {
    if (!playing) return;
    game.rollDice();
    render();
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

btnInstructions.addEventListener('click', () => {
    instructions.classList.toggle('hidden');
});

render();
