{join} = require 'path'

chalk = require 'chalk'

uniq = (a,b)-> if ~(a.indexOf b) then a else a.concat b

class module.exports	
	version:null
	src:null
	dest:null
	sprites:null

	constructor:(data)->
		unless this instanceof exports then return new exports data
		this.version = data.version
		this.src = data.src
		this.dest = data.dest
		this.sprites = data.sprites
		return this

	filterByDest:(dest)->
		sprites = null
		for src,srcdata of this.sprites when srcdata.sheets[dest]
			sprites ?= {}
			sprites[src] = srcdata
		return sprites

	removeSrc:(src)->
		if this.sprites[src]
			delete this.sprites[src]
		return

	removeDest:(dest)->
		for src,srcdata of this.sprites
			delete srcdata.sheets[dest]
		for src,srcdata of this.sprites
			unless Object.keys(srcdata.sheets).length
				delete this.sprites[src]
		return

	clearHash:(srcs=null)->
		if srcs is null then srcs = Object.keys this.sprites
		else if typeof srcs is 'string' then srcs = [srcs]
		for src,srcdata of this.sprites when ~srcs.indexOf(src)
			srcdata.hash = null
		return

	collectSrc:->
		src = this.src
		return Object.keys(this.sprites).map (file)-> join src,file

	collectDest:(srcs=null)->
		if srcs is null then srcs = Object.keys this.sprites
		else if typeof srcs is 'string' then srcs = [srcs]
		dests = []
		for src,srcdata of this.sprites when ~srcs.indexOf(src)
			dests.push dest for dest,pos of srcdata.sheets when not ~dests.indexOf(dest)
		return dests.reduce uniq,[]

	collectFellow:(srcs=null)->
		return this.collectSrc this.collectDest srcs

	valueOf:->
		version:this.version
		src:this.src
		dest:this.dest
		sprites:this.sprites
	toString:-> return JSON.stringify this.valueOf(),null,'  '
	log:->
		for src,srcdata of this.sprites
			console.log chalk.cyan(src)
			console.log '  ',chalk.gray('hash:'),srcdata.hash
			console.log '  ',chalk.gray('geom:'),srcdata.geom
			if Object.keys(srcdata.sheets)
				console.log '  ',chalk.gray('sheets:')
				for dest,pos of srcdata.sheets
					console.log '    ',dest,':',pos
			else
				console.log '  ',chalk.gray('sheets:'),'{}'