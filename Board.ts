import Chip from "./Chip.js";

export default class Board {
    public name: string = "";
    public chips: Chip[] = [];
    constructor(name: string) {
        this.name = null;
        if (name) this.name = name.toUpperCase();
    }
}