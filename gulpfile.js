'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10',
];

// Compile CoffeeScript
gulp.task('scripts', ['lint'], function() {
  return gulp.src('app/scripts/**/*.coffee')
    .pipe(gulp.dest('.tmp/scripts'))
    .pipe($.size({title: 'scripts'}));
});

// Lint CoffeeScript and JavaScript
gulp.task('lint', function() {
  return gulp.src([
    'app/scripts/**/*.{coffee,js}',
    '!app/scripts/vendor/**/*.js',
  ])
  .pipe($.if('*.coffee', $.coffee()))
  .pipe($.if('*.js', $.jshint()))
  .pipe($.if('*.js', $.jshint.reporter('jshint-stylish')))
  .pipe($.if('*.js', $.if(!browserSync.active, $.jshint.reporter('fail'))));
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
  }).pipe(gulp.dest('dist'))
    .pipe($.size({title: 'copy'}));
});

// Copy fonts to dist
gulp.task('fonts', function() {
  return gulp.src(['app/fonts/**'])
    .pipe(gulp.dest('dist/fonts'))
    .pipe($.size({title: 'fonts'}));
});

// Prefix stylesheets
gulp.task('styles', ['styles:compass'], function() {
  return gulp.src('app/styles/**/*.css')
    .pipe($.changed('.tmp/styles', {extension: '.css'}))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe($.size({title: 'styles'}));
});

// Compile Sass with Compass
gulp.task('styles:compass', function() {
  return gulp.src('app/styles/*.scss')
    .pipe($.compass({
      bundle_exec: true,
      sass: 'app/styles',
      css: '.tmp/styles',
      images: 'app/images',
      font: 'app/fonts',
      comments: true,
      require: ['bootstrap-sass'],
    }))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe($.size({title: 'styles'}));
});

// Scan HTML for assets & optimize them
gulp.task('html', function() {
  var assets = $.useref.assets({searchPath: '{.tmp,app}'});

  return gulp.src('app/**/*.html')
    .pipe(assets)
    .pipe($.if('*.js', $.uglify({preserveComments: 'some'})))
    // Remove Any Unused CSS
    // Make sure you include all html files with unique styles
    .pipe($.if('*.css', $.uncss({
      html: [
        'app/index.html',
      ],
      // CSS Selectors for UnCSS to ignore
      ignore: [
        /.browsehappy/,
      ]
    })))
    .pipe($.if('*.css', $.csso()))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.if('*.html', $.minifyHtml()))
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'html'}));
});

// Remove output directories
gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

// Serve files and watch for changes and reload
gulp.task('serve', ['styles'], function() {
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
  runSequence('styles', ['scripts', 'html', 'images', 'fonts', 'copy'], cb);
});
