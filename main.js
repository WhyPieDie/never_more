const Telegraf = require('telegraf');

bot = new Telegraf(process.env.BOT_TOKEN);

//bot.use((context, next) => {console.log(context); return next(context)});
bot.start(context => context.reply('Хей хо!'));

bot.help(context => context.reply('хелпи не буде'));


bot.on('message', (context, next) => {
    return next(context).then(() => {
    context.reply(context.message.text + 'asdasd');
})
});

bot.command('new', (context, next) => {
    return next(context).then(() => {
    console.log(context.message.entities);
    let bot_commands_length = context.message.entities.slice(-1)[0].offset;
    console.log(bot_commands_length);
    let message_text = context.message.text.slice(bot_commands_length);
    console.log(message_text);
    context.reply('really? ' + message_text);
    });
})

bot.command('wtf', context => {
    console.log('wtf');
    context.reply('the fuck?');
})


let launch = bot.launch((ctx) => ctx.reply('asdasdasdasda'));
bot.command('stop', (context) => {
    console.log(launch);
    launch.then(() => {
        console.log(context.message.from.id);
        console.log(context.message.chat.id);
        console.log(context);
        process.exit(1)
})})
