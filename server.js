var connect = require('connect')
var serveStatic = require('serve-static')

var app = connect()

app.use(serveStatic(__dirname, {'index': ['index.html', 'default.htm']}))
app.listen(4000)
console.log('running')
