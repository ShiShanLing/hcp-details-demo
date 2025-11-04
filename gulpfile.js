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

// 移除所有 console.log（更安全的正则，避免破坏语法）
gulp.task('removeConsoleLog', function() {
  return gulp.src(['./dist/browser/**/*.js'])
    .pipe(through.obj(function(file, encode, cb) {
      if (file.isNull()) {
        return cb(null, file);
      }
      
      if (file.isStream()) {
        return cb(new Error('Streaming not supported'));
      }
      
      let content = file.contents.toString('utf8');
      
      // 更安全的移除方式：移除整行 console 语句（包括前导空格和分号）
      // 匹配模式：可选空格 + console.xxx(...) + 可选分号 + 换行
      content = content.replace(/^\s*console\.(log|info|debug|warn|error|trace|dir|dirxml|table|trace|group|groupEnd|groupCollapsed|clear|count|countReset|assert|profile|profileEnd|time|timeLog|timeEnd|timeStamp|context|memory)\([^)]*\);\s*/gm, '');
      
      // 移除行内 console（需要更小心，避免破坏语法）
      // 只移除独立的 console 语句，保留可能作为函数参数的 console
      content = content.replace(/console\.(log|info|debug|warn|error|trace|dir|dirxml|table|trace|group|groupEnd|groupCollapsed|clear|count|countReset|assert|profile|profileEnd|time|timeLog|timeEnd|timeStamp|context|memory)\([^)]*\);/g, '');
      
      // 清理可能产生的多余逗号（修复常见的语法错误）
      // 移除对象或数组中的多余逗号
      content = content.replace(/,(\s*[}\]])/g, '$1'); // 移除对象/数组末尾的逗号
      content = content.replace(/([,\s]),+/g, '$1'); // 移除连续的逗号
      
      file.contents = Buffer.from(content, 'utf8');
      this.push(file);
      cb();
    }))
    .pipe(gulp.dest('./dist/browser'));
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

//默认执行函数（暂时禁用 removeConsoleLog，避免破坏代码结构）
gulp.task('default', gulp.series(/* 'removeConsoleLog', */ 'fileGzip', 'moveFile', 'moveImg', 'moveFont', 'renameFileName'));
