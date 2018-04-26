const gulp = require('gulp');
const pug = require('gulp-pug');
const sass = require('gulp-sass');
const rename = require('gulp-rename');

const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const browserSync = require('browser-sync').create();

const gulpWebpack = require('gulp-webpack');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config.js');

const autoprefixer = require('gulp-autoprefixer');
const svgSprite = require('gulp-svg-sprites');
const svgmin = require('gulp-svgmin');
const cheerio = require('gulp-cheerio');

const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const imagemin = require('gulp-imagemin');
const normalize = require('node-normalize-scss');
const replace = require('gulp-replace');


const paths = {
    root: './build',

    pug: {
        pages: 'src/pug/pages/*.pug',
        src: 'src/pug/**/*.pug',
        dest: 'build/',
    },
    styles: {
        src: 'src/scss/**/*.scss',
        dest: 'build/css/',
    },    
    images: {
        src: 'src/img/{bg,content,icons}/*',
        dest: 'build/img/',
    },
    scripts: {
        src: 'src/js/**/*.js',
        dest: 'build/js/',
    },
    fonts: {
        src: 'src/fonts/**/*.*',
        dest: 'build/fonts/',
    },
    svg: {
        src: 'src/img/icons/*.svg',
        dest: 'build/img',
    }
}

// pug
function templates() {
    return gulp.src(paths.pug.pages)
        .pipe(plumber())
        .pipe(pug({ pretty: '\t' }))
//      .pipe(notify('Template success'))
        .pipe(plumber.stop())
        .pipe(gulp.dest(paths.pug.dest));
}

// scss
function scss() {
    return gulp.src('./src/scss/main.scss')
        .pipe(plumber())
        .pipe(sass({ includePaths: normalize.includePaths }))
        .pipe(sourcemaps.write())
        .pipe(autoprefixer())
        .pipe(sourcemaps.init())
        .pipe(rename({ suffix: '.min' }))
//      .pipe(notify('Style success'))
        .pipe(plumber.stop())
        .pipe(gulp.dest(paths.styles.dest));
}

// clean
function clean() {
    return del(paths.root);
}

// webpack
function scripts() {
    return gulp.src('src/js/main.js')
        .pipe(gulpWebpack(webpackConfig, webpack)) 
        .pipe(gulp.dest(paths.scripts.dest));
}

// галповский вотчер
function watch() {
	gulp.watch(paths.pug.src, templates);    
	gulp.watch(paths.styles.src, scss);
    gulp.watch(paths.scripts.src, scripts);
    gulp.watch(paths.images.src, imgMin);    
    gulp.watch(paths.fonts.src, fonts);        
}

// локальный сервер + livereload (встроенный)
function server() {
    browserSync.init({
        server: paths.root
    });
    browserSync.watch(paths.root + '/**/*.*', browserSync.reload);
}

// img
function imgMin() {
    return gulp.src(paths.images.src)
        .pipe(plumber())
//        .pipe(imagemin())
//        .pipe(notify('Image success'))
        .pipe(plumber.stop())
        .pipe(gulp.dest(paths.images.dest));
}

//  svg
function sprites() {
    return gulp.src('src/img/svg/*.svg')
        .pipe(plumber())    
        .pipe(svgmin({
            js2svg: {
                pretty: true
            }
        }))
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[style]').removeAttr('style');
            },
            parserOptions: { xmlMode: false },
        }))
        .pipe(replace('&gt;', '>'))
        .pipe(svgSprite({ 
            mode: 'symbols',
            preview: false,
         }))
        .pipe(gulp.dest('src/img/'))        
        .pipe(rename({ 
            basename: 'sprite',
            suffix: '.min',
        }))
//      .pipe(notify('Create sprite svg success'))
        .pipe(plumber.stop())
        .pipe(gulp.dest('build/img/'));
}

// переносим картинки
function images() {
    return gulp.src(paths.img.src)
        .pipe(gulp.dest(paths.img.dest));
}

// переносим шрифты
function fonts() {
    return gulp.src(paths.fonts.src)
//      .pipe(notify('Fonts success'))
        .pipe(gulp.dest(paths.fonts.dest))
}


// exports
exports.sprites = sprites;
exports.templates = templates;
exports.scss = scss;
exports.scripts = scripts;
exports.imgMin = imgMin;
exports.clean = clean;
exports.watch = watch;

gulp.task('default', gulp.series(
    clean,
    sprites,
    gulp.parallel(templates, scss, scripts, imgMin, fonts),
	gulp.parallel(watch, server)
));
