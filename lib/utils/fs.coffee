fs = require 'fs'
path = require 'path'
async = require 'async'

readFilesDeep = (exists,depth,modifier,done)->
	unless Array.isArray exists then exists = [exists]
	if typeof depth is 'number' then depth--
	enable_deep_read = depth is null or depth >= 0
	defsMapping = (def,callback)->
		{file,stat} = def
		if stat.isDirectory() and enable_deep_read
			fs.readdir file,(error,children)->
				if children
					children = children.map (child)-> path.join file,child
					readFilesDeep children,depth,modifier,callback
				else
					callback null,null
				return
			return
		if typeof modifier is 'function'
			callback null,modifier(file,stat)
		else
			callback null,file
		return
	async.map exists,fs.stat,(error,stats)->
		if error then return done error,null
		defs = stats.map (stat,index)-> return {file:exists[index],stat}
		async.map defs,defsMapping,done
		return
	return

checkExist = (path,callback)->
	# fs.exists does not use. because there is anachronism.
	fs.open path,'r',(error,fd)->
		unless fd
			return callback not error
		return fs.close fd,->
			callback not error
	return

if module.parent
	module.exports = {
		readFilesDeep
		checkExist
	}
else do -> # do unit test
	console.log '--------'
	arrayUtils = require './arrayUtils'
	files = ['test/src/images/t','test/src/images/b/l-tr.png','test/src/images/b/r']
	REG_IMG = /\.(?:png|je?pg|gif|bmp)$/i
	async.filter files,checkExist,(files)->
		isImage = (path,stat)->
			return if stat.isFile() and REG_IMG.test(path) then path else null
		readFilesDeep files,1,isImage,(error,result)->
			console.log '--------'
			# console.log error or 'done'
			# console.log JSON.stringify(result,null,'  ')
			# console.log '------'
			result = result.reduce arrayUtils.flatten
			result = result.filter (path)-> path isnt null
			console.log result
			return