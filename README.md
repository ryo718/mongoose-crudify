# mongoose-crudify

Generates crud routes for mongoose model

## Install
```bash
$ npm i -S mongoose-crudify
```

## Example
```js
var mongooseCrudify = require('mongoose-crudify')
var Article = require('../app/models/article')

/**
 * By default, following routes are generated
 *  list    - GET /articles/
 *  create  - POST /articles/
 *  read    - GET /articles/{_id}/
 *  update  - PUT /articles/{_id}/
 *  delete  - DELETE /articles/{_id}/
 */
app.use('/articles', mongooseCrudify({
  Model: Article,
  beforeActions: [
    {
      middlewares: [ensureLogin],
      except: ['list', 'read']
    }
  ]
}))
```

## Available options
```js
var mongooseCrudify = require('mongoose-crudify')
var Article = require('../app/models/article')

app.use('/articles', mongooseCrudify({
  // mongoose model, required
  Model: Article, 
  // route param name, defaults to '_id'
  identifyingKey: '_id', 
  // http://mongoosejs.com/docs/api.html#query_Query-select
  selectFields: '-secret', 
  overrrideAction: {
    /**
     * overrrideAction: ['read','delete'], default handlers 
     * for read and delete wont be attached to router object.
     * 
     * keys of default actions: list, create, read, update,
     * delete, deleteAll
     **/

    // override read
    read: (req, res)=> {
      res.json({some: 'doc'})
    }
  },
  // sanitise req.body, prefix + to required field , others are optional
  // errors found are sent to client in json
  sanitiseBody: {
    whitelistKeys: '+password +email dob'
  },
  beforeActions: [
    {
      middlewares: [ensureLogin],
      except: ['list', 'read']
    }
  ],
  afterActions: [
    //{err,payload} available in req.crudify
    {
      middlewares: [updateViewCount, hideFields],
      only: ['read']
    }
  ],
  expressOptions: {
    // https://expressjs.com/en/api.html#express.router
    // express.router instance will be created with these options
    caseSensitive: false,
    mergeParams: false,
    strict: false
  }
}))

function ensureLogin (req, res, next) {
  if (req.get('X-USERNAME') !== 'ryo') {
    return res.sendStatus(401)
  }
  next()
}
function updateViewCount (req, res, next) {
  const {error, payload} = req.crudify

  if(error){
    return res.json({error: 'woops'})
  }

  let article = payload
  article.views++
  article.save()

  next()
}
function hideFields (req, res) {
  const {error, payload} = req.crudify

  let article = payload.toObject()
  delete article.secret

  res.json({
    article
  })
}
```
