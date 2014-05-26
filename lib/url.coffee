path = require 'path'
chalk = require 'chalk'

parseUrl = (url)->
  unless url.args
    url = url.val or url
  else
    urlArgs = url.args.nodes[0]
    if urlArgs.nodes.length
      url = (value.string for value in urlArgs.nodes).join ''
    else
      url = urlArgs.nodes[0]
  return url

class module.exports
  cssPath:'.'
  rootPath:'.'

  constructor:(url,cssPath,rootPath)->
    this.cssPath = cssPath
    this.rootPath = path.resolve rootPath
    this.value = parseUrl url

  spritePath:null
  toSpritePath:->
    if this.spritePath then return this.spritePath
    abspath = this.toAbsolutePath()
    sppath = path.relative(path.dirname(abspath),abspath)
    return this.spritePath = sppath
  
  absolutePath:null
  toAbsolutePath:->
    if this.absolutePath then return this.absolutePath
    if /^https?:\/\//i.test this.value
      throw new Error 'sorry. not supported yet.. : ' + this.value
    if /^\//i.test this.value
      abspath = path.join this.rootPath,this.value
    else
      abspath = path.join this.rootPath,this.cssPath,this.value
    return this.absolutePath = abspath

  getSpritePath:->
    return path.dirname(this.value) + '.png'

  valueOf:-> this.value
  toString:-> this.value

  this.test = ->
    chalk = require 'chalk'
    basename = path.basename process.cwd()
    rootPaths = [
      'b'
      './b'
      "../#{basename}/b"
      '/b'
    ]
    cssPaths = [
      'a'
      './a'
      '../b/a'
      '/a'
    ]
    values = [
      'c.png'
      './c.png'
      '../a/c.png'
      '/c.png'
    ]
    for value in values
      for css in cssPaths
        for root in rootPaths
          url = new URL value,css,root
          abspath = do url.toAbsolutePath
          if 'b/a/c.png' is abspath
            console.log chalk.cyan('OK:'),
              chalk.green('root:'),chalk.bold(root)
              chalk.green('css:'),chalk.bold(css)
              chalk.green('value:'),chalk.bold(value)
              chalk.gray('-->'),chalk.green(abspath)
          else
            console.log chalk.red('NG:'),
              chalk.red('root:'),chalk.bold(root)
              chalk.red('css:'),chalk.bold(css)
              chalk.red('value:'),chalk.bold(value)
              chalk.gray('-->'),chalk.red(abspath)