
export class AudioManager {
  private audioContext: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private backgroundMusic: HTMLAudioElement | null = null;
  private musicEnabled: boolean = true;
  private musicVolume: number = 0.5;

  constructor() {
    // 初始化 AudioContext（延迟初始化，避免浏览器自动播放策略限制）
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext not supported', e);
      }
    }
  }

  // 启用/禁用音效
  setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  // 确保 AudioContext 已初始化（需要用户交互后）
  private ensureAudioContext() {
    if (!this.audioContext) {
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        try {
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
          return false;
        }
      } else {
        return false;
      }
    }
    // 如果 AudioContext 被暂停，尝试恢复（需要用户交互）
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return true;
  }

  // 静默激活音频上下文（不播放音效）
  activateAudioContext(): void {
    this.ensureAudioContext();
  }

  // 播放音频文件（如果存在）
  async playSoundFile(url: string, volume: number = 0.5): Promise<void> {
    if (!this.soundEnabled) return;

    try {
      const audio = new Audio(url);
      audio.volume = volume;
      await audio.play();
    } catch (e) {
      // 如果文件不存在或播放失败，使用生成的音效
      console.log('Audio file not found, using generated sound');
      this.playGeneratedSound(volume);
    }
  }

  // 使用 Web Audio API 生成兔子叫声（简单的音效）
  playGeneratedSound(volume: number = 0.5): void {
    if (!this.soundEnabled || !this.ensureAudioContext()) return;

    const ctx = this.audioContext!;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // 连接到输出
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 设置音调（模拟兔子叫声，使用较高的频率）
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);

    // 设置音量包络（快速淡入淡出）
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, ctx.currentTime + 0.15);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);

    // 播放
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.25);
  }

  // 播放消除音效（优先使用音频文件，否则使用生成的音效）
  async playMatchSound(matchCount: number = 3): Promise<void> {
    // 根据消除数量调整音量
    const volume = Math.min(0.7, 0.3 + matchCount * 0.1);
    
    // 尝试播放音频文件（如果存在）
    // 用户可以将音频文件放在 public/sounds/rabbit-sound.mp3 或 .wav
    const baseUrl = import.meta.env.BASE_URL || '/';
    const soundFiles = [
      `${baseUrl}sounds/rabbit-sound.mp3`,
      `${baseUrl}sounds/rabbit-sound.wav`,
      `${baseUrl}sounds/match-sound.mp3`,
      `${baseUrl}sounds/match-sound.wav`
    ];

    let played = false;
    for (const file of soundFiles) {
      try {
        await this.playSoundFile(file, volume);
        played = true;
        break;
      } catch (e) {
        // 继续尝试下一个文件
      }
    }

    // 如果所有文件都失败，使用生成的音效
    if (!played) {
      this.playGeneratedSound(volume);
    }
  }

  // 播放背景音乐
  async playBackgroundMusic(url: string, volume: number = 0.5): Promise<void> {
    if (!this.musicEnabled) return;

    // 如果已经有背景音乐在播放，先停止
    if (this.backgroundMusic) {
      this.stopBackgroundMusic();
    }

    try {
      const audio = new Audio(url);
      audio.loop = true; // 循环播放
      audio.volume = volume;
      this.musicVolume = volume;
      this.backgroundMusic = audio;
      
      // 尝试播放，如果失败（可能是浏览器限制），等待用户交互
      await audio.play().catch((e) => {
        console.log('Background music play failed, will retry on user interaction:', e);
      });
    } catch (e) {
      console.warn('Failed to load background music:', e);
    }
  }

  // 停止背景音乐
  stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
      this.backgroundMusic = null;
    }
  }

  // 暂停背景音乐
  pauseBackgroundMusic(): void {
    if (this.backgroundMusic && !this.backgroundMusic.paused) {
      this.backgroundMusic.pause();
    }
  }

  // 恢复背景音乐
  resumeBackgroundMusic(): void {
    if (this.backgroundMusic && this.backgroundMusic.paused) {
      this.backgroundMusic.play().catch(() => {
        // 如果播放失败，静默处理
      });
    }
  }

  // 设置背景音乐音量
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume;
    }
  }

  // 启用/禁用背景音乐
  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.pauseBackgroundMusic();
    } else if (this.backgroundMusic) {
      this.resumeBackgroundMusic();
    }
  }

  // 确保背景音乐在用户交互后开始播放
  async ensureBackgroundMusicPlaying(): Promise<void> {
    if (this.backgroundMusic && this.backgroundMusic.paused && this.musicEnabled) {
      try {
        await this.backgroundMusic.play();
      } catch (e) {
        // 如果播放失败，静默处理
      }
    }
  }

  // 播放结束界面的风声音效
  async playWindSound(volume: number = 0.6): Promise<void> {
    if (!this.soundEnabled) return;

    // 尝试播放音频文件（如果存在）
    const baseUrl = import.meta.env.BASE_URL || '/';
    const windSoundFiles = [
      `${baseUrl}sounds/wind-sound.wav`,
      `${baseUrl}sounds/wind.wav`,
      `${baseUrl}sounds/gameover-sound.wav`,
      `${baseUrl}sounds/end-sound.wav`
    ];

    let played = false;
    for (const file of windSoundFiles) {
      try {
        const audio = new Audio(file);
        audio.volume = volume;
        await audio.play();
        played = true;
        break;
      } catch (e) {
        // 继续尝试下一个文件
      }
    }

    if (!played) {
      console.log('Wind sound file not found');
    }
  }
}

