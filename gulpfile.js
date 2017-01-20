/* eslint arrow-body-style: "off" */

const browserSync = require('browser-sync');
const del = require('del');
const gulp = require('gulp');

// This will put all "gulp-*" packages into $
const $ = require('gulp-load-plugins')({
  DEBUG: process.env.DEBUG,
});

const config = Object.freeze({
  clean: ['dist'],
  js: {
    entry: 'js/main.js',
    src: 'js/**/*.js',
    out: 'dist/js/',
  },
  sass: {
    src: 'sass/**/*.sass',
    out: 'dist/css/',
  },
});

gulp.task('clean', () => {
  config.clean.map(path => del(path));
});

gulp.task('lint', () => {
  return gulp.src(['**/*.js', '!node_modules/**', '!dist/**'])
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failAfterError());
});

gulp.task('js:dev', ['lint'], () => {
  return gulp.src(config.js.src)
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(config.js.out));
});

gulp.task('sass:dev', () => {
  return gulp.src(config.sass.src)
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.autoprefixer())
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(config.sass.out))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('build:dev', ['lint', 'js:dev', 'sass:dev'], () => {});

// This ensures browsersync and nodemon play nice
const BROWSER_SYNC_RELOAD_DELAY = 500;

gulp.task('nodemon', ['build:dev'], (cb) => {
  let called = false;
  return $.nodemon({
    // Script that starts the node server
    script: 'app.js',
    // Watch/ignore core server files that require server restart on change
    watch: ['**/*.js'],
    ignore: ['gulpfile.js', 'node_modules/', 'js/**'],
  }).on('start', () => {
    // Ensure initial startup is only invoked once
    if (!called) { cb(); }
    called = true;
  }).on('restart', () => {
    // Reload connected browsers after a slight delay
    setTimeout(() => {
      browserSync.reload({
        stream: false,
      });
    }, BROWSER_SYNC_RELOAD_DELAY);
  });
});

gulp.task('browser-sync', ['nodemon'], () => {
  // More config options at http://www.browsersync.io/docs/options/
  browserSync({
    // Address where the app would run without browsersync
    proxy: 'http://localhost:3000',
    // Port to forward information to (must be different from above)
    port: 5000,
    // Set this to true if you want to know if browser-sync is working
    notify: false,
    // What browsers to open on startup (can be multiple)
    browser: ['chromium'],
  });
});

gulp.task('bs-reload-js', ['js:dev'], () => {
  browserSync.reload();
});

gulp.task('serve', ['browser-sync'], () => {
  gulp.watch('js/**/*.js', ['bs-reload-js']);
  gulp.watch('sass/**/*.sass', ['sass:dev']);
});

gulp.task('default', ['serve'], () => {
});
