export class Player {

    #score = 0;
    #currentScore = 0;
    #name;

    constructor(name) {
        this.#name = name;
    }

    get score() {
        return this.#score;
    }

    get currentScore() {
        return this.#currentScore;
    }

    get name() {
        return this.#name;
    }

    hold() {
        this.#score += this.#currentScore;
        this.#currentScore = 0;
    }

    addDiceValueToCurrent(diceValue) {
        this.#currentScore += diceValue;
    }

    resetScores() {
        this.#score = 0;
        this.#currentScore = 0;
    }

    resetCurrentScore() {
        this.#currentScore = 0;
    }

}