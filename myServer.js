const application_root=__dirname,
    express = require("express"),
    path = require("path"),
    bodyparser=require("body-parser");

const ctrl = require('./controllers');

var app = express();
app.use(express.static(path.join(application_root,"public")));
app.use(bodyparser.urlencoded({extended:true}));
app.use(bodyparser.json());

//Cross-domain headers
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//====================GET============================
app.get('/',ctrl.sendStatic);
app.get('/streams',ctrl.sendDatasets);
app.get('/streams/counts', ctrl.sendCounts);
// GRAFO JSON-LD
app.get('/stream/graph', ctrl.getGraph);
app.get('/stream/mongo/graph', ctrl.getGraphMongo);

//Para evitar conflictos colocamos primero el /stream/graph
//Asi evitamos que se confunda con el nombre de un dataset
app.get('/stream/:name',ctrl.getListaIdStr);
app.get('/stream/:name/polarity',ctrl.sendPolaridad);
app.get('/stream/:name/words', ctrl.getHistograma);
//app.get('/dataset/:name/wordstwo', ctrl.getHistoTwo);
app.get('/stream/:name/geo', ctrl.getGeo);
//==================END GET==========================
//===================POST============================
app.post('/stream', ctrl.postDatasetMongo);
//==================END POST=========================

ctrl.warmup.once("warmup", _ => {
   console.log("Web server running on port 1616");
   app.listen(1616, function() {
     console.log("Arrancado en el puerto 1616");
   });
});
