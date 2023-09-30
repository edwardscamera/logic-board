import ChipInfo from "./ChipInfo.js";
import ChipInput from "./ChipInput.js";
import Vector2 from "./Vector2.js";

export default class Chip {
    public static Chips: Record<string, ChipInfo> = {
        "NOT": {
            inputs: 1,
            evaluate: (inputs) => {
                return !inputs[0];
            },
        },
        "AND": {
            inputs: 2,
            evaluate: (inputs) => {
                return !inputs.includes(false)
            },
        },
        "OR": {
            inputs: 2,
            evaluate: (inputs) => {
                return inputs.includes(true);
            },
        },
        "XOR": {
            inputs: 2,
            evaluate: (inputs) => {
                return inputs.includes(true) && inputs.includes(false);
            },
        },
        "NODE": {
            inputs: 1,
            evaluate: (inputs) => {
                return inputs[0];
            },
        },
        "SWITCH": {
            inputs: 0,
        }
    }
    public static outletSize = 0.25;

    position: Vector2 = {
        x: 0,
        y: 0,
    };
    color: string = "#aaa";
    
    inputs: boolean[];
    private inputChips: Chip[];
    output: boolean = false;
    public outputChips: ChipInput[] = [];

    type: string = null;

    constructor(position: Vector2, type: string) {
        this.position = position;
        this.type = type.toUpperCase();

        const chipProperties: ChipInfo = Chip.Chips[this.type];
        this.inputs = new Array(chipProperties.inputs).fill(false);
        this.inputChips = new Array(chipProperties.inputs).fill(null);
    }
    public update() {
        // Evaluate inputs
        const chipProperties: ChipInfo = Chip.Chips[this.type];
        if (this.inputs.length > 0) this.output = chipProperties.evaluate(this.inputs);

        // Update outputs
        this.outputChips.forEach(outputChip => {
            outputChip.Chip.inputs[outputChip.InputID] = this.output;
            if (outputChip.Chip === this) outputChip.Chip.inputs[outputChip.InputID] = false;

            outputChip.Chip.update();
        });
    }
    public setOutput(chipInput: ChipInput) {
        const existingOutput = chipInput.Chip.inputChips[chipInput.InputID] !== null;
        if (existingOutput) {
            const existingChipConnection = chipInput.Chip.inputChips[chipInput.InputID];
            existingChipConnection.outputChips.splice(existingChipConnection.outputChips.indexOf(chipInput), 1);
            chipInput.Chip.inputChips[chipInput.InputID] = null;
            chipInput.Chip.inputs[chipInput.InputID] = false;
        }
        this.outputChips.push({
            Chip: chipInput.Chip,
            InputID: chipInput.InputID,
        });
        chipInput.Chip.inputChips[chipInput.InputID] = this;
        this.update();
    }
    public clean() {
        this.outputChips.forEach((outputChip, i) => {
            outputChip.Chip.inputChips[outputChip.InputID] = null;
            outputChip.Chip.inputs[outputChip.InputID] = false;
            outputChip.Chip.update();
            this.outputChips.splice(i, 1);
        });
        this.inputChips.forEach(chip => {
            if (chip) {
                const c = chip.outputChips.find(x => x.Chip === this);
                if (c) chip.outputChips.splice(chip.outputChips.indexOf(c), 1);
            }
        });
    }
    public getInputPosition(InputID: number, centered?: boolean): Vector2 {
        const widthOfSection = 1 / this.inputs.length;
        return {
            x: this.position.x + (InputID * widthOfSection) + (widthOfSection / 2) - (Chip.outletSize / 2) + (centered ? Chip.outletSize / 2 : 0),
            y: this.position.y - Chip.outletSize + (centered ? Chip.outletSize / 2 : 0),
        };
    }
    public getOutputPosition(centered?: boolean): Vector2 {
        return {
            x: this.position.x + .5 - Chip.outletSize / 2 + (centered ? Chip.outletSize / 2 : 0),
            y: this.position.y + 1 + (centered ? Chip.outletSize / 2 : 0),
        };
    }
}