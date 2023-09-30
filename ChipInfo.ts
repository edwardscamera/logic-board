export default interface ChipInfo {
    inputs: number;
    evaluate?(inputs: boolean[]): boolean;
    color?: string;
}