/* eslint-disable no-undef */
const crudify = require('../')
const app = require('./helpers/app')
const mongoose = require('mongoose')
const Article = require('./helpers/models/article')
const supertest = require('supertest')
const request = supertest(app)

describe('generated api for Article', () => {
  let id
  beforeAll((done) => {
    runServer()
    Article.remove({}, (err) => {
      if (err) throw err
      done()
    })
  })
  afterAll((done) => {
    mongoose.disconnect(() => {
      done()
    })
  })
  it('should get articles array of length 0', async (done) => {
    const { status, body } = await request.get('/articles')
    const { error, payload } = body

    expect(status).toBe(200)
    expect(error).toBe(undefined)
    expect(payload).toEqual([])
    done()
  })
  it('should call beforeActions', async (done) => {
    const { status, body } = await request.post('/articles')
      .send({ title: 'title1' })

    expect(status).toBe(401)
    expect(body).toEqual({})
    done()
  })
  it('should create article and return the doc', async (done) => {
    const { status, body } = await request.post('/articles')
      .set('X-USERNAME', 'ryo')
      .send({ title: 'title1' })
    const { error, payload } = body

    expect(status).toBe(200)
    expect(error).toBe(undefined)
    expect(payload._id).toBeDefined()
    id = payload._id
    done()
  })
  it('should get article with id', async (done) => {
    const { status, body } =
      await request.get('/articles/' + id)
    const { error, payload } = body

    expect(status).toBe(200)
    expect(error).toBe(undefined)
    expect(payload._id).toBe(id)
    expect(payload.views).toBe(1)
    done()
  })

  it('should call afterActions', async (done) => {
    const { status, body } =
      await request.get('/articles/' + id)
    const { error, payload } = body

    expect(status).toBe(200)
    expect(error).toBe(undefined)
    expect(payload.views).toBe(2)
    expect(payload.secret).toBe(undefined)
    done()
  })

  it('should get articles array of length 1', async (done) => {
    const { status, body } = await request.get('/articles/')
    const { error, payload } = body

    expect(status).toBe(200)
    expect(error).toBe(undefined)
    expect(payload.length).toBe(1)
    done()
  })

  it('should update article', (done) => {
    Article.findOne({}, async (err, doc) => {
      if (err) throw err
      const { status, body } = await request.put('/articles/' + doc._id)
        .set('X-USERNAME', 'ryo')
        .send({ title: 'changed' })
      const { error, payload } = body

      expect(status).toBe(200)
      expect(error).toBe(undefined)
      expect(payload.title).toBe('changed')
      done()
    })
  })
  it('should delete article', (done) => {
    Article.findOne({}, async (err, doc) => {
      if (err) throw err
      const { status, body } = await request.delete('/articles/' + doc._id)
        .set('X-USERNAME', 'ryo')

      expect(status).toBe(200)
      expect(body).toEqual({})
      done()
    })
  })
  it('should get articles array of length 0', async (done) => {
    const { status, body } = await request.get('/articles/')
    const { error, payload } = body

    expect(status).toBe(200)
    expect(error).toBe(undefined)
    expect(payload.length).toBe(0)
    done()
  })
})

function runServer () {
  app.use('/articles', crudify({
    Model: Article,
    identifyingKey: '_id',
    beforeActions: [
      {
        middlewares: [ensureLogin],
        except: ['list', 'read']
      }
    ],
    afterActions: [
      // {err,payload} available in req.crudify
      {
        middlewares: [updateViewCount, hideFields],
        only: ['read']
      }
    ]
  }))

  app.listen(process.env.PORT, function () {
    console.log('Example app listening on port ' + process.env.PORT)
  })

  function ensureLogin (req, res, next) {
    if (req.get('X-USERNAME') !== 'ryo') {
      return res.sendStatus(401)
    }
    next()
  }
  function updateViewCount (req, res, next) {
    const { error, payload } = req.crudify

    if (error) {
      return res.json({ error: 'woops' })
    }

    const article = payload
    article.views++
    article.save()

    next()
  }
  function hideFields (req, res) {
    const { error, payload } = req.crudify

    const article = payload.toObject()
    delete article.secret

    res.json({
      error,
      payload: article
    })
  }
}
