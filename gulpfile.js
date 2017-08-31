const gulp = require("gulp"),
    eslint = require("gulp-eslint"),
    jshint = require("gulp-jshint"),
    nodemon = require("gulp-nodemon"),
    refresh = require("gulp-refresh"),
    runSequence = require("run-sequence");;

const sourceDir = "./src";
const testDir = "./test";

gulp.task("jshint", function () {
    return gulp.src([sourceDir+"/*.js", sourceDir+"/**/*.js"])
        .pipe(jshint())
        .pipe(jshint.reporter("default"));
});

gulp.task("lint", function () {
    return gulp.src([sourceDir+"/*.js", sourceDir+"/**/*.js"])
        .pipe(eslint())
        .pipe(eslint.format());
});

gulp.task("livereload", function () {
    nodemon({
        script: sourceDir/+"server.js",
        stdout: true
    });
});

gulp.task("watch", function() {
    refresh.listen();
    gulp.watch([sourceDir+"/*.js", sourceDir+"/**/*.js"], ["jshint", "lint"]).on('change', refresh.changed);
});

gulp.task("dev", function() {
    runSequence(
        ["jshint"],
        ["lint"],
        ["livereload"],
        ["watch"]
    );
});