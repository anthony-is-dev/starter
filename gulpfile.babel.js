// рекомендуемые версии:
// npm версия - 8.12.2
// nodejs версия - 14.19.1

// старт => gulp
// создать билд => gulp runBuild

import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import compileSass from 'sass';
const sass = gulpSass(compileSass);
import gulpAutoprefixer from 'gulp-autoprefixer';
import gulpConcat from 'gulp-concat';
import browserSync from 'browser-sync';
import gulpHtmlMin from 'gulp-htmlmin';
import gulpImageMin, { gifsicle, mozjpeg, optipng, svgo } from 'gulp-imagemin';
import gulpFileInclude from 'gulp-file-include';
import gulpCleanCss from 'gulp-clean-css';
import gulpSourcemaps from 'gulp-sourcemaps';
import { deleteAsync } from 'del';
import webpack from 'webpack';
import gulpWebpack from 'webpack-stream';

// server
export const startServer = () => {
  browserSync.init({
    server: {
      baseDir: './app',
    },
    notify: false,
  });
};

// compile sass to css
export const sassToCss = () => {
  return gulp
    .src('app/scss/main.scss')
    .pipe(gulpSourcemaps.init({ loadMaps: true, largeFile: true }))
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(
      gulpAutoprefixer({
        overrideBrowserslist: ['last 50 versions'],
        grid: 'autoplace',
      })
    )
    .pipe(gulpConcat('main.min.css'))
    .pipe(gulpSourcemaps.write())
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.stream());
};

// compile include HTML
export const compileInclude = () => {
  return gulp
    .src('app/html/*.html') // Следим за всеми html в папке "html" (именно в них прописан include)
    .pipe(
      gulpFileInclude({
        prefix: '@@',
        basepath: '@file',
      })
    )
    .pipe(gulp.dest('app')) // результат компиляции выкладываем в app
    .pipe(browserSync.stream());
};

// Скрипты для development
export const scriptsDev = () => {
  return gulp
    .src('app/js/main.js')
    .pipe(
      gulpWebpack(
        {
          mode: 'development',
          devtool: 'eval-source-map',
          module: {
            rules: [
              {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                  loader: 'babel-loader',
                  options: {
                    presets: ['@babel/preset-env'],
                    // cacheDirectory: true,
                    // cacheCompression: false,
                  },
                },
              },
            ],
          },
          output: {
            environment: {
              arrowFunction: false,
            },
          },
        },
        webpack
      )
    )
    .pipe(gulpConcat('main.min.js'))
    .pipe(gulp.dest('app/js'))
    .pipe(browserSync.stream());
};

// Скрипты для production
export const scriptsProd = () => {
  return gulp
    .src('app/js/main.js')
    .pipe(
      gulpWebpack(
        {
          mode: 'production',
          devtool: false,
          module: {
            rules: [
              {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                  loader: 'babel-loader',
                  options: {
                    presets: ['@babel/preset-env'],
                    // cacheDirectory: true,
                    // cacheCompression: false,
                  },
                },
              },
            ],
          },
          output: {
            environment: {
              arrowFunction: false,
            },
          },
        },
        webpack
      )
    )
    .pipe(gulpConcat('main.min.js'))
    .pipe(gulp.dest('dist/js'));
};

// watching
export const watching = () => {
  gulp.watch(['app/scss/main.scss', 'app/scss/components/*.scss'], sassToCss);
  gulp.watch(['app/html/*.html', 'app/html/include/*.html'], compileInclude);
  gulp.watch(['app/js/main.js', 'app/js/components/*.js'], scriptsDev);
};

// clean dist
export const cleanDist = () => {
  return deleteAsync('dist');
};

// minify images
export const minifyImages = () => {
  return gulp
    .src('app/images/**/*')
    .pipe(
      gulpImageMin([
        gifsicle({ interlaced: true }),
        mozjpeg({ quality: 75, progressive: true }),
        optipng({ optimizationLevel: 5 }),
        svgo({
          plugins: [
            {
              name: 'removeViewBox',
              active: true,
            },
            {
              name: 'cleanupIDs',
              active: false,
            },
          ],
        }),
      ])
    )
    .pipe(gulp.dest('dist/images'));
};

// сlear css comments
export const clearCssComments = () => {
  return gulp
    .src('dist/css/main.min.css')
    .pipe(
      gulpCleanCss({
        level: 2,
      })
    )
    .pipe(gulp.dest('dist/css'));
};

// minify HTML
export const minifyHtml = () => {
  return gulp
    .src('dist/*.html')
    .pipe(
      gulpHtmlMin({
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
      })
    )
    .pipe(gulp.dest('dist'));
};

// build
export const build = () => {
  return gulp.src(['app/css/main.min.css', 'app/fonts/**/*', 'app/*.html'], { base: './app' }).pipe(gulp.dest('dist'));
};

// start build creation
export const runBuild = gulp.series(cleanDist, build, minifyImages, clearCssComments, minifyHtml, scriptsProd);

// gulp default
export default gulp.parallel(startServer, watching);
