/**
 * Created by PanMin on 2014/10/30.
 */

var request = require('request');
var cheerio = require('cheerio');
/*登录
 * */
var jar1 = request.jar();
function login(ctmName, username, password, callback) {
    //主页
    request({url: 'http://ehire.51job.com/MainLogin.aspx', jar: jar1}, function (err, res, body) {
        var $ = cheerio.load(body);
        var oldAccessKey = $('#hidAccessKey').val();
        //登录页

        request.post({
            url: 'https://ehirelogin.51job.com/Member/UserLogin.aspx',
            method: 'POST',
            followAllRedirects: true,
            jar: jar1,
            headers: {  //请求头的设置
                'referer': 'http://ehire.51job.com/MainLogin.aspx'
            },
            form: {
                ctmName: ctmName,
                userName: username,
                password: password,
                checkCode: '',
                oldAccessKey: oldAccessKey,
                langtype: 'Lang=&Flag=1',
                isRememberMe: false
            }
        }, function (err, res, body) {
            var $ = cheerio.load(body);
            var title = $('#Head1').text().trim();
            console.log(title);
            if (title == "在线用户管理") {
                var urlPathLoginOut = $('#form1').attr('action');
                var loginOutVIEWSTATE = $('#__VIEWSTATE').val();
                request.post({
                    url: 'http://ehire.51job.com/Member/' + urlPathLoginOut,
                    followAllRedirects: true,
                    jar: jar1,
                    headers: {  //请求头的设置
                        'referer': 'http://ehire.51job.com/Member/' + urlPathLoginOut
                    },
                    form: {
                        __EVENTTARGET: 'gvOnLineUser',
                        __EVENTARGUMENT: 'KickOut$0',
                        __VIEWSTATE: loginOutVIEWSTATE
                    }
                }, function (err, res, body) {
                    if (!err && res.statusCode == 200) {
                        console.log(body);
                        return callback(jar1);
                    } else {
                        return callback(null);
                    }
                });
            } else {
                return callback(jar1);
            }
        });
    });
}

/*职位导入*/
function jobExport() {
    request(
        {
            url: 'http://ehire.51job.com/Jobs/JobSearchPost.aspx?IsHis=N", "http://ehire.51job.com/Jobs/JobSearchPost.aspx',
            jar: jar1
        }
        , function (err, res, body) {
            var $ = cheerio.load(body);
            var regEachPageCount = /<strong>\/(.*?)<\/strong>/;
            var jobPage = body.match(regEachPageCount)[1];//总页数
            var jobArray = [];
            for (var i = 0; i < jobPage; i++) {
                if (i != 0) {
                    //目前只有一页
                }

                var reg = /<a href='#' onclick="ShowEditDiv\(this.innerHTML,'(.*?)','(.*?)','(.*?)',event\);return false;" >(.*?)<\/a><\/td>.*?td align='left'>(.*?)<\/td><td align='center'>(.*?)<\/td><td align='center'>(.*?)<\/td><td align='center'>(.*?)<\/td><td align='center'>(.*?)<\/td><td align='center'>(.*?)<\/td>/g;
                var tem;
                while (tem = reg.exec(body)) {
                    //console.log(tem);
                    var job = {};
                    job.link_id = tem[1];//源网站职位ID
                    job.jop_name = tem[4];//职位名称
                    job.city_id = tem[6];//城市
                    job.department = tem[5];
                    job.first_time = tem[7];//首次发布时间
                    job.end_time = tem[9];//结束日期
                    job.start_time = tem[8];//刷新日期
                    job.publish_status = tem[10];

                    job.jobid = tem[1];
                    job.groupid = tem[3];
                    job.flag = tem[2];

                    jobArray.push(job);
                }
                var count = jobArray.length;
                jobArray.forEach(function (job1) {
                    request.post({
                        url: 'http://ehire.51job.com/ajax/Jobs/GlobalCommonAjax.aspx',
                        jar: jar1,
                        form: {
                            doType: 'FillGroupNames',
                            JobId: job1.jobid,
                            GroupId: job1.groupid
                        },
                        headers: {
                            'referer': 'http://ehire.51job.com/Jobs/JobSearchPost.aspx?IsHis=N'
                        }
                    }, function (err, res, body) {
                        request({
                            url: 'http://ehire.51job.com/Jobs/JobEdit.aspx?Mark=Edit&Relation=N&JobId=' + job1.jobid + '&Flag=' + job1.flag,
                            jar: jar1,
                            headers: {
                                'referer': 'http://ehire.51job.com/Jobs/JobSearchPost.aspx?IsHis=N'
                            }
                        }, function (err, res, body) {
                            var $ = cheerio.load(body);
                            //职能类别
                            job1.job_type1_id=$('#FuncType1Text').attr('value');
                            job1.job_type2_id=$('#FuncType2Text').attr('value');
                            //工作地点
                            var regCity=/<span id="spanJobArea.*?">(.*?)<\/span>/;
                            var city=body.match(regCity);
                            if(city) {
                                job1.city_id = body.match(regCity)[1];
                            }
                            //月　　薪
                            job1.salary=$('#ProvideSalary option[selected]').text();
                            //职位性质
                            job1.degree_id=$('#DEGREEFROM').val();
                            //招聘人数
                            job1.invite_nums=$('JOBNUM').val();
                            //工作年限
                            job1.work_years=$('select[name=WORKYEAR] option[selected]').text();
                            //职位描述
                            job1.description=$('#CJOBINFO').text();

                            count--;
                            if (count <= 0) {
                                allData(jobArray)
                            }
                        });
                    });
                });

                var a = 111111111;
            }
        }
    );
}

login('%E4%B8%87%E7%A4%BC%E8%81%9A%E8%AF%9A', 'wljc457', 'abc123', function (j) {
    jobExport();
});
function allData(jobArray) {
    console.log(jobArray);
}