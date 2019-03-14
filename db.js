const MongoClient = require('mongodb').MongoClient;

const config = require('./config.json');
const uri = `mongodb+srv://${config.db_user}:${config.db_password}@nevermore0-d6rtm.gcp.mongodb.net`;


//bad design ahead!!
class Db {
    constructor(uri, name, collection) {
        this.client = new MongoClient(uri, {useNewUrlParser : true});
        this.db_name = name;
        this.collection_name = collection;
    }

    async get_collection() {
        return await this.client.connect()
            .then(client => client.db(this.db_name))
            .then(db => db.collection(this.collection_name));
    }

    async populate_collection () {
        let collection = await this.get_collection();
        let count = await collection.countDocuments();
        if(count == 0) {
            let entity = {
                fullData: [],
                phrases: []
            }
            await collection.insertOne(entity);
        }
        return collection;
    }
    
    async insert(collection, entity, message) {
        let coll = await this.populate_collection(collection);
        return coll.findOneAndUpdate({}, {
            $push : {fullData : entity, phrases : message}},
            {returnNewDocument : true});
    }

    async get_phrases(collection) {
        let document = await collection.findOne({});
        return document.phrases;
    }
};

module.exports = Db;

async function example() {
    let db = new Db(uri, config.db_name, config.db_collection);
    
    let coll = await db.populate_collection();
    let doc = await db.insert(coll, {a: 'b'}, 'asdasdasd');

    let phrases = await db.get_phrases(coll);

    console.log(phrases);
    return phrases;
}