const Telegraf = require('telegraf');
const MongoClient = require('mongodb').MongoClient;
const Fs = require('fs');

const config = require('config.json');
const mongo_connection_string = config.dev.db_connection_string;

bot = new Telegraf(process.env.BOT_TOKEN);

bot.use((context, next) => {
    return next(context)
        .then(context => console.log(context))
});
bot.start(context => context.reply('Шалом!'));

bot.help(context => context.reply('хелпи не буде!'));

const phrase = 'я ніколи не '.toLowerCase();

bot.on('message', context => {
    if(context.message.text.toLowerCase().startsWith(phrase)) {
        let action = context.message.text.substring(phrase.length);
        if(action.length > 0) {
            context.reply('added: ' + action);
        }
    }
});

bot.command('new', context => {
    console.log(context.message.entities);
    let bot_commands_length = context.message.entities.slice(-1)[0].offset;
    let message_text = context.message.text.slice(bot_commands_length);
    console.log(message_text);
    message_text = message_text.toLowerCase();
    if(message_text.startsWith(phrase)) {
        message_text = message_text.substring(phrase.length);
    }
    if(message_text.length > 0) {
        context.reply('new: ' + message_text);
    }
})

bot.command('wtf', context => {
    console.log('wtf');
    context.reply('the fuck?');
})


let launch = bot.launch((ctx) => ctx.reply('running...'));
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
