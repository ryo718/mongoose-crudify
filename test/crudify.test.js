/* eslint-disable no-undef */
const crudify = require('..')
const express = require('express')
const mongoose = require('mongoose')
const ArticleSchema = mongoose.Schema({})
const Article = mongoose.model('DefaultArticle', ArticleSchema)

describe('crudify', () => {
  it('should throw error when options.Model not provided', () => {
    expect(crudify).toThrow('options.Model is required')
  })

  it('should return express router ', () => {
    expect(Object.getPrototypeOf(crudify({ Model: Article })))
      .toBe(express.Router)
  })

  it('should expose crudify.output', () => {
    const router = crudify({ Model: Article })
    const output = crudify.output
    expect(Object.keys(output))
      .toEqual(['handlers', 'hooks', 'router'])
    expect(output.router)
      .toBe(router)
  })
})
