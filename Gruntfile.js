
module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: [
                'Gruntfile.js',
                'src/index.js',
                'src/DataVis.js',
                'src/DataVisualizer.js',
                'src/Dataset.js',
                'src/Variable.js',
                'src/VarType.js'
            ]
        },
        browserify: {
          options: {
            banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
            standalone: 'ausglobe'
          },
          build: {
            src: 'src/index.js',
            dest: 'src/build/<%= pkg.name %>.js'
          }
        },
        uglify: {
          options: {
            banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
          },
          build: {
            src: 'src/build/<%= pkg.name %>.js',
            dest: 'src/build/<%= pkg.name %>.min.js'
          }
        },
        concat: {
          basic_and_extras: {
              files: {
                'public/<%= pkg.name %>.min.js': ['src/copyrightHeader.js', 'src/build/<%= pkg.name %>.min.js'],
                'public/<%= pkg.name %>.js': ['src/copyrightHeader.js', 'src/build/<%= pkg.name %>.js'],
              },
          },
        },
        jsdoc : {
            dist : {
                src: ['src/*.js'], 
                options: {
                    destination: 'public/doc'
                }
            }
        },
        jasmine: {
            pivotal: {
              src: ['public/cesium/CesiumUnminified/Cesium.js', 'src/**/*.js'],
              options: {
                specs: 'public/spec/*Spec.js',
                helpers: 'public/spec/*Helper.js'
              }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-bump-build-git');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    
    grunt.registerTask('test', ['jshint']);
    grunt.registerTask('default', ['browserify', 'uglify', 'concat', 'jsdoc']);

};
