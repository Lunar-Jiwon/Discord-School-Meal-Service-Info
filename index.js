
const Discord = require('discord.js') // 디스코드 모듈을 선언
const client = new Discord.Client() // 클라이언트를 선언
const {prefix, token} = require('./config.json') // 접두사와 토큰을 선언
const fs = require('fs') // 파일 시스템 선언

client.commands = new Discord.Collection() // client의 commands는 디스코드의 컬렉션으로 선언

const cooldonws = new Discord.Collection()

const commandFiles = fs.readdirSync('./Commands').filter(file => file.endsWith('.js')) // 커맨드 폴더에서 확장명이 .js 인것만 가져온다
for(const file of commandFiles){
    const command = require(`./Commands/${file}`) // 커맨드 폴더와 폴더에 있는 파일들을 불러온다
    client.commands.set(command.name,command) // 클라이언트에 commands 항목에 command.name과 command를 지정한다
}

client.on('ready', ()=>{
    console.log("봇이 준비되었습니다") // 봇이 준비되면 콘솔에 봇이 준비 되었습니다 출력
})

client.on('message',msg=>{
    if(!msg.content.startsWith(prefix) || msg.author.bot) return
    const args = msg.content.slice(prefix.length).trim().split(/ +/) // 명령어 뒤에있는 인수들을 가져온다
    const commandName = args.shift() // 명령어의 이름을 가져온다
    const command = client.commands.get(commandName)
    if(!command) return
    if(!cooldonws.has(command.name)){
        cooldonws.set(command.name,new Discord.Collection())
    }
    const now = Date.now()
    const timestamps = cooldonws.get(command.name)
    const cooldownAmount = (command.cooldown || 3)*1000
    if(timestamps.has(msg.author.id)){
        const expirationTime = timestamps.get(msg.author.id) + cooldownAmount
        if(now < expirationTime){
            const timeLeft = (expirationTime - now) / 1000
            return msg.reply(`${command.name} 해당 명령어를 사용하기 위해서는 ${timeLeft.toFixed(1)}초를 더 기다리셔야 합니다.`)
        }
    }
    timestamps.set(msg.author.id,now)
    setTimeout(()=> timestamps.delete(msg.author.id),cooldownAmount)
    try{
        command.execute(msg,args) // 커맨드의 execute에서 msg변수와 args변수를 보낸다
    }catch(error){ // 예외가 발생한 경우
        console.log(error) // 예외가 발생하면 오류를 가져와서 콘솔로 출력해서 예외처리를 한다.
    }
})

client.login(token) // 토큰을 가져온다
