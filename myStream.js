const Twitter = require('twitter');
const myCreds = require('./credentials/my-credential.json');
const db = require('./myStorage');
const util = require('util');

const client = new Twitter(myCreds);
const sentiment = require('sentiment-spanish');


class StreamManager {
	constructor() {
		this.streams = {}; //clave es el nombre y el valor del objeto stream
		this.DB = new db.myDB('./data');
	}

	/*
	createStream(name, track) {
		let stream = client.stream('statuses/filter', {track: track});

		this.streams[name] = stream;

		this.DB.createDataset(name, {'creator': 'mugen', name:name, track:track});

		stream.on('data', tweet => {
			if (tweet.lang == "es" || tweet.user.lang == "es" ) {
				this.DB.insertObject(name,{	"tweet_id":tweet.id_str,
				 														"texto":tweet.text,
																		"coordinates":tweet.coordinates,
																		"polaridad":sentiment(tweet.text).score});


			}
		});
		setTimeout( _=> this.destroyStream(name), 50000);
		stream.on('error', err => console.log(err));

	}
	*///create

	//====================CREATE 2.0===========================
	createStream(name, jsonld) {
		let stream = client.stream('statuses/filter', {track: jsonld.track} );

		this.streams[name] = stream;

		this.DB.createDataset(name, jsonld);

		stream.on('data', tweet => {
			if (tweet.lang == "es" || tweet.user.lang == "es" ) {
				this.DB.insertObject(name,{	"tweet_id":tweet.id_str,
				 														"texto":tweet.text,
																		"coordinates":tweet.coordinates,
																		"polaridad":sentiment(tweet.text).score});


			}
		});
		setTimeout( _=> this.destroyStream(name), 50000);
		stream.on('error', err => console.log(err));

	}
	//==================END CREATE 2.0=========================

	destroyStream(name){
    this.streams[name].destroy();
    delete this.streams[name];
  }
}
exports.StreamManager = StreamManager;
