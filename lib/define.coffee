{dirname,relative} = require 'path'
chalk = require 'chalk'
stylus = require 'stylus'

URL = require './url'
io = require './sprite/io'

module.exports = (destFile,rootPath)->
	destDir = dirname destFile
	cssPath = relative(rootPath,destDir) or '.'
	return (url,pixelRatio)->
		url = new URL url,cssPath,rootPath or '.'
		pixelRatio = parseFloat(pixelRatio?.val) or 1

		block = this.closestBlock
		nodes = block.nodes
		nodesIndex = block.index + 1
		for key,value of execDefine(url,pixelRatio)
		  prop = new stylus.nodes.Property([key],value)
		  nodes.splice nodesIndex++,0,prop
		return null

execDefine = (url,pixelRatio)->
	abspath = url.toAbsolutePath()
	dir = dirname abspath
	dest = dir + '.png'
	
	data = io(dest).read()
	unless data then return {}
	
	target = data.sprites[url.toSpritePath()]
	unless target then return {}

	# calc canvas size
	canvas_width = 0
	canvas_height = 0
	for src,sprite of data.sprites
		{x,y,width,height} = sprite.geom
		right = x + width
		bottom = y + height
		canvas_width = right if right > canvas_width
		canvas_height = bottom if bottom > canvas_height

	{x,y,width,height} = target.geom

	if pixelRatio isnt 1
		canvas_width /= pixelRatio
		canvas_height /= pixelRatio
		x /= pixelRatio
		y /= pixelRatio
		width /= pixelRatio
		height /= pixelRatio

	spritePath = url.getSpritePath()
	
	return {
		'width':"#{width}px"
		'height':"#{height}px"
		'background-image':"url('#{spritePath}')"
		'background-position':"#{-x}px #{-y}px"
		'background-size':"#{canvas_width}px #{canvas_height}px"
		'background-repeat':"no-repeat"
	}