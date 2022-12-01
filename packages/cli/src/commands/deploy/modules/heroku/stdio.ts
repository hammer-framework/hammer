import rdl from 'readline'

import execa from 'execa'

import { getPaths } from '../../../../lib'

import type { ISpinnerAnimation } from './interfaces'
import { ISpawnResult } from './interfaces'

export async function spawn(
  command: string,
  opts?: execa.Options
): Promise<ISpawnResult> {
  const [bin, ...args] = command.split(' ')
  const {
    stdout = '',
    stderr = '',
    exitCode,
  }: execa.ExecaReturnValue = await execa(bin, args, {
    cwd: getPaths().base,
    reject: false,
    // if reject is true, stdio needs to inherit to catch the throw
    stdio: opts?.reject ? 'inherit' : 'pipe',
    cleanup: true,
    stripFinalNewline: true,
    ...opts,
  })
  return { stdout, stderr, exitCode }
}

export class Logger {
  static out(msg: string) {
    process.stdout.write(`🚀 ${msg}\x1b[0G`)
  }

  static error(msg: string) {
    console.error(`❌ ${msg}`)
  }

  static log(...args: any) {
    console.log(args)
  }
}

export class Spinner {
  private _spinner = rdl.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  private _animation: ISpinnerAnimation
  private _message = ''

  constructor(animation = SPINNER_ANIMATIONS['dots']) {
    this._animation = animation
  }

  start(message: string) {
    ;(async () => {
      this._message = message
      // eslint-disable-next-line no-constant-condition
      while (true) {
        for (const animation of this._animation.frames) {
          this._spinner.setPrompt(`${animation} ${this._message}`)
          this._spinner.prompt()
          await this.sleep(this._animation.interval)
        }
      }
    })()
  }

  prompt(message: string) {
    this._spinner.setPrompt(`${message}`)
    this._spinner.prompt()
  }

  stop() {
    this._spinner.close()
  }

  setAnimation(animation: ISpinnerAnimation) {
    this._animation = animation
  }

  private sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time))
  }
}

