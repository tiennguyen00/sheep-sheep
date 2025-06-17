import { _decorator, Component, Node } from "cc";
import { Block } from "./Block";
import { LevelType } from "./type";
import { GAME_STATUS_ENUM } from "./Enum";
const { ccclass, property } = _decorator;

@ccclass("DataManager")
export class DataManager extends Component {
  private static _instance: DataManager = null;
  static getInstance(): DataManager {
    if (!DataManager._instance) {
      DataManager._instance = new DataManager();
    }
    return DataManager._instance;
  }

  static get instance() {
    return DataManager.getInstance();
  }

  private _level: number = 0;
  blocks: Block[] = [];
  records: Block[] = [];
  currentLevel: LevelType = null;
  gameStatus: GAME_STATUS_ENUM = GAME_STATUS_ENUM.INIT;
  clickable: boolean = false;

  public get level() {
    return this._level;
  }

  public set level(value: number) {
    this._level = value;
    this.save();
  }

  reset() {
    this._level = 0;
    this.blocks = [];
    this.records = [];
    this.currentLevel = null;
    this.gameStatus = GAME_STATUS_ENUM.INIT;
    this.clickable = false;
  }

  save() {}

  restore() {}
}
