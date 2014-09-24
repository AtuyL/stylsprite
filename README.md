stylsprite
==========

CSS sprites for Stylus. (right now .png only)

### Usage with connect

```javascript
options = {
  src: 'test/src/stylus',
  dest: 'test/public/css',
  compile: stylsprite.middleware.compile,
  padding: 2
};

app.use('/css', stylsprite.middleware(options));
app.use('/css', stylus.middleware(options));
```

### Usage with Stylus files.

Just change any use of background-image like this ...

```stylus
background-image: url('path/to/image.png')
```

... into ...

```stylus
stylsprite(url('path/to/image.png'))
```

Now all your background images will be automatically combined to sprites.

To specify that this background is for retina displays you can add a pixel-ratio argument:

```stylus
stylsprite(url('path/to/image.png'),2)
```

### Root property for absolute urls

By default Stylsprite will lookup absolute urls images on the same location as the css
files are generated.

To make sure that absolute paths like ```/img/myimg.png``` are not loaded from ```/css/img/myimg.png```
add it like this:

```javascript
options = {
  src: 'test/src/stylus',
  dest: 'test/public/css',
  root: 'test/public',
  padding: 2
};

app.use('/css', stylsprite.middleware(options));
app.use('/css', stylus.middleware(options));
```

### Imgsrc property to load images from a different location

By default Stylsprite will lookup images on the same location as the css
files are generated.

Use ```imgsrc``` to make load images from a different path:

```javascript
options = {
  src: 'test/src/stylus',
  dest: 'test/public/css',
  imgsrc: 'test/src/imgsrc',
  padding: 2
};

app.use('/css', stylsprite.middleware(options));
app.use('/css', stylus.middleware(options));
```

### OneStopOption

```javascript
options = {
  src: 'test/src/stylus',
  dest: 'test/public/css',
  imgsrc: 'test/src/imgsrc',
  padding: 2,
  onestop: true
};

app.use('/css', stylsprite.middleware(options));
// app.use('/css', stylus.middleware(options)); <- needlessness in onestop mode
```

Thanks for reading. :)