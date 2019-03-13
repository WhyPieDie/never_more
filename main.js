const Telegraf = require('telegraf');
const Fs = require('fs');
const MongoClient = require('mongodb').MongoClient;

const config = require('./config.json');
const uri = `mongodb+srv://${config.db_user}:${config.db_password}@nevermore0-d6rtm.gcp.mongodb.net`;

const client = new MongoClient(uri, {useNewUrlParser : true});

let create_entity = (ctx, msg) => {
    return {
        'user': ctx.from,
        'chat': ctx.chat,
        'phrase': msg
    };
}

let collection = (client) => {
    return client.connect()
    .then(client => client.db(config.db_name))
    .then(db => db.collection(config.db_collection))
}

bot = new Telegraf(process.env.BOT_TOKEN);
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

const phrase = 'я ніколи не '.toLowerCase();

bot.on('message', (context, next) => {
    if(context.message.entities && context.message.entities.length) {
        if(context.message.entities[0].type == 'bot_command') {
            return next(context);
        }
    }
    if(!context.message.text) {
        return;
    }

    console.log('------> message handler');
    if(context.message.text.toLowerCase().startsWith(phrase)) {
        let action = context.message.text.substring(phrase.length);
        if(action.length > 0) {

            context.reply('added: ' + action);
            let entity = create_entity(context, action);
            collection(client).then(
                coll => coll.insertOne(entity));
            console.log('inserted');
            console.log(entity);
        }
    }
    return next(context);
});

bot.command(['new', 'add'], context => {
    console.log('------> /new handler');
    let bot_commands_length = context.message.entities.slice(-1)[0].length;
    //remove commands
    let message_text = context.message.text.substring(bot_commands_length);
    //remove phrase
    if(message_text.toLowerCase().startsWith(phrase)) {
        message_text = message_text.substring(phrase.length);
    }

    if(message_text.length > 0) {
        let entity = create_entity(context, message_text);
        collection(client)
            .then(coll => coll.insertOne(entity));
        context.reply('added : ' + phrase + message_text);
    }
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
