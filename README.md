# webpack-gulp
这个示例讲诉了webpack联合gulp的构建任务


## 注意（特别注意，老司机告诉你这里容易发生事故）
找到工程目录下：node_modules\gulp-css-spriter-retina\lib\map-over-styles-and-transform-background-image-declarations.js 修改代码如下：

`[49行]`
```javascript
  // 原始：
  if(transformedDeclaration.property === 'background-image') {
  // 修改：
  if(transformedDeclaration.property === 'background-image' && /.+\-sprite.+\.png/i.test(transformedDeclaration.value)) {
```

`[53行]`
```javascript
  // 原始：
  else if(transformedDeclaration.property === 'background') {
  // 修改
  else if(transformedDeclaration.property === 'background' && /.+\-sprite.+\.png/i.test(transformedDeclaration.value)) {
```


## 工程结构

```
├── src                  // 开发目录
        ├── common       // 公共模块
            ├── config   // 配置文件目录
            ├── js       // js文件目录
            ├── css      // css文件目录
            ├── ...      // 其他文件目录
            └── entry.js // common模块入口，这是模块入口命名规范，不能随意改变
        ├── index        // index模块
            ├── config   // 配置文件目录
            ├── js       // js文件目录
            ├── css      // css文件目录
            ├── images   // iamges文件目录
            ├── view     // html文件目录
            ├── ...      // 其他文件目录
            ├── entry.js // index模块入口，这是模块入口命名规范，不能随意改变
├── dev                  // 测试打包文件目录
├── static               // 生产打包文件目录
├── gulpfile.js          // gulp构建配置
├── package.json
```
