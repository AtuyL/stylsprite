fs = require 'fs'
path = require 'path'
crypto = require 'crypto'
os = require 'os'

chalk = require 'chalk'

mkhash = (value)->
	md5sum = crypto.createHash 'md5'
	md5sum.update value,'utf8'
	md5sum.digest 'hex'

class module.exports
	this.lockFiles = []

	token:null
	
	lock:->
		unless ~(index = exports.lockFiles.indexOf this.token)
			exports.lockFiles.push this.token
		# console.log 'lockFiles:',exports.lockFiles
		return
	unlock:->
		if ~(index = exports.lockFiles.indexOf this.token)
			exports.lockFiles.splice index,1
		# console.log 'lockFiles:',exports.lockFiles
		return
	isLocked:->
		return if ~(index = exports.lockFiles.indexOf this.token) then true else false
	
	constructor:(token)->
		unless this instanceof exports then return new exports token
		if token then this.token = token

	getFilePath:->
		token = this.token or do process.cwd
		tmpdir = do os.tmpdir
		filename = mkhash(token) + '.json'
		filepath = path.join tmpdir,filename
		return filepath

	read:->
		json_path = do this.getFilePath
		try
			json_str = fs.readFileSync json_path
			return JSON.parse(json_str) or null
		catch e
			return null

	write:(data)->
		json_path = do this.getFilePath
		fs.writeFileSync json_path,JSON.stringify data
		return