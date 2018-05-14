const db=require('./myStorage');
const st = require('./myStream');
//const warm = require('./warmupdb');
const _ = require('underscore');
const mng = require ('mongoose');
const my_conn_data = "mongodb://twitterUser:twitterEmergentes@localhost:27017/twitter";
const StreamModel = require('./streamModel');
// const ItemModel = mng.model('Item', warm.itemSchema);
let DB = new db.myDB('./data');
let ST = new st.StreamManager();

//================================GETS=========================================
//================================GETS=========================================
exports.sendStatic    = (req,res) => res.sendFile("public/index.html",{root:application_root});

exports.sendDatasets  = (req,res) => {
                                      res.send({result: DB.getDatasets()});
                                      DB = new db.myDB('./data');
                                      };

exports.sendCounts    = (req,res) => {
                                    res.send({ result : DB.getCounts() });
                                    DB = new db.myDB('./data');
                                    };

exports.sendLastPosts = (req,res) => {
    let n = (req.query.n == null) ? 10 : parseInt(req.query.n);
    DB.getLastObjects(req.params.name,n,data => res.send(data));
};

//pon aqui tus funciones adicionales!
exports.sendPolaridad = (req,res) => {
	DB.getLastObjects(req.params.name, 100, respuesta => {
		let positivo = 0
		let negativo = 0
		let neutral = 0
		respuesta = respuesta.result;
    if( respuesta != null ) {

  		for(let i = 0; i < respuesta.length; i++){
  			if (respuesta[i].polaridad > 0)
  				positivo++
  			else if (respuesta[i].polaridad == 0)
  				neutral++
  			else
  				negativo++
  		}
  		let json = {
  			'positive': positivo,
  			'negative': negativo,
  			'neutral': neutral,
  		}
  		res.send({'result':json});
    }
    else{
      res.send({'result' : "Error, no hay objetos en el dataset"});
    }
	});
  DB = new db.myDB('./data');
};
exports.getListaIdStr = (req, res ) => {
  DB.getLastObjects(req.params.name, 10000, respuesta => {
    respuesta = respuesta.result;
    let n = (req.query.limit == null ) ? 10 : parseInt(req.query.limit);
    DB = new db.myDB('./data');
    //console.log(respuesta);
    if( respuesta != null )
      res.send({'result':respuesta.slice(0,n).map(x=>x.tweet_id)});
    else
      res.send({'result': "error"});

  });

};
exports.getGeo = (req, res) => {
  DB.getLastObjects(req.params.name, 10000, respuesta =>{
    let lista = respuesta.result;
    if (lista != null ) {
      let salida = {};
      for (let i = 0 ; i < lista.length; i++) {
        if ( lista[i].coordinates!= null ){
          let coordenadas = lista[i].coordinates;
          let coor = {'latitud':coordenadas[0] , 'longitud':coordenadas[1]};
          salida[lista[i].tweet_id] =  coor;
        }
      }
      DB = new db.myDB('./data');
      res.send({'result':salida});
    }
    else{
      res.send({'result' : "Error, no hay objetos en el dataset"});
    }
  });
};
//==============================Start Histograma===============================
//====================================V1=======================================
exports.getHistograma =(req, res) => {
  //Recogemos los últimos 50 tweets
  DB.getLastObjects( req.params.name, 50, respuesta => {
    let lista = respuesta.result;

    if( lista != null) {
      let vector = new Array();
      let texto = "";
      //Concatenamos los 50 últimos tuits en un solo string, y salvamos los espacios para dejar uno solo entre palabras
      //También quitamos signos de puntuación para intentar salvar únicamente todas las palabras posibles
      for ( let i = 0 ; i < lista.length ; i++ ) {
      if ( lista[i] != null )
        vector += lista[i].texto.replace(/[!\-,?.":;"\n\(\)\+]/gi, '')
                                .replace(/\s\s+/g, ' ')
                                .replace(/[\.]+$/g, '') ;
      }
      //Spliteamos el string grande, por espacios
      let split = vector.split(" ");
      //Ahora si, contamos todas las palabras
      //E invertimos el orden para tener de más a menos ocurrencia
      let contado = _.chain(split)
                 .without('de', 'que' ,'y', 'se', 'q', 'k',
                              'a', 'en', 'el', 'la',
                              'un', 'una', 'del', 'o',
                              'los', 'las', 'es', 'al' ,
                              'con', 'no', 'si', 'i', 'dels' ,'sin',
                              'I', 'Y', 'me', 'the', 'amb')//Eliminamos palabras de uso muy frecuente para que solo se muestren las relevantes
                 .groupBy( function(word) { return word;} )
                 .sortBy(  function(word){ return word.length; } )
                 .value()
                 .reverse();
      //Ahora vamos a crear el JSON con las palabras y las ocurrencias de cada una
      let final = new Array();
      //let final = {};
      contado.forEach( function(valor, indice, array) {
        final.push( { 'word': valor[0] , 'ocurrences': valor.length})
      });
      //Y nos quedamos con los TOP primeros
      let ordenado = final.slice(0, req.query.top);
      res.send({'result': ordenado});
    }
    else{
      res.send({'result' : "Error, no hay objetos en el dataset"});
    }
  });
};
//==================================END V1=====================================
//==============================END Histograma=================================
//--------------------------------JSON-LD--------------------------------------
//A partir de un nombre de stream, crea el JSON asociado
/*
* *
{
  "@context": "http://schema.org",
  "@type" : "SearchAction",
  "@identifier" : id,
  "@query" : "",
  "@agent" {
    "@type" : "Person",
    "name" : "Sergio"
  },
  "@startTime" : dt,
  "@id" : track
}
* *
*/
//Ya no se usa
function nuevoJSONLD( json ) {
  return {
    "@type" : "SearchAction" ,
    "name" : json.name,
    "@identifier" : json.name,
    "@query" : "http://localhost:8080/stream/" + json.name,
    "@agent" : {
      "@type" : "Person",
      "name" : json.creator
    },
    "@startTime" : json._dt,
    "track" : json.track
  };
}
function postJSONLD (name, track){
  return {
      "@type" : "SearchAction" ,
      "name" : name,
      "@identifier" : name,
      "@query" : "http://localhost:8080/stream/" + name,
      "@agent" : {
        "@type" : "Person",
        "name" : "Mugen"
      },
      "@startTime" : Date(),
      "track" : track
  };
}
exports.getGraph = (req, res ) => {
  let datasets = DB.getMetaData( meta => {
          //console.log(meta);
          let listaElem = new Array();
          meta.forEach( elem => {
            //Generar JSON-LD de un Stream
            //let ld = nuevoJSONLD( elem );
            let ld = elem;
            //Meterlo al Array
            listaElem.push( ld );
            //console.log(elem);
          });
          res.send({
            "@context": "http://schema.org/",
            "@graph" : listaElem
          });
  });
};
exports.getGraphMongo = (req, res ) => {
  mng.connect(my_conn_data);
  StreamModel.find( {} , (err, datos) => {
      //Imprescincible que el close se haga dentro, si no, fallará
      //Porque se cierra antes de ejecutar la consulta
      res.send({
        "@context" : "http://schema.org/",
        "@graph" : datos
      });
      mng.connection.close();
    }
  );
}
//----------------------------------END----------------------------------------
//===============================END GETS======================================
//=================================POSTS=======================================
//=================================POSTS=======================================
exports.postDataset = (req, res) => {
  let body = req.body;
  //Crear JSON-LD
  let ld = postJSONLD(body.name, body.track);
  ST.createStream(body.name , ld);
  //ST.createStream(body.name , body.track);
  res.send({"result" : "success" });
  setTimeout( _ => DB = new db.myDB('./data'), 1000);
};
//====================AÑADIMOS EL POST A LA BD DE MONGODB======================
exports.postDatasetMongo = (req, res ) => {
  let body = req.body;
  //Crear JSON-LD
  let ld = postJSONLD(body.name, body.track);
  ST.createStream(body.name , ld);
  //Ahora añadimos a Mongo
  mng.connect(my_conn_data);

  let pruebaInsert = new StreamModel( ld );
  pruebaInsert.save(function(err){
    if (err) throw err;
    mng.connection.close();
  });
  res.send({"result" : "success" });
  setTimeout( _ => DB = new db.myDB('./data'), 1000);
};
//===============================END POSTS=====================================

exports.warmup = DB.events;
