const fs = require("fs");
const rl = require("readline");
const fetch = require("snekfetch");
const sleep = require("sleep-async")().Promise;
const child_process = require("child_process");

try {
    fs.readFileSync("./tokens.txt");
} catch (e) {
    fs.writeFileSync("./tokens.txt", "");
}
tokens = fs.readFileSync("./tokens.txt", "utf8").replace(/\r/g, "").split(/\n/g).filter(token=>token);

async function getUserResponse(question){
    return new Promise((res, rej)=>{
        let i = rl.createInterface(process.stdin, process.stdout, null);
        i.question(question, (answer)=>{
            i.close();
            res(answer);
        });
    });
}

async function check(token){
    return new Promise((res, rej)=>{
        fetch.get("https://discord.com/api/v8/users/@me", {headers:{
            Authorization: token
        }}).then(resp=>{
            res(resp.body.username+"#"+resp.body.discriminator);
        }).catch(e=>{
            if(e.status == 401)rej("Unauthorized.");
            if(e.status == 404)rej("Not found.");
            rej(e.toString());
        });
    });
}

async function joinInvite(token, invite){
    return new Promise((res,rej)=>{
        fetch.post(`https://discord.com/api/v8/invites/${invite}`, {headers:{
            Authorization: token
        }}).then(resp=>{
            res([resp.body.guild.id, resp.body.guild.name]);
        }).catch(e=>{
            if(e.status == 401)rej("Unauthorized.");
            if(e.status == 404)rej("Not found.");
            rej(e.toString());
        })
    })
}

async function friendRequest(token, payload){
    return new Promise((res,rej)=>{
        fetch.post(`https://discord.com/api/v8/users/@me/relationships`, {headers:{
            Authorization: token
        }}).send(payload).then(resp=>{
            res("done.");
        }).catch(e=>{
            if(e.status == 401)rej("Unauthorized.");
            if(e.status == 404)rej("Not found.");
            rej(e.toString());
        });
    })
}

function randomtext(length){
    res = "";
    for(let i = 0; i < length; i++){
        res += String.fromCharCode(Math.floor(Math.random()*13000));
    }
    return res;
}

