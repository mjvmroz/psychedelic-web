'use strict';

const gulp = require('gulp'),
  clean = require('gulp-clean'),
  cleanhtml = require('gulp-cleanhtml'),
  minifycss = require('gulp-minify-css'),
  jshint = require('gulp-jshint'),
  stripdebug = require('gulp-strip-debug'),
  uglify = require('gulp-uglify'),
  zip = require('gulp-zip'),

  createStyleTask = function(path) {
    // return gulp.src('src/styles/**/*.css')
    //   .pipe(minifycss({root: 'src/styles', keepSpecialComments: 0}))
    //   .pipe(gulp.dest('build/styles'));
    return gulp.src(`src/${path}**`)
      .pipe(gulp.dest(`build/${path}`));
  },
  createJsHintTask = function(path) {
    return gulp.src(`src/${path}*.js`)
      .pipe(jshint())
      .pipe(jshint.reporter('default'));
  },
  createScriptTask = function(path) {
    return gulp.src([`src/${path}/**/*.js`])
      .pipe(stripdebug())
      .pipe(uglify({}))
      .pipe(gulp.dest(`build/${path}`));
  },

  copyDirectories = ['assets/fonts/', 'icons/', '_locales/'],
  jsDependencies = [];

//clean build directory
gulp.task('clean', () => {
  return gulp.src('build/*', {read: false})
    .pipe(clean());
});

//copy static folders to build directory
gulp.task('copy', () => {
  return copyDirectories.map((dir, i) => {
    gulp.src(`src/${dir}**`)
      .pipe(gulp.dest(`build/${dir}`));
  }).concat([
    gulp.src('src/manifest.json').pipe(gulp.dest('build/'))
  ]);
});

//copy and compress HTML files
gulp.task('html', () => {
  return gulp.src('src/assets/html/*.html')
    .pipe(cleanhtml())
    .pipe(gulp.dest('build/'));
});

//run scripts through JSHint
gulp.task('jshint', () => [
    createJsHintTask('assets/js/'),
    createJsHintTask('content_scripts/js/')]);

//copy vendor scripts and uglify all other scripts, creating source maps
gulp.task('scripts', ['jshint'], () => [
    gulp.src(jsDependencies)
      .pipe(gulp.dest('build/js/vendors')),
    createScriptTask('assets/js/'),
    createScriptTask('content_scripts/js/')]);

//minify styles
gulp.task('styles', () => [
    createStyleTask('assets/css/'),
    createStyleTask('content_scripts/css/')]);

//build ditributable and sourcemaps after other tasks completed
gulp.task('zip', ['html', 'scripts', 'styles', 'copy'], () => {
  const manifest = require('./src/manifest'),
    distFileName = `${manifest.name} v${manifest.version}.zip`,
    mapFileName = manifest.name + ' v' + manifest.version + '-maps.zip';
  //build distributable extension
  return gulp.src(['build/**', '!build/js/**/*.map'])
    .pipe(zip(distFileName))
    .pipe(gulp.dest('dist'));
});

//run all tasks after build directory has been cleaned
gulp.task('default', ['clean'], () => {
    gulp.start('zip');
});