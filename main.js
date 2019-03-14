const Telegraf = require('telegraf');
const Fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const Db = require('./db');

const config = require('./config.json');
const uri = `mongodb+srv://${config.db_user}:${config.db_password}@nevermore0-d6rtm.gcp.mongodb.net`;
const phrase = 'я ніколи не '.toLowerCase();

let create_entity = (ctx, msg) => {
    return {
        'user': ctx.from,
        'chat': ctx.chat,
        'phrase': msg
    };
}

let trim_phrase = (ph) => {
    ph = ph.toLowerCase();
    if(ph.startsWith(phrase)) {
        ph = ph.substring(phrase.length);
    }
    ph = ph.trim();
    return ph;
}

let bot = new Telegraf(config.BOT_TOKEN);
let db = new Db(uri, config.db_name, config.db_collection);

bot.use((context, next) => {
    console.log('----> recieved:');
    console.log(context.tg);
    console.log(context.updateType);
    console.log(context.updateSubTypes);
    console.log(context.message);
    return next(context);
});
bot.start(context => context.reply('Шалом!'));

bot.help(context => context.reply('хелпи не буде!'));



bot.on('message', async (context, next) => {
    if(context.message.entities && context.message.entities.length) {
        if(context.message.entities[0].type == 'bot_command') {
            return next(context);
        }
    }
    if(!context.message.text) {
        return;
    }

    console.log('------> message handler');
    let action = trim_phrase(context.message.text);
    
    if(action.length > 0) {

        context.reply('added: ' + action);
        let entity = create_entity(context, action);
        let col = await db.get_collection();
        let phrases = await db.get_phrases(col);
        if(phrases.indexOf(action) != -1) {
            context.reply('вже є таке!');
            return next(context);
        }
        db.insert(col, entity, action);
        console.log('inserted');
        console.log(entity);
    }
    return next(context);
});

bot.command(['new', 'add'], async (context, next) => {
    console.log('------> /new handler');
    let bot_commands_length = context.message.entities.slice(-1)[0].length + 1;
    //remove commands
    let message_text = context.message.text.substring(bot_commands_length);
    //remove phrase
    message_text = trim_phrase(message_text);

    if(message_text.length > 0) {
        let entity = create_entity(context, message_text);
        let col = await db.populate_collection();
        let phrases = await db.get_phrases(col);
        if(phrases.indexOf(message_text) != -1) {
            context.reply('вже є таке!');
            return next(context);
        }
        db.insert(col, entity, message_text);
        context.reply('added : ' + phrase + message_text);
    }
})

bot.command('all', async context => {
    console.log('------> all handler');
    let collection = await db.populate_collection();
    let phrases = await db.get_phrases(collection);
    console.log(phrases);
    let response_text = phrases.map((ph, index) => index + ': ' + phrase + ph + '\n').join('');
    context.reply(response_text);
})

bot.command('my', async context => {
    console.log('------> my handler');
    let collection = await db.populate_collection();

})

bot.command('wtf', context => {
    console.log('wtf');
    context.reply('the fuck?');
})


//let launch = bot.launch((ctx) => ctx.reply('running...'));
bot.command('stop', (context) => {
    console.log(launch);
    launch.then(() => {
        console.log(context.message.from.id);
        console.log(context.message.chat.id);
        console.log(context);
        process.exit(1)
})})

bot.command('pasta', (context) => {
    let file = Fs.readFileSync('./ubludok.txt', 'utf8');
    context.reply(file);
})

//let launch = bot.launch((ctx) => ctx.reply('running...'));
bot.startPolling();
