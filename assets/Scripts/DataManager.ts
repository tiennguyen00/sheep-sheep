import { _decorator, Component, Node } from "cc";
import { Block } from "./Block";
import { LevelType } from "./type";
import { GAME_STATUS_ENUM } from "./Enum";
const { ccclass, property } = _decorator;

@ccclass("DataManager")
export class DataManager extends Component {
  private static _instance: DataManager = null;
  static getInstance<T>(): T {
    if (this._instance === null) {
      this._instance = new this();
    }
    return this._instance as any;
  }

  static get instance() {
    return this.getInstance<DataManager>();
  }

  private _level: number = 1;
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
    this.blocks = [];
    this.records = [];
    this.currentLevel = null;
    this.gameStatus = GAME_STATUS_ENUM.INIT;
    this.clickable = false;
  }

  save() {}

  restore() {}
}
