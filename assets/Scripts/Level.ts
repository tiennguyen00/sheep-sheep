import { LevelType } from "./type";

const cards = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
export const levels: LevelType[] = [
  /*
    chessWidthNum is used to define the number of columns in the chessboard.
    chessItemWidth is used to determine the actual pixel width of each grid cell, affecting visual size.
  */
  {
    // Set grid (each Block occupies one grid cell) — logical dimensions
    chessWidthNum: 20,
    chessHeightNum: 20,
    // Single item (visual size) — actual pixel size
    chessItemWidth: 22,
    chessItemHeight: 22,
    // Number of slots in the slot bar
    slotNum: 7,
    // Number of blocks required to match/clear
    clearableNum: 3,
    // Number of random blocks placed before the main levels
    leftRandomBlocks: 0,
    // Number of random blocks placed after the main levels
    rightRandomBlocks: 0,
    // How many layers (or "floors") of blocks the level has.
    levelNum: 2,
    // How many blocks are in each layer.
    levelBlockNum: 9,
    // Number of different block types
    blockTypeNum: 3,
    // Increment step for the border between layers
    blockBorderStep: 1,
    // List of block types used in this level
    blockTypeArr: cards,
  },
];
