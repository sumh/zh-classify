/*
* @Author: SumH
* @Date:   2017-10-26 13:07:32
* @Last Modified by:   SumH
* @Last Modified time: 2017-11-05 16:39:42
*/
const fs = require('fs');
const readline =require('readline');
const path = require('path');
const utils = require('./utils');


// 读取文件的每行并且返回数组
exports.readLine = async(fileName)=>{

    // 返回Promise
    return new Promise(resolve=>{

        // 结果数组
        let result =[];

        // 选项
        const options = {encoding:'utf-8',flag:'r'};

        // 创建Stream对象
        let rl = readline.createInterface({
            input: fs.createReadStream(fileName,options),
            terminal: false,
        });

        // 读行
        rl.on('line', line=>{
            // 将句子推入数组
            result.push(line.trim());
        });

        // 文件读取结束
        rl.on('close',()=>{
            resolve(result);
        });

    });

};


// 读取文件夹内的文件列表，并且提取分类标签
exports.loadFile = async(fileDir)=>{

    // 文件列表，路径，标签
    let fileList = fs.readdirSync(fileDir).filter(file => file.includes('.txt'));
    let filePath = fileList.map(i =>path.join(fileDir,i));
    let labels = fileList.map(i => i.replace('.txt',''));

    // 读取文件
    let readFiles = filePath.map(file=>utils.readLine(file));

    // 并发读取
    let docs = await Promise.all(readFiles);

    // 返回结果
    return Promise.resolve({labels,docs});

};

