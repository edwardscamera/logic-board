import Camera from "./Camera.js";
import ChipInfo from "./ChipInfo.js";
import ChipInput from "./ChipInput.js";
import Vector2 from "./Vector2.js";

export default class Chip {
    public static Chips: Record<string, ChipInfo> = {
        "NOT": {
            minInputs: 1,
            maxInputs: 1,
            evaluate: (inputs) => {
                return !inputs[0];
            },
        },
        "AND": {
            minInputs: 2,
            maxInputs: null,
            evaluate: (inputs) => {
                return !inputs.includes(false)
            },
        },
        "OR": {
            minInputs: 2,
            maxInputs: null,
            evaluate: (inputs) => {
                return inputs.includes(true);
            },
        },
        "XOR": {
            minInputs: 2,
            maxInputs: null,
            evaluate: (inputs) => {
                return inputs.includes(true) && inputs.includes(false);
            },
        },
        "NODE": {
            minInputs: 1,
            maxInputs: 1,
            evaluate: (inputs) => {
                return inputs[0];
            },
        },
        "SWITCH": {
            minInputs: 0,
            maxInputs: 0,
        }
    }
    public outletSize = 0.25;

    position: Vector2 = {
        x: 0,
        y: 0,
    };
    color: string = "#aaa";
    
    inputs: boolean[];
    private inputChips: Chip[];
    output: boolean = false;
    public outputChips: ChipInput[] = [];
    public rotation: number;

    type: string = null;

    constructor(position: Vector2, type: string, inputs: number, rotation: number) {
        this.position = position;
        this.type = type.toUpperCase();

        const chipProperties: ChipInfo = Chip.Chips[this.type];

        if (chipProperties.minInputs !== null) inputs = Math.max(inputs, chipProperties.minInputs);
        if (chipProperties.maxInputs !== null) inputs = Math.min(inputs, chipProperties.maxInputs);
        this.inputs = new Array(inputs).fill(false);
        this.inputChips = new Array(inputs).fill(null);

        this.outletSize = Math.min(0.25, 1 / (inputs + 1));

        this.rotation = rotation;
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
    public getInputPosition(InputID: number, xOffset?: number, yOffset?: number): Vector2 {
        xOffset = xOffset ?? 0;
        yOffset = yOffset ?? 0;
        const preRotation: Vector2 = {
            x: 0 + (xOffset / 2) * this.outletSize + (InputID - this.inputs.length / 2 + .5) / this.inputs.length,
            y: -.5 + (yOffset / 2) * this.outletSize,
        };
        const rotatedPoint = Camera.rotatePoint(preRotation, this.rotation);
        return {
            x: (this.position.x + .5) + rotatedPoint.x,
            y: (this.position.y + .5) + rotatedPoint.y,
        };
    }
    public getOutputPosition(xOffset?: number, yOffset?: number): Vector2 {
        xOffset = xOffset ?? 0;
        yOffset = yOffset ?? 0;
        const preRotation: Vector2 = {
            x: 0 + (xOffset / 2) * this.outletSize,
            y: .5 + (yOffset / 2) * this.outletSize,
        };
        const rotatedPoint = Camera.rotatePoint(preRotation, this.rotation);
        return {
            x: (this.position.x + .5) + rotatedPoint.x,
            y: (this.position.y + .5) + rotatedPoint.y,
        };
    }
}