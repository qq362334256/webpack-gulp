/**
 * Created by Administrator on 2016/11/10 0021.
 */
'use strict';

// 依赖模块
let fs = require('fs'),                                         // 文件操作模块
    path = require('path'),                                     // 路径操作模块
    gulp = require('gulp'),                                     // gulp模块
    gutil = require('gulp-util'),                               // 功能集插件模块
    gclean = require('gulp-clean'),                             // 删除文件插件模块
    colors = require('colors'),                                 // 颜色log插件模块
    gsprite = require('gulp-css-spriter-retina'),               // 雪碧图插件模块
    grename = require('gulp-rename'),                           // 重命名插件模块
    guglify = require('gulp-uglify'),                           // js压缩插件模块
    webpack = require('webpack'),                               // webpack模块
    gcleancss =  require('gulp-clean-css'),                     // 压缩css插件模块
    browsersync = require('browser-sync'),                      // 启动一个测试服务插件模块
    autoprefixer = require('autoprefixer'),                     // webpackcss添加私有后缀插件模块
    htmlWebpackPlugin = require('html-webpack-plugin'),         // webpack生成html插件模块
    extractTextPlugin = require('extract-text-webpack-plugin'), // webpack剥离css插件模块

    // 声明变量
    config, devServer, reloadServer,
    _getDevServerConfig, _getDirFile, _getEntry, _getOutput, _getLoader, _getPlugins, _getPostcss, _getResolve, _getWebpackConfig;


/**
 * 《任务集合》
 * ----------
 * - clean:dev       —— 清除测试资源目录任务
 * - webpack:dev     —— 测试编译任务
 * - server:dev      —— 测试服务环境任务
 * - dev             —— 测试环境任务
 * - clean:pro       —— 清除生产资源目录任务
 * - sprite-css:pro  —— 合并精灵图-css编译任务
 * - js-pro          —— js压缩任务
 * - pro             —— 生产环境任务
 * ----------
 */

/**
 * 《构建配置入口》
 * ----------
 * - path: {      —— <路径配置>
 * -    context   —— 上下文环境
 * -    entryPath —— 编写文件入口目录
 * -    devOutput —— 测试环境出口目录
 * -    proOutput —— 生产环境出口目录
 * - },
 * - server: {    —— <测试服务配置>
 * -    host      —— 域名
 * -    port      —— 端口
 * - },
 * - module       —— 模块入口名称，common为公共模块加载模块不包含view目录
 * - globalModule —— 挂在全局公共模块，可用id引用(必须是src目录下的)
 * - imgLimit     —— 编译base64大小，kb为单位
 * ----------
 */
config = {
    path: {
        context: __dirname,
        entryPath: './src',
        devOutput: './dev',
        proOutput: './static',
    },
    server: {
        host: 'http://127.0.0.1',
        port: 5001
    },
    module: ['common', 'index', 'about'],
    globalModule: {
        'CONSTANT': 'common/config/constant.config.js' // 全局常量模块
    },
    imgLimit: 1024 * 1,
};

/**
 * 《配置控制台输出颜色》
 * ----------
 * - error —— 错误颜色
 * - success —— 成功颜色
 * ----------
 */
colors.setTheme({
    error: 'red',
    success: 'green'
});

/**
 * 《获取entry配置对象》
 * 参数:
 *      -
 * 返回值:
 *      webpack.entry 入口配置对象集合
 */
_getEntry = () => {
    let entry = {};

    // 遍历多模块入口文件
    config.module.forEach((val) => {
        entry[val] = `${config.path.entryPath}/${val}/entry.js`;
    });

    return entry;
};

/**
 * 《获取output配置对象》
 * 参数：
 *      -
 * 返回值：
 *      webpack.output 出口配置参数对象
 */
_getOutput = () => ({
    path: config.path.devOutput,                     // 生成文件出口
    filename: 'js/[name].bundle.js',                 // 生成文件名
    //publicPath: `${config.server.host}/${config.server.port}` // 加载文件的域名地址
});

/**
 * 《获取loader配置对象》
 * 参数：
 *      -
 * 返回值：
 *      webpack.loader 加载器配置集合
 */
_getLoader = () => [
    { test: /\.less$/, loader: extractTextPlugin.extract('style', 'css-loader!postcss-loader!less-loader', { publicPath: '../' }) }, // less加载器
    { test: /\.(svg|ttf|eot|woff|woff2)$/, loader: 'file-loader?name=font/[name].[ext]' },                                           // 字体文件加载器
    { test: /\.(png|jpg|gif|jpeg)$/, loader: `url-loader?limit=${config.imgLimit}&name=images/[name].[ext]` }                        // 图片文件加载器
];

