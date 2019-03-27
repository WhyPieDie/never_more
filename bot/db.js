const config = require('./config.json');
const MongoClient = require('mongodb').MongoClient;

//bad design ahead!!
class Db {
    constructor(uri, name, collection) {
        this.client = new MongoClient(uri, {useNewUrlParser : true});
        this.db_name = name;
        this.collection_name = collection;
    }

    async unsafe_get_collection() {
        return await this.client.connect()
            .then(client => client.db(this.db_name))
            .then(db => db.collection(this.collection_name));
    }

    async get_collection() {
        return this.populate_collection();
    }

    /* 
    @deprecated; move to get_collection()
    */
    async populate_collection () {
        let collection = await this.unsafe_get_collection();
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

    async get_phrases_by_id(collection, id) {
        let document = await collection.findOne({});
        let phrases = document.fullData.filter(data => data.user.id === id).map(data => data.phrase);
        return phrases;
    }

    async delete_phrases_by_id(collection, id, index) {
        let coll = await this.populate_collection(collection);
        let doc = await coll.findOne({});
        let user_data = doc.fullData.filter(data => data.user.id === id);
        if(index > user_data.length) {
            return false;
        }
        let item = user_data[index];
        let data_index = doc.fullData.findIndex((val) => val.phrase === item.phrase);
        let phrase_index = doc.phrases.findIndex((val) => val === item.phrase);
        doc.fullData.splice(data_index, 1);
        doc.phrases.splice(phrase_index, 1);
        await collection.findOneAndReplace({}, doc);
        return true;
    }
};

module.exports = Db;

async function example() {
    const uri = config.db_uri_template
        .replace('$user', config.db_user)
        .replace('$password', db_password);
    let db = new Db(uri, config.db_name, config.db_collection);
    
    let coll = await db.get_collection();
    let doc = await db.insert(coll, {a: 'b'}, 'asdasdasd');

    let phrases = await db.get_phrases(coll);

    console.log(phrases);
    return phrases;
}