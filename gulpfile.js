const gulp = require('gulp'),
    terser = require('gulp-terser'),
    typescript = require('gulp-typescript'),
    rename = require('gulp-rename'),
    replace = require('gulp-replace');

const transpile = (target, module) => {
    const tsProject = typescript.createProject('tsconfig.json', { target, module });

    // First, we transpile back to JS.
    const tsResult = tsProject.src().pipe(tsProject());

    tsResult.dts.pipe(gulp.dest('src'));

    return tsResult.js.pipe(
      terser({
        output: {
          comments: '/^!/'
        }
      }));
};

/** Save plugin to be used with UMD pattern. */
const jsUMD = cb => {
    return transpile('es5', 'umd')
        .pipe(rename('dotdotdot.umd.js'))
        .pipe(gulp.dest('dist'));
};

/** Save plugin to be used as an ES6 module. */
const jsES6 = cb => {
    return transpile('es6', 'es6')
        .pipe(rename('dotdotdot.es6.js'))
        .pipe(gulp.dest('dist'));
};

/** Save plugin to be used with bundlers that support the pkg.module definition. */
const jsESM = cb => {
    return transpile('es5', 'es6')
        .pipe(rename('dotdotdot.esm.js'))
        .pipe(gulp.dest('dist'));
};

/** Save plugin to be used without UMD pattern or ES6 module. */
const js = cb => {
    return gulp
        .src('dist/dotdotdot.esm.js')
        .pipe(rename('dotdotdot.js'))
        .pipe(replace('export default Dotdotdot;', ''))
        .pipe(gulp.dest('dist'));
};

const build = gulp.parallel(jsUMD, gulp.series(jsESM, js), jsES6);

// Watch task 'gulp watch': Starts a watch on JS tasks
const watch = cb => {
    gulp.watch('src/*.ts', build);
    cb();
};
exports.default = build;
exports.watch = watch;
