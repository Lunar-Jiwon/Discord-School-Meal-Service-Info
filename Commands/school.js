const api_key = "7fb7fed3bdb04743a08c1308ff18ced1";
const OOE = {"서울특별시교육청":"B10","부산광역시교육청":"C10","대구광역시교육청":"D10","인천광역시교육청":"E10","광주광역시교육청":"F10","대전광역시교육청":"G10","울산광역시교육청":"H10","세종특별차지시교육청":"I10"
,"경기도교육청":"J10","강원도교육청":"K10","충청북도교육청":"M10","충청남도교육청":"N10","전라북도교육청":"P10","전라남도교육청":"Q10","경상북도교육청":"R10","경상남도교육청":"S10","제주특별자치도교육청":"T10"};
const {prefix} = require('../config.json');
const request = require('request');
const discord = require('discord.js');
const user_school_info = new discord.Collection();
const {green, red} = {green:"#34eb74",red:"#eb4034"}
module.exports = {
    name: "학교",
    async execute(message,args){
        if(!user_school_info.has(message.author.id)){
            user_school_info.set(message.author.id, new discord.Collection().set("user_school_info",{school_name:"none",ooe:"none",school_id:"none",sch_grade:"none",sch_class:"none"}))
        }
        
        async function getschool(office_of_education,school){
            for(i in OOE){
                if(i == office_of_education){
                    return new Promise((resolve,reject) => {
                        request.get({url:`https://open.neis.go.kr/hub/schoolInfo?Type=json&pSize=999`,method:"GET",qs:{key:api_key,SCHUL_NM:school,ATPT_OFCDC_SC_CODE:OOE[i]}},function(error,res,body){
                            if(!error){
                                resolve(body)
                            }else reject(error);
                        })  
                    })
                }
            }
            return message.reply(new discord.MessageEmbed().setTitle("오류").setDescription("일치하는 교육청이 없습니다").setColor(red))
        }
        async function getclass(school_id,grade,ofcdccode){
            return new Promise((resolve,reject) => {
                request.get({url:`https://open.neis.go.kr/hub/classInfo?Type=json&pSize=999`,method:"GET",qs:{key:api_key,ATPT_OFCDC_SC_CODE:ofcdccode,SD_SCHUL_CODE:school_id,AY:new Date().getFullYear(),GRADE:grade}},function(error,res,body){
                    if(!error){
                        resolve(body)
                    }else reject(error);
                })  
            })
        }
        async function getlunch(school_id,ofcdccode){
            var date = new Date();
            return new Promise((resolve,reject) => {
                request.get({url:`https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pSize=999`,method:"GET",qs:{key:api_key,ATPT_OFCDC_SC_CODE:ofcdccode,SD_SCHUL_CODE:school_id,MLSV_YMD:`${date.getFullYear()}${date.getMonth()}${date.getDay()}`}},function(error,res,body){
                    if(!error){
                        resolve(body);
                    }else reject(error);
                })  
            })
        }
        switch(args[0]){
            case "급식정보":
                if(user_school_info.get(message.author.id).get("user_school_info").school_id == "none") return message.reply(new discord.MessageEmbed().setTitle("급식정보 오류").setDescription(`등록 된 학교소속정보가 없습니다\n${prefix}학교소속등록 <시도교육청이름> <학교이름> <학년반(0102/1학년2반)>`).setColor(red));
                var info = user_school_info.get(message.author.id).get("user_school_info");
                var lunch = JSON.parse(await getlunch(info.school_id,info.ooe));
                if(lunch.RESULT != undefined) return message.reply(new discord.MessageEmbed().setTitle("오늘 급식정보").setDescription("급식정보가 없습니다.").setColor(red))
                message.reply(new discord.MessageEmbed().setTitle("오늘 급식정보").setDescription(lunch.mealServiceDietInfo[1].row[0].DDISH_NM.replace(/<br\/>/gi,"\n").replace(/[0-9.]/gi,"")).setColor(green))
                break;
            case "소속등록":
                message.reply("본 명령어를 본인의 소속학교를 입력받아 저장하는 명령어이며 개인정보(명령어를 사용한 사용자의 학교정보)가 수집됨을 알려드립니다");
                var school = JSON.parse(await getschool(args[1],args[2]));
                var class_number,grade;
                grade = args[3].split("")[1];
                if(args[3].split("")[2] != ""){
                    class_number = `${args[3].split("")[2]}${args[3].split("")[3]}`
                } class_number = args[3].split("")[3];
                var school_class = JSON.parse(await getclass(school.schoolInfo[1].row[0].SD_SCHUL_CODE,grade,school.schoolInfo[1].row[0].ATPT_OFCDC_SC_CODE));
                if(school_class.RESULT != undefined) return message.reply(new discord.MessageEmbed().setTitle("학교소속등록 오류").setDescription("입력한 반 정보와 일치하는 반이 없습니다").setColor(red))
                if(school_class.classInfo[1].row.length - 1 < class_number) return message.reply(new discord.MessageEmbed().setTitle("학교소속등록 오류").setDescription("입력한 반 정보와 일치하는 반이 없습니다").setColor(red))
                user_school_info.get(message.author.id).set("user_school_info",{school_name:school.schoolInfo[1].row[0].SCHUL_NM,ooe:school.schoolInfo[1].row[0].ATPT_OFCDC_SC_CODE,school_id:school.schoolInfo[1].row[0].SD_SCHUL_CODE,sch_grade:grade,sch_class:class_number});
                message.reply(new discord.MessageEmbed().setTitle("학교소속등록 완료").setDescription(`<@${message.author.id}>님의 소속학교 정보`).addFields({name:"소속학교 이름",value:school.schoolInfo[1].row[0].SCHUL_NM},{name:"소속학교 학년",value:`${grade}학년`},{name:"소속학교 반",value:`${class_number}반`}).setColor(green))
                break;
            case "소속정보":
                if(user_school_info.get(message.author.id).get("user_school_info").school_id == "none") return message.reply(new discord.MessageEmbed().setTitle("소속정보 오류").setDescription(`등록 된 학교소속정보가 없습니다\n${prefix}학교소속등록 <시도교육청이름> <학교이름> <학년반(0102/1학년2반)>`).setColor(red));
                var info = user_school_info.get(message.author.id).get("user_school_info")
                message.reply(new discord.MessageEmbed().setTitle("학교소속정보").setDescription(`<@${message.author.id}>님의 소속학교 정보`).addFields({name:"소속학교 이름",value:info.school_name},{name:"소속학교 학년",value:`${info.sch_grade}학년`},{name:"소속학교 반",value:`${info.sch_class}반`}).setColor(green))
                break;
            default:
                
                message.reply(`올바른 명령어를 입력해주세요\n명령어 입력 양식 : ${prefix}학교 <급식정보/소속등록> <학교소속등록:시도교육청이름> <학교소속등록:학교이름> <학교소속등록:학년반번호(0102/1학년2반)`);
                break;
        }
    }
}