/**
 * 《获取plugins配置对象》
 * 参数：
 *      -
 * 返回值：
 *      webpack.plugins 配置对象集合
 */
_getPlugins = () => {
    let pluginS = [],
        hasCommon = false,
        htmlUrlS = [];

    // 剔除common公共加载模块生成html
    config.module.forEach((val) => {
        if (val === 'common') {
            hasCommon = true;
        } else {
            htmlUrlS.push(val);
        };
    });

    // 多路口html插件配置
    htmlUrlS.forEach((val) => {
        pluginS.push(new htmlWebpackPlugin({
            cache: true,                                                  // 是否开启缓存监听修改
            chunks: hasCommon ? ['common', val] : [val],                  // 加载资源目录
            filename: `view/${val}.tem.html`,                             // 生成文件的名称
            template: `${config.path.entryPath}/${val}/view/${val}.html`, // 载入模板文件的路径
            showErrors: true,                                             // 是否在生成的文件里面输出错误
            //minify: {                                                   // 压缩HTML文件
            //removeComments: true,                                       // 移除HTML中的注释
            //collapseWhitespace: true                                    // 删除空白符与换行符
            //}
        }));
    });

    // 剥离css插件
    pluginS.push(new extractTextPlugin('css/[name].bundle.css'));
    // 剥离公共js插件
    pluginS.push(new webpack.optimize.CommonsChunkPlugin('common', 'js/[name].bundle.js'));

    return pluginS;
};

/**
 * 《获取postcss配置集合》
 * 参数：
 *      -
 * 返回值：
 *      webpack.postcss 配置集合
 */
_getPostcss = () => {
    let configS = [];

    // 自动添加游览器厂商前缀
    // configS.push(autoprefixer());
    configS.push(autoprefixer({ browsers: ['last 2 versions', 'ie >= 9', '> 5% in CN'] }));

    return configS;
};

/**
 * 《获取resolve配置对象》
 * 参数：
 *      -
 * 返回值：
 *      webpack.resolve 配置对象
 */
_getResolve = () => {
    let alias = {};

    // 循环处理全局别名模块数组
    for (let item in config.globalModule) {
        alias[item] = `${__dirname}/src/${config.globalModule[item]}`;
    };

    // 返回resolve 配置对象
    return {
        alias: alias,                                   // 全局别名模块
        fallback: path.join(__dirname, 'node_modules')  // 找不到模块的解决方案
    };
};

/**
 * 《获取webpack完整对象》
 * 参数：
 *      -
 * 返回值：
 *      webpack 配置对象
 */
_getWebpackConfig = () => ({
    watch: true,                                                      // 是否启动监听变幻
    cache: true,                                                      // 是否启用缓存功能
    entry: _getEntry(),                                               // webpack的打包入口配置
    output: _getOutput(),                                             // webpack的打包出口配置
    module: { loaders: _getLoader() },                                // webpack的加载器集合
    context: config.path.context,                                     // webpack的上下文环境
    plugins: _getPlugins(),                                           // webpack打包插件集合
    postcss: _getPostcss(),                                           // 自动添加游览器私有前缀
    resolve: _getResolve(),                                           // 全局配置
    resolveLoader: { fallback: path.join(__dirname, 'node_modules') } // 找不到模块的解决方案
});

/**
 * 《getDevServerConfig 获取测试服务配置对象》
 * 参数：
 *      -
 * 返回值：
 *      devServer 服务配置对象
 */
_getDevServerConfig = () => {
    let devOutput = config.path.devOutput,
        routes = {},
        defaultEntry, spareEntry, defaultIndex;

    // 遍历模块入口 及 路由配置信息
    config.module.forEach((val) => {
        if (val === 'index') defaultEntry = 'index';

        if (val !== 'common') {
            spareEntry = val;
            routes[`/${val}`] = `/view/${val}.tem.html`;
        };
    });
    // 判断默认路口path
    defaultIndex = defaultEntry ? defaultEntry : spareEntry;

    // 返回测试服务配置对象
    return {
        ui: false,                                   // 是否启动ui服务
        host: config.server.host,                    // 静态服务ip地址
        port: config.server.port,                    // 静态服务端口号
        server: {                                    // 静态服务器配置
            baseDir: config.path.devOutput,          // 服务器映射静态资源目录
            index: `/view/${defaultIndex}.tem.html`, // 初始打开的网页path
            routes: routes                           // 服务器路由配置
        },
        logPrefix: 'dev-server-update',              // 控制台输出前缀
        reloadDelay: 100                             // 延迟刷新毫秒
    };
};

