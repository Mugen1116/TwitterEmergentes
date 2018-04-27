var $loading = $('#loadingDiv').hide();
var fotosFlick = [];
function creaStream(stream){
   let direccionPostStream = "http://localhost:8080/stream";
   let track = $('#track').val();
   let dataSend = {"name" : stream, "track" : track};
   $('#loadingDiv').show();
   $.ajax({
     type: 'POST',
     url: direccionPostStream,
     dataType: 'json',
     data: dataSend
   })
   .done(function(data){
     setTimeout(_=> {
                      $loading.hide();
                      setTimeout( _=> location.reload(), 1000);
                    }, 7000);
   })
   .fail( function( xhr, textStatus, errorThrown ){
      console.log(xhr.status);
   });
}
//=====================================================================
//=====================================================================
//==============================EVENTS=================================
//=====================================================================
//=====================================================================
$(document).ready(function(){
  $(document)
    .ajaxStart(function () {
      $('#loadingDiv').show();
    });
   //==================ACTUALIZAR STREAMS=========================
   var lbuttons  = [];
   let direccionstreams =  "http://localhost:8080/streams/counts";
   $.ajax({
     type: 'GET',
     url: direccionstreams,
     dataType: 'json'
   })
   .done(function(data){
     lbuttons = data.result;
     $("#streamlist").append("<button id='NEW' width='1%'><b>+</b></button>");
     $.each(lbuttons,function(dataset, num){
      addButton(dataset, num);
     });
     //event for button stream class
     $(".stream").click(function(){
       actionButton(this);
     });
     //event for button "NEW"
     $("#NEW").click(function(){
     //make visible the form
        $("#form-container").css({"width":"910px","height":"50px","visibility":"visible"});
        newdata=$("#name").val("");
     });
     //event for form button
     $("#create").click(function(){
       //hide the form
       $("#form-container").css({"visibility":"hidden"});
       //HACER LLAMADA AJAX POST PARA CREAR STREAM
       newdata=$("#name").val();
       creaStream(newdata);
      //create new button for new stream
       addButton(newdata, 0);
     });

     $('#loadingDiv').hide();

   })
   .fail(function(){
   });
   //================END ACTUALIZAR STREAMS========================
   //button for creating new streams
});

function addButton(data, numero){
  if (data.length>0){
  newbutton="<button class='stream' id="+data+">"+data+ " ( "+ numero +" )"+"</button>";
  $(newbutton).insertAfter($("#NEW")).click(function(){actionButton(this);});
  };
};

function actionButton(data){
    streamname=data.getAttribute("id");
    //Cambiar por la llamada correspondiente al servicio REST
    //==============NUBE DE PALABRAS=========================
    let direccioncloud = "http://localhost:8080/stream/" + streamname + "/words?top=20";
    var lwords = [] ;
    var words = null;
      $.ajax({
        type: 'GET',
        url: direccioncloud,
        dataType: 'json'
      })
      .done(function(data){
        if( data.result != "Error, no hay objetos en el dataset")  {
          words = data.result;
          lwords.push([streamname,30]);
          words.forEach( function ( elem ){
            lwords.push( [elem.word, elem.ocurrences]);
          });
        }
        else {
          lwords.push(["Error" , 40]);
          lwords.push(["Este Stream no tiene tweets asociados", 20]);
        }
        update_cloud(lwords);

      })
      .fail(function(){
        lwords.push( ["error" , 40]);
        lwords.push( ["Stream no Encontrado", 20]);
        lwords.push([streamname,40]);
        update_cloud(lwords);
      });
    //==============END NUBE DE PALABRAS======================
    //=====================POLARIDAD==========================
    //Cambiar por la llamada correspondiente al servicio REST
    let direccionpolar = "http://localhost:8080/stream/" + streamname + "/polarity";
    $.ajax({
      type: 'GET',
      url: direccionpolar,
      dataType: 'json'
    })
    .done(function(data){
      let total = data.result.positive + data.result.negative;
      let pos = data.result.positive / total;
      let neg = data.result.negative / total;
      polarity = { "positive":pos, "negative":neg };
      update_polar(polarity);
    })
    .fail(function(){
      polarity={ "positive":0.5 , "negative":0.5 };
      update_polar(polarity);
    });
    //===================END POLARIDAD=========================
    //=======================GEOMAPA===========================
    let direccionmapa = "http://localhost:8080/stream/" + streamname + "/geo";
      $.ajax({
        type: 'GET',
        url: direccionmapa,
        dataType: 'json'
      })
      .done(function(data){
        //=============DONE============
        let mapa = data.result;
        let labels = Object.keys(mapa);
        let coordenadas = Object.values(mapa);
        let geoPos = [];
        $('#loadingDiv').show();
        update_map(coordenadas);
        //==========END DONE============
      })
      .fail(function(){
        let geoPos = { error: [0,0] };
        update_map( geoPos );
      });
    //=====================END GEOMAPA==========================
    //========================FLICKR============================
    let direccionFotos = "http://localhost:8080/stream/" + streamname + "/words?top=3";
    let palabrasFlickr = [];
    $.ajax({
      type: 'GET',
      url: direccionFotos,
      dataType: 'json'
    })
    .done( function(data) {
        let palabras = data.result;
          palabras.forEach( function(item) {
          palabrasFlickr.push(item.word );
        });

      update_pictures( palabrasFlickr );
    })
    .fail( function(){});
    //======================END FLICKR==========================
    //========================GET TUITS=========================
    let direccionTuits = "http://localhost:8080/stream/" + streamname + "?limit=5";
    $.ajax({
      type: 'GET',
      url: direccionTuits,
      dataType: 'json'
    })
    .done( function(data) {
      update_tweets( data.result );
    })
    .fail(function(){});
    //=====================END GET TUITS========================
    //Al acabar todas las acciones actualizamos los numeros de los STREAMS
    update_buttons();
};

