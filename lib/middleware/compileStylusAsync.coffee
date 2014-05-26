fs = require 'fs'
{dirname,relative,join} = require('path')

chalk = require 'chalk'
_ = require 'lodash'
async = require 'async'

stylus = require 'stylus'

URL = require '../url'
sprite = require '../sprite'
arrayUtils = require '../utils/array'

renderAsync = (callback)->
  parser = this.parser = new stylus.Parser this.str,this.options

  # parse
  ast = do parser.parse
  
  # evaluate
  this.evaluator = new stylus.Evaluator ast,this.options
  this.nodes = stylus.nodes
  this.evaluator.renderer = this

  ast = do this.evaluator.evaluate
  
  do callback

generate = (params,callback)->
  {dir,paths} = params
  # console.log dir,paths
  sprite dir,paths,(error)->
    callback null,not error

module.exports = (paths, callback)->
  {srcPath,destPath,rootPath,imgPath} = paths
  cssPath = relative rootPath,dirname(destPath) or '.'

  options = {filename:srcPath}

  srcCode = fs.readFileSync(srcPath).toString()

  context = stylus srcCode

  dirs = []

  # this define is working at sprite generate only.
  context.define 'stylsprite',(url,pixelRatio)->
    # normalize params
    url = new URL url,cssPath,rootPath
    abspath = url.toAbsolutePath()
    dir = dirname(abspath)
    dir = join imgPath,relative(rootPath,dir)
    dirs.push dir
    return
  
  renderAsync.call context,->
    unless dirs.length then return do callback
    # console.log 'START MIDDLEWARE',chalk.cyan(srcPath)
    dirs = dirs.reduce arrayUtils.uniq
    dirs = dirs.map (dir,index)->
      # console.log "  #{index}:",chalk.cyan(dir)
      return {dir,paths}
    async.map dirs,generate,(error,results)->
      callback results.some (updated)-> updated
      return
    return