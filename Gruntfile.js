module.exports = function(grunt) {
	//init
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			'deploy': ['deploy/*'],
			'css': ['src/css/*']
		},
		sass: {
			'project': {
				files: [{
					expand: true,
					cwd: 'src/scss',
					src: ['*.scss'],
					dest: 'src/css',
					ext: '.css'
				}]
			}
		},
		copy: {
			'package-items': {
				files: {
					'deploy/IconMouseNormal.png': ['src/IconMouseNormal.png'],
					'deploy/IconMouseOver.png': ['src/IconMouseOver.png'],
					'deploy/SmallAppstoreTile.png': ['src/SmallAppstoreTile.png'],
					'deploy/LargeAppstoreTile.png': ['src/LargeAppstoreTile.png'],
					'deploy/SmallAppIcon.png': ['src/SmallAppIcon.png'],
					'deploy/LargeAppIcon.png': ['src/LargeAppIcon.png'],
					'deploy/manifest.json': ['src/manifest.json'],
					'deploy/README.md': ['src/README.md']
				}
			},
			'html': {
				files: [{
					expand: true,
					cwd: 'src/html', 
					src: ['**'],
					dest: 'deploy/html'
				}]
			},
			'npapi': {
				files: [{
					expand: true,
					cwd: 'src/npapi', 
					src: ['**'],
					dest: 'deploy/npapi'
				}]
			},
			'components': {
				files: [{
					expand: true,
					cwd: 'src/components',
					src: ['**/*.html', '**/*.png'],
					dest: 'deploy/components'
				}]
			},
			'images': {
				files: [{
					expand: true,
					cwd: 'src/img',
					src: ['**'],
					dest: 'deploy/img'
				}]
			},
			'fonts': {
				files: [{
					expand: true,
					cwd: 'src/fonts',
					src: ['**'],
					dest: 'deploy/fonts'
				}]
			}
		},
		'regex-replace': {
			'app-info': {
				src: ['deploy/manifest.json', 'deploy/README.md'],
				actions: [
					{
						name: 'appName',
						search: 'APP_NAME',
						replace: '<%= pkg.name %>',
						flags: 'g'
					},
					{
						name: 'appVersion',
						search: 'APP_VERSION',
						replace: '<%= pkg.version %>',
						flags: 'g'
					},
					{
						name: 'appAuthor',
						search: 'APP_AUTHOR',
						replace: '<%= pkg.author %>',
						flags: 'g'
					},
					{
						name: 'appAuthorContact',
						search: 'APP_CONTACT',
						replace: '<%= pkg.contact %>',
						flags: 'g'
					},
					{
						name: 'appDescription',
						search: 'APP_DESCRIPTION',
						replace: '<%= pkg.description %>',
						flags: 'g'
					},
				]
			}
		},
		uglify: {
			'project-console': {
				options: {
					banner: '/*! <%= pkg.name %> - v<%= pkg.version %> (<%= grunt.template.today("yyyy-mm-dd") %>) */\n' + 
						'/*! by <%= pkg.author %> */\n',
					compress: {
						drop_console: false
					},
					mangle: false, //TODO: maybe leave true if no function calls from HTML (or use except[] mangle detail)
					preserveComments: false
				},
				files: [{
					expand: true,
					cwd: 'src/js',
					src: '*.js',
					dest: 'deploy/js'
				}]
			},
			'project-noconsole': {
				options: {
					banner: '/*! <%= pkg.name %> - v<%= pkg.version %> (<%= grunt.template.today("yyyy-mm-dd") %>) */\n' + 
						'/*! by <%= pkg.author %> */\n',
					compress: {
						drop_console: true
					},
					mangle: false, //TODO: maybe leave true if no function calls from HTML (or use except[] mangle detail)
					preserveComments: false
				},
				files: [{
					expand: true,
					cwd: 'src/js',
					src: '*.js',
					dest: 'deploy/js'
				}]
			},
			'lib': {
				options: {
					compress: {
						drop_console: true
					},
					preserveComments: 'some'
				},
				files: [{
					expand: true,
					cwd: 'src/js/lib',
					src: '*.js',
					dest: 'deploy/js/lib'
				}]
			},
			'components': {
				options: {
					compress: {
						drop_console: true
					},
					preserveComments: false
				},
				files: [{
					expand: true,
					cwd: 'src/components',
					src: '**/*.js',
					dest: 'deploy/components'
				}]
			}
		},
		cssmin: {
			'project': {
				options: {
					banner: '/*! <%= pkg.name %> - v<%= pkg.version %> (<%= grunt.template.today("yyyy-mm-dd") %>) */\n' + 
						'/*! by <%= pkg.author %> */',
				},
				files: [{
					expand: true,
					cwd: 'src/css',
					src: ['*.css'],
					dest: 'deploy/css'
				}]
			},
			'components': {
				files: [{
					expand: true,
					cwd: 'src/components',
					src: ['**/*.css'],
					dest: 'deploy/components'
				}]
			}
		},
		compress: {
			main: {
				options: {
					archive: 'raid-night_<%= pkg.version %>.zip',
					mode: 'zip',
					pretty: true
				},
				files: [{
					expand: true,
					cwd: 'deploy',
					src: ['**/*']
				}]
			}
		},
		watch: {
			'project-css': {
				files: ['src/scss/*.scss'],
				tasks: ['sass:project', 'cssmin:project'],
				options: { spawn: false }
			},
			'html': {
				files: ['src/html/**'],
				tasks: ['copy:html'],
				options: { spawn: false }
			},
			'project-js': {
				files: ['src/js/*.js'],
				tasks: ['uglify:project-console'],
				options: { spawn: false }
			}
		}
	});

	//plugins
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-regex-replace');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-watch');

	//commands - for deployment
	grunt.registerTask('default', ['sass', 'copy', 'regex-replace', 'uglify:project-noconsole', 'uglify:lib', 'uglify:components', 'cssmin']);
	grunt.registerTask('zip', ['compress']);

	//commands - for development
	//(grunt watch)
};