export const SPINNER_ANIMATIONS: { [key: string]: ISpinnerAnimation } = {
  dots: {
    interval: 80,
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  },
  dots2: {
    interval: 80,
    frames: [
      '⠁',
      '⠁',
      '⠉',
      '⠙',
      '⠚',
      '⠒',
      '⠂',
      '⠂',
      '⠒',
      '⠲',
      '⠴',
      '⠤',
      '⠄',
      '⠄',
      '⠤',
      '⠠',
      '⠠',
      '⠤',
      '⠦',
      '⠖',
      '⠒',
      '⠐',
      '⠐',
      '⠒',
      '⠓',
      '⠋',
      '⠉',
      '⠈',
      '⠈',
    ],
  },
  dots3: {
    interval: 80,
    frames: [
      '⠁',
      '⠂',
      '⠄',
      '⡀',
      '⡈',
      '⡐',
      '⡠',
      '⣀',
      '⣁',
      '⣂',
      '⣄',
      '⣌',
      '⣔',
      '⣤',
      '⣥',
      '⣦',
      '⣮',
      '⣶',
      '⣷',
      '⣿',
      '⡿',
      '⠿',
      '⢟',
      '⠟',
      '⡛',
      '⠛',
      '⠫',
      '⢋',
      '⠋',
      '⠍',
      '⡉',
      '⠉',
      '⠑',
      '⠡',
      '⢁',
    ],
  },
  square: {
    interval: 100,
    frames: ['■', '□', '▪', '▫'],
  },
  bar: {
    interval: 80,
    frames: [
      '[    ]',
      '[=   ]',
      '[==  ]',
      '[=== ]',
      '[ ===]',
      '[  ==]',
      '[   =]',
      '[    ]',
      '[   =]',
      '[  ==]',
      '[ ===]',
      '[====]',
      '[=== ]',
      '[==  ]',
      '[=   ]',
    ],
  },
  ball: {
    interval: 80,
    frames: [
      '( ●    )',
      '(  ●   )',
      '(   ●  )',
      '(    ● )',
      '(     ●)',
      '(    ● )',
      '(   ●  )',
      '(  ●   )',
      '( ●    )',
      '(●     )',
    ],
  },
  solidBar: {
    interval: 17,
    frames: [
      '█▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
      '██▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
      '███▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
      '████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
      '██████▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
      '██████▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
      '███████▁▁▁▁▁▁▁▁▁▁▁▁▁',
      '████████▁▁▁▁▁▁▁▁▁▁▁▁',
      '█████████▁▁▁▁▁▁▁▁▁▁▁',
      '█████████▁▁▁▁▁▁▁▁▁▁▁',
      '██████████▁▁▁▁▁▁▁▁▁▁',
      '███████████▁▁▁▁▁▁▁▁▁',
      '█████████████▁▁▁▁▁▁▁',
      '██████████████▁▁▁▁▁▁',
      '██████████████▁▁▁▁▁▁',
      '▁██████████████▁▁▁▁▁',
      '▁██████████████▁▁▁▁▁',
      '▁██████████████▁▁▁▁▁',
      '▁▁██████████████▁▁▁▁',
      '▁▁▁██████████████▁▁▁',
      '▁▁▁▁█████████████▁▁▁',
      '▁▁▁▁██████████████▁▁',
      '▁▁▁▁██████████████▁▁',
      '▁▁▁▁▁██████████████▁',
      '▁▁▁▁▁██████████████▁',
      '▁▁▁▁▁██████████████▁',
      '▁▁▁▁▁▁██████████████',
      '▁▁▁▁▁▁██████████████',
      '▁▁▁▁▁▁▁█████████████',
      '▁▁▁▁▁▁▁█████████████',
      '▁▁▁▁▁▁▁▁████████████',
      '▁▁▁▁▁▁▁▁████████████',
      '▁▁▁▁▁▁▁▁▁███████████',
      '▁▁▁▁▁▁▁▁▁███████████',
      '▁▁▁▁▁▁▁▁▁▁██████████',
      '▁▁▁▁▁▁▁▁▁▁██████████',
      '▁▁▁▁▁▁▁▁▁▁▁▁████████',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁███████',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁██████',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█████',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█████',
      '█▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁████',
      '██▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁███',
      '██▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁███',
      '███▁▁▁▁▁▁▁▁▁▁▁▁▁▁███',
      '████▁▁▁▁▁▁▁▁▁▁▁▁▁▁██',
      '█████▁▁▁▁▁▁▁▁▁▁▁▁▁▁█',
      '█████▁▁▁▁▁▁▁▁▁▁▁▁▁▁█',
      '██████▁▁▁▁▁▁▁▁▁▁▁▁▁█',
      '████████▁▁▁▁▁▁▁▁▁▁▁▁',
      '█████████▁▁▁▁▁▁▁▁▁▁▁',
      '█████████▁▁▁▁▁▁▁▁▁▁▁',
      '█████████▁▁▁▁▁▁▁▁▁▁▁',
      '█████████▁▁▁▁▁▁▁▁▁▁▁',
      '███████████▁▁▁▁▁▁▁▁▁',
      '████████████▁▁▁▁▁▁▁▁',
      '████████████▁▁▁▁▁▁▁▁',
      '██████████████▁▁▁▁▁▁',
      '██████████████▁▁▁▁▁▁',
      '▁██████████████▁▁▁▁▁',
      '▁██████████████▁▁▁▁▁',
      '▁▁▁█████████████▁▁▁▁',
      '▁▁▁▁▁████████████▁▁▁',
      '▁▁▁▁▁████████████▁▁▁',
      '▁▁▁▁▁▁███████████▁▁▁',
      '▁▁▁▁▁▁▁▁█████████▁▁▁',
      '▁▁▁▁▁▁▁▁█████████▁▁▁',
      '▁▁▁▁▁▁▁▁▁█████████▁▁',
      '▁▁▁▁▁▁▁▁▁█████████▁▁',
      '▁▁▁▁▁▁▁▁▁▁█████████▁',
      '▁▁▁▁▁▁▁▁▁▁▁████████▁',
      '▁▁▁▁▁▁▁▁▁▁▁████████▁',
      '▁▁▁▁▁▁▁▁▁▁▁▁███████▁',
      '▁▁▁▁▁▁▁▁▁▁▁▁███████▁',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁███████',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁███████',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█████',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁████',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁████',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁████',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁███',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁███',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁██',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁██',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁██',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
      '▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁',
    ],
  },
  tree: {
    interval: 400,
    frames: ['🌲', '🎄'],
  },
  point: {
    interval: 125,
    frames: ['∙∙∙', '●∙∙', '∙●∙', '∙∙●', '∙∙∙'],
  },
  mindblown: {
    interval: 160,
    frames: [
      '😐 ',
      '😐 ',
      '😮 ',
      '😮 ',
      '😦 ',
      '😦 ',
      '😧 ',
      '😧 ',
      '🤯 ',
      '💥 ',
      '✨ ',
      '\u3000 ',
      '\u3000 ',
      '\u3000 ',
    ],
  },
}
