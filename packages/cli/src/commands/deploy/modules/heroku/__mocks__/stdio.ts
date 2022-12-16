export const buildSpawner = () => spawn

export const spawn = jest.fn()
export const spawnFollow = jest.fn()

export const createLogger = () => ({
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  log: jest.fn(),
})

export const green = jest.fn()
export const grey = jest.fn()
