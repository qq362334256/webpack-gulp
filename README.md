# webpack-gulp
这个示例讲诉了webpack联合gulp的构建任务
# 注意（特别注意，老司机告诉你这里容易发生事故）
找到工程目录下：node_modules\gulp-css-spriter-retina\lib\map-over-styles-and-transform-background-image-declarations.js 修改代码如下：

49行原始：if(transformedDeclaration.property === 'background-image') {
修改为：if(transformedDeclaration.property === 'background-image' && /.+\-sprite.+\.png/i.test(transformedDeclaration.value)) {

53行原始：else if(transformedDeclaration.property === 'background') {
修改为：else if(transformedDeclaration.property === 'background' && /.+\-sprite.+\.png/i.test(transformedDeclaration.value)) {
