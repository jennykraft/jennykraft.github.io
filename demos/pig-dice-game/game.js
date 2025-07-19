import { Player } from './player.js';
import { Dice } from './dice.js';


export class Game {
    #players = [];
    #dice;
    #maxPlayers = 10;
    #currentPlayerIndex;
    #scoreToWin = 100;

    constructor(numberOfPlayers) {
        if (numberOfPlayers > 1 && numberOfPlayers <= this.#maxPlayers) {
            for (let i = 1; i <= numberOfPlayers; i++) {
                this.#players.push(new Player(`Player-${i}`));
            }
        } else {
            console.error(`Invalid number of players. (Min 2 and max ${this.#maxPlayers}`);
            return;
        }

        this.#currentPlayerIndex = 0;
        this.#dice = new Dice();
    }

    switchPlayer() {
        if (this.#currentPlayerIndex == this.#players.length - 1) {
            this.#currentPlayerIndex = 0;
        } else {
            this.#currentPlayerIndex += 1;
        }

        return this.#currentPlayerIndex;
    }

    get currentPlayerIndex() {
        return this.#currentPlayerIndex;
    }

    get gameState() {
        return {
            players: this.#players.map(player => ({
                name: player.name,
                score: player.score,
                currentScore: player.currentScore
            })),
            diceValue: this.#dice.currentValue,
            currentPlayerIndex: this.#currentPlayerIndex
        }
    }

    resetGame() {
        this.#players.forEach(player => player.resetScores());
        this.#currentPlayerIndex = 0;
    }

    rollDice() {
        const value = this.#dice.roll();
        let player = this.#players[this.#currentPlayerIndex]
        if (value == 1) {
            player.resetCurrentScore();
            this.switchPlayer();
        } else {
            player.addDiceValueToCurrent(value);
        }
        return value;
    }

    hold() {
        let player = this.#players[this.#currentPlayerIndex]
        player.hold();
        if (player.score >= this.#scoreToWin) {
            console.log(`${player.name} won the game with a Score of ${player.score}`);
            return true;
        }
        this.switchPlayer();
        return false;
    }
}