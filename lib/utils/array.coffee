module.exports =
	flatten:flatten = (a,b)->
		unless Array.isArray a then a = [a] else a = a.reduce flatten,[]
		unless Array.isArray b then b = [b] else b = b.reduce flatten,[]
		return a.concat b
	uniq:(a,b)->
		a ?= []
		unless Array.isArray a then a = [a]
		return if ~(a.indexOf b) then a else a.concat b