//=====================================================================
//=====================================================================
//=============================UPDATES=================================
//=====================================================================
//=====================================================================

function update_polar(data){
    var canvas=document.getElementById("polarity");
    var contexto=canvas.getContext("2d");
    //limpia canvas
    contexto.clearRect(0, 0, canvas.width, canvas.height);
    contexto.fillStyle="green";
    contexto.lineWidth=2;
    contexto.beginPath();
    contexto.rect(0,0,canvas.width,canvas.height*data["positive"],true)
    contexto.fill();
    contexto.fillStyle="red";
    contexto.lineWidth=2;
    contexto.beginPath();
    contexto.rect(0,canvas.height*data["positive"],canvas.width,canvas.height,true)
    contexto.fill();
    contexto.font = "20px Courier";
    contexto.fillStyle="black";
    contexto.fillText("Polaridad",20,20);
};

function update_map(data){
  $('#loadingDiv').show();
    var mapProp = {
      center:new google.maps.LatLng(0,0),
      zoom:1,
      mapTypeId:google.maps.MapTypeId.ROADMAP
    };
    var map=new google.maps.Map(document.getElementById("mapcanvas"),mapProp);

    $.each(data,function(key,pos){
      let titulo = "" + key;
      mark=new google.maps.LatLng(pos.latitud ,pos.longitud);
      var marker=new google.maps.Marker({position:mark, title:titulo});
      marker.setMap(map);
    });
    google.maps.event.addDomListener(window, 'load', update_map);
    $('#loadingDiv').hide();

};

//Funcion auxiliar, añade la primer foto relacionada con label
function anyade_foto(label) {
  var flickerAPI = "https://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?";
  $.getJSON( flickerAPI, {
    tags:label,
    tagmode: "any",
    format: "json"
  }).done(function(data){
      let foto = data.items[0].media.m;
      if( fotosFlick.length === 3 ){ return; }
      else{
        $( "<img>" ).attr( "src", foto ).attr("height","145").appendTo( "#fotos" );
        fotosFlick.push( foto );
      }
  });
}

function update_pictures(labels){
  //En caso de que exista un tuit de 2 palabras o menos
  if(labels != null ){
    let n = (labels.length <= 3) ? labels.length : 3 ;
    $("#fotos").empty();
    for ( let i = 0; i <= n ; i++){
        anyade_foto( labels[i] );
    }
    $("#fotos").empty();
  }
  fotosFlick = [];
}

function update_cloud(data){
  options= { list : data };
  WordCloud(document.getElementById('wordcloud'), options);
};

function update_tweets(data){
  $("#tweets").empty();
  if ( data.length === 0 ){
    $('#tweets').html( "<b>No hay tweets relacionados</b>.")
  }
  else {
    data.forEach( function ( id , index){
      let tuit = "Tweet" + (index+1);
      let ref = "https://twitter.com/statuses/" + id;
      $( "<a>" ).attr( "href", ref ).attr("target","_blank").text(tuit).appendTo( "#tweets" );
      $("<span>").text(" ").appendTo('#tweets');
    });
  }
}

function update_buttons( ) {
  $('#loadingDiv').show();
  let direccionstreams =  "http://localhost:8080/streams/counts";
  $.ajax({
    type: 'GET',
    url: direccionstreams,
    dataType: 'json'
  })
  .done( function( data ){
    let streams = data.result;
    let nodos = $('#streamlist')[0].childNodes;
    nodos.forEach( function( nodo ) {
        //Para cada botón, actualizamos su texto, con el nuevo dato
        let textoOld = nodo.textContent.split(' ')[0];
        let textoNuevo = textoOld + " ( " + streams[textoOld] + " )";
        if ( textoOld != '+' && streams[textoOld] != null ){
          nodo.textContent  = textoNuevo;
        }
    });
  });
}
