const db=require('./myStorage');
const st = require('./myStream');
const _ = require('underscore');
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
//====================================V2=======================================
//Versión compactada con underscore anidado
/*
exports.getHistoTwo = (req, res) => {
  DB.getLastObjects(req.params.name, 50, respuesta =>{
    let lista = respuesta.result;
    let vector = new Array();
    //Spliteamos todas las palabras en una posición de un Array cada una
    for(let i = 0; i < lista.length; i++ ) {
      vector = vector.concat( lista[i].texto
                              .replace(/[!\-,?.":;"\n\(\)\+]/gi, '')
                              .replace(/\s\s+/g, ' ')
                              .replace(/[\.]+$/g, '')
                              .split(' '));
    }
//    let final = _.sortBy(_.countBy(vector)).reverse();
    let final = _.countBy(_.sortBy( vector) );
    res.send({'result': final});
  });
};
*/

//==================================END V2=====================================
//==============================END Histograma=================================
//--------------------------------JSON-LD--------------------------------------

//A partir de un nombre de stream, crea el JSON asociado
function nuevoJSONLD( json ) {

  return {
    "@type" : "SearchAction" ,
    "name" : json.name,
    "@identifier" : json.tweet_id,
    "@query" : "http://localhost:8080/stream/" + json.name,
    "@agent" : {
      "@type" : "Person",
      "name" : json.creator
    },
    "@startTime" : json._dt,
    "@id" : json.track

  };

}





exports.getGraph = (req, res ) => {
  let datasets = DB.getMetaData( meta => {
          //console.log(meta);
          let listaElem = new Array();
          meta.forEach( elem => {
            //Generar JSON-LD de un Stream
            let ld = nuevoJSONLD( elem );
            //Meterlo al Array
            //listaElem += ld;
            listaElem.push( ld );
            console.log(elem);
          });
  });

};

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
//----------------------------------END----------------------------------------
//===============================END GETS======================================
//=================================POSTS=======================================
//=================================POSTS=======================================
exports.postDataset = (req, res) => {
  let body = req.body;
  ST.createStream(body.name , body.track);
  res.send({"result" : "success" });
  setTimeout( _ => DB = new db.myDB('./data'), 1000);
};
//===============================END POSTS=====================================

exports.warmup = DB.events;
