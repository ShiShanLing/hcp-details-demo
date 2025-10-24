// 引入 gulp 及 依赖
let gulp = require('gulp');
let gzip = require('gulp-gzip');
let rename = require('gulp-rename');
let del = require('del');
const fs = require('fs');
const crypto = require('crypto');
const replace = require('gulp-replace');  // 确保先安装这个模块
// 文件流
let through = require('through2');

// 变量
var htmlName = 'index.html';
var cdnStaticUrl = '/static/WebCore/';



// // 修改 ./dist/styles.*.css
// gulp.task('modifiStyles', function () {
//   return gulp.src('./dist/styles.*.css')
//     .pipe(through.obj(function (file, encode, cb) {
//       let result = file.contents.toString();
//       let dataText = result.replace(/\/assets\/img\//g, `${cdnStaticUrl}assets/img/`);
//       file.contents = new Buffer.from(dataText);
//       this.push(file);
//       cb()
//     }))
//     .pipe(gulp.dest('./dist/'))
// });

// 添加生成哈希值的函数
function generateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex').slice(0, 8); // 取前8位作为哈希值
}


//修改iconfont.css  
// gulp.task('hashIconfont', function(done) {
//   // 生成哈希值
//   const iconFontPath = './dist/assets/font/iconfont/iconfont.css';
//   const hash = generateFileHash(iconFontPath);  

//   gulp.src(iconFontPath)
//   .pipe(rename(function(path) {
//     path.basename = `iconfont.${hash}`; // 新文件名: iconfont.{hash}.css
//   }))
//   .pipe(gulp.dest('./dist/assets/font/iconfont/'));
//   // 修改 index-build.html 中的引用
// return gulp.src('./dist/index.html')
//   .pipe(replace(
//     /<link href="\/static\/WebCore\/assets\/font\/iconfont\/iconfont.css" rel="stylesheet">/,
//     `<link href="/static/WebCore/assets/font/iconfont/iconfont.${hash}.css" rel="stylesheet">`
//   ))
//   .pipe(gulp.dest('./dist'));
// });

// // 复制 mock 文件夹到 dist
// gulp.task('copyMock', function() {
//   return gulp.src(['./src/assets/mock/**/*'])
//     .pipe(gulp.dest('./dist/assets/mock/'));
// });

// 清除文件重新打包
gulp.task('clean', function (cb) {
  return del(['./dist-gzip']).then(() => cb());
});

// gzip 压缩文件
gulp.task('fileGzip', function() {
  return gulp.src(['./dist/browser/**/*.css', './dist/browser/**/*.js', './dist/browser/**/*.json'])
    .pipe(gzip())
    .pipe(gulp.dest('./dist-gzip'));
});

// 其它文件 移动到 gzip
gulp.task('moveFile', function() {
  return gulp.src(['./dist/browser/*.html', './dist/browser/*.ico'])
    .pipe(gulp.dest('./dist-gzip/'));
});

// 图片移动到 gzip
gulp.task('moveImg', function() {
  return gulp.src(['./dist/browser/assets/img/*'])
    .pipe(gulp.dest('./dist-gzip/assets/img/'));
});

// 字体移动到 gzip
gulp.task('moveFont', function() {
  return gulp.src(['./dist/browser/assets/font/**/*', '!./dist/browser/assets/**/*.css'])
    .pipe(gulp.dest('./dist-gzip/assets/font/'))
});

// 去除 gzip 文件后缀
gulp.task('renameFileName', function() {
  return gulp.src(['./dist-gzip/**/*.gz'])
    .pipe(rename(function (path) {
      path.extname = '';
    }))
    .pipe(gulp.dest('./dist-gzip'));
});

// 打包之后清空 file 文件夹
gulp.task('clean_file', function (cb) {
  try {
    del(['./dist-gzip/**/*.gz']).then(() => {
      console.log('恭喜，操作完成！！！');
      cb();
    }).catch((err) => {
      console.log('清理文件时出错:', err);
      cb();
    });
  } catch (err) {
    console.log('del 函数调用出错:', err);
    cb();
  }
});

//默认执行函数
gulp.task('default', gulp.series( 'fileGzip', 'moveFile', 'moveImg', 'moveFont', 'renameFileName'));
