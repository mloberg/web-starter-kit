'use strict';

var path = require('path');
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var __ = require('underscore');
var vendor = require('bower-files')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

var AUTOPREFIXER_BROWSERS = [
  "Android 2.3",
  "Android >= 4",
  "Chrome >= 20",
  "Firefox >= 24",
  "Explorer >= 8",
  "iOS >= 6",
  "Opera >= 12",
  "Safari >= 6"
];

// Build scripts
gulp.task('scripts', ['scripts:coffee', 'scripts:vendor'], function() {
  return gulp.src([
      '.tmp/scripts/**/*.js',
      'app/scripts/**/*.js'
    ])
    .pipe($.if('app/scripts/**/*.js', $.jshint()))
    .pipe($.if('app/scripts/**/*.js', $.jshint.reporter('jshint-stylish')))
    .pipe($.if('app/scripts/**/*.js', $.if(!browserSync.active, $.jshint.reporter('fail'))))
    .pipe($.modernizr())
    .pipe(gulp.dest('.tmp/scripts/vendor'));
});

// Compile CoffeeScript
gulp.task('scripts:coffee', function() {
  return gulp.src('app/scripts/**/*.coffee')
    .pipe($.coffeelint())
    .pipe($.coffeelint.reporter())
    .pipe($.coffee())
    .pipe(gulp.dest('.tmp/scripts'))
    .pipe($.size({title: 'scripts:coffee'}));
});

// Install JavaScript files from Bower
gulp.task('scripts:vendor', function() {
  return gulp.src(vendor.ext('js').files)
    .pipe(gulp.dest('.tmp/scripts/vendor'))
    .pipe($.size({title: 'scripts:vendor'}));
});

// Optimize images
gulp.task('images', function() {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size({title: 'images'}));
});

// Copy files at root level to dist
gulp.task('copy', function() {
  return gulp.src([
      'app/*',
      '!app/*.html',
      'node_modules/apache-server-configs/dist/.htaccess'
    ], {
      dot: true
    })
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'copy'}));
});

// Copy fonts to dist
gulp.task('fonts', ['fonts:vendor'], function() {
  return gulp.src(['app/fonts/**', '.tmp/fonts/**'])
    .pipe(gulp.dest('dist/fonts'))
    .pipe($.size({title: 'fonts'}));
});

gulp.task('fonts:vendor', function() {
  return gulp.src(vendor.ext(['eot', 'woff', 'woff2', 'ttf', 'svg']).files)
    .pipe(gulp.dest('.tmp/fonts'));
});

// Prefix stylesheets
gulp.task('styles', ['styles:sass', 'styles:vendor'], function() {
  return gulp.src('app/styles/**/*.css')
    .pipe($.changed('.tmp/styles', {extension: '.css'}))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe($.size({title: 'styles'}));
});

// Compile Sass
gulp.task('styles:sass', function() {
  return gulp.src([
      'app/styles/*.scss',
      '!app/styles/_*.scss',
    ])
    .pipe($.sass({
      includePaths: __.uniq(vendor.ext('scss').files.map(path.dirname))
    }))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe($.size({title: 'styles:sass'}));
});

// Install stylesheets from Bower
gulp.task('styles:vendor', function() {
  return gulp.src(vendor.ext('css').files)
    .pipe(gulp.dest('.tmp/styles/vendor'))
    .pipe($.size({title: 'styles:vendor'}));
});

// Scan HTML for assets & optimize them
gulp.task('html', function() {
  return gulp.src('app/**/*.html')
    .pipe($.useref({searchPath: '{.tmp,app}'}))
    .pipe($.if('*.js', $.uglify({preserveComments: 'some'})))
    // Remove Any Unused CSS
    .pipe($.if('*.css', $.uncss({
      html: [
        'app/**/*.html',
      ],
      // CSS Selectors for UnCSS to ignore
      ignore: [
        /.browserupgrade/,
      ]
    })))
    .pipe($.if('*.css', $.csso()))
    .pipe($.if('*.html', $.minifyHtml()))
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'html'}));
});

// Remove output directories
gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

// Serve files and watch for changes and reload
gulp.task('serve', ['styles', 'scripts', 'fonts:vendor'], function() {
  browserSync({
    notify: false,
    server: {
      baseDir: ['.tmp', 'app']
    }
  });

  gulp.watch(['app/**/*.html'], reload);
  gulp.watch(['app/styles/**/*.{scss,css}'], ['styles', reload]);
  gulp.watch(['app/scripts/**/*.{coffee,js}'], ['scripts']);
  gulp.watch(['app/images/**/*'], reload);
});

// Build and serve the output from dist
gulp.task('serve:dist', ['default'], function() {
  browserSync({
    notify: false,
    server: {
      baseDir: 'dist'
    }

  });
});

// Build site to dist
gulp.task('default', ['clean'], function(cb) {
  runSequence(['styles', 'scripts'], ['html', 'images', 'fonts', 'copy'], cb);
});
