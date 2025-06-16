import {
  _decorator,
  AudioClip,
  AudioSource,
  Component,
  Director,
  director,
  Node,
} from "cc";
import { PLAY_AUDIO } from "./Event";
import { AUDIO_EFFECT_ENUM, GAME_EVENT_ENUM } from "./Enum";
const { ccclass, property } = _decorator;

@ccclass("AudioManager")
export class AudioManager extends Component {
  @property(AudioClip)
  clickButton: AudioClip = null;

  @property(AudioClip)
  clear: AudioClip = null;

  @property(AudioClip)
  clickBlock: AudioClip = null;

  @property(AudioClip)
  lose: AudioClip = null;

  @property(AudioClip)
  win: AudioClip = null;

  @property(AudioClip)
  mainBgm: AudioClip = null;

  @property(AudioClip)
  gameBgm: AudioClip = null;

  @property(AudioSource)
  audioSource: AudioSource = null;

  protected onLoad(): void {
    this.audioSource = this.node.getComponent(AudioSource);
    director.addPersistRootNode(this.node);
    director.on(Director.EVENT_AFTER_SCENE_LAUNCH, this.onSceneLaunched, this);

    PLAY_AUDIO.on(GAME_EVENT_ENUM.PLAY_AUDIO, this.onAudioPlay, this);
  }

  onSceneLaunched() {
    const currentSceneName = director.getScene().name;
    this.updateBackgroundMusic(currentSceneName);
  }

  updateBackgroundMusic(sceneName: string) {
    if (sceneName == "Main") {
      this.audioSource.stop();
      this.audioSource.clip = this.mainBgm;
    } else if (sceneName == "Game") {
      this.audioSource.stop();
      this.audioSource.clip = this.gameBgm;
    }

    if (this.audioSource.clip) {
      this.audioSource.play();
    }
  }

  onAudioPlay(type: AUDIO_EFFECT_ENUM) {
    switch (type) {
      case AUDIO_EFFECT_ENUM.CLICKBUTTON:
        this.audioSource.playOneShot(this.clickButton);
        break;
      case AUDIO_EFFECT_ENUM.CLEAR:
        this.audioSource.playOneShot(this.clear);
    }
  }

  protected onDestroy(): void {
    director.off(Director.EVENT_AFTER_SCENE_LAUNCH, this.onSceneLaunched, this);
    PLAY_AUDIO.off(GAME_EVENT_ENUM.PLAY_AUDIO, this.onAudioPlay, this);
  }

  start() {}

  update(deltaTime: number) {}
}
