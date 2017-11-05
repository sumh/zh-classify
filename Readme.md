# zh-classify 中文文本分类
基于Node的中文文本分类器，内置中文情感分析模型，使用`nodejieba`分词

## Features

- [x] 基于Bayes的中文情感分析
- [x] 基于Bayes的中文文本分类（多分类）

## Install
`Node > 7.6`

```
npm install zh-classify
```

## Guide
### Bayes 中文情感分析
默认会加载一个中文情感极性分析的模型，使用**购物**，**外卖**，**酒店评价**，**微博**语料
正负语料比例`31197/32555`

```js
const Bayes = require('./zh-classify').Bayes;

// 实例
const sentiment = new Bayes();

console.log(sentiment.clf('这个天气也太差了'));
// { neg: 0.9731274375543317, pos: 0.026872562445668324 }
```


### Bayes 中文文本分类
**训练模型**

将分类文件放入一个分类文件夹(dirName)中
将每个**类别**的语料一个单独的`txt`文件，文件名会成为**类别名**
所以模型的**分类数量**和取决于文件的数量，例如下图会生成一个**9**分类的模型
![](http://oscjtyo0x.bkt.clouddn.com/15098981853140.jpg)


每个类别文件内部**每篇内容**单独一行，`utf-8`编码
![](http://oscjtyo0x.bkt.clouddn.com/15098972125243.jpg)

会在语料文件夹下生成`dirName-model-bayes.json`的模型文件

```js
const Bayes = require('./zh-classify').Bayes;

// 实例
const bayes = new Bayes();

// 训练模型
bayes.train('./cropus/news');


// 创建模型成功,路径:./cropus/news/news-model-bayes.json
// 耗时97秒
```

**使用模型**
创建分类器实例时调用模型路径，使用分类器

```js
const Bayes = require('./zh-classify').Bayes;

// 实例
const bayes = new Bayes('./cropus/news/news-model-bayes.json');

console.log(bayes.clf('好像有点感冒，我得吃点药了'));

// { '体育': 0.00032818303607162817,
//   '军事': 0.000012199216160954406,
//   '医疗': 0.9995621094898073,
//   '政治': 0.0000016534488152032236,
//   '教育': 0.00000541675514383486,
//   '环境': 0.00007680840939844948,
//   '经济': 0.000002647388656538752,
//   '艺术': 0.000010726221785414526,
//   '计算机': 2.5603416048904845e-7 }
```

## Test
### 速度
与`python` **SnowNLP**情感分析相同大小语料库进行对比

```js
const Bayes = require('./zh-classify').Bayes;

// 实例
const sentiment = new Bayes();


//执行10000次时间
let now = new Date();
for(let i=0;i<10000;i++){
    sentiment.clf('今天天气不好');
}


console.log(new Date().valueOf() - now.valueOf());
// 4868
```
大概4-5倍速度快于`Python`

```py
from snownlp import SnowNLP
from datetime import datetime as date

sent = u'今天天气不好'

s = SnowNLP(sent)

# 测试10000耗时
now = date.now()
for i in range(10000):
    s.sentiments

print date.now() - now
# 0:00:15.238370
```

## 联系
sumh1985@gmail.com


