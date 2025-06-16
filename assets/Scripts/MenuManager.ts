import { _decorator, Component, director, Node } from "cc";
import { AUDIO_EFFECT_ENUM, GAME_EVENT_ENUM, GAME_SCENE_ENUM } from "./Enum";
import { PLAY_AUDIO } from "./Event";
const { ccclass, property } = _decorator;

@ccclass("MenuManager")
export class MenuManager extends Component {
  protected onLoad(): void {
    director.preloadScene(GAME_SCENE_ENUM.GAME);
  }

  onGameStart() {
    PLAY_AUDIO.emit(GAME_EVENT_ENUM.PLAY_AUDIO, AUDIO_EFFECT_ENUM.CLICKBUTTON);
    director.loadScene(GAME_SCENE_ENUM.GAME);
  }

  start() {}

  update(deltaTime: number) {}
}