/**
 * 《getDirFile 获取路径和文件名》
 * 参数：
 *      type(string) - 选择的类型，可选'css' / 'js'，默认为 'css'
 *      callback(function) - 成功的回调函数，回调参数：path-文件路径；filename-文件名
 * 返回值：
 *      -
 */
_getDirFile = (type = 'css', callback = () => {}) => {
    let dir = `${config.path.devOutput}/${type}`,
        index = 0,
        filename;

    // 读取所有指定类型下的测试文件
    fs.readdir(dir, (err, files) => {
        if (err) {
            console.log(`[${type}:pro] ${err.toString()}`.error);
        } else {
            // 遍历单个文件进行精灵图提取
            files.forEach((val) => {
                filename = path.basename(val, `.bundle.${type}`);
                index++;

                // 执行回调
                callback(`${dir}/${val}`, filename);

                // 判断回调是否执行完毕
                if (index === files.length) console.log(`[${type}:pro] ----- success -----`.success);
            });
        };
    });
};

/**
 * 《clean:dev 清除测试资源目录任务》
 * 命令：
 *      gulp clean:dev
 */
gulp.task('clean:dev', () => {
    return gulp.src(config.path.devOutput, {read: false})
               .pipe(gclean());
});

/**
 * 《webpack:dev 测试编译任务》
 * 命令：
 *      gulp webpack:dev
 */
gulp.task('webpack:dev', ['clean:dev'], () => {
    // 配置webpack编译
    return webpack(_getWebpackConfig(), (err, stats) => {
        // webpack 错误时及时报错
        if (err) throw new gutil.PluginError('webpack:build', err);

        // webpack 编译时输出
        gutil.log('[webpack:build]', stats.toString({
            hash: false,
            cached: false,
            chunks: false,
            colors: true,
            source: false,
            timings: true,
            modules: false,
            version: false,
            reasons: false,
            children: false,
            errorDetails: false,
            cachedAssets: false,
            chunkModules: false,
        }));

        // 刷新游览器
        reloadServer();
    });
});

/**
 * 《server:dev 测试服务环境任务》
 * 命令：
 *      gulp server:dev
 */
gulp.task('server:dev', () => {
    devServer = browsersync.create('devServer');
    reloadServer = devServer.reload;

    // 初始化服务
    devServer.init(_getDevServerConfig());
});

/**
 * 《dev 测试环境任务》
 * 命令：
 *      gulp dev
 */
gulp.task('dev', ['server:dev', 'webpack:dev']);

/**
 * 《clean:pro 清除生产资源目录任务》
 * 命令：
 *      gulp clean:pro
 */
gulp.task('clean:pro', () => {
    return gulp.src(config.path.proOutput, {read: false})
               .pipe(gclean());
});

/**
 * 《sprite-css:pro 合并精灵图-css编译任务》
 * 命令：
 *      gulp sprite-css:pro
 */
gulp.task('sprite-css:pro', ['clean:pro'], () => {
    _getDirFile('css', (path, filename) => {
        gulp.src(path)
            .pipe(gsprite({ // 合并精灵图
                spriteSheet: `${config.path.proOutput}/images/${filename}-sprite.png`, // 输出的精灵图路径和文件名
                pathToSpriteSheetFromCSS: `../images/${filename}-sprite.png`           // css载入精灵图的background-url的路径名
            }))
            .pipe(gcleancss({ // 压缩等操作css
                compatibility: '*',         // 兼容ie9+
                keepSpecialComments: '*',   // 保持游览器私有前缀
            }))
            .pipe(grename(`${filename}.min.css`)) // css重命名
            .pipe(gulp.dest(`${config.path.proOutput}/css`));
    });
});

/**
 * 《js-pro js压缩任务》
 * 命令：
 *      gulp js-pro
 */
gulp.task('js-pro', ['clean:pro'], () => {
    _getDirFile('js', (path, filename) => {
        gulp.src(path)
            .pipe(guglify())
            .pipe(grename(`${filename}.min.js`))
            .pipe(gulp.dest(`${config.path.proOutput}/js`));
    });
});

/**
 * 《pro 生产环境任务》
 * 命令：
 *      gulp pro
 */
gulp.task('pro', ['sprite-css:pro', 'js-pro']);