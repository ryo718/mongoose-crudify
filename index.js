const express = require('express')
const utils = require('./lib/utils')

function crudify (options = {}) {
  const defaultOptions = {
    Model: null,
    identifyingKey: '_id',
    overrrideAction: [],
    selectFields: null,
    sanitiseBody: null,
    beforeActions: [],
    afterActions: [],
    expressOptions: {
      caseSensitive: false,
      mergeParams: false,
      strict: false
    }
  }
  const _options = Object.assign({}, defaultOptions, options)
  if (!_options.Model) throw new Error('options.Model is required')

  /**
   * add before and after hooks
   */
  const actionNames = Object.keys(crudify.actionsToVerb)
  const hooks = {}

  utils.addHooks(hooks, 'before', _options.beforeActions, actionNames)
  utils.addHooks(hooks, 'after', _options.afterActions, actionNames)

  const defaultActions = crudify.getDefaultActions(_options, hooks)
  const isOverrrideActionArray = _options.overrrideAction.constructor === Array
  const handlers = isOverrrideActionArray
    ? defaultActions
    : Object.assign({}, defaultActions, _options.overrrideAction)

  const router = express.Router(_options.expressOptions)
  for (const action in handlers) {
    if (isOverrrideActionArray && _options.overrrideAction.includes(action)) continue

    const httpMethod = crudify.actionsToVerb[action] || action

    if (typeof router[httpMethod] === 'function') {
      const url = crudify.actionsNeedParam.includes(action)
        ? ('/:' + _options.identifyingKey)
        : '/'
      router[httpMethod](
        url,
        hooks.before[action],
        handlers[action],
        hooks.after[action]
      )
    }
  }

  crudify.output = {
    handlers,
    hooks,
    router
  }

  return router
}

crudify.actionsToVerb = {
  list: 'get',
  create: 'post',
  read: 'get',
  update: 'put',
  delete: 'delete',
  deleteAll: 'delete'
}

crudify.actionsNeedParam = ['read', 'update', 'delete']

crudify.sanitiseObj = function (obj, keys, options) {
  let sanitisedObj = null
  let hasError = false
  const errors = {
    required: [],
    invalid: []
  }

  if (!keys || (typeof keys !== 'string')) {
    return {
      hasError,
      errors,
      sanitisedObj: obj
    }
  }

  keys = keys.split(/,| /)
  const requiredKeys = keys.filter(k => k.startsWith('+'))
    .map(k => k.substring(1))
  const optionalKeys = keys.filter(k => !k.startsWith('+'))
  const whitelistKeys = requiredKeys.concat(optionalKeys)
  const rawKeys = Object.keys(obj)
  whitelistKeys.forEach(k => {
    if (requiredKeys.includes(k)) {
      if (!rawKeys.includes(k)) { errors.required.push(k) }
      if (rawKeys.includes(k) && typeof obj[k] === 'string') {
        if (obj[k].trim().length === 0) {
          errors.required.push(k)
        }
      }
    }
  })

  if (errors.required.length > 0 || errors.invalid.length > 0) { hasError = true }
  if (!hasError) {
    sanitisedObj = {}
    whitelistKeys.forEach(k => {
      if (rawKeys.includes(k)) { sanitisedObj[k] = obj[k] }
    })
  }

  return {
    hasError,
    errors,
    sanitisedObj
  }
}

crudify.getDefaultActions = ({ Model, identifyingKey, selectFields, sanitiseBody }, hooks) => {
  /** actions
   * {
   *    [error | payload]
   * }
   */
  return {
    /** GET / - List all entities */
    list: (req, res, next) => {
      const actionName = 'list'
      const passControl = hooks.after[actionName].length > 0

      const conditions = Object.assign({}, req.params, req.query)
      Model.find(conditions, selectFields, (error, payload) => {
        if (passControl) {
          utils.addObjToReq(req, 'crudify', {
            error,
            payload
          })
          return next()
        }

        if (error) {
          return res.json({ error })
        }

        res.json({ payload })
      })
    },

    /** POST / - Create a new entity */
    create: (req, res, next) => {
      const actionName = 'create'
      const passControl = hooks.after[actionName].length > 0

      let reqBody = req.body
      if (sanitiseBody && sanitiseBody.whitelistKeys) {
        const sanitised = crudify.sanitiseObj(req.body, sanitiseBody.whitelistKeys)

        if (sanitised.hasError) {
          return res.json({
            error: sanitised.errors
          })
        }
        reqBody = sanitised.sanitisedObj
      }

      const newDoc = new Model(reqBody)
      newDoc.save(function (error, payload) {
        if (passControl) {
          utils.addObjToReq(req, 'crudify', {
            error,
            payload
          })
          return next()
        }

        if (error) {
          return res.json({ error })
        }

        res.json({ payload })
      })
    },

    /** GET /:id - Return a given entity */
    read: (req, res, next) => {
      const actionName = 'read'
      const passControl = hooks.after[actionName].length > 0

      const id = req.params[identifyingKey]
      Model.findById(id, selectFields, (error, payload) => {
        if (passControl) {
          utils.addObjToReq(req, 'crudify', {
            error,
            payload
          })
          return next()
        }

        if (error) {
          return res.json({ error })
        }

        res.json({ payload })
      })
    },

    /** PUT /:id - Update a given entity */
    update: (req, res, next) => {
      const actionName = 'update'
      const passControl = hooks.after[actionName].length > 0

      let reqBody = req.body
      if (sanitiseBody && sanitiseBody.whitelistKeys) {
        const sanitised = crudify.sanitiseObj(req.body, sanitiseBody.whitelistKeys)

        if (sanitised.hasError) {
          return res.json({
            error: sanitised.errors
          })
        }
        reqBody = sanitised.sanitisedObj
      }

      const id = req.params[identifyingKey]
      Model.findById(id, function (error, payload) {
        if (error) {
          if (passControl) {
            utils.addObjToReq(req, 'crudify', {
              error
            })
            return next()
          }
          return res.json({ error })
        }
        if (!payload) {
          if (passControl) {
            utils.addObjToReq(req, 'crudify', {
              error,
              payload
            })
            return next()
          }
          return res.json({ payload })
        }

        const doc = payload
        Object.assign(doc, reqBody)
        doc.save(function (error, payload) {
          if (passControl) {
            utils.addObjToReq(req, 'crudify', {
              error,
              payload
            })
            return next()
          }

          if (error) {
            return res.json({ error })
          }

          res.json({ payload })
        })
      })
    },

    /** DELETE /:id - Delete a given entity */
    delete: (req, res, next) => {
      const actionName = 'delete'
      const passControl = hooks.after[actionName].length > 0
      const conditions = Object.assign({}, req.params, req.query)

      Model.deleteOne(conditions, function (error) {
        if (passControl) {
          utils.addObjToReq(req, 'crudify', {
            error
          })
          return next()
        }

        if (error) {
          return res.json({ error })
        }

        res.json({})
      })
    },

    /** DELETE / - Delete all entity */
    deleteAll: (req, res, next) => {
      const actionName = 'deleteAll'
      const passControl = hooks.after[actionName].length > 0
      const conditions = Object.assign({}, req.params, req.query)

      Model.deleteMany(conditions, function (error) {
        if (passControl) {
          utils.addObjToReq(req, 'crudify', {
            error
          })
          return next()
        }

        if (error) {
          return res.json({ error })
        }

        res.json({})
      })
    }
  }
}

module.exports = crudify
