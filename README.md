stylsprite
==========

CSSSprite for stylus.

### Usage in connect

```coffee-script
	options =
		src: 'test/src/stylus'
		dest: 'test/public/css'
		root: 'test/public'
		imgsrc: 'test/src/imgsrc'
	
	app.use '/css',stylsprite.middleware options
	options.compile = stylsprite.middleware.compile
	app.use '/css',stylus.middleware options
```

### Usage in *.styl

```stylus
	background-image: url('path/to/image.png')
```

change to below

```stylus
	stylsprite(url('path/to/image.png'))
```

if you want retina image sprite then add pixel-ratio to arguments.

```stylus
	stylsprite(url('path/to/image.png'),2)
```

thank you for reading. :)