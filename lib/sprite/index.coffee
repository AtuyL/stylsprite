version = (require '../../package.json').version

###
# imports
###
fs = require 'fs'
{resolve,relative,join} = require 'path'
async = require 'async'
chalk = require 'chalk'
_ = require 'lodash'

fsUtils = require '../utils/fs'
arrayUtils = require '../utils/array'
packer = require './packer'
helper = require './helper'
io = require './io'

###
# execute task.
###
module.exports = (dir,options,callback)->
	{srcPath,destPath,rootPath,imgPath} = options
	src = resolve dir
	dest = resolve join(rootPath,relative imgPath,src) + '.png'
	callback = (->) if typeof callback isnt 'function'

	done = (error)->
		io(dest).unlock();
		if options.verbose
			console.log chalk.red("---------------- #{error or "DONE"} ----------------")
		callback error
		return
	
	# if io(dest).isLocked()
	# 	console.log "#{dest} : io is locked"
	# 	return do done
	# io(dest).lock()

	options.verbose = false
	options.padding = 0

	tasks = [
		(next)->
			# console.log 'src:',chalk.cyan(src)
			# console.log 'dest:',chalk.cyan(dest)
			next null,src,dest,options
		readCurrent
		prepareCurrent
		prepareTasks
		readIdentifyAll
		formatIdentifies
		extractDiff
		execPacking
		outputSprite
		updateData
	]
	async.waterfall tasks,done
	return

###
# waterfall tasks
###
readCurrent = (src,dest,options,callback)->
	if options.verbose
		console.log chalk.red('---------------- readCurrent ----------------')

	fsUtils.checkExist src,(is_exist)->
		current = io(dest).read() or {}
		# console.log 'HOGEHOGE;',is_exist,version,current
		# current = {}
		if not is_exist or current.version isnt version
			current.version = version
			current.sprites = {}
		else
			current.sprites ?= {}
		current.src = src
		current.dest = dest
		current = new helper current
		# console.log 'HOGEHOGE;',is_exist,version,current.sprites
		callback null,current,options
	return

prepareCurrent = (current,options,callback)->
	if options.verbose
		console.log chalk.red('---------------- prepareCurrent ----------------')
	
	# check not exist images.
	# after that, clear the hash of that are using sprites images.
	# (because for force-update.)
	# finally, remove image from current data.
	files = do current.collectSrc
	unless files.length then return callback null,current,options

	iterator = (file,callback)->
		fsUtils.checkExist file,(is_exist)->
			# console.log file,is_exist
			unless is_exist
				for src,sprite of current.sprites
					sprite.hash = ''
			# unless is_exist then current.sprites = {}
			do callback
			return
		return
	async.each files,iterator,->
		# return callback 'cancel'
		return callback null,current,options		
	return

prepareTasks = (current,options,callback)->
	if options.verbose
		console.log chalk.red('---------------- prepareTasks ----------------')

	REG_IMG = /\.(?:png|je?pg|gif|bmp)$/i
	isImage = (path,stat)->
		return if stat.isFile() and REG_IMG.test(path) then path else null
	isNotSprite = (file,next)->
		file = file.replace REG_IMG,''
		fsUtils.checkExist file,(is_exist)->
			next not is_exist

	fsUtils.readFilesDeep current.src,1,isImage,(error,src)->
		if error then return callback current.src + error.toString()
		src = src.reduce arrayUtils.flatten
		src = src.reduce arrayUtils.uniq
		src = src.filter (path)-> path isnt null
		# console.log src
		async.filter src,isNotSprite,(src)->
			callback error,current,src,options
		# return callback 'cancel'
		return

readIdentifyAll = (current,src,options,callback)->
	if options.verbose
		console.log chalk.red('---------------- readIdentifyAll ----------------')

	packer.readIdentify src,(error,prepered)->
		if error then return callback error
		if options.verbose
			console.log chalk.green.bold(current.src)
			console.log chalk.cyan(file) for file in src
		callback error,current,prepered,options
		return
	return

formatIdentifies = (current,prepered,options,callback)->
	if options.verbose
		console.log chalk.red('---------------- formatIdentifies ----------------')

	# format prepered to sprites-format
	sprites = {}
	for image in prepered 
		{src,hash,geom} = image
		src = relative current.src,src
		sprites[src] = {hash,geom}

	callback null,current,sprites,options
	return

extractDiff = (current,sprites,options,callback)->
	if options.verbose
		console.log chalk.red('---------------- extractDiff ----------------')

	requireUpdate = Object.keys(current.sprites).length isnt Object.keys(sprites).length
	
	unless requireUpdate
		for src,b of sprites
			unless a = current.sprites[src]
				requireUpdate = true
				break
			if a.hash isnt b.hash
				requireUpdate = true
				break

	if requireUpdate
		return callback null,current,sprites,options
	else
		return callback 'cached.'

execPacking = (current,sprites,options,callback)->
	if options.verbose
		console.log chalk.red('---------------- execPacking ----------------')

	padding = options.padding or 0

	pack_list = []

	# create packdata from newer
	for src,sprite of sprites
		pack_list.push do->
			src:src
			width:sprite.geom.width + padding
			height:sprite.geom.height + padding

	# execute packing
	for src,pos of packer.execPacking pack_list
		sprite = sprites[src]
		sprite.geom.x = pos.x
		sprite.geom.y = pos.y
		sprites[src] = sprite

	callback null,current,sprites,options
	return

outputSprite = (current,sprites,options,callback)->
	if options.verbose
		console.log chalk.red('---------------- outputSprite ----------------')
	
	# io(current.dest).unlock();
	if io(current.dest).isLocked() then return callback "#{current.dest} : io is locked";
	io(current.dest).lock();

	images = {}
	for src,sprite of sprites
		images[join(current.src,src)] = sprite.geom

	dest = current.dest
	fsUtils.checkExist dest,(is_exist)->
		msgtag = if is_exist then chalk.green('update:') else chalk.cyan('create:')
		# console.log msgtag,dest
		packer.outputSpriteSheet dest,images,(error)->
			callback null,current,sprites,options
	return

updateData = (current,sprites,options,callback)->
	if options.verbose
		console.log chalk.red('---------------- updateData ----------------')

	for src,sprite of sprites
		current.sprites[src] = sprite
	io(current.dest).write current.valueOf()

	if options.verbose
		console.log JSON.stringify current,null,'  '

	do callback
	return