import gulp from "gulp";
import compileSass from "sass";
import gulpSass from "gulp-sass";
const sass = gulpSass(compileSass);
import autoprefixer from "gulp-autoprefixer";
import concat from "gulp-concat";
import browserSync from "browser-sync";
import babel from "gulp-babel";
import minify from "gulp-terser";
import imagemin, { gifsicle, mozjpeg, optipng, svgo } from "gulp-imagemin";
import del from "del";
import fileinclude from "gulp-file-include";
import sourcemaps from "gulp-sourcemaps";
import webpack from "webpack";
import webpackStream from "webpack-stream";
import clean from "gulp-clean-css";

// server
export const startServer = () => {
  browserSync.init({
    server: {
      baseDir: "app",
    },
  });
  compileInclude();
  sassToCss();
  scriptsDev();
};

// compile include HTML
export const compileInclude = () => {
  return gulp
    .src("app/html/*.html") // Следим за всеми html в папке "html" (именно в них прописан include)
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: "@file",
      })
    )
    .pipe(gulp.dest("app")) // результат компиляции выкладываем в app
    .pipe(browserSync.stream());
};

// compile sass to css
export const sassToCss = () => {
  return gulp
    .src("app/scss/main.scss")
    .pipe(sourcemaps.init({ loadMaps: true, largeFile: true }))
    .pipe(sass({ outputStyle: "compressed" }))
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 20 versions"],
        grid: "autoplace",
      })
    )
    .pipe(concat("main.min.css"))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("app/css"))
    .pipe(browserSync.stream());
};

// Скрипты для dev
export const scriptsDev = () => {
  return gulp
    .src("app/js/main.js")
    .pipe(
      webpackStream({
        mode: "none",
        plugins: [
          new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
          }),
        ],
        devtool: "eval-source-map",
      })
    )
    .pipe(babel())
    .pipe(minify())
    .pipe(concat("main.min.js"))
    .pipe(gulp.dest("app/js"))
    .pipe(browserSync.stream());
};

// Скрипты для prod
export const scriptsProd = () => {
  return gulp
    .src("app/js/main.js")
    .pipe(
      webpackStream({
        mode: "none",
        plugins: [
          new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
          }),
        ],
      })
    )
    .pipe(babel())
    .pipe(minify())
    .pipe(concat("main.min.js"))
    .pipe(gulp.dest("dist/js"));
};

// watching
export const watching = () => {
  gulp.watch(["app/scss/**/*.scss"], sassToCss);
  gulp.watch(["app/html/**/*.html"], compileInclude);
  gulp.watch(["app/js/**/*.js", "!app/js/main.min.js"], scriptsDev);
  gulp.watch(["app/**/*.html"]).on("change", browserSync.reload);
};

// delite dist
export const cleanDist = () => {
  return del("dist");
};

// images minify
export const images = () => {
  return gulp
    .src("app/images/**/*")
    .pipe(
      imagemin([
        gifsicle({ interlaced: true }),
        mozjpeg({ quality: 75, progressive: true }),
        optipng({ optimizationLevel: 5 }),
        svgo({
          plugins: [
            {
              name: "removeViewBox",
              active: true,
            },
            {
              name: "cleanupIDs",
              active: false,
            },
          ],
        }),
      ])
    )
    .pipe(gulp.dest("dist/images"));
};

// сlear css comments
export const clearCssComments = () => {
  return gulp
    .src("dist/css/*.css")
    .pipe(
      clean({
        level: 2,
      })
    )
    .pipe(gulp.dest("dist/css"));
};

// build
export const build = () => {
  return gulp
    .src(["app/css/main.min.css", "app/fonts/**/*", "app/*.html"], {
      base: "app",
    })
    .pipe(gulp.dest("dist"));
};

// start build creation
export const runBuild = gulp.series(
  cleanDist,
  build,
  images,
  clearCssComments,
  scriptsProd
);

// gulp default
export default gulp.parallel(startServer, watching);
