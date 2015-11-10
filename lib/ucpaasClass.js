/**
 * Created by zmx on 2015/11/9.
 */

(function () {

    var Buffer = require('buffer').Buffer;

    /**
     *  云之讯REST API版本号。当前版本号为：2014-06-30
     */
    var SoftVersion = '2014-06-30';

    /**
     * API请求地址
     */
    var BaseUrl = 'https://api.ucpaas.com/';

    /**
     * @var string
     * 开发者账号ID。由32个英文字母和阿拉伯数字组成的开发者账号唯一标识符。
     */
    var accountSid;

    /**
     * @var string
     * 开发者账号TOKEN
     */
    var token;

    /**
     * @var string
     * 时间戳
     */
    var timestamp;

    Date.prototype.format = function(format) {
        var date = {
            "M+": this.getMonth() + 1,
            "d+": this.getDate(),
            "h+": this.getHours(),
            "m+": this.getMinutes(),
            "s+": this.getSeconds(),
            "q+": Math.floor((this.getMonth() + 3) / 3),
            "S+": this.getMilliseconds()
        };
        if (/(y+)/i.test(format)) {
            format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
        }
        for (var k in date) {
            if (new RegExp('(' + k + ')').test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? date[k] : ('00' + date[k]).substr(('' + date[k]).length));
            }
        }
        return format;
    };

    /**
     * 构造函数！！！
     *
     * @param {Object} options 对象参数必填
     * @return {void} 没有返回
     */
    function Ucpaas(options) {
        accountSid = options.accountsid;
        token = options.token;
        timestamp = new Date().format('yyyyMMddhhmmss');
    }

    /**
     * 包头验证信息
     *
     * @return {String} 包头验证信息,使用Base64编码（账户Id:时间戳）
     */
    function getAuthorization() {
        var s = accountSid + ":" + timestamp;
        return new Buffer(s).toString('base64').trim();
    }

    function md5(content) {
        var crypto = require('crypto');
        var m = crypto.createHash('md5');
        m.update(content);
        return m.digest('hex');
    }

    /**
     * 验证参数
     *
     * @return {String} 验证参数,URL后必须带有sig参数，sig= MD5（账户Id + 账户授权令牌 + 时间戳，共32位）(注:转成大写)
     */
    function getSigParameter() {
        var sig = accountSid + token + timestamp;
        return md5(sig).toUpperCase();
    }

    /**
     * 通讯，并且获取结果
     *
     * @param {String} url API地址
     * @param {String} body post数据
     * @param {String} method POST或GET
     * @param {Function} cb 回调函数
     * @return {void} 没有返回
     */
    function getResult(url, body, method, cb) {
        var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (cb) {
                    cb(this.status, this.responseText);
                }
            }
        };
        xhr.open(method, url);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Content-Type', 'application/json;charset=utf-8');
        xhr.setRequestHeader('Authorization', getAuthorization());
        xhr.send(body);
    }

    /**
     * 开发者账号信息查询
     *
     * @param {Function} cb 回调函数
     * @return {void} 没有返回
     */
    Ucpaas.prototype.getDevinfo = function(cb) {
        var url = BaseUrl + SoftVersion + '/Accounts/' + accountSid + '?sig=' + getSigParameter();
        getResult(url, null, 'GET', cb);
    };

    /**
     * 语音验证码,云之讯融合通讯开放平台收到请求后，向对象电话终端发起呼叫，接通电话后将播放指定语音验证码
     *
     * @param {String} appId 应用ID
     * @param {String} verifyCode 验证码
     * @param {String} to 目的号码
     * @param {Function} cb 回调函数
     * @return {void} 没有返回
     */
    Ucpaas.prototype.voiceCode = function(appId, verifyCode, to, cb) {
        var url = BaseUrl + SoftVersion + '/Accounts/' + accountSid + '/Calls/voiceCode?sig=' + getSigParameter();
        var body_json = {
            voiceCode: {
                appId: appId,
                verifyCode: verifyCode,
                to: to
            }
        };
        var body = JSON.stringify(body_json);
        getResult(url, body, 'POST', cb);
    };

    /**
     * 短信验证码（模板短信）,默认以65个汉字（同65个英文）为一条（可容纳字数受您应用名称占用字符影响），超过长度短信平台将会自动分割为多条发送。分割后的多条短信将按照具体占用条数计费。
     *
     * @param {String} appId 应用ID
     * @param {String} to 目的号码
     * @param {String} templateId 短信模板ID
     * @param {String} param 短信模板参数
     * @param {Function} cb 回调函数
     * @return {void} 没有返回
     */
    Ucpaas.prototype.templateSMS = function(appId, to, templateId, param, cb) {
        var url = BaseUrl + SoftVersion + '/Accounts/' + accountSid + '/Messages/templateSMS?sig=' + getSigParameter();
        var body_json = {
            templateSMS: {
                appId: appId,
                templateId: templateId,
                to: to,
                param: param
            }
        };
        var body = JSON.stringify(body_json);
        getResult(url, body, 'POST', cb);
    };

    /**
     * 双向回拨,云之讯融合通讯开放平台收到请求后，将向两个电话终端发起呼叫，双方接通电话后进行通话。
     *
     * @param {String} appId 应用ID
     * @param {String} fromClient 主叫ClientNumber号码，ClientNumber必须是绑定了主叫正常的电话号码
     * @param {String} to 目的号码
     * @param {String} fromSerNum 主叫侧显示的号码，只能显示400号码或固话。查阅显号规则。
     * @param {String} toSerNum 被叫侧显示的号码。可显示手机号码、400号码或固话。查阅显号规则。
     * @param {Function} cb 回调函数
     * @return {void} 没有返回
     */
    Ucpaas.prototype.callBack = function(appId, fromClient, to, fromSerNum, toSerNum, cb) {
        var url = BaseUrl + SoftVersion + '/Accounts/' + accountSid + '/Calls/callBack?sig=' + getSigParameter();
        var body_json = {
            callback: {
                appId: appId,
                fromClient: fromClient,
                fromSerNum: fromSerNum,
                to: to,
                toSerNum: toSerNum
            }
        };
        var body = JSON.stringify(body_json);
        getResult(url, body, 'POST', cb);
    };

    /**
     * 申请client账号
     *
     * @param {String} appId 应用ID
     * @param {String} clientType 计费方式。0  开发者计费；1 云平台计费。默认为0.
     * @param {String} charge 充值的金额
     * @param {String} friendlyName 昵称
     * @param {String} mobile 手机号码
     * @param {Function} cb 回调函数
     * @return {void} 没有返回
     */
    Ucpaas.prototype.applyClient = function(appId, clientType, charge, friendlyName, mobile, cb) {
        var url = BaseUrl + SoftVersion + '/Accounts/' + accountSid + '/Clients?sig=' + getSigParameter();
        var body_json = {
            client: {
                appId: appId,
                clientType: clientType,
                charge: charge,
                friendlyName: friendlyName,
                mobile: mobile
            }
        };
        var body = JSON.stringify(body_json);
        getResult(url, body, 'POST', cb);
    };

    /**
     * 释放client账号
     *
     * @param {String} clientNumber 客户端账号，由14位数字组成
     * @param {String} appId 应用ID
     * @param {Function} cb 回调函数
     * @return {void} 没有返回
     */
    Ucpaas.prototype.releaseClient = function (clientNumber, appId, cb) {
        var url = BaseUrl + SoftVersion + '/Accounts/' + accountSid + '/dropClient?sig=' + getSigParameter();
        var body_json = {
            client: {
                clientNumber: clientNumber,
                appId: appId
            }
        };
        var body = JSON.stringify(body_json);
        getResult(url, body, 'POST', cb);
    };

    /**
     * 分页获取Client列表
     *
     * @param {String} appId 应用ID
     * @param {String} start 开始的序号，默认从0开始
     * @param {String} limit 一次查询的最大条数，最小是1条，最大是100条
     * @param {Function} cb 回调函数
     * @return {void} 没有返回
     */
    Ucpaas.prototype.getClientList = function (appId, start, limit, cb) {
        var url = BaseUrl + SoftVersion + '/Accounts/' + accountSid + '/clientList?sig=' + getSigParameter();
        var body_json = {
            client: {
                appId: appId,
                start: start,
                limit: limit
            }
        };
        var body = JSON.stringify(body_json);
        getResult(url, body, 'POST', cb);
    };

    /**
     * 以Client账号方式查询Client信息
     *
     * @param {String} appId 应用ID
     * @param {String} clientNumber 客户端账号
     * @param {Function} cb 回调函数
     * @return {void} 没有返回
     */
    Ucpaas.prototype.getClientInfo = function (appId, clientNumber, cb) {
        var url = BaseUrl + SoftVersion + '/Accounts/' + accountSid + '?sig=' + getSigParameter() + '&clientNumber=' + clientNumber + '&appId=' + appId;
        getResult(url, null, 'GET', cb);
    };

    /**
     * 以手机号码方式查询Client信息
     *
     * @param {String} appId 应用ID
     * @param {String} mobile 绑定的手机号码。同一个应用内唯一。
     * @param {Function} cb 回调函数
     * @return {void} 没有返回
     */
    Ucpaas.prototype.getClientInfoByMobile = function (appId, mobile, cb) {
        var url = BaseUrl + SoftVersion + '/Accounts/' + accountSid + '/ClientsByMobile?sig=' + getSigParameter() + '&mobile=' + mobile + '&appId=' + appId;
        getResult(url, null, 'GET', cb);
    };

    /**
     * 应用话单下载,通过HTTPS POST方式提交请求，云之讯融合通讯开放平台收到请求后，返回应用话单下载地址及文件下载检验码。
     *
     * @param {String} appId 应用ID
     * @param {String} date day代表前一天的数据（从00:00 – 23:59）；week代表前一周的数据(周一 到周日)；month表示上一个月的数据（上个月表示当前月减1，如果今天是4月10号，则查询结果是3月份的数据）
     * @param {Function} cb 回调函数
     * @return {void} 没有返回
     */
    Ucpaas.prototype.getBillList = function (appId, date, cb) {
        var url = BaseUrl + SoftVersion + '/Accounts/' + accountSid + '/billList?sig=' + getSigParameter();
        var body_json = {
            appBill: {
                appId: appId,
                date: date
            }
        };
        var body = JSON.stringify(body_json);
        getResult(url, body, 'POST', cb);
    };

    /**
     * Client充值
     *
     * @param {String} appId 应用ID
     * @param {String} clientNumber 客户端账号
     * @param {String} chargeType 0 充值；1 回收。
     * @param {String} charge 充值或回收的金额。
     * @param {Function} cb 回调函数
     * @return {void} 没有返回
     */
    Ucpaas.prototype.chargeClient = function (appId, clientNumber, chargeType, charge, cb) {
        var url = BaseUrl + SoftVersion + '/Accounts/' + accountSid + '/chargeClient?sig=' + getSigParameter();
        var body_json = {
            client: {
                appId: appId,
                clientNumber: clientNumber,
                chargeType: chargeType,
                charge: charge
            }
        };
        var body = JSON.stringify(body_json);
        getResult(url, body, 'POST', cb);
    };

    //导出类
    module.exports = Ucpaas;

}());
