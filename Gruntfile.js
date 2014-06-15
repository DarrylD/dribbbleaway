module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                // define a string to put between each file in the concatenated output
                separator: ';'
            },
            dist: {
                src: [
                  'lib/jquery-1.8.3.min.js'
                , 'lib/underscore-min.js'
                , "lib/backbone-min.js"
                , "lib/backbone.global.min.js"
                , "lib/backbone.localstorage.js"
                , "settings.js"
                , "helpers.js"
                ],
                dest: 'dist/built.js',
            }
        }

    });

    // load all plugins
    require('load-grunt-tasks')(grunt);

    // Default task(s).
    grunt.registerTask('default', ['concat:dist']);
    
    // grunt.registerTask('beta', ['ftp-deploy:beta']);
    // grunt.registerTask('prod', ['ftp-deploy:prod']);

};