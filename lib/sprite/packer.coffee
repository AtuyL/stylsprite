fs = require 'fs'
path = require 'path'
async = require 'async'
mkdirp = require 'mkdirp'
imagemagick = require "imagemagick"
boxpack = require 'boxpack'
chalk = require 'chalk'

readIdentifyAsync = (src,callback)->
	imagemagick.identify ['-format','%w %h %#',src],(error,w_h_hash)->
		if error then return callback error
		[match,width,height,hash] = /(\d+)\s+(\d+)\s+([a-z0-9]+)/i.exec w_h_hash
		geom = x:0,y:0,width:width|0, height:height|0
		callback null,{src,hash,geom}
		return
	return

module.exports =
	readIdentify:(srcs,callback)->
		unless srcs then return callback 'arguments[0] is invalid'
		return async.map srcs,readIdentifyAsync,callback

	execPacking:(pieces)->
		result = {}
		packed = boxpack().pack(pieces)
		for piece,index in pieces
			{src,x,y} = packed[index]
			piece.x = x
			piece.y = y
			result[src] = {x,y}
		return result

	outputSpriteSheet:(dest,images,callback)->
		# step: calc canvas-size
		canvas =
			width:0
			height:0
		for src,geom of images
			right = geom.x + geom.width
			bottom = geom.y + geom.height
			canvas.width = right if right > canvas.width
			canvas.height = bottom if bottom > canvas.height

		# step: create imagemagick call-stack
		stack = ["-size","#{canvas.width}x#{canvas.height}","xc:none"]
		for src,geom of images
			stack.push src,"-geometry","+#{geom.x}+#{geom.y}","-composite"
		stack.push dest

		# final-step: do create dest-dir and dest-image(sprite-image)
		destdir = path.dirname dest
		unless fs.existsSync(destdir) then mkdirp.sync destdir
		imagemagick.convert stack,10000,callback

		return