async function main(){
    console.log(`Welcome to RaidCord. Loaded ${tokens.length} tokens. Type "help" to get help.`);
    while(true){
        let command = await getUserResponse("> ");
        let args = command.split(" ");
        if(args.length < 1)continue;
        if(args[0] == "load"){
            if(args.length != 2){
                console.log("Usage: load <path>.");
                continue;
            }
            let path = args[1];
            let data;
            try {
                data = fs.readFileSync(path, "utf8").replace(/\r/g, "").split(/\n/g).filter(token=>token);
            } catch (e) {
                console.log("Cannot read from specified path.");
                continue;
            }
            tokens = data;
            fs.writeFileSync("./tokens.txt", fs.readFileSync(path, "utf8"));
            console.log(`Loaded ${tokens.length} tokens from ${path}.`);
            continue;
        }
        if(args[0] == "check"){
            console.log(`Checking ${tokens.length} tokens.`);
            let valid = [];
            for (let token in tokens){
                console.log(tokens[token]+":");
                try {
                    let data = await check(tokens[token]);
                    console.log(`Valid. User: ${data}.`);
                    valid.push(tokens[token]);
                }catch(e){
                    if(e == "Unauthorized."){
                        console.log(`Invalid. Reason: invalid credentials.`);
                    }else{
                        console.log(`Invalid: Reason: ${e}.`);
                    }
                }
                await sleep.sleep(1000);
            }
            console.log(`${valid.length}/${tokens.length} valid. Saved them to quickuse. Use "save" to save into file.`);
            tokens = valid;
            continue;
        }
        if(args[0] == "join"){
            if(args.length != 2){
                console.log("Usage: join <invite>.")
                continue;
            }
            let invite = args[1];
            if(invite.startsWith("https://"))invite = invite.slice(8);
            if(invite.startsWith("http://"))invite = invite.slice(7);
            if(invite.startsWith("discord.gg/"))invite = invite.slice(11);
            if(invite.startsWith("discordapp.com/invite/"))invite = invite.slice(22);
            console.log(`Joining invite: ${invite}.`);
            for (let token in tokens){
                console.log(tokens[token]+":");
                try {
                    let data = await joinInvite(tokens[token], invite);
                    console.log(`Joined "${data[1]}". ID: ${data[0]}.`);
                }catch(e){
                    if(e == "Unauthorized."){
                        console.log(`Cannot join. Reason: invalid credentials.`);
                    }else if (e == "Not found."){
                        console.log(`Cannot join. Reason: invite not found.`);
                    }else{
                        console.log(`Cannot join. Reason: ${e}.`);
                    }
                }
                await sleep.sleep(1000);
            }
            continue;
        }
        if(args[0] == "channelspammer" || args[0] == "channelfucker"){
            console.log("Select mode:\n1. Random trash.\n2. Your text.");
            let mode = await getUserResponse("> ");
            let payload;
            if(mode == "1"){
                payload = randomtext(1999);
            }
            if(mode == "2"){
                let chunk = "";
                let result = "";
                console.log("Write text. Line containing '<EOF' - ending.");
                while(chunk != "<EOF"){
                    result += chunk+"\n";
                    chunk = await getUserResponse("> ");
                }
                result = result.split("").slice(1, result.split("").length-1).join("");
                payload = result;
            }
            if(mode != "1" && mode != "2"){
                console.log("Invalid mode. Run command again with valid mode.");
                continue;
            }
            if(!payload){
                console.log("Text is empty. Run command again.");
                continue;
            }
            console.log("Enter channel id:");
            let channelid;
            while(!channelid){
                channelid = await getUserResponse("> ");
            }
            console.log("Message repeat count from every account:");
            let msgcount = await getUserResponse("> ");
            while(!/^\d+$/g.test(msgcount)){
                console.log("Message count is an invalid number.");
                msgcount = await getUserResponse("> ");
            }
            msgcount = Number(msgcount);
            let ended = [];
            let attackid = Date.now().toString(36);
            console.log(`[Attack/${attackid}] Starting.`);
            const attack = async(t,c,n,m)=>{
                for(let i = 0; i < n; i++){
                    try {
                        let resp = await (fetch.post(`https://discord.com/api/v8/channels/${c}/messages`, {headers:{
                            Authorization: t
                        }}).send({content:m}));
                        ended.push(Date.now());
                    }catch(e){ended.push(Date.now());}
                }
            }
            for(let token in tokens){
                attack(tokens[token],channelid,msgcount,payload);
            }
            let ivl = setInterval(()=>{
                if(ended.length == Number(msgcount*tokens.length)){
                    clearInterval(ivl);
                    process.stdout.write(`[Attack/${attackid}] ended.\n> `);
                }
            }, 1000);
            continue;
        }
        if(args[0] == "friendspammer" || args[0] == "friendfucker"){
            if(args.length != 2){
                console.log("Usage: friendspammer <usertag>.");
                continue;
            }
            let username = args[1].split("#")[0];
            let discriminator = Number(args[1].split("#")[1]);
            let payload = {username, discriminator};
            for(let token in tokens){
                console.log(tokens[token]+":");
                try {
                    let data = await friendRequest(tokens[token], payload);
                    console.log(`Sent friend request.`);
                }catch(e){
                    if(e == "Unauthorized."){
                        console.log(`Cannot send. Reason: invalid credentials.`);
                    }else if (e == "Not found."){
                        console.log(`Cannot send. Reason: invite not found.`);
                    }else{
                        console.log(`Cannot send. Reason: ${e}.`);
                    }
                }
                await sleep.sleep(1000);
            }
            continue;
        }
        if(args[0] == "save"){
            fs.writeFileSync("./tokens.txt", tokens.join("\n"));
            console.log("Saved tokens to tokens.txt.");
            continue;
        }
        if(args[0] == "help"){
            console.log(
            "load <path> - load tokens from file.\n"+
            "check - check all loaded tokens.\n"+
            "join <invite> - join invite from tokens.\n"+
            "channelspammer/channelfucker - spam to channel with random ascii or text.\n"+
            "friendspammer/friendfucker <usertag> - spam user with friend requests.\n"+
            "save - save all tokens to tokens.txt file."+
            "help - show this menu.");
            continue;
        }
        console.log(`Unknown command: ${args[0]}. Input "help" to get help.`);
    }
}

main();