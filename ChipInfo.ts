export default interface ChipInfo {
    minInputs: number;
    maxInputs: number;
    evaluate?(inputs: boolean[]): boolean;
    color?: string;
}