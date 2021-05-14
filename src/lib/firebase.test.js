import { mockFunctions } from 'firebase/app'

test('calls firebase.initializeApp', () => {
  jest.isolateModules(() => {
    // eslint-disable-next-line global-require
    require('./firebase')
  })

  expect(mockFunctions.initializeApp).toHaveBeenCalledTimes(1)
})
