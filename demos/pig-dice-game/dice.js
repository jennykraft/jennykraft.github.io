export class Dice {
    #currentValue;

    constructor() { }

    roll() {
        this.#currentValue = Math.floor(Math.random() * 6) + 1;
        return this.#currentValue;
    }

    get currentValue() {
        return this.#currentValue;
    }
}