fs = require 'fs'
{join,sep,relative} = require 'path'

stylus = require 'stylus'

compileStylusAsync = require './compileStylusAsync'
define = require '../define'

module.exports = (options)->
	{dest,src,root,imgsrc} = options
	unless src then throw new Error('stylsprite.middleware() requires "src" directory')
	dest ?= src
	root ?= dest
	imgsrc ?= root

	url = require 'url'
	return (req, res, next)->
		if 'GET' isnt req.method and 'HEAD' isnt req.method then return next()
		path = url.parse(req.url).pathname
		unless /\.css$/.test(path) then return next()
		
		if typeof dest is 'string' or typeof dest is 'function'
			# check for dest-path overlap
			overlap = compare dest?(path) or dest, path
			path = path.slice overlap.length

		paths =
			srcPath: src?(path) or join(src, path.replace('.css', '.styl'))
			destPath: dest?(path) or join(dest, path)
			rootPath: root?(path) or root
			imgPath: imgsrc?(path) or imgsrc

		compileStylusAsync paths,(updated)->
			# console.log 'updated:',updated
			if updated then try
				fs.unlinkSync paths.destPath
			do next

module.exports.compile = (str,path)->
	{dest,src,root,imgsrc} = this
	context = stylus str
	context.set 'filename',path
	context.set 'compress',this.compress
	context.set 'firebug',this.firebug
	context.set 'linenos',this.linenos
	try context.use do require('nib')
	# this == options
	destFile = join dest,relative(src,path).replace(/\.styl$/,'.css')
	context.define 'stylsprite',define(destFile,root)
	return context

compare = (pathA, pathB)->
	pathA = pathA.split sep
	pathB = pathB.split sep
	overlap = []
	while pathA[pathA.length - 1] is pathB[0]
		overlap.push pathA.pop()
		do pathB.shift
	return overlap.join sep