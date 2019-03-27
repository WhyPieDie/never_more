const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const Fs = require('fs');
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
    if(!context.message.text.startsWith(phrase)) {
        return;
    }
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

let trim_commands = (text, entities) => {
    let bot_commands_length = entities.slice(-1)[0].length + 1;
    //remove commands
    return text.substring(bot_commands_length);
}

bot.command(['new', 'add'], async (context, next) => {
    console.log('------> /new handler');
    //remove commands
    let message_text = trim_commands(context.message.text, context.message.entities);
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
    let my_id = context.from.id;
    let phrases = await db.get_phrases_by_id(collection, my_id);
    let response_text = phrases.map((ph, index) => index + ': ' + phrase + ph + '\n').join('');
    context.reply(response_text);
})

bot.command('drop', async context => {
    console.log('------> drop handler');
    let message_text = trim_commands(context.message.text, context.message.entities);
    let re = /@([0-9]*)/;
    let index = (+re.exec(message_text)[1]);
    let collection = await db.populate_collection();
    let my_id = context.from.id;
    let phrases = await db.get_phrases_by_id(collection, my_id);
    if(index < phrases.length) {
        await db.delete_phrases_by_id(collection, my_id, index);
        context.reply('dropped ' + phrases[index]);
    }
    else {
        context.reply('out of range');
    }
})

bot.command('wtf', context => {
    console.log('wtf');
    context.reply('the fuck?');
})

bot.command('pasta', (context) => {
    let file = Fs.readFileSync('./resources/ubludok.txt', 'utf8');
    context.reply(file);
})

let shuffle = (a) => {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

const markup = Markup.inlineKeyboard([
    Markup.callbackButton('stop', 'stop_action'),
    Markup.callbackButton('next', 'next_action')
]).extra();

bot.start(async context => {
    if(bot.state && bot.state.running) {
        context.reply('already started, please /stop me');
    }
    //init
    let collection = await db.populate_collection();
    let phrases = await db.get_phrases(collection);
    phrases = shuffle(phrases);
    bot.state = {running: true, phrases : phrases};
    //get 1st
    if(bot.state.phrases.length === 0) {
        bot.state = {running: false};
        context.reply('no more messages');
        return;        
    }
    bot.state.current = phrase + bot.state.phrases.pop();
    context.telegram.sendMessage(context.chat.id, bot.state.current, markup);
    
});

let next_handler = context => {
    console.log('-----> next handler')
    if(bot.state && bot.state.running) {
        if(bot.state.phrases.length === 0) {
            bot.state = {running: false};
            context.reply('no more messages');
            return;        
        }
        bot.state.current = phrase + bot.state.phrases.pop();
        context.telegram.sendMessage(context.chat.id, bot.state.current, markup);
    }
    else {
        context.reply('/start me please');
    }
}

bot.command('next', next_handler);
bot.action('next_action', next_handler);

let stop_handler = context => {
    console.log('-----> stop handler')
    if(bot.state && bot.state.running) {
        bot.state = {running: false};
        context.reply('stopped');
    }
    else {
        context.reply('why stop me? i wasn\'t running anyway :\'(');
    }
}

bot.command('stop', stop_handler);
bot.action('stop_action', stop_handler);

bot.on('callback_query', context => {
    console.log('-----> callback query');
    let query_data = context.update.callback_query.data;
    if(query_data == '/next_action') {
        return next_handler(context);
    }
    if(query_data == '/stop_action') {
        return stop_handler(context);
    }
})

bot.on('inline_query', context => {
    console.log('-----> inline query');
    console.log(context);
    
})

//let launch = bot.launch((ctx) => ctx.reply('running...'));
bot.startPolling();

module.exports = bot;
