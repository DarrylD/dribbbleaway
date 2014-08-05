// everything starts here...

//async load all js files
head.js("lib/jquery-1.8.3.min.js"
    , "lib/underscore-min.js"
	, "lib/backbone-min.js"
	, "lib/backbone.global.min.js"
	, "lib/backbone.localstorage.js"
	, "lib/react.js"
	, "lib/react.backbone.js"
	, "settings.js"
	, "helpers.js"
	, start);

function start() {
	console.log('Scripts loaded')
	//grab the templates
	$.get('templates/templates.html', function(data) {
		$('body').append(data)
		//load the application
		head.load("site.jsx")
	});
}
