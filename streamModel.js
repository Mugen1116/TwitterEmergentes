const mng = require ('mongoose');

//Almacena el esquema de los JSON-LD que se introducirán
var streamSchema = new mng.Schema(
  {
    "@type" : String ,
    "name" : String,
    "@identifier" : String,
    "@query" : String,
    "@agent" : {
      "@type" : String,
      "name" : String
    },
    "@startTime" : Date,
    "track" : String
  }
);
var StreamModel = mng.model('Stream', streamSchema);

module.exports = StreamModel;
