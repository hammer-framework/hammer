import fs from 'fs'

import { Listr } from 'listr2'

jest.mock('fs')

import * as rollback from '../rollback'

it('resets file contents', async () => {
  fs.__setMockFiles({
    'fake-file-1': 'fake-content-1',
    'fake-file-2': 'fake-content-2',
  })
  rollback.addFileToRollback('fake-file-1')

  fs.writeFileSync('fake-file-1', 'fake-content-changed')

  await rollback.executeRollback()
  expect(fs.readFileSync('fake-file-1')).toBe('fake-content-1')
  expect(fs.readFileSync('fake-file-2')).toBe('fake-content-2')
})

it('removes new files', async () => {
  fs.__setMockFiles({
    'fake-file-1': 'fake-content-1',
  })
  rollback.addFileToRollback('fake-file-1')
  rollback.addFileToRollback('fake-file-2')

  fs.writeFileSync('fake-file-2', 'fake-content-new')

  await rollback.executeRollback()
  expect(fs.readFileSync('fake-file-1')).toBe('fake-content-1')
  expect(fs.readFileSync('fake-file-2')).toBe(undefined)
})

// TODO: Handle this when the fs mock implements the additional functions nessecary to inspect dirs
it.todo('removes empty folders after removing files')

it('executes sync functions', async () => {
  fs.__setMockFiles({})
  rollback.addFunctionToRollback(() => {
    fs.writeFileSync('fake-file', 'fake-content')
  })
  await rollback.executeRollback()
  expect(fs.readFileSync('fake-file')).toBe('fake-content')
})

it('executes async functions', async () => {
  fs.__setMockFiles({})
  rollback.addFunctionToRollback(async () => {
    // make up some async process
    await new Promise((resolve, _) => {
      fs.writeFileSync('fake-file', 'fake-content')
      resolve()
    })
  })
  await rollback.executeRollback()
  expect(fs.readFileSync('fake-file')).toBe('fake-content')
})

it('executes rollback in order', async () => {
  // default stack ordering LIFO
  fs.__setMockFiles({
    'fake-file': '0',
  })
  rollback.addFunctionToRollback(() => {
    fs.writeFileSync('fake-file', '1')
  })
  rollback.addFunctionToRollback(() => {
    fs.writeFileSync('fake-file', '2')
  })
  rollback.addFunctionToRollback(() => {
    fs.writeFileSync('fake-file', '3')
  })
  await rollback.executeRollback()
  expect(fs.readFileSync('fake-file')).toBe('1')

  // handles the atEnd flag
  fs.__setMockFiles({
    'fake-file': '0',
  })
  rollback.addFunctionToRollback(() => {
    fs.writeFileSync('fake-file', '1')
  })
  rollback.addFunctionToRollback(() => {
    fs.writeFileSync('fake-file', '2')
  }, true)
  rollback.addFunctionToRollback(() => {
    fs.writeFileSync('fake-file', '3')
  })
  await rollback.executeRollback()
  expect(fs.readFileSync('fake-file')).toBe('2')

  // using files rather than functions
  fs.__setMockFiles({
    'fake-file': '0',
  })
  rollback.addFileToRollback('fake-file')
  fs.writeFileSync('fake-file', '1')
  rollback.addFileToRollback('fake-file')
  fs.writeFileSync('fake-file', '2')
  rollback.addFileToRollback('fake-file')
  fs.writeFileSync('fake-file', '3')
  await rollback.executeRollback()
  expect(fs.readFileSync('fake-file')).toBe('0')

  // using files rather than functions and the atEnd flag
  fs.__setMockFiles({
    'fake-file': '0',
  })
  rollback.addFileToRollback('fake-file')
  fs.writeFileSync('fake-file', '1')
  rollback.addFileToRollback('fake-file')
  fs.writeFileSync('fake-file', '2')
  rollback.addFileToRollback('fake-file', true)
  fs.writeFileSync('fake-file', '3')
  await rollback.executeRollback()
  expect(fs.readFileSync('fake-file')).toBe('2')
})

it('reset clears the stack', async () => {
  fs.__setMockFiles({})
  rollback.addFunctionToRollback(() => {
    fs.writeFileSync('fake-file', 'fake-content')
  })
  rollback.resetRollback()
  await rollback.executeRollback()
  expect(fs.readFileSync('fake-file')).toBe(undefined)
})

it('prepare clears the stack', async () => {
  fs.__setMockFiles({})
  rollback.addFunctionToRollback(() => {
    fs.writeFileSync('fake-file', 'fake-content')
  })
  rollback.prepareForRollback({})
  await rollback.executeRollback()
  expect(fs.readFileSync('fake-file')).toBe(undefined)
})

it('prepare sets listr2 rollback functions and rollback executes correctly', async () => {
  const fakeTaskFunction = jest.fn()
  const fakeRollbackFunction = jest.fn()
  const tasks = new Listr(
    [
      {
        title: 'First example task',
        task: () => {
          fakeTaskFunction()
          rollback.addFunctionToRollback(fakeRollbackFunction)
        },
      },
      {
        title: 'Second example task',
        task: () => {
          fakeTaskFunction()
        },
      },
      {
        title: 'Third example task',
        task: () => {
          throw new Error('fake error')
        },
      },
    ],
    { rendererSilent: true }
  )

  rollback.prepareForRollback(tasks)

  tasks.tasks.forEach((task) => {
    expect(task.tasks.rollback).toBe(rollback.executeRollback)
  })

  try {
    await tasks.run()
  } catch (error) {
    // we expect the error
  }

  expect(fakeTaskFunction.mock.calls.length).toBe(2)
  expect(fakeRollbackFunction.mock.calls.length).toBe(1)
})
