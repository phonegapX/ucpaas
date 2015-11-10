var gulp = require('gulp');
var jshint = require('gulp-jshint');
var notify = require('gulp-notify');

gulp.task('scripts', function() {
    return gulp.src(['./*.js', './lib/*.js'])
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(notify({ message: 'Scripts task complete' }));
});

gulp.task('clean', function() {
    //return gulp.src(['dist/scripts'], {read: false}).pipe(clean());
});

gulp.task('default', ['clean'], function() {
    gulp.start('scripts');
});
