/*
* @Author: SumH
* @Date:   2017-10-26 10:34:56
* @Last Modified by:   SumH
* @Last Modified time: 2017-11-09 19:18:09
*/
const path = require('path');
const utils = require('./utils');
const jsonfile = require('jsonfile');
const nodejieba = require('nodejieba');

// 用户词典
nodejieba.load({
    userDict: path.join(__dirname,'../dicts/user.dict.utf8'),
});


// 计算每个类别的概率p(c)
let calcLabelProb = (data)=>{

    let result = {};

    // 文档总数
    let totalDocs = data.docs.map(docs=>docs.length).reduce((a,b)=>a+b);

    // 每个类别的概率
    let probs = data.docs.map(docs=>docs.length/totalDocs);

    // 将类别概率添加到结果
    for(let i in data.labels){
        result[data.labels[i]] = Math.log(probs[i]);
    }

    return result;

};


// 导出类
class Bayes {

    // 构造方法
    constructor(name){
        // 模型路径
        let modelPath;

        // 不指定使用默认
        if(!name){
            modelPath = path.join(__dirname,'../data/sentiment-model-bayes.json');
        }else{

            path.isAbsolute(name)
                ?modelPath = name
                :modelPath = path.join(process.cwd(),name);
        }

        this.model = jsonfile.readFileSync(modelPath);
    }

}


// 训练模型
Bayes.prototype.train = async function(fileDir,stopwordsPath){

    // 计时
    let now = new Date();

    // 结果
    let result = {};

    // 词汇表(Set 去重)
    let vocabList = new Set();

    // 加载文档{labels:[]，docs:[]}
    let docsData = await utils.loadFile(fileDir);

    // 分类别的概率P(l)
    result.labelProb = calcLabelProb(docsData);

    // 停用词表
    stopwordsPath = stopwordsPath? path.join(process.cwd(),stopwordsPath) : path.join(__dirname,'../dicts/stopwords.txt');
    let stopwords = await utils.readLine(stopwordsPath);
    result.stopwords = stopwords;

    // 临时保存分词后的文档
    result.tempDocs= {};

    // 遍历文档的每个分类
    for(let i in docsData.labels){

        // 每个分类分词后的文档
        result.tempDocs[docsData.labels[i]] = [];

        // 遍历每个分类下的每篇文档
        for(let doc of docsData.docs[i]){

            // 对文档进行分词及去除停用词
            let docSeg = nodejieba.cut(doc).filter(i => !stopwords.includes(i));

            // 将词放入词汇表
            docSeg.forEach(word => vocabList.add(word));

            // 将分词及去除停用词后的句子放入分类列表
            result.tempDocs[docsData.labels[i]].push(docSeg);

        }

    }

    // 将词汇表添加到结果
    result.vocabList = Array.from(vocabList);

    // 字典长度为N维
    const N = result.vocabList.length;

    // 遍历每个分类
    for(let label of docsData.labels){

        // 构建基数为1的数组
        result[label] = Array(N).fill(1);

        // 遍历每个文档
        for(let doc of result.tempDocs[label]){

            // 遍历每个词
            for(let word of doc){
                let index = result.vocabList.indexOf(word);
                result[label][index] += 1;
            }

        }

        // 每个类别下的词总数
        let totalWords = result.tempDocs[label].map(i=>i.length).reduce((a,b)=>a+b);

        // 结果
        result[label] = result[label].map(count=>Math.log(parseFloat(count/totalWords)));

    }

    // 删除分词后的句子
    delete result.tempDocs;

    // 写入模型
    let basename = path.basename(fileDir);
    let fileName = path.join(process.cwd(),fileDir,`${basename}-model-bayes.json`);
    jsonfile.writeFileSync(fileName,result)?console.log('创建模型失败'):console.log(`创建模型成功,路径:${fileName}`);

    // 耗时
    let timeConsuming = parseInt((new Date().valueOf() - now.valueOf())/1000);
    console.log(`耗时${timeConsuming}秒`);


};


// 分类
Bayes.prototype.clf = function(sent){

    // 分词及去除停用词
    let sentSeg = nodejieba.cut(sent).filter(i => !this.model.stopwords.includes(i));

    // 获取所有的分类
    let labels = Object.keys(this.model.labelProb);

    // 计算log(p(d|label)*p(label))
    let prob = {};

    // 遍历每个分类
    for(let label of labels){

        // 先获取之前计算过的log(P(label))
        let pSum = this.model.labelProb[label];

        // 遍历每个词,计算其概率log(p(w|label))
        for(let word of sentSeg){

            // 朴素贝叶斯，log(p(d|label)) = log(p(w1|label)) + log(p(w2|label))...
            if(this.model.vocabList.includes(word)){
                pSum += this.model[label][this.model.vocabList.indexOf(word)];
            }


        }
        // 每个类别的log(p(d|label)*p(label))
        prob[label] = pSum;

    }

    // 结果
    let result = {};

    // 遍历每个分类
    for(let label of labels){
        // 初始化概率，对于某一类的最终概率为p = p（l1|d）/(p(l1|d) + p(l2|d)....)
        let pFinal = 0;
        for (let l of labels){
            pFinal += 1/(Math.exp(prob[label] - prob[l]));
        }

        result[label] = 1/pFinal;
    }

    return result;

};


module.exports = Bayes;