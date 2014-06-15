var connect = require('connect')
 , port = 8090
connect.createServer(
    connect.static(__dirname)
).listen(port, function(){
	console.log("Goto: http://localhost:"+port)
});