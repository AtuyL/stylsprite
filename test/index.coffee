fs = require 'fs'
http = require 'http'
express = require 'express'
stylus = require 'stylus'
stylsprite = require '../lib'
utils = require '../lib/utils'
async = require 'async'

{join,relative} = require 'path'

tests = []

tests.push (next)->
	cases = [null, [1], 2, [[3,4], 5], [[[]]], [[[6]]], 7, 8, [],null]
	console.log cases.reduce utils.array.flatten
	do next

tests.push (next)->
	options =
		src: 'test/src/stylus'
		dest: 'test/public/css'
		root: 'test/public'
		imgsrc: 'test/src/imgsrc'
	stylsprite_mw = stylsprite.middleware options

	# attach stylsprite compiler
	options.compile = stylsprite.middleware.compile

	# or apply define to your stylus context in compile method.
	# the stylsprite method is require an css-path and document-root-path in arguments.
	options.compile = (str,path)->
		{dest,src,root} = this
		context = stylus str
		destFile = join dest,relative(src,path).replace(/\.styl$/,'.css')
		context.define 'stylsprite',stylsprite(destFile,root)
		return context
	
	stylus_mw = stylus.middleware options
	
	requests = []
	for index in [0...5]
		requests.push
			method:'GET'
			url:'/hoge.css'
		requests.push
			method:'GET'
			url:'/fuga.css'
	eachRequest = (req,next)->
		# console.log 'req.url:',req.url
		stylsprite_mw req,{},->
			stylus_mw req,{},next
	
	async.each requests,eachRequest,->
		do next

async.series tests,(error)->
	if error then return console.log error

	app = do express
	
	app.set('views', __dirname + '/src')
	app.set('view engine', 'jade')

	options =
		src: 'test/src/stylus'
		dest: 'test/public/css'
		root: 'test/public'
		imgsrc: 'test/src/imgsrc'
	
	app.use '/css',stylsprite.middleware options
	options.compile = stylsprite.middleware.compile
	app.use '/css',stylus.middleware options

	# app.use("/css", stylus.middleware({src: path.resolve(dirname, "stylus"), dest: path.resolve(dirname, "css")}));

	app.use express.static __dirname + '/public'

	app.get '/',(req,res)->
		res.render 'index'

	app.listen(8080)