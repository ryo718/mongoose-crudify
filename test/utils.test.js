/* eslint-disable no-undef */
const crudify = require('..')
const utils = require('../lib/utils')

describe('lib/utils', () => {
  describe('utils.addObjToReq', () => {
    it('should add object to req with specified key', () => {
      const req = {}
      utils.addObjToReq(req, 'myKey', { some: 'object' })
      expect(req).toEqual({
        myKey: {
          some: 'object'
        }
      })
    })
  })
  describe('utils.addHooks', () => {
    let hooks
    const keys = Object.keys(crudify.actionsToVerb)
    function mw1 () { }
    function mw2 () { }

    beforeEach(() => {
      hooks = {}
    })

    it('should add mw1, mw2 only for list, read', () => {
      utils.addHooks(hooks, 'before', [
        {
          middlewares: [mw1, mw2],
          only: ['list', 'read']
        }
      ], keys)

      expect(Object.keys(hooks.before)).toEqual(keys)
      expect(hooks.before.list.length).toBe(2)
      expect(hooks.before.create.length).toBe(0)
      expect(hooks.before.read.length).toBe(2)
      expect(hooks.before.update.length).toBe(0)
      expect(hooks.before.delete.length).toBe(0)
      expect(hooks.before.deleteAll.length).toBe(0)
    })
    it('should add mw1, mw2 for all except create, update', () => {
      utils.addHooks(hooks, 'before', [
        {
          middlewares: [mw1, mw2],
          except: ['create', 'update']
        }
      ], keys)

      expect(Object.keys(hooks.before)).toEqual(keys)
      expect(hooks.before.list.length).toBe(2)
      expect(hooks.before.create.length).toBe(0)
      expect(hooks.before.read.length).toBe(2)
      expect(hooks.before.update.length).toBe(0)
      expect(hooks.before.delete.length).toBe(2)
      expect(hooks.before.deleteAll.length).toBe(2)
    })
  })
})
