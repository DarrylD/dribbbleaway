var connect = require('connect')
var serveStatic = require('serve-static')

var app = connect()

app.use(serveStatic(__dirname, {'index': ['index.html', 'default.htm']}))
app.listen(3000)
console.log('